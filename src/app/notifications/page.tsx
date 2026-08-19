'use client'
import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMarkAllNotificationsRead, useMarkNotificationRead, useNotifications } from '@/hooks/useNotifications'
import { notificationHref, notificationVisual, NotificationItem } from '@/lib/api/notifications'
import { timeAgo } from '@/lib/date'

type Tab = 'all' | 'read' | 'unread'
const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'all', label: 'All', icon: 'lni-list' },
  { id: 'read', label: 'Read', icon: 'lni-checkmark-circle' },
  { id: 'unread', label: 'Unread', icon: 'lni-envelope' },
]

export default function NotificationsPage() {
  const router = useRouter()
  const { data: notifications = [], isLoading } = useNotifications()
  const markRead = useMarkNotificationRead()
  const markAllRead = useMarkAllNotificationsRead()

  const [activeTab, setActiveTab] = useState<Tab>('all')
  const tabRefs = useRef<Partial<Record<Tab, HTMLButtonElement>>>({})
  const [indicator, setIndicator] = useState({ left: 0, width: 0 })

  useLayoutEffect(() => {
    const el = tabRefs.current[activeTab]
    if (el) setIndicator({ left: el.offsetLeft, width: el.offsetWidth })
  }, [activeTab, notifications.length])

  const unreadCount = useMemo(() => notifications.filter(n => !n.isRead).length, [notifications])
  const readCount = notifications.length - unreadCount

  const visibleRows = useMemo(() => {
    if (activeTab === 'unread') return notifications.filter(n => !n.isRead)
    if (activeTab === 'read') return notifications.filter(n => n.isRead)
    return notifications
  }, [notifications, activeTab])

  function openNotification(n: NotificationItem) {
    if (!n.isRead) markRead.mutate(n.notificationGuid)
    router.push(notificationHref(n))
  }

  return (
    <div id="page-notifications">
      <div className="pg-hdr">
        <div>
          <div className="pg-title">Notifications</div>
          <div className="pg-sub">Enquiries, payments, and academic updates across every module</div>
        </div>
        <button className="btn btn-neu" disabled={unreadCount === 0 || markAllRead.isPending} onClick={() => markAllRead.mutate()}>
          <i className="lni lni-checkmark-circle"></i> {markAllRead.isPending ? 'Marking…' : 'Mark all as read'}
        </button>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="tab-bar">
          {TABS.map(t => (
            <button
              key={t.id}
              ref={el => { if (el) tabRefs.current[t.id] = el }}
              className={`tab-btn${activeTab === t.id ? ' active' : ''}`}
              onClick={() => setActiveTab(t.id)}
            >
              <i className={`lni ${t.icon}`} /> {t.label}
              <span className="badge badge-grey" style={{ marginLeft: 2 }}>
                {t.id === 'all' ? notifications.length : t.id === 'read' ? readCount : unreadCount}
              </span>
            </button>
          ))}
          <span className="tab-indicator" style={{ left: indicator.left, width: indicator.width }} />
        </div>

        <div key={activeTab} className="tab-panel-in" style={{ padding: 18 }}>
          {isLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 180 }}>
              <span style={{ color: 'var(--g400)' }}>Loading notifications…</span>
            </div>
          ) : visibleRows.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '48px 24px' }}>
              <div className="tbl-empty-icon-wrap">
                <i className="lni lni-inbox" />
              </div>
              <div className="tbl-empty-title">
                {activeTab === 'unread' ? "You're all caught up" : activeTab === 'read' ? 'No read notifications yet' : 'No notifications yet'}
              </div>
              <div className="tbl-empty-sub">
                {activeTab === 'unread'
                  ? 'There are no unread notifications right now.'
                  : activeTab === 'read'
                    ? 'Notifications you’ve opened will show up here.'
                    : 'New enquiries, payments, and updates will show up here as they happen.'}
              </div>
            </div>
          ) : (
            <div className="ntf-list">
              {visibleRows.map((n, i) => {
                const visual = notificationVisual(n.typeCode)
                return (
                  <button
                    key={n.notificationGuid}
                    className={`ntf-item${n.isRead ? '' : ' unread'}`}
                    style={{ animationDelay: `${Math.min(i, 8) * 30}ms` }}
                    onClick={() => openNotification(n)}
                  >
                    <span className={`ntf-dot ${visual.tone}`}><i className={`lni ${visual.icon}`}></i></span>
                    <span className="ntf-content">
                      <span className="ntf-top-row">
                        <span className="ntf-title">{n.title}</span>
                        {!n.isRead && <span className="ntf-unread-mark"></span>}
                        <span className="ntf-time">{timeAgo(n.createdDate)}</span>
                      </span>
                      <span className="ntf-body">{n.body}</span>
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
