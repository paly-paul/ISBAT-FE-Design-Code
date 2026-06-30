'use client'
import { useState } from 'react'
import { ModalProps } from '../types'
import { SuccessPopup } from './SuccessPopup'
import { SearchSelect } from '@/components/SearchSelect'

const FACULTY_OPTIONS = [
  { value: 'Faculty of Computing',       label: 'Faculty of Computing' },
  { value: 'Faculty of Business',        label: 'Faculty of Business' },
  { value: 'Faculty of Engineering',     label: 'Faculty of Engineering' },
  { value: 'Faculty of Health Sciences', label: 'Faculty of Health Sciences' },
  { value: 'Faculty of Education',       label: 'Faculty of Education' },
]

export function EditDepartmentModal({ isOpen, onClose, showToast }: ModalProps) {
  const [saved, setSaved] = useState(false)

  if (!isOpen) return null

  function handleClose() { setSaved(false); onClose() }

  if (saved) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <SuccessPopup title="Department Updated!" subtitle="Your changes have been saved successfully." onClose={handleClose} />
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay open" id="edit-dept-modal">
      <div className="modal modal-md" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr">
          <div className="modal-title"><i className="lni lni-pencil"></i> Edit Department</div>
          <button className="modal-close" onClick={handleClose}><i className="lni lni-close"></i></button>
        </div>
        <div className="g2">
          <div className="fg">
            <div className="lbl">Short Code <span className="req">*</span></div>
            <input className="ctrl font-mono uppercase" type="text" defaultValue="CS" maxLength={6} />
          </div>
          <div className="fg">
            <div className="lbl">Department Name <span className="req">*</span></div>
            <input className="ctrl" type="text" defaultValue="Computer Science" />
          </div>
          <div className="fg span2">
            <div className="lbl">Faculty <span className="req">*</span></div>
            <SearchSelect
              placeholder="Select faculty…"
              value="Faculty of Computing"
              options={FACULTY_OPTIONS}
            />
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
            <i className="lni lni-checkmark"></i> Update Department
          </button>
        </div>
      </div>
    </div>
  )
}
