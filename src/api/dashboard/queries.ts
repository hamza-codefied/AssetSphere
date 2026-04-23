import { useQuery } from '@tanstack/react-query';
import { getDashboardActivity, getDashboardAlerts, getDashboardStats } from './service';

export const dashboardStatsQueryKey = ['dashboard', 'stats'] as const;
export const dashboardAlertsQueryKey = ['dashboard', 'alerts'] as const;
export const dashboardActivityQueryKey = (limit: number) =>
  ['dashboard', 'activity', limit] as const;

export function useDashboardStatsQuery() {
  return useQuery({
    queryKey: dashboardStatsQueryKey,
    queryFn: getDashboardStats,
    staleTime: 20_000,
  });
}

export function useDashboardAlertsQuery() {
  return useQuery({
    queryKey: dashboardAlertsQueryKey,
    queryFn: getDashboardAlerts,
    staleTime: 20_000,
  });
}

export function useDashboardActivityQuery(limit = 10) {
  return useQuery({
    queryKey: dashboardActivityQueryKey(limit),
    queryFn: () => getDashboardActivity(limit),
    staleTime: 10_000,
  });
}
