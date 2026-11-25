'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ScrollTable } from '@/components/ScrollTable'
import { ActionMenu } from '@/components/ActionMenu'
import { TableSearch } from '@/components/TableSearch'
import { Toast } from '@/components/Toast'
import { EmptyState } from '@/components/EmptyState'
import { TableLoadingState } from '@/components/TableLoadingState'
import { Pagination } from '@/components/Pagination'
import { useServerTable } from '@/hooks/useServerTable'
import { getBatchTimesPaged } from '@/lib/api/academic/batchTime'
import { BatchTimeFormModal } from '@/components/modals/config/BatchTimeFormModal'
import { ViewBatchTimeModal } from '@/components/modals/config/ViewBatchTimeModal'
import { BATCH_TIMES_KEY, useCreateBatchTime, useUpdateBatchTime, useDeleteBatchTime, BatchTime } from '@/hooks/config/useBatchTimes'
import { usePagePermissions } from '@/hooks/users/usePagePermissions'

const PAGE_SIZE = 10
// Don't narrow the table (or open the search dropdown) until the user's
// typed at least this many characters — same convention as the other
// master pages' search boxes.
const MIN_SEARCH_CHARS = 2

export default function Page() {
  const router = useRouter()
  const permissions = usePagePermissions()
  const [openModals, setOpenModals] = useState<Set<string>>(new Set())
  const [toast, setToast]           = useState<{ msg: string; type: string } | null>(null)
  const [editingBatchTimeGuid, setEditingBatchTimeGuid] = useState<string | null>(null)
  const [viewingBatchTimeGuid, setViewingBatchTimeGuid] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<BatchTime | null>(null)

  // One page at a time from the server (?page=&pageSize=&search=), so the
  // search box narrows the whole list, not just the rows on screen.
  const table = useServerTable({ queryKey: BATCH_TIMES_KEY, fetchPage: getBatchTimesPaged, pageSize: PAGE_SIZE, minSearch: MIN_SEARCH_CHARS })
  const { items: rows, search, setSearch, page, setPage, totalPages, totalCount } = table
  const isLoading = table.isLoading || table.searchPending
  const createBatchTime = useCreateBatchTime()
  const updateBatchTime = useUpdateBatchTime()
  const deleteBatchTime = useDeleteBatchTime()

  // Search-box preview: the first of the server's matches.
  const searchMatches = search.trim().length >= MIN_SEARCH_CHARS && !table.searchPending ? rows.slice(0, 8) : []
  const pageItems = table.searchPending ? [] : rows

  function nav(id: string) { router.push('/config/' + id) }
  function openModal(id: string)  { setOpenModals(prev => new Set(prev).add(id)) }
  function closeModal(id: string) { setOpenModals(prev => { const s = new Set(prev); s.delete(id); return s }) }
  function showToast(msg: string, type = '') { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }

  function openEditModal(guid: string) {
    setEditingBatchTimeGuid(guid)
    openModal('edit-batch-time-modal')
  }

  function openViewModal(guid: string) {
    setViewingBatchTimeGuid(guid)
    openModal('view-batch-time-modal')
    setSearch('')
  }

  function confirmDeleteBatchTime() {
    if (!deleteTarget) return
    deleteBatchTime.mutate(deleteTarget.batchTimeGuid, {
      onSuccess: () => { setDeleteTarget(null); showToast('Batch time deleted successfully', 'success') },
      onError: (error: Error) => showToast(error.message || 'Failed to delete batch time', 'error'),
    })
  }

  return (
    <>
      <div className="page active">
        <div className="pg-hdr">
          <div>
            <div className="pg-title">Batch Time Master</div>
            <div className="pg-sub">Manage the named study sessions/shifts used across scheduling and timetables</div>
          </div>
          {permissions.add && (
            <button className="btn btn-primary" onClick={() => openModal('new-batch-time-modal')}>
              <i className="lni lni-plus"></i> Add Batch Time
            </button>
          )}
        </div>
        <div className="card">
          <div className="card-hdr">
            <div className="card-title"><span className="ctitle-icon"><i className="lni lni-timer"></i></span> Batch Times</div>
            <div className="flex gap-2">
              <TableSearch
                className="w-56"
                placeholder="Search by code or name…"
                value={search}
                onChange={setSearch}
                results={searchMatches.map(r => ({ id: r.batchTimeGuid, primary: r.batchTimeCode, secondary: r.batchTime }))}
                minChars={MIN_SEARCH_CHARS}
                loading={table.searchPending}
                onSelect={(r) => openViewModal(r.id)}
              />
            </div>
          </div>
          <ScrollTable>
            <table>
              <thead>
                <tr>
                  <th style={{ width: 48 }}></th>
                  <th>Code</th>
                  <th>Batch Time</th>
                </tr>
              </thead>
              <tbody>
                {isLoading
                  ? <TableLoadingState colSpan={999} />
                  : pageItems.length === 0
                    ? <EmptyState colSpan={999} hasFilters={false} onClearFilters={() => {}} />
                    : null}
                {pageItems.map((r) => (
                  <tr key={r.batchTimeGuid}>
                    <td>
                      {(true) && (
                        <ActionMenu>
                          <button className="btn btn-neu btn-sm" onClick={() => openViewModal(r.batchTimeGuid)}><i className="lni lni-eye"></i> View</button>
                          {permissions.edit && <button className="btn btn-neu btn-sm" onClick={() => openEditModal(r.batchTimeGuid)}>
                            <i className="lni lni-pencil"></i> Edit
                          </button>}
                          {permissions.delete && <button className="btn btn-neu btn-sm" onClick={() => setDeleteTarget(r)}>
                            <i className="lni lni-trash-can"></i> Delete
                          </button>}
                        </ActionMenu>
                      )}
                    </td>
                    <td className="font-mono font-bold uppercase">{r.batchTimeCode}</td>
                    <td><strong>{r.batchTime}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollTable>
          <Pagination page={page} totalPages={totalPages} totalCount={totalCount} itemLabel="batch times" onPageChange={setPage} />
        </div>
      </div>
      <BatchTimeFormModal
        mode="new"
        isOpen={openModals.has('new-batch-time-modal')}
        onClose={() => closeModal('new-batch-time-modal')}
        showToast={showToast}
        batchTimeGuid={null}
        createBatchTime={createBatchTime}
        updateBatchTime={updateBatchTime}
      />
      <BatchTimeFormModal
        mode="edit"
        isOpen={openModals.has('edit-batch-time-modal')}
        onClose={() => closeModal('edit-batch-time-modal')}
        showToast={showToast}
        batchTimeGuid={editingBatchTimeGuid}
        createBatchTime={createBatchTime}
        updateBatchTime={updateBatchTime}
      />
      <ViewBatchTimeModal
        isOpen={openModals.has('view-batch-time-modal')}
        onClose={() => closeModal('view-batch-time-modal')}
        showToast={showToast}
        batchTimeGuid={viewingBatchTimeGuid}
        canEdit={Boolean(permissions.edit)}
        onEdit={() => {
          closeModal('view-batch-time-modal')
          openEditModal(viewingBatchTimeGuid!)
        }}
      />
      <Toast toast={toast} />

      {deleteTarget && (
        <div className="perm-delete-overlay" style={{ position: 'fixed', zIndex: 500 }} onClick={() => setDeleteTarget(null)}>
          <div className="perm-delete-card tab-panel-in" onClick={e => e.stopPropagation()}>
            <div className="perm-delete-icon"><i className="lni lni-trash-can"></i></div>
            <div className="perm-delete-title">Delete {deleteTarget.batchTime}?</div>
            <div className="perm-delete-sub">
              This will permanently delete this batch time. This can&apos;t be undone.
            </div>
            <div className="perm-delete-actions">
              <button className="btn btn-neu" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="btn btn-danger" disabled={deleteBatchTime.isPending} onClick={confirmDeleteBatchTime}>
                <i className="lni lni-trash-can"></i> {deleteBatchTime.isPending ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
