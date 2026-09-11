import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createRoom, deleteRoom, getRoomById, getRooms, Room, RoomInput, RoomListResult, updateRoom } from '@/lib/api/academic/room'

const ROOMS_KEY = ['rooms']

// Original unpaged room list used by the modal/other consumers that expect a
// flat Room[] payload.
export function useRooms(enabled = true) {
  return useQuery<Room[]>({
    queryKey: [...ROOMS_KEY, 'flat'],
    queryFn: () => getRooms('', 1, 1000).then(data => data.items),
    staleTime: Infinity,
    gcTime: Infinity,
    enabled,
  })
}

// Paged room list for the Room Management table itself.
export function useRoomsPaged(enabled = true, pageNumber = 1, pageSize = 10) {
  return useQuery<RoomListResult>({
    queryKey: [...ROOMS_KEY, 'paged', pageNumber, pageSize],
    queryFn: () => getRooms('', pageNumber, pageSize),
    staleTime: Infinity,
    gcTime: Infinity,
    enabled,
  })
}

// Server-side search for Room Management's search box — hits the same list
// endpoint with the real, confirmed ?search= param (get-rooms.md) instead of
// filtering the already-fetched full list client-side. Kept as its own
// hook/query key so the main table can stay paged independently.
export function useRoomSearch(search: string) {
  const q = search.trim()
  return useQuery({
    queryKey: [...ROOMS_KEY, 'search', q, 1, 8],
    queryFn: () => getRooms(q, 1, 8),
    enabled: q.length > 0,
    select: (data: RoomListResult) => data.items,
    staleTime: Infinity,
    gcTime: Infinity,
  })
}

export function useCreateRoom() {
  return useMutation({
    mutationFn: (input: RoomInput) => createRoom(input),
  })
}

// Fetches a single room for the Edit/View modals. Only enabled while the
// modal is actually open with a guid, so it doesn't fire on every render of
// the room table.
export function useRoom(roomGuid: string | null, enabled: boolean) {
  return useQuery({
    queryKey: [...ROOMS_KEY, roomGuid],
    queryFn: () => getRoomById(roomGuid as string),
    enabled: enabled && !!roomGuid,
  })
}

export function useUpdateRoom() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ guid, input }: { guid: string; input: RoomInput }) => updateRoom(guid, input),
    onSuccess: (_data, { guid }) => {
      queryClient.invalidateQueries({ queryKey: ROOMS_KEY })
      queryClient.invalidateQueries({ queryKey: [...ROOMS_KEY, guid] })
    },
  })
}

export function useDeleteRoom() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (guid: string) => deleteRoom(guid),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ROOMS_KEY }),
  })
}

export type { Room, RoomInput }
