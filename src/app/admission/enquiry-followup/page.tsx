'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Toast } from '@/components/Toast'
import { ScrollTable } from '@/components/ScrollTable'
import { ActionMenu } from '@/components/ActionMenu'
import { LogFollowupModal, FollowupRecord } from '@/components/modals/admission/LogFollowupModal'

const INITIAL_ROWS: FollowupRecord[] = [
  { ref: 'ENQ-26-0046', name: 'Nambi Doreen',   assignedTo: 'Jane Nalule',      followupDate: '2026-07-05', priority: 'Medium', status: 'Upcoming' },
  { ref: 'ENQ-26-0044', name: 'Atim Connie',    assignedTo: 'David Okwir',      followupDate: '2026-07-03', priority: 'Low',    status: 'Due Today' },
  { ref: 'ENQ-26-0042', name: 'Okello Joseph',  assignedTo: 'Jane Nalule',      followupDate: '2026-06-20', priority: 'High',   status: 'Overdue' },
  { ref: 'ENQ-26-0041', name: 'Nakato Sarah',   assignedTo: 'David Okwir',      followupDate: '2026-06-15', priority: 'Medium', status: 'Overdue' },
  { ref: 'ENQ-26-0039', name: 'Ssali Brian',    assignedTo: 'Peter Ssentongo',  followupDate: '2026-06-10', priority: 'Low',    status: 'Completed' },
  { ref: 'ENQ-26-0038', name: 'Mugisha Brian',  assignedTo: 'Grace Achieng',    followupDate: '2026-06-08', priority: 'Medium', status: 'Completed' },
]

function priorityBadge(p: string) {
  return p === 'High' ? 'badge-red' : p === 'Medium' ? 'badge-amber' : 'badge-grey'
}

function statusBadge(s: string) {
  const map: Record<string, string> = { Overdue: 'badge-red', 'Due Today': 'badge-amber', Upcoming: 'badge-blue', Completed: 'badge-green' }
  return map[s] || 'badge-grey'
}

export default function EnquiryFollowupPage() {
  const router = useRouter()
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)
  const [openModals, setOpenModals] = useState<Set<string>>(new Set())
  const [rows, setRows] = useState<FollowupRecord[]>(INITIAL_ROWS)
  const [selected, setSelected] = useState<FollowupRecord | null>(null)
  const [statusFilter, setStatusFilter] = useState('')

  function showToast(msg: string, type = '') { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }
  function openModal(id: string) { setOpenModals(prev => new Set(prev).add(id)) }
  function closeModal(id: string) { setOpenModals(prev => { const s = new Set(prev); s.delete(id); return s }) }

  function handleLog(row: FollowupRecord) { setSelected(row); openModal('log-followup-modal') }

  function applyLog(ref: string, outcome: string, completed: boolean) {
    setRows(prev => prev.map(r => r.ref === ref ? { ...r, status: completed ? 'Completed' : r.status } : r))
  }

  const filtered = rows.filter(r => !statusFilter || r.status === statusFilter)

  const dueToday  = rows.filter(r => r.status === 'Due Today').length
  const overdue   = rows.filter(r => r.status === 'Overdue').length
  const upcoming  = rows.filter(r => r.status === 'Upcoming').length
  const completed = rows.filter(r => r.status === 'Completed').length

  return (
    <div id="page-enquiry-followup">
      <div className="pg-hdr">
        <div>
          <h1 className="text-xl font-semibold text-g900">Enquiry Followup</h1>
          <p className="text-sm text-g500 mt-0.5">Track &amp; log follow-ups allocated to staff</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-ghost" onClick={() => router.push('/admission/enquiry-followup-master')}><i className="lni lni-arrow-left" /> Back to Allocation</button>
        </div>
      </div>

      <div className="stats-row">
        <div className="stat-card [--b700:var(--red)] [--b400:#f87171]">
          <div className="flex items-center gap-2 mb-1"><i className="lni lni-warning text-clr-red" /><span className="text-sm text-g500">Overdue</span></div>
          <p className="text-2xl font-semibold text-clr-red">{overdue}</p>
        </div>
        <div className="stat-card [--b700:var(--amber)] [--b400:#fbbf24]">
          <div className="flex items-center gap-2 mb-1"><i className="lni lni-timer text-clr-amber" /><span className="text-sm text-g500">Due Today</span></div>
          <p className="text-2xl font-semibold text-clr-amber">{dueToday}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-1"><i className="lni lni-calendar text-b500" /><span className="text-sm text-g500">Upcoming</span></div>
          <p className="text-2xl font-semibold text-g900">{upcoming}</p>
        </div>
        <div className="stat-card [--b700:var(--green)] [--b400:#34d399]">
          <div className="flex items-center gap-2 mb-1"><i className="lni lni-checkmark text-clr-green" /><span className="text-sm text-g500">Completed</span></div>
          <p className="text-2xl font-semibold text-clr-green">{completed}</p>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-g800">Allocated Follow-ups &mdash; 2026</h2>
          <div className="flex gap-2">
            <select className="ctrl w-40" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">All Statuses</option>
              <option>Overdue</option><option>Due Today</option><option>Upcoming</option><option>Completed</option>
            </select>
          </div>
        </div>
        <ScrollTable>
          <table>
            <thead><tr><th style={{ width: 48 }}></th><th>Enq. Ref</th><th>Name</th><th>Assigned To</th><th>Follow-up Date</th><th>Priority</th><th>Status</th></tr></thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.ref}>
                  <td>
                    <ActionMenu>
                      <button className="btn btn-neu btn-sm" onClick={() => router.push('/admission/payment')}><i className="lni lni-arrow-right" /> Convert</button>
                      {r.status !== 'Completed'
                        ? <button className="btn btn-neu btn-sm" onClick={() => handleLog(r)}><i className="lni lni-phone" /> Log Follow-up</button>
                        : <button className="btn btn-neu btn-sm" onClick={() => handleLog(r)}><i className="lni lni-eye" /> View</button>}
                    </ActionMenu>
                  </td>
                  <td className="font-mono text-sm">{r.ref}</td>
                  <td>{r.name}</td>
                  <td>{r.assignedTo}</td>
                  <td className="text-sm text-g600">{r.followupDate}</td>
                  <td><span className={`badge ${priorityBadge(r.priority)}`}>{r.priority}</span></td>
                  <td><span className={`badge ${statusBadge(r.status)}`}>{r.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollTable>
      </div>

      <LogFollowupModal
        isOpen={openModals.has('log-followup-modal')}
        onClose={() => closeModal('log-followup-modal')}
        showToast={showToast}
        record={selected}
        onLog={applyLog}
      />
      <Toast toast={toast} />
    </div>
  )
}
