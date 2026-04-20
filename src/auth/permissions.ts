export type UserRole = 'admin' | 'pmo' | 'dev';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

// All granular permissions in the system
export type Permission =
  | 'hardware.view'
  | 'hardware.create'
  | 'hardware.edit'
  | 'hardware.delete'
  | 'hardware.assign'
  | 'tools.view'
  | 'tools.create'
  | 'tools.edit'
  | 'tools.delete'
  | 'tools.link'
  | 'accounts.view'
  | 'accounts.create'
  | 'accounts.edit'
  | 'accounts.delete'
  | 'employees.view'
  | 'employees.create'
  | 'employees.edit'
  | 'employees.deactivate'
  | 'vault.view'
  | 'vault.reveal_passwords'
  | 'vault.copy'
  | 'dashboard.view'
  | 'dashboard.activity'
  | 'guide.view'
  | 'settings.view';

// Role → Permission matrix
const rolePermissions: Record<UserRole, Permission[]> = {
  admin: [
    'hardware.view', 'hardware.create', 'hardware.edit', 'hardware.delete', 'hardware.assign',
    'tools.view', 'tools.create', 'tools.edit', 'tools.delete', 'tools.link',
    'accounts.view', 'accounts.create', 'accounts.edit', 'accounts.delete',
    'employees.view', 'employees.create', 'employees.edit', 'employees.deactivate',
    'vault.view', 'vault.reveal_passwords', 'vault.copy',
    'dashboard.view', 'dashboard.activity',
    'guide.view', 'settings.view',
  ],
  pmo: [
    'hardware.view', 'hardware.create', 'hardware.assign',
    'tools.view', 'tools.create', 'tools.edit', 'tools.link',
    'accounts.view',
    'employees.view', 'employees.create', 'employees.edit',
    'vault.view',
    'dashboard.view', 'dashboard.activity',
    'guide.view',
  ],
  dev: [
    'hardware.view',
    'tools.view',
    'accounts.view',
    'employees.view',
    'dashboard.view',
    'guide.view',
  ],
};

export const getPermissions = (role: UserRole): Permission[] => rolePermissions[role];

export const hasPermission = (role: UserRole, permission: Permission): boolean =>
  rolePermissions[role].includes(permission);

// Mock user credentials for demo
export const mockUsers: { email: string; password: string; user: AuthUser }[] = [
  {
    email: 'admin@assetsphere.com',
    password: 'admin123',
    user: {
      id: 'user-admin',
      name: 'John Doe',
      email: 'admin@assetsphere.com',
      role: 'admin',
    },
  },
  {
    email: 'pmo@assetsphere.com',
    password: 'pmo123',
    user: {
      id: 'user-pmo',
      name: 'Sarah Miller',
      email: 'pmo@assetsphere.com',
      role: 'pmo',
    },
  },
  {
    email: 'dev@assetsphere.com',
    password: 'dev123',
    user: {
      id: 'user-dev',
      name: 'Alex Rivers',
      email: 'dev@assetsphere.com',
      role: 'dev',
    },
  },
];

// Role display metadata
export const roleConfig: Record<UserRole, { label: string; color: string; description: string }> = {
  admin: {
    label: 'Administrator',
    color: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
    description: 'Full system access. Manage all assets, accounts, employees, and security configurations.',
  },
  pmo: {
    label: 'Project Manager',
    color: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    description: 'Manage hardware assignments, tool provisioning, and employee onboarding. Limited vault access.',
  },
  dev: {
    label: 'Developer',
    color: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    description: 'View-only access to assigned assets and tools. Cannot modify system configurations.',
  },
};
