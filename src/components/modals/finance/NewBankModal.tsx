'use client'
import { useState } from 'react'
import { ModalProps } from '../types'
import { SuccessPopup } from '../academic/SuccessPopup'
import { FailurePopup } from '../academic/FailurePopup'
import { SearchSelect } from '@/components/SearchSelect'
import { BankInput } from '@/lib/api/finance/bank'
import { ProcBankStatus, STATUS_VALUES } from '@/lib/api/finance/procBank'

interface NewBankModalProps extends ModalProps {
  createBank: {
    mutate: (input: BankInput, options?: { onSuccess?: () => void; onError?: (error: Error) => void }) => void
    isPending: boolean
  }
}

export function NewBankModal({ isOpen, onClose, showToast, createBank }: NewBankModalProps) {
  const [saved, setSaved]           = useState(false)
  const [failure, setFailure]       = useState<string | null>(null)
  const [shortCode, setShortCode]   = useState('')
  const [bankName, setBankName]     = useState('')
  const [compCode, setCompCode]     = useState('')
  const [branchCode, setBranchCode] = useState('')
  const [status, setStatus]         = useState<ProcBankStatus>('Active')
  const [errors, setErrors]         = useState<Record<string, string>>({})

  if (!isOpen) return null

  function reset() {
    setShortCode(''); setBankName(''); setCompCode(''); setBranchCode(''); setStatus('Active'); setErrors({})
  }

  function handleClose() {
    setSaved(false); setFailure(null); reset()
    onClose()
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!shortCode.trim()) e.shortCode = 'Short Code is required'
    if (!bankName.trim()) e.bankName = 'Bank Name is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  if (saved) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <SuccessPopup title="Bank Added!" subtitle="The new bank has been saved successfully." onClose={handleClose} />
        </div>
      </div>
    )
  }

  if (failure) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <FailurePopup title="Couldn't Add Bank" subtitle={failure} onClose={() => setFailure(null)} />
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay open" id="new-bank-modal">
      <div className="modal modal-md" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr modal-hdr-blue">
          <div className="modal-title"><i className="lni lni-coin"></i> Add Bank</div>
          <button className="modal-close" onClick={handleClose}><i className="lni lni-close"></i></button>
        </div>
        <div className="g2">
          <div className="fg">
            <div className="lbl">Short Code <span className="req">*</span></div>
            <input
              className="ctrl font-mono uppercase"
              type="text"
              placeholder="e.g. DTB"
              maxLength={10}
              value={shortCode}
              onChange={e => { setShortCode(e.target.value.toUpperCase()); if (errors.shortCode) setErrors(p => ({ ...p, shortCode: '' })) }}
              style={errors.shortCode ? { borderColor: 'var(--red)' } : undefined}
            />
            {errors.shortCode && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.shortCode}</p>}
          </div>
          <div className="fg">
            <div className="lbl">Bank Name <span className="req">*</span></div>
            <input
              className="ctrl"
              type="text"
              placeholder="e.g. Diamond Trust Bank"
              maxLength={100}
              value={bankName}
              onChange={e => { setBankName(e.target.value); if (errors.bankName) setErrors(p => ({ ...p, bankName: '' })) }}
              style={errors.bankName ? { borderColor: 'var(--red)' } : undefined}
            />
            {errors.bankName && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.bankName}</p>}
          </div>
          <div className="fg">
            <div className="lbl">Company Code</div>
            <input
              className="ctrl"
              type="number"
              placeholder="Optional"
              value={compCode}
              onChange={e => setCompCode(e.target.value)}
            />
          </div>
          <div className="fg">
            <div className="lbl">Branch Code</div>
            <input
              className="ctrl"
              type="number"
              placeholder="Optional"
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
          <button
            className="btn btn-primary"
            disabled={createBank.isPending}
            onClick={() => {
              if (!validate()) return
              createBank.mutate(
                {
                  shortCode,
                  bankName,
                  compCode: compCode ? +compCode : null,
                  branchCode: branchCode ? +branchCode : null,
                  status: STATUS_VALUES[status],
                },
                {
                  onSuccess: () => { setSaved(true); showToast('Bank added successfully') },
                  onError: (error: Error) => setFailure(error.message || 'Failed to add bank. Please try again.'),
                },
              )
            }}
          >
            <i className="lni lni-checkmark"></i> {createBank.isPending ? 'Adding…' : 'Add Bank'}
          </button>
        </div>
      </div>
    </div>
  )
}
