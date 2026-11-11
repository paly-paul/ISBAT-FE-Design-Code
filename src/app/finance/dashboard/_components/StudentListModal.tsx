'use client'
import { useEffect, useMemo, useState } from 'react'
import type { UseQueryResult } from '@tanstack/react-query'
import { ScrollTable } from '@/components/ScrollTable'
import { SearchSelect } from '@/components/SearchSelect'
import { MultiSelect } from '@/components/MultiSelect'
import { Pagination } from '@/components/Pagination'
import { useReportScopeOptions } from '@/hooks/finance/useReportScopeOptions'
import { useDashboardBlockedStudents, useDashboardClearedStudents } from '@/hooks/finance/useFinanceDashboard'
import { fmtReportAmount, fmtReportCount, reportErrorMessage } from '@/lib/reportFormat'
import type {
  DashboardBlockedStudent, DashboardBlockedStudents, DashboardClearedStudent, DashboardClearedStudents, DashboardStudentListParams,
} from '@/lib/api/finance/dashboard'

// Drill-down behind the Students Fully Cleared and Access Blocked cards
// (finance-dashboard-page.md). Filters and pages re-call only this list; the
// cards are left alone. No polling: it loads on open and on filter changes.

export type StudentListKind = 'cleared' | 'blocked'

const PAGE_SIZE = 15
const SEARCH_DEBOUNCE_MS = 400

// The three statuses the lists cover. Nothing ticked = all three (the API default).
const STATUS_OPTIONS = [
  { value: '1', label: 'Registered' },
  { value: '2', label: 'Yet to Register' },
  { value: '4', label: 'Yet to Clear' },
]

interface Filters {
  campusGuid: string
  programGuid: string
  semesterGuids: string[]
  batchGuids: string[]
  regStatuses: string[]
}
const NO_FILTERS: Filters = { campusGuid: '', programGuid: '', semesterGuids: [], batchGuids: [], regStatuses: [] }

function useDebounced<T>(value: T, ms: number): T {
  const [v, setV] = useState(value)
  useEffect(() => { const t = setTimeout(() => setV(value), ms); return () => clearTimeout(t) }, [value, ms])
  return v
}

// "2026-11-11T14:32:32.8" (local business time) → "14:32".
function hhmm(local: string | null | undefined) { return local && local.length >= 16 ? local.slice(11, 16) : '—' }

// One line per currency inside an amount cell; amounts are never added across currencies.
function CurrencyLines<A extends { currencyCode: string }>({ amounts, field, strong }: { amounts: A[]; field: keyof A; strong?: boolean }) {
  if (!amounts.length) return <span className="text-muted">—</span>
  return (
    <>
      {amounts.map(a => (
        <div key={a.currencyCode} className="rpt-line">
          <span className={strong ? 'rpt-amt' : undefined}>{fmtReportAmount(Number(a[field]))}</span><span className="rpt-cur">{a.currencyCode}</span>
        </div>
      ))}
    </>
  )
}

function Student({ s }: { s: { studentName: string; studentNumber: string } }) {
  return (
    <>
      <strong>{s.studentName}</strong>
      <div className="text-muted font-mono text-[length:var(--fs-xs)]">{s.studentNumber}</div>
    </>
  )
}

// Clearance for a blocked student (0–49): the figure plus a short bar, so the
// lowest stand out going down the list.
function Clearance({ value, below }: { value: number; below: number }) {
  return (
    <div className="fd-sl-clr" title={`${value}% cleared · blocked below ${below}%`}>
      <span className="tabular-nums">{value}%</span>
      <span className="fd-sl-clr-track" aria-hidden="true"><span style={{ width: `${Math.min(100, (value / below) * 100)}%` }} /></span>
    </div>
  )
}

export function StudentListModal({ kind, intakeGuid, intakeLabel, onClose }: {
  kind: StudentListKind
  intakeGuid: string
  intakeLabel: string
  onClose: () => void
}) {
  const [filters, setFilters] = useState<Filters>(NO_FILTERS)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounced(search.trim(), SEARCH_DEBOUNCE_MS)

  // The page belongs to one set of filters: when they change it reads as 1
  // straight away, so the slow list isn't requested for the old page first.
  const filterKey = JSON.stringify([filters, debouncedSearch])
  const [pageState, setPageState] = useState({ key: filterKey, page: 1 })
  const page = pageState.key === filterKey ? pageState.page : 1
  const setPage = (p: number) => setPageState({ key: filterKey, page: p })

  const { campusesQuery, programsQuery, semestersQuery, batchesQuery, campusOptions, programOptions, semesterOptions, batchOptions } =
    useReportScopeOptions(filters.campusGuid, filters.programGuid, filters.semesterGuids)

  // Drop batches that are no longer listed once the semesters change.
  useEffect(() => {
    if (!batchesQuery.data) return
    const listed = new Set(batchesQuery.data.map(b => b.batchGuid))
    setFilters(prev => (prev.batchGuids.every(g => listed.has(g)) ? prev : { ...prev, batchGuids: prev.batchGuids.filter(g => listed.has(g)) }))
  }, [batchesQuery.data])

  const params: DashboardStudentListParams = useMemo(() => ({
    intakeGuid,
    campusGuid: filters.campusGuid || undefined,
    programGuid: filters.programGuid || undefined,
    semesterGuids: filters.semesterGuids.length ? filters.semesterGuids : undefined,
    batchGuids: filters.batchGuids.length ? filters.batchGuids : undefined,
    regStatuses: filters.regStatuses.length ? filters.regStatuses.map(Number).sort() : undefined,
    search: debouncedSearch || undefined,
    pageNumber: page,
    pageSize: PAGE_SIZE,
  }), [intakeGuid, filters, debouncedSearch, page])

  const clearedQ = useDashboardClearedStudents(params, kind === 'cleared')
  const blockedQ = useDashboardBlockedStudents(params, kind === 'blocked')
  const query = (kind === 'cleared' ? clearedQ : blockedQ) as UseQueryResult<DashboardClearedStudents | DashboardBlockedStudents>
  const data = query.data
  const blocked = kind === 'blocked' ? (data as DashboardBlockedStudents | undefined) : undefined

  // Scope filters fold away under the Filters button; its badge says how many are set.
  const [filtersOpen, setFiltersOpen] = useState(false)
  const activeFilterCount = [filters.campusGuid, filters.programGuid, filters.semesterGuids.length, filters.batchGuids.length, filters.regStatuses.length].filter(Boolean).length
  const filtered = activeFilterCount > 0 || !!debouncedSearch
  function clearAll() { setFilters(NO_FILTERS); setSearch('') }
  function set<K extends keyof Filters>(k: K, v: Filters[K]) { setFilters(prev => ({ ...prev, [k]: v })) }

  const totalPages = data ? Math.max(1, Math.ceil(data.totalCount / (data.pageSize || PAGE_SIZE))) : 1
  const base = data?.baseCurrencyCode ?? ''

  const title = kind === 'cleared' ? 'Students Fully Cleared' : 'Access Blocked'
  const icon = kind === 'cleared' ? 'lni-checkmark-circle' : 'lni-lock-alt'

  return (
    <div className="modal-overlay open">
      <div className="modal modal-xl modal-flex" role="dialog" aria-modal="true" aria-labelledby="fd-sl-title" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr modal-hdr-blue">
          <div className="modal-title" id="fd-sl-title">
            <i className={`lni ${icon}`} aria-hidden="true"></i> {title}
            {blocked && <span className="fd-sl-hdr-note">below {blocked.blockedBelowPercent}% clearance</span>}
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close"><i className="lni lni-close"></i></button>
        </div>

        {/* Toolbar: search always visible; the scope filters fold away so the list keeps the height. */}
        <div className="fd-sl-toolbar">
          <div className="fd-sl-search-box">
            <i className="lni lni-search-alt" aria-hidden="true" />
            <input className="ctrl" type="search" aria-label="Search students" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, reg no or student number" />
          </div>
          <button type="button" className={`btn btn-neu fd-sl-filter-btn${filtersOpen ? ' open' : ''}`} aria-expanded={filtersOpen} aria-controls="fd-sl-filters" onClick={() => setFiltersOpen(o => !o)}>
            <i className="lni lni-funnel" aria-hidden="true" /> Filters
            {activeFilterCount > 0 && <span className="badge badge-blue" aria-label={`${activeFilterCount} active`}>{activeFilterCount}</span>}
            <i className={`lni lni-chevron-down fd-sl-chev`} aria-hidden="true" />
          </button>
          {filtered && <button type="button" className="fd-link" onClick={clearAll}>Clear all</button>}
        </div>
        {filtersOpen && (
        <div className="fd-sl-filters" id="fd-sl-filters">
          <div className="fd-sl-field">
            <label className="lbl">Campus</label>
            <SearchSelect placeholder="All campuses" options={campusOptions} value={filters.campusGuid}
              onChange={v => setFilters(prev => ({ ...prev, campusGuid: v, programGuid: '', semesterGuids: [], batchGuids: [] }))}
              isLoading={campusesQuery.isLoading} />
          </div>
          <div className="fd-sl-field">
            <label className="lbl">Programme</label>
            <SearchSelect placeholder={filters.campusGuid ? 'All programmes' : 'Choose a campus first'} options={programOptions} value={filters.programGuid}
              onChange={v => setFilters(prev => ({ ...prev, programGuid: v, semesterGuids: [], batchGuids: [] }))}
              disabled={!filters.campusGuid} isLoading={programsQuery.isFetching} />
          </div>
          <div className="fd-sl-field">
            <label className="lbl">Semesters</label>
            <MultiSelect placeholder={filters.programGuid ? 'All semesters' : 'Choose a programme first'} options={semesterOptions} value={filters.semesterGuids}
              onChange={v => setFilters(prev => ({ ...prev, semesterGuids: v, batchGuids: v.length ? prev.batchGuids : [] }))}
              disabled={!filters.programGuid} isLoading={semestersQuery.isFetching} />
          </div>
          <div className="fd-sl-field">
            <label className="lbl">Batches</label>
            <MultiSelect placeholder={filters.semesterGuids.length ? 'All batches' : 'Choose a semester first'} options={batchOptions} value={filters.batchGuids}
              onChange={v => set('batchGuids', v)} disabled={!filters.semesterGuids.length} isLoading={batchesQuery.isFetching} />
          </div>
          <div className="fd-sl-field">
            <label className="lbl">Registration status</label>
            <MultiSelect placeholder="All three statuses" options={STATUS_OPTIONS} value={filters.regStatuses} onChange={v => set('regStatuses', v)} />
          </div>
        </div>
        )}

        {/* Summary: how many, and what they add up to (whole filtered list, …InBase only). */}
        <div className="fd-sl-summary" role="status">
          <span className="fd-sl-count">
            <span className="fd-sl-count-main">
              {data ? (
                <><strong>{fmtReportCount(data.totalCount)}</strong> {data.totalCount === 1 ? 'student' : 'students'}{filtered ? ' match' : ''}</>
              ) : 'Loading…'}
            </span>
            <span className="fd-sl-count-sub">{intakeLabel}{blocked && ' · lowest clearance first'}</span>
          </span>
          {data && data.totalCount > 0 && (
            <dl className="fd-sl-stats" title={`Totals for all ${fmtReportCount(data.totalCount)} ${filtered ? 'matching ' : ''}students, in ${base}`}>
              <div><dt>Fee</dt><dd>{fmtReportAmount(data.totalFeeInBase)}</dd></div>
              <div><dt>Discount</dt><dd>{fmtReportAmount(data.totalDiscountInBase)}</dd></div>
              <div><dt>Collected</dt><dd>{fmtReportAmount(data.totalCollectedInBase)}</dd></div>
              {blocked && <div className="fd-sl-owed"><dt>Total owed</dt><dd>{fmtReportAmount(blocked.totalOutstandingInBase)}</dd></div>}
              <span className="fd-sl-stats-cur">{base}</span>
            </dl>
          )}
        </div>
        {data?.hasMissingRates && (
          <div className="fd-sl-warn" role="status">
            <i className="lni lni-warning" aria-hidden="true" /> Some amounts have no exchange rate, so the {base} totals leave them out.
          </div>
        )}

        {/* List */}
        {/* The table fills the rest of the modal and scrolls inside itself, so the
            column headings and the student column stay pinned. */}
        <div className="fd-sl-body">
          {query.isError ? (
            <div className="fd-state fd-state-err" role="alert">
              <i className="lni lni-warning" aria-hidden="true" />
              <span>Couldn’t load the students</span>
              <small>{reportErrorMessage(query.error, 'Something went wrong.')}</small>
              <button className="btn btn-neu btn-sm" onClick={() => query.refetch()}><i className="lni lni-reload" aria-hidden="true" /> Try again</button>
            </div>
          ) : !data ? (
            <div className="fd-state" role="status">
              <i className="lni lni-spinner-arrow spin" aria-hidden="true" />
              <span>Loading students…</span>
              <small>The first load can take a few seconds.</small>
            </div>
          ) : data.items.length === 0 ? (
            <div className="fd-state">
              <i className="lni lni-users" aria-hidden="true" />
              <span>{filtered ? 'No students match these filters' : kind === 'cleared' ? 'No student is fully cleared yet' : 'No student is blocked'}</span>
              {filtered && <button className="btn btn-neu btn-sm" onClick={clearAll}>Clear filters</button>}
            </div>
          ) : (
            <div className={`fd-sl-list${query.isPlaceholderData ? ' fd-busy' : ''}`} aria-busy={query.isPlaceholderData || undefined}>
              <ScrollTable className="fd-sl-table">
                <table>
                  <thead>
                    {kind === 'cleared' ? (
                      <tr><th className="text-left">Student</th><th className="text-left">Programme</th><th className="text-right">Fee</th><th className="text-right">Discount</th><th className="text-right">Collected</th></tr>
                    ) : (
                      <tr>
                        <th className="text-left">Student</th><th className="text-left">Programme</th><th className="text-left">Clearance</th><th className="text-right">Fee</th><th className="text-right">Collected</th>
                        <th className="text-right">This sem.</th><th className="text-right">Earlier</th><th className="text-right">Total owed</th>
                      </tr>
                    )}
                  </thead>
                  <tbody>
                    {kind === 'cleared'
                      ? (data.items as DashboardClearedStudent[]).map(s => (
                        <tr key={s.studentGuid}>
                          <td className="text-left"><Student s={s} /></td>
                          <td className="text-left">{s.programName ?? <span className="text-muted">—</span>}</td>
                          <td className="text-right tabular-nums"><CurrencyLines amounts={s.amounts} field="fee" /></td>
                          <td className="text-right tabular-nums"><CurrencyLines amounts={s.amounts} field="discount" /></td>
                          <td className="text-right tabular-nums"><CurrencyLines amounts={s.amounts} field="collected" strong /></td>
                        </tr>
                      ))
                      : (data.items as DashboardBlockedStudent[]).map(s => (
                        <tr key={s.studentGuid}>
                          <td className="text-left"><Student s={s} /></td>
                          <td className="text-left">{s.programName ?? <span className="text-muted">—</span>}</td>
                          <td className="text-left"><Clearance value={s.clearancePercent} below={blocked?.blockedBelowPercent ?? 50} /></td>
                          <td className="text-right tabular-nums"><CurrencyLines amounts={s.amounts} field="fee" /></td>
                          <td className="text-right tabular-nums"><CurrencyLines amounts={s.amounts} field="collected" /></td>
                          <td className="text-right tabular-nums"><CurrencyLines amounts={s.amounts} field="outstanding" /></td>
                          <td className="text-right tabular-nums"><CurrencyLines amounts={s.amounts} field="previousOutstanding" /></td>
                          <td className="text-right tabular-nums"><CurrencyLines amounts={s.amounts} field="totalOutstanding" strong /></td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </ScrollTable>
            </div>
          )}
        </div>

        {/* One footer: freshness on the left, paging on the right. Closing is the ✕ in the header. */}
        {data && data.totalCount > 0 && (
          <div className="modal-footer fd-sl-footer">
            <span className="fd-sl-asof" title="Recalculated by the server at most every 5 minutes">
              <i className="lni lni-timer" aria-hidden="true" /> As of {hhmm(data.generatedAt)}
            </span>
            {data.totalCount > PAGE_SIZE && (
              <Pagination page={page} totalPages={totalPages} totalCount={data.totalCount} itemLabel="students" onPageChange={setPage} />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
