'use client'

import { usePagePermissions } from '@/hooks/users/usePagePermissions'
import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { ScrollTable } from '@/components/ScrollTable'
import { Toast } from '@/components/Toast'
import { EmptyState } from '@/components/EmptyState'
import { TableLoadingState } from '@/components/TableLoadingState'
import { SearchSelect } from '@/components/SearchSelect'
import { TableSearch, type TableSearchResult } from '@/components/TableSearch'
import { Pagination } from '@/components/Pagination'
import {
  useGenerateResultInit,
  useGenerateResultSemesters,
  useGenerateResultCourseUnits,
  useApplyModeration,
  useGeneratedResults,
  GENERATE_RESULT_KEYS,
  type ExamResultRow,
  type ResultFilters,
  type ResultOperator,
} from '@/hooks/assessment/useGenerateResult'
import { updateModeration, searchModerationStudents } from '@/lib/api/assessment/moderation'

const OPERATOR_OPTIONS = [
  { value: '', label: 'Any' },
  { value: '=', label: 'Equals (=)' },
  { value: '<>', label: 'Not Equals (≠)' },
  { value: '<', label: 'Below (<)' },
  { value: '<=', label: 'Below or Equal (≤)' },
  { value: '>', label: 'Above (>)' },
  { value: '>=', label: 'Above or Equal (≥)' },
]

export default function ResultModerationPage() {
  const permissions = usePagePermissions()
  const queryClient = useQueryClient()

  // ── Queries from API ─────────────────────────────────────────────
  const initQ = useGenerateResultInit()
  const intakes = useMemo(() => initQ.data?.intakes ?? [], [initQ.data?.intakes])
  const programs = useMemo(() => initQ.data?.programs ?? [], [initQ.data?.programs])

  // Intakes options for SearchSelect
  const intakeOptions = useMemo(() => {
    return intakes.map((i) => ({
      value: i.intakeGuid,
      label: `${i.description} (${i.intakeCode})`,
    }))
  }, [intakes])

  const [selectedIntake, setSelectedIntake] = useState<string>('')

  // Auto-select current intake or first available intake
  useEffect(() => {
    if (!selectedIntake && intakes.length > 0) {
      const current = intakes.find((i) => i.currentIntake) ?? intakes[0]
      setSelectedIntake(current.intakeGuid)
    }
  }, [intakes, selectedIntake])

  // Search and Filter states
  const [searchQuery, setSearchQuery] = useState('')
  const [filterPanelOpen, setFilterPanelOpen] = useState(false)
  const [moderationPanelOpen, setModerationPanelOpen] = useState(false)
  const stackRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (stackRef.current && !stackRef.current.contains(event.target as Node)) {
        setFilterPanelOpen(false)
        setModerationPanelOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Filters state
  const [filterProg, setFilterProg] = useState('')
  const [filterSem, setFilterSem] = useState('')
  const [filterCu, setFilterCu] = useState('')
  const [filterIaOp, setFilterIaOp] = useState<'' | ResultOperator>('')
  const [filterIaVal, setFilterIaVal] = useState('')
  const [filterUeOp, setFilterUeOp] = useState<'' | ResultOperator>('')
  const [filterUeVal, setFilterUeVal] = useState('')

  // Reset semester & unit when programme changes
  const handleProgChange = (val: string) => {
    setFilterProg(val)
    setFilterSem('')
    setFilterCu('')
    setPage(1)
  }

  // Reset unit when semester changes
  const handleSemChange = (val: string) => {
    setFilterSem(val)
    setFilterCu('')
    setPage(1)
  }

  // Dependent Semesters & Course Units from API
  const { data: apiSemesters = [] } = useGenerateResultSemesters(filterProg)
  const { data: apiUnits = [] } = useGenerateResultCourseUnits(filterProg, filterSem)

  const programOptions = useMemo(() => {
    return [
      { value: '', label: 'All programmes' },
      ...programs.map((p) => ({
        value: p.programGuid,
        label: `${p.programCode} — ${p.programName}`,
      })),
    ]
  }, [programs])

  const semesterOptions = useMemo(() => {
    return [
      { value: '', label: 'All semesters' },
      ...apiSemesters.map((s) => ({
        value: s.semesterGuid,
        label: s.semName,
      })),
    ]
  }, [apiSemesters])

  const courseUnitOptions = useMemo(() => {
    return [
      { value: '', label: 'All course units' },
      ...apiUnits.map((u) => ({
        value: u.courseUnitGuid,
        label: `${u.unitCode} · ${u.unitName}`,
      })),
    ]
  }, [apiUnits])

  // Pagination state
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)

  // Batch Moderation Inputs
  const [iaModInput, setIaModInput] = useState('')
  const [ueModInput, setUeModInput] = useState('')
  const [iaModMsg, setIaModMsg] = useState<{ text: string; ok: boolean } | null>(null)
  const [ueModMsg, setUeModMsg] = useState<{ text: string; ok: boolean } | null>(null)

  // Toast notification
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const showToast = useCallback((msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }, [])

  // Modals state
  const [editRow, setEditRow] = useState<ExamResultRow | null>(null)
  const [removeRow, setRemoveRow] = useState<ExamResultRow | null>(null)
  const [isRemovingMod, setIsRemovingMod] = useState(false)
  const [confirmBatchMod, setConfirmBatchMod] = useState<{
    field: 1 | 2
    value: number
    count: number
  } | null>(null)

  // API query payload
  const apiFilters = useMemo<ResultFilters | null>(() => {
    if (!selectedIntake) return null
    return {
      intakeGuid: selectedIntake,
      programGuid: filterProg || undefined,
      semesterGuid: filterSem || undefined,
      courseUnitGuid: filterCu || undefined,
      iaOperator: filterIaOp || undefined,
      iaValue: filterIaVal !== '' && !isNaN(Number(filterIaVal)) ? Number(filterIaVal) : undefined,
      ueOperator: filterUeOp || undefined,
      ueValue: filterUeVal !== '' && !isNaN(Number(filterUeVal)) ? Number(filterUeVal) : undefined,
      search: searchQuery.trim() || undefined,
      studentName: searchQuery.trim() || undefined,
    }
  }, [
    selectedIntake,
    filterProg,
    filterSem,
    filterCu,
    filterIaOp,
    filterIaVal,
    filterUeOp,
    filterUeVal,
    searchQuery,
  ])

  // Fetch results from real API
  const resultsQ = useGeneratedResults(apiFilters, page, pageSize)
  const rows = useMemo(() => resultsQ.data?.items ?? [], [resultsQ.data?.items])
  const totalCount = resultsQ.data?.totalCount ?? 0
  const totalPages = Math.ceil(totalCount / pageSize) || 1

  const applyModMut = useApplyModeration()

  // TableSearch Autocomplete items derived from loaded rows
  const searchResults: TableSearchResult[] = useMemo(() => {
    if (!searchQuery.trim() || !rows.length) return []
    const q = searchQuery.toLowerCase()
    return rows
      .filter(
        (r) =>
          (r.studentName?.toLowerCase().includes(q) ?? false) ||
          (r.studentNum?.toLowerCase().includes(q) ?? false)
      )
      .slice(0, 6)
      .map((r) => ({
        id: r.examResultGuid,
        primary: r.studentName || 'Student',
        secondary: `${r.studentNum || '—'} · ${r.programCode || '—'} · ${r.unitCode || '—'}`,
      }))
  }, [rows, searchQuery])

  // Active filter chips
  const activeChips = useMemo(() => {
    const chips: { key: string; label: string; onRemove: () => void }[] = []
    if (filterProg) {
      const p = programs.find((x) => x.programGuid === filterProg)
      chips.push({
        key: 'prog',
        label: `Programme: ${p ? p.programCode : filterProg}`,
        onRemove: () => { setFilterProg(''); setFilterSem(''); setFilterCu(''); setPage(1) },
      })
    }
    if (filterSem) {
      const s = apiSemesters.find((x) => x.semesterGuid === filterSem)
      chips.push({
        key: 'sem',
        label: `Semester: ${s ? s.semName : filterSem}`,
        onRemove: () => { setFilterSem(''); setFilterCu(''); setPage(1) },
      })
    }
    if (filterCu) {
      const u = apiUnits.find((x) => x.courseUnitGuid === filterCu)
      chips.push({
        key: 'cu',
        label: `Course unit: ${u ? u.unitCode : filterCu}`,
        onRemove: () => { setFilterCu(''); setPage(1) },
      })
    }
    const opText: Record<string, string> = {
      '=': '=',
      '<>': '≠',
      '<': '<',
      '<=': '≤',
      '>': '>',
      '>=': '≥',
    }
    if (filterIaOp && filterIaVal !== '') {
      chips.push({
        key: 'ia',
        label: `IA total ${opText[filterIaOp] || filterIaOp} ${filterIaVal}`,
        onRemove: () => { setFilterIaOp(''); setFilterIaVal(''); setPage(1) },
      })
    }
    if (filterUeOp && filterUeVal !== '') {
      chips.push({
        key: 'ue',
        label: `UE total ${opText[filterUeOp] || filterUeOp} ${filterUeVal}`,
        onRemove: () => { setFilterUeOp(''); setFilterUeVal(''); setPage(1) },
      })
    }
    return chips
  }, [filterProg, filterSem, filterCu, filterIaOp, filterIaVal, filterUeOp, filterUeVal, programs, apiSemesters, apiUnits])

  // Clear all filters
  const handleClearFilters = () => {
    setFilterProg('')
    setFilterSem('')
    setFilterCu('')
    setFilterIaOp('')
    setFilterIaVal('')
    setFilterUeOp('')
    setFilterUeVal('')
    setPage(1)
  }

  const handleResetAll = () => {
    setSearchQuery('')
    handleClearFilters()
    setFilterPanelOpen(false)
    setModerationPanelOpen(false)
    setIaModInput('')
    setUeModInput('')
    setIaModMsg(null)
    setUeModMsg(null)
    setPage(1)
  }

  const toggleFilterPanel = () => {
    setFilterPanelOpen((prev) => !prev)
    if (!filterPanelOpen) setModerationPanelOpen(false)
  }

  const toggleModerationPanel = () => {
    setModerationPanelOpen((prev) => !prev)
    if (!moderationPanelOpen) setFilterPanelOpen(false)
  }

  // Batch Moderation Trigger
  const handleRequestBatchMod = (field: 1 | 2) => {
    const inputVal = field === 1 ? iaModInput : ueModInput
    const val = parseFloat(inputVal)
    const setMsg = field === 1 ? setIaModMsg : setUeModMsg

    if (isNaN(val) || val === 0) {
      setMsg({ text: 'Enter the marks to add or subtract.', ok: false })
      return
    }

    if (!rows.length) {
      setMsg({ text: 'No rows are shown. Change the filters first.', ok: false })
      return
    }

    const cap = field === 1 ? 15 : 35
    if (Math.abs(val) > cap) {
      setMsg({ text: `Maximum is ±${cap} marks (50% of the maximum).`, ok: false })
      return
    }

    setMsg(null)
    setConfirmBatchMod({ field, value: val, count: totalCount || rows.length })
  }

  // Execute Batch Moderation via API
  const executeBatchMod = () => {
    if (!confirmBatchMod || !apiFilters) return
    const { field, value, count } = confirmBatchMod

    applyModMut.mutate(
      {
        filters: apiFilters,
        field,
        value,
      },
      {
        onSuccess: (res) => {
          const appliedCount = res?.rowsModerated ?? count
          showToast(
            `Moderation marks ${value > 0 ? 'added' : 'subtracted'} successfully for ${appliedCount} rows.`
          )
          const setMsg = field === 1 ? setIaModMsg : setUeModMsg
          setMsg({
            text: `${value > 0 ? 'Added ' : 'Subtracted '}${Math.abs(value)} marks to ${appliedCount} rows.`,
            ok: true,
          })
          if (field === 1) setIaModInput('')
          else setUeModInput('')
          setConfirmBatchMod(null)
        },
        onError: (err: any) => {
          showToast(err?.message || 'Failed to apply moderation', 'error')
          const setMsg = field === 1 ? setIaModMsg : setUeModMsg
          setMsg({
            text: err?.message || 'Failed to apply moderation',
            ok: false,
          })
          setConfirmBatchMod(null)
        },
      }
    )
  }

  // Helper to resolve studentGuid from row or studentNum via search API
  const resolveStudentGuid = async (r: ExamResultRow): Promise<string> => {
    const direct =
      (r as any).studentGuid ||
      (r as any).StudentGuid ||
      (r as any).studentId ||
      (r as any).StudentId ||
      (r as any).studentMasterGuid
    if (direct) return direct

    if (r.studentNum) {
      try {
        const list = await searchModerationStudents(r.studentNum)
        const match =
          list.find(
            (s) =>
              (s.studentNum || s.studentNumber || s.registrationNumber) ===
              r.studentNum
          ) ?? list[0]
        if (match?.studentGuid) return match.studentGuid
      } catch (e) {
        console.warn('Could not resolve studentGuid via search:', e)
      }
    }
    return ''
  }

  // Single Row Edit Save via API
  const handleSaveSingleRowMod = async (
    row: ExamResultRow,
    newIaDelta: number,
    newUeDelta: number
  ) => {
    const studentGuid = await resolveStudentGuid(row)
    const examResultGuid =
      row.examResultGuid ||
      (row as any).ExamResultGuid ||
      (row as any).resultGuid ||
      (row as any).ResultGuid ||
      (row as any).id ||
      ''

    if (!studentGuid || !examResultGuid) {
      showToast('Could not resolve student record for saving moderation', 'error')
      return
    }

    try {
      await updateModeration(studentGuid, examResultGuid, {
        iaModeration: newIaDelta,
        ueModeration: newUeDelta,
        iaMod: newIaDelta,
        ueMod: newUeDelta,
      })
      showToast('Moderation saved successfully')
      queryClient.invalidateQueries({ queryKey: GENERATE_RESULT_KEYS.results() })
      setEditRow(null)
    } catch (err: any) {
      showToast(err?.message || 'Failed to save moderation', 'error')
    }
  }

  // Single Row Remove Moderation via API
  const handleExecuteRemoveMod = async () => {
    if (!removeRow || isRemovingMod) return
    setIsRemovingMod(true)
    try {
      const studentGuid = await resolveStudentGuid(removeRow)
      const examResultGuid =
        removeRow.examResultGuid ||
        (removeRow as any).ExamResultGuid ||
        (removeRow as any).resultGuid ||
        (removeRow as any).ResultGuid ||
        (removeRow as any).id ||
        ''

      if (!studentGuid || !examResultGuid) {
        showToast('Could not resolve student record for removing moderation', 'error')
        return
      }

      await updateModeration(studentGuid, examResultGuid, {
        iaModeration: 0,
        ueModeration: 0,
        iaMod: 0,
        ueMod: 0,
      })
      showToast('Moderation removed successfully')
      queryClient.invalidateQueries({ queryKey: GENERATE_RESULT_KEYS.results() })
      setRemoveRow(null)
    } catch (err: any) {
      showToast(err?.message || 'Failed to remove moderation', 'error')
    } finally {
      setIsRemovingMod(false)
    }
  }

  return (
    <div className="page active">
      {/* ── Page Header ────────────────────────────────────────── */}
      <div className="pg-hdr flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4">
        <div>
          <div className="pg-title text-2xl font-bold tracking-tight text-slate-900">
            Result and Moderation
          </div>
          <div className="pg-sub text-sm text-slate-500 mt-1">
            Review results and apply moderation marks for an academic intake.
          </div>
        </div>

        {/* Academic Intake Reusable SearchSelect */}
        <div className="flex flex-col gap-1 min-w-[260px]">
          <label className="text-[12px] font-semibold text-slate-600">
            Academic intake
          </label>
          <SearchSelect
            options={intakeOptions}
            value={selectedIntake}
            onChange={(val) => {
              setSelectedIntake(val)
              setPage(1)
            }}
            placeholder="Select Academic Intake"
            isLoading={initQ.isLoading}
          />
        </div>
      </div>

      {/* ── Main Action Bar & Drawers ──────────────────────────── */}
      <div ref={stackRef} className="relative z-30 mb-4">
        {/* Toolbar */}
        <div className="card shadow-xs border border-slate-200 rounded-xl bg-white p-3 sm:p-4 flex flex-wrap items-center gap-2.5">
          {/* Reusable TableSearch Component */}
          <div className="flex items-center gap-1.5 flex-1 min-w-[240px] max-w-[380px]">
            <TableSearch
              className="w-full"
              placeholder="Search student name or number..."
              value={searchQuery}
              onChange={(val) => {
                setSearchQuery(val)
                setPage(1)
              }}
              results={searchResults.length > 0 ? searchResults : undefined}
              onSelect={(r) => {
                setSearchQuery(r.primary)
                setPage(1)
              }}
            />
            {searchQuery && (
              <button
                type="button"
                className="btn btn-neu btn-sm"
                title="Clear search"
                onClick={() => {
                  setSearchQuery('')
                  setPage(1)
                }}
              >
                <i className="lni lni-close"></i>
              </button>
            )}
          </div>

          <div className="flex-1 hidden sm:block"></div>

          {/* + Moderation Button */}
          <button
            type="button"
            className={`btn btn-sm flex items-center gap-1.5 font-medium transition-all ${
              moderationPanelOpen
                ? 'bg-b50 font-semibold shadow-xs'
                : 'bg-white hover:bg-b50/60'
            }`}
            style={{
              borderColor: 'var(--b600)',
              borderWidth: '1.5px',
              borderStyle: 'solid',
              color: 'var(--b600)',
            }}
            onClick={toggleModerationPanel}
            aria-expanded={moderationPanelOpen}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            <span>Moderation</span>
          </button>

          {/* Filters Button (placed where Reset button was) */}
          <button
            type="button"
            className={`btn btn-sm flex items-center gap-2 font-medium transition-all ${
              filterPanelOpen || activeChips.length > 0
                ? 'bg-b50 font-semibold shadow-xs'
                : 'bg-white hover:bg-b50/60'
            }`}
            style={{
              borderColor: 'var(--b600)',
              borderWidth: '1.5px',
              borderStyle: 'solid',
              color: 'var(--b600)',
            }}
            onClick={toggleFilterPanel}
            aria-expanded={filterPanelOpen}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M4 6h16M7 12h10M10 18h4" />
            </svg>
            <span>Filters</span>
            {activeChips.length > 0 && (
              <span
                className="inline-flex items-center justify-center text-white rounded-full text-[11px] min-w-[18px] h-[18px] px-1 font-bold"
                style={{ background: 'var(--b600)' }}
              >
                {activeChips.length}
              </span>
            )}
          </button>
        </div>


        {/* ── Filters Floating Panel (with SearchSelect) ─────── */}
        {filterPanelOpen && (
          <div className="absolute left-0 right-0 top-full mt-2 z-50 bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-[0_16px_40px_rgba(16,24,40,0.16)] transition-all">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 mb-4">
              {/* Programme */}
              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-semibold text-slate-600">
                  Programme
                </label>
                <SearchSelect
                  options={programOptions}
                  value={filterProg}
                  onChange={handleProgChange}
                  placeholder="All programmes"
                />
              </div>

              {/* Semester */}
              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-semibold text-slate-600">
                  Semester
                </label>
                <SearchSelect
                  options={semesterOptions}
                  value={filterSem}
                  onChange={handleSemChange}
                  placeholder="All semesters"
                  disabled={!filterProg}
                />
              </div>

              {/* Course unit */}
              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-semibold text-slate-600">
                  Course unit
                </label>
                <SearchSelect
                  options={courseUnitOptions}
                  value={filterCu}
                  onChange={(val) => {
                    setFilterCu(val)
                    setPage(1)
                  }}
                  placeholder="All course units"
                  disabled={!filterSem}
                />
              </div>

              {/* IA total comparison */}
              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-semibold text-slate-600">
                  IA total
                </label>
                <div className="grid grid-cols-[105px_1fr] gap-1.5 items-center">
                  <SearchSelect
                    options={OPERATOR_OPTIONS}
                    value={filterIaOp}
                    onChange={(v) => {
                      setFilterIaOp(v as any)
                      setPage(1)
                    }}
                    placeholder="Any"
                  />
                  <input
                    type="number"
                    min="0"
                    placeholder="Any total"
                    className="ctrl text-[13px] h-[38px] bg-white border border-slate-200 rounded-lg"
                    value={filterIaVal}
                    onChange={(e) => {
                      setFilterIaVal(e.target.value)
                      setPage(1)
                    }}
                  />
                </div>
              </div>

              {/* UE total comparison */}
              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-semibold text-slate-600">
                  UE total
                </label>
                <div className="grid grid-cols-[105px_1fr] gap-1.5 items-center">
                  <SearchSelect
                    options={OPERATOR_OPTIONS}
                    value={filterUeOp}
                    onChange={(v) => {
                      setFilterUeOp(v as any)
                      setPage(1)
                    }}
                    placeholder="Any"
                  />
                  <input
                    type="number"
                    min="0"
                    placeholder="Any total"
                    className="ctrl text-[13px] h-[38px] bg-white border border-slate-200 rounded-lg"
                    value={filterUeVal}
                    onChange={(e) => {
                      setFilterUeVal(e.target.value)
                      setPage(1)
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Panel Buttons */}
            <div className="flex justify-end gap-2 pt-1 border-t border-slate-200/70">
              <button
                type="button"
                className="btn btn-neu btn-sm"
                onClick={handleClearFilters}
              >
                Clear filters
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setFilterPanelOpen(false)}
              >
                Show results
              </button>
            </div>
          </div>
        )}

        {/* ── Moderation Floating Panel ──────────────────────── */}
        {moderationPanelOpen && (
          <div className="absolute left-0 right-0 top-full mt-2 z-50 bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-[0_16px_40px_rgba(16,24,40,0.16)] transition-all">
            <div className="mb-3">
              <h2 className="text-base font-bold text-slate-900 leading-tight">
                Moderation
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Adds marks to the {totalCount || rows.length}{' '}
                {(totalCount || rows.length) === 1 ? 'row' : 'rows'} currently matching these filters.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* IA total moderation box */}
              <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200">
                <h3 className="text-[14px] font-bold text-slate-800">
                  IA total
                </h3>
                <div className="text-xs text-slate-500 mb-3">
                  Up to 15 marks either way (50% of 30)
                </div>
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    step="0.5"
                    placeholder="e.g. 5"
                    className="ctrl text-[13px] h-[36px] max-w-[140px] bg-white border border-slate-200 rounded-lg"
                    value={iaModInput}
                    onChange={(e) => setIaModInput(e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => handleRequestBatchMod(1)}
                    disabled={applyModMut.isPending}
                  >
                    Apply to IA total
                  </button>
                </div>
                {iaModMsg && (
                  <div
                    className={`text-xs mt-2 font-medium ${
                      iaModMsg.ok ? 'text-emerald-700' : 'text-red-600'
                    }`}
                  >
                    {iaModMsg.text}
                  </div>
                )}
              </div>

              {/* UE total moderation box */}
              <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200">
                <h3 className="text-[14px] font-bold text-slate-800">
                  UE total
                </h3>
                <div className="text-xs text-slate-500 mb-3">
                  Up to 35 marks either way (50% of 70)
                </div>
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    step="0.5"
                    placeholder="e.g. 5"
                    className="ctrl text-[13px] h-[36px] max-w-[140px] bg-white border border-slate-200 rounded-lg"
                    value={ueModInput}
                    onChange={(e) => setUeModInput(e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => handleRequestBatchMod(2)}
                    disabled={applyModMut.isPending}
                  >
                    Apply to UE total
                  </button>
                </div>
                {ueModMsg && (
                  <div
                    className={`text-xs mt-2 font-medium ${
                      ueModMsg.ok ? 'text-emerald-700' : 'text-red-600'
                    }`}
                  >
                    {ueModMsg.text}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Table Container (ScrollTable matching project reference) ── */}
      <div className="card shadow-xs border border-slate-200 rounded-xl overflow-hidden bg-white mb-3">
        <ScrollTable>
          <table>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', width: 44 }}>#</th>
                <th style={{ textAlign: 'left', minWidth: 160 }}>STUDENT</th>
                <th style={{ textAlign: 'left', width: 100 }}>PROGRAMME</th>
                <th style={{ textAlign: 'center', width: 60 }}>SEM</th>
                <th style={{ textAlign: 'left', minWidth: 200 }}>COURSE UNIT</th>
                <th style={{ textAlign: 'right', width: 64 }}>CT</th>
                <th style={{ textAlign: 'right', width: 64 }}>CW</th>
                <th style={{ textAlign: 'right', width: 64 }}>CA</th>
                <th style={{ textAlign: 'right', width: 80 }}>IA MOD</th>
                <th style={{ textAlign: 'right', width: 100 }}>IA TOTAL</th>
                <th style={{ textAlign: 'right', width: 70 }}>UE</th>
                <th style={{ textAlign: 'right', width: 80 }}>UE MOD</th>
                <th style={{ textAlign: 'right', width: 100 }}>UE TOTAL</th>
                <th style={{ textAlign: 'right', width: 100 }}>Moderation</th>
              </tr>
            </thead>
            <tbody>
              {resultsQ.isLoading ? (
                <TableLoadingState
                  colSpan={14}
                  title="Loading results..."
                  subtitle="Fetching moderation records for the intake."
                />
              ) : rows.length === 0 ? (
                <EmptyState
                  colSpan={14}
                  title="No results match these filters"
                  subtitle="Clear a filter or search query to see more student results."
                />
              ) : (
                rows.map((row, idx) => {
                  const iaMax = row.iaMax || 30
                  const ueMax = row.ueMax || 70
                  const iaTotal = row.iaTotal ?? 0
                  const ueTotal = row.ueTotal ?? 0

                  const iaPercent = Math.min(
                    100,
                    Math.max(0, (iaTotal / iaMax) * 100)
                  )
                  const uePercent = Math.min(
                    100,
                    Math.max(0, (ueTotal / ueMax) * 100)
                  )
                  const hasMod = !!(row.iaMod || row.ueMod)

                  return (
                    <tr
                      key={row.examResultGuid}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      {/* # */}
                      <td className="text-slate-500 font-mono text-xs" style={{ textAlign: 'left' }}>
                        {(page - 1) * pageSize + idx + 1}
                      </td>

                      {/* Student */}
                      <td style={{ textAlign: 'left' }}>
                        <div className="font-semibold text-slate-900 text-[13px] whitespace-nowrap">
                          {row.studentName ?? '—'}
                        </div>
                        <div className="text-slate-500 font-mono text-[11px] mt-0.5">
                          {row.studentNum ?? '—'}
                        </div>
                      </td>

                      {/* Programme */}
                      <td className="font-mono text-slate-700 text-xs" style={{ textAlign: 'left' }}>
                        {row.programCode ?? '—'}
                      </td>

                      {/* Sem */}
                      <td className="text-slate-700 text-xs font-semibold" style={{ textAlign: 'center' }}>
                        {row.semCode ?? '—'}
                      </td>

                      {/* Course unit */}
                      <td style={{ textAlign: 'left', maxWidth: 240 }}>
                        <div className="font-semibold text-slate-900 text-xs">
                          {row.unitCode ?? '—'}
                        </div>
                        <div className="text-slate-500 text-[11.5px] truncate mt-0.5" title={row.unitName ?? undefined}>
                          {row.unitName ?? '—'}
                        </div>
                      </td>

                      {/* CT */}
                      <td className="font-mono text-xs text-slate-700" style={{ textAlign: 'right' }}>
                        {row.midSem !== null && row.midSem !== undefined ? (
                          Number.isInteger(row.midSem) ? row.midSem : row.midSem.toFixed(1)
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>

                      {/* CW */}
                      <td className="font-mono text-xs text-slate-700" style={{ textAlign: 'right' }}>
                        {row.cw1 !== null && row.cw1 !== undefined ? (
                          Number.isInteger(row.cw1) ? row.cw1 : row.cw1.toFixed(1)
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>

                      {/* CA */}
                      <td className="font-mono text-xs text-slate-700" style={{ textAlign: 'right' }}>
                        {row.cw2 !== null && row.cw2 !== undefined ? (
                          Number.isInteger(row.cw2) ? row.cw2 : row.cw2.toFixed(1)
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>

                      {/* IA mod */}
                      <td className="font-mono text-xs" style={{ textAlign: 'right' }}>
                        {row.iaMod ? (
                          <span
                            className={`font-semibold ${
                              row.iaMod > 0 ? 'text-emerald-700' : 'text-red-600'
                            }`}
                          >
                            {row.iaMod > 0 ? `+${row.iaMod}` : row.iaMod}
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>

                      {/* IA total */}
                      <td style={{ textAlign: 'right' }}>
                        <div className="inline-block min-w-[72px]">
                          <div className="font-mono text-xs whitespace-nowrap">
                            <strong className="text-slate-900 font-bold">{iaTotal}</strong>{' '}
                            <span className="text-slate-400 font-normal">/ {iaMax}</span>
                          </div>
                          <div className="w-full h-[3px] bg-slate-200 rounded-full mt-1 overflow-hidden">
                            <div
                              className="h-full bg-blue-600 rounded-full transition-all duration-300"
                              style={{ width: `${iaPercent}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>

                      {/* UE */}
                      <td className="font-mono text-xs text-slate-700" style={{ textAlign: 'right' }}>
                        {row.ue ? (
                          row.ue.toUpperCase() === 'ABS' ? (
                            <span className="badge badge-red font-bold text-[10px] px-1.5 py-0.2">ABS</span>
                          ) : (
                            row.ue
                          )
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>

                      {/* UE mod */}
                      <td className="font-mono text-xs" style={{ textAlign: 'right' }}>
                        {row.ueMod ? (
                          <span
                            className={`font-semibold ${
                              row.ueMod > 0 ? 'text-emerald-700' : 'text-red-600'
                            }`}
                          >
                            {row.ueMod > 0 ? `+${row.ueMod}` : row.ueMod}
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>

                      {/* UE total */}
                      <td style={{ textAlign: 'right' }}>
                        <div className="inline-block min-w-[72px]">
                          <div className="font-mono text-xs whitespace-nowrap">
                            <strong className="text-slate-900 font-bold">{ueTotal}</strong>{' '}
                            <span className="text-slate-400 font-normal">/ {ueMax}</span>
                          </div>
                          <div className="w-full h-[3px] bg-slate-200 rounded-full mt-1 overflow-hidden">
                            <div
                              className="h-full bg-blue-600 rounded-full transition-all duration-300"
                              style={{ width: `${uePercent}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>

                      {/* Moderation Actions (Last column matching Result and Moderation.html) */}
                      <td style={{ textAlign: 'right' }}>
                        <div className="inline-flex items-center justify-end gap-1">
                          <button
                            type="button"
                            className="w-8 h-8 rounded-lg inline-flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors border border-transparent hover:border-blue-100"
                            title="Edit moderation"
                            aria-label={`Edit moderation for ${row.studentName ?? 'student'}, ${row.unitCode ?? ''}`}
                            onClick={() => setEditRow(row)}
                          >
                            <svg
                              width="15"
                              height="15"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            className="w-8 h-8 rounded-lg inline-flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-30 disabled:pointer-events-none transition-colors border border-transparent hover:border-red-100"
                            title="Remove moderation"
                            aria-label={`Remove moderation for ${row.studentName ?? 'student'}, ${row.unitCode ?? ''}`}
                            disabled={!hasMod}
                            onClick={() => setRemoveRow(row)}
                          >
                            <svg
                              width="15"
                              height="15"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M3 6h18M8 6V4h8v2m-9 0 1 14h8l1-14" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </ScrollTable>
      </div>

      {/* ── Table Footer & Pagination ──────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-center text-xs text-slate-500 px-1 py-1 gap-2">
        <span>
          Showing {rows.length} of {totalCount} records
        </span>
        {totalPages > 1 && (
          <Pagination
            page={page}
            totalPages={totalPages}
            totalCount={totalCount}
            itemLabel="records"
            onPageChange={setPage}
          />
        )}
      </div>

      {/* ── Batch Moderation Confirmation Dialog ───────────────── */}
      {confirmBatchMod && (
        <div className="modal-overlay open">
          <div className="modal" style={{ maxWidth: 440 }}>
            <div className="modal-hdr modal-hdr-blue">
              <div className="modal-title">
                <i className="lni lni-question-circle"></i> Apply moderation?
              </div>
              <button
                className="modal-close"
                onClick={() => setConfirmBatchMod(null)}
              >
                <i className="lni lni-close"></i>
              </button>
            </div>
            <div className="modal-body p-5">
              <p className="text-sm text-slate-700 leading-relaxed">
                This will{' '}
                <strong>
                  {confirmBatchMod.value > 0
                    ? `add ${confirmBatchMod.value}`
                    : `subtract ${Math.abs(confirmBatchMod.value)}`}{' '}
                  marks
                </strong>{' '}
                {confirmBatchMod.value > 0 ? 'to' : 'from'} the{' '}
                <strong>{confirmBatchMod.field === 1 ? 'IA' : 'UE'} total</strong> of{' '}
                <strong>{confirmBatchMod.count}</strong>{' '}
                {confirmBatchMod.count === 1 ? 'row' : 'rows'}.
              </p>
              <p className="text-xs text-slate-500 mt-2">
                Do you want to continue?
              </p>
            </div>
            <div className="modal-footer flex justify-end items-center gap-2">
              <button
                type="button"
                className="btn btn-neu btn-sm"
                onClick={() => setConfirmBatchMod(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={executeBatchMod}
                disabled={applyModMut.isPending}
              >
                {applyModMut.isPending ? 'Applying...' : 'Apply moderation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Moderation Modal (Single Row) ─────────────────── */}
      {editRow && (
        <EditRowModerationModal
          row={editRow}
          onClose={() => setEditRow(null)}
          onSave={(iaDelta, ueDelta) => handleSaveSingleRowMod(editRow, iaDelta, ueDelta)}
        />
      )}

      {/* ── Remove Moderation Confirmation Dialog ──────────────── */}
      {removeRow && (
        <div
          className="modal-overlay open"
          onClick={(e) => {
            if (e.target === e.currentTarget) setRemoveRow(null)
          }}
        >
          <div className="bg-white rounded-2xl p-6 shadow-2xl w-full max-w-[420px]" role="dialog" aria-modal="true">
            <h2 className="text-[17px] font-bold text-slate-900 mb-1.5">
              Remove moderation
            </h2>
            <p className="text-[13px] text-slate-500 mb-5 leading-normal">
              This removes the moderation marks for{' '}
              <strong className="text-slate-800">{removeRow.studentName || removeRow.studentNum}</strong> in{' '}
              <strong className="text-slate-800">{removeRow.unitCode}</strong> and restores the original
              totals.
            </p>
            <div className="flex justify-end items-center gap-2">
              <button
                type="button"
                className="btn btn-neu text-xs py-2 px-4 font-medium"
                onClick={() => setRemoveRow(null)}
                disabled={isRemovingMod}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger text-xs py-2 px-4 font-semibold"
                onClick={handleExecuteRemoveMod}
                disabled={isRemovingMod}
              >
                {isRemovingMod ? 'Removing...' : 'Remove moderation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Alert */}
      {toast && <Toast toast={toast} />}
    </div>
  )
}

// ── Edit Row Moderation Modal Component ──────────────────────
function EditRowModerationModal({
  row,
  onClose,
  onSave,
}: {
  row: ExamResultRow
  onClose: () => void
  onSave: (iaDelta: number, ueDelta: number) => Promise<void> | void
}) {
  const iaMax = row.iaMax || 30
  const ueMax = row.ueMax || 70
  const iaCap = iaMax / 2
  const ueCap = ueMax / 2

  const currentIaMod = Number(row.iaMod) || 0
  const currentUeMod = Number(row.ueMod) || 0

  const [iaVal, setIaVal] = useState<string>(
    row.iaMod !== null && row.iaMod !== undefined ? String(row.iaMod) : '0'
  )
  const [ueVal, setUeVal] = useState<string>(
    row.ueMod !== null && row.ueMod !== undefined ? String(row.ueMod) : '0'
  )
  const [validationError, setValidationError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const a = parseFloat(iaVal)
    const u = parseFloat(ueVal)

    if (isNaN(a) || isNaN(u)) {
      setValidationError('Please enter valid numbers for moderation.')
      return
    }

    if (Math.abs(a) > iaCap || Math.abs(u) > ueCap) {
      setValidationError("Moderation can't be more than 50% of the maximum marks.")
      return
    }

    setValidationError(null)
    setIsSaving(true)
    try {
      await onSave(a, u)
    } finally {
      setIsSaving(false)
    }
  }

  const studentDisplay = row.studentName || 'Student'
  const unitDisplay = [row.unitCode, row.unitName].filter(Boolean).join(' ')

  return (
    <div
      className="modal-overlay open"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="bg-white rounded-2xl p-6 shadow-2xl w-full max-w-[420px]" role="dialog" aria-modal="true">
        <h2 className="text-[17px] font-bold text-slate-900 mb-1">
          Edit moderation
        </h2>
        <p className="text-[13px] text-slate-500 mb-4 leading-normal">
          {studentDisplay} {unitDisplay ? `· ${unitDisplay}` : ''}
        </p>

        <form onSubmit={handleSubmit}>
          <div className="flex flex-col gap-1.5 mb-3.5">
            <label htmlFor="eia" className="text-xs font-semibold text-slate-800">
              IA moderation (max ±{iaCap})
            </label>
            <input
              id="eia"
              type="number"
              step="0.5"
              autoFocus
              className="ctrl w-full text-sm h-[38px] px-3 rounded-lg border border-slate-300 focus:border-blue-600 focus:outline-none"
              value={iaVal}
              onChange={(e) => {
                setIaVal(e.target.value)
                setValidationError(null)
              }}
            />
          </div>

          <div className="flex flex-col gap-1.5 mb-3.5">
            <label htmlFor="eue" className="text-xs font-semibold text-slate-800">
              UE moderation (max ±{ueCap})
            </label>
            <input
              id="eue"
              type="number"
              step="0.5"
              className="ctrl w-full text-sm h-[38px] px-3 rounded-lg border border-slate-300 focus:border-blue-600 focus:outline-none"
              value={ueVal}
              onChange={(e) => {
                setUeVal(e.target.value)
                setValidationError(null)
              }}
            />
          </div>

          {validationError && (
            <div className="text-xs text-red-600 mb-3 font-medium">
              {validationError}
            </div>
          )}

          <div className="flex justify-end items-center gap-2.5 mt-4">
            <button
              type="button"
              className="btn btn-neu text-xs py-2 px-4 font-medium"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary text-xs py-2 px-4 font-semibold"
              disabled={isSaving}
            >
              {isSaving && <i className="lni lni-reload animate-spin text-xs mr-1.5"></i>}
              Save changes
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
