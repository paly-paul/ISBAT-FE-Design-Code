'use client'
import { useEffect, useState } from 'react'
import { ModalProps } from '../types'
import { SuccessPopup } from '../academic/SuccessPopup'
import { FailurePopup } from '../academic/FailurePopup'
import { SearchSelect } from '@/components/SearchSelect'
import { BankInput } from '@/lib/api/finance/bank'
import { ProcBankStatus, STATUS_LABELS, STATUS_VALUES } from '@/lib/api/finance/procBank'
import { useBank } from '@/hooks/finance/useBanks'
import { AuthError } from '@/lib/api/client'

interface EditBankModalProps extends ModalProps {
  bankGuid: string | null
  updateBank: {
    mutate: (variables: { guid: string; input: BankInput }, options?: { onSuccess?: () => void; onError?: (error: Error) => void }) => void
    isPending: boolean
  }
}

export function EditBankModal({ isOpen, onClose, showToast, bankGuid, updateBank }: EditBankModalProps) {
  const { data: bank, isLoading, isError, error } = useBank(bankGuid, isOpen)

  const [saved, setSaved]           = useState(false)
  const [failure, setFailure]       = useState<string | null>(null)
  const [shortCode, setShortCode]   = useState('')
  const [bankName, setBankName]     = useState('')
  const [compCode, setCompCode]     = useState('')
  const [branchCode, setBranchCode] = useState('')
  const [status, setStatus]         = useState<ProcBankStatus>('Active')
  const [errors, setErrors]         = useState<Record<string, string>>({})

  // Fill the form when the selected bank loads.
  useEffect(() => {
    if (!isOpen || !bank) return
    setShortCode(bank.shortCode)
    setBankName(bank.bankName)
    setCompCode(bank.compCode != null ? String(bank.compCode) : '')
    setBranchCode(bank.branchCode != null ? String(bank.branchCode) : '')
    setStatus(STATUS_LABELS[bank.status] ?? 'Active')
    setErrors({})
  }, [isOpen, bank])

  if (!isOpen) return null

  function handleClose() { setSaved(false); setFailure(null); setErrors({}); onClose() }

  function clearError(field: string) {
    setErrors(prev => (prev[field] ? { ...prev, [field]: '' } : prev))
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!shortCode.trim()) e.shortCode = 'Short Code is required'
    if (!bankName.trim()) e.bankName = 'Bank Name is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit() {
    if (!bankGuid || !validate()) return
    updateBank.mutate(
      {
        guid: bankGuid,
        input: {
          shortCode,
          bankName,
          compCode: compCode ? +compCode : null,
          branchCode: branchCode ? +branchCode : null,
          status: STATUS_VALUES[status],
        },
      },
      {
        onSuccess: () => { setSaved(true); showToast('Bank updated successfully') },
        onError: (error: Error) => setFailure(error.message || 'Failed to update bank. Please try again.'),
      },
    )
  }

  if (saved) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <SuccessPopup title="Bank Updated!" subtitle="Your changes have been saved successfully." onClose={handleClose} />
        </div>
      </div>
    )
  }

  if (failure) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <FailurePopup title="Couldn't Update Bank" subtitle={failure} onClose={() => setFailure(null)} />
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <FailurePopup
            title="Couldn't Load Bank"
            subtitle={error instanceof AuthError ? (error.message || 'Failed to load bank details.') : 'Failed to load bank details.'}
            onClose={handleClose}
          />
        </div>
      </div>
    )
  }

  if (isLoading || !bank) {
    return (
      <div className="modal-overlay open" id="edit-bank-modal">
        <div className="modal modal-md" onClick={e => e.stopPropagation()}>
          <div className="modal-hdr">
            <div className="modal-title"><i className="lni lni-pencil"></i> Edit Bank</div>
            <button className="modal-close" onClick={handleClose}><i className="lni lni-close"></i></button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 180 }}>
            <span style={{ color: 'var(--g400)' }}>Loading bank details…</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay open" id="edit-bank-modal">
      <div className="modal modal-md" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr">
          <div className="modal-title"><i className="lni lni-pencil"></i> Edit Bank</div>
          <button className="modal-close" onClick={handleClose}><i className="lni lni-close"></i></button>
        </div>
        <div className="g2">
          <div className="fg">
            <div className="lbl">Short Code <span className="req">*</span></div>
            <input
              className="ctrl font-mono uppercase"
              type="text"
              maxLength={10}
              value={shortCode}
              onChange={e => { setShortCode(e.target.value.toUpperCase()); clearError('shortCode') }}
              style={errors.shortCode ? { borderColor: 'var(--red)' } : undefined}
            />
            {errors.shortCode && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.shortCode}</p>}
          </div>
          <div className="fg">
            <div className="lbl">Bank Name <span className="req">*</span></div>
            <input
              className="ctrl"
              type="text"
              maxLength={100}
              value={bankName}
              onChange={e => { setBankName(e.target.value); clearError('bankName') }}
              style={errors.bankName ? { borderColor: 'var(--red)' } : undefined}
            />
            {errors.bankName && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.bankName}</p>}
          </div>
          <div className="fg">
            <div className="lbl">Company Code</div>
            <input
              className="ctrl"
              type="number"
              value={compCode}
              onChange={e => setCompCode(e.target.value)}
            />
          </div>
          <div className="fg">
            <div className="lbl">Branch Code</div>
            <input
              className="ctrl"
              type="number"
              value={branchCode}
              onChange={e => setBranchCode(e.target.value)}
            />
          </div>
          <div className="fg">
            <div className="lbl">Status</div>
            <SearchSelect
              options={['Active', 'Inactive']}
              value={status}
              onChange={val => setStatus(val as ProcBankStatus)}
            />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-neu" onClick={handleClose}>Cancel</button>
          <button className="btn btn-primary" disabled={updateBank.isPending} onClick={handleSubmit}>
            <i className="lni lni-checkmark"></i> {updateBank.isPending ? 'Updating…' : 'Update Bank'}
          </button>
        </div>
      </div>
    </div>
  )
}
