'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ScrollTable } from '@/components/ScrollTable'
import { ActionMenu } from '@/components/ActionMenu'
import { CourseUnitModal } from '@/components/modals/academic/CourseUnitModal'
import { EditCourseUnitModal } from '@/components/modals/academic/EditCourseUnitModal'
import { ElectiveSelectModal } from '@/components/modals/academic/ElectiveSelectModal'
import { Toast } from '@/components/Toast'
// import { FilterTh } from '@/components/FilterTh' — unused now that no column has a real filterable categorical field (see fth() below)
import { EmptyState } from '@/components/EmptyState'
import { TableLoadingState } from '@/components/TableLoadingState'
import { Pagination } from '@/components/Pagination'
import { usePagination } from '@/hooks/usePagination'
import { useCourseUnits, useCreateCourseUnit, useUpdateCourseUnit, useDeleteCourseUnit, CourseUnit } from '@/hooks/academic/useCourseUnits'

const PAGE_SIZE = 10

export default function Page() {
  const router = useRouter()
  const [openModals, setOpenModals] = useState<Set<string>>(new Set())
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)
  const [filters, setFilters] = useState<Record<string, string[]>>({})
  // The filter state is kept for future table filtering, but the current view does not need it yet.
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

  const { data: rows = [], isLoading } = useCourseUnits()
  const createCourseUnit = useCreateCourseUnit()
  const updateCourseUnit = useUpdateCourseUnit()
  const deleteCourseUnit = useDeleteCourseUnit()
  const filteredRows = rows.filter(r =>
    Object.entries(filters).every(([k, v]) => !v.length || v.includes(String((r as unknown as Record<string, unknown>)[k])))
  )

  const { page, setPage, totalPages, totalCount, pageItems } = usePagination(filteredRows, PAGE_SIZE)

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
          <button className="btn btn-primary" onClick={() => openModal('cu-new-modal')}><i className="lni lni-plus"></i> Add Course Unit</button>
        </div>
        <div className="g2 mb-[14px]">
          <div className="info-box"><i className="lni lni-clipboard"></i> Assessment proration: <strong>CW 25→15 · CBT 50→15 · UE 100→70.</strong> Total credits across all semesters must meet the programme&apos;s <strong>minimum credit load</strong> (e.g. 132 for BBA). All units must align with approved syllabus from <strong>NCHE or UVTOP</strong>.</div>
          <div className="info-box"><i className="lni lni-target"></i> <strong>Unit Type</strong> controls assessment: Theory (IA+UA) · Practical (CW only, no CBT) · Combined (Theory IA + Practical exam, no Practical IA) · Project (student-led, evaluated after set timeframe). <strong>Unit Category</strong>: Core (all students) · Specialization (specific specialization students) · Elective (one paper selected per batch for the session).</div>
        </div>
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
              <select className="ctrl w-auto text-[var(--fs-sm)]"><option>All Programmes</option><option>BSc. IT</option><option>BBA</option><option>BEng. Civil</option><option>MBA</option></select>
              <select className="ctrl w-auto text-[var(--fs-sm)]"><option>All Semesters</option><option>Semester 1</option><option>Semester 2</option><option>Semester 3</option></select>
              <select className="ctrl w-auto text-[var(--fs-sm)]"><option>All Types</option><option>Theory</option><option>Practical</option><option>Combined</option><option>Project</option></select>
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
                {isLoading
                  ? <TableLoadingState colSpan={999} />
                  : filteredRows.length === 0
                    ? <EmptyState colSpan={999} hasFilters={Object.values(filters).some(v => v.length > 0)} onClearFilters={() => setFilters({})} />
                    : null}
                {pageItems.map((r) => (
                  <tr key={r.courseUnitGuid}>
                    <td>
                      <ActionMenu>
                        <button className="btn btn-neu btn-sm" onClick={() => openEditModal(r.courseUnitGuid)}><i className="lni lni-pencil"></i> Edit</button>
                        <button className="btn btn-neu btn-sm" onClick={() => setDeleteTarget(r)}><i className="lni lni-trash-can"></i> Delete</button>
                      </ActionMenu>
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
                        ? <span className="badge badge-green">Attached</span>
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
