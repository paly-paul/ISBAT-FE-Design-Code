import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { getMyProgramPlannings, getMyTimetable, type MyProgramPlanningParams } from '@/lib/api/academic/myTeaching'

// My Profile → Timetable & Course Units. Keyed apart from the admin
// timetable / programme-planning queries: these are the signed-in user's own.
const MY_TEACHING_KEY = ['my-teaching']

// Needs a term, so it stays idle until one is picked.
export function useMyTimetable(term: number | null, intakeGuid: string | null) {
  return useQuery({
    queryKey: [...MY_TEACHING_KEY, 'timetable', term, intakeGuid ?? 'current'],
    queryFn: () => getMyTimetable(term as number, intakeGuid ?? undefined),
    enabled: !!term,
  })
}

// Works with no filters, so it loads straight away. The page on screen stays
// while the next one loads.
export function useMyProgramPlannings(params: MyProgramPlanningParams) {
  return useQuery({
    queryKey: [...MY_TEACHING_KEY, 'course-units', params],
    queryFn: () => getMyProgramPlannings(params),
    placeholderData: keepPreviousData,
  })
}

export type { MyProgramPlanning, MyProgramPlanningList } from '@/lib/api/academic/myTeaching'
