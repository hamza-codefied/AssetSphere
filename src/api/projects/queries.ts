import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  addProjectCredential,
  createProject,
  deleteProject,
  getProjects,
  updateProject,
  updateProjectMembers,
} from './service';
import type { CreateProjectPayload, UpdateProjectPayload } from './service';
import type { ProjectMember, StandaloneCredential } from '../../types';

export const projectsQueryKey = ['projects'] as const;

export function useProjectsQuery() {
  return useQuery({ queryKey: projectsQueryKey, queryFn: getProjects, staleTime: 30_000 });
}

export function useCreateProjectMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateProjectPayload) => createProject(payload),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: projectsQueryKey }),
  });
}

export function useUpdateProjectMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateProjectPayload }) =>
      updateProject(id, payload),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: projectsQueryKey }),
  });
}

export function useUpdateProjectMembersMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, members }: { id: string; members: ProjectMember[] }) =>
      updateProjectMembers(id, members),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: projectsQueryKey }),
  });
}

export function useAddProjectCredentialMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      credential,
    }: {
      id: string;
      credential: Omit<StandaloneCredential, 'id' | 'lastUpdated'> & { label: string };
    }) => addProjectCredential(id, credential),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: projectsQueryKey }),
  });
}

export function useDeleteProjectMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteProject(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: projectsQueryKey }),
  });
}
