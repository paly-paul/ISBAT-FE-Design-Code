'use client'
import { useState } from 'react'
import { ModalProps } from './types'
import { SuccessPopup } from './SuccessPopup'
import { SearchSelect } from '@/components/SearchSelect'

export function NewCurrencyModal({ isOpen, onClose, showToast }: ModalProps) {
  const [saved, setSaved]     = useState(false)
  const [code, setCode]       = useState('')
  const [name, setName]       = useState('')
  const [symbol, setSymbol]   = useState('')
  const [rate, setRate]       = useState('')
  const [status, setStatus]   = useState('')
  const [errors, setErrors]   = useState<Record<string, string>>({})

  if (!isOpen) return null

  function handleClose() {
    setSaved(false); setCode(''); setName(''); setSymbol(''); setRate(''); setStatus(''); setErrors({})
    onClose()
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!code.trim())   e.code   = 'Currency Code is required'
    if (!name.trim())   e.name   = 'Currency Name is required'
    if (!symbol.trim()) e.symbol = 'Symbol is required'
    if (!status)        e.status = 'Please select a status'
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
              value={code}
              onChange={e => { setCode(e.target.value); if (errors.code) setErrors(p => ({ ...p, code: '' })) }}
              style={errors.code ? { borderColor: 'var(--red)' } : undefined}
            />
            {errors.code && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.code}</p>}
          </div>
          <div className="fg">
            <div className="lbl">Symbol <span className="req">*</span></div>
            <input
              className="ctrl font-mono"
              type="text"
              placeholder="e.g. USh"
              maxLength={4}
              value={symbol}
              onChange={e => { setSymbol(e.target.value); if (errors.symbol) setErrors(p => ({ ...p, symbol: '' })) }}
              style={errors.symbol ? { borderColor: 'var(--red)' } : undefined}
            />
            {errors.symbol && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.symbol}</p>}
          </div>
          <div className="fg span2">
            <div className="lbl">Currency Name <span className="req">*</span></div>
            <input
              className="ctrl"
              type="text"
              placeholder="e.g. Ugandan Shilling"
              value={name}
              onChange={e => { setName(e.target.value); if (errors.name) setErrors(p => ({ ...p, name: '' })) }}
              style={errors.name ? { borderColor: 'var(--red)' } : undefined}
            />
            {errors.name && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.name}</p>}
          </div>
          <div className="fg">
            <div className="lbl">Exchange Rate to UGX</div>
            <input
              className="ctrl"
              type="number"
              min={0}
              step="0.01"
              placeholder="e.g. 3700"
              value={rate}
              onChange={e => setRate(e.target.value)}
            />
          </div>
          <div className="fg">
            <div className="lbl">Status <span className="req">*</span></div>
            <SearchSelect
              placeholder="Select status…"
              value={status}
              onChange={v => { setStatus(v); if (errors.status) setErrors(p => ({ ...p, status: '' })) }}
              options={[{ value: 'Active', label: 'Active' }, { value: 'Inactive', label: 'Inactive' }]}
            />
            {errors.status && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.status}</p>}
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-neu" onClick={handleClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => { if (validate()) setSaved(true) }}>
            <i className="lni lni-checkmark"></i> Add Currency
          </button>
        </div>
      </div>
    </div>
  )
}
