import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createDepartment, deleteDepartment, Department, DepartmentInput, getDepartments, updateDepartment } from '@/lib/api/academic/department'

const DEPARTMENTS_KEY = ['departments']

export function useDepartments() {
  return useQuery({
    queryKey: DEPARTMENTS_KEY,
    queryFn: () => getDepartments(),
    // Never treat the cached list as stale on its own — only refetch when a
    // mutation (create/update/delete) explicitly invalidates this key below,
    // instead of on every remount/window focus.
    staleTime: Infinity,
    gcTime: Infinity,
  })
}

export function useCreateDepartment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: DepartmentInput) => createDepartment(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: DEPARTMENTS_KEY }),
  })
}

export function useUpdateDepartment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: DepartmentInput }) => updateDepartment(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: DEPARTMENTS_KEY }),
  })
}

export function useDeleteDepartment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteDepartment(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: DEPARTMENTS_KEY }),
  })
}

export type { Department, DepartmentInput }
