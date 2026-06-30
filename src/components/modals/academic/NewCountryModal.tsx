'use client'
import { useState } from 'react'
import { ModalProps } from '../types'
import { SuccessPopup } from './SuccessPopup'

export function NewCountryModal({ isOpen, onClose, showToast }: ModalProps) {
  const [saved, setSaved]                       = useState(false)
  const [countryCode, setCountryCode]           = useState('')
  const [countryName, setCountryName]           = useState('')
  const [nationality, setNationality]           = useState('')
  const [countryPrefix, setCountryPrefix]       = useState('')
  const [defaultCountry, setDefaultCountry]     = useState(false)
  const [errors, setErrors]                     = useState<Record<string, string>>({})

  if (!isOpen) return null

  function handleClose() {
    setSaved(false); setCountryCode(''); setCountryName(''); setNationality('')
    setCountryPrefix(''); setDefaultCountry(false); setErrors({})
    onClose()
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!countryCode.trim())   e.countryCode   = 'Country Code is required'
    if (!countryName.trim())   e.countryName   = 'Country Name is required'
    if (!countryPrefix.trim()) e.countryPrefix = 'Dial Prefix is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  if (saved) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <SuccessPopup title="Country Added!" subtitle="The new country has been saved successfully." onClose={handleClose} />
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay open" id="new-country-modal">
      <div className="modal modal-md" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr">
          <div className="modal-title"><i className="lni lni-world"></i> Add Country</div>
          <button className="modal-close" onClick={handleClose}><i className="lni lni-close"></i></button>
        </div>
        <div className="g2">
          <div className="fg">
            <div className="lbl">Country Code <span className="req">*</span></div>
            <input
              className="ctrl font-mono uppercase"
              type="text"
              placeholder="e.g. UGA"
              maxLength={3}
              value={countryCode}
              onChange={e => { setCountryCode(e.target.value); if (errors.countryCode) setErrors(p => ({ ...p, countryCode: '' })) }}
              style={errors.countryCode ? { borderColor: 'var(--red)' } : undefined}
            />
            {errors.countryCode && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.countryCode}</p>}
          </div>
          <div className="fg">
            <div className="lbl">Dial Prefix <span className="req">*</span></div>
            <input
              className="ctrl font-mono"
              type="tel"
              inputMode="numeric"
              placeholder="e.g. +256"
              maxLength={6}
              value={countryPrefix}
              onChange={e => { setCountryPrefix(e.target.value.replace(/[^0-9+]/g, '')); if (errors.countryPrefix) setErrors(p => ({ ...p, countryPrefix: '' })) }}
              style={errors.countryPrefix ? { borderColor: 'var(--red)' } : undefined}
            />
            {errors.countryPrefix && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.countryPrefix}</p>}
          </div>
          <div className="fg span2">
            <div className="lbl">Country Name <span className="req">*</span></div>
            <input
              className="ctrl"
              type="text"
              placeholder="e.g. Uganda"
              value={countryName}
              onChange={e => { setCountryName(e.target.value); if (errors.countryName) setErrors(p => ({ ...p, countryName: '' })) }}
              style={errors.countryName ? { borderColor: 'var(--red)' } : undefined}
            />
            {errors.countryName && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.countryName}</p>}
          </div>
          <div className="fg span2">
            <div className="lbl">Nationality</div>
            <input
              className="ctrl"
              type="text"
              placeholder="e.g. Ugandan"
              value={nationality}
              onChange={e => setNationality(e.target.value)}
            />
          </div>
          <div className="fg span2">
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginTop: 4 }}>
              <input
                type="checkbox"
                checked={defaultCountry}
                onChange={e => setDefaultCountry(e.target.checked)}
                style={{ width: 16, height: 16, accentColor: 'var(--b500)', cursor: 'pointer' }}
              />
              <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--g700)', fontWeight: 500 }}>Set as default country</span>
            </label>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-neu" onClick={handleClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => { if (validate()) setSaved(true) }}>
            <i className="lni lni-checkmark"></i> Add Country
          </button>
        </div>
      </div>
    </div>
  )
}
