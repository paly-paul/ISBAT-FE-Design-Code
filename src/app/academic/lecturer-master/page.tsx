'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ScrollTable } from '@/components/ScrollTable'
import { ActionMenu } from '@/components/ActionMenu'
import { NewLecturerModal } from '@/components/modals/NewLecturerModal'
import { EditLecturerModal } from '@/components/modals/EditLecturerModal'
import { Toast } from '@/components/Toast'
import { FilterTh } from '@/components/FilterTh'

export default function Page() {
  const router = useRouter()
  const [openModals, setOpenModals] = useState<Set<string>>(new Set())
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [openFilter, setOpenFilter] = useState<string | null>(null)

  function nav(id: string) { router.push('/academic/' + id) }
  function openModal(id: string) { setOpenModals(prev => new Set(prev).add(id)) }
  function closeModal(id: string) { setOpenModals(prev => { const s = new Set(prev); s.delete(id); return s }) }
  function showToast(msg: string, type = '') { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }

  useEffect(() => {
    function closeFilter(e: MouseEvent) {
      const target = e.target as HTMLElement
      if (!target.closest('th')) setOpenFilter(null)
    }
    document.addEventListener('click', closeFilter)
    return () => document.removeEventListener('click', closeFilter)
  }, [])

  const rows = [
    { id: 'LEC-0001', name: 'Dr. Nakimuli Sarah',  email: 'snakimuli@isbatuniversity.ac.ug', qualification: 'PhD', qualDetail: 'PhD Computer Science',    qualSub: 'Makerere University · 2018',         specialisation: 'Machine Learning, Algorithms',     faculty: 'FCT', designation: 'Senior Lecturer', statusBadge: 'badge-green', statusLabel: 'Active' },
    { id: 'LEC-0002', name: 'Prof. Mukasa Charles', email: 'cmukasa@isbatuniversity.ac.ug', qualification: "Master's", qualDetail: 'PhD Business Administration', qualSub: 'University of Cape Town · 2012',      specialisation: 'Strategic Management, Finance',    faculty: 'FBM', designation: 'Senior Lecturer', statusBadge: 'badge-green', statusLabel: 'Active' },
    { id: 'LEC-0003', name: 'Dr. Tendo Patrick',   email: 'ptendo@isbatuniversity.ac.ug',  qualification: 'PhD', qualDetail: 'PhD Civil Engineering',     qualSub: 'Kyambogo University · 2016',         specialisation: 'Structural Design, Geotechnics',   faculty: 'FEN', designation: 'Senior Lecturer', statusBadge: 'badge-green', statusLabel: 'Active' },
    { id: 'LEC-0004', name: 'Ms. Acen Lillian',    email: 'lacen@isbatuniversity.ac.ug',   qualification: "Master's", qualDetail: 'MSc Information Technology',  qualSub: 'Makerere University · 2021',         specialisation: 'Web Development, Databases',       faculty: 'FCT', designation: 'Lecturer',        statusBadge: 'badge-green', statusLabel: 'Active' },
    { id: 'LEC-0005', name: 'Mr. Okello Brian',    email: 'bokello@isbatuniversity.ac.ug', qualification: "Bachelor's", qualDetail: 'MBA Finance',               qualSub: 'Strathmore University · 2020',       specialisation: 'Corporate Finance, Accounting',    faculty: 'FBM', designation: 'Assistant Lecturer', statusBadge: 'badge-amber', statusLabel: 'On Leave' },
  ]
  const filteredRows = rows.filter(r =>
    Object.entries(filters).every(([k, v]) => !v || String((r as Record<string, unknown>)[k]) === v)
  )

  function fth(label: string, col: string, opts: string[]) {
    return (
      <FilterTh
        label={label}
        opts={opts}
        isOpen={openFilter === col}
        activeFilter={filters[col] ?? ''}
        onToggle={(e) => { e.stopPropagation(); setOpenFilter(p => p === col ? null : col) }}
        onSelect={(val) => { setFilters(f => ({ ...f, [col]: val })); setOpenFilter(null) }}
        onClear={() => { setFilters(f => ({ ...f, [col]: '' })); setOpenFilter(null) }}
      />
    )
  }

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
              <thead><tr><th>Action</th><th>ID</th><th>Name</th>{fth('Highest Qualification', 'qualification', ["PhD", "Master's", "Bachelor's"])}<th>Specialisation</th>{fth('Faculty', 'faculty', ['FCT', 'FBM', 'FEN'])}{fth('Designation', 'designation', ['Senior Lecturer', 'Lecturer', 'Assistant Lecturer', 'Adjunct'])}{fth('Status', 'status', ['Active', 'Inactive'])}</tr></thead>
              <tbody>
                {filteredRows.map((r, i) => (
                  <tr key={i}>
                    <td><ActionMenu><button className="btn btn-neu btn-sm" onClick={() => openModal('edit-lecturer-modal')}><i className="lni lni-pencil"></i> Edit</button></ActionMenu></td>
                    <td className="font-mono text-b700">{r.id}</td>
                    <td><strong>{r.name}</strong><div className="text-[var(--fs-xs)] text-g500">{r.email}</div></td>
                    <td>{r.qualDetail}<div className="text-[var(--fs-xs)] text-g500">{r.qualSub}</div></td>
                    <td>{r.specialisation}</td>
                    <td>{r.faculty === 'FCT' ? 'Faculty of Computing & Technology' : r.faculty === 'FBM' ? 'Faculty of Business & Management' : 'Faculty of Engineering'}</td>
                    <td><span className="badge badge-blue">{r.designation}</span></td>
                    <td><span className={`badge ${r.statusBadge}`}><span className="bdot"></span>{r.statusLabel}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollTable>
        </div>
      </div>
      <NewLecturerModal isOpen={openModals.has('new-lecturer-modal')} onClose={() => closeModal('new-lecturer-modal')} showToast={showToast} />
      <EditLecturerModal isOpen={openModals.has('edit-lecturer-modal')} onClose={() => closeModal('edit-lecturer-modal')} showToast={showToast} />
      <Toast toast={toast} />
    </>
  )
}
