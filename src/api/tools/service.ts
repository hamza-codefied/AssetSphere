import { apiClient } from '../client';
import type { SoftwareTool, Credentials } from '../../types';

interface ApiResponse<T> {
  data: T;
}

export interface CreateToolPayload {
  name: string;
  linkedAccountId?: string;
  assignedToId?: string;
  expiryDate?: string;
  status?: SoftwareTool['status'];
  credentials?: Partial<Credentials>;
}

export interface UpdateToolPayload {
  name?: string;
  linkedAccountId?: string;
  assignedToId?: string;
  expiryDate?: string;
  status?: SoftwareTool['status'];
  credentials?: Partial<Credentials>;
}

export interface AssignToolPayload {
  assignedToId?: string;
}

export async function getTools(): Promise<SoftwareTool[]> {
  const res = await apiClient.get<ApiResponse<SoftwareTool[]>>('/tools');
  return res.data.data;
}

export async function createTool(payload: CreateToolPayload): Promise<SoftwareTool> {
  const res = await apiClient.post<ApiResponse<SoftwareTool>>('/tools', payload);
  return res.data.data;
}

export async function updateTool(id: string, payload: UpdateToolPayload): Promise<SoftwareTool> {
  const res = await apiClient.patch<ApiResponse<SoftwareTool>>(`/tools/${id}`, payload);
  return res.data.data;
}

export async function assignTool(id: string, payload: AssignToolPayload): Promise<SoftwareTool> {
  const res = await apiClient.patch<ApiResponse<SoftwareTool>>(`/tools/${id}/assign`, payload);
  return res.data.data;
}

export async function deleteTool(id: string): Promise<SoftwareTool> {
  const res = await apiClient.delete<ApiResponse<SoftwareTool>>(`/tools/${id}`);
  return res.data.data;
}
