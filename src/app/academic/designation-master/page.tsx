'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ScrollTable } from '@/components/ScrollTable'
import { ActionMenu } from '@/components/ActionMenu'
import { Toast } from '@/components/Toast'
import { FilterTh } from '@/components/FilterTh'
import { EmptyState } from '@/components/EmptyState'
import { NewDesignationModal } from '@/components/modals/academic/NewDesignationModal'
import { EditDesignationModal } from '@/components/modals/academic/EditDesignationModal'

export default function Page() {
  const router = useRouter()
  const [openModals, setOpenModals] = useState<Set<string>>(new Set())
  const [toast, setToast]           = useState<{ msg: string; type: string } | null>(null)
  const [filters, setFilters]       = useState<Record<string, string[]>>({})
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
    { designationName: 'Professor',           department: 'Computer Science' },
    { designationName: 'Associate Professor', department: 'Computer Science' },
    { designationName: 'Senior Lecturer',     department: 'Information Technology' },
    { designationName: 'Lecturer',            department: 'Business Administration' },
    { designationName: 'Assistant Lecturer',  department: 'Civil Engineering' },
    { designationName: 'Teaching Assistant',  department: 'Nursing Sciences' },
  ]

  const filteredRows = rows.filter(r =>
    Object.entries(filters).every(([k, v]) => !v.length || v.includes(String((r as Record<string, unknown>)[k])))
  )

  function fth(label: string, col: string, opts: string[]) {
    return (
      <FilterTh
        label={label}
        opts={opts}
        isOpen={openFilter === col}
        activeFilter={filters[col] ?? []}
        onToggle={e => { e.stopPropagation(); setOpenFilter(p => p === col ? null : col) }}
        onSelect={vals => { setFilters(f => ({ ...f, [col]: vals })); setOpenFilter(null) }}
        onClear={() => { setFilters(f => ({ ...f, [col]: [] })); setOpenFilter(null) }}
        onClose={() => setOpenFilter(null)}
      />
    )
  }

  return (
    <>
      <div className="page active">
        <div className="pg-hdr">
          <div>
            <div className="pg-title">Designation Master</div>
            <div className="pg-sub">Manage staff designations and their department assignments</div>
          </div>
          <button className="btn btn-primary" onClick={() => openModal('new-designation-modal')}>
            <i className="lni lni-plus"></i> Add Designation
          </button>
        </div>
        <div className="card">
          <div className="card-hdr">
            <div className="card-title"><span className="ctitle-icon"><i className="lni lni-tag"></i></span> Designations</div>
          </div>
          <ScrollTable filters={filters} onResetFilters={() => setFilters({})}>
            <table>
              <thead>
                <tr>
                  <th style={{ width: 48 }}></th>
                  <th>Designation Name</th>
                  {fth('Department', 'department', ['Computer Science', 'Information Technology', 'Business Administration', 'Civil Engineering', 'Nursing Sciences'])}
                </tr>
              </thead>
              <tbody>
                {filteredRows.length === 0
                  ? <EmptyState colSpan={999} hasFilters={Object.values(filters).some(v => v.length > 0)} onClearFilters={() => setFilters({})} />
                  : null}
                {filteredRows.map((r, i) => (
                  <tr key={i}>
                    <td>
                      <ActionMenu>
                        <button className="btn btn-neu btn-sm" onClick={() => openModal('edit-designation-modal')}>
                          <i className="lni lni-pencil"></i> Edit
                        </button>
                      </ActionMenu>
                    </td>
                    <td><strong>{r.designationName}</strong></td>
                    <td>{r.department}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollTable>
        </div>
      </div>
      <NewDesignationModal  isOpen={openModals.has('new-designation-modal')}  onClose={() => closeModal('new-designation-modal')}  showToast={showToast} />
      <EditDesignationModal isOpen={openModals.has('edit-designation-modal')} onClose={() => closeModal('edit-designation-modal')} showToast={showToast} />
      <Toast toast={toast} />
    </>
  )
}
