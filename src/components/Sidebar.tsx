'use client'
import { Dispatch, SetStateAction, ReactNode } from 'react'
import { useRouter } from 'next/navigation'

interface SidebarProps {
  panelOpen: boolean
  setPanelOpen: Dispatch<SetStateAction<boolean>>
  currentPage: string
  nav: (id: string) => void
  collapsedSections: Set<string>
  toggleCollapse: (id: string) => void
  activeRail: 'academic' | 'config'
  setActiveRail: Dispatch<SetStateAction<'academic' | 'config'>>
}

export function Sidebar({ panelOpen, setPanelOpen, currentPage, nav, collapsedSections, toggleCollapse, activeRail, setActiveRail }: SidebarProps) {
  const router = useRouter()

  function sbItem(id: string, label: string, icon: string, badge?: { text: string; warn?: boolean }) {
    return (
      <div className={`sb-item${currentPage === id ? ' active' : ''}`} onClick={() => nav(id)}>
        <span className="sb-icon"><i className={`lni lni-${icon}`}></i></span>
        {label}
        {badge && <span className={`sb-badge${badge.warn ? ' warn' : ''}`}>{badge.text}</span>}
      </div>
    )
  }

  function sbSection(id: string, label: string, children: ReactNode) {
    const collapsed = collapsedSections.has(id)
    return (
      <div className={`sb-collapse${collapsed ? ' closed' : ''}`}>
        <div className="sb-group-hdr" onClick={() => toggleCollapse(id)}>
          <span>{label}</span><span className="sb-chevron">{collapsed ? '▸' : '▾'}</span>
        </div>
        <div className="sb-collapse-body">{children}</div>
      </div>
    )
  }

  function clickRail(rail: 'academic' | 'config') {
    if (activeRail === rail) {
      setPanelOpen(p => !p)
    } else {
      setActiveRail(rail)
      setPanelOpen(true)
    }
  }

  return (
    <div className="sidebar">
      <div className="sb-rail bg-bg">
        <div className="rail-item" data-mod="admission" onClick={() => router.push('/admission/dashboard')} style={{ cursor: 'pointer' }}>
          <span className="rail-icon"><i className="lni lni-clipboard"></i></span>
          <span className="rail-label">Admission</span>
          <span className="rail-tooltip">Admission</span>
        </div>
        <div className="rail-divider"></div>
        <div className={`rail-item${activeRail === 'academic' ? ' active' : ''}`} data-mod="academic" onClick={() => clickRail('academic')} style={{ cursor: 'pointer' }}>
          <span className="rail-icon"><i className="lni lni-graduation"></i></span>
          <span className="rail-label">Academic</span>
          {activeRail === 'academic' && panelOpen && <span className="rail-dot"></span>}
          <span className="rail-tooltip">{panelOpen && activeRail === 'academic' ? 'Hide panel' : 'Academic'}</span>
        </div>
        <div className="rail-divider"></div>
        <div className="rail-item locked" data-mod="finance">
          <span className="rail-icon"><i className="lni lni-dollar"></i></span>
          <span className="rail-label">Finance</span>
          <span className="rail-tooltip">Finance · Coming Soon</span>
        </div>
        <div className="rail-item locked" data-mod="attendance">
          <span className="rail-icon"><i className="lni lni-alarm-clock"></i></span>
          <span className="rail-label">Attendance</span>
          <span className="rail-tooltip">Attendance · Coming Soon</span>
        </div>
        <div className="rail-item locked" data-mod="analytics">
          <span className="rail-icon"><i className="lni lni-bar-chart"></i></span>
          <span className="rail-label">Analytics</span>
          <span className="rail-tooltip">Analytics · Coming Soon</span>
        </div>
        <div className={`rail-item${activeRail === 'config' ? ' active' : ''}`} data-mod="config" onClick={() => clickRail('config')} style={{ cursor: 'pointer' }}>
          <span className="rail-icon"><i className="lni lni-cog"></i></span>
          <span className="rail-label">Config</span>
          {activeRail === 'config' && panelOpen && <span className="rail-dot"></span>}
          <span className="rail-tooltip">{panelOpen && activeRail === 'config' ? 'Hide panel' : 'Core Config'}</span>
        </div>
        <div className="rail-spacer"></div>
        <div className="rail-divider"></div>
        <div className="rail-item locked" data-mod="userrole">
          <span className="rail-icon"><i className="lni lni-cog"></i></span>
          <span className="rail-label">Admin</span>
          <span className="rail-tooltip">User &amp; Role · Coming Soon</span>
        </div>
      </div>

      <div className={`sb-panel-shell${panelOpen ? ' open' : ''}`}>
        <div className={`sb-panel${panelOpen ? ' active' : ''}`}>

          {activeRail === 'academic' && <>
            <div className="sb-panel-hdr">
              <div className="sb-panel-hdr-title">Module</div>
              <div className="sb-panel-hdr-name"><i className="lni lni-graduation"></i> Academic</div>
            </div>

            {sbSection('sc-overview', 'Overview', <>
              {sbItem('acad-dashboard', 'Dashboard', 'dashboard')}
            </>)}

            {sbSection('sc-core', 'Academic Core', <>
              {sbItem('intake-master', 'Intake Master', 'calendar')}
              {sbItem('lecturer-master', 'Lecturer Master', 'user')}
              {sbItem('skill-master', 'Skill Management', 'bulb')}
              {sbItem('batch-management', 'Batch Management', 'users')}
              {sbItem('room-management', 'Room Management', 'home')}
              {sbItem('session-movement', 'Session Movement', 'reload', { text: '1', warn: true })}
            </>)}

            {sbSection('sc-cu-master', 'Course Unit Master', <>
              {sbItem('repetition-tag', 'Repetition Tag', 'reload')}
              {sbItem('course-units', 'Course Units', 'book')}
            </>)}

            {sbSection('sc-prog', 'Programme Master', <>
              {sbItem('a-level-master', 'Programme Level', 'layers')}
              {sbItem('programme-group', 'Programme Group', 'folder')}
              {sbItem('programme-master', 'Programme Master', 'graduation')}
              {sbItem('fee-structure', 'Fee Structure', 'dollar')}
            </>)}

            {sbSection('sc-tt', 'Timetable', <>
              {sbItem('timetable', 'Timetable', 'calendar')}
            </>)}

            {sbSection('sc-odl', 'ODL Applications', <>
              {sbItem('odl-applications', 'ODL Applications', 'world', { text: '7' })}
              {sbItem('odl-reconciliation', 'Payment Reconciliation', 'credit-cards', { text: '4', warn: true })}
            </>)}

            {sbSection('sc-cross', 'Cross-Module', <>
              {sbItem('student-lookup', 'Student Lookup', 'user')}
            </>)}

            <div className="sb-panel-footer">S2 · Academic Service</div>
          </>}

          {activeRail === 'config' && <>
            <div className="sb-panel-hdr">
              <div className="sb-panel-hdr-title">Module</div>
              <div className="sb-panel-hdr-name"><i className="lni lni-cog"></i> Configuration</div>
            </div>

            {sbSection('sc-config', 'Core Configuration', <>
              {sbItem('faculty-master', 'Faculty Master', 'library')}
              {sbItem('department-master', 'Department Master', 'briefcase')}
              {sbItem('designation-master', 'Designation Master', 'tag')}
              {sbItem('stream-master', 'Specialization', 'certificate')}
              {sbItem('skill', 'Skill Master', 'bulb')}
              {sbItem('ledger', 'Ledger Master', 'book')}
              {sbItem('campus-master', 'Campus Master', 'home')}
              {sbItem('currency-master', 'Currency Master', 'dollar')}
              {sbItem('country-master', 'Country Master', 'world')}
            </>)}

            <div className="sb-panel-footer">S0 · Core Config</div>
          </>}

        </div>
      </div>
    </div>
  )
}
