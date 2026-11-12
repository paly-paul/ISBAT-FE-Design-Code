'use client'
import { useState, useRef } from 'react'
import Link from 'next/link'
import { Toast } from '@/components/Toast'
import { ScrollTable } from '@/components/ScrollTable'
import { EmptyState } from '@/components/EmptyState'
import { TableLoadingState } from '@/components/TableLoadingState'
import { SearchSelect } from '@/components/SearchSelect'
import { ActionMenu } from '@/components/ActionMenu'
import { usePagePermissions } from '@/hooks/users/usePagePermissions'
import { IaStructureViewModal } from './_components/IaStructureViewModal'
import { CwScheduleModal } from './_components/CwScheduleModal'
import { CbtScheduleModal } from './_components/CbtScheduleModal'
import { UeScheduleModal } from './_components/UeScheduleModal'
import { type IaStructureRowDto } from '@/lib/api/assessment/iaCreation'
import { useCurrentAcademicIntake } from '@/hooks/academic/useIntakes'
import { useProgramDropdown } from '@/hooks/academic/useProgramMaster'
import {
  useIaCreationSemesters,
  useIaCreationStructure,
  useCreateIaStructure,
} from '@/hooks/assessment/useIaCreation'
import { extractApiErrorMessage } from '@/lib/errorMessages'

function formatDateRange(start: string | null, end: string | null) {
  if (!start) return null
  const s = new Date(start)
  const formatPart = (d: Date) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    let h = d.getHours()
    const ampm = h >= 12 ? 'PM' : 'AM'
    h = h % 12; h = h ? h : 12;
    const m = d.getMinutes().toString().padStart(2, '0')
    return `${months[d.getMonth()]} ${d.getDate()} ${d.getFullYear()} ${h}:${m}${ampm}`
  }

  const startStr = formatPart(s)
  if (!end) return startStr
  const e = new Date(end)
  return `${startStr} - ${formatPart(e)}`
}

// "Nov 10 2026 10:02AM - Nov 10 2026 1:00PM" from a UE date + times (date may carry T00:00:00).
function examRange(date: string | null, start: string | null, end: string | null) {
  if (!date || !start) return null
  const day = date.split('T')[0]
  return formatDateRange(`${day}T${start}`, end ? `${day}T${end}` : null)
}

// One schedule entry in the grid (class test, course work, theory or practical exam).
// Rows with canEdit false (past intakes) are read-only: greyed text, no links. The save
// APIs don't check canEdit, so this is where it's enforced.
function ScheduleCell({ label, range, rowEditable, canAdd, canEditPerm, addText, onOpen }: {
  label?: string
  range: string | null
  rowEditable: boolean
  canAdd: boolean
  canEditPerm: boolean
  addText: string
  onOpen: () => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {label && <span className="text-g500 text-[10.5px] font-semibold uppercase">{label}</span>}
      {range ? (
        rowEditable && canEditPerm ? (
          <span className="text-g900 font-medium text-[11px] leading-tight" style={{ cursor: 'pointer', borderBottom: '1px dashed #9ca3af' }} onClick={onOpen}>{range}</span>
        ) : (
          <span className={`font-medium text-[11px] leading-tight ${rowEditable ? 'text-g900' : 'text-g400'}`}>{range}</span>
        )
      ) : rowEditable && canAdd ? (
        <button onClick={onOpen} className="text-[#3a6bc9] hover:underline">{addText}</button>
      ) : (
        <span className="text-g400 text-xs">Not scheduled</span>
      )}
    </div>
  )
}

function formatDate(dateString: string | null) {
  if (!dateString) return <span className="text-g300">—</span>
  return <span>{new Date(dateString).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: '2-digit' })}</span>
}

export default function IaCreationPage() {
  const permissions = usePagePermissions()
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null)

  // ── Selections ──────────────────────────────────
  const [selectedProgramGuid, setSelectedProgramGuid] = useState<string>('')
  const [selectedSemesterGuid, setSelectedSemesterGuid] = useState<string>('')

  // ── Modal State ─────────────────────────────────
  const [viewingRow, setViewingRow] = useState<IaStructureRowDto | null>(null)
  const [selectedCwGuid, setSelectedCwGuid] = useState<string | null>(null)
  const [selectedCbtData, setSelectedCbtData] = useState<{ testGuid: string, unitCode: string, unitName: string } | null>(null)
  const [selectedUeData, setSelectedUeData] = useState<{ examGuid: string, unitCode: string, unitName: string } | null>(null)

  // ── Data fetching ─────────────────────────────────
  // Structures are only created/edited for the current academic intake — the
  // session is locked to it, not a choice. (assessment-structure-page.md lists
  // every intake; locked at the product owner's request.)
  const { data: currentIntake, isLoading: intakeLoading } = useCurrentAcademicIntake()
  const { data: programs, isLoading: programsLoading } = useProgramDropdown()
  const initLoading = intakeLoading || programsLoading
  const selectedIntakeGuid = currentIntake?.intakeGuid ?? ''
  const intakeLabel = currentIntake ? (currentIntake.description ?? `Intake ${currentIntake.intakeCode}`) : ''
  const { data: semesters, isLoading: semLoading } = useIaCreationSemesters(selectedProgramGuid || null)
  const {
    data: structureRows,
    isLoading: structureLoading,
    error: structureError,
    refetch: refetchStructure,
  } = useIaCreationStructure(
    selectedProgramGuid || null,
    selectedSemesterGuid || null,
    selectedIntakeGuid || null
  )
  const createMut = useCreateIaStructure()



  function showToast(msg: string, type = '') {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current)
    }
    setToast({ msg, type })
    const isErrorOrWarn = ['error', 'err', 'danger', 'warn', 'warning'].includes((type || '').toLowerCase().trim())
    const duration = isErrorOrWarn ? 8000 : 4000
    toastTimerRef.current = setTimeout(() => {
      setToast(null)
      toastTimerRef.current = null
    }, duration)
  }

  function handleProgramChange(guid: string) {
    setSelectedProgramGuid(guid)
    setSelectedSemesterGuid('')
  }

  function handleRefresh() {
    if (!selectedProgramGuid || !selectedSemesterGuid || !selectedIntakeGuid) {
      showToast(selectedIntakeGuid ? 'Please select Programme and Semester first.' : 'No current academic intake is set.', 'error')
      return
    }
    refetchStructure()
  }

  async function handleCreate() {
    if (!selectedProgramGuid || !selectedSemesterGuid || !selectedIntakeGuid) {
      showToast(selectedIntakeGuid ? 'Please select Programme and Semester first.' : 'No current academic intake is set.', 'error')
      return
    }
    try {
      await createMut.mutateAsync({
        programGuid: selectedProgramGuid,
        semesterGuid: selectedSemesterGuid,
        intakeGuid: selectedIntakeGuid,
      })
      showToast('IA Structure created successfully.', 'success')
    } catch (err: any) {
      // AuthError carries the envelope's code, not the HTTP status.
      if (err?.code === 'conflict') {
        // Informational, not an error — and load the grid so it's visible.
        showToast('IA Structure already exists for this combination.', '')
        refetchStructure()
      } else {
        showToast(extractApiErrorMessage(err, 'Failed to create IA Structure.'), 'error')
      }
    }
  }

  const canRefresh = !!selectedProgramGuid && !!selectedSemesterGuid && !!selectedIntakeGuid
  const is404 = (structureError as { code?: string } | null)?.code === 'not_found'

  return (
    <div id="page-ia-creation">
      {/* ── Page Header ── */}
      <div className="pg-hdr">
        <div>
          <h1 className="text-xl font-semibold text-g900">Assessment Scheduler</h1>
          <p className="text-sm text-g500 mt-0.5">
            Create Internal Assessment skeleton for Course Work, Class Test and University Exam
          </p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <button
            className="btn btn-neu flex-1 sm:flex-none justify-center"
            onClick={handleRefresh}
            disabled={!canRefresh || structureLoading}
          >
            <i className="lni lni-reload" />
            {structureLoading ? 'Loading…' : 'Refresh'}
          </button>
          {permissions.add && (
            <button
              className="btn btn-primary flex-1 sm:flex-none justify-center whitespace-nowrap"
              onClick={handleCreate}
              disabled={!canRefresh || createMut.isPending}
            >
              <i className="lni lni-plus" />
              {createMut.isPending ? 'Creating…' : 'Create Structure'}
            </button>
          )}
        </div>
      </div>

      {/* ── Filters Card ── */}
      <div className="card mb-4">
        <h2 className="text-base font-semibold text-g800 mb-4">Select Combination</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Academic Session */}
          <div className="fg mb-0">
            <label className="lbl">Academic Session</label>
            {/* readOnly, not disabled — the grey .ctrl:disabled style reads as
                "unavailable"; the lock icon says it's fixed. */}
            <div className="inp-wrap">
              <i className="lni lni-lock-alt inp-icon"></i>
              <input
                className="ctrl"
                value={initLoading ? 'Loading…' : intakeLabel ? `${intakeLabel} (Current)` : 'No current intake set'}
                readOnly
                tabIndex={-1}
                style={{ cursor: 'default', fontWeight: 600 }}
                title="Assessment structures are set up for the current academic session only"
              />
            </div>
            {!initLoading && !currentIntake && (
              <p className="text-clr-red" style={{ fontSize: 11.5, marginTop: 4 }}>No intake is marked as the current academic intake. Set one in Intake Master to create assessment structures.</p>
            )}
          </div>

          {/* Programme */}
          <div className="fg mb-0">
            <label className="lbl">Programme</label>
            <SearchSelect
              placeholder="— Select Programme —"
              value={selectedProgramGuid}
              onChange={val => handleProgramChange(val)}
              disabled={initLoading}
              options={(programs ?? []).map(p => ({
                value: p.programGuid,
                label: `${p.programCode} — ${p.programName}`,
              }))}
            />
          </div>

          {/* Semester */}
          <div className="fg mb-0">
            <label className="lbl">Semester</label>
            <SearchSelect
              placeholder={!selectedProgramGuid ? '— Select Programme first —' : '— Select Semester —'}
              value={selectedSemesterGuid}
              onChange={val => setSelectedSemesterGuid(val)}
              disabled={!selectedProgramGuid || semLoading}
              options={(semesters ?? []).map(s => ({
                value: s.semesterGuid,
                label: s.semName,
              }))}
            />
          </div>
        </div>
      </div>

      {/* ── Structure Grid ── */}
      <div className="card">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            <h2 className="text-base font-semibold text-g800">IA Structure</h2>
            <p className="text-xs text-g400 mt-0.5">
              {structureRows ? `${structureRows.length} unit(s) in this combination` : 'Select all filters and click Refresh'}
            </p>
          </div>
        </div>

        {/* 404 — no session mapping */}
        {is404 && (
          <div className="flex flex-col items-center justify-center py-12 gap-2 text-center">
            <i className="lni lni-warning text-3xl text-amber-400" />
            <div className="text-sm font-semibold text-g700 mt-2">No Session Mapping Found</div>
            <div className="text-xs text-g500 max-w-sm">
              No session mapping is configured for this Programme / Semester / Intake combination. Please contact Academic Affairs.
            </div>
          </div>
        )}

        {/* Table */}
        {!is404 && (
          <ScrollTable>
            <table>
              {canRefresh && structureRows && structureRows.length > 0 && (
                <thead>
                  <tr className="bg-[#001f5c] text-white text-center text-sm">
                    <th className="w-12 text-center py-3 px-2 border-r border-white/20"></th>
                    <th className="py-3 px-4 font-semibold border-r border-white/20 text-left">Unit Code</th>
                    <th className="py-3 px-4 font-semibold border-r border-white/20 text-left">Unit Name</th>
                    <th className="py-3 px-4 font-semibold border-r border-white/20 text-left">Class Test</th>
                    <th className="py-3 px-4 font-semibold border-r border-white/20 text-left">Course Work</th>
                    <th className="py-3 px-4 font-semibold text-left">University Exam</th>
                  </tr>
                </thead>
              )}
              <tbody>
                {structureLoading ? (
                  <TableLoadingState colSpan={12} />
                ) : !canRefresh ? (
                  <tr>
                    <td colSpan={12}>
                      <div className="flex flex-col items-center justify-center py-10 gap-2 text-center text-g400">
                        <i className="lni lni-pointer text-2xl" />
                        <span className="text-sm">Select Programme, Semester &amp; Session to view structure</span>
                      </div>
                    </td>
                  </tr>
                ) : structureRows?.length === 0 ? (
                  <EmptyState
                    colSpan={6}
                    hasFilters={false}
                    onClearFilters={() => { }}
                    subtitle="No structure created yet. Click Create Structure to generate it."
                  />
                ) : (
                  structureRows?.map((row, idx) => (
                    <tr key={row.internalAssessmentGuid} className={`text-[13px] ${idx % 2 === 0 ? 'bg-white' : 'bg-[#e7f1f9]'}`}>
                      <td className="text-center">
                        <ActionMenu>
                          <button
                            className="btn btn-neu btn-sm flex items-center justify-start gap-1.5 w-full"
                            onClick={() => setViewingRow(row)}
                          >
                            <i className="lni lni-eye" /> View
                          </button>
                        </ActionMenu>
                      </td>
                      <td className="font-mono text-sm border-r border-slate-200 px-4 py-3">{row.unitCode ?? '—'}</td>
                      <td className="font-medium border-r border-slate-200 px-4 py-3">{row.unitName ?? '—'}</td>

                      {/* Class Test */}
                      <td className="border-r border-slate-200 px-4 py-3 text-left">
                        {row.classTestGuid ? (
                          <ScheduleCell
                            range={formatDateRange(row.classTestStartDateTime, row.classTestEndDateTime)}
                            rowEditable={row.canEdit}
                            canAdd={permissions.add}
                            canEditPerm={permissions.edit}
                            addText="Add Class Test"
                            onOpen={() => setSelectedCbtData({ testGuid: row.classTestGuid!, unitCode: row.unitCode ?? '', unitName: row.unitName ?? '' })}
                          />
                        ) : (
                          <span className="text-g400 text-xs">—</span>
                        )}
                      </td>

                      {/* Course Work */}
                      <td className="border-r border-slate-200 px-4 py-3 text-left">
                        {row.courseworkGuid ? (
                          <ScheduleCell
                            range={formatDateRange(row.courseworkStartDateTime, row.courseworkEndDateTime)}
                            rowEditable={row.canEdit}
                            canAdd={permissions.add}
                            canEditPerm={permissions.edit}
                            addText="Add Course work"
                            onOpen={() => setSelectedCwGuid(row.courseworkGuid)}
                          />
                        ) : (
                          <span className="text-g400 text-xs">—</span>
                        )}
                      </td>

                      {/* Uni. Exam: Combined (Theory + Practical), Theory-only, or Practical-only */}
                      <td className="px-4 py-3 text-left">
                        {row.universityExamGuid && row.practicalExamGuid ? (
                          <div className="flex flex-col gap-1.5">
                            <ScheduleCell
                              label="Theory"
                              range={examRange(row.examDate, row.examStartTime, row.examEndTime)}
                              rowEditable={row.canEdit}
                              canAdd={permissions.add}
                              canEditPerm={permissions.edit}
                              addText="Add Theory Exam"
                              onOpen={() => setSelectedUeData({ examGuid: row.universityExamGuid!, unitCode: row.unitCode ?? '', unitName: row.unitName ?? '' })}
                            />
                            <ScheduleCell
                              label="Practical"
                              range={examRange(row.practicalExamDate, row.practicalExamStartTime, row.practicalExamEndTime)}
                              rowEditable={row.canEdit}
                              canAdd={permissions.add}
                              canEditPerm={permissions.edit}
                              addText="Add Practical Exam"
                              onOpen={() => setSelectedUeData({ examGuid: row.practicalExamGuid!, unitCode: row.unitCode ?? '', unitName: row.unitName ?? '' })}
                            />
                          </div>
                        ) : row.universityExamGuid ? (
                          <ScheduleCell
                            range={examRange(row.examDate, row.examStartTime, row.examEndTime)}
                            rowEditable={row.canEdit}
                            canAdd={permissions.add}
                            canEditPerm={permissions.edit}
                            addText="Add University Exam"
                            onOpen={() => setSelectedUeData({ examGuid: row.universityExamGuid!, unitCode: row.unitCode ?? '', unitName: row.unitName ?? '' })}
                          />
                        ) : row.practicalExamGuid ? (
                          <ScheduleCell
                            range={examRange(row.practicalExamDate, row.practicalExamStartTime, row.practicalExamEndTime)}
                            rowEditable={row.canEdit}
                            canAdd={permissions.add}
                            canEditPerm={permissions.edit}
                            addText="Add Practical Exam"
                            onOpen={() => setSelectedUeData({ examGuid: row.practicalExamGuid!, unitCode: row.unitCode ?? '', unitName: row.unitName ?? '' })}
                          />
                        ) : (
                          <span className="text-g400 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </ScrollTable>
        )}
      </div>

      <Toast toast={toast} onClose={() => setToast(null)} />

      {viewingRow && (
        <IaStructureViewModal
          row={viewingRow}
          progName={programs?.find(p => p.programGuid === selectedProgramGuid)?.programName || ''}
          semName={semesters?.find(s => s.semesterGuid === selectedSemesterGuid)?.semName || ''}
          onClose={() => setViewingRow(null)}
          onEditCw={(guid) => setSelectedCwGuid(guid)}
          onEditCt={(guid) => setSelectedCbtData({
            testGuid: guid,
            unitCode: viewingRow.unitCode ?? '',
            unitName: viewingRow.unitName ?? ''
          })}
          onEditUe={(guid) => setSelectedUeData({
            examGuid: guid,
            unitCode: viewingRow.unitCode ?? '',
            unitName: viewingRow.unitName ?? ''
          })}
        />
      )}

      <CwScheduleModal
        isOpen={!!selectedCwGuid}
        onClose={() => setSelectedCwGuid(null)}
        courseworkGuid={selectedCwGuid}
      />

      <CbtScheduleModal
        isOpen={!!selectedCbtData}
        onClose={() => setSelectedCbtData(null)}
        testGuid={selectedCbtData?.testGuid || null}
        unitCode={selectedCbtData?.unitCode || ''}
        unitName={selectedCbtData?.unitName || ''}
      />

      <UeScheduleModal
        isOpen={!!selectedUeData}
        onClose={() => setSelectedUeData(null)}
        examGuid={selectedUeData?.examGuid || null}
        unitCode={selectedUeData?.unitCode || ''}
        unitName={selectedUeData?.unitName || ''}
      />
    </div>
  )
}
