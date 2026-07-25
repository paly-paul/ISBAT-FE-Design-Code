'use client'
import { useState } from 'react'
import { ModalProps } from '../types'
import { SuccessPopup } from './SuccessPopup'
import { FailurePopup } from './FailurePopup'
import { WeekdayInput } from '@/lib/api/academic/weekday'

interface NewWeekdayModalProps extends ModalProps {
  createWeekday: {
    mutate: (input: WeekdayInput, options?: { onSuccess?: () => void; onError?: (error: Error) => void }) => void
    isPending: boolean
  }
}

export function NewWeekdayModal({ isOpen, onClose, showToast, createWeekday }: NewWeekdayModalProps) {
  const [saved, setSaved]         = useState(false)
  const [failure, setFailure]     = useState<string | null>(null)
  const [dayCode, setDayCode]     = useState('')
  const [dayName, setDayName]     = useState('')
  const [errors, setErrors]       = useState<Record<string, string>>({})

  if (!isOpen) return null

  function handleClose() {
    setSaved(false); setFailure(null); setDayCode(''); setDayName(''); setErrors({})
    onClose()
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!dayCode.trim()) e.dayCode = 'Day Code is required'
    if (!dayName.trim()) e.dayName = 'Day Name is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  if (saved) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <SuccessPopup title="Weekday Added!" subtitle="The new weekday has been saved successfully." onClose={handleClose} />
        </div>
      </div>
    )
  }

  if (failure) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <FailurePopup title="Couldn't Add Weekday" subtitle={failure} onClose={() => setFailure(null)} />
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay open" id="new-weekday-modal">
      <div className="modal modal-md" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr">
          <div className="modal-title"><i className="lni lni-calendar"></i> Add Weekday</div>
          <button className="modal-close" onClick={handleClose}><i className="lni lni-close"></i></button>
        </div>
        <div className="g2">
          <div className="fg">
            <div className="lbl">Day Code <span className="req">*</span></div>
            <input
              className="ctrl font-mono uppercase"
              type="text"
              placeholder="e.g. MON"
              maxLength={8}
              value={dayCode}
              onChange={e => { setDayCode(e.target.value.toUpperCase()); if (errors.dayCode) setErrors(p => ({ ...p, dayCode: '' })) }}
              style={errors.dayCode ? { borderColor: 'var(--red)' } : undefined}
            />
            {errors.dayCode && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.dayCode}</p>}
          </div>
          <div className="fg">
            <div className="lbl">Day Name <span className="req">*</span></div>
            <input
              className="ctrl"
              type="text"
              placeholder="e.g. monday"
              value={dayName}
              onChange={e => { setDayName(e.target.value); if (errors.dayName) setErrors(p => ({ ...p, dayName: '' })) }}
              style={errors.dayName ? { borderColor: 'var(--red)' } : undefined}
            />
            {errors.dayName && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.dayName}</p>}
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-neu" onClick={handleClose}>Cancel</button>
          <button
            className="btn btn-primary"
            disabled={createWeekday.isPending}
            onClick={() => {
              if (!validate()) return
              createWeekday.mutate(
                { dayCode, dayName },
                {
                  onSuccess: () => { setSaved(true); showToast('Weekday added successfully') },
                  onError: (error: Error) => setFailure(error.message || 'Failed to add weekday. Please try again.'),
                },
              )
            }}
          >
            <i className="lni lni-checkmark"></i> {createWeekday.isPending ? 'Adding…' : 'Add Weekday'}
          </button>
        </div>
      </div>
    </div>
  )
}
