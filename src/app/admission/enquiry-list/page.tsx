'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Toast } from '@/components/Toast'
import { ScrollTable } from '@/components/ScrollTable'
import { ActionMenu } from '@/components/ActionMenu'
import { SearchSelect } from '@/components/SearchSelect'
import { EnquiryFormModal } from '@/components/modals/admission/EnquiryFormModal'

const ENQUIRY_ROWS = [
  { ref: 'ENQ-26-0047', name: 'Kamya Brian',    phone: '+256 701 234 567', email: 'bkamya@gmail.com',    prog: 'BSCS',  channel: 'Walk-in', date: '2026-06-22', status: 'Pending' },
  { ref: 'ENQ-26-0046', name: 'Nambi Doreen',   phone: '+256 772 345 678', email: 'dnambi@yahoo.com',    prog: 'BBA',   channel: 'Phone',   date: '2026-06-21', status: 'Converted' },
  { ref: 'ENQ-26-0045', name: 'Waiswa Patrick', phone: '+256 780 456 789', email: 'pwaiswa@outlook.com', prog: 'BSIT',  channel: 'Online',  date: '2026-06-20', status: 'Pending' },
  { ref: 'ENQ-26-0044', name: 'Atim Connie',    phone: '+256 704 567 890', email: 'catim@gmail.com',     prog: 'MBA',   channel: 'Kiosk',   date: '2026-06-19', status: 'Converted' },
  { ref: 'ENQ-26-0043', name: 'Ssali Brian',    phone: '+256 756 678 901', email: 'bssali@gmail.com',    prog: 'BSCS',  channel: 'Walk-in', date: '2026-06-18', status: 'Pending' },
]

const STATS = [
  { label: 'Total Enquiries',    value: 47, icon: 'lni-users',     color: 'text-b500' },
  { label: 'Converted',          value: 23, icon: 'lni-checkmark', color: 'text-clr-green' },
  { label: 'Pending Follow-up',  value: 11, icon: 'lni-timer',     color: 'text-clr-amber' },
  { label: 'ODL Specific',       value: 8,  icon: 'lni-world',     color: 'text-clr-purple' },
]

function channelBadge(ch: string) {
  const map: Record<string, string> = { 'Walk-in': 'badge-blue', Phone: 'badge-purple', Online: 'badge-green', Kiosk: 'badge-amber' }
  return map[ch] || 'badge-grey'
}

export default function EnquiryListPage() {
  const router = useRouter()
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)
  const [openModals, setOpenModals] = useState<Set<string>>(new Set())

  function showToast(msg: string, type = '') { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }
  function openModal(id: string) { setOpenModals(prev => new Set(prev).add(id)) }
  function closeModal(id: string) { setOpenModals(prev => { const s = new Set(prev); s.delete(id); return s }) }

  return (
    <div id="page-enquiry-list">
      <div className="pg-hdr">
        <div>
          <h1 className="text-xl font-semibold text-g900">Enquiry List</h1>
          <p className="text-sm text-g500 mt-0.5">All enquiries across channels — walk-in, phone, online &amp; kiosk</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-ghost" onClick={() => router.push('/admission/dashboard')}><i className="lni lni-arrow-left" /> Back</button>
          <button className="btn btn-primary" onClick={() => openModal('enquiry-form-modal')}><i className="lni lni-plus" /> New Enquiry</button>
        </div>
      </div>

      <div className="stats-row">
        {STATS.map(s => (
          <div key={s.label} className="stat-card">
            <div className="flex items-center gap-2 mb-1"><i className={`lni ${s.icon} ${s.color}`} /><span className="text-sm text-g500">{s.label}</span></div>
            <p className="text-2xl font-semibold text-g900">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-g800">Enquiry Register — 2026</h2>
          <div className="flex gap-2">
            <input className="ctrl w-52" placeholder="Search enquiries..." />
            <SearchSelect className="w-36" options={['All Channels', 'Walk-in', 'Phone', 'Online', 'Kiosk']} />
            <button className="btn btn-ghost"><i className="lni lni-download" /> Export</button>
          </div>
        </div>
        <ScrollTable>
          <table>
            <thead><tr><th style={{ width: 48 }}></th><th>Enq. Ref</th><th>Name</th><th>Phone</th><th>Email</th><th>Programme Interest</th><th>Channel</th><th>Date</th><th>Status</th></tr></thead>
            <tbody>
              {ENQUIRY_ROWS.map(r => (
                <tr key={r.ref}>
                  <td>
                    <ActionMenu>
                      {r.status !== 'Converted' && <button className="btn btn-neu btn-sm" onClick={() => router.push('/admission/payment')}><i className="lni lni-arrow-right" /> Convert</button>}
                      <button className="btn btn-neu btn-sm"><i className="lni lni-eye" /> View</button>
                    </ActionMenu>
                  </td>
                  <td className="font-mono text-sm">{r.ref}</td>
                  <td>{r.name}</td>
                  <td className="text-sm text-g600">{r.phone}</td>
                  <td className="text-sm text-g600">{r.email}</td>
                  <td>{r.prog}</td>
                  <td><span className={`badge ${channelBadge(r.channel)}`}>{r.channel}</span></td>
                  <td className="text-sm text-g600">{r.date}</td>
                  <td><span className={r.status === 'Converted' ? 'badge badge-green' : 'badge badge-amber'}>{r.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollTable>
      </div>

      <EnquiryFormModal isOpen={openModals.has('enquiry-form-modal')} onClose={() => closeModal('enquiry-form-modal')} showToast={showToast} />
      <Toast toast={toast} />
    </div>
  )
}
