'use client'
import { useState } from 'react'
import { Toast } from '@/components/Toast'
import { ScrollTable } from '@/components/ScrollTable'
import { EmptyState } from '@/components/EmptyState'
import { TableLoadingState } from '@/components/TableLoadingState'
import { SearchSelect } from '@/components/SearchSelect'
import {
  useIaCreationInit,
  useIaCreationSemesters,
  useIaCreationStructure,
  useCreateIaStructure,
} from '@/hooks/assessment/useIaCreation'

export default function IaCreationPage() {
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)

  // ── Selections ──────────────────────────────────
  const [selectedIntakeGuid, setSelectedIntakeGuid] = useState<string>('')
  const [selectedProgramGuid, setSelectedProgramGuid] = useState<string>('')
  const [selectedSemesterGuid, setSelectedSemesterGuid] = useState<string>('')

  // ── Controls ─────────────────────────────────────
  // Auto-fetches now when all 3 selections are present

  // ── Data fetching ─────────────────────────────────
  const { data: initData, isLoading: initLoading } = useIaCreationInit()
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

  // Set default intake when init loads
  const handleInitLoaded = (intakeGuid: string) => {
    if (!selectedIntakeGuid) setSelectedIntakeGuid(intakeGuid)
  }
  if (initData && !selectedIntakeGuid) {
    const current = initData.intakes.find(i => i.currentIntake)
    if (current) handleInitLoaded(current.intakeGuid)
  }

  function showToast(msg: string, type = '') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  function handleProgramChange(guid: string) {
    setSelectedProgramGuid(guid)
    setSelectedSemesterGuid('')
  }

  function handleRefresh() {
    if (!selectedProgramGuid || !selectedSemesterGuid || !selectedIntakeGuid) {
      showToast('Please select Programme, Semester, and Academic Session first.', 'error')
      return
    }
    refetchStructure()
  }

  async function handleCreate() {
    if (!selectedProgramGuid || !selectedSemesterGuid || !selectedIntakeGuid) {
      showToast('Please select Programme, Semester, and Academic Session first.', 'error')
      return
    }
    try {
      const result = await createMut.mutateAsync({
        programGuid: selectedProgramGuid,
        semesterGuid: selectedSemesterGuid,
        intakeGuid: selectedIntakeGuid,
      })
      // React Query automatically refetches since params didn't change,
      // but we can forcefully refetch or invalidate to be safe.
      refetchStructure()
      showToast('IA Structure created successfully.', 'success')
    } catch (err: any) {
      const status = err?.status ?? err?.response?.status
      if (status === 409) {
        showToast('IA Structure already exists for this combination.', '')
      } else {
        showToast(err.message || 'Failed to create IA Structure.', 'error')
      }
    }
  }

  const canRefresh = !!selectedProgramGuid && !!selectedSemesterGuid && !!selectedIntakeGuid
  const is404 = (structureError as any)?.status === 404

  return (
    <div id="page-ia-creation">
      {/* ── Page Header ── */}
      <div className="pg-hdr">
        <div>
          <h1 className="text-xl font-semibold text-g900">Assessment Structure</h1>
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
          <button
            className="btn btn-primary flex-1 sm:flex-none justify-center whitespace-nowrap"
            onClick={handleCreate}
            disabled={!canRefresh || createMut.isPending}
          >
            <i className="lni lni-plus" />
            {createMut.isPending ? 'Creating…' : 'Create Structure'}
          </button>
        </div>
      </div>

      {/* ── Filters Card ── */}
      <div className="card mb-4">
        <h2 className="text-base font-semibold text-g800 mb-4">Select Combination</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Academic Session */}
          <div className="fg mb-0">
            <label className="lbl">Academic Session</label>
            <SearchSelect
              placeholder="— Select Session —"
              value={selectedIntakeGuid}
              onChange={val => setSelectedIntakeGuid(val)}
              disabled={initLoading}
              options={(initData?.intakes ?? []).map(i => ({
                value: i.intakeGuid,
                label: `${i.description ?? `Intake ${i.intakeCode}`}${i.currentIntake ? ' (Current)' : ''}`,
              }))}
            />
          </div>

          {/* Programme */}
          <div className="fg mb-0">
            <label className="lbl">Programme</label>
            <SearchSelect
              placeholder="— Select Programme —"
              value={selectedProgramGuid}
              onChange={val => handleProgramChange(val)}
              disabled={initLoading}
              options={(initData?.programs ?? []).map(p => ({
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
              <thead>
                <tr>
                  <th>Unit Code</th>
                  <th>Unit Name</th>
                  <th
                    className="text-right border-l border-slate-200"
                    style={{ whiteSpace: 'normal', minWidth: 90 }}
                  >
                    Course Work<br />
                    <span className="text-xs font-normal opacity-70">Max 15</span>
                  </th>
                  <th
                    className="text-right"
                    style={{ whiteSpace: 'normal', minWidth: 120 }}
                  >
                    CW Start
                  </th>
                  <th
                    className="text-right border-l border-slate-200"
                    style={{ whiteSpace: 'normal', minWidth: 90 }}
                  >
                    Class Test<br />
                    <span className="text-xs font-normal opacity-70">Max 15</span>
                  </th>
                  <th
                    className="text-right"
                    style={{ whiteSpace: 'normal', minWidth: 120 }}
                  >
                    CT Start
                  </th>
                  <th
                    className="text-right border-l border-slate-200"
                    style={{ whiteSpace: 'normal', minWidth: 90 }}
                  >
                    Uni. Exam<br />
                    <span className="text-xs font-normal opacity-70">Max 70</span>
                  </th>
                  <th
                    className="text-right"
                    style={{ whiteSpace: 'normal', minWidth: 120 }}
                  >
                    Exam Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {structureLoading ? (
                  <TableLoadingState colSpan={8} />
                ) : !canRefresh ? (
                  <tr>
                    <td colSpan={8}>
                      <div className="flex flex-col items-center justify-center py-10 gap-2 text-center text-g400">
                        <i className="lni lni-pointer text-2xl" />
                        <span className="text-sm">Select Programme, Semester &amp; Session to view structure</span>
                      </div>
                    </td>
                  </tr>
                ) : structureRows?.length === 0 ? (
                  <EmptyState
                    colSpan={8}
                    hasFilters={false}
                    onClearFilters={() => {}}
                    subtitle="No structure created yet. Click Create Structure to generate it."
                  />
                ) : (
                  structureRows?.map(row => (
                    <tr key={row.internalAssessmentGuid}>
                      <td className="font-mono text-sm">{row.unitCode ?? '—'}</td>
                      <td className="font-medium">{row.unitName ?? '—'}</td>

                      {/* Course Work */}
                      <td className="text-right border-l border-slate-100">
                        {row.courseworkGuid ? (
                          <span className="badge badge-green">{row.courseworkMaxMark}</span>
                        ) : (
                          <span className="text-g400 text-xs">—</span>
                        )}
                      </td>
                      <td className="text-right text-xs text-g500">
                        {row.courseworkStartDateTime
                          ? new Date(row.courseworkStartDateTime).toLocaleDateString()
                          : <span className="text-g300">Not scheduled</span>}
                      </td>

                      {/* Class Test */}
                      <td className="text-right border-l border-slate-100">
                        {row.classTestGuid ? (
                          <span className="badge badge-blue">{row.classTestMaxMark}</span>
                        ) : (
                          <span className="text-g400 text-xs">—</span>
                        )}
                      </td>
                      <td className="text-right text-xs text-g500">
                        {row.classTestStartDateTime
                          ? new Date(row.classTestStartDateTime).toLocaleDateString()
                          : <span className="text-g300">Not scheduled</span>}
                      </td>

                      {/* University Exam */}
                      <td className="text-right border-l border-slate-100">
                        {row.universityExamGuid ? (
                          <span className="badge badge-amber">{row.universityExamMaxMark}</span>
                        ) : (
                          <span className="text-g400 text-xs">—</span>
                        )}
                      </td>
                      <td className="text-right text-xs text-g500">
                        {row.examDate
                          ? new Date(row.examDate).toLocaleDateString()
                          : <span className="text-g300">Not scheduled</span>}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </ScrollTable>
        )}
      </div>

      <Toast toast={toast} />
    </div>
  )
}
