'use client'

import { useState } from 'react'
import { Toast } from '@/components/Toast'
import { SearchSelect } from '@/components/SearchSelect'
import { useIntakes } from '@/hooks/academic/useIntakes'
import { useEffect } from 'react'
import {
  useUeMaterialPrintPrograms,
  useUeMaterialPrintSemesters,
  useUeQuestionPrintCourseUnits,
  usePrintUeQuestionTheory,
  useDownloadUeQuestionTheoryPdf,
  useDownloadUeQuestionTheoryWord,
  useDeleteUeQuestionTheory,
  useDownloadUeQuestionTheoryAnswerKey,
  usePrintUeBooklet,
  useDownloadUeBookletPdf,
  useDownloadUeBookletAttendance,
  useDownloadUeBookletCover,
  useDownloadUeConsolidatedMarkSheet
} from '@/hooks/assessment/useUeMaterialPrint'

export default function UniversityExamMaterialPrintPage() {
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
  const { data: intakes, isLoading: intakeLoading } = useIntakes()
  const { data: programs, isLoading: programsLoading } = useUeMaterialPrintPrograms()

  // Pre-select current intake
  useEffect(() => {
    if (intakes && !selectedIntakeGuid) {
      const current = intakes.find((i: any) => i.currentIntake)
      if (current) setSelectedIntakeGuid(current.intakeGuid)
    }
  }, [intakes, selectedIntakeGuid])
  const { data: semesters, isLoading: semLoading } = useUeMaterialPrintSemesters(selectedProgramGuid || null)
  
  const isCourseUnitEnabled = !!selectedProgramGuid && !!selectedSemesterGuid
  const { data: courseUnits, isLoading: unitsLoading } = useUeQuestionPrintCourseUnits(
    selectedProgramGuid, selectedSemesterGuid, isCourseUnitEnabled
  )

  // API Hooks
  const printTheoryMut = usePrintUeQuestionTheory()
  const dlTheoryPdfMut = useDownloadUeQuestionTheoryPdf()
  const dlTheoryWordMut = useDownloadUeQuestionTheoryWord()
  const delTheoryMut = useDeleteUeQuestionTheory()
  const dlAnswerKeyMut = useDownloadUeQuestionTheoryAnswerKey()

  const printBookletMut = usePrintUeBooklet()
  const dlBookletPdfMut = useDownloadUeBookletPdf()
  const dlAttendanceMut = useDownloadUeBookletAttendance()
  const dlCoverMut = useDownloadUeBookletCover()
  const dlConsolidatedMut = useDownloadUeConsolidatedMarkSheet()

  const intakeGuid = selectedIntakeGuid || ''
  const isFormValid = !!intakeGuid && !!selectedProgramGuid && !!selectedSemesterGuid && !!selectedCourseUnitGuid

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

  // --- Actions ---

  // 1. QP Print
  const handlePrintQP = async (confirm = false) => {
    if (!isFormValid) return
    const req = {
      programGuid: selectedProgramGuid,
      semesterGuid: selectedSemesterGuid,
      courseUnitGuid: selectedCourseUnitGuid,
      intakeGuid,
      confirm
    }

    try {
      const res = await printTheoryMut.mutateAsync(req)

      if (res.outcome === 'ExamRuleNotSet') {
        showToast('University Exam not yet Scheduled!!', 'error')
      } else if (res.outcome === 'QuestionsNotAvailable') {
        showToast('Questions are not yet uploaded!!', 'error')
      } else if (res.outcome === 'ConfirmationRequired') {
        confirmAndExecute(res.message || 'Questions are already printed. Do you want to reprint the same?', () => handlePrintQP(true))
      } else if (res.outcome === 'Printed' || res.outcome === 'Reprinted') {
        showToast(`Question Paper ${res.outcome}! Downloading the PDF…`, 'success')
        // Spec step 3: on Printed/Reprinted, proceed to the PDF download.
        await handleDownload('QPPDF')
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to print QP', 'error')
    }
  }

  // 2. QP Delete
  const handleDeleteQP = async (confirm = false) => {
    if (!isFormValid) return
    const req = {
      programGuid: selectedProgramGuid,
      semesterGuid: selectedSemesterGuid,
      courseUnitGuid: selectedCourseUnitGuid,
      intakeGuid,
      confirm
    }

    try {
      const res = await delTheoryMut.mutateAsync(req)
      if (res.data === false && !confirm) {
        confirmAndExecute(res.message || 'You are about to delete the QP set. Do you want to continue?', () => handleDeleteQP(true))
      } else if (res.data === true) {
        showToast(res.message || 'Deleted successfully!', 'success')
      }
    } catch (err: any) {
      showToast(err.message || 'Could not delete QP.', 'error')
    }
  }

  // 3. Booklet Print
  const handlePrintBooklet = async (confirm = false) => {
    if (!isFormValid) return
    const req = {
      programGuid: selectedProgramGuid,
      semesterGuid: selectedSemesterGuid,
      courseUnitGuid: selectedCourseUnitGuid,
      intakeGuid,
      confirm
    }

    try {
      const res = await printBookletMut.mutateAsync(req)
      if (res.confirmationRequired && !confirm) {
        confirmAndExecute(res.message || 'Booklets are already printed. Do you want to reprint the same?', () => handlePrintBooklet(true))
      } else {
        if (res.wasReprint) {
          showToast(`Reprinted! Added ${res.addedStudentCount} students. (Total: ${res.totalStudentCount})`, 'success')
        } else {
          showToast(`Booklet printed! (Total: ${res.totalStudentCount})`, 'success')
        }
        // Spec step 2: once confirmationRequired is false, download the booklet PDF.
        await handleDownload('BookletPDF')
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to print booklet', 'error')
    }
  }

  // Download Handlers
  const handleDownload = async (type: 'QPPDF' | 'QPWord' | 'AnswerKey' | 'BookletPDF' | 'Attendance' | 'Cover' | 'Consolidated') => {
    if (!isFormValid) return
    const req = {
      programGuid: selectedProgramGuid,
      semesterGuid: selectedSemesterGuid,
      courseUnitGuid: selectedCourseUnitGuid,
      intakeGuid,
    }

    try {
      let mut: any
      let fallback = ''
      
      switch (type) {
        case 'QPPDF':
          mut = dlTheoryPdfMut
          fallback = 'QuestionPaper.pdf'
          break
        case 'QPWord':
          mut = dlTheoryWordMut
          fallback = 'QuestionPaper.doc'
          break
        case 'AnswerKey':
          mut = dlAnswerKeyMut
          fallback = 'AnswerKey.pdf'
          break
        case 'BookletPDF':
          mut = dlBookletPdfMut
          fallback = 'Booklet.pdf'
          break
        case 'Attendance':
          mut = dlAttendanceMut
          fallback = 'Attendance.pdf'
          break
        case 'Cover':
          mut = dlCoverMut
          fallback = 'CoverLetter.pdf'
          break
        case 'Consolidated':
          mut = dlConsolidatedMut
          fallback = 'ConsolidatedMarkSheet.pdf'
          break
      }

      const { blob, filename } = await mut.mutateAsync(req)
      downloadFile(blob, filename, fallback)
    } catch (err: any) {
      showToast(err.message || 'Failed to download document', 'error')
    }
  }

  const handleRefresh = () => {
    setSelectedProgramGuid('')
    setSelectedSemesterGuid('')
    setSelectedCourseUnitGuid('')
  }

  const isWorking = printTheoryMut.isPending || delTheoryMut.isPending || printBookletMut.isPending
  
  return (
    <div className="page active">
      <div className="pg-hdr flex justify-between items-end">
        <div>
          <h1 className="pg-title">University Exam Material Print</h1>
          <p className="pg-sub">Generate and print exam materials for a regular university exam cycle (Theory Only)</p>
        </div>
        <button className="btn btn-neu" onClick={handleRefresh}>
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
              disabled={intakeLoading}
              options={(intakes ?? []).map((i: any) => ({
                value: i.intakeGuid,
                label: `${i.description || i.intakeCode} ${i.currentIntake ? '(Current)' : ''}`,
              }))}
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
            <label className="lbl">Course Unit (Theory) <span className="text-red-500">*</span></label>
            <SearchSelect
              placeholder="— Select Course Unit —"
              value={selectedCourseUnitGuid}
              onChange={setSelectedCourseUnitGuid}
              disabled={!selectedSemesterGuid || unitsLoading}
              options={(courseUnits ?? []).map((u: any) => ({
                value: u.courseUnitGuid,
                label: `${u.courseUnitCode} - ${u.courseUnitName}`,
              }))}
            />
          </div>
        </div>

        <div className="p-5 pt-0 mt-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Question Paper Card */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <div className="bg-slate-50 px-5 py-4 border-b border-gray-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                <i className="lni lni-layout"></i>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 text-sm m-0">Question Paper Materials (Theory)</h3>
                <p className="text-xs text-gray-500 m-0">Generate & download QP</p>
              </div>
            </div>
            <div className="p-5 grid grid-cols-2 sm:grid-cols-3 gap-3">
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

              <button 
                className="flex flex-col items-center justify-center p-4 border rounded-xl gap-2 text-sm font-medium transition-all hover:border-primary hover:text-primary hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:hover:shadow-none disabled:hover:text-gray-700 bg-sky-50 border-sky-100"
                onClick={() => handleDownload('AnswerKey')}
                disabled={!isFormValid || isWorking}
              >
                <i className="lni lni-key text-3xl text-amber-500"></i>
                Answer Key
              </button>

              <button 
                className="flex flex-col items-center justify-center p-4 border rounded-xl gap-2 text-sm font-medium transition-all hover:border-red-500 hover:text-red-600 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:hover:shadow-none disabled:hover:text-gray-700 bg-red-50 border-red-100"
                onClick={() => handleDeleteQP()}
                disabled={!isFormValid || isWorking}
              >
                <i className="lni lni-trash-can text-3xl text-red-600"></i>
                Delete QP
              </button>
            </div>
          </div>

          {/* Booklet Card */}
          <div className="bg-amber-50 border-amber-100 border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <div className="bg-slate-50 px-5 py-4 border-b border-gray-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                <i className="lni lni-book"></i>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 text-sm m-0">Booklet & Registers</h3>
                <p className="text-xs text-gray-500 m-0">Merge students & download files</p>
              </div>
            </div>
            <div className="p-5 grid grid-cols-2 sm:grid-cols-3 gap-3">
              <button 
                className="flex flex-col items-center justify-center p-4 border rounded-xl gap-2 text-sm font-medium transition-all hover:border-indigo-500 hover:text-indigo-600 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:hover:shadow-none disabled:hover:text-gray-700 bg-white"
                onClick={() => handlePrintBooklet()}
                disabled={!isFormValid || isWorking}
              >
                <i className="lni lni-printer text-3xl text-indigo-500"></i>
                Print Booklet
              </button>

              <button 
                className="flex flex-col items-center justify-center p-4 border rounded-xl gap-2 text-sm font-medium transition-all hover:border-indigo-500 hover:text-indigo-600 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:hover:shadow-none disabled:hover:text-gray-700 bg-indigo-50 border-indigo-100"
                onClick={() => handleDownload('BookletPDF')}
                disabled={!isFormValid || isWorking}
              >
                <i className="lni lni-empty-file text-3xl text-gray-600"></i>
                Booklet PDF
              </button>

              <button 
                className="flex flex-col items-center justify-center p-4 border rounded-xl gap-2 text-sm font-medium transition-all hover:border-indigo-500 hover:text-indigo-600 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:hover:shadow-none disabled:hover:text-gray-700 bg-gray-50 border-gray-200"
                onClick={() => handleDownload('Attendance')}
                disabled={!isFormValid || isWorking}
              >
                <i className="lni lni-users text-3xl text-green-600"></i>
                Attendance
              </button>

              <button 
                className="flex flex-col items-center justify-center p-4 border rounded-xl gap-2 text-sm font-medium transition-all hover:border-indigo-500 hover:text-indigo-600 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:hover:shadow-none disabled:hover:text-gray-700 bg-emerald-50 border-emerald-100"
                onClick={() => handleDownload('Cover')}
                disabled={!isFormValid || isWorking}
              >
                <i className="lni lni-envelope text-3xl text-orange-500"></i>
                Cover Letter
              </button>

              <button 
                className="flex flex-col items-center justify-center p-4 border rounded-xl gap-2 text-sm font-medium transition-all hover:border-indigo-500 hover:text-indigo-600 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:hover:shadow-none disabled:hover:text-gray-700 bg-orange-50 border-orange-100"
                onClick={() => handleDownload('Consolidated')}
                disabled={!isFormValid || isWorking}
              >
                <i className="lni lni-list text-3xl text-purple-600"></i>
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
