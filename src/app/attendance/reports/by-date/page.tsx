'use client'
import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { SearchSelect } from '@/components/SearchSelect'
import DatePicker from '@/components/DatePicker'
import { ScrollTable } from '@/components/ScrollTable'
import { Pagination } from '@/components/Pagination'
import { Toast } from '@/components/Toast'
import { useActionGuard } from '@/hooks/users/useActionGuard'
import { parseYmd, skipReasonLabel } from '@/lib/api/attendance/classAttendance'
import {
  STUDENT_ATTENDANCE_TARGET, downloadAttendanceByDatePdf, getAttendanceByDatePreview, getReportIntakes,
  getReportLecturers, getReportTerms, getReportTimetables,
  type AttendanceByDateFilters, type AttendanceByDateRow, type AttendanceByDateSummary, type ReportTimetable,
} from '@/lib/api/attendance/attendanceReports'
import { fmtDate, fmtTime, StatusBadge } from '@/components/attendance/attShared'
import { AttendancePct, Dash, ReportSkeleton, TargetMeter, isBelowTarget, reportErrorMessage } from '@/components/attendance/reportShared'

// Attendance by Date (attendance-report-pages-design.md, Page 1;
// erp-docs/pages/assessment/attendance-by-date-report-page.md): every
// session of one timetable slot, optionally between two dates, with a summary
// of the whole range. No endpoint lists every timetable, so Intake → Term →
// Lecturer narrow it first (the lecturer's timetable lists their slots).
// Load Report runs the filters; paging reloads rows only, never the summary.
// Download PDF always uses the filters that were loaded.

const PAGE_SIZES = [15, 30, 50].map(n => ({ value: String(n), label: String(n) }))
const WEEKDAYS_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const TO_DATE_ERROR = 'To Date must be on or after From Date'
const REPORT_KEY = ['attendance', 'reports'] as const

interface LoadedReport {
  filters: AttendanceByDateFilters
  timetable: ReportTimetable
  summary: AttendanceByDateSummary | null
  items: AttendanceByDateRow[]
  totalCount: number
  page: number
  pageSize: number
}

type Phase = 'idle' | 'loading' | 'ready' | 'empty' | 'error'

function rangeLabel(from: string | null, to: string | null) {
  if (from && to) return `${fmtDate(from)} – ${fmtDate(to)}`
  if (from) return `From ${fmtDate(from)}`
  if (to) return `Up to ${fmtDate(to)}`
  return 'Whole term'
}

export default function Page() {
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)
  function showToast(msg: string, type = '') { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }
  const guard = useActionGuard(showToast)

  // ── Filter form ──
  const [intakeGuid, setIntakeGuid] = useState('')
  const [term, setTerm] = useState('')
  const [lecturerGuid, setLecturerGuid] = useState('')
  const [timetableGuid, setTimetableGuid] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [toError, setToError] = useState<string | null>(null)

  const scopeReady = !!intakeGuid && !!term
  const intakesQ = useQuery({ queryKey: [...REPORT_KEY, 'intakes'], queryFn: getReportIntakes, staleTime: Infinity })
  const termsQ = useQuery({ queryKey: [...REPORT_KEY, 'terms', intakeGuid], queryFn: () => getReportTerms(intakeGuid), enabled: !!intakeGuid, staleTime: Infinity })
  const lecturersQ = useQuery({
    queryKey: [...REPORT_KEY, 'lecturers', intakeGuid, term],
    queryFn: () => getReportLecturers(intakeGuid, +term),
    enabled: scopeReady,
    staleTime: Infinity,
  })
  const timetablesQ = useQuery({
    queryKey: [...REPORT_KEY, 'timetables', intakeGuid, term, lecturerGuid],
    queryFn: () => getReportTimetables(intakeGuid, +term, lecturerGuid),
    enabled: scopeReady && !!lecturerGuid,
    staleTime: Infinity,
  })
  const timetables = useMemo(() => timetablesQ.data ?? [], [timetablesQ.data])
  const timetableOptions = useMemo(() => timetables.map(t => ({
    value: t.timetableGuid,
    label: `${t.courseUnitCode} ${t.courseUnitName} · ${t.batchCode} · ${t.dayName.slice(0, 3)} ${fmtTime(t.startTime)}–${fmtTime(t.endTime)}`,
  })), [timetables])

  // ── Report ──
  const [phase, setPhase] = useState<Phase>('idle')
  const [report, setReport] = useState<LoadedReport | null>(null)
  const [emptyFilters, setEmptyFilters] = useState<AttendanceByDateFilters | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [paging, setPaging] = useState(false)
  const [pdfBusy, setPdfBusy] = useState(false)

  const canLoad = !!timetableGuid && !toError && phase !== 'loading'
  const canDownload = phase === 'ready' && !!report && report.totalCount > 0 && !pdfBusy
  // Dates edited after loading: the report on screen no longer matches the form.
  const stale = !!report && phase === 'ready' && ((fromDate || null) !== report.filters.fromDate || (toDate || null) !== report.filters.toDate)

  function resetReport() {
    setReport(null)
    setEmptyFilters(null)
    setPhase('idle')
  }

  // Each level clears the ones below it.
  function onIntakeChange(v: string) {
    setIntakeGuid(v)
    setTerm('')
    onLecturerChange('')
  }

  function onTermChange(v: string) {
    setTerm(v)
    onLecturerChange('')
  }

  function onLecturerChange(v: string) {
    setLecturerGuid(v)
    onTimetableChange('')
  }

  function onTimetableChange(v: string) {
    setTimetableGuid(v)
    setFromDate('')
    setToDate('')
    setToError(null)
    resetReport()
  }

  function onFromChange(v: string) {
    setFromDate(v)
    if (v && toDate && toDate < v) {
      setToDate('')
      setToError(TO_DATE_ERROR)
    } else {
      setToError(null)
    }
  }

  function onToChange(v: string) {
    setToDate(v)
    setToError(v && fromDate && v < fromDate ? TO_DATE_ERROR : null)
  }

  async function loadReport() {
    if (!canLoad) return
    const timetable = timetables.find(t => t.timetableGuid === timetableGuid)
    if (!timetable) return
    const filters: AttendanceByDateFilters = { timetableGuid, fromDate: fromDate || null, toDate: toDate || null }
    const pageSize = report?.pageSize ?? 15
    setPhase('loading')
    try {
      const res = await getAttendanceByDatePreview(filters, 1, pageSize, true)
      if (res.totalCount === 0) {
        setReport(null)
        setEmptyFilters(filters)
        setPhase('empty')
        return
      }
      setReport({ filters, timetable, summary: res.summary, items: res.items, totalCount: res.totalCount, page: 1, pageSize })
      setPhase('ready')
    } catch (e) {
      setReport(null)
      setErrorMsg(reportErrorMessage(e, 'Failed to load report. Please try again.'))
      setPhase('error')
    }
  }

  // Rows only — the summary covers the whole range and doesn't change.
  async function goTo(page: number, pageSize = report?.pageSize ?? 15) {
    if (!report) return
    setPaging(true)
    try {
      const res = await getAttendanceByDatePreview(report.filters, page, pageSize, false)
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
        const { mock } = await downloadAttendanceByDatePdf(report.filters)
        if (mock) showToast('Preview mode: attendance-by-date.pdf downloads here with the real API.')
      } catch (e) {
        showToast(reportErrorMessage(e, 'PDF generation failed. Please try again.', 'No sessions found for the selected filters.'), 'error')
      } finally {
        setPdfBusy(false)
      }
    }, 'this report')
  }

  function clearDates() {
    setFromDate('')
    setToDate('')
    setToError(null)
    resetReport()
  }

  const totalPages = report ? Math.max(1, Math.ceil(report.totalCount / report.pageSize)) : 1

  return (
    <>
      <div className="page active" id="page-attendance-by-date">
        <div className="pg-hdr">
          <div>
            <div className="pg-title">Attendance by Date</div>
            <div className="pg-sub">Session-by-session attendance for one timetable slot, across the term or a date range</div>
          </div>
          <button type="button" className="btn btn-neu abd-pdf-btn" onClick={downloadPdf} disabled={!canDownload} aria-busy={pdfBusy}>
            {pdfBusy
              ? <><i className="lni lni-spinner-arrow abd-spin" aria-hidden="true"></i> Generating PDF…</>
              : <><i className="lni lni-download" aria-hidden="true"></i> Download PDF</>}
          </button>
        </div>

        {/* ── Filters ── */}
        <div className="card abd-filters-card">
          <div className="abd-filters abd-filters--bydate">
            <div className="fg abd-filter">
              <label className="lbl">Intake <span className="req">*</span></label>
              <SearchSelect placeholder="Select intake…" options={intakesQ.data ?? []} value={intakeGuid} onChange={onIntakeChange} isLoading={intakesQ.isLoading} />
            </div>
            <div className="fg abd-filter">
              <label className="lbl">Term <span className="req">*</span></label>
              <SearchSelect
                placeholder={intakeGuid ? 'Select term…' : 'Select an intake first'}
                options={termsQ.data ?? []}
                value={term}
                onChange={onTermChange}
                disabled={!intakeGuid || termsQ.isLoading}
                isLoading={termsQ.isLoading}
              />
            </div>
            <div className="fg abd-filter abd-filter--span2">
              <label className="lbl">Lecturer <span className="req">*</span></label>
              <SearchSelect
                placeholder={scopeReady ? (lecturersQ.data?.length === 0 ? 'No lecturers timetabled this term' : 'Select lecturer…') : 'Select a term first'}
                options={lecturersQ.data ?? []}
                value={lecturerGuid}
                onChange={onLecturerChange}
                disabled={!scopeReady}
                isLoading={lecturersQ.isLoading}
              />
            </div>
            <div className="fg abd-filter abd-filter--span2">
              <label className="lbl">Timetable <span className="req">*</span></label>
              <SearchSelect
                placeholder={!lecturerGuid ? 'Select a lecturer first' : timetablesQ.data?.length === 0 ? 'No timetabled slots for this lecturer' : 'Select timetable…'}
                options={timetableOptions}
                value={timetableGuid}
                onChange={onTimetableChange}
                disabled={!lecturerGuid}
                isLoading={timetablesQ.isLoading}
              />
            </div>
            <div className="fg abd-filter">
              <label className="lbl">From Date</label>
              <DatePicker value={fromDate} onChange={onFromChange} placeholder="Any date" />
            </div>
            <div className="fg abd-filter">
              <label className="lbl">To Date</label>
              <DatePicker value={toDate} onChange={onToChange} placeholder="Any date" hasError={!!toError} />
              {toError && (
                <p className="abd-field-err" role="alert">
                  <i className="lni lni-warning" aria-hidden="true"></i> {toError}
                </p>
              )}
            </div>
            <div className="abd-filter-actions">
              <button type="button" className="btn btn-primary" onClick={loadReport} disabled={!canLoad} aria-busy={phase === 'loading'}>
                {phase === 'loading'
                  ? <><i className="lni lni-spinner-arrow abd-spin" aria-hidden="true"></i> Loading…</>
                  : <><i className="lni lni-bar-chart" aria-hidden="true"></i> Load Report</>}
              </button>
            </div>
          </div>
          {!timetableGuid && (
            <p className="abd-filter-hint">
              <i className="lni lni-information" aria-hidden="true"></i>
              Pick the intake, term and lecturer to list their timetabled slots. Dates are optional; leave them empty to report on the whole term.
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
            <span className="att-placeholder-icon"><i className="lni lni-calendar" aria-hidden="true"></i></span>
            <div className="att-placeholder-title">{timetableGuid ? 'Select Load Report to see the sessions' : 'Choose a timetable to begin'}</div>
            <div className="att-placeholder-sub">
              {timetableGuid
                ? 'Every session of this slot is listed with its attendance. Add a From or To date first to narrow the range.'
                : 'Each report covers one timetable slot: a course unit, batch and weekly time. Pick the intake, term and lecturer above, then the slot, then select Load Report.'}
            </div>
          </div>
        )}

        {phase === 'loading' && !report && <ReportSkeleton />}

        {phase === 'empty' && (
          <div className="card att-placeholder abd-placeholder">
            <span className="att-placeholder-icon att-placeholder-icon--amber"><i className="lni lni-search-alt" aria-hidden="true"></i></span>
            <div className="att-placeholder-title">No records found for the selected filters.</div>
            <div className="att-placeholder-sub">
              {emptyFilters && (emptyFilters.fromDate || emptyFilters.toDate)
                ? `This timetable has no sessions in the range you chose (${rangeLabel(emptyFilters.fromDate, emptyFilters.toDate)}). Try a wider range, or clear the dates to see the whole term.`
                : 'This timetable has no sessions in the term yet.'}
            </div>
            {emptyFilters && (emptyFilters.fromDate || emptyFilters.toDate) && (
              <button type="button" className="btn btn-neu btn-sm abd-placeholder-act" onClick={clearDates}>
                <i className="lni lni-close" aria-hidden="true"></i> Clear dates
              </button>
            )}
          </div>
        )}

        {report && (phase === 'ready' || phase === 'loading') && (
          <div className="abd-results tab-panel-in" aria-busy={phase === 'loading'}>
            {report.summary && <SummaryCards summary={report.summary} />}

            <div className="card abd-panel">
              <div className="abd-context">
                <div className="abd-context-main">
                  <div className="abd-context-title">
                    <span className="as-code">{report.timetable.courseUnitCode}</span>
                    <h2>{report.timetable.courseUnitName}</h2>
                  </div>
                  <dl className="abd-context-meta">
                    <div><dt><i className="lni lni-users" aria-hidden="true"></i> Batch</dt><dd>{report.timetable.batchCode}</dd></div>
                    <div><dt><i className="lni lni-alarm-clock" aria-hidden="true"></i> Slot</dt><dd>{report.timetable.dayName}s · {fmtTime(report.timetable.startTime)}–{fmtTime(report.timetable.endTime)}</dd></div>
                    <div><dt><i className="lni lni-user" aria-hidden="true"></i> Lecturer</dt><dd>{report.timetable.lecturerName}</dd></div>
                    <div><dt><i className="lni lni-calendar" aria-hidden="true"></i> Range</dt><dd>{rangeLabel(report.filters.fromDate, report.filters.toDate)}</dd></div>
                  </dl>
                </div>
                {stale && (
                  <p className="abd-stale" role="status">
                    <i className="lni lni-reload" aria-hidden="true"></i>
                    Dates changed. Select Load Report to update.
                  </p>
                )}
              </div>

              {/* The app's standard report table (as in Finance's reports);
                  abd-table only adds the skipped / muted row tints. */}
              <div className={`tbl-refetch-wrap${paging ? ' is-refetching' : ''}`} aria-busy={paging}>
                <ScrollTable className="rpt-scroll">
                  <table className="abd-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Date</th>
                        <th>Start</th>
                        <th>End</th>
                        <th>Status</th>
                        <th className="text-center">Special Class</th>
                        <th>Skip Reason</th>
                        <th className="num">Total</th>
                        <th className="num">Present</th>
                        <th className="num">Absent</th>
                        <th className="num">Att. %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.items.map((r, i) => <SessionRow key={r.attendanceSessionGuid} row={r} index={(report.page - 1) * report.pageSize + i + 1} />)}
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
                <Pagination page={report.page} totalPages={totalPages} totalCount={report.totalCount} itemLabel="sessions" onPageChange={p => goTo(p)} />
              </div>
            </div>
          </div>
        )}
      </div>
      <Toast toast={toast} />
    </>
  )
}

// The Finance dashboard's KPI panel (fd-kpi): one card split into cells,
// each a tinted icon and label, the figure in the cell's tone, and one line
// of context.
function SummaryCards({ summary }: { summary: AttendanceByDateSummary }) {
  const pct = summary.overallAttendancePct
  const low = pct != null && isBelowTarget(pct, STUDENT_ATTENDANCE_TARGET)
  const share = (n: number) => summary.totalSessions ? Math.round((n / summary.totalSessions) * 100) : 0
  const other = [
    summary.cancelledSessions ? `${summary.cancelledSessions} cancelled` : null,
    summary.upcomingSessions ? `${summary.upcomingSessions} upcoming` : null,
  ].filter(Boolean).join(' · ')

  return (
    <div className="card fd-kpis abd-kpis" aria-live="polite">
      <div className="fd-kpi">
        <span className="fd-kpi-top">
          <span className="fd-kpi-ic" aria-hidden="true"><i className="lni lni-calendar"></i></span>
          <span className="fd-kpi-lbl">Total Sessions</span>
        </span>
        <span className="fd-kpi-num">{summary.totalSessions}</span>
        <span className="fd-kpi-foot">{other || 'In the selected range'}</span>
      </div>
      <div className="fd-kpi fd-kpi-green">
        <span className="fd-kpi-top">
          <span className="fd-kpi-ic" aria-hidden="true"><i className="lni lni-checkmark-circle"></i></span>
          <span className="fd-kpi-lbl">Conducted Sessions</span>
        </span>
        <span className="fd-kpi-num">{summary.conductedSessions}</span>
        <span className="fd-kpi-foot">{share(summary.conductedSessions)}% of all sessions</span>
      </div>
      <div className={`fd-kpi${summary.skippedSessions > 0 ? ' fd-kpi-amber' : ''}`}>
        <span className="fd-kpi-top">
          <span className="fd-kpi-ic" aria-hidden="true"><i className="lni lni-ban"></i></span>
          <span className="fd-kpi-lbl">Skipped Sessions</span>
        </span>
        <span className="fd-kpi-num">{summary.skippedSessions}</span>
        <span className="fd-kpi-foot">
          {summary.skippedSessions > 0 ? `${share(summary.skippedSessions)}% of sessions not held` : 'None skipped'}
        </span>
      </div>
      <div className={`fd-kpi${pct == null ? '' : low ? ' fd-kpi-red' : ' fd-kpi-green'}`}>
        <span className="fd-kpi-top">
          <span className="fd-kpi-ic" aria-hidden="true"><i className="lni lni-users"></i></span>
          <span className="fd-kpi-lbl">Overall Attendance</span>
        </span>
        <span className="fd-kpi-num">{pct == null ? '—' : `${pct.toFixed(1)}%`}</span>
        {pct == null
          ? <span className="fd-kpi-foot">No sessions conducted yet</span>
          : <TargetMeter pct={pct} target={STUDENT_ATTENDANCE_TARGET} label="Overall attendance" />}
      </div>
    </div>
  )
}

function SessionRow({ row: r, index }: { row: AttendanceByDateRow; index: number }) {
  const d = parseYmd(r.sessionDate)
  const conducted = r.status === 1 && r.attendancePct != null
  const muted = r.status === 0 || r.status === 2

  return (
    <tr className={r.isSkipped ? 'abd-row--skipped' : muted ? 'abd-row--muted' : undefined}>
      <td className="text-g400">{index}</td>
      <td>
        <strong>{fmtDate(r.sessionDate)}</strong><br />
        <span className="text-g400" style={{ fontSize: 'var(--fs-xs)' }}>{WEEKDAYS_LONG[d.getDay()]}</span>
      </td>
      <td>{fmtTime(r.startTime)}</td>
      <td>{fmtTime(r.endTime)}</td>
      <td><StatusBadge status={r.status} /></td>
      <td className="text-center">
        {r.isSpecialClass && (
          <span className="abd-special" title="Special class — held outside the scheduled day" tabIndex={0}>
            <i className="lni lni-star-fill" aria-hidden="true"></i>
            <span className="sr-only">Special class, held outside the scheduled day</span>
          </span>
        )}
      </td>
      <td>{r.isSkipped ? (skipReasonLabel(r.skipReason) ?? 'Other') : <Dash />}</td>
      <td className="num">{r.totalStudents ?? <Dash />}</td>
      <td className="num">{r.presentCount ?? <Dash />}</td>
      <td className="num">{r.absentCount ?? <Dash />}</td>
      <td className="num">
        {conducted ? <AttendancePct pct={r.attendancePct!} target={STUDENT_ATTENDANCE_TARGET} /> : <Dash />}
      </td>
    </tr>
  )
}
