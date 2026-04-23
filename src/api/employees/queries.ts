import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createEmployee,
  deleteEmployee,
  getEmployees,
  offboardEmployee,
  updateEmployee,
} from './service';
import type { CreateEmployeePayload, UpdateEmployeePayload } from './service';

export const employeesQueryKey = ['employees'] as const;

export function useEmployeesQuery() {
  return useQuery({
    queryKey: employeesQueryKey,
    queryFn: getEmployees,
    staleTime: 30_000,
  });
}

export function useCreateEmployeeMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateEmployeePayload) => createEmployee(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: employeesQueryKey });
    },
  });
}

export function useUpdateEmployeeMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateEmployeePayload }) =>
      updateEmployee(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: employeesQueryKey });
    },
  });
}

export function useOffboardEmployeeMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      offboardEmployee(id, notes),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: employeesQueryKey });
    },
  });
}

export function useDeleteEmployeeMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteEmployee(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: employeesQueryKey });
    },
  });
}
