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
import { getFollowUpStatusesPaged } from '@/lib/api/academic/followUpStatus'
import { FollowUpStatusFormModal } from '@/components/modals/config/FollowUpStatusFormModal'
import { ViewFollowUpStatusModal } from '@/components/modals/config/ViewFollowUpStatusModal'
import { FOLLOWUP_STATUSES_KEY, useCreateFollowUpStatus, useUpdateFollowUpStatus, useDeleteFollowUpStatus, FollowUpStatus } from '@/hooks/config/useFollowUpStatuses'
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
  const [editingFollowUpStatusGuid, setEditingFollowUpStatusGuid] = useState<string | null>(null)
  const [viewingFollowUpStatusGuid, setViewingFollowUpStatusGuid] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<FollowUpStatus | null>(null)

  // One page at a time from the server (?page=&pageSize=&search=), so the
  // search box narrows the whole list, not just the rows on screen.
  const table = useServerTable({ queryKey: FOLLOWUP_STATUSES_KEY, fetchPage: getFollowUpStatusesPaged, pageSize: PAGE_SIZE, minSearch: MIN_SEARCH_CHARS })
  const { items: rows, search, setSearch, page, setPage, totalPages, totalCount } = table
  const isLoading = table.isLoading || table.searchPending
  const createFollowUpStatus = useCreateFollowUpStatus()
  const updateFollowUpStatus = useUpdateFollowUpStatus()
  const deleteFollowUpStatus = useDeleteFollowUpStatus()

  // Search-box preview: the first of the server's matches.
  const searchMatches = search.trim().length >= MIN_SEARCH_CHARS && !table.searchPending ? rows.slice(0, 8) : []
  const pageItems = table.searchPending ? [] : rows

  function nav(id: string) { router.push('/config/' + id) }
  function openModal(id: string)  { setOpenModals(prev => new Set(prev).add(id)) }
  function closeModal(id: string) { setOpenModals(prev => { const s = new Set(prev); s.delete(id); return s }) }
  function showToast(msg: string, type = '') { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }

  function openEditModal(guid: string) {
    setEditingFollowUpStatusGuid(guid)
    openModal('edit-followup-status-modal')
  }

  function openViewModal(guid: string) {
    setViewingFollowUpStatusGuid(guid)
    openModal('view-followup-status-modal')
    setSearch('')
  }

  function confirmDeleteFollowUpStatus() {
    if (!deleteTarget) return
    deleteFollowUpStatus.mutate(deleteTarget.followUpStatusGuid, {
      onSuccess: () => { setDeleteTarget(null); showToast('Followup status deleted successfully', 'success') },
      onError: (error: Error) => showToast(error.message || 'Failed to delete followup status', 'error'),
    })
  }

  return (
    <>
      <div className="page active">
        <div className="pg-hdr">
          <div>
            <div className="pg-title">Followup Status Master</div>
            <div className="pg-sub">Manage the statuses used to track admission enquiry followups</div>
          </div>
          {permissions.add && (
            <button className="btn btn-primary" onClick={() => openModal('new-followup-status-modal')}>
              <i className="lni lni-plus"></i> Add Followup Status
            </button>
          )}
        </div>
        <div className="card">
          <div className="card-hdr">
            <div className="card-title"><span className="ctitle-icon"><i className="lni lni-phone"></i></span> Followup Statuses</div>
            <div className="flex gap-2">
              <TableSearch
                className="w-56"
                placeholder="Search by code or name…"
                value={search}
                onChange={setSearch}
                results={searchMatches.map(r => ({ id: r.followUpStatusGuid, primary: r.followUpStatusCode, secondary: r.followUpStatusName }))}
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
                  <th>Status Code</th>
                  <th>Status Name</th>
                  <th>Closes Followup</th>
                </tr>
              </thead>
              <tbody>
                {isLoading
                  ? <TableLoadingState colSpan={999} />
                  : pageItems.length === 0
                    ? <EmptyState colSpan={999} hasFilters={false} onClearFilters={() => {}} />
                    : null}
                {pageItems.map((r) => (
                  <tr key={r.followUpStatusGuid}>
                    <td>
                      {(true) && (
                        <ActionMenu>
                          <button className="btn btn-neu btn-sm" onClick={() => openViewModal(r.followUpStatusGuid)}><i className="lni lni-eye"></i> View</button>
                          {permissions.edit && <button className="btn btn-neu btn-sm" onClick={() => openEditModal(r.followUpStatusGuid)}>
                            <i className="lni lni-pencil"></i> Edit
                          </button>}
                          {permissions.delete && <button className="btn btn-neu btn-sm" onClick={() => setDeleteTarget(r)}>
                            <i className="lni lni-trash-can"></i> Delete
                          </button>}
                        </ActionMenu>
                      )}
                    </td>
                    <td className="font-mono font-bold">{r.followUpStatusCode}</td>
                    <td><strong>{r.followUpStatusName}</strong></td>
                    <td>
                      {r.isClose === 1
                        ? <span className="badge badge-green"><i className="lni lni-checkmark"></i> Yes</span>
                        : <span className="badge badge-grey">No</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollTable>
          <Pagination page={page} totalPages={totalPages} totalCount={totalCount} itemLabel="followup statuses" onPageChange={setPage} />
        </div>
      </div>
      <FollowUpStatusFormModal
        mode="new"
        isOpen={openModals.has('new-followup-status-modal')}
        onClose={() => closeModal('new-followup-status-modal')}
        showToast={showToast}
        followUpStatusGuid={null}
        createFollowUpStatus={createFollowUpStatus}
        updateFollowUpStatus={updateFollowUpStatus}
      />
      <FollowUpStatusFormModal
        mode="edit"
        isOpen={openModals.has('edit-followup-status-modal')}
        onClose={() => closeModal('edit-followup-status-modal')}
        showToast={showToast}
        followUpStatusGuid={editingFollowUpStatusGuid}
        createFollowUpStatus={createFollowUpStatus}
        updateFollowUpStatus={updateFollowUpStatus}
      />
      <ViewFollowUpStatusModal
        isOpen={openModals.has('view-followup-status-modal')}
        onClose={() => closeModal('view-followup-status-modal')}
        showToast={showToast}
        followUpStatusGuid={viewingFollowUpStatusGuid}
        canEdit={Boolean(permissions.edit)}
        onEdit={() => {
          closeModal('view-followup-status-modal')
          openEditModal(viewingFollowUpStatusGuid!)
        }}
      />
      <Toast toast={toast} />

      {deleteTarget && (
        <div className="perm-delete-overlay" style={{ position: 'fixed', zIndex: 500 }} onClick={() => setDeleteTarget(null)}>
          <div className="perm-delete-card tab-panel-in" onClick={e => e.stopPropagation()}>
            <div className="perm-delete-icon"><i className="lni lni-trash-can"></i></div>
            <div className="perm-delete-title">Delete {deleteTarget.followUpStatusName}?</div>
            <div className="perm-delete-sub">
              This will permanently delete this followup status. This can&apos;t be undone.
            </div>
            <div className="perm-delete-actions">
              <button className="btn btn-neu" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="btn btn-danger" disabled={deleteFollowUpStatus.isPending} onClick={confirmDeleteFollowUpStatus}>
                <i className="lni lni-trash-can"></i> {deleteFollowUpStatus.isPending ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
