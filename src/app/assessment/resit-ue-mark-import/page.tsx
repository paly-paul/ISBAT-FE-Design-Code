'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Toast } from '@/components/Toast'
import { ScrollTable } from '@/components/ScrollTable'
import { Pagination } from '@/components/Pagination'
import { SuccessPopup } from '@/components/modals/shared/SuccessPopup'
import {
  useDownloadResitUeTemplate,
  useImportResitUeMarks,
  useResitUeExams,
  useResitUeStudents,
} from '@/hooks/assessment/useResitUeMarkImport'
import {
  applyServerErrors,
  parseSheet,
  validateRows,
  type ParsedSheet,
  type PreviewRow,
  type ResitUeExam,
  type ResitUeExamStatus,
} from '@/lib/api/assessment/resitUeMarkImport'
import { readFirstSheet, saveBlob } from '@/lib/xlsx'

// Resit UE Mark Import (resit-ue-mark-import/*.md). Lists the university
// exams of the active resit with their import progress; a To do exam opens an
// import modal: download the template, fill it in, upload it. The sheet is
// read and checked in the browser against the exam's students and mark
// columns, then the rows are sent as JSON — all or nothing on the server.

const PAGE_SIZE = 10

const STATUS_TABS: { status: ResitUeExamStatus; label: string; badge: string; summaryKey: 'toDo' | 'completed' | 'upcoming' | 'notScheduled' }[] = [
  { status: 1, label: 'To do', badge: 'badge-amber', summaryKey: 'toDo' },
  { status: 3, label: 'Upcoming', badge: 'badge-blue', summaryKey: 'upcoming' },
  { status: 4, label: 'Not scheduled', badge: 'badge-grey', summaryKey: 'notScheduled' },
  { status: 2, label: 'Completed', badge: 'badge-green', summaryKey: 'completed' },
]
const statusMeta = (s: number) => STATUS_TABS.find(t => t.status === s) ?? STATUS_TABS[0]

function fmtDate(iso: string | null) {
  if (!iso) return '—'
  const d = new Date(iso)
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function fmtMark(n: number | null | undefined) {
  if (n === null || n === undefined) return '—'
  return Number.isInteger(n) ? String(n) : String(Number(n.toFixed(2)))
}

function errMsg(err: unknown, fallback: string) {
  return (err as { message?: string } | null)?.message || fallback
}

const rowHasErrors = (r: PreviewRow) => Object.keys(r.errors).length > 0
const cloneRows = (rows: PreviewRow[]) => rows.map(r => ({ ...r, marks: { ...r.marks }, errors: Object.fromEntries(Object.entries(r.errors).map(([k, v]) => [k, [...v]])) }))

export default function ResitUeMarkImportPage() {
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)
  function showToast(msg: string, type = '') { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }

  // ── List ─────────────────────────────────────────────────────────────────
  const [status, setStatus] = useState<ResitUeExamStatus | undefined>(1)
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  useEffect(() => {
    const t = setTimeout(() => { if (searchInput.trim() !== search) { setSearch(searchInput.trim()); setPage(1) } }, 400)
    return () => clearTimeout(t)
  }, [searchInput, search])

  const examsQuery = useResitUeExams({ status, search: search || undefined, page, pageSize: PAGE_SIZE })
  const data = examsQuery.data
  const exams = data?.exams.items ?? []
  const totalCount = data?.exams.totalCount ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
  const summary = data?.summary
  const allCount = summary ? summary.toDo + summary.completed + summary.upcoming + summary.notScheduled : 0
  const noResit = !!data && data.resit === null

  // ── Import modal ─────────────────────────────────────────────────────────
  const [importExam, setImportExam] = useState<ResitUeExam | null>(null)
  const [success, setSuccess] = useState<{ title: string; subtitle: string } | null>(null)
  // Stable: SuccessPopup restarts its auto-close timer whenever onClose
  // changes, and the list refetching after an import re-renders this page.
  const closeSuccess = useCallback(() => setSuccess(null), [])

  return (
    <>
      <div className="page active">
        <div className="pg-hdr">
          <div>
            <div className="pg-title">Resit UE Mark Import</div>
            <div className="pg-sub">
              Import university exam marks of the active resit from Excel
              {data?.resit && <> · <strong>{data.resit.refCode}</strong></>}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between flex-wrap gap-2" style={{ paddingRight: 16 }}>
            <div className="tab-bar" style={{ borderBottom: 'none' }}>
              {STATUS_TABS.map(t => (
                <button key={t.status} className={`tab-btn${status === t.status ? ' active' : ''}`} onClick={() => { setStatus(t.status); setPage(1) }}>
                  {t.label} <span className={`badge ${t.badge}`}>{summary?.[t.summaryKey] ?? 0}</span>
                </button>
              ))}
              <button className={`tab-btn${status === undefined ? ' active' : ''}`} onClick={() => { setStatus(undefined); setPage(1) }}>
                All <span className="badge badge-grey">{allCount}</span>
              </button>
            </div>
            <div className="inp-wrap w-64">
              <i className="lni lni-search-alt inp-icon"></i>
              <input className="ctrl" placeholder="Search unit code or name…" maxLength={100} value={searchInput} onChange={e => setSearchInput(e.target.value)} />
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--g200)' }}>
            {examsQuery.isError ? (
              <div className="empty">
                <div className="empty-icon"><i className="lni lni-warning"></i></div>
                <div className="empty-title">Couldn&apos;t load resit exams</div>
                <div className="empty-sub">{errMsg(examsQuery.error, 'Please try again.')}</div>
                <button className="btn btn-neu btn-sm mt-3" onClick={() => examsQuery.refetch()}><i className="lni lni-reload"></i> Retry</button>
              </div>
            ) : examsQuery.isLoading ? (
              <div className="empty"><div className="empty-sub">Loading resit exams…</div></div>
            ) : noResit ? (
              <div className="empty">
                <div className="empty-icon"><i className="lni lni-calendar"></i></div>
                <div className="empty-title">No active resit</div>
                <div className="empty-sub">There is no active resit for the current intake.</div>
              </div>
            ) : exams.length === 0 ? (
              <div className="empty">
                <div className="empty-icon"><i className="lni lni-folder"></i></div>
                <div className="empty-sub">{search ? 'No resit exams match your search.' : status === 1 ? 'Nothing to import — no resit exam is waiting for marks.' : 'No resit exams here.'}</div>
              </div>
            ) : (
              <ScrollTable>
                <table>
                  <thead>
                    <tr>
                      <th>Course Unit</th>
                      <th>Part</th>
                      <th>Exam Date</th>
                      <th>Mark Columns</th>
                      <th>Imported</th>
                      <th>Status</th>
                      <th style={{ width: 150 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {exams.map((e, i) => {
                      const meta = statusMeta(e.status)
                      const pct = e.studentCount > 0 ? Math.round((e.importedCount / e.studentCount) * 100) : 0
                      return (
                        <tr key={e.resitScheduleGuid ?? `${e.unitCode}-${e.part}-${i}`}>
                          <td>
                            <div className="font-mono" style={{ fontWeight: 700 }}>{e.unitCode}</div>
                            <div className="text-xs text-g500">{e.unitName}</div>
                          </td>
                          <td><span className="badge badge-purple">{e.layout}</span></td>
                          <td>{fmtDate(e.examDate)}</td>
                          <td>
                            {e.columns.length ? (
                              <div className="flex gap-1 flex-wrap" style={{ maxWidth: 300 }}>
                                {e.columns.map(c => <span key={c.key} className="badge badge-grey" title={c.label}>{c.header} · {fmtMark(c.maxMark)}</span>)}
                              </div>
                            ) : <span className="text-g400">—</span>}
                            {e.maxMark !== null && <div className="text-xs text-g500 mt-1">Total {fmtMark(e.maxMark)}</div>}
                          </td>
                          <td style={{ minWidth: 140 }}>
                            <div className="text-xs text-g600 mb-1">{e.importedCount} of {e.studentCount} · {e.studentCount - e.importedCount} pending</div>
                            <div className="prog-bar-track" style={{ height: 6 }}>
                              <div className="prog-bar-fill" style={{ width: `${pct}%`, background: pct >= 100 ? 'var(--green)' : 'var(--amber)' }} />
                            </div>
                          </td>
                          <td><span className={`badge ${meta.badge}`}>{meta.label}</span></td>
                          <td>
                            {e.status === 1 && e.resitScheduleGuid ? (
                              <button className="btn btn-primary btn-sm" onClick={() => setImportExam(e)}><i className="lni lni-upload"></i> Import marks</button>
                            ) : (
                              <span className="text-xs text-g400">
                                {e.status === 2 ? 'All marks imported' : e.status === 3 ? 'Exam not held yet' : 'Not scheduled'}
                              </span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </ScrollTable>
            )}
          </div>
          {totalCount > 0 && <Pagination page={page} totalPages={totalPages} totalCount={totalCount} itemLabel="resit exams" onPageChange={setPage} />}
        </div>
      </div>

      {importExam && (
        <ImportModal
          exam={importExam}
          onClose={() => setImportExam(null)}
          showToast={showToast}
          onImported={(n, pending, message) => {
            setImportExam(null)
            setSuccess({
              title: 'Marks imported',
              subtitle: `${message || `Marks of ${n} student${n === 1 ? '' : 's'} imported.`} ${pending > 0 ? `${pending} student${pending === 1 ? '' : 's'} still pending.` : 'This exam is now complete.'}`,
            })
          }}
        />
      )}
      {/* SuccessPopup is content only — it needs its own overlay/modal shell
          (same as Course Allocation's usage). */}
      {success && (
        <div className="modal-overlay open">
          <div className="modal" style={{ maxWidth: 400 }}>
            <SuccessPopup title={success.title} subtitle={success.subtitle} onClose={closeSuccess} />
          </div>
        </div>
      )}
      <Toast toast={toast} />
    </>
  )
}

// ── Import modal ───────────────────────────────────────────────────────────

interface ImportModalProps {
  exam: ResitUeExam
  onClose: () => void
  showToast: (msg: string, type?: string) => void
  onImported: (importedCount: number, pendingCount: number, message?: string | null) => void
}

function ImportModal({ exam, onClose, showToast, onImported }: ImportModalProps) {
  const guid = exam.resitScheduleGuid as string
  const columns = exam.columns
  const pending = exam.studentCount - exam.importedCount

  const studentsQuery = useResitUeStudents(guid)
  const download = useDownloadResitUeTemplate()
  const importMut = useImportResitUeMarks()

  const fileRef = useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [reading, setReading] = useState(false)
  const [parsed, setParsed] = useState<ParsedSheet | null>(null)
  const [readError, setReadError] = useState<string | null>(null)
  // Set after the server rejects rows; replaces the client-side checks until
  // the file changes.
  const [serverRows, setServerRows] = useState<PreviewRow[] | null>(null)
  const [serverMessages, setServerMessages] = useState<string[]>([])
  const [onlyProblems, setOnlyProblems] = useState(false)

  const students = studentsQuery.data
  const rows = useMemo<PreviewRow[] | null>(() => {
    if (serverRows) return serverRows
    if (!parsed) return null
    const copy = cloneRows(parsed.rows)
    return students ? validateRows(copy, columns, students) : copy
  }, [parsed, students, columns, serverRows])

  const problemRows = rows?.filter(rowHasErrors).length ?? 0
  const fileErrors = parsed?.fileErrors ?? []
  const canImport = !!rows && rows.length > 0 && !!students && fileErrors.length === 0 && problemRows === 0 && serverMessages.length === 0 && !importMut.isPending && !reading
  const visibleRows = rows ? (onlyProblems ? rows.filter(rowHasErrors) : rows) : []

  function resetFile() {
    setParsed(null); setFileName(null); setReadError(null); setServerRows(null); setServerMessages([]); setOnlyProblems(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function handleFile(file: File | undefined) {
    setServerRows(null); setServerMessages([]); setReadError(null); setParsed(null); setOnlyProblems(false)
    if (!file) { setFileName(null); return }
    setFileName(file.name)
    if (!file.name.toLowerCase().endsWith('.xlsx')) { setReadError('Upload the Excel template (.xlsx).'); return }
    setReading(true)
    try {
      const sheet = await readFirstSheet(file)
      setParsed(parseSheet(sheet, columns))
    } catch (err) {
      setReadError(errMsg(err, 'The file could not be read.'))
    } finally {
      setReading(false)
    }
  }

  function handleDownload() {
    download.mutate(guid, {
      onSuccess: ({ blob, filename }) => saveBlob(blob, filename ?? `${exam.unitCode}_${exam.layout}_Resit_UE_Template.xlsx`),
      onError: err => showToast(errMsg(err, 'Could not download the template.'), 'error'),
    })
  }

  function handleImport() {
    if (!rows || !canImport) return
    const payload = rows.map(r => ({ slNo: r.slNo, studentNum: r.studentNum.trim(), marks: Object.fromEntries(columns.map(c => [c.key, r.marks[c.key]])) }))
    importMut.mutate({ resitScheduleGuid: guid, rows: payload }, {
      onSuccess: res => onImported(res?.importedCount ?? payload.length, res?.pendingCount ?? 0, res?.message),
      onError: async err => {
        const e = err as { code?: string; message?: string; errors?: string[] }
        if (e.code === 'validation_error' && e.errors?.length) {
          const applied = applyServerErrors(rows, e.errors)
          setServerRows(applied.rows)
          setServerMessages(applied.unmatched)
          setOnlyProblems(true)
        } else if (e.code === 'conflict') {
          // Another user imported some of these students — re-check the file
          // against the fresh list.
          setServerMessages([errMsg(err, 'Marks of some of these students were imported by another user. Check the file again.')])
          await studentsQuery.refetch()
          setServerRows(null)
          setServerMessages([])
          setOnlyProblems(true)
          showToast(errMsg(err, 'Marks of some of these students were imported by another user.'), 'warn')
        } else {
          setServerMessages([errMsg(err, 'The marks could not be imported.')])
        }
      },
    })
  }

  const total = (r: PreviewRow) => columns.reduce((n, c) => n + (r.marks[c.key] ?? 0), 0)

  return (
    <div className="modal-overlay open" onClick={() => !importMut.isPending && onClose()}>
      <div className="modal modal-xl" onClick={e => e.stopPropagation()} style={{ maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}>
        <div className="modal-hdr">
          <div className="modal-title"><i className="lni lni-upload"></i> Import marks — {exam.unitCode} · {exam.layout}</div>
          <button className="modal-close" onClick={onClose} disabled={importMut.isPending}>✕</button>
        </div>

        <div style={{ overflowY: 'auto', flex: 1 }}>
          <div className="text-sm text-g600 mb-3">
            {exam.unitName} · Exam on {fmtDate(exam.examDate)} · {exam.importedCount} of {exam.studentCount} imported, <strong>{pending} pending</strong>
          </div>

          {/* Column guide */}
          <div className="info-box mb-3" style={{ alignItems: 'flex-start' }}>
            <i className="lni lni-information" style={{ color: 'var(--b700)', fontSize: 15, flexShrink: 0, marginTop: 2 }}></i>
            <div style={{ fontSize: 12.5, flex: 1 }}>
              <div className="mb-1">Fill in one mark per column for every student — 0 to the column maximum, up to 2 decimals. Leave <span className="font-mono">SLNO</span>, <span className="font-mono">STUDENTNUM</span> and <span className="font-mono">STUDENTNAME</span> as they are.</div>
              <div className="flex gap-1 flex-wrap">
                {columns.map(c => <span key={c.key} className="badge badge-blue" title={c.label}>{c.header} · max {fmtMark(c.maxMark)}</span>)}
                <span className="badge badge-grey">Total · {fmtMark(exam.maxMark)}</span>
              </div>
            </div>
          </div>

          {/* Steps */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <div className="card" style={{ padding: 14, marginBottom: 0 }}>
              <div className="text-sm" style={{ fontWeight: 700 }}>1. Download the template</div>
              <div className="text-xs text-g500 mb-2">Lists the {pending} pending student{pending === 1 ? '' : 's'}. Students already imported are left out.</div>
              <button className="btn btn-neu btn-sm" onClick={handleDownload} disabled={download.isPending || pending === 0}>
                <i className="lni lni-download"></i> {download.isPending ? 'Preparing…' : 'Download template'}
              </button>
            </div>
            <div className="card" style={{ padding: 14, marginBottom: 0 }}>
              <div className="text-sm" style={{ fontWeight: 700 }}>2. Upload the filled template</div>
              <div className="text-xs text-g500 mb-2">The file is checked here first; nothing is saved until you import.</div>
              <div className="flex gap-2 items-center">
                {/* Cleared on click: re-picking the same file (the usual
                    fix-and-re-upload loop) otherwise fires no change event,
                    leaving the old preview on screen. */}
                <input ref={fileRef} className="ctrl" type="file" accept=".xlsx" onClick={e => { e.currentTarget.value = '' }} onChange={e => handleFile(e.target.files?.[0])} disabled={importMut.isPending} />
                {fileName && <button className="btn btn-neu btn-sm" onClick={resetFile} disabled={importMut.isPending}><i className="lni lni-close"></i></button>}
              </div>
            </div>
          </div>

          {studentsQuery.isError && (
            <div className="danger-box mb-3"><i className="lni lni-warning"></i> {errMsg(studentsQuery.error, 'Could not load the students of this exam.')}</div>
          )}
          {readError && <div className="danger-box mb-3"><i className="lni lni-warning"></i> {readError}</div>}
          {fileErrors.map(m => <div key={m} className="danger-box mb-3"><i className="lni lni-warning"></i> {m}</div>)}
          {serverMessages.map(m => <div key={m} className="danger-box mb-3"><i className="lni lni-warning"></i> {m}</div>)}
          {reading && <div className="text-sm text-g500 mb-3">Reading the file…</div>}
          {rows && studentsQuery.isLoading && <div className="text-sm text-g500 mb-3">Loading the exam&apos;s students to check the file…</div>}

          {/* Preview */}
          {rows && rows.length > 0 && fileErrors.length === 0 && (
            <>
              <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                <div className="flex gap-2 items-center text-sm">
                  <span className="badge badge-blue">{rows.length} row{rows.length === 1 ? '' : 's'}</span>
                  <span className="badge badge-green">{rows.length - problemRows} ready</span>
                  {problemRows > 0 && <span className="badge badge-red">{problemRows} with problems</span>}
                  {serverRows && <span className="text-xs text-g500">Problems reported by the server — fix the file and upload it again.</span>}
                </div>
                {problemRows > 0 && (
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={onlyProblems} onChange={e => setOnlyProblems(e.target.checked)} /> Show only rows with problems
                  </label>
                )}
              </div>
              <ScrollTable>
                <table>
                  <thead>
                    <tr>
                      <th>Row</th>
                      <th>Student No.</th>
                      <th>Name</th>
                      {columns.map(c => <th key={c.key} title={`Max ${fmtMark(c.maxMark)}`}>{c.header}</th>)}
                      <th>Total</th>
                      <th>Problems</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleRows.map(r => {
                      const bad = (col: string) => r.errors[col]?.length ? { background: 'var(--red-bg)', color: 'var(--red)', fontWeight: 700 } : undefined
                      const problems = Object.entries(r.errors).flatMap(([col, msgs]) => msgs.map(m => `${col}: ${m}`))
                      return (
                        <tr key={`${r.slNo}-${r.studentNum}`}>
                          <td className="font-mono">{r.slNo}</td>
                          <td className="font-mono" style={bad('STUDENTNUM')} title={r.errors.STUDENTNUM?.join(' ')}>{r.studentNum || '—'}</td>
                          <td>{r.studentName ?? <span className="text-g400">—</span>}</td>
                          {columns.map(c => (
                            <td key={c.key} className="font-mono" style={bad(c.header)} title={r.errors[c.header]?.join(' ')}>
                              {r.raw[c.header] ? (r.marks[c.key] !== null ? fmtMark(r.marks[c.key]) : r.raw[c.header]) : <span className="text-g400">—</span>}
                            </td>
                          ))}
                          <td className="font-mono" style={{ fontWeight: 700 }}>{fmtMark(total(r))}</td>
                          <td style={{ minWidth: 220 }}>
                            {problems.length
                              ? <div className="text-xs" style={{ color: 'var(--red)' }}>{problems.map(p => <div key={p}>{p}</div>)}</div>
                              : <span className="text-xs" style={{ color: 'var(--green)' }}><i className="lni lni-checkmark"></i> Ready</span>}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </ScrollTable>
            </>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-neu" onClick={onClose} disabled={importMut.isPending}>Cancel</button>
          <span title={problemRows > 0 ? 'Fix the highlighted cells in the file and upload it again.' : undefined}>
            <button className="btn btn-primary" onClick={handleImport} disabled={!canImport}>
              <i className="lni lni-checkmark"></i> {importMut.isPending ? 'Importing…' : rows?.length ? `Import ${rows.length} student${rows.length === 1 ? '' : 's'}` : 'Import'}
            </button>
          </span>
        </div>
      </div>
    </div>
  )
}
