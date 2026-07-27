'use client'
import { useEffect, useState } from 'react'
import { ModalProps } from '../types'
import { SuccessPopup } from './SuccessPopup'
import { FailurePopup } from './FailurePopup'
import { EnquirySourceInput } from '@/lib/api/admission/enquirySource'
import { useEnquirySource } from '@/hooks/admission/useEnquirySources'
import { AuthError } from '@/lib/api/client'

interface EditEnquirySourceModalProps extends ModalProps {
  isbatSourceGuid: string | null
  updateEnquirySource: {
    mutate: (variables: { guid: string; input: EnquirySourceInput }, options?: { onSuccess?: () => void; onError?: (error: Error) => void }) => void
    isPending: boolean
  }
}

export function EditEnquirySourceModal({ isOpen, onClose, showToast, isbatSourceGuid, updateEnquirySource }: EditEnquirySourceModalProps) {
  const { data: source, isLoading, isError, error } = useEnquirySource(isbatSourceGuid, isOpen)

  const [saved, setSaved]           = useState(false)
  const [failure, setFailure]       = useState<string | null>(null)
  const [sourceName, setSourceName] = useState('')
  const [errors, setErrors]         = useState<Record<string, string>>({})

  // Prefill the form once the source has loaded. Re-runs whenever a
  // different guid is fetched (react-query resets `source` to undefined
  // when isbatSourceGuid changes, so stale data never leaks between edits).
  useEffect(() => {
    if (!isOpen || !source) return
    setSourceName(source.sourceName)
    setErrors({})
  }, [isOpen, source])

  if (!isOpen) return null

  function handleClose() { setSaved(false); setFailure(null); setErrors({}); onClose() }

  function clearError(field: string) {
    setErrors(prev => (prev[field] ? { ...prev, [field]: '' } : prev))
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!sourceName.trim()) e.sourceName = 'Source Name is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit() {
    if (!isbatSourceGuid || !validate()) return
    updateEnquirySource.mutate(
      { guid: isbatSourceGuid, input: { sourceName } },
      {
        onSuccess: () => { setSaved(true); showToast('Isbat enquiry source updated successfully') },
        onError: (error: Error) => setFailure(error.message || 'Failed to update Isbat enquiry source. Please try again.'),
      },
    )
  }

  if (saved) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <SuccessPopup title="Isbat Enquiry Source Updated!" subtitle="Your changes have been saved successfully." onClose={handleClose} />
        </div>
      </div>
    )
  }

  if (failure) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <FailurePopup title="Couldn't Update Isbat Enquiry Source" subtitle={failure} onClose={() => setFailure(null)} />
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <FailurePopup
            title="Couldn't Load Isbat Enquiry Source"
            subtitle={error instanceof AuthError ? (error.message || 'Failed to load Isbat enquiry source details.') : 'Failed to load Isbat enquiry source details.'}
            onClose={handleClose}
          />
        </div>
      </div>
    )
  }

  if (isLoading || !source) {
    return (
      <div className="modal-overlay open" id="edit-enquiry-source-modal">
        <div className="modal modal-md" onClick={e => e.stopPropagation()}>
          <div className="modal-hdr">
            <div className="modal-title"><i className="lni lni-pencil"></i> Edit Isbat Enquiry Source</div>
            <button className="modal-close" onClick={handleClose}><i className="lni lni-close"></i></button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 180 }}>
            <span style={{ color: 'var(--g400)' }}>Loading Isbat enquiry source details…</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay open" id="edit-enquiry-source-modal">
      <div className="modal modal-md" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr">
          <div className="modal-title"><i className="lni lni-pencil"></i> Edit Isbat Enquiry Source</div>
          <button className="modal-close" onClick={handleClose}><i className="lni lni-close"></i></button>
        </div>
        <div className="fg">
          <div className="lbl">Source Name <span className="req">*</span></div>
          <input
            className="ctrl"
            type="text"
            value={sourceName}
            onChange={e => { setSourceName(e.target.value); clearError('sourceName') }}
            style={errors.sourceName ? { borderColor: 'var(--red)' } : undefined}
          />
          {errors.sourceName && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.sourceName}</p>}
        </div>
        <div className="modal-footer">
          <button className="btn btn-neu" onClick={handleClose}>Cancel</button>
          <button className="btn btn-primary" disabled={updateEnquirySource.isPending} onClick={handleSubmit}>
            <i className="lni lni-checkmark"></i> {updateEnquirySource.isPending ? 'Updating…' : 'Update Isbat Enquiry Source'}
          </button>
        </div>
      </div>
    </div>
  )
}
