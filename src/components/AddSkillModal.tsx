'use client'
import { ModalProps } from './types'

export function AddSkillModal({ isOpen, onClose, showToast }: ModalProps) {
  if (!isOpen) return null
  return (
    <div className="modal-overlay open" id="add-skill-modal" onClick={onClose}>
      <div className="modal modal-md" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr">
          <div className="modal-title"><i className="lni lni-bulb"></i> Add / Update Faculty Skills</div>
          <button className="modal-close" onClick={onClose}><i className="lni lni-close"></i></button>
        </div>
        <div className="fg mb-3">
          <div className="lbl">Faculty Member <span className="req">*</span></div>
          <select className="ctrl">
            <option>-- Select --</option>
            <option>Dr. Ssekibuule Ronald (FCT)</option>
            <option>Ms. Namutebi Joyce (FCT)</option>
            <option>Prof. Mukasa Charles (FBM)</option>
            <option>Dr. Kibira Moses (FCT)</option>
            <option>Ms. Atim Grace (FBM)</option>
          </select>
        </div>
        <div className="sec-divider">Subject Expertise Areas</div>
        <div id="skill-list" className="flex flex-col gap-2 mb-[10px]">
          <div className="grid grid-cols-[1fr_120px_80px] gap-2 items-center">
            <input className="ctrl" type="text" placeholder="Skill / Subject area (e.g. Data Structures)" />
            <select className="ctrl"><option>Expert</option><option>Proficient</option><option>Familiar</option></select>
            <button className="btn btn-danger btn-sm"><i className="lni lni-trash-can"></i></button>
          </div>
        </div>
        <button className="btn btn-neu btn-sm mb-3"><i className="lni lni-plus"></i> Add Skill Row</button>
        <div className="info-box"><i className="lni lni-information"></i> Skills are visible to Support Staff performing Course Allocation from the Dean&apos;s Excel file.</div>
        <div className="modal-footer">
          <button className="btn btn-neu" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => { onClose(); showToast('Skills saved. Ready for allocation.', 'success') }}><i className="lni lni-checkmark"></i> Save Skills</button>
        </div>
      </div>
    </div>
  )
}
