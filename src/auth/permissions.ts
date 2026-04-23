export type UserRole = 'admin' | 'pmo' | 'dev';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export type Permission =
  | 'hardware.view' | 'hardware.create' | 'hardware.edit' | 'hardware.delete' | 'hardware.assign'
  | 'tools.view' | 'tools.create' | 'tools.edit' | 'tools.delete' | 'tools.link'
  | 'accounts.view' | 'accounts.create' | 'accounts.edit' | 'accounts.delete'
  | 'employees.view' | 'employees.create' | 'employees.edit' | 'employees.deactivate' | 'employees.offboard'
  | 'subscriptions.view' | 'subscriptions.create' | 'subscriptions.edit' | 'subscriptions.delete'
  | 'projects.view' | 'projects.create' | 'projects.edit' | 'projects.delete' | 'projects.manage_members'
  | 'vault.view' | 'vault.reveal_passwords' | 'vault.copy'
  | 'dashboard.view' | 'dashboard.activity'
  | 'guide.view' | 'settings.view';

const rolePermissions: Record<UserRole, Permission[]> = {
  admin: [
    'hardware.view', 'hardware.create', 'hardware.edit', 'hardware.delete', 'hardware.assign',
    'tools.view', 'tools.create', 'tools.edit', 'tools.delete', 'tools.link',
    'accounts.view', 'accounts.create', 'accounts.edit', 'accounts.delete',
    'employees.view', 'employees.create', 'employees.edit', 'employees.deactivate', 'employees.offboard',
    'subscriptions.view', 'subscriptions.create', 'subscriptions.edit', 'subscriptions.delete',
    'projects.view', 'projects.create', 'projects.edit', 'projects.delete', 'projects.manage_members',
    'vault.view', 'vault.reveal_passwords', 'vault.copy',
    'dashboard.view', 'dashboard.activity',
    'guide.view', 'settings.view',
  ],
  pmo: [
    'hardware.view', 'hardware.create', 'hardware.assign',
    'tools.view', 'tools.create', 'tools.edit', 'tools.link',
    'accounts.view',
    'employees.view', 'employees.create', 'employees.edit', 'employees.offboard',
    'subscriptions.view', 'subscriptions.create', 'subscriptions.edit',
    'projects.view', 'projects.create', 'projects.edit', 'projects.manage_members',
    'vault.view',
    'dashboard.view', 'dashboard.activity',
    'guide.view',
  ],
  dev: [
    'hardware.view',
    'tools.view',
    'accounts.view',
    'employees.view',
    'subscriptions.view',
    'projects.view',
    'dashboard.view',
    'guide.view',
  ],
};

export const getPermissions = (role: UserRole): Permission[] => rolePermissions[role];

export const hasPermission = (role: UserRole, permission: Permission): boolean =>
  rolePermissions[role].includes(permission);

export const mockUsers: { email: string; password: string; user: AuthUser }[] = [
  {
    email: 'admin@assetsphere.com',
    password: 'admin123',
    user: { id: 'user-admin', name: 'Rohail', email: 'admin@assetsphere.com', role: 'admin' },
  },
  {
    email: 'pmo@assetsphere.com',
    password: 'pmo123',
    user: { id: 'user-pmo', name: 'Sarah Miller', email: 'pmo@assetsphere.com', role: 'pmo' },
  },
  {
    email: 'dev@assetsphere.com',
    password: 'dev123',
    user: { id: 'user-dev', name: 'Alex Rivers', email: 'dev@assetsphere.com', role: 'dev' },
  },
];

export const roleConfig: Record<UserRole, { label: string; color: string; description: string }> = {
  admin: {
    label: 'Administrator',
    color: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
    description: 'Full system access. Manage all assets, accounts, employees, subscriptions, projects, and security configurations.',
  },
  pmo: {
    label: 'Project Manager',
    color: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    description: 'Manage hardware assignments, tool provisioning, employee onboarding, subscriptions, and projects. Limited vault access.',
  },
  dev: {
    label: 'Developer',
    color: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    description: 'View-only access to assigned assets, tools, subscriptions, and projects. Cannot modify system configurations.',
  },
};
