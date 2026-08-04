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
import { usePagination } from '@/hooks/usePagination'
import { NewInterestLevelModal } from '@/components/modals/academic/NewInterestLevelModal'
import { EditInterestLevelModal } from '@/components/modals/academic/EditInterestLevelModal'
import { useInterestLevels, useCreateInterestLevel, useUpdateInterestLevel, useDeleteInterestLevel, InterestLevel } from '@/hooks/admission/useInterestLevels'
import { usePagePermissions } from '@/hooks/users/usePagePermissions'

const PAGE_SIZE = 10

export default function Page() {
  const router = useRouter()
  const permissions = usePagePermissions()
  const [openModals, setOpenModals] = useState<Set<string>>(new Set())
  const [toast, setToast]           = useState<{ msg: string; type: string } | null>(null)
  const [editingLevelGuid, setEditingLevelGuid] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<InterestLevel | null>(null)
  const [search, setSearch] = useState('')

  const { data: rows = [], isLoading } = useInterestLevels()
  const createInterestLevel = useCreateInterestLevel()
  const updateInterestLevel = useUpdateInterestLevel()
  const deleteInterestLevel = useDeleteInterestLevel()

  const searchMatches = search.trim()
    ? rows.filter(r => r.interestLevelName.toLowerCase().includes(search.trim().toLowerCase())).slice(0, 8)
    : []

  const filteredRows = rows.filter(r =>
    !search.trim() || r.interestLevelName.toLowerCase().includes(search.trim().toLowerCase())
  )

  const { page, setPage, totalPages, totalCount, pageItems } = usePagination(filteredRows, PAGE_SIZE)

  function nav(id: string) { router.push('/config/' + id) }
  function openModal(id: string)  { setOpenModals(prev => new Set(prev).add(id)) }
  function closeModal(id: string) { setOpenModals(prev => { const s = new Set(prev); s.delete(id); return s }) }
  function showToast(msg: string, type = '') { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }

  function openEditModal(guid: string) {
    setEditingLevelGuid(guid)
    openModal('edit-interest-level-modal')
  }

  function confirmDeleteInterestLevel() {
    if (!deleteTarget) return
    deleteInterestLevel.mutate(deleteTarget.interestLevelGuid, {
      onSuccess: () => { setDeleteTarget(null); showToast('Interest level deleted successfully') },
      onError: (error: Error) => showToast(error.message || 'Failed to delete interest level', 'error'),
    })
  }

  return (
    <>
      <div className="page active">
        <div className="pg-hdr">
          <div>
            <div className="pg-title">Interest Level Master</div>
            <div className="pg-sub">Manage the levels used to rate an applicant's interest during admissions</div>
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
                  : filteredRows.length === 0
                    ? <EmptyState colSpan={999} hasFilters={false} onClearFilters={() => {}} />
                    : null}
                {pageItems.map((r) => (
                  <tr key={r.interestLevelGuid}>
                    <td>
                      {(permissions.edit || permissions.delete) && (
                        <ActionMenu>
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
      <NewInterestLevelModal
        isOpen={openModals.has('new-interest-level-modal')}
        onClose={() => closeModal('new-interest-level-modal')}
        showToast={showToast}
        createInterestLevel={createInterestLevel}
      />
      <EditInterestLevelModal
        isOpen={openModals.has('edit-interest-level-modal')}
        onClose={() => closeModal('edit-interest-level-modal')}
        showToast={showToast}
        interestLevelGuid={editingLevelGuid}
        updateInterestLevel={updateInterestLevel}
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
