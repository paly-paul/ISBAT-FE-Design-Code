'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Toast } from '@/components/Toast'
import { SuccessPopup } from '@/components/modals/shared/SuccessPopup'
import { ScrollTable } from '@/components/ScrollTable'
import { ActionMenu } from '@/components/ActionMenu'
import { SearchSelect } from '@/components/SearchSelect'
import { MultiSelect } from '@/components/MultiSelect'
import { EmptyState } from '@/components/EmptyState'
import { TableLoadingState } from '@/components/TableLoadingState'
import { Pagination } from '@/components/Pagination'
import { CourseUnitSearchPicker, CourseUnitPickOption } from '@/components/CourseUnitSearchPicker'
import { useIntakesDropdown } from '@/hooks/academic/useIntakes'
import { useEmployeeDropdown } from '@/hooks/employee/useEmployees'
import { useFacultyDropdown } from '@/hooks/config/useFaculties'
import { useProgramPlannings, useCreateProgramPlannings, useUnallocatedCourseUnits, useUpdateProgramPlanning, useDeleteProgramPlanning } from '@/hooks/academic/useProgramPlannings'
import { PROGRAM_PLANNING_MAX_UNITS, type ProgramPlanningDto, type UnallocatedCourseUnit } from '@/lib/api/academic/programPlanning'
import { usePagePermissions } from '@/hooks/users/usePagePermissions'
import { AuthError } from '@/lib/api/client'
import { scrollToFirstError } from '@/lib/scrollToFirstError'

// Confirmed via allocation/*.md — real endpoints now (was UI-only mock
// against the legacy ISMS "Course Allottee" screen this page was first
// built from). Term has no real master list of its own on the backend
// (ProgramPlanningDto.term is just a plain int|null), so the same static
// 1/2/3 options the Timetable page's own Term dropdown already uses are
// reused here rather than inventing a second convention for it.
// value 3 relabeled "Both" per request, 2026-09-08 — represents Term 1 AND
// Term 2 together, not a literal third term.
const TERM_OPTIONS = [
  { value: '1', label: 'Term 1' },
  { value: '2', label: 'Term 2' },
  { value: '3', label: 'Both' },
]

const PAGE_SIZE = 10

// One course unit in the Allocate form, with its own term and load.
interface PickedUnit { value: string; code: string; name: string; term: string; load: string }

function unitLabel(u: UnallocatedCourseUnit) {
  const label = `${u.courseUnitCode ?? '—'} — ${u.courseUnitName ?? 'Course unit'}`
  return u.courseUnitRepetitionName ? `${label} (${u.courseUnitRepetitionName})` : label
}

export default function CourseAllocationPage() {
  const permissions = usePagePermissions()
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)
  function showToast(msg: string, type = '') { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }

  const [intakeGuid, setIntakeGuid] = useState('')
  const [term, setTerm] = useState('')
  const [lecturerGuid, setLecturerGuid] = useState('')
  const [schoolGuid, setSchoolGuid] = useState('')
  // Edit changes one row, so it keeps a single unit and load.
  const [courseUnit, setCourseUnit] = useState<CourseUnitPickOption | null>(null)
  const [load, setLoad] = useState('')
  const [units, setUnits] = useState<PickedUnit[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const { data: intakeDropdownItems = [], isLoading: isIntakesLoading } = useIntakesDropdown()
  const { data: facultyDropdownItems = [], isLoading: isFacultiesLoading } = useFacultyDropdown(null)
  const { data: employeeDropdownItems = [], isLoading: isLecturersLoading } = useEmployeeDropdown()

  // While editing, the row's own session / school are kept in their lists
  // (labelled from the row) — the pickers only load options once opened.
  const [editingRow, setEditingRow] = useState<ProgramPlanningDto | null>(null)
  const intakeOptions = useMemo(() => {
    const list = intakeDropdownItems.map(i => ({ value: i.intakeGuid, label: `${i.description} (${i.intakeCode})` }))
    if (editingRow && intakeGuid === editingRow.intakeGuid && !list.some(o => o.value === intakeGuid)) {
      list.unshift({ value: editingRow.intakeGuid, label: `${editingRow.description ?? 'Session'}${editingRow.intakeCode != null ? ` (${editingRow.intakeCode})` : ''}` })
    }
    return list
  }, [intakeDropdownItems, editingRow, intakeGuid])

  const [pickedLecturer, setPickedLecturer] = useState<{ value: string; label: string } | null>(null)
  const lecturerOptions = useMemo(() => {
    const list = employeeDropdownItems.map(e => ({ value: e.employeeGuid, label: e.displayName }))
    if (pickedLecturer && pickedLecturer.value === lecturerGuid && !list.some(o => o.value === lecturerGuid)) {
      list.unshift(pickedLecturer)
    }
    if (editingRow && lecturerGuid === editingRow.lecturerGuid && !list.some(o => o.value === lecturerGuid)) {
      list.unshift({ value: editingRow.lecturerGuid, label: editingRow.employeeName || 'Lecturer' })
    }
    return list
  }, [employeeDropdownItems, pickedLecturer, lecturerGuid, editingRow])

  const facultyOptions = useMemo(() => {
    const list = facultyDropdownItems.map(f => ({
      value: f.facultyGuid,
      label: f.facultyCode ? `${f.facultyCode} — ${f.facultyName}` : f.facultyName,
    }))
    if (editingRow && schoolGuid === editingRow.schoolGuid && !list.some(o => o.value === schoolGuid)) {
      list.unshift({ value: editingRow.schoolGuid, label: [editingRow.facultyCode, editingRow.facultyName].filter(Boolean).join(' — ') || 'School' })
    }
    return list
  }, [facultyDropdownItems, editingRow, schoolGuid])

  const [search, setSearch] = useState('')
  const [committedSearch, setCommittedSearch] = useState('')
  const [lecturerFilter, setLecturerFilter] = useState('')
  const [page, setPage] = useState(1)
  useEffect(() => {
    const t = setTimeout(() => setCommittedSearch(search.trim()), 300)
    return () => clearTimeout(t)
  }, [search])
  // One server page, newest intake first. The API's search doesn't cover the
  // lecturer's name, so that has its own filter.
  const { data, isLoading } = useProgramPlannings(page, PAGE_SIZE, { search: committedSearch, lecturerGuid: lecturerFilter || null })
  const rows = useMemo(() => data?.items ?? [], [data])
  const lecturerFilterOptions = useMemo(() => employeeDropdownItems.map(e => ({ value: e.employeeGuid, label: e.displayName })), [employeeDropdownItems])
  const hasListFilters = !!search.trim() || !!lecturerFilter
  const createPlanning = useCreateProgramPlannings()
  const updatePlanning = useUpdateProgramPlanning()
  const deletePlanning = useDeleteProgramPlanning()
  // Unit picker: units this lecturer doesn't have yet in this session,
  // searched and paged on the server.
  const [unitSearch, setUnitSearch] = useState('')
  const [debouncedUnitSearch, setDebouncedUnitSearch] = useState('')
  useEffect(() => {
    const t = setTimeout(() => setDebouncedUnitSearch(unitSearch.trim()), 300)
    return () => clearTimeout(t)
  }, [unitSearch])
  const unitsQuery = useUnallocatedCourseUnits(lecturerGuid, intakeGuid, debouncedUnitSearch)
  const loadedUnits = useMemo(() => unitsQuery.data?.pages.flatMap(p => p.items) ?? [], [unitsQuery.data])
  const unitOptions = useMemo(() => loadedUnits.map(u => ({ value: u.courseUnitGuid, label: unitLabel(u) })), [loadedUnits])

  function pickUnits(guids: string[]) {
    setUnits(prev => guids.flatMap(guid => {
      const kept = prev.find(u => u.value === guid)
      if (kept) return [kept]
      const found = loadedUnits.find(u => u.courseUnitGuid === guid)
      return found ? [{ value: guid, code: found.courseUnitCode ?? '—', name: found.courseUnitName ?? 'Course unit', term, load: '' }] : []
    }))
    setErrors(p => ({ ...p, courseUnit: '' }))
  }
  function setUnitField(guid: string, patch: Partial<Pick<PickedUnit, 'term' | 'load'>>) {
    setUnits(prev => prev.map(u => (u.value === guid ? { ...u, ...patch } : u)))
  }

  const [viewRow, setViewRow] = useState<ProgramPlanningDto | null>(null)
  const formRef = useRef<HTMLDivElement>(null)
  const [deleteTarget, setDeleteTarget] = useState<ProgramPlanningDto | null>(null)

  // Same "swap to SuccessPopup on save" pattern used across the rest of the
  // academic module (CourseUnitFormModal, EditIntakeModal, bulk-intake-edit,
  // etc.) rather than a toast-only confirmation for the main Allocate
  // action. Delete stays toast-only, matching how the other pages in this
  // module treat deletes vs. saves differently too.
  const [saved, setSaved] = useState<{ title: string; subtitle: string } | null>(null)

  const totalCount = data?.totalCount ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)

  // Clamp only against loaded data, so a pending fetch can't snap the
  // page back to 1 (same fix as Room Management / Batch Summary).
  useEffect(() => {
    if (data && page !== safePage) setPage(safePage)
  }, [data, page, safePage])

  useEffect(() => {
    setPage(1)
  }, [committedSearch, lecturerFilter])

  // post-program-planning.md: lecturer / school / intake and 1 to 50 units are
  // required; (lecturer, unit, intake) must be unique, which the API enforces
  // (see serverFieldError). load and term are optional ints with no API rule —
  // a 0 teaching load is meaningless, so the form requires at least 1 when one
  // is entered.
  const DUPLICATE_MESSAGE = 'This lecturer is already allocated to this course unit for this academic session.'
  const validLoad = (v: string) => !v.trim() || (Number.isInteger(+v) && +v >= 1)
  function validate() {
    const e: Record<string, string> = {}
    if (!intakeGuid) e.intakeGuid = 'Academic Session is required'
    if (!lecturerGuid) e.lecturerGuid = 'Lecturer Name is required'
    if (!schoolGuid) e.schoolGuid = 'School / Faculty is required'
    if (editingRow) {
      if (!courseUnit) e.courseUnit = 'Course Unit is required'
      if (!validLoad(load)) e.load = 'Teaching Load must be at least 1'
    } else {
      if (units.length === 0) e.courseUnit = 'Select at least one course unit'
      if (units.length > PROGRAM_PLANNING_MAX_UNITS) e.courseUnit = `Select at most ${PROGRAM_PLANNING_MAX_UNITS} course units (now ${units.length})`
      units.forEach(u => { if (!validLoad(u.load)) e[`load-${u.value}`] = 'Must be at least 1' })
    }
    setErrors(e)
    scrollToFirstError(e)
    return Object.keys(e).length === 0
  }

  // Server-side failures that belong to a field go under it (all are HTTP
  // 400 — the errorCode / message says which).
  function serverFieldError(error: Error): Record<string, string> | null {
    const code = error instanceof AuthError ? error.code : undefined
    const msg = error.message || ''
    // On Allocate the server's message names the units that clash.
    if (code === 'conflict' || /already exists for this lecturer/i.test(msg)) return { courseUnit: editingRow ? DUPLICATE_MESSAGE : msg }
    if (/unit not found/i.test(msg)) {
      if (editingRow) return { courseUnit: 'This course unit no longer exists. Pick another one.' }
      const missing = units.filter(u => msg.includes(u.value)).map(u => u.code)
      return { courseUnit: missing.length ? `These course units no longer exist: ${missing.join(', ')}. Remove them and try again.` : 'One or more course units no longer exist. Remove them and try again.' }
    }
    if (/school not found/i.test(msg)) return { schoolGuid: 'This school / faculty no longer exists. Pick another one.' }
    if (/intake not found/i.test(msg)) return { intakeGuid: 'This academic session no longer exists. Pick another one.' }
    if (code === 'validation_error') {
      if (/lecturer/i.test(msg)) return { lecturerGuid: msg }
      if (/unit/i.test(msg)) return { courseUnit: msg }
      if (/school/i.test(msg)) return { schoolGuid: msg }
      if (/intake/i.test(msg)) return { intakeGuid: msg }
    }
    return null
  }

  // Edit loads the row into the form above (same pickers as Allocate) and
  // the primary button becomes Update; Cancel edit puts it back.
  function startEdit(r: ProgramPlanningDto) {
    setEditingRow(r)
    setUnits([])
    setIntakeGuid(r.intakeGuid)
    setTerm(r.term != null ? String(r.term) : '')
    setSchoolGuid(r.schoolGuid)
    setLecturerGuid(r.lecturerGuid)
    setPickedLecturer({ value: r.lecturerGuid, label: r.employeeName ?? 'Lecturer' })
    setCourseUnit({ value: r.unitGuid, code: r.courseUnitCode ?? '', name: r.courseUnitName ?? '', credits: 0 })
    setLoad(r.load != null ? String(r.load) : '')
    setErrors({})
    formRef.current?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' })
  }

  function handleUpdate() {
    if (!editingRow || !validate() || !courseUnit) return
    const lecturerLabel = lecturerOptions.find(o => o.value === lecturerGuid)?.label ?? 'The lecturer'
    updatePlanning.mutate(
      {
        guid: editingRow.programPlanGuid,
        input: { lecturerGuid, unitGuid: courseUnit.value, load: load.trim() ? +load : null, schoolGuid, intakeGuid, term: term ? +term : null },
      },
      {
        onSuccess: () => {
          setSaved({ title: 'Allocation Updated!', subtitle: `${lecturerLabel}'s allocation to ${courseUnit.code} — ${courseUnit.name} has been saved.` })
          handleCancel()
        },
        onError: (error: Error) => {
          const fieldErr = serverFieldError(error)
          if (fieldErr) { setErrors(p => ({ ...p, ...fieldErr })); scrollToFirstError(fieldErr); return }
          showToast(error.message || 'Failed to update the allocation. Please try again.', 'error')
        },
      },
    )
  }

  function handleAllocate() {
    if (!validate()) return
    // Captured before the onSuccess reset below clears the picks — the
    // popup needs to name who/what was just allocated.
    const lecturerLabel = lecturerOptions.find(o => o.value === lecturerGuid)?.label ?? 'Lecturer'
    const unitsLabel = units.length === 1 ? `${units[0].code} — ${units[0].name}` : `${units.length} course units`
    createPlanning.mutate(
      {
        lecturerGuid,
        schoolGuid,
        intakeGuid,
        units: units.map(u => ({ unitGuid: u.value, load: u.load.trim() ? +u.load : null, term: u.term ? +u.term : null })),
      },
      {
        onSuccess: () => {
          setSaved({ title: units.length === 1 ? 'Course Unit Allocated!' : 'Course Units Allocated!', subtitle: `${lecturerLabel} has been allocated to ${unitsLabel}.` })
          // Academic Session/Term/School stay picked — a support staff
          // member typically allocates several lecturers/course units in a
          // row for the same session/term/school, so only the
          // per-allocation fields reset. Cancel below clears everything.
          setLecturerGuid('')
          setUnits([])
          setErrors({})
        },
        onError: (error: Error) => {
          const fieldErr = serverFieldError(error)
          if (fieldErr) {
            setErrors(p => ({ ...p, ...fieldErr }))
            scrollToFirstError(fieldErr)
            return
          }
          showToast(error.message || 'Failed to allocate course unit. Please try again.', 'error')
        },
      },
    )
  }

  function handleCancel() {
    setEditingRow(null)
    setIntakeGuid('')
    setTerm('')
    setLecturerGuid('')
    setSchoolGuid('')
    setCourseUnit(null)
    setLoad('')
    setUnits([])
    setErrors({})
  }

  function confirmDelete() {
    if (!deleteTarget) return
    deletePlanning.mutate(deleteTarget.programPlanGuid, {
      onSuccess: () => {
        if (editingRow?.programPlanGuid === deleteTarget.programPlanGuid) handleCancel()
        setDeleteTarget(null); showToast('Allocation removed', 'success')
      },
      onError: (error: Error) => showToast(error.message || 'Failed to remove allocation. Please try again.', 'error'),
    })
  }

  const isAllocating = createPlanning.isPending || updatePlanning.isPending

  return (
    <div id="page-course-allocation">
      <div className="pg-hdr">
        <div>
          <div className="pg-title">Course Allocation</div>
          <div className="pg-sub">Assign a lecturer to course units for a session, school &amp; term</div>
        </div>
      </div>

      <div className="card" ref={formRef} style={editingRow ? { borderColor: 'var(--b300, var(--b200))', boxShadow: '0 0 0 3px var(--b50)' } : undefined}>
        <div className="card-hdr">
          <div className="card-title">
            <span className="ctitle-icon"><i className={`lni ${editingRow ? 'lni-pencil' : 'lni-agenda'}`}></i></span>
            {editingRow ? 'Edit Allocation' : 'Allocate Lecturer'}
          </div>
          {editingRow && (
            <span className="badge badge-blue">
              Editing: {editingRow.employeeName ?? 'Lecturer'} · <span className="font-mono">{editingRow.courseUnitCode ?? ''}</span>
            </span>
          )}
        </div>
        <div className="g2">
          <div className="fg">
            <div className="lbl">Academic Session <span className="req">*</span></div>
            <SearchSelect
              placeholder="— Select Academic Session —"
              options={intakeOptions}
              value={intakeGuid}
              isLoading={isIntakesLoading}
              onChange={val => { setIntakeGuid(val); setErrors(p => ({ ...p, intakeGuid: '', courseUnit: '' })) }}
            />
            {errors.intakeGuid && <p className="field-err" style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.intakeGuid}</p>}
          </div>
          <div className="fg">
            <div className="lbl">{editingRow ? 'Term' : 'Default Term'}</div>
            <SearchSelect
              placeholder="— Select Term —"
              options={TERM_OPTIONS}
              value={term}
              onChange={setTerm}
            />
            {!editingRow && <p className="text-g400" style={{ fontSize: 12, marginTop: 4 }}>Applied to each course unit you add. Change it per unit below.</p>}
          </div>
          <div className="fg">
            <div className="lbl">School / Faculty <span className="req">*</span></div>
            <SearchSelect
              placeholder="— Select School / Faculty —"
              options={facultyOptions}
              value={schoolGuid}
              isLoading={isFacultiesLoading}
              onChange={val => { setSchoolGuid(val); if (errors.schoolGuid) setErrors(p => ({ ...p, schoolGuid: '' })) }}
            />
            {errors.schoolGuid && <p className="field-err" style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.schoolGuid}</p>}
          </div>
          <div className="fg">
            <div className="lbl">Lecturer Name <span className="req">*</span></div>
            <SearchSelect
              placeholder="— Select Lecturer —"
              options={lecturerOptions}
              value={lecturerGuid}
              isLoading={isLecturersLoading}
              onChange={val => { setPickedLecturer(lecturerOptions.find(o => o.value === val) ?? null); setLecturerGuid(val); setErrors(p => ({ ...p, lecturerGuid: '', courseUnit: '' })) }}
            />
            {errors.lecturerGuid && <p className="field-err" style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.lecturerGuid}</p>}
          </div>
          {editingRow && (
          <>
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
              <div className="mt-2">
                {/* Close icon sits inside the pill itself (a small circular
                    button, not a separate square .btn-neu beside it) so it
                    reads as one removable chip instead of two mismatched
                    shapes glued together. */}
                <span className="badge badge-blue" style={{ paddingRight: 6 }}>
                  <span className="font-mono">{courseUnit.code}</span> — {courseUnit.name}
                  <button
                    type="button"
                    onClick={() => { setCourseUnit(null); setErrors(p => ({ ...p, courseUnit: '' })) }}
                    title="Clear selection"
                    aria-label="Clear selection"
                    style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      width: 16, height: 16, borderRadius: '50%', border: 'none',
                      background: 'var(--b200)', color: 'inherit', cursor: 'pointer', padding: 0,
                    }}
                  >
                    <i className="lni lni-close" style={{ fontSize: 8 }}></i>
                  </button>
                </span>
              </div>
            )}
            {errors.courseUnit && <p className="field-err" style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.courseUnit}</p>}
          </div>
          <div className="fg">
            <div className="lbl">Teaching Load <span className="text-g400" style={{ fontWeight: 500 }}>(optional)</span></div>
            {/* Digits only — type="number" let "-", "e" and decimals through. */}
            <input
              className="ctrl"
              inputMode="numeric"
              maxLength={3}
              placeholder="e.g. 5"
              value={load}
              onChange={e => { setLoad(e.target.value.replace(/\D/g, '')); if (errors.load) setErrors(p => ({ ...p, load: '' })) }}
              style={errors.load ? { borderColor: 'var(--red)' } : undefined}
            />
            {errors.load && <p className="field-err" style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.load}</p>}
          </div>
          </>
          )}
        </div>
        {!editingRow && (
          <div className="fg">
            <div className="lbl">Course Units <span className="req">*</span> <span className="text-g400" style={{ fontWeight: 400 }}>· up to {PROGRAM_PLANNING_MAX_UNITS}</span></div>
            <MultiSelect
              placeholder={lecturerGuid && intakeGuid ? 'Search unallocated course units…' : 'Choose a session and lecturer first'}
              options={unitOptions}
              value={units.map(u => u.value)}
              onChange={pickUnits}
              onSearch={setUnitSearch}
              disabled={!lecturerGuid || !intakeGuid}
              isLoading={unitsQuery.isFetching && !unitsQuery.isFetchingNextPage}
              hasNextPage={unitsQuery.hasNextPage}
              isFetchingNextPage={unitsQuery.isFetchingNextPage}
              onLoadMore={() => unitsQuery.fetchNextPage()}
            />
            {unitsQuery.isError && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{unitsQuery.error.message || 'Couldn’t load the course units.'}</p>}
            {errors.courseUnit && <p className="field-err" style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.courseUnit}</p>}
            {units.length > 0 && (
              <div className="cau-list">
                <div className="cau-hdr" aria-hidden="true"><span>Course Unit</span><span>Term</span><span>Teaching Load</span><span></span></div>
                {units.map(u => (
                  <div className="cau-row" key={u.value}>
                    <div className="cau-name"><span className="font-mono text-xs text-b700">{u.code}</span> {u.name}</div>
                    <SearchSelect placeholder="Term" options={TERM_OPTIONS} value={u.term} onChange={v => setUnitField(u.value, { term: v })} />
                    <div>
                      {/* Digits only — type="number" let "-", "e" and decimals through. */}
                      <input
                        className="ctrl"
                        inputMode="numeric"
                        maxLength={3}
                        placeholder="Load"
                        aria-label={`Teaching load for ${u.code}`}
                        value={u.load}
                        onChange={e => { setUnitField(u.value, { load: e.target.value.replace(/\D/g, '') }); setErrors(p => ({ ...p, [`load-${u.value}`]: '' })) }}
                        style={errors[`load-${u.value}`] ? { borderColor: 'var(--red)' } : undefined}
                      />
                      {errors[`load-${u.value}`] && <p className="field-err" style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors[`load-${u.value}`]}</p>}
                    </div>
                    <button type="button" className="cau-remove" title="Remove" aria-label={`Remove ${u.code}`} onClick={() => pickUnits(units.filter(x => x.value !== u.value).map(x => x.value))}>
                      <i className="lni lni-close" aria-hidden="true"></i>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        <div className="flex gap-[10px] justify-end mt-2">
          <button className="btn btn-neu" onClick={handleCancel}><i className="lni lni-close"></i> {editingRow ? 'Cancel Edit' : 'Cancel'}</button>
          {editingRow ? (
            permissions.edit && (
              <button className="btn btn-primary" disabled={isAllocating} onClick={handleUpdate}>
                <i className="lni lni-checkmark"></i> {updatePlanning.isPending ? 'Updating…' : 'Update Allocation'}
              </button>
            )
          ) : (
            permissions.add && (
              <button className="btn btn-primary" disabled={isAllocating} onClick={handleAllocate}>
                <i className="lni lni-checkmark"></i> {createPlanning.isPending ? 'Allocating…' : units.length > 1 ? `Allocate ${units.length} Units` : 'Allocate'}
              </button>
            )
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-hdr">
          <div className="card-title"><span className="ctitle-icon"><i className="lni lni-graduation"></i></span> Allocated List</div>
          <div className="flex gap-2 flex-wrap" style={{ flex: '1 1 auto', justifyContent: 'flex-end', minWidth: 0 }}>
            <SearchSelect
              placeholder="All lecturers"
              options={lecturerFilterOptions}
              value={lecturerFilter}
              onChange={setLecturerFilter}
              isLoading={isLecturersLoading}
              style={{ flex: '0 1 240px', minWidth: 180 }}
            />
            <div className="inp-wrap" style={{ flex: '0 1 260px', minWidth: 180 }}>
              <span className="inp-icon"><i className="lni lni-search-alt"></i></span>
              <input className="ctrl" placeholder="Course unit, school or session…" aria-label="Search allocations" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
        </div>
        <ScrollTable>
          <table>
            <thead>
              <tr>
                <th style={{ width: 48 }}></th>
                <th>Lecturer</th>
                <th>Course Unit</th>
                <th>School</th>
                <th>Session</th>
                <th>Term</th>
                <th>Load</th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? <TableLoadingState colSpan={999} />
                : rows.length === 0
                  ? <EmptyState colSpan={999} hasFilters={hasListFilters} onClearFilters={() => { setSearch(''); setLecturerFilter('') }} />
                  : null}
              {!isLoading && rows.map(r => (
                <tr key={r.programPlanGuid} style={editingRow?.programPlanGuid === r.programPlanGuid ? { background: 'var(--b50)' } : undefined}>
                  <td>
                    <ActionMenu>
                      <button className="btn btn-neu btn-sm" onClick={() => setViewRow(r)}><i className="lni lni-eye"></i> View</button>
                      {permissions.edit && <button className="btn btn-neu btn-sm" onClick={() => startEdit(r)}><i className="lni lni-pencil"></i> Edit</button>}
                      {permissions.delete && <button className="btn btn-neu btn-sm" onClick={() => setDeleteTarget(r)}><i className="lni lni-trash-can"></i> Delete</button>}
                    </ActionMenu>
                  </td>
                  <td className="font-medium text-g800">{r.employeeName ?? '—'}</td>
                  <td>
                    <span className="font-mono text-xs text-b700">{r.courseUnitCode ?? '—'}</span> {r.courseUnitName ? `— ${r.courseUnitName}` : ''}
                  </td>
                  <td className="text-g600">{r.facultyCode ?? '—'}</td>
                  <td className="text-g600">{r.description ? `${r.description} (${r.intakeCode})` : '—'}</td>
                  <td>{r.term != null ? <span className="badge badge-blue">{r.term === 3 ? 'Both' : `Term ${r.term}`}</span> : '—'}</td>
                  <td className="text-g600">{r.load ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollTable>
        <Pagination page={safePage} totalPages={totalPages} totalCount={totalCount} itemLabel="allocations" onPageChange={setPage} />
      </div>

      {deleteTarget && (
        <div className="perm-delete-overlay" style={{ position: 'fixed', zIndex: 500 }} onClick={() => setDeleteTarget(null)}>
          <div className="perm-delete-card tab-panel-in" onClick={e => e.stopPropagation()}>
            <div className="perm-delete-icon"><i className="lni lni-trash-can"></i></div>
            <div className="perm-delete-title">Remove this allocation?</div>
            <div className="perm-delete-sub">
              {deleteTarget.employeeName ?? 'This lecturer'} will no longer be allocated to {deleteTarget.courseUnitCode ?? 'this course unit'}. This can&apos;t be undone.
            </div>
            <div className="perm-delete-actions">
              <button className="btn btn-neu" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="btn btn-danger" disabled={deletePlanning.isPending} onClick={confirmDelete}>
                <i className="lni lni-trash-can"></i> {deletePlanning.isPending ? 'Removing…' : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}

      {viewRow && (
        <div className="modal-overlay open">
          <div className="modal modal-md" onClick={e => e.stopPropagation()}>
            <div className="modal-hdr modal-hdr-blue">
              <div className="modal-title"><i className="lni lni-eye"></i> View Allocation</div>
              <button className="modal-close" onClick={() => setViewRow(null)} aria-label="Close"><i className="lni lni-close"></i></button>
            </div>
            <div style={{ padding: '20px clamp(14px, 4vw, 22px)' }}>
              {/* Lead with what's allocated to whom; the rest is detail. */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 14px', border: '1.5px solid var(--g200)', borderRadius: 'var(--rsm)', background: 'var(--surface)', marginBottom: 20 }}>
                <span className="badge badge-blue font-mono" style={{ flexShrink: 0, marginTop: 2 }}>{viewRow.courseUnitCode ?? '—'}</span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--g900)', lineHeight: 1.35 }}>{viewRow.courseUnitName ?? 'Course unit'}</div>
                  <div style={{ fontSize: 13, color: 'var(--g500)', marginTop: 3 }}>
                    <i className="lni lni-user" aria-hidden="true" /> Allocated to <strong style={{ color: 'var(--g800)', fontWeight: 600 }}>{viewRow.employeeName ?? '—'}</strong>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', rowGap: 18, columnGap: 24 }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--g500)', marginBottom: 4 }}>School / Faculty</div>
                  <div style={{ fontSize: 14, color: 'var(--g900)', fontWeight: 500 }}>
                    {viewRow.facultyName ?? '—'}
                    {viewRow.facultyCode && <span className="font-mono" style={{ color: 'var(--g500)', fontSize: 12.5, marginLeft: 6 }}>{viewRow.facultyCode}</span>}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--g500)', marginBottom: 4 }}>Academic Session</div>
                  <div style={{ fontSize: 14, color: 'var(--g900)', fontWeight: 500 }}>
                    {viewRow.description ?? '—'}
                    {viewRow.intakeCode != null && <span className="font-mono" style={{ color: 'var(--g500)', fontSize: 12.5, marginLeft: 6 }}>{viewRow.intakeCode}</span>}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--g500)', marginBottom: 4 }}>Term</div>
                  {viewRow.term != null
                    ? <span className="badge badge-blue">{viewRow.term === 3 ? 'Both' : `Term ${viewRow.term}`}</span>
                    : <div style={{ fontSize: 14, color: 'var(--g900)', fontWeight: 500 }}>—</div>}
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--g500)', marginBottom: 4 }}>Teaching Load</div>
                  <div style={{ fontSize: 14, color: 'var(--g900)', fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>{viewRow.load ?? '—'}</div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <span className="flex-1"></span>
              {permissions.edit && (
                <button className="btn btn-neu" onClick={() => { const r = viewRow; setViewRow(null); startEdit(r) }}>
                  <i className="lni lni-pencil"></i> Edit
                </button>
              )}
              <button className="btn btn-primary" onClick={() => setViewRow(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {saved && (
        <div className="modal-overlay open">
          <div className="modal" style={{ maxWidth: 400 }}>
            <SuccessPopup title={saved.title} subtitle={saved.subtitle} onClose={() => setSaved(null)} />
          </div>
        </div>
      )}

      <Toast toast={toast} />
    </div>
  )
}
