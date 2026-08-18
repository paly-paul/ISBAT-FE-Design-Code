'use client'
import { useEffect, useState } from 'react'
import { ModalProps } from '../types'
import { SuccessPopup } from './SuccessPopup'
import { FailurePopup } from './FailurePopup'
import { Campus, CampusInput } from '@/lib/api/academic/campus'
import { AuthError } from '@/lib/api/client'

interface ViewCampusModalProps extends ModalProps {
  campus: Campus | null
  onEdit: () => void
}

export function ViewCampusModal({ isOpen, onClose, showToast, campus, onEdit }: ViewCampusModalProps) {
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
    <div className="modal-overlay open" id="view-campus-modal">
      <div className="modal modal-md" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr modal-hdr-blue">
          <div className="modal-title"><i className="lni lni-eye"></i> View Campus</div>
          <button className="modal-close" onClick={handleClose}><i className="lni lni-close"></i></button>
        </div>
        <div className="g3">
          <div className="fg">
            <div className="lbl">Campus Code </div>
            <div className="val font-mono uppercase">{campusCode || '—'}</div>
            {errors.campusCode && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.campusCode}</p>}
          </div>
          <div className="fg">
            <div className="lbl">Campus Name </div>
            <div className="val">{campusName || '—'}</div>
            {errors.campusName && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.campusName}</p>}
          </div>
          <div className="fg">
            <div className="lbl">Location </div>
            <div className="val">{location || '—'}</div>
            {errors.location && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.location}</p>}
          </div>
          <div className="fg">
            <div className="lbl">Address</div>
            <div className="val">{address || '—'}</div>
          </div>
          <div className="fg">
            <div className="lbl">Contact</div>
            <div className="val">{contact || '—'}</div>
          </div>
        </div>
        <div className="modal-footer">
          <span className="flex-1"></span>
          <button className="btn btn-neu" onClick={onEdit} style={{ marginRight: 8 }}>
            <i className="lni lni-pencil"></i> Edit
          </button>
          <button className="btn btn-primary" onClick={handleClose}>Close</button>
        </div>
      </div>
    </div>
  )
}
