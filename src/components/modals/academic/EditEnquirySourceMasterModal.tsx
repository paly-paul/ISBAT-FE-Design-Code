'use client'
import { useEffect, useState } from 'react'
import { ModalProps } from '../types'
import { SuccessPopup } from './SuccessPopup'
import { FailurePopup } from './FailurePopup'
import { EnquirySourceMasterInput } from '@/lib/api/admission/enquirySourceMaster'
import { useEnquirySourceMaster } from '@/hooks/admission/useEnquirySourceMasters'
import { AuthError } from '@/lib/api/client'

interface EditEnquirySourceMasterModalProps extends ModalProps {
  enquirySourceGuid: string | null
  updateEnquirySourceMaster: {
    mutate: (variables: { guid: string; input: EnquirySourceMasterInput }, options?: { onSuccess?: () => void; onError?: (error: Error) => void }) => void
    isPending: boolean
  }
}

export function EditEnquirySourceMasterModal({ isOpen, onClose, showToast, enquirySourceGuid, updateEnquirySourceMaster }: EditEnquirySourceMasterModalProps) {
  const { data: source, isLoading, isError, error } = useEnquirySourceMaster(enquirySourceGuid, isOpen)

  const [saved, setSaved]                         = useState(false)
  const [failure, setFailure]                     = useState<string | null>(null)
  const [enquirySourceName, setEnquirySourceName] = useState('')
  const [errors, setErrors]                       = useState<Record<string, string>>({})

  // Prefill the form once the source has loaded. Re-runs whenever a
  // different guid is fetched (react-query resets `source` to undefined
  // when enquirySourceGuid changes, so stale data never leaks between edits).
  useEffect(() => {
    if (!isOpen || !source) return
    setEnquirySourceName(source.enquirySourceName)
    setErrors({})
  }, [isOpen, source])

  if (!isOpen) return null

  function handleClose() { setSaved(false); setFailure(null); setErrors({}); onClose() }

  function clearError(field: string) {
    setErrors(prev => (prev[field] ? { ...prev, [field]: '' } : prev))
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!enquirySourceName.trim()) e.enquirySourceName = 'Enquiry Source Name is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit() {
    if (!enquirySourceGuid || !validate()) return
    updateEnquirySourceMaster.mutate(
      { guid: enquirySourceGuid, input: { enquirySourceName } },
      {
        onSuccess: () => { setSaved(true); showToast('Enquiry source updated successfully') },
        onError: (error: Error) => setFailure(error.message || 'Failed to update enquiry source. Please try again.'),
      },
    )
  }

  if (saved) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <SuccessPopup title="Enquiry Source Updated!" subtitle="Your changes have been saved successfully." onClose={handleClose} />
        </div>
      </div>
    )
  }

  if (failure) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <FailurePopup title="Couldn't Update Enquiry Source" subtitle={failure} onClose={() => setFailure(null)} />
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <FailurePopup
            title="Couldn't Load Enquiry Source"
            subtitle={error instanceof AuthError ? (error.message || 'Failed to load enquiry source details.') : 'Failed to load enquiry source details.'}
            onClose={handleClose}
          />
        </div>
      </div>
    )
  }

  if (isLoading || !source) {
    return (
      <div className="modal-overlay open" id="edit-enquiry-source-master-modal">
        <div className="modal modal-md" onClick={e => e.stopPropagation()}>
          <div className="modal-hdr">
            <div className="modal-title"><i className="lni lni-pencil"></i> Edit Enquiry Source</div>
            <button className="modal-close" onClick={handleClose}><i className="lni lni-close"></i></button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 180 }}>
            <span style={{ color: 'var(--g400)' }}>Loading enquiry source details…</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay open" id="edit-enquiry-source-master-modal">
      <div className="modal modal-md" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr">
          <div className="modal-title"><i className="lni lni-pencil"></i> Edit Enquiry Source</div>
          <button className="modal-close" onClick={handleClose}><i className="lni lni-close"></i></button>
        </div>
        <div className="fg">
          <div className="lbl">Enquiry Source Name <span className="req">*</span></div>
          <input
            className="ctrl"
            type="text"
            value={enquirySourceName}
            onChange={e => { setEnquirySourceName(e.target.value); clearError('enquirySourceName') }}
            style={errors.enquirySourceName ? { borderColor: 'var(--red)' } : undefined}
          />
          {errors.enquirySourceName && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.enquirySourceName}</p>}
        </div>
        <div className="modal-footer">
          <button className="btn btn-neu" onClick={handleClose}>Cancel</button>
          <button className="btn btn-primary" disabled={updateEnquirySourceMaster.isPending} onClick={handleSubmit}>
            <i className="lni lni-checkmark"></i> {updateEnquirySourceMaster.isPending ? 'Updating…' : 'Update Enquiry Source'}
          </button>
        </div>
      </div>
    </div>
  )
}
