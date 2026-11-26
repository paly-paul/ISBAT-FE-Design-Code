import { apiGet, apiPostWithMessage } from '../client'
import { mockQueueReportJob, normalizeReportJob, type ReportJob } from '../finance/discountReport'

const MOCK_AUTH = process.env.NEXT_PUBLIC_AUTH_MOCK === 'true'

// Batch Lifecycle Report (erp-docs/pages/students/batch-lifecycle-report-page.md).
// Docs: academic-service/admission/reports/get-batch-lifecycle-report-preview.md
// and post-batch-lifecycle-report-export.md. Report jobs / Downloads are
// shared with the other report pages (discountReport.ts, lib/reportDownloads.ts);
// these exports are reportType BATCH_LIFECYCLE, module admissions.

// ── Filters ────────────────────────────────────────────────────────────────

// Intakes are required (1–50). Intake, Campus and Programme define the group;
// Semester and Batch only narrow the outcome counts. Saved on Process and
// reused for every later page and the export.
export interface BatchLifecycleFilters {
  intakeGuids: string[]
  campusGuid?: string
  programGuid?: string
  semesterGuid?: string
  batchGuid?: string
}

export const BATCH_LIFECYCLE_PAGE_SIZE = 15

// ── Preview ────────────────────────────────────────────────────────────────

// passedOut + stillStudying + droppedOut + transferredOut = started.
// matching is null unless a semester or batch was sent.
interface BatchLifecycleCounts {
  started: number
  passedOut: number
  stillStudying: number
  registered: number
  yetToRegister: number
  yetToClear: number
  droppedOut: number
  transferredOut: number
  completionPercent: number
  dropoutPercent: number
  matching: number | null
}

export interface BatchLifecycleRow extends BatchLifecycleCounts {
  programGuid: string
  programName: string | null   // the programme the students started in
}

export interface BatchLifecycleSummary extends BatchLifecycleCounts {
  totalPrograms: number
}

export interface BatchLifecyclePreview {
  summary: BatchLifecycleSummary | null   // null when includeSummary=false
  rows: { items: BatchLifecycleRow[]; totalCount: number; pageNumber: number; pageSize: number }
}

// ── Endpoints ──────────────────────────────────────────────────────────────

// GET /admissions/reports/batch-lifecycle/preview. Page 1 with the summary;
// every later page passes includeSummary=false (summary comes back null).
// Intakes are repeated keys: ?intakeGuids=a&intakeGuids=b.
export function getBatchLifecyclePreview(filters: BatchLifecycleFilters, pageNumber: number, pageSize = BATCH_LIFECYCLE_PAGE_SIZE): Promise<BatchLifecyclePreview> {
  const includeSummary = pageNumber === 1
  // Mock mode: an empty result (no sample data).
  if (MOCK_AUTH) return Promise.resolve({ summary: null, rows: { items: [], totalCount: 0, pageNumber, pageSize } })
  const params = new URLSearchParams({ pageNumber: String(pageNumber), pageSize: String(pageSize) })
  if (!includeSummary) params.set('includeSummary', 'false')
  filters.intakeGuids.forEach(g => params.append('intakeGuids', g))
  if (filters.campusGuid) params.set('campusGuid', filters.campusGuid)
  if (filters.programGuid) params.set('programGuid', filters.programGuid)
  if (filters.semesterGuid) params.set('semesterGuid', filters.semesterGuid)
  if (filters.batchGuid) params.set('batchGuid', filters.batchGuid)
  return apiGet<BatchLifecyclePreview>(`/api/v1/admissions/reports/batch-lifecycle/preview?${params.toString()}`)
}

// POST /admissions/reports/batch-lifecycle/export (202). The SAVED filters
// from Process, as JSON with intakeGuids as an array. The same export twice
// returns the job already running.
export function exportBatchLifecycleReport(filters: BatchLifecycleFilters): Promise<{ job: ReportJob; message: string | null }> {
  if (MOCK_AUTH) {
    return Promise.resolve({ job: mockQueueReportJob('BATCH_LIFECYCLE', 'Batch Lifecycle Report'), message: 'Export started. You will be notified when it is ready to download.' })
  }
  const body = {
    intakeGuids: filters.intakeGuids,
    campusGuid: filters.campusGuid ?? null,
    programGuid: filters.programGuid ?? null,
    semesterGuid: filters.semesterGuid ?? null,
    batchGuid: filters.batchGuid ?? null,
  }
  return apiPostWithMessage<Parameters<typeof normalizeReportJob>[0]>('/api/v1/admissions/reports/batch-lifecycle/export', body)
    .then(({ data, message }) => ({ job: normalizeReportJob(data), message }))
}
