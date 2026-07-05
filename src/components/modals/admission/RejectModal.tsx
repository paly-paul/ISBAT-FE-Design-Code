'use client'
import { useState } from 'react'
import { ModalProps } from '../types'

export function RejectModal({ isOpen, onClose, showToast }: ModalProps) {
  const [reason, setReason]   = useState('')
  const [remarks, setRemarks] = useState('')
  const [errors, setErrors]   = useState<Record<string, string>>({})

  if (!isOpen) return null

  function handleClose() { setReason(''); setRemarks(''); setErrors({}); onClose() }

  function validate() {
    const e: Record<string, string> = {}
    if (!reason)          e.reason  = 'Please select a Rejection Reason'
    if (!remarks.trim())  e.remarks = 'Detailed Remarks are required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  return (
    <div className="modal-overlay open">
      <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr">
          <div className="modal-title"><i className="lni lni-ban"></i> Reject Application</div>
          <button className="modal-close" onClick={handleClose}><i className="lni lni-close"></i></button>
        </div>

        <div className="danger-box mb-3">
          <i className="lni lni-warning"></i>
          <span>This action will permanently reject the application and notify the applicant. This cannot be undone.</span>
        </div>

        <div className="fg mb-3">
          <label className="lbl">Rejection Reason <span className="req">*</span></label>
          <select className="ctrl" value={reason}
            onChange={e => { setReason(e.target.value); if (errors.reason) setErrors(p => ({ ...p, reason: '' })) }}
            style={errors.reason ? { borderColor: 'var(--red)' } : undefined}>
            <option value="">Select reason</option>
            <option>Does not meet A-Level entry standards</option>
            <option>Incomplete documentation</option>
            <option>Fee payment discrepancy</option>
            <option>Programme quota full</option>
            <option>Fraudulent documents detected</option>
            <option>Other</option>
          </select>
          {errors.reason && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.reason}</p>}
        </div>

        <div className="fg mb-3">
          <label className="lbl">Detailed Remarks <span className="req">*</span></label>
          <textarea className="ctrl" rows={3} placeholder="Provide detailed remarks for the rejection..." value={remarks}
            onChange={e => { setRemarks(e.target.value); if (errors.remarks) setErrors(p => ({ ...p, remarks: '' })) }}
            style={errors.remarks ? { borderColor: 'var(--red)' } : undefined} />
          {errors.remarks && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.remarks}</p>}
        </div>

        <div className="modal-footer">
          <button className="btn" onClick={handleClose}>Cancel</button>
          <button className="btn btn-danger" onClick={() => { if (validate()) { showToast('Application rejected successfully.', 'warning'); handleClose() } }}>
            <i className="lni lni-trash-can"></i> Confirm Rejection
          </button>
        </div>
      </div>
    </div>
  )
}
