import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getCampusDropdown } from '@/lib/api/academic/campus'
import { getProgramMastersByCampus } from '@/lib/api/academic/programMaster'
import { getSemestersForProgram } from '@/lib/api/academic/semester'
import { getBatchDropdownForSemesters } from '@/lib/api/academic/batch'
import { getSponsorCategories } from '@/lib/api/student/sponsor'

// Limits on the Semesters and Batches filters of the Transaction and
// Outstanding reports (400 validation_error past these).
export const REPORT_MAX_SEMESTERS = 20
export const REPORT_MAX_BATCHES = 50

// Campus → Programme → Semesters → Batches, plus Sponsor, for both reports.
// Campus and Sponsor load on page open; each other list waits for its parent.
export function useReportScopeOptions(campusGuid: string, programGuid: string, semesterGuids: string[]) {
  const campusesQuery = useQuery({ queryKey: ['academic', 'campus', 'dropdown'], queryFn: getCampusDropdown })
  const sponsorsQuery = useQuery({ queryKey: ['students', 'sponsor-categories', 'all'], queryFn: () => getSponsorCategories(1, 100) })
  const programsQuery = useQuery({
    queryKey: ['academic', 'program-master', 'by-campus', campusGuid],
    queryFn: () => getProgramMastersByCampus(campusGuid),
    enabled: !!campusGuid,
  })
  const semestersQuery = useQuery({
    queryKey: ['academic', 'semesters', 'for-program', programGuid],
    queryFn: () => getSemestersForProgram(programGuid),
    enabled: !!programGuid,
  })
  // Sorted in the key so ticking the same semesters in another order reuses the list.
  const batchesQuery = useQuery({
    queryKey: ['academic', 'batches', 'dropdown', programGuid, [...semesterGuids].sort()],
    queryFn: () => getBatchDropdownForSemesters(programGuid, semesterGuids),
    enabled: !!programGuid && semesterGuids.length > 0,
  })

  const campusOptions = useMemo(() => (campusesQuery.data ?? []).map(c => ({ value: c.campusGuid, label: c.campusName })), [campusesQuery.data])
  const programOptions = useMemo(() => (programsQuery.data ?? []).map(p => ({ value: p.programGuid, label: `${p.programName} (${p.programCode})` })), [programsQuery.data])
  const semesterOptions = useMemo(() => (semestersQuery.data ?? []).map(s => ({ value: s.semesterGuid, label: s.semName })), [semestersQuery.data])
  const batchOptions = useMemo(() => (batchesQuery.data ?? []).map(b => ({ value: b.batchGuid, label: b.batchCode })), [batchesQuery.data])
  const sponsorOptions = useMemo(() => (sponsorsQuery.data?.items ?? []).map(s => ({ value: s.sponsorCategoryGuid, label: s.category })), [sponsorsQuery.data])

  return { campusesQuery, sponsorsQuery, programsQuery, semestersQuery, batchesQuery, campusOptions, programOptions, semesterOptions, batchOptions, sponsorOptions }
}
