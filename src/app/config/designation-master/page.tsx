'use client'
import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { ScrollTable } from '@/components/ScrollTable'
import { ActionMenu } from '@/components/ActionMenu'
import { TableSearch } from '@/components/TableSearch'
import { Toast } from '@/components/Toast'
import { EmptyState } from '@/components/EmptyState'
import { TableLoadingState } from '@/components/TableLoadingState'
import { Pagination } from '@/components/Pagination'
import { useServerTable } from '@/hooks/useServerTable'
import { DesignationFormModal } from '@/components/modals/config/DesignationFormModal'
import { ViewDesignationModal } from '@/components/modals/config/ViewDesignationModal'
import { DESIGNATIONS_KEY, removeDesignationRow, useDeleteDesignation, Designation } from '@/hooks/config/useDesignations'
import { getDesignationsPaged } from '@/lib/api/academic/designation'
import { AuthError } from '@/lib/api/client'
import { usePagePermissions } from '@/hooks/users/usePagePermissions'

// Designation Master (erp-docs/pages/identity/designation-master-page.md):
// job titles with a short code, optional minimum qualification (a course
// level), job description and skill set. No department — that's picked on
// each employee. Permissions: config.designation.get / add / edit / delete.
const PAGE_SIZE = 10
// Don't narrow the table (or open the search dropdown) until the user's
// typed at least this many characters — same convention as the other
// master pages' search boxes.
const MIN_SEARCH_CHARS = 2

export default function Page() {
  const permissions = usePagePermissions()
  const queryClient = useQueryClient()
  const [openModals, setOpenModals] = useState<Set<string>>(new Set())
  const [toast, setToast]           = useState<{ msg: string; type: string } | null>(null)
  const [editingDesignation, setEditingDesignation] = useState<Designation | null>(null)
  const [viewingDesignation, setViewingDesignation] = useState<Designation | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Designation | null>(null)
  const [deleteError, setDeleteError]   = useState<string | null>(null)

  // Server-paged and sorted by name; search matches the short code or the name.
  const table = useServerTable({ queryKey: DESIGNATIONS_KEY, fetchPage: getDesignationsPaged, pageSize: PAGE_SIZE, minSearch: MIN_SEARCH_CHARS })
  const { items: rows, search, setSearch, page, setPage, totalPages, totalCount } = table
  const isLoading = table.isLoading || table.searchPending
  const deleteDesignation = useDeleteDesignation()

  function openModal(id: string)  { setOpenModals(prev => new Set(prev).add(id)) }
  function closeModal(id: string) { setOpenModals(prev => { const s = new Set(prev); s.delete(id); return s }) }
  function showToast(msg: string, type = '') { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }

  function openEditModal(designation: Designation) {
    setEditingDesignation(designation)
    openModal('edit-designation-modal')
  }

  function openViewModal(designation: Designation) {
    setViewingDesignation(designation)
    openModal('view-designation-modal')
    setSearch('')
  }

  function openDelete(designation: Designation) { setDeleteError(null); setDeleteTarget(designation) }
  function closeDelete() { setDeleteTarget(null); setDeleteError(null) }

  function confirmDeleteDesignation() {
    if (!deleteTarget) return
    const target = deleteTarget
    deleteDesignation.mutate(target.designationGuid, {
      onSuccess: () => {
        closeDelete()
        showToast('Designation deleted successfully', 'success')
        // The page is now empty and isn't the first one: go back a page.
        if (pageItems.length === 1 && page > 1) setPage(page - 1)
      },
      onError: (err: Error) => {
        const code = err instanceof AuthError ? err.code : undefined
        if (code === 'not_found') {
          removeDesignationRow(queryClient, target.designationGuid)
          closeDelete()
          showToast('This designation no longer exists.', 'error')
          return
        }
        // designation_in_use and anything else: keep the row and say why.
        setDeleteError(err.message || 'Failed to delete designation.')
      },
    })
  }

  // Search-box preview: the first of the server's matches.
  const searchMatches = search.trim().length >= MIN_SEARCH_CHARS && !table.searchPending ? rows.slice(0, 8) : []
  const pageItems = table.searchPending ? [] : rows

  return (
    <>
      <div className="page active">
        <div className="pg-hdr">
          <div>
            <div className="pg-title">Designation Master</div>
            <div className="pg-sub">Job titles, their minimum qualification and skills · Department is chosen on each employee</div>
          </div>
          {permissions.add && (
            <button className="btn btn-primary" onClick={() => openModal('new-designation-modal')}>
              <i className="lni lni-plus"></i> Add Designation
            </button>
          )}
        </div>
        <div className="card">
          <div className="card-hdr">
            <div className="card-title"><span className="ctitle-icon"><i className="lni lni-tag"></i></span> Designations</div>
            <div className="flex gap-2">
              <TableSearch
                className="w-56"
                placeholder="Search by code or name…"
                value={search}
                onChange={setSearch}
                results={searchMatches.map(r => ({ id: r.designationGuid, primary: r.shortCode, secondary: r.designationName }))}
                minChars={MIN_SEARCH_CHARS}
                loading={table.searchPending}
                onSelect={(res) => { const row = rows.find(x => x.designationGuid === res.id); if (row) openViewModal(row) }}
              />
            </div>
          </div>
          <ScrollTable>
            <table>
              <thead>
                <tr>
                  <th style={{ width: 48 }}></th>
                  <th style={{ width: 64 }}>#</th>
                  <th>Code</th>
                  <th>Designation</th>
                  <th>Min. Qualification</th>
                </tr>
              </thead>
              <tbody>
                {isLoading
                  ? <TableLoadingState colSpan={999} />
                  : pageItems.length === 0
                    ? <EmptyState colSpan={999} hasFilters={!!table.term} onClearFilters={() => setSearch('')} />
                    : null}
                {pageItems.map((r, i) => (
                  <tr key={r.designationGuid}>
                    <td>
                      <ActionMenu>
                        <button className="btn btn-neu btn-sm" onClick={() => openViewModal(r)}><i className="lni lni-eye"></i> View</button>
                        {permissions.edit && <button className="btn btn-neu btn-sm" onClick={() => openEditModal(r)}>
                          <i className="lni lni-pencil"></i> Edit
                        </button>}
                        {permissions.delete && <button className="btn btn-neu btn-sm" onClick={() => openDelete(r)}>
                          <i className="lni lni-trash-can"></i> Delete
                        </button>}
                      </ActionMenu>
                    </td>
                    <td className="font-mono" style={{ color: 'var(--g500)' }}>{(page - 1) * PAGE_SIZE + i + 1}</td>
                    <td className="font-mono">{r.shortCode || '—'}</td>
                    <td><strong>{r.designationName}</strong></td>
                    <td>{r.minQualificationName || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollTable>
          <Pagination page={page} totalPages={totalPages} totalCount={totalCount} itemLabel="designations" onPageChange={setPage} />
        </div>
      </div>
      <DesignationFormModal
        mode="new"
        isOpen={openModals.has('new-designation-modal')}
        onClose={() => closeModal('new-designation-modal')}
        showToast={showToast}
        designation={null}
        onGone={() => {}}
      />
      <DesignationFormModal
        mode="edit"
        isOpen={openModals.has('edit-designation-modal')}
        onClose={() => closeModal('edit-designation-modal')}
        showToast={showToast}
        designation={editingDesignation}
        onGone={d => removeDesignationRow(queryClient, d.designationGuid)}
      />
      <ViewDesignationModal
        isOpen={openModals.has('view-designation-modal')}
        onClose={() => closeModal('view-designation-modal')}
        showToast={showToast}
        designation={viewingDesignation}
        onEdit={permissions.edit ? () => {
          closeModal('view-designation-modal')
          if (viewingDesignation) openEditModal(viewingDesignation)
        } : undefined}
      />
      <Toast toast={toast} />

      {deleteTarget && (
        <div className="perm-delete-overlay" style={{ position: 'fixed', zIndex: 500 }}>
          <div className="perm-delete-card tab-panel-in" onClick={e => e.stopPropagation()}>
            <div className="perm-delete-icon"><i className="lni lni-trash-can"></i></div>
            <div className="perm-delete-title">Delete {deleteTarget.designationName}?</div>
            <div className="perm-delete-sub">
              {deleteError
                ? <span style={{ color: 'var(--red)' }}>{deleteError}</span>
                : <>This designation will be removed from the list. A designation that an employee holds can&apos;t be deleted.</>}
            </div>
            <div className="perm-delete-actions">
              <button className="btn btn-neu" onClick={closeDelete}>{deleteError ? 'Close' : 'Cancel'}</button>
              {!deleteError && (
                <button className="btn btn-danger" disabled={deleteDesignation.isPending} onClick={confirmDeleteDesignation}>
                  <i className="lni lni-trash-can"></i> {deleteDesignation.isPending ? 'Deleting…' : 'Delete'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
