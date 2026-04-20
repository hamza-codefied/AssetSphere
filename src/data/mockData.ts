import type { Employee, HardwareAsset, Account, SoftwareTool, ActivityLog } from '../types';

export const employees: Employee[] = [
  { id: 'emp-1', name: 'Alex Rivers', email: 'alex.rivers@assetsphere.com', role: 'Senior Engineer', status: 'Active', assignedAssetCount: 2, assignedToolCount: 4 },
  { id: 'emp-2', name: 'Sarah Chen', email: 'sarah.chen@assetsphere.com', role: 'Product Designer', status: 'Active', assignedAssetCount: 1, assignedToolCount: 3 },
  { id: 'emp-3', name: 'Marcus Bell', email: 'marcus.bell@assetsphere.com', role: 'DevOps Lead', status: 'Active', assignedAssetCount: 3, assignedToolCount: 8 },
  { id: 'emp-4', name: 'Elena Rodriguez', email: 'elena.r@assetsphere.com', role: 'HR Manager', status: 'Active', assignedAssetCount: 1, assignedToolCount: 2 },
];

export const accounts: Account[] = [
  {
    id: 'acc-1',
    type: 'Gmail',
    name: 'Company Admin',
    email: 'admin@assetsphere.com',
    status: 'Active',
    isCompanyOwned: true,
    credentials: {
      email: 'admin@assetsphere.com',
      password: '••••••••••••',
      twoFactor: { type: 'Authenticator', backupCodes: ['X123', 'Y456'] },
      lastUpdated: '2024-03-15',
    }
  },
  {
    id: 'acc-2',
    type: 'AWS',
    name: 'Production Root',
    email: 'aws-root@assetsphere.com',
    status: 'Active',
    isCompanyOwned: true,
    credentials: {
      username: 'root',
      password: '••••••••••••',
      twoFactor: { type: 'Authenticator' },
      lastUpdated: '2024-01-20',
    }
  },
  {
    id: 'acc-3',
    type: 'Gmail',
    name: 'Marketing Team',
    email: 'marketing@assetsphere.com',
    status: 'Active',
    isCompanyOwned: true,
    credentials: {
      email: 'marketing@assetsphere.com',
      password: '••••••••••••',
      lastUpdated: '2024-02-10',
    }
  }
];

export const hardware: HardwareAsset[] = [
  {
    id: 'hw-1',
    name: 'MacBook Pro 16"',
    type: 'Laptop',
    serialNumber: 'MBP-2024-9981',
    status: 'Assigned',
    assignedToId: 'emp-1',
    credentials: { password: 'user_pass_123', lastUpdated: '2024-04-01' },
    notes: 'Brand new, M3 Max chip.'
  },
  {
    id: 'hw-2',
    name: 'Dell UltraSharp 32"',
    type: 'Monitor',
    serialNumber: 'DELL-US-4422',
    status: 'Available',
    notes: 'In supply closet B.'
  },
  {
    id: 'hw-3',
    name: 'Logitech MX Master 3S',
    type: 'Mouse',
    serialNumber: 'LOGI-MX-7721',
    status: 'Assigned',
    assignedToId: 'emp-2'
  }
];

export const tools: SoftwareTool[] = [
  {
    id: 'tool-1',
    name: 'Slack',
    linkedAccountId: 'acc-1',
    status: 'Active',
    assignedToId: 'emp-1'
  },
  {
    id: 'tool-2',
    name: 'GitHub Enterprise',
    linkedAccountId: 'acc-2',
    status: 'Active',
    assignedToId: 'emp-3',
    expiryDate: '2025-01-01'
  },
  {
    id: 'tool-3',
    name: 'Figma',
    status: 'Active',
    assignedToId: 'emp-2',
    credentials: { email: 'sarah.chen@assetsphere.com', password: '••••••••••••', lastUpdated: '2024-03-20' }
  }
];

export const activities: ActivityLog[] = [
  { id: 'act-1', type: 'assignment', description: 'Assigned MacBook Pro 16" to Alex Rivers', timestamp: '2024-04-18T10:30:00Z', userId: 'admin', userName: 'Admin', module: 'Hardware' },
  { id: 'act-2', type: 'creation', description: 'Created new AWS Production account', timestamp: '2024-04-17T15:45:00Z', userId: 'admin', userName: 'Admin', module: 'Accounts' },
  { id: 'act-3', type: 'security', description: 'Updated password for Slack integration', timestamp: '2024-04-16T09:12:00Z', userId: 'admin', userName: 'Admin', module: 'Tools' },
];

