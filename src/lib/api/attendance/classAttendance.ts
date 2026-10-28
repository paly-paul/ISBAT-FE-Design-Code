// Class Attendance (class-attendance-frontend-spec.md, Attendance service).
// UI-ONLY FOR NOW: no network calls. Every function below works on the
// in-memory mock store, shaped exactly like the spec's request/response
// DTOs, so swapping in the real endpoints later only touches this file:
//   GET    /api/v1/attendance/sessions/pending-outlines?timetableGuid=
//   GET    /api/v1/attendance/sessions/by-timetable-date?timetableGuid=&date=
//   GET    /api/v1/attendance/sessions/outlines/by-unit?courseUnitGuid=
//   GET    /api/v1/attendance/sessions/students?timetableGuid=&date=
//   POST   /api/v1/attendance/sessions/record
//   GET    /api/v1/attendance/sessions?page=&pageSize=&batchGuid=&courseUnitGuid=
//   DELETE /api/v1/attendance/sessions/{guid}
// Dates are YYYY-MM-DD, times HH:mm:ss (24-hour).

export const SESSION_STATUS_META: Record<number, { label: string; badge: string }> = {
  0: { label: 'Scheduled', badge: 'badge-blue' },
  1: { label: 'Completed', badge: 'badge-green' },
  2: { label: 'Cancelled', badge: 'badge-grey' },
  3: { label: 'Skipped', badge: 'badge-orange' },
}

export const SKIP_REASONS = [
  { value: 1, label: 'Holiday' },
  { value: 2, label: 'Lecturer Absence' },
  { value: 3, label: 'On Duty' },
  { value: 4, label: 'Other' },
]

export function skipReasonLabel(v: number | null | undefined) {
  return SKIP_REASONS.find(r => r.value === v)?.label ?? null
}

// ── DTOs (spec) ──
export interface AttendanceSession {
  attendanceSessionGuid: string | null
  timetableGuid: string
  sessionDate: string
  startTime: string
  endTime: string
  status: number
  isAutomated: boolean
  isSkipped: boolean
  skipReason: number | null
  isSpecialClass: boolean
  outlines: { outlineTlGuid: string }[]
}

export interface OutlineTopic {
  outlineTlGuid: string
  outlineCode: string
  outlineDetails: string
}

export interface AttendanceStudent {
  studentGuid: string
  studentNumber: string
  fullName: string
  isPresent: boolean
}

export interface PendingOutlineSession {
  attendanceSessionGuid: string
  sessionDate: string
  startTime: string
  endTime: string
}

export interface RecordAttendanceInput {
  attendanceSessionGuid: string | null
  timetableGuid: string
  lecturerEmployeeGuid: string
  sessionDate: string
  isSkipped: boolean
  skipReason: number | null
  outlines: { courseUnitGuid: string; batchGuid: string; semesterGuid: string; outlineTlGuid: string }[]
  studentRecords: { studentGuid: string; isPresent: boolean }[]
}

export interface AttendanceSessionListItem {
  attendanceSessionGuid: string
  timetableGuid: string
  sessionDate: string
  startTime: string
  endTime: string
  status: number
  isAutomated: boolean
  isSkipped: boolean
  skipReason: number | null
}

export interface PagedSessions {
  items: AttendanceSessionListItem[]
  totalCount: number
  page: number
  pageSize: number
}

// A timetable slot as the screens need it (course unit, batch, lecturer,
// weekday, time, term dates). Stand-in for the timetable source.
export interface AttendanceTimetable {
  timetableGuid: string
  courseUnitGuid: string
  courseUnitCode: string
  courseUnitName: string
  batchGuid: string
  batchCode: string
  semesterGuid: string
  lecturerEmployeeGuid: string
  lecturerName: string
  dayCode: string
  dayName: string
  startTime: string
  endTime: string
  term: number
  termStart: string
  termEnd: string
}

// ── Date helpers (local time) ──
const DAY_INDEX: Record<string, number> = { SUN: 0, MON: 1, TUE: 2, WED: 3, THU: 4, FRI: 5, SAT: 6 }

export function toYmd(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function parseYmd(ymd: string) {
  const [y, m, d] = ymd.slice(0, 10).split('-').map(Number)
  return new Date(y, (m ?? 1) - 1, d ?? 1)
}

export function todayYmd() {
  return toYmd(new Date())
}

// The most recent date on or before `from` that falls on `dayCode`.
export function lastOccurrence(dayCode: string, from = todayYmd()) {
  const d = parseYmd(from)
  const target = DAY_INDEX[dayCode.toUpperCase()] ?? d.getDay()
  d.setDate(d.getDate() - ((d.getDay() - target + 7) % 7))
  return toYmd(d)
}

function shift(ymd: string, days: number) {
  const d = parseYmd(ymd)
  d.setDate(d.getDate() + days)
  return toYmd(d)
}

function isOffDay(t: AttendanceTimetable, ymd: string) {
  return parseYmd(ymd).getDay() !== DAY_INDEX[t.dayCode]
}

export function isBeforeStart(ymd: string, startTime: string) {
  if (ymd !== todayYmd()) return false
  const [h, m] = startTime.split(':').map(Number)
  const now = new Date()
  return now.getHours() * 60 + now.getMinutes() < h * 60 + (m || 0)
}

// ── Mock store ──
const TODAY = todayYmd()
const TERM_START = shift(TODAY, -70)
const TERM_END = shift(TODAY, 40)

const TIMETABLES: AttendanceTimetable[] = [
  { timetableGuid: 'tt-1', courseUnitGuid: 'cu-dbs301', courseUnitCode: 'DBS301', courseUnitName: 'Database Systems', batchGuid: 'b-bsit24a', batchCode: 'BSIT-2024-A', semesterGuid: 'sem-3', lecturerEmployeeGuid: 'emp-1', lecturerName: 'Dr. John Mukasa', dayCode: 'MON', dayName: 'Monday', startTime: '08:00:00', endTime: '10:00:00', term: 1, termStart: TERM_START, termEnd: TERM_END },
  { timetableGuid: 'tt-2', courseUnitGuid: 'cu-net204', courseUnitCode: 'NET204', courseUnitName: 'Computer Networks', batchGuid: 'b-bscs24a', batchCode: 'BSCS-2024-A', semesterGuid: 'sem-3', lecturerEmployeeGuid: 'emp-1', lecturerName: 'Dr. John Mukasa', dayCode: 'WED', dayName: 'Wednesday', startTime: '10:00:00', endTime: '12:00:00', term: 1, termStart: TERM_START, termEnd: TERM_END },
  { timetableGuid: 'tt-3', courseUnitGuid: 'cu-dbs301', courseUnitCode: 'DBS301', courseUnitName: 'Database Systems', batchGuid: 'b-bscs24a', batchCode: 'BSCS-2024-A', semesterGuid: 'sem-3', lecturerEmployeeGuid: 'emp-1', lecturerName: 'Dr. John Mukasa', dayCode: 'THU', dayName: 'Thursday', startTime: '14:00:00', endTime: '16:00:00', term: 1, termStart: TERM_START, termEnd: TERM_END },
]

const OUTLINES: Record<string, OutlineTopic[]> = {
  'cu-dbs301': [
    ['T01', 'Introduction to Relational Models'],
    ['T02', 'ER Diagrams and Normalisation'],
    ['T03', 'SQL Fundamentals'],
    ['T04', 'Joins and Subqueries'],
    ['T05', 'Transactions and ACID Properties'],
  ].map(([c, d], i) => ({ outlineTlGuid: `ol-dbs-${i + 1}`, outlineCode: `DBS301-${c}`, outlineDetails: d })),
  'cu-net204': [
    ['T01', 'The OSI and TCP/IP Models'],
    ['T02', 'IP Addressing and Subnetting'],
    ['T03', 'Routing Fundamentals'],
    ['T04', 'Transport Layer: TCP and UDP'],
  ].map(([c, d], i) => ({ outlineTlGuid: `ol-net-${i + 1}`, outlineCode: `NET204-${c}`, outlineDetails: d })),
}

const NAMES = ['Alice Nakamura', 'Brian Ssekandi', 'Carol Atim', 'David Mugisha', 'Esther Namuli', 'Frank Okello', 'Grace Achieng', 'Henry Kato', 'Irene Nabirye', 'James Opio', 'Joan Akello', 'Kevin Tumusiime', 'Lydia Nansubuga', 'Moses Wasswa', 'Nora Kemigisha', 'Patrick Ochieng', 'Rita Nalwoga', 'Samuel Byaruhanga', 'Teddy Auma', 'Victor Mwesigwa', 'Winnie Atuhaire', 'Yusuf Lubega', 'Zainab Nakato', 'Allan Ssempa', 'Brenda Nakimuli']
const STUDENTS: Record<string, { studentGuid: string; studentNumber: string; fullName: string }[]> = {
  'b-bsit24a': NAMES.map((fullName, i) => ({ studentGuid: `st-a-${i + 1}`, studentNumber: `2024/BIT/${String(i + 1).padStart(2, '0')}`, fullName })),
  'b-bscs24a': NAMES.slice(0, 18).map((fullName, i) => ({ studentGuid: `st-c-${i + 1}`, studentNumber: `2024/BCS/${String(i + 1).padStart(2, '0')}`, fullName })),
}

interface StoredSession extends AttendanceSession {
  attendanceSessionGuid: string
  studentRecords: { studentGuid: string; isPresent: boolean }[]
}

let seq = 1
function seedSession(t: AttendanceTimetable, weeksAgo: number, opts: Partial<StoredSession>): StoredSession {
  const date = shift(lastOccurrence(t.dayCode, shift(TODAY, -1)), -7 * weeksAgo)
  return {
    attendanceSessionGuid: `as-${seq++}`,
    timetableGuid: t.timetableGuid,
    sessionDate: date,
    startTime: t.startTime,
    endTime: t.endTime,
    status: 1,
    isAutomated: false,
    isSkipped: false,
    skipReason: null,
    isSpecialClass: false,
    outlines: [{ outlineTlGuid: OUTLINES[t.courseUnitGuid][0].outlineTlGuid }],
    studentRecords: STUDENTS[t.batchGuid].map((s, i) => ({ studentGuid: s.studentGuid, isPresent: i % 6 !== 2 })),
    ...opts,
  }
}

const SESSIONS: StoredSession[] = [
  seedSession(TIMETABLES[0], 0, { outlines: [] }),
  seedSession(TIMETABLES[0], 1, {}),
  seedSession(TIMETABLES[0], 2, { status: 3, isSkipped: true, skipReason: 1, outlines: [], studentRecords: [] }),
  seedSession(TIMETABLES[0], 3, { isAutomated: true, outlines: [] }),
  seedSession(TIMETABLES[1], 0, { isAutomated: true, outlines: [] }),
  seedSession(TIMETABLES[1], 1, {}),
  seedSession(TIMETABLES[1], 2, { status: 2, outlines: [], studentRecords: [] }),
  seedSession(TIMETABLES[2], 0, {}),
  seedSession(TIMETABLES[2], 1, { outlines: [] }),
  seedSession(TIMETABLES[2], 2, {}),
]

const delay = <T,>(v: T) => new Promise<T>(r => setTimeout(() => r(structuredClone(v)), 300))

function findTimetable(guid: string) {
  return TIMETABLES.find(t => t.timetableGuid === guid)
}

function toListItem(s: StoredSession): AttendanceSessionListItem {
  return {
    attendanceSessionGuid: s.attendanceSessionGuid, timetableGuid: s.timetableGuid, sessionDate: s.sessionDate,
    startTime: s.startTime, endTime: s.endTime, status: s.status, isAutomated: s.isAutomated, isSkipped: s.isSkipped, skipReason: s.skipReason,
  }
}

// ── Functions ──
export function getTimetables(): Promise<AttendanceTimetable[]> {
  return delay(TIMETABLES)
}

export function getAttendanceBatches(): Promise<{ value: string; label: string }[]> {
  return delay([...new Map(TIMETABLES.map(t => [t.batchGuid, { value: t.batchGuid, label: t.batchCode }])).values()])
}

export function getAttendanceCourseUnits(): Promise<{ value: string; label: string }[]> {
  return delay([...new Map(TIMETABLES.map(t => [t.courseUnitGuid, { value: t.courseUnitGuid, label: `${t.courseUnitName} (${t.courseUnitCode})` }])).values()])
}

// A date with nothing recorded yet comes back as a Scheduled session with
// no guid.
export function getSessionByTimetableDate(timetableGuid: string, date: string): Promise<AttendanceSession | null> {
  const t = findTimetable(timetableGuid)
  if (!t) return delay(null)
  const s = SESSIONS.find(x => x.timetableGuid === timetableGuid && x.sessionDate === date)
  if (s) {
    const { studentRecords: _records, ...session } = s
    return delay(session)
  }
  return delay({
    attendanceSessionGuid: null, timetableGuid, sessionDate: date, startTime: t.startTime, endTime: t.endTime,
    status: 0, isAutomated: false, isSkipped: false, skipReason: null, isSpecialClass: isOffDay(t, date), outlines: [],
  })
}

export function getSessionByGuid(guid: string): Promise<AttendanceSessionListItem | null> {
  const s = SESSIONS.find(x => x.attendanceSessionGuid === guid)
  return delay(s ? toListItem(s) : null)
}

// Saved records when a session exists, otherwise the batch's eligible
// students (all present by default).
export function getSessionStudents(timetableGuid: string, date: string): Promise<AttendanceStudent[]> {
  const t = findTimetable(timetableGuid)
  if (!t) return delay([])
  const s = SESSIONS.find(x => x.timetableGuid === timetableGuid && x.sessionDate === date)
  const saved = new Map((s?.studentRecords ?? []).map(r => [r.studentGuid, r.isPresent]))
  return delay(STUDENTS[t.batchGuid].map(st => ({ ...st, isPresent: saved.size ? !!saved.get(st.studentGuid) : true })))
}

export function getOutlinesByUnit(courseUnitGuid: string): Promise<OutlineTopic[]> {
  return delay(OUTLINES[courseUnitGuid] ?? [])
}

export function getPendingOutlineSessions(timetableGuid: string): Promise<PendingOutlineSession[]> {
  return delay(
    SESSIONS
      .filter(s => s.timetableGuid === timetableGuid && s.status === 1 && s.outlines.length === 0)
      .sort((a, b) => b.sessionDate.localeCompare(a.sessionDate))
      .map(s => ({ attendanceSessionGuid: s.attendanceSessionGuid, sessionDate: s.sessionDate, startTime: s.startTime, endTime: s.endTime })),
  )
}

export function getAttendanceSessions(page: number, pageSize: number, f: { batchGuid?: string; courseUnitGuid?: string } = {}): Promise<PagedSessions> {
  const rows = SESSIONS
    .filter(s => {
      const t = findTimetable(s.timetableGuid)
      return (!f.batchGuid || t?.batchGuid === f.batchGuid) && (!f.courseUnitGuid || t?.courseUnitGuid === f.courseUnitGuid)
    })
    .sort((a, b) => b.sessionDate.localeCompare(a.sessionDate))
  return delay({ items: rows.slice((page - 1) * pageSize, page * pageSize).map(toListItem), totalCount: rows.length, page, pageSize })
}

// Mirrors the backend's validation rules and messages (spec table).
export function recordAttendance(input: RecordAttendanceInput): Promise<AttendanceSession> {
  const t = findTimetable(input.timetableGuid)
  const errors: string[] = []
  if (!t) errors.push('Timetable not found.')
  else {
    if (input.sessionDate > todayYmd()) errors.push('Cannot record attendance for a future date.')
    else if (isBeforeStart(input.sessionDate, t.startTime)) errors.push(`Cannot record attendance before the class start time (${t.startTime.slice(0, 5)}).`)
    if (input.sessionDate < t.termStart || input.sessionDate > t.termEnd) errors.push(`Date is outside term ${t.term} dates (${t.termStart} – ${t.termEnd}).`)
  }
  if (input.isSkipped && !input.skipReason) errors.push('Skip reason is required when skipping a class.')
  if (!input.isSkipped && input.outlines.length === 0) errors.push('Please select at least one outline topic.')
  if (errors.length) return new Promise((_, reject) => setTimeout(() => reject(Object.assign(new Error(errors[0]), { errors })), 300))

  let s = SESSIONS.find(x => x.attendanceSessionGuid === input.attendanceSessionGuid)
    ?? SESSIONS.find(x => x.timetableGuid === input.timetableGuid && x.sessionDate === input.sessionDate)
  if (!s) {
    s = {
      attendanceSessionGuid: `as-${seq++}`, timetableGuid: input.timetableGuid, sessionDate: input.sessionDate,
      startTime: t!.startTime, endTime: t!.endTime, status: 0, isAutomated: false, isSkipped: false, skipReason: null,
      isSpecialClass: isOffDay(t!, input.sessionDate), outlines: [], studentRecords: [],
    }
    SESSIONS.push(s)
  }
  s.isSkipped = input.isSkipped
  s.skipReason = input.isSkipped ? input.skipReason : null
  s.status = input.isSkipped ? 3 : 1
  s.outlines = [...new Set(input.outlines.map(o => o.outlineTlGuid))].map(outlineTlGuid => ({ outlineTlGuid }))
  if (!s.isAutomated) s.studentRecords = input.studentRecords
  const { studentRecords: _records, ...session } = s
  return delay(session)
}

export function deleteAttendanceSession(guid: string): Promise<boolean> {
  const i = SESSIONS.findIndex(s => s.attendanceSessionGuid === guid)
  if (i !== -1) SESSIONS.splice(i, 1)
  return delay(true)
}
