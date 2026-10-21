'use client'
import { useState } from 'react'
import { ModalProps } from '../types'
import { SuccessPopup } from '../shared/SuccessPopup'
import { FailurePopup } from '../shared/FailurePopup'
import { DocumentPreviewModal } from '../shared/DocumentPreviewModal'
import { applicantProfileHref } from '@/lib/applicantProfileLink'
import { useVettingApplicationDetail, useWaitApplication } from '@/hooks/admission/useVetting'
import { NO_CURRENT_INTAKE_MESSAGE, NOT_CURRENT_INTAKE_MESSAGE, VetApplicationInput } from '@/lib/api/admission/vetting'
import { useCurrentAdmissionIntake } from '@/hooks/academic/useIntakes'
import { AuthError } from '@/lib/api/client'
import { formatDate } from '@/lib/date'

// A friendlier label than the raw documentType string from the wire
// ("NationalId" → "National ID").
const DOCUMENT_LABELS: Record<string, string> = {
  NationalId: 'National ID',
  Passport: 'Passport',
  Visa: 'Visa',
  Photo: 'Passport Photo',
}

// Read-only value, same label/value treatment as ViewApplicantModal — the
// old read-only inputs looked editable.
function Field({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div className="vd-field-lbl">{label}</div>
      <div className="vd-field-val tabular-nums">{value}</div>
    </div>
  )
}

// Display value for an optional text field: "—" for null, blank, or the
// literal string "null" some admission endpoints send.
// The API sends either the label ("Male") or the backend code — 0 = Male,
// 1 = Female, 2 = Other. Codes used to be shown raw ("0", "1").
const GENDER_LABELS = ['Male', 'Female', 'Other']
function genderText(g: number | string | null | undefined): string {
  if (g == null || g === '') return ''
  const code = typeof g === 'number' ? g : /^\d+$/.test(g.trim()) ? +g : null
  return code != null ? (GENDER_LABELS[code] ?? String(g)) : String(g).trim()
}

function orDash(value: string | null | undefined): string {
  const v = value?.trim()
  return v && v.toLowerCase() !== 'null' ? v : '—'
}

interface Props extends ModalProps {
  applicationGuid: string | null
  vetApplication: {
    mutate: (variables: { applicationGuid: string; input: VetApplicationInput }, options?: { onSuccess?: () => void; onError?: (error: Error) => void }) => void
    isPending: boolean
  }
  onReject: () => void
  // The vet and wait endpoints have no permission check server-side (see
  // post-vet-application.md), so the UI is the only gate. Defaults to true.
  canVet?: boolean
  // False when opened from the Waiting List — the application is already
  // waiting, so only Approve/Reject are offered. Defaults to true.
  allowWait?: boolean
}

const WAIT_REMARKS_MAX = 500

export function VettingReviewModal({ isOpen, onClose, showToast, applicationGuid, vetApplication, onReject, canVet = true, allowWait = true }: Props) {
  const { data: detail, isLoading, isError, error } = useVettingApplicationDetail(applicationGuid, isOpen)
  const waitApplication = useWaitApplication()

  const intakeDisplay = detail
    ? String(detail.intakeName || detail.intakeCode || detail.intake || '—')
    : '—'

  // Approve (action 2) is only accepted for the current admission intake
  // (2026-10 handoff). Work it out up front so the button can say why it's
  // off instead of failing on click. Only blocks on a confirmed answer — while
  // loading or if the lookup fails, Approve stays on and the server decides
  // (its message still shows in the failure popup).
  const currentIntake = useCurrentAdmissionIntake(isOpen)
  const approveBlockedReason: string | null = !detail || !currentIntake.isSuccess
    ? null
    : !currentIntake.data
      ? NO_CURRENT_INTAKE_MESSAGE
      : detail.intakeGuid && detail.intakeGuid !== currentIntake.data.intakeGuid
        ? `${NOT_CURRENT_INTAKE_MESSAGE} This application is for ${intakeDisplay}; the current admission intake is ${currentIntake.data.intakeCode} — ${currentIntake.data.description}.`
        : null

  const [remarks, setRemarks] = useState('')
  const [approved, setApproved] = useState(false)
  const [waited, setWaited] = useState(false)
  const [failure, setFailure] = useState<string | null>(null)
  // Documents and qualification proofs open in an in-page preview (PDF/image
  // inline, with Download) — a plain link just downloaded the file.
  const [preview, setPreview] = useState<{ url: string; title: string } | null>(null)

  if (!isOpen || !applicationGuid) return null

  function handleClose() { setApproved(false); setWaited(false); setFailure(null); setRemarks(''); setPreview(null); onClose() }

  function handleWait() {
    if (!applicationGuid) return
    waitApplication.mutate(
      { applicationGuid, remarks: remarks.trim() || null },
      {
        onSuccess: () => { setWaited(true); showToast('Applicant placed on hold — waiting for original documents', 'amber') },
        onError: (err: Error) => setFailure(err.message || 'Failed to place application on hold.'),
      },
    )
  }

  function handleApprove() {
    if (!applicationGuid) return
    vetApplication.mutate(
      // action: 2 = Approved — RegistrarDecision now matches the persisted
      // status enum's own numbering (2=Approved, 3=Rejected), not the old
      // separate 1/2 request-side enum.
      { applicationGuid, input: { action: 2, justificationReg: null } },
      {
        onSuccess: () => setApproved(true),
        onError: (err: Error) => setFailure(err.message || 'Failed to approve application.'),
      },
    )
  }

  if (approved && detail) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <SuccessPopup title="Application Approved!" subtitle={`${detail.firstName} ${detail.lastName}'s provisional admission letter has been issued.`} onClose={handleClose} />
        </div>
      </div>
    )
  }

  if (waited && detail) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <SuccessPopup title="Application On Hold" subtitle={`${detail.firstName} ${detail.lastName} is now waiting on original documents.`} onClose={handleClose} />
        </div>
      </div>
    )
  }

  if (failure) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <FailurePopup title="Action Failed" subtitle={failure} onClose={() => setFailure(null)} />
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <FailurePopup
            title="Couldn't Load Application"
            subtitle={error instanceof AuthError ? (error.message || 'Failed to load application details.') : 'Failed to load application details.'}
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
            <div className="modal-title"><i className="lni lni-eye"></i> Reviewing Application</div>
            <button className="modal-close" onClick={handleClose}><i className="lni lni-close"></i></button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 240 }}>
            <span style={{ color: 'var(--g400)' }}>Loading application details…</span>
          </div>
        </div>
      </div>
    )
  }

  const missingDocs = detail.documents.filter(d => !d.uploaded)
  const uploadedDocs = detail.documents.length - missingDocs.length
  const withProof = detail.qualifications.filter(q => q.proofUrl).length
  const fullName = orDash(`${detail.firstName ?? ''} ${detail.lastName ?? ''}`)
  const docTitle = (type: string) => DOCUMENT_LABELS[type] ?? type

  // What the registrar weighs before deciding, summarised up front so it
  // doesn't have to be pieced together from the panels below.
  const checks: { tone: 'ok' | 'warn' | 'bad'; icon: string; text: string }[] = [
    detail.documents.length > 0 && {
      tone: missingDocs.length === 0 ? 'ok' as const : 'warn' as const,
      icon: missingDocs.length === 0 ? 'lni-checkmark-circle' : 'lni-warning',
      text: `${uploadedDocs}/${detail.documents.length} documents`,
    },
    {
      tone: detail.qualifications.length > 0 && withProof === detail.qualifications.length ? 'ok' as const : 'warn' as const,
      icon: detail.qualifications.length > 0 && withProof === detail.qualifications.length ? 'lni-checkmark-circle' : 'lni-warning',
      text: detail.qualifications.length === 0 ? 'No qualifications' : `${withProof}/${detail.qualifications.length} qualification proofs`,
    },
    {
      tone: detail.feePaid ? 'ok' as const : 'warn' as const,
      icon: detail.feePaid ? 'lni-checkmark-circle' : 'lni-warning',
      text: detail.feePaid ? 'Fee paid' : 'Fee not paid',
    },
    approveBlockedReason
      ? { tone: 'bad' as const, icon: 'lni-lock', text: 'Not current intake' }
      : currentIntake.isSuccess && currentIntake.data
        ? { tone: 'ok' as const, icon: 'lni-checkmark-circle', text: 'Current intake' }
        : null,
  ].filter((c): c is { tone: 'ok' | 'warn' | 'bad'; icon: string; text: string } => !!c)

  const initials = fullName === '—'
    ? '?'
    : fullName.split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase()

  return (
    <div className="modal-overlay open">
      <div className="modal modal-80 modal-flex" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr modal-hdr-blue">
          <div className="modal-title flex items-center gap-2">
            <i className="lni lni-eye" aria-hidden="true"></i> Review Application
          </div>
          <button className="modal-close" onClick={handleClose} aria-label="Close"><i className="lni lni-close"></i></button>
        </div>

        <div className="modal-scroll">
          {/* Who is applying, for what — before any detail. */}
          <div className="vd-hero">
            <div className="vd-avatar" aria-hidden="true">{initials}</div>
            <div className="vd-hero-main">
              <div className="vd-hero-name flex items-center gap-2 flex-wrap">
                {fullName}
                {orDash(detail.admissionType) !== '—' && <span className="badge badge-blue">{detail.admissionType}</span>}
              </div>
              <div className="vd-hero-meta">
                <span>{orDash(detail.appRefNo)}</span>
                <span><i className="lni lni-graduation" aria-hidden="true" />{orDash(detail.programName)}</span>
                {orDash(detail.campusName) !== '—' && <span><i className="lni lni-home" aria-hidden="true" />{detail.campusName}</span>}
                {intakeDisplay !== '—' && <span><i className="lni lni-calendar" aria-hidden="true" />{intakeDisplay}</span>}
              </div>
            </div>
            <div className="vd-hero-side">
              <div className="vd-checks" aria-label="Review summary">
                {checks.map(c => (
                  <span key={c.text} className={`vd-check ${c.tone}`}><i className={`lni ${c.icon}`} aria-hidden="true" /> {c.text}</span>
                ))}
              </div>
              <a
                href={applicantProfileHref({
                  ref: detail.appRefNo,
                  name: `${detail.firstName} ${detail.lastName}`,
                  programme: detail.programName,
                  type: detail.admissionType,
                  dob: detail.dob ?? undefined,
                  gender: genderText(detail.gender) || undefined,
                  nationality: orDash(detail.nationality) !== '—' ? orDash(detail.nationality) : undefined,
                  nationalId: detail.nationalId ?? undefined,
                  phone: detail.phone ?? undefined,
                  email: detail.emailId ?? undefined,
                  intake: intakeDisplay !== '—' ? intakeDisplay : undefined,
                  campus: detail.campusName,
                  submitted: detail.submittedDate,
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
            {/* LEFT: the applicant */}
            <div>
              <section className="vd-panel">
                <h3 className="vd-panel-title"><i className="lni lni-folder" aria-hidden="true" /> Application</h3>
                <div className="vd-fields">
                  <Field label="App. Ref" value={orDash(detail.appRefNo)} />
                  <Field label="Submitted" value={detail.submittedDate ? formatDate(detail.submittedDate) : '—'} />
                  <Field label="Admission Type" value={orDash(detail.admissionType)} />
                  <Field label="Intake" value={intakeDisplay} />
                </div>
              </section>

              <section className="vd-panel">
                <h3 className="vd-panel-title"><i className="lni lni-user" aria-hidden="true" /> Personal Information</h3>
                <div className="vd-fields">
                  <Field label="First Name" value={orDash(detail.firstName)} />
                  <Field label="Last Name" value={orDash(detail.lastName)} />
                  <Field label="Date of Birth" value={detail.dob ? formatDate(detail.dob) : '—'} />
                  <Field label="Gender" value={genderText(detail.gender) || '—'} />
                  {/* Both looked up from the application's country (vetting.ts):
                      Nationality is the demonym, Country the country name. */}
                  <Field label="Nationality" value={orDash(detail.nationality)} />
                  <Field label="Country" value={orDash(detail.countryName)} />
                  <Field label="National ID" value={orDash(detail.nationalId)} />
                  <Field label="Phone" value={orDash(detail.phone)} />
                  <Field label="Email" value={orDash(detail.emailId)} />
                </div>
              </section>
            </div>

            {/* RIGHT: the evidence, then the hold note */}
            <div>
              <section className="vd-panel">
                <h3 className="vd-panel-title">
                  <i className="lni lni-folder" aria-hidden="true" /> Uploaded Documents
                  {detail.documents.length > 0 && <span className="vd-count">{uploadedDocs} of {detail.documents.length}</span>}
                </h3>
                {detail.documents.length === 0 ? (
                  <p className="text-sm text-g500">No documents required for this application.</p>
                ) : (
                  <div className="vd-list">
                    {detail.documents.map(doc => (
                      <div key={doc.documentType} className={`vd-doc${doc.uploaded ? '' : ' missing'}`}>
                        <span className="vd-doc-icon">{/* lni-file doesn't exist in LineIcons 4 — it rendered as a blank tile. */}
                          <i className={`lni ${doc.uploaded ? 'lni-folder' : 'lni-question-circle'}`} aria-hidden="true" /></span>
                        <div className="vd-doc-body">
                          <div className="vd-doc-name">{docTitle(doc.documentType)}</div>
                          <div className="vd-doc-sub">{doc.uploaded ? 'Uploaded' : 'Missing'}</div>
                        </div>
                        {doc.uploaded && doc.url && (
                          <button type="button" className="btn btn-neu btn-sm" onClick={() => setPreview({ url: doc.url!, title: docTitle(doc.documentType) })} aria-label={`View ${docTitle(doc.documentType)}`}>
                            <i className="lni lni-eye" aria-hidden="true" /> View
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {missingDocs.length > 0 && (
                  <div className="warn-box mt-3">
                    <i className="lni lni-warning text-amber-700" aria-hidden="true" style={{ marginTop: 2 }} />
                    <span className="text-sm">{missingDocs.length} document{missingDocs.length > 1 ? 's' : ''} missing ({missingDocs.map(d => docTitle(d.documentType)).join(', ')}). You may approve provisionally &mdash; student must submit within 7 days.</span>
                  </div>
                )}
              </section>

              <section className="vd-panel">
                <h3 className="vd-panel-title">
                  <i className="lni lni-book" aria-hidden="true" /> Qualifications
                  {detail.qualifications.length > 0 && <span className="vd-count">{withProof} of {detail.qualifications.length} with proof</span>}
                </h3>
                {detail.qualifications.length === 0 ? (
                  <p className="text-sm text-g500">No qualifications submitted yet.</p>
                ) : (
                  <div className="vd-list">
                    {detail.qualifications.map(q => (
                      <div key={q.applicationQualGuid} className={`vd-doc${q.proofUrl ? '' : ' missing'}`}>
                        <span className="vd-doc-icon"><i className={`lni ${q.proofUrl ? 'lni-book' : 'lni-question-circle'}`} aria-hidden="true" /></span>
                        <div className="vd-doc-body">
                          {/* institution is free text by convention only (e.g. "O Level" /
                              "A Level") — there is no separate structured type column. */}
                          <div className="vd-doc-name">{orDash(q.institution)} &middot; {orDash(q.university)}</div>
                          <div className="vd-doc-sub">
                            Grade {orDash(q.grade)} &middot; {q.passYear ?? '—'} &middot; {q.yearsTaken != null ? `${q.yearsTaken} yrs` : '—'}
                            {!q.proofUrl && <> &middot; No proof</>}
                          </div>
                        </div>
                        {q.proofUrl && (
                          <button type="button" className="btn btn-neu btn-sm" onClick={() => setPreview({ url: q.proofUrl!, title: `Proof — ${q.institution} · ${q.university}` })} aria-label={`View proof for ${q.institution}`}>
                            <i className="lni lni-eye" aria-hidden="true" /> View Proof
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {allowWait && canVet && (
                <section className="vd-panel accent">
                  <h3 className="vd-panel-title"><i className="lni lni-timer" aria-hidden="true" /> Put on Hold</h3>
                  <div className="fg">
                    <label className="lbl" htmlFor="vetting-hold-remarks">
                      Hold Remarks <span className="text-g500" style={{ fontWeight: 400 }}>(optional · {remarks.trim().length}/{WAIT_REMARKS_MAX})</span>
                    </label>
                    {/* POST .../wait caps remarks at 500 chars. */}
                    <textarea id="vetting-hold-remarks" className="ctrl" rows={3} maxLength={WAIT_REMARKS_MAX} placeholder="e.g. Awaiting original transcript from the applicant" value={remarks} onChange={e => setRemarks(e.target.value)} />
                    <p className="text-xs text-g600 mt-1.5">Saved with &ldquo;Wait for Original Documents&rdquo; and shown on the Waiting List. Rejecting asks for its own reason.</p>
                  </div>
                </section>
              )}
            </div>
          </div>
        </div>

        <div className="modal-footer" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 10 }}>
          {approveBlockedReason && canVet && (
            <div className="warn-box" role="note" style={{ fontSize: 13 }}>
              <i className="lni lni-lock" aria-hidden="true" style={{ marginTop: 2 }}></i>
              <span>{approveBlockedReason} {allowWait ? 'You can still reject it or place it on hold.' : 'You can still reject it.'}</span>
            </div>
          )}
          {!canVet ? (
            <div className="info-box" role="note" style={{ fontSize: 13 }}>
              <i className="lni lni-eye" aria-hidden="true"></i>
              <span>View only. You don&apos;t have permission to approve, reject or hold applications.</span>
            </div>
          ) : (
            // Reject sits apart on the left; Approve is the one primary action.
            <div className="vd-actions">
              <button type="button" className="btn btn-danger" onClick={onReject}><i className="lni lni-close" aria-hidden="true" /> Reject Application</button>
              <div className="vd-actions-end">
                {allowWait && (
                  <button type="button" className="btn btn-neu" disabled={waitApplication.isPending} onClick={handleWait}>
                    <i className="lni lni-timer" aria-hidden="true" /> {waitApplication.isPending ? 'Saving…' : 'Wait for Original Documents'}
                  </button>
                )}
                <button type="button" className="btn btn-success" disabled={vetApplication.isPending || !!approveBlockedReason} title={approveBlockedReason ?? undefined} onClick={handleApprove}>
                  <i className="lni lni-checkmark" aria-hidden="true" /> {vetApplication.isPending ? 'Approving…' : 'Approve & Issue Provisional Letter'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <DocumentPreviewModal
        isOpen={!!preview}
        onClose={() => setPreview(null)}
        url={preview?.url ?? null}
        title={preview?.title}
      />
    </div>
  )
}
