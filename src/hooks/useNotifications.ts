import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getNotifications, markAllNotificationsRead, markNotificationRead, NotificationItem } from '@/lib/api/notifications'

const NOTIFICATIONS_KEY = ['notifications']

export function useNotifications() {
  return useQuery({
    queryKey: NOTIFICATIONS_KEY,
    queryFn: getNotifications,
    // No real endpoint to invalidate against yet (see the note in
    // lib/api/notifications.ts) — a light poll keeps the header bell's
    // unread count from going stale across a long session without needing
    // a websocket. Swap for real invalidation once the API exists.
    refetchInterval: 60_000,
    staleTime: 30_000,
  })
}

// Cheap unread-count reader for the header bell badge — shares the same
// query/cache as useNotifications() above rather than issuing its own fetch.
export function useUnreadNotificationCount(): number {
  const { data = [] } = useNotifications()
  return data.filter(n => !n.isRead).length
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (guid: string) => markNotificationRead(guid),
    // Optimistic update — flips isRead in the cache the instant .mutate()
    // is called, synchronously, rather than waiting on the mutation's
    // promise + a subsequent invalidated refetch. Both callers (Header's
    // hover-preview rows, the notifications page's row click) navigate away
    // right after calling mutate(), so relying on invalidate-then-refetch
    // alone left a window where the header badge's count hadn't actually
    // updated yet by the time the new page rendered — this closes it.
    onMutate: async (guid: string) => {
      await queryClient.cancelQueries({ queryKey: NOTIFICATIONS_KEY })
      const previous = queryClient.getQueryData<NotificationItem[]>(NOTIFICATIONS_KEY)
      queryClient.setQueryData<NotificationItem[]>(NOTIFICATIONS_KEY, old =>
        (old ?? []).map(n => (n.notificationGuid === guid ? { ...n, isRead: true } : n)),
      )
      return { previous }
    },
    onError: (_err, _guid, context) => {
      if (context?.previous) queryClient.setQueryData(NOTIFICATIONS_KEY, context.previous)
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY }),
  })
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => markAllNotificationsRead(),
    // Same optimistic-update reasoning as useMarkNotificationRead above.
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: NOTIFICATIONS_KEY })
      const previous = queryClient.getQueryData<NotificationItem[]>(NOTIFICATIONS_KEY)
      queryClient.setQueryData<NotificationItem[]>(NOTIFICATIONS_KEY, old => (old ?? []).map(n => ({ ...n, isRead: true })))
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(NOTIFICATIONS_KEY, context.previous)
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY }),
  })
}

export type { NotificationItem }
