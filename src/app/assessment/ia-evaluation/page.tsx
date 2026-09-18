'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { SearchSelect } from '@/components/SearchSelect'
import { Toast } from '@/components/Toast'
import { TableLoadingState } from '@/components/TableLoadingState'
import { EmptyState } from '@/components/EmptyState'
import { useIntakes } from '@/hooks/academic/useIntakes'
import {
  usePendingEvaluations,
  useStudentsForEvaluation,
  useStudentQuestions,
  useSaveQuestionMark,
  useFinalizeStudent,
  useEvaluatedList,
} from '@/hooks/assessment/useIaEvaluation'
import {
  PendingEvaluationDto,
  QuestionForEvaluationDto,
} from '@/lib/api/assessment/iaEvaluation'

const EMPTY_ARRAY: any[] = []

const CATEGORY_OPTIONS = [
  { value: '', label: 'All Categories' },
  { value: '2', label: 'Course Work 1 (CW1)' },
  { value: '3', label: 'Course Work 2 (CW2)' },
  { value: '1', label: 'Test' },
]

export default function IaEvaluationPage() {
  // ── Mode Switcher: Pending to mark vs Evaluated list ──────────────────────
  const [viewMode, setViewMode] = useState<'pending' | 'evaluated'>('pending')

  // ── 1. Academic Intake Selection ──────────────────────────────────────────
  const { data: intakesData, isLoading: isIntakesLoading } = useIntakes()
  const [selectedIntakeGuid, setSelectedIntakeGuid] = useState<string>('')

  // Automatically select current intake or the first available intake
  useEffect(() => {
    if (intakesData && intakesData.length > 0 && !selectedIntakeGuid) {
      const current = intakesData.find(i => i.currentIntake) || intakesData[0]
      if (current) setSelectedIntakeGuid(current.intakeGuid)
    }
  }, [intakesData, selectedIntakeGuid])

  // Intake options for dropdown
  const intakeOptions = useMemo(() => {
    if (!intakesData || !intakesData.length) return []
    return intakesData.map(i => ({
      value: i.intakeGuid,
      label: `${i.description || `Intake ${i.intakeCode}`}${i.currentIntake ? ' (Current)' : ''}`,
    }))
  }, [intakesData])

  // ── 2. Pending Units API Hook ─────────────────────────────────────────────
  const {
    data: pendingUnitsData,
    isLoading: isPendingLoading,
    isFetching: isPendingFetching,
    refetch: refetchPending,
  } = usePendingEvaluations(selectedIntakeGuid, viewMode === 'pending')
  const pendingUnits = pendingUnitsData ?? EMPTY_ARRAY

  // Evaluated history API hook
  const {
    data: evaluatedUnitsData,
    isLoading: isEvaluatedLoading,
    isFetching: isEvaluatedFetching,
    refetch: refetchEvaluated,
  } = useEvaluatedList(selectedIntakeGuid, viewMode === 'evaluated')
  const evaluatedUnits = evaluatedUnitsData ?? EMPTY_ARRAY

  // ── 2b. Assessment Category Filter ────────────────────────────────────────
  const [selectedCategory, setSelectedCategory] = useState<string>('')

  // Filter pending units by selected category & non-null unitName
  const filteredPendingUnits = useMemo(() => {
    const valid = pendingUnits.filter(u => {
      const name = u.unitName?.trim()
      return Boolean(name && name.toLowerCase() !== 'null' && name !== 'undefined')
    })
    if (!selectedCategory) return valid
    const catNum = Number(selectedCategory)
    return valid.filter(u => u.category === catNum)
  }, [pendingUnits, selectedCategory])

  // Filter evaluated units by selected category & non-null unitName
  const filteredEvaluatedUnits = useMemo(() => {
    const valid = evaluatedUnits.filter(u => {
      const name = u.unitName?.trim()
      return Boolean(name && name.toLowerCase() !== 'null' && name !== 'undefined')
    })
    if (!selectedCategory) return valid
    const catNum = Number(selectedCategory)
    return valid.filter(u => u.category === catNum)
  }, [evaluatedUnits, selectedCategory])

  // Active selected pending coursework unit
  const [selectedUnitKey, setSelectedUnitKey] = useState<string>('')

  // Sync selected unit when pending units load or category changes
  useEffect(() => {
    if (filteredPendingUnits.length > 0) {
      const exists = filteredPendingUnits.some(
        u => `${u.category}-${u.courseworkOrTestGuid}` === selectedUnitKey
      )
      if (!exists) {
        const nextKey = `${filteredPendingUnits[0].category}-${filteredPendingUnits[0].courseworkOrTestGuid}`
        setSelectedUnitKey(prev => (prev === nextKey ? prev : nextKey))
      }
    } else {
      setSelectedUnitKey(prev => (prev === '' ? prev : ''))
    }
  }, [filteredPendingUnits, selectedUnitKey])

  const activeUnit = useMemo<PendingEvaluationDto | null>(() => {
    if (!selectedUnitKey || !filteredPendingUnits.length) {
      return filteredPendingUnits[0] || null
    }
    return (
      filteredPendingUnits.find(u => `${u.category}-${u.courseworkOrTestGuid}` === selectedUnitKey) ||
      filteredPendingUnits[0] ||
      null
    )
  }, [filteredPendingUnits, selectedUnitKey])

  // Dropdown options for pending coursework units
  const unitOptions = useMemo(() => {
    return filteredPendingUnits.map(u => ({
      value: `${u.category}-${u.courseworkOrTestGuid}`,
      label: `${u.unitCode ? `${u.unitCode} — ` : ''}${u.unitName} [${u.categoryLabel}] (${u.pendingCount} pending)`,
    }))
  }, [filteredPendingUnits])

  // ── 3. Students for Evaluation API Hook ────────────────────────────────────
  const {
    data: studentsResponse,
    isLoading: isStudentsLoading,
    isFetching: isStudentsFetching,
    refetch: refetchStudents,
  } = useStudentsForEvaluation(
    activeUnit?.category,
    activeUnit?.courseworkOrTestGuid,
    Boolean(activeUnit && viewMode === 'pending')
  )

  const studentList = studentsResponse?.students ?? EMPTY_ARRAY

  // Selected Student GUID
  const [selectedStudentGuid, setSelectedStudentGuid] = useState<string>('')
  const [studentSearch, setStudentSearch] = useState<string>('')

  // Sync active student
  useEffect(() => {
    if (studentList.length > 0) {
      const exists = studentList.some(s => s.studentGuid === selectedStudentGuid)
      if (!exists) {
        const nextGuid = studentList[0].studentGuid
        setSelectedStudentGuid(prev => (prev === nextGuid ? prev : nextGuid))
        setActiveQuestionIndex(0)
      }
    } else {
      setSelectedStudentGuid(prev => (prev === '' ? prev : ''))
      setActiveQuestionIndex(0)
    }
  }, [studentList, selectedStudentGuid])

  // Filtered student list by search input
  const filteredStudents = useMemo(() => {
    if (!studentSearch.trim()) return studentList
    const q = studentSearch.toLowerCase()
    return studentList.filter(
      s =>
        (s.studentName && s.studentName.toLowerCase().includes(q)) ||
        (s.studentRegNo && s.studentRegNo.toLowerCase().includes(q))
    )
  }, [studentList, studentSearch])

  // Active student object
  const currentStudent = useMemo(() => {
    return studentList.find(s => s.studentGuid === selectedStudentGuid) || null
  }, [studentList, selectedStudentGuid])

  // ── 4. Student Questions API Hook ──────────────────────────────────────────
  const {
    data: questionsData,
    isLoading: isQuestionsLoading,
    isFetching: isQuestionsFetching,
    refetch: refetchQuestions,
  } = useStudentQuestions(
    activeUnit?.category,
    activeUnit?.courseworkOrTestGuid,
    selectedStudentGuid,
    Boolean(activeUnit && selectedStudentGuid && viewMode === 'pending')
  )

  // Local state copy of questions to support immediate optimistic scoring updates
  const [localQuestions, setLocalQuestions] = useState<QuestionForEvaluationDto[]>([])

  useEffect(() => {
    if (questionsData && Array.isArray(questionsData) && questionsData.length > 0) {
      setLocalQuestions(questionsData)
    } else if (!isQuestionsLoading && (!questionsData || questionsData.length === 0)) {
      setLocalQuestions(prev => (prev.length === 0 ? prev : EMPTY_ARRAY))
    }
  }, [questionsData, isQuestionsLoading])

  // Active question index
  const [activeQuestionIndex, setActiveQuestionIndex] = useState<number>(0)
  const currentQuestion = useMemo<QuestionForEvaluationDto | null>(() => {
    if (!localQuestions.length) return null
    return localQuestions[activeQuestionIndex] || localQuestions[0]
  }, [localQuestions, activeQuestionIndex])

  // Mark & Comment input fields
  const [markInput, setMarkInput] = useState<string>('')
  const [finalizeComment, setFinalizeComment] = useState<string>('')
  const [isScorecardOpen, setIsScorecardOpen] = useState<boolean>(false)
  const [isQuestionExpanded, setIsQuestionExpanded] = useState<boolean>(false)

  // Reset question index and comment when selected student changes
  useEffect(() => {
    setActiveQuestionIndex(0)
    setFinalizeComment('')
    setIsQuestionExpanded(false)
  }, [selectedStudentGuid])

  // Reset question expansion on question change
  useEffect(() => {
    setIsQuestionExpanded(false)
  }, [activeQuestionIndex])

  // Sync mark input whenever the active question changes
  useEffect(() => {
    if (currentQuestion) {
      const val =
        currentQuestion.mark !== null && currentQuestion.mark !== undefined
          ? String(currentQuestion.mark)
          : ''
      setMarkInput(prev => (prev === val ? prev : val))
    } else {
      setMarkInput(prev => (prev === '' ? prev : ''))
    }
  }, [currentQuestion?.questionGuid, currentQuestion?.mark, activeQuestionIndex])

  // ── Toast Alerts ──────────────────────────────────────────────────────────
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)
  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  // ── Active Refresh Handler ────────────────────────────────────────────────
  const [isManualRefreshing, setIsManualRefreshing] = useState(false)
  const isRefreshing =
    isManualRefreshing ||
    isPendingFetching ||
    isStudentsFetching ||
    isQuestionsFetching ||
    isEvaluatedFetching

  const handleRefresh = async () => {
    setIsManualRefreshing(true)
    try {
      if (viewMode === 'pending') {
        await Promise.allSettled([
          refetchPending(),
          refetchStudents(),
          refetchQuestions(),
        ])
      } else {
        await refetchEvaluated()
      }
      showToast('All evaluation data refreshed from live server!', 'success')
    } catch (err: any) {
      showToast('Failed to refresh data.', 'error')
    } finally {
      setIsManualRefreshing(false)
    }
  }

  // ── Mutations: Save Mark & Finalize Student ────────────────────────────────
  const saveMarkMutation = useSaveQuestionMark()
  const finalizeStudentMutation = useFinalizeStudent()

  // Handler: "Save & Next"
  const handleSaveAndNext = async () => {
    if (!activeUnit || !currentStudent || !currentQuestion) return

    if (!currentQuestion.questionGuid) {
      showToast('Question ID is missing. Please refresh or re-select the student.', 'error')
      return
    }

    if (markInput.trim() === '' || isNaN(Number(markInput))) {
      showToast('Please enter a valid numeric mark.', 'error')
      return
    }

    const numMark = Number(markInput)
    if (numMark < 0) {
      showToast('Mark cannot be negative.', 'error')
      return
    }

    const maxAllowed = currentQuestion.maxMark ?? 100
    if (numMark > maxAllowed) {
      showToast(`Mark cannot exceed section max mark (${maxAllowed}).`, 'error')
      return
    }

    try {
      await saveMarkMutation.mutateAsync({
        category: activeUnit.category,
        courseworkOrTestGuid: activeUnit.courseworkOrTestGuid,
        studentGuid: currentStudent.studentGuid,
        questionGuid: currentQuestion.questionGuid,
        mark: numMark,
      })

      // Update local state copy immediately
      setLocalQuestions(prev =>
        prev.map((q, idx) => (idx === activeQuestionIndex ? { ...q, mark: numMark } : q))
      )

      showToast(`Mark saved for Question ${activeQuestionIndex + 1}!`, 'success')

      // Auto advance to next question
      if (activeQuestionIndex < localQuestions.length - 1) {
        setActiveQuestionIndex(prev => prev + 1)
      } else {
        showToast('All questions reviewed for this student! You can now Finalize Student.', 'info')
      }
    } catch (err: any) {
      showToast(err?.message || 'Failed to save question mark.', 'error')
    }
  }

  // Handler: "Finalize Student"
  const handleFinalize = async () => {
    if (!activeUnit || !currentStudent) return

    const markedCount = localQuestions.filter(q => q.mark !== null && q.mark !== undefined).length
    const minRequired = currentStudent.minQuestion || localQuestions.length

    if (markedCount < minRequired) {
      showToast(
        `At least ${minRequired} question(s) must be marked before finalizing. Currently marked: ${markedCount}.`,
        'error'
      )
      return
    }

    try {
      const res = await finalizeStudentMutation.mutateAsync({
        category: activeUnit.category,
        courseworkOrTestGuid: activeUnit.courseworkOrTestGuid,
        studentGuid: currentStudent.studentGuid,
        comment: finalizeComment.trim() || undefined,
      })

      showToast(
        `Finalized ${currentStudent.studentName || 'student'}! Total: ${res.totalMark} / ${res.totalMaxMark} marks.`,
        'success'
      )

      setFinalizeComment('')

      // Auto-advance to next student returned by server
      if (res.nextStudentGuid) {
        setSelectedStudentGuid(res.nextStudentGuid)
        setActiveQuestionIndex(0)
      } else {
        showToast('All pending students for this unit have been evaluated!', 'success')
        refetchPending()
      }
    } catch (err: any) {
      showToast(err?.message || 'Failed to finalize student evaluation.', 'error')
    }
  }

  // Running scorecard stats
  const scorecardStats = useMemo(() => {
    let markedCount = 0
    let totalScore = 0
    let totalMax = 0

    localQuestions.forEach(q => {
      totalMax += q.maxMark ?? 0
      if (q.mark !== null && q.mark !== undefined) {
        markedCount++
        totalScore += q.mark
      }
    })

    return { markedCount, totalScore, totalMax }
  }, [localQuestions])

  // Helper for student initials
  const getInitials = (name?: string | null) => {
    if (!name) return 'ST'
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    return name.slice(0, 2).toUpperCase()
  }

  return (
    <div className="page active" id="page-ia-evaluation">
      {/* ── Page Header (ERP Theme) ────────────────────────────────────────── */}
      <div className="pg-hdr flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div className="flex-1 min-w-0">
          <div className="pg-title flex items-center gap-2 flex-wrap">
            <span>IA Evaluation</span>
            <span className="badge badge-purple text-[11px] font-semibold">
              Live Evaluation Desk
            </span>
          </div>
          <div className="pg-sub text-xs text-slate-500">
            End-to-end coursework & test evaluation · Question-by-question scoring and finalization
          </div>
        </div>

        {/* View Mode Toggle: Pending Queue vs Evaluated Records */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setViewMode('pending')}
            className={`btn btn-sm ${
              viewMode === 'pending' ? 'btn-primary' : 'btn-neu'
            } flex items-center gap-1.5`}
          >
            <i className="lni lni-hourglass"></i>
            <span>Pending Evaluation</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('evaluated')}
            className={`btn btn-sm ${
              viewMode === 'evaluated' ? 'btn-primary' : 'btn-neu'
            } flex items-center gap-1.5`}
          >
            <i className="lni lni-checkmark-circle"></i>
            <span>Evaluated History</span>
          </button>
        </div>
      </div>

      {/* ── Top Scope Filter Card ───────────────────────────────────────────── */}
      <div className="card p-4 mb-5 shadow-sm border border-slate-200">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 items-end">
          {/* 1. Academic Intake */}
          <div className="lg:col-span-3 sm:col-span-6 col-span-12 flex flex-col gap-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Academic Intake <span className="text-red-500">*</span>
            </label>
            <SearchSelect
              options={intakeOptions}
              value={selectedIntakeGuid}
              onChange={setSelectedIntakeGuid}
              placeholder={isIntakesLoading ? 'Loading intakes...' : 'Select intake'}
              className="w-full text-xs"
            />
          </div>

          {/* 2. Assessment Category Filter */}
          <div className="lg:col-span-3 sm:col-span-6 col-span-12 flex flex-col gap-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Category
            </label>
            <SearchSelect
              options={CATEGORY_OPTIONS}
              value={selectedCategory}
              onChange={setSelectedCategory}
              placeholder="All Categories"
              className="w-full text-xs"
            />
          </div>

          {/* 3. Course Unit / Coursework (Only in Pending Mode) */}
          {viewMode === 'pending' && (
            <div className="lg:col-span-4 sm:col-span-8 col-span-12 flex flex-col gap-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Coursework Unit to Evaluate <span className="text-red-500">*</span>
              </label>
              <SearchSelect
                options={unitOptions}
                value={selectedUnitKey}
                onChange={setSelectedUnitKey}
                placeholder={
                  isPendingLoading
                    ? 'Loading pending units...'
                    : filteredPendingUnits.length === 0
                    ? 'No pending units in category'
                    : 'Select coursework unit'
                }
                className="w-full text-xs"
              />
            </div>
          )}

          {/* 4. Active Refresh Button */}
          <div
            className={`col-span-12 ${
              viewMode === 'pending'
                ? 'lg:col-span-2 sm:col-span-4'
                : 'lg:col-span-6 sm:col-span-12 flex justify-end'
            }`}
          >
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="btn btn-neu w-full h-[38px] flex items-center justify-center gap-1.5 text-xs font-semibold shadow-sm transition-all"
              title="Refetch all evaluation data from live server"
            >
              <i
                className={`lni lni-reload ${
                  isRefreshing ? 'animate-spin text-blue-600' : ''
                }`}
              ></i>
              <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          MODE A: PENDING EVALUATION WORKSPACE (2-Column Wireframe Layout)
         ═══════════════════════════════════════════════════════════════════════ */}
      {viewMode === 'pending' && (
        <>
          {!activeUnit ? (
            <div className="card p-10 text-center border border-slate-200">
              <div className="tbl-empty-inner">
                <div className="tbl-empty-icon-wrap">
                  <i className="lni lni-inbox" />
                </div>
                <div className="tbl-empty-title">No Pending Coursework Units</div>
                <div className="tbl-empty-sub">
                  {selectedCategory
                    ? 'There are no pending units matching the selected category for this intake.'
                    : 'There are no pending coursework units requiring evaluation for this academic intake.'}
                </div>
                {selectedCategory && (
                  <button
                    type="button"
                    className="btn btn-neu btn-sm mt-3 inline-flex items-center gap-1"
                    onClick={() => setSelectedCategory('')}
                  >
                    <i className="lni lni-close" />
                    <span>Clear Category Filter</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              
              {/* ───────────────────────────────────────────────────────────────
                  LEFT COLUMN (4 Cols): STUDENT QUEUE ("leaf side student list")
                 ─────────────────────────────────────────────────────────────── */}
              <div className="lg:col-span-4 flex flex-col gap-3">
                <div className="card p-4 shadow-sm border border-slate-200">
                  {/* Header & Student Count */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                    <div className="font-bold text-[13.5px] text-slate-800 flex items-center gap-1.5">
                      <i className="lni lni-users text-blue-600"></i>
                      <span>Students to Mark</span>
                    </div>
                    <span className="badge bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold px-2 py-0.5 rounded-full">
                      {studentList.length} {studentList.length === 1 ? 'Student' : 'Students'}
                    </span>
                  </div>

                  {/* Search Filter */}
                  <div className="mb-3 relative">
                    <input
                      type="text"
                      placeholder="Search by student name or reg no..."
                      value={studentSearch}
                      onChange={e => setStudentSearch(e.target.value)}
                      className="w-full text-xs pl-8 pr-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-500 transition-colors"
                    />
                    <i className="lni lni-search-alt absolute left-2.5 top-2.5 text-slate-400 text-xs"></i>
                  </div>

                  {/* Vertical Student List */}
                  <div className="flex flex-col gap-2 max-h-[580px] overflow-y-auto pr-1">
                    {isStudentsLoading || isStudentsFetching ? (
                      <div className="tbl-empty-inner py-10">
                        <div className="tbl-loading-icon-wrap">
                          <i className="lni lni-reload animate-spin text-blue-600" />
                        </div>
                        <div className="tbl-empty-title">Loading students queue…</div>
                        <div className="tbl-empty-sub">Fetching pending submissions for this unit</div>
                        <div className="tbl-loading-dots">
                          <span className="tbl-loading-dot" />
                          <span className="tbl-loading-dot" />
                          <span className="tbl-loading-dot" />
                        </div>
                      </div>
                    ) : filteredStudents.length === 0 ? (
                      <div className="tbl-empty-inner py-10">
                        <div className="tbl-empty-icon-wrap">
                          <i className="lni lni-inbox text-slate-400" />
                        </div>
                        <div className="tbl-empty-title">No students pending</div>
                        <div className="tbl-empty-sub">
                          {studentSearch
                            ? 'No students match your search filter.'
                            : 'No students pending evaluation in this coursework.'}
                        </div>
                      </div>
                    ) : (
                      filteredStudents.map((std, idx) => {
                        const isSelected = std.studentGuid === selectedStudentGuid
                        return (
                          <div
                            key={std.studentGuid}
                            onClick={() => {
                              setSelectedStudentGuid(std.studentGuid)
                              setActiveQuestionIndex(0)
                            }}
                            className={`p-3 rounded-xl border transition-all cursor-pointer text-left flex items-start gap-3 ${
                              isSelected
                                ? 'bg-blue-50/70 border-blue-500 shadow-sm'
                                : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                            }`}
                          >
                            {/* Avatar */}
                            <div
                              className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                                isSelected
                                  ? 'bg-blue-600 text-white shadow-sm'
                                  : 'bg-slate-100 text-slate-600 border border-slate-200'
                              }`}
                            >
                              {getInitials(std.studentName)}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <span className="font-bold text-[13px] text-slate-900 truncate">
                                  {idx + 1}. {std.studentName || 'Student'}
                                </span>
                                <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0">
                                  Min {std.minQuestion} Qs
                                </span>
                              </div>

                              <div className="text-[11.5px] text-slate-500 font-mono mt-0.5">
                                {std.studentRegNo || '—'}
                              </div>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* ───────────────────────────────────────────────────────────────
                  RIGHT COLUMN (8 Cols): EVALUATION WORKSPACE
                 ─────────────────────────────────────────────────────────────── */}
              <div className="lg:col-span-8 flex flex-col gap-4">
                {!currentStudent ? (
                  <div className="card p-12 text-center border border-slate-200">
                    <div className="tbl-empty-inner">
                      <div className="tbl-empty-icon-wrap">
                        <i className="lni lni-user text-slate-400" />
                      </div>
                      <div className="tbl-empty-title">No Student Selected</div>
                      <div className="tbl-empty-sub">
                        {studentList.length === 0
                          ? 'There are no pending students to evaluate for this coursework unit.'
                          : 'Select a student from the queue on the left to review and grade submissions.'}
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* 1. Student Profile Header (Wireframe Box 1) */}
                    <div className="card p-4 shadow-sm border border-slate-200">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                      <div>
                        <div className="text-[10.5px] uppercase font-bold tracking-wider text-blue-600">
                          Student Profile · {activeUnit.unitCode} ({activeUnit.categoryLabel})
                        </div>
                        <h2 className="text-[17px] font-extrabold text-slate-900 m-0 mt-0.5">
                          {currentStudent.studentName}
                        </h2>
                      </div>

                      {/* Action: View Marks / Scorecard Toggle */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setIsScorecardOpen(!isScorecardOpen)}
                          className={`btn btn-sm ${
                            isScorecardOpen ? 'btn-primary' : 'btn-neu'
                          } flex items-center gap-1.5 text-xs font-semibold`}
                        >
                          <i className="lni lni-bar-chart"></i>
                          <span>{isScorecardOpen ? 'Hide Scorecard' : 'View Marks'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Metadata Details */}
                    <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2 pt-3 text-xs text-slate-600">
                      <div className="flex items-baseline gap-1.5 shrink-0">
                        <span className="text-slate-400 font-medium">Reg No:</span>
                        <strong className="text-slate-800 font-mono font-semibold">{currentStudent.studentRegNo || '—'}</strong>
                      </div>
                      <div className="flex items-baseline gap-1.5 min-w-0">
                        <span className="text-slate-400 font-medium shrink-0">Programme:</span>
                        <span className="text-slate-800 font-medium break-words" title={studentsResponse?.programmeName || ''}>
                          {studentsResponse?.programmeName || '—'}
                        </span>
                      </div>
                      <div className="flex items-baseline gap-1.5 shrink-0">
                        <span className="text-slate-400 font-medium shrink-0">Semester:</span>
                        <span className="text-slate-800 font-medium">
                          {studentsResponse?.semesterName || '—'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Scorecard Table (Visible on 'View Marks' Click) */}
                  {isScorecardOpen && (
                  <div className="card p-4 bg-slate-50 border border-slate-200 shadow-sm transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                        Marks Scorecard Breakdown
                      </span>
                      <span className="text-xs font-semibold text-blue-700">
                        Running Score: {scorecardStats.totalScore} / {scorecardStats.totalMax} Marks
                      </span>
                    </div>

                    <div className="overflow-x-auto border border-slate-200 rounded-lg bg-white">
                      <table className="w-full text-xs">
                        <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                          <tr>
                            <th className="p-2.5 text-left w-24">Question</th>
                            <th className="p-2.5 text-left w-20">Section</th>
                            <th className="p-2.5 text-left">Question Brief</th>
                            <th className="p-2.5 text-center w-24">Max Mark</th>
                            <th className="p-2.5 text-center w-24">Awarded</th>
                          </tr>
                        </thead>
                        <tbody>
                          {localQuestions.map((q, idx) => (
                            <tr
                              key={q.questionGuid}
                              onClick={() => setActiveQuestionIndex(idx)}
                              className={`border-b border-slate-100 hover:bg-blue-50/50 cursor-pointer transition-colors ${
                                idx === activeQuestionIndex ? 'bg-blue-50/70 font-semibold' : ''
                              }`}
                            >
                              <td className="p-2.5 font-bold text-slate-700">Q{idx + 1}</td>
                              <td className="p-2.5 text-slate-500">
                                {q.section ? `Sec ${String.fromCharCode(64 + q.section)}` : 'Sec A'}
                              </td>
                              <td className="p-2.5 text-slate-600 truncate max-w-xs">{q.questionText}</td>
                              <td className="p-2.5 text-center text-slate-600">{q.maxMark}</td>
                              <td className="p-2.5 text-center font-bold">
                                {q.mark === null || q.mark === undefined ? (
                                  <span className="text-slate-400 italic">Unmarked</span>
                                ) : (
                                  <span className="text-emerald-700">{q.mark}</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 2. Main Question Marking Desk (Wireframe Box 2) */}
                {isQuestionsLoading || isQuestionsFetching ? (
                  <div className="card p-12 text-center border border-slate-200">
                    <div className="tbl-empty-inner">
                      <div className="tbl-loading-icon-wrap">
                        <i className="lni lni-reload animate-spin text-blue-600" />
                      </div>
                      <div className="tbl-empty-title">Loading student submission…</div>
                      <div className="tbl-empty-sub">Fetching question paper and submitted answers</div>
                      <div className="tbl-loading-dots">
                        <span className="tbl-loading-dot" />
                        <span className="tbl-loading-dot" />
                        <span className="tbl-loading-dot" />
                      </div>
                    </div>
                  </div>
                ) : !currentQuestion ? (
                  <div className="card p-12 text-center border border-slate-200">
                    <div className="tbl-empty-inner">
                      <div className="tbl-empty-icon-wrap">
                        <i className="lni lni-inbox text-slate-400" />
                      </div>
                      <div className="tbl-empty-title">No questions found</div>
                      <div className="tbl-empty-sub">No questions found for this student submission.</div>
                    </div>
                  </div>
                ) : (
                  <div className="card p-5 shadow-sm border border-slate-200 flex flex-col gap-4">
                    {/* Header Strip: Question Navigation */}
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="badge bg-blue-600 text-white font-bold text-xs px-2.5 py-1 rounded-md">
                          Question {activeQuestionIndex + 1} of {localQuestions.length}
                        </span>
                        {currentQuestion.section && (
                          <span className="badge bg-slate-100 text-slate-700 font-bold text-xs px-2 py-1 rounded-md">
                            Section {String.fromCharCode(64 + currentQuestion.section)}
                          </span>
                        )}
                        <span className="text-xs text-slate-500 font-semibold">
                          [ Max Marks: {currentQuestion.maxMark ?? 10} ]
                        </span>
                      </div>

                      {/* Prev / Next */}
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          disabled={activeQuestionIndex === 0}
                          onClick={() => setActiveQuestionIndex(prev => prev - 1)}
                          className="btn btn-neu btn-sm text-xs disabled:opacity-40"
                        >
                          <i className="lni lni-chevron-left"></i> Prev
                        </button>
                        <button
                          type="button"
                          disabled={activeQuestionIndex === localQuestions.length - 1}
                          onClick={() => setActiveQuestionIndex(prev => prev + 1)}
                          className="btn btn-neu btn-sm text-xs disabled:opacity-40"
                        >
                          Next <i className="lni lni-chevron-right"></i>
                        </button>
                      </div>
                    </div>

                    {/* Question Statement with Scroll Slider */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 shadow-sm">
                      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200/70">
                        <div className="text-[11px] uppercase font-bold tracking-wider text-slate-500 flex items-center gap-1.5">
                          <i className="lni lni-question-circle text-blue-600 text-xs"></i>
                          <span>Question Statement</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsQuestionExpanded(!isQuestionExpanded)}
                          className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1 px-2 py-0.5 rounded hover:bg-blue-50"
                          title={isQuestionExpanded ? 'Limit question height with scrollbar' : 'Expand question to full height'}
                        >
                          <i className={`lni lni-${isQuestionExpanded ? 'chevron-up' : 'chevron-down'} text-[10px]`}></i>
                          <span>{isQuestionExpanded ? 'Collapse' : 'Expand'}</span>
                        </button>
                      </div>

                      <div
                        className={`transition-all ${
                          isQuestionExpanded
                            ? 'max-h-none'
                            : 'max-h-[140px] overflow-y-auto pr-2'
                        }`}
                      >
                        {/<[a-z][\s\S]*>/i.test(currentQuestion.questionText || '') ? (
                          <div
                            className="font-semibold text-[13.5px] text-slate-900 leading-relaxed rich-editor-content"
                            dangerouslySetInnerHTML={{
                              __html: currentQuestion.questionText || '',
                            }}
                          />
                        ) : (
                          <div className="font-semibold text-[13.5px] text-slate-900 leading-relaxed whitespace-pre-line">
                            {currentQuestion.questionText}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Student Answer & File Attachment */}
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[11.5px] uppercase font-bold tracking-wider text-slate-500">
                          Student's Answer
                        </label>
                        {currentQuestion.answerFileUrl && (
                          <a
                            href={currentQuestion.answerFileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-700 px-2.5 py-1 rounded-md text-xs font-semibold hover:bg-blue-100 transition-colors"
                          >
                            <i className="lni lni-paperclip"></i>
                            <span>{currentQuestion.answerFileName || 'View Attached Answer'}</span>
                            <i className="lni lni-download ml-1 text-slate-400"></i>
                          </a>
                        )}
                      </div>

                      <div className="bg-white border border-slate-300 rounded-xl p-4 min-h-[100px] max-h-[160px] overflow-y-auto text-[13px] text-slate-800 leading-relaxed font-sans shadow-inner">
                        {currentQuestion.answerText ? (
                          /<[a-z][\s\S]*>/i.test(currentQuestion.answerText) ? (
                            <div
                              className="rich-editor-content"
                              dangerouslySetInnerHTML={{ __html: currentQuestion.answerText }}
                            />
                          ) : (
                            <div>{currentQuestion.answerText}</div>
                          )
                        ) : (
                          <span className="text-slate-400 italic">No typed answer provided. Check attached file.</span>
                        )}
                      </div>
                    </div>

                    {/* Lecturer Scoring Form: Marks Scored & Finalize Comment */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 pt-2">
                      {/* Awarded Mark Input */}
                      <div className="sm:col-span-4 flex flex-col gap-1.5">
                        <label className="text-[11.5px] font-bold uppercase tracking-wider text-slate-700">
                          Marks Scored (Max: {currentQuestion.maxMark ?? 10}) <span className="text-red-500">*</span>
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            step="any"
                            min={0}
                            max={currentQuestion.maxMark ?? 100}
                            placeholder={`0 - ${currentQuestion.maxMark ?? 10}`}
                            value={markInput}
                            onChange={e => setMarkInput(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') {
                                e.preventDefault()
                                handleSaveAndNext()
                              }
                            }}
                            className="ctrl w-full font-bold text-sm text-slate-900 focus:border-blue-500"
                          />
                          <span className="text-xs font-semibold text-slate-400 shrink-0">
                            / {currentQuestion.maxMark ?? 10}
                          </span>
                        </div>
                      </div>

                      {/* Finalize Comment / Teacher Remarks */}
                      <div className="sm:col-span-8 flex flex-col gap-1.5">
                        <label className="text-[11.5px] font-bold uppercase tracking-wider text-slate-700">
                          Teacher's Remarks / Finalize Feedback (Optional)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Good coverage of section B, clear pulse sequences..."
                          value={finalizeComment}
                          onChange={e => setFinalizeComment(e.target.value)}
                          className="ctrl w-full text-xs"
                        />
                      </div>
                    </div>

                    {/* Action Buttons: Save & Next / Finalize */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-slate-100 mt-2">
                      <div className="text-xs text-slate-500">
                        <span>Questions Graded: </span>
                        <strong className="text-slate-800 font-bold">
                          {scorecardStats.markedCount} / {localQuestions.length}
                        </strong>
                        <span className="text-slate-400 ml-2">
                          (Min required: {currentStudent.minQuestion || localQuestions.length})
                        </span>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        {/* Save & Next Button */}
                        <button
                          type="button"
                          onClick={handleSaveAndNext}
                          disabled={saveMarkMutation.isPending}
                          className="btn btn-primary h-[38px] px-5 flex items-center gap-1.5 font-semibold text-xs shadow-sm"
                        >
                          <span>{saveMarkMutation.isPending ? 'Saving...' : 'Save & Next'}</span>
                          <i className="lni lni-arrow-right font-bold"></i>
                        </button>

                        {/* Finalize Student Button */}
                        <button
                          type="button"
                          onClick={handleFinalize}
                          disabled={
                            finalizeStudentMutation.isPending ||
                            scorecardStats.markedCount < (currentStudent.minQuestion || 1)
                          }
                          className={`btn h-[38px] px-4 flex items-center gap-1.5 font-bold text-xs shadow-sm ${
                            scorecardStats.markedCount >= (currentStudent.minQuestion || 1)
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                          }`}
                          title={
                            scorecardStats.markedCount < (currentStudent.minQuestion || 1)
                              ? `Grade at least ${currentStudent.minQuestion || 1} question(s) to finalize`
                              : 'Finalize student total and advance to next student'
                          }
                        >
                          <i className="lni lni-checkmark-circle font-bold"></i>
                          <span>{finalizeStudentMutation.isPending ? 'Finalizing...' : 'Finalize Student'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                  </>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          MODE B: EVALUATED HISTORY TABLE (Read-Only Per get-evaluated.md)
         ═══════════════════════════════════════════════════════════════════════ */}
      {viewMode === 'evaluated' && (
        <div className="card p-4 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div>
              <h3 className="font-bold text-[14px] text-slate-800 m-0">
                Evaluated Coursework History
              </h3>
              <p className="text-xs text-slate-500 m-0 mt-0.5">
                Units where all submitted students have been finalized (Read-only view)
              </p>
            </div>
            <span className="badge bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold px-2.5 py-1 rounded-full">
              {filteredEvaluatedUnits.length} Completed {filteredEvaluatedUnits.length === 1 ? 'Unit' : 'Units'}
            </span>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3 text-left w-32">Unit Code</th>
                  <th className="p-3 text-left">Course Unit Name</th>
                  <th className="p-3 text-left w-36">Category</th>
                  <th className="p-3 text-center w-28">Enrolled</th>
                  <th className="p-3 text-center w-28">Submitted</th>
                  <th className="p-3 text-center w-28">Evaluated</th>
                  <th className="p-3 text-center w-28">Status</th>
                </tr>
              </thead>
              <tbody>
                {isEvaluatedLoading || isEvaluatedFetching ? (
                  <TableLoadingState
                    colSpan={7}
                    title="Loading evaluated history…"
                    subtitle="Fetching completed coursework records from server..."
                  />
                ) : filteredEvaluatedUnits.length === 0 ? (
                  <EmptyState
                    colSpan={7}
                    title="No evaluated units found"
                    subtitle={
                      selectedCategory
                        ? 'No coursework units matching this category have been finalized.'
                        : 'No coursework units have been completely evaluated for this intake yet.'
                    }
                    hasFilters={Boolean(selectedCategory)}
                    onClearFilters={() => setSelectedCategory('')}
                  />
                ) : (
                  filteredEvaluatedUnits.map((u, idx) => (
                    <tr
                      key={`${u.category}-${u.courseworkOrTestGuid}-${idx}`}
                      className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                    >
                      <td className="p-3 font-mono font-bold text-slate-800">{u.unitCode || '—'}</td>
                      <td className="p-3 font-medium text-slate-800">{u.unitName || '—'}</td>
                      <td className="p-3 text-slate-600">
                        <span className="badge badge-purple text-[10px] font-semibold px-2 py-0.5 rounded-full">
                          {u.categoryLabel}
                        </span>
                      </td>
                      <td className="p-3 text-center text-slate-600">{u.studyingCount}</td>
                      <td className="p-3 text-center text-slate-600 font-semibold">{u.attendedCount}</td>
                      <td className="p-3 text-center font-bold text-emerald-700">{u.evaluatedCount}</td>
                      <td className="p-3 text-center">
                        <span className="bg-emerald-100 text-emerald-800 text-[10.5px] font-bold px-2 py-0.5 rounded-full">
                          ✓ Completed
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Toast Alert ─────────────────────────────────────────────────────── */}
      <Toast toast={toast} />
    </div>
  )
}
