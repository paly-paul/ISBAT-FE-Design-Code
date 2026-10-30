'use client'
import { useState, useEffect } from 'react'
import { useCreateAssessmentType, useUpdateAssessmentTypeFee, useAssessmentType } from '@/hooks/assessment/useAssessmentTypes'
import { SuccessPopup } from '@/components/modals/shared/SuccessPopup'
import { scrollToFirstError } from '@/lib/scrollToFirstError'

interface Props {
  isOpen: boolean
  onClose: () => void
  showToast: (msg: string, type?: string) => void
  editingGuid?: string | null
}

const EMPTY = {
  assessmentCode: '',
  assessmentName: '',
  feeClearance: '',
  displayFeeClearance: ''
}

export function AssessmentTypeFormModal({ isOpen, onClose, showToast, editingGuid }: Props) {
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saved, setSaved] = useState(false)
  const isEditMode = !!editingGuid

  const createMut = useCreateAssessmentType()
  const updateMut = useUpdateAssessmentTypeFee()
  
  // Only fetch if in edit mode
  const { data: existingData, isLoading } = useAssessmentType(editingGuid || null, isOpen && isEditMode)

  useEffect(() => {
    if (isOpen) {
      if (isEditMode && existingData) {
        setForm({
          assessmentCode: existingData.assessmentCode || '',
          assessmentName: existingData.assessmentName || '',
          feeClearance: existingData.feeClearance?.toString() || '',
          displayFeeClearance: existingData.displayFeeClearance?.toString() || ''
        })
      } else if (!isEditMode) {
        setForm(EMPTY)
      }
      setErrors({})
    }
  }, [isOpen, isEditMode, existingData])

  if (!isOpen) return null

  if (saved) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <SuccessPopup 
            title={isEditMode ? "Fee Updated!" : "Assessment Saved!"} 
            subtitle={isEditMode ? "The fee clearance has been updated successfully." : "The new assessment type has been added to the master."} 
            onClose={handleClose} 
          />
        </div>
      </div>
    )
  }

  function set(key: keyof typeof EMPTY, value: string) {
    setForm(prev => ({ ...prev, [key]: value }))
    if (key === 'feeClearance' || key === 'displayFeeClearance') {
      if (value.trim() !== '' && (isNaN(Number(value)) || Number(value) <= 0)) {
        setErrors(prev => ({ ...prev, [key]: 'Fee must be greater than zero' }))
        return
      }
    }
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: '' }))
  }

  function handleClose() {
    setForm(EMPTY)
    setErrors({})
    setSaved(false)
    onClose()
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!isEditMode) {
      if (!form.assessmentCode.trim()) e.assessmentCode = 'Code is required'
      if (!form.assessmentName.trim()) e.assessmentName = 'Name is required'
    }

    // Both fee fields are mandatory and must be strictly greater than 0
    if (!form.feeClearance.trim()) {
      e.feeClearance = 'Please enter the fee clearance amount'
    } else if (isNaN(Number(form.feeClearance)) || Number(form.feeClearance) <= 0) {
      e.feeClearance = 'Fee must be greater than zero'
    }

    if (!form.displayFeeClearance.trim()) {
      e.displayFeeClearance = 'Please enter the actual fee clearance amount'
    } else if (isNaN(Number(form.displayFeeClearance)) || Number(form.displayFeeClearance) <= 0) {
      e.displayFeeClearance = 'Fee must be greater than zero'
    }

    setErrors(e)
    scrollToFirstError(e)
    return Object.keys(e).length === 0
  }

  async function handleSave() {
    if (!validate()) return

    try {
      const payloadFee = Number(form.feeClearance)
      const payloadDisplayFee = Number(form.displayFeeClearance)

      if (isEditMode && editingGuid) {
        // PUT only updates fees
        await updateMut.mutateAsync({
          guid: editingGuid,
          input: {
            feeClearance: payloadFee,
            displayFeeClearance: payloadDisplayFee
          }
        })
        setSaved(true)
      } else {
        // POST creates a new record
        await createMut.mutateAsync({
          assessmentCode: form.assessmentCode.trim(),
          assessmentName: form.assessmentName.trim(),
          feeClearance: payloadFee,
          displayFeeClearance: payloadDisplayFee
        })
        setSaved(true)
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to save', 'error')
    }
  }

  const isSaving = createMut.isPending || updateMut.isPending

  return (
    <div className="modal-overlay open">
      <div className="modal modal-md" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr modal-hdr-blue">
          <div className="modal-title">
            <i className="lni lni-notepad"></i> {isEditMode ? 'Update Fee Clearance' : 'New Assessment Type'}
          </div>
          <button className="modal-close" onClick={handleClose} disabled={isSaving}><i className="lni lni-close"></i></button>
        </div>

        <div className="p-4 relative">
          {isLoading && isEditMode && (
            <div className="absolute inset-0 bg-white/80 z-10 flex items-center justify-center">
              Loading...
            </div>
          )}

          <div className="g2">
            <div className="fg">
              <label className="lbl">Assessment Code { !isEditMode && <span className="req">*</span>}</label>
              <input className="ctrl font-mono" placeholder="e.g. ATT" 
                value={form.assessmentCode}
                onChange={e => set('assessmentCode', e.target.value)}
                disabled={isEditMode || isSaving}
                style={errors.assessmentCode ? { borderColor: 'var(--red)' } : undefined} />
              {errors.assessmentCode && <p className="field-err" style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.assessmentCode}</p>}
            </div>
            
            <div className="fg">
              <label className="lbl">Assessment Name { !isEditMode && <span className="req">*</span>}</label>
              <input className="ctrl" placeholder="e.g. Attendance" 
                value={form.assessmentName}
                onChange={e => set('assessmentName', e.target.value)}
                disabled={isEditMode || isSaving}
                style={errors.assessmentName ? { borderColor: 'var(--red)' } : undefined} />
              {errors.assessmentName && <p className="field-err" style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.assessmentName}</p>}
            </div>

            <div className="fg">
              <label className="lbl">Fee Clearance Amount <span className="req">*</span></label>
              <input className="ctrl" type="number" min="0.01" step="0.01" placeholder="e.g. 100.00" 
                value={form.feeClearance}
                onChange={e => set('feeClearance', e.target.value)}
                disabled={isSaving}
                style={errors.feeClearance ? { borderColor: 'var(--red)' } : undefined} />
              {errors.feeClearance && <p className="field-err" style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.feeClearance}</p>}
            </div>

            <div className="fg">
              <label className="lbl">Actual Fee Clearance <span className="req">*</span></label>
              <input className="ctrl" type="number" min="0.01" step="0.01" placeholder="e.g. 100.00" 
                value={form.displayFeeClearance}
                onChange={e => set('displayFeeClearance', e.target.value)}
                disabled={isSaving}
                style={errors.displayFeeClearance ? { borderColor: 'var(--red)' } : undefined} />
              {errors.displayFeeClearance && <p className="field-err" style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.displayFeeClearance}</p>}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn" onClick={handleClose} disabled={isSaving}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={isSaving}>
            <i className={isSaving ? "lni lni-spinner lni-spin" : "lni lni-save"}></i> 
            {isSaving ? ' Saving...' : (isEditMode ? ' Update Fees' : ' Save')}
          </button>
        </div>
      </div>
    </div>
  )
}
