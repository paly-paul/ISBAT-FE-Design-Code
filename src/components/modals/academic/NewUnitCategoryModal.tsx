'use client'
import { useState } from 'react'
import { ModalProps } from '../types'
import { SuccessPopup } from './SuccessPopup'
import { FailurePopup } from './FailurePopup'
import { UnitCategoryInput } from '@/lib/api/academic/unitCategory'

interface NewUnitCategoryModalProps extends ModalProps {
  createUnitCategory: {
    mutate: (input: UnitCategoryInput, options?: { onSuccess?: () => void; onError?: (error: Error) => void }) => void
    isPending: boolean
  }
}

export function NewUnitCategoryModal({ isOpen, onClose, showToast, createUnitCategory }: NewUnitCategoryModalProps) {
  const [saved, setSaved]           = useState(false)
  const [failure, setFailure]       = useState<string | null>(null)
  const [unitCatName, setUnitCatName] = useState('')
  const [errors, setErrors]         = useState<Record<string, string>>({})

  if (!isOpen) return null

  function handleClose() {
    setSaved(false); setFailure(null); setUnitCatName(''); setErrors({})
    onClose()
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
          <SuccessPopup title="Unit Category Added!" subtitle="The new unit category has been saved successfully." onClose={handleClose} />
        </div>
      </div>
    )
  }

  if (failure) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <FailurePopup title="Couldn't Add Unit Category" subtitle={failure} onClose={() => setFailure(null)} />
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay open" id="new-unit-category-modal">
      <div className="modal modal-md" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr">
          <div className="modal-title"><i className="lni lni-tag"></i> Add Unit Category</div>
          <button className="modal-close" onClick={handleClose}><i className="lni lni-close"></i></button>
        </div>
        <div className="fg">
          <div className="lbl">Unit Category Name <span className="req">*</span></div>
          <input
            className="ctrl"
            type="text"
            placeholder="e.g. Elective"
            value={unitCatName}
            onChange={e => { setUnitCatName(e.target.value); if (errors.unitCatName) setErrors(p => ({ ...p, unitCatName: '' })) }}
            style={errors.unitCatName ? { borderColor: 'var(--red)' } : undefined}
          />
          {errors.unitCatName && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.unitCatName}</p>}
        </div>
        <div className="modal-footer">
          <button className="btn btn-neu" onClick={handleClose}>Cancel</button>
          <button
            className="btn btn-primary"
            disabled={createUnitCategory.isPending}
            onClick={() => {
              if (!validate()) return
              createUnitCategory.mutate(
                { unitCatName },
                {
                  onSuccess: () => { setSaved(true); showToast('Unit category added successfully') },
                  onError: (error: Error) => setFailure(error.message || 'Failed to add unit category. Please try again.'),
                },
              )
            }}
          >
            <i className="lni lni-checkmark"></i> {createUnitCategory.isPending ? 'Adding…' : 'Add Unit Category'}
          </button>
        </div>
      </div>
    </div>
  )
}
