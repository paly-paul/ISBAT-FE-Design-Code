'use client'
import { Dispatch, SetStateAction, ReactNode, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export type RailId = 'admission' | 'academic' | 'finance' | 'student' | 'employee' | 'config'

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

// Kept in sync with the item ids rendered below — used only to warm the
// route cache on mount so a sidebar click doesn't wait on a cold chunk/RSC
// fetch. The sidebar uses div+onClick (not next/link), so none of these get
// Next's automatic viewport-based prefetch otherwise.
const ADMISSION_IDS = ADMISSION_SECTIONS.flatMap(s => s.items.map(i => i.id))
const ACADEMIC_IDS = ['acad-dashboard', 'intake-master', 'skill-master', 'batch-management', 'room-management', 'session-movement', 'repetition-tag', 'course-units', 'programme-level', 'programme-group', 'programme-master', 'fee-structure', 'timetable', 'odl-applications', 'odl-reconciliation', 'student-lookup']
const FINANCE_IDS = ['cooperates', 'discounts', 'ledgers', 'currency-master', 'receipt-books', 'gen-sets', 'banks', 'bank-branches', 'proc-banks', 'proc-gl-accounts']
const STUDENT_IDS = ['student-master']
const EMPLOYEE_IDS = ['employee-master']
const CONFIG_IDS = ['faculty-master', 'department-master', 'designation-master', 'specialization', 'skill', 'campus-master', 'country-master', 'permission-master', 'enquiry-status', 'enquiry-source', 'enquiry-source-master', 'followup-status', 'followup-mode', 'interest-level', 'weekdays', 'unit-type', 'unit-category']

export function Sidebar({ panelOpen, setPanelOpen, currentPage, collapsedSections, toggleCollapse, activeRail, setActiveRail }: SidebarProps) {
  const router = useRouter()

  // Warm every module route once on mount so navigation is instant regardless
  // of which rail the user switches to first.
  useEffect(() => {
    ADMISSION_IDS.forEach(id => router.prefetch(`/admission/${id}`))
    ACADEMIC_IDS.forEach(id => router.prefetch(`/academic/${id}`))
    FINANCE_IDS.forEach(id => router.prefetch(`/finance/${id}`))
    STUDENT_IDS.forEach(id => router.prefetch(`/student/${id}`))
    EMPLOYEE_IDS.forEach(id => router.prefetch(`/employee/${id}`))
    CONFIG_IDS.forEach(id => router.prefetch(`/config/${id}`))
  }, [router])

  function sbItem(id: string, label: string, icon: string, badge?: { text: string; warn?: boolean }, prefix: 'academic' | 'finance' | 'student' | 'employee' | 'config' = 'academic') {
    const href = `/${prefix}/${id}`
    return (
      <Link href={href} className={`sb-item${currentPage === id ? ' active' : ''}`}>
        <span className="sb-icon"><i className={`lni lni-${icon}`}></i></span>
        {label}
        {badge && <span className={`sb-badge${badge.warn ? ' warn' : ''}`}>{badge.text}</span>}
      </Link>
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
        <div className={`rail-item${activeRail === 'finance' ? ' active' : ''}`} data-mod="finance" onClick={() => clickRail('finance')} style={{ cursor: 'pointer' }}>
          <span className="rail-icon"><i className="lni lni-dollar"></i></span>
          <span className="rail-label">Finance</span>
          {activeRail === 'finance' && panelOpen && <span className="rail-dot"></span>}
          <span className="rail-tooltip">{panelOpen && activeRail === 'finance' ? 'Hide panel' : 'Finance'}</span>
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
                      <Link
                        key={item.id}
                        href={`/admission/${item.id}`}
                        className={`sb-item${currentPage === item.id ? ' active' : ''}`}
                      >
                        <span className="sb-icon"><i className={`lni lni-${item.icon}`}></i></span>
                        {item.label}
                        {'badge' in item && item.badge && <span className="sb-badge">{item.badge}</span>}
                        {'badgeWarn' in item && item.badgeWarn && <span className="sb-badge warn">{item.badgeWarn}</span>}
                        {'badgeGreen' in item && item.badgeGreen && <span className="sb-badge green">{item.badgeGreen}</span>}
                      </Link>
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
              {sbItem('programme-level', 'Programme Level', 'layers')}
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

          {activeRail === 'finance' && <>
            <div className="sb-panel-hdr">
              <div className="sb-panel-hdr-title">Module</div>
              <div className="sb-panel-hdr-name"><i className="lni lni-dollar"></i> Finance</div>
            </div>

            {sbSection('sc-finance-core', 'Finance Core', <>
              {sbItem('cooperates', 'Cooperates', 'handshake', undefined, 'finance')}
              {sbItem('discounts', 'Discounts', 'tag', undefined, 'finance')}
              {sbItem('ledgers', 'Ledgers', 'book', undefined, 'finance')}
              {sbItem('currency-master', 'Currency Master', 'dollar', undefined, 'finance')}
              {sbItem('receipt-books', 'Receipt Books', 'ticket', undefined, 'finance')}
              {sbItem('gen-sets', 'General Settings', 'cog', undefined, 'finance')}
            </>)}

            {sbSection('sc-finance-banking', 'Banking', <>
              {sbItem('banks', 'Banks', 'coin', undefined, 'finance')}
              {sbItem('bank-branches', 'Bank Branches', 'map-marker', undefined, 'finance')}
              {sbItem('proc-banks', 'Proc Banks', 'wallet', undefined, 'finance')}
              {sbItem('proc-gl-accounts', 'Proc GL Accounts', 'calculator', undefined, 'finance')}
            </>)}

            <div className="sb-panel-footer">S5 · Finance Service</div>
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

            {sbSection('sc-config-org', 'Organization', <>
              {sbItem('faculty-master', 'Faculty Master', 'library', undefined, 'config')}
              {sbItem('department-master', 'Department Master', 'briefcase', undefined, 'config')}
              {sbItem('designation-master', 'Designation Master', 'tag', undefined, 'config')}
              {sbItem('campus-master', 'Campus Master', 'home', undefined, 'config')}
              {sbItem('country-master', 'Country Master', 'world', undefined, 'config')}
            </>)}

            {sbSection('sc-config-academic', 'Academic Setup', <>
              {sbItem('specialization', 'Specialization', 'certificate', undefined, 'config')}
              {sbItem('skill', 'Skill Master', 'bulb', undefined, 'config')}
              {sbItem('unit-type', 'Unit Type Master', 'tag', undefined, 'config')}
              {sbItem('unit-category', 'Unit Category Master', 'tag', undefined, 'config')}
              {sbItem('weekdays', 'Weekdays', 'calendar', undefined, 'config')}
            </>)}

            {sbSection('sc-config-admissions', 'Admissions', <>
              {sbItem('enquiry-status', 'Enquiry Status', 'flag', undefined, 'config')}
              {sbItem('enquiry-source', 'Isbat Enquiry Source', 'compass', undefined, 'config')}
              {sbItem('enquiry-source-master', 'Enquiry Source', 'volume', undefined, 'config')}
              {sbItem('followup-status', 'Followup Status', 'phone', undefined, 'config')}
              {sbItem('followup-mode', 'Followup Mode', 'comments', undefined, 'config')}
              {sbItem('interest-level', 'Interest Level', 'signal', undefined, 'config')}
            </>)}

            {sbSection('sc-config-access', 'Access Control', <>
              {sbItem('permission-master', 'Permission Master', 'lock', undefined, 'config')}
            </>)}

            <div className="sb-panel-footer">S0 · Core Config</div>
          </>}

        </div>
      </div>

      <button
        className="sb-toggle"
        onClick={() => setPanelOpen(p => !p)}
        aria-label={panelOpen ? 'Collapse menu' : 'Expand menu'}
      >
        <i className={`lni ${panelOpen ? 'lni-chevron-left' : 'lni-chevron-right'}`}></i>
      </button>
    </div>
  )
}
