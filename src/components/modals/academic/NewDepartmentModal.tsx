'use client'
import { useState } from 'react'
import { ModalProps } from '../types'
import { SuccessPopup } from './SuccessPopup'
import { FailurePopup } from './FailurePopup'
import { SearchSelect } from '@/components/SearchSelect'
import { DepartmentInput } from '@/lib/api/academic/department'
import { useEmployees } from '@/hooks/employee/useEmployees'
import { AuthError } from '@/lib/api/client'

// Not part of the real GET /api/v1/users/departments response (which only
// has shortCode/deptName/employeeGuid) — kept for reference until a
// confirmed create payload says whether Faculty/Status still apply.
// const FACULTY_OPTIONS = [
//   { value: 'Faculty of Computing',       label: 'Faculty of Computing' },
//   { value: 'Faculty of Business',        label: 'Faculty of Business' },
//   { value: 'Faculty of Engineering',     label: 'Faculty of Engineering' },
//   { value: 'Faculty of Health Sciences', label: 'Faculty of Health Sciences' },
//   { value: 'Faculty of Education',       label: 'Faculty of Education' },
// ]

interface NewDepartmentModalProps extends ModalProps {
  createDepartment: {
    mutate: (input: DepartmentInput, options?: { onSuccess?: () => void; onError?: (error: Error) => void }) => void
    isPending: boolean
  }
}

export function NewDepartmentModal({ isOpen, onClose, showToast, createDepartment }: NewDepartmentModalProps) {
  const [saved, setSaved]         = useState(false)
  const [failure, setFailure]     = useState<string | null>(null)
  const [shortCode, setShortCode] = useState('')
  const [deptName, setDeptName]   = useState('')
  const [hod, setHod]             = useState('')
  const [errors, setErrors]       = useState<Record<string, string>>({})

  const { data: employees = [] } = useEmployees()
  const hodOptions = employees.map(e => ({ value: e.employeeGuid, label: `${e.empName} (${e.shortCode})` }))

  if (!isOpen) return null

  function handleClose() {
    setSaved(false); setFailure(null); setShortCode(''); setDeptName(''); setHod(''); setErrors({})
    onClose()
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!shortCode.trim()) e.shortCode = 'Short Code is required'
    else if (shortCode.trim().length > 10) e.shortCode = 'Short Code must be 10 characters or fewer'
    if (!deptName.trim())  e.deptName  = 'Department Name is required'
    else if (deptName.trim().length > 100) e.deptName = 'Department Name must be 100 characters or fewer'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  // Map known backend failures to field errors and use the popup for anything else.
  function handleCreateError(error: Error) {
    const code = error instanceof AuthError ? error.code : undefined
    if (code === 'bad_request') {
      setErrors(prev => ({ ...prev, shortCode: error.message || 'A department with this Short Code already exists.' }))
      return
    }
    setFailure(error.message || 'Failed to add department. Please try again.')
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

  if (failure) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <FailurePopup title="Couldn't Add Department" subtitle={failure} onClose={() => setFailure(null)} />
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay open" id="new-dept-modal">
      <div className="modal modal-md" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr modal-hdr-blue">
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
              placeholder="e.g. Computer Science"
              value={deptName}
              onChange={e => { setDeptName(e.target.value); if (errors.deptName) setErrors(p => ({ ...p, deptName: '' })) }}
              style={errors.deptName ? { borderColor: 'var(--red)' } : undefined}
            />
            {errors.deptName && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.deptName}</p>}
          </div>
          {/* Faculty/Status aren't part of the real GET /api/v1/users/departments
              response — kept for reference until a confirmed create payload
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
          <button
            className="btn btn-primary"
            disabled={createDepartment.isPending}
            onClick={() => {
              if (!validate()) return
              createDepartment.mutate(
                { shortCode, deptName, employeeGuid: hod || null },
                {
                  onSuccess: () => { setSaved(true); showToast('Department added successfully') },
                  onError: handleCreateError,
                },
              )
            }}
          >
            <i className="lni lni-checkmark"></i> {createDepartment.isPending ? 'Adding…' : 'Add Department'}
          </button>
        </div>
      </div>
    </div>
  )
}
