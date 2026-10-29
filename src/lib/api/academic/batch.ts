import { apiDelete, apiGet, apiPost, apiPut } from '../client'

const MOCK_AUTH = process.env.NEXT_PUBLIC_AUTH_MOCK === 'true'

// Confirmed via a real GET /api/v1/academic/batches response — the legacy
// intProgram/intSem/intStream/batchTime int FKs (with no confirmed guid
// counterpart) have been replaced with real guids on the read side too, not
// just Create/Update. A batch is students enrolled in a specific
// program-semester combination for a given intake.
export interface Batch {
  batchGuid: string
  batchCode: string
  programGuid: string
  semesterGuid: string
  streamGuid: string
  batchTimeGuid: string
  bStartDate: string | null
  bEndDate: string | null
  // 0/1 flag, not a multi-value enum — same convention as country.ts's
  // defaultCountry.
  active: number
  bInCharge?: string
  pHead?: string | null
  // Pre-resolved display names — confirmed live on GET /api/v1/academic/batches
  // (2026-09-09), present on every row in a real sample. batch-management's
  // own page used to resolve all of these via separate lookups (a full
  // Programme Master/Streams/Batch Times fetch each, plus a genuinely N+1
  // per-programme semester fetch for semesterName specifically) — prefer
  // these instead wherever present, falling back to the client-side lookup
  // only if a row ever comes back without one, same "prefer server, fall
  // back to client resolve" convention used throughout this app.
  programName?: string | null
  semesterName?: string | null
  streamName?: string | null
  batchTimeName?: string | null
  batchTimeCode?: string | null
  // From MR !341 (get-batches.md, 2026-10-26), which folded the removed
  // GET /batch-summary into this endpoint. intakeName/intakeCode/intakeGuid
  // are the batch's OWN intake — it can differ from the intake being listed.
  programCode?: string | null
  semCode?: number | null
  intakeGuid?: string | null
  intakeCode?: number | null
  intakeName?: string | null
  bInChargeName?: string | null
  pHeadName?: string | null
  // Students currently in the batch; null when the Student service has no
  // entry for it — show as 0.
  headCount?: number | null
}

export interface BatchListResult {
  items: Batch[]
  totalCount: number
  pageNumber: number
  pageSize: number
}

// Confirmed via a real GET /api/v1/academic/batches/:guid response — this
// endpoint DOES return intakeGuid and bInCharge after all (superseding the
// BatchUpdateInput note below claiming neither could be prefilled); it's
// just a richer shape than the list endpoint's own Batch, not a plain
// re-fetch of the same fields. bInCharge comes back as the all-zero sentinel
// guid ("00000000-0000-0000-0000-000000000000") when unset — .NET's default
// Guid value, not a real employee reference — so treat that value as "no
// in-charge assigned" (null) the same way an empty string is treated
// elsewhere in this app, rather than trying to resolve it against the
// Employee master. intakeCode/intakeDescription/batchTimeName/
// batchTimeCode/yearCode are resolved display strings the create/update
// payload doesn't need (intakeGuid/batchTimeGuid already cover those), and
// pHead is still of unconfirmed purpose with no UI control.
export interface BatchDetail extends Batch {
  bInCharge: string
  intakeGuid: string
  intakeCode: number
  intakeDescription: string
  yearCode: number
  pHead: string | null
  batchTimeName: string
  batchTimeCode: string
}

// .NET's default/unset Guid value — never a real employee/intake reference.
export const EMPTY_GUID = '00000000-0000-0000-0000-000000000000'

// Confirmed via the updated Create/Update schema — programGuid/semesterGuid/
// streamGuid/batchTimeGuid are real guids, and bInCharge is now CONFIRMED to
// be a real employeeGuid too (a live sample payload showed a genuine guid,
// not a list-position int) — this resolves the last "int FK with no guid
// source" gap noted for this domain; the 1-based-list-position workaround is
// gone, both here and in NewBatchModal/EditBatchModal. intakeGuid replaces
// the old intakeCode int field (no more Intake lookup-by-code needed to
// submit). pHead is a new field of unconfirmed purpose (possibly "Programme
// Head") — no UI control exists for it yet, always sent null.
export interface BatchCreateInput {
  programGuid: string
  semesterGuid: string
  streamGuid: string
  batchTimeGuid: string
  bStartDate: string | null
  bEndDate: string | null
  bInCharge: string
  intakeGuid: string
  pHead: string | null
  active: number
}

// Confirmed: Update takes the identical shape as Create — a full replace,
// not a narrower partial body. GET /batches/:guid returns real guid fields
// for all of Programme/Semester/Stream/Batch Time/Intake — see BatchDetail
// above — so EditBatchModal can now prefill every field, including Intake
// and Batch In-Charge (previously believed unrecoverable from GetByGuid;
// corrected by a real sample response — see BatchDetail's own note).
export type BatchUpdateInput = BatchCreateInput

let mockBatchSeq = 1

const mockBatches: Batch[] = [
  { batchGuid: 'd7b04278-21ef-4cfa-8bee-ff336f08e344', batchCode: 'CSF26MRNA', programGuid: 'mock-program-1', semesterGuid: 'mock-semester-1', streamGuid: 'mock-stream-1', batchTimeGuid: 'mock-batchtime-1', bStartDate: '2024-02-12T00:00:00', bEndDate: '2024-06-07T00:00:00', active: 1 },
]

// Scope for GET /batches (get-batches.md). intakeGuid omitted = the CURRENT
// ADMISSION INTAKE, not every batch: the API has no "all intakes" option
// (an unknown guid returns an empty page). An intake's batches are those
// created in it plus older batches with a session in it. Unknown campus /
// intake guids return an empty page, not an error.
export interface BatchScope {
  intakeGuid?: string | null
  campusGuid?: string | null
}

// Lists batches (paginated), ordered by batch code. search matches batch
// code, programme code/name, semester, stream and batch time server-side.
export function getBatches(pageNumber = 1, pageSize = 20, search = '', scope: BatchScope = {}, filters: BatchColumnFilters = {}): Promise<BatchListResult> {
  const q = search.trim()
  if (MOCK_AUTH) {
    const filtered = mockBatches.filter(b => (!q || b.batchCode.toLowerCase().includes(q.toLowerCase())) && mockMatches(b, filters))
    return Promise.resolve({ items: filtered.slice((pageNumber - 1) * pageSize, pageNumber * pageSize), totalCount: filtered.length, pageNumber, pageSize })
  }
  const params = batchQuery(q, scope, filters)
  params.set('pageNumber', String(pageNumber))
  params.set('pageSize', String(pageSize))
  return apiGet<BatchListResult | null>(`/api/v1/academic/batches?${params.toString()}`)
    .then(data => data ?? { items: [], totalCount: 0, pageNumber, pageSize })
}

// Column filters for the batch list (get-batches.md multi-select params).
// Values inside one param are OR'd, different params AND'd. Only values the
// filter-options endpoint returned should go in — a malformed guid or
// semCode answers 500.
export interface BatchColumnFilters {
  batchCodes?: string[]
  programGuids?: string[]
  semCodes?: number[]
  streamGuids?: string[]
  batchTimeGuids?: string[]
  bInChargeGuids?: string[]
  pHeadGuids?: string[]
  // With pHeadGuids it matches either; alone, only batches with no head.
  noProgramHead?: boolean
  active?: 0 | 1
}

// Shared by the list and filter-options: search, scope and filters, with
// each multi-select value repeated and empty ones left out.
function batchQuery(search: string, scope: BatchScope, f: BatchColumnFilters) {
  const params = new URLSearchParams()
  if (search) params.set('search', search)
  if (scope.intakeGuid) params.set('intakeGuid', scope.intakeGuid)
  if (scope.campusGuid) params.set('campusGuid', scope.campusGuid)
  const lists: [string, (string | number)[] | undefined][] = [
    ['batchCodes', f.batchCodes], ['programGuids', f.programGuids], ['semCodes', f.semCodes], ['streamGuids', f.streamGuids],
    ['batchTimeGuids', f.batchTimeGuids], ['bInChargeGuids', f.bInChargeGuids], ['pHeadGuids', f.pHeadGuids],
  ]
  for (const [key, vals] of lists) for (const v of vals ?? []) params.append(key, String(v))
  if (f.noProgramHead) params.set('noProgramHead', 'true')
  if (f.active !== undefined) params.set('active', String(f.active))
  return params
}

// get-batch-filter-options.md — the distinct values for each column filter,
// narrowed by every other applied filter (each column ignores its own).
export interface BatchFilterOptions {
  batchCodes: string[]
  programs: { programGuid: string; programCode?: string | null; programName: string | null }[]
  semesters: { semCode: number; semesterName: string | null }[]
  streams: { streamGuid: string; streamName: string | null }[]
  batchTimes: { batchTimeGuid: string; batchTimeCode?: string | null; batchTimeName: string | null }[]
  batchInCharges: { employeeGuid: string; employeeName: string | null }[]
  programHeads: { employeeGuid: string; employeeName: string | null }[]
  hasBatchesWithoutProgramHead: boolean
}

const EMPTY_FILTER_OPTIONS: BatchFilterOptions = {
  batchCodes: [], programs: [], semesters: [], streams: [], batchTimes: [], batchInCharges: [], programHeads: [], hasBatchesWithoutProgramHead: false,
}

export function getBatchFilterOptions(search = '', scope: BatchScope = {}, filters: BatchColumnFilters = {}): Promise<BatchFilterOptions> {
  const q = search.trim()
  if (MOCK_AUTH) {
    const rows = mockBatches.filter(b => !q || b.batchCode.toLowerCase().includes(q.toLowerCase()))
    // Each column ignores its own filter, as the real endpoint does.
    const without = (k: keyof BatchColumnFilters) => rows.filter(b => mockMatches(b, { ...filters, [k]: undefined, ...(k === 'pHeadGuids' ? { noProgramHead: undefined } : {}) }))
    const uniq = <T,>(items: T[], key: (t: T) => string) => [...new Map(items.map(i => [key(i), i])).values()]
    return Promise.resolve({
      batchCodes: [...new Set(without('batchCodes').map(b => b.batchCode))].sort(),
      programs: uniq(without('programGuids').filter(b => b.programGuid).map(b => ({ programGuid: b.programGuid!, programName: b.programName ?? null })), p => p.programGuid),
      semesters: uniq(without('semCodes').filter(b => b.semCode).map(b => ({ semCode: b.semCode!, semesterName: b.semesterName ?? null })), s => String(s.semCode)).sort((a, b) => a.semCode - b.semCode),
      streams: uniq(without('streamGuids').filter(b => b.streamGuid).map(b => ({ streamGuid: b.streamGuid!, streamName: b.streamName ?? null })), s => s.streamGuid),
      batchTimes: uniq(without('batchTimeGuids').filter(b => b.batchTimeGuid).map(b => ({ batchTimeGuid: b.batchTimeGuid!, batchTimeName: b.batchTimeName ?? null })), t => t.batchTimeGuid),
      batchInCharges: uniq(without('bInChargeGuids').filter(b => b.bInCharge && b.bInCharge !== EMPTY_GUID).map(b => ({ employeeGuid: b.bInCharge!, employeeName: b.bInChargeName ?? null })), e => e.employeeGuid),
      programHeads: uniq(without('pHeadGuids').filter(b => b.pHead && b.pHead !== EMPTY_GUID).map(b => ({ employeeGuid: b.pHead!, employeeName: b.pHeadName ?? null })), e => e.employeeGuid),
      hasBatchesWithoutProgramHead: without('pHeadGuids').some(b => !b.pHead || b.pHead === EMPTY_GUID),
    })
  }
  return apiGet<Partial<BatchFilterOptions> | null>(`/api/v1/academic/batches/filter-options?${batchQuery(q, scope, filters).toString()}`)
    .then(d => ({ ...EMPTY_FILTER_OPTIONS, ...(d ?? {}) }))
}

function mockMatches(b: Batch, f: BatchColumnFilters) {
  const has = <T,>(vals: T[] | undefined, v: T | null | undefined) => !vals?.length || (v != null && vals.includes(v))
  const noHead = !b.pHead || b.pHead === EMPTY_GUID
  const headOk = !f.pHeadGuids?.length && !f.noProgramHead
    ? true
    : (!!f.pHeadGuids?.length && has(f.pHeadGuids, b.pHead)) || (!!f.noProgramHead && noHead)
  return has(f.batchCodes, b.batchCode) && has(f.programGuids, b.programGuid) && has(f.semCodes, b.semCode)
    && has(f.streamGuids, b.streamGuid) && has(f.batchTimeGuids, b.batchTimeGuid) && has(f.bInChargeGuids, b.bInCharge)
    && headOk && (f.active === undefined || Number(!!b.active) === f.active)
}

export interface BatchDropdownItem {
  batchGuid: string
  batchCode: string
}

// GET /api/v1/academic/batches/dropdown — every param optional and
// combinable (get-batches-dropdown.md). intakeGuid scopes to batches linked
// to that intake via its session (T_SESSION_MANAGEMENT → T_SESSION_BATCH).
// Item shape { batchGuid, batchCode } confirmed by the same doc.
export function getBatchDropdown(programGuid?: string, semesterGuid?: string, intakeGuid?: string): Promise<BatchDropdownItem[]> {
  if (MOCK_AUTH) return Promise.resolve(mockBatches.map(b => ({ batchGuid: b.batchGuid, batchCode: b.batchCode })))
  const params = new URLSearchParams()
  if (intakeGuid) params.set('intakeGuid', intakeGuid)
  if (programGuid) params.set('programGuid', programGuid)
  if (semesterGuid) params.set('semesterGuid', semesterGuid)
  const query = params.toString() ? `?${params.toString()}` : ''
  return apiGet<BatchDropdownItem[] | null>(`/api/v1/academic/batches/dropdown${query}`)
    .then((data: any) => Array.isArray(data) ? data : (data && typeof data === 'object' ? (data.items || Object.values(data).find(Array.isArray) || []) : []))
}

// Create a new batch and return the saved record. batchCode is
// system-generated by the backend — never sent by the client.
export function createBatch(input: BatchCreateInput): Promise<Batch> {
  if (MOCK_AUTH) {
    const batch: Batch = {
      batchGuid: crypto.randomUUID(),
      batchCode: `MOCK-${mockBatchSeq++}`,
      programGuid: input.programGuid,
      semesterGuid: input.semesterGuid,
      streamGuid: input.streamGuid,
      batchTimeGuid: input.batchTimeGuid,
      bStartDate: input.bStartDate,
      bEndDate: input.bEndDate,
      active: 1,
    }
    mockBatches.push(batch)
    return Promise.resolve(batch)
  }
  return apiPost<Batch>('/api/v1/academic/batches', input)
}

// Fetch one batch by its GUID.
export function getBatchById(guid: string): Promise<BatchDetail> {
  if (MOCK_AUTH) {
    const existing = mockBatches.find(b => b.batchGuid === guid)
    if (!existing) return Promise.reject(new Error('Batch not found'))
    return Promise.resolve({
      ...existing,
      bInCharge: EMPTY_GUID,
      intakeGuid: '',
      intakeCode: 0,
      intakeDescription: '',
      yearCode: 0,
      pHead: null,
      batchTimeName: '',
      batchTimeCode: '',
    })
  }
  return apiGet<BatchDetail>(`/api/v1/academic/batches/${guid}`)
}

// Update a batch by GUID and return the updated record.
export function updateBatch(guid: string, input: BatchUpdateInput): Promise<Batch> {
  if (MOCK_AUTH) {
    const existing = mockBatches.find(b => b.batchGuid === guid)
    if (!existing) return Promise.reject(new Error('Batch not found'))
    existing.programGuid = input.programGuid
    existing.semesterGuid = input.semesterGuid
    existing.streamGuid = input.streamGuid
    existing.batchTimeGuid = input.batchTimeGuid
    existing.bStartDate = input.bStartDate
    existing.bEndDate = input.bEndDate
    return Promise.resolve(existing)
  }
  return apiPut<Batch>(`/api/v1/academic/batches/${guid}`, input)
}

// Delete a batch and return true when the API confirms success.
export function deleteBatch(guid: string): Promise<boolean> {
  if (MOCK_AUTH) {
    const index = mockBatches.findIndex(b => b.batchGuid === guid)
    if (index === -1) return Promise.reject(new Error('Batch not found'))
    mockBatches.splice(index, 1)
    return Promise.resolve(true)
  }
  return apiDelete<boolean>(`/api/v1/academic/batches/${guid}`)
}

// Confirmed via students/post-counts-by-batch.md: "Used by the academic
// service to display student counts on batch management screens" — but
// wasn't actually wired into this page at all until now, so Batch
// Management never surfaced whether a batch being deleted had real students
// enrolled in it (the confirmed bug this backs the fix for). Batches with
// zero students are omitted from the response entirely (a missing key means
// zero), not returned as an explicit 0 — normalised to a plain number here
// so callers don't have to special-case "key absent" themselves.
export function getStudentCountsByBatch(batchGuids: string[]): Promise<Record<string, number>> {
  if (batchGuids.length === 0) return Promise.resolve({})
  if (MOCK_AUTH) return Promise.resolve({})
  return apiPost<Record<string, number> | null>('/api/v1/students/counts-by-batch', batchGuids)
    .then(data => data ?? {})
}
