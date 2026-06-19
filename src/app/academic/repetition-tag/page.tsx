'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ScrollTable } from '@/components/ScrollTable'
import { ActionMenu } from '@/components/ActionMenu'
import { NewRepTagModal } from '@/components/modals/NewRepTagModal'
import { EditRepTagModal } from '@/components/modals/EditRepTagModal'
import { Toast } from '@/components/Toast'
import { FilterTh } from '@/components/FilterTh'

export default function Page() {
  const router = useRouter()
  const [openModals, setOpenModals] = useState<Set<string>>(new Set())
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [openFilter, setOpenFilter] = useState<string | null>(null)

  function nav(id: string) { router.push('/academic/' + id) }
  function openModal(id: string)  { setOpenModals(prev => new Set(prev).add(id)) }
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
    { code: 'RT-CU-001', description: 'Standard repeat for failed course units',       level: "Bachelor's Degree"    },
    { code: 'RT-CU-002', description: 'Supplementary exam carry-forward repeat',        level: 'Diploma'              },
    { code: 'RT-CU-003', description: 'Medical or special consideration repeat',        level: "Master's Degree"      },
    { code: 'RT-CU-004', description: 'Retake after academic probation',                level: "Bachelor's Degree"    },
    { code: 'RT-CU-005', description: 'Credit exemption repeat for lateral entrants',   level: 'Postgraduate Diploma' },
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
          <div>
            <div className="pg-title">Course Units Repetition Tag</div>
            <div className="pg-sub">Define repetition tags for course units · Linked to programme levels</div>
          </div>
          <button className="btn btn-primary" onClick={() => openModal('new-rep-tag-modal')}>
            <i className="lni lni-plus"></i> Add Repetition Tag
          </button>
        </div>
        <div className="card">
          <div className="card-hdr">
            <div className="card-title">
              <span className="ctitle-icon"><i className="lni lni-reload"></i></span>
              Repetition Tags
            </div>
          </div>
          <ScrollTable>
            <table>
              <thead>
                <tr>
                  <th>Action</th>
                  <th>Repetition Tag Code</th>
                  <th>Description</th>
                  {fth('Programme Level', 'level', ["Bachelor's Degree", 'Diploma', "Master's Degree", 'Postgraduate Diploma', 'Certificate', 'PhD / Doctorate'])}
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((r, i) => (
                  <tr key={i}>
                    <td><ActionMenu><button className="btn btn-neu btn-sm" onClick={() => openModal('edit-rep-tag-modal')}><i className="lni lni-pencil"></i> Edit</button></ActionMenu></td>
                    <td className="font-mono font-bold text-b700">{r.code}</td>
                    <td>{r.description}</td>
                    <td><span className="badge badge-blue">{r.level}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollTable>
        </div>
      </div>
      <NewRepTagModal  isOpen={openModals.has('new-rep-tag-modal')}  onClose={() => closeModal('new-rep-tag-modal')}  showToast={showToast} />
      <EditRepTagModal isOpen={openModals.has('edit-rep-tag-modal')} onClose={() => closeModal('edit-rep-tag-modal')} showToast={showToast} />
      <Toast toast={toast} />
    </>
  )
}
