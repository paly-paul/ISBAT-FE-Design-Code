'use client'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Toast } from '@/components/Toast'
import { ScrollTable } from '@/components/ScrollTable'
import { TableSearch } from '@/components/TableSearch'
import { SearchSelect } from '@/components/SearchSelect'
import { InfiniteSearchSelect } from '@/components/InfiniteSearchSelect'
import { EmptyState } from '@/components/EmptyState'
import { TableLoadingState } from '@/components/TableLoadingState'
import { Pagination } from '@/components/Pagination'
import { RejectModal } from '@/components/modals/admission/RejectModal'
import { VettingReviewModal } from '@/components/modals/admission/VettingReviewModal'
import { RevertRejectionModal } from '@/components/modals/admission/RevertRejectionModal'
import { useVettingQueue, useVettingRejections, useVettingWaitingList, useVetApplication } from '@/hooks/admission/useVetting'
import { useCurrentAdmissionIntake } from '@/hooks/academic/useIntakes'
import { VettingQueueItem, VettingRejectionItem } from '@/lib/api/admission/vetting'
import { getIntakesPaged } from '@/lib/api/academic/intake'
import { getCampusesPaged } from '@/lib/api/academic/campus'
import { getProgramMastersPage } from '@/lib/api/academic/programMaster'
import { formatDate } from '@/lib/date'
import { usePagePermissions } from '@/hooks/users/usePagePermissions'

// Real server-side pagination — only DISPLAY_PAGE_SIZE rows are ever
// requested for the page currently on screen (studentName search is also a
// real server-side filter, confirmed per VettingApiDocs.md, so it narrows
// the actual queue, not just whatever's already loaded). Was previously a
// single FETCH_SIZE = 1000 "fetch everything, paginate client-side" call,
// which silently dropped anything past row 1000 once the real queue grew
// past that — same fix as enquiry-list/applicants' own page.tsx.
const DISPLAY_PAGE_SIZE = 10

const PIPELINE_STEPS = [
  { num: 1, label: 'Enquiry' }, { num: 2, label: 'Filing' }, { num: 3, label: 'Vetting' },
  { num: 4, label: 'Approval' }, { num: 5, label: 'Registration' },
]

type Tab = 'queue' | 'waiting' | 'rejections'

// "—" for null, blank, or the literal string "null" some admission endpoints
// send — same rule as VettingReviewModal's orDash.
function orDash(value: string | null | undefined): string {
  const v = value?.trim()
  return v && v.toLowerCase() !== 'null' ? v : '—'
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return '—'
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

// Date with how long ago underneath — queue age matters as much as the date.
function When({ date }: { date: string | null }) {
  if (!date) return <span className="text-g500">—</span>
  return (
    <span className="vd-when text-sm text-g700">
      {formatDate(date)}
      <span className="vd-when-ago">{timeAgo(date)}</span>
    </span>
  )
}

// Document completeness at a glance: green complete, amber partial, red none.
function DocsChip({ uploaded, total }: { uploaded: number | null; total: number | null }) {
  if (uploaded == null || !total) return <span className="text-g500">—</span>
  const tone = uploaded >= total ? 'green' : uploaded === 0 ? 'red' : 'amber'
  const label = uploaded >= total ? 'Complete' : `${total - uploaded} missing`
  return <span className={`badge badge-${tone}`} title={`${uploaded} of ${total} documents uploaded`}>{uploaded}/{total} · {label}</span>
}

// A one-item Actions menu cost an extra click per review; the action is
// direct now, and the applicant's name opens it too.
function ReviewButton({ onClick, name }: { onClick: () => void; name: string | null }) {
  return (
    <button type="button" className="btn btn-neu btn-sm" onClick={onClick} aria-label={`Review ${orDash(name)}`}>
      <i className="lni lni-eye" aria-hidden="true" /> Review
    </button>
  )
}

function NameButton({ name, onClick }: { name: string | null; onClick: () => void }) {
  return <button type="button" className="vd-name-btn" onClick={onClick}>{orDash(name)}</button>
}

export default function VettingPage() {
  // Approve/Reject/Wait have no server-side permission check, so gate them
  // on this page's edit permission (post-vet-application.md).
  const permissions = usePagePermissions()
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)
  const [openModals, setOpenModals] = useState<Set<string>>(new Set())
  const [activeTab, setActiveTab] = useState<Tab>('queue')
  const [filterProg, setFilterProg] = useState('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [selectedApplicationGuid, setSelectedApplicationGuid] = useState<string | null>(null)
  // Waiting applications are already on hold, so Review hides "Wait" for them.
  const [reviewFromWaiting, setReviewFromWaiting] = useState(false)
  const [revertTarget, setRevertTarget] = useState<VettingRejectionItem | null>(null)

  function showToast(msg: string, type = '') { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }
  function openModal(id: string) { setOpenModals(prev => new Set(prev).add(id)) }
  function closeModal(id: string) { setOpenModals(prev => { const s = new Set(prev); s.delete(id); return s }) }

  // ---- Tabs (same sliding underline as the other .tab-bar screens) ----
  const tabRefs = useRef<Partial<Record<Tab, HTMLButtonElement>>>({})
  const [indicator, setIndicator] = useState({ left: 0, width: 0 })
  useLayoutEffect(() => {
    const el = tabRefs.current[activeTab]
    if (el) setIndicator({ left: el.offsetLeft, width: el.offsetWidth })
  }, [activeTab])

  // ---- Vetting queue ----

  // studentName is a real server-side partial-match filter, appRefNo an
  // exact-match one (see the note on getVettingQueue). The single search box
  // (placeholder: "Search Application Ref No. / Student…") was only ever
  // sending the typed term as studentName — a typed App Ref No (format
  // APP-YYYY-NNNN, see mockQueue below) was never sent as appRefNo at all,
  // so it could never match. Sending both at once instead risks the backend
  // ANDing them (student name partial-matches AND ref no exact-matches),
  // which would break name search instead — so route by shape: a term that
  // looks like an App Ref No goes to appRefNo, everything else to
  // studentName, same "guess intent from shape" approach as the rest of
  // this app's single-box searches over two differently-typed fields.
  const searchTrimmed = search.trim()
  // Just the "APP" prefix, not a stricter shape — this app's App Ref No
  // formats aren't consistent everywhere (vetting's own mock data uses
  // "APP-2025-0041", All Applicants' real data uses "APP20261/7115", no
  // dash) — a real student name starting with "app" is vanishingly unlikely.
  const looksLikeAppRefNo = /^app/i.test(searchTrimmed)
  const { data, isLoading } = useVettingQueue(page, DISPLAY_PAGE_SIZE, looksLikeAppRefNo
    ? { appRefNo: searchTrimmed || undefined }
    : { studentName: searchTrimmed || undefined })
  const vetApplicationMutation = useVetApplication()
  // Approve only works for the current admission intake — flag other rows
  // in the queue so staff know before opening the review.
  const { data: currentAdmissionIntake } = useCurrentAdmissionIntake()

  const items = data?.items ?? []
  const summary = data?.summary
  const totalCount = data?.totalCount ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / DISPLAY_PAGE_SIZE))

  // The API has no programme filter param — built dynamically from whatever
  // programme names are present on the currently-fetched page, same pattern
  // as programme-master's level/group filter options. Now that only
  // DISPLAY_PAGE_SIZE rows are ever loaded at a time (see above), this can
  // only ever offer programmes present on the CURRENT page — a real, known
  // narrowing versus the old FETCH_SIZE = 1000 batch, same tradeoff
  // enquiry-list's own Channel/Intake filters already accepted for the same
  // reason.
  const progOptions = [
    { value: 'all', label: 'All Programmes' },
    ...Array.from(new Set(items.map(i => i.programName))).map(name => ({ value: name, label: name })),
  ]

  // Rows are already server-paginated (see useVettingQueue above) —
  // visibleRows narrows the current page's own rows by programme.
  const visibleRows = filterProg === 'all'
    ? items
    : items.filter(r => r.programName === filterProg)

  function updateSearch(value: string) { setSearch(value); setPage(1) }

  const searchMatches = search.trim() ? items.slice(0, 8) : []

  function isOutsideCurrentIntake(row: VettingQueueItem) {
    return !!currentAdmissionIntake && !!row.intakeGuid && row.intakeGuid !== currentAdmissionIntake.intakeGuid
  }

  function handleReview(applicationGuid: string, fromWaiting = false) {
    setSelectedApplicationGuid(applicationGuid)
    setReviewFromWaiting(fromWaiting)
    openModal('vetting-review-modal')
  }

  function handleRevert(row: VettingRejectionItem) {
    setRevertTarget(row)
    openModal('revert-rejection-modal')
  }

  function handleReject() {
    closeModal('vetting-review-modal')
    openModal('reject-modal')
  }

  // ---- Rejections (GET /admissions/vetting/rejections) ----
  const [rejSearch, setRejSearch] = useState('')
  const [rejCommittedSearch, setRejCommittedSearch] = useState('')
  const [rejIntake, setRejIntake] = useState('')
  const [rejCampus, setRejCampus] = useState('')
  const [rejProgram, setRejProgram] = useState('')
  const [rejPage, setRejPage] = useState(1)
  // search is matched server-side (exact ref no / phone / email, or name
  // contains) — debounce so typing doesn't fire a request per keystroke.
  useEffect(() => {
    const t = setTimeout(() => { setRejCommittedSearch(rejSearch.trim()); setRejPage(1) }, 300)
    return () => clearTimeout(t)
  }, [rejSearch])
  // Always enabled, not just while its tab is open: the tab badge shows
  // totalCount from page load, and an invalidation (a reject in the queue,
  // see useVetApplication) only refetches *enabled* queries — gating this on
  // the active tab left the badge stale until a full page refresh.
  const rejections = useVettingRejections(rejPage, DISPLAY_PAGE_SIZE, {
    search: rejCommittedSearch || undefined,
    intakeGuid: rejIntake || undefined,
    campusGuid: rejCampus || undefined,
    programGuid: rejProgram || undefined,
  })
  const rejItems = rejections.data?.items ?? []
  const rejTotal = rejections.data?.totalCount ?? 0
  const rejTotalPages = Math.max(1, Math.ceil(rejTotal / DISPLAY_PAGE_SIZE))
  const rejHasFilters = !!(rejCommittedSearch || rejIntake || rejCampus || rejProgram)
  // Revert has no server-side permission check either — the action column
  // only shows with edit permission.
  const rejColSpan = permissions.edit ? 9 : 8
  function clearRejFilters() { setRejSearch(''); setRejCommittedSearch(''); setRejIntake(''); setRejCampus(''); setRejProgram(''); setRejPage(1) }

  // ---- Waiting list (GET /admissions/vetting/waiting-list) ----
  // Same filters and debounce as Rejections; always enabled for the same
  // badge-freshness reason.
  const [waitSearch, setWaitSearch] = useState('')
  const [waitCommittedSearch, setWaitCommittedSearch] = useState('')
  const [waitIntake, setWaitIntake] = useState('')
  const [waitCampus, setWaitCampus] = useState('')
  const [waitProgram, setWaitProgram] = useState('')
  const [waitPage, setWaitPage] = useState(1)
  useEffect(() => {
    const t = setTimeout(() => { setWaitCommittedSearch(waitSearch.trim()); setWaitPage(1) }, 300)
    return () => clearTimeout(t)
  }, [waitSearch])
  const waiting = useVettingWaitingList(waitPage, DISPLAY_PAGE_SIZE, {
    search: waitCommittedSearch || undefined,
    intakeGuid: waitIntake || undefined,
    campusGuid: waitCampus || undefined,
    programGuid: waitProgram || undefined,
  })
  const waitItems = waiting.data?.items ?? []
  const waitTotal = waiting.data?.totalCount ?? 0
  const waitTotalPages = Math.max(1, Math.ceil(waitTotal / DISPLAY_PAGE_SIZE))
  const waitHasFilters = !!(waitCommittedSearch || waitIntake || waitCampus || waitProgram)
  function clearWaitFilters() { setWaitSearch(''); setWaitCommittedSearch(''); setWaitIntake(''); setWaitCampus(''); setWaitProgram(''); setWaitPage(1) }

  const tabs: { id: Tab; label: string; icon: string; count?: number }[] = [
    { id: 'queue', label: 'Vetting Queue', icon: 'lni-list', count: summary?.pendingCount },
    { id: 'waiting', label: 'Waiting List', icon: 'lni-timer', count: waiting.data ? waitTotal : undefined },
    { id: 'rejections', label: 'Rejections', icon: 'lni-ban', count: rejections.data ? rejTotal : undefined },
  ]

  return (
    <div id="page-vetting">
      <div className="pg-hdr">
        <div>
          <h1 className="text-[1.35rem] font-semibold text-g800">Stage 3 &middot; Application Vetting Desk</h1>
          <p className="text-sm text-g500 mt-1">Assistant Registrar reviews documents &amp; minimum standards</p>
        </div>
      </div>

      <div className="pipeline">
        {PIPELINE_STEPS.map((s, i) => {
          const cls = s.num < 3 ? 'done' : s.num === 3 ? 'active' : ''
          return (
            <span key={s.num} className="contents">
              {i > 0 && <span className={`pip-line ${s.num <= 3 ? 'done' : ''}`} />}
              <div className={`pip-step ${cls}`}><span className="pip-circle">{s.num}</span><span className="text-sm font-medium">{s.label}</span></div>
            </span>
          )
        })}
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="tab-bar" role="tablist" aria-label="Vetting desk">
          {tabs.map(t => {
            const active = activeTab === t.id
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={active}
                ref={el => { if (el) tabRefs.current[t.id] = el }}
                className={`tab-btn${active ? ' active' : ''}`}
                onClick={() => setActiveTab(t.id)}
              >
                <i className={`lni ${t.icon}`} aria-hidden="true" /> {t.label}
                {t.count !== undefined && (
                  <span className={`badge ${active ? (t.id === 'rejections' ? 'badge-red' : 'badge-amber') : 'badge-grey'}`}>{t.count}</span>
                )}
              </button>
            )
          })}
          <span className="tab-indicator" style={{ left: indicator.left, width: indicator.width }} />
        </div>

        {activeTab === 'queue' && (
          <div key="queue" className="p-5 tab-panel-in">
            <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-semibold text-g800">{summary?.pendingCount ?? 0} Pending</h2>
                <span className="badge badge-amber">Oldest: {timeAgo(summary?.oldestSubmittedDate ?? null)}</span>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <TableSearch
                  className="w-56"
                  placeholder="Search Application Ref No. / Student…"
                  value={search}
                  onChange={updateSearch}
                  results={searchMatches.map(row => ({ id: row.applicationGuid, primary: row.appRefNo, secondary: row.studentName }))}
                  // Picking a suggestion opens that application straight away.
                  onSelect={r => { updateSearch(r.primary); handleReview(r.id) }}
                />
                <SearchSelect options={progOptions} value={filterProg} onChange={v => { setFilterProg(v); setPage(1) }} />
              </div>
            </div>
            <ScrollTable>
              <table>
                <thead>
                  <tr>
                    <th><span className="sr-only">Actions</span></th>
                    <th>App. Ref</th>
                    <th>Applicant Name</th>
                    <th>Programme</th>
                    <th>Type</th>
                    <th>Documents</th>
                    <th>Submitted</th>
                    <th>Intake</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading
                    ? <TableLoadingState colSpan={8} />
                    : visibleRows.length === 0
                      ? <EmptyState colSpan={8} hasFilters={!!search.trim() || filterProg !== 'all'} onClearFilters={() => { setSearch(''); setFilterProg('all'); setPage(1) }} />
                      : null}
                  {visibleRows.map(row => (
                    <tr key={row.applicationGuid}>
                      <td><ReviewButton onClick={() => handleReview(row.applicationGuid)} name={row.studentName} /></td>
                      <td className="text-sm tabular-nums">{orDash(row.appRefNo)}</td>
                      <td><NameButton name={row.studentName} onClick={() => handleReview(row.applicationGuid)} /></td>
                      <td>{orDash(row.programName)}</td>
                      <td>{orDash(row.type) === '—' ? '—' : <span className={`badge badge-${row.type === 'ODL' ? 'cyan' : 'blue'}`}>{row.type}</span>}</td>
                      <td><DocsChip uploaded={row.documentsUploaded} total={row.documentsTotal} /></td>
                      <td><When date={row.submittedDate} /></td>
                      <td>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-sm">{orDash(row.intakeName || row.intakeCode || row.intake)}</span>
                          {isOutsideCurrentIntake(row) && (
                            <span
                              className="badge badge-grey"
                              title={`Approval is limited to the current admission intake (${currentAdmissionIntake!.intakeCode} — ${currentAdmissionIntake!.description}). This application can still be rejected or put on hold.`}
                            >
                              <i className="lni lni-lock" aria-hidden="true" /> Not current intake
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollTable>
            <Pagination page={page} totalPages={totalPages} totalCount={totalCount} itemLabel="applicants" onPageChange={setPage} />
          </div>
        )}

        {activeTab === 'waiting' && (
          <div key="waiting" className="p-5 tab-panel-in">
            <p className="text-sm text-g500 mb-4">Applications put on hold at vetting, most recently marked first. Review one to approve or reject it.</p>
            <div className="flex items-center gap-3 flex-wrap mb-4">
              <TableSearch
                className="w-64"
                placeholder="Ref no, phone, email or name…"
                value={waitSearch}
                onChange={setWaitSearch}
              />
              <div style={{ width: 200 }}>
                <InfiniteSearchSelect
                  queryKey={['intakes', 'vetting-waiting']}
                  fetchPage={getIntakesPaged}
                  toOption={i => ({ value: i.intakeGuid, label: `${i.intakeCode} — ${i.description}` })}
                  allLabel="All intakes"
                  value={waitIntake}
                  onChange={v => { setWaitIntake(v); setWaitPage(1) }}
                />
              </div>
              <div style={{ width: 200 }}>
                <InfiniteSearchSelect
                  queryKey={['campuses', 'vetting-waiting']}
                  fetchPage={getCampusesPaged}
                  toOption={c => ({ value: c.campusGuid, label: c.campusName })}
                  allLabel="All campuses"
                  value={waitCampus}
                  onChange={v => { setWaitCampus(v); setWaitPage(1) }}
                />
              </div>
              <div style={{ width: 240 }}>
                <InfiniteSearchSelect
                  queryKey={['program-masters', 'vetting-waiting']}
                  fetchPage={getProgramMastersPage}
                  toOption={p => ({ value: p.programGuid, label: p.programName || p.programCode })}
                  allLabel="All programmes"
                  value={waitProgram}
                  onChange={v => { setWaitProgram(v); setWaitPage(1) }}
                />
              </div>
            </div>
            <ScrollTable>
              <table>
                <thead>
                  <tr>
                    <th><span className="sr-only">Actions</span></th>
                    <th>App. Ref</th>
                    <th>Applicant</th>
                    <th>Contact</th>
                    <th>Programme</th>
                    <th>Type</th>
                    <th>Submitted</th>
                    <th>Waiting Since</th>
                    <th>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {waiting.isLoading
                    ? <TableLoadingState colSpan={9} />
                    : waitItems.length === 0
                      ? <EmptyState
                          colSpan={9}
                          title={waitHasFilters ? undefined : 'No applications on hold'}
                          subtitle={waitHasFilters ? undefined : 'Applications marked as waiting at vetting will show here.'}
                          hasFilters={waitHasFilters}
                          onClearFilters={clearWaitFilters}
                        />
                      : null}
                  {waitItems.map(w => (
                    <tr key={w.applicationGuid}>
                      <td><ReviewButton onClick={() => handleReview(w.applicationGuid, true)} name={w.studentName} /></td>
                      <td className="text-sm tabular-nums">{orDash(w.appRefNo)}</td>
                      <td><NameButton name={w.studentName} onClick={() => handleReview(w.applicationGuid, true)} /></td>
                      <td className="text-sm">
                        <div className="flex flex-col gap-0.5">
                          {w.phone && <a className="text-b700 hover:underline" href={`tel:${w.phone}`}><i className="lni lni-phone" aria-hidden="true" /> {w.phone}</a>}
                          {w.emailId && <a className="text-b700 hover:underline" href={`mailto:${w.emailId}`}><i className="lni lni-envelope" aria-hidden="true" /> {w.emailId}</a>}
                          {!w.phone && !w.emailId && <span className="text-g400">—</span>}
                        </div>
                      </td>
                      <td>{orDash(w.programName)}</td>
                      <td>{orDash(w.type) === '—' ? '—' : <span className={`badge badge-${w.type === 'ODL' ? 'cyan' : 'blue'}`}>{w.type}</span>}</td>
                      <td><When date={w.submittedDate} /></td>
                      <td><When date={w.waitingDate} /></td>
                      <td className="text-sm text-g700" style={{ minWidth: 220, maxWidth: 360, whiteSpace: 'normal' }}>{orDash(w.remarks)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollTable>
            <Pagination page={waitPage} totalPages={waitTotalPages} totalCount={waitTotal} itemLabel="applications" onPageChange={setWaitPage} />
          </div>
        )}

        {activeTab === 'rejections' && (
          <div key="rejections" className="p-5 tab-panel-in">
            <p className="text-sm text-g500 mb-4">Most recent first. Use the contact details to follow up with the candidate on the reason.</p>
            <div className="flex items-center gap-3 flex-wrap mb-4">
              <TableSearch
                className="w-64"
                placeholder="Ref no, phone, email or name…"
                value={rejSearch}
                onChange={setRejSearch}
              />
              <div style={{ width: 200 }}>
                <InfiniteSearchSelect
                  queryKey={['intakes', 'vetting-rejections']}
                  fetchPage={getIntakesPaged}
                  toOption={i => ({ value: i.intakeGuid, label: `${i.intakeCode} — ${i.description}` })}
                  allLabel="All intakes"
                  value={rejIntake}
                  onChange={v => { setRejIntake(v); setRejPage(1) }}
                />
              </div>
              <div style={{ width: 200 }}>
                <InfiniteSearchSelect
                  queryKey={['campuses', 'vetting-rejections']}
                  fetchPage={getCampusesPaged}
                  toOption={c => ({ value: c.campusGuid, label: c.campusName })}
                  allLabel="All campuses"
                  value={rejCampus}
                  onChange={v => { setRejCampus(v); setRejPage(1) }}
                />
              </div>
              <div style={{ width: 240 }}>
                <InfiniteSearchSelect
                  queryKey={['program-masters', 'vetting-rejections']}
                  fetchPage={getProgramMastersPage}
                  toOption={p => ({ value: p.programGuid, label: p.programName || p.programCode })}
                  allLabel="All programmes"
                  value={rejProgram}
                  onChange={v => { setRejProgram(v); setRejPage(1) }}
                />
              </div>
            </div>
            <ScrollTable>
              <table>
                <thead>
                  <tr>
                    {permissions.edit && <th><span className="sr-only">Actions</span></th>}
                    <th>App. Ref</th>
                    <th>Applicant</th>
                    <th>Contact</th>
                    <th>Programme</th>
                    <th>Type</th>
                    <th>Submitted</th>
                    <th>Rejected</th>
                    <th>Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {rejections.isLoading
                    ? <TableLoadingState colSpan={rejColSpan} />
                    : rejItems.length === 0
                      ? <EmptyState
                          colSpan={rejColSpan}
                          title={rejHasFilters ? undefined : 'No rejected applications'}
                          subtitle={rejHasFilters ? undefined : 'Applications rejected at vetting will show here with their reason.'}
                          hasFilters={rejHasFilters}
                          onClearFilters={clearRejFilters}
                        />
                      : null}
                  {rejItems.map(r => (
                    <tr key={r.applicationGuid}>
                      {permissions.edit && (
                        <td><button type="button" className="btn btn-neu btn-sm" onClick={() => handleRevert(r)} aria-label={`Revert rejection of ${orDash(r.studentName)}`}><i className="lni lni-reload" aria-hidden="true" /> Revert</button></td>
                      )}
                      <td className="text-sm tabular-nums">{orDash(r.appRefNo)}</td>
                      <td>{orDash(r.studentName)}</td>
                      <td className="text-sm">
                        <div className="flex flex-col gap-0.5">
                          {r.phone && <a className="text-b700 hover:underline" href={`tel:${r.phone}`}><i className="lni lni-phone" aria-hidden="true" /> {r.phone}</a>}
                          {r.emailId && <a className="text-b700 hover:underline" href={`mailto:${r.emailId}`}><i className="lni lni-envelope" aria-hidden="true" /> {r.emailId}</a>}
                          {!r.phone && !r.emailId && <span className="text-g400">—</span>}
                        </div>
                      </td>
                      <td>{orDash(r.programName)}</td>
                      <td>{orDash(r.type) === '—' ? '—' : <span className={`badge badge-${r.type === 'ODL' ? 'cyan' : 'blue'}`}>{r.type}</span>}</td>
                      <td><When date={r.submittedDate} /></td>
                      <td><When date={r.rejectedDate} /></td>
                      <td className="text-sm text-g700" style={{ minWidth: 220, maxWidth: 360, whiteSpace: 'normal' }}>{orDash(r.rejectionReason)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollTable>
            <Pagination page={rejPage} totalPages={rejTotalPages} totalCount={rejTotal} itemLabel="rejections" onPageChange={setRejPage} />
          </div>
        )}
      </div>

      <VettingReviewModal
        isOpen={openModals.has('vetting-review-modal')}
        onClose={() => closeModal('vetting-review-modal')}
        showToast={showToast}
        applicationGuid={selectedApplicationGuid}
        vetApplication={vetApplicationMutation}
        onReject={handleReject}
        canVet={permissions.edit}
        allowWait={!reviewFromWaiting}
      />
      <RevertRejectionModal
        isOpen={openModals.has('revert-rejection-modal')}
        onClose={() => { closeModal('revert-rejection-modal'); setRevertTarget(null) }}
        showToast={showToast}
        rejection={revertTarget}
      />
      <RejectModal
        isOpen={openModals.has('reject-modal')}
        onClose={() => closeModal('reject-modal')}
        showToast={showToast}
        applicationGuid={selectedApplicationGuid}
        vetApplication={vetApplicationMutation}
      />
      <Toast toast={toast} />
    </div>
  )
}
