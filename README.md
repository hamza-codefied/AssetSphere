# Asset & Credential Management System (ACMS)

A centralized solution for managing physical hardware, software platforms, and core company accounts with a unified credential layer and linking architecture.

## ⚙️ Core Architecture

The system is built on a **Centralized Linking System**. Instead of repeating login credentials for every tool, the system links software platforms to a "Core Account" (like a primary Gmail or AWS identity).

### 1. Accounts Module (The Hub)
This is the most critical module. Every major identity is stored here first.
- **Purpose:** Store root identities (Gmail, AWS, Domain Registrars).
- **Key Features:** Encryption-ready password storage, 2FA backup code management, and account ownership tracking.

### 2. Tools & Platforms Module
Handles all SaaS and software subscriptions.
- **The Link:** Every tool is linked to an entry in the **Accounts Module**.
- **Management:** Tracks expiry dates, renewal cycles, and user assignments.

### 3. Hardware Module (Physical Assets)
Tracks the lifecycle of physical equipment.
- **Asset Types:** Laptops, PCs, peripherals.
- **Security:** Stores local device passwords and PINs.
- **Workflow:** Status tracking (Available vs. Assigned).

### 4. Employees Module
The central registry for all staff members.
- **Integration:** Acts as the primary "Assignee" for both physical hardware and digital tool seats.
- **Offboarding:** Provides a single view of all assets (hardware + accounts) that need to be revoked when an employee leaves.

### 5. Subscriptions Module
Centralized management of all purchased subscriptions and licenses.
- **Subscription Types:** SaaS platforms, software licenses, cloud services, vendor subscriptions.
- **Linking Options:** Each subscription can be linked to a central account OR stored as a standalone credential.
- **Assignment Flexibility:** Subscriptions can be assigned to an **Individual Employee**, a **Team**, or marked as **Company-Wide**.
- **Lifecycle Tracking:** Monitors purchase date, renewal date, billing cycle, and license count.
- **Expiry Alerts:** Automatic notifications triggered at configurable intervals (e.g., 30 days, 7 days before expiration).
- **Cost Tracking:** Records subscription cost, billing frequency, and vendor information for budget management.
- **Status Management:** Tracks subscription status (Active, Expiring Soon, Expired, Cancelled) for compliance and planning.

### 6. Roles & Permissions Module
Granular access control system for managing what each user can do in the system.
- **Role Types:** Admin, Manager, Team Lead, Viewer, Contributor.
- **Permission Scopes:**
  - **System-Level:** Full system access, user management, configuration.
  - **Project-Level:** Access to specific projects and their linked credentials.
  - **Resource-Level:** Granular permissions on Accounts, Hardware, Subscriptions, etc.
- **Actions:** View, Create, Edit, Delete, Export, Share credentials and assets.
- **Role Assignment:** Employees are assigned roles either globally or at the project level.
- **Permission Inheritance:** Project-level assignments override system-level restrictions based on hierarchy.

### 7. Projects Module
Client-specific project management with integrated credential and account access.
- **Project Information:** Client name, project description, status (Active, Archived, Completed), and timeline.
- **Credential Linking:** Store client-provided accounts and passwords specific to the project.
  - **Linked Accounts:** Credentials can reference the **Accounts Module** or be stored as **Standalone Credentials**.
  - **Hardware Assignment:** Specific hardware items can be linked to projects.
  - **Subscriptions:** Project-specific subscription access within the broader **Subscriptions Module**.
- **Team Management:**
  - **Project Ownership:** Designate project managers and team members.
  - **Employee Assignment:** Admin assigns employees to projects with specific roles.
  - **Access Control:** Assigned employees see only credentials and assets linked to their project.
- **Visibility Rules:**
  - Employees see all accounts, passwords, and resources for their assigned projects.
  - Non-assigned employees have zero visibility into project credentials.
  - Admin has full visibility across all projects.
- **Project Dashboard:** Quick overview of team members, credentials, hardware, and subscription usage for the project.

---

## 🔗 The Linking Workflow

To maintain a "Single Source of Truth," follow this logic:

1. **Create Account:** Define a core identity in the **Accounts Module** (e.g., `dev-ops@company.com`).
2. **Register Tool:** Add a tool in the **Tools Module** (e.g., `Sentry`).
3. **Link:** Map `Sentry` to `dev-ops@company.com`. 
4. **Assign:** Assign the Tool or Hardware to an **Employee**.

---

## � Standalone Credentials Workflow

For passwords that do **not** require linking to a central account, use the **Standalone Credentials** storage:

**Flow:**
1. **Create Standalone Entry:** Store the credential directly in the system without linking to an **Accounts Module** entry.
2. **Document Context:** Include metadata about the service, purpose, and ownership.
3. **Apply Security:** Still use encryption-ready password storage and 2FA support where applicable.
4. **Assign Owner:** Link the credential to an **Employee** or **Team** for accountability and access control.

**Key Difference:** Unlike linked credentials that inherit permissions from a core account, standalone credentials maintain their own access scope and lifecycle.

---

## 📋 Project Assignment Workflow

How administrators assign employees to projects and control credential visibility:

**Flow:**
1. **Create Project:** Admin creates a new project in the **Projects Module** with client details and status.
2. **Link Credentials:** Associate all client-provided accounts and passwords to the project (either as **Linked Accounts** or **Standalone Credentials**).
3. **Assign Employees:** Admin adds employees to the project and assigns them specific roles (e.g., Team Lead, Developer, Viewer).
4. **Set Permissions:** Based on the assigned role, define what actions each employee can perform (View, Edit, Export, etc.).
5. **Access Activation:** Employees immediately see all credentials and resources linked to their assigned project.
6. **Audit Trail:** System logs all access to project credentials for compliance and security audits.

**Key Outcome:** Employees work in siloed project environments with access only to their assigned projects' credentials.

---

## 👥 Role & Permission Assignment Workflow

How to establish granular access control across the system:

**Flow:**
1. **Define Role:** Admin creates or selects a predefined role (Admin, Manager, Team Lead, Viewer, Contributor).
2. **Assign to Employee:** Assign the role either globally (system-wide) or at the project level.
3. **Grant Permissions:** Configure what actions the role can perform:
   - **System-Level:** User management, configuration, system-wide credential access.
   - **Project-Level:** View, create, edit, delete credentials for assigned projects.
   - **Resource-Level:** Specific permissions on Accounts, Hardware, Subscriptions, Tools.
4. **Test Access:** Verify the employee's access reflects the intended permissions.
5. **Review & Audit:** Periodically review role assignments and permissions for least-privilege compliance.

**Permission Inheritance:** Project-level roles override system-level roles for better granularity.

---

## 🖥️ Hardware Assignment Workflow

How to manage physical asset allocation to employees:

**Flow:**
1. **Register Hardware:** Add the device to the **Hardware Module** with asset type, serial number, and status (Available, Assigned, Retired).
2. **Store Credentials:** Record the device password, PIN, or unlock credentials.
3. **Assign to Employee:** Link the hardware to an employee and set the assignment date.
4. **Link to Project (Optional):** If the hardware is project-specific, link it to the relevant project.
5. **Update Status:** Change status from "Available" to "Assigned" to track allocation.
6. **Maintain Lifecycle:** Record any transfers, repairs, or decommissioning events.

**Access Control:** Only assigned employees and admins can view hardware credentials.

---

## 📱 Subscription Management Workflow

How to track, renew, and manage all company subscriptions:

**Flow:**
1. **Create Subscription Entry:** Add subscription details to the **Subscriptions Module** (name, vendor, cost, billing cycle).
2. **Set Renewal Date:** Record purchase date and renewal/expiry date for automated tracking.
3. **Configure Alert Intervals:** Set up expiry notifications (e.g., 30 days, 7 days, 1 day before expiration).
4. **Link Credentials:** Associate the subscription with an **Account** (linked or standalone) if credentials are required.
5. **Assign Scope:** Determine whether the subscription is for an Individual, Team, or Company-Wide.
6. **Assign Beneficiaries:** If individual or team-level, specify which employees have access to the subscription.
7. **Monitor Status:** System automatically tracks status (Active, Expiring Soon, Expired, Cancelled).
8. **Receive Alerts:** Admin and assigned employees receive notifications at configured intervals before expiry.
9. **Renew or Cancel:** Update the subscription status and renewal date when action is taken.

**Cost Tracking:** Maintain a record of all subscription costs for budget reporting.

---

## 🔄 Credential Update Workflow

How to securely update and rotate credentials across the system:

**Flow:**
1. **Identify Credential:** Locate the account in **Accounts Module** or **Standalone Credentials**.
2. **Update Password:** Change the password or credential in the source system.
3. **Update in ACMS:** Admin updates the encrypted password field in the module.
4. **Record Change:** System automatically logs the update timestamp and user who made the change.
5. **Notify Linked Tools:** If the credential is linked to multiple tools, document the update scope.
6. **Verify Access:** Test that the updated credential works for all linked accounts and projects.
7. **Audit Trail:** Maintain a historical log of all credential changes for compliance.

**Security Consideration:** Use encryption to protect passwords even during updates. Enforce password rotation policies at the organization level.

---

## 👁️ Access Control & Data Visibility Workflow

How the system determines what each user can see and do:

**Flow:**
1. **User Logs In:** Employee authenticates with their credentials.
2. **Retrieve User Profile:** System pulls the employee's roles and permissions.
3. **Check Project Assignments:** System identifies all projects assigned to the employee.
4. **Apply Role-Based Filter:** Based on the user's role, filter actions they can perform (View, Edit, Delete, etc.).
5. **Determine Visibility Scope:**
   - **Admins:** See all modules, projects, credentials, and employees.
   - **Project Members:** See only credentials, hardware, and subscriptions linked to their assigned projects.
   - **Viewers:** Can only view information; cannot edit or delete.
   - **Contributors:** Can view and create/edit resources within their project scope.
6. **Display Dashboard:** Show only the resources the user has permission to access.
7. **Log Access:** Record every credential view or access for security and audit purposes.

**Zero-Trust Approach:** Non-assigned employees have zero visibility into project credentials, regardless of their system-level role.

---

## 🚪 Offboarding Workflow

Comprehensive process for revoking access when an employee leaves:

**Flow:**
1. **Initiate Offboarding:** Admin marks the employee as "Offboarding" or "Inactive" in the **Employees Module**.
2. **Retrieve Assignments:** System displays all assets assigned to the employee:
   - **Projects:** All assigned projects.
   - **Hardware:** All assigned devices.
   - **Subscriptions:** All individual/team subscriptions the employee has access to.
   - **Accounts:** All linked accounts and standalone credentials.
3. **Revoke Access:** Admin deactivates the employee's login and system access.
4. **Reassign Resources:**
   - **Reassign Projects:** Transfer project assignments to other team members.
   - **Return Hardware:** Document the return or transfer of physical assets.
   - **Update Subscriptions:** Remove the employee from team/individual subscriptions; reallocate if needed.
   - **Revoke Credential Access:** Remove the employee's access to all linked accounts.
5. **Change Credentials (Optional):** If the employee had unique access to critical accounts, change those passwords and update all linked tools.
6. **Archive Employee Record:** Keep the employee record for audit purposes but mark as inactive.
7. **Generate Report:** Create an offboarding report for compliance and legal records.

**Key Outcome:** Complete removal of access across all modules in a single workflow.

---

## ⏰ Expiry & Alert Management Workflow

How the system proactively manages credential and subscription expirations:

**Flow:**
1. **Schedule Alerts:** For each credential, subscription, and hardware license, set expiry alert intervals (e.g., 30 days, 7 days, 1 day before expiration).
2. **Background Job Monitoring:** System continuously checks expiry dates in **Accounts Module**, **Subscriptions Module**, and **Tools Module**.
3. **Trigger Notifications:** When an item approaches expiry:
   - Send email alerts to assigned employees and admins.
   - Display notifications in the employee's dashboard.
   - Flag items in the admin console with "Expiring Soon" status.
4. **Escalation:** If expiry date passes without action, escalate alerts to managers or higher-level admins.
5. **Action Required:** Employee or admin updates the credential/subscription:
   - **Renew:** Extend the expiry date and clear the alert.
   - **Replace:** If no longer needed, mark as cancelled and remove from active use.
   - **Update:** Change the credential or subscription details and reset the expiry date.
6. **Clear Alert:** Once action is taken, the alert is automatically cleared from the dashboard.
7. **Compliance Report:** Generate reports showing which expirations were missed or delayed for security audits.

**Alert Channels:** Email, in-app notifications, SMS (optional), and admin dashboard alerts.

---

## �🛡️ Central Credentials Layer

Behind every module is a standardized security structure:
- **Username/Email:** Primary identifier.
- **Encrypted Password:** Secure storage for credentials.
- **2FA Management:** Support for Authenticator seeds and emergency backup codes.
- **Update Tracking:** "Last Updated" timestamps for security compliance.

---

## 🚀 Key Benefits
- **Zero Duplication:** Update a password in one place, and it reflects across all linked tools.
- **Enhanced Security:** Centralized 2FA and credential tracking.
- **Simplified Offboarding:** Instantly see everything assigned to an employee in one dashboard.
