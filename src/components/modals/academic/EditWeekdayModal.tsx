'use client'
import { useEffect, useState } from 'react'
import { ModalProps } from '../types'
import { SuccessPopup } from './SuccessPopup'
import { FailurePopup } from './FailurePopup'
import { WeekdayInput } from '@/lib/api/academic/weekday'
import { useWeekday } from '@/hooks/config/useWeekdays'
import { AuthError } from '@/lib/api/client'

interface EditWeekdayModalProps extends ModalProps {
  weekDayGuid: string | null
  updateWeekday: {
    mutate: (variables: { guid: string; input: WeekdayInput }, options?: { onSuccess?: () => void; onError?: (error: Error) => void }) => void
    isPending: boolean
  }
}

export function EditWeekdayModal({ isOpen, onClose, showToast, weekDayGuid, updateWeekday }: EditWeekdayModalProps) {
  const { data: weekday, isLoading, isError, error } = useWeekday(weekDayGuid, isOpen)

  const [saved, setSaved]     = useState(false)
  const [failure, setFailure] = useState<string | null>(null)
  const [dayCode, setDayCode] = useState('')
  const [dayName, setDayName] = useState('')
  const [errors, setErrors]   = useState<Record<string, string>>({})

  // Fill the form when the selected weekday loads.
  useEffect(() => {
    if (!isOpen || !weekday) return
    setDayCode(weekday.dayCode)
    setDayName(weekday.dayName)
    setErrors({})
  }, [isOpen, weekday])

  if (!isOpen) return null

  function handleClose() { setSaved(false); setFailure(null); setErrors({}); onClose() }

  function clearError(field: string) {
    setErrors(prev => (prev[field] ? { ...prev, [field]: '' } : prev))
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!dayCode.trim()) e.dayCode = 'Day Code is required'
    if (!dayName.trim()) e.dayName = 'Day Name is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit() {
    if (!weekDayGuid || !validate()) return
    updateWeekday.mutate(
      { guid: weekDayGuid, input: { dayCode, dayName } },
      {
        onSuccess: () => { setSaved(true); showToast('Weekday updated successfully') },
        onError: (error: Error) => setFailure(error.message || 'Failed to update weekday. Please try again.'),
      },
    )
  }

  if (saved) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <SuccessPopup title="Weekday Updated!" subtitle="Your changes have been saved successfully." onClose={handleClose} />
        </div>
      </div>
    )
  }

  if (failure) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <FailurePopup title="Couldn't Update Weekday" subtitle={failure} onClose={() => setFailure(null)} />
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <FailurePopup
            title="Couldn't Load Weekday"
            subtitle={error instanceof AuthError ? (error.message || 'Failed to load weekday details.') : 'Failed to load weekday details.'}
            onClose={handleClose}
          />
        </div>
      </div>
    )
  }

  if (isLoading || !weekday) {
    return (
      <div className="modal-overlay open" id="edit-weekday-modal">
        <div className="modal modal-md" onClick={e => e.stopPropagation()}>
          <div className="modal-hdr modal-hdr-blue">
            <div className="modal-title"><i className="lni lni-pencil"></i> Edit Weekday</div>
            <button className="modal-close" onClick={handleClose}><i className="lni lni-close"></i></button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 180 }}>
            <span style={{ color: 'var(--g400)' }}>Loading weekday details…</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay open" id="edit-weekday-modal">
      <div className="modal modal-md" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr modal-hdr-blue">
          <div className="modal-title"><i className="lni lni-pencil"></i> Edit Weekday</div>
          <button className="modal-close" onClick={handleClose}><i className="lni lni-close"></i></button>
        </div>
        <div className="g2">
          <div className="fg">
            <div className="lbl">Day Code <span className="req">*</span></div>
            <input
              className="ctrl font-mono uppercase"
              type="text"
              maxLength={8}
              value={dayCode}
              onChange={e => { setDayCode(e.target.value.toUpperCase()); clearError('dayCode') }}
              style={errors.dayCode ? { borderColor: 'var(--red)' } : undefined}
            />
            {errors.dayCode && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.dayCode}</p>}
          </div>
          <div className="fg">
            <div className="lbl">Day Name <span className="req">*</span></div>
            <input
              className="ctrl"
              type="text"
              value={dayName}
              onChange={e => { setDayName(e.target.value); clearError('dayName') }}
              style={errors.dayName ? { borderColor: 'var(--red)' } : undefined}
            />
            {errors.dayName && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.dayName}</p>}
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-neu" onClick={handleClose}>Cancel</button>
          <button className="btn btn-primary" disabled={updateWeekday.isPending} onClick={handleSubmit}>
            <i className="lni lni-checkmark"></i> {updateWeekday.isPending ? 'Updating…' : 'Update Weekday'}
          </button>
        </div>
      </div>
    </div>
  )
}
