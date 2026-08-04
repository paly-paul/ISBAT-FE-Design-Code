'use client'
import { useState, useMemo } from 'react'
import { useQueries } from '@tanstack/react-query'
import { ScrollTable } from '@/components/ScrollTable'
import { ActionMenu } from '@/components/ActionMenu'
import { TableSearch } from '@/components/TableSearch'
import { NewBatchModal } from '@/components/modals/academic/NewBatchModal'
import { EditBatchModal } from '@/components/modals/academic/EditBatchModal'
import { Toast } from '@/components/Toast'
import { EmptyState } from '@/components/EmptyState'
import { TableLoadingState } from '@/components/TableLoadingState'
import { Pagination } from '@/components/Pagination'
import { usePagination } from '@/hooks/usePagination'
import { useBatches, useCreateBatch, useUpdateBatch, useDeleteBatch, Batch } from '@/hooks/academic/useBatches'
import { useProgramMasters } from '@/hooks/academic/useProgramMaster'
import { useStreams } from '@/hooks/config/useStreams'
import { useBatchTimes } from '@/hooks/config/useBatchTimes'
import { usePagePermissions } from '@/hooks/users/usePagePermissions'
import { getSemestersForProgram } from '@/lib/api/academic/semester'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// bStartDate/bEndDate come back as "2024-02-12T00:00:00" — display as
// "12 Feb 2024" rather than the raw ISO date.
function formatDisplayDate(iso: string | null): string {
  if (!iso) return '—'
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number)
  if (!y || !m || !d) return '—'
  return `${d} ${MONTHS[m - 1]} ${y}`
}

const PAGE_SIZE = 20
// Load enough rows to cover the full batch list (333+ seen in practice) in
// one request, same "load it all, search/paginate client-side" convention
// as useEmployees/useFaculties — a search box only makes sense against the
// whole dataset, not whatever 20-row server page happens to be loaded.
const BATCHES_LOAD_SIZE = 1000

export default function Page() {
  const permissions = usePagePermissions()
  const [openModals, setOpenModals] = useState<Set<string>>(new Set())
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)
  const [search, setSearch] = useState('')
  const [editingBatchGuid, setEditingBatchGuid] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Batch | null>(null)

  const { data, isLoading } = useBatches(1, BATCHES_LOAD_SIZE)
  const serverTotalCount = data?.totalCount ?? 0
  // Batch has no createdAt field — bStartDate is the only temporal signal
  // available, so "newest to oldest" sorts by that, descending.
  const sortedRows = useMemo(
    () => [...(data?.items ?? [])].sort((a, b) => (b.bStartDate ?? '').localeCompare(a.bStartDate ?? '')),
    [data],
  )
  const filteredRows = useMemo(
    () => sortedRows.filter(r => !search || r.batchCode.toLowerCase().includes(search.toLowerCase())),
    [sortedRows, search],
  )
  const { page, setPage, totalPages, totalCount, pageItems } = usePagination(filteredRows, PAGE_SIZE)
  const createBatch = useCreateBatch()
  const updateBatch  = useUpdateBatch()
  const deleteBatch  = useDeleteBatch()

  const { data: programs = [] }   = useProgramMasters()
  const { data: streams = [] }    = useStreams()
  const { data: batchTimes = [] } = useBatchTimes()

  function programName(programGuid: string) {
    return programs.find(p => p.programGuid === programGuid)?.programName ?? '—'
  }
  function streamName(streamGuid: string) {
    return streams.find(s => s.streamGuid === streamGuid)?.streamName ?? '—'
  }
  function batchTimeName(batchTimeGuid: string) {
    return batchTimes.find(b => b.batchTimeGuid === batchTimeGuid)?.batchTime ?? '—'
  }

  const searchMatches = useMemo(
    () => search.trim()
      ? sortedRows.filter(r => r.batchCode.toLowerCase().includes(search.trim().toLowerCase())).slice(0, 8)
      : [],
    [sortedRows, search],
  )

  // Semester is still scoped per-programme (no global semester list, only
  // GET .../semesters/dropdownforprogram?programGuid=), so resolving a name
  // means fetching each distinct programme's semester list and matching by
  // the row's real semesterGuid — a real lookup now, not a position guess.
  // Scoped to just the currently visible page (not the whole loaded
  // dataset) to avoid firing one parallel request per distinct programme
  // across all 300+ batches at once.
  const programGuidsOnPage = useMemo(() => Array.from(new Set(pageItems.map(r => r.programGuid))), [pageItems])

  const semesterQueries = useQueries({
    queries: programGuidsOnPage.map(programGuid => ({
      queryKey: ['semesters', 'forProgram', programGuid],
      queryFn: () => getSemestersForProgram(programGuid),
      staleTime: Infinity,
      gcTime: Infinity,
    })),
  })

  const semestersByProgram = useMemo(() => {
    const map: Record<string, { semesterGuid: string; semName: string }[]> = {}
    programGuidsOnPage.forEach((guid, i) => { map[guid] = semesterQueries[i]?.data ?? [] })
    return map
  }, [programGuidsOnPage, semesterQueries])

  function semesterName(programGuid: string, semesterGuid: string) {
    return (semestersByProgram[programGuid] ?? []).find(s => s.semesterGuid === semesterGuid)?.semName ?? '—'
  }

  function openModal(id: string) { setOpenModals(prev => new Set(prev).add(id)) }
  function closeModal(id: string) { setOpenModals(prev => { const s = new Set(prev); s.delete(id); return s }) }
  function showToast(msg: string, type = '') { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }

  function openEditModal(guid: string) {
    setEditingBatchGuid(guid)
    openModal('edit-batch-modal')
  }

  function confirmDeleteBatch() {
    if (!deleteTarget) return
    deleteBatch.mutate(deleteTarget.batchGuid, {
      onSuccess: () => { setDeleteTarget(null); showToast('Batch deleted successfully') },
      onError: (error: Error) => showToast(error.message || 'Failed to delete batch', 'error'),
    })
  }

  return (
    <>
      <div className="page active">
        <div className="pg-hdr">
          <div><div className="pg-title">Batch Management</div><div className="pg-sub">Create batches per intake · Assign Batch In-Charge</div></div>
          <div className="flex items-center gap-3">
            <TableSearch
              className="w-56"
              placeholder="Search by batch code…"
              value={search}
              onChange={setSearch}
              results={searchMatches.map(r => ({ id: r.batchGuid, primary: r.batchCode, secondary: programName(r.programGuid) }))}
            />
            {permissions.add && <button className="btn btn-primary" onClick={() => openModal('new-batch-modal')}><i className="lni lni-plus"></i> Create Batch</button>}
          </div>
        </div>

        <div className="g4 mb-[18px]">
          <div className="stat-card"><div className="stat-lbl">Total Batches</div><div className="stat-num">{serverTotalCount.toLocaleString()}</div></div>
        </div>

        <div className="card">
          <div className="card-hdr">
            <div className="card-title"><span className="ctitle-icon"><i className="lni lni-users"></i></span> Batches</div>
          </div>
          <ScrollTable>
            <table>
              <thead>
                <tr>
                  <th style={{ width: 48 }}></th>
                  <th>Batch Code</th>
                  <th>Programme</th>
                  <th>Semester</th>
                  <th>Specialization</th>
                  <th>Batch Time</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {isLoading
                  ? <TableLoadingState colSpan={999} />
                  : filteredRows.length === 0
                    ? <EmptyState colSpan={999} hasFilters={!!search} onClearFilters={() => setSearch('')} />
                    : null}
                {pageItems.map(r => (
                  <tr key={r.batchGuid}>
                    <td>
                      {(permissions.edit || permissions.delete) && (
                        <ActionMenu>
                          {permissions.edit && <button className="btn btn-neu btn-sm" onClick={() => openEditModal(r.batchGuid)}><i className="lni lni-pencil"></i> Edit</button>}
                          {permissions.delete && <button className="btn btn-neu btn-sm" onClick={() => setDeleteTarget(r)}><i className="lni lni-trash-can"></i> Delete</button>}
                        </ActionMenu>
                      )}
                    </td>
                    <td><span className="font-bold font-mono text-blue">{r.batchCode}</span></td>
                    <td>{programName(r.programGuid)}</td>
                    <td>{semesterName(r.programGuid, r.semesterGuid)}</td>
                    <td>{streamName(r.streamGuid)}</td>
                    <td>{batchTimeName(r.batchTimeGuid)}</td>
                    <td className="text-sm text-g600">{formatDisplayDate(r.bStartDate)}</td>
                    <td className="text-sm text-g600">{formatDisplayDate(r.bEndDate)}</td>
                    <td><span className={`badge ${r.active ? 'badge-green' : 'badge-grey'}`}>{r.active ? 'Active' : 'Inactive'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollTable>

          <Pagination page={page} totalPages={totalPages} totalCount={totalCount} itemLabel="batches" onPageChange={setPage} />
        </div>
      </div>
      <NewBatchModal isOpen={openModals.has('new-batch-modal')} onClose={() => closeModal('new-batch-modal')} showToast={showToast} createBatch={createBatch} />
      <EditBatchModal
        isOpen={openModals.has('edit-batch-modal')}
        onClose={() => closeModal('edit-batch-modal')}
        showToast={showToast}
        batchGuid={editingBatchGuid}
        updateBatch={updateBatch}
      />
      <Toast toast={toast} />

      {deleteTarget && (
        <div className="perm-delete-overlay" style={{ position: 'fixed', zIndex: 500 }} onClick={() => setDeleteTarget(null)}>
          <div className="perm-delete-card tab-panel-in" onClick={e => e.stopPropagation()}>
            <div className="perm-delete-icon"><i className="lni lni-trash-can"></i></div>
            <div className="perm-delete-title">Delete {deleteTarget.batchCode}?</div>
            <div className="perm-delete-sub">
              This will permanently delete this batch. This can&apos;t be undone.
            </div>
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
