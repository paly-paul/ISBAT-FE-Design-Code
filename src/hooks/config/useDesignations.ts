import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createDesignation, deleteDesignation, Designation, DesignationInput, getDesignations, updateDesignation } from '@/lib/api/academic/designation'

const DESIGNATIONS_KEY = ['designations']

export function useDesignations() {
  return useQuery({
    queryKey: DESIGNATIONS_KEY,
    queryFn: () => getDesignations(),
    // Never treat the cached list as stale on its own — only refetch when a
    // mutation (create/update/delete) explicitly invalidates this key below,
    // instead of on every remount/window focus.
    staleTime: Infinity,
    gcTime: Infinity,
  })
}

export function useCreateDesignation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: DesignationInput) => createDesignation(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: DESIGNATIONS_KEY }),
  })
}

export function useUpdateDesignation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: DesignationInput }) => updateDesignation(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: DESIGNATIONS_KEY }),
  })
}

export function useDeleteDesignation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteDesignation(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: DESIGNATIONS_KEY }),
  })
}

export type { Designation, DesignationInput }
