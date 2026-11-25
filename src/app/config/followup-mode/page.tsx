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
import { getFollowUpModesPaged } from '@/lib/api/admission/followUpMode'
import { FollowUpModeFormModal } from '@/components/modals/config/FollowUpModeFormModal'
import { ViewFollowUpModeModal } from '@/components/modals/config/ViewFollowUpModeModal'
import { FOLLOWUP_MODES_KEY, useCreateFollowUpMode, useUpdateFollowUpMode, useDeleteFollowUpMode, FollowUpMode } from '@/hooks/admission/useFollowUpModes'
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
  const [editingModeGuid, setEditingModeGuid] = useState<string | null>(null)
  const [viewingModeGuid, setViewingModeGuid] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<FollowUpMode | null>(null)

  // One page at a time from the server (?page=&pageSize=&search=), so the
  // search box narrows the whole list, not just the rows on screen.
  const table = useServerTable({ queryKey: FOLLOWUP_MODES_KEY, fetchPage: getFollowUpModesPaged, pageSize: PAGE_SIZE, minSearch: MIN_SEARCH_CHARS })
  const { items: rows, search, setSearch, page, setPage, totalPages, totalCount } = table
  const isLoading = table.isLoading || table.searchPending
  const createFollowUpMode = useCreateFollowUpMode()
  const updateFollowUpMode = useUpdateFollowUpMode()
  const deleteFollowUpMode = useDeleteFollowUpMode()

  // Search-box preview: the first of the server's matches.
  const searchMatches = search.trim().length >= MIN_SEARCH_CHARS && !table.searchPending ? rows.slice(0, 8) : []
  const pageItems = table.searchPending ? [] : rows

  function nav(id: string) { router.push('/config/' + id) }
  function openModal(id: string)  { setOpenModals(prev => new Set(prev).add(id)) }
  function closeModal(id: string) { setOpenModals(prev => { const s = new Set(prev); s.delete(id); return s }) }
  function showToast(msg: string, type = '') { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }

  function openEditModal(guid: string) {
    setEditingModeGuid(guid)
    openModal('edit-followup-mode-modal')
  }

  function openViewModal(guid: string) {
    setViewingModeGuid(guid)
    openModal('view-followup-mode-modal')
    setSearch('')
  }

  function confirmDeleteFollowUpMode() {
    if (!deleteTarget) return
    deleteFollowUpMode.mutate(deleteTarget.followUpModeGuid, {
      onSuccess: () => { setDeleteTarget(null); showToast('Followup mode deleted successfully', 'success') },
      onError: (error: Error) => showToast(error.message || 'Failed to delete followup mode', 'error'),
    })
  }

  return (
    <>
      <div className="page active">
        <div className="pg-hdr">
          <div>
            <div className="pg-title">Followup Mode Master</div>
            <div className="pg-sub">Manage the channels used to follow up with admission enquiries</div>
          </div>
          {permissions.add && (
            <button className="btn btn-primary" onClick={() => openModal('new-followup-mode-modal')}>
              <i className="lni lni-plus"></i> Add Followup Mode
            </button>
          )}
        </div>
        <div className="card">
          <div className="card-hdr">
            <div className="card-title"><span className="ctitle-icon"><i className="lni lni-comments"></i></span> Followup Modes</div>
            <div className="flex gap-2">
              <TableSearch
                className="w-56"
                placeholder="Search by code or name…"
                value={search}
                onChange={setSearch}
                results={searchMatches.map(r => ({ id: r.followUpModeGuid, primary: r.followUpModeName }))}
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
                  <th>Followup Mode Name</th>
                </tr>
              </thead>
              <tbody>
                {isLoading
                  ? <TableLoadingState colSpan={999} />
                  : pageItems.length === 0
                    ? <EmptyState colSpan={999} hasFilters={false} onClearFilters={() => {}} />
                    : null}
                {pageItems.map((r) => (
                  <tr key={r.followUpModeGuid}>
                    <td>
                      {(true) && (
                        <ActionMenu>
                          <button className="btn btn-neu btn-sm" onClick={() => openViewModal(r.followUpModeGuid)}><i className="lni lni-eye"></i> View</button>
                          {permissions.edit && <button className="btn btn-neu btn-sm" onClick={() => openEditModal(r.followUpModeGuid)}>
                            <i className="lni lni-pencil"></i> Edit
                          </button>}
                          {permissions.delete && <button className="btn btn-neu btn-sm" onClick={() => setDeleteTarget(r)}>
                            <i className="lni lni-trash-can"></i> Delete
                          </button>}
                        </ActionMenu>
                      )}
                    </td>
                    <td><strong>{r.followUpModeName}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollTable>
          <Pagination page={page} totalPages={totalPages} totalCount={totalCount} itemLabel="followup modes" onPageChange={setPage} />
        </div>
      </div>
      <FollowUpModeFormModal
        mode="new"
        isOpen={openModals.has('new-followup-mode-modal')}
        onClose={() => closeModal('new-followup-mode-modal')}
        showToast={showToast}
        followUpModeGuid={null}
        createFollowUpMode={createFollowUpMode}
        updateFollowUpMode={updateFollowUpMode}
      />
      <FollowUpModeFormModal
        mode="edit"
        isOpen={openModals.has('edit-followup-mode-modal')}
        onClose={() => closeModal('edit-followup-mode-modal')}
        showToast={showToast}
        followUpModeGuid={editingModeGuid}
        createFollowUpMode={createFollowUpMode}
        updateFollowUpMode={updateFollowUpMode}
      />
      <ViewFollowUpModeModal
        isOpen={openModals.has('view-followup-mode-modal')}
        onClose={() => closeModal('view-followup-mode-modal')}
        showToast={showToast}
        followUpModeGuid={viewingModeGuid}
        canEdit={Boolean(permissions.edit)}
        onEdit={() => {
          closeModal('view-followup-mode-modal')
          openEditModal(viewingModeGuid!)
        }}
      />
      <Toast toast={toast} />

      {deleteTarget && (
        <div className="perm-delete-overlay" style={{ position: 'fixed', zIndex: 500 }} onClick={() => setDeleteTarget(null)}>
          <div className="perm-delete-card tab-panel-in" onClick={e => e.stopPropagation()}>
            <div className="perm-delete-icon"><i className="lni lni-trash-can"></i></div>
            <div className="perm-delete-title">Delete {deleteTarget.followUpModeName}?</div>
            <div className="perm-delete-sub">
              This will permanently delete this followup mode. This can&apos;t be undone.
            </div>
            <div className="perm-delete-actions">
              <button className="btn btn-neu" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="btn btn-danger" disabled={deleteFollowUpMode.isPending} onClick={confirmDeleteFollowUpMode}>
                <i className="lni lni-trash-can"></i> {deleteFollowUpMode.isPending ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
