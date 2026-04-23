import { apiClient } from './client';
import type { Subscription, Credentials } from '../types';

interface ApiResponse<T> {
  data: T;
}

export interface CreateSubscriptionPayload {
  name: string;
  vendor: string;
  type: Subscription['type'];
  cost: number;
  billingCycle: Subscription['billingCycle'];
  purchaseDate: string;
  renewalDate: string;
  status?: Subscription['status'];
  assignmentScope?: Subscription['assignmentScope'];
  assignedToIds?: string[];
  teamName?: string;
  linkedAccountId?: string;
  credentials?: Partial<Credentials>;
  licenseCount?: number;
  notes?: string;
  alertDays?: number[];
}

export interface UpdateSubscriptionPayload extends Partial<CreateSubscriptionPayload> {}

export async function getSubscriptions(): Promise<Subscription[]> {
  const res = await apiClient.get<ApiResponse<Subscription[]>>('/subscriptions');
  return res.data.data;
}

export async function createSubscription(payload: CreateSubscriptionPayload): Promise<Subscription> {
  const res = await apiClient.post<ApiResponse<Subscription>>('/subscriptions', payload);
  return res.data.data;
}

export async function updateSubscription(id: string, payload: UpdateSubscriptionPayload): Promise<Subscription> {
  const res = await apiClient.patch<ApiResponse<Subscription>>(`/subscriptions/${id}`, payload);
  return res.data.data;
}

export async function deleteSubscription(id: string): Promise<Subscription> {
  const res = await apiClient.delete<ApiResponse<Subscription>>(`/subscriptions/${id}`);
  return res.data.data;
}
