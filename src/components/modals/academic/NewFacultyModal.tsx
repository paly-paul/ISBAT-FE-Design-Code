'use client'
import { useState } from 'react'
import { ModalProps } from '../types'
import { SuccessPopup } from './SuccessPopup'
import { SearchSelect } from '@/components/SearchSelect'
import { FacultyInput } from '@/lib/api/academic/faculty'

const LECTURERS = [
  'Dr. Nakimuli Sarah',
  'Prof. Mukasa Charles',
  'Dr. Tendo Patrick',
  'Ms. Acen Lillian',
  'Mr. Okello Brian',
]

interface NewFacultyModalProps extends ModalProps {
  createFaculty: {
    mutate: (input: FacultyInput, options?: { onSuccess?: () => void }) => void
    isPending: boolean
  }
}

export function NewFacultyModal({ isOpen, onClose, showToast, createFaculty }: NewFacultyModalProps) {
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [dean, setDean] = useState('')
  const [saved, setSaved] = useState(false)

  if (!isOpen) return null

  function reset() {
    setCode('')
    setName('')
    setDean('')
  }

  function handleClose() {
    setSaved(false)
    reset()
    onClose()
  }

  function handleSubmit() {
    if (!code || !name || !dean) return
    createFaculty.mutate(
      { code, name, dean },
      { onSuccess: () => { setSaved(true); showToast('Faculty added successfully') } },
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

  const disabled = !code || !name || !dean || createFaculty.isPending

  return (
    <div className="modal-overlay open" id="new-faculty-modal">
      <div className="modal modal-md" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr">
          <div className="modal-title"><i className="lni lni-library"></i> Add Faculty</div>
          <button className="modal-close" onClick={onClose}><i className="lni lni-close"></i></button>
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
            <div className="lbl">Dean <span className="req">*</span></div>
            <SearchSelect
              placeholder="Select lecturer…"
              options={LECTURERS}
              value={dean}
              onChange={setDean}
            />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-neu" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={disabled} onClick={handleSubmit}>
            <i className="lni lni-checkmark"></i> {createFaculty.isPending ? 'Adding…' : 'Add Faculty'}
          </button>
        </div>
      </div>
    </div>
  )
}
