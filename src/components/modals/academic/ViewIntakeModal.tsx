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

  const [saved, setSaved]   = useState(false)
  const [failure, setFailure] = useState<string | null>(null)

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

  const [calendarEntries, setCalendarEntries] = useState<CalendarEntryForm[]>([])
  const [activeSection, setActiveSection] = useState<'basic' | number>('basic')

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
    setActiveSection('basic')

    setErrors({})
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



  if (!isOpen) return null

  function handleClose() {
    setActiveSection('basic')
    setSaved(false)
    setFailure(null)
    setErrors({})
    onClose()
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
          <div className="modal-hdr modal-hdr-blue">
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


  return (
    <div className="modal-overlay open" id="intake-view-modal">
      <div className="modal modal-80 modal-flex" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr modal-hdr-blue">
          <div className="modal-title"><i className="lni lni-eye"></i> View Intake — <span className="font-mono">{intake.intakeCode}</span></div>
          <button className="modal-close" onClick={handleClose}><i className="lni lni-close"></i></button>
        </div>

        <div className="fsm-layout" style={{ borderTop: '1px solid var(--g200)' }}>
          {/* Left sidebar */}
          <div className="fsm-sidebar">
            <div style={{ padding: '14px 14px 6px', fontSize: 10.5, fontWeight: 700, color: 'var(--g400)', textTransform: 'uppercase', letterSpacing: '.07em' }}>
              Basic Details
            </div>
            <div style={{ padding: '0 8px', marginBottom: 12 }}>
              <div
                onClick={() => setActiveSection('basic')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '9px 10px', borderRadius: 'var(--rsm)',
                  background: activeSection === 'basic' ? 'var(--b500)' : 'transparent',
                  color: activeSection === 'basic' ? '#fff' : 'var(--g700)',
                  cursor: 'pointer', transition: 'background .15s',
                }}
              >
                <div style={{ width: 30, height: 30, borderRadius: '50%', background: activeSection === 'basic' ? 'rgba(255,255,255,.2)' : 'var(--b100)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <i className="lni lni-information" style={{ fontSize: 13, color: activeSection === 'basic' ? '#fff' : 'var(--b600)' }}></i>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, lineHeight: 1.3 }}>Intake Details</div>
                </div>
              </div>
            </div>

            <div style={{ padding: '0 14px 6px', fontSize: 10.5, fontWeight: 700, color: 'var(--g400)', textTransform: 'uppercase', letterSpacing: '.07em' }}>
              Semesters <span style={{ color: 'var(--b500)' }}>({calendarEntries.length})</span>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px 8px' }}>
              {calendarEntries.map((entry, i) => (
                <div
                  key={entry.id}
                  onClick={() => setActiveSection(i)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '9px 10px', borderRadius: 'var(--rsm)', marginBottom: 2,
                    background: activeSection === i ? 'var(--b500)' : 'transparent',
                    color: activeSection === i ? '#fff' : 'var(--g700)',
                    cursor: 'pointer', transition: 'background .15s',
                  }}
                >
                  <div style={{ width: 30, height: 30, borderRadius: '50%', background: activeSection === i ? 'rgba(255,255,255,.2)' : 'var(--b100)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <i className="lni lni-calendar" style={{ fontSize: 13, color: activeSection === i ? '#fff' : 'var(--b600)' }}></i>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, lineHeight: 1.3 }}>Semester {i + 1}</div>
                    <div style={{ fontSize: 11, opacity: .65, lineHeight: 1.3 }}>{entry.semStart ? `Starts ${entry.semStart}` : 'No dates set'}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right panel */}
          <div className="fsm-main" style={{ padding: '24px' }}>
            {activeSection === 'basic' ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, padding: '12px 16px', background: 'var(--b50)', borderRadius: 'var(--rsm)', border: '1.5px solid var(--b100)' }}>
                  <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--b100)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <i className="lni lni-information" style={{ color: 'var(--b600)', fontSize: 17 }}></i>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--b800)' }}>
                      Intake Details
                    </div>
                    <div style={{ fontSize: 11.5, color: 'var(--g400)' }}>
                      General information about this intake
                    </div>
                  </div>
                </div>
                
                <div style={{ padding: '0 8px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', rowGap: '20px', columnGap: '24px' }}>
                  <div>
                    <div style={{ fontSize: '11.5px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--g500)', letterSpacing: '0.04em', marginBottom: '4px' }}>Description</div>
                    <div style={{ fontSize: '14px', color: 'var(--g900)', fontWeight: 500 }}>{description || '—'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11.5px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--g500)', letterSpacing: '0.04em', marginBottom: '4px' }}>Financial Year</div>
                    <div style={{ fontSize: '14px', color: 'var(--g900)', fontWeight: 500 }}>{financialYear || '—'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11.5px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--g500)', letterSpacing: '0.04em', marginBottom: '4px' }}>Exam Year</div>
                    <div style={{ fontSize: '14px', color: 'var(--g900)', fontWeight: 500 }}>{examYear || '—'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11.5px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--g500)', letterSpacing: '0.04em', marginBottom: '4px' }}>Exam Month</div>
                    <div style={{ fontSize: '14px', color: 'var(--g900)', fontWeight: 500 }}>{MONTHS.find(m => m.value === String(examMonth))?.label || '—'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11.5px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--g500)', letterSpacing: '0.04em', marginBottom: '4px' }}>Intake Sequence</div>
                    <div style={{ fontSize: '14px', color: 'var(--g900)', fontWeight: 500 }}>{INTAKE_SEQUENCES.find(s => s.value === String(intakeSeq))?.label || '—'}</div>
                  </div>
                  <div style={{ gridColumn: 'span 3' }}>
                    <div style={{ fontSize: '11.5px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--g500)', letterSpacing: '0.04em', marginBottom: '4px' }}>Set As</div>
                    <div style={{ display: 'flex', gap: 16, marginTop: 4 }}>
                      {currentIntake ? <span className="badge badge-green">Academic Intake</span> : <span className="badge badge-neu">Not Academic Intake</span>}
                      {currentAdmissionIntake ? <span className="badge badge-green">Admission Intake</span> : <span className="badge badge-neu">Not Admission Intake</span>}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11.5px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--g500)', letterSpacing: '0.04em', marginBottom: '4px' }}>Last Date for Re-registration</div>
                    <div style={{ fontSize: '14px', color: 'var(--g900)', fontWeight: 500 }}>{lastDateForReRegistration || '—'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11.5px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--g500)', letterSpacing: '0.04em', marginBottom: '4px' }}>Grievance Start Date</div>
                    <div style={{ fontSize: '14px', color: 'var(--g900)', fontWeight: 500 }}>{grievanceStartDate || '—'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11.5px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--g500)', letterSpacing: '0.04em', marginBottom: '4px' }}>Grievance End Date</div>
                    <div style={{ fontSize: '14px', color: 'var(--g900)', fontWeight: 500 }}>{grievanceEndDate || '—'}</div>
                  </div>
                </div>
              </>
            ) : (() => {
              const active = calendarEntries[activeSection as number]
              if (!active) return null
              
              return (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, padding: '12px 16px', background: 'var(--b50)', borderRadius: 'var(--rsm)', border: '1.5px solid var(--b100)' }}>
                    <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--b100)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <i className="lni lni-calendar" style={{ color: 'var(--b600)', fontSize: 17 }}></i>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--b800)' }}>
                        {activeSection === 0 ? '1st Semester Planning Calendar' : `Semester ${(activeSection as number) + 1} Planning Calendar`}
                      </div>
                      <div style={{ fontSize: 11.5, color: 'var(--g400)' }}>
                        Semester ${(activeSection as number) + 1} of {calendarEntries.length}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', rowGap: '20px', columnGap: '24px', paddingBottom: 24, paddingLeft: 8, paddingRight: 8 }}>
                    <div>
                      <div style={{ fontSize: '11.5px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--g500)', letterSpacing: '0.04em', marginBottom: '4px' }}>Admission Start Date</div>
                      <div style={{ fontSize: '14px', color: 'var(--g900)', fontWeight: 500 }}>{active.admissionStartDate || '—'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11.5px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--g500)', letterSpacing: '0.04em', marginBottom: '4px' }}>Admission Late Fee Date</div>
                      <div style={{ fontSize: '14px', color: 'var(--g900)', fontWeight: 500 }}>{active.admissionLateFeeDate || '—'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11.5px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--g500)', letterSpacing: '0.04em', marginBottom: '4px' }}>Admission End Date</div>
                      <div style={{ fontSize: '14px', color: 'var(--g900)', fontWeight: 500 }}>{active.admissionEndDate || '—'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11.5px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--g500)', letterSpacing: '0.04em', marginBottom: '4px' }}>Re-entry Start Date</div>
                      <div style={{ fontSize: '14px', color: 'var(--g900)', fontWeight: 500 }}>{active.reentryStartDate || '—'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11.5px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--g500)', letterSpacing: '0.04em', marginBottom: '4px' }}>Re-entry Late Fee Date</div>
                      <div style={{ fontSize: '14px', color: 'var(--g900)', fontWeight: 500 }}>{active.reentryLateFeeDate || '—'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11.5px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--g500)', letterSpacing: '0.04em', marginBottom: '4px' }}>Re-entry End Date</div>
                      <div style={{ fontSize: '14px', color: 'var(--g900)', fontWeight: 500 }}>{active.reentryEndDate || '—'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11.5px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--g500)', letterSpacing: '0.04em', marginBottom: '4px' }}>Semester/Term 1 Start Date</div>
                      <div style={{ fontSize: '14px', color: 'var(--g900)', fontWeight: 500 }}>{active.semStart || '—'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11.5px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--g500)', letterSpacing: '0.04em', marginBottom: '4px' }}>Lump Sum Date</div>
                      <div style={{ fontSize: '14px', color: 'var(--g900)', fontWeight: 500 }}>{active.lumpsumDate || '—'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11.5px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--g500)', letterSpacing: '0.04em', marginBottom: '4px' }}>Term 1 End Date</div>
                      <div style={{ fontSize: '14px', color: 'var(--g900)', fontWeight: 500 }}>{active.term1EndDate || '—'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11.5px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--g500)', letterSpacing: '0.04em', marginBottom: '4px' }}>Term 2 Start Date</div>
                      <div style={{ fontSize: '14px', color: 'var(--g900)', fontWeight: 500 }}>{active.term2StartDate || '—'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11.5px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--g500)', letterSpacing: '0.04em', marginBottom: '4px' }}>Semester/Term 2 End Date</div>
                      <div style={{ fontSize: '14px', color: 'var(--g900)', fontWeight: 500 }}>{active.term2End || '—'}</div>
                    </div>
                    {activeSection === 0 && (
                      <div>
                        <div style={{ fontSize: '11.5px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--g500)', letterSpacing: '0.04em', marginBottom: '4px' }}>Duration (weeks)</div>
                        <div style={{ fontSize: '14px', color: 'var(--g900)', fontWeight: 500 }}>{calcDuration() || '—'}</div>
                      </div>
                    )}
                    <div>
                      <div style={{ fontSize: '11.5px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--g500)', letterSpacing: '0.04em', marginBottom: '4px' }}>Resit Start Date</div>
                      <div style={{ fontSize: '14px', color: 'var(--g900)', fontWeight: 500 }}>{active.resitStartDate || '—'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11.5px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--g500)', letterSpacing: '0.04em', marginBottom: '4px' }}>Resit End Date</div>
                      <div style={{ fontSize: '14px', color: 'var(--g900)', fontWeight: 500 }}>{active.resitEndDate || '—'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11.5px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--g500)', letterSpacing: '0.04em', marginBottom: '4px' }}>Final Exam Start Date</div>
                      <div style={{ fontSize: '14px', color: 'var(--g900)', fontWeight: 500 }}>{active.finalExamStartDate || '—'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11.5px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--g500)', letterSpacing: '0.04em', marginBottom: '4px' }}>Final Exam End Date</div>
                      <div style={{ fontSize: '14px', color: 'var(--g900)', fontWeight: 500 }}>{active.finalExamEndDate || '—'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11.5px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--g500)', letterSpacing: '0.04em', marginBottom: '4px' }}>Clearance Date (80%)</div>
                      <div style={{ fontSize: '14px', color: 'var(--g900)', fontWeight: 500 }}>{active.clearanceDate || '—'}</div>
                    </div>
                  </div>
                </>
              )
            })()}
          </div>
        </div>

        <div className="modal-footer" style={{ borderTop: '1px solid var(--g200)' }}>
          <button className="btn btn-neu" onClick={handleClose}>Cancel</button>
          <span className="flex-1"></span>
          <button className="btn btn-primary" onClick={handleClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
