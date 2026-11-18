'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ScrollTable } from '@/components/ScrollTable'
import { ActionMenu } from '@/components/ActionMenu'
import { TableSearch } from '@/components/TableSearch'
import { Toast } from '@/components/Toast'
import { LazyFilterTh } from '@/components/LazyFilterTh'
import { EmptyState } from '@/components/EmptyState'
import { TableLoadingState } from '@/components/TableLoadingState'
import { Pagination } from '@/components/Pagination'
import { useServerTable } from '@/hooks/useServerTable'
import { CampusFormModal } from '@/components/modals/config/CampusFormModal'
import { ViewCampusModal } from '@/components/modals/config/ViewCampusModal'
import { CAMPUSES_KEY, useCreateCampus, useUpdateCampus, useDeleteCampus, Campus } from '@/hooks/config/useCampuses'
import { getCampusesPaged } from '@/lib/api/academic/campus'
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
  const [openFilter, setOpenFilter] = useState<string | null>(null)
  const [editingCampus, setEditingCampus] = useState<Campus | null>(null)
  const [viewingCampus, setViewingCampus] = useState<Campus | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Campus | null>(null)

  // One page at a time from the server (?page=&pageSize=&search=). The search
  // box and the header filters share the API's one `search` term (it matches
  // code, name and location), so using one clears the other.
  const table = useServerTable({ queryKey: CAMPUSES_KEY, fetchPage: getCampusesPaged, pageSize: PAGE_SIZE, minSearch: MIN_SEARCH_CHARS })
  const { items: rows, search, setSearch, page, setPage, totalPages, totalCount } = table
  const isLoading = table.isLoading || table.searchPending
  const createCampus = useCreateCampus()
  const updateCampus = useUpdateCampus()
  const deleteCampus = useDeleteCampus()

  function nav(id: string) { router.push('/config/' + id) }
  function openModal(id: string)  { setOpenModals(prev => new Set(prev).add(id)) }
  function closeModal(id: string) { setOpenModals(prev => { const s = new Set(prev); s.delete(id); return s }) }
  function showToast(msg: string, type = '') { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }

  function openEditModal(campus: Campus) {
    setEditingCampus(campus)
    openModal('edit-campus-modal')
  }

  function openViewModal(campus: Campus) {
    setViewingCampus(campus)
    openModal('view-campus-modal')
    setSearch('')
  }

  function confirmDeleteCampus() {
    if (!deleteTarget) return
    deleteCampus.mutate(deleteTarget.campusGuid, {
      onSuccess: () => { setDeleteTarget(null); showToast('Campus deleted successfully') },
      onError: (error: Error) => showToast(error.message || 'Failed to delete campus', 'error'),
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

  // Header filter whose options load from the campus list as you scroll it;
  // picking one narrows the table on the server.
  function fth(label: string, col: string, toValue: (c: Campus) => string | null | undefined) {
    return (
      <LazyFilterTh<Campus>
        label={label}
        isOpen={openFilter === col}
        onToggle={e => { e.stopPropagation(); setOpenFilter(p => p === col ? null : col) }}
        onClose={() => setOpenFilter(null)}
        value={table.filter?.column === col ? table.filter.value : null}
        onSelect={v => { table.setFilter(col, v); setOpenFilter(null) }}
        onClear={() => { table.setFilter(col, null); setOpenFilter(null) }}
        queryKey={[...CAMPUSES_KEY, 'filter', col]}
        fetchPage={getCampusesPaged}
        toValue={toValue}
      />
    )
  }

  return (
    <>
      <div className="page active">
        <div className="pg-hdr">
          <div>
            <div className="pg-title">Campus Master</div>
            <div className="pg-sub">Manage university campuses and their contact details</div>
          </div>
          {permissions.add && (
            <button className="btn btn-primary" onClick={() => openModal('new-campus-modal')}>
              <i className="lni lni-plus"></i> Add Campus
            </button>
          )}
        </div>
        <div className="card">
          <div className="card-hdr">
            <div className="card-title"><span className="ctitle-icon"><i className="lni lni-home"></i></span> Campuses</div>
            <div className="flex gap-2">
              <TableSearch
                className="w-56"
                placeholder="Search by code or name…"
                value={search}
                onChange={setSearch}
                results={searchMatches.map(r => ({ id: r.campusGuid, primary: r.campusCode, secondary: r.campusName }))}
                minChars={MIN_SEARCH_CHARS}
                loading={table.searchPending}
                onSelect={(res) => { const row = rows.find(x => x.campusGuid === res.id); if (row) openViewModal(row) }}
              />
            </div>
          </div>
          <ScrollTable filters={table.filter ? { [table.filter.column]: [table.filter.value] } : {}} onResetFilters={() => table.setFilter('', null)}>
            <table>
              <thead>
                <tr>
                  <th style={{ width: 48 }}></th>
                  <th>Campus Code</th>
                  {fth('Campus Name', 'campusName', c => c.campusName)}
                  {fth('Location', 'location', c => c.location)}
                  <th>Address</th>
                  <th>Contact</th>
                </tr>
              </thead>
              <tbody>
                {isLoading
                  ? <TableLoadingState colSpan={999} />
                  : pageItems.length === 0
                    ? <EmptyState colSpan={999} hasFilters={!!table.term} onClearFilters={() => setSearch('')} />
                    : null}
                {/* Previous row markup (pre GET /api/v1/academic/campus integration) —
                    kept for reference. Columns are unchanged; only the row key
                    moved from the old mock `id` to the real API's `campusGuid`.
                {filteredRows.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <ActionMenu>
                        <button className="btn btn-neu btn-sm" onClick={() => openEditModal(r)}>
                          <i className="lni lni-pencil"></i> Edit
                        </button>
                      </ActionMenu>
                    </td>
                    <td className="font-mono font-bold">{r.campusCode}</td>
                    <td><strong>{r.campusName}</strong></td>
                    <td>{r.location}</td>
                    <td>{r.address}</td>
                    <td>{r.contact}</td>
                  </tr>
                ))}
                */}
                {pageItems.map((r) => (
                  <tr key={r.campusGuid}>
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
                    <td className="font-mono font-bold">{r.campusCode}</td>
                    <td><strong>{r.campusName}</strong></td>
                    <td>{r.location}</td>
                    <td>{r.address}</td>
                    <td>{r.contact}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollTable>
          <Pagination page={page} totalPages={totalPages} totalCount={totalCount} itemLabel="campuses" onPageChange={setPage} />
        </div>
      </div>
      <CampusFormModal
        mode="new"
        isOpen={openModals.has('new-campus-modal')}
        onClose={() => closeModal('new-campus-modal')}
        showToast={showToast}
        campus={null}
        createCampus={createCampus}
        updateCampus={updateCampus}
      />
      <CampusFormModal
        mode="edit"
        isOpen={openModals.has('edit-campus-modal')}
        onClose={() => closeModal('edit-campus-modal')}
        showToast={showToast}
        campus={editingCampus}
        createCampus={createCampus}
        updateCampus={updateCampus}
      />
      <ViewCampusModal
        isOpen={openModals.has('view-campus-modal')}
        onClose={() => closeModal('view-campus-modal')}
        showToast={showToast}
        campus={viewingCampus}
        onEdit={() => {
          closeModal('view-campus-modal')
          openEditModal(viewingCampus!)
        }}
      />
      <Toast toast={toast} />

      {deleteTarget && (
        <div className="perm-delete-overlay" style={{ position: 'fixed', zIndex: 500 }} onClick={() => setDeleteTarget(null)}>
          <div className="perm-delete-card tab-panel-in" onClick={e => e.stopPropagation()}>
            <div className="perm-delete-icon"><i className="lni lni-trash-can"></i></div>
            <div className="perm-delete-title">Delete {deleteTarget.campusName}?</div>
            <div className="perm-delete-sub">
              This will permanently delete this campus. This can&apos;t be undone.
            </div>
            <div className="perm-delete-actions">
              <button className="btn btn-neu" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="btn btn-danger" disabled={deleteCampus.isPending} onClick={confirmDeleteCampus}>
                <i className="lni lni-trash-can"></i> {deleteCampus.isPending ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
