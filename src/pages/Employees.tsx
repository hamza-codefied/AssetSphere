import { useState, type ReactElement } from 'react';
import { Card, Badge, Button, Modal, CustomSelect } from '../components/ui';
import {
  UserPlus, Briefcase, ChevronRight, Phone, Building, Mail,
  LogOut, Monitor, HardDrive, Wrench, Check, ChevronLeft, ChevronRight as ChevronRightIcon,
  AlertTriangle, ClipboardList, ShieldOff, Package, FileText, Loader2, Eye, EyeOff, Pencil, Trash2
} from 'lucide-react';

import type { Employee, HardwareAsset, SoftwareTool, EmployeeRole } from '../types';
import { useSystemState } from '../hooks/useSystemState';
import { useAuth } from '../auth/AuthContext';
import { FolderOpen, CreditCard } from 'lucide-react';
import {
  useCreateEmployeeMutation,
  useDeleteEmployeeMutation,
  useEmployeesQuery,
  useOffboardEmployeeMutation,
  useUpdateEmployeeMutation,
} from '../api/employees';
import { useHardwareQuery } from '../api/hardware';
import { useToolsQuery } from '../api/tools';
import type { AssignableEmployeeRole } from '../api/employees';
import { toApiError } from '../api/client';
import { roleConfig } from '../auth/permissions';

// ---- Offboarding checklist definition ----
interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  icon: ReactElement;
  required: boolean;
}

type ToastType = 'success' | 'error';
interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}

const CHECKLIST_ITEMS: ChecklistItem[] = [
  { id: 'exit_interview',   label: 'Exit Interview Conducted',       description: 'HR has completed the exit interview with the employee.',          icon: <FileText className="w-4 h-4" />,    required: true  },
  { id: 'knowledge_transfer', label: 'Knowledge Transfer Complete',   description: 'All ongoing work, docs, and context handed off to team.',         icon: <ClipboardList className="w-4 h-4" />, required: true  },
  { id: 'email_archived',   label: 'Corporate Email Archived',       description: 'Mailbox archived or forwarded; corporate email access removed.',   icon: <Mail className="w-4 h-4" />,         required: false },
  { id: 'badge_returned',   label: 'Badge / Keycard Returned',       description: 'Physical access card or door badge has been returned to IT.',       icon: <ShieldOff className="w-4 h-4" />,    required: true  },
  { id: 'credit_card',      label: 'Company Credit Card Deactivated', description: 'Any corporate cards or expense accounts have been deactivated.',   icon: <AlertTriangle className="w-4 h-4" />, required: false },
  { id: 'payroll_final',    label: 'Final Payroll Processed',        description: 'Last paycheck, PTO payout and bonuses have been finalised.',        icon: <FileText className="w-4 h-4" />,    required: false },
  { id: 'nda_docs',         label: 'NDA / Legal Docs Acknowledged',  description: 'Employee reminded of NDA, IP, and confidentiality obligations.',    icon: <ClipboardList className="w-4 h-4" />, required: false },
  { id: 'slack_removed',    label: 'Internal Comms Revoked',         description: 'Slack / Teams / Discord workspace access removed.',                 icon: <ShieldOff className="w-4 h-4" />,    required: false },
];

type OffboardStep = 1 | 2 | 3 | 4 | 5;

const STEP_LABELS: Record<OffboardStep, string> = {
  1: 'Overview',
  2: 'Return Hardware',
  3: 'Revoke Access',
  4: 'Projects & Subs',
  5: 'Final Checklist',
};

export const Employees = ({ state }: { state: ReturnType<typeof useSystemState> }) => {
  // Hardware + employees are API-backed. Tools/subscriptions/projects remain mock-backed
  // until those modules are integrated.
  const { subscriptions, projects } = state;
  const { can, user } = useAuth();

  const employeesQuery = useEmployeesQuery();
  const hardwareQuery = useHardwareQuery();
  const toolsQuery = useToolsQuery();
  const employees: Employee[] = employeesQuery.data ?? [];
  const visibleEmployees = employees.filter(
    (emp) => emp.id !== user?.id && emp.email !== user?.email,
  );
  const hardware: HardwareAsset[] = hardwareQuery.data ?? [];
  const tools: SoftwareTool[] = toolsQuery.data ?? [];
  const createEmployeeMutation = useCreateEmployeeMutation();
  const updateEmployeeMutation = useUpdateEmployeeMutation();
  const offboardEmployeeMutation = useOffboardEmployeeMutation();
  const deleteEmployeeMutation = useDeleteEmployeeMutation();

  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddMode, setIsAddMode] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isOffboardingOpen, setIsOffboardingOpen] = useState(false);
  const [offboardTarget, setOffboardTarget] = useState<Employee | null>(null);

  const DEFAULT_ROLE: AssignableEmployeeRole = 'dev';
  const DEFAULT_DEPARTMENT = 'Engineering';

  // Onboard form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [accessRole, setAccessRole] = useState<AssignableEmployeeRole>(DEFAULT_ROLE);
  const [department, setDepartment] = useState(DEFAULT_DEPARTMENT);
  const [phone, setPhone] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Offboard wizard state
  const [offboardStep, setOffboardStep] = useState<OffboardStep>(1);
  const [returnedHwIds, setReturnedHwIds] = useState<Set<string>>(new Set());
  const [revokedToolIds, setRevokedToolIds] = useState<Set<string>>(new Set());
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});
  const [offboardNotes, setOffboardNotes] = useState('');
  const [offboardError, setOffboardError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);

  const resetForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setShowPassword(false);
    setAccessRole(DEFAULT_ROLE);
    setDepartment(DEFAULT_DEPARTMENT);
    setPhone('');
    setFormError(null);
    setIsAddMode(false);
    setIsEditMode(false);
    setIsModalOpen(false);
    setSelectedEmployee(null);
  };

  const roleLabel = (r: EmployeeRole): string => roleConfig[r]?.label ?? r;
  const roleBadgeClasses = (r: EmployeeRole): string => roleConfig[r]?.color ?? 'bg-slate-500/10 text-slate-500';
  const pushToast = (type: ToastType, message: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3000);
  };

  const openOffboarding = (emp: Employee) => {
    setOffboardTarget(emp);
    setOffboardStep(1);
    setReturnedHwIds(new Set());
    setRevokedToolIds(new Set());
    setChecklist({});
    setOffboardNotes('');
    setOffboardError(null);
    setIsModalOpen(false);
    setIsOffboardingOpen(true);
  };

  const closeOffboarding = () => {
    setIsOffboardingOpen(false);
    setOffboardTarget(null);
    setOffboardError(null);
  };

  const handleAdd = async () => {
    if (!name.trim() || !email.trim() || password.length < 6) {
      setFormError('Name, email and a password (min 6 chars) are required.');
      return;
    }
    setFormError(null);
    try {
      await createEmployeeMutation.mutateAsync({
        name: name.trim(),
        email: email.trim(),
        password,
        role: accessRole,
        department: department || undefined,
        phone: phone || undefined,
      });
      resetForm();
      pushToast('success', 'Employee created successfully.');
    } catch (error) {
      setFormError(toApiError(error));
      pushToast('error', toApiError(error));
    }
  };

  const openEdit = (emp: Employee) => {
    setSelectedEmployee(emp);
    setName(emp.name);
    setEmail(emp.email);
    setPassword('');
    setShowPassword(false);
    setAccessRole(emp.role === 'pmo' ? 'pmo' : 'dev');
    setDepartment(emp.department ?? DEFAULT_DEPARTMENT);
    setPhone(emp.phone ?? '');
    setFormError(null);
    setIsAddMode(false);
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleEdit = async () => {
    if (!selectedEmployee) return;
    if (!name.trim() || !email.trim()) {
      setFormError('Name and email are required.');
      return;
    }
    if (password && password.length < 6) {
      setFormError('If provided, password must be at least 6 characters.');
      return;
    }

    setFormError(null);
    try {
      await updateEmployeeMutation.mutateAsync({
        id: selectedEmployee.id,
        payload: {
          name: name.trim(),
          email: email.trim(),
          role: accessRole,
          department: department || undefined,
          phone: phone || undefined,
          ...(password ? { password } : {}),
        },
      });
      resetForm();
      pushToast('success', 'Employee updated successfully.');
    } catch (error) {
      setFormError(toApiError(error));
      pushToast('error', toApiError(error));
    }
  };

  const openDeleteConfirm = (emp: Employee) => {
    if (emp.role === 'admin') return;
    setDeleteTarget(emp);
  };

  const closeDeleteConfirm = () => {
    setDeleteTarget(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await deleteEmployeeMutation.mutateAsync(deleteTarget.id);
      if (selectedEmployee?.id === deleteTarget.id) resetForm();
      pushToast('success', `Employee "${deleteTarget.name}" deleted.`);
      closeDeleteConfirm();
    } catch (error) {
      pushToast('error', toApiError(error));
    }
  };

  const getAssignedHardware = (empId: string): HardwareAsset[] => hardware.filter(h => h.assignedToId === empId);
  const getAssignedTools = (empId: string): SoftwareTool[] => tools.filter(t => t.assignedToId === empId);
  const getAssignedSubscriptions = (empId: string) => subscriptions.filter(s => s.assignedToIds?.includes(empId));
  const getAssignedProjects = (empId: string) => projects.filter(p => p.members.some(m => m.employeeId === empId));

  const requiredChecks = CHECKLIST_ITEMS.filter(c => c.required);
  const allRequiredDone = requiredChecks.every(c => checklist[c.id]);
  const totalChecked = CHECKLIST_ITEMS.filter(c => checklist[c.id]).length;

  const canCompleteOffboard = (): boolean => {
    if (!offboardTarget) return false;
    const hw = getAssignedHardware(offboardTarget.id);
    const tl = getAssignedTools(offboardTarget.id);
    const allHwReturned = hw.every(h => returnedHwIds.has(h.id));
    const allToolsRevoked = tl.every(t => revokedToolIds.has(t.id));
    return allHwReturned && allToolsRevoked && allRequiredDone;
  };

  const totalOffboardSteps = 5 as const;

  const handleCompleteOffboard = async () => {
    if (!offboardTarget) return;
    setOffboardError(null);
    try {
      await offboardEmployeeMutation.mutateAsync({
        id: offboardTarget.id,
        notes: offboardNotes.trim() || undefined,
      });
      closeOffboarding();
      pushToast('success', 'Employee offboarded successfully.');
    } catch (error) {
      setOffboardError(toApiError(error));
      pushToast('error', toApiError(error));
    }
  };

  const handleReactivate = async (emp: Employee) => {
    try {
      await updateEmployeeMutation.mutateAsync({
        id: emp.id,
        payload: { status: 'Active', isActive: true },
      });
      resetForm();
      pushToast('success', `Employee "${emp.name}" reactivated.`);
    } catch (error) {
      pushToast('error', toApiError(error));
    }
  };

  const toggleHw = (id: string) =>
    setReturnedHwIds(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  const toggleTool = (id: string) =>
    setRevokedToolIds(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  const toggleCheck = (id: string) =>
    setChecklist(prev => ({ ...prev, [id]: !prev[id] }));

  const StepDot = ({ step }: { step: OffboardStep }) => {
    const current = step === offboardStep;
    const done = step < offboardStep;
    return (
      <div className="flex flex-col items-center gap-1">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all
          ${done ? 'bg-emerald-500 border-emerald-500 text-white' : current ? 'bg-rose-500 border-rose-500 text-white' : 'bg-accent border-border text-muted-foreground'}`}>
          {done ? <Check className="w-4 h-4" /> : step}
        </div>
        <span className={`text-[10px] font-bold uppercase tracking-wider ${current ? 'text-rose-500' : done ? 'text-emerald-600' : 'text-muted-foreground'}`}>
          {STEP_LABELS[step]}
        </span>
      </div>
    );
  };

  const hwTypeIcon = (type: string) =>
    type === 'Laptop' ? <Monitor className="w-4 h-4" /> : type === 'Mobile' ? <Phone className="w-4 h-4" /> : <HardDrive className="w-4 h-4" />;

  return (
    <div className="space-y-6">
      {toasts.length > 0 && (
        <div className="fixed top-4 right-4 z-70 flex flex-col gap-2 w-[320px]">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`rounded-xl border px-4 py-3 text-sm shadow-lg backdrop-blur-sm ${
                toast.type === 'success'
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700'
                  : 'border-rose-500/30 bg-rose-500/10 text-rose-600'
              }`}
            >
              {toast.message}
            </div>
          ))}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Employees</h1>
          <p className="text-muted-foreground">Directory of team members and their assigned resources.</p>
        </div>
        {can('employees.create') && (
          <Button onClick={() => { setIsAddMode(true); setIsEditMode(false); setIsModalOpen(true); }}>
            <UserPlus className="w-4 h-4" />
            Onboard Employee
          </Button>
        )}
      </div>

      {employeesQuery.isError && (
        <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/5 text-sm text-rose-500">
          Failed to load employees: {toApiError(employeesQuery.error)}
        </div>
      )}

      {/* Table */}
      <Card className="p-0 overflow-hidden shadow-premium">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-accent/50 border-b">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Name</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Department / Role</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground text-center">Hardware</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground text-center">Tools</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Status</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {employeesQuery.isLoading && visibleEmployees.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading employees...</span>
                  </td>
                </tr>
              )}
              {!employeesQuery.isLoading && visibleEmployees.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-sm text-muted-foreground">
                    No other employees found.
                  </td>
                </tr>
              )}
              {visibleEmployees.map((emp) => (
                <tr
                  key={emp.id}
                  className="hover:bg-accent/30 transition-all group cursor-pointer"
                  onClick={() => { setSelectedEmployee(emp); setIsAddMode(false); setIsEditMode(false); setIsModalOpen(true); }}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold border group-hover:border-primary/50 transition-all
                        ${emp.status === 'Inactive' ? 'bg-rose-50 text-rose-400 border-rose-200' : 'bg-slate-100 text-slate-500'}`}>
                        {emp.name.charAt(0)}
                      </div>
                      <div>
                        <span className={`font-bold block text-sm ${emp.status === 'Inactive' ? 'line-through text-muted-foreground' : ''}`}>{emp.name}</span>
                        <span className="text-xs text-muted-foreground block truncate max-w-[150px]">{emp.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <Building className="w-3 h-3 text-muted-foreground" />
                        <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">{emp.department || 'General'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-3.5 h-3.5 text-primary/70" />
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${roleBadgeClasses(emp.role)}`}>
                          {roleLabel(emp.role)}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-blue-50 text-blue-600 text-[11px] font-bold border border-blue-200">
                      {getAssignedHardware(emp.id).length}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 text-[11px] font-bold border border-indigo-200">
                      {getAssignedTools(emp.id).length}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <Badge variant={emp.status === 'Active' ? 'success' : 'danger'}>{emp.status}</Badge>
                      {emp.status === 'Inactive' && emp.offboardedAt && (
                        <span className="text-[10px] text-muted-foreground">Off: {emp.offboardedAt}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      {can('employees.edit') && (
                        <button
                          onClick={(e) => { e.stopPropagation(); openEdit(emp); }}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border bg-accent/40 hover:bg-accent transition-colors"
                          title="Edit employee"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          Edit
                        </button>
                      )}
                      {can('employees.deactivate') && emp.role !== 'admin' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); openDeleteConfirm(emp); }}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-rose-500/20 bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 transition-colors"
                          title="Delete employee"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete
                        </button>
                      )}
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform inline self-center" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ---- Profile Modal ---- */}
      <Modal isOpen={isModalOpen} onClose={resetForm} title={isAddMode ? 'Onboard New Employee' : isEditMode ? 'Edit Employee' : 'Employee Profile'}>
        {isAddMode || isEditMode ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Full Name <span className="text-destructive">*</span></label>
              <input value={name} onChange={e => setName(e.target.value)} className="w-full bg-accent p-2.5 rounded-xl border-none outline-none focus:ring-2 focus:ring-primary/20" placeholder="e.g. Alice Smith" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Work Email <span className="text-destructive">*</span></label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="off"
                className="w-full bg-accent p-2.5 rounded-xl border-none outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="e.g. alice@company.com"
              />
              <p className="text-[11px] text-muted-foreground">This email will be the employee's login.</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {isEditMode ? 'Reset Password (Optional)' : 'Initial Password'}
                {!isEditMode && <span className="text-destructive"> *</span>}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="new-password"
                  className="w-full bg-accent p-2.5 pr-10 rounded-xl border-none outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder={isEditMode ? 'Leave empty to keep current password' : 'Minimum 6 characters'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute inset-y-0 right-2 flex items-center text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                {isEditMode
                  ? 'Fill only if admin wants to reset the employee password.'
                  : 'Share this with the employee so they can log in and change it later.'}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Access Role <span className="text-destructive">*</span></label>
                <CustomSelect
                  value={accessRole}
                  onChange={val => setAccessRole(val as AssignableEmployeeRole)}
                  options={[
                    { value: 'pmo', label: 'Project Manager (PMO)' },
                    { value: 'dev', label: 'Developer (Dev)' },
                  ]}
                />
                <p className="text-[11px] text-muted-foreground">Controls what the employee can see and do.</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Department</label>
                <CustomSelect value={department} onChange={val => setDepartment(val)} options={[
                  { value: 'Engineering', label: 'Engineering' },
                  { value: 'Project Management', label: 'Project Management' },
                  { value: 'Design', label: 'Design' },
                  { value: 'DevOps', label: 'DevOps' },
                  { value: 'Operations', label: 'Operations' },
                  { value: 'People Ops', label: 'People Ops' },
                ]} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Phone Number (Optional)</label>
              <input value={phone} onChange={e => setPhone(e.target.value)} className="w-full bg-accent p-2.5 rounded-xl border-none outline-none focus:ring-2 focus:ring-primary/20" placeholder="e.g. +1 (555) 000-0000" />
            </div>
            {formError && (
              <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/5 text-xs text-rose-500">
                {formError}
              </div>
            )}
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={resetForm}
                disabled={createEmployeeMutation.isPending || updateEmployeeMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={isEditMode ? handleEdit : handleAdd}
                disabled={
                  createEmployeeMutation.isPending ||
                  updateEmployeeMutation.isPending ||
                  !name.trim() ||
                  !email.trim() ||
                  (!isEditMode && password.length < 6) ||
                  (isEditMode && password.length > 0 && password.length < 6)
                }
              >
                {createEmployeeMutation.isPending || updateEmployeeMutation.isPending ? (
                  <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> {isEditMode ? 'Saving...' : 'Creating...'}</span>
                ) : (
                  isEditMode ? 'Save Changes' : 'Complete Onboarding'
                )}
              </Button>
            </div>
          </div>
        ) : selectedEmployee ? (
          <div className="space-y-6">
            <div className="flex items-center gap-5 pb-6 border-b">
              <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-bold border shadow-inner
                ${selectedEmployee.status === 'Inactive' ? 'bg-rose-50 text-rose-400 border-rose-200' : 'bg-slate-100 text-slate-500'}`}>
                {selectedEmployee.name.charAt(0)}
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold leading-tight">{selectedEmployee.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="info">{selectedEmployee.department || 'General'}</Badge>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${roleBadgeClasses(selectedEmployee.role)}`}>
                    {roleLabel(selectedEmployee.role)}
                  </span>
                </div>
                {selectedEmployee.status === 'Inactive' && selectedEmployee.offboardedAt && (
                  <p className="text-xs text-rose-500 font-medium mt-1">Offboarded on {selectedEmployee.offboardedAt}</p>
                )}
              </div>
              <Badge variant={selectedEmployee.status === 'Active' ? 'success' : 'danger'}>{selectedEmployee.status}</Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground border-b pb-2 flex items-center gap-2">
                  <UserPlus className="w-3.5 h-3.5" /> Contact Info
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-primary/60" />
                    <span className="text-sm">{selectedEmployee.email}</span>
                  </div>
                  {selectedEmployee.phone ? (
                    <div className="flex items-center gap-3">
                      <Phone className="w-4 h-4 text-primary/60" />
                      <span className="text-sm">{selectedEmployee.phone}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 italic text-muted-foreground">
                      <Phone className="w-4 h-4 opacity-50" />
                      <span className="text-sm">No phone listed</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground border-b pb-2 flex items-center gap-2">
                  <Building className="w-3.5 h-3.5" /> Organization
                </h3>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-50">Department</p>
                  <p className="text-sm font-semibold">{selectedEmployee.department || 'Technology'}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground border-b pb-2">Assigned Inventory</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-accent/30 rounded-2xl p-4 border border-accent/50">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-3">Hardware</span>
                  <ul className="space-y-2">
                    {getAssignedHardware(selectedEmployee.id).map(h => (
                      <li key={h.id} className="text-[11px] bg-slate-800 p-2.5 rounded-xl border flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                          <span className="font-medium">{h.name}</span>
                        </div>
                        <span className="opacity-50 font-mono text-[10px]">{h.serialNumber}</span>
                      </li>
                    ))}
                    {getAssignedHardware(selectedEmployee.id).length === 0 && <p className="text-xs italic text-muted-foreground py-2">No hardware assigned.</p>}
                  </ul>
                </div>
                <div className="bg-accent/30 rounded-2xl p-4 border border-accent/50">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-3">Tools / Access</span>
                  <div className="flex flex-wrap gap-2">
                    {getAssignedTools(selectedEmployee.id).map(t => (
                      <Badge key={t.id} variant="info" className="px-2 py-1 text-[10px] font-bold">{t.name}</Badge>
                    ))}
                    {getAssignedTools(selectedEmployee.id).length === 0 && <p className="text-xs italic text-muted-foreground py-2">No tools assigned.</p>}
                  </div>
                </div>
              </div>
            </div>

            {selectedEmployee.status === 'Inactive' && selectedEmployee.offboardNotes && (
              <div className="p-3 bg-rose-500/10 rounded-xl border border-rose-500/20">
                <p className="text-xs font-bold text-rose-600 uppercase tracking-widest mb-1">Offboarding Notes</p>
                <p className="text-sm text-rose-300">{selectedEmployee.offboardNotes}</p>
              </div>
            )}

            <div className="flex gap-3 pt-4 border-t">
              <Button variant="outline" className="flex-1" onClick={resetForm}>Close</Button>
              {can('employees.deactivate') && selectedEmployee.status === 'Inactive' && selectedEmployee.role !== 'admin' && (
                <Button
                  variant="success"
                  className="flex-1"
                  disabled={updateEmployeeMutation.isPending}
                  onClick={() => handleReactivate(selectedEmployee)}
                >
                  {updateEmployeeMutation.isPending ? 'Reactivating...' : 'Reactivate'}
                </Button>
              )}
              {can('employees.offboard') && selectedEmployee.status === 'Active' && selectedEmployee.role !== 'admin' && (
                <Button
                  variant="danger"
                  className="flex-1"
                  onClick={() => openOffboarding(selectedEmployee)}
                >
                  <LogOut className="w-4 h-4" /> Begin Offboarding
                </Button>
              )}
            </div>
          </div>
        ) : null}
      </Modal>

      {/* ---- Offboarding Wizard Modal ---- */}
      {offboardTarget && (
        <Modal isOpen={isOffboardingOpen} onClose={closeOffboarding} title="" size="lg">
          <div className="space-y-6">

            {/* Warning header */}
            <div className="flex items-start gap-4 p-4 rounded-2xl bg-rose-500/5 border border-rose-500/20">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
                <LogOut className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-rose-600">Offboarding: {offboardTarget.name}</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {roleLabel(offboardTarget.role)} · {offboardTarget.department || 'General'} · {offboardTarget.email}
                </p>
              </div>
            </div>

            {/* Progress stepper */}
            <div className="flex items-start justify-between relative">
              <div className="absolute top-4 left-0 right-0 h-px bg-border mx-8" />
              {([1, 2, 3, 4, 5] as OffboardStep[]).map(s => <StepDot key={s} step={s} />)}
            </div>

            {/* Step content */}
            <div className="min-h-[260px]">

              {/* Step 1 — Overview */}
              {offboardStep === 1 && (
                <div className="space-y-4">
                  <p className="text-sm font-semibold">This wizard will guide you through a complete offboarding process. The following steps will be performed:</p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { icon: <Package className="w-5 h-5 text-blue-500" />,  title: 'Recover Hardware', desc: `${getAssignedHardware(offboardTarget.id).length} asset(s) to return`, color: 'bg-blue-500/5 border-blue-500/20' },
                      { icon: <Wrench className="w-5 h-5 text-indigo-500" />,  title: 'Revoke Access',    desc: `${getAssignedTools(offboardTarget.id).length} tool(s) to revoke`,  color: 'bg-indigo-500/5 border-indigo-500/20' },
                      { icon: <FolderOpen className="w-5 h-5 text-orange-500" />, title: 'Projects & Subs', desc: `${getAssignedProjects(offboardTarget.id).length} projects, ${getAssignedSubscriptions(offboardTarget.id).length} subs`, color: 'bg-orange-500/5 border-orange-500/20' },
                      { icon: <ClipboardList className="w-5 h-5 text-amber-500" />, title: 'Final Checklist', desc: `${CHECKLIST_ITEMS.length} items to confirm`,                  color: 'bg-amber-500/5 border-amber-500/20' },
                    ].map(item => (
                      <div key={item.title} className={`rounded-2xl border p-4 flex flex-col items-center gap-2 text-center ${item.color}`}>
                        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                          {item.icon}
                        </div>
                        <p className="text-sm font-bold">{item.title}</p>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                    ))}
                  </div>

                  <div className="p-3 rounded-xl border bg-amber-500/5 border-amber-500/20 flex items-start gap-3">
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-400">
                      Completing this process will mark the employee as <strong>Inactive</strong>, unassign all hardware and tools, and cannot be undone without manual reactivation.
                    </p>
                  </div>
                </div>
              )}

              {/* Step 2 — Hardware Return */}
              {offboardStep === 2 && (() => {
                const hw = getAssignedHardware(offboardTarget.id);
                return (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Confirm that each hardware asset has been physically returned. Click <strong>Mark Returned</strong> for each item.
                    </p>
                    {hw.length === 0 ? (
                      <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                          <Check className="w-6 h-6" />
                        </div>
                        <p className="text-sm font-semibold text-emerald-600">No hardware assigned</p>
                        <p className="text-xs text-muted-foreground">Nothing to return — you can proceed.</p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-52 overflow-y-auto pr-1 custom-scrollbar">
                        {hw.map(asset => {
                          const returned = returnedHwIds.has(asset.id);
                          return (
                            <div key={asset.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all
                              ${returned ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-accent/40 border-accent'}`}>
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0
                                ${returned ? 'bg-emerald-500/10 text-emerald-600' : 'bg-blue-500/10 text-blue-600'}`}>
                                {hwTypeIcon(asset.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold truncate">{asset.name}</p>
                                <p className="text-xs text-muted-foreground font-mono">{asset.serialNumber} · {asset.type}</p>
                              </div>
                              <button
                                onClick={() => toggleHw(asset.id)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all
                                  ${returned
                                    ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 hover:bg-emerald-500/20'
                                    : 'bg-rose-500/10 text-rose-600 border border-rose-500/20 hover:bg-rose-500/20'}`}
                              >
                                {returned ? <span className="flex items-center gap-1"><Check className="w-3 h-3" /> Returned</span> : 'Mark Returned'}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {hw.length > 0 && (
                      <p className="text-xs text-muted-foreground pt-1">
                        {returnedHwIds.size}/{hw.length} returned
                      </p>
                    )}
                  </div>
                );
              })()}

              {/* Step 3 — Revoke Access */}
              {offboardStep === 3 && (() => {
                const tl = getAssignedTools(offboardTarget.id);
                return (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Revoke all software and tool access assigned to this employee.
                    </p>
                    {tl.length === 0 ? (
                      <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                          <Check className="w-6 h-6" />
                        </div>
                        <p className="text-sm font-semibold text-emerald-600">No tools assigned</p>
                        <p className="text-xs text-muted-foreground">No access to revoke — you can proceed.</p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-52 overflow-y-auto pr-1 custom-scrollbar">
                        {tl.map(tool => {
                          const revoked = revokedToolIds.has(tool.id);
                          return (
                            <div key={tool.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all
                              ${revoked ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-accent/40 border-accent'}`}>
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold
                                ${revoked ? 'bg-emerald-500/10 text-emerald-600' : 'bg-indigo-500/10 text-indigo-600'}`}>
                                {revoked ? <Check className="w-4 h-4" /> : tool.name.charAt(0)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold">{tool.name}</p>
                                <p className="text-xs text-muted-foreground">{tool.status} · {tool.linkedAccountId ? 'Linked Account' : 'Manual Login'}</p>
                              </div>
                              <button
                                onClick={() => toggleTool(tool.id)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all
                                  ${revoked
                                    ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 hover:bg-emerald-500/20'
                                    : 'bg-rose-500/10 text-rose-600 border border-rose-500/20 hover:bg-rose-500/20'}`}
                              >
                                {revoked ? <span className="flex items-center gap-1"><Check className="w-3 h-3" /> Revoked</span> : 'Revoke Access'}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {tl.length > 0 && (
                      <p className="text-xs text-muted-foreground pt-1">
                        {revokedToolIds.size}/{tl.length} revoked
                      </p>
                    )}
                  </div>
                );
              })()}

              {/* Step 4 — Projects & Subscriptions */}
              {offboardStep === 4 && (() => {
                const empProjects = getAssignedProjects(offboardTarget.id);
                const empSubs = getAssignedSubscriptions(offboardTarget.id);
                return (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">Review all projects and subscriptions this employee is part of. They will be automatically removed from all upon completion.</p>
                    <div className="space-y-3">
                      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2"><FolderOpen className="w-3.5 h-3.5" /> Assigned Projects ({empProjects.length})</p>
                      {empProjects.length === 0 ? (
                        <p className="text-xs italic text-muted-foreground px-2">No active project assignments.</p>
                      ) : (
                        <div className="space-y-2">
                          {empProjects.map(p => {
                            const role = p.members.find(m => m.employeeId === offboardTarget.id)?.role;
                            return (
                              <div key={p.id} className="flex items-center justify-between p-3 bg-accent/40 rounded-xl border text-sm">
                                <div><p className="font-semibold">{p.name}</p><p className="text-xs text-muted-foreground">{p.clientName}</p></div>
                                <span className="text-xs font-bold text-muted-foreground">{role}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    <div className="space-y-3">
                      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2"><CreditCard className="w-3.5 h-3.5" /> Individual Subscriptions ({empSubs.length})</p>
                      {empSubs.length === 0 ? (
                        <p className="text-xs italic text-muted-foreground px-2">No individual subscriptions assigned.</p>
                      ) : (
                        <div className="space-y-2">
                          {empSubs.map(s => (
                            <div key={s.id} className="flex items-center justify-between p-3 bg-accent/40 rounded-xl border text-sm">
                              <div><p className="font-semibold">{s.name}</p><p className="text-xs text-muted-foreground">{s.vendor}</p></div>
                              <Badge variant={s.status === 'Active' ? 'success' : 'warning'}>{s.status}</Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/20 flex items-start gap-3">
                      <AlertTriangle className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                      <p className="text-xs text-blue-400">The employee will be removed from all project teams and individual subscription assignments automatically.</p>
                    </div>
                  </div>
                );
              })()}

              {/* Step 5 — Final Checklist */}
              {offboardStep === 5 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Complete all required items (<span className="text-rose-500 font-semibold">*</span>) before confirming offboarding.</p>
                    <span className="text-xs font-bold text-muted-foreground">{totalChecked}/{CHECKLIST_ITEMS.length}</span>
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                    {CHECKLIST_ITEMS.map(item => {
                      const done = !!checklist[item.id];
                      return (
                        <label
                          key={item.id}
                          className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all
                            ${done ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-accent/40 border-accent hover:border-border'}`}
                        >
                          <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all
                            ${done ? 'bg-emerald-500 border-emerald-500' : 'border-border bg-background'}`}>
                            {done && <Check className="w-3 h-3 text-white" />}
                          </div>
                          <input type="checkbox" checked={done} onChange={() => toggleCheck(item.id)} className="sr-only" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={`text-sm font-semibold ${done ? 'line-through text-muted-foreground' : ''}`}>
                                {item.label}
                                {item.required && <span className="text-rose-500 ml-1 no-underline" style={{ textDecoration: 'none' }}>*</span>}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                          </div>
                        </label>
                      );
                    })}
                  </div>

                  <div className="space-y-2 pt-2 border-t">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Offboarding Notes (Optional)</label>
                    <textarea
                      value={offboardNotes}
                      onChange={e => setOffboardNotes(e.target.value)}
                      className="w-full bg-accent p-2.5 rounded-xl border-none outline-none focus:ring-2 focus:ring-primary/20 resize-none h-16 text-sm"
                      placeholder="e.g. Reason for departure, outstanding tasks, etc."
                    />
                  </div>

                  {!allRequiredDone && (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                      <p className="text-xs text-amber-400">
                        Complete all required items (<span className="font-bold">{requiredChecks.filter(c => !checklist[c.id]).length} remaining</span>) before finalising.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {offboardError && (
              <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/5 text-xs text-rose-500">
                {offboardError}
              </div>
            )}

            {/* Footer navigation */}
            <div className="flex gap-3 pt-2 border-t">
              <Button variant="outline" onClick={closeOffboarding} className="flex-none" disabled={offboardEmployeeMutation.isPending}>Cancel</Button>
              <div className="flex-1" />
              {offboardStep > 1 && (
                <Button variant="outline" onClick={() => setOffboardStep((offboardStep - 1) as OffboardStep)} disabled={offboardEmployeeMutation.isPending}>
                  <ChevronLeft className="w-4 h-4" /> Back
                </Button>
              )}
              {offboardStep < totalOffboardSteps ? (
                <Button onClick={() => setOffboardStep((offboardStep + 1) as OffboardStep)}>
                  Next <ChevronRightIcon className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  variant="danger"
                  disabled={!canCompleteOffboard() || offboardEmployeeMutation.isPending}
                  onClick={handleCompleteOffboard}
                >
                  {offboardEmployeeMutation.isPending ? (
                    <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Offboarding...</span>
                  ) : (
                    <><LogOut className="w-4 h-4" /> Confirm Offboarding</>
                  )}
                </Button>
              )}
            </div>
          </div>
        </Modal>
      )}

      <Modal
        isOpen={Boolean(deleteTarget)}
        onClose={closeDeleteConfirm}
        title="Delete Employee"
      >
        {deleteTarget && (
          <div className="space-y-5">
            <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/5 text-sm text-rose-600">
              This action permanently deletes <strong>{deleteTarget.name}</strong>.
            </div>
            <p className="text-sm text-muted-foreground">
              This cannot be undone. Are you sure you want to continue?
            </p>
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={closeDeleteConfirm}
                disabled={deleteEmployeeMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                className="flex-1"
                onClick={handleDeleteConfirm}
                disabled={deleteEmployeeMutation.isPending}
              >
                {deleteEmployeeMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deleting...
                  </span>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete Employee
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
