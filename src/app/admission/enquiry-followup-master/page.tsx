'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Toast } from '@/components/Toast'
import { ScrollTable } from '@/components/ScrollTable'
import { ActionMenu } from '@/components/ActionMenu'
import { AllocateFollowupModal, FollowupEnquiry } from '@/components/modals/admission/AllocateFollowupModal'

const INITIAL_ROWS: FollowupEnquiry[] = [
  { ref: 'ENQ-26-0047', name: 'Kamya Brian',    programme: 'BSc. Computer Science', assignedTo: 'Unallocated',    followupDate: '—',          priority: 'High' },
  { ref: 'ENQ-26-0046', name: 'Nambi Doreen',   programme: 'Diploma in Nursing',    assignedTo: 'Jane Nalule',    followupDate: '2026-07-05', priority: 'Medium' },
  { ref: 'ENQ-26-0045', name: 'Waiswa Patrick', programme: 'BSc. Information Technology', assignedTo: 'Unallocated', followupDate: '—',      priority: 'Medium' },
  { ref: 'ENQ-26-0044', name: 'Atim Connie',    programme: 'MBA Business Admin',    assignedTo: 'David Okwir',    followupDate: '2026-07-03', priority: 'Low' },
  { ref: 'ENQ-26-0043', name: 'Ssali Brian',    programme: 'BSc. Computer Science', assignedTo: 'Unallocated',    followupDate: '—',          priority: 'High' },
  { ref: 'ENQ-26-0042', name: 'Okello Joseph',  programme: 'Diploma in Community Health', assignedTo: 'Jane Nalule', followupDate: '2026-06-20', priority: 'High' },
  { ref: 'ENQ-26-0041', name: 'Nakato Sarah',   programme: 'HEC Information Technology', assignedTo: 'David Okwir', followupDate: '2026-06-15', priority: 'Medium' },
]

function priorityBadge(p: string) {
  return p === 'High' ? 'badge-red' : p === 'Medium' ? 'badge-amber' : 'badge-grey'
}

export default function EnquiryFollowupMasterPage() {
  const router = useRouter()
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)
  const [openModals, setOpenModals] = useState<Set<string>>(new Set())
  const [rows, setRows] = useState<FollowupEnquiry[]>(INITIAL_ROWS)
  const [selected, setSelected] = useState<FollowupEnquiry | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  function showToast(msg: string, type = '') { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }
  function openModal(id: string) { setOpenModals(prev => new Set(prev).add(id)) }
  function closeModal(id: string) { setOpenModals(prev => { const s = new Set(prev); s.delete(id); return s }) }

  function handleAllocate(row: FollowupEnquiry) { setSelected(row); openModal('allocate-followup-modal') }

  function applyAllocation(ref: string, assignedTo: string, followupDate: string, priority: string) {
    setRows(prev => prev.map(r => r.ref === ref ? { ...r, assignedTo, followupDate, priority } : r))
  }

  const q = searchTerm.trim().toLowerCase()
  const filtered = rows.filter(r => !q || r.name.toLowerCase().includes(q) || r.ref.toLowerCase().includes(q) || r.programme.toLowerCase().includes(q))

  const unallocated = rows.filter(r => r.assignedTo === 'Unallocated').length
  const allocatedToday = rows.filter(r => r.followupDate === '2026-07-03').length
  const highPriority = rows.filter(r => r.priority === 'High').length

  return (
    <div id="page-enquiry-followup-master">
      <div className="pg-hdr">
        <div>
          <h1 className="text-xl font-semibold text-g900">Enquiry Followup Master</h1>
          <p className="text-sm text-g500 mt-0.5">Allocate enquiries to staff for follow-up &amp; set priority</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-ghost" onClick={() => router.push('/admission/enquiry-list')}><i className="lni lni-arrow-left" /> Back</button>
        </div>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-1"><i className="lni lni-users text-b500" /><span className="text-sm text-g500">Total Enquiries</span></div>
          <p className="text-2xl font-semibold text-g900">{rows.length}</p>
        </div>
        <div className="stat-card [--b700:var(--red)] [--b400:#f87171]">
          <div className="flex items-center gap-2 mb-1"><i className="lni lni-warning text-clr-red" /><span className="text-sm text-g500">Unallocated</span></div>
          <p className="text-2xl font-semibold text-clr-red">{unallocated}</p>
        </div>
        <div className="stat-card [--b700:var(--green)] [--b400:#34d399]">
          <div className="flex items-center gap-2 mb-1"><i className="lni lni-checkmark text-clr-green" /><span className="text-sm text-g500">Due Today</span></div>
          <p className="text-2xl font-semibold text-clr-green">{allocatedToday}</p>
        </div>
        <div className="stat-card [--b700:var(--amber)] [--b400:#fbbf24]">
          <div className="flex items-center gap-2 mb-1"><i className="lni lni-flag text-clr-amber" /><span className="text-sm text-g500">High Priority</span></div>
          <p className="text-2xl font-semibold text-clr-amber">{highPriority}</p>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-g800">Follow-up Allocation &mdash; 2026</h2>
          <div className="flex gap-2">
            <input className="ctrl w-52" placeholder="Search enquiries..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
        </div>
        <ScrollTable>
          <table>
            <thead><tr><th style={{ width: 48 }}></th><th>Enq. Ref</th><th>Name</th><th>Programme Interest</th><th>Assigned To</th><th>Follow-up Date</th><th>Priority</th></tr></thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.ref}>
                  <td>
                    <ActionMenu>
                      <button className="btn btn-neu btn-sm" onClick={() => router.push('/admission/payment')}><i className="lni lni-arrow-right" /> Convert</button>
                      <button className="btn btn-neu btn-sm" onClick={() => handleAllocate(r)}>
                        <i className={`lni ${r.assignedTo === 'Unallocated' ? 'lni-user' : 'lni-reload'}`} /> {r.assignedTo === 'Unallocated' ? 'Allocate' : 'Reassign'}
                      </button>
                    </ActionMenu>
                  </td>
                  <td className="font-mono text-sm">{r.ref}</td>
                  <td>{r.name}</td>
                  <td>{r.programme}</td>
                  <td>{r.assignedTo === 'Unallocated' ? <span className="badge badge-red">Unallocated</span> : <span className="badge badge-blue">{r.assignedTo}</span>}</td>
                  <td className="text-sm text-g600">{r.followupDate}</td>
                  <td><span className={`badge ${priorityBadge(r.priority)}`}>{r.priority}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollTable>
      </div>

      <AllocateFollowupModal
        isOpen={openModals.has('allocate-followup-modal')}
        onClose={() => closeModal('allocate-followup-modal')}
        showToast={showToast}
        enquiry={selected}
        onAllocate={applyAllocation}
      />
      <Toast toast={toast} />
    </div>
  )
}
