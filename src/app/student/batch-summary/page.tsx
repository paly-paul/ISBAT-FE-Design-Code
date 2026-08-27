'use client'
import { useEffect, useState } from 'react'
import { SearchSelect } from '@/components/SearchSelect'
import { ScrollTable } from '@/components/ScrollTable'
import { EmptyState } from '@/components/EmptyState'
import { TableLoadingState } from '@/components/TableLoadingState'
import { Pagination } from '@/components/Pagination'
import { usePagination } from '@/hooks/usePagination'
import { useCampusDropdown } from '@/hooks/config/useCampuses'
import { useBatchSummary } from '@/hooks/academic/useBatchSummary'

// Ported from isbat_student_module.html's Batch Summary page. Campus
// dropdown loads from GET /academic/campus/dropdown on mount
// (useCampusDropdown, same source Campus Master/Faculty Master use). The
// grid itself comes from GET /academic/batch-summary — no campusGuid for the
// unfiltered "All Campuses" view, ?campusGuid={guid} once one's selected —
// see getBatchSummary in lib/api/academic/batchSummary.ts for the field-name
// caveat (names aren't confirmed against a real response yet).
const STATS = { totalBatches: 8, totalStudents: 247, fullBatches: 3, avgBatchSize: 31 }

const PAGE_SIZE = 10

export default function Page() {
  const [intake, setIntake] = useState('Spring 2026')
  const [campusGuid, setCampusGuid] = useState('')
  const { data: campuses = [] } = useCampusDropdown()
  const { data: rows = [], isLoading } = useBatchSummary(campusGuid || null)

  const { page, setPage, totalPages, totalCount, pageItems } = usePagination(rows, PAGE_SIZE)

  // Land back on page 1 whenever the campus filter changes — the previous
  // page offset almost never lands on a valid page of the newly-filtered set.
  useEffect(() => { setPage(1) }, [campusGuid, setPage])

  return (
    <div className="page active">
      <div className="pg-hdr">
        <div><div className="pg-title">Batch Summary</div><div className="pg-sub">Student counts and status breakdown by batch</div></div>
        <div className="flex gap-2">
          <SearchSelect
            style={{ width: 200 }}
            placeholder="All Campuses"
            options={campuses.map(c => ({ value: c.campusGuid, label: c.campusName }))}
            value={campusGuid}
            onChange={setCampusGuid}
          />
          <SearchSelect
            style={{ width: 200 }}
            options={['Spring 2026', 'Fall 2025', 'Spring 2025']}
            value={intake}
            onChange={setIntake}
          />
          <button className="btn btn-neu btn-sm"><i className="lni lni-download"></i> Export</button>
        </div>
      </div>

      <div className="stats-row">
        <div className="stat-card"><div className="stat-lbl">Total Batches</div><div className="stat-num" style={{ color: 'var(--b700)' }}>{STATS.totalBatches}</div><div className="stat-sub">Active this intake</div></div>
        <div className="stat-card [--b700:var(--green)] [--b400:#34d399]"><div className="stat-lbl">Total Students</div><div className="stat-num" style={{ color: 'var(--green)' }}>{STATS.totalStudents}</div><div className="stat-sub up">Across all batches</div></div>
        <div className="stat-card [--b700:var(--amber)] [--b400:#fbbf24]"><div className="stat-lbl">Full Batches</div><div className="stat-num" style={{ color: 'var(--amber)' }}>{STATS.fullBatches}</div><div className="stat-sub warn">At capacity</div></div>
        <div className="stat-card"><div className="stat-lbl">Avg Batch Size</div><div className="stat-num">{STATS.avgBatchSize}</div><div className="stat-sub">students / batch</div></div>
      </div>

      <div className="card">
        <div className="card-hdr">
          <div className="card-title"><span className="ctitle-icon"><i className="lni lni-users"></i></span> Batches{campusGuid ? ` · ${campuses.find(c => c.campusGuid === campusGuid)?.campusName ?? ''}` : ''}</div>
        </div>
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
                : pageItems.length === 0
                  ? <EmptyState colSpan={6} hasFilters={!!campusGuid} onClearFilters={() => setCampusGuid('')} />
                  : pageItems.map((r, i) => (
                    <tr key={r.batchGuid}>
                      <td className="text-g500">{(page - 1) * PAGE_SIZE + i + 1}</td>
                      <td><span className="font-bold font-mono text-blue">{r.batchCode}</span></td>
                      <td>{r.programName}</td>
                      <td>{r.semesterName}</td>
                      <td>{r.facultyName}</td>
                      <td>{r.headCount}</td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </ScrollTable>
        <Pagination page={page} totalPages={totalPages} totalCount={totalCount} itemLabel="batches" onPageChange={setPage} />
      </div>
    </div>
  )
}
