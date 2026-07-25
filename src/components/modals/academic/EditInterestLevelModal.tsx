'use client'
import { useEffect, useState } from 'react'
import { ModalProps } from '../types'
import { SuccessPopup } from './SuccessPopup'
import { FailurePopup } from './FailurePopup'
import { InterestLevelInput } from '@/lib/api/admission/interestLevel'
import { useInterestLevel } from '@/hooks/admission/useInterestLevels'
import { AuthError } from '@/lib/api/client'

interface EditInterestLevelModalProps extends ModalProps {
  interestLevelGuid: string | null
  updateInterestLevel: {
    mutate: (variables: { guid: string; input: InterestLevelInput }, options?: { onSuccess?: () => void; onError?: (error: Error) => void }) => void
    isPending: boolean
  }
}

export function EditInterestLevelModal({ isOpen, onClose, showToast, interestLevelGuid, updateInterestLevel }: EditInterestLevelModalProps) {
  const { data: level, isLoading, isError, error } = useInterestLevel(interestLevelGuid, isOpen)

  const [saved, setSaved]                     = useState(false)
  const [failure, setFailure]                 = useState<string | null>(null)
  const [interestLevelName, setInterestLevelName] = useState('')
  const [errors, setErrors]                   = useState<Record<string, string>>({})

  // Prefill the form once the level has loaded. Re-runs whenever a
  // different guid is fetched (react-query resets `level` to undefined when
  // interestLevelGuid changes, so stale data never leaks between edits).
  useEffect(() => {
    if (!isOpen || !level) return
    setInterestLevelName(level.interestLevelName)
    setErrors({})
  }, [isOpen, level])

  if (!isOpen) return null

  function handleClose() { setSaved(false); setFailure(null); setErrors({}); onClose() }

  function clearError(field: string) {
    setErrors(prev => (prev[field] ? { ...prev, [field]: '' } : prev))
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!interestLevelName.trim()) e.interestLevelName = 'Interest Level Name is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit() {
    if (!interestLevelGuid || !validate()) return
    updateInterestLevel.mutate(
      { guid: interestLevelGuid, input: { interestLevelName } },
      {
        onSuccess: () => { setSaved(true); showToast('Interest level updated successfully') },
        onError: (error: Error) => setFailure(error.message || 'Failed to update interest level. Please try again.'),
      },
    )
  }

  if (saved) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <SuccessPopup title="Interest Level Updated!" subtitle="Your changes have been saved successfully." onClose={handleClose} />
        </div>
      </div>
    )
  }

  if (failure) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <FailurePopup title="Couldn't Update Interest Level" subtitle={failure} onClose={() => setFailure(null)} />
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <FailurePopup
            title="Couldn't Load Interest Level"
            subtitle={error instanceof AuthError ? (error.message || 'Failed to load interest level details.') : 'Failed to load interest level details.'}
            onClose={handleClose}
          />
        </div>
      </div>
    )
  }

  if (isLoading || !level) {
    return (
      <div className="modal-overlay open" id="edit-interest-level-modal">
        <div className="modal modal-md" onClick={e => e.stopPropagation()}>
          <div className="modal-hdr">
            <div className="modal-title"><i className="lni lni-pencil"></i> Edit Interest Level</div>
            <button className="modal-close" onClick={handleClose}><i className="lni lni-close"></i></button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 180 }}>
            <span style={{ color: 'var(--g400)' }}>Loading interest level details…</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay open" id="edit-interest-level-modal">
      <div className="modal modal-md" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr">
          <div className="modal-title"><i className="lni lni-pencil"></i> Edit Interest Level</div>
          <button className="modal-close" onClick={handleClose}><i className="lni lni-close"></i></button>
        </div>
        <div className="fg">
          <div className="lbl">Interest Level Name <span className="req">*</span></div>
          <input
            className="ctrl"
            type="text"
            value={interestLevelName}
            onChange={e => { setInterestLevelName(e.target.value); clearError('interestLevelName') }}
            style={errors.interestLevelName ? { borderColor: 'var(--red)' } : undefined}
          />
          {errors.interestLevelName && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.interestLevelName}</p>}
        </div>
        <div className="modal-footer">
          <button className="btn btn-neu" onClick={handleClose}>Cancel</button>
          <button className="btn btn-primary" disabled={updateInterestLevel.isPending} onClick={handleSubmit}>
            <i className="lni lni-checkmark"></i> {updateInterestLevel.isPending ? 'Updating…' : 'Update Interest Level'}
          </button>
        </div>
      </div>
    </div>
  )
}
