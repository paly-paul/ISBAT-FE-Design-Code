'use client'
import { useState } from 'react'
import { ModalProps } from '../types'
import { SuccessPopup } from './SuccessPopup'
import { FailurePopup } from './FailurePopup'
import { UnitTypeInput } from '@/lib/api/academic/unitType'

interface NewUnitTypeModalProps extends ModalProps {
  createUnitType: {
    mutate: (input: UnitTypeInput, options?: { onSuccess?: () => void; onError?: (error: Error) => void }) => void
    isPending: boolean
  }
}

export function NewUnitTypeModal({ isOpen, onClose, showToast, createUnitType }: NewUnitTypeModalProps) {
  const [saved, setSaved]           = useState(false)
  const [failure, setFailure]       = useState<string | null>(null)
  const [unitTypeName, setUnitTypeName] = useState('')
  const [errors, setErrors]         = useState<Record<string, string>>({})

  if (!isOpen) return null

  function handleClose() {
    setSaved(false); setFailure(null); setUnitTypeName(''); setErrors({})
    onClose()
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!unitTypeName.trim()) e.unitTypeName = 'Unit Type Name is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  if (saved) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <SuccessPopup title="Unit Type Added!" subtitle="The new unit type has been saved successfully." onClose={handleClose} />
        </div>
      </div>
    )
  }

  if (failure) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <FailurePopup title="Couldn't Add Unit Type" subtitle={failure} onClose={() => setFailure(null)} />
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay open" id="new-unit-type-modal">
      <div className="modal modal-md" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr">
          <div className="modal-title"><i className="lni lni-tag"></i> Add Unit Type</div>
          <button className="modal-close" onClick={handleClose}><i className="lni lni-close"></i></button>
        </div>
        <div className="fg">
          <div className="lbl">Unit Type Name <span className="req">*</span></div>
          <input
            className="ctrl"
            type="text"
            placeholder="e.g. Theory"
            value={unitTypeName}
            onChange={e => { setUnitTypeName(e.target.value); if (errors.unitTypeName) setErrors(p => ({ ...p, unitTypeName: '' })) }}
            style={errors.unitTypeName ? { borderColor: 'var(--red)' } : undefined}
          />
          {errors.unitTypeName && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.unitTypeName}</p>}
        </div>
        <div className="modal-footer">
          <button className="btn btn-neu" onClick={handleClose}>Cancel</button>
          <button
            className="btn btn-primary"
            disabled={createUnitType.isPending}
            onClick={() => {
              if (!validate()) return
              createUnitType.mutate(
                { unitTypeName },
                {
                  onSuccess: () => { setSaved(true); showToast('Unit type added successfully') },
                  onError: (error: Error) => setFailure(error.message || 'Failed to add unit type. Please try again.'),
                },
              )
            }}
          >
            <i className="lni lni-checkmark"></i> {createUnitType.isPending ? 'Adding…' : 'Add Unit Type'}
          </button>
        </div>
      </div>
    </div>
  )
}
