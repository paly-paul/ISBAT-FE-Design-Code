'use client'
import { useEffect, useState } from 'react'
import { ModalProps } from '../types'
import { SuccessPopup } from '../academic/SuccessPopup'
import { FailurePopup } from '../academic/FailurePopup'
import { CooperateInput } from '@/lib/api/finance/cooperate'
import { useCooperate } from '@/hooks/finance/useCooperates'
import { AuthError } from '@/lib/api/client'

interface EditCooperateModalProps extends ModalProps {
  cooperateGuid: string | null
  updateCooperate: {
    mutate: (variables: { guid: string; input: CooperateInput }, options?: { onSuccess?: () => void; onError?: (error: Error) => void }) => void
    isPending: boolean
  }
}

export function EditCooperateModal({ isOpen, onClose, showToast, cooperateGuid, updateCooperate }: EditCooperateModalProps) {
  const { data: cooperate, isLoading, isError, error } = useCooperate(cooperateGuid, isOpen)

  const [saved, setSaved]                 = useState(false)
  const [failure, setFailure]             = useState<string | null>(null)
  const [cooperateCode, setCooperateCode] = useState('')
  const [cooperateName, setCooperateName] = useState('')
  const [errors, setErrors]               = useState<Record<string, string>>({})

  // Prefill the form once the cooperate has loaded. Re-runs whenever a
  // different guid is fetched (react-query resets `cooperate` to undefined
  // when cooperateGuid changes, so stale data never leaks between edits).
  useEffect(() => {
    if (!isOpen || !cooperate) return
    setCooperateCode(cooperate.cooperateCode)
    setCooperateName(cooperate.cooperateName)
    setErrors({})
  }, [isOpen, cooperate])

  if (!isOpen) return null

  function handleClose() { setSaved(false); setFailure(null); setErrors({}); onClose() }

  function clearError(field: string) {
    setErrors(prev => (prev[field] ? { ...prev, [field]: '' } : prev))
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!cooperateCode.trim()) e.cooperateCode = 'Cooperate Code is required'
    if (!cooperateName.trim()) e.cooperateName = 'Cooperate Name is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit() {
    if (!cooperateGuid || !validate()) return
    updateCooperate.mutate(
      { guid: cooperateGuid, input: { cooperateCode, cooperateName } },
      {
        onSuccess: () => { setSaved(true); showToast('Cooperate updated successfully') },
        onError: (error: Error) => setFailure(error.message || 'Failed to update cooperate. Please try again.'),
      },
    )
  }

  if (saved) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <SuccessPopup title="Cooperate Updated!" subtitle="Your changes have been saved successfully." onClose={handleClose} />
        </div>
      </div>
    )
  }

  if (failure) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <FailurePopup title="Couldn't Update Cooperate" subtitle={failure} onClose={() => setFailure(null)} />
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <FailurePopup
            title="Couldn't Load Cooperate"
            subtitle={error instanceof AuthError ? (error.message || 'Failed to load cooperate details.') : 'Failed to load cooperate details.'}
            onClose={handleClose}
          />
        </div>
      </div>
    )
  }

  if (isLoading || !cooperate) {
    return (
      <div className="modal-overlay open" id="edit-cooperate-modal">
        <div className="modal modal-md" onClick={e => e.stopPropagation()}>
          <div className="modal-hdr">
            <div className="modal-title"><i className="lni lni-pencil"></i> Edit Cooperate</div>
            <button className="modal-close" onClick={handleClose}><i className="lni lni-close"></i></button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 180 }}>
            <span style={{ color: 'var(--g400)' }}>Loading cooperate details…</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay open" id="edit-cooperate-modal">
      <div className="modal modal-md" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr">
          <div className="modal-title"><i className="lni lni-pencil"></i> Edit Cooperate</div>
          <button className="modal-close" onClick={handleClose}><i className="lni lni-close"></i></button>
        </div>
        <div className="g2">
          <div className="fg">
            <div className="lbl">Cooperate Code <span className="req">*</span></div>
            <input
              className="ctrl font-mono uppercase"
              type="text"
              value={cooperateCode}
              onChange={e => { setCooperateCode(e.target.value.toUpperCase()); clearError('cooperateCode') }}
              style={errors.cooperateCode ? { borderColor: 'var(--red)' } : undefined}
            />
            {errors.cooperateCode && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.cooperateCode}</p>}
          </div>
          <div className="fg">
            <div className="lbl">Cooperate Name <span className="req">*</span></div>
            <input
              className="ctrl"
              type="text"
              value={cooperateName}
              onChange={e => { setCooperateName(e.target.value); clearError('cooperateName') }}
              style={errors.cooperateName ? { borderColor: 'var(--red)' } : undefined}
            />
            {errors.cooperateName && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.cooperateName}</p>}
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-neu" onClick={handleClose}>Cancel</button>
          <button className="btn btn-primary" disabled={updateCooperate.isPending} onClick={handleSubmit}>
            <i className="lni lni-checkmark"></i> {updateCooperate.isPending ? 'Updating…' : 'Update Cooperate'}
          </button>
        </div>
      </div>
    </div>
  )
}
