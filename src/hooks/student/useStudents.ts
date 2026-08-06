import { useQuery } from '@tanstack/react-query'
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
