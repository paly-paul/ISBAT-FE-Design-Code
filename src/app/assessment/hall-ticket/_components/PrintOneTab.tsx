'use client'
import { useEffect, useState } from 'react'
import { ScrollTable } from '@/components/ScrollTable'
import { SearchSelect } from '@/components/SearchSelect'
import { Pagination } from '@/components/Pagination'
import { TableLoadingState } from '@/components/TableLoadingState'
import { useProgramDropdown } from '@/hooks/academic/useProgramMaster'
import { useSemestersForProgram } from '@/hooks/academic/useSemesters'
import { useHallTicketScopeStudents, HallTicketIssueStatus, HallTicketTerm } from '@/hooks/assessment/useHallTicket'
import { downloadHallTicketPdf } from '@/lib/api/assessment/hallTicketIssue'
import { getSemestersBySemCode } from '@/lib/api/academic/semester'
import { downloadBlob } from '@/lib/downloadBlob'
import { formatIntakeLabel, HALL_TICKET_TERM_OPTIONS, PrintOneHandoff } from './hallTicketShared'

const PAGE_SIZE = 15

const STATUS_OPTIONS = [
  { value: '', label: 'All students' },
  { value: 'Issued', label: 'Issued (printable)' },
  { value: 'NotIssued', label: 'Not issued' },
]

interface IntakeOption {
  intakeGuid: string
  description?: string | null
  intakeCode?: string | number | null
  currentIntake?: boolean | null
}

interface PrintOneTabProps {
  intakes: IntakeOption[]
  canPrint: boolean
  canViewIssue: boolean
  onGoToIssue: () => void
  handoff: PrintOneHandoff | null
  showToast: (msg: string, type?: string) => void
}

export function PrintOneTab({
  intakes,
  canPrint,
  canViewIssue,
  onGoToIssue,
  handoff,
  showToast,
}: PrintOneTabProps) {
  const [intakeGuid, setIntakeGuid] = useState('')
  useEffect(() => {
    if (intakeGuid || intakes.length === 0) return
    setIntakeGuid((intakes.find(i => i.currentIntake) ?? intakes[0]).intakeGuid)
  }, [intakes, intakeGuid])

  const [programGuid, setProgramGuid] = useState('')
  const [semesterGuid, setSemesterGuid] = useState('')
  const [termOverride, setTermOverride] = useState('')
  const [status, setStatus] = useState<HallTicketIssueStatus | ''>('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const { data: programs = [] } = useProgramDropdown()
  const { data: semesters = [] } = useSemestersForProgram(programGuid || null, true)

  // Deep-link or cross-tab handoff from Issue & Eligibility (?term=&semCode=&program=&q=).
  useEffect(() => {
    if (!handoff) return
    setTermOverride(handoff.term === '1' || handoff.term === '2' ? handoff.term : '')
    setSearch(handoff.q ?? '')
    setPage(1)

    const semCode = handoff.semCode?.trim()
    const program = handoff.program?.trim().toLowerCase()
    if (!semCode || !program) return

    let cancelled = false
    getSemestersBySemCode(semCode)
      .then(rows => {
        const row = rows.find(r => r.programName?.trim().toLowerCase() === program)
        if (row && !cancelled) {
          setProgramGuid(row.programGuid)
          setSemesterGuid(row.semesterGuid)
        }
      })
      .catch(() => {
        /* lookup failed: user can pick programme and semester manually */
      })
    return () => { cancelled = true }
  }, [handoff])

  const ready = !!intakeGuid && !!programGuid && !!semesterGuid
  const termParam = termOverride ? (Number(termOverride) as HallTicketTerm) : undefined
  const { data: rows = [], isFetching, isError, error: scopeError } = useHallTicketScopeStudents(
    ready ? { intakeGuid, term: termParam, programGuid, semesterGuid } : null,
    status || null,
    ready,
  )

  const needle = search.trim().toLowerCase()
  const filtered = needle
    ? rows.filter(r =>
        (r.studentRegNo ?? '').toLowerCase().includes(needle) ||
        (r.studentName ?? '').toLowerCase().includes(needle)
      )
    : rows
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const issuedCount = rows.filter(r => r.status === 'Issued').length

  const [printingGuid, setPrintingGuid] = useState<string | null>(null)
  async function handlePrint(studentGuid: string, name: string | null) {
    if (!canPrint) return
    setPrintingGuid(studentGuid)
    try {
      const { blob, filename } = await downloadHallTicketPdf(studentGuid, intakeGuid, termParam)
      downloadBlob(blob, filename)
      showToast(`Hall ticket downloaded for ${name ?? 'the student'}.`, 'ok')
    } catch (e: any) {
      const msg = e?.errors?.[0] || e?.message || 'Could not generate the hall ticket.'
      showToast(msg, 'error')
    } finally {
      setPrintingGuid(null)
    }
  }

  return (
    <>
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="fg">
            <label className="lbl">Academic Intake <span className="req">*</span></label>
            <SearchSelect
              placeholder="— Select Intake —"
              options={intakes.map(i => ({ value: i.intakeGuid, label: formatIntakeLabel(i) }))}
              value={intakeGuid}
              onChange={v => { setIntakeGuid(v); setPage(1) }}
            />
          </div>
          <div className="fg">
            <label className="lbl">Programme <span className="req">*</span></label>
            <SearchSelect
              placeholder="— Select Programme —"
              options={programs.map(p => ({ value: p.programGuid, label: p.programName }))}
              value={programGuid}
              onChange={v => { setProgramGuid(v); setSemesterGuid(''); setPage(1) }}
            />
          </div>
          <div className="fg">
            <label className="lbl">Semester <span className="req">*</span></label>
            <SearchSelect
              placeholder={programGuid ? '— Select Semester —' : 'Pick a programme first'}
              options={semesters.map(s => ({ value: s.semesterGuid, label: s.semName }))}
              value={semesterGuid}
              onChange={v => { setSemesterGuid(v); setPage(1) }}
              disabled={!programGuid}
            />
          </div>
          <div className="fg">
            <label className="lbl">Term Override <span className="text-slate-400 font-normal text-xs">(Optional)</span></label>
            <SearchSelect
              placeholder="Auto"
              options={HALL_TICKET_TERM_OPTIONS}
              value={termOverride}
              onChange={v => { setTermOverride(v); setPage(1) }}
            />
          </div>
        </div>

        <div className="info-box">
          <i className="lni lni-information" style={{ color: 'var(--b700)', fontSize: 15, flexShrink: 0 }}></i>
          <div style={{ fontSize: 12.5 }}>
            Only students with an issued hall ticket can be printed.{' '}
            {canViewIssue ? (
              <>
                Issue tickets on{' '}
                <button
                  type="button"
                  onClick={onGoToIssue}
                  style={{ color: 'var(--b700)', fontWeight: 600, background: 'none', border: 0, padding: 0, cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Issue &amp; Eligibility
                </button>{' '}
                first.
              </>
            ) : (
              'Tickets must be issued first.'
            )}
          </div>
        </div>

        {!canPrint && (
          <div className="warn-box mt-3 text-sm">
            <i className="lni lni-lock mt-0.5"></i>
            <span>You have view-only access — printing hall tickets requires print/issue permission.</span>
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-hdr">
          <div className="card-title"><i className="lni lni-list"></i> Student&apos;s List</div>
          <div className="flex gap-2 flex-wrap" style={{ alignItems: 'center' }}>
            {ready && rows.length > 0 && <span className="badge badge-green">{issuedCount} issued of {rows.length}</span>}
            <SearchSelect
              className="w-44"
              options={STATUS_OPTIONS}
              value={status}
              onChange={v => { setStatus(v as HallTicketIssueStatus | ''); setPage(1) }}
              disabled={!ready}
            />
            <div className="inp-wrap w-56">
              <i className="lni lni-search-alt inp-icon"></i>
              <input
                className="ctrl"
                placeholder="Reg No. or name…"
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1) }}
                disabled={!ready}
              />
            </div>
          </div>
        </div>

        <ScrollTable>
          <table>
            <thead>
              <tr>
                {canPrint && <th style={{ width: 130 }}></th>}
                <th>Student No.</th>
                <th>Student Name</th>
                <th>Batch</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {!ready ? (
                <tr>
                  <td colSpan={canPrint ? 5 : 4} className="text-g400 text-center" style={{ padding: 24 }}>
                    Select an intake, programme and semester to list students.
                  </td>
                </tr>
              ) : isFetching && rows.length === 0 ? (
                <TableLoadingState colSpan={canPrint ? 5 : 4} />
              ) : isError ? (
                <tr>
                  <td colSpan={canPrint ? 5 : 4} className="text-clr-red text-center" style={{ padding: 24 }}>
                    <i className="lni lni-warning"></i> {(scopeError as Error)?.message || "Couldn't load students. Please try again."}
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={canPrint ? 5 : 4} className="text-g400 text-center" style={{ padding: 24 }}>
                    No students match.
                  </td>
                </tr>
              ) : filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map(r => {
                const issued = r.status === 'Issued'
                const isExamOver = r.reasons?.some(rs => rs.code === 'EXAM_OVER')
                return (
                  <tr key={r.studentGuid}>
                    {canPrint && (
                      <td>
                        <button
                          type="button"
                          className="btn btn-neu btn-sm"
                          onClick={() => handlePrint(r.studentGuid, r.studentName)}
                          disabled={!issued || printingGuid !== null || isExamOver}
                          title={
                            isExamOver
                              ? 'Exam is over — hall ticket cannot be printed'
                              : !issued
                                ? 'No hall ticket issued yet — issue it on Issue & Eligibility first'
                                : undefined
                          }
                        >
                          <i className="lni lni-printer"></i> {printingGuid === r.studentGuid ? 'Generating…' : 'Print'}
                        </button>
                      </td>
                    )}
                    <td className="font-mono">{r.studentRegNo ?? '—'}</td>
                    <td className="font-semibold">{r.studentName ?? '—'}</td>
                    <td>{r.batchCode || '—'}</td>
                    <td>
                      <span className={`badge ${issued ? 'badge-green' : 'badge-amber'}`}>
                        {issued ? 'Issued' : 'Not issued'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </ScrollTable>

        {filtered.length > PAGE_SIZE && (
          <Pagination page={page} totalPages={totalPages} totalCount={filtered.length} itemLabel="students" onPageChange={setPage} />
        )}
      </div>
    </>
  )
}
