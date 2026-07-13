'use client'
import { useEffect, useState } from 'react'
import { ModalProps } from '../types'
import { SuccessPopup } from './SuccessPopup'
import { Stream, StreamInput } from '@/lib/api/academic/stream'

interface EditStreamModalProps extends ModalProps {
  stream: Stream | null
  updateStream: {
    mutate: (variables: { id: string; input: StreamInput }, options?: { onSuccess?: () => void }) => void
    isPending: boolean
  }
}

export function EditStreamModal({ isOpen, onClose, showToast, stream, updateStream }: EditStreamModalProps) {
  const [saved, setSaved] = useState(false)
  const [streamCode, setStreamCode] = useState('')
  const [streamName, setStreamName] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (isOpen && stream) {
      setStreamCode(stream.streamCode)
      setStreamName(stream.streamName)
      setErrors({})
    }
  }, [isOpen, stream])

  if (!isOpen || !stream) return null

  function handleClose() { setSaved(false); onClose() }

  function validate() {
    const e: Record<string, string> = {}
    if (!streamCode.trim()) e.streamCode = 'Stream Code is required'
    if (!streamName.trim()) e.streamName = 'Stream Name is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit() {
    if (!stream || !validate()) return
    updateStream.mutate(
      { id: stream.id, input: { streamCode, streamName } },
      { onSuccess: () => { setSaved(true); showToast('Stream updated successfully') } },
    )
  }

  if (saved) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <SuccessPopup title="Stream Updated!" subtitle="Your changes have been saved successfully." onClose={handleClose} />
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay open" id="edit-stream-modal">
      <div className="modal modal-md" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr">
          <div className="modal-title"><i className="lni lni-pencil"></i> Edit Stream</div>
          <button className="modal-close" onClick={handleClose}><i className="lni lni-close"></i></button>
        </div>
        <div className="g2">
          <div className="fg">
            <div className="lbl">Stream Code <span className="req">*</span></div>
            <input
              className="ctrl font-mono uppercase"
              type="text"
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
              value={streamName}
              onChange={e => { setStreamName(e.target.value); if (errors.streamName) setErrors(p => ({ ...p, streamName: '' })) }}
              style={errors.streamName ? { borderColor: 'var(--red)' } : undefined}
            />
            {errors.streamName && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.streamName}</p>}
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-neu" onClick={handleClose}>Cancel</button>
          <button className="btn btn-primary" disabled={updateStream.isPending} onClick={handleSubmit}>
            <i className="lni lni-checkmark"></i> {updateStream.isPending ? 'Updating…' : 'Update Stream'}
          </button>
        </div>
      </div>
    </div>
  )
}
