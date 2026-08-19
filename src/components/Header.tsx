'use client'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { logout } from '@/lib/auth'
import { clearSessionIdentity } from '@/lib/session'
import { useMarkNotificationRead, useNotifications } from '@/hooks/useNotifications'
import { notificationHref, notificationVisual, pushSimulatedNotification } from '@/lib/api/notifications'
import { timeAgo } from '@/lib/date'

interface HeaderProps {
  panelOpen: boolean
  setPanelOpen: React.Dispatch<React.SetStateAction<boolean>>
  profileOpen: boolean
  setProfileOpen: React.Dispatch<React.SetStateAction<boolean>>
  profileRef: React.RefObject<HTMLDivElement>
  onSignOut: () => void
  displayName?: string
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || 'U'
}

export function Header({ panelOpen, setPanelOpen, profileOpen, setProfileOpen, profileRef, onSignOut, displayName = 'Administrator' }: HeaderProps) {
  const [signingOut, setSigningOut] = useState(false)
  const queryClient = useQueryClient()
  const router = useRouter()
  const { data: notifications = [] } = useNotifications()
  const markRead = useMarkNotificationRead()
  const unreadCount = notifications.filter(n => !n.isRead).length
  // getNotifications() already sorts newest-first (see lib/api/notifications.ts).
  const previewNotifications = notifications.slice(0, 3)

  function openPreviewNotification(n: (typeof notifications)[number]) {
    if (!n.isRead) markRead.mutate(n.notificationGuid)
    router.push(notificationHref(n))
  }

  // No live push feed yet (see the note on pushSimulatedNotification() in
  // lib/api/notifications.ts) — NotificationToastHost's own interval
  // already simulates one arriving every 35s, but that's a long wait to
  // demo on demand. This fires the same simulated arrival immediately so
  // the slide-in toast can be triggered on command instead of waiting.
  function triggerTestNotification() {
    pushSimulatedNotification()
    queryClient.invalidateQueries({ queryKey: ['notifications'] })
  }

  async function handleSignOut(e: React.MouseEvent) {
    e.stopPropagation()
    setSigningOut(true)
    try {
      await logout()
    } catch {
      // Ignore — still sign the user out locally even if the API call fails.
    } finally {
      clearSessionIdentity()
      // onSignOut() navigates client-side (router.push), which does not
      // reset the app's single long-lived QueryClient (see providers.tsx) —
      // without this, every cached query (menu, employees, ...), including
      // any that's cached in an error state, survives into the next login
      // and can serve stale/wrong-user data or a stale error instead of a
      // genuinely fresh fetch.
      queryClient.clear()
      onSignOut()
    }
  }

  return (
    <header className="hdr">
      <div className="hdr-brand bg-bg">
        {/* Logo → the app's landing page. Header is shared across every
            module layout (Academic, Finance, Employee, ...), so there's no
            single "current module's dashboard" to send this to — Academic's
            dashboard is the closest thing this app has to a home screen
            (acad-dashboard is the first route in the route list, and every
            module layout's own activeRail defaults to itself rather than
            Academic, so nothing else is a safer universal default). */}
        <button className="hdr-badge" onClick={() => router.push('/academic/acad-dashboard')} aria-label="Go to dashboard" title="ISBAT ERP — Dashboard">IU</button>
        <button className="hdr-menu-btn" onClick={() => setPanelOpen(p => !p)} aria-label="Toggle menu">
          <i className={`lni ${panelOpen ? 'lni-close' : 'lni-menu'}`}></i>
        </button>
      </div>
      <div className="hdr-body">
        <div className="hdr-title-wrap">
          <div className="hdr-title">ISBAT University ERP</div>
          <div className="hdr-sub">Enterprise Resource Planning · Spring 2026</div>
        </div>
        <div className="hdr-right">
          <div className="hdr-module-pill acad"><i className="lni lni-graduation"></i> Academic</div>
          <div className="hdr-intake">Spring 2026 (20261)</div>
          <div className="hdr-bell-wrap">
            <button
              className={`hdr-bell${unreadCount > 0 ? ' has-unread' : ''}`}
              onClick={() => router.push('/notifications')}
              aria-label={unreadCount > 0 ? `Notifications — ${unreadCount} unread` : 'Notifications'}
              title="Notifications"
            >
              <i className="lni lni-alarm"></i>
              {unreadCount > 0 && <span className="hdr-bell-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
            </button>

            {/* Hover preview (not click, unlike the profile menu below) —
                shows the 3 most recent notifications so a user can glance
                at what's new without leaving the page. Clicking the bell
                itself still goes straight to the full /notifications page. */}
            <div className="hdr-bell-dropdown">
              <div className="hdr-bell-dropdown-inner">
                <div className="hdr-bell-dropdown-hdr">
                  <span>Notifications</span>
                  {unreadCount > 0 && <span className="badge badge-blue">{unreadCount} new</span>}
                </div>
                {previewNotifications.length === 0 ? (
                  <div className="hdr-bell-dropdown-empty">You&apos;re all caught up</div>
                ) : (
                  previewNotifications.map(n => {
                    const visual = notificationVisual(n.typeCode)
                    return (
                      <button key={n.notificationGuid} className={`hdr-bell-item${n.isRead ? '' : ' unread'}`} onClick={() => openPreviewNotification(n)}>
                        <span className={`ntf-dot ${visual.tone}`} style={{ width: 30, height: 30, fontSize: 14 }}><i className={`lni ${visual.icon}`}></i></span>
                        <span className="hdr-bell-item-content">
                          <span className="hdr-bell-item-title">{n.title}</span>
                          <span className="hdr-bell-item-time">{timeAgo(n.createdDate)}</span>
                        </span>
                      </button>
                    )
                  })
                )}
                <button className="hdr-bell-dropdown-viewall" onClick={() => router.push('/notifications')}>
                  View all notifications <i className="lni lni-arrow-right"></i>
                </button>
                {/* Dev/test aid — no live push feed exists yet, so this is
                    how the slide-in toast gets demoed without waiting for
                    NotificationToastHost's own 35s simulated interval. */}
                <button className="hdr-bell-dropdown-test" onClick={triggerTestNotification}>
                  <i className="lni lni-bolt"></i> Simulate new notification
                </button>
              </div>
            </div>
          </div>
          <div className="hdr-user" ref={profileRef} onClick={() => setProfileOpen(p => !p)}>
            <div className="hdr-avatar">{initialsOf(displayName)}</div>
            <span>{displayName}</span>
            {profileOpen && (
              <div className="profile-dropdown">
                <div className="profile-dropdown-info">
                  <div className="profile-dropdown-name">{displayName}</div>
                  <div className="profile-dropdown-role">System Admin · Academic</div>
                </div>
                <div className="profile-dropdown-divider" />
                <button
                  className="profile-dropdown-signout"
                  onClick={handleSignOut}
                  disabled={signingOut}
                >
                  <i className="lni lni-exit"></i> {signingOut ? 'Signing out…' : 'Sign Out'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
