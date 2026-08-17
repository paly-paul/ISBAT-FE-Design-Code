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
import { NewStreamModal } from '@/components/modals/academic/NewStreamModal'
import { EditStreamModal } from '@/components/modals/academic/EditStreamModal'
import { ViewStreamModal } from '@/components/modals/academic/ViewStreamModal'
import { useStreams, useCreateStream, useUpdateStream, useDeleteStream, Stream } from '@/hooks/config/useStreams'
import { usePagePermissions } from '@/hooks/users/usePagePermissions'

const PAGE_SIZE = 10

export default function Page() {
  const router = useRouter()
  const permissions = usePagePermissions()
  const [openModals, setOpenModals] = useState<Set<string>>(new Set())
  const [toast, setToast]           = useState<{ msg: string; type: string } | null>(null)
  const [editingStreamGuid, setEditingStreamGuid] = useState<string | null>(null)
  const [viewingStreamGuid, setViewingStreamGuid] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Stream | null>(null)
  const [search, setSearch] = useState('')

  const { data: rows = [], isLoading } = useStreams()
  const createStream = useCreateStream()
  const updateStream = useUpdateStream()
  const deleteStream = useDeleteStream()

  const searchMatches = search.trim()
    ? rows.filter(r => `${r.streamCode} ${r.streamName}`.toLowerCase().includes(search.trim().toLowerCase())).slice(0, 8)
    : []

  const filteredRows = rows.filter(r =>
    !search.trim() || `${r.streamCode} ${r.streamName}`.toLowerCase().includes(search.trim().toLowerCase())
  )

  const { page, setPage, totalPages, totalCount, pageItems } = usePagination(filteredRows, PAGE_SIZE)

  function nav(id: string) { router.push('/config/' + id) }
  function openModal(id: string)  { setOpenModals(prev => new Set(prev).add(id)) }
  function closeModal(id: string) { setOpenModals(prev => { const s = new Set(prev); s.delete(id); return s }) }
  function showToast(msg: string, type = '') { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }

  function openEditModal(guid: string) {
    setEditingStreamGuid(guid)
    openModal('edit-stream-modal')
  }

  function openViewModal(guid: string) {
    setViewingStreamGuid(guid)
    openModal('view-stream-modal')
  }

  function confirmDeleteStream() {
    if (!deleteTarget) return
    deleteStream.mutate(deleteTarget.streamGuid, {
      onSuccess: () => { setDeleteTarget(null); showToast('Stream deleted successfully') },
      onError: (error: Error) => showToast(error.message || 'Failed to delete stream', 'error'),
    })
  }

  return (
    <>
      <div className="page active">
        <div className="pg-hdr">
          <div>
            <div className="pg-title">Specialization Master</div>
            <div className="pg-sub">Manage academic specialization streams</div>
          </div>
          {permissions.add && (
            <button className="btn btn-primary" onClick={() => openModal('new-stream-modal')}>
              <i className="lni lni-plus"></i> Add Stream
            </button>
          )}
        </div>
        <div className="card">
          <div className="card-hdr">
            <div className="card-title"><span className="ctitle-icon"><i className="lni lni-certificate"></i></span> Specialization Streams</div>
            <div className="flex gap-2">
              <TableSearch
                className="w-56"
                placeholder="Search by code or name…"
                value={search}
                onChange={setSearch}
                results={searchMatches.map(r => ({ id: r.streamGuid, primary: r.streamCode, secondary: r.streamName }))}
              />
            </div>
          </div>
          <ScrollTable>
            <table>
              <thead>
                <tr>
                  <th style={{ width: 48 }}></th>
                  <th>Stream Code</th>
                  <th>Stream Name</th>
                </tr>
              </thead>
              <tbody>
                {isLoading
                  ? <TableLoadingState colSpan={999} />
                  : filteredRows.length === 0
                    ? <EmptyState colSpan={999} hasFilters={false} onClearFilters={() => {}} />
                    : null}
                {pageItems.map((r) => (
                  <tr key={r.streamGuid}>
                    <td>
                      {(true) && (
                        <ActionMenu>
                          <button className="btn btn-neu btn-sm" onClick={() => openViewModal(r.streamGuid)}><i className="lni lni-eye"></i> View</button>
                          {permissions.edit && <button className="btn btn-neu btn-sm" onClick={() => openEditModal(r.streamGuid)}>
                            <i className="lni lni-pencil"></i> Edit
                          </button>}
                          {permissions.delete && <button className="btn btn-neu btn-sm" onClick={() => setDeleteTarget(r)}>
                            <i className="lni lni-trash-can"></i> Delete
                          </button>}
                        </ActionMenu>
                      )}
                    </td>
                    <td className="font-mono font-bold">{r.streamCode}</td>
                    <td><strong>{r.streamName}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollTable>
          <Pagination page={page} totalPages={totalPages} totalCount={totalCount} itemLabel="specializations" onPageChange={setPage} />
        </div>
      </div>
      <NewStreamModal
        isOpen={openModals.has('new-stream-modal')}
        onClose={() => closeModal('new-stream-modal')}
        showToast={showToast}
        createStream={createStream}
      />
      <EditStreamModal
        isOpen={openModals.has('edit-stream-modal')}
        onClose={() => closeModal('edit-stream-modal')}
        showToast={showToast}
        streamGuid={editingStreamGuid}
        updateStream={updateStream}
      />
      <ViewStreamModal
        isOpen={openModals.has('view-stream-modal')}
        onClose={() => closeModal('view-stream-modal')}
        showToast={showToast}
        streamGuid={viewingStreamGuid}
        onEdit={() => {
          closeModal('view-stream-modal')
          openEditModal(viewingStreamGuid!)
        }}
      />
      <Toast toast={toast} />

      {deleteTarget && (
        <div className="perm-delete-overlay" style={{ position: 'fixed', zIndex: 500 }} onClick={() => setDeleteTarget(null)}>
          <div className="perm-delete-card tab-panel-in" onClick={e => e.stopPropagation()}>
            <div className="perm-delete-icon"><i className="lni lni-trash-can"></i></div>
            <div className="perm-delete-title">Delete {deleteTarget.streamName}?</div>
            <div className="perm-delete-sub">
              This will permanently delete this stream. This can&apos;t be undone.
            </div>
            <div className="perm-delete-actions">
              <button className="btn btn-neu" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="btn btn-danger" disabled={deleteStream.isPending} onClick={confirmDeleteStream}>
                <i className="lni lni-trash-can"></i> {deleteStream.isPending ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
