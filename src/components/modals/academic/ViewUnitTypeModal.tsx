'use client'
import { useEffect, useState } from 'react'
import { ModalProps } from '../types'
import { SuccessPopup } from './SuccessPopup'
import { FailurePopup } from './FailurePopup'
import { UnitTypeInput } from '@/lib/api/academic/unitType'
import { useUnitType } from '@/hooks/config/useUnitTypes'
import { AuthError } from '@/lib/api/client'

interface ViewUnitTypeModalProps extends ModalProps {
  unitTypeGuid: string | null
  onEdit: () => void
}

export function ViewUnitTypeModal({ isOpen, onClose, showToast, unitTypeGuid, onEdit }: ViewUnitTypeModalProps) {
  const { data: unitType, isLoading, isError, error } = useUnitType(unitTypeGuid, isOpen)

  const [saved, setSaved]               = useState(false)
  const [failure, setFailure]           = useState<string | null>(null)
  const [unitTypeName, setUnitTypeName] = useState('')
  const [errors, setErrors]             = useState<Record<string, string>>({})

  // Fill the form when the selected unit type loads.
  useEffect(() => {
    if (!isOpen || !unitType) return
    setUnitTypeName(unitType.unitTypeName)
    setErrors({})
  }, [isOpen, unitType])

  if (!isOpen) return null

  function handleClose() { setSaved(false); setFailure(null); setErrors({}); onClose() }

  function clearError(field: string) {
    setErrors(prev => (prev[field] ? { ...prev, [field]: '' } : prev))
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
          <SuccessPopup title="Unit Type Updated!" subtitle="Your changes have been saved successfully." onClose={handleClose} />
        </div>
      </div>
    )
  }

  if (failure) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <FailurePopup title="Couldn't Update Unit Type" subtitle={failure} onClose={() => setFailure(null)} />
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <FailurePopup
            title="Couldn't Load Unit Type"
            subtitle={error instanceof AuthError ? (error.message || 'Failed to load unit type details.') : 'Failed to load unit type details.'}
            onClose={handleClose}
          />
        </div>
      </div>
    )
  }

  if (isLoading || !unitType) {
    return (
      <div className="modal-overlay open" id="view-unit-type-modal">
        <div className="modal modal-md" onClick={e => e.stopPropagation()}>
          <div className="modal-hdr modal-hdr-blue">
            <div className="modal-title"><i className="lni lni-eye"></i> View Unit Type</div>
            <button className="modal-close" onClick={handleClose}><i className="lni lni-close"></i></button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 180 }}>
            <span style={{ color: 'var(--g400)' }}>Loading unit type details…</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay open" id="edit-unit-type-modal">
      <div className="modal modal-md" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr modal-hdr-blue">
          <div className="modal-title"><i className="lni lni-pencil"></i> Edit Unit Type</div>
          <button className="modal-close" onClick={handleClose}><i className="lni lni-close"></i></button>
        </div>
        <div className="fg">
          <div className="lbl">Unit Type Name </div>
          <div className="val">{unitTypeName || '—'}</div>
          {errors.unitTypeName && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.unitTypeName}</p>}
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
