'use client'
import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams, ReadonlyURLSearchParams } from 'next/navigation'
import { ScrollTable } from '@/components/ScrollTable'
import { ActionMenu } from '@/components/ActionMenu'
import { TableSearch } from '@/components/TableSearch'
import { GuidColumnFilter } from '@/components/GuidColumnFilter'
import { IntakeSearchPicker } from '@/components/IntakeSearchPicker'
import { useIntakesByGuids } from '@/hooks/academic/useIntakes'
import { StudentRefugeeModal } from '@/components/modals/student/StudentRefugeeModal'
import { StudentLearningModeModal } from '@/components/modals/student/StudentLearningModeModal'
import { StudentSponsorModal } from '@/components/modals/student/StudentSponsorModal'
import { Toast } from '@/components/Toast'
import { EmptyState } from '@/components/EmptyState'
import { TableLoadingState } from '@/components/TableLoadingState'
import { Pagination } from '@/components/Pagination'
import { useStudentsFilter, useStudentsFilterMulti, getStudentsFilterCombinations, useStudentsInfinite } from '@/hooks/student/useStudents'
import { useProgramMasters } from '@/hooks/academic/useProgramMaster'
import { useBatches } from '@/hooks/academic/useBatches'
import { useSemesterCodeGroups } from '@/hooks/academic/useSemesters'
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
// for how multiple selections turn into real results. Semester holds
// semCodes, not guids — sent as /students/filter's semCode param.
interface ColumnFilterState {
  programGuid: string[]
  semCode: string[]
  batchGuid: string[]
}
const EMPTY_COLUMN_FILTERS: ColumnFilterState = { programGuid: [], semCode: [], batchGuid: [] }

// Page/intake/search/column filters ↔ URL query (?page=&intake=&q=&prog=
// &sem=&batch=). Parameters this page doesn't own (refugeeFor etc.) are
// ignored/dropped.
function listStateFromUrl(params: URLSearchParams | ReadonlyURLSearchParams) {
  const list = (key: string) => params.get(key)?.split(',').filter(Boolean) ?? []
  return {
    page: Math.max(1, Number(params.get('page')) || 1),
    intakeGuid: params.get('intake') ?? '',
    search: params.get('q') ?? '',
    colFilters: { programGuid: list('prog'), semCode: list('sem'), batchGuid: list('batch') } as ColumnFilterState,
  }
}

function listStateToQuery(page: number, intakeGuid: string, search: string, colFilters: ColumnFilterState) {
  const params = new URLSearchParams()
  if (page > 1) params.set('page', String(page))
  if (intakeGuid) params.set('intake', intakeGuid)
  if (search.trim()) params.set('q', search)
  if (colFilters.programGuid.length) params.set('prog', colFilters.programGuid.join(','))
  if (colFilters.semCode.length) params.set('sem', colFilters.semCode.join(','))
  if (colFilters.batchGuid.length) params.set('batch', colFilters.batchGuid.join(','))
  return params.toString()
}

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
  // Page, search and column filters live in the URL (?page=&q=&prog=&sem=
  // &batch=) so opening a student's profile and coming back — browser Back
  // or Profile's own "Back to Student Master" — lands on the same page and
  // filters instead of resetting to page 1.
  const [search, setSearch] = useState(() => listStateFromUrl(searchParams).search)
  const [page, setPage] = useState(() => listStateFromUrl(searchParams).page)
  const [colFilters, setColFilters] = useState<ColumnFilterState>(() => listStateFromUrl(searchParams).colFilters)
  const [intakeGuid, setIntakeGuid] = useState(() => listStateFromUrl(searchParams).intakeGuid)
  // State → URL. window.history.replaceState (not router.replace) so the URL
  // updates synchronously — Next.js keeps useSearchParams in step with it,
  // and the URL → state effect below never sees a stale, half-applied write
  // (e.g. mid-typing in the search box). Also drops refugeeFor/sponsorFor/
  // studentName once read above, so a refresh doesn't reopen their modal.
  const stateQs = listStateToQuery(page, intakeGuid, search, colFilters)
  useEffect(() => {
    if (window.location.search.replace(/^\?/, '') === stateQs) return
    window.history.replaceState(null, '', stateQs ? `/student/student-master?${stateQs}` : '/student/student-master')
  }, [stateQs])
  // URL → state, for navigations from outside this page's own controls —
  // e.g. clicking Student Master in the sidebar while already here swaps
  // the URL to the bare route without remounting the page, which must reset
  // the table to page 1 / no filters rather than leave it where it was.
  const urlQs = searchParams.toString()
  useEffect(() => {
    const fromUrl = listStateFromUrl(searchParams)
    if (listStateToQuery(fromUrl.page, fromUrl.intakeGuid, fromUrl.search, fromUrl.colFilters) === stateQs) return
    setPage(fromUrl.page); setIntakeGuid(fromUrl.intakeGuid); setSearch(fromUrl.search); setColFilters(fromUrl.colFilters)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlQs])
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
  function handleView(studentGuid: string) { router.push('/student/profile?studentGuid=' + studentGuid + '&from=student-master') }
  function handleLearningMode(studentGuid: string, studentName: string) { setSelectedStudentGuid(studentGuid); setSelectedStudentName(studentName); openModal('learning-mode-modal') }
  function handleRefugee(studentGuid: string, studentName: string) { setSelectedStudentGuid(studentGuid); setSelectedStudentName(studentName); openModal('refugee-status-modal') }
  function handleSponsor(studentGuid: string, studentName: string) { setSelectedStudentGuid(studentGuid); setSelectedStudentName(studentName); openModal('sponsor-modal') }
  function updateSearch(value?: string) { setSearch(value ?? ''); setPage(1) }
  function updateIntake(guid: string) { setIntakeGuid(guid); setPage(1) }
  // Closes whichever column popover is open — every call site here is a
  // committed choice (OK or Reset inside GuidColumnFilter), same as
  // FilterTh's own onSelect/onClear handlers closing the filter themselves.
  function updateColFilters(patch: Partial<ColumnFilterState>) { setColFilters(prev => ({ ...prev, ...patch })); setPage(1); setOpenColFilter(null) }
  function clearColFilters() { setColFilters(EMPTY_COLUMN_FILTERS); setPage(1); setOpenColFilter(null) }

  const { data: programs = [] } = useProgramMasters()
  const { data: allBatchesData } = useBatches(1, 1000)
  const batches = allBatchesData?.items ?? []
  // Semester options come from GET /academic/semesters/filter/by-semcode —
  // one option per semCode ("Year One - Semester One", …), usable without a
  // Programme picked. A picked code goes to /students/filter as semCode, so
  // one request covers every programme's semester with that code.
  const { groups: semCodeGroups } = useSemesterCodeGroups()

  // Intake dropdown's trigger label — the dropdown itself (IntakeSearchPicker)
  // pages through the intake list server-side, so the picked intake's label
  // is resolved by guid, which also covers a guid restored from the URL.
  const intakeByGuid = useIntakesByGuids(intakeGuid ? [intakeGuid] : [])
  const selectedIntake = intakeGuid ? intakeByGuid.get(intakeGuid) : undefined
  const selectedIntakeLabel = selectedIntake ? `${selectedIntake.intakeCode} — ${selectedIntake.description}` : intakeGuid ? 'Loading…' : null

  // Intake counts here too: the search dropdown's quick-jump matches below
  // aren't intake-filtered either.
  const hasColFilters = !!intakeGuid || colFilters.programGuid.length > 0 || colFilters.semCode.length > 0 || colFilters.batchGuid.length > 0

  // get-students-filter.md's programGuid/semCode/batchGuid each take
  // exactly one value — a multi-select column here (checking 2+ boxes) has
  // no single request that can express it. combos is every (programGuid ×
  // semCode × batchGuid) combination actually selected; it collapses
  // to exactly one entry — real server pagination via useStudentsFilter
  // below — whenever each dimension has at most one value picked (the
  // common case, including "no filters at all"). More than one combination
  // switches to useStudentsFilterMulti, which fetches each combination in
  // full and merges/paginates client-side — see that hook's own comment in
  // useStudents.ts for why.
  const normalizedSearch = (search || '').trim()
  const combos = getStudentsFilterCombinations(colFilters, normalizedSearch || undefined, intakeGuid || undefined)
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
            <div className="flex gap-2" style={{ alignItems: 'center', flexWrap: 'wrap' }}>
              <IntakeSearchPicker
                className="w-56"
                placeholder="All intakes"
                selectedLabel={selectedIntakeLabel}
                onSelect={i => updateIntake(i.intakeGuid)}
                onClear={() => updateIntake('')}
              />
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
                    onSelect={vals => updateColFilters({ programGuid: vals })}
                    onClear={() => updateColFilters({ programGuid: [] })}
                    onClose={() => setOpenColFilter(null)}
                  />
                  <GuidColumnFilter
                    label="Semester"
                    options={semCodeGroups.map(g => ({ value: g.semCode, label: g.semName }))}
                    isOpen={openColFilter === 'semCode'}
                    activeFilter={colFilters.semCode}
                    onToggle={e => { e.stopPropagation(); setOpenColFilter(v => v === 'semCode' ? null : 'semCode') }}
                    onSelect={vals => updateColFilters({ semCode: vals })}
                    onClear={() => updateColFilters({ semCode: [] })}
                    onClose={() => setOpenColFilter(null)}
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
                    ? <EmptyState colSpan={6} hasFilters={!!normalizedSearch || hasColFilters} onClearFilters={() => { setSearch(''); setIntakeGuid(''); clearColFilters() }} />
                    : null}
                {/* Rows only once everything's in — a multi-combo fetch
                    (e.g. a Semester pick fanning out per programme) would
                    otherwise show partial, still-reshuffling results under
                    the loader. */}
                {!isLoading && items.map(r => (
                  <tr key={r.studentGuid}>
                    <td>
                      <ActionMenu>
                        <button className="btn btn-neu btn-sm" onClick={() => handleView(r.studentGuid)}><i className="lni lni-eye"></i> View</button>
                        {permissions.edit && <button className="btn btn-neu btn-sm" onClick={() => handleLearningMode(r.studentGuid, r.studentName)}><i className="lni lni-book"></i> Learning Mode</button>}
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
      <StudentLearningModeModal isOpen={openModals.has('learning-mode-modal')} onClose={() => closeModal('learning-mode-modal')} showToast={showToast} studentGuid={selectedStudentGuid} studentName={selectedStudentName} />
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
