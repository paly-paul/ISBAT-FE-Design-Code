'use client'

import { useState, useMemo, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Toast } from '@/components/Toast'
import { usePagePermissions } from '@/hooks/users/usePagePermissions'
import { SearchSelect } from '@/components/SearchSelect'
import { useIntakesDropdown } from '@/hooks/academic/useIntakes'
import { getProgramCourseUnits } from '@/lib/api/academic/programCourseUnits'
import {
  useUePracticalPrintPrograms as useUeProjectPrintPrograms,
  useUePracticalPrintSemesters as useUeProjectPrintSemesters,
} from '@/hooks/assessment/useUePracticalPrint'
import {
  usePrintUeBooklet,
  useDownloadUeBookletPdf,
  useDownloadUeBookletAttendance,
  useDownloadUeBookletCover,
  useDownloadUeConsolidatedMarkSheet,
} from '@/hooks/assessment/useUeMaterialPrint'

// University Exam Project Booklet Print (university-exam-project-booklet-print-page.md).
// Booklet roster and its documents for a Project course unit — no question
// paper, answer key or delete (Project units have none). Print is the
// confirm-then-print flow: confirm:false first; if a booklet already exists
// the backend asks, and only on Yes is it resent with confirm:true; then the
// booklet PDF downloads. The other four are plain downloads of a printed set.
// Print only accepts the current intake and is refused once the exam has
// started (400s shown as sent); downloads work for any intake.
//
// The page doc still marks the Project booklet as "blocked on backend"
// (Theory-shaped output); it's wired so it can be tried against the backend.
// If the output isn't Project-shaped yet, that's a backend gap, not the page.

type Action = 'booklet' | 'booklet-pdf' | 'attendance' | 'cover' | 'consolidated'

export default function UniversityExamProjectBookletPrintPage() {
  const permissions = usePagePermissions()
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [activeAction, setActiveAction] = useState<Action | null>(null)
  const [confirmation, setConfirmation] = useState<{ message: string; action: () => void } | null>(null)

  const showToast = (msg: string, type = '') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  // Dropdown States
  const [selectedIntakeGuid, setSelectedIntakeGuid] = useState<string>('')
  const [selectedProgramGuid, setSelectedProgramGuid] = useState<string>('')
  const [selectedSemesterGuid, setSelectedSemesterGuid] = useState<string>('')
  const [selectedCourseUnitGuid, setSelectedCourseUnitGuid] = useState<string>('')

  // Data Hooks
  const { data: intakes, isLoading: intakesLoading } = useIntakesDropdown()
  const { data: programs, isLoading: programsLoading } = useUeProjectPrintPrograms()
  const { data: semesters, isLoading: semLoading } = useUeProjectPrintSemesters(selectedProgramGuid || null)
  // Own query (not the shared Practical hook, which turns a failure into an
  // empty list): a failed load must say so, not look like "no Project units".
  const unitsQuery = useQuery({
    queryKey: ['ue-project-program-course-units', selectedProgramGuid],
    queryFn: () => getProgramCourseUnits(selectedProgramGuid),
    enabled: !!selectedProgramGuid,
    retry: false,
  })
  const allProgramUnits = unitsQuery.data
  const unitsLoading = unitsQuery.isLoading && !!selectedProgramGuid

  // Pre-select current intake
  useEffect(() => {
    if (intakes && !selectedIntakeGuid) {
      const current = intakes.find(i => i.currentIntake)
      if (current) setSelectedIntakeGuid(current.intakeGuid)
    }
  }, [intakes, selectedIntakeGuid])

  // Filter Project units for the selected semester
  const courseUnits = useMemo(() => {
    if (!allProgramUnits || !selectedSemesterGuid) return []
    // Case/space-insensitive: the type name isn't guaranteed to be exactly "Project".
    return allProgramUnits.filter((u: any) => u.semesterGuid === selectedSemesterGuid && String(u.unitTypeName ?? '').trim().toLowerCase() === 'project')
  }, [allProgramUnits, selectedSemesterGuid])
  const selectedUnit = courseUnits.find((u: any) => u.courseUnitGuid === selectedCourseUnitGuid) as any

  const handleProgramChange = (guid: string) => {
    setSelectedProgramGuid(guid)
    setSelectedSemesterGuid('')
    setSelectedCourseUnitGuid('')
    setActionError(null)
  }
  const handleSemesterChange = (guid: string) => {
    setSelectedSemesterGuid(guid)
    setSelectedCourseUnitGuid('')
    setActionError(null)
  }
  const handleCancel = () => {
    // Cleared, not kept: the effect above pre-selects the current intake again.
    setSelectedIntakeGuid('')
    setSelectedProgramGuid('')
    setSelectedSemesterGuid('')
    setSelectedCourseUnitGuid('')
    setActionError(null)
  }

  // ── Actions ─────────────────────────────────────────────────────────────
  const printBooklet = usePrintUeBooklet()
  const downloadBooklet = useDownloadUeBookletPdf()
  const downloadAttendance = useDownloadUeBookletAttendance()
  const downloadCover = useDownloadUeBookletCover()
  const downloadConsolidated = useDownloadUeConsolidatedMarkSheet()

  const formComplete = Boolean(selectedIntakeGuid && selectedProgramGuid && selectedSemesterGuid && selectedCourseUnitGuid)
  const isWorking = activeAction !== null

  // Per-button permissions (page doc): uebooklet.print, .get,
  // .getattendancesheet, .getcoverletter, consolidatedmarksheet.get. Same
  // lenient mapping as the UE Material Print page; the backend's 403 decides.
  const p = permissions as Record<string, boolean | undefined>
  const canPrint = p.print !== false && Boolean(p.print || p.generate || p.add || p.view || p.get)
  const canGetBooklet = p.get !== false && Boolean(p.get || p.view || p.print)
  const canGetAttendance = p.getattendancesheet !== false && Boolean(p.getattendancesheet || p.get || p.view || p.print)
  const canGetCover = p.getcoverletter !== false && Boolean(p.getcoverletter || p.get || p.view || p.print)
  const canGetConsolidated = p.get !== false && Boolean(p.get || p.view || p.print)

  const request = (confirm = false) => ({
    programGuid: selectedProgramGuid,
    semesterGuid: selectedSemesterGuid,
    courseUnitGuid: selectedCourseUnitGuid,
    intakeGuid: selectedIntakeGuid,
    streamGuid: selectedUnit?.streamGuid ?? null,
    confirm,
  })

  const saveFile = (blob: Blob, filename: string | null, fallback: string) => {
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename || fallback
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  }

  // A refused call (current intake only, exam started, not printed yet…):
  // show the backend's message once and stop — no retry, no follow-up call.
  const fail = (error: unknown, fallback: string) => {
    const msg = (error as { message?: string } | null)?.message || fallback
    setActionError(msg)
    showToast(msg, 'error')
  }

  // 1. Print booklet → (confirm reprint) → download booklet PDF.
  const handlePrintBooklet = async (confirm = false) => {
    if (!formComplete || !canPrint || isWorking) return
    setActionError(null)
    setActiveAction('booklet')
    try {
      const result = await printBooklet.mutateAsync(request(confirm))
      if (result.confirmationRequired && !confirm) {
        setActiveAction(null)
        setConfirmation({
          message: result.message || 'Booklets are already printed. Do you want to reprint the same?',
          action: () => handlePrintBooklet(true),
        })
        return
      }
      const file = await downloadBooklet.mutateAsync(request())
      saveFile(file.blob, file.filename, 'ProjectBooklet.pdf')
      showToast(result.wasReprint ? 'Booklet reprinted successfully.' : 'Booklet printed successfully.', 'success')
    } catch (error) {
      fail(error, 'Failed to print the booklet.')
    } finally {
      setActiveAction(null)
    }
  }

  // 2–5. Downloads of an already printed set (404 until the booklet is printed).
  const runDownload = async (action: Exclude<Action, 'booklet'>, fallbackName: string, okMsg: string, failMsg: string) => {
    if (!formComplete || isWorking) return
    const mut = action === 'booklet-pdf' ? downloadBooklet
      : action === 'attendance' ? downloadAttendance
      : action === 'cover' ? downloadCover
      : downloadConsolidated
    setActionError(null)
    setActiveAction(action)
    try {
      const file = await mut.mutateAsync(request())
      saveFile(file.blob, file.filename, fallbackName)
      showToast(okMsg, 'success')
    } catch (error) {
      fail(error, failMsg)
    } finally {
      setActiveAction(null)
    }
  }

  const ACTIONS: { key: Action; label: string; icon: string; allowed: boolean; run: () => void }[] = [
    { key: 'booklet', label: 'Print Booklet', icon: 'lni-printer', allowed: canPrint, run: () => handlePrintBooklet() },
    { key: 'booklet-pdf', label: 'Booklet PDF', icon: 'lni-empty-file', allowed: canGetBooklet, run: () => runDownload('booklet-pdf', 'ProjectBooklet.pdf', 'Booklet downloaded.', 'Failed to download the booklet. Print it first.') },
    { key: 'attendance', label: 'Attendance', icon: 'lni-users', allowed: canGetAttendance, run: () => runDownload('attendance', 'AttendanceSheet.pdf', 'Attendance sheet downloaded.', 'Failed to download the attendance sheet. Print the booklet first.') },
    { key: 'cover', label: 'Cover Letter', icon: 'lni-envelope', allowed: canGetCover, run: () => runDownload('cover', 'CoverLetter.pdf', 'Cover letter downloaded.', 'Failed to download the cover letter. Print the booklet first.') },
    { key: 'consolidated', label: 'Mark Sheet', icon: 'lni-list', allowed: canGetConsolidated, run: () => runDownload('consolidated', 'ConsolidatedMarkSheet.pdf', 'Consolidated mark sheet downloaded.', 'Failed to download the consolidated mark sheet. Print the booklet first.') },
  ]

  const noProjectUnits = !!selectedSemesterGuid && !unitsLoading && !unitsQuery.isError && courseUnits.length === 0

  return (
    <div className="page active">
      <div className="pg-hdr flex justify-between items-end">
        <div>
          <h1 className="pg-title">University Exam Project Booklet Print</h1>
          <p className="pg-sub">Generate and print exam booklets for Project course units</p>
        </div>
        <button className="btn btn-neu" onClick={handleCancel} disabled={isWorking}>
          <i className="lni lni-close"></i> Cancel
        </button>
      </div>

      <div className="card mb-5">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-5">
          <div className="fg mb-0">
            <label className="lbl">Academic Intake <span className="text-red-500">*</span></label>
            <SearchSelect
              placeholder="— Select Intake —"
              value={selectedIntakeGuid}
              onChange={v => { setSelectedIntakeGuid(v); setActionError(null) }}
              disabled={intakesLoading}
              // Print only accepts the current intake, but the downloads work for any.
              options={(intakes ?? []).map(i => ({
                value: i.intakeGuid,
                label: `${i.description || i.intakeCode}${i.currentIntake ? ' (Current)' : ''}`,
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
              options={(programs ?? []).map((pr: any) => ({
                value: pr.programGuid,
                label: pr.programName,
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
            <label className="lbl">Course Unit (Project) <span className="text-red-500">*</span></label>
            <SearchSelect
              placeholder={noProjectUnits ? 'No Project units' : '— Select Project Unit —'}
              value={selectedCourseUnitGuid}
              onChange={v => { setSelectedCourseUnitGuid(v); setActionError(null) }}
              disabled={!selectedSemesterGuid || unitsLoading || courseUnits.length === 0}
              options={courseUnits.map((u: any) => ({
                value: u.courseUnitGuid,
                label: `${u.courseUnitCode} - ${u.courseUnitName}`,
              }))}
            />
            {unitsQuery.isError && (
              <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>
                {(unitsQuery.error as Error)?.message || 'Couldn’t load the course units.'}
              </p>
            )}
            {noProjectUnits && (
              <p className="text-g400" style={{ fontSize: 12, marginTop: 4 }}>
                This semester has no Project course units. Pick another semester (projects are usually in the final year).
              </p>
            )}
          </div>
        </div>

        <div className="p-5 pt-0 mt-4 grid grid-cols-1 gap-6">
          {/* Booklet & registers */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs max-w-4xl mx-auto w-full">
            <div className="bg-gray-50 px-5 py-4 border-b border-gray-200 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'var(--b50)', color: 'var(--b600)' }}>
                <i className="lni lni-book"></i>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 text-sm m-0">Project Booklet &amp; Registers</h3>
                <p className="text-xs text-gray-500 m-0">
                  {formComplete ? 'Print the booklet first; the downloads need a printed booklet.' : 'Select a course unit'}
                </p>
              </div>
            </div>
            <div className="p-5 grid grid-cols-2 md:grid-cols-5 gap-3">
              {ACTIONS.filter(a => a.allowed).map(a => {
                const busy = activeAction === a.key
                return (
                  <button
                    key={a.key}
                    type="button"
                    className="flex flex-col items-center justify-center p-4 border rounded-xl gap-2 text-sm font-medium transition-all bg-white hover:border-primary hover:text-primary hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:hover:shadow-none disabled:hover:text-gray-700"
                    onClick={a.run}
                    disabled={!formComplete || isWorking}
                    aria-busy={busy || undefined}
                  >
                    <i className={`lni ${busy ? 'lni-spinner-arrow spin' : a.icon} text-3xl text-primary`} aria-hidden="true"></i>
                    {a.label}
                  </button>
                )
              })}
            </div>
            {actionError && (
              <div className="px-5 pb-5">
                <div className="danger-box text-sm" role="alert"><i className="lni lni-warning"></i> {actionError}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {confirmation && (
        <div className="perm-delete-overlay" style={{ position: 'fixed', zIndex: 500 }}>
          <div className="perm-delete-card tab-panel-in" role="alertdialog" aria-modal="true" aria-label="Confirmation required">
            <div className="perm-delete-icon"><i className="lni lni-warning" /></div>
            <div className="perm-delete-title">Confirmation Required</div>
            <div className="perm-delete-sub">{confirmation.message}</div>
            <div className="perm-delete-actions">
              <button className="btn btn-neu" onClick={() => setConfirmation(null)}>No</button>
              <button className="btn btn-primary" autoFocus onClick={() => { const action = confirmation.action; setConfirmation(null); action() }}>Yes, reprint</button>
            </div>
          </div>
        </div>
      )}
      <Toast toast={toast} />
    </div>
  )
}
