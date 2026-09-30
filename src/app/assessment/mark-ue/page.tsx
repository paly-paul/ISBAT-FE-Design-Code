'use client'
import { ScrollTable } from '@/components/ScrollTable'
import { TableSearch } from '@/components/TableSearch'
import { ActionMenu } from '@/components/ActionMenu'
import { SearchSelect } from '@/components/SearchSelect'
import { TableLoadingState } from '@/components/TableLoadingState'
import { Pagination } from '@/components/Pagination'
import { FilterTh } from '@/components/FilterTh'
import { Toast } from '@/components/Toast'
import { useState, useMemo } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useUeDetailedMarks, useSaveStudentUeMark, useVerifyUeMarks } from '@/hooks/assessment/useUeMarks'
import { useIaCreationInit, useIaCreationSemesters, useIaCreationStructure } from '@/hooks/assessment/useIaCreation'

export default function MarkEntryUePage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  // Extract GUID from URL, e.g. /assessment/mark-ue?guid=xxxx
  const universityExamGuid = searchParams.get('guid') || ''

  const { data: gridData, isLoading, error } = useUeDetailedMarks(universityExamGuid)
  const saveMarkMutation = useSaveStudentUeMark(universityExamGuid)
  const verifyMutation = useVerifyUeMarks(universityExamGuid)

  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [openFilter, setOpenFilter] = useState<string | null>(null)
  const [filters, setFilters] = useState<Record<string, string[]>>({})
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

  const handleFilterSelect = (col: string, vals: string[]) => {
    setFilters(prev => ({ ...prev, [col]: vals }))
    setOpenFilter(null)
  }

  const handleVerify = () => {
    verifyMutation.mutate(undefined, {
      onSuccess: () => {
        showToast('University Exam Marks verified successfully!', 'success')
      },
      onError: (err: any) => {
        const status = err?.response?.status || err?.status;
        const errCode = err?.response?.data?.code || err?.code;

        if (status === 400 || errCode === 'no_marks_entered') {
          showToast('Please enter marks before verifying.', 'error')
        } else if (status === 409 || errCode === 'already_verified') {
          showToast('This exam is already verified.', 'error')
          // Since it's already verified, we could trigger a refetch of the grid to sync state
        } else if (status === 404) {
          showToast('Exam not found.', 'error')
        } else {
          showToast('Failed to verify exam marks.', 'error')
        }
      }
    })
  }

  const handleMarkChange = (studentGuid: string, markValue: string) => {
    if (gridData?.isVerified) return;

    let mark: number | null = parseFloat(markValue)
    if (isNaN(mark)) mark = null

    // basic absent logic
    const isAbsent = markValue.trim().toUpperCase() === 'AB'
    if (isAbsent) mark = null

    saveMarkMutation.mutate({ studentGuid, mark, isAbsent })
  }

  const students = useMemo(() => {
    let result = gridData?.students || []

    if (search) {
      const s = search.toLowerCase()
      result = result.filter(st =>
        (st.studentName && st.studentName.toLowerCase().includes(s)) ||
        (st.studentRegNo && st.studentRegNo.toLowerCase().includes(s)) ||
        (st.matchingCode && st.matchingCode.toLowerCase().includes(s))
      )
    }

    if (filters['result'] && filters['result'].length > 0) {
      result = result.filter(st => filters['result'].includes(st.result))
    }

    return result
  }, [gridData?.students, search, filters])



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
          <div className="pg-sub">Enter UE marks · Matching Code for anonymous marking · IA + UE pass gate enforced</div>
        </div>
        <div className="pg-actions flex items-center gap-3">
          <button
            className="btn btn-secondary whitespace-nowrap"
            onClick={() => showToast('All UE marks saved locally')}
            disabled={gridData?.isVerified}
          >
            Save All
          </button>
          <button
            className="btn btn-primary whitespace-nowrap flex items-center gap-2"
            onClick={handleVerify}
            disabled={gridData?.isVerified || verifyMutation.isPending || isLoading}
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
             onClick={() => router.push(`/assessment/mark-ue?guid=${selectedCourseUnitGuid}`)}
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
              <strong>Matching Code:</strong> Each student has a 4-digit code (on hall ticket) + 4-digit script code for anonymous marking. Match codes before entering marks. <strong>Pass gate: min 50% in IA AND min 50% in UE separately.</strong>
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
                <th style={{ width: 48 }}></th>
                <th>MATCHING<br />CODE</th>
                <th>REG. NO.</th>
                <th>STUDENT</th>
                <th>IA TOTAL<br />(/30)</th>
                <th>IA PASS</th>
                <th>UE RAW<br />(/100)</th>
                <th>UE<br />(/70)</th>
                <th>UE PASS</th>
                <FilterTh
                  label="RESULT"
                  opts={['PASS', 'FAIL (UE)']}
                  isOpen={openFilter === 'result'}
                  activeFilter={filters['result'] || []}
                  onToggle={(e) => { e.stopPropagation(); setOpenFilter(openFilter === 'result' ? null : 'result') }}
                  onSelect={(vals) => handleFilterSelect('result', vals)}
                  onClear={() => handleFilterSelect('result', [])}
                  onClose={() => setOpenFilter(null)}
                />
              </tr>
            </thead>
            <tbody>
              {!universityExamGuid ? (
                <tr>
                  <td colSpan={10} className="text-center py-16 text-slate-400">
                    <i className="lni lni-calendar text-3xl mb-3 block text-slate-300"></i>
                    No exam selected. Please enter an Exam GUID above to load students.
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={10} className="text-center py-16 text-rose-500">
                    <i className="lni lni-warning text-3xl mb-3 block"></i>
                    Could not fetch data for University Exam ID: {universityExamGuid}
                  </td>
                </tr>
              ) : isLoading ? (
                <TableLoadingState colSpan={10} />
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-8 text-slate-400">
                    No students found.
                  </td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr key={student.studentGuid}>
                    <td>
                      <ActionMenu>
                        <button className="btn btn-neu btn-sm"><i className="lni lni-eye"></i> View</button>
                      </ActionMenu>
                    </td>
                    <td className="font-mono text-slate-600 text-[13px]">{student.matchingCode || '—'}</td>
                    <td className="font-mono text-slate-500 text-[12.5px]">{student.studentRegNo}</td>
                    <td className="text-slate-800">{student.studentName}</td>
                    <td className="font-medium text-slate-800 text-[13px]">{student.iaTotal ?? '—'}</td>
                    <td>
                      {student.iaPass ? (
                        <div className="flex flex-col items-center justify-center bg-green-50 text-green-700 w-12 h-12 rounded-full border border-green-200">
                          <span className="font-bold text-[10px]">✓</span>
                          <span className="text-[10px] font-semibold">({student.iaPercentage ?? 0}%)</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center bg-red-50 text-red-600 w-12 h-12 rounded-full border border-red-200">
                          <span className="font-bold text-[10px]">X</span>
                          <span className="text-[10px] font-semibold">({student.iaPercentage ?? 0}%)</span>
                        </div>
                      )}
                    </td>
                    <td>
                      <input
                        type="text"
                        className="w-[60px] px-2 py-1 border border-slate-200 rounded text-center text-[13px] focus:outline-none focus:border-purple-500 disabled:bg-slate-100 disabled:text-slate-500"
                        defaultValue={student.isAbsent ? 'AB' : (student.ueRawMark ?? '')}
                        disabled={gridData?.isVerified}
                        onBlur={(e) => {
                          if (e.target.value !== (student.isAbsent ? 'AB' : (student.ueRawMark?.toString() ?? ''))) {
                            handleMarkChange(student.studentGuid, e.target.value)
                          }
                        }}
                      />
                    </td>
                    <td className="text-purple-700 font-bold">{student.ueConvertedMark ?? '—'}</td>
                    <td>
                      {student.uePass ? (
                        <div className="flex flex-col items-center justify-center bg-green-50 text-green-700 w-12 h-12 rounded-full border border-green-200">
                          <span className="font-bold text-[10px]">✓</span>
                          <span className="text-[10px] font-semibold">({student.uePercentage ?? 0}%)</span>
                        </div>
                      ) : student.ueRawMark !== null || student.isAbsent ? (
                        <div className="flex flex-col items-center justify-center bg-red-50 text-red-600 w-12 h-12 rounded-full border border-red-200">
                          <span className="font-bold text-[10px]">X</span>
                          <span className="text-[10px] font-semibold">({student.uePercentage ?? 0}%)</span>
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td>
                      {student.result === 'PASS' ? (
                        <span className="bg-green-100 text-green-700 px-2.5 py-0.5 rounded-full text-[11px] font-bold">PASS</span>
                      ) : student.result ? (
                        <span className="badge badge-red">{student.result}</span>
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
