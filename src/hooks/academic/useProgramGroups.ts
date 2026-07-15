import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createProgramGroup, deleteProgramGroup, getProgramGroupById, getProgramGroups, ProgramGroup, ProgramGroupInput, updateProgramGroup } from '@/lib/api/academic/programGroup'

const PROGRAM_GROUPS_KEY = ['programGroups']

// Fetch a single page large enough to cover the whole list — nothing in
// this codebase currently paginates the master lists client-side, so the
// hook needs the full set in one request rather than the API's default
// page=1/pageSize=10 (which would silently hide any row past the 10th).
const PROGRAM_GROUPS_PAGE_SIZE = 1000

export function useProgramGroups() {
  return useQuery({
    queryKey: PROGRAM_GROUPS_KEY,
    queryFn: () => getProgramGroups(1, PROGRAM_GROUPS_PAGE_SIZE),
    // Never treat the cached list as stale on its own — only refetch once a
    // create/update mutation explicitly invalidates this key (not wired up
    // yet — this hook is GET-only for now).
    staleTime: Infinity,
    gcTime: Infinity,
  })
}

export function useCreateProgramGroup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: ProgramGroupInput) => createProgramGroup(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PROGRAM_GROUPS_KEY }),
  })
}

// Fetches a single programme group for the Edit modal. Only enabled while
// the modal is actually open with a guid, so it doesn't fire on every
// render of the programme group table.
export function useProgramGroup(programGroupGuid: string | null, enabled: boolean) {
  return useQuery({
    queryKey: [...PROGRAM_GROUPS_KEY, programGroupGuid],
    queryFn: () => getProgramGroupById(programGroupGuid as string),
    enabled: enabled && !!programGroupGuid,
  })
}

export function useUpdateProgramGroup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ guid, input }: { guid: string; input: ProgramGroupInput }) => updateProgramGroup(guid, input),
    onSuccess: (_data, { guid }) => {
      queryClient.invalidateQueries({ queryKey: PROGRAM_GROUPS_KEY })
      queryClient.invalidateQueries({ queryKey: [...PROGRAM_GROUPS_KEY, guid] })
    },
  })
}

export function useDeleteProgramGroup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (guid: string) => deleteProgramGroup(guid),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PROGRAM_GROUPS_KEY }),
  })
}

export type { ProgramGroup, ProgramGroupInput }
