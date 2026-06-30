'use client'
import { useState, useRef, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Header } from '@/components/Header'

const SIDEBAR_SECTIONS = [
  {
    id: 'sc-enq',
    label: 'Enquiry',
    items: [
      { id: 'online-enquiry',  label: 'Online Enquiry',     icon: 'display' },
      { id: 'kiosk-enquiry',   label: 'Self-Service Kiosk', icon: 'tab' },
      { id: 'ondesk-enquiry',  label: 'On-Desk Enquiry',    icon: 'pencil-alt' },
      { id: 'enquiry-list',    label: 'Enquiry List',       icon: 'folder',    badge: '8' },
    ],
  },
  {
    id: 'sc-adm-flow',
    label: 'Admission Flow',
    items: [
      { id: 'dashboard',    label: 'Dashboard',          icon: 'dashboard' },
      { id: 'payment',      label: 'Application Payment', icon: 'credit-cards',  badge: '12' },
      { id: 'filing',       label: 'Application Filing',  icon: 'pencil-alt',    badgeWarn: '7' },
      { id: 'vetting',      label: 'Vetting Desk',        icon: 'search-alt',    badgeWarn: '5' },
      { id: 'registration', label: "Registrar's Desk",    icon: 'graduation',    badgeGreen: '3' },
    ],
  },
  {
    id: 'sc-adm-rec',
    label: 'Records',
    items: [
      { id: 'applicants', label: 'All Applicants', icon: 'users' },
      { id: 'receipts',   label: 'Receipts',       icon: 'files' },
      { id: 'reports',    label: 'Reports',        icon: 'bar-chart' },
    ],
  },
  {
    id: 'sc-adm-set',
    label: 'Settings',
    items: [
      { id: 'programmes',    label: 'Programmes',    icon: 'apartment' },
      { id: 'fee-structures', label: 'Fee Structures', icon: 'dollar' },
    ],
  },
]

export default function AdmissionLayout({ children }: { children: React.ReactNode }) {
  const [panelOpen, setPanelOpen] = useState(true)
  const [profileOpen, setProfileOpen] = useState(false)
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set())
  const profileRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()
  const router = useRouter()

  const currentPage = pathname.split('/').pop() ?? 'dashboard'

  useEffect(() => {
    setPanelOpen(false)
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

  function nav(id: string) {
    router.push('/admission/' + id)
  }

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
        <div className="sidebar">
          <div className="sb-rail bg-bg">
            <div className="rail-item active" data-mod="admission" onClick={() => setPanelOpen(p => !p)} style={{ cursor: 'pointer' }}>
              <span className="rail-icon"><i className="lni lni-clipboard"></i></span>
              <span className="rail-label">Admission</span>
              <span className="rail-dot"></span>
              <span className="rail-tooltip">{panelOpen ? 'Hide panel' : 'Admission'}</span>
            </div>
            <div className="rail-divider"></div>
            <div className="rail-item" data-mod="academic" onClick={() => router.push('/academic/acad-dashboard')} style={{ cursor: 'pointer' }}>
              <span className="rail-icon"><i className="lni lni-graduation"></i></span>
              <span className="rail-label">Academic</span>
              <span className="rail-tooltip">Academic</span>
            </div>
            <div className="rail-divider"></div>
            {[
              { mod: 'finance',    icon: 'dollar',      label: 'Finance' },
              { mod: 'attendance', icon: 'alarm-clock', label: 'Attendance' },
              { mod: 'analytics',  icon: 'bar-chart',   label: 'Analytics' },
            ].map(r => (
              <div key={r.mod} className="rail-item locked" data-mod={r.mod}>
                <span className="rail-icon"><i className={`lni lni-${r.icon}`}></i></span>
                <span className="rail-label">{r.label}</span>
                <span className="rail-tooltip">{r.label} · Coming Soon</span>
              </div>
            ))}
            <div className="rail-spacer"></div>
            <div className="rail-divider"></div>
            <div className="rail-item locked" data-mod="userrole">
              <span className="rail-icon"><i className="lni lni-cog"></i></span>
              <span className="rail-label">Admin</span>
              <span className="rail-tooltip">User &amp; Role · Coming Soon</span>
            </div>
          </div>

          <div className={`sb-panel-shell${panelOpen ? ' open' : ''}`}>
            <div className="sb-panel active">
              <div className="sb-panel-hdr">
                <div className="sb-panel-hdr-title">Module</div>
                <div className="sb-panel-hdr-name"><i className="lni lni-clipboard"></i> Admission</div>
              </div>

              {SIDEBAR_SECTIONS.map(section => {
                const collapsed = collapsedSections.has(section.id)
                return (
                  <div key={section.id} className={`sb-collapse${collapsed ? ' closed' : ''}`}>
                    <div className="sb-group-hdr" onClick={() => toggleCollapse(section.id)}>
                      <span>{section.label}</span>
                      <span className="sb-chevron">{collapsed ? '▸' : '▾'}</span>
                    </div>
                    <div className="sb-collapse-body">
                      {section.items.map(item => (
                        <div
                          key={item.id}
                          className={`sb-item${currentPage === item.id ? ' active' : ''}`}
                          onClick={() => nav(item.id)}
                        >
                          <span className="sb-icon"><i className={`lni lni-${item.icon}`}></i></span>
                          {item.label}
                          {'badge' in item && item.badge && <span className="sb-badge">{item.badge}</span>}
                          {'badgeWarn' in item && item.badgeWarn && <span className="sb-badge warn">{item.badgeWarn}</span>}
                          {'badgeGreen' in item && item.badgeGreen && <span className="sb-badge green">{item.badgeGreen}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}

              <div className="sb-panel-footer">S1 · Admission Service</div>
            </div>
          </div>
        </div>

        <main className={`main${panelOpen ? ' panel-open' : ''}`}>
          {children}
        </main>
      </div>
    </>
  )
}
