'use client'
import { useState } from 'react'
import { ModalProps } from './types'
import { SuccessPopup } from './SuccessPopup'

const PROGRAMME_LEVELS = [
  'Certificate',
  'Diploma',
  "Bachelor's Degree",
  'Postgraduate Diploma',
  "Master's Degree",
  'PhD / Doctorate',
]

export function NewRepTagModal({ isOpen, onClose, showToast }: ModalProps) {
  const [saved, setSaved] = useState(false)

  if (!isOpen) return null

  function handleClose() { setSaved(false); onClose() }

  if (saved) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <SuccessPopup title="Repetition Tag Added!" subtitle="The new repetition tag has been saved successfully." onClose={handleClose} />
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay open" id="new-rep-tag-modal" onClick={onClose}>
      <div className="modal modal-md" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr">
          <div className="modal-title"><i className="lni lni-reload"></i> Add Repetition Tag</div>
          <button className="modal-close" onClick={onClose}><i className="lni lni-close"></i></button>
        </div>
        <div className="g2">
          <div className="fg">
            <div className="lbl">Repetition Tag Code <span className="req">*</span></div>
            <input className="ctrl font-mono uppercase" type="text" placeholder="e.g. RT-CU-001" maxLength={20} />
          </div>
          <div className="fg">
            <div className="lbl">Programme Level <span className="req">*</span></div>
            <select className="ctrl">
              <option value="">Select level…</option>
              {PROGRAMME_LEVELS.map(l => <option key={l}>{l}</option>)}
            </select>
          </div>
          <div className="fg span2">
            <div className="lbl">Description <span className="req">*</span></div>
            <input className="ctrl" type="text" placeholder="e.g. Standard repeat for failed course units" />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-neu" onClick={handleClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => setSaved(true)}>
            <i className="lni lni-checkmark"></i> Add Repetition Tag
          </button>
        </div>
      </div>
    </div>
  )
}
