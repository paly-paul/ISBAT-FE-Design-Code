'use client'
import { useState } from 'react'
import { ModalProps } from '../types'
import { SuccessPopup } from '../academic/SuccessPopup'
import { FailurePopup } from '../academic/FailurePopup'
import { SearchSelect } from '@/components/SearchSelect'
import { ProcBankInput, ProcBankStatus, STATUS_VALUES } from '@/lib/api/finance/procBank'
import { useFinanceCurrencies } from '@/hooks/finance/useFinanceCurrencies'

interface NewProcBankModalProps extends ModalProps {
  createProcBank: {
    mutate: (input: ProcBankInput, options?: { onSuccess?: () => void; onError?: (error: Error) => void }) => void
    isPending: boolean
  }
}

export function NewProcBankModal({ isOpen, onClose, showToast, createProcBank }: NewProcBankModalProps) {
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

  if (!isOpen) return null

  const currencyOptions = currencies.map(c => ({ value: c.currencyGuid, label: `${c.currencyCode} — ${c.currencyName}` }))

  function reset() {
    setShortCode(''); setBankName(''); setCompCode(''); setBranchCode(''); setStatus('Active')
    setAccountCode(''); setBlocked(false); setCurrencyGuid(''); setErrors({})
  }

  function handleClose() {
    setSaved(false); setFailure(null); reset()
    onClose()
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
    <div className="modal-overlay open" id="new-proc-bank-modal">
      <div className="modal modal-md" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr">
          <div className="modal-title"><i className="lni lni-wallet"></i> Add Bank</div>
          <button className="modal-close" onClick={handleClose}><i className="lni lni-close"></i></button>
        </div>
        <div className="g2">
          <div className="fg">
            <div className="lbl">Short Code <span className="req">*</span></div>
            <input
              className="ctrl font-mono uppercase"
              type="text"
              placeholder="e.g. BNK001"
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
              placeholder="e.g. DTB-USH"
              value={bankName}
              onChange={e => { setBankName(e.target.value); if (errors.bankName) setErrors(p => ({ ...p, bankName: '' })) }}
              style={errors.bankName ? { borderColor: 'var(--red)' } : undefined}
            />
            {errors.bankName && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.bankName}</p>}
          </div>
          <div className="fg">
            <div className="lbl">Company Code <span className="req">*</span></div>
            <input
              className="ctrl"
              type="number"
              placeholder="e.g. 10"
              value={compCode}
              onChange={e => { setCompCode(e.target.value); if (errors.compCode) setErrors(p => ({ ...p, compCode: '' })) }}
              style={errors.compCode ? { borderColor: 'var(--red)' } : undefined}
            />
            {errors.compCode && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.compCode}</p>}
          </div>
          <div className="fg">
            <div className="lbl">Branch Code <span className="req">*</span></div>
            <input
              className="ctrl"
              type="number"
              placeholder="e.g. 1"
              value={branchCode}
              onChange={e => { setBranchCode(e.target.value); if (errors.branchCode) setErrors(p => ({ ...p, branchCode: '' })) }}
              style={errors.branchCode ? { borderColor: 'var(--red)' } : undefined}
            />
            {errors.branchCode && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.branchCode}</p>}
          </div>
          <div className="fg">
            <div className="lbl">Account Code <span className="req">*</span></div>
            <input
              className="ctrl font-mono"
              type="text"
              placeholder="e.g. 0107927927"
              value={accountCode}
              onChange={e => { setAccountCode(e.target.value); if (errors.accountCode) setErrors(p => ({ ...p, accountCode: '' })) }}
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
          <button
            className="btn btn-primary"
            disabled={createProcBank.isPending}
            onClick={() => {
              if (!validate()) return
              createProcBank.mutate(
                {
                  shortCode,
                  bankName,
                  compCode: +compCode || 0,
                  branchCode: +branchCode || 0,
                  status: STATUS_VALUES[status],
                  accountCode,
                  blocked,
                  currencyGuid: currencyGuid || null,
                },
                {
                  onSuccess: () => { setSaved(true); showToast('Bank added successfully') },
                  onError: (error: Error) => setFailure(error.message || 'Failed to add bank. Please try again.'),
                },
              )
            }}
          >
            <i className="lni lni-checkmark"></i> {createProcBank.isPending ? 'Adding…' : 'Add Bank'}
          </button>
        </div>
      </div>
    </div>
  )
}
