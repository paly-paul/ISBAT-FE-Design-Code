import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
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

// Course Allocation now reads a paged result envelope from the API (or a
// local emulation in mock mode) so the table can page through the backend's
// own list rather than loading the full catalog and slicing it client-side.
export function useProgramPlannings(params: ProgramPlanningListParams = {}, pageNumber = 1, pageSize = 10) {
  return useQuery<ProgramPlanningListResult>({
    queryKey: [...PROGRAM_PLANNINGS_KEY, params, pageNumber, pageSize],
    queryFn: () => getProgramPlannings(params, pageNumber, pageSize),
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
