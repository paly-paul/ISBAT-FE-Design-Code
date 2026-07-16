'use client'
import { useEffect, useState } from 'react'
import { ModalProps } from '../types'
import { SuccessPopup } from './SuccessPopup'
import { FailurePopup } from './FailurePopup'
import { EnquiryStatusInput } from '@/lib/api/academic/enquiryStatus'
import { useEnquiryStatus } from '@/hooks/config/useEnquiryStatuses'
import { AuthError } from '@/lib/api/client'

interface EditEnquiryStatusModalProps extends ModalProps {
  enquiryStatusGuid: string | null
  updateEnquiryStatus: {
    mutate: (variables: { guid: string; input: EnquiryStatusInput }, options?: { onSuccess?: () => void; onError?: (error: Error) => void }) => void
    isPending: boolean
  }
}

export function EditEnquiryStatusModal({ isOpen, onClose, showToast, enquiryStatusGuid, updateEnquiryStatus }: EditEnquiryStatusModalProps) {
  const { data: enquiryStatus, isLoading, isError, error } = useEnquiryStatus(enquiryStatusGuid, isOpen)

  const [saved, setSaved]                         = useState(false)
  const [failure, setFailure]                     = useState<string | null>(null)
  const [enquiryStatusCode, setEnquiryStatusCode] = useState('')
  const [enquiryStatusName, setEnquiryStatusName] = useState('')
  const [errors, setErrors]                       = useState<Record<string, string>>({})

  // Prefill the form once the enquiry status has loaded. Re-runs whenever a
  // different guid is fetched (react-query resets `enquiryStatus` to
  // undefined when enquiryStatusGuid changes, so stale data never leaks
  // between edits).
  useEffect(() => {
    if (!isOpen || !enquiryStatus) return
    setEnquiryStatusCode(enquiryStatus.enquiryStatusCode)
    setEnquiryStatusName(enquiryStatus.enquiryStatusName)
    setErrors({})
  }, [isOpen, enquiryStatus])

  if (!isOpen) return null

  function handleClose() { setSaved(false); setFailure(null); setErrors({}); onClose() }

  function clearError(field: string) {
    setErrors(prev => (prev[field] ? { ...prev, [field]: '' } : prev))
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!enquiryStatusCode.trim()) e.enquiryStatusCode = 'Status Code is required'
    if (!enquiryStatusName.trim()) e.enquiryStatusName = 'Status Name is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit() {
    if (!enquiryStatusGuid || !validate()) return
    updateEnquiryStatus.mutate(
      { guid: enquiryStatusGuid, input: { enquiryStatusCode, enquiryStatusName } },
      {
        onSuccess: () => { setSaved(true); showToast('Enquiry status updated successfully') },
        onError: (error: Error) => setFailure(error.message || 'Failed to update enquiry status. Please try again.'),
      },
    )
  }

  if (saved) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <SuccessPopup title="Enquiry Status Updated!" subtitle="Your changes have been saved successfully." onClose={handleClose} />
        </div>
      </div>
    )
  }

  if (failure) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <FailurePopup title="Couldn't Update Enquiry Status" subtitle={failure} onClose={() => setFailure(null)} />
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <FailurePopup
            title="Couldn't Load Enquiry Status"
            subtitle={error instanceof AuthError ? (error.message || 'Failed to load enquiry status details.') : 'Failed to load enquiry status details.'}
            onClose={handleClose}
          />
        </div>
      </div>
    )
  }

  if (isLoading || !enquiryStatus) {
    return (
      <div className="modal-overlay open" id="edit-enquiry-status-modal">
        <div className="modal modal-md" onClick={e => e.stopPropagation()}>
          <div className="modal-hdr">
            <div className="modal-title"><i className="lni lni-pencil"></i> Edit Enquiry Status</div>
            <button className="modal-close" onClick={handleClose}><i className="lni lni-close"></i></button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 180 }}>
            <span style={{ color: 'var(--g400)' }}>Loading enquiry status details…</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay open" id="edit-enquiry-status-modal">
      <div className="modal modal-md" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr">
          <div className="modal-title"><i className="lni lni-pencil"></i> Edit Enquiry Status</div>
          <button className="modal-close" onClick={handleClose}><i className="lni lni-close"></i></button>
        </div>
        <div className="g2">
          <div className="fg">
            <div className="lbl">Status Code <span className="req">*</span></div>
            <input
              className="ctrl font-mono uppercase"
              type="text"
              maxLength={8}
              value={enquiryStatusCode}
              onChange={e => { setEnquiryStatusCode(e.target.value); clearError('enquiryStatusCode') }}
              style={errors.enquiryStatusCode ? { borderColor: 'var(--red)' } : undefined}
            />
            {errors.enquiryStatusCode && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.enquiryStatusCode}</p>}
          </div>
          <div className="fg">
            <div className="lbl">Status Name <span className="req">*</span></div>
            <input
              className="ctrl"
              type="text"
              value={enquiryStatusName}
              onChange={e => { setEnquiryStatusName(e.target.value); clearError('enquiryStatusName') }}
              style={errors.enquiryStatusName ? { borderColor: 'var(--red)' } : undefined}
            />
            {errors.enquiryStatusName && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.enquiryStatusName}</p>}
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-neu" onClick={handleClose}>Cancel</button>
          <button className="btn btn-primary" disabled={updateEnquiryStatus.isPending} onClick={handleSubmit}>
            <i className="lni lni-checkmark"></i> {updateEnquiryStatus.isPending ? 'Updating…' : 'Update Enquiry Status'}
          </button>
        </div>
      </div>
    </div>
  )
}
