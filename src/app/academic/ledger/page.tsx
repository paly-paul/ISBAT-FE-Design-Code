'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ScrollTable } from '@/components/ScrollTable'
import { ActionMenu } from '@/components/ActionMenu'
import { Toast } from '@/components/Toast'
import { EmptyState } from '@/components/EmptyState'
import { NewLedgerModal } from '@/components/modals/academic/NewLedgerModal'
import { EditLedgerModal } from '@/components/modals/academic/EditLedgerModal'

export default function Page() {
  const router = useRouter()
  const [openModals, setOpenModals] = useState<Set<string>>(new Set())
  const [toast, setToast]           = useState<{ msg: string; type: string } | null>(null)

  function nav(id: string) { router.push('/academic/' + id) }
  function openModal(id: string)  { setOpenModals(prev => new Set(prev).add(id)) }
  function closeModal(id: string) { setOpenModals(prev => { const s = new Set(prev); s.delete(id); return s }) }
  function showToast(msg: string, type = '') { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }

  const rows = [
    { ledgerCode: 'TUI', ledgerName: 'Tuition Fees' },
    { ledgerCode: 'REG', ledgerName: 'Registration Fees' },
    { ledgerCode: 'EXA', ledgerName: 'Examination Fees' },
    { ledgerCode: 'ACC', ledgerName: 'Accommodation Fees' },
    { ledgerCode: 'LIB', ledgerName: 'Library Fees' },
    { ledgerCode: 'MED', ledgerName: 'Medical Fees' },
  ]

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
                </tr>
              </thead>
              <tbody>
                {rows.length === 0
                  ? <EmptyState colSpan={999} hasFilters={false} onClearFilters={() => {}} />
                  : null}
                {rows.map((r, i) => (
                  <tr key={i}>
                    <td>
                      <ActionMenu>
                        <button className="btn btn-neu btn-sm" onClick={() => openModal('edit-ledger-modal')}>
                          <i className="lni lni-pencil"></i> Edit
                        </button>
                      </ActionMenu>
                    </td>
                    <td className="font-mono font-bold">{r.ledgerCode}</td>
                    <td><strong>{r.ledgerName}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollTable>
        </div>
      </div>
      <NewLedgerModal  isOpen={openModals.has('new-ledger-modal')}  onClose={() => closeModal('new-ledger-modal')}  showToast={showToast} />
      <EditLedgerModal isOpen={openModals.has('edit-ledger-modal')} onClose={() => closeModal('edit-ledger-modal')} showToast={showToast} />
      <Toast toast={toast} />
    </>
  )
}
