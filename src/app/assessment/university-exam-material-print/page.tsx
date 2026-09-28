'use client'

import { useState, useMemo } from 'react'
import { Toast } from '@/components/Toast'
import { SearchSelect } from '@/components/SearchSelect'
import {
  useUeMaterialPrintPrograms,
  useUeMaterialPrintSemesters,
  useUeMaterialPrintCourseUnits,
  usePrintUeBooklet,
  useDownloadUeBookletPdf,
  usePrintUeQuestionTheory,
  useDownloadUeQuestionTheoryWord,
  usePrintUeQuestionPractical,
  useDownloadUeQuestionPracticalWord,
} from '@/hooks/assessment/useUeMaterialPrint'
import { useIaCreationInit } from '@/hooks/assessment/useIaCreation'

export default function UniversityExamMaterialPrintPage() {
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)

  // Dropdown States
  const [selectedIntakeGuid, setSelectedIntakeGuid] = useState<string>('')
  const [selectedProgramGuid, setSelectedProgramGuid] = useState<string>('')
  const [selectedSemesterGuid, setSelectedSemesterGuid] = useState<string>('')
  const [selectedCourseUnitGuid, setSelectedCourseUnitGuid] = useState<string>('')
  const [selectedPrintType, setSelectedPrintType] = useState<'Theory' | 'Practical' | null>(null)

  // API Hooks
  const { data: initData, isLoading: initLoading } = useIaCreationInit()
  const { data: programs, isLoading: programsLoading } = useUeMaterialPrintPrograms()
  const { data: semesters, isLoading: semLoading } = useUeMaterialPrintSemesters(selectedProgramGuid || null)
  const { data: allCourseUnits, isLoading: unitsLoading } = useUeMaterialPrintCourseUnits(selectedProgramGuid || null)

  const printBookletMut = usePrintUeBooklet()
  const downloadBookletMut = useDownloadUeBookletPdf()
  const printTheoryMut = usePrintUeQuestionTheory()
  const downloadTheoryMut = useDownloadUeQuestionTheoryWord()
  const printPracticalMut = usePrintUeQuestionPractical()
  const downloadPracticalMut = useDownloadUeQuestionPracticalWord()

  const showToast = (msg: string, type = '') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  // Filter units for the selected semester
  const courseUnits = useMemo(() => {
    if (!allCourseUnits || !selectedSemesterGuid) return []
    return allCourseUnits.filter(u => u.semesterGuid === selectedSemesterGuid)
  }, [allCourseUnits, selectedSemesterGuid])

  // Get the selected unit's type (Theory, Practical, Combined, Project)
  const selectedUnitType = useMemo(() => {
    if (!selectedCourseUnitGuid || !courseUnits) return null
    return courseUnits.find(u => u.courseUnitGuid === selectedCourseUnitGuid)?.unitTypeName || null
  }, [selectedCourseUnitGuid, courseUnits])

  // Determine the effective type for printing (handles Combined)
  const effectivePrintType = useMemo(() => {
    if (selectedUnitType === 'Combined') return selectedPrintType
    return selectedUnitType
  }, [selectedUnitType, selectedPrintType])

  const handleProgramChange = (guid: string) => {
    setSelectedProgramGuid(guid)
    setSelectedSemesterGuid('')
    setSelectedCourseUnitGuid('')
    setSelectedPrintType(null)
  }

  const handleSemesterChange = (guid: string) => {
    setSelectedSemesterGuid(guid)
    setSelectedCourseUnitGuid('')
    setSelectedPrintType(null)
  }

  const handleCourseUnitChange = (guid: string) => {
    setSelectedCourseUnitGuid(guid)
    setSelectedPrintType(null)
  }

  const handleRefresh = () => {
    setSelectedIntakeGuid('')
    setSelectedProgramGuid('')
    setSelectedSemesterGuid('')
    setSelectedCourseUnitGuid('')
    setSelectedPrintType(null)
  }

  const isFormValid = !!selectedIntakeGuid && !!selectedProgramGuid && !!selectedSemesterGuid && !!selectedCourseUnitGuid
  const isQuestionPaperValid = isFormValid && !!effectivePrintType

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

  const handlePrintBooklet = async () => {
    if (!isFormValid) return
    try {
      const req = {
        programGuid: selectedProgramGuid,
        semesterGuid: selectedSemesterGuid,
        courseUnitGuid: selectedCourseUnitGuid,
        intakeGuid: selectedIntakeGuid
      }
      const printRes = await printBookletMut.mutateAsync(req)
      if (printRes.wasReprint) {
        showToast(`Reprinted! Added ${printRes.addedStudentCount} newly eligible students. (Total: ${printRes.totalStudentCount})`, 'success')
      } else {
        showToast(`Printed! Total students: ${printRes.totalStudentCount}`, 'success')
      }

      const { blob, filename } = await downloadBookletMut.mutateAsync(req)
      downloadFile(blob, filename, 'booklet.pdf')
    } catch (err: any) {
      showToast(err.message || 'Failed to print booklet', 'error')
    }
  }

  const handlePrintQuestionPaper = async () => {
    if (!isQuestionPaperValid) return
    try {
      const req = {
        programGuid: selectedProgramGuid,
        semesterGuid: selectedSemesterGuid,
        courseUnitGuid: selectedCourseUnitGuid,
        intakeGuid: selectedIntakeGuid
      }

      if (effectivePrintType === 'Theory') {
        const printRes = await printTheoryMut.mutateAsync(req)
        if (printRes.outcome === 'ExamRuleNotSet') {
          showToast('University exam not scheduled or exam rule not set.', 'error')
          return
        }
        if (printRes.outcome === 'QuestionsNotAvailable') {
          showToast('Questions are not yet uploaded for all sections.', 'error')
          return
        }
        
        showToast(`Question Paper ${printRes.outcome}!`, 'success')
        const { blob, filename } = await downloadTheoryMut.mutateAsync(req)
        downloadFile(blob, filename, 'theory_question_paper.doc')

      } else if (effectivePrintType === 'Practical') {
        const printRes = await printPracticalMut.mutateAsync(req)
        if (printRes.outcome === 'ExamRuleNotSet') {
          showToast('University exam not scheduled or exam rule not set.', 'error')
          return
        }
        if (printRes.outcome === 'QuestionsNotAvailable') {
          showToast('Questions are not yet uploaded for all sections.', 'error')
          return
        }

        showToast(`Question Paper ${printRes.outcome}!`, 'success')
        const { blob, filename } = await downloadPracticalMut.mutateAsync(req)
        downloadFile(blob, filename, 'practical_question_paper.doc')
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to print question paper', 'error')
    }
  }

  return (
    <div className="page active">
      <div className="pg-hdr">
        <div>
          <h1 className="pg-title">University Exam Material Print</h1>
          <p className="pg-sub">Print exam booklets and generate MS Word question papers</p>
        </div>
      </div>

      <div className="card mb-5">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-5">
          <div className="fg mb-0">
            <label className="lbl">Academic Session <span className="text-red-500">*</span></label>
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
              disabled={programsLoading}
              options={(programs ?? []).map(p => ({
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
              options={courseUnits.map(u => ({
                value: u.courseUnitGuid,
                label: `${u.courseUnitCode} - ${u.courseUnitName}`,
              }))}
            />
          </div>
        </div>

        {selectedUnitType === 'Combined' && (
          <div className="px-5 pb-5">
            <label className="lbl mb-2">Print Type <span className="text-red-500">*</span></label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="printType"
                  checked={selectedPrintType === 'Theory'}
                  onChange={() => setSelectedPrintType('Theory')}
                  className="accent-primary"
                />
                <span className="text-sm">Theory</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="printType"
                  checked={selectedPrintType === 'Practical'}
                  onChange={() => setSelectedPrintType('Practical')}
                  className="accent-primary"
                />
                <span className="text-sm">Practical</span>
              </label>
            </div>
          </div>
        )}

        <div className="p-5 pt-0 flex gap-2 flex-wrap">
          <button 
             className="btn btn-primary" 
             disabled={!isFormValid || printBookletMut.isPending || downloadBookletMut.isPending}
             onClick={handlePrintBooklet}
          >
             {printBookletMut.isPending || downloadBookletMut.isPending ? (
               <><i className="lni lni-spinner-solid animate-spin"></i> Printing...</>
             ) : (
               'Print Booklet'
             )}
          </button>
          
          {selectedUnitType !== 'Project' && (
            <button 
               className="btn btn-secondary flex items-center gap-2" 
               disabled={!isQuestionPaperValid || printTheoryMut.isPending || downloadTheoryMut.isPending || printPracticalMut.isPending || downloadPracticalMut.isPending}
               onClick={handlePrintQuestionPaper}
            >
              {(printTheoryMut.isPending || downloadTheoryMut.isPending || printPracticalMut.isPending || downloadPracticalMut.isPending) ? (
                <><i className="lni lni-spinner-solid animate-spin"></i> Generating...</>
              ) : (
                <>
                  <i className="lni lni-wordpress"></i> QP Print in MS Word
                </>
              )}
            </button>
          )}

          <button 
             className="btn btn-neu"
             onClick={handleRefresh}
          >
             Refresh
          </button>
        </div>
      </div>
      <Toast toast={toast} />
    </div>
  )
}
