'use client'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQueries, useQuery } from '@tanstack/react-query'
import { ScrollTable } from '@/components/ScrollTable'
import { ActionMenu } from '@/components/ActionMenu'
import { SearchSelect } from '@/components/SearchSelect'
import { EmptyState } from '@/components/EmptyState'
import { TableLoadingState } from '@/components/TableLoadingState'
import { Pagination } from '@/components/Pagination'
import { Toast } from '@/components/Toast'
import { usePagePermissions } from '@/hooks/users/usePagePermissions'
import {
  useAttendanceBatches, useAttendanceCourseUnits, useAttendanceSessions, useDeleteAttendanceSession,
} from '@/hooks/attendance/useClassAttendance'
import {
  getAttendanceSessions, getTimetableForAttendance, parseYmd, skipReasonLabel, type AttendanceSessionListItem, type AttendanceTimetable,
} from '@/lib/api/attendance/classAttendance'
import { fmtDate, fmtTime, StatusBadge, TypeChip } from '@/components/attendance/attShared'

// Attendance Sessions (class-attendance-frontend-spec.md, Screen 3) — the
// paginated management view of every recorded session. Row actions live in
// the first-column action menu, like the app's other tables.

const PAGE_SIZES = [10, 25, 50].map(n => ({ value: String(n), label: String(n) }))
const WEEKDAYS_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default function Page() {
  const router = useRouter()
  const permissions = usePagePermissions()
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)
  function showToast(msg: string, type = '') { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }

  const { data: batches = [] } = useAttendanceBatches()
  const { data: courseUnits = [] } = useAttendanceCourseUnits()

  // Filters apply as they change, like Batch Management's scope dropdowns.
  const [batchGuid, setBatchGuid] = useState('')
  const [courseUnitGuid, setCourseUnitGuid] = useState('')
  const applied = useMemo(
    () => ({ batchGuid: batchGuid || undefined, courseUnitGuid: courseUnitGuid || undefined }),
    [batchGuid, courseUnitGuid],
  )
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [deleteTarget, setDeleteTarget] = useState<AttendanceSessionListItem | null>(null)

  const { data, isLoading, isPlaceholderData } = useAttendanceSessions(page, pageSize, applied)
  const rows = useMemo(() => data?.items ?? [], [data])
  const totalCount = data?.totalCount ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const hasFilters = !!applied.batchGuid || !!applied.courseUnitGuid

  // Totals for the summary chips, over every session matching the filters.
  const { data: all } = useQuery({
    queryKey: ['classAttendance', 'list', 'summary', applied.batchGuid ?? '', applied.courseUnitGuid ?? ''],
    queryFn: () => getAttendanceSessions(1, 10000, applied),
  })
  const summary = useMemo(() => {
    const items = all?.items ?? []
    return {
      total: all?.totalCount ?? 0,
      completed: items.filter(s => s.status === 1).length,
      skipped: items.filter(s => s.status === 3).length,
      cancelled: items.filter(s => s.status === 2).length,
      biometric: items.filter(s => s.isAutomated).length,
    }
  }, [all])

  const deleteSession = useDeleteAttendanceSession()

  function clear() {
    setBatchGuid('')
    setCourseUnitGuid('')
    setPage(1)
  }

  // The list gives each session's timetable guid only; its class (unit,
  // batch) is looked up once per timetable on the page and cached.
  const pageTimetableGuids = useMemo(() => Array.from(new Set(rows.map(r => r.timetableGuid).filter(Boolean))), [rows])
  const timetableLookups = useQueries({
    queries: pageTimetableGuids.map(guid => ({
      queryKey: ['classAttendance', 'timetable', guid],
      queryFn: () => getTimetableForAttendance(guid),
      staleTime: Infinity,
    })),
  })
  const timetableByGuid = new Map<string, { data?: AttendanceTimetable | null; isPending: boolean }>(
    pageTimetableGuids.map((g, i) => [g, timetableLookups[i]]),
  )

  // No get-session-by-guid endpoint: Record Attendance loads a session by
  // its timetable and date, so the link carries both.
  function open(r: AttendanceSessionListItem, mode: 'view' | 'edit') {
    const q = new URLSearchParams({ timetable: r.timetableGuid, date: r.sessionDate.slice(0, 10), session: r.attendanceSessionGuid, mode })
    router.push(`/attendance/record?${q}`)
  }

  function confirmDelete() {
    if (!deleteTarget) return
    deleteSession.mutate(deleteTarget.attendanceSessionGuid, {
      onSuccess: () => { setDeleteTarget(null); showToast('Session deleted successfully', 'success') },
      onError: (e: Error) => showToast(e.message || 'Failed to delete the session', 'danger'),
    })
  }

  const chips = [
    { key: 'total', label: 'Sessions', value: summary.total, tone: '' },
    { key: 'completed', label: 'Completed', value: summary.completed, tone: 'green' },
    { key: 'skipped', label: 'Skipped', value: summary.skipped, tone: 'orange' },
    { key: 'cancelled', label: 'Cancelled', value: summary.cancelled, tone: 'grey' },
    { key: 'biometric', label: 'Biometric', value: summary.biometric, tone: 'purple' },
  ]

  return (
    <>
      <div className="page active" id="page-attendance-sessions">
        <div className="pg-hdr">
          <div>
            <div className="pg-title">Attendance Sessions</div>
            <div className="pg-sub">All recorded class sessions, manual and biometric</div>
          </div>
        </div>

        <div className="as-chips" aria-live="polite">
          {chips.map(c => (
            <div key={c.key} className={`as-chip${c.tone ? ` as-chip--${c.tone}` : ''}`}>
              <span className="as-chip-num tabular-nums">{all ? c.value : '—'}</span>
              <span className="as-chip-lbl">{c.label}</span>
            </div>
          ))}
        </div>

        {/* Scope for the chips and the table, in Batch Management's style:
            an inline label and fixed-width dropdowns that apply on change,
            sitting between the chips and the table. */}
        <div className="flex items-center gap-2 flex-wrap mb-3">
          <span className="text-sm font-semibold text-g600">Showing sessions for</span>
          <SearchSelect
            style={{ width: 200 }}
            placeholder="All Batches"
            options={batches}
            value={batchGuid}
            onChange={v => { setBatchGuid(v); setPage(1) }}
          />
          <SearchSelect
            style={{ width: 280 }}
            placeholder="All Course Units"
            options={courseUnits}
            value={courseUnitGuid}
            onChange={v => { setCourseUnitGuid(v); setPage(1) }}
          />
        </div>

        <div className="card as-panel">
          <div className={`tbl-refetch-wrap${isPlaceholderData ? ' is-refetching' : ''}`} aria-busy={isPlaceholderData}>
            <ScrollTable>
              <table>
                <thead>
                  <tr>
                    <th style={{ width: 48 }}></th>
                    <th>#</th>
                    <th>Date</th>
                    <th>Class</th>
                    <th>Start</th>
                    <th>End</th>
                    <th>Status</th>
                    <th>Type</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <TableLoadingState colSpan={8} />
                  ) : rows.length === 0 ? (
                    <EmptyState colSpan={8} hasFilters={hasFilters} onClearFilters={clear} title={hasFilters ? undefined : 'No sessions recorded yet'} />
                  ) : rows.map((r, i) => {
                    const canEdit = permissions.edit && !r.isAutomated && r.status !== 2
                    const lookup = timetableByGuid.get(r.timetableGuid)
                    const t = lookup?.data ?? null
                    const d = parseYmd(r.sessionDate)
                    return (
                      <tr key={r.attendanceSessionGuid}>
                        <td>
                          <ActionMenu>
                            <button className="btn btn-neu btn-sm" onClick={() => open(r, 'view')}><i className="lni lni-eye"></i> View</button>
                            {canEdit && <button className="btn btn-neu btn-sm" onClick={() => open(r, 'edit')}><i className="lni lni-pencil"></i> Edit</button>}
                            {permissions.delete && <button className="btn btn-neu btn-sm" onClick={() => setDeleteTarget(r)}><i className="lni lni-trash-can"></i> Delete</button>}
                          </ActionMenu>
                        </td>
                        <td className="text-g400">{(page - 1) * pageSize + i + 1}</td>
                        <td>
                          <strong>{fmtDate(r.sessionDate)}</strong><br />
                          <span className="text-g400" style={{ fontSize: 'var(--fs-xs)' }}>{WEEKDAYS_LONG[d.getDay()]}</span>
                        </td>
                        <td>
                          {t ? (
                            <>
                              <strong className="text-b700">{t.courseUnitCode}</strong> {t.courseUnitName}<br />
                              <span className="text-g400" style={{ fontSize: 'var(--fs-xs)' }}>{t.batchCode}</span>
                            </>
                          ) : lookup?.isPending ? <span className="fd-skel" style={{ width: 160 }} /> : <span className="text-g400">—</span>}
                        </td>
                        <td>{fmtTime(r.startTime)}</td>
                        <td>{fmtTime(r.endTime)}</td>
                        <td>
                          <StatusBadge status={r.status} />
                          {r.isSkipped && (
                            <><br /><span className="text-g400" style={{ fontSize: 'var(--fs-xs)' }}>{skipReasonLabel(r.skipReason) ?? 'Skipped'}</span></>
                          )}
                        </td>
                        <td><TypeChip automated={r.isAutomated} /></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </ScrollTable>
          </div>

          <div className="as-footer">
            <label className="as-page-size">
              Show
              <SearchSelect style={{ width: 80 }} options={PAGE_SIZES} value={String(pageSize)} onChange={v => { setPageSize(+v); setPage(1) }} />
              per page
            </label>
            <Pagination page={page} totalPages={totalPages} totalCount={totalCount} itemLabel="sessions" onPageChange={setPage} />
          </div>
        </div>
      </div>

      {/* ── Delete Confirmation Dialog ── */}
      {deleteTarget && (
        <div className="perm-delete-overlay" style={{ position: 'fixed', zIndex: 500 }}>
          <div className="perm-delete-card tab-panel-in" role="alertdialog" aria-labelledby="att-del-title" aria-describedby="att-del-sub">
            <div className="perm-delete-icon"><i className="lni lni-trash-can"></i></div>
            <div className="perm-delete-title" id="att-del-title">Delete Session</div>
            <div className="perm-delete-sub" id="att-del-sub">
              Are you sure you want to delete the session for {fmtDate(deleteTarget.sessionDate)}?<br />This action cannot be undone.
            </div>
            <div className="perm-delete-actions">
              <button className="btn btn-neu" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="btn btn-danger" disabled={deleteSession.isPending} onClick={confirmDelete}>
                <i className="lni lni-trash-can"></i> {deleteSession.isPending ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
      <Toast toast={toast} />
    </>
  )
}
