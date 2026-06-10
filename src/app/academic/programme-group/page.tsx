'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ScrollTable } from '@/components/ScrollTable'
import { ProgrammeGroupModal } from '@/components/ProgrammeGroupModal'
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
          <div><div className="pg-title">Programme Group Master</div><div className="pg-sub">Generic programme names for reporting · Groups all curriculum versions under one umbrella</div></div>
          <button className="btn btn-primary" onClick={() => openModal('new-proggroup-modal')}><i className="lni lni-plus"></i> Add Programme Group</button>
        </div>

        <div className="info-box mb-[18px]">
          <i className="lni lni-information"></i> Programme Groups are used for <strong>high-level reporting</strong> — e.g. searching &quot;BCA&quot; returns all students across BCA 2026 <em>and</em> BCA 2031 versions. This ensures a single generic name links all curriculum versions for aggregate analytics.
        </div>

        <div className="card">
          <div className="card-hdr">
            <div className="card-title"><span className="ctitle-icon"><i className="lni lni-folder"></i></span> Programme Groups</div>
            <button className="btn btn-neu btn-sm"><i className="lni lni-upload"></i> Export</button>
          </div>
          <ScrollTable>
            <table>
              <thead><tr><th>Group Code</th><th>Group Name</th><th>Programme Level</th><th>Active Versions</th><th>Inactive Versions</th><th>Total Students</th><th>Action</th></tr></thead>
              <tbody>
                <tr><td className="font-mono text-b700">BCA</td><td><strong>Bachelor of Computer Applications</strong></td><td>Bachelor&apos;s</td><td><span className="badge badge-green">1 Active</span></td><td><span className="badge badge-grey">1 Inactive</span></td><td>234</td><td><button className="btn btn-neu btn-sm"><i className="lni lni-pencil"></i> Edit</button></td></tr>
                <tr><td className="font-mono text-b700">BBA</td><td><strong>Bachelor of Business Administration</strong></td><td>Bachelor&apos;s</td><td><span className="badge badge-green">1 Active</span></td><td><span className="badge badge-grey">2 Inactive</span></td><td>412</td><td><button className="btn btn-neu btn-sm"><i className="lni lni-pencil"></i> Edit</button></td></tr>
                <tr><td className="font-mono text-b700">MBA</td><td><strong>Master of Business Administration</strong></td><td>Master&apos;s</td><td><span className="badge badge-green">1 Active</span></td><td><span className="badge badge-grey">1 Inactive</span></td><td>186</td><td><button className="btn btn-neu btn-sm"><i className="lni lni-pencil"></i> Edit</button></td></tr>
                <tr><td className="font-mono text-b700">BEng</td><td><strong>Bachelor of Engineering (Civil)</strong></td><td>Engineering</td><td><span className="badge badge-green">1 Active</span></td><td>—</td><td>124</td><td><button className="btn btn-neu btn-sm"><i className="lni lni-pencil"></i> Edit</button></td></tr>
              </tbody>
            </table>
          </ScrollTable>
        </div>
      </div>
      <ProgrammeGroupModal isOpen={openModals.has('new-proggroup-modal')} onClose={() => closeModal('new-proggroup-modal')} showToast={showToast} />
      <Toast toast={toast} />
    </>
  )
}
