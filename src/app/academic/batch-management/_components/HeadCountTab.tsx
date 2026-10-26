'use client'
import { useEffect, useState } from 'react'
import { ScrollTable } from '@/components/ScrollTable'
import { EmptyState } from '@/components/EmptyState'
import { TableLoadingState } from '@/components/TableLoadingState'
import { Pagination } from '@/components/Pagination'
import { TableSearch } from '@/components/TableSearch'
import type { Batch } from '@/lib/api/academic/batch'

// The Head Count tab of Batch Management (was the separate Batch Summary
// page, merged 2026-10-21). Rows come from GET /academic/batches (the old
// /batch-summary endpoint was removed in MR !341), fetched by the page so the
// stat tiles above share the same data. Column mapping per
// batch-summary-page.md: Faculty = bInChargeName, Head count = headCount.

// Fallback label when a row has no semesterName: semCode counts semesters
// across the whole programme (1, 2, 3…), two per year.
function semesterLabelFromCode(semCode: number): string {
  const year = Math.ceil(semCode / 2)
  const sem = semCode % 2 === 0 ? 2 : 1
  return `Year ${year} - Semester ${sem}`
}

const PAGE_SIZE = 10

export function HeadCountTab({ rows: allRows, isLoading, isRefetching, hasFilters, onClearFilters }: {
  rows: Batch[]
  isLoading: boolean
  isRefetching: boolean
  hasFilters: boolean
  onClearFilters: () => void
}) {
  // Searches the rows already loaded (useBatchSummary fetches them all), on
  // the main fields the endpoint's own `search` matches (get-batches.md).
  const [search, setSearch] = useState('')
  const term = search.trim().toLowerCase()
  const filteredRows = term
    ? allRows.filter(r => [r.batchCode, r.programCode, r.programName, r.semesterName].some(v => v?.toLowerCase().includes(term)))
    : allRows

  // Every batch for the scope arrives in one go (see useBatchSummary), so
  // it's paged here.
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
                      <td className="text-g500 tabular-nums">{(safePage - 1) * PAGE_SIZE + i + 1}</td>
                      <td><span className="font-bold text-blue tabular-nums">{r.batchCode || '—'}</span></td>
                      <td>{r.programName || '—'}</td>
                      <td>{r.semesterName || (r.semCode ? semesterLabelFromCode(r.semCode) : '—')}</td>
                      <td>{r.bInChargeName || '—'}</td>
                      <td className="tabular-nums font-semibold">{r.headCount ?? 0}</td>
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
