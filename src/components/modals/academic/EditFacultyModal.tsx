'use client'
import { useState } from 'react'
import { ModalProps } from '../types'
import { SuccessPopup } from './SuccessPopup'
import { SearchSelect } from '@/components/SearchSelect'

const LECTURERS = [
  'Dr. Nakimuli Sarah',
  'Prof. Mukasa Charles',
  'Dr. Tendo Patrick',
  'Ms. Acen Lillian',
  'Mr. Okello Brian',
]

export function EditFacultyModal({ isOpen, onClose, showToast }: ModalProps) {
  const [saved, setSaved] = useState(false)

  if (!isOpen) return null

  function handleClose() { setSaved(false); onClose() }

  if (saved) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <SuccessPopup title="Faculty Updated!" subtitle="Your changes have been saved successfully." onClose={handleClose} />
        </div>
      </div>
    )
  }

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
            <input className="ctrl font-mono uppercase" type="text" defaultValue="FCT" maxLength={6} />
          </div>
          <div className="fg">
            <div className="lbl">Faculty Name <span className="req">*</span></div>
            <input className="ctrl" type="text" defaultValue="Faculty of Computing & Technology" />
          </div>
          <div className="fg span2">
            <div className="lbl">Dean <span className="req">*</span></div>
            <SearchSelect
              placeholder="Select lecturer…"
              value="Dr. Nakimuli Sarah"
              options={LECTURERS}
            />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-neu" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => setSaved(true)}>
            <i className="lni lni-checkmark"></i> Update Faculty
          </button>
        </div>
      </div>
    </div>
  )
}
