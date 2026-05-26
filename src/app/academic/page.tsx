'use client'
import { useState } from 'react'
import { DashboardPage, IntakeMasterPage, CourseUnitsPage, SkillMasterPage } from './components/pages-part1'
import { SessionMovementPage, AllocationPage, TimetablePage, CourseworkPage, ClassTestPage } from './components/pages-part2'
import { UniversityExamPage, ResultsPage, GrievancePage, OdlApplicationsPage, OdelStudentPreviewPage, OdlReconciliationPage, QualEquatingPage } from './components/pages-part3'
import { FacultyMasterPage, LecturerMasterPage, ALevelMasterPage, ProgrammeGroupPage, ProgrammeMasterPage } from './components/pages-part4'
import { BatchManagementPage, FeeStructurePage, AccessGatePage, StudentLookupPage, FeeClearancePage } from './components/pages-part5'
import { ModalsContainer } from './components/modals'

export default function AcademicPage() {
  const [currentPage, setCurrentPage] = useState('acad-dashboard')
  const [openModals, setOpenModals] = useState<Set<string>>(new Set())
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set())
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [odpTab, setOdpTab] = useState('personal')
  const [showFcResult, setShowFcResult] = useState(false)

  function nav(id: string) {
    setCurrentPage(id)
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  function openModal(id: string) {
    setOpenModals(prev => new Set(prev).add(id))
  }
  function closeModal(id: string) {
    setOpenModals(prev => { const s = new Set(prev); s.delete(id); return s })
  }
  function showToast(msg: string, type = '') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }
  function toggleCollapse(id: string) {
    setCollapsedSections(prev => {
      const s = new Set(prev)
      if (s.has(id)) s.delete(id); else s.add(id)
      return s
    })
  }

  const pageProps = { nav, openModal, closeModal, showToast, openModals }

  function renderPage() {
    switch (currentPage) {
      case 'acad-dashboard': return <DashboardPage {...pageProps} />
      case 'intake-master': return <IntakeMasterPage {...pageProps} />
      case 'course-units': return <CourseUnitsPage {...pageProps} />
      case 'skill-master': return <SkillMasterPage {...pageProps} />
      case 'session-movement': return <SessionMovementPage {...pageProps} />
      case 'allocation': return <AllocationPage {...pageProps} />
      case 'timetable': return <TimetablePage {...pageProps} />
      case 'coursework': return <CourseworkPage {...pageProps} />
      case 'class-test': return <ClassTestPage {...pageProps} />
      case 'university-exam': return <UniversityExamPage {...pageProps} />
      case 'results': return <ResultsPage {...pageProps} />
      case 'grievance': return <GrievancePage {...pageProps} />
      case 'odl-applications': return <OdlApplicationsPage {...pageProps} showPreview={showPreview} setShowPreview={setShowPreview} />
      case 'odel-student-preview': return <OdelStudentPreviewPage {...pageProps} odpTab={odpTab} setOdpTab={setOdpTab} />
      case 'odl-reconciliation': return <OdlReconciliationPage {...pageProps} />
      case 'qual-equating': return <QualEquatingPage {...pageProps} />
      case 'faculty-master': return <FacultyMasterPage {...pageProps} />
      case 'lecturer-master': return <LecturerMasterPage {...pageProps} />
      case 'a-level-master': return <ALevelMasterPage {...pageProps} />
      case 'programme-group': return <ProgrammeGroupPage {...pageProps} />
      case 'programme-master': return <ProgrammeMasterPage {...pageProps} />
      case 'batch-management': return <BatchManagementPage {...pageProps} />
      case 'fee-structure': return <FeeStructurePage {...pageProps} />
      case 'access-gate': return <AccessGatePage {...pageProps} />
      case 'student-lookup': return <StudentLookupPage {...pageProps} />
      case 'fee-clearance': return <FeeClearancePage {...pageProps} showFcResult={showFcResult} setShowFcResult={setShowFcResult} />
      default: return <DashboardPage {...pageProps} />
    }
  }

  function sbItem(id: string, label: string, icon: string, badge?: { text: string; warn?: boolean }) {
    return (
      <div
        className={`sb-item${currentPage === id ? ' active' : ''}`}
        onClick={() => nav(id)}
      >
        <span className="sb-icon"><i className={`lni lni-${icon}`}></i></span>
        {label}
        {badge && <span className={`sb-badge${badge.warn ? ' warn' : ''}`}>{badge.text}</span>}
      </div>
    )
  }

  function sbSection(id: string, label: string, children: React.ReactNode) {
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

  return (
    <>
      {/* Header */}
      <header className="hdr">
        <div className="hdr-brand bg-bg">
          <div className="hdr-badge">IU</div>
        </div>
        <div className="hdr-body">
          <div className="hdr-title-wrap">
            <div className="hdr-title">ISBAT University ERP</div>
            <div className="hdr-sub">Enterprise Resource Planning · Spring 2026</div>
          </div>
          <div className="hdr-right">
            <div className="hdr-module-pill acad"><i className="lni lni-graduation"></i> Academic</div>
            <div className="hdr-intake">Spring 2026 (20261)</div>
            <div className="hdr-user">
              <div className="hdr-avatar">AD</div>
              <span>Administrator</span>
            </div>
          </div>
        </div>
      </header>

      {/* Layout */}
      <div className="layout">

        {/* Sidebar */}
        <div className="sidebar">
          <div className="sb-rail bg-bg">
            <div className="rail-item active" data-mod="academic">
              <span className="rail-icon"><i className="lni lni-graduation"></i></span>
              <span className="rail-label">Academic</span>
              <span className="rail-dot"></span>
              <span className="rail-tooltip">Academic</span>
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
            <div className="rail-spacer"></div>
            <div className="rail-divider"></div>
            <div className="rail-item locked" data-mod="userrole">
              <span className="rail-icon"><i className="lni lni-cog"></i></span>
              <span className="rail-label">Admin</span>
              <span className="rail-tooltip">User &amp; Role · Coming Soon</span>
            </div>
          </div>

          <div className="sb-panel-shell open">
            <div className="sb-panel active">
              <div className="sb-panel-hdr">
                <div className="sb-panel-hdr-title">Module</div>
                <div className="sb-panel-hdr-name"><i className="lni lni-graduation"></i> Academic</div>
              </div>

              {sbSection('sc-overview', 'Overview', <>
                {sbItem('acad-dashboard', 'Dashboard', 'dashboard')}
              </>)}

              {sbSection('sc-core', 'Academic Core', <>
                {sbItem('intake-master', 'Intake Master', 'calendar')}
                {sbItem('faculty-master', 'Faculty Master', 'apartment')}
                {sbItem('lecturer-master', 'Lecturer Master', 'user')}
                {sbItem('skill-master', 'Skill Management', 'bulb')}
                {sbItem('batch-management', 'Batch Management', 'users')}
                {sbItem('session-movement', 'Session Movement', 'reload', { text: '1', warn: true })}
              </>)}

              {sbSection('sc-cu-master', 'Course Unit Master', <>
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
            </div>
          </div>
        </div>

        {/* Main content */}
        <main className="main panel-open">
          {renderPage()}
        </main>
      </div>

      {/* Toast notification */}
      {toast && (
        <div className={`toast${toast.type ? ' toast-' + toast.type : ''} show`}>
          {toast.msg}
        </div>
      )}

      {/* All modals */}
      <ModalsContainer
        openModals={openModals}
        closeModal={closeModal}
        showToast={showToast}
        nav={nav}
      />
    </>
  )
}
