'use client'
import { useState } from 'react'
import { ModalProps } from '../types'
import { SuccessPopup } from '../academic/SuccessPopup'
import { FailurePopup } from '../academic/FailurePopup'
import { SearchSelect } from '@/components/SearchSelect'
import { LedgerInput } from '@/lib/api/finance/ledger'
import { useProcGlAccounts } from '@/hooks/finance/useProcGlAccounts'

interface NewLedgerModalProps extends ModalProps {
  createLedger: {
    mutate: (input: LedgerInput, options?: { onSuccess?: () => void; onError?: (error: Error) => void }) => void
    isPending: boolean
  }
}

export function NewLedgerModal({ isOpen, onClose, showToast, createLedger }: NewLedgerModalProps) {
  const { data: glAccounts = [] } = useProcGlAccounts()

  const [saved, setSaved]                 = useState(false)
  const [failure, setFailure]             = useState<string | null>(null)
  const [ledgerCode, setLedgerCode]       = useState('')
  const [ledgerName, setLedgerName]       = useState('')
  const [procGlAccountGuid, setProcGlAccountGuid] = useState('')
  const [errors, setErrors]               = useState<Record<string, string>>({})

  if (!isOpen) return null

  const glAccountOptions = glAccounts.map(a => ({ value: a.procGlAccountGuid, label: `${a.shortCode} — ${a.accName}` }))

  function reset() {
    setLedgerCode(''); setLedgerName(''); setProcGlAccountGuid(''); setErrors({})
  }

  function handleClose() {
    setSaved(false); setFailure(null); reset()
    onClose()
  }

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

  if (failure) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <FailurePopup title="Couldn't Add Ledger" subtitle={failure} onClose={() => setFailure(null)} />
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay open" id="new-ledger-modal">
      <div className="modal modal-md" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr modal-hdr-blue">
          <div className="modal-title"><i className="lni lni-book"></i> Add Ledger</div>
          <button className="modal-close" onClick={handleClose}><i className="lni lni-close"></i></button>
        </div>
        <div className="g2">
          <div className="fg">
            <div className="lbl">Ledger Code <span className="req">*</span></div>
            <input
              className="ctrl font-mono uppercase"
              type="text"
              placeholder="e.g. TF"
              maxLength={20}
              value={ledgerCode}
              onChange={e => { setLedgerCode(e.target.value.toUpperCase()); if (errors.ledgerCode) setErrors(p => ({ ...p, ledgerCode: '' })) }}
              style={errors.ledgerCode ? { borderColor: 'var(--red)' } : undefined}
            />
            {errors.ledgerCode && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.ledgerCode}</p>}
          </div>
          <div className="fg">
            <div className="lbl">Ledger Name <span className="req">*</span></div>
            <input
              className="ctrl"
              type="text"
              placeholder="e.g. Tuition Fee"
              maxLength={100}
              value={ledgerName}
              onChange={e => { setLedgerName(e.target.value); if (errors.ledgerName) setErrors(p => ({ ...p, ledgerName: '' })) }}
              style={errors.ledgerName ? { borderColor: 'var(--red)' } : undefined}
            />
            {errors.ledgerName && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.ledgerName}</p>}
          </div>
          <div className="fg span2">
            <div className="lbl">GL Account</div>
            <SearchSelect
              options={glAccountOptions}
              value={procGlAccountGuid}
              onChange={setProcGlAccountGuid}
              placeholder="Optional — link to a GL account"
            />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-neu" onClick={handleClose}>Cancel</button>
          <button
            className="btn btn-primary"
            disabled={createLedger.isPending}
            onClick={() => {
              if (!validate()) return
              createLedger.mutate(
                { ledgerCode, ledgerName, procGlAccountGuid: procGlAccountGuid || null },
                {
                  onSuccess: () => { setSaved(true); showToast('Ledger added successfully') },
                  onError: (error: Error) => setFailure(error.message || 'Failed to add ledger. Please try again.'),
                },
              )
            }}
          >
            <i className="lni lni-checkmark"></i> {createLedger.isPending ? 'Adding…' : 'Add Ledger'}
          </button>
        </div>
      </div>
    </div>
  )
}
