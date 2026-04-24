export type AssetStatus = 'Available' | 'Assigned' | 'Inactive';
export type ToolStatus = 'Active' | 'Expired';
export type AccountStatus = 'Active' | 'Disabled';
export type EmployeeStatus = 'Active' | 'Inactive';
export type SubscriptionStatus = 'Active' | 'Expiring Soon' | 'Expired' | 'Cancelled';
export type BillingCycle = 'Monthly' | 'Quarterly' | 'Annual' | 'One-Time';
export type AssignmentScope = 'Individual' | 'Team' | 'Company-Wide';
export type ProjectStatus = 'Active' | 'Archived' | 'Completed';
export type ProjectRole = 'Project Manager' | 'Team Lead' | 'Developer' | 'Viewer' | 'Contributor';

export interface Credentials {
  username?: string;
  email?: string;
  password?: string;
  pin?: string;
  /** Extra labeled secrets (API keys, recovery codes, tenant IDs, etc.) */
  customFields?: { key: string; value: string }[];
  twoFactor?: {
    type: 'Authenticator' | 'SMS' | 'Email';
    /** Issuer / app used (e.g. "Google Authenticator", "Authy") */
    issuer?: string;
    /** TOTP secret (base32) for Authenticator method */
    secret?: string;
    /** Phone number for SMS method (E.164 preferred) */
    phoneNumber?: string;
    /** Recovery email for Email-based 2FA */
    recoveryEmail?: string;
    /** One-time recovery/backup codes */
    backupCodes?: string[];
    /** ISO date when 2FA was enrolled */
    enrolledAt?: string;
  };
  passwordLocked?: boolean;
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

/** System access role. Admin is seeded; PMO/Dev are created by admin. */
export type EmployeeRole = 'admin' | 'pmo' | 'dev';

export interface Employee {
  id: string;
  name: string;
  email: string;
  role: EmployeeRole;
  avatar?: string;
  status: EmployeeStatus;
  department?: string;
  phone?: string;
  assignedAssetCount?: number;
  assignedToolCount?: number;
  offboardedAt?: string;
  offboardNotes?: string;
}

export interface Subscription {
  id: string;
  name: string;
  vendor: string;
  type: 'SaaS' | 'License' | 'Cloud' | 'Vendor' | 'Other';
  cost: number;
  billingCycle: BillingCycle;
  purchaseDate: string;
  renewalDate: string;
  status: SubscriptionStatus;
  assignmentScope: AssignmentScope;
  /** Employee IDs when scope is Individual; team member IDs when Team */
  assignedToIds?: string[];
  /** Free-form team name when scope is Team */
  teamName?: string;
  linkedAccountId?: string;
  credentials?: Partial<Credentials>;
  licenseCount?: number;
  notes?: string;
  /** Days before renewal to trigger alert: e.g. [30, 7, 1] */
  alertDays?: number[];
}

export interface ProjectMember {
  employeeId: string;
  role: ProjectRole;
}

export interface StandaloneCredential {
  id: string;
  label: string;
  username?: string;
  password?: string;
  passwordLocked?: boolean;
  url?: string;
  notes?: string;
  customFields?: { key: string; value: string }[];
  lastUpdated: string;
}

export interface Project {
  id: string;
  name: string;
  clientName: string;
  description?: string;
  status: ProjectStatus;
  startDate: string;
  endDate?: string;
  projectManager?: string; // employeeId
  members: ProjectMember[];
  linkedAccountIds: string[];
  hardwareIds: string[];
  subscriptionIds: string[];
  standaloneCredentials: StandaloneCredential[];
  notes?: string;
}

export interface ActivityLog {
  id: string;
  type: 'assignment' | 'creation' | 'update' | 'deletion' | 'security';
  description: string;
  timestamp: string;
  userId: string;
  userName: string;
  module: 'Hardware' | 'Tools' | 'Accounts' | 'Employees' | 'Subscriptions' | 'Projects';
}
