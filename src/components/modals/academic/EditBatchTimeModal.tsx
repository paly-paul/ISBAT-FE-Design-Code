'use client'
import { useEffect, useState } from 'react'
import { ModalProps } from '../types'
import { SuccessPopup } from './SuccessPopup'
import { FailurePopup } from './FailurePopup'
import { BatchTimeInput } from '@/lib/api/academic/batchTime'
import { useBatchTime } from '@/hooks/config/useBatchTimes'
import { AuthError } from '@/lib/api/client'

interface EditBatchTimeModalProps extends ModalProps {
  batchTimeGuid: string | null
  updateBatchTime: {
    mutate: (variables: { guid: string; input: BatchTimeInput }, options?: { onSuccess?: () => void; onError?: (error: Error) => void }) => void
    isPending: boolean
  }
}

export function EditBatchTimeModal({ isOpen, onClose, showToast, batchTimeGuid, updateBatchTime }: EditBatchTimeModalProps) {
  const { data: batchTimeRecord, isLoading, isError, error } = useBatchTime(batchTimeGuid, isOpen)

  const [saved, setSaved]             = useState(false)
  const [failure, setFailure]         = useState<string | null>(null)
  const [batchTime, setBatchTime]     = useState('')
  const [batchTimeCode, setBatchTimeCode] = useState('')
  const [errors, setErrors]           = useState<Record<string, string>>({})

  // Fill the form when the selected batch time loads.
  useEffect(() => {
    if (!isOpen || !batchTimeRecord) return
    setBatchTime(batchTimeRecord.batchTime)
    setBatchTimeCode(batchTimeRecord.batchTimeCode)
    setErrors({})
  }, [isOpen, batchTimeRecord])

  if (!isOpen) return null

  function handleClose() { setSaved(false); setFailure(null); setErrors({}); onClose() }

  function clearError(field: string) {
    setErrors(prev => (prev[field] ? { ...prev, [field]: '' } : prev))
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!batchTime.trim()) e.batchTime = 'Batch Time is required'
    if (!batchTimeCode.trim()) e.batchTimeCode = 'Batch Time Code is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit() {
    if (!batchTimeGuid || !validate()) return
    updateBatchTime.mutate(
      { guid: batchTimeGuid, input: { batchTime, batchTimeCode } },
      {
        onSuccess: () => { setSaved(true); showToast('Batch time updated successfully') },
        onError: (error: Error) => setFailure(error.message || 'Failed to update batch time. Please try again.'),
      },
    )
  }

  if (saved) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <SuccessPopup title="Batch Time Updated!" subtitle="Your changes have been saved successfully." onClose={handleClose} />
        </div>
      </div>
    )
  }

  if (failure) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <FailurePopup title="Couldn't Update Batch Time" subtitle={failure} onClose={() => setFailure(null)} />
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <FailurePopup
            title="Couldn't Load Batch Time"
            subtitle={error instanceof AuthError ? (error.message || 'Failed to load batch time details.') : 'Failed to load batch time details.'}
            onClose={handleClose}
          />
        </div>
      </div>
    )
  }

  if (isLoading || !batchTimeRecord) {
    return (
      <div className="modal-overlay open" id="edit-batch-time-modal">
        <div className="modal modal-md" onClick={e => e.stopPropagation()}>
          <div className="modal-hdr">
            <div className="modal-title"><i className="lni lni-pencil"></i> Edit Batch Time</div>
            <button className="modal-close" onClick={handleClose}><i className="lni lni-close"></i></button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 180 }}>
            <span style={{ color: 'var(--g400)' }}>Loading batch time details…</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay open" id="edit-batch-time-modal">
      <div className="modal modal-md" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr">
          <div className="modal-title"><i className="lni lni-pencil"></i> Edit Batch Time</div>
          <button className="modal-close" onClick={handleClose}><i className="lni lni-close"></i></button>
        </div>
        <div className="g2">
          <div className="fg">
            <div className="lbl">Batch Time <span className="req">*</span></div>
            <input
              className="ctrl"
              type="text"
              maxLength={50}
              value={batchTime}
              onChange={e => { setBatchTime(e.target.value); clearError('batchTime') }}
              style={errors.batchTime ? { borderColor: 'var(--red)' } : undefined}
            />
            {errors.batchTime && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.batchTime}</p>}
          </div>
          <div className="fg">
            <div className="lbl">Batch Time Code <span className="req">*</span></div>
            <input
              className="ctrl font-mono uppercase"
              type="text"
              maxLength={10}
              value={batchTimeCode}
              onChange={e => { setBatchTimeCode(e.target.value.toUpperCase()); clearError('batchTimeCode') }}
              style={errors.batchTimeCode ? { borderColor: 'var(--red)' } : undefined}
            />
            {errors.batchTimeCode && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.batchTimeCode}</p>}
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-neu" onClick={handleClose}>Cancel</button>
          <button className="btn btn-primary" disabled={updateBatchTime.isPending} onClick={handleSubmit}>
            <i className="lni lni-checkmark"></i> {updateBatchTime.isPending ? 'Updating…' : 'Update Batch Time'}
          </button>
        </div>
      </div>
    </div>
  )
}
