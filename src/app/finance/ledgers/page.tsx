'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ScrollTable } from '@/components/ScrollTable'
import { ActionMenu } from '@/components/ActionMenu'
import { Toast } from '@/components/Toast'
import { EmptyState } from '@/components/EmptyState'
import { TableLoadingState } from '@/components/TableLoadingState'
import { NewLedgerModal } from '@/components/modals/finance/NewLedgerModal'
import { EditLedgerModal } from '@/components/modals/finance/EditLedgerModal'
import { useLedgers, useCreateLedger, useUpdateLedger, useDeleteLedger, Ledger } from '@/hooks/finance/useLedgers'
import { useProcGlAccounts } from '@/hooks/finance/useProcGlAccounts'

export default function Page() {
  const router = useRouter()
  const [openModals, setOpenModals] = useState<Set<string>>(new Set())
  const [toast, setToast]           = useState<{ msg: string; type: string } | null>(null)
  const [editingLedgerGuid, setEditingLedgerGuid] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Ledger | null>(null)

  const { data: rows = [], isLoading } = useLedgers()
  const { data: glAccounts = [] } = useProcGlAccounts()
  const createLedger = useCreateLedger()
  const updateLedger = useUpdateLedger()
  const deleteLedger = useDeleteLedger()

  function nav(id: string) { router.push('/finance/' + id) }
  function openModal(id: string)  { setOpenModals(prev => new Set(prev).add(id)) }
  function closeModal(id: string) { setOpenModals(prev => { const s = new Set(prev); s.delete(id); return s }) }
  function showToast(msg: string, type = '') { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }

  // procGlAccountGuid isn't confirmed present on the read shape (only
  // intGlAccount is documented) — resolve a name via the already-loaded GL
  // account list when it is, otherwise fall back to the raw legacy int since
  // ProcGlAccounts has no names-by-id lookup to resolve it properly.
  function glAccountLabel(ledger: Ledger) {
    if (ledger.procGlAccountGuid) {
      const acc = glAccounts.find(a => a.procGlAccountGuid === ledger.procGlAccountGuid)
      if (acc) return `${acc.shortCode} — ${acc.accName}`
    }
    if (ledger.intGlAccount != null) return `GL #${ledger.intGlAccount}`
    return null
  }

  function openEditModal(guid: string) {
    setEditingLedgerGuid(guid)
    openModal('edit-ledger-modal')
  }

  function confirmDeleteLedger() {
    if (!deleteTarget) return
    deleteLedger.mutate(deleteTarget.ledgerGuid, {
      onSuccess: () => { setDeleteTarget(null); showToast('Ledger deleted successfully') },
      onError: (error: Error) => showToast(error.message || 'Failed to delete ledger', 'error'),
    })
  }

  return (
    <>
      <div className="page active">
        <div className="pg-hdr">
          <div>
            <div className="pg-title">Ledger Master</div>
            <div className="pg-sub">Define ledger codes used across fee structures and financial records</div>
          </div>
          <button className="btn btn-primary" onClick={() => openModal('new-ledger-modal')}>
            <i className="lni lni-plus"></i> Add Ledger
          </button>
        </div>
        <div className="card">
          <div className="card-hdr">
            <div className="card-title"><span className="ctitle-icon"><i className="lni lni-book"></i></span> Ledgers</div>
          </div>
          <ScrollTable>
            <table>
              <thead>
                <tr>
                  <th style={{ width: 48 }}></th>
                  <th>Ledger Code</th>
                  <th>Ledger Name</th>
                  <th>GL Account</th>
                </tr>
              </thead>
              <tbody>
                {isLoading
                  ? <TableLoadingState colSpan={999} />
                  : rows.length === 0
                    ? <EmptyState colSpan={999} hasFilters={false} onClearFilters={() => {}} />
                    : null}
                {rows.map((r) => (
                  <tr key={r.ledgerGuid}>
                    <td>
                      <ActionMenu>
                        <button className="btn btn-neu btn-sm" onClick={() => openEditModal(r.ledgerGuid)}>
                          <i className="lni lni-pencil"></i> Edit
                        </button>
                        <button className="btn btn-neu btn-sm" onClick={() => setDeleteTarget(r)}>
                          <i className="lni lni-trash-can"></i> Delete
                        </button>
                      </ActionMenu>
                    </td>
                    <td className="font-mono font-bold">{r.ledgerCode}</td>
                    <td><strong>{r.ledgerName}</strong></td>
                    <td>{glAccountLabel(r) ?? <span className="text-g400">—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollTable>
        </div>
      </div>
      <NewLedgerModal
        isOpen={openModals.has('new-ledger-modal')}
        onClose={() => closeModal('new-ledger-modal')}
        showToast={showToast}
        createLedger={createLedger}
      />
      <EditLedgerModal
        isOpen={openModals.has('edit-ledger-modal')}
        onClose={() => closeModal('edit-ledger-modal')}
        showToast={showToast}
        ledgerGuid={editingLedgerGuid}
        updateLedger={updateLedger}
      />
      <Toast toast={toast} />

      {deleteTarget && (
        <div className="perm-delete-overlay" style={{ position: 'fixed', zIndex: 500 }} onClick={() => setDeleteTarget(null)}>
          <div className="perm-delete-card tab-panel-in" onClick={e => e.stopPropagation()}>
            <div className="perm-delete-icon"><i className="lni lni-trash-can"></i></div>
            <div className="perm-delete-title">Delete {deleteTarget.ledgerName}?</div>
            <div className="perm-delete-sub">
              This will permanently delete this ledger. This can&apos;t be undone.
            </div>
            <div className="perm-delete-actions">
              <button className="btn btn-neu" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="btn btn-danger" disabled={deleteLedger.isPending} onClick={confirmDeleteLedger}>
                <i className="lni lni-trash-can"></i> {deleteLedger.isPending ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
