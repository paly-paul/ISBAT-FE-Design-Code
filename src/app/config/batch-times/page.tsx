'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ScrollTable } from '@/components/ScrollTable'
import { ActionMenu } from '@/components/ActionMenu'
import { Toast } from '@/components/Toast'
import { EmptyState } from '@/components/EmptyState'
import { TableLoadingState } from '@/components/TableLoadingState'
import { Pagination } from '@/components/Pagination'
import { usePagination } from '@/hooks/usePagination'
import { NewBatchTimeModal } from '@/components/modals/academic/NewBatchTimeModal'
import { EditBatchTimeModal } from '@/components/modals/academic/EditBatchTimeModal'
import { useBatchTimes, useCreateBatchTime, useUpdateBatchTime, useDeleteBatchTime, BatchTime } from '@/hooks/config/useBatchTimes'

const PAGE_SIZE = 10

export default function Page() {
  const router = useRouter()
  const [openModals, setOpenModals] = useState<Set<string>>(new Set())
  const [toast, setToast]           = useState<{ msg: string; type: string } | null>(null)
  const [editingBatchTimeGuid, setEditingBatchTimeGuid] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<BatchTime | null>(null)

  const { data: rows = [], isLoading } = useBatchTimes()
  const createBatchTime = useCreateBatchTime()
  const updateBatchTime = useUpdateBatchTime()
  const deleteBatchTime = useDeleteBatchTime()

  const { page, setPage, totalPages, totalCount, pageItems } = usePagination(rows, PAGE_SIZE)

  function nav(id: string) { router.push('/config/' + id) }
  function openModal(id: string)  { setOpenModals(prev => new Set(prev).add(id)) }
  function closeModal(id: string) { setOpenModals(prev => { const s = new Set(prev); s.delete(id); return s }) }
  function showToast(msg: string, type = '') { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }

  function openEditModal(guid: string) {
    setEditingBatchTimeGuid(guid)
    openModal('edit-batch-time-modal')
  }

  function confirmDeleteBatchTime() {
    if (!deleteTarget) return
    deleteBatchTime.mutate(deleteTarget.batchTimeGuid, {
      onSuccess: () => { setDeleteTarget(null); showToast('Batch time deleted successfully') },
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
          <button className="btn btn-primary" onClick={() => openModal('new-batch-time-modal')}>
            <i className="lni lni-plus"></i> Add Batch Time
          </button>
        </div>
        <div className="card">
          <div className="card-hdr">
            <div className="card-title"><span className="ctitle-icon"><i className="lni lni-timer"></i></span> Batch Times</div>
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
                  : rows.length === 0
                    ? <EmptyState colSpan={999} hasFilters={false} onClearFilters={() => {}} />
                    : null}
                {pageItems.map((r) => (
                  <tr key={r.batchTimeGuid}>
                    <td>
                      <ActionMenu>
                        <button className="btn btn-neu btn-sm" onClick={() => openEditModal(r.batchTimeGuid)}>
                          <i className="lni lni-pencil"></i> Edit
                        </button>
                        <button className="btn btn-neu btn-sm" onClick={() => setDeleteTarget(r)}>
                          <i className="lni lni-trash-can"></i> Delete
                        </button>
                      </ActionMenu>
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
      <NewBatchTimeModal
        isOpen={openModals.has('new-batch-time-modal')}
        onClose={() => closeModal('new-batch-time-modal')}
        showToast={showToast}
        createBatchTime={createBatchTime}
      />
      <EditBatchTimeModal
        isOpen={openModals.has('edit-batch-time-modal')}
        onClose={() => closeModal('edit-batch-time-modal')}
        showToast={showToast}
        batchTimeGuid={editingBatchTimeGuid}
        updateBatchTime={updateBatchTime}
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
