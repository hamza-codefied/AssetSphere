import { apiClient } from './client';
import type { Employee, EmployeeRole } from '../types';

interface ApiResponse<T> {
  data: T;
}

/** Roles an admin can assign when creating an employee. */
export type AssignableEmployeeRole = Exclude<EmployeeRole, 'admin'>;

export interface CreateEmployeePayload {
  name: string;
  email: string;
  password: string;
  role: AssignableEmployeeRole;
  department?: string;
  phone?: string;
  avatar?: string;
}

export interface UpdateEmployeePayload {
  name?: string;
  email?: string;
  password?: string;
  role?: AssignableEmployeeRole;
  department?: string;
  phone?: string;
  avatar?: string;
  status?: 'Active' | 'Inactive';
  isActive?: boolean;
}

export async function getEmployees(): Promise<Employee[]> {
  const res = await apiClient.get<ApiResponse<Employee[]>>('/employees');
  return res.data.data;
}

export async function getEmployee(id: string): Promise<Employee> {
  const res = await apiClient.get<ApiResponse<Employee>>(`/employees/${id}`);
  return res.data.data;
}

export async function createEmployee(payload: CreateEmployeePayload): Promise<Employee> {
  const res = await apiClient.post<ApiResponse<Employee>>('/employees', payload);
  return res.data.data;
}

export async function updateEmployee(
  id: string,
  payload: UpdateEmployeePayload,
): Promise<Employee> {
  const res = await apiClient.patch<ApiResponse<Employee>>(`/employees/${id}`, payload);
  return res.data.data;
}

export async function offboardEmployee(id: string, notes?: string): Promise<Employee | null> {
  const res = await apiClient.post<ApiResponse<Employee | null>>(
    `/employees/${id}/offboard`,
    { notes },
  );
  return res.data.data;
}

export async function deleteEmployee(id: string): Promise<Employee> {
  const res = await apiClient.delete<ApiResponse<Employee>>(`/employees/${id}`);
  return res.data.data;
}
