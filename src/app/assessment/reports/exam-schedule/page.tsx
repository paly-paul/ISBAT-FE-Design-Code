'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useInfiniteQuery, useQueries } from '@tanstack/react-query'
import { ScrollTable } from '@/components/ScrollTable'
import { MultiSelect } from '@/components/MultiSelect'
import { SearchSelect } from '@/components/SearchSelect'
import DatePicker from '@/components/DatePicker'
import { LoadingState } from '@/components/TableLoadingState'
import { useIntakesDropdown } from '@/hooks/academic/useIntakes'
import { useProgramDropdown } from '@/hooks/academic/useProgramMaster'
import { useCourseUnitDropdown } from '@/hooks/academic/useCourseUnits'
import { getSemestersForProgram } from '@/lib/api/academic/semester'
import { getProgramCourseUnitsDropdown } from '@/lib/api/academic/programCourseUnits'
import { scrollToFirstError } from '@/lib/scrollToFirstError'
import { ReportExportControls } from '@/components/finance/ReportExportControls'
import {
  ExamScheduleReportFilters,
  ExamScheduleReportRow,
  getExamScheduleReportPreview,
  exportExamScheduleReport,
  SCHEDULE_TYPE_LABELS,
  SCHEDULE_TYPE,
  PUBLISH_STATUS,
  MODE,
  UE_TYPE,
  QUESTION_VERIFICATION,
  SCHEDULING_STATUS,
  SCHEDULING_STATUS_LABELS,
  UNDATABLE_SCHEDULE_TYPES,
} from '@/lib/api/assessment/examScheduleReport'

// Exam Schedule Report — erp-docs/pages/assessment/exam-schedule-report-page.md
// Route: /assessment/reports/exam-schedule
// Step-by-step infinite scroll & background export matching the Discount Report pattern.

interface FormState {
  scheduleTypes: string[]
  intakeGuids: string[]
  fromDate: string
  toDate: string
  programGuids: string[]
  semesterGuids: string[]
  courseUnitGuids: string[]
  publishStatuses: string[]
  modes: string[]
  ueTypes: string[]
  schedulingStatus: string
}

const EMPTY_FORM: FormState = {
  scheduleTypes: [],
  intakeGuids: [],
  fromDate: '',
  toDate: '',
  programGuids: [],
  semesterGuids: [],
  courseUnitGuids: [],
  publishStatuses: [],
  modes: [],
  ueTypes: [],
  schedulingStatus: String(SCHEDULING_STATUS.Scheduled),
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function fmtPlainDate(value: string | null | undefined): string {
  if (!value) return '—'
  const [y, m, d] = value.slice(0, 10).split('-')
  return y && m && d ? `${d} ${MONTHS[+m - 1]} ${y}` : value
}

function fmtYmd(ymd: string): string {
  return fmtPlainDate(ymd)
}

function fmtPlainTime(value: string | null | undefined): string {
  if (!value) return '—'
  const parts = value.split(':')
  return parts.length >= 2 ? `${parts[0]}:${parts[1]}` : value
}

function fmtEndTime(startTime: string | null | undefined, endTime: string | null | undefined): string {
  if (!endTime) return '—'
  const formatted = fmtPlainTime(endTime)
  if (startTime && endTime < startTime) {
    return `${formatted} (+1d)`
  }
  return formatted
}

function fmtUtcDateTime(utcStr: string | null | undefined): string {
  if (!utcStr) return '—'
  try {
    const isoStr = utcStr.endsWith('Z') || utcStr.includes('+') ? utcStr : `${utcStr}Z`
    const d = new Date(isoStr)
    if (isNaN(d.getTime())) return utcStr
    const day = String(d.getDate()).padStart(2, '0')
    const month = MONTHS[d.getMonth()]
    const year = d.getFullYear()
    const hours = String(d.getHours()).padStart(2, '0')
    const mins = String(d.getMinutes()).padStart(2, '0')
    return `${day}/${month}/${year} ${hours}:${mins}`
  } catch {
    return utcStr
  }
}

function fmtCount(n: number | null | undefined): string {
  if (n == null) return '—'
  return n.toLocaleString('en-US')
}

function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error) {
    if (err.message && err.message !== 'unknown') return err.message
    const code = (err as any).code
    if (code === 'forbidden') return 'You do not have permission to view the Exam Schedule Report (assessment.examschedulereport.get).'
    if (code === 'not_found') return 'Exam Schedule Report preview endpoint is not yet available on the backend server.'
    if (code === 'unauthorized') return 'Your session has expired. Please sign in again.'
  }
  return fallback
}

// Convert string array form state to API filters
function toFilters(f: FormState): ExamScheduleReportFilters {
  return {
    scheduleTypes: f.scheduleTypes.length ? f.scheduleTypes.map(Number) : undefined,
    intakeGuids: f.intakeGuids.length ? f.intakeGuids : undefined,
    fromDate: f.fromDate || undefined,
    toDate: f.toDate || undefined,
    programGuids: f.programGuids.length ? f.programGuids : undefined,
    semesterGuids: f.semesterGuids.length ? f.semesterGuids : undefined,
    courseUnitGuids: f.courseUnitGuids.length ? f.courseUnitGuids : undefined,
    publishStatuses: f.publishStatuses.length ? f.publishStatuses.map(Number) : undefined,
    modes: f.modes.length ? f.modes.map(Number) : undefined,
    ueTypes: f.ueTypes.length ? f.ueTypes.map(Number) : undefined,
    schedulingStatus: Number(f.schedulingStatus || SCHEDULING_STATUS.Scheduled),
  }
}

export default function ExamScheduleReportPage() {
  // ── Filters state ──────────────────────────────────────────────────────────
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const [filtersOpen, setFiltersOpen] = useState(true)

  function setField<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm(prev => ({ ...prev, [k]: v }))
    setErrors(prev => (prev[k] ? { ...prev, [k]: '' } : prev))
  }

  // ── Dropdown options ───────────────────────────────────────────────────────
  const intakesQuery = useIntakesDropdown()
  const programsQuery = useProgramDropdown()

  const intakeOptions = useMemo(
    () => (intakesQuery.data ?? []).map(i => ({ value: i.intakeGuid, label: `${i.intakeCode} — ${i.description}` })),
    [intakesQuery.data]
  )

  const programOptions = useMemo(
    () => (programsQuery.data ?? []).map(p => ({ value: p.programGuid, label: `${p.programName} (${p.programCode})` })),
    [programsQuery.data]
  )

  // Semesters for all selected programmes
  const semesterQueries = useQueries({
    queries: form.programGuids.map(pGuid => ({
      queryKey: ['academic', 'semesters', 'dropdownforprogram', pGuid],
      queryFn: () => getSemestersForProgram(pGuid),
      enabled: !!pGuid,
      staleTime: Infinity,
      gcTime: Infinity,
    })),
  })

  const semesterOptions = useMemo(() => {
    const map = new Map<string, string>()
    for (const q of semesterQueries) {
      for (const s of q.data ?? []) {
        if (!map.has(s.semesterGuid)) {
          map.set(s.semesterGuid, s.semName)
        }
      }
    }
    return Array.from(map.entries()).map(([value, label]) => ({ value, label }))
  }, [semesterQueries])

  // Search-as-you-type for course units when no programme is selected
  const [unitSearch, setUnitSearch] = useState('')
  const [debouncedUnitSearch, setDebouncedUnitSearch] = useState('')
  useEffect(() => {
    const t = setTimeout(() => setDebouncedUnitSearch(unitSearch), 250)
    return () => clearTimeout(t)
  }, [unitSearch])

  // Full course units dropdown (GET /api/v1/academic/courseunits/dropdown?search=)
  const allCourseUnitsQuery = useCourseUnitDropdown(debouncedUnitSearch, form.programGuids.length === 0)

  // Course units for selected programmes (GET /api/v1/academic/program-course-units/dropdown)
  const courseUnitQueries = useQueries({
    queries: form.programGuids.map(pGuid => ({
      queryKey: ['academic', 'program-course-units', 'dropdown', pGuid],
      queryFn: () => getProgramCourseUnitsDropdown(pGuid),
      enabled: !!pGuid,
      staleTime: Infinity,
      gcTime: Infinity,
    })),
  })

  // Course unit options: programme-scoped if programme selected, otherwise full global dropdown
  const courseUnitOptions = useMemo(() => {
    if (form.programGuids.length > 0) {
      const map = new Map<string, { code: string; name: string; semesterGuid: string }>()
      for (const q of courseUnitQueries) {
        for (const u of q.data ?? []) {
          if (!map.has(u.courseUnitGuid)) {
            map.set(u.courseUnitGuid, {
              code: u.courseUnitCode,
              name: u.courseUnitName,
              semesterGuid: u.semesterGuid,
            })
          }
        }
      }

      let entries = Array.from(map.entries())
      // If semesters are selected, filter units belonging to those semesters
      if (form.semesterGuids.length > 0) {
        entries = entries.filter(([, u]) => form.semesterGuids.includes(u.semesterGuid))
      }

      return entries.map(([guid, u]) => ({
        value: guid,
        label: `${u.code} — ${u.name}`,
      }))
    }

    return (allCourseUnitsQuery.data ?? []).map(u => ({
      value: u.courseUnitGuid,
      label: u.courseUnitCode ? `${u.courseUnitCode} — ${u.courseUnitName || '—'}` : (u.courseUnitName || '—'),
    }))
  }, [form.programGuids.length, courseUnitQueries, form.semesterGuids, allCourseUnitsQuery.data])

  // Cache unit labels so selected chips in recap preserve their text even when search filter changes
  const knownCourseUnits = useRef(new Map<string, string>())
  useEffect(() => {
    for (const o of courseUnitOptions) {
      knownCourseUnits.current.set(o.value, o.label)
    }
  }, [courseUnitOptions])

  // Fixed enums
  const scheduleTypeOptions = useMemo(
    () => [
      { value: String(SCHEDULE_TYPE.UniversityExam), label: SCHEDULE_TYPE_LABELS[1] },
      { value: String(SCHEDULE_TYPE.Coursework), label: SCHEDULE_TYPE_LABELS[2] },
      { value: String(SCHEDULE_TYPE.Test), label: SCHEDULE_TYPE_LABELS[3] },
      { value: String(SCHEDULE_TYPE.MockExam), label: SCHEDULE_TYPE_LABELS[4] },
      { value: String(SCHEDULE_TYPE.ResitUniversityExam), label: SCHEDULE_TYPE_LABELS[5] },
      { value: String(SCHEDULE_TYPE.ResitClassTest), label: SCHEDULE_TYPE_LABELS[6] },
      { value: String(SCHEDULE_TYPE.ResitCoursework), label: SCHEDULE_TYPE_LABELS[7] },
    ],
    []
  )

  const publishStatusOptions = useMemo(
    () => [
      { value: String(PUBLISH_STATUS.Unpublished), label: 'Unpublished' },
      { value: String(PUBLISH_STATUS.Published), label: 'Published' },
    ],
    []
  )

  const modeOptions = useMemo(
    () => [
      { value: String(MODE.Online), label: 'Online' },
      { value: String(MODE.Offline), label: 'Offline' },
    ],
    []
  )

  const ueTypeOptions = useMemo(
    () => [
      { value: String(UE_TYPE.Theory), label: 'Theory' },
      { value: String(UE_TYPE.Practical), label: 'Practical' },
    ],
    []
  )

  const schedulingStatusOptions = useMemo(
    () => [SCHEDULING_STATUS.Scheduled, SCHEDULING_STATUS.NotScheduled, SCHEDULING_STATUS.All]
      .map(s => ({ value: String(s), label: SCHEDULING_STATUS_LABELS[s] })),
    []
  )
  const formScheduling = Number(form.schedulingStatus || SCHEDULING_STATUS.Scheduled)

  // ── Dynamic Exclusion Hints ────────────────────────────────────────────────
  // Page doc business rules: filters can hide whole types. Show hint so missing types are not mistaken for missing data.
  // Note: Course unit filter no longer hides resit types as they are now broken down per unit.
  const exclusionHints = useMemo(() => {
    const hints: string[] = []
    if (form.programGuids.length > 0 || form.semesterGuids.length > 0) {
      hints.push('Programme and semester filters hide Resit University Exam, Resit Class Test and Resit Coursework (resits are not stored per programme).')
    }
    if (form.ueTypes.length > 0) {
      hints.push('Theory / Practical filter hides all schedule types except University Exam and Resit University Exam.')
    }
    if (form.publishStatuses.length > 0 || form.modes.length > 0) {
      hints.push('Publish status and mode filters hide Mock Exams (mock exams do not have mode or publish status).')
    }
    if (formScheduling === SCHEDULING_STATUS.NotScheduled) {
      const undatable = UNDATABLE_SCHEDULE_TYPES.map(t => SCHEDULE_TYPE_LABELS[t]).join(', ').replace(/, ([^,]*)$/, ' and $1')
      hints.push(`Not scheduled shows only ${undatable} (Mock Exams and resits always have a date). From / To dates are ignored.`)
    } else if (formScheduling === SCHEDULING_STATUS.All && (form.fromDate || form.toDate)) {
      hints.push('From / To dates only limit scheduled rows. Not-scheduled rows have no date, so they are always included, listed last.')
    }
    if (formScheduling !== SCHEDULING_STATUS.Scheduled && form.intakeGuids.length === 0) {
      hints.push('There are thousands of not-scheduled records (mostly from the bulk import on 11 Oct 2026). Pick an intake to narrow the list.')
    }
    return hints
  }, [form.programGuids, form.semesterGuids, form.ueTypes, form.publishStatuses, form.modes, form.fromDate, form.toDate, form.intakeGuids, formScheduling])

  // ── Process & Frozen Filters ───────────────────────────────────────────────
  const [saved, setSaved] = useState<ExamScheduleReportFilters | null>(null)
  const [runId, setRunId] = useState(0)

  function validate(): boolean {
    const e: Partial<Record<keyof FormState, string>> = {}
    if (form.fromDate && form.toDate && form.fromDate > form.toDate) {
      e.toDate = 'To date can’t be before the from date'
    }
    const MAX_ITEMS = 50
    if (form.scheduleTypes.length > MAX_ITEMS) e.scheduleTypes = `Select at most ${MAX_ITEMS} items`
    if (form.intakeGuids.length > MAX_ITEMS) e.intakeGuids = `Select at most ${MAX_ITEMS} items`
    if (form.programGuids.length > MAX_ITEMS) e.programGuids = `Select at most ${MAX_ITEMS} items`
    if (form.semesterGuids.length > MAX_ITEMS) e.semesterGuids = `Select at most ${MAX_ITEMS} items`
    if (form.courseUnitGuids.length > MAX_ITEMS) e.courseUnitGuids = `Select at most ${MAX_ITEMS} items`
    if (form.publishStatuses.length > MAX_ITEMS) e.publishStatuses = `Select at most ${MAX_ITEMS} items`
    if (form.modes.length > MAX_ITEMS) e.modes = `Select at most ${MAX_ITEMS} items`
    if (form.ueTypes.length > MAX_ITEMS) e.ueTypes = `Select at most ${MAX_ITEMS} items`

    setErrors(e)
    if (Object.keys(e).length > 0) {
      scrollToFirstError(e)
      return false
    }
    return true
  }

  function handleProcess() {
    if (!validate()) return
    setSaved(toFilters(form))
    setRunId(r => r + 1)
    setFiltersOpen(false)
  }

  function handleReset() {
    setForm(EMPTY_FORM)
    setErrors({})
    setUnitSearch('')
  }

  // ── Infinite Query (Preview) ───────────────────────────────────────────────
  const preview = useInfiniteQuery({
    queryKey: ['assessment', 'exam-schedule-report', runId, saved],
    queryFn: ({ pageParam }) => getExamScheduleReportPreview(saved as ExamScheduleReportFilters, pageParam),
    initialPageParam: 1,
    getNextPageParam: (last, all) => {
      const loaded = all.reduce((n, p) => n + p.rows.items.length, 0)
      return loaded < last.rows.totalCount && last.rows.items.length > 0 ? all.length + 1 : undefined
    },
    enabled: !!saved,
    gcTime: 0,
  })

  const pages = preview.data?.pages ?? []
  const rows: ExamScheduleReportRow[] = useMemo(() => pages.flatMap(p => p.rows.items), [pages])
  const summary = pages[0]?.summary ?? null
  const totalCount = pages[0]?.rows.totalCount ?? 0
  const hasResult = pages.length > 0
  const isEmpty = hasResult && totalCount === 0
  const firstPageFailed = preview.isError && !hasResult
  const nextPageFailed = preview.isFetchNextPageError
  // The Scheduling column only adds information when undated rows can appear.
  const showSchedulingCol = !!saved && saved.schedulingStatus != null && saved.schedulingStatus !== SCHEDULING_STATUS.Scheduled
  // 24 base columns (incl. the resit-readiness Applicants / Required /
  // Available / Ready), plus Scheduling when it's shown.
  const columnCount = showSchedulingCol ? 25 : 24

  // Sentinel row for infinite scrolling near bottom of .tbl-wrap
  const sentinelRef = useRef<HTMLTableRowElement>(null)
  useEffect(() => {
    const el = sentinelRef.current
    const root = el?.closest('.tbl-wrap')
    if (!el || !root) return
    const io = new IntersectionObserver(
      entries => {
        if (entries[0]?.isIntersecting && preview.hasNextPage && !preview.isFetching && !preview.isFetchNextPageError) {
          preview.fetchNextPage()
        }
      },
      { root, rootMargin: '240px 0px' }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [preview.hasNextPage, preview.isFetching, preview.isFetchNextPageError, preview.fetchNextPage, rows.length])

  // Recap chips for active filters
  const recap = useMemo(() => {
    if (!saved) return []
    const chips: { label: string; value: string }[] = []

    if (saved.scheduleTypes?.length) {
      chips.push({
        label: 'Types',
        value: saved.scheduleTypes.length === 1
          ? SCHEDULE_TYPE_LABELS[saved.scheduleTypes[0]] ?? '1 selected'
          : `${saved.scheduleTypes.length} selected`,
      })
    }
    if (saved.schedulingStatus != null && saved.schedulingStatus !== SCHEDULING_STATUS.Scheduled) {
      chips.push({ label: 'Scheduling', value: SCHEDULING_STATUS_LABELS[saved.schedulingStatus] ?? String(saved.schedulingStatus) })
    }
    // Dates don't apply under Not scheduled (the API ignores them).
    if ((saved.fromDate || saved.toDate) && saved.schedulingStatus !== SCHEDULING_STATUS.NotScheduled) {
      chips.push({
        label: 'Dates',
        value: `${saved.fromDate ? fmtYmd(saved.fromDate) : 'Start'} – ${saved.toDate ? fmtYmd(saved.toDate) : 'Today'}`,
      })
    }
    if (saved.intakeGuids?.length) {
      const match = saved.intakeGuids.length === 1 ? intakeOptions.find(o => o.value === saved.intakeGuids![0]) : null
      chips.push({
        label: 'Intake',
        value: match ? match.label : `${saved.intakeGuids.length} selected`,
      })
    }
    if (saved.programGuids?.length) {
      const match = saved.programGuids.length === 1 ? programOptions.find(o => o.value === saved.programGuids![0]) : null
      chips.push({
        label: 'Programme',
        value: match ? match.label : `${saved.programGuids.length} selected`,
      })
    }
    if (saved.semesterGuids?.length) {
      const match = saved.semesterGuids.length === 1 ? semesterOptions.find(o => o.value === saved.semesterGuids![0]) : null
      chips.push({
        label: 'Semester',
        value: match ? match.label : `${saved.semesterGuids.length} selected`,
      })
    }
    if (saved.courseUnitGuids?.length) {
      const match = saved.courseUnitGuids.length === 1
        ? knownCourseUnits.current.get(saved.courseUnitGuids[0]) || courseUnitOptions.find(o => o.value === saved.courseUnitGuids![0])?.label
        : null
      chips.push({
        label: 'Course Unit',
        value: match ? match : `${saved.courseUnitGuids.length} selected`,
      })
    }
    if (saved.publishStatuses?.length) {
      chips.push({
        label: 'Status',
        value: saved.publishStatuses.map(s => (s === 1 ? 'Published' : 'Unpublished')).join(', '),
      })
    }
    if (saved.modes?.length) {
      chips.push({
        label: 'Mode',
        value: saved.modes.map(m => (m === 0 ? 'Online' : 'Offline')).join(', '),
      })
    }
    if (saved.ueTypes?.length) {
      chips.push({
        label: 'UE Type',
        value: saved.ueTypes.map(t => (t === 0 ? 'Theory' : 'Practical')).join(', '),
      })
    }

    return chips
  }, [saved, intakeOptions, programOptions, semesterOptions, courseUnitOptions])

  return (
    <div className="page active">
      <div className="pg-hdr">
        <div>
          <div className="pg-title">Exam Schedule Report</div>
          <div className="pg-sub">
            Every scheduled assessment across University Exams, Coursework, Tests, Mock Exams and Resits
          </div>
        </div>
      </div>

      {/* Filters Card */}
      <div className="card" id="rpt-filters">
        {filtersOpen ? (
          <>
            <div className="rpt-filter-grid">
              {/* Row 1: Schedule Type & Intake */}
              <div className="fg m-0 span2">
                <label className="lbl">Schedule type</label>
                <MultiSelect
                  placeholder="All types"
                  options={scheduleTypeOptions}
                  value={form.scheduleTypes}
                  onChange={v => setField('scheduleTypes', v)}
                />
                {errors.scheduleTypes && (
                  <p className="field-err" style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>
                    {errors.scheduleTypes}
                  </p>
                )}
              </div>

              <div className="fg m-0 span2">
                <label className="lbl">Intake</label>
                <MultiSelect
                  placeholder="All intakes"
                  options={intakeOptions}
                  value={form.intakeGuids}
                  onChange={v => setField('intakeGuids', v)}
                  isLoading={intakesQuery.isLoading}
                />
                {errors.intakeGuids && (
                  <p className="field-err" style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>
                    {errors.intakeGuids}
                  </p>
                )}
              </div>

              {/* Row 2: From Date & To Date */}
              <div className="fg m-0">
                <label className="lbl">From date</label>
                <DatePicker
                  value={form.fromDate}
                  onChange={v => setField('fromDate', v)}
                  maxYmd={form.toDate || undefined}
                  rangeMessage="From date can’t be after the to date"
                />
              </div>

              <div className="fg m-0">
                <label className="lbl">To date</label>
                <DatePicker
                  value={form.toDate}
                  onChange={v => setField('toDate', v)}
                  minYmd={form.fromDate || undefined}
                  rangeMessage="To date can’t be before the from date"
                  hasError={!!errors.toDate}
                />
                {errors.toDate && (
                  <p className="field-err" style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>
                    {errors.toDate}
                  </p>
                )}
              </div>

              {/* Row 2 cont: Programme (span2) */}
              <div className="fg m-0 span2">
                <label className="lbl">
                  Programme <span className="text-g400" style={{ fontWeight: 400 }}>· up to 50</span>
                </label>
                <MultiSelect
                  placeholder="All programmes"
                  options={programOptions}
                  value={form.programGuids}
                  onChange={v => {
                    setField('programGuids', v)
                    setField('semesterGuids', [])
                  }}
                  isLoading={programsQuery.isLoading}
                />
                {errors.programGuids && (
                  <p className="field-err" style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>
                    {errors.programGuids}
                  </p>
                )}
              </div>

              {/* Row 3: Semester & Course Unit */}
              <div className="fg m-0 span2">
                <label className="lbl">Semester</label>
                <MultiSelect
                  placeholder={form.programGuids.length === 0 ? 'Select Programme first' : 'All semesters'}
                  options={semesterOptions}
                  value={form.semesterGuids}
                  onChange={v => {
                    setField('semesterGuids', v)
                  }}
                  disabled={form.programGuids.length === 0}
                  isLoading={semesterQueries.some(q => q.isLoading)}
                />
                {errors.semesterGuids && (
                  <p className="field-err" style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>
                    {errors.semesterGuids}
                  </p>
                )}
              </div>

              <div className="fg m-0 span2">
                <label className="lbl">Course unit</label>
                <MultiSelect
                  placeholder="All units"
                  options={courseUnitOptions}
                  value={form.courseUnitGuids}
                  onChange={v => setField('courseUnitGuids', v)}
                  onSearch={form.programGuids.length === 0 ? setUnitSearch : undefined}
                  isLoading={form.programGuids.length > 0 ? courseUnitQueries.some(q => q.isLoading) : allCourseUnitsQuery.isLoading}
                />
                {errors.courseUnitGuids && (
                  <p className="field-err" style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>
                    {errors.courseUnitGuids}
                  </p>
                )}
              </div>

              {/* Row 4: Status, Mode, Theory / Practical */}
              <div className="fg m-0">
                <label className="lbl">Status</label>
                <MultiSelect
                  placeholder="All"
                  options={publishStatusOptions}
                  value={form.publishStatuses}
                  onChange={v => setField('publishStatuses', v)}
                />
              </div>

              <div className="fg m-0">
                <label className="lbl">Mode</label>
                <MultiSelect
                  placeholder="All"
                  options={modeOptions}
                  value={form.modes}
                  onChange={v => setField('modes', v)}
                />
              </div>

              <div className="fg m-0">
                <label className="lbl">Theory / Practical</label>
                <MultiSelect
                  placeholder="All"
                  options={ueTypeOptions}
                  value={form.ueTypes}
                  onChange={v => setField('ueTypes', v)}
                />
              </div>

              {/* Single choice, always set: no placeholder, so it can't be cleared. */}
              <div className="fg m-0">
                <label className="lbl">Scheduling</label>
                <SearchSelect
                  options={schedulingStatusOptions}
                  value={form.schedulingStatus}
                  onChange={v => setField('schedulingStatus', v || String(SCHEDULING_STATUS.Scheduled))}
                />
              </div>
            </div>

            {/* Dynamic exclusion hints */}
            {exclusionHints.length > 0 && (
              <div className="mt-3.5 p-3 rounded bg-amber-50 border border-amber-200 text-amber-900 text-xs flex flex-col gap-1.5">
                {exclusionHints.map((hint, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <i className="lni lni-information mt-0.5 text-amber-600 flex-shrink-0" />
                    <span>{hint}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 mt-4">
              <span className="text-g400 mr-auto" style={{ fontSize: 'var(--fs-sm)' }}>
                Every filter is optional. Leave them all empty to report on everything.
              </span>
              <button type="button" className="btn btn-neu btn-sm" onClick={handleReset}>
                Reset
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleProcess}
                disabled={preview.isFetching && !preview.isFetchingNextPage}
              >
                <i className="lni lni-play" aria-hidden="true" />{' '}
                {preview.isFetching && !preview.isFetchingNextPage ? 'Processing…' : 'Process'}
              </button>
            </div>
          </>
        ) : (
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-sm font-semibold">
                  <i className="lni lni-funnel" />
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Active Filters</span>
                  <span className="text-xs text-slate-400 ml-2">
                    {recap.length === 0 ? 'None (showing all assessments)' : `${recap.length} filter${recap.length > 1 ? 's' : ''} applied`}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  type="button"
                  className="btn btn-neu btn-sm flex items-center gap-1.5 hover:bg-slate-100 transition-colors"
                  onClick={() => setFiltersOpen(true)}
                  title="Modify active filters"
                >
                  <i className="lni lni-pencil" aria-hidden="true" />
                  <span>Change filters</span>
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              {recap.length === 0 ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                  <i className="lni lni-checkmark-circle text-green-600 text-xs" />
                  All assessments, all dates
                </span>
              ) : (
                recap.map(c => (
                  <div
                    key={c.label}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs bg-slate-50 border border-slate-200/90 text-slate-700 shadow-sm hover:border-slate-300 hover:bg-slate-100/60 transition-all max-w-full"
                    title={`${c.label}: ${c.value}`}
                  >
                    <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10.5px]">
                      {c.label}:
                    </span>
                    <span className="font-semibold text-slate-900 max-w-[240px] sm:max-w-[340px] truncate">
                      {c.value}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Results Card */}
      <div className="card">
        {!saved ? (
          <div className="rpt-empty py-12 flex flex-col items-center justify-center text-center">
            <i className="lni lni-bar-chart text-3xl text-slate-400 mb-2" aria-hidden="true" />
            <div className="rpt-empty-title font-bold text-slate-700">Set your filters, then Process</div>
            <div className="text-sm text-slate-400 mt-1">
              Assessment schedules appear here with question bank readiness status.
            </div>
          </div>
        ) : firstPageFailed ? (
          <div className="rpt-empty py-12 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-3">
              <i className="lni lni-warning text-2xl" aria-hidden="true" />
            </div>
            <div className="rpt-empty-title text-base font-bold text-slate-800 mb-1">
              Couldn’t load the report
            </div>
            <div className="text-sm text-slate-500 max-w-md mx-auto mb-4 leading-relaxed">
              {errorMessage(preview.error, 'Something went wrong while contacting the server. Please check your connection and try again.')}
            </div>
            <button
              type="button"
              className="btn btn-neu btn-sm flex items-center gap-1.5 px-4 py-2 hover:bg-slate-100 transition-colors shadow-sm"
              onClick={() => preview.refetch()}
            >
              <i className="lni lni-reload" aria-hidden="true" />
              <span>Try again</span>
            </button>
          </div>
        ) : !hasResult || (preview.isFetching && rows.length === 0) ? (
          <LoadingState
            title="Building the report…"
            subtitle="Fetching assessment schedules, just a moment."
          />
        ) : isEmpty ? (
          <div className="rpt-empty">
            <i className="lni lni-search-alt" aria-hidden="true" />
            <div className="rpt-empty-title">No schedules match these filters</div>
            <div style={{ fontSize: 13 }}>Try a wider date range or fewer filters.</div>
          </div>
        ) : (
          <>
            <div className="rpt-results-hdr">
              <div className="rpt-count flex items-center gap-2 flex-wrap">
                <span>
                  <strong>{fmtCount(totalCount)}</strong> {totalCount === 1 ? 'row' : 'rows'}
                </span>
                {summary?.byScheduleType?.map(t => (
                  <span key={t.scheduleType} className="text-g500">
                    · <strong>{fmtCount(t.rowCount)}</strong> {t.scheduleTypeName}
                  </span>
                ))}
              </div>
              <ReportExportControls
                resetKey={runId}
                mockFileName="Exam_Schedule_Report.xlsx"
                startExport={() => exportExamScheduleReport(saved!)}
              />
            </div>

            <ScrollTable className="rpt-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Type</th>
                    {showSchedulingCol && <th>Scheduling</th>}
                    <th>Date</th>
                    <th>Day</th>
                    <th>Start</th>
                    <th>End</th>
                    <th>Intake</th>
                    <th>Programme</th>
                    <th>Semester</th>
                    <th>Unit Code</th>
                    <th>Unit Name</th>
                    <th>Theory / Practical</th>
                    <th>Mode</th>
                    <th className="num">Max Mark</th>
                    <th>Status</th>
                    <th>Scheduled By</th>
                    <th>Scheduled Date</th>
                    <th className="num">Questions</th>
                    <th>Last Uploaded</th>
                    <th>Uploaded By</th>
                    <th>Verified</th>
                    <th className="num">Applicants</th>
                    <th className="num">Required</th>
                    <th className="num">Available</th>
                    <th>Ready</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={`${r.scheduleGuid}-${r.courseUnitGuid ?? 'none'}-${i}`}>
                      <td style={{ fontWeight: 600 }}>{r.scheduleTypeName}</td>
                      {showSchedulingCol && (
                        <td>
                          {r.isScheduled === false
                            ? <span className="badge badge-amber">Not scheduled</span>
                            : <span className="badge badge-green">Scheduled</span>}
                        </td>
                      )}
                      <td>{fmtPlainDate(r.date)}</td>
                      <td>{r.dayOfWeek || '—'}</td>
                      <td>{fmtPlainTime(r.startTime)}</td>
                      <td>{fmtEndTime(r.startTime, r.endTime)}</td>
                      <td>{r.intakeName ?? '—'}</td>
                      <td>{r.programName ?? '—'}</td>
                      <td>{r.semesterName ?? '—'}</td>
                      <td className="rpt-mono">{r.unitCode ?? '—'}</td>
                      <td>{r.unitName ?? '—'}</td>
                      <td>
                        {r.ueType === UE_TYPE.Theory ? 'Theory' : r.ueType === UE_TYPE.Practical ? 'Practical' : '—'}
                      </td>
                      <td>
                        {r.mode === MODE.Online ? 'Online' : r.mode === MODE.Offline ? 'Offline' : '—'}
                      </td>
                      <td className="num">{r.maxMark != null ? r.maxMark : '—'}</td>
                      <td>
                        {r.publishStatus === PUBLISH_STATUS.Published ? (
                          <span className="badge badge-green">Published</span>
                        ) : r.publishStatus === PUBLISH_STATUS.Unpublished ? (
                          <span className="badge badge-grey">Unpublished</span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td>{r.scheduledByName ?? '—'}</td>
                      <td>{fmtUtcDateTime(r.scheduledDate)}</td>
                      <td className="num">{fmtCount(r.questionCount)}</td>
                      <td>{fmtUtcDateTime(r.questionsLastUploadedDate)}</td>
                      <td>{r.questionsLastUploadedByName ?? '—'}</td>
                      <td>
                        {r.questionVerification === QUESTION_VERIFICATION.Verified ? (
                          <span className="badge badge-green">Verified</span>
                        ) : r.questionVerification === QUESTION_VERIFICATION.PartiallyVerified ? (
                          <span className="badge badge-amber">Partially verified</span>
                        ) : r.questionVerification === QUESTION_VERIFICATION.NotVerified ? (
                          <span className="badge badge-grey">Not verified</span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="num">{r.applicantCount != null ? fmtCount(r.applicantCount) : '—'}</td>
                      <td className="num">{r.questionsRequired != null ? fmtCount(r.questionsRequired) : '—'}</td>
                      <td className="num">{r.questionsAvailable != null ? fmtCount(r.questionsAvailable) : '—'}</td>
                      <td>
                        {r.questionsReady != null ? (
                          <div className="inline-flex items-center gap-1.5 whitespace-nowrap">
                            {r.questionsReady ? (
                              <span className="badge badge-green">Ready</span>
                            ) : (
                              <span className="badge badge-red">Not ready</span>
                            )}
                            {r.questionsAvailable != null && r.questionsRequired != null && (
                              <span className="text-slate-600 text-xs font-normal">
                                {r.questionsAvailable} of {r.questionsRequired}
                              </span>
                            )}
                          </div>
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                  ))}
                  <tr ref={sentinelRef} className="rpt-foot-row">
                    <td colSpan={columnCount}>
                      {nextPageFailed ? (
                        <span className="inline-flex items-center gap-3">
                          <span style={{ color: 'var(--red)' }}>Couldn’t load more rows.</span>
                          <button className="btn btn-neu btn-sm" onClick={() => preview.fetchNextPage()}>
                            <i className="lni lni-reload" aria-hidden="true" /> Retry
                          </button>
                        </span>
                      ) : preview.hasNextPage ? (
                        <span className="inline-flex items-center gap-2">
                          <i className="lni lni-spinner-arrow spin" aria-hidden="true" /> Loading more…
                        </span>
                      ) : (
                        <span>End of report · {fmtCount(rows.length)} rows</span>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </ScrollTable>
          </>
        )}
      </div>
    </div>
  )
}

