import { apiClient } from '../client';
import type { HardwareAsset, Credentials } from '../../types';

interface ApiResponse<T> {
  data: T;
}

export interface CreateHardwarePayload {
  name: string;
  type: string;
  serialNumber?: string;
  status?: HardwareAsset['status'];
  assignedToId?: string;
  credentials?: Partial<Credentials>;
  notes?: string;
}

export interface UpdateHardwarePayload {
  name?: string;
  type?: string;
  serialNumber?: string;
  status?: HardwareAsset['status'];
  assignedToId?: string;
  credentials?: Partial<Credentials>;
  notes?: string;
}

export interface AssignHardwarePayload {
  assignedToId?: string;
}

export async function getHardware(): Promise<HardwareAsset[]> {
  const res = await apiClient.get<ApiResponse<HardwareAsset[]>>('/hardware');
  return res.data.data;
}

export async function createHardware(payload: CreateHardwarePayload): Promise<HardwareAsset> {
  const res = await apiClient.post<ApiResponse<HardwareAsset>>('/hardware', payload);
  return res.data.data;
}

export async function updateHardware(
  id: string,
  payload: UpdateHardwarePayload,
): Promise<HardwareAsset> {
  const res = await apiClient.patch<ApiResponse<HardwareAsset>>(`/hardware/${id}`, payload);
  return res.data.data;
}

export async function assignHardware(
  id: string,
  payload: AssignHardwarePayload,
): Promise<HardwareAsset> {
  const res = await apiClient.patch<ApiResponse<HardwareAsset>>(
    `/hardware/${id}/assign`,
    payload,
  );
  return res.data.data;
}

export async function deleteHardware(id: string): Promise<HardwareAsset> {
  const res = await apiClient.delete<ApiResponse<HardwareAsset>>(`/hardware/${id}`);
  return res.data.data;
}

export interface HardwareRevealedCredentials {
  password?: string;
  pin?: string;
}

export async function revealHardwareCredentials(id: string): Promise<HardwareRevealedCredentials> {
  const res = await apiClient.get<ApiResponse<HardwareRevealedCredentials>>(`/hardware/${id}/reveal`);
  return res.data.data;
}

export async function setHardwarePasswordLock(id: string, locked: boolean): Promise<HardwareAsset> {
  const res = await apiClient.patch<ApiResponse<HardwareAsset>>(`/hardware/${id}/password-lock`, { locked });
  return res.data.data;
}
