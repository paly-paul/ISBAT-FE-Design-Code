'use client'
import { ModalProps } from './types'

export function ProgrammeLevelModal({ isOpen, onClose, showToast }: ModalProps) {
  if (!isOpen) return null
  return (
    <div className="modal-overlay open" id="new-alevel-modal" onClick={onClose}>
      <div className="modal modal-md" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr">
          <div className="modal-title"><i className="lni lni-graduation"></i> Add / Edit Programme Level</div>
          <button className="modal-close" onClick={onClose}><i className="lni lni-close"></i></button>
        </div>
        <div className="g2">
          <div className="fg"><div className="lbl">Level Code <span className="req">*</span></div><input className="ctrl" placeholder="e.g. BACH" /></div>
          <div className="fg"><div className="lbl">Level Name <span className="req">*</span></div><input className="ctrl" placeholder="e.g. Bachelor's Degree" /></div>
          <div className="fg"><div className="lbl">Year Count <span className="req">*</span></div><input className="ctrl" type="number" placeholder="e.g. 3" min={1} max={10} /></div>
          <div className="fg"><div className="lbl">Semester Count <span className="req">*</span></div><input className="ctrl" type="number" placeholder="e.g. 6" min={1} max={20} /></div>
          <div className="fg"><div className="lbl">Minimum Credit Load <span className="req">*</span></div><input className="ctrl" type="number" placeholder="e.g. 132" min={0} /></div>
          <div className="fg">
            <div className="lbl">No Internal Assessment?</div>
            <div className="tgl-group">
              <button className="tgl-btn tgl-active">No (Standard)</button>
              <button className="tgl-btn">Yes (e.g. PhD)</button>
            </div>
          </div>
        </div>
        <div className="info-box mt-3"><i className="lni lni-information"></i> These values auto-populate the Programme Master when this level is selected.</div>
        <div className="modal-footer">
          <button className="btn btn-neu" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => { onClose(); showToast('Programme Level saved.', 'success') }}><i className="lni lni-checkmark"></i> Save Level</button>
        </div>
      </div>
    </div>
  )
}
