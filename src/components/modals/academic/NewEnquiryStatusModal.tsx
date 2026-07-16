'use client'
import { useState } from 'react'
import { ModalProps } from '../types'
import { SuccessPopup } from './SuccessPopup'
import { FailurePopup } from './FailurePopup'
import { EnquiryStatusInput } from '@/lib/api/academic/enquiryStatus'

interface NewEnquiryStatusModalProps extends ModalProps {
  createEnquiryStatus: {
    mutate: (input: EnquiryStatusInput, options?: { onSuccess?: () => void; onError?: (error: Error) => void }) => void
    isPending: boolean
  }
}

export function NewEnquiryStatusModal({ isOpen, onClose, showToast, createEnquiryStatus }: NewEnquiryStatusModalProps) {
  const [saved, setSaved]                             = useState(false)
  const [failure, setFailure]                         = useState<string | null>(null)
  const [enquiryStatusCode, setEnquiryStatusCode]     = useState('')
  const [enquiryStatusName, setEnquiryStatusName]     = useState('')
  const [errors, setErrors]                           = useState<Record<string, string>>({})

  if (!isOpen) return null

  function handleClose() {
    setSaved(false); setFailure(null); setEnquiryStatusCode(''); setEnquiryStatusName(''); setErrors({})
    onClose()
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!enquiryStatusCode.trim()) e.enquiryStatusCode = 'Status Code is required'
    if (!enquiryStatusName.trim()) e.enquiryStatusName = 'Status Name is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  if (saved) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <SuccessPopup title="Enquiry Status Added!" subtitle="The new enquiry status has been saved successfully." onClose={handleClose} />
        </div>
      </div>
    )
  }

  if (failure) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <FailurePopup title="Couldn't Add Enquiry Status" subtitle={failure} onClose={() => setFailure(null)} />
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay open" id="new-enquiry-status-modal">
      <div className="modal modal-md" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr">
          <div className="modal-title"><i className="lni lni-flag"></i> Add Enquiry Status</div>
          <button className="modal-close" onClick={handleClose}><i className="lni lni-close"></i></button>
        </div>
        <div className="g2">
          <div className="fg">
            <div className="lbl">Status Code <span className="req">*</span></div>
            <input
              className="ctrl font-mono uppercase"
              type="text"
              placeholder="e.g. CA"
              maxLength={8}
              value={enquiryStatusCode}
              onChange={e => { setEnquiryStatusCode(e.target.value); if (errors.enquiryStatusCode) setErrors(p => ({ ...p, enquiryStatusCode: '' })) }}
              style={errors.enquiryStatusCode ? { borderColor: 'var(--red)' } : undefined}
            />
            {errors.enquiryStatusCode && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.enquiryStatusCode}</p>}
          </div>
          <div className="fg">
            <div className="lbl">Status Name <span className="req">*</span></div>
            <input
              className="ctrl"
              type="text"
              placeholder="e.g. Contact Attempted (CA)"
              value={enquiryStatusName}
              onChange={e => { setEnquiryStatusName(e.target.value); if (errors.enquiryStatusName) setErrors(p => ({ ...p, enquiryStatusName: '' })) }}
              style={errors.enquiryStatusName ? { borderColor: 'var(--red)' } : undefined}
            />
            {errors.enquiryStatusName && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.enquiryStatusName}</p>}
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-neu" onClick={handleClose}>Cancel</button>
          <button
            className="btn btn-primary"
            disabled={createEnquiryStatus.isPending}
            onClick={() => {
              if (!validate()) return
              createEnquiryStatus.mutate(
                { enquiryStatusCode, enquiryStatusName },
                {
                  onSuccess: () => { setSaved(true); showToast('Enquiry status added successfully') },
                  onError: (error: Error) => setFailure(error.message || 'Failed to add enquiry status. Please try again.'),
                },
              )
            }}
          >
            <i className="lni lni-checkmark"></i> {createEnquiryStatus.isPending ? 'Adding…' : 'Add Enquiry Status'}
          </button>
        </div>
      </div>
    </div>
  )
}
