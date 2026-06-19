'use client'
import { useState } from 'react'
import { ModalProps } from './types'
import { SuccessPopup } from './SuccessPopup'

const SPECIALIZATIONS = [
  'General (All Specializations)',
  'Computer Science',
  'Information Technology',
  'Software Engineering',
  'Business Administration',
  'Finance & Accounting',
  'Human Resource Management',
  'Civil Engineering',
  'Electrical Engineering',
]

export function EditBatchModal({ isOpen, onClose, showToast }: ModalProps) {
  const [saved, setSaved] = useState(false)

  if (!isOpen) return null

  function handleClose() { setSaved(false); onClose() }

  if (saved) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <SuccessPopup title="Batch Updated!" subtitle="Your changes have been saved successfully." onClose={handleClose} />
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay open" id="edit-batch-modal" onClick={onClose}>
      <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr">
          <div className="modal-title"><i className="lni lni-pencil"></i> Edit Batch</div>
          <button className="modal-close" onClick={onClose}><i className="lni lni-close"></i></button>
        </div>

        <div className="g3">
          <div className="fg">
            <div className="lbl">Programme Version <span className="req">*</span></div>
            <select className="ctrl" defaultValue="BSC-IT">
              <option value="BSC-IT">BSc. IT 2026 (BCA-2026)</option>
              <option value="BBA">BBA 2021 (BBA-2021)</option>
              <option value="MBA">MBA 2024 (MBA-2024)</option>
            </select>
          </div>
          <div className="fg">
            <div className="lbl">Intake / Session <span className="req">*</span></div>
            <select className="ctrl" defaultValue="S26">
              <option value="S26">Spring 2026 (S26)</option>
              <option value="F26">Fall 2026 (F26)</option>
            </select>
          </div>
          <div className="fg">
            <div className="lbl">Batch Type <span className="req">*</span></div>
            <select className="ctrl" defaultValue="D">
              <option value="D">Day</option>
              <option value="E">Evening</option>
              <option value="W">Weekend (Masters/PhD only)</option>
              <option value="O">Distance / Online</option>
            </select>
          </div>
          <div className="fg">
            <div className="lbl">Specialization</div>
            <select className="ctrl" defaultValue="Computer Science">
              <option value="">— Select specialization —</option>
              {SPECIALIZATIONS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="fg">
            <div className="lbl">Expected Student Count</div>
            <input className="ctrl" type="number" defaultValue={42} min={1} />
          </div>
        </div>

        <div className="my-[14px] p-[14px] bg-b50 border-[1.5px] border-[var(--b200)] rounded-[var(--rsm)] flex items-center gap-4">
          <span className="text-[var(--fs-xs)] font-bold text-g500 uppercase">Batch Code:</span>
          <span className="font-mono font-extrabold text-b800" style={{ fontSize: 'var(--fs-2xl)' }}>BSC-IT-S26-DA</span>
        </div>

        <div className="fg">
          <div className="lbl">Batch In-Charge (Faculty) <span className="req">*</span></div>
          <select className="ctrl" defaultValue="Dr. Ssekibuule Ronald">
            <option value="">— Select faculty member —</option>
            <option>Dr. Ssekibuule Ronald</option>
            <option>Ms. Namutebi Joyce</option>
            <option>Prof. Mukasa Charles</option>
            <option>Dr. Tendo Patrick</option>
            <option>Dr. Kato Andrew</option>
          </select>
        </div>

        <div className="info-box mt-3">
          <i className="lni lni-information"></i>
          Batch In-Charge can view batch-level reports but has no direct relation to programme course content. Specialization is assigned per student, not per batch.
        </div>

        <div className="modal-footer">
          <button className="btn btn-neu" onClick={handleClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => setSaved(true)}><i className="lni lni-checkmark"></i> Update Batch</button>
        </div>
      </div>
    </div>
  )
}
