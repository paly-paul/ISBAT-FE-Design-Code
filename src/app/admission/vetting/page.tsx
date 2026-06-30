'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Toast } from '@/components/Toast'
import { ScrollTable } from '@/components/ScrollTable'
import { ActionMenu } from '@/components/ActionMenu'
import { StudentProfileModal } from '@/components/modals/admission/StudentProfileModal'
import { RejectModal } from '@/components/modals/admission/RejectModal'

const QUEUE = [
  { ref: 'APP-2025-0041', name: 'Nakato Sarah',       programme: 'BSc Computer Science',       type: 'Direct',   docs: '3/4', submitted: '6h ago',  status: 'Pending' },
  { ref: 'APP-2025-0042', name: 'Ouma Brian',          programme: 'BBA Accounting',              type: 'ODL',      docs: '4/4', submitted: '5h ago',  status: 'Pending' },
  { ref: 'APP-2025-0043', name: 'Ainembabazi Grace',   programme: 'BSc Information Technology', type: 'Direct',   docs: '4/4', submitted: '4h ago',  status: 'Pending' },
  { ref: 'APP-2025-0044', name: 'Mugisha David',       programme: 'Diploma in Business Admin',  type: 'Transfer', docs: '2/4', submitted: '3h ago',  status: 'Pending' },
  { ref: 'APP-2025-0045', name: 'Kyomuhendo Faith',    programme: 'BSc Computer Science',       type: 'Direct',   docs: '4/4', submitted: '1h ago',  status: 'Pending' },
]

const PIPELINE_STEPS = [
  { num: 1, label: 'Enquiry' }, { num: 2, label: 'Filing' }, { num: 3, label: 'Vetting' },
  { num: 4, label: 'Approval' }, { num: 5, label: 'Registration' },
]

const DOCUMENTS = [
  { id: 'olevel',   label: 'O-Level Certificate', status: 'uploaded' as const },
  { id: 'alevel',   label: 'A-Level Certificate', status: 'uploaded' as const },
  { id: 'passport', label: 'Passport Photo',       status: 'uploaded' as const },
  { id: 'natid',    label: 'National ID',          status: 'missing'  as const },
]

const CHECKLIST = [
  { label: 'Minimum O-Level passes (5 credits)',       result: 'pass'    as const },
  { label: 'Relevant A-Level subjects',                result: 'pass'    as const },
  { label: 'Age requirement (17+)',                    result: 'pass'    as const },
  { label: 'All required documents uploaded',          result: 'fail'    as const },
  { label: 'English proficiency verified',             result: 'pending' as const },
]

interface Applicant { ref: string; name: string; programme: string; type: string; docs: string; total: number }

export default function VettingPage() {
  const router = useRouter()
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)
  const [openModals, setOpenModals] = useState<Set<string>>(new Set())
  const [filterProg, setFilterProg] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null)
  const [showPanel, setShowPanel] = useState(false)
  const [remarks, setRemarks] = useState('')

  function showToast(msg: string, type = '') { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }
  function openModal(id: string) { setOpenModals(prev => new Set(prev).add(id)) }
  function closeModal(id: string) { setOpenModals(prev => { const s = new Set(prev); s.delete(id); return s }) }

  function handleReview(row: typeof QUEUE[number]) {
    setSelectedApplicant({ ref: row.ref, name: row.name, programme: row.programme, type: row.type, docs: row.docs, total: 4 })
    setShowPanel(true); setRemarks('')
  }

  return (
    <div id="page-vetting">
      <div className="pg-hdr">
        <div>
          <h1 className="text-[1.35rem] font-semibold text-g800">Stage 3 &middot; Application Vetting Desk</h1>
          <p className="text-sm text-g500 mt-1">Assistant Registrar reviews documents &amp; minimum standards</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <select className="ctrl" value={filterProg} onChange={e => setFilterProg(e.target.value)}>
            <option value="all">All Programmes</option>
            <option value="bscs">BSc Computer Science</option>
            <option value="bba">BBA Accounting</option>
            <option value="bsit">BSc Information Technology</option>
            <option value="dba">Diploma in Business Admin</option>
          </select>
          <select className="ctrl" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      <div className="pipeline">
        {PIPELINE_STEPS.map((s, i) => {
          const cls = s.num < 3 ? 'done' : s.num === 3 ? 'active' : ''
          return (
            <span key={s.num} className="contents">
              {i > 0 && <span className={`pip-line ${s.num <= 3 ? 'done' : ''}`} />}
              <div className={`pip-step ${cls}`}><span className="pip-circle">{s.num}</span><span className="text-sm font-medium">{s.label}</span></div>
            </span>
          )
        })}
      </div>

      <div className="card">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
          <h2 className="text-base font-semibold text-g800">Vetting Queue (5 Pending)</h2>
          <span className="badge badge-amber">Oldest: 6h ago</span>
        </div>
        <ScrollTable>
          <table>
            <thead><tr><th style={{ width: 48 }}></th><th>App. Ref</th><th>Applicant Name</th><th>Programme</th><th>Type</th><th>Documents</th><th>Submitted</th><th>Status</th></tr></thead>
            <tbody>
              {QUEUE.map(row => (
                <tr key={row.ref}>
                  <td><ActionMenu><button className="btn btn-neu btn-sm" onClick={() => handleReview(row)}><i className="lni lni-eye" /> Review</button></ActionMenu></td>
                  <td className="font-mono text-sm">{row.ref}</td>
                  <td>{row.name}</td>
                  <td>{row.programme}</td>
                  <td><span className={`badge badge-${row.type === 'ODL' ? 'cyan' : row.type === 'Transfer' ? 'purple' : 'blue'}`}>{row.type}</span></td>
                  <td>{row.docs}</td>
                  <td className="text-sm text-g500">{row.submitted}</td>
                  <td><span className="badge badge-amber">{row.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollTable>
      </div>

      {showPanel && selectedApplicant && (
        <div className="card mt-4">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-base font-semibold text-g800">Reviewing: {selectedApplicant.name} &middot; {selectedApplicant.programme}</h2>
              <span className="badge badge-blue">{selectedApplicant.type}</span>
            </div>
            <div className="flex items-center gap-2">
              <button className="btn" onClick={() => openModal('student-profile-modal')}><i className="lni lni-user" /> View Profile</button>
              <button className="btn" onClick={() => setShowPanel(false)}><i className="lni lni-close" /> Close</button>
            </div>
          </div>

          <div className="g2">
            <div>
              <h3 className="text-sm font-semibold text-g700 mb-3">Uploaded Documents</h3>
              <div className="grid grid-cols-2 gap-3">
                {DOCUMENTS.map(doc => {
                  const isMissing = doc.status === 'missing'
                  return (
                    <div key={doc.id} className={`border rounded-[10px] overflow-hidden ${isMissing ? 'border-clr-red-bd bg-clr-red-bg' : 'border-g200 bg-white'}`}>
                      <div className={`h-28 flex items-center justify-center ${isMissing ? 'bg-clr-red-bg' : 'bg-g100'}`}>
                        <i className={`lni ${isMissing ? 'lni-warning text-red' : 'lni-files text-g400'} text-3xl`} />
                      </div>
                      <div className="p-3">
                        <p className={`text-sm font-medium mb-2 ${isMissing ? 'text-red-700' : 'text-g800'}`}>{doc.label}</p>
                        {isMissing ? <span className="badge badge-red">Missing</span> : (
                          <div className="flex gap-2">
                            <button className="btn btn-sm text-xs"><i className="lni lni-eye" /> View</button>
                            <button className="btn btn-sm btn-success text-xs"><i className="lni lni-checkmark" /> Verify</button>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-g700 mb-3">Minimum Standards Compliance</h3>
              <div className="checklist mb-4">
                {CHECKLIST.map((item, i) => (
                  <div key={i} className="chk-item">
                    <i className={`lni ${item.result === 'pass' ? 'lni-checkmark-circle text-green-600' : item.result === 'fail' ? 'lni-cross-circle text-red-600' : 'lni-timer text-amber-600'} text-lg`} />
                    <span className="text-sm text-g700">{item.label}</span>
                  </div>
                ))}
              </div>
              <div className="warn-box mb-4">
                <i className="lni lni-warning mr-2 text-amber-700" />
                <span className="text-sm">National ID document is missing. Applicant has been notified.</span>
              </div>
              <div className="fg">
                <label className="lbl">Vetting Remarks</label>
                <textarea className="ctrl" rows={3} placeholder="Enter vetting notes..." value={remarks} onChange={e => setRemarks(e.target.value)} />
              </div>
              <button className="btn mb-4" onClick={() => openModal('student-profile-modal')}><i className="lni lni-user" /> View Full Profile</button>
              <div className="grid grid-cols-3 gap-3">
                <button className="btn btn-amber w-full justify-center" onClick={() => showToast('Applicant placed on hold — waiting for original documents', 'amber')}><i className="lni lni-timer" /> Wait for Original Documents</button>
                <button className="btn btn-success w-full justify-center" onClick={() => { showToast('Application approved — provisional letter issued', 'success'); setShowPanel(false) }}><i className="lni lni-checkmark" /> Approve &amp; Issue Provisional Letter</button>
                <button className="btn btn-danger w-full justify-center" onClick={() => openModal('reject-modal')}><i className="lni lni-close" /> Reject Application</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <StudentProfileModal isOpen={openModals.has('student-profile-modal')} onClose={() => closeModal('student-profile-modal')} showToast={showToast} />
      <RejectModal isOpen={openModals.has('reject-modal')} onClose={() => closeModal('reject-modal')} showToast={showToast} />
      <Toast toast={toast} />
    </div>
  )
}
