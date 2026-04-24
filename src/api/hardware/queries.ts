import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  assignHardware,
  createHardware,
  deleteHardware,
  getHardware,
  updateHardware,
  revealHardwareCredentials,
  setHardwarePasswordLock,
} from './service';
import type {
  AssignHardwarePayload,
  CreateHardwarePayload,
  UpdateHardwarePayload,
} from './service';

export const hardwareQueryKey = ['hardware'] as const;

export function useHardwareQuery() {
  return useQuery({
    queryKey: hardwareQueryKey,
    queryFn: getHardware,
    staleTime: 30_000,
  });
}

export function useCreateHardwareMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateHardwarePayload) => createHardware(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: hardwareQueryKey });
    },
  });
}

export function useUpdateHardwareMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateHardwarePayload }) =>
      updateHardware(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: hardwareQueryKey });
    },
  });
}

export function useAssignHardwareMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: AssignHardwarePayload }) =>
      assignHardware(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: hardwareQueryKey });
    },
  });
}

export function useRevealHardwareCredentialsMutation() {
  return useMutation({
    mutationFn: (id: string) => revealHardwareCredentials(id),
  });
}

export function useDeleteHardwareMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteHardware(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: hardwareQueryKey });
    },
  });
}

export function useSetHardwarePasswordLockMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, locked }: { id: string; locked: boolean }) =>
      setHardwarePasswordLock(id, locked),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: hardwareQueryKey });
    },
  });
}
