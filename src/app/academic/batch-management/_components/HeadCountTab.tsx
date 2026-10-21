'use client'
import { useEffect, useState } from 'react'
import { ScrollTable } from '@/components/ScrollTable'
import { EmptyState } from '@/components/EmptyState'
import { TableLoadingState } from '@/components/TableLoadingState'
import { Pagination } from '@/components/Pagination'
import { TableSearch } from '@/components/TableSearch'
import type { BatchSummaryItem } from '@/lib/api/academic/batchSummary'

// The Head Count tab of Batch Management (was the separate Batch Summary
// page, merged 2026-10-21). Rows come from GET /academic/batch-summary,
// fetched by the page so the stat tiles above share the same data.

// The real endpoint returns semCode — a bare int counting semesters
// across the whole programme (1, 2, 3…), not a resolved name and not
// per-year — rather than a semesterName string, confirmed against a real
// response (2026-08-31). No lookup/name mapping exists anywhere for this
// code, so it's turned into a "Year N - Semester M" label by simple
// arithmetic (two semesters per year, the convention every other real
// semester name in this app already follows).
function semesterLabelFromCode(semCode: number): string {
  const year = Math.ceil(semCode / 2)
  const sem = semCode % 2 === 0 ? 2 : 1
  return `Year ${year} - Semester ${sem}`
}

const PAGE_SIZE = 10

export function HeadCountTab({ rows: allRows, isLoading, isRefetching, hasFilters, onClearFilters }: {
  rows: BatchSummaryItem[]
  isLoading: boolean
  isRefetching: boolean
  hasFilters: boolean
  onClearFilters: () => void
}) {
  // Same fields the endpoint's own `search` matches (get-batch-summary.md),
  // applied to the rows already loaded since useBatchSummary fetches them all.
  const [search, setSearch] = useState('')
  const term = search.trim().toLowerCase()
  const filteredRows = term
    ? allRows.filter(r => [r.batchCode, r.programCode, r.programName].some(v => v?.toLowerCase().includes(term)))
    : allRows

  // The endpoint returns every batch for the campus in one go (no server
  // paging — see useBatchSummary), so it's paged here.
  const [page, setPage] = useState(1)
  const totalCount = filteredRows.length
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const rows = filteredRows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  // Back to page 1 when the filtered set changes.
  useEffect(() => { setPage(1) }, [allRows, term])

  return (
    <>
      {/* Same toolbar row as Manage Batches, so both tables start at the same height. */}
      <div className="flex items-center justify-end mb-4">
        <TableSearch className="w-56" placeholder="Search batch or programme…" value={search} onChange={setSearch} />
      </div>
      <div className={`tbl-refetch-wrap${isRefetching ? ' is-refetching' : ''}`} aria-busy={isRefetching}>
        {isRefetching && (
          <div className="tbl-refetch-pill" role="status">
            <i className="lni lni-reload" aria-hidden="true" /> Loading batches…
          </div>
        )}
        <ScrollTable>
          <table>
            <thead>
              <tr>
                <th style={{ width: 56 }}>Sl. No</th>
                <th>Batch</th>
                <th>Programme</th>
                <th>Semester</th>
                <th>Faculty</th>
                <th>Head Count</th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? <TableLoadingState colSpan={6} />
                : rows.length === 0
                  ? <EmptyState colSpan={6} hasFilters={hasFilters || !!term} onClearFilters={() => { setSearch(''); onClearFilters() }} />
                  : rows.map((r, i) => (
                    // batchGuid alone isn't a safe key — a live response has
                    // been seen leaving it blank/duplicated across rows; the
                    // page-qualified row index is always unique.
                    <tr key={`${r.batchGuid || 'row'}-${(safePage - 1) * PAGE_SIZE + i}`}>
                      <td className="text-g500 tabular-nums">{r.slNo ?? (safePage - 1) * PAGE_SIZE + i + 1}</td>
                      <td><span className="font-bold text-blue tabular-nums">{r.batchCode || '—'}</span></td>
                      <td>{r.programName || '—'}</td>
                      <td>{semesterLabelFromCode(r.semCode)}</td>
                      <td>{r.facultyName || '—'}</td>
                      <td className="tabular-nums font-semibold">{r.headCount}</td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </ScrollTable>
      </div>
      <Pagination page={safePage} totalPages={totalPages} totalCount={totalCount} itemLabel="batches" onPageChange={setPage} />
    </>
  )
}
