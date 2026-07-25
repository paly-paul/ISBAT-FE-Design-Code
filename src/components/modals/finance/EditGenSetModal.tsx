'use client'
import { useEffect, useState } from 'react'
import { ModalProps } from '../types'
import { SuccessPopup } from '../academic/SuccessPopup'
import { FailurePopup } from '../academic/FailurePopup'
import { GenSetInput } from '@/lib/api/finance/genSet'
import { useGenSet } from '@/hooks/finance/useGenSets'
import { AuthError } from '@/lib/api/client'

interface EditGenSetModalProps extends ModalProps {
  genSetGuid: string | null
  updateGenSet: {
    mutate: (variables: { guid: string; input: GenSetInput }, options?: { onSuccess?: () => void; onError?: (error: Error) => void }) => void
    isPending: boolean
  }
}

export function EditGenSetModal({ isOpen, onClose, showToast, genSetGuid, updateGenSet }: EditGenSetModalProps) {
  const { data: genSet, isLoading, isError, error } = useGenSet(genSetGuid, isOpen)

  const [saved, setSaved]         = useState(false)
  const [failure, setFailure]     = useState<string | null>(null)
  const [type, setType]           = useState('')
  const [condition, setCondition] = useState('')
  const [errors, setErrors]       = useState<Record<string, string>>({})

  // Prefill the form once the general setting has loaded. Re-runs whenever a
  // different guid is fetched (react-query resets `genSet` to undefined when
  // genSetGuid changes, so stale data never leaks between edits).
  useEffect(() => {
    if (!isOpen || !genSet) return
    setType(genSet.type)
    setCondition(genSet.condition)
    setErrors({})
  }, [isOpen, genSet])

  if (!isOpen) return null

  function handleClose() { setSaved(false); setFailure(null); setErrors({}); onClose() }

  function clearError(field: string) {
    setErrors(prev => (prev[field] ? { ...prev, [field]: '' } : prev))
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!type.trim()) e.type = 'Type is required'
    if (!condition.trim()) e.condition = 'Condition is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit() {
    if (!genSetGuid || !validate()) return
    updateGenSet.mutate(
      { guid: genSetGuid, input: { type, condition } },
      {
        onSuccess: () => { setSaved(true); showToast('General setting updated successfully') },
        onError: (error: Error) => setFailure(error.message || 'Failed to update general setting. Please try again.'),
      },
    )
  }

  if (saved) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <SuccessPopup title="General Setting Updated!" subtitle="Your changes have been saved successfully." onClose={handleClose} />
        </div>
      </div>
    )
  }

  if (failure) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <FailurePopup title="Couldn't Update General Setting" subtitle={failure} onClose={() => setFailure(null)} />
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <FailurePopup
            title="Couldn't Load General Setting"
            subtitle={error instanceof AuthError ? (error.message || 'Failed to load general setting details.') : 'Failed to load general setting details.'}
            onClose={handleClose}
          />
        </div>
      </div>
    )
  }

  if (isLoading || !genSet) {
    return (
      <div className="modal-overlay open" id="edit-genset-modal">
        <div className="modal modal-md" onClick={e => e.stopPropagation()}>
          <div className="modal-hdr">
            <div className="modal-title"><i className="lni lni-pencil"></i> Edit General Setting</div>
            <button className="modal-close" onClick={handleClose}><i className="lni lni-close"></i></button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 180 }}>
            <span style={{ color: 'var(--g400)' }}>Loading general setting details…</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay open" id="edit-genset-modal">
      <div className="modal modal-md" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr">
          <div className="modal-title"><i className="lni lni-pencil"></i> Edit General Setting</div>
          <button className="modal-close" onClick={handleClose}><i className="lni lni-close"></i></button>
        </div>
        <div className="g2">
          <div className="fg">
            <div className="lbl">Type <span className="req">*</span></div>
            <input
              className="ctrl font-mono uppercase"
              type="text"
              maxLength={10}
              value={type}
              onChange={e => { setType(e.target.value.toUpperCase()); clearError('type') }}
              style={errors.type ? { borderColor: 'var(--red)' } : undefined}
            />
            {errors.type && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.type}</p>}
          </div>
          <div className="fg">
            <div className="lbl">Condition <span className="req">*</span></div>
            <input
              className="ctrl"
              type="text"
              maxLength={100}
              value={condition}
              onChange={e => { setCondition(e.target.value); clearError('condition') }}
              style={errors.condition ? { borderColor: 'var(--red)' } : undefined}
            />
            {errors.condition && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.condition}</p>}
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-neu" onClick={handleClose}>Cancel</button>
          <button className="btn btn-primary" disabled={updateGenSet.isPending} onClick={handleSubmit}>
            <i className="lni lni-checkmark"></i> {updateGenSet.isPending ? 'Updating…' : 'Update General Setting'}
          </button>
        </div>
      </div>
    </div>
  )
}
