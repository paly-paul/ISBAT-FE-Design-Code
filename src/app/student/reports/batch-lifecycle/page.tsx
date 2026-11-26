'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { ScrollTable } from '@/components/ScrollTable'
import { SearchSelect } from '@/components/SearchSelect'
import { MultiSelect } from '@/components/MultiSelect'
import { ReportExportControls } from '@/components/finance/ReportExportControls'
import { useIntakesDropdown } from '@/hooks/academic/useIntakes'
import { getCampusDropdown } from '@/lib/api/academic/campus'
import { getProgramMastersByCampus } from '@/lib/api/academic/programMaster'
import { getSemestersForProgram } from '@/lib/api/academic/semester'
import { getBatchDropdownForSemesters } from '@/lib/api/academic/batch'
import {
  BatchLifecycleFilters, BatchLifecycleRow, exportBatchLifecycleReport, getBatchLifecyclePreview,
} from '@/lib/api/student/batchLifecycleReport'
import { fmtReportCount, reportErrorMessage } from '@/lib/reportFormat'

// Batch Lifecycle Report — erp-docs/pages/students/batch-lifecycle-report-page.md.
// Follows the students admitted in the chosen intakes and shows, per starting
// programme, how many passed out, are still studying, dropped out or moved to
// another programme. Process → page 1 (summary + 15 rows) → infinite scroll
// (includeSummary=false) → Export to Excel in the background, delivered
// through the shared Downloads list.

interface FormState {
  intakeGuids: string[]
  campusGuid: string
  programGuid: string
  semesterGuid: string
  batchGuid: string
}
const EMPTY_FORM: FormState = { intakeGuids: [], campusGuid: '', programGuid: '', semesterGuid: '', batchGuid: '' }

function toFilters(f: FormState): BatchLifecycleFilters {
  return {
    intakeGuids: f.intakeGuids,
    campusGuid: f.campusGuid || undefined,
    programGuid: f.programGuid || undefined,
    semesterGuid: f.semesterGuid || undefined,
    batchGuid: f.batchGuid || undefined,
  }
}

const NARROW_NOTE = 'Started is the whole group. Semester and Batch narrow the outcome columns, and Matching shows how many students match.'

// One decimal and a %.
const fmtPct = (n: number) => `${(n ?? 0).toFixed(1)}%`

// An outcome count; a zero still shows "0", just quieter.
function Count({ n }: { n: number }) {
  return <td className={`num${n ? '' : ' bl-zero'}`}>{fmtReportCount(n)}</td>
}

export default function BatchLifecycleReportPage() {
  // ── Form ────────────────────────────────────────────────────────────────
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [filtersOpen, setFiltersOpen] = useState(true)

  // Changing a filter clears the ones below it.
  function pickCampus(v: string) { setForm(prev => ({ ...prev, campusGuid: v, programGuid: '', semesterGuid: '', batchGuid: '' })) }
  function pickProgram(v: string) { setForm(prev => ({ ...prev, programGuid: v, semesterGuid: '', batchGuid: '' })) }
  function pickSemester(v: string) { setForm(prev => ({ ...prev, semesterGuid: v, batchGuid: '' })) }
  function pickBatch(v: string) { setForm(prev => ({ ...prev, batchGuid: v })) }

  // ── Filter dropdowns (step 1) ───────────────────────────────────────────
  // Intake and Campus on page open; each other list waits for its parent.
  const intakesQuery = useIntakesDropdown()
  const campusesQuery = useQuery({ queryKey: ['academic', 'campus', 'dropdown'], queryFn: getCampusDropdown })
  const programsQuery = useQuery({
    queryKey: ['academic', 'program-master', 'by-campus', form.campusGuid],
    queryFn: () => getProgramMastersByCampus(form.campusGuid),
    enabled: !!form.campusGuid,
  })
  const semestersQuery = useQuery({
    queryKey: ['academic', 'semesters', 'for-program', form.programGuid],
    queryFn: () => getSemestersForProgram(form.programGuid),
    enabled: !!form.programGuid,
  })
  const batchesQuery = useQuery({
    queryKey: ['academic', 'batches', 'dropdown', form.programGuid, [form.semesterGuid]],
    queryFn: () => getBatchDropdownForSemesters(form.programGuid, [form.semesterGuid]),
    enabled: !!form.programGuid && !!form.semesterGuid,
  })

  const intakeOptions = useMemo(() => (intakesQuery.data ?? []).map(i => ({ value: i.intakeGuid, label: i.description })), [intakesQuery.data])
  const campusOptions = useMemo(() => (campusesQuery.data ?? []).map(c => ({ value: c.campusGuid, label: c.campusName })), [campusesQuery.data])
  const programOptions = useMemo(() => (programsQuery.data ?? []).map(p => ({ value: p.programGuid, label: p.programName })), [programsQuery.data])
  const semesterOptions = useMemo(() => (semestersQuery.data ?? []).map(s => ({ value: s.semesterGuid, label: s.semName })), [semestersQuery.data])
  const batchOptions = useMemo(() => (batchesQuery.data ?? []).map(b => ({ value: b.batchGuid, label: b.batchCode })), [batchesQuery.data])

  // ── Process: the saved copy of the filters ──────────────────────────────
  // Every later page and the export reuse THIS, not the live form.
  const [saved, setSaved] = useState<BatchLifecycleFilters | null>(null)
  const [runId, setRunId] = useState(0)
  const tableTopRef = useRef<HTMLDivElement>(null)

  function handleProcess() {
    if (!form.intakeGuids.length) return
    setSaved(toFilters(form))
    setRunId(r => r + 1)
    setFiltersOpen(false)
    tableTopRef.current?.closest('.tbl-wrap')?.scrollTo({ top: 0 })
  }

  function handleReset() { setForm(EMPTY_FORM) }

  // ── Preview: page 1 with summary, then infinite scroll ──────────────────
  const preview = useInfiniteQuery({
    queryKey: ['students', 'batch-lifecycle-report', runId, saved],
    queryFn: ({ pageParam }) => getBatchLifecyclePreview(saved as BatchLifecycleFilters, pageParam),
    initialPageParam: 1,
    getNextPageParam: (last, all) => {
      const loaded = all.reduce((n, p) => n + p.rows.items.length, 0)
      return loaded < last.rows.totalCount && last.rows.items.length > 0 ? all.length + 1 : undefined
    },
    enabled: !!saved,
    gcTime: 0,
  })

  const pages = preview.data?.pages
  const rows: BatchLifecycleRow[] = useMemo(() => (pages ?? []).flatMap(p => p.rows.items), [pages])
  // Summary comes from the page-1 response only and stays while scrolling.
  const summary = pages?.[0]?.summary ?? null
  const totalCount = pages?.[0]?.rows.totalCount ?? 0
  const hasResult = !!pages?.length
  const isEmpty = hasResult && totalCount === 0
  const firstPageFailed = preview.isError && !hasResult
  const nextPageFailed = preview.isFetchNextPageError
  const processing = preview.isFetching && !preview.isFetchingNextPage
  // Semester or Batch chosen: extra Matching column and the note.
  const narrowed = !!(saved?.semesterGuid || saved?.batchGuid)

  // Load the next page as the sentinel row nears the bottom of the scroll box —
  // never while a request is running, never automatically after a failure.
  const sentinelRef = useRef<HTMLTableRowElement>(null)
  const { hasNextPage, isFetching, isFetchNextPageError, fetchNextPage } = preview
  useEffect(() => {
    const el = sentinelRef.current
    const root = el?.closest('.tbl-wrap')
    if (!el || !root) return
    const io = new IntersectionObserver(entries => {
      if (entries[0]?.isIntersecting && hasNextPage && !isFetching && !isFetchNextPageError) fetchNextPage()
    }, { root, rootMargin: '240px 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [hasNextPage, isFetching, isFetchNextPageError, fetchNextPage, rows.length])

  const COLS = narrowed ? 9 : 8

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="page active">
      {/* The Show / Hide filters toggle sits in the header (page doc layout),
          so a collapsed filter section leaves no empty card behind. */}
      <div className="pg-hdr">
        <div>
          <div className="pg-title">Batch Lifecycle Report</div>
        </div>
        {saved && (
          <button type="button" className="btn btn-neu btn-sm" onClick={() => setFiltersOpen(o => !o)} aria-expanded={filtersOpen} aria-controls="rpt-filters">
            <i className={`lni ${filtersOpen ? 'lni-chevron-up' : 'lni-chevron-down'}`} aria-hidden="true" /> {filtersOpen ? 'Hide filters' : 'Show filters'}
          </button>
        )}
      </div>

      {/* Filters */}
      {filtersOpen && (
      <div className="card" id="rpt-filters">
          <>
            <div className="rpt-filter-grid">
              <div className="fg m-0 span2">
                <label className="lbl">Intake <span className="req">*</span></label>
                <MultiSelect placeholder="Select one or more intakes" options={intakeOptions} value={form.intakeGuids} onChange={v => setForm(prev => ({ ...prev, intakeGuids: v }))} isLoading={intakesQuery.isLoading} />
              </div>
              <div className="fg m-0 span2">
                <label className="lbl">Campus</label>
                <SearchSelect placeholder="All campuses" options={campusOptions} value={form.campusGuid} onChange={pickCampus} isLoading={campusesQuery.isLoading} />
                <p className="text-g400" style={{ fontSize: 12, marginTop: 4 }}>The campus the student studies at today.</p>
              </div>
              <div className="fg m-0 span2">
                <label className="lbl">Programme</label>
                <SearchSelect placeholder={form.campusGuid ? 'All programmes' : 'Choose a campus first'} options={programOptions} value={form.programGuid} onChange={pickProgram} disabled={!form.campusGuid} isLoading={programsQuery.isFetching} />
              </div>
              <div className="fg m-0">
                <label className="lbl">Semester</label>
                <SearchSelect placeholder={form.programGuid ? 'All semesters' : 'Choose a programme first'} options={semesterOptions} value={form.semesterGuid} onChange={pickSemester} disabled={!form.programGuid} isLoading={semestersQuery.isFetching} />
              </div>
              <div className="fg m-0">
                <label className="lbl">Batch</label>
                <SearchSelect placeholder={form.semesterGuid ? 'All batches' : 'Choose a semester first'} options={batchOptions} value={form.batchGuid} onChange={pickBatch} disabled={!form.semesterGuid} isLoading={batchesQuery.isFetching} />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 mt-4">
              <button type="button" className="btn btn-neu btn-sm" onClick={handleReset}>Reset</button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleProcess}
                disabled={processing || !form.intakeGuids.length}
                aria-busy={processing}
                title={!form.intakeGuids.length ? 'Select at least one intake' : undefined}
                aria-describedby={!form.intakeGuids.length ? 'bl-intake-required' : undefined}
              >
                <i className={`lni ${processing ? 'lni-spinner-arrow spin' : 'lni-play'}`} aria-hidden="true" /> {processing ? 'Processing…' : 'Process'}
              </button>
              <span id="bl-intake-required" className="sr-only">Select at least one intake</span>
            </div>
          </>
      </div>
      )}

      {/* Results */}
      {saved && (
      <div className="card">
        {firstPageFailed ? (
          <div className="rpt-empty">
            <i className="lni lni-warning" aria-hidden="true" style={{ color: 'var(--red)' }} />
            <div style={{ fontSize: 13, marginBottom: 14 }}>{reportErrorMessage(preview.error, 'Something went wrong. Please try again.')}</div>
            <button className="btn btn-neu btn-sm" onClick={() => preview.refetch()}><i className="lni lni-reload" aria-hidden="true" /> Try again</button>
          </div>
        ) : !hasResult ? (
          <div className="rpt-empty" role="status" aria-label="Loading">
            <i className="lni lni-spinner-arrow spin" aria-hidden="true" />
          </div>
        ) : isEmpty ? (
          <div className="rpt-empty">
            <i className="lni lni-search-alt" aria-hidden="true" />
            <div className="rpt-empty-title">No students for these filters</div>
          </div>
        ) : (
          <>
            <div className="rpt-results-hdr">
              <div className="rpt-count">
                <strong>{fmtReportCount(summary?.totalPrograms ?? totalCount)}</strong> programmes · <strong>{fmtReportCount(summary?.started ?? 0)}</strong> students started
              </div>
              <ReportExportControls
                resetKey={runId}
                mockFileName="Batch_Lifecycle_Report.xlsx"
                startExport={() => exportBatchLifecycleReport(saved)}
                hideWithoutPermission
              />
            </div>

            {narrowed && (
              <div className="bl-note" role="note">
                <i className="lni lni-information" aria-hidden="true"></i>
                <span>{NARROW_NOTE}</span>
              </div>
            )}

            {/* Started leads (every outcome is a share of it), the two rates
                sit behind a divider, and zeros recede so real counts stand out. */}
            <ScrollTable className="rpt-scroll bl-table">
              <div ref={tableTopRef} />
              <table>
                <thead>
                  <tr>
                    <th>Programme</th>
                    <th className="num bl-started">Started</th><th className="num">Passed out</th><th className="num">Still studying</th>
                    <th className="num">Dropped out</th><th className="num">Transferred out</th>
                    <th className="num bl-rate-start">Completion %</th><th className="num">Drop-out %</th>
                    {narrowed && <th className="num bl-rate-start">Matching</th>}
                  </tr>
                </thead>
                <tbody>
                  {rows.map(r => (
                    <tr key={r.programGuid}>
                      <td className="bl-prog">{r.programName || '—'}</td>
                      <td className="num bl-started">{fmtReportCount(r.started)}</td>
                      <Count n={r.passedOut} />
                      <Count n={r.stillStudying} />
                      <Count n={r.droppedOut} />
                      <Count n={r.transferredOut} />
                      <td className="num bl-rate-start">{fmtPct(r.completionPercent)}</td>
                      <td className="num">{fmtPct(r.dropoutPercent)}</td>
                      {narrowed && <td className="num bl-rate-start">{fmtReportCount(r.matching ?? 0)}</td>}
                    </tr>
                  ))}
                  <tr ref={sentinelRef} className="rpt-foot-row">
                    <td colSpan={COLS}>
                      {nextPageFailed ? (
                        <span className="inline-flex items-center gap-3">
                          <span style={{ color: 'var(--red)' }}>Couldn’t load more programmes.</span>
                          <button className="btn btn-neu btn-sm" onClick={() => preview.fetchNextPage()}><i className="lni lni-reload" aria-hidden="true" /> Retry</button>
                        </span>
                      ) : preview.hasNextPage ? (
                        <span className="inline-flex items-center gap-2"><i className="lni lni-spinner-arrow spin" aria-hidden="true" /> Loading more…</span>
                      ) : (
                        <span>End of report</span>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </ScrollTable>

            {/* Pinned summary from page 1 — every programme, not just the
                loaded rows. Same order as the table's columns. */}
            {summary && (
              <section className="rpt-sumtbl bl-summary" aria-labelledby="bl-summary-title">
                <h2 id="bl-summary-title" className="rpt-sumtbl-title bl-summary-title">Summary</h2>
                {/* Two groups (counts, then rates) that wrap as whole units,
                    so a rate never ends up alone on its own line. */}
                <dl className="bl-summary-list">
                  <div className="bl-summary-group">
                    <div className="bl-summary-key"><dt>Started</dt><dd>{fmtReportCount(summary.started)}</dd></div>
                    <div><dt>Passed out</dt><dd>{fmtReportCount(summary.passedOut)}</dd></div>
                    <div><dt>Still studying</dt><dd>{fmtReportCount(summary.stillStudying)}</dd></div>
                    <div><dt>Dropped out</dt><dd>{fmtReportCount(summary.droppedOut)}</dd></div>
                    <div><dt>Transferred out</dt><dd>{fmtReportCount(summary.transferredOut)}</dd></div>
                  </div>
                  <div className="bl-summary-group bl-summary-rates">
                    <div><dt>Completion</dt><dd>{fmtPct(summary.completionPercent)}</dd></div>
                    <div><dt>Drop-out</dt><dd>{fmtPct(summary.dropoutPercent)}</dd></div>
                    {narrowed && <div><dt>Matching</dt><dd>{fmtReportCount(summary.matching ?? 0)}</dd></div>}
                  </div>
                </dl>
              </section>
            )}

            {/* How it's counted — the page doc's on-screen notes, as footnotes
                so they don't push the table down. */}
            <ul className="bl-footnotes">
              <li>A student is counted in the programme they started in. A student who has since moved to another programme is counted there as Transferred out, and not in any other row.</li>
              <li>Passed out only counts students whose passout has been confirmed. Until then they show as Still studying.</li>
              <li>The student list, the Registered / Yet to Register / Yet to Clear split and the dropouts per semester are in the Excel file only.</li>
            </ul>
          </>
        )}
      </div>
      )}
    </div>
  )
}
