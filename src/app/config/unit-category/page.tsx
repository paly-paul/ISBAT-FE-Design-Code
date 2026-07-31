'use client'
import { useState } from 'react'
import { ScrollTable } from '@/components/ScrollTable'
import { ActionMenu } from '@/components/ActionMenu'
import { Toast } from '@/components/Toast'
import { EmptyState } from '@/components/EmptyState'
import { TableLoadingState } from '@/components/TableLoadingState'
import { Pagination } from '@/components/Pagination'
import { usePagination } from '@/hooks/usePagination'
import { NewUnitCategoryModal } from '@/components/modals/academic/NewUnitCategoryModal'
import { EditUnitCategoryModal } from '@/components/modals/academic/EditUnitCategoryModal'
import { useUnitCategories, useCreateUnitCategory, useUpdateUnitCategory, useDeleteUnitCategory, UnitCategory } from '@/hooks/config/useUnitCategories'
import { usePagePermissions } from '@/hooks/users/usePagePermissions'

const PAGE_SIZE = 10

export default function Page() {
  const permissions = usePagePermissions()
  const [openModals, setOpenModals] = useState<Set<string>>(new Set())
  const [toast, setToast]           = useState<{ msg: string; type: string } | null>(null)
  const [editingUnitCatGuid, setEditingUnitCatGuid] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<UnitCategory | null>(null)

  const { data: rows = [], isLoading } = useUnitCategories()
  const createUnitCategory = useCreateUnitCategory()
  const updateUnitCategory = useUpdateUnitCategory()
  const deleteUnitCategory = useDeleteUnitCategory()

  const { page, setPage, totalPages, totalCount, pageItems } = usePagination(rows, PAGE_SIZE)

  function openModal(id: string)  { setOpenModals(prev => new Set(prev).add(id)) }
  function closeModal(id: string) { setOpenModals(prev => { const s = new Set(prev); s.delete(id); return s }) }
  function showToast(msg: string, type = '') { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }

  function openEditModal(guid: string) {
    setEditingUnitCatGuid(guid)
    openModal('edit-unit-category-modal')
  }

  function confirmDeleteUnitCategory() {
    if (!deleteTarget) return
    deleteUnitCategory.mutate(deleteTarget.unitCatGuid, {
      onSuccess: () => { setDeleteTarget(null); showToast('Unit category deleted successfully') },
      onError: (error: Error) => showToast(error.message || 'Failed to delete unit category', 'error'),
    })
  }

  return (
    <>
      <div className="page active">
        <div className="pg-hdr">
          <div>
            <div className="pg-title">Unit Category Master</div>
            <div className="pg-sub">Manage the unit categories used when allocating course units to a programme</div>
          </div>
          {permissions.add && (
            <button className="btn btn-primary" onClick={() => openModal('new-unit-category-modal')}>
              <i className="lni lni-plus"></i> Add Unit Category
            </button>
          )}
        </div>
        <div className="card">
          <div className="card-hdr">
            <div className="card-title"><span className="ctitle-icon"><i className="lni lni-tag"></i></span> Unit Categories</div>
          </div>
          <ScrollTable>
            <table>
              <thead>
                <tr>
                  <th style={{ width: 48 }}></th>
                  <th>Unit Category Name</th>
                </tr>
              </thead>
              <tbody>
                {isLoading
                  ? <TableLoadingState colSpan={999} />
                  : rows.length === 0
                    ? <EmptyState colSpan={999} hasFilters={false} onClearFilters={() => {}} />
                    : null}
                {pageItems.map((r) => (
                  <tr key={r.unitCatGuid}>
                    <td>
                      {(permissions.edit || permissions.delete) && (
                        <ActionMenu>
                          {permissions.edit && <button className="btn btn-neu btn-sm" onClick={() => openEditModal(r.unitCatGuid)}>
                            <i className="lni lni-pencil"></i> Edit
                          </button>}
                          {permissions.delete && <button className="btn btn-neu btn-sm" onClick={() => setDeleteTarget(r)}>
                            <i className="lni lni-trash-can"></i> Delete
                          </button>}
                        </ActionMenu>
                      )}
                    </td>
                    <td><strong>{r.unitCatName}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollTable>
          <Pagination page={page} totalPages={totalPages} totalCount={totalCount} itemLabel="unit categories" onPageChange={setPage} />
        </div>
      </div>
      <NewUnitCategoryModal
        isOpen={openModals.has('new-unit-category-modal')}
        onClose={() => closeModal('new-unit-category-modal')}
        showToast={showToast}
        createUnitCategory={createUnitCategory}
      />
      <EditUnitCategoryModal
        isOpen={openModals.has('edit-unit-category-modal')}
        onClose={() => closeModal('edit-unit-category-modal')}
        showToast={showToast}
        unitCatGuid={editingUnitCatGuid}
        updateUnitCategory={updateUnitCategory}
      />
      <Toast toast={toast} />

      {deleteTarget && (
        <div className="perm-delete-overlay" style={{ position: 'fixed', zIndex: 500 }} onClick={() => setDeleteTarget(null)}>
          <div className="perm-delete-card tab-panel-in" onClick={e => e.stopPropagation()}>
            <div className="perm-delete-icon"><i className="lni lni-trash-can"></i></div>
            <div className="perm-delete-title">Delete {deleteTarget.unitCatName}?</div>
            <div className="perm-delete-sub">
              This will permanently delete this unit category. This can&apos;t be undone.
            </div>
            <div className="perm-delete-actions">
              <button className="btn btn-neu" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="btn btn-danger" disabled={deleteUnitCategory.isPending} onClick={confirmDeleteUnitCategory}>
                <i className="lni lni-trash-can"></i> {deleteUnitCategory.isPending ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
