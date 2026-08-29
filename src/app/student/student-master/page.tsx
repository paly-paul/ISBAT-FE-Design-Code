'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ScrollTable } from '@/components/ScrollTable'
import { ActionMenu } from '@/components/ActionMenu'
import { TableSearch } from '@/components/TableSearch'
import { SearchSelect } from '@/components/SearchSelect'
import { StudentProfileModal } from '@/components/modals/student/StudentProfileModal'
import { Toast } from '@/components/Toast'
import { EmptyState } from '@/components/EmptyState'
import { TableLoadingState } from '@/components/TableLoadingState'
import { Pagination } from '@/components/Pagination'
import { useStudents } from '@/hooks/student/useStudents'
import { useStudentSearchAdvanced, StudentSearchFilters } from '@/hooks/student/useStudentSearch'
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
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [advanced, setAdvanced] = useState<AdvancedFilterState>(EMPTY_ADVANCED)

  function nav(id: string) { router.push('/student/' + id) }
  function openModal(id: string) { setOpenModals(prev => new Set(prev).add(id)) }
  function closeModal(id: string) { setOpenModals(prev => { const s = new Set(prev); s.delete(id); return s }) }
  function showToast(msg: string, type = '') { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }
  function handleView(studentGuid: string) { setSelectedStudentGuid(studentGuid); openModal('view-student-modal') }
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

  // students/student-search/post-student-search.md — the full 14-filter
  // search. Only used once an advanced filter is actually set; otherwise
  // this stays on GET /students (useStudents), the documented "thin
  // single-term variant" for the common free-text case.
  const advancedFilters: StudentSearchFilters = {
    programGuid: advanced.programGuid || null,
    batchGuid: advanced.batchGuid || null,
    semesterGuid: advanced.semesterGuid || null,
    campusGuid: advanced.campusGuid || null,
    sponsorCategoryGuid: advanced.sponsorCategoryGuid || null,
    refugee: advanced.refugee === '' ? null : advanced.refugee === 'yes',
    intCountryCode: advanced.intCountryCode ? Number(advanced.intCountryCode) : null,
    intakeCode: advanced.intakeCode ? Number(advanced.intakeCode) : null,
    gender: advanced.gender ? Number(advanced.gender) : null,
    studentRegNo: search.trim() || null,
    studentName: search.trim() || null,
    pageNumber: page,
    pageSize: PAGE_SIZE,
  }

  const plainQuery = useStudents(page, PAGE_SIZE, { searchTerm: search.trim() || undefined })
  const advancedQuery = useStudentSearchAdvanced(advancedFilters, hasAdvancedFilters)
  const { data, isLoading } = hasAdvancedFilters ? advancedQuery : plainQuery

  const items = data?.items ?? []
  const totalCount = data?.totalCount ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
  const searchMatches = search.trim() && !hasAdvancedFilters ? items.slice(0, 8) : []

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
                results={searchMatches.map(r => ({ id: r.studentGuid, primary: r.studentNum, secondary: r.studentName }))}
              />
              <button className={`btn btn-sm ${hasAdvancedFilters ? 'btn-primary' : 'btn-neu'}`} onClick={() => setFiltersOpen(v => !v)}>
                <i className="lni lni-funnel"></i> Filters{hasAdvancedFilters ? ` (${Object.values(advanced).filter(v => v !== '').length})` : ''}
              </button>
            </div>
          </div>

          {filtersOpen && (
            <div className="p-4 mb-3 rounded-[var(--rsm)] bg-b50 border border-[1.5px] border-b100">
              <div className="g3 mb-3">
                <div className="fg">
                  <label className="lbl">Programme</label>
                  <SearchSelect
                    placeholder="— Any programme —"
                    options={programs.map(p => ({ value: p.programGuid, label: p.programName }))}
                    value={advanced.programGuid}
                    onChange={v => updateAdvanced({ programGuid: v, semesterGuid: '' })}
                  />
                </div>
                <div className="fg">
                  <label className="lbl">Semester</label>
                  <SearchSelect
                    placeholder={advanced.programGuid ? '— Any semester —' : 'Select a programme first'}
                    options={semesters.map(s => ({ value: s.semesterGuid, label: s.semName }))}
                    value={advanced.semesterGuid}
                    onChange={v => updateAdvanced({ semesterGuid: v })}
                    disabled={!advanced.programGuid}
                  />
                </div>
                <div className="fg">
                  <label className="lbl">Batch</label>
                  <SearchSelect
                    placeholder="— Any batch —"
                    options={batches.map(b => ({ value: b.batchGuid, label: b.batchCode }))}
                    value={advanced.batchGuid}
                    onChange={v => updateAdvanced({ batchGuid: v })}
                  />
                </div>
                <div className="fg">
                  <label className="lbl">Campus</label>
                  <SearchSelect
                    placeholder="— Any campus —"
                    options={campuses.map(c => ({ value: c.campusGuid, label: c.campusName }))}
                    value={advanced.campusGuid}
                    onChange={v => updateAdvanced({ campusGuid: v })}
                  />
                </div>
                <div className="fg">
                  <label className="lbl">Sponsor Category</label>
                  <SearchSelect
                    placeholder="— Any category —"
                    options={(sponsorCategoriesPage?.items ?? []).map(c => ({ value: c.sponsorCategoryGuid, label: c.category }))}
                    value={advanced.sponsorCategoryGuid}
                    onChange={v => updateAdvanced({ sponsorCategoryGuid: v })}
                  />
                </div>
                <div className="fg">
                  <label className="lbl">Refugee Status</label>
                  <SearchSelect
                    placeholder="— Any —"
                    options={[{ value: 'yes', label: 'Refugee' }, { value: 'no', label: 'Not a refugee' }]}
                    value={advanced.refugee}
                    onChange={v => updateAdvanced({ refugee: v as 'yes' | 'no' })}
                  />
                </div>
              </div>
              {/* Country code / intake code / gender are legacy integer keys with
                  no confirmed lookup or label mapping anywhere in this app (see
                  studentSearch.ts) — plain numeric inputs rather than invented
                  dropdowns, same convention as the Refugee Status modal on the
                  Student Profile page. */}
              <div className="g3">
                <div className="fg"><label className="lbl">Country Code</label><input className="ctrl" type="number" min={1} value={advanced.intCountryCode} onChange={e => updateAdvanced({ intCountryCode: e.target.value })} placeholder="Legacy numeric code" /></div>
                <div className="fg"><label className="lbl">Intake Code</label><input className="ctrl" type="number" min={1} value={advanced.intakeCode} onChange={e => updateAdvanced({ intakeCode: e.target.value })} placeholder="e.g. 20264" /></div>
                <div className="fg"><label className="lbl">Gender (enum value)</label><input className="ctrl" type="number" min={0} value={advanced.gender} onChange={e => updateAdvanced({ gender: e.target.value })} placeholder="Raw Gender enum value" /></div>
              </div>
              {hasAdvancedFilters && (
                <div className="flex gap-2" style={{ justifyContent: 'flex-end', marginTop: 12 }}>
                  <button className="btn btn-neu btn-sm" onClick={clearAdvanced}><i className="lni lni-close"></i> Clear Filters</button>
                </div>
              )}
            </div>
          )}

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
                    ? <EmptyState colSpan={7} hasFilters={!!search.trim() || hasAdvancedFilters} onClearFilters={() => { setSearch(''); clearAdvanced() }} />
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
