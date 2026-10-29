'use client'
import { useState } from 'react'
import Link from 'next/link'
import { SearchSelect } from '@/components/SearchSelect'
import { ScrollTable } from '@/components/ScrollTable'
import { TableLoadingState } from '@/components/TableLoadingState'
import { Pagination } from '@/components/Pagination'
import { usePendingOutlineSessions } from '@/hooks/attendance/useClassAttendance'
import { useTimetableScope } from '@/hooks/attendance/useTimetableScope'
import { parseYmd, todayYmd } from '@/lib/api/attendance/classAttendance'
import { fmtDate, fmtTime, timetableLabel } from '@/components/attendance/attShared'

// Pending Outline Sessions (class-attendance-frontend-spec.md, Screen 1):
// sessions whose students are marked but whose outline topics are still
// missing. Intake → Term → Lecturer (Batch Management-style scope dropdowns,
// applied on change; starting on the current intake and the logged-in
// lecturer) list that lecturer's timetables in the Timetable dropdown, which
// picks one for the table.

const PAGE_SIZE = 10
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
  const scope = useTimetableScope()
  const timetables = scope.timetables
  const ttLoading = !!scope.lecturerGuid && scope.timetablesQ.isLoading
  const [applied, setApplied] = useState('')
  const [page, setPage] = useState(1)

  const { data: rows = [], isLoading, isError, refetch } = usePendingOutlineSessions(applied || null)
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pageRows = rows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)
  const current = timetables.find(t => t.timetableGuid === applied) ?? null

  // The timetable dropdown applies straight away (as Batch Management's
  // scope dropdowns do).
  function apply(guid: string) {
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
      </div>

      {/* Scope for the page, in Batch Management's style: an inline label
          and fixed-width dropdowns that apply on change. */}
      <div className="flex items-center gap-2 flex-wrap mb-3">
        <span className="text-sm font-semibold text-g600">Showing pending outlines for</span>
        <SearchSelect
          style={{ width: 200 }}
          placeholder="Select intake"
          options={scope.intakesQ.data ?? []}
          value={scope.intakeGuid}
          isLoading={scope.intakesQ.isLoading}
          onChange={v => { scope.setIntake(v); apply('') }}
        />
        <SearchSelect
          style={{ width: 120 }}
          placeholder="Term"
          options={scope.termsQ.data ?? []}
          value={scope.term}
          disabled={!scope.intakeGuid}
          onChange={v => { scope.setTerm(v); apply('') }}
        />
        <SearchSelect
          style={{ width: 220 }}
          placeholder={scope.term ? 'Select lecturer' : 'Lecturer'}
          options={scope.lecturersQ.data ?? []}
          value={scope.lecturerGuid}
          disabled={!scope.term}
          isLoading={scope.lecturersQ.isLoading}
          onChange={v => { scope.setLecturer(v); apply('') }}
        />
        <SearchSelect
          style={{ width: 340 }}
          placeholder={scope.lecturerGuid ? 'Select timetable' : 'Timetable'}
          options={timetables.map(t => ({ value: t.timetableGuid, label: timetableLabel(t) }))}
          value={applied}
          disabled={!scope.lecturerGuid}
          isLoading={ttLoading}
          onChange={apply}
        />
      </div>

      <div className="card po-panel">
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
          <table>
            <thead>
              <tr>
                <th>#</th>
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
                    <div className="po-empty-sub">
                      {scope.lecturerGuid
                        ? 'Choose one of this lecturer’s timetables from the dropdown above.'
                        : 'Pick the intake, term and lecturer above to list their timetables.'}
                    </div>
                  </div>
                </td></tr>
              ) : isLoading ? (
                <TableLoadingState colSpan={5} />
              ) : isError ? (
                <tr><td colSpan={5} className="tbl-empty-cell">
                  <div className="po-empty" role="alert">
                    <span className="po-empty-icon"><i className="lni lni-warning" aria-hidden="true"></i></span>
                    <div className="po-empty-title">Couldn&apos;t load pending sessions</div>
                    <button type="button" className="btn btn-neu btn-sm" onClick={() => refetch()}><i className="lni lni-reload" aria-hidden="true"></i> Retry</button>
                  </div>
                </td></tr>
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
                    <td className="text-g400">{(safePage - 1) * PAGE_SIZE + i + 1}</td>
                    <td>
                      <strong>{fmtDate(s.sessionDate)}</strong><br />
                      <span className={`po-age po-age--${a.tone}`}>{DAYS[d.getDay()]} · {a.label}</span>
                    </td>
                    <td>{fmtTime(s.startTime)}</td>
                    <td>{fmtTime(s.endTime)}</td>
                    <td>
                      <Link className="btn btn-primary btn-sm po-action" prefetch={false} href={`/attendance/record?${new URLSearchParams({ timetable: applied, date: s.sessionDate.slice(0, 10), session: s.attendanceSessionGuid })}`}>
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
