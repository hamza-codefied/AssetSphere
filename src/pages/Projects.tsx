import { useState } from 'react';
import { Card, Badge, Button, Modal, CustomSelect, CredentialField, PasswordInput } from '../components/ui';
import {
  Plus, Users, HardDrive, CreditCard, Trash2, Search,
  Calendar, Link as LinkIcon, Shield, X, FolderOpen, Key
} from 'lucide-react';
import type { Project, ProjectStatus, ProjectRole, StandaloneCredential, ProjectMember } from '../types';
import { useSystemState } from '../hooks/useSystemState';
import { useAuth } from '../auth/AuthContext';
import { toApiError } from '../api/client';
import { useAccountsQuery } from '../api/accounts';
import { useEmployeesQuery } from '../api/employees';
import { useHardwareQuery } from '../api/hardware';
import { useSubscriptionsQuery } from '../api/subscriptions';
import {
  useCreateProjectMutation,
  useDeleteProjectMutation,
  useProjectsQuery,
  useUpdateProjectMutation,
} from '../api/projects';

const statusVariant: Record<ProjectStatus, 'success' | 'default' | 'info'> = {
  'Active': 'success',
  'Archived': 'default',
  'Completed': 'info',
};

const PROJECT_ROLES: ProjectRole[] = ['Project Manager', 'Team Lead', 'Developer', 'Viewer', 'Contributor'];

const roleColor: Record<ProjectRole, string> = {
  'Project Manager': 'bg-violet-500/10 text-violet-500 border-violet-500/20',
  'Team Lead': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  'Developer': 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  'Viewer': 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  'Contributor': 'bg-amber-500/10 text-amber-500 border-amber-500/20',
};

export const Projects = ({ state }: { state: ReturnType<typeof useSystemState> }) => {
  void state;
  const { can } = useAuth();
  const projectsQuery = useProjectsQuery();
  const employeesQuery = useEmployeesQuery();
  const accountsQuery = useAccountsQuery();
  const hardwareQuery = useHardwareQuery();
  const subscriptionsQuery = useSubscriptionsQuery();
  const projects = projectsQuery.data ?? [];
  const employees = employeesQuery.data ?? [];
  const accounts = accountsQuery.data ?? [];
  const hardware = hardwareQuery.data ?? [];
  const subscriptions = subscriptionsQuery.data ?? [];
  const createProjectMutation = useCreateProjectMutation();
  const updateProjectMutation = useUpdateProjectMutation();
  const deleteProjectMutation = useDeleteProjectMutation();

  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddMode, setIsAddMode] = useState(false);
  const [activeDetailTab, setActiveDetailTab] = useState<'overview' | 'credentials' | 'team' | 'resources'>('overview');
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Form state
  const [fName, setFName] = useState('');
  const [fClient, setFClient] = useState('');
  const [fDescription, setFDescription] = useState('');
  const [fStatus, setFStatus] = useState<ProjectStatus>('Active');
  const [fStartDate, setFStartDate] = useState('');
  const [fEndDate, setFEndDate] = useState('');
  const [fManagerId, setFManagerId] = useState('');
  const [fMembers, setFMembers] = useState<ProjectMember[]>([]);
  const [fNewMemberId, setFNewMemberId] = useState('');
  const [fLinkedAccountIds, setFLinkedAccountIds] = useState<string[]>([]);
  const [fHardwareIds, setFHardwareIds] = useState<string[]>([]);
  const [fSubscriptionIds, setFSubscriptionIds] = useState<string[]>([]);
  const [fStandaloneCredentials, setFStandaloneCredentials] = useState<StandaloneCredential[]>([]);
  const [fNotes, setFNotes] = useState('');

  // Standalone credential form
  const [newCredLabel, setNewCredLabel] = useState('');
  const [newCredUsername, setNewCredUsername] = useState('');
  const [newCredPassword, setNewCredPassword] = useState('');
  const [newCredUrl, setNewCredUrl] = useState('');
  const [newCredNotes, setNewCredNotes] = useState('');

  const resetForm = () => {
    setFName(''); setFClient(''); setFDescription(''); setFStatus('Active');
    setFStartDate(''); setFEndDate(''); setFManagerId('');
    setFMembers([]); setFNewMemberId(''); setFLinkedAccountIds([]); setFHardwareIds([]);
    setFSubscriptionIds([]); setFStandaloneCredentials([]); setFNotes('');
    resetCredForm();
    setIsAddMode(false); setIsModalOpen(false); setSelectedProject(null);
    setActiveDetailTab('overview');
  };

  const resetCredForm = () => {
    setNewCredLabel(''); setNewCredUsername(''); setNewCredPassword('');
    setNewCredUrl(''); setNewCredNotes('');
  };

  const handleAdd = async () => {
    if (!fName.trim() || !fClient.trim()) return;
    try {
      await createProjectMutation.mutateAsync({
        name: fName.trim(),
        clientName: fClient.trim(),
        description: fDescription.trim() || undefined,
        status: fStatus,
        startDate: fStartDate || new Date().toISOString().split('T')[0],
        endDate: fEndDate || undefined,
        projectManager: fManagerId || undefined,
        members: fMembers,
        linkedAccountIds: fLinkedAccountIds,
        hardwareIds: fHardwareIds,
        subscriptionIds: fSubscriptionIds,
        standaloneCredentials: fStandaloneCredentials,
        notes: fNotes.trim() || undefined,
      });
      resetForm();
    } catch {
      // non-blocking; surfaced through list/error states
    }
  };

  const addStandaloneCred = () => {
    if (!newCredLabel.trim()) return;
    const cred: StandaloneCredential = {
      id: `sc-${Date.now()}`,
      label: newCredLabel.trim(),
      username: newCredUsername.trim() || undefined,
      password: newCredPassword || undefined,
      url: newCredUrl.trim() || undefined,
      notes: newCredNotes.trim() || undefined,
      lastUpdated: new Date().toISOString().split('T')[0],
    };
    setFStandaloneCredentials(prev => [...prev, cred]);
    resetCredForm();
  };

  const addMember = () => {
    if (!fNewMemberId) return;
    setFMembers((prev) => {
      if (prev.some((member) => member.employeeId === fNewMemberId)) return prev;
      return [...prev, { employeeId: fNewMemberId, role: 'Developer' }];
    });
    setFNewMemberId('');
  };
  const removeMember = (empId: string) => {
    setFMembers((prev) => prev.filter((member) => member.employeeId !== empId));
  };
  const updateMemberRole = (empId: string, role: ProjectRole) => {
    setFMembers(prev => prev.map(m => m.employeeId === empId ? { ...m, role } : m));
  };

  const toggleArr = <T extends string>(arr: T[], val: T): T[] =>
    arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val];

  const filtered = projects.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      p.clientName.toLowerCase().includes(searchFilter.toLowerCase());
    const matchStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const getEmployee = (id?: string) => employees.find(e => e.id === id);
  const activePmoEmployees = employees.filter((employee) => employee.status === 'Active' && employee.role === 'pmo');
  const availableTeamMembers = employees.filter(
    (employee) =>
      employee.status === 'Active' &&
      employee.role === 'dev' &&
      employee.id !== fManagerId &&
      !fMembers.some((member) => member.employeeId === employee.id),
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">Client projects with integrated credentials, hardware, and team management.</p>
        </div>
        {can('projects.create') && (
          <Button className="bg-orange-600 hover:bg-orange-700" onClick={() => { setIsAddMode(true); setIsModalOpen(true); }}>
            <Plus className="w-4 h-4" /> New Project
          </Button>
        )}
      </div>

      {projectsQuery.isError && (
        <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/5 text-sm text-rose-500">
          Failed to load projects: {toApiError(projectsQuery.error)}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {(['Active', 'Completed', 'Archived'] as ProjectStatus[]).map(s => (
          <Card key={s} className="flex items-center gap-3 p-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s === 'Active' ? 'bg-emerald-500/10 text-emerald-500' : s === 'Completed' ? 'bg-blue-500/10 text-blue-500' : 'bg-slate-500/10 text-slate-400'}`}>
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{s}</p>
              <p className="text-2xl font-bold">{projects.filter(p => p.status === s).length}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-3 bg-card p-2 rounded-2xl border shadow-subtle flex-1">
          <Search className="w-4 h-4 ml-2 text-muted-foreground" />
          <input type="text" placeholder="Search projects or clients..." value={searchFilter} onChange={e => setSearchFilter(e.target.value)} className="flex-1 bg-transparent border-none focus:ring-0 text-sm" />
        </div>
        <div className="flex gap-2">
          {(['all', 'Active', 'Completed', 'Archived'] as const).map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${statusFilter === s ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border hover:bg-accent'}`}>
              {s === 'all' ? 'All' : s}
            </button>
          ))}
        </div>
      </div>

      {/* Project Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filtered.map(proj => {
          const pm = getEmployee(proj.projectManager);
          return (
            <Card key={proj.id} className={`group hover:border-orange-500/50 transition-all cursor-pointer flex flex-col gap-4 border-l-4 ${proj.status === 'Active' ? 'border-l-emerald-500' : proj.status === 'Completed' ? 'border-l-blue-500' : 'border-l-slate-500'}`}
              onClick={() => { setSelectedProject(proj); setIsAddMode(false); setActiveDetailTab('overview'); setIsModalOpen(true); }}>
              <div className="flex justify-between items-start">
                <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center text-xl font-bold">
                  {proj.name.charAt(0)}
                </div>
                <Badge variant={statusVariant[proj.status]}>{proj.status}</Badge>
              </div>
              <div>
                <h3 className="font-bold text-lg leading-tight">{proj.name}</h3>
                <p className="text-xs text-muted-foreground font-semibold mt-0.5 uppercase tracking-widest">{proj.clientName}</p>
                {proj.description && <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2">{proj.description}</p>}
              </div>
              <div className="flex items-center justify-between pt-2 border-t text-xs text-muted-foreground">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {proj.members.length}</span>
                  <span className="flex items-center gap-1"><Key className="w-3.5 h-3.5" /> {proj.standaloneCredentials.length + proj.linkedAccountIds.length}</span>
                  <span className="flex items-center gap-1"><HardDrive className="w-3.5 h-3.5" /> {proj.hardwareIds.length}</span>
                </div>
                {pm && <span className="text-[10px] font-bold truncate max-w-[80px]">{pm.name}</span>}
              </div>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-3 flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
            <FolderOpen className="w-10 h-10 opacity-30" />
            <p className="text-sm italic">No projects found.</p>
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={resetForm} title={isAddMode ? 'New Project' : selectedProject?.name || ''} size="xl">
        {isAddMode ? (
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1 custom-scrollbar">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Project Name <span className="text-destructive">*</span></label>
                <input value={fName} onChange={e => setFName(e.target.value)} className="w-full bg-accent p-2.5 rounded-xl border-none outline-none focus:ring-2 focus:ring-primary/20" placeholder="e.g. E-Commerce Relaunch" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Client Name <span className="text-destructive">*</span></label>
                <input value={fClient} onChange={e => setFClient(e.target.value)} className="w-full bg-accent p-2.5 rounded-xl border-none outline-none focus:ring-2 focus:ring-primary/20" placeholder="e.g. RetailCo Ltd." />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <textarea value={fDescription} onChange={e => setFDescription(e.target.value)} className="w-full bg-accent p-2.5 rounded-xl border-none outline-none focus:ring-2 focus:ring-primary/20 resize-none h-16" placeholder="Brief project overview..." />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <CustomSelect value={fStatus} onChange={val => setFStatus(val as ProjectStatus)} options={[
                  { value: 'Active', label: 'Active' },
                  { value: 'Completed', label: 'Completed' },
                  { value: 'Archived', label: 'Archived' },
                ]} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Start Date</label>
                <input type="date" value={fStartDate} onChange={e => setFStartDate(e.target.value)} className="w-full bg-accent p-2.5 rounded-xl border-none outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">End Date</label>
                <input type="date" value={fEndDate} onChange={e => setFEndDate(e.target.value)} className="w-full bg-accent p-2.5 rounded-xl border-none outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Project Manager</label>
              <CustomSelect
                value={fManagerId}
                onChange={(value) => {
                  setFManagerId(value);
                  if (value) {
                    setFMembers((prev) => prev.filter((member) => member.employeeId !== value));
                  }
                }}
                placeholder="Select PMO project manager..."
                options={[{ value: '', label: 'None' }, ...activePmoEmployees.map((e) => ({ value: e.id, label: e.name }))]}
              />
            </div>

            {/* Team Members */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Team Members</label>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <CustomSelect
                    value={fNewMemberId}
                    onChange={setFNewMemberId}
                    placeholder="Select team member..."
                    options={[
                      { value: '', label: 'Select employee' },
                      ...availableTeamMembers.map((employee) => ({ value: employee.id, label: employee.name })),
                    ]}
                  />
                </div>
                <Button type="button" variant="outline" onClick={addMember} disabled={!fNewMemberId}>
                  Add
                </Button>
              </div>
              <div className="space-y-2 max-h-36 overflow-y-auto custom-scrollbar">
                {fMembers.map((member) => {
                  const emp = employees.find((employee) => employee.id === member.employeeId);
                  if (!emp) return null;
                  return (
                    <div key={member.employeeId} className="p-2 rounded-xl border bg-primary/10 border-primary/30 flex items-center gap-2">
                      <span className="text-sm font-medium flex-1 truncate">{emp.name}</span>
                      <select
                        value={member.role}
                        onChange={(e) => updateMemberRole(member.employeeId, e.target.value as ProjectRole)}
                        className="bg-accent text-xs rounded-lg px-2 py-1 border-none outline-none"
                      >
                        {PROJECT_ROLES.map((role) => (
                          <option key={role} value={role}>{role}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => removeMember(member.employeeId)}
                        className="text-destructive hover:bg-destructive/10 p-1 rounded-lg"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Linked Accounts */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Link Central Accounts</label>
              <div className="space-y-1 max-h-24 overflow-y-auto custom-scrollbar">
                {accounts.map(acc => (
                  <label key={acc.id} className={`flex items-center gap-2 p-2 rounded-xl border cursor-pointer transition-all ${fLinkedAccountIds.includes(acc.id) ? 'bg-primary/10 border-primary/30' : 'bg-accent/40 border-transparent hover:border-border'}`}>
                    <input type="checkbox" checked={fLinkedAccountIds.includes(acc.id)} onChange={() => setFLinkedAccountIds(prev => toggleArr(prev, acc.id))} className="accent-primary" />
                    <span className="text-sm">{acc.name} <span className="text-muted-foreground">({acc.email})</span></span>
                  </label>
                ))}
              </div>
            </div>

            {/* Hardware */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Assign Hardware</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 max-h-24 overflow-y-auto custom-scrollbar">
                {hardware.map(hw => (
                  <label key={hw.id} className={`flex items-center gap-2 p-2 rounded-xl border cursor-pointer transition-all text-sm ${fHardwareIds.includes(hw.id) ? 'bg-primary/10 border-primary/30' : 'bg-accent/40 border-transparent hover:border-border'}`}>
                    <input type="checkbox" checked={fHardwareIds.includes(hw.id)} onChange={() => setFHardwareIds(prev => toggleArr(prev, hw.id))} className="accent-primary" />
                    {hw.name}
                  </label>
                ))}
              </div>
            </div>

            {/* Subscriptions */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Link Subscriptions</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 max-h-24 overflow-y-auto custom-scrollbar">
                {subscriptions.map(sub => (
                  <label key={sub.id} className={`flex items-center gap-2 p-2 rounded-xl border cursor-pointer transition-all text-sm ${fSubscriptionIds.includes(sub.id) ? 'bg-primary/10 border-primary/30' : 'bg-accent/40 border-transparent hover:border-border'}`}>
                    <input type="checkbox" checked={fSubscriptionIds.includes(sub.id)} onChange={() => setFSubscriptionIds(prev => toggleArr(prev, sub.id))} className="accent-primary" />
                    {sub.name}
                  </label>
                ))}
              </div>
            </div>

            {/* Standalone Credentials */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Standalone Credentials</label>
              {fStandaloneCredentials.length > 0 && (
                <div className="space-y-1">
                  {fStandaloneCredentials.map((c, i) => (
                    <div key={c.id} className="flex items-center justify-between p-2 bg-accent/40 rounded-xl text-sm">
                      <span className="font-medium">{c.label}</span>
                      <button type="button" onClick={() => setFStandaloneCredentials(prev => prev.filter((_, idx) => idx !== i))} className="text-destructive hover:bg-destructive/10 p-1 rounded-lg">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="p-3 border rounded-xl bg-accent/20 space-y-2">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Add Credential Entry</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input value={newCredLabel} onChange={e => setNewCredLabel(e.target.value)} className="w-full bg-accent p-2 rounded-xl border-none outline-none focus:ring-2 focus:ring-primary/20 text-sm" placeholder="Label *" />
                  <input value={newCredUsername} onChange={e => setNewCredUsername(e.target.value)} className="w-full bg-accent p-2 rounded-xl border-none outline-none focus:ring-2 focus:ring-primary/20 text-sm" placeholder="Username" />
                </div>
                <PasswordInput value={newCredPassword} onChange={e => setNewCredPassword(e.target.value)} placeholder="Password" className="p-2 text-sm" />
                <input value={newCredUrl} onChange={e => setNewCredUrl(e.target.value)} className="w-full bg-accent p-2 rounded-xl border-none outline-none focus:ring-2 focus:ring-primary/20 text-sm" placeholder="URL (optional)" />
                <Button variant="outline" className="w-full border-dashed" onClick={addStandaloneCred} disabled={!newCredLabel.trim()}>
                  <Plus className="w-4 h-4" /> Add Entry
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Notes</label>
              <textarea value={fNotes} onChange={e => setFNotes(e.target.value)} className="w-full bg-accent p-2.5 rounded-xl border-none outline-none focus:ring-2 focus:ring-primary/20 resize-none h-16" placeholder="Optional notes..." />
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={resetForm}>Cancel</Button>
              <Button className="flex-1 bg-orange-600 hover:bg-orange-700" onClick={handleAdd} disabled={!fName.trim() || !fClient.trim()}>Create Project</Button>
            </div>
          </div>
        ) : selectedProject ? (
          <div className="space-y-4">
            {/* Project header */}
            <div className={`flex items-start gap-4 p-4 rounded-2xl border border-l-4 ${selectedProject.status === 'Active' ? 'border-l-emerald-500 bg-emerald-500/5 border-emerald-500/20' : selectedProject.status === 'Completed' ? 'border-l-blue-500 bg-blue-500/5 border-blue-500/20' : 'border-l-slate-500 bg-slate-500/5 border-slate-500/20'}`}>
              <div className="w-14 h-14 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center text-2xl font-bold">
                {selectedProject.name.charAt(0)}
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold">{selectedProject.name}</h2>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{selectedProject.clientName}</p>
                {selectedProject.description && <p className="text-sm text-muted-foreground mt-1">{selectedProject.description}</p>}
              </div>
              <Badge variant={statusVariant[selectedProject.status]}>{selectedProject.status}</Badge>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-accent/40 p-1 rounded-xl">
              {(['overview', 'team', 'credentials', 'resources'] as const).map(tab => (
                <button key={tab} onClick={() => setActiveDetailTab(tab)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${activeDetailTab === tab ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                  {tab}
                </button>
              ))}
            </div>

            <div className="max-h-[50vh] overflow-y-auto pr-1 custom-scrollbar">
              {/* Overview */}
              {activeDetailTab === 'overview' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div><p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Start Date</p><div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-muted-foreground" />{selectedProject.startDate}</div></div>
                    {selectedProject.endDate && <div><p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">End Date</p><div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-muted-foreground" />{selectedProject.endDate}</div></div>}
                    <div><p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Project Manager</p><p className="font-medium">{getEmployee(selectedProject.projectManager)?.name || 'Unassigned'}</p></div>
                    <div><p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Team Size</p><p className="font-medium">{selectedProject.members.length} members</p></div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                    <div className="bg-accent/40 rounded-xl p-3"><p className="text-2xl font-bold">{selectedProject.members.length}</p><p className="text-[10px] text-muted-foreground uppercase font-bold">Team</p></div>
                    <div className="bg-accent/40 rounded-xl p-3"><p className="text-2xl font-bold">{selectedProject.standaloneCredentials.length + selectedProject.linkedAccountIds.length}</p><p className="text-[10px] text-muted-foreground uppercase font-bold">Credentials</p></div>
                    <div className="bg-accent/40 rounded-xl p-3"><p className="text-2xl font-bold">{selectedProject.hardwareIds.length}</p><p className="text-[10px] text-muted-foreground uppercase font-bold">Hardware</p></div>
                  </div>
                  {selectedProject.notes && <div className="p-3 bg-accent/30 rounded-xl"><p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Notes</p><p className="text-sm">{selectedProject.notes}</p></div>}
                  {can('projects.edit') && (
                    <div className="space-y-2 pt-2 border-t">
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Update Status</p>
                      <div className="flex gap-2">
                        {(['Active', 'Completed', 'Archived'] as ProjectStatus[]).map(s => (
                          <button
                            key={s}
                            onClick={() => {
                              void updateProjectMutation.mutateAsync({ id: selectedProject.id, payload: { status: s } });
                              setSelectedProject({ ...selectedProject, status: s });
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${selectedProject.status === s ? 'bg-primary text-primary-foreground border-primary' : 'bg-accent/40 border-border hover:bg-accent'}`}
                          >{s}</button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Team */}
              {activeDetailTab === 'team' && (
                <div className="space-y-3">
                  {selectedProject.members.length === 0 ? (
                    <p className="text-sm italic text-muted-foreground text-center py-6">No team members assigned.</p>
                  ) : (
                    selectedProject.members.map(m => {
                      const emp = getEmployee(m.employeeId);
                      if (!emp) return null;
                      return (
                        <div key={m.employeeId} className="flex items-center gap-3 p-3 bg-accent/30 rounded-xl border">
                          <div className="w-10 h-10 rounded-xl bg-slate-700 flex items-center justify-center font-bold text-sm">
                            {emp.name.charAt(0)}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold">{emp.name}</p>
                            <p className="text-xs text-muted-foreground">{emp.role}</p>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${roleColor[m.role]}`}>{m.role}</span>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* Credentials */}
              {activeDetailTab === 'credentials' && (
                <div className="space-y-4">
                  {selectedProject.linkedAccountIds.length > 0 && (
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-2"><LinkIcon className="w-3.5 h-3.5" /> Linked Accounts</p>
                      <div className="space-y-2">
                        {selectedProject.linkedAccountIds.map(id => {
                          const acc = accounts.find(a => a.id === id);
                          if (!acc) return null;
                          return (
                            <div key={id} className="p-3 bg-primary/5 border border-primary/10 rounded-xl flex items-center gap-3">
                              <Shield className="w-4 h-4 text-primary" />
                              <div>
                                <p className="text-sm font-semibold">{acc.name}</p>
                                <p className="text-xs text-muted-foreground">{acc.email}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {selectedProject.standaloneCredentials.length > 0 && (
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-2"><Key className="w-3.5 h-3.5" /> Standalone Credentials</p>
                      <div className="space-y-3">
                        {selectedProject.standaloneCredentials.map(sc => (
                          <div key={sc.id} className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl space-y-2">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-bold">{sc.label}</p>
                              {sc.url && <a href={sc.url} target="_blank" rel="noreferrer" className="text-[10px] text-primary hover:underline truncate max-w-[120px]">{sc.url}</a>}
                            </div>
                            {sc.username && <CredentialField label="Username" value={sc.username} isMasked={false} />}
                            {sc.password && <CredentialField label="Password" value={sc.password} />}
                            {sc.notes && <p className="text-xs text-muted-foreground italic">{sc.notes}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {selectedProject.linkedAccountIds.length === 0 && selectedProject.standaloneCredentials.length === 0 && (
                    <p className="text-sm italic text-muted-foreground text-center py-6">No credentials linked to this project.</p>
                  )}
                </div>
              )}

              {/* Resources */}
              {activeDetailTab === 'resources' && (
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-2"><HardDrive className="w-3.5 h-3.5" /> Hardware</p>
                    {selectedProject.hardwareIds.length === 0 ? (
                      <p className="text-xs italic text-muted-foreground">No hardware assigned.</p>
                    ) : (
                      <div className="space-y-1">
                        {selectedProject.hardwareIds.map(id => {
                          const hw = hardware.find(h => h.id === id);
                          if (!hw) return null;
                          return (
                            <div key={id} className="flex items-center justify-between p-2.5 bg-accent/40 rounded-xl border text-sm">
                              <span className="font-medium">{hw.name}</span>
                              <span className="text-xs font-mono text-muted-foreground">{hw.serialNumber}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-2"><CreditCard className="w-3.5 h-3.5" /> Subscriptions</p>
                    {selectedProject.subscriptionIds.length === 0 ? (
                      <p className="text-xs italic text-muted-foreground">No subscriptions linked.</p>
                    ) : (
                      <div className="space-y-1">
                        {selectedProject.subscriptionIds.map(id => {
                          const sub = subscriptions.find(s => s.id === id);
                          if (!sub) return null;
                          return (
                            <div key={id} className="flex items-center justify-between p-2.5 bg-accent/40 rounded-xl border text-sm">
                              <span className="font-medium">{sub.name}</span>
                              <Badge variant={sub.status === 'Active' ? 'success' : sub.status === 'Expiring Soon' ? 'warning' : 'danger'}>{sub.status}</Badge>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2 border-t">
              <Button variant="outline" className="flex-1" onClick={resetForm}>Close</Button>
              {can('projects.delete') && (
                <Button
                  variant="danger"
                  className="flex-1"
                  onClick={() => {
                    void deleteProjectMutation.mutateAsync(selectedProject.id);
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
