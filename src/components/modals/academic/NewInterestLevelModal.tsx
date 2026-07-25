'use client'
import { useState } from 'react'
import { ModalProps } from '../types'
import { SuccessPopup } from './SuccessPopup'
import { FailurePopup } from './FailurePopup'
import { InterestLevelInput } from '@/lib/api/admission/interestLevel'

interface NewInterestLevelModalProps extends ModalProps {
  createInterestLevel: {
    mutate: (input: InterestLevelInput, options?: { onSuccess?: () => void; onError?: (error: Error) => void }) => void
    isPending: boolean
  }
}

export function NewInterestLevelModal({ isOpen, onClose, showToast, createInterestLevel }: NewInterestLevelModalProps) {
  const [saved, setSaved]                     = useState(false)
  const [failure, setFailure]                 = useState<string | null>(null)
  const [interestLevelName, setInterestLevelName] = useState('')
  const [errors, setErrors]                   = useState<Record<string, string>>({})

  if (!isOpen) return null

  function handleClose() {
    setSaved(false); setFailure(null); setInterestLevelName(''); setErrors({})
    onClose()
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
          <SuccessPopup title="Interest Level Added!" subtitle="The new interest level has been saved successfully." onClose={handleClose} />
        </div>
      </div>
    )
  }

  if (failure) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <FailurePopup title="Couldn't Add Interest Level" subtitle={failure} onClose={() => setFailure(null)} />
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay open" id="new-interest-level-modal">
      <div className="modal modal-md" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr">
          <div className="modal-title"><i className="lni lni-signal"></i> Add Interest Level</div>
          <button className="modal-close" onClick={handleClose}><i className="lni lni-close"></i></button>
        </div>
        <div className="fg">
          <div className="lbl">Interest Level Name <span className="req">*</span></div>
          <input
            className="ctrl"
            type="text"
            placeholder="e.g. High"
            value={interestLevelName}
            onChange={e => { setInterestLevelName(e.target.value); if (errors.interestLevelName) setErrors(p => ({ ...p, interestLevelName: '' })) }}
            style={errors.interestLevelName ? { borderColor: 'var(--red)' } : undefined}
          />
          {errors.interestLevelName && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.interestLevelName}</p>}
        </div>
        <div className="modal-footer">
          <button className="btn btn-neu" onClick={handleClose}>Cancel</button>
          <button
            className="btn btn-primary"
            disabled={createInterestLevel.isPending}
            onClick={() => {
              if (!validate()) return
              createInterestLevel.mutate(
                { interestLevelName },
                {
                  onSuccess: () => { setSaved(true); showToast('Interest level added successfully') },
                  onError: (error: Error) => setFailure(error.message || 'Failed to add interest level. Please try again.'),
                },
              )
            }}
          >
            <i className="lni lni-checkmark"></i> {createInterestLevel.isPending ? 'Adding…' : 'Add Interest Level'}
          </button>
        </div>
      </div>
    </div>
  )
}
