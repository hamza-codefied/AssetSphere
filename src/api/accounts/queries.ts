import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createAccount,
  deleteAccount,
  getAccounts,
  regenerateBackupCodes,
  updateAccount,
} from './service';
import type { CreateAccountPayload, UpdateAccountPayload } from './service';

export const accountsQueryKey = ['accounts'] as const;

export function useAccountsQuery() {
  return useQuery({
    queryKey: accountsQueryKey,
    queryFn: getAccounts,
    staleTime: 30_000,
  });
}

export function useCreateAccountMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateAccountPayload) => createAccount(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: accountsQueryKey });
    },
  });
}

export function useUpdateAccountMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateAccountPayload }) =>
      updateAccount(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: accountsQueryKey });
    },
  });
}

export function useRegenerateBackupCodesMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => regenerateBackupCodes(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: accountsQueryKey });
    },
  });
}

export function useDeleteAccountMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteAccount(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: accountsQueryKey });
    },
  });
}
