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
          <div>
            <div className="pg-title">University Examination</div>
            <div className="pg-sub">End-of-semester offline exams · QP upload → Manual vetting → Exam execution · 100 marks prorated to 70</div>
          </div>
          <button className="btn btn-primary" onClick={() => openModal('new-qp-modal')}><i className="lni lni-files"></i> Upload Question Paper</button>
        </div>

        <div className="info-box mb-[18px]">
          <i className="lni lni-clipboard"></i> <span>Question Papers must be uploaded by faculty and sent for <strong>manual vetting</strong> by the QP Vetting Committee before the offline exam. The committee checks against the approved syllabus. University Exam is marked out of <strong>100</strong> and prorated to <strong>70</strong>.</span>
        </div>

        <div className="pipeline">
          <div className="pip-step done"><div className="pip-circle"><i className="lni lni-checkmark"></i></div><div className="pip-info"><div className="pip-label">QP Uploaded</div><div className="pip-desc">By faculty</div></div></div>
          <div className="pip-line done"></div>
          <div className="pip-step active"><div className="pip-circle">2</div><div className="pip-info"><div className="pip-label">Vetting</div><div className="pip-desc">Committee review</div></div></div>
          <div className="pip-line"></div>
          <div className="pip-step"><div className="pip-circle">3</div><div className="pip-info"><div className="pip-label">QP Approved</div><div className="pip-desc">Cleared for print</div></div></div>
          <div className="pip-line"></div>
          <div className="pip-step"><div className="pip-circle">4</div><div className="pip-info"><div className="pip-label">Exam Day</div><div className="pip-desc">Offline execution</div></div></div>
          <div className="pip-line"></div>
          <div className="pip-step"><div className="pip-circle">5</div><div className="pip-info"><div className="pip-label">Mark Entry</div><div className="pip-desc">Post exam</div></div></div>
        </div>

        <div className="card">
          <div className="card-hdr">
            <div className="card-title"><span className="ctitle-icon"><i className="lni lni-clipboard"></i></span> Question Papers — Spring 2026</div>
          </div>
          <ScrollTable>
            <table>
              <thead><tr><th>Course Unit</th><th>Programme</th><th>Exam Date</th><th>Uploaded By</th><th>Upload Date</th><th>Vetting Status</th><th>Exam Status</th><th>Action</th></tr></thead>
              <tbody>
                <tr><td><strong>IT101 – Intro to Programming</strong></td><td>BSc. IT</td><td>15 May 2026</td><td>Dr. Ssekibuule</td><td>01 Apr 2026</td><td><span className="badge badge-amber">Under Vetting</span></td><td><span className="badge badge-grey">Pending</span></td><td><button className="btn btn-amber btn-sm">Vet QP →</button></td></tr>
                <tr><td><strong>IT102 – Computer Org.</strong></td><td>BSc. IT</td><td>17 May 2026</td><td>Ms. Namutebi</td><td>02 Apr 2026</td><td><span className="badge badge-green"><i className="lni lni-checkmark"></i> Approved</span></td><td><span className="badge badge-grey">Pending</span></td><td><button className="btn btn-neu btn-sm">View QP</button></td></tr>
                <tr className="flagged"><td><strong>BBA301 – Strategic Mgmt</strong></td><td>BBA</td><td>16 May 2026</td><td>—</td><td>—</td><td><span className="badge badge-red">Not Uploaded</span></td><td><span className="badge badge-red">Blocked</span></td><td><button className="btn btn-primary btn-sm" onClick={() => openModal('new-qp-modal')}>Upload QP</button></td></tr>
              </tbody>
            </table>
          </ScrollTable>
        </div>
      </div>
      <Toast toast={toast} />
    </>
  )
}
