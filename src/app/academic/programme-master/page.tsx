'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ScrollTable } from '@/components/ScrollTable'
import { ActionMenu } from '@/components/ActionMenu'
import { ProgrammeModal } from '@/components/ProgrammeModal'
import { SpecializationModal } from '@/components/SpecializationModal'
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
          <div><div className="pg-title">Programme Master</div><div className="pg-sub">Define programme versions · Manage active/inactive status · Accreditation tracking · Specializations</div></div>
          <button className="btn btn-primary" onClick={() => openModal('new-prog-modal')}><i className="lni lni-plus"></i> Add Programme Version</button>
        </div>

        <div className="flex items-center gap-2 mb-[18px] flex-wrap">
          <button className="btn btn-neu btn-sm text-[11px]" onClick={() => nav('a-level-master')}><i className="lni lni-graduation"></i> Programme Level</button>
          <span className="text-g300 text-[16px]">→</span>
          <button className="btn btn-neu btn-sm text-[11px]" onClick={() => nav('programme-group')}><i className="lni lni-folder"></i> Programme Group</button>
          <span className="text-g300 text-[16px]">→</span>
          <span className="bg-b50 border-[1.5px] border-[var(--b200)] rounded-[var(--rxs)] py-[5px] px-3 text-[11px] font-bold text-b700"><i className="lni lni-graduation"></i> Programme Master ← You are here</span>
          <span className="text-g300 text-[16px]">→</span>
          <button className="btn btn-neu btn-sm text-[11px]" onClick={() => nav('course-units')}><i className="lni lni-book"></i> Course Units</button>
        </div>

        <div className="warn-box mb-[18px]">
          <i className="lni lni-warning"></i> <span><strong>Versioning Rule:</strong> NCHE mandates a minimum 30–50% curriculum change every 5 years for reaccreditation. Old versions (e.g. BCA 2026) must remain <em>Inactive</em> so existing students continue on their curriculum. New versions (e.g. BCA 2031) are set <em>Active</em> for new admissions only.</span>
        </div>

        <div className="danger-box mb-[14px]">
          <i className="lni lni-volume-high"></i> <span><strong>Accreditation Alert:</strong> BBA 2021 version expires in <strong>6 months (Oct 2026)</strong>. Start NCHE reaccreditation process and prepare BBA 2027 curriculum version. <button className="btn btn-neu btn-sm ml-2" onClick={() => nav('programme-master')}>View →</button></span>
        </div>

        <div className="card">
          <div className="card-hdr">
            <div className="card-title"><span className="ctitle-icon"><i className="lni lni-graduation"></i></span> All Programme Versions</div>
            <div className="flex gap-2">
              <select className="ctrl w-auto text-xs"><option>All Levels</option><option>Bachelor&apos;s</option><option>Master&apos;s</option><option>PhD</option><option>Diploma</option></select>
              <select className="ctrl w-auto text-xs"><option>All Statuses</option><option>Active</option><option>Inactive</option></select>
              <button className="btn btn-neu btn-sm"><i className="lni lni-upload"></i> Export</button>
            </div>
          </div>
          <ScrollTable>
            <table>
              <thead><tr><th>Prog. Code</th><th>Programme Name</th><th>Group</th><th>Programme Level</th><th>Faculty → Campus</th><th>Accreditation Date</th><th>Expires</th><th>No IA</th><th>Specializations</th><th>Admission Status</th><th>Action</th></tr></thead>
              <tbody>
                <tr>
                  <td className="font-mono text-[11px] text-b700">BCA-2026</td>
                  <td><strong>Bachelor of Computer Appl. 2026</strong></td>
                  <td>BCA</td><td>Bachelor&apos;s · 3yr / 6sem</td>
                  <td>FCT → Main Campus</td><td>Jan 2026</td>
                  <td><span className="badge badge-green">Jan 2031</span></td>
                  <td><span className="badge badge-grey">No</span></td>
                  <td>—</td>
                  <td><span className="badge badge-green"><span className="bdot"></span>Active</span></td>
                  <td><ActionMenu><button className="btn btn-neu btn-sm" onClick={() => openModal('new-prog-modal')}><i className="lni lni-pencil"></i> Edit</button><button className="btn btn-neu btn-sm" onClick={() => nav('course-units')}><i className="lni lni-book"></i> Curriculum</button></ActionMenu></td>
                </tr>
                <tr>
                  <td className="font-mono text-[11px] text-g400">BCA-2021</td>
                  <td>Bachelor of Computer Appl. 2021</td>
                  <td>BCA</td><td>Bachelor&apos;s · 3yr / 6sem</td>
                  <td>FCT → Main Campus</td><td>Jan 2021</td>
                  <td><span className="badge badge-grey">Jan 2026 — Retired</span></td>
                  <td><span className="badge badge-grey">No</span></td>
                  <td>—</td>
                  <td><span className="badge badge-grey">Inactive (existing students only)</span></td>
                  <td><button className="btn btn-neu btn-sm"><i className="lni lni-eye"></i> View</button></td>
                </tr>
                <tr className="flagged">
                  <td className="font-mono text-[11px] text-b700">BBA-2021</td>
                  <td><strong>BBA Business Administration 2021</strong></td>
                  <td>BBA</td><td>Bachelor&apos;s · 3yr / 6sem</td>
                  <td>FBM → Main Campus</td><td>Oct 2021</td>
                  <td><span className="badge badge-red"><i className="lni lni-warning"></i> Oct 2026 — Expiring Soon</span></td>
                  <td><span className="badge badge-grey">No</span></td>
                  <td>—</td>
                  <td><span className="badge badge-green"><span className="bdot"></span>Active</span></td>
                  <td><ActionMenu><button className="btn btn-amber btn-sm" onClick={() => openModal('new-prog-modal')}><i className="lni lni-warning"></i> Renew</button><button className="btn btn-primary btn-sm" onClick={() => openModal('new-prog-modal')}><i className="lni lni-plus"></i> New Version</button></ActionMenu></td>
                </tr>
                <tr>
                  <td className="font-mono text-[11px] text-b700">MBA-2024</td>
                  <td><strong>MBA Business Administration 2024</strong></td>
                  <td>MBA</td><td>Master&apos;s · 2yr / 4sem</td>
                  <td>FBM → Main Campus</td><td>Mar 2024</td>
                  <td><span className="badge badge-green">Mar 2029</span></td>
                  <td><span className="badge badge-grey">No</span></td>
                  <td><span className="badge badge-blue">3 Specializations</span></td>
                  <td><span className="badge badge-green"><span className="bdot"></span>Active</span></td>
                  <td><ActionMenu><button className="btn btn-neu btn-sm" onClick={() => openModal('new-prog-modal')}><i className="lni lni-pencil"></i> Edit</button><button className="btn btn-neu btn-sm" onClick={() => openModal('specialization-modal')}><i className="lni lni-target"></i> Specializations</button></ActionMenu></td>
                </tr>
                <tr>
                  <td className="font-mono text-[11px] text-b700">PHD-CS-2023</td>
                  <td><strong>Doctor of Philosophy — CS 2023</strong></td>
                  <td>—</td><td>PhD · 3yr / 6sem</td>
                  <td>FCT → Main Campus</td><td>Jun 2023</td>
                  <td><span className="badge badge-green">Jun 2028</span></td>
                  <td><span className="badge badge-amber"><i className="lni lni-checkmark"></i> No Internal Assessment</span></td>
                  <td>—</td>
                  <td><span className="badge badge-green"><span className="bdot"></span>Active</span></td>
                  <td><button className="btn btn-neu btn-sm" onClick={() => openModal('new-prog-modal')}><i className="lni lni-pencil"></i> Edit</button></td>
                </tr>
              </tbody>
            </table>
          </ScrollTable>
        </div>
      </div>
      <ProgrammeModal isOpen={openModals.has('new-prog-modal')} onClose={() => closeModal('new-prog-modal')} showToast={showToast} />
      <SpecializationModal isOpen={openModals.has('specialization-modal')} onClose={() => closeModal('specialization-modal')} showToast={showToast} />
      <Toast toast={toast} />
    </>
  )
}
