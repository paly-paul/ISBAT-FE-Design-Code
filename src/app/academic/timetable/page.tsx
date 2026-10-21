'use client'
import { useEffect, useMemo, useState } from 'react'
import { SearchSelect } from '@/components/SearchSelect'
import { Toast } from '@/components/Toast'
import { EmptyState } from '@/components/EmptyState'
import { TableLoadingState } from '@/components/TableLoadingState'
import { usePagePermissions } from '@/hooks/users/usePagePermissions'
import { useIntakesDropdown } from '@/hooks/academic/useIntakes'
import { useBatchTimes } from '@/hooks/config/useBatchTimes'
import {
  useTimetableIntakes, useTimetableLecturers, useTimetableCourseUnits, useTimetableEligibleBatches,
  useTimetableByLecturer, useTimetableByRoom, useTimetableSlots, useLecturerLoad, useTimeSlots,
  useRoomDropdown, useDeleteTimetable, TimetableEntry, TimeSlotDropdownItem,
} from '@/hooks/academic/useTimetable'
import type { Weekday } from '@/lib/api/academic/weekday'
import {
  TERM_OPTIONS, useTeachingDays, allowedDayCodes, shiftHint, shiftBadge, slotRange,
  intakeOptionLabel, isOverCapacity, entryUnits, entryBatches, TimetableMatrix, TtCard,
} from '@/components/timetable/ttShared'
import { TimetableSlotModal, SlotModalState, SlotBatch } from '@/components/timetable/TimetableSlotModal'

// Schedule Timetable (timetable-page.md §1, isbat_tt_v2.html "tt-schedule").
// Set the Allocation Context on the left, then click an open cell on the
// calendar to schedule. Only the current and next intake can be edited.

const batchKey = (b: { courseUnitGuid: string; batchGuid: string; semesterGuid: string }) => `${b.courseUnitGuid}|${b.batchGuid}|${b.semesterGuid}`
const PAGE_SIZES = [{ value: '10', label: 'Show 10' }, { value: '25', label: 'Show 25' }, { value: 'all', label: 'Show all' }]

export default function SchedulePage() {
  const permissions = usePagePermissions()
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)
  function showToast(msg: string, type = '') { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }

  // ── Allocation context ──
  const { data: ttIntakes } = useTimetableIntakes()
  const { data: allIntakes = [] } = useIntakesDropdown()
  const [intakeGuid, setIntakeGuid] = useState('')
  const [term, setTerm] = useState('1')
  const [batchTimeGuid, setBatchTimeGuid] = useState('')
  const [lecturerGuid, setLecturerGuid] = useState('')
  const [courseUnitGuid, setCourseUnitGuid] = useState('')
  const [checked, setChecked] = useState<Set<string>>(new Set())
  const termNo = +term

  useEffect(() => {
    if (!intakeGuid && ttIntakes?.currentIntakeGuid) setIntakeGuid(ttIntakes.currentIntakeGuid)
  }, [intakeGuid, ttIntakes])

  // Schedule offers only the editable intakes (current + next).
  const intakeOptions = (ttIntakes?.editableIntakeGuids ?? []).map(g => {
    const i = allIntakes.find(x => x.intakeGuid === g)
    const tag = g === ttIntakes?.currentIntakeGuid ? ' · Current' : g === ttIntakes?.nextIntakeGuid ? ' · Next' : ''
    return { value: g, label: i ? `${intakeOptionLabel(i)}${tag}` : `Intake${tag}` }
  })
  const intakeName = intakeOptions.find(o => o.value === intakeGuid)?.label.replace(/ · (Current|Next)$/, '') ?? ''

  const { data: batchTimes = [] } = useBatchTimes()
  useEffect(() => {
    if (!batchTimeGuid && batchTimes.length) setBatchTimeGuid((batchTimes.find(b => /^day/i.test(b.batchTime)) ?? batchTimes[0]).batchTimeGuid)
  }, [batchTimeGuid, batchTimes])
  const batchTime = batchTimes.find(b => b.batchTimeGuid === batchTimeGuid)
  const batchTimeName = batchTime?.batchTime ?? ''

  const { data: lecturers = [], isLoading: lecturersLoading } = useTimetableLecturers(intakeGuid || null, termNo)
  const lecturer = lecturers.find(l => l.employeeGuid === lecturerGuid)
  const lecturerName = lecturer?.empName ?? (lecturerGuid ? '—' : '')
  const { data: load } = useLecturerLoad(lecturerGuid || null, intakeGuid || null, termNo)

  const { data: units = [], isLoading: unitsLoading } = useTimetableCourseUnits(intakeGuid || null, termNo, lecturerGuid || null)
  const unit = units.find(u => u.courseUnitGuid === courseUnitGuid)
  const { data: eligible = [], isLoading: eligibleLoading, isError: eligibleError, error: eligibleErr } =
    useTimetableEligibleBatches(intakeGuid || null, termNo, lecturerGuid || null, batchTimeGuid || null, courseUnitGuid || null)
  const selectedBatches: SlotBatch[] = eligible.filter(b => checked.has(batchKey(b)))
  const pax = selectedBatches.reduce((n, b) => n + b.studentCount, 0)

  // Changing a parent selection clears everything that depends on it.
  function changeIntake(v: string) { setIntakeGuid(v); setLecturerGuid(''); setCourseUnitGuid(''); setChecked(new Set()); setRoomGuid('') }
  function changeTerm(v: string) { setTerm(v); setLecturerGuid(''); setCourseUnitGuid(''); setChecked(new Set()) }
  function changeLecturer(v: string) { setLecturerGuid(v); setCourseUnitGuid(''); setChecked(new Set()) }
  function changeUnit(v: string) { setCourseUnitGuid(v); setChecked(new Set()) }
  function changeBatchTime(v: string) { setBatchTimeGuid(v); setChecked(new Set()) }
  function resetContext() { setLecturerGuid(''); setCourseUnitGuid(''); setChecked(new Set()) }
  function toggleBatch(k: string) { setChecked(prev => { const s = new Set(prev); if (s.has(k)) s.delete(k); else s.add(k); return s }) }

  const isEditable = !!intakeGuid && !!ttIntakes?.editableIntakeGuids.includes(intakeGuid)
  const contextReady = !!lecturerGuid && !!courseUnitGuid && selectedBatches.length > 0

  // ── Calendar ──
  const { days } = useTeachingDays()
  const { data: shiftSlots = [], isLoading: slotsLoading } = useTimeSlots(batchTimeGuid || null, !!batchTimeGuid)
  const [calView, setCalView] = useState<'lecturer' | 'room'>('lecturer')
  const { data: roomsAll = [] } = useRoomDropdown()
  const [roomGuid, setRoomGuid] = useState('')
  const lecturerTT = useTimetableByLecturer(lecturerGuid || null, intakeGuid || null, termNo)
  const roomTT = useTimetableByRoom(calView === 'room' ? roomGuid || null : null, intakeGuid || null, termNo)
  const calSource = calView === 'room' ? roomTT : lecturerTT
  const calEntries = (calSource.data?.entries ?? []).filter(e => e.batchTimeGuid === batchTimeGuid)
  const allowedDays = allowedDayCodes(batchTimeName)

  // ── Records + tiles ──
  const { data: allSlots = [] } = useTimetableSlots(intakeGuid || null, termNo, null, !!intakeGuid)
  const lecturerEntries = lecturerTT.data?.entries ?? []
  const overCap = lecturerEntries.filter(isOverCapacity)
  const [dismissed, setDismissed] = useState(false)
  useEffect(() => setDismissed(false), [lecturerGuid, intakeGuid, term])

  const [search, setSearch] = useState('')
  const [pageSize, setPageSize] = useState('10')
  const q = search.trim().toLowerCase()
  const records = lecturerEntries.filter(e => !q || [
    e.lecturerName, e.batchTimeName, e.dayName, e.roomCode, entryBatches(e), entryUnits(e).code,
  ].join(' ').toLowerCase().includes(q))
  const shownRecords = pageSize === 'all' ? records : records.slice(0, +pageSize)

  // ── Slot modal + delete ──
  const [modal, setModal] = useState<SlotModalState | null>(null)
  // Calendar cards confirm inline (the design's "Yes, Remove"); table rows
  // use a dialog, since their entry may not be on the calendar's shift.
  const [deleting, setDeleting] = useState<string | null>(null)
  const [rowDelete, setRowDelete] = useState<TimetableEntry | null>(null)
  const del = useDeleteTimetable()

  function openAdd(day: Weekday, slot: TimeSlotDropdownItem) {
    if (!isEditable) { showToast('This intake is view-only — pick the current or next intake to schedule.', 'error'); return }
    if (!contextReady) { showToast('Set the lecturer, course unit and at least one batch first.', 'error'); return }
    setModal({
      mode: 'add',
      lecturerGuid, lecturerName,
      batchTimeGuid, batchTimeName,
      courseLabel: unit ? `${unit.courseUnitCode ?? ''} – ${unit.courseUnitName ?? ''}` : '',
      batches: selectedBatches,
      weekDayGuid: day.weekDayGuid,
      timeSlotGuid: slot.timeSlotGuid,
      roomGuid: calView === 'room' ? roomGuid : undefined,
    })
  }

  // Edit pre-fills from the entry itself — it carries every GUID and name.
  function openEdit(e: TimetableEntry) {
    if (!isEditable) { showToast('This intake is view-only.', 'error'); return }
    const u = entryUnits(e)
    setModal({
      mode: 'edit',
      timetableGuid: e.timetableGuid,
      lecturerGuid: e.lecturerGuid,
      lecturerName: e.lecturerName ?? '—',
      batchTimeGuid: e.batchTimeGuid,
      batchTimeName: e.batchTimeName,
      courseLabel: u.name ? `${u.code} – ${u.name}` : u.code,
      batches: e.batches.map(b => ({ courseUnitGuid: b.courseUnitGuid, courseUnitCode: b.courseUnitCode, batchGuid: b.batchGuid, batchCode: b.batchCode, semesterGuid: b.semesterGuid, studentCount: b.studentCount })),
      weekDayGuid: e.weekDayGuid,
      timeSlotGuid: e.timeSlotGuid,
      roomGuid: e.roomGuid,
      url: e.url,
    })
  }

  function confirmDelete(e: TimetableEntry) {
    del.mutate(e.timetableGuid, {
      onSuccess: () => { setDeleting(null); setRowDelete(null); showToast(`Removed: ${entryUnits(e).code} · ${e.dayName} · ${slotRange(e.startTime, e.endTime)}`, 'success') },
      onError: err => showToast(err.message || 'Could not remove this slot.', 'error'),
    })
  }

  // Time slots the edit modal can move an entry to: those of its own shift.
  const { data: editSlots = [] } = useTimeSlots(modal?.batchTimeGuid ?? null, !!modal && modal.batchTimeGuid !== batchTimeGuid)
  const modalSlots = modal && modal.batchTimeGuid !== batchTimeGuid ? editSlots : shiftSlots

  function renderCard(e: TimetableEntry) {
    const u = entryUnits(e)
    const canEdit = isEditable && permissions.edit
    const canDelete = isEditable && permissions.delete
    if (deleting === e.timetableGuid) {
      return (
        <div className="tt-card-del" role="group" aria-label="Confirm removal">
          <span>Remove {u.code}<br />{e.dayName} · {slotRange(e.startTime, e.endTime)}?</span>
          <div className="tt-del-btns">
            <button type="button" className="btn btn-danger btn-xs" disabled={del.isPending} onClick={() => confirmDelete(e)}>{del.isPending ? 'Removing…' : 'Yes, Remove'}</button>
            <button type="button" className="btn btn-neu btn-xs" onClick={() => setDeleting(null)}>Cancel</button>
          </div>
        </div>
      )
    }
    return (
      <>
        {(canEdit || canDelete) && (
          <div className="tt-card-actions">
            {canEdit && <button type="button" className="tt-card-act" onClick={() => openEdit(e)} aria-label={`Edit ${u.code} on ${e.dayName}`} title="Edit"><i className="lni lni-pencil"></i></button>}
            {canDelete && <button type="button" className="tt-card-act del" onClick={() => setDeleting(e.timetableGuid)} aria-label={`Delete ${u.code} on ${e.dayName}`} title="Delete"><i className="lni lni-trash-can"></i></button>}
          </div>
        )}
        <TtCard
          code={u.code}
          name={u.name}
          over={isOverCapacity(e)}
          metaLeft={calView === 'room' ? (e.lecturerName ?? '—') : entryBatches(e)}
          metaRight={calView === 'room' ? `${e.headCount} pax` : e.roomCode}
        />
      </>
    )
  }

  const totalLoadAll = allSlots.reduce((n, s) => n + (s.load || 0), 0)
  const lecturerCount = new Set(allSlots.map(s => s.lecturerGuid).filter(Boolean)).size
  const roomName = roomsAll.find(r => r.roomGuid === roomGuid)?.roomCode

  // What the calendar body shows when it can't show a grid yet.
  let calMessage: { icon: string; text: string } | null = null
  if (!intakeGuid) calMessage = { icon: 'lni-calendar', text: 'Pick a session to see the timetable.' }
  else if (!batchTimeGuid) calMessage = { icon: 'lni-alarm-clock', text: 'Pick a batch time.' }
  else if (!slotsLoading && shiftSlots.length === 0) calMessage = { icon: 'lni-ban', text: `${batchTimeName} has no time slots configured, so it can't be scheduled yet.` }
  else if (calView === 'lecturer' && !lecturerGuid) calMessage = { icon: 'lni-user', text: 'Pick a lecturer in the Allocation Context to see their week.' }
  else if (calView === 'room' && !roomGuid) calMessage = { icon: 'lni-home', text: 'Pick a room to see its bookings.' }

  return (
    <>
      <div className="page active">
        <div className="pg-hdr">
          <div>
            <div className="pg-title">Schedule Timetable</div>
            <div className="pg-sub">Set the context in the left panel, then click any open slot on the calendar to schedule</div>
          </div>
          <div className="flex gap-2 tt-no-print">
            <button type="button" className="btn btn-neu btn-sm" disabled title="Not available yet — needs an unscheduled-lecturers API"><i className="lni lni-warning"></i> Unscheduled</button>
            <button type="button" className="btn btn-neu btn-sm" disabled title="Not available yet — needs a bulk import API"><i className="lni lni-upload"></i> Bulk Import</button>
            <button type="button" className="btn btn-primary btn-sm" onClick={() => window.print()}><i className="lni lni-printer"></i> Print</button>
          </div>
        </div>

        <div className="stats-row tt-no-print">
          <div className="stat-card">
            <div className="stat-lbl">Sessions Scheduled</div>
            <div className="stat-num">{allSlots.length}</div>
            <div className="stat-sub" style={{ color: 'var(--b700)' }}>{intakeName || '—'} · Term {term}</div>
          </div>
          <div className="stat-card [--b700:var(--green)] [--b400:#34d399]">
            <div className="stat-lbl">Rooms</div>
            <div className="stat-num">{roomsAll.length}</div>
            <div className="stat-sub" style={{ color: 'var(--green)' }}>Classrooms &amp; labs on record</div>
          </div>
          <div className="stat-card [--b700:var(--red)] [--b400:#f87171]">
            <div className="stat-lbl">Over Capacity</div>
            <div className="stat-num">{lecturerGuid ? overCap.length : '—'}</div>
            <div className="stat-sub" style={{ color: 'var(--red)' }}>{lecturerGuid ? 'Selected lecturer’s sessions' : 'Pick a lecturer to check'}</div>
          </div>
          <div className="stat-card [--b700:var(--purple)] [--b400:#a78bfa]">
            <div className="stat-lbl">Total Load Hours</div>
            <div className="stat-num">{totalLoadAll}</div>
            <div className="stat-sub" style={{ color: 'var(--purple)' }}>{lecturerCount} lecturer{lecturerCount === 1 ? '' : 's'} · Term {term}</div>
          </div>
        </div>

        {lecturerGuid && overCap.length > 0 && !dismissed && (
          <div className="tt-conflict-bar tt-no-print" role="status">
            <span className="tt-pulse-dot" aria-hidden="true"></span>
            <div style={{ flex: 1 }}>
              <strong style={{ color: 'var(--red)' }}>{overCap.length} over capacity:</strong>{' '}
              {overCap.map(e => `${e.roomCode} ${e.dayName} ${slotRange(e.startTime, e.endTime)} (${e.headCount}/${e.roomCapacity})`).join(' · ')}
            </div>
            <button type="button" className="btn btn-danger btn-xs" onClick={() => setDismissed(true)}>Dismiss</button>
          </div>
        )}

        {intakeGuid && ttIntakes && !isEditable && (
          <div className="info-box mb-4"><i className="lni lni-information"></i> This intake is outside the current and next intake, so it&apos;s view-only.</div>
        )}

        <div className="tt-scheduler">
          {/* ── Allocation Context ── */}
          <div className="tt-ctx-col">
            <div className="tt-ctx-hdr">
              <div>
                <div className="tt-ctx-title">Allocation Context</div>
                <div className={`tt-ctx-status${contextReady ? '' : ' muted'}`}>
                  <span className={`tt-pulse-dot${contextReady ? ' ok' : ''}`} style={contextReady ? undefined : { animation: 'none', background: 'var(--g300)' }} aria-hidden="true"></span>
                  {contextReady ? 'Click a slot to schedule' : 'Complete the context to schedule'}
                </div>
              </div>
              <button type="button" className="btn btn-neu btn-xs" onClick={resetContext}>Reset</button>
            </div>

            <div className="tt-ctx-body">
              <div className="tt-ctx-group">
                <div className="g2" style={{ gap: 8 }}>
                  <div className="fg">
                    <label className="lbl">Session <span className="req">*</span></label>
                    <SearchSelect placeholder="— Session —" options={intakeOptions} value={intakeGuid} onChange={changeIntake} />
                  </div>
                  <div className="fg">
                    <label className="lbl">Term <span className="req">*</span></label>
                    <SearchSelect options={TERM_OPTIONS} value={term} onChange={changeTerm} />
                  </div>
                </div>
                <div className="fg">
                  <div className="tt-ctx-row-lbl">
                    <label className="lbl">Batch Time <span className="req">*</span></label>
                    {batchTimeName && <span className={`badge ${shiftBadge(batchTimeName)}`}>{batchTimeName}</span>}
                  </div>
                  <SearchSelect placeholder="— Batch time —" options={batchTimes.map(b => ({ value: b.batchTimeGuid, label: b.batchTime }))} value={batchTimeGuid} onChange={changeBatchTime} />
                </div>
              </div>

              <div className="fg">
                <div className="tt-ctx-row-lbl">
                  <label className="lbl">Lecturer <span className="req">*</span></label>
                  {lecturerGuid && <span className="tt-load-badge"><i className="lni lni-alarm-clock" aria-hidden="true"></i>{load?.totalLoad ?? '…'} hrs this term</span>}
                </div>
                <SearchSelect
                  placeholder={!intakeGuid ? 'Pick a session first' : lecturersLoading ? 'Loading…' : lecturers.length === 0 ? 'No lecturers planned for this term' : '— Select lecturer —'}
                  options={lecturers.map(l => ({ value: l.employeeGuid, label: l.empName ?? '—' }))}
                  value={lecturerGuid}
                  onChange={changeLecturer}
                  disabled={!intakeGuid}
                  isLoading={lecturersLoading}
                />
              </div>

              <div className="g2" style={{ gap: 8, alignItems: 'end' }}>
                <div className="fg">
                  <label className="lbl">Course Unit <span className="req">*</span></label>
                  <SearchSelect
                    placeholder={!lecturerGuid ? 'Pick a lecturer' : unitsLoading ? 'Loading…' : units.length === 0 ? 'No planned units' : '— Unit —'}
                    options={units.map(u => ({ value: u.courseUnitGuid, label: `${u.courseUnitCode ?? ''} – ${u.courseUnitName ?? ''}` }))}
                    value={courseUnitGuid}
                    onChange={changeUnit}
                    disabled={!lecturerGuid}
                    isLoading={unitsLoading}
                  />
                </div>
                <div className="fg">
                  <label className="lbl">Load (hrs)</label>
                  <input className="ctrl" value="On save" readOnly aria-label="Load is calculated by the server on save" title="Calculated by the server from the units' credits" style={{ color: 'var(--g500)' }} />
                </div>
              </div>

              <div className="fg">
                <div className="tt-ctx-row-lbl">
                  <label className="lbl">Target Batches <span className="req">*</span></label>
                  <span className="text-g500" style={{ fontSize: 'var(--fs-xs)' }}><strong className="text-g900">{pax}</strong> students</span>
                </div>
                <div className="tt-batch-list">
                  {!courseUnitGuid || !batchTimeGuid ? (
                    <div className="tt-list-empty">Pick a batch time and course unit to list eligible batches.</div>
                  ) : eligibleLoading ? (
                    <div className="tt-list-empty">Loading eligible batches…</div>
                  ) : eligibleError ? (
                    <div className="tt-list-empty" style={{ color: 'var(--red)' }}>{(eligibleErr as Error)?.message || 'Could not load eligible batches.'}</div>
                  ) : eligible.length === 0 ? (
                    <div className="tt-list-empty">No eligible batches for this unit and batch time.</div>
                  ) : eligible.map(b => {
                    const k = batchKey(b)
                    return (
                      <label key={k} className="tt-batch-row">
                        <input type="checkbox" checked={checked.has(k)} onChange={() => toggleBatch(k)} />
                        <span className="tt-batch-main">
                          <span className="tt-batch-code">{b.batchCode}</span>
                          <span className="tt-batch-sub">{b.courseUnitCode ?? ''}{b.semesterName ? ` · ${b.semesterName}` : ''}</span>
                        </span>
                        <span className="tt-batch-pax">{b.studentCount} pax</span>
                      </label>
                    )
                  })}
                </div>
              </div>

              <div className="tt-unavailable" title="Needs a batch coverage API">
                <div className="tt-unavailable-title">Batch Coverage — Term {term}<i className="lni lni-lock-alt" aria-hidden="true"></i></div>
                Not available yet. Coverage (&ldquo;4 of 6 units scheduled&rdquo;) needs a coverage API.
              </div>

              <div className="tt-rule-note">
                <i className="lni lni-information" aria-hidden="true"></i>
                <span>{batchTimeName ? `${batchTimeName}: ${shiftHint(batchTimeName)} · Lecturer, batch and room clashes are checked on save` : 'Pick a batch time'}</span>
              </div>
            </div>
          </div>

          {/* ── Calendar ── */}
          <div className="tt-cal-col">
            <div className="tt-cal-hdr">
              <div className="tt-cal-who">
                {calView === 'room' ? (roomName ?? 'No room selected') : (lecturerName || 'No lecturer selected')}
                {batchTimeName && <span className={`badge ${shiftBadge(batchTimeName)}`}>{batchTimeName} · {shiftHint(batchTimeName)}</span>}
              </div>
              <div className="flex items-center gap-2 flex-wrap tt-no-print">
                {calView === 'room' && (
                  <SearchSelect className="w-44" placeholder="— Room —" options={roomsAll.map(r => ({ value: r.roomGuid, label: `${r.roomCode}${r.capacity != null ? ` (${r.capacity})` : ''}` }))} value={roomGuid} onChange={setRoomGuid} />
                )}
                <div className="tgl-group" role="tablist" aria-label="Calendar view">
                  <button type="button" role="tab" aria-selected={calView === 'lecturer'} className={`tgl-btn${calView === 'lecturer' ? ' tgl-active' : ''}`} onClick={() => setCalView('lecturer')}><i className="lni lni-user"></i> Lecturer</button>
                  <button type="button" role="tab" aria-selected={calView === 'room'} className={`tgl-btn${calView === 'room' ? ' tgl-active' : ''}`} onClick={() => setCalView('room')}><i className="lni lni-home"></i> Room</button>
                </div>
                <div className="tgl-group" role="radiogroup" aria-label="Batch time">
                  {batchTimes.map(b => (
                    <button key={b.batchTimeGuid} type="button" role="radio" aria-checked={b.batchTimeGuid === batchTimeGuid} className={`tgl-btn${b.batchTimeGuid === batchTimeGuid ? ' tgl-active' : ''}`} onClick={() => changeBatchTime(b.batchTimeGuid)}>{b.batchTime}</button>
                  ))}
                </div>
              </div>
            </div>
            <div className="tt-cal-body">
              {calMessage ? (
                <div className="tt-cal-placeholder"><i className={`lni ${calMessage.icon}`} aria-hidden="true"></i>{calMessage.text}</div>
              ) : calSource.isLoading || slotsLoading ? (
                <div className="tt-cal-placeholder"><i className="lni lni-spinner-arrow spin" aria-hidden="true"></i>Loading the week…</div>
              ) : calSource.isError ? (
                <div className="tt-cal-placeholder" style={{ color: 'var(--red)' }}><i className="lni lni-warning" aria-hidden="true"></i>{(calSource.error as Error)?.message || 'Could not load the timetable.'}</div>
              ) : (
                <TimetableMatrix
                  days={days}
                  slots={shiftSlots}
                  entries={calEntries}
                  renderEntry={renderCard}
                  onAdd={permissions.add ? openAdd : undefined}
                  addDisabled={!isEditable}
                  allowedDays={allowedDays}
                  offLabel={d => `${d.dayName} isn't available for the ${batchTimeName} shift`}
                />
              )}
            </div>
          </div>
        </div>

        {/* ── Committed records ── */}
        <div className="card">
          <div className="card-hdr">
            <div>
              <div className="card-title"><span className="ctitle-icon"><i className="lni lni-list"></i></span> Committed Schedule Records</div>
              <div className="card-sub text-g500" style={{ fontSize: 'var(--fs-sm)' }}>{lecturerGuid ? `${lecturerName} · ${intakeName} · Term ${term}` : 'Pick a lecturer to list their sessions'}</div>
            </div>
            <div className="flex gap-2 tt-no-print">
              <input className="ctrl" style={{ width: 210 }} placeholder="Search unit, batch, room…" value={search} onChange={e => setSearch(e.target.value)} aria-label="Search records" />
              <SearchSelect className="w-32" options={PAGE_SIZES} value={pageSize} onChange={setPageSize} />
            </div>
          </div>
          <div className="tbl-wrap">
            <table>
              <thead>
                <tr><th>Lecturer</th><th>Shift</th><th>Day &amp; Slot</th><th>Course · Batch</th><th>Room</th><th>Load</th><th style={{ textAlign: 'right' }} className="tt-no-print">Actions</th></tr>
              </thead>
              <tbody>
                {!lecturerGuid ? (
                  <tr><td colSpan={7} className="text-center text-g400" style={{ padding: 28 }}>Pick a lecturer in the Allocation Context to list their committed sessions.</td></tr>
                ) : lecturerTT.isLoading ? (
                  <TableLoadingState colSpan={7} />
                ) : records.length === 0 ? (
                  <EmptyState colSpan={7} hasFilters={!!q} onClearFilters={() => setSearch('')} />
                ) : shownRecords.map(e => {
                  const u = entryUnits(e)
                  return (
                    <tr key={e.timetableGuid}>
                      <td style={{ fontWeight: 600 }}>{e.lecturerName ?? '—'}</td>
                      <td><span className={`badge ${shiftBadge(e.batchTimeName)}`}>{e.batchTimeName}</span></td>
                      <td><strong>{e.dayName}</strong><br /><span className="text-g400" style={{ fontSize: 'var(--fs-xs)' }}>{slotRange(e.startTime, e.endTime, true)}</span></td>
                      <td><strong className="text-b700">{u.code}</strong><br /><span className="text-g400" style={{ fontSize: 'var(--fs-xs)' }}>{entryBatches(e)} ({e.headCount} pax)</span></td>
                      <td>{e.roomCode}{e.roomCapacity != null ? ` (${e.roomCapacity})` : ''} {isOverCapacity(e) && <span className="badge badge-red" style={{ fontSize: 9, padding: '1px 5px' }}>Over</span>}</td>
                      <td style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{e.load} hrs</td>
                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }} className="tt-no-print">
                        {permissions.edit && <button type="button" className="btn btn-neu btn-xs" disabled={!isEditable} onClick={() => openEdit(e)} aria-label={`Edit ${u.code} on ${e.dayName}`}><i className="lni lni-pencil"></i></button>}{' '}
                        {permissions.delete && <button type="button" className="btn btn-neu btn-xs" disabled={!isEditable} onClick={() => setRowDelete(e)} aria-label={`Delete ${u.code} on ${e.dayName}`}><i className="lni lni-trash-can" style={{ color: 'var(--red)' }}></i></button>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {lecturerGuid && records.length > shownRecords.length && (
            <div className="text-g500 mt-3" style={{ fontSize: 'var(--fs-xs)' }}>Showing {shownRecords.length} of {records.length} sessions</div>
          )}
        </div>
      </div>

      <TimetableSlotModal
        state={modal}
        onClose={() => setModal(null)}
        intakeGuid={intakeGuid}
        term={termNo}
        days={days}
        slots={modalSlots}
        showToast={showToast}
      />
      {rowDelete && (
        <div className="perm-delete-overlay" style={{ position: 'fixed', zIndex: 500 }}>
          <div className="perm-delete-card tab-panel-in" role="alertdialog" aria-modal="true" aria-labelledby="tt-del-title">
            <div className="perm-delete-icon"><i className="lni lni-trash-can"></i></div>
            <div className="perm-delete-title" id="tt-del-title">Remove this session?</div>
            <div className="perm-delete-sub">
              {entryUnits(rowDelete).code} · {rowDelete.dayName} {slotRange(rowDelete.startTime, rowDelete.endTime)} · {rowDelete.roomCode}. This can&apos;t be undone.
            </div>
            <div className="perm-delete-actions">
              <button type="button" className="btn btn-neu" onClick={() => setRowDelete(null)} disabled={del.isPending}>Cancel</button>
              <button type="button" className="btn btn-danger" disabled={del.isPending} onClick={() => confirmDelete(rowDelete)}>
                <i className="lni lni-trash-can"></i> {del.isPending ? 'Removing…' : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
      <Toast toast={toast} />
    </>
  )
}
