'use client'
import { ModalProps } from './types'

export function EditIntakeModal({ isOpen, onClose, showToast }: ModalProps) {
  if (!isOpen) return null
  return (
    <div className="modal-overlay open" id="intake-edit-modal" onClick={onClose}>
      <div className="modal modal-md" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr">
          <div className="modal-title"><i className="lni lni-pencil"></i> Edit Intake</div>
          <button className="modal-close" onClick={onClose}><i className="lni lni-close"></i></button>
        </div>
        <div className="g2">
          <div className="fg"><div className="lbl">Intake Code <span className="req">*</span></div><input className="ctrl" type="text" defaultValue="20261" /></div>
          <div className="fg"><div className="lbl">Description <span className="req">*</span></div><input className="ctrl" type="text" defaultValue="Spring 2026" /></div>
          <div className="fg"><div className="lbl">Financial Year <span className="req">*</span></div><input className="ctrl" type="text" defaultValue="2025–26" /></div>
          <div className="fg">
            <div className="lbl">Set As <span className="req">*</span></div>
            <select className="ctrl" defaultValue="Academic Intake (Teaching)"><option>Academic Intake (Teaching)</option><option>Admission Intake (New Students)</option></select>
          </div>
          <div className="fg"><div className="lbl">Semester Start Date <span className="req">*</span></div><input className="ctrl" type="date" defaultValue="2026-02-01" /></div>
          <div className="fg"><div className="lbl">Term 1 End Date <span className="req">*</span></div><input className="ctrl" type="date" defaultValue="2026-03-30" /></div>
          <div className="fg"><div className="lbl">Term 2 End Date / Semester End <span className="req">*</span></div><input className="ctrl" type="date" defaultValue="2026-05-31" /></div>
          <div className="fg"><div className="lbl">Grievance End Date</div><input className="ctrl" type="date" defaultValue="2026-06-10" /></div>
          <div className="fg"><div className="lbl">Re-entry Date</div><input className="ctrl" type="date" /></div>
          <div className="fg"><div className="lbl">Late Fee Start Date</div><input className="ctrl" type="date" defaultValue="2026-06-15" /></div>
        </div>
        <div className="warn-box mt-3"><i className="lni lni-warning"></i> Only one intake can be set as <em>Current Academic</em> and one as <em>Current Admission</em> simultaneously. Setting a new one will deactivate the previous.</div>
        <div className="modal-footer">
          <button className="btn btn-neu" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => { onClose(); showToast('Intake updated successfully.', 'success') }}><i className="lni lni-checkmark"></i> Update Intake</button>
        </div>
      </div>
    </div>
  )
}
