import { apiGet, apiPostWithMessage } from '../client'
import { mockQueueReportJob, normalizeReportJob, type ReportJob } from '../finance/discountReport'

const MOCK_AUTH = process.env.NEXT_PUBLIC_AUTH_MOCK === 'true'

// IA Evaluation Report (erp-docs/pages/assessment/ia-evaluation-report-page.md)
//   GET  /api/v1/assessment/reports/ia-evaluation/preview  (assessment.iaevaluationreport.get)
//   POST /api/v1/assessment/reports/ia-evaluation/export   (assessment.iaevaluationreport.export)
// One row per student per assessment (Class Test, Coursework 1, Coursework 2),
// submitted work only. Export jobs land in the shared Downloads list.

// ── Filters ────────────────────────────────────────────────────────────────

export const IA_CATEGORY_OPTIONS = [
  { value: 1, label: 'Class Test' },
  { value: 2, label: 'Coursework 1' },
  { value: 3, label: 'Coursework 2' },
] as const

export const IA_STATUS = { Pending: 0, Evaluated: 1 } as const
export const IA_STATUS_OPTIONS = [
  { value: IA_STATUS.Pending, label: 'Submitted, not evaluated' },
  { value: IA_STATUS.Evaluated, label: 'Evaluated' },
] as const

export const IA_REPORT_MAX_VALUES = 50   // per list filter
export const IA_REPORT_MIN_SEARCH = 3
export const IA_REPORT_MAX_SEARCH = 100
export const IA_REPORT_PAGE_SIZE = 15

// Every field optional. Values inside one list are OR, different filters AND.
// No intakeGuid means the current academic intake.
export interface IaEvaluationReportFilters {
  intakeGuid?: string
  campusGuids?: string[]
  programGuids?: string[]
  semesterGuids?: string[]
  batchGuids?: string[]
  sponsorCategoryGuids?: string[]
  courseUnitGuids?: string[]
  categories?: number[]
  statuses?: number[]
  search?: string
}

// ── Preview ────────────────────────────────────────────────────────────────

export interface IaEvaluationUnitSummary {
  programName: string | null
  semesterName: string | null
  // Can be null until the academic unit-names call allows the Assessment
  // service (documented known limitation).
  unitCode: string | null
  unitName: string | null
  enrolledStudents: number
  submittedStudents: number
  evaluatedCount: number    // rows, not students
  pendingCount: number
  averagePercent: number | null
}

export interface IaEvaluationReportSummary {
  totalRows: number
  totalStudents: number
  evaluatedCount: number
  pendingCount: number
  averagePercent: number | null   // evaluated rows only; null when none are
  byUnit: IaEvaluationUnitSummary[]
}

export interface IaEvaluationReportRow {
  studentGuid: string
  studentNumber: string | null
  studentName: string | null
  campusCode: string | null
  campusName: string | null
  programName: string | null
  semesterName: string | null
  batchCode: string | null
  sponsorCategory: string | null
  unitCode: string | null
  unitName: string | null
  category: number
  categoryName: string | null
  status: number
  statusName: string | null
  // null until the row is evaluated
  mark: number | null
  maxMark: number | null
  evaluatedByName: string | null
  evaluatedDate: string | null
  comment: string | null
}

export interface IaEvaluationReportPreview {
  summary: IaEvaluationReportSummary | null   // null when includeSummary=false
  rows: { items: IaEvaluationReportRow[]; totalCount: number; pageNumber: number; pageSize: number }
}

// ── Mocks ──────────────────────────────────────────────────────────────────

const MOCK_UNITS = [
  { code: 'BBA3122', name: 'Business Information Systems', prog: 'BBA International Business - S22', sem: 'Year Three - Semester One' },
  { code: 'BCS2222', name: 'Data Science Algorithms and Tools', prog: 'BSc Computer Science - S22', sem: 'Year Two - Semester Two' },
  { code: 'BIT2224', name: 'Internet of Things', prog: 'BSc Information Technology - F23', sem: 'Year Two - Semester Two' },
]
const MOCK_NAMES = ['NAMBAFU JEMIMAH', 'OKELLO JAMES', 'SSUUBI RITAH', 'KAMYA BRIAN', 'NAKATO AMINA', 'TUMUKUNDE ESTHER', 'MUGISHA ALVIN']

const MOCK_ROWS: IaEvaluationReportRow[] = Array.from({ length: 63 }, (_, i) => {
  const unit = MOCK_UNITS[i % MOCK_UNITS.length]
  const category = (Math.floor(i / 3) % 3) + 1
  const evaluated = i % 7 !== 3
  const max = category === 1 ? 50 : 100
  return {
    studentGuid: `mock-ia-${i % 21}`,
    studentNumber: `0122400${String(40 + (i % 21)).padStart(2, '0')}`,
    studentName: MOCK_NAMES[i % MOCK_NAMES.length],
    campusCode: '01',
    campusName: 'Main Campus',
    programName: unit.prog,
    semesterName: unit.sem,
    batchCode: 'BBAIBF24DA',
    sponsorCategory: i % 5 === 0 ? 'HESFB' : 'SELF',
    unitCode: unit.code,
    unitName: unit.name,
    category,
    categoryName: IA_CATEGORY_OPTIONS[category - 1].label,
    status: evaluated ? 1 : 0,
    statusName: evaluated ? 'Evaluated' : 'Submitted, not evaluated',
    mark: evaluated ? Math.round(max * (0.55 + ((i * 7) % 45) / 100)) : null,
    maxMark: evaluated ? max : null,
    evaluatedByName: evaluated ? (i % 4 === 0 ? null : 'Dr. Nabirye') : null,
    evaluatedDate: evaluated ? `2026-09-${String(10 + (i % 15)).padStart(2, '0')}T15:35:17.893` : null,
    comment: evaluated && i % 6 === 0 ? 'Good structure; cite sources.' : null,
  }
})

function mockFilter(f: IaEvaluationReportFilters): IaEvaluationReportRow[] {
  const term = f.search?.toLowerCase()
  return MOCK_ROWS.filter(r =>
    (!f.categories?.length || f.categories.includes(r.category))
    && (!f.statuses?.length || f.statuses.includes(r.status))
    && (!term || (r.studentName ?? '').toLowerCase().includes(term) || (r.studentNumber ?? '').includes(term)))
}

function pct(rows: IaEvaluationReportRow[]): number | null {
  const done = rows.filter(r => r.status === 1 && r.maxMark)
  const max = done.reduce((s, r) => s + (r.maxMark ?? 0), 0)
  return max ? Math.round((done.reduce((s, r) => s + (r.mark ?? 0), 0) / max) * 10000) / 100 : null
}

function mockSummary(rows: IaEvaluationReportRow[]): IaEvaluationReportSummary {
  return {
    totalRows: rows.length,
    totalStudents: new Set(rows.map(r => r.studentGuid)).size,
    evaluatedCount: rows.filter(r => r.status === 1).length,
    pendingCount: rows.filter(r => r.status === 0).length,
    averagePercent: pct(rows),
    byUnit: MOCK_UNITS.map(u => {
      const list = rows.filter(r => r.unitCode === u.code)
      return {
        programName: u.prog, semesterName: u.sem, unitCode: u.code, unitName: u.name,
        enrolledStudents: 24,
        submittedStudents: new Set(list.map(r => r.studentGuid)).size,
        evaluatedCount: list.filter(r => r.status === 1).length,
        pendingCount: list.filter(r => r.status === 0).length,
        averagePercent: pct(list),
      }
    }).filter(u => u.evaluatedCount + u.pendingCount > 0),
  }
}

// ── Endpoints ──────────────────────────────────────────────────────────────

// Page 1 carries the summary; every later page passes includeSummary=false.
// Lists are repeated query keys. Slow by design (the whole scope is
// recalculated per call), so callers must never run two pages at once.
export function getIaEvaluationReportPreview(filters: IaEvaluationReportFilters, pageNumber: number, pageSize = IA_REPORT_PAGE_SIZE): Promise<IaEvaluationReportPreview> {
  const includeSummary = pageNumber === 1
  if (MOCK_AUTH) {
    const rows = mockFilter(filters)
    const start = (pageNumber - 1) * pageSize
    return new Promise(resolve => setTimeout(() => resolve({
      summary: includeSummary ? mockSummary(rows) : null,
      rows: { items: rows.slice(start, start + pageSize), totalCount: rows.length, pageNumber, pageSize },
    }), includeSummary ? 1200 : 700))
  }
  const params = new URLSearchParams({ pageNumber: String(pageNumber), pageSize: String(pageSize) })
  if (!includeSummary) params.set('includeSummary', 'false')
  if (filters.intakeGuid) params.set('intakeGuid', filters.intakeGuid)
  const lists: [string, (string | number)[] | undefined][] = [
    ['campusGuids', filters.campusGuids], ['programGuids', filters.programGuids],
    ['semesterGuids', filters.semesterGuids], ['batchGuids', filters.batchGuids],
    ['sponsorCategoryGuids', filters.sponsorCategoryGuids], ['courseUnitGuids', filters.courseUnitGuids],
    ['categories', filters.categories], ['statuses', filters.statuses],
  ]
  for (const [key, values] of lists) values?.forEach(v => params.append(key, String(v)))
  if (filters.search) params.set('search', filters.search)
  return apiGet<IaEvaluationReportPreview>(`/api/v1/assessment/reports/ia-evaluation/preview?${params.toString()}`)
}

// 202 with a job. Same filters as the preview, as JSON arrays. An identical
// export already queued or running comes back as that same job.
export function exportIaEvaluationReport(filters: IaEvaluationReportFilters): Promise<{ job: ReportJob; message: string | null }> {
  if (MOCK_AUTH) {
    return Promise.resolve({ job: mockQueueReportJob('assessment.ia-evaluation', 'IA Evaluation Report'), message: 'Export started. You will be notified when it is ready to download.' })
  }
  const list = <T,>(v?: T[]) => (v?.length ? v : null)
  const body = {
    intakeGuid: filters.intakeGuid ?? null,
    campusGuids: list(filters.campusGuids),
    programGuids: list(filters.programGuids),
    semesterGuids: list(filters.semesterGuids),
    batchGuids: list(filters.batchGuids),
    sponsorCategoryGuids: list(filters.sponsorCategoryGuids),
    courseUnitGuids: list(filters.courseUnitGuids),
    categories: list(filters.categories),
    statuses: list(filters.statuses),
    search: filters.search ?? null,
  }
  return apiPostWithMessage<Parameters<typeof normalizeReportJob>[0]>('/api/v1/assessment/reports/ia-evaluation/export', body)
    .then(({ data, message }) => ({ job: normalizeReportJob(data), message }))
}
