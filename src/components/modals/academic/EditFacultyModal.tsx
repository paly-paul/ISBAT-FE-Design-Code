'use client'
import { useEffect, useState } from 'react'
import { ModalProps } from '../types'
import { SuccessPopup } from './SuccessPopup'
import { SearchSelect } from '@/components/SearchSelect'
import { Faculty, FacultyInput } from '@/lib/api/academic/faculty'

const LECTURERS = [
  'Dr. Nakimuli Sarah',
  'Prof. Mukasa Charles',
  'Dr. Tendo Patrick',
  'Ms. Acen Lillian',
  'Mr. Okello Brian',
]

interface EditFacultyModalProps extends ModalProps {
  faculty: Faculty | null
  updateFaculty: {
    mutate: (variables: { id: string; input: FacultyInput }, options?: { onSuccess?: () => void }) => void
    isPending: boolean
  }
}

export function EditFacultyModal({ isOpen, onClose, showToast, faculty, updateFaculty }: EditFacultyModalProps) {
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [dean, setDean] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (isOpen && faculty) {
      setCode(faculty.code)
      setName(faculty.name)
      setDean(faculty.dean)
    }
  }, [isOpen, faculty])

  if (!isOpen || !faculty) return null

  function handleClose() {
    setSaved(false)
    onClose()
  }

  function handleSubmit() {
    if (!faculty || !code || !name || !dean) return
    updateFaculty.mutate(
      { id: faculty.id, input: { code, name, dean } },
      { onSuccess: () => { setSaved(true); showToast('Faculty updated successfully') } },
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

  const disabled = !code || !name || !dean || updateFaculty.isPending

  return (
    <div className="modal-overlay open" id="edit-faculty-modal">
      <div className="modal modal-md" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr">
          <div className="modal-title"><i className="lni lni-pencil"></i> Edit Faculty</div>
          <button className="modal-close" onClick={onClose}><i className="lni lni-close"></i></button>
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
            <div className="lbl">Dean <span className="req">*</span></div>
            <SearchSelect
              placeholder="Select lecturer…"
              value={dean}
              onChange={setDean}
              options={LECTURERS}
            />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-neu" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={disabled} onClick={handleSubmit}>
            <i className="lni lni-checkmark"></i> {updateFaculty.isPending ? 'Updating…' : 'Update Faculty'}
          </button>
        </div>
      </div>
    </div>
  )
}
