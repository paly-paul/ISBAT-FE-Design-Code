import { useMutation } from '@tanstack/react-query'
import { saveProgramFeeStructureComplete, ProgramFeeStructureHeader, ProgramFeeStructureHeaderInput, ProgramFeeLineSaveInput, ProgramFeeStructureSaveCompleteInput } from '@/lib/api/academic/programFeeStructure'

// No list query backs this yet — the fee-structure page still renders its
// own local MOCK_FEES, so there's nothing to invalidate on success.
export function useSaveProgramFeeStructureComplete() {
  return useMutation({
    mutationFn: (input: ProgramFeeStructureSaveCompleteInput) => saveProgramFeeStructureComplete(input),
  })
}

export type { ProgramFeeStructureHeader, ProgramFeeStructureHeaderInput, ProgramFeeLineSaveInput, ProgramFeeStructureSaveCompleteInput }
