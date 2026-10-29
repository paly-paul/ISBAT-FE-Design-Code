'use client'
import { useState } from 'react'
import { useQueries, useQuery } from '@tanstack/react-query'
import { SearchSelect } from '@/components/SearchSelect'
import { ScrollTable } from '@/components/ScrollTable'
import { Pagination } from '@/components/Pagination'
import { Toast } from '@/components/Toast'
import { useActionGuard } from '@/hooks/users/useActionGuard'
import {
  STUDENT_ATTENDANCE_TARGET, downloadStudentPctPdf, getReportCourseUnits, getReportIntakes, getReportLecturers,
  getReportStudent, getReportTerms, getStudentPctPreview, type StudentPctFilters, type StudentPctRow, type StudentPctSummary,
} from '@/lib/api/attendance/attendanceReports'
import { AttendancePct, ReportSkeleton, TargetMeter, isBelowTarget, reportErrorMessage, shortGuid } from '@/components/attendance/reportShared'

// Student Attendance % (attendance-report-pages-design.md, Page 2;
// erp-docs/pages/assessment/student-attendance-pct-report-page.md): every
// student's attendance across an intake and term, optionally narrowed to one
// lecturer and/or course unit. Intake unlocks Term, Term unlocks Lecturer and
// Load Report; Course Unit needs a lecturer (the course-units API is per
// lecturer). The preview returns studentGuid only, so each row's number,
// name and batch come from the student lookup. Changing any filter clears a
// loaded report, and Download PDF always uses the loaded filters.

const PAGE_SIZES = [15, 30, 50].map(n => ({ value: String(n), label: String(n) }))
const REPORT_KEY = ['attendance', 'reports'] as const

interface Loaded {
  filters: StudentPctFilters
  labels: { intake: string; term: string; lecturer: string | null; unit: string | null }
  summary: StudentPctSummary | null
  items: StudentPctRow[]
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
  const [unitGuid, setUnitGuid] = useState('')

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
  const unitsQ = useQuery({
    queryKey: [...REPORT_KEY, 'units', intakeGuid, term, lecturerGuid],
    queryFn: () => getReportCourseUnits(intakeGuid, +term, lecturerGuid),
    enabled: scopeReady && !!lecturerGuid,
    staleTime: Infinity,
  })

  const intakeLabel = intakesQ.data?.find(o => o.value === intakeGuid)?.label ?? ''
  const lecturerLabel = lecturersQ.data?.find(o => o.value === lecturerGuid)?.label ?? null
  const unitLabel = unitsQ.data?.find(o => o.value === unitGuid)?.label ?? null

  // ── Report ──
  const [phase, setPhase] = useState<Phase>('idle')
  const [report, setReport] = useState<Loaded | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [paging, setPaging] = useState(false)
  const [pdfBusy, setPdfBusy] = useState(false)

  const canLoad = scopeReady && phase !== 'loading'
  const canDownload = phase === 'ready' && !!report && report.totalCount > 0 && !pdfBusy

  // Rows the preview returned without a name (the real API): one cached
  // student lookup each, resolved per page.
  const lookups = useQueries({
    queries: (report?.items ?? []).filter(r => r.fullName == null).map(r => ({
      queryKey: ['attendance', 'reports', 'student', r.studentGuid],
      queryFn: () => getReportStudent(r.studentGuid),
      staleTime: Infinity,
    })),
  })
  const unresolved = (report?.items ?? []).filter(r => r.fullName == null)
  const studentInfo = new Map(unresolved.map((r, i) => [r.studentGuid, lookups[i]]))

  function resetReport() {
    setReport(null)
    setPhase('idle')
  }

  function onIntakeChange(v: string) {
    setIntakeGuid(v)
    setTerm('')
    setLecturerGuid('')
    setUnitGuid('')
    resetReport()
  }

  function onTermChange(v: string) {
    setTerm(v)
    setLecturerGuid('')
    setUnitGuid('')
    resetReport()
  }

  function onLecturerChange(v: string) {
    setLecturerGuid(v)
    setUnitGuid('')
    resetReport()
  }

  function onUnitChange(v: string) {
    setUnitGuid(v)
    resetReport()
  }

  async function loadReport() {
    if (!canLoad) return
    const filters: StudentPctFilters = { intakeGuid, term: +term, lecturerEmployeeGuid: lecturerGuid || null, courseUnitGuid: unitGuid || null }
    const pageSize = report?.pageSize ?? 15
    setPhase('loading')
    try {
      const res = await getStudentPctPreview(filters, 1, pageSize, true)
      if (res.totalCount === 0) {
        setReport(null)
        setPhase('empty')
        return
      }
      setReport({
        filters,
        labels: { intake: intakeLabel, term: `Term ${term}`, lecturer: lecturerLabel, unit: unitLabel },
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
      const res = await getStudentPctPreview(report.filters, page, pageSize, false)
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
        const { mock } = await downloadStudentPctPdf(report.filters)
        if (mock) showToast('Preview mode: student-attendance-percentage.pdf downloads here with the real API.')
      } catch (e) {
        showToast(reportErrorMessage(e, 'PDF generation failed. Please try again.', 'No attendance records found for the selected filters.'), 'error')
      } finally {
        setPdfBusy(false)
      }
    }, 'this report')
  }

  const totalPages = report ? Math.max(1, Math.ceil(report.totalCount / report.pageSize)) : 1
  const termPlaceholder = !intakeGuid ? 'Select an intake first' : termsQ.isLoading ? 'Loading terms…' : 'Select term…'

  return (
    <>
      <div className="page active" id="page-attendance-student-pct">
        <div className="pg-hdr">
          <div>
            <div className="pg-title">Student Attendance %</div>
            <div className="pg-sub">Each student&apos;s attendance across an intake and term, against the {STUDENT_ATTENDANCE_TARGET}% target</div>
          </div>
          <button type="button" className="btn btn-neu abd-pdf-btn" onClick={downloadPdf} disabled={!canDownload} aria-busy={pdfBusy}>
            {pdfBusy
              ? <><i className="lni lni-spinner-arrow abd-spin" aria-hidden="true"></i> Generating PDF…</>
              : <><i className="lni lni-download" aria-hidden="true"></i> Download PDF</>}
          </button>
        </div>

        {/* ── Filters ── */}
        <div className="card abd-filters-card">
          <div className="abd-filters abd-filters--scope">
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
            <div className="fg abd-filter">
              <label className="lbl">Course Unit</label>
              <SearchSelect
                placeholder={!scopeReady ? 'Select a term first' : !lecturerGuid ? 'Select a lecturer first' : 'All course units'}
                options={unitsQ.data ?? []}
                value={unitGuid}
                onChange={onUnitChange}
                disabled={!scopeReady || !lecturerGuid}
                isLoading={unitsQ.isLoading}
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

          {(lecturerGuid || unitGuid) ? (
            <div className="abd-chips" aria-label="Active filters">
              <span className="abd-chips-lbl"><i className="lni lni-funnel" aria-hidden="true"></i> Narrowed to</span>
              {lecturerGuid && (
                <span className="abd-chip">
                  <span className="abd-chip-key">Lecturer</span> {lecturerLabel}
                  <button type="button" className="abd-chip-x" onClick={() => onLecturerChange('')} aria-label={`Remove lecturer filter: ${lecturerLabel ?? ''}`}>
                    <i className="lni lni-close" aria-hidden="true"></i>
                  </button>
                </span>
              )}
              {unitGuid && (
                <span className="abd-chip">
                  <span className="abd-chip-key">Unit</span> {unitLabel}
                  <button type="button" className="abd-chip-x" onClick={() => onUnitChange('')} aria-label={`Remove course unit filter: ${unitLabel ?? ''}`}>
                    <i className="lni lni-close" aria-hidden="true"></i>
                  </button>
                </span>
              )}
            </div>
          ) : !scopeReady && (
            <p className="abd-filter-hint">
              <i className="lni lni-information" aria-hidden="true"></i>
              Lecturer and Course Unit are optional. Leave them empty to include everyone in the term; pick a lecturer to choose one of their course units.
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
            <span className="att-placeholder-icon"><i className="lni lni-users" aria-hidden="true"></i></span>
            <div className="att-placeholder-title">{scopeReady ? 'Select Load Report to see the students' : 'Choose an intake and term to begin'}</div>
            <div className="att-placeholder-sub">
              {scopeReady
                ? 'Every student in the term is listed with their sessions, presence and attendance %. Narrow it to a lecturer or course unit first if you like.'
                : 'The report lists every student taught in that term with their attendance. Pick an intake, then its term, then select Load Report.'}
            </div>
          </div>
        )}

        {phase === 'loading' && <ReportSkeleton />}

        {phase === 'empty' && (
          <div className="card att-placeholder abd-placeholder">
            <span className="att-placeholder-icon att-placeholder-icon--amber"><i className="lni lni-search-alt" aria-hidden="true"></i></span>
            <div className="att-placeholder-title">No records found for the selected filters.</div>
            <div className="att-placeholder-sub">
              {lecturerGuid || unitGuid
                ? 'No students match this lecturer and course unit in the term. Remove a filter to widen the report.'
                : 'No attendance has been recorded for this intake and term yet.'}
            </div>
          </div>
        )}

        {report && phase === 'ready' && (
          <div className="abd-results tab-panel-in">
            {report.summary && <StudentSummary summary={report.summary} />}

            <div className="card abd-panel">
              <div className="abd-context">
                <div className="abd-context-main">
                  <div className="abd-context-title">
                    <h2>{report.labels.intake}</h2>
                    <span className="abd-term-pill">{report.labels.term}</span>
                  </div>
                  <dl className="abd-context-meta">
                    <div><dt><i className="lni lni-user" aria-hidden="true"></i> Lecturer</dt><dd>{report.labels.lecturer ?? 'All lecturers'}</dd></div>
                    <div><dt><i className="lni lni-book" aria-hidden="true"></i> Course Unit</dt><dd>{report.labels.unit ?? 'All course units'}</dd></div>
                  </dl>
                </div>
                <span className="abd-count" aria-live="polite"><strong className="tabular-nums">{report.totalCount}</strong> {report.totalCount === 1 ? 'student' : 'students'}</span>
              </div>

              {/* The app's standard report table (as in Finance's reports). */}
              <div className={`tbl-refetch-wrap${paging ? ' is-refetching' : ''}`} aria-busy={paging}>
                <ScrollTable className="rpt-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Student No</th>
                        <th>Full Name</th>
                        <th>Batch</th>
                        <th className="num">Total Sessions</th>
                        <th className="num">Present</th>
                        <th className="num">Absent</th>
                        <th className="num">Attendance %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.items.map((r, i) => {
                        // Names inline (mock), or from the student lookup:
                        // a placeholder while it loads, the short GUID if it fails.
                        const q = studentInfo.get(r.studentGuid)
                        const s = r.fullName != null
                          ? { studentNumber: r.studentNumber ?? '—', fullName: r.fullName, batchCode: r.batchCode ?? '—' }
                          : q?.data
                        const pending = !s && !!q?.isPending
                        return (
                          <tr key={r.studentGuid}>
                            <td className="text-g400">{(report.page - 1) * report.pageSize + i + 1}</td>
                            <td className="rpt-mono">
                              {pending ? <span className="fd-skel" style={{ width: 90 }} /> : s ? s.studentNumber : <span title={r.studentGuid}>{shortGuid(r.studentGuid)}</span>}
                            </td>
                            <td style={{ fontWeight: 600 }}>
                              {pending ? <span className="fd-skel" style={{ width: 140 }} /> : s ? s.fullName : <span className="text-g400" title="Student details couldn’t be loaded">Unknown student</span>}
                            </td>
                            <td>{pending ? <span className="fd-skel" style={{ width: 70 }} /> : s ? s.batchCode : '—'}</td>
                            <td className="num">{r.totalSessions}</td>
                            <td className="num">{r.presentCount}</td>
                            <td className="num">{r.absentCount}</td>
                            <td className="num"><AttendancePct pct={r.attendancePct} target={STUDENT_ATTENDANCE_TARGET} /></td>
                          </tr>
                        )
                      })}
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
                <Pagination page={report.page} totalPages={totalPages} totalCount={report.totalCount} itemLabel="students" onPageChange={p => goTo(p)} />
              </div>
            </div>
          </div>
        )}
      </div>
      <Toast toast={toast} />
    </>
  )
}

// Same KPI panel as Attendance by Date (the Finance dashboard's fd-kpi).
function StudentSummary({ summary: s }: { summary: StudentPctSummary }) {
  const pct = s.averageAttendancePct
  const low = pct != null && isBelowTarget(pct, STUDENT_ATTENDANCE_TARGET)
  const share = (n: number) => s.studentCount ? Math.round((n / s.studentCount) * 100) : 0

  return (
    <div className="card fd-kpis abd-kpis" aria-live="polite">
      <div className="fd-kpi">
        <span className="fd-kpi-top">
          <span className="fd-kpi-ic" aria-hidden="true"><i className="lni lni-users"></i></span>
          <span className="fd-kpi-lbl">Students</span>
        </span>
        <span className="fd-kpi-num">{s.studentCount}</span>
        <span className="fd-kpi-foot">In the selected intake and term</span>
      </div>
      <div className={`fd-kpi${pct == null ? '' : low ? ' fd-kpi-red' : ' fd-kpi-green'}`}>
        <span className="fd-kpi-top">
          <span className="fd-kpi-ic" aria-hidden="true"><i className="lni lni-bar-chart"></i></span>
          <span className="fd-kpi-lbl">Average Attendance</span>
        </span>
        <span className="fd-kpi-num">{pct == null ? '—' : `${pct.toFixed(1)}%`}</span>
        {pct == null
          ? <span className="fd-kpi-foot">No sessions recorded yet</span>
          : <TargetMeter pct={pct} target={STUDENT_ATTENDANCE_TARGET} label="Average attendance" />}
      </div>
      <div className={`fd-kpi${s.belowTargetCount > 0 ? ' fd-kpi-red' : ''}`}>
        <span className="fd-kpi-top">
          <span className="fd-kpi-ic" aria-hidden="true"><i className="lni lni-warning"></i></span>
          <span className="fd-kpi-lbl">Below {STUDENT_ATTENDANCE_TARGET}%</span>
        </span>
        <span className="fd-kpi-num">{s.belowTargetCount}</span>
        <span className="fd-kpi-foot">{s.belowTargetCount > 0 ? `${share(s.belowTargetCount)}% of students need follow-up` : 'Everyone is on target'}</span>
      </div>
      <div className="fd-kpi fd-kpi-green">
        <span className="fd-kpi-top">
          <span className="fd-kpi-ic" aria-hidden="true"><i className="lni lni-checkmark-circle"></i></span>
          <span className="fd-kpi-lbl">On Target</span>
        </span>
        <span className="fd-kpi-num">{s.atOrAboveTargetCount}</span>
        <span className="fd-kpi-foot">{share(s.atOrAboveTargetCount)}% at or above {STUDENT_ATTENDANCE_TARGET}%</span>
      </div>
    </div>
  )
}
