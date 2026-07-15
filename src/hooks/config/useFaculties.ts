import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Faculty, FacultyInput, createFaculty, deleteFaculty, getFaculties, updateFaculty } from '@/lib/api/academic/faculty'

const FACULTIES_KEY = ['faculties']

// Fetch a single page large enough to cover the whole list — nothing in
// this codebase currently paginates the master lists client-side, so the
// hook needs the full set in one request rather than the API's default
// page=1/pageSize=10 (which was silently hiding any row past the 10th).
const FACULTIES_PAGE_SIZE = 1000

export function useFaculties() {
  return useQuery({
    queryKey: FACULTIES_KEY,
    queryFn: () => getFaculties(1, FACULTIES_PAGE_SIZE),
    // Never treat the cached list as stale on its own — only refetch when a
    // mutation (create/update) explicitly invalidates this key below,
    // instead of on every remount/window focus.
    staleTime: Infinity,
    gcTime: Infinity,
  })
}

export function useCreateFaculty() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: FacultyInput) => createFaculty(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: FACULTIES_KEY }),
  })
}

export function useUpdateFaculty() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: FacultyInput }) => updateFaculty(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: FACULTIES_KEY }),
  })
}

export function useDeleteFaculty() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteFaculty(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: FACULTIES_KEY }),
  })
}

export type { Faculty, FacultyInput }
