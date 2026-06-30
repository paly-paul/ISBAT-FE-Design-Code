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

export function NewDepartmentModal({ isOpen, onClose, showToast }: ModalProps) {
  const [saved, setSaved]         = useState(false)
  const [shortCode, setShortCode] = useState('')
  const [deptName, setDeptName]   = useState('')
  const [faculty, setFaculty]     = useState('')
  const [status, setStatus]       = useState('')
  const [errors, setErrors]       = useState<Record<string, string>>({})

  if (!isOpen) return null

  function handleClose() {
    setSaved(false); setShortCode(''); setDeptName(''); setFaculty(''); setStatus(''); setErrors({})
    onClose()
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!shortCode.trim()) e.shortCode = 'Short Code is required'
    if (!deptName.trim())  e.deptName  = 'Department Name is required'
    if (!faculty)          e.faculty   = 'Please select a faculty'
    if (!status)           e.status    = 'Please select a status'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  if (saved) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <SuccessPopup title="Department Added!" subtitle="The new department has been saved successfully." onClose={handleClose} />
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay open" id="new-dept-modal">
      <div className="modal modal-md" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr">
          <div className="modal-title"><i className="lni lni-apartment"></i> Add Department</div>
          <button className="modal-close" onClick={handleClose}><i className="lni lni-close"></i></button>
        </div>
        <div className="g2">
          <div className="fg">
            <div className="lbl">Short Code <span className="req">*</span></div>
            <input
              className="ctrl font-mono uppercase"
              type="text"
              placeholder="e.g. CS"
              maxLength={6}
              value={shortCode}
              onChange={e => { setShortCode(e.target.value); if (errors.shortCode) setErrors(p => ({ ...p, shortCode: '' })) }}
              style={errors.shortCode ? { borderColor: 'var(--red)' } : undefined}
            />
            {errors.shortCode && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.shortCode}</p>}
          </div>
          <div className="fg">
            <div className="lbl">Department Name <span className="req">*</span></div>
            <input
              className="ctrl"
              type="text"
              placeholder="e.g. Computer Science"
              value={deptName}
              onChange={e => { setDeptName(e.target.value); if (errors.deptName) setErrors(p => ({ ...p, deptName: '' })) }}
              style={errors.deptName ? { borderColor: 'var(--red)' } : undefined}
            />
            {errors.deptName && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.deptName}</p>}
          </div>
          <div className="fg span2">
            <div className="lbl">Faculty <span className="req">*</span></div>
            <SearchSelect
              placeholder="Select faculty…"
              value={faculty}
              onChange={v => { setFaculty(v); if (errors.faculty) setErrors(p => ({ ...p, faculty: '' })) }}
              options={FACULTY_OPTIONS}
            />
            {errors.faculty && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.faculty}</p>}
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
            <i className="lni lni-checkmark"></i> Add Department
          </button>
        </div>
      </div>
    </div>
  )
}
