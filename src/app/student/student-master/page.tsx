'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ScrollTable } from '@/components/ScrollTable'
import { ActionMenu } from '@/components/ActionMenu'
import { NewStudentModal } from '@/components/modals/student/NewStudentModal'
import { EditStudentModal } from '@/components/modals/student/EditStudentModal'
import { StudentProfileModal, StudentRecord } from '@/components/modals/student/StudentProfileModal'
import { Toast } from '@/components/Toast'
import { FilterTh } from '@/components/FilterTh'
import { EmptyState } from '@/components/EmptyState'
import { Pagination } from '@/components/Pagination'
import { usePagination } from '@/hooks/usePagination'

const PAGE_SIZE = 10

function statusBadge(status: string) {
  const map: Record<string, string> = { Active: 'badge-green', Suspended: 'badge-red', Deferred: 'badge-amber', Graduated: 'badge-blue' }
  return map[status] || 'badge-grey'
}

export default function Page() {
  const router = useRouter()
  const [openModals, setOpenModals] = useState<Set<string>>(new Set())
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)
  const [filters, setFilters] = useState<Record<string, string[]>>({})
  const [openFilter, setOpenFilter] = useState<string | null>(null)
  const [selectedStudent, setSelectedStudent] = useState<StudentRecord | null>(null)

  function nav(id: string) { router.push('/student/' + id) }
  function openModal(id: string) { setOpenModals(prev => new Set(prev).add(id)) }
  function closeModal(id: string) { setOpenModals(prev => { const s = new Set(prev); s.delete(id); return s }) }
  function showToast(msg: string, type = '') { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }
  function handleView(row: StudentRecord) { setSelectedStudent(row); openModal('view-student-modal') }

  useEffect(() => {
    function closeFilter(e: MouseEvent) {
      const target = e.target as HTMLElement
      if (!target.closest('th')) setOpenFilter(null)
    }
    document.addEventListener('click', closeFilter)
    return () => document.removeEventListener('click', closeFilter)
  }, [])

  const rows = [
    { id: 'ISB/2024/BSCS/0142', name: 'Aisha Nakamya',   programme: 'BSc. Computer Science',       batch: 'BSC-IT-S26-DA', status: 'Active' },
    { id: 'ISB/2024/BBA/0089',  name: 'Okello James',    programme: 'BBA Business Administration', batch: 'BBA-2024-JAN-A', status: 'Active' },
    { id: 'ISB/2023/BSIT/0201', name: 'Grace Nampijja',  programme: 'BSc. Information Technology', batch: 'BSIT-2023-SEP-B', status: 'Deferred' },
    { id: 'ISB/2021/NUR/0034',  name: 'Brian Ssemanda',  programme: 'Diploma in Nursing',          batch: 'NUR-2025-MAY-A', status: 'Graduated' },
  ]
  const filteredRows = rows.filter(r =>
    Object.entries(filters).every(([k, v]) => !v.length || v.includes(String((r as Record<string, unknown>)[k])))
  )

  const { page, setPage, totalPages, totalCount, pageItems } = usePagination(filteredRows, PAGE_SIZE)

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
          <div><div className="pg-title">Student Master</div><div className="pg-sub">Master list of enrolled students · Programme, batch &amp; status</div></div>
          <button className="btn btn-primary" onClick={() => openModal('new-student-modal')}><i className="lni lni-plus"></i> Add Student</button>
        </div>
        <div className="card">
          <div className="card-hdr"><div className="card-title"><span className="ctitle-icon"><i className="lni lni-graduation"></i></span> Students</div></div>
          <ScrollTable filters={filters} onResetFilters={() => setFilters({})}>
            <table>
              <thead>
                <tr>
                  <th style={{ width: 48 }}></th>
                  <th>Student ID</th>
                  <th>Name</th>
                  {fth('Programme', 'programme', ['BSc. Computer Science', 'BBA Business Administration', 'BSc. Information Technology', 'Diploma in Nursing'])}
                  <th>Batch</th>
                  {fth('Status', 'status', ['Active', 'Suspended', 'Deferred', 'Graduated'])}
                </tr>
              </thead>
              <tbody>
                {filteredRows.length === 0
                  ? <EmptyState colSpan={999} hasFilters={Object.values(filters).some(v => v.length > 0)} onClearFilters={() => setFilters({})} />
                  : null}
                {pageItems.map((r, i) => (
                  <tr key={i}>
                    <td>
                      <ActionMenu>
                        <button className="btn btn-neu btn-sm" onClick={() => handleView(r)}><i className="lni lni-eye"></i> View</button>
                        <button className="btn btn-neu btn-sm" onClick={() => openModal('edit-student-modal')}><i className="lni lni-pencil"></i> Edit</button>
                      </ActionMenu>
                    </td>
                    <td className="font-mono">{r.id}</td>
                    <td><strong>{r.name}</strong></td>
                    <td>{r.programme}</td>
                    <td>{r.batch}</td>
                    <td><span className={`badge ${statusBadge(r.status)}`}>{r.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollTable>
          <Pagination page={page} totalPages={totalPages} totalCount={totalCount} itemLabel="students" onPageChange={setPage} />
        </div>
      </div>
      <NewStudentModal isOpen={openModals.has('new-student-modal')} onClose={() => closeModal('new-student-modal')} showToast={showToast} />
      <EditStudentModal isOpen={openModals.has('edit-student-modal')} onClose={() => closeModal('edit-student-modal')} showToast={showToast} />
      <StudentProfileModal isOpen={openModals.has('view-student-modal')} onClose={() => closeModal('view-student-modal')} showToast={showToast} student={selectedStudent} />
      <Toast toast={toast} />
    </>
  )
}
