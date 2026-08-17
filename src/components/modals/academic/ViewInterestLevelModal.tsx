'use client'
import { useEffect, useState } from 'react'
import { ModalProps } from '../types'
import { SuccessPopup } from './SuccessPopup'
import { FailurePopup } from './FailurePopup'
import { InterestLevelInput } from '@/lib/api/admission/interestLevel'
import { useInterestLevel } from '@/hooks/admission/useInterestLevels'
import { AuthError } from '@/lib/api/client'

interface ViewInterestLevelModalProps extends ModalProps {
  interestLevelGuid: string | null
  onEdit: () => void
}

export function ViewInterestLevelModal({ isOpen, onClose, showToast, interestLevelGuid, onEdit }: ViewInterestLevelModalProps) {
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
      <div className="modal-overlay open" id="view-interest-level-modal">
        <div className="modal modal-md" onClick={e => e.stopPropagation()}>
          <div className="modal-hdr modal-hdr-blue">
            <div className="modal-title"><i className="lni lni-eye"></i> View Interest Level</div>
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
        <div className="modal-hdr modal-hdr-blue">
          <div className="modal-title"><i className="lni lni-pencil"></i> Edit Interest Level</div>
          <button className="modal-close" onClick={handleClose}><i className="lni lni-close"></i></button>
        </div>
        <div className="fg">
          <div className="lbl">Interest Level Name </div>
          <div className="val">{interestLevelName || '—'}</div>
          {errors.interestLevelName && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.interestLevelName}</p>}
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
