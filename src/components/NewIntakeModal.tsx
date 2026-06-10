'use client'
import { ModalProps } from './types'

export function NewIntakeModal({ isOpen, onClose, showToast }: ModalProps) {
  if (!isOpen) return null
  return (
    <div className="modal-overlay open" id="new-intake-modal" onClick={onClose}>
      <div className="modal modal-md" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr">
          <div className="modal-title"><i className="lni lni-calendar"></i> Create New Intake</div>
          <button className="modal-close" onClick={onClose}><i className="lni lni-close"></i></button>
        </div>
        <div className="g2">
          <div className="fg"><div className="lbl">Intake Code <span className="req">*</span></div><input className="ctrl" type="text" placeholder="e.g. 20263" /></div>
          <div className="fg"><div className="lbl">Description <span className="req">*</span></div><input className="ctrl" type="text" placeholder="e.g. Spring 2027" /></div>
          <div className="fg"><div className="lbl">Financial Year <span className="req">*</span></div><input className="ctrl" type="text" placeholder="e.g. 2026–27" /></div>
          <div className="fg">
            <div className="lbl">Set As <span className="req">*</span></div>
            <select className="ctrl"><option>Academic Intake (Teaching)</option><option>Admission Intake (New Students)</option></select>
          </div>
          <div className="fg"><div className="lbl">Semester Start Date <span className="req">*</span></div><input className="ctrl" type="date" /></div>
          <div className="fg"><div className="lbl">Term 1 End Date <span className="req">*</span></div><input className="ctrl" type="date" /></div>
          <div className="fg"><div className="lbl">Term 2 End Date / Semester End <span className="req">*</span></div><input className="ctrl" type="date" /></div>
          <div className="fg"><div className="lbl">Grievance End Date</div><input className="ctrl" type="date" /></div>
          <div className="fg"><div className="lbl">Re-entry Date</div><input className="ctrl" type="date" /></div>
          <div className="fg"><div className="lbl">Late Fee Start Date</div><input className="ctrl" type="date" /></div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-neu" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => { onClose(); showToast('Intake created successfully.', 'success') }}><i className="lni lni-checkmark"></i> Save Intake</button>
        </div>
      </div>
    </div>
  )
}
