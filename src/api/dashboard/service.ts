import { apiClient } from '../client';
import type { ActivityLog } from '../../types';

interface ApiResponse<T> {
  data: T;
}

export interface DashboardStats {
  employees: number;
  hardware: number;
  tools: number;
  accounts: number;
  subscriptions: number;
  projects: number;
}

export interface DashboardAlerts {
  expiringTools: Array<Record<string, unknown>>;
  expiringSubscriptions: Array<Record<string, unknown>>;
  accountsWithout2FA: Array<Record<string, unknown>>;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const res = await apiClient.get<ApiResponse<DashboardStats>>('/dashboard/stats');
  return res.data.data;
}

export async function getDashboardAlerts(): Promise<DashboardAlerts> {
  const res = await apiClient.get<ApiResponse<DashboardAlerts>>('/dashboard/alerts');
  return res.data.data;
}

export async function getDashboardActivity(limit = 10): Promise<ActivityLog[]> {
  const res = await apiClient.get<ApiResponse<ActivityLog[]>>(
    `/dashboard/activity?limit=${limit}`,
  );
  return res.data.data;
}
