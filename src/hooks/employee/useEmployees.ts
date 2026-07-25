import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { assignEmployeePermissionGroups, createEmployee, CreateEmployeeInput, Employee, EmployeeListItem, getEmployee, getEmployeePermissionGroups, getEmployees, updateEmployee } from '@/lib/api/employee/employee'

const EMPLOYEES_KEY = ['employees']
const EMPLOYEE_PERMISSION_GROUPS_KEY = ['employeePermissionGroups']

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

// Fetches the permission group guids already assigned to an employee, for
// the assign-permissions modal to seed its tabs from. Only enabled while the
// modal is actually open with an employee, same convention as the other
// fetch-by-guid queries (e.g. useLedger).
export function useEmployeePermissionGroups(employeeGuid: string | null, enabled: boolean) {
  return useQuery({
    queryKey: [...EMPLOYEE_PERMISSION_GROUPS_KEY, employeeGuid],
    queryFn: () => getEmployeePermissionGroups(employeeGuid as string),
    enabled: enabled && !!employeeGuid,
  })
}

export function useAssignEmployeePermissionGroups() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ employeeGuid, permissionGroupGuids }: { employeeGuid: string; permissionGroupGuids: string[] }) =>
      assignEmployeePermissionGroups(employeeGuid, { permissionGroupGuids }),
    onSuccess: (_data, { employeeGuid }) => {
      queryClient.invalidateQueries({ queryKey: [...EMPLOYEE_PERMISSION_GROUPS_KEY, employeeGuid] })
    },
  })
}

export type { Employee, EmployeeListItem, CreateEmployeeInput }
