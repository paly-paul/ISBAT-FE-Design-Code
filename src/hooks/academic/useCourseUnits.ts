import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createCourseUnit, deleteCourseUnit, getCourseUnitById, getCourseUnits, updateCourseUnit, CourseUnit, CourseUnitInput } from '@/lib/api/academic/courseUnit'

const COURSE_UNITS_KEY = ['courseUnits']

// Fetch a large page so the full list is available without client-side pagination.
const COURSE_UNITS_PAGE_SIZE = 1000

export function useCourseUnits() {
  return useQuery({
    queryKey: COURSE_UNITS_KEY,
    queryFn: () => getCourseUnits(1, COURSE_UNITS_PAGE_SIZE),
    // Keep the list cached until a mutation explicitly refreshes it.
    staleTime: Infinity,
    gcTime: Infinity,
  })
}

export function useCreateCourseUnit() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CourseUnitInput) => createCourseUnit(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: COURSE_UNITS_KEY }),
  })
}

// Load one course unit for the edit modal only when the modal is open.
export function useCourseUnit(guid: string | null, enabled: boolean) {
  return useQuery({
    queryKey: [...COURSE_UNITS_KEY, guid],
    queryFn: () => getCourseUnitById(guid as string),
    enabled: enabled && !!guid,
  })
}

export function useUpdateCourseUnit() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ guid, input }: { guid: string; input: CourseUnitInput }) => updateCourseUnit(guid, input),
    onSuccess: (_data, { guid }) => {
      queryClient.invalidateQueries({ queryKey: COURSE_UNITS_KEY })
      queryClient.invalidateQueries({ queryKey: [...COURSE_UNITS_KEY, guid] })
    },
  })
}

export function useDeleteCourseUnit() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (guid: string) => deleteCourseUnit(guid),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: COURSE_UNITS_KEY }),
  })
}

export type { CourseUnit, CourseUnitInput }
