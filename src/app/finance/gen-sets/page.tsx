'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ScrollTable } from '@/components/ScrollTable'
import { ActionMenu } from '@/components/ActionMenu'
import { Toast } from '@/components/Toast'
import { EmptyState } from '@/components/EmptyState'
import { TableLoadingState } from '@/components/TableLoadingState'
import { NewGenSetModal } from '@/components/modals/finance/NewGenSetModal'
import { EditGenSetModal } from '@/components/modals/finance/EditGenSetModal'
import { useGenSets, useCreateGenSet, useUpdateGenSet, useDeleteGenSet, GenSet } from '@/hooks/finance/useGenSets'

export default function Page() {
  const router = useRouter()
  const [openModals, setOpenModals] = useState<Set<string>>(new Set())
  const [toast, setToast]           = useState<{ msg: string; type: string } | null>(null)
  const [editingGenSetGuid, setEditingGenSetGuid] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<GenSet | null>(null)

  const { data: rows = [], isLoading } = useGenSets()
  const createGenSet = useCreateGenSet()
  const updateGenSet = useUpdateGenSet()
  const deleteGenSet = useDeleteGenSet()

  function nav(id: string) { router.push('/finance/' + id) }
  function openModal(id: string)  { setOpenModals(prev => new Set(prev).add(id)) }
  function closeModal(id: string) { setOpenModals(prev => { const s = new Set(prev); s.delete(id); return s }) }
  function showToast(msg: string, type = '') { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }

  function openEditModal(guid: string) {
    setEditingGenSetGuid(guid)
    openModal('edit-genset-modal')
  }

  function confirmDeleteGenSet() {
    if (!deleteTarget) return
    deleteGenSet.mutate(deleteTarget.genSetGuid, {
      onSuccess: () => { setDeleteTarget(null); showToast('General setting deleted successfully') },
      onError: (error: Error) => showToast(error.message || 'Failed to delete general setting', 'error'),
    })
  }

  return (
    <>
      <div className="page active">
        <div className="pg-hdr">
          <div>
            <div className="pg-title">General Settings (GenSets)</div>
            <div className="pg-sub">Configurable type/condition lookups used as reference data across Finance</div>
          </div>
          <button className="btn btn-primary" onClick={() => openModal('new-genset-modal')}>
            <i className="lni lni-plus"></i> Add General Setting
          </button>
        </div>
        <div className="card">
          <div className="card-hdr">
            <div className="card-title"><span className="ctitle-icon"><i className="lni lni-cog"></i></span> General Settings</div>
          </div>
          <ScrollTable>
            <table>
              <thead>
                <tr>
                  <th style={{ width: 48 }}></th>
                  <th>Type</th>
                  <th>Condition</th>
                </tr>
              </thead>
              <tbody>
                {isLoading
                  ? <TableLoadingState colSpan={999} />
                  : rows.length === 0
                    ? <EmptyState colSpan={999} hasFilters={false} onClearFilters={() => {}} />
                    : null}
                {rows.map((r) => (
                  <tr key={r.genSetGuid}>
                    <td>
                      <ActionMenu>
                        <button className="btn btn-neu btn-sm" onClick={() => openEditModal(r.genSetGuid)}>
                          <i className="lni lni-pencil"></i> Edit
                        </button>
                        <button className="btn btn-neu btn-sm" onClick={() => setDeleteTarget(r)}>
                          <i className="lni lni-trash-can"></i> Delete
                        </button>
                      </ActionMenu>
                    </td>
                    <td className="font-mono font-bold uppercase">{r.type}</td>
                    <td>{r.condition}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollTable>
        </div>
      </div>
      <NewGenSetModal
        isOpen={openModals.has('new-genset-modal')}
        onClose={() => closeModal('new-genset-modal')}
        showToast={showToast}
        createGenSet={createGenSet}
      />
      <EditGenSetModal
        isOpen={openModals.has('edit-genset-modal')}
        onClose={() => closeModal('edit-genset-modal')}
        showToast={showToast}
        genSetGuid={editingGenSetGuid}
        updateGenSet={updateGenSet}
      />
      <Toast toast={toast} />

      {deleteTarget && (
        <div className="perm-delete-overlay" style={{ position: 'fixed', zIndex: 500 }} onClick={() => setDeleteTarget(null)}>
          <div className="perm-delete-card tab-panel-in" onClick={e => e.stopPropagation()}>
            <div className="perm-delete-icon"><i className="lni lni-trash-can"></i></div>
            <div className="perm-delete-title">Delete {deleteTarget.type} — {deleteTarget.condition}?</div>
            <div className="perm-delete-sub">
              This will permanently delete this general setting. This can&apos;t be undone.
            </div>
            <div className="perm-delete-actions">
              <button className="btn btn-neu" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="btn btn-danger" disabled={deleteGenSet.isPending} onClick={confirmDeleteGenSet}>
                <i className="lni lni-trash-can"></i> {deleteGenSet.isPending ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
