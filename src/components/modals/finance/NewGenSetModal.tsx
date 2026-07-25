'use client'
import { useState } from 'react'
import { ModalProps } from '../types'
import { SuccessPopup } from '../academic/SuccessPopup'
import { FailurePopup } from '../academic/FailurePopup'
import { GenSetInput } from '@/lib/api/finance/genSet'

interface NewGenSetModalProps extends ModalProps {
  createGenSet: {
    mutate: (input: GenSetInput, options?: { onSuccess?: () => void; onError?: (error: Error) => void }) => void
    isPending: boolean
  }
}

export function NewGenSetModal({ isOpen, onClose, showToast, createGenSet }: NewGenSetModalProps) {
  const [saved, setSaved]         = useState(false)
  const [failure, setFailure]     = useState<string | null>(null)
  const [type, setType]           = useState('')
  const [condition, setCondition] = useState('')
  const [errors, setErrors]       = useState<Record<string, string>>({})

  if (!isOpen) return null

  function handleClose() {
    setSaved(false); setFailure(null); setType(''); setCondition(''); setErrors({})
    onClose()
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!type.trim()) e.type = 'Type is required'
    if (!condition.trim()) e.condition = 'Condition is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  if (saved) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <SuccessPopup title="General Setting Added!" subtitle="The new general setting has been saved successfully." onClose={handleClose} />
        </div>
      </div>
    )
  }

  if (failure) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <FailurePopup title="Couldn't Add General Setting" subtitle={failure} onClose={() => setFailure(null)} />
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay open" id="new-genset-modal">
      <div className="modal modal-md" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr">
          <div className="modal-title"><i className="lni lni-cog"></i> Add General Setting</div>
          <button className="modal-close" onClick={handleClose}><i className="lni lni-close"></i></button>
        </div>
        <div className="g2">
          <div className="fg">
            <div className="lbl">Type <span className="req">*</span></div>
            <input
              className="ctrl font-mono uppercase"
              type="text"
              placeholder="e.g. CCY"
              maxLength={10}
              value={type}
              onChange={e => { setType(e.target.value.toUpperCase()); if (errors.type) setErrors(p => ({ ...p, type: '' })) }}
              style={errors.type ? { borderColor: 'var(--red)' } : undefined}
            />
            {errors.type && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.type}</p>}
          </div>
          <div className="fg">
            <div className="lbl">Condition <span className="req">*</span></div>
            <input
              className="ctrl"
              type="text"
              placeholder="e.g. UGX"
              maxLength={100}
              value={condition}
              onChange={e => { setCondition(e.target.value); if (errors.condition) setErrors(p => ({ ...p, condition: '' })) }}
              style={errors.condition ? { borderColor: 'var(--red)' } : undefined}
            />
            {errors.condition && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.condition}</p>}
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-neu" onClick={handleClose}>Cancel</button>
          <button
            className="btn btn-primary"
            disabled={createGenSet.isPending}
            onClick={() => {
              if (!validate()) return
              createGenSet.mutate(
                { type, condition },
                {
                  onSuccess: () => { setSaved(true); showToast('General setting added successfully') },
                  onError: (error: Error) => setFailure(error.message || 'Failed to add general setting. Please try again.'),
                },
              )
            }}
          >
            <i className="lni lni-checkmark"></i> {createGenSet.isPending ? 'Adding…' : 'Add General Setting'}
          </button>
        </div>
      </div>
    </div>
  )
}
