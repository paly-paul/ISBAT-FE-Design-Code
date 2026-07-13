import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Stream, StreamInput, createStream, getStreams, updateStream } from '@/lib/api/academic/stream'

const STREAMS_KEY = ['streams']

export function useStreams() {
  return useQuery({
    queryKey: STREAMS_KEY,
    queryFn: () => getStreams(),
    // Never treat the cached list as stale on its own — only refetch when a
    // mutation (create/update) explicitly invalidates this key below,
    // instead of on every remount/window focus.
    staleTime: Infinity,
    gcTime: Infinity,
  })
}

export function useCreateStream() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: StreamInput) => createStream(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: STREAMS_KEY }),
  })
}

export function useUpdateStream() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: StreamInput }) => updateStream(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: STREAMS_KEY }),
  })
}

export type { Stream, StreamInput }
