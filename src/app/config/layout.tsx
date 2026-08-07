'use client'
import { useState, useRef, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Header } from '@/components/Header'
import { Sidebar, RailId } from '@/components/Sidebar'
import { AuthError, refreshSession } from '@/lib/auth'
import { clearSessionIdentity } from '@/lib/session'

// Background access-token renewal while the app is open — see the identical
// note in src/app/academic/layout.tsx for the full rationale.
const SESSION_REFRESH_INTERVAL_MS = 10 * 60 * 1000

export default function ConfigLayout({ children }: { children: React.ReactNode }) {
  const [panelOpen, setPanelOpen] = useState(true)
  const [profileOpen, setProfileOpen] = useState(false)
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set())
  const [activeRail, setActiveRail] = useState<RailId>('config')
  const profileRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()
  const router = useRouter()

  const currentPage = pathname.split('/').pop() ?? 'department-master'

  useEffect(() => {
    const interval = setInterval(() => {
      refreshSession().catch(err => {
        if (err instanceof AuthError) {
          clearSessionIdentity()
          router.replace('/login/staff')
        }
      })
    }, SESSION_REFRESH_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [router])

  // Scroll to top on navigation — the sidebar panel is left as the user set
  // it (open/closed, collapsed sections) rather than being force-closed here.
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

  return (
    <>
      <Header
        panelOpen={panelOpen}
        setPanelOpen={setPanelOpen}
        profileOpen={profileOpen}
        setProfileOpen={setProfileOpen}
        profileRef={profileRef}
        onSignOut={() => router.push('/')}
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
