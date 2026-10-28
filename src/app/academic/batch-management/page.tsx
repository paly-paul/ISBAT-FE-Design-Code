'use client'
import { useMemo, useState } from 'react'
import { ScrollTable } from '@/components/ScrollTable'
import { ActionMenu } from '@/components/ActionMenu'
import { TableSearch } from '@/components/TableSearch'
import { FilterTh } from '@/components/FilterTh'
import { BatchFormModal } from '@/components/modals/academic/BatchFormModal'
import { ViewBatchModal } from '@/components/modals/academic/ViewBatchModal'
import { Toast } from '@/components/Toast'
import { EmptyState } from '@/components/EmptyState'
import { TableLoadingState } from '@/components/TableLoadingState'
import { Pagination } from '@/components/Pagination'
import { useBatchesInScope, useCreateBatch, useUpdateBatch, useDeleteBatch, useBatchStudentCount, Batch } from '@/hooks/academic/useBatches'
import { useEmployeeDropdown } from '@/hooks/employee/useEmployees'
import { usePagePermissions } from '@/hooks/users/usePagePermissions'
import { SearchSelect } from '@/components/SearchSelect'
import { InfiniteSearchSelect } from '@/components/InfiniteSearchSelect'
import { useCampusDropdown } from '@/hooks/config/useCampuses'
import { getIntakesPaged } from '@/lib/api/academic/intake'
import { EMPTY_GUID } from '@/lib/api/academic/batch'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// bStartDate/bEndDate come back as "2024-02-12T00:00:00" — display as
// "12 Feb 2024" rather than the raw ISO date.
function formatDisplayDate(dateStr?: string | null) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

// Fallback label when a row has no semesterName: semCode counts semesters
// across the whole programme (1, 2, 3…), two per year.
function semesterLabelFromCode(semCode: number): string {
  const year = Math.ceil(semCode / 2)
  const sem = semCode % 2 === 0 ? 2 : 1
  return `Year ${year} - Semester ${sem}`
}

function semesterName(r: Batch) {
  return r.semesterName || (r.semCode ? semesterLabelFromCode(r.semCode) : '—')
}

// 10 rows/page — same convention as the other master pages (Intake
// Master, Programme Group, Repetition Tag).
const PAGE_SIZE = 10
// Don't narrow the table (or open the search dropdown) until the user's
// typed at least this many characters — same convention as Intake Master /
// Skill Master's search boxes.
const MIN_SEARCH_CHARS = 2

// Batch Summary was merged into this page (2026-10-21), and its Head Count
// tab into the one batch table (2026-10-28): head count is a column there,
// and the stat tiles total the whole campus + intake scope.
// /academic/batch-summary redirects here.
export default function Page() {
  const permissions = usePagePermissions()
  const [openModals, setOpenModals] = useState<Set<string>>(new Set())
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [editingBatchGuid, setEditingBatchGuid] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Batch | null>(null)
  const [filters, setFilters] = useState<Record<string, string[]>>({})
  const [openFilter, setOpenFilter] = useState<string | null>(null)

  // ---- Scope: campus + intake ----
  // GET /academic/batches lists one intake at a time; no intake = the current
  // admission intake (the endpoint's default — it has no 'all intakes'). A
  // batch from an older intake shows up here when it has a session in the
  // listed one.
  const [campusGuid, setCampusGuid] = useState('')
  const [intakeGuid, setIntakeGuid] = useState('')
  const { data: campuses = [] } = useCampusDropdown()
  const { data, isLoading, isPlaceholderData } = useBatchesInScope({ campusGuid: campusGuid || null, intakeGuid: intakeGuid || null })
  const scopeRows = useMemo(() => data?.items ?? [], [data])
  const scopeLabel = [
    campusGuid ? (campuses.find(c => c.campusGuid === campusGuid)?.campusName ?? 'This campus') : 'All campuses',
    intakeGuid ? 'Selected intake' : 'Current intake',
  ].join(' · ')

  // Tiles total the campus + intake scope, not the search/column filters.
  const totalStudents = scopeRows.reduce((sum, r) => sum + (r.headCount ?? 0), 0)
  const avgBatchSize = scopeRows.length ? Math.round(totalStudents / scopeRows.length) : 0

  // bInChargeName/pHeadName come pre-resolved on the row; the employee list
  // is only fetched if a row has a guid without its name.
  const needsEmployeeLookup = scopeRows.some(r => (isSet(r.bInCharge) && !r.bInChargeName) || (isSet(r.pHead) && !r.pHeadName))
  const { data: employees = [] } = useEmployeeDropdown(needsEmployeeLookup)

  function isSet(guid?: string | null) {
    return !!guid && guid !== EMPTY_GUID
  }
  function employeeName(name?: string | null, guid?: string | null) {
    if (name?.trim()) return name.trim()
    if (!isSet(guid)) return '—'
    return employees.find(e => e.employeeGuid === guid)?.displayName || '—'
  }

  // The display value each filterable column filters on — same "filter on
  // what's shown" convention as the other Academic tables' FilterTh columns.
  const columnValue: Record<string, (r: Batch) => string> = {
    batchCode: r => r.batchCode || '—',
    programme: r => r.programName || '—',
    semester: semesterName,
    stream: r => r.streamName || '—',
    batchTime: r => r.batchTimeName || '—',
    inCharge: r => employeeName(r.bInChargeName, r.bInCharge),
    pHead: r => employeeName(r.pHeadName, r.pHead),
    startDate: r => formatDisplayDate(r.bStartDate),
    endDate: r => formatDisplayDate(r.bEndDate),
    status: r => (r.active ? 'Active' : 'Inactive'),
  }

  // Search, column filters and paging all run over the whole scope (every
  // batch for the campus + intake is loaded), so they cover every page, not
  // just the one on screen. Search matches the same fields GET /batches'
  // own search does.
  const searchTrimmed = search.trim()
  const activeSearch = searchTrimmed.length >= MIN_SEARCH_CHARS ? searchTrimmed.toLowerCase() : ''
  const searchedRows = activeSearch
    ? scopeRows.filter(r => [r.batchCode, r.programCode, r.programName, r.semesterName, r.streamName, r.batchTimeName].some(v => v?.toLowerCase().includes(activeSearch)))
    : scopeRows
  const filteredRows = searchedRows.filter(r =>
    Object.entries(filters).every(([col, vals]) => !vals.length || vals.includes(columnValue[col](r))),
  )
  const hasColumnFilters = Object.values(filters).some(v => v.length > 0)

  const totalCount = filteredRows.length
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pageItems = filteredRows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  // Live preview in the search dropdown — the searched rows, ignoring the
  // column filters, capped to a handful (same as Intake Master).
  const searchMatches = activeSearch ? searchedRows.slice(0, 8) : []

  // Options are the distinct values among the loaded rows, sorted; dates in
  // date order rather than alphabetically.
  function opts(col: string) {
    const values = [...new Set(scopeRows.map(columnValue[col]))]
    if (col === 'startDate' || col === 'endDate') {
      const field = col === 'startDate' ? 'bStartDate' : 'bEndDate'
      const time = new Map(scopeRows.map(r => [formatDisplayDate(r[field]), r[field] ? new Date(r[field]!).getTime() : 0]))
      return values.sort((a, b) => (time.get(a) ?? 0) - (time.get(b) ?? 0))
    }
    return values.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
  }

  function fth(label: string, col: string) {
    return (
      <FilterTh
        label={label}
        opts={opts(col)}
        isOpen={openFilter === col}
        activeFilter={filters[col] ?? []}
        onToggle={(e) => { e.stopPropagation(); setOpenFilter(p => p === col ? null : col) }}
        onSelect={(vals) => { setFilters(f => ({ ...f, [col]: vals })); setOpenFilter(null); setPage(1) }}
        onClear={() => { setFilters(f => ({ ...f, [col]: [] })); setOpenFilter(null); setPage(1) }}
        onClose={() => setOpenFilter(null)}
      />
    )
  }

  const createBatch = useCreateBatch()
  const updateBatch = useUpdateBatch()
  const deleteBatch = useDeleteBatch()

  function openModal(id: string) { setOpenModals(prev => new Set(prev).add(id)) }
  function closeModal(id: string) { setOpenModals(prev => { const s = new Set(prev); s.delete(id); return s }) }
  function showToast(msg: string, type = '') { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }

  function openEditModal(guid: string) {
    setEditingBatchGuid(guid)
    openModal('edit-batch-modal')
  }

  function openViewModal(guid: string) {
    setEditingBatchGuid(guid)
    openModal('view-batch-modal')
    setSearch('')
  }

  // Same as the other Academic tables: clears search and column filters.
  // The campus + intake scope stays — it's the page's context, not a filter.
  function clearFilters() {
    setSearch('')
    setFilters({})
    setPage(1)
  }

  // Scoped to just the batch being deleted (enabled only while the dialog is
  // open), so the confirmation can warn when students are still in it.
  const { data: deleteTargetStudentCount } = useBatchStudentCount(deleteTarget?.batchGuid ?? null, !!deleteTarget)

  function confirmDeleteBatch() {
    if (!deleteTarget) return
    deleteBatch.mutate(deleteTarget.batchGuid, {
      onSuccess: () => { setDeleteTarget(null); showToast('Batch deleted successfully', 'success') },
      onError: (error: Error) => showToast(error.message || 'Failed to delete batch', 'danger'),
    })
  }

  return (
    <>
      <div className="page active" id="page-batch-management">
        <div className="pg-hdr">
          <div><div className="pg-title">Batch Management</div><div className="pg-sub">Create batches per intake · Assign Batch In-Charge · Track head counts</div></div>
          <div className="flex items-center gap-3">
            {permissions.add && <button className="btn btn-primary" onClick={() => openModal('new-batch-modal')}><i className="lni lni-plus"></i> Create Batch</button>}
          </div>
        </div>

        {/* Scope for the whole page: stat tiles and the table. */}
        <div className="flex items-center gap-2 flex-wrap mb-3">
          <span className="text-sm font-semibold text-g600">Showing batches for</span>
          <SearchSelect
            style={{ width: 200 }}
            placeholder="All Campuses"
            options={campuses.map(c => ({ value: c.campusGuid, label: c.campusName }))}
            value={campusGuid}
            onChange={v => { setCampusGuid(v); setFilters({}); setPage(1) }}
          />
          <div style={{ width: 220 }}>
            <InfiniteSearchSelect
              queryKey={['intakes', 'batch-management']}
              fetchPage={getIntakesPaged}
              toOption={i => ({ value: i.intakeGuid, label: `${i.intakeCode} — ${i.description}` })}
              allLabel="Current Intake"
              value={intakeGuid}
              onChange={v => { setIntakeGuid(v); setFilters({}); setPage(1) }}
            />
          </div>
        </div>

        <div className="stats-row" style={{ opacity: isPlaceholderData ? 0.45 : 1, transition: 'opacity .15s ease' }}>
          <div className="stat-card"><div className="stat-lbl">Total Batches</div><div className="stat-num" style={{ color: 'var(--b700)' }}>{data ? scopeRows.length.toLocaleString() : '—'}</div><div className="stat-sub">{scopeLabel}</div></div>
          <div className="stat-card [--b700:var(--green)] [--b400:#34d399]"><div className="stat-lbl">Total Students</div><div className="stat-num" style={{ color: 'var(--green)' }}>{data ? totalStudents.toLocaleString() : '—'}</div><div className="stat-sub up">Across these batches</div></div>
          <div className="stat-card"><div className="stat-lbl">Avg Batch Size</div><div className="stat-num">{data ? avgBatchSize : '—'}</div><div className="stat-sub">students / batch</div></div>
        </div>

        <div className="card">
          <div className="flex items-center justify-end mb-4">
            <TableSearch
              className="w-64"
              placeholder="Search batch, programme…"
              value={search}
              onChange={v => { setSearch(v); setPage(1) }}
              results={searchMatches.map(r => ({ id: r.batchGuid, primary: r.batchCode, secondary: r.programName ?? '' }))}
              minChars={MIN_SEARCH_CHARS}
              onSelect={(r) => openViewModal(r.id)}
            />
          </div>
          <div className={`tbl-refetch-wrap${isPlaceholderData ? ' is-refetching' : ''}`} aria-busy={isPlaceholderData}>
            {isPlaceholderData && (
              <div className="tbl-refetch-pill" role="status">
                <i className="lni lni-reload" aria-hidden="true" /> Loading batches…
              </div>
            )}
            <ScrollTable filters={filters} onResetFilters={() => { setFilters({}); setPage(1) }}>
              <table>
                <thead>
                  <tr>
                    <th style={{ width: 48 }}></th>
                    <th style={{ width: 56 }}>Sl. No</th>
                    {fth('Batch Code', 'batchCode')}
                    {fth('Programme', 'programme')}
                    {fth('Semester', 'semester')}
                    {fth('Specialization', 'stream')}
                    {fth('Batch Time', 'batchTime')}
                    {fth('Batch In-Charge', 'inCharge')}
                    {fth('Programme Head', 'pHead')}
                    <th>Head Count</th>
                    {fth('Start Date', 'startDate')}
                    {fth('End Date', 'endDate')}
                    {fth('Status', 'status')}
                  </tr>
                </thead>
                <tbody>
                  {isLoading
                    ? <TableLoadingState colSpan={13} />
                    : pageItems.length === 0
                      ? <EmptyState colSpan={13} hasFilters={!!searchTrimmed || hasColumnFilters} onClearFilters={clearFilters} />
                      : pageItems.map((r, i) => {
                        const slNo = (safePage - 1) * PAGE_SIZE + i + 1
                        return (
                          // batchGuid alone isn't a safe key — a live response
                          // has been seen leaving it blank/duplicated across
                          // rows; the serial number is always unique.
                          <tr key={`${r.batchGuid || 'row'}-${slNo}`}>
                            <td>
                              <ActionMenu>
                                <button className="btn btn-neu btn-sm" onClick={() => openViewModal(r.batchGuid)}><i className="lni lni-eye"></i> View</button>
                                {permissions.edit && <button className="btn btn-neu btn-sm" onClick={() => openEditModal(r.batchGuid)}><i className="lni lni-pencil"></i> Edit</button>}
                                {permissions.delete && <button className="btn btn-neu btn-sm" onClick={() => setDeleteTarget(r)}><i className="lni lni-trash-can"></i> Delete</button>}
                              </ActionMenu>
                            </td>
                            <td className="text-g500 tabular-nums">{slNo}</td>
                            <td><span className="font-bold text-blue tabular-nums">{r.batchCode || '—'}</span></td>
                            <td>{r.programName || '—'}</td>
                            <td>{semesterName(r)}</td>
                            <td>{r.streamName || '—'}</td>
                            <td>{r.batchTimeName || '—'}</td>
                            <td>{employeeName(r.bInChargeName, r.bInCharge)}</td>
                            <td>{employeeName(r.pHeadName, r.pHead)}</td>
                            <td className="tabular-nums font-semibold">{r.headCount ?? 0}</td>
                            <td className="text-sm text-g600">{formatDisplayDate(r.bStartDate)}</td>
                            <td className="text-sm text-g600">{formatDisplayDate(r.bEndDate)}</td>
                            <td><span className={`badge ${r.active ? 'badge-green' : 'badge-grey'}`}>{r.active ? 'Active' : 'Inactive'}</span></td>
                          </tr>
                        )
                      })}
                </tbody>
              </table>
            </ScrollTable>
          </div>

          <Pagination page={safePage} totalPages={totalPages} totalCount={totalCount} itemLabel="batches" onPageChange={setPage} />
        </div>
      </div>
      {openModals.has('new-batch-modal') && (
        <BatchFormModal
          mode="new"
          isOpen
          onClose={() => closeModal('new-batch-modal')}
          showToast={showToast}
          batchGuid={null}
          createBatch={createBatch}
          updateBatch={updateBatch}
        />
      )}
      {openModals.has('edit-batch-modal') && (
        <BatchFormModal
          mode="edit"
          isOpen
          onClose={() => closeModal('edit-batch-modal')}
          showToast={showToast}
          batchGuid={editingBatchGuid}
          createBatch={createBatch}
          updateBatch={updateBatch}
        />
      )}
      {openModals.has('view-batch-modal') && (
        <ViewBatchModal canEdit={permissions.edit} onEdit={() => { closeModal('view-batch-modal'); openEditModal(editingBatchGuid || '') }}
          isOpen
          onClose={() => closeModal('view-batch-modal')}
          showToast={showToast}
          batchGuid={editingBatchGuid}
        />
      )}
      <Toast toast={toast} />

      {deleteTarget && (
        <div className="perm-delete-overlay" style={{ position: 'fixed', zIndex: 500 }} onClick={() => setDeleteTarget(null)}>
          <div className="perm-delete-card tab-panel-in" onClick={e => e.stopPropagation()}>
            <div className="perm-delete-icon"><i className="lni lni-trash-can"></i></div>
            <div className="perm-delete-title">Delete {deleteTarget.batchCode}?</div>
            <div className="perm-delete-sub">
              This will permanently delete this batch. This can&apos;t be undone.
            </div>
            {!!deleteTargetStudentCount && (
              <div className="warn-box mt-2 mb-1" style={{ textAlign: 'left' }}>
                <i className="lni lni-warning" style={{ color: 'var(--amber)', fontSize: 15, flexShrink: 0, marginTop: 1 }}></i>
                <div>
                  {deleteTargetStudentCount} student{deleteTargetStudentCount !== 1 ? 's are' : ' is'} currently enrolled in this batch. Deleting it won&apos;t remove them, but they&apos;ll be left without a valid batch.
                </div>
              </div>
            )}
            <div className="perm-delete-actions">
              <button className="btn btn-neu" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="btn btn-danger" disabled={deleteBatch.isPending} onClick={confirmDeleteBatch}>
                <i className="lni lni-trash-can"></i> {deleteBatch.isPending ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
