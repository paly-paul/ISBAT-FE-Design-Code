'use client'
import { ModalProps } from './types'

export function NewFacultyModal({ isOpen, onClose, showToast }: ModalProps) {
  if (!isOpen) return null
  return (
    <div className="modal-overlay open" id="new-faculty-modal" onClick={onClose}>
      <div className="modal modal-md" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr">
          <div className="modal-title"><i className="lni lni-apartment"></i> Add Faculty</div>
          <button className="modal-close" onClick={onClose}><i className="lni lni-close"></i></button>
        </div>
        <div className="g2">
          <div className="fg">
            <div className="lbl">Faculty Code <span className="req">*</span></div>
            <input className="ctrl font-mono uppercase" type="text" id="nf-code" placeholder="e.g. FCT" maxLength={6} />
          </div>
          <div className="fg">
            <div className="lbl">Faculty Name <span className="req">*</span></div>
            <input className="ctrl" type="text" id="nf-name" placeholder="e.g. Faculty of Computing & Technology" />
          </div>
          <div className="fg span2">
            <div className="lbl">Dean <span className="req">*</span></div>
            <input className="ctrl" type="text" id="nf-dean" placeholder="e.g. Dr. Ssekibuule Ronald" />
          </div>
          <div className="fg">
            <div className="lbl">Programmes Count</div>
            <input className="ctrl" type="number" min={0} id="nf-progs" defaultValue={0} />
          </div>
          <div className="fg">
            <div className="lbl">Course Units Count</div>
            <input className="ctrl" type="number" min={0} id="nf-units" defaultValue={0} />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-neu" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary"><i className="lni lni-checkmark"></i> Add Faculty</button>
        </div>
      </div>
    </div>
  )
}
