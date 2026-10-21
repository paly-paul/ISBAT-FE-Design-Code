'use client'
import { useState } from 'react'
import { ModalProps } from '../types'
import { SuccessPopup } from '../shared/SuccessPopup'
import { FailurePopup } from '../shared/FailurePopup'
import { useRevertApplicationRejection } from '@/hooks/admission/useVetting'
import { VettingRejectionItem } from '@/lib/api/admission/vetting'

// "—" for null, blank, or the literal string "null".
function orDash(value: string | null | undefined): string {
  const v = value?.trim()
  return v && v.toLowerCase() !== 'null' ? v : '—'
}

interface Props extends ModalProps {
  rejection: VettingRejectionItem | null
}

// POST .../revert-rejection clears the stored reason, date and registrar, so
// the reason is shown here one last time before it's gone.
export function RevertRejectionModal({ isOpen, onClose, showToast, rejection }: Props) {
  const revert = useRevertApplicationRejection()
  const [saved, setSaved]     = useState(false)
  const [failure, setFailure] = useState<string | null>(null)

  if (!isOpen || !rejection) return null

  function handleClose() { setSaved(false); setFailure(null); onClose() }

  function handleConfirm() {
    if (!rejection) return
    revert.mutate(rejection.applicationGuid, {
      onSuccess: () => { setSaved(true); showToast('Rejection reverted — application is back in the vetting queue.', 'success') },
      onError: (err: Error) => setFailure(err.message || 'Failed to revert the rejection.'),
    })
  }

  if (saved) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <SuccessPopup title="Rejection Reverted" subtitle={`${rejection.studentName}'s application is back in the Vetting Queue.`} onClose={handleClose} />
        </div>
      </div>
    )
  }

  if (failure) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <FailurePopup title="Couldn't Revert Rejection" subtitle={failure} onClose={handleClose} />
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay open">
      <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr modal-hdr-blue">
          <div className="modal-title"><i className="lni lni-reload"></i> Revert Rejection</div>
          <button className="modal-close" onClick={handleClose}><i className="lni lni-close"></i></button>
        </div>

        {/* One wrapper: .modal only pads its direct <div> children. */}
        <div>
          <p className="text-sm text-g700 mb-4" style={{ lineHeight: 1.55 }}>
            Send <strong className="text-g800">{orDash(rejection.studentName)}</strong> <span className="font-mono text-g500">({orDash(rejection.appRefNo)})</span> back to the Vetting Queue as a pending application?
          </p>

          <div className="fg mb-4">
            <label className="lbl">Current Rejection Reason</label>
            <div className="ctrl text-sm" style={{ height: 'auto', whiteSpace: 'normal', lineHeight: 1.5 }}>{orDash(rejection.rejectionReason)}</div>
          </div>

          <div className="warn-box">
            <i className="lni lni-warning" style={{ marginTop: 2 }}></i>
            <span>The rejection reason, date and registrar will be cleared. Note the reason down first if you need to keep it.</span>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-neu" onClick={handleClose}>Cancel</button>
          <button className="btn btn-primary" disabled={revert.isPending} onClick={handleConfirm}>
            <i className="lni lni-reload"></i> {revert.isPending ? 'Reverting…' : 'Revert to Queue'}
          </button>
        </div>
      </div>
    </div>
  )
}
