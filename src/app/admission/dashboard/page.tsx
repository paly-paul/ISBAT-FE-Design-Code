'use client'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Toast } from '@/components/Toast'
import { ScrollTable } from '@/components/ScrollTable'
import { ActionMenu } from '@/components/ActionMenu'
import { Pagination } from '@/components/Pagination'
import { EmptyState } from '@/components/EmptyState'
import { TableLoadingState } from '@/components/TableLoadingState'
import { ViewApplicantModal } from '@/components/modals/admission/ViewApplicantModal'
import { useApplicants, ApplicantListItem, ApplicantStatus, ApplicationListItem } from '@/hooks/admission/useApplicationFiling'
import { useVettingQueue } from '@/hooks/admission/useVetting'
import { useRegistrarDeskApplications } from '@/hooks/admission/useRegistrarDesk'

const PAGE_SIZE = 6

const STATUS_BADGE: Record<ApplicantStatus, string> = {
  Waiting: 'badge-amber',
  Submitted: 'badge-blue',
  Vetted: 'badge-cyan',
  Rejected: 'badge-red',
  Registered: 'badge-green',
}

function renderApplicantStatus(a: ApplicantListItem) {
  if (!a.status) return <span className="badge badge-grey">—</span>
  return <span className={`badge ${STATUS_BADGE[a.status] ?? 'badge-grey'}`}>{a.status}</span>
}

function toModalRow(a: ApplicantListItem): ApplicationListItem {
  return {
    applicationGuid: a.applicationGuid,
    appRefNo: a.appRefNo,
    firstName: a.name,
    lastName: null,
    phone: a.phone,
    emailId: a.email,
    programName: a.programName,
    intakeCode: a.intakeCode,
    createdDate: a.applicationDate,
    actionLabel: a.status,
  } as ApplicationListItem
}

function timeAgo(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (isNaN(diff) || diff < 0) return 'recently'
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

const DONUT_DATA = [
  { label: 'Direct (Walk-in)', value: 9, pct: 39, color: '#2d448f' },
  { label: 'CRM (Merito)',     value: 6, pct: 26, color: '#3b82f6' },
  { label: 'ODel Online App.', value: 4, pct: 17, color: '#d97706' },
  { label: 'Online Enquiry',   value: 4, pct: 17, color: '#059669' },
]

const CONV_BARS = [
  { from: 'Enquiry',       to: 'App. Payment',  pct: 38, level: 'low'  as const, meta: '60 → 23 · 37 lost' },
  { from: 'App. Payment',  to: 'App. Filing',   pct: 87, level: 'high' as const, meta: '23 → 20 · 3 pending' },
  { from: 'App. Filing',   to: 'Vetting',       pct: 90, level: 'high' as const, meta: '20 → 18 · 2 pending' },
  { from: 'Vetting',       to: 'Reg. Payment',  pct: 89, level: 'high' as const, meta: '18 → 16 · 2 pending' },
  { from: 'Reg. Payment',  to: 'Active Student',pct: 88, level: 'high' as const, meta: '16 → 14 · 2 pending' },
]

function donutSegments() {
  const total = DONUT_DATA.reduce((s, d) => s + d.value, 0)
  const R = 45, C = 2 * Math.PI * R
  let offset = 0
  return DONUT_DATA.map(d => {
    const len = (d.value / total) * C
    const gap = 2
    const seg = { ...d, dashArray: `${len - gap} ${C - len + gap}`, dashOffset: -offset }
    offset += len
    return seg
  })
}

function ConvBar({ from, to, pct, level, meta }: { from: string; to: string; pct: number; level: 'high' | 'low'; meta: string }) {
  const isHigh = level === 'high'
  return (
    <div className="conv-item">
      <div className="conv-hdr">
        <span className="conv-from">{from} → {to}</span>
        <span className={`conv-pct ${isHigh ? 'conv-pct-high' : 'conv-pct-low'}`}>{pct}%</span>
      </div>
      <div className="conv-track">
        <div className={`conv-fill ${isHigh ? 'conv-fill-high' : 'conv-fill-low'}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="conv-meta">{meta}</span>
    </div>
  )
}

export default function DashboardPage() {
  const router = useRouter()
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)
  const [hoveredSrc, setHoveredSrc] = useState<string | null>(null)
  const [selectedApplicant, setSelectedApplicant] = useState<ApplicationListItem | null>(null)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)

  // Recent Applications (Task 2: from All Applicants page API)
  const [appsPage, setAppsPage] = useState(1)
  const { data: applicantsData, isLoading: isApplicantsLoading } = useApplicants(appsPage, PAGE_SIZE)
  const applicantItems = applicantsData?.items ?? []
  const applicantsTotalCount = applicantsData?.totalCount ?? 0
  const applicantsTotalPages = Math.max(1, Math.ceil(applicantsTotalCount / PAGE_SIZE))

  // Vetting Queue (Task 3: from Vetting Desk page API)
  const { data: vettingData, isLoading: isVettingLoading } = useVettingQueue(1, 5)

  // Ready to Register (Task 4: from Registrar Desk page API)
  const { data: regDeskData, isLoading: isRegDeskLoading } = useRegistrarDeskApplications(1, 5)

  const segments = donutSegments()

  function showToast(msg: string, type = '') { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }

  function openViewModal(applicant: ApplicantListItem) {
    setSelectedApplicant(toModalRow(applicant))
    setIsViewModalOpen(true)
  }

  return (
    <div id="page-dashboard">
      {/* Admission Progress */}
      <div className="card mb-6">
        <div className="card-hdr">
          <div>
            <div className="card-title">Admission Progress — Spring 2026 (20261)</div>
            <div className="card-sub">Application source mix + stage-to-stage conversion · 23 applicants, 14 active</div>
          </div>
          <button className="btn btn-primary" onClick={() => router.push('/admission/payment')}>
            <i className="lni lni-plus" /> New Application
          </button>
        </div>
        <div className="adm-chart-grid">
          {/* Left — donut chart */}
          <div className="adm-chart-col">
            <h3 className="adm-chart-title">Application Source Mix</h3>
            <p className="adm-chart-sub">How the 23 applicants reached the admission desk</p>
            <div className="donut-wrap">
              <div className="donut-svg-wrap">
                <svg viewBox="0 0 120 120" className="donut">
                  {segments.map(seg => (
                    <circle key={seg.label} className="donut-seg" cx="60" cy="60" r="45" fill="none"
                      stroke={seg.color} strokeWidth="18"
                      strokeDasharray={seg.dashArray} strokeDashoffset={seg.dashOffset}
                      onMouseEnter={() => setHoveredSrc(seg.label)}
                      onMouseLeave={() => setHoveredSrc(null)} />
                  ))}
                  <text x="60" y="55" className="donut-center-num" textAnchor="middle" dominantBaseline="middle">23</text>
                  <text x="60" y="70" className="donut-center-lbl" textAnchor="middle">APPLICANTS</text>
                </svg>
              </div>
              <div className="donut-legend">
                {DONUT_DATA.map(d => (
                  <div
                    key={d.label}
                    className={`donut-legend-item${hoveredSrc === d.label ? ' active' : ''}${hoveredSrc && hoveredSrc !== d.label ? ' dim' : ''}`}
                    onMouseEnter={() => setHoveredSrc(d.label)}
                    onMouseLeave={() => setHoveredSrc(null)}
                  >
                    <span className="donut-swatch" style={{ background: d.color }} />
                    <span className="donut-legend-lbl">{d.label}</span>
                    <span className="donut-legend-val">{d.value}</span>
                    <span className="donut-legend-pct">{d.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="donut-metrics">
              <div className="donut-metric">
                <div className="donut-metric-lbl">Counsellor-Driven</div>
                <div className="donut-metric-val">65%</div>
                <div className="donut-metric-sub">Direct + CRM</div>
              </div>
              <div className="donut-metric">
                <div className="donut-metric-lbl">Self-Service</div>
                <div className="donut-metric-val">35%</div>
                <div className="donut-metric-sub">ODel + Online</div>
              </div>
              <div className="donut-metric">
                <div className="donut-metric-lbl">Top Source</div>
                <div className="donut-metric-val">Direct</div>
                <div className="donut-metric-sub">9 applicants</div>
              </div>
            </div>
          </div>

          {/* Right — conversion bars */}
          <div className="adm-chart-col">
            <h3 className="adm-chart-title">Stage-to-Stage Conversion</h3>
            <p className="adm-chart-sub">Where applicants drop off — % moving forward each step</p>
            <div className="conv-list">
              {CONV_BARS.map(b => (
                <ConvBar key={b.from} from={b.from} to={b.to} pct={b.pct} level={b.level} meta={b.meta} />
              ))}
            </div>
            <div className="conv-summary">
              <div>
                <div className="conv-summary-lbl">Overall Conversion (Enquiry → Active)</div>
                <div className="conv-summary-meta">60 enquiries · 14 active students</div>
              </div>
              <span className="conv-summary-val">23%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Applications */}
      <div className="card mb-6">
        <div className="card-hdr">
          <div className="card-title">Recent Applications — Spring 2026</div>
          <div className="flex items-center gap-2">
            <button className="btn btn-neu btn-sm" onClick={() => router.push('/admission/applicants')}>View All</button>
            <button className="btn btn-primary btn-sm" onClick={() => router.push('/admission/payment')}>
              <i className="lni lni-plus" /> New
            </button>
          </div>
        </div>
        <ScrollTable>
          <table>
            <thead>
              <tr className="border-b border-g200 text-left text-g500 uppercase tracking-wider" style={{ fontSize: 'var(--fs-xs)' }}>
                <th style={{ width: 48 }}></th>
                <th className="pb-2 pr-4 font-medium">Ref No.</th>
                <th className="pb-2 pr-4 font-medium">Applicant Name</th>
                <th className="pb-2 pr-4 font-medium">Phone</th>
                <th className="pb-2 pr-4 font-medium">Programme</th>
                <th className="pb-2 pr-4 font-medium">Intake</th>
                <th className="pb-2 pr-4 font-medium">Status</th>
                <th className="pb-2 pr-4 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {isApplicantsLoading ? (
                <TableLoadingState colSpan={8} />
              ) : applicantItems.length === 0 ? (
                <EmptyState colSpan={8} hasFilters={false} title="No applications found" />
              ) : (
                applicantItems.map(app => (
                  <tr key={app.applicationGuid} className="border-b border-g100 hover:bg-g50 transition-colors">
                    <td>
                      <ActionMenu>
                        <button className="btn btn-neu btn-sm" onClick={() => openViewModal(app)}>
                          <i className="lni lni-eye" /> View
                        </button>
                        {app.status === 'Submitted' && (
                          <button className="btn btn-neu btn-sm" onClick={() => router.push('/admission/vetting')}>
                            Review →
                          </button>
                        )}
                        {app.status === 'Vetted' && (
                          <button className="btn btn-success btn-sm" onClick={() => router.push('/admission/registration')}>
                            Register →
                          </button>
                        )}
                        {app.studentGuid && (
                          <button className="btn btn-neu btn-sm" onClick={() => router.push('/student/profile?studentGuid=' + app.studentGuid)}>
                            <i className="lni lni-user" /> Student Profile
                          </button>
                        )}
                      </ActionMenu>
                    </td>
                    <td className="py-2.5 pr-4 font-mono text-b600" style={{ fontSize: 'var(--fs-xs)' }}>
                      <button type="button" className="hover:underline font-mono text-b600 text-left" onClick={() => openViewModal(app)}>
                        {app.appRefNo}
                      </button>
                    </td>
                    <td className="py-2.5 pr-4 text-g800 font-medium">
                      <button type="button" className="hover:underline text-g800 font-medium text-left" onClick={() => openViewModal(app)}>
                        {app.name || '—'}
                      </button>
                    </td>
                    <td className="py-2.5 pr-4 text-g600">{app.phone || '—'}</td>
                    <td className="py-2.5 pr-4 text-g700">{app.programName || '—'}</td>
                    <td className="py-2.5 pr-4 text-g600">{app.intakeCode || '—'}</td>
                    <td className="py-2.5 pr-4">{renderApplicantStatus(app)}</td>
                    <td className="py-2.5 pr-4 text-g500" style={{ fontSize: 'var(--fs-xs)' }}>
                      {app.applicationDate ? app.applicationDate.slice(0, 10) : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </ScrollTable>
        <Pagination page={appsPage} totalPages={applicantsTotalPages} totalCount={applicantsTotalCount} itemLabel="applications" onPageChange={setAppsPage} />
      </div>

      {/* Bottom panels */}
      <div className="g2">
        <div className="card">
          <div className="card-hdr">
            <div className="card-title">Vetting Queue ({vettingData?.totalCount ?? 0})</div>
            <button style={{ fontSize: 'var(--fs-xs)', color: 'var(--b500)', fontWeight: 600 }} onClick={() => router.push('/admission/vetting')}>Open →</button>
          </div>
          {isVettingLoading ? (
            <div className="p-4 text-center text-sm text-g400">Loading queue…</div>
          ) : (vettingData?.items ?? []).length === 0 ? (
            <div className="p-4 text-center text-sm text-g400">No applicants in vetting queue</div>
          ) : (
            <div className="timeline">
              {(vettingData?.items ?? []).map(item => {
                const isUrgent = (item.documentsUploaded ?? 0) < (item.documentsTotal ?? 0)
                return (
                  <div
                    key={item.applicationGuid || item.appRefNo}
                    className="tl-item cursor-pointer hover:bg-g50 p-1.5 rounded transition-colors"
                    onClick={() => router.push('/admission/vetting')}
                  >
                    <div className={`tl-dot ${isUrgent ? 'active' : ''}`}>
                      {isUrgent ? <i className="lni lni-warning" style={{ fontSize: 14 }} /> : null}
                    </div>
                    <div className="tl-content">
                      <div className="tl-label flex items-center justify-between">
                        <span className="font-medium text-g800">{item.studentName || item.appRefNo}</span>
                        <span className="text-xs text-g400 font-mono">{item.appRefNo}</span>
                      </div>
                      <div className="tl-meta">
                        {item.programName || '—'} · Docs {item.documentsUploaded ?? 0}/{item.documentsTotal ?? 0} · {timeAgo(item.submittedDate)}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-hdr">
            <div className="card-title">Ready to Register ({regDeskData?.totalCount ?? 0})</div>
            <button style={{ fontSize: 'var(--fs-xs)', color: 'var(--b500)', fontWeight: 600 }} onClick={() => router.push('/admission/registration')}>Open →</button>
          </div>
          {isRegDeskLoading ? (
            <div className="p-4 text-center text-sm text-g400">Loading queue…</div>
          ) : (regDeskData?.items ?? []).length === 0 ? (
            <div className="p-4 text-center text-sm text-g400">No applicants waiting to register</div>
          ) : (
            <div className="timeline">
              {(regDeskData?.items ?? []).map(item => (
                <div
                  key={item.applicationGuid || item.appRefNo}
                  className="tl-item cursor-pointer hover:bg-g50 p-1.5 rounded transition-colors"
                  onClick={() => router.push('/admission/registration')}
                >
                  <div className={`tl-dot ${item.regPaid ? 'done' : 'active'}`}>
                    {item.regPaid
                      ? <i className="lni lni-checkmark" style={{ fontSize: 14 }} />
                      : <i className="lni lni-warning" style={{ fontSize: 14 }} />}
                  </div>
                  <div className="tl-content">
                    <div className="tl-label flex items-center justify-between">
                      <span className="font-medium text-g800">{item.studentName || item.appRefNo}</span>
                      <span className="text-xs text-g400 font-mono">{item.appRefNo}</span>
                    </div>
                    <div className="tl-meta">
                      {item.programName || '—'} · Reg. fee{' '}
                      <span className={item.regPaid ? 'text-clr-green font-medium' : 'text-clr-amber font-medium'}>
                        {item.regPaid ? 'Paid' : 'Pending'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {isViewModalOpen && (
        <ViewApplicantModal
          isOpen={isViewModalOpen}
          onClose={() => {
            setIsViewModalOpen(false)
            setSelectedApplicant(null)
          }}
          applicant={selectedApplicant}
        />
      )}

      <Toast toast={toast} />
    </div>
  )
}

