'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Toast } from '@/components/Toast'
import { ScrollTable } from '@/components/ScrollTable'
import { ActionMenu } from '@/components/ActionMenu'

const ALL_APPLICANTS = [
  { ref: 'ADM-26-0023', name: 'Aisha Nakamya',   src: 'Direct', prog: 'BSCS', type: 'Full-time', fee: 'Paid',    stage: 'Vetting',    date: '12 Jun 2026' },
  { ref: 'ADM-26-0022', name: 'Brian Ochieng',    src: 'CRM',    prog: 'BBA',  type: 'Full-time', fee: 'Paid',    stage: 'Filing',     date: '11 Jun 2026' },
  { ref: 'ADM-26-0021', name: 'Clara Mbabazi',    src: 'Online', prog: 'BSIT', type: 'Weekend',   fee: 'Paid',    stage: 'Vetting',    date: '10 Jun 2026' },
  { ref: 'ADM-26-0020', name: 'David Ssempijja',  src: 'ODel',   prog: 'MBA',  type: 'ODL',       fee: 'Pending', stage: 'Payment',    date: '09 Jun 2026' },
  { ref: 'ADM-26-0019', name: 'Esther Tumukunde', src: 'Direct', prog: 'BSCS', type: 'Full-time', fee: 'Paid',    stage: 'Registered', date: '08 Jun 2026' },
  { ref: 'ADM-26-0018', name: 'Fatuma Ssali',     src: 'CRM',    prog: 'BSCS', type: 'Full-time', fee: 'Paid',    stage: 'Admitted',   date: '07 Jun 2026' },
]

function stageBadge(s: string) {
  const m: Record<string, string> = { Vetting: 'badge-amber', Filing: 'badge-blue', Payment: 'badge-red', Admitted: 'badge-green', Registered: 'badge-gold' }
  return m[s] || 'badge-grey'
}
function srcBadge(s: string) {
  const m: Record<string, string> = { Direct: 'badge-blue', CRM: 'badge-purple', Online: 'badge-green', ODel: 'badge-amber' }
  return m[s] || 'badge-grey'
}
function feeBadge(f: string) { return f === 'Paid' ? 'badge-green' : f === 'Pending' ? 'badge-amber' : 'badge-red' }

export default function ApplicantsPage() {
  const router = useRouter()
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)
  const [search, setSearch] = useState('')
  const [stageFilter, setStageFilter] = useState('All')

  function showToast(msg: string, type = '') { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }

  const filtered = ALL_APPLICANTS.filter(a => {
    const matchSearch = !search || a.name.toLowerCase().includes(search.toLowerCase()) || a.ref.toLowerCase().includes(search.toLowerCase())
    const matchStage = stageFilter === 'All' || a.stage === stageFilter
    return matchSearch && matchStage
  })

  return (
    <div id="page-applicants">
      <div className="pg-hdr">
        <div>
          <h1 className="text-xl font-semibold text-g900">All Applicants &mdash; Spring 2026</h1>
          <p className="text-sm text-g500 mt-0.5">Complete list of all applicants across all pipeline stages</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <i className="lni lni-search-alt absolute left-2.5 top-1/2 -translate-y-1/2 text-g400 text-sm" />
            <input className="ctrl pl-8 w-56" placeholder="Search applicants…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="ctrl w-40" value={stageFilter} onChange={e => setStageFilter(e.target.value)}>
            <option>All</option><option>Payment</option><option>Filing</option>
            <option>Vetting</option><option>Admitted</option><option>Registered</option>
          </select>
          <button className="btn btn-outline" onClick={() => showToast('CSV exported successfully', 'success')}>
            <i className="lni lni-download mr-1" /> Export CSV
          </button>
        </div>
      </div>

      <div className="card">
        <ScrollTable>
          <table>
            <thead>
              <tr className="text-left text-g500 border-b border-g200">
                <th style={{ width: 48 }}></th>
                <th className="pb-2 font-medium w-8">#</th>
                <th className="pb-2 font-medium">App. Ref</th>
                <th className="pb-2 font-medium">Applicant Name</th>
                <th className="pb-2 font-medium">Source</th>
                <th className="pb-2 font-medium">Programme</th>
                <th className="pb-2 font-medium">Type</th>
                <th className="pb-2 font-medium">Fee</th>
                <th className="pb-2 font-medium">Stage</th>
                <th className="pb-2 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a, i) => (
                <tr key={a.ref} className="border-b border-g100 hover:bg-g50">
                  <td><ActionMenu><button className="btn btn-neu btn-sm" onClick={() => router.push('/admission/registration')}><i className="lni lni-eye" /> View</button></ActionMenu></td>
                  <td className="py-2.5 text-g400">{i + 1}</td>
                  <td className="py-2.5 font-mono text-xs text-b600">{a.ref}</td>
                  <td className="py-2.5 text-g800 font-medium">{a.name}</td>
                  <td className="py-2.5"><span className={`badge ${srcBadge(a.src)}`}>{a.src}</span></td>
                  <td className="py-2.5">{a.prog}</td>
                  <td className="py-2.5 text-g600">{a.type}</td>
                  <td className="py-2.5"><span className={`badge ${feeBadge(a.fee)}`}>{a.fee}</span></td>
                  <td className="py-2.5"><span className={`badge ${stageBadge(a.stage)}`}>{a.stage}</span></td>
                  <td className="py-2.5 text-g500 text-xs">{a.date}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={10} className="py-8 text-center text-g400">No applicants match the current filters.</td></tr>
              )}
            </tbody>
          </table>
        </ScrollTable>
      </div>

      <Toast toast={toast} />
    </div>
  )
}
