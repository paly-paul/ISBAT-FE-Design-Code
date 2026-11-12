'use client'

import { useEffect, useMemo, useState } from 'react'
import { SearchSelect } from '@/components/SearchSelect'
import { Toast } from '@/components/Toast'
import { useCurrentAcademicIntake, useIntakesDropdown } from '@/hooks/academic/useIntakes'
import { usePagePermissions } from '@/hooks/users/usePagePermissions'
import {
  useDownloadUeBookletPdf,
  useDownloadUeQuestionTheoryWord,
  usePrintUeBooklet,
  usePrintUeQuestionTheory,
  useUeMaterialPrintPrograms,
  useUeMaterialPrintProgramUnits,
  useUeMaterialPrintSemesters,
  useUeQuestionPrintCourseUnits,
  useDownloadUeQuestionTheoryPdf,
  useDeleteUeQuestionTheory,
  useDownloadUeQuestionTheoryAnswerKey,
  useDownloadUeBookletAttendance,
  useDownloadUeBookletCover,
  useDownloadUeConsolidatedMarkSheet,
} from '@/hooks/assessment/useUeMaterialPrint'
import {
  useDownloadUeQuestionPracticalWord,
  usePrintUeQuestionPractical,
  useDownloadUeQuestionPracticalPdf,
  useDeleteUeQuestionPractical,
} from '@/hooks/assessment/useUePracticalPrint'

type EffectiveType = 'Theory' | 'Practical' | 'Project'

function unitType(value?: string | null): EffectiveType | 'Combined' {
  switch ((value ?? '').trim().toLowerCase()) {
    case 'practical': return 'Practical'
    case 'project': return 'Project'
    case 'combined': return 'Combined'
    default: return 'Theory'
  }
}

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

export default function UniversityExamMaterialPrintPage() {
  const permissions = usePagePermissions()
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [selectedIntakeGuid, setSelectedIntakeGuid] = useState('')
  const [programGuid, setProgramGuid] = useState('')
  const [semesterGuid, setSemesterGuid] = useState('')
  const [courseUnitGuid, setCourseUnitGuid] = useState('')
  const [combinedType, setCombinedType] = useState<'Theory' | 'Practical'>('Theory')
  const [confirmation, setConfirmation] = useState<{ message: string; action: () => void } | null>(null)
  const [activeAction, setActiveAction] = useState<string | null>(null)

  const showToast = (msg: string, type = '') => {
    setToast({ msg, type })
    window.setTimeout(() => setToast(null), 3500)
  }

  const { data: currentIntake, isLoading: currentIntakeLoading } = useCurrentAcademicIntake()
  const { data: allIntakes, isLoading: allIntakesLoading } = useIntakesDropdown()
  const intakeLoading = currentIntakeLoading || allIntakesLoading

  const intakeOptions = useMemo(() => {
    if (currentIntake) {
      return [{
        value: currentIntake.intakeGuid,
        label: `${currentIntake.description || currentIntake.intakeCode} (Current)`,
      }]
    }
    const currentFromAll = (allIntakes ?? []).filter(i => i.currentIntake)
    if (currentFromAll.length > 0) {
      return currentFromAll.map(i => ({
        value: i.intakeGuid,
        label: `${i.description || i.intakeCode} (Current)`,
      }))
    }
    if ((allIntakes ?? []).length > 0) {
      const fallback = allIntakes![0]
      return [{
        value: fallback.intakeGuid,
        label: `${fallback.description || fallback.intakeCode} (Current)`,
      }]
    }
    return []
  }, [currentIntake, allIntakes])

  useEffect(() => {
    if (!selectedIntakeGuid && intakeOptions.length > 0) {
      setSelectedIntakeGuid(intakeOptions[0].value)
    }
  }, [intakeOptions, selectedIntakeGuid])

  const { data: programs, isLoading: programsLoading } = useUeMaterialPrintPrograms()
  const { data: semesters, isLoading: semestersLoading } = useUeMaterialPrintSemesters(programGuid || null)
  const { data: courseUnits, isLoading: unitsLoading } = useUeQuestionPrintCourseUnits(
    programGuid, semesterGuid, Boolean(programGuid && semesterGuid), selectedIntakeGuid || currentIntake?.intakeGuid, ['Theory', 'Combined']
  )
  const { data: programUnits } = useUeMaterialPrintProgramUnits(programGuid || null)

  const selectedUnitRow = useMemo(() => {
    if (!courseUnitGuid) return null
    // 1. Try finding in programUnits with semester match (case-insensitive)
    const exact = (programUnits ?? []).find(unit =>
      unit.courseUnitGuid?.toLowerCase() === courseUnitGuid.toLowerCase() &&
      unit.semesterGuid?.toLowerCase() === semesterGuid?.toLowerCase()
    )
    if (exact) return exact

    // 2. Try finding in programUnits by courseUnitGuid alone (case-insensitive)
    const byUnit = (programUnits ?? []).find(unit =>
      unit.courseUnitGuid?.toLowerCase() === courseUnitGuid.toLowerCase()
    )
    if (byUnit) return byUnit

    // 3. Try finding in courseUnits (from ue-question-print/course-units)
    const fromCourseUnits = (courseUnits ?? []).find((unit: any) =>
      unit.courseUnitGuid?.toLowerCase() === courseUnitGuid.toLowerCase()
    )
    return fromCourseUnits ?? null
  }, [courseUnitGuid, courseUnits, programUnits, semesterGuid])

  const selectedUnitType = useMemo(() => {
    const rawType = (selectedUnitRow as any)?.unitTypeName
      || (selectedUnitRow as any)?.unitType
      || (selectedUnitRow as any)?.courseUnitType
    return unitType(rawType)
  }, [selectedUnitRow])

  const effectiveType: EffectiveType = selectedUnitType === 'Combined' ? combinedType : selectedUnitType
  const intakeGuid = selectedIntakeGuid || currentIntake?.intakeGuid || ''
  const formComplete = Boolean(intakeGuid && programGuid && semesterGuid && courseUnitGuid)

  // Permissions mapping
  const canPrint = permissions.print !== false && Boolean(
    permissions.print || permissions.generate || permissions.add || permissions.view || permissions.get
  )
  const canDelete = Boolean(
    permissions.delete || permissions.edit || permissions.add || permissions.print || permissions.view || permissions.get
  )
  const canGetAnswerKeyPermission = (permissions as any).getanswerkey !== false && Boolean(
    (permissions as any).getanswerkey || permissions.get || permissions.view || permissions.print
  )
  const canGetAttendancePermission = (permissions as any).getattendancesheet !== false && Boolean(
    (permissions as any).getattendancesheet || permissions.get || permissions.view || permissions.print
  )
  const canGetCoverLetterPermission = (permissions as any).getcoverletter !== false && Boolean(
    (permissions as any).getcoverletter || permissions.get || permissions.view || permissions.print
  )
  const canGetConsolidatedPermission = permissions.get !== false && Boolean(
    permissions.get || permissions.view || permissions.print
  )

  const canPrintBooklet = formComplete && canPrint
  const canPrintQuestionPaperWord = formComplete && canPrint
  const canPrintQuestionPaperPdf = formComplete && canPrint
  const canDeleteQuestionPaper = formComplete && canDelete
  const canGetAnswerKey = formComplete && canGetAnswerKeyPermission && effectiveType !== 'Practical'
  const canGetAttendance = formComplete && canGetAttendancePermission
  const canGetCoverLetter = formComplete && canGetCoverLetterPermission
  const canGetConsolidated = formComplete && canGetConsolidatedPermission

  // Hook instances
  const printBooklet = usePrintUeBooklet()
  const downloadBooklet = useDownloadUeBookletPdf()
  const downloadAttendance = useDownloadUeBookletAttendance()
  const downloadCover = useDownloadUeBookletCover()
  const downloadConsolidated = useDownloadUeConsolidatedMarkSheet()

  const printTheory = usePrintUeQuestionTheory()
  const downloadTheoryWord = useDownloadUeQuestionTheoryWord()
  const downloadTheoryPdf = useDownloadUeQuestionTheoryPdf()
  const deleteTheory = useDeleteUeQuestionTheory()
  const downloadTheoryAnswerKey = useDownloadUeQuestionTheoryAnswerKey()

  const printPractical = usePrintUeQuestionPractical()
  const downloadPracticalWord = useDownloadUeQuestionPracticalWord()
  const downloadPracticalPdf = useDownloadUeQuestionPracticalPdf()
  const deletePractical = useDeleteUeQuestionPractical()

  const isWorking = activeAction !== null ||
    printBooklet.isPending || downloadBooklet.isPending ||
    downloadAttendance.isPending || downloadCover.isPending || downloadConsolidated.isPending ||
    printTheory.isPending || downloadTheoryWord.isPending || downloadTheoryPdf.isPending ||
    deleteTheory.isPending || downloadTheoryAnswerKey.isPending ||
    printPractical.isPending || downloadPracticalWord.isPending || downloadPracticalPdf.isPending ||
    deletePractical.isPending

  const request = (confirm = false) => ({
    programGuid,
    semesterGuid,
    courseUnitGuid,
    intakeGuid,
    streamGuid: (selectedUnitRow as any)?.streamGuid ?? null,
    confirm,
  })

  const reset = () => {
    setProgramGuid('')
    setSemesterGuid('')
    setCourseUnitGuid('')
    setCombinedType('Theory')
    setValidationError(null)
    setActiveAction(null)
    if (intakeOptions.length > 0) {
      setSelectedIntakeGuid(intakeOptions[0].value)
    }
  }

  const download = (blob: Blob, filename: string | null, fallback: string) => {
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename || fallback
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  }

  // 1. Booklet Print
  const handleBookletPrint = async (confirm = false) => {
    if (!canPrintBooklet || isWorking) return
    setValidationError(null)
    setActiveAction('booklet')
    try {
      const result = await printBooklet.mutateAsync(request(confirm))
      if (result.confirmationRequired && !confirm) {
        setActiveAction(null)
        setConfirmation({
          message: result.message || 'Booklets are already printed. Do you want to reprint the same?',
          action: () => handleBookletPrint(true),
        })
        return
      }
      const file = await downloadBooklet.mutateAsync(request())
      download(file.blob, file.filename, 'Booklet.pdf')
      showToast(result.wasReprint ? 'Booklet reprinted successfully.' : 'Booklet downloaded successfully.', 'success')
    } catch (error: any) {
      const errMsg = error?.message || 'Failed to print booklet. Please verify enrollment and exam schedules.'
      setValidationError(errMsg)
      showToast(errMsg, 'error')
    } finally {
      setActiveAction(null)
    }
  }

  // 2. Question Paper Print (Word or PDF)
  const handleQuestionPaperPrint = async (format: 'word' | 'pdf', confirm = false) => {
    const allowed = format === 'word' ? canPrintQuestionPaperWord : canPrintQuestionPaperPdf
    if (!allowed || isWorking) return
    setValidationError(null)
    setActiveAction(format === 'word' ? 'qp-word' : 'qp-pdf')
    try {
      const result = effectiveType === 'Practical'
        ? await printPractical.mutateAsync(request(confirm))
        : await printTheory.mutateAsync(request(confirm))

      const { outcome, message } = parseOutcome(result)

      if (outcome === 'ConfirmationRequired') {
        setActiveAction(null)
        setConfirmation({
          message: message || 'Questions are already printed. Do you want to reprint the same?',
          action: () => handleQuestionPaperPrint(format, true),
        })
        return
      }
      if (outcome === 'ExamRuleNotSet') {
        const msg = message || 'University Exam not yet Scheduled for this course unit!!'
        setValidationError(msg)
        showToast(msg, 'error')
        return
      }
      if (outcome === 'QuestionsNotAvailable') {
        const msg = message || 'Questions are not yet uploaded for this course unit!!'
        setValidationError(msg)
        showToast(msg, 'error')
        return
      }
      if (outcome === 'Printed' || outcome === 'Reprinted') {
        setValidationError(null)
        if (format === 'pdf') {
          const file = effectiveType === 'Practical'
            ? await downloadPracticalPdf.mutateAsync(request())
            : await downloadTheoryPdf.mutateAsync(request())
          download(file.blob, file.filename, 'QuestionPaper.pdf')
        } else {
          const file = effectiveType === 'Practical'
            ? await downloadPracticalWord.mutateAsync(request())
            : await downloadTheoryWord.mutateAsync(request())
          download(file.blob, file.filename, 'QuestionPaper.doc')
        }
        showToast(message || (outcome === 'Reprinted' ? 'Question paper reprinted successfully.' : 'Question paper downloaded successfully.'), 'success')
        return
      }

      // Fallback: If print completed without a blocking outcome, proceed to download requested format
      try {
        if (format === 'pdf') {
          const file = effectiveType === 'Practical'
            ? await downloadPracticalPdf.mutateAsync(request())
            : await downloadTheoryPdf.mutateAsync(request())
          download(file.blob, file.filename, 'QuestionPaper.pdf')
        } else {
          const file = effectiveType === 'Practical'
            ? await downloadPracticalWord.mutateAsync(request())
            : await downloadTheoryWord.mutateAsync(request())
          download(file.blob, file.filename, 'QuestionPaper.doc')
        }
        showToast(message || 'Question paper downloaded successfully.', 'success')
        return
      } catch (downloadErr: any) {
        const msg = message || downloadErr?.message || 'Failed to download question paper.'
        setValidationError(msg)
        showToast(msg, 'error')
      }
    } catch (error: any) {
      const errMsg = error?.message || 'Failed to print question paper.'
      setValidationError(errMsg)
      showToast(errMsg, 'error')
    } finally {
      setActiveAction(null)
    }
  }

  // 3. Delete Question Paper
  const handleQuestionPaperDelete = async (confirm = false) => {
    if (!canDeleteQuestionPaper || isWorking) return
    setValidationError(null)
    setActiveAction('qp-delete')
    try {
      const res = effectiveType === 'Practical'
        ? await deletePractical.mutateAsync(request(confirm))
        : await deleteTheory.mutateAsync(request(confirm))

      if (res.data === false && !confirm) {
        setActiveAction(null)
        setConfirmation({
          message: res.message || 'You are about to delete the QP set. Do you want to continue?',
          action: () => handleQuestionPaperDelete(true),
        })
        return
      }
      if (res.data === true || confirm) {
        showToast(res.message || 'Deleted successfully......!', 'success')
      }
    } catch (error: any) {
      const errMsg = error?.message || error?.errors?.[0] || 'Could not delete question paper. Please verify if questions have been printed.'
      setValidationError(errMsg)
      showToast(errMsg, 'error')
    } finally {
      setActiveAction(null)
    }
  }

  // 4. Download Answer Key
  const handleAnswerKeyDownload = async () => {
    if (!canGetAnswerKey || isWorking) return
    setValidationError(null)
    setActiveAction('answer-key')
    try {
      const file = await downloadTheoryAnswerKey.mutateAsync(request())
      download(file.blob, file.filename, 'AnswerKey.pdf')
      showToast('Answer key downloaded successfully.', 'success')
    } catch (error: any) {
      const errMsg = error?.message || 'Failed to download answer key. Ensure questions have been printed.'
      setValidationError(errMsg)
      showToast(errMsg, 'error')
    } finally {
      setActiveAction(null)
    }
  }

  // 5. Download Attendance Sheet
  const handleAttendanceDownload = async () => {
    if (!canGetAttendance || isWorking) return
    setValidationError(null)
    setActiveAction('attendance')
    try {
      const file = await downloadAttendance.mutateAsync(request())
      download(file.blob, file.filename, 'AttendanceSheet.pdf')
      showToast('Attendance sheet downloaded successfully.', 'success')
    } catch (error: any) {
      const errMsg = error?.message || 'Failed to download attendance sheet. Ensure booklet has been printed.'
      setValidationError(errMsg)
      showToast(errMsg, 'error')
    } finally {
      setActiveAction(null)
    }
  }

  // 6. Download Cover Letter
  const handleCoverLetterDownload = async () => {
    if (!canGetCoverLetter || isWorking) return
    setValidationError(null)
    setActiveAction('cover')
    try {
      const file = await downloadCover.mutateAsync(request())
      download(file.blob, file.filename, 'CoverLetter.pdf')
      showToast('Cover letter downloaded successfully.', 'success')
    } catch (error: any) {
      const errMsg = error?.message || 'Failed to download cover letter. Ensure booklet has been printed.'
      setValidationError(errMsg)
      showToast(errMsg, 'error')
    } finally {
      setActiveAction(null)
    }
  }

  // 7. Download Consolidated Mark Sheet
  const handleConsolidatedMarkSheetDownload = async () => {
    if (!canGetConsolidated || isWorking) return
    setValidationError(null)
    setActiveAction('consolidated')
    try {
      const file = await downloadConsolidated.mutateAsync(request())
      download(file.blob, file.filename, 'ConsolidatedMarkSheet.pdf')
      showToast('Consolidated mark sheet downloaded successfully.', 'success')
    } catch (error: any) {
      const errMsg = error?.message || 'Failed to download consolidated mark sheet. Ensure booklet has been printed.'
      setValidationError(errMsg)
      showToast(errMsg, 'error')
    } finally {
      setActiveAction(null)
    }
  }

  // Tooltips & Hints
  const formHint = !formComplete ? 'Select Academic Intake, Programme, Semester and Course Unit first.' : ''
  const bookletHint = formHint || (!canPrint ? 'You do not have permission to print booklets.' : '')
  const qpPdfHint = formHint || (!canPrint ? 'You do not have permission to print question papers.' : '')
  const qpWordHint = formHint || (!canPrint ? 'You do not have permission to download question papers in Word.' : '')
  const qpDeleteHint = formHint || (!canDelete ? 'You do not have permission to delete question papers.' : '')
  const answerKeyHint = formHint || (effectiveType === 'Practical' ? 'Answer Key is only applicable for Theory components.' : (!canGetAnswerKeyPermission ? 'You do not have permission to download answer key.' : ''))
  const attendanceHint = formHint || (!canGetAttendancePermission ? 'You do not have permission to download attendance sheet.' : '')
  const coverLetterHint = formHint || (!canGetCoverLetterPermission ? 'You do not have permission to download cover letter.' : '')
  const consolidatedHint = formHint || (!canGetConsolidatedPermission ? 'You do not have permission to download consolidated mark sheet.' : '')

  return (
    <div className="page active">
      <div className="pg-hdr">
        <h1 className="pg-title">University Exam Theory QP Print</h1>
        <p className="pg-sub">Generate and download university exam booklets, question papers, answer keys, attendance sheets, and cover letters.</p>
      </div>

      <div className="card mb-5">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-5">
          <div className="fg mb-0">
            <label className="lbl">Academic Intake <span className="text-red-500">*</span></label>
            <SearchSelect
              placeholder="— Select Intake —"
              value={selectedIntakeGuid}
              onChange={setSelectedIntakeGuid}
              disabled={true}
              options={intakeOptions}
            />
          </div>
          <div className="fg mb-0">
            <label className="lbl">Programme <span className="text-red-500">*</span></label>
            <SearchSelect
              placeholder="— Select Programme —"
              value={programGuid}
              onChange={guid => {
                setProgramGuid(guid)
                setSemesterGuid('')
                setCourseUnitGuid('')
                setCombinedType('Theory')
                setValidationError(null)
              }}
              disabled={programsLoading || intakeLoading}
              options={(programs ?? []).map(program => ({ value: program.programGuid, label: program.programName }))}
            />
          </div>
          <div className="fg mb-0">
            <label className="lbl">Semester <span className="text-red-500">*</span></label>
            <SearchSelect
              placeholder="— Select Semester —"
              value={semesterGuid}
              onChange={guid => {
                setSemesterGuid(guid)
                setCourseUnitGuid('')
                setCombinedType('Theory')
                setValidationError(null)
              }}
              disabled={!programGuid || semestersLoading}
              options={(semesters ?? []).map(semester => ({ value: semester.semesterGuid, label: semester.semName }))}
            />
          </div>
          <div className="fg mb-0">
            <label className="lbl">Course Unit <span className="text-red-500">*</span></label>
            <SearchSelect
              placeholder="— Select Course Unit —"
              value={courseUnitGuid}
              onChange={guid => {
                setCourseUnitGuid(guid)
                setCombinedType('Theory')
                setValidationError(null)
              }}
              disabled={!semesterGuid || unitsLoading}
              options={(courseUnits ?? []).map(unit => ({ value: unit.courseUnitGuid, label: `${unit.courseUnitCode} - ${unit.courseUnitName}` }))}
            />
          </div>
        </div>

        {selectedUnitType === 'Combined' && (
          <div className="px-5 py-4 border-t border-gray-100 bg-slate-50 flex items-center gap-6">
            <span className="lbl mb-0">Print component</span>
            {(['Theory', 'Practical'] as const).map(type => (
              <label key={type} className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                <input
                  type="radio"
                  name="combined-unit-type"
                  checked={combinedType === type}
                  onChange={() => setCombinedType(type)}
                  className="w-4 h-4 text-primary"
                />
                {type}
              </label>
            ))}
          </div>
        )}

        {/* Real Backend API Validation Banner */}
        {validationError && (
          <div className="mx-5 mb-4 p-3.5 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <i className="lni lni-warning text-base text-red-500 flex-shrink-0" />
              <span className="font-medium">{validationError}</span>
            </div>
            <button
              type="button"
              className="text-red-400 hover:text-red-700 p-1 rounded transition-colors"
              onClick={() => setValidationError(null)}
              title="Dismiss"
            >
              <i className="lni lni-close text-xs" />
            </button>
          </div>
        )}

        {formComplete && !canPrint && (
          <div className="mx-5 mb-4 p-3.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-sm flex items-center gap-2.5">
            <i className="lni lni-warning text-base text-amber-600 flex-shrink-0" />
            <span className="font-medium">You do not have permission to print university exam materials.</span>
          </div>
        )}

        {/* Actions Toolbar */}
        <div className="p-5 pt-0 flex flex-col gap-4">
          <div className="border-t border-gray-100 pt-4">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2.5">
              Booklet & Exam Materials
            </span>
            <div className="flex flex-wrap gap-2.5">
              <button
                className="btn btn-primary"
                onClick={() => handleBookletPrint()}
                disabled={!canPrintBooklet || isWorking}
                title={bookletHint}
              >
                <i className={`lni ${activeAction === 'booklet' ? 'lni-spinner lni-is-spinning' : 'lni-printer'}`} />
                {activeAction === 'booklet' ? ' Printing...' : ' Print Booklet'}
              </button>

              <button
                className="btn btn-neu"
                onClick={handleAttendanceDownload}
                disabled={!canGetAttendance || isWorking}
                title={attendanceHint}
              >
                <i className={`lni ${activeAction === 'attendance' ? 'lni-spinner lni-is-spinning' : 'lni-users'}`} />
                {activeAction === 'attendance' ? ' Downloading...' : ' Attendance Sheet'}
              </button>

              <button
                className="btn btn-neu"
                onClick={handleCoverLetterDownload}
                disabled={!canGetCoverLetter || isWorking}
                title={coverLetterHint}
              >
                <i className={`lni ${activeAction === 'cover' ? 'lni-spinner lni-is-spinning' : 'lni-envelope'}`} />
                {activeAction === 'cover' ? ' Downloading...' : ' Cover Letter'}
              </button>

              <button
                className="btn btn-neu"
                onClick={handleConsolidatedMarkSheetDownload}
                disabled={!canGetConsolidated || isWorking}
                title={consolidatedHint}
              >
                <i className={`lni ${activeAction === 'consolidated' ? 'lni-spinner lni-is-spinning' : 'lni-files'}`} />
                {activeAction === 'consolidated' ? ' Downloading...' : ' Consolidated Mark Sheet'}
              </button>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2.5">
              Question Paper Materials
            </span>
            <div className="flex flex-wrap gap-2.5">
              <button
                className="btn btn-neu"
                onClick={() => handleQuestionPaperPrint('pdf')}
                disabled={!canPrintQuestionPaperPdf || isWorking}
                title={qpPdfHint}
              >
                <i className={`lni ${activeAction === 'qp-pdf' ? 'lni-spinner lni-is-spinning' : 'lni-printer'}`} />
                {activeAction === 'qp-pdf' ? ' Printing...' : ' QP Print (PDF)'}
              </button>

              <button
                className="btn btn-neu"
                onClick={() => handleQuestionPaperPrint('word')}
                disabled={!canPrintQuestionPaperWord || isWorking}
                title={qpWordHint}
              >
                <i className={`lni ${activeAction === 'qp-word' ? 'lni-spinner lni-is-spinning' : 'lni-download'}`} />
                {activeAction === 'qp-word' ? ' Downloading...' : ' QP Print in MS Word'}
              </button>

              <button
                className="btn btn-neu"
                onClick={handleAnswerKeyDownload}
                disabled={!canGetAnswerKey || isWorking}
                title={answerKeyHint}
              >
                <i className={`lni ${activeAction === 'answer-key' ? 'lni-spinner lni-is-spinning' : 'lni-key'}`} />
                {activeAction === 'answer-key' ? ' Downloading...' : ' Answer Key'}
              </button>

              <button
                className="btn btn-danger"
                onClick={() => handleQuestionPaperDelete()}
                disabled={!canDeleteQuestionPaper || isWorking}
                title={qpDeleteHint}
              >
                <i className={`lni ${activeAction === 'qp-delete' ? 'lni-spinner lni-is-spinning' : 'lni-trash-can'}`} />
                {activeAction === 'qp-delete' ? ' Deleting...' : ' Delete QP'}
              </button>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4 flex justify-between items-center">
            <span className="text-xs text-gray-400">
              Select all mandatory fields above to enable materials generation.
            </span>
            <button className="btn btn-neu" onClick={reset} disabled={isWorking}>
              <i className="lni lni-reload" /> Refresh
            </button>
          </div>
        </div>
      </div>

      {confirmation && (
        <div className="perm-delete-overlay" style={{ position: 'fixed', zIndex: 500 }} onClick={() => setConfirmation(null)}>
          <div className="perm-delete-card tab-panel-in" onClick={event => event.stopPropagation()}>
            <div className="perm-delete-icon"><i className="lni lni-warning" /></div>
            <div className="perm-delete-title">Confirmation Required</div>
            <div className="perm-delete-sub">{confirmation.message}</div>
            <div className="perm-delete-actions">
              <button className="btn btn-neu" onClick={() => setConfirmation(null)}>No</button>
              <button className="btn btn-primary" onClick={() => { const action = confirmation.action; setConfirmation(null); action() }}>Yes</button>
            </div>
          </div>
        </div>
      )}
      <Toast toast={toast} />
    </div>
  )
}
