import { useMutation, useQuery, useQueryClient, useInfiniteQuery, useQueries } from '@tanstack/react-query'
import { Stream, StreamInput, createStream, deleteStream, getStreamById, getStreamsPaged, updateStream, getSpecializationsDropdown, SpecializationDropdownItem } from '@/lib/api/academic/stream'

export const STREAMS_KEY = ['streams']

// Search-as-you-type/scroll picker (2026-09-10), backing
// StreamMultiSearchPicker — same useInfiniteQuery + fetch-next-on-scroll
// pattern useSearchProgramMastersInfinite/useSearchIntakesInfinite/
// useSearchFacultiesInfinite use. Replaces ProgrammeModal's own
// Specialization(s) MultiSelect, which used to read off useStreams(isOpen)'s
// capped 1000-row snapshot. Confirmed live that GET
// /api/v1/academic/specializations genuinely supports page/pageSize/search
// together — see getStreamsPaged.
export function useSearchStreamsInfinite(search: string, pageSize: number, enabled: boolean) {
  return useInfiniteQuery({
    queryKey: [...STREAMS_KEY, 'search-infinite', search, pageSize],
    queryFn: ({ pageParam }) => getStreamsPaged(pageParam, pageSize, search),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const fetched = allPages.reduce((sum, p) => sum + p.items.length, 0)
      return fetched < lastPage.totalCount ? allPages.length + 1 : undefined
    },
    enabled,
    staleTime: Infinity,
    gcTime: Infinity })
}

// Batched-by-guid lookup — same convention as useCourseUnitsByGuids/
// useIntakesByGuids/useFacultiesByGuids, used to resolve display labels
// ("code — name") for a bounded set of already-selected streamGuids (e.g. a
// programme's picked Specialization(s)) without holding the whole stream
// list in memory.
export function useStreamsByGuids(guids: string[]) {
  const unique = Array.from(new Set(guids.filter(Boolean)))
  const results = useQueries({
    queries: unique.map(guid => ({
      queryKey: [...STREAMS_KEY, guid],
      queryFn: () => getStreamById(guid),
      staleTime: Infinity,
      gcTime: Infinity })) })
  const byGuid = new Map<string, Stream>()
  results.forEach((r, i) => { if (r.data) byGuid.set(unique[i], r.data) })
  return byGuid
}

export function useCreateStream() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: StreamInput) => createStream(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: STREAMS_KEY }) })
}

// Fetches a single specialization for the Edit modal. Only enabled while the
// modal is actually open with a guid, so it doesn't fire on every render of
// the specialization table.
export function useStream(guid: string | null, enabled: boolean) {
  return useQuery({
    queryKey: [...STREAMS_KEY, guid],
    queryFn: () => getStreamById(guid as string),
    enabled: enabled && !!guid })
}

export function useUpdateStream() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ guid, input }: { guid: string; input: StreamInput }) => updateStream(guid, input),
    onSuccess: (_data, { guid }) => {
      queryClient.invalidateQueries({ queryKey: STREAMS_KEY })
      queryClient.invalidateQueries({ queryKey: [...STREAMS_KEY, guid] })
    } })
}

export function useDeleteStream() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (guid: string) => deleteStream(guid),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: STREAMS_KEY }) })
}

export type { Stream, StreamInput }

export function useSpecializationsDropdown(enabled = true) {
  return useQuery({
    queryKey: [...STREAMS_KEY, 'dropdown'],
    queryFn: () => getSpecializationsDropdown(),
    staleTime: Infinity,
    gcTime: Infinity,
    enabled })
}
