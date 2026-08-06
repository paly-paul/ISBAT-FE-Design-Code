import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createProgramMaster,
  deleteProgramMasterComplete,
  getProgramMasterFullDetails,
  getProgramMasters,
  getProgramMastersByCampus,
  updateProgramMasterComplete,
  ProgramMaster,
  ProgramMasterInput,
  ProgramUnitInput,
  FeeStructureInput,
  FeeLineInput,
  ProgramMasterFullDetails,
  ProgramMasterUpdateInput,
  ProgramUnitDetail,
  FeeLineDetail,
  FeeStructureDetail,
  ProgramUnitUpdateInput,
  FeeLineUpdateInput,
  FeeStructureUpdateInput,
} from '@/lib/api/academic/programMaster'

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

// Per Application_Payment_Change_Requests_Final_Updated.md #7 — backs the
// Application Payment page's Interested Programme dropdown, scoped to
// whichever Campus is currently selected. Only enabled once a campus is
// picked, same convention as other cascading dropdowns in this app.
export function useProgramMastersByCampus(campusGuid: string, enabled: boolean) {
  return useQuery({
    queryKey: [...PROGRAM_MASTERS_KEY, 'byCampus', campusGuid],
    queryFn: () => getProgramMastersByCampus(campusGuid),
    enabled: enabled && !!campusGuid,
  })
}

export function useCreateProgramMaster() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: ProgramMasterInput) => createProgramMaster(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PROGRAM_MASTERS_KEY }),
  })
}

// Fetches the full course-unit/fee-structure breakdown for the Edit modal.
// Only enabled while the modal is actually open in edit mode with a guid,
// same fetch-by-guid convention as the other real Edit modals in this app.
export function useProgramMasterFullDetails(programGuid: string | null, enabled: boolean) {
  return useQuery({
    queryKey: [...PROGRAM_MASTERS_KEY, 'fullDetails', programGuid],
    queryFn: () => getProgramMasterFullDetails(programGuid as string),
    enabled: enabled && !!programGuid,
  })
}

export function useUpdateProgramMasterComplete() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ programGuid, input }: { programGuid: string; input: ProgramMasterUpdateInput }) => updateProgramMasterComplete(programGuid, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PROGRAM_MASTERS_KEY }),
  })
}

export function useDeleteProgramMasterComplete() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (programGuid: string) => deleteProgramMasterComplete(programGuid),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PROGRAM_MASTERS_KEY }),
  })
}

export type {
  ProgramMaster,
  ProgramMasterInput,
  ProgramUnitInput,
  FeeStructureInput,
  FeeLineInput,
  ProgramMasterFullDetails,
  ProgramMasterUpdateInput,
  ProgramUnitDetail,
  FeeLineDetail,
  FeeStructureDetail,
  ProgramUnitUpdateInput,
  FeeLineUpdateInput,
  FeeStructureUpdateInput,
}
