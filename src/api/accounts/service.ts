import { apiClient } from '../client';
import type { Account, Credentials } from '../../types';

interface ApiResponse<T> {
  data: T;
}

export interface CreateAccountPayload {
  type: Account['type'];
  name: string;
  email: string;
  credentials: Credentials;
  ownerId?: string;
  isCompanyOwned?: boolean;
  status?: Account['status'];
}

export interface UpdateAccountPayload {
  type?: Account['type'];
  name?: string;
  email?: string;
  credentials?: Partial<Credentials> & { lastUpdated?: string };
  ownerId?: string;
  isCompanyOwned?: boolean;
  status?: Account['status'];
}

export async function getAccounts(): Promise<Account[]> {
  const res = await apiClient.get<ApiResponse<Account[]>>('/accounts');
  return res.data.data;
}

export async function getAccount(id: string): Promise<Account> {
  const res = await apiClient.get<ApiResponse<Account>>(`/accounts/${id}`);
  return res.data.data;
}

export async function createAccount(payload: CreateAccountPayload): Promise<Account> {
  const res = await apiClient.post<ApiResponse<Account>>('/accounts', payload);
  return res.data.data;
}

export async function updateAccount(id: string, payload: UpdateAccountPayload): Promise<Account> {
  const res = await apiClient.patch<ApiResponse<Account>>(`/accounts/${id}`, payload);
  return res.data.data;
}

export async function regenerateBackupCodes(id: string): Promise<Account> {
  const res = await apiClient.post<ApiResponse<Account>>(
    `/accounts/${id}/regenerate-backup-codes`,
  );
  return res.data.data;
}

export async function deleteAccount(id: string): Promise<Account> {
  const res = await apiClient.delete<ApiResponse<Account>>(`/accounts/${id}`);
  return res.data.data;
}
