'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ScrollTable } from '@/components/ScrollTable'
import { ActionMenu } from '@/components/ActionMenu'
import { TableSearch } from '@/components/TableSearch'
import { StudentProfileModal } from '@/components/modals/student/StudentProfileModal'
import { Toast } from '@/components/Toast'
import { EmptyState } from '@/components/EmptyState'
import { TableLoadingState } from '@/components/TableLoadingState'
import { Pagination } from '@/components/Pagination'
import { useStudents } from '@/hooks/student/useStudents'

const PAGE_SIZE = 10

export default function Page() {
  const router = useRouter()
  const [openModals, setOpenModals] = useState<Set<string>>(new Set())
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)
  const [selectedStudentGuid, setSelectedStudentGuid] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  function nav(id: string) { router.push('/student/' + id) }
  function openModal(id: string) { setOpenModals(prev => new Set(prev).add(id)) }
  function closeModal(id: string) { setOpenModals(prev => { const s = new Set(prev); s.delete(id); return s }) }
  function showToast(msg: string, type = '') { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }
  function handleView(studentGuid: string) { setSelectedStudentGuid(studentGuid); openModal('view-student-modal') }
  function updateSearch(value: string) { setSearch(value); setPage(1) }

  // Real, server-side searchTerm/pagination — GET /api/v1/students.
  const { data, isLoading } = useStudents(page, PAGE_SIZE, { searchTerm: search.trim() || undefined })
  const items = data?.items ?? []
  const totalCount = data?.totalCount ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
  const searchMatches = search.trim() ? items.slice(0, 8) : []

  return (
    <>
      <div className="page active">
        <div className="pg-hdr">
          <div><div className="pg-title">Student Master</div><div className="pg-sub">Master list of enrolled students · Programme, semester &amp; batch</div></div>
        </div>
        <div className="card">
          <div className="card-hdr">
            <div className="card-title"><span className="ctitle-icon"><i className="lni lni-graduation"></i></span> Students</div>
            <TableSearch
              className="w-56"
              placeholder="Search by Student No., Reg No. or name…"
              value={search}
              onChange={updateSearch}
              results={searchMatches.map(r => ({ id: r.studentGuid, primary: r.studentNum, secondary: r.studentName }))}
            />
          </div>
          <ScrollTable>
            <table>
              <thead>
                <tr>
                  <th style={{ width: 48 }}></th>
                  <th>Student No.</th>
                  <th>Reg No.</th>
                  <th>Name</th>
                  <th>Programme</th>
                  <th>Semester</th>
                  <th>Batch</th>
                </tr>
              </thead>
              <tbody>
                {isLoading
                  ? <TableLoadingState colSpan={7} />
                  : items.length === 0
                    ? <EmptyState colSpan={7} hasFilters={!!search.trim()} onClearFilters={() => { setSearch(''); setPage(1) }} />
                    : null}
                {items.map(r => (
                  <tr key={r.studentGuid}>
                    <td>
                      <ActionMenu>
                        <button className="btn btn-neu btn-sm" onClick={() => handleView(r.studentGuid)}><i className="lni lni-eye"></i> View</button>
                      </ActionMenu>
                    </td>
                    <td className="font-mono">{r.studentNum}</td>
                    <td className="font-mono">{r.studentRegNo}</td>
                    <td><strong>{r.studentName}</strong></td>
                    <td>{r.programName || '—'}</td>
                    <td>{r.semesterName || '—'}</td>
                    <td>{r.batchCode || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollTable>
          <Pagination page={page} totalPages={totalPages} totalCount={totalCount} itemLabel="students" onPageChange={setPage} />
        </div>
      </div>
      <StudentProfileModal isOpen={openModals.has('view-student-modal')} onClose={() => closeModal('view-student-modal')} showToast={showToast} nav={nav} studentGuid={selectedStudentGuid} />
      <Toast toast={toast} />
    </>
  )
}
