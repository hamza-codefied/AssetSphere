import { useState } from 'react';
import { Card, Badge, Button, Modal, CredentialField, CustomSelect } from '../components/ui';
import { ShieldCheck, Mail, Cloud, Globe, ExternalLink, ShieldAlert, Key, Trash2 } from 'lucide-react';
import type { Account } from '../types';
import { useSystemState } from '../hooks/useSystemState';

export const Accounts = ({ state }: { state: ReturnType<typeof useSystemState> }) => {
  const { accounts, tools, addAccount, deleteAccount } = state;
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddMode, setIsAddMode] = useState(false);

  // Form State
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState<'Gmail' | 'AWS' | 'Domain' | 'Other'>('Gmail');

  const handleAdd = () => {
    addAccount({
      name: name || 'System Account',
      email: email || 'account@company.com',
      type: type as any,
      status: 'Active',
      isCompanyOwned: true,
      credentials: {
        email: email,
        password: '••••••••',
        lastUpdated: new Date().toISOString().split('T')[0]
      }
    });
    setIsModalOpen(false);
    setIsAddMode(false);
    setEmail('');
    setName('');
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Central Accounts</h1>
          <p className="text-muted-foreground">The core identity system. Create accounts here to link them to tools.</p>
        </div>
        <Button className="bg-violet-600 hover:bg-violet-700" onClick={() => { setIsAddMode(true); setIsModalOpen(true); }}>
          <Key className="w-4 h-4" />
          Create Central Account
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts.map((account) => (
          <Card 
            key={account.id} 
            className="cursor-pointer hover:border-violet-500/50 transition-all border-l-4 border-l-violet-500"
            onClick={() => {
              setSelectedAccount(account);
              setIsAddMode(false);
              setIsModalOpen(true);
            }}
          >
            <div className="flex justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center font-bold">
                {getTypeIcon(account.type)}
              </div>
              <Badge variant={account.status === 'Active' ? 'success' : 'danger'}>{account.status}</Badge>
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
        onClose={() => { setIsModalOpen(false); setIsAddMode(false); }} 
        title={isAddMode ? 'New Central Account' : 'Account Intelligence'}
      >
        {isAddMode ? (
          <div className="space-y-4">
             <div className="space-y-2">
                <label className="text-sm font-medium">Identifier Name</label>
                <input value={name} onChange={e => setName(e.target.value)} className="w-full bg-accent p-2.5 rounded-xl border-none outline-none" placeholder="e.g. Master Admin" />
             </div>
             <div className="space-y-2">
                <label className="text-sm font-medium">Email / Username</label>
                <input value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-accent p-2.5 rounded-xl border-none outline-none" placeholder="e.g. admin@company.com" />
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
             <div className="flex gap-3 pt-4">
               <Button variant="outline" className="flex-1" onClick={() => setIsModalOpen(false)}>Cancel</Button>
               <Button className="flex-1 bg-violet-600 hover:bg-violet-700" onClick={handleAdd}>Save Account</Button>
             </div>
          </div>
        ) : selectedAccount ? (
          <div className="space-y-6">
            <div className="p-4 bg-violet-500/5 rounded-2xl border border-violet-500/10 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-violet-500 text-white flex items-center justify-center shadow-lg shadow-violet-500/20">
                {getTypeIcon(selectedAccount.type)}
              </div>
              <div>
                <h2 className="text-lg font-bold">{selectedAccount.name}</h2>
                <p className="text-sm text-muted-foreground">{selectedAccount.email}</p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold border-b pb-2 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-violet-500" />
                Security Layer
              </h3>
              <div className="space-y-4">
                <CredentialField label="Password" value={selectedAccount.credentials.password || ''} />
              </div>
            </div>

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
              <Button variant="danger" className="flex-1" onClick={() => { deleteAccount(selectedAccount.id); setIsModalOpen(false); }}>
                <Trash2 className="w-4 h-4" /> Delete Account
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => setIsModalOpen(false)}>Close</Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
};
