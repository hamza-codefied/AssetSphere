import { Card, Badge } from '../components/ui';
import { Monitor, ExternalLink, ShieldCheck, Users, ArrowUpRight, History, AlertCircle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useSystemState } from '../hooks/useSystemState';

const StatCard = ({ title, value, icon: Icon, trend, color }: { title: string; value: number | string; icon: LucideIcon; trend?: string; color: string }) => (
  <Card className="flex flex-col gap-4">
    <div className="flex justify-between items-start">
      <div className={color + " p-3 rounded-2xl text-white shadow-lg shadow-current/20"}>
        <Icon className="w-6 h-6" />
      </div>
      {trend && (
        <span className="text-emerald-500 text-xs font-bold flex items-center bg-emerald-500/10 px-2 py-1 rounded-lg">
          <ArrowUpRight className="w-3 h-3 mr-1" /> {trend}
        </span>
      )}
    </div>
    <div>
      <p className="text-muted-foreground text-sm font-medium">{title}</p>
      <h3 className="text-3xl font-bold tracking-tight mt-1">{value}</h3>
    </div>
  </Card>
);

export const Dashboard = ({ state }: { state: ReturnType<typeof useSystemState> }) => {
  const { employees, hardware, tools, accounts, activities } = state;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
        <p className="text-muted-foreground">Welcome back! Here's what's happening across your fleet.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Hardware" value={hardware.length} icon={Monitor} trend="+2 this week" color="bg-blue-500" />
        <StatCard title="Active Tools" value={tools.length} icon={ExternalLink} color="bg-indigo-500" />
        <StatCard title="Central Accounts" value={accounts.length} icon={ShieldCheck} color="bg-violet-500" />
        <StatCard title="Total Employees" value={employees.length} icon={Users} color="bg-slate-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <History className="w-5 h-5 text-primary" />
              Recent Activity
            </h2>
            <button className="text-primary text-sm font-semibold hover:underline">View all</button>
          </div>
          
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex gap-4 p-4 rounded-2xl bg-card border hover:border-primary/30 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center shrink-0">
                  {activity.module === 'Hardware' && <Monitor className="w-5 h-5" />}
                  {activity.module === 'Tools' && <ExternalLink className="w-5 h-5" />}
                  {activity.module === 'Accounts' && <ShieldCheck className="w-5 h-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{activity.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {activity.userName} • {new Date(activity.timestamp).toLocaleDateString()}
                  </p>
                </div>
                <Badge variant="info">{activity.type}</Badge>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            Security Alerts
          </h2>
          <Card className="bg-amber-500/5 border-amber-500/20">
            <ul className="space-y-4">
              <li className="flex gap-3">
                <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                <p className="text-sm">Password for <span className="font-semibold">GitHub Enterprise</span> was last updated 4 months ago.</p>
              </li>
              <li className="flex gap-3">
                <div className="w-2 h-2 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                <p className="text-sm">2FA is missing for <span className="font-semibold">Marketing Gmail</span> account.</p>
              </li>
              <li className="flex gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                <p className="text-sm">License for <span className="font-semibold">Figma</span> expires in 12 days.</p>
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
};
