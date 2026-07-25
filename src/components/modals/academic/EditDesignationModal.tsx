'use client'
import { useEffect, useState } from 'react'
import { ModalProps } from '../types'
import { SuccessPopup } from './SuccessPopup'
import { FailurePopup } from './FailurePopup'
import { SearchSelect } from '@/components/SearchSelect'
import { Designation, DesignationInput } from '@/lib/api/academic/designation'
import { useDepartments } from '@/hooks/config/useDepartments'
import { AuthError } from '@/lib/api/client'

// These department options are kept as a reference; the form now uses the live departments list.
// const DEPARTMENT_OPTIONS = [
//   { value: 'Computer Science',        label: 'Computer Science' },
//   { value: 'Information Technology',  label: 'Information Technology' },
//   { value: 'Business Administration', label: 'Business Administration' },
//   { value: 'Accounting & Finance',    label: 'Accounting & Finance' },
//   { value: 'Civil Engineering',       label: 'Civil Engineering' },
//   { value: 'Nursing Sciences',        label: 'Nursing Sciences' },
// ]

interface EditDesignationModalProps extends ModalProps {
  designation: Designation | null
  updateDesignation: {
    mutate: (variables: { id: string; input: DesignationInput }, options?: { onSuccess?: () => void; onError?: (error: Error) => void }) => void
    isPending: boolean
  }
}

export function EditDesignationModal({ isOpen, onClose, showToast, designation, updateDesignation }: EditDesignationModalProps) {
  const [saved, setSaved] = useState(false)
  const [failure, setFailure] = useState<string | null>(null)
  const [designationName, setDesignationName] = useState('')
  const [department, setDepartment] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const { data: departments = [] } = useDepartments()
  const departmentOptions = departments.map(d => ({ value: String(d.intDept), label: d.deptName }))

  useEffect(() => {
    if (isOpen && designation) {
      setDesignationName(designation.designationName)
      setDepartment(String(designation.intDept))
      setErrors({})
    }
  }, [isOpen, designation])

  if (!isOpen || !designation) return null

  function handleClose() { setSaved(false); setFailure(null); onClose() }

  function validate() {
    const e: Record<string, string> = {}
    if (!designationName.trim()) e.designationName = 'Designation Name is required'
    if (!department)             e.department      = 'Please select a department'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  // Show field-level errors when the cause is clear, otherwise use the popup.
  function handleUpdateError(error: Error) {
    const code = error instanceof AuthError ? error.code : undefined
    if (code === 'bad_request') {
      setErrors(prev => ({ ...prev, designationName: error.message || 'A designation with this name already exists.' }))
      return
    }
    setFailure(error.message || 'Failed to update designation. Please try again.')
  }

  function handleSubmit() {
    if (!designation || !validate()) return
    updateDesignation.mutate(
      { id: String(designation.intDesignation), input: { designationName, intDept: Number(department) } },
      {
        onSuccess: () => { setSaved(true); showToast('Designation updated successfully') },
        onError: handleUpdateError,
      },
    )
  }

  if (saved) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <SuccessPopup title="Designation Updated!" subtitle="Your changes have been saved successfully." onClose={handleClose} />
        </div>
      </div>
    )
  }

  if (failure) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <FailurePopup title="Couldn't Update Designation" subtitle={failure} onClose={() => setFailure(null)} />
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
            <input
              className="ctrl"
              type="text"
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
              options={departmentOptions}
            />
            {errors.department && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.department}</p>}
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-neu" onClick={handleClose}>Cancel</button>
          <button className="btn btn-primary" disabled={updateDesignation.isPending} onClick={handleSubmit}>
            <i className="lni lni-checkmark"></i> {updateDesignation.isPending ? 'Updating…' : 'Update Designation'}
          </button>
        </div>
      </div>
    </div>
  )
}
