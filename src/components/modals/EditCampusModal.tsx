'use client'
import { useState } from 'react'
import { ModalProps } from './types'
import { SuccessPopup } from './SuccessPopup'
import { SearchSelect } from '@/components/SearchSelect'

export function EditCampusModal({ isOpen, onClose, showToast }: ModalProps) {
  const [saved, setSaved] = useState(false)

  if (!isOpen) return null

  function handleClose() { setSaved(false); onClose() }

  if (saved) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <SuccessPopup title="Campus Updated!" subtitle="Your changes have been saved successfully." onClose={handleClose} />
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay open" id="edit-campus-modal">
      <div className="modal modal-md" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr">
          <div className="modal-title"><i className="lni lni-pencil"></i> Edit Campus</div>
          <button className="modal-close" onClick={handleClose}><i className="lni lni-close"></i></button>
        </div>
        <div className="g2">
          <div className="fg">
            <div className="lbl">Campus Code <span className="req">*</span></div>
            <input className="ctrl font-mono uppercase" type="text" defaultValue="MKL" maxLength={6} />
          </div>
          <div className="fg">
            <div className="lbl">Campus Name <span className="req">*</span></div>
            <input className="ctrl" type="text" defaultValue="Makerere Campus" />
          </div>
          <div className="fg span2">
            <div className="lbl">City / Location</div>
            <input className="ctrl" type="text" defaultValue="Kampala, Uganda" />
          </div>
          <div className="fg span2">
            <div className="lbl">Status <span className="req">*</span></div>
            <SearchSelect
              placeholder="Select status…"
              value="Active"
              options={[{ value: 'Active', label: 'Active' }, { value: 'Inactive', label: 'Inactive' }]}
            />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-neu" onClick={handleClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => setSaved(true)}>
            <i className="lni lni-checkmark"></i> Update Campus
          </button>
        </div>
      </div>
    </div>
  )
}
