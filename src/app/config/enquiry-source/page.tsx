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
import { NewEnquirySourceModal } from '@/components/modals/academic/NewEnquirySourceModal'
import { EditEnquirySourceModal } from '@/components/modals/academic/EditEnquirySourceModal'
import { useEnquirySources, useCreateEnquirySource, useUpdateEnquirySource, useDeleteEnquirySource, EnquirySource } from '@/hooks/admission/useEnquirySources'

const PAGE_SIZE = 10

export default function Page() {
  const router = useRouter()
  const [openModals, setOpenModals] = useState<Set<string>>(new Set())
  const [toast, setToast]           = useState<{ msg: string; type: string } | null>(null)
  const [editingSourceGuid, setEditingSourceGuid] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<EnquirySource | null>(null)

  const { data: rows = [], isLoading } = useEnquirySources()
  const createEnquirySource = useCreateEnquirySource()
  const updateEnquirySource = useUpdateEnquirySource()
  const deleteEnquirySource = useDeleteEnquirySource()

  const { page, setPage, totalPages, totalCount, pageItems } = usePagination(rows, PAGE_SIZE)

  function nav(id: string) { router.push('/config/' + id) }
  function openModal(id: string)  { setOpenModals(prev => new Set(prev).add(id)) }
  function closeModal(id: string) { setOpenModals(prev => { const s = new Set(prev); s.delete(id); return s }) }
  function showToast(msg: string, type = '') { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }

  function openEditModal(guid: string) {
    setEditingSourceGuid(guid)
    openModal('edit-enquiry-source-modal')
  }

  function confirmDeleteEnquirySource() {
    if (!deleteTarget) return
    deleteEnquirySource.mutate(deleteTarget.isbatSourceGuid, {
      onSuccess: () => { setDeleteTarget(null); showToast('Isbat enquiry source deleted successfully') },
      onError: (error: Error) => showToast(error.message || 'Failed to delete Isbat enquiry source', 'error'),
    })
  }

  return (
    <>
      <div className="page active">
        <div className="pg-hdr">
          <div>
            <div className="pg-title">Isbat Enquiry Source Master</div>
            <div className="pg-sub">Manage the channels through which admission enquiries originate</div>
          </div>
          <button className="btn btn-primary" onClick={() => openModal('new-enquiry-source-modal')}>
            <i className="lni lni-plus"></i> Add Isbat Enquiry Source
          </button>
        </div>
        <div className="card">
          <div className="card-hdr">
            <div className="card-title"><span className="ctitle-icon"><i className="lni lni-compass"></i></span> Isbat Enquiry Sources</div>
          </div>
          <ScrollTable>
            <table>
              <thead>
                <tr>
                  <th style={{ width: 48 }}></th>
                  <th>Source Name</th>
                </tr>
              </thead>
              <tbody>
                {isLoading
                  ? <TableLoadingState colSpan={999} />
                  : rows.length === 0
                    ? <EmptyState colSpan={999} hasFilters={false} onClearFilters={() => {}} />
                    : null}
                {pageItems.map((r) => (
                  <tr key={r.isbatSourceGuid}>
                    <td>
                      <ActionMenu>
                        <button className="btn btn-neu btn-sm" onClick={() => openEditModal(r.isbatSourceGuid)}>
                          <i className="lni lni-pencil"></i> Edit
                        </button>
                        <button className="btn btn-neu btn-sm" onClick={() => setDeleteTarget(r)}>
                          <i className="lni lni-trash-can"></i> Delete
                        </button>
                      </ActionMenu>
                    </td>
                    <td><strong>{r.sourceName}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollTable>
          <Pagination page={page} totalPages={totalPages} totalCount={totalCount} itemLabel="enquiry sources" onPageChange={setPage} />
        </div>
      </div>
      <NewEnquirySourceModal
        isOpen={openModals.has('new-enquiry-source-modal')}
        onClose={() => closeModal('new-enquiry-source-modal')}
        showToast={showToast}
        createEnquirySource={createEnquirySource}
      />
      <EditEnquirySourceModal
        isOpen={openModals.has('edit-enquiry-source-modal')}
        onClose={() => closeModal('edit-enquiry-source-modal')}
        showToast={showToast}
        isbatSourceGuid={editingSourceGuid}
        updateEnquirySource={updateEnquirySource}
      />
      <Toast toast={toast} />

      {deleteTarget && (
        <div className="perm-delete-overlay" style={{ position: 'fixed', zIndex: 500 }} onClick={() => setDeleteTarget(null)}>
          <div className="perm-delete-card tab-panel-in" onClick={e => e.stopPropagation()}>
            <div className="perm-delete-icon"><i className="lni lni-trash-can"></i></div>
            <div className="perm-delete-title">Delete {deleteTarget.sourceName}?</div>
            <div className="perm-delete-sub">
              This will permanently delete this Isbat enquiry source. This can&apos;t be undone.
            </div>
            <div className="perm-delete-actions">
              <button className="btn btn-neu" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="btn btn-danger" disabled={deleteEnquirySource.isPending} onClick={confirmDeleteEnquirySource}>
                <i className="lni lni-trash-can"></i> {deleteEnquirySource.isPending ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
