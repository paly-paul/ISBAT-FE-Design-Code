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
  // 2. Computed Metrics & Dual-View Scope (Enhancement #3: Dean-Lecturer Toggle)
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
    ? { label: 'Lecturer', class: 'bg-emerald-100 text-emerald-700 border-emerald-200' }
    : isRegistrar
    ? { label: 'Registrar', class: 'bg-purple-100 text-purple-700 border-purple-200' }
    : isDean
    ? { label: 'Dean', class: 'bg-blue-100 text-blue-700 border-blue-200' }
    : { label: 'Assessment', class: 'bg-slate-100 text-slate-700 border-slate-200' }

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

  // Safely find Term 1 and Term 2 records from hallTicket.terms (Enhancement #2)
  const term1 = hallTicket?.terms?.find(t => t.term === 1) ?? hallTicket?.terms?.[0]
  const term2 = hallTicket?.terms?.find(t => t.term === 2) ?? hallTicket?.terms?.[1]

  const term1Pending = term1?.pendingCount ?? 0
  const term1Issued = term1?.issuedCount ?? 0
  const term2Pending = term2?.pendingCount ?? 0
  const term2Issued = term2?.issuedCount ?? 0
  const totalRegisteredStudents = hallTicket?.registeredStudentCount ?? 0
  const totalPendingHallTickets = term1Pending + term2Pending

  // Format resit dates dynamically and safely
  const formatResitDates = () => {
    if (!resit?.applicationOpenDate || !resit?.applicationCloseDate) return null
    return `${formatDate(resit.applicationOpenDate)} – ${formatDate(resit.applicationCloseDate)}`
  }

  // ---------------------------------------------------------------------------
  // 3. Dynamic Pending Actions List from Real API Data (Enhancement #4 included)
  // ---------------------------------------------------------------------------
  interface PendingActionItem {
    id: string
    title: string
    subtitle: string
    tag: string
    tagColor: string
    buttonText: string
    onAction: () => void
    icon: string
    iconBg: string
    iconColor: string
    progressPercent?: number
    pendingCount?: number
  }

  const pendingActions: PendingActionItem[] = useMemo(() => {
    const list: PendingActionItem[] = []

    // Action 1: Question Papers awaiting vetting
    if (qpVettingPending > 0) {
      list.push({
        id: 'qp-vetting',
        title: `${qpVettingPending} UE Question Paper${qpVettingPending > 1 ? 's' : ''} Awaiting Vetting`,
        subtitle: 'Vetting Committee review required on question papers before exam scheduling',
        tag: 'Pending Vetting',
        tagColor: 'text-amber-600 bg-amber-50',
        buttonText: 'Review',
        onAction: () => router.push('/assessment/ue-questions'),
        icon: '🔍',
        iconBg: 'bg-[#fef9c3]',
        iconColor: 'text-amber-600',
      })
    }

    // Action 2: Coursework evaluations pending (IA evaluation)
    if (cwEvaluationPending > 0) {
      list.push({
        id: 'cw-eval',
        title: `${cwEvaluationPending} Coursework Evaluation${cwEvaluationPending > 1 ? 's' : ''} Pending`,
        subtitle: `${cwSubmissionPending.toLocaleString()} submitted coursework assignments awaiting lecturer grading`,
        tag: 'Evaluation Due',
        tagColor: 'text-purple-600 bg-purple-50',
        buttonText: 'Evaluate',
        onAction: () => router.push('/assessment/ia-evaluation'),
        icon: '📋',
        iconBg: 'bg-purple-100',
        iconColor: 'text-purple-700',
      })
    }

    // Action 3: Term 1 Hall Tickets Pending
    if (term1Pending > 0) {
      list.push({
        id: 'ht-term-1',
        title: `${term1Pending} Term 1 Hall Ticket${term1Pending > 1 ? 's' : ''} Not Issued`,
        subtitle: `${totalRegisteredStudents} registered students · Fee clearance (50%) & CW completion required`,
        tag: 'Term 1 Pending',
        tagColor: 'text-blue-600 bg-blue-50',
        buttonText: 'View',
        onAction: () => router.push('/assessment/hall-ticket'),
        icon: '🎫',
        iconBg: 'bg-[#e0f2fe]',
        iconColor: 'text-blue-600',
      })
    }

    // Action 4: Term 2 Hall Tickets Pending
    if (term2Pending > 0) {
      list.push({
        id: 'ht-term-2',
        title: `${term2Pending} Term 2 Hall Ticket${term2Pending > 1 ? 's' : ''} Not Issued`,
        subtitle: '100% fee clearance, Guild & NCHE fee checks required before issuance',
        tag: 'Term 2 Pending',
        tagColor: 'text-indigo-600 bg-indigo-50',
        buttonText: 'View',
        onAction: () => router.push('/assessment/hall-ticket'),
        icon: '🎫',
        iconBg: 'bg-indigo-100',
        iconColor: 'text-indigo-600',
      })
    }

    // Action 5: Lecturer Pending Resit Evaluations with Grading Progress Rate (Enhancement #4)
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
          tagColor: 'text-emerald-700 bg-emerald-50 border border-emerald-200',
          buttonText: 'Evaluate',
          progressPercent: evalRate,
          pendingCount: evalItem.pendingCount,
          onAction: () =>
            router.push(
              `/assessment/resit-evaluation?unit=${evalItem.courseUnitGuid}&intake=${resit.academicIntakeGuid}&config=${resit.resitConfigGuid}`
            ),
          icon: '📝',
          iconBg: 'bg-emerald-100',
          iconColor: 'text-emerald-700',
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
        tagColor: 'text-rose-600 bg-rose-50',
        buttonText: 'View Tests',
        onAction: () => router.push('/assessment/bulk-exam-scheduler'),
        icon: '⏱️',
        iconBg: 'bg-rose-100',
        iconColor: 'text-rose-700',
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
  // 4. Scheduled Exams / Schedules List (Live from Resit or Lecturer API)
  // ---------------------------------------------------------------------------
  const scheduledExamsList = resit?.scheduledExams?.items ?? []
  const scheduledExamsTotal = resit?.scheduledExams?.totalCount ?? 0
  const scheduledExamsPages = Math.ceil(scheduledExamsTotal / 5) || 1

  const lecturerSchedules = lecturer?.schedules ?? []

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
      `Upcoming Scheduled Exams,${scheduledExamsTotal}`,
    ]

    const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' })
    downloadBlob(blob, `Assessment_Dashboard_Summary_${new Date().toISOString().slice(0, 10)}.csv`)
    showToast('Summary report downloaded successfully', 'success')
  }

  const getExamTypeLabel = (type: number) => {
    switch (type) {
      case 1:
        return { label: 'Class Test', class: 'bg-amber-100 text-amber-800' }
      case 2:
        return { label: 'Coursework', class: 'bg-blue-100 text-blue-800' }
      case 5:
        return { label: 'University Exam', class: 'bg-purple-100 text-purple-800' }
      default:
        return { label: 'Exam', class: 'bg-slate-100 text-slate-700' }
    }
  }

  return (
    <div className="page active">
      {/* Header with Dual View Switcher (Enhancement #3) */}
      <div className="pg-hdr">
        <div>
          <div className="pg-title">Assessment Dashboard</div>
          <div className="pg-sub">
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

          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${roleBadge.class}`}>
            {roleBadge.label}
          </span>
          <button
            type="button"
            className="btn btn-neu btn-sm flex items-center gap-1.5"
            onClick={handleExportSummary}
            title="Download CSV Summary"
          >
            <i className="lni lni-download"></i>
            <span>Export Summary</span>
          </button>
        </div>
      </div>

      {/* Top 4 Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        {/* Card 1: Coursework Evaluations Pending */}
        <div
          onClick={() => router.push('/assessment/ia-evaluation')}
          className="card card-sm flex flex-col gap-1 cursor-pointer hover:shadow-md transition-shadow group"
        >
          <div className="w-9 h-9 rounded-lg flex items-center justify-center text-lg mb-1 bg-purple-100 text-purple-700 group-hover:scale-105 transition-transform">
            📋
          </div>
          <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            CW Evaluations Pending
          </div>
          <div className="text-3xl font-bold text-slate-900 leading-none">
            {overviewLoading || lecturerLoading ? (
              <span className="text-slate-300 text-2xl">...</span>
            ) : (
              cwEvaluationPending.toLocaleString()
            )}
          </div>
          <div className="text-[11px] text-slate-500">
            {overviewLoading ? 'Loading...' : `${cwSubmissionPending.toLocaleString()} submissions awaiting grading`}
          </div>
          <div className="h-1 rounded-full bg-slate-100 overflow-hidden mt-1">
            <div
              className="h-full rounded-full bg-purple-500 transition-all"
              style={{ width: `${Math.min(100, cwEvaluationPending > 0 ? Math.max(15, cwEvaluationPending) : 0)}%` }}
            ></div>
          </div>
        </div>

        {/* Card 2: QP Awaiting Vetting */}
        <div
          onClick={() => router.push('/assessment/ue-questions')}
          className="card card-sm flex flex-col gap-1 cursor-pointer hover:shadow-md transition-shadow group"
        >
          <div className="w-9 h-9 rounded-lg flex items-center justify-center text-lg mb-1 bg-amber-100 text-amber-600 group-hover:scale-105 transition-transform">
            ⏳
          </div>
          <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            QP Awaiting Vetting
          </div>
          <div className="text-3xl font-bold text-slate-900 leading-none">
            {overviewLoading || lecturerLoading ? (
              <span className="text-slate-300 text-2xl">...</span>
            ) : (
              qpVettingPending.toLocaleString()
            )}
          </div>
          <div className="text-[11px] text-slate-500">
            {qpVettingPending > 0 ? 'Vetting committee review pending' : 'All question papers vetted'}
          </div>
          <div className="h-1 rounded-full bg-slate-100 overflow-hidden mt-1">
            <div
              className={`h-full rounded-full transition-all ${qpVettingPending > 0 ? 'bg-amber-500' : 'bg-green-500'}`}
              style={{ width: `${qpVettingPending > 0 ? Math.min(100, Math.max(20, qpVettingPending * 10)) : 100}%` }}
            ></div>
          </div>
        </div>

        {/* Card 3: Hall Tickets Pending with Term 1 & Term 2 Split (Enhancement #2) */}
        <div
          onClick={() => router.push('/assessment/hall-ticket')}
          className="card card-sm flex flex-col gap-1 cursor-pointer hover:shadow-md transition-shadow group"
        >
          <div className="w-9 h-9 rounded-lg flex items-center justify-center text-lg mb-1 bg-blue-100 text-blue-600 group-hover:scale-105 transition-transform">
            🎫
          </div>
          <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Hall Tickets Pending
          </div>
          <div className="text-3xl font-bold text-slate-900 leading-none">
            {hallTicketLoading ? (
              <span className="text-slate-300 text-2xl">...</span>
            ) : (
              totalPendingHallTickets.toLocaleString()
            )}
          </div>
          {/* Term 1 & Term 2 Split Pills */}
          <div className="flex items-center gap-1.5 mt-1 text-[11px]">
            <span className="bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded-full border border-blue-200">
              T1: {term1Pending}
            </span>
            <span className="bg-indigo-50 text-indigo-700 font-semibold px-2 py-0.5 rounded-full border border-indigo-200">
              T2: {term2Pending}
            </span>
            <span className="text-slate-400 text-[10px]">
              of {totalRegisteredStudents.toLocaleString()}
            </span>
          </div>
          <div className="h-1 rounded-full bg-slate-100 overflow-hidden mt-1">
            <div
              className="h-full rounded-full bg-blue-500 transition-all"
              style={{
                width: `${
                  totalRegisteredStudents > 0
                    ? Math.round(((term1Issued + term2Issued) / (totalRegisteredStudents * 2)) * 100)
                    : 0
                }%`,
              }}
            ></div>
          </div>
        </div>

        {/* Card 4: Resit Applications / Registrations */}
        <div
          onClick={() => router.push(resit ? '/assessment/resit-applications' : '/assessment/bulk-exam-scheduler')}
          className="card card-sm flex flex-col gap-1 cursor-pointer hover:shadow-md transition-shadow group"
        >
          <div className="w-9 h-9 rounded-lg flex items-center justify-center text-lg mb-1 bg-emerald-100 text-emerald-700 group-hover:scale-105 transition-transform">
            🔄
          </div>
          <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Resit Registrations
          </div>
          <div className="text-3xl font-bold text-slate-900 leading-none">
            {resitLoading ? (
              <span className="text-slate-300 text-2xl">...</span>
            ) : (
              (resit?.registeredStudentCount ?? 0).toLocaleString()
            )}
          </div>
          <div className="text-[11px] text-slate-500">
            {resitLoading
              ? 'Loading...'
              : resit
              ? `${resit.feeClearedStudentCount} fee cleared · ${resit.registeredCourseUnitCount} units`
              : 'No active resit window'}
          </div>
          <div className="h-1 rounded-full bg-slate-100 overflow-hidden mt-1">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all"
              style={{
                width: `${
                  resit && resit.registeredStudentCount > 0
                    ? Math.round((resit.feeClearedStudentCount / resit.registeredStudentCount) * 100)
                    : 0
                }%`,
              }}
            ></div>
          </div>
        </div>
      </div>

      {/* Middle Row: Pending Actions & Upcoming Schedules */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
        {/* Pending Actions List */}
        <div className="bg-white rounded-[14px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-slate-100 p-5 flex flex-col justify-between">
          <div>
            <div className="font-bold text-[15px] mb-4 flex items-center gap-2">
              📌 Pending Actions
              <span className="bg-red-50 text-red-500 rounded-full px-2.5 py-0.5 text-[11px] font-semibold">
                {pendingActions.length} item{pendingActions.length !== 1 ? 's' : ''}
              </span>
            </div>

            {isInitialLoading ? (
              <div className="py-8 text-center text-slate-400 text-sm">Loading pending actions...</div>
            ) : pendingActions.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <div className="text-3xl mb-2">🎉</div>
                <div className="text-[14px] font-medium text-slate-700">No pending actions</div>
                <div className="text-[12px] text-slate-400 mt-1">
                  All question papers, evaluations, and tickets for this intake are current.
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {pendingActions.map(action => (
                  <div
                    key={action.id}
                    className="flex items-start gap-3 p-3 bg-white rounded-[12px] border border-slate-100 shadow-xs hover:border-slate-200 transition-colors"
                  >
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0 ${action.iconBg} ${action.iconColor}`}
                    >
                      {action.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0">
                          <div className="text-[13px] font-semibold text-slate-900 truncate">
                            {action.title}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5 leading-tight">
                            {action.subtitle}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={action.onAction}
                          className="px-3 py-1 bg-white border border-slate-200 rounded-full text-slate-700 text-[11px] font-medium shadow-xs hover:bg-slate-50 transition-colors shrink-0"
                        >
                          {action.buttonText}
                        </button>
                      </div>

                      {/* Grading progress bar for resit evaluations (Enhancement #4) */}
                      {action.progressPercent !== undefined ? (
                        <div className="flex items-center gap-2 mt-2">
                          <div className="w-[120px] h-1.5 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-emerald-500 transition-all"
                              style={{ width: `${action.progressPercent}%` }}
                            ></div>
                          </div>
                          <span className="text-[10px] font-semibold text-emerald-700">
                            {action.progressPercent}% completed
                          </span>
                          {action.pendingCount !== undefined && action.pendingCount > 0 && (
                            <span className="text-[10px] text-slate-400">
                              ({action.pendingCount} remaining)
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`text-[10px] font-semibold rounded px-1.5 py-0.5 ${action.tagColor}`}>
                            {action.tag}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Scheduled Exams / Schedules Table with Time Window & Duration (Enhancement #1) */}
        <div className="bg-white rounded-[14px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-slate-100 p-5 flex flex-col justify-between">
          <div>
            <div className="font-bold text-[15px] mb-4 flex items-center justify-between">
              <span>📅 Upcoming Scheduled Exams</span>
              {scheduledExamsTotal > 0 && (
                <span className="text-xs text-slate-500 font-normal">
                  Total: {scheduledExamsTotal} exam{scheduledExamsTotal > 1 ? 's' : ''}
                </span>
              )}
            </div>

            {resitLoading || lecturerLoading ? (
              <div className="py-8 text-center text-slate-400 text-sm">Loading scheduled exams...</div>
            ) : scheduledExamsList.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-[13px]">
                  <thead>
                    <tr className="text-[11px] font-bold text-white uppercase bg-[#4f46e5]">
                      <th className="px-3 py-3">Course Unit</th>
                      <th className="px-3 py-3">Exam Type</th>
                      <th className="px-3 py-3">Date, Time & Duration</th>
                      <th className="px-3 py-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scheduledExamsList.map((exam, idx) => {
                      const typeBadge = getExamTypeLabel(exam.examType)
                      const isPublished = exam.publishStatus === 1
                      const courseUnitTitle =
                        exam.courseUnitCode ||
                        (exam.examType === 1
                          ? 'Class Test Window'
                          : exam.examType === 2
                          ? 'Coursework Window'
                          : 'General Window')
                      const durationStr = formatDuration(exam.startDateTime, exam.endDateTime)
                      return (
                        <tr
                          key={exam.scheduleGuid || idx}
                          className={`hover:bg-slate-50/50 transition-colors ${
                            idx === scheduledExamsList.length - 1 ? '' : 'border-b border-slate-100'
                          }`}
                        >
                          <td className="px-3 py-3 align-middle">
                            <div className="font-bold text-slate-900 text-[13px]">{courseUnitTitle}</div>
                            <div className="text-[12px] text-slate-500">
                              {exam.courseUnitName || 'Intake-wide schedule'}
                            </div>
                          </td>
                          <td className="px-3 py-3 align-middle">
                            <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${typeBadge.class}`}>
                              {typeBadge.label}
                            </span>
                          </td>
                          <td className="px-3 py-3 align-middle text-[12px] text-slate-700">
                            <div className="font-medium text-slate-900">{formatDate(exam.startDateTime)}</div>
                            <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                              <span>
                                {formatSafeTime(exam.startDateTime)} – {formatSafeTime(exam.endDateTime)}
                              </span>
                              {durationStr && (
                                <span className="bg-slate-100 text-slate-600 rounded px-1.5 py-0.2 text-[10px] font-semibold border border-slate-200">
                                  {durationStr}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-3 align-middle text-center">
                            <span
                              className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                                isPublished
                                  ? 'bg-[#d1fae5] text-[#047857]'
                                  : 'bg-slate-100 text-slate-500'
                              }`}
                            >
                              {isPublished ? 'Published' : 'Draft'}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : lecturerSchedules.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-[13px]">
                  <thead>
                    <tr className="text-[11px] font-bold text-white uppercase bg-[#4f46e5]">
                      <th className="px-3 py-3">Subject</th>
                      <th className="px-3 py-3">Schedule</th>
                      <th className="px-3 py-3">Date, Time & Duration</th>
                      <th className="px-3 py-3 text-center">Max Mark</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lecturerSchedules.slice(0, 5).map((sched, idx) => {
                      const typeBadge = getExamTypeLabel(sched.scheduleType)
                      const durationStr = formatDuration(sched.startDateTime, sched.endDateTime)
                      return (
                        <tr
                          key={sched.scheduleGuid || idx}
                          className={`hover:bg-slate-50/50 transition-colors ${
                            idx === lecturerSchedules.length - 1 ? '' : 'border-b border-slate-100'
                          }`}
                        >
                          <td className="px-3 py-3 align-middle">
                            <div className="font-bold text-slate-900 text-[13px]">
                              {sched.courseUnitCode || 'Course Unit'}
                            </div>
                            <div className="text-[12px] text-slate-500">{sched.courseUnitName || '—'}</div>
                          </td>
                          <td className="px-3 py-3 align-middle">
                            <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${typeBadge.class}`}>
                              {sched.number ? `${typeBadge.label} ${sched.number}` : typeBadge.label}
                            </span>
                          </td>
                          <td className="px-3 py-3 align-middle text-[12px] text-slate-700">
                            <div className="font-medium text-slate-900">{formatDate(sched.startDateTime)}</div>
                            <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                              <span>
                                {formatSafeTime(sched.startDateTime)} – {formatSafeTime(sched.endDateTime)}
                              </span>
                              {durationStr && (
                                <span className="bg-slate-100 text-slate-600 rounded px-1.5 py-0.2 text-[10px] font-semibold border border-slate-200">
                                  {durationStr}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-3 align-middle text-center font-semibold text-slate-700">
                            {sched.maxMark ?? '—'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400">
                <div className="text-3xl mb-2">🗓️</div>
                <div className="text-[14px] font-medium text-slate-700">No scheduled exams</div>
                <div className="text-[12px] text-slate-400 mt-1">
                  Upcoming UE exams and class tests will appear here once scheduled.
                </div>
              </div>
            )}
          </div>

          {scheduledExamsTotal > 5 && (
            <div className="mt-3">
              <Pagination
                page={examPage}
                totalPages={scheduledExamsPages}
                totalCount={scheduledExamsTotal}
                onPageChange={setExamPage}
              />
            </div>
          )}
        </div>
      </div>

      {/* Tertiary Cards (Bottom Row) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        {/* Card 1: Hall Ticket Clearance Gate */}
        <div className="bg-white rounded-[14px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-slate-100 p-5 flex flex-col justify-between">
          <div>
            <div className="font-bold text-[14px] mb-1 text-slate-900">💰 Hall Ticket Clearance Gate</div>
            <div className="text-[12px] text-slate-500 mb-4 border-b border-slate-100 pb-3">
              Current Academic Intake Status
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center text-[13px] text-slate-700">
                <span>Registered Students</span>
                <span className="font-semibold text-slate-900">
                  {hallTicketLoading ? '...' : totalRegisteredStudents.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center text-[13px] text-slate-700">
                <span>Term 1 Hall Tickets Issued</span>
                <span className="bg-green-100 text-green-700 rounded-full px-2.5 py-0.5 text-[11px] font-medium">
                  {hallTicketLoading ? '...' : term1Issued.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center text-[13px] text-slate-700">
                <span>Term 1 Pending Clearance</span>
                <span className="bg-blue-100 text-blue-700 rounded-full px-2.5 py-0.5 text-[11px] font-medium">
                  {hallTicketLoading ? '...' : term1Pending.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center text-[13px] text-slate-700">
                <span>Term 2 Hall Tickets Issued</span>
                <span className="bg-green-100 text-green-700 rounded-full px-2.5 py-0.5 text-[11px] font-medium">
                  {hallTicketLoading ? '...' : term2Issued.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center text-[13px] text-slate-700">
                <span>Term 2 Pending Clearance</span>
                <span className="bg-indigo-100 text-indigo-700 rounded-full px-2.5 py-0.5 text-[11px] font-medium">
                  {hallTicketLoading ? '...' : term2Pending.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
            {hallTicketLoading
              ? 'Loading gate status...'
              : `${totalPendingHallTickets.toLocaleString()} total ticket${totalPendingHallTickets !== 1 ? 's' : ''} awaiting issue`}
          </div>
        </div>

        {/* Card 2: Resit Summary */}
        <div className="bg-white rounded-[14px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-slate-100 p-5 flex flex-col justify-between">
          <div>
            <div className="font-bold text-[14px] mb-1 text-slate-900">🔄 Resit Summary</div>
            <div className="text-[12px] text-slate-500 mb-4 border-b border-slate-100 pb-3 truncate">
              {resitLoading ? 'Loading resit config...' : (resit?.refCode ?? 'No active resit window')}
            </div>

            {resitLoading ? (
              <div className="py-6 text-center text-slate-400 text-xs">Loading resit details...</div>
            ) : resit ? (
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center text-[13px] text-slate-700">
                  <span>Applications Window</span>
                  <span className="bg-amber-100 text-amber-800 rounded-full px-2 py-0.5 text-[11px] font-medium">
                    {formatResitDates() ?? '—'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[13px] text-slate-700">
                  <span>Registered Students</span>
                  <span className="bg-blue-100 text-blue-700 rounded-full px-2.5 py-0.5 text-[11px] font-medium">
                    {resit.registeredStudentCount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[13px] text-slate-700">
                  <span>Fee Cleared Students</span>
                  <span className="bg-green-100 text-green-700 rounded-full px-2.5 py-0.5 text-[11px] font-medium">
                    {resit.feeClearedStudentCount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[13px] text-slate-700">
                  <span>Registered Course Units</span>
                  <span className="bg-purple-100 text-purple-700 rounded-full px-2.5 py-0.5 text-[11px] font-medium">
                    {resit.registeredCourseUnitCount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[13px] text-slate-700">
                  <span>Fee Cleared Units</span>
                  <span className="bg-emerald-100 text-emerald-700 rounded-full px-2.5 py-0.5 text-[11px] font-medium">
                    {resit.feeClearedCourseUnitCount.toLocaleString()}
                  </span>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-slate-400 text-xs">
                No active resit window configured for the current intake.
              </div>
            )}
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
            {resit ? `${scheduledExamsTotal} scheduled exams upcoming` : 'Resit registration closed'}
          </div>
        </div>

        {/* Card 3: Assessment Activity Breakdown */}
        <div className="bg-white rounded-[14px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-slate-100 p-5 flex flex-col justify-between">
          <div>
            <div className="font-bold text-[14px] mb-1 text-slate-900">📊 Assessment Activity</div>
            <div className="text-[12px] text-slate-500 mb-4 border-b border-slate-100 pb-3">
              Current Intake Submissions & Workload
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center text-[13px] text-slate-700">
                <span>CW Evaluations Pending</span>
                <span className="bg-purple-100 text-purple-700 rounded-full px-2.5 py-0.5 text-[11px] font-medium">
                  {overviewLoading || lecturerLoading ? '...' : cwEvaluationPending.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center text-[13px] text-slate-700">
                <span>CW Submissions Pending</span>
                <span className="bg-amber-100 text-amber-800 rounded-full px-2.5 py-0.5 text-[11px] font-medium">
                  {overviewLoading || lecturerLoading ? '...' : cwSubmissionPending.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center text-[13px] text-slate-700">
                <span>Class Tests Pending</span>
                <span className="bg-rose-100 text-rose-700 rounded-full px-2.5 py-0.5 text-[11px] font-medium">
                  {overviewLoading || lecturerLoading ? '...' : classTestSubmissionPending.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center text-[13px] text-slate-700">
                <span>QP Awaiting Vetting</span>
                <span className="bg-yellow-100 text-yellow-800 rounded-full px-2.5 py-0.5 text-[11px] font-medium">
                  {overviewLoading || lecturerLoading ? '...' : qpVettingPending.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
            Live counts across current academic intake
          </div>
        </div>
      </div>

      <Toast toast={toast} />
    </div>
  )
}
