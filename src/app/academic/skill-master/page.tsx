'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ScrollTable } from '@/components/ScrollTable'
import { AddSkillModal } from '@/components/AddSkillModal'
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
          <div>
            <div className="pg-title">Skill Management Master</div>
            <div className="pg-sub">Module 3 · Faculty-only access · Feeds directly into Course Allocation · Prerequisite for allocation</div>
          </div>
          <div className="flex gap-2">
            <button className="btn btn-neu btn-sm" onClick={() => nav('allocation')}>→ Proceed to Allocation</button>
            <button className="btn btn-primary" onClick={() => openModal('add-skill-modal')}><i className="lni lni-plus"></i> Add Skill</button>
          </div>
        </div>
        <div className="warn-box mb-[18px]">
          <i className="lni lni-warning"></i> <span><strong>Prerequisite:</strong> Faculty must input their subject expertise here before Course Allocation can be performed. The allocation screen reads from this master to validate faculty-subject matches. <strong>Faculty-only access</strong> — academic administrators can view but not edit on behalf of faculty.</span>
        </div>
        <div className="g2 mb-[18px]">
          <div className="info-box"><i className="lni lni-bulb"></i> Skills entered here define which course units a faculty member is eligible to be allocated. Typical faculty load is <strong>5–6 subjects per intake</strong>. Project subjects only require <strong>weekly check-ins</strong>, not traditional lectures.</div>
          <div className="info-box"><i className="lni lni-link"></i> This master feeds directly into <strong>Course Allocation</strong>. Allocation is only possible for faculty who have logged their skills. The Dean&apos;s Excel allocation file should reference faculty skill codes when assigning subjects.</div>
        </div>
        <div className="g4 mb-[18px]">
          <div className="stat-card"><div className="stat-lbl">Total Faculty</div><div className="stat-num">28</div><div className="stat-sub up">Teaching this intake</div></div>
          <div className="stat-card [--b700:var(--green)] [--b400:#34d399]"><div className="stat-lbl">Skills Populated</div><div className="stat-num text-clr-green">24</div><div className="stat-sub up">Ready for allocation</div></div>
          <div className="stat-card [--b700:var(--amber)] [--b400:#fbbf24]"><div className="stat-lbl">Skills Incomplete</div><div className="stat-num text-clr-amber">4</div><div className="stat-sub warn">Allocation blocked</div></div>
          <div className="stat-card [--b700:var(--purple)] [--b400:#a78bfa]"><div className="stat-lbl">Total Skills Logged</div><div className="stat-num text-clr-purple">142</div><div className="stat-sub up">Across all faculty</div></div>
        </div>
        <div className="card">
          <div className="card-hdr">
            <div className="card-title"><span className="ctitle-icon"><i className="lni lni-bulb"></i></span> Faculty Skill Register</div>
            <div className="flex gap-2">
              <select className="ctrl w-auto text-xs"><option>All Faculty</option><option>FCT</option><option>FBM</option><option>FEN</option></select>
              <select className="ctrl w-auto text-xs"><option>All Statuses</option><option>Complete</option><option>Incomplete</option></select>
              <button className="btn btn-neu btn-sm"><i className="lni lni-upload"></i> Export</button>
            </div>
          </div>
          <ScrollTable>
            <table>
              <thead><tr><th>Faculty Name</th><th>Faculty</th><th>Skills / Subject Areas</th><th>Subjects Eligible</th><th>Current Load</th><th>Project Check-ins</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>
                <tr>
                  <td><strong>Dr. Ssekibuule Ronald</strong></td><td>FCT</td>
                  <td><div className="flex gap-1 flex-wrap"><span className="pill pill-blue">Programming</span><span className="pill pill-blue">Data Structures</span><span className="pill pill-cyan">OS</span></div></td>
                  <td>8</td><td><span className="badge badge-green">5 subjects</span></td><td>1</td>
                  <td><span className="badge badge-green"><i className="lni lni-checkmark"></i> Complete</span></td>
                  <td><button className="btn btn-neu btn-sm" onClick={() => openModal('skill-edit-modal')}><i className="lni lni-pencil"></i> View</button></td>
                </tr>
                <tr>
                  <td><strong>Ms. Namutebi Joyce</strong></td><td>FCT</td>
                  <td><div className="flex gap-1 flex-wrap"><span className="pill pill-blue">Computer Org.</span><span className="pill pill-blue">Networks</span></div></td>
                  <td>5</td><td><span className="badge badge-green">6 subjects</span></td><td>0</td>
                  <td><span className="badge badge-green"><i className="lni lni-checkmark"></i> Complete</span></td>
                  <td><button className="btn btn-neu btn-sm" onClick={() => openModal('skill-edit-modal')}><i className="lni lni-pencil"></i> View</button></td>
                </tr>
                <tr>
                  <td><strong>Prof. Mukasa Charles</strong></td><td>FBM</td>
                  <td><div className="flex gap-1 flex-wrap"><span className="pill pill-blue">Economics</span><span className="pill pill-blue">Finance Mgmt</span><span className="pill pill-cyan">Strategy</span></div></td>
                  <td>9</td><td><span className="badge badge-amber">5 subjects</span></td><td>2</td>
                  <td><span className="badge badge-green"><i className="lni lni-checkmark"></i> Complete</span></td>
                  <td><button className="btn btn-neu btn-sm" onClick={() => openModal('skill-edit-modal')}><i className="lni lni-pencil"></i> View</button></td>
                </tr>
                <tr className="flagged">
                  <td><strong>Dr. Kibira Moses</strong></td><td>FCT</td>
                  <td><span className="text-muted">— No skills entered —</span></td>
                  <td>0</td><td><span className="badge badge-grey">Unallocated</span></td><td>0</td>
                  <td><span className="badge badge-red"><i className="lni lni-close"></i> Incomplete</span></td>
                  <td><button className="btn btn-amber btn-sm" onClick={() => openModal('skill-edit-modal')}>Add Skills →</button></td>
                </tr>
                <tr className="flagged">
                  <td><strong>Ms. Atim Grace</strong></td><td>FBM</td>
                  <td><div className="flex gap-1"><span className="pill pill-blue">Accounting</span></div></td>
                  <td>2</td><td><span className="badge badge-grey">Unallocated</span></td><td>0</td>
                  <td><span className="badge badge-amber"><i className="lni lni-warning"></i> Partial</span></td>
                  <td><button className="btn btn-amber btn-sm" onClick={() => openModal('skill-edit-modal')}>Update Skills →</button></td>
                </tr>
              </tbody>
            </table>
          </ScrollTable>
        </div>
      </div>
      <AddSkillModal isOpen={openModals.has('add-skill-modal')} onClose={() => closeModal('add-skill-modal')} showToast={showToast} />
      <Toast toast={toast} />
    </>
  )
}
