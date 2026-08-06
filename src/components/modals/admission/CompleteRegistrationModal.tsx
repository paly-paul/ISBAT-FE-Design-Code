'use client'
import { useState, useEffect } from 'react'
import { ModalProps } from '../types'
import { SearchSelect } from '@/components/SearchSelect'
import { applicantProfileHref } from '@/lib/applicantProfileLink'

export interface RegistrationStudent {
  ref: string; name: string; prog: string; type: string
}

const PROFILE_DETAILS: Record<string, {
  dob: string; gender: string; nationality: string; nationalId: string
  phone: string; email: string; address: string; intake: string; campus: string; faculty: string; submitted: string
}> = {
  'ADM-26-0019': { dob: '22 Feb 2005', gender: 'Female', nationality: 'Ugandan', nationalId: 'CM05022212345', phone: '+256 701 556 234', email: 'esther.tk@gmail.com',        address: 'Ntinda, Kampala',     intake: 'September 2026', campus: 'Main Campus',        faculty: 'Faculty of Computing & Informatics', submitted: '3 weeks ago' },
  'ADM-26-0017': { dob: '09 Jun 2004', gender: 'Female', nationality: 'Ugandan', nationalId: 'CM04060998765', phone: '+256 772 331 890', email: 'grace.nampijja@gmail.com', address: 'Bugolobi, Kampala',   intake: 'September 2026', campus: 'City Campus',        faculty: 'Faculty of Business & Management',   submitted: '2 weeks ago' },
  'ADM-26-0016': { dob: '15 Oct 2003', gender: 'Male',   nationality: 'Ugandan', nationalId: 'CM03101554321', phone: '+256 704 220 117', email: 'james.okello@gmail.com',   address: 'Jinja Road, Kampala', intake: 'September 2026', campus: 'Jinja Road Campus', faculty: 'Faculty of Computing & Informatics', submitted: '5 weeks ago' },
}

const SEMESTERS = ['Semester 1', 'Semester 2', 'Semester 3']
const BATCHES   = ['BSCVFXS27DA', 'BSCVFXS27DB', 'BBAMGT27EA', 'ITINFO27DA']

// Mock stand-in for the real Finance Ledger master's priority ordering.
const LEDGER_PRIORITY = '1. Registration Fee → 2. Tuition → 3. Library / IT Levy'

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
  const [semester, setSemester] = useState('')
  const [batch, setBatch] = useState('')
  const [aptechExemption, setAptechExemption] = useState(false)
  const [isRefugeeStudent, setIsRefugeeStudent] = useState(false)
  const [refugeeId, setRefugeeId] = useState('')

  useEffect(() => {
    if (student) {
      setAdmissionType(student.type === 'Lateral Entry' ? 'Lateral Entry' : 'Regular Entry (Semester 1)')
      setPaymentType('Cash'); setReceiptBook(''); setShowBankFields(false)
      setSemester(''); setBatch(''); setAptechExemption(false)
      setIsRefugeeStudent(false); setRefugeeId('')
    }
  }, [student])

  if (!isOpen || !student) return null

  function handlePaymentTypeChange(val: string) {
    setPaymentType(val); setShowBankFields(val === 'Bank Transfer')
  }

  const details = PROFILE_DETAILS[student.ref] ?? PROFILE_DETAILS['ADM-26-0019']
  const [firstName, ...rest] = student.name.split(' ')
  const lastName = rest.join(' ')

  return (
    <div className="modal-overlay open">
      <div className="modal modal-80 modal-flex" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr modal-hdr-blue">
          <div className="modal-title flex items-center gap-2">
            <i className="lni lni-pencil"></i> Completing Registration: <span className="text-b600">{student.name}</span>
          </div>
          <button className="modal-close" onClick={onClose}><i className="lni lni-close"></i></button>
        </div>

        <div className="modal-scroll">
          <div className="g2" style={{ gap: 28, alignItems: 'start' }}>
            {/* LEFT: Student Profile */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-g700"><i className="lni lni-user mr-1" /> Student Profile</h3>
                <a
                  href={applicantProfileHref({
                    ref: student.ref,
                    name: student.name,
                    programme: student.prog,
                    type: student.type,
                    dob: details.dob,
                    gender: details.gender,
                    nationality: details.nationality,
                    nationalId: details.nationalId,
                    phone: details.phone,
                    email: details.email,
                    address: details.address,
                    intake: details.intake,
                    campus: details.campus,
                    submitted: details.submitted,
                  })}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1"
                  style={{ fontSize: 'var(--fs-xs)', color: 'var(--b600)', fontWeight: 600 }}
                >
                  <i className="lni lni-external-link" /> View Full Profile
                </a>
              </div>

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
                <SearchSelect
                  options={['Regular Entry (Semester 1)', 'Lateral Entry', 'Credit Transfer', 'Existing Student']}
                  value={admissionType}
                  onChange={setAdmissionType}
                />
              </div>

              <label className="flex items-center gap-2 mt-2" style={{ fontSize: 'var(--fs-sm)', cursor: 'pointer' }}>
                <input type="checkbox" checked={aptechExemption} onChange={e => setAptechExemption(e.target.checked)} style={{ width: 16, height: 16 }} />
                <span className="font-medium text-g700">Aptech Credit Exemption Student?</span>
              </label>

              <label className="flex items-center gap-2 mt-2" style={{ fontSize: 'var(--fs-sm)', cursor: 'pointer' }}>
                <input type="checkbox" checked={isRefugeeStudent} onChange={e => setIsRefugeeStudent(e.target.checked)} style={{ width: 16, height: 16 }} />
                <span className="font-medium text-g700">Refugee Student?</span>
              </label>
              {isRefugeeStudent && (
                <div className="rounded-lg p-3 mt-2 bg-b50 border border-b200">
                  <div className="fg mb-2">
                    <label className="lbl">Refugee ID <span className="req">*</span></label>
                    <input className="ctrl bg-white" placeholder="Refugee ID number" value={refugeeId} onChange={e => setRefugeeId(e.target.value)} />
                  </div>
                  <div className="g3">
                    <div><span className="text-xs text-g400 block">Faculty</span><span className="text-sm font-semibold text-g800">{details.faculty}</span></div>
                    <div><span className="text-xs text-g400 block">Intake</span><span className="text-sm font-semibold text-g800">{details.intake}</span></div>
                    <div><span className="text-xs text-g400 block">Campus</span><span className="text-sm font-semibold text-g800">{details.campus}</span></div>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-2 mt-3">
                <div className="flex justify-between text-sm"><span className="text-g600">Semester 1 Tuition</span><span className="font-semibold text-g800">As per fee structure</span></div>
                <div className="flex justify-between text-sm"><span className="text-g600">Registration Fee (paid)</span><span className="font-semibold flex items-center gap-1" style={{ color: 'var(--green)' }}>$250 <i className="lni lni-checkmark-circle" /></span></div>
                <div className="flex justify-between text-sm"><span className="text-g600">Semester Entry Fee (paid)</span><span className="font-semibold flex items-center gap-1" style={{ color: 'var(--green)' }}>Included in $250 <i className="lni lni-checkmark-circle" /></span></div>
                <div className="flex justify-between text-sm"><span className="text-g600">Library / IT Levy</span><span className="font-semibold text-g800">150,000 UGX</span></div>
                <div className="flex justify-between text-sm"><span className="text-g600">Ledger Priority</span><span className="font-semibold text-g800 text-right" style={{ maxWidth: '60%' }}>{LEDGER_PRIORITY}</span></div>
                <div className="sec-divider my-1" />
                <div className="flex justify-between text-sm"><span className="font-semibold text-g800">Entry Point</span><span className="font-semibold text-b600">Semester 1</span></div>
              </div>

              <p className="text-xs font-bold uppercase tracking-wide mt-4 mb-2" style={{ color: 'var(--b600)' }}>Registration Payment Details</p>
              <div className="g2">
                <div className="fg">
                  <label className="lbl">Semester <span className="req">*</span></label>
                  <SearchSelect placeholder="-- Select Semester --" options={SEMESTERS} value={semester} onChange={setSemester} />
                </div>
                <div className="fg">
                  <label className="lbl">Batch <span className="req">*</span></label>
                  <SearchSelect placeholder="-- Select Batch --" options={BATCHES} value={batch} onChange={setBatch} />
                </div>
                <div className="fg">
                  <label className="lbl">Payment Type <span className="req">*</span></label>
                  <SearchSelect options={['Cash', 'Bank Transfer', 'Mobile Money']} value={paymentType} onChange={handlePaymentTypeChange} />
                </div>
                <div className="fg">
                  <label className="lbl">Receipt Book <span className="req">*</span></label>
                  <SearchSelect
                    placeholder="-- Select Receipt Book --"
                    options={['RB-2026-001', 'RB-2026-002', 'RB-2026-003']}
                    value={receiptBook}
                    onChange={setReceiptBook}
                  />
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
                <div className="fg">
                  <label className="lbl">Student Number</label>
                  <input className="ctrl bg-white text-g400 italic" readOnly value="Generated once registration is completed" />
                </div>
                <div className="fg mb-0">
                  <label className="lbl">University Email</label>
                  <input className="ctrl bg-white text-g400 italic" readOnly value="Generated once registration is completed" />
                </div>
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
