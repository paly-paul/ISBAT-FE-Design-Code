'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ScrollTable } from '@/components/ScrollTable'
import { ActionMenu } from '@/components/ActionMenu'
import { Toast } from '@/components/Toast'
import { EmptyState } from '@/components/EmptyState'
import { TableLoadingState } from '@/components/TableLoadingState'
import { NewBankBranchModal } from '@/components/modals/finance/NewBankBranchModal'
import { EditBankBranchModal } from '@/components/modals/finance/EditBankBranchModal'
import { useBankBranches, useCreateBankBranch, useUpdateBankBranch, useDeleteBankBranch, BankBranch } from '@/hooks/finance/useBankBranches'
import { useBanks } from '@/hooks/finance/useBanks'
import { STATUS_LABELS } from '@/lib/api/finance/procBank'

export default function Page() {
  const router = useRouter()
  const [openModals, setOpenModals] = useState<Set<string>>(new Set())
  const [toast, setToast]           = useState<{ msg: string; type: string } | null>(null)
  const [editingBranchGuid, setEditingBranchGuid] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<BankBranch | null>(null)

  const { data: rows = [], isLoading } = useBankBranches()
  const { data: banks = [] } = useBanks()
  const createBankBranch = useCreateBankBranch()
  const updateBankBranch = useUpdateBankBranch()
  const deleteBankBranch = useDeleteBankBranch()

  function nav(id: string) { router.push('/finance/' + id) }
  function openModal(id: string)  { setOpenModals(prev => new Set(prev).add(id)) }
  function closeModal(id: string) { setOpenModals(prev => { const s = new Set(prev); s.delete(id); return s }) }
  function showToast(msg: string, type = '') { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }

  function bankName(guid: string) {
    return banks.find(b => b.bankGuid === guid)?.bankName ?? guid
  }

  function openEditModal(guid: string) {
    setEditingBranchGuid(guid)
    openModal('edit-bank-branch-modal')
  }

  function confirmDeleteBankBranch() {
    if (!deleteTarget) return
    deleteBankBranch.mutate(deleteTarget.bankBranchGuid, {
      onSuccess: () => { setDeleteTarget(null); showToast('Bank branch deleted successfully') },
      onError: (error: Error) => showToast(error.message || 'Failed to delete bank branch', 'error'),
    })
  }

  return (
    <>
      <div className="page active">
        <div className="pg-hdr">
          <div>
            <div className="pg-title">Bank Branch Master</div>
            <div className="pg-sub">Manage branches under each bank</div>
          </div>
          <button className="btn btn-primary" onClick={() => openModal('new-bank-branch-modal')}>
            <i className="lni lni-plus"></i> Add Bank Branch
          </button>
        </div>
        <div className="card">
          <div className="card-hdr">
            <div className="card-title"><span className="ctitle-icon"><i className="lni lni-map-marker"></i></span> Bank Branches</div>
          </div>
          <ScrollTable>
            <table>
              <thead>
                <tr>
                  <th style={{ width: 48 }}></th>
                  <th>Short Code</th>
                  <th>Branch Name</th>
                  <th>Bank</th>
                  <th>Sort Code</th>
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
                  <tr key={r.bankBranchGuid}>
                    <td>
                      <ActionMenu>
                        <button className="btn btn-neu btn-sm" onClick={() => openEditModal(r.bankBranchGuid)}>
                          <i className="lni lni-pencil"></i> Edit
                        </button>
                        <button className="btn btn-neu btn-sm" onClick={() => setDeleteTarget(r)}>
                          <i className="lni lni-trash-can"></i> Delete
                        </button>
                      </ActionMenu>
                    </td>
                    <td className="font-mono font-bold uppercase">{r.shortCode}</td>
                    <td><strong>{r.branchName}</strong></td>
                    <td>{bankName(r.bankGuid)}</td>
                    <td className="font-mono">{r.sortCode}</td>
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
      <NewBankBranchModal
        isOpen={openModals.has('new-bank-branch-modal')}
        onClose={() => closeModal('new-bank-branch-modal')}
        showToast={showToast}
        createBankBranch={createBankBranch}
      />
      <EditBankBranchModal
        isOpen={openModals.has('edit-bank-branch-modal')}
        onClose={() => closeModal('edit-bank-branch-modal')}
        showToast={showToast}
        bankBranchGuid={editingBranchGuid}
        updateBankBranch={updateBankBranch}
      />
      <Toast toast={toast} />

      {deleteTarget && (
        <div className="perm-delete-overlay" style={{ position: 'fixed', zIndex: 500 }} onClick={() => setDeleteTarget(null)}>
          <div className="perm-delete-card tab-panel-in" onClick={e => e.stopPropagation()}>
            <div className="perm-delete-icon"><i className="lni lni-trash-can"></i></div>
            <div className="perm-delete-title">Delete {deleteTarget.branchName}?</div>
            <div className="perm-delete-sub">
              This will permanently delete this bank branch. This can&apos;t be undone.
            </div>
            <div className="perm-delete-actions">
              <button className="btn btn-neu" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="btn btn-danger" disabled={deleteBankBranch.isPending} onClick={confirmDeleteBankBranch}>
                <i className="lni lni-trash-can"></i> {deleteBankBranch.isPending ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
