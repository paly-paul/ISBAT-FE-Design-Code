'use client'
import { useMemo, useState } from 'react'
import { useQueries, useQuery } from '@tanstack/react-query'
import { SearchSelect } from '@/components/SearchSelect'
import { ScrollTable } from '@/components/ScrollTable'
import { Pagination } from '@/components/Pagination'
import { Toast } from '@/components/Toast'
import { useActionGuard } from '@/hooks/users/useActionGuard'
import {
  FACULTY_CONDUCTED_TARGET, downloadFacultyPctPdf, getFacultyPctPreview, getReportCourseUnits, getReportIntakes,
  getReportLecturers, getReportTerms, type FacultyPctFilters, type FacultyPctRow, type FacultyPctSummary,
} from '@/lib/api/attendance/attendanceReports'
import { AttendancePct, ReportSkeleton, TargetMeter, isBelowTarget, reportErrorMessage, shortGuid } from '@/components/attendance/reportShared'

// Faculty Attendance % (attendance-report-pages-design.md, Page 3): how many
// scheduled sessions each lecturer actually conducted, per course unit, for
// an intake and term (erp-docs/pages/assessment/faculty-attendance-pct-
// report-page.md). The preview returns GUIDs only: lecturer names come from
// the term's lecturer list, unit code/name from each lecturer's course units
// (one cached call per lecturer on the page). The spec blanks a lecturer's
// name after the first row of their group; that read as missing data, so
// every row shows its lecturer, as in the app's other tables. Changing a
// filter clears a loaded report.

const PAGE_SIZES = [15, 30, 50].map(n => ({ value: String(n), label: String(n) }))
const REPORT_KEY = ['attendance', 'reports'] as const

interface Loaded {
  filters: FacultyPctFilters
  labels: { intake: string; term: string; lecturer: string | null }
  summary: FacultyPctSummary | null
  items: FacultyPctRow[]
  totalCount: number
  page: number
  pageSize: number
}

type Phase = 'idle' | 'loading' | 'ready' | 'empty' | 'error'

export default function Page() {
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)
  function showToast(msg: string, type = '') { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }
  const guard = useActionGuard(showToast)

  // ── Filter form ──
  const [intakeGuid, setIntakeGuid] = useState('')
  const [term, setTerm] = useState('')
  const [lecturerGuid, setLecturerGuid] = useState('')

  const intakesQ = useQuery({ queryKey: [...REPORT_KEY, 'intakes'], queryFn: getReportIntakes, staleTime: Infinity })
  const termsQ = useQuery({
    queryKey: [...REPORT_KEY, 'terms', intakeGuid],
    queryFn: () => getReportTerms(intakeGuid),
    enabled: !!intakeGuid,
    staleTime: Infinity,
  })
  const scopeReady = !!intakeGuid && !!term
  const lecturersQ = useQuery({
    queryKey: [...REPORT_KEY, 'lecturers', intakeGuid, term],
    queryFn: () => getReportLecturers(intakeGuid, +term),
    enabled: scopeReady,
    staleTime: Infinity,
  })

  const intakeLabel = intakesQ.data?.find(o => o.value === intakeGuid)?.label ?? ''
  const lecturerLabel = lecturersQ.data?.find(o => o.value === lecturerGuid)?.label ?? null

  // ── Report ──
  const [phase, setPhase] = useState<Phase>('idle')
  const [report, setReport] = useState<Loaded | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [paging, setPaging] = useState(false)
  const [pdfBusy, setPdfBusy] = useState(false)

  const canLoad = scopeReady && phase !== 'loading'
  const canDownload = phase === 'ready' && !!report && report.totalCount > 0 && !pdfBusy

  // Name resolution for rows the preview returned as GUIDs (the real API).
  // Lecturers: the term's lecturer list. Units: each lecturer's course units,
  // fetched once per lecturer on the current page and cached.
  const lecturerNames = useMemo(() => new Map((lecturersQ.data ?? []).map(l => [l.value, l.label])), [lecturersQ.data])
  const pageLecturers = useMemo(
    () => Array.from(new Set((report?.items ?? []).filter(r => r.courseUnitCode == null).map(r => r.lecturerEmployeeGuid))),
    [report],
  )
  const unitLookups = useQueries({
    queries: pageLecturers.map(guid => ({
      queryKey: [...REPORT_KEY, 'units', report?.filters.intakeGuid, String(report?.filters.term), guid],
      queryFn: () => getReportCourseUnits(report!.filters.intakeGuid, report!.filters.term, guid),
      enabled: !!report,
      staleTime: Infinity,
    })),
  })
  const unitsPending = unitLookups.some(q => q.isPending)
  const unitNames = new Map(unitLookups.flatMap(q => q.data ?? []).map(u => [u.value, u]))

  function resetReport() {
    setReport(null)
    setPhase('idle')
  }

  function onIntakeChange(v: string) {
    setIntakeGuid(v)
    setTerm('')
    setLecturerGuid('')
    resetReport()
  }

  function onTermChange(v: string) {
    setTerm(v)
    setLecturerGuid('')
    resetReport()
  }

  function onLecturerChange(v: string) {
    setLecturerGuid(v)
    resetReport()
  }

  async function loadReport() {
    if (!canLoad) return
    const filters: FacultyPctFilters = { intakeGuid, term: +term, lecturerEmployeeGuid: lecturerGuid || null }
    const pageSize = report?.pageSize ?? 15
    setPhase('loading')
    try {
      const res = await getFacultyPctPreview(filters, 1, pageSize, true)
      if (res.totalCount === 0) {
        setReport(null)
        setPhase('empty')
        return
      }
      setReport({
        filters,
        labels: { intake: intakeLabel, term: `Term ${term}`, lecturer: lecturerLabel },
        summary: res.summary, items: res.items, totalCount: res.totalCount, page: 1, pageSize,
      })
      setPhase('ready')
    } catch (e) {
      setReport(null)
      setErrorMsg(reportErrorMessage(e, 'Failed to load report. Please try again.'))
      setPhase('error')
    }
  }

  async function goTo(page: number, pageSize = report?.pageSize ?? 15) {
    if (!report) return
    setPaging(true)
    try {
      const res = await getFacultyPctPreview(report.filters, page, pageSize, false)
      setReport({ ...report, items: res.items, totalCount: res.totalCount, page, pageSize })
    } catch {
      showToast('Failed to load that page. Please try again.', 'error')
    } finally {
      setPaging(false)
    }
  }

  function downloadPdf() {
    if (!report) return
    guard('export', async () => {
      setPdfBusy(true)
      try {
        const { mock } = await downloadFacultyPctPdf(report.filters)
        if (mock) showToast('Preview mode: faculty-attendance-percentage.pdf downloads here with the real API.')
      } catch (e) {
        showToast(reportErrorMessage(e, 'PDF generation failed. Please try again.', 'No faculty attendance records found for the selected filters.'), 'error')
      } finally {
        setPdfBusy(false)
      }
    }, 'this report')
  }

  const totalPages = report ? Math.max(1, Math.ceil(report.totalCount / report.pageSize)) : 1
  const termPlaceholder = !intakeGuid ? 'Select an intake first' : termsQ.isLoading ? 'Loading terms…' : 'Select term…'

  return (
    <>
      <div className="page active" id="page-attendance-faculty-pct">
        <div className="pg-hdr">
          <div>
            <div className="pg-title">Faculty Attendance %</div>
            <div className="pg-sub">Sessions each lecturer conducted out of those scheduled, per course unit, against the {FACULTY_CONDUCTED_TARGET}% target</div>
          </div>
          <button type="button" className="btn btn-neu abd-pdf-btn" onClick={downloadPdf} disabled={!canDownload} aria-busy={pdfBusy}>
            {pdfBusy
              ? <><i className="lni lni-spinner-arrow abd-spin" aria-hidden="true"></i> Generating PDF…</>
              : <><i className="lni lni-download" aria-hidden="true"></i> Download PDF</>}
          </button>
        </div>

        {/* ── Filters ── */}
        <div className="card abd-filters-card">
          <div className="abd-filters abd-filters--scope abd-filters--three">
            <div className="fg abd-filter">
              <label className="lbl">Intake <span className="req">*</span></label>
              <SearchSelect placeholder="Select intake…" options={intakesQ.data ?? []} value={intakeGuid} onChange={onIntakeChange} isLoading={intakesQ.isLoading} />
            </div>
            <div className="fg abd-filter">
              <label className="lbl">Term <span className="req">*</span></label>
              <SearchSelect
                placeholder={termPlaceholder}
                options={termsQ.data ?? []}
                value={term}
                onChange={onTermChange}
                disabled={!intakeGuid || termsQ.isLoading}
                isLoading={termsQ.isLoading}
              />
            </div>
            <div className="fg abd-filter">
              <label className="lbl">Lecturer</label>
              <SearchSelect
                placeholder={scopeReady ? 'All lecturers' : 'Select a term first'}
                options={lecturersQ.data ?? []}
                value={lecturerGuid}
                onChange={onLecturerChange}
                disabled={!scopeReady}
                isLoading={lecturersQ.isLoading}
              />
            </div>
            <div className="abd-filter-actions">
              <button type="button" className="btn btn-primary" onClick={loadReport} disabled={!canLoad} aria-busy={phase === 'loading'}>
                {phase === 'loading'
                  ? <><i className="lni lni-spinner-arrow abd-spin" aria-hidden="true"></i> Loading…</>
                  : <><i className="lni lni-bar-chart" aria-hidden="true"></i> Load Report</>}
              </button>
            </div>
          </div>

          {lecturerGuid ? (
            <div className="abd-chips" aria-label="Active filters">
              <span className="abd-chips-lbl"><i className="lni lni-funnel" aria-hidden="true"></i> Narrowed to</span>
              <span className="abd-chip">
                <span className="abd-chip-key">Lecturer</span> {lecturerLabel}
                <button type="button" className="abd-chip-x" onClick={() => onLecturerChange('')} aria-label={`Remove lecturer filter: ${lecturerLabel ?? ''}`}>
                  <i className="lni lni-close" aria-hidden="true"></i>
                </button>
              </span>
            </div>
          ) : !scopeReady && (
            <p className="abd-filter-hint">
              <i className="lni lni-information" aria-hidden="true"></i>
              Lecturer is optional. Leave it empty to compare every lecturer in the term.
            </p>
          )}
        </div>

        {phase === 'error' && (
          <div className="abd-alert" role="alert">
            <i className="lni lni-warning" aria-hidden="true"></i>
            <div>
              <strong>{errorMsg}</strong>
              <span>Select Load Report to try again.</span>
            </div>
          </div>
        )}

        {phase === 'idle' && (
          <div className="card att-placeholder abd-placeholder">
            <span className="att-placeholder-icon"><i className="lni lni-briefcase" aria-hidden="true"></i></span>
            <div className="att-placeholder-title">{scopeReady ? 'Select Load Report to see the lecturers' : 'Choose an intake and term to begin'}</div>
            <div className="att-placeholder-sub">
              {scopeReady
                ? 'Each lecturer is listed with every course unit they teach, and how many of its scheduled sessions they conducted.'
                : 'The report compares sessions conducted with sessions scheduled for every lecturer in a term. Pick an intake, then its term, then select Load Report.'}
            </div>
          </div>
        )}

        {phase === 'loading' && <ReportSkeleton />}

        {phase === 'empty' && (
          <div className="card att-placeholder abd-placeholder">
            <span className="att-placeholder-icon att-placeholder-icon--amber"><i className="lni lni-search-alt" aria-hidden="true"></i></span>
            <div className="att-placeholder-title">No records found for the selected filters.</div>
            <div className="att-placeholder-sub">
              {lecturerGuid
                ? 'This lecturer has no scheduled sessions in the term. Remove the lecturer filter to see everyone.'
                : 'No sessions have been scheduled for this intake and term yet.'}
            </div>
          </div>
        )}

        {report && phase === 'ready' && (
          <div className="abd-results tab-panel-in">
            {report.summary && <FacultySummary summary={report.summary} />}

            <div className="card abd-panel">
              <div className="abd-context">
                <div className="abd-context-main">
                  <div className="abd-context-title">
                    <h2>{report.labels.intake}</h2>
                    <span className="abd-term-pill">{report.labels.term}</span>
                  </div>
                  <dl className="abd-context-meta">
                    <div><dt><i className="lni lni-user" aria-hidden="true"></i> Lecturer</dt><dd>{report.labels.lecturer ?? 'All lecturers'}</dd></div>
                  </dl>
                </div>
                <span className="abd-count"><strong className="tabular-nums">{report.totalCount}</strong> {report.totalCount === 1 ? 'course unit' : 'course units'}</span>
              </div>

              {/* The app's standard report table (as in Finance's reports):
                  every row carries its lecturer, rows stay sorted by
                  lecturer so a lecturer's units sit together. */}
              <div className={`tbl-refetch-wrap${paging ? ' is-refetching' : ''}`} aria-busy={paging}>
                <ScrollTable className="rpt-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Lecturer</th>
                        <th>Unit Code</th>
                        <th>Unit Name</th>
                        <th className="num">Scheduled</th>
                        <th className="num">Conducted</th>
                        <th className="num">Skipped</th>
                        <th className="num">Conducted %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.items.map((r, i) => (
                        <tr key={`${r.lecturerEmployeeGuid}-${r.courseUnitGuid}`}>
                          <td className="text-g400">{(report.page - 1) * report.pageSize + i + 1}</td>
                          <td style={{ fontWeight: 600 }}>
                            {r.lecturerName ?? lecturerNames.get(r.lecturerEmployeeGuid)
                              ?? (lecturersQ.isPending ? <span className="fd-skel" style={{ width: 130 }} /> : <span className="text-g400" title={r.lecturerEmployeeGuid}>{shortGuid(r.lecturerEmployeeGuid)}</span>)}
                          </td>
                          <td>
                            {(() => {
                              const code = r.courseUnitCode ?? unitNames.get(r.courseUnitGuid)?.code
                              if (code) return <strong className="text-b700">{code}</strong>
                              return unitsPending ? <span className="fd-skel" style={{ width: 60 }} /> : <span className="text-g400" title={r.courseUnitGuid}>{shortGuid(r.courseUnitGuid)}</span>
                            })()}
                          </td>
                          <td>
                            {r.courseUnitName ?? unitNames.get(r.courseUnitGuid)?.name
                              ?? (unitsPending ? <span className="fd-skel" style={{ width: 150 }} /> : <span className="text-g400">—</span>)}
                          </td>
                          <td className="num">{r.totalScheduled}</td>
                          <td className="num">{r.totalConducted}</td>
                          <td className="num">{r.totalSkipped > 0 ? <span className="abd-skipped">{r.totalSkipped}</span> : r.totalSkipped}</td>
                          <td className="num"><AttendancePct pct={r.conductedPct} target={FACULTY_CONDUCTED_TARGET} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </ScrollTable>
              </div>

              <div className="as-footer">
                <label className="as-page-size">
                  Show
                  <SearchSelect style={{ width: 80 }} options={PAGE_SIZES} value={String(report.pageSize)} onChange={v => goTo(1, +v)} />
                  per page
                </label>
                <Pagination page={report.page} totalPages={totalPages} totalCount={report.totalCount} itemLabel="course units" onPageChange={p => goTo(p)} />
              </div>
            </div>
          </div>
        )}
      </div>
      <Toast toast={toast} />
    </>
  )
}

// Same KPI panel as the other two reports (the Finance dashboard's fd-kpi).
function FacultySummary({ summary: s }: { summary: FacultyPctSummary }) {
  const pct = s.overallConductedPct
  const low = pct != null && isBelowTarget(pct, FACULTY_CONDUCTED_TARGET)
  const skippedShare = s.totalScheduled ? Math.round((s.totalSkipped / s.totalScheduled) * 100) : 0

  return (
    <div className="card fd-kpis abd-kpis" aria-live="polite">
      <div className="fd-kpi">
        <span className="fd-kpi-top">
          <span className="fd-kpi-ic" aria-hidden="true"><i className="lni lni-briefcase"></i></span>
          <span className="fd-kpi-lbl">Lecturers</span>
        </span>
        <span className="fd-kpi-num">{s.lecturerCount}</span>
        <span className="fd-kpi-foot">Teaching {s.courseUnitCount} {s.courseUnitCount === 1 ? 'course unit' : 'course units'}</span>
      </div>
      <div className="fd-kpi fd-kpi-green">
        <span className="fd-kpi-top">
          <span className="fd-kpi-ic" aria-hidden="true"><i className="lni lni-checkmark-circle"></i></span>
          <span className="fd-kpi-lbl">Sessions Conducted</span>
        </span>
        <span className="fd-kpi-num">{s.totalConducted}</span>
        <span className="fd-kpi-foot">of {s.totalScheduled} scheduled</span>
      </div>
      <div className={`fd-kpi${s.totalSkipped > 0 ? ' fd-kpi-red' : ''}`}>
        <span className="fd-kpi-top">
          <span className="fd-kpi-ic" aria-hidden="true"><i className="lni lni-ban"></i></span>
          <span className="fd-kpi-lbl">Sessions Skipped</span>
        </span>
        <span className="fd-kpi-num">{s.totalSkipped}</span>
        <span className="fd-kpi-foot">
          {s.totalSkipped > 0
            ? `${skippedShare}% of scheduled · ${s.belowTargetUnitCount} ${s.belowTargetUnitCount === 1 ? 'unit' : 'units'} below ${FACULTY_CONDUCTED_TARGET}%`
            : 'Every scheduled session was held'}
        </span>
      </div>
      <div className={`fd-kpi${pct == null ? '' : low ? ' fd-kpi-red' : ' fd-kpi-green'}`}>
        <span className="fd-kpi-top">
          <span className="fd-kpi-ic" aria-hidden="true"><i className="lni lni-bar-chart"></i></span>
          <span className="fd-kpi-lbl">Conducted %</span>
        </span>
        <span className="fd-kpi-num">{pct == null ? '—' : `${pct.toFixed(1)}%`}</span>
        {pct == null
          ? <span className="fd-kpi-foot">Nothing scheduled yet</span>
          : <TargetMeter pct={pct} target={FACULTY_CONDUCTED_TARGET} label="Overall conducted percentage" />}
      </div>
    </div>
  )
}
