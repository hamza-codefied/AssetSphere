import { useState } from 'react';
import { Card, Badge, Button, Modal, CredentialField, CustomSelect, PasswordInput } from '../components/ui';
import { Plus, Monitor, HardDrive, ShieldOff, Trash2, Loader2 } from 'lucide-react';
import type { HardwareAsset } from '../types';
import { useSystemState } from '../hooks/useSystemState';
import { useAuth } from '../auth/AuthContext';
import { toApiError } from '../api/client';
import {
  useCreateHardwareMutation,
  useDeleteHardwareMutation,
  useHardwareQuery,
  useUpdateHardwareMutation,
  useRevealHardwareCredentialsMutation,
} from '../api/hardware';
import { useEmployeesQuery } from '../api/employees';

type ToastType = 'success' | 'error';
interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}

export const Hardware = ({ state: _state }: { state: ReturnType<typeof useSystemState> }) => {
  const { can } = useAuth();
  const hardwareQuery = useHardwareQuery();
  const employeesQuery = useEmployeesQuery();

  const hardware = hardwareQuery.data ?? [];
  const employees = employeesQuery.data ?? [];

  const createHardwareMutation = useCreateHardwareMutation();
  const updateHardwareMutation = useUpdateHardwareMutation();
  const deleteHardwareMutation = useDeleteHardwareMutation();
  const revealHardwareMutation = useRevealHardwareCredentialsMutation();

  const [revealedHwCreds, setRevealedHwCreds] = useState<{ password?: string; pin?: string } | null>(null);

  const [selectedAsset, setSelectedAsset] = useState<HardwareAsset | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddMode, setIsAddMode] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<HardwareAsset | null>(null);

  const [name, setName] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [type, setType] = useState('Laptop');
  const [password, setPassword] = useState('');
  const [notes, setNotes] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const pushToast = (type: ToastType, message: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
    }, 3000);
  };

  const resetForm = () => {
    setName('');
    setSerialNumber('');
    setType('Laptop');
    setPassword('');
    setNotes('');
    setAssigneeId('');
    setFormError(null);
    setIsAddMode(false);
    setIsEditMode(false);
    setIsModalOpen(false);
    setSelectedAsset(null);
  };

  const openCreate = () => {
    resetForm();
    setIsAddMode(true);
    setIsModalOpen(true);
  };

  const openDetails = (asset: HardwareAsset) => {
    setSelectedAsset(asset);
    setRevealedHwCreds(null);
    setIsAddMode(false);
    setIsEditMode(false);
    setIsModalOpen(true);
  };

  const openEdit = (asset: HardwareAsset) => {
    setSelectedAsset(asset);
    setName(asset.name);
    setSerialNumber(asset.serialNumber);
    setType(asset.type);
    setPassword('');
    setNotes(asset.notes ?? '');
    setAssigneeId(asset.assignedToId ?? '');
    setFormError(null);
    setIsAddMode(false);
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      setFormError('Asset name is required.');
      return;
    }

    setFormError(null);
    try {
      await createHardwareMutation.mutateAsync({
        name: name.trim(),
        serialNumber: serialNumber.trim() || undefined,
        type,
        assignedToId: assigneeId || undefined,
        credentials: password
          ? {
              password,
            }
          : undefined,
        notes: notes.trim() || undefined,
      });
      resetForm();
      pushToast('success', 'Hardware asset created successfully.');
    } catch (error) {
      const msg = toApiError(error);
      setFormError(msg);
      pushToast('error', msg);
    }
  };

  const handleEdit = async () => {
    if (!selectedAsset) return;
    if (!name.trim()) {
      setFormError('Asset name is required.');
      return;
    }

    setFormError(null);
    try {
      await updateHardwareMutation.mutateAsync({
        id: selectedAsset.id,
        payload: {
          name: name.trim(),
          serialNumber: serialNumber.trim() || undefined,
          type,
          assignedToId: assigneeId || undefined,
          credentials: password
            ? {
                password,
              }
            : undefined,
          notes: notes.trim() || undefined,
        },
      });
      resetForm();
      pushToast('success', 'Hardware asset updated successfully.');
    } catch (error) {
      const msg = toApiError(error);
      setFormError(msg);
      pushToast('error', msg);
    }
  };

  const confirmDelete = (asset: HardwareAsset) => {
    setDeleteTarget(asset);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteHardwareMutation.mutateAsync(deleteTarget.id);
      if (selectedAsset?.id === deleteTarget.id) resetForm();
      pushToast('success', `Asset "${deleteTarget.name}" deleted.`);
      setDeleteTarget(null);
    } catch (error) {
      pushToast('error', toApiError(error));
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Available':
        return <Badge variant="success">Available</Badge>;
      case 'Assigned':
        return <Badge variant="info">Assigned</Badge>;
      case 'Inactive':
        return <Badge variant="danger">Inactive</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getOwnerName = (id?: string) => {
    if (!id) return 'Unassigned';
    return employees.find((employee) => employee.id === id)?.name || 'Unknown';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Hardware</h1>
          <p className="text-muted-foreground">Manage physical company assets and devices.</p>
        </div>
        {can('hardware.create') && (
          <Button onClick={openCreate}>
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
              {hardwareQuery.isLoading && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> Loading hardware...
                    </div>
                  </td>
                </tr>
              )}

              {hardwareQuery.isError && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-destructive">
                    Failed to load hardware: {toApiError(hardwareQuery.error)}
                  </td>
                </tr>
              )}

              {!hardwareQuery.isLoading && !hardwareQuery.isError && hardware.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-muted-foreground">
                    No hardware assets found.
                  </td>
                </tr>
              )}

              {!hardwareQuery.isLoading &&
                !hardwareQuery.isError &&
                hardware.map((asset) => (
                  <tr
                    key={asset.id}
                    className="hover:bg-accent/30 transition-colors group"
                    onClick={() => openDetails(asset)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                          {asset.type === 'Laptop' ? (
                            <Monitor className="w-4 h-4" />
                          ) : (
                            <HardDrive className="w-4 h-4" />
                          )}
                        </div>
                        <span className="font-semibold">{asset.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">{asset.type}</td>
                    <td className="px-6 py-4 text-sm font-mono">{asset.serialNumber}</td>
                    <td className="px-6 py-4">{getStatusBadge(asset.status)}</td>
                    <td className="px-6 py-4 text-sm font-medium">{getOwnerName(asset.assignedToId)}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2" onClick={(event) => event.stopPropagation()}>
                        {can('hardware.edit') && (
                          <Button variant="outline" onClick={() => openEdit(asset)} className="px-3! py-2!">
                            Edit
                          </Button>
                        )}
                        {can('hardware.delete') && (
                          <Button variant="danger" onClick={() => confirmDelete(asset)} className="px-3! py-2!">
                            Delete
                          </Button>
                        )}
                      </div>
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
        title={isAddMode ? 'Add New Asset' : isEditMode ? 'Edit Asset' : selectedAsset ? 'Asset Details' : ''}
      >
        {isAddMode || isEditMode ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Asset Name <span className="text-destructive">*</span></label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-accent p-2.5 rounded-xl border-none outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="e.g. MacBook Pro 14"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Serial Number</label>
              <input
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                className="w-full bg-accent p-2.5 rounded-xl border-none outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Auto-generated if empty"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <CustomSelect
                value={type}
                onChange={(val) => setType(val)}
                options={[
                  { value: 'Laptop', label: 'Laptop' },
                  { value: 'Monitor', label: 'Monitor' },
                  { value: 'Mobile', label: 'Mobile' },
                  { value: 'Accessory', label: 'Accessory' },
                ]}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Assign to employee</label>
              <CustomSelect
                value={assigneeId}
                onChange={(val) => setAssigneeId(val)}
                placeholder="Select assignee or leave unassigned..."
                options={[
                  { value: '', label: 'Unassigned (Available)' },
                  ...employees.map((employee) => ({ value: employee.id, label: employee.name })),
                ]}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Device Password / PIN</label>
              <PasswordInput
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isEditMode ? 'Optional - enter only to reset credential' : 'Optional - device login credential'}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-accent p-2.5 rounded-xl border-none outline-none focus:ring-2 focus:ring-primary/20 resize-none h-20"
                placeholder="Optional - storage location, condition, etc."
              />
            </div>
            {formError && <p className="text-sm text-destructive">{formError}</p>}
            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1" onClick={resetForm}>Cancel</Button>
              <Button
                className="flex-1"
                onClick={isAddMode ? handleCreate : handleEdit}
                disabled={createHardwareMutation.isPending || updateHardwareMutation.isPending || !name.trim()}
              >
                {createHardwareMutation.isPending || updateHardwareMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                  </>
                ) : isAddMode ? (
                  'Create Asset'
                ) : (
                  'Update Asset'
                )}
              </Button>
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
                <CredentialField
                  label="Device Password"
                  value={revealedHwCreds?.password ?? selectedAsset.credentials.password}
                  onReveal={can('vault.reveal_passwords') ? async () => {
                    const revealed = await revealHardwareMutation.mutateAsync(selectedAsset.id);
                    setRevealedHwCreds(revealed);
                  } : undefined}
                />
                {selectedAsset.credentials.pin && (
                  <CredentialField
                    label="PIN"
                    value={revealedHwCreds?.pin ?? selectedAsset.credentials.pin}
                    onReveal={can('vault.reveal_passwords') ? async () => {
                      const revealed = await revealHardwareMutation.mutateAsync(selectedAsset.id);
                      setRevealedHwCreds(revealed);
                    } : undefined}
                  />
                )}
              </div>
            )}

            <div className="flex gap-3 pt-4">
              {can('hardware.delete') && (
                <Button
                  variant="danger"
                  className="flex-1"
                  onClick={() => confirmDelete(selectedAsset)}
                  disabled={deleteHardwareMutation.isPending}
                >
                  <Trash2 className="w-4 h-4" /> Delete Asset
                </Button>
              )}
              {can('hardware.edit') && (
                <Button variant="outline" className="flex-1" onClick={() => openEdit(selectedAsset)}>
                  Edit
                </Button>
              )}
              <Button variant="outline" className="flex-1" onClick={resetForm}>Close</Button>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Hardware"
      >
        {deleteTarget && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete <span className="font-semibold text-foreground">{deleteTarget.name}</span>? This action cannot be undone.
            </p>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setDeleteTarget(null)}>
                Cancel
              </Button>
              <Button variant="danger" className="flex-1" onClick={() => void handleDelete()} disabled={deleteHardwareMutation.isPending}>
                {deleteHardwareMutation.isPending ? (
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
