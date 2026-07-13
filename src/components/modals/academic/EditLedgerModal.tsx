'use client'
import { useEffect, useState } from 'react'
import { ModalProps } from '../types'
import { SuccessPopup } from './SuccessPopup'
import { Ledger, LedgerInput } from '@/lib/api/academic/ledger'

interface EditLedgerModalProps extends ModalProps {
  ledger: Ledger | null
  updateLedger: {
    mutate: (variables: { id: string; input: LedgerInput }, options?: { onSuccess?: () => void }) => void
    isPending: boolean
  }
}

export function EditLedgerModal({ isOpen, onClose, showToast, ledger, updateLedger }: EditLedgerModalProps) {
  const [saved, setSaved] = useState(false)
  const [ledgerCode, setLedgerCode] = useState('')
  const [ledgerName, setLedgerName] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (isOpen && ledger) {
      setLedgerCode(ledger.ledgerCode)
      setLedgerName(ledger.ledgerName)
      setErrors({})
    }
  }, [isOpen, ledger])

  if (!isOpen || !ledger) return null

  function handleClose() { setSaved(false); onClose() }

  function validate() {
    const e: Record<string, string> = {}
    if (!ledgerCode.trim()) e.ledgerCode = 'Ledger Code is required'
    if (!ledgerName.trim()) e.ledgerName = 'Ledger Name is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit() {
    if (!ledger || !validate()) return
    updateLedger.mutate(
      { id: ledger.id, input: { ledgerCode, ledgerName } },
      { onSuccess: () => { setSaved(true); showToast('Ledger updated successfully') } },
    )
  }

  if (saved) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <SuccessPopup title="Ledger Updated!" subtitle="Your changes have been saved successfully." onClose={handleClose} />
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay open" id="edit-ledger-modal" onClick={handleClose}>
      <div className="modal modal-md" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr">
          <div className="modal-title"><i className="lni lni-pencil"></i> Edit Ledger</div>
          <button className="modal-close" onClick={handleClose}><i className="lni lni-close"></i></button>
        </div>
        <div className="g2">
          <div className="fg">
            <div className="lbl">Ledger Code <span className="req">*</span></div>
            <input
              className="ctrl font-mono uppercase"
              type="text"
              maxLength={8}
              value={ledgerCode}
              onChange={e => { setLedgerCode(e.target.value); if (errors.ledgerCode) setErrors(p => ({ ...p, ledgerCode: '' })) }}
              style={errors.ledgerCode ? { borderColor: 'var(--red)' } : undefined}
            />
            {errors.ledgerCode && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.ledgerCode}</p>}
          </div>
          <div className="fg">
            <div className="lbl">Ledger Name <span className="req">*</span></div>
            <input
              className="ctrl"
              type="text"
              value={ledgerName}
              onChange={e => { setLedgerName(e.target.value); if (errors.ledgerName) setErrors(p => ({ ...p, ledgerName: '' })) }}
              style={errors.ledgerName ? { borderColor: 'var(--red)' } : undefined}
            />
            {errors.ledgerName && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.ledgerName}</p>}
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-neu" onClick={handleClose}>Cancel</button>
          <button className="btn btn-primary" disabled={updateLedger.isPending} onClick={handleSubmit}>
            <i className="lni lni-checkmark"></i> {updateLedger.isPending ? 'Updating…' : 'Update Ledger'}
          </button>
        </div>
      </div>
    </div>
  )
}
