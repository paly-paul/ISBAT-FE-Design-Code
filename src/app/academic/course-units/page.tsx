'use client'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ScrollTable } from '@/components/ScrollTable'
import { ActionMenu } from '@/components/ActionMenu'
import { TableSearch } from '@/components/TableSearch'
import { SearchSelect } from '@/components/SearchSelect'
import { CourseUnitModal } from '@/components/modals/academic/CourseUnitModal'
import { EditCourseUnitModal } from '@/components/modals/academic/EditCourseUnitModal'
import { ElectiveSelectModal } from '@/components/modals/academic/ElectiveSelectModal'
import { Toast } from '@/components/Toast'
// import { FilterTh } from '@/components/FilterTh' — unused now that no column has a real filterable categorical field (see fth() below)
import { EmptyState } from '@/components/EmptyState'
import { TableLoadingState } from '@/components/TableLoadingState'
import { Pagination } from '@/components/Pagination'
import { useCourseUnits, useAllCourseUnits, useCreateCourseUnit, useUpdateCourseUnit, useDeleteCourseUnit, CourseUnit } from '@/hooks/academic/useCourseUnits'
import { useProgramMasters } from '@/hooks/academic/useProgramMaster'
import { useProgramCourseUnits } from '@/hooks/academic/useProgramCourseUnits'
import { getCourseUnitById } from '@/lib/api/academic/courseUnit'
import { openDocumentForViewing, downloadDocument } from '@/lib/documentViewer'
import { usePagePermissions } from '@/hooks/users/usePagePermissions'

const PAGE_SIZE = 10

export default function Page() {
  const router = useRouter()
  const permissions = usePagePermissions()
  const [openModals, setOpenModals] = useState<Set<string>>(new Set())
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)
  const [filters, setFilters] = useState<Record<string, string[]>>({})
  // The filter state is kept for future table filtering, but the current view does not need it yet.
  const [search, setSearch] = useState('')
  const [programFilter, setProgramFilter] = useState('')
  const [page, setPage] = useState(1)
  const [editingCourseUnitGuid, setEditingCourseUnitGuid] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<CourseUnit | null>(null)

  function nav(id: string) { router.push('/academic/' + id) }
  function openModal(id: string) { setOpenModals(prev => new Set(prev).add(id)) }
  function closeModal(id: string) { setOpenModals(prev => { const s = new Set(prev); s.delete(id); return s }) }
  function showToast(msg: string, type = '') { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }

  function openEditModal(guid: string) {
    setEditingCourseUnitGuid(guid)
    openModal('cu-edit-modal')
  }

  const [syllabusLoadingGuid, setSyllabusLoadingGuid] = useState<string | null>(null)

  // `syllabus` is a presigned S3 URL good for only 5 minutes (X-Amz-Expires=300
  // on a real response) — the table row's own copy comes from useCourseUnits,
  // which is cached with staleTime: Infinity for the rest of the session, so
  // it goes stale (S3 "Request has expired") within minutes of the page
  // loading. Fetch a genuinely fresh copy of just this one record — bypassing
  // the cached hook entirely — right at click time instead of trusting
  // whatever's already loaded, so the URL used is always brand new.
  async function handleSyllabus(guid: string, mode: 'view' | 'download') {
    setSyllabusLoadingGuid(guid)
    try {
      const fresh = await getCourseUnitById(guid)
      if (!fresh.syllabus) { showToast('Syllabus is no longer attached to this unit', 'error'); return }
      if (mode === 'view') await openDocumentForViewing(fresh.syllabus)
      else downloadDocument(fresh.syllabus)
    } catch {
      showToast('Failed to load the syllabus document. Please try again.', 'error')
    } finally {
      setSyllabusLoadingGuid(null)
    }
  }

  function confirmDeleteCourseUnit() {
    if (!deleteTarget) return
    deleteCourseUnit.mutate(deleteTarget.courseUnitGuid, {
      onSuccess: () => { setDeleteTarget(null); showToast('Course unit deleted successfully') },
      onError: (error: Error) => showToast(error.message || 'Failed to delete course unit', 'error'),
    })
  }

  // Filter popover close handling is kept for future use.
  // useEffect(() => {
  //   function closeFilter(e: MouseEvent) {
  //     const target = e.target as HTMLElement
  //     if (!target.closest('th')) setOpenFilter(null)
  //   }
  //   document.addEventListener('click', closeFilter)
  //   return () => document.removeEventListener('click', closeFilter)
  // }, [])

  // Legacy rows are kept here as a reference to the earlier mock layout.
  // const rows = [
  //   { code: 'IT101',      name: 'Introduction to Programming',                    programme: 'BSc. IT', sem: 'Sem 1', credits: 3, unitType: 'Theory',    category: 'Core',                  hasCW: 'Yes', hasCBT: 'Yes', proration: 'CW25→15 / CBT50→15 / UE100→70',             syllabus: 'Attached', syllabusOk: true,  rowClass: '', variant: 'edit' },
  //   { code: 'IT102',      name: 'Computer Organisation',                          programme: 'BSc. IT', sem: 'Sem 1', credits: 3, unitType: 'Theory',    category: 'Core',                  hasCW: 'Yes', hasCBT: 'No',  proration: 'CW25→15 / UE100→70',                        syllabus: 'Attached', syllabusOk: true,  rowClass: '', variant: 'edit' },
  //   { code: 'IT104',      name: 'Programming Lab',                                programme: 'BSc. IT', sem: 'Sem 1', credits: 2, unitType: 'Practical', category: 'Core',                  hasCW: 'Yes', hasCBT: 'No',  proration: 'CW25→15 / Practical UE',                     syllabus: 'Attached', syllabusOk: true,  rowClass: '', variant: 'edit' },
  //   { code: 'IT105',      name: 'Systems & Lab (Combined)',                       programme: 'BSc. IT', sem: 'Sem 2', credits: 4, unitType: 'Combined',  category: 'Core',                  hasCW: 'Yes', hasCBT: 'Yes', proration: 'Theory IA + Practical UE (no Practical IA)', syllabus: 'Attached', syllabusOk: true,  rowClass: '', variant: 'edit' },
  //   { code: 'MBA501',     name: 'MBA Internship Project',                         programme: 'MBA',     sem: 'Sem 4', credits: 6, unitType: 'Project',   category: 'Core',                  hasCW: 'No',  hasCBT: 'No',  proration: 'Evaluated after 2 months',                   syllabus: 'Attached', syllabusOk: true,  rowClass: '', variant: 'edit' },
  //   { code: 'MBA301-FIN', name: 'Financial Risk Management',                      programme: 'MBA',     sem: 'Sem 3', credits: 3, unitType: 'Theory',    category: 'Specialization',        hasCW: 'Yes', hasCBT: 'Yes', proration: 'CW25→15 / CBT50→15 / UE100→70',             syllabus: 'Attached', syllabusOk: true,  rowClass: '', variant: 'edit' },
  //   { code: 'IT-ELEC-1',  name: 'Elective: Remote Sensing / Renewable Energy / Radar Nav.', programme: 'BSc. IT', sem: 'Sem 5', credits: 3, unitType: 'Theory', category: 'Elective (batch-level)', hasCW: 'Yes', hasCBT: 'Yes', proration: 'CW25→15 / CBT50→15 / UE100→70', syllabus: 'Pending Selection', syllabusOk: false, rowClass: '', variant: 'elective' },
  //   { code: 'BBA301',     name: 'Strategic Management',                           programme: 'BBA',     sem: 'Sem 3', credits: 4, unitType: 'Theory',    category: 'Core',                  hasCW: 'Yes', hasCBT: 'Yes', proration: 'CW25→15 / CBT50→15 / UE100→70',             syllabus: 'Missing',  syllabusOk: false, rowClass: 'flagged', variant: 'syllabus' },
  //   { code: 'IT103',      name: 'Engineering Maths I',                            programme: 'BSc. IT', sem: 'Sem 1', credits: 3, unitType: 'Theory',    category: 'Core',                  hasCW: 'No',  hasCBT: 'No',  proration: 'UE100→100',                                  syllabus: 'Attached', syllabusOk: true,  rowClass: '', variant: 'edit' },
  // ]

  // Real server-side pagination — fetches PAGE_SIZE (10) rows at a time
  // instead of the whole table up front, refetching the next 10 only when
  // the user actually pages forward. Was previously a single pageSize=1000
  // useCourseUnits() call backing a client-side usePagination() slice, which
  // made the initial load wait on the entire table before showing anything.
  const { data, isLoading } = useCourseUnits(page, PAGE_SIZE)

  // "All Programmes" dropdown — there's no programGuid filter on the
  // course-units endpoint itself (CourseUnit carries no programme field at
  // all), so a picked programme is resolved via program-course-units.ts's
  // GET /program-course-units/{programGuid} instead — the same endpoint
  // ProgrammeModal's Curriculum view uses — which lists exactly which
  // course-unit guids are actually assigned to that programme. Mock mode
  // always returns [] here (see programCourseUnits.ts), so the filter has
  // no matches to show under NEXT_PUBLIC_AUTH_MOCK=true.
  const { data: programs = [] } = useProgramMasters()
  const { data: programCourseUnits = [], isLoading: isProgramCourseUnitsLoading } = useProgramCourseUnits(programFilter || null, !!programFilter)
  const programCourseUnitGuids = useMemo(() => new Set(programCourseUnits.map(u => u.courseUnitGuid)), [programCourseUnits])

  // Filtering by search term or by programme both need the whole table in
  // memory (a programme's matches, or a search match, can land on any server
  // page) — same "switch to the full list" trick used for search alone
  // before the programme filter was added.
  const usingFullList = !!search.trim() || !!programFilter

  // Fetched eagerly on mount (no `enabled` gate), not lazily on first search
  // like before — this used to only start once `usingFullList` went true,
  // meaning the very first keystroke into the search box always paid for a
  // real network round trip live, which is what made typing feel slow
  // compared to programme-master (whose useProgramMasters() has no such gate
  // and is already warm in cache by the time anyone types). This doesn't
  // reintroduce the slow-initial-load problem useCourseUnits(page, PAGE_SIZE)
  // was built to avoid — the visible table still renders off that separate,
  // fast paginated query; this one just warms quietly in the background so
  // it's normally already cached (staleTime/gcTime: Infinity) by the time
  // usingFullList flips true and the table actually switches to reading it.
  const { data: allCourseUnits = [], isLoading: isAllCourseUnitsLoading } = useAllCourseUnits()
  const rows = data?.items ?? []
  const searchRows = usingFullList ? allCourseUnits : rows
  const createCourseUnit = useCreateCourseUnit()
  const updateCourseUnit = useUpdateCourseUnit()
  const deleteCourseUnit = useDeleteCourseUnit()
  const loading = isLoading || (usingFullList && isAllCourseUnitsLoading) || (!!programFilter && isProgramCourseUnitsLoading)

  // Reset back to page 1 whenever a search term or programme filter is
  // (de)activated — the previous page offset almost never lands on a valid
  // page of the newly-filtered result set.
  useEffect(() => {
    if (usingFullList && page !== 1) setPage(1)
  }, [usingFullList, page])

  const filteredRows = searchRows.filter(r =>
    Object.entries(filters).every(([k, v]) => !v.length || v.includes(String((r as unknown as Record<string, unknown>)[k])))
    && (!search.trim() || `${r.courseUnitCode} ${r.courseUnitName}`.toLowerCase().includes(search.trim().toLowerCase()))
    && (!programFilter || programCourseUnitGuids.has(r.courseUnitGuid))
  )

  // Only re-slice by page offset while working off the full list —
  // allCourseUnits (searchRows' source in that case) is unpaginated.
  // Outside of that, filteredRows is already just this page's 10 rows
  // straight from the server (useCourseUnits(page, PAGE_SIZE)); re-slicing
  // it by `(page - 1) * PAGE_SIZE` was double-paginating an array that only
  // ever has PAGE_SIZE items in it — correct by coincidence on page 1
  // (.slice(0, 10)), but .slice(10, 20) on a 10-item array is always empty,
  // which is why every page past the first showed a blank table.
  const pageItems = usingFullList ? filteredRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE) : filteredRows

  // totalCount must reflect the actually-matched rows, not the whole table,
  // once a search/programme filter narrows searchRows down via filteredRows
  // — otherwise Pagination renders phantom pages past the real matches.
  const totalCount = usingFullList ? filteredRows.length : data?.totalCount ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  const searchMatches = search.trim()
    ? searchRows.filter(r => `${r.courseUnitCode} ${r.courseUnitName}`.toLowerCase().includes(search.trim().toLowerCase())).slice(0, 8)
    : []

  // Column filter-popover helper — unused now that no column has a real
  // filterable categorical field (see the commented-out fth() calls in the
  // table header below).
  // function fth(label: string, col: string, opts: string[]) {
  //   return (
  //     <FilterTh
  //       label={label}
  //       opts={opts}
  //       isOpen={openFilter === col}
  //       activeFilter={filters[col] ?? []}
  //       onToggle={(e) => { e.stopPropagation(); setOpenFilter(p => p === col ? null : col) }}
  //       onSelect={(vals) => { setFilters(f => ({ ...f, [col]: vals })); setOpenFilter(null) }}
  //       onClear={() => { setFilters(f => ({ ...f, [col]: [] })); setOpenFilter(null) }}
  //       onClose={() => setOpenFilter(null)}
  //     />
  //   )
  // }

  // Flag badges for mid/cw/ca — these are 0/1 numeric flags on the real
  // response (same convention as isClose/defaultCountry elsewhere), not the
  // old mock's Yes/No strings.
  function flagBadge(val: number) {
    return val
      ? <span className="badge badge-green"><i className="lni lni-checkmark"></i></span>
      : <span className="badge badge-red"><i className="lni lni-close"></i></span>
  }

  // Legacy badge helpers are kept for the older mock data shape.
  // function cwBadge(val: string, isPractical?: boolean) {
  //   if (val === 'Yes') return <span className="badge badge-green"><i className="lni lni-checkmark"></i></span>
  //   if (isPractical) return <span className="badge badge-red"><i className="lni lni-close"></i> (Practical — no CBT)</span>
  //   return <span className="badge badge-red"><i className="lni lni-close"></i></span>
  // }
  //
  // function cbtBadge(r: typeof rows[0]) {
  //   if (r.hasCBT === 'Yes' && r.unitType === 'Combined') return <span className="badge badge-green"><i className="lni lni-checkmark"></i> (Theory only)</span>
  //   if (r.hasCBT === 'Yes') return <span className="badge badge-green"><i className="lni lni-checkmark"></i></span>
  //   if (r.unitType === 'Practical') return <span className="badge badge-red"><i className="lni lni-close"></i> (Practical — no CBT)</span>
  //   return <span className="badge badge-red"><i className="lni lni-close"></i></span>
  // }
  //
  // function typeBadge(t: string) {
  //   if (t === 'Theory') return <span className="badge badge-blue">Theory</span>
  //   if (t === 'Practical') return <span className="badge badge-green">Practical</span>
  //   if (t === 'Combined') return <span className="badge badge-amber">Combined</span>
  //   return <span className="badge badge-purple">Project</span>
  // }
  //
  // function catBadge(c: string) {
  //   if (c === 'Specialization') return <span className="badge badge-cyan">Specialization</span>
  //   if (c === 'Elective (batch-level)') return <span className="badge badge-amber">Elective (batch-level)</span>
  //   return <span className="badge badge-grey">Core</span>
  // }

  return (
    <>
      <div className="page active">
        <div className="pg-hdr">
          <div><div className="pg-title">Course Units Master (Curriculum)</div><div className="pg-sub">Define subjects per semester · Set Unit Type and Category · Attach approved syllabus · Configure assessment components</div></div>
          <div className="flex items-center gap-3">
            <TableSearch
              className="w-56"
              placeholder="Search by code or name…"
              value={search}
              onChange={setSearch}
              results={searchMatches.map(r => ({ id: r.courseUnitGuid, primary: r.courseUnitCode, secondary: r.courseUnitName }))}
              // The full-list fetch (useAllCourseUnits) only starts once a
              // search term is typed, so it's still in flight the instant a
              // user types their first character — without this, the
              // dropdown read "No matches" for however long that request
              // takes, which looked like the search was broken rather than
              // still loading.
              loading={isAllCourseUnitsLoading}
            />
            {permissions.add && <button className="btn btn-primary" onClick={() => openModal('cu-new-modal')}><i className="lni lni-plus"></i> Add Course Unit</button>}
          </div>
        </div>
        {/* <div className="g2 mb-[14px]">
          <div className="info-box"><i className="lni lni-clipboard"></i> Assessment proration: <strong>CW 25→15 · CBT 50→15 · UE 100→70.</strong> Total credits across all semesters must meet the programme&apos;s <strong>minimum credit load</strong> (e.g. 132 for BBA). All units must align with approved syllabus from <strong>NCHE or UVTOP</strong>.</div>
          <div className="info-box"><i className="lni lni-target"></i> <strong>Unit Type</strong> controls assessment: Theory (IA+UA) · Practical (CW only, no CBT) · Combined (Theory IA + Practical exam, no Practical IA) · Project (student-led, evaluated after set timeframe). <strong>Unit Category</strong>: Core (all students) · Specialization (specific specialization students) · Elective (one paper selected per batch for the session).</div>
        </div> */}
        <div className="card mb-[14px]">
          <div className="card-hdr"><div className="card-title"><span className="ctitle-icon"><i className="lni lni-key"></i></span> Unit Type → Assessment Component Rules</div></div>
          <div className="g4">
            <div className="p-3 bg-b50 border-b100 rounded-[var(--rsm)]" style={{ border: '1.5px solid' }}><div className="font-bold text-b700 mb-[6px]" style={{ fontSize: 'var(--fs-xs)' }}><i className="lni lni-book"></i> THEORY</div><div style={{ fontSize: 'var(--fs-sm)', color: 'var(--g700)' }}>Internal Assessment: <strong>CW + CBT</strong></div><div style={{ fontSize: 'var(--fs-sm)', color: 'var(--g700)' }}>University Assessment: <strong>UE Paper</strong></div></div>
            <div className="p-3 bg-[var(--green-bg)] rounded-[var(--rsm)]" style={{ border: '1.5px solid var(--green-bd)' }}><div className="font-bold text-clr-green mb-[6px]" style={{ fontSize: 'var(--fs-xs)' }}><i className="lni lni-microscope"></i> PRACTICAL</div><div style={{ fontSize: 'var(--fs-sm)', color: 'var(--g700)' }}>Internal Assessment: <strong>CW only</strong> (no CBT)</div><div style={{ fontSize: 'var(--fs-sm)', color: 'var(--g700)' }}>University Assessment: <strong>Practical Exam</strong></div></div>
            <div className="p-3 bg-[var(--amber-bg)] rounded-[var(--rsm)]" style={{ border: '1.5px solid var(--amber-bd)' }}><div className="font-bold text-clr-amber mb-[6px]" style={{ fontSize: 'var(--fs-xs)' }}><i className="lni lni-bulb"></i> COMBINED</div><div style={{ fontSize: 'var(--fs-sm)', color: 'var(--g700)' }}>Theory IA: <strong>CW + CBT</strong></div><div style={{ fontSize: 'var(--fs-sm)', color: 'var(--g700)' }}>Practical: <strong>No IA</strong>, separate exam only</div></div>
            <div className="p-3 bg-[var(--purple-bg)] rounded-[var(--rsm)]" style={{ border: '1.5px solid var(--purple-bd)' }}><div className="font-bold mb-[6px]" style={{ fontSize: 'var(--fs-xs)', color: 'var(--purple)' }}><i className="lni lni-rocket"></i> PROJECT</div><div style={{ fontSize: 'var(--fs-sm)', color: 'var(--g700)' }}>Student-led work (internship / project)</div><div style={{ fontSize: 'var(--fs-sm)', color: 'var(--g700)' }}>Evaluated after set timeframe (e.g. 2 months)</div></div>
          </div>
        </div>
        <div className="card">
          <div className="card-hdr">
            <div className="card-title"><span className="ctitle-icon"><i className="lni lni-book"></i></span> Course Unit Master</div>
            <div className="flex gap-2">
              {/* w-auto (not a fixed px width) — same convention as programme-master's
                  Level/Status filters, so the trigger grows to fit whatever label
                  (placeholder or a picked programme's full name) it's currently
                  showing instead of clipping it into a fixed-width box */}
              <SearchSelect
                className="w-auto text-[var(--fs-sm)]"
                placeholder="All Programmes"
                value={programFilter}
                onChange={setProgramFilter}
                options={programs.map(p => ({ value: p.programGuid, label: p.programName }))}
              />
              {/* Semester/Type still have no equivalent field on the real GET response, so
                  these stay decorative (uncontrolled, not wired to any filter) — only
                  swapped from a native <select> to SearchSelect for the same look/behavior
                  (and w-auto sizing) as the Programme filter above */}
              <SearchSelect
                className="w-auto text-[var(--fs-sm)]"
                placeholder="All Semesters"
                options={['Semester 1', 'Semester 2', 'Semester 3']}
              />
              <SearchSelect
                className="w-auto text-[var(--fs-sm)]"
                placeholder="All Types"
                options={['Theory', 'Practical', 'Combined', 'Project']}
              />
              <button className="btn btn-neu btn-sm"><i className="lni lni-upload"></i> Export</button>
            </div>
          </div>
          <ScrollTable filters={filters} onResetFilters={() => setFilters({})}>
            <table>
              <thead>
                <tr>
                  <th style={{ width: 48 }}></th>
                  <th>Code</th>
                  <th>Unit Name</th>
                  {/* Programme/Sem filter columns — no equivalent field on the real GET response yet.
                  {fth('Programme', 'programme', ['BSc. IT', 'BBA', 'MBA'])}
                  {fth('Sem', 'sem', ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5'])}
                  */}
                  <th>Credits</th>
                  <th>Chapters</th>
                  {/* Unit Type/Category filter columns — no equivalent field on the real GET response yet.
                  {fth('Unit Type', 'unitType', ['Theory', 'Practical', 'Combined', 'Project'])}
                  {fth('Category', 'category', ['Core', 'Specialization', 'Elective (batch-level)'])}
                  */}
                  <th>Mid</th>
                  <th>CW</th>
                  <th>CA</th>
                  {/* Old Has CBT / Proration columns — no equivalent field on the real GET response yet.
                  {fth('Has CBT', 'hasCBT', ['Yes', 'No'])}
                  <th>Proration</th>
                  */}
                  <th>Syllabus</th>
                </tr>
              </thead>
              <tbody>
                {loading
                  ? <TableLoadingState colSpan={999} />
                  : pageItems.length === 0
                    ? <EmptyState colSpan={999} hasFilters={Object.values(filters).some(v => v.length > 0) || !!programFilter} onClearFilters={() => { setFilters({}); setProgramFilter('') }} />
                    : null}
                {pageItems.map((r) => (
                  <tr key={r.courseUnitGuid}>
                    <td>
                      {(permissions.edit || permissions.delete) && (
                        <ActionMenu>
                          {permissions.edit && <button className="btn btn-neu btn-sm" onClick={() => openEditModal(r.courseUnitGuid)}><i className="lni lni-pencil"></i> Edit</button>}
                          {permissions.delete && <button className="btn btn-neu btn-sm" onClick={() => setDeleteTarget(r)}><i className="lni lni-trash-can"></i> Delete</button>}
                        </ActionMenu>
                      )}
                      {/* Elective/syllabus-missing action variants — drove off mock-only
                          fields (variant, syllabusOk) with no real equivalent yet.
                      {r.variant === 'elective' && (
                        <ActionMenu>
                          <button className="btn btn-neu btn-sm" onClick={() => openModal('cu-edit-modal')}><i className="lni lni-pencil"></i> Edit</button>
                          <button className="btn btn-amber btn-sm" onClick={() => openModal('elective-select-modal')}>Select Paper →</button>
                        </ActionMenu>
                      )}
                      {r.variant === 'syllabus' && (
                        <ActionMenu>
                          <button className="btn btn-neu btn-sm" onClick={() => openModal('cu-edit-modal')}><i className="lni lni-pencil"></i> Edit</button>
                          <button className="btn btn-amber btn-sm" onClick={() => openModal('cu-edit-modal')}>Upload Syllabus</button>
                        </ActionMenu>
                      )}
                      */}
                    </td>
                    <td className="font-mono text-b700" style={{ fontSize: 'var(--fs-xs)' }}>{r.courseUnitCode}</td>
                    <td><strong>{r.courseUnitName}</strong></td>
                    <td>{r.maxCredits}</td>
                    <td>{r.chapterCount}</td>
                    <td>{flagBadge(r.mid)}</td>
                    <td>{r.cw}</td>
                    <td>{r.ca}</td>
                    <td>
                      {r.syllabus
                        ? (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleSyllabus(r.courseUnitGuid, 'view')}
                              disabled={syllabusLoadingGuid === r.courseUnitGuid}
                              className="badge badge-green"
                              style={{ border: 'none', cursor: 'pointer' }}
                              title="View uploaded syllabus document"
                            >
                              <i className="lni lni-eye"></i> {syllabusLoadingGuid === r.courseUnitGuid ? 'Loading…' : 'Attached'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSyllabus(r.courseUnitGuid, 'download')}
                              disabled={syllabusLoadingGuid === r.courseUnitGuid}
                              className="btn btn-neu"
                              style={{ width: 26, height: 26, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                              title="Download syllabus document"
                            >
                              <i className="lni lni-download" style={{ fontSize: 12 }}></i>
                            </button>
                          </div>
                        )
                        : <span className="badge badge-red"><i className="lni lni-warning"></i> Missing</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollTable>
          <Pagination page={page} totalPages={totalPages} totalCount={totalCount} itemLabel="course units" onPageChange={setPage} />
        </div>
      </div>
      <CourseUnitModal     isOpen={openModals.has('cu-new-modal')}  onClose={() => closeModal('cu-new-modal')}  showToast={showToast} createCourseUnit={createCourseUnit} />
      <EditCourseUnitModal
        isOpen={openModals.has('cu-edit-modal')}
        onClose={() => closeModal('cu-edit-modal')}
        showToast={showToast}
        courseUnitGuid={editingCourseUnitGuid}
        updateCourseUnit={updateCourseUnit}
      />
      <ElectiveSelectModal isOpen={openModals.has('elective-select-modal')} onClose={() => closeModal('elective-select-modal')} showToast={showToast} />
      <Toast toast={toast} />

      {deleteTarget && (
        <div className="perm-delete-overlay" style={{ position: 'fixed', zIndex: 500 }} onClick={() => setDeleteTarget(null)}>
          <div className="perm-delete-card tab-panel-in" onClick={e => e.stopPropagation()}>
            <div className="perm-delete-icon"><i className="lni lni-trash-can"></i></div>
            <div className="perm-delete-title">Delete {deleteTarget.courseUnitCode}?</div>
            <div className="perm-delete-sub">
              This will permanently delete this course unit. This can&apos;t be undone.
            </div>
            <div className="perm-delete-actions">
              <button className="btn btn-neu" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="btn btn-danger" disabled={deleteCourseUnit.isPending} onClick={confirmDeleteCourseUnit}>
                <i className="lni lni-trash-can"></i> {deleteCourseUnit.isPending ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
