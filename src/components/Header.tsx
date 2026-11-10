'use client'
import React, { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { logout } from '@/lib/auth'
import { clearSessionIdentity, getSessionIdentity, SessionIdentity } from '@/lib/session'
import { useMarkNotificationRead, useNotificationsPreview, useUnreadCount } from '@/hooks/useNotifications'
import { notificationHref, notificationVisual, NotificationItem } from '@/lib/api/notifications'
import { endNotificationsSession } from '@/lib/notificationsHub'
import { timeAgo } from '@/lib/date'
import { HeaderDownloads } from '@/components/HeaderDownloads'
import { useCurrentAcademicIntake } from '@/hooks/academic/useIntakes'
import { useMyProfile } from '@/hooks/users/useMyProfile'

interface HeaderProps {
  panelOpen: boolean
  setPanelOpen: React.Dispatch<React.SetStateAction<boolean>>
  profileOpen: boolean
  setProfileOpen: React.Dispatch<React.SetStateAction<boolean>>
  profileRef: React.RefObject<HTMLDivElement>
  displayName?: string
}

const MODULE_CONFIG: Record<string, { label: string; icon: string; pillClass: string }> = {
  academic: { label: 'Academic', icon: 'lni-graduation', pillClass: 'acad' },
  assessment: { label: 'Assessment', icon: 'lni-pencil-alt', pillClass: 'adm' },
  attendance: { label: 'Attendance', icon: 'lni-alarm-clock', pillClass: 'home' },
  admission: { label: 'Admission', icon: 'lni-clipboard', pillClass: 'adm' },
  finance: { label: 'Finance', icon: 'lni-dollar', pillClass: 'acad' },
  student: { label: 'Student', icon: 'lni-user', pillClass: 'home' },
  employee: { label: 'Employee', icon: 'lni-briefcase', pillClass: 'adm' },
  config: { label: 'Config', icon: 'lni-cog', pillClass: 'home' },
  'activity-log': { label: 'Activity Log', icon: 'lni-list', pillClass: 'home' },
  profile: { label: 'Profile', icon: 'lni-user', pillClass: 'home' },
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return ''
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase()
}

// No made-up name when the session hasn't supplied one — the avatar falls
// back to a plain user icon and the name is simply left out.
export function Header({ panelOpen, setPanelOpen, profileOpen, setProfileOpen, profileRef, displayName }: HeaderProps) {
  const pathname = usePathname()
  const moduleKey = pathname ? pathname.split('/').filter(Boolean)[0] || 'academic' : 'academic'
  const currentModule = MODULE_CONFIG[moduleKey] || { label: 'Academic', icon: 'lni-graduation', pillClass: 'acad' }

  const [sessionIdentity, setSessionIdentityState] = useState<SessionIdentity | null>(() => getSessionIdentity())

  useEffect(() => {
    setSessionIdentityState(getSessionIdentity())
  }, [])

  const { data: myProfile } = useMyProfile()
  // An expired photo link falls back to initials; a new link (photo change,
  // or the profile page fetching a fresh one) gets another chance.
  const [brokenPhotoUrl, setBrokenPhotoUrl] = useState<string | null>(null)
  const photoUrl = myProfile?.photoUrl && myProfile.photoUrl !== brokenPhotoUrl ? myProfile.photoUrl : null

  const name =
    sessionIdentity?.employeeName ||
    sessionIdentity?.displayName ||
    myProfile?.empName ||
    displayName?.trim() ||
    ''
  const initials = initialsOf(name)

  const designation = sessionIdentity?.designation?.trim() || myProfile?.account?.userTypeName?.trim() || ''
  const department = sessionIdentity?.department?.trim() || ''

  const roleParts = [designation, department || (designation ? '' : currentModule.label)].filter(Boolean)
  const roleSubtitle = roleParts.length > 0 ? roleParts.join(' · ') : 'System Admin · Academic'
  const [signingOut, setSigningOut] = useState(false)
  const queryClient = useQueryClient()
  const router = useRouter()

  // Whichever intake is flagged current in Intake Master — left out of the
  // header until it loads (or if none is flagged) rather than showing a
  // hardcoded one.
  const { data: currentIntake } = useCurrentAcademicIntake()

  const { data: unreadCount = 0 } = useUnreadCount()
  const markRead = useMarkNotificationRead()

  // Hover preview — clicking the bell itself always navigates straight to
  // /notifications; hovering shows a quick preview instead. Backed by
  // useNotificationsPreview, which is NOT fetched on hover — see that hook's
  // comment for why (an earlier version fetched on every mouseenter, which
  // showed up as an unwanted poll in the network tab).
  const [bellOpen, setBellOpen] = useState(false)
  const { data: previewResult, isLoading: previewLoading } = useNotificationsPreview()
  const previewItems = (previewResult?.items ?? []).slice(0, 3)

  function openNotification(n: NotificationItem) {
    if (!n.isRead) markRead.mutate(n.notificationGuid)
    setBellOpen(false)
    router.push(notificationHref(n))
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
      // A stale hub connection keeps receiving pushes for this user until
      // the cookie expires — must run on logout, not just tab close (see
      // notificationsHub.ts). Also resets the "already started" guard so a
      // different user logging in later in this same tab gets a genuine
      // fresh count-then-connect sequence rather than finding it a no-op.
      endNotificationsSession()
      // The full reload below also drops the QueryClient, but clear it first
      // so nothing cached (menu, employees, ...) is served in the moment
      // before the page unloads.
      queryClient.clear()
      // A full page load, replacing this entry: the signed-in page leaves
      // history and the app's in-memory state is thrown away, so Back /
      // Forward after logout can't bring back a saved signed-in screen.
      // Straight to the staff sign-in form, not the portal selector — every
      // screen with this header is staff-facing.
      window.location.replace('/login/staff')
    }
  }

  return (
    <header className="hdr">
      <div className="hdr-brand bg-bg">
        <button className="hdr-menu-btn" onClick={() => setPanelOpen(p => !p)} aria-label="Toggle menu">
          <i className={`lni ${panelOpen ? 'lni-close' : 'lni-menu'}`}></i>
        </button>
      </div>
      <div className="hdr-body">
        {/* University logo (same artwork as the login screens' PanelA) →
            the app's landing page. Header is shared across every module
            layout (Academic, Finance, Employee, ...), so there's no single
            "current module's dashboard" to send this to — Academic's
            dashboard is the closest thing this app has to a home screen. */}
        <button className="hdr-logo-btn" onClick={() => router.push('/academic/acad-dashboard')} aria-label="ISBAT University — go to dashboard" title="Dashboard">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="hdr-logo" src="/isbat-university-logo.png" alt="" width={768} height={252} />
        </button>
        <div className="hdr-right">
          <div className={`hdr-module-pill ${currentModule.pillClass}`}><i className={`lni ${currentModule.icon}`}></i> {currentModule.label}</div>
          {currentIntake && <div className="hdr-intake">{currentIntake.description} ({currentIntake.intakeCode})</div>}
          <HeaderDownloads />
          <div
            className="hdr-bell-wrap"
            onMouseEnter={() => setBellOpen(true)}
            onMouseLeave={() => setBellOpen(false)}
          >
            <button
              className={`hdr-bell${unreadCount > 0 ? ' has-unread' : ''}`}
              onClick={() => router.push('/notifications')}
              aria-label={unreadCount > 0 ? `Notifications — ${unreadCount} unread` : 'Notifications'}
              title="Notifications"
            >
              <i className="lni lni-alarm"></i>
              {unreadCount > 0 && <span className="hdr-bell-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
            </button>

            {/* Fetch-free — reads whatever useNotificationsPreview already has
                cached, no request fired on hover-in. No search box here
                either (the per-keystroke version of the same problem); full
                search lives on /notifications. */}
            {bellOpen && (
              <div className="hdr-bell-dropdown">
                <div className="hdr-bell-dropdown-inner">
                  <div className="hdr-bell-dropdown-hdr">
                    <span>Notifications</span>
                    {unreadCount > 0 && <span className="badge badge-blue">{unreadCount} new</span>}
                  </div>
                  <div className="hdr-bell-list">
                    {previewLoading ? (
                      <div className="hdr-bell-dropdown-empty">Loading…</div>
                    ) : previewItems.length === 0 ? (
                      <div className="hdr-bell-dropdown-empty">You&apos;re all caught up</div>
                    ) : (
                      previewItems.map(n => {
                        const visual = notificationVisual(n.typeCode)
                        return (
                          <button key={n.notificationGuid} className={`hdr-bell-item${n.isRead ? '' : ' unread'}`} onClick={() => openNotification(n)}>
                            <span className={`ntf-dot ${visual.tone}`} style={{ width: 30, height: 30, fontSize: 14 }}><i className={`lni ${visual.icon}`}></i></span>
                            <span className="hdr-bell-item-content">
                              <span className="hdr-bell-item-title">{n.title}</span>
                              <span className="hdr-bell-item-time">{timeAgo(n.createdDate)}</span>
                            </span>
                          </button>
                        )
                      })
                    )}
                  </div>
                  <button className="hdr-bell-dropdown-viewall" onClick={() => { setBellOpen(false); router.push('/notifications') }}>
                    View all notifications <i className="lni lni-arrow-right"></i>
                  </button>
                </div>
              </div>
            )}
          </div>
          <div className="hdr-user" ref={profileRef} onClick={() => setProfileOpen(p => !p)}>
            <div className="hdr-avatar">
              {photoUrl
                ? <img src={photoUrl} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} onError={() => setBrokenPhotoUrl(photoUrl)} />
                : initials || <i className="lni lni-user"></i>}
            </div>
            {name && <span>{name}</span>}
            {profileOpen && (
              <div className="profile-dropdown">
                <div className="profile-dropdown-info">
                  {name && <div className="profile-dropdown-name">{name}</div>}
                  <div className="profile-dropdown-role">{roleSubtitle}</div>
                </div>
                <div className="profile-dropdown-divider" />
                <button
                  className="profile-dropdown-link"
                  onClick={() => { setProfileOpen(false); router.push('/profile') }}
                >
                  <i className="lni lni-user"></i> Profile
                </button>
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
