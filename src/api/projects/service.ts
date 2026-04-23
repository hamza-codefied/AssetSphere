import { apiClient } from '../client';
import type { Project, ProjectMember, StandaloneCredential } from '../../types';

interface ApiResponse<T> {
  data: T;
}

export interface CreateProjectPayload {
  name: string;
  clientName: string;
  description?: string;
  status?: Project['status'];
  startDate: string;
  endDate?: string;
  projectManager?: string;
  members?: ProjectMember[];
  linkedAccountIds?: string[];
  hardwareIds?: string[];
  subscriptionIds?: string[];
  standaloneCredentials?: StandaloneCredential[];
  notes?: string;
}

export type UpdateProjectPayload = Partial<CreateProjectPayload>;

export async function getProjects(): Promise<Project[]> {
  const res = await apiClient.get<ApiResponse<Project[]>>('/projects');
  return res.data.data;
}

export async function createProject(payload: CreateProjectPayload): Promise<Project> {
  const res = await apiClient.post<ApiResponse<Project>>('/projects', payload);
  return res.data.data;
}

export async function updateProject(id: string, payload: UpdateProjectPayload): Promise<Project> {
  const res = await apiClient.patch<ApiResponse<Project>>(`/projects/${id}`, payload);
  return res.data.data;
}

export async function updateProjectMembers(
  id: string,
  members: ProjectMember[],
): Promise<Project> {
  const res = await apiClient.patch<ApiResponse<Project>>(`/projects/${id}/members`, {
    members,
  });
  return res.data.data;
}

export async function addProjectCredential(
  id: string,
  credential: Omit<StandaloneCredential, 'id' | 'lastUpdated'> & { label: string },
): Promise<Project> {
  const res = await apiClient.post<ApiResponse<Project>>(
    `/projects/${id}/credentials`,
    credential,
  );
  return res.data.data;
}

export async function deleteProject(id: string): Promise<Project> {
  const res = await apiClient.delete<ApiResponse<Project>>(`/projects/${id}`);
  return res.data.data;
}
