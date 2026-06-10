'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ScrollTable } from '@/components/ScrollTable'
import { NewBatchModal } from '@/components/NewBatchModal'
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
          <div><div className="pg-title">Batch Management</div><div className="pg-sub">Create batches per intake · Auto-generate batch codes · Sub-batch large cohorts · Assign Batch In-Charge</div></div>
          <button className="btn btn-primary" onClick={() => openModal('new-batch-modal')}><i className="lni lni-plus"></i> Create Batch</button>
        </div>

        <div className="info-box mb-[14px]">
          <i className="lni lni-information"></i> <span>Batch Code is <strong>system-generated</strong> as: <span className="font-mono bg-[var(--b100)] py-[2px] px-[6px] rounded">Course Code + Session/Year + Batch Type + Sub-Batch</span> e.g. <strong>BSc-VFX-S26-DA</strong>. Large cohorts (100+ students) are split into <strong>sub-batches (DA, DB)</strong> of ~50 for separate timetabling and faculty allocation.</span>
        </div>
        <div className="warn-box mb-[18px]">
          <i className="lni lni-warning"></i> <span>Admissions occur <strong>every semester (twice a year)</strong>. A new batch must be created for each intake. <strong>Specialization</strong> is assigned to the individual student — not the batch. <strong>Batch In-Charges</strong> can view batch reports but have no direct relation to programme courses.</span>
        </div>

        <div className="g4 mb-[18px]">
          <div className="stat-card"><div className="stat-lbl">Active Batches</div><div className="stat-num">18</div><div className="stat-sub up">Spring 2026</div></div>
          <div className="stat-card [--b700:var(--amber)] [--b400:#fbbf24]"><div className="stat-lbl">Pending Sub-batch</div><div className="stat-num text-clr-amber">3</div><div className="stat-sub warn">Cohorts &gt; 50 students</div></div>
          <div className="stat-card [--b700:var(--green)] [--b400:#34d399]"><div className="stat-lbl">Total Students</div><div className="stat-num text-clr-green">1,284</div><div className="stat-sub up">Across all batches</div></div>
          <div className="stat-card [--b700:var(--purple)] [--b400:#a78bfa]"><div className="stat-lbl">Batch In-Charges</div><div className="stat-num text-clr-purple">18</div><div className="stat-sub up">Assigned</div></div>
        </div>

        <div className="card">
          <div className="card-hdr">
            <div className="card-title"><span className="ctitle-icon"><i className="lni lni-users"></i></span> Active Batches — Spring 2026 (20261)</div>
            <div className="flex gap-2">
              <select className="ctrl w-auto text-xs"><option>All Programmes</option><option>BSc. IT</option><option>BBA</option><option>MBA</option><option>BEng. Civil</option></select>
              <select className="ctrl w-auto text-xs"><option>All Types</option><option>Day</option><option>Evening</option><option>Weekend</option><option>Distance/Online</option></select>
              <button className="btn btn-neu btn-sm"><i className="lni lni-upload"></i> Export</button>
            </div>
          </div>
          <ScrollTable>
            <table>
              <thead><tr><th>Batch Code</th><th>Programme (Version)</th><th>Semester</th><th>Type</th><th>Sub-Batch</th><th>Students</th><th>Batch In-Charge</th><th>Timetable</th><th>Action</th></tr></thead>
              <tbody>
                <tr>
                  <td><span className="font-bold text-blue font-mono">BSC-IT-S26-DA</span></td>
                  <td>BSc. IT 2026 <span className="pill pill-blue">BCA-2026</span></td>
                  <td>Sem 1</td><td><span className="badge badge-blue">Day</span></td>
                  <td><span className="badge badge-grey">DA (sub-batch A)</span></td>
                  <td>42</td><td>Dr. Ssekibuule Ronald</td>
                  <td><span className="badge badge-green"><i className="lni lni-checkmark"></i> Set</span></td>
                  <td><button className="btn btn-neu btn-sm" onClick={() => openModal('new-batch-modal')}><i className="lni lni-pencil"></i> Edit</button></td>
                </tr>
                <tr>
                  <td><span className="font-bold text-blue font-mono">BSC-IT-S26-DB</span></td>
                  <td>BSc. IT 2026 <span className="pill pill-blue">BCA-2026</span></td>
                  <td>Sem 1</td><td><span className="badge badge-blue">Day</span></td>
                  <td><span className="badge badge-blue">DB (sub-batch B)</span></td>
                  <td>38</td><td>Ms. Namutebi Joyce</td>
                  <td><span className="badge badge-green"><i className="lni lni-checkmark"></i> Set</span></td>
                  <td><button className="btn btn-neu btn-sm" onClick={() => openModal('new-batch-modal')}><i className="lni lni-pencil"></i> Edit</button></td>
                </tr>
                <tr>
                  <td><span className="font-bold text-blue font-mono">BBA-S26-DA</span></td>
                  <td>BBA 2021 <span className="pill pill-blue">BBA-2021</span></td>
                  <td>Sem 3</td><td><span className="badge badge-blue">Day</span></td>
                  <td><span className="badge badge-grey">DA</span></td>
                  <td>38</td><td>Prof. Mukasa Charles</td>
                  <td><span className="badge badge-amber">Draft</span></td>
                  <td><button className="btn btn-neu btn-sm" onClick={() => openModal('new-batch-modal')}><i className="lni lni-pencil"></i> Edit</button></td>
                </tr>
                <tr>
                  <td><span className="font-bold text-blue font-mono">MBA-S26-EA</span></td>
                  <td>MBA 2024 <span className="pill pill-blue">MBA-2024</span></td>
                  <td>Sem 1</td><td><span className="badge badge-purple">Evening</span></td>
                  <td><span className="badge badge-grey">EA</span></td>
                  <td>24</td><td>Dr. Kato Andrew</td>
                  <td><span className="badge badge-green"><i className="lni lni-checkmark"></i> Set</span></td>
                  <td><button className="btn btn-neu btn-sm" onClick={() => openModal('new-batch-modal')}><i className="lni lni-pencil"></i> Edit</button></td>
                </tr>
                <tr className="flagged">
                  <td><span className="font-bold font-mono text-clr-amber">BSC-VFX-S26-??</span></td>
                  <td>BSc. VFX 2026 <span className="pill pill-blue">VFX-2026</span></td>
                  <td>Sem 1</td><td><span className="badge badge-blue">Day</span></td>
                  <td><span className="badge badge-amber"><i className="lni lni-warning"></i> 102 students — needs sub-batching</span></td>
                  <td>102</td><td>—</td>
                  <td><span className="badge badge-red">Not Set</span></td>
                  <td><button className="btn btn-amber btn-sm" onClick={() => openModal('new-batch-modal')}>Split → Sub-batches</button></td>
                </tr>
              </tbody>
            </table>
          </ScrollTable>
        </div>

        <div className="card">
          <div className="card-hdr">
            <div className="card-title"><span className="ctitle-icon"><i className="lni lni-cog"></i></span> Batch Code Generator</div>
            <span className="badge badge-blue">Auto-generated</span>
          </div>
          <div className="g4">
            <div className="fg"><div className="lbl">Course Code</div><input className="ctrl" type="text" placeholder="e.g. BSC-IT" /></div>
            <div className="fg"><div className="lbl">Session / Year</div>
              <select className="ctrl"><option value="S26">S26 (Spring 2026)</option><option value="F26">F26 (Fall 2026)</option><option value="S27">S27 (Spring 2027)</option></select>
            </div>
            <div className="fg"><div className="lbl">Batch Type</div>
              <select className="ctrl"><option value="D">D — Day</option><option value="E">E — Evening</option><option value="W">W — Weekend</option><option value="O">O — Distance/Online</option></select>
            </div>
            <div className="fg"><div className="lbl">Sub-batch</div>
              <select className="ctrl"><option value="A">A (first sub-batch)</option><option value="B">B (second sub-batch)</option><option value="C">C (third sub-batch)</option></select>
            </div>
          </div>
          <div className="mt-[14px] p-[14px] bg-b50 border-[1.5px] border-[var(--b200)] rounded-[var(--rsm)] flex items-center gap-4">
            <span className="text-[11px] font-bold text-g500 uppercase">Generated Batch Code:</span>
            <span className="font-mono text-[18px] font-extrabold text-b800">BSC-IT-S26-DA</span>
          </div>
        </div>
      </div>
      <NewBatchModal isOpen={openModals.has('new-batch-modal')} onClose={() => closeModal('new-batch-modal')} showToast={showToast} />
      <Toast toast={toast} />
    </>
  )
}
