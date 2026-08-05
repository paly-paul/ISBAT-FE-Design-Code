import { useQuery } from '@tanstack/react-query'
import { getProgramCourseUnits, ProgramCourseUnitDto } from '@/lib/api/academic/programCourseUnits'

// Scoped to one program — only enabled once it's known (Edit mode). Drives
// ProgrammeModal Step 2's real semester list instead of a hardcoded count.
export function useProgramCourseUnits(programGuid: string | null, enabled: boolean) {
  return useQuery({
    queryKey: ['programCourseUnits', programGuid],
    queryFn: () => getProgramCourseUnits(programGuid as string),
    enabled: enabled && !!programGuid,
  })
}

export type { ProgramCourseUnitDto }
