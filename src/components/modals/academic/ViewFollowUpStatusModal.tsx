'use client'
import { useEffect, useState } from 'react'
import { ModalProps } from '../types'
import { SuccessPopup } from './SuccessPopup'
import { FailurePopup } from './FailurePopup'
import { useFollowUpStatus } from '@/hooks/config/useFollowUpStatuses'
import { AuthError } from '@/lib/api/client'

interface ViewFollowUpStatusModalProps extends ModalProps {
  followUpStatusGuid: string | null
  onEdit: () => void
}

export function ViewFollowUpStatusModal({ isOpen, onClose, showToast, followUpStatusGuid, onEdit }: ViewFollowUpStatusModalProps) {
  const { data: followUpStatus, isLoading, isError, error } = useFollowUpStatus(followUpStatusGuid, isOpen)

  const [saved, setSaved]                           = useState(false)
  const [failure, setFailure]                       = useState<string | null>(null)
  const [followUpStatusCode, setFollowUpStatusCode] = useState('')
  const [followUpStatusName, setFollowUpStatusName] = useState('')
  const [isClose, setIsClose]                       = useState(false)

  // Prefill the form once the followup status has loaded. Re-runs whenever a
  // different guid is fetched (react-query resets \`followUpStatus\` to
  // undefined when followUpStatusGuid changes, so stale data never leaks
  // between edits).
  useEffect(() => {
    if (!isOpen || !followUpStatus) return
    setFollowUpStatusCode(followUpStatus.followUpStatusCode)
    setFollowUpStatusName(followUpStatus.followUpStatusName)
    setIsClose(followUpStatus.isClose === 1)
  }, [isOpen, followUpStatus])

  if (!isOpen) return null

  function handleClose() { setSaved(false); setFailure(null); onClose() }

  if (saved) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <SuccessPopup title="Followup Status Updated!" subtitle="Your changes have been saved successfully." onClose={handleClose} />
        </div>
      </div>
    )
  }

  if (failure) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <FailurePopup title="Couldn't Update Followup Status" subtitle={failure} onClose={() => setFailure(null)} />
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <FailurePopup
            title="Couldn't Load Followup Status"
            subtitle={error instanceof AuthError ? (error.message || 'Failed to load followup status details.') : 'Failed to load followup status details.'}
            onClose={handleClose}
          />
        </div>
      </div>
    )
  }

  if (isLoading || !followUpStatus) {
    return (
      <div className="modal-overlay open" id="view-followup-status-modal">
        <div className="modal modal-md" onClick={e => e.stopPropagation()}>
          <div className="modal-hdr modal-hdr-blue">
            <div className="modal-title"><i className="lni lni-eye"></i> View Followup Status</div>
            <button className="modal-close" onClick={handleClose}><i className="lni lni-close"></i></button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 180 }}>
            <span style={{ color: 'var(--g400)' }}>Loading followup status details…</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay open" id="view-followup-status-modal">
      <div className="modal modal-md" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr modal-hdr-blue">
          <div className="modal-title"><i className="lni lni-eye"></i> View Followup Status</div>
          <button className="modal-close" onClick={handleClose}><i className="lni lni-close"></i></button>
        </div>
        <div className="g3">
          <div className="fg">
            <div className="lbl">Status Code </div>
            <div className="val font-mono uppercase">{followUpStatusCode || '—'}</div>
          </div>
          <div className="fg">
            <div className="lbl">Status Name </div>
            <div className="val">{followUpStatusName || '—'}</div>
          </div>
          <div className="fg">
            <div className="lbl">Closes followup when applied?</div>
            <div className="val">{isClose ? 'Yes' : 'No'}</div>
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
