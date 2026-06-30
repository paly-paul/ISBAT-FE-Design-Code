'use client'
import { useState } from 'react'
import { ModalProps } from '../types'
import { SuccessPopup } from './SuccessPopup'
import { SearchSelect } from '@/components/SearchSelect'

const DEPARTMENT_OPTIONS = [
  { value: 'Computer Science',        label: 'Computer Science' },
  { value: 'Information Technology',  label: 'Information Technology' },
  { value: 'Business Administration', label: 'Business Administration' },
  { value: 'Accounting & Finance',    label: 'Accounting & Finance' },
  { value: 'Civil Engineering',       label: 'Civil Engineering' },
  { value: 'Nursing Sciences',        label: 'Nursing Sciences' },
]

export function EditDesignationModal({ isOpen, onClose, showToast }: ModalProps) {
  const [saved, setSaved] = useState(false)

  if (!isOpen) return null

  function handleClose() { setSaved(false); onClose() }

  if (saved) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <SuccessPopup title="Designation Updated!" subtitle="Your changes have been saved successfully." onClose={handleClose} />
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay open" id="edit-designation-modal">
      <div className="modal modal-md" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr">
          <div className="modal-title"><i className="lni lni-pencil"></i> Edit Designation</div>
          <button className="modal-close" onClick={handleClose}><i className="lni lni-close"></i></button>
        </div>
        <div className="g2">
          <div className="fg span2">
            <div className="lbl">Designation Name <span className="req">*</span></div>
            <input className="ctrl" type="text" defaultValue="Professor" />
          </div>
          <div className="fg span2">
            <div className="lbl">Department <span className="req">*</span></div>
            <SearchSelect
              placeholder="Select department…"
              value="Computer Science"
              options={DEPARTMENT_OPTIONS}
            />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-neu" onClick={handleClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => setSaved(true)}>
            <i className="lni lni-checkmark"></i> Update Designation
          </button>
        </div>
      </div>
    </div>
  )
}
