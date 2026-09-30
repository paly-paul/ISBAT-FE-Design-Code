import { useQuery } from '@tanstack/react-query'
import { getCreditAccumulation, getProgramUnits } from '@/lib/api/student/academicRecord'

// retry: false — the only expected failure is a 400 for a student with no
// program/semester/batch, which retrying won't fix.
export function useCreditAccumulation(studentGuid: string | null) {
  return useQuery({
    queryKey: ['student-credit-accumulation', studentGuid],
    queryFn: () => getCreditAccumulation(studentGuid as string),
    enabled: !!studentGuid,
    staleTime: 5 * 60 * 1000,
    retry: false,
  })
}

export function useProgramUnits(studentGuid: string | null) {
  return useQuery({
    queryKey: ['student-program-units', studentGuid],
    queryFn: () => getProgramUnits(studentGuid as string),
    enabled: !!studentGuid,
    staleTime: 5 * 60 * 1000,
    retry: false,
  })
}
