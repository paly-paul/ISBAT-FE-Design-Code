'use client'
import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { SearchSelect } from '@/components/SearchSelect'
import { useIntakesDropdown } from '@/hooks/academic/useIntakes'
import { useTimetableIntakes, useTimetableByBatch, useTimeSlots } from '@/hooks/academic/useTimetable'
import { getBatchDropdown } from '@/lib/api/academic/batch'
import {
  TERM_OPTIONS, useTeachingDays, intakeOptionLabel, entryUnits, isOverCapacity, allowedDayCodes,
  shiftBadge, shiftHint, TimetableMatrix, TtCard,
} from '@/components/timetable/ttShared'

// Batch View (timetable-page.md §3) — one batch's week, from
// GET /timetables/by-batch. Columns are the time slots of the batch time(s)
// its entries use. Any intake can be viewed.
export default function BatchViewPage() {
  const { data: ttIntakes } = useTimetableIntakes()
  const { data: intakes = [] } = useIntakesDropdown()
  const [intakeGuid, setIntakeGuid] = useState('')
  const [term, setTerm] = useState('1')
  const [batchGuid, setBatchGuid] = useState('')
  const [shown, setShown] = useState<{ batchGuid: string; intakeGuid: string; term: number } | null>(null)

  useEffect(() => {
    if (!intakeGuid && ttIntakes?.currentIntakeGuid) setIntakeGuid(ttIntakes.currentIntakeGuid)
  }, [intakeGuid, ttIntakes])

  // Batches of the chosen intake (batches/dropdown?intakeGuid=) — code only.
  const batchQuery = useQuery({
    queryKey: ['batches', 'dropdown', 'intake', intakeGuid],
    queryFn: () => getBatchDropdown(undefined, undefined, intakeGuid),
    enabled: !!intakeGuid,
  })
  const batches = batchQuery.data ?? []

  const { days } = useTeachingDays()
  const { data: allSlots = [] } = useTimeSlots(null)
  const tt = useTimetableByBatch(shown?.batchGuid ?? null, shown?.intakeGuid ?? null, shown?.term ?? 1)
  const data = tt.data

  const shifts = useMemo(() => Array.from(new Map((data?.entries ?? []).map(e => [e.batchTimeGuid, e.batchTimeName])).entries()), [data])
  const slots = allSlots.filter(s => shifts.some(([g]) => g === s.batchTimeGuid))
  // Apply the shift's day rule only when the batch keeps to one shift.
  const allowedDays = shifts.length === 1 ? allowedDayCodes(shifts[0][1]) : null
  const intakeLabel = intakes.find(i => i.intakeGuid === shown?.intakeGuid)

  return (
    <div className="page active">
      <div className="pg-hdr">
        <div>
          <div className="pg-title">Batch-wise Timetable View</div>
          <div className="pg-sub">Weekly class distribution per cohort — check for gaps and overlaps</div>
        </div>
        <button type="button" className="btn btn-primary btn-sm tt-no-print" disabled={!data} onClick={() => window.print()}>
          <i className="lni lni-download"></i> Export PDF
        </button>
      </div>

      <div className="tt-filter-bar tt-no-print">
        <div className="fg" style={{ minWidth: 200 }}>
          <label className="lbl">Session <span className="req">*</span></label>
          <SearchSelect placeholder="— Session —" options={intakes.map(i => ({ value: i.intakeGuid, label: intakeOptionLabel(i) }))} value={intakeGuid} onChange={v => { setIntakeGuid(v); setBatchGuid('') }} />
        </div>
        <div className="fg" style={{ minWidth: 110 }}>
          <label className="lbl">Term</label>
          <SearchSelect options={TERM_OPTIONS} value={term} onChange={setTerm} />
        </div>
        <div className="fg" style={{ minWidth: 240 }}>
          <label className="lbl">Batch <span className="req">*</span></label>
          <SearchSelect
            placeholder={!intakeGuid ? 'Pick a session first' : batchQuery.isLoading ? 'Loading…' : batches.length === 0 ? 'No batches for this session' : '— Select batch —'}
            options={batches.map(b => ({ value: b.batchGuid, label: b.batchCode }))}
            value={batchGuid}
            onChange={setBatchGuid}
            disabled={!intakeGuid}
            isLoading={batchQuery.isLoading}
          />
        </div>
        <button type="button" className="btn btn-primary btn-sm" disabled={!intakeGuid || !batchGuid} onClick={() => setShown({ batchGuid, intakeGuid, term: +term })}>Generate</button>
        <button type="button" className="btn btn-neu btn-sm" disabled={!shown || tt.isFetching} onClick={() => tt.refetch()} aria-label="Reload"><i className={`lni ${tt.isFetching ? 'lni-spinner-arrow spin' : 'lni-reload'}`}></i></button>
        <div className="tt-filter-end">
          <span className="text-g500" style={{ fontSize: 'var(--fs-sm)' }}>Coverage:</span>
          <span className="badge badge-grey" title="Needs a batch coverage API">Not available yet</span>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {!shown ? (
          <div className="tt-cal-placeholder"><i className="lni lni-users" aria-hidden="true"></i>Pick a session and batch, then Generate.</div>
        ) : tt.isLoading ? (
          <div className="tt-cal-placeholder"><i className="lni lni-spinner-arrow spin" aria-hidden="true"></i>Loading the timetable…</div>
        ) : tt.isError ? (
          <div className="tt-cal-placeholder" style={{ color: 'var(--red)' }}><i className="lni lni-warning" aria-hidden="true"></i>{(tt.error as Error)?.message || 'Could not load this timetable.'}</div>
        ) : data && (
          <>
            <div className="tt-matrix-card-hdr">
              <div>
                <div className="card-title">{data.batchCode} — {intakeLabel ? intakeOptionLabel(intakeLabel) : 'Session'} · Term {shown.term}</div>
                <div className="text-g500" style={{ fontSize: 'var(--fs-sm)', marginTop: 2 }}>{data.studentCount} students enrolled</div>
              </div>
              <div className="flex gap-2 flex-wrap">
                {shifts.map(([g, name]) => <span key={g} className={`badge ${shiftBadge(name)}`}>{name} Shift</span>)}
                {shifts.length === 1 && <span className="badge badge-grey">{shiftHint(shifts[0][1]).replace(' only', '')}</span>}
              </div>
            </div>
            <div style={{ padding: 14 }}>
              {data.entries.length === 0 ? (
                <div className="tt-cal-placeholder" style={{ minHeight: 200 }}><i className="lni lni-calendar" aria-hidden="true"></i>No classes scheduled for {data.batchCode} this term.</div>
              ) : (
                <TimetableMatrix
                  days={days}
                  slots={slots}
                  entries={data.entries}
                  allowedDays={allowedDays}
                  offLabel={d => `${d.dayName} — not applicable (${shifts[0]?.[1]} programme)`}
                  renderEntry={e => {
                    const u = entryUnits(e)
                    return <TtCard code={u.code} name={u.name} over={isOverCapacity(e)} metaLeft={e.lecturerName ?? '—'} metaRight={e.roomCode} />
                  }}
                />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
