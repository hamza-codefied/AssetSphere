import { useState } from 'react';
import type { 
  Employee, 
  HardwareAsset, 
  Account, 
  SoftwareTool, 
  ActivityLog
} from '../types';
import { 
  employees as initialEmployees, 
  hardware as initialHardware, 
  accounts as initialAccounts, 
  tools as initialTools, 
  activities as initialActivities 
} from '../data/mockData';

export const useSystemState = () => {
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [hardware, setHardware] = useState<HardwareAsset[]>(initialHardware);
  const [accounts, setAccounts] = useState<Account[]>(initialAccounts);
  const [tools, setTools] = useState<SoftwareTool[]>(initialTools);
  const [activities, setActivities] = useState<ActivityLog[]>(initialActivities);

  // Helper to add activity
  const addActivity = (description: string, module: any, type: any) => {
    const newActivity: ActivityLog = {
      id: `act-${Date.now()}`,
      description,
      module,
      type,
      timestamp: new Date().toISOString(),
      userId: 'admin',
      userName: 'John Doe'
    };
    setActivities(prev => [newActivity, ...prev]);
  };

  // --- HARDWARE ACTIONS ---
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

  // --- ACCOUNT ACTIONS ---
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
    // When deleting an account, we should also unlink tools using it
    setTools(prev => prev.map(t => t.linkedAccountId === id ? { ...t, linkedAccountId: undefined } : t));
    setAccounts(prev => prev.filter(a => a.id !== id));
    addActivity(`Deleted account: ${id}`, 'Accounts', 'deletion');
  };

  // --- TOOL ACTIONS ---
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

  // --- EMPLOYEE ACTIONS ---
  const addEmployee = (employee: Omit<Employee, 'id'>) => {
    const newEmp = { ...employee, id: `emp-${Date.now()}` } as Employee;
    setEmployees(prev => [newEmp, ...prev]);
    addActivity(`Onboarded employee: ${newEmp.name}`, 'Employees', 'creation');
  };

  const updateEmployee = (id: string, updates: Partial<Employee>) => {
    setEmployees(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
    addActivity(`Updated employee profile: ${updates.name || id}`, 'Employees', 'update');
  };

  return {
    employees,
    hardware,
    accounts,
    tools,
    activities,
    addHardware, updateHardware, deleteHardware,
    addAccount, updateAccount, deleteAccount,
    addTool, updateTool, deleteTool,
    addEmployee, updateEmployee
  };
};
