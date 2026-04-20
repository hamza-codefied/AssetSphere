import { useState } from 'react';
import { Card, Badge, Button, Modal, CustomSelect } from '../components/ui';

import { Plus, ExternalLink, Link as LinkIcon, User, Info, Search, Trash2 } from 'lucide-react';
import type { SoftwareTool } from '../types';
import { useSystemState } from '../hooks/useSystemState';

export const Tools = ({ state }: { state: ReturnType<typeof useSystemState> }) => {
  const { tools, accounts, employees, addTool, updateTool, deleteTool } = state;
  const [selectedTool, setSelectedTool] = useState<SoftwareTool | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddMode, setIsAddMode] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [linkedId, setLinkedId] = useState('');

  const handleAdd = () => {
    addTool({
      name: name || 'SaaS Tool',
      status: 'Active',
      linkedAccountId: linkedId || undefined,
      assignedToId: employees[0]?.id
    });
    setIsModalOpen(false);
    setIsAddMode(false);
    setName('');
    setLinkedId('');
  };

  const getLinkedAccount = (id?: string) => {
    return accounts.find(a => a.id === id);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Software & Tools</h1>
          <p className="text-muted-foreground">Manage SaaS subscriptions and platform access.</p>
        </div>
        <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={() => { setIsAddMode(true); setIsModalOpen(true); }}>
          <Plus className="w-4 h-4" />
          Add Tool / Platform
        </Button>
      </div>

      <div className="flex items-center gap-3 bg-card p-2 rounded-2xl border shadow-subtle">
        <Search className="w-4 h-4 ml-2 text-muted-foreground" />
        <input 
          type="text" 
          placeholder="Filter tools..." 
          className="flex-1 bg-transparent border-none focus:ring-0 text-sm"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {tools.map((tool) => {
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
                
                <h3 className="font-bold text-xl mb-1 group-hover:text-indigo-600 transition-colors">{tool.name}</h3>
                
                {linkedAccount ? (
                  <div className="mt-4 p-3 bg-primary/5 rounded-xl border border-primary/10 flex items-center gap-3">
                    <LinkIcon className="w-4 h-4 text-primary" />
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Linked Account</p>
                      <p className="text-sm font-medium truncate">{linkedAccount.email}</p>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 p-3 bg-accent/50 rounded-xl border border-dashed flex items-center gap-3 italic text-muted-foreground">
                    <Info className="w-4 h-4 opacity-50" />
                    <span className="text-xs">No central account linked</span>
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
        onClose={() => { setIsModalOpen(false); setIsAddMode(false); }} 
        title={isAddMode ? 'New Software Platform' : 'Tool Configuration'}
      >
        {isAddMode ? (
          <div className="space-y-4">
             <div className="space-y-2">
                <label className="text-sm font-medium">Platform Name</label>
                <input value={name} onChange={e => setName(e.target.value)} className="w-full bg-accent p-2.5 rounded-xl border-none outline-none" placeholder="e.g. SalesForce" />
             </div>
             <div className="space-y-2">
                <label className="text-sm font-medium">Link Central Account</label>
                <CustomSelect 
                   value={linkedId} 
                   onChange={val => setLinkedId(val)} 
                   placeholder="No Linking (Manual Login)"
                   options={accounts.map(acc => ({ value: acc.id, label: `${acc.email} (${acc.type})` }))}
                />
             </div>

             <div className="flex gap-3 pt-4">
               <Button variant="outline" className="flex-1" onClick={() => setIsModalOpen(false)}>Cancel</Button>
               <Button className="flex-1 bg-indigo-600 hover:bg-indigo-700" onClick={handleAdd}>Add Software</Button>
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

            <div className="space-y-4">
              <h3 className="text-sm font-bold flex items-center gap-2 text-indigo-600">
                <LinkIcon className="w-4 h-4" />
                Linked Identity
              </h3>
              
              <CustomSelect 
                value={selectedTool.linkedAccountId || ''}
                onChange={(val) => updateTool(selectedTool.id, { linkedAccountId: val || undefined })}
                placeholder="Manual Credentials"
                options={accounts.map(acc => ({ value: acc.id, label: `${acc.email} (${acc.type})` }))}
              />
            </div>

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


            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setIsModalOpen(false)}>Close</Button>
              <Button variant="danger" className="flex-1" onClick={() => { deleteTool(selectedTool.id); setIsModalOpen(false); }}>
                 <Trash2 className="w-4 h-4" /> Remove Tool
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
};
