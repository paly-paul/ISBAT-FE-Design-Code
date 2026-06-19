'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ScrollTable } from '@/components/ScrollTable'
import { ActionMenu } from '@/components/ActionMenu'
import { NewFacultyModal } from '@/components/modals/NewFacultyModal'
import { EditFacultyModal } from '@/components/modals/EditFacultyModal'
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
    { code: 'FCT', name: 'Faculty of Computing & Technology',  dean: 'Dr. Ssekibuule Ronald', programmes: 3, units: 42 },
    { code: 'FBM', name: 'Faculty of Business & Management',   dean: 'Prof. Mukasa Charles',  programmes: 4, units: 56 },
    { code: 'FEN', name: 'Faculty of Engineering',             dean: 'Dr. Tendo Patrick',      programmes: 2, units: 38 },
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
          <div><div className="pg-title">Faculty Master</div><div className="pg-sub">Define university faculties · Associate programmes and course units</div></div>
          <button className="btn btn-primary" onClick={() => openModal('new-faculty-modal')}><i className="lni lni-plus"></i> Add Faculty</button>
        </div>
        <div className="card">
          <div className="card-hdr"><div className="card-title"><span className="ctitle-icon"><i className="lni lni-apartment"></i></span> Faculties</div></div>
          <ScrollTable>
            <table>
              <thead><tr><th>Action</th><th>Faculty Code</th><th>Faculty Name</th>{fth('Dean', 'dean', ['Dr. Ssekibuule Ronald', 'Prof. Mukasa Charles', 'Dr. Tendo Patrick'])}<th>Programmes</th><th>Course Units</th></tr></thead>
              <tbody>
                {filteredRows.map((r, i) => (
                  <tr key={i}>
                    <td><ActionMenu><button className="btn btn-neu btn-sm" onClick={() => openModal('edit-faculty-modal')}><i className="lni lni-pencil"></i> Edit</button></ActionMenu></td>
                    <td className="font-mono">{r.code}</td>
                    <td><strong>{r.name}</strong></td>
                    <td>{r.dean}</td>
                    <td>{r.programmes}</td>
                    <td>{r.units}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollTable>
        </div>
      </div>
      <NewFacultyModal isOpen={openModals.has('new-faculty-modal')} onClose={() => closeModal('new-faculty-modal')} showToast={showToast} />
      <EditFacultyModal isOpen={openModals.has('edit-faculty-modal')} onClose={() => closeModal('edit-faculty-modal')} showToast={showToast} />
      <Toast toast={toast} />
    </>
  )
}
