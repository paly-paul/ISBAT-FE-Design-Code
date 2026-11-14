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
import { useHallTicketScopeStudents, HallTicketIssueStatus, HallTicketTerm } from '@/hooks/assessment/useHallTicket'
import { downloadHallTicketPdf } from '@/lib/api/assessment/hallTicketIssue'
import { getSemestersBySemCode } from '@/lib/api/academic/semester'
import { downloadBlob } from '@/lib/downloadBlob'

// Hall Ticket Print (pages/assessment/hall-ticket-print-page.md) — one
// student at a time, successor to legacy frmRptUEHallTicket.
//  1. Intake → Programme → Semester (cascading) + Term.
//  2. GET /bulk lists every registered student of that scope with
//     Issued / NotIssued.
//  3. Print → GET /{studentGuid}/pdf (records the print as a side effect).
//     NotIssued rows can't print — the API would 404 — so the action is
//     disabled and points to the issue page instead.
// Reprinting regenerates the PDF; the QR stays the same. No endpoint says
// whether a ticket was printed before, so there's no reprint prompt.

const PAGE_SIZE = 15
const TERM_OPTIONS = [
  { value: '', label: 'Auto' },
  { value: '1', label: 'Term 1' },
  { value: '2', label: 'Term 2' },
]
const STATUS_OPTIONS = [
  { value: '', label: 'All students' },
  { value: 'Issued', label: 'Issued (printable)' },
  { value: 'NotIssued', label: 'Not issued' },
]

export default function HallTicketPrintPage() {
  const permissions = usePagePermissions()
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)
  function showToast(msg: string, type = '') { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }

  const { data: intakes = [] } = useIntakesDropdown()
  const [intakeGuid, setIntakeGuid] = useState('')
  useEffect(() => {
    if (intakeGuid || intakes.length === 0) return
    setIntakeGuid((intakes.find(i => i.currentIntake) ?? intakes[0]).intakeGuid)
  }, [intakes, intakeGuid])
  const [programGuid, setProgramGuid] = useState('')
  const [semesterGuid, setSemesterGuid] = useState('')
  const [termOverride, setTermOverride] = useState<string>('')
  const [status, setStatus] = useState<HallTicketIssueStatus | ''>('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const { data: programs = [] } = useProgramDropdown()
  const { data: semesters = [] } = useSemestersForProgram(programGuid || null, true)

  // Opened from Hall Ticket Issuance (?term=&semCode=&program=&q=): land on
  // that student. The issue page's search result has names, not GUIDs, so
  // the programme + semester come from the semCode lookup, matched by
  // programme name. No match leaves them for the user to pick; the term and
  // search box are still filled. Read once on mount (static export: no
  // useSearchParams without Suspense).
  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    const t = p.get('term')
    if (t === '1' || t === '2') setTermOverride(t)
    const q = p.get('q')
    if (q) setSearch(q)
    const semCode = p.get('semCode')
    const program = p.get('program')?.trim().toLowerCase()
    if (!semCode || !program) return
    let cancelled = false
    getSemestersBySemCode(semCode)
      .then(rows => {
        const row = rows.find(r => r.programName?.trim().toLowerCase() === program)
        if (row && !cancelled) { setProgramGuid(row.programGuid); setSemesterGuid(row.semesterGuid) }
      })
      .catch(() => { /* lookup failed: the user picks programme + semester as usual */ })
    return () => { cancelled = true }
  }, [])

  const ready = !!intakeGuid && !!programGuid && !!semesterGuid
  const termParam = termOverride ? (Number(termOverride) as HallTicketTerm) : undefined
  const { data: rows = [], isFetching, isError } = useHallTicketScopeStudents(
    ready ? { intakeGuid, term: termParam, programGuid, semesterGuid } : null,
    status || null,
    ready,
  )
  const needle = search.trim().toLowerCase()
  const filtered = needle ? rows.filter(r => (r.studentRegNo ?? '').toLowerCase().includes(needle) || (r.studentName ?? '').toLowerCase().includes(needle)) : rows
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const issuedCount = rows.filter(r => r.status === 'Issued').length

  const [printingGuid, setPrintingGuid] = useState<string | null>(null)
  async function handlePrint(studentGuid: string, name: string | null) {
    setPrintingGuid(studentGuid)
    try {
      const { blob, filename } = await downloadHallTicketPdf(studentGuid, intakeGuid, termParam)
      downloadBlob(blob, filename)
      showToast(`Hall ticket downloaded for ${name ?? 'the student'}.`, 'ok')
    } catch (e: any) {
      const msg = e?.message || ''
      if (/cannot be printed after the exam/i.test(msg)) {
        showToast('Hall ticket cannot be printed after the exam.', 'error')
      } else if (/Could not determine the hall ticket term/i.test(msg)) {
        showToast('Could not determine the hall ticket term. Please select a Term override.', 'error')
      } else {
        showToast(msg || 'Could not generate the hall ticket.', 'error')
      }
    } finally {
      setPrintingGuid(null)
    }
  }

  return (
    <>
      <div className="page active">
        <div className="pg-hdr">
          <div><div className="pg-title">Hall Ticket Print</div><div className="pg-sub">Print one student&apos;s University Exam hall ticket</div></div>
          <Link className="btn btn-neu" href="/assessment/hall-ticket-print-all"><i className="lni lni-printer"></i> Print All</Link>
        </div>

        <div className="card">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="fg">
              <label className="lbl">Academic Intake <span className="req">*</span></label>
              <SearchSelect
                placeholder="— Select Intake —"
                options={intakes.map(i => ({ value: i.intakeGuid, label: i.description ? `${i.description} (${i.intakeCode})` : String(i.intakeCode) }))}
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
                options={TERM_OPTIONS}
                value={termOverride}
                onChange={v => { setTermOverride(v); setPage(1) }}
              />
            </div>
          </div>
          <div className="info-box">
            <i className="lni lni-information" style={{ color: 'var(--b700)', fontSize: 15, flexShrink: 0 }}></i>
            <div style={{ fontSize: 12.5 }}>Only students with an issued hall ticket can be printed. Issue tickets on <Link href="/assessment/hall-ticket" style={{ color: 'var(--b700)', fontWeight: 600 }}>Hall Ticket Issuance</Link> first.</div>
          </div>
        </div>

        <div className="card">
          <div className="card-hdr">
            <div className="card-title"><i className="lni lni-list"></i> Student&apos;s List</div>
            <div className="flex gap-2" style={{ alignItems: 'center' }}>
              {ready && rows.length > 0 && <span className="badge badge-green">{issuedCount} issued of {rows.length}</span>}
              <SearchSelect className="w-44" options={STATUS_OPTIONS} value={status} onChange={v => { setStatus(v as HallTicketIssueStatus | ''); setPage(1) }} disabled={!ready} />
              <div className="inp-wrap w-56">
                <i className="lni lni-search-alt inp-icon"></i>
                <input className="ctrl" placeholder="Reg No. or name…" value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} disabled={!ready} />
              </div>
            </div>
          </div>
          <ScrollTable>
            <table>
              <thead><tr><th style={{ width: 130 }}></th><th>Student No.</th><th>Student Name</th><th>Batch</th><th>Status</th></tr></thead>
              <tbody>
                {!ready ? (
                  <tr><td colSpan={5} className="text-g400 text-center" style={{ padding: 24 }}>Select an intake, programme and semester to list students.</td></tr>
                ) : isFetching && rows.length === 0 ? (
                  <TableLoadingState colSpan={5} />
                ) : isError ? (
                  <tr><td colSpan={5} className="text-clr-red text-center" style={{ padding: 24 }}><i className="lni lni-warning"></i> Couldn&apos;t load students. Please try again.</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={5} className="text-g400 text-center" style={{ padding: 24 }}>No students match.</td></tr>
                ) : filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map(r => {
                  const issued = r.status === 'Issued'
                  const isExamOver = r.reasons?.some(rs => rs.code === 'EXAM_OVER')
                  return (
                    <tr key={r.studentGuid}>
                      <td>
                        {permissions.print !== false && (
                        <button
                          className="btn btn-neu btn-sm"
                          onClick={() => handlePrint(r.studentGuid, r.studentName)}
                          disabled={!issued || printingGuid !== null || isExamOver}
                          title={
                            isExamOver
                              ? 'Exam is over — hall ticket cannot be printed'
                              : !issued
                              ? 'No hall ticket issued yet — issue it on Hall Ticket Issuance first'
                              : undefined
                          }
                        >
                          <i className="lni lni-printer"></i> {printingGuid === r.studentGuid ? 'Generating…' : 'Print'}
                        </button>
                        )}
                      </td>
                      <td className="font-mono">{r.studentRegNo ?? '—'}</td>
                      <td className="font-semibold">{r.studentName ?? '—'}</td>
                      <td>{r.batchCode || '—'}</td>
                      <td><span className={`badge ${issued ? 'badge-green' : 'badge-amber'}`}>{issued ? 'Issued' : 'Not issued'}</span></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </ScrollTable>
          {filtered.length > PAGE_SIZE && <Pagination page={page} totalPages={totalPages} totalCount={filtered.length} itemLabel="students" onPageChange={setPage} />}
        </div>
      </div>
      <Toast toast={toast} />
    </>
  )
}
