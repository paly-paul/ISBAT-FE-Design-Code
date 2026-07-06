'use client'
import { useState } from 'react'
import { ModalProps } from '../types'
import { SuccessPopup } from '../academic/SuccessPopup'
import { SearchSelect } from '@/components/SearchSelect'

const PROGRAMMES = [
  'BSc. Computer Science',
  'BBA Business Administration',
  'BSc. Information Technology',
  'Diploma in Nursing',
  'MBA Business Administration',
]

const BATCHES = [
  'BSC-IT-S26-DA',
  'BBA-2024-JAN-A',
  'BSIT-2023-SEP-B',
  'NUR-2025-MAY-A',
]

const STATUSES = ['Active', 'Suspended', 'Deferred', 'Graduated']

export function EditStudentModal({ isOpen, onClose, showToast }: ModalProps) {
  const [saved, setSaved] = useState(false)

  if (!isOpen) return null

  function handleClose() { setSaved(false); onClose() }

  if (saved) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <SuccessPopup title="Student Updated!" subtitle="Your changes have been saved successfully." onClose={handleClose} />
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay open" id="edit-student-modal">
      <div className="modal modal-md" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr">
          <div className="modal-title"><i className="lni lni-pencil"></i> Edit Student</div>
          <button className="modal-close" onClick={onClose}><i className="lni lni-close"></i></button>
        </div>
        <div className="g2">
          <div className="fg span2">
            <div className="lbl">Full Name <span className="req">*</span></div>
            <input className="ctrl" type="text" defaultValue="Aisha Nakamya" />
          </div>
          <div className="fg">
            <div className="lbl">Programme <span className="req">*</span></div>
            <SearchSelect value="BSc. Computer Science" options={PROGRAMMES} />
          </div>
          <div className="fg">
            <div className="lbl">Batch <span className="req">*</span></div>
            <SearchSelect value="BSC-IT-S26-DA" options={BATCHES} />
          </div>
          <div className="fg">
            <div className="lbl">Email</div>
            <input className="ctrl" type="email" defaultValue="aisha.nakamya@isbat.ac.ug" />
          </div>
          <div className="fg">
            <div className="lbl">Status</div>
            <SearchSelect value="Active" options={STATUSES} />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-neu" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => setSaved(true)}>
            <i className="lni lni-checkmark"></i> Update Student
          </button>
        </div>
      </div>
    </div>
  )
}
