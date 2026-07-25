import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createProgramMaster, getProgramMasters, ProgramMaster, ProgramMasterInput, ProgramUnitInput, FeeStructureInput, FeeLineInput } from '@/lib/api/academic/programMaster'

const PROGRAM_MASTERS_KEY = ['programMasters']

export function useProgramMasters() {
  return useQuery({
    queryKey: PROGRAM_MASTERS_KEY,
    queryFn: () => getProgramMasters(),
    // Never treat the cached list as stale on its own — only refetch when a
    // mutation (create) explicitly invalidates this key below, instead of on
    // every remount/window focus.
    staleTime: Infinity,
    gcTime: Infinity,
  })
}

export function useCreateProgramMaster() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: ProgramMasterInput) => createProgramMaster(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PROGRAM_MASTERS_KEY }),
  })
}

export type { ProgramMaster, ProgramMasterInput, ProgramUnitInput, FeeStructureInput, FeeLineInput }
