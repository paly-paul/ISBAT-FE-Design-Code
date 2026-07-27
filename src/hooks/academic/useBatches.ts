import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createBatch, deleteBatch, getBatchById, getBatches, updateBatch, Batch, BatchCreateInput, BatchUpdateInput } from '@/lib/api/academic/batch'

const BATCHES_KEY = ['batches']

export function useBatches(pageNumber: number, pageSize: number) {
  return useQuery({
    queryKey: [...BATCHES_KEY, pageNumber, pageSize],
    queryFn: () => getBatches(pageNumber, pageSize),
    staleTime: Infinity,
    gcTime: Infinity,
  })
}

export function useCreateBatch() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: BatchCreateInput) => createBatch(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: BATCHES_KEY }),
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

export function useDeleteBatch() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (guid: string) => deleteBatch(guid),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: BATCHES_KEY }),
  })
}

export type { Batch, BatchCreateInput, BatchUpdateInput }
