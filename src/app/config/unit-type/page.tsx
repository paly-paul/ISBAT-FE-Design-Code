'use client'
import { useState } from 'react'
import { ScrollTable } from '@/components/ScrollTable'
import { ActionMenu } from '@/components/ActionMenu'
import { TableSearch } from '@/components/TableSearch'
import { Toast } from '@/components/Toast'
import { EmptyState } from '@/components/EmptyState'
import { TableLoadingState } from '@/components/TableLoadingState'
import { Pagination } from '@/components/Pagination'
import { useServerTable } from '@/hooks/useServerTable'
import { getUnitTypesPaged } from '@/lib/api/academic/unitType'
import { UnitTypeFormModal } from '@/components/modals/config/UnitTypeFormModal'
import { ViewUnitTypeModal } from '@/components/modals/config/ViewUnitTypeModal'
import { UNIT_TYPES_KEY, useCreateUnitType, useUpdateUnitType, useDeleteUnitType, UnitType } from '@/hooks/config/useUnitTypes'
import { usePagePermissions } from '@/hooks/users/usePagePermissions'

const PAGE_SIZE = 10
// Don't narrow the table (or open the search dropdown) until the user's
// typed at least this many characters — same convention as the other
// master pages' search boxes.
const MIN_SEARCH_CHARS = 2

export default function Page() {
  const permissions = usePagePermissions()
  const [openModals, setOpenModals] = useState<Set<string>>(new Set())
  const [toast, setToast]           = useState<{ msg: string; type: string } | null>(null)
  const [editingUnitTypeGuid, setEditingUnitTypeGuid] = useState<string | null>(null)
  const [viewingUnitTypeGuid, setViewingUnitTypeGuid] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<UnitType | null>(null)

  // One page at a time from the server (?page=&pageSize=&search=), so the
  // search box narrows the whole list, not just the rows on screen.
  const table = useServerTable({ queryKey: UNIT_TYPES_KEY, fetchPage: getUnitTypesPaged, pageSize: PAGE_SIZE, minSearch: MIN_SEARCH_CHARS })
  const { items: rows, search, setSearch, page, setPage, totalPages, totalCount } = table
  const isLoading = table.isLoading || table.searchPending
  const createUnitType = useCreateUnitType()
  const updateUnitType = useUpdateUnitType()
  const deleteUnitType = useDeleteUnitType()

  // Search-box preview: the first of the server's matches.
  const searchMatches = search.trim().length >= MIN_SEARCH_CHARS && !table.searchPending ? rows.slice(0, 8) : []
  const pageItems = table.searchPending ? [] : rows

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
    setSearch('')
  }

  function confirmDeleteUnitType() {
    if (!deleteTarget) return
    deleteUnitType.mutate(deleteTarget.unitTypeGuid, {
      onSuccess: () => { setDeleteTarget(null); showToast('Unit type deleted successfully', 'success') },
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
                  <th>Unit Type Name</th>
                </tr>
              </thead>
              <tbody>
                {isLoading
                  ? <TableLoadingState colSpan={999} />
                  : pageItems.length === 0
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
      <UnitTypeFormModal
        mode="new"
        isOpen={openModals.has('new-unit-type-modal')}
        onClose={() => closeModal('new-unit-type-modal')}
        showToast={showToast}
        unitTypeGuid={null}
        createUnitType={createUnitType}
        updateUnitType={updateUnitType}
      />
      <UnitTypeFormModal
        mode="edit"
        isOpen={openModals.has('edit-unit-type-modal')}
        onClose={() => closeModal('edit-unit-type-modal')}
        showToast={showToast}
        unitTypeGuid={editingUnitTypeGuid}
        createUnitType={createUnitType}
        updateUnitType={updateUnitType}
      />
      <ViewUnitTypeModal
        isOpen={openModals.has('view-unit-type-modal')}
        onClose={() => closeModal('view-unit-type-modal')}
        showToast={showToast}
        unitTypeGuid={viewingUnitTypeGuid}
        canEdit={Boolean(permissions.edit)}
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
