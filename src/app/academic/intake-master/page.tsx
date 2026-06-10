'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ScrollTable } from '@/components/ScrollTable'
import { NewIntakeModal } from '@/components/NewIntakeModal'
import { EditIntakeModal } from '@/components/EditIntakeModal'
import { Toast } from '@/components/Toast'

export default function Page() {
  const router = useRouter()
  const [openModals, setOpenModals] = useState<Set<string>>(new Set())
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)

  function nav(id: string) { router.push('/academic/' + id) }
  function openModal(id: string) { setOpenModals(prev => new Set(prev).add(id)) }
  function closeModal(id: string) { setOpenModals(prev => { const s = new Set(prev); s.delete(id); return s }) }
  function showToast(msg: string, type = '') { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }

  return (
    <>
      <div className="page active">
        <div className="pg-hdr">
          <div><div className="pg-title">Intake Master</div><div className="pg-sub">Configure academic sessions · Set all semester and term dates · Manage current intakes</div></div>
          <button className="btn btn-primary" onClick={() => openModal('new-intake-modal')}><i className="lni lni-plus"></i> New Intake</button>
        </div>
        <div className="warn-box mb-5">
          <i className="lni lni-warning"></i> <span><strong>Rule:</strong> Only one <em>Current Academic Intake</em> and one <em>Current Admission Intake</em> can be active at a time. All dates are manually set to allow flexibility for government notices, student requests, and external factors.</span>
        </div>
        <div className="g2 mb-[18px]">
          <div className="bg-[linear-gradient(135deg,var(--b800),var(--b600))] rounded-xl p-5 text-white shadow-[var(--neu-out)]">
            <div className="text-[11px] font-bold uppercase tracking-[.08em] opacity-[.7] mb-1">Current Academic Intake</div>
            <div className="text-[22px] font-extrabold">Spring 2026</div>
            <div className="text-xs opacity-[.8] mt-[2px]">Code: 20261 · Teaching in progress</div>
            <div className="mt-[14px] flex gap-[10px] flex-wrap">
              <div className="bg-[rgba(255,255,255,.15)] rounded-md p-[6px_10px] text-[11px]"><div className="opacity-[.7]">Sem Start</div><div className="font-bold">01 Feb 2026</div></div>
              <div className="bg-[rgba(255,255,255,.15)] rounded-md p-[6px_10px] text-[11px]"><div className="opacity-[.7]">Term 1 End</div><div className="font-bold">30 Mar 2026</div></div>
              <div className="bg-[rgba(255,255,255,.15)] rounded-md p-[6px_10px] text-[11px]"><div className="opacity-[.7]">Sem End</div><div className="font-bold">31 May 2026</div></div>
            </div>
          </div>
          <div className="bg-[linear-gradient(135deg,#047857,var(--green))] rounded-xl p-5 text-white shadow-[var(--neu-out)]">
            <div className="text-[11px] font-bold uppercase tracking-[.08em] opacity-[.7] mb-1">Current Admission Intake</div>
            <div className="text-[22px] font-extrabold">Fall 2026</div>
            <div className="text-xs opacity-[.8] mt-[2px]">Code: 20262 · Admissions open</div>
            <div className="mt-[14px] flex gap-[10px] flex-wrap">
              <div className="bg-[rgba(255,255,255,.15)] rounded-md p-[6px_10px] text-[11px]"><div className="opacity-[.7]">Open Date</div><div className="font-bold">01 Mar 2026</div></div>
              <div className="bg-[rgba(255,255,255,.15)] rounded-md p-[6px_10px] text-[11px]"><div className="opacity-[.7]">Close Date</div><div className="font-bold">15 Jul 2026</div></div>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-hdr">
            <div className="card-title"><span className="ctitle-icon"><i className="lni lni-calendar"></i></span> All Intakes</div>
            <button className="btn btn-neu btn-sm"><i className="lni lni-upload"></i> Export</button>
          </div>
          <ScrollTable>
            <table>
              <thead><tr><th>Code</th><th>Description</th><th>Fin. Year</th><th>Sem Start</th><th>Term1 End</th><th>Term2 End</th><th>Grievance End</th><th>Re-entry Date</th><th>Academic?</th><th>Admission?</th><th>Action</th></tr></thead>
              <tbody>
                <tr className="selected-row"><td><span className="font-bold text-blue font-mono">20261</span></td><td><strong>Spring 2026</strong></td><td>2025–26</td><td>01 Feb 2026</td><td>30 Mar 2026</td><td>31 May 2026</td><td>10 Jun 2026</td><td>15 Jun 2026</td><td><span className="badge badge-green"><i className="lni lni-checkmark"></i> Current</span></td><td>—</td><td><button className="btn btn-neu btn-sm" onClick={() => openModal('intake-edit-modal')}><i className="lni lni-pencil"></i> Edit</button></td></tr>
                <tr><td><span className="font-bold text-blue font-mono">20262</span></td><td><strong>Fall 2026</strong></td><td>2026–27</td><td>01 Aug 2026</td><td>30 Sep 2026</td><td>30 Nov 2026</td><td>10 Dec 2026</td><td>15 Dec 2026</td><td>—</td><td><span className="badge badge-green"><i className="lni lni-checkmark"></i> Current</span></td><td><button className="btn btn-neu btn-sm" onClick={() => openModal('intake-edit-modal')}><i className="lni lni-pencil"></i> Edit</button></td></tr>
                <tr><td><span className="font-bold font-mono text-g400">20253</span></td><td>Autumn 2025</td><td>2025–26</td><td>01 Sep 2025</td><td>31 Oct 2025</td><td>31 Dec 2025</td><td>10 Jan 2026</td><td>15 Jan 2026</td><td><span className="badge badge-grey">Closed</span></td><td><span className="badge badge-grey">Closed</span></td><td><button className="btn btn-neu btn-sm"><i className="lni lni-eye"></i> View</button></td></tr>
              </tbody>
            </table>
          </ScrollTable>
        </div>
      </div>
      <NewIntakeModal isOpen={openModals.has('new-intake-modal')} onClose={() => closeModal('new-intake-modal')} showToast={showToast} />
      <EditIntakeModal isOpen={openModals.has('intake-edit-modal')} onClose={() => closeModal('intake-edit-modal')} showToast={showToast} />
      <Toast toast={toast} />
    </>
  )
}
