import { Card, Badge } from '../components/ui';
import {
  Monitor, ExternalLink, ShieldCheck, Users, ArrowUpRight, History, CreditCard, FolderOpen, AlertTriangle, Clock,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ReactElement } from 'react';
import { useSystemState } from '../hooks/useSystemState';

const StatCard = ({
  title, value, icon: Icon, trend, color, sub
}: {
  title: string; value: number | string; icon: LucideIcon;
  trend?: string; color: string; sub?: string;
}) => (
  <Card className="flex flex-col gap-4">
    <div className="flex justify-between items-start">
      <div className={color + ' p-3 rounded-2xl text-white shadow-lg shadow-current/20'}>
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
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  </Card>
);

const daysUntil = (dateStr: string) =>
  Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);

export const Dashboard = ({ state }: { state: ReturnType<typeof useSystemState> }) => {
  const { employees, hardware, tools, accounts, activities, subscriptions, projects } = state;

  // Real expiry alerts
  const expiringTools = tools.filter(t => t.expiryDate && daysUntil(t.expiryDate) <= 30 && daysUntil(t.expiryDate) >= 0);
  const expiredTools = tools.filter(t => t.expiryDate && daysUntil(t.expiryDate) < 0);
  const expiringSubscriptions = subscriptions.filter(s => s.status === 'Expiring Soon');
  const expiredSubscriptions = subscriptions.filter(s => s.status === 'Expired');
  const accountsWithout2FA = accounts.filter(a => a.status === 'Active' && !a.credentials.twoFactor);
  const availableHardware = hardware.filter(h => h.status === 'Available').length;
  const activeProjects = projects.filter(p => p.status === 'Active').length;
  const monthlyCost = subscriptions
    .filter(s => s.status !== 'Cancelled' && s.status !== 'Expired')
    .reduce((sum, s) => {
      if (s.billingCycle === 'Monthly') return sum + s.cost;
      if (s.billingCycle === 'Annual') return sum + s.cost / 12;
      if (s.billingCycle === 'Quarterly') return sum + s.cost / 3;
      return sum;
    }, 0);

  interface AlertItem { color: string; text: ReactElement; severity: 'high' | 'medium' | 'low' }
  const alerts: AlertItem[] = [];

  expiredTools.forEach(t => alerts.push({
    severity: 'high', color: 'bg-rose-500',
    text: <p className="text-sm">Tool <span className="font-semibold">{t.name}</span> has expired. Please renew or remove.</p>
  }));
  expiredSubscriptions.forEach(s => alerts.push({
    severity: 'high', color: 'bg-rose-500',
    text: <p className="text-sm">Subscription <span className="font-semibold">{s.name}</span> has expired.</p>
  }));
  expiringTools.forEach(t => alerts.push({
    severity: 'medium', color: 'bg-amber-500',
    text: <p className="text-sm">Tool <span className="font-semibold">{t.name}</span> expires in {daysUntil(t.expiryDate!)} days.</p>
  }));
  expiringSubscriptions.forEach(s => alerts.push({
    severity: 'medium', color: 'bg-amber-500',
    text: <p className="text-sm">Subscription <span className="font-semibold">{s.name}</span> expires in {daysUntil(s.renewalDate)} days.</p>
  }));
  accountsWithout2FA.forEach(a => alerts.push({
    severity: 'low', color: 'bg-blue-500',
    text: <p className="text-sm">2FA is not enabled on account <span className="font-semibold">{a.name}</span>.</p>
  }));

  return (
    <div className="space-y-6 md:space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
        <p className="text-muted-foreground">Welcome back! Here's what's happening across your fleet.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard title="Total Hardware" value={hardware.length} icon={Monitor} sub={`${availableHardware} available`} color="bg-blue-500" />
        <StatCard title="Active Tools" value={tools.filter(t => t.status === 'Active').length} icon={ExternalLink} sub={expiredTools.length > 0 ? `${expiredTools.length} expired` : undefined} color="bg-indigo-500" />
        <StatCard title="Subscriptions" value={subscriptions.filter(s => s.status === 'Active' || s.status === 'Expiring Soon').length} icon={CreditCard} sub={`~$${monthlyCost.toFixed(0)}/mo spend`} color="bg-teal-500" />
        <StatCard title="Active Projects" value={activeProjects} icon={FolderOpen} sub={`${projects.length} total`} color="bg-orange-500" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard title="Central Accounts" value={accounts.length} icon={ShieldCheck} color="bg-violet-500" />
        <StatCard title="Total Employees" value={employees.filter(e => e.status === 'Active').length} icon={Users} sub={`${employees.filter(e => e.status === 'Inactive').length} inactive`} color="bg-slate-500" />
        <StatCard title="Expiring Soon" value={expiringTools.length + expiringSubscriptions.length} icon={Clock} color="bg-amber-500" />
        <StatCard title="Security Issues" value={accountsWithout2FA.length + expiredTools.length + expiredSubscriptions.length} icon={AlertTriangle} color="bg-rose-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 lg:items-stretch">
        {/* Activity Feed — same max height as right column; scrolls inside */}
        <div className="lg:col-span-12 flex flex-col min-h-0 min-w-0">
          <div className="flex items-center justify-between shrink-0 mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <History className="w-5 h-5 text-primary" />
              Recent Activity
            </h2>
          </div>
          <div className="space-y-3 overflow-y-auto overscroll-contain pr-1 -mr-1 min-h-0 max-h-[min(28rem,calc(100vh-20rem))] rounded-2xl border border-transparent [scrollbar-gutter:stable]">
            {activities.slice(0, 8).map((activity) => (
              <div key={activity.id} className="flex gap-4 p-4 rounded-2xl bg-card border hover:border-primary/30 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center shrink-0">
                  {activity.module === 'Hardware' && <Monitor className="w-5 h-5" />}
                  {activity.module === 'Tools' && <ExternalLink className="w-5 h-5" />}
                  {activity.module === 'Accounts' && <ShieldCheck className="w-5 h-5" />}
                  {activity.module === 'Subscriptions' && <CreditCard className="w-5 h-5" />}
                  {activity.module === 'Projects' && <FolderOpen className="w-5 h-5" />}
                  {activity.module === 'Employees' && <Users className="w-5 h-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{activity.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {activity.userName} · {new Date(activity.timestamp).toLocaleDateString()}
                  </p>
                </div>
                <Badge variant="info">{activity.type}</Badge>
              </div>
            ))}
          </div>
        </div>


      </div>
    </div>
  );
};
