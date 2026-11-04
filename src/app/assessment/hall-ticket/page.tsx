'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ScrollTable } from '@/components/ScrollTable'
import { SearchSelect } from '@/components/SearchSelect'
import { Pagination } from '@/components/Pagination'
import { Toast } from '@/components/Toast'
import { usePagePermissions } from '@/hooks/users/usePagePermissions'
import { TableLoadingState } from '@/components/TableLoadingState'
import { useIntakesDropdown } from '@/hooks/academic/useIntakes'
import { useProgramDropdown } from '@/hooks/academic/useProgramMaster'
import { useSemestersForProgram } from '@/hooks/academic/useSemesters'
import {
  useHallTicketSearch,
  useHallTicketEligibility,
  useHallTicketScopeStudents,
  useIssueHallTicket,
  useBulkIssueHallTickets,
  BulkIssueResponseDto,
  HallTicketIssueStatus,
  HallTicketTerm,
} from '@/hooks/assessment/useHallTicket'
import type { HallTicketSearchResultDto } from '@/lib/api/student/hallTicketSearch'

// Hall Ticket Eligibility & Issue (pages/assessment/hall-ticket-eligibility-
// and-issue-page.md) — successor to legacy frmTrnUEHallTicketIssue. This
// page only ISSUES; printing lives on /assessment/hall-print (one student)
// and /assessment/hall-ticket-print-all (whole intake).
//  1. Intake + term — sent with every call.
//  2. Search → GET /students/hall-ticket-search (registered students of the intake).
//  3. Select a row → GET /eligibility, one call for every clearance.
//  4. Issue → POST /, shown only when canIssue (the server re-checks).
//  5/6. Bulk issue + issue status → POST /bulk and GET /bulk in one modal,
//     scoped to the intake or one program/semester.

const PAGE_SIZE = 10
const TERM_OPTIONS = [{ value: '1', label: 'Term 1' }, { value: '2', label: 'Term 2' }]
const STATUS_OPTIONS = [
  { value: '', label: 'All students' },
  { value: 'NotIssued', label: 'Not issued' },
  { value: 'Issued', label: 'Issued' },
]

export default function HallTicketIssuancePage() {
  const permissions = usePagePermissions()
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)
  function showToast(msg: string, type = '') { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }

  // ---- Scope ---------------------------------------------------------------
  // Hall tickets are only issued for the current academic intake — the field
  // is locked to it, not a choice.
  const { data: intakes = [], isLoading: intakesLoading } = useIntakesDropdown()
  const currentIntake = intakes.find(i => i.currentIntake)
  const intakeGuid = currentIntake?.intakeGuid ?? ''
  const intakeLabel = currentIntake ? (currentIntake.description ? `${currentIntake.description} (${currentIntake.intakeCode})` : String(currentIntake.intakeCode)) : ''
  const [term, setTerm] = useState<HallTicketTerm>(1)

  // ---- Search --------------------------------------------------------------
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  useEffect(() => {
    const t = setTimeout(() => { if (searchInput.trim() !== search) { setSearch(searchInput.trim()); setPage(1) } }, 400)
    return () => clearTimeout(t)
  }, [searchInput, search])
  const { data: students = [], isFetching: searching, isError: searchError } = useHallTicketSearch(search, intakeGuid || null)
  const [page, setPage] = useState(1)
  const totalPages = Math.max(1, Math.ceil(students.length / PAGE_SIZE))
  const pageRows = students.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // ---- Selected student ----------------------------------------------------
  // Kept across term changes — eligibility is keyed by term, so the
  // clearance card re-checks the same student.
  const [selected, setSelected] = useState<HallTicketSearchResultDto | null>(null)
  const { data: elig, isFetching: checking, isError: eligError, error: eligErr } = useHallTicketEligibility(selected?.studentGuid ?? null, intakeGuid || null, term)
  const issue = useIssueHallTicket()

  function handleIssue() {
    if (!selected || !elig?.canIssue) return
    issue.mutate({ studentGuid: selected.studentGuid, intakeGuid, term }, {
      // "Already issued" is a success too — the server refreshed the
      // existing ticket's issue date rather than creating a new one.
      onSuccess: ({ alreadyIssued }) => {
        const who = selected.studentName ?? 'the student'
        showToast(alreadyIssued ? `${who} already had a Term ${term} hall ticket — its issue date has been updated to today.` : `Hall ticket issued to ${who}.`, 'ok')
        // Per the page doc: clear the selection and the search box.
        setSelected(null); setSearchInput(''); setSearch('')
      },
      // A 400 here means a clearance changed since the check, or Finance
      // couldn't be reached on the server's re-check.
      onError: (e: Error) => showToast(e.message || 'Could not issue the hall ticket.', 'error'),
    })
  }

  const [bulkOpen, setBulkOpen] = useState(false)

  return (
    <>
      <div className="page active">
        <div className="pg-hdr">
          <div><div className="pg-title">Hall Ticket Issuance</div><div className="pg-sub">Check a student&apos;s exam clearances and issue their University Exam hall ticket</div></div>
          {(permissions.add || permissions.edit) && (
            <button className="btn btn-neu" onClick={() => setBulkOpen(true)} disabled={!intakeGuid}><i className="lni lni-ticket"></i> Bulk Issue &amp; Status</button>
          )}
        </div>

        <div className="card">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="fg">
              <label className="lbl">Academic Intake</label>
              {/* readOnly, not disabled — the field has a real value, and the
                  grey .ctrl:disabled style reads as "unavailable". The lock
                  icon says it's fixed. */}
              <div className="inp-wrap">
                <i className="lni lni-lock-alt inp-icon"></i>
                <input
                  className="ctrl"
                  value={intakesLoading ? 'Loading…' : intakeLabel || 'No current intake set'}
                  readOnly
                  tabIndex={-1}
                  style={{ cursor: 'default', fontWeight: 600 }}
                  title="Hall tickets are issued for the current academic intake only"
                />
              </div>
              {!intakesLoading && !currentIntake && (
                <p className="text-clr-red" style={{ fontSize: 11.5, marginTop: 4 }}>No intake is marked as the current academic intake. Set one in Intake Master to issue hall tickets.</p>
              )}
            </div>
            <div className="fg">
              <label className="lbl">Term <span className="req">*</span></label>
              <SearchSelect options={TERM_OPTIONS} value={String(term)} onChange={v => setTerm(v === '2' ? 2 : 1)} />
            </div>
            <div className="fg">
              <label className="lbl">Search Student</label>
              <div className="inp-wrap">
                <i className="lni lni-search-alt inp-icon"></i>
                <input className="ctrl" placeholder="Student No., Reg No. or name…" value={searchInput} onChange={e => setSearchInput(e.target.value)} disabled={!intakeGuid} />
              </div>
            </div>
          </div>
        </div>

        {selected && (() => {
          const name = elig?.studentName ?? selected.studentName ?? '—'
          // Term 2 adds Guild and NCHE; both are null for Term 1.
          const checks = elig ? [
            { label: 'Fee clearance', ok: elig.feeOk, note: elig.isFeeExcepted ? 'No fee clearance needed' : elig.isExempted ? 'Exemption student' : `Needs ${term === 1 ? '50%' : '100%'} of fees paid` },
            { label: 'Coursework', ok: elig.cwOk, note: 'First coursework submitted on every unit with coursework' },
            { label: 'Class test', ok: elig.ctOk, note: 'First class test submitted on every unit with a mid-semester test' },
            ...(elig.guildOk !== null ? [{ label: 'Guild fee', ok: elig.guildOk, note: 'Current-semester Guild fee paid' }] : []),
            ...(elig.ncheOk !== null ? [{ label: 'NCHE', ok: elig.ncheOk, note: 'NCHE status for the semester is Paid' }] : []),
          ] : []
          const failing = checks.filter(c => !c.ok).map(c => c.label.toLowerCase())
          const showChecks = !checking && !eligError && !!elig && !elig.alreadyIssued
          return (
            <section className="card ht-panel" aria-labelledby="ht-student-name">
              <header className="ht-id">
                <div className="ht-avatar" aria-hidden="true">{initials(name)}</div>
                <div className="ht-id-main">
                  <div className="ht-name-row">
                    <h2 className="ht-name" id="ht-student-name">{name}</h2>
                    {selected.studentRegNo && <span className="ht-reg" title="Reg No.">{selected.studentRegNo}</span>}
                  </div>
                  <dl className="ht-meta">
                    <div><dt>Programme</dt><dd>{selected.programName || '—'}</dd></div>
                    <div><dt>Semester</dt><dd>{selected.semCode || '—'}</dd></div>
                    <div><dt>Batch</dt><dd>{selected.batchCode || '—'}</dd></div>
                  </dl>
                </div>
                <button type="button" className="btn btn-neu btn-sm" onClick={() => setSelected(null)}><i className="lni lni-close"></i> Clear</button>
              </header>

              {/* Already issued: nothing left to check, so the verdict bar
                  below says it alone (no empty checklist box). */}
              {!(elig?.alreadyIssued && !checking && !eligError) && (
              <div className="ht-body">
                <div className="ht-checks-hdr">
                  <h3 className="ht-checks-title">Exam clearance · Term {term}</h3>
                  {showChecks && (
                    <div className="ht-tally">
                      <span className="ht-meter" aria-hidden="true">{checks.map(c => <span key={c.label} className={c.ok ? 'ok' : 'bad'} />)}</span>
                      {checks.length - failing.length} of {checks.length} cleared
                    </div>
                  )}
                </div>

                {checking ? (
                  <div className="ht-state" role="status"><span className="ht-spin" aria-hidden="true"></span> Checking clearances…</div>
                ) : eligError || !elig ? (
                  // A Finance status (fee / Guild / NCHE) or the course unit
                  // lookup couldn't load — the API fails with a 400 naming it
                  // rather than reporting "not cleared", so show it as an
                  // error, never as a red clearance line.
                  <div className="ht-state err" role="alert">
                    <i className="lni lni-warning" aria-hidden="true"></i> {eligErr instanceof Error && eligErr.message ? eligErr.message : 'Couldn’t check eligibility. Please try again.'}
                  </div>
                ) : (
                  <ul className="ht-checks">
                    {checks.map(c => <ClearanceLine key={c.label} {...c} />)}
                  </ul>
                )}
              </div>
              )}

              {elig && !checking && !eligError && (
                elig.alreadyIssued ? (
                  <footer className="ht-verdict ok">
                    <div className="ht-verdict-msg">
                      <i className="lni lni-checkmark-circle" aria-hidden="true"></i>
                      <div><div className="ht-verdict-title">Term {term} hall ticket already issued</div><div className="ht-verdict-sub">Nothing left to check. Print it from Hall Ticket Print.</div></div>
                    </div>
                    <Link
                      className="btn btn-neu"
                      // Hall Ticket Print reads these to open on this student
                      // (it resolves programme + semester GUIDs from them).
                      href={`/assessment/hall-print?${new URLSearchParams({
                        term: String(term),
                        semCode: selected.semCode ?? '',
                        program: selected.programName ?? '',
                        q: selected.studentRegNo ?? selected.studentName ?? '',
                      })}`}
                    ><i className="lni lni-printer"></i> Go to Hall Ticket Print</Link>
                  </footer>
                ) : elig.canIssue ? (
                  <footer className="ht-verdict ok">
                    <div className="ht-verdict-msg">
                      <i className="lni lni-checkmark-circle" aria-hidden="true"></i>
                      <div><div className="ht-verdict-title">Eligible for a Term {term} hall ticket</div><div className="ht-verdict-sub">Every clearance is in place.</div></div>
                    </div>
                    {(permissions.add || permissions.edit) && (
                    <button type="button" className="btn btn-primary" onClick={handleIssue} disabled={issue.isPending}>
                      <i className="lni lni-ticket"></i> {issue.isPending ? 'Issuing…' : 'Issue Hall Ticket'}
                    </button>
                    )}
                  </footer>
                ) : (
                  <footer className="ht-verdict bad">
                    <div className="ht-verdict-msg">
                      <i className="lni lni-ban" aria-hidden="true"></i>
                      <div>
                        <div className="ht-verdict-title">Not eligible yet</div>
                        <div className="ht-verdict-sub">
                          {failing.length ? `${sentenceList(failing)} ${failing.length === 1 ? 'isn’t' : 'aren’t'} cleared. The ticket can be issued once ${failing.length === 1 ? 'it is' : 'they are'}.` : 'A clearance isn’t in place yet.'}
                        </div>
                      </div>
                    </div>
                  </footer>
                )
              )}
            </section>
          )
        })()}

        <div className="card">
          <div className="card-hdr">
            <div className="card-title"><i className="lni lni-users"></i> Students</div>
            {students.length > 0 && <span className="badge badge-blue">{students.length} found</span>}
          </div>
          <ScrollTable>
            <table>
              <thead><tr><th>Reg No.</th><th>Name</th><th>Programme</th><th>Semester</th><th>Batch</th></tr></thead>
              <tbody>
                {!search ? (
                  <tr><td colSpan={5} className="text-g400 text-center" style={{ padding: 24 }}>Search for a student by number or name to check their clearances.</td></tr>
                ) : searching && students.length === 0 ? (
                  <TableLoadingState colSpan={5} />
                ) : searchError ? (
                  <tr><td colSpan={5} className="text-clr-red text-center" style={{ padding: 24 }}><i className="lni lni-warning"></i> Couldn&apos;t search students. Please try again.</td></tr>
                ) : students.length === 0 ? (
                  <tr><td colSpan={5} className="text-g400 text-center" style={{ padding: 24 }}>No registered student of this intake matches &quot;{search}&quot;.</td></tr>
                ) : pageRows.map(s => (
                  <tr key={s.studentGuid} onClick={() => setSelected(s)} style={{ cursor: 'pointer', background: selected?.studentGuid === s.studentGuid ? 'var(--b50)' : undefined }}>
                    <td className="font-mono">{s.studentRegNo ?? '—'}</td>
                    <td className="font-semibold">{s.studentName ?? '—'}</td>
                    <td>{s.programName || '—'}</td>
                    <td>{s.semCode || '—'}</td>
                    <td>{s.batchCode || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollTable>
          {students.length > PAGE_SIZE && <Pagination page={page} totalPages={totalPages} totalCount={students.length} itemLabel="students" onPageChange={setPage} />}
        </div>
      </div>

      <BulkIssueModal
        isOpen={bulkOpen}
        onClose={() => setBulkOpen(false)}
        intakeGuid={intakeGuid}
        intakeLabel={intakeLabel}
        term={term}
        showToast={showToast}
      />
      <Toast toast={toast} />
    </>
  )
}

// Status is spelled out on the right, so the row never relies on colour alone.
function ClearanceLine({ label, ok, note }: { label: string; ok: boolean; note: string }) {
  return (
    <li className={`ht-check ${ok ? 'ok' : 'bad'}`}>
      <span className="ht-check-icon" aria-hidden="true"><i className={`lni ${ok ? 'lni-checkmark' : 'lni-close'}`}></i></span>
      <div>
        <div className="ht-check-label">{label}</div>
        <div className="ht-check-note">{note}</div>
      </div>
      <span className="ht-check-status">{ok ? 'Cleared' : 'Not cleared'}</span>
    </li>
  )
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(w => /\p{L}/u.test(w))
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase() || '?'
}

// ['class test'] → 'Class test'; ['a', 'b', 'c'] → 'A, b and c'
function sentenceList(items: string[]) {
  const s = items.length > 1 ? `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}` : items[0]
  return s.charAt(0).toUpperCase() + s.slice(1)
}

// Bulk issue (POST /bulk) + issue status list (GET /bulk), per steps 5–6:
// filter Not issued, bulk issue, and the list reloads to show who's left.
// Program + semester narrow the scope; leaving program empty = whole intake.
function BulkIssueModal({ isOpen, onClose, intakeGuid, intakeLabel, term, showToast }: {
  isOpen: boolean
  onClose: () => void
  intakeGuid: string
  intakeLabel: string
  term: HallTicketTerm
  showToast: (msg: string, type?: string) => void
}) {
  const permissions = usePagePermissions('/assessment/hall-ticket')
  const [programGuid, setProgramGuid] = useState('')
  const [semesterGuid, setSemesterGuid] = useState('')
  const [status, setStatus] = useState<HallTicketIssueStatus | ''>('NotIssued')
  const [summary, setSummary] = useState<BulkIssueResponseDto | null>(null)
  const [page, setPage] = useState(1)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  useEffect(() => { if (isOpen) { setSummary(null); setPage(1); setShowConfirmModal(false) } }, [isOpen])

  const { data: programs = [] } = useProgramDropdown(undefined, isOpen)
  const { data: semesters = [] } = useSemestersForProgram(programGuid || null, isOpen)
  // The API needs program and semester together — a program alone isn't a scope.
  const scopeIncomplete = !!programGuid && !semesterGuid
  const scope = { intakeGuid, term, programGuid: programGuid || null, semesterGuid: semesterGuid || null }
  const { data: rows = [], isFetching, isError } = useHallTicketScopeStudents(scope, status || null, isOpen && !scopeIncomplete)
  const bulk = useBulkIssueHallTickets()
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))

  if (!isOpen) return null

  const scopeLabel = programGuid
    ? `${programs.find(p => p.programGuid === programGuid)?.programName ?? 'programme'}${semesterGuid ? ` · ${semesters.find(s => s.semesterGuid === semesterGuid)?.semName ?? ''}` : ''}`
    : `the whole of ${intakeLabel || 'this intake'}`

  function handleBulkIssue() {
    if (scopeIncomplete || !intakeGuid) return
    setShowConfirmModal(true)
  }

  function confirmBulkIssue() {
    setShowConfirmModal(false)
    setSummary(null)
    bulk.mutate(scope, {
      onSuccess: res => { setSummary(res); setPage(1) },
      onError: (e: Error) => showToast(e.message || 'Bulk issue failed.', 'error'),
    })
  }

  return (
    <div className="modal-overlay open">
      <div className="modal modal-xl" style={{ display: 'flex', flexDirection: 'column', maxHeight: '88vh' }} onClick={e => e.stopPropagation()}>
        <div className="modal-hdr"><div className="modal-title"><i className="lni lni-ticket"></i> Bulk Issue &amp; Status — Term {term}</div><button className="modal-close" onClick={onClose}>✕</button></div>
        <div style={{ overflowY: 'auto', flex: '1 1 auto', minHeight: 0 }}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="fg">
              <label className="lbl">Programme</label>
              <SearchSelect
                placeholder="All programmes"
                options={[{ value: '', label: 'All programmes (whole intake)' }, ...programs.map(p => ({ value: p.programGuid, label: p.programName }))]}
                value={programGuid}
                onChange={v => { setProgramGuid(v); setSemesterGuid(''); setPage(1) }}
              />
            </div>
            <div className="fg">
              <label className="lbl">Semester {programGuid && <span className="req">*</span>}</label>
              <SearchSelect
                placeholder={programGuid ? '— Select Semester —' : 'Pick a programme first'}
                options={semesters.map(s => ({ value: s.semesterGuid, label: s.semName }))}
                value={semesterGuid}
                onChange={v => { setSemesterGuid(v); setPage(1) }}
                disabled={!programGuid}
              />
            </div>
            <div className="fg">
              <label className="lbl">Show</label>
              <SearchSelect options={STATUS_OPTIONS} value={status} onChange={v => { setStatus(v as HallTicketIssueStatus | ''); setPage(1) }} />
            </div>
          </div>

          {summary && (
            <div className="info-box mb-3">
              <i className="lni lni-information" style={{ color: 'var(--b700)', fontSize: 15, flexShrink: 0 }}></i>
              <div style={{ fontSize: 12.5 }}>
                <strong>{summary.totalConsidered}</strong> considered — <strong style={{ color: 'var(--green)' }}>{summary.issued}</strong> issued,{' '}
                <strong>{summary.alreadyIssued}</strong> already issued, <strong style={{ color: 'var(--amber)' }}>{summary.ineligible}</strong> ineligible,{' '}
                <strong style={{ color: 'var(--red)' }}>{summary.failed}</strong> failed.
                {summary.alreadyIssued > 0 && ' Students who already had a ticket were skipped (their issue date is unchanged).'}
                {summary.ineligible > 0 && ' Ineligible means a clearance came back not cleared — select the student on the main page to see which one.'}
                {summary.failed > 0 && ' Failed means the check couldn’t be completed — for example a fee status could not be loaded from Finance — not that the student is ineligible. Select one on the main page to see the error, and retry once it’s fixed.'}
              </div>
            </div>
          )}

          {scopeIncomplete ? (
            <div className="text-g400 text-center" style={{ padding: 24, fontSize: 12.5 }}>Pick a semester to scope to this programme.</div>
          ) : (
            <>
              <ScrollTable>
                <table>
                  <thead><tr><th>Reg No.</th><th>Name</th><th>Status</th><th>Programme</th><th>Sem</th><th>Batch</th></tr></thead>
                  <tbody>
                    {isFetching && rows.length === 0 ? (
                      <TableLoadingState colSpan={6} />
                    ) : isError ? (
                      <tr><td colSpan={6} className="text-clr-red text-center" style={{ padding: 24 }}><i className="lni lni-warning"></i> Couldn&apos;t load students. Please try again.</td></tr>
                    ) : rows.length === 0 ? (
                      <tr><td colSpan={6} className="text-g400 text-center" style={{ padding: 24 }}>No students {status === 'Issued' ? 'with an issued ticket' : status === 'NotIssued' ? 'left without a ticket' : ''} in this scope.</td></tr>
                    ) : rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map(r => (
                      <tr key={r.studentGuid}>
                        <td className="font-mono">{r.studentRegNo ?? '—'}</td>
                        <td>{r.studentName ?? '—'}</td>
                        <td><span className={`badge ${r.status === 'Issued' ? 'badge-green' : 'badge-amber'}`}>{r.status === 'Issued' ? 'Issued' : 'Not issued'}</span></td>
                        <td>{r.programName || '—'}</td>
                        <td>{r.semCode || '—'}</td>
                        <td>{r.batchCode || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ScrollTable>
              {rows.length > PAGE_SIZE && <Pagination page={page} totalPages={totalPages} totalCount={rows.length} itemLabel="students" onPageChange={setPage} />}
            </>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-neu" onClick={onClose} disabled={bulk.isPending}>Close</button>
          {(permissions.add || permissions.edit) && (
          <button className="btn btn-primary" onClick={handleBulkIssue} disabled={bulk.isPending || scopeIncomplete || !intakeGuid}>
            <i className="lni lni-ticket"></i> {bulk.isPending ? 'Issuing…' : 'Bulk Issue'}
          </button>
          )}
        </div>
      </div>

      {showConfirmModal && (
        <div
          className="perm-delete-overlay"
          style={{ position: 'fixed', zIndex: 600 }}
          onClick={() => setShowConfirmModal(false)}
        >
          <div className="perm-delete-card tab-panel-in" onClick={e => e.stopPropagation()}>
            <div
              className="perm-delete-icon"
              style={{
                background: 'var(--b50)',
                border: '1.5px solid var(--b200)',
                color: 'var(--b700)',
              }}
            >
              <i className="lni lni-ticket" />
            </div>
            <div className="perm-delete-title">Confirm Bulk Issuance</div>
            <div className="perm-delete-sub">
              Issue Term {term} hall tickets to every eligible student in {scopeLabel}? Students who already have one are skipped. This may take a while.
            </div>
            <div className="perm-delete-actions">
              <button
                type="button"
                className="btn btn-neu"
                onClick={() => setShowConfirmModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={confirmBulkIssue}
              >
                <i className="lni lni-ticket"></i> Issue Hall Tickets
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
