'use client'

import { useState, useMemo, useEffect } from 'react'
import { Toast } from '@/components/Toast'
import { usePagePermissions } from '@/hooks/users/usePagePermissions'
import { SearchSelect } from '@/components/SearchSelect'
import { useIntakesDropdown, useCurrentAcademicIntake } from '@/hooks/academic/useIntakes'
import {
  useUeMaterialPrintPrograms,
  useUeMaterialPrintProgramUnits,
  useUeMaterialPrintSemesters,
} from '@/hooks/assessment/useUeMaterialPrint'
import {
  useResitCourseUnits,
  usePrintResitTheory,
  useDownloadResitTheoryPdf,
  useDownloadResitTheoryWord,
  useDeleteResitTheory,
  useDownloadResitTheoryAnswerKey,
  usePrintResitPractical,
  useDownloadResitPracticalPdf,
  useDownloadResitPracticalWord,
  useDeleteResitPractical,
  usePrintResitBooklet,
  useDownloadResitBookletPdf,
  useDownloadResitBookletAttendance,
  useDownloadResitBookletCover,
  useDownloadResitBookletConsolidated,
} from '@/hooks/assessment/useResitQuestionPrint'
import { extractApiErrorMessage } from '@/lib/errorMessages'

type EffectiveType = 'Theory' | 'Practical' | 'Project'

function unitType(value?: string | null): EffectiveType | 'Combined' {
  switch ((value ?? '').trim().toLowerCase()) {
    case 'practical': return 'Practical'
    case 'project': return 'Project'
    case 'combined': return 'Combined'
    default: return 'Theory'
  }
}

const OUTCOME_NAMES = ['Printed', 'Reprinted', 'ScheduleNotSet', 'QuestionsNotAvailable', 'ConfirmationRequired'] as const
type ResitQpOutcome = typeof OUTCOME_NAMES[number]

function parseOutcome(result: any): { outcome: ResitQpOutcome | null; message: string } {
  if (result === null || result === undefined) return { outcome: null, message: '' }

  const raw = result?.outcome ?? result?.Outcome ?? (typeof result === 'object' && 'data' in result ? (result.data?.outcome ?? result.data?.Outcome ?? result.data) : result)

  let outcome: ResitQpOutcome | null = null
  if (typeof raw === 'number') {
    outcome = OUTCOME_NAMES[raw] ?? null
  } else if (typeof raw === 'string') {
    const trimmed = raw.trim()
    if (/^\d+$/.test(trimmed)) {
      outcome = OUTCOME_NAMES[Number(trimmed)] ?? null
    } else if (trimmed.toLowerCase() === 'examrulenotset') {
      outcome = 'ScheduleNotSet'
    } else {
      outcome = OUTCOME_NAMES.find(n => n.toLowerCase() === trimmed.toLowerCase()) ?? null
    }
  }

  const message = (typeof result?.message === 'string' && result.message)
    || (typeof result?.data?.message === 'string' && result.data.message)
    || ''

  return { outcome, message }
}

export default function ResitQuestionPrintPage() {
  const permissions = usePagePermissions()
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)

  const showToast = (msg: string, type = '') => {
    setToast({ msg, type })
    window.setTimeout(() => setToast(null), 3500)
  }

  // Dropdown States
  const [selectedIntakeGuid, setSelectedIntakeGuid] = useState<string>('')
  const [selectedQPIntakeGuid, setSelectedQPIntakeGuid] = useState<string>('')
  const [selectedProgramGuid, setSelectedProgramGuid] = useState<string>('')
  const [selectedSemesterGuid, setSelectedSemesterGuid] = useState<string>('')
  const [selectedCourseUnitGuid, setSelectedCourseUnitGuid] = useState<string>('')
  const [combinedType, setCombinedType] = useState<'Theory' | 'Practical'>('Theory')
  const [confirmation, setConfirmation] = useState<{ message: string; action: () => void } | null>(null)
  const [activeAction, setActiveAction] = useState<string | null>(null)

  // Data Hooks
  const { data: intakes, isLoading: intakesLoading } = useIntakesDropdown()
  const { data: currentIntake } = useCurrentAcademicIntake()
  const { data: programs, isLoading: programsLoading } = useUeMaterialPrintPrograms()
  const { data: semesters, isLoading: semLoading } = useUeMaterialPrintSemesters(selectedProgramGuid || null)
  const { data: programUnits } = useUeMaterialPrintProgramUnits(selectedProgramGuid || null)

  const isCourseUnitEnabled = !!selectedProgramGuid && !!selectedSemesterGuid && !!selectedIntakeGuid
  const { data: courseUnits, isLoading: unitsLoading } = useResitCourseUnits(
    selectedProgramGuid, selectedSemesterGuid, selectedIntakeGuid, isCourseUnitEnabled
  )

  // API Hooks
  const printTheoryMut = usePrintResitTheory()
  const dlTheoryPdfMut = useDownloadResitTheoryPdf()
  const dlTheoryWordMut = useDownloadResitTheoryWord()
  const delTheoryMut = useDeleteResitTheory()
  const dlAnswerKeyMut = useDownloadResitTheoryAnswerKey()

  const printPracticalMut = usePrintResitPractical()
  const dlPracticalPdfMut = useDownloadResitPracticalPdf()
  const dlPracticalWordMut = useDownloadResitPracticalWord()
  const delPracticalMut = useDeleteResitPractical()

  const printBookletMut = usePrintResitBooklet()
  const dlBookletPdfMut = useDownloadResitBookletPdf()
  const dlAttendanceMut = useDownloadResitBookletAttendance()
  const dlCoverMut = useDownloadResitBookletCover()
  const dlConsolidatedMut = useDownloadResitBookletConsolidated()

  // Resolve unit row from programUnits (which includes unitTypeName) with fallback to courseUnits
  const selectedUnitRow = useMemo(() => {
    if (!selectedCourseUnitGuid) return null
    const exact = (programUnits ?? []).find(unit =>
      unit.courseUnitGuid?.toLowerCase() === selectedCourseUnitGuid.toLowerCase() &&
      unit.semesterGuid?.toLowerCase() === selectedSemesterGuid?.toLowerCase()
    )
    if (exact) return exact

    const byUnit = (programUnits ?? []).find(unit =>
      unit.courseUnitGuid?.toLowerCase() === selectedCourseUnitGuid.toLowerCase()
    )
    if (byUnit) return byUnit

    const fromCourseUnits = (courseUnits ?? []).find((unit: any) =>
      unit.courseUnitGuid?.toLowerCase() === selectedCourseUnitGuid.toLowerCase()
    )
    return fromCourseUnits ?? null
  }, [selectedCourseUnitGuid, courseUnits, programUnits, selectedSemesterGuid])

  const selectedUnitType = useMemo(() => {
    const rawType = (selectedUnitRow as any)?.unitTypeName
      || (selectedUnitRow as any)?.unitType
      || (selectedUnitRow as any)?.courseUnitType
    return unitType(rawType)
  }, [selectedUnitRow])

  const effectiveType: EffectiveType = selectedUnitType === 'Combined' ? combinedType : selectedUnitType
  const isPractical = effectiveType === 'Practical'
  const bookletUeType = isPractical ? 1 : 0

  const formComplete = Boolean(selectedIntakeGuid && selectedProgramGuid && selectedSemesterGuid && selectedCourseUnitGuid)

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

  // Pre-select the current intake (user can still change it).
  useEffect(() => {
    if (!selectedIntakeGuid && currentIntake?.intakeGuid) {
      setSelectedIntakeGuid(currentIntake.intakeGuid)
    }
  }, [currentIntake, selectedIntakeGuid])

  const isWorking = activeAction !== null ||
    printTheoryMut.isPending || dlTheoryPdfMut.isPending || dlTheoryWordMut.isPending ||
    delTheoryMut.isPending || dlAnswerKeyMut.isPending ||
    printPracticalMut.isPending || dlPracticalPdfMut.isPending || dlPracticalWordMut.isPending ||
    delPracticalMut.isPending ||
    printBookletMut.isPending || dlBookletPdfMut.isPending ||
    dlAttendanceMut.isPending || dlCoverMut.isPending || dlConsolidatedMut.isPending

  // Filter change handlers
  const handleIntakeChange = (guid: string) => {
    setSelectedIntakeGuid(guid)
    setSelectedCourseUnitGuid('')
    setCombinedType('Theory')
    setValidationError(null)
  }

  const handleProgramChange = (guid: string) => {
    setSelectedProgramGuid(guid)
    setSelectedSemesterGuid('')
    setSelectedCourseUnitGuid('')
    setCombinedType('Theory')
    setValidationError(null)
  }

  const handleSemesterChange = (guid: string) => {
    setSelectedSemesterGuid(guid)
    setSelectedCourseUnitGuid('')
    setCombinedType('Theory')
    setValidationError(null)
  }

  const handleCourseUnitChange = (guid: string) => {
    setSelectedCourseUnitGuid(guid)
    setCombinedType('Theory')
    setValidationError(null)
  }

  const reset = () => {
    setSelectedProgramGuid('')
    setSelectedSemesterGuid('')
    setSelectedCourseUnitGuid('')
    setSelectedQPIntakeGuid('')
    setCombinedType('Theory')
    setValidationError(null)
    setActiveAction(null)
    if (currentIntake?.intakeGuid) {
      setSelectedIntakeGuid(currentIntake.intakeGuid)
    }
  }

  const buildRequest = (confirm = false) => ({
    programGuid: selectedProgramGuid,
    semesterGuid: selectedSemesterGuid,
    courseUnitGuid: selectedCourseUnitGuid,
    academicIntakeGuid: selectedIntakeGuid,
    questionBankIntakeGuid: selectedQPIntakeGuid || selectedIntakeGuid,
    ueType: bookletUeType,
    confirm,
  })

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

  // 1. Booklet Print (POST /resit-booklet -> confirm if needed -> GET /resit-booklet/pdf)
  const handleBookletPrint = async (confirm = false) => {
    if (!canPrintBooklet || isWorking) return
    setValidationError(null)
    setActiveAction('booklet')
    try {
      const result = await printBookletMut.mutateAsync(buildRequest(confirm))
      if (result.confirmationRequired && !confirm) {
        setActiveAction(null)
        setConfirmation({
          message: result.message || 'Booklets are already printed. Do you want to reprint the same?',
          action: () => handleBookletPrint(true),
        })
        return
      }
      const file = await dlBookletPdfMut.mutateAsync(buildRequest())
      downloadFile(file.blob, file.filename, 'Booklet.pdf')
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

  // 2. Question Paper Print (Word or PDF: POST /resit-question-print/{theory|practical} -> GET .../{pdf|word})
  const handleQuestionPaperPrint = async (format: 'word' | 'pdf', confirm = false) => {
    const allowed = format === 'word' ? canPrintQuestionPaperWord : canPrintQuestionPaperPdf
    if (!allowed || isWorking) return
    setValidationError(null)
    setActiveAction(format === 'word' ? 'qp-word' : 'qp-pdf')
    try {
      const req = buildRequest(confirm)
      const result = isPractical
        ? await printPracticalMut.mutateAsync(req)
        : await printTheoryMut.mutateAsync(req)

      const { outcome, message } = parseOutcome(result)

      if (outcome === 'ConfirmationRequired') {
        setActiveAction(null)
        setConfirmation({
          message: message || 'Questions are already printed. Do you want to reprint the same?',
          action: () => handleQuestionPaperPrint(format, true),
        })
        return
      }
      if (outcome === 'ScheduleNotSet') {
        const msg = message || 'Resit Exam not yet Scheduled/Exam Rule not yet set!!'
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
          const file = isPractical
            ? await dlPracticalPdfMut.mutateAsync(buildRequest())
            : await dlTheoryPdfMut.mutateAsync(buildRequest())
          downloadFile(file.blob, file.filename, 'QuestionPaper.pdf')
        } else {
          const file = isPractical
            ? await dlPracticalWordMut.mutateAsync(buildRequest())
            : await dlTheoryWordMut.mutateAsync(buildRequest())
          downloadFile(file.blob, file.filename, 'QuestionPaper.doc')
        }
        showToast(
          message || (outcome === 'Reprinted' ? 'Question paper reprinted successfully.' : 'Question paper downloaded successfully.'),
          'success'
        )
        return
      }

      // Any outcome not listed above is a backend validation outcome; show its message
      const fallbackMsg = message || 'Question paper could not be generated.'
      setValidationError(fallbackMsg)
      showToast(fallbackMsg, 'error')
    } catch (error: any) {
      const errMsg = extractApiErrorMessage(error, 'Failed to print question paper.')
      setValidationError(errMsg)
      showToast(errMsg, 'error')
    } finally {
      setActiveAction(null)
    }
  }

  // 3. Delete Question Paper (DELETE /resit-question-print/{theory|practical} with confirm=false -> confirm=true)
  const handleQuestionPaperDelete = async (confirm = false) => {
    if (!canDeleteQuestionPaper || isWorking) return
    setValidationError(null)
    setActiveAction('qp-delete')
    try {
      const req = buildRequest(confirm)
      const res = isPractical
        ? await delPracticalMut.mutateAsync(req)
        : await delTheoryMut.mutateAsync(req)

      if (res.data === false && !confirm) {
        setActiveAction(null)
        setConfirmation({
          message: res.message || 'You are about to delete the resit QP set. Do you want to continue?',
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

  // 4. Download Answer Key (Theory only)
  const handleAnswerKeyDownload = async () => {
    if (!canGetAnswerKey || isWorking) return
    setValidationError(null)
    setActiveAction('answer-key')
    try {
      const file = await dlAnswerKeyMut.mutateAsync(buildRequest())
      downloadFile(file.blob, file.filename, 'AnswerKey.pdf')
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
      const file = await dlAttendanceMut.mutateAsync(buildRequest())
      downloadFile(file.blob, file.filename, 'AttendanceSheet.pdf')
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
      const file = await dlCoverMut.mutateAsync(buildRequest())
      downloadFile(file.blob, file.filename, 'CoverLetter.pdf')
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
      const file = await dlConsolidatedMut.mutateAsync(buildRequest())
      downloadFile(file.blob, file.filename, 'ConsolidatedMarkSheet.pdf')
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
  const answerKeyHint = formHint || (effectiveType === 'Practical' ? 'Answer Key is only applicable for Theory components.' : (!canGetAnswerKeyPermission ? 'You do not have permission to download answer key.' : ''))
  const attendanceHint = formHint || (!canGetAttendancePermission ? 'You do not have permission to download attendance sheet.' : '')
  const coverLetterHint = formHint || (!canGetCoverLetterPermission ? 'You do not have permission to download cover letter.' : '')
  const consolidatedHint = formHint || (!canGetConsolidatedPermission ? 'You do not have permission to download consolidated mark sheet.' : '')

  return (
    <div className="page active">
      <div className="pg-hdr">
        <div>
          <h1 className="pg-title">Resit Question Print</h1>
          <p className="pg-sub">Generate and download resit exam booklets, question papers, answer keys, attendance sheets, and cover letters.</p>
        </div>
      </div>

      <div className="card mb-5">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 p-5">
          <div className="fg mb-0">
            <label className="lbl">Academic Intake <span className="text-red-500">*</span></label>
            <SearchSelect
              placeholder="— Select Intake —"
              value={selectedIntakeGuid}
              onChange={handleIntakeChange}
              disabled={intakesLoading}
              options={(intakes ?? []).map(i => ({
                value: i.intakeGuid,
                label: i.description || `Intake ${i.intakeCode}`,
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
            <label className="lbl">Course Unit <span className="text-red-500">*</span></label>
            <SearchSelect
              placeholder="— Select Course Unit —"
              value={selectedCourseUnitGuid}
              onChange={handleCourseUnitChange}
              disabled={!isCourseUnitEnabled || unitsLoading}
              options={(courseUnits ?? []).map((u: any) => ({
                value: u.courseUnitGuid,
                label: `${u.courseUnitCode} - ${u.courseUnitName}`,
              }))}
            />
          </div>
          <div className="fg mb-0">
            <label className="lbl">Question Bank Intake <span className="text-gray-400 text-xs">(Opt)</span></label>
            <SearchSelect
              placeholder="— Inherit from Academic —"
              value={selectedQPIntakeGuid}
              onChange={guid => {
                setSelectedQPIntakeGuid(guid)
                setValidationError(null)
              }}
              disabled={intakesLoading}
              options={(intakes ?? []).map(i => ({
                value: i.intakeGuid,
                label: i.description || `Intake ${i.intakeCode}`,
              }))}
            />
          </div>
        </div>

        {selectedCourseUnitGuid && selectedUnitType === 'Combined' && (
          <div className="px-5 py-4 border-t border-gray-100 bg-slate-50 flex items-center gap-6">
            <span className="lbl mb-0">Print component</span>
            {(['Theory', 'Practical'] as const).map(type => (
              <label key={type} className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                <input
                  type="radio"
                  name="resit-combined-unit-type"
                  checked={combinedType === type}
                  onChange={() => {
                    setCombinedType(type)
                    setValidationError(null)
                  }}
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
            <span className="font-medium">You do not have permission to print resit exam materials.</span>
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
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Question Paper Materials
              </span>
              {selectedCourseUnitGuid && (
                <span className="text-xs text-gray-500">
                  Type: <strong className="text-gray-700">{effectiveType}</strong>
                </span>
              )}
            </div>
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

              {!isPractical && (
                <button
                  className="btn btn-neu"
                  onClick={handleAnswerKeyDownload}
                  disabled={!canGetAnswerKey || isWorking}
                  title={answerKeyHint}
                >
                  <i className={`lni ${activeAction === 'answer-key' ? 'lni-spinner lni-is-spinning' : 'lni-key'}`} />
                  {activeAction === 'answer-key' ? ' Downloading...' : ' Answer Key'}
                </button>
              )}

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
