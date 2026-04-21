import { useState } from 'react';
import { Card, Badge, Button, Modal, CredentialField, CustomSelect, PasswordInput } from '../components/ui';
import { Plus, Monitor, HardDrive, MoreVertical, ShieldOff, Trash2 } from 'lucide-react';
import type { HardwareAsset } from '../types';
import { useSystemState } from '../hooks/useSystemState';
import { useAuth } from '../auth/AuthContext';

export const Hardware = ({ state }: { state: ReturnType<typeof useSystemState> }) => {
  const { hardware, employees, addHardware, updateHardware, deleteHardware } = state;
  const { can } = useAuth();
  const [selectedAsset, setSelectedAsset] = useState<HardwareAsset | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddMode, setIsAddMode] = useState(false);

  // Form State
  const [newName, setNewName] = useState('');
  const [newSerial, setNewSerial] = useState('');
  const [newType, setNewType] = useState('Laptop');
  const [newPassword, setNewPassword] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [newAssigneeId, setNewAssigneeId] = useState('');

  const resetForm = () => {
    setNewName('');
    setNewSerial('');
    setNewType('Laptop');
    setNewPassword('');
    setNewNotes('');
    setNewAssigneeId('');
    setIsAddMode(false);
    setIsModalOpen(false);
    setSelectedAsset(null);
  };

  const handleAdd = () => {
    if (!newName.trim()) return;
    addHardware({
      name: newName,
      serialNumber: newSerial || 'SN-' + Math.floor(Math.random() * 10000),
      type: newType,
      status: newAssigneeId ? 'Assigned' : 'Available',
      ...(newAssigneeId ? { assignedToId: newAssigneeId } : {}),
      ...(newPassword ? { credentials: { password: newPassword, lastUpdated: new Date().toISOString().split('T')[0] } } : {}),
      notes: newNotes
    });
    resetForm();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Available': return <Badge variant="success">Available</Badge>;
      case 'Assigned': return <Badge variant="info">Assigned</Badge>;
      case 'Inactive': return <Badge variant="danger">Inactive</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const getOwnerName = (id?: string) => {
    if (!id) return 'Unassigned';
    return employees.find(e => e.id === id)?.name || 'Unknown';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Hardware</h1>
          <p className="text-muted-foreground">Manage physical company assets and devices.</p>
        </div>
        {can('hardware.create') && (
          <Button onClick={() => { setIsAddMode(true); setIsModalOpen(true); }}>
            <Plus className="w-4 h-4" />
            Add New Asset
          </Button>
        )}
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-accent/50 border-b">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Asset Name</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Type</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Serial Number</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Status</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Assigned To</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {hardware.map((asset) => (
                <tr 
                  key={asset.id} 
                  className="hover:bg-accent/30 transition-colors group cursor-pointer"
                  onClick={() => {
                    setSelectedAsset(asset);
                    setIsAddMode(false);
                    setIsModalOpen(true);
                  }}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                        {asset.type === 'Laptop' ? <Monitor className="w-4 h-4" /> : <HardDrive className="w-4 h-4" />}
                      </div>
                      <span className="font-semibold">{asset.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">{asset.type}</td>
                  <td className="px-6 py-4 text-sm font-mono">{asset.serialNumber}</td>
                  <td className="px-6 py-4">{getStatusBadge(asset.status)}</td>
                  <td className="px-6 py-4 text-sm font-medium">{getOwnerName(asset.assignedToId)}</td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 hover:bg-accent rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                      <MoreVertical className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal 
        isOpen={isModalOpen} 
        onClose={resetForm} 
        title={isAddMode ? 'Add New Asset' : (selectedAsset ? 'Asset Details' : '')}
      >
        {isAddMode ? (
          <div className="space-y-4">
             <div className="space-y-2">
                <label className="text-sm font-medium">Asset Name <span className="text-destructive">*</span></label>
                <input 
                  value={newName} 
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-accent p-2.5 rounded-xl border-none outline-none focus:ring-2 focus:ring-primary/20" 
                  placeholder="e.g. MacBook Pro 14" 
                />
             </div>
             <div className="space-y-2">
                <label className="text-sm font-medium">Serial Number</label>
                <input 
                  value={newSerial} 
                  onChange={(e) => setNewSerial(e.target.value)}
                  className="w-full bg-accent p-2.5 rounded-xl border-none outline-none focus:ring-2 focus:ring-primary/20" 
                  placeholder="Auto-generated if empty" 
                />
             </div>
             <div className="space-y-2">
                <label className="text-sm font-medium">Type</label>
                <CustomSelect 
                  value={newType}
                  onChange={(val) => setNewType(val)}
                  options={[
                    { value: 'Laptop', label: 'Laptop' },
                    { value: 'Monitor', label: 'Monitor' },
                    { value: 'Mobile', label: 'Mobile' },
                    { value: 'Accessory', label: 'Accessory' }
                  ]}
                />
             </div>
             <div className="space-y-2">
               <label className="text-sm font-medium">Assign to employee</label>
               <CustomSelect
                 value={newAssigneeId}
                 onChange={(val) => setNewAssigneeId(val)}
                 placeholder="Select assignee or leave unassigned..."
                 options={[
                   { value: '', label: 'Unassigned (Available)' },
                   ...employees.map((e) => ({ value: e.id, label: e.name }))
                 ]}
               />
             </div>
             <div className="space-y-2">
                <label className="text-sm font-medium">Device Password / PIN</label>
                <PasswordInput 
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Optional — device login credential" 
                />
             </div>
             <div className="space-y-2">
                <label className="text-sm font-medium">Notes</label>
                <textarea 
                  value={newNotes} 
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full bg-accent p-2.5 rounded-xl border-none outline-none focus:ring-2 focus:ring-primary/20 resize-none h-20" 
                  placeholder="Optional — storage location, condition, etc." 
                />
             </div>
             <div className="flex gap-3 pt-4">
               <Button variant="outline" className="flex-1" onClick={resetForm}>Cancel</Button>
               <Button className="flex-1" onClick={handleAdd} disabled={!newName.trim()}>Create Asset</Button>
             </div>
          </div>
        ) : selectedAsset ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Status</p>
                {getStatusBadge(selectedAsset.status)}
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Serial Number</p>
                <p className="text-sm font-mono">{selectedAsset.serialNumber}</p>
              </div>
            </div>

            {selectedAsset.notes && (
              <div className="p-3 bg-accent/30 rounded-xl">
                <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Notes</p>
                <p className="text-sm">{selectedAsset.notes}</p>
              </div>
            )}

            {selectedAsset.credentials?.password && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold border-b pb-2 flex items-center gap-2">
                  <ShieldOff className="w-4 h-4 text-primary" />
                  Security
                </h3>
                <CredentialField label="Device Password" value={selectedAsset.credentials.password} />
              </div>
            )}

            {can('hardware.assign') && (
              <div className="space-y-2">
                <h3 className="text-sm font-bold border-b pb-2">Assignment</h3>
                <CustomSelect 
                  value={selectedAsset.assignedToId || ''}
                  onChange={(val) => {
                    updateHardware(selectedAsset.id, { 
                      assignedToId: val || undefined,
                      status: val ? 'Assigned' : 'Available'
                    });
                  }}
                  options={[
                    { value: '', label: 'Unassigned (Available)' },
                    ...employees.map(e => ({ value: e.id, label: e.name }))
                  ]}
                />
              </div>
            )}

            <div className="flex gap-3 pt-4">
              {can('hardware.delete') && (
                <Button variant="danger" className="flex-1" onClick={() => { deleteHardware(selectedAsset.id); resetForm(); }}>
                  <Trash2 className="w-4 h-4" /> Delete Asset
                </Button>
              )}
              <Button variant="outline" className="flex-1" onClick={resetForm}>Close</Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
};
