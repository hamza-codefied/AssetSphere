import { useState, type ReactElement } from 'react';
import { Card, Badge, Button, CredentialField } from '../components/ui';
import {
  ShieldCheck, Search, Lock, RefreshCw, ShieldAlert,
  CreditCard, FolderOpen, Key
} from 'lucide-react';
import { useSystemState } from '../hooks/useSystemState';
import { useAuth } from '../auth/AuthContext';

type VaultSection = 'all' | 'accounts' | 'hardware' | 'tools' | 'subscriptions' | 'projects';

export const Vault = ({ state }: { state: ReturnType<typeof useSystemState> }) => {
  const { accounts, hardware, tools, subscriptions, projects } = state;
  const { can } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [section, setSection] = useState<VaultSection>('all');

  const canReveal = can('vault.reveal_passwords');

  const allCredentials = [
    ...accounts.map(a => ({
      id: `acc-${a.id}`, name: a.name, source: 'Central Account',
      email: a.email, creds: a.credentials, type: a.type,
      has2FA: !!a.credentials.twoFactor, section: 'accounts' as VaultSection,
    })),
    ...hardware.filter(h => h.credentials).map(h => ({
      id: `hw-${h.id}`, name: h.name, source: 'Hardware',
      email: 'Device Access', creds: h.credentials!, type: 'Local',
      has2FA: false, section: 'hardware' as VaultSection,
    })),
    ...tools.filter(t => t.credentials).map(t => ({
      id: `tool-${t.id}`, name: t.name, source: 'Software Tool',
      email: t.credentials!.email || 'N/A', creds: t.credentials!, type: 'Standalone',
      has2FA: false, section: 'tools' as VaultSection,
    })),
    ...subscriptions.filter(s => s.credentials?.password).map(s => ({
      id: `sub-${s.id}`, name: s.name, source: 'Subscription',
      email: s.credentials!.email || s.vendor, creds: s.credentials!, type: s.type,
      has2FA: false, section: 'subscriptions' as VaultSection,
    })),
    ...projects.flatMap(p =>
      p.standaloneCredentials.map(sc => ({
        id: `sc-${sc.id}`, name: `${p.name} → ${sc.label}`, source: 'Project Credential',
        email: sc.username || p.clientName, creds: { password: sc.password, lastUpdated: sc.lastUpdated } as Record<string, unknown> as any,
        type: 'Project', has2FA: false, section: 'projects' as VaultSection,
        url: sc.url, notes: sc.notes,
      }))
    ),
  ];

  const filtered = allCredentials.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.source.toLowerCase().includes(searchTerm.toLowerCase());
    const matchSection = section === 'all' || c.section === section;
    return matchSearch && matchSection;
  });

  const accountsWith2FA = allCredentials.filter(c => c.has2FA).length;
  const sectionsWithCount: { id: VaultSection; label: string; icon: ReactElement; count: number }[] = [
    { id: 'all', label: 'All', icon: <ShieldCheck className="w-3.5 h-3.5" />, count: allCredentials.length },
    { id: 'accounts', label: 'Accounts', icon: <ShieldCheck className="w-3.5 h-3.5" />, count: accounts.length },
    { id: 'hardware', label: 'Hardware', icon: <Key className="w-3.5 h-3.5" />, count: hardware.filter(h => h.credentials).length },
    { id: 'tools', label: 'Tools', icon: <Key className="w-3.5 h-3.5" />, count: tools.filter(t => t.credentials).length },
    { id: 'subscriptions', label: 'Subscriptions', icon: <CreditCard className="w-3.5 h-3.5" />, count: subscriptions.filter(s => s.credentials?.password).length },
    { id: 'projects', label: 'Projects', icon: <FolderOpen className="w-3.5 h-3.5" />, count: projects.reduce((n, p) => n + p.standaloneCredentials.length, 0) },
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

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar panel */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="p-4 space-y-4">
            <div>
              <label className="text-xs font-bold uppercase text-muted-foreground mb-2 block">Security Health</label>
              <div className="h-2 w-full bg-accent rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500" style={{ width: `${Math.round((accountsWith2FA / Math.max(accounts.length, 1)) * 100)}%` }} />
              </div>
              <p className="text-[10px] mt-1 text-muted-foreground font-medium">{accountsWith2FA}/{accounts.length} accounts have 2FA</p>
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
                    <CredentialField label="Password" value={item.creds.password || 'Not set'} />
                  ) : (
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Password</label>
                      <div className="flex items-center gap-2 bg-accent/50 p-2.5 rounded-xl border">
                        <div className="flex-1 font-mono text-sm text-muted-foreground">●●●●●●●●●●●●</div>
                        <Lock className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </div>
                  )}
                  {item.creds.customFields?.map((cf: { key: string; value: string }, i: number) => (
                    canReveal ? (
                      <CredentialField key={`${cf.key}-${i}`} label={cf.key} value={cf.value} />
                    ) : (
                      <div key={`${cf.key}-${i}`} className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{cf.key}</label>
                        <div className="flex items-center gap-2 bg-accent/50 p-2.5 rounded-xl border">
                          <div className="flex-1 font-mono text-sm text-muted-foreground">●●●●●●●●●●●●</div>
                          <Lock className="w-4 h-4 text-muted-foreground" />
                        </div>
                      </div>
                    )
                  ))}
                  {'url' in item && item.url && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">URL</label>
                      <a href={item.url as string} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline break-all">{item.url as string}</a>
                    </div>
                  )}
                  {'notes' in item && item.notes && (
                    <p className="text-xs text-muted-foreground italic">{item.notes as string}</p>
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
    </div>
  );
};
