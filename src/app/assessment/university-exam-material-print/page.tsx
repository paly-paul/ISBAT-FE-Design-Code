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
  usePrintUeQuestionPractical,
  useDownloadUeQuestionPracticalPdf,
  useDownloadUeQuestionPracticalWord,
  useDeleteUeQuestionPractical,
} from '@/hooks/assessment/useUePracticalPrint'
import { UE_TYPE } from '@/lib/api/assessment/ueMaterialPrint'
import { extractApiErrorMessage } from '@/lib/errorMessages'

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
    } else if (trimmed.toLowerCase() === 'schedulenotset') {
      outcome = 'ExamRuleNotSet'
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
  // Theory/Practical choice for a Combined unit's question paper. Reset to
  // Theory whenever the unit changes.
  const [qpType, setQpType] = useState<'theory' | 'practical'>('theory')
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

  const intakeGuid = selectedIntakeGuid || currentIntake?.intakeGuid || ''

  const { data: programs, isLoading: programsLoading } = useUeMaterialPrintPrograms()
  const { data: semesters, isLoading: semestersLoading } = useUeMaterialPrintSemesters(programGuid || null)
  const { data: courseUnits, isLoading: unitsLoading } = useUeQuestionPrintCourseUnits(
    programGuid,
    semesterGuid,
    Boolean(programGuid && semesterGuid && intakeGuid),
    intakeGuid,
    ['Theory', 'Combined']
  )

  const formComplete = Boolean(intakeGuid && programGuid && semesterGuid && courseUnitGuid)

  // allowedUeTypes (get-course-units.md): [0] Theory, [1] Practical,
  // [0, 1] Combined, null Project / no type. Only a Combined unit offers the
  // Theory/Practical radio; a Practical-only unit uses the practical calls
  // with no radio, and everything else prints theory. The choice only
  // affects the question paper (print, Word, PDF, delete); the answer key is
  // theory-only, and booklet, attendance, cover letter and mark sheet keep
  // the theory layout.
  const selectedUnit = courseUnits?.find(u => u.courseUnitGuid?.toLowerCase() === courseUnitGuid.toLowerCase()) ?? null
  const allowsTheory = !!selectedUnit?.allowedUeTypes?.includes(UE_TYPE.Theory)
  const allowsPractical = !!selectedUnit?.allowedUeTypes?.includes(UE_TYPE.Practical)
  const isCombinedUnit = allowsTheory && allowsPractical
  const isPracticalQp = isCombinedUnit ? qpType === 'practical' : allowsPractical

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
  const canGetAnswerKey = formComplete && canGetAnswerKeyPermission && !isPracticalQp
  const canGetAttendance = formComplete && canGetAttendancePermission
  const canGetCoverLetter = formComplete && canGetCoverLetterPermission
  const canGetConsolidated = formComplete && canGetConsolidatedPermission

  // Hook instances (strictly Theory-only + Booklet + Consolidated Mark Sheet per MD specification)
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

  // The question-paper calls for the chosen paper type — same params and
  // the same confirm-then-reprint flow for both.
  const qpPrint = isPracticalQp ? printPractical : printTheory
  const qpWord = isPracticalQp ? downloadPracticalWord : downloadTheoryWord
  const qpPdf = isPracticalQp ? downloadPracticalPdf : downloadTheoryPdf
  const qpDelete = isPracticalQp ? deletePractical : deleteTheory
  const qpLabel = isPracticalQp ? 'Practical' : 'Theory'

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
    confirm,
  })

  const reset = () => {
    setProgramGuid('')
    setSemesterGuid('')
    setCourseUnitGuid('')
    setQpType('theory')
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
      showToast(
        result.message || (result.wasReprint ? 'Booklet reprinted successfully.' : 'Booklet downloaded successfully.'),
        'success'
      )
    } catch (error: any) {
      const errMsg = extractApiErrorMessage(error, 'Failed to print booklet.')
      setValidationError(errMsg)
      showToast(errMsg, 'error')
    } finally {
      setActiveAction(null)
    }
  }

  // 2. Question Paper Print (Word or PDF — Theory, or Practical for a Combined unit)
  const handleQuestionPaperPrint = async (format: 'word' | 'pdf', confirm = false) => {
    const allowed = format === 'word' ? canPrintQuestionPaperWord : canPrintQuestionPaperPdf
    if (!allowed || isWorking) return
    setValidationError(null)
    setActiveAction(format === 'word' ? 'qp-word' : 'qp-pdf')
    const fallbackName = `${qpLabel}QuestionPaper`
    try {
      const result = await qpPrint.mutateAsync(request(confirm))
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
        const msg = message || 'University Exam not yet Scheduled!!'
        setValidationError(msg)
        showToast(msg, 'error')
        return
      }
      if (outcome === 'QuestionsNotAvailable') {
        const msg = message || 'Questions are not yet uploaded!!'
        setValidationError(msg)
        showToast(msg, 'error')
        return
      }
      if (outcome === 'Printed' || outcome === 'Reprinted') {
        setValidationError(null)
        if (format === 'pdf') {
          const file = await qpPdf.mutateAsync(request())
          download(file.blob, file.filename, `${fallbackName}.pdf`)
        } else {
          const file = await qpWord.mutateAsync(request())
          download(file.blob, file.filename, `${fallbackName}.doc`)
        }
        showToast(
          message || (outcome === 'Reprinted' ? 'Question paper reprinted successfully.' : 'Question paper downloaded successfully.'),
          'success'
        )
        return
      }

      // Fallback when 200 OK completes without an explicit blocking outcome
      if (format === 'pdf') {
        const file = await qpPdf.mutateAsync(request())
        download(file.blob, file.filename, `${fallbackName}.pdf`)
      } else {
        const file = await qpWord.mutateAsync(request())
        download(file.blob, file.filename, `${fallbackName}.doc`)
      }
      showToast(message || 'Question paper downloaded successfully.', 'success')
    } catch (error: any) {
      const errMsg = extractApiErrorMessage(error, 'Failed to print question paper.')
      setValidationError(errMsg)
      showToast(errMsg, 'error')
    } finally {
      setActiveAction(null)
    }
  }

  // 3. Delete Question Paper (Theory, or Practical for a Combined unit)
  const handleQuestionPaperDelete = async (confirm = false) => {
    if (!canDeleteQuestionPaper || isWorking) return
    setValidationError(null)
    setActiveAction('qp-delete')
    try {
      const res = await qpDelete.mutateAsync(request(confirm))

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
      const errMsg = extractApiErrorMessage(error, 'Could not delete....!')
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
      const errMsg = extractApiErrorMessage(error, 'Failed to download answer key.')
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
      const errMsg = extractApiErrorMessage(error, 'Failed to download attendance sheet.')
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
      const errMsg = extractApiErrorMessage(error, 'Failed to download cover letter.')
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
      const errMsg = extractApiErrorMessage(error, 'Failed to download consolidated mark sheet.')
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
  const answerKeyHint = formHint
    || (isPracticalQp ? 'There is no answer key for practical papers. Select Theory to download it.' : '')
    || (!canGetAnswerKeyPermission ? 'You do not have permission to download answer key.' : '')
  const attendanceHint = formHint || (!canGetAttendancePermission ? 'You do not have permission to download attendance sheet.' : '')
  const coverLetterHint = formHint || (!canGetCoverLetterPermission ? 'You do not have permission to download cover letter.' : '')
  const consolidatedHint = formHint || (!canGetConsolidatedPermission ? 'You do not have permission to download consolidated mark sheet.' : '')

  return (
    <div className="page active">
      <div className="pg-hdr flex justify-between items-end">
        <div>
          <h1 className="pg-title">University Exam Theory QP Print</h1>
          <p className="pg-sub">Generate and download university exam booklets, question papers, answer keys, attendance sheets, and cover letters.</p>
        </div>
        <button className="btn btn-neu" onClick={reset} disabled={isWorking}>
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
                setQpType('theory')
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
                setQpType('theory')
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
                setQpType('theory')
                setValidationError(null)
              }}
              disabled={!semesterGuid || unitsLoading}
              options={(courseUnits ?? []).map(unit => ({ value: unit.courseUnitGuid, label: `${unit.courseUnitCode} - ${unit.courseUnitName}` }))}
            />
          </div>
        </div>

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

        <div className="p-5 pt-0 mt-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Question Paper Card */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs">
            <div className="bg-slate-50 px-5 py-4 border-b border-gray-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                <i className="lni lni-layout"></i>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 text-sm m-0">Question Paper Materials</h3>
                <p className="text-xs text-gray-500 m-0">
                  {isPracticalQp ? 'Generate & download practical QP · one page per student' : 'Generate & download theory QP'}
                </p>
              </div>
            </div>
            {/* Combined units only: which paper the QP buttons print and delete. */}
            {isCombinedUnit && (
              <div className="px-5 pt-4 flex flex-wrap items-center gap-x-5 gap-y-2" role="radiogroup" aria-label="Question paper type">
                <span className="lbl mb-0">Paper type</span>
                <label className="flex items-center gap-2 text-sm cursor-pointer font-medium text-slate-700">
                  <input
                    type="radio"
                    name="qpTypeRadio"
                    value="theory"
                    checked={qpType === 'theory'}
                    onChange={() => { setQpType('theory'); setValidationError(null) }}
                    disabled={isWorking}
                  />
                  Theory
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer font-medium text-slate-700">
                  <input
                    type="radio"
                    name="qpTypeRadio"
                    value="practical"
                    checked={qpType === 'practical'}
                    onChange={() => { setQpType('practical'); setValidationError(null) }}
                    disabled={isWorking}
                  />
                  Practical
                </label>
              </div>
            )}
            <div className="p-5 grid grid-cols-2 sm:grid-cols-2 gap-3">
              <button
                className="flex flex-col items-center justify-center p-4 border rounded-xl gap-2 text-sm font-medium transition-all hover:border-primary hover:text-primary hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:hover:shadow-none disabled:hover:text-gray-700 bg-blue-50 border-blue-100"
                onClick={() => handleQuestionPaperPrint('pdf')}
                disabled={!canPrintQuestionPaperPdf || isWorking}
                title={qpPdfHint}
              >
                <i className={`lni ${activeAction === 'qp-pdf' ? 'lni-spinner lni-is-spinning' : 'lni-printer'} text-3xl text-red-500`}></i>
                {activeAction === 'qp-pdf' ? 'Printing...' : 'QP Print (PDF)'}
              </button>

              <button
                className="flex flex-col items-center justify-center p-4 border rounded-xl gap-2 text-sm font-medium transition-all hover:border-primary hover:text-primary hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:hover:shadow-none disabled:hover:text-gray-700 bg-slate-50 border-slate-200"
                onClick={() => handleQuestionPaperPrint('word')}
                disabled={!canPrintQuestionPaperWord || isWorking}
                title={qpWordHint}
              >
                <i className={`lni ${activeAction === 'qp-word' ? 'lni-spinner lni-is-spinning' : 'lni-wordpress'} text-3xl text-blue-500`}></i>
                {activeAction === 'qp-word' ? 'Downloading...' : 'QP Print in MS Word'}
              </button>

              <button
                className="flex flex-col items-center justify-center p-4 border rounded-xl gap-2 text-sm font-medium transition-all hover:border-primary hover:text-primary hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:hover:shadow-none disabled:hover:text-gray-700 bg-sky-50 border-sky-100"
                onClick={handleAnswerKeyDownload}
                disabled={!canGetAnswerKey || isWorking}
                title={answerKeyHint}
              >
                <i className={`lni ${activeAction === 'answer-key' ? 'lni-spinner lni-is-spinning' : 'lni-key'} text-3xl text-amber-500`}></i>
                {activeAction === 'answer-key' ? 'Downloading...' : 'Answer Key'}
              </button>

              <button
                className="flex flex-col items-center justify-center p-4 border rounded-xl gap-2 text-sm font-medium transition-all hover:border-red-500 hover:text-red-600 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:hover:shadow-none disabled:hover:text-gray-700 bg-red-50 border-red-100"
                onClick={() => handleQuestionPaperDelete()}
                disabled={!canDeleteQuestionPaper || isWorking}
                title={qpDeleteHint}
              >
                <i className={`lni ${activeAction === 'qp-delete' ? 'lni-spinner lni-is-spinning' : 'lni-trash-can'} text-3xl text-red-600`}></i>
                {activeAction === 'qp-delete' ? 'Deleting...' : 'Delete QP'}
              </button>
            </div>
          </div>

          {/* Booklet Card */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs">
            <div className="bg-slate-50 px-5 py-4 border-b border-gray-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                <i className="lni lni-book"></i>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 text-sm m-0">Booklet &amp; Registers</h3>
                <p className="text-xs text-gray-500 m-0">Generate &amp; download booklets and exam registers</p>
              </div>
            </div>
            <div className="p-5 grid grid-cols-2 sm:grid-cols-2 gap-3">
              <button
                className="flex flex-col items-center justify-center p-4 border rounded-xl gap-2 text-sm font-medium transition-all hover:border-indigo-500 hover:text-indigo-600 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:hover:shadow-none disabled:hover:text-gray-700 bg-white"
                onClick={() => handleBookletPrint()}
                disabled={!canPrintBooklet || isWorking}
                title={bookletHint}
              >
                <i className={`lni ${activeAction === 'booklet' ? 'lni-spinner lni-is-spinning' : 'lni-printer'} text-3xl text-indigo-500`}></i>
                {activeAction === 'booklet' ? 'Printing...' : 'Print Booklet'}
              </button>

              <button
                className="flex flex-col items-center justify-center p-4 border rounded-xl gap-2 text-sm font-medium transition-all hover:border-indigo-500 hover:text-indigo-600 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:hover:shadow-none disabled:hover:text-gray-700 bg-gray-50 border-gray-200"
                onClick={handleAttendanceDownload}
                disabled={!canGetAttendance || isWorking}
                title={attendanceHint}
              >
                <i className={`lni ${activeAction === 'attendance' ? 'lni-spinner lni-is-spinning' : 'lni-users'} text-3xl text-green-600`}></i>
                {activeAction === 'attendance' ? 'Downloading...' : 'Attendance Sheet'}
              </button>

              <button
                className="flex flex-col items-center justify-center p-4 border rounded-xl gap-2 text-sm font-medium transition-all hover:border-indigo-500 hover:text-indigo-600 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:hover:shadow-none disabled:hover:text-gray-700 bg-emerald-50 border-emerald-100"
                onClick={handleCoverLetterDownload}
                disabled={!canGetCoverLetter || isWorking}
                title={coverLetterHint}
              >
                <i className={`lni ${activeAction === 'cover' ? 'lni-spinner lni-is-spinning' : 'lni-envelope'} text-3xl text-orange-500`}></i>
                {activeAction === 'cover' ? 'Downloading...' : 'Cover Letter'}
              </button>

              <button
                className="flex flex-col items-center justify-center p-4 border rounded-xl gap-2 text-sm font-medium transition-all hover:border-indigo-500 hover:text-indigo-600 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:hover:shadow-none disabled:hover:text-gray-700 bg-orange-50 border-orange-100"
                onClick={handleConsolidatedMarkSheetDownload}
                disabled={!canGetConsolidated || isWorking}
                title={consolidatedHint}
              >
                <i className={`lni ${activeAction === 'consolidated' ? 'lni-spinner lni-is-spinning' : 'lni-list'} text-3xl text-purple-600`}></i>
                {activeAction === 'consolidated' ? 'Downloading...' : 'Consolidated Mark Sheet'}
              </button>
            </div>
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
