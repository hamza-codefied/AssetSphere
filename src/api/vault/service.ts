import { apiClient } from '../client';

interface ApiResponse<T> {
  data: T;
}

export interface EncryptedValue {
  iv: string;
  tag: string;
  ciphertext: string;
}

export interface VaultPayload {
  accounts: Array<Record<string, unknown>>;
  hardware: Array<Record<string, unknown>>;
  tools: Array<Record<string, unknown>>;
  subscriptions: Array<Record<string, unknown>>;
  projects: Array<Record<string, unknown>>;
}

export async function getVault(): Promise<VaultPayload> {
  const res = await apiClient.get<ApiResponse<VaultPayload>>('/vault');
  return res.data.data;
}

export async function revealSecret(encrypted: EncryptedValue): Promise<string> {
  const res = await apiClient.post<ApiResponse<string>>('/vault/reveal', { encrypted });
  return res.data.data;
}
