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
          <div><div className="pg-title">Class Test (CBT)</div><div className="pg-sub">Computer-based timed assessments · 60-minute server-side timer · 50% fee clearance for submission</div></div>
          <button className="btn btn-primary" onClick={() => openModal('new-cbt-modal')}><i className="lni lni-plus"></i> Schedule Class Test</button>
        </div>

        <div className="g2 mb-[18px]">
          <div className="info-box"><i className="lni lni-ruler-alt"></i> <span><strong>Proration:</strong> CBT is marked out of <strong>50</strong> and prorated to <strong>15</strong> marks. Each test runs for <strong>60 minutes</strong> with server-side timing — students cannot extend or pause.</span></div>
          <div className="warn-box"><i className="lni lni-warning"></i> <span>Minimum <strong>50% fee clearance</strong> required for submission (calculated on <strong>original tuition fee</strong>, not discounted amount). View access permitted without clearance.</span></div>
        </div>

        <div className="card">
          <div className="card-hdr">
            <div className="card-title"><span className="ctitle-icon"><i className="lni lni-display"></i></span> Scheduled Class Tests — Term 1</div>
            <select className="ctrl w-auto text-xs"><option>All Batches</option><option>BSC-IT-S1-D</option><option>MBA-S1-E</option></select>
          </div>
          <ScrollTable>
            <table>
              <thead><tr><th>Course Unit</th><th>Batch</th><th>Date</th><th>Time</th><th>Duration</th><th>Out Of</th><th>Attempted</th><th>Cleared (≥50%)</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>
                <tr><td><strong>IT101 – Intro to Programming</strong></td><td>BSC-IT-S1-D</td><td>20 Mar 2026</td><td>10:00 AM</td><td>60 min</td><td>50</td><td><span className="text-green font-bold">40/42</span></td><td>42</td><td><span className="badge badge-green"><i className="lni lni-checkmark"></i> Completed</span></td><td><button className="btn btn-neu btn-sm">View Marks</button></td></tr>
                <tr><td><strong>IT102 – Computer Org.</strong></td><td>BSC-IT-S1-D</td><td>22 Mar 2026</td><td>02:00 PM</td><td>60 min</td><td>50</td><td>—</td><td>38</td><td><span className="badge badge-blue">Upcoming</span></td><td><button className="btn btn-neu btn-sm">Manage</button></td></tr>
                <tr><td><strong>MBA101 – Managerial Econ.</strong></td><td>MBA-S1-E</td><td>—</td><td>—</td><td>60 min</td><td>50</td><td>—</td><td>24</td><td><span className="badge badge-grey">Not Scheduled</span></td><td><button className="btn btn-primary btn-sm" onClick={() => openModal('new-cbt-modal')}>Schedule →</button></td></tr>
              </tbody>
            </table>
          </ScrollTable>
        </div>
      </div>
      <Toast toast={toast} />
    </>
  )
}
