import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createSubscription,
  deleteSubscription,
  getSubscriptions,
  updateSubscription,
  revealSubscriptionCredentials,
} from './service';
import type { CreateSubscriptionPayload, UpdateSubscriptionPayload } from './service';

export const subscriptionsQueryKey = ['subscriptions'] as const;

export function useSubscriptionsQuery() {
  return useQuery({
    queryKey: subscriptionsQueryKey,
    queryFn: getSubscriptions,
    staleTime: 30_000,
  });
}

export function useCreateSubscriptionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateSubscriptionPayload) => createSubscription(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: subscriptionsQueryKey });
    },
  });
}

export function useUpdateSubscriptionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateSubscriptionPayload }) =>
      updateSubscription(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: subscriptionsQueryKey });
    },
  });
}

export function useRevealSubscriptionCredentialsMutation() {
  return useMutation({
    mutationFn: (id: string) => revealSubscriptionCredentials(id),
  });
}

export function useDeleteSubscriptionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteSubscription(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: subscriptionsQueryKey });
    },
  });
}
