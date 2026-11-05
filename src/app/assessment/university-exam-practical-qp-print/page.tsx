'use client'

import { useState, useMemo, useEffect } from 'react'
import { Toast } from '@/components/Toast'
import { usePagePermissions } from '@/hooks/users/usePagePermissions'
import { SearchSelect } from '@/components/SearchSelect'
import { useIntakesDropdown } from '@/hooks/academic/useIntakes'
import { useUeQuestionPrintCourseUnits } from '@/hooks/assessment/useUeMaterialPrint'
import {
  useUePracticalPrintPrograms,
  useUePracticalPrintSemesters,
  useUePracticalProgramUnits,
  usePrintUeQuestionPractical,
  useDownloadUeQuestionPracticalPdf,
  useDownloadUeQuestionPracticalWord,
  useDeleteUeQuestionPractical
} from '@/hooks/assessment/useUePracticalPrint'

const OUTCOME_NAMES = ['Printed', 'Reprinted', 'ExamRuleNotSet', 'QuestionsNotAvailable', 'ConfirmationRequired'] as const
type QpOutcome = typeof OUTCOME_NAMES[number]

function parseOutcome(result: any): { outcome: QpOutcome | null; message: string } {
  if (result === null || result === undefined) return { outcome: null, message: '' }

  const raw = result?.outcome ?? result?.Outcome ?? (typeof result === 'object' && 'data' in result ? (result.data?.outcome ?? result.data?.Outcome ?? result.data) : result)

  let outcome: QpOutcome | null = null
  if (typeof raw === 'number') {
    outcome = OUTCOME_NAMES[raw] ?? null
  } else if (typeof raw === 'string') {
    const trimmed = raw.trim()
    if (/^\d+$/.test(trimmed)) {
      outcome = OUTCOME_NAMES[Number(trimmed)] ?? null
    } else {
      outcome = OUTCOME_NAMES.find(n => n.toLowerCase() === trimmed.toLowerCase()) ?? null
    }
  }

  const message = (typeof result?.message === 'string' && result.message)
    || (typeof result?.data?.message === 'string' && result.data.message)
    || ''

  return { outcome, message }
}

export default function UniversityExamPracticalQpPrintPage() {
  const permissions = usePagePermissions()
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)

  const showToast = (msg: string, type = '') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  // Dropdown States
  const [selectedIntakeGuid, setSelectedIntakeGuid] = useState<string>('')
  const [selectedProgramGuid, setSelectedProgramGuid] = useState<string>('')
  const [selectedSemesterGuid, setSelectedSemesterGuid] = useState<string>('')
  const [selectedCourseUnitGuid, setSelectedCourseUnitGuid] = useState<string>('')

  // Modals for confirmation
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null)
  const [confirmMessage, setConfirmMessage] = useState('')

  // Data Hooks
  const { data: intakes, isLoading: intakesLoading } = useIntakesDropdown()
  const { data: programs, isLoading: programsLoading } = useUePracticalPrintPrograms()
  const { data: semesters, isLoading: semLoading } = useUePracticalPrintSemesters(selectedProgramGuid || null)
  const { data: allProgramUnits, isLoading: progUnitsLoading } = useUePracticalProgramUnits(selectedProgramGuid || null)
  const { data: assessmentUnits, isLoading: assessUnitsLoading } = useUeQuestionPrintCourseUnits(
    selectedProgramGuid,
    selectedSemesterGuid,
    Boolean(selectedProgramGuid && selectedSemesterGuid),
    selectedIntakeGuid,
    ['Practical']
  )
  const unitsLoading = progUnitsLoading || assessUnitsLoading

  // Intake Dropdown Options: Load full list per MD line 19-20, mark current intake with label
  const intakeOptions = useMemo(() => {
    return (intakes ?? []).map(i => ({
      value: i.intakeGuid,
      label: i.currentIntake ? `${i.description || i.intakeCode} (Current)` : String(i.description || i.intakeCode || ''),
    }))
  }, [intakes])

  // Pre-select current intake (user-editable per MD line 19)
  useEffect(() => {
    if (intakes && intakes.length > 0 && !selectedIntakeGuid) {
      const current = intakes.find(i => i.currentIntake) || intakes[0]
      if (current) setSelectedIntakeGuid(current.intakeGuid)
    }
  }, [intakes, selectedIntakeGuid])

  // Filter Practical units for the selected semester (case-insensitive per MD line 23)
  // Uses academic allProgramUnits if available; safely falls back to assessmentUnits
  // if user has only assessment permissions (e.g. 403 on academic endpoints).
  const courseUnits = useMemo(() => {
    if (allProgramUnits && allProgramUnits.length > 0 && selectedSemesterGuid) {
      const filtered = allProgramUnits.filter((u: any) =>
        u.semesterGuid?.toLowerCase() === selectedSemesterGuid.toLowerCase() &&
        (u.unitTypeName || '').trim().toLowerCase() === 'practical'
      )
      if (filtered.length > 0) return filtered
    }
    return (assessmentUnits ?? []).filter((u: any) =>
      !u.unitTypeName || u.unitTypeName.trim().toLowerCase() === 'practical'
    )
  }, [allProgramUnits, selectedSemesterGuid, assessmentUnits])

  const selectedUnitRow = useMemo(() => {
    if (!selectedCourseUnitGuid || !courseUnits) return null
    return courseUnits.find((u: any) => u.courseUnitGuid?.toLowerCase() === selectedCourseUnitGuid.toLowerCase())
  }, [selectedCourseUnitGuid, courseUnits])

  const isFormValid = !!selectedIntakeGuid && !!selectedProgramGuid && !!selectedSemesterGuid && !!selectedCourseUnitGuid

  // API Hooks
  const printPracticalMut = usePrintUeQuestionPractical()
  const dlPracticalPdfMut = useDownloadUeQuestionPracticalPdf()
  const dlPracticalWordMut = useDownloadUeQuestionPracticalWord()
  const delPracticalMut = useDeleteUeQuestionPractical()

  // Handlers
  const handleProgramChange = (guid: string) => {
    setSelectedProgramGuid(guid)
    setSelectedSemesterGuid('')
    setSelectedCourseUnitGuid('')
  }
  const handleSemesterChange = (guid: string) => {
    setSelectedSemesterGuid(guid)
    setSelectedCourseUnitGuid('')
  }
  const handleRefresh = () => {
    setSelectedProgramGuid('')
    setSelectedSemesterGuid('')
    setSelectedCourseUnitGuid('')
    if (intakes && intakes.length > 0) {
      const current = intakes.find(i => i.currentIntake) || intakes[0]
      if (current) setSelectedIntakeGuid(current.intakeGuid)
    }
  }

  const downloadFile = (blob: Blob, filename: string | null, fallbackName: string) => {
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename || fallbackName
    document.body.appendChild(a)
    a.click()
    a.remove()
    window.URL.revokeObjectURL(url)
  }

  const confirmAndExecute = (msg: string, action: () => void) => {
    setConfirmMessage(msg)
    setConfirmAction(() => action)
    setShowConfirmModal(true)
  }

  const executeConfirm = () => {
    if (confirmAction) confirmAction()
    setShowConfirmModal(false)
  }

  const buildRequest = (confirm = false) => ({
    programGuid: selectedProgramGuid,
    semesterGuid: selectedSemesterGuid,
    courseUnitGuid: selectedCourseUnitGuid,
    intakeGuid: selectedIntakeGuid,
    streamGuid: (selectedUnitRow as any)?.streamGuid ?? null,
    confirm
  })

  // --- Actions ---

  // 1. QP Print
  const handlePrintQP = async (confirm = false) => {
    if (!isFormValid) return
    const req = buildRequest(confirm)

    try {
      const res = await printPracticalMut.mutateAsync(req)
      const { outcome, message } = parseOutcome(res)

      if (outcome === 'ConfirmationRequired') {
        confirmAndExecute(message || 'Questions are already printed. Do you want to reprint the same?', () => handlePrintQP(true))
        return
      }

      if (outcome === 'ExamRuleNotSet') {
        showToast(message || 'University Exam not yet Scheduled!!', 'error')
        return
      }

      if (outcome === 'QuestionsNotAvailable') {
        showToast(message || 'Questions are not yet uploaded!!', 'error')
        return
      }

      if (outcome === 'Printed' || outcome === 'Reprinted') {
        showToast(message || (outcome === 'Reprinted' ? 'Question Paper Reprinted!' : 'Question Paper Generated!'), 'success')
        return
      }

      showToast(message || 'Question Paper Generated!', 'success')
    } catch (err: any) {
      showToast(err.message || 'Failed to print practical QP', 'error')
    }
  }

  // 2. QP Delete
  const handleDeleteQP = async (confirm = false) => {
    if (!isFormValid) return
    const req = buildRequest(confirm)

    try {
      const res = await delPracticalMut.mutateAsync(req)
      if (res.data === false && !confirm) {
        confirmAndExecute(res.message || 'You are about to delete the QP set. Do you want to continue?', () => handleDeleteQP(true))
        return
      }
      if (res.data === true || confirm) {
        showToast(res.message || 'Deleted successfully!', 'success')
      }
    } catch (err: any) {
      const msg = err?.message || ''
      if (msg.toLowerCase().includes('not found') || msg.toLowerCase().includes('could not delete')) {
        showToast('No printed question paper found to delete.', 'info')
      } else {
        showToast(msg || 'Could not delete QP.', 'error')
      }
    }
  }

  // Download Handlers
  const handleDownload = async (type: 'QPPDF' | 'QPWord', confirm = false) => {
    if (!isFormValid) return
    const req = buildRequest(confirm)

    try {
      if (type === 'QPPDF') {
        const { blob, filename } = await dlPracticalPdfMut.mutateAsync(req)
        downloadFile(blob, filename, 'Practical_QuestionPaper.pdf')
      } else if (type === 'QPWord') {
        const { blob, filename } = await dlPracticalWordMut.mutateAsync(req)
        downloadFile(blob, filename, 'Practical_QuestionPaper.doc')
      }
    } catch (err: any) {
      // If questions haven't been printed yet (returns 404), seamlessly generate and download per MD flow
      try {
        const res = await printPracticalMut.mutateAsync(req)
        const { outcome, message } = parseOutcome(res)

        if (outcome === 'ConfirmationRequired') {
          confirmAndExecute(message || 'Questions are already printed. Do you want to reprint the same?', () => handleDownload(type, true))
          return
        }

        if (outcome === 'ExamRuleNotSet' || outcome === 'QuestionsNotAvailable') {
          showToast(message || 'Questions are not yet available for this unit.', 'error')
          return
        }

        if (type === 'QPPDF') {
          const { blob, filename } = await dlPracticalPdfMut.mutateAsync(req)
          downloadFile(blob, filename, 'Practical_QuestionPaper.pdf')
        } else if (type === 'QPWord') {
          const { blob, filename } = await dlPracticalWordMut.mutateAsync(req)
          downloadFile(blob, filename, 'Practical_QuestionPaper.doc')
        }
      } catch (innerErr: any) {
        showToast(innerErr.message || 'Failed to download document', 'error')
      }
    }
  }

  const isWorking = printPracticalMut.isPending || dlPracticalPdfMut.isPending || dlPracticalWordMut.isPending || delPracticalMut.isPending

  return (
    <div className="page active">
      <div className="pg-hdr flex justify-between items-end">
        <div>
          <h1 className="pg-title">University Exam Practical QP Print</h1>
          <p className="pg-sub">Generate and print exam materials for Practical course units</p>
        </div>
        <button className="btn btn-neu" onClick={handleRefresh} disabled={isWorking}>
          <i className="lni lni-reload"></i> Refresh
        </button>
      </div>

      <div className="card mb-5">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-5">
          <div className="fg mb-0">
            <label className="lbl">Academic Intake <span className="text-red-500">*</span></label>
            <SearchSelect
              placeholder="— Select Intake —"
              value={selectedIntakeGuid}
              onChange={setSelectedIntakeGuid}
              disabled={intakesLoading}
              options={intakeOptions}
            />
          </div>
          <div className="fg mb-0">
            <label className="lbl">Programme <span className="text-red-500">*</span></label>
            <SearchSelect
              placeholder="— Select Programme —"
              value={selectedProgramGuid}
              onChange={handleProgramChange}
              disabled={programsLoading}
              options={(programs ?? []).map((p: any) => ({
                value: p.programGuid,
                label: p.programName,
              }))}
            />
          </div>
          <div className="fg mb-0">
            <label className="lbl">Semester <span className="text-red-500">*</span></label>
            <SearchSelect
              placeholder="— Select Semester —"
              value={selectedSemesterGuid}
              onChange={handleSemesterChange}
              disabled={!selectedProgramGuid || semLoading}
              options={(semesters ?? []).map((s: any) => ({
                value: s.semesterGuid,
                label: s.semName,
              }))}
            />
          </div>
          <div className="fg mb-0">
            <label className="lbl">Course Unit (Practical) <span className="text-red-500">*</span></label>
            <SearchSelect
              placeholder="— Select Practical Unit —"
              value={selectedCourseUnitGuid}
              onChange={setSelectedCourseUnitGuid}
              disabled={!selectedSemesterGuid || unitsLoading}
              options={courseUnits.map((u: any) => ({
                value: u.courseUnitGuid,
                label: `${u.courseUnitCode} - ${u.courseUnitName}`,
              }))}
            />
          </div>
        </div>

        <div className="p-5 pt-0 mt-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Question Paper Card */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs">
            <div className="bg-slate-50 px-5 py-4 border-b border-gray-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                <i className="lni lni-layout"></i>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 text-sm m-0">Practical QP Materials</h3>
                <p className="text-xs text-gray-500 m-0">Generate & download practical QP</p>
              </div>
            </div>
            <div className="p-5 grid grid-cols-2 sm:grid-cols-2 gap-3">
              <button 
                className="flex flex-col items-center justify-center p-4 border rounded-xl gap-2 text-sm font-medium transition-all hover:border-primary hover:text-primary hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:hover:shadow-none disabled:hover:text-gray-700 bg-white"
                onClick={() => handlePrintQP()}
                disabled={!isFormValid || isWorking}
              >
                <i className="lni lni-printer text-3xl text-primary"></i>
                Generate QP
              </button>
              
              <button 
                className="flex flex-col items-center justify-center p-4 border rounded-xl gap-2 text-sm font-medium transition-all hover:border-primary hover:text-primary hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:hover:shadow-none disabled:hover:text-gray-700 bg-blue-50 border-blue-100"
                onClick={() => handleDownload('QPPDF')}
                disabled={!isFormValid || isWorking}
              >
                <i className="lni lni-download text-3xl text-red-500"></i>
                PDF Format
              </button>

              <button 
                className="flex flex-col items-center justify-center p-4 border rounded-xl gap-2 text-sm font-medium transition-all hover:border-primary hover:text-primary hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:hover:shadow-none disabled:hover:text-gray-700 bg-slate-50 border-slate-200"
                onClick={() => handleDownload('QPWord')}
                disabled={!isFormValid || isWorking}
              >
                <i className="lni lni-wordpress text-3xl text-blue-500"></i>
                Word Format
              </button>

              {permissions.delete !== false && (
                <button 
                  className="flex flex-col items-center justify-center p-4 border rounded-xl gap-2 text-sm font-medium transition-all hover:border-red-500 hover:text-red-600 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:hover:shadow-none disabled:hover:text-gray-700 bg-red-50 border-red-100"
                  onClick={() => handleDeleteQP()}
                  disabled={!isFormValid || isWorking}
                >
                  <i className="lni lni-trash-can text-3xl text-red-600"></i>
                  Delete QP
                </button>
              )}
            </div>
          </div>

          {/* Booklet Card */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl overflow-hidden shadow-xs opacity-70">
            <div className="bg-gray-100 px-5 py-4 border-b border-gray-200 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center">
                  <i className="lni lni-book"></i>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-700 text-sm m-0">Booklet & Registers</h3>
                  <p className="text-xs text-gray-500 m-0">Not supported for practical units yet</p>
                </div>
              </div>
              <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded font-semibold uppercase">Coming Soon</span>
            </div>
            <div className="p-5 grid grid-cols-2 sm:grid-cols-3 gap-3">
              <button className="flex flex-col items-center justify-center p-4 border rounded-xl gap-2 text-sm font-medium opacity-50 cursor-not-allowed bg-sky-50 border-sky-100" disabled title="Not yet supported for practical exams">
                <i className="lni lni-printer text-3xl text-gray-400"></i>
                Print Booklet
              </button>
              <button className="flex flex-col items-center justify-center p-4 border rounded-xl gap-2 text-sm font-medium opacity-50 cursor-not-allowed bg-gray-50 border-gray-100" disabled title="Not yet supported for practical exams">
                <i className="lni lni-empty-file text-3xl text-gray-400"></i>
                Booklet PDF
              </button>
              <button className="flex flex-col items-center justify-center p-4 border rounded-xl gap-2 text-sm font-medium opacity-50 cursor-not-allowed bg-gray-50 border-gray-100" disabled title="Not yet supported for practical exams">
                <i className="lni lni-users text-3xl text-gray-400"></i>
                Attendance
              </button>
              <button className="flex flex-col items-center justify-center p-4 border rounded-xl gap-2 text-sm font-medium opacity-50 cursor-not-allowed bg-gray-50 border-gray-100" disabled title="Not yet supported for practical exams">
                <i className="lni lni-envelope text-3xl text-gray-400"></i>
                Cover Letter
              </button>
              <button className="flex flex-col items-center justify-center p-4 border rounded-xl gap-2 text-sm font-medium opacity-50 cursor-not-allowed bg-gray-50 border-gray-100" disabled title="Not yet supported for practical exams">
                <i className="lni lni-list text-3xl text-gray-400"></i>
                Mark Sheet
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Confirm Modal */}
      {showConfirmModal && (
        <div className="perm-delete-overlay" style={{ position: 'fixed', zIndex: 500 }} onClick={() => setShowConfirmModal(false)}>
          <div className="perm-delete-card tab-panel-in" onClick={e => e.stopPropagation()}>
            <div className="perm-delete-icon"><i className="lni lni-warning"></i></div>
            <div className="perm-delete-title">Confirmation Required</div>
            <div className="perm-delete-sub">{confirmMessage}</div>
            <div className="perm-delete-actions">
              <button className="btn btn-neu" onClick={() => setShowConfirmModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={executeConfirm}>Continue</button>
            </div>
          </div>
        </div>
      )}

      <Toast toast={toast} />
    </div>
  )
}
