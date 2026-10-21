'use client'
import { ReactNode, useMemo } from 'react'
import { useWeekdays } from '@/hooks/config/useWeekdays'
import type { TimetableEntry, TimeSlotDropdownItem } from '@/hooks/academic/useTimetable'
import type { Weekday } from '@/lib/api/academic/weekday'

// Shared by the four timetable screens (timetable-page.md / isbat_tt_v2.html).

export const TERM_OPTIONS = [
  { value: '1', label: 'Term 1' },
  { value: '2', label: 'Term 2' },
]

const DAY_ORDER = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']

// Teaching weekdays, Monday to Saturday. There is no Sunday weekday on the
// backend (timetable-page.md), so it's dropped even if the master lists one,
// as is any placeholder row ("Unknown - Not Set") without a real day code.
const TEACHING_DAYS = DAY_ORDER.filter(d => d !== 'SUN')

export function useTeachingDays() {
  const { data: weekdays = [], isLoading } = useWeekdays()
  const days = useMemo(() => weekdays
    .filter(w => TEACHING_DAYS.includes(w.dayCode?.toUpperCase()))
    .sort((a, b) => DAY_ORDER.indexOf(a.dayCode?.toUpperCase()) - DAY_ORDER.indexOf(b.dayCode?.toUpperCase())), [weekdays])
  return { days, isLoading }
}

// Shift day rules from the design: Day and Evening run Monday–Friday, Weekend
// on Saturday. The server doesn't enforce these; the UI does. Any other batch
// time (e.g. Distance) has no day restriction. Returns null for "any day".
export function allowedDayCodes(batchTimeName: string | null | undefined): string[] | null {
  const n = (batchTimeName ?? '').toLowerCase()
  if (n.includes('weekend')) return ['SAT']
  if (n.includes('day') || n.includes('evening')) return ['MON', 'TUE', 'WED', 'THU', 'FRI']
  return null
}

export function shiftHint(batchTimeName: string | null | undefined): string {
  const days = allowedDayCodes(batchTimeName)
  if (!days) return 'Any weekday'
  return days.length === 1 ? 'Saturday only' : 'Mon–Fri only'
}

export function shiftBadge(batchTimeName: string | null | undefined): string {
  const n = (batchTimeName ?? '').toLowerCase()
  if (n.includes('weekend')) return 'badge-amber'
  if (n.includes('evening')) return 'badge-purple'
  if (n.includes('day')) return 'badge-blue'
  return 'badge-grey'
}

// "09:00:00" / "09:00" → "9:00" (12-hour, no suffix) for compact headers.
export function fmtShort(t: string | null | undefined): string {
  if (!t) return ''
  const [h, m] = t.split(':').map(Number)
  if (Number.isNaN(h)) return t
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}:${String(m ?? 0).padStart(2, '0')}`
}

// "13:00" → "1:00PM", as in the design's records table.
export function fmt12(t: string | null | undefined): string {
  if (!t) return ''
  const [h] = t.split(':').map(Number)
  if (Number.isNaN(h)) return t
  return `${fmtShort(t)}${h < 12 ? 'AM' : 'PM'}`
}

export function slotRange(start: string, end: string, long = false) {
  return long ? `${fmt12(start)}–${fmt12(end)}` : `${fmtShort(start)}–${fmtShort(end)}`
}

export function slotName(s: Pick<TimeSlotDropdownItem, 'timeSlot' | 'timeSlotCode'>) {
  return `Slot ${s.timeSlot || s.timeSlotCode}`
}

// Stable card colour per course unit code, from the design's five tints.
export function cardColour(code: string | null | undefined): string {
  const s = code ?? ''
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return `c${(h % 5) + 1}`
}

export function intakeOptionLabel(i: { description?: string | null; intakeCode: number | string }) {
  return i.description ? `${i.description} (${i.intakeCode})` : String(i.intakeCode)
}

// Capacity status used by the slot modal and the audit table: over above
// 100%, near from 80%. Advisory only — the server never blocks on capacity.
export function capacityState(headCount: number, capacity: number | null | undefined): 'ok' | 'near' | 'over' | null {
  if (!capacity) return null
  if (headCount > capacity) return 'over'
  if (headCount >= capacity * 0.8) return 'near'
  return 'ok'
}

export function isOverCapacity(e: Pick<TimetableEntry, 'headCount' | 'roomCapacity'>) {
  return capacityState(e.headCount, e.roomCapacity) === 'over'
}

function entryAt(entries: TimetableEntry[], day: Weekday, slot: TimeSlotDropdownItem) {
  // Match on GUIDs; fall back to day code + start time if a view omits them.
  return entries.filter(e => e.weekDayGuid
    ? e.weekDayGuid === day.weekDayGuid && e.timeSlotGuid === slot.timeSlotGuid
    : e.dayCode === day.dayCode && e.startTime?.slice(0, 5) === slot.startTime?.slice(0, 5))
}

// ── Session card ──
export function TtCard({ code, name, metaLeft, metaRight, over, colourKey }: {
  code: string; name?: string | null; metaLeft?: ReactNode; metaRight?: ReactNode; over?: boolean; colourKey?: string | null
}) {
  return (
    <div className={`tt-card ${cardColour(colourKey ?? code)}${over ? ' over' : ''}`}>
      <div>
        <div className="tt-card-code">{code}{over && <span className="tt-mini-tag">Over Cap</span>}</div>
        {name && <div className="tt-card-name">{name}</div>}
      </div>
      {(metaLeft || metaRight) && (
        <div className="tt-card-meta">
          <span>{metaLeft}</span>
          {metaRight && <span className="tt-card-room">{metaRight}</span>}
        </div>
      )}
    </div>
  )
}

// Units of an entry as "CODE" or "CODE1 / CODE2" (tagged units), and its
// batch codes, de-duplicated.
export function entryUnits(e: TimetableEntry) {
  const codes = Array.from(new Set(e.batches.map(b => b.courseUnitCode).filter(Boolean)))
  const names = Array.from(new Set(e.batches.map(b => b.courseUnitName).filter(Boolean)))
  return { code: codes.join(' / ') || '—', name: names.join(' / ') || null }
}

export function entryBatches(e: TimetableEntry) {
  return Array.from(new Set(e.batches.map(b => b.batchCode))).join(' + ')
}

// ── Weekday × time-slot matrix ──
// Rows are weekdays, columns are time slots. Days outside `allowedDays` (the
// shift rule) render as one disabled band. `onAdd` makes empty cells
// clickable; without it they show a dash.
export function TimetableMatrix({ days, slots, entries, renderEntry, onAdd, allowedDays, offLabel, addDisabled, minWidth = 620 }: {
  days: Weekday[]
  slots: TimeSlotDropdownItem[]
  entries: TimetableEntry[]
  renderEntry: (e: TimetableEntry) => ReactNode
  onAdd?: (day: Weekday, slot: TimeSlotDropdownItem) => void
  allowedDays?: string[] | null
  offLabel?: (day: Weekday) => string
  addDisabled?: boolean
  minWidth?: number
}) {
  return (
    <div className="tt-matrix-wrap">
      <table className="tt-matrix" style={{ minWidth }}>
        <thead>
          <tr>
            <th className="tt-day-hdr" scope="col">Day</th>
            {slots.map(s => (
              <th key={s.timeSlotGuid} scope="col">
                {slotName(s)}{slots.some(o => o.batchTimeGuid !== s.batchTimeGuid) ? ` · ${s.batchTimeName}` : ''}
                <span className="tt-th-time">{slotRange(s.startTime, s.endTime)}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {days.map(day => {
            const code = day.dayCode?.toUpperCase()
            const isWeekend = code === 'SAT'
            const allowed = !allowedDays || allowedDays.includes(code)
            if (!allowed) {
              return (
                <tr key={day.weekDayGuid}>
                  <th scope="row" className={`tt-day-cell${isWeekend ? ' weekend' : ''}`} style={{ opacity: .55, fontWeight: 700, textAlign: 'left' }}>
                    {day.dayName}<span className="tt-day-note off">Not in shift</span>
                  </th>
                  <td colSpan={slots.length} className="tt-off">{offLabel ? offLabel(day) : `${day.dayName} isn't part of this shift`}</td>
                </tr>
              )
            }
            return (
              <tr key={day.weekDayGuid}>
                <th scope="row" className={`tt-day-cell${isWeekend ? ' weekend' : ''}`} style={{ textAlign: 'left' }}>
                  {day.dayName}
                  {onAdd && <span className="tt-day-note">Schedulable</span>}
                </th>
                {slots.map(slot => {
                  const here = entryAt(entries, day, slot)
                  if (here.length > 0) {
                    return <td key={slot.timeSlotGuid}>{here.map(e => <div key={e.timetableGuid} className="tt-card-wrap">{renderEntry(e)}</div>)}</td>
                  }
                  if (onAdd) {
                    return (
                      <td key={slot.timeSlotGuid}>
                        <button
                          type="button"
                          className="tt-slot-add"
                          disabled={addDisabled}
                          onClick={() => onAdd(day, slot)}
                          aria-label={`Schedule ${day.dayName}, ${slotName(slot)} ${slotRange(slot.startTime, slot.endTime)}`}
                        >
                          <i className="lni lni-plus" aria-hidden="true"></i> Add
                        </button>
                      </td>
                    )
                  }
                  return <td key={slot.timeSlotGuid} className="tt-blank">—</td>
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// Download rows as a CSV that Excel opens directly (UTF-8 BOM so names with
// accents survive). There's no export API; this runs in the browser.
export function downloadCsv(filename: string, header: string[], rows: (string | number)[][]) {
  const esc = (v: string | number) => {
    const s = String(v ?? '')
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const csv = '﻿' + [header, ...rows].map(r => r.map(esc).join(',')).join('\r\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
