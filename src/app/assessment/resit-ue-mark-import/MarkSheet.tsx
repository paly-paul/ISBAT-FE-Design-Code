'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { usePagePermissions } from '@/hooks/users/usePagePermissions'
import { ScrollTable } from '@/components/ScrollTable'
import { Pagination } from '@/components/Pagination'
import { useResitUeMarks, useSaveResitUeStudentMarks } from '@/hooks/assessment/useResitUeMarkImport'
import type { ResitUeExam, ResitUeMarkColumn, ResitUeMarkRow } from '@/lib/api/assessment/resitUeMarkImport'
import { ImportDrawer } from './ImportDrawer'
import { CellErrors, ConfirmCard, PART_BADGE, SummaryTile, errCode, errList, errMsg, fmtDate, fmtMark, fmtMark2 } from './parts'

// Mark sheet of one resit UE exam (resit-ue-mark-import-page.md › 2). Every
// applicant with their saved marks; one row at a time can be edited and
// saved (PUT …/students/{studentGuid}). Pushed rows are locked. Filtering,
// search and paging happen in the browser — the API returns every student.

const ROWS_PER_PAGE = 25
const EXAM_GONE = 'Resit exam not found.'

type Filter = 'all' | 1 | 2

interface EditState {
  studentGuid: string
  studentNum: string
  draft: Record<string, string> // by column key, as typed
  original: Record<string, string>
  server: Record<string, string[]> // by column header, from a 400
}

// Live check of one typed mark (Editing a row, step 3).
function checkMark(text: string, col: ResitUeMarkColumn): string | null {
  const t = text.trim()
  if (t === '') return 'Required.'
  if (!/^-?(\d+\.?\d*|\.\d+)$/.test(t)) return 'Must be a number.'
  const n = Number(t)
  if (n < 0) return 'Cannot be negative.'
  if ((t.split('.')[1] ?? '').length > 2) return 'At most 2 decimals.'
  if (n > col.maxMark) return `Cannot be more than ${fmtMark(col.maxMark)}.`
  return null
}

const toText = (n: number | null | undefined) => (n === null || n === undefined ? '' : String(Number(n.toFixed(2))))

interface MarkSheetProps {
  resitScheduleGuid: string
  // From the exam list: false for a past (inactive) resit, where only
  // corrections are made and Import from Excel is hidden.
  resitActive: boolean
  openImportOnLoad: boolean
  showToast: (msg: string, type?: string) => void
  onBack: () => void
  // "Import next exam →" from the drawer: show that exam and reopen the drawer.
  onSwitchExam: (resitScheduleGuid: string) => void
}

export function MarkSheet({ resitScheduleGuid, resitActive, openImportOnLoad, showToast, onBack, onSwitchExam }: MarkSheetProps) {
  const permissions = usePagePermissions()
  const marksQuery = useResitUeMarks(resitScheduleGuid)
  const sheet = marksQuery.data
  const saveMut = useSaveResitUeStudentMarks(resitScheduleGuid)
  const columns = useMemo(() => sheet?.exam.columns ?? [], [sheet])

  const [filter, setFilter] = useState<Filter>('all')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  // Rows saved while the Pending filter is on stay visible until the filter
  // or page changes, so they don't jump away under the cursor.
  const [sticky, setSticky] = useState<Set<string>>(new Set())
  const [edit, setEdit] = useState<EditState | null>(null)
  const [confirm, setConfirm] = useState<{ studentNum: string; action: () => void } | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const firstInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const t = setTimeout(() => { if (searchInput.trim() !== search) { setSearch(searchInput.trim()); setPage(1); setSticky(new Set()) } }, 300)
    return () => clearTimeout(t)
  }, [searchInput, search])

  // ── Load errors ───────────────────────────────────────────────────────────
  // 404 = the exam (or its resit) is gone: back to the list.
  useEffect(() => {
    if (marksQuery.isError && errCode(marksQuery.error) === 'not_found') {
      showToast(errMsg(marksQuery.error, EXAM_GONE), 'error')
      onBack()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [marksQuery.isError])

  const summary = sheet?.summary
  const canImport = permissions.import && resitActive && (summary?.pendingCount ?? 0) > 0

  // Arriving from "Import next exam →": reopen the drawer once loaded.
  useEffect(() => {
    if (openImportOnLoad && sheet && canImport) setDrawerOpen(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openImportOnLoad, sheet])

  // ── Rows: SL from the full list, then filter → search → page ─────────────
  const allRows = useMemo(() => (sheet?.students ?? []).map((r, i) => ({ row: r, sl: i + 1 })), [sheet])
  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return allRows.filter(({ row }) => {
      if (filter !== 'all' && row.status !== filter && !sticky.has(row.studentGuid)) return false
      if (!q) return true
      return row.studentNum.toLowerCase().includes(q)
        || (row.studentName ?? '').toLowerCase().includes(q)
        || (row.matchingCode ?? '').toLowerCase().includes(q)
    })
  }, [allRows, filter, search, sticky])
  const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE))
  const pageRows = filtered.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE)

  // ── Edit / unsaved-changes guard ─────────────────────────────────────────
  const dirty = !!edit && columns.some(c => (edit.draft[c.key] ?? '') !== (edit.original[c.key] ?? ''))
  const clientErrors: Record<string, string | null> = edit ? Object.fromEntries(columns.map(c => [c.key, checkMark(edit.draft[c.key] ?? '', c)])) : {}
  const hasClientErrors = Object.values(clientErrors).some(Boolean)

  // Runs `action`, first asking to discard an open edit that has changes.
  function guard(action: () => void) {
    if (edit && dirty) setConfirm({ studentNum: edit.studentNum, action: () => { setEdit(null); action() } })
    else { setEdit(null); action() }
  }

  // Closing or reloading the tab with unsaved changes → the browser's prompt.
  useEffect(() => {
    if (!dirty) return
    const onUnload = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = '' }
    window.addEventListener('beforeunload', onUnload)
    return () => window.removeEventListener('beforeunload', onUnload)
  }, [dirty])

  function startEdit(row: ResitUeMarkRow) {
    const original = Object.fromEntries(columns.map(c => [c.key, toText(row.marks?.[c.key])]))
    const open = () => {
      setEdit({ studentGuid: row.studentGuid, studentNum: row.studentNum, draft: { ...original }, original, server: {} })
      requestAnimationFrame(() => firstInputRef.current?.focus())
    }
    if (edit && edit.studentGuid !== row.studentGuid && dirty) setConfirm({ studentNum: edit.studentNum, action: open })
    else open()
  }

  function setCell(col: ResitUeMarkColumn, text: string) {
    setEdit(e => {
      if (!e) return e
      const server = { ...e.server }
      delete server[col.header]
      return { ...e, draft: { ...e.draft, [col.key]: text }, server }
    })
  }

  function saveRow() {
    if (!edit || hasClientErrors || saveMut.isPending) return
    const current = edit
    const marks = Object.fromEntries(columns.map(c => [c.key, Number(current.draft[c.key].trim())]))
    saveMut.mutate({ studentGuid: current.studentGuid, marks }, {
      onSuccess: row => {
        setEdit(null)
        if (filter === 1) setSticky(s => new Set(s).add(row.studentGuid))
        showToast(`Marks saved for ${row.studentNum}.`, 'success')
      },
      onError: err => {
        const code = errCode(err)
        const msg = errMsg(err, 'The marks could not be saved.')
        if (code === 'validation_error') {
          // "{COLUMN}: {message}" → that cell; keep the row in edit mode.
          const server: Record<string, string[]> = {}
          const unmatched: string[] = []
          for (const e of errList(err).length ? errList(err) : [msg]) {
            const m = /^([A-Z0-9_]+): (.+)$/.exec(e)
            if (m && columns.some(c => c.header === m[1])) (server[m[1]] ??= []).push(m[2])
            else unmatched.push(e)
          }
          setEdit(e => (e && e.studentGuid === current.studentGuid ? { ...e, server } : e))
          if (unmatched.length) showToast(unmatched[0], 'error')
          return
        }
        if (code === 'forbidden') { showToast('You do not have permission to change marks.', 'error'); return }
        if (code === 'not_found' && msg === EXAM_GONE) { showToast(msg, 'error'); setEdit(null); onBack(); return }
        if (code === 'conflict' || code === 'not_found') {
          // Pushed meanwhile, saved by someone else, or no longer an
          // applicant: reload so the row shows its real state.
          showToast(msg, 'error')
          setEdit(null)
          marksQuery.refetch()
          return
        }
        showToast(msg, 'error')
      },
    })
  }

  function onCellKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') { e.preventDefault(); saveRow() }
    else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); setEdit(null) }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  const backBtn = (
    <button className="btn btn-neu btn-sm" onClick={() => guard(onBack)}>
      <i className="lni lni-arrow-left"></i> Back
    </button>
  )

  if (marksQuery.isLoading) {
    return (
      <div className="page active">
        <div className="mb-4">{backBtn}</div>
        <div className="card"><div className="empty"><div className="empty-sub">Loading the mark sheet…</div></div></div>
      </div>
    )
  }

  if (marksQuery.isError || !sheet) {
    const notHeld = /not taken place/i.test(errMsg(marksQuery.error, ''))
    return (
      <div className="page active">
        <div className="mb-4">{backBtn}</div>
        <div className="card">
          <div className="empty">
            <div className="empty-icon"><i className={`lni ${notHeld ? 'lni-calendar' : 'lni-warning'}`}></i></div>
            <div className="empty-title">{notHeld ? 'This exam has not taken place yet' : 'Couldn’t load the mark sheet'}</div>
            <div className="empty-sub">{errMsg(marksQuery.error, 'Please try again.')}</div>
            {!notHeld && <button className="btn btn-neu btn-sm mt-3" onClick={() => marksQuery.refetch()}><i className="lni lni-reload"></i> Retry</button>}
          </div>
        </div>
      </div>
    )
  }

  const { exam } = sheet
  const s = summary!
  const drawerExam: ResitUeExam = {
    resitScheduleGuid: exam.resitScheduleGuid,
    unitCode: exam.unitCode,
    unitName: exam.unitName,
    part: exam.part,
    layout: exam.layout,
    examDate: exam.examDate,
    status: 1,
    maxMark: exam.maxMark,
    columns: exam.columns,
    studentCount: s.studentCount,
    importedCount: s.enteredCount + s.pushedCount,
  }
  const FILTERS: { key: Filter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 1, label: `Pending (${s.pendingCount})` },
    { key: 2, label: `Entered (${s.enteredCount})` },
  ]

  return (
    <div className="page active">
      <div className="pg-hdr" style={{ alignItems: 'flex-start' }}>
        <div className="flex items-start gap-3 min-w-0">
          {backBtn}
          <div className="min-w-0">
            <div className="pg-title flex items-center gap-2 flex-wrap">
              <span className="font-mono">{exam.unitCode}</span>
              <span className={`badge ${PART_BADGE[exam.layout] ?? 'badge-grey'}`}>{exam.layout}</span>
            </div>
            <div className="pg-sub">
              {exam.unitName} · Exam {fmtDate(exam.examDate)} · Max mark <span className="tabular-nums">{fmtMark(exam.maxMark)}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap justify-end">
          {canImport && (
            <button className="btn btn-primary" onClick={() => guard(() => setDrawerOpen(true))}>
              <i className="lni lni-upload"></i> Import from Excel
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <SummaryTile label="Students" value={s.studentCount.toLocaleString()} />
        <SummaryTile label="Entered" value={s.enteredCount.toLocaleString()} color="var(--green)" />
        <SummaryTile label="Pending" value={s.pendingCount.toLocaleString()} color={s.pendingCount > 0 ? 'var(--amber)' : undefined} />
        {s.pushedCount > 0 && <SummaryTile label="Pushed" value={s.pushedCount.toLocaleString()} icon="lni-lock-alt" color="var(--g600)" />}
      </div>

      <div className="card">
        <div className="flex items-center justify-between flex-wrap gap-2" style={{ padding: '12px 16px' }}>
          <div className="flex gap-2" role="group" aria-label="Filter students">
            {FILTERS.map(f => (
              <button
                key={String(f.key)}
                className={`btn btn-sm ${filter === f.key ? 'btn-primary' : 'btn-neu'}`}
                aria-pressed={filter === f.key}
                onClick={() => guard(() => { setFilter(f.key); setPage(1); setSticky(new Set()) })}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="inp-wrap w-72">
            <i className="lni lni-search-alt inp-icon"></i>
            <input className="ctrl" placeholder="Student number, name or matching code" aria-label="Search students" value={searchInput} onChange={e => setSearchInput(e.target.value)} />
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--g200)' }}>
          {sheet.students.length === 0 ? (
            <div className="empty">
              <div className="empty-icon"><i className="lni lni-users"></i></div>
              <div className="empty-sub">No student has applied for this resit exam.</div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty"><div className="empty-sub">No student matches.</div></div>
          ) : (
            <ScrollTable className="no-sticky-col rue-grid">
              {/* width 100% instead of the global max-content: columns shrink
                  to the card and long names wrap, so the grid fits without
                  sideways scrolling at normal widths. */}
              <table style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', width: 44 }}>SL</th>
                    <th style={{ textAlign: 'left' }}>Matching code</th>
                    <th style={{ textAlign: 'left', minWidth: 150 }}>Student</th>
                    {columns.map(c => (
                      <th key={c.key} style={{ textAlign: 'right', minWidth: 76 }}>
                        {c.label}<div className="th-max tabular-nums">({fmtMark(c.maxMark)})</div>
                      </th>
                    ))}
                    <th style={{ textAlign: 'right' }}>Total<div className="th-max tabular-nums">({fmtMark(exam.maxMark)})</div></th>
                    <th style={{ width: 1 }}><span className="sr-only">Action</span></th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map(({ row, sl }) => {
                    const editing = edit?.studentGuid === row.studentGuid
                    const saving = editing && saveMut.isPending
                    return (
                      <tr key={row.studentGuid} style={editing ? { background: 'var(--b50)' } : undefined}>
                        <td className="tabular-nums text-g500" style={{ textAlign: 'left', verticalAlign: 'top' }}>{sl}</td>
                        <td className="font-mono tabular-nums" style={{ textAlign: 'left', verticalAlign: 'top' }}>{row.matchingCode ?? ''}</td>
                        <td style={{ textAlign: 'left', verticalAlign: 'top' }}>
                          <div className="font-semibold text-g900">{row.studentName || '—'}</div>
                          <div className="font-mono text-xs text-g500 tabular-nums">{row.studentNum}</div>
                        </td>
                        {columns.map((c, ci) => {
                          if (!editing) {
                            return <td key={c.key} className="font-mono tabular-nums" style={{ textAlign: 'right', verticalAlign: 'top' }}>{fmtMark2(row.marks?.[c.key])}</td>
                          }
                          const msgs = [clientErrors[c.key], ...(edit!.server[c.header] ?? [])].filter((m): m is string => !!m)
                          return (
                            <td key={c.key} style={{ textAlign: 'right', verticalAlign: 'top' }}>
                              <input
                                ref={ci === 0 ? firstInputRef : undefined}
                                className="ctrl font-mono tabular-nums"
                                style={{ width: 68, padding: '6px 8px', textAlign: 'right', marginLeft: 'auto', ...(msgs.length ? { borderColor: 'var(--red)' } : {}) }}
                                inputMode="decimal"
                                aria-label={`${c.label} for ${row.studentNum}`}
                                aria-invalid={msgs.length > 0 || undefined}
                                value={edit!.draft[c.key] ?? ''}
                                disabled={saving}
                                onChange={e => setCell(c, e.target.value)}
                                onKeyDown={onCellKey}
                              />
                              <CellErrors msgs={msgs.length ? [msgs[0]] : undefined} />
                            </td>
                          )
                        })}
                        <td className="font-mono tabular-nums" style={{ textAlign: 'right', fontWeight: 700, verticalAlign: 'top' }}>{fmtMark2(row.total)}</td>
                        <td style={{ verticalAlign: 'top', whiteSpace: 'nowrap' }}>
                          {row.status === 3 ? (
                            <span className="text-xs text-g500 inline-flex items-center gap-1" title="The resit result has been pushed; these marks can no longer be changed.">
                              <i className="lni lni-lock-alt"></i> Pushed
                            </span>
                          ) : editing ? (
                            <div className="flex gap-1.5 justify-end">
                              <button className="btn btn-primary btn-sm" onClick={saveRow} disabled={hasClientErrors || saving}>
                                {saving ? <><i className="lni lni-spinner-solid animate-spin"></i> Saving</> : 'Save'}
                              </button>
                              <button className="btn btn-neu btn-sm" onClick={() => setEdit(null)} disabled={saving}>Cancel</button>
                            </div>
                          ) : permissions.edit ? (
                            <button className="btn btn-neu btn-sm" onClick={() => startEdit(row)} aria-label={`Edit marks of ${row.studentNum}`}>
                              <i className="lni lni-pencil"></i> Edit
                            </button>
                          ) : null}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </ScrollTable>
          )}
        </div>
        {filtered.length > ROWS_PER_PAGE && (
          <Pagination page={page} totalPages={totalPages} totalCount={filtered.length} itemLabel="students" onPageChange={p => guard(() => { setPage(p); setSticky(new Set()) })} />
        )}
      </div>

      {drawerOpen && (
        <ImportDrawer
          key={exam.resitScheduleGuid}
          exam={drawerExam}
          showToast={showToast}
          onClose={() => { setDrawerOpen(false); marksQuery.refetch() }}
          onOpenExam={next => { setDrawerOpen(false); if (next.resitScheduleGuid) onSwitchExam(next.resitScheduleGuid) }}
          onExamGone={() => { setDrawerOpen(false); onBack() }}
        />
      )}

      {confirm && (
        <ConfirmCard
          title={`Discard the changes to ${confirm.studentNum}?`}
          body="Nothing has been saved."
          confirmLabel="Discard"
          danger
          onCancel={() => setConfirm(null)}
          onConfirm={() => { const a = confirm.action; setConfirm(null); a() }}
        />
      )}
    </div>
  )
}
