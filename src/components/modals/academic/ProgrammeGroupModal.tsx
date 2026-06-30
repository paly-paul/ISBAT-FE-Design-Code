'use client'
import { ModalProps } from '../types'
import { SearchSelect } from '@/components/SearchSelect'

export function ProgrammeGroupModal({ isOpen, onClose, showToast }: ModalProps) {
  if (!isOpen) return null
  return (
    <div className="modal-overlay open" id="new-proggroup-modal">
      <div className="modal modal-md" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr">
          <div className="modal-title"><i className="lni lni-folder"></i> Add Programme Group</div>
          <button className="modal-close" onClick={onClose}><i className="lni lni-close"></i></button>
        </div>
        <div className="g2">
          <div className="fg"><div className="lbl">Group Code <span className="req">*</span></div><input className="ctrl" placeholder="e.g. BCA" /></div>
          <div className="fg"><div className="lbl">Group Name <span className="req">*</span></div><input className="ctrl" placeholder="e.g. Bachelor of Computer Applications" /></div>
          <div className="fg span2">
            <div className="lbl">Programme Level <span className="req">*</span></div>
            <SearchSelect options={["Bachelor's Degree", "Master's Degree", 'PhD', 'Diploma', 'Certificate / HEC', 'Engineering']} />
          </div>
        </div>
        <div className="info-box mt-3"><i className="lni lni-information"></i> The Programme Group is used for aggregate reporting across all curriculum versions. E.g. searching &quot;BCA&quot; returns students from BCA 2026 and BCA 2031.</div>
        <div className="modal-footer">
          <button className="btn btn-neu" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => { onClose(); showToast('Programme Group saved.', 'success') }}><i className="lni lni-checkmark"></i> Save Group</button>
        </div>
      </div>
    </div>
  )
}
