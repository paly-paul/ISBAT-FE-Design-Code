import { apiGet, apiPostWithMessage } from '../client'
import { mockQueueReportJob, normalizeReportJob, type ReportJob } from '../finance/discountReport'

const MOCK_AUTH = process.env.NEXT_PUBLIC_AUTH_MOCK === 'true'

// Students in Programme Report (erp-docs/pages/student/students-in-programme-report-page.md).
// Docs: academic-service/admission/reports/get-students-in-programme-report-preview.md
// and post-students-in-programme-report-export.md. Report jobs / Downloads are
// shared with the other report pages (discountReport.ts, lib/reportDownloads.ts).

// ── Statuses ───────────────────────────────────────────────────────────────

// Fixed list (no dropdown API). Sent as numbers; empty = every status,
// Drop Out and Passout included.
export const STUDENT_STATUSES = [
  { value: 1, label: 'Registered' },
  { value: 2, label: 'Yet to Register' },
  { value: 3, label: 'Drop Out' },
  { value: 4, label: 'Yet to Clear' },
  { value: 5, label: 'Passout' },
] as const

// ── Filters ────────────────────────────────────────────────────────────────

// One programme per report (required); everything else optional. Saved on
// Process and reused for every later page and the export.
export interface StudentsInProgrammeFilters {
  programGuid: string
  semesterGuids?: string[]
  intakeGuids?: string[]
  statuses?: number[]
}

export const STUDENTS_IN_PROGRAMME_PAGE_SIZE = 15

// ── Preview ────────────────────────────────────────────────────────────────

// Field names confirmed against a live response, 2026-11-01.
export interface StudentsInProgrammeRow {
  studentGuid: string
  studentRegNo: string | null
  studentNum: string | null
  studentName: string
  semesterName: string | null      // the semester the student is in now
  batchCode: string | null
  intakeName: string | null        // current intake (admitted intake when none)
  campusName: string | null
  status: number                   // 1–5, see STUDENT_STATUSES
  statusName: string
  sponsorCategory: string | null
  registrationDate: string | null
  learningModeName: string | null
  isRefugee: boolean
  isActive: boolean
}

export interface StudentsInProgrammePreview {
  summary: null                    // always null: the page sends includeSummary=false
  rows: { items: StudentsInProgrammeRow[]; totalCount: number; pageNumber: number; pageSize: number }
}

// ── Mocks ──────────────────────────────────────────────────────────────────

const MOCK_NAMES = ['JOHN OKELLO', 'SARAH NALULE', 'AMINA NAKATO', 'BRIAN KAMYA', 'GRACE NAMPIJJA', 'PETER SSEMWOGERERE']
const MOCK_ROWS: StudentsInProgrammeRow[] = Array.from({ length: 40 }, (_, i) => {
  const status = [1, 1, 1, 2, 1, 3, 1, 4, 1, 5][i % 10]
  const year = 2023 + Math.floor(i / 12)
  const sem = ((i * 3) % 6) + 1
  return {
    studentGuid: `mock-stu-${i}`,
    studentRegNo: `${year}/BAIT/${String(i + 1).padStart(4, '0')}`,
    studentNum: `ISB${year}${String(1000 + i)}`,
    studentName: MOCK_NAMES[i % MOCK_NAMES.length],
    semesterName: `Semester ${sem}`,
    batchCode: i % 2 ? 'BAIT-S22-A' : 'BAIT-S22-B',
    intakeName: i % 3 ? 'Fall 2026' : 'Spring 2024',
    campusName: i % 2 ? 'ISBAT University - Main Campus' : 'ISBAT University - City Campus',
    status,
    statusName: STUDENT_STATUSES.find(s => s.value === status)?.label ?? 'Unknown',
    sponsorCategory: i % 4 === 0 ? null : i % 4 === 1 ? 'Self' : 'Government of Uganda',
    registrationDate: `${year}-0${(i % 9) + 1}-15T00:00:00`,
    learningModeName: i % 5 === 0 ? 'Online Mode' : 'Campus Mode',
    isRefugee: i % 11 === 0,
    isActive: status !== 3 && status !== 5,
  }
})

// ── Endpoints ──────────────────────────────────────────────────────────────

// GET /admissions/reports/students-in-programme/preview. Always
// includeSummary=false — the page shows no status counts. Arrays are repeated
// keys (?statuses=3&statuses=5).
export function getStudentsInProgrammePreview(filters: StudentsInProgrammeFilters, pageNumber: number, pageSize = STUDENTS_IN_PROGRAMME_PAGE_SIZE): Promise<StudentsInProgrammePreview> {
  if (MOCK_AUTH) {
    const rows = MOCK_ROWS.filter(r => !filters.statuses?.length || filters.statuses.includes(r.status))
    const start = (pageNumber - 1) * pageSize
    return new Promise(resolve => setTimeout(() => resolve({
      summary: null,
      rows: { items: rows.slice(start, start + pageSize), totalCount: rows.length, pageNumber, pageSize },
    }), 600))
  }
  const params = new URLSearchParams({ programGuid: filters.programGuid, pageNumber: String(pageNumber), pageSize: String(pageSize), includeSummary: 'false' })
  filters.semesterGuids?.forEach(g => params.append('semesterGuids', g))
  filters.intakeGuids?.forEach(g => params.append('intakeGuids', g))
  filters.statuses?.forEach(s => params.append('statuses', String(s)))
  return apiGet<StudentsInProgrammePreview>(`/api/v1/admissions/reports/students-in-programme/preview?${params.toString()}`)
}

// POST /admissions/reports/students-in-programme/export (202). Same filters
// as the preview, as JSON: each multi-select an array (null when empty),
// statuses as numbers. The same export twice returns the running job.
export function exportStudentsInProgrammeReport(filters: StudentsInProgrammeFilters): Promise<{ job: ReportJob; message: string | null }> {
  if (MOCK_AUTH) {
    return Promise.resolve({ job: mockQueueReportJob('STUDENTS_IN_PROGRAMME', 'Students in Programme Report'), message: 'Export started. You will be notified when it is ready to download.' })
  }
  const body = {
    programGuid: filters.programGuid,
    semesterGuids: filters.semesterGuids?.length ? filters.semesterGuids : null,
    intakeGuids: filters.intakeGuids?.length ? filters.intakeGuids : null,
    statuses: filters.statuses?.length ? filters.statuses : null,
  }
  return apiPostWithMessage<Parameters<typeof normalizeReportJob>[0]>('/api/v1/admissions/reports/students-in-programme/export', body)
    .then(({ data, message }) => ({ job: normalizeReportJob(data), message }))
}
