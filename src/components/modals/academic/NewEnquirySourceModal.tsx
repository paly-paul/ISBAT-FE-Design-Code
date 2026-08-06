'use client'
import { useState } from 'react'
import { ModalProps } from '../types'
import { SuccessPopup } from './SuccessPopup'
import { FailurePopup } from './FailurePopup'
import { EnquirySourceInput } from '@/lib/api/admission/enquirySource'

interface NewEnquirySourceModalProps extends ModalProps {
  createEnquirySource: {
    mutate: (input: EnquirySourceInput, options?: { onSuccess?: () => void; onError?: (error: Error) => void }) => void
    isPending: boolean
  }
}

export function NewEnquirySourceModal({ isOpen, onClose, showToast, createEnquirySource }: NewEnquirySourceModalProps) {
  const [saved, setSaved]         = useState(false)
  const [failure, setFailure]     = useState<string | null>(null)
  const [sourceName, setSourceName] = useState('')
  const [errors, setErrors]       = useState<Record<string, string>>({})

  if (!isOpen) return null

  function handleClose() {
    setSaved(false); setFailure(null); setSourceName(''); setErrors({})
    onClose()
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!sourceName.trim()) e.sourceName = 'Source Name is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  if (saved) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <SuccessPopup title="Isbat Enquiry Source Added!" subtitle="The new Isbat enquiry source has been saved successfully." onClose={handleClose} />
        </div>
      </div>
    )
  }

  if (failure) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <FailurePopup title="Couldn't Add Isbat Enquiry Source" subtitle={failure} onClose={() => setFailure(null)} />
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay open" id="new-enquiry-source-modal">
      <div className="modal modal-md" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr modal-hdr-blue">
          <div className="modal-title"><i className="lni lni-compass"></i> Add Isbat Enquiry Source</div>
          <button className="modal-close" onClick={handleClose}><i className="lni lni-close"></i></button>
        </div>
        <div className="fg">
          <div className="lbl">Source Name <span className="req">*</span></div>
          <input
            className="ctrl"
            type="text"
            placeholder="e.g. Open Day"
            value={sourceName}
            onChange={e => { setSourceName(e.target.value); if (errors.sourceName) setErrors(p => ({ ...p, sourceName: '' })) }}
            style={errors.sourceName ? { borderColor: 'var(--red)' } : undefined}
          />
          {errors.sourceName && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.sourceName}</p>}
        </div>
        <div className="modal-footer">
          <button className="btn btn-neu" onClick={handleClose}>Cancel</button>
          <button
            className="btn btn-primary"
            disabled={createEnquirySource.isPending}
            onClick={() => {
              if (!validate()) return
              createEnquirySource.mutate(
                { sourceName },
                {
                  onSuccess: () => { setSaved(true); showToast('Isbat enquiry source added successfully') },
                  onError: (error: Error) => setFailure(error.message || 'Failed to add Isbat enquiry source. Please try again.'),
                },
              )
            }}
          >
            <i className="lni lni-checkmark"></i> {createEnquirySource.isPending ? 'Adding…' : 'Add Isbat Enquiry Source'}
          </button>
        </div>
      </div>
    </div>
  )
}
