'use client'
import { useEffect, useState } from 'react'
import { ModalProps } from '../types'
import { SuccessPopup } from './SuccessPopup'
import { FailurePopup } from './FailurePopup'
import { SearchSelect } from '@/components/SearchSelect'
import { Faculty, FacultyInput } from '@/lib/api/academic/faculty'
import { useCampusDropdown } from '@/hooks/config/useCampuses'
import { useEmployees } from '@/hooks/employee/useEmployees'
import { AuthError } from '@/lib/api/client'

interface EditFacultyModalProps extends ModalProps {
  faculty: Faculty | null
  updateFaculty: {
    mutate: (variables: { id: string; input: FacultyInput }, options?: { onSuccess?: () => void; onError?: (error: Error) => void }) => void
    isPending: boolean
  }
}

export function EditFacultyModal({ isOpen, onClose, showToast, faculty, updateFaculty }: EditFacultyModalProps) {
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [campusGuid, setCampusGuid] = useState('')
  const [deanEmployeeGuid, setDeanEmployeeGuid] = useState('')
  const [saved, setSaved] = useState(false)
  const [failure, setFailure] = useState<string | null>(null)

  const { data: campusDropdown = [] } = useCampusDropdown(isOpen)
  const campusOptions = campusDropdown.map(c => ({ value: c.campusGuid, label: c.campusName }))

  const { data: employees = [] } = useEmployees(isOpen)
  const deanOptions = employees.map(e => ({ value: e.employeeGuid, label: `${e.empName} (${e.shortCode})` }))

  useEffect(() => {
    if (isOpen && faculty) {
      setCode(faculty.facultyCode)
      setName(faculty.facultyName)
      setCampusGuid(faculty.campusGuid)
      setDeanEmployeeGuid(faculty.deanEmployeeGuid ?? '')
    }
  }, [isOpen, faculty])

  if (!isOpen || !faculty) return null

  function handleClose() {
    setSaved(false)
    setFailure(null)
    onClose()
  }

  function handleSubmit() {
    if (!faculty || !code || !name || !campusGuid || !deanEmployeeGuid) return
    updateFaculty.mutate(
      { id: faculty.facultyGuid, input: { facultyCode: code, facultyName: name, campusGuid, deanEmployeeGuid } },
      {
        onSuccess: () => { setSaved(true); showToast('Faculty updated successfully') },
        onError: (error: Error) => {
          // A missing record usually means the faculty was deleted while the modal was open.
          const notFound = error instanceof AuthError && error.code === 'not_found'
          setFailure(notFound ? 'This faculty no longer exists — it may have been deleted.' : (error.message || 'Failed to update faculty. Please try again.'))
        },
      },
    )
  }

  if (saved) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <SuccessPopup title="Faculty Updated!" subtitle="Your changes have been saved successfully." onClose={handleClose} />
        </div>
      </div>
    )
  }

  if (failure) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <FailurePopup title="Couldn't Update Faculty" subtitle={failure} onClose={() => setFailure(null)} />
        </div>
      </div>
    )
  }

  const disabled = !code || !name || !campusGuid || !deanEmployeeGuid || updateFaculty.isPending

  return (
    <div className="modal-overlay open" id="edit-faculty-modal">
      <div className="modal modal-md" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr modal-hdr-blue">
          <div className="modal-title"><i className="lni lni-pencil"></i> Edit Faculty</div>
          <button className="modal-close" onClick={handleClose}><i className="lni lni-close"></i></button>
        </div>
        <div className="g2">
          <div className="fg">
            <div className="lbl">Faculty Code <span className="req">*</span></div>
            <input
              className="ctrl font-mono uppercase"
              type="text"
              maxLength={6}
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
            />
          </div>
          <div className="fg">
            <div className="lbl">Faculty Name <span className="req">*</span></div>
            <input
              className="ctrl"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>
          <div className="fg span2">
            <div className="lbl">Campus <span className="req">*</span></div>
            <SearchSelect
              placeholder="Select campus…"
              value={campusGuid}
              onChange={setCampusGuid}
              options={campusOptions}
            />
          </div>
          <div className="fg span2">
            <div className="lbl">Dean <span className="req">*</span></div>
            <SearchSelect
              placeholder="Select employee…"
              value={deanEmployeeGuid}
              onChange={setDeanEmployeeGuid}
              options={deanOptions}
            />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-neu" onClick={handleClose}>Cancel</button>
          <button className="btn btn-primary" disabled={disabled} onClick={handleSubmit}>
            <i className="lni lni-checkmark"></i> {updateFaculty.isPending ? 'Updating…' : 'Update Faculty'}
          </button>
        </div>
      </div>
    </div>
  )
}
