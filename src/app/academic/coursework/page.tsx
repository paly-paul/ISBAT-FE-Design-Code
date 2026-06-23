'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ScrollTable } from '@/components/ScrollTable'
import { ActionMenu } from '@/components/ActionMenu'
import { Toast } from '@/components/Toast'
import { FilterTh } from '@/components/FilterTh'

export default function Page() {
  const router = useRouter()
  const [openModals, setOpenModals] = useState<Set<string>>(new Set())
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)
  const [filters, setFilters] = useState<Record<string, string[]>>({})
  const [openFilter, setOpenFilter] = useState<string | null>(null)

  function nav(id: string) { router.push('/academic/' + id) }
  function openModal(id: string) { setOpenModals(prev => new Set(prev).add(id)) }
  function closeModal(id: string) { setOpenModals(prev => { const s = new Set(prev); s.delete(id); return s }) }
  function showToast(msg: string, type = '') { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }

  useEffect(() => {
    function closeFilter(e: MouseEvent) {
      const target = e.target as HTMLElement
      if (!target.closest('th')) setOpenFilter(null)
    }
    document.addEventListener('click', closeFilter)
    return () => document.removeEventListener('click', closeFilter)
  }, [])

  const rows = [
    { unit: 'IT101 – Intro to Programming',  batch: 'BSC-IT-S1-D', faculty: 'Dr. Ssekibuule', openDate: '01 Mar 2026', dueDate: '15 Mar 2026', outOf: 25, submitted: '38/42', submittedClass: 'text-green', cleared: 42, clearedClass: 'text-green', status: 'Closed',        statusBadge: 'badge-green', statusIcon: 'lni-checkmark', rowClass: '', variant: 'view' },
    { unit: 'IT102 – Computer Org.',          batch: 'BSC-IT-S1-D', faculty: 'Ms. Namutebi',   openDate: '03 Mar 2026', dueDate: '17 Mar 2026', outOf: 25, submitted: '28/42', submittedClass: 'text-amber', cleared: 38, clearedClass: 'text-green', status: 'Open',          statusBadge: 'badge-amber', statusIcon: '',              rowClass: '', variant: 'manage' },
    { unit: 'MBA101 – Managerial Econ.',      batch: 'MBA-S1-E',    faculty: 'Prof. Mukasa',    openDate: '—',          dueDate: '—',           outOf: 25, submitted: '0/24',  submittedClass: '',           cleared: 24, clearedClass: 'text-green', status: 'Not Scheduled', statusBadge: 'badge-grey',  statusIcon: '',              rowClass: 'flagged', variant: 'schedule' },
  ]
  const filteredRows = rows.filter(r =>
    Object.entries(filters).every(([k, v]) => !v.length || v.includes((r as unknown as Record<string, string>)[k]))
  )

  function fth(label: string, col: string, opts: string[]) {
    return (
      <FilterTh
        label={label}
        opts={opts}
        isOpen={openFilter === col}
        activeFilter={filters[col] ?? []}
        onToggle={(e) => { e.stopPropagation(); setOpenFilter(p => p === col ? null : col) }}
        onSelect={(vals) => { setFilters(f => ({ ...f, [col]: vals })); setOpenFilter(null) }}
        onClear={() => { setFilters(f => ({ ...f, [col]: [] })); setOpenFilter(null) }}
        onClose={() => setOpenFilter(null)}
      />
    )
  }

  return (
    <>
      <div className="page active">
        <div className="pg-hdr">
          <div><div className="pg-title">Coursework (CW) Management</div><div className="pg-sub">Term-based internal assessments · Faculty upload questions · 50% fee clearance required for submission</div></div>
          <button className="btn btn-primary" onClick={() => openModal('new-cw-modal')}><i className="lni lni-plus"></i> Schedule Coursework</button>
        </div>

        <div className="g2 mb-[18px]">
          <div className="info-box"><i className="lni lni-ruler-alt"></i> <span><strong>Proration:</strong> Coursework is marked out of <strong>25</strong> and prorated to <strong>15</strong> marks in final result. Students must have minimum <strong>50% fee clearance</strong> (on original tuition fee before discounts) to submit.</span></div>
          <div className="warn-box"><i className="lni lni-warning"></i> <span>Students can <strong>view</strong> coursework questions without fee clearance. Fee clearance only blocks <strong>submission</strong>.</span></div>
        </div>

        <div className="pipeline">
          <div className="pip-step active"><div className="pip-circle">1</div><div className="pip-info"><div className="pip-label">Term 1 CW</div><div className="pip-desc">In progress</div></div></div>
          <div className="pip-line"></div>
          <div className="pip-step"><div className="pip-circle">2</div><div className="pip-info"><div className="pip-label">Term 1 CBT</div><div className="pip-desc">Upcoming</div></div></div>
          <div className="pip-line"></div>
          <div className="pip-step"><div className="pip-circle">3</div><div className="pip-info"><div className="pip-label">Term 2 CW</div><div className="pip-desc">Upcoming</div></div></div>
          <div className="pip-line"></div>
          <div className="pip-step"><div className="pip-circle">4</div><div className="pip-info"><div className="pip-label">Term 2 CBT</div><div className="pip-desc">Upcoming</div></div></div>
          <div className="pip-line"></div>
          <div className="pip-step"><div className="pip-circle">5</div><div className="pip-info"><div className="pip-label">Uni. Exam</div><div className="pip-desc">End of Sem</div></div></div>
        </div>

        <div className="card">
          <div className="card-hdr">
            <div className="card-title"><span className="ctitle-icon"><i className="lni lni-pencil-alt"></i></span> Active Coursework — Term 1 · Spring 2026</div>
            <div className="flex gap-2">
              <select className="ctrl w-auto text-[var(--fs-sm)]"><option>All Batches</option><option>BSC-IT-S1-D</option><option>BBA-S3-D</option><option>MBA-S1-E</option></select>
            </div>
          </div>
          <ScrollTable>
            <table>
              <thead><tr><th style={{ width: 48 }}></th><th>Course Unit</th>{fth('Batch', 'batch', ['BSC-IT-S1-D', 'MBA-S1-E'])}{fth('Faculty', 'faculty', ['Dr. Ssekibuule', 'Ms. Namutebi', 'Prof. Mukasa'])}<th>Open Date</th><th>Due Date</th><th>Out Of</th><th>Submitted</th><th>Cleared (≥50%)</th>{fth('Status', 'status', ['Closed', 'Open', 'Not Scheduled'])}</tr></thead>
              <tbody>
                {filteredRows.map((r, i) => (
                  <tr key={i} className={r.rowClass}>
                    <td>
                      <ActionMenu>
                        {r.variant === 'view' && <button className="btn btn-neu btn-sm">View Marks</button>}
                        {r.variant === 'manage' && <button className="btn btn-neu btn-sm">Manage</button>}
                        {r.variant === 'schedule' && <button className="btn btn-primary btn-sm" onClick={() => openModal('new-cw-modal')}>Schedule →</button>}
                      </ActionMenu>
                    </td>
                    <td><strong>{r.unit}</strong></td>
                    <td>{r.batch}</td>
                    <td>{r.faculty}</td>
                    <td>{r.openDate}</td>
                    <td>{r.dueDate}</td>
                    <td>{r.outOf}</td>
                    <td><span className={`${r.submittedClass} font-bold`}>{r.submitted}</span></td>
                    <td><span className={`${r.clearedClass} font-bold`}>{r.cleared}</span></td>
                    <td>
                      <span className={`badge ${r.statusBadge}`}>
                        {r.statusIcon && <i className={`lni ${r.statusIcon}`}></i>} {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollTable>
        </div>
      </div>
      <Toast toast={toast} />
    </>
  )
}
