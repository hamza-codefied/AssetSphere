import { useMutation, useQuery } from '@tanstack/react-query';
import { getVault, revealSecret } from '../vault';
import type { EncryptedValue } from '../vault';

export const vaultQueryKey = ['vault'] as const;

export function useVaultQuery() {
  return useQuery({
    queryKey: vaultQueryKey,
    queryFn: getVault,
    staleTime: 15_000,
  });
}

export function useRevealSecretMutation() {
  return useMutation({
    mutationFn: (encrypted: EncryptedValue) => revealSecret(encrypted),
  });
}
