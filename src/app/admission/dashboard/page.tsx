
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
import { useAdmissionDashboard, AdmissionDashboard, AdmissionSourceMixEntry, AdmissionConversionStep } from '@/hooks/admission/useAdmissionDashboard'

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

// Up to two initials for the queue avatars ("MACHIRAJU NEELA" → "MN").
function initials(name: string | null | undefined): string {
  const parts = (name ?? '').trim().split(/\s+/).filter(p => /[a-z]/i.test(p))
  if (parts.length === 0) return '?'
  const first = parts[0][0]
  const last = parts.length > 1 ? parts[parts.length - 1][0] : ''
  return (first + last).toUpperCase()
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

// Keyed by sourceMix source number; the API sends the label in `name`.
const SOURCE_COLORS: Record<number, string> = {
  1: 'var(--adm-ink)', // Direct (Walk-in)
  2: 'var(--adm-mist)', // CRM (Merito)
  3: 'var(--adm-ochre)', // ODel Online App
  4: 'var(--adm-sage)', // Online Enquiry
  5: 'var(--adm-stone)', // Other
}

// How the API buckets each applicant, for the legend tooltips.
const SOURCE_HINTS: Record<number, string> = {
  1: 'Enquiry source Direct, FrontDesk or Self Kiosk, or no enquiry',
  2: 'Not identified yet — always 0 for now',
  3: 'Application came from the ODel system',
  4: 'Enquiry source Website, Facebook, Twitter, Instagram or WhatsApp',
  5: 'Any other enquiry source',
}

// conversion fromStage/toStage numbers
const STAGE_LABELS: Record<number, string> = {
  1: 'Enquiry',
  2: 'App. Payment',
  3: 'App. Filing',
  4: 'Vetting',
  5: 'Reg. Payment',
  6: 'Active Student',
}

// Step tone by its percent: green from 80, amber from 50, red below.
function stepTone(percent: number) {
  if (percent >= 80) return 'tone-strong'
  if (percent >= 50) return 'tone-fair'
  return 'tone-weak'
}

const fmtCount = (n: number) => n.toLocaleString('en-US')
const sourceColor = (source: number) => SOURCE_COLORS[source] ?? SOURCE_COLORS[5]

// Zero-count sources stay in the legend but get no slice. Starts at 12
// o'clock; a small gap separates slices when there's more than one.
const DONUT_R = 46
function donutSegments(sources: AdmissionSourceMixEntry[]) {
  const drawn = sources.filter(s => s.count > 0)
  const total = drawn.reduce((sum, s) => sum + s.count, 0)
  const C = 2 * Math.PI * DONUT_R
  const gap = drawn.length > 1 ? 1.5 : 0
  let offset = 0
  return drawn.map(s => {
    const len = (s.count / total) * C
    const dash = Math.max(len - gap, 0.6)
    const seg = { ...s, color: sourceColor(s.source), dashArray: `${dash} ${C - dash}`, dashOffset: -offset }
    offset += len
    return seg
  })
}

function ConvBar({ step, isFirst, index }: { step: AdmissionConversionStep; isFirst: boolean; index: number }) {
  const from = STAGE_LABELS[step.fromStage] ?? `Stage ${step.fromStage}`
  const to = STAGE_LABELS[step.toStage] ?? `Stage ${step.toStage}`
  return (
    <li className={`conv-item ${stepTone(step.percent)}${isFirst ? ' is-lost' : ''}`}>
      <div className="conv-hdr">
        <span className="conv-from">{from} → {to}</span>
        <span className="conv-meta">
          {fmtCount(step.fromCount)} → {fmtCount(step.toCount)} ·{' '}
          <strong className={isFirst && step.remaining > 0 ? 'is-lost' : undefined}>
            {fmtCount(step.remaining)} {isFirst ? 'lost' : 'pending'}
          </strong>
        </span>
        <span className="conv-pct">{step.percent}%</span>
      </div>
      <div className="conv-track" role="img" aria-label={`${from} to ${to}: ${step.percent}%`}>
        <div className="conv-fill" style={{ width: `${step.percent}%`, ['--i' as string]: index }} />
      </div>
    </li>
  )
}

function ProgressSkeleton() {
  return (
    <div className="adm-chart-grid" aria-busy="true" aria-label="Loading admission progress">
      <div className="adm-chart-col">
        <span className="adm-skel" style={{ width: 170, height: 13 }} />
        <span className="adm-skel" style={{ width: 240, height: 10, margin: '8px 0 20px' }} />
        <div className="adm-mix">
          <span className="adm-skel adm-skel-ring" />
          <div className="adm-skel-rows">
            {[0, 1, 2, 3].map(i => <span key={i} className="adm-skel" style={{ height: 14 }} />)}
          </div>
        </div>
        <span className="adm-skel" style={{ height: 64, marginTop: 20, borderRadius: 'var(--rsm)' }} />
      </div>
      <div className="adm-chart-col">
        <span className="adm-skel" style={{ width: 190, height: 13 }} />
        <span className="adm-skel" style={{ width: 260, height: 10, margin: '8px 0 20px' }} />
        <div className="adm-skel-rows" style={{ gap: 22 }}>
          {[0, 1, 2, 3, 4].map(i => <span key={i} className="adm-skel" style={{ height: 22 }} />)}
        </div>
        <span className="adm-skel" style={{ height: 78, marginTop: 20, borderRadius: 'var(--rsm)' }} />
      </div>
    </div>
  )
}

function dashboardTitle(d: AdmissionDashboard | undefined) {
  if (!d) return 'Admission Progress'
  return d.intakeName ? `Admission Progress — ${d.intakeName} (${d.intakeCode})` : `Admission Progress — ${d.intakeCode}`
}

export default function DashboardPage() {
  const router = useRouter()
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)
  const [hoveredSrc, setHoveredSrc] = useState<number | null>(null)
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

  // Admission Progress card: the current admission intake
  const { data: dashboard, isLoading: isDashboardLoading, error: dashboardError } = useAdmissionDashboard()
  const sourceMix = dashboard?.sourceMix
  const conversion = dashboard?.conversion
  const segments = sourceMix ? donutSegments(sourceMix.sources) : []
  const noOpenIntake = dashboardError?.message?.toLowerCase().includes('no active admission intake') ?? false
  // The hovered source swaps into the donut centre, in place of the total.
  const hoveredEntry = sourceMix?.sources.find(s => s.source === hoveredSrc) ?? null

  function showToast(msg: string, type = '') { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }

  function openViewModal(applicant: ApplicantListItem) {
    setSelectedApplicant(toModalRow(applicant))
    setIsViewModalOpen(true)
  }

  return (
    <div id="page-dashboard">
      <div className="pg-hdr">
        <div>
          <div className="pg-title">Admission Dashboard</div>
          <div className="pg-sub">Where applicants come from, how they move through admission, and who is waiting on you</div>
        </div>
        <button className="btn btn-primary" onClick={() => router.push('/admission/payment')}>
          <i className="lni lni-plus" /> New Application
        </button>
      </div>

      {/* Admission Progress */}
      <section className="card mb-6" aria-labelledby="adm-progress-title">
        <div className="card-hdr">
          <div>
            <h2 id="adm-progress-title" className="card-title">{dashboardTitle(dashboard)}</h2>
            {sourceMix && conversion && (
              <div className="card-sub">
                Application source mix + stage-to-stage conversion · {fmtCount(sourceMix.totalApplicants)} applicants, {fmtCount(conversion.activeStudentCount)} active
              </div>
            )}
          </div>
          {dashboard && <span className="adm-intake-chip">Current intake</span>}
        </div>
        {isDashboardLoading ? (
          <ProgressSkeleton />
        ) : !sourceMix || !conversion ? (
          <div className={`adm-state${noOpenIntake ? '' : ' is-error'}`} role={noOpenIntake ? undefined : 'alert'}>
            <span className="adm-state-ic" aria-hidden="true">
              <i className={`lni ${noOpenIntake ? 'lni-calendar' : 'lni-warning'}`} />
            </span>
            <div className="adm-state-title">{noOpenIntake ? 'No admission intake is open' : 'Admission progress couldn’t load'}</div>
            <div className="adm-state-sub">
              {noOpenIntake
                ? 'Progress appears here once an intake is set as the current admission intake.'
                : dashboardError?.message || 'The dashboard service didn’t return any data.'}
            </div>
          </div>
        ) : (
        <div className="adm-chart-grid">
          {/* Left — source mix */}
          <div className="adm-chart-col">
            <h3 className="adm-chart-title">Application Source Mix</h3>
            <p className="adm-chart-sub">How the {fmtCount(sourceMix.totalApplicants)} applicants reached the admission desk</p>
            <div className="adm-mix">
              <div className="donut-svg-wrap">
                <svg viewBox="0 0 120 120" className={`donut${hoveredEntry ? ' has-focus' : ''}`} role="img"
                  aria-label={`${fmtCount(sourceMix.totalApplicants)} applicants by source`}>
                  <circle className="donut-track" cx="60" cy="60" r={DONUT_R} fill="none" strokeWidth="14" />
                  <g transform="rotate(-90 60 60)">
                    {segments.map(seg => (
                      <circle key={seg.source} className={`donut-seg${hoveredSrc === seg.source ? ' is-on' : ''}`}
                        cx="60" cy="60" r={DONUT_R} fill="none" stroke={seg.color} strokeWidth="14"
                        strokeDasharray={seg.dashArray} strokeDashoffset={seg.dashOffset}
                        onMouseEnter={() => setHoveredSrc(seg.source)}
                        onMouseLeave={() => setHoveredSrc(null)} />
                    ))}
                  </g>
                  <text x="60" y="57" className="donut-center-num" textAnchor="middle" dominantBaseline="middle">
                    {fmtCount(hoveredEntry ? hoveredEntry.count : sourceMix.totalApplicants)}
                  </text>
                  <text x="60" y="71" className="donut-center-lbl" textAnchor="middle">
                    {hoveredEntry ? `${hoveredEntry.percent}% OF TOTAL` : 'APPLICANTS'}
                  </text>
                </svg>
              </div>
              <ul className="donut-legend">
                {sourceMix.sources.map(s => (
                  <li
                    key={s.source}
                    title={SOURCE_HINTS[s.source]}
                    className={`donut-legend-item${s.count === 0 ? ' is-zero' : ''}${hoveredSrc === s.source ? ' active' : ''}${hoveredSrc != null && hoveredSrc !== s.source ? ' dim' : ''}`}
                    onMouseEnter={() => setHoveredSrc(s.source)}
                    onMouseLeave={() => setHoveredSrc(null)}
                  >
                    <span className="donut-swatch" style={{ background: sourceColor(s.source) }} />
                    <span className="donut-legend-lbl">{s.name}</span>
                    <span className="donut-legend-val">{fmtCount(s.count)}</span>
                    <span className="donut-legend-pct">{s.percent}%</span>
                    <span className="donut-legend-bar" aria-hidden="true">
                      <span style={{ width: `${s.percent}%`, background: sourceColor(s.source) }} />
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="adm-metrics">
            <div className="adm-split" aria-hidden="true">
              <span style={{ width: `${sourceMix.counsellorDrivenPercent}%`, background: 'var(--adm-ink)' }} />
              <span style={{ width: `${sourceMix.selfServicePercent}%`, background: 'var(--adm-sage)' }} />
            </div>
            <div className={`donut-metrics${sourceMix.topSource ? '' : ' is-two'}`}>
              <div className="donut-metric">
                <div className="donut-metric-lbl"><span className="donut-swatch" style={{ background: 'var(--adm-ink)' }} />Counsellor-Driven</div>
                <div className="donut-metric-val">{sourceMix.counsellorDrivenPercent}%</div>
                <div className="donut-metric-sub">Direct + CRM</div>
              </div>
              <div className="donut-metric">
                <div className="donut-metric-lbl"><span className="donut-swatch" style={{ background: 'var(--adm-sage)' }} />Self-Service</div>
                <div className="donut-metric-val">{sourceMix.selfServicePercent}%</div>
                <div className="donut-metric-sub">ODel + Online</div>
              </div>
              {sourceMix.topSource && (
                <div className="donut-metric">
                  <div className="donut-metric-lbl"><span className="donut-swatch" style={{ background: sourceColor(sourceMix.topSource.source) }} />Top Source</div>
                  <div className="donut-metric-val is-text">{sourceMix.topSource.name}</div>
                  <div className="donut-metric-sub">{fmtCount(sourceMix.topSource.count)} applicants</div>
                </div>
              )}
            </div>
            </div>
          </div>

          {/* Right — conversion bars */}
          <div className="adm-chart-col">
            <h3 className="adm-chart-title">Stage-to-Stage Conversion</h3>
            <p className="adm-chart-sub">Where applicants drop off — % moving forward each step</p>
            <ol className="conv-list">
              {conversion.steps.map((step, i) => (
                <ConvBar key={`${step.fromStage}-${step.toStage}`} step={step} isFirst={i === 0} index={i} />
              ))}
            </ol>
            <div className="conv-summary">
              <div>
                <div className="conv-summary-lbl">Overall Conversion (Enquiry → Active)</div>
                <div className="conv-summary-meta">{fmtCount(conversion.enquiryCount)} enquiries · {fmtCount(conversion.activeStudentCount)} active students</div>
              </div>
              <span className="conv-summary-val">{conversion.overallPercent}%</span>
              <span className="conv-summary-track" aria-hidden="true">
                <span style={{ width: `${conversion.overallPercent}%` }} />
              </span>
            </div>
          </div>
        </div>
        )}
      </section>

      {/* Recent Applications */}
      <div className="card mb-6">
        <div className="card-hdr">
          <div>
            <div className="card-title">Recent Applications</div>
            <div className="card-sub">Newest applications across all intakes</div>
          </div>
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
        <div className="card adm-queue">
          <div className="card-hdr">
            <div className="card-title">Vetting Queue <span className="adm-count">{vettingData?.totalCount ?? 0}</span></div>
            <button className="btn btn-neu btn-sm" onClick={() => router.push('/admission/vetting')}>
              Open <i className="lni lni-arrow-right" />
            </button>
          </div>
          {isVettingLoading ? (
            <div className="adm-queue-state">Loading queue…</div>
          ) : (vettingData?.items ?? []).length === 0 ? (
            <div className="adm-queue-state">No applicants in vetting queue</div>
          ) : (
            <ul className="adm-qlist">
              {(vettingData?.items ?? []).map(item => {
                const uploaded = item.documentsUploaded ?? 0
                const total = item.documentsTotal ?? 0
                const complete = total > 0 && uploaded >= total
                return (
                  <li
                    key={item.applicationGuid || item.appRefNo}
                    className="adm-qrow"
                    role="link"
                    tabIndex={0}
                    onClick={() => router.push('/admission/vetting')}
                    onKeyDown={e => { if (e.key === 'Enter') router.push('/admission/vetting') }}
                  >
                    <span className="adm-avatar" aria-hidden="true">{initials(item.studentName || item.appRefNo)}</span>
                    <div className="adm-qmain">
                      <div className="adm-qname">
                        <span>{item.studentName || item.appRefNo}</span>
                        <span className="adm-qref">{item.appRefNo}</span>
                      </div>
                      <div className="adm-qprog" title={item.programName || undefined}>{item.programName || '—'}</div>
                    </div>
                    <div className="adm-qside">
                      <span className={`adm-docs${complete ? ' is-complete' : ''}`}>
                        <span className="adm-docs-txt">Docs {uploaded}/{total}</span>
                        <span className="adm-docs-bar" aria-hidden="true">
                          <span style={{ width: `${total > 0 ? Math.min(100, (uploaded / total) * 100) : 0}%` }} />
                        </span>
                      </span>
                      <span className="adm-qtime">{timeAgo(item.submittedDate)}</span>
                    </div>
                    <i className="lni lni-chevron-right adm-qchev" aria-hidden="true" />
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <div className="card adm-queue">
          <div className="card-hdr">
            <div className="card-title">Ready to Register <span className="adm-count">{regDeskData?.totalCount ?? 0}</span></div>
            <button className="btn btn-neu btn-sm" onClick={() => router.push('/admission/registration')}>
              Open <i className="lni lni-arrow-right" />
            </button>
          </div>
          {isRegDeskLoading ? (
            <div className="adm-queue-state">Loading queue…</div>
          ) : (regDeskData?.items ?? []).length === 0 ? (
            <div className="adm-queue-state">No applicants waiting to register</div>
          ) : (
            <ul className="adm-qlist">
              {(regDeskData?.items ?? []).map(item => (
                <li
                  key={item.applicationGuid || item.appRefNo}
                  className="adm-qrow"
                  role="link"
                  tabIndex={0}
                  onClick={() => router.push('/admission/registration')}
                  onKeyDown={e => { if (e.key === 'Enter') router.push('/admission/registration') }}
                >
                  <span className="adm-avatar" aria-hidden="true">{initials(item.studentName || item.appRefNo)}</span>
                  <div className="adm-qmain">
                    <div className="adm-qname">
                      <span>{item.studentName || item.appRefNo}</span>
                      <span className="adm-qref">{item.appRefNo}</span>
                    </div>
                    <div className="adm-qprog" title={item.programName || undefined}>{item.programName || '—'}</div>
                  </div>
                  <div className="adm-qside">
                    <span className={`adm-fee${item.regPaid ? ' is-paid' : ''}`}>
                      <i className={`lni ${item.regPaid ? 'lni-checkmark-circle' : 'lni-timer'}`} aria-hidden="true" />
                      {item.regPaid ? 'Paid' : 'Pending'}
                    </span>
                    <span className="adm-qtime">Reg. fee</span>
                  </div>
                  <i className="lni lni-chevron-right adm-qchev" aria-hidden="true" />
                </li>
              ))}
            </ul>
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

