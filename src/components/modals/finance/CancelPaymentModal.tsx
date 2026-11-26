'use client'
import { useState } from 'react'
import { ModalProps } from '../types'
import { CANCEL_REASON_MAX } from '@/lib/api/finance/paymentCancel'

export interface CancelPaymentTarget {
  // Shown in the title line, e.g. "Receipt R-1042 · 450,000 UGX".
  label: string
}

interface CancelPaymentModalProps extends Omit<ModalProps, 'isOpen'> {
  target: CancelPaymentTarget | null
  isPending: boolean
  // Resolves on success; rejects with the server's message on a refusal.
  onConfirm: (reason: string) => Promise<unknown>
}

// Shared by every cancel route (tuition, other, NCHE, guild, advance deposit,
// advance adjustment). Asks for the reason the backend requires (trimmed,
// 1–200 characters). A refusal (400 with a plain message, e.g. "the resit
// exam has already started") is shown as-is inside the dialog, so the
// cashier can read it without losing the typed reason.
export function CancelPaymentModal({ target, onClose, showToast, isPending, onConfirm }: CancelPaymentModalProps) {
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)

  if (!target) return null

  function handleClose() {
    if (isPending) return
    setReason('')
    setError(null)
    onClose()
  }

  async function handleConfirm() {
    const trimmed = reason.trim()
    if (!trimmed) { setError('Please enter a reason for cancelling.'); return }
    setError(null)
    try {
      await onConfirm(trimmed)
      showToast('Payment cancelled.', 'success')
      setReason('')
      onClose()
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : 'Failed to cancel the payment. Please try again.')
    }
  }

  return (
    <div className="modal-overlay open">
      <div className="modal modal-md" role="dialog" aria-modal="true" aria-labelledby="cancel-payment-title" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr">
          <div className="modal-title" id="cancel-payment-title"><i className="lni lni-ban"></i> Cancel Payment</div>
          <button className="modal-close" onClick={handleClose} aria-label="Close"><i className="lni lni-close"></i></button>
        </div>
        <div>
          <p className="mb-[10px]"><strong>{target.label}</strong></p>
          <div className="flex items-start gap-2 p-3 rounded-lg mb-[14px]" style={{ background: 'var(--amber-bg)', border: '1px solid var(--amber-bd)', fontSize: 13, color: 'var(--g700)' }}>
            <i className="lni lni-warning text-clr-amber" style={{ marginTop: 2 }}></i>
            <span>Cancelling recalculates this student&apos;s later payments.</span>
          </div>
          <div className="fg">
            <label className="lbl" htmlFor="cancel-payment-reason">Reason <span className="req">*</span></label>
            <textarea
              id="cancel-payment-reason"
              className="ctrl"
              rows={3}
              maxLength={CANCEL_REASON_MAX}
              placeholder="e.g. Entered against the wrong student"
              value={reason}
              aria-invalid={!!error}
              onChange={e => { setReason(e.target.value); setError(null) }}
            />
            <div className="flex justify-between mt-1" style={{ fontSize: 11 }}>
              <span style={{ color: 'var(--red)' }} role={error ? 'alert' : undefined}>{error}</span>
              <span className="text-g400">{reason.length}/{CANCEL_REASON_MAX}</span>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-neu" disabled={isPending} onClick={handleClose}>Keep Payment</button>
          <button className="btn btn-danger" disabled={isPending || !reason.trim()} onClick={handleConfirm}>
            <i className="lni lni-ban"></i> {isPending ? 'Cancelling…' : 'Cancel Payment'}
          </button>
        </div>
      </div>
    </div>
  )
}
