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
            <div className="pg-title">Qualification Equating</div>
            <div className="pg-sub">Validate foreign educational qualifications against Ugandan standards · NCHE / UVTOP referral</div>
          </div>
          <button className="btn btn-primary" onClick={() => openModal('new-equating-modal')}><i className="lni lni-plus"></i> New Equating Request</button>
        </div>

        <div className="info-box mb-[18px]">
          <i className="lni lni-world"></i> <span>Any foreign qualification must be formally equated with <strong>NCHE</strong> (National Council of Higher Education) or <strong>UVTOP</strong> (Uganda National &amp; Technical Vocational Board) before the applicant can be admitted. O-Level: minimum 5 passes, passing grade ≤ 8. A-Level: assessed on Principal Passes and Subsidiary Passes.</span>
        </div>

        <div className="card">
          <div className="card-hdr">
            <div className="card-title"><span className="ctitle-icon"><i className="lni lni-world"></i></span> Equating Requests</div>
          </div>
          <ScrollTable>
            <table>
              <thead><tr><th>Applicant Name</th><th>Country of Qualification</th><th>Qualification Level</th><th>Referred To</th><th>Submitted Date</th><th>Status</th><th>Outcome</th><th>Action</th></tr></thead>
              <tbody>
                <tr><td><strong>Kabila Jean-Pierre</strong></td><td><i className="lni lni-flag"></i> DR Congo</td><td>A-Level Equivalent</td><td><span className="badge badge-blue">NCHE</span></td><td>01 Mar 2026</td><td><span className="badge badge-green"><i className="lni lni-checkmark"></i> Completed</span></td><td><span className="badge badge-green">Equated — 2 Principal Passes</span></td><td><button className="btn btn-neu btn-sm">View →</button></td></tr>
                <tr className="flagged"><td><strong>Abubakar Faisal</strong></td><td><i className="lni lni-flag"></i> Kenya</td><td>O-Level (KCSE)</td><td><span className="badge badge-amber">UVTOP</span></td><td>10 Apr 2026</td><td><span className="badge badge-amber">Pending</span></td><td>—</td><td><button className="btn btn-amber btn-sm">Follow Up</button></td></tr>
                <tr><td><strong>Uwase Claudine</strong></td><td><i className="lni lni-flag"></i> Rwanda</td><td>Bachelor&apos;s Degree</td><td><span className="badge badge-blue">NCHE</span></td><td>15 Apr 2026</td><td><span className="badge badge-purple">In Review</span></td><td>—</td><td><button className="btn btn-neu btn-sm">View →</button></td></tr>
              </tbody>
            </table>
          </ScrollTable>
        </div>

        <div className="undefined-box mt-1">
          <div className="text-[20px] mb-2"><i className="lni lni-world"></i></div>
          <div className="font-bold text-sm text-g900 mb-[6px]">Detailed Equating Workflow</div>
          <div className="text-[12.5px] text-g500 max-w-[500px] mx-auto">The detailed process for document submission to NCHE/UVTOP, tracking, and outcome recording has <strong>not yet been covered in a KT session</strong>.</div>
          <div className="badge badge-purple mt-[10px]"><i className="lni lni-clipboard"></i> Module Not Yet Defined — Details to be captured in KT Session</div>
        </div>
      </div>
      <Toast toast={toast} />
    </>
  )
}
