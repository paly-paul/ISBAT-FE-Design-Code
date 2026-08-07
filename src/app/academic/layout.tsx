'use client'
import { useState, useRef, useEffect, useLayoutEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Header } from '@/components/Header'
import { Sidebar, RailId } from '@/components/Sidebar'
import { AuthError, refreshSession } from '@/lib/auth'
import { getSessionIdentity, setSessionIdentity, clearSessionIdentity } from '@/lib/session'

// Background access-token renewal while the app is open. Without this, the
// ONLY thing that ever refreshes the token is a reactive 401 from an actual
// API call (see client.ts's handleUnauthorized) — but this app caches almost
// every master list with staleTime: Infinity, so a user who's just clicking
// around pages whose data is already cached can go a long time firing no
// new network requests at all. The access token then expires silently with
// nothing to catch it, and if the refresh-token has *also* gone stale by the
// time the user finally does trigger a fresh request, they get logged out
// with no warning — which matches "logs out after some time" exactly.
// 10 minutes is a conservative guess pending a confirmed access-token TTL
// from the backend team — safe for any TTL of ~15min+, but tighten this (or
// get an exact figure to time it against) if the real TTL turns out shorter.
const SESSION_REFRESH_INTERVAL_MS = 10 * 60 * 1000

export default function AcademicLayout({ children }: { children: React.ReactNode }) {
  const [panelOpen, setPanelOpen] = useState(true)
  const [profileOpen, setProfileOpen] = useState(false)
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set())
  const [activeRail, setActiveRail] = useState<RailId>('academic')
  // Restore the saved identity before paint to avoid a loader flash.
  const [displayName, setDisplayName] = useState<string | null>(null)
  const [authChecked, setAuthChecked] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()
  const router = useRouter()

  const currentPage = pathname.split('/').pop() ?? 'acad-dashboard'

  // Use the saved identity before the first paint so the screen does not flash the loader.
  useLayoutEffect(() => {
    const identity = getSessionIdentity()
    if (identity) {
      setDisplayName(identity.displayName)
      setAuthChecked(true)
    }
  }, [])

  // Use the saved identity first and refresh the session only if needed.
  useEffect(() => {
    let cancelled = false

    async function check() {
      const identity = getSessionIdentity()
      if (identity) {
        setDisplayName(identity.displayName)
        setAuthChecked(true)
        return
      }

      try {
        const result = await refreshSession()
        if (cancelled) return
        if (result.displayName) setSessionIdentity({ displayName: result.displayName })
        setDisplayName(result.displayName ?? null)
        setAuthChecked(true)
      } catch {
        if (!cancelled) router.replace('/login/staff')
      }
    }

    check()

    return () => {
      cancelled = true
    }
  }, [router])

  // Proactive keep-alive — see SESSION_REFRESH_INTERVAL_MS above. Only
  // starts once the initial auth check has resolved, and stops if that
  // check ever routes away to /login/staff. A failure here means the
  // refresh-token itself is genuinely gone — refreshSession() now routes
  // through refreshAccessTokenWithRetry() (see client.ts), which retries
  // once after a 500ms delay to survive a racy rotation collision against
  // another tab's own independent keep-alive timer before giving up — so
  // it's treated the same as the mount-time check's own failure: clear the
  // stale identity and send the user to log in again, same as a reactive
  // 401 would eventually do anyway, just before it has a chance to
  // interrupt whatever the user is doing.
  useEffect(() => {
    if (!authChecked) return
    const interval = setInterval(() => {
      refreshSession()
        .then(result => {
          if (result.displayName) setSessionIdentity({ displayName: result.displayName })
        })
        .catch(err => {
          if (err instanceof AuthError) {
            clearSessionIdentity()
            router.replace('/login/staff')
          }
        })
    }, SESSION_REFRESH_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [authChecked, router])

  // Reset scroll when the route changes.
  useEffect(() => {
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [pathname])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function toggleCollapse(id: string) {
    setCollapsedSections(prev => {
      const s = new Set(prev)
      if (s.has(id)) s.delete(id); else s.add(id)
      return s
    })
  }

  if (!authChecked) {
    return (
      <div style={{ display: 'grid', placeContent: 'center', minHeight: '100vh' }}>
        <span
          style={{
            width: 28, height: 28,
            border: '3px solid var(--g100, #e2e2e2)',
            borderTopColor: 'var(--b500, #2E6BE6)',
            borderRadius: '50%',
            animation: 'spin 700ms linear infinite',
          }}
        />
      </div>
    )
  }

  return (
    <>
      <Header
        panelOpen={panelOpen}
        setPanelOpen={setPanelOpen}
        profileOpen={profileOpen}
        setProfileOpen={setProfileOpen}
        profileRef={profileRef}
        onSignOut={() => router.push('/')}
        displayName={displayName ?? undefined}
      />
      <div className="layout">
        <Sidebar
          panelOpen={panelOpen}
          setPanelOpen={setPanelOpen}
          currentPage={currentPage}
          collapsedSections={collapsedSections}
          toggleCollapse={toggleCollapse}
          activeRail={activeRail}
          setActiveRail={setActiveRail}
        />
        <main className={`main${panelOpen ? ' panel-open' : ''}`}>
          {children}
        </main>
      </div>
    </>
  )
}
