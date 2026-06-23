'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ScrollTable } from '@/components/ScrollTable'
import { ActionMenu } from '@/components/ActionMenu'
import { Toast } from '@/components/Toast'
import { SearchSelect } from '@/components/SearchSelect'

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
          <div><div className="pg-title">Student Lookup</div><div className="pg-sub">Cross-module shared page · Search any student · View academic and financial status</div></div>
          <span className="badge badge-purple self-center"><i className="lni lni-link"></i> Shared Across All Modules</span>
        </div>
        <div className="info-box mb-[18px]">
          <i className="lni lni-link"></i> <span>This is a <strong>cross-module shared page</strong> accessible from Academic, Admission, Finance, and Assessment modules. Full profile management lives in the <strong>Student Microservice (Service 10)</strong>.</span>
        </div>
        <div className="card">
          <div className="card-hdr"><div className="card-title"><span className="ctitle-icon"><i className="lni lni-search-alt"></i></span> Search Student</div></div>
          <div className="g3">
            <div className="fg"><div className="lbl">Search by Name, Student No., or Email</div>
              <div className="inp-wrap"><span className="inp-icon"><i className="lni lni-search-alt"></i></span><input className="ctrl" type="text" placeholder="e.g. ISB/2026/0142 or Nakato Sarah..." /></div>
            </div>
            <div className="fg"><div className="lbl">Programme Filter</div>
              <SearchSelect
                placeholder="All Programmes"
                options={['BSc. Computer Science', 'BSc. Information Technology', 'BBA', 'MBA Business Admin', 'MBA Business Admin (ODL)', 'BEng. Civil Engineering', 'BCom. Accounting', 'Diploma in Nursing']}
              />
            </div>
            <div className="fg"><div className="lbl">Academic Year</div>
              <SearchSelect
                placeholder="All Academic Years"
                options={[
                  { value: '2025-2026', label: '2025–2026' },
                  { value: '2024-2025', label: '2024–2025' },
                  { value: '2023-2024', label: '2023–2024' },
                ]}
              />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-hdr">
            <div className="card-title"><span className="ctitle-icon"><i className="lni lni-users"></i></span> Registered Students — Academic Year 2025–2026</div>
            <span className="badge badge-blue"><i className="lni lni-graduation"></i> 8 of 1,247 shown</span>
          </div>
          <ScrollTable>
            <table>
              <thead><tr><th>Student No.</th><th>Name</th><th>Programme</th><th>Year / Sem</th><th>Intake</th><th>Academic Year</th><th>Fee Status</th><th>Status</th><th className="w-[160px]">Action</th></tr></thead>
              <tbody>
                <tr><td><span className="text-blue font-bold font-mono">ISB/2026/0142</span></td><td><strong>Nakato Sarah Bridget</strong><div className="text-[var(--fs-xs)] text-g500">nakato.s@students.isbatuniversity.ac.ug</div></td><td>BSc. Computer Science</td><td>Year 1 · Sem 1</td><td>Spring 2026</td><td><span className="badge badge-blue">2025–2026</span></td><td><span className="badge badge-green">Cleared 100%</span></td><td><span className="badge badge-green"><span className="bdot"></span>Active</span></td><td><ActionMenu><button className="btn btn-neu btn-sm"><i className="lni lni-eye"></i> View</button><button className="btn btn-primary btn-sm"><i className="lni lni-pencil"></i> Edit</button></ActionMenu></td></tr>
                <tr><td><span className="text-blue font-bold font-mono">ISB/2026/0141</span></td><td><strong>Okello James Patrick</strong><div className="text-[var(--fs-xs)] text-g500">okello.j@students.isbatuniversity.ac.ug</div></td><td>MBA Business Admin (ODL)</td><td>Year 1 · Sem 1</td><td>Spring 2026</td><td><span className="badge badge-blue">2025–2026</span></td><td><span className="badge badge-green">Cleared 100%</span></td><td><span className="badge badge-green"><span className="bdot"></span>Active</span></td><td><ActionMenu><button className="btn btn-neu btn-sm"><i className="lni lni-eye"></i> View</button><button className="btn btn-primary btn-sm"><i className="lni lni-pencil"></i> Edit</button></ActionMenu></td></tr>
                <tr><td><span className="text-blue font-bold font-mono">ISB/2026/0140</span></td><td><strong>Tumukunde Alice Grace</strong><div className="text-[var(--fs-xs)] text-g500">tumukunde.a@students.isbatuniversity.ac.ug</div></td><td>Diploma in Nursing</td><td>Year 1 · Sem 1</td><td>Spring 2026</td><td><span className="badge badge-blue">2025–2026</span></td><td><span className="badge badge-amber">Partial 60%</span></td><td><span className="badge badge-green"><span className="bdot"></span>Active</span></td><td><ActionMenu><button className="btn btn-neu btn-sm"><i className="lni lni-eye"></i> View</button><button className="btn btn-primary btn-sm"><i className="lni lni-pencil"></i> Edit</button></ActionMenu></td></tr>
                <tr><td><span className="text-blue font-bold font-mono">ISB/2025/0089</span></td><td><strong>Mugume Robert</strong><div className="text-[var(--fs-xs)] text-g500">mugume.r@students.isbatuniversity.ac.ug</div></td><td>BSc. Information Technology</td><td>Year 1 · Sem 2</td><td>Fall 2025</td><td><span className="badge badge-blue">2025–2026</span></td><td><span className="badge badge-red">Outstanding 35%</span></td><td><span className="badge badge-amber"><span className="bdot"></span>Access Blocked</span></td><td><ActionMenu><button className="btn btn-neu btn-sm"><i className="lni lni-eye"></i> View</button><button className="btn btn-primary btn-sm"><i className="lni lni-pencil"></i> Edit</button></ActionMenu></td></tr>
                <tr><td><span className="text-blue font-bold font-mono">ISB/2024/0028</span></td><td><strong>Akello Diana</strong><div className="text-[var(--fs-xs)] text-g500">akello.d@students.isbatuniversity.ac.ug</div></td><td>BBA</td><td>Year 2 · Sem 4</td><td>Spring 2024</td><td><span className="badge badge-grey">2023–2024</span></td><td><span className="badge badge-green">Cleared 100%</span></td><td><span className="badge badge-green"><span className="bdot"></span>Active</span></td><td><ActionMenu><button className="btn btn-neu btn-sm"><i className="lni lni-eye"></i> View</button><button className="btn btn-primary btn-sm"><i className="lni lni-pencil"></i> Edit</button></ActionMenu></td></tr>
              </tbody>
            </table>
          </ScrollTable>
        </div>
      </div>
      <Toast toast={toast} />
    </>
  )
}
