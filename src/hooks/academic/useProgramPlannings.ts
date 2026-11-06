import { keepPreviousData, useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createProgramPlannings,
  deleteProgramPlanning,
  getProgramPlanningById,
  getProgramPlannings,
  getUnallocatedCourseUnits,
  updateProgramPlanning,
  ProgramPlanningCreateInput,
  ProgramPlanningDto,
  ProgramPlanningInput,
  ProgramPlanningListParams,
  ProgramPlanningListResult,
} from '@/lib/api/academic/programPlanning'

const PROGRAM_PLANNINGS_KEY = ['program-plannings']

// One server page (get-program-plannings.md, paginated since 2026-11-02),
// newest intake first. Search and the guid filters apply server-side, across
// all pages.
export function useProgramPlannings(page: number, pageSize: number, filters: ProgramPlanningListParams = {}) {
  return useQuery<ProgramPlanningListResult>({
    queryKey: [...PROGRAM_PLANNINGS_KEY, 'list', page, pageSize, filters],
    queryFn: () => getProgramPlannings(filters, page, pageSize),
    placeholderData: keepPreviousData,
    staleTime: Infinity,
    gcTime: Infinity,
  })
}

export function useProgramPlanning(guid: string | null, enabled: boolean) {
  return useQuery({
    queryKey: [...PROGRAM_PLANNINGS_KEY, guid],
    queryFn: () => getProgramPlanningById(guid as string),
    enabled: enabled && !!guid,
  })
}

// Under PROGRAM_PLANNINGS_KEY so every create, update and delete refreshes it:
// allocated units drop out of the list, removed ones come back.
export function useUnallocatedCourseUnits(lecturerGuid: string, intakeGuid: string, search: string) {
  return useInfiniteQuery({
    queryKey: [...PROGRAM_PLANNINGS_KEY, 'course-unit-dropdown', lecturerGuid, intakeGuid, search],
    queryFn: ({ pageParam }) => getUnallocatedCourseUnits(lecturerGuid, intakeGuid, pageParam, 20, search),
    initialPageParam: 1,
    getNextPageParam: (last, all) => {
      const loaded = all.reduce((n, p) => n + p.items.length, 0)
      return loaded < last.totalCount && last.items.length > 0 ? all.length + 1 : undefined
    },
    enabled: !!lecturerGuid && !!intakeGuid,
  })
}

export function useCreateProgramPlannings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: ProgramPlanningCreateInput) => createProgramPlannings(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PROGRAM_PLANNINGS_KEY }),
  })
}

export function useUpdateProgramPlanning() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ guid, input }: { guid: string; input: ProgramPlanningInput }) => updateProgramPlanning(guid, input),
    onSuccess: (_data, { guid }) => {
      queryClient.invalidateQueries({ queryKey: PROGRAM_PLANNINGS_KEY })
      queryClient.invalidateQueries({ queryKey: [...PROGRAM_PLANNINGS_KEY, guid] })
    },
  })
}

export function useDeleteProgramPlanning() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (guid: string) => deleteProgramPlanning(guid),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PROGRAM_PLANNINGS_KEY }),
  })
}

export type { ProgramPlanningDto, ProgramPlanningInput, ProgramPlanningListParams }
