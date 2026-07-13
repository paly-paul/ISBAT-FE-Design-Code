'use client'
import { useState } from 'react'
import { ModalProps } from '../types'
import { SuccessPopup } from './SuccessPopup'
import { CurrencyInput } from '@/lib/api/academic/currency'

interface NewCurrencyModalProps extends ModalProps {
  createCurrency: {
    mutate: (input: CurrencyInput, options?: { onSuccess?: () => void }) => void
    isPending: boolean
  }
}

export function NewCurrencyModal({ isOpen, onClose, showToast, createCurrency }: NewCurrencyModalProps) {
  const [saved, setSaved]                 = useState(false)
  const [currencyCode, setCurrencyCode]   = useState('')
  const [currencyName, setCurrencyName]   = useState('')
  const [isDefault, setIsDefault]         = useState(false)
  const [errors, setErrors]               = useState<Record<string, string>>({})

  if (!isOpen) return null

  function handleClose() {
    setSaved(false); setCurrencyCode(''); setCurrencyName(''); setIsDefault(false); setErrors({})
    onClose()
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!currencyCode.trim()) e.currencyCode = 'Currency Code is required'
    if (!currencyName.trim()) e.currencyName = 'Currency Name is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  if (saved) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <SuccessPopup title="Currency Added!" subtitle="The new currency has been saved successfully." onClose={handleClose} />
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay open" id="new-currency-modal">
      <div className="modal modal-md" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr">
          <div className="modal-title"><i className="lni lni-dollar"></i> Add Currency</div>
          <button className="modal-close" onClick={handleClose}><i className="lni lni-close"></i></button>
        </div>
        <div className="g2">
          <div className="fg">
            <div className="lbl">Currency Code <span className="req">*</span></div>
            <input
              className="ctrl font-mono uppercase"
              type="text"
              placeholder="e.g. UGX"
              maxLength={4}
              value={currencyCode}
              onChange={e => { setCurrencyCode(e.target.value); if (errors.currencyCode) setErrors(p => ({ ...p, currencyCode: '' })) }}
              style={errors.currencyCode ? { borderColor: 'var(--red)' } : undefined}
            />
            {errors.currencyCode && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.currencyCode}</p>}
          </div>
          <div className="fg">
            <div className="lbl">Currency Name <span className="req">*</span></div>
            <input
              className="ctrl"
              type="text"
              placeholder="e.g. Uganda Shilling"
              value={currencyName}
              onChange={e => { setCurrencyName(e.target.value); if (errors.currencyName) setErrors(p => ({ ...p, currencyName: '' })) }}
              style={errors.currencyName ? { borderColor: 'var(--red)' } : undefined}
            />
            {errors.currencyName && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.currencyName}</p>}
          </div>
          <div className="fg span2">
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginTop: 4 }}>
              <input
                type="checkbox"
                checked={isDefault}
                onChange={e => setIsDefault(e.target.checked)}
                style={{ width: 16, height: 16, accentColor: 'var(--b500)', cursor: 'pointer' }}
              />
              <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--g700)', fontWeight: 500 }}>Set as default currency</span>
            </label>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-neu" onClick={handleClose}>Cancel</button>
          <button
            className="btn btn-primary"
            disabled={createCurrency.isPending}
            onClick={() => {
              if (!validate()) return
              createCurrency.mutate(
                { currencyCode, currencyName, isDefault: isDefault ? 1 : 0 },
                { onSuccess: () => { setSaved(true); showToast('Currency added successfully') } },
              )
            }}
          >
            <i className="lni lni-checkmark"></i> {createCurrency.isPending ? 'Adding…' : 'Add Currency'}
          </button>
        </div>
      </div>
    </div>
  )
}
