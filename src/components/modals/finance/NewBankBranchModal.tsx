'use client'
import { useState } from 'react'
import { ModalProps } from '../types'
import { SuccessPopup } from '../academic/SuccessPopup'
import { FailurePopup } from '../academic/FailurePopup'
import { SearchSelect } from '@/components/SearchSelect'
import { BankBranchInput } from '@/lib/api/finance/bankBranch'
import { ProcBankStatus, STATUS_VALUES } from '@/lib/api/finance/procBank'
import { useBanks } from '@/hooks/finance/useBanks'

interface NewBankBranchModalProps extends ModalProps {
  createBankBranch: {
    mutate: (input: BankBranchInput, options?: { onSuccess?: () => void; onError?: (error: Error) => void }) => void
    isPending: boolean
  }
}

export function NewBankBranchModal({ isOpen, onClose, showToast, createBankBranch }: NewBankBranchModalProps) {
  const { data: banks = [] } = useBanks()

  const [saved, setSaved]           = useState(false)
  const [failure, setFailure]       = useState<string | null>(null)
  const [shortCode, setShortCode]   = useState('')
  const [branchName, setBranchName] = useState('')
  const [bankGuid, setBankGuid]     = useState('')
  const [compCode, setCompCode]     = useState('')
  const [branchCode, setBranchCode] = useState('')
  const [status, setStatus]         = useState<ProcBankStatus>('Active')
  const [sortCode, setSortCode]     = useState('')
  const [errors, setErrors]         = useState<Record<string, string>>({})

  if (!isOpen) return null

  const bankOptions = banks.map(b => ({ value: b.bankGuid, label: `${b.shortCode} — ${b.bankName}` }))

  function reset() {
    setShortCode(''); setBranchName(''); setBankGuid(''); setCompCode(''); setBranchCode('')
    setStatus('Active'); setSortCode(''); setErrors({})
  }

  function handleClose() {
    setSaved(false); setFailure(null); reset()
    onClose()
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!shortCode.trim()) e.shortCode = 'Short Code is required'
    if (!branchName.trim()) e.branchName = 'Branch Name is required'
    if (!bankGuid) e.bankGuid = 'Bank is required'
    if (!sortCode.trim()) e.sortCode = 'Sort Code is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  if (saved) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <SuccessPopup title="Bank Branch Added!" subtitle="The new bank branch has been saved successfully." onClose={handleClose} />
        </div>
      </div>
    )
  }

  if (failure) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <FailurePopup title="Couldn't Add Bank Branch" subtitle={failure} onClose={() => setFailure(null)} />
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay open" id="new-bank-branch-modal">
      <div className="modal modal-md" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr modal-hdr-blue">
          <div className="modal-title"><i className="lni lni-map-marker"></i> Add Bank Branch</div>
          <button className="modal-close" onClick={handleClose}><i className="lni lni-close"></i></button>
        </div>
        <div className="g2">
          <div className="fg">
            <div className="lbl">Bank <span className="req">*</span></div>
            <SearchSelect
              options={bankOptions}
              value={bankGuid}
              onChange={val => { setBankGuid(val); if (errors.bankGuid) setErrors(p => ({ ...p, bankGuid: '' })) }}
              placeholder="Select bank"
            />
            {errors.bankGuid && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.bankGuid}</p>}
          </div>
          <div className="fg">
            <div className="lbl">Short Code <span className="req">*</span></div>
            <input
              className="ctrl font-mono uppercase"
              type="text"
              placeholder="e.g. STBC-KLA"
              maxLength={10}
              value={shortCode}
              onChange={e => { setShortCode(e.target.value.toUpperCase()); if (errors.shortCode) setErrors(p => ({ ...p, shortCode: '' })) }}
              style={errors.shortCode ? { borderColor: 'var(--red)' } : undefined}
            />
            {errors.shortCode && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.shortCode}</p>}
          </div>
          <div className="fg">
            <div className="lbl">Branch Name <span className="req">*</span></div>
            <input
              className="ctrl"
              type="text"
              placeholder="e.g. Kampala Main Branch"
              maxLength={100}
              value={branchName}
              onChange={e => { setBranchName(e.target.value); if (errors.branchName) setErrors(p => ({ ...p, branchName: '' })) }}
              style={errors.branchName ? { borderColor: 'var(--red)' } : undefined}
            />
            {errors.branchName && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.branchName}</p>}
          </div>
          <div className="fg">
            <div className="lbl">Sort Code <span className="req">*</span></div>
            <input
              className="ctrl font-mono uppercase"
              type="text"
              placeholder="e.g. 080122"
              maxLength={10}
              value={sortCode}
              onChange={e => { setSortCode(e.target.value.toUpperCase()); if (errors.sortCode) setErrors(p => ({ ...p, sortCode: '' })) }}
              style={errors.sortCode ? { borderColor: 'var(--red)' } : undefined}
            />
            {errors.sortCode && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.sortCode}</p>}
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
            disabled={createBankBranch.isPending}
            onClick={() => {
              if (!validate()) return
              createBankBranch.mutate(
                {
                  shortCode,
                  branchName,
                  bankGuid,
                  compCode: compCode ? +compCode : null,
                  branchCode: branchCode ? +branchCode : null,
                  status: STATUS_VALUES[status],
                  sortCode,
                },
                {
                  onSuccess: () => { setSaved(true); showToast('Bank branch added successfully') },
                  onError: (error: Error) => setFailure(error.message || 'Failed to add bank branch. Please try again.'),
                },
              )
            }}
          >
            <i className="lni lni-checkmark"></i> {createBankBranch.isPending ? 'Adding…' : 'Add Bank Branch'}
          </button>
        </div>
      </div>
    </div>
  )
}
