'use client'

import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Toast } from '@/components/Toast'
import { ScrollTable } from '@/components/ScrollTable'
import { Pagination } from '@/components/Pagination'
import { SearchSelect } from '@/components/SearchSelect'
import { useIntakesDropdown, useCurrentAcademicIntake } from '@/hooks/academic/useIntakes'
import { useResitUeExams } from '@/hooks/assessment/useResitUeMarkImport'
import type { ResitUeExamStatus } from '@/lib/api/assessment/resitUeMarkImport'
import { MarkSheet } from './MarkSheet'
import { PART_BADGE, errMsg, fmtDate } from './parts'

// Resit UE Mark Import (resit-ue-mark-import-page.md). Lists the resit UE
// exams of the chosen Academic Session's resit with their progress; Open
// shows that exam's mark sheet, where marks are entered or corrected one row
// at a time, or imported from Excel for the students still without marks.
//
// Route note: the doc puts the mark sheet at /resit-ue-mark-import/{guid}.
// This app is a static export (no dynamic path segments), so the mark sheet
// lives at ?exam={guid} on this page. The list's session, tab, search and
// page are kept in the query too, so ‹ Back returns to the same place.

const PAGE_SIZE = 10

type TabKey = ResitUeExamStatus | 'all'
const STATUS_TABS: { key: TabKey; label: string; summaryKey?: 'toDo' | 'completed' | 'upcoming' | 'notScheduled' }[] = [
  { key: 1, label: 'To do', summaryKey: 'toDo' },
  { key: 3, label: 'Upcoming', summaryKey: 'upcoming' },
  { key: 4, label: 'Not scheduled', summaryKey: 'notScheduled' },
  { key: 2, label: 'Completed', summaryKey: 'completed' },
  { key: 'all', label: 'All' },
]

function parseTab(v: string | null): TabKey {
  if (v === 'all') return 'all'
  const n = Number(v)
  return n === 1 || n === 2 || n === 3 || n === 4 ? n : 1
}

export default function ResitUeMarkImportPage() {
  return (
    <Suspense>
      <ResitUeMarkImportContent />
    </Suspense>
  )
}

function ResitUeMarkImportContent() {
  const router = useRouter()
  const params = useSearchParams()
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)
  const showToast = useCallback((msg: string, type = '') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }, [])

  // ── URL state ─────────────────────────────────────────────────────────────
  const examGuid = params.get('exam')
  const sessionParam = params.get('session') ?? ''
  const tab = parseTab(params.get('tab'))
  const page = Math.max(1, Number(params.get('page')) || 1)
  const search = params.get('q') ?? ''

  // Defaults (tab 1, page 1, no search, current intake) stay out of the URL.
  function setQuery(patch: Record<string, string | null>, mode: 'push' | 'replace' = 'replace') {
    const next = new URLSearchParams(params.toString())
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === '') next.delete(k)
      else next.set(k, v)
    }
    const qs = next.toString()
    router[mode](qs ? `?${qs}` : '?', { scroll: false })
  }

  // ── Academic Session ──────────────────────────────────────────────────────
  const { data: intakes, isLoading: intakesLoading } = useIntakesDropdown()
  const { data: currentIntake } = useCurrentAcademicIntake()
  const academicIntakeGuid = sessionParam || currentIntake?.intakeGuid || undefined

  // ── Exam list (also gives resit.isActive to the mark sheet) ───────────────
  const status = tab === 'all' ? undefined : tab
  const examsQuery = useResitUeExams(
    { academicIntakeGuid, status, search: search || undefined, page, pageSize: PAGE_SIZE },
    !intakesLoading,
  )
  const data = examsQuery.data
  const exams = data?.exams.items ?? []
  const totalCount = data?.exams.totalCount ?? 0
  const summary = data?.summary
  const noResit = !!data && data.resit === null

  // Search box: debounced 400 ms into the URL, resetting to page 1.
  const [searchInput, setSearchInput] = useState(search)
  useEffect(() => {
    const t = setTimeout(() => { if (searchInput.trim() !== search) setQuery({ q: searchInput.trim().slice(0, 100), page: null }) }, 400)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput])

  // ── List ⇄ mark sheet ─────────────────────────────────────────────────────
  // Back pops the history entry Open pushed; opened by a shared link instead,
  // it replaces the URL with the list.
  const openedHere = useRef(false)
  const [importOnLoad, setImportOnLoad] = useState<string | null>(null)
  function openExam(guid: string) {
    openedHere.current = true
    setQuery({ exam: guid }, 'push')
  }
  function backToList() {
    setImportOnLoad(null)
    if (openedHere.current) { openedHere.current = false; router.back() }
    else setQuery({ exam: null })
    examsQuery.refetch()
  }

  if (examGuid) {
    return (
      <>
        <MarkSheet
          key={examGuid}
          resitScheduleGuid={examGuid}
          resitActive={data?.resit?.isActive ?? false}
          openImportOnLoad={importOnLoad === examGuid}
          showToast={showToast}
          onBack={backToList}
          onSwitchExam={guid => { setImportOnLoad(guid); setQuery({ exam: guid }) }}
        />
        <Toast toast={toast} />
      </>
    )
  }

  let emptyMsg = 'No resit exams here.'
  let allDone = false // To do is empty and nothing is waiting: a success state
  if (search) emptyMsg = `No course unit matches “${search}”.`
  else if (tab === 1) {
    if (summary && summary.upcoming > 0) emptyMsg = `No exam is ready yet. ${summary.upcoming} exam(s) open after their exam date.`
    else { emptyMsg = 'All resit exam marks are entered.'; allDone = true }
  } else if (tab === 4) emptyMsg = 'Every applied unit is scheduled.'

  return (
    <>
      <div className="page active">
        <div className="pg-hdr">
          <div>
            <div className="pg-title">Resit UE Mark Import</div>
            <div className="pg-sub flex items-center gap-2 flex-wrap">
              {data?.resit ? (
                <>
                  <span>Resit ▸ <strong>{data.resit.refCode}</strong></span>
                  {!data.resit.isActive && <span className="badge badge-grey">Past resit</span>}
                </>
              ) : examsQuery.isLoading || intakesLoading ? 'Loading the resit…' : 'No resit'}
            </div>
          </div>
          <div style={{ minWidth: 260 }}>
            <label className="lbl" htmlFor="rue-session">Academic Session</label>
            <SearchSelect
              placeholder="— Select Academic Session —"
              value={academicIntakeGuid ?? ''}
              onChange={v => { setSearchInput(''); setQuery({ session: v === currentIntake?.intakeGuid ? null : v, tab: null, page: null, q: null }) }}
              disabled={intakesLoading}
              options={(intakes ?? []).map(i => ({
                value: i.intakeGuid,
                label: i.description || `Intake ${i.intakeCode}`,
              }))}
            />
          </div>
        </div>

        {noResit ? (
          <div className="warn-box"><i className="lni lni-warning mt-0.5"></i><span>There is no resit in this academic session.</span></div>
        ) : (
          <div className="card">
            <div className="flex items-center justify-between flex-wrap gap-2" style={{ paddingRight: 16 }}>
              <div className="tab-bar" style={{ borderBottom: 'none' }}>
                {STATUS_TABS.map(t => {
                  const count = t.summaryKey ? summary?.[t.summaryKey] ?? 0 : null
                  const badge = t.key === 4 && (count ?? 0) > 0 ? 'badge-amber' : 'badge-grey'
                  return (
                    <button
                      key={String(t.key)}
                      className={`tab-btn${tab === t.key ? ' active' : ''}`}
                      aria-pressed={tab === t.key}
                      onClick={() => setQuery({ tab: t.key === 1 ? null : String(t.key), page: null })}
                    >
                      {t.label} {count !== null && <span className={`badge ${badge}`}>{count.toLocaleString()}</span>}
                    </button>
                  )
                })}
              </div>
              <div className="inp-wrap w-64">
                <i className="lni lni-search-alt inp-icon"></i>
                <input className="ctrl" placeholder="Unit code or name" aria-label="Search course units" maxLength={100} value={searchInput} onChange={e => setSearchInput(e.target.value)} />
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
              ) : examsQuery.isLoading || intakesLoading ? (
                <div className="empty"><div className="empty-sub">Loading resit exams…</div></div>
              ) : exams.length === 0 ? (
                <div className="empty">
                  <div className="empty-icon" style={allDone ? { color: 'var(--green)' } : undefined}>
                    <i className={`lni ${allDone ? 'lni-checkmark-circle' : 'lni-folder'}`} aria-hidden="true"></i>
                  </div>
                  <div className="empty-sub">{emptyMsg}</div>
                </div>
              ) : (
                <ScrollTable className="no-sticky-col">
                  <table>
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'left' }}>Course unit</th>
                        <th>Part</th>
                        <th>Exam date</th>
                        <th>Marks entered</th>
                        <th style={{ width: 160 }}><span className="sr-only">Action</span></th>
                      </tr>
                    </thead>
                    <tbody style={{ opacity: examsQuery.isFetching ? 0.6 : 1 }}>
                      {exams.map((e, i) => {
                        const pct = e.studentCount > 0 ? Math.round((e.importedCount / e.studentCount) * 100) : 0
                        return (
                          <tr key={e.resitScheduleGuid ?? `${e.unitCode}-${e.part}-${i}`}>
                            <td style={{ textAlign: 'left' }}>
                              <div className="font-mono" style={{ fontWeight: 700 }}>{e.unitCode}</div>
                              <div className="text-xs text-g500 truncate max-w-[320px]" title={e.unitName}>{e.unitName}</div>
                            </td>
                            <td><span className={`badge ${PART_BADGE[e.layout] ?? 'badge-grey'}`}>{e.layout}</span></td>
                            <td className="whitespace-nowrap">{fmtDate(e.examDate)}</td>
                            <td style={{ minWidth: 170 }}>
                              {e.status === 3 ? (
                                <span className="text-xs text-g500">Upcoming</span>
                              ) : e.status === 4 ? (
                                <span className="text-xs text-g500">Not scheduled</span>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <div className="prog-bar-track flex-1" style={{ height: 6 }}>
                                    <div className="prog-bar-fill" style={{ width: `${pct}%`, background: pct >= 100 ? 'var(--green)' : 'var(--amber)' }} />
                                  </div>
                                  <span className="text-xs font-mono tabular-nums text-g600 whitespace-nowrap">{e.importedCount} / {e.studentCount}</span>
                                </div>
                              )}
                            </td>
                            <td>
                              {(e.status === 1 || e.status === 2) && e.resitScheduleGuid ? (
                                <button
                                  className={`btn btn-sm ${e.status === 1 ? 'btn-primary' : 'btn-neu'}`}
                                  onClick={() => openExam(e.resitScheduleGuid as string)}
                                  aria-label={`Open the mark sheet of ${e.unitCode} ${e.layout}`}
                                >
                                  Open <i className="lni lni-arrow-right"></i>
                                </button>
                              ) : e.status === 3 ? (
                                <span className="text-xs text-g400">Opens after {fmtDate(e.examDate)}</span>
                              ) : (
                                <Link href="/assessment/resit-scheduling?tab=exam" className="text-xs text-blue hover:underline">Schedule it ↗</Link>
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
            {totalCount > PAGE_SIZE && (
              <Pagination
                page={page}
                totalPages={Math.ceil(totalCount / PAGE_SIZE)}
                totalCount={totalCount}
                itemLabel="resit exams"
                onPageChange={p => setQuery({ page: p === 1 ? null : String(p) })}
              />
            )}
          </div>
        )}
      </div>
      <Toast toast={toast} />
    </>
  )
}
