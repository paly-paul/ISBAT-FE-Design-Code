'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ScrollTable } from '@/components/ScrollTable'
import { ActionMenu } from '@/components/ActionMenu'
import { NewFacultyModal } from '@/components/modals/academic/NewFacultyModal'
import { EditFacultyModal } from '@/components/modals/academic/EditFacultyModal'
import { Toast } from '@/components/Toast'
import { FilterTh } from '@/components/FilterTh'
import { EmptyState } from '@/components/EmptyState'
import { TableLoadingState } from '@/components/TableLoadingState'
import { useFaculties, useCreateFaculty, useUpdateFaculty, Faculty } from '@/hooks/config/useFaculties'

export default function Page() {
  const router = useRouter()
  const [openModals, setOpenModals] = useState<Set<string>>(new Set())
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)
  const [filters, setFilters] = useState<Record<string, string[]>>({})
  const [openFilter, setOpenFilter] = useState<string | null>(null)
  const [editingFaculty, setEditingFaculty] = useState<Faculty | null>(null)

  const { data: rows = [], isLoading } = useFaculties()
  const createFaculty = useCreateFaculty()
  const updateFaculty = useUpdateFaculty()

  function nav(id: string) { router.push('/config/' + id) }
  function openModal(id: string) { setOpenModals(prev => new Set(prev).add(id)) }
  function closeModal(id: string) { setOpenModals(prev => { const s = new Set(prev); s.delete(id); return s }) }
  function showToast(msg: string, type = '') { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }

  function openEditModal(faculty: Faculty) {
    setEditingFaculty(faculty)
    openModal('edit-faculty-modal')
  }

  useEffect(() => {
    function closeFilter(e: MouseEvent) {
      const target = e.target as HTMLElement
      if (!target.closest('th')) setOpenFilter(null)
    }
    document.addEventListener('click', closeFilter)
    return () => document.removeEventListener('click', closeFilter)
  }, [])

  const filteredRows = rows.filter(r =>
    Object.entries(filters).every(([k, v]) => !v.length || v.includes(String((r as unknown as Record<string, unknown>)[k])))
  )

  function fth(label: string, col: string, opts: string[]) {
    return (
      <FilterTh
        label={label}
        opts={opts}
        isOpen={openFilter === col}
        activeFilter={filters[col] ?? []}
        onToggle={(e) => { e.stopPropagation(); setOpenFilter(p => p === col ? null : col) }}
        onSelect={(vals) => { setFilters(f => ({ ...f, [col]: vals })); setOpenFilter(null) }}
        onClear={() => { setFilters(f => ({ ...f, [col]: [] })); setOpenFilter(null) }}
        onClose={() => setOpenFilter(null)}
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
          <div className="card-hdr"><div className="card-title"><span className="ctitle-icon"><i className="lni lni-library"></i></span> Faculties</div></div>
          <ScrollTable filters={filters} onResetFilters={() => setFilters({})}>
            <table>
              <thead><tr><th style={{ width: 48 }}></th><th>Faculty Code</th><th>Faculty Name</th>{fth('Dean', 'dean', ['Dr. Ssekibuule Ronald', 'Prof. Mukasa Charles', 'Dr. Tendo Patrick'])}<th>Programmes</th>{/* <th>Course Units</th> */}</tr></thead>
              <tbody>
                {isLoading
                  ? <TableLoadingState colSpan={999} />
                  : filteredRows.length === 0
                    ? <EmptyState colSpan={999} hasFilters={Object.values(filters).some(v => v.length > 0)} onClearFilters={() => setFilters({})} />
                    : null}
                {filteredRows.map((r) => (
                  <tr key={r.id}>
                    <td><ActionMenu><button className="btn btn-neu btn-sm" onClick={() => openEditModal(r)}><i className="lni lni-pencil"></i> Edit</button></ActionMenu></td>
                    <td className="font-mono">{r.code}</td>
                    <td><strong>{r.name}</strong></td>
                    <td>{r.dean}</td>
                    <td>{r.programmes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollTable>
        </div>
      </div>
      <NewFacultyModal
        isOpen={openModals.has('new-faculty-modal')}
        onClose={() => closeModal('new-faculty-modal')}
        showToast={showToast}
        createFaculty={createFaculty}
      />
      <EditFacultyModal
        isOpen={openModals.has('edit-faculty-modal')}
        onClose={() => closeModal('edit-faculty-modal')}
        showToast={showToast}
        faculty={editingFaculty}
        updateFaculty={updateFaculty}
      />
      <Toast toast={toast} />
    </>
  )
}
