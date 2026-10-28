'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useQueries } from '@tanstack/react-query'
import { SearchSelect } from '@/components/SearchSelect'
import { ScrollTable } from '@/components/ScrollTable'
import { TableLoadingState } from '@/components/TableLoadingState'
import { Pagination } from '@/components/Pagination'
import { useAttendanceTimetables, usePendingOutlineSessions } from '@/hooks/attendance/useClassAttendance'
import { getPendingOutlineSessions, parseYmd, todayYmd } from '@/lib/api/attendance/classAttendance'
import { fmtDate, fmtTime, timetableLabel } from '@/components/attendance/attShared'

// Pending Outline Sessions (class-attendance-frontend-spec.md, Screen 1):
// sessions whose students are marked but whose outline topics are still
// missing. The spec's timetable dropdown + Apply drives the table; the
// timetable cards above it show each timetable's pending count, so the
// lecturer can see where outlines are missing before picking one.

const PAGE_SIZE = 10
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function daysAgo(ymd: string) {
  return Math.round((parseYmd(todayYmd()).getTime() - parseYmd(ymd).getTime()) / 86400000)
}

// How long outlines have been outstanding: recent, a week, or overdue.
function age(ymd: string) {
  const d = daysAgo(ymd)
  const label = d <= 0 ? 'Today' : d === 1 ? 'Yesterday' : d < 7 ? `${d} days ago` : d < 14 ? 'Last week' : `${Math.floor(d / 7)} weeks ago`
  return { label, tone: d < 7 ? 'fresh' : d < 14 ? 'due' : 'late' }
}

export default function Page() {
  const { data: timetables = [], isLoading: ttLoading } = useAttendanceTimetables()
  const [picked, setPicked] = useState('')
  const [applied, setApplied] = useState('')
  const [page, setPage] = useState(1)

  // Pending count per timetable, for the cards.
  const counts = useQueries({
    queries: timetables.map(t => ({
      queryKey: ['classAttendance', 'pending', t.timetableGuid],
      queryFn: () => getPendingOutlineSessions(t.timetableGuid),
    })),
  })
  const totalPending = counts.reduce((sum, c) => sum + (c.data?.length ?? 0), 0)

  const { data: rows = [], isLoading } = usePendingOutlineSessions(applied || null)
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pageRows = rows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)
  const current = timetables.find(t => t.timetableGuid === applied) ?? null

  function apply(guid = picked) {
    setPicked(guid)
    setApplied(guid)
    setPage(1)
  }

  return (
    <div className="page active" id="page-attendance-pending">
      <div className="pg-hdr">
        <div>
          <div className="pg-title">Pending Outline Sessions</div>
          <div className="pg-sub">Sessions with students marked whose outline topics haven&apos;t been recorded yet</div>
        </div>
        {!ttLoading && (
          <div className={`po-total${totalPending ? '' : ' po-total--clear'}`} aria-live="polite">
            <i className={`lni ${totalPending ? 'lni-alarm-clock' : 'lni-checkmark-circle'}`} aria-hidden="true"></i>
            {totalPending ? <><b className="tabular-nums">{totalPending}</b> pending across your timetables</> : 'All outlines recorded'}
          </div>
        )}
      </div>

      {/* Timetable overview */}
      {timetables.length > 0 && (
        <div className="po-cards" role="list" aria-label="Timetables">
          {timetables.map((t, i) => {
            const n = counts[i]?.data?.length
            const active = applied === t.timetableGuid
            return (
              <button
                key={t.timetableGuid}
                type="button"
                role="listitem"
                className={`po-card${active ? ' on' : ''}${n === 0 ? ' is-clear' : ''}`}
                onClick={() => apply(t.timetableGuid)}
                aria-pressed={active}
              >
                <span className="po-card-top">
                  <span className="po-code">{t.courseUnitCode}</span>
                  <span className={`po-card-count${n ? '' : ' po-card-count--zero'}`}>
                    {n === undefined ? '…' : n === 0 ? <><i className="lni lni-checkmark" aria-hidden="true"></i> Clear</> : <><b className="tabular-nums">{n}</b> pending</>}
                  </span>
                </span>
                <span className="po-card-name">{t.courseUnitName}</span>
                <span className="po-card-meta">
                  <span><i className="lni lni-users" aria-hidden="true"></i> {t.batchCode}</span>
                  <span><i className="lni lni-calendar" aria-hidden="true"></i> {t.dayName.slice(0, 3)} {fmtTime(t.startTime)}</span>
                </span>
              </button>
            )
          })}
        </div>
      )}

      <div className="card po-panel">
        {/* Filter (spec: Timetable dropdown + Apply) */}
        <div className="po-filter">
          <div className="fg m-0 po-filter-select">
            <div className="lbl">Timetable</div>
            <SearchSelect
              placeholder="— Select timetable —"
              options={timetables.map(t => ({ value: t.timetableGuid, label: timetableLabel(t) }))}
              value={picked}
              onChange={setPicked}
            />
          </div>
          <button type="button" className="btn btn-primary" onClick={() => apply()} disabled={!picked || picked === applied}>
            <i className="lni lni-search-alt" aria-hidden="true"></i> Apply
          </button>
        </div>

        {current && (
          <div className="po-current">
            <div>
              <div className="po-current-title"><span className="po-code">{current.courseUnitCode}</span> {current.courseUnitName}</div>
              <div className="po-current-meta">{current.batchCode} · {current.dayName}s {fmtTime(current.startTime)}–{fmtTime(current.endTime)} · {current.lecturerName}</div>
            </div>
            {!isLoading && <span className={`badge ${rows.length ? 'badge-amber' : 'badge-green'}`}>{rows.length ? `${rows.length} pending` : 'Up to date'}</span>}
          </div>
        )}

        <ScrollTable hideArrows>
          <table className="po-table">
            <thead>
              <tr>
                <th style={{ width: 56 }}>##</th>
                <th>Date</th>
                <th>Start Time</th>
                <th>End Time</th>
                <th style={{ width: 190 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {!applied ? (
                <tr><td colSpan={5} className="tbl-empty-cell">
                  <div className="po-empty">
                    <span className="po-empty-icon"><i className="lni lni-list" aria-hidden="true"></i></span>
                    <div className="po-empty-title">Choose a timetable</div>
                    <div className="po-empty-sub">Pick one of the cards above, or select a timetable and click Apply.</div>
                  </div>
                </td></tr>
              ) : isLoading ? (
                <TableLoadingState colSpan={5} />
              ) : rows.length === 0 ? (
                <tr><td colSpan={5} className="tbl-empty-cell">
                  <div className="po-empty">
                    <span className="po-empty-icon po-empty-icon--done"><i className="lni lni-checkmark-circle" aria-hidden="true"></i></span>
                    <div className="po-empty-title">No pending outline sessions</div>
                    <div className="po-empty-sub">Every session for this timetable has its outline topics recorded.</div>
                  </div>
                </td></tr>
              ) : pageRows.map((s, i) => {
                const d = parseYmd(s.sessionDate)
                const a = age(s.sessionDate)
                return (
                  <tr key={s.attendanceSessionGuid}>
                    <td className="text-g500 tabular-nums">{(safePage - 1) * PAGE_SIZE + i + 1}</td>
                    <td>
                      <div className="po-date">
                        <span className="po-date-tile" aria-hidden="true">
                          <span className="po-date-mon">{MONTHS[d.getMonth()]}</span>
                          <span className="po-date-day tabular-nums">{d.getDate()}</span>
                        </span>
                        <span className="po-date-text">
                          <span className="po-date-full">{fmtDate(s.sessionDate)}</span>
                          <span className={`po-age po-age--${a.tone}`}>{DAYS[d.getDay()]} · {a.label}</span>
                        </span>
                      </div>
                    </td>
                    <td className="po-time tabular-nums">{fmtTime(s.startTime)}</td>
                    <td className="po-time tabular-nums">{fmtTime(s.endTime)}</td>
                    <td>
                      <Link className="btn btn-primary btn-sm po-action" prefetch={false} href={`/attendance/record?session=${s.attendanceSessionGuid}`}>
                        <i className="lni lni-pencil" aria-hidden="true"></i> Record Outlines
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </ScrollTable>
        {applied && rows.length > PAGE_SIZE && (
          <Pagination page={safePage} totalPages={totalPages} totalCount={rows.length} itemLabel="sessions" onPageChange={setPage} />
        )}
      </div>
    </div>
  )
}
