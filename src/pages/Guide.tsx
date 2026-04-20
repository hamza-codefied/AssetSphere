import { useState } from 'react';
import { Card, Badge } from '../components/ui';
import { 
  BookOpen, 
  HelpCircle, 
  Terminal, 
  ShieldCheck, 
  Zap, 
  ArrowRight,
  Monitor,
  Link as LinkIcon
} from 'lucide-react';

export const Guide = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const sections = [
    { id: 'overview', title: 'System Overview', icon: BookOpen },
    { id: 'identity', title: 'Identity Linking', icon: ShieldCheck },
    { id: 'workflows', title: 'Key Workflows', icon: Zap },
    { id: 'testing', title: 'Testing Guide', icon: Terminal },
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
            Knowledge Base
          </h1>
          <p className="text-muted-foreground">Master the AssetSphere platform with this interactive guide.</p>
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
              <div className="prose dark:prose-invert">
                <h2 className="text-2xl font-bold">Welcome to AssetSphere</h2>
                <p className="text-muted-foreground">
                  AssetSphere is an enterprise-grade Internal Resource Management System designed to bridge the gap between 
                  physical hardware, software tools, and digital identities.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="border-l-4 border-l-blue-500">
                   <Monitor className="w-6 h-6 text-blue-500 mb-2" />
                   <h4 className="font-bold">Hardware Fleet</h4>
                   <p className="text-xs text-muted-foreground">Track laptops, monitors, and peripherals with real-time assignment status.</p>
                </Card>
                <Card className="border-l-4 border-l-violet-500">
                   <ShieldCheck className="w-6 h-6 text-violet-500 mb-2" />
                   <h4 className="font-bold">Central Identity</h4>
                   <p className="text-xs text-muted-foreground">Manage core accounts (AWS, Google) in one place to avoid credential sprawl.</p>
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'identity' && (
            <div className="space-y-6">
              <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-2xl p-6 flex gap-4">
                 <LinkIcon className="w-8 h-8 text-indigo-500 shrink-0" />
                 <div>
                   <h3 className="font-bold text-lg">The "Linked Account" Concept</h3>
                   <p className="text-sm text-muted-foreground mt-1">
                     Instead of creating passwords for every single tool (Slack, Figma, GitHub), 
                     AssetSphere encourages linking tools to a **Central Account**.
                   </p>
                 </div>
              </div>
              <div className="space-y-4">
                <GuideCard 
                  title="How it works"
                  description="A tool inherits its security posture and credentials from the linked account."
                  steps={[
                    "Create a Central Account (e.g., Marketing Admin Gmail).",
                    "Add a Tool (e.g., Buffer).",
                    "Choose 'Link Central Account' and pick the Gmail.",
                    "The tool now shows it's powered by that central identity."
                  ]}
                />
              </div>
            </div>
          )}

          {activeTab === 'workflows' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <GuideCard 
                title="Onboarding an Employee"
                description="The standard flow for adding new team members."
                steps={[
                  "Go to 'Employees' and click 'Onboard'.",
                  "Enter their details and role.",
                  "Navigate to 'Hardware' and assign a laptop to them.",
                  "Navigate to 'Tools' and provide access to core platforms."
                ]}
              />
              <GuideCard 
                title="Security Auditing"
                description="How to verify system security."
                steps={[
                  "Use the 'Credential Vault' to find specific secrets.",
                  "Toggle visibility to verify passwords.",
                  "Check 'Security Alerts' on the Dashboard for weak links."
                ]}
              />
            </div>
          )}

          {activeTab === 'testing' && (
            <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
              <div className="prose dark:prose-invert max-w-none">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Terminal className="w-6 h-6 text-emerald-500" />
                  Testing Protocols & Scenarios
                </h2>
                <p className="text-muted-foreground">Follow these step-by-step protocols to verify the system's recursive state engine.</p>
              </div>

              <div className="space-y-6">
                {/* Scenario 1 */}
                <div className="p-6 rounded-2xl bg-slate-900 text-slate-100 shadow-xl border border-slate-800">
                  <div className="flex items-center justify-between mb-4">
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-none">Scenario: The Linking Chain</Badge>
                    <span className="text-[10px] uppercase font-bold text-slate-500">Identity Flow</span>
                  </div>
                  <div className="space-y-4 font-mono text-sm">
                    <div className="flex gap-3">
                      <span className="text-slate-500">01</span>
                      <p>Go to <span className="text-indigo-400">"Central Accounts"</span> and click <span className="text-white">"Create Central Account"</span>. Use <span className="text-amber-300">"Demo AWS"</span>.</p>
                    </div>
                    <div className="flex gap-3">
                      <span className="text-slate-500">02</span>
                      <p>Go to <span className="text-indigo-400">"Tools"</span> and Add a new tool. Select <span className="text-amber-300">"Demo AWS"</span> in the dropdown.</p>
                    </div>
                    <div className="flex gap-3 border-t border-slate-800 pt-4">
                      <span className="text-emerald-500">VERIFY</span>
                      <p className="text-slate-300 italic">Open the tool details. It must show inherited credentials from Demo AWS.</p>
                    </div>
                    <div className="flex gap-3">
                      <span className="text-rose-500">TEST</span>
                      <p>Delete <span className="text-amber-300">"Demo AWS"</span> from Central Accounts.</p>
                    </div>
                    <div className="flex gap-3">
                      <span className="text-emerald-500">RESULT</span>
                      <p className="text-emerald-400">Check the Tool again. Link icon will disappear and system reverts to Manual Login.</p>
                    </div>
                  </div>
                </div>

                {/* Scenario 2 */}
                <div className="p-6 rounded-2xl bg-slate-900 text-slate-100 shadow-xl border border-slate-800">
                  <div className="flex items-center justify-between mb-4">
                    <Badge className="bg-blue-500/20 text-blue-400 border-none">Scenario: Deployment Audit</Badge>
                    <span className="text-[10px] uppercase font-bold text-slate-500">Hardware & Employee Flow</span>
                  </div>
                  <div className="space-y-4 font-mono text-sm">
                    <div className="flex gap-3">
                      <span className="text-slate-500">01</span>
                      <p>Onboard an employee in <span className="text-indigo-400">"Employees"</span> named <span className="text-white">"Tester Joe"</span>.</p>
                    </div>
                    <div className="flex gap-3">
                      <span className="text-slate-500">02</span>
                      <p>In <span className="text-indigo-400">"Hardware"</span>, edit any <span className="text-amber-300">"MacBook"</span> and assign it to <span className="text-white">"Tester Joe"</span>.</p>
                    </div>
                    <div className="flex gap-3 border-t border-slate-800 pt-4 text-emerald-500">
                      <span>VERIFY</span>
                      <p className="text-slate-300 italic">Go to Joe's profile. Hardware count must now be 1. Asset status must be "Assigned".</p>
                    </div>
                  </div>
                </div>

                {/* Scenario 3 */}
                <div className="p-6 rounded-2xl bg-slate-900 text-slate-100 shadow-xl border border-slate-800">
                  <div className="flex items-center justify-between mb-4">
                    <Badge className="bg-violet-500/20 text-violet-400 border-none">Scenario: Security Vault Audit</Badge>
                    <span className="text-[10px] uppercase font-bold text-slate-500">Access Layer Flow</span>
                  </div>
                  <div className="space-y-4 font-mono text-sm">
                    <div className="flex gap-3">
                      <span className="text-slate-500">01</span>
                      <p>Go to <span className="text-indigo-400">"Credential Vault"</span>.</p>
                    </div>
                    <div className="flex gap-3 text-white">
                      <span>FLOW</span>
                      <p>Use Search bar {"->"} Masking Eye {"->"} Copy Button.</p>
                    </div>
                    <div className="flex gap-3 border-t border-slate-800 pt-4 text-emerald-500">
                      <span>VERIFY</span>
                      <p className="text-slate-300 italic">System must provide unified access to secrets from ALL modules in one view.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-primary/5 border-2 border-dashed border-primary/20 rounded-3xl flex flex-col items-center text-center gap-2">
                 <p className="font-bold text-primary">Demo Ready Architecture</p>
                 <p className="text-sm text-muted-foreground max-w-lg">
                    This prototype simulates a full Postgres/Prisma backend using a centralized React State Hook. 
                    Changes are persistent within the browser session for high-fidelity demos.
                 </p>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
};
