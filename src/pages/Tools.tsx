import { useState } from 'react';
import {
  Card, Badge, Button, Modal, CustomSelect, CredentialField, PasswordInput,
  CustomCredentialFieldsEditor, customFieldRowsToStored, type CustomCredentialFieldRow
} from '../components/ui';
import { Plus, ExternalLink, Link as LinkIcon, User, Info, Search, Trash2, KeyRound, Calendar, AlertTriangle } from 'lucide-react';
import type { SoftwareTool } from '../types';
import { useSystemState } from '../hooks/useSystemState';
import { useAuth } from '../auth/AuthContext';

export const Tools = ({ state }: { state: ReturnType<typeof useSystemState> }) => {
  const { tools, accounts, employees, addTool, updateTool, deleteTool } = state;
  const { can } = useAuth();
  const [selectedTool, setSelectedTool] = useState<SoftwareTool | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddMode, setIsAddMode] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  // Form State
  const [name, setName] = useState('');
  const [linkedId, setLinkedId] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [manualEmail, setManualEmail] = useState('');
  const [manualPassword, setManualPassword] = useState('');
  const [manualExtraFields, setManualExtraFields] = useState<CustomCredentialFieldRow[]>([]);

  const resetForm = () => {
    setName('');
    setLinkedId('');
    setAssigneeId('');
    setManualEmail('');
    setManualPassword('');
    setManualExtraFields([]);
    setIsAddMode(false);
    setIsModalOpen(false);
    setSelectedTool(null);
  };

  const handleAdd = () => {
    if (!name.trim()) return;
    const extraStored = customFieldRowsToStored(manualExtraFields);
    const hasManualCreds =
      !linkedId &&
      (manualEmail.trim() || manualPassword.trim() || extraStored.length > 0);
    addTool({
      name,
      status: 'Active',
      linkedAccountId: linkedId || undefined,
      assignedToId: assigneeId || undefined,
      ...(hasManualCreds
        ? {
            credentials: {
              ...(manualEmail.trim() ? { email: manualEmail.trim() } : {}),
              ...(manualPassword ? { password: manualPassword } : {}),
              ...(extraStored.length ? { customFields: extraStored } : {}),
              lastUpdated: new Date().toISOString().split('T')[0]
            }
          }
        : {})
    });
    resetForm();
  };

  const getLinkedAccount = (id?: string) => {
    return accounts.find(a => a.id === id);
  };

  const filteredTools = tools.filter(t => 
    t.name.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Software & Tools</h1>
          <p className="text-muted-foreground">Manage SaaS subscriptions and platform access.</p>
        </div>
        {can('tools.create') && (
          <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={() => { setIsAddMode(true); setIsModalOpen(true); }}>
            <Plus className="w-4 h-4" />
            Add Tool / Platform
          </Button>
        )}
      </div>

      <div className="flex items-center gap-3 bg-card p-2 rounded-2xl border shadow-subtle">
        <Search className="w-4 h-4 ml-2 text-muted-foreground" />
        <input 
          type="text" 
          placeholder="Filter tools..." 
          value={searchFilter}
          onChange={e => setSearchFilter(e.target.value)}
          className="flex-1 bg-transparent border-none focus:ring-0 text-sm"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredTools.map((tool) => {
          const linkedAccount = getLinkedAccount(tool.linkedAccountId);
          return (
            <Card 
              key={tool.id} 
              className="group hover:border-indigo-500/50 transition-all flex flex-col justify-between"
              onClick={() => {
                setSelectedTool(tool);
                setIsAddMode(false);
                setIsModalOpen(true);
              }}
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xl shadow-inner">
                    {tool.name.charAt(0)}
                  </div>
                  <Badge variant={tool.status === 'Active' ? 'success' : 'danger'}>{tool.status}</Badge>
                </div>
                
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-bold text-xl group-hover:text-indigo-600 transition-colors">{tool.name}</h3>
                  {tool.expiryDate && (() => {
                    const diff = Math.ceil((new Date(tool.expiryDate).getTime() - Date.now()) / 86400000);
                    return diff <= 30 ? (
                      <div className={`flex items-center gap-1 text-[10px] font-bold ${diff < 0 ? 'text-rose-500' : 'text-amber-500'}`}>
                        <AlertTriangle className="w-3 h-3" />
                        {diff < 0 ? 'Expired' : `${diff}d`}
                      </div>
                    ) : null;
                  })()}
                </div>
                {tool.expiryDate && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                    <Calendar className="w-3 h-3" />
                    <span>Expires {tool.expiryDate}</span>
                  </div>
                )}

                {linkedAccount ? (
                  <div className="mt-4 p-3 bg-primary/5 rounded-xl border border-primary/10 flex items-center gap-3">
                    <LinkIcon className="w-4 h-4 text-primary" />
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Linked Account</p>
                      <p className="text-sm font-medium truncate">{linkedAccount.email}</p>
                    </div>
                  </div>
                ) : (tool.credentials?.email || tool.credentials?.customFields?.length) ? (
                  <div className="mt-4 p-3 bg-amber-500/5 rounded-xl border border-amber-500/10 flex items-center gap-3">
                    <KeyRound className="w-4 h-4 text-amber-500" />
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Manual Login</p>
                      <p className="text-sm font-medium truncate">
                        {tool.credentials?.email ||
                          (tool.credentials?.customFields?.length
                            ? `${tool.credentials!.customFields!.length} custom field(s)`
                            : '')}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 p-3 bg-accent/50 rounded-xl border border-dashed flex items-center gap-3 italic text-muted-foreground">
                    <Info className="w-4 h-4 opacity-50" />
                    <span className="text-xs">No credentials configured</span>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold">
                    {employees.find(e => e.id === tool.assignedToId)?.name.charAt(0) || '?'}
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">
                    {employees.find(e => e.id === tool.assignedToId)?.name || 'Unassigned'}
                  </span>
                </div>
                <button className="text-primary p-2 hover:bg-primary/10 rounded-lg transition-all">
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </Card>
          );
        })}
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={resetForm} 
        title={isAddMode ? 'New Software Platform' : 'Tool Configuration'}
      >
        {isAddMode ? (
          <div className="space-y-4">
             <div className="space-y-2">
                <label className="text-sm font-medium">Platform Name <span className="text-destructive">*</span></label>
                <input value={name} onChange={e => setName(e.target.value)} className="w-full bg-accent p-2.5 rounded-xl border-none outline-none focus:ring-2 focus:ring-primary/20" placeholder="e.g. SalesForce" />
             </div>
             <div className="space-y-2">
                <label className="text-sm font-medium">Assign to Employee</label>
                <CustomSelect 
                   value={assigneeId} 
                   onChange={val => setAssigneeId(val)} 
                   placeholder="Select employee or unassigned..."
                   options={[
                     { value: '', label: 'Unassigned' },
                     ...employees.map(emp => ({ value: emp.id, label: emp.name }))
                   ]}
                />
             </div>
             <div className="space-y-2">
                <label className="text-sm font-medium">Link Central Account</label>
                <CustomSelect 
                   value={linkedId} 
                   onChange={val => { setLinkedId(val); if (val) { setManualEmail(''); setManualPassword(''); setManualExtraFields([]); } }} 
                   placeholder="No Linking (Manual Login)"
                   options={[
                     { value: '', label: 'No Linking (Manual Login)' },
                     ...accounts.map(acc => ({ value: acc.id, label: `${acc.email} (${acc.type})` }))
                   ]}
                />
             </div>
             
             {!linkedId && (
               <div className="space-y-3 p-4 border rounded-xl bg-accent/20">
                 <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                   <KeyRound className="w-3 h-3" /> Manual Credentials
                 </p>
                 <div className="space-y-2">
                   <input value={manualEmail} onChange={e => setManualEmail(e.target.value)} className="w-full bg-accent p-2.5 rounded-xl border-none outline-none focus:ring-2 focus:ring-primary/20" placeholder="Login email or username" />
                 </div>
                 <div className="space-y-2">
                   <PasswordInput value={manualPassword} onChange={e => setManualPassword(e.target.value)} placeholder="Password" />
                 </div>
                 <div className="space-y-2 pt-1">
                   <label className="text-xs font-medium text-muted-foreground">Additional fields (optional)</label>
                   <p className="text-[10px] text-muted-foreground mb-1">API keys, workspace IDs, security questions, etc.</p>
                   <CustomCredentialFieldsEditor fields={manualExtraFields} onChange={setManualExtraFields} addButtonLabel="Add field" />
                 </div>
               </div>
             )}

             <div className="flex gap-3 pt-4">
               <Button variant="outline" className="flex-1" onClick={resetForm}>Cancel</Button>
               <Button className="flex-1 bg-indigo-600 hover:bg-indigo-700" onClick={handleAdd} disabled={!name.trim()}>Add Software</Button>
             </div>
          </div>
        ) : selectedTool ? (
          <div className="space-y-6">
            <div className="flex items-center gap-4 border-b pb-6">
              <div className="w-16 h-16 rounded-2xl bg-indigo-500 text-white flex items-center justify-center text-2xl font-bold">
                {selectedTool.name.charAt(0)}
              </div>
              <div>
                <h2 className="text-2xl font-bold">{selectedTool.name}</h2>
                <Badge variant="info">Subscribed</Badge>
              </div>
            </div>

            {can('tools.link') && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold flex items-center gap-2 text-indigo-600">
                  <LinkIcon className="w-4 h-4" />
                  Linked Identity
                </h3>
                <CustomSelect 
                  value={selectedTool.linkedAccountId || ''}
                  onChange={(val) => updateTool(selectedTool.id, { linkedAccountId: val || undefined })}
                  placeholder="Manual Credentials"
                  options={[
                    { value: '', label: 'No Linking (Manual)' },
                    ...accounts.map(acc => ({ value: acc.id, label: `${acc.email} (${acc.type})` }))
                  ]}
                />
              </div>
            )}

            {/* Show inherited credentials if linked */}
            {selectedTool.linkedAccountId && getLinkedAccount(selectedTool.linkedAccountId) && (() => {
              const acc = getLinkedAccount(selectedTool.linkedAccountId)!;
              return (
                <div className="space-y-3">
                  <h3 className="text-sm font-bold flex items-center gap-2 text-emerald-600">
                    <KeyRound className="w-4 h-4" />
                    Inherited Credentials
                  </h3>
                  <CredentialField label="Email" value={acc.credentials.email || ''} isMasked={false} />
                  <CredentialField label="Password" value={acc.credentials.password || ''} />
                  {acc.credentials.customFields?.map((cf, i) => (
                    <CredentialField key={`${cf.key}-${i}`} label={cf.key} value={cf.value} />
                  ))}
                </div>
              );
            })()}

            {/* Show manual credentials if not linked */}
            {!selectedTool.linkedAccountId && (selectedTool.credentials?.email || selectedTool.credentials?.customFields?.length) && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold flex items-center gap-2 text-amber-600">
                  <KeyRound className="w-4 h-4" />
                  Manual Credentials
                </h3>
                {selectedTool.credentials?.email && (
                  <CredentialField label="Email" value={selectedTool.credentials.email} isMasked={false} />
                )}
                {selectedTool.credentials?.password && (
                  <CredentialField label="Password" value={selectedTool.credentials.password} />
                )}
                {selectedTool.credentials?.customFields?.map((cf, i) => (
                  <CredentialField key={`${cf.key}-${i}`} label={cf.key} value={cf.value} />
                ))}
              </div>
            )}

            {can('tools.edit') && (
              <div className="space-y-2">
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Assign Employee
                </h3>
                <CustomSelect 
                  value={selectedTool.assignedToId || ''}
                  onChange={(val) => updateTool(selectedTool.id, { assignedToId: val })}
                  options={employees.map(emp => ({ value: emp.id, label: emp.name }))}
                />
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={resetForm}>Close</Button>
              {can('tools.delete') && (
                <Button variant="danger" className="flex-1" onClick={() => { deleteTool(selectedTool.id); resetForm(); }}>
                   <Trash2 className="w-4 h-4" /> Remove Tool
                </Button>
              )}
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
};
