'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ScrollTable } from '@/components/ScrollTable'
import { ActionMenu } from '@/components/ActionMenu'
import { TableSearch } from '@/components/TableSearch'
import { FacultyFormModal } from '@/components/modals/config/FacultyFormModal'
import { ViewFacultyModal } from '@/components/modals/config/ViewFacultyModal'
import { Toast } from '@/components/Toast'
import { LazyFilterTh } from '@/components/LazyFilterTh'
import { EmptyState } from '@/components/EmptyState'
import { TableLoadingState } from '@/components/TableLoadingState'
import { Pagination } from '@/components/Pagination'
import { useServerTable } from '@/hooks/useServerTable'
import { FACULTIES_KEY, useCreateFaculty, useUpdateFaculty, useDeleteFaculty, Faculty } from '@/hooks/config/useFaculties'
import { getFacultiesPaged } from '@/lib/api/academic/faculty'
import { useEmployeeDropdown } from '@/hooks/employee/useEmployees'
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
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)
  const [openFilter, setOpenFilter] = useState<string | null>(null)
  const [editingFaculty, setEditingFaculty] = useState<Faculty | null>(null)
  const [viewingFaculty, setViewingFaculty] = useState<Faculty | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Faculty | null>(null)

  // One page at a time from the server (?page=&pageSize=&search=). The search
  // box and the Faculty Name filter share the API's one `search` term (it
  // matches code and name), so using one clears the other.
  const table = useServerTable({ queryKey: FACULTIES_KEY, fetchPage: getFacultiesPaged, pageSize: PAGE_SIZE, minSearch: MIN_SEARCH_CHARS })
  const { items: rows, search, setSearch, page, setPage, totalPages, totalCount } = table
  const isLoading = table.isLoading || table.searchPending
  const createFaculty = useCreateFaculty()
  const updateFaculty = useUpdateFaculty()
  const deleteFaculty = useDeleteFaculty()

  // The backend doesn't always resolve deanName for a faculty even when
  // deanEmployeeGuid is set (seen in the real GET response), so it's looked
  // up in the employee dropdown (GET /employees/dropdown, approved staff).
  const { data: employees = [] } = useEmployeeDropdown()
  function deanDisplayName(r: Faculty): string {
    if (r.deanName) return r.deanName
    return employees.find(e => e.employeeGuid === r.deanEmployeeGuid)?.displayName ?? '—'
  }

  function nav(id: string) { router.push('/config/' + id) }
  function openModal(id: string) { setOpenModals(prev => new Set(prev).add(id)) }
  function closeModal(id: string) { setOpenModals(prev => { const s = new Set(prev); s.delete(id); return s }) }
  function showToast(msg: string, type = '') { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }

  function openEditModal(faculty: Faculty) {
    setEditingFaculty(faculty)
    openModal('edit-faculty-modal')
  }

  function openViewModal(faculty: Faculty) {
    setViewingFaculty(faculty)
    openModal('view-faculty-modal')
    setSearch('')
  }

  function confirmDeleteFaculty() {
    if (!deleteTarget) return
    deleteFaculty.mutate(deleteTarget.facultyGuid, {
      onSuccess: () => { setDeleteTarget(null); showToast('Faculty deleted successfully', 'success') },
      onError: (error: Error) => showToast(error.message || 'Failed to delete faculty', 'error'),
    })
  }

  useEffect(() => {
    function closeFilter(e: MouseEvent) {
      const target = e.target as HTMLElement
      if (!target.closest('th')) setOpenFilter(null)
    }
    document.addEventListener('click', closeFilter)
    return () => document.removeEventListener('click', closeFilter)
  }, [])

  // Search-box preview: the first of the server's matches.
  const searchMatches = search.trim().length >= MIN_SEARCH_CHARS && !table.searchPending ? rows.slice(0, 8) : []
  const pageItems = table.searchPending ? [] : rows

  // Header filter whose options load from the faculty list as you scroll it;
  // picking one narrows the table on the server. (The Dean filter is gone:
  // the faculty list API has no way to filter by dean.)
  function fth(label: string, col: string, toValue: (f: Faculty) => string | null | undefined) {
    return (
      <LazyFilterTh<Faculty>
        label={label}
        isOpen={openFilter === col}
        onToggle={e => { e.stopPropagation(); setOpenFilter(p => p === col ? null : col) }}
        onClose={() => setOpenFilter(null)}
        value={table.filter?.column === col ? table.filter.value : null}
        onSelect={v => { table.setFilter(col, v); setOpenFilter(null) }}
        onClear={() => { table.setFilter(col, null); setOpenFilter(null) }}
        queryKey={[...FACULTIES_KEY, 'filter', col]}
        fetchPage={getFacultiesPaged}
        toValue={toValue}
      />
    )
  }

  return (
    <>
      <div className="page active">
        <div className="pg-hdr">
          <div><div className="pg-title">Faculty Master</div><div className="pg-sub">Define university faculties · Associate programmes and course units</div></div>
          {permissions.add && <button className="btn btn-primary" onClick={() => openModal('new-faculty-modal')}><i className="lni lni-plus"></i> Add Faculty</button>}
        </div>
        <div className="card">
          <div className="card-hdr">
            <div className="card-title"><span className="ctitle-icon"><i className="lni lni-library"></i></span> Faculties</div>
            <div className="flex gap-2">
              <TableSearch
                className="w-56"
                placeholder="Search by code or name…"
                value={search}
                onChange={setSearch}
                results={searchMatches.map(r => ({ id: r.facultyGuid, primary: r.facultyCode, secondary: r.facultyName }))}
                minChars={MIN_SEARCH_CHARS}
                loading={table.searchPending}
                onSelect={(res) => { const row = rows.find(x => x.facultyGuid === res.id); if (row) openViewModal(row) }}
              />
            </div>
          </div>
          <ScrollTable filters={table.filter ? { [table.filter.column]: [table.filter.value] } : {}} onResetFilters={() => table.setFilter('', null)}>
            <table>
              <thead><tr><th style={{ width: 48 }}></th><th>Faculty Code</th>{fth('Faculty Name', 'facultyName', f => f.facultyName)}<th>Campus</th><th>Dean</th>{/* <th>Programmes</th> — not returned by GET /api/v1/academic/faculties */}{/* <th>Course Units</th> */}</tr></thead>
              <tbody>
                {isLoading
                  ? <TableLoadingState colSpan={999} />
                  : pageItems.length === 0
                    ? <EmptyState colSpan={999} hasFilters={!!table.term} onClearFilters={() => setSearch('')} />
                    : null}
                {/* Previous row markup (pre GET /api/v1/academic/faculties integration) —
                    kept for reference. `id`/`code`/`name`/`dean` are now
                    `facultyGuid`/`facultyCode`/`facultyName`/`deanName`, and
                    `programmes` is no longer returned by the real endpoint.
                {filteredRows.map((r) => (
                  <tr key={r.id}>
                    <td><ActionMenu><button className="btn btn-neu btn-sm" onClick={() => openEditModal(r)}><i className="lni lni-pencil"></i> Edit</button></ActionMenu></td>
                    <td className="font-mono">{r.code}</td>
                    <td><strong>{r.name}</strong></td>
                    <td>{r.dean}</td>
                    <td>{r.programmes}</td>
                  </tr>
                ))}
                */}
                {pageItems.map((r) => (
                  <tr key={r.facultyGuid}>
                    <td>
                      {(true) && (
                        <ActionMenu>
                          <button className="btn btn-neu btn-sm" onClick={() => openViewModal(r)}><i className="lni lni-eye"></i> View</button>
                          {permissions.edit && <button className="btn btn-neu btn-sm" onClick={() => openEditModal(r)}><i className="lni lni-pencil"></i> Edit</button>}
                          {permissions.delete && <button className="btn btn-neu btn-sm" onClick={() => setDeleteTarget(r)}><i className="lni lni-trash-can"></i> Delete</button>}
                        </ActionMenu>
                      )}
                    </td>
                    <td className="font-mono">{r.facultyCode}</td>
                    <td><strong>{r.facultyName}</strong></td>
                    <td>{r.campusName}</td>
                    <td>{deanDisplayName(r)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollTable>
          <Pagination page={page} totalPages={totalPages} totalCount={totalCount} itemLabel="faculties" onPageChange={setPage} />
        </div>
      </div>
      <FacultyFormModal
        mode="new"
        isOpen={openModals.has('new-faculty-modal')}
        onClose={() => closeModal('new-faculty-modal')}
        showToast={showToast}
        faculty={null}
        createFaculty={createFaculty}
        updateFaculty={updateFaculty}
      />
      <FacultyFormModal
        mode="edit"
        isOpen={openModals.has('edit-faculty-modal')}
        onClose={() => closeModal('edit-faculty-modal')}
        showToast={showToast}
        faculty={editingFaculty}
        createFaculty={createFaculty}
        updateFaculty={updateFaculty}
      />
      <ViewFacultyModal
        isOpen={openModals.has('view-faculty-modal')}
        onClose={() => closeModal('view-faculty-modal')}
        showToast={showToast}
        faculty={viewingFaculty}
        canEdit={Boolean(permissions.edit)}
        onEdit={() => {
          closeModal('view-faculty-modal')
          openEditModal(viewingFaculty!)
        }}
      />
      <Toast toast={toast} />

      {deleteTarget && (
        <div className="perm-delete-overlay" style={{ position: 'fixed', zIndex: 500 }} onClick={() => setDeleteTarget(null)}>
          <div className="perm-delete-card tab-panel-in" onClick={e => e.stopPropagation()}>
            <div className="perm-delete-icon"><i className="lni lni-trash-can"></i></div>
            <div className="perm-delete-title">Delete {deleteTarget.facultyName}?</div>
            <div className="perm-delete-sub">
              This will permanently delete this faculty. This can&apos;t be undone.
            </div>
            <div className="perm-delete-actions">
              <button className="btn btn-neu" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="btn btn-danger" disabled={deleteFaculty.isPending} onClick={confirmDeleteFaculty}>
                <i className="lni lni-trash-can"></i> {deleteFaculty.isPending ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
