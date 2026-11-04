import { useInfiniteQuery, useMutation, useQuery, useQueryClient, useQueries, keepPreviousData } from '@tanstack/react-query'
import { createProgramGroup, deleteProgramGroup, getProgramGroupById, getProgramGroupsPaged, ProgramGroup, ProgramGroupInput, updateProgramGroup } from '@/lib/api/academic/programGroup'
import { getNextPageParam } from '@/lib/pagination'

const PROGRAM_GROUPS_KEY = ['programGroups']

// Real server-side pagination (2026-09-09) for Programme Group's own table —
// see getProgramGroupsPaged's own comment.
export function useProgramGroupsPaged(page: number, pageSize: number, search: string) {
  return useQuery({
    queryKey: [...PROGRAM_GROUPS_KEY, 'paged', page, pageSize, search],
    queryFn: () => getProgramGroupsPaged(page, pageSize, search),
    placeholderData: keepPreviousData,
  })
}

export function useSearchProgramGroupsInfinite(search: string, pageSize: number, enabled: boolean) {
  return useInfiniteQuery({
    queryKey: [...PROGRAM_GROUPS_KEY, 'search-infinite', search, pageSize],
    queryFn: ({ pageParam }) => getProgramGroupsPaged(pageParam, pageSize, search),
    initialPageParam: 1,
    getNextPageParam,
    enabled,
    staleTime: Infinity,
    gcTime: Infinity,
  })
}

// Batched-by-guid lookup — same convention as useCourseUnitsByGuids/
// useIntakesByGuids/useFacultiesByGuids, used to resolve display labels for
// a bounded set of specific programGroupGuids (e.g. just the ones referenced
// by the current page of Programme Master's own table, or a single record's
// programGroupGuid in a View modal) without holding the whole programme
// group list in memory.
export function useProgramGroupsByGuids(guids: string[]) {
  const unique = Array.from(new Set(guids.filter(Boolean)))
  const results = useQueries({
    queries: unique.map(guid => ({
      queryKey: [...PROGRAM_GROUPS_KEY, guid],
      queryFn: () => getProgramGroupById(guid),
      staleTime: Infinity,
      gcTime: Infinity,
    })),
  })
  const byGuid = new Map<string, ProgramGroup>()
  results.forEach((r, i) => { if (r.data) byGuid.set(unique[i], r.data) })
  return byGuid
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
