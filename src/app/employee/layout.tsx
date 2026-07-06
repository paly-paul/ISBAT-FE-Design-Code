'use client'
import { useState, useRef, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Header } from '@/components/Header'
import { Sidebar, RailId } from '@/components/Sidebar'

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const [panelOpen, setPanelOpen] = useState(true)
  const [profileOpen, setProfileOpen] = useState(false)
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set())
  const [activeRail, setActiveRail] = useState<RailId>('employee')
  const profileRef = useRef<HTMLDivElement>(null)
  const prevPathname = useRef<string | null>(null)
  const pathname = usePathname()
  const router = useRouter()

  const currentPage = pathname.split('/').pop() ?? 'employee-master'

  useEffect(() => {
    if (prevPathname.current !== null && prevPathname.current !== pathname) {
      setPanelOpen(false)
    }
    prevPathname.current = pathname
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
