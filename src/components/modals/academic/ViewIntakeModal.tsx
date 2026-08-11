'use client'
import { useState, useEffect } from 'react'
import { ModalProps } from '../types'
import { SuccessPopup } from './SuccessPopup'
import { FailurePopup } from './FailurePopup'
import { SearchSelect } from '@/components/SearchSelect'
import { AuthError } from '@/lib/api/client'
import { CreateIntakeInput } from '@/lib/api/academic/intake'
import { useIntake, useUpdateIntake } from '@/hooks/academic/useIntakes'

// Default duration used until the calendar dates are available.
const DEFAULT_SEMESTER_WEEKS = 15

const MONTHS = [
  { value: '1', label: 'January' }, { value: '2', label: 'February' }, { value: '3', label: 'March' },
  { value: '4', label: 'April' }, { value: '5', label: 'May' }, { value: '6', label: 'June' },
  { value: '7', label: 'July' }, { value: '8', label: 'August' }, { value: '9', label: 'September' },
  { value: '10', label: 'October' }, { value: '11', label: 'November' }, { value: '12', label: 'December' },
]

const INTAKE_SEQUENCES = [
  { value: '1', label: 'Spring' },
  { value: '2', label: 'Fall' },
]

// One accordion section's worth of semester-calendar fields. Keyed by a
// stable UI-only `id` (not sent to the backend — semCode is derived from
// the entry's position in the array on submit), same "array of records +
// stable local id" convention FeeStructureModal uses for its `structures`.
interface CalendarEntryForm {
  id: number
  admissionStartDate: string
  admissionLateFeeDate: string
  admissionEndDate: string
  reentryStartDate: string
  reentryLateFeeDate: string
  reentryEndDate: string
  semStart: string
  lumpsumDate: string
  term1EndDate: string
  term2StartDate: string
  term2End: string
  resitStartDate: string
  resitEndDate: string
  finalExamStartDate: string
  finalExamEndDate: string
  clearanceDate: string
}

let nextCalendarEntryId = 1

function blankCalendarEntry(id: number): CalendarEntryForm {
  return {
    id,
    admissionStartDate: '', admissionLateFeeDate: '', admissionEndDate: '',
    reentryStartDate: '', reentryLateFeeDate: '', reentryEndDate: '',
    semStart: '', lumpsumDate: '', term1EndDate: '', term2StartDate: '', term2End: '',
    resitStartDate: '', resitEndDate: '', finalExamStartDate: '', finalExamEndDate: '', clearanceDate: '',
  }
}

// Per-entry error keys are namespaced by the entry's local id so two
// different semester sections can carry independent errors on the same
// field name (e.g. both section 1 and section 2 missing "Term 1 End Date").
function errKey(id: number, field: string) {
  return `${id}:${field}`
}

interface ViewIntakeModalProps extends ModalProps {
  intakeGuid: string | null
}

export function ViewIntakeModal({ isOpen, onClose, showToast, intakeGuid }: ViewIntakeModalProps) {
  const { data: intake, isLoading, isError, error } = useIntake(intakeGuid, isOpen)
  const updateIntake = useUpdateIntake()

  const [step, setStep]     = useState(1)
  const [saved, setSaved]   = useState(false)
  const [failure, setFailure] = useState<string | null>(null)

  // First step: the main intake details.
  const [description, setDescription]     = useState('')
  const [financialYear, setFinancialYear] = useState('')
  const [examYear, setExamYear]           = useState('')
  const [examMonth, setExamMonth]         = useState('')
  const [intakeSeq, setIntakeSeq]         = useState('')
  const [currentIntake, setCurrentIntake]                 = useState(false)
  const [currentAdmissionIntake, setCurrentAdmissionIntake] = useState(false)
  const [lastDateForReRegistration, setLastDateForReRegistration] = useState('')
  const [grievanceStartDate, setGrievanceStartDate] = useState('')
  const [grievanceEndDate, setGrievanceEndDate]     = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Second step: a left sidebar listing one entry per semester calendar
  // (same "sidebar list + active-record form" layout as FeeStructureModal's
  // Fee Structures panel) — starts with whatever the intake already has (at
  // least one, even if blank), and grows/shrinks via
  // addSemester()/removeSemester() instead of the old fixed "1st Semester" +
  // toggle-gated "2nd Semester" layout.
  const [calendarEntries, setCalendarEntries] = useState<CalendarEntryForm[]>([])
  const [activeIdx, setActiveIdx] = useState(0)

  // The API returns full datetime values, so the form strips the time portion for date fields.
  function toDateInputValue(value: string | null | undefined): string {
    if (!value) return ''
    return value.includes('T') ? value.split('T')[0] : value
  }

  // Fill the form when the intake data loads.
  useEffect(() => {
    if (!isOpen || !intake) return

    setDescription(intake.description)
    setFinancialYear(String(intake.financialYear))
    setExamYear(String(intake.examYear))
    setExamMonth(String(intake.examMonth))
    setIntakeSeq(String(intake.intakes))
    setCurrentIntake(intake.currentIntake)
    setCurrentAdmissionIntake(intake.currentAdmissionIntake)
    setLastDateForReRegistration(toDateInputValue(intake.lastDateForReRegistration))
    setGrievanceStartDate(toDateInputValue(intake.grievanceStartDate))
    setGrievanceEndDate(toDateInputValue(intake.grievanceEndDate))

    const sortedEntries = [...(intake.academicCalendar ?? [])].sort((a, b) => a.semCode - b.semCode)
    const source = sortedEntries.length > 0 ? sortedEntries : [null]
    setCalendarEntries(source.map(entry => ({
      id: nextCalendarEntryId++,
      admissionStartDate: toDateInputValue(entry?.admissionStartDate),
      admissionLateFeeDate: toDateInputValue(entry?.admissionLateFeeDate),
      admissionEndDate: toDateInputValue(entry?.admissionEndDate),
      reentryStartDate: toDateInputValue(entry?.reentryStartDate),
      reentryLateFeeDate: toDateInputValue(entry?.reentryLateFeeDate),
      reentryEndDate: toDateInputValue(entry?.reentryEndDate),
      semStart: toDateInputValue(entry?.semesterStartDate ?? entry?.term1StartDate),
      lumpsumDate: toDateInputValue(entry?.lumpsumDate),
      term1EndDate: toDateInputValue(entry?.term1EndDate),
      term2StartDate: toDateInputValue(entry?.term2StartDate),
      term2End: toDateInputValue(entry?.semesterEndDate ?? entry?.term2EndDate),
      resitStartDate: toDateInputValue(entry?.resitStartDate),
      resitEndDate: toDateInputValue(entry?.resitEndDate),
      finalExamStartDate: toDateInputValue(entry?.finalExamStartDate),
      finalExamEndDate: toDateInputValue(entry?.finalExamEndDate),
      clearanceDate: toDateInputValue(entry?.clearanceDate),
    })))
    setActiveIdx(0)

    setErrors({})
    setStep(1)
  }, [isOpen, intake])

  // Estimate the visible duration in weeks from the first semester's dates —
  // durationInWeeks is a single intake-level field, not per-semester.
  function calcDurationWeeks(): number | null {
    const first = calendarEntries[0]
    if (!first?.semStart || !first?.term2End) return null
    const ms = new Date(first.term2End).getTime() - new Date(first.semStart).getTime()
    // Round up, not to nearest — the backend re-validates semesterEndDate
    // against semStart + (durationInWeeks - 2) weeks, so rounding down here
    // (Math.round can round down) computes a shorter span than what the user
    // actually selected and rejects a perfectly valid end date.
    return ms > 0 ? Math.ceil(ms / (1000 * 60 * 60 * 24 * 7)) : null
  }

  function calcDuration() {
    const weeks = calcDurationWeeks()
    return weeks === null ? '' : String(weeks)
  }

  function parseDate(value: string | null | undefined) {
    if (!value) return null
    const normalized = value.trim()
    if (!normalized) return null
    const [year, month, day] = normalized.split('-').map(Number)
    if ([year, month, day].some(part => Number.isNaN(part))) return null
    return new Date(Date.UTC(year, month - 1, day))
  }

  // Empty date inputs are sent as null so the API accepts them.
  function toApiDate(value: string): string | null {
    const trimmed = value.trim()
    if (!trimmed) return null
    const datePart = trimmed.includes('T') ? trimmed.split('T')[0] : trimmed
    return `${datePart}T00:00:00`
  }

  function buildAcademicCalendarEntries(): CreateIntakeInput['academicCalendar'] {
    return calendarEntries.map((entry, idx) => ({
      academicCalendarGuid: null,
      semCode: idx + 1,
      admissionStartDate: toApiDate(entry.admissionStartDate),
      admissionLateFeeDate: toApiDate(entry.admissionLateFeeDate),
      admissionEndDate: toApiDate(entry.admissionEndDate),
      reentryStartDate: toApiDate(entry.reentryStartDate),
      reentryLateFeeDate: toApiDate(entry.reentryLateFeeDate),
      reentryEndDate: toApiDate(entry.reentryEndDate),
      semesterStartDate: toApiDate(entry.semStart),
      semesterEndDate: toApiDate(entry.term2End),
      lumpsumDate: toApiDate(entry.lumpsumDate),
      term1StartDate: toApiDate(entry.semStart),
      term1EndDate: toApiDate(entry.term1EndDate),
      term2StartDate: toApiDate(entry.term2StartDate),
      term2EndDate: toApiDate(entry.term2End),
      resitStartDate: toApiDate(entry.resitStartDate),
      resitEndDate: toApiDate(entry.resitEndDate),
      finalExamStartDate: toApiDate(entry.finalExamStartDate),
      finalExamEndDate: toApiDate(entry.finalExamEndDate),
      clearanceDate: toApiDate(entry.clearanceDate),
    }))
  }

  function addSemester() {
    const id = nextCalendarEntryId++
    setCalendarEntries(prev => [...prev, blankCalendarEntry(id)])
    setActiveIdx(calendarEntries.length)
  }

  function removeSemester(id: number) {
    if (calendarEntries.length <= 1) return
    const idx = calendarEntries.findIndex(en => en.id === id)
    setCalendarEntries(prev => prev.filter(en => en.id !== id))
    setActiveIdx(prev => (prev >= idx && prev > 0 ? prev - 1 : prev))
  }

  function updateEntry(id: number, field: keyof Omit<CalendarEntryForm, 'id'>, value: string) {
    setCalendarEntries(prev => prev.map(en => en.id === id ? { ...en, [field]: value } : en))
    const key = errKey(id, field)
    if (errors[key]) setErrors(p => { const next = { ...p }; delete next[key]; return next })
  }

  function validate(stepNumber = step) {
    const e: Record<string, string> = {}

    if (stepNumber === 1) {
      if (!description.trim())    e.description   = 'Description is required'
      if (!financialYear.trim())  e.financialYear  = 'Financial Year is required'
      if (!examYear.trim())       e.examYear       = 'Exam Year is required'
      if (!examMonth)             e.examMonth      = 'Please select an Exam Month'
      if (!intakeSeq.trim())      e.intakeSeq      = 'Intake Sequence is required'
      // Confirmed required by the backend (validation_error: "must not be
      // empty") despite CreateIntakeInput typing these as nullable.
      if (!lastDateForReRegistration) e.lastDateForReRegistration = 'Last Date for Re-registration is required'
      if (!grievanceStartDate)        e.grievanceStartDate        = 'Grievance Start Date is required'
      if (!grievanceEndDate)          e.grievanceEndDate          = 'Grievance End Date is required'
    }

    if (stepNumber === 2) {
      calendarEntries.forEach((entry, idx) => {
        const startDate = parseDate(entry.semStart)
        const endDate   = parseDate(entry.term2End)

        if (!entry.semStart)      e[errKey(entry.id, 'semStart')]      = `Semester ${idx + 1} start date is required`
        if (!entry.term1EndDate)  e[errKey(entry.id, 'term1EndDate')]  = `Semester ${idx + 1} term 1 end date is required`
        if (!entry.term2StartDate) e[errKey(entry.id, 'term2StartDate')] = `Semester ${idx + 1} term 2 start date is required`
        if (!entry.term2End)      e[errKey(entry.id, 'term2End')]      = `Semester ${idx + 1} end date is required`

        // No client-side cap on how far term2End can be from semStart — the
        // backend enforces its own max-end-date rule (semesterStartDate +
        // (durationInWeeks - 2) weeks), but durationInWeeks itself is now
        // derived from the first entry's own dates (see calcDurationWeeks()
        // / handleUpdate), so that check is satisfied by construction. A
        // validation_error would still surface via the failure screen if the
        // backend ever disagrees.
        if (startDate && endDate && endDate < startDate) {
          e[errKey(entry.id, 'term2End')] = `Semester ${idx + 1} end date must be on or after its start date`
        }

        const admissionStart   = parseDate(entry.admissionStartDate)
        const admissionLateFee = parseDate(entry.admissionLateFeeDate)
        const admissionEnd     = parseDate(entry.admissionEndDate)
        if (admissionStart && admissionLateFee && admissionLateFee < admissionStart) {
          e[errKey(entry.id, 'admissionLateFeeDate')] = 'Admission late fee date must be on or after the admission start date'
        }
        if (admissionLateFee && admissionEnd && admissionEnd < admissionLateFee) {
          e[errKey(entry.id, 'admissionEndDate')] = 'Admission end date must be on or after the admission late fee date'
        }

        const reentryStart   = parseDate(entry.reentryStartDate)
        const reentryLateFee = parseDate(entry.reentryLateFeeDate)
        const reentryEnd     = parseDate(entry.reentryEndDate)
        if (reentryStart && reentryLateFee && reentryLateFee < reentryStart) {
          e[errKey(entry.id, 'reentryLateFeeDate')] = 'Re-entry late fee date must be on or after the re-entry start date'
        }
        if (reentryStart && reentryEnd && reentryEnd < reentryStart) {
          e[errKey(entry.id, 'reentryEndDate')] = 'Re-entry end date must be on or after the re-entry start date'
        }

        const resitStart = parseDate(entry.resitStartDate)
        const resitEnd   = parseDate(entry.resitEndDate)
        if (resitStart && resitEnd && resitEnd < resitStart) {
          e[errKey(entry.id, 'resitEndDate')] = 'Resit end date must be on or after the resit start date'
        }

        const finalExamStart = parseDate(entry.finalExamStartDate)
        const finalExamEnd   = parseDate(entry.finalExamEndDate)
        if (finalExamStart && finalExamEnd && finalExamEnd < finalExamStart) {
          e[errKey(entry.id, 'finalExamEndDate')] = 'Final exam end date must be on or after the final exam start date'
        }
      })
    }

    setErrors(e)
    return Object.keys(e).length === 0
  }

  if (!isOpen) return null

  function handleClose() {
    setStep(1)
    setSaved(false)
    setFailure(null)
    setErrors({})
    onClose()
  }

  if (saved) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <SuccessPopup
            title="Intake Updated!"
            subtitle="Your changes have been saved successfully."
            onClose={handleClose}
          />
        </div>
      </div>
    )
  }

  if (failure) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <FailurePopup title="Couldn't Update Intake" subtitle={failure} onClose={() => setFailure(null)} />
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <FailurePopup
            title="Couldn't Load Intake"
            subtitle={error instanceof AuthError ? (error.message || 'Failed to load intake details.') : 'Failed to load intake details.'}
            onClose={handleClose}
          />
        </div>
      </div>
    )
  }

  if (isLoading || !intake) {
    return (
      <div className="modal-overlay open" id="intake-view-modal">
        <div className="modal modal-80 modal-flex" onClick={e => e.stopPropagation()}>
          <div className="modal-hdr">
            <div className="modal-title"><i className="lni lni-eye"></i> View Intake</div>
            <button className="modal-close" onClick={handleClose}><i className="lni lni-close"></i></button>
          </div>
          <div className="modal-scroll" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 240 }}>
            <span style={{ color: 'var(--g400)' }}>Loading intake details…</span>
          </div>
        </div>
      </div>
    )
  }

  // This endpoint does not expose a confirmed failure-code list yet.
  // (unlike countries/departments), so anything the API sends back just
  // shows the failure screen with whatever message it gave us — same as
  // NewIntakeModal's create-error handling.
  function handleUpdateError(error: Error) {
    const code = error instanceof AuthError ? error.code : undefined
    setFailure(error.message || `Failed to update intake${code ? ` (${code})` : ''}. Please try again.`)
  }

  function handleUpdate() {
    if (!validate(2)) return
    if (!intakeGuid) return

    const input: CreateIntakeInput = {
      intakeCode: intake?.intakeCode ?? 0,
      description,
      financialYear: Number(financialYear),
      examYear: Number(examYear),
      intakes: Number(intakeSeq),
      examMonth: Number(examMonth),
      month: MONTHS.find(m => m.value === examMonth)?.label ?? '',
      // See DEFAULT_SEMESTER_WEEKS comment above — must be the actual
      // semester span (+2 buffer weeks), not a fixed nominal number.
      durationInWeeks: (calcDurationWeeks() ?? (DEFAULT_SEMESTER_WEEKS - 2)) + 2,
      lastDateForReRegistration: toApiDate(lastDateForReRegistration),
      currentIntake,
      grievanceStartDate: toApiDate(grievanceStartDate),
      currentAdmissionIntake,
      grievanceEndDate: toApiDate(grievanceEndDate),
      academicCalendar: buildAcademicCalendarEntries(),
    }
    updateIntake.mutate({ intakeGuid, input }, {
      onSuccess: () => { setSaved(true); showToast('Intake updated successfully') },
      onError: handleUpdateError,
    })
  }

  return (
    <div className="modal-overlay open" id="intake-view-modal">
      <div className="modal modal-80 modal-flex" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr">
          <div className="modal-title"><i className="lni lni-eye"></i> View Intake — <span className="font-mono">{intake.intakeCode}</span></div>
          <button className="modal-close" onClick={handleClose}><i className="lni lni-close"></i></button>
        </div>

        <div className="prog-steps">
          <div className={`prog-step${step === 1 ? ' active' : ''}`}>
            <span className="prog-step-num">1</span>
            <span>Intake Details</span>
          </div>
          <div className="prog-step-line"></div>
          <div className={`prog-step${step === 2 ? ' active' : ''}`}>
            <span className="prog-step-num">2</span>
            <span>Semester Planning Calendar</span>
          </div>
        </div>

        {step === 1 && (
          <div className="modal-scroll" style={{ paddingBottom: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', columnGap: '3.5rem', rowGap: '1.5rem' }}>
              <div className="fg">
                <div className="lbl" style={{ color: 'var(--g500)', marginBottom: 4 }}>Description</div>
                <div className="ctrl" style={{ display: 'flex', alignItems: 'center', background: 'var(--g50)', color: 'var(--g900)', fontWeight: 500, minHeight: 34, fontSize: 13.5, border: '1.5px solid var(--g200)', borderRadius: 'var(--rxs)' }}>{description || '—'}</div>
              </div>
              <div className="fg">
                <div className="lbl" style={{ color: 'var(--g500)', marginBottom: 4 }}>Financial Year</div>
                <div className="ctrl" style={{ display: 'flex', alignItems: 'center', background: 'var(--g50)', color: 'var(--g900)', fontWeight: 500, minHeight: 34, fontSize: 13.5, border: '1.5px solid var(--g200)', borderRadius: 'var(--rxs)' }}>{financialYear || '—'}</div>
              </div>
              <div className="fg">
                <div className="lbl" style={{ color: 'var(--g500)', marginBottom: 4 }}>Exam Year</div>
                <div className="ctrl" style={{ display: 'flex', alignItems: 'center', background: 'var(--g50)', color: 'var(--g900)', fontWeight: 500, minHeight: 34, fontSize: 13.5, border: '1.5px solid var(--g200)', borderRadius: 'var(--rxs)' }}>{examYear || '—'}</div>
              </div>
              <div className="fg">
                <div className="lbl" style={{ color: 'var(--g500)', marginBottom: 4 }}>Exam Month</div>
                <div className="ctrl" style={{ display: 'flex', alignItems: 'center', background: 'var(--g50)', color: 'var(--g900)', fontWeight: 500, minHeight: 34, fontSize: 13.5, border: '1.5px solid var(--g200)', borderRadius: 'var(--rxs)' }}>{MONTHS.find(m => m.value === String(examMonth))?.label || '—'}</div>
              </div>
              <div className="fg">
                <div className="lbl" style={{ color: 'var(--g500)', marginBottom: 4 }}>Intake Sequence</div>
                <div className="ctrl" style={{ display: 'flex', alignItems: 'center', background: 'var(--g50)', color: 'var(--g900)', fontWeight: 500, minHeight: 34, fontSize: 13.5, border: '1.5px solid var(--g200)', borderRadius: 'var(--rxs)' }}>{INTAKE_SEQUENCES.find(s => s.value === String(intakeSeq))?.label || '—'}</div>
              </div>
              <div className="fg" style={{ gridColumn: 'span 3' }}>
                <div className="lbl" style={{ color: 'var(--g500)', marginBottom: 4 }}>Set As</div>
                <div style={{ display: 'flex', gap: 16, marginTop: 4 }}>
                  {currentIntake ? <span className="badge badge-green">Academic Intake</span> : <span className="badge badge-neu">Not Academic Intake</span>}
                  {currentAdmissionIntake ? <span className="badge badge-green">Admission Intake</span> : <span className="badge badge-neu">Not Admission Intake</span>}
                </div>
              </div>
              <div className="fg">
                <div className="lbl" style={{ color: 'var(--g500)', marginBottom: 4 }}>Last Date for Re-registration</div>
                <div className="ctrl" style={{ display: 'flex', alignItems: 'center', background: 'var(--g50)', color: 'var(--g900)', fontWeight: 500, minHeight: 34, fontSize: 13.5, border: '1.5px solid var(--g200)', borderRadius: 'var(--rxs)' }}>{lastDateForReRegistration || '—'}</div>
              </div>
              <div className="fg">
                <div className="lbl" style={{ color: 'var(--g500)', marginBottom: 4 }}>Grievance Start Date</div>
                <div className="ctrl" style={{ display: 'flex', alignItems: 'center', background: 'var(--g50)', color: 'var(--g900)', fontWeight: 500, minHeight: 34, fontSize: 13.5, border: '1.5px solid var(--g200)', borderRadius: 'var(--rxs)' }}>{grievanceStartDate || '—'}</div>
              </div>
              <div className="fg">
                <div className="lbl" style={{ color: 'var(--g500)', marginBottom: 4 }}>Grievance End Date</div>
                <div className="ctrl" style={{ display: 'flex', alignItems: 'center', background: 'var(--g50)', color: 'var(--g900)', fontWeight: 500, minHeight: 34, fontSize: 13.5, border: '1.5px solid var(--g200)', borderRadius: 'var(--rxs)' }}>{grievanceEndDate || '—'}</div>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (() => {
          const active = calendarEntries[activeIdx]
          return (
            <div className="fsm-layout">
              {/* Left sidebar — one entry per semester */}
              <div className="fsm-sidebar">
                <div style={{ padding: '14px 14px 6px', fontSize: 10.5, fontWeight: 700, color: 'var(--g400)', textTransform: 'uppercase', letterSpacing: '.07em' }}>
                  Semesters <span style={{ color: 'var(--b500)' }}>({calendarEntries.length})</span>
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: '4px 8px' }}>
                  {calendarEntries.map((entry, i) => (
                    <div
                      key={entry.id}
                      onClick={() => setActiveIdx(i)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '9px 10px', borderRadius: 'var(--rsm)', marginBottom: 2,
                        background: activeIdx === i ? 'var(--b500)' : 'transparent',
                        color: activeIdx === i ? '#fff' : 'var(--g700)',
                        cursor: 'pointer', transition: 'background .15s',
                      }}
                    >
                      <div style={{ width: 30, height: 30, borderRadius: '50%', background: activeIdx === i ? 'rgba(255,255,255,.2)' : 'var(--b100)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <i className="lni lni-calendar" style={{ fontSize: 13, color: activeIdx === i ? '#fff' : 'var(--b600)' }}></i>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 13, lineHeight: 1.3 }}>Semester {i + 1}</div>
                        <div style={{ fontSize: 11, opacity: .65, lineHeight: 1.3 }}>{entry.semStart ? `Starts ${entry.semStart}` : 'No dates set'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right panel — active semester's calendar fields */}
              <div className="fsm-main">
                {active && (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18, padding: '12px 16px', background: 'var(--b50)', borderRadius: 'var(--rsm)', border: '1.5px solid var(--b100)' }}>
                      <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--b100)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <i className="lni lni-calendar" style={{ color: 'var(--b600)', fontSize: 17 }}></i>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--b800)' }}>
                          {activeIdx === 0 ? '1st Semester Planning Calendar' : `Semester ${activeIdx + 1} Planning Calendar`}
                        </div>
                        <div style={{ fontSize: 11.5, color: 'var(--g400)' }}>
                          Semester {activeIdx + 1} of {calendarEntries.length}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', columnGap: '3.5rem', rowGap: '1.5rem', paddingBottom: 24 }}>
                      <div className="fg"><div className="lbl" style={{ color: 'var(--g500)', marginBottom: 4 }}>Admission Start Date</div><div className="ctrl" style={{ display: 'flex', alignItems: 'center', background: 'var(--g50)', color: 'var(--g900)', fontWeight: 500, minHeight: 34, fontSize: 13.5, border: '1.5px solid var(--g200)', borderRadius: 'var(--rxs)' }}>{active.admissionStartDate || '—'}</div></div>
                      <div className="fg"><div className="lbl" style={{ color: 'var(--g500)', marginBottom: 4 }}>Admission Late Fee Date</div><div className="ctrl" style={{ display: 'flex', alignItems: 'center', background: 'var(--g50)', color: 'var(--g900)', fontWeight: 500, minHeight: 34, fontSize: 13.5, border: '1.5px solid var(--g200)', borderRadius: 'var(--rxs)' }}>{active.admissionLateFeeDate || '—'}</div></div>
                      <div className="fg"><div className="lbl" style={{ color: 'var(--g500)', marginBottom: 4 }}>Admission End Date</div><div className="ctrl" style={{ display: 'flex', alignItems: 'center', background: 'var(--g50)', color: 'var(--g900)', fontWeight: 500, minHeight: 34, fontSize: 13.5, border: '1.5px solid var(--g200)', borderRadius: 'var(--rxs)' }}>{active.admissionEndDate || '—'}</div></div>
                      <div className="fg"><div className="lbl" style={{ color: 'var(--g500)', marginBottom: 4 }}>Re-entry Start Date</div><div className="ctrl" style={{ display: 'flex', alignItems: 'center', background: 'var(--g50)', color: 'var(--g900)', fontWeight: 500, minHeight: 34, fontSize: 13.5, border: '1.5px solid var(--g200)', borderRadius: 'var(--rxs)' }}>{active.reentryStartDate || '—'}</div></div>
                      <div className="fg"><div className="lbl" style={{ color: 'var(--g500)', marginBottom: 4 }}>Re-entry Late Fee Date</div><div className="ctrl" style={{ display: 'flex', alignItems: 'center', background: 'var(--g50)', color: 'var(--g900)', fontWeight: 500, minHeight: 34, fontSize: 13.5, border: '1.5px solid var(--g200)', borderRadius: 'var(--rxs)' }}>{active.reentryLateFeeDate || '—'}</div></div>
                      <div className="fg"><div className="lbl" style={{ color: 'var(--g500)', marginBottom: 4 }}>Re-entry End Date</div><div className="ctrl" style={{ display: 'flex', alignItems: 'center', background: 'var(--g50)', color: 'var(--g900)', fontWeight: 500, minHeight: 34, fontSize: 13.5, border: '1.5px solid var(--g200)', borderRadius: 'var(--rxs)' }}>{active.reentryEndDate || '—'}</div></div>
                      <div className="fg"><div className="lbl" style={{ color: 'var(--g500)', marginBottom: 4 }}>Semester/Term 1 Start Date</div><div className="ctrl" style={{ display: 'flex', alignItems: 'center', background: 'var(--g50)', color: 'var(--g900)', fontWeight: 500, minHeight: 34, fontSize: 13.5, border: '1.5px solid var(--g200)', borderRadius: 'var(--rxs)' }}>{active.semStart || '—'}</div></div>
                      <div className="fg"><div className="lbl" style={{ color: 'var(--g500)', marginBottom: 4 }}>Lump Sum Date</div><div className="ctrl" style={{ display: 'flex', alignItems: 'center', background: 'var(--g50)', color: 'var(--g900)', fontWeight: 500, minHeight: 34, fontSize: 13.5, border: '1.5px solid var(--g200)', borderRadius: 'var(--rxs)' }}>{active.lumpsumDate || '—'}</div></div>
                      <div className="fg"><div className="lbl" style={{ color: 'var(--g500)', marginBottom: 4 }}>Term 1 End Date</div><div className="ctrl" style={{ display: 'flex', alignItems: 'center', background: 'var(--g50)', color: 'var(--g900)', fontWeight: 500, minHeight: 34, fontSize: 13.5, border: '1.5px solid var(--g200)', borderRadius: 'var(--rxs)' }}>{active.term1EndDate || '—'}</div></div>
                      <div className="fg"><div className="lbl" style={{ color: 'var(--g500)', marginBottom: 4 }}>Term 2 Start Date</div><div className="ctrl" style={{ display: 'flex', alignItems: 'center', background: 'var(--g50)', color: 'var(--g900)', fontWeight: 500, minHeight: 34, fontSize: 13.5, border: '1.5px solid var(--g200)', borderRadius: 'var(--rxs)' }}>{active.term2StartDate || '—'}</div></div>
                      <div className="fg"><div className="lbl" style={{ color: 'var(--g500)', marginBottom: 4 }}>Semester/Term 2 End Date</div><div className="ctrl" style={{ display: 'flex', alignItems: 'center', background: 'var(--g50)', color: 'var(--g900)', fontWeight: 500, minHeight: 34, fontSize: 13.5, border: '1.5px solid var(--g200)', borderRadius: 'var(--rxs)' }}>{active.term2End || '—'}</div></div>
                      {activeIdx === 0 && (
                        <div className="fg">
                          <div className="lbl" style={{ color: 'var(--g500)', marginBottom: 4 }}>Duration (weeks)</div>
                          <div className="ctrl" style={{ display: 'flex', alignItems: 'center', background: 'var(--g50)', color: 'var(--g900)', fontWeight: 500, minHeight: 34, fontSize: 13.5, border: '1.5px solid var(--g200)', borderRadius: 'var(--rxs)' }}>{calcDuration() || '—'}</div>
                        </div>
                      )}
                      <div className="fg"><div className="lbl" style={{ color: 'var(--g500)', marginBottom: 4 }}>Resit Start Date</div><div className="ctrl" style={{ display: 'flex', alignItems: 'center', background: 'var(--g50)', color: 'var(--g900)', fontWeight: 500, minHeight: 34, fontSize: 13.5, border: '1.5px solid var(--g200)', borderRadius: 'var(--rxs)' }}>{active.resitStartDate || '—'}</div></div>
                      <div className="fg"><div className="lbl" style={{ color: 'var(--g500)', marginBottom: 4 }}>Resit End Date</div><div className="ctrl" style={{ display: 'flex', alignItems: 'center', background: 'var(--g50)', color: 'var(--g900)', fontWeight: 500, minHeight: 34, fontSize: 13.5, border: '1.5px solid var(--g200)', borderRadius: 'var(--rxs)' }}>{active.resitEndDate || '—'}</div></div>
                      <div className="fg"><div className="lbl" style={{ color: 'var(--g500)', marginBottom: 4 }}>Final Exam Start Date</div><div className="ctrl" style={{ display: 'flex', alignItems: 'center', background: 'var(--g50)', color: 'var(--g900)', fontWeight: 500, minHeight: 34, fontSize: 13.5, border: '1.5px solid var(--g200)', borderRadius: 'var(--rxs)' }}>{active.finalExamStartDate || '—'}</div></div>
                      <div className="fg"><div className="lbl" style={{ color: 'var(--g500)', marginBottom: 4 }}>Final Exam End Date</div><div className="ctrl" style={{ display: 'flex', alignItems: 'center', background: 'var(--g50)', color: 'var(--g900)', fontWeight: 500, minHeight: 34, fontSize: 13.5, border: '1.5px solid var(--g200)', borderRadius: 'var(--rxs)' }}>{active.finalExamEndDate || '—'}</div></div>
                      <div className="fg"><div className="lbl" style={{ color: 'var(--g500)', marginBottom: 4 }}>Clearance Date (80%)</div><div className="ctrl" style={{ display: 'flex', alignItems: 'center', background: 'var(--g50)', color: 'var(--g900)', fontWeight: 500, minHeight: 34, fontSize: 13.5, border: '1.5px solid var(--g200)', borderRadius: 'var(--rxs)' }}>{active.clearanceDate || '—'}</div></div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )
        })()}

        <div className="modal-footer">
          <button className="btn btn-neu" onClick={handleClose}>Cancel</button>
          <span className="flex-1"></span>
          {step === 2 && (
            <button className="btn btn-neu" onClick={() => setStep(1)}>
              <i className="lni lni-arrow-left"></i> Back
            </button>
          )}
          {step === 1 && (
            <button className="btn btn-primary" onClick={() => setStep(2)}>
              Continue <i className="lni lni-arrow-right"></i>
            </button>
          )}
          {step === 2 && (
            <button className="btn btn-primary" onClick={handleClose}>
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
