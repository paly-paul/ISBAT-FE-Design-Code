'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ScrollTable } from '@/components/ScrollTable'
import { NewLecturerModal } from '@/components/NewLecturerModal'
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
          <div><div className="pg-title">Lecturer Master</div><div className="pg-sub">All teaching staff · Captures qualification details · Linked to Faculty &amp; Course Allocation</div></div>
          <button className="btn btn-primary" onClick={() => openModal('new-lecturer-modal')}><i className="lni lni-plus"></i> Add Lecturer</button>
        </div>

        <div className="info-box mb-[14px]">
          <i className="lni lni-information"></i> Add the basic identity + qualifications here. Subject expertise (per-unit skills) is captured in <strong>Skill Management</strong> and feeds into Course Allocation.
        </div>

        <div className="card">
          <div className="card-hdr">
            <div className="card-title"><span className="ctitle-icon"><i className="lni lni-user"></i></span> Lecturers</div>
            <span className="badge badge-blue"><i className="lni lni-users"></i> 5 total</span>
          </div>
          <ScrollTable>
            <table>
              <thead><tr><th>ID</th><th>Name</th><th>Highest Qualification</th><th>Specialisation</th><th>Faculty</th><th>Designation</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>
                <tr>
                  <td className="font-mono text-b700">LEC-0001</td>
                  <td><strong>Dr. Nakimuli Sarah</strong><div className="text-[11px] text-g500">snakimuli@isbatuniversity.ac.ug</div></td>
                  <td>PhD Computer Science<div className="text-[11px] text-g500">Makerere University · 2018</div></td>
                  <td>Machine Learning, Algorithms</td>
                  <td>Faculty of Computing &amp; Technology</td>
                  <td><span className="badge badge-blue">Senior Lecturer</span></td>
                  <td><span className="badge badge-green"><span className="bdot"></span>Active</span></td>
                  <td><button className="btn btn-neu btn-sm"><i className="lni lni-pencil"></i> Edit</button></td>
                </tr>
                <tr>
                  <td className="font-mono text-b700">LEC-0002</td>
                  <td><strong>Prof. Mukasa Charles</strong><div className="text-[11px] text-g500">cmukasa@isbatuniversity.ac.ug</div></td>
                  <td>PhD Business Administration<div className="text-[11px] text-g500">University of Cape Town · 2012</div></td>
                  <td>Strategic Management, Finance</td>
                  <td>Faculty of Business &amp; Management</td>
                  <td><span className="badge badge-purple">Professor</span></td>
                  <td><span className="badge badge-green"><span className="bdot"></span>Active</span></td>
                  <td><button className="btn btn-neu btn-sm"><i className="lni lni-pencil"></i> Edit</button></td>
                </tr>
                <tr>
                  <td className="font-mono text-b700">LEC-0003</td>
                  <td><strong>Dr. Tendo Patrick</strong><div className="text-[11px] text-g500">ptendo@isbatuniversity.ac.ug</div></td>
                  <td>PhD Civil Engineering<div className="text-[11px] text-g500">Kyambogo University · 2016</div></td>
                  <td>Structural Design, Geotechnics</td>
                  <td>Faculty of Engineering</td>
                  <td><span className="badge badge-blue">Senior Lecturer</span></td>
                  <td><span className="badge badge-green"><span className="bdot"></span>Active</span></td>
                  <td><button className="btn btn-neu btn-sm"><i className="lni lni-pencil"></i> Edit</button></td>
                </tr>
                <tr>
                  <td className="font-mono text-b700">LEC-0004</td>
                  <td><strong>Ms. Acen Lillian</strong><div className="text-[11px] text-g500">lacen@isbatuniversity.ac.ug</div></td>
                  <td>MSc Information Technology<div className="text-[11px] text-g500">Makerere University · 2021</div></td>
                  <td>Web Development, Databases</td>
                  <td>Faculty of Computing &amp; Technology</td>
                  <td><span className="badge badge-blue">Lecturer</span></td>
                  <td><span className="badge badge-green"><span className="bdot"></span>Active</span></td>
                  <td><button className="btn btn-neu btn-sm"><i className="lni lni-pencil"></i> Edit</button></td>
                </tr>
                <tr>
                  <td className="font-mono text-b700">LEC-0005</td>
                  <td><strong>Mr. Okello Brian</strong><div className="text-[11px] text-g500">bokello@isbatuniversity.ac.ug</div></td>
                  <td>MBA Finance<div className="text-[11px] text-g500">Strathmore University · 2020</div></td>
                  <td>Corporate Finance, Accounting</td>
                  <td>Faculty of Business &amp; Management</td>
                  <td><span className="badge badge-blue">Assistant Lecturer</span></td>
                  <td><span className="badge badge-amber"><span className="bdot"></span>On Leave</span></td>
                  <td><button className="btn btn-neu btn-sm"><i className="lni lni-pencil"></i> Edit</button></td>
                </tr>
              </tbody>
            </table>
          </ScrollTable>
        </div>
      </div>
      <NewLecturerModal isOpen={openModals.has('new-lecturer-modal')} onClose={() => closeModal('new-lecturer-modal')} showToast={showToast} />
      <Toast toast={toast} />
    </>
  )
}
