'use client'
import { useEffect, useState } from 'react'
import { ModalProps } from '../types'
import { SuccessPopup } from './SuccessPopup'
import { FailurePopup } from './FailurePopup'
import { UnitCategoryInput } from '@/lib/api/academic/unitCategory'
import { useUnitCategory } from '@/hooks/config/useUnitCategories'
import { AuthError } from '@/lib/api/client'

interface ViewUnitCategoryModalProps extends ModalProps {
  unitCatGuid: string | null
  onEdit: () => void
}

export function ViewUnitCategoryModal({ isOpen, onClose, showToast, unitCatGuid, onEdit }: ViewUnitCategoryModalProps) {
  const { data: unitCategory, isLoading, isError, error } = useUnitCategory(unitCatGuid, isOpen)

  const [saved, setSaved]             = useState(false)
  const [failure, setFailure]         = useState<string | null>(null)
  const [unitCatName, setUnitCatName] = useState('')
  const [errors, setErrors]           = useState<Record<string, string>>({})

  // Fill the form when the selected unit category loads.
  useEffect(() => {
    if (!isOpen || !unitCategory) return
    setUnitCatName(unitCategory.unitCatName)
    setErrors({})
  }, [isOpen, unitCategory])

  if (!isOpen) return null

  function handleClose() { setSaved(false); setFailure(null); setErrors({}); onClose() }

  function clearError(field: string) {
    setErrors(prev => (prev[field] ? { ...prev, [field]: '' } : prev))
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!unitCatName.trim()) e.unitCatName = 'Unit Category Name is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  if (saved) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <SuccessPopup title="Unit Category Updated!" subtitle="Your changes have been saved successfully." onClose={handleClose} />
        </div>
      </div>
    )
  }

  if (failure) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <FailurePopup title="Couldn't Update Unit Category" subtitle={failure} onClose={() => setFailure(null)} />
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <FailurePopup
            title="Couldn't Load Unit Category"
            subtitle={error instanceof AuthError ? (error.message || 'Failed to load unit category details.') : 'Failed to load unit category details.'}
            onClose={handleClose}
          />
        </div>
      </div>
    )
  }

  if (isLoading || !unitCategory) {
    return (
      <div className="modal-overlay open" id="view-unit-category-modal">
        <div className="modal modal-md" onClick={e => e.stopPropagation()}>
          <div className="modal-hdr modal-hdr-blue">
            <div className="modal-title"><i className="lni lni-eye"></i> View Unit Category</div>
            <button className="modal-close" onClick={handleClose}><i className="lni lni-close"></i></button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 180 }}>
            <span style={{ color: 'var(--g400)' }}>Loading unit category details…</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay open" id="edit-unit-category-modal">
      <div className="modal modal-md" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr modal-hdr-blue">
          <div className="modal-title"><i className="lni lni-pencil"></i> Edit Unit Category</div>
          <button className="modal-close" onClick={handleClose}><i className="lni lni-close"></i></button>
        </div>
        <div className="fg">
          <div className="lbl">Unit Category Name </div>
          <div className="val">{unitCatName || '—'}</div>
          {errors.unitCatName && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.unitCatName}</p>}
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
