'use client'
import { useState } from 'react'
import { ModalProps } from '../types'
import { SuccessPopup } from './SuccessPopup'

export function NewLedgerModal({ isOpen, onClose, showToast }: ModalProps) {
  const [saved, setSaved]           = useState(false)
  const [ledgerCode, setLedgerCode] = useState('')
  const [ledgerName, setLedgerName] = useState('')
  const [errors, setErrors]         = useState<Record<string, string>>({})

  if (!isOpen) return null

  function handleClose() { setSaved(false); setLedgerCode(''); setLedgerName(''); setErrors({}); onClose() }

  function validate() {
    const e: Record<string, string> = {}
    if (!ledgerCode.trim()) e.ledgerCode = 'Ledger Code is required'
    if (!ledgerName.trim()) e.ledgerName = 'Ledger Name is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  if (saved) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <SuccessPopup title="Ledger Added!" subtitle="The new ledger has been saved successfully." onClose={handleClose} />
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay open" id="new-ledger-modal" onClick={handleClose}>
      <div className="modal modal-md" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr">
          <div className="modal-title"><i className="lni lni-book"></i> Add Ledger</div>
          <button className="modal-close" onClick={handleClose}><i className="lni lni-close"></i></button>
        </div>
        <div className="g2">
          <div className="fg">
            <div className="lbl">Ledger Code <span className="req">*</span></div>
            <input
              className="ctrl font-mono uppercase"
              type="text"
              placeholder="e.g. TUI"
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
              placeholder="e.g. Tuition Fees"
              value={ledgerName}
              onChange={e => { setLedgerName(e.target.value); if (errors.ledgerName) setErrors(p => ({ ...p, ledgerName: '' })) }}
              style={errors.ledgerName ? { borderColor: 'var(--red)' } : undefined}
            />
            {errors.ledgerName && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.ledgerName}</p>}
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-neu" onClick={handleClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => { if (validate()) setSaved(true) }}>
            <i className="lni lni-checkmark"></i> Add Ledger
          </button>
        </div>
      </div>
    </div>
  )
}
