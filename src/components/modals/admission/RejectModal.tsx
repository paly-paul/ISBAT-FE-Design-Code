'use client'
import { ModalProps } from '../types'

export function RejectModal({ isOpen, onClose, showToast }: ModalProps) {
  if (!isOpen) return null

  return (
    <div className="modal-overlay open" onClick={onClose}>
      <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr">
          <div className="modal-title"><i className="lni lni-ban"></i> Reject Application</div>
          <button className="modal-close" onClick={onClose}><i className="lni lni-close"></i></button>
        </div>

        <div className="danger-box mb-3">
          <i className="lni lni-warning"></i>
          <span>This action will permanently reject the application and notify the applicant. This cannot be undone.</span>
        </div>

        <div className="fg mb-3">
          <label className="lbl">Rejection Reason</label>
          <select className="ctrl">
            <option value="">Select reason</option>
            <option>Does not meet A-Level entry standards</option>
            <option>Incomplete documentation</option>
            <option>Fee payment discrepancy</option>
            <option>Programme quota full</option>
            <option>Fraudulent documents detected</option>
            <option>Other</option>
          </select>
        </div>

        <div className="fg mb-3">
          <label className="lbl">Detailed Remarks</label>
          <textarea className="ctrl" rows={3} placeholder="Provide detailed remarks for the rejection..." />
        </div>

        <div className="modal-footer">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-danger" onClick={() => { showToast('Application rejected successfully.', 'warning'); onClose() }}>
            <i className="lni lni-trash-can"></i> Confirm Rejection
          </button>
        </div>
      </div>
    </div>
  )
}
