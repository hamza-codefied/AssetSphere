import { apiClient } from './client';
import type { AuthUser } from '../auth/permissions';

interface ApiResponse<T> {
  data: T;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthLoginResponse extends AuthTokens {
  user: AuthUser;
}

export async function authLogin(email: string, password: string): Promise<AuthLoginResponse> {
  const res = await apiClient.post<ApiResponse<AuthLoginResponse>>('/auth/login', { email, password });
  return res.data.data;
}

export async function authMe(): Promise<AuthUser> {
  const res = await apiClient.get<ApiResponse<AuthUser>>('/auth/me');
  return res.data.data;
}

export async function authLogout(): Promise<void> {
  await apiClient.post('/auth/logout');
}
