'use client'
import { useState } from 'react'
import { ModalProps } from '../types'
import { SuccessPopup } from './SuccessPopup'
import { FailurePopup } from './FailurePopup'
import { SearchSelect } from '@/components/SearchSelect'
import { FacultyInput } from '@/lib/api/academic/faculty'
import { useCampusDropdown } from '@/hooks/config/useCampuses'
import { useEmployees } from '@/hooks/employee/useEmployees'
import { AuthError } from '@/lib/api/client'

interface NewFacultyModalProps extends ModalProps {
  createFaculty: {
    mutate: (input: FacultyInput, options?: { onSuccess?: () => void; onError?: (error: Error) => void }) => void
    isPending: boolean
  }
}

export function NewFacultyModal({ isOpen, onClose, showToast, createFaculty }: NewFacultyModalProps) {
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

  if (!isOpen) return null

  function reset() {
    setCode('')
    setName('')
    setCampusGuid('')
    setDeanEmployeeGuid('')
  }

  function handleClose() {
    setSaved(false)
    setFailure(null)
    reset()
    onClose()
  }

  function handleSubmit() {
    if (!code || !name || !campusGuid || !deanEmployeeGuid) return
    createFaculty.mutate(
      { facultyCode: code, facultyName: name, campusGuid, deanEmployeeGuid },
      {
        onSuccess: () => { setSaved(true); showToast('Faculty added successfully') },
        onError: (error: Error) => {
          const code = error instanceof AuthError ? error.code : undefined
          setFailure(error.message || `Failed to add faculty${code ? ` (${code})` : ''}. Please try again.`)
        },
      },
    )
  }

  if (saved) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <SuccessPopup title="Faculty Added!" subtitle="The new faculty has been saved successfully." onClose={handleClose} />
        </div>
      </div>
    )
  }

  if (failure) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <FailurePopup title="Couldn't Add Faculty" subtitle={failure} onClose={() => setFailure(null)} />
        </div>
      </div>
    )
  }

  const disabled = !code || !name || !campusGuid || !deanEmployeeGuid || createFaculty.isPending

  return (
    <div className="modal-overlay open" id="new-faculty-modal">
      <div className="modal modal-md" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr modal-hdr-blue">
          <div className="modal-title"><i className="lni lni-library"></i> Add Faculty</div>
          <button className="modal-close" onClick={handleClose}><i className="lni lni-close"></i></button>
        </div>
        <div className="g2">
          <div className="fg">
            <div className="lbl">Faculty Code <span className="req">*</span></div>
            <input
              className="ctrl font-mono uppercase"
              type="text"
              placeholder="e.g. FCT"
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
              placeholder="e.g. Faculty of Computing & Technology"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>
          <div className="fg span2">
            <div className="lbl">Campus <span className="req">*</span></div>
            <SearchSelect
              placeholder="Select campus…"
              options={campusOptions}
              value={campusGuid}
              onChange={setCampusGuid}
            />
          </div>
          <div className="fg span2">
            <div className="lbl">Dean <span className="req">*</span></div>
            <SearchSelect
              placeholder="Select employee…"
              options={deanOptions}
              value={deanEmployeeGuid}
              onChange={setDeanEmployeeGuid}
            />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-neu" onClick={handleClose}>Cancel</button>
          <button className="btn btn-primary" disabled={disabled} onClick={handleSubmit}>
            <i className="lni lni-checkmark"></i> {createFaculty.isPending ? 'Adding…' : 'Add Faculty'}
          </button>
        </div>
      </div>
    </div>
  )
}
