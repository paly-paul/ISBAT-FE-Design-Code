'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ScrollTable } from '@/components/ScrollTable'
import { ActionMenu } from '@/components/ActionMenu'
import { CourseUnitModal } from '@/components/CourseUnitModal'
import { ElectiveSelectModal } from '@/components/ElectiveSelectModal'
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
          <div><div className="pg-title">Course Units Master (Curriculum)</div><div className="pg-sub">Define subjects per semester · Set Unit Type and Category · Attach approved syllabus · Configure assessment components</div></div>
          <button className="btn btn-primary" onClick={() => openModal('cu-new-modal')}><i className="lni lni-plus"></i> Add Course Unit</button>
        </div>
        <div className="g2 mb-[14px]">
          <div className="info-box"><i className="lni lni-clipboard"></i> Assessment proration: <strong>CW 25→15 · CBT 50→15 · UE 100→70.</strong> Total credits across all semesters must meet the programme&apos;s <strong>minimum credit load</strong> (e.g. 132 for BBA). All units must align with approved syllabus from <strong>NCHE or UVTOP</strong>.</div>
          <div className="info-box"><i className="lni lni-target"></i> <strong>Unit Type</strong> controls assessment: Theory (IA+UA) · Practical (CW only, no CBT) · Combined (Theory IA + Practical exam, no Practical IA) · Project (student-led, evaluated after set timeframe). <strong>Unit Category</strong>: Core (all students) · Specialization (specific specialization students) · Elective (one paper selected per batch for the session).</div>
        </div>
        <div className="card mb-[14px]">
          <div className="card-hdr"><div className="card-title"><span className="ctitle-icon"><i className="lni lni-key"></i></span> Unit Type → Assessment Component Rules</div></div>
          <div className="g4">
            <div className="p-3 bg-b50 border border-[1.5px] border-b100 rounded-[var(--rsm)]"><div className="text-[11px] font-bold text-b700 mb-[6px]"><i className="lni lni-book"></i> THEORY</div><div className="text-xs text-[var(--g700)]">Internal Assessment: <strong>CW + CBT</strong></div><div className="text-xs text-[var(--g700)]">University Assessment: <strong>UE Paper</strong></div></div>
            <div className="p-3 bg-[var(--green-bg)] border border-[1.5px] border-[var(--green-bd)] rounded-[var(--rsm)]"><div className="text-[11px] font-bold text-clr-green mb-[6px]"><i className="lni lni-microscope"></i> PRACTICAL</div><div className="text-xs text-[var(--g700)]">Internal Assessment: <strong>CW only</strong> (no CBT)</div><div className="text-xs text-[var(--g700)]">University Assessment: <strong>Practical Exam</strong></div></div>
            <div className="p-3 bg-[var(--amber-bg)] border border-[1.5px] border-[var(--amber-bd)] rounded-[var(--rsm)]"><div className="text-[11px] font-bold text-clr-amber mb-[6px]"><i className="lni lni-bulb"></i> COMBINED</div><div className="text-xs text-[var(--g700)]">Theory IA: <strong>CW + CBT</strong></div><div className="text-xs text-[var(--g700)]">Practical: <strong>No IA</strong>, separate exam only</div></div>
            <div className="p-3 bg-[var(--purple-bg)] border border-[1.5px] border-[var(--purple-bd)] rounded-[var(--rsm)]"><div className="text-[11px] font-bold text-[var(--purple)] mb-[6px]"><i className="lni lni-rocket"></i> PROJECT</div><div className="text-xs text-[var(--g700)]">Student-led work (internship / project)</div><div className="text-xs text-[var(--g700)]">Evaluated after set timeframe (e.g. 2 months)</div></div>
          </div>
        </div>
        <div className="card">
          <div className="card-hdr">
            <div className="card-title"><span className="ctitle-icon"><i className="lni lni-book"></i></span> Course Unit Master</div>
            <div className="flex gap-2">
              <select className="ctrl w-auto text-xs"><option>All Programmes</option><option>BSc. IT</option><option>BBA</option><option>BEng. Civil</option><option>MBA</option></select>
              <select className="ctrl w-auto text-xs"><option>All Semesters</option><option>Semester 1</option><option>Semester 2</option><option>Semester 3</option></select>
              <select className="ctrl w-auto text-xs"><option>All Types</option><option>Theory</option><option>Practical</option><option>Combined</option><option>Project</option></select>
              <button className="btn btn-neu btn-sm"><i className="lni lni-upload"></i> Export</button>
            </div>
          </div>
          <ScrollTable>
            <table>
              <thead><tr><th>Code</th><th>Unit Name</th><th>Programme</th><th>Sem</th><th>Credits</th><th>Unit Type</th><th>Category</th><th>Has CW</th><th>Has CBT</th><th>Proration</th><th>Syllabus</th><th>Action</th></tr></thead>
              <tbody>
                <tr><td className="font-mono text-[11px] text-b700">IT101</td><td><strong>Introduction to Programming</strong></td><td>BSc. IT</td><td><span className="pill pill-blue">Sem 1</span></td><td>3</td><td><span className="badge badge-blue">Theory</span></td><td><span className="badge badge-grey">Core</span></td><td><span className="badge badge-green"><i className="lni lni-checkmark"></i></span></td><td><span className="badge badge-green"><i className="lni lni-checkmark"></i></span></td><td className="font-mono text-[11px]">CW25→15 / CBT50→15 / UE100→70</td><td><span className="badge badge-green">Attached</span></td><td><button className="btn btn-neu btn-sm" onClick={() => openModal('cu-edit-modal')}><i className="lni lni-pencil"></i> Edit</button></td></tr>
                <tr><td className="font-mono text-[11px] text-b700">IT102</td><td><strong>Computer Organisation</strong></td><td>BSc. IT</td><td><span className="pill pill-blue">Sem 1</span></td><td>3</td><td><span className="badge badge-blue">Theory</span></td><td><span className="badge badge-grey">Core</span></td><td><span className="badge badge-green"><i className="lni lni-checkmark"></i></span></td><td><span className="badge badge-red"><i className="lni lni-close"></i></span></td><td className="font-mono text-[11px]">CW25→15 / UE100→70</td><td><span className="badge badge-green">Attached</span></td><td><button className="btn btn-neu btn-sm" onClick={() => openModal('cu-edit-modal')}><i className="lni lni-pencil"></i> Edit</button></td></tr>
                <tr><td className="font-mono text-[11px] text-b700">IT104</td><td><strong>Programming Lab</strong></td><td>BSc. IT</td><td><span className="pill pill-blue">Sem 1</span></td><td>2</td><td><span className="badge badge-green">Practical</span></td><td><span className="badge badge-grey">Core</span></td><td><span className="badge badge-green"><i className="lni lni-checkmark"></i></span></td><td><span className="badge badge-red"><i className="lni lni-close"></i> (Practical — no CBT)</span></td><td className="font-mono text-[11px]">CW25→15 / Practical UE</td><td><span className="badge badge-green">Attached</span></td><td><button className="btn btn-neu btn-sm" onClick={() => openModal('cu-edit-modal')}><i className="lni lni-pencil"></i> Edit</button></td></tr>
                <tr><td className="font-mono text-[11px] text-b700">IT105</td><td><strong>Systems &amp; Lab (Combined)</strong></td><td>BSc. IT</td><td><span className="pill pill-blue">Sem 2</span></td><td>4</td><td><span className="badge badge-amber">Combined</span></td><td><span className="badge badge-grey">Core</span></td><td><span className="badge badge-green"><i className="lni lni-checkmark"></i> (Theory)</span></td><td><span className="badge badge-green"><i className="lni lni-checkmark"></i> (Theory only)</span></td><td className="font-mono text-[11px]">Theory IA + Practical UE (no Practical IA)</td><td><span className="badge badge-green">Attached</span></td><td><button className="btn btn-neu btn-sm" onClick={() => openModal('cu-edit-modal')}><i className="lni lni-pencil"></i> Edit</button></td></tr>
                <tr><td className="font-mono text-[11px] text-b700">MBA501</td><td><strong>MBA Internship Project</strong></td><td>MBA</td><td><span className="pill pill-blue">Sem 4</span></td><td>6</td><td><span className="badge badge-purple">Project</span></td><td><span className="badge badge-grey">Core</span></td><td><span className="badge badge-red"><i className="lni lni-close"></i></span></td><td><span className="badge badge-red"><i className="lni lni-close"></i></span></td><td className="font-mono text-[11px]">Evaluated after 2 months</td><td><span className="badge badge-green">Attached</span></td><td><button className="btn btn-neu btn-sm" onClick={() => openModal('cu-edit-modal')}><i className="lni lni-pencil"></i> Edit</button></td></tr>
                <tr><td className="font-mono text-[11px] text-b700">MBA301-FIN</td><td><strong>Financial Risk Management</strong></td><td>MBA</td><td><span className="pill pill-blue">Sem 3</span></td><td>3</td><td><span className="badge badge-blue">Theory</span></td><td><span className="badge badge-cyan">Specialization</span></td><td><span className="badge badge-green"><i className="lni lni-checkmark"></i></span></td><td><span className="badge badge-green"><i className="lni lni-checkmark"></i></span></td><td className="font-mono text-[11px]">CW25→15 / CBT50→15 / UE100→70</td><td><span className="badge badge-green">Attached</span></td><td><button className="btn btn-neu btn-sm" onClick={() => openModal('cu-edit-modal')}><i className="lni lni-pencil"></i> Edit</button></td></tr>
                <tr><td className="font-mono text-[11px] text-b700">IT-ELEC-1</td><td><strong>Elective: Remote Sensing / Renewable Energy / Radar Nav.</strong></td><td>BSc. IT</td><td><span className="pill pill-blue">Sem 5</span></td><td>3</td><td><span className="badge badge-blue">Theory</span></td><td><span className="badge badge-amber">Elective (batch-level)</span></td><td><span className="badge badge-green"><i className="lni lni-checkmark"></i></span></td><td><span className="badge badge-green"><i className="lni lni-checkmark"></i></span></td><td className="font-mono text-[11px]">CW25→15 / CBT50→15 / UE100→70</td><td><span className="badge badge-amber"><i className="lni lni-warning"></i> Pending Selection</span></td><td><ActionMenu><button className="btn btn-neu btn-sm" onClick={() => openModal('cu-edit-modal')}><i className="lni lni-pencil"></i> Edit</button><button className="btn btn-amber btn-sm" onClick={() => openModal('elective-select-modal')}>Select Paper →</button></ActionMenu></td></tr>
                <tr className="flagged"><td className="font-mono text-[11px] text-b700">BBA301</td><td><strong>Strategic Management</strong></td><td>BBA</td><td><span className="pill pill-blue">Sem 3</span></td><td>4</td><td><span className="badge badge-blue">Theory</span></td><td><span className="badge badge-grey">Core</span></td><td><span className="badge badge-green"><i className="lni lni-checkmark"></i></span></td><td><span className="badge badge-green"><i className="lni lni-checkmark"></i></span></td><td className="font-mono text-[11px]">CW25→15 / CBT50→15 / UE100→70</td><td><span className="badge badge-red"><i className="lni lni-warning"></i> Missing</span></td><td><ActionMenu><button className="btn btn-neu btn-sm" onClick={() => openModal('cu-edit-modal')}><i className="lni lni-pencil"></i> Edit</button><button className="btn btn-amber btn-sm" onClick={() => openModal('cu-edit-modal')}>Upload Syllabus</button></ActionMenu></td></tr>
                <tr><td className="font-mono text-[11px] text-b700">IT103</td><td><strong>Engineering Maths I</strong></td><td>BSc. IT</td><td><span className="pill pill-blue">Sem 1</span></td><td>3</td><td><span className="badge badge-blue">Theory</span></td><td><span className="badge badge-grey">Core</span></td><td><span className="badge badge-red"><i className="lni lni-close"></i></span></td><td><span className="badge badge-red"><i className="lni lni-close"></i></span></td><td className="font-mono text-[11px]">UE100→100</td><td><span className="badge badge-green">Attached</span></td><td><button className="btn btn-neu btn-sm" onClick={() => openModal('cu-edit-modal')}><i className="lni lni-pencil"></i> Edit</button></td></tr>
              </tbody>
            </table>
          </ScrollTable>
        </div>
      </div>
      <CourseUnitModal isOpen={openModals.has('cu-new-modal')} onClose={() => closeModal('cu-new-modal')} showToast={showToast} />
      <ElectiveSelectModal isOpen={openModals.has('elective-select-modal')} onClose={() => closeModal('elective-select-modal')} showToast={showToast} />
      <Toast toast={toast} />
    </>
  )
}
