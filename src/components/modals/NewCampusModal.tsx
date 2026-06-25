'use client'
import { useState } from 'react'
import { ModalProps } from './types'
import { SuccessPopup } from './SuccessPopup'
import { SearchSelect } from '@/components/SearchSelect'

export function NewCampusModal({ isOpen, onClose, showToast }: ModalProps) {
  const [saved, setSaved] = useState(false)
  const [code, setCode]   = useState('')
  const [name, setName]   = useState('')
  const [city, setCity]   = useState('')
  const [status, setStatus] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  if (!isOpen) return null

  function handleClose() { setSaved(false); setCode(''); setName(''); setCity(''); setStatus(''); setErrors({}); onClose() }

  function validate() {
    const e: Record<string, string> = {}
    if (!code.trim())   e.code   = 'Campus Code is required'
    if (!name.trim())   e.name   = 'Campus Name is required'
    if (!status)        e.status = 'Please select a status'
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
              value={code}
              onChange={e => { setCode(e.target.value); if (errors.code) setErrors(p => ({ ...p, code: '' })) }}
              style={errors.code ? { borderColor: 'var(--red)' } : undefined}
            />
            {errors.code && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.code}</p>}
          </div>
          <div className="fg">
            <div className="lbl">Campus Name <span className="req">*</span></div>
            <input
              className="ctrl"
              type="text"
              placeholder="e.g. Makerere Campus"
              value={name}
              onChange={e => { setName(e.target.value); if (errors.name) setErrors(p => ({ ...p, name: '' })) }}
              style={errors.name ? { borderColor: 'var(--red)' } : undefined}
            />
            {errors.name && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.name}</p>}
          </div>
          <div className="fg span2">
            <div className="lbl">City / Location</div>
            <input
              className="ctrl"
              type="text"
              placeholder="e.g. Kampala, Uganda"
              value={city}
              onChange={e => setCity(e.target.value)}
            />
          </div>
          <div className="fg span2">
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
            <i className="lni lni-checkmark"></i> Add Campus
          </button>
        </div>
      </div>
    </div>
  )
}
