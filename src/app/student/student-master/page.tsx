'use client'
import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ScrollTable } from '@/components/ScrollTable'
import { ActionMenu } from '@/components/ActionMenu'
import { TableSearch } from '@/components/TableSearch'
import { GuidColumnFilter } from '@/components/GuidColumnFilter'
import { StudentRefugeeModal } from '@/components/modals/student/StudentRefugeeModal'
import { StudentSponsorModal } from '@/components/modals/student/StudentSponsorModal'
import { Toast } from '@/components/Toast'
import { EmptyState } from '@/components/EmptyState'
import { TableLoadingState } from '@/components/TableLoadingState'
import { Pagination } from '@/components/Pagination'
import { useStudentsFilter, useStudentsFilterMulti, getStudentsFilterCombinations, useStudentsInfinite } from '@/hooks/student/useStudents'
import { useProgramMasters } from '@/hooks/academic/useProgramMaster'
import { useBatches } from '@/hooks/academic/useBatches'
import { useSemestersForProgram } from '@/hooks/academic/useSemesters'
// import { usePagePermissions } from '@/hooks/users/usePagePermissions'

const PAGE_SIZE = 10

// Empty array means "not applied" — matches get-students-filter.md's own
// "omitted filters are not applied" behaviour. Only these three: that's all
// GET /api/v1/students/filter takes (plus searchTerm, handled by the
// existing search box above the table). An earlier, broader
// AdvancedFilterState (campus/sponsor/refugee/country/intake/gender) lived
// here before this — dropped along with its own dead "Filters" toggle
// button, since no confirmed endpoint ever backed those and this real one
// only covers Programme/Semester/Batch. Each field is an array — multi-
// select, same as FilterTh's own columns elsewhere — even though the
// endpoint itself only takes one guid per field; see
// getStudentsFilterCombinations/useStudentsFilterMulti in useStudents.ts
// for how multiple selections turn into real results.
interface ColumnFilterState {
  programGuid: string[]
  semesterGuid: string[]
  batchGuid: string[]
}
const EMPTY_COLUMN_FILTERS: ColumnFilterState = { programGuid: [], semesterGuid: [], batchGuid: [] }

function StudentMasterContent() {
  // Permission checks disabled for now — every action is allowed. Restore the
  // line below (and the import above) to gate actions by the menu permissions again.
  // const permissions = usePagePermissions()
  const permissions = { add: true, edit: true, delete: true }
  const router = useRouter()
  const searchParams = useSearchParams()
  // Student Profile's read-only Refugee Status / Sponsor fields link here as
  // ?refugeeFor=<guid> or ?sponsorFor=<guid> (plus &studentName=<name>) —
  // the matching modal opens pre-loaded for that student, and the params
  // are cleared below so a refresh doesn't reopen it.
  const refugeeForParam = searchParams.get('refugeeFor')
  const sponsorForParam = searchParams.get('sponsorFor')
  const [openModals, setOpenModals] = useState<Set<string>>(() => new Set(
    refugeeForParam ? ['refugee-status-modal'] : sponsorForParam ? ['sponsor-modal'] : []
  ))
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)
  const [selectedStudentGuid, setSelectedStudentGuid] = useState<string | null>(refugeeForParam ?? sponsorForParam)
  const [selectedStudentName, setSelectedStudentName] = useState<string | undefined>(() => searchParams.get('studentName') ?? undefined)
  useEffect(() => {
    if (refugeeForParam || sponsorForParam) router.replace('/student/student-master')
  }, [refugeeForParam, sponsorForParam, router])
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [colFilters, setColFilters] = useState<ColumnFilterState>(EMPTY_COLUMN_FILTERS)
  // Which column's filter popover is open, if any — GuidColumnFilter's own
  // funnel icon toggles this, same "one open at a time, tracked by key"
  // convention academic/intake-master's own FilterTh usage already uses.
  const [openColFilter, setOpenColFilter] = useState<string | null>(null)

  function openModal(id: string) { setOpenModals(prev => new Set(prev).add(id)) }
  function closeModal(id: string) { setOpenModals(prev => { const s = new Set(prev); s.delete(id); return s }) }
  function showToast(msg: string, type = '') { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }
  // Navigates to the full Student Profile page instead of the old read-only
  // modal (StudentProfileModal, now unused) — same page Student Profile's
  // own sidebar link opens, just pre-loaded via ?studentGuid= instead of a
  // StudentLookup search.
  function handleView(studentGuid: string) { router.push('/student/profile?studentGuid=' + studentGuid) }
  function handleLearningMode(studentGuid: string) { router.push('/student/learning-mode?studentGuid=' + studentGuid) }
  function handleRefugee(studentGuid: string, studentName: string) { setSelectedStudentGuid(studentGuid); setSelectedStudentName(studentName); openModal('refugee-status-modal') }
  function handleSponsor(studentGuid: string, studentName: string) { setSelectedStudentGuid(studentGuid); setSelectedStudentName(studentName); openModal('sponsor-modal') }
  function updateSearch(value?: string) { setSearch(value ?? ''); setPage(1) }
  // Closes whichever column popover is open — every call site here is a
  // committed choice (OK or Reset inside GuidColumnFilter), same as
  // FilterTh's own onSelect/onClear handlers closing the filter themselves.
  function updateColFilters(patch: Partial<ColumnFilterState>) { setColFilters(prev => ({ ...prev, ...patch })); setPage(1); setOpenColFilter(null) }
  function clearColFilters() { setColFilters(EMPTY_COLUMN_FILTERS); setPage(1); setOpenColFilter(null) }

  const { data: programs = [] } = useProgramMasters()
  const { data: allBatchesData } = useBatches(1, 1000)
  const batches = allBatchesData?.items ?? []
  // Scoped to the Programme filter, same as every other Programme→Semester
  // cascade in this app (Programme Transfer's own included) — there's no
  // "all semesters" mode to fall back to, so Semester's own GuidColumnFilter
  // stays disabled until at least one Programme is picked. With multiple
  // programmes checked, this just reads semesters off the first one —
  // Semester Master's catalogue (Semester 1/2/3/…) is the same structure
  // across programmes in practice, so this doesn't meaningfully narrow the
  // list a second programme's own semesters would've offered.
  const { data: semesters = [] } = useSemestersForProgram(colFilters.programGuid[0] ?? null, colFilters.programGuid.length > 0)

  const hasColFilters = colFilters.programGuid.length > 0 || colFilters.semesterGuid.length > 0 || colFilters.batchGuid.length > 0

  // get-students-filter.md's programGuid/semesterGuid/batchGuid each take
  // exactly one guid — a multi-select column here (checking 2+ boxes) has
  // no single request that can express it. combos is every (programGuid ×
  // semesterGuid × batchGuid) combination actually selected; it collapses
  // to exactly one entry — real server pagination via useStudentsFilter
  // below — whenever each dimension has at most one value picked (the
  // common case, including "no filters at all"). More than one combination
  // switches to useStudentsFilterMulti, which fetches each combination in
  // full and merges/paginates client-side — see that hook's own comment in
  // useStudents.ts for why.
  const normalizedSearch = (search || '').trim()
  const combos = getStudentsFilterCombinations(colFilters, normalizedSearch || undefined)
  const isMultiCombo = combos.length > 1

  const singleQuery = useStudentsFilter(page, PAGE_SIZE, combos[0], !isMultiCombo)
  const multi = useStudentsFilterMulti(combos, isMultiCombo)
  const multiTotalCount = multi.items.length
  const multiPageItems = multi.items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const items = isMultiCombo ? multiPageItems : (singleQuery.data?.items ?? [])
  const totalCount = isMultiCombo ? multiTotalCount : (singleQuery.data?.totalCount ?? 0)
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
  const isLoading = isMultiCombo ? multi.isLoading : singleQuery.isLoading

  // Dedicated, infinite-scroll query for the search dropdown — its matches
  // aren't filtered by the guid columns above, so it's suppressed the
  // moment any column filter is active rather than showing unfiltered
  // "quick jump" results alongside a filtered table.
  const searchDropdownQuery = useStudentsInfinite(normalizedSearch, 15)
  const searchMatches = normalizedSearch && !hasColFilters
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
                results={searchMatches.map(r => ({
                  id: r.studentGuid,
                  primary: r.studentName || r.studentRegNo || r.studentNum || '',
                  secondary: [r.studentRegNo, r.studentNum].filter(Boolean).join(' · '),
                }))}
                onSelect={r => updateSearch(r.primary)}
              />
            </div>
          </div>

          <ScrollTable filters={{ ...colFilters }} onResetFilters={clearColFilters}>
            <table>
              <thead>
                <tr>
                  <th style={{ width: 48 }}></th>
                  <th>Reg No.</th>
                  <th>Name</th>
                  {/* Column filters — multi-select, same interaction as
                      FilterTh's own columns elsewhere (Select All, staged
                      pending choice, Reset/Cancel/OK), backed by GET
                      /api/v1/students/filter (get-students-filter.md)
                      instead of a client-side Array.filter() — see
                      GuidColumnFilter's own header comment and
                      useStudentsFilterMulti in useStudents.ts for how a
                      multi-value pick here turns into real results. */}
                  <GuidColumnFilter
                    label="Programme"
                    options={programs.map(p => ({ value: p.programGuid, label: p.programName }))}
                    isOpen={openColFilter === 'programGuid'}
                    activeFilter={colFilters.programGuid}
                    onToggle={e => { e.stopPropagation(); setOpenColFilter(v => v === 'programGuid' ? null : 'programGuid') }}
                    // Semester is scoped to Programme — clears with it so a
                    // stale semester from the previous programme doesn't
                    // silently keep narrowing the result set.
                    onSelect={vals => updateColFilters({ programGuid: vals, semesterGuid: [] })}
                    onClear={() => updateColFilters({ programGuid: [], semesterGuid: [] })}
                    onClose={() => setOpenColFilter(null)}
                  />
                  <GuidColumnFilter
                    label="Semester"
                    options={semesters.map(s => ({ value: s.semesterGuid, label: s.semName }))}
                    isOpen={openColFilter === 'semesterGuid'}
                    activeFilter={colFilters.semesterGuid}
                    onToggle={e => { e.stopPropagation(); setOpenColFilter(v => v === 'semesterGuid' ? null : 'semesterGuid') }}
                    onSelect={vals => updateColFilters({ semesterGuid: vals })}
                    onClear={() => updateColFilters({ semesterGuid: [] })}
                    onClose={() => setOpenColFilter(null)}
                    disabled={colFilters.programGuid.length === 0}
                    disabledHint="Select a Programme filter first"
                  />
                  <GuidColumnFilter
                    label="Batch"
                    options={batches.map(b => ({ value: b.batchGuid, label: b.batchCode }))}
                    isOpen={openColFilter === 'batchGuid'}
                    activeFilter={colFilters.batchGuid}
                    onToggle={e => { e.stopPropagation(); setOpenColFilter(v => v === 'batchGuid' ? null : 'batchGuid') }}
                    onSelect={vals => updateColFilters({ batchGuid: vals })}
                    onClear={() => updateColFilters({ batchGuid: [] })}
                    onClose={() => setOpenColFilter(null)}
                  />
                </tr>
              </thead>
              <tbody>
                {isLoading
                  ? <TableLoadingState colSpan={6} />
                  : items.length === 0
                    ? <EmptyState colSpan={6} hasFilters={!!normalizedSearch || hasColFilters} onClearFilters={() => { setSearch(''); clearColFilters() }} />
                    : null}
                {items.map(r => (
                  <tr key={r.studentGuid}>
                    <td>
                      <ActionMenu>
                        <button className="btn btn-neu btn-sm" onClick={() => handleView(r.studentGuid)}><i className="lni lni-eye"></i> View</button>
                        {permissions.edit && <button className="btn btn-neu btn-sm" onClick={() => handleLearningMode(r.studentGuid)}><i className="lni lni-book"></i> Learning Mode</button>}
                        {permissions.edit && <button className="btn btn-neu btn-sm" onClick={() => handleRefugee(r.studentGuid, r.studentName)}><i className="lni lni-shield"></i> Refugee Status</button>}
                        {permissions.edit && <button className="btn btn-neu btn-sm" onClick={() => handleSponsor(r.studentGuid, r.studentName)}><i className="lni lni-handshake"></i> Sponsor</button>}
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
      <StudentRefugeeModal isOpen={openModals.has('refugee-status-modal')} onClose={() => closeModal('refugee-status-modal')} showToast={showToast} studentGuid={selectedStudentGuid} studentName={selectedStudentName} />
      <StudentSponsorModal isOpen={openModals.has('sponsor-modal')} onClose={() => closeModal('sponsor-modal')} showToast={showToast} studentGuid={selectedStudentGuid} studentName={selectedStudentName} />
      <Toast toast={toast} />
    </>
  )
}

export default function Page() {
  return (
    <Suspense>
      <StudentMasterContent />
    </Suspense>
  )
}
