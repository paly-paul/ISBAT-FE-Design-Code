'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ScrollTable } from '@/components/ScrollTable'
import { ActionMenu } from '@/components/ActionMenu'
import { Toast } from '@/components/Toast'
import { EmptyState } from '@/components/EmptyState'
import { TableLoadingState } from '@/components/TableLoadingState'
import { NewBankModal } from '@/components/modals/finance/NewBankModal'
import { EditBankModal } from '@/components/modals/finance/EditBankModal'
import { useBanks, useCreateBank, useUpdateBank, useDeleteBank, Bank } from '@/hooks/finance/useBanks'
import { STATUS_LABELS } from '@/lib/api/finance/procBank'

export default function Page() {
  const router = useRouter()
  const [openModals, setOpenModals] = useState<Set<string>>(new Set())
  const [toast, setToast]           = useState<{ msg: string; type: string } | null>(null)
  const [editingBankGuid, setEditingBankGuid] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Bank | null>(null)

  const { data: rows = [], isLoading } = useBanks()
  const createBank = useCreateBank()
  const updateBank = useUpdateBank()
  const deleteBank = useDeleteBank()

  function nav(id: string) { router.push('/finance/' + id) }
  function openModal(id: string)  { setOpenModals(prev => new Set(prev).add(id)) }
  function closeModal(id: string) { setOpenModals(prev => { const s = new Set(prev); s.delete(id); return s }) }
  function showToast(msg: string, type = '') { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }

  function openEditModal(guid: string) {
    setEditingBankGuid(guid)
    openModal('edit-bank-modal')
  }

  function confirmDeleteBank() {
    if (!deleteTarget) return
    deleteBank.mutate(deleteTarget.bankGuid, {
      onSuccess: () => { setDeleteTarget(null); showToast('Bank deleted successfully') },
      onError: (error: Error) => showToast(error.message || 'Failed to delete bank', 'error'),
    })
  }

  return (
    <>
      <div className="page active">
        <div className="pg-hdr">
          <div>
            <div className="pg-title">Bank Master</div>
            <div className="pg-sub">Manage the banks available for reference across Finance</div>
          </div>
          <button className="btn btn-primary" onClick={() => openModal('new-bank-modal')}>
            <i className="lni lni-plus"></i> Add Bank
          </button>
        </div>
        <div className="card">
          <div className="card-hdr">
            <div className="card-title"><span className="ctitle-icon"><i className="lni lni-coin"></i></span> Banks</div>
          </div>
          <ScrollTable>
            <table>
              <thead>
                <tr>
                  <th style={{ width: 48 }}></th>
                  <th>Short Code</th>
                  <th>Bank Name</th>
                  <th>Company Code</th>
                  <th>Branch Code</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {isLoading
                  ? <TableLoadingState colSpan={999} />
                  : rows.length === 0
                    ? <EmptyState colSpan={999} hasFilters={false} onClearFilters={() => {}} />
                    : null}
                {rows.map((r) => (
                  <tr key={r.bankGuid}>
                    <td>
                      <ActionMenu>
                        <button className="btn btn-neu btn-sm" onClick={() => openEditModal(r.bankGuid)}>
                          <i className="lni lni-pencil"></i> Edit
                        </button>
                        <button className="btn btn-neu btn-sm" onClick={() => setDeleteTarget(r)}>
                          <i className="lni lni-trash-can"></i> Delete
                        </button>
                      </ActionMenu>
                    </td>
                    <td className="font-mono font-bold uppercase">{r.shortCode}</td>
                    <td><strong>{r.bankName}</strong></td>
                    <td>{r.compCode ?? <span className="text-g400">—</span>}</td>
                    <td>{r.branchCode ?? <span className="text-g400">—</span>}</td>
                    <td>
                      {STATUS_LABELS[r.status] === 'Active'
                        ? <span className="badge badge-green"><i className="lni lni-checkmark"></i> Active</span>
                        : <span className="badge badge-grey">Inactive</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollTable>
        </div>
      </div>
      <NewBankModal
        isOpen={openModals.has('new-bank-modal')}
        onClose={() => closeModal('new-bank-modal')}
        showToast={showToast}
        createBank={createBank}
      />
      <EditBankModal
        isOpen={openModals.has('edit-bank-modal')}
        onClose={() => closeModal('edit-bank-modal')}
        showToast={showToast}
        bankGuid={editingBankGuid}
        updateBank={updateBank}
      />
      <Toast toast={toast} />

      {deleteTarget && (
        <div className="perm-delete-overlay" style={{ position: 'fixed', zIndex: 500 }} onClick={() => setDeleteTarget(null)}>
          <div className="perm-delete-card tab-panel-in" onClick={e => e.stopPropagation()}>
            <div className="perm-delete-icon"><i className="lni lni-trash-can"></i></div>
            <div className="perm-delete-title">Delete {deleteTarget.bankName}?</div>
            <div className="perm-delete-sub">
              This will permanently delete this bank. This can&apos;t be undone.
            </div>
            <div className="perm-delete-actions">
              <button className="btn btn-neu" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="btn btn-danger" disabled={deleteBank.isPending} onClick={confirmDeleteBank}>
                <i className="lni lni-trash-can"></i> {deleteBank.isPending ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
