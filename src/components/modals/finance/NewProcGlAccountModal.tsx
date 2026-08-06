'use client'
import { useState } from 'react'
import { ModalProps } from '../types'
import { SuccessPopup } from '../academic/SuccessPopup'
import { FailurePopup } from '../academic/FailurePopup'
import { SearchSelect } from '@/components/SearchSelect'
import { ProcGlAccountInput, ProcGlAccountStatus, ProcGlAccountType, STATUS_VALUES, TYPE_VALUES } from '@/lib/api/finance/procGlAccount'

interface NewProcGlAccountModalProps extends ModalProps {
  createProcGlAccount: {
    mutate: (input: ProcGlAccountInput, options?: { onSuccess?: () => void; onError?: (error: Error) => void }) => void
    isPending: boolean
  }
}

export function NewProcGlAccountModal({ isOpen, onClose, showToast, createProcGlAccount }: NewProcGlAccountModalProps) {
  const [saved, setSaved]         = useState(false)
  const [failure, setFailure]     = useState<string | null>(null)
  const [shortCode, setShortCode] = useState('')
  const [accName, setAccName]     = useState('')
  const [status, setStatus]       = useState<ProcGlAccountStatus>('Active')
  const [type, setType]           = useState<ProcGlAccountType | ''>('')
  const [blocked, setBlocked]     = useState(false)
  const [errors, setErrors]       = useState<Record<string, string>>({})

  if (!isOpen) return null

  function reset() {
    setShortCode(''); setAccName(''); setStatus('Active'); setType(''); setBlocked(false); setErrors({})
  }

  function handleClose() {
    setSaved(false); setFailure(null); reset()
    onClose()
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!shortCode.trim()) e.shortCode = 'Short Code is required'
    if (!accName.trim()) e.accName = 'Account Name is required'
    if (!type) e.type = 'Account Type is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  if (saved) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <SuccessPopup title="GL Account Added!" subtitle="The new GL account has been saved successfully." onClose={handleClose} />
        </div>
      </div>
    )
  }

  if (failure) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <FailurePopup title="Couldn't Add GL Account" subtitle={failure} onClose={() => setFailure(null)} />
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay open" id="new-proc-gl-account-modal">
      <div className="modal modal-md" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr modal-hdr-blue">
          <div className="modal-title"><i className="lni lni-calculator"></i> Add GL Account</div>
          <button className="modal-close" onClick={handleClose}><i className="lni lni-close"></i></button>
        </div>
        <div className="g2">
          <div className="fg">
            <div className="lbl">Short Code <span className="req">*</span></div>
            <input
              className="ctrl font-mono"
              type="text"
              placeholder="e.g. 11111"
              value={shortCode}
              onChange={e => { setShortCode(e.target.value); if (errors.shortCode) setErrors(p => ({ ...p, shortCode: '' })) }}
              style={errors.shortCode ? { borderColor: 'var(--red)' } : undefined}
            />
            {errors.shortCode && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.shortCode}</p>}
          </div>
          <div className="fg">
            <div className="lbl">Account Name <span className="req">*</span></div>
            <input
              className="ctrl"
              type="text"
              placeholder="e.g. Test GL Account"
              value={accName}
              onChange={e => { setAccName(e.target.value); if (errors.accName) setErrors(p => ({ ...p, accName: '' })) }}
              style={errors.accName ? { borderColor: 'var(--red)' } : undefined}
            />
            {errors.accName && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.accName}</p>}
          </div>
          <div className="fg">
            <div className="lbl">Account Type <span className="req">*</span></div>
            <SearchSelect
              options={['Asset', 'Liability', 'Equity', 'Revenue', 'Expense']}
              value={type}
              onChange={val => { setType(val as ProcGlAccountType); if (errors.type) setErrors(p => ({ ...p, type: '' })) }}
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
          <button
            className="btn btn-primary"
            disabled={createProcGlAccount.isPending}
            onClick={() => {
              if (!validate()) return
              createProcGlAccount.mutate(
                {
                  shortCode,
                  accName,
                  status: STATUS_VALUES[status],
                  type: TYPE_VALUES[type as ProcGlAccountType],
                  typeName: null,
                  blocked,
                },
                {
                  onSuccess: () => { setSaved(true); showToast('GL account added successfully') },
                  onError: (error: Error) => setFailure(error.message || 'Failed to add GL account. Please try again.'),
                },
              )
            }}
          >
            <i className="lni lni-checkmark"></i> {createProcGlAccount.isPending ? 'Adding…' : 'Add GL Account'}
          </button>
        </div>
      </div>
    </div>
  )
}
