'use client'
import { useEffect, useMemo, useState } from 'react'
import { ScrollTable } from '@/components/ScrollTable'
import { ActionMenu } from '@/components/ActionMenu'
import { TableSearch } from '@/components/TableSearch'
import { FilterTh } from '@/components/FilterTh'
import { BatchFormModal } from '@/components/modals/academic/BatchFormModal'
import { ViewBatchModal } from '@/components/modals/academic/ViewBatchModal'
import { Toast } from '@/components/Toast'
import { EmptyState } from '@/components/EmptyState'
import { TableLoadingState } from '@/components/TableLoadingState'
import { Pagination } from '@/components/Pagination'
import { useBatchFilterOptions, useCreateBatch, useFilteredBatches, useUpdateBatch, useDeleteBatch, useBatchStudentCount, Batch } from '@/hooks/academic/useBatches'
import { useEmployeeDropdown } from '@/hooks/employee/useEmployees'
import { usePagePermissions } from '@/hooks/users/usePagePermissions'
import { SearchSelect } from '@/components/SearchSelect'
import { useIntakesDropdown } from '@/hooks/academic/useIntakes'
import { useCampusDropdown } from '@/hooks/config/useCampuses'
import { IntakeDropdownItem } from '@/lib/api/academic/intake'
import { EMPTY_GUID, type BatchColumnFilters } from '@/lib/api/academic/batch'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// bStartDate/bEndDate come back as "2024-02-12T00:00:00" — display as
// "12 Feb 2024" rather than the raw ISO date.
function formatDisplayDate(dateStr?: string | null) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

// Fallback label when a row has no semesterName: semCode counts semesters
// across the whole programme (1, 2, 3…), two per year.
function semesterLabelFromCode(semCode: number): string {
  const year = Math.ceil(semCode / 2)
  const sem = semCode % 2 === 0 ? 2 : 1
  return `Year ${year} - Semester ${sem}`
}

function semesterName(r: Batch) {
  return r.semesterName || (r.semCode ? semesterLabelFromCode(r.semCode) : '—')
}

interface FilterOpt { value: string; label: string }

// The "None" program-head option (sends noProgramHead=true).
const NO_HEAD = '__no_program_head__'

function uniqueLabels(opts: FilterOpt[]): FilterOpt[] {
  const count = new Map<string, number>()
  for (const o of opts) count.set(o.label, (count.get(o.label) ?? 0) + 1)
  return opts.map(o => (count.get(o.label)! > 1 ? { ...o, label: `${o.label} (${o.value.slice(0, 8)})` } : o))
}

function useDebounced<T>(value: T, ms: number): T {
  const [v, setV] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return v
}

// 10 rows/page — same convention as the other master pages (Intake
// Master, Programme Group, Repetition Tag).
const PAGE_SIZE = 10
// Don't narrow the table (or open the search dropdown) until the user's
// typed at least this many characters — same convention as Intake Master /
// Skill Master's search boxes.
const MIN_SEARCH_CHARS = 2

// Batch Summary was merged into this page (2026-10-21), and its Head Count
// tab into the one batch table (2026-10-28): head count is a column there,
// and the stat tiles total the whole campus + intake scope.
// /academic/batch-summary redirects here.
export default function Page() {
  const permissions = usePagePermissions()
  const [openModals, setOpenModals] = useState<Set<string>>(new Set())
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [editingBatchGuid, setEditingBatchGuid] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Batch | null>(null)
  const [filters, setFilters] = useState<Record<string, FilterOpt[]>>({})
  const [openFilter, setOpenFilter] = useState<string | null>(null)

  // ---- Scope: campus + intake ----
  // GET /academic/batches lists one intake at a time; no intake = the current
  // admission intake (the endpoint's default — it has no 'all intakes'). A
  // batch from an older intake shows up here when it has a session in the
  // listed one.
  const [campusGuid, setCampusGuid] = useState('')
  const [intakeGuid, setIntakeGuid] = useState('')
  const { data: campuses = [] } = useCampusDropdown()
  const { data: intakes = [], isLoading: isIntakesLoading } = useIntakesDropdown()
  const intakeOptions = useMemo(() => [
    { value: '', label: 'Current Intake' },
    ...intakes.map((i: IntakeDropdownItem) => ({ value: i.intakeGuid, label: `${i.intakeCode} — ${i.description}` })),
  ], [intakes])
  const scopeLabel = [
    campusGuid ? (campuses.find(c => c.campusGuid === campusGuid)?.campusName ?? 'This campus') : 'All campuses',
    intakeGuid ? 'Selected intake' : 'Current intake',
  ].join(' · ')

  function isSet(guid?: string | null) {
    return !!guid && guid !== EMPTY_GUID
  }
  function employeeName(name?: string | null, guid?: string | null) {
    if (name?.trim()) return name.trim()
    if (!isSet(guid)) return '—'
    return employees.find(e => e.employeeGuid === guid)?.displayName || '—'
  }

  // ---- Search, column filters and paging: all server-side ----
  // GET /academic/batches takes the search and the Excel-style multi-select
  // column filters; GET /batches/filter-options returns each column's
  // options for the same search + scope + filters (each column ignores its
  // own selection, so picking one value never hides its siblings). The
  // selections are kept as {value, label} so the API gets guids/codes and
  // the filter shows names. Start/End Date have no list filter, so they're
  // plain columns; Status maps to `active`.
  const searchTrimmed = search.trim()
  const debouncedSearch = useDebounced(searchTrimmed.length >= MIN_SEARCH_CHARS ? searchTrimmed : '', 300)
  const scope = useMemo(() => ({ campusGuid: campusGuid || null, intakeGuid: intakeGuid || null }), [campusGuid, intakeGuid])
  const apiFilters = useMemo<BatchColumnFilters>(() => {
    const v = (col: string) => (filters[col] ?? []).map(o => o.value)
    const heads = v('pHead')
    const status = v('status')
    return {
      batchCodes: v('batchCode'),
      programGuids: v('programme'),
      semCodes: v('semester').map(Number),
      streamGuids: v('stream'),
      batchTimeGuids: v('batchTime'),
      bInChargeGuids: v('inCharge'),
      pHeadGuids: heads.filter(h => h !== NO_HEAD),
      noProgramHead: heads.includes(NO_HEAD) || undefined,
      active: status.length === 1 ? (Number(status[0]) as 0 | 1) : undefined,
    }
  }, [filters])
  const listQ = useFilteredBatches(page, PAGE_SIZE, debouncedSearch, scope, apiFilters)
  const optionsQ = useBatchFilterOptions(debouncedSearch, scope, apiFilters)

  const pageItems = listQ.data?.items ?? []
  const totalCount = listQ.data?.totalCount ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const hasColumnFilters = Object.values(filters).some(v => v.length > 0)
  const refetching = listQ.isPlaceholderData

  // No scope-wide fetch any more (it pulled every batch at pageSize 10000):
  // Total Batches is the list's own totalCount; Total Students and Avg Batch
  // Size need head counts across every batch, so they show "—" until the
  // backend returns totals (requested: e.g. totalStudents on GET /batches).
  const totalBatches = listQ.data ? totalCount : null

  // bInChargeName/pHeadName come pre-resolved on the row; the employee list
  // is only fetched if a row on this page has a guid without its name.
  const needsEmployeeLookup = pageItems.some(r => (isSet(r.bInCharge) && !r.bInChargeName) || (isSet(r.pHead) && !r.pHeadName))
  const { data: employees = [] } = useEmployeeDropdown(needsEmployeeLookup)

  // Live preview in the search dropdown — the server's matches for the
  // current search (already applied to the list), capped to a handful.
  const activeSearch = searchTrimmed.length >= MIN_SEARCH_CHARS
  const searchMatches = activeSearch && debouncedSearch === searchTrimmed ? pageItems.slice(0, 8) : []

  // Each column's options from filter-options, as {value, label}. Labels must
  // be unique (FilterTh works on labels), so repeats get a short id suffix.
  const columnOpts = useMemo<Record<string, FilterOpt[]>>(() => {
    const o = optionsQ.data
    if (!o) return {} as Record<string, FilterOpt[]>
    const person = (e: { employeeGuid: string; employeeName: string | null }) => ({ value: e.employeeGuid, label: e.employeeName?.trim() || 'Unknown' })
    return {
      batchCode: o.batchCodes.map(c => ({ value: c, label: c })),
      programme: uniqueLabels(o.programs.map(p => ({ value: p.programGuid, label: p.programName?.trim() || p.programCode || 'Unnamed programme' }))),
      semester: o.semesters.map(s => ({ value: String(s.semCode), label: s.semesterName?.trim() || semesterLabelFromCode(s.semCode) })),
      stream: uniqueLabels(o.streams.map(s => ({ value: s.streamGuid, label: s.streamName?.trim() || 'Unnamed' }))),
      batchTime: uniqueLabels(o.batchTimes.map(t => ({ value: t.batchTimeGuid, label: t.batchTimeName?.trim() || t.batchTimeCode || 'Unnamed' }))),
      inCharge: uniqueLabels(o.batchInCharges.map(person)),
      pHead: [...(o.hasBatchesWithoutProgramHead ? [{ value: NO_HEAD, label: 'None' }] : []), ...uniqueLabels(o.programHeads.map(person))],
      status: [{ value: '1', label: 'Active' }, { value: '0', label: 'Inactive' }],
    }
  }, [optionsQ.data])

  function fth(label: string, col: string) {
    const selected = filters[col] ?? []
    const available = columnOpts[col] ?? []
    // A selection the other filters have since narrowed away stays listed,
    // so it can still be unticked.
    const all = [...available, ...selected.filter(s => !available.some(a => a.value === s.value))]
    return (
      <FilterTh
        label={label}
        opts={all.map(o => o.label)}
        isOpen={openFilter === col}
        activeFilter={selected.map(o => o.label)}
        onToggle={(e) => { e.stopPropagation(); setOpenFilter(p => p === col ? null : col) }}
        onSelect={(labels) => {
          const picked = labels.map(l => all.find(o => o.label === l)).filter((o): o is FilterOpt => !!o)
          setFilters(f => ({ ...f, [col]: picked })); setOpenFilter(null); setPage(1)
        }}
        onClear={() => { setFilters(f => ({ ...f, [col]: [] })); setOpenFilter(null); setPage(1) }}
        onClose={() => setOpenFilter(null)}
      />
    )
  }
  // ScrollTable's "filters applied" bar reads labels.
  const filterLabels = useMemo(() => Object.fromEntries(Object.entries(filters).map(([c, v]) => [c, v.map(o => o.label)])), [filters])

  const createBatch = useCreateBatch()
  const updateBatch = useUpdateBatch()
  const deleteBatch = useDeleteBatch()

  function openModal(id: string) { setOpenModals(prev => new Set(prev).add(id)) }
  function closeModal(id: string) { setOpenModals(prev => { const s = new Set(prev); s.delete(id); return s }) }
  function showToast(msg: string, type = '') { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }

  function openEditModal(guid: string) {
    setEditingBatchGuid(guid)
    openModal('edit-batch-modal')
  }

  function openViewModal(guid: string) {
    setEditingBatchGuid(guid)
    openModal('view-batch-modal')
    setSearch('')
  }

  // Same as the other Academic tables: clears search and column filters.
  // The campus + intake scope stays — it's the page's context, not a filter.
  function clearFilters() {
    setSearch('')
    setFilters({})
    setPage(1)
  }

  // Scoped to just the batch being deleted (enabled only while the dialog is
  // open), so the confirmation can warn when students are still in it.
  const { data: deleteTargetStudentCount } = useBatchStudentCount(deleteTarget?.batchGuid ?? null, !!deleteTarget)

  function confirmDeleteBatch() {
    if (!deleteTarget) return
    deleteBatch.mutate(deleteTarget.batchGuid, {
      onSuccess: () => { setDeleteTarget(null); showToast('Batch deleted successfully', 'success') },
      onError: (error: Error) => showToast(error.message || 'Failed to delete batch', 'danger'),
    })
  }

  return (
    <>
      <div className="page active" id="page-batch-management">
        <div className="pg-hdr">
          <div><div className="pg-title">Batch Management</div><div className="pg-sub">Create batches per intake · Assign Batch In-Charge · Track head counts</div></div>
          <div className="flex items-center gap-3">
            {permissions.add && <button className="btn btn-primary" onClick={() => openModal('new-batch-modal')}><i className="lni lni-plus"></i> Create Batch</button>}
          </div>
        </div>

        {/* Scope for the whole page: stat tiles and the table. */}
        <div className="flex items-center gap-2 flex-wrap mb-3">
          <span className="text-sm font-semibold text-g600">Showing batches for</span>
          <SearchSelect
            style={{ width: 200 }}
            placeholder="All Campuses"
            options={campuses.map(c => ({ value: c.campusGuid, label: c.campusName }))}
            value={campusGuid}
            onChange={v => { setCampusGuid(v); setFilters({}); setPage(1) }}
          />
          <SearchSelect
            style={{ width: 220 }}
            placeholder="Current Intake"
            options={intakeOptions}
            value={intakeGuid}
            isLoading={isIntakesLoading}
            onChange={v => { setIntakeGuid(v); setFilters({}); setPage(1) }}
          />
        </div>

        <div className="stats-row" style={{ opacity: refetching ? 0.45 : 1, transition: 'opacity .15s ease' }}>
          <div className="stat-card"><div className="stat-lbl">Total Batches</div><div className="stat-num" style={{ color: 'var(--b700)' }}>{totalBatches != null ? totalBatches.toLocaleString() : '—'}</div><div className="stat-sub">{hasColumnFilters || debouncedSearch ? `${scopeLabel} · filtered` : scopeLabel}</div></div>
          <div className="stat-card [--b700:var(--green)] [--b400:#34d399]"><div className="stat-lbl">Total Students</div><div className="stat-num" style={{ color: 'var(--green)' }}>—</div><div className="stat-sub" title="Needs a total from the batches API">Not available yet</div></div>
          <div className="stat-card"><div className="stat-lbl">Avg Batch Size</div><div className="stat-num">—</div><div className="stat-sub" title="Needs a total from the batches API">Not available yet</div></div>
        </div>

        <div className="card">
          <div className="flex items-center justify-end mb-4">
            <TableSearch
              className="w-64"
              placeholder="Search batch, programme…"
              value={search}
              onChange={v => { setSearch(v); setPage(1) }}
              results={searchMatches.map(r => ({ id: r.batchGuid, primary: r.batchCode, secondary: r.programName ?? '' }))}
              minChars={MIN_SEARCH_CHARS}
              onSelect={(r) => openViewModal(r.id)}
            />
          </div>
          <div className={`tbl-refetch-wrap${refetching ? ' is-refetching' : ''}`} aria-busy={refetching}>
            {refetching && (
              <div className="tbl-refetch-pill" role="status">
                <i className="lni lni-reload" aria-hidden="true" /> Loading batches…
              </div>
            )}
            <ScrollTable filters={filterLabels} onResetFilters={() => { setFilters({}); setPage(1) }}>
              <table>
                <thead>
                  <tr>
                    <th style={{ width: 48 }}></th>
                    <th style={{ width: 56 }}>Sl. No</th>
                    {fth('Batch Code', 'batchCode')}
                    {fth('Programme', 'programme')}
                    {fth('Semester', 'semester')}
                    {fth('Specialization', 'stream')}
                    {fth('Batch Time', 'batchTime')}
                    {fth('Batch In-Charge', 'inCharge')}
                    {fth('Programme Head', 'pHead')}
                    <th>Head Count</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    {fth('Status', 'status')}
                  </tr>
                </thead>
                <tbody>
                  {listQ.isLoading
                    ? <TableLoadingState colSpan={13} />
                    : listQ.isError
                      ? <tr><td colSpan={13} className="tbl-empty-cell"><div className="tbl-empty-inner" role="alert"><div className="tbl-empty-title">Couldn&apos;t load batches</div><button className="btn btn-neu btn-sm" onClick={() => listQ.refetch()}><i className="lni lni-reload"></i> Retry</button></div></td></tr>
                    : pageItems.length === 0
                      ? <EmptyState colSpan={13} hasFilters={!!searchTrimmed || hasColumnFilters} onClearFilters={clearFilters} />
                      : pageItems.map((r, i) => {
                        const slNo = (safePage - 1) * PAGE_SIZE + i + 1
                        return (
                          // batchGuid alone isn't a safe key — a live response
                          // has been seen leaving it blank/duplicated across
                          // rows; the serial number is always unique.
                          <tr key={`${r.batchGuid || 'row'}-${slNo}`}>
                            <td>
                              <ActionMenu>
                                <button className="btn btn-neu btn-sm" onClick={() => openViewModal(r.batchGuid)}><i className="lni lni-eye"></i> View</button>
                                {permissions.edit && <button className="btn btn-neu btn-sm" onClick={() => openEditModal(r.batchGuid)}><i className="lni lni-pencil"></i> Edit</button>}
                                {permissions.delete && <button className="btn btn-neu btn-sm" onClick={() => setDeleteTarget(r)}><i className="lni lni-trash-can"></i> Delete</button>}
                              </ActionMenu>
                            </td>
                            <td className="text-g500 tabular-nums">{slNo}</td>
                            <td><span className="font-bold text-blue tabular-nums">{r.batchCode || '—'}</span></td>
                            <td>{r.programName || '—'}</td>
                            <td>{semesterName(r)}</td>
                            <td>{r.streamName || '—'}</td>
                            <td>{r.batchTimeName || '—'}</td>
                            <td>{employeeName(r.bInChargeName, r.bInCharge)}</td>
                            <td>{employeeName(r.pHeadName, r.pHead)}</td>
                            <td className="tabular-nums font-semibold">{r.headCount ?? 0}</td>
                            <td className="text-sm text-g600">{formatDisplayDate(r.bStartDate)}</td>
                            <td className="text-sm text-g600">{formatDisplayDate(r.bEndDate)}</td>
                            <td><span className={`badge ${r.active ? 'badge-green' : 'badge-grey'}`}>{r.active ? 'Active' : 'Inactive'}</span></td>
                          </tr>
                        )
                      })}
                </tbody>
              </table>
            </ScrollTable>
          </div>

          <Pagination page={safePage} totalPages={totalPages} totalCount={totalCount} itemLabel="batches" onPageChange={setPage} />
        </div>
      </div>
      {openModals.has('new-batch-modal') && (
        <BatchFormModal
          mode="new"
          isOpen
          onClose={() => closeModal('new-batch-modal')}
          showToast={showToast}
          batchGuid={null}
          createBatch={createBatch}
          updateBatch={updateBatch}
        />
      )}
      {openModals.has('edit-batch-modal') && (
        <BatchFormModal
          mode="edit"
          isOpen
          onClose={() => closeModal('edit-batch-modal')}
          showToast={showToast}
          batchGuid={editingBatchGuid}
          createBatch={createBatch}
          updateBatch={updateBatch}
        />
      )}
      {openModals.has('view-batch-modal') && (
        <ViewBatchModal canEdit={permissions.edit} onEdit={() => { closeModal('view-batch-modal'); openEditModal(editingBatchGuid || '') }}
          isOpen
          onClose={() => closeModal('view-batch-modal')}
          showToast={showToast}
          batchGuid={editingBatchGuid}
        />
      )}
      <Toast toast={toast} />

      {deleteTarget && (
        <div className="perm-delete-overlay" style={{ position: 'fixed', zIndex: 500 }} onClick={() => setDeleteTarget(null)}>
          <div className="perm-delete-card tab-panel-in" onClick={e => e.stopPropagation()}>
            <div className="perm-delete-icon"><i className="lni lni-trash-can"></i></div>
            <div className="perm-delete-title">Delete {deleteTarget.batchCode}?</div>
            <div className="perm-delete-sub">
              This will permanently delete this batch. This can&apos;t be undone.
            </div>
            {!!deleteTargetStudentCount && (
              <div className="warn-box mt-2 mb-1" style={{ textAlign: 'left' }}>
                <i className="lni lni-warning" style={{ color: 'var(--amber)', fontSize: 15, flexShrink: 0, marginTop: 1 }}></i>
                <div>
                  {deleteTargetStudentCount} student{deleteTargetStudentCount !== 1 ? 's are' : ' is'} currently enrolled in this batch. Deleting it won&apos;t remove them, but they&apos;ll be left without a valid batch.
                </div>
              </div>
            )}
            <div className="perm-delete-actions">
              <button className="btn btn-neu" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="btn btn-danger" disabled={deleteBatch.isPending} onClick={confirmDeleteBatch}>
                <i className="lni lni-trash-can"></i> {deleteBatch.isPending ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
