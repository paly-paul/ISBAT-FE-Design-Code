'use client'

import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { SearchSelect } from '@/components/SearchSelect'
import { LoadingState } from '@/components/TableLoadingState'
import { useIntakesDropdown } from '@/hooks/academic/useIntakes'
import { usePagePermissions } from '@/hooks/users/usePagePermissions'
import {
  useGenerateResultStatus,
  useGenerateResultsScope,
  usePublishResultsScope,
  useWithdrawResultsScope,
  useDeleteResultsScope,
  BatchResultStatus,
  BatchSkippedItem,
  GenerateWarning,
  ProgramStatusNode,
  SemesterStatusNode,
  BatchStatusItem,
} from '@/hooks/assessment/useGenerateResult'

// Generate Result — per-batch rework
// The Generate Result page lets exam staff generate, publish, withdraw and delete exam results
// for an academic intake, per programme, semester or batch in a tree structure.
// Kept visually identical to generate-result.html, scoped under .gr in globals.css.

// ── Types & Helpers ────────────────────────────────────────────────────────

type Action = 'gen' | 'pub' | 'del' | 'wd'

const STATUS_NEEDS: Record<Action, BatchResultStatus> = {
  gen: 'NotGenerated',
  pub: 'Generated',
  del: 'Generated',
  wd: 'Published',
}

const STATUS_LABELS: Record<BatchResultStatus, string> = {
  NotGenerated: 'Not generated',
  Generated: 'Generated',
  Published: 'Published',
}

const STATUS_CLASSES: Record<BatchResultStatus, { pill: string; bar: string }> = {
  NotGenerated: { pill: 'gr-p-none', bar: 'gr-c-none' },
  Generated: { pill: 'gr-p-draft', bar: 'gr-c-draft' },
  Published: { pill: 'gr-p-pub', bar: 'gr-c-pub' },
}

const plural = (n: number, w: string, pl?: string) => `${n} ${n === 1 ? w : (pl ?? `${w}s`)}`

interface Filters {
  programGuid: string
  semesterGuid: string
  batchGuid: string
  status: '' | BatchResultStatus
}

const NO_FILTERS: Filters = { programGuid: '', semesterGuid: '', batchGuid: '', status: '' }

interface TargetBatchItem {
  batchGuid: string
  batchCode: string
  studentCount: number
  displayPrefix?: string
}

interface DialogScope {
  action: Action
  kind: 'all' | 'programme' | 'semester' | 'batch'
  label: string
  programGuid?: string
  semesterGuid?: string
  batchGuid?: string
  targetBatches: TargetBatchItem[]
  skippedOtherCount: number
}

interface ActionOutcome {
  action: Action
  changed: number
  skippedCount: number
  skipped: BatchSkippedItem[]
  warnings?: GenerateWarning[]
}

// ── Icons ───────────────────────────────────────────────────────────────────

const PATHS = {
  chev: <path d="m6 9 6 6 6-6" />,
  gen: <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />,
  pub: <path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z" />,
  del: <path d="M3 6h18M8 6V4h8v2m-9 0 1 14h8l1-14" />,
  wd: <><path d="M9 14 4 9l5-5" /><path d="M4 9h11a5 5 0 0 1 0 10h-3" /></>,
  ok: <path d="M20 6 9 17l-5-5" />,
}

function Icon({ name, size = 15 }: { name: keyof typeof PATHS; size?: number }) {
  const w = name === 'del' ? 2 : name === 'ok' ? 2.5 : 2.2
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {PATHS[name]}
    </svg>
  )
}

// ── Page Component ──────────────────────────────────────────────────────────

export default function GenerateResultPage() {
  const permissions = usePagePermissions()
  const canGetTree = permissions.get ?? true

  // ── Intakes ──
  const intakesQ = useIntakesDropdown()
  const intakes = intakesQ.data ?? []
  const [selectedIntakeGuid, setSelectedIntakeGuid] = useState<string>('')

  // Auto-select current intake
  useEffect(() => {
    if (selectedIntakeGuid || intakes.length === 0) return
    const current = intakes.find(i => Boolean(i.currentIntake)) ?? intakes[0]
    if (current) {
      setSelectedIntakeGuid(current.intakeGuid)
    }
  }, [intakes, selectedIntakeGuid])

  const selectedIntakeObj = useMemo(() =>
    intakes.find(i => i.intakeGuid === selectedIntakeGuid),
    [intakes, selectedIntakeGuid]
  )

  const intakeOptions = useMemo(() => {
    return intakes.map(i => ({
      value: i.intakeGuid,
      label: `${i.description} (${i.intakeCode})${i.currentIntake ? ' · Current' : ''}`,
    }))
  }, [intakes])

  // ── Filters & Panel State ──
  const [filters, setFilters] = useState<Filters>(NO_FILTERS)
  const [panelOpen, setPanelOpen] = useState(false)
  const [open, setOpen] = useState<Set<string>>(() => new Set())

  // ── Dialog & Outcome States ──
  const [confirmScope, setConfirmScope] = useState<DialogScope | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [actionOutcomeModal, setActionOutcomeModal] = useState<ActionOutcome | null>(null)

  // ── Toast State ──
  const [toast, setToast] = useState<{ msg: string; on: boolean }>({ msg: '', on: false })
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function showToast(msg: string) {
    setToast({ msg, on: true })
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(t => ({ ...t, on: false })), 2600)
  }

  // ── Unfiltered tree for filter dropdown options ──
  // Doc: "Keep the first tree loaded for an intake, with no filters, in memory for these options.
  // A filtered or status-filtered response leaves out semesters and batches, so building the
  // dropdowns from it would shrink them."
  const unfilteredParams = useMemo(() => ({
    intakeGuid: selectedIntakeGuid,
  }), [selectedIntakeGuid])

  const unfilteredTreeQ = useGenerateResultStatus(
    selectedIntakeGuid ? unfilteredParams : null,
    Boolean(selectedIntakeGuid && canGetTree)
  )

  const unfilteredPrograms = unfilteredTreeQ.data?.programs ?? []

  // Options for filter panel
  const programOptions = useMemo(() => [
    { value: '', label: 'All programmes' },
    ...unfilteredPrograms.map(p => ({
      value: p.programGuid,
      label: `${p.programCode} · ${p.programName}`,
    })),
  ], [unfilteredPrograms])

  const selectedProgramNode = useMemo(() =>
    unfilteredPrograms.find(p => p.programGuid === filters.programGuid),
    [unfilteredPrograms, filters.programGuid]
  )

  const semesterOptions = useMemo(() => [
    { value: '', label: filters.programGuid ? 'All semesters' : 'Choose a programme first' },
    ...(selectedProgramNode?.semesters ?? []).map(s => ({
      value: s.semesterGuid,
      label: s.semesterName || `Semester ${s.semesterCode}`,
    })),
  ], [filters.programGuid, selectedProgramNode])

  const selectedSemesterNode = useMemo(() =>
    selectedProgramNode?.semesters.find(s => s.semesterGuid === filters.semesterGuid),
    [selectedProgramNode, filters.semesterGuid]
  )

  const batchOptions = useMemo(() => [
    { value: '', label: filters.semesterGuid ? 'All batches' : 'Choose a semester first' },
    ...(selectedSemesterNode?.batchItems ?? []).map(b => ({
      value: b.batchGuid,
      label: b.batchCode,
    })),
  ], [filters.semesterGuid, selectedSemesterNode])

  const statusOptions = [
    { value: '', label: 'All statuses' },
    { value: 'NotGenerated', label: 'Not generated' },
    { value: 'Generated', label: 'Generated' },
    { value: 'Published', label: 'Published' },
  ]

  // ── Active Tree Query ──
  const statusParams = useMemo(() => ({
    intakeGuid: selectedIntakeGuid,
    programGuid: filters.programGuid || undefined,
    semesterGuid: filters.semesterGuid || undefined,
    batchGuid: filters.batchGuid || undefined,
    status: filters.status || undefined,
  }), [selectedIntakeGuid, filters.programGuid, filters.semesterGuid, filters.batchGuid, filters.status])

  const statusQ = useGenerateResultStatus(
    selectedIntakeGuid ? statusParams : null,
    Boolean(selectedIntakeGuid && canGetTree)
  )

  const treeData = statusQ.data
  const isInitialLoading = intakesQ.isLoading || (statusQ.isLoading && !treeData) || !selectedIntakeGuid
  const isCurrentIntake = treeData?.isCurrentIntake ?? Boolean(selectedIntakeObj?.currentIntake)
  const readOnly = !isCurrentIntake

  // Permissions gated by current intake
  const canGenerate = (permissions.generate ?? true) && isCurrentIntake
  const canPublish = (permissions.publish ?? true) && isCurrentIntake
  const canWithdraw = (permissions.withdraw ?? true) && isCurrentIntake
  const canDelete = (permissions.delete ?? true) && isCurrentIntake

  const summary = treeData?.summary ?? {
    totalBatches: 0,
    batches: { notGenerated: 0, generated: 0, published: 0 },
    students: { notGenerated: 0, generated: 0, published: 0 },
  }

  const programs = treeData?.programs ?? []

  // ── Tree Expansion Keys ──
  const allKeys = useMemo(() =>
    programs.flatMap(p => [
      `p:${p.programGuid}`,
      ...p.semesters.map(s => `s:${p.programGuid}|${s.semesterGuid}`),
    ]),
    [programs]
  )
  const allOpen = allKeys.length > 0 && allKeys.every(k => open.has(k))
  const expandAll = () => setOpen(new Set(allKeys))
  const collapseAll = () => setOpen(new Set())

  // Default expand first programme when newly loaded
  useEffect(() => {
    if (programs.length > 0 && open.size === 0) {
      const first = programs[0]
      const initial = new Set<string>([`p:${first.programGuid}`])
      if (first.semesters[0]) {
        initial.add(`s:${first.programGuid}|${first.semesters[0].semesterGuid}`)
      }
      setOpen(initial)
    }
  }, [programs, open.size])

  const toggle = (k: string) => setOpen(prev => {
    const n = new Set(prev)
    if (n.has(k)) n.delete(k)
    else n.add(k)
    return n
  })

  // ── Filter Management ──
  function setFilter<K extends keyof Filters>(k: K, v: Filters[K]) {
    setFilters(prev => {
      const next = { ...prev, [k]: v }
      if (k === 'programGuid') { next.semesterGuid = ''; next.batchGuid = '' }
      if (k === 'semesterGuid') { next.batchGuid = '' }
      return next
    })
    if (k === 'programGuid' && v) setOpen(prev => new Set(prev).add(`p:${v}`))
    if (k === 'semesterGuid' && v) setOpen(prev => new Set(prev).add(`s:${filters.programGuid}|${v}`))
    if (k === 'status' && v) expandAll()
  }

  const clearFilters = () => setFilters(NO_FILTERS)

  function changeIntake(guid: string) {
    if (!guid || guid === selectedIntakeGuid) return
    setSelectedIntakeGuid(guid)
    clearFilters()
    const match = intakes.find(i => i.intakeGuid === guid)
    showToast(`Showing ${match ? `${match.description} (${match.intakeCode})` : 'intake'}`)
  }

  // ── Panel Focus & Outside Click ──
  const panelRef = useRef<HTMLDivElement>(null)
  const filterBtnRef = useRef<HTMLButtonElement>(null)
  const lastFocus = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (panelOpen) panelRef.current?.querySelector<HTMLElement>('.ss-trigger')?.focus()
  }, [panelOpen])

  useEffect(() => {
    if (!panelOpen) return
    function onDown(e: MouseEvent) {
      const t = e.target as HTMLElement
      if (t.closest('.ss-drop') || panelRef.current?.contains(t) || filterBtnRef.current?.contains(t)) return
      setPanelOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !confirmScope) {
        setPanelOpen(false)
        filterBtnRef.current?.focus()
      }
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [panelOpen, confirmScope])

  // ── Counts in view ──
  const shownBatchesCount = useMemo(() => {
    let count = 0
    programs.forEach(p => p.semesters.forEach(s => { count += s.batchItems.length }))
    return count
  }, [programs])

  const readyToPublishInView = useMemo(() => {
    let count = 0
    programs.forEach(p => p.semesters.forEach(s => s.batchItems.forEach(b => {
      if (b.status === 'Generated') count++
    })))
    return count
  }, [programs])

  const filterCount = [filters.programGuid, filters.semesterGuid, filters.batchGuid, filters.status].filter(Boolean).length

  // Filter chips
  const chips: { k: keyof Filters; label: string }[] = []
  if (filters.programGuid) {
    const p = unfilteredPrograms.find(item => item.programGuid === filters.programGuid)
    chips.push({ k: 'programGuid', label: p ? p.programCode : filters.programGuid })
  }
  if (filters.semesterGuid) {
    const s = selectedProgramNode?.semesters.find(item => item.semesterGuid === filters.semesterGuid)
    chips.push({ k: 'semesterGuid', label: s?.semesterName || `Semester ${s?.semesterCode || ''}` })
  }
  if (filters.batchGuid) {
    const b = selectedSemesterNode?.batchItems.find(item => item.batchGuid === filters.batchGuid)
    chips.push({ k: 'batchGuid', label: b ? b.batchCode : filters.batchGuid })
  }
  if (filters.status) {
    chips.push({ k: 'status', label: STATUS_LABELS[filters.status] })
  }

  // ── Mutations ──
  const generateMutation = useGenerateResultsScope()
  const publishMutation = usePublishResultsScope()
  const withdrawMutation = useWithdrawResultsScope()
  const deleteMutation = useDeleteResultsScope()

  // ── Action Ask / Confirm Preparation ──
  function ask(action: Action, scopeKind: 'all' | 'programme' | 'semester' | 'batch', payload?: {
    program?: ProgramStatusNode
    semester?: SemesterStatusNode
    batch?: BatchStatusItem
  }) {
    if (readOnly) return

    const neededStatus = STATUS_NEEDS[action]
    let label = ''
    let programGuid: string | undefined
    let semesterGuid: string | undefined
    let batchGuid: string | undefined
    const targetBatches: TargetBatchItem[] = []
    let skippedOtherCount = 0

    if (scopeKind === 'all') {
      const parts = [
        chips.find(c => c.k === 'programGuid')?.label,
        chips.find(c => c.k === 'semesterGuid')?.label,
        chips.find(c => c.k === 'batchGuid')?.label,
      ].filter(Boolean).join(' · ')
      label = `${selectedIntakeObj ? `${selectedIntakeObj.description}` : 'Intake'} · ${parts || 'all programmes'}`
      programGuid = filters.programGuid || undefined
      semesterGuid = filters.semesterGuid || undefined
      batchGuid = filters.batchGuid || undefined

      programs.forEach(p => {
        p.semesters.forEach(s => {
          s.batchItems.forEach(b => {
            if (b.status === neededStatus) {
              targetBatches.push({
                batchGuid: b.batchGuid,
                batchCode: b.batchCode,
                studentCount: b.studentCount,
                displayPrefix: `${p.programCode} · ${s.semesterName}`,
              })
            } else {
              skippedOtherCount++
            }
          })
        })
      })
    } else if (scopeKind === 'programme' && payload?.program) {
      const p = payload.program
      label = `${p.programCode} · ${p.programName}`
      programGuid = p.programGuid

      p.semesters.forEach(s => {
        s.batchItems.forEach(b => {
          if (b.status === neededStatus) {
            targetBatches.push({
              batchGuid: b.batchGuid,
              batchCode: b.batchCode,
              studentCount: b.studentCount,
              displayPrefix: s.semesterName,
            })
          } else {
            skippedOtherCount++
          }
        })
      })
    } else if (scopeKind === 'semester' && payload?.program && payload?.semester) {
      const p = payload.program
      const s = payload.semester
      label = `${p.programCode} · ${s.semesterName}`
      programGuid = p.programGuid
      semesterGuid = s.semesterGuid

      s.batchItems.forEach(b => {
        if (b.status === neededStatus) {
          targetBatches.push({
            batchGuid: b.batchGuid,
            batchCode: b.batchCode,
            studentCount: b.studentCount,
          })
        } else {
          skippedOtherCount++
        }
      })
    } else if (scopeKind === 'batch' && payload?.program && payload?.semester && payload?.batch) {
      const p = payload.program
      const s = payload.semester
      const b = payload.batch
      label = `${p.programCode} · ${s.semesterName} · ${b.batchCode}`
      programGuid = p.programGuid
      semesterGuid = s.semesterGuid
      batchGuid = b.batchGuid

      if (b.status === neededStatus) {
        targetBatches.push({
          batchGuid: b.batchGuid,
          batchCode: b.batchCode,
          studentCount: b.studentCount,
        })
      }
    }

    if (targetBatches.length === 0) return

    lastFocus.current = document.activeElement as HTMLElement | null
    setConfirmScope({
      action,
      kind: scopeKind,
      label,
      programGuid,
      semesterGuid,
      batchGuid,
      targetBatches,
      skippedOtherCount,
    })
  }

  function closeConfirm() {
    setConfirmScope(null)
    const el = lastFocus.current
    if (el && document.body.contains(el)) setTimeout(() => el.focus(), 0)
  }

  // ── Run Action ──
  async function runConfirm() {
    if (!confirmScope || !selectedIntakeGuid) return
    setIsSubmitting(true)

    try {
      if (confirmScope.action === 'gen') {
        const res = await generateMutation.mutateAsync({
          intakeGuid: selectedIntakeGuid,
          programGuid: confirmScope.programGuid,
          semesterGuid: confirmScope.semesterGuid,
          batchGuid: confirmScope.batchGuid,
        })
        closeConfirm()
        showToast(`Generated ${plural(res.batchesChanged, 'batch', 'batches')}${res.batchesSkipped > 0 ? `, ${res.batchesSkipped} skipped` : ''}`)
        if (res.batchesSkipped > 0 || (res.warnings && res.warnings.length > 0)) {
          setActionOutcomeModal({
            action: 'gen',
            changed: res.batchesChanged,
            skippedCount: res.batchesSkipped,
            skipped: res.skipped,
            warnings: res.warnings,
          })
        }
      } else if (confirmScope.action === 'pub') {
        const res = await publishMutation.mutateAsync({
          intakeGuid: selectedIntakeGuid,
          programGuid: confirmScope.programGuid,
          semesterGuid: confirmScope.semesterGuid,
          batchGuid: confirmScope.batchGuid,
        })
        closeConfirm()
        showToast(`Published ${plural(res.batchesChanged, 'batch', 'batches')}${res.batchesSkipped > 0 ? `, ${res.batchesSkipped} skipped` : ''}`)
        if (res.batchesSkipped > 0) {
          setActionOutcomeModal({
            action: 'pub',
            changed: res.batchesChanged,
            skippedCount: res.batchesSkipped,
            skipped: res.skipped,
          })
        }
      } else if (confirmScope.action === 'wd') {
        const res = await withdrawMutation.mutateAsync({
          intakeGuid: selectedIntakeGuid,
          programGuid: confirmScope.programGuid,
          semesterGuid: confirmScope.semesterGuid,
          batchGuid: confirmScope.batchGuid,
        })
        closeConfirm()
        showToast(`Withdrawn ${plural(res.batchesChanged, 'batch', 'batches')}${res.batchesSkipped > 0 ? `, ${res.batchesSkipped} skipped` : ''}`)
        if (res.batchesSkipped > 0) {
          setActionOutcomeModal({
            action: 'wd',
            changed: res.batchesChanged,
            skippedCount: res.batchesSkipped,
            skipped: res.skipped,
          })
        }
      } else if (confirmScope.action === 'del') {
        const res = await deleteMutation.mutateAsync({
          intakeGuid: selectedIntakeGuid,
          programGuid: confirmScope.programGuid,
          semesterGuid: confirmScope.semesterGuid,
          batchGuid: confirmScope.batchGuid,
        })
        closeConfirm()
        showToast(`Deleted ${plural(res.batchesChanged, 'batch', 'batches')}${res.batchesSkipped > 0 ? `, ${res.batchesSkipped} skipped` : ''}`)
        if (res.batchesSkipped > 0) {
          setActionOutcomeModal({
            action: 'del',
            changed: res.batchesChanged,
            skippedCount: res.batchesSkipped,
            skipped: res.skipped,
          })
        }
      }
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || 'Action failed. Please try again.'
      showToast(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Escape to close confirm dialog
  useEffect(() => {
    if (!confirmScope) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeConfirm() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [confirmScope])

  // ── Render Pieces ──

  function renderStatusCell(status: BatchResultStatus, batches: { notGenerated: number; generated: number; published: number }, totalBatches: number) {
    if (totalBatches === 1) {
      return (
        <span className={`gr-pill ${STATUS_CLASSES[status].pill}`}>
          {STATUS_LABELS[status]}
        </span>
      )
    }
    const pubWidth = totalBatches > 0 ? (batches.published / totalBatches) * 100 : 0
    const draftWidth = totalBatches > 0 ? (batches.generated / totalBatches) * 100 : 0
    return (
      <div className="gr-st">
        <div className="gr-st-top">
          <span><b className="gr-num">{batches.published}</b> of <span className="gr-num">{totalBatches}</span> published</span>
          {batches.generated > 0 && <span className="gr-num gr-stx">{batches.generated} generated</span>}
        </div>
        <div className="gr-bar" role="img" aria-label={`${batches.published} published, ${batches.generated} generated, ${batches.notGenerated} not generated`}>
          {pubWidth > 0 && <i className="gr-c-pub" style={{ width: `${pubWidth}%` }} title={`${batches.published} published`} />}
          {draftWidth > 0 && <i className="gr-c-draft" style={{ width: `${draftWidth}%` }} title={`${batches.generated} generated`} />}
        </div>
      </div>
    )
  }

  function renderRowActions(
    status: BatchResultStatus,
    scopeKind: 'programme' | 'semester' | 'batch',
    name: string,
    payload: { program: ProgramStatusNode; semester?: SemesterStatusNode; batch?: BatchStatusItem }
  ) {
    if (readOnly) return null
    const lab = `for ${name}`

    if (status === 'NotGenerated') {
      if (!canGenerate) return null
      return (
        <div className="gr-acts">
          <button type="button" className="gr-btn gr-sm gr-primary" onClick={() => ask('gen', scopeKind, payload)} aria-label={`Generate result ${lab}`}>
            <Icon name="gen" />Generate result
          </button>
        </div>
      )
    }
    if (status === 'Generated') {
      return (
        <div className="gr-acts">
          {canDelete && (
            <button type="button" className="gr-btn gr-sm gr-del" onClick={() => ask('del', scopeKind, payload)} aria-label={`Delete result ${lab}`}>
              <Icon name="del" />Delete result
            </button>
          )}
          {canPublish && (
            <button type="button" className="gr-btn gr-sm gr-primary" onClick={() => ask('pub', scopeKind, payload)} aria-label={`Publish ${lab}`}>
              <Icon name="pub" />Publish
            </button>
          )}
        </div>
      )
    }
    if (status === 'Published') {
      if (!canWithdraw) return null
      return (
        <div className="gr-acts">
          <button type="button" className="gr-btn gr-sm" onClick={() => ask('wd', scopeKind, payload)} aria-label={`Withdraw ${lab}`}>
            <Icon name="wd" />Withdraw
          </button>
        </div>
      )
    }
    return null
  }

  const toggleBtn = (k: string, label: string) => (
    <button
      type="button"
      className="gr-btn gr-tg"
      aria-expanded={open.has(k)}
      aria-label={`${open.has(k) ? 'Collapse' : 'Expand'} ${label}`}
      onClick={() => toggle(k)}
    >
      <Icon name="chev" />
    </button>
  )

  // ── Tree Construction ──
  const treeRows = programs.map(p => {
    const pOpen = open.has(`p:${p.programGuid}`)
    const totalProgramBatches = p.batches.notGenerated + p.batches.generated + p.batches.published

    return (
      <Fragment key={p.programGuid}>
        {/* Level 0: Programme */}
        <div className={`gr-row gr-l0 gr-grid${pOpen ? ' gr-open' : ''}`}>
          <div className="gr-name">
            {toggleBtn(`p:${p.programGuid}`, p.programCode)}
            <div className="gr-tt">
              <div className="gr-t1">
                <span className="gr-code">{p.programCode}</span>{p.programName}
              </div>
              <div className="gr-t2">
                {plural(p.semesters.length, 'semester')} · {plural(totalProgramBatches, 'batch', 'batches')}
              </div>
            </div>
          </div>
          <div className="gr-stu gr-num">{p.studentCount}</div>
          {renderStatusCell(p.status, p.batches, totalProgramBatches)}
          {renderRowActions(p.status, 'programme', p.programCode, { program: p })}
        </div>

        {/* Level 1: Semesters */}
        {pOpen && p.semesters.map(s => {
          const sKey = `s:${p.programGuid}|${s.semesterGuid}`
          const sOpen = open.has(sKey)
          const totalSemesterBatches = s.batches.notGenerated + s.batches.generated + s.batches.published

          return (
            <Fragment key={sKey}>
              <div className="gr-row gr-l1 gr-grid">
                <div className="gr-name">
                  {toggleBtn(sKey, s.semesterName || `Semester ${s.semesterCode}`)}
                  <div className="gr-tt">
                    <div className="gr-t1">{s.semesterName || `Semester ${s.semesterCode}`}</div>
                    <div className="gr-t2">
                      {plural(totalSemesterBatches, 'batch', 'batches')} · {plural(s.courseUnitCount, 'course unit')}
                    </div>
                  </div>
                </div>
                <div className="gr-stu gr-num">{s.studentCount}</div>
                {renderStatusCell(s.status, s.batches, totalSemesterBatches)}
                {renderRowActions(s.status, 'semester', `${p.programCode} ${s.semesterName}`, { program: p, semester: s })}
              </div>

              {/* Level 2: Batches */}
              {sOpen && s.batchItems.map(b => (
                <div key={b.batchGuid} className="gr-row gr-l2 gr-grid">
                  <div className="gr-name">
                    <div className="gr-tt">
                      <div className="gr-t1">{b.batchCode}</div>
                      <div className="gr-t2">
                        {STATUS_LABELS[b.status]} · {plural(b.studentCount, 'student')}
                      </div>
                    </div>
                  </div>
                  <div className="gr-stu gr-num">{b.studentCount}</div>
                  {renderStatusCell(b.status, { notGenerated: b.status === 'NotGenerated' ? 1 : 0, generated: b.status === 'Generated' ? 1 : 0, published: b.status === 'Published' ? 1 : 0 }, 1)}
                  {renderRowActions(b.status, 'batch', `${b.batchCode}, ${s.semesterName}`, { program: p, semester: s, batch: b })}
                </div>
              ))}
            </Fragment>
          )
        })}
      </Fragment>
    )
  })

  // ── Summary Calculations ──
  const pct = summary.totalBatches > 0 ? Math.round((summary.batches.published / summary.totalBatches) * 100) : 0
  const pubSegWidth = summary.totalBatches > 0 ? (summary.batches.published / summary.totalBatches) * 100 : 0
  const draftSegWidth = summary.totalBatches > 0 ? (summary.batches.generated / summary.totalBatches) * 100 : 0
  const noneSegWidth = summary.totalBatches > 0 ? (summary.batches.notGenerated / summary.totalBatches) * 100 : 0

  const summaryTab = (v: '' | BatchResultStatus, label: string, count: number) => (
    <button
      type="button"
      className="gr-btn gr-tab"
      aria-pressed={filters.status === v}
      onClick={() => setFilter('status', filters.status === v && v ? '' : v)}
    >
      {v && <i className={STATUS_CLASSES[v].bar} />}
      {label}
      <span className="gr-tc gr-num">{count}</span>
    </button>
  )

  // ── Dialog Content ──
  let confirmDialog: React.ReactNode = null
  if (confirmScope) {
    const { label, targetBatches, skippedOtherCount, kind } = confirmScope
    const one = targetBatches.length === 1
    const nb = plural(targetBatches.length, 'batch', 'batches')
    const T = {
      gen: {
        icon: 'gen' as const,
        title: one ? 'Generate result?' : `Generate results for ${nb}?`,
        body: 'IA and UE totals are worked out from the marks entered. Nothing is shown to students until you publish.',
        ok: 'Generate result',
      },
      pub: {
        icon: 'pub' as const,
        title: one ? 'Publish result?' : `Publish ${nb}?`,
        body: 'Students will see these results on the Student Portal. To make changes later you’ll need to withdraw them.',
        ok: 'Publish',
      },
      del: {
        icon: 'del' as const,
        title: one ? 'Delete result?' : `Delete results for ${nb}?`,
        body: 'The generated result is removed, including any moderation applied on it. Marks entered by lecturers stay as they are, and you can generate again.',
        ok: 'Delete result',
      },
      wd: {
        icon: 'wd' as const,
        title: one ? 'Withdraw result?' : `Withdraw ${nb}?`,
        body: 'Students will no longer see these results. Afterwards you can publish again or delete the result.',
        ok: 'Withdraw',
      },
    }[confirmScope.action]

    const danger = confirmScope.action === 'del'

    confirmDialog = (
      <div className="gr-modal">
        <div className="gr-dlg" role="dialog" aria-modal="true" aria-labelledby="gr-mt">
          <div className={`gr-ico${danger ? ' gr-d' : ''}`}>
            <Icon name={T.icon} size={20} />
          </div>
          <h3 id="gr-mt">{T.title}</h3>
          <p>{T.body}</p>

          <div className="gr-box">
            <div className="gr-bh">
              <b>{label}</b>
              <span className="gr-num">{kind === 'batch' ? plural(targetBatches[0]?.studentCount ?? 0, 'student') : nb}</span>
            </div>
            {kind !== 'batch' && targetBatches.length > 0 && (
              <ul>
                {targetBatches.map(b => (
                  <li key={b.batchGuid}>
                    {b.displayPrefix ? `${b.displayPrefix} · ` : ''}{b.batchCode}
                    <span className="gr-num">{plural(b.studentCount, 'student')}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {skippedOtherCount > 0 && (
            <div className="gr-note">
              {plural(skippedOtherCount, 'other batch', 'other batches')} in this {kind === 'all' ? 'view' : kind} {skippedOtherCount === 1 ? 'is' : 'are'} at a different step and won’t change.
            </div>
          )}

          <div className="gr-dfoot">
            <button type="button" className="gr-btn" onClick={closeConfirm} disabled={isSubmitting}>
              Cancel
            </button>
            <button
              type="button"
              className={`gr-btn ${danger ? 'gr-danger' : 'gr-primary'}`}
              onClick={runConfirm}
              disabled={isSubmitting}
              autoFocus
            >
              {isSubmitting ? 'Processing...' : T.ok}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page active gr" id="page-generate-result">
      {/* Top Header */}
      <div className="gr-top">
        <div>
          <h1>Generate Result</h1>
          <p className="gr-sub">Generate, publish and withdraw exam results by programme, semester or batch.</p>
        </div>
        <div style={{ minWidth: 280, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2px' }}>
            <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--gr-muted)' }}>
              Academic intake
            </span>
            {selectedIntakeObj && (
              <span className={`gr-tagc ${readOnly ? 'gr-old' : 'gr-cur'}`}>
                {readOnly ? 'Past' : 'Current'}
              </span>
            )}
          </div>
          <SearchSelect
            options={intakeOptions}
            value={selectedIntakeGuid}
            onChange={val => changeIntake(val)}
            placeholder="Select Academic Intake"
            isLoading={intakesQ.isLoading}
          />
        </div>
      </div>

      {isInitialLoading ? (
        <section className="gr-card" style={{ minHeight: '340px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <LoadingState
            title="Loading results…"
            subtitle="Fetching academic intake results and batch statuses, just a moment."
          />
        </section>
      ) : (
        <>
          {/* Summary Card */}
          <section className="gr-card gr-sum" aria-label="Summary">
            <div>
              <div className="gr-sum-k">Publishing progress</div>
              <div className="gr-sum-v">
                <b className="gr-num">{summary.batches.published}</b>
                <span>of {plural(summary.totalBatches, 'batch', 'batches')} published</span>
                <span className="gr-pc gr-num">{pct}%</span>
              </div>
            </div>

            <div className="gr-tabs" role="group" aria-label="Show batches by status">
              {summaryTab('', 'All', summary.totalBatches)}
              {summaryTab('NotGenerated', 'Not generated', summary.batches.notGenerated)}
              {summaryTab('Generated', 'Generated', summary.batches.generated)}
              {summaryTab('Published', 'Published', summary.batches.published)}
            </div>

            <div className="gr-sum-bar" role="img" aria-label={`${summary.batches.published} published, ${summary.batches.generated} generated, ${summary.batches.notGenerated} not generated`}>
              {pubSegWidth > 0 && <i className="gr-c-pub" style={{ width: `${pubSegWidth}%` }} title={`${summary.batches.published} published`} />}
              {draftSegWidth > 0 && <i className="gr-c-draft" style={{ width: `${draftSegWidth}%` }} title={`${summary.batches.generated} generated`} />}
              {noneSegWidth > 0 && <i className="gr-c-none" style={{ width: `${noneSegWidth}%` }} title={`${summary.batches.notGenerated} not generated`} />}
            </div>

            <div className="gr-sum-f">
              <span><i className="gr-c-pub" /><b className="gr-num">{summary.students.published.toLocaleString()}</b> students can see results</span>
              <span><i className="gr-c-draft" /><b className="gr-num">{summary.students.generated.toLocaleString()}</b> waiting on publish</span>
              <span><i className="gr-c-none" /><b className="gr-num">{summary.students.notGenerated.toLocaleString()}</b> waiting on generate</span>
            </div>
          </section>

          {/* Results List Card */}
          <section className={`gr-card${readOnly ? ' gr-ro' : ''}`} aria-labelledby="gr-lh">
            <div className="gr-lh">
              <div className="gr-lhl">
                <h2 id="gr-lh">
                  Results <span className="gr-cnt gr-num">{plural(shownBatchesCount, 'batch', 'batches')}</span>
                </h2>
                <button
                  ref={filterBtnRef}
                  type="button"
                  className="gr-btn gr-sm gr-ftoggle"
                  aria-expanded={panelOpen}
                  aria-controls="gr-fpanel"
                  onClick={() => setPanelOpen(o => !o)}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                    <path d="M4 6h16M7 12h10M10 18h4" />
                  </svg>
                  Filters {filterCount > 0 && <span className="gr-fn">{filterCount}</span>}
                </button>
              </div>

              <div className="gr-lhr">
                <button
                  type="button"
                  className="gr-btn gr-sm gr-quiet"
                  onClick={() => (allOpen ? collapseAll() : expandAll())}
                >
                  {allOpen ? 'Collapse all' : 'Expand all'}
                </button>
                {!readOnly && canPublish && (
                  <button
                    type="button"
                    className="gr-btn gr-sm gr-primary"
                    disabled={readyToPublishInView === 0}
                    title={readyToPublishInView > 0 ? '' : 'Nothing is generated and waiting to publish'}
                    onClick={() => ask('pub', 'all')}
                  >
                    <Icon name="pub" />Publish all
                  </button>
                )}
              </div>

              {/* Filters Dropdown Panel */}
              {panelOpen && (
                <div ref={panelRef} id="gr-fpanel" className="gr-fpanel" role="dialog" aria-label="Filters">
                  <h3>Filter results</h3>
                  <div className="gr-fgrid">
                    <div className="gr-f">
                      <label>Programme</label>
                      <SearchSelect
                        options={programOptions}
                        value={filters.programGuid}
                        onChange={v => setFilter('programGuid', v)}
                      />
                    </div>
                    <div className="gr-f">
                      <label>Semester</label>
                      <SearchSelect
                        options={semesterOptions}
                        value={filters.semesterGuid}
                        onChange={v => setFilter('semesterGuid', v)}
                        disabled={!filters.programGuid}
                      />
                    </div>
                    <div className="gr-f">
                      <label>Batch</label>
                      <SearchSelect
                        options={batchOptions}
                        value={filters.batchGuid}
                        onChange={v => setFilter('batchGuid', v)}
                        disabled={!filters.semesterGuid}
                      />
                    </div>
                    <div className="gr-f">
                      <label>Status</label>
                      <SearchSelect
                        options={statusOptions}
                        value={filters.status}
                        onChange={v => setFilter('status', v as '' | BatchResultStatus)}
                      />
                    </div>
                  </div>
                  <div className="gr-pfoot">
                    <button type="button" className="gr-btn gr-quiet" onClick={clearFilters}>
                      Clear all
                    </button>
                    <button
                      type="button"
                      className="gr-btn gr-primary"
                      onClick={() => {
                        setPanelOpen(false)
                        filterBtnRef.current?.focus()
                      }}
                    >
                      Show results
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Filter Chips */}
            {chips.length > 0 && (
              <div className="gr-chips">
                {chips.map(c => (
                  <span key={c.k} className="gr-chip">
                    {c.label}
                    <button
                      type="button"
                      aria-label={`Remove filter ${c.label}`}
                      onClick={() => setFilter(c.k, '' as never)}
                    >
                      &times;
                    </button>
                  </span>
                ))}
                {chips.length > 1 && (
                  <button type="button" className="gr-btn gr-sm gr-quiet gr-chip-clear" onClick={clearFilters}>
                    Clear all
                  </button>
                )}
              </div>
            )}

            {/* Tree Table */}
            <div className="gr-cols gr-grid">
              <span>Programme / Semester / Batch</span>
              <span>Students</span>
              <span>Status</span>
              {!readOnly && <span className="gr-r">Actions</span>}
            </div>

            <div className="gr-tree">
              {shownBatchesCount > 0 ? (
                treeRows
              ) : statusQ.isFetching ? (
                <div className="gr-empty" style={{ padding: '40px 20px' }}>
                  <LoadingState
                    title="Updating results…"
                    subtitle="Fetching data for the selected filters, just a moment."
                    style={{ padding: '0' }}
                  />
                </div>
              ) : (
                <div className="gr-empty">
                  <b>No batches match these filters</b>
                  Try removing a filter to see more results.<br />
                  <button type="button" className="gr-btn gr-sm" onClick={clearFilters}>
                    Clear filters
                  </button>
                </div>
              )}
            </div>
          </section>
        </>
      )}

      {/* Confirmation Dialog */}
      {confirmDialog}

      {/* Action Outcome (Skipped Batches / Warnings) Modal */}
      {actionOutcomeModal && (
        <div className="gr-modal">
          <div className="gr-dlg" role="dialog" aria-modal="true" aria-labelledby="gr-om-t" style={{ maxWidth: '540px' }}>
            <h3 id="gr-om-t">Action Results</h3>
            <p>
              <b>{actionOutcomeModal.changed}</b> {plural(actionOutcomeModal.changed, 'batch', 'batches')} changed,{' '}
              <b>{actionOutcomeModal.skippedCount}</b> {plural(actionOutcomeModal.skippedCount, 'batch', 'batches')} skipped.
            </p>

            {actionOutcomeModal.skipped.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6, color: '#344054' }}>
                  Skipped Batches:
                </div>
                <div className="gr-box" style={{ maxHeight: 200, overflow: 'auto' }}>
                  <ul>
                    {actionOutcomeModal.skipped.map((s, idx) => (
                      <li key={idx} style={{ padding: '8px 12px', borderBottom: '1px solid var(--gr-line)' }}>
                        <div style={{ fontWeight: 500, color: '#101828' }}>
                          {s.programCode ? `${s.programCode} · ` : ''}{s.semesterName ? `${s.semesterName} · ` : ''}{s.batchCode}
                        </div>
                        <div style={{ fontSize: 12, color: '#d92d20', marginTop: 2 }}>
                          {s.reason}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {actionOutcomeModal.warnings && actionOutcomeModal.warnings.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6, color: '#b54708' }}>
                  Warnings:
                </div>
                <div className="gr-box" style={{ maxHeight: 160, overflow: 'auto' }}>
                  <ul>
                    {actionOutcomeModal.warnings.map((w, idx) => {
                      const text = typeof w === 'string'
                        ? w
                        : `${w.unitCode ? w.unitCode + ': ' : ''}${w.message}${w.rowCount ? ` (${w.rowCount} rows)` : ''}`
                      return (
                        <li key={idx} style={{ padding: '6px 12px', fontSize: 12, color: '#b54708' }}>
                          {text}
                        </li>
                      )
                    })}
                  </ul>
                </div>
              </div>
            )}

            <div className="gr-dfoot">
              <button
                type="button"
                className="gr-btn gr-primary"
                onClick={() => setActionOutcomeModal(null)}
                autoFocus
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      <div className={`gr-toast${toast.on ? ' gr-on' : ''}`} role="status" aria-live="polite">
        <Icon name="ok" />
        {toast.msg}
      </div>
    </div>
  )
}
