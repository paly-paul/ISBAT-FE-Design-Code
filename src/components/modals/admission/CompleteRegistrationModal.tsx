'use client'
import { useState, useEffect } from 'react'
import { ModalProps } from '../types'

export interface RegistrationStudent {
  ref: string; name: string; prog: string; type: string
}

const PROFILE_DETAILS: Record<string, {
  dob: string; gender: string; nationality: string; nationalId: string
  phone: string; email: string; address: string; intake: string; campus: string; submitted: string
}> = {
  'ADM-26-0019': { dob: '22 Feb 2005', gender: 'Female', nationality: 'Ugandan', nationalId: 'CM05022212345', phone: '+256 701 556 234', email: 'esther.tk@gmail.com',        address: 'Ntinda, Kampala',     intake: 'September 2026', campus: 'Main Campus',        submitted: '3 weeks ago' },
  'ADM-26-0017': { dob: '09 Jun 2004', gender: 'Female', nationality: 'Ugandan', nationalId: 'CM04060998765', phone: '+256 772 331 890', email: 'grace.nampijja@gmail.com', address: 'Bugolobi, Kampala',   intake: 'September 2026', campus: 'City Campus',        submitted: '2 weeks ago' },
  'ADM-26-0016': { dob: '15 Oct 2003', gender: 'Male',   nationality: 'Ugandan', nationalId: 'CM03101554321', phone: '+256 704 220 117', email: 'james.okello@gmail.com',   address: 'Jinja Road, Kampala', intake: 'September 2026', campus: 'Jinja Road Campus', submitted: '5 weeks ago' },
}

const REG_CHECKLIST = [
  { label: 'Provisional Admission Letter issued',                 result: 'done'    as const },
  { label: 'Registration fee ($250) confirmed',                   result: 'done'    as const },
  { label: 'Academic documents uploaded',                         result: 'done'    as const },
  { label: 'Original certificates (UNEB) — verify at final stage', result: 'pending' as const },
  { label: 'UNEB external verification',                          result: 'pending' as const },
]

interface Props extends ModalProps {
  student: RegistrationStudent | null
  onOnboard: () => void
}

export function CompleteRegistrationModal({ isOpen, onClose, student, onOnboard }: Props) {
  const [admissionType, setAdmissionType] = useState('Regular Entry (Semester 1)')
  const [paymentType, setPaymentType] = useState('Cash')
  const [receiptBook, setReceiptBook] = useState('')
  const [showBankFields, setShowBankFields] = useState(false)

  useEffect(() => {
    if (student) {
      setAdmissionType(student.type === 'Lateral Entry' ? 'Lateral Entry' : 'Regular Entry (Semester 1)')
      setPaymentType('Cash'); setReceiptBook(''); setShowBankFields(false)
    }
  }, [student])

  if (!isOpen || !student) return null

  function handlePaymentTypeChange(val: string) {
    setPaymentType(val); setShowBankFields(val === 'Bank Transfer')
  }

  const details = PROFILE_DETAILS[student.ref] ?? PROFILE_DETAILS['ADM-26-0019']
  const [firstName, ...rest] = student.name.split(' ')
  const lastName = rest.join(' ')
  const slug = student.name.toLowerCase().split(' ').join('.')
  const numSuffix = student.ref.split('-').pop()?.padStart(4, '0') ?? '0000'
  const studentNumber = `ISB/2026/${numSuffix}`
  const universityEmail = `${slug}.${numSuffix}@students.isbatuniversity.ac.ug`

  return (
    <div className="modal-overlay open">
      <div className="modal modal-80 modal-flex" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr">
          <div className="modal-title flex items-center gap-2">
            <i className="lni lni-pencil"></i> Completing Registration: <span className="text-b600">{student.name}</span>
          </div>
          <button className="modal-close" onClick={onClose}><i className="lni lni-close"></i></button>
        </div>

        <div className="modal-scroll">
          <div className="g2" style={{ gap: 28, alignItems: 'start' }}>
            {/* LEFT: Student Profile */}
            <div>
              <h3 className="text-sm font-semibold text-g700 mb-3"><i className="lni lni-user mr-1" /> Student Profile</h3>

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
                <div className="fg"><label className="lbl">App. Ref</label><input className="ctrl font-mono" readOnly value={student.ref || ''} /></div>
                <div className="fg"><label className="lbl">Admission Type</label><input className="ctrl" readOnly value={student.type || ''} /></div>
                <div className="fg"><label className="lbl">Programme</label><input className="ctrl" readOnly value={student.prog || ''} /></div>
                <div className="fg"><label className="lbl">Intake</label><input className="ctrl" readOnly value={details.intake || ''} /></div>
                <div className="fg"><label className="lbl">Campus</label><input className="ctrl" readOnly value={details.campus || ''} /></div>
                <div className="fg"><label className="lbl">Submitted</label><input className="ctrl" readOnly value={details.submitted || ''} /></div>
              </div>
            </div>

            {/* RIGHT: Registration content */}
            <div>
              <div className="fg">
                <label className="lbl">Admission Type <span className="req">*</span></label>
                <select className="ctrl" value={admissionType} onChange={e => setAdmissionType(e.target.value)}>
                  <option>Regular Entry (Semester 1)</option><option>Lateral Entry</option><option>Credit Transfer</option><option>Existing Student</option>
                </select>
              </div>

              <div className="flex flex-col gap-2 mt-2">
                <div className="flex justify-between text-sm"><span className="text-g600">Semester 1 Tuition</span><span className="font-semibold text-g800">As per fee structure</span></div>
                <div className="flex justify-between text-sm"><span className="text-g600">Registration Fee (paid)</span><span className="font-semibold flex items-center gap-1" style={{ color: 'var(--green)' }}>$250 <i className="lni lni-checkmark-circle" /></span></div>
                <div className="flex justify-between text-sm"><span className="text-g600">Semester Entry Fee (paid)</span><span className="font-semibold flex items-center gap-1" style={{ color: 'var(--green)' }}>Included in $250 <i className="lni lni-checkmark-circle" /></span></div>
                <div className="flex justify-between text-sm"><span className="text-g600">Library / IT Levy</span><span className="font-semibold text-g800">150,000 UGX</span></div>
                <div className="sec-divider my-1" />
                <div className="flex justify-between text-sm"><span className="font-semibold text-g800">Entry Point</span><span className="font-semibold text-b600">Semester 1</span></div>
              </div>

              <p className="text-xs font-bold uppercase tracking-wide mt-4 mb-2" style={{ color: 'var(--b600)' }}>Registration Payment Details</p>
              <div className="g2">
                <div className="fg">
                  <label className="lbl">Payment Type <span className="req">*</span></label>
                  <select className="ctrl" value={paymentType} onChange={e => handlePaymentTypeChange(e.target.value)}>
                    <option>Cash</option><option>Bank Transfer</option><option>Mobile Money</option>
                  </select>
                </div>
                <div className="fg">
                  <label className="lbl">Receipt Book <span className="req">*</span></label>
                  <select className="ctrl" value={receiptBook} onChange={e => setReceiptBook(e.target.value)}>
                    <option value="">-- Select Receipt Book --</option>
                    <option>RB-2026-001</option><option>RB-2026-002</option><option>RB-2026-003</option>
                  </select>
                </div>
              </div>
              {showBankFields && (
                <div className="g2">
                  <div className="fg"><label className="lbl">Bank Name</label><input className="ctrl" placeholder="e.g. Stanbic Bank" /></div>
                  <div className="fg"><label className="lbl">Transaction Reference</label><input className="ctrl" placeholder="e.g. TXN-889234" /></div>
                </div>
              )}

              <div className="rounded-lg p-3 mt-2 bg-g100 border border-g200">
                <p className="text-[10px] font-bold uppercase tracking-wide mb-2 text-g400">Auto-generated on Registration</p>
                <div className="fg"><label className="lbl">Student Number</label><input className="ctrl bg-white" readOnly value={studentNumber || ''} /></div>
                <div className="fg mb-0"><label className="lbl">University Email</label><input className="ctrl bg-white" readOnly value={universityEmail || ''} /></div>
              </div>

              <h3 className="text-sm font-semibold text-g700 mb-3 mt-5"><i className="lni lni-bookmark mr-1" /> Final Documentation Check</h3>
              <div className="flex flex-col gap-2 mb-4">
                {REG_CHECKLIST.map((item, i) => {
                  const isDone = item.result === 'done'
                  const tone = isDone ? 'success-box' : 'warn-box'
                  const icon = isDone ? 'lni-checkmark-circle' : 'lni-hourglass'
                  const iconColor = isDone ? 'var(--green)' : 'var(--g900)'
                  const tag = isDone ? 'DONE' : 'PENDING'
                  return (
                    <div key={i} className={tone} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span className="flex items-center gap-2 text-sm text-g900" style={{ fontWeight: 500 }}><i className={`lni ${icon}`} style={{ color: iconColor }} /> {item.label}</span>
                      <span className="badge badge-grey" style={{ color: 'var(--g900)' }}>{tag}</span>
                    </div>
                  )
                })}
              </div>

              <div className="info-box bg-b50 border border-b200 rounded-lg p-3">
                <p className="text-sm font-medium text-b700 mb-1"><i className="lni lni-information mr-1" /> On <strong>Complete Registration</strong>, the system will automatically:</p>
                <ul className="text-xs text-g600 list-disc ml-4 space-y-1">
                  <li>Create student record in <span className="font-mono text-xs px-1.5 py-0.5 rounded" style={{ background: 'var(--b100)', color: 'var(--b700)' }}>T_Student</span></li>
                  <li>Set student status = <strong>Active</strong></li>
                  <li>Send welcome email with login credentials</li>
                  <li>Initiate ISLANDA access ID card</li>
                  <li>Queue biometric access setup</li>
                  <li>Issue Final Admission Letter</li>
                </ul>
              </div>

              <button className="btn btn-success w-full mt-4" onClick={onOnboard}>
                <i className="lni lni-checkmark-circle mr-1" /> Complete Registration &amp; Onboard Student
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
