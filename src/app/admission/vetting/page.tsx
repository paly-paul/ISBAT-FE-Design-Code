'use client'
import { useState } from 'react'
import { Toast } from '@/components/Toast'
import { ScrollTable } from '@/components/ScrollTable'
import { ActionMenu } from '@/components/ActionMenu'
import { RejectModal } from '@/components/modals/admission/RejectModal'
import { VettingReviewModal, VettingApplicant } from '@/components/modals/admission/VettingReviewModal'

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

export default function VettingPage() {
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)
  const [openModals, setOpenModals] = useState<Set<string>>(new Set())
  const [filterProg, setFilterProg] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedApplicant, setSelectedApplicant] = useState<VettingApplicant | null>(null)

  function showToast(msg: string, type = '') { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }
  function openModal(id: string) { setOpenModals(prev => new Set(prev).add(id)) }
  function closeModal(id: string) { setOpenModals(prev => { const s = new Set(prev); s.delete(id); return s }) }

  function handleReview(row: typeof QUEUE[number]) {
    setSelectedApplicant({ ref: row.ref, name: row.name, programme: row.programme, type: row.type, docs: row.docs, submitted: row.submitted })
    openModal('vetting-review-modal')
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

      <VettingReviewModal
        isOpen={openModals.has('vetting-review-modal')}
        onClose={() => closeModal('vetting-review-modal')}
        showToast={showToast}
        applicant={selectedApplicant}
        onReject={() => { closeModal('vetting-review-modal'); openModal('reject-modal') }}
      />
      <RejectModal isOpen={openModals.has('reject-modal')} onClose={() => closeModal('reject-modal')} showToast={showToast} />
      <Toast toast={toast} />
    </div>
  )
}
