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

export function NewDesignationModal({ isOpen, onClose, showToast }: ModalProps) {
  const [saved, setSaved]                     = useState(false)
  const [designationName, setDesignationName] = useState('')
  const [department, setDepartment]           = useState('')
  const [errors, setErrors]                   = useState<Record<string, string>>({})

  if (!isOpen) return null

  function handleClose() {
    setSaved(false); setDesignationName(''); setDepartment(''); setErrors({})
    onClose()
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!designationName.trim()) e.designationName = 'Designation Name is required'
    if (!department)             e.department      = 'Please select a department'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  if (saved) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <SuccessPopup title="Designation Added!" subtitle="The new designation has been saved successfully." onClose={handleClose} />
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay open" id="new-designation-modal">
      <div className="modal modal-md" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr">
          <div className="modal-title"><i className="lni lni-tag"></i> Add Designation</div>
          <button className="modal-close" onClick={handleClose}><i className="lni lni-close"></i></button>
        </div>
        <div className="g2">
          <div className="fg span2">
            <div className="lbl">Designation Name <span className="req">*</span></div>
            <input
              className="ctrl"
              type="text"
              placeholder="e.g. Senior Lecturer"
              value={designationName}
              onChange={e => { setDesignationName(e.target.value); if (errors.designationName) setErrors(p => ({ ...p, designationName: '' })) }}
              style={errors.designationName ? { borderColor: 'var(--red)' } : undefined}
            />
            {errors.designationName && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.designationName}</p>}
          </div>
          <div className="fg span2">
            <div className="lbl">Department <span className="req">*</span></div>
            <SearchSelect
              placeholder="Select department…"
              value={department}
              onChange={v => { setDepartment(v); if (errors.department) setErrors(p => ({ ...p, department: '' })) }}
              options={DEPARTMENT_OPTIONS}
            />
            {errors.department && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.department}</p>}
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-neu" onClick={handleClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => { if (validate()) setSaved(true) }}>
            <i className="lni lni-checkmark"></i> Add Designation
          </button>
        </div>
      </div>
    </div>
  )
}
