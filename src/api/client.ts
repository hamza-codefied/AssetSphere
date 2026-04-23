import axios, { AxiosError } from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';
import { tokenStorage } from '../auth/tokenStorage';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

type RetryableRequestConfig = InternalAxiosRequestConfig & { _retry?: boolean };

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15_000,
});

const refreshClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15_000,
});

let refreshPromise: Promise<string> | null = null;

apiClient.interceptors.request.use((config) => {
  const token = tokenStorage.getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;
    const status = error.response?.status;
    const path = originalRequest?.url ?? '';
    const isAuthRoute = path.includes('/auth/login') || path.includes('/auth/refresh');
    const refreshToken = tokenStorage.getRefreshToken();

    if (!originalRequest || originalRequest._retry || status !== 401 || isAuthRoute || !refreshToken) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      if (!refreshPromise) {
        refreshPromise = refreshClient
          .post('/auth/refresh', { refreshToken })
          .then((res) => {
            const data = res.data?.data;
            tokenStorage.setTokens({
              accessToken: data.accessToken,
              refreshToken: data.refreshToken,
            });
            return data.accessToken as string;
          })
          .finally(() => {
            refreshPromise = null;
          });
      }
      const nextAccessToken = await refreshPromise;
      originalRequest.headers.Authorization = `Bearer ${nextAccessToken}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      tokenStorage.clearTokens();
      return Promise.reject(refreshError);
    }
  },
);

export function toApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const payload = error.response?.data as { message?: string | string[] } | undefined;
    if (Array.isArray(payload?.message)) return payload.message.join(', ');
    if (typeof payload?.message === 'string') return payload.message;
    if (error.message) return error.message;
  }
  return 'Something went wrong. Please try again.';
}
