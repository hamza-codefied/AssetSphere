import { useState } from 'react';
import { Card, Badge, Button, CredentialField } from '../components/ui';
import { ShieldCheck, Search, Filter, Lock, RefreshCw } from 'lucide-react';
import { useSystemState } from '../hooks/useSystemState';

export const Vault = ({ state }: { state: ReturnType<typeof useSystemState> }) => {
  const { accounts, hardware, tools } = state;
  const [searchTerm, setSearchTerm] = useState('');

  // Collect all entities with credentials
  const allCredentials = [
    ...accounts.map(a => ({ id: `acc-${a.id}`, name: a.name, source: 'Central Account', email: a.email, creds: a.credentials, type: a.type })),
    ...hardware.filter(h => h.credentials).map(h => ({ id: `hw-${h.id}`, name: h.name, source: 'Hardware', email: 'Device Access', creds: h.credentials!, type: 'Local' })),
    ...tools.filter(t => t.credentials).map(t => ({ id: `tool-${t.id}`, name: t.name, source: 'Software Tool', email: t.credentials!.email || 'N/A', creds: t.credentials!, type: 'Standalone' }))
  ];

  const filtered = allCredentials.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.source.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <div className="flex gap-2">
          <Button variant="outline">
            <RefreshCw className="w-4 h-4" />
            Rotate Tokens
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-4">
           <Card className="p-4 space-y-4">
              <div>
                <label className="text-xs font-bold uppercase text-muted-foreground mb-2 block">Security Health</label>
                <div className="h-2 w-full bg-accent rounded-full overflow-hidden">
                   <div className="h-full bg-emerald-500 w-[92%]"></div>
                </div>
                <p className="text-[10px] mt-1 text-muted-foreground font-medium">92% Secure • Verified</p>
              </div>
              
              <div className="space-y-2 pt-2 border-t text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Secrets</span>
                  <span className="font-bold">{allCredentials.length}</span>
                </div>
              </div>
           </Card>
        </div>

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
            <Button variant="outline"><Filter className="w-4 h-4" /></Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((item) => (
              <Card key={item.id} className="p-4 hover:shadow-premium transition-all space-y-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
                       <ShieldCheck className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm">{item.name}</h3>
                      <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">{item.source}</p>
                    </div>
                  </div>
                  <Badge variant="info">{item.type}</Badge>
                </div>

                <div className="space-y-3">
                   <CredentialField label="Email / Username" value={item.email} isMasked={false} />
                   <CredentialField label="Password" value={item.creds.password || '••••••••'} />
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
