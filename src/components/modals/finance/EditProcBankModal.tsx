'use client'
import { useEffect, useState } from 'react'
import { ModalProps } from '../types'
import { SuccessPopup } from '../academic/SuccessPopup'
import { FailurePopup } from '../academic/FailurePopup'
import { SearchSelect } from '@/components/SearchSelect'
import { ProcBankInput, ProcBankStatus, STATUS_LABELS, STATUS_VALUES } from '@/lib/api/finance/procBank'
import { useProcBank } from '@/hooks/finance/useProcBanks'
import { useFinanceCurrencies } from '@/hooks/finance/useFinanceCurrencies'
import { AuthError } from '@/lib/api/client'

interface EditProcBankModalProps extends ModalProps {
  procBankGuid: string | null
  updateProcBank: {
    mutate: (variables: { guid: string; input: ProcBankInput }, options?: { onSuccess?: () => void; onError?: (error: Error) => void }) => void
    isPending: boolean
  }
}

export function EditProcBankModal({ isOpen, onClose, showToast, procBankGuid, updateProcBank }: EditProcBankModalProps) {
  const { data: bank, isLoading, isError, error } = useProcBank(procBankGuid, isOpen)
  const { data: currencies = [] } = useFinanceCurrencies()

  const [saved, setSaved]           = useState(false)
  const [failure, setFailure]       = useState<string | null>(null)
  const [shortCode, setShortCode]   = useState('')
  const [bankName, setBankName]     = useState('')
  const [compCode, setCompCode]     = useState('')
  const [branchCode, setBranchCode] = useState('')
  const [status, setStatus]         = useState<ProcBankStatus>('Active')
  const [accountCode, setAccountCode] = useState('')
  const [blocked, setBlocked]       = useState(false)
  const [currencyGuid, setCurrencyGuid] = useState('')
  const [errors, setErrors]         = useState<Record<string, string>>({})

  const currencyOptions = currencies.map(c => ({ value: c.currencyGuid, label: `${c.currencyCode} — ${c.currencyName}` }))

  // Fill the form when the selected bank loads.
  useEffect(() => {
    if (!isOpen || !bank) return
    setShortCode(bank.shortCode)
    setBankName(bank.bankName)
    setCompCode(String(bank.compCode))
    setBranchCode(String(bank.branchCode))
    setStatus(STATUS_LABELS[bank.status] ?? 'Active')
    setAccountCode(bank.accountCode)
    setBlocked(bank.blocked)
    setCurrencyGuid(bank.currencyGuid ?? '')
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
    if (!compCode.trim()) e.compCode = 'Company Code is required'
    if (!branchCode.trim()) e.branchCode = 'Branch Code is required'
    if (!accountCode.trim()) e.accountCode = 'Account Code is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit() {
    if (!procBankGuid || !validate()) return
    updateProcBank.mutate(
      {
        guid: procBankGuid,
        input: {
          shortCode,
          bankName,
          compCode: +compCode || 0,
          branchCode: +branchCode || 0,
          status: STATUS_VALUES[status],
          accountCode,
          blocked,
          currencyGuid: currencyGuid || null,
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
      <div className="modal-overlay open" id="edit-proc-bank-modal">
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
    <div className="modal-overlay open" id="edit-proc-bank-modal">
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
              value={bankName}
              onChange={e => { setBankName(e.target.value); clearError('bankName') }}
              style={errors.bankName ? { borderColor: 'var(--red)' } : undefined}
            />
            {errors.bankName && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.bankName}</p>}
          </div>
          <div className="fg">
            <div className="lbl">Company Code <span className="req">*</span></div>
            <input
              className="ctrl"
              type="number"
              value={compCode}
              onChange={e => { setCompCode(e.target.value); clearError('compCode') }}
              style={errors.compCode ? { borderColor: 'var(--red)' } : undefined}
            />
            {errors.compCode && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.compCode}</p>}
          </div>
          <div className="fg">
            <div className="lbl">Branch Code <span className="req">*</span></div>
            <input
              className="ctrl"
              type="number"
              value={branchCode}
              onChange={e => { setBranchCode(e.target.value); clearError('branchCode') }}
              style={errors.branchCode ? { borderColor: 'var(--red)' } : undefined}
            />
            {errors.branchCode && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.branchCode}</p>}
          </div>
          <div className="fg">
            <div className="lbl">Account Code <span className="req">*</span></div>
            <input
              className="ctrl font-mono"
              type="text"
              value={accountCode}
              onChange={e => { setAccountCode(e.target.value); clearError('accountCode') }}
              style={errors.accountCode ? { borderColor: 'var(--red)' } : undefined}
            />
            {errors.accountCode && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.accountCode}</p>}
          </div>
          <div className="fg">
            <div className="lbl">Currency</div>
            <SearchSelect
              options={currencyOptions}
              value={currencyGuid}
              onChange={setCurrencyGuid}
              placeholder="Select currency"
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
          <div className="fg" style={{ display: 'flex', alignItems: 'flex-end' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: 10 }}>
              <input
                type="checkbox"
                checked={blocked}
                onChange={e => setBlocked(e.target.checked)}
                style={{ width: 16, height: 16, accentColor: 'var(--b500)', cursor: 'pointer' }}
              />
              <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--g700)', fontWeight: 500 }}>Block this bank from use</span>
            </label>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-neu" onClick={handleClose}>Cancel</button>
          <button className="btn btn-primary" disabled={updateProcBank.isPending} onClick={handleSubmit}>
            <i className="lni lni-checkmark"></i> {updateProcBank.isPending ? 'Updating…' : 'Update Bank'}
          </button>
        </div>
      </div>
    </div>
  )
}
