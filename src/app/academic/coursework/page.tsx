'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ScrollTable } from '@/components/ScrollTable'
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
          <div><div className="pg-title">Coursework (CW) Management</div><div className="pg-sub">Term-based internal assessments · Faculty upload questions · 50% fee clearance required for submission</div></div>
          <button className="btn btn-primary" onClick={() => openModal('new-cw-modal')}><i className="lni lni-plus"></i> Schedule Coursework</button>
        </div>

        <div className="g2 mb-[18px]">
          <div className="info-box"><i className="lni lni-ruler-alt"></i> <span><strong>Proration:</strong> Coursework is marked out of <strong>25</strong> and prorated to <strong>15</strong> marks in final result. Students must have minimum <strong>50% fee clearance</strong> (on original tuition fee before discounts) to submit.</span></div>
          <div className="warn-box"><i className="lni lni-warning"></i> <span>Students can <strong>view</strong> coursework questions without fee clearance. Fee clearance only blocks <strong>submission</strong>.</span></div>
        </div>

        <div className="pipeline">
          <div className="pip-step active"><div className="pip-circle">1</div><div className="pip-info"><div className="pip-label">Term 1 CW</div><div className="pip-desc">In progress</div></div></div>
          <div className="pip-line"></div>
          <div className="pip-step"><div className="pip-circle">2</div><div className="pip-info"><div className="pip-label">Term 1 CBT</div><div className="pip-desc">Upcoming</div></div></div>
          <div className="pip-line"></div>
          <div className="pip-step"><div className="pip-circle">3</div><div className="pip-info"><div className="pip-label">Term 2 CW</div><div className="pip-desc">Upcoming</div></div></div>
          <div className="pip-line"></div>
          <div className="pip-step"><div className="pip-circle">4</div><div className="pip-info"><div className="pip-label">Term 2 CBT</div><div className="pip-desc">Upcoming</div></div></div>
          <div className="pip-line"></div>
          <div className="pip-step"><div className="pip-circle">5</div><div className="pip-info"><div className="pip-label">Uni. Exam</div><div className="pip-desc">End of Sem</div></div></div>
        </div>

        <div className="card">
          <div className="card-hdr">
            <div className="card-title"><span className="ctitle-icon"><i className="lni lni-pencil-alt"></i></span> Active Coursework — Term 1 · Spring 2026</div>
            <div className="flex gap-2">
              <select className="ctrl w-auto text-xs"><option>All Batches</option><option>BSC-IT-S1-D</option><option>BBA-S3-D</option><option>MBA-S1-E</option></select>
            </div>
          </div>
          <ScrollTable>
            <table>
              <thead><tr><th>Course Unit</th><th>Batch</th><th>Faculty</th><th>Open Date</th><th>Due Date</th><th>Out Of</th><th>Submitted</th><th>Cleared (≥50%)</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>
                <tr><td><strong>IT101 – Intro to Programming</strong></td><td>BSC-IT-S1-D</td><td>Dr. Ssekibuule</td><td>01 Mar 2026</td><td>15 Mar 2026</td><td>25</td><td><span className="text-green font-bold">38/42</span></td><td><span className="text-green font-bold">42</span></td><td><span className="badge badge-green"><i className="lni lni-checkmark"></i> Closed</span></td><td><button className="btn btn-neu btn-sm">View Marks</button></td></tr>
                <tr><td><strong>IT102 – Computer Org.</strong></td><td>BSC-IT-S1-D</td><td>Ms. Namutebi</td><td>03 Mar 2026</td><td>17 Mar 2026</td><td>25</td><td><span className="text-amber font-bold">28/42</span></td><td><span className="text-green font-bold">38</span></td><td><span className="badge badge-amber">Open</span></td><td><button className="btn btn-neu btn-sm">Manage</button></td></tr>
                <tr className="flagged"><td><strong>MBA101 – Managerial Econ.</strong></td><td>MBA-S1-E</td><td>Prof. Mukasa</td><td>—</td><td>—</td><td>25</td><td>0/24</td><td><span className="text-green font-bold">24</span></td><td><span className="badge badge-grey">Not Scheduled</span></td><td><button className="btn btn-primary btn-sm" onClick={() => openModal('new-cw-modal')}>Schedule →</button></td></tr>
              </tbody>
            </table>
          </ScrollTable>
        </div>
      </div>
      <Toast toast={toast} />
    </>
  )
}
