'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ScrollTable } from '@/components/ScrollTable'
import { NewFacultyModal } from '@/components/NewFacultyModal'
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
          <div><div className="pg-title">Faculty Master</div><div className="pg-sub">Define university faculties · Associate programmes and course units</div></div>
          <button className="btn btn-primary" onClick={() => openModal('new-faculty-modal')}><i className="lni lni-plus"></i> Add Faculty</button>
        </div>
        <div className="card">
          <div className="card-hdr"><div className="card-title"><span className="ctitle-icon"><i className="lni lni-apartment"></i></span> Faculties</div></div>
          <ScrollTable>
            <table>
              <thead><tr><th>Faculty Code</th><th>Faculty Name</th><th>Dean</th><th>Programmes</th><th>Course Units</th><th>Action</th></tr></thead>
              <tbody>
                <tr><td className="font-mono">FCT</td><td><strong>Faculty of Computing &amp; Technology</strong></td><td>Dr. Ssekibuule Ronald</td><td>3</td><td>42</td><td><button className="btn btn-neu btn-sm"><i className="lni lni-pencil"></i> Edit</button></td></tr>
                <tr><td className="font-mono">FBM</td><td><strong>Faculty of Business &amp; Management</strong></td><td>Prof. Mukasa Charles</td><td>4</td><td>56</td><td><button className="btn btn-neu btn-sm"><i className="lni lni-pencil"></i> Edit</button></td></tr>
                <tr><td className="font-mono">FEN</td><td><strong>Faculty of Engineering</strong></td><td>Dr. Tendo Patrick</td><td>2</td><td>38</td><td><button className="btn btn-neu btn-sm"><i className="lni lni-pencil"></i> Edit</button></td></tr>
              </tbody>
            </table>
          </ScrollTable>
        </div>
      </div>
      <NewFacultyModal isOpen={openModals.has('new-faculty-modal')} onClose={() => closeModal('new-faculty-modal')} showToast={showToast} />
      <Toast toast={toast} />
    </>
  )
}
