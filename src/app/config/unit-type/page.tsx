'use client'
import { useState } from 'react'
import { ScrollTable } from '@/components/ScrollTable'
import { ActionMenu } from '@/components/ActionMenu'
import { TableSearch } from '@/components/TableSearch'
import { Toast } from '@/components/Toast'
import { EmptyState } from '@/components/EmptyState'
import { TableLoadingState } from '@/components/TableLoadingState'
import { Pagination } from '@/components/Pagination'
import { usePagination } from '@/hooks/usePagination'
import { NewUnitTypeModal } from '@/components/modals/academic/NewUnitTypeModal'
import { EditUnitTypeModal } from '@/components/modals/academic/EditUnitTypeModal'
import { ViewUnitTypeModal } from '@/components/modals/academic/ViewUnitTypeModal'
import { useUnitTypes, useCreateUnitType, useUpdateUnitType, useDeleteUnitType, UnitType } from '@/hooks/config/useUnitTypes'
import { usePagePermissions } from '@/hooks/users/usePagePermissions'

const PAGE_SIZE = 10

export default function Page() {
  const permissions = usePagePermissions()
  const [openModals, setOpenModals] = useState<Set<string>>(new Set())
  const [toast, setToast]           = useState<{ msg: string; type: string } | null>(null)
  const [editingUnitTypeGuid, setEditingUnitTypeGuid] = useState<string | null>(null)
  const [viewingUnitTypeGuid, setViewingUnitTypeGuid] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<UnitType | null>(null)
  const [search, setSearch] = useState('')

  const { data: rows = [], isLoading } = useUnitTypes()
  const createUnitType = useCreateUnitType()
  const updateUnitType = useUpdateUnitType()
  const deleteUnitType = useDeleteUnitType()

  const searchMatches = search.trim()
    ? rows.filter(r => r.unitTypeName.toLowerCase().includes(search.trim().toLowerCase())).slice(0, 8)
    : []

  const filteredRows = rows.filter(r =>
    !search.trim() || r.unitTypeName.toLowerCase().includes(search.trim().toLowerCase())
  )

  const { page, setPage, totalPages, totalCount, pageItems } = usePagination(filteredRows, PAGE_SIZE)

  function openModal(id: string)  { setOpenModals(prev => new Set(prev).add(id)) }
  function closeModal(id: string) { setOpenModals(prev => { const s = new Set(prev); s.delete(id); return s }) }
  function showToast(msg: string, type = '') { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }

  function openEditModal(guid: string) {
    setEditingUnitTypeGuid(guid)
    openModal('edit-unit-type-modal')
  }

  function openViewModal(guid: string) {
    setViewingUnitTypeGuid(guid)
    openModal('view-unit-type-modal')
  }

  function confirmDeleteUnitType() {
    if (!deleteTarget) return
    deleteUnitType.mutate(deleteTarget.unitTypeGuid, {
      onSuccess: () => { setDeleteTarget(null); showToast('Unit type deleted successfully') },
      onError: (error: Error) => showToast(error.message || 'Failed to delete unit type', 'error'),
    })
  }

  return (
    <>
      <div className="page active">
        <div className="pg-hdr">
          <div>
            <div className="pg-title">Unit Type Master</div>
            <div className="pg-sub">Manage the unit types used when allocating course units to a programme</div>
          </div>
          {permissions.add && (
            <button className="btn btn-primary" onClick={() => openModal('new-unit-type-modal')}>
              <i className="lni lni-plus"></i> Add Unit Type
            </button>
          )}
        </div>
        <div className="card">
          <div className="card-hdr">
            <div className="card-title"><span className="ctitle-icon"><i className="lni lni-tag"></i></span> Unit Types</div>
            <div className="flex gap-2">
              <TableSearch
                className="w-56"
                placeholder="Search by code or name…"
                value={search}
                onChange={setSearch}
                results={searchMatches.map(r => ({ id: r.unitTypeGuid, primary: r.unitTypeName }))}
              />
            </div>
          </div>
          <ScrollTable>
            <table>
              <thead>
                <tr>
                  <th style={{ width: 48 }}></th>
                  <th>Unit Type Name</th>
                </tr>
              </thead>
              <tbody>
                {isLoading
                  ? <TableLoadingState colSpan={999} />
                  : filteredRows.length === 0
                    ? <EmptyState colSpan={999} hasFilters={false} onClearFilters={() => {}} />
                    : null}
                {pageItems.map((r) => (
                  <tr key={r.unitTypeGuid}>
                    <td>
                      {(true) && (
                      <ActionMenu>
                        <button className="btn btn-neu btn-sm" onClick={() => openViewModal(r.unitTypeGuid)}><i className="lni lni-eye"></i> View</button>
                          {permissions.edit && <button className="btn btn-neu btn-sm" onClick={() => openEditModal(r.unitTypeGuid)}>
                          <i className="lni lni-pencil"></i> Edit
                        </button>}
                        {permissions.delete && <button className="btn btn-neu btn-sm" onClick={() => setDeleteTarget(r)}>
                          <i className="lni lni-trash-can"></i> Delete
                        </button>}
                      </ActionMenu>
                      )}
                    </td>
                    <td><strong>{r.unitTypeName}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollTable>
          <Pagination page={page} totalPages={totalPages} totalCount={totalCount} itemLabel="unit types" onPageChange={setPage} />
        </div>
      </div>
      <NewUnitTypeModal
        isOpen={openModals.has('new-unit-type-modal')}
        onClose={() => closeModal('new-unit-type-modal')}
        showToast={showToast}
        createUnitType={createUnitType}
      />
      <EditUnitTypeModal
        isOpen={openModals.has('edit-unit-type-modal')}
        onClose={() => closeModal('edit-unit-type-modal')}
        showToast={showToast}
        unitTypeGuid={editingUnitTypeGuid}
        updateUnitType={updateUnitType}
      />
      <ViewUnitTypeModal
        isOpen={openModals.has('view-unit-type-modal')}
        onClose={() => closeModal('view-unit-type-modal')}
        showToast={showToast}
        unitTypeGuid={viewingUnitTypeGuid}
        onEdit={() => {
          closeModal('view-unit-type-modal')
          openEditModal(viewingUnitTypeGuid!)
        }}
      />
      <Toast toast={toast} />

      {deleteTarget && (
        <div className="perm-delete-overlay" style={{ position: 'fixed', zIndex: 500 }} onClick={() => setDeleteTarget(null)}>
          <div className="perm-delete-card tab-panel-in" onClick={e => e.stopPropagation()}>
            <div className="perm-delete-icon"><i className="lni lni-trash-can"></i></div>
            <div className="perm-delete-title">Delete {deleteTarget.unitTypeName}?</div>
            <div className="perm-delete-sub">
              This will permanently delete this unit type. This can&apos;t be undone.
            </div>
            <div className="perm-delete-actions">
              <button className="btn btn-neu" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="btn btn-danger" disabled={deleteUnitType.isPending} onClick={confirmDeleteUnitType}>
                <i className="lni lni-trash-can"></i> {deleteUnitType.isPending ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
