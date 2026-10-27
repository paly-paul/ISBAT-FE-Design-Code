import { apiDelete, apiGet, apiPost, apiPut } from '../client'

const MOCK_AUTH = process.env.NEXT_PUBLIC_AUTH_MOCK === 'true'

// Confirmed via timetables/get-timetable-intakes.md. Call this first — every
// other timetable endpoint is keyed by intakeGuid, and editableIntakeGuids
// is what tells the UI which values Add/Edit should actually be offered for
// (current intake + next one, when it exists — past intakes are view-only in
// this UI even though the write endpoints themselves don't enforce that).
export interface TimetableIntakes {
  currentIntakeGuid: string
  nextIntakeGuid: string | null
  editableIntakeGuids: string[]
}

export function getTimetableIntakes(): Promise<TimetableIntakes> {
  if (MOCK_AUTH) return Promise.resolve({ currentIntakeGuid: 'mock-intake-1', nextIntakeGuid: null, editableIntakeGuids: ['mock-intake-1'] })
  return apiGet<TimetableIntakes>('/api/v1/academic/timetables/intakes')
}

// Confirmed via timetables/get-timetable-course-units.md ("same item shape
// as GET /courseunits/dropdown") together with get-courseunit-dropdown.md
// itself (CourseUnitDropdownItemDto) — courseUnitCode/courseUnitName are
// both nullable per that doc's own field table, not the guaranteed strings
// this was assumed to be before either doc was available.
export interface TimetableCourseUnit {
  courseUnitGuid: string
  courseUnitCode: string | null
  courseUnitName: string | null
}

// Only the units planned for this lecturer in the intake and term
// (get-timetable-course-units.md) — lecturerGuid is required.
export function getTimetableCourseUnits(intakeGuid: string, term: number, lecturerGuid: string): Promise<TimetableCourseUnit[]> {
  if (MOCK_AUTH) return Promise.resolve([])
  const qs = new URLSearchParams({ intakeGuid, term: String(term), lecturerGuid })
  return apiGet<TimetableCourseUnit[] | null>(`/api/v1/academic/timetables/course-units?${qs.toString()}`).then(data => data ?? [])
}

// get-timetable-eligible-batches.md. A tagged course unit returns one row per
// sibling unit and batch, so each row carries its own courseUnitGuid/Code —
// the (courseUnitGuid, batchGuid, semesterGuid) triple is what's saved. For
// the next intake, semesterGuid is the batch's next semester; send unchanged.
export interface EligibleBatch {
  courseUnitGuid: string
  courseUnitCode: string | null
  batchGuid: string
  batchCode: string
  semesterGuid: string
  semesterName: string
  studentCount: number
}

export function getTimetableEligibleBatches(intakeGuid: string, term: number, lecturerGuid: string, batchTimeGuid: string, courseUnitGuid: string): Promise<EligibleBatch[]> {
  if (MOCK_AUTH) return Promise.resolve([])
  const qs = new URLSearchParams({ intakeGuid, term: String(term), lecturerGuid, batchTimeGuid, courseUnitGuid })
  return apiGet<EligibleBatch[] | null>(`/api/v1/academic/timetables/eligible-batches?${qs.toString()}`).then(data => data ?? [])
}

// get-timetable-lecturers.md — the lecturers planned to teach in the intake
// and term (from program planning), whether or not they're timetabled yet.
export interface TimetableLecturer {
  employeeGuid: string
  empName: string | null
}

export function getTimetableLecturers(intakeGuid: string, term: number): Promise<TimetableLecturer[]> {
  if (MOCK_AUTH) return Promise.resolve([])
  const qs = new URLSearchParams({ intakeGuid, term: String(term) })
  return apiGet<TimetableLecturer[] | null>(`/api/v1/academic/timetables/lecturers?${qs.toString()}`).then(data => data ?? [])
}

// Confirmed via timetables/get-timetable-slots.md — the grid itself, fully
// denormalised (names resolved, no further lookups needed to render it).
// startTime/endTime are real strings per the doc, not parseable times —
// rendered as-is rather than reformatted. Does NOT carry the batches array
// (fetch that via getTimetableByGuid for the edit dialog).
export interface TimetableSlot {
  timetableGuid: string
  batchTimeCode: string
  batchTimeName: string
  timeSlotCode: string
  startTime: string
  endTime: string
  dayCode: string
  dayName: string
  roomCode: string
  roomLocation: string | null
  lecturerGuid: string | null
  lecturerName: string | null
  intakeGuid: string
  term: number | null
  load: number
  url: string | null
}

export function getTimetableSlots(intakeGuid: string, term: number, lecturerGuid?: string | null): Promise<TimetableSlot[]> {
  if (MOCK_AUTH) return Promise.resolve([])
  const qs = new URLSearchParams({ intakeGuid, term: String(term) })
  if (lecturerGuid) qs.set('lecturerGuid', lecturerGuid)
  return apiGet<TimetableSlot[] | null>(`/api/v1/academic/timetables/slots?${qs.toString()}`).then(data => data ?? [])
}

// The unit/batch/semester triple attached to one timetable entry — one
// entry can teach several batches at once. Same shape on the GET (detail),
// POST and PUT bodies (confirmed via all three docs).
export interface TimetableBatchLink {
  courseUnitGuid: string
  batchGuid: string
  semesterGuid: string
}

// Confirmed via timetables/get-timetable-by-guid.md — the edit-form shape,
// all GUIDs (no names resolved) plus the full batches array. Maps
// one-to-one onto the PUT body (minus the path guid), so it can be fed
// straight back after editing.
export interface TimetableDetail {
  timetableGuid: string
  batchTimeGuid: string
  lecturerGuid: string
  timeSlotGuid: string
  weekDayGuid: string
  roomGuid: string
  intakeGuid: string
  term: number | null
  load: number
  url: string | null
  batches: TimetableBatchLink[]
}

export function getTimetableByGuid(guid: string): Promise<TimetableDetail> {
  return apiGet<TimetableDetail>(`/api/v1/academic/timetables/${guid}`)
}

// Confirmed via timetables/post-timetable.md and put-timetable.md — identical
// shape for create and update (PUT is a full replacement, including
// `batches`, which is rewritten wholesale: omitting a batch removes it).
// No load: the server sets it to the highest maxCredit of the units.
export interface TimetableInput {
  batchTimeGuid: string
  lecturerGuid: string
  timeSlotGuid: string
  weekDayGuid: string
  roomGuid: string
  intakeGuid: string
  term: number
  url: string | null
  batches: TimetableBatchLink[]
}

// ── View endpoints (by-lecturer / by-batch / by-room / by-slot) ──
// Shared entry shape, per get-timetable-by-lecturer.md "Entry fields". Times
// are HH:mm. Entries come ordered by weekday then start time.
export interface TimetableEntryBatch {
  courseUnitGuid: string
  courseUnitCode: string | null
  courseUnitName: string | null
  batchGuid: string
  batchCode: string
  semesterGuid: string
  semesterName: string | null
  studentCount: number
}

export interface TimetableEntry {
  timetableGuid: string
  batchTimeGuid: string
  batchTimeName: string
  timeSlotGuid: string
  timeSlotCode: string
  startTime: string
  endTime: string
  weekDayGuid: string
  dayCode: string
  dayName: string
  dayOrder: number
  roomGuid: string
  roomCode: string
  roomLocation: string | null
  roomCapacity: number | null
  lecturerGuid: string
  lecturerName: string | null
  load: number
  url: string | null
  headCount: number
  batches: TimetableEntryBatch[]
}

export interface LecturerTimetable {
  lecturerGuid: string
  lecturerName: string | null
  totalLoad: number
  entries: TimetableEntry[]
}

export interface BatchTimetable {
  batchGuid: string
  batchCode: string
  studentCount: number
  entries: TimetableEntry[]
}

export interface RoomTimetable {
  roomGuid: string
  roomCode: string
  roomLocation: string | null
  roomCapacity: number | null
  entries: TimetableEntry[]
}

export interface TimeSlotAudit {
  totalRooms: number
  roomsInUse: number
  nearCapacityRooms: number
  overCapacityRooms: number
  availableRooms: number
  entries: TimetableEntry[]
}

function viewQuery(params: Record<string, string | number>) {
  return new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString()
}

export function getTimetableByLecturer(lecturerGuid: string, intakeGuid: string, term: number): Promise<LecturerTimetable> {
  if (MOCK_AUTH) return Promise.resolve({ lecturerGuid, lecturerName: null, totalLoad: 0, entries: [] })
  return apiGet<LecturerTimetable>(`/api/v1/academic/timetables/by-lecturer?${viewQuery({ lecturerGuid, intakeGuid, term })}`)
}

export function getTimetableByBatch(batchGuid: string, intakeGuid: string, term: number): Promise<BatchTimetable> {
  if (MOCK_AUTH) return Promise.resolve({ batchGuid, batchCode: '', studentCount: 0, entries: [] })
  return apiGet<BatchTimetable>(`/api/v1/academic/timetables/by-batch?${viewQuery({ batchGuid, intakeGuid, term })}`)
}

export function getTimetableByRoom(roomGuid: string, intakeGuid: string, term: number): Promise<RoomTimetable> {
  if (MOCK_AUTH) return Promise.resolve({ roomGuid, roomCode: '', roomLocation: null, roomCapacity: null, entries: [] })
  return apiGet<RoomTimetable>(`/api/v1/academic/timetables/by-room?${viewQuery({ roomGuid, intakeGuid, term })}`)
}

export function getTimetableBySlot(batchTimeGuid: string, weekDayGuid: string, timeSlotGuid: string, intakeGuid: string, term: number): Promise<TimeSlotAudit> {
  if (MOCK_AUTH) return Promise.resolve({ totalRooms: 0, roomsInUse: 0, nearCapacityRooms: 0, overCapacityRooms: 0, availableRooms: 0, entries: [] })
  return apiGet<TimeSlotAudit>(`/api/v1/academic/timetables/by-slot?${viewQuery({ batchTimeGuid, weekDayGuid, timeSlotGuid, intakeGuid, term })}`)
}

// get-lecturer-load.md — advisory total for the term; no ceiling exists.
export function getLecturerLoad(lecturerGuid: string, intakeGuid: string, term: number): Promise<{ lecturerGuid: string; totalLoad: number }> {
  if (MOCK_AUTH) return Promise.resolve({ lecturerGuid, totalLoad: 0 })
  return apiGet<{ lecturerGuid: string; totalLoad: number }>(`/api/v1/academic/timetables/lecturer-load?${viewQuery({ lecturerGuid, intakeGuid, term })}`)
}

// ── Rooms (dropdown and slot availability) ──
export interface RoomOption {
  roomGuid: string
  roomCode: string
  location: string | null
  capacity: number | null
  // Class / Lab label; null for rooms with no type set
  roomType?: number | null
  roomTypeName?: string | null
}

export function getRoomDropdown(): Promise<RoomOption[]> {
  if (MOCK_AUTH) return Promise.resolve([])
  return apiGet<RoomOption[] | null>('/api/v1/academic/rooms/dropdown').then(data => data ?? [])
}

// get-available-rooms.md — rooms free at this batch time, slot and weekday in
// the same intake and term. Advisory: the save re-checks room clashes.
export function getAvailableRooms(p: { batchTimeGuid: string; timeSlotGuid: string; weekDayGuid: string; intakeGuid: string; term: number; excludeTimetableGuid?: string | null }): Promise<RoomOption[]> {
  if (MOCK_AUTH) return Promise.resolve([])
  const params: Record<string, string | number> = { batchTimeGuid: p.batchTimeGuid, timeSlotGuid: p.timeSlotGuid, weekDayGuid: p.weekDayGuid, intakeGuid: p.intakeGuid, term: p.term }
  if (p.excludeTimetableGuid) params.excludeTimetableGuid = p.excludeTimetableGuid
  return apiGet<RoomOption[] | null>(`/api/v1/academic/rooms/available?${viewQuery(params)}`).then(data => data ?? [])
}

// Returns the bare new timetableGuid per the doc — not the full entry.
// Re-fetch with getTimetableByGuid if the saved state is needed.
export function createTimetable(input: TimetableInput): Promise<string> {
  if (MOCK_AUTH) return Promise.resolve(`mock-timetable-${Date.now()}`)
  return apiPost<string>('/api/v1/academic/timetables', input)
}

// Returns bare `true` per the doc, not the updated entry.
export function updateTimetable(guid: string, input: TimetableInput): Promise<boolean> {
  if (MOCK_AUTH) return Promise.resolve(true)
  return apiPut<boolean>(`/api/v1/academic/timetables/${guid}`, input)
}

// Soft-deletes the entry and its attached batch rows together (cascades
// server-side) — no confirmation step or referential check on the backend,
// so the caller's own UI is what should confirm before calling this.
export function deleteTimetable(guid: string): Promise<boolean> {
  if (MOCK_AUTH) return Promise.resolve(true)
  return apiDelete<boolean>(`/api/v1/academic/timetables/${guid}`)
}
