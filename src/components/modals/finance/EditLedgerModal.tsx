'use client'
import { useEffect, useState } from 'react'
import { ModalProps } from '../types'
import { SuccessPopup } from '../academic/SuccessPopup'
import { FailurePopup } from '../academic/FailurePopup'
import { SearchSelect } from '@/components/SearchSelect'
import { LedgerInput } from '@/lib/api/finance/ledger'
import { useLedger } from '@/hooks/finance/useLedgers'
import { useProcGlAccounts } from '@/hooks/finance/useProcGlAccounts'
import { AuthError } from '@/lib/api/client'

interface EditLedgerModalProps extends ModalProps {
  ledgerGuid: string | null
  updateLedger: {
    mutate: (variables: { guid: string; input: LedgerInput }, options?: { onSuccess?: () => void; onError?: (error: Error) => void }) => void
    isPending: boolean
  }
}

export function EditLedgerModal({ isOpen, onClose, showToast, ledgerGuid, updateLedger }: EditLedgerModalProps) {
  const { data: ledger, isLoading, isError, error } = useLedger(ledgerGuid, isOpen)
  const { data: glAccounts = [] } = useProcGlAccounts()

  const [saved, setSaved]           = useState(false)
  const [failure, setFailure]       = useState<string | null>(null)
  const [ledgerCode, setLedgerCode] = useState('')
  const [ledgerName, setLedgerName] = useState('')
  const [procGlAccountGuid, setProcGlAccountGuid] = useState('')
  const [errors, setErrors]         = useState<Record<string, string>>({})

  const glAccountOptions = glAccounts.map(a => ({ value: a.procGlAccountGuid, label: `${a.shortCode} — ${a.accName}` }))

  // Fill the form when the selected ledger loads. procGlAccountGuid may not
  // actually be present on the read shape (only confirmed via intGlAccount) —
  // when it's missing but intGlAccount isn't, there's an existing link we
  // can't resolve, so the picker starts empty and the modal warns below.
  useEffect(() => {
    if (!isOpen || !ledger) return
    setLedgerCode(ledger.ledgerCode)
    setLedgerName(ledger.ledgerName)
    setProcGlAccountGuid(ledger.procGlAccountGuid ?? '')
    setErrors({})
  }, [isOpen, ledger])

  if (!isOpen) return null

  function handleClose() { setSaved(false); setFailure(null); setErrors({}); onClose() }

  function clearError(field: string) {
    setErrors(prev => (prev[field] ? { ...prev, [field]: '' } : prev))
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!ledgerCode.trim()) e.ledgerCode = 'Ledger Code is required'
    if (!ledgerName.trim()) e.ledgerName = 'Ledger Name is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit() {
    if (!ledgerGuid || !validate()) return
    updateLedger.mutate(
      { guid: ledgerGuid, input: { ledgerCode, ledgerName, procGlAccountGuid: procGlAccountGuid || null } },
      {
        onSuccess: () => { setSaved(true); showToast('Ledger updated successfully') },
        onError: (error: Error) => setFailure(error.message || 'Failed to update ledger. Please try again.'),
      },
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

  if (failure) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <FailurePopup title="Couldn't Update Ledger" subtitle={failure} onClose={() => setFailure(null)} />
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <FailurePopup
            title="Couldn't Load Ledger"
            subtitle={error instanceof AuthError ? (error.message || 'Failed to load ledger details.') : 'Failed to load ledger details.'}
            onClose={handleClose}
          />
        </div>
      </div>
    )
  }

  if (isLoading || !ledger) {
    return (
      <div className="modal-overlay open" id="edit-ledger-modal">
        <div className="modal modal-md" onClick={e => e.stopPropagation()}>
          <div className="modal-hdr">
            <div className="modal-title"><i className="lni lni-pencil"></i> Edit Ledger</div>
            <button className="modal-close" onClick={handleClose}><i className="lni lni-close"></i></button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 180 }}>
            <span style={{ color: 'var(--g400)' }}>Loading ledger details…</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay open" id="edit-ledger-modal">
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
              maxLength={20}
              value={ledgerCode}
              onChange={e => { setLedgerCode(e.target.value.toUpperCase()); clearError('ledgerCode') }}
              style={errors.ledgerCode ? { borderColor: 'var(--red)' } : undefined}
            />
            {errors.ledgerCode && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.ledgerCode}</p>}
          </div>
          <div className="fg">
            <div className="lbl">Ledger Name <span className="req">*</span></div>
            <input
              className="ctrl"
              type="text"
              maxLength={100}
              value={ledgerName}
              onChange={e => { setLedgerName(e.target.value); clearError('ledgerName') }}
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
          <button className="btn btn-primary" disabled={updateLedger.isPending} onClick={handleSubmit}>
            <i className="lni lni-checkmark"></i> {updateLedger.isPending ? 'Updating…' : 'Update Ledger'}
          </button>
        </div>
      </div>
    </div>
  )
}
