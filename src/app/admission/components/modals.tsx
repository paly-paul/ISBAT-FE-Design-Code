'use client'
import { useState } from 'react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  showToast: (msg: string, type?: string) => void
  nav?: (id: string) => void
}

/* ─── 1. Student Profile Modal ─── */
export function StudentProfileModal({ isOpen, onClose, showToast }: ModalProps) {
  const [status, setStatus] = useState('Active')
  if (!isOpen) return null

  const s = {
    id: 'ISB/2024/BSCS/0142', first: 'Aisha', last: 'Nakamya', dob: '2001-03-15',
    gender: 'Female', nationality: 'Ugandan', nid: 'CM920100315ABCD',
    phone: '+256 701 234 567', uniEmail: 'aisha.nakamya@isbat.ac.ug',
    persEmail: 'aisha.nk@gmail.com', address: 'Plot 12, Kampala Road, Kampala',
    programme: 'BSc Computer Science', year: 'Year 2 / Sem 1', intake: 'September 2024',
    acadYear: '2025/2026', batch: 'BSCS-2024-SEP-A', admitted: '2024-09-10',
    cgpa: '3.72', feeClear: 'Cleared',
    fatherName: 'Hassan Nakamya', fatherPhone: '+256 772 111 222',
    motherName: 'Sarah Nakamya', motherPhone: '+256 772 333 444',
  }

  return (
    <div className="modal-overlay open" onClick={onClose}>
      <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr">
          <div className="modal-title"><i className="lni lni-user"></i> View Student Profile &mdash; {s.id}</div>
          <button className="modal-close" onClick={onClose}><i className="lni lni-close"></i></button>
        </div>

        {/* Header strip */}
        <div className="flex items-center gap-4 p-4 rounded-lg mb-4" style={{ background: 'var(--g100)' }}>
          <div className="flex items-center justify-center rounded-full font-bold text-white shrink-0" style={{ width: 52, height: 52, background: 'var(--b500)', fontSize: 18 }}>AN</div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-lg">{s.first} {s.last}</div>
            <div className="text-sm" style={{ color: 'var(--g500)' }}>{s.programme} &middot; {s.year}</div>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="badge-blue">{s.acadYear}</span>
            <span className="badge-green">{s.feeClear}</span>
            <span className="badge-green">{status}</span>
          </div>
        </div>

        {/* Personal Information */}
        <div className="sec-divider">Personal Information</div>
        <div className="g3 mb-4">
          <div className="fg"><label className="lbl">First Name</label><input className="ctrl" readOnly value={s.first}/></div>
          <div className="fg"><label className="lbl">Last Name</label><input className="ctrl" readOnly value={s.last}/></div>
          <div className="fg"><label className="lbl">Date of Birth</label><input className="ctrl" readOnly value={s.dob}/></div>
          <div className="fg"><label className="lbl">Gender</label><input className="ctrl" readOnly value={s.gender}/></div>
          <div className="fg"><label className="lbl">Nationality</label><input className="ctrl" readOnly value={s.nationality}/></div>
          <div className="fg"><label className="lbl">National ID</label><input className="ctrl" readOnly value={s.nid}/></div>
          <div className="fg"><label className="lbl">Phone</label><input className="ctrl" readOnly value={s.phone}/></div>
          <div className="fg"><label className="lbl">University Email</label><input className="ctrl" readOnly value={s.uniEmail}/></div>
          <div className="fg"><label className="lbl">Personal Email</label><input className="ctrl" readOnly value={s.persEmail}/></div>
          <div className="fg" style={{ gridColumn: 'span 3' }}><label className="lbl">Address</label><input className="ctrl" readOnly value={s.address}/></div>
        </div>

        {/* Academic Details */}
        <div className="sec-divider">Academic Details</div>
        <div className="g3 mb-4">
          <div className="fg"><label className="lbl">Programme</label><input className="ctrl" readOnly value={s.programme}/></div>
          <div className="fg"><label className="lbl">Year / Semester</label><input className="ctrl" readOnly value={s.year}/></div>
          <div className="fg"><label className="lbl">Intake</label><input className="ctrl" readOnly value={s.intake}/></div>
          <div className="fg"><label className="lbl">Academic Year</label><input className="ctrl" readOnly value={s.acadYear}/></div>
          <div className="fg"><label className="lbl">Batch Code</label><input className="ctrl" readOnly value={s.batch}/></div>
          <div className="fg"><label className="lbl">Admission Date</label><input className="ctrl" readOnly value={s.admitted}/></div>
          <div className="fg"><label className="lbl">CGPA</label><input className="ctrl" readOnly value={s.cgpa}/></div>
          <div className="fg">
            <label className="lbl">Status</label>
            <select className="ctrl" value={status} onChange={e => setStatus(e.target.value)}>
              <option>Active</option><option>Suspended</option><option>Deferred</option><option>Graduated</option>
            </select>
          </div>
          <div className="fg"><label className="lbl">Fee Clearance</label><input className="ctrl" readOnly value={s.feeClear}/></div>
        </div>

        {/* Family / Guardian */}
        <div className="sec-divider">Family / Guardian</div>
        <div className="g2 mb-4">
          <div className="fg"><label className="lbl">Father Name</label><input className="ctrl" readOnly value={s.fatherName}/></div>
          <div className="fg"><label className="lbl">Father Phone</label><input className="ctrl" readOnly value={s.fatherPhone}/></div>
          <div className="fg"><label className="lbl">Mother Name</label><input className="ctrl" readOnly value={s.motherName}/></div>
          <div className="fg"><label className="lbl">Mother Phone</label><input className="ctrl" readOnly value={s.motherPhone}/></div>
        </div>

        <div className="modal-footer">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => showToast('Student profile updated successfully.', 'success')}>Save Changes</button>
        </div>
      </div>
    </div>
  )
}

/* ─── 2. Import Source Modal ─── */
const ENQUIRY_RECORDS = [
  { ref: 'ENQ-2026-0011', name: 'David Okello',   phone: '+256 701 000 111', email: 'd.okello@mail.com',   programme: 'BSc Computer Science', mode: 'Full-Time',  status: 'Hot Lead' },
  { ref: 'ENQ-2026-0012', name: 'Grace Atim',      phone: '+256 772 000 222', email: 'g.atim@mail.com',     programme: 'BBA Management',       mode: 'Weekend',    status: 'Warm' },
  { ref: 'ENQ-2026-0013', name: 'Moses Ssempala',  phone: '+256 703 000 333', email: 'm.ssempala@mail.com', programme: 'Diploma IT',           mode: 'Full-Time',  status: 'Hot Lead' },
  { ref: 'ENQ-2026-0014', name: 'Fatima Nankya',   phone: '+256 785 000 444', email: 'f.nankya@mail.com',   programme: 'BSc Nursing',          mode: 'Full-Time',  status: 'New' },
  { ref: 'ENQ-2026-0015', name: 'Brian Mugisha',   phone: '+256 704 000 555', email: 'b.mugisha@mail.com',  programme: 'BBA Accounting',       mode: 'Evening',    status: 'Warm' },
]

export function ImportSourceModal({ isOpen, onClose, showToast }: ModalProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRecord, setSelectedRecord] = useState<typeof ENQUIRY_RECORDS[0] | null>(null)
  if (!isOpen) return null

  const filtered = ENQUIRY_RECORDS.filter(r =>
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.ref.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.programme.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="modal-overlay open" onClick={onClose}>
      <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr">
          <div className="modal-title"><i className="lni lni-download"></i> Import from Enquiry</div>
          <button className="modal-close" onClick={onClose}><i className="lni lni-close"></i></button>
        </div>

        <div className="info-box mb-3">
          <i className="lni lni-information"></i>
          <span>Select an enquiry record below to pre-fill the application payment form.</span>
        </div>

        <div className="inp-wrap mb-3">
          <i className="inp-icon lni lni-search-alt"></i>
          <input className="ctrl" placeholder="Search by name, ref or programme..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>

        <div className="overflow-auto mb-3" style={{ maxHeight: 260 }}>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left" style={{ color: 'var(--g500)', borderBottom: '1px solid var(--g200)' }}>
                <th className="p-2">Ref</th><th className="p-2">Name</th><th className="p-2">Phone / Email</th>
                <th className="p-2">Programme Interest</th><th className="p-2">Mode</th><th className="p-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.ref} className={`cursor-pointer hover:bg-b50 ${selectedRecord?.ref === r.ref ? 'bg-b50' : ''}`}
                    style={selectedRecord?.ref === r.ref ? { outline: '2px solid var(--b400)', borderRadius: 'var(--rxs)' } : {}}
                    onClick={() => setSelectedRecord(r)}>
                  <td className="p-2 font-mono text-xs">{r.ref}</td>
                  <td className="p-2 font-medium">{r.name}</td>
                  <td className="p-2"><div>{r.phone}</div><div className="text-xs" style={{ color: 'var(--g400)' }}>{r.email}</div></td>
                  <td className="p-2">{r.programme}</td>
                  <td className="p-2">{r.mode}</td>
                  <td className="p-2"><span className={r.status === 'Hot Lead' ? 'badge-red' : r.status === 'Warm' ? 'badge-amber' : 'badge-blue'}>{r.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {selectedRecord && (
          <div className="success-box mb-3">
            <i className="lni lni-checkmark-circle"></i>
            <span>Selected: <strong>{selectedRecord.name}</strong> &mdash; {selectedRecord.programme} ({selectedRecord.mode})</span>
          </div>
        )}

        <div className="modal-footer">
          <span className="text-sm" style={{ color: 'var(--g500)' }}>{selectedRecord ? '1 record selected' : 'No selection'}</span>
          <div className="flex gap-2">
            <button className="btn" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" disabled={!selectedRecord} onClick={() => { showToast('Enquiry imported to application payment.', 'success'); onClose() }}>
              <i className="lni lni-enter"></i> Import to Application Payment
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── 3. Enquiry Form Modal ─── */
export function EnquiryFormModal({ isOpen, onClose, showToast }: ModalProps) {
  if (!isOpen) return null

  return (
    <div className="modal-overlay open" onClick={onClose}>
      <div className="modal modal-md" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr">
          <div className="modal-title"><i className="lni lni-notepad"></i> New Enquiry &mdash; Information Desk</div>
          <button className="modal-close" onClick={onClose}><i className="lni lni-close"></i></button>
        </div>

        <div className="g2 mb-4">
          <div className="fg"><label className="lbl">First Name</label><input className="ctrl" placeholder="Enter first name" /></div>
          <div className="fg"><label className="lbl">Last Name</label><input className="ctrl" placeholder="Enter last name" /></div>
          <div className="fg"><label className="lbl">Phone</label><input className="ctrl" placeholder="+256 7XX XXX XXX" /></div>
          <div className="fg"><label className="lbl">Email</label><input className="ctrl" placeholder="email@example.com" /></div>
          <div className="fg">
            <label className="lbl">Enquiry Channel</label>
            <select className="ctrl"><option value="">Select channel</option><option>Walk-In</option><option>Phone Call</option><option>Email</option><option>Website</option><option>Social Media</option><option>Referral</option></select>
          </div>
          <div className="fg">
            <label className="lbl">Programme Interest</label>
            <select className="ctrl"><option value="">Select programme</option><option>BSc Computer Science</option><option>BBA Management</option><option>BSc Nursing</option><option>Diploma IT</option><option>BBA Accounting</option></select>
          </div>
          <div className="fg">
            <label className="lbl">Preferred Intake</label>
            <select className="ctrl"><option value="">Select intake</option><option>September 2026</option><option>January 2027</option><option>May 2027</option></select>
          </div>
          <div className="fg">
            <label className="lbl">Preferred Study Mode</label>
            <select className="ctrl"><option value="">Select mode</option><option>Full-Time</option><option>Part-Time</option><option>Weekend</option><option>Evening</option><option>Online / ODL</option></select>
          </div>
          <div className="fg" style={{ gridColumn: 'span 2' }}>
            <label className="lbl">Notes</label>
            <textarea className="ctrl" rows={3} placeholder="Additional notes or remarks..." />
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => { showToast('Enquiry saved successfully.', 'success'); onClose() }}>
            <i className="lni lni-save"></i> Save Enquiry
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── 4. Reject Modal ─── */
export function RejectModal({ isOpen, onClose, showToast }: ModalProps) {
  if (!isOpen) return null

  return (
    <div className="modal-overlay open" onClick={onClose}>
      <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr">
          <div className="modal-title"><i className="lni lni-ban"></i> Reject Application</div>
          <button className="modal-close" onClick={onClose}><i className="lni lni-close"></i></button>
        </div>

        <div className="danger-box mb-3">
          <i className="lni lni-warning"></i>
          <span>This action will permanently reject the application and notify the applicant. This cannot be undone.</span>
        </div>

        <div className="fg mb-3">
          <label className="lbl">Rejection Reason</label>
          <select className="ctrl">
            <option value="">Select reason</option>
            <option>Does not meet A-Level entry standards</option>
            <option>Incomplete documentation</option>
            <option>Fee payment discrepancy</option>
            <option>Programme quota full</option>
            <option>Fraudulent documents detected</option>
            <option>Other</option>
          </select>
        </div>

        <div className="fg mb-3">
          <label className="lbl">Detailed Remarks</label>
          <textarea className="ctrl" rows={3} placeholder="Provide detailed remarks for the rejection..." />
        </div>

        <div className="modal-footer">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-danger" onClick={() => { showToast('Application rejected successfully.', 'warning'); onClose() }}>
            <i className="lni lni-trash-can"></i> Confirm Rejection
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── 5. Onboard Modal ─── */
export function OnboardModal({ isOpen, onClose, showToast, nav }: ModalProps) {
  if (!isOpen) return null

  const cards = [
    { icon: 'lni lni-envelope',       title: 'Welcome Email Sent',     sub: 'Credentials dispatched to student inbox' },
    { icon: 'lni lni-credit-cards',   title: 'ID Card Initiated',      sub: 'Queued for printing — batch #PRN-2026-06' },
    { icon: 'lni lni-fingerprint',    title: 'Biometrics Queued',      sub: 'Scheduled for capture at registration desk' },
    { icon: 'lni lni-certificate',    title: 'Admission Letter Issued', sub: 'PDF generated and attached to profile' },
  ]

  return (
    <div className="modal-overlay open" onClick={onClose}>
      <div className="modal modal-md" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr">
          <div className="modal-title"><i className="lni lni-volume"></i> Student Successfully Registered!</div>
          <button className="modal-close" onClick={onClose}><i className="lni lni-close"></i></button>
        </div>

        <div className="success-box mb-4">
          <i className="lni lni-checkmark-circle"></i>
          <span>A new <strong>T_Student</strong> record has been created. All onboarding workflows have been triggered automatically.</span>
        </div>

        <div className="g2 mb-4">
          {cards.map(c => (
            <div key={c.title} className="flex items-start gap-3 p-3 rounded-lg" style={{ background: 'var(--green-bg)', border: '1px solid var(--green-bd)' }}>
              <i className={`${c.icon} text-lg`} style={{ color: 'var(--green)' }} />
              <div>
                <div className="font-semibold text-sm" style={{ color: 'var(--green)' }}>{c.title}</div>
                <div className="text-xs" style={{ color: 'var(--g500)' }}>{c.sub}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mb-4">
          <div className="text-xs uppercase tracking-wide mb-1" style={{ color: 'var(--g400)' }}>Student Number</div>
          <div className="font-mono text-xl font-bold" style={{ color: 'var(--b600)' }}>ISB/2026/0001</div>
          <div className="text-sm" style={{ color: 'var(--g500)' }}>student.0001@isbat.ac.ug</div>
        </div>

        <div className="modal-footer">
          <button className="btn" onClick={() => showToast('Admission letter sent to print queue.', 'success')}>
            <i className="lni lni-printer"></i> Print Letter
          </button>
          <button className="btn btn-primary" onClick={() => { onClose(); nav?.('acad-dashboard') }}>
            <i className="lni lni-arrow-left"></i> Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}
