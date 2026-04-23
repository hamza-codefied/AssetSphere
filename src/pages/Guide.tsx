import { useState } from 'react';
import { Card, Badge } from '../components/ui';
import {
  BookOpen,
  HelpCircle,
  Zap,
  Users,
  ArrowRight,
  ClipboardCheck,
  Rocket,
  Wrench,
  FolderKanban,
  Vault,
  LayoutDashboard,
} from 'lucide-react';

export const Guide = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const sections = [
    { id: 'overview', title: 'System Overview', icon: BookOpen },
    { id: 'roles', title: 'Role Access Matrix', icon: Users },
    { id: 'flows', title: 'Step-by-Step Flows', icon: Zap },
    { id: 'module-playbook', title: 'Module Playbook', icon: Wrench },
  ];

  const GuideCard = ({ title, description, steps }: { title: string; description: string; steps: string[] }) => (
    <Card className="space-y-4">
      <h3 className="font-bold text-lg flex items-center gap-2">
        <ArrowRight className="w-4 h-4 text-primary" />
        {title}
      </h3>
      <p className="text-sm text-muted-foreground">{description}</p>
      <div className="space-y-2">
        {steps.map((step, i) => (
          <div key={i} className="flex gap-3 text-sm items-start">
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold shrink-0 mt-0.5">{i + 1}</span>
            <span className="text-foreground/80">{step}</span>
          </div>
        ))}
      </div>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <HelpCircle className="w-8 h-8 text-indigo-500" />
            User Guide
          </h1>
          <p className="text-muted-foreground">Complete operating guide for Admin, PMO, and Dev users.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <aside className="lg:col-span-1 space-y-2">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveTab(section.id!)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === section.id 
                  ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                  : 'hover:bg-accent text-muted-foreground'
              }`}
            >
              <section.icon className="w-4 h-4" />
              {section.title}
            </button>
          ))}
        </aside>

        <main className="lg:col-span-3 space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="prose prose-invert max-w-none">
                <h2 className="text-2xl font-bold">How AssetSphere Works</h2>
                <p className="text-muted-foreground">
                  AssetSphere centralizes employee lifecycle, hardware, software tools,
                  subscriptions, projects, and credential vault operations in one system.
                  Admin creates employees (PMO/Dev), assigns resources, and tracks access from dashboard to vault.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="border-l-4 border-l-violet-500">
                  <FolderKanban className="w-6 h-6 text-violet-500 mb-2" />
                  <h4 className="font-bold">Operations Modules</h4>
                  <p className="text-xs text-muted-foreground">
                    Employees, Hardware, Tools, Subscriptions, Projects, Accounts.
                  </p>
                </Card>
                <Card className="border-l-4 border-l-emerald-500">
                  <Vault className="w-6 h-6 text-emerald-500 mb-2" />
                  <h4 className="font-bold">Security + Visibility</h4>
                  <p className="text-xs text-muted-foreground">
                    Dashboard alerts/activity and Vault for credential discovery and controlled reveal.
                  </p>
                </Card>
              </div>

              <GuideCard
                title="Recommended first-time setup"
                description="Follow this exact sequence after first login."
                steps={[
                  'Login as Admin (CEO account).',
                  'Create PMO and Dev employees in Employees module.',
                  'Create Central Accounts (AWS, Gmail, domains, etc.).',
                  'Add Hardware assets and assign to employees.',
                  'Add Tools and link to Central Accounts where possible.',
                  'Create Subscriptions and set assignment scope.',
                  'Create Projects with PMO manager + Dev team members.',
                  'Verify Dashboard stats/alerts and test Vault visibility.',
                ]}
              />
            </div>
          )}

          {activeTab === 'roles' && (
            <div className="space-y-5">
              <div className="prose prose-invert max-w-none">
                <h2 className="text-2xl font-bold">Role Access Matrix</h2>
                <p className="text-muted-foreground">
                  Permissions below are enforced by backend guards and used by frontend actions.
                </p>
              </div>

              <Card className="space-y-3 border-l-4 border-l-rose-500">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold">Admin</h3>
                  <Badge variant="danger">Full Access</Badge>
                </div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>- Can create/edit/delete everything across all modules.</li>
                  <li>- Can onboard/edit/offboard/reactivate employees.</li>
                  <li>- Can create/update/delete accounts, tools, hardware, subscriptions, projects.</li>
                  <li>- Can reveal sensitive vault passwords/secrets.</li>
                  <li>- Can view dashboard activity + all operational data.</li>
                </ul>
              </Card>

              <Card className="space-y-3 border-l-4 border-l-amber-500">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold">PMO</h3>
                  <Badge variant="warning">Operational Manager</Badge>
                </div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>- Can create/edit employees, hardware assignment, tools, subscriptions, and projects.</li>
                  <li>- Can offboard employees (no hard delete on restricted modules).</li>
                  <li>- Can view central accounts but cannot create/edit/delete accounts.</li>
                  <li>- Can view vault listing but cannot reveal passwords.</li>
                  <li>- Can use dashboard and activity feed for execution tracking.</li>
                </ul>
              </Card>

              <Card className="space-y-3 border-l-4 border-l-blue-500">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold">Dev</h3>
                  <Badge variant="info">Read Only</Badge>
                </div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>- Can view modules (employees, hardware, tools, subscriptions, projects, dashboard).</li>
                  <li>- Cannot create/edit/delete/offboard resources.</li>
                  <li>- Vault is listing-only (no secret reveal).</li>
                  <li>- Best for execution visibility and dependency checks.</li>
                </ul>
              </Card>
            </div>
          )}

          {activeTab === 'flows' && (
            <div className="space-y-6">
              <GuideCard
                title="Flow 1: Employee Onboarding"
                description="Create a new employee and prepare access baseline."
                steps={[
                  'Employees -> Onboard Employee.',
                  'Fill name, email, role (PMO/Dev), department, password.',
                  'Save and verify user appears in Employees table as Active.',
                  'Open employee profile and confirm role/department details.',
                ]}
              />

              <GuideCard
                title="Flow 2: Asset + Tool Provisioning"
                description="Assign hardware and software access to an employee."
                steps={[
                  'Hardware -> Add Asset (serial/type/optional credential).',
                  'Edit asset and assign to employee.',
                  'Tools -> Add tool, choose linked account or manual credentials.',
                  'Assign tool to same employee and verify counts in Employees profile.',
                ]}
              />

              <GuideCard
                title="Flow 3: Subscription + Project Setup"
                description="Attach commercial + project resources to delivery teams."
                steps={[
                  'Subscriptions -> create with renewal date and scope.',
                  'Projects -> create project with PMO project manager.',
                  'Add Dev team members (PM cannot be in member list).',
                  'Link accounts/hardware/subscriptions and save.',
                  'Open project details tabs (overview/team/credentials/resources) to verify all links.',
                ]}
              />

              <GuideCard
                title="Flow 4: Offboarding & Reactivation"
                description="Securely offboard a user and optionally reactivate later."
                steps={[
                  'Open Employee Profile -> Begin Offboarding.',
                  'Complete wizard steps: hardware return, access revoke, checklist.',
                  'Confirm offboarding and verify employee becomes Inactive.',
                  'If needed, Reactivate from profile to return status to Active.',
                ]}
              />

              <GuideCard
                title="Flow 5: Vault + Dashboard Monitoring"
                description="Use security and executive visibility modules daily."
                steps={[
                  'Dashboard -> review counts, expiring items, and recent activity.',
                  'Vault -> search by module/account/tool/project.',
                  'Admin can use reveal for masked values; PMO/Dev should see masked-only output.',
                  'Use alerts to prioritize renewals and access clean-up actions.',
                ]}
              />
            </div>
          )}

          {activeTab === 'module-playbook' && (
            <div className="space-y-4">
              <div className="prose prose-invert max-w-none">
                <h2 className="text-2xl font-bold">Module Playbook</h2>
                <p className="text-muted-foreground">
                  Run these checks whenever you deploy or demo the system.
                </p>
              </div>

              <Card className="space-y-3">
                <h3 className="font-bold flex items-center gap-2"><ClipboardCheck className="w-4 h-4 text-primary" /> Daily Operator Checklist</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>- Confirm login and role-based navigation for Admin/PMO/Dev.</li>
                  <li>- Verify employee list excludes admin from operational listing.</li>
                  <li>- Verify hardware/tool assignments reflect inside employee profile.</li>
                  <li>- Check one subscription status update and one project team update.</li>
                  <li>- Check vault listing + reveal behavior by role.</li>
                  <li>- Review dashboard activity after any create/update/delete action.</li>
                </ul>
              </Card>

              <Card className="space-y-3">
                <h3 className="font-bold flex items-center gap-2"><Rocket className="w-4 h-4 text-emerald-500" /> Release Validation Checklist</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>- Auth: login, refresh, logout flow.</li>
                  <li>- Employees: create, edit, offboard, reactivate, delete constraints.</li>
                  <li>- Accounts: create, update, regenerate backup codes, delete.</li>
                  <li>- Hardware/Tools: create, assign/unassign via edit, delete.</li>
                  <li>- Subscriptions/Projects: create, update status/team/resources, delete.</li>
                  <li>- Dashboard/Vault: data integrity + permission boundaries.</li>
                </ul>
              </Card>

              <Card className="space-y-3 border-l-4 border-l-blue-500">
                <h3 className="font-bold flex items-center gap-2"><LayoutDashboard className="w-4 h-4 text-blue-500" /> Permission Summary by Role</h3>
                <p className="text-sm text-muted-foreground">
                  Admin: full CUD + reveal secrets. PMO: operational C/U in most modules, view accounts, no reveal. Dev: view-only across modules.
                </p>
              </Card>
            </div>
          )}

        </main>
      </div>
    </div>
  );
};
