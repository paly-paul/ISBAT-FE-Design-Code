import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Faculty, FacultyInput, createFaculty, getFaculties, updateFaculty } from '@/lib/api/academic/faculty'

const FACULTIES_KEY = ['faculties']

export function useFaculties() {
  return useQuery({
    queryKey: FACULTIES_KEY,
    queryFn: () => getFaculties(),
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

export type { Faculty, FacultyInput }
