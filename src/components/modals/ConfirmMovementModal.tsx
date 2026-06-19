'use client'
import { ModalProps } from './types'

export function ConfirmMovementModal({ isOpen, onClose, showToast }: ModalProps) {
  if (!isOpen) return null
  return (
    <div className="modal-overlay open" id="confirm-movement-modal" onClick={onClose}>
      <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr">
          <div className="modal-title"><i className="lni lni-warning"></i> Confirm Session Movement</div>
          <button className="modal-close" onClick={onClose}><i className="lni lni-close"></i></button>
        </div>
        <div className="danger-box mb-4"><i className="lni lni-volume-high"></i> <span>This will <strong>permanently move 1,247 students</strong> to the next semester and mark <strong>12 students as Dropout</strong>. This action cannot be undone.</span></div>
        <div className="fg mb-4"><div className="lbl">Type CONFIRM to proceed</div><input className="ctrl" type="text" id="sm-confirm-input" placeholder="Type CONFIRM" /></div>
        <div className="modal-footer">
          <button className="btn btn-neu" onClick={onClose}>Cancel</button>
          <button className="btn btn-danger"><i className="lni lni-reload"></i> Execute Movement</button>
        </div>
      </div>
    </div>
  )
}
