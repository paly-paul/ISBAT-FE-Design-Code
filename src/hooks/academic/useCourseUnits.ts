import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { createCourseUnit, deleteCourseUnit, getCourseUnitById, getCourseUnits, updateCourseUnit, CourseUnit, CourseUnitInput, CourseUnitListResponse } from '@/lib/api/academic/courseUnit'

const COURSE_UNITS_KEY = ['courseUnits']

// Real server-side pagination, page/pageSize as part of the query key so
// each page is cached independently — same convention as useEnquiries.ts.
// Was previously a single pageSize=1000 fetch of the whole table on mount;
// switched to fetching 10 rows at a time (matching the page's own
// PAGE_SIZE) so the initial page load doesn't wait on the entire dataset.
// keepPreviousData avoids a loading flash between pages by leaving the
// previous page's rows on screen while the next page's request is in
// flight. staleTime/gcTime: Infinity is what actually stops a re-fetch on
// every click, though — each page is meant to be fetched once and then
// served from cache (invalidated only by a mutation) rather than re-hit on
// every Next/Previous, including re-visiting a page already seen.
export function useCourseUnits(page: number, pageSize: number) {
  return useQuery({
    queryKey: [...COURSE_UNITS_KEY, page, pageSize],
    queryFn: () => getCourseUnits(page, pageSize),
    placeholderData: keepPreviousData,
    staleTime: Infinity,
    gcTime: Infinity,
  })
}

const ALL_COURSE_UNITS_PAGE_SIZE = 1000

// Full, unpaginated list — for pickers that need every course unit at once
// (ProgrammeModal's per-semester Course Unit Allocation step), as opposed
// to the course-units table page itself, which now pages 10 at a time via
// useCourseUnits() above. Kept as a separate query key/staleTime so paging
// through the table doesn't touch this cache and vice versa.
export function useAllCourseUnits() {
  return useQuery({
    queryKey: [...COURSE_UNITS_KEY, 'all'],
    queryFn: () => getCourseUnits(1, ALL_COURSE_UNITS_PAGE_SIZE).then(res => res.items),
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

export type { CourseUnit, CourseUnitInput, CourseUnitListResponse }
