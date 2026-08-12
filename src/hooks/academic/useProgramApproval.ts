import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { getProgramApprovals, updateProgramApproval, ProgramMasterListDto, PaginatedProgramApprovals } from '@/lib/api/academic/programApproval'

const PROGRAM_APPROVALS_KEY = ['programApprovals']

export function useProgramApprovals(pageNumber = 1, pageSize = 20, search = '') {
  return useQuery({
    queryKey: [...PROGRAM_APPROVALS_KEY, pageNumber, pageSize, search],
    queryFn: () => getProgramApprovals(pageNumber, pageSize, search),
    placeholderData: keepPreviousData,
  })
}

export function useUpdateProgramApproval() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ programGuid, isApproved }: { programGuid: string; isApproved: boolean }) => updateProgramApproval(programGuid, isApproved),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PROGRAM_APPROVALS_KEY }),
  })
}

export type { ProgramMasterListDto, PaginatedProgramApprovals }
