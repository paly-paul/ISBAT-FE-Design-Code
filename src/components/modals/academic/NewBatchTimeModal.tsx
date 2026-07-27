'use client'
import { useState } from 'react'
import { ModalProps } from '../types'
import { SuccessPopup } from './SuccessPopup'
import { FailurePopup } from './FailurePopup'
import { BatchTimeInput } from '@/lib/api/academic/batchTime'

interface NewBatchTimeModalProps extends ModalProps {
  createBatchTime: {
    mutate: (input: BatchTimeInput, options?: { onSuccess?: () => void; onError?: (error: Error) => void }) => void
    isPending: boolean
  }
}

export function NewBatchTimeModal({ isOpen, onClose, showToast, createBatchTime }: NewBatchTimeModalProps) {
  const [saved, setSaved]             = useState(false)
  const [failure, setFailure]         = useState<string | null>(null)
  const [batchTime, setBatchTime]     = useState('')
  const [batchTimeCode, setBatchTimeCode] = useState('')
  const [errors, setErrors]           = useState<Record<string, string>>({})

  if (!isOpen) return null

  function handleClose() {
    setSaved(false); setFailure(null); setBatchTime(''); setBatchTimeCode(''); setErrors({})
    onClose()
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
          <SuccessPopup title="Batch Time Added!" subtitle="The new batch time has been saved successfully." onClose={handleClose} />
        </div>
      </div>
    )
  }

  if (failure) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <FailurePopup title="Couldn't Add Batch Time" subtitle={failure} onClose={() => setFailure(null)} />
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay open" id="new-batch-time-modal">
      <div className="modal modal-md" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr">
          <div className="modal-title"><i className="lni lni-timer"></i> Add Batch Time</div>
          <button className="modal-close" onClick={handleClose}><i className="lni lni-close"></i></button>
        </div>
        <div className="g2">
          <div className="fg">
            <div className="lbl">Batch Time <span className="req">*</span></div>
            <input
              className="ctrl"
              type="text"
              placeholder="e.g. Morning"
              maxLength={50}
              value={batchTime}
              onChange={e => { setBatchTime(e.target.value); if (errors.batchTime) setErrors(p => ({ ...p, batchTime: '' })) }}
              style={errors.batchTime ? { borderColor: 'var(--red)' } : undefined}
            />
            {errors.batchTime && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.batchTime}</p>}
          </div>
          <div className="fg">
            <div className="lbl">Batch Time Code <span className="req">*</span></div>
            <input
              className="ctrl font-mono uppercase"
              type="text"
              placeholder="e.g. MRN"
              maxLength={10}
              value={batchTimeCode}
              onChange={e => { setBatchTimeCode(e.target.value.toUpperCase()); if (errors.batchTimeCode) setErrors(p => ({ ...p, batchTimeCode: '' })) }}
              style={errors.batchTimeCode ? { borderColor: 'var(--red)' } : undefined}
            />
            {errors.batchTimeCode && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.batchTimeCode}</p>}
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-neu" onClick={handleClose}>Cancel</button>
          <button
            className="btn btn-primary"
            disabled={createBatchTime.isPending}
            onClick={() => {
              if (!validate()) return
              createBatchTime.mutate(
                { batchTime, batchTimeCode },
                {
                  onSuccess: () => { setSaved(true); showToast('Batch time added successfully') },
                  onError: (error: Error) => setFailure(error.message || 'Failed to add batch time. Please try again.'),
                },
              )
            }}
          >
            <i className="lni lni-checkmark"></i> {createBatchTime.isPending ? 'Adding…' : 'Add Batch Time'}
          </button>
        </div>
      </div>
    </div>
  )
}
