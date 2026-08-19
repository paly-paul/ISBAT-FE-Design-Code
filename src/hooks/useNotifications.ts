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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY }),
  })
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => markAllNotificationsRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY }),
  })
}

export type { NotificationItem }
