'use client'
import { useState, useRef, useEffect, useLayoutEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/Header'
import { refreshSession } from '@/lib/auth'
import { getSessionIdentity, setSessionIdentity } from '@/lib/session'

// Same auth-guard boilerplate every other module layout carries (see
// AcademicLayout) — duplicated rather than shared because each module
// layout also owns its own Sidebar/rail state, which this page doesn't
// have. No Sidebar here on purpose: notifications aren't scoped to one
// module (a single feed can point at Admission, Finance, Academic, ...
// entities), so there's no single rail this page belongs under. It reuses
// the same fixed <Header> everything else sits under, just without the
// rail+panel shell — see .main below for the plain, sidebar-less content
// width this implies.
export default function NotificationsLayout({ children }: { children: React.ReactNode }) {
  const [panelOpen, setPanelOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [displayName, setDisplayName] = useState<string | null>(null)
  const [authChecked, setAuthChecked] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useLayoutEffect(() => {
    const identity = getSessionIdentity()
    if (identity) {
      setDisplayName(identity.displayName)
      setAuthChecked(true)
    }
  }, [])

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

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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
      {/* Same 24px/28px padding as .main elsewhere (see globals.css), just
          without the sidebar rail's margin-left offset — this page has no
          Sidebar. The earlier version capped this at maxWidth:780 and
          centered it, which put far more empty margin on either side than
          every other module page uses; matching .main's own padding here
          instead keeps it visually consistent with the rest of the app. */}
      <main style={{ padding: 'calc(var(--hdr-h) + 24px) 28px 24px', minHeight: '100vh' }}>
        {children}
      </main>
    </>
  )
}
