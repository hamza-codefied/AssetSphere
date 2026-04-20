export type AssetStatus = 'Available' | 'Assigned' | 'Inactive';
export type ToolStatus = 'Active' | 'Expired';
export type AccountStatus = 'Active' | 'Disabled';
export type EmployeeStatus = 'Active' | 'Inactive';

export interface Credentials {
  username?: string;
  email?: string;
  password?: string;
  pin?: string;
  twoFactor?: {
    type: 'Authenticator' | 'SMS' | 'Email';
    backupCodes?: string[];
    secret?: string;
  };
  lastUpdated: string;
}

export interface HardwareAsset {
  id: string;
  name: string;
  type: string;
  serialNumber: string;
  status: AssetStatus;
  assignedToId?: string; // Employee ID
  credentials?: Credentials;
  notes?: string;
}

export interface Account {
  id: string;
  type: 'Gmail' | 'AWS' | 'Domain' | 'Slack' | 'GitHub' | 'Figma' | 'Notion' | 'Other';
  name: string;
  email: string;
  credentials: Credentials;
  ownerId?: string; // Employee ID or 'Company'
  isCompanyOwned: boolean;
  status: AccountStatus;
}

export interface SoftwareTool {
  id: string;
  name: string;
  linkedAccountId?: string; // Links to Accounts Module
  assignedToId?: string; // Employee ID
  expiryDate?: string;
  status: ToolStatus;
  credentials?: Partial<Credentials>; // Can be partial if linked
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  status: EmployeeStatus;
  assignedAssetCount?: number;
  assignedToolCount?: number;
}

export interface ActivityLog {
  id: string;
  type: 'assignment' | 'creation' | 'update' | 'deletion' | 'security';
  description: string;
  timestamp: string;
  userId: string;
  userName: string;
  module: 'Hardware' | 'Tools' | 'Accounts' | 'Employees';
}
