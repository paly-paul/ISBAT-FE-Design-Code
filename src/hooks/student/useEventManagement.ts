import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { EventInput, EventItem, createEvent, deleteEvent, getEventById, getEvents, updateEvent } from '@/lib/api/student/eventManagement'

const EVENTS_KEY = ['student-events']

// Server-side paged (page/pageSize). keepPreviousData keeps the current rows
// on screen while the next page loads.
export function useEvents(page: number, pageSize: number) {
  return useQuery({
    queryKey: [...EVENTS_KEY, 'list', page, pageSize],
    queryFn: () => getEvents(page, pageSize),
    placeholderData: keepPreviousData,
  })
}

export function useEvent(guid: string | null, enabled: boolean) {
  return useQuery({
    queryKey: [...EVENTS_KEY, guid],
    queryFn: () => getEventById(guid as string),
    enabled: enabled && !!guid,
  })
}

export function useCreateEvent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: EventInput) => createEvent(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: EVENTS_KEY }),
  })
}

export function useUpdateEvent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ guid, input }: { guid: string; input: EventInput }) => updateEvent(guid, input),
    onSuccess: (_data, { guid }) => {
      queryClient.invalidateQueries({ queryKey: EVENTS_KEY })
      queryClient.invalidateQueries({ queryKey: [...EVENTS_KEY, guid] })
    },
  })
}

export function useDeleteEvent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (guid: string) => deleteEvent(guid),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: EVENTS_KEY }),
  })
}

export type { EventItem, EventInput }
