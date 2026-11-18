import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createDepartment, deleteDepartment, Department, DepartmentDropdownItem, DepartmentInput, getDepartments, getDepartmentsDropdown, updateDepartment } from '@/lib/api/academic/department'

export const DEPARTMENTS_KEY = ['departments']

// Load enough rows to cover the full department list in one request.
const DEPARTMENTS_PAGE_SIZE = 1000

export function useDepartments() {
  return useQuery({
    queryKey: DEPARTMENTS_KEY,
    queryFn: () => getDepartments(1, DEPARTMENTS_PAGE_SIZE),
    // Keep the list cached until a mutation invalidates it.
    staleTime: Infinity,
    gcTime: Infinity })
}

// Full guid-carrying list for pickers (get-departments-dropdown.md) — no
// pagination, so SearchSelect's own client-side filter covers search.
export function useDepartmentsDropdown(enabled = true) {
  return useQuery({
    queryKey: [...DEPARTMENTS_KEY, 'dropdown'],
    queryFn: () => getDepartmentsDropdown(),
    enabled })
}

export function useCreateDepartment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: DepartmentInput) => createDepartment(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: DEPARTMENTS_KEY }) })
}

export function useUpdateDepartment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: DepartmentInput }) => updateDepartment(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: DEPARTMENTS_KEY }) })
}

export function useDeleteDepartment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteDepartment(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: DEPARTMENTS_KEY }) })
}

export type { Department, DepartmentDropdownItem, DepartmentInput }
