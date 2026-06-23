'use client'
import { useState } from 'react'
import { ModalProps } from './types'
import { SuccessPopup } from './SuccessPopup'
import { SearchSelect } from '@/components/SearchSelect'

const PROGRAMME_LEVELS = [
  'Certificate',
  'Diploma',
  "Bachelor's Degree",
  'Postgraduate Diploma',
  "Master's Degree",
  'PhD / Doctorate',
]

export function EditRepTagModal({ isOpen, onClose, showToast }: ModalProps) {
  const [saved, setSaved] = useState(false)

  if (!isOpen) return null

  function handleClose() { setSaved(false); onClose() }

  if (saved) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <SuccessPopup title="Repetition Tag Updated!" subtitle="Your changes have been saved successfully." onClose={handleClose} />
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay open" id="edit-rep-tag-modal">
      <div className="modal modal-md" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr">
          <div className="modal-title"><i className="lni lni-pencil"></i> Edit Repetition Tag</div>
          <button className="modal-close" onClick={onClose}><i className="lni lni-close"></i></button>
        </div>
        <div className="g2">
          <div className="fg">
            <div className="lbl">Repetition Tag Code <span className="req">*</span></div>
            <input className="ctrl font-mono uppercase" type="text" defaultValue="RT-CU-001" maxLength={20} />
          </div>
          <div className="fg">
            <div className="lbl">Programme Level <span className="req">*</span></div>
            <SearchSelect placeholder="Select level…" value="Bachelor's Degree" options={PROGRAMME_LEVELS} />
          </div>
          <div className="fg span2">
            <div className="lbl">Description <span className="req">*</span></div>
            <input className="ctrl" type="text" defaultValue="Standard repeat for failed course units" />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-neu" onClick={handleClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => setSaved(true)}>
            <i className="lni lni-checkmark"></i> Update Repetition Tag
          </button>
        </div>
      </div>
    </div>
  )
}
