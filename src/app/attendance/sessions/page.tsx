'use client'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { ScrollTable } from '@/components/ScrollTable'
import { ActionMenu } from '@/components/ActionMenu'
import { SearchSelect } from '@/components/SearchSelect'
import { EmptyState } from '@/components/EmptyState'
import { TableLoadingState } from '@/components/TableLoadingState'
import { Pagination } from '@/components/Pagination'
import { Toast } from '@/components/Toast'
import { usePagePermissions } from '@/hooks/users/usePagePermissions'
import {
  useAttendanceBatches, useAttendanceCourseUnits, useAttendanceSessions, useAttendanceTimetables, useDeleteAttendanceSession,
} from '@/hooks/attendance/useClassAttendance'
import { getAttendanceSessions, parseYmd, skipReasonLabel, type AttendanceSessionListItem } from '@/lib/api/attendance/classAttendance'
import { fmtDate, fmtTime, StatusBadge, TypeChip } from '@/components/attendance/attShared'

// Attendance Sessions (class-attendance-frontend-spec.md, Screen 3) — the
// paginated management view of every recorded session. Row actions live in
// the first-column action menu, like the app's other tables.

const PAGE_SIZES = [10, 25, 50].map(n => ({ value: String(n), label: String(n) }))
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const WEEKDAYS_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default function Page() {
  const router = useRouter()
  const permissions = usePagePermissions()
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)
  function showToast(msg: string, type = '') { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }

  const { data: batches = [] } = useAttendanceBatches()
  const { data: courseUnits = [] } = useAttendanceCourseUnits()
  const { data: timetables = [] } = useAttendanceTimetables()
  const timetableByGuid = useMemo(() => new Map(timetables.map(t => [t.timetableGuid, t])), [timetables])

  // Filters apply on Apply, not as they change.
  const [batchGuid, setBatchGuid] = useState('')
  const [courseUnitGuid, setCourseUnitGuid] = useState('')
  const [applied, setApplied] = useState<{ batchGuid?: string; courseUnitGuid?: string }>({})
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [deleteTarget, setDeleteTarget] = useState<AttendanceSessionListItem | null>(null)

  const { data, isLoading, isPlaceholderData } = useAttendanceSessions(page, pageSize, applied)
  const rows = data?.items ?? []
  const totalCount = data?.totalCount ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const hasFilters = !!applied.batchGuid || !!applied.courseUnitGuid
  const pending = batchGuid !== (applied.batchGuid ?? '') || courseUnitGuid !== (applied.courseUnitGuid ?? '')

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

  function apply() {
    setApplied({ batchGuid: batchGuid || undefined, courseUnitGuid: courseUnitGuid || undefined })
    setPage(1)
  }

  function clear() {
    setBatchGuid('')
    setCourseUnitGuid('')
    setApplied({})
    setPage(1)
  }

  function open(r: AttendanceSessionListItem, mode: 'view' | 'edit') {
    router.push(`/attendance/record?session=${r.attendanceSessionGuid}&mode=${mode}`)
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

        <div className="card as-panel">
          {/* ── Filters ── */}
          <div className="as-filters">
            <div className="fg m-0 as-filter">
              <div className="lbl">Batch</div>
              <SearchSelect placeholder="— Select Batch —" options={batches} value={batchGuid} onChange={setBatchGuid} />
            </div>
            <div className="fg m-0 as-filter">
              <div className="lbl">Course Unit</div>
              <SearchSelect placeholder="— Select Course Unit —" options={courseUnits} value={courseUnitGuid} onChange={setCourseUnitGuid} />
            </div>
            <div className="as-filter-actions">
              <button type="button" className="btn btn-primary" onClick={apply} disabled={!pending}><i className="lni lni-search-alt" aria-hidden="true"></i> Apply</button>
              <button type="button" className="btn btn-neu" onClick={clear} disabled={!hasFilters && !batchGuid && !courseUnitGuid}><i className="lni lni-close" aria-hidden="true"></i> Clear</button>
            </div>
          </div>

          {hasFilters && (
            <div className="as-applied">
              <i className="lni lni-funnel" aria-hidden="true"></i>
              Showing
              {applied.batchGuid && <span className="as-applied-tag">{batches.find(b => b.value === applied.batchGuid)?.label}</span>}
              {applied.courseUnitGuid && <span className="as-applied-tag">{courseUnits.find(c => c.value === applied.courseUnitGuid)?.label}</span>}
              <span className="as-applied-count">· {totalCount} session{totalCount === 1 ? '' : 's'}</span>
            </div>
          )}

          <div className={`tbl-refetch-wrap${isPlaceholderData ? ' is-refetching' : ''}`} aria-busy={isPlaceholderData}>
            <ScrollTable>
              <table className="as-table">
                <thead>
                  <tr>
                    <th style={{ width: 48 }}></th>
                    <th style={{ width: 56 }}>##</th>
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
                    const t = timetableByGuid.get(r.timetableGuid)
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
                        <td className="text-g500 tabular-nums">{(page - 1) * pageSize + i + 1}</td>
                        <td>
                          <div className="as-date">
                            <span className="as-date-tile" aria-hidden="true">
                              <span className="as-date-mon">{MONTHS[d.getMonth()]}</span>
                              <span className="as-date-day tabular-nums">{d.getDate()}</span>
                            </span>
                            <span className="as-date-text">
                              <span className="as-date-full">{fmtDate(r.sessionDate)}</span>
                              <span className="as-date-sub">{WEEKDAYS_LONG[d.getDay()]}</span>
                            </span>
                          </div>
                        </td>
                        <td>
                          {t ? (
                            <div className="as-class">
                              <span className="as-class-name"><span className="as-code">{t.courseUnitCode}</span> {t.courseUnitName}</span>
                              <span className="as-class-batch"><i className="lni lni-users" aria-hidden="true"></i> {t.batchCode}</span>
                            </div>
                          ) : <span className="text-g400">—</span>}
                        </td>
                        <td className="as-time tabular-nums">{fmtTime(r.startTime)}</td>
                        <td className="as-time tabular-nums">{fmtTime(r.endTime)}</td>
                        <td>
                          <div className="as-status">
                            <StatusBadge status={r.status} />
                            {r.isSkipped && (
                              <span className="as-skip"><i className="lni lni-information" aria-hidden="true"></i> {skipReasonLabel(r.skipReason) ?? 'Skipped'}</span>
                            )}
                          </div>
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
