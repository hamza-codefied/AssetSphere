import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { assignTool, createTool, deleteTool, getTools, updateTool, revealToolCredentials } from './service';
import type { AssignToolPayload, CreateToolPayload, UpdateToolPayload } from './service';

export const toolsQueryKey = ['tools'] as const;

export function useToolsQuery() {
  return useQuery({
    queryKey: toolsQueryKey,
    queryFn: getTools,
    staleTime: 30_000,
  });
}

export function useCreateToolMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateToolPayload) => createTool(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: toolsQueryKey });
      void queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });
}

export function useUpdateToolMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateToolPayload }) =>
      updateTool(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: toolsQueryKey });
      void queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });
}

export function useAssignToolMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: AssignToolPayload }) =>
      assignTool(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: toolsQueryKey });
      void queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });
}

export function useRevealToolCredentialsMutation() {
  return useMutation({
    mutationFn: (id: string) => revealToolCredentials(id),
  });
}

export function useDeleteToolMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteTool(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: toolsQueryKey });
      void queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });
}
