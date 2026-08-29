import { useQuery } from '@tanstack/react-query'
import { StudentSearchFilters, searchStudentsAdvanced } from '@/lib/api/student/studentSearch'

const STUDENT_SEARCH_KEY = ['student-search']

// Only enabled while at least one advanced filter (beyond paging) is set —
// callers should fall back to the plain useStudents()/GET-students query
// otherwise, since that's the documented "thin single-term variant" for the
// common case.
export function useStudentSearchAdvanced(filters: StudentSearchFilters, enabled: boolean) {
  return useQuery({
    queryKey: [...STUDENT_SEARCH_KEY, filters],
    queryFn: () => searchStudentsAdvanced(filters),
    enabled,
  })
}

export type { StudentSearchFilters } from '@/lib/api/student/studentSearch'
