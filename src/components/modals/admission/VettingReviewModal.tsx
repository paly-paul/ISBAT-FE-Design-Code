'use client'
import { useState, useEffect } from 'react'
import { ModalProps } from '../types'

export interface VettingApplicant {
  ref: string; name: string; programme: string; type: string; docs: string; submitted: string
}

const PROFILE_DETAILS: Record<string, {
  dob: string; gender: string; nationality: string; nationalId: string
  phone: string; email: string; address: string; intake: string; campus: string
}> = {
  'APP-2025-0041': { dob: '12 Mar 2006', gender: 'Female', nationality: 'Ugandan', nationalId: 'CM06031201234', phone: '+256 701 234 567', email: 'nakato.sarah@gmail.com',      address: 'Plot 14, Ntinda, Kampala',        intake: 'September 2026', campus: 'Main Campus' },
  'APP-2025-0042': { dob: '04 Jul 2005', gender: 'Male',   nationality: 'Ugandan', nationalId: 'CM05070409876', phone: '+256 772 555 981', email: 'ouma.brian@gmail.com',        address: 'Kireka Road, Kampala',            intake: 'September 2026', campus: 'City Campus' },
  'APP-2025-0043': { dob: '21 Nov 2005', gender: 'Female', nationality: 'Ugandan', nationalId: 'CM05112156432', phone: '+256 704 112 233', email: 'ainembabazi.grace@gmail.com', address: 'Bugolobi, Kampala',               intake: 'September 2026', campus: 'Main Campus' },
  'APP-2025-0044': { dob: '30 Jan 2004', gender: 'Male',   nationality: 'Ugandan', nationalId: 'CM04013098765', phone: '+256 755 667 788', email: 'mugisha.david@gmail.com',    address: 'Jinja Road, Kampala',             intake: 'September 2026', campus: 'Jinja Road Campus' },
  'APP-2025-0045': { dob: '17 Sep 2006', gender: 'Female', nationality: 'Ugandan', nationalId: 'CM06091734521', phone: '+256 706 998 122', email: 'kyomuhendo.faith@gmail.com', address: 'Mengo, Kampala',                  intake: 'September 2026', campus: 'Main Campus' },
}

const DOCUMENTS = [
  { id: 'olevel',   label: 'O-Level Certificate', sub: 'UNEB UCE · 244KB',  icon: 'lni-certificate',     status: 'uploaded' as const },
  { id: 'alevel',   label: 'A-Level Certificate', sub: 'UNEB UACE · 312KB', icon: 'lni-certificate',     status: 'uploaded' as const },
  { id: 'passport', label: 'Passport Photo',       sub: 'Uploaded · 89KB',  icon: 'lni-image',           status: 'uploaded' as const },
  { id: 'natid',    label: 'National ID',          sub: 'Not uploaded',     icon: 'lni-question-circle', status: 'missing'  as const },
]

const CHECKLIST = [
  { label: 'O-Level: Min 5 passes incl. English & Math', result: 'pass'    as const },
  { label: 'A-Level: 2 Principal Passes (Degree entry)', result: 'pass'    as const },
  { label: 'National ID / Passport document missing',    result: 'fail'    as const },
  { label: 'Application fee paid / exemption valid',     result: 'pass'    as const },
  { label: 'UNEB verification pending',                  result: 'pending' as const },
]

interface Props extends ModalProps {
  applicant: VettingApplicant | null
  onReject: () => void
}

export function VettingReviewModal({ isOpen, onClose, showToast, applicant, onReject }: Props) {
  const [remarks, setRemarks] = useState('')

  useEffect(() => {
    if (applicant) {
      setRemarks('A-Level grades meet Degree entry standards. National ID missing — applicant to provide within 7 working days. Recommend provisional approval.')
    }
  }, [applicant])

  if (!isOpen || !applicant) return null

  const details = PROFILE_DETAILS[applicant.ref] ?? PROFILE_DETAILS['APP-2025-0041']
  const [firstName, ...rest] = applicant.name.split(' ')
  const lastName = rest.join(' ')

  return (
    <div className="modal-overlay open">
      <div className="modal modal-80 modal-flex" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr">
          <div className="modal-title flex items-center gap-2">
            <i className="lni lni-eye"></i> Reviewing: {applicant.name} &middot; {applicant.programme}
            <span className="badge badge-blue">{applicant.type}</span>
          </div>
          <button className="modal-close" onClick={onClose}><i className="lni lni-close"></i></button>
        </div>

        <div className="modal-scroll">
          <div className="g2" style={{ gap: 28, alignItems: 'start' }}>
            {/* LEFT: Applicant Profile */}
            <div>
              <h3 className="text-sm font-semibold text-g700 mb-3"><i className="lni lni-user mr-1" /> Applicant Profile</h3>

              <div className="sec-divider">Personal Information</div>
              <div className="g2 mb-4">
                <div className="fg"><label className="lbl">First Name</label><input className="ctrl" readOnly value={firstName || ''} /></div>
                <div className="fg"><label className="lbl">Last Name</label><input className="ctrl" readOnly value={lastName || '—'} /></div>
                <div className="fg"><label className="lbl">Date of Birth</label><input className="ctrl" readOnly value={details.dob || ''} /></div>
                <div className="fg"><label className="lbl">Gender</label><input className="ctrl" readOnly value={details.gender || ''} /></div>
                <div className="fg"><label className="lbl">Nationality</label><input className="ctrl" readOnly value={details.nationality || ''} /></div>
                <div className="fg"><label className="lbl">National ID</label><input className="ctrl" readOnly value={details.nationalId || ''} /></div>
                <div className="fg"><label className="lbl">Phone</label><input className="ctrl" readOnly value={details.phone || ''} /></div>
                <div className="fg"><label className="lbl">Email</label><input className="ctrl" readOnly value={details.email || ''} /></div>
                <div className="fg" style={{ gridColumn: 'span 2' }}><label className="lbl">Address</label><input className="ctrl" readOnly value={details.address || ''} /></div>
              </div>

              <div className="sec-divider">Application Details</div>
              <div className="g2">
                <div className="fg"><label className="lbl">App. Ref</label><input className="ctrl font-mono" readOnly value={applicant.ref || ''} /></div>
                <div className="fg"><label className="lbl">Admission Type</label><input className="ctrl" readOnly value={applicant.type || ''} /></div>
                <div className="fg"><label className="lbl">Programme</label><input className="ctrl" readOnly value={applicant.programme || ''} /></div>
                <div className="fg"><label className="lbl">Intake</label><input className="ctrl" readOnly value={details.intake || ''} /></div>
                <div className="fg"><label className="lbl">Campus</label><input className="ctrl" readOnly value={details.campus || ''} /></div>
                <div className="fg"><label className="lbl">Submitted</label><input className="ctrl" readOnly value={applicant.submitted || ''} /></div>
              </div>
            </div>

            {/* RIGHT: Review content */}
            <div>
              <h3 className="text-sm font-semibold text-g700 mb-3"><i className="lni lni-folder mr-1" /> Uploaded Documents</h3>
              <div className="grid grid-cols-2 gap-3">
                {DOCUMENTS.map(doc => {
                  const isMissing = doc.status === 'missing'
                  return (
                    <div key={doc.id} className={`border rounded-[10px] overflow-hidden ${isMissing ? 'border-clr-red-bd bg-clr-red-bg' : 'border-g200 bg-white'}`}>
                      <div className={`h-28 flex items-center justify-center ${isMissing ? 'bg-clr-red-bg' : 'bg-b50'}`}>
                        <i className={`lni ${isMissing ? 'lni-question-circle text-clr-red' : `${doc.icon} text-b500`} text-3xl`} />
                      </div>
                      <div className="p-3">
                        <p className={`text-sm font-medium mb-0.5 ${isMissing ? 'text-red-700' : 'text-g800'}`}>{doc.label}</p>
                        <p className={`text-xs mb-2 ${isMissing ? 'text-red-500' : 'text-g400'}`}>{doc.sub}</p>
                        {isMissing ? <span className="badge badge-red">Missing</span> : (
                          <div className="flex gap-2 items-center">
                            <button className="btn btn-sm text-xs"><i className="lni lni-eye" /> View</button>
                            <button
                              style={{
                                width: 30, height: 30, borderRadius: 6, border: 'none',
                                background: 'var(--green)', color: '#fff', display: 'inline-flex',
                                alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0,
                              }}
                              title="Verify"
                            >
                              <i className="lni lni-checkmark" style={{ fontSize: 13 }} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              <h3 className="text-sm font-semibold text-g700 mb-3 mt-5"><i className="lni lni-bookmark mr-1" /> Minimum Standards Compliance</h3>
              <div className="flex flex-col gap-2 mb-4">
                {CHECKLIST.map((item, i) => {
                  const tone = item.result === 'pass' ? 'success-box' : item.result === 'fail' ? 'danger-box' : ''
                  const icon = item.result === 'pass' ? 'lni-checkmark-circle' : item.result === 'fail' ? 'lni-close' : 'lni-hourglass'
                  const iconColor = item.result === 'pass' ? 'var(--green)' : item.result === 'fail' ? 'var(--red)' : 'var(--g900)'
                  const tagClass = item.result === 'pass' ? 'badge-green' : item.result === 'fail' ? 'badge-red' : 'badge-grey'
                  const tag = item.result === 'pass' ? 'PASS' : item.result === 'fail' ? 'FAIL' : 'PENDING'
                  return (
                    <div key={i} className={tone} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      ...(item.result === 'pending' ? { background: 'var(--g100)', border: '1.5px solid var(--g200)', borderRadius: 'var(--rxs)', padding: '12px 14px' } : {}),
                    }}>
                      <span className="flex items-center gap-2 text-sm text-g900" style={{ fontWeight: 500 }}><i className={`lni ${icon}`} style={{ color: iconColor }} /> {item.label}</span>
                      <span className={`badge ${tagClass}`} style={item.result === 'pending' ? { color: 'var(--g900)' } : undefined}>{tag}</span>
                    </div>
                  )
                })}
              </div>

              <div className="warn-box mb-4">
                <i className="lni lni-warning mr-2 text-amber-700" />
                <span className="text-sm">1 document missing. You may approve provisionally &mdash; student must submit within 7 days.</span>
              </div>

              <div className="fg">
                <label className="lbl">Vetting Remarks <span className="req">*</span></label>
                <textarea className="ctrl" rows={3} placeholder="Enter vetting notes..." value={remarks} onChange={e => setRemarks(e.target.value)} />
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 8 }}>
          <div className="grid grid-cols-3 gap-3">
            <button className="btn btn-amber w-full justify-center" onClick={() => showToast('Applicant placed on hold — waiting for original documents', 'amber')}><i className="lni lni-timer" /> Wait for Original Documents</button>
            <button className="btn btn-success w-full justify-center" onClick={() => { showToast('Application approved — provisional letter issued', 'success'); onClose() }}><i className="lni lni-checkmark" /> Approve &amp; Issue Provisional Letter</button>
            <button className="btn btn-danger w-full justify-center" onClick={onReject}><i className="lni lni-close" /> Reject Application</button>
          </div>
          <p className="text-xs text-g400 text-center">Sets T_Application.Action = 1 (Wait) / 2 (Approved) / 3 (Rejected)</p>
        </div>
      </div>
    </div>
  )
}
