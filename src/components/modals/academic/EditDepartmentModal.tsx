'use client'
import { useEffect, useState } from 'react'
import { ModalProps } from '../types'
import { SuccessPopup } from './SuccessPopup'
import { FailurePopup } from './FailurePopup'
import { SearchSelect } from '@/components/SearchSelect'
import { Department, DepartmentInput } from '@/lib/api/academic/department'
import { useEmployees } from '@/hooks/employee/useEmployees'
import { AuthError } from '@/lib/api/client'

// Not part of the real GET /api/v1/users/departments response (which only
// has shortCode/deptName/employeeGuid) — kept for reference until a
// confirmed update payload says whether Faculty/Status still apply.
// const FACULTY_OPTIONS = [
//   { value: 'Faculty of Computing',       label: 'Faculty of Computing' },
//   { value: 'Faculty of Business',        label: 'Faculty of Business' },
//   { value: 'Faculty of Engineering',     label: 'Faculty of Engineering' },
//   { value: 'Faculty of Health Sciences', label: 'Faculty of Health Sciences' },
//   { value: 'Faculty of Education',       label: 'Faculty of Education' },
// ]

interface EditDepartmentModalProps extends ModalProps {
  department: Department | null
  updateDepartment: {
    mutate: (variables: { id: string; input: DepartmentInput }, options?: { onSuccess?: () => void; onError?: (error: Error) => void }) => void
    isPending: boolean
  }
}

export function EditDepartmentModal({ isOpen, onClose, showToast, department, updateDepartment }: EditDepartmentModalProps) {
  const [saved, setSaved] = useState(false)
  const [failure, setFailure] = useState<string | null>(null)
  const [shortCode, setShortCode] = useState('')
  const [deptName, setDeptName] = useState('')
  const [hod, setHod] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const { data: employees = [] } = useEmployees()
  const hodOptions = employees.map(e => ({ value: e.employeeGuid, label: `${e.empName} (${e.shortCode})` }))

  useEffect(() => {
    if (isOpen && department) {
      setShortCode(department.shortCode)
      setDeptName(department.deptName)
      setHod(department.employeeGuid ?? '')
      setErrors({})
    }
  }, [isOpen, department])

  if (!isOpen || !department) return null

  function handleClose() { setSaved(false); setFailure(null); onClose() }

  function validate() {
    const e: Record<string, string> = {}
    if (!shortCode.trim()) e.shortCode = 'Short Code is required'
    else if (shortCode.trim().length > 10) e.shortCode = 'Short Code must be 10 characters or fewer'
    if (!deptName.trim())  e.deptName  = 'Department Name is required'
    else if (deptName.trim().length > 100) e.deptName = 'Department Name must be 100 characters or fewer'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  // Maps the backend's { code, errors } failure shape (see
  // departments-and-designations.md) to inline field errors where the cause
  // is actionable right there (duplicate shortCode); validation_error and
  // not_found show the failure popup instead.
  function handleUpdateError(error: Error) {
    const code = error instanceof AuthError ? error.code : undefined
    if (code === 'bad_request') {
      setErrors(prev => ({ ...prev, shortCode: error.message || 'A department with this Short Code already exists.' }))
      return
    }
    setFailure(error.message || 'Failed to update department. Please try again.')
  }

  function handleSubmit() {
    if (!department || !validate()) return
    updateDepartment.mutate(
      { id: String(department.intDept), input: { shortCode, deptName, employeeGuid: hod || null } },
      {
        onSuccess: () => { setSaved(true); showToast('Department updated successfully') },
        onError: handleUpdateError,
      },
    )
  }

  if (saved) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <SuccessPopup title="Department Updated!" subtitle="Your changes have been saved successfully." onClose={handleClose} />
        </div>
      </div>
    )
  }

  if (failure) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <FailurePopup title="Couldn't Update Department" subtitle={failure} onClose={() => setFailure(null)} />
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
            <input
              className="ctrl font-mono uppercase"
              type="text"
              maxLength={10}
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
              value={deptName}
              onChange={e => { setDeptName(e.target.value); if (errors.deptName) setErrors(p => ({ ...p, deptName: '' })) }}
              style={errors.deptName ? { borderColor: 'var(--red)' } : undefined}
            />
            {errors.deptName && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.deptName}</p>}
          </div>
          {/* Faculty/Status aren't part of the real GET /api/v1/users/departments
              response — kept for reference until a confirmed update payload
              says whether they still apply.
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
          */}
          <div className="fg span2">
            <div className="lbl">Head of Department</div>
            <SearchSelect
              placeholder="Select employee… (optional)"
              value={hod}
              onChange={setHod}
              options={hodOptions}
            />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-neu" onClick={handleClose}>Cancel</button>
          <button className="btn btn-primary" disabled={updateDepartment.isPending} onClick={handleSubmit}>
            <i className="lni lni-checkmark"></i> {updateDepartment.isPending ? 'Updating…' : 'Update Department'}
          </button>
        </div>
      </div>
    </div>
  )
}
