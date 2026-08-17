'use client'
import { useEffect, useState } from 'react'
import { ModalProps } from '../types'
import { SuccessPopup } from './SuccessPopup'
import { FailurePopup } from './FailurePopup'
import { FollowUpModeInput } from '@/lib/api/admission/followUpMode'
import { useFollowUpMode } from '@/hooks/admission/useFollowUpModes'
import { AuthError } from '@/lib/api/client'

interface ViewFollowUpModeModalProps extends ModalProps {
  followUpModeGuid: string | null
  onEdit: () => void
}

export function ViewFollowUpModeModal({ isOpen, onClose, showToast, followUpModeGuid, onEdit }: ViewFollowUpModeModalProps) {
  const { data: mode, isLoading, isError, error } = useFollowUpMode(followUpModeGuid, isOpen)

  const [saved, setSaved]                       = useState(false)
  const [failure, setFailure]                   = useState<string | null>(null)
  const [followUpModeName, setFollowUpModeName] = useState('')
  const [errors, setErrors]                     = useState<Record<string, string>>({})

  // Prefill the form once the mode has loaded. Re-runs whenever a different
  // guid is fetched (react-query resets `mode` to undefined when
  // followUpModeGuid changes, so stale data never leaks between edits).
  useEffect(() => {
    if (!isOpen || !mode) return
    setFollowUpModeName(mode.followUpModeName)
    setErrors({})
  }, [isOpen, mode])

  if (!isOpen) return null

  function handleClose() { setSaved(false); setFailure(null); setErrors({}); onClose() }

  function clearError(field: string) {
    setErrors(prev => (prev[field] ? { ...prev, [field]: '' } : prev))
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!followUpModeName.trim()) e.followUpModeName = 'Followup Mode Name is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  if (saved) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <SuccessPopup title="Followup Mode Updated!" subtitle="Your changes have been saved successfully." onClose={handleClose} />
        </div>
      </div>
    )
  }

  if (failure) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <FailurePopup title="Couldn't Update Followup Mode" subtitle={failure} onClose={() => setFailure(null)} />
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <FailurePopup
            title="Couldn't Load Followup Mode"
            subtitle={error instanceof AuthError ? (error.message || 'Failed to load followup mode details.') : 'Failed to load followup mode details.'}
            onClose={handleClose}
          />
        </div>
      </div>
    )
  }

  if (isLoading || !mode) {
    return (
      <div className="modal-overlay open" id="view-followup-mode-modal">
        <div className="modal modal-md" onClick={e => e.stopPropagation()}>
          <div className="modal-hdr modal-hdr-blue">
            <div className="modal-title"><i className="lni lni-eye"></i> View Followup Mode</div>
            <button className="modal-close" onClick={handleClose}><i className="lni lni-close"></i></button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 180 }}>
            <span style={{ color: 'var(--g400)' }}>Loading followup mode details…</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay open" id="edit-followup-mode-modal">
      <div className="modal modal-md" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr modal-hdr-blue">
          <div className="modal-title"><i className="lni lni-pencil"></i> Edit Followup Mode</div>
          <button className="modal-close" onClick={handleClose}><i className="lni lni-close"></i></button>
        </div>
        <div className="fg">
          <div className="lbl">Followup Mode Name </div>
          <div className="val">{followUpModeName || '—'}</div>
          {errors.followUpModeName && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.followUpModeName}</p>}
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
