'use client'
import { useState } from 'react'
import { ModalProps } from '../types'
import { SuccessPopup } from './SuccessPopup'
import { SearchSelect } from '@/components/SearchSelect'

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

export function NewBatchModal({ isOpen, onClose, showToast }: ModalProps) {
  const [saved, setSaved] = useState(false)

  if (!isOpen) return null

  function handleClose() { setSaved(false); onClose() }

  if (saved) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <SuccessPopup title="Batch Created!" subtitle="The new batch has been saved successfully." onClose={handleClose} />
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay open" id="new-batch-modal">
      <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr">
          <div className="modal-title"><i className="lni lni-users"></i> Create New Batch</div>
          <button className="modal-close" onClick={onClose}><i className="lni lni-close"></i></button>
        </div>

        <div className="g3">
          <div className="fg">
            <div className="lbl">Programme Version <span className="req">*</span></div>
            <SearchSelect
              placeholder="— Select programme —"
              options={[
                { value: 'BSC-IT', label: 'BSc. IT 2026 (BCA-2026)' },
                { value: 'BBA', label: 'BBA 2021 (BBA-2021)' },
                { value: 'MBA', label: 'MBA 2024 (MBA-2024)' },
              ]}
            />
          </div>
          <div className="fg">
            <div className="lbl">Intake / Session <span className="req">*</span></div>
            <SearchSelect
              options={[
                { value: 'S26', label: 'Spring 2026 (S26)' },
                { value: 'F26', label: 'Fall 2026 (F26)' },
              ]}
            />
          </div>
          <div className="fg">
            <div className="lbl">Batch Type <span className="req">*</span></div>
            <SearchSelect
              options={[
                { value: 'D', label: 'Day' },
                { value: 'E', label: 'Evening' },
                { value: 'W', label: 'Weekend (Masters/PhD only)' },
                { value: 'O', label: 'Distance / Online' },
              ]}
            />
          </div>
          <div className="fg">
            <div className="lbl">Specialization</div>
            <SearchSelect
              placeholder="— Select specialization —"
              options={SPECIALIZATIONS}
            />
          </div>
          <div className="fg">
            <div className="lbl">Expected Student Count</div>
            <input className="ctrl" type="number" placeholder="e.g. 42" min={1} />
          </div>
        </div>

        <div className="my-[14px] p-[14px] bg-b50 border-[1.5px] border-[var(--b200)] rounded-[var(--rsm)] flex items-center gap-4">
          <span className="text-[var(--fs-xs)] font-bold text-g500 uppercase">Auto-Generated Batch Code:</span>
          <span className="font-mono font-extrabold text-b800" style={{ fontSize: 'var(--fs-2xl)' }}>BSC-IT-S26-DA</span>
        </div>

        <div className="fg">
          <div className="lbl">Batch In-Charge (Faculty) <span className="req">*</span></div>
          <SearchSelect
            placeholder="— Select faculty member —"
            options={['Dr. Ssekibuule Ronald', 'Ms. Namutebi Joyce', 'Prof. Mukasa Charles', 'Dr. Tendo Patrick', 'Dr. Kato Andrew']}
          />
        </div>

        <div className="info-box mt-3">
          <i className="lni lni-information"></i>
          Batch In-Charge can view batch-level reports but has no direct relation to programme course content. Specialization is assigned per student, not per batch.
        </div>

        <div className="modal-footer">
          <button className="btn btn-neu" onClick={handleClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => setSaved(true)}><i className="lni lni-checkmark"></i> Create Batch</button>
        </div>
      </div>
    </div>
  )
}
