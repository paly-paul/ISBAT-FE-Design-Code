import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { createBatch, deleteBatch, getBatchById, getBatches, getStudentCountsByBatch, updateBatch, Batch, BatchCreateInput, BatchDetail, BatchUpdateInput } from '@/lib/api/academic/batch'

const BATCHES_KEY = ['batches']

// search added (2026-09-09) so Batch Management's own table can page through
// real server-side search results instead of the separate page-1-only
// useBatchSearch below — every existing call site passes just the first two
// args, so this stays a no-op default for them. enabled defaults to true so
// they also keep eagerly fetching exactly as before — only a caller that
// shouldn't hit the network until it's actually needed (e.g. a rare
// client-side fallback lookup, only consulted once a profile's own
// pre-resolved batchCode comes back null) needs to pass it explicitly.
// keepPreviousData avoids a loading flash between pages/searches, same
// convention as useCourseUnits/useEnquiries.
export function useBatches(pageNumber: number, pageSize: number, search = '', enabled = true) {
  return useQuery({
    queryKey: [...BATCHES_KEY, pageNumber, pageSize, search],
    queryFn: () => getBatches(pageNumber, pageSize, search),
    staleTime: Infinity,
    gcTime: Infinity,
    enabled,
    placeholderData: keepPreviousData,
  })
}

export function useCreateBatch() {
  return useMutation({
    mutationFn: (input: BatchCreateInput) => createBatch(input),
  })
}

// Fetches a single batch for the Edit modal. Only enabled while the modal
// is actually open with a guid.
export function useBatch(guid: string | null, enabled: boolean) {
  return useQuery({
    queryKey: [...BATCHES_KEY, 'byGuid', guid],
    queryFn: () => getBatchById(guid as string),
    enabled: enabled && !!guid,
  })
}

export function useUpdateBatch() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ guid, input }: { guid: string; input: BatchUpdateInput }) => updateBatch(guid, input),
    onSuccess: (_data, { guid }) => {
      queryClient.invalidateQueries({ queryKey: BATCHES_KEY })
      queryClient.invalidateQueries({ queryKey: [...BATCHES_KEY, 'byGuid', guid] })
    },
  })
}

// Backs the delete-confirmation note ("this batch has N students enrolled")
// — scoped to just the one batch actually being deleted rather than the
// whole visible page, since that's the only place this matters. See
// getStudentCountsByBatch's own comment for why a missing key means zero.
export function useBatchStudentCount(batchGuid: string | null, enabled: boolean) {
  return useQuery({
    queryKey: [...BATCHES_KEY, 'studentCount', batchGuid],
    queryFn: () => getStudentCountsByBatch([batchGuid as string]).then(counts => counts[batchGuid as string] ?? 0),
    enabled: enabled && !!batchGuid,
    staleTime: Infinity,
    gcTime: Infinity,
  })
}

export function useDeleteBatch() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (guid: string) => deleteBatch(guid),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: BATCHES_KEY }),
  })
}

export type { Batch, BatchCreateInput, BatchDetail, BatchUpdateInput }
