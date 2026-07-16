'use client'
import { useEffect, useState } from 'react'
import { ModalProps } from '../types'
import { SuccessPopup } from './SuccessPopup'
import { FailurePopup } from './FailurePopup'
import { StreamInput } from '@/lib/api/academic/stream'
import { useStream } from '@/hooks/config/useStreams'
import { AuthError } from '@/lib/api/client'

interface EditStreamModalProps extends ModalProps {
  streamGuid: string | null
  updateStream: {
    mutate: (variables: { guid: string; input: StreamInput }, options?: { onSuccess?: () => void; onError?: (error: Error) => void }) => void
    isPending: boolean
  }
}

export function EditStreamModal({ isOpen, onClose, showToast, streamGuid, updateStream }: EditStreamModalProps) {
  const { data: stream, isLoading, isError, error } = useStream(streamGuid, isOpen)

  const [saved, setSaved]           = useState(false)
  const [failure, setFailure]       = useState<string | null>(null)
  const [streamCode, setStreamCode] = useState('')
  const [streamName, setStreamName] = useState('')
  const [errors, setErrors]         = useState<Record<string, string>>({})

  // Prefill the form once the specialization has loaded. Re-runs whenever a
  // different guid is fetched (react-query resets `stream` to undefined when
  // streamGuid changes, so stale data never leaks between edits).
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

  function handleSubmit() {
    if (!streamGuid || !validate()) return
    updateStream.mutate(
      { guid: streamGuid, input: { streamCode, streamName } },
      {
        onSuccess: () => { setSaved(true); showToast('Stream updated successfully') },
        onError: (error: Error) => setFailure(error.message || 'Failed to update stream. Please try again.'),
      },
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
      <div className="modal-overlay open" id="edit-stream-modal">
        <div className="modal modal-md" onClick={e => e.stopPropagation()}>
          <div className="modal-hdr">
            <div className="modal-title"><i className="lni lni-pencil"></i> Edit Stream</div>
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
              onChange={e => { setStreamCode(e.target.value); clearError('streamCode') }}
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
              onChange={e => { setStreamName(e.target.value); clearError('streamName') }}
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
