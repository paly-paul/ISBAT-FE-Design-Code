'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ScrollTable } from '@/components/ScrollTable'
import { ProgrammeLevelModal } from '@/components/ProgrammeLevelModal'
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
          <div><div className="pg-title">Programme Level Master</div><div className="pg-sub">Define programme levels (Bachelor&apos;s, Master&apos;s, PhD etc.) · Set year count, semester count and minimum credit load</div></div>
          <button className="btn btn-primary" onClick={() => openModal('new-alevel-modal')}><i className="lni lni-plus"></i> Add Level</button>
        </div>

        <div className="info-box mb-[18px]">
          <i className="lni lni-information"></i> Programme Level defines the <strong>fundamental attributes</strong> of every programme at that level (year count, semester count, minimum credit load). Selecting a level in the Programme Master auto-populates these values — e.g. selecting Bachelor&apos;s defaults to 3 years, 6 semesters.
        </div>

        <div className="card">
          <div className="card-hdr">
            <div className="card-title"><span className="ctitle-icon"><i className="lni lni-graduation"></i></span> Defined Programme Levels</div>
          </div>
          <ScrollTable>
            <table>
              <thead><tr><th>Level Code</th><th>Level Name</th><th>Year Count</th><th>Semester Count</th><th>Min. Credit Load</th><th>No Internal Assessment</th><th>Linked Programmes</th><th>Action</th></tr></thead>
              <tbody>
                <tr><td className="font-mono text-b700">CERT</td><td><strong>Certificate / HEC</strong></td><td>1</td><td>2</td><td>48</td><td><span className="badge badge-grey">No</span></td><td>3</td><td><button className="btn btn-neu btn-sm"><i className="lni lni-pencil"></i> Edit</button></td></tr>
                <tr><td className="font-mono text-b700">DIP</td><td><strong>Diploma</strong></td><td>2</td><td>4</td><td>96</td><td><span className="badge badge-grey">No</span></td><td>5</td><td><button className="btn btn-neu btn-sm"><i className="lni lni-pencil"></i> Edit</button></td></tr>
                <tr><td className="font-mono text-b700">BACH</td><td><strong>Bachelor&apos;s Degree</strong></td><td>3</td><td>6</td><td>132</td><td><span className="badge badge-grey">No</span></td><td>12</td><td><button className="btn btn-neu btn-sm"><i className="lni lni-pencil"></i> Edit</button></td></tr>
                <tr><td className="font-mono text-b700">ENG</td><td><strong>Bachelor of Engineering</strong></td><td>4</td><td>8</td><td>160</td><td><span className="badge badge-grey">No</span></td><td>4</td><td><button className="btn btn-neu btn-sm"><i className="lni lni-pencil"></i> Edit</button></td></tr>
                <tr><td className="font-mono text-b700">MAST</td><td><strong>Master&apos;s Degree</strong></td><td>2</td><td>4</td><td>72</td><td><span className="badge badge-grey">No</span></td><td>6</td><td><button className="btn btn-neu btn-sm"><i className="lni lni-pencil"></i> Edit</button></td></tr>
                <tr><td className="font-mono text-b700">PHD</td><td><strong>Doctor of Philosophy (PhD)</strong></td><td>3</td><td>6</td><td>0</td><td><span className="badge badge-amber"><i className="lni lni-checkmark"></i> Yes — No IA</span></td><td>2</td><td><button className="btn btn-neu btn-sm"><i className="lni lni-pencil"></i> Edit</button></td></tr>
              </tbody>
            </table>
          </ScrollTable>
        </div>
      </div>
      <ProgrammeLevelModal isOpen={openModals.has('new-alevel-modal')} onClose={() => closeModal('new-alevel-modal')} showToast={showToast} />
      <Toast toast={toast} />
    </>
  )
}
