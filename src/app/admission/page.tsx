'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Toast } from '@/components/Toast'
import { DashboardPage } from './components/pages-part1'
import { PaymentPage } from './components/pages-part2'
import { FilingPage } from './components/pages-part3'
import { VettingPage } from './components/pages-part4'
import { RegistrationPage, ApplicantsPage } from './components/pages-part5'
import { EnquiryFormPage, EnquiryListPage, OnlineEnquiryPage, KioskEnquiryPage, OnDeskEnquiryPage } from './components/pages-part6'
import {
  StudentProfileModal,
  ImportSourceModal,
  EnquiryFormModal,
  RejectModal,
  OnboardModal,
} from './components/modals'

export interface PageProps {
  nav: (id: string) => void
  openModal: (id: string) => void
  closeModal: (id: string) => void
  showToast: (msg: string, type?: string) => void
  openModals: Set<string>
}

const SIDEBAR_SECTIONS = [
  {
    id: 'sc-enq',
    label: 'Enquiry',
    items: [
      { id: 'online-enquiry', label: 'Online Enquiry', icon: 'display' },
      { id: 'kiosk-enquiry', label: 'Self-Service Kiosk', icon: 'tab' },
      { id: 'ondesk-enquiry', label: 'On-Desk Enquiry', icon: 'pencil-alt' },
      { id: 'enquiry-list', label: 'Enquiry List', icon: 'folder', badge: '8' },
    ],
  },
  {
    id: 'sc-adm-flow',
    label: 'Admission Flow',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
      { id: 'payment', label: 'Application Payment', icon: 'credit-cards', badge: '12' },
      { id: 'filing', label: 'Application Filing', icon: 'pencil-alt', badgeWarn: '7' },
      { id: 'vetting', label: 'Vetting Desk', icon: 'search-alt', badgeWarn: '5' },
      { id: 'registration', label: "Registrar's Desk", icon: 'graduation', badgeGreen: '3' },
    ],
  },
  {
    id: 'sc-adm-rec',
    label: 'Records',
    items: [
      { id: 'applicants', label: 'All Applicants', icon: 'users' },
      { id: 'receipts', label: 'Receipts', icon: 'files' },
      { id: 'reports', label: 'Reports', icon: 'bar-chart' },
    ],
  },
  {
    id: 'sc-adm-set',
    label: 'Settings',
    items: [
      { id: 'programmes', label: 'Programmes', icon: 'apartment' },
      { id: 'fee-structures', label: 'Fee Structures', icon: 'dollar' },
    ],
  },
  {
    id: 'sc-adm-online',
    label: 'Online Preview',
    items: [
      { id: 'odel-student-preview', label: 'ODel Student Preview', icon: 'world' },
    ],
  },
]

export default function AdmissionPage() {
  const router = useRouter()
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [panelOpen, setPanelOpen] = useState(true)
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set())
  const [openModals, setOpenModals] = useState<Set<string>>(new Set())
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)
  const [profileOpen, setProfileOpen] = useState(false)

  function nav(id: string) { setCurrentPage(id) }
  function openModal(id: string) { setOpenModals(prev => new Set(prev).add(id)) }
  function closeModal(id: string) { setOpenModals(prev => { const s = new Set(prev); s.delete(id); return s }) }
  function showToast(msg: string, type = '') { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }

  function toggleCollapse(id: string) {
    setCollapsedSections(prev => {
      const s = new Set(prev)
      if (s.has(id)) s.delete(id); else s.add(id)
      return s
    })
  }

  const pageProps: PageProps = { nav, openModal, closeModal, showToast, openModals }

  return (
    <>
      {/* Header */}
      <header className="header">
        <div className="hdr-left">
          <button className="hdr-toggle" onClick={() => setPanelOpen(p => !p)}>
            <i className="lni lni-menu"></i>
          </button>
          <div className="hdr-brand">ISBAT University ERP</div>
        </div>
        <div className="hdr-right">
          <div className="hdr-notif"><i className="lni lni-alarm"></i><span className="hdr-notif-dot"></span></div>
          <div className="hdr-profile" onClick={() => setProfileOpen(p => !p)}>
            <div className="hdr-avatar">AD</div>
            <span className="hdr-name">Admission Desk</span>
            <i className="lni lni-chevron-down" style={{ fontSize: '10px' }}></i>
          </div>
          {profileOpen && (
            <div className="profile-dropdown">
              <div className="profile-dropdown-item" onClick={() => { setProfileOpen(false); router.push('/') }}>
                <i className="lni lni-exit"></i> Sign Out
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="layout">
        {/* Sidebar */}
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
              { mod: 'finance', icon: 'dollar', label: 'Finance' },
              { mod: 'attendance', icon: 'alarm-clock', label: 'Attendance' },
              { mod: 'analytics', icon: 'bar-chart', label: 'Analytics' },
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
                          {item.badge && <span className="sb-badge">{item.badge}</span>}
                          {item.badgeWarn && <span className="sb-badge warn">{item.badgeWarn}</span>}
                          {item.badgeGreen && <span className="sb-badge green">{item.badgeGreen}</span>}
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

        {/* Main Content */}
        <main className={`main${panelOpen ? ' panel-open' : ''}`}>
          {currentPage === 'dashboard' && <DashboardPage {...pageProps} />}
          {currentPage === 'payment' && <PaymentPage {...pageProps} />}
          {currentPage === 'filing' && <FilingPage {...pageProps} />}
          {currentPage === 'vetting' && <VettingPage {...pageProps} />}
          {currentPage === 'registration' && <RegistrationPage {...pageProps} />}
          {currentPage === 'applicants' && <ApplicantsPage {...pageProps} />}
          {currentPage === 'enquiry-form' && <EnquiryFormPage {...pageProps} />}
          {currentPage === 'enquiry-list' && <EnquiryListPage {...pageProps} />}
          {currentPage === 'online-enquiry' && <OnlineEnquiryPage {...pageProps} />}
          {currentPage === 'kiosk-enquiry' && <KioskEnquiryPage {...pageProps} />}
          {currentPage === 'ondesk-enquiry' && <OnDeskEnquiryPage {...pageProps} />}

          {/* Modals */}
          <StudentProfileModal isOpen={openModals.has('student-profile-modal')} onClose={() => closeModal('student-profile-modal')} showToast={showToast} nav={nav} />
          <ImportSourceModal isOpen={openModals.has('import-source-modal')} onClose={() => closeModal('import-source-modal')} showToast={showToast} nav={nav} />
          <EnquiryFormModal isOpen={openModals.has('enquiry-form-modal')} onClose={() => closeModal('enquiry-form-modal')} showToast={showToast} nav={nav} />
          <RejectModal isOpen={openModals.has('reject-modal')} onClose={() => closeModal('reject-modal')} showToast={showToast} nav={nav} />
          <OnboardModal isOpen={openModals.has('onboard-modal')} onClose={() => closeModal('onboard-modal')} showToast={showToast} nav={nav} />
        </main>
      </div>

      <Toast toast={toast} />
    </>
  )
}
