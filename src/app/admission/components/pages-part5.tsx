'use client'
import { useState } from 'react'
import { PageProps } from '../page'

/* ── mock data ──────────────────────────────────────────────── */
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

const ALL_APPLICANTS = [
  { ref: 'ADM-26-0023', name: 'Aisha Nakamya',    src: 'Direct', prog: 'BSCS', type: 'Full-time', fee: 'Paid',    stage: 'Vetting',    date: '12 Jun 2026' },
  { ref: 'ADM-26-0022', name: 'Brian Ochieng',     src: 'CRM',    prog: 'BBA',  type: 'Full-time', fee: 'Paid',    stage: 'Filing',     date: '11 Jun 2026' },
  { ref: 'ADM-26-0021', name: 'Clara Mbabazi',     src: 'Online', prog: 'BSIT', type: 'Weekend',   fee: 'Paid',    stage: 'Vetting',    date: '10 Jun 2026' },
  { ref: 'ADM-26-0020', name: 'David Ssempijja',   src: 'ODel',   prog: 'MBA',  type: 'ODL',       fee: 'Pending', stage: 'Payment',    date: '09 Jun 2026' },
  { ref: 'ADM-26-0019', name: 'Esther Tumukunde',  src: 'Direct', prog: 'BSCS', type: 'Full-time', fee: 'Paid',    stage: 'Registered', date: '08 Jun 2026' },
  { ref: 'ADM-26-0018', name: 'Fatuma Ssali',      src: 'CRM',    prog: 'BSCS', type: 'Full-time', fee: 'Paid',    stage: 'Admitted',   date: '07 Jun 2026' },
]

/* ── badge helpers ──────────────────────────────────────────── */
function stageBadge(s: string) {
  const m: Record<string, string> = {
    Vetting: 'badge-amber', Filing: 'badge-blue', Payment: 'badge-red',
    Admitted: 'badge-green', Registered: 'badge-gold',
  }
  return m[s] || 'badge-grey'
}
function srcBadge(s: string) {
  const m: Record<string, string> = {
    Direct: 'badge-blue', CRM: 'badge-purple', Online: 'badge-green', ODel: 'badge-amber',
  }
  return m[s] || 'badge-grey'
}
function feeBadge(f: string) {
  return f === 'Paid' ? 'badge-green' : f === 'Pending' ? 'badge-amber' : 'badge-red'
}

/* ════════════════════════════════════════════════════════════════
   RegistrationPage
   ════════════════════════════════════════════════════════════════ */
export function RegistrationPage({ nav, openModal, closeModal, showToast, openModals }: PageProps) {
  const [selectedStudent, setSelectedStudent] = useState<typeof REG_ROWS[0] | null>(null)
  const [showRegPanel, setShowRegPanel] = useState(false)
  const [admissionType, setAdmissionType] = useState('Regular')
  const [paymentType, setPaymentType] = useState('Cash')
  const [showBankFields, setShowBankFields] = useState(false)

  function handleRegister(row: typeof REG_ROWS[0]) {
    setSelectedStudent(row)
    setAdmissionType(row.type === 'Lateral Entry' ? 'Lateral' : 'Regular')
    setShowRegPanel(true)
  }

  function handlePaymentTypeChange(val: string) {
    setPaymentType(val)
    setShowBankFields(val === 'Bank Transfer')
  }

  return (
    <div id="page-registration">
      {/* ── Page Header ─────────────────────────────────────── */}
      <div className="pg-hdr">
        <div>
          <h1 className="text-xl font-semibold text-g900">Registrar&rsquo;s Desk &mdash; Stage 4&ndash;5</h1>
          <p className="text-sm text-g500 mt-0.5">
            Registration payment verification &amp; final student registration
          </p>
        </div>
        <span className="badge-gold px-3 py-1 rounded-full text-sm font-medium">
          Registrar&rsquo;s Dashboard
        </span>
      </div>

      {/* ── Pipeline ────────────────────────────────────────── */}
      <div className="pipeline mb-6">
        {REG_PIPELINE.map((step, i) => (
          <div key={step.label} className={`pip-step ${step.status}`}>
            <div className="pip-circle">{i + 1}</div>
            <span className="text-xs font-medium mt-1">{step.label}</span>
            <span className="text-[10px] text-g400 mt-0.5">{step.note}</span>
            {i < REG_PIPELINE.length - 1 && (
              <div className={`pip-line ${step.status === 'done' ? 'done' : ''}`} />
            )}
          </div>
        ))}
      </div>

      {/* ── Stat Cards ──────────────────────────────────────── */}
      <div className="stats-row mb-6">
        <div className="stat-card">
          <span className="text-sm text-g500">Ready to Register</span>
          <span className="text-2xl font-bold text-clr-green">2</span>
          <span className="text-xs text-g400">Fee paid &amp; docs verified</span>
        </div>
        <div className="stat-card">
          <span className="text-sm text-g500">Awaiting Reg. Payment</span>
          <span className="text-2xl font-bold text-clr-amber">1</span>
          <span className="text-xs text-g400">$250 registration fee</span>
        </div>
        <div className="stat-card">
          <span className="text-sm text-g500">Registered This Intake</span>
          <span className="text-2xl font-bold text-clr-gold">4</span>
          <span className="text-xs text-g400">Spring 2026</span>
        </div>
      </div>

      {/* ── Table ───────────────────────────────────────────── */}
      <div className="card mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-g800">
            Provisionally Admitted &mdash; Awaiting Final Registration
          </h2>
        </div>
        <div className="tbl-wrap">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-g500 border-b border-g200">
                <th className="pb-2 font-medium">App. Ref</th>
                <th className="pb-2 font-medium">Student Name</th>
                <th className="pb-2 font-medium">Programme</th>
                <th className="pb-2 font-medium">Admission Type</th>
                <th className="pb-2 font-medium">Reg. Fee ($250)</th>
                <th className="pb-2 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {REG_ROWS.map((r) => (
                <tr key={r.ref} className="border-b border-g100 hover:bg-g50">
                  <td className="py-2.5 font-mono text-xs text-b600">{r.ref}</td>
                  <td className="py-2.5 text-g800">{r.name}</td>
                  <td className="py-2.5">{r.prog}</td>
                  <td className="py-2.5">{r.type}</td>
                  <td className="py-2.5">
                    <span className={r.fee === 'Paid' ? 'badge-green' : 'badge-red'}>{r.fee}</span>
                  </td>
                  <td className="py-2.5">
                    {r.canReg ? (
                      <button className="btn btn-sm btn-primary" onClick={() => handleRegister(r)}>
                        Register <i className="lni lni-arrow-right ml-1" />
                      </button>
                    ) : (
                      <button className="btn btn-sm btn-muted" disabled>
                        Awaiting Payment
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Registration Detail Panel ───────────────────────── */}
      {showRegPanel && selectedStudent && (
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-g800">
              Register: {selectedStudent.name}
            </h2>
            <button className="btn btn-sm btn-ghost" onClick={() => setShowRegPanel(false)}>
              <i className="lni lni-close" />
            </button>
          </div>
          <div className="sec-divider" />

          <div className="g2 gap-6 mt-4">
            {/* LEFT column */}
            <div className="flex flex-col gap-4">
              <div className="fg">
                <label className="lbl">Admission Type</label>
                <select
                  className="ctrl"
                  value={admissionType}
                  onChange={(e) => setAdmissionType(e.target.value)}
                >
                  <option>Regular</option>
                  <option>Lateral</option>
                  <option>Credit Transfer</option>
                  <option>Existing Student</option>
                </select>
              </div>

              <div className="info-box bg-clr-green-bg border border-clr-green-bd rounded-lg p-3">
                <p className="text-sm font-medium text-g800 mb-1">Fee Breakdown</p>
                <div className="flex justify-between text-sm text-g600">
                  <span>Registration Fee</span><span>$250.00</span>
                </div>
                <div className="flex justify-between text-sm text-g600">
                  <span>Technology Fee</span><span>$0.00</span>
                </div>
                <div className="sec-divider my-2" />
                <div className="flex justify-between text-sm font-semibold text-g800">
                  <span>Total</span><span>$250.00</span>
                </div>
              </div>

              <p className="text-xs font-semibold text-g600 uppercase tracking-wide">Registration Payment</p>

              <div className="fg">
                <label className="lbl">Payment Type</label>
                <select className="ctrl" value={paymentType} onChange={(e) => handlePaymentTypeChange(e.target.value)}>
                  <option>Cash</option>
                  <option>Bank Transfer</option>
                  <option>Mobile Money</option>
                </select>
              </div>

              <div className="fg">
                <label className="lbl">Receipt Book No.</label>
                <input className="ctrl" placeholder="e.g. RB-2026-045" />
              </div>

              {showBankFields && (
                <>
                  <div className="fg">
                    <label className="lbl">Bank Name</label>
                    <input className="ctrl" placeholder="e.g. Stanbic Bank" />
                  </div>
                  <div className="fg">
                    <label className="lbl">Transaction Reference</label>
                    <input className="ctrl" placeholder="e.g. TXN-889234" />
                  </div>
                </>
              )}

              <div className="sec-divider" />

              <div className="fg">
                <label className="lbl">Auto-generated Student Number</label>
                <input className="ctrl bg-g50" readOnly value="ISB/2026/BSCS/0142" />
              </div>
              <div className="fg">
                <label className="lbl">University Email</label>
                <input className="ctrl bg-g50" readOnly value="esther.tumukunde@isbat.ac.ug" />
              </div>
            </div>

            {/* RIGHT column */}
            <div className="flex flex-col gap-4">
              <p className="text-xs font-semibold text-g600 uppercase tracking-wide">
                Final Documentation Check
              </p>
              <div className="checklist">
                {DOC_CHECKLIST.map((item) => (
                  <label key={item} className="chk-item">
                    <input type="checkbox" defaultChecked />
                    <span className="text-sm text-g700">{item}</span>
                  </label>
                ))}
              </div>

              <div className="info-box bg-b50 border border-b200 rounded-lg p-3 mt-2">
                <p className="text-sm font-medium text-b700 mb-1">
                  <i className="lni lni-information mr-1" /> Auto-actions on registration
                </p>
                <ul className="text-xs text-g600 list-disc ml-4 space-y-1">
                  <li>Student record created in T_Student</li>
                  <li>University email provisioned</li>
                  <li>Student portal access activated</li>
                  <li>Welcome SMS &amp; email sent</li>
                  <li>Enrollment linked to current intake</li>
                </ul>
              </div>

              <button
                className="btn btn-success w-full mt-4"
                onClick={() => openModal('onboard-modal')}
              >
                <i className="lni lni-checkmark-circle mr-1" />
                Complete Registration &amp; Onboard Student
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════
   ApplicantsPage
   ════════════════════════════════════════════════════════════════ */
export function ApplicantsPage({ nav, openModal, closeModal, showToast, openModals }: PageProps) {
  const [search, setSearch] = useState('')
  const [stageFilter, setStageFilter] = useState('All')

  const filtered = ALL_APPLICANTS.filter((a) => {
    const matchSearch = !search || a.name.toLowerCase().includes(search.toLowerCase()) || a.ref.toLowerCase().includes(search.toLowerCase())
    const matchStage = stageFilter === 'All' || a.stage === stageFilter
    return matchSearch && matchStage
  })

  return (
    <div id="page-applicants">
      {/* ── Page Header ─────────────────────────────────────── */}
      <div className="pg-hdr">
        <div>
          <h1 className="text-xl font-semibold text-g900">All Applicants &mdash; Spring 2026</h1>
          <p className="text-sm text-g500 mt-0.5">
            Complete list of all applicants across all pipeline stages
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <i className="lni lni-search-alt absolute left-2.5 top-1/2 -translate-y-1/2 text-g400 text-sm" />
            <input
              className="ctrl pl-8 w-56"
              placeholder="Search applicants…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="ctrl w-40"
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
          >
            <option>All</option>
            <option>Payment</option>
            <option>Filing</option>
            <option>Vetting</option>
            <option>Admitted</option>
            <option>Registered</option>
          </select>
          <button className="btn btn-outline" onClick={() => showToast('CSV exported successfully', 'success')}>
            <i className="lni lni-download mr-1" /> Export CSV
          </button>
        </div>
      </div>

      {/* ── Table ───────────────────────────────────────────── */}
      <div className="card">
        <div className="tbl-wrap">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-g500 border-b border-g200">
                <th className="pb-2 font-medium w-8">#</th>
                <th className="pb-2 font-medium">App. Ref</th>
                <th className="pb-2 font-medium">Applicant Name</th>
                <th className="pb-2 font-medium">Source</th>
                <th className="pb-2 font-medium">Programme</th>
                <th className="pb-2 font-medium">Type</th>
                <th className="pb-2 font-medium">Fee</th>
                <th className="pb-2 font-medium">Stage</th>
                <th className="pb-2 font-medium">Date</th>
                <th className="pb-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a, i) => (
                <tr key={a.ref} className="border-b border-g100 hover:bg-g50">
                  <td className="py-2.5 text-g400">{i + 1}</td>
                  <td className="py-2.5 font-mono text-xs text-b600">{a.ref}</td>
                  <td className="py-2.5 text-g800 font-medium">{a.name}</td>
                  <td className="py-2.5"><span className={srcBadge(a.src)}>{a.src}</span></td>
                  <td className="py-2.5">{a.prog}</td>
                  <td className="py-2.5 text-g600">{a.type}</td>
                  <td className="py-2.5"><span className={feeBadge(a.fee)}>{a.fee}</span></td>
                  <td className="py-2.5"><span className={stageBadge(a.stage)}>{a.stage}</span></td>
                  <td className="py-2.5 text-g500 text-xs">{a.date}</td>
                  <td className="py-2.5">
                    <button
                      className="btn btn-sm btn-ghost"
                      onClick={() => nav('registration')}
                    >
                      View <i className="lni lni-arrow-right ml-1" />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-g400">
                    No applicants match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
