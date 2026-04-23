import { useState, type ReactElement } from 'react';
import { Card, Badge, Button, Modal, CustomSelect, PasswordInput, CredentialField } from '../components/ui';
import {
  Plus, CreditCard, RefreshCw, Trash2, AlertTriangle, Search,
  Calendar, Users, Building, DollarSign, Clock, Link as LinkIcon
} from 'lucide-react';
import type { Subscription, SubscriptionStatus, BillingCycle, AssignmentScope } from '../types';
import { useSystemState } from '../hooks/useSystemState';
import { useAuth } from '../auth/AuthContext';
import { toApiError } from '../api/client';
import { useAccountsQuery } from '../api/queries/accounts';
import { useEmployeesQuery } from '../api/queries/employees';
import {
  useCreateSubscriptionMutation,
  useDeleteSubscriptionMutation,
  useSubscriptionsQuery,
  useUpdateSubscriptionMutation,
} from '../api/queries/subscriptions';

const statusVariant: Record<SubscriptionStatus, 'success' | 'warning' | 'danger' | 'default'> = {
  'Active': 'success',
  'Expiring Soon': 'warning',
  'Expired': 'danger',
  'Cancelled': 'default',
};

const scopeIcon: Record<AssignmentScope, ReactElement> = {
  'Individual': <Users className="w-4 h-4" />,
  'Team': <Users className="w-4 h-4" />,
  'Company-Wide': <Building className="w-4 h-4" />,
};

const daysUntil = (dateStr: string): number => {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

const formatCurrency = (amount: number, cycle: BillingCycle) =>
  `$${amount.toLocaleString()}/${cycle === 'Monthly' ? 'mo' : cycle === 'Annual' ? 'yr' : cycle === 'Quarterly' ? 'qtr' : 'once'}`;

export const Subscriptions = ({ state }: { state: ReturnType<typeof useSystemState> }) => {
  void state;
  const { can } = useAuth();
  const subscriptionsQuery = useSubscriptionsQuery();
  const employeesQuery = useEmployeesQuery();
  const accountsQuery = useAccountsQuery();
  const subscriptions = subscriptionsQuery.data ?? [];
  const employees = employeesQuery.data ?? [];
  const accounts = accountsQuery.data ?? [];
  const createSubscriptionMutation = useCreateSubscriptionMutation();
  const updateSubscriptionMutation = useUpdateSubscriptionMutation();
  const deleteSubscriptionMutation = useDeleteSubscriptionMutation();

  const [selectedSub, setSelectedSub] = useState<Subscription | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddMode, setIsAddMode] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Form state
  const [fName, setFName] = useState('');
  const [fVendor, setFVendor] = useState('');
  const [fType, setFType] = useState<Subscription['type']>('SaaS');
  const [fCost, setFCost] = useState('');
  const [fBillingCycle, setFBillingCycle] = useState<BillingCycle>('Monthly');
  const [fPurchaseDate, setFPurchaseDate] = useState('');
  const [fRenewalDate, setFRenewalDate] = useState('');
  const [fScope, setFScope] = useState<AssignmentScope>('Company-Wide');
  const [fAssignedToIds, setFAssignedToIds] = useState<string[]>([]);
  const [fTeamName, setFTeamName] = useState('');
  const [fLinkedAccountId, setFLinkedAccountId] = useState('');
  const [fCredEmail, setFCredEmail] = useState('');
  const [fCredPassword, setFCredPassword] = useState('');
  const [fLicenseCount, setFLicenseCount] = useState('');
  const [fNotes, setFNotes] = useState('');

  const resetForm = () => {
    setFName(''); setFVendor(''); setFType('SaaS'); setFCost('');
    setFBillingCycle('Monthly'); setFPurchaseDate(''); setFRenewalDate('');
    setFScope('Company-Wide'); setFAssignedToIds([]); setFTeamName('');
    setFLinkedAccountId(''); setFCredEmail(''); setFCredPassword('');
    setFLicenseCount(''); setFNotes('');
    setIsAddMode(false); setIsModalOpen(false); setSelectedSub(null);
  };

  const computeStatus = (renewalDate: string): SubscriptionStatus => {
    const d = daysUntil(renewalDate);
    if (d < 0) return 'Expired';
    if (d <= 30) return 'Expiring Soon';
    return 'Active';
  };

  const handleAdd = async () => {
    if (!fName.trim() || !fVendor.trim() || !fRenewalDate) return;
    const status = computeStatus(fRenewalDate);
    try {
      await createSubscriptionMutation.mutateAsync({
        name: fName.trim(),
        vendor: fVendor.trim(),
        type: fType,
        cost: parseFloat(fCost) || 0,
        billingCycle: fBillingCycle,
        purchaseDate: fPurchaseDate || new Date().toISOString().split('T')[0],
        renewalDate: fRenewalDate,
        status,
        assignmentScope: fScope,
        ...(fScope !== 'Company-Wide' && fAssignedToIds.length ? { assignedToIds: fAssignedToIds } : {}),
        ...(fScope === 'Team' && fTeamName ? { teamName: fTeamName } : {}),
        ...(fLinkedAccountId ? { linkedAccountId: fLinkedAccountId } : {}),
        ...(!fLinkedAccountId && (fCredEmail || fCredPassword)
          ? {
              credentials: {
                email: fCredEmail || undefined,
                password: fCredPassword || undefined,
                lastUpdated: new Date().toISOString().split('T')[0],
              },
            }
          : {}),
        ...(fLicenseCount ? { licenseCount: parseInt(fLicenseCount) } : {}),
        ...(fNotes.trim() ? { notes: fNotes.trim() } : {}),
        alertDays: [30, 7, 1],
      });
      resetForm();
    } catch {
      // handled by inline error UI below
    }
  };

  const filtered = subscriptions.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      s.vendor.toLowerCase().includes(searchFilter.toLowerCase());
    const matchStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalMonthlyCost = subscriptions
    .filter(s => s.status !== 'Cancelled' && s.status !== 'Expired')
    .reduce((sum, s) => {
      if (s.billingCycle === 'Monthly') return sum + s.cost;
      if (s.billingCycle === 'Annual') return sum + s.cost / 12;
      if (s.billingCycle === 'Quarterly') return sum + s.cost / 3;
      return sum;
    }, 0);

  const expiringCount = subscriptions.filter(s => s.status === 'Expiring Soon').length;

  const getLinkedAccount = (id?: string) => accounts.find(a => a.id === id);

  const toggleAssignee = (id: string) => {
    setFAssignedToIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Subscriptions</h1>
          <p className="text-muted-foreground">Track SaaS, licenses, cloud services and vendor subscriptions.</p>
        </div>
        {can('subscriptions.create') && (
          <Button className="bg-teal-600 hover:bg-teal-700" onClick={() => { setIsAddMode(true); setIsModalOpen(true); }}>
            <Plus className="w-4 h-4" /> Add Subscription
          </Button>
        )}
      </div>

      {subscriptionsQuery.isError && (
        <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/5 text-sm text-rose-500">
          Failed to load subscriptions: {toApiError(subscriptionsQuery.error)}
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-500 flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Monthly Spend</p>
            <p className="text-2xl font-bold">${totalMonthlyCost.toFixed(0)}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Active</p>
            <p className="text-2xl font-bold">{subscriptions.filter(s => s.status === 'Active').length}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Expiring Soon</p>
            <p className="text-2xl font-bold">{expiringCount}</p>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-3 bg-card p-2 rounded-2xl border shadow-subtle flex-1">
          <Search className="w-4 h-4 ml-2 text-muted-foreground" />
          <input
            type="text" placeholder="Search subscriptions or vendors..."
            value={searchFilter} onChange={e => setSearchFilter(e.target.value)}
            className="flex-1 bg-transparent border-none focus:ring-0 text-sm"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'Active', 'Expiring Soon', 'Expired', 'Cancelled'] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${statusFilter === s ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border hover:bg-accent'}`}
            >
              {s === 'all' ? 'All' : s}
            </button>
          ))}
        </div>
      </div>

      {/* Subscription Table */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-accent/50 border-b">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Name / Vendor</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Type</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Cost</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Renewal</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Scope</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Status</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map(sub => {
                const days = daysUntil(sub.renewalDate);
                return (
                  <tr
                    key={sub.id}
                    className="hover:bg-accent/30 transition-colors group cursor-pointer"
                    onClick={() => { setSelectedSub(sub); setIsAddMode(false); setIsModalOpen(true); }}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-500 flex items-center justify-center font-bold text-sm">
                          {sub.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{sub.name}</p>
                          <p className="text-xs text-muted-foreground">{sub.vendor}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="info">{sub.type}</Badge>
                    </td>
                    <td className="px-6 py-4 text-sm font-mono font-semibold">
                      {formatCurrency(sub.cost, sub.billingCycle)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-sm">{sub.renewalDate}</span>
                      </div>
                      {sub.status !== 'Expired' && sub.status !== 'Cancelled' && (
                        <p className={`text-[10px] font-bold mt-0.5 ${days <= 7 ? 'text-rose-500' : days <= 30 ? 'text-amber-500' : 'text-muted-foreground'}`}>
                          {days < 0 ? 'Overdue' : `${days}d left`}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-sm">
                        {scopeIcon[sub.assignmentScope]}
                        <span>{sub.assignmentScope}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={statusVariant[sub.status]}>{sub.status}</Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="opacity-0 group-hover:opacity-100 transition-all flex justify-end gap-2">
                        {can('subscriptions.edit') && (
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              void updateSubscriptionMutation.mutateAsync({
                                id: sub.id,
                                payload: { status: computeStatus(sub.renewalDate) },
                              });
                            }}
                            className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground"
                            title="Refresh status"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="px-6 py-10 text-center text-muted-foreground text-sm italic">No subscriptions found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={resetForm}
        title={isAddMode ? 'Add Subscription' : 'Subscription Details'}
        size="lg"
      >
        {isAddMode ? (
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1 custom-scrollbar">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2 sm:col-span-1">
                <label className="text-sm font-medium">Subscription Name <span className="text-destructive">*</span></label>
                <input value={fName} onChange={e => setFName(e.target.value)} className="w-full bg-accent p-2.5 rounded-xl border-none outline-none focus:ring-2 focus:ring-primary/20" placeholder="e.g. GitHub Enterprise" />
              </div>
              <div className="space-y-2 col-span-2 sm:col-span-1">
                <label className="text-sm font-medium">Vendor <span className="text-destructive">*</span></label>
                <input value={fVendor} onChange={e => setFVendor(e.target.value)} className="w-full bg-accent p-2.5 rounded-xl border-none outline-none focus:ring-2 focus:ring-primary/20" placeholder="e.g. GitHub Inc." />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Type</label>
                <CustomSelect value={fType} onChange={val => setFType(val as Subscription['type'])} options={[
                  { value: 'SaaS', label: 'SaaS Platform' },
                  { value: 'License', label: 'Software License' },
                  { value: 'Cloud', label: 'Cloud Service' },
                  { value: 'Vendor', label: 'Vendor Subscription' },
                  { value: 'Other', label: 'Other' },
                ]} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Billing Cycle</label>
                <CustomSelect value={fBillingCycle} onChange={val => setFBillingCycle(val as BillingCycle)} options={[
                  { value: 'Monthly', label: 'Monthly' },
                  { value: 'Quarterly', label: 'Quarterly' },
                  { value: 'Annual', label: 'Annual' },
                  { value: 'One-Time', label: 'One-Time' },
                ]} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Cost ($)</label>
                <input type="number" value={fCost} onChange={e => setFCost(e.target.value)} className="w-full bg-accent p-2.5 rounded-xl border-none outline-none focus:ring-2 focus:ring-primary/20" placeholder="0.00" min="0" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Purchase Date</label>
                <input type="date" value={fPurchaseDate} onChange={e => setFPurchaseDate(e.target.value)} className="w-full bg-accent p-2.5 rounded-xl border-none outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Renewal Date <span className="text-destructive">*</span></label>
                <input type="date" value={fRenewalDate} onChange={e => setFRenewalDate(e.target.value)} className="w-full bg-accent p-2.5 rounded-xl border-none outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">License Count</label>
                <input type="number" value={fLicenseCount} onChange={e => setFLicenseCount(e.target.value)} className="w-full bg-accent p-2.5 rounded-xl border-none outline-none focus:ring-2 focus:ring-primary/20" placeholder="e.g. 25" min="1" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Assignment Scope</label>
                <CustomSelect value={fScope} onChange={val => setFScope(val as AssignmentScope)} options={[
                  { value: 'Company-Wide', label: 'Company-Wide' },
                  { value: 'Team', label: 'Team' },
                  { value: 'Individual', label: 'Individual' },
                ]} />
              </div>
            </div>
            {fScope === 'Team' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Team Name</label>
                <input value={fTeamName} onChange={e => setFTeamName(e.target.value)} className="w-full bg-accent p-2.5 rounded-xl border-none outline-none focus:ring-2 focus:ring-primary/20" placeholder="e.g. Design Team" />
              </div>
            )}
            {(fScope === 'Individual' || fScope === 'Team') && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Assign Employees</label>
                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto custom-scrollbar">
                  {employees.filter(e => e.status === 'Active').map(emp => (
                    <label key={emp.id} className={`flex items-center gap-2 p-2 rounded-xl border cursor-pointer transition-all ${fAssignedToIds.includes(emp.id) ? 'bg-primary/10 border-primary/30' : 'bg-accent/40 border-transparent hover:border-border'}`}>
                      <input type="checkbox" checked={fAssignedToIds.includes(emp.id)} onChange={() => toggleAssignee(emp.id)} className="accent-primary" />
                      <span className="text-sm font-medium">{emp.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium">Link Central Account (optional)</label>
              <CustomSelect value={fLinkedAccountId} onChange={val => { setFLinkedAccountId(val); if (val) { setFCredEmail(''); setFCredPassword(''); } }}
                placeholder="No linking (manual credentials)"
                options={[
                  { value: '', label: 'No Linking (Manual)' },
                  ...accounts.map(a => ({ value: a.id, label: `${a.name} (${a.email})` }))
                ]}
              />
            </div>
            {!fLinkedAccountId && (
              <div className="space-y-3 p-4 border rounded-xl bg-accent/20">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Manual Credentials (Optional)</p>
                <input value={fCredEmail} onChange={e => setFCredEmail(e.target.value)} className="w-full bg-accent p-2.5 rounded-xl border-none outline-none focus:ring-2 focus:ring-primary/20" placeholder="Login email / username" />
                <PasswordInput value={fCredPassword} onChange={e => setFCredPassword(e.target.value)} placeholder="Password" />
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium">Notes</label>
              <textarea value={fNotes} onChange={e => setFNotes(e.target.value)} className="w-full bg-accent p-2.5 rounded-xl border-none outline-none focus:ring-2 focus:ring-primary/20 resize-none h-16" placeholder="Optional notes..." />
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={resetForm}>Cancel</Button>
              <Button className="flex-1 bg-teal-600 hover:bg-teal-700" onClick={handleAdd} disabled={!fName.trim() || !fVendor.trim() || !fRenewalDate}>
                Add Subscription
              </Button>
            </div>
          </div>
        ) : selectedSub ? (
          <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-1 custom-scrollbar">
            {/* Header */}
            <div className="flex items-start gap-4 p-4 rounded-2xl bg-teal-500/5 border border-teal-500/20">
              <div className="w-14 h-14 rounded-2xl bg-teal-500/10 text-teal-500 flex items-center justify-center text-2xl font-bold">
                {selectedSub.name.charAt(0)}
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold">{selectedSub.name}</h2>
                <p className="text-sm text-muted-foreground">{selectedSub.vendor}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <Badge variant={statusVariant[selectedSub.status]}>{selectedSub.status}</Badge>
                  <Badge variant="info">{selectedSub.type}</Badge>
                </div>
              </div>
            </div>

            {/* Expiry Alert */}
            {(selectedSub.status === 'Expiring Soon' || selectedSub.status === 'Expired') && (
              <div className={`flex items-center gap-3 p-3 rounded-xl border ${selectedSub.status === 'Expired' ? 'bg-rose-500/5 border-rose-500/20' : 'bg-amber-500/5 border-amber-500/20'}`}>
                <AlertTriangle className={`w-4 h-4 shrink-0 ${selectedSub.status === 'Expired' ? 'text-rose-500' : 'text-amber-500'}`} />
                <p className="text-sm font-medium">
                  {selectedSub.status === 'Expired'
                    ? `Expired ${Math.abs(daysUntil(selectedSub.renewalDate))} days ago. Renew or cancel this subscription.`
                    : `Expires in ${daysUntil(selectedSub.renewalDate)} days on ${selectedSub.renewalDate}.`}
                </p>
              </div>
            )}

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Cost</p>
                <p className="font-semibold text-lg">{formatCurrency(selectedSub.cost, selectedSub.billingCycle)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Billing Cycle</p>
                <p className="font-medium">{selectedSub.billingCycle}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Purchase Date</p>
                <p className="font-medium">{selectedSub.purchaseDate}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Renewal Date</p>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                  <p className="font-medium">{selectedSub.renewalDate}</p>
                </div>
              </div>
              {selectedSub.licenseCount && (
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">License Count</p>
                  <p className="font-medium">{selectedSub.licenseCount} seats</p>
                </div>
              )}
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Scope</p>
                <div className="flex items-center gap-1.5">
                  {scopeIcon[selectedSub.assignmentScope]}
                  <p className="font-medium">{selectedSub.assignmentScope}</p>
                </div>
              </div>
            </div>

            {/* Assignment */}
            {selectedSub.assignedToIds && selectedSub.assignedToIds.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Assigned Employees</p>
                <div className="flex flex-wrap gap-2">
                  {selectedSub.assignedToIds.map(id => {
                    const emp = employees.find(e => e.id === id);
                    return emp ? (
                      <div key={id} className="flex items-center gap-1.5 bg-accent/60 px-2.5 py-1 rounded-lg text-xs font-medium">
                        <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold">{emp.name.charAt(0)}</div>
                        {emp.name}
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
            )}
            {selectedSub.teamName && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Team</p>
                <p className="text-sm font-medium">{selectedSub.teamName}</p>
              </div>
            )}

            {/* Linked Account */}
            {selectedSub.linkedAccountId && getLinkedAccount(selectedSub.linkedAccountId) && (
              <div className="p-3 rounded-xl bg-primary/5 border border-primary/10 flex items-center gap-3">
                <LinkIcon className="w-4 h-4 text-primary" />
                <div>
                  <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Linked Account</p>
                  <p className="text-sm font-medium">{getLinkedAccount(selectedSub.linkedAccountId)!.email}</p>
                </div>
              </div>
            )}

            {/* Credentials */}
            {selectedSub.credentials?.password && (
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Credentials</p>
                {selectedSub.credentials.email && <CredentialField label="Email" value={selectedSub.credentials.email} isMasked={false} />}
                <CredentialField label="Password" value={selectedSub.credentials.password} />
              </div>
            )}

            {/* Notes */}
            {selectedSub.notes && (
              <div className="p-3 bg-accent/30 rounded-xl">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Notes</p>
                <p className="text-sm">{selectedSub.notes}</p>
              </div>
            )}

            {/* Actions */}
            {can('subscriptions.edit') && (
              <div className="space-y-2 pt-2 border-t">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Update Status</p>
                <div className="flex flex-wrap gap-2">
                  {(['Active', 'Expiring Soon', 'Expired', 'Cancelled'] as SubscriptionStatus[]).map(s => (
                    <button key={s}
                      onClick={() => {
                        void updateSubscriptionMutation.mutateAsync({
                          id: selectedSub.id,
                          payload: { status: s },
                        });
                        setSelectedSub({ ...selectedSub, status: s });
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${selectedSub.status === s ? 'bg-primary text-primary-foreground border-primary' : 'bg-accent/40 border-border hover:bg-accent'}`}
                    >{s}</button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={resetForm}>Close</Button>
              {can('subscriptions.delete') && (
                <Button
                  variant="danger"
                  className="flex-1"
                  onClick={() => {
                    void deleteSubscriptionMutation.mutateAsync(selectedSub.id);
                    resetForm();
                  }}
                >
                  <Trash2 className="w-4 h-4" /> Delete
                </Button>
              )}
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
};
