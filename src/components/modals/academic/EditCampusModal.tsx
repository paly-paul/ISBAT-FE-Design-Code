'use client'
import { useEffect, useState } from 'react'
import { ModalProps } from '../types'
import { SuccessPopup } from './SuccessPopup'
import { FailurePopup } from './FailurePopup'
import { Campus, CampusInput } from '@/lib/api/academic/campus'
import { AuthError } from '@/lib/api/client'

interface EditCampusModalProps extends ModalProps {
  campus: Campus | null
  updateCampus: {
    mutate: (variables: { id: string; input: CampusInput }, options?: { onSuccess?: () => void; onError?: (error: Error) => void }) => void
    isPending: boolean
  }
}

export function EditCampusModal({ isOpen, onClose, showToast, campus, updateCampus }: EditCampusModalProps) {
  const [saved, setSaved]     = useState(false)
  const [failure, setFailure] = useState<string | null>(null)
  const [campusCode, setCampusCode] = useState('')
  const [campusName, setCampusName] = useState('')
  const [location, setLocation] = useState('')
  const [address, setAddress] = useState('')
  const [contact, setContact] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (isOpen && campus) {
      setCampusCode(campus.campusCode)
      setCampusName(campus.campusName)
      setLocation(campus.location)
      setAddress(campus.address ?? '')
      setContact(campus.contact ?? '')
      setErrors({})
    }
  }, [isOpen, campus])

  if (!isOpen || !campus) return null

  function handleClose() { setSaved(false); setFailure(null); onClose() }

  function validate() {
    const e: Record<string, string> = {}
    if (!campusCode.trim()) e.campusCode = 'Campus Code is required'
    if (!campusName.trim()) e.campusName = 'Campus Name is required'
    if (!location.trim())   e.location   = 'Location is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit() {
    if (!campus || !validate()) return
    updateCampus.mutate(
      {
        id: campus.campusGuid,
        input: {
          campusCode,
          campusName,
          location,
          address: address.trim() ? address.trim() : '',
          contact: contact.trim() ? contact.trim() : '',
        },
      },
      {
        onSuccess: () => { setSaved(true); showToast('Campus updated successfully') },
        onError: (error: Error) => {
          // A missing record usually means the campus was deleted while the modal was open.
          const notFound = error instanceof AuthError && error.code === 'not_found'
          setFailure(notFound ? 'This campus no longer exists — it may have been deleted.' : (error.message || 'Failed to update campus. Please try again.'))
        },
      },
    )
  }

  if (saved) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <SuccessPopup title="Campus Updated!" subtitle="Your changes have been saved successfully." onClose={handleClose} />
        </div>
      </div>
    )
  }

  if (failure) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <FailurePopup title="Couldn't Update Campus" subtitle={failure} onClose={() => setFailure(null)} />
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay open" id="edit-campus-modal">
      <div className="modal modal-md" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr">
          <div className="modal-title"><i className="lni lni-pencil"></i> Edit Campus</div>
          <button className="modal-close" onClick={handleClose}><i className="lni lni-close"></i></button>
        </div>
        <div className="g2">
          <div className="fg">
            <div className="lbl">Campus Code <span className="req">*</span></div>
            <input
              className="ctrl font-mono uppercase"
              type="text"
              maxLength={6}
              value={campusCode}
              onChange={e => { setCampusCode(e.target.value); if (errors.campusCode) setErrors(p => ({ ...p, campusCode: '' })) }}
              style={errors.campusCode ? { borderColor: 'var(--red)' } : undefined}
            />
            {errors.campusCode && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.campusCode}</p>}
          </div>
          <div className="fg">
            <div className="lbl">Campus Name <span className="req">*</span></div>
            <input
              className="ctrl"
              type="text"
              value={campusName}
              onChange={e => { setCampusName(e.target.value); if (errors.campusName) setErrors(p => ({ ...p, campusName: '' })) }}
              style={errors.campusName ? { borderColor: 'var(--red)' } : undefined}
            />
            {errors.campusName && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.campusName}</p>}
          </div>
          <div className="fg span2">
            <div className="lbl">Location <span className="req">*</span></div>
            <input
              className="ctrl"
              type="text"
              value={location}
              onChange={e => { setLocation(e.target.value); if (errors.location) setErrors(p => ({ ...p, location: '' })) }}
              style={errors.location ? { borderColor: 'var(--red)' } : undefined}
            />
            {errors.location && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.location}</p>}
          </div>
          <div className="fg span2">
            <div className="lbl">Address</div>
            <input
              className="ctrl"
              type="text"
              value={address}
              onChange={e => setAddress(e.target.value)}
            />
          </div>
          <div className="fg span2">
            <div className="lbl">Contact</div>
            <input
              className="ctrl"
              type="tel"
              inputMode="numeric"
              value={contact}
              onChange={e => setContact(e.target.value.replace(/[^0-9+\s-]/g, ''))}
            />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-neu" onClick={handleClose}>Cancel</button>
          <button className="btn btn-primary" disabled={updateCampus.isPending} onClick={handleSubmit}>
            <i className="lni lni-checkmark"></i> {updateCampus.isPending ? 'Updating…' : 'Update Campus'}
          </button>
        </div>
      </div>
    </div>
  )
}
