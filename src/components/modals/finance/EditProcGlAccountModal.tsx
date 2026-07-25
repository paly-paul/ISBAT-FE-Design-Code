'use client'
import { useEffect, useState } from 'react'
import { ModalProps } from '../types'
import { SuccessPopup } from '../academic/SuccessPopup'
import { FailurePopup } from '../academic/FailurePopup'
import { SearchSelect } from '@/components/SearchSelect'
import { ProcGlAccountInput, ProcGlAccountStatus, ProcGlAccountType, STATUS_LABELS, STATUS_VALUES, TYPE_LABELS, TYPE_VALUES } from '@/lib/api/finance/procGlAccount'
import { useProcGlAccount } from '@/hooks/finance/useProcGlAccounts'
import { AuthError } from '@/lib/api/client'

interface EditProcGlAccountModalProps extends ModalProps {
  procGlAccountGuid: string | null
  updateProcGlAccount: {
    mutate: (variables: { guid: string; input: ProcGlAccountInput }, options?: { onSuccess?: () => void; onError?: (error: Error) => void }) => void
    isPending: boolean
  }
}

export function EditProcGlAccountModal({ isOpen, onClose, showToast, procGlAccountGuid, updateProcGlAccount }: EditProcGlAccountModalProps) {
  const { data: account, isLoading, isError, error } = useProcGlAccount(procGlAccountGuid, isOpen)

  const [saved, setSaved]         = useState(false)
  const [failure, setFailure]     = useState<string | null>(null)
  const [shortCode, setShortCode] = useState('')
  const [accName, setAccName]     = useState('')
  const [status, setStatus]       = useState<ProcGlAccountStatus>('Active')
  const [type, setType]           = useState<ProcGlAccountType | ''>('')
  const [blocked, setBlocked]     = useState(false)
  const [errors, setErrors]       = useState<Record<string, string>>({})

  // Fill the form when the selected GL account loads.
  useEffect(() => {
    if (!isOpen || !account) return
    setShortCode(account.shortCode)
    setAccName(account.accName)
    setStatus(STATUS_LABELS[account.status] ?? 'Active')
    setType(TYPE_LABELS[account.type] ?? '')
    setBlocked(account.blocked)
    setErrors({})
  }, [isOpen, account])

  if (!isOpen) return null

  function handleClose() { setSaved(false); setFailure(null); setErrors({}); onClose() }

  function clearError(field: string) {
    setErrors(prev => (prev[field] ? { ...prev, [field]: '' } : prev))
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!shortCode.trim()) e.shortCode = 'Short Code is required'
    if (!accName.trim()) e.accName = 'Account Name is required'
    if (!type) e.type = 'Account Type is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit() {
    if (!procGlAccountGuid || !validate()) return
    updateProcGlAccount.mutate(
      {
        guid: procGlAccountGuid,
        input: {
          shortCode,
          accName,
          status: STATUS_VALUES[status],
          type: TYPE_VALUES[type as ProcGlAccountType],
          typeName: null,
          blocked,
        },
      },
      {
        onSuccess: () => { setSaved(true); showToast('GL account updated successfully') },
        onError: (error: Error) => setFailure(error.message || 'Failed to update GL account. Please try again.'),
      },
    )
  }

  if (saved) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <SuccessPopup title="GL Account Updated!" subtitle="Your changes have been saved successfully." onClose={handleClose} />
        </div>
      </div>
    )
  }

  if (failure) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <FailurePopup title="Couldn't Update GL Account" subtitle={failure} onClose={() => setFailure(null)} />
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <FailurePopup
            title="Couldn't Load GL Account"
            subtitle={error instanceof AuthError ? (error.message || 'Failed to load GL account details.') : 'Failed to load GL account details.'}
            onClose={handleClose}
          />
        </div>
      </div>
    )
  }

  if (isLoading || !account) {
    return (
      <div className="modal-overlay open" id="edit-proc-gl-account-modal">
        <div className="modal modal-md" onClick={e => e.stopPropagation()}>
          <div className="modal-hdr">
            <div className="modal-title"><i className="lni lni-pencil"></i> Edit GL Account</div>
            <button className="modal-close" onClick={handleClose}><i className="lni lni-close"></i></button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 180 }}>
            <span style={{ color: 'var(--g400)' }}>Loading GL account details…</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay open" id="edit-proc-gl-account-modal">
      <div className="modal modal-md" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr">
          <div className="modal-title"><i className="lni lni-pencil"></i> Edit GL Account</div>
          <button className="modal-close" onClick={handleClose}><i className="lni lni-close"></i></button>
        </div>
        <div className="g2">
          <div className="fg">
            <div className="lbl">Short Code <span className="req">*</span></div>
            <input
              className="ctrl font-mono"
              type="text"
              value={shortCode}
              onChange={e => { setShortCode(e.target.value); clearError('shortCode') }}
              style={errors.shortCode ? { borderColor: 'var(--red)' } : undefined}
            />
            {errors.shortCode && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.shortCode}</p>}
          </div>
          <div className="fg">
            <div className="lbl">Account Name <span className="req">*</span></div>
            <input
              className="ctrl"
              type="text"
              value={accName}
              onChange={e => { setAccName(e.target.value); clearError('accName') }}
              style={errors.accName ? { borderColor: 'var(--red)' } : undefined}
            />
            {errors.accName && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.accName}</p>}
          </div>
          <div className="fg">
            <div className="lbl">Account Type <span className="req">*</span></div>
            <SearchSelect
              options={['Asset', 'Liability', 'Equity', 'Revenue', 'Expense']}
              value={type}
              onChange={val => { setType(val as ProcGlAccountType); clearError('type') }}
              placeholder="Select type"
            />
            {errors.type && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.type}</p>}
          </div>
          <div className="fg">
            <div className="lbl">Status</div>
            <SearchSelect
              options={['Active', 'Inactive']}
              value={status}
              onChange={val => setStatus(val as ProcGlAccountStatus)}
            />
          </div>
          <div className="fg span2">
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginTop: 4 }}>
              <input
                type="checkbox"
                checked={blocked}
                onChange={e => setBlocked(e.target.checked)}
                style={{ width: 16, height: 16, accentColor: 'var(--b500)', cursor: 'pointer' }}
              />
              <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--g700)', fontWeight: 500 }}>Block this GL account from use</span>
            </label>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-neu" onClick={handleClose}>Cancel</button>
          <button className="btn btn-primary" disabled={updateProcGlAccount.isPending} onClick={handleSubmit}>
            <i className="lni lni-checkmark"></i> {updateProcGlAccount.isPending ? 'Updating…' : 'Update GL Account'}
          </button>
        </div>
      </div>
    </div>
  )
}
