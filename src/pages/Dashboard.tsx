import { Card, Badge } from '../components/ui';
import {
  Monitor, ExternalLink, ShieldCheck, Users, ArrowUpRight, History, CreditCard, FolderOpen, AlertTriangle, Clock,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ReactElement } from 'react';
import { useSystemState } from '../hooks/useSystemState';
import { toApiError } from '../api/client';
import {
  useDashboardActivityQuery,
  useDashboardAlertsQuery,
  useDashboardStatsQuery,
} from '../api/dashboard';

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

export const Dashboard = ({ state }: { state: ReturnType<typeof useSystemState> }) => {
  void state;
  const statsQuery = useDashboardStatsQuery();
  const alertsQuery = useDashboardAlertsQuery();
  const activityQuery = useDashboardActivityQuery(10);

  const stats = statsQuery.data ?? {
    employees: 0,
    hardware: 0,
    tools: 0,
    accounts: 0,
    subscriptions: 0,
    projects: 0,
  };
  const alertsData = alertsQuery.data ?? {
    expiringTools: [],
    expiringSubscriptions: [],
    accountsWithout2FA: [],
  };
  const activities = activityQuery.data ?? [];

  const expiringTools = alertsData.expiringTools;
  const expiringSubscriptions = alertsData.expiringSubscriptions;
  const accountsWithout2FA = alertsData.accountsWithout2FA;

  interface AlertItem { color: string; text: ReactElement; severity: 'high' | 'medium' | 'low' }
  const alertItems: AlertItem[] = [];

  expiringTools.forEach((t: any) => alertItems.push({
    severity: 'medium', color: 'bg-amber-500',
    text: <p className="text-sm">Tool <span className="font-semibold">{String(t.name ?? 'Unknown')}</span> expires soon.</p>
  }));
  expiringSubscriptions.forEach((s: any) => alertItems.push({
    severity: 'medium', color: 'bg-amber-500',
    text: <p className="text-sm">Subscription <span className="font-semibold">{String(s.name ?? 'Unknown')}</span> requires attention.</p>
  }));
  accountsWithout2FA.forEach((a: any) => alertItems.push({
    severity: 'low', color: 'bg-blue-500',
    text: <p className="text-sm">2FA is not enabled on account <span className="font-semibold">{String(a.name ?? 'Unknown')}</span>.</p>
  }));

  return (
    <div className="space-y-6 md:space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
        <p className="text-muted-foreground">Welcome back! Here's what's happening across your fleet.</p>
      </div>

      {(statsQuery.isError || alertsQuery.isError || activityQuery.isError) && (
        <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/5 text-sm text-rose-500">
          Failed to load dashboard data:{' '}
          {toApiError(statsQuery.error) || toApiError(alertsQuery.error) || toApiError(activityQuery.error)}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard title="Total Hardware" value={stats.hardware} icon={Monitor} color="bg-blue-500" />
        <StatCard title="Active Tools" value={stats.tools} icon={ExternalLink} color="bg-indigo-500" />
        <StatCard title="Subscriptions" value={stats.subscriptions} icon={CreditCard} color="bg-teal-500" />
        <StatCard title="Active Projects" value={stats.projects} icon={FolderOpen} color="bg-orange-500" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard title="Central Accounts" value={stats.accounts} icon={ShieldCheck} color="bg-violet-500" />
        <StatCard title="Total Employees" value={stats.employees} icon={Users} color="bg-slate-500" />
        <StatCard title="Expiring Soon" value={expiringTools.length + expiringSubscriptions.length} icon={Clock} color="bg-amber-500" />
        <StatCard title="Security Issues" value={accountsWithout2FA.length} icon={AlertTriangle} color="bg-rose-500" />
      </div>

      {alertItems.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-lg font-bold">Alerts</h2>
          <div className="space-y-2">
            {alertItems.slice(0, 6).map((item, index) => (
              <div key={`alert-${index}`} className="p-3 rounded-xl border bg-card flex items-start gap-3">
                <span className={`mt-1 w-2 h-2 rounded-full ${item.color}`} />
                <div className="text-sm">{item.text}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        {/* Activity Feed — same max height as right column; scrolls inside */}
        <div className="flex flex-col min-h-0 min-w-0">
          <div className="flex items-center justify-between shrink-0 mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <History className="w-5 h-5 text-primary" />
              Recent Activity
            </h2>
          </div>
          <div className="space-y-3 overflow-y-auto overscroll-contain pr-1 -mr-1 min-h-0 max-h-112 rounded-2xl border border-border/60 [scrollbar-gutter:stable] custom-scrollbar">
            {activityQuery.isLoading && (
              <div className="p-4 rounded-2xl bg-card border text-sm text-muted-foreground">Loading activity...</div>
            )}
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
