import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { StudentListFilters, getStudentByGuid, getStudents } from '@/lib/api/student/student'

const STUDENTS_LIST_KEY = ['students-list']
const STUDENT_DETAIL_KEY = ['student-detail']

export function useStudents(page: number, pageSize: number, filters?: StudentListFilters) {
  return useQuery({
    queryKey: [...STUDENTS_LIST_KEY, page, pageSize, filters?.searchTerm ?? ''],
    queryFn: () => getStudents(page, pageSize, filters),
    staleTime: Infinity,
    gcTime: Infinity,
  })
}

// Infinite-scroll variant for a search dropdown — each additional page is
// appended rather than replacing the list, and getNextPageParam stops
// offering a next page once pageNumber*pageSize has reached totalCount.
// Kept as its own hook rather than a mode on useStudents above since a
// paginated table (page/setPage, Pagination component) and an
// append-as-you-scroll dropdown want fundamentally different query shapes.
export function useStudentsInfinite(searchTerm: string, pageSize: number) {
  return useInfiniteQuery({
    queryKey: [...STUDENTS_LIST_KEY, 'infinite', pageSize, searchTerm],
    queryFn: ({ pageParam }) => getStudents(pageParam, pageSize, { searchTerm: searchTerm || undefined }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const fetched = allPages.reduce((sum, p) => sum + p.items.length, 0)
      return fetched < lastPage.totalCount ? allPages.length + 1 : undefined
    },
    staleTime: Infinity,
    gcTime: Infinity,
  })
}

// Fetch-by-guid, same convention as the rest of the app's real View modals —
// only enabled while the profile modal is actually open with a guid.
export function useStudent(studentGuid: string | null, enabled: boolean) {
  return useQuery({
    queryKey: [...STUDENT_DETAIL_KEY, studentGuid],
    queryFn: () => getStudentByGuid(studentGuid as string),
    enabled: enabled && !!studentGuid,
  })
}

export type { StudentDto, StudentDetailDto, StudentListFilters, PagedResult } from '@/lib/api/student/student'
