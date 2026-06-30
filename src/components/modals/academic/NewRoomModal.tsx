'use client'
import { useState } from 'react'
import { ModalProps } from '../types'
import { SuccessPopup } from './SuccessPopup'
import { SearchSelect } from '@/components/SearchSelect'

const CAMPUSES = [
  'Main Campus — Kampala',
  'Kampala City Campus',
  'Mukono Campus',
  'Jinja Campus',
  'Online / ODL Hub',
]

const STATUSES = ['Active', 'Inactive', 'Under Maintenance', 'Reserved']

export function NewRoomModal({ isOpen, onClose, showToast }: ModalProps) {
  const [saved, setSaved] = useState(false)

  if (!isOpen) return null

  function handleClose() { setSaved(false); onClose() }

  if (saved) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <SuccessPopup title="Room Added!" subtitle="The new room has been added successfully." onClose={handleClose} />
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay open">
      <div className="modal modal-md" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr">
          <div className="modal-title"><i className="lni lni-home"></i> Add Room</div>
          <button className="modal-close" onClick={handleClose}><i className="lni lni-close"></i></button>
        </div>

        <div className="g2">
          <div className="fg">
            <div className="lbl">Room Code <span className="req">*</span></div>
            <input className="ctrl font-mono uppercase" placeholder="e.g. RM-FCT-004" />
          </div>
          <div className="fg">
            <div className="lbl">Capacity <span className="req">*</span></div>
            <input className="ctrl" type="number" placeholder="e.g. 40" min={1} />
          </div>
          <div className="fg span2">
            <div className="lbl">Room Description <span className="req">*</span></div>
            <input className="ctrl" placeholder="e.g. Main Computing Lab" />
          </div>
          <div className="fg span2">
            <div className="lbl">Campus <span className="req">*</span></div>
            <SearchSelect placeholder="— Select Campus —" options={CAMPUSES} />
          </div>
          <div className="fg">
            <div className="lbl">Building</div>
            <input className="ctrl" placeholder="e.g. Block A" />
          </div>
          <div className="fg">
            <div className="lbl">Status <span className="req">*</span></div>
            <SearchSelect options={STATUSES} />
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-neu" onClick={handleClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => setSaved(true)}>
            <i className="lni lni-checkmark"></i> Save Room
          </button>
        </div>
      </div>
    </div>
  )
}
