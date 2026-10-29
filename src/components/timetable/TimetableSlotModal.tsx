'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { SearchSelect } from '@/components/SearchSelect'
import { useAvailableRooms, useCreateTimetable, useUpdateTimetable, TimeSlotDropdownItem } from '@/hooks/academic/useTimetable'
import type { Weekday } from '@/lib/api/academic/weekday'
import { allowedDayCodes, capacityState, shiftHint, slotName, slotRange, studentCount } from './ttShared'

// One checked batch row, carried in from the Allocation Context (Add) or
// from the entry being edited. The triple is what's saved.
export interface SlotBatch {
  courseUnitGuid: string
  courseUnitCode: string | null
  batchGuid: string
  batchCode: string
  semesterGuid: string
  studentCount: number
}

export interface SlotModalState {
  mode: 'add' | 'edit'
  timetableGuid?: string
  lecturerGuid: string
  lecturerName: string
  batchTimeGuid: string
  batchTimeName: string
  courseLabel: string
  batches: SlotBatch[]
  weekDayGuid: string
  timeSlotGuid: string
  roomGuid?: string
  roomLabel?: string
  url?: string | null
}

// Optional field, so empty is valid. Otherwise an absolute http(s) link with a
// real domain (a dot and a letters-only TLD), so "1234" or "teams" is refused.
function isValidMeetingUrl(value: string): boolean {
  const v = value.trim()
  if (!v) return true
  if (/\s/.test(v)) return false
  try {
    const u = new URL(v)
    return (u.protocol === 'https:' || u.protocol === 'http:') && /\.[a-z]{2,}$/i.test(u.hostname)
  } catch {
    return false
  }
}

// timetable-page.md → Slot modal. Weekday and Time Slot are real, editable
// fields (the API requires both), pre-filled from the clicked cell. The room
// list is the rooms free at that batch time, slot and weekday; capacity is a
// warning only. The server reports one clash per failed save.
export function TimetableSlotModal({ state, onClose, intakeGuid, term, days, slots, showToast }: {
  state: SlotModalState | null
  onClose: () => void
  intakeGuid: string
  term: number
  days: Weekday[]
  slots: TimeSlotDropdownItem[]
  showToast: (msg: string, type?: string) => void
}) {
  const [weekDayGuid, setWeekDayGuid] = useState('')
  const [timeSlotGuid, setTimeSlotGuid] = useState('')
  const [roomGuid, setRoomGuid] = useState('')
  const [url, setUrl] = useState('')
  const [urlTouched, setUrlTouched] = useState(false)
  const urlInputRef = useRef<HTMLInputElement>(null)
  const [clash, setClash] = useState<string | null>(null)

  useEffect(() => {
    if (!state) return
    setWeekDayGuid(state.weekDayGuid)
    setTimeSlotGuid(state.timeSlotGuid)
    setRoomGuid(state.roomGuid ?? '')
    setUrl(state.url ?? '')
    setUrlTouched(false)
    setClash(null)
  }, [state])

  const create = useCreateTimetable()
  const update = useUpdateTimetable()
  const saving = create.isPending || update.isPending

  const roomQuery = useAvailableRooms(state && weekDayGuid && timeSlotGuid ? {
    batchTimeGuid: state.batchTimeGuid, timeSlotGuid, weekDayGuid, intakeGuid, term,
    excludeTimetableGuid: state.mode === 'edit' ? state.timetableGuid : null,
  } : null)
  const rooms = roomQuery.data ?? []

  // Clear the room when it's no longer free at the new slot or day.
  useEffect(() => {
    if (!roomGuid || roomQuery.isFetching || !roomQuery.data) return
    if (!roomQuery.data.some(r => r.roomGuid === roomGuid)) setRoomGuid('')
  }, [roomGuid, roomQuery.data, roomQuery.isFetching])

  const allowed = allowedDayCodes(state?.batchTimeName)
  const dayOptions = useMemo(() => days
    .filter(d => !allowed || allowed.includes(d.dayCode?.toUpperCase()))
    .map(d => ({ value: d.weekDayGuid, label: d.dayName })), [days, allowed])
  const slotOptions = slots.map(s => ({ value: s.timeSlotGuid, label: `${slotName(s)} · ${slotRange(s.startTime, s.endTime, true)}` }))

  if (!state) return null

  const pax = state.batches.reduce((n, b) => n + b.studentCount, 0)
  const room = rooms.find(r => r.roomGuid === roomGuid)
  const cap = room ? capacityState(pax, room.capacity) : null
  const day = days.find(d => d.weekDayGuid === weekDayGuid)
  const slot = slots.find(s => s.timeSlotGuid === timeSlotGuid)
  // `type="url"` alone never validates here — there's no <form> submit — so
  // "1234" used to save as the meeting link. Save stays enabled; clicking it
  // with a bad link explains what's wrong on the field instead.
  const urlInvalid = !isValidMeetingUrl(url)
  const canSave = !!weekDayGuid && !!timeSlotGuid && !!roomGuid && state.batches.length > 0 && !saving

  function handleSave() {
    if (!state || !canSave) return
    if (urlInvalid) {
      setUrlTouched(true)
      urlInputRef.current?.focus()
      return
    }
    setClash(null)
    const input = {
      batchTimeGuid: state.batchTimeGuid,
      lecturerGuid: state.lecturerGuid,
      timeSlotGuid,
      weekDayGuid,
      roomGuid,
      intakeGuid,
      term,
      url: url.trim() || null,
      // One row per checked (unit, batch, semester) — never twice.
      batches: Array.from(new Map(state.batches.map(b => [`${b.courseUnitGuid}|${b.batchGuid}|${b.semesterGuid}`, { courseUnitGuid: b.courseUnitGuid, batchGuid: b.batchGuid, semesterGuid: b.semesterGuid }])).values()),
    }
    const where = `${day?.dayName ?? ''} · ${slot ? slotRange(slot.startTime, slot.endTime) : ''} · ${room?.roomCode ?? ''}`
    const onError = (err: Error) => setClash(err.message || 'Could not save this slot. Please try again.')
    if (state.mode === 'edit' && state.timetableGuid) {
      update.mutate({ guid: state.timetableGuid, input }, { onSuccess: () => { showToast(`Updated: ${where}`, 'success'); onClose() }, onError })
    } else {
      create.mutate(input, { onSuccess: () => { showToast(`Scheduled: ${state.courseLabel} · ${where}`, 'success'); onClose() }, onError })
    }
  }

  const roomPlaceholder = !weekDayGuid || !timeSlotGuid
    ? 'Pick a weekday and time slot first'
    : roomQuery.isLoading ? 'Loading free rooms…'
      : rooms.length === 0 ? 'No rooms free at this slot' : '— Select room —'

  return (
    <div className="modal-overlay open">
      <div className="modal" style={{ maxWidth: 640 }} role="dialog" aria-modal="true" aria-labelledby="tt-slot-title">
        <div className="modal-hdr">
          <div className="flex items-center gap-[10px]">
            <div style={{ width: 34, height: 34, borderRadius: 9, background: 'linear-gradient(135deg,var(--b800),var(--b500))', display: 'grid', placeItems: 'center', color: '#fff', fontSize: 15 }}>
              <i className={`lni ${state.mode === 'edit' ? 'lni-pencil' : 'lni-calendar'}`} aria-hidden="true"></i>
            </div>
            <div>
              <div className="modal-title" id="tt-slot-title">{state.mode === 'edit' ? 'Edit Scheduled Slot' : 'Schedule Slot'}</div>
              <div className="text-g400" style={{ fontSize: 'var(--fs-xs)' }}>
                {state.mode === 'edit' ? `${state.courseLabel} · ${day?.dayName ?? ''} · ${slot ? slotRange(slot.startTime, slot.endTime) : ''}` : 'Confirm the logistics to complete scheduling'}
              </div>
            </div>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close"><i className="lni lni-close"></i></button>
        </div>

        <div style={{ padding: 20 }}>
          <div className="tt-ctx-summary">
            <div className="tt-ctx-summary-title">From Allocation Context</div>
            <div className="g2" style={{ gap: '4px 18px' }}>
              <div>
                <div className="tt-ctx-kv"><span>Lecturer</span><span>{state.lecturerName}</span></div>
                <div className="tt-ctx-kv"><span>Course</span><span>{state.courseLabel}</span></div>
                <div className="tt-ctx-kv"><span>Batches</span><span>{state.batches.map(b => b.batchCode).join(', ') || 'None selected'}</span></div>
              </div>
              <div>
                <div className="tt-ctx-kv"><span>Shift</span><span>{state.batchTimeName}</span></div>
                <div className="tt-ctx-kv"><span>Students</span><span>{studentCount(pax)}</span></div>
                <div className="tt-ctx-kv"><span>Load</span><span className="text-g500" style={{ fontWeight: 600 }}>Calculated on save</span></div>
              </div>
            </div>
          </div>

          {clash && (
            <div className="tt-clash" role="alert">
              <i className="lni lni-warning" style={{ fontSize: 16, marginTop: 1 }} aria-hidden="true"></i>
              <div><strong>Couldn&apos;t save — review and try again</strong>{clash}</div>
            </div>
          )}

          <div className="g2" style={{ marginBottom: 14 }}>
            <div className="fg m-0">
              <label className="lbl">Weekday <span className="req">*</span></label>
              <SearchSelect placeholder="— Select day —" options={dayOptions} value={weekDayGuid} onChange={v => { setWeekDayGuid(v); setClash(null) }} />
            </div>
            <div className="fg m-0">
              <label className="lbl">Time Slot <span className="req">*</span></label>
              <SearchSelect placeholder="— Select time slot —" options={slotOptions} value={timeSlotGuid} onChange={v => { setTimeSlotGuid(v); setClash(null) }} />
            </div>
          </div>

          <div className="g2" style={{ marginBottom: 14 }}>
            <div className="fg m-0">
              <label className="lbl">Classroom / Lab <span className="req">*</span></label>
              <SearchSelect
                placeholder={roomPlaceholder}
                options={rooms.map(r => ({ value: r.roomGuid, label: `${r.roomCode}${r.capacity != null ? ` (Cap: ${r.capacity})` : ''}` }))}
                value={roomGuid}
                onChange={v => { setRoomGuid(v); setClash(null) }}
                disabled={!weekDayGuid || !timeSlotGuid}
                isLoading={roomQuery.isLoading}
              />
              {roomQuery.isError && <p className="field-err" style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>Couldn&apos;t load free rooms.</p>}
            </div>
            <div className="fg m-0">
              <label className="lbl">Capacity Status</label>
              <div className={`tt-cap${cap ? ` ${cap}` : ''}`} aria-live="polite">
                {!room ? <span>Pick a room to check</span>
                  : !cap ? <><span>No capacity recorded</span><span>{studentCount(pax)}</span></>
                    : <><span>{cap === 'over' ? 'Over capacity' : cap === 'near' ? 'Near capacity' : 'Fits'}</span><span>{pax} / {room.capacity}</span></>}
              </div>
              {cap === 'over' && <p className="text-g500" style={{ fontSize: 'var(--fs-xs)', marginTop: 4 }}>Warning only — the slot can still be saved.</p>}
            </div>
          </div>

          <div className="fg">
            <label className="lbl">Online URL <span className="text-g400" style={{ textTransform: 'none', letterSpacing: 0, fontWeight: 400 }}>(optional)</span></label>
            <input
              ref={urlInputRef}
              className="ctrl"
              type="url"
              inputMode="url"
              placeholder="https://teams.microsoft.com/…"
              value={url}
              onChange={e => setUrl(e.target.value)}
              onBlur={() => setUrlTouched(true)}
              aria-invalid={urlTouched && urlInvalid}
              aria-describedby={urlTouched && urlInvalid ? 'tt-url-err' : undefined}
              style={urlTouched && urlInvalid ? { borderColor: 'var(--red)' } : undefined}
            />
            {urlTouched && urlInvalid && (
              <p id="tt-url-err" role="alert" className="field-err" style={{ color: 'var(--red)', fontSize: 12, marginTop: 4, display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                <i className="lni lni-warning" aria-hidden="true" style={{ marginTop: 2 }}></i>
                <span>
                  That doesn&apos;t look like a valid link. Paste the full meeting link, starting with https://
                  (e.g. https://teams.microsoft.com/l/meetup-join/…), or leave this field empty.
                </span>
              </p>
            )}
          </div>

          <div className="tt-repeat">
            <label className="lbl">Repeat Schedule</label>
            <div className="tt-repeat-chips">
              <span className="tt-chip selected" aria-current="true">Every week (whole term)</span>
              <button type="button" className="tt-chip" disabled title="Not available yet — every entry repeats weekly for the term">Once only</button>
              <button type="button" className="tt-chip" disabled title="Not available yet">Copy to another day</button>
              <button type="button" className="tt-chip" disabled title="Not available yet — entries have no week numbers">Custom weeks…</button>
            </div>
          </div>
        </div>

        <div className="modal-footer" style={{ justifyContent: 'space-between', background: 'var(--g100)' }}>
          <div className="text-g400" style={{ fontSize: 'var(--fs-sm)' }}>Shift rule: {state.batchTimeName} · {shiftHint(state.batchTimeName)}</div>
          <div className="flex gap-2">
            <button type="button" className="btn btn-neu btn-sm" onClick={onClose} disabled={saving}>Cancel</button>
            <button type="button" className="btn btn-primary btn-sm" onClick={handleSave} disabled={!canSave}>
              <i className="lni lni-checkmark-circle"></i> {saving ? 'Saving…' : state.mode === 'edit' ? 'Update Schedule' : 'Confirm Schedule'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
