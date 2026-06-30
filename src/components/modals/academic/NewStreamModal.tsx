'use client'
import { useState } from 'react'
import { ModalProps } from '../types'
import { SuccessPopup } from './SuccessPopup'

export function NewStreamModal({ isOpen, onClose, showToast }: ModalProps) {
  const [saved, setSaved]             = useState(false)
  const [streamCode, setStreamCode]   = useState('')
  const [streamName, setStreamName]   = useState('')
  const [errors, setErrors]           = useState<Record<string, string>>({})

  if (!isOpen) return null

  function handleClose() {
    setSaved(false); setStreamCode(''); setStreamName(''); setErrors({})
    onClose()
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!streamCode.trim()) e.streamCode = 'Stream Code is required'
    if (!streamName.trim()) e.streamName = 'Stream Name is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  if (saved) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <SuccessPopup title="Stream Added!" subtitle="The new specialization stream has been saved successfully." onClose={handleClose} />
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay open" id="new-stream-modal">
      <div className="modal modal-md" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr">
          <div className="modal-title"><i className="lni lni-certificate"></i> Add Stream</div>
          <button className="modal-close" onClick={handleClose}><i className="lni lni-close"></i></button>
        </div>
        <div className="g2">
          <div className="fg">
            <div className="lbl">Stream Code <span className="req">*</span></div>
            <input
              className="ctrl font-mono uppercase"
              type="text"
              placeholder="e.g. SE"
              maxLength={8}
              value={streamCode}
              onChange={e => { setStreamCode(e.target.value); if (errors.streamCode) setErrors(p => ({ ...p, streamCode: '' })) }}
              style={errors.streamCode ? { borderColor: 'var(--red)' } : undefined}
            />
            {errors.streamCode && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.streamCode}</p>}
          </div>
          <div className="fg">
            <div className="lbl">Stream Name <span className="req">*</span></div>
            <input
              className="ctrl"
              type="text"
              placeholder="e.g. Software Engineering"
              value={streamName}
              onChange={e => { setStreamName(e.target.value); if (errors.streamName) setErrors(p => ({ ...p, streamName: '' })) }}
              style={errors.streamName ? { borderColor: 'var(--red)' } : undefined}
            />
            {errors.streamName && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.streamName}</p>}
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-neu" onClick={handleClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => { if (validate()) setSaved(true) }}>
            <i className="lni lni-checkmark"></i> Add Stream
          </button>
        </div>
      </div>
    </div>
  )
}
