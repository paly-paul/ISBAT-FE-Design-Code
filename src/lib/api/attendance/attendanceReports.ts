import { apiGet, apiGetBlob } from '../client'
import { downloadBlob } from '../../downloadBlob'
import { getIntakesDropdown } from '../academic/intake'
import { getTimetableByLecturer, getTimetableCourseUnits, getTimetableLecturers } from '../academic/timetable'
import { getStudentByGuid } from '../student/student'
import { getTimetables, lastOccurrence, todayYmd, type AttendanceTimetable } from './classAttendance'

// Attendance Reports (attendance-report-pages-design.md, 2026-10-28), wired
// to erp-docs/api/assessment-attendance-service/attendance/reports/:
//   GET /api/v1/attendance/reports/by-date/preview      + /by-date/pdf
//   GET /api/v1/attendance/reports/student-pct/preview  + /student-pct/pdf
//   GET /api/v1/attendance/reports/faculty-pct/preview  + /faculty-pct/pdf
// All need permission assessment.attendancereport.get (403 `forbidden`
// otherwise); each PDF answers 404 `not_found` when nothing matches.
//
// The report pages (erp-docs/pages/assessment/*-report-page.md) leave the
// filter dropdowns to "existing dropdowns", and have the page resolve the
// student / lecturer / course-unit GUIDs the student-pct and faculty-pct
// previews return. Those come from the academic timetable endpoints and the
// student lookup below. NEXT_PUBLIC_AUTH_MOCK keeps everything on the
// in-memory mock further down, which returns names inline.
const MOCK_AUTH = process.env.NEXT_PUBLIC_AUTH_MOCK === 'true'

function query(params: Record<string, string | number | boolean | null | undefined>) {
  const qs = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) if (v !== null && v !== undefined && v !== '') qs.set(k, String(v))
  return qs.toString()
}

// ── Filter sources ──────────────────────────────────────────────────────

export interface ReportOption { value: string; label: string }

export interface ReportCourseUnitOption extends ReportOption {
  code: string
  name: string
}

// A timetable slot as Attendance by Date shows it (dropdown label and the
// report's context strip).
export interface ReportTimetable {
  timetableGuid: string
  courseUnitCode: string
  courseUnitName: string
  batchCode: string
  dayName: string
  startTime: string
  endTime: string
  lecturerName: string
}

export async function getReportIntakes(): Promise<ReportOption[]> {
  if (MOCK_AUTH) return delay(INTAKES.map(({ value, label }) => ({ value, label })), 300)
  const intakes = await getIntakesDropdown()
  return [...intakes]
    .sort((a, b) => b.intakeCode - a.intakeCode)
    .map(i => ({ value: i.intakeGuid, label: i.description ? `${i.description} (${i.intakeCode})` : String(i.intakeCode) }))
}

// No terms endpoint exists; the timetable works in Term 1 and Term 2.
export async function getReportTerms(intakeGuid: string): Promise<ReportOption[]> {
  const terms = MOCK_AUTH ? (INTAKES.find(i => i.value === intakeGuid)?.terms ?? []) : [1, 2]
  return delay(terms.map(t => ({ value: String(t), label: `Term ${t}` })), MOCK_AUTH ? 350 : 0)
}

// GET /academic/timetables/lecturers — lecturers timetabled in the term.
export async function getReportLecturers(intakeGuid: string, term: number): Promise<ReportOption[]> {
  if (MOCK_AUTH) return delay(LECTURERS, 350)
  const list = await getTimetableLecturers(intakeGuid, term)
  return list
    .map(l => ({ value: l.employeeGuid, label: l.empName ?? 'Unnamed lecturer' }))
    .sort((a, b) => a.label.localeCompare(b.label))
}

// GET /academic/timetables/course-units requires a lecturer (lecturerGuid is
// a non-optional binding), so units are listed per lecturer.
export async function getReportCourseUnits(intakeGuid: string, term: number, lecturerGuid: string): Promise<ReportCourseUnitOption[]> {
  if (MOCK_AUTH) {
    return delay(UNITS.filter(u => u.lecturer === lecturerGuid).map(u => ({ value: u.guid, label: `${u.code} ${u.name}`, code: u.code, name: u.name })), 350)
  }
  const units = await getTimetableCourseUnits(intakeGuid, term, lecturerGuid)
  return units.map(u => ({
    value: u.courseUnitGuid,
    label: [u.courseUnitCode, u.courseUnitName].filter(Boolean).join(' ') || 'Unnamed unit',
    code: u.courseUnitCode ?? '—',
    name: u.courseUnitName ?? '—',
  }))
}

// A lecturer's timetable slots for the term (GET /academic/timetables/by-
// lecturer) — no endpoint lists every timetable at once.
export async function getReportTimetables(intakeGuid: string, term: number, lecturerGuid: string): Promise<ReportTimetable[]> {
  if (MOCK_AUTH) {
    const lecturer = LECTURERS.find(l => l.value === lecturerGuid)?.label ?? ''
    return (await getTimetables())
      .filter(t => t.lecturerEmployeeGuid === lecturerGuid)
      .map(t => ({ timetableGuid: t.timetableGuid, courseUnitCode: t.courseUnitCode, courseUnitName: t.courseUnitName, batchCode: t.batchCode, dayName: t.dayName, startTime: t.startTime, endTime: t.endTime, lecturerName: lecturer || t.lecturerName }))
  }
  const res = await getTimetableByLecturer(lecturerGuid, intakeGuid, term)
  const join = (vals: (string | null)[]) => Array.from(new Set(vals.filter(Boolean))).join(' / ')
  return (res.entries ?? [])
    .map(e => ({
      timetableGuid: e.timetableGuid,
      courseUnitCode: join(e.batches.map(b => b.courseUnitCode)) || '—',
      courseUnitName: join(e.batches.map(b => b.courseUnitName)) || '—',
      batchCode: Array.from(new Set(e.batches.map(b => b.batchCode))).join(' + ') || '—',
      dayName: e.dayName,
      startTime: e.startTime,
      endTime: e.endTime,
      lecturerName: e.lecturerName ?? '—',
    }))
    .sort((a, b) => a.courseUnitCode.localeCompare(b.courseUnitCode) || a.dayName.localeCompare(b.dayName))
}

// The student-pct preview returns studentGuid only. Resolved per row through
// the existing student lookup (GET /students/{guid}); a failed lookup maps to
// null so the page can fall back to the GUID.
export interface ReportStudent { studentNumber: string; fullName: string; batchCode: string }

export async function getReportStudent(studentGuid: string): Promise<ReportStudent> {
  const s = await getStudentByGuid(studentGuid)
  return { studentNumber: s.studentNum || s.studentRegNo || '—', fullName: s.studentName || '—', batchCode: s.batchCode || '—' }
}

// Download a report PDF. Mock mode has no file; the page says so instead.
async function downloadPdf(path: string, fallbackName: string): Promise<{ mock: boolean }> {
  if (MOCK_AUTH) return delay({ mock: true }, 900)
  const { blob, filename } = await apiGetBlob(path)
  downloadBlob(blob, filename ?? fallbackName)
  return { mock: false }
}

export interface AttendanceByDateFilters {
  timetableGuid: string
  fromDate: string | null
  toDate: string | null
}

export interface AttendanceByDateRow {
  attendanceSessionGuid: string
  sessionDate: string
  startTime: string
  endTime: string
  status: number
  isSkipped: boolean
  skipReason: number | null
  isSpecialClass: boolean
  totalStudents: number | null
  presentCount: number | null
  absentCount: number | null
  attendancePct: number | null
}

// The API's summary has the first four; cancelled / upcoming are mock-only.
export interface AttendanceByDateSummary {
  totalSessions: number
  conductedSessions: number
  skippedSessions: number
  overallAttendancePct: number | null
  cancelledSessions?: number
  upcomingSessions?: number
}

export interface AttendanceByDatePreview {
  items: AttendanceByDateRow[]
  totalCount: number
  pageNumber: number
  pageSize: number
  summary: AttendanceByDateSummary | null
}

// Student attendance below this is flagged (spec: Shared Design Tokens).
export const STUDENT_ATTENDANCE_TARGET = 75

const BATCH_SIZE: Record<string, number> = { 'b-bsit24a': 25, 'b-bscs24a': 18 }

function shift(ymd: string, days: number) {
  const [y, m, d] = ymd.split('-').map(Number)
  const dt = new Date(y, m - 1, d + days)
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`
}

// One timetable's term: a session every week on its weekday, from term
// start to term end. Past weeks are recorded (a couple skipped, one
// cancelled, one makeup class); future weeks are still Scheduled.
function termSessions(t: AttendanceTimetable): AttendanceByDateRow[] {
  const today = todayYmd()
  const size = BATCH_SIZE[t.batchGuid] ?? 20
  const seed = t.timetableGuid.length + t.startTime.charCodeAt(1)
  const first = lastOccurrence(t.dayCode, shift(t.termStart, 6))
  const rows: AttendanceByDateRow[] = []

  for (let i = 0, date = first; date <= t.termEnd; i++, date = shift(date, 7)) {
    const past = date < today
    const base = { attendanceSessionGuid: `rpt-${t.timetableGuid}-${i}`, sessionDate: date, startTime: t.startTime, endTime: t.endTime, isSpecialClass: false }
    if (!past) {
      rows.push({ ...base, status: 0, isSkipped: false, skipReason: null, totalStudents: null, presentCount: null, absentCount: null, attendancePct: null })
    } else if (i === 2 || i === 7) {
      rows.push({ ...base, status: 3, isSkipped: true, skipReason: i === 2 ? 1 : 2, totalStudents: null, presentCount: null, absentCount: null, attendancePct: null })
    } else if (i === 5) {
      rows.push({ ...base, status: 2, isSkipped: false, skipReason: null, totalStudents: null, presentCount: null, absentCount: null, attendancePct: null })
    } else {
      // Mostly 80–96%, with the odd poorly attended week below target.
      const absent = i === 4 || i === 9 ? Math.round(size * 0.32) : (i * 7 + seed) % Math.max(2, Math.round(size * 0.2))
      rows.push(attendanceRow(base, size, absent))
    }
  }

  // A makeup class two days after the cancelled week, outside the timetable's
  // own weekday.
  const cancelled = rows.find(r => r.status === 2)
  if (cancelled) {
    const makeup = shift(cancelled.sessionDate, 2)
    if (makeup < today) {
      rows.push(attendanceRow(
        { attendanceSessionGuid: `rpt-${t.timetableGuid}-mk`, sessionDate: makeup, startTime: '14:00:00', endTime: '16:00:00', isSpecialClass: true },
        size,
        Math.round(size * 0.12),
      ))
    }
  }

  return rows.sort((a, b) => a.sessionDate.localeCompare(b.sessionDate))
}

function attendanceRow(base: Pick<AttendanceByDateRow, 'attendanceSessionGuid' | 'sessionDate' | 'startTime' | 'endTime' | 'isSpecialClass'>, size: number, absent: number): AttendanceByDateRow {
  const present = size - absent
  return {
    ...base, status: 1, isSkipped: false, skipReason: null,
    totalStudents: size, presentCount: present, absentCount: absent,
    attendancePct: Math.round((present / size) * 1000) / 10,
  }
}

function summarise(rows: AttendanceByDateRow[]): AttendanceByDateSummary {
  const conducted = rows.filter(r => r.status === 1)
  const total = conducted.reduce((n, r) => n + (r.totalStudents ?? 0), 0)
  const present = conducted.reduce((n, r) => n + (r.presentCount ?? 0), 0)
  return {
    totalSessions: rows.length,
    conductedSessions: conducted.length,
    skippedSessions: rows.filter(r => r.status === 3).length,
    cancelledSessions: rows.filter(r => r.status === 2).length,
    upcomingSessions: rows.filter(r => r.status === 0).length,
    overallAttendancePct: total ? Math.round((present / total) * 1000) / 10 : null,
  }
}

const delay = <T,>(v: T, ms = 650) => new Promise<T>(r => setTimeout(() => r(structuredClone(v)), ms))

// get-attendance-by-date-preview.md. `status` comes back as text and
// sessionId as an int; mapped to the app's status codes (StatusBadge) and a
// string key. Counts only mean something for a Completed session, so the
// others show dashes instead of the API's zeros.
const STATUS_CODE: Record<string, number> = { Scheduled: 0, Completed: 1, Cancelled: 2, Skipped: 3 }

interface AttendanceByDateDto {
  items: {
    sessionId: number
    sessionDate: string
    startTime: string
    endTime: string
    isSkipped: boolean
    skipReason: number | null
    isSpecialClass: boolean
    status: string
    totalStudents: number
    presentCount: number
    absentCount: number
    attendancePct: number
  }[] | null
  totalCount: number
  pageNumber: number
  pageSize: number
  summary: { totalSessions: number; conductedSessions: number; skippedSessions: number; overallAttendancePct: number } | null
}

export async function getAttendanceByDatePreview(
  filters: AttendanceByDateFilters,
  pageNumber: number,
  pageSize: number,
  includeSummary: boolean,
): Promise<AttendanceByDatePreview> {
  if (MOCK_AUTH) return mockByDatePreview(filters, pageNumber, pageSize, includeSummary)
  const d = await apiGet<AttendanceByDateDto>(`/api/v1/attendance/reports/by-date/preview?${query({ ...filters, pageNumber, pageSize, includeSummary })}`)
  return {
    items: (d.items ?? []).map(r => {
      const status = r.isSkipped ? 3 : STATUS_CODE[r.status] ?? 0
      const done = status === 1
      return {
        attendanceSessionGuid: String(r.sessionId),
        sessionDate: r.sessionDate,
        startTime: r.startTime,
        endTime: r.endTime,
        status,
        isSkipped: r.isSkipped,
        skipReason: r.skipReason,
        isSpecialClass: r.isSpecialClass,
        totalStudents: done ? r.totalStudents : null,
        presentCount: done ? r.presentCount : null,
        absentCount: done ? r.absentCount : null,
        attendancePct: done ? r.attendancePct : null,
      }
    }),
    totalCount: d.totalCount,
    pageNumber: d.pageNumber,
    pageSize: d.pageSize,
    summary: d.summary
      ? { ...d.summary, overallAttendancePct: d.summary.conductedSessions ? d.summary.overallAttendancePct : null }
      : null,
  }
}

async function mockByDatePreview(
  filters: AttendanceByDateFilters,
  pageNumber: number,
  pageSize: number,
  includeSummary: boolean,
): Promise<AttendanceByDatePreview> {
  const timetable = (await getTimetables()).find(t => t.timetableGuid === filters.timetableGuid)
  if (!timetable) throw new Error('Timetable not found')
  const rows = termSessions(timetable).filter(r =>
    (!filters.fromDate || r.sessionDate >= filters.fromDate) && (!filters.toDate || r.sessionDate <= filters.toDate))
  return delay({
    items: rows.slice((pageNumber - 1) * pageSize, pageNumber * pageSize),
    totalCount: rows.length,
    pageNumber,
    pageSize,
    summary: includeSummary ? summarise(rows) : null,
  })
}

// get-attendance-by-date-pdf.md: every matching session, no pagination.
export function downloadAttendanceByDatePdf(filters: AttendanceByDateFilters): Promise<{ mock: boolean }> {
  return downloadPdf(`/api/v1/attendance/reports/by-date/pdf?${query({ ...filters })}`, 'attendance-by-date.pdf')
}

// ── Student Attendance % (Page 2) ───────────────────────────────────────
// get-student-attendance-pct-preview.md returns studentGuid only (names are
// resolved server-side just for the PDF), and no summary block. The page
// resolves each row through getReportStudent; the mock fills the names in.

export interface StudentPctFilters {
  intakeGuid: string
  term: number
  lecturerEmployeeGuid: string | null
  courseUnitGuid: string | null
}

export interface StudentPctRow {
  studentGuid: string
  studentNumber: string | null
  fullName: string | null
  batchCode: string | null
  totalSessions: number
  presentCount: number
  absentCount: number
  attendancePct: number
}

export interface StudentPctSummary {
  studentCount: number
  averageAttendancePct: number | null
  belowTargetCount: number
  atOrAboveTargetCount: number
}

export interface StudentPctPreview {
  items: StudentPctRow[]
  totalCount: number
  pageNumber: number
  pageSize: number
  summary: StudentPctSummary | null
}

// ── Mock filter data (NEXT_PUBLIC_AUTH_MOCK) ──
const INTAKES: (ReportOption & { terms: number[] })[] = [
  { value: 'in-20261', label: 'Spring 2026 (20261)', terms: [1, 2] },
  { value: 'in-20253', label: 'Autumn 2025 (20253)', terms: [1, 2, 3] },
  { value: 'in-20252', label: 'Summer 2025 (20252)', terms: [1, 2, 3] },
]

const LECTURERS: ReportOption[] = [
  { value: 'emp-1', label: 'Dr. John Mukasa' },
  { value: 'emp-2', label: 'Ms. Sarah Nambi' },
  { value: 'emp-3', label: 'Mr. Brian Ssali' },
  { value: 'emp-4', label: 'Dr. Alice Okello' },
]

const UNITS = [
  { guid: 'cu-dbs301', code: 'DBS301', name: 'Database Systems', lecturer: 'emp-1', sessions: 14 },
  { guid: 'cu-net204', code: 'NET204', name: 'Computer Networks', lecturer: 'emp-1', sessions: 12 },
  { guid: 'cu-sen210', code: 'SEN210', name: 'Software Engineering', lecturer: 'emp-2', sessions: 13 },
  { guid: 'cu-mth101', code: 'MTH101', name: 'Calculus I', lecturer: 'emp-3', sessions: 15 },
  { guid: 'cu-sta202', code: 'STA202', name: 'Probability and Statistics', lecturer: 'emp-3', sessions: 11 },
  { guid: 'cu-cs101', code: 'CS101', name: 'Introduction to Programming', lecturer: 'emp-4', sessions: 14 },
  { guid: 'cu-cs201', code: 'CS201', name: 'Data Structures', lecturer: 'emp-4', sessions: 13 },
  { guid: 'cu-itm220', code: 'ITM220', name: 'IT Project Management', lecturer: 'emp-2', sessions: 10 },
]

const FIRST = ['Alice', 'Brian', 'Carol', 'David', 'Esther', 'Frank', 'Grace', 'Henry', 'Irene', 'James', 'Joan', 'Kevin', 'Lydia', 'Moses', 'Nora', 'Patrick', 'Rita', 'Samuel', 'Teddy', 'Victor']
const LAST = ['Nakamura', 'Ssekandi', 'Atim', 'Mugisha', 'Namuli', 'Okello', 'Achieng', 'Kato', 'Nabirye', 'Opio', 'Akello', 'Tumusiime', 'Nansubuga', 'Wasswa', 'Kemigisha', 'Ochieng', 'Nalwoga', 'Byaruhanga', 'Auma', 'Mwesigwa']

// Three batches of 40, each taking four of the units.
const BATCHES = [
  { code: 'BSIT-2024-A', prefix: 'BIT', units: ['cu-dbs301', 'cu-net204', 'cu-sen210', 'cu-cs101'] },
  { code: 'BSCS-2024-A', prefix: 'BCS', units: ['cu-net204', 'cu-sen210', 'cu-mth101', 'cu-cs201'] },
  { code: 'BSSE-2024-A', prefix: 'BSE', units: ['cu-dbs301', 'cu-mth101', 'cu-sta202', 'cu-itm220'] },
]

function hash(s: string) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return h >>> 0
}

function studentPctRows(f: StudentPctFilters): StudentPctRow[] {
  const scope = new Set(UNITS
    .filter(u => (!f.lecturerEmployeeGuid || u.lecturer === f.lecturerEmployeeGuid) && (!f.courseUnitGuid || u.guid === f.courseUnitGuid))
    .map(u => u.guid))
  const seed = `${f.intakeGuid}|${f.term}`
  const rows: StudentPctRow[] = []

  for (const b of BATCHES) {
    const units = UNITS.filter(u => b.units.includes(u.guid) && scope.has(u.guid))
    if (!units.length) continue
    for (let i = 0; i < 40; i++) {
      const guid = `st-${b.prefix}-${i + 1}`
      // About one student in eight is a chronic absentee.
      const chronic = hash(`${seed}|${guid}|c`) % 8 === 0
      let total = 0
      let present = 0
      for (const u of units) {
        const absent = chronic ? 4 + (hash(`${seed}|${guid}|${u.guid}`) % 4) : hash(`${seed}|${guid}|${u.guid}`) % 4
        total += u.sessions
        present += u.sessions - Math.min(absent, u.sessions)
      }
      rows.push({
        studentGuid: guid,
        studentNumber: `2024/${b.prefix}/${String(i + 1).padStart(3, '0')}`,
        fullName: `${FIRST[(i + b.prefix.length) % FIRST.length]} ${LAST[(i * 7 + b.code.length) % LAST.length]}`,
        batchCode: b.code,
        totalSessions: total,
        presentCount: present,
        absentCount: total - present,
        attendancePct: Math.round((present / total) * 1000) / 10,
      })
    }
  }
  return rows.sort((a, b) => (a.studentNumber ?? '').localeCompare(b.studentNumber ?? ''))
}

function summariseStudents(rows: StudentPctRow[]): StudentPctSummary {
  const total = rows.reduce((n, r) => n + r.totalSessions, 0)
  const present = rows.reduce((n, r) => n + r.presentCount, 0)
  const below = rows.filter(r => r.attendancePct < STUDENT_ATTENDANCE_TARGET).length
  return {
    studentCount: rows.length,
    averageAttendancePct: total ? Math.round((present / total) * 1000) / 10 : null,
    belowTargetCount: below,
    atOrAboveTargetCount: rows.length - below,
  }
}

interface StudentPctDto {
  items: { studentGuid: string; totalSessions: number; presentCount: number; absentCount: number; attendancePct: number }[] | null
  totalCount: number
  pageNumber: number
  pageSize: number
}

export async function getStudentPctPreview(
  filters: StudentPctFilters,
  pageNumber: number,
  pageSize: number,
  includeSummary: boolean,
): Promise<StudentPctPreview> {
  if (MOCK_AUTH) {
    const rows = studentPctRows(filters)
    return delay({
      items: rows.slice((pageNumber - 1) * pageSize, pageNumber * pageSize),
      totalCount: rows.length,
      pageNumber,
      pageSize,
      summary: includeSummary ? summariseStudents(rows) : null,
    })
  }
  const d = await apiGet<StudentPctDto>(`/api/v1/attendance/reports/student-pct/preview?${query({ ...filters, pageNumber, pageSize })}`)
  return {
    items: (d.items ?? []).map(r => ({ ...r, studentNumber: null, fullName: null, batchCode: null })),
    totalCount: d.totalCount,
    pageNumber: d.pageNumber,
    pageSize: d.pageSize,
    summary: null,
  }
}

export function downloadStudentPctPdf(filters: StudentPctFilters): Promise<{ mock: boolean }> {
  return downloadPdf(`/api/v1/attendance/reports/student-pct/pdf?${query({ ...filters })}`, 'student-attendance-percentage.pdf')
}

// ── Faculty Attendance % (Page 3) ───────────────────────────────────────
// get-faculty-attendance-pct-preview.md: one row per lecturer and course
// unit, GUIDs only, no summary block. The page resolves lecturer names from
// getReportLecturers and unit code/name from getReportCourseUnits (per
// lecturer); the mock fills them in.

// Faculty conducted-% below this is flagged (spec: Shared Design Tokens).
export const FACULTY_CONDUCTED_TARGET = 80

export interface FacultyPctFilters {
  intakeGuid: string
  term: number
  lecturerEmployeeGuid: string | null
}

export interface FacultyPctRow {
  lecturerEmployeeGuid: string
  lecturerName: string | null
  courseUnitGuid: string
  courseUnitCode: string | null
  courseUnitName: string | null
  totalScheduled: number
  totalConducted: number
  totalSkipped: number
  conductedPct: number
}

export interface FacultyPctSummary {
  lecturerCount: number
  courseUnitCount: number
  totalScheduled: number
  totalConducted: number
  totalSkipped: number
  overallConductedPct: number | null
  belowTargetUnitCount: number
}

export interface FacultyPctPreview {
  items: FacultyPctRow[]
  totalCount: number
  pageNumber: number
  pageSize: number
  summary: FacultyPctSummary | null
}

function facultyPctRows(f: FacultyPctFilters): FacultyPctRow[] {
  const seed = `${f.intakeGuid}|${f.term}`
  const lecturerName = (guid: string) => LECTURERS.find(l => l.value === guid)?.label ?? guid
  return UNITS
    .filter(u => !f.lecturerEmployeeGuid || u.lecturer === f.lecturerEmployeeGuid)
    .map(u => {
      const scheduled = u.sessions + (hash(`${seed}|${u.guid}|s`) % 4)
      // Most units lose 0–2 sessions; about one in four loses 3–5.
      const h = hash(`${seed}|${u.guid}|k`)
      const skipped = h % 4 === 0 ? 3 + (h % 3) : h % 3
      const conducted = scheduled - skipped
      return {
        lecturerEmployeeGuid: u.lecturer,
        lecturerName: lecturerName(u.lecturer),
        courseUnitGuid: u.guid,
        courseUnitCode: u.code,
        courseUnitName: u.name,
        totalScheduled: scheduled,
        totalConducted: conducted,
        totalSkipped: skipped,
        conductedPct: Math.round((conducted / scheduled) * 1000) / 10,
      }
    })
    .sort((a, b) => (a.lecturerName ?? '').localeCompare(b.lecturerName ?? '') || (a.courseUnitCode ?? '').localeCompare(b.courseUnitCode ?? ''))
}

interface FacultyPctDto {
  items: { lecturerEmployeeGuid: string; courseUnitGuid: string; totalScheduled: number; totalConducted: number; totalSkipped: number; conductedPct: number }[] | null
  totalCount: number
  pageNumber: number
  pageSize: number
}

function summariseFaculty(rows: FacultyPctRow[]): FacultyPctSummary {
  const scheduled = rows.reduce((n, r) => n + r.totalScheduled, 0)
  const conducted = rows.reduce((n, r) => n + r.totalConducted, 0)
  return {
    lecturerCount: new Set(rows.map(r => r.lecturerEmployeeGuid)).size,
    courseUnitCount: rows.length,
    totalScheduled: scheduled,
    totalConducted: conducted,
    totalSkipped: rows.reduce((n, r) => n + r.totalSkipped, 0),
    overallConductedPct: scheduled ? Math.round((conducted / scheduled) * 1000) / 10 : null,
    belowTargetUnitCount: rows.filter(r => r.conductedPct < FACULTY_CONDUCTED_TARGET).length,
  }
}

export async function getFacultyPctPreview(
  filters: FacultyPctFilters,
  pageNumber: number,
  pageSize: number,
  includeSummary: boolean,
): Promise<FacultyPctPreview> {
  if (MOCK_AUTH) {
    const rows = facultyPctRows(filters)
    return delay({
      items: rows.slice((pageNumber - 1) * pageSize, pageNumber * pageSize),
      totalCount: rows.length,
      pageNumber,
      pageSize,
      summary: includeSummary ? summariseFaculty(rows) : null,
    })
  }
  const d = await apiGet<FacultyPctDto>(`/api/v1/attendance/reports/faculty-pct/preview?${query({ ...filters, pageNumber, pageSize })}`)
  return {
    items: (d.items ?? []).map(r => ({ ...r, lecturerName: null, courseUnitCode: null, courseUnitName: null })),
    totalCount: d.totalCount,
    pageNumber: d.pageNumber,
    pageSize: d.pageSize,
    summary: null,
  }
}

export function downloadFacultyPctPdf(filters: FacultyPctFilters): Promise<{ mock: boolean }> {
  return downloadPdf(`/api/v1/attendance/reports/faculty-pct/pdf?${query({ ...filters })}`, 'faculty-attendance-percentage.pdf')
}
