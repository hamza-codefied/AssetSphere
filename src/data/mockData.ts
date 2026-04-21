import type { Employee, HardwareAsset, Account, SoftwareTool, ActivityLog, Subscription, Project } from '../types';

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

export const subscriptions: Subscription[] = [
  {
    id: 'sub-1',
    name: 'GitHub Enterprise',
    vendor: 'GitHub Inc.',
    type: 'SaaS',
    cost: 420,
    billingCycle: 'Annual',
    purchaseDate: '2024-01-01',
    renewalDate: '2026-05-01',
    status: 'Expiring Soon',
    assignmentScope: 'Company-Wide',
    linkedAccountId: 'acc-2',
    licenseCount: 25,
    alertDays: [30, 7, 1],
    notes: 'Covers all engineering seats.',
  },
  {
    id: 'sub-2',
    name: 'Figma Organization',
    vendor: 'Figma Inc.',
    type: 'SaaS',
    cost: 45,
    billingCycle: 'Monthly',
    purchaseDate: '2024-02-01',
    renewalDate: '2026-06-15',
    status: 'Active',
    assignmentScope: 'Team',
    teamName: 'Design Team',
    assignedToIds: ['emp-2'],
    licenseCount: 5,
    alertDays: [30, 7],
    credentials: { email: 'sarah.chen@assetsphere.com', password: '••••••••••••', lastUpdated: '2024-03-20' },
  },
  {
    id: 'sub-3',
    name: 'AWS Business',
    vendor: 'Amazon Web Services',
    type: 'Cloud',
    cost: 890,
    billingCycle: 'Monthly',
    purchaseDate: '2023-06-01',
    renewalDate: '2026-06-01',
    status: 'Active',
    assignmentScope: 'Company-Wide',
    linkedAccountId: 'acc-2',
    alertDays: [30],
    notes: 'Production and staging environments.',
  },
  {
    id: 'sub-4',
    name: 'Slack Pro',
    vendor: 'Salesforce',
    type: 'SaaS',
    cost: 8.75,
    billingCycle: 'Monthly',
    purchaseDate: '2023-09-01',
    renewalDate: '2024-12-31',
    status: 'Expired',
    assignmentScope: 'Company-Wide',
    linkedAccountId: 'acc-1',
    licenseCount: 20,
    alertDays: [30, 7, 1],
  },
  {
    id: 'sub-5',
    name: 'JetBrains All Products',
    vendor: 'JetBrains s.r.o.',
    type: 'License',
    cost: 700,
    billingCycle: 'Annual',
    purchaseDate: '2024-04-01',
    renewalDate: '2026-04-28',
    status: 'Expiring Soon',
    assignmentScope: 'Individual',
    assignedToIds: ['emp-1', 'emp-3'],
    licenseCount: 2,
    alertDays: [30, 7],
  },
];

export const projects: Project[] = [
  {
    id: 'proj-1',
    name: 'E-Commerce Relaunch',
    clientName: 'RetailCo Ltd.',
    description: 'Full redesign and relaunch of the client e-commerce platform with new checkout flow.',
    status: 'Active',
    startDate: '2024-02-01',
    endDate: '2024-09-30',
    projectManager: 'emp-3',
    members: [
      { employeeId: 'emp-1', role: 'Developer' },
      { employeeId: 'emp-2', role: 'Team Lead' },
      { employeeId: 'emp-3', role: 'Project Manager' },
    ],
    linkedAccountIds: ['acc-2'],
    hardwareIds: ['hw-1'],
    subscriptionIds: ['sub-3'],
    standaloneCredentials: [
      {
        id: 'sc-1',
        label: 'RetailCo Staging Admin',
        username: 'staging-admin',
        password: '••••••••••••',
        url: 'https://staging.retailco.com/admin',
        notes: 'Shared staging environment credentials.',
        lastUpdated: '2024-03-10',
      },
    ],
    notes: 'Priority client — keep deadlines.',
  },
  {
    id: 'proj-2',
    name: 'Internal HR Portal',
    clientName: 'Internal',
    description: 'Build and deploy an internal HR portal for employee self-service.',
    status: 'Active',
    startDate: '2024-03-15',
    projectManager: 'emp-4',
    members: [
      { employeeId: 'emp-4', role: 'Project Manager' },
      { employeeId: 'emp-1', role: 'Developer' },
    ],
    linkedAccountIds: [],
    hardwareIds: [],
    subscriptionIds: ['sub-2'],
    standaloneCredentials: [
      {
        id: 'sc-2',
        label: 'HR Portal DB',
        username: 'hr_db_admin',
        password: '••••••••••••',
        url: 'postgres://hr-db.internal:5432',
        lastUpdated: '2024-03-20',
      },
    ],
  },
  {
    id: 'proj-3',
    name: 'Brand Identity 2024',
    clientName: 'StartupXYZ',
    description: 'Complete brand identity refresh including logo, design system, and marketing site.',
    status: 'Completed',
    startDate: '2023-11-01',
    endDate: '2024-02-28',
    projectManager: 'emp-2',
    members: [
      { employeeId: 'emp-2', role: 'Project Manager' },
    ],
    linkedAccountIds: [],
    hardwareIds: [],
    subscriptionIds: ['sub-2'],
    standaloneCredentials: [],
  },
];

export const activities: ActivityLog[] = [
  { id: 'act-1', type: 'assignment', description: 'Assigned MacBook Pro 16" to Alex Rivers', timestamp: '2024-04-18T10:30:00Z', userId: 'admin', userName: 'Admin', module: 'Hardware' },
  { id: 'act-2', type: 'creation', description: 'Created new AWS Production account', timestamp: '2024-04-17T15:45:00Z', userId: 'admin', userName: 'Admin', module: 'Accounts' },
  { id: 'act-3', type: 'security', description: 'Updated password for Slack integration', timestamp: '2024-04-16T09:12:00Z', userId: 'admin', userName: 'Admin', module: 'Tools' },
];

