'use client'
import { useEffect, useState } from 'react'
import { ModalProps } from '../types'
import { FailurePopup } from '../shared/FailurePopup'
import { SearchSelect } from '@/components/SearchSelect'
import { applicantProfileHref } from '@/lib/applicantProfileLink'
import { useRegistrationDetail, useRegisterStudent, RegisterStudentResponse } from '@/hooks/admission/useRegistrarDesk'
import { AuthError } from '@/lib/api/client'
import { scrollToFirstError } from '@/lib/scrollToFirstError'
import { formatDate } from '@/lib/date'

interface Props extends ModalProps {
  applicationGuid: string | null
  onRegistered: (result: RegisterStudentResponse) => void
}

// "—" for null, blank, or the literal string "null" some admission endpoints send.
function orDash(value: string | null | undefined): string {
  const v = value?.trim()
  return v && v.toLowerCase() !== 'null' ? v : '—'
}

// Read-only value — same label/value treatment as VettingReviewModal; the
// old read-only inputs looked editable.
function Field({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div className="vd-field-lbl">{label}</div>
      <div className="vd-field-val tabular-nums">{value}</div>
    </div>
  )
}

// Real now — per registrar-desk-api-docs.html. Admission Type and Address
// are deliberately dropped from both cards (frontend notes: not part of
// this view). Everything under "Registration Payment Details" renders as
// plain read-only labels, never as pickers — it's a record of a payment
// already made in Payment Console, not a form filled in here. The only
// genuinely editable fields are Registration Type, Aptech, and Refugee/
// Refugee ID — the actual POST /register body.
export function CompleteRegistrationModal({ isOpen, onClose, showToast, applicationGuid, onRegistered }: Props) {
  const { data: detail, isLoading, isError, error } = useRegistrationDetail(applicationGuid, isOpen && !!applicationGuid)
  const registerStudent = useRegisterStudent()

  const [registrationTypeId, setRegistrationTypeId] = useState('')
  const [isRefugee, setIsRefugee] = useState(false)
  const [refugeeId, setRefugeeId] = useState('')
  const [aptech, setAptech] = useState(false)
  const [failure, setFailure] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Prefill from whatever's already on file for this application — the
  // registrar can still change these before submitting.
  useEffect(() => {
    if (!isOpen || !detail) return
    setIsRefugee(detail.refugee)
    setRefugeeId(detail.refugeeId ?? '')
    setRegistrationTypeId('')
    setAptech(false)
    setFailure(null)
  }, [isOpen, detail])

  if (!isOpen || !applicationGuid) return null

  function handleClose() {
    setRegistrationTypeId(''); setIsRefugee(false); setRefugeeId(''); setAptech(false); setFailure(null); setErrors({})
    onClose()
  }

  const registrationTypeOptions = (detail?.admissionTypes ?? []).map(t => ({ value: String(t.intType), label: t.registrationType }))

  function handleSubmit() {
    if (!applicationGuid) return
    const e: Record<string, string> = {}
    if (!registrationTypeId) e.registrationTypeId = 'Please select a Registration Type'
    if (isRefugee && !refugeeId.trim()) e.refugeeId = 'Please enter the Refugee ID'
    setErrors(e)
    if (Object.keys(e).length) { scrollToFirstError(e); return }
    registerStudent.mutate(
      {
        applicationGuid,
        input: {
          registrationTypeId: +registrationTypeId,
          isRefugee,
          refugeeId: isRefugee ? refugeeId.trim() : null,
          aptech,
        },
      },
      {
        onSuccess: result => onRegistered(result),
        onError: (err: Error) => {
          const code = err instanceof AuthError ? err.code : undefined
          setFailure(err.message || `Failed to register student${code ? ` (${code})` : ''}. Please try again.`)
        },
      },
    )
  }

  if (failure) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 420 }}>
          <FailurePopup title="Couldn't Register Student" subtitle={failure} onClose={() => setFailure(null)} />
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 420 }}>
          <FailurePopup
            title="Couldn't Load Registration Detail"
            subtitle={error instanceof AuthError ? (error.message || 'Failed to load registration details.') : 'Failed to load registration details.'}
            onClose={handleClose}
          />
        </div>
      </div>
    )
  }

  if (isLoading || !detail) {
    return (
      <div className="modal-overlay open">
        <div className="modal modal-80 modal-flex" onClick={e => e.stopPropagation()}>
          <div className="modal-hdr modal-hdr-blue">
            <div className="modal-title"><i className="lni lni-graduation" aria-hidden="true"></i> Completing Registration</div>
            <button className="modal-close" onClick={handleClose} aria-label="Close"><i className="lni lni-close"></i></button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 240 }}>
            <span style={{ color: 'var(--g400)' }}>Loading registration details…</span>
          </div>
        </div>
      </div>
    )
  }

  const money = (n: number | null | undefined) => (n != null ? n.toLocaleString() : '—')
  const initials = orDash(detail.studentName) === '—'
    ? '?'
    : detail.studentName.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase()

  // Registration fee due vs what Payment Console recorded.
  const due = detail.regFee
  const paid = detail.regPaymentAmount
  const balance = due != null && paid != null ? due - paid : null
  const paidTone = balance == null ? '' : balance <= 0 ? 'ok' : 'bad'

  // The three things the registrar checks before registering.
  const checks: { tone: 'ok' | 'warn' | 'bad'; icon: string; text: string }[] = [
    detail.registrationFeeConfirmed
      ? { tone: 'ok', icon: 'lni-checkmark-circle', text: 'Reg. fee confirmed' }
      : { tone: 'bad', icon: 'lni-warning', text: 'Reg. fee not confirmed' },
    detail.provisionalLetterIssued
      ? { tone: 'ok', icon: 'lni-checkmark-circle', text: 'Provisional letter issued' }
      : { tone: 'warn', icon: 'lni-warning', text: 'Letter not issued' },
    detail.academicDocumentsVerified
      ? { tone: 'ok', icon: 'lni-checkmark-circle', text: 'Documents verified' }
      : { tone: 'warn', icon: 'lni-warning', text: 'Documents pending' },
  ]

  return (
    <div className="modal-overlay open">
      <div className="modal modal-80 modal-flex" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr modal-hdr-blue">
          <div className="modal-title flex items-center gap-2">
            <i className="lni lni-graduation" aria-hidden="true"></i> Complete Registration
          </div>
          <button className="modal-close" onClick={handleClose} aria-label="Close"><i className="lni lni-close"></i></button>
        </div>

        <div className="modal-scroll">
          {/* Who is being registered, before any detail. */}
          <div className="vd-hero">
            <div className="vd-avatar" aria-hidden="true">{initials}</div>
            <div className="vd-hero-main">
              <div className="vd-hero-name">{orDash(detail.studentName)}</div>
              <div className="vd-hero-meta">
                <span>{orDash(detail.appRefNo)}</span>
                <span><i className="lni lni-graduation" aria-hidden="true" />{orDash(detail.programName)}</span>
                {orDash(detail.campusName) !== '—' && <span><i className="lni lni-home" aria-hidden="true" />{detail.campusName}</span>}
                {orDash(detail.intakeCode) !== '—' && <span><i className="lni lni-calendar" aria-hidden="true" />Intake {detail.intakeCode}</span>}
              </div>
            </div>
            <div className="vd-hero-side">
              <div className="vd-checks" aria-label="Registration checks">
                {checks.map(c => (
                  <span key={c.text} className={`vd-check ${c.tone}`}><i className={`lni ${c.icon}`} aria-hidden="true" /> {c.text}</span>
                ))}
              </div>
              <a
                href={applicantProfileHref({
                  ref: detail.appRefNo,
                  name: detail.studentName,
                  programme: detail.programName ?? undefined,
                  dob: detail.dob ?? undefined,
                  gender: detail.gender ?? undefined,
                  nationality: detail.nationality ?? undefined,
                  nationalId: detail.nationalId ?? undefined,
                  phone: detail.phone ?? undefined,
                  email: detail.emailId ?? undefined,
                  intake: detail.intakeCode ?? undefined,
                  campus: detail.campusName ?? undefined,
                  submitted: detail.submitted,
                })}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1"
                style={{ fontSize: 'var(--fs-xs)', color: 'var(--b600)', fontWeight: 600 }}
              >
                <i className="lni lni-external-link" aria-hidden="true" /> View Full Profile
              </a>
            </div>
          </div>

          <div className="g2" style={{ gap: 20, alignItems: 'start' }}>
            {/* LEFT: the application (read-only). Admission Type is
                deliberately dropped per registrar-desk-api-docs.html. */}
            <div>
              <section className="vd-panel">
                <h3 className="vd-panel-title"><i className="lni lni-folder" aria-hidden="true" /> Application</h3>
                <div className="vd-fields">
                  <Field label="App. Ref" value={orDash(detail.appRefNo)} />
                  <Field label="Submitted" value={formatDate(detail.submitted)} />
                  {/* Pre-assigned by admissions, not chosen here. */}
                  <Field label="Semester" value={orDash(detail.semesterName)} />
                  <Field label="Batch" value={orDash(detail.batchName)} />
                </div>
              </section>

              <section className="vd-panel">
                <h3 className="vd-panel-title"><i className="lni lni-user" aria-hidden="true" /> Personal Information</h3>
                <div className="vd-fields">
                  <Field label="First Name" value={orDash(detail.firstName)} />
                  <Field label="Last Name" value={orDash(detail.lastName)} />
                  <Field label="Date of Birth" value={formatDate(detail.dob)} />
                  <Field label="Gender" value={orDash(detail.gender)} />
                  <Field label="Nationality" value={orDash(detail.nationality)} />
                  <Field label="National ID" value={orDash(detail.nationalId)} />
                  <Field label="Phone" value={orDash(detail.phone)} />
                  <Field label="Email" value={orDash(detail.emailId)} />
                </div>
              </section>
            </div>

            {/* RIGHT: the payment on record (Payment Console took it — a
                record, not inputs), then the actual register form. */}
            <div>
              <section className="vd-panel">
                <h3 className="vd-panel-title"><i className="lni lni-wallet" aria-hidden="true" /> Registration Payment</h3>
                <div className="vd-due">
                  <div className="vd-due-box">
                    <div className="vd-due-lbl">Registration Fee</div>
                    <div className="vd-due-num">{money(due)}</div>
                  </div>
                  <div className={`vd-due-box ${paidTone}`}>
                    <div className="vd-due-lbl">
                      {paidTone === 'ok' ? 'Paid in full' : paidTone === 'bad' ? `Paid · ${money(balance)} short` : 'Amount Paid'}
                    </div>
                    <div className="vd-due-num">{money(paid)}</div>
                  </div>
                </div>
                <div className="vd-fields">
                  <Field label="Payment Type" value={orDash(detail.regPaymentTypeName)} />
                  <Field label="Payment Date" value={formatDate(detail.regPaymentDate)} />
                  <Field label="Receipt" value={[detail.regReceiptBookCode, detail.regReceiptNo].map(orDash).filter(v => v !== '—').join(' · ') || '—'} />
                </div>
                <div className="vd-lines">
                  <div className="vd-line"><span>Admission Fee</span><b>{money(detail.admissionFee)}</b></div>
                  {detail.feeLines.map(line => (
                    <div key={line.ledgerGuid} className="vd-line">
                      <span>{orDash(line.ledgerName)}</span>
                      <b>{money(line.amount)} {line.currencyName ?? ''}</b>
                    </div>
                  ))}
                </div>
              </section>

              <section className="vd-panel accent">
                <h3 className="vd-panel-title"><i className="lni lni-pencil" aria-hidden="true" /> Register Student</h3>
                {registrationTypeOptions.length === 0 && (
                  <div className="warn-box mb-3">
                    <i className="lni lni-warning" aria-hidden="true" style={{ marginTop: 2 }} />
                    <span className="text-sm">No Registration Types are configured yet — an administrator needs to set these up in Registration Type Master before this application can be registered.</span>
                  </div>
                )}
                <div className="fg">
                  <label className="lbl">Registration Type <span className="req">*</span></label>
                  <SearchSelect placeholder="-- Select Registration Type --" options={registrationTypeOptions} value={registrationTypeId} onChange={v => { setRegistrationTypeId(v); setErrors(p => ({ ...p, registrationTypeId: '' })) }} />
                  {errors.registrationTypeId
                    ? <p className="field-err" style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.registrationTypeId}</p>
                    // post-register-student.md: Lateral Entry / Credit
                    // Exemption make the student liable for an extra fee.
                    : <p className="text-xs text-g600 mt-1.5">Lateral Entry and Credit Exemption add a fee that Finance calculates.</p>}
                </div>

                {isRefugee && (
                  <div className="fg mt-3">
                    <label className="lbl" htmlFor="reg-refugee-id">Refugee ID <span className="req">*</span></label>
                    <input id="reg-refugee-id" className="ctrl" placeholder="Refugee ID number" value={refugeeId} onChange={e => { setRefugeeId(e.target.value); setErrors(p => ({ ...p, refugeeId: '' })) }} style={errors.refugeeId ? { borderColor: 'var(--red)' } : undefined} />
                    {errors.refugeeId && <p className="field-err" style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.refugeeId}</p>}
                  </div>
                )}
              </section>
            </div>
          </div>
        </div>

        {/* The action used to sit at the bottom of the scrolling right
            column, with no Cancel — now a fixed footer like other modals. */}
        <div className="modal-footer" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 10 }}>
          {!detail.registrationFeeConfirmed && (
            <div className="warn-box" role="note" style={{ fontSize: 13 }}>
              <i className="lni lni-warning" aria-hidden="true" style={{ marginTop: 2 }} />
              <span>Registration Fee isn&apos;t confirmed yet — the server will reject registration until Payment Console shows it as paid.</span>
            </div>
          )}
          <div className="vd-actions">
            <button type="button" className="btn btn-neu" onClick={handleClose}>Cancel</button>
            <div className="vd-actions-end">
              <button type="button" className="btn btn-success" disabled={registerStudent.isPending} onClick={handleSubmit}>
                <i className="lni lni-checkmark-circle" aria-hidden="true" /> {registerStudent.isPending ? 'Registering…' : 'Complete Registration & Onboard Student'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
