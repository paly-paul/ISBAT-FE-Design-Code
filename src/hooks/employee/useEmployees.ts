import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createEmployee, CreateEmployeeInput, Employee, EmployeeListItem, getEmployee, getEmployees, updateEmployee } from '@/lib/api/employee/employee'

const EMPLOYEES_KEY = ['employees']

export function useEmployees() {
  return useQuery({
    queryKey: EMPLOYEES_KEY,
    queryFn: getEmployees,
    // Never treat the cached list as stale on its own — only refetch when a
    // mutation (create/update) explicitly invalidates this key below,
    // instead of on every remount/window focus.
    staleTime: Infinity,
    gcTime: Infinity,
  })
}

export function useEmployee(id: string | null) {
  return useQuery({
    queryKey: [...EMPLOYEES_KEY, id],
    queryFn: () => getEmployee(id as string),
    enabled: !!id,
    // Same caching rule as useEmployees — cache this employee's details
    // indefinitely and only refetch when useUpdateEmployee's onSuccess
    // invalidates ['employees'] below (which matches this key by prefix).
    staleTime: Infinity,
    gcTime: Infinity,
  })
}

export function useCreateEmployee() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateEmployeeInput) => createEmployee(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: EMPLOYEES_KEY }),
  })
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: CreateEmployeeInput }) => updateEmployee(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: EMPLOYEES_KEY }),
  })
}

export type { Employee, EmployeeListItem, CreateEmployeeInput }
