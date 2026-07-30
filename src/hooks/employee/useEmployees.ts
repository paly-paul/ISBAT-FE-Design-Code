import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { assignEmployeePermissionGroups, createEmployee, CreateEmployeeInput, Employee, EmployeeListItem, getEmployee, getEmployeePermissionGroups, getEmployees, updateEmployee } from '@/lib/api/employee/employee'
import { MENU_KEY } from '@/hooks/users/useMenu'

const EMPLOYEES_KEY = ['employees']
const EMPLOYEE_PERMISSION_GROUPS_KEY = ['employeePermissionGroups']

// Load enough rows to cover the full employee list (226+ seen in practice)
// in one request — the page itself paginates client-side on top of this.
const EMPLOYEES_PAGE_SIZE = 1000

export function useEmployees() {
  return useQuery({
    queryKey: EMPLOYEES_KEY,
    queryFn: () => getEmployees(1, EMPLOYEES_PAGE_SIZE),
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
      // Only actually changes anything when the assigned employee is the
      // logged-in user themselves (e.g. an admin testing on their own
      // account) — /me/menu is scoped server-side to the caller, so
      // assigning some other employee's permissions has no effect on this
      // tab's menu and this invalidation is a harmless no-op refetch there.
      queryClient.invalidateQueries({ queryKey: MENU_KEY })
    },
  })
}

export type { Employee, EmployeeListItem, CreateEmployeeInput }
