'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ScrollTable } from '@/components/ScrollTable'
import { ActionMenu } from '@/components/ActionMenu'
import { TableSearch } from '@/components/TableSearch'
import { SearchSelect } from '@/components/SearchSelect'
import { StudentProfileModal } from '@/components/modals/student/StudentProfileModal'
import { StudentRefugeeModal } from '@/components/modals/student/StudentRefugeeModal'
import { Toast } from '@/components/Toast'
import { EmptyState } from '@/components/EmptyState'
import { TableLoadingState } from '@/components/TableLoadingState'
import { Pagination } from '@/components/Pagination'
import { useStudents, useStudentsInfinite } from '@/hooks/student/useStudents'
import { useProgramMasters } from '@/hooks/academic/useProgramMaster'
import { useBatches } from '@/hooks/academic/useBatches'
import { useSemestersForProgram } from '@/hooks/academic/useSemesters'
import { useCampuses } from '@/hooks/config/useCampuses'
import { useSponsorCategories } from '@/hooks/student/useSponsor'

const PAGE_SIZE = 10

// Empty/blank means "not applied" throughout — matches the docs' own
// "omitted filters are not applied" behaviour for the advanced search.
interface AdvancedFilterState {
  programGuid: string
  batchGuid: string
  semesterGuid: string
  campusGuid: string
  sponsorCategoryGuid: string
  refugee: '' | 'yes' | 'no'
  intCountryCode: string
  intakeCode: string
  gender: string
}
const EMPTY_ADVANCED: AdvancedFilterState = {
  programGuid: '', batchGuid: '', semesterGuid: '', campusGuid: '', sponsorCategoryGuid: '',
  refugee: '', intCountryCode: '', intakeCode: '', gender: '',
}

export default function Page() {
  const router = useRouter()
  const [openModals, setOpenModals] = useState<Set<string>>(new Set())
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)
  const [selectedStudentGuid, setSelectedStudentGuid] = useState<string | null>(null)
  const [selectedStudentName, setSelectedStudentName] = useState<string | undefined>(undefined)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [advanced, setAdvanced] = useState<AdvancedFilterState>(EMPTY_ADVANCED)

  function nav(id: string) { router.push('/student/' + id) }
  function openModal(id: string) { setOpenModals(prev => new Set(prev).add(id)) }
  function closeModal(id: string) { setOpenModals(prev => { const s = new Set(prev); s.delete(id); return s }) }
  function showToast(msg: string, type = '') { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }
  function handleView(studentGuid: string) { setSelectedStudentGuid(studentGuid); openModal('view-student-modal') }
  function handleRefugee(studentGuid: string, studentName: string) { setSelectedStudentGuid(studentGuid); setSelectedStudentName(studentName); openModal('refugee-status-modal') }
  function updateSearch(value: string) { setSearch(value); setPage(1) }
  function updateAdvanced(patch: Partial<AdvancedFilterState>) { setAdvanced(prev => ({ ...prev, ...patch })); setPage(1) }
  function clearAdvanced() { setAdvanced(EMPTY_ADVANCED); setPage(1) }

  const { data: programs = [] } = useProgramMasters()
  const { data: allBatchesData } = useBatches(1, 1000)
  const batches = allBatchesData?.items ?? []
  const { data: campuses = [] } = useCampuses()
  const { data: sponsorCategoriesPage } = useSponsorCategories()
  const { data: semesters = [] } = useSemestersForProgram(advanced.programGuid, !!advanced.programGuid)

  const hasAdvancedFilters = Object.values(advanced).some(v => v !== '')

  const { data, isLoading } = useStudents(page, PAGE_SIZE, search.trim() ? { searchTerm: search.trim() } : undefined)

  const items = data?.items ?? []
  const totalCount = data?.totalCount ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  // Dedicated, infinite-scroll query for the search dropdown
  const searchDropdownQuery = useStudentsInfinite(search.trim(), 15)
  const searchMatches = search.trim() && !hasAdvancedFilters
    ? searchDropdownQuery.data?.pages.flatMap(p => p.items) ?? []
    : []

  return (
    <>
      <div className="page active">
        <div className="pg-hdr">
          <div><div className="pg-title">Student Master</div><div className="pg-sub">Master list of enrolled students · Programme, semester &amp; batch</div></div>
        </div>
        <div className="card">
          <div className="card-hdr">
            <div className="card-title"><span className="ctitle-icon"><i className="lni lni-graduation"></i></span> Students</div>
            <div className="flex gap-2" style={{ alignItems: 'center' }}>
              <TableSearch
                className="w-56"
                placeholder="Search by Student No., Reg No. or name…"
                value={search}
                onChange={updateSearch}
                loading={searchDropdownQuery.isLoading}
                onLoadMore={() => searchDropdownQuery.fetchNextPage()}
                hasMore={!!searchDropdownQuery.hasNextPage}
                loadingMore={searchDropdownQuery.isFetchingNextPage}
                results={searchMatches.map(r => ({ id: r.studentGuid, primary: r.studentNum, secondary: r.studentName }))}
              />
              <button className={`btn btn-sm ${hasAdvancedFilters ? 'btn-primary' : 'btn-neu'}`} onClick={() => setFiltersOpen(v => !v)}>
                <i className="lni lni-funnel"></i> Filters{hasAdvancedFilters ? ` (${Object.values(advanced).filter(v => v !== '').length})` : ''}
              </button>
            </div>
          </div>

          {/* Advanced filters removed for now as requested */}

          <ScrollTable>
            <table>
              <thead>
                <tr>
                  <th style={{ width: 48 }}></th>
                  <th>Reg No.</th>
                  <th>Name</th>
                  <th>Programme</th>
                  <th>Semester</th>
                  <th>Batch</th>
                </tr>
              </thead>
              <tbody>
                {isLoading
                  ? <TableLoadingState colSpan={6} />
                  : items.length === 0
                    ? <EmptyState colSpan={6} hasFilters={!!search.trim() || hasAdvancedFilters} onClearFilters={() => { setSearch(''); clearAdvanced() }} />
                    : null}
                {items.map(r => (
                  <tr key={r.studentGuid}>
                    <td>
                      <ActionMenu>
                        <button className="btn btn-neu btn-sm" onClick={() => handleView(r.studentGuid)}><i className="lni lni-eye"></i> View</button>
                        <button className="btn btn-neu btn-sm" onClick={() => handleRefugee(r.studentGuid, r.studentName)}><i className="lni lni-shield"></i> Refugee Status</button>
                      </ActionMenu>
                    </td>
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
      <StudentRefugeeModal isOpen={openModals.has('refugee-status-modal')} onClose={() => closeModal('refugee-status-modal')} showToast={showToast} studentGuid={selectedStudentGuid} studentName={selectedStudentName} />
      <Toast toast={toast} />
    </>
  )
}
