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
import { useIntakesDropdown } from '@/hooks/academic/useIntakes'
import { useProgramDropdown } from '@/hooks/academic/useProgramMaster'
import { useSemestersForProgram } from '@/hooks/academic/useSemesters'
import {
  useProgramCourseUnitsDropdown,
  type ProgramCourseUnitDropdownItem,
} from '@/hooks/academic/useProgramCourseUnits'
import {
  useApplyModeration,
  useGeneratedResults,
  GENERATE_RESULT_KEYS,
  type ExamResultRow,
  type ResultFilters,
  type ResultOperator,
  type ModerationSkippedItem,
} from '@/hooks/assessment/useGenerateResult'
import {
  updateModeration,
  searchModerationStudents,
} from '@/lib/api/assessment/moderation'

const OPERATOR_OPTIONS = [
  { value: '', label: 'Any' },
  { value: '=', label: 'Equals (=)' },
  { value: '<>', label: 'Not Equals (≠)' },
  { value: '<', label: 'Below (<)' },
  { value: '<=', label: 'Below or Equal (≤)' },
  { value: '>', label: 'Above (>)' },
  { value: '>=', label: 'Above or Equal (≥)' },
]

function formatScore(val: number | null | undefined): string {
  if (val === null || val === undefined) return '—'
  return Number.isInteger(val) ? String(val) : Number(val.toFixed(2)).toString()
}

export default function ResultModerationPage() {
  const permissions = usePagePermissions()
  const queryClient = useQueryClient()

  // ── Intake Dropdown API ──────────────────────────────────────────
  const intakesQ = useIntakesDropdown()
  const intakes = useMemo(() => intakesQ.data ?? [], [intakesQ.data])

  const [selectedIntake, setSelectedIntake] = useState<string>('')

  // Default to the intake whose currentIntake is true
  useEffect(() => {
    if (!selectedIntake && intakes.length > 0) {
      const current = intakes.find((i) => i.currentIntake) ?? intakes[0]
      setSelectedIntake(current.intakeGuid)
    }
  }, [intakes, selectedIntake])

  const selectedIntakeObj = useMemo(
    () => intakes.find((i) => i.intakeGuid === selectedIntake),
    [intakes, selectedIntake]
  )
  const isCurrentIntake = Boolean(selectedIntakeObj?.currentIntake)

  const intakeOptions = useMemo(() => {
    return intakes.map((i) => ({
      value: i.intakeGuid,
      label: `${i.description} (${i.intakeCode})${i.currentIntake ? ' • Current' : ''}`,
    }))
  }, [intakes])

  // Permissions check
  const canGetGrid = permissions.get ?? true
  const canModerate = (permissions.moderate ?? true) && isCurrentIntake
  const canEditRow = (permissions.edit ?? true) && isCurrentIntake

  // ── Search with 400ms Debounce ──────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 400)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Panels state
  const [filterPanelOpen, setFilterPanelOpen] = useState(false)
  const [moderationPanelOpen, setModerationPanelOpen] = useState(false)
  const stackRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Element | null
      // Ignore clicks inside portal elements like SearchSelect dropdowns (.ss-drop) or modals
      if (target?.closest('.ss-drop') || target?.closest('.modal-overlay') || target?.closest('.modal')) {
        return
      }
      if (stackRef.current && !stackRef.current.contains(target as Node)) {
        setFilterPanelOpen(false)
        setModerationPanelOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // ── Filters State ────────────────────────────────────────────────
  const [filterProg, setFilterProg] = useState('')
  const [filterSem, setFilterSem] = useState('')
  const [filterCu, setFilterCu] = useState('')
  const [filterIaOp, setFilterIaOp] = useState<'' | ResultOperator>('')
  const [filterIaVal, setFilterIaVal] = useState('')
  const [filterUeOp, setFilterUeOp] = useState<'' | ResultOperator>('')
  const [filterUeVal, setFilterUeVal] = useState('')

  // Programme dropdown
  const progQ = useProgramDropdown()
  const programs = useMemo(() => progQ.data ?? [], [progQ.data])
  const programOptions = useMemo(() => {
    return [
      { value: '', label: 'All programmes' },
      ...programs.map((p) => ({
        value: p.programGuid,
        label: `${p.programCode} — ${p.programName}`,
      })),
    ]
  }, [programs])

  // Semester dropdown (disabled until programme selected)
  const semQ = useSemestersForProgram(filterProg, Boolean(filterProg))
  const semesters = useMemo(() => semQ.data ?? [], [semQ.data])
  const semesterOptions = useMemo(() => {
    return [
      { value: '', label: 'All semesters' },
      ...semesters.map((s) => ({
        value: s.semesterGuid,
        label: s.semName,
      })),
    ]
  }, [semesters])

  // Course unit dropdown (disabled until programme selected; in parallel with semester)
  const cuQ = useProgramCourseUnitsDropdown(filterProg, Boolean(filterProg))
  const rawUnits = useMemo(() => cuQ.data ?? [], [cuQ.data])

  // De-duplicate units by courseUnitGuid
  const unitsForProgram = useMemo(() => {
    const map = new Map<string, ProgramCourseUnitDropdownItem>()
    for (const u of rawUnits) {
      if (!map.has(u.courseUnitGuid)) {
        map.set(u.courseUnitGuid, u)
      }
    }
    return Array.from(map.values())
  }, [rawUnits])

  // Filter units client-side by semester when chosen
  const visibleUnits = useMemo(() => {
    if (!filterSem) return unitsForProgram
    return rawUnits.filter((u) => u.semesterGuid === filterSem)
  }, [rawUnits, unitsForProgram, filterSem])

  // If selected course unit not in visible units, clear it
  useEffect(() => {
    if (filterCu && visibleUnits.length > 0 && !visibleUnits.some((u) => u.courseUnitGuid === filterCu)) {
      setFilterCu('')
    }
  }, [visibleUnits, filterCu])

  const courseUnitOptions = useMemo(() => {
    return [
      { value: '', label: 'All course units' },
      ...visibleUnits.map((u) => ({
        value: u.courseUnitGuid,
        label: `${u.courseUnitCode} · ${u.courseUnitName}`,
      })),
    ]
  }, [visibleUnits])

  // Clear / change handlers
  const handleProgChange = (val: string) => {
    setFilterProg(val)
    setFilterSem('')
    setFilterCu('')
    setPage(1)
    setLoadedRows([])
    setModerationPanelOpen(false)
  }

  const handleSemChange = (val: string) => {
    setFilterSem(val)
    setFilterCu('')
    setPage(1)
    setLoadedRows([])
    setModerationPanelOpen(false)
  }

  const handleCuChange = (val: string) => {
    setFilterCu(val)
    setPage(1)
    setLoadedRows([])
    setModerationPanelOpen(false)
  }

  // ── Results Grid & Infinite Scroll ──────────────────────────────
  const [page, setPage] = useState(1)
  const pageSize = 50
  const [loadedRows, setLoadedRows] = useState<ExamResultRow[]>([])

  const apiFilters = useMemo<ResultFilters | null>(() => {
    if (!selectedIntake) return null

    const trimmed = debouncedSearch.trim()
    // Backend search rule: min 3 characters required, otherwise omit search
    const searchParam = trimmed.length >= 3 ? trimmed : undefined

    const hasIa = filterIaOp !== '' && filterIaVal.trim() !== '' && !isNaN(Number(filterIaVal))
    const hasUe = filterUeOp !== '' && filterUeVal.trim() !== '' && !isNaN(Number(filterUeVal))

    return {
      intakeGuid: selectedIntake,
      programGuid: filterProg || undefined,
      semesterGuid: filterSem || undefined,
      courseUnitGuid: filterCu || undefined,
      iaOperator: hasIa ? filterIaOp : undefined,
      iaValue: hasIa ? Number(filterIaVal) : undefined,
      ueOperator: hasUe ? filterUeOp : undefined,
      ueValue: hasUe ? Number(filterUeVal) : undefined,
      search: searchParam,
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
    debouncedSearch,
  ])

  const resultsQ = useGeneratedResults(canGetGrid ? apiFilters : null, page, pageSize)
  const totalCount = resultsQ.data?.totalCount ?? 0

  // Accumulate rows for infinite scroll
  useEffect(() => {
    if (!resultsQ.data) return
    const newItems = resultsQ.data.items ?? []
    if (page === 1) {
      setLoadedRows(newItems)
    } else {
      setLoadedRows((prev) => {
        const existingIds = new Set(prev.map((r) => r.examResultGuid))
        const fresh = newItems.filter((r) => !existingIds.has(r.examResultGuid))
        return [...prev, ...fresh]
      })
    }
  }, [resultsQ.data, page])

  // Clear loaded rows and reset page on filter/search/intake changes
  useEffect(() => {
    setPage(1)
    setLoadedRows([])
  }, [apiFilters])

  // Scroll to fetch next page
  const fetchNextPage = useCallback(() => {
    if (resultsQ.isFetching) return
    if (loadedRows.length >= totalCount) return
    setPage((prev) => prev + 1)
  }, [resultsQ.isFetching, loadedRows.length, totalCount])

  const handleTableScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const el = e.currentTarget
      if (el.scrollHeight - el.scrollTop - el.clientHeight < 120) {
        fetchNextPage()
      }
    },
    [fetchNextPage]
  )

  useEffect(() => {
    const handleWindowScroll = () => {
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 250) {
        fetchNextPage()
      }
    }
    window.addEventListener('scroll', handleWindowScroll)
    return () => window.removeEventListener('scroll', handleWindowScroll)
  }, [fetchNextPage])

  // Autocomplete items derived from loaded rows
  const searchResults: TableSearchResult[] = useMemo(() => {
    if (!searchQuery.trim() || !loadedRows.length) return []
    const q = searchQuery.toLowerCase()
    return loadedRows
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
  }, [loadedRows, searchQuery])

  // Active filter chips
  const activeChips = useMemo(() => {
    const chips: { key: string; label: string; onRemove: () => void }[] = []
    if (filterProg) {
      const p = programs.find((x) => x.programGuid === filterProg)
      chips.push({
        key: 'prog',
        label: `Programme: ${p ? p.programCode : filterProg}`,
        onRemove: () => { setFilterProg(''); setFilterSem(''); setFilterCu(''); setPage(1); setLoadedRows([]) },
      })
    }
    if (filterSem) {
      const s = semesters.find((x) => x.semesterGuid === filterSem)
      chips.push({
        key: 'sem',
        label: `Semester: ${s ? s.semName : filterSem}`,
        onRemove: () => { setFilterSem(''); setFilterCu(''); setPage(1); setLoadedRows([]) },
      })
    }
    if (filterCu) {
      const u = visibleUnits.find((x) => x.courseUnitGuid === filterCu)
      chips.push({
        key: 'cu',
        label: `Course unit: ${u ? u.courseUnitCode : filterCu}`,
        onRemove: () => { setFilterCu(''); setPage(1); setLoadedRows([]) },
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
        onRemove: () => { setFilterIaOp(''); setFilterIaVal(''); setPage(1); setLoadedRows([]) },
      })
    }
    if (filterUeOp && filterUeVal !== '') {
      chips.push({
        key: 'ue',
        label: `UE total ${opText[filterUeOp] || filterUeOp} ${filterUeVal}`,
        onRemove: () => { setFilterUeOp(''); setFilterUeVal(''); setPage(1); setLoadedRows([]) },
      })
    }
    return chips
  }, [filterProg, filterSem, filterCu, filterIaOp, filterIaVal, filterUeOp, filterUeVal, programs, semesters, visibleUnits])

  const handleClearFilters = () => {
    setFilterProg('')
    setFilterSem('')
    setFilterCu('')
    setFilterIaOp('')
    setFilterIaVal('')
    setFilterUeOp('')
    setFilterUeVal('')
    setPage(1)
    setLoadedRows([])
  }

  // ── Moderation Panel & Operations ────────────────────────────────
  const applyModMut = useApplyModeration()
  const [iaModInput, setIaModInput] = useState('')
  const [ueModInput, setUeModInput] = useState('')
  const [iaModMsg, setIaModMsg] = useState<{ text: string; ok: boolean } | null>(null)
  const [ueModMsg, setUeModMsg] = useState<{ text: string; ok: boolean } | null>(null)

  const [confirmBatchMod, setConfirmBatchMod] = useState<{
    field: 1 | 2
    value: number
    count: number
  } | null>(null)

  const [skippedModalData, setSkippedModalData] = useState<{
    rowsMatched: number
    rowsModerated: number
    rowsSkipped: number
    items: ModerationSkippedItem[]
  } | null>(null)

  // Modals state for single row
  const [editRow, setEditRow] = useState<ExamResultRow | null>(null)
  const [removeRow, setRemoveRow] = useState<ExamResultRow | null>(null)
  const [isRemovingMod, setIsRemovingMod] = useState(false)

  // Toast notification
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const showToast = useCallback((msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }, [])

  const toggleFilterPanel = () => {
    setFilterPanelOpen((prev) => !prev)
    if (!filterPanelOpen) setModerationPanelOpen(false)
  }

  const toggleModerationPanel = () => {
    setModerationPanelOpen((prev) => !prev)
    if (!moderationPanelOpen) setFilterPanelOpen(false)
  }

  // Batch Moderation Request
  const handleRequestBatchMod = (field: 1 | 2) => {
    const inputVal = field === 1 ? iaModInput : ueModInput
    const val = parseFloat(inputVal)
    const setMsg = field === 1 ? setIaModMsg : setUeModMsg

    if (isNaN(val) || val <= 0) {
      setMsg({ text: 'Please enter a positive value greater than 0.', ok: false })
      return
    }

    if (!loadedRows.length && totalCount === 0) {
      setMsg({ text: 'No rows match the current filters.', ok: false })
      return
    }

    setMsg(null)
    setConfirmBatchMod({ field, value: val, count: totalCount || loadedRows.length })
  }

  // Execute Batch Moderation
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
        onSuccess: (res: any) => {
          const appliedCount = res?.rowsModerated ?? 0
          const matchedCount = res?.rowsMatched ?? count
          const skippedCount = res?.rowsSkipped ?? 0

          showToast(`Moderated ${appliedCount} of ${matchedCount} rows.`)
          const setMsg = field === 1 ? setIaModMsg : setUeModMsg
          setMsg({
            text: `Moderated ${appliedCount} of ${matchedCount} rows.`,
            ok: true,
          })

          if (field === 1) setIaModInput('')
          else setUeModInput('')
          setConfirmBatchMod(null)
          setModerationPanelOpen(false)

          // Check if there are skipped rows to report
          if (skippedCount > 0 && Array.isArray(res?.skipped) && res.skipped.length > 0) {
            setSkippedModalData({
              rowsMatched: matchedCount,
              rowsModerated: appliedCount,
              rowsSkipped: skippedCount,
              items: res.skipped,
            })
          }

          // Reload grid from page 1
          setPage(1)
          setLoadedRows([])
          queryClient.invalidateQueries({ queryKey: GENERATE_RESULT_KEYS.results() })
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

  // Helper to resolve studentGuid if not provided directly on row
  const resolveStudentGuid = async (r: ExamResultRow): Promise<string> => {
    if (r.studentGuid) return r.studentGuid

    const direct =
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

  // Single Row Edit Save
  const handleSaveSingleRowMod = async (
    row: ExamResultRow,
    newIaDelta: number,
    newUeDelta: number
  ): Promise<{ ok: boolean; error?: string }> => {
    const studentGuid = row.studentGuid || (await resolveStudentGuid(row))
    const examResultGuid = row.examResultGuid

    if (!studentGuid || !examResultGuid) {
      showToast('Could not resolve student record for saving moderation', 'error')
      return { ok: false, error: 'Could not resolve student record' }
    }

    try {
      const res = await updateModeration(studentGuid, examResultGuid, {
        iaMod: newIaDelta,
        ueMod: newUeDelta,
      })
      showToast('Moderation saved successfully')

      // Update that row in loadedRows in-place per API doc rule
      setLoadedRows((prev) =>
        prev.map((r) =>
          r.examResultGuid === examResultGuid
            ? {
                ...r,
                iaMod: res?.iaMod !== undefined && res?.iaMod !== null ? res.iaMod : newIaDelta,
                iaTotal: res?.iaTotal !== undefined && res?.iaTotal !== null ? res.iaTotal : r.iaTotal,
                ueMod: res?.ueMod !== undefined && res?.ueMod !== null ? res.ueMod : newUeDelta,
                ueTotal: res?.ueTotal !== undefined && res?.ueTotal !== null ? res.ueTotal : r.ueTotal,
              }
            : r
        )
      )
      setEditRow(null)
      return { ok: true }
    } catch (err: any) {
      if (err?.status === 404 || err?.code === 'not_found') {
        showToast('This exam result was not found. Reloading results...', 'error')
        setEditRow(null)
        setPage(1)
        setLoadedRows([])
        queryClient.invalidateQueries({ queryKey: GENERATE_RESULT_KEYS.results() })
        return { ok: false, error: 'Row not found' }
      }
      const msg = err?.message || 'Unable to apply this moderation.'
      return { ok: false, error: msg }
    }
  }

  // Single Row Remove Moderation
  const handleExecuteRemoveMod = async () => {
    if (!removeRow || isRemovingMod) return
    setIsRemovingMod(true)
    try {
      const studentGuid = removeRow.studentGuid || (await resolveStudentGuid(removeRow))
      const examResultGuid = removeRow.examResultGuid

      if (!studentGuid || !examResultGuid) {
        showToast('Could not resolve student record for removing moderation', 'error')
        return
      }

      const res = await updateModeration(studentGuid, examResultGuid, {
        iaMod: 0,
        ueMod: 0,
      })
      showToast('Moderation removed successfully')

      // Update that row in loadedRows in-place
      setLoadedRows((prev) =>
        prev.map((r) =>
          r.examResultGuid === examResultGuid
            ? {
                ...r,
                iaMod: 0,
                iaTotal: res?.iaTotal !== undefined && res?.iaTotal !== null ? res.iaTotal : r.iaTotal,
                ueMod: 0,
                ueTotal: res?.ueTotal !== undefined && res?.ueTotal !== null ? res.ueTotal : r.ueTotal,
              }
            : r
        )
      )
      setRemoveRow(null)
    } catch (err: any) {
      if (err?.status === 404 || err?.code === 'not_found') {
        showToast('This exam result was not found. Reloading results...', 'error')
        setRemoveRow(null)
        setPage(1)
        setLoadedRows([])
        queryClient.invalidateQueries({ queryKey: GENERATE_RESULT_KEYS.results() })
        return
      }
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
          <div className="flex items-center gap-2.5">
            <h1 className="pg-title text-2xl font-bold tracking-tight text-slate-900">
              Result and Moderation
            </h1>
            {!isCurrentIntake && selectedIntake && (
              <span className="badge badge-amber text-xs font-semibold px-2 py-0.5">
                View Only
              </span>
            )}
          </div>
          <div className="pg-sub text-sm text-slate-500 mt-1">
            Review results and apply moderation marks for an academic intake.
          </div>
        </div>

        {/* Academic Intake Dropdown */}
        <div className="flex flex-col gap-1 min-w-[270px]">
          <label className="text-[12px] font-semibold text-slate-600">
            Academic intake
          </label>
          <SearchSelect
            options={intakeOptions}
            value={selectedIntake}
            onChange={(val) => {
              setSelectedIntake(val)
              setPage(1)
              setLoadedRows([])
              setModerationPanelOpen(false)
            }}
            placeholder="Select Academic Intake"
            isLoading={intakesQ.isLoading}
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
              placeholder="Search name, reg no, student no..."
              value={searchQuery}
              onChange={(val) => {
                setSearchQuery(val)
              }}
              results={searchResults.length > 0 ? searchResults : undefined}
              onSelect={(r) => {
                setSearchQuery(r.primary)
              }}
            />
            {searchQuery && (
              <button
                type="button"
                className="btn btn-neu btn-sm"
                title="Clear search"
                onClick={() => {
                  setSearchQuery('')
                }}
              >
                <i className="lni lni-close"></i>
              </button>
            )}
          </div>

          <div className="flex-1 hidden sm:block"></div>

          {/* + Moderation Button (Only available for current intake) */}
          {canModerate && (
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
          )}

          {/* Filters Button */}
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

        {/* ── Filters Floating Panel ─────────────────────────── */}
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
                  onChange={handleCuChange}
                  placeholder="All course units"
                  disabled={!filterProg}
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
                      setLoadedRows([])
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
                      setLoadedRows([])
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
                      setLoadedRows([])
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
                      setLoadedRows([])
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Panel Buttons */}
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200/70">
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
        {moderationPanelOpen && canModerate && (
          <div className="absolute left-0 right-0 top-full mt-2 z-50 bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-[0_16px_40px_rgba(16,24,40,0.16)] transition-all">
            <div className="mb-3">
              <h2 className="text-base font-bold text-slate-900 leading-tight">
                Bulk Moderation
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Applies moderation marks to all {totalCount || loadedRows.length}{' '}
                {(totalCount || loadedRows.length) === 1 ? 'row' : 'rows'} currently matching these filters.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* IA total moderation box */}
              <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200">
                <h3 className="text-[14px] font-bold text-slate-800">
                  IA total
                </h3>
                <div className="text-xs text-slate-500 mb-3">
                  Raises the IA total up to 50% of the IA maximum. Rows already at or above are skipped.
                </div>
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="e.g. 2.5"
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
                  Raises the UE total up to 50% of the UE maximum. Rows already at or above are skipped.
                </div>
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
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

      {/* ── Table Container (ScrollTable with infinite scroll) ── */}
      <div className="card shadow-xs border border-slate-200 rounded-xl overflow-hidden bg-white mb-3">
        <ScrollTable onScroll={handleTableScroll} maxHeight="calc(100vh - 290px)">
          <table>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', width: 44 }}>#</th>
                <th style={{ textAlign: 'left', minWidth: 160 }}>STUDENT</th>
                <th style={{ textAlign: 'left', width: 100 }}>PROGRAMME</th>
                <th style={{ textAlign: 'center', width: 60 }}>SEM</th>
                <th style={{ textAlign: 'left', minWidth: 200 }}>COURSE UNIT</th>
                <th style={{ textAlign: 'right', width: 60 }}>CT</th>
                <th style={{ textAlign: 'right', width: 60 }}>CW</th>
                <th style={{ textAlign: 'right', width: 60 }}>CA</th>
                <th style={{ textAlign: 'right', width: 75 }}>IA MOD</th>
                <th style={{ textAlign: 'right', width: 95 }}>IA TOTAL</th>
                <th style={{ textAlign: 'right', width: 65 }}>UE</th>
                <th style={{ textAlign: 'right', width: 65 }}>UE PR.</th>
                <th style={{ textAlign: 'right', width: 75 }}>UE MOD</th>
                <th style={{ textAlign: 'right', width: 95 }}>UE TOTAL</th>
                <th style={{ textAlign: 'right', width: 90 }}>MODERATION</th>
              </tr>
            </thead>
            <tbody>
              {resultsQ.isLoading && loadedRows.length === 0 ? (
                <TableLoadingState
                  colSpan={15}
                  title="Loading results..."
                  subtitle="Fetching moderation records for the intake."
                />
              ) : loadedRows.length === 0 ? (
                <EmptyState
                  colSpan={15}
                  title="No results match these filters"
                  subtitle="Clear a filter or search query to see student results."
                />
              ) : (
                loadedRows.map((row, idx) => {
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
                  const hasMod = !!((row.iaMod && row.iaMod > 0) || (row.ueMod && row.ueMod > 0))

                  return (
                    <tr
                      key={row.examResultGuid || idx}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      {/* # */}
                      <td className="text-slate-500 font-mono text-xs" style={{ textAlign: 'left' }}>
                        {idx + 1}
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
                        {formatScore(row.midSem)}
                      </td>

                      {/* CW */}
                      <td className="font-mono text-xs text-slate-700" style={{ textAlign: 'right' }}>
                        {formatScore(row.cw1)}
                      </td>

                      {/* CA */}
                      <td className="font-mono text-xs text-slate-700" style={{ textAlign: 'right' }}>
                        {formatScore(row.cw2)}
                      </td>

                      {/* IA mod */}
                      <td className="font-mono text-xs" style={{ textAlign: 'right' }}>
                        {row.iaMod ? (
                          <span className="font-semibold text-emerald-700">
                            +{formatScore(row.iaMod)}
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>

                      {/* IA total */}
                      <td style={{ textAlign: 'right' }}>
                        <div className="inline-block min-w-[72px]">
                          <div className="font-mono text-xs whitespace-nowrap">
                            <strong className="text-slate-900 font-bold">{formatScore(iaTotal)}</strong>{' '}
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

                      {/* UE Pr. */}
                      <td className="font-mono text-xs text-slate-700" style={{ textAlign: 'right' }}>
                        {row.uePractical ? (
                          row.uePractical.toUpperCase() === 'ABS' ? (
                            <span className="badge badge-red font-bold text-[10px] px-1.5 py-0.2">ABS</span>
                          ) : (
                            row.uePractical
                          )
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>

                      {/* UE mod */}
                      <td className="font-mono text-xs" style={{ textAlign: 'right' }}>
                        {row.ueMod ? (
                          <span className="font-semibold text-emerald-700">
                            +{formatScore(row.ueMod)}
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>

                      {/* UE total */}
                      <td style={{ textAlign: 'right' }}>
                        <div className="inline-block min-w-[72px]">
                          <div className="font-mono text-xs whitespace-nowrap">
                            <strong className="text-slate-900 font-bold">{formatScore(ueTotal)}</strong>{' '}
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

                      {/* Moderation Actions (Gated by current intake & permission) */}
                      <td style={{ textAlign: 'right' }}>
                        {canEditRow ? (
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
                        ) : (
                          <span className="text-slate-300 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </ScrollTable>
      </div>

      {/* ── Table Footer & Infinite Scroll Progress ───────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-center text-xs text-slate-500 px-1 py-1 gap-2">
        <span>
          Showing {loadedRows.length} of {totalCount} records
        </span>
        {resultsQ.isFetching && loadedRows.length > 0 && (
          <span className="text-blue-600 font-medium flex items-center gap-1.5">
            <i className="lni lni-reload animate-spin text-xs"></i> Loading more records...
          </span>
        )}
      </div>

      {/* ── Batch Moderation Confirmation Dialog ───────────────── */}
      {confirmBatchMod && (
        <div className="modal-overlay open">
          <div className="modal" style={{ maxWidth: 440 }}>
            <div className="modal-hdr modal-hdr-blue">
              <div className="modal-title">
                <i className="lni lni-question-circle"></i> Apply bulk moderation?
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
                This will apply{' '}
                <strong>+{confirmBatchMod.value} marks</strong> to the{' '}
                <strong>{confirmBatchMod.field === 1 ? 'IA' : 'UE'} total</strong> of all{' '}
                <strong>{confirmBatchMod.count}</strong> matching{' '}
                {confirmBatchMod.count === 1 ? 'row' : 'rows'} across the entire academic intake.
              </p>
              <p className="text-xs text-slate-500 mt-2.5">
                Moderation raises totals up to 50% of each row's maximum. Rows already at or above 50% are skipped.
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

      {/* ── Skipped Rows Modal ─────────────────────────────────── */}
      {skippedModalData && (
        <div className="modal-overlay open">
          <div className="modal" style={{ maxWidth: 620 }}>
            <div className="modal-hdr modal-hdr-blue">
              <div className="modal-title flex items-center gap-2">
                <i className="lni lni-information"></i> Moderation Summary
              </div>
              <button className="modal-close" onClick={() => setSkippedModalData(null)}>
                <i className="lni lni-close"></i>
              </button>
            </div>
            <div className="modal-body p-4 sm:p-5">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 mb-3 flex items-center justify-between">
                <span>
                  Moderated <strong>{skippedModalData.rowsModerated}</strong> of{' '}
                  <strong>{skippedModalData.rowsMatched}</strong> rows.
                </span>
                <span className="badge badge-amber font-semibold text-[11px]">
                  {skippedModalData.rowsSkipped} Skipped
                </span>
              </div>
              <div className="text-xs font-semibold text-slate-700 mb-2">
                Skipped Rows Details:
              </div>
              <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-lg">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold sticky top-0">
                    <tr>
                      <th className="py-2 px-3">Student</th>
                      <th className="py-2 px-3">Reg / Number</th>
                      <th className="py-2 px-3">Course Unit</th>
                      <th className="py-2 px-3">Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {skippedModalData.items.map((item, idx) => (
                      <tr key={item.examResultGuid || idx} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-medium text-slate-800">{item.studentName || '—'}</td>
                        <td className="py-2 px-3 font-mono text-slate-500">{item.studentRegNo || item.registrationNumber || item.studentNum || '—'}</td>
                        <td className="py-2 px-3 font-mono text-slate-700">{item.unitCode || '—'}</td>
                        <td className="py-2 px-3 text-amber-700">{item.reason || 'Skipped'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="modal-footer flex justify-end p-3 bg-slate-50 border-t border-slate-200 rounded-b-xl">
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setSkippedModalData(null)}
              >
                Close
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
  onSave: (iaDelta: number, ueDelta: number) => Promise<{ ok: boolean; error?: string }>
}) {
  const iaMax = row.iaMax || 30
  const ueMax = row.ueMax || 70

  const hasIaMarks = row.iaMax !== null && row.iaMax !== undefined && row.iaTotal !== null && row.iaTotal !== undefined
  const hasUeMarks = row.ueMax !== null && row.ueMax !== undefined && row.ueTotal !== null && row.ueTotal !== undefined

  // Base marks before any moderation
  const currentIaTotal = row.iaTotal ?? 0
  const currentIaMod = row.iaMod ?? 0
  const baseIa = Math.max(0, currentIaTotal - currentIaMod)

  const currentUeTotal = row.ueTotal ?? 0
  const currentUeMod = row.ueMod ?? 0
  const baseUe = Math.max(0, currentUeTotal - currentUeMod)

  // Cap is exactly 50% of maximum
  const iaCap = iaMax * 0.5
  const ueCap = ueMax * 0.5

  // Maximum allowed moderation for this specific row
  const maxAllowedIa = hasIaMarks ? Math.max(0, Number((iaCap - baseIa).toFixed(2))) : 0
  const maxAllowedUe = hasUeMarks ? Math.max(0, Number((ueCap - baseUe).toFixed(2))) : 0

  const [iaVal, setIaVal] = useState<string>(
    row.iaMod !== null && row.iaMod !== undefined ? String(row.iaMod) : '0'
  )
  const [ueVal, setUeVal] = useState<string>(
    row.ueMod !== null && row.ueMod !== undefined ? String(row.ueMod) : '0'
  )
  const [serverError, setServerError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  // Real-time Field Validations
  const iaNum = parseFloat(iaVal)
  let iaError: string | null = null
  if (iaVal.trim() === '') {
    iaError = 'Please enter a value (0 to clear).'
  } else if (isNaN(iaNum)) {
    iaError = 'Please enter a valid number.'
  } else if (iaNum < 0) {
    iaError = 'Moderation marks cannot be negative.'
  } else if ((iaVal.split('.')[1] || '').length > 2) {
    iaError = 'Can have at most 2 decimal places.'
  } else if (iaNum > 0) {
    if (!hasIaMarks) {
      iaError = 'This row has no IA marks to moderate.'
    } else if (baseIa >= iaCap) {
      iaError = `Base score (${baseIa}) is already at 50% cap (${iaCap}).`
    } else if (baseIa + iaNum > iaCap + 0.0001) {
      iaError = `Exceeds 50% cap (${iaCap}). Max allowed is +${maxAllowedIa}.`
    }
  }

  const ueNum = parseFloat(ueVal)
  let ueError: string | null = null
  if (ueVal.trim() === '') {
    ueError = 'Please enter a value (0 to clear).'
  } else if (isNaN(ueNum)) {
    ueError = 'Please enter a valid number.'
  } else if (ueNum < 0) {
    ueError = 'Moderation marks cannot be negative.'
  } else if ((ueVal.split('.')[1] || '').length > 2) {
    ueError = 'At most 2 decimal places allowed.'
  } else if (ueNum > 0) {
    if (!hasUeMarks) {
      ueError = 'This row has no UE marks to moderate.'
    } else if (baseUe >= ueCap) {
      ueError = `Base score (${baseUe}) is already at 50% cap (${ueCap}).`
    } else if (baseUe + ueNum > ueCap + 0.0001) {
      ueError = `Exceeds 50% cap (${ueCap}). Max allowed is +${maxAllowedUe}.`
    }
  }

  const hasErrors = Boolean(iaError || ueError)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (hasErrors) return

    setServerError(null)
    setIsSaving(true)
    try {
      const res = await onSave(isNaN(iaNum) ? 0 : iaNum, isNaN(ueNum) ? 0 : ueNum)
      if (!res.ok && res.error) {
        setServerError(res.error)
      }
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
      <div className="bg-white rounded-2xl p-6 shadow-2xl w-full max-w-[440px]" role="dialog" aria-modal="true">
        <h2 className="text-[17px] font-bold text-slate-900 mb-1">
          Edit moderation
        </h2>
        <p className="text-[13px] text-slate-500 mb-3.5 leading-normal">
          {studentDisplay} {unitDisplay ? `· ${unitDisplay}` : ''}
        </p>

        {/* Server-side Error Alert */}
        {serverError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-medium mb-3 flex items-start gap-2">
            <i className="lni lni-warning text-sm shrink-0 mt-0.5"></i>
            <span>{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* IA Moderation Field */}
          <div className="flex flex-col gap-1 mb-3.5">
            <div className="flex items-center justify-between">
              <label htmlFor="eia" className="text-xs font-semibold text-slate-800">
                IA moderation
              </label>
              <span className="text-[11px] text-slate-500 font-medium">
                Max allowed: <strong className="text-slate-700">+{maxAllowedIa}</strong>
              </span>
            </div>
            <input
              id="eia"
              type="number"
              min="0"
              step="0.01"
              autoFocus
              className={`ctrl w-full text-sm h-[38px] px-3 rounded-lg border transition-colors ${
                iaError
                  ? 'border-red-400 bg-red-50/20 focus:border-red-500'
                  : 'border-slate-300 focus:border-blue-600'
              } focus:outline-none`}
              value={iaVal}
              onChange={(e) => {
                setIaVal(e.target.value)
                setServerError(null)
              }}
            />
            {iaError ? (
              <span className="text-[11.5px] text-red-600 font-medium mt-0.5">
                {iaError}
              </span>
            ) : !isNaN(iaNum) && iaNum >= 0 ? (
              <span className="text-[11px] text-slate-500 mt-0.5">
                New IA total:{' '}
                <strong className="text-slate-700">
                  {formatScore(baseIa + iaNum)}
                </strong>{' '}
                / {iaMax}
              </span>
            ) : null}
          </div>

          {/* UE Moderation Field */}
          <div className="flex flex-col gap-1 mb-4">
            <div className="flex items-center justify-between">
              <label htmlFor="eue" className="text-xs font-semibold text-slate-800">
                UE moderation
              </label>
              <span className="text-[11px] text-slate-500 font-medium">
                Max allowed: <strong className="text-slate-700">+{maxAllowedUe}</strong>
              </span>
            </div>
            <input
              id="eue"
              type="number"
              min="0"
              step="0.01"
              className={`ctrl w-full text-sm h-[38px] px-3 rounded-lg border transition-colors ${
                ueError
                  ? 'border-red-400 bg-red-50/20 focus:border-red-500'
                  : 'border-slate-300 focus:border-blue-600'
              } focus:outline-none`}
              value={ueVal}
              onChange={(e) => {
                setUeVal(e.target.value)
                setServerError(null)
              }}
            />
            {ueError ? (
              <span className="text-[11.5px] text-red-600 font-medium mt-0.5">
                {ueError}
              </span>
            ) : !isNaN(ueNum) && ueNum >= 0 ? (
              <span className="text-[11px] text-slate-500 mt-0.5">
                New UE total:{' '}
                <strong className="text-slate-700">
                  {formatScore(baseUe + ueNum)}
                </strong>{' '}
                / {ueMax}
              </span>
            ) : null}
          </div>

          <div className="flex justify-end items-center gap-2.5 mt-5">
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
              className="btn btn-primary text-xs py-2 px-4 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSaving || hasErrors}
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
