'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { ScrollTable } from '@/components/ScrollTable'
import { SearchSelect } from '@/components/SearchSelect'
import { MultiSelect } from '@/components/MultiSelect'
import { ReportExportControls } from '@/components/finance/ReportExportControls'
import { useIntakesDropdown } from '@/hooks/academic/useIntakes'
import { useProgramDropdown } from '@/hooks/academic/useProgramMaster'
import { useSemestersForProgram } from '@/hooks/academic/useSemesters'
import {
  STUDENT_STATUSES, StudentsInProgrammeFilters, StudentsInProgrammeRow,
  exportStudentsInProgrammeReport, getStudentsInProgrammePreview,
} from '@/lib/api/student/studentsInProgrammeReport'
import { fmtReportCount, reportErrorMessage } from '@/lib/reportFormat'

// Students in Programme Report — erp-docs/pages/student/students-in-programme-report-page.md.
// Works like the Application Status Report: Process → 15 rows → infinite
// scroll → Export to Excel in the background. No status counts on screen
// (includeSummary=false on every call); the Excel file has the summary.

interface FormState {
  programGuid: string
  semesterGuids: string[]
  intakeGuids: string[]
  statuses: string[]        // MultiSelect values; sent as numbers
}
const EMPTY_FORM: FormState = { programGuid: '', semesterGuids: [], intakeGuids: [], statuses: [] }
const STATUS_OPTIONS = STUDENT_STATUSES.map(s => ({ value: String(s.value), label: s.label }))

function toFilters(f: FormState): StudentsInProgrammeFilters {
  return {
    programGuid: f.programGuid,
    semesterGuids: f.semesterGuids.length ? f.semesterGuids : undefined,
    intakeGuids: f.intakeGuids.length ? f.intakeGuids : undefined,
    statuses: f.statuses.length ? f.statuses.map(Number).sort((a, b) => a - b) : undefined,
  }
}

// Drop Out (3) and Passout (5) are muted.
const STATUS_BADGE: Record<number, string> = { 1: 'badge-green', 2: 'badge-amber', 3: 'badge-grey', 4: 'badge-blue', 5: 'badge-grey' }
const MUTED_STATUSES = new Set([3, 5])

export default function StudentsInProgrammeReportPage() {
  // ── Filter dropdowns (step 1) ───────────────────────────────────────────
  const programsQuery = useProgramDropdown()
  const intakesQuery = useIntakesDropdown()

  // ── Form ────────────────────────────────────────────────────────────────
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [filtersOpen, setFiltersOpen] = useState(true)
  function setField<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm(prev => ({ ...prev, [k]: v }))
  }
  // Semesters belong to the programme, so a new programme clears them.
  function pickProgram(v: string) { setForm(prev => ({ ...prev, programGuid: v, semesterGuids: [] })) }

  const semestersQuery = useSemestersForProgram(form.programGuid || null, !!form.programGuid)

  const programOptions = useMemo(() => (programsQuery.data ?? []).map(p => ({ value: p.programGuid, label: `${p.programName} (${p.programCode})` })), [programsQuery.data])
  const semesterOptions = useMemo(() => (semestersQuery.data ?? []).map(s => ({ value: s.semesterGuid, label: s.semName })), [semestersQuery.data])
  const intakeOptions = useMemo(() => (intakesQuery.data ?? []).map(i => ({ value: i.intakeGuid, label: `${i.intakeCode} — ${i.description}${i.currentIntake ? ' (current)' : ''}` })), [intakesQuery.data])

  // ── Process: the saved copy of the filters ──────────────────────────────
  const [saved, setSaved] = useState<StudentsInProgrammeFilters | null>(null)
  const [savedForm, setSavedForm] = useState<FormState | null>(null)
  // Labels as they were at Process — the semester list changes with the form.
  const [savedSemesterOptions, setSavedSemesterOptions] = useState<{ value: string; label: string }[]>([])
  const [runId, setRunId] = useState(0)

  function handleProcess() {
    if (!form.programGuid) return
    setSaved(toFilters(form))
    setSavedForm(form)
    setSavedSemesterOptions(semesterOptions)
    setRunId(r => r + 1)
    setFiltersOpen(false)
  }

  function handleReset() { setForm(EMPTY_FORM) }

  // ── Preview: infinite scroll ────────────────────────────────────────────
  const preview = useInfiniteQuery({
    queryKey: ['students', 'students-in-programme-report', runId, saved],
    queryFn: ({ pageParam }) => getStudentsInProgrammePreview(saved as StudentsInProgrammeFilters, pageParam),
    initialPageParam: 1,
    getNextPageParam: (last, all) => {
      const loaded = all.reduce((n, p) => n + p.rows.items.length, 0)
      return loaded < last.rows.totalCount && last.rows.items.length > 0 ? all.length + 1 : undefined
    },
    enabled: !!saved,
    gcTime: 0,
  })

  const pages = preview.data?.pages ?? []
  const rows: StudentsInProgrammeRow[] = useMemo(() => pages.flatMap(p => p.rows.items), [pages])
  const totalCount = pages[0]?.rows.totalCount ?? 0
  const hasResult = pages.length > 0
  const isEmpty = hasResult && totalCount === 0
  const firstPageFailed = preview.isError && !hasResult
  const nextPageFailed = preview.isFetchNextPageError
  const processing = preview.isFetching && !preview.isFetchingNextPage

  // Next page as the sentinel nears the bottom — never while a request is
  // running, never automatically after a failure (that waits for Retry).
  const sentinelRef = useRef<HTMLTableRowElement>(null)
  useEffect(() => {
    const el = sentinelRef.current
    const root = el?.closest('.tbl-wrap')
    if (!el || !root) return
    const io = new IntersectionObserver(entries => {
      if (entries[0]?.isIntersecting && preview.hasNextPage && !preview.isFetching && !preview.isFetchNextPageError) {
        preview.fetchNextPage()
      }
    }, { root, rootMargin: '240px 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [preview.hasNextPage, preview.isFetching, preview.isFetchNextPageError, preview.fetchNextPage, rows.length])

  // Recap chips for the filters the CURRENT result was built from.
  const recap = useMemo(() => {
    if (!savedForm) return []
    const f = savedForm
    const many = (opts: { value: string; label: string }[], vals: string[], noun: string) =>
      vals.length === 1 ? (opts.find(o => o.value === vals[0])?.label ?? '1 selected') : `${vals.length} ${noun}`
    const chips: { label: string; value: string }[] = []
    chips.push({ label: 'Programme', value: programOptions.find(o => o.value === f.programGuid)?.label ?? '1 selected' })
    if (f.semesterGuids.length) chips.push({ label: 'Semester', value: many(savedSemesterOptions, f.semesterGuids, 'semesters') })
    if (f.intakeGuids.length) chips.push({ label: 'Intake', value: many(intakeOptions, f.intakeGuids, 'intakes') })
    if (f.statuses.length) chips.push({ label: 'Status', value: many(STATUS_OPTIONS, f.statuses, 'statuses') })
    return chips
  }, [savedForm, programOptions, savedSemesterOptions, intakeOptions])

  const COLS = 9

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="page active">
      <div className="pg-hdr">
        <div>
          <div className="pg-title">Students in Programme Report</div>
          <div className="pg-sub">Every student of one programme · semester, batch, intake, campus, status and sponsor</div>
        </div>
      </div>

      {/* Filters */}
      <div className="card" id="rpt-filters">
        {filtersOpen ? (
          <>
            <div className="rpt-filter-grid">
              <div className="fg m-0 span2">
                <label className="lbl">Programme <span className="req">*</span></label>
                <SearchSelect placeholder="Select a programme" options={programOptions} value={form.programGuid} onChange={pickProgram} isLoading={programsQuery.isLoading} />
              </div>
              <div className="fg m-0 span2">
                <label className="lbl">Semester</label>
                <MultiSelect placeholder={form.programGuid ? 'All semesters' : 'Choose a programme first'} options={semesterOptions} value={form.semesterGuids} onChange={v => setField('semesterGuids', v)} disabled={!form.programGuid} isLoading={semestersQuery.isFetching} />
              </div>
              <div className="fg m-0 span2">
                <label className="lbl">Intake</label>
                <MultiSelect placeholder="All intakes" options={intakeOptions} value={form.intakeGuids} onChange={v => setField('intakeGuids', v)} isLoading={intakesQuery.isLoading} />
              </div>
              <div className="fg m-0 span2">
                <label className="lbl">Student status</label>
                <MultiSelect placeholder="All statuses" options={STATUS_OPTIONS} value={form.statuses} onChange={v => setField('statuses', v)} />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 mt-4">
              <span className="text-g400 mr-auto" style={{ fontSize: 'var(--fs-sm)' }}>Programme is required. Every other filter is optional.</span>
              <button type="button" className="btn btn-neu btn-sm" onClick={handleReset}>Reset</button>
              <button type="button" className="btn btn-primary btn-sm" onClick={handleProcess} disabled={processing || !form.programGuid} aria-busy={processing}>
                <i className={`lni ${processing ? 'lni-spinner-arrow spin' : 'lni-play'}`} aria-hidden="true" /> {processing ? 'Processing…' : 'Process'}
              </button>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-g500" style={{ fontSize: 'var(--fs-sm)', fontWeight: 600 }}>Showing</span>
            <div className="rpt-recap" style={{ flex: 1 }}>
              {recap.map(c => <span key={c.label} className="rpt-chip"><span className="rpt-chip-lbl">{c.label}</span>{c.value}</span>)}
            </div>
            <button type="button" className="btn btn-neu btn-sm" onClick={() => setFiltersOpen(true)}>
              <i className="lni lni-chevron-down" aria-hidden="true" /> Show filters
            </button>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="card">
        {!saved ? (
          <div className="rpt-empty">
            <i className="lni lni-bar-chart" aria-hidden="true" />
            <div className="rpt-empty-title">Choose a programme, then Process</div>
            <div style={{ fontSize: 13 }}>Every student of the programme appears here, in any status.</div>
          </div>
        ) : firstPageFailed ? (
          <div className="rpt-empty">
            <i className="lni lni-warning" aria-hidden="true" style={{ color: 'var(--red)' }} />
            <div className="rpt-empty-title">Couldn’t load the report</div>
            <div style={{ fontSize: 13, marginBottom: 14 }}>{reportErrorMessage(preview.error, 'Something went wrong. Please try again.')}</div>
            <button className="btn btn-neu btn-sm" onClick={() => preview.refetch()}><i className="lni lni-reload" aria-hidden="true" /> Try again</button>
          </div>
        ) : !hasResult ? (
          <div className="rpt-empty">
            <i className="lni lni-spinner-arrow spin" aria-hidden="true" />
            <div className="rpt-empty-title">Building the report…</div>
          </div>
        ) : (
          <>
            <div className="rpt-results-hdr">
              <div className="rpt-count">
                <strong>{fmtReportCount(totalCount)}</strong> students
              </div>
              {!isEmpty && (
                <ReportExportControls
                  resetKey={runId}
                  mockFileName="Students_in_Programme_Report.xlsx"
                  startExport={() => exportStudentsInProgrammeReport(saved)}
                />
              )}
            </div>

            {isEmpty ? (
              <div className="rpt-empty">
                <i className="lni lni-search-alt" aria-hidden="true" />
                <div className="rpt-empty-title">No students for these filters</div>
                <div style={{ fontSize: 13 }}>Try another semester, intake or status, or fewer filters.</div>
              </div>
            ) : (
              <ScrollTable className="rpt-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Reg No</th><th>Student No</th><th>Student Name</th><th>Semester</th><th>Batch</th>
                      <th>Intake</th><th>Campus</th><th>Status</th><th>Sponsor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map(r => (
                      <tr key={r.studentGuid} className={MUTED_STATUSES.has(r.status) ? 'text-g400' : undefined}>
                        <td className="rpt-mono">{r.studentRegNo || '—'}</td>
                        <td className="rpt-mono">{r.studentNum || '—'}</td>
                        <td>{r.studentName || '—'}</td>
                        <td>{r.semesterName || '—'}</td>
                        <td className="rpt-mono">{r.batchCode || '—'}</td>
                        <td>{r.intakeName ?? '—'}</td>
                        <td>{r.campusName ?? '—'}</td>
                        <td><span className={`badge ${STATUS_BADGE[r.status] ?? 'badge-blue'}`}>{r.statusName || '—'}</span></td>
                        <td>{r.sponsorCategory || '—'}</td>
                      </tr>
                    ))}
                    <tr ref={sentinelRef} className="rpt-foot-row">
                      <td colSpan={COLS}>
                        {nextPageFailed ? (
                          <span className="inline-flex items-center gap-3">
                            <span style={{ color: 'var(--red)' }}>Couldn’t load more students.</span>
                            <button className="btn btn-neu btn-sm" onClick={() => preview.fetchNextPage()}><i className="lni lni-reload" aria-hidden="true" /> Retry</button>
                          </span>
                        ) : preview.hasNextPage ? (
                          <span className="inline-flex items-center gap-2"><i className="lni lni-spinner-arrow spin" aria-hidden="true" /> Loading more…</span>
                        ) : (
                          <span>End of report · {fmtReportCount(rows.length)} students</span>
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </ScrollTable>
            )}
          </>
        )}
      </div>
    </div>
  )
}
