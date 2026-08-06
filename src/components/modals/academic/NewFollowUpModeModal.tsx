'use client'
import { useState } from 'react'
import { ModalProps } from '../types'
import { SuccessPopup } from './SuccessPopup'
import { FailurePopup } from './FailurePopup'
import { FollowUpModeInput } from '@/lib/api/admission/followUpMode'

interface NewFollowUpModeModalProps extends ModalProps {
  createFollowUpMode: {
    mutate: (input: FollowUpModeInput, options?: { onSuccess?: () => void; onError?: (error: Error) => void }) => void
    isPending: boolean
  }
}

export function NewFollowUpModeModal({ isOpen, onClose, showToast, createFollowUpMode }: NewFollowUpModeModalProps) {
  const [saved, setSaved]                       = useState(false)
  const [failure, setFailure]                   = useState<string | null>(null)
  const [followUpModeName, setFollowUpModeName] = useState('')
  const [errors, setErrors]                     = useState<Record<string, string>>({})

  if (!isOpen) return null

  function handleClose() {
    setSaved(false); setFailure(null); setFollowUpModeName(''); setErrors({})
    onClose()
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
          <SuccessPopup title="Followup Mode Added!" subtitle="The new followup mode has been saved successfully." onClose={handleClose} />
        </div>
      </div>
    )
  }

  if (failure) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <FailurePopup title="Couldn't Add Followup Mode" subtitle={failure} onClose={() => setFailure(null)} />
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay open" id="new-followup-mode-modal">
      <div className="modal modal-md" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr modal-hdr-blue">
          <div className="modal-title"><i className="lni lni-comments"></i> Add Followup Mode</div>
          <button className="modal-close" onClick={handleClose}><i className="lni lni-close"></i></button>
        </div>
        <div className="fg">
          <div className="lbl">Followup Mode Name <span className="req">*</span></div>
          <input
            className="ctrl"
            type="text"
            placeholder="e.g. Phone Call"
            value={followUpModeName}
            onChange={e => { setFollowUpModeName(e.target.value); if (errors.followUpModeName) setErrors(p => ({ ...p, followUpModeName: '' })) }}
            style={errors.followUpModeName ? { borderColor: 'var(--red)' } : undefined}
          />
          {errors.followUpModeName && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.followUpModeName}</p>}
        </div>
        <div className="modal-footer">
          <button className="btn btn-neu" onClick={handleClose}>Cancel</button>
          <button
            className="btn btn-primary"
            disabled={createFollowUpMode.isPending}
            onClick={() => {
              if (!validate()) return
              createFollowUpMode.mutate(
                { followUpModeName },
                {
                  onSuccess: () => { setSaved(true); showToast('Followup mode added successfully') },
                  onError: (error: Error) => setFailure(error.message || 'Failed to add followup mode. Please try again.'),
                },
              )
            }}
          >
            <i className="lni lni-checkmark"></i> {createFollowUpMode.isPending ? 'Adding…' : 'Add Followup Mode'}
          </button>
        </div>
      </div>
    </div>
  )
}
