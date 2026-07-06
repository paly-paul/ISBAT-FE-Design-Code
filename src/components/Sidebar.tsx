'use client'
import { Dispatch, SetStateAction, ReactNode } from 'react'
import { useRouter } from 'next/navigation'

export type RailId = 'admission' | 'academic' | 'student' | 'employee' | 'config'

interface SidebarProps {
  panelOpen: boolean
  setPanelOpen: Dispatch<SetStateAction<boolean>>
  currentPage: string
  collapsedSections: Set<string>
  toggleCollapse: (id: string) => void
  activeRail: RailId
  setActiveRail: Dispatch<SetStateAction<RailId>>
}

const ADMISSION_SECTIONS = [
  {
    id: 'sc-enq',
    label: 'Enquiry',
    items: [
      { id: 'online-enquiry',  label: 'Online Enquiry',     icon: 'display' },
      { id: 'kiosk-enquiry',   label: 'Self-Service Kiosk', icon: 'tab' },
      { id: 'ondesk-enquiry',  label: 'On-Desk Enquiry',    icon: 'pencil-alt' },
      { id: 'enquiry-list',    label: 'Enquiry List',       icon: 'folder',    badge: '8' },
      { id: 'enquiry-followup-master', label: 'Enquiry Followup Master', icon: 'calendar' },
      { id: 'enquiry-followup',        label: 'Enquiry Followup',        icon: 'phone', badgeWarn: '4' },
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
]

export function Sidebar({ panelOpen, setPanelOpen, currentPage, collapsedSections, toggleCollapse, activeRail, setActiveRail }: SidebarProps) {
  const router = useRouter()

  function navAdmission(id: string) { router.push('/admission/' + id) }
  function navAcademic(id: string) { router.push('/academic/' + id) }
  function navStudent(id: string) { router.push('/student/' + id) }
  function navEmployee(id: string) { router.push('/employee/' + id) }

  function sbItem(id: string, label: string, icon: string, badge?: { text: string; warn?: boolean }, prefix: 'academic' | 'student' | 'employee' = 'academic') {
    const go = prefix === 'student' ? navStudent : prefix === 'employee' ? navEmployee : navAcademic
    return (
      <div className={`sb-item${currentPage === id ? ' active' : ''}`} onClick={() => go(id)}>
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

  function clickRail(rail: RailId) {
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
        <div className={`rail-item${activeRail === 'admission' ? ' active' : ''}`} data-mod="admission" onClick={() => clickRail('admission')} style={{ cursor: 'pointer' }}>
          <span className="rail-icon"><i className="lni lni-clipboard"></i></span>
          <span className="rail-label">Admission</span>
          {activeRail === 'admission' && panelOpen && <span className="rail-dot"></span>}
          <span className="rail-tooltip">{panelOpen && activeRail === 'admission' ? 'Hide panel' : 'Admission'}</span>
        </div>
        <div className="rail-divider"></div>
        <div className={`rail-item${activeRail === 'academic' ? ' active' : ''}`} data-mod="academic" onClick={() => clickRail('academic')} style={{ cursor: 'pointer' }}>
          <span className="rail-icon"><i className="lni lni-graduation"></i></span>
          <span className="rail-label">Academic</span>
          {activeRail === 'academic' && panelOpen && <span className="rail-dot"></span>}
          <span className="rail-tooltip">{panelOpen && activeRail === 'academic' ? 'Hide panel' : 'Academic'}</span>
        </div>
        <div className="rail-divider"></div>
        <div className="rail-item" data-mod="finance">
          <span className="rail-icon"><i className="lni lni-dollar"></i></span>
          <span className="rail-label">Finance</span>
          <span className="rail-tooltip">Finance</span>
        </div>
        <div className={`rail-item${activeRail === 'student' ? ' active' : ''}`} data-mod="student" onClick={() => clickRail('student')} style={{ cursor: 'pointer' }}>
          <span className="rail-icon"><i className="lni lni-user"></i></span>
          <span className="rail-label">Student</span>
          {activeRail === 'student' && panelOpen && <span className="rail-dot"></span>}
          <span className="rail-tooltip">{panelOpen && activeRail === 'student' ? 'Hide panel' : 'Student'}</span>
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
        <div className={`rail-item${activeRail === 'employee' ? ' active' : ''}`} data-mod="employee" onClick={() => clickRail('employee')} style={{ cursor: 'pointer' }}>
          <span className="rail-icon"><i className="lni lni-briefcase"></i></span>
          <span className="rail-label">Employee</span>
          {activeRail === 'employee' && panelOpen && <span className="rail-dot"></span>}
          <span className="rail-tooltip">{panelOpen && activeRail === 'employee' ? 'Hide panel' : 'Employee'}</span>
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

          {activeRail === 'admission' && <>
            <div className="sb-panel-hdr">
              <div className="sb-panel-hdr-title">Module</div>
              <div className="sb-panel-hdr-name"><i className="lni lni-clipboard"></i> Admission</div>
            </div>

            {ADMISSION_SECTIONS.map(section => {
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
                        onClick={() => navAdmission(item.id)}
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
          </>}

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

          {activeRail === 'student' && <>
            <div className="sb-panel-hdr">
              <div className="sb-panel-hdr-title">Module</div>
              <div className="sb-panel-hdr-name"><i className="lni lni-user"></i> Student</div>
            </div>

            {sbSection('sc-student-core', 'Student Records', <>
              {sbItem('student-master', 'Student Master', 'graduation', undefined, 'student')}
            </>)}

            <div className="sb-panel-footer">S10 · Student Service</div>
          </>}

          {activeRail === 'employee' && <>
            <div className="sb-panel-hdr">
              <div className="sb-panel-hdr-title">Module</div>
              <div className="sb-panel-hdr-name"><i className="lni lni-briefcase"></i> Employee</div>
            </div>

            {sbSection('sc-employee-core', 'Employee Records', <>
              {sbItem('employee-master', 'Employee Master', 'user', undefined, 'employee')}
            </>)}

            <div className="sb-panel-footer">S4 · Employee Service</div>
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
              {sbItem('permission-master', 'Permission Master', 'lock')}
            </>)}

            <div className="sb-panel-footer">S0 · Core Config</div>
          </>}

        </div>
      </div>
    </div>
  )
}
