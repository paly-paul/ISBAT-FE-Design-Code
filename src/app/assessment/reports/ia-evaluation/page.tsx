'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useInfiniteQuery, useQueries, useQuery } from '@tanstack/react-query'
import { ScrollTable } from '@/components/ScrollTable'
import { SearchSelect } from '@/components/SearchSelect'
import { MultiSelect } from '@/components/MultiSelect'
import { ReportExportControls } from '@/components/finance/ReportExportControls'
import { useIntakesDropdown } from '@/hooks/academic/useIntakes'
import { useCourseUnitDropdown } from '@/hooks/academic/useCourseUnits'
import { getCampusDropdown } from '@/lib/api/academic/campus'
import { getProgramMastersByCampus } from '@/lib/api/academic/programMaster'
import { getSemestersForProgram } from '@/lib/api/academic/semester'
import { getBatchDropdownForSemesters } from '@/lib/api/academic/batch'
import { getSponsorCategories } from '@/lib/api/student/sponsor'
import { scrollToFirstError } from '@/lib/scrollToFirstError'
import { fmtReportCount, reportChipValue, reportErrorMessage } from '@/lib/reportFormat'
import {
  IA_CATEGORY_OPTIONS, IA_REPORT_MAX_SEARCH, IA_REPORT_MAX_VALUES, IA_REPORT_MIN_SEARCH, IA_STATUS, IA_STATUS_OPTIONS,
  exportIaEvaluationReport, getIaEvaluationReportPreview,
  type IaEvaluationReportFilters, type IaEvaluationReportRow, type IaEvaluationUnitSummary,
} from '@/lib/api/assessment/iaEvaluationReport'

// IA Evaluation Report — erp-docs/pages/assessment/ia-evaluation-report-page.md.
// Same flow as the Outstanding Report: Process → page 1 (summary + 15 rows) →
// infinite scroll (includeSummary=false) → Export to Excel in the background,
// through the shared Downloads list. Each page takes a few seconds on a full
// intake, so only one page call ever runs at a time.

interface FormState {
  intakeGuid: string
  campusGuids: string[]
  programGuids: string[]
  semesterGuids: string[]
  batchGuids: string[]
  sponsorGuids: string[]
  unitGuids: string[]
  categories: string[]   // MultiSelect values; sent as numbers
  statuses: string[]
  search: string
}
type FormErrors = Partial<Record<keyof FormState, string>>

const CATEGORY_OPTIONS = IA_CATEGORY_OPTIONS.map(c => ({ value: String(c.value), label: c.label }))
const STATUS_OPTIONS = IA_STATUS_OPTIONS.map(s => ({ value: String(s.value), label: s.label }))

// Labels for the "at most 50" check and its message.
const LIST_FIELDS: [keyof FormState, string][] = [
  ['campusGuids', 'campuses'], ['programGuids', 'programmes'], ['semesterGuids', 'semesters'], ['batchGuids', 'batches'],
  ['sponsorGuids', 'sponsors'], ['unitGuids', 'units'],
]

function emptyForm(intakeGuid: string): FormState {
  return { intakeGuid, campusGuids: [], programGuids: [], semesterGuids: [], batchGuids: [], sponsorGuids: [], unitGuids: [], categories: [], statuses: [], search: '' }
}

// Form → API filters. Empty lists are left out; both statuses mean "either",
// so they're left out too.
function toFilters(f: FormState): IaEvaluationReportFilters {
  const list = (v: string[]) => (v.length ? v : undefined)
  const search = f.search.trim()
  return {
    intakeGuid: f.intakeGuid || undefined,
    campusGuids: list(f.campusGuids),
    programGuids: list(f.programGuids),
    semesterGuids: list(f.semesterGuids),
    batchGuids: list(f.batchGuids),
    sponsorCategoryGuids: list(f.sponsorGuids),
    courseUnitGuids: list(f.unitGuids),
    categories: f.categories.length ? f.categories.map(Number).sort() : undefined,
    statuses: f.statuses.length === 1 ? [Number(f.statuses[0])] : undefined,
    search: search || undefined,
  }
}

// ── Formatting ───────────────────────────────────────────────────────────────

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// evaluatedDate comes without a zone ("2026-09-12T15:35:17.893"); shown as
// written rather than converted, so it matches the Excel file.
function fmtEvaluatedDate(value: string | null): string {
  if (!value) return '—'
  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/)
  if (!m) return value
  const date = `${m[3]} ${MONTHS[+m[2] - 1]} ${m[1]}`
  return m[4] ? `${date}, ${m[4]}:${m[5]}` : date
}

function fmtMark(n: number | null): string {
  return n == null ? '—' : n.toLocaleString('en-US', { maximumFractionDigits: 2 })
}

function fmtPct(n: number | null): string {
  return n == null ? '—' : `${n.toLocaleString('en-US', { maximumFractionDigits: 2 })}%`
}

const dash = (v: string | null | undefined) => (v && v.trim() ? v : '—')

// Share of a unit's submitted work that has been marked.
function markedShare(u: { evaluatedCount: number; pendingCount: number }): number {
  const total = u.evaluatedCount + u.pendingCount
  return total ? (u.evaluatedCount / total) * 100 : 0
}

function StatusBadge({ row }: { row: IaEvaluationReportRow }) {
  const evaluated = row.status === IA_STATUS.Evaluated
  return (
    <span className={`badge ${evaluated ? 'badge-green' : 'badge-amber'} iar-status`}>
      <i className={`lni ${evaluated ? 'lni-checkmark-circle' : 'lni-timer'}`} aria-hidden="true" />
      {row.statusName || (evaluated ? 'Evaluated' : 'Submitted, not evaluated')}
    </span>
  )
}

// ── Per-unit summary ─────────────────────────────────────────────────────────

function UnitSummary({ units }: { units: IaEvaluationUnitSummary[] }) {
  // Server order is programme → semester → unit. "Most pending" brings the
  // units that still need marking to the top — what the page is for.
  const [order, setOrder] = useState<'programme' | 'pending'>('programme')
  const sorted = useMemo(
    () => (order === 'pending' ? [...units].sort((a, b) => b.pendingCount - a.pendingCount || markedShare(a) - markedShare(b)) : units),
    [units, order],
  )
  const unitsWithPending = units.filter(u => u.pendingCount > 0).length

  return (
    <div className="rpt-sumtbl" role="region" aria-label="Marking progress by unit">
      <div className="rpt-sumtbl-hdr">
        <span className="rpt-sumtbl-title">
          By unit · {fmtReportCount(units.length)} {units.length === 1 ? 'unit' : 'units'}
          {unitsWithPending > 0 && <span className="iar-pending-note"> · {fmtReportCount(unitsWithPending)} still marking</span>}
        </span>
        <div className="iar-seg" role="group" aria-label="Order units by">
          <button type="button" className={order === 'programme' ? 'on' : undefined} aria-pressed={order === 'programme'} onClick={() => setOrder('programme')}>Programme</button>
          <button type="button" className={order === 'pending' ? 'on' : undefined} aria-pressed={order === 'pending'} onClick={() => setOrder('pending')}>Most pending</button>
        </div>
      </div>
      <div className="rpt-sumtbl-scroll iar-unit-scroll">
        <table>
          <thead>
            <tr>
              <th scope="col">Unit</th>
              <th scope="col">Enrolled</th>
              <th scope="col">Submitted</th>
              <th scope="col">Evaluated</th>
              <th scope="col">Pending</th>
              <th scope="col" className="iar-progress-col">Marked</th>
              <th scope="col" className="key">Average</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((u, i) => {
              const share = markedShare(u)
              const unitLabel = u.unitCode || u.unitName ? [u.unitCode, u.unitName].filter(Boolean).join(' · ') : null
              return (
                <tr key={`${u.programName}-${u.semesterName}-${u.unitCode ?? i}`}>
                  <th scope="row" className="iar-unit">
                    <span className={`iar-unit-name${unitLabel ? '' : ' is-missing'}`}>{unitLabel ?? 'Unit name not available'}</span>
                    <span className="iar-unit-sub">{[u.programName, u.semesterName].filter(Boolean).join(' · ') || '—'}</span>
                  </th>
                  <td>{fmtReportCount(u.enrolledStudents)}</td>
                  <td>{fmtReportCount(u.submittedStudents)}</td>
                  <td>{fmtReportCount(u.evaluatedCount)}</td>
                  <td className={u.pendingCount > 0 ? 'iar-pending' : undefined}>{fmtReportCount(u.pendingCount)}</td>
                  <td className="iar-progress-col">
                    <span className="iar-progress">
                      <span className="iar-bar" aria-hidden="true"><span className={share >= 100 ? 'done' : undefined} style={{ width: `${share}%` }} /></span>
                      <span className="iar-bar-pct">{Math.floor(share)}%</span>
                    </span>
                  </td>
                  <td className="key">{fmtPct(u.averagePercent)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function IaEvaluationReportPage() {
  // ── Filter dropdowns ────────────────────────────────────────────────────
  const intakesQuery = useIntakesDropdown()
  const currentIntakeGuid = intakesQuery.data?.find(i => i.currentIntake)?.intakeGuid ?? ''

  const [form, setForm] = useState<FormState>(() => emptyForm(''))
  const [errors, setErrors] = useState<FormErrors>({})
  const [filtersOpen, setFiltersOpen] = useState(true)
  function setField<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm(prev => ({ ...prev, [k]: v }))
    setErrors(prev => (prev[k] ? { ...prev, [k]: '' } : prev))
  }

  // Preselect the current intake once the list arrives, unless the user has
  // already picked one.
  useEffect(() => {
    if (currentIntakeGuid) setForm(prev => (prev.intakeGuid ? prev : { ...prev, intakeGuid: currentIntakeGuid }))
  }, [currentIntakeGuid])

  const campusesQuery = useQuery({ queryKey: ['academic', 'campus', 'dropdown'], queryFn: getCampusDropdown })
  const sponsorsQuery = useQuery({ queryKey: ['students', 'sponsor-categories', 'all'], queryFn: () => getSponsorCategories(1, 100) })

  // Campus → Programme → Semester → Batch, each list merged across every
  // chosen parent (one call per parent).
  const programQueries = useQueries({
    queries: form.campusGuids.map(g => ({
      queryKey: ['academic', 'program-master', 'by-campus', g],
      queryFn: () => getProgramMastersByCampus(g),
      staleTime: 5 * 60_000,
    })),
  })
  const semesterQueries = useQueries({
    queries: form.programGuids.map(g => ({
      queryKey: ['academic', 'semesters', 'for-program', g],
      queryFn: () => getSemestersForProgram(g),
      staleTime: 5 * 60_000,
    })),
  })

  // Which programme each listed semester belongs to, so each batch call only
  // gets its own programme's semesters.
  const semesterProgram = useMemo(() => {
    const map = new Map<string, string>()
    semesterQueries.forEach((q, i) => (q.data ?? []).forEach(s => map.set(s.semesterGuid, form.programGuids[i])))
    return map
  }, [semesterQueries, form.programGuids])

  const batchCalls = useMemo(
    () => form.programGuids
      .map(p => ({ programGuid: p, semesters: form.semesterGuids.filter(s => semesterProgram.get(s) === p).sort() }))
      .filter(c => c.semesters.length > 0),
    [form.programGuids, form.semesterGuids, semesterProgram],
  )
  const batchQueries = useQueries({
    queries: batchCalls.map(c => ({
      queryKey: ['academic', 'batches', 'dropdown', c.programGuid, c.semesters],
      queryFn: () => getBatchDropdownForSemesters(c.programGuid, c.semesters),
      staleTime: 5 * 60_000,
    })),
  })

  const intakeOptions = useMemo(() => (intakesQuery.data ?? []).map(i => ({ value: i.intakeGuid, label: `${i.intakeCode} — ${i.description}${i.currentIntake ? ' (current)' : ''}` })), [intakesQuery.data])
  const campusOptions = useMemo(() => (campusesQuery.data ?? []).map(c => ({ value: c.campusGuid, label: c.campusName })), [campusesQuery.data])
  const sponsorOptions = useMemo(() => (sponsorsQuery.data?.items ?? []).map(s => ({ value: s.sponsorCategoryGuid, label: s.category })), [sponsorsQuery.data])

  const programCodes = new Map<string, string>()
  const programOptions = (() => {
    const seen = new Map<string, string>()
    for (const q of programQueries) for (const p of q.data ?? []) {
      if (!seen.has(p.programGuid)) seen.set(p.programGuid, `${p.programName} (${p.programCode})`)
      programCodes.set(p.programGuid, p.programCode)
    }
    return [...seen].map(([value, label]) => ({ value, label }))
  })()
  // Every programme has its own "Year One - Semester One", so with more than
  // one programme each semester says whose it is.
  const semesterOptions = (() => {
    const many = form.programGuids.length > 1
    const seen = new Map<string, string>()
    semesterQueries.forEach((q, i) => (q.data ?? []).forEach(s => {
      if (seen.has(s.semesterGuid)) return
      const code = programCodes.get(form.programGuids[i])
      seen.set(s.semesterGuid, many && code ? `${s.semName} · ${code}` : s.semName)
    }))
    return [...seen].map(([value, label]) => ({ value, label }))
  })()
  const batchOptions = (() => {
    const seen = new Map<string, string>()
    for (const q of batchQueries) for (const b of q.data ?? []) if (!seen.has(b.batchGuid)) seen.set(b.batchGuid, b.batchCode)
    return [...seen].map(([value, label]) => ({ value, label }))
  })()

  // Unit: typeahead on /academic/courseunits/dropdown?search=. MultiSelect
  // keeps the labels of units picked from an earlier search.
  const [unitSearch, setUnitSearch] = useState('')
  const [debouncedUnitSearch, setDebouncedUnitSearch] = useState('')
  useEffect(() => {
    const t = setTimeout(() => setDebouncedUnitSearch(unitSearch.trim()), 300)
    return () => clearTimeout(t)
  }, [unitSearch])
  const unitsQuery = useCourseUnitDropdown(debouncedUnitSearch)
  const unitOptions = useMemo(() => (unitsQuery.data ?? []).map(u => ({
    value: u.courseUnitGuid,
    label: u.courseUnitCode ? `${u.courseUnitCode} — ${u.courseUnitName || '—'}` : (u.courseUnitName || '—'),
  })), [unitsQuery.data])
  // Labels of every unit seen, so the recap can name a unit picked from an
  // earlier search.
  const unitLabels = useRef(new Map<string, string>())
  useEffect(() => { unitOptions.forEach(o => unitLabels.current.set(o.value, o.label)) }, [unitOptions])

  // Changing a level clears everything under it (per the page spec).
  function pickCampuses(v: string[]) {
    setForm(prev => ({ ...prev, campusGuids: v, programGuids: [], semesterGuids: [], batchGuids: [] }))
    setErrors(prev => ({ ...prev, campusGuids: '', programGuids: '', semesterGuids: '', batchGuids: '' }))
  }
  function pickPrograms(v: string[]) {
    setForm(prev => ({ ...prev, programGuids: v, semesterGuids: [], batchGuids: [] }))
    setErrors(prev => ({ ...prev, programGuids: '', semesterGuids: '', batchGuids: '' }))
  }
  function pickSemesters(v: string[]) {
    setForm(prev => ({ ...prev, semesterGuids: v, batchGuids: [] }))
    setErrors(prev => ({ ...prev, semesterGuids: '', batchGuids: '' }))
  }

  // ── Process: the saved copy of the filters ──────────────────────────────
  // Every later page and the export reuse THIS, never the live form.
  const [saved, setSaved] = useState<IaEvaluationReportFilters | null>(null)
  const [savedForm, setSavedForm] = useState<FormState | null>(null)
  const [savedUnitLabel, setSavedUnitLabel] = useState<string | null>(null)
  const [runId, setRunId] = useState(0)

  function validate(): boolean {
    const e: FormErrors = {}
    for (const [key, noun] of LIST_FIELDS) {
      const n = (form[key] as string[]).length
      if (n > IA_REPORT_MAX_VALUES) e[key] = `Select at most ${IA_REPORT_MAX_VALUES} ${noun} (now ${n})`
    }
    const search = form.search.trim()
    if (search && search.length < IA_REPORT_MIN_SEARCH) e.search = `Type at least ${IA_REPORT_MIN_SEARCH} characters, or clear the search`
    setErrors(e)
    if (Object.keys(e).length) { scrollToFirstError(e); return false }
    return true
  }

  const preview = useInfiniteQuery({
    queryKey: ['assessment', 'ia-evaluation-report', runId, saved],
    queryFn: ({ pageParam }) => getIaEvaluationReportPreview(saved as IaEvaluationReportFilters, pageParam),
    initialPageParam: 1,
    getNextPageParam: (last, all) => {
      const loaded = all.reduce((n, p) => n + p.rows.items.length, 0)
      return loaded < last.rows.totalCount && last.rows.items.length > 0 ? all.length + 1 : undefined
    },
    enabled: !!saved,
    gcTime: 0,
  })

  const pages = useMemo(() => preview.data?.pages ?? [], [preview.data])
  const rows: IaEvaluationReportRow[] = useMemo(() => pages.flatMap(p => p.rows.items), [pages])
  const summary = pages[0]?.summary ?? null
  const totalCount = pages[0]?.rows.totalCount ?? 0
  const hasResult = pages.length > 0
  const isEmpty = hasResult && totalCount === 0
  const firstPageFailed = preview.isError && !hasResult
  const nextPageFailed = preview.isFetchNextPageError
  const processing = preview.isFetching && !preview.isFetchingNextPage
  const dropdownsBusy = programQueries.some(q => q.isFetching) || semesterQueries.some(q => q.isFetching) || batchQueries.some(q => q.isFetching)

  function handleProcess() {
    if (processing || !validate()) return
    setSaved(toFilters(form))
    setSavedForm(form)
    setSavedUnitLabel(form.unitGuids.length === 1 ? (unitLabels.current.get(form.unitGuids[0]) ?? null) : null)
    setRunId(r => r + 1)
    setFiltersOpen(false)
  }

  function handleReset() {
    setForm(emptyForm(currentIntakeGuid))
    setUnitSearch('')
    setErrors({})
  }

  // Next page as the sentinel nears the bottom — never while a request is
  // running, and never automatically after a failure (Retry instead).
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
    const chips: { label: string; value: string }[] = []
    chips.push({ label: 'Intake', value: intakeOptions.find(o => o.value === f.intakeGuid)?.label ?? 'Current intake' })
    if (f.campusGuids.length) chips.push({ label: 'Campus', value: reportChipValue(campusOptions, f.campusGuids, 'campuses') })
    if (f.programGuids.length) chips.push({ label: 'Programme', value: reportChipValue(programOptions, f.programGuids, 'programmes') })
    if (f.semesterGuids.length) chips.push({ label: 'Semester', value: reportChipValue(semesterOptions, f.semesterGuids, 'semesters') })
    if (f.batchGuids.length) chips.push({ label: 'Batch', value: reportChipValue(batchOptions, f.batchGuids, 'batches') })
    if (f.sponsorGuids.length) chips.push({ label: 'Sponsor', value: reportChipValue(sponsorOptions, f.sponsorGuids, 'sponsors') })
    if (f.unitGuids.length) {
      chips.push({ label: 'Unit', value: f.unitGuids.length === 1 ? (savedUnitLabel ?? '1 selected') : `${f.unitGuids.length} units` })
    }
    if (f.categories.length) chips.push({ label: 'Assessment', value: f.categories.map(c => CATEGORY_OPTIONS.find(o => o.value === c)?.label ?? c).join(', ') })
    if (f.statuses.length === 1) chips.push({ label: 'Status', value: STATUS_OPTIONS.find(o => o.value === f.statuses[0])?.label ?? '' })
    if (f.search.trim()) chips.push({ label: 'Search', value: `“${f.search.trim()}”` })
    return chips
  }, [savedForm, savedUnitLabel, intakeOptions, campusOptions, programOptions, semesterOptions, batchOptions, sponsorOptions])

  const COLS = 16
  const listHint = (n: number) => <span className="text-g400" style={{ fontWeight: 400 }}>{n > 0 ? `· ${n} selected` : ''}</span>
  const fieldErr = (k: keyof FormState) => errors[k] && <p className="field-err iar-field-err" data-field={k}>{errors[k]}</p>

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="page active" id="page-ia-evaluation-report">
      <div className="pg-hdr">
        <div>
          <div className="pg-title">IA Evaluation Report</div>
          <div className="pg-sub">How far internal assessment marking has got · every submitted Class Test and Coursework, with its mark and evaluator</div>
        </div>
      </div>

      {/* Filters — collapse to a recap after Process. */}
      <div className="card" id="rpt-filters">
        {filtersOpen ? (
          <>
            <div className="rpt-filter-grid">
              <div className="fg m-0">
                <label className="lbl">Intake</label>
                <SearchSelect placeholder="Current intake" options={intakeOptions} value={form.intakeGuid} onChange={v => setField('intakeGuid', v)} isLoading={intakesQuery.isLoading} />
              </div>
              <div className="fg m-0" data-field="campusGuids">
                <label className="lbl">Campus {listHint(form.campusGuids.length)}</label>
                <MultiSelect placeholder="All campuses" options={campusOptions} value={form.campusGuids} onChange={pickCampuses} isLoading={campusesQuery.isLoading} />
                {fieldErr('campusGuids')}
              </div>
              <div className="fg m-0" data-field="programGuids">
                <label className="lbl">Programme {listHint(form.programGuids.length)}</label>
                <MultiSelect
                  placeholder={form.campusGuids.length ? 'All programmes' : 'Choose a campus first'}
                  options={programOptions}
                  value={form.programGuids}
                  onChange={pickPrograms}
                  disabled={!form.campusGuids.length}
                  isLoading={programQueries.some(q => q.isLoading)}
                />
                {fieldErr('programGuids')}
              </div>
              <div className="fg m-0" data-field="semesterGuids">
                <label className="lbl">Semester {listHint(form.semesterGuids.length)}</label>
                <MultiSelect
                  placeholder={form.programGuids.length ? 'All semesters' : 'Choose a programme first'}
                  options={semesterOptions}
                  value={form.semesterGuids}
                  onChange={pickSemesters}
                  disabled={!form.programGuids.length}
                  isLoading={semesterQueries.some(q => q.isLoading)}
                />
                {fieldErr('semesterGuids')}
              </div>
              <div className="fg m-0" data-field="batchGuids">
                <label className="lbl">Batch {listHint(form.batchGuids.length)}</label>
                <MultiSelect
                  placeholder={form.semesterGuids.length ? 'All batches' : 'Choose a semester first'}
                  options={batchOptions}
                  value={form.batchGuids}
                  onChange={v => setField('batchGuids', v)}
                  disabled={!form.semesterGuids.length}
                  isLoading={batchQueries.some(q => q.isLoading)}
                />
                {fieldErr('batchGuids')}
              </div>
              <div className="fg m-0" data-field="sponsorGuids">
                <label className="lbl">Sponsor {listHint(form.sponsorGuids.length)}</label>
                <MultiSelect placeholder="All sponsors" options={sponsorOptions} value={form.sponsorGuids} onChange={v => setField('sponsorGuids', v)} isLoading={sponsorsQuery.isLoading} />
                {fieldErr('sponsorGuids')}
              </div>
              <div className="fg m-0" data-field="unitGuids">
                <label className="lbl">Unit {listHint(form.unitGuids.length)}</label>
                <MultiSelect
                  placeholder="All units — type to search"
                  options={unitOptions}
                  value={form.unitGuids}
                  onChange={v => setField('unitGuids', v)}
                  onSearch={setUnitSearch}
                  isLoading={unitsQuery.isFetching}
                />
                {fieldErr('unitGuids')}
              </div>
              <div className="fg m-0">
                <label className="lbl">Assessment</label>
                <MultiSelect placeholder="Class Test and both Courseworks" options={CATEGORY_OPTIONS} value={form.categories} onChange={v => setField('categories', v)} />
              </div>
              <div className="fg m-0">
                <label className="lbl">Status</label>
                <MultiSelect placeholder="Evaluated and not evaluated" options={STATUS_OPTIONS} value={form.statuses} onChange={v => setField('statuses', v)} />
              </div>
              <div className="fg m-0 span2" data-field="search">
                <label className="lbl" htmlFor="iar-search">Search</label>
                <div className="inp-wrap">
                  <i className="lni lni-search-alt inp-icon" aria-hidden="true" />
                  <input
                    id="iar-search"
                    className="ctrl"
                    placeholder="Name, reg no, student number, email or phone…"
                    maxLength={IA_REPORT_MAX_SEARCH}
                    value={form.search}
                    onChange={e => setField('search', e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !dropdownsBusy) handleProcess() }}
                    aria-invalid={!!errors.search}
                    aria-describedby={errors.search ? 'iar-search-err' : undefined}
                    style={errors.search ? { borderColor: 'var(--red)' } : undefined}
                  />
                </div>
                {errors.search && <p id="iar-search-err" className="field-err iar-field-err">{errors.search}</p>}
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 mt-4 flex-wrap">
              <span className="text-g400 mr-auto" style={{ fontSize: 'var(--fs-sm)' }}>Every filter is optional. Left empty, the report covers all submitted work in the chosen intake.</span>
              <button type="button" className="btn btn-neu btn-sm" onClick={handleReset}>Reset</button>
              <button type="button" className="btn btn-primary btn-sm" onClick={handleProcess} disabled={processing || dropdownsBusy} aria-busy={processing}>
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
              <i className="lni lni-pencil" aria-hidden="true" /> Change filters
            </button>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="card">
        {!saved ? (
          <div className="rpt-empty">
            <i className="lni lni-checkmark-circle" aria-hidden="true" />
            <div className="rpt-empty-title">Set your filters, then Process</div>
            <div style={{ fontSize: 13 }}>Every submitted Class Test and Coursework appears here, with its mark and who evaluated it, plus marking progress per unit.</div>
          </div>
        ) : firstPageFailed ? (
          <div className="rpt-empty">
            <i className="lni lni-warning" aria-hidden="true" style={{ color: 'var(--red)' }} />
            <div className="rpt-empty-title">Couldn’t load the report</div>
            <div style={{ fontSize: 13, marginBottom: 14 }}>{reportErrorMessage(preview.error, 'Something went wrong. Please try again.')}</div>
            <button className="btn btn-neu btn-sm" onClick={() => preview.refetch()}><i className="lni lni-reload" aria-hidden="true" /> Try again</button>
          </div>
        ) : !hasResult ? (
          <div className="rpt-empty" aria-live="polite">
            <i className="lni lni-spinner-arrow spin" aria-hidden="true" />
            <div className="rpt-empty-title">Building the report…</div>
            <div style={{ fontSize: 13 }}>This can take a few seconds for a whole intake.</div>
          </div>
        ) : isEmpty ? (
          <div className="rpt-empty">
            <i className="lni lni-files" aria-hidden="true" />
            <div className="rpt-empty-title">No submitted assessments match these filters</div>
            <div style={{ fontSize: 13 }}>Try another intake, or fewer filters.</div>
          </div>
        ) : (
          <>
            <div className="rpt-results-hdr">
              <div className="rpt-count">
                <strong>{fmtReportCount(totalCount)}</strong> {totalCount === 1 ? 'row' : 'rows'}
                {summary && <> · <strong>{fmtReportCount(summary.totalStudents)}</strong> {summary.totalStudents === 1 ? 'student' : 'students'}</>}
              </div>
              <ReportExportControls
                resetKey={runId}
                mockFileName="IA_Evaluation_Report.xlsx"
                startExport={() => exportIaEvaluationReport(saved)}
                hideWithoutPermission
              />
            </div>

            {/* Keyed by run so a new Process starts back at the top. */}
            <ScrollTable key={runId} className="rpt-scroll">
              <table className="iar-table">
                <thead>
                  <tr>
                    <th>Student No</th><th>Student Name</th><th>Campus</th><th>Programme</th><th>Semester</th>
                    <th>Batch</th><th>Sponsor</th><th>Unit Code</th><th>Unit Name</th><th>Assessment</th>
                    <th>Status</th><th className="num">Mark</th><th className="num">Max Mark</th>
                    <th>Evaluated By</th><th>Evaluated Date</th><th>Comment</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={`${r.studentGuid}-${r.unitCode ?? ''}-${r.category}-${i}`}>
                      <td className="rpt-mono">{dash(r.studentNumber)}</td>
                      <td className="iar-name">{dash(r.studentName)}</td>
                      <td>{dash(r.campusName ?? r.campusCode)}</td>
                      <td className="iar-wrap">{dash(r.programName)}</td>
                      <td className="iar-nowrap">{dash(r.semesterName)}</td>
                      <td className="rpt-mono">{dash(r.batchCode)}</td>
                      <td>{dash(r.sponsorCategory)}</td>
                      <td className="rpt-mono">{dash(r.unitCode)}</td>
                      <td className="iar-wrap">{dash(r.unitName)}</td>
                      <td className="iar-nowrap">{dash(r.categoryName)}</td>
                      <td><StatusBadge row={r} /></td>
                      <td className="num rpt-amt">{fmtMark(r.mark)}</td>
                      <td className="num">{fmtMark(r.maxMark)}</td>
                      <td>{dash(r.evaluatedByName)}</td>
                      <td className="iar-nowrap">{fmtEvaluatedDate(r.evaluatedDate)}</td>
                      <td>{r.comment ? <span className="iar-comment" title={r.comment}>{r.comment}</span> : '—'}</td>
                    </tr>
                  ))}
                  <tr ref={sentinelRef} className="rpt-foot-row">
                    <td colSpan={COLS}>
                      {nextPageFailed ? (
                        <span className="inline-flex items-center gap-3">
                          <span style={{ color: 'var(--red)' }}>Couldn’t load more rows.</span>
                          <button className="btn btn-neu btn-sm" onClick={() => preview.fetchNextPage()}><i className="lni lni-reload" aria-hidden="true" /> Retry</button>
                        </span>
                      ) : preview.hasNextPage ? (
                        <span className="inline-flex items-center gap-2"><i className="lni lni-spinner-arrow spin" aria-hidden="true" /> Loading more…</span>
                      ) : (
                        <span>End of report · {fmtReportCount(rows.length)} rows</span>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </ScrollTable>

            {/* Pinned summary, from page 1 only. Counts are rows (one per
                student per assessment); the average leaves pending rows out. */}
            {summary && (
              <>
                <div className="rpt-stats" role="region" aria-label="Marking summary">
                  <div className="rpt-stats-row">
                    <div className="rpt-stat is-green">
                      <div className="rpt-stat-top">
                        <span className="rpt-stat-lbl">Evaluated</span>
                        <span className="rpt-stat-pct">{Math.floor(markedShare(summary))}%</span>
                      </div>
                      <span className="rpt-stat-num">{fmtReportCount(summary.evaluatedCount)}</span>
                      <div className="rpt-stat-bar" aria-hidden="true"><span style={{ width: `${markedShare(summary)}%` }} /></div>
                    </div>
                    <div className="rpt-stat is-amber">
                      <div className="rpt-stat-top">
                        <span className="rpt-stat-lbl">Not evaluated yet</span>
                        <span className="rpt-stat-pct">{Math.ceil(100 - markedShare(summary))}%</span>
                      </div>
                      <span className="rpt-stat-num">{fmtReportCount(summary.pendingCount)}</span>
                      <div className="rpt-stat-bar" aria-hidden="true"><span style={{ width: `${100 - markedShare(summary)}%` }} /></div>
                    </div>
                    <div className="rpt-stat is-blue">
                      <div className="rpt-stat-top">
                        <span className="rpt-stat-lbl">Average mark</span>
                        <span className="rpt-stat-pct">of evaluated work</span>
                      </div>
                      <span className="rpt-stat-num">{fmtPct(summary.averagePercent)}</span>
                      <div className="rpt-stat-bar iar-avg-bar" aria-hidden="true"><span style={{ width: `${Math.min(100, summary.averagePercent ?? 0)}%` }} /></div>
                    </div>
                  </div>
                </div>
                {summary.byUnit.length > 0 && <UnitSummary units={summary.byUnit} />}
                <div className="rpt-stats-foot">Counts are submissions (one per student per assessment). The Excel file adds a Report Info and a Summary sheet.</div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
