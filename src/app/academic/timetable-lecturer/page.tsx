'use client'
import { useEffect, useState } from 'react'
import { SearchSelect } from '@/components/SearchSelect'
import { useIntakesDropdown } from '@/hooks/academic/useIntakes'
import { useTimetableIntakes, useTimetableLecturers, useTimetableByLecturer, useTimeSlots } from '@/hooks/academic/useTimetable'
import { TERM_OPTIONS, useTeachingDays, intakeOptionLabel, entryUnits, entryBatches, isOverCapacity, TimetableMatrix, TtCard } from '@/components/timetable/ttShared'

// Lecturer View (timetable-page.md §2) — one lecturer's week across every
// shift, from GET /timetables/by-lecturer. Any intake can be viewed.
export default function LecturerViewPage() {
  const { data: ttIntakes } = useTimetableIntakes()
  const { data: intakes = [] } = useIntakesDropdown()
  const [intakeGuid, setIntakeGuid] = useState('')
  const [term, setTerm] = useState('1')
  const [lecturerGuid, setLecturerGuid] = useState('')
  // The matrix loads only on Generate, for the filters as they were then.
  const [shown, setShown] = useState<{ lecturerGuid: string; intakeGuid: string; term: number } | null>(null)

  useEffect(() => {
    if (!intakeGuid) {
      const defaultGuid = ttIntakes?.currentIntakeGuid || intakes.find(i => i.currentIntake)?.intakeGuid || intakes[0]?.intakeGuid
      if (defaultGuid) setIntakeGuid(defaultGuid)
    }
  }, [intakeGuid, ttIntakes, intakes])

  const { data: lecturers = [], isLoading: lecturersLoading } = useTimetableLecturers(intakeGuid || null, +term)
  const { days } = useTeachingDays()
  const { data: allSlots = [] } = useTimeSlots(null)
  const tt = useTimetableByLecturer(shown?.lecturerGuid ?? null, shown?.intakeGuid ?? null, shown?.term ?? 1)
  const data = tt.data
  const intakeLabel = intakes.find(i => i.intakeGuid === shown?.intakeGuid)
  const shownName = data?.lecturerName ?? lecturers.find(l => l.employeeGuid === shown?.lecturerGuid)?.empName ?? 'Lecturer'

  return (
    <div className="page active">
      <div className="pg-hdr">
        <div>
          <div className="pg-title">Lecturer Timetable View</div>
          <div className="pg-sub">A lecturer&apos;s weekly schedule across every shift, with their workload</div>
        </div>
        <button type="button" className="btn btn-primary btn-sm tt-no-print" disabled={!data} onClick={() => window.print()}>
          <i className="lni lni-download"></i> Export PDF
        </button>
      </div>

      <div className="tt-filter-bar tt-no-print">
        <div className="fg" style={{ minWidth: 200 }}>
          <label className="lbl">Session <span className="req">*</span></label>
          <SearchSelect placeholder="— Session —" options={intakes.map(i => ({ value: i.intakeGuid, label: intakeOptionLabel(i) }))} value={intakeGuid} onChange={v => { setIntakeGuid(v); setLecturerGuid('') }} />
        </div>
        <div className="fg" style={{ minWidth: 110 }}>
          <label className="lbl">Term <span className="req">*</span></label>
          <SearchSelect options={TERM_OPTIONS} value={term} onChange={v => { setTerm(v); setLecturerGuid('') }} />
        </div>
        <div className="fg" style={{ minWidth: 240 }}>
          <label className="lbl">Lecturer <span className="req">*</span></label>
          <SearchSelect
            placeholder={!intakeGuid ? 'Pick a session first' : lecturersLoading ? 'Loading…' : lecturers.length === 0 ? 'No lecturers planned this term' : '— Select lecturer —'}
            options={lecturers.map(l => ({ value: l.employeeGuid, label: l.empName ?? '—' }))}
            value={lecturerGuid}
            onChange={setLecturerGuid}
            disabled={!intakeGuid}
            isLoading={lecturersLoading}
          />
        </div>
        <button type="button" className="btn btn-primary btn-sm" disabled={!intakeGuid || !lecturerGuid} onClick={() => setShown({ lecturerGuid, intakeGuid, term: +term })}>Generate</button>
        {data && (
          <div className="tt-filter-end">
            <span className="tt-load-badge"><i className="lni lni-alarm-clock" aria-hidden="true"></i>{data.totalLoad} hrs this term</span>
          </div>
        )}
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {!shown ? (
          <div className="tt-cal-placeholder"><i className="lni lni-user" aria-hidden="true"></i>Pick a session, term and lecturer, then Generate.</div>
        ) : tt.isLoading ? (
          <div className="tt-cal-placeholder"><i className="lni lni-spinner-arrow spin" aria-hidden="true"></i>Loading the timetable…</div>
        ) : tt.isError ? (
          <div className="tt-cal-placeholder" style={{ color: 'var(--red)' }}><i className="lni lni-warning" aria-hidden="true"></i>{(tt.error as Error)?.message || 'Could not load this timetable.'}</div>
        ) : data && (
          <>
            <div className="tt-matrix-card-hdr">
              <div>
                <div className="card-title">{shownName} — {intakeLabel ? intakeOptionLabel(intakeLabel) : 'Session'} · Term {shown.term}</div>
                <div className="text-g500" style={{ fontSize: 'var(--fs-sm)', marginTop: 2 }}>
                  {data.entries.length} session{data.entries.length === 1 ? '' : 's'} · contact hours across all shifts
                </div>
              </div>
            </div>
            <div style={{ padding: 14 }}>
              {data.entries.length === 0 ? (
                <div className="tt-cal-placeholder" style={{ minHeight: 200 }}><i className="lni lni-calendar" aria-hidden="true"></i>{shownName} has nothing scheduled this term. Total load: 0 hrs.</div>
              ) : (
                <TimetableMatrix
                  days={days}
                  slots={allSlots}
                  entries={data.entries}
                  minWidth={Math.max(860, allSlots.length * 130 + 100)}
                  renderEntry={e => {
                    const u = entryUnits(e)
                    return <TtCard code={u.code} name={u.name} over={isOverCapacity(e)} metaLeft={entryBatches(e)} metaRight={e.roomCode} />
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
