import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createDesignation, deleteDesignation, Designation, DesignationInput, getDesignationsDropdown, updateDesignation } from '@/lib/api/academic/designation'

export const DESIGNATIONS_KEY = ['designations']

// Guid-carrying picker list scoped to one department
// (get-designations-dropdown.md's deptGuid filter) — only fetched once a
// department is picked, for the Department → Designation cascade.
export function useDesignationsDropdown(deptGuid: string, enabled = true) {
  return useQuery({
    queryKey: [...DESIGNATIONS_KEY, 'dropdown', deptGuid],
    queryFn: () => getDesignationsDropdown(deptGuid),
    enabled: enabled && !!deptGuid })
}

export function useCreateDesignation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: DesignationInput) => createDesignation(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: DESIGNATIONS_KEY }) })
}

export function useUpdateDesignation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: DesignationInput }) => updateDesignation(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: DESIGNATIONS_KEY }) })
}

export function useDeleteDesignation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteDesignation(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: DESIGNATIONS_KEY }) })
}

export type { Designation, DesignationInput }
