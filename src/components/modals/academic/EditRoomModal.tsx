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

export function EditRoomModal({ isOpen, onClose, showToast }: ModalProps) {
  const [saved, setSaved] = useState(false)

  if (!isOpen) return null

  function handleClose() { setSaved(false); onClose() }

  if (saved) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <SuccessPopup title="Room Updated!" subtitle="The room details have been saved successfully." onClose={handleClose} />
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay open">
      <div className="modal modal-md" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr modal-hdr-blue">
          <div className="modal-title"><i className="lni lni-pencil"></i> Edit Room</div>
          <button className="modal-close" onClick={handleClose}><i className="lni lni-close"></i></button>
        </div>

        <div className="g2">
          <div className="fg">
            <div className="lbl">Room Code <span className="req">*</span></div>
            <input className="ctrl font-mono uppercase" defaultValue="RM-FCT-001" />
          </div>
          <div className="fg">
            <div className="lbl">Capacity <span className="req">*</span></div>
            <input className="ctrl" type="number" defaultValue={40} min={1} />
          </div>
          <div className="fg span2">
            <div className="lbl">Room Description <span className="req">*</span></div>
            <input className="ctrl" defaultValue="Main Computing Lab" />
          </div>
          <div className="fg span2">
            <div className="lbl">Campus <span className="req">*</span></div>
            <SearchSelect placeholder="— Select Campus —" value="Main Campus — Kampala" options={CAMPUSES} />
          </div>
          <div className="fg">
            <div className="lbl">Building</div>
            <input className="ctrl" defaultValue="Block A" />
          </div>
          <div className="fg">
            <div className="lbl">Status <span className="req">*</span></div>
            <SearchSelect value="Active" options={STATUSES} />
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-neu" onClick={handleClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => setSaved(true)}>
            <i className="lni lni-checkmark"></i> Update Room
          </button>
        </div>
      </div>
    </div>
  )
}
