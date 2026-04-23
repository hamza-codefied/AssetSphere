import { useState } from 'react';
import {
  Card, Badge, Button, Modal, CustomSelect, CredentialField, PasswordInput,
  CustomCredentialFieldsEditor, customFieldRowsToStored, type CustomCredentialFieldRow
} from '../components/ui';
import { Plus, ExternalLink, Link as LinkIcon, User, Info, Search, Trash2, KeyRound, Calendar, AlertTriangle, Loader2, Pencil } from 'lucide-react';
import type { SoftwareTool } from '../types';
import { useSystemState } from '../hooks/useSystemState';
import { useAuth } from '../auth/AuthContext';
import { toApiError } from '../api/client';
import { useAccountsQuery } from '../api/accounts';
import { useEmployeesQuery } from '../api/employees';
import {
  useCreateToolMutation,
  useDeleteToolMutation,
  useToolsQuery,
  useUpdateToolMutation,
  useRevealToolCredentialsMutation,
} from '../api/tools';

export const Tools = ({ state }: { state: ReturnType<typeof useSystemState> }) => {
  void state;
  const { can } = useAuth();
  const toolsQuery = useToolsQuery();
  const employeesQuery = useEmployeesQuery();
  const accountsQuery = useAccountsQuery();
  const tools = toolsQuery.data ?? [];
  const employees = employeesQuery.data ?? [];
  const accounts = accountsQuery.data ?? [];
  const createToolMutation = useCreateToolMutation();
  const updateToolMutation = useUpdateToolMutation();
  const deleteToolMutation = useDeleteToolMutation();
  const revealToolMutation = useRevealToolCredentialsMutation();

  const [revealedToolCreds, setRevealedToolCreds] = useState<{ password?: string; customFields?: Array<{ key: string; value: string }> } | null>(null);
  const [selectedTool, setSelectedTool] = useState<SoftwareTool | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddMode, setIsAddMode] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<SoftwareTool | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Array<{ id: string; type: 'success' | 'error'; message: string }>>([]);

  // Form State
  const [name, setName] = useState('');
  const [linkedId, setLinkedId] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [manualEmail, setManualEmail] = useState('');
  const [manualPassword, setManualPassword] = useState('');
  const [manualExtraFields, setManualExtraFields] = useState<CustomCredentialFieldRow[]>([]);

  const pushToast = (type: 'success' | 'error', message: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
    }, 3000);
  };

  const resetForm = () => {
    setName('');
    setLinkedId('');
    setAssigneeId('');
    setManualEmail('');
    setManualPassword('');
    setManualExtraFields([]);
    setFormError(null);
    setIsAddMode(false);
    setIsEditMode(false);
    setIsModalOpen(false);
    setSelectedTool(null);
  };

  const handleAdd = async () => {
    if (!name.trim()) {
      setFormError('Tool name is required.');
      return;
    }
    const extraStored = customFieldRowsToStored(manualExtraFields);
    const hasManualCreds =
      !linkedId &&
      (manualEmail.trim() || manualPassword.trim() || extraStored.length > 0);
    try {
      await createToolMutation.mutateAsync({
        name: name.trim(),
        status: 'Active',
        linkedAccountId: linkedId || undefined,
        assignedToId: assigneeId || undefined,
        ...(hasManualCreds
          ? {
              credentials: {
                ...(manualEmail.trim() ? { email: manualEmail.trim() } : {}),
                ...(manualPassword ? { password: manualPassword } : {}),
                ...(extraStored.length ? { customFields: extraStored } : {}),
                lastUpdated: new Date().toISOString().split('T')[0],
              },
            }
          : {}),
      });
      resetForm();
      pushToast('success', 'Tool created successfully.');
    } catch (error) {
      const msg = toApiError(error);
      setFormError(msg);
      pushToast('error', msg);
    }
  };

  const getLinkedAccount = (id?: string) => {
    return accounts.find(a => a.id === id);
  };

  const filteredTools = tools.filter(t => 
    t.name.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const openEdit = (tool: SoftwareTool) => {
    setSelectedTool(tool);
    setName(tool.name);
    setLinkedId(tool.linkedAccountId ?? '');
    setAssigneeId(tool.assignedToId ?? '');
    setManualEmail(tool.credentials?.email ?? '');
    setManualPassword('');
    setManualExtraFields(
      (tool.credentials?.customFields ?? []).map((field, index) => ({
        id: `${field.key}-${index}`,
        key: field.key,
        value: '',
      })),
    );
    setFormError(null);
    setIsAddMode(false);
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleEdit = async () => {
    if (!selectedTool) return;
    if (!name.trim()) {
      setFormError('Tool name is required.');
      return;
    }
    const extraStored = customFieldRowsToStored(manualExtraFields);
    const hasManualCreds = !linkedId && (manualEmail.trim() || manualPassword.trim() || extraStored.length > 0);
    try {
      await updateToolMutation.mutateAsync({
        id: selectedTool.id,
        payload: {
          name: name.trim(),
          linkedAccountId: linkedId || undefined,
          assignedToId: assigneeId || undefined,
          ...(hasManualCreds
            ? {
                credentials: {
                  ...(manualEmail.trim() ? { email: manualEmail.trim() } : {}),
                  ...(manualPassword ? { password: manualPassword } : {}),
                  ...(extraStored.length ? { customFields: extraStored } : {}),
                  lastUpdated: new Date().toISOString().split('T')[0],
                },
              }
            : {}),
        },
      });
      resetForm();
      pushToast('success', 'Tool updated successfully.');
    } catch (error) {
      const msg = toApiError(error);
      setFormError(msg);
      pushToast('error', msg);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await deleteToolMutation.mutateAsync(deleteTarget.id);
      if (selectedTool?.id === deleteTarget.id) resetForm();
      setDeleteTarget(null);
      pushToast('success', `Tool "${deleteTarget.name}" deleted.`);
    } catch (error) {
      pushToast('error', toApiError(error));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Software & Tools</h1>
          <p className="text-muted-foreground">Manage SaaS subscriptions and platform access.</p>
        </div>
        {can('tools.create') && (
          <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={() => { resetForm(); setIsAddMode(true); setIsEditMode(false); setIsModalOpen(true); }}>
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
                setRevealedToolCreds(null);
                setIsAddMode(false);
                setIsEditMode(false);
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
        title={isAddMode ? 'New Software Platform' : isEditMode ? 'Edit Tool' : 'Tool Configuration'}
      >
        {isAddMode || isEditMode ? (
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
               <Button
                 className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                 onClick={isAddMode ? () => void handleAdd() : () => void handleEdit()}
                 disabled={!name.trim() || createToolMutation.isPending || updateToolMutation.isPending}
               >
                 {createToolMutation.isPending || updateToolMutation.isPending ? (
                   <>
                     <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                   </>
                 ) : isAddMode ? (
                   'Add Software'
                 ) : (
                   'Update Tool'
                 )}
               </Button>
             </div>
             {formError && <p className="text-sm text-destructive">{formError}</p>}
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

            <div className="space-y-2">
              <h3 className="text-sm font-bold flex items-center gap-2 text-indigo-600">
                <LinkIcon className="w-4 h-4" />
                Linked Identity
              </h3>
              <p className="text-sm text-muted-foreground">{getLinkedAccount(selectedTool.linkedAccountId)?.email ?? 'Manual credentials'}</p>
            </div>

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
                  <CredentialField
                    label="Password"
                    value={revealedToolCreds?.password ?? selectedTool.credentials.password}
                    onReveal={can('vault.reveal_passwords') ? async () => {
                      const revealed = await revealToolMutation.mutateAsync(selectedTool.id);
                      setRevealedToolCreds(revealed);
                    } : undefined}
                  />
                )}
                {(revealedToolCreds?.customFields ?? selectedTool.credentials?.customFields)?.map((cf, i) => (
                  <CredentialField
                    key={`${cf.key}-${i}`}
                    label={cf.key}
                    value={cf.value}
                    onReveal={can('vault.reveal_passwords') && cf.value === '********' ? async () => {
                      const revealed = await revealToolMutation.mutateAsync(selectedTool.id);
                      setRevealedToolCreds(revealed);
                    } : undefined}
                  />
                ))}
              </div>
            )}

            <div className="space-y-2">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <User className="w-4 h-4" />
                Assigned Employee
              </h3>
              <p className="text-sm text-muted-foreground">{employees.find(emp => emp.id === selectedTool.assignedToId)?.name ?? 'Unassigned'}</p>
            </div>

            <div className="flex gap-3 pt-2">
              {can('tools.edit') && (
                <Button variant="outline" className="flex-1" onClick={() => openEdit(selectedTool)}>
                  <Pencil className="w-4 h-4" /> Edit
                </Button>
              )}
              <Button variant="outline" className="flex-1" onClick={resetForm}>Close</Button>
              {can('tools.delete') && (
                <Button variant="danger" className="flex-1" onClick={() => setDeleteTarget(selectedTool)}>
                   <Trash2 className="w-4 h-4" /> Remove Tool
                </Button>
              )}
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Tool">
        {deleteTarget && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete <span className="font-semibold text-foreground">{deleteTarget.name}</span>?
            </p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setDeleteTarget(null)}>
                Cancel
              </Button>
              <Button variant="danger" className="flex-1" onClick={() => void handleDeleteConfirm()} disabled={deleteToolMutation.isPending}>
                {deleteToolMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </Button>
            </div>
          </div>
        )}
      </Modal>

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
