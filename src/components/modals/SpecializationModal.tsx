'use client'
import { useState, useEffect } from 'react'
import { ModalProps } from './types'
import { ScrollTable } from '@/components/ScrollTable'
import { FilterTh } from '@/components/FilterTh'

export function SpecializationModal({ isOpen, onClose, showToast }: ModalProps) {
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [openFilter, setOpenFilter] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return
    function closeFilter() { setOpenFilter(null) }
    document.addEventListener('click', closeFilter)
    return () => document.removeEventListener('click', closeFilter)
  }, [isOpen])

  const rows = [
    { num: 1, name: 'Finance Management',       startSem: 'Sem 3', students: 42 },
    { num: 2, name: 'Operations Management',     startSem: 'Sem 3', students: 38 },
    { num: 3, name: 'Human Resource Management', startSem: 'Sem 3', students: 27 },
  ]
  const filteredRows = rows.filter(r =>
    Object.entries(filters).every(([k, v]) => !v || (r as unknown as Record<string, string>)[k] === v)
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

  if (!isOpen) return null
  return (
    <div className="modal-overlay open" id="specialization-modal" onClick={onClose}>
      <div className="modal modal-md" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr">
          <div className="modal-title"><i className="lni lni-target"></i> Manage Specializations — MBA 2024</div>
          <button className="modal-close" onClick={onClose}><i className="lni lni-close"></i></button>
        </div>
        <div className="info-box mb-[14px]"><i className="lni lni-information"></i> Specializations are chosen by <strong>individual students</strong> (not the batch). A student can only select one specialization, which dictates which Specialization course units they must study (e.g. from Sem 3 for MBA).</div>
        <ScrollTable className="mb-[14px]">
          <table>
            <thead><tr><th>Action</th><th>#</th><th>Specialization Name</th>{fth('Start Semester', 'startSem', ['Sem 3', 'Sem 4', 'Sem 5'])}<th>Students Enrolled</th></tr></thead>
            <tbody>
              {filteredRows.map((r, i) => (
                <tr key={i}>
                  <td><button className="btn btn-neu btn-sm"><i className="lni lni-pencil"></i> Edit</button></td>
                  <td>{r.num}</td>
                  <td><strong>{r.name}</strong></td>
                  <td>{r.startSem}</td>
                  <td>{r.students}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollTable>
        <div className="g2">
          <div className="fg"><div className="lbl">New Specialization Name</div><input className="ctrl" placeholder="e.g. Digital Marketing" /></div>
          <div className="fg"><div className="lbl">Starts from Semester</div><select className="ctrl"><option>Sem 3</option><option>Sem 4</option><option>Sem 5</option></select></div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-neu" onClick={onClose}>Close</button>
          <button className="btn btn-primary" onClick={() => showToast('Specialization added.', 'success')}><i className="lni lni-plus"></i> Add Specialization</button>
        </div>
      </div>
    </div>
  )
}
