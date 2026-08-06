'use client'
import { useState } from 'react'
import { ModalProps } from '../types'
import { SuccessPopup } from './SuccessPopup'
import { FailurePopup } from './FailurePopup'
import { EnquirySourceMasterInput } from '@/lib/api/admission/enquirySourceMaster'

interface NewEnquirySourceMasterModalProps extends ModalProps {
  createEnquirySourceMaster: {
    mutate: (input: EnquirySourceMasterInput, options?: { onSuccess?: () => void; onError?: (error: Error) => void }) => void
    isPending: boolean
  }
}

export function NewEnquirySourceMasterModal({ isOpen, onClose, showToast, createEnquirySourceMaster }: NewEnquirySourceMasterModalProps) {
  const [saved, setSaved]                       = useState(false)
  const [failure, setFailure]                   = useState<string | null>(null)
  const [enquirySourceName, setEnquirySourceName] = useState('')
  const [errors, setErrors]                     = useState<Record<string, string>>({})

  if (!isOpen) return null

  function handleClose() {
    setSaved(false); setFailure(null); setEnquirySourceName(''); setErrors({})
    onClose()
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!enquirySourceName.trim()) e.enquirySourceName = 'Enquiry Source Name is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  if (saved) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <SuccessPopup title="Enquiry Source Added!" subtitle="The new enquiry source has been saved successfully." onClose={handleClose} />
        </div>
      </div>
    )
  }

  if (failure) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <FailurePopup title="Couldn't Add Enquiry Source" subtitle={failure} onClose={() => setFailure(null)} />
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay open" id="new-enquiry-source-master-modal">
      <div className="modal modal-md" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr modal-hdr-blue">
          <div className="modal-title"><i className="lni lni-volume"></i> Add Enquiry Source</div>
          <button className="modal-close" onClick={handleClose}><i className="lni lni-close"></i></button>
        </div>
        <div className="fg">
          <div className="lbl">Enquiry Source Name <span className="req">*</span></div>
          <input
            className="ctrl"
            type="text"
            placeholder="e.g. Social Media"
            value={enquirySourceName}
            onChange={e => { setEnquirySourceName(e.target.value); if (errors.enquirySourceName) setErrors(p => ({ ...p, enquirySourceName: '' })) }}
            style={errors.enquirySourceName ? { borderColor: 'var(--red)' } : undefined}
          />
          {errors.enquirySourceName && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.enquirySourceName}</p>}
        </div>
        <div className="modal-footer">
          <button className="btn btn-neu" onClick={handleClose}>Cancel</button>
          <button
            className="btn btn-primary"
            disabled={createEnquirySourceMaster.isPending}
            onClick={() => {
              if (!validate()) return
              createEnquirySourceMaster.mutate(
                { enquirySourceName },
                {
                  onSuccess: () => { setSaved(true); showToast('Enquiry source added successfully') },
                  onError: (error: Error) => setFailure(error.message || 'Failed to add enquiry source. Please try again.'),
                },
              )
            }}
          >
            <i className="lni lni-checkmark"></i> {createEnquirySourceMaster.isPending ? 'Adding…' : 'Add Enquiry Source'}
          </button>
        </div>
      </div>
    </div>
  )
}
