'use client'
import { useRouter } from 'next/navigation'
import { useState, useMemo } from 'react'
import { Pagination } from '@/components/Pagination'
import { Toast } from '@/components/Toast'
import {
  useAssessmentOverview,
  useHallTicketDashboard,
  useResitDashboard,
  useLecturerDashboard,
} from '@/hooks/assessment/useAssessmentDashboard'
import { downloadBlob } from '@/lib/downloadBlob'
import { formatDate } from '@/lib/date'

// Safe time formatter that never throws on null, undefined or malformed ISO strings
function formatSafeTime(isoString?: string | null): string {
  if (!isoString) return '—'
  try {
    const d = new Date(isoString)
    if (isNaN(d.getTime())) return '—'
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } catch {
    return '—'
  }
}

// Calculate duration between start and end ISO strings (e.g. "3 hrs" or "1h 30m")
function formatDuration(start?: string | null, end?: string | null): string | null {
  if (!start || !end) return null
  try {
    const t1 = new Date(start).getTime()
    const t2 = new Date(end).getTime()
    if (isNaN(t1) || isNaN(t2) || t2 <= t1) return null
    const diffMinutes = Math.round((t2 - t1) / 60000)
    const hours = Math.floor(diffMinutes / 60)
    const mins = diffMinutes % 60
    if (hours > 0 && mins > 0) return `${hours}h ${mins}m`
    if (hours > 0) return `${hours} hr${hours > 1 ? 's' : ''}`
    return `${mins} mins`
  } catch {
    return null
  }
}

// Extract uppercase 3-letter month for calendar date tile
function getMonthShort(isoString?: string | null): string {
  if (!isoString) return 'CAL'
  try {
    const d = new Date(isoString)
    if (isNaN(d.getTime())) return 'CAL'
    return d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()
  } catch {
    return 'CAL'
  }
}

// Extract day of month number for calendar tile
function getDayNumber(isoString?: string | null): string {
  if (!isoString) return '—'
  try {
    const d = new Date(isoString)
    if (isNaN(d.getTime())) return '—'
    return String(d.getDate())
  } catch {
    return '—'
  }
}

interface PendingActionItem {
  id: string
  title: string
  subtitle: string
  tag: string
  badgeClass: string
  buttonText: string
  onAction: () => void
  iconClass: string
  avatarBg: string
  avatarColor: string
  borderAccent: string
  progressPercent?: number
  pendingCount?: number
}

export default function AssessmentDashboard() {
  const router = useRouter()
  const [examPage, setExamPage] = useState(1)
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)

  const showToast = (msg: string, type: string = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  // ---------------------------------------------------------------------------
  // 1. Fetch live data from the 4 assessment dashboard APIs
  // ---------------------------------------------------------------------------
  const { data: overview, isLoading: overviewLoading } = useAssessmentOverview()
  const { data: hallTicket, isLoading: hallTicketLoading } = useHallTicketDashboard()
  const { data: resit, isLoading: resitLoading } = useResitDashboard(examPage, 5)
  const { data: lecturer, isLoading: lecturerLoading } = useLecturerDashboard()

  const isInitialLoading = overviewLoading && hallTicketLoading && resitLoading && lecturerLoading

  // ---------------------------------------------------------------------------
  // 2. Computed Metrics & Dual-View Scope (Dean-Lecturer Toggle)
  // ---------------------------------------------------------------------------
  const hasBothViews =
    overview != null &&
    lecturer != null &&
    (lecturer.schedules?.length > 0 ||
      lecturer.cwSubmissionPendingCount > 0 ||
      lecturer.cwEvaluationPendingCount > 0)

  const [activeScope, setActiveScope] = useState<'overview' | 'teaching'>('overview')

  const isRegistrar = overview?.isUniversityWide === true
  const isDean = overview != null && overview.isUniversityWide === false
  const isLecturerOnly = overview == null && lecturer != null

  const isViewingTeaching = activeScope === 'teaching' || isLecturerOnly

  const roleBadge = isViewingTeaching
    ? { label: 'Lecturer', class: 'badge-green' }
    : isRegistrar
    ? { label: 'Registrar', class: 'bg-purple-100 text-purple-700 border border-purple-200' }
    : isDean
    ? { label: 'Dean', class: 'badge-blue' }
    : { label: 'Assessment', class: 'badge-grey' }

  const viewSubtitle = isViewingTeaching
    ? 'Academic Intake · My Teaching Subjects (Personal Workload)'
    : isRegistrar
    ? 'Academic Intake · Academic Registrar View (University Totals)'
    : isDean
    ? 'Academic Intake · Faculty Dean View'
    : 'Academic Intake Overview'

  // Top 4 Stat metrics — adapts dynamically to active scope (Overview vs Teaching)
  const cwEvaluationPending = isViewingTeaching
    ? (lecturer?.cwEvaluationPendingCount ?? 0)
    : (overview?.cwEvaluationPendingCount ?? lecturer?.cwEvaluationPendingCount ?? 0)

  const cwSubmissionPending = isViewingTeaching
    ? (lecturer?.cwSubmissionPendingCount ?? 0)
    : (overview?.cwSubmissionPendingCount ?? lecturer?.cwSubmissionPendingCount ?? 0)

  const qpVettingPending = isViewingTeaching
    ? (lecturer?.ueQpAwaitingVettingCount ?? 0)
    : (overview?.ueQpAwaitingVettingCount ?? lecturer?.ueQpAwaitingVettingCount ?? 0)

  const classTestSubmissionPending = isViewingTeaching
    ? (lecturer?.classTestSubmissionPendingCount ?? 0)
    : (overview?.classTestSubmissionPendingCount ?? lecturer?.classTestSubmissionPendingCount ?? 0)

  // Safely find Term 1 and Term 2 records from hallTicket.terms
  const term1 = hallTicket?.terms?.find(t => t.term === 1) ?? hallTicket?.terms?.[0]
  const term2 = hallTicket?.terms?.find(t => t.term === 2) ?? hallTicket?.terms?.[1]

  const term1Pending = term1?.pendingCount ?? 0
  const term1Issued = term1?.issuedCount ?? 0
  const term2Pending = term2?.pendingCount ?? 0
  const term2Issued = term2?.issuedCount ?? 0
  const totalRegisteredStudents = hallTicket?.registeredStudentCount ?? 0
  const totalPendingHallTickets = term1Pending + term2Pending

  // Clearance rate calculations
  const term1Rate = totalRegisteredStudents > 0 ? Math.round((term1Issued / totalRegisteredStudents) * 100) : 0
  const term2Rate = totalRegisteredStudents > 0 ? Math.round((term2Issued / totalRegisteredStudents) * 100) : 0

  // Workload distribution breakdown
  const totalWorkload = cwEvaluationPending + cwSubmissionPending + classTestSubmissionPending + qpVettingPending
  const cwEvalPct = totalWorkload > 0 ? Math.round((cwEvaluationPending / totalWorkload) * 100) : 0
  const cwSubPct = totalWorkload > 0 ? Math.round((cwSubmissionPending / totalWorkload) * 100) : 0
  const testPct = totalWorkload > 0 ? Math.round((classTestSubmissionPending / totalWorkload) * 100) : 0
  const qpPct = totalWorkload > 0 ? Math.max(0, 100 - cwEvalPct - cwSubPct - testPct) : 0

  // Format resit dates dynamically and safely
  const formatResitDates = () => {
    if (!resit?.applicationOpenDate || !resit?.applicationCloseDate) return null
    return `${formatDate(resit.applicationOpenDate)} – ${formatDate(resit.applicationCloseDate)}`
  }

  // ---------------------------------------------------------------------------
  // 3. Dynamic Pending Actions List from Real API Data (Flexible, snugly sized)
  // ---------------------------------------------------------------------------
  const pendingActions: PendingActionItem[] = useMemo(() => {
    const list: PendingActionItem[] = []

    // Action 1: Question Papers awaiting vetting
    if (qpVettingPending > 0) {
      list.push({
        id: 'qp-vetting',
        title: `${qpVettingPending} UE Question Paper${qpVettingPending > 1 ? 's' : ''} Awaiting Vetting`,
        subtitle: 'Vetting Committee review required on question papers before exam scheduling',
        tag: 'Pending Vetting',
        badgeClass: 'badge-amber',
        buttonText: 'Review',
        onAction: () => router.push('/assessment/qp-vetting'),
        iconClass: 'lni lni-timer',
        avatarBg: 'bg-amber-50',
        avatarColor: 'text-amber-700',
        borderAccent: 'border-l-amber-500',
      })
    }

    // Action 2: Coursework evaluations pending (IA evaluation)
    if (cwEvaluationPending > 0) {
      list.push({
        id: 'cw-eval',
        title: `${cwEvaluationPending} Coursework Evaluation${cwEvaluationPending > 1 ? 's' : ''} Pending`,
        subtitle: `${cwSubmissionPending.toLocaleString()} submitted coursework assignments awaiting lecturer grading`,
        tag: 'Evaluation Due',
        badgeClass: 'bg-purple-50 text-purple-700 border border-purple-200',
        buttonText: 'Evaluate',
        onAction: () => router.push('/assessment/ia-evaluation'),
        iconClass: 'lni lni-clipboard',
        avatarBg: 'bg-purple-50',
        avatarColor: 'text-purple-700',
        borderAccent: 'border-l-purple-500',
      })
    }

    // Action 3: Term 1 Hall Tickets Pending
    if (term1Pending > 0) {
      list.push({
        id: 'ht-term-1',
        title: `${term1Pending} Term 1 Hall Ticket${term1Pending > 1 ? 's' : ''} Not Issued`,
        subtitle: `${totalRegisteredStudents.toLocaleString()} registered students · Fee clearance (50%) & CW completion required`,
        tag: 'Term 1 Pending',
        badgeClass: 'badge-blue',
        buttonText: 'View',
        onAction: () => router.push('/assessment/hall-ticket'),
        iconClass: 'lni lni-ticket',
        avatarBg: 'bg-blue-50',
        avatarColor: 'text-blue-700',
        borderAccent: 'border-l-blue-500',
      })
    }

    // Action 4: Term 2 Hall Tickets Pending
    if (term2Pending > 0) {
      list.push({
        id: 'ht-term-2',
        title: `${term2Pending} Term 2 Hall Ticket${term2Pending > 1 ? 's' : ''} Not Issued`,
        subtitle: '100% fee clearance, Guild & NCHE fee checks required before issuance',
        tag: 'Term 2 Pending',
        badgeClass: 'badge-cyan',
        buttonText: 'View',
        onAction: () => router.push('/assessment/hall-ticket'),
        iconClass: 'lni lni-ticket',
        avatarBg: 'bg-cyan-50',
        avatarColor: 'text-cyan-700',
        borderAccent: 'border-l-cyan-500',
      })
    }

    // Action 5: Lecturer Pending Resit Evaluations with Grading Progress Rate
    if (resit?.pendingEvaluations && resit.pendingEvaluations.length > 0) {
      for (const evalItem of resit.pendingEvaluations) {
        const progLabel = evalItem.programmeNames?.length
          ? evalItem.programmeNames.join(', ')
          : 'Enrolled Programmes'
        const evalRate =
          evalItem.submittedCount > 0
            ? Math.round((evalItem.evaluatedCount / evalItem.submittedCount) * 100)
            : 0

        list.push({
          id: `resit-eval-${evalItem.courseUnitGuid}-${evalItem.category}`,
          title: `${evalItem.unitCode} (${evalItem.unitName}) — ${evalItem.categoryLabel}`,
          subtitle: `${evalItem.evaluatedCount} of ${evalItem.submittedCount} evaluated · ${evalItem.headCount} enrolled (${progLabel})`,
          tag: `${evalRate}% Evaluated`,
          badgeClass: 'badge-green',
          buttonText: 'Evaluate',
          progressPercent: evalRate,
          pendingCount: evalItem.pendingCount,
          onAction: () =>
            router.push(
              `/assessment/resit-evaluation?unit=${evalItem.courseUnitGuid}&intake=${resit.academicIntakeGuid}&config=${resit.resitConfigGuid}`
            ),
          iconClass: 'lni lni-pencil',
          avatarBg: 'bg-emerald-50',
          avatarColor: 'text-emerald-700',
          borderAccent: 'border-l-emerald-500',
        })
      }
    }

    // Action 6: Class Tests Submission Pending
    if (classTestSubmissionPending > 0) {
      list.push({
        id: 'class-test',
        title: `${classTestSubmissionPending} Class Test Submission${classTestSubmissionPending > 1 ? 's' : ''} Pending`,
        subtitle: 'Students with unsubmitted class tests past deadline',
        tag: 'Test Overdue',
        badgeClass: 'badge-red',
        buttonText: 'View Tests',
        onAction: () => router.push('/assessment/bulk-exam-scheduler'),
        iconClass: 'lni lni-alarm-clock',
        avatarBg: 'bg-rose-50',
        avatarColor: 'text-rose-700',
        borderAccent: 'border-l-rose-500',
      })
    }

    return list
  }, [
    qpVettingPending,
    cwEvaluationPending,
    cwSubmissionPending,
    term1Pending,
    term2Pending,
    totalRegisteredStudents,
    resit,
    classTestSubmissionPending,
    router,
  ])

  // ---------------------------------------------------------------------------
  // 4. Scheduled Exams List (100% Real Live Data Only - No Hardcoded Rows)
  // ---------------------------------------------------------------------------
  const liveScheduledExams = resit?.scheduledExams?.items ?? []
  const scheduledExamsTotal = resit?.scheduledExams?.totalCount ?? 0

  const lecturerSchedules = lecturer?.schedules ?? []
  const [scheduleSourceTab, setScheduleSourceTab] = useState<'intake' | 'resit'>('intake')

  const hasBothScheduleSources =
    !isViewingTeaching && lecturerSchedules.length > 0 && liveScheduledExams.length > 0

  const showingLecturerSchedules =
    isViewingTeaching ||
    (lecturerSchedules.length > 0 && (!hasBothScheduleSources || scheduleSourceTab === 'intake'))

  const activeScheduleTotal = showingLecturerSchedules
    ? lecturerSchedules.length
    : scheduledExamsTotal
  const scheduledExamsPages = Math.ceil(activeScheduleTotal / 5) || 1

  // Purely dynamic live data: displays lecturer intake schedules (with real courseUnitCode/Name & publishStatus)
  // or resit scheduled exams when selected / when lecturer schedules are empty
  const displayExams = useMemo(() => {
    if (showingLecturerSchedules) {
      const start = (examPage - 1) * 5
      return lecturerSchedules.slice(start, start + 5).map((s: any) => ({
        scheduleGuid: s.scheduleGuid,
        examType: s.scheduleType ?? s.examType,
        number: s.number ?? null,
        courseUnitCode: s.courseUnitCode ?? s.unitCode ?? null,
        courseUnitName: s.courseUnitName ?? s.unitName ?? null,
        startDateTime: s.startDateTime,
        endDateTime: s.endDateTime,
        publishStatus: s.publishStatus ?? 0,
        maxMark: s.maxMark,
        isResit: false,
      }))
    }
    if (liveScheduledExams.length > 0) {
      return liveScheduledExams.map((item: any) => ({
        ...item,
        examType: item.examType ?? item.scheduleType,
        number: item.number ?? null,
        courseUnitCode: item.courseUnitCode ?? item.unitCode ?? null,
        courseUnitName: item.courseUnitName ?? item.unitName ?? null,
        publishStatus: item.publishStatus ?? 0,
        isResit: true,
      }))
    }
    return []
  }, [showingLecturerSchedules, lecturerSchedules, liveScheduledExams, examPage])

  // ---------------------------------------------------------------------------
  // 5. Export Summary handler
  // ---------------------------------------------------------------------------
  const handleExportSummary = () => {
    const csvLines = [
      'ISBAT UNIVERSITY ERP - ASSESSMENT DASHBOARD LIVE SUMMARY',
      `Generated: ${new Date().toLocaleString()}`,
      `Scope: ${viewSubtitle}`,
      '',
      'METRIC,COUNT,STATUS',
      `Coursework Evaluations Pending,${cwEvaluationPending},Action Required`,
      `Coursework Submissions Pending,${cwSubmissionPending},Awaiting Submissions`,
      `Class Test Submissions Pending,${classTestSubmissionPending},Awaiting Submissions`,
      `Question Papers Awaiting Vetting,${qpVettingPending},Vetting Committee`,
      `Term 1 Hall Tickets Issued,${term1Issued},Completed`,
      `Term 1 Hall Tickets Pending,${term1Pending},Not Issued`,
      `Term 2 Hall Tickets Issued,${term2Issued},Completed`,
      `Term 2 Hall Tickets Pending,${term2Pending},Not Issued`,
      `Total Registered Students,${totalRegisteredStudents},Active Intake`,
      '',
      'RESIT METRICS,VALUE',
      `Active Resit Reference,${resit?.refCode ?? 'No active resit window'}`,
      `Application Window,${formatResitDates() ?? 'None'}`,
      `Registered Resit Students,${resit?.registeredStudentCount ?? 0}`,
      `Fee Cleared Resit Students,${resit?.feeClearedStudentCount ?? 0}`,
      `Registered Course Units,${resit?.registeredCourseUnitCount ?? 0}`,
      `Fee Cleared Course Units,${resit?.feeClearedCourseUnitCount ?? 0}`,
      `Upcoming Scheduled Exams,${scheduledExamsTotal || displayExams.length}`,
    ]

    const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' })
    downloadBlob(blob, `Assessment_Dashboard_Summary_${new Date().toISOString().slice(0, 10)}.csv`)
    showToast('Summary report downloaded successfully', 'success')
  }

  const getExamTypeLabel = (type: number, num?: number | null) => {
    switch (type) {
      case 1:
        return { label: num && num > 1 ? `Class Test ${num}` : 'Class Test', badgeClass: 'badge-amber' }
      case 2:
        if (num === 2) return { label: 'Class Activity (CW2)', badgeClass: 'badge-cyan' }
        return { label: num === 1 ? 'Coursework 1' : 'Coursework', badgeClass: 'badge-blue' }
      case 3:
        return { label: 'Class Activity (CW2)', badgeClass: 'badge-cyan' }
      case 4:
        return { label: 'Practical / Mock', badgeClass: 'badge-grey' }
      case 5:
        return { label: 'University Exam', badgeClass: 'bg-purple-50 text-purple-700 border border-purple-200' }
      default:
        return { label: 'Exam', badgeClass: 'badge-grey' }
    }
  }

  return (
    <div id="page-assessment-dashboard">
      {/* Header with Live Intake Chip and Dual View Switcher */}
      <div className="pg-hdr">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="pg-title mb-0">Assessment Dashboard</h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Spring 2026 (Active Intake)
            </span>
          </div>
          <div className="pg-sub mt-1">
            {overviewLoading ? 'Loading dashboard overview...' : viewSubtitle}
          </div>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          {/* Dual View Toggle for Deans who also teach */}
          {hasBothViews && (
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs mr-1">
              <button
                type="button"
                onClick={() => setActiveScope('overview')}
                className={`px-3 py-1 rounded-md font-medium transition-all ${
                  activeScope === 'overview'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {isRegistrar ? 'University Totals' : 'Faculty Overview'}
              </button>
              <button
                type="button"
                onClick={() => setActiveScope('teaching')}
                className={`px-3 py-1 rounded-md font-medium transition-all ${
                  activeScope === 'teaching'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                My Subjects
              </button>
            </div>
          )}

          <span className={`badge ${roleBadge.class}`}>
            {roleBadge.label}
          </span>
          <button
            type="button"
            className="btn btn-neu btn-sm"
            onClick={handleExportSummary}
            title="Download CSV Summary"
          >
            <i className="lni lni-download" />
            <span>Export Summary</span>
          </button>
        </div>
      </div>

      {/* Top 4 KPI Stat Cards with Top Color Accent Gradient Lines & Hover Micro-Interactions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Card 1: Coursework Evaluations Pending */}
        <div
          onClick={() => router.push('/assessment/ia-evaluation')}
          className="stat-card [--b700:var(--purple)] [--b400:#a78bfa] flex flex-col justify-between !p-4 cursor-pointer hover:border-b300 hover:-translate-y-0.5 hover:shadow-xs transition-all duration-200 group min-h-[158px]"
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-g500">
                CW Evaluations Pending
              </div>
              <div className="text-2xl font-extrabold text-g900 mt-1 leading-tight">
                {overviewLoading || lecturerLoading ? (
                  <span className="text-g300">...</span>
                ) : (
                  cwEvaluationPending.toLocaleString()
                )}
              </div>
            </div>
            <span className="w-10 h-10 rounded-lg flex items-center justify-center bg-purple-50 text-purple-700 border border-purple-100 shrink-0 group-hover:scale-105 transition-transform">
              <i className="lni lni-clipboard text-lg" />
            </span>
          </div>
          <div>
            <div className="text-[12px] text-g500 truncate mb-2">
              {overviewLoading ? 'Loading...' : `${cwSubmissionPending.toLocaleString()} submissions awaiting grading`}
            </div>
            <div className="h-1.5 rounded-full bg-g100 overflow-hidden">
              <div
                className="h-full rounded-full bg-purple-600 transition-all duration-500"
                style={{ width: `${Math.min(100, cwEvaluationPending > 0 ? Math.max(15, cwEvaluationPending) : 0)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card 2: QP Awaiting Vetting */}
        <div
          onClick={() => router.push('/assessment/qp-vetting')}
          className="stat-card [--b700:var(--amber)] [--b400:#fbbf24] flex flex-col justify-between !p-4 cursor-pointer hover:border-b300 hover:-translate-y-0.5 hover:shadow-xs transition-all duration-200 group min-h-[158px]"
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-g500">
                QP Awaiting Vetting
              </div>
              <div className="text-2xl font-extrabold text-g900 mt-1 leading-tight">
                {overviewLoading || lecturerLoading ? (
                  <span className="text-g300">...</span>
                ) : (
                  qpVettingPending.toLocaleString()
                )}
              </div>
            </div>
            <span className="w-10 h-10 rounded-lg flex items-center justify-center bg-amber-50 text-amber-700 border border-amber-100 shrink-0 group-hover:scale-105 transition-transform">
              <i className="lni lni-timer text-lg" />
            </span>
          </div>
          <div>
            <div className="text-[12px] text-g500 truncate mb-2">
              {qpVettingPending > 0 ? 'Vetting committee review pending' : 'All question papers vetted'}
            </div>
            <div className="h-1.5 rounded-full bg-g100 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${qpVettingPending > 0 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                style={{ width: `${qpVettingPending > 0 ? Math.min(100, Math.max(20, qpVettingPending * 10)) : 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card 3: Hall Tickets Pending with Dual Term Segmented Bar */}
        <div
          onClick={() => router.push('/assessment/hall-ticket')}
          className="stat-card flex flex-col justify-between !p-4 cursor-pointer hover:border-b300 hover:-translate-y-0.5 hover:shadow-xs transition-all duration-200 group min-h-[158px]"
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-g500">
                Hall Tickets Pending
              </div>
              <div className="text-2xl font-extrabold text-g900 mt-1 leading-tight">
                {hallTicketLoading ? (
                  <span className="text-g300">...</span>
                ) : (
                  totalPendingHallTickets.toLocaleString()
                )}
              </div>
            </div>
            <span className="w-10 h-10 rounded-lg flex items-center justify-center bg-blue-50 text-blue-700 border border-blue-100 shrink-0 group-hover:scale-105 transition-transform">
              <i className="lni lni-ticket text-lg" />
            </span>
          </div>
          <div>
            <div className="flex items-center gap-1.5 mb-2 text-[11px] flex-wrap">
              <span className="badge badge-blue">
                T1: {term1Pending}
              </span>
              <span className="badge badge-cyan">
                T2: {term2Pending}
              </span>
              <span className="text-g400 text-[11px]">
                of {totalRegisteredStudents.toLocaleString()}
              </span>
            </div>
            {/* Segmented Clearance Progress */}
            <div className="h-1.5 rounded-full bg-g100 overflow-hidden flex">
              <div
                className="h-full bg-blue-600 transition-all duration-500"
                style={{ width: `${totalRegisteredStudents > 0 ? Math.round((term1Issued / (totalRegisteredStudents * 2)) * 100) : 0}%` }}
                title={`Term 1: ${term1Rate}% issued`}
              />
              <div
                className="h-full bg-cyan-500 transition-all duration-500"
                style={{ width: `${totalRegisteredStudents > 0 ? Math.round((term2Issued / (totalRegisteredStudents * 2)) * 100) : 0}%` }}
                title={`Term 2: ${term2Rate}% issued`}
              />
            </div>
          </div>
        </div>

        {/* Card 4: Resit Registrations */}
        <div
          onClick={() => router.push(resit ? '/assessment/resit-applications' : '/assessment/bulk-exam-scheduler')}
          className="stat-card [--b700:var(--green)] [--b400:#34d399] flex flex-col justify-between !p-4 cursor-pointer hover:border-b300 hover:-translate-y-0.5 hover:shadow-xs transition-all duration-200 group min-h-[158px]"
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-g500">
                Resit Registrations
              </div>
              <div className="text-2xl font-extrabold text-g900 mt-1 leading-tight">
                {resitLoading ? (
                  <span className="text-g300">...</span>
                ) : (
                  (resit?.registeredStudentCount ?? 0).toLocaleString()
                )}
              </div>
            </div>
            <span className="w-10 h-10 rounded-lg flex items-center justify-center bg-emerald-50 text-emerald-700 border border-emerald-100 shrink-0 group-hover:scale-105 transition-transform">
              <i className="lni lni-reload text-lg" />
            </span>
          </div>
          <div>
            <div className="text-[12px] text-g500 truncate mb-2">
              {resitLoading
                ? 'Loading...'
                : resit
                ? `${resit.feeClearedStudentCount} fee cleared · ${resit.registeredCourseUnitCount} units`
                : 'No active resit window'}
            </div>
            <div className="h-1.5 rounded-full bg-g100 overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                style={{
                  width: `${
                    resit && resit.registeredStudentCount > 0
                      ? Math.round((resit.feeClearedStudentCount / resit.registeredStudentCount) * 100)
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Middle Row: Pending Actions & Upcoming Scheduled Exams (Equal Height Matching Cards with Light Gray Header) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6 items-stretch">
        {/* Left Column: Pending Actions */}
        <div className="card adm-queue flex flex-col justify-between h-full !p-0 overflow-hidden">
          {/* Light Gray Card Header */}
          <div className="card-hdr !mb-0 px-5 py-3.5 bg-slate-50 border-b border-slate-200/90 flex items-center justify-between !flex-nowrap gap-2">
            <div className="card-title flex items-center gap-2 min-w-0">
              <i className="lni lni-alarm-clock text-amber-600 shrink-0" />
              <span className="truncate">Pending Actions</span>
              <span className="adm-count shrink-0 bg-white border border-slate-200 shadow-2xs">{pendingActions.length}</span>
            </div>
            {pendingActions.length > 0 && (
              <button
                type="button"
                className="btn btn-neu btn-sm shrink-0 ml-auto flex items-center gap-1.5 whitespace-nowrap bg-white"
                onClick={() => pendingActions[0]?.onAction()}
              >
                <span>Open</span>
                <i className="lni lni-arrow-right" />
              </button>
            )}
          </div>

          <div className="p-4 flex-1 flex flex-col justify-between">
            {isInitialLoading ? (
              <div className="adm-queue-state flex-1 flex items-center justify-center">Loading pending actions…</div>
            ) : pendingActions.length === 0 ? (
              <div className="adm-queue-state flex-1 flex flex-col items-center justify-center py-6">
                <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-2 text-lg">
                  <i className="lni lni-checkmark-circle" />
                </div>
                <div className="text-sm font-semibold text-g800">No pending actions</div>
                <div className="text-xs text-g400 mt-0.5 max-w-xs text-center">
                  All question papers, evaluations, and tickets for this intake are current.
                </div>
              </div>
            ) : (
              <ul className="adm-qlist flex-1">
                {pendingActions.map(action => (
                  <li
                    key={action.id}
                    className="adm-qrow group"
                    role="link"
                    tabIndex={0}
                    onClick={action.onAction}
                    onKeyDown={e => {
                      if (e.key === 'Enter') action.onAction()
                    }}
                  >
                    <span className={`adm-avatar ${action.avatarBg} ${action.avatarColor} shadow-2xs group-hover:scale-105 transition-transform`} aria-hidden="true">
                      <i className={action.iconClass} />
                    </span>
                    <div className="adm-qmain">
                      <div className="adm-qname">
                        <span className="text-g900 group-hover:text-b600 transition-colors">{action.title}</span>
                      </div>
                      <div className="adm-qprog" title={action.subtitle}>
                        {action.subtitle}
                      </div>

                      {/* Grading progress bar for resit evaluations */}
                      {action.progressPercent !== undefined && (
                        <div className="flex items-center gap-2 mt-1.5">
                          <div className="w-28 h-1.5 rounded-full bg-g100 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-emerald-500 transition-all"
                              style={{ width: `${action.progressPercent}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-semibold text-emerald-700">
                            {action.progressPercent}% completed
                          </span>
                          {action.pendingCount !== undefined && action.pendingCount > 0 && (
                            <span className="text-[10px] text-g400">
                              ({action.pendingCount} remaining)
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="adm-qside !flex-row !items-center !gap-2.5 shrink-0">
                      <span className={`badge ${action.badgeClass} shrink-0 whitespace-nowrap`}>
                        {action.tag}
                      </span>
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation()
                          action.onAction()
                        }}
                        className="btn btn-neu btn-xs shrink-0 whitespace-nowrap font-medium"
                      >
                        {action.buttonText}
                      </button>
                    </div>
                    <i className="lni lni-chevron-right adm-qchev shrink-0" aria-hidden="true" />
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-2.5 pt-2 border-t border-g100 flex items-center justify-between text-xs text-g500">
              <span className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${pendingActions.length > 0 ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                {pendingActions.length > 0 ? 'Action Required' : 'Status'}
              </span>
              <span className="font-semibold text-g800">
                {pendingActions.length > 0 ? `${pendingActions.length} pending items` : 'All cleared'}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Upcoming Scheduled Exams (Equal Height Matching Pending Actions) */}
        <div className="card adm-queue flex flex-col justify-between h-full !p-0 overflow-hidden">
          {/* Light Gray Card Header */}
          <div className="card-hdr !mb-0 px-5 py-3.5 bg-slate-50 border-b border-slate-200/90 flex items-center justify-between !flex-nowrap gap-2">
            <div className="card-title flex items-center gap-2 min-w-0">
              <i className="lni lni-calendar text-indigo-600 shrink-0" />
              <span className="truncate">Upcoming Scheduled Exams</span>
              <span className="adm-count shrink-0 bg-white border border-slate-200 shadow-2xs">{activeScheduleTotal}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-auto">
              {hasBothScheduleSources && (
                <div className="flex items-center bg-white p-0.5 rounded-md border border-slate-200 text-[11px]">
                  <button
                    type="button"
                    onClick={() => { setScheduleSourceTab('intake'); setExamPage(1) }}
                    className={`px-2 py-0.5 rounded font-semibold transition-all ${
                      scheduleSourceTab === 'intake'
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Intake ({lecturerSchedules.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => { setScheduleSourceTab('resit'); setExamPage(1) }}
                    className={`px-2 py-0.5 rounded font-semibold transition-all ${
                      scheduleSourceTab === 'resit'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Resit ({scheduledExamsTotal})
                  </button>
                </div>
              )}
              <button
                type="button"
                className="btn btn-neu btn-sm flex items-center gap-1.5 whitespace-nowrap bg-white"
                onClick={() =>
                  router.push(
                    showingLecturerSchedules
                      ? '/assessment/bulk-exam-scheduler'
                      : '/assessment/resit-scheduling'
                  )
                }
              >
                <span>Scheduler</span>
                <i className="lni lni-arrow-right" />
              </button>
            </div>
          </div>

          <div className="p-4 flex-1 flex flex-col justify-between">
            <div className="flex-1 flex flex-col">
              {resitLoading || lecturerLoading ? (
                <div className="adm-queue-state flex-1 flex items-center justify-center">Loading scheduled exams…</div>
              ) : displayExams.length > 0 ? (
                <div className="overflow-x-auto flex-1">
                  <table className="w-full text-left border-collapse text-[13px]">
                    <thead>
                      <tr className="text-[11px] font-bold text-g600 uppercase tracking-wider bg-g50/80 border-b border-g200">
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Course Unit</th>
                        <th className="py-2.5 px-3">Exam Type</th>
                        <th className="py-2.5 px-3">Time & Duration</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayExams.map((exam, idx) => {
                        const typeBadge = getExamTypeLabel(exam.examType, exam.number)
                        const isPublished = exam.publishStatus === 1
                        const durationStr = formatDuration(exam.startDateTime, exam.endDateTime)
                        const monthShort = getMonthShort(exam.startDateTime)
                        const dayNum = getDayNumber(exam.startDateTime)

                        return (
                          <tr
                            key={exam.scheduleGuid || idx}
                            className="border-b border-g100 hover:bg-g50/60 transition-colors group"
                          >
                            {/* Modern Calendar Date Tile */}
                            <td className="py-2.5 px-3 align-middle">
                              <div className="w-11 h-12 rounded-lg bg-b50 border border-b200/60 flex flex-col items-center justify-center text-center shrink-0 shadow-2xs group-hover:border-b400 transition-colors">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-b700 leading-none">
                                  {monthShort}
                                </span>
                                <span className="text-base font-extrabold text-b900 leading-none mt-0.5">
                                  {dayNum}
                                </span>
                              </div>
                            </td>
                            <td className="py-2.5 px-3 align-middle">
                              <div className="font-semibold text-g900 text-[13px]">
                                {exam.courseUnitCode || (exam.isResit ? (resit?.refCode || 'Resit Schedule') : 'All Course Units')}
                              </div>
                              <div className="text-[11px] text-g500 truncate max-w-[190px]" title={exam.courseUnitName || undefined}>
                                {exam.courseUnitName || (exam.isResit ? 'Resit window schedule' : 'Common schedule')}
                              </div>
                            </td>
                            <td className="py-2.5 px-3 align-middle">
                              <span className={`badge ${typeBadge.badgeClass}`}>
                                {typeBadge.label}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 align-middle text-[12px] text-g700">
                              <div className="font-medium text-g800 flex items-center gap-1">
                                <i className="lni lni-timer text-g400 text-xs" />
                                <span>
                                  {formatSafeTime(exam.startDateTime)} – {formatSafeTime(exam.endDateTime)}
                                </span>
                              </div>
                              {durationStr && (
                                <div className="mt-0.5">
                                  <span className="badge badge-grey text-[10px] py-0 px-1.5">
                                    {durationStr}
                                  </span>
                                </div>
                              )}
                            </td>
                            <td className="py-2.5 px-3 align-middle text-center">
                              <span
                                className={`badge ${
                                  isPublished ? 'badge-green' : 'badge-grey'
                                } inline-flex items-center gap-1.5`}
                              >
                                {isPublished && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                )}
                                {isPublished ? 'Published' : 'Draft'}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="adm-queue-state flex-1 flex flex-col items-center justify-center py-8">
                  <div className="w-10 h-10 rounded-full bg-g50 border border-g200 flex items-center justify-center text-g400 mb-2 text-lg">
                    <i className="lni lni-calendar" />
                  </div>
                  <div className="text-sm font-semibold text-g800">No scheduled exams</div>
                  <div className="text-xs text-g400 mt-0.5 max-w-xs text-center">
                    Upcoming UE exams and class tests will appear here once scheduled.
                  </div>
                </div>
              )}
            </div>

            {activeScheduleTotal > 5 && (
              <div className="mt-3 px-3 pb-2">
                <Pagination
                  page={examPage}
                  totalPages={scheduledExamsPages}
                  totalCount={activeScheduleTotal}
                  itemLabel="exams"
                  onPageChange={setExamPage}
                />
              </div>
            )}

            <div className="mt-2.5 pt-2 border-t border-g100 flex items-center justify-between text-xs text-g500">
              <span className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${displayExams.length > 0 ? 'bg-indigo-500' : 'bg-g400'}`} />
                Schedule Status
              </span>
              <span className="font-semibold text-g800">
                {displayExams.length > 0
                  ? `${activeScheduleTotal} scheduled exam${activeScheduleTotal === 1 ? '' : 's'}`
                  : 'No scheduled sessions'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tertiary Cards: Equal Height Aligned Across all 3 Columns with Light Gray Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 items-stretch">
        {/* Card 1: Hall Ticket Clearance Gate */}
        <div className="card flex flex-col justify-between h-full !p-0 overflow-hidden">
          <div className="card-hdr !mb-0 px-4 py-2.5 bg-slate-50 border-b border-slate-200/90 flex items-center justify-between !flex-nowrap">
            <div className="min-w-0 pr-2">
              <div className="card-title text-sm flex items-center gap-1.5 truncate">
                <i className="lni lni-shield text-blue-600 shrink-0" />
                <span>Hall Ticket Clearance Gate</span>
              </div>
              <div className="card-sub text-[11px] text-g400 truncate">Current Academic Intake Status</div>
            </div>
            <button
              type="button"
              className="btn btn-neu btn-xs shrink-0 whitespace-nowrap bg-white"
              onClick={() => router.push('/assessment/hall-ticket')}
            >
              View
            </button>
          </div>

          <div className="p-4 flex-1 flex flex-col justify-between">
            <div>
              {/* Visual Clearance Gauge Meter */}
              <div className="mb-2 p-2 bg-g50/70 rounded-lg border border-g100/80">
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="font-medium text-g600">Term 1: <strong className="text-b700 font-bold">{term1Rate}%</strong></span>
                  <span className="font-medium text-g600">Term 2: <strong className="text-cyan-700 font-bold">{term2Rate}%</strong></span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="h-1.5 rounded-full bg-g200 overflow-hidden">
                    <div className="h-full rounded-full bg-blue-600 transition-all duration-500" style={{ width: `${term1Rate}%` }} />
                  </div>
                  <div className="h-1.5 rounded-full bg-g200 overflow-hidden">
                    <div className="h-full rounded-full bg-cyan-600 transition-all duration-500" style={{ width: `${term2Rate}%` }} />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center text-xs py-0.5 border-b border-g50">
                  <span className="font-medium text-g700">Registered Students</span>
                  <span className="font-bold text-g900">
                    {hallTicketLoading ? '...' : totalRegisteredStudents.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs py-0.5 border-b border-g50">
                  <span className="font-medium text-g700">Term 1 Hall Tickets Issued</span>
                  <span className="badge badge-green font-semibold">
                    {hallTicketLoading ? '...' : term1Issued.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs py-0.5 border-b border-g50">
                  <span className="font-medium text-g700">Term 1 Pending Clearance</span>
                  <span className="badge badge-blue font-semibold">
                    {hallTicketLoading ? '...' : term1Pending.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs py-0.5 border-b border-g50">
                  <span className="font-medium text-g700">Term 2 Hall Tickets Issued</span>
                  <span className="badge badge-green font-semibold">
                    {hallTicketLoading ? '...' : term2Issued.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs py-0.5">
                  <span className="font-medium text-g700">Term 2 Pending Clearance</span>
                  <span className="badge badge-cyan font-semibold">
                    {hallTicketLoading ? '...' : term2Pending.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-2.5 pt-2 border-t border-g100 text-[11px] text-g500 flex items-center justify-between">
              <span>Awaiting Issuance</span>
              <span className="font-bold text-g800">
                {hallTicketLoading ? '...' : `${totalPendingHallTickets.toLocaleString()} tickets`}
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Resit Summary (Equal Height Matching Card 1 & Card 3) */}
        <div className="card flex flex-col justify-between h-full !p-0 overflow-hidden">
          <div className="card-hdr !mb-0 px-4 py-2.5 bg-slate-50 border-b border-slate-200/90 flex items-center justify-between !flex-nowrap">
            <div className="min-w-0 pr-2">
              <div className="card-title text-sm flex items-center gap-1.5 truncate">
                <i className="lni lni-reload text-emerald-600 shrink-0" />
                <span>Resit Summary</span>
              </div>
              <div className="card-sub text-[11px] text-g400 truncate" title={resit?.refCode}>
                {resitLoading ? 'Loading resit config...' : (resit?.refCode ?? 'No active resit window')}
              </div>
            </div>
            {resit && (
              <button
                type="button"
                className="btn btn-neu btn-xs shrink-0 whitespace-nowrap bg-white"
                onClick={() => router.push('/assessment/resit-applications')}
              >
                Open
              </button>
            )}
          </div>

          <div className="p-4 flex-1 flex flex-col justify-between">
            {resitLoading ? (
              <div className="adm-queue-state py-6">Loading resit details…</div>
            ) : resit ? (
              <>
                <div>
                  {/* Active Resit Fee Clearance Meter */}
                  <div className="mb-2 p-2 bg-g50/70 rounded-lg border border-g100/80">
                    <div className="flex justify-between items-center text-[11px] mb-1">
                      <span className="font-medium text-g600">Fee Clearance Rate</span>
                      <span className="font-bold text-emerald-700">
                        {resit.registeredStudentCount > 0
                          ? `${Math.round((resit.feeClearedStudentCount / resit.registeredStudentCount) * 100)}%`
                          : '0%'}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-g200 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                        style={{
                          width: `${
                            resit.registeredStudentCount > 0
                              ? Math.round((resit.feeClearedStudentCount / resit.registeredStudentCount) * 100)
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between items-center text-xs py-0.5 border-b border-g50">
                      <span className="font-medium text-g700">Applications Window</span>
                      <span className="badge badge-amber font-semibold">
                        {formatResitDates() ?? '—'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs py-0.5 border-b border-g50">
                      <span className="font-medium text-g700">Registered Students</span>
                      <span className="badge badge-blue font-semibold">
                        {resit.registeredStudentCount.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs py-0.5 border-b border-g50">
                      <span className="font-medium text-g700">Fee Cleared Students</span>
                      <span className="badge badge-green font-semibold">
                        {resit.feeClearedStudentCount.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs py-0.5 border-b border-g50">
                      <span className="font-medium text-g700">Registered Course Units</span>
                      <span className="badge bg-purple-50 text-purple-700 border border-purple-200 font-semibold">
                        {resit.registeredCourseUnitCount.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs py-0.5">
                      <span className="font-medium text-g700">Fee Cleared Units</span>
                      <span className="badge badge-green font-semibold">
                        {resit.feeClearedCourseUnitCount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div>
                  {/* Inactive Resit Status Meter */}
                  <div className="mb-2 p-2 bg-g50/70 rounded-lg border border-g100/80 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-g600">
                      <span className="w-2 h-2 rounded-full bg-g400 shrink-0" />
                      <span className="font-medium">Resit Window Inactive</span>
                    </div>
                    <span className="text-[10px] text-g400">Current Intake</span>
                  </div>

                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between items-center text-xs py-0.5 border-b border-g50">
                      <span className="font-medium text-g700">Applications Window</span>
                      <span className="badge badge-grey font-semibold">Closed</span>
                    </div>
                    <div className="flex justify-between items-center text-xs py-0.5 border-b border-g50">
                      <span className="font-medium text-g700">Registered Students</span>
                      <span className="badge badge-grey font-semibold">0</span>
                    </div>
                    <div className="flex justify-between items-center text-xs py-0.5 border-b border-g50">
                      <span className="font-medium text-g700">Fee Cleared Students</span>
                      <span className="badge badge-grey font-semibold">0</span>
                    </div>
                    <div className="flex justify-between items-center text-xs py-0.5 border-b border-g50">
                      <span className="font-medium text-g700">Registered Course Units</span>
                      <span className="badge badge-grey font-semibold">0</span>
                    </div>
                    <div className="flex justify-between items-center text-xs py-0.5">
                      <span className="font-medium text-g700">Fee Cleared Units</span>
                      <span className="badge badge-grey font-semibold">0</span>
                    </div>
                  </div>
                </div>
              </>
            )}

            <div className="mt-2.5 pt-2 border-t border-g100 text-[11px] text-g500 flex items-center justify-between">
              <span>Schedule Status</span>
              <span className="font-semibold text-g800">
                {resit ? `${scheduledExamsTotal} scheduled exams` : 'Resit registration closed'}
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Assessment Activity Breakdown with Workload Distribution Bar */}
        <div className="card flex flex-col justify-between h-full !p-0 overflow-hidden">
          <div className="card-hdr !mb-0 px-4 py-2.5 bg-slate-50 border-b border-slate-200/90 flex items-center justify-between !flex-nowrap">
            <div className="min-w-0 pr-2">
              <div className="card-title text-sm flex items-center gap-1.5 truncate">
                <i className="lni lni-bar-chart text-purple-600 shrink-0" />
                <span>Assessment Activity</span>
              </div>
              <div className="card-sub text-[11px] text-g400 truncate">Current Intake Submissions & Workload</div>
            </div>
            <button
              type="button"
              className="btn btn-neu btn-xs shrink-0 whitespace-nowrap bg-white"
              onClick={() => router.push('/assessment/ia-evaluation')}
            >
              Details
            </button>
          </div>

          <div className="p-4 flex-1 flex flex-col justify-between">
            <div>
              {/* Segmented Workload Distribution Meter */}
              <div className="mb-2 p-2 bg-g50/70 rounded-lg border border-g100/80">
                <div className="flex justify-between items-center text-[11px] mb-1">
                  <span className="font-medium text-g600">Workload Mix</span>
                  <span className="font-bold text-g800">{totalWorkload.toLocaleString()} items</span>
                </div>
                <div className="h-1.5 rounded-full bg-g200 overflow-hidden flex">
                  <div className="h-full bg-purple-500 transition-all duration-500" style={{ width: `${cwEvalPct}%` }} title={`CW Evaluations: ${cwEvalPct}%`} />
                  <div className="h-full bg-amber-500 transition-all duration-500" style={{ width: `${cwSubPct}%` }} title={`CW Submissions: ${cwSubPct}%`} />
                  <div className="h-full bg-rose-500 transition-all duration-500" style={{ width: `${testPct}%` }} title={`Class Tests: ${testPct}%`} />
                  <div className="h-full bg-indigo-500 transition-all duration-500" style={{ width: `${qpPct}%` }} title={`QP Vetting: ${qpPct}%`} />
                </div>
                <div className="flex items-center justify-between mt-1 text-[10px] text-g400">
                  <span className="inline-flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-purple-500" /> CW Eval</span>
                  <span className="inline-flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> CW Sub</span>
                  <span className="inline-flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Tests</span>
                  <span className="inline-flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-indigo-500" /> QP</span>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center text-xs py-0.5 border-b border-g50">
                  <span className="font-medium text-g700">Total Workload Items</span>
                  <span className="font-bold text-g900">
                    {overviewLoading || lecturerLoading ? '...' : totalWorkload.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs py-0.5 border-b border-g50">
                  <span className="font-medium text-g700">CW Evaluations Pending</span>
                  <span className="badge bg-purple-50 text-purple-700 border border-purple-200 font-semibold">
                    {overviewLoading || lecturerLoading ? '...' : cwEvaluationPending.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs py-0.5 border-b border-g50">
                  <span className="font-medium text-g700">CW Submissions Pending</span>
                  <span className="badge badge-amber font-semibold">
                    {overviewLoading || lecturerLoading ? '...' : cwSubmissionPending.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs py-0.5 border-b border-g50">
                  <span className="font-medium text-g700">Class Tests Pending</span>
                  <span className="badge badge-red font-semibold">
                    {overviewLoading || lecturerLoading ? '...' : classTestSubmissionPending.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs py-0.5">
                  <span className="font-medium text-g700">QP Awaiting Vetting</span>
                  <span className="badge badge-amber font-semibold">
                    {overviewLoading || lecturerLoading ? '...' : qpVettingPending.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-2.5 pt-2 border-t border-g100 text-[11px] text-g500 flex items-center justify-between">
              <span>Workload Scope</span>
              <span className="font-semibold text-g800">
                {isViewingTeaching ? 'Personal Teaching Subjects' : 'University Intake Totals'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <Toast toast={toast} />
    </div>
  )
}
