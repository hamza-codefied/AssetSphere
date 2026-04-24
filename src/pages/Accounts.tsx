import { useState, type ReactElement } from 'react';
import {
  Card, Badge, Button, Modal, CredentialField, CustomSelect, PasswordInput,
  CustomCredentialFieldsEditor, customFieldRowsToStored, type CustomCredentialFieldRow
} from '../components/ui';
import {
  ShieldCheck, Mail, Cloud, Globe, ExternalLink, ShieldAlert, Key, Trash2,
  Smartphone, KeyRound, Copy, Check, RefreshCw, ShieldOff, Pencil
} from 'lucide-react';
import type { Account, Credentials } from '../types';
import { useSystemState } from '../hooks/useSystemState';
import { useAuth } from '../auth/AuthContext';
import {
  useAccountsQuery,
  useCreateAccountMutation,
  useDeleteAccountMutation,
  useRegenerateBackupCodesMutation,
  useSetAccountPasswordLockMutation,
  useUpdateAccountMutation,
  useRevealAccountCredentialsMutation,
} from '../api/accounts';
import type { AccountRevealedCredentials } from '../api/accounts';
import { toApiError } from '../api/client';

type TwoFactorMethod = 'Authenticator' | 'SMS' | 'Email';

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

const generateTotpSecret = (length = 32) => {
  let out = '';
  for (let i = 0; i < length; i++) {
    out += BASE32_ALPHABET[Math.floor(Math.random() * BASE32_ALPHABET.length)];
  }
  return out;
};

const generateBackupCodes = (count = 8) => {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const raw = Math.random().toString(36).toUpperCase().replace(/[^A-Z0-9]/g, '').padEnd(8, 'X');
    codes.push(`${raw.slice(0, 4)}-${raw.slice(4, 8)}`);
  }
  return codes;
};

const methodLabel: Record<TwoFactorMethod, string> = {
  Authenticator: 'Authenticator App (TOTP)',
  SMS: 'SMS Text Message',
  Email: 'Email Code'
};

const methodIcon: Record<TwoFactorMethod, ReactElement> = {
  Authenticator: <KeyRound className="w-4 h-4" />,
  SMS: <Smartphone className="w-4 h-4" />,
  Email: <Mail className="w-4 h-4" />
};

export const Accounts = ({ state }: { state: ReturnType<typeof useSystemState> }) => {
  const { tools } = state;
  const { can } = useAuth();
  const accountsQuery = useAccountsQuery();
  const accounts = accountsQuery.data ?? [];
  const createAccountMutation = useCreateAccountMutation();
  const updateAccountMutation = useUpdateAccountMutation();
  const regenerateCodesMutation = useRegenerateBackupCodesMutation();
  const deleteAccountMutation = useDeleteAccountMutation();
  const revealAccountMutation = useRevealAccountCredentialsMutation();
  const setAccountPasswordLockMutation = useSetAccountPasswordLockMutation();

  const [revealedAccCreds, setRevealedAccCreds] = useState<AccountRevealedCredentials | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddMode, setIsAddMode] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Account | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [toasts, setToasts] = useState<Array<{ id: string; type: 'success' | 'error'; message: string }>>([]);

  // Form State
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [type, setType] = useState<'Gmail' | 'AWS' | 'Domain' | 'Other'>('Gmail');
  const [enable2FA, setEnable2FA] = useState(false);
  const [twoFactorMethod, setTwoFactorMethod] = useState<TwoFactorMethod>('Authenticator');
  const [twoFactorIssuer, setTwoFactorIssuer] = useState('Google Authenticator');
  const [twoFactorSecret, setTwoFactorSecret] = useState(generateTotpSecret());
  const [twoFactorPhone, setTwoFactorPhone] = useState('');
  const [twoFactorRecoveryEmail, setTwoFactorRecoveryEmail] = useState('');
  const [generateBackups, setGenerateBackups] = useState(true);
  const [accountExtraFields, setAccountExtraFields] = useState<CustomCredentialFieldRow[]>([]);

  // Detail-view state for backup-code reveal / copy feedback
  const [backupCodesVisible, setBackupCodesVisible] = useState(false);
  const [copiedCodes, setCopiedCodes] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [editAccountId, setEditAccountId] = useState('');
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editType, setEditType] = useState<Account['type']>('Gmail');
  const [editStatus, setEditStatus] = useState<Account['status']>('Active');
  const [editPassword, setEditPassword] = useState('');
  const [editError, setEditError] = useState<string | null>(null);

  const pushToast = (type: 'success' | 'error', message: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
    }, 3000);
  };

  const resetForm = () => {
    setEmail('');
    setName('');
    setPassword('');
    setType('Gmail');
    setEnable2FA(false);
    setTwoFactorMethod('Authenticator');
    setTwoFactorIssuer('Google Authenticator');
    setTwoFactorSecret(generateTotpSecret());
    setTwoFactorPhone('');
    setTwoFactorRecoveryEmail('');
    setGenerateBackups(true);
    setAccountExtraFields([]);
    setBackupCodesVisible(false);
    setCopiedCodes(false);
    setFormError(null);
    setIsAddMode(false);
    setIsModalOpen(false);
    setSelectedAccount(null);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditAccountId('');
    setEditName('');
    setEditEmail('');
    setEditType('Gmail');
    setEditStatus('Active');
    setEditPassword('');
    setEditError(null);
  };

  const buildTwoFactor = (): Credentials['twoFactor'] | undefined => {
    if (!enable2FA) return undefined;
    const base: NonNullable<Credentials['twoFactor']> = {
      type: twoFactorMethod,
      enrolledAt: new Date().toISOString().split('T')[0],
      ...(generateBackups ? { backupCodes: generateBackupCodes() } : {})
    };
    if (twoFactorMethod === 'Authenticator') {
      return {
        ...base,
        issuer: twoFactorIssuer.trim() || 'Authenticator',
        secret: twoFactorSecret
      };
    }
    if (twoFactorMethod === 'SMS') {
      return { ...base, phoneNumber: twoFactorPhone.trim() || undefined };
    }
    return { ...base, recoveryEmail: twoFactorRecoveryEmail.trim() || undefined };
  };

  const handleAdd = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) return;
    if (enable2FA) {
      if (twoFactorMethod === 'SMS' && !twoFactorPhone.trim()) return;
      if (twoFactorMethod === 'Email' && !twoFactorRecoveryEmail.trim()) return;
      if (twoFactorMethod === 'Authenticator' && !twoFactorSecret.trim()) return;
    }
    const twoFactor = buildTwoFactor();
    const extraStored = customFieldRowsToStored(accountExtraFields);
    setFormError(null);
    try {
      await createAccountMutation.mutateAsync({
        name,
        email,
        type: type as any,
        status: 'Active',
        isCompanyOwned: true,
        credentials: {
          email,
          password,
          ...(extraStored.length ? { customFields: extraStored } : {}),
          ...(twoFactor ? { twoFactor } : {}),
          lastUpdated: new Date().toISOString().split('T')[0],
        },
      });
      setFeedback({ type: 'success', message: 'Account created successfully.' });
      resetForm();
    } catch (error) {
      const message = toApiError(error);
      setFormError(message);
      setFeedback({ type: 'error', message });
    }
  };

  const canReveal = can('vault.reveal_passwords');
  const canLock = can('vault.lock_passwords');

  const handleRegenerateBackupCodes = async (account: Account) => {
    if (!account.credentials.twoFactor) return;
    try {
      const updated = await regenerateCodesMutation.mutateAsync(account.id);
      setSelectedAccount(updated);
      setBackupCodesVisible(true);
      setFeedback({ type: 'success', message: 'Backup codes regenerated.' });
    } catch (error) {
      setFeedback({ type: 'error', message: toApiError(error) });
    }
  };

  const handleDisable2FA = async (account: Account) => {
    const { twoFactor, ...rest } = account.credentials;
    void twoFactor;
    try {
      const updated = await updateAccountMutation.mutateAsync({
        id: account.id,
        payload: {
          credentials: {
            ...rest,
            lastUpdated: new Date().toISOString().split('T')[0],
          },
        },
      });
      setSelectedAccount(updated);
      setBackupCodesVisible(false);
      setFeedback({ type: 'success', message: '2FA disabled for this account.' });
    } catch (error) {
      setFeedback({ type: 'error', message: toApiError(error) });
    }
  };

  const requestDelete = (account: Account) => setDeleteTarget(account);
  const closeDeleteModal = () => setDeleteTarget(null);
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteAccountMutation.mutateAsync(deleteTarget.id);
      setFeedback({ type: 'success', message: `Account "${deleteTarget.name}" deleted.` });
      if (selectedAccount?.id === deleteTarget.id) resetForm();
      closeDeleteModal();
    } catch (error) {
      setFeedback({ type: 'error', message: toApiError(error) });
    }
  };

  const openEditModal = (account: Account) => {
    setEditAccountId(account.id);
    setEditName(account.name);
    setEditEmail(account.email);
    setEditType(account.type);
    setEditStatus(account.status);
    setEditPassword('');
    setEditError(null);
    setIsEditModalOpen(true);
  };

  const handleUpdateAccount = async () => {
    if (!editAccountId) return;
    if (!editName.trim() || !editEmail.trim()) {
      setEditError('Name and email are required.');
      return;
    }
    if (editPassword && editPassword.length < 6) {
      setEditError('Password must be at least 6 characters.');
      return;
    }

    setEditError(null);
    try {
      const updated = await updateAccountMutation.mutateAsync({
        id: editAccountId,
        payload: {
          name: editName.trim(),
          email: editEmail.trim(),
          type: editType,
          status: editStatus,
          ...(editPassword
            ? {
                credentials: {
                  password: editPassword,
                  lastUpdated: new Date().toISOString().split('T')[0],
                },
              }
            : {}),
        },
      });
      setSelectedAccount(updated);
      setFeedback({ type: 'success', message: 'Account updated successfully.' });
      closeEditModal();
    } catch (error) {
      setEditError(toApiError(error));
      setFeedback({ type: 'error', message: toApiError(error) });
    }
  };

  const copyBackupCodes = (codes: string[]) => {
    navigator.clipboard.writeText(codes.join('\n'));
    setCopiedCodes(true);
    setTimeout(() => setCopiedCodes(false), 2000);
  };

  const getTypeIcon = (accountType: string) => {
    switch (accountType) {
      case 'Gmail': return <Mail className="w-4 h-4" />;
      case 'AWS': return <Cloud className="w-4 h-4" />;
      case 'Domain': return <Globe className="w-4 h-4" />;
      default: return <ShieldCheck className="w-4 h-4" />;
    }
  };

  const getLinkedToolsCount = (accountId: string) => {
    return tools.filter(t => t.linkedAccountId === accountId).length;
  };

  return (
    <div className="space-y-6">
      {feedback && (
        <div
          className={`p-3 rounded-xl border text-sm ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600'
              : 'bg-rose-500/10 border-rose-500/20 text-rose-600'
          }`}
        >
          {feedback.message}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Central Accounts</h1>
          <p className="text-muted-foreground">The core identity system. Create accounts here to link them to tools.</p>
        </div>
        {can('accounts.create') && (
          <Button className="bg-violet-600 hover:bg-violet-700" onClick={() => { setIsAddMode(true); setIsModalOpen(true); }}>
            <Key className="w-4 h-4" />
            Create Central Account
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accountsQuery.isLoading && accounts.length === 0 && (
          <Card className="md:col-span-2 lg:col-span-3">
            <p className="text-sm text-muted-foreground">Loading accounts...</p>
          </Card>
        )}
        {accountsQuery.isError && (
          <Card className="md:col-span-2 lg:col-span-3 border-rose-500/20">
            <p className="text-sm text-rose-600">Failed to load accounts: {toApiError(accountsQuery.error)}</p>
          </Card>
        )}
        {accounts.map((account) => (
          <Card 
            key={account.id} 
            className="cursor-pointer hover:border-violet-500/50 transition-all border-l-4 border-l-violet-500"
            onClick={() => {
              setSelectedAccount(account);
              setRevealedAccCreds(null);
              setIsAddMode(false);
              setIsModalOpen(true);
            }}
          >
            <div className="flex justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center font-bold">
                {getTypeIcon(account.type)}
              </div>
              <div className="flex items-center gap-2">
                {account.credentials.twoFactor && (
                  <Badge variant="success">2FA</Badge>
                )}
                <Badge variant={account.status === 'Active' ? 'success' : 'danger'}>{account.status}</Badge>
              </div>
            </div>
            <h3 className="font-bold text-lg">{account.name}</h3>
            <p className="text-sm text-muted-foreground mb-4">{account.email}</p>
            
            <div className="pt-4 border-t flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <span>{account.type} Account</span>
              <div className="flex items-center gap-1 text-primary">
                <ExternalLink className="w-3 h-3" />
                {getLinkedToolsCount(account.id)} Linked Tools
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={resetForm} 
        title={isAddMode ? 'New Central Account' : 'Account Intelligence'}
      >
        {isAddMode ? (
          <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-1 custom-scrollbar">
             <div className="space-y-2">
                <label className="text-sm font-medium">Identifier Name <span className="text-destructive">*</span></label>
                <input value={name} onChange={e => setName(e.target.value)} className="w-full bg-accent p-2.5 rounded-xl border-none outline-none focus:ring-2 focus:ring-primary/20" placeholder="e.g. Master Admin" />
             </div>
             <div className="space-y-2">
                <label className="text-sm font-medium">Email / Username <span className="text-destructive">*</span></label>
                <input value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-accent p-2.5 rounded-xl border-none outline-none focus:ring-2 focus:ring-primary/20" placeholder="e.g. admin@company.com" />
             </div>
             <div className="space-y-2">
                <label className="text-sm font-medium">Password <span className="text-destructive">*</span></label>
                <PasswordInput value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter a strong password" />
             </div>
             <div className="space-y-2">
                <label className="text-sm font-medium">Additional fields (optional)</label>
                <p className="text-xs text-muted-foreground">API tokens, recovery email aliases, tenant IDs, or any other labeled secrets.</p>
                <CustomCredentialFieldsEditor
                  fields={accountExtraFields}
                  onChange={setAccountExtraFields}
                  addButtonLabel="Add field"
                />
             </div>
             <div className="space-y-2">
                <label className="text-sm font-medium">Account Provider</label>
                <CustomSelect 
                  value={type} 
                  onChange={val => setType(val as any)} 
                  options={[
                    { value: 'Gmail', label: 'Gmail' },
                    { value: 'AWS', label: 'AWS' },
                    { value: 'Domain', label: 'Domain' },
                    { value: 'Other', label: 'Other' }
                  ]}
                />
             </div>
             <div className="rounded-xl border bg-accent/30">
                <div className="flex items-center gap-3 p-3 border-b">
                  <input 
                    type="checkbox" 
                    id="enable2fa" 
                    checked={enable2FA} 
                    onChange={e => setEnable2FA(e.target.checked)}
                    className="w-4 h-4 rounded accent-primary"
                  />
                  <label htmlFor="enable2fa" className="text-sm font-medium cursor-pointer flex-1">
                    Enable Two-Factor Authentication (2FA)
                  </label>
                  {enable2FA && <Badge variant="success">Configured</Badge>}
                </div>

                {enable2FA && (
                  <div className="p-4 space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">2FA Method</label>
                      <CustomSelect
                        value={twoFactorMethod}
                        onChange={(val) => setTwoFactorMethod(val as TwoFactorMethod)}
                        options={[
                          { value: 'Authenticator', label: 'Authenticator App (TOTP)' },
                          { value: 'SMS', label: 'SMS Text Message' },
                          { value: 'Email', label: 'Email Code' }
                        ]}
                      />
                    </div>

                    {twoFactorMethod === 'Authenticator' && (
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Issuer / App</label>
                          <input
                            value={twoFactorIssuer}
                            onChange={(e) => setTwoFactorIssuer(e.target.value)}
                            className="w-full bg-accent p-2.5 rounded-xl border-none outline-none focus:ring-2 focus:ring-primary/20"
                            placeholder="e.g. Google Authenticator, Authy, 1Password"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center justify-between">
                            <span>TOTP Secret (Base32)</span>
                            <button
                              type="button"
                              onClick={() => setTwoFactorSecret(generateTotpSecret())}
                              className="normal-case text-[11px] font-semibold text-primary hover:underline flex items-center gap-1"
                            >
                              <RefreshCw className="w-3 h-3" /> Regenerate
                            </button>
                          </label>
                          <input
                            value={twoFactorSecret}
                            onChange={(e) => setTwoFactorSecret(e.target.value.toUpperCase())}
                            className="w-full bg-accent p-2.5 rounded-xl border-none outline-none focus:ring-2 focus:ring-primary/20 font-mono text-xs tracking-widest"
                            placeholder="Enter or generate a secret"
                          />
                          <p className="text-[11px] text-muted-foreground">Scan this into your authenticator app manually, or share the secret with the account owner.</p>
                        </div>
                      </div>
                    )}

                    {twoFactorMethod === 'SMS' && (
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Phone Number</label>
                        <input
                          value={twoFactorPhone}
                          onChange={(e) => setTwoFactorPhone(e.target.value)}
                          className="w-full bg-accent p-2.5 rounded-xl border-none outline-none focus:ring-2 focus:ring-primary/20"
                          placeholder="+1 555 123 4567"
                        />
                        <p className="text-[11px] text-muted-foreground">Codes will be sent via text. Use an international format with country code.</p>
                      </div>
                    )}

                    {twoFactorMethod === 'Email' && (
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Recovery Email</label>
                        <input
                          value={twoFactorRecoveryEmail}
                          onChange={(e) => setTwoFactorRecoveryEmail(e.target.value)}
                          className="w-full bg-accent p-2.5 rounded-xl border-none outline-none focus:ring-2 focus:ring-primary/20"
                          placeholder="recovery@company.com"
                        />
                      </div>
                    )}

                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={generateBackups}
                        onChange={(e) => setGenerateBackups(e.target.checked)}
                        className="w-4 h-4 rounded accent-primary"
                      />
                      <span className="text-sm">Generate 8 one-time backup codes</span>
                    </label>
                  </div>
                )}
             </div>
             <div className="flex gap-3 pt-4">
               <Button variant="outline" className="flex-1" onClick={resetForm} disabled={createAccountMutation.isPending}>Cancel</Button>
               <Button 
                 className="flex-1 bg-violet-600 hover:bg-violet-700" 
                 onClick={handleAdd}
                 disabled={
                   createAccountMutation.isPending ||
                   !name.trim() || !email.trim() || !password.trim() ||
                   (enable2FA && twoFactorMethod === 'SMS' && !twoFactorPhone.trim()) ||
                   (enable2FA && twoFactorMethod === 'Email' && !twoFactorRecoveryEmail.trim()) ||
                   (enable2FA && twoFactorMethod === 'Authenticator' && !twoFactorSecret.trim())
                 }
               >
                 {createAccountMutation.isPending ? 'Saving...' : 'Save Account'}
               </Button>
             </div>
             {formError && (
               <div className="p-3 rounded-xl border border-rose-500/20 bg-rose-500/10 text-xs text-rose-600">
                 {formError}
               </div>
             )}
          </div>
        ) : selectedAccount ? (
          <div className="space-y-6 max-h-[80vh] overflow-y-auto pr-1 custom-scrollbar">
            <div className="p-4 bg-violet-500/5 rounded-2xl border border-violet-500/10 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-violet-500 text-white flex items-center justify-center shadow-lg shadow-violet-500/20">
                {getTypeIcon(selectedAccount.type)}
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold">{selectedAccount.name}</h2>
                <p className="text-sm text-muted-foreground">{selectedAccount.email}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Badge variant={selectedAccount.status === 'Active' ? 'success' : 'danger'}>{selectedAccount.status}</Badge>
                {selectedAccount.credentials.twoFactor && <Badge variant="info">2FA Active</Badge>}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold border-b pb-2 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-violet-500" />
                Security Layer
              </h3>
              <div className="space-y-3">
                <CredentialField label="Email / Username" value={selectedAccount.credentials.email || selectedAccount.email} isMasked={false} />
                <CredentialField
                  label="Password"
                  value={revealedAccCreds?.password ?? selectedAccount.credentials.password ?? ''}
                  onReveal={canReveal ? async () => {
                    if (selectedAccount.credentials.passwordLocked && !canLock) {
                      pushToast('error', 'Password is locked by admin');
                      return;
                    }
                    try {
                      const revealed = await revealAccountMutation.mutateAsync(selectedAccount.id);
                      setRevealedAccCreds(prev => ({ ...prev, ...revealed }));
                    } catch (error) {
                      pushToast('error', toApiError(error));
                    }
                  } : undefined}
                />
                {selectedAccount.credentials.passwordLocked && !canLock && (
                  <p className="text-xs text-amber-600">Password is locked by admin.</p>
                )}
                {canLock && (
                  <Button
                    variant="outline"
                    onClick={async () => {
                      try {
                        const updated = await setAccountPasswordLockMutation.mutateAsync({
                          id: selectedAccount.id,
                          locked: !selectedAccount.credentials.passwordLocked,
                        });
                        setSelectedAccount(updated);
                        setFeedback({
                          type: 'success',
                          message: `Password ${updated.credentials.passwordLocked ? 'locked' : 'unlocked'} successfully.`,
                        });
                        pushToast(
                          'success',
                          `Password ${updated.credentials.passwordLocked ? 'locked' : 'unlocked'} successfully.`,
                        );
                      } catch (error) {
                        pushToast('error', toApiError(error));
                      }
                    }}
                    disabled={setAccountPasswordLockMutation.isPending}
                  >
                    {selectedAccount.credentials.passwordLocked ? 'Unlock Password' : 'Lock Password'}
                  </Button>
                )}
                {(revealedAccCreds?.customFields ?? selectedAccount.credentials.customFields)?.map((cf, i) => (
                  <CredentialField
                    key={`${cf.key}-${i}`}
                    label={cf.key}
                    value={cf.value}
                    onReveal={canReveal && cf.value === '********' ? async () => {
                      if (selectedAccount.credentials.passwordLocked && !canLock) {
                        pushToast('error', 'Password is locked by admin');
                        return;
                      }
                      try {
                        const revealed = await revealAccountMutation.mutateAsync(selectedAccount.id);
                        setRevealedAccCreds(prev => ({ ...prev, ...revealed }));
                      } catch (error) {
                        pushToast('error', toApiError(error));
                      }
                    } : undefined}
                  />
                ))}
                <p className="text-[10px] text-muted-foreground">Last updated: {selectedAccount.credentials.lastUpdated}</p>
              </div>
            </div>

            {selectedAccount.credentials.twoFactor ? (
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 overflow-hidden">
                <div className="flex items-center gap-3 p-4 border-b border-emerald-500/10">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                    {methodIcon[selectedAccount.credentials.twoFactor.type]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Two-Factor Authentication</p>
                    <p className="text-sm font-semibold truncate">{methodLabel[selectedAccount.credentials.twoFactor.type]}</p>
                  </div>
                  <Badge variant="success">Active</Badge>
                </div>

                <div className="p-4 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Method</p>
                      <p className="font-medium">{selectedAccount.credentials.twoFactor.type}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Enrolled</p>
                      <p className="font-medium">{selectedAccount.credentials.twoFactor.enrolledAt || selectedAccount.credentials.lastUpdated}</p>
                    </div>
                  </div>

                  {selectedAccount.credentials.twoFactor.type === 'Authenticator' && (
                    <div className="space-y-3">
                      {selectedAccount.credentials.twoFactor.issuer && (
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Issuer / App</p>
                          <p className="text-sm font-medium">{selectedAccount.credentials.twoFactor.issuer}</p>
                        </div>
                      )}
                      {selectedAccount.credentials.twoFactor.secret && (
                        canReveal ? (
                          <CredentialField
                            label="TOTP Secret"
                            value={revealedAccCreds?.twoFactor?.secret ?? selectedAccount.credentials.twoFactor.secret}
                            onReveal={async () => {
                              if (selectedAccount.credentials.passwordLocked && !canLock) {
                                pushToast('error', 'Password is locked by admin');
                                return;
                              }
                              try {
                                const revealed = await revealAccountMutation.mutateAsync(selectedAccount.id);
                                setRevealedAccCreds(prev => ({ ...prev, ...revealed }));
                              } catch (error) {
                                pushToast('error', toApiError(error));
                              }
                            }}
                          />
                        ) : (
                          <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">TOTP Secret</label>
                            <div className="flex items-center gap-2 bg-accent/50 p-2.5 rounded-xl border">
                              <div className="flex-1 font-mono text-sm text-muted-foreground">●●●● ●●●● ●●●● ●●●●</div>
                              <ShieldOff className="w-4 h-4 text-muted-foreground" />
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  )}

                  {selectedAccount.credentials.twoFactor.type === 'SMS' && selectedAccount.credentials.twoFactor.phoneNumber && (
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Phone Number</p>
                      <p className="text-sm font-mono">{selectedAccount.credentials.twoFactor.phoneNumber}</p>
                    </div>
                  )}

                  {selectedAccount.credentials.twoFactor.type === 'Email' && selectedAccount.credentials.twoFactor.recoveryEmail && (
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Recovery Email</p>
                      <p className="text-sm font-mono">{selectedAccount.credentials.twoFactor.recoveryEmail}</p>
                    </div>
                  )}

                  {selectedAccount.credentials.twoFactor.backupCodes && selectedAccount.credentials.twoFactor.backupCodes.length > 0 && (
                    <div className="space-y-2 pt-2 border-t">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                          Backup Codes ({selectedAccount.credentials.twoFactor.backupCodes.length})
                        </p>
                        <div className="flex items-center gap-2">
                          {canReveal && !revealedAccCreds?.twoFactor?.backupCodes && (
                            <button
                              type="button"
                              onClick={async () => {
                                if (selectedAccount.credentials.passwordLocked && !canLock) {
                                  pushToast('error', 'Password is locked by admin');
                                  return;
                                }
                                try {
                                  const revealed = await revealAccountMutation.mutateAsync(selectedAccount.id);
                                  setRevealedAccCreds(prev => ({ ...prev, ...revealed }));
                                  setBackupCodesVisible(true);
                                } catch (error) {
                                  pushToast('error', toApiError(error));
                                }
                              }}
                              disabled={revealAccountMutation.isPending}
                              className="text-[11px] font-semibold text-primary hover:underline disabled:opacity-50"
                            >
                              {revealAccountMutation.isPending ? 'Revealing...' : 'Reveal'}
                            </button>
                          )}
                          {canReveal && revealedAccCreds?.twoFactor?.backupCodes && (
                            <>
                              <button
                                type="button"
                                onClick={() => setBackupCodesVisible(v => !v)}
                                className="text-[11px] font-semibold text-primary hover:underline"
                              >
                                {backupCodesVisible ? 'Hide' : 'Show'}
                              </button>
                              <button
                                type="button"
                                onClick={() => copyBackupCodes(revealedAccCreds.twoFactor!.backupCodes!)}
                                className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1"
                              >
                                {copiedCodes ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                                {copiedCodes ? 'Copied' : 'Copy all'}
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {selectedAccount.credentials.twoFactor.backupCodes.map((_, idx) => (
                          <div
                            key={idx}
                            className="bg-accent/60 rounded-lg px-2.5 py-1.5 text-xs font-mono text-center tracking-widest"
                          >
                            {canReveal && backupCodesVisible && revealedAccCreds?.twoFactor?.backupCodes?.[idx]
                              ? revealedAccCreds.twoFactor.backupCodes[idx]
                              : '●●●● ●●●●'}
                          </div>
                        ))}
                      </div>
                      <p className="text-[10px] text-muted-foreground">Each code can be used once if the primary 2FA method is unavailable.</p>
                    </div>
                  )}

                  {can('accounts.edit') && (
                    <div className="flex gap-2 pt-2 border-t">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleRegenerateBackupCodes(selectedAccount)}
                        disabled={regenerateCodesMutation.isPending}
                      >
                        <RefreshCw className="w-4 h-4" /> {regenerateCodesMutation.isPending ? 'Rotating...' : 'Rotate Backup Codes'}
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 text-destructive hover:bg-destructive/10"
                        onClick={() => handleDisable2FA(selectedAccount)}
                        disabled={updateAccountMutation.isPending}
                      >
                        <ShieldOff className="w-4 h-4" /> {updateAccountMutation.isPending ? 'Updating...' : 'Disable 2FA'}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed p-4 flex items-center gap-3 bg-accent/20">
                <ShieldOff className="w-5 h-5 text-amber-500 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold">Two-Factor Auth Disabled</p>
                  <p className="text-xs text-muted-foreground">This account relies on password only. Enable 2FA for stronger protection.</p>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <h3 className="text-sm font-bold border-b pb-2 flex items-center gap-2 text-violet-500">
                <ExternalLink className="w-4 h-4" />
                Linked Tools Usage
              </h3>
              <div className="grid gap-2">
                {tools.filter(t => t.linkedAccountId === selectedAccount.id).map(tool => (
                  <div key={tool.id} className="flex items-center justify-between p-2.5 rounded-xl border hover:bg-accent/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      <span className="text-sm font-medium">{tool.name}</span>
                    </div>
                    <Badge variant="info">Connected</Badge>
                  </div>
                ))}
                {getLinkedToolsCount(selectedAccount.id) === 0 && (
                  <p className="text-xs text-muted-foreground italic text-center py-2">No tools currently linked to this account.</p>
                )}
              </div>
            </div>

            <div className="pt-4 flex gap-3">
              {can('accounts.edit') && (
                <Button variant="outline" className="flex-1" onClick={() => openEditModal(selectedAccount)}>
                  <Pencil className="w-4 h-4" /> Edit Account
                </Button>
              )}
              {can('accounts.delete') && (
                <Button variant="danger" className="flex-1" onClick={() => requestDelete(selectedAccount)}>
                  <Trash2 className="w-4 h-4" /> Delete Account
                </Button>
              )}
              <Button variant="outline" className="flex-1" onClick={resetForm}>Close</Button>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal isOpen={Boolean(deleteTarget)} onClose={closeDeleteModal} title="Delete Account">
        {deleteTarget && (
          <div className="space-y-4">
            <div className="p-3 rounded-xl border border-rose-500/20 bg-rose-500/10 text-sm text-rose-600">
              This will permanently delete <strong>{deleteTarget.name}</strong> and unlink it from tools.
            </div>
            <p className="text-sm text-muted-foreground">This action cannot be undone.</p>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={closeDeleteModal} disabled={deleteAccountMutation.isPending}>
                Cancel
              </Button>
              <Button variant="danger" className="flex-1" onClick={confirmDelete} disabled={deleteAccountMutation.isPending}>
                {deleteAccountMutation.isPending ? 'Deleting...' : 'Delete Account'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={isEditModalOpen} onClose={closeEditModal} title="Edit Account">
        <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-1 custom-scrollbar">
          <div className="space-y-2">
            <label className="text-sm font-medium">Identifier Name <span className="text-destructive">*</span></label>
            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full bg-accent p-2.5 rounded-xl border-none outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Email / Username <span className="text-destructive">*</span></label>
            <input
              value={editEmail}
              onChange={(e) => setEditEmail(e.target.value)}
              className="w-full bg-accent p-2.5 rounded-xl border-none outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Account Provider</label>
              <CustomSelect
                value={editType}
                onChange={(val) => setEditType(val as Account['type'])}
                options={[
                  { value: 'Gmail', label: 'Gmail' },
                  { value: 'AWS', label: 'AWS' },
                  { value: 'Domain', label: 'Domain' },
                  { value: 'Slack', label: 'Slack' },
                  { value: 'GitHub', label: 'GitHub' },
                  { value: 'Figma', label: 'Figma' },
                  { value: 'Notion', label: 'Notion' },
                  { value: 'Other', label: 'Other' },
                ]}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <CustomSelect
                value={editStatus}
                onChange={(val) => setEditStatus(val as Account['status'])}
                options={[
                  { value: 'Active', label: 'Active' },
                  { value: 'Disabled', label: 'Disabled' },
                ]}
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Reset Password (Optional)</label>
            <PasswordInput
              value={editPassword}
              onChange={(e) => setEditPassword(e.target.value)}
              placeholder="Leave empty to keep current password"
            />
            <p className="text-xs text-muted-foreground">Only set this when admin wants to rotate account password.</p>
          </div>
          {editError && (
            <div className="p-3 rounded-xl border border-rose-500/20 bg-rose-500/10 text-xs text-rose-600">
              {editError}
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={closeEditModal} disabled={updateAccountMutation.isPending}>
              Cancel
            </Button>
            <Button className="flex-1 bg-violet-600 hover:bg-violet-700" onClick={handleUpdateAccount} disabled={updateAccountMutation.isPending}>
              {updateAccountMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </Modal>
      <div className="fixed bottom-4 right-4 z-120 space-y-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`px-4 py-2 rounded-lg text-sm font-medium shadow-lg border pointer-events-auto ${
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
