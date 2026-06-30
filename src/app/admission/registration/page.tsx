'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Toast } from '@/components/Toast'
import { ScrollTable } from '@/components/ScrollTable'
import { ActionMenu } from '@/components/ActionMenu'
import { OnboardModal } from '@/components/modals/admission/OnboardModal'

const REG_PIPELINE = [
  { label: 'App. Payment',  status: 'done',   note: '23 paid' },
  { label: 'App. Filing',   status: 'done',   note: '20 filed' },
  { label: 'Vetting',       status: 'done',   note: '18 cleared' },
  { label: 'Reg. Payment',  status: 'active', note: '$250 check' },
  { label: 'Registration',  status: '',       note: "Registrar's Desk" },
]

const REG_ROWS = [
  { ref: 'ADM-26-0019', name: 'Esther Tumukunde', prog: 'BSCS', type: 'Regular',       fee: 'Paid',     canReg: true },
  { ref: 'ADM-26-0017', name: 'Grace Nampijja',   prog: 'BBA',  type: 'Lateral Entry', fee: 'Paid',     canReg: true },
  { ref: 'ADM-26-0016', name: 'James Okello',      prog: 'BSIT', type: 'Regular',       fee: 'Not Paid', canReg: false },
]

const DOC_CHECKLIST = [
  'Original academic transcripts verified',
  'Passport-size photographs (2) attached',
  'National ID / passport copy on file',
  'Admission letter signed & returned',
  'Medical fitness declaration submitted',
]

export default function RegistrationPage() {
  const router = useRouter()
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)
  const [openModals, setOpenModals] = useState<Set<string>>(new Set())
  const [selectedStudent, setSelectedStudent] = useState<typeof REG_ROWS[0] | null>(null)
  const [showRegPanel, setShowRegPanel] = useState(false)
  const [admissionType, setAdmissionType] = useState('Regular')
  const [paymentType, setPaymentType] = useState('Cash')
  const [showBankFields, setShowBankFields] = useState(false)

  function showToast(msg: string, type = '') { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }
  function openModal(id: string) { setOpenModals(prev => new Set(prev).add(id)) }
  function closeModal(id: string) { setOpenModals(prev => { const s = new Set(prev); s.delete(id); return s }) }

  function handleRegister(row: typeof REG_ROWS[0]) {
    setSelectedStudent(row); setAdmissionType(row.type === 'Lateral Entry' ? 'Lateral' : 'Regular'); setShowRegPanel(true)
  }

  function handlePaymentTypeChange(val: string) {
    setPaymentType(val); setShowBankFields(val === 'Bank Transfer')
  }

  return (
    <div id="page-registration">
      <div className="pg-hdr">
        <div>
          <h1 className="text-xl font-semibold text-g900">Registrar&rsquo;s Desk &mdash; Stage 4&ndash;5</h1>
          <p className="text-sm text-g500 mt-0.5">Registration payment verification &amp; final student registration</p>
        </div>
        <span className="badge badge-gold">Registrar&rsquo;s Dashboard</span>
      </div>

      <div className="pipeline mb-6">
        {REG_PIPELINE.map((step, i) => (
          <div key={step.label} className={`pip-step ${step.status}`}>
            <div className="pip-circle">{i + 1}</div>
            <span className="text-xs font-medium mt-1">{step.label}</span>
            <span className="text-[10px] text-g400 mt-0.5">{step.note}</span>
            {i < REG_PIPELINE.length - 1 && <div className={`pip-line ${step.status === 'done' ? 'done' : ''}`} />}
          </div>
        ))}
      </div>

      <div className="stats-row mb-6">
        <div className="stat-card"><span className="text-sm text-g500">Ready to Register</span><span className="text-2xl font-bold text-clr-green">2</span><span className="text-xs text-g400">Fee paid &amp; docs verified</span></div>
        <div className="stat-card"><span className="text-sm text-g500">Awaiting Reg. Payment</span><span className="text-2xl font-bold text-clr-amber">1</span><span className="text-xs text-g400">$250 registration fee</span></div>
        <div className="stat-card"><span className="text-sm text-g500">Registered This Intake</span><span className="text-2xl font-bold text-clr-gold">4</span><span className="text-xs text-g400">Spring 2026</span></div>
      </div>

      <div className="card mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-g800">Provisionally Admitted &mdash; Awaiting Final Registration</h2>
        </div>
        <ScrollTable>
          <table>
            <thead>
              <tr className="text-left text-g500 border-b border-g200">
                <th style={{ width: 48 }}></th><th className="pb-2 font-medium">App. Ref</th><th className="pb-2 font-medium">Student Name</th>
                <th className="pb-2 font-medium">Programme</th><th className="pb-2 font-medium">Admission Type</th>
                <th className="pb-2 font-medium">Reg. Fee ($250)</th>
              </tr>
            </thead>
            <tbody>
              {REG_ROWS.map(r => (
                <tr key={r.ref} className="border-b border-g100 hover:bg-g50">
                  <td>
                    <ActionMenu>
                      {r.canReg
                        ? <button className="btn btn-neu btn-sm" onClick={() => handleRegister(r)}><i className="lni lni-graduation" /> Register</button>
                        : <button className="btn btn-neu btn-sm" disabled>Awaiting Payment</button>}
                    </ActionMenu>
                  </td>
                  <td className="py-2.5 font-mono text-xs text-b600">{r.ref}</td>
                  <td className="py-2.5 text-g800">{r.name}</td>
                  <td className="py-2.5">{r.prog}</td>
                  <td className="py-2.5">{r.type}</td>
                  <td className="py-2.5"><span className={r.fee === 'Paid' ? 'badge badge-green' : 'badge badge-red'}>{r.fee}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollTable>
      </div>

      {showRegPanel && selectedStudent && (
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-g800">Register: {selectedStudent.name}</h2>
            <button className="btn btn-sm btn-ghost" onClick={() => setShowRegPanel(false)}><i className="lni lni-close" /></button>
          </div>
          <div className="sec-divider" />
          <div className="g2 gap-6 mt-4">
            <div className="flex flex-col gap-4">
              <div className="fg">
                <label className="lbl">Admission Type</label>
                <select className="ctrl" value={admissionType} onChange={e => setAdmissionType(e.target.value)}>
                  <option>Regular</option><option>Lateral</option><option>Credit Transfer</option><option>Existing Student</option>
                </select>
              </div>
              <div className="info-box bg-clr-green-bg border border-clr-green-bd rounded-lg p-3">
                <p className="text-sm font-medium text-g800 mb-1">Fee Breakdown</p>
                <div className="flex justify-between text-sm text-g600"><span>Registration Fee</span><span>$250.00</span></div>
                <div className="flex justify-between text-sm text-g600"><span>Technology Fee</span><span>$0.00</span></div>
                <div className="sec-divider my-2" />
                <div className="flex justify-between text-sm font-semibold text-g800"><span>Total</span><span>$250.00</span></div>
              </div>
              <p className="text-xs font-semibold text-g600 uppercase tracking-wide">Registration Payment</p>
              <div className="fg">
                <label className="lbl">Payment Type</label>
                <select className="ctrl" value={paymentType} onChange={e => handlePaymentTypeChange(e.target.value)}>
                  <option>Cash</option><option>Bank Transfer</option><option>Mobile Money</option>
                </select>
              </div>
              <div className="fg"><label className="lbl">Receipt Book No.</label><input className="ctrl" placeholder="e.g. RB-2026-045" /></div>
              {showBankFields && (<>
                <div className="fg"><label className="lbl">Bank Name</label><input className="ctrl" placeholder="e.g. Stanbic Bank" /></div>
                <div className="fg"><label className="lbl">Transaction Reference</label><input className="ctrl" placeholder="e.g. TXN-889234" /></div>
              </>)}
              <div className="sec-divider" />
              <div className="fg"><label className="lbl">Auto-generated Student Number</label><input className="ctrl bg-g50" readOnly value="ISB/2026/BSCS/0142" /></div>
              <div className="fg"><label className="lbl">University Email</label><input className="ctrl bg-g50" readOnly value="esther.tumukunde@isbat.ac.ug" /></div>
            </div>
            <div className="flex flex-col gap-4">
              <p className="text-xs font-semibold text-g600 uppercase tracking-wide">Final Documentation Check</p>
              <div className="checklist">
                {DOC_CHECKLIST.map(item => (
                  <label key={item} className="chk-item"><input type="checkbox" defaultChecked /><span className="text-sm text-g700">{item}</span></label>
                ))}
              </div>
              <div className="info-box bg-b50 border border-b200 rounded-lg p-3 mt-2">
                <p className="text-sm font-medium text-b700 mb-1"><i className="lni lni-information mr-1" /> Auto-actions on registration</p>
                <ul className="text-xs text-g600 list-disc ml-4 space-y-1">
                  <li>Student record created in T_Student</li>
                  <li>University email provisioned</li>
                  <li>Student portal access activated</li>
                  <li>Welcome SMS &amp; email sent</li>
                  <li>Enrollment linked to current intake</li>
                </ul>
              </div>
              <button className="btn btn-success w-full mt-4" onClick={() => openModal('onboard-modal')}>
                <i className="lni lni-checkmark-circle mr-1" /> Complete Registration &amp; Onboard Student
              </button>
            </div>
          </div>
        </div>
      )}

      <OnboardModal
        isOpen={openModals.has('onboard-modal')}
        onClose={() => closeModal('onboard-modal')}
        showToast={showToast}
        nav={id => router.push('/admission/' + id)}
      />
      <Toast toast={toast} />
    </div>
  )
}
