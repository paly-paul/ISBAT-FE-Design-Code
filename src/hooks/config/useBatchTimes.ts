import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createBatchTime, deleteBatchTime, getBatchTimeById, updateBatchTime, getBatchTimesDropdown, BatchTime, BatchTimeInput, BatchTimeDropdownItem } from '@/lib/api/academic/batchTime'

export const BATCH_TIMES_KEY = ['batchTimes']

export function useCreateBatchTime() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: BatchTimeInput) => createBatchTime(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: BATCH_TIMES_KEY }) })
}

// Fetches a single batch time for the Edit modal. Only enabled while the
// modal is actually open with a guid, so it doesn't fire on every render of
// the batch time table.
export function useBatchTime(guid: string | null, enabled: boolean) {
  return useQuery({
    queryKey: [...BATCH_TIMES_KEY, guid],
    queryFn: () => getBatchTimeById(guid as string),
    enabled: enabled && !!guid })
}

export function useUpdateBatchTime() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ guid, input }: { guid: string; input: BatchTimeInput }) => updateBatchTime(guid, input),
    onSuccess: (_data, { guid }) => {
      queryClient.invalidateQueries({ queryKey: BATCH_TIMES_KEY })
      queryClient.invalidateQueries({ queryKey: [...BATCH_TIMES_KEY, guid] })
    } })
}

export function useDeleteBatchTime() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (guid: string) => deleteBatchTime(guid),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: BATCH_TIMES_KEY }) })
}

export type { BatchTime, BatchTimeInput }

export function useBatchTimesDropdown(enabled = true) {
  return useQuery({
    queryKey: [...BATCH_TIMES_KEY, 'dropdown'],
    queryFn: () => getBatchTimesDropdown(),
    staleTime: Infinity,
    gcTime: Infinity,
    enabled })
}
