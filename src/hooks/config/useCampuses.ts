import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Campus, CampusInput, createCampus, getCampusDropdown, getCampuses, updateCampus } from '@/lib/api/academic/campus'

const CAMPUSES_KEY = ['campuses']

export function useCampuses() {
  return useQuery({
    queryKey: CAMPUSES_KEY,
    queryFn: () => getCampuses(),
    // Never treat the cached list as stale on its own — only refetch when a
    // mutation (create/update) explicitly invalidates this key below,
    // instead of on every remount/window focus.
    staleTime: Infinity,
    gcTime: Infinity,
  })
}

// Feeds the Campus Name column filter dropdown on the table — a separate,
// smaller lookup than the full useCampuses() list.
export function useCampusDropdown() {
  return useQuery({
    queryKey: [...CAMPUSES_KEY, 'dropdown'],
    queryFn: () => getCampusDropdown(),
    staleTime: Infinity,
    gcTime: Infinity,
  })
}

export function useCreateCampus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CampusInput) => createCampus(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CAMPUSES_KEY }),
  })
}

export function useUpdateCampus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: CampusInput }) => updateCampus(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CAMPUSES_KEY }),
  })
}

export type { Campus, CampusInput, CampusDropdownItem } from '@/lib/api/academic/campus'
