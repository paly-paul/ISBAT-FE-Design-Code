'use client'
import { useEffect, useState } from 'react'
import { ModalProps } from '../types'
import { SuccessPopup } from './SuccessPopup'
import { FailurePopup } from './FailurePopup'
import { StreamInput } from '@/lib/api/academic/stream'
import { useStream } from '@/hooks/config/useStreams'
import { AuthError } from '@/lib/api/client'

interface ViewStreamModalProps extends ModalProps {
  streamGuid: string | null
  onEdit: () => void
}

export function ViewStreamModal({ isOpen, onClose, showToast, streamGuid, onEdit }: ViewStreamModalProps) {
  const { data: stream, isLoading, isError, error } = useStream(streamGuid, isOpen)

  const [saved, setSaved]           = useState(false)
  const [failure, setFailure]       = useState<string | null>(null)
  const [streamCode, setStreamCode] = useState('')
  const [streamName, setStreamName] = useState('')
  const [errors, setErrors]         = useState<Record<string, string>>({})

  // Fill the form when the selected stream loads.
  useEffect(() => {
    if (!isOpen || !stream) return
    setStreamCode(stream.streamCode)
    setStreamName(stream.streamName)
    setErrors({})
  }, [isOpen, stream])

  if (!isOpen) return null

  function handleClose() { setSaved(false); setFailure(null); setErrors({}); onClose() }

  function clearError(field: string) {
    setErrors(prev => (prev[field] ? { ...prev, [field]: '' } : prev))
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
          <SuccessPopup title="Stream Updated!" subtitle="Your changes have been saved successfully." onClose={handleClose} />
        </div>
      </div>
    )
  }

  if (failure) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <FailurePopup title="Couldn't Update Stream" subtitle={failure} onClose={() => setFailure(null)} />
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <FailurePopup
            title="Couldn't Load Stream"
            subtitle={error instanceof AuthError ? (error.message || 'Failed to load stream details.') : 'Failed to load stream details.'}
            onClose={handleClose}
          />
        </div>
      </div>
    )
  }

  if (isLoading || !stream) {
    return (
      <div className="modal-overlay open" id="view-stream-modal">
        <div className="modal modal-md" onClick={e => e.stopPropagation()}>
          <div className="modal-hdr modal-hdr-blue">
            <div className="modal-title"><i className="lni lni-eye"></i> View Stream</div>
            <button className="modal-close" onClick={handleClose}><i className="lni lni-close"></i></button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 180 }}>
            <span style={{ color: 'var(--g400)' }}>Loading stream details…</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay open" id="edit-stream-modal">
      <div className="modal modal-md" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr modal-hdr-blue">
          <div className="modal-title"><i className="lni lni-pencil"></i> Edit Stream</div>
          <button className="modal-close" onClick={handleClose}><i className="lni lni-close"></i></button>
        </div>
        <div className="g3">
          <div className="fg">
            <div className="lbl">Stream Code </div>
            <div className="val font-mono uppercase">{streamCode || '—'}</div>
            {errors.streamCode && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.streamCode}</p>}
          </div>
          <div className="fg">
            <div className="lbl">Stream Name </div>
            <div className="val">{streamName || '—'}</div>
            {errors.streamName && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.streamName}</p>}
          </div>
        </div>
        <div className="modal-footer">
          <span className="flex-1"></span>
          <button className="btn btn-neu" onClick={onEdit} style={{ marginRight: 8 }}>
            <i className="lni lni-pencil"></i> Edit
          </button>
          <button className="btn btn-primary" onClick={handleClose}>Close</button>
        </div>
      </div>
    </div>
  )
}
