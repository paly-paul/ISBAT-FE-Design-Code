import { useQuery } from '@tanstack/react-query'
import { getCreditAccumulation, getProgramUnits, type AcademicRecordSource } from '@/lib/api/student/academicRecord'

// The only expected failure is a 400 for a student with no
// program/semester/batch.
export function useCreditAccumulation(studentGuid: string | null, source: AcademicRecordSource) {
  return useQuery({
    queryKey: ['student-credit-accumulation', source, studentGuid],
    queryFn: () => getCreditAccumulation(studentGuid as string, source),
    enabled: !!studentGuid,
    staleTime: 5 * 60 * 1000,
  })
}

export function useProgramUnits(studentGuid: string | null, source: AcademicRecordSource) {
  return useQuery({
    queryKey: ['student-program-units', source, studentGuid],
    queryFn: () => getProgramUnits(studentGuid as string, source),
    enabled: !!studentGuid,
    staleTime: 5 * 60 * 1000,
  })
}
