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
import { NewFollowUpStatusModal } from '@/components/modals/academic/NewFollowUpStatusModal'
import { EditFollowUpStatusModal } from '@/components/modals/academic/EditFollowUpStatusModal'
import { useFollowUpStatuses, useCreateFollowUpStatus, useUpdateFollowUpStatus, useDeleteFollowUpStatus, FollowUpStatus } from '@/hooks/config/useFollowUpStatuses'

const PAGE_SIZE = 10

export default function Page() {
  const router = useRouter()
  const [openModals, setOpenModals] = useState<Set<string>>(new Set())
  const [toast, setToast]           = useState<{ msg: string; type: string } | null>(null)
  const [editingFollowUpStatusGuid, setEditingFollowUpStatusGuid] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<FollowUpStatus | null>(null)

  const { data: rows = [], isLoading } = useFollowUpStatuses()
  const createFollowUpStatus = useCreateFollowUpStatus()
  const updateFollowUpStatus = useUpdateFollowUpStatus()
  const deleteFollowUpStatus = useDeleteFollowUpStatus()

  const { page, setPage, totalPages, totalCount, pageItems } = usePagination(rows, PAGE_SIZE)

  function nav(id: string) { router.push('/config/' + id) }
  function openModal(id: string)  { setOpenModals(prev => new Set(prev).add(id)) }
  function closeModal(id: string) { setOpenModals(prev => { const s = new Set(prev); s.delete(id); return s }) }
  function showToast(msg: string, type = '') { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }

  function openEditModal(guid: string) {
    setEditingFollowUpStatusGuid(guid)
    openModal('edit-followup-status-modal')
  }

  function confirmDeleteFollowUpStatus() {
    if (!deleteTarget) return
    deleteFollowUpStatus.mutate(deleteTarget.followUpStatusGuid, {
      onSuccess: () => { setDeleteTarget(null); showToast('Followup status deleted successfully') },
      onError: (error: Error) => showToast(error.message || 'Failed to delete followup status', 'error'),
    })
  }

  return (
    <>
      <div className="page active">
        <div className="pg-hdr">
          <div>
            <div className="pg-title">Followup Status Master</div>
            <div className="pg-sub">Manage the statuses used to track admission enquiry followups</div>
          </div>
          <button className="btn btn-primary" onClick={() => openModal('new-followup-status-modal')}>
            <i className="lni lni-plus"></i> Add Followup Status
          </button>
        </div>
        <div className="card">
          <div className="card-hdr">
            <div className="card-title"><span className="ctitle-icon"><i className="lni lni-phone"></i></span> Followup Statuses</div>
          </div>
          <ScrollTable>
            <table>
              <thead>
                <tr>
                  <th style={{ width: 48 }}></th>
                  <th>Status Code</th>
                  <th>Status Name</th>
                  <th>Closes Followup</th>
                </tr>
              </thead>
              <tbody>
                {isLoading
                  ? <TableLoadingState colSpan={999} />
                  : rows.length === 0
                    ? <EmptyState colSpan={999} hasFilters={false} onClearFilters={() => {}} />
                    : null}
                {pageItems.map((r) => (
                  <tr key={r.followUpStatusGuid}>
                    <td>
                      <ActionMenu>
                        <button className="btn btn-neu btn-sm" onClick={() => openEditModal(r.followUpStatusGuid)}>
                          <i className="lni lni-pencil"></i> Edit
                        </button>
                        <button className="btn btn-neu btn-sm" onClick={() => setDeleteTarget(r)}>
                          <i className="lni lni-trash-can"></i> Delete
                        </button>
                      </ActionMenu>
                    </td>
                    <td className="font-mono font-bold">{r.followUpStatusCode}</td>
                    <td><strong>{r.followUpStatusName}</strong></td>
                    <td>
                      {r.isClose === 1
                        ? <span className="badge badge-green"><i className="lni lni-checkmark"></i> Yes</span>
                        : <span className="badge badge-grey">No</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollTable>
          <Pagination page={page} totalPages={totalPages} totalCount={totalCount} itemLabel="followup statuses" onPageChange={setPage} />
        </div>
      </div>
      <NewFollowUpStatusModal
        isOpen={openModals.has('new-followup-status-modal')}
        onClose={() => closeModal('new-followup-status-modal')}
        showToast={showToast}
        createFollowUpStatus={createFollowUpStatus}
      />
      <EditFollowUpStatusModal
        isOpen={openModals.has('edit-followup-status-modal')}
        onClose={() => closeModal('edit-followup-status-modal')}
        showToast={showToast}
        followUpStatusGuid={editingFollowUpStatusGuid}
        updateFollowUpStatus={updateFollowUpStatus}
      />
      <Toast toast={toast} />

      {deleteTarget && (
        <div className="perm-delete-overlay" style={{ position: 'fixed', zIndex: 500 }} onClick={() => setDeleteTarget(null)}>
          <div className="perm-delete-card tab-panel-in" onClick={e => e.stopPropagation()}>
            <div className="perm-delete-icon"><i className="lni lni-trash-can"></i></div>
            <div className="perm-delete-title">Delete {deleteTarget.followUpStatusName}?</div>
            <div className="perm-delete-sub">
              This will permanently delete this followup status. This can&apos;t be undone.
            </div>
            <div className="perm-delete-actions">
              <button className="btn btn-neu" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="btn btn-danger" disabled={deleteFollowUpStatus.isPending} onClick={confirmDeleteFollowUpStatus}>
                <i className="lni lni-trash-can"></i> {deleteFollowUpStatus.isPending ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
