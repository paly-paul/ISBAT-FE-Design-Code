'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ScrollTable } from '@/components/ScrollTable'
import { AllocImportModal } from '@/components/AllocImportModal'
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
          <div><div className="pg-title">Course Unit Allocation</div><div className="pg-sub">Assign course units to faculty · Upload HOD Excel sheet · Preview and confirm allocation</div></div>
          <div className="flex gap-2">
            <button className="btn btn-neu btn-sm" onClick={() => openModal('manual-alloc-modal')}><i className="lni lni-plus"></i> Manual Entry</button>
            <button className="btn btn-primary" onClick={() => openModal('alloc-import-modal')}><i className="lni lni-download"></i> Import from Excel</button>
          </div>
        </div>

        <div className="g2 mb-[18px]">
          <div className="warn-box">
            <i className="lni lni-warning"></i> <span><strong>Prerequisite:</strong> Faculty must have populated their skills in the <button className="btn btn-amber btn-sm p-[3px_10px] text-[11px]" onClick={() => nav('skill-master')}><i className="lni lni-bulb"></i> Skill Management Master</button> before allocation. <strong>4 faculty members</strong> currently have incomplete skill profiles — allocation for those faculty is blocked.</span>
          </div>
          <div className="info-box">
            <i className="lni lni-information"></i> <span>Allocation data is manually entered by <strong>Support Staff</strong> from the Dean&apos;s pre-approved Excel file. <strong>No system restriction</strong> on subject count per faculty — typical load is <strong>5–6 subjects</strong>. <strong>Project subjects</strong> only require weekly check-ins, not traditional lectures — allocate accordingly.</span>
          </div>
        </div>

        <div className="g4 mb-[18px]">
          <div className="stat-card"><div className="stat-lbl">Total Course Units</div><div className="stat-num">84</div><div className="stat-sub up">Across all programmes</div></div>
          <div className="stat-card [--b700:var(--green)] [--b400:#34d399]"><div className="stat-lbl">Allocated</div><div className="stat-num text-clr-green">81</div><div className="stat-sub up">96% complete</div></div>
          <div className="stat-card [--b700:var(--amber)] [--b400:#fbbf24]"><div className="stat-lbl">Unallocated</div><div className="stat-num text-clr-amber">3</div><div className="stat-sub warn">Action required</div></div>
          <div className="stat-card [--b700:var(--purple)] [--b400:#a78bfa]"><div className="stat-lbl">Faculty Members</div><div className="stat-num text-clr-purple">28</div><div className="stat-sub up">Teaching this intake</div></div>
        </div>

        <div className="card">
          <div className="card-hdr">
            <div className="card-title"><span className="ctitle-icon"><i className="lni lni-graduation"></i></span> Current Allocations — Spring 2026</div>
            <div className="flex gap-2">
              <select className="ctrl w-auto text-xs"><option>All Programmes</option><option>BSc. IT</option><option>BBA</option><option>BEng. Civil</option></select>
              <select className="ctrl w-auto text-xs"><option>All Statuses</option><option>Allocated</option><option>Unallocated</option></select>
            </div>
          </div>
          <ScrollTable>
            <table>
              <thead><tr><th>Course Code</th><th>Unit Name</th><th>Programme</th><th>Semester</th><th>Batch</th><th>Allocated To</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>
                <tr><td className="font-mono text-[11px] text-b700">IT101</td><td>Introduction to Programming</td><td>BSc. IT</td><td>Sem 1</td><td>BSC-IT-S1-D</td><td><span className="font-bold">Dr. Ssekibuule Ronald</span></td><td><span className="badge badge-green"><i className="lni lni-checkmark"></i> Allocated</span></td><td><button className="btn btn-neu btn-sm" onClick={() => showToast('Editing IT101', 'info')}><i className="lni lni-pencil"></i> Edit</button></td></tr>
                <tr><td className="font-mono text-[11px] text-b700">IT102</td><td>Computer Organisation</td><td>BSc. IT</td><td>Sem 1</td><td>BSC-IT-S1-D</td><td><span className="font-bold">Ms. Namutebi Joyce</span></td><td><span className="badge badge-green"><i className="lni lni-checkmark"></i> Allocated</span></td><td><button className="btn btn-neu btn-sm" onClick={() => showToast('Editing IT102', 'info')}><i className="lni lni-pencil"></i> Edit</button></td></tr>
                <tr className="flagged"><td className="font-mono text-[11px] text-b700">BBA301</td><td>Strategic Management</td><td>BBA</td><td>Sem 3</td><td>BBA-S3-D</td><td><span className="text-muted">— Unallocated —</span></td><td><span className="badge badge-red"><i className="lni lni-close"></i> Missing</span></td><td><button className="btn btn-amber btn-sm" onClick={() => showToast('Assigning BBA301', 'info')}>Assign →</button></td></tr>
                <tr className="flagged"><td className="font-mono text-[11px] text-b700">BBA302</td><td>Business Ethics</td><td>BBA</td><td>Sem 3</td><td>BBA-S3-D</td><td><span className="text-muted">— Unallocated —</span></td><td><span className="badge badge-red"><i className="lni lni-close"></i> Missing</span></td><td><button className="btn btn-amber btn-sm" onClick={() => showToast('Assigning BBA302', 'info')}>Assign →</button></td></tr>
                <tr className="flagged"><td className="font-mono text-[11px] text-b700">BBA303</td><td>Financial Accounting III</td><td>BBA</td><td>Sem 3</td><td>BBA-S3-D</td><td><span className="text-muted">— Unallocated —</span></td><td><span className="badge badge-red"><i className="lni lni-close"></i> Missing</span></td><td><button className="btn btn-amber btn-sm" onClick={() => showToast('Assigning BBA303', 'info')}>Assign →</button></td></tr>
                <tr><td className="font-mono text-[11px] text-b700">MBA101</td><td>Managerial Economics</td><td>MBA</td><td>Sem 1</td><td>MBA-S1-E</td><td><span className="font-bold">Prof. Mukasa Charles</span></td><td><span className="badge badge-green"><i className="lni lni-checkmark"></i> Allocated</span></td><td><button className="btn btn-neu btn-sm" onClick={() => showToast('Editing MBA101', 'info')}><i className="lni lni-pencil"></i> Edit</button></td></tr>
              </tbody>
            </table>
          </ScrollTable>
        </div>
      </div>
      <AllocImportModal isOpen={openModals.has('alloc-import-modal')} onClose={() => closeModal('alloc-import-modal')} showToast={showToast} />
      <Toast toast={toast} />
    </>
  )
}
