'use client'
import { useEffect, useMemo, useState } from 'react'
import { SearchSelect } from '@/components/SearchSelect'
import { ScrollTable } from '@/components/ScrollTable'
import { Pagination } from '@/components/Pagination'
import { AuthError } from '@/lib/api/client'
import { useIntakesDropdown } from '@/hooks/academic/useIntakes'
import { useMyProgramPlannings, useMyTimetable } from '@/hooks/academic/useMyTeaching'
import {
  TERM_OPTIONS, TimetableMatrix, TtCard, entryBatches, entryUnits, intakeOptionLabel, isOverCapacity, slotRange,
} from '@/components/timetable/ttShared'
import type { TimetableEntry } from '@/lib/api/academic/timetable'
import type { TimeSlotDropdownItem } from '@/lib/api/academic/timeSlot'
import type { Weekday } from '@/lib/api/academic/weekday'

// My Profile → Timetable & Course Units: the signed-in staff member's own
// week and allocations (GET /timetables/my, GET /program-plannings/my). The
// lecturer comes from the login token; nothing here sends an id.
// One Session + Term pair drives both sections. The timetable needs a term,
// so it waits for one; the course-unit list works with no filters.

const PAGE_SIZE = 10
const TERM_FILTER_OPTIONS = [{ value: '', label: 'All terms' }, ...TERM_OPTIONS]

// Monday–Friday always, so the week reads as a week; Saturday (and any other
// day) only when something is scheduled on it.
const WEEK = [
  { code: 'MON', name: 'Monday' }, { code: 'TUE', name: 'Tuesday' }, { code: 'WED', name: 'Wednesday' },
  { code: 'THU', name: 'Thursday' }, { code: 'FRI', name: 'Friday' }, { code: 'SAT', name: 'Saturday' },
]

function useDebounced<T>(value: T, ms: number): T {
  const [v, setV] = useState(value)
  useEffect(() => { const t = setTimeout(() => setV(value), ms); return () => clearTimeout(t) }, [value, ms])
  return v
}

// The grid's rows and columns come from the entries themselves, not the
// weekday / time-slot masters, so the tab needs nothing beyond a login.
function gridFromEntries(entries: TimetableEntry[]): { days: Weekday[]; slots: TimeSlotDropdownItem[] } {
  const byCode = new Map<string, TimetableEntry>()
  for (const e of entries) if (e.dayCode && !byCode.has(e.dayCode.toUpperCase())) byCode.set(e.dayCode.toUpperCase(), e)
  const days: Weekday[] = WEEK
    .filter(d => d.code !== 'SAT' || byCode.has('SAT'))
    .map(d => ({ weekDayGuid: byCode.get(d.code)?.weekDayGuid ?? `day-${d.code}`, dayCode: d.code, dayName: byCode.get(d.code)?.dayName || d.name }))
  // Any other day an entry falls on (e.g. Sunday), in the API's day order.
  const extra = [...byCode.entries()].filter(([code]) => !WEEK.some(d => d.code === code)).sort((a, b) => a[1].dayOrder - b[1].dayOrder)
  for (const [code, e] of extra) days.push({ weekDayGuid: e.weekDayGuid, dayCode: code, dayName: e.dayName })

  const slotMap = new Map<string, TimeSlotDropdownItem>()
  for (const e of entries) {
    if (slotMap.has(e.timeSlotGuid)) continue
    slotMap.set(e.timeSlotGuid, {
      timeSlotGuid: e.timeSlotGuid, timeSlotCode: e.timeSlotCode, timeSlot: '',
      batchTimeGuid: e.batchTimeGuid, batchTimeName: e.batchTimeName, batchTimeCode: '',
      startTime: e.startTime, endTime: e.endTime,
    })
  }
  const slots = [...slotMap.values()].sort((a, b) => a.startTime.localeCompare(b.startTime) || a.batchTimeName.localeCompare(b.batchTimeName))
  return { days, slots }
}

function errorText(err: unknown, fallback: string) {
  if (err instanceof AuthError && err.code === 'unauthorized') return 'Your account isn’t linked to a staff record, so there’s no teaching to show.'
  return err instanceof Error && err.message ? err.message : fallback
}

function Placeholder({ icon, children, tone }: { icon: string; children: React.ReactNode; tone?: 'error' }) {
  return (
    <div className="tt-cal-placeholder" style={{ minHeight: 180, ...(tone === 'error' ? { color: 'var(--red)' } : {}) }} role={tone === 'error' ? 'alert' : 'status'}>
      <i className={`lni ${icon}`} aria-hidden="true"></i>{children}
    </div>
  )
}

export function MyTeachingTab() {
  // ── Shared filters ──
  const { data: intakes = [], isLoading: intakesLoading } = useIntakesDropdown()
  const [intakeGuid, setIntakeGuid] = useState<string | null>(null)   // null = not chosen yet; '' = all sessions
  const currentIntake = intakes.find(i => i.currentIntake)
  const effectiveIntake = intakeGuid ?? currentIntake?.intakeGuid ?? ''
  const [term, setTerm] = useState('')
  const termNo = term ? Number(term) : null
  const intakeLabel = (() => {
    const i = intakes.find(x => x.intakeGuid === effectiveIntake)
    return i ? intakeOptionLabel(i) : effectiveIntake ? 'Session' : 'All sessions'
  })()

  // ── Timetable ── (no session chosen = the current intake, server-side)
  const tt = useMyTimetable(termNo, effectiveIntake || null)
  const grid = useMemo(() => gridFromEntries(tt.data?.entries ?? []), [tt.data])

  // ── Course units ──
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounced(search.trim(), 400)
  const filterKey = JSON.stringify([effectiveIntake, term, debouncedSearch])
  const [pageState, setPageState] = useState({ key: filterKey, page: 1 })
  const page = pageState.key === filterKey ? pageState.page : 1
  const units = useMyProgramPlannings({
    intakeGuid: effectiveIntake || undefined,
    term: termNo ?? undefined,
    search: debouncedSearch || undefined,
    page,
    pageSize: PAGE_SIZE,
  })
  const unitList = units.data
  const totalPages = unitList ? Math.max(1, Math.ceil(unitList.totalCount / PAGE_SIZE)) : 1

  const sessionOptions = [{ value: '', label: 'All sessions' }, ...intakes.map(i => ({ value: i.intakeGuid, label: `${intakeOptionLabel(i)}${i.currentIntake ? ' · current' : ''}` }))]

  return (
    <div className="mp-panel">
      {/* Filters shared by both sections */}
      <div className="card mp-teach-filters">
        <div className="fg">
          <label className="lbl">Session</label>
          <SearchSelect options={sessionOptions} value={effectiveIntake} onChange={v => setIntakeGuid(v)} isLoading={intakesLoading} placeholder="All sessions" />
        </div>
        <div className="fg">
          <label className="lbl">Term</label>
          <SearchSelect options={TERM_FILTER_OPTIONS} value={term} onChange={setTerm} placeholder="All terms" />
        </div>
        <p className="mp-teach-note">
          {termNo
            ? <>Showing <strong>Term {termNo}</strong> of <strong>{effectiveIntake ? intakeLabel : 'the current session'}</strong>.</>
            : <>Pick a term to see your weekly timetable. Course units list every term.</>}
        </p>
      </div>

      {/* At a glance */}
      <dl className="mp-sec-strip" aria-label="Teaching summary">
        <div className="mp-sec-item">
          <span className="mp-sec-ic" aria-hidden="true"><i className="lni lni-book"></i></span>
          <div><dt>Course units allocated</dt><dd>{unitList ? unitList.totalCount : '—'}</dd></div>
        </div>
        <div className="mp-sec-item">
          <span className="mp-sec-ic" aria-hidden="true"><i className="lni lni-alarm-clock"></i></span>
          <div><dt>Teaching load</dt><dd>{termNo && tt.data ? `${tt.data.totalLoad} hrs · Term ${termNo}` : 'Pick a term'}</dd></div>
        </div>
        <div className="mp-sec-item">
          <span className="mp-sec-ic" aria-hidden="true"><i className="lni lni-calendar"></i></span>
          <div><dt>Classes per week</dt><dd>{termNo && tt.data ? tt.data.entries.length : 'Pick a term'}</dd></div>
        </div>
      </dl>

      {/* Weekly timetable */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="card-hdr" style={{ padding: '16px 20px 0' }}>
          <div>
            <div className="card-title"><i className="lni lni-calendar"></i> My Timetable</div>
            <div className="card-sub">
              {termNo ? `${effectiveIntake ? intakeLabel : 'Current session'} · Term ${termNo}` : 'Your weekly classes, by day and time slot'}
            </div>
          </div>
          {tt.data && tt.data.entries.length > 0 && (
            <span className="tt-load-badge"><i className="lni lni-alarm-clock" aria-hidden="true"></i>{tt.data.totalLoad} hrs this term</span>
          )}
        </div>
        <div style={{ padding: 16 }}>
          {!termNo ? (
            <Placeholder icon="lni-pointer">Choose Term 1 or Term 2 above to see your timetable.</Placeholder>
          ) : tt.isLoading ? (
            <Placeholder icon="lni-spinner-arrow spin">Loading your timetable…</Placeholder>
          ) : tt.isError ? (
            <Placeholder icon="lni-warning" tone="error">{errorText(tt.error, 'Couldn’t load your timetable.')}</Placeholder>
          ) : !tt.data || tt.data.entries.length === 0 ? (
            <Placeholder icon="lni-calendar">Nothing is scheduled for you in Term {termNo}.</Placeholder>
          ) : (
            <TimetableMatrix
              days={grid.days}
              slots={grid.slots}
              entries={tt.data.entries}
              minWidth={Math.max(640, grid.slots.length * 150 + 110)}
              renderEntry={e => {
                const u = entryUnits(e)
                return (
                  <TtCard
                    code={u.code}
                    name={u.name}
                    over={isOverCapacity(e)}
                    metaLeft={entryBatches(e)}
                    metaRight={e.roomCode}
                  />
                )
              }}
            />
          )}
          {tt.data && tt.data.entries.length > 0 && (
            <p className="mp-teach-legend">
              Times: {grid.slots.map(s => `${s.timeSlotCode} ${slotRange(s.startTime, s.endTime, true)}`).join(' · ')}
            </p>
          )}
        </div>
      </div>

      {/* Course units allocated */}
      <div className="card">
        <div className="card-hdr mp-teach-units-hdr">
          <div>
            <div className="card-title"><i className="lni lni-book"></i> Course Units Allocated</div>
            <div className="card-sub">
              {unitList ? `${unitList.totalCount} ${unitList.totalCount === 1 ? 'allocation' : 'allocations'}` : 'Course units you’re planned to teach'}
              {' · '}{effectiveIntake ? intakeLabel : 'every session'}{termNo ? ` · Term ${termNo}` : ' · every term'}
            </div>
          </div>
          <div className="inp-wrap mp-teach-search">
            <i className="lni lni-search-alt inp-icon" aria-hidden="true"></i>
            <input className="ctrl" type="search" aria-label="Search course units" placeholder="Unit code or name, faculty, session…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {units.isError ? (
          <Placeholder icon="lni-warning" tone="error">{errorText(units.error, 'Couldn’t load your course units.')}</Placeholder>
        ) : !unitList ? (
          <Placeholder icon="lni-spinner-arrow spin">Loading your course units…</Placeholder>
        ) : unitList.items.length === 0 ? (
          <Placeholder icon="lni-book">
            {debouncedSearch ? `No course units match “${debouncedSearch}”.` : 'No course units are allocated to you for this selection.'}
          </Placeholder>
        ) : (
          <div className={units.isPlaceholderData ? 'fd-busy' : undefined} aria-busy={units.isPlaceholderData || undefined}>
            <ScrollTable className="mp-teach-table">
              <table>
                <thead>
                  <tr>
                    <th>Code</th><th>Course Unit</th><th>Faculty</th><th>Session</th><th className="text-center">Term</th><th className="text-right">Load (hrs)</th>
                  </tr>
                </thead>
                <tbody>
                  {unitList.items.map(u => (
                    <tr key={u.programPlanGuid}>
                      <td className="font-mono">{u.courseUnitCode ?? '—'}</td>
                      <td className="font-medium">{u.courseUnitName ?? '—'}</td>
                      <td title={u.facultyName ?? undefined}>{u.facultyCode ? <span className="badge badge-grey">{u.facultyCode}</span> : '—'} <span className="text-g500">{u.facultyName}</span></td>
                      <td>{u.description ?? '—'}{u.intakeCode ? <span className="text-g400 font-mono" style={{ marginLeft: 6, fontSize: 12 }}>{u.intakeCode}</span> : null}</td>
                      <td className="text-center">{u.term ? `Term ${u.term}` : '—'}</td>
                      <td className="text-right tabular-nums">{u.load}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollTable>
            {unitList.totalCount > PAGE_SIZE && (
              <div style={{ marginTop: 12 }}>
                <Pagination page={page} totalPages={totalPages} totalCount={unitList.totalCount} itemLabel="course units" onPageChange={p => setPageState({ key: filterKey, page: p })} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
