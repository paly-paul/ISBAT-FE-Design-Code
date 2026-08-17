'use client'
import { useEffect, useState } from 'react'
import { ModalProps } from '../types'
import { SuccessPopup } from './SuccessPopup'
import { FailurePopup } from './FailurePopup'
import { Country, CountryInput } from '@/lib/api/academic/country'
import { AuthError } from '@/lib/api/client'

interface ViewCountryModalProps extends ModalProps {
  country: Country | null
  onEdit: () => void
}

export function ViewCountryModal({ isOpen, onClose, showToast, country, onEdit }: ViewCountryModalProps) {
  const [saved, setSaved] = useState(false)
  const [failure, setFailure] = useState<string | null>(null)
  const [countryCode, setCountryCode] = useState('')
  const [countryName, setCountryName] = useState('')
  const [nationality, setNationality] = useState('')
  const [countryPrefix, setCountryPrefix] = useState('')
  const [defaultCountry, setDefaultCountry] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (isOpen && country) {
      setCountryCode(country.countryCode)
      setCountryName(country.countryName)
      setNationality(country.nationality)
      setCountryPrefix(country.countryPrefix)
      setDefaultCountry(country.defaultCountry === 1)
      setErrors({})
    }
  }, [isOpen, country])

  if (!isOpen || !country) return null

  function handleClose() { setSaved(false); setFailure(null); onClose() }

  // Keep validation close to the form so errors show up early.
  function validate() {
    const e: Record<string, string> = {}
    if (!countryCode.trim())        e.countryCode   = 'Country Code is required'
    else if (countryCode.trim().length > 10) e.countryCode = 'Country Code must be 10 characters or fewer'
    if (!countryName.trim())        e.countryName   = 'Country Name is required'
    else if (countryName.trim().length > 100) e.countryName = 'Country Name must be 100 characters or fewer'
    if (!nationality.trim())        e.nationality   = 'Nationality is required'
    else if (nationality.trim().length > 100) e.nationality = 'Nationality must be 100 characters or fewer'
    if (!countryPrefix.trim())      e.countryPrefix = 'Dial Prefix is required'
    else if (countryPrefix.trim().length > 10) e.countryPrefix = 'Dial Prefix must be 10 characters or fewer'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  // Show field-level errors when the cause is clear, otherwise use the popup.
  function handleUpdateError(error: Error) {
    const code = error instanceof AuthError ? error.code : undefined
    if (code === 'bad_request') {
      setErrors(prev => ({ ...prev, countryCode: error.message || 'A country with this code already exists.' }))
      return
    }
    setFailure(error.message || 'Failed to update country. Please try again.')
  }

  if (saved) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <SuccessPopup title="Country Updated!" subtitle="Your changes have been saved successfully." onClose={handleClose} />
        </div>
      </div>
    )
  }

  if (failure) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <FailurePopup title="Couldn't Update Country" subtitle={failure} onClose={() => setFailure(null)} />
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay open" id="view-country-modal">
      <div className="modal modal-md" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr modal-hdr-blue">
          <div className="modal-title"><i className="lni lni-eye"></i> View Country</div>
          <button className="modal-close" onClick={handleClose}><i className="lni lni-close"></i></button>
        </div>
        <div className="g3">
          <div className="fg">
            <div className="lbl">Country Code </div>
            <div className="val font-mono uppercase">{countryCode || '—'}</div>
            {errors.countryCode && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.countryCode}</p>}
          </div>
          <div className="fg">
            <div className="lbl">Dial Prefix </div>
            <div className="val">{countryPrefix || '—'}</div>
            {errors.countryPrefix && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.countryPrefix}</p>}
          </div>
          <div className="fg">
            <div className="lbl">Country Name </div>
            <div className="val">{countryName || '—'}</div>
            {errors.countryName && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.countryName}</p>}
          </div>
          <div className="fg">
            <div className="lbl">Nationality </div>
            <div className="val">{nationality || '—'}</div>
            {errors.nationality && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.nationality}</p>}
          </div>
          <div className="fg">
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginTop: 4 }}>
              <div className="val">{defaultCountry ? 'Yes' : 'No'}</div>
              <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--g700)', fontWeight: 500 }}>Set as default country</span>
            </label>
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
