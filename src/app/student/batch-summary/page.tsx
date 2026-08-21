'use client'
import { useState } from 'react'
import { SearchSelect } from '@/components/SearchSelect'

// Ported from isbat_student_module.html's Batch Summary page. No backend
// contract exists for this per-batch status breakdown — mock data only. The
// stat tiles are the mockup's own university-wide aggregate figures (8
// batches, 247 students total) — deliberately not derived from BATCHES
// below, which is only the 3 example cards the mockup actually renders, a
// representative subset rather than the full batch list.
const STATS = { totalBatches: 8, totalStudents: 247, fullBatches: 3, avgBatchSize: 31 }

const BATCHES = [
  { name: 'BSc.IT-2024A · BSc. Information Technology', sub: 'Spring 2024 · Day Mode · Sem 3 current', total: 52, active: 42, ytr: 5, ytc: 2, dropout: 3 },
  { name: 'BBA-2024A · Bachelor of Business Admin.', sub: 'Spring 2024 · Day Mode · Sem 3 current', total: 48, active: 38, ytr: 6, ytc: 1, dropout: 3 },
  { name: 'BSc.IT-2025A · BSc. Information Technology', sub: 'Spring 2025 · Day Mode · Sem 1 current', total: 37, active: 34, ytr: 2, ytc: 0, dropout: 1 },
]

export default function Page() {
  const [intake, setIntake] = useState('Spring 2026')

  return (
    <div className="page active">
      <div className="pg-hdr">
        <div><div className="pg-title">Batch Summary</div><div className="pg-sub">Student counts and status breakdown by batch</div></div>
        <div className="flex gap-2">
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

      {BATCHES.map(b => (
        <div className="batch-card" key={b.name}>
          <div className="batch-hdr">
            <div><div className="batch-hdr-name">{b.name}</div><div className="batch-hdr-sub">{b.sub}</div></div>
            <span className="batch-hdr-cnt">{b.total} students</span>
          </div>
          <div className="batch-body">
            <div className="batch-stat"><div className="batch-num" style={{ color: 'var(--green)' }}>{b.active}</div><div className="batch-lbl">Active</div></div>
            <div className="batch-stat"><div className="batch-num" style={{ color: 'var(--amber)' }}>{b.ytr}</div><div className="batch-lbl">YTR</div></div>
            <div className="batch-stat"><div className="batch-num" style={{ color: 'var(--cyan)' }}>{b.ytc}</div><div className="batch-lbl">YTC</div></div>
            <div className="batch-stat"><div className="batch-num" style={{ color: 'var(--red)' }}>{b.dropout}</div><div className="batch-lbl">Dropout</div></div>
          </div>
        </div>
      ))}
    </div>
  )
}
