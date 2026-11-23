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
import { getInterestLevelsPaged } from '@/lib/api/admission/interestLevel'
import { InterestLevelFormModal } from '@/components/modals/config/InterestLevelFormModal'
import { ViewInterestLevelModal } from '@/components/modals/config/ViewInterestLevelModal'
import { INTEREST_LEVELS_KEY, useCreateInterestLevel, useUpdateInterestLevel, useDeleteInterestLevel, InterestLevel } from '@/hooks/admission/useInterestLevels'
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
  const [editingLevelGuid, setEditingLevelGuid] = useState<string | null>(null)
  const [viewingLevelGuid, setViewingLevelGuid] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<InterestLevel | null>(null)

  // One page at a time from the server (?page=&pageSize=&search=), so the
  // search box narrows the whole list, not just the rows on screen.
  const table = useServerTable({ queryKey: INTEREST_LEVELS_KEY, fetchPage: getInterestLevelsPaged, pageSize: PAGE_SIZE, minSearch: MIN_SEARCH_CHARS })
  const { items: rows, search, setSearch, page, setPage, totalPages, totalCount } = table
  const isLoading = table.isLoading || table.searchPending
  const createInterestLevel = useCreateInterestLevel()
  const updateInterestLevel = useUpdateInterestLevel()
  const deleteInterestLevel = useDeleteInterestLevel()

  // Search-box preview: the first of the server's matches.
  const searchMatches = search.trim().length >= MIN_SEARCH_CHARS && !table.searchPending ? rows.slice(0, 8) : []
  const pageItems = table.searchPending ? [] : rows

  function nav(id: string) { router.push('/config/' + id) }
  function openModal(id: string)  { setOpenModals(prev => new Set(prev).add(id)) }
  function closeModal(id: string) { setOpenModals(prev => { const s = new Set(prev); s.delete(id); return s }) }
  function showToast(msg: string, type = '') { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }

  function openEditModal(guid: string) {
    setEditingLevelGuid(guid)
    openModal('edit-interest-level-modal')
  }

  function openViewModal(guid: string) {
    setViewingLevelGuid(guid)
    openModal('view-interest-level-modal')
    setSearch('')
  }

  function confirmDeleteInterestLevel() {
    if (!deleteTarget) return
    deleteInterestLevel.mutate(deleteTarget.interestLevelGuid, {
      onSuccess: () => { setDeleteTarget(null); showToast('Interest level deleted successfully', 'success') },
      onError: (error: Error) => showToast(error.message || 'Failed to delete interest level', 'error'),
    })
  }

  return (
    <>
      <div className="page active">
        <div className="pg-hdr">
          <div>
            <div className="pg-title">Interest Level Master</div>
            <div className="pg-sub">Manage the levels used to rate an applicant&apos;s interest during admissions</div>
          </div>
          {permissions.add && (
            <button className="btn btn-primary" onClick={() => openModal('new-interest-level-modal')}>
              <i className="lni lni-plus"></i> Add Interest Level
            </button>
          )}
        </div>
        <div className="card">
          <div className="card-hdr">
            <div className="card-title"><span className="ctitle-icon"><i className="lni lni-signal"></i></span> Interest Levels</div>
            <div className="flex gap-2">
              <TableSearch
                className="w-56"
                placeholder="Search by code or name…"
                value={search}
                onChange={setSearch}
                results={searchMatches.map(r => ({ id: r.interestLevelGuid, primary: r.interestLevelName }))}
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
                  <th>Interest Level Name</th>
                </tr>
              </thead>
              <tbody>
                {isLoading
                  ? <TableLoadingState colSpan={999} />
                  : pageItems.length === 0
                    ? <EmptyState colSpan={999} hasFilters={false} onClearFilters={() => {}} />
                    : null}
                {pageItems.map((r) => (
                  <tr key={r.interestLevelGuid}>
                    <td>
                      {(true) && (
                        <ActionMenu>
                          <button className="btn btn-neu btn-sm" onClick={() => openViewModal(r.interestLevelGuid)}><i className="lni lni-eye"></i> View</button>
                          {permissions.edit && <button className="btn btn-neu btn-sm" onClick={() => openEditModal(r.interestLevelGuid)}>
                            <i className="lni lni-pencil"></i> Edit
                          </button>}
                          {permissions.delete && <button className="btn btn-neu btn-sm" onClick={() => setDeleteTarget(r)}>
                            <i className="lni lni-trash-can"></i> Delete
                          </button>}
                        </ActionMenu>
                      )}
                    </td>
                    <td><strong>{r.interestLevelName}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollTable>
          <Pagination page={page} totalPages={totalPages} totalCount={totalCount} itemLabel="interest levels" onPageChange={setPage} />
        </div>
      </div>
      <InterestLevelFormModal
        mode="new"
        isOpen={openModals.has('new-interest-level-modal')}
        onClose={() => closeModal('new-interest-level-modal')}
        showToast={showToast}
        interestLevelGuid={null}
        createInterestLevel={createInterestLevel}
        updateInterestLevel={updateInterestLevel}
      />
      <InterestLevelFormModal
        mode="edit"
        isOpen={openModals.has('edit-interest-level-modal')}
        onClose={() => closeModal('edit-interest-level-modal')}
        showToast={showToast}
        interestLevelGuid={editingLevelGuid}
        createInterestLevel={createInterestLevel}
        updateInterestLevel={updateInterestLevel}
      />
      <ViewInterestLevelModal
        isOpen={openModals.has('view-interest-level-modal')}
        onClose={() => closeModal('view-interest-level-modal')}
        showToast={showToast}
        interestLevelGuid={viewingLevelGuid}
        onEdit={() => {
          closeModal('view-interest-level-modal')
          openEditModal(viewingLevelGuid!)
        }}
      />
      <Toast toast={toast} />

      {deleteTarget && (
        <div className="perm-delete-overlay" style={{ position: 'fixed', zIndex: 500 }} onClick={() => setDeleteTarget(null)}>
          <div className="perm-delete-card tab-panel-in" onClick={e => e.stopPropagation()}>
            <div className="perm-delete-icon"><i className="lni lni-trash-can"></i></div>
            <div className="perm-delete-title">Delete {deleteTarget.interestLevelName}?</div>
            <div className="perm-delete-sub">
              This will permanently delete this interest level. This can&apos;t be undone.
            </div>
            <div className="perm-delete-actions">
              <button className="btn btn-neu" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="btn btn-danger" disabled={deleteInterestLevel.isPending} onClick={confirmDeleteInterestLevel}>
                <i className="lni lni-trash-can"></i> {deleteInterestLevel.isPending ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
