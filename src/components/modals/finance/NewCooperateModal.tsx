'use client'
import { useState } from 'react'
import { ModalProps } from '../types'
import { SuccessPopup } from '../academic/SuccessPopup'
import { FailurePopup } from '../academic/FailurePopup'
import { CooperateInput } from '@/lib/api/finance/cooperate'

interface NewCooperateModalProps extends ModalProps {
  createCooperate: {
    mutate: (input: CooperateInput, options?: { onSuccess?: () => void; onError?: (error: Error) => void }) => void
    isPending: boolean
  }
}

export function NewCooperateModal({ isOpen, onClose, showToast, createCooperate }: NewCooperateModalProps) {
  const [saved, setSaved]                 = useState(false)
  const [failure, setFailure]             = useState<string | null>(null)
  const [cooperateCode, setCooperateCode] = useState('')
  const [cooperateName, setCooperateName] = useState('')
  const [errors, setErrors]               = useState<Record<string, string>>({})

  if (!isOpen) return null

  function handleClose() {
    setSaved(false); setFailure(null); setCooperateCode(''); setCooperateName(''); setErrors({})
    onClose()
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!cooperateCode.trim()) e.cooperateCode = 'Cooperate Code is required'
    if (!cooperateName.trim()) e.cooperateName = 'Cooperate Name is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  if (saved) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <SuccessPopup title="Cooperate Added!" subtitle="The new cooperate has been saved successfully." onClose={handleClose} />
        </div>
      </div>
    )
  }

  if (failure) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <FailurePopup title="Couldn't Add Cooperate" subtitle={failure} onClose={() => setFailure(null)} />
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay open" id="new-cooperate-modal">
      <div className="modal modal-md" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr modal-hdr-blue">
          <div className="modal-title"><i className="lni lni-handshake"></i> Add Cooperate</div>
          <button className="modal-close" onClick={handleClose}><i className="lni lni-close"></i></button>
        </div>
        <div className="g2">
          <div className="fg">
            <div className="lbl">Cooperate Code <span className="req">*</span></div>
            <input
              className="ctrl font-mono uppercase"
              type="text"
              placeholder="e.g. CO-001"
              value={cooperateCode}
              onChange={e => { setCooperateCode(e.target.value.toUpperCase()); if (errors.cooperateCode) setErrors(p => ({ ...p, cooperateCode: '' })) }}
              style={errors.cooperateCode ? { borderColor: 'var(--red)' } : undefined}
            />
            {errors.cooperateCode && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.cooperateCode}</p>}
          </div>
          <div className="fg">
            <div className="lbl">Cooperate Name <span className="req">*</span></div>
            <input
              className="ctrl"
              type="text"
              placeholder="e.g. SYBYL"
              value={cooperateName}
              onChange={e => { setCooperateName(e.target.value); if (errors.cooperateName) setErrors(p => ({ ...p, cooperateName: '' })) }}
              style={errors.cooperateName ? { borderColor: 'var(--red)' } : undefined}
            />
            {errors.cooperateName && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.cooperateName}</p>}
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-neu" onClick={handleClose}>Cancel</button>
          <button
            className="btn btn-primary"
            disabled={createCooperate.isPending}
            onClick={() => {
              if (!validate()) return
              createCooperate.mutate(
                { cooperateCode, cooperateName },
                {
                  onSuccess: () => { setSaved(true); showToast('Cooperate added successfully') },
                  onError: (error: Error) => setFailure(error.message || 'Failed to add cooperate. Please try again.'),
                },
              )
            }}
          >
            <i className="lni lni-checkmark"></i> {createCooperate.isPending ? 'Adding…' : 'Add Cooperate'}
          </button>
        </div>
      </div>
    </div>
  )
}
