'use client'
import { SESSION_STATUS_META, parseYmd, type AttendanceTimetable } from '@/lib/api/attendance/classAttendance'

// Shared by the three Class Attendance screens.

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// "2026-10-28" → "28 Oct 2026"
export function fmtDate(ymd: string | null | undefined) {
  if (!ymd) return '—'
  const d = parseYmd(ymd)
  if (isNaN(d.getTime())) return ymd
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

// "08:00:00" → "08:00"
export function fmtTime(t: string | null | undefined) {
  return t ? t.slice(0, 5) : '—'
}

export function timetableLabel(t: AttendanceTimetable) {
  return `${t.courseUnitName} (${t.courseUnitCode}) · ${t.batchCode} · ${t.dayName.slice(0, 3)} ${fmtTime(t.startTime)}–${fmtTime(t.endTime)}`
}

// Status badge: Scheduled blue, Completed green, Cancelled grey, Skipped orange.
export function StatusBadge({ status }: { status: number }) {
  const meta = SESSION_STATUS_META[status] ?? SESSION_STATUS_META[0]
  return <span className={`badge ${meta.badge}`}><span className="att-badge-dot" aria-hidden="true" />{meta.label}</span>
}

// "Biometric" / "Manual" chip.
export function TypeChip({ automated }: { automated: boolean }) {
  return automated
    ? <span className="pill pill-purple"><i className="lni lni-id-card" aria-hidden="true"></i> Biometric</span>
    : <span className="pill pill-blue"><i className="lni lni-pencil" aria-hidden="true"></i> Manual</span>
}
