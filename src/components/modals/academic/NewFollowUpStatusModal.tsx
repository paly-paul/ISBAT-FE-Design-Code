'use client'
import { useState } from 'react'
import { ModalProps } from '../types'
import { SuccessPopup } from './SuccessPopup'
import { FailurePopup } from './FailurePopup'
import { FollowUpStatusInput } from '@/lib/api/academic/followUpStatus'

interface NewFollowUpStatusModalProps extends ModalProps {
  createFollowUpStatus: {
    mutate: (input: FollowUpStatusInput, options?: { onSuccess?: () => void; onError?: (error: Error) => void }) => void
    isPending: boolean
  }
}

export function NewFollowUpStatusModal({ isOpen, onClose, showToast, createFollowUpStatus }: NewFollowUpStatusModalProps) {
  const [saved, setSaved]                               = useState(false)
  const [failure, setFailure]                           = useState<string | null>(null)
  const [followUpStatusCode, setFollowUpStatusCode]     = useState('')
  const [followUpStatusName, setFollowUpStatusName]     = useState('')
  const [isClose, setIsClose]                           = useState(false)
  const [errors, setErrors]                             = useState<Record<string, string>>({})

  if (!isOpen) return null

  function handleClose() {
    setSaved(false); setFailure(null); setFollowUpStatusCode(''); setFollowUpStatusName(''); setIsClose(false); setErrors({})
    onClose()
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!followUpStatusCode.trim()) e.followUpStatusCode = 'Status Code is required'
    if (!followUpStatusName.trim()) e.followUpStatusName = 'Status Name is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  if (saved) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <SuccessPopup title="Followup Status Added!" subtitle="The new followup status has been saved successfully." onClose={handleClose} />
        </div>
      </div>
    )
  }

  if (failure) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <FailurePopup title="Couldn't Add Followup Status" subtitle={failure} onClose={() => setFailure(null)} />
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay open" id="new-followup-status-modal">
      <div className="modal modal-md" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr">
          <div className="modal-title"><i className="lni lni-phone"></i> Add Followup Status</div>
          <button className="modal-close" onClick={handleClose}><i className="lni lni-close"></i></button>
        </div>
        <div className="g2">
          <div className="fg">
            <div className="lbl">Status Code <span className="req">*</span></div>
            <input
              className="ctrl font-mono uppercase"
              type="text"
              placeholder="e.g. T1"
              maxLength={8}
              value={followUpStatusCode}
              onChange={e => { setFollowUpStatusCode(e.target.value); if (errors.followUpStatusCode) setErrors(p => ({ ...p, followUpStatusCode: '' })) }}
              style={errors.followUpStatusCode ? { borderColor: 'var(--red)' } : undefined}
            />
            {errors.followUpStatusCode && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.followUpStatusCode}</p>}
          </div>
          <div className="fg">
            <div className="lbl">Status Name <span className="req">*</span></div>
            <input
              className="ctrl"
              type="text"
              placeholder="e.g. Meeting Scheduled"
              value={followUpStatusName}
              onChange={e => { setFollowUpStatusName(e.target.value); if (errors.followUpStatusName) setErrors(p => ({ ...p, followUpStatusName: '' })) }}
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
          <button
            className="btn btn-primary"
            disabled={createFollowUpStatus.isPending}
            onClick={() => {
              if (!validate()) return
              createFollowUpStatus.mutate(
                { followUpStatusCode, followUpStatusName, isClose: isClose ? 1 : 0 },
                {
                  onSuccess: () => { setSaved(true); showToast('Followup status added successfully') },
                  onError: (error: Error) => setFailure(error.message || 'Failed to add followup status. Please try again.'),
                },
              )
            }}
          >
            <i className="lni lni-checkmark"></i> {createFollowUpStatus.isPending ? 'Adding…' : 'Add Followup Status'}
          </button>
        </div>
      </div>
    </div>
  )
}
