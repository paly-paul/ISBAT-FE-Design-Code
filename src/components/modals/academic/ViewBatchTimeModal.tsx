'use client'
import { useEffect, useState } from 'react'
import { ModalProps } from '../types'
import { SuccessPopup } from './SuccessPopup'
import { FailurePopup } from './FailurePopup'
import { BatchTimeInput } from '@/lib/api/academic/batchTime'
import { useBatchTime } from '@/hooks/config/useBatchTimes'
import { AuthError } from '@/lib/api/client'

interface ViewBatchTimeModalProps extends ModalProps {
  batchTimeGuid: string | null
  onEdit: () => void
}

export function ViewBatchTimeModal({ isOpen, onClose, showToast, batchTimeGuid, onEdit }: ViewBatchTimeModalProps) {
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
      <div className="modal-overlay open" id="view-batch-time-modal">
        <div className="modal modal-md" onClick={e => e.stopPropagation()}>
          <div className="modal-hdr modal-hdr-blue">
            <div className="modal-title"><i className="lni lni-eye"></i> View Batch Time</div>
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
        <div className="modal-hdr modal-hdr-blue">
          <div className="modal-title"><i className="lni lni-pencil"></i> Edit Batch Time</div>
          <button className="modal-close" onClick={handleClose}><i className="lni lni-close"></i></button>
        </div>
        <div className="g3">
          <div className="fg">
            <div className="lbl">Batch Time </div>
            <div className="val">{batchTime || '—'}</div>
            {errors.batchTime && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.batchTime}</p>}
          </div>
          <div className="fg">
            <div className="lbl">Batch Time Code </div>
            <div className="val font-mono uppercase">{batchTimeCode || '—'}</div>
            {errors.batchTimeCode && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.batchTimeCode}</p>}
          </div>
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
