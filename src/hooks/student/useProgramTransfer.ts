import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getProgramTransferBatches,
  getProgramTransferDetail,
  getProgramTransferFeeStructures,
  getProgramTransferHistory,
  postProgramTransfer,
  ProgramTransferInput,
} from '@/lib/api/student/programTransfer'

export function useProgramTransferDetail(studentGuid: string | null) {
  return useQuery({
    queryKey: ['program-transfer-detail', studentGuid],
    queryFn: () => getProgramTransferDetail(studentGuid as string),
    enabled: !!studentGuid,
  })
}

export function useProgramTransferBatches(programGuid: string | null, semesterGuid: string | null) {
  return useQuery({
    queryKey: ['program-transfer-batches', programGuid, semesterGuid],
    queryFn: () => getProgramTransferBatches(programGuid as string, semesterGuid as string),
    enabled: !!programGuid && !!semesterGuid,
  })
}

export function useProgramTransferFeeStructures(programGuid: string | null) {
  return useQuery({
    queryKey: ['program-transfer-fee-structures', programGuid],
    queryFn: () => getProgramTransferFeeStructures(programGuid as string),
    enabled: !!programGuid,
  })
}

export function useProgramTransferHistory(studentGuid: string | null) {
  return useQuery({
    queryKey: ['program-transfer-history', studentGuid],
    queryFn: () => getProgramTransferHistory(studentGuid as string),
    enabled: !!studentGuid,
  })
}

export function usePostProgramTransfer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ studentGuid, input }: { studentGuid: string; input: ProgramTransferInput }) => postProgramTransfer(studentGuid, input),
    onSuccess: (_data, { studentGuid }) => {
      queryClient.invalidateQueries({ queryKey: ['program-transfer-history', studentGuid] })
      queryClient.invalidateQueries({ queryKey: ['program-transfer-detail', studentGuid] })
    },
  })
}

export type {
  ProgramTransferDetail,
  ProgramTransferBatchOption,
  ProgramFeeStructureOption,
  ProgramTransferHistoryRow,
  ProgramTransferInput,
  ProgramTransferResult,
} from '@/lib/api/student/programTransfer'
