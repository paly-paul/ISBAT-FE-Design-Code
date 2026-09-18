'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ScrollTable } from '@/components/ScrollTable'
import { EmptyState } from '@/components/EmptyState'
import { Pagination } from '@/components/Pagination'
import { Toast } from '@/components/Toast'
import { SearchSelect } from '@/components/SearchSelect'
import { useCurrentAcademicIntake, useSearchIntakesInfinite } from '@/hooks/academic/useIntakes'
import { useSearchCampusesInfinite } from '@/hooks/config/useCampuses'
import { flattenUniquePages } from '@/lib/pagination'

interface ExamScheduleRow {
  id: string
  intakeText: string
  programName: string
  programCode: string
  semesterCode: string
  status: 'Completed' | 'Pending' | 'Ready'
}

const INITIAL_ROWS: ExamScheduleRow[] = [
  {
    id: 'row-1',
    intakeText: 'Spring 2026 (20261)',
    programName: 'BSc. Networking and Cyber Security',
    programCode: 'BNCS',
    semesterCode: 'Semester 1',
    status: 'Completed',
  },
  {
    id: 'row-2',
    intakeText: 'Spring 2026 (20261)',
    programName: 'Bachelor of Information Technology',
    programCode: 'BIT',
    semesterCode: 'Semester 2',
    status: 'Ready',
  },
  {
    id: 'row-3',
    intakeText: 'Spring 2026 (20261)',
    programName: 'BSc. Computer Science',
    programCode: 'BCS',
    semesterCode: 'Semester 1',
    status: 'Pending',
  },
  {
    id: 'row-4',
    intakeText: 'Spring 2026 (20261)',
    programName: 'Master of Business Administration',
    programCode: 'MBA',
    semesterCode: 'Semester 1',
    status: 'Ready',
  },
  {
    id: 'row-5',
    intakeText: 'Spring 2026 (20261)',
    programName: 'Bachelor of Business Administration',
    programCode: 'BBA',
    semesterCode: 'Semester 3',
    status: 'Completed',
  },
  {
    id: 'row-6',
    intakeText: 'Spring 2026 (20261)',
    programName: 'Diploma in Information Technology',
    programCode: 'DIT',
    semesterCode: 'Semester 2',
    status: 'Ready',
  },
  {
    id: 'row-7',
    intakeText: 'Spring 2026 (20261)',
    programName: 'BSc. Software Engineering',
    programCode: 'BSE',
    semesterCode: 'Semester 4',
    status: 'Pending',
  },
  {
    id: 'row-8',
    intakeText: 'Spring 2026 (20261)',
    programName: 'Master of Science in Information Technology',
    programCode: 'MSIT',
    semesterCode: 'Semester 2',
    status: 'Ready',
  },
]

export default function BulkExamSchedulerPage() {
  const router = useRouter()
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)
  function showToast(msg: string, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  // ── 1. Live Academic Session / Intake Hook ──────────────────────────────────
  const [intakeGuid, setIntakeGuid] = useState('')
  const [campusGuid, setCampusGuid] = useState('')
  const [page, setPage] = useState(1)

  const [intakeSearch, setIntakeSearch] = useState('')
  const [campusSearch, setCampusSearch] = useState('')
  const [committedIntakeSearch, setCommittedIntakeSearch] = useState('')
  const [committedCampusSearch, setCommittedCampusSearch] = useState('')
  const [intakePickerOpen, setIntakePickerOpen] = useState(false)
  const [campusPickerOpen, setCampusPickerOpen] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setCommittedIntakeSearch(intakeSearch.trim()), 300)
    return () => clearTimeout(timer)
  }, [intakeSearch])

  useEffect(() => {
    const timer = setTimeout(() => setCommittedCampusSearch(campusSearch.trim()), 300)
    return () => clearTimeout(timer)
  }, [campusSearch])

  const intakeQuery = useSearchIntakesInfinite(committedIntakeSearch, 20, intakePickerOpen || !intakeGuid)
  const campusQuery = useSearchCampusesInfinite(committedCampusSearch, 20, campusPickerOpen)
  const { data: currentIntake } = useCurrentAcademicIntake()

  const intakes = useMemo(() => {
    const items = flattenUniquePages(intakeQuery.data?.pages ?? [], i => i.intakeGuid)
    if (currentIntake && !items.some(i => i.intakeGuid === currentIntake.intakeGuid)) {
      items.unshift(currentIntake)
    }
    return items
  }, [currentIntake, intakeQuery.data])

  const campuses = useMemo(
    () => flattenUniquePages(campusQuery.data?.pages ?? [], c => c.campusGuid),
    [campusQuery.data]
  )

  // Default to current intake once intakes load
  useEffect(() => {
    if (intakeGuid) return
    if (currentIntake) {
      setIntakeGuid(currentIntake.intakeGuid)
    } else if (intakes.length > 0) {
      setIntakeGuid(intakes[0].intakeGuid)
    }
  }, [currentIntake, intakeGuid, intakes])

  useEffect(() => setPage(1), [intakeGuid, campusGuid])

  const selectedIntake = intakes.find(i => i.intakeGuid === intakeGuid)
  const selectedIntakeLabel = selectedIntake
    ? `${selectedIntake.description} (${selectedIntake.intakeCode})`
    : 'Selected Session'

  // ── 2. Table Data (UI structure as requested, no table API integrated) ─────
  const [rows, setRows] = useState<ExamScheduleRow[]>(INITIAL_ROWS)
  const [schedulingId, setSchedulingId] = useState<string | null>(null)

  // Modals state
  const [confirmRow, setConfirmRow] = useState<ExamScheduleRow | null>(null)
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false)
  const [isBulkProcessing, setIsBulkProcessing] = useState(false)

  // Single schedule handler
  const handleScheduleClick = (row: ExamScheduleRow) => {
    setConfirmRow(row)
  }

  const handleConfirmSingleSchedule = () => {
    if (!confirmRow) return
    setSchedulingId(confirmRow.id)
    setTimeout(() => {
      setRows(prev =>
        prev.map(r => (r.id === confirmRow.id ? { ...r, status: 'Completed' } : r))
      )
      setSchedulingId(null)
      showToast(
        `Exam schedule created for ${confirmRow.programName}, ${confirmRow.semesterCode}.`,
        'success'
      )
      setConfirmRow(null)
    }, 600)
  }

  // Bulk schedule handler
  const handleExecuteBulkSchedule = () => {
    setIsBulkProcessing(true)
    setTimeout(() => {
      setRows(prev =>
        prev.map(r => (r.status === 'Ready' ? { ...r, status: 'Completed' } : r))
      )
      setIsBulkProcessing(false)
      setIsBulkModalOpen(false)
      showToast(
        `Bulk examination scheduling completed for ${selectedIntakeLabel}.`,
        'success'
      )
    }, 1200)
  }

  const PAGE_SIZE = 10
  const totalPages = Math.ceil(rows.length / PAGE_SIZE) || 1

  return (
    <>
      <div className="page active" id="page-bulk-exam-scheduler">
        {/* ── Page Header ─────────────────────────────────────────────────── */}
        <div className="pg-hdr flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <div className="pg-title flex items-center gap-2">
              <span>Bulk Exam Scheduler</span>
              <span className="badge badge-purple text-[11px] font-semibold">
                Exam Ops
              </span>
            </div>
            <div className="pg-sub text-xs text-slate-500">
              Schedule examinations in bulk or manage session-wise examination schedules
            </div>
          </div>
          <button
            type="button"
            className="btn btn-neu"
            onClick={() => router.push('/assessment/dashboard')}
          >
            <i className="lni lni-arrow-left"></i> Back
          </button>
        </div>

        {/* ── Top Filter Card (Session Management with Live APIs) ─────────── */}
        <div className="card mb-[18px]">
          <div className="card-hdr">
            <div className="card-title">
              <span className="ctitle-icon">
                <i className="lni lni-calendar"></i>
              </span>{' '}
              Session Management
            </div>
          </div>
          <div className="g2">
            {/* 1. Academic Session Dropdown (Live API) */}
            <div className="fg">
              <div className="lbl">
                Academic Session <span className="req">*</span>
              </div>
              <SearchSelect
                options={intakes.map(i => ({
                  value: i.intakeGuid,
                  label: `${i.description} (${i.intakeCode})`,
                }))}
                value={intakeGuid}
                onSearch={setIntakeSearch}
                onOpenChange={setIntakePickerOpen}
                hasNextPage={intakeQuery.hasNextPage}
                isFetchingNextPage={intakeQuery.isFetchingNextPage}
                onLoadMore={() => intakeQuery.fetchNextPage()}
                onChange={setIntakeGuid}
                placeholder="Select Academic Session..."
              />
            </div>

            {/* 2. Campus Dropdown (Live API) */}
            <div className="fg">
              <div className="lbl">Campus</div>
              <SearchSelect
                placeholder="All Campuses"
                options={campuses.map(c => ({
                  value: c.campusGuid,
                  label: c.campusName,
                }))}
                value={campusGuid}
                onSearch={setCampusSearch}
                onOpenChange={setCampusPickerOpen}
                hasNextPage={campusQuery.hasNextPage}
                isFetchingNextPage={campusQuery.isFetchingNextPage}
                onLoadMore={() => campusQuery.fetchNextPage()}
                onChange={setCampusGuid}
              />
            </div>
          </div>
        </div>

        {/* ── Lower Card: Bulk Exam Scheduler Table ────────────────────────── */}
        <div className="card">
          <div className="card-hdr">
            <div className="card-title">
              <span className="ctitle-icon">
                <i className="lni lni-calendar"></i>
              </span>{' '}
              Bulk Exam Scheduler
            </div>
            {/* Bulk Action Button */}
            <button
              type="button"
              className="btn btn-primary btn-sm"
              disabled={!intakeGuid}
              onClick={() => setIsBulkModalOpen(true)}
            >
              <i className="lni lni-calendar"></i> Bulk Exam Scheduler
            </button>
          </div>

          {!intakeGuid ? (
            <div
              className="text-g400 text-center"
              style={{ padding: 24, fontSize: 13 }}
            >
              Select an Academic Session to load exam schedules.
            </div>
          ) : (
            <>
              <ScrollTable>
                <table>
                  <thead>
                    <tr>
                      <th style={{ minWidth: 180 }}>Admission Intake</th>
                      <th style={{ minWidth: 260 }}>Programme</th>
                      <th style={{ minWidth: 120 }}>Semester</th>
                      <th style={{ minWidth: 220 }}>Exam Schedule</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.length === 0 ? (
                      <EmptyState
                        colSpan={4}
                        title="No exam schedules found"
                        subtitle="No programmes match the selected intake/campus filter."
                      />
                    ) : (
                      rows.map(r => {
                        const isRowScheduling = schedulingId === r.id
                        return (
                          <tr key={r.id}>
                            <td className="font-bold text-slate-800">{selectedIntakeLabel}</td>
                            <td>
                              <span className="font-semibold text-slate-900">{r.programName}</span>{' '}
                              <span className="text-slate-400 font-mono text-xs">({r.programCode})</span>
                            </td>
                            <td className="font-bold text-slate-700">{r.semesterCode}</td>
                            <td>
                              {r.status === 'Completed' ? (
                                <span
                                  className="badge badge-blue"
                                  style={{
                                    width: '100%',
                                    justifyContent: 'center',
                                    padding: '8px 10px',
                                    display: 'flex',
                                  }}
                                >
                                  <i className="lni lni-checkmark"></i>&nbsp;Exam Schedule Completed
                                </span>
                              ) : r.status === 'Pending' ? (
                                <span
                                  className="badge badge-amber"
                                  style={{
                                    width: '100%',
                                    justifyContent: 'center',
                                    padding: '8px 10px',
                                    display: 'flex',
                                  }}
                                >
                                  Pending Date Sheet
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  className="btn btn-primary btn-sm"
                                  style={{
                                    width: '100%',
                                    justifyContent: 'center',
                                    borderRadius: 999,
                                  }}
                                  disabled={isRowScheduling}
                                  onClick={() => handleScheduleClick(r)}
                                >
                                  <i className={`lni ${isRowScheduling ? 'lni-reload animate-spin' : 'lni-calendar'}`}></i>{' '}
                                  {isRowScheduling ? 'Scheduling…' : 'Schedule Exam'}
                                </button>
                              )}
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </ScrollTable>

              <Pagination
                page={page}
                totalPages={totalPages}
                totalCount={rows.length}
                itemLabel="sessions"
                onPageChange={setPage}
              />
            </>
          )}
        </div>
      </div>

      {/* ── Confirm Single Schedule Modal ─────────────────────────────────── */}
      {confirmRow && (
        <div
          className="modal-overlay open"
          onClick={() => setConfirmRow(null)}
          style={{ zIndex: 650 }}
        >
          <div
            className="modal modal-md flex flex-col"
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: 500 }}
          >
            <div className="modal-hdr modal-hdr-blue shrink-0">
              <div className="modal-title flex items-center gap-2">
                <i className="lni lni-calendar text-base"></i>
                <span>Confirm Exam Scheduling</span>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => setConfirmRow(null)}
              >
                <i className="lni lni-close"></i>
              </button>
            </div>

            <div className="modal-body p-5 flex flex-col gap-4 text-xs">
              <p className="text-slate-600 leading-relaxed">
                You are about to schedule examinations for the following programme session:
              </p>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-2 text-slate-700">
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-slate-500 font-medium">Intake:</span>
                  <strong className="text-slate-900">{selectedIntakeLabel}</strong>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-slate-500 font-medium">Programme:</span>
                  <strong className="text-blue-700">
                    {confirmRow.programName} ({confirmRow.programCode})
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Semester:</span>
                  <strong className="text-slate-900">{confirmRow.semesterCode}</strong>
                </div>
              </div>
              <p className="text-slate-500 text-[11.5px]">
                This will prepare examination slots, hall allocation readiness, and date sheet linkage for all active course units in this semester.
              </p>
            </div>

            <div className="modal-foot flex justify-end gap-2 p-3.5 bg-white border-t border-slate-200">
              <button
                type="button"
                className="btn btn-neu text-xs"
                onClick={() => setConfirmRow(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary text-xs flex items-center gap-1.5"
                onClick={handleConfirmSingleSchedule}
              >
                <i className="lni lni-checkmark"></i> Confirm & Schedule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Bulk Exam Scheduler Modal ─────────────────────────────────────── */}
      {isBulkModalOpen && (
        <div
          className="modal-overlay open"
          onClick={() => !isBulkProcessing && setIsBulkModalOpen(false)}
          style={{ zIndex: 650 }}
        >
          <div
            className="modal modal-md flex flex-col"
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: 540 }}
          >
            <div className="modal-hdr modal-hdr-blue shrink-0">
              <div className="modal-title flex items-center gap-2">
                <i className="lni lni-calendar text-base"></i>
                <span>Bulk Exam Scheduler</span>
              </div>
              <button
                type="button"
                className="modal-close"
                disabled={isBulkProcessing}
                onClick={() => setIsBulkModalOpen(false)}
              >
                <i className="lni lni-close"></i>
              </button>
            </div>

            <div className="modal-body p-5 flex flex-col gap-4 text-xs">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3.5 text-blue-900 leading-relaxed">
                <strong>Intake-Wide Operation:</strong> This action initiates automatic examination scheduling for all eligible programmes in <strong>{selectedIntakeLabel}</strong>.
              </div>

              <div className="space-y-2 text-slate-600">
                <div className="flex items-center gap-2">
                  <i className="lni lni-checkmark-circle text-emerald-600 text-sm"></i>
                  <span>Allocates standard examination timetable windows</span>
                </div>
                <div className="flex items-center gap-2">
                  <i className="lni lni-checkmark-circle text-emerald-600 text-sm"></i>
                  <span>Links course units and semester exam cohorts</span>
                </div>
                <div className="flex items-center gap-2">
                  <i className="lni lni-checkmark-circle text-emerald-600 text-sm"></i>
                  <span>Preserves already-completed session exam schedules</span>
                </div>
              </div>

              <div className="text-[11.5px] text-slate-500 italic">
                Note: Any sessions marked &lsquo;Pending Date Sheet&rsquo; will be queued for scheduling once course allocations are finalized.
              </div>
            </div>

            <div className="modal-foot flex justify-end gap-2 p-3.5 bg-white border-t border-slate-200">
              <button
                type="button"
                className="btn btn-neu text-xs"
                disabled={isBulkProcessing}
                onClick={() => setIsBulkModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary text-xs flex items-center gap-1.5"
                disabled={isBulkProcessing}
                onClick={handleExecuteBulkSchedule}
              >
                {isBulkProcessing && <i className="lni lni-reload animate-spin"></i>}
                <span>{isBulkProcessing ? 'Processing Schedules…' : 'Execute Bulk Scheduling'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast toast={toast} />
    </>
  )
}
