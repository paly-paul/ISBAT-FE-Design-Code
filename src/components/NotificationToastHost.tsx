'use client'
import { useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useMarkNotificationRead, useNotifications } from '@/hooks/useNotifications'
import { notificationHref, notificationVisual, NotificationItem } from '@/lib/api/notifications'
import { timeAgo } from '@/lib/date'

// Same env-driven duration convention as SuccessPopup's
// NEXT_PUBLIC_SUCCESS_POPUP_DURATION — seconds, not ms, so it reads the same
// way in .env.local/.env.example.
const TOAST_DURATION_S = parseInt(process.env.NEXT_PUBLIC_NOTIFICATION_TOAST_DURATION ?? '6', 10)
const TOAST_DURATION_MS = TOAST_DURATION_S * 1000

interface ActiveToast {
  key: string
  notification: NotificationItem
}

// Mounted once, app-wide, in Providers.tsx (same reasoning as
// SessionKeepAlive there — it must never unmount on client-side navigation,
// or a toast mid-animation would vanish when the user happens to navigate).
export function NotificationToastHost() {
  const pathname = usePathname()
  const router = useRouter()
  const { data: notifications = [] } = useNotifications()
  const markRead = useMarkNotificationRead()

  const seenGuids = useRef<Set<string> | null>(null)
  const [toasts, setToasts] = useState<ActiveToast[]>([])

  // Baseline "already seen" on the first successful load so the existing
  // mock history doesn't dump a stack of toasts on mount — only genuinely
  // new arrivals after that point trigger one.
  useEffect(() => {
    if (seenGuids.current || notifications.length === 0) return
    seenGuids.current = new Set(notifications.map(n => n.notificationGuid))
  }, [notifications])

  useEffect(() => {
    if (!seenGuids.current) return
    const fresh = notifications.filter(n => !seenGuids.current!.has(n.notificationGuid))
    if (fresh.length === 0) return
    fresh.forEach(n => seenGuids.current!.add(n.notificationGuid))
    setToasts(prev => [...prev, ...fresh.map(n => ({ key: `${n.notificationGuid}-${Date.now()}`, notification: n }))])
  }, [notifications])

  // No auth session on the public login screens — nothing to react to
  // there. No automatic simulated-arrival interval anymore either (removed
  // per request) — new toasts now only appear from a real notifications-
  // query refetch picking up something genuinely new, e.g. via the header
  // bell dropdown's "Simulate new notification" test button.
  const isPublicRoute = pathname === '/' || pathname.startsWith('/login')

  function dismiss(key: string) {
    setToasts(prev => prev.filter(t => t.key !== key))
  }

  function openToast(t: ActiveToast) {
    if (!t.notification.isRead) markRead.mutate(t.notification.notificationGuid)
    dismiss(t.key)
    router.push(notificationHref(t.notification))
  }

  if (isPublicRoute || toasts.length === 0) return null

  return (
    <div className="ntf-toast-stack">
      {toasts.map(t => {
        const visual = notificationVisual(t.notification.typeCode)
        return (
          <div
            key={t.key}
            className="ntf-toast"
            style={{ animationDuration: `${TOAST_DURATION_MS}ms` }}
            onAnimationEnd={() => dismiss(t.key)}
          >
            <span className={`ntf-dot ${visual.tone}`}><i className={`lni ${visual.icon}`}></i></span>
            <button className="ntf-toast-body" onClick={() => openToast(t)}>
              <span className="ntf-toast-top">
                <span className="ntf-toast-title">{t.notification.title}</span>
                <span className="ntf-toast-time">{timeAgo(t.notification.createdDate)}</span>
              </span>
              <span className="ntf-toast-msg">{t.notification.body}</span>
            </button>
            <button className="ntf-toast-close" onClick={() => dismiss(t.key)} aria-label="Dismiss notification">
              <i className="lni lni-close"></i>
            </button>
          </div>
        )
      })}
    </div>
  )
}
