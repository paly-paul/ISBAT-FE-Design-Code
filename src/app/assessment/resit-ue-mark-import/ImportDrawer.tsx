'use client'

import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { usePagePermissions } from '@/hooks/users/usePagePermissions'
import { ScrollTable } from '@/components/ScrollTable'
import { Pagination } from '@/components/Pagination'
import {
  useDownloadResitUeTemplate,
  useImportResitUeMarks,
  useResitUeStudents,
} from '@/hooks/assessment/useResitUeMarkImport'
import {
  getResitUeExams,
  parseSheet,
  validateRows,
  type ParsedSheet,
  type PreviewRow,
  type ResitUeExam,
} from '@/lib/api/assessment/resitUeMarkImport'
import { listSheetNames, readSheet, saveBlob } from '@/lib/xlsx'
import { CellErrors, ConfirmCard, SummaryTile, errCode, errMsg, fmtDate, fmtMark } from './parts'

// Import drawer (resit-ue-mark-import-page.md › 3). Opened from a mark
// sheet's "Import from Excel", for the students still without marks, in
// three steps: Template → Upload → Review & save. The sheet is read and
// checked in the browser against the exam's students and mark columns, then
// the rows are sent as JSON — all or nothing on the server.

const PREVIEW_PAGE_SIZE = 25
const MAX_FILE_BYTES = 5 * 1024 * 1024

const rowHasErrors = (r: PreviewRow) => Object.keys(r.errors).length > 0
const problemCount = (r: PreviewRow) => Object.values(r.errors).reduce((n, m) => n + m.length, 0)
const cloneRows = (rows: PreviewRow[]) => rows.map(r => ({ ...r, marks: { ...r.marks }, errors: Object.fromEntries(Object.entries(r.errors).map(([k, v]) => [k, [...v]])) }))

type Step = 1 | 2 | 3

interface DrawerProps {
  exam: ResitUeExam
  showToast: (msg: string, type?: string) => void
  onClose: () => void
  // "Import next exam →": switch the mark sheet behind to that exam and reopen at ①.
  onOpenExam: (exam: ResitUeExam) => void
  // 404 "Resit exam not found." — leave the mark sheet for the exam list.
  onExamGone: () => void
}

export function ImportDrawer({ exam, showToast, onClose, onOpenExam, onExamGone }: DrawerProps) {
  const permissions = usePagePermissions()
  const guid = exam.resitScheduleGuid as string
  const columns = exam.columns
  const studentsQuery = useResitUeStudents(guid)
  const students = studentsQuery.data
  const download = useDownloadResitUeTemplate()
  const importMut = useImportResitUeMarks()
  const saving = importMut.isPending

  const [step, setStep] = useState<Step>(1)
  const [maxStep, setMaxStep] = useState<Step>(1)
  function goStep(s: Step) {
    setStep(s)
    setMaxStep(m => (s > m ? s : m))
    // Back to ① or ② clears the preview.
    if (s < 3) { setParsed(null); setServerErrors([]); setServerMessages([]) }
  }

  // ② Upload state
  const fileRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [sheetNames, setSheetNames] = useState<string[]>([])
  const [sheet, setSheet] = useState('')
  const lastSheetRef = useRef('') // kept for the next (corrected) file
  const [checking, setChecking] = useState(false)
  const [fileError, setFileError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)

  // ③ Review state
  const [parsed, setParsed] = useState<ParsedSheet | null>(null)
  const [serverErrors, setServerErrors] = useState<string[]>([]) // "Row n · COL: msg" from a 400
  const [serverMessages, setServerMessages] = useState<string[]>([]) // ones that map to no cell
  const [onlyProblems, setOnlyProblems] = useState(false)
  const [previewPage, setPreviewPage] = useState(1)
  const [confirmSave, setConfirmSave] = useState(false)
  const [confirmDiscard, setConfirmDiscard] = useState(false)
  const [result, setResult] = useState<{ importedCount: number; pendingCount: number } | null>(null)

  // Students missing → the drawer can't work; 404 = the exam is gone.
  useEffect(() => {
    if (!studentsQuery.isError) return
    showToast(errMsg(studentsQuery.error, 'Could not load the students of this exam.'), 'error')
    if (errCode(studentsQuery.error) === 'not_found') onExamGone()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentsQuery.isError])

  const pending = students ? students.filter(s => !s.imported).length : exam.studentCount - exam.importedCount
  const imported = students ? students.length - pending : exam.importedCount
  const total = students ? students.length : exam.studentCount

  // Client checks against the latest students list, plus any server errors.
  const rows = useMemo<PreviewRow[] | null>(() => {
    if (!parsed || !students) return null
    const checked = validateRows(cloneRows(parsed.rows), columns, students)
    for (const e of serverErrors) {
      const m = /^Row (.+?) · ([A-Z0-9_]+): (.+)$/.exec(e)
      const row = m && checked.find(r => r.slNo === m[1])
      if (row && m && !row.errors[m[2]]?.includes(m[3])) (row.errors[m[2]] ??= []).push(m[3])
    }
    // Rows with problems first, then file order.
    return [...checked].sort((a, b) => Number(rowHasErrors(b)) - Number(rowHasErrors(a)))
  }, [parsed, students, columns, serverErrors])

  const knownNums = useMemo(() => new Set((students ?? []).map(s => s.studentNum.trim().toUpperCase())), [students])
  const problemRows = rows?.filter(rowHasErrors) ?? []
  const problems = problemRows.reduce((n, r) => n + problemCount(r), 0)
  const readyRows = rows?.filter(r => !rowHasErrors(r)) ?? []
  const rowTotal = (r: PreviewRow) => (columns.some(c => r.marks[c.key] === null || r.marks[c.key] === undefined) ? null : columns.reduce((n, c) => n + (r.marks[c.key] ?? 0), 0))
  const readyTotals = readyRows.map(rowTotal).filter((n): n is number => n !== null)
  const average = readyTotals.length ? readyTotals.reduce((a, b) => a + b, 0) / readyTotals.length : null
  const high = readyTotals.length ? Math.max(...readyTotals) : null
  const low = readyTotals.length ? Math.min(...readyTotals) : null
  const canSave = !!rows && rows.length > 0 && problemRows.length === 0 && serverMessages.length === 0 && !saving

  const visible = rows ? (onlyProblems ? problemRows : rows) : []
  const previewPages = Math.max(1, Math.ceil(visible.length / PREVIEW_PAGE_SIZE))
  const pageRows = visible.slice((previewPage - 1) * PREVIEW_PAGE_SIZE, previewPage * PREVIEW_PAGE_SIZE)

  // ── Close (✕ / Esc) ─────────────────────────────────────────────────────
  // The backdrop deliberately doesn't close the drawer (app-wide rule), so a
  // stray click can't throw away a checked file.
  const previewShown = step === 3 && !!rows && !result
  function requestClose() {
    if (saving) return
    if (previewShown) setConfirmDiscard(true)
    else onClose()
  }
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== 'Escape') return
      if (confirmSave || confirmDiscard) { setConfirmSave(false); setConfirmDiscard(false) }
      else requestClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  })

  // ── ① Template ──────────────────────────────────────────────────────────
  function handleDownload() {
    download.mutate(guid, {
      onSuccess: ({ blob, filename }) => {
        saveBlob(blob, filename ?? `${exam.unitCode}_${exam.layout}_Resit_UE_Template.xlsx`)
        goStep(2)
      },
      onError: err => {
        showToast(errMsg(err, 'Could not download the template.'), 'error')
        if (errCode(err) === 'not_found') onExamGone()
      },
    })
  }

  // ── ② Upload ────────────────────────────────────────────────────────────
  async function checkSheet(f: File, name: string) {
    if (!name) { setFileError('Select a sheet.'); return }
    setChecking(true)
    setFileError(null)
    try {
      const data = await readSheet(f, name)
      const p = parseSheet(data, columns)
      if (p.fileErrors.length) { setFileError(p.fileErrors[0]); return }
      lastSheetRef.current = name
      setParsed(p)
      setServerErrors([])
      setServerMessages([])
      setOnlyProblems(false)
      setPreviewPage(1)
      setStep(3)
      setMaxStep(3)
    } catch {
      setFileError('The file could not be read. Upload the template as .xlsx.')
    } finally {
      setChecking(false)
    }
  }

  async function pickFile(f: File | undefined) {
    setFileError(null)
    setSheetNames([])
    setSheet('')
    if (!f) { setFile(null); return }
    setFile(f)
    if (!f.name.toLowerCase().endsWith('.xlsx') || f.size > MAX_FILE_BYTES) {
      setFileError('Upload an .xlsx file of at most 5 MB.')
      return
    }
    let names: string[]
    try { names = await listSheetNames(f) } catch { setFileError('The file could not be read. Upload the template as .xlsx.'); return }
    setSheetNames(names)
    // One sheet, one *_Template sheet, or the sheet used last time → check at once.
    const templates = names.filter(n => n.endsWith('_Template'))
    const auto = names.length === 1 ? names[0]
      : names.includes(lastSheetRef.current) ? lastSheetRef.current
        : templates.length === 1 ? templates[0] : ''
    setSheet(auto)
    if (auto && students) await checkSheet(f, auto)
  }

  // A sheet was auto-picked before the students list arrived: check it now.
  useEffect(() => {
    if (step === 2 && file && sheet && students && !parsed && !fileError && !checking) void checkSheet(file, sheet)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [students])

  // ── ③ Save ──────────────────────────────────────────────────────────────
  function doSave() {
    setConfirmSave(false)
    if (!rows || !canSave) return
    const payload = rows.map(r => ({ slNo: r.slNo, studentNum: r.studentNum.trim(), marks: Object.fromEntries(columns.map(c => [c.key, r.marks[c.key]])) }))
    importMut.mutate({ resitScheduleGuid: guid, rows: payload }, {
      onSuccess: res => setResult({ importedCount: res?.importedCount ?? payload.length, pendingCount: res?.pendingCount ?? 0 }),
      onError: async err => {
        const e = err as { code?: string; errors?: string[] }
        if (e.code === 'not_found') {
          showToast(errMsg(err, 'Resit exam not found.'), 'error')
          onExamGone()
          return
        }
        if (e.code === 'validation_error' || e.code === 'conflict') {
          // Something changed since the check (another import, or a row saved
          // on the mark sheet): reload the students and re-check.
          await studentsQuery.refetch()
          if (e.code === 'conflict') showToast(errMsg(err, 'Marks of some of these students were saved meanwhile.'), 'warn')
          const list = e.errors?.length ? e.errors : [errMsg(err, 'The marks could not be imported.')]
          const cellErrors = list.filter(m => /^Row .+? · [A-Z0-9_]+: .+$/.test(m))
          setServerErrors(cellErrors)
          setServerMessages(e.code === 'validation_error' ? list.filter(m => !cellErrors.includes(m)) : [])
          setOnlyProblems(true)
          setPreviewPage(1)
          return
        }
        setServerMessages([errMsg(err, 'The marks could not be imported.')])
      },
    })
  }

  function downloadProblemList() {
    if (!rows) return
    const q = (s: string) => `"${s.replace(/"/g, '""')}"`
    const lines = ['slNo,matchingCode,studentNum,column,message']
    for (const r of problemRows) for (const [col, msgs] of Object.entries(r.errors)) for (const m of msgs) lines.push([r.slNo, r.matchingCode ?? '', r.studentNum, col, m].map(q).join(','))
    saveBlob(new Blob([lines.join('\r\n')], { type: 'text/csv' }), `${exam.unitCode}_${exam.layout}_Resit_UE_Problems.csv`)
  }

  // ── Import next exam ────────────────────────────────────────────────────
  // The active resit's first To do exam other than this one (the call omits
  // academicIntakeGuid, i.e. the active resit of the current intake).
  const [nextExam, setNextExam] = useState<ResitUeExam | null | undefined>(undefined)
  useEffect(() => {
    if (!result) return
    let cancelled = false
    getResitUeExams({ status: 1, page: 1, pageSize: 2 })
      .then(r => { if (!cancelled) setNextExam(r.exams.items.find(x => x.resitScheduleGuid && x.resitScheduleGuid !== guid) ?? null) })
      .catch(() => { if (!cancelled) setNextExam(null) })
    return () => { cancelled = true }
  }, [result, guid])

  function restartForRest() {
    setResult(null)
    setParsed(null)
    setFile(null)
    setSheetNames([])
    setSheet('')
    setStep(1)
    setMaxStep(1)
    studentsQuery.refetch()
  }

  // ── Render ──────────────────────────────────────────────────────────────
  const STEPS: { n: Step; label: string }[] = [{ n: 1, label: 'Template' }, { n: 2, label: 'Upload' }, { n: 3, label: 'Review & save' }]

  return createPortal(
    <div className="modal-overlay open">
      <div
        className="modal modal-xl modal-flex"
        style={{ width: 'min(960px, 95vw)', height: 'auto', maxHeight: '90vh', borderRadius: 12 }}
        role="dialog"
        aria-modal="true"
        aria-label={`Import marks ${exam.unitCode} ${exam.layout}`}
      >
        <div className="modal-hdr modal-hdr-blue">
          <div className="min-w-0">
            <div className="modal-title flex items-center gap-2">
              <i className="lni lni-upload" style={{ fontSize: 18 }}></i>
              <span>Import marks · {exam.unitCode} {exam.layout}</span>
            </div>
            <div className="text-xs mt-1 truncate" style={{ color: 'rgba(255,255,255,.85)' }}>
              {exam.unitName} · Exam {fmtDate(exam.examDate)} · Max mark {fmtMark(exam.maxMark)}
              <span className="tabular-nums"> · {total} students · {imported} entered · {pending} pending</span>
            </div>
          </div>
          <button className="modal-close" onClick={requestClose} disabled={saving} aria-label="Close">
            <i className="lni lni-close"></i>
          </button>
        </div>

        {!result && (
          <div className="prog-steps">
            {STEPS.map((s, i) => {
              const active = s.n === step
              const done = s.n < step
              const reachable = s.n <= maxStep && !saving
              return (
                <Fragment key={s.n}>
                  {i > 0 && <div className="prog-step-line" />}
                  <div
                    className={`prog-step${active ? ' active' : ''}${done ? ' done' : ''}`}
                    onClick={() => reachable && !active && goStep(s.n)}
                    aria-current={active ? 'step' : undefined}
                    style={{ cursor: reachable && !active ? 'pointer' : 'default', opacity: !reachable && !active ? 0.6 : 1 }}
                  >
                    <span className="prog-step-num">{done ? '✓' : s.n}</span>
                    <span>{s.label}</span>
                  </div>
                </Fragment>
              )
            })}
          </div>
        )}

        <div className="modal-scroll">
          {result ? (
            <div className="text-center py-10">
              <div className="text-5xl mb-3" style={{ color: 'var(--green)' }}><i className="lni lni-checkmark-circle"></i></div>
              <div className="text-lg font-semibold text-g900">{result.importedCount} marks saved for {exam.unitCode} {exam.layout}</div>
              <div className="text-sm text-g500 mt-1">
                {result.pendingCount > 0 ? `${result.pendingCount} students still have no marks.` : 'All students of this exam now have marks.'}
              </div>
              <div className="flex justify-center gap-3 mt-6 flex-wrap">
                <button className="btn btn-neu" onClick={onClose}>Close</button>
                {result.pendingCount > 0 && <button className="btn btn-neu" onClick={restartForRest}><i className="lni lni-download"></i> Download template for the rest</button>}
                {nextExam && <button className="btn btn-primary" onClick={() => onOpenExam(nextExam)}>Import next exam →</button>}
              </div>
            </div>
          ) : step === 1 ? (
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="text-[13px] font-semibold text-g700">Mark columns</div>
                <span className="badge badge-blue">Total {fmtMark(exam.maxMark)}</span>
              </div>
              <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}>
                {columns.map(c => (
                  <div key={c.key} className="rounded-lg px-3 py-2" style={{ border: '1px solid var(--g200)', background: 'var(--g100)' }}>
                    <div className="font-mono font-bold text-[13px] text-g900">{c.header}</div>
                    <div className="text-xs text-g500">{c.label} · max {fmtMark(c.maxMark)}</div>
                  </div>
                ))}
              </div>
              <div className="info-box mt-5 rounded-lg text-sm">
                <i className="lni lni-information mt-0.5" style={{ color: 'var(--b700)' }}></i>
                <ul className="list-disc pl-4 space-y-1 text-g700">
                  <li>Enter a mark in every column for every student; up to 2 decimals.</li>
                  <li>Do not change <span className="font-mono">SLNO</span> or <span className="font-mono">STUDENTNUM</span>. <span className="font-mono">STUDENTNAME</span> and <span className="font-mono">MATCHINGCODE</span> are for reference only.</li>
                  <li>The template holds only the <strong>{pending}</strong> student{pending === 1 ? '' : 's'} still without marks.</li>
                </ul>
              </div>
            </div>
          ) : step === 2 ? (
            <div>
              <div
                role="button"
                tabIndex={0}
                aria-label="Choose the filled template"
                className="rounded-xl text-center cursor-pointer"
                style={{ border: `2px dashed ${dragOver ? 'var(--b500)' : 'var(--g300)'}`, background: dragOver ? 'var(--b50)' : 'var(--g100)', padding: '32px 16px' }}
                onClick={() => fileRef.current?.click()}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileRef.current?.click() } }}
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); setDragOver(false); void pickFile(e.dataTransfer.files?.[0]) }}
              >
                <i className="lni lni-files text-3xl" style={{ color: 'var(--b500)' }}></i>
                <div className="text-sm font-semibold text-g800 mt-2">Drop the filled template here, or browse</div>
                <div className="text-xs text-g500 mt-1">.xlsx only · max 5 MB</div>
                <input ref={fileRef} type="file" accept=".xlsx" className="hidden" onClick={e => { e.currentTarget.value = '' }} onChange={e => void pickFile(e.target.files?.[0])} />
              </div>

              {file && (
                <div className="flex items-center gap-3 mt-4 text-sm">
                  <i className="lni lni-empty-file text-g500"></i>
                  <span className="font-medium text-g800 truncate">{file.name}</span>
                  <span className="text-g500 tabular-nums">· {Math.max(1, Math.round(file.size / 1024))} KB</span>
                  <button className="btn btn-neu btn-sm ml-auto" onClick={() => fileRef.current?.click()} disabled={checking}>Replace</button>
                </div>
              )}

              {fileError && <div className="danger-box mt-3 text-sm"><i className="lni lni-warning"></i> {fileError}</div>}
              {file && !students && !studentsQuery.isError && <div className="text-sm text-g500 mt-3">Loading the exam&apos;s students to check the file…</div>}

              {file && sheetNames.length > 1 && (
                <div className="mt-4">
                  <label className="lbl" htmlFor="rue-sheet">Sheet <span className="text-red-500">*</span></label>
                  <select id="rue-sheet" className="ctrl mt-1" style={{ minWidth: 280 }} value={sheet} onChange={e => setSheet(e.target.value)} disabled={checking}>
                    <option value="">Select a sheet…</option>
                    {sheetNames.map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
              )}
              {checking && <div className="text-sm text-g500 mt-3">Checking the file…</div>}
            </div>
          ) : rows ? (
            <div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                <SummaryTile label="Rows" value={rows.length.toLocaleString()} />
                <SummaryTile label="Ready" value={readyRows.length.toLocaleString()} color="var(--green)" />
                {problemRows.length > 0 && <SummaryTile label={`${problemRows.length} row${problemRows.length === 1 ? '' : 's'} with problems`} value={`${problems} problem${problems === 1 ? '' : 's'}`} color="var(--red)" icon="lni-warning" />}
                <SummaryTile label="Average" value={average === null ? '—' : average.toFixed(1)} />
                <SummaryTile label="High / Low" value={high === null ? '—' : `${fmtMark(high)} / ${fmtMark(low)}`} />
              </div>

              {serverMessages.map(m => <div key={m} className="danger-box mb-3 text-sm"><i className="lni lni-warning"></i> {m}</div>)}

              <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                <div className="flex gap-2">
                  <button className={`btn btn-sm ${!onlyProblems ? 'btn-primary' : 'btn-neu'}`} onClick={() => { setOnlyProblems(false); setPreviewPage(1) }}>All rows</button>
                  <button className={`btn btn-sm ${onlyProblems ? 'btn-primary' : 'btn-neu'}`} onClick={() => { setOnlyProblems(true); setPreviewPage(1) }} disabled={!problemRows.length}>
                    <i className="lni lni-warning"></i> Problems only ({problemRows.length})
                  </button>
                </div>
                {problemRows.length > 0 && <button className="btn btn-neu btn-sm" onClick={downloadProblemList}><i className="lni lni-download"></i> Problem list</button>}
              </div>

              <ScrollTable className="no-sticky-col">
                <table>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', width: 56 }}>SL</th>
                      <th style={{ textAlign: 'left', minWidth: 140 }}>Matching Code</th>
                      <th style={{ textAlign: 'left', minWidth: 160 }}>Reg No.</th>
                      {columns.map(c => <th key={c.key} style={{ textAlign: 'right' }}>{c.label}<div className="font-normal text-g400">({fmtMark(c.maxMark)})</div></th>)}
                      <th style={{ textAlign: 'right' }}>Total<div className="font-normal text-g400">({fmtMark(exam.maxMark)})</div></th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageRows.map(r => {
                      const bad = rowHasErrors(r)
                      const unknown = !!r.studentNum && !knownNums.has(r.studentNum.trim().toUpperCase())
                      const t = rowTotal(r)
                      const all = Object.entries(r.errors).flatMap(([col, msgs]) => msgs.map(m => `${col}: ${m}`)).join('\n')
                      return (
                        <tr key={`${r.slNo}-${r.studentNum}`} style={bad ? { background: 'var(--red-bg)', boxShadow: 'inset 3px 0 0 var(--red)' } : undefined} title={all || undefined}>
                          <td className="font-mono tabular-nums" style={{ textAlign: 'left', verticalAlign: 'top' }}>{r.slNo}</td>
                          <td className="font-mono font-semibold text-g900" style={{ textAlign: 'left', verticalAlign: 'top' }}>
                            {r.matchingCode || '—'}
                          </td>
                          <td style={{ minWidth: 160, textAlign: 'left', verticalAlign: 'top' }}>
                            {unknown && (
                              <div className="font-semibold text-xs" style={{ color: 'var(--red)' }}><i className="lni lni-warning"></i> Unknown student</div>
                            )}
                            <div className="font-mono text-xs font-semibold text-g900">{r.studentNum || '—'}</div>
                            <CellErrors msgs={r.errors.STUDENTNUM} />
                          </td>
                          {columns.map(c => {
                            const msgs = r.errors[c.header]
                            const raw = r.raw[c.header] ?? ''
                            return (
                              <td key={c.key} style={{ textAlign: 'right', verticalAlign: 'top' }}>
                                {raw === '' ? (
                                  <span className="inline-block rounded" style={{ width: 52, height: 22, border: `1px dashed ${msgs ? 'var(--red)' : 'var(--g300)'}` }} aria-label="blank" />
                                ) : (
                                  <span className="inline-block font-mono tabular-nums px-1.5 rounded" style={msgs ? { outline: '1.5px solid var(--red)', color: 'var(--red)', fontWeight: 700 } : undefined}>
                                    {r.marks[c.key] !== null && r.marks[c.key] !== undefined ? Number(r.marks[c.key]).toFixed(2) : raw}
                                  </span>
                                )}
                                <CellErrors msgs={msgs} />
                              </td>
                            )
                          })}
                          <td className="font-mono tabular-nums" style={{ textAlign: 'right', fontWeight: 700, verticalAlign: 'top' }}>{t === null ? '—' : t.toFixed(2)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </ScrollTable>
              {visible.length > PREVIEW_PAGE_SIZE && (
                <Pagination page={previewPage} totalPages={previewPages} totalCount={visible.length} itemLabel="rows" onPageChange={setPreviewPage} />
              )}
            </div>
          ) : (
            <div className="text-sm text-g500 py-10 text-center">Loading the exam&apos;s students to check the file…</div>
          )}
        </div>

        {!result && step === 1 && (
          <div className="modal-footer">
            <button className="btn btn-neu" onClick={() => goStep(2)}>I already have the file →</button>
            {permissions.download && (
              <button className="btn btn-primary" onClick={handleDownload} disabled={download.isPending || pending === 0}>
                <i className="lni lni-download"></i> {download.isPending ? 'Preparing…' : `Download template (${pending} student${pending === 1 ? '' : 's'})`}
              </button>
            )}
          </div>
        )}

        {!result && step === 2 && (
          <div className="modal-footer">
            <button className="btn btn-neu" onClick={() => goStep(1)} disabled={checking}>← Template</button>
            {file && sheetNames.length > 1 && (
              <button className="btn btn-primary" onClick={() => file && void checkSheet(file, sheet)} disabled={checking || !students || !sheet}>
                {checking ? 'Checking…' : 'Check file →'}
              </button>
            )}
          </div>
        )}

        {!result && step === 3 && rows && (
          <div className="modal-footer" style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
            {problemRows.length > 0 ? (
              <>
                <span className="text-sm" style={{ color: 'var(--red)' }}><i className="lni lni-warning"></i> Fix {problems} problem{problems === 1 ? '' : 's'} in the file and upload it again.</span>
                <div className="flex gap-2">
                  <button className="btn btn-neu" onClick={() => goStep(2)}><i className="lni lni-reload"></i> Upload corrected file</button>
                  <button className="btn btn-primary" disabled>Save {rows.length} marks</button>
                </div>
              </>
            ) : (
              <>
                <span className="text-sm text-g500">{serverMessages.length ? 'Fix the problem above and upload the file again.' : 'All rows are ready.'}</span>
                <button className="btn btn-primary" onClick={() => setConfirmSave(true)} disabled={!canSave}>
                  {saving ? <><i className="lni lni-spinner-solid animate-spin"></i> Saving…</> : `Save ${rows.length} marks`}
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {confirmSave && rows && (
        <ConfirmCard
          title="Save resit UE marks?"
          body={`Save the resit UE marks of ${rows.length} students for ${exam.unitCode} ${exam.layout}? Saved marks can be corrected on the mark sheet until they are pushed.`}
          confirmLabel="Save marks"
          onCancel={() => setConfirmSave(false)}
          onConfirm={doSave}
        />
      )}
      {confirmDiscard && (
        <ConfirmCard
          title="Discard the checked file?"
          body="Nothing has been saved."
          confirmLabel="Discard"
          danger
          onCancel={() => setConfirmDiscard(false)}
          onConfirm={onClose}
        />
      )}
    </div>,
    document.body,
  )
}
