'use client'
import { useState } from 'react'
import { ModalProps } from '../types'
import { SuccessPopup } from './SuccessPopup'

export function NewCampusModal({ isOpen, onClose, showToast }: ModalProps) {
  const [saved, setSaved]         = useState(false)
  const [campusCode, setCampusCode] = useState('')
  const [campusName, setCampusName] = useState('')
  const [location, setLocation]   = useState('')
  const [address, setAddress]     = useState('')
  const [contact, setContact]     = useState('')
  const [errors, setErrors]       = useState<Record<string, string>>({})

  if (!isOpen) return null

  function handleClose() {
    setSaved(false); setCampusCode(''); setCampusName(''); setLocation(''); setAddress(''); setContact(''); setErrors({})
    onClose()
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!campusCode.trim()) e.campusCode = 'Campus Code is required'
    if (!campusName.trim()) e.campusName = 'Campus Name is required'
    if (!location.trim())   e.location   = 'Location is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  if (saved) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <SuccessPopup title="Campus Added!" subtitle="The new campus has been saved successfully." onClose={handleClose} />
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay open" id="new-campus-modal">
      <div className="modal modal-md" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr">
          <div className="modal-title"><i className="lni lni-home"></i> Add Campus</div>
          <button className="modal-close" onClick={handleClose}><i className="lni lni-close"></i></button>
        </div>
        <div className="g2">
          <div className="fg">
            <div className="lbl">Campus Code <span className="req">*</span></div>
            <input
              className="ctrl font-mono uppercase"
              type="text"
              placeholder="e.g. MKL"
              maxLength={6}
              value={campusCode}
              onChange={e => { setCampusCode(e.target.value); if (errors.campusCode) setErrors(p => ({ ...p, campusCode: '' })) }}
              style={errors.campusCode ? { borderColor: 'var(--red)' } : undefined}
            />
            {errors.campusCode && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.campusCode}</p>}
          </div>
          <div className="fg">
            <div className="lbl">Campus Name <span className="req">*</span></div>
            <input
              className="ctrl"
              type="text"
              placeholder="e.g. Makerere Campus"
              value={campusName}
              onChange={e => { setCampusName(e.target.value); if (errors.campusName) setErrors(p => ({ ...p, campusName: '' })) }}
              style={errors.campusName ? { borderColor: 'var(--red)' } : undefined}
            />
            {errors.campusName && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.campusName}</p>}
          </div>
          <div className="fg span2">
            <div className="lbl">Location <span className="req">*</span></div>
            <input
              className="ctrl"
              type="text"
              placeholder="e.g. Kampala"
              value={location}
              onChange={e => { setLocation(e.target.value); if (errors.location) setErrors(p => ({ ...p, location: '' })) }}
              style={errors.location ? { borderColor: 'var(--red)' } : undefined}
            />
            {errors.location && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.location}</p>}
          </div>
          <div className="fg span2">
            <div className="lbl">Address</div>
            <input
              className="ctrl"
              type="text"
              placeholder="e.g. Plot 5, Makerere Hill Road"
              value={address}
              onChange={e => setAddress(e.target.value)}
            />
          </div>
          <div className="fg span2">
            <div className="lbl">Contact</div>
            <input
              className="ctrl"
              type="tel"
              inputMode="numeric"
              placeholder="e.g. +256 414 530 000"
              value={contact}
              onChange={e => setContact(e.target.value.replace(/[^0-9+\s-]/g, ''))}
            />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-neu" onClick={handleClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => { if (validate()) setSaved(true) }}>
            <i className="lni lni-checkmark"></i> Add Campus
          </button>
        </div>
      </div>
    </div>
  )
}
