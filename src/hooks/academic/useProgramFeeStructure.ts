import { useMutation } from '@tanstack/react-query'
import { createProgramFeeStructureHeader, ProgramFeeStructureHeader, ProgramFeeStructureHeaderInput } from '@/lib/api/academic/programFeeStructure'

// No list query backs this yet — the fee-structure page still renders its
// own local MOCK_FEES, so there's nothing to invalidate on success.
export function useCreateProgramFeeStructureHeader() {
  return useMutation({
    mutationFn: (input: ProgramFeeStructureHeaderInput) => createProgramFeeStructureHeader(input),
  })
}

export type { ProgramFeeStructureHeader, ProgramFeeStructureHeaderInput }
