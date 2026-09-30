'use client'

import { useState, useMemo } from 'react'
import { Toast } from '@/components/Toast'
import { SearchSelect } from '@/components/SearchSelect'
import { useCurrentAcademicIntake } from '@/hooks/academic/useIntakes'
import {
  useUePracticalPrintPrograms as usePrograms,
  useUePracticalPrintSemesters as useSemesters,
  useUePracticalProgramUnits as useProgramUnits,
  usePrintUeQuestionPractical,
  useDownloadUeQuestionPracticalWord,
  useDeleteUeQuestionPractical
} from '@/hooks/assessment/useUePracticalPrint'
import {
  usePrintUeQuestionTheory,
  useDownloadUeQuestionTheoryWord,
  usePrintUeBooklet,
  useDownloadUeBookletPdf
} from '@/hooks/assessment/useUeMaterialPrint'

export default function UniversityExamQpBookletPrintPage() {
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)
  const showToast = (msg: string, type = '') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  // Dropdown States
  const [selectedProgramGuid, setSelectedProgramGuid] = useState<string>('')
  const [selectedSemesterGuid, setSelectedSemesterGuid] = useState<string>('')
  const [selectedCourseUnitGuid, setSelectedCourseUnitGuid] = useState<string>('')
  
  // Combined Unit Radio State
  const [combinedType, setCombinedType] = useState<'Theory' | 'Practical'>('Theory')

  // Modals for confirmation
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null)
  const [confirmMessage, setConfirmMessage] = useState('')

  // Data Hooks
  const { data: currentIntake, isLoading: intakeLoading } = useCurrentAcademicIntake()
  const { data: programs, isLoading: programsLoading } = usePrograms()
  const { data: semesters, isLoading: semLoading } = useSemesters(selectedProgramGuid || null)
  const { data: allProgramUnits, isLoading: unitsLoading } = useProgramUnits(selectedProgramGuid || null)

  const intakeGuid = currentIntake?.intakeGuid || ''

  const courseUnits = useMemo(() => {
    if (!allProgramUnits || !selectedSemesterGuid) return []
    return allProgramUnits.filter((u: any) => u.semesterGuid === selectedSemesterGuid)
  }, [allProgramUnits, selectedSemesterGuid])

  const selectedUnit = useMemo(() => {
    return courseUnits.find((u: any) => u.courseUnitGuid === selectedCourseUnitGuid)
  }, [courseUnits, selectedCourseUnitGuid])

  const unitTypeName = selectedUnit?.unitTypeName || ''
  
  const effectiveType = useMemo(() => {
    if (unitTypeName === 'Combined') return combinedType
    if (unitTypeName === 'Project') return 'Project'
    if (unitTypeName === 'Practical') return 'Practical'
    return 'Theory' // default or actual theory
  }, [unitTypeName, combinedType])

  const isFormValid = !!intakeGuid && !!selectedProgramGuid && !!selectedSemesterGuid && !!selectedCourseUnitGuid

  // API Hooks - Theory
  const printTheoryMut = usePrintUeQuestionTheory()
  const dlTheoryWordMut = useDownloadUeQuestionTheoryWord()
  
  // API Hooks - Practical
  const printPracticalMut = usePrintUeQuestionPractical()
  const dlPracticalWordMut = useDownloadUeQuestionPracticalWord()
  const delPracticalMut = useDeleteUeQuestionPractical()

  // API Hooks - Booklet
  const printBookletMut = usePrintUeBooklet()
  const dlBookletPdfMut = useDownloadUeBookletPdf()

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
  const handleCourseUnitChange = (guid: string) => {
    setSelectedCourseUnitGuid(guid)
    setCombinedType('Theory') // reset
  }
  const handleRefresh = () => {
    setSelectedProgramGuid('')
    setSelectedSemesterGuid('')
    setSelectedCourseUnitGuid('')
    setCombinedType('Theory')
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
      let res: any
      if (effectiveType === 'Practical') {
        res = await printPracticalMut.mutateAsync(req)
      } else {
        res = await printTheoryMut.mutateAsync(req)
      }

      if (res.outcome === 'ExamRuleNotSet') {
        showToast('University Exam not yet Scheduled!!', 'error')
      } else if (res.outcome === 'QuestionsNotAvailable') {
        showToast('Questions are not yet uploaded!!', 'error')
      } else if (res.outcome === 'ConfirmationRequired') {
        confirmAndExecute(res.message || 'Questions are already printed. Do you want to reprint the same?', () => handlePrintQP(true))
      } else if (res.outcome === 'Printed' || res.outcome === 'Reprinted') {
        showToast(`Question Paper ${res.outcome}!`, 'success')
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to print QP', 'error')
    }
  }

  // 2. QP Delete (Practical Only)
  const handleDeletePracticalQP = async (confirm = false) => {
    if (!isFormValid || effectiveType !== 'Practical') return
    const req = {
      programGuid: selectedProgramGuid,
      semesterGuid: selectedSemesterGuid,
      courseUnitGuid: selectedCourseUnitGuid,
      intakeGuid,
      confirm
    }
    try {
      const res = await delPracticalMut.mutateAsync(req)
      if (res.data === false && !confirm) {
        confirmAndExecute(res.message || 'You are about to delete the QP set. Do you want to continue?', () => handleDeletePracticalQP(true))
      } else if (res.data === true) {
        showToast(res.message || 'Deleted successfully!', 'success')
      }
    } catch (err: any) {
      showToast(err.message || 'Could not delete QP.', 'error')
    }
  }

  // 3. Booklet Print
  const handlePrintBooklet = async (confirm = false) => {
    if (!isFormValid || effectiveType !== 'Theory') return
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
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to print booklet', 'error')
    }
  }

  // 4. Download Handlers
  const handleDownload = async (type: 'QPWord' | 'BookletPDF') => {
    if (!isFormValid) return
    const req = {
      programGuid: selectedProgramGuid,
      semesterGuid: selectedSemesterGuid,
      courseUnitGuid: selectedCourseUnitGuid,
      intakeGuid,
    }
    try {
      if (type === 'QPWord') {
        const mut = effectiveType === 'Practical' ? dlPracticalWordMut : dlTheoryWordMut
        const { blob, filename } = await mut.mutateAsync(req)
        downloadFile(blob, filename, 'QuestionPaper.doc')
      } else if (type === 'BookletPDF') {
        const { blob, filename } = await dlBookletPdfMut.mutateAsync(req)
        downloadFile(blob, filename, 'Booklet.pdf')
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to download document', 'error')
    }
  }

  const isWorking = printTheoryMut.isPending || printPracticalMut.isPending || delPracticalMut.isPending || printBookletMut.isPending

  return (
    <div className="page active">
      <div className="pg-hdr flex justify-between items-end">
        <div>
          <h1 className="pg-title">University Exam QP/Booklet Print</h1>
          <p className="pg-sub">Lean print console for multi-type units (Theory, Practical, Combined, Project)</p>
        </div>
        <button className="btn btn-neu" onClick={handleRefresh}>
          <i className="lni lni-reload"></i> Refresh
        </button>
      </div>

      <div className="card mb-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5 border-b border-gray-100">
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
            <label className="lbl">Course Unit <span className="text-red-500">*</span></label>
            <SearchSelect
              placeholder="— Select Course Unit —"
              value={selectedCourseUnitGuid}
              onChange={handleCourseUnitChange}
              disabled={!selectedSemesterGuid || unitsLoading}
              options={courseUnits.map((u: any) => ({
                value: u.courseUnitGuid,
                label: `${u.courseUnitCode} - ${u.courseUnitName} (${u.unitTypeName})`,
              }))}
            />
          </div>
        </div>
        
        {unitTypeName === 'Combined' && (
          <div className="p-4 px-6 bg-slate-50 border-b border-gray-100 flex items-center gap-6">
            <span className="font-semibold text-sm text-gray-700">Select Exam Component:</span>
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="radio" 
                name="combinedType" 
                value="Theory" 
                checked={combinedType === 'Theory'} 
                onChange={() => setCombinedType('Theory')} 
                className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <span className="text-sm font-medium text-gray-700">Theory</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="radio" 
                name="combinedType" 
                value="Practical" 
                checked={combinedType === 'Practical'} 
                onChange={() => setCombinedType('Practical')} 
                className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <span className="text-sm font-medium text-gray-700">Practical</span>
            </label>
          </div>
        )}

        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Question Paper Card (Hidden for Project) */}
          {unitTypeName !== 'Project' && (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <div className="bg-slate-50 px-5 py-4 border-b border-gray-100 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                  <i className="lni lni-layout"></i>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 text-sm m-0">Question Paper ({effectiveType})</h3>
                  <p className="text-xs text-gray-500 m-0">Generate & download Word doc</p>
                </div>
              </div>
              <div className="p-5 grid grid-cols-2 gap-3">
                <button 
                  className="flex flex-col items-center justify-center p-4 border rounded-xl gap-2 text-sm font-medium transition-all hover:border-blue-300 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:hover:shadow-none disabled:hover:text-gray-700 bg-blue-50 border-blue-100"
                  onClick={() => handlePrintQP()}
                  disabled={!isFormValid || isWorking}
                >
                  <i className="lni lni-printer text-3xl text-primary"></i>
                  Generate QP
                </button>

                <button 
                  className="flex flex-col items-center justify-center p-4 border rounded-xl gap-2 text-sm font-medium transition-all hover:border-sky-300 hover:bg-sky-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:hover:shadow-none disabled:hover:text-gray-700 bg-sky-50 border-sky-100"
                  onClick={() => handleDownload('QPWord')}
                  disabled={!isFormValid || isWorking}
                >
                  <i className="lni lni-wordpress text-3xl text-blue-500"></i>
                  Word Format
                </button>
                
                {effectiveType === 'Practical' && (
                  <button 
                    className="flex flex-col items-center justify-center p-4 border rounded-xl gap-2 text-sm font-medium transition-all hover:border-red-500 hover:text-red-600 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:hover:shadow-none disabled:hover:text-gray-700 bg-red-50 border-red-100 col-span-2"
                    onClick={() => handleDeletePracticalQP()}
                    disabled={!isFormValid || isWorking}
                  >
                    <i className="lni lni-trash-can text-3xl text-red-600"></i>
                    Delete Practical QP
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Booklet Card */}
          <div className={`bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm ${effectiveType !== 'Theory' ? 'opacity-70' : ''}`}>
            <div className="bg-slate-50 px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                  <i className="lni lni-book"></i>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 text-sm m-0">Exam Booklet</h3>
                  <p className="text-xs text-gray-500 m-0">
                    {effectiveType === 'Theory' ? 'Merge students & print' : 'Theory only for now'}
                  </p>
                </div>
              </div>
              {effectiveType !== 'Theory' && (
                <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded font-semibold uppercase">Pending</span>
              )}
            </div>
            <div className="p-5 grid grid-cols-2 gap-3">
              <button 
                className={`flex flex-col items-center justify-center p-4 border rounded-xl gap-2 text-sm font-medium transition-all ${effectiveType === 'Theory' ? 'hover:border-indigo-300 hover:bg-indigo-100 bg-indigo-50 border-indigo-100' : 'bg-gray-50 border-gray-200 opacity-50 cursor-not-allowed'} disabled:opacity-50`}
                onClick={() => handlePrintBooklet()}
                disabled={!isFormValid || isWorking || effectiveType !== 'Theory'}
                title={effectiveType !== 'Theory' ? "Booklets currently only supported for Theory" : ""}
              >
                <i className={`lni lni-printer text-3xl ${effectiveType === 'Theory' ? 'text-indigo-500' : 'text-gray-400'}`}></i>
                Print Booklet
              </button>

              <button 
                className={`flex flex-col items-center justify-center p-4 border rounded-xl gap-2 text-sm font-medium transition-all ${effectiveType === 'Theory' ? 'hover:border-gray-300 hover:bg-gray-200 bg-gray-50 border-gray-200' : 'bg-gray-50 border-gray-200 opacity-50 cursor-not-allowed'} disabled:opacity-50`}
                onClick={() => handleDownload('BookletPDF')}
                disabled={!isFormValid || isWorking || effectiveType !== 'Theory'}
                title={effectiveType !== 'Theory' ? "Booklets currently only supported for Theory" : ""}
              >
                <i className={`lni lni-empty-file text-3xl ${effectiveType === 'Theory' ? 'text-gray-600' : 'text-gray-400'}`}></i>
                Booklet PDF
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Confirm Modal */}
      {showConfirmModal && (
        <div className="modal show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirmation Required</h5>
              </div>
              <div className="modal-body text-center p-5">
                <p>{confirmMessage}</p>
                <div className="flex justify-center gap-3 mt-4">
                  <button className="btn btn-neu" onClick={() => setShowConfirmModal(false)}>Cancel</button>
                  <button className="btn btn-primary" onClick={executeConfirm}>Continue</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <Toast toast={toast} />
    </div>
  )
}
