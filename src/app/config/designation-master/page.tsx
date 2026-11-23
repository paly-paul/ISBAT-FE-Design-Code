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
import { DesignationFormModal } from '@/components/modals/config/DesignationFormModal'
import { ViewDesignationModal } from '@/components/modals/config/ViewDesignationModal'
import { DESIGNATIONS_KEY, useCreateDesignation, useUpdateDesignation, useDeleteDesignation, Designation } from '@/hooks/config/useDesignations'
import { getDesignationsPaged } from '@/lib/api/academic/designation'
import { useDepartmentsDropdown } from '@/hooks/config/useDepartments'
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
  const [editingDesignation, setEditingDesignation] = useState<Designation | null>(null)
  const [viewingDesignation, setViewingDesignation] = useState<Designation | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Designation | null>(null)

  // One page at a time from the server (?page=&pageSize=&search=; search
  // matches the designation name). There's no department filter param, so
  // the Department header filter is gone.
  const table = useServerTable({ queryKey: DESIGNATIONS_KEY, fetchPage: getDesignationsPaged, pageSize: PAGE_SIZE, minSearch: MIN_SEARCH_CHARS })
  const { items: rows, search, setSearch, page, setPage, totalPages, totalCount } = table
  const isLoading = table.isLoading || table.searchPending
  const createDesignation = useCreateDesignation()
  const updateDesignation = useUpdateDesignation()
  const deleteDesignation = useDeleteDesignation()

  // Designations carry the department's guid but not its name — resolved
  // from the department dropdown (GET /departments/dropdown).
  const { data: departments = [] } = useDepartmentsDropdown()
  function departmentName(r: Designation) {
    return departments.find(d => d.deptGuid === r.deptGuid)?.deptName ?? '—'
  }

  function nav(id: string) { router.push('/config/' + id) }
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

  function confirmDeleteDesignation() {
    if (!deleteTarget) return
    deleteDesignation.mutate(String(deleteTarget.intDesignation), {
      onSuccess: () => { setDeleteTarget(null); showToast('Designation deleted successfully', 'success') },
      onError: (error: Error) => showToast(error.message || 'Failed to delete designation', 'error'),
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
            <div className="pg-sub">Manage staff designations and their department assignments</div>
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
                placeholder="Search by name…"
                value={search}
                onChange={setSearch}
                results={searchMatches.map(r => ({ id: String(r.intDesignation), primary: r.designationName, secondary: departmentName(r) }))}
                minChars={MIN_SEARCH_CHARS}
                loading={table.searchPending}
                onSelect={(res) => { const row = rows.find(x => String(x.intDesignation) === res.id); if (row) openViewModal(row) }}
              />
            </div>
          </div>
          <ScrollTable>
            <table>
              {/* Previous header (pre GET /api/v1/users/designations integration) — kept for reference.
              <thead>
                <tr>
                  <th style={{ width: 48 }}></th>
                  <th>Designation Name</th>
                  {fth('Department', 'department', ['Computer Science', 'Information Technology', 'Business Administration', 'Civil Engineering', 'Nursing Sciences'])}
                </tr>
              </thead>
              */}
              <thead>
                <tr>
                  <th style={{ width: 48 }}></th>
                  <th>Designation Name</th>
                  <th>Department</th>
                </tr>
              </thead>
              <tbody>
                {isLoading
                  ? <TableLoadingState colSpan={999} />
                  : pageItems.length === 0
                    ? <EmptyState colSpan={999} hasFilters={!!table.term} onClearFilters={() => setSearch('')} />
                    : null}
                {/* Previous row markup (pre GET /api/v1/users/designations integration) — kept for reference.
                {filteredRows.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <ActionMenu>
                        <button className="btn btn-neu btn-sm" onClick={() => openEditModal(r)}>
                          <i className="lni lni-pencil"></i> Edit
                        </button>
                      </ActionMenu>
                    </td>
                    <td><strong>{r.designationName}</strong></td>
                    <td>{r.department}</td>
                  </tr>
                ))}
                */}
                {pageItems.map((r) => (
                  <tr key={r.intDesignation}>
                    <td>
                      {(true) && (
                        <ActionMenu>
                          <button className="btn btn-neu btn-sm" onClick={() => openViewModal(r)}><i className="lni lni-eye"></i> View</button>
                          {permissions.edit && <button className="btn btn-neu btn-sm" onClick={() => openEditModal(r)}>
                            <i className="lni lni-pencil"></i> Edit
                          </button>}
                          {permissions.delete && <button className="btn btn-neu btn-sm" onClick={() => setDeleteTarget(r)}>
                            <i className="lni lni-trash-can"></i> Delete
                          </button>}
                        </ActionMenu>
                      )}
                    </td>
                    <td><strong>{r.designationName}</strong></td>
                    <td>{departmentName(r)}</td>
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
        createDesignation={createDesignation}
        updateDesignation={updateDesignation}
      />
      <DesignationFormModal
        mode="edit"
        isOpen={openModals.has('edit-designation-modal')}
        onClose={() => closeModal('edit-designation-modal')}
        showToast={showToast}
        designation={editingDesignation}
        createDesignation={createDesignation}
        updateDesignation={updateDesignation}
      />
      <ViewDesignationModal
        isOpen={openModals.has('view-designation-modal')}
        onClose={() => closeModal('view-designation-modal')}
        showToast={showToast}
        designation={viewingDesignation}
        onEdit={() => {
          closeModal('view-designation-modal')
          openEditModal(viewingDesignation!)
        }}
      />
      <Toast toast={toast} />

      {deleteTarget && (
        <div className="perm-delete-overlay" style={{ position: 'fixed', zIndex: 500 }} onClick={() => setDeleteTarget(null)}>
          <div className="perm-delete-card tab-panel-in" onClick={e => e.stopPropagation()}>
            <div className="perm-delete-icon"><i className="lni lni-trash-can"></i></div>
            <div className="perm-delete-title">Delete {deleteTarget.designationName}?</div>
            <div className="perm-delete-sub">
              This will permanently delete this designation. This can&apos;t be undone.
            </div>
            <div className="perm-delete-actions">
              <button className="btn btn-neu" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="btn btn-danger" disabled={deleteDesignation.isPending} onClick={confirmDeleteDesignation}>
                <i className="lni lni-trash-can"></i> {deleteDesignation.isPending ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
