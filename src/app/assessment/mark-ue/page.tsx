'use client'
import { ScrollTable } from '@/components/ScrollTable'
import { TableSearch } from '@/components/TableSearch'
import { SearchSelect } from '@/components/SearchSelect'
import { TableLoadingState } from '@/components/TableLoadingState'
import { Pagination } from '@/components/Pagination'
import { Toast } from '@/components/Toast'
import { useState, useMemo } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { AuthError } from '@/lib/api/client'
import { useUeDetailedMarks, useSaveUeMarks, useVerifyUeMarks } from '@/hooks/assessment/useUeMarks'
import { useIaCreationInit, useIaCreationSemesters, useIaCreationStructure } from '@/hooks/assessment/useIaCreation'
import { UE_LAYOUT_FIELDS, UeDetailedMarkRowDto, UeMarkField, UeMarkValues } from '@/lib/api/assessment/ueMarks'

// Unsaved edits, keyed studentGuid → field → raw input text. A row is only
// sent once every visible field of its layout is filled and within its max
// (save-ue-detailed-mark.md requires all layout fields on each PUT).
type Drafts = Record<string, Partial<Record<UeMarkField, string>>>

const ALL_MARK_FIELDS: UeMarkField[] = [
  'sectionAMark', 'sectionBMark', 'sectionCMark',
  'recordMark', 'codingMark', 'outputMark', 'vivaMark',
  'synopsisMark', 'reviewMark', 'methodologyMark', 'analysisMark',
]

export default function MarkEntryUePage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  // Extract GUID from URL, e.g. /assessment/mark-ue?guid=xxxx
  const universityExamGuid = searchParams.get('guid') || ''

  const { data: gridData, isLoading, error } = useUeDetailedMarks(universityExamGuid)
  const saveMarksMutation = useSaveUeMarks(universityExamGuid)
  const verifyMutation = useVerifyUeMarks(universityExamGuid)

  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [drafts, setDrafts] = useState<Drafts>({})
  const [invalidCells, setInvalidCells] = useState<Set<string>>(new Set())
  const [toast, setToast] = useState<{ msg: string, type: string } | null>(null)

  // Dropdown Selections
  const [selectedIntakeGuid, setSelectedIntakeGuid] = useState<string>('')
  const [selectedProgramGuid, setSelectedProgramGuid] = useState<string>('')
  const [selectedSemesterGuid, setSelectedSemesterGuid] = useState<string>('')
  const [selectedCourseUnitGuid, setSelectedCourseUnitGuid] = useState<string>('')

  // Data fetching for dropdowns
  const { data: initData, isLoading: initLoading } = useIaCreationInit()
  const { data: semesters, isLoading: semLoading } = useIaCreationSemesters(selectedProgramGuid || null)
  const { data: structureRows, isLoading: structureLoading } = useIaCreationStructure(
    selectedProgramGuid || null,
    selectedSemesterGuid || null,
    selectedIntakeGuid || null
  )

  const handleProgramChange = (guid: string) => {
    setSelectedProgramGuid(guid)
    setSelectedSemesterGuid('')
    setSelectedCourseUnitGuid('')
  }

  const showToast = (msg: string, type: string = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  // Every field of the layout gets a column, even when its max is null —
  // live data has Theory exams with only sectionAMax set yet real marks in
  // sections B and C, so hiding (or zeroing) a null-max section would hide
  // or wipe saved marks. A null max just means no ceiling is shown/checked.
  const layout = gridData?.layout ?? 'Theory'
  const columns = gridData ? UE_LAYOUT_FIELDS[layout] : []

  const cellKey = (studentGuid: string, field: UeMarkField) => `${studentGuid}:${field}`

  function cellValue(row: UeDetailedMarkRowDto, field: UeMarkField): string {
    const draft = drafts[row.studentGuid]?.[field]
    if (draft !== undefined) return draft
    return row[field] === null ? '' : String(row[field])
  }

  function handleCellChange(studentGuid: string, field: UeMarkField, value: string) {
    setDrafts(prev => ({ ...prev, [studentGuid]: { ...prev[studentGuid], [field]: value } }))
    setInvalidCells(prev => {
      if (!prev.has(cellKey(studentGuid, field))) return prev
      const s = new Set(prev); s.delete(cellKey(studentGuid, field)); return s
    })
  }

  const dirtyRows = useMemo(() => {
    if (!gridData) return []
    return gridData.rows.filter(r => !r.isAbsent && columns.some(c => {
      const draft = drafts[r.studentGuid]?.[c.field]
      return draft !== undefined && draft.trim() !== (r[c.field] === null ? '' : String(r[c.field]))
    }))
  }, [gridData, drafts, columns])

  function handleSaveAll() {
    if (!gridData) return
    if (dirtyRows.length === 0) { showToast('No changes to save.', 'warn'); return }

    const invalid = new Set<string>()
    let firstProblem = ''
    const entries = dirtyRows.map(row => {
      const marks = Object.fromEntries(ALL_MARK_FIELDS.map(f => [f, null])) as UeMarkValues
      columns.forEach(c => {
        const raw = cellValue(row, c.field).trim()
        const max = gridData.maxMarks[c.max] ?? null
        const n = Number(raw)
        if (raw === '' || isNaN(n) || n < 0 || (max !== null && n > max)) {
          invalid.add(cellKey(row.studentGuid, c.field))
          if (!firstProblem) {
            firstProblem = raw === ''
              ? `${row.studentName ?? row.studentRegNo}: ${c.label} is required.`
              : max !== null
                ? `${row.studentName ?? row.studentRegNo}: ${c.label} must be between 0 and ${max}.`
                : `${row.studentName ?? row.studentRegNo}: ${c.label} must be a number of 0 or more.`
          }
        } else {
          marks[c.field] = n
        }
      })
      return { studentGuid: row.studentGuid, marks }
    })

    if (invalid.size > 0) {
      setInvalidCells(invalid)
      showToast(firstProblem, 'error')
      return
    }

    saveMarksMutation.mutate(entries, {
      onSuccess: results => {
        const savedGuids = entries.filter((_, i) => results[i].status === 'fulfilled').map(e => e.studentGuid)
        setDrafts(prev => {
          const next = { ...prev }
          savedGuids.forEach(g => { delete next[g] })
          return next
        })
        const failed = results.filter((r): r is PromiseRejectedResult => r.status === 'rejected')
        if (failed.length === 0) {
          showToast(`Marks saved for ${savedGuids.length} student${savedGuids.length === 1 ? '' : 's'}.`)
        } else {
          const reason = failed[0].reason instanceof Error ? failed[0].reason.message : 'Could not save marks.'
          showToast(`${failed.length} of ${entries.length} not saved — ${reason}`, 'error')
        }
      },
    })
  }

  const handleVerify = () => {
    if (dirtyRows.length > 0) { showToast('Save your changes before verifying.', 'warn'); return }
    verifyMutation.mutate(undefined, {
      onSuccess: () => {
        showToast('University Exam Marks verified successfully!', 'success')
      },
      onError: (err) => {
        const errCode = err instanceof AuthError ? err.code : undefined
        if (errCode === 'no_marks_entered') {
          showToast('Please enter marks before verifying.', 'error')
        } else if (errCode === 'already_verified') {
          showToast('This exam is already verified.', 'error')
        } else if (errCode === 'not_found') {
          showToast('Exam not found.', 'error')
        } else {
          showToast(err instanceof Error && err.message ? err.message : 'Failed to verify exam marks.', 'error')
        }
      }
    })
  }

  const students = useMemo(() => {
    const rows = gridData?.rows ?? []
    if (!search) return rows
    const s = search.toLowerCase()
    return rows.filter(st =>
      (st.studentName && st.studentName.toLowerCase().includes(s)) ||
      (st.studentRegNo && st.studentRegNo.toLowerCase().includes(s))
    )
  }, [gridData?.rows, search])

  const errorMessage = error instanceof AuthError && error.code === 'attendance_not_taken'
    ? 'Attendance has not been taken for this exam yet. Take attendance before entering marks.'
    : error instanceof AuthError && error.code === 'not_found'
      ? 'Exam not found.'
      : `Could not fetch data for University Exam ID: ${universityExamGuid}`

  const colCount = 4 + columns.length

  return (
    <div className="page active">
      <div className="pg-hdr">
        <div>
          <div className="pg-title flex items-center gap-3">
            Mark Entry — University Examination
            {gridData?.isVerified === true ? (
              <span className="badge badge-green !text-[11px] !py-1 !px-2.5 shadow-sm">
                <i className="lni lni-checkmark-circle mr-1"></i> Verified
              </span>
            ) : gridData?.isVerified === false ? (
              <span className="badge badge-amber !text-[11px] !py-1 !px-2.5 shadow-sm">
                Pending Verification
              </span>
            ) : null}
          </div>
          <div className="pg-sub">
            {gridData
              ? `${gridData.courseUnitName ?? 'Course unit'} · ${gridData.layout} layout`
              : 'Enter UE marks per student · totals are computed on save'}
          </div>
        </div>
        <div className="pg-actions flex items-center gap-3">
          <button
            className="btn btn-secondary whitespace-nowrap"
            onClick={handleSaveAll}
            disabled={!gridData || gridData.isVerified || saveMarksMutation.isPending}
          >
            {saveMarksMutation.isPending ? 'Saving…' : `Save All${dirtyRows.length ? ` (${dirtyRows.length})` : ''}`}
          </button>
          <button
            className="btn btn-primary whitespace-nowrap flex items-center gap-2"
            onClick={handleVerify}
            disabled={!gridData || gridData.isVerified || verifyMutation.isPending || isLoading}
          >
            {verifyMutation.isPending ? (
              <><i className="lni lni-spinner-solid animate-spin"></i> Verifying...</>
            ) : (
              <><i className="lni lni-shield"></i> Verify Exam</>
            )}
          </button>
        </div>
      </div>

      <div className="card mb-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-5">
          <div className="fg mb-0">
            <label className="lbl">Academic Session</label>
            <SearchSelect
              placeholder="— Select Session —"
              value={selectedIntakeGuid}
              onChange={setSelectedIntakeGuid}
              disabled={initLoading}
              options={(initData?.intakes ?? [])
                .filter(i => i.currentIntake)
                .map(i => ({
                  value: i.intakeGuid,
                  label: `${i.description ?? `Intake ${i.intakeCode}`} (Current)`,
                }))}
            />
          </div>
          <div className="fg mb-0">
            <label className="lbl">Programme <span className="text-red-500">*</span></label>
            <SearchSelect
              placeholder="— Select Programme —"
              value={selectedProgramGuid}
              onChange={handleProgramChange}
              disabled={initLoading}
              options={(initData?.programs ?? []).map(p => ({
                value: p.programGuid,
                label: `${p.programCode} — ${p.programName}`,
              }))}
            />
          </div>
          <div className="fg mb-0">
            <label className="lbl">Semester <span className="text-red-500">*</span></label>
            <SearchSelect
              placeholder="— Select Semester —"
              value={selectedSemesterGuid}
              onChange={(val) => { setSelectedSemesterGuid(val); setSelectedCourseUnitGuid(''); }}
              disabled={!selectedProgramGuid || semLoading}
              options={(semesters ?? []).map(s => ({
                value: s.semesterGuid,
                label: s.semName,
              }))}
            />
          </div>
          <div className="fg mb-0">
            <label className="lbl">Course Unit <span className="text-red-500">*</span></label>
            <SearchSelect
              placeholder="— Select Course Unit —"
              value={selectedCourseUnitGuid}
              onChange={setSelectedCourseUnitGuid}
              disabled={!selectedSemesterGuid || structureLoading}
              options={(structureRows ?? [])
                .filter(r => r.universityExamGuid)
                .map(r => ({
                  value: r.universityExamGuid!,
                  label: `${r.unitCode} - ${r.unitName}`,
                }))}
            />
          </div>
        </div>
        <div className="p-5 pt-0 flex gap-2">
          <button
             className="btn btn-primary"
             disabled={!selectedCourseUnitGuid}
             onClick={() => { setDrafts({}); setInvalidCells(new Set()); router.push(`/assessment/mark-ue?guid=${selectedCourseUnitGuid}`) }}
          >
             Show Mark Sheet
          </button>
          <button
             className="btn btn-neu"
             onClick={() => {
                setSelectedIntakeGuid('')
                setSelectedProgramGuid('')
                setSelectedSemesterGuid('')
                setSelectedCourseUnitGuid('')
                setDrafts({})
                setInvalidCells(new Set())
                router.push(`/assessment/mark-ue`)
             }}
          >
             Refresh
          </button>
        </div>
      </div>

      <div className="card mb-5">
        <div className="p-5 pb-0">
          <div className="bg-[#eff6ff] border border-[#dbeafe] rounded-md p-4 flex gap-3 text-[13px] text-[#2563eb] items-start mb-4">
            <div className="mt-0.5"><i className="lni lni-information text-[16px]"></i></div>
            <div className="leading-relaxed text-[#1e40af]">
              Fill every column for a student, then <strong>Save All</strong>. The total is calculated on save. Absent students can&apos;t be marked. <strong>Verifying locks the marks and can&apos;t be undone.</strong>
            </div>
          </div>
        </div>

        <div className="card-hdr">
          <div className="card-title">
            <span className="ctitle-icon"><i className="lni lni-list"></i></span> Records
          </div>
          <TableSearch
            className="w-64"
            placeholder="Search records..."
            value={search}
            onChange={setSearch}
            results={[]}
          />
        </div>
        <ScrollTable>
          <table>
            <thead>
              <tr>
                <th>REG. NO.</th>
                <th>STUDENT</th>
                {columns.map(c => {
                  const max = gridData?.maxMarks[c.max]
                  return <th key={c.field}>{c.label.toUpperCase()}{max != null && <><br />(/{max})</>}</th>
                })}
                <th>TOTAL</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {!universityExamGuid ? (
                <tr>
                  <td colSpan={colCount} className="text-center py-16 text-slate-400">
                    <i className="lni lni-calendar text-3xl mb-3 block text-slate-300"></i>
                    No exam selected. Pick a programme, semester and course unit above to load students.
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={colCount} className="text-center py-16 text-rose-500">
                    <i className="lni lni-warning text-3xl mb-3 block"></i>
                    {errorMessage}
                  </td>
                </tr>
              ) : isLoading ? (
                <TableLoadingState colSpan={colCount} />
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={colCount} className="text-center py-8 text-slate-400">
                    No students found.
                  </td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr key={student.studentGuid}>
                    <td className="font-mono text-slate-500 text-[12.5px]">{student.studentRegNo ?? '—'}</td>
                    <td className="text-slate-800">{student.studentName ?? '—'}</td>
                    {columns.map(c => {
                      const invalid = invalidCells.has(cellKey(student.studentGuid, c.field))
                      return (
                        <td key={c.field}>
                          <input
                            type="text"
                            inputMode="decimal"
                            aria-label={`${c.label} for ${student.studentName ?? student.studentRegNo}`}
                            className={`w-[60px] px-2 py-1 border rounded text-center text-[13px] focus:outline-none focus:border-purple-500 disabled:bg-slate-100 disabled:text-slate-500 ${invalid ? 'border-red-500' : 'border-slate-200'}`}
                            value={student.isAbsent ? 'ABS' : cellValue(student, c.field)}
                            disabled={gridData?.isVerified || student.isAbsent}
                            onChange={e => handleCellChange(student.studentGuid, c.field, e.target.value)}
                          />
                        </td>
                      )
                    })}
                    <td className="text-purple-700 font-bold">{student.totalMark ?? '—'}</td>
                    <td>
                      {student.isAbsent ? (
                        <span className="badge badge-red">Absent</span>
                      ) : dirtyRows.some(r => r.studentGuid === student.studentGuid) ? (
                        <span className="badge badge-amber">Unsaved</span>
                      ) : student.totalMark !== null ? (
                        <span className="badge badge-green">Marked</span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </ScrollTable>

        <div className="p-4 border-t border-slate-100">
          <Pagination page={page} totalPages={1} totalCount={students.length} onPageChange={setPage} />
        </div>
      </div>
      <Toast toast={toast} />
    </div>
  )
}
