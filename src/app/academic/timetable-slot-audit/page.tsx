'use client'
import { useEffect, useState } from 'react'
import { SearchSelect } from '@/components/SearchSelect'
import { EmptyState } from '@/components/EmptyState'
import { TableLoadingState } from '@/components/TableLoadingState'
import { useIntakesDropdown } from '@/hooks/academic/useIntakes'
import { useBatchTimes } from '@/hooks/config/useBatchTimes'
import { useTimetableIntakes, useTimetableBySlot, useTimeSlots, SlotAuditParams } from '@/hooks/academic/useTimetable'
import {
  TERM_OPTIONS, useTeachingDays, intakeOptionLabel, allowedDayCodes, capacityState, entryUnits, entryBatches,
  slotName, slotRange, downloadCsv,
} from '@/components/timetable/ttShared'

// Time Slot Audit (timetable-page.md §4) — every room in use at one batch
// time, weekday and slot across the campus, from GET /timetables/by-slot.
const STATUS = {
  ok: { badge: 'badge-green', label: 'OK' },
  near: { badge: 'badge-amber', label: 'Near Cap' },
  over: { badge: 'badge-red', label: 'Over Cap' },
} as const

export default function SlotAuditPage() {
  const { data: ttIntakes } = useTimetableIntakes()
  const { data: intakes = [] } = useIntakesDropdown()
  const { data: batchTimes = [] } = useBatchTimes()
  const { days } = useTeachingDays()

  const [intakeGuid, setIntakeGuid] = useState('')
  const [term, setTerm] = useState('1')
  const [batchTimeGuid, setBatchTimeGuid] = useState('')
  const [weekDayGuid, setWeekDayGuid] = useState('')
  const [timeSlotGuid, setTimeSlotGuid] = useState('')
  const [params, setParams] = useState<SlotAuditParams | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!intakeGuid && ttIntakes?.currentIntakeGuid) setIntakeGuid(ttIntakes.currentIntakeGuid)
  }, [intakeGuid, ttIntakes])

  const batchTime = batchTimes.find(b => b.batchTimeGuid === batchTimeGuid)
  const { data: slots = [], isLoading: slotsLoading } = useTimeSlots(batchTimeGuid || null, !!batchTimeGuid)
  const allowed = allowedDayCodes(batchTime?.batchTime)
  const dayOptions = days.filter(d => !allowed || allowed.includes(d.dayCode?.toUpperCase())).map(d => ({ value: d.weekDayGuid, label: d.dayName }))

  // The day and slot belong to the batch time, so changing it clears them.
  function changeBatchTime(v: string) { setBatchTimeGuid(v); setWeekDayGuid(''); setTimeSlotGuid('') }
  function cancel() { setBatchTimeGuid(''); setWeekDayGuid(''); setTimeSlotGuid(''); setParams(null); setSearch('') }

  const ready = !!intakeGuid && !!batchTimeGuid && !!weekDayGuid && !!timeSlotGuid
  const audit = useTimetableBySlot(params)
  const data = audit.data

  const q = search.trim().toLowerCase()
  const rows = (data?.entries ?? []).filter(e => !q || [e.lecturerName, e.roomCode, entryBatches(e), entryUnits(e).code].join(' ').toLowerCase().includes(q))

  const shownDay = days.find(d => d.weekDayGuid === params?.weekDayGuid)
  const shownSlot = slots.find(s => s.timeSlotGuid === params?.timeSlotGuid)
  const shownShift = batchTimes.find(b => b.batchTimeGuid === params?.batchTimeGuid)?.batchTime
  const caption = params ? `${shownDay?.dayName ?? ''} · ${shownSlot ? `${slotName(shownSlot)} (${slotRange(shownSlot.startTime, shownSlot.endTime)})` : ''} · ${shownShift ?? ''} Shift` : ''

  function exportExcel() {
    downloadCsv(
      `time-slot-audit-${(shownDay?.dayName ?? 'day').toLowerCase()}-${shownSlot?.timeSlotCode ?? 'slot'}.csv`,
      ['#', 'Faculty', 'Course Unit', 'Batch', 'Room', 'Head Count', 'Capacity', 'Status'],
      rows.map((e, i) => {
        const st = capacityState(e.headCount, e.roomCapacity)
        return [i + 1, e.lecturerName ?? '', entryUnits(e).code, entryBatches(e), e.roomCode, e.headCount, e.roomCapacity ?? '', st ? STATUS[st].label : '']
      }),
    )
  }

  return (
    <div className="page active">
      <div className="pg-hdr">
        <div>
          <div className="pg-title">Time Slot-wise Audit</div>
          <div className="pg-sub">Campus-wide room occupancy at any given hour</div>
        </div>
        <div className="flex gap-2 tt-no-print">
          <button type="button" className="btn btn-neu btn-sm" disabled={!data} onClick={() => window.print()}><i className="lni lni-files"></i> PDF</button>
          <button type="button" className="btn btn-success btn-sm" disabled={!data || rows.length === 0} onClick={exportExcel}><i className="lni lni-download"></i> Excel</button>
        </div>
      </div>

      <div className="tt-filter-bar tt-no-print">
        <div className="fg" style={{ minWidth: 190 }}>
          <label className="lbl">Session <span className="req">*</span></label>
          <SearchSelect placeholder="— Session —" options={intakes.map(i => ({ value: i.intakeGuid, label: intakeOptionLabel(i) }))} value={intakeGuid} onChange={setIntakeGuid} />
        </div>
        <div className="fg" style={{ minWidth: 130 }}>
          <label className="lbl">Batch Time <span className="req">*</span></label>
          <SearchSelect placeholder="— Shift —" options={batchTimes.map(b => ({ value: b.batchTimeGuid, label: b.batchTime }))} value={batchTimeGuid} onChange={changeBatchTime} />
        </div>
        <div className="fg" style={{ minWidth: 140 }}>
          <label className="lbl">Day <span className="req">*</span></label>
          <SearchSelect placeholder={batchTimeGuid ? '— Day —' : 'Pick a shift'} options={dayOptions} value={weekDayGuid} onChange={setWeekDayGuid} disabled={!batchTimeGuid} />
        </div>
        <div className="fg" style={{ minWidth: 210 }}>
          <label className="lbl">Time Slot <span className="req">*</span></label>
          <SearchSelect
            placeholder={!batchTimeGuid ? 'Pick a shift' : slotsLoading ? 'Loading…' : slots.length === 0 ? 'No slots for this shift' : '— Time slot —'}
            options={slots.map(s => ({ value: s.timeSlotGuid, label: `${slotRange(s.startTime, s.endTime, true)} (${slotName(s)})` }))}
            value={timeSlotGuid}
            onChange={setTimeSlotGuid}
            disabled={!batchTimeGuid}
            isLoading={slotsLoading && !!batchTimeGuid}
          />
        </div>
        <div className="fg" style={{ minWidth: 110 }}>
          <label className="lbl">Term</label>
          <SearchSelect options={TERM_OPTIONS} value={term} onChange={setTerm} />
        </div>
        <button type="button" className="btn btn-primary btn-sm" disabled={!ready} onClick={() => setParams({ batchTimeGuid, weekDayGuid, timeSlotGuid, intakeGuid, term: +term })}>Search</button>
        <button type="button" className="btn btn-neu btn-sm" onClick={cancel}>Cancel</button>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-lbl">Rooms In Use</div>
          <div className="stat-num">{data ? data.roomsInUse : '—'}</div>
          <div className="stat-sub text-g400">{data ? `of ${data.totalRooms} total` : 'Run a search'}</div>
        </div>
        <div className="stat-card [--b700:var(--amber)] [--b400:#fbbf24]">
          <div className="stat-lbl">Near Capacity</div>
          <div className="stat-num">{data ? data.nearCapacityRooms : '—'}</div>
          <div className="stat-sub" style={{ color: 'var(--amber)' }}>≥80% occupied</div>
        </div>
        <div className="stat-card [--b700:var(--red)] [--b400:#f87171]">
          <div className="stat-lbl">Over Capacity</div>
          <div className="stat-num">{data ? data.overCapacityRooms : '—'}</div>
          <div className="stat-sub" style={{ color: 'var(--red)' }}>Needs reassignment</div>
        </div>
        <div className="stat-card [--b700:var(--green)] [--b400:#34d399]">
          <div className="stat-lbl">Available Rooms</div>
          <div className="stat-num">{data ? data.availableRooms : '—'}</div>
          <div className="stat-sub" style={{ color: 'var(--green)' }}>Ready to allocate</div>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="tt-matrix-card-hdr">
          <div>
            <div className="card-title">Room Facility Audit</div>
            <div className="text-g500" style={{ fontSize: 'var(--fs-sm)', marginTop: 2 }}>{caption || 'Pick a shift, day and time slot, then Search'}</div>
          </div>
          <input className="ctrl tt-no-print" style={{ width: 230 }} placeholder="Room, faculty, batch…" value={search} onChange={e => setSearch(e.target.value)} disabled={!data} aria-label="Search rooms" />
        </div>
        <div className="tbl-wrap" style={{ border: 'none', borderRadius: 0, boxShadow: 'none' }}>
          <table>
            <thead>
              <tr><th style={{ width: 48 }}>#</th><th>Faculty</th><th>Course Unit</th><th>Batch</th><th>Room</th><th>Head Count</th><th>Utilisation</th><th>Status</th></tr>
            </thead>
            <tbody>
              {!params ? (
                <tr><td colSpan={8} className="text-center text-g400" style={{ padding: 28 }}>Choose a shift, day and time slot to audit room use.</td></tr>
              ) : audit.isLoading ? (
                <TableLoadingState colSpan={8} />
              ) : audit.isError ? (
                <tr><td colSpan={8} className="text-center" style={{ padding: 28, color: 'var(--red)' }}>{(audit.error as Error)?.message || 'Could not load this slot.'}</td></tr>
              ) : rows.length === 0 ? (
                q
                  ? <EmptyState colSpan={8} hasFilters onClearFilters={() => setSearch('')} />
                  : <tr><td colSpan={8} className="text-center text-g400" style={{ padding: 28 }}>Nothing is scheduled at this slot — all {data?.totalRooms ?? 0} rooms are free.</td></tr>
              ) : rows.map((e, i) => {
                const st = capacityState(e.headCount, e.roomCapacity)
                const pct = e.roomCapacity ? Math.min(100, Math.round((e.headCount / e.roomCapacity) * 100)) : 0
                const colour = st === 'over' ? 'var(--red)' : st === 'near' ? 'var(--amber)' : 'var(--green)'
                return (
                  <tr key={e.timetableGuid}>
                    <td className="text-g400" style={{ fontWeight: 700 }}>{i + 1}</td>
                    <td style={{ fontWeight: 600 }}>{e.lecturerName ?? '—'}</td>
                    <td><strong className="text-b700">{entryUnits(e).code}</strong></td>
                    <td>{entryBatches(e)}</td>
                    <td style={{ fontWeight: 700, color: st === 'over' ? 'var(--red)' : 'var(--b700)' }}>{e.roomCode}</td>
                    <td style={{ fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: st === 'over' ? 'var(--red)' : undefined }}>{e.headCount}</td>
                    <td>
                      {e.roomCapacity ? (
                        <div className="tt-util">
                          <div className="tt-util-track"><div className={`tt-util-fill${st === 'ok' ? '' : ` ${st}`}`} style={{ width: `${pct}%` }}></div></div>
                          <span className="tt-util-txt" style={{ color: colour }}>{e.headCount}/{e.roomCapacity}</span>
                        </div>
                      ) : <span className="text-g400" style={{ fontSize: 'var(--fs-xs)' }}>No capacity recorded</span>}
                    </td>
                    <td>{st ? <span className={`badge ${STATUS[st].badge}`}>{STATUS[st].label}</span> : <span className="text-g300">—</span>}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
