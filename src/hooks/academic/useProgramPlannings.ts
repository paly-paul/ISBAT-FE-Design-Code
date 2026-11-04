import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createProgramPlanning,
  deleteProgramPlanning,
  getProgramPlanningById,
  getProgramPlannings,
  updateProgramPlanning,
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

export function useCreateProgramPlanning() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: ProgramPlanningInput) => createProgramPlanning(input),
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
