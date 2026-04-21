import { useState } from 'react';
import type {
  Employee,
  HardwareAsset,
  Account,
  SoftwareTool,
  ActivityLog,
  Subscription,
  Project,
} from '../types';
import {
  employees as initialEmployees,
  hardware as initialHardware,
  accounts as initialAccounts,
  tools as initialTools,
  activities as initialActivities,
  subscriptions as initialSubscriptions,
  projects as initialProjects,
} from '../data/mockData';

export const useSystemState = () => {
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [hardware, setHardware] = useState<HardwareAsset[]>(initialHardware);
  const [accounts, setAccounts] = useState<Account[]>(initialAccounts);
  const [tools, setTools] = useState<SoftwareTool[]>(initialTools);
  const [activities, setActivities] = useState<ActivityLog[]>(initialActivities);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(initialSubscriptions);
  const [projects, setProjects] = useState<Project[]>(initialProjects);

  const addActivity = (description: string, module: ActivityLog['module'], type: ActivityLog['type']) => {
    const newActivity: ActivityLog = {
      id: `act-${Date.now()}`,
      description,
      module,
      type,
      timestamp: new Date().toISOString(),
      userId: 'admin',
      userName: 'John Doe',
    };
    setActivities(prev => [newActivity, ...prev]);
  };

  // --- HARDWARE ---
  const addHardware = (asset: Omit<HardwareAsset, 'id'>) => {
    const newAsset = { ...asset, id: `hw-${Date.now()}` } as HardwareAsset;
    setHardware(prev => [newAsset, ...prev]);
    addActivity(`Added new hardware: ${newAsset.name}`, 'Hardware', 'creation');
  };
  const updateHardware = (id: string, updates: Partial<HardwareAsset>) => {
    setHardware(prev => prev.map(h => h.id === id ? { ...h, ...updates } : h));
    addActivity(`Updated hardware: ${id}`, 'Hardware', 'update');
  };
  const deleteHardware = (id: string) => {
    setHardware(prev => prev.filter(h => h.id !== id));
    addActivity(`Removed hardware: ${id}`, 'Hardware', 'deletion');
  };

  // --- ACCOUNTS ---
  const addAccount = (account: Omit<Account, 'id'>) => {
    const newAccount = { ...account, id: `acc-${Date.now()}` } as Account;
    setAccounts(prev => [newAccount, ...prev]);
    addActivity(`Created central account: ${newAccount.email}`, 'Accounts', 'creation');
  };
  const updateAccount = (id: string, updates: Partial<Account>) => {
    setAccounts(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
    addActivity(`Updated account: ${updates.email || id}`, 'Accounts', 'update');
  };
  const deleteAccount = (id: string) => {
    setTools(prev => prev.map(t => t.linkedAccountId === id ? { ...t, linkedAccountId: undefined } : t));
    setAccounts(prev => prev.filter(a => a.id !== id));
    addActivity(`Deleted account: ${id}`, 'Accounts', 'deletion');
  };

  // --- TOOLS ---
  const addTool = (tool: Omit<SoftwareTool, 'id'>) => {
    const newTool = { ...tool, id: `tool-${Date.now()}` } as SoftwareTool;
    setTools(prev => [newTool, ...prev]);
    addActivity(`Added tool: ${newTool.name}`, 'Tools', 'creation');
  };
  const updateTool = (id: string, updates: Partial<SoftwareTool>) => {
    setTools(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    addActivity(`Updated tool: ${updates.name || id}`, 'Tools', 'update');
  };
  const deleteTool = (id: string) => {
    setTools(prev => prev.filter(t => t.id !== id));
    addActivity(`Removed tool: ${id}`, 'Tools', 'deletion');
  };

  // --- EMPLOYEES ---
  const addEmployee = (employee: Omit<Employee, 'id'>) => {
    const newEmp = { ...employee, id: `emp-${Date.now()}` } as Employee;
    setEmployees(prev => [newEmp, ...prev]);
    addActivity(`Onboarded employee: ${newEmp.name}`, 'Employees', 'creation');
  };
  const updateEmployee = (id: string, updates: Partial<Employee>) => {
    setEmployees(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
    addActivity(`Updated employee profile: ${updates.name || id}`, 'Employees', 'update');
  };
  const offboardEmployee = (id: string, notes?: string) => {
    setHardware(prev =>
      prev.map(h => h.assignedToId === id ? { ...h, assignedToId: undefined, status: 'Available' as const } : h)
    );
    setTools(prev =>
      prev.map(t => t.assignedToId === id ? { ...t, assignedToId: undefined } : t)
    );
    // Remove from subscriptions
    setSubscriptions(prev =>
      prev.map(s => ({
        ...s,
        assignedToIds: s.assignedToIds ? s.assignedToIds.filter(eid => eid !== id) : s.assignedToIds,
      }))
    );
    // Remove from project members
    setProjects(prev =>
      prev.map(p => ({
        ...p,
        members: p.members.filter(m => m.employeeId !== id),
        projectManager: p.projectManager === id ? undefined : p.projectManager,
      }))
    );
    setEmployees(prev =>
      prev.map(e =>
        e.id === id
          ? { ...e, status: 'Inactive' as const, offboardedAt: new Date().toISOString().split('T')[0], ...(notes ? { offboardNotes: notes } : {}), assignedAssetCount: 0, assignedToolCount: 0 }
          : e
      )
    );
    const emp = employees.find(e => e.id === id);
    addActivity(`Offboarded employee: ${emp?.name || id}`, 'Employees', 'update');
  };

  // --- SUBSCRIPTIONS ---
  const addSubscription = (sub: Omit<Subscription, 'id'>) => {
    const newSub = { ...sub, id: `sub-${Date.now()}` } as Subscription;
    setSubscriptions(prev => [newSub, ...prev]);
    addActivity(`Added subscription: ${newSub.name}`, 'Subscriptions', 'creation');
  };
  const updateSubscription = (id: string, updates: Partial<Subscription>) => {
    setSubscriptions(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    addActivity(`Updated subscription: ${updates.name || id}`, 'Subscriptions', 'update');
  };
  const deleteSubscription = (id: string) => {
    setSubscriptions(prev => prev.filter(s => s.id !== id));
    addActivity(`Deleted subscription: ${id}`, 'Subscriptions', 'deletion');
  };

  // --- PROJECTS ---
  const addProject = (proj: Omit<Project, 'id'>) => {
    const newProj = { ...proj, id: `proj-${Date.now()}` } as Project;
    setProjects(prev => [newProj, ...prev]);
    addActivity(`Created project: ${newProj.name}`, 'Projects', 'creation');
  };
  const updateProject = (id: string, updates: Partial<Project>) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    addActivity(`Updated project: ${updates.name || id}`, 'Projects', 'update');
  };
  const deleteProject = (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
    addActivity(`Deleted project: ${id}`, 'Projects', 'deletion');
  };

  return {
    employees, hardware, accounts, tools, activities, subscriptions, projects,
    addHardware, updateHardware, deleteHardware,
    addAccount, updateAccount, deleteAccount,
    addTool, updateTool, deleteTool,
    addEmployee, updateEmployee, offboardEmployee,
    addSubscription, updateSubscription, deleteSubscription,
    addProject, updateProject, deleteProject,
  };
};
