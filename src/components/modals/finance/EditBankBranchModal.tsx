'use client'
import { useEffect, useState } from 'react'
import { ModalProps } from '../types'
import { SuccessPopup } from '../academic/SuccessPopup'
import { FailurePopup } from '../academic/FailurePopup'
import { SearchSelect } from '@/components/SearchSelect'
import { BankBranchInput } from '@/lib/api/finance/bankBranch'
import { ProcBankStatus, STATUS_LABELS, STATUS_VALUES } from '@/lib/api/finance/procBank'
import { useBankBranch } from '@/hooks/finance/useBankBranches'
import { useBanks } from '@/hooks/finance/useBanks'
import { AuthError } from '@/lib/api/client'

interface EditBankBranchModalProps extends ModalProps {
  bankBranchGuid: string | null
  updateBankBranch: {
    mutate: (variables: { guid: string; input: BankBranchInput }, options?: { onSuccess?: () => void; onError?: (error: Error) => void }) => void
    isPending: boolean
  }
}

export function EditBankBranchModal({ isOpen, onClose, showToast, bankBranchGuid, updateBankBranch }: EditBankBranchModalProps) {
  const { data: branch, isLoading, isError, error } = useBankBranch(bankBranchGuid, isOpen)
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

  const bankOptions = banks.map(b => ({ value: b.bankGuid, label: `${b.shortCode} — ${b.bankName}` }))

  // Fill the form when the selected bank branch loads.
  useEffect(() => {
    if (!isOpen || !branch) return
    setShortCode(branch.shortCode)
    setBranchName(branch.branchName)
    setBankGuid(branch.bankGuid)
    setCompCode(branch.compCode != null ? String(branch.compCode) : '')
    setBranchCode(branch.branchCode != null ? String(branch.branchCode) : '')
    setStatus(STATUS_LABELS[branch.status] ?? 'Active')
    setSortCode(branch.sortCode)
    setErrors({})
  }, [isOpen, branch])

  if (!isOpen) return null

  function handleClose() { setSaved(false); setFailure(null); setErrors({}); onClose() }

  function clearError(field: string) {
    setErrors(prev => (prev[field] ? { ...prev, [field]: '' } : prev))
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

  function handleSubmit() {
    if (!bankBranchGuid || !validate()) return
    updateBankBranch.mutate(
      {
        guid: bankBranchGuid,
        input: {
          shortCode,
          branchName,
          bankGuid,
          compCode: compCode ? +compCode : null,
          branchCode: branchCode ? +branchCode : null,
          status: STATUS_VALUES[status],
          sortCode,
        },
      },
      {
        onSuccess: () => { setSaved(true); showToast('Bank branch updated successfully') },
        onError: (error: Error) => setFailure(error.message || 'Failed to update bank branch. Please try again.'),
      },
    )
  }

  if (saved) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <SuccessPopup title="Bank Branch Updated!" subtitle="Your changes have been saved successfully." onClose={handleClose} />
        </div>
      </div>
    )
  }

  if (failure) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <FailurePopup title="Couldn't Update Bank Branch" subtitle={failure} onClose={() => setFailure(null)} />
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <FailurePopup
            title="Couldn't Load Bank Branch"
            subtitle={error instanceof AuthError ? (error.message || 'Failed to load bank branch details.') : 'Failed to load bank branch details.'}
            onClose={handleClose}
          />
        </div>
      </div>
    )
  }

  if (isLoading || !branch) {
    return (
      <div className="modal-overlay open" id="edit-bank-branch-modal">
        <div className="modal modal-md" onClick={e => e.stopPropagation()}>
          <div className="modal-hdr modal-hdr-blue">
            <div className="modal-title"><i className="lni lni-pencil"></i> Edit Bank Branch</div>
            <button className="modal-close" onClick={handleClose}><i className="lni lni-close"></i></button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 180 }}>
            <span style={{ color: 'var(--g400)' }}>Loading bank branch details…</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay open" id="edit-bank-branch-modal">
      <div className="modal modal-md" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr modal-hdr-blue">
          <div className="modal-title"><i className="lni lni-pencil"></i> Edit Bank Branch</div>
          <button className="modal-close" onClick={handleClose}><i className="lni lni-close"></i></button>
        </div>
        <div className="g2">
          <div className="fg">
            <div className="lbl">Bank <span className="req">*</span></div>
            <SearchSelect
              options={bankOptions}
              value={bankGuid}
              onChange={val => { setBankGuid(val); clearError('bankGuid') }}
              placeholder="Select bank"
            />
            {errors.bankGuid && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.bankGuid}</p>}
          </div>
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
            <div className="lbl">Branch Name <span className="req">*</span></div>
            <input
              className="ctrl"
              type="text"
              maxLength={100}
              value={branchName}
              onChange={e => { setBranchName(e.target.value); clearError('branchName') }}
              style={errors.branchName ? { borderColor: 'var(--red)' } : undefined}
            />
            {errors.branchName && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.branchName}</p>}
          </div>
          <div className="fg">
            <div className="lbl">Sort Code <span className="req">*</span></div>
            <input
              className="ctrl font-mono uppercase"
              type="text"
              maxLength={10}
              value={sortCode}
              onChange={e => { setSortCode(e.target.value.toUpperCase()); clearError('sortCode') }}
              style={errors.sortCode ? { borderColor: 'var(--red)' } : undefined}
            />
            {errors.sortCode && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.sortCode}</p>}
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
          <button className="btn btn-primary" disabled={updateBankBranch.isPending} onClick={handleSubmit}>
            <i className="lni lni-checkmark"></i> {updateBankBranch.isPending ? 'Updating…' : 'Update Bank Branch'}
          </button>
        </div>
      </div>
    </div>
  )
}
