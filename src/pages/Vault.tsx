import { useState, type ReactElement } from 'react';
import { Card, Badge, Button, CredentialField } from '../components/ui';
import {
  ShieldCheck, Search, Lock, RefreshCw, ShieldAlert,
  CreditCard, FolderOpen, Key
} from 'lucide-react';
import { useSystemState } from '../hooks/useSystemState';
import { useAuth } from '../auth/AuthContext';
import { toApiError } from '../api/client';
import { useRevealSecretMutation, useVaultQuery } from '../api/queries/vault';
import type { EncryptedValue } from '../api/vault';

type VaultSection = 'all' | 'accounts' | 'hardware' | 'tools' | 'subscriptions' | 'projects';
type VaultItem = {
  id: string;
  name: string;
  source: string;
  email: string;
  creds: Record<string, unknown>;
  type: string;
  has2FA: boolean;
  section: VaultSection;
  url?: unknown;
  notes?: unknown;
};

export const Vault = ({ state }: { state: ReturnType<typeof useSystemState> }) => {
  void state;
  const { can } = useAuth();
  const vaultQuery = useVaultQuery();
  const revealMutation = useRevealSecretMutation();
  const [searchTerm, setSearchTerm] = useState('');
  const [section, setSection] = useState<VaultSection>('all');
  const [revealedValues, setRevealedValues] = useState<Record<string, string>>({});
  const [revealingItemId, setRevealingItemId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Array<{ id: string; type: 'success' | 'error'; message: string }>>([]);

  const canReveal = can('vault.reveal_passwords');

  const pushToast = (type: 'success' | 'error', message: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
    }, 3000);
  };

  const vault = vaultQuery.data ?? {
    accounts: [],
    hardware: [],
    tools: [],
    subscriptions: [],
    projects: [],
  };

  const isEncryptedValue = (value: unknown): value is EncryptedValue => {
    if (!value || typeof value !== 'object') return false;
    const candidate = value as Record<string, unknown>;
    return (
      typeof candidate.iv === 'string' &&
      typeof candidate.tag === 'string' &&
      typeof candidate.ciphertext === 'string'
    );
  };

  const allCredentials: VaultItem[] = [
    ...vault.accounts.map((a) => ({
      id: `acc-${String(a.id)}`, name: String(a.name ?? ''), source: 'Central Account',
      email: String(a.email ?? ''), creds: (a.credentials as Record<string, unknown>) ?? {}, type: String(a.type ?? ''),
      has2FA: !!(a.credentials as Record<string, unknown> | undefined)?.twoFactor, section: 'accounts' as VaultSection,
    })),
    ...vault.hardware.filter((h) => !!h.credentials).map((h) => ({
      id: `hw-${String(h.id)}`, name: String(h.name ?? ''), source: 'Hardware',
      email: 'Device Access', creds: h.credentials as Record<string, unknown>, type: 'Local',
      has2FA: false, section: 'hardware' as VaultSection,
    })),
    ...vault.tools.filter((t) => !!t.credentials).map((t) => ({
      id: `tool-${String(t.id)}`, name: String(t.name ?? ''), source: 'Software Tool',
      email: String((t.credentials as Record<string, unknown>)?.email ?? 'N/A'),
      creds: t.credentials as Record<string, unknown>, type: 'Standalone',
      has2FA: false, section: 'tools' as VaultSection,
    })),
    ...vault.subscriptions.filter((s) => !!(s.credentials as Record<string, unknown> | undefined)?.password).map((s) => ({
      id: `sub-${String(s.id)}`, name: String(s.name ?? ''), source: 'Subscription',
      email: String((s.credentials as Record<string, unknown>)?.email ?? s.vendor),
      creds: s.credentials as Record<string, unknown>, type: String(s.type ?? ''),
      has2FA: false, section: 'subscriptions' as VaultSection,
    })),
    ...vault.projects.flatMap((p) =>
      ((p.standaloneCredentials as Array<Record<string, unknown>>) ?? []).map((sc) => ({
        id: `sc-${String(sc.id)}`, name: `${String(p.name ?? '')} → ${String(sc.label ?? '')}`, source: 'Project Credential',
        email: String(sc.username ?? p.clientName ?? ''), creds: { password: sc.password, lastUpdated: sc.lastUpdated } as Record<string, unknown>,
        type: 'Project', has2FA: false, section: 'projects' as VaultSection,
        url: sc.url, notes: sc.notes,
      }))
    ),
  ];

  const filtered = allCredentials.filter((c) => {
    const matchSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.source.toLowerCase().includes(searchTerm.toLowerCase());
    const matchSection = section === 'all' || c.section === section;
    return matchSearch && matchSection;
  });

  const accountsWith2FA = allCredentials.filter(c => c.has2FA).length;
  const sectionsWithCount: { id: VaultSection; label: string; icon: ReactElement; count: number }[] = [
    { id: 'all', label: 'All', icon: <ShieldCheck className="w-3.5 h-3.5" />, count: allCredentials.length },
    { id: 'accounts', label: 'Accounts', icon: <ShieldCheck className="w-3.5 h-3.5" />, count: vault.accounts.length },
    { id: 'hardware', label: 'Hardware', icon: <Key className="w-3.5 h-3.5" />, count: vault.hardware.filter((h) => !!h.credentials).length },
    { id: 'tools', label: 'Tools', icon: <Key className="w-3.5 h-3.5" />, count: vault.tools.filter((t) => !!t.credentials).length },
    { id: 'subscriptions', label: 'Subscriptions', icon: <CreditCard className="w-3.5 h-3.5" />, count: vault.subscriptions.filter((s) => !!(s.credentials as Record<string, unknown> | undefined)?.password).length },
    { id: 'projects', label: 'Projects', icon: <FolderOpen className="w-3.5 h-3.5" />, count: vault.projects.reduce((n, p) => n + (((p.standaloneCredentials as Array<Record<string, unknown>>) ?? []).length), 0) },
  ];

  const sectionColor: Record<VaultSection, string> = {
    all: 'bg-primary/10 text-primary',
    accounts: 'bg-violet-500/10 text-violet-500',
    hardware: 'bg-blue-500/10 text-blue-500',
    tools: 'bg-indigo-500/10 text-indigo-500',
    subscriptions: 'bg-teal-500/10 text-teal-500',
    projects: 'bg-orange-500/10 text-orange-500',
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Lock className="w-8 h-8 text-primary" />
            Credential Vault
          </h1>
          <p className="text-muted-foreground">Secure system-wide access to all stored credentials and 2FA codes.</p>
        </div>
        <Button variant="outline">
          <RefreshCw className="w-4 h-4" />
          Rotate Tokens
        </Button>
      </div>

      {!canReveal && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20">
          <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-600">Restricted Access</p>
            <p className="text-xs text-muted-foreground">Your role does not allow revealing passwords. Contact an Administrator for full access.</p>
          </div>
        </div>
      )}

      {vaultQuery.isError && (
        <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/5 text-sm text-rose-500">
          Failed to load vault: {toApiError(vaultQuery.error)}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar panel */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="p-4 space-y-4">
            <div>
              <label className="text-xs font-bold uppercase text-muted-foreground mb-2 block">Security Health</label>
              <div className="h-2 w-full bg-accent rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500" style={{ width: `${Math.round((accountsWith2FA / Math.max(vault.accounts.length, 1)) * 100)}%` }} />
              </div>
              <p className="text-[10px] mt-1 text-muted-foreground font-medium">{accountsWith2FA}/{vault.accounts.length} accounts have 2FA</p>
            </div>

            <div className="space-y-2 pt-2 border-t text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Secrets</span>
                <span className="font-bold">{allCredentials.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">With 2FA</span>
                <span className="font-bold text-emerald-600">{accountsWith2FA}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Your Access</span>
                <Badge variant={canReveal ? 'success' : 'warning'}>{canReveal ? 'Full' : 'Read-Only'}</Badge>
              </div>
            </div>

            {/* Section filter */}
            <div className="pt-2 border-t space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Filter by Source</p>
              {sectionsWithCount.map(s => (
                <button key={s.id} onClick={() => setSection(s.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-all ${section === s.id ? 'bg-primary/10 text-primary' : 'hover:bg-accent text-muted-foreground'}`}>
                  <div className="flex items-center gap-2">{s.icon}{s.label}</div>
                  <span className="text-xs font-bold">{s.count}</span>
                </button>
              ))}
            </div>
          </Card>
        </div>

        {/* Main credential grid */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search vault..."
                className="w-full bg-card border rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {vaultQuery.isLoading &&
              Array.from({ length: 4 }).map((_, index) => (
                <Card key={`vault-skeleton-${index}`} className="p-4 space-y-3 animate-pulse">
                  <div className="h-10 bg-accent rounded-xl" />
                  <div className="h-4 bg-accent rounded w-2/3" />
                  <div className="h-4 bg-accent rounded w-1/2" />
                  <div className="h-9 bg-accent rounded-xl" />
                </Card>
              ))}
            {filtered.map((item) => (
              <Card key={item.id} className="p-4 hover:shadow-premium transition-all space-y-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${sectionColor[item.section]}`}>
                      {item.section === 'accounts' && <ShieldCheck className="w-5 h-5" />}
                      {item.section === 'hardware' && <Key className="w-5 h-5" />}
                      {item.section === 'tools' && <Key className="w-5 h-5" />}
                      {item.section === 'subscriptions' && <CreditCard className="w-5 h-5" />}
                      {item.section === 'projects' && <FolderOpen className="w-5 h-5" />}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm leading-tight">{item.name}</h3>
                      <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">{item.source}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {item.has2FA && <Badge variant="success">2FA</Badge>}
                    <Badge variant="info">{item.type}</Badge>
                  </div>
                </div>

                <div className="space-y-3">
                  <CredentialField label="Email / Username" value={item.email} isMasked={false} />
                  {canReveal ? (
                    <div className="space-y-1.5">
                      <CredentialField
                        label="Password"
                        value={
                          revealedValues[item.id] ??
                          (typeof item.creds.password === 'string'
                            ? item.creds.password
                            : isEncryptedValue(item.creds.password)
                              ? 'Encrypted - click Reveal'
                              : 'Not set')
                        }
                      />
                      {isEncryptedValue(item.creds.password) && !revealedValues[item.id] && (
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={async () => {
                            try {
                              setRevealingItemId(item.id);
                              const plain = await revealMutation.mutateAsync(item.creds.password as EncryptedValue);
                              setRevealedValues((prev) => ({ ...prev, [item.id]: plain }));
                              pushToast('success', `Password revealed for ${item.name}.`);
                            } catch (error) {
                              pushToast('error', toApiError(error));
                            } finally {
                              setRevealingItemId(null);
                            }
                          }}
                          disabled={revealingItemId === item.id}
                        >
                          {revealingItemId === item.id ? 'Revealing...' : 'Reveal Password'}
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Password</label>
                      <div className="flex items-center gap-2 bg-accent/50 p-2.5 rounded-xl border">
                        <div className="flex-1 font-mono text-sm text-muted-foreground">●●●●●●●●●●●●</div>
                        <Lock className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </div>
                  )}
                  {(Array.isArray(item.creds.customFields) ? item.creds.customFields : []).map((cf: any, i: number) => (
                    canReveal ? (
                      <CredentialField key={`${cf.key}-${i}`} label={String(cf.key)} value={String(cf.value)} />
                    ) : (
                      <div key={`${cf.key}-${i}`} className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{String(cf.key)}</label>
                        <div className="flex items-center gap-2 bg-accent/50 p-2.5 rounded-xl border">
                          <div className="flex-1 font-mono text-sm text-muted-foreground">●●●●●●●●●●●●</div>
                          <Lock className="w-4 h-4 text-muted-foreground" />
                        </div>
                      </div>
                    )
                  ))}
                  {'url' in item && typeof item.url === 'string' && item.url && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">URL</label>
                      <a href={item.url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline break-all">{item.url}</a>
                    </div>
                  )}
                  {'notes' in item && typeof item.notes === 'string' && item.notes && (
                    <p className="text-xs text-muted-foreground italic">{item.notes}</p>
                  )}
                </div>
              </Card>
            ))}
            {filtered.length === 0 && (
              <div className="col-span-2 flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
                <Lock className="w-10 h-10 opacity-20" />
                <p className="text-sm italic">No credentials found.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="fixed bottom-4 right-4 z-70 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`px-4 py-2 rounded-lg text-sm font-medium shadow-lg border ${
              toast.type === 'success'
                ? 'bg-emerald-600 text-white border-emerald-700'
                : 'bg-red-600 text-white border-red-700'
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  );
};
