'use client'
import { useState } from 'react'
import { ModalProps } from '../types'
import { SuccessPopup } from './SuccessPopup'
import { FailurePopup } from './FailurePopup'
import { SearchSelect } from '@/components/SearchSelect'
import { CreateIntakeInput } from '@/lib/api/academic/intake'
import { AuthError } from '@/lib/api/client'

// Nominal semester length sent as durationInWeeks on create/update — the
// backend uses this value (not the actual span between semStart/term2End)
// for its own end-date validation, so it has to stay a fixed number rather
// than something derived from the dates being entered.
const DEFAULT_SEMESTER_WEEKS = 15

// Used to fill in the `month` text field automatically once someone picks a
// numeric exam month, so the two always agree instead of being typed in
// separately and potentially drifting apart (e.g. examMonth: 8 but
// month: "July" by mistake).
const MONTHS = [
  { value: '1', label: 'January' }, { value: '2', label: 'February' }, { value: '3', label: 'March' },
  { value: '4', label: 'April' }, { value: '5', label: 'May' }, { value: '6', label: 'June' },
  { value: '7', label: 'July' }, { value: '8', label: 'August' }, { value: '9', label: 'September' },
  { value: '10', label: 'October' }, { value: '11', label: 'November' }, { value: '12', label: 'December' },
]

interface NewIntakeModalProps extends ModalProps {
  createIntake: {
    mutate: (input: CreateIntakeInput, options?: { onSuccess?: () => void; onError?: (error: Error) => void }) => void
    isPending: boolean
  }
}

export function NewIntakeModal({ isOpen, onClose, showToast, createIntake }: NewIntakeModalProps) {
  const [step, setStep]   = useState(1)
  const [saved, setSaved] = useState(false)
  const [failure, setFailure] = useState<string | null>(null)

  // ── Step 1 — matches the top-level fields of POST /api/v1/academic/intakes ──
  const [description, setDescription]     = useState('')
  const [financialYear, setFinancialYear] = useState('')
  const [examYear, setExamYear]           = useState('')
  const [examMonth, setExamMonth]         = useState('') // stores the SearchSelect's string value; `month` text is derived from this on submit
  const [intakeSeq, setIntakeSeq]         = useState('') // the backend's "intakes" field — this intake's sequence number within the year
  const [currentIntake, setCurrentIntake]                 = useState(false)
  const [currentAdmissionIntake, setCurrentAdmissionIntake] = useState(false)
  const [lastDateForReRegistration, setLastDateForReRegistration] = useState('')
  const [grievanceStartDate, setGrievanceStartDate] = useState('')
  const [grievanceEndDate, setGrievanceEndDate]     = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  // ── Step 2 — one or more entries in the `academicCalendar` array ──
  // The backend accepts a calendar array, so the form now populates the
  // first semester block from the existing fields and can optionally add a
  // second semester block with its own dates.
  const [admissionStartDate, setAdmissionStartDate]     = useState('')
  const [admissionLateFeeDate, setAdmissionLateFeeDate] = useState('')
  const [admissionEndDate, setAdmissionEndDate]         = useState('')
  const [reentryStartDate, setReentryStartDate]         = useState('')
  const [reentryLateFeeDate, setReentryLateFeeDate]     = useState('')
  const [reentryEndDate, setReentryEndDate]             = useState('')
  const [semStart, setSemStart]     = useState('') // feeds both semesterStartDate and term1StartDate — the sample response shows these are always the same value
  const [lumpsumDate, setLumpsumDate] = useState('')
  const [term1EndDate, setTerm1EndDate]   = useState('')
  const [term2StartDate, setTerm2StartDate] = useState('')
  const [term2End, setTerm2End]     = useState('') // feeds both semesterEndDate and term2EndDate, same reasoning as semStart above
  const [resitStartDate, setResitStartDate]         = useState('')
  const [resitEndDate, setResitEndDate]             = useState('')
  const [finalExamStartDate, setFinalExamStartDate] = useState('')
  const [finalExamEndDate, setFinalExamEndDate]     = useState('')
  const [clearanceDate, setClearanceDate]           = useState('')

  const [secondSemesterEnabled, setSecondSemesterEnabled] = useState(false)
  const [secondAdmissionStartDate, setSecondAdmissionStartDate] = useState('')
  const [secondAdmissionLateFeeDate, setSecondAdmissionLateFeeDate] = useState('')
  const [secondAdmissionEndDate, setSecondAdmissionEndDate] = useState('')
  const [secondReentryStartDate, setSecondReentryStartDate] = useState('')
  const [secondReentryLateFeeDate, setSecondReentryLateFeeDate] = useState('')
  const [secondReentryEndDate, setSecondReentryEndDate] = useState('')
  const [secondSemStart, setSecondSemStart] = useState('')
  const [secondLumpsumDate, setSecondLumpsumDate] = useState('')
  const [secondTerm1EndDate, setSecondTerm1EndDate] = useState('')
  const [secondTerm2StartDate, setSecondTerm2StartDate] = useState('')
  const [secondTerm2End, setSecondTerm2End] = useState('')
  const [secondResitStartDate, setSecondResitStartDate] = useState('')
  const [secondResitEndDate, setSecondResitEndDate] = useState('')
  const [secondFinalExamStartDate, setSecondFinalExamStartDate] = useState('')
  const [secondFinalExamEndDate, setSecondFinalExamEndDate] = useState('')
  const [secondClearanceDate, setSecondClearanceDate] = useState('')

  // The backend deserializes every date field straight into a .NET DateTime.
  // The documented contract uses full datetime values (for example
  // "2024-02-28T00:00:00"), so the form now serializes date-only input into
  // that format before it goes out. Empty values are converted to null so we
  // don't send an empty string and trigger a JSON conversion error.
  function toApiDate(value: string): string | null {
    const trimmed = value.trim()
    if (!trimmed) return null
    const datePart = trimmed.includes('T') ? trimmed.split('T')[0] : trimmed
    return `${datePart}T00:00:00`
  }

  function calcDuration() {
    if (!semStart || !term2End) return ''
    const ms = new Date(term2End).getTime() - new Date(semStart).getTime()
    return ms > 0 ? String(Math.round(ms / (1000 * 60 * 60 * 24 * 7))) : ''
  }

  function parseDate(value: string | null | undefined) {
    if (!value) return null
    const normalized = value.trim()
    if (!normalized) return null
    const [year, month, day] = normalized.split('-').map(Number)
    if ([year, month, day].some(part => Number.isNaN(part))) return null
    return new Date(Date.UTC(year, month - 1, day))
  }

  function hasAnyCalendarValue(values: Array<string | null | undefined>) {
    return values.some(value => typeof value === 'string' && value.trim() !== '')
  }

  function buildAcademicCalendarEntries() {
    const entries: Array<{
      academicCalendarGuid: null
      semCode: number
      admissionStartDate: string | null
      admissionLateFeeDate: string | null
      admissionEndDate: string | null
      reentryStartDate: string | null
      reentryLateFeeDate: string | null
      reentryEndDate: string | null
      semesterStartDate: string | null
      semesterEndDate: string | null
      lumpsumDate: string | null
      term1StartDate: string | null
      term1EndDate: string | null
      term2StartDate: string | null
      term2EndDate: string | null
      resitStartDate: string | null
      resitEndDate: string | null
      finalExamStartDate: string | null
      finalExamEndDate: string | null
      clearanceDate: string | null
    }> = [
      {
        academicCalendarGuid: null,
        semCode: 1,
        admissionStartDate: toApiDate(admissionStartDate),
        admissionLateFeeDate: toApiDate(admissionLateFeeDate),
        admissionEndDate: toApiDate(admissionEndDate),
        reentryStartDate: toApiDate(reentryStartDate),
        reentryLateFeeDate: toApiDate(reentryLateFeeDate),
        reentryEndDate: toApiDate(reentryEndDate),
        semesterStartDate: toApiDate(semStart),
        semesterEndDate: toApiDate(term2End),
        lumpsumDate: toApiDate(lumpsumDate),
        term1StartDate: toApiDate(semStart),
        term1EndDate: toApiDate(term1EndDate),
        term2StartDate: toApiDate(term2StartDate),
        term2EndDate: toApiDate(term2End),
        resitStartDate: toApiDate(resitStartDate),
        resitEndDate: toApiDate(resitEndDate),
        finalExamStartDate: toApiDate(finalExamStartDate),
        finalExamEndDate: toApiDate(finalExamEndDate),
        clearanceDate: toApiDate(clearanceDate),
      },
    ]

    if (secondSemesterEnabled && hasAnyCalendarValue([
      secondAdmissionStartDate,
      secondAdmissionLateFeeDate,
      secondAdmissionEndDate,
      secondReentryStartDate,
      secondReentryLateFeeDate,
      secondReentryEndDate,
      secondSemStart,
      secondLumpsumDate,
      secondTerm1EndDate,
      secondTerm2StartDate,
      secondTerm2End,
      secondResitStartDate,
      secondResitEndDate,
      secondFinalExamStartDate,
      secondFinalExamEndDate,
      secondClearanceDate,
    ])) {
      entries.push({
        academicCalendarGuid: null,
        semCode: 2,
        admissionStartDate: toApiDate(secondAdmissionStartDate),
        admissionLateFeeDate: toApiDate(secondAdmissionLateFeeDate),
        admissionEndDate: toApiDate(secondAdmissionEndDate),
        reentryStartDate: toApiDate(secondReentryStartDate),
        reentryLateFeeDate: toApiDate(secondReentryLateFeeDate),
        reentryEndDate: toApiDate(secondReentryEndDate),
        semesterStartDate: toApiDate(secondSemStart),
        semesterEndDate: toApiDate(secondTerm2End),
        lumpsumDate: toApiDate(secondLumpsumDate),
        term1StartDate: toApiDate(secondSemStart),
        term1EndDate: toApiDate(secondTerm1EndDate),
        term2StartDate: toApiDate(secondTerm2StartDate),
        term2EndDate: toApiDate(secondTerm2End),
        resitStartDate: toApiDate(secondResitStartDate),
        resitEndDate: toApiDate(secondResitEndDate),
        finalExamStartDate: toApiDate(secondFinalExamStartDate),
        finalExamEndDate: toApiDate(secondFinalExamEndDate),
        clearanceDate: toApiDate(secondClearanceDate),
      })
    }

    return entries
  }

  function validate(stepNumber = step) {
    const e: Record<string, string> = {}

    if (stepNumber === 1) {
      if (!description.trim())    e.description   = 'Description is required'
      if (!financialYear.trim())  e.financialYear  = 'Financial Year is required'
      if (!examYear.trim())       e.examYear       = 'Exam Year is required'
      if (!examMonth)             e.examMonth      = 'Please select an Exam Month'
      if (!intakeSeq.trim())      e.intakeSeq      = 'Intake Sequence is required'
    }

    if (stepNumber === 2) {
      const semStartDate = parseDate(semStart)
      const semEndDate = parseDate(term2End)

      if (!semStart) e.semStart = 'Semester start date is required'
      if (!term1EndDate) e.term1EndDate = 'Term 1 end date is required'
      if (!term2StartDate) e.term2StartDate = 'Term 2 start date is required'
      if (!term2End) e.term2End = 'Semester end date is required'

      // No client-side cap on how far term2End can be from semStart — the
      // backend enforces its own max-end-date rule (based on the
      // durationInWeeks we send it) and returns a validation_error with the
      // real limit, surfaced via the failure screen. Hardcoding a guessed
      // limit here twice produced a cap that didn't match confirmed backend
      // behavior, rejecting valid dates.
      if (semStartDate && semEndDate && semEndDate < semStartDate) {
        e.term2End = 'Semester end date must be on or after the semester start date'
      }

      const admissionStart = parseDate(admissionStartDate)
      const admissionLateFee = parseDate(admissionLateFeeDate)
      const admissionEnd = parseDate(admissionEndDate)
      if (admissionStart && admissionLateFee && admissionLateFee < admissionStart) {
        e.admissionLateFeeDate = 'Admission late fee date must be on or after the admission start date'
      }
      if (admissionLateFee && admissionEnd && admissionEnd < admissionLateFee) {
        e.admissionEndDate = 'Admission end date must be on or after the admission late fee date'
      }

      const reentryStart = parseDate(reentryStartDate)
      const reentryLateFee = parseDate(reentryLateFeeDate)
      const reentryEnd = parseDate(reentryEndDate)
      if (reentryStart && reentryLateFee && reentryLateFee < reentryStart) {
        e.reentryLateFeeDate = 'Re-entry late fee date must be on or after the re-entry start date'
      }
      if (reentryStart && reentryEnd && reentryEnd < reentryStart) {
        e.reentryEndDate = 'Re-entry end date must be on or after the re-entry start date'
      }

      const resitStart = parseDate(resitStartDate)
      const resitEnd = parseDate(resitEndDate)
      if (resitStart && resitEnd && resitEnd < resitStart) {
        e.resitEndDate = 'Resit end date must be on or after the resit start date'
      }

      const finalExamStart = parseDate(finalExamStartDate)
      const finalExamEnd = parseDate(finalExamEndDate)
      if (finalExamStart && finalExamEnd && finalExamEnd < finalExamStart) {
        e.finalExamEndDate = 'Final exam end date must be on or after the final exam start date'
      }

      if (secondSemesterEnabled) {
        const secondHasAnyValue = hasAnyCalendarValue([
          secondAdmissionStartDate,
          secondAdmissionLateFeeDate,
          secondAdmissionEndDate,
          secondReentryStartDate,
          secondReentryLateFeeDate,
          secondReentryEndDate,
          secondSemStart,
          secondLumpsumDate,
          secondTerm1EndDate,
          secondTerm2StartDate,
          secondTerm2End,
          secondResitStartDate,
          secondResitEndDate,
          secondFinalExamStartDate,
          secondFinalExamEndDate,
          secondClearanceDate,
        ])

        if (secondHasAnyValue) {
          if (!secondSemStart) e.secondSemStart = 'Second semester start date is required'
          if (!secondTerm1EndDate) e.secondTerm1EndDate = 'Second semester term 1 end date is required'
          if (!secondTerm2StartDate) e.secondTerm2StartDate = 'Second semester term 2 start date is required'
          if (!secondTerm2End) e.secondTerm2End = 'Second semester end date is required'

          const secondSemStartDate = parseDate(secondSemStart)
          const secondSemEndDate = parseDate(secondTerm2End)
          if (secondSemStartDate && secondSemEndDate && secondSemEndDate < secondSemStartDate) {
            e.secondTerm2End = 'Second semester end date must be on or after the second semester start date'
          }
        }
      }
    }

    setErrors(e)
    return Object.keys(e).length === 0
  }

  if (!isOpen) return null

  function handleClose() {
    setStep(1)
    setSaved(false)
    setFailure(null)
    setDescription('')
    setFinancialYear('')
    setExamYear('')
    setExamMonth('')
    setIntakeSeq('')
    setCurrentIntake(false)
    setCurrentAdmissionIntake(false)
    setLastDateForReRegistration('')
    setGrievanceStartDate('')
    setGrievanceEndDate('')
    setAdmissionStartDate('')
    setAdmissionLateFeeDate('')
    setAdmissionEndDate('')
    setReentryStartDate('')
    setReentryLateFeeDate('')
    setReentryEndDate('')
    setSemStart('')
    setLumpsumDate('')
    setTerm1EndDate('')
    setTerm2StartDate('')
    setTerm2End('')
    setResitStartDate('')
    setResitEndDate('')
    setFinalExamStartDate('')
    setFinalExamEndDate('')
    setClearanceDate('')
    setSecondSemesterEnabled(false)
    setSecondAdmissionStartDate('')
    setSecondAdmissionLateFeeDate('')
    setSecondAdmissionEndDate('')
    setSecondReentryStartDate('')
    setSecondReentryLateFeeDate('')
    setSecondReentryEndDate('')
    setSecondSemStart('')
    setSecondLumpsumDate('')
    setSecondTerm1EndDate('')
    setSecondTerm2StartDate('')
    setSecondTerm2End('')
    setSecondResitStartDate('')
    setSecondResitEndDate('')
    setSecondFinalExamStartDate('')
    setSecondFinalExamEndDate('')
    setSecondClearanceDate('')
    setErrors({})
    onClose()
  }

  // We don't have a confirmed list of failure codes for this endpoint yet
  // (unlike countries/departments, where the docs spelled out bad_request vs
  // validation_error), so for now anything that comes back from the API just
  // shows the failure screen with whatever message the backend sent.
  function handleCreateError(error: Error) {
    const code = error instanceof AuthError ? error.code : undefined
    setFailure(error.message || `Failed to create intake${code ? ` (${code})` : ''}. Please try again.`)
  }

  function handleCreate() {
    if (!validate(2)) return

    const input: CreateIntakeInput = {
      description,
      financialYear: Number(financialYear),
      examYear: Number(examYear),
      intakes: Number(intakeSeq),
      examMonth: Number(examMonth),
      month: MONTHS.find(m => m.value === examMonth)?.label ?? '',
      // Must match the DEFAULT_SEMESTER_WEEKS used in validate()'s end-date
      // cap — the backend computes its own max end date as
      // semesterStartDate + (durationInWeeks - 2) weeks using this value, so
      // sending the actual computed span here (instead of the nominal
      // duration) would make that check fail for almost any real end date.
      durationInWeeks: DEFAULT_SEMESTER_WEEKS,
      lastDateForReRegistration: toApiDate(lastDateForReRegistration),
      currentIntake,
      grievanceStartDate: toApiDate(grievanceStartDate),
      currentAdmissionIntake,
      grievanceEndDate: toApiDate(grievanceEndDate),
      academicCalendar: buildAcademicCalendarEntries(),
    }
    createIntake.mutate(input, {
      onSuccess: () => { setSaved(true); showToast('Intake added successfully') },
      onError: handleCreateError,
    })
  }

  if (saved) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <SuccessPopup
            title="Intake Created!"
            subtitle="The new intake has been saved successfully."
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
          <FailurePopup title="Couldn't Create Intake" subtitle={failure} onClose={() => setFailure(null)} />
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay open" id="new-intake-modal">
      <div className="modal modal-80 modal-flex" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr">
          <div className="modal-title"><i className="lni lni-calendar"></i> Create New Intake</div>
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

        <div className="modal-scroll">
          {step === 1 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', columnGap: '3.5rem', rowGap: '1rem' }}>
              {/* Intake Code used to be typed in here, but the confirmed create
                  payload doesn't send a code at all — the backend generates
                  intakeCode itself and hands it back in the response. Left here
                  for reference rather than deleted outright.
              <div className="fg">
                <div className="lbl">Intake Code <span className="req">*</span></div>
                <input
                  className="ctrl"
                  style={errors.intakeCode ? { borderColor: 'var(--red)' } : undefined}
                  type="text"
                  placeholder="e.g. 20263"
                  value={intakeCode}
                  onChange={e => { setIntakeCode(e.target.value); if (errors.intakeCode) setErrors(p => ({ ...p, intakeCode: '' })) }}
                />
                {errors.intakeCode && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.intakeCode}</p>}
              </div>
              */}
              <div className="fg">
                <div className="lbl">Description <span className="req">*</span></div>
                <input
                  className="ctrl"
                  style={errors.description ? { borderColor: 'var(--red)' } : undefined}
                  type="text"
                  placeholder="e.g. September 2027 Intake"
                  value={description}
                  onChange={e => { setDescription(e.target.value); if (errors.description) setErrors(p => ({ ...p, description: '' })) }}
                />
                {errors.description && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.description}</p>}
              </div>
              {/* Financial Year used to be a free-text "2026-27" style range.
                  The confirmed payload wants a single year as a number
                  (financialYear: 2026), so the field below now takes a plain
                  year instead — kept the old version here for reference.
              <div className="fg">
                <div className="lbl">Financial Year <span className="req">*</span></div>
                <input
                  className="ctrl font-mono"
                  style={errors.financialYear ? { borderColor: 'var(--red)' } : undefined}
                  type="text"
                  placeholder="e.g. 2026-27"
                  maxLength={7}
                  value={financialYear}
                  onChange={e => { setFinancialYear(e.target.value.replace(/[^0-9-]/g, '')); if (errors.financialYear) setErrors(p => ({ ...p, financialYear: '' })) }}
                />
                {errors.financialYear && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.financialYear}</p>}
              </div>
              */}
              <div className="fg">
                <div className="lbl">Financial Year <span className="req">*</span></div>
                <input
                  className="ctrl font-mono"
                  style={errors.financialYear ? { borderColor: 'var(--red)' } : undefined}
                  type="number"
                  placeholder="e.g. 2026"
                  value={financialYear}
                  onChange={e => { setFinancialYear(e.target.value); if (errors.financialYear) setErrors(p => ({ ...p, financialYear: '' })) }}
                />
                {errors.financialYear && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.financialYear}</p>}
              </div>
              <div className="fg">
                <div className="lbl">Exam Year <span className="req">*</span></div>
                <input
                  className="ctrl font-mono"
                  style={errors.examYear ? { borderColor: 'var(--red)' } : undefined}
                  type="number"
                  placeholder="e.g. 2027"
                  value={examYear}
                  onChange={e => { setExamYear(e.target.value); if (errors.examYear) setErrors(p => ({ ...p, examYear: '' })) }}
                />
                {errors.examYear && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.examYear}</p>}
              </div>
              <div className="fg">
                <div className="lbl">Exam Month <span className="req">*</span></div>
                <SearchSelect
                  placeholder="Select month…"
                  value={examMonth}
                  onChange={v => { setExamMonth(v); if (errors.examMonth) setErrors(p => ({ ...p, examMonth: '' })) }}
                  options={MONTHS}
                />
                {errors.examMonth && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.examMonth}</p>}
              </div>
              <div className="fg">
                <div className="lbl">Intake Sequence <span className="req">*</span></div>
                <input
                  className="ctrl"
                  style={errors.intakeSeq ? { borderColor: 'var(--red)' } : undefined}
                  type="number"
                  placeholder="e.g. 1"
                  value={intakeSeq}
                  onChange={e => { setIntakeSeq(e.target.value); if (errors.intakeSeq) setErrors(p => ({ ...p, intakeSeq: '' })) }}
                />
                <div style={{ fontSize: 11, color: 'var(--g400)', marginTop: 4 }}>Which intake this is within the financial year — e.g. 1 for the first, 2 for the second.</div>
                {errors.intakeSeq && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.intakeSeq}</p>}
              </div>
              {/* Intake Type (Spring/Fall) isn't part of the confirmed payload —
                  Exam Year + Exam Month + Intake Sequence above cover the same
                  ground using the backend's actual fields instead. Kept here
                  for reference.
              <div className="fg">
                <div className="lbl">Intake Type <span className="req">*</span></div>
                <SearchSelect
                  placeholder="Select type…"
                  value={intakeType}
                  onChange={v => { setIntakeType(v); if (errors.intakeType) setErrors(p => ({ ...p, intakeType: '' })) }}
                  options={[{ value: 'spring', label: 'Spring' }, { value: 'fall', label: 'Fall' }]}
                />
                {errors.intakeType && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.intakeType}</p>}
              </div>
              */}
              <div className="fg" style={{ gridColumn: 'span 3' }}>
                <div className="lbl">Set As</div>
                <div style={{ display: 'flex', gap: 28, marginTop: 8 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', color: 'var(--g700)' }}>
                    <input
                      type="checkbox"
                      checked={currentIntake}
                      onChange={e => setCurrentIntake(e.target.checked)}
                      style={{ width: 15, height: 15, accentColor: 'var(--b500)', cursor: 'pointer' }}
                    />
                    Academic Intake
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', color: 'var(--g700)' }}>
                    <input
                      type="checkbox"
                      checked={currentAdmissionIntake}
                      onChange={e => setCurrentAdmissionIntake(e.target.checked)}
                      style={{ width: 15, height: 15, accentColor: 'var(--b500)', cursor: 'pointer' }}
                    />
                    Admission Intake
                  </label>
                </div>
              </div>
              {/* Batch Automation isn't part of the confirmed payload — kept
                  here for reference in case the backend adds support for it
                  later.
              <div className="fg" style={{ gridColumn: 'span 3' }}>
                <div className="lbl">Batch Automation</div>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginTop: 8, cursor: 'pointer' }}>
                  <input type="checkbox" style={{ width: 15, height: 15, accentColor: 'var(--b500)', cursor: 'pointer', marginTop: 2, flexShrink: 0 }} />
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--g700)' }}>Create Batches automatically</span>
                    <div style={{ fontSize: 12, color: 'var(--g400)', marginTop: 3 }}>
                      Triggers batch creation at the back end for all active programmes linked to this intake. Individual batches can still be edited afterwards.
                    </div>
                  </div>
                </label>
              </div>
              */}
              {/* The old form had a plain "Grievance End Date" AND a separate
                  "Exam Grievance End Date" (and "Exam Grievance Start Date"),
                  but the confirmed payload only has ONE grievanceStartDate and
                  ONE grievanceEndDate. Keeping a single pair below (renamed
                  from the "Exam …" labels) and commenting out the duplicate
                  plain "Grievance End Date" so there's no confusion about
                  which one actually gets sent.
              <div className="fg"><div className="lbl">Grievance End Date</div><input className="ctrl" type="date" /></div>
              */}
              {/* "Re-entry Date" and "Late Fee Start Date" used to live here as
                  single top-level fields. The confirmed payload doesn't have
                  top-level equivalents — re-entry and late-fee dates instead
                  live per-semester inside academicCalendar (see Step 2 below:
                  Re-entry Start/Late Fee/End Date, Admission Late Fee Date).
              <div className="fg"><div className="lbl">Re-entry Date</div><input className="ctrl" type="date" /></div>
              <div className="fg"><div className="lbl">Late Fee Start Date</div><input className="ctrl" type="date" /></div>
              */}
              <div className="fg">
                <div className="lbl">Last Date for Re-registration</div>
                <input className="ctrl" type="date" value={lastDateForReRegistration} onChange={e => setLastDateForReRegistration(e.target.value)} />
              </div>
              <div className="fg">
                <div className="lbl">Grievance Start Date</div>
                <input className="ctrl" type="date" value={grievanceStartDate} onChange={e => setGrievanceStartDate(e.target.value)} />
              </div>
              <div className="fg">
                <div className="lbl">Grievance End Date</div>
                <input className="ctrl" type="date" value={grievanceEndDate} onChange={e => setGrievanceEndDate(e.target.value)} />
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <div className="sec-divider">
                1st Semester Planning Calendar
                <span className="font-medium text-g400 normal-case tracking-normal ml-2" style={{ fontSize: 'var(--fs-2xs)' }}>
                  Optional · Fill in the key dates for the first semester
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', columnGap: '3.5rem', rowGap: '1rem' }}>
                <div className="fg"><div className="lbl">Admission Start Date</div><input className="ctrl" type="date" value={admissionStartDate} onChange={e => setAdmissionStartDate(e.target.value)} /></div>
                <div className="fg"><div className="lbl">Admission Late Fee Date</div><input className="ctrl" style={errors.admissionLateFeeDate ? { borderColor: 'var(--red)' } : undefined} type="date" value={admissionLateFeeDate} onChange={e => setAdmissionLateFeeDate(e.target.value)} />{errors.admissionLateFeeDate && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.admissionLateFeeDate}</p>}</div>
                <div className="fg"><div className="lbl">Admission End Date</div><input className="ctrl" style={errors.admissionEndDate ? { borderColor: 'var(--red)' } : undefined} type="date" value={admissionEndDate} onChange={e => setAdmissionEndDate(e.target.value)} />{errors.admissionEndDate && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.admissionEndDate}</p>}</div>
                <div className="fg"><div className="lbl">Re-entry Start Date</div><input className="ctrl" type="date" value={reentryStartDate} onChange={e => setReentryStartDate(e.target.value)} /></div>
                <div className="fg"><div className="lbl">Re-entry Late Fee Date</div><input className="ctrl" style={errors.reentryLateFeeDate ? { borderColor: 'var(--red)' } : undefined} type="date" value={reentryLateFeeDate} onChange={e => setReentryLateFeeDate(e.target.value)} />{errors.reentryLateFeeDate && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.reentryLateFeeDate}</p>}</div>
                <div className="fg"><div className="lbl">Re-entry End Date</div><input className="ctrl" style={errors.reentryEndDate ? { borderColor: 'var(--red)' } : undefined} type="date" value={reentryEndDate} onChange={e => setReentryEndDate(e.target.value)} />{errors.reentryEndDate && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.reentryEndDate}</p>}</div>
                <div className="fg"><div className="lbl">Semester/Term 1 Start Date</div><input className="ctrl" style={errors.semStart ? { borderColor: 'var(--red)' } : undefined} type="date" value={semStart} onChange={e => setSemStart(e.target.value)} />{errors.semStart && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.semStart}</p>}</div>
                <div className="fg"><div className="lbl">Lump Sum Date</div><input className="ctrl" type="date" value={lumpsumDate} onChange={e => setLumpsumDate(e.target.value)} /></div>
                <div className="fg"><div className="lbl">Term 1 End Date</div><input className="ctrl" style={errors.term1EndDate ? { borderColor: 'var(--red)' } : undefined} type="date" value={term1EndDate} onChange={e => setTerm1EndDate(e.target.value)} />{errors.term1EndDate && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.term1EndDate}</p>}</div>
                <div className="fg"><div className="lbl">Term 2 Start Date</div><input className="ctrl" style={errors.term2StartDate ? { borderColor: 'var(--red)' } : undefined} type="date" value={term2StartDate} onChange={e => setTerm2StartDate(e.target.value)} />{errors.term2StartDate && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.term2StartDate}</p>}</div>
                <div className="fg"><div className="lbl">Semester/Term 2 End Date</div><input className="ctrl" style={errors.term2End ? { borderColor: 'var(--red)' } : undefined} type="date" value={term2End} onChange={e => setTerm2End(e.target.value)} />{errors.term2End && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.term2End}</p>}</div>
                <div className="fg">
                  <div className="lbl">Duration (weeks)</div>
                  <input
                    className="ctrl"
                    style={{ background: 'var(--g100)', color: calcDuration() ? 'var(--g700)' : 'var(--g400)', cursor: 'not-allowed' }}
                    type="text"
                    value={calcDuration()}
                    readOnly
                    placeholder="Set semester dates below"
                  />
                </div>
                <div className="fg"><div className="lbl">Resit Start Date</div><input className="ctrl" type="date" value={resitStartDate} onChange={e => setResitStartDate(e.target.value)} /></div>
                <div className="fg"><div className="lbl">Resit End Date</div><input className="ctrl" style={errors.resitEndDate ? { borderColor: 'var(--red)' } : undefined} type="date" value={resitEndDate} onChange={e => setResitEndDate(e.target.value)} />{errors.resitEndDate && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.resitEndDate}</p>}</div>
                <div className="fg"><div className="lbl">Final Exam Start Date</div><input className="ctrl" type="date" value={finalExamStartDate} onChange={e => setFinalExamStartDate(e.target.value)} /></div>
                <div className="fg"><div className="lbl">Final Exam End Date</div><input className="ctrl" style={errors.finalExamEndDate ? { borderColor: 'var(--red)' } : undefined} type="date" value={finalExamEndDate} onChange={e => setFinalExamEndDate(e.target.value)} />{errors.finalExamEndDate && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.finalExamEndDate}</p>}</div>
                <div className="fg"><div className="lbl">Clearance Date (80%)</div><input className="ctrl" type="date" value={clearanceDate} onChange={e => setClearanceDate(e.target.value)} /></div>
              </div>

              {/* <div className="sec-divider" style={{ marginTop: '2rem' }}>
                2nd Semester Planning Calendar
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', color: 'var(--g700)', marginLeft: 16 }}>
                  <input
                    type="checkbox"
                    checked={secondSemesterEnabled}
                    onChange={e => setSecondSemesterEnabled(e.target.checked)}
                    style={{ width: 15, height: 15, accentColor: 'var(--b500)', cursor: 'pointer' }}
                  />
                  Include a second semester calendar entry
                </label>
              </div> */}

              {secondSemesterEnabled && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', columnGap: '3.5rem', rowGap: '1rem', marginTop: '1rem' }}>
                  <div className="fg"><div className="lbl">Admission Start Date</div><input className="ctrl" type="date" value={secondAdmissionStartDate} onChange={e => setSecondAdmissionStartDate(e.target.value)} /></div>
                  <div className="fg"><div className="lbl">Admission Late Fee Date</div><input className="ctrl" style={errors.secondAdmissionLateFeeDate ? { borderColor: 'var(--red)' } : undefined} type="date" value={secondAdmissionLateFeeDate} onChange={e => setSecondAdmissionLateFeeDate(e.target.value)} />{errors.secondAdmissionLateFeeDate && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.secondAdmissionLateFeeDate}</p>}</div>
                  <div className="fg"><div className="lbl">Admission End Date</div><input className="ctrl" style={errors.secondAdmissionEndDate ? { borderColor: 'var(--red)' } : undefined} type="date" value={secondAdmissionEndDate} onChange={e => setSecondAdmissionEndDate(e.target.value)} />{errors.secondAdmissionEndDate && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.secondAdmissionEndDate}</p>}</div>
                  <div className="fg"><div className="lbl">Re-entry Start Date</div><input className="ctrl" type="date" value={secondReentryStartDate} onChange={e => setSecondReentryStartDate(e.target.value)} /></div>
                  <div className="fg"><div className="lbl">Re-entry Late Fee Date</div><input className="ctrl" style={errors.secondReentryLateFeeDate ? { borderColor: 'var(--red)' } : undefined} type="date" value={secondReentryLateFeeDate} onChange={e => setSecondReentryLateFeeDate(e.target.value)} />{errors.secondReentryLateFeeDate && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.secondReentryLateFeeDate}</p>}</div>
                  <div className="fg"><div className="lbl">Re-entry End Date</div><input className="ctrl" style={errors.secondReentryEndDate ? { borderColor: 'var(--red)' } : undefined} type="date" value={secondReentryEndDate} onChange={e => setSecondReentryEndDate(e.target.value)} />{errors.secondReentryEndDate && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.secondReentryEndDate}</p>}</div>
                  <div className="fg"><div className="lbl">Semester/Term 1 Start Date</div><input className="ctrl" style={errors.secondSemStart ? { borderColor: 'var(--red)' } : undefined} type="date" value={secondSemStart} onChange={e => setSecondSemStart(e.target.value)} />{errors.secondSemStart && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.secondSemStart}</p>}</div>
                  <div className="fg"><div className="lbl">Lump Sum Date</div><input className="ctrl" type="date" value={secondLumpsumDate} onChange={e => setSecondLumpsumDate(e.target.value)} /></div>
                  <div className="fg"><div className="lbl">Term 1 End Date</div><input className="ctrl" style={errors.secondTerm1EndDate ? { borderColor: 'var(--red)' } : undefined} type="date" value={secondTerm1EndDate} onChange={e => setSecondTerm1EndDate(e.target.value)} />{errors.secondTerm1EndDate && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.secondTerm1EndDate}</p>}</div>
                  <div className="fg"><div className="lbl">Term 2 Start Date</div><input className="ctrl" style={errors.secondTerm2StartDate ? { borderColor: 'var(--red)' } : undefined} type="date" value={secondTerm2StartDate} onChange={e => setSecondTerm2StartDate(e.target.value)} />{errors.secondTerm2StartDate && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.secondTerm2StartDate}</p>}</div>
                  <div className="fg"><div className="lbl">Semester/Term 2 End Date</div><input className="ctrl" style={errors.secondTerm2End ? { borderColor: 'var(--red)' } : undefined} type="date" value={secondTerm2End} onChange={e => setSecondTerm2End(e.target.value)} />{errors.secondTerm2End && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.secondTerm2End}</p>}</div>
                  <div className="fg"><div className="lbl">Resit Start Date</div><input className="ctrl" type="date" value={secondResitStartDate} onChange={e => setSecondResitStartDate(e.target.value)} /></div>
                  <div className="fg"><div className="lbl">Resit End Date</div><input className="ctrl" style={errors.secondResitEndDate ? { borderColor: 'var(--red)' } : undefined} type="date" value={secondResitEndDate} onChange={e => setSecondResitEndDate(e.target.value)} />{errors.secondResitEndDate && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.secondResitEndDate}</p>}</div>
                  <div className="fg"><div className="lbl">Final Exam Start Date</div><input className="ctrl" type="date" value={secondFinalExamStartDate} onChange={e => setSecondFinalExamStartDate(e.target.value)} /></div>
                  <div className="fg"><div className="lbl">Final Exam End Date</div><input className="ctrl" style={errors.secondFinalExamEndDate ? { borderColor: 'var(--red)' } : undefined} type="date" value={secondFinalExamEndDate} onChange={e => setSecondFinalExamEndDate(e.target.value)} />{errors.secondFinalExamEndDate && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.secondFinalExamEndDate}</p>}</div>
                  <div className="fg"><div className="lbl">Clearance Date (80%)</div><input className="ctrl" type="date" value={secondClearanceDate} onChange={e => setSecondClearanceDate(e.target.value)} /></div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-neu" onClick={handleClose}>Cancel</button>
          <span className="flex-1"></span>
          {step === 2 && (
            <button className="btn btn-neu" onClick={() => setStep(1)}>
              <i className="lni lni-arrow-left"></i> Back
            </button>
          )}
          {step === 1 && (
            <button className="btn btn-primary" onClick={() => { if (validate()) setStep(2) }}>
              Save & Continue <i className="lni lni-arrow-right"></i>
            </button>
          )}
          {step === 2 && (
            <button className="btn btn-primary" disabled={createIntake.isPending} onClick={handleCreate}>
              <i className="lni lni-checkmark"></i> {createIntake.isPending ? 'Saving…' : 'Save Intake'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
