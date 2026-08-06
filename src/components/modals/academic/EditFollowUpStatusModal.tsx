'use client'
import { useEffect, useState } from 'react'
import { ModalProps } from '../types'
import { SuccessPopup } from './SuccessPopup'
import { FailurePopup } from './FailurePopup'
import { FollowUpStatusInput } from '@/lib/api/academic/followUpStatus'
import { useFollowUpStatus } from '@/hooks/config/useFollowUpStatuses'
import { AuthError } from '@/lib/api/client'

interface EditFollowUpStatusModalProps extends ModalProps {
  followUpStatusGuid: string | null
  updateFollowUpStatus: {
    mutate: (variables: { guid: string; input: FollowUpStatusInput }, options?: { onSuccess?: () => void; onError?: (error: Error) => void }) => void
    isPending: boolean
  }
}

export function EditFollowUpStatusModal({ isOpen, onClose, showToast, followUpStatusGuid, updateFollowUpStatus }: EditFollowUpStatusModalProps) {
  const { data: followUpStatus, isLoading, isError, error } = useFollowUpStatus(followUpStatusGuid, isOpen)

  const [saved, setSaved]                           = useState(false)
  const [failure, setFailure]                       = useState<string | null>(null)
  const [followUpStatusCode, setFollowUpStatusCode] = useState('')
  const [followUpStatusName, setFollowUpStatusName] = useState('')
  const [isClose, setIsClose]                       = useState(false)
  const [errors, setErrors]                         = useState<Record<string, string>>({})

  // Prefill the form once the followup status has loaded. Re-runs whenever a
  // different guid is fetched (react-query resets `followUpStatus` to
  // undefined when followUpStatusGuid changes, so stale data never leaks
  // between edits).
  useEffect(() => {
    if (!isOpen || !followUpStatus) return
    setFollowUpStatusCode(followUpStatus.followUpStatusCode)
    setFollowUpStatusName(followUpStatus.followUpStatusName)
    setIsClose(followUpStatus.isClose === 1)
    setErrors({})
  }, [isOpen, followUpStatus])

  if (!isOpen) return null

  function handleClose() { setSaved(false); setFailure(null); setErrors({}); onClose() }

  function clearError(field: string) {
    setErrors(prev => (prev[field] ? { ...prev, [field]: '' } : prev))
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!followUpStatusCode.trim()) e.followUpStatusCode = 'Status Code is required'
    if (!followUpStatusName.trim()) e.followUpStatusName = 'Status Name is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit() {
    if (!followUpStatusGuid || !validate()) return
    updateFollowUpStatus.mutate(
      { guid: followUpStatusGuid, input: { followUpStatusCode, followUpStatusName, isClose: isClose ? 1 : 0 } },
      {
        onSuccess: () => { setSaved(true); showToast('Followup status updated successfully') },
        onError: (error: Error) => setFailure(error.message || 'Failed to update followup status. Please try again.'),
      },
    )
  }

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
      <div className="modal-overlay open" id="edit-followup-status-modal">
        <div className="modal modal-md" onClick={e => e.stopPropagation()}>
          <div className="modal-hdr modal-hdr-blue">
            <div className="modal-title"><i className="lni lni-pencil"></i> Edit Followup Status</div>
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
    <div className="modal-overlay open" id="edit-followup-status-modal">
      <div className="modal modal-md" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr modal-hdr-blue">
          <div className="modal-title"><i className="lni lni-pencil"></i> Edit Followup Status</div>
          <button className="modal-close" onClick={handleClose}><i className="lni lni-close"></i></button>
        </div>
        <div className="g2">
          <div className="fg">
            <div className="lbl">Status Code <span className="req">*</span></div>
            <input
              className="ctrl font-mono uppercase"
              type="text"
              maxLength={8}
              value={followUpStatusCode}
              onChange={e => { setFollowUpStatusCode(e.target.value); clearError('followUpStatusCode') }}
              style={errors.followUpStatusCode ? { borderColor: 'var(--red)' } : undefined}
            />
            {errors.followUpStatusCode && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.followUpStatusCode}</p>}
          </div>
          <div className="fg">
            <div className="lbl">Status Name <span className="req">*</span></div>
            <input
              className="ctrl"
              type="text"
              value={followUpStatusName}
              onChange={e => { setFollowUpStatusName(e.target.value); clearError('followUpStatusName') }}
              style={errors.followUpStatusName ? { borderColor: 'var(--red)' } : undefined}
            />
            {errors.followUpStatusName && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.followUpStatusName}</p>}
          </div>
          <div className="fg span2">
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginTop: 4 }}>
              <input
                type="checkbox"
                checked={isClose}
                onChange={e => setIsClose(e.target.checked)}
                style={{ width: 16, height: 16, accentColor: 'var(--b500)', cursor: 'pointer' }}
              />
              <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--g700)', fontWeight: 500 }}>Closes the followup when applied</span>
            </label>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-neu" onClick={handleClose}>Cancel</button>
          <button className="btn btn-primary" disabled={updateFollowUpStatus.isPending} onClick={handleSubmit}>
            <i className="lni lni-checkmark"></i> {updateFollowUpStatus.isPending ? 'Updating…' : 'Update Followup Status'}
          </button>
        </div>
      </div>
    </div>
  )
}
