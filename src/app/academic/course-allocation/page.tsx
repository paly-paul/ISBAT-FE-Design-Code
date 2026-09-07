'use client'
import { useState } from 'react'
import { Toast } from '@/components/Toast'
import { ScrollTable } from '@/components/ScrollTable'
import { SearchSelect } from '@/components/SearchSelect'
import { EmptyState } from '@/components/EmptyState'
import { Pagination } from '@/components/Pagination'
import { CourseUnitSearchPicker, CourseUnitPickOption } from '@/components/CourseUnitSearchPicker'
import { usePagination } from '@/hooks/usePagination'
import { useIntakes } from '@/hooks/academic/useIntakes'
import { useEmployees } from '@/hooks/employee/useEmployees'

// New page — no confirmed backend endpoint exists for this yet (no
// course-allocation .md doc anywhere in the repo, unlike most other pages
// this app talks to a real API for). Built UI-first against the legacy
// ISMS "Course Allottee" screen the request was based on: pick a session/
// term/lecturer/course unit, Allocate adds a row to the list below, each
// row can be deleted. All local state for now — same "mock until a real
// endpoint is confirmed" convention as /academic/allocation and the
// timetable page's own Term dropdown (identical static Term1/Term2/Term3
// list, reused here rather than inventing a second convention for it).
const TERM_OPTIONS = ['Term1', 'Term2', 'Term3']

interface AllocationRow {
  id: number
  lecturerGuid: string
  lecturerName: string
  courseUnitGuid: string
  courseUnitCode: string
  courseUnitName: string
  term: string
  intakeGuid: string
  intakeLabel: string
}

const PAGE_SIZE = 10
let nextRowId = 1

// Seeded with a couple of example rows purely so the list below isn't
// empty on first load — same "close enough for a UI prototype" convention
// mock data uses elsewhere in this app.
const initialRows: AllocationRow[] = [
  { id: nextRowId++, lecturerGuid: 'mock-lect-1', lecturerName: 'Dr. Ssekibuule Ronald', courseUnitGuid: 'mock-cu-1', courseUnitCode: 'BIT2201', courseUnitName: 'Database Systems', term: 'Term1', intakeGuid: 'mock-intake', intakeLabel: 'Spring 2026 (20261)' },
  { id: nextRowId++, lecturerGuid: 'mock-lect-2', lecturerName: 'Ms. Namutebi Joyce', courseUnitGuid: 'mock-cu-2', courseUnitCode: 'BIT2202', courseUnitName: 'Data Structures & Algorithms', term: 'Term1', intakeGuid: 'mock-intake', intakeLabel: 'Spring 2026 (20261)' },
]

export default function CourseAllocationPage() {
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)
  function showToast(msg: string, type = '') { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }

  const { data: intakes = [] } = useIntakes()
  const intakeOptions = intakes.map(i => ({ value: i.intakeGuid, label: `${i.description} (${i.intakeCode})` }))

  const { data: employees = [] } = useEmployees()
  const lecturerOptions = employees.map(e => ({ value: e.employeeGuid, label: `${e.empName} (${e.shortCode})` }))

  const [intakeGuid, setIntakeGuid] = useState('')
  const [term, setTerm] = useState('')
  const [lecturerGuid, setLecturerGuid] = useState('')
  const [courseUnit, setCourseUnit] = useState<CourseUnitPickOption | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [rows, setRows] = useState<AllocationRow[]>(initialRows)
  const [search, setSearch] = useState('')

  const searchTrimmed = search.trim().toLowerCase()
  const filteredRows = searchTrimmed
    ? rows.filter(r => `${r.lecturerName} ${r.courseUnitCode} ${r.courseUnitName}`.toLowerCase().includes(searchTrimmed))
    : rows
  const { page, setPage, totalPages, totalCount, pageItems } = usePagination(filteredRows, PAGE_SIZE)

  function validate() {
    const e: Record<string, string> = {}
    if (!intakeGuid) e.intakeGuid = 'Academic Session is required'
    if (!term) e.term = 'Term is required'
    if (!lecturerGuid) e.lecturerGuid = 'Lecturer Name is required'
    if (!courseUnit) e.courseUnit = 'Course Unit is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleAllocate() {
    if (!validate() || !courseUnit) return
    const lecturer = employees.find(e => e.employeeGuid === lecturerGuid)
    const intake = intakes.find(i => i.intakeGuid === intakeGuid)
    if (!lecturer || !intake) return

    // Same course unit shouldn't end up allocated to the same lecturer
    // twice for the same term — silently duplicating the row would just
    // clutter the list below with no way to tell them apart.
    const isDuplicate = rows.some(r =>
      r.lecturerGuid === lecturerGuid && r.courseUnitGuid === courseUnit.value && r.term === term && r.intakeGuid === intakeGuid,
    )
    if (isDuplicate) {
      showToast('This lecturer is already allocated to this course unit for the selected term.', 'error')
      return
    }

    setRows(prev => [
      ...prev,
      {
        id: nextRowId++,
        lecturerGuid,
        lecturerName: `${lecturer.empName} (${lecturer.shortCode})`,
        courseUnitGuid: courseUnit.value,
        courseUnitCode: courseUnit.code,
        courseUnitName: courseUnit.name,
        term,
        intakeGuid,
        intakeLabel: `${intake.description} (${intake.intakeCode})`,
      },
    ])
    showToast('Course unit allocated successfully', 'success')
    // Academic Session and Term stay picked — a support staff member
    // typically allocates several lecturers/course units in a row for the
    // same session/term, so only the per-allocation fields reset. Cancel
    // below clears everything, including session/term.
    setLecturerGuid('')
    setCourseUnit(null)
    setErrors({})
  }

  function handleCancel() {
    setIntakeGuid('')
    setTerm('')
    setLecturerGuid('')
    setCourseUnit(null)
    setErrors({})
  }

  function handleDelete(id: number) {
    setRows(prev => prev.filter(r => r.id !== id))
    showToast('Allocation removed', 'success')
  }

  return (
    <div id="page-course-allocation">
      <div className="pg-hdr">
        <div>
          <div className="pg-title">Course Allocation</div>
          <div className="pg-sub">Assign a lecturer to a course unit for a session &amp; term</div>
        </div>
      </div>

      <div className="card">
        <div className="card-hdr">
          <div className="card-title"><span className="ctitle-icon"><i className="lni lni-agenda"></i></span> Allocate Lecturer</div>
        </div>
        <div className="g2">
          <div className="fg">
            <div className="lbl">Academic Session <span className="req">*</span></div>
            <SearchSelect
              placeholder="— Select Academic Session —"
              options={intakeOptions}
              value={intakeGuid}
              onChange={val => { setIntakeGuid(val); if (errors.intakeGuid) setErrors(p => ({ ...p, intakeGuid: '' })) }}
            />
            {errors.intakeGuid && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.intakeGuid}</p>}
          </div>
          <div className="fg">
            <div className="lbl">Term <span className="req">*</span></div>
            <SearchSelect
              placeholder="— Select Term —"
              options={TERM_OPTIONS}
              value={term}
              onChange={val => { setTerm(val); if (errors.term) setErrors(p => ({ ...p, term: '' })) }}
            />
            {errors.term && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.term}</p>}
          </div>
          <div className="fg">
            <div className="lbl">Lecturer Name <span className="req">*</span></div>
            <SearchSelect
              placeholder="— Select Lecturer —"
              options={lecturerOptions}
              value={lecturerGuid}
              onChange={val => { setLecturerGuid(val); if (errors.lecturerGuid) setErrors(p => ({ ...p, lecturerGuid: '' })) }}
            />
            {errors.lecturerGuid && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.lecturerGuid}</p>}
          </div>
          <div className="fg">
            <div className="lbl">Course Unit <span className="req">*</span></div>
            {/* CourseUnitSearchPicker is a fire-and-forget search box (built
                for ProgrammeModal's "pick, add immediately" flow) — it
                clears its own text back to empty right after onSelect, so
                there's nothing in the field itself to show what's currently
                held for this form. A small chip underneath (clearable) is
                the selection state instead; the picker itself is always
                available to change the pick before hitting Allocate. */}
            <CourseUnitSearchPicker
              placeholder="Search course units…"
              onSelect={opt => { setCourseUnit(opt); if (errors.courseUnit) setErrors(p => ({ ...p, courseUnit: '' })) }}
            />
            {courseUnit && (
              <div className="flex items-center gap-2 mt-2">
                <span className="badge badge-blue">
                  <span className="font-mono">{courseUnit.code}</span> — {courseUnit.name}
                </span>
                <button
                  type="button"
                  className="btn btn-neu btn-sm"
                  style={{ width: 24, height: 24, padding: 0 }}
                  onClick={() => setCourseUnit(null)}
                  title="Clear selection"
                >
                  <i className="lni lni-close" style={{ fontSize: 10 }}></i>
                </button>
              </div>
            )}
            {errors.courseUnit && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.courseUnit}</p>}
          </div>
        </div>
        <div className="flex gap-[10px] justify-end mt-2">
          <button className="btn btn-neu" onClick={handleCancel}><i className="lni lni-close"></i> Cancel</button>
          <button className="btn btn-primary" onClick={handleAllocate}><i className="lni lni-checkmark"></i> Allocate</button>
        </div>
      </div>

      <div className="card">
        <div className="card-hdr">
          <div className="card-title"><span className="ctitle-icon"><i className="lni lni-graduation"></i></span> Allocated List</div>
          <div className="inp-wrap" style={{ maxWidth: 260, width: '100%' }}>
            <span className="inp-icon"><i className="lni lni-search-alt"></i></span>
            <input className="ctrl" placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        <ScrollTable>
          <table>
            <thead>
              <tr>
                <th>Lecturer</th>
                <th>Course Unit</th>
                <th>Term</th>
                <th style={{ width: 60 }}></th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.length === 0 && (
                <EmptyState colSpan={999} hasFilters={!!search.trim()} onClearFilters={() => setSearch('')} />
              )}
              {pageItems.map(r => (
                <tr key={r.id}>
                  <td className="font-medium text-g800">{r.lecturerName}</td>
                  <td>
                    <span className="font-mono text-xs text-b700">{r.courseUnitCode}</span> — {r.courseUnitName}
                  </td>
                  <td><span className="badge badge-blue">{r.term}</span></td>
                  <td>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(r.id)} title="Remove allocation">
                      <i className="lni lni-trash-can"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollTable>
        <Pagination page={page} totalPages={totalPages} totalCount={totalCount} itemLabel="allocations" onPageChange={setPage} />
      </div>

      <Toast toast={toast} />
    </div>
  )
}
