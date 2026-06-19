'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ScrollTable } from '@/components/ScrollTable'
import { ActionMenu } from '@/components/ActionMenu'
import { NewBatchModal } from '@/components/modals/NewBatchModal'
import { EditBatchModal } from '@/components/modals/EditBatchModal'
import { Toast } from '@/components/Toast'
import { FilterTh } from '@/components/FilterTh'

export default function Page() {
  const router = useRouter()
  const [openModals, setOpenModals] = useState<Set<string>>(new Set())
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)
  const [filters, setFilters] = useState<Record<string, string>>({})
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
    { batchCode: 'BSC-IT-S26-DA',  programme: 'BSc. IT 2026',  progTag: 'BCA-2026', semester: 'Sem 1', type: 'Day',     subBatch: 'DA (sub-batch A)',              subBadge: 'badge-grey',  students: 42,  incharge: 'Dr. Ssekibuule Ronald', ttBadge: 'badge-green', ttLabel: 'Set',     ttIcon: true,  rowClass: '',       variant: 'edit' },
    { batchCode: 'BSC-IT-S26-DB',  programme: 'BSc. IT 2026',  progTag: 'BCA-2026', semester: 'Sem 1', type: 'Day',     subBatch: 'DB (sub-batch B)',              subBadge: 'badge-blue',  students: 38,  incharge: 'Ms. Namutebi Joyce',    ttBadge: 'badge-green', ttLabel: 'Set',     ttIcon: true,  rowClass: '',       variant: 'edit' },
    { batchCode: 'BBA-S26-DA',     programme: 'BBA 2021',      progTag: 'BBA-2021', semester: 'Sem 3', type: 'Day',     subBatch: 'DA',                            subBadge: 'badge-grey',  students: 38,  incharge: 'Prof. Mukasa Charles',  ttBadge: 'badge-amber', ttLabel: 'Draft',   ttIcon: false, rowClass: '',       variant: 'edit' },
    { batchCode: 'MBA-S26-EA',     programme: 'MBA 2024',      progTag: 'MBA-2024', semester: 'Sem 1', type: 'Evening', subBatch: 'EA',                            subBadge: 'badge-grey',  students: 24,  incharge: 'Dr. Kato Andrew',       ttBadge: 'badge-green', ttLabel: 'Set',     ttIcon: true,  rowClass: '',       variant: 'edit' },
    { batchCode: 'BSC-VFX-S26-??', programme: 'BSc. VFX 2026', progTag: 'VFX-2026', semester: 'Sem 1', type: 'Day',     subBatch: '102 students — needs sub-batching', subBadge: 'badge-amber', students: 102, incharge: '—',                ttBadge: 'badge-red',   ttLabel: 'Not Set', ttIcon: false, rowClass: 'flagged', variant: 'split' },
  ]
  const filteredRows = rows.filter(r =>
    Object.entries(filters).every(([k, v]) => !v || String((r as Record<string, unknown>)[k]) === v)
  )

  function fth(label: string, col: string, opts: string[]) {
    return (
      <FilterTh
        label={label}
        opts={opts}
        isOpen={openFilter === col}
        activeFilter={filters[col] ?? ''}
        onToggle={(e) => { e.stopPropagation(); setOpenFilter(p => p === col ? null : col) }}
        onSelect={(val) => { setFilters(f => ({ ...f, [col]: val })); setOpenFilter(null) }}
        onClear={() => { setFilters(f => ({ ...f, [col]: '' })); setOpenFilter(null) }}
      />
    )
  }

  return (
    <>
      <div className="page active">
        <div className="pg-hdr">
          <div><div className="pg-title">Batch Management</div><div className="pg-sub">Create batches per intake · Auto-generate batch codes · Sub-batch large cohorts · Assign Batch In-Charge</div></div>
          <button className="btn btn-primary" onClick={() => openModal('new-batch-modal')}><i className="lni lni-plus"></i> Create Batch</button>
        </div>

        <div className="info-box mb-[14px]">
          <i className="lni lni-information"></i> <span>Batch Code is <strong>system-generated</strong> as: <span className="font-mono bg-[var(--b100)] py-[2px] px-[6px] rounded">Course Code + Session/Year + Batch Type + Sub-Batch</span> e.g. <strong>BSc-VFX-S26-DA</strong>. Large cohorts (100+ students) are split into <strong>sub-batches (DA, DB)</strong> of ~50 for separate timetabling and faculty allocation.</span>
        </div>
        <div className="warn-box mb-[14px]">
          <i className="lni lni-warning"></i> <span>Admissions occur <strong>every semester (twice a year)</strong>. A new batch must be created for each intake. <strong>Specialization</strong> is assigned to the individual student — not the batch. <strong>Batch In-Charges</strong> can view batch reports but have no direct relation to programme courses.</span>
        </div>
        <div className="info-box mb-[18px]">
          <i className="lni lni-cog"></i> <span><strong>Automation:</strong> Batch creation can be triggered automatically during intake setup. Enabling <strong>Create Batches</strong> on the Create New Intake form will generate batches for all active programmes at the back end — no manual entry needed.</span>
        </div>

        <div className="g4 mb-[18px]">
          <div className="stat-card"><div className="stat-lbl">Active Batches</div><div className="stat-num">18</div><div className="stat-sub up">Spring 2026</div></div>
          <div className="stat-card [--b700:var(--amber)] [--b400:#fbbf24]"><div className="stat-lbl">Pending Sub-batch</div><div className="stat-num text-clr-amber">3</div><div className="stat-sub warn">Cohorts &gt; 50 students</div></div>
          <div className="stat-card [--b700:var(--green)] [--b400:#34d399]"><div className="stat-lbl">Total Students</div><div className="stat-num text-clr-green">1,284</div><div className="stat-sub up">Across all batches</div></div>
          <div className="stat-card [--b700:var(--purple)] [--b400:#a78bfa]"><div className="stat-lbl">Batch In-Charges</div><div className="stat-num text-clr-purple">18</div><div className="stat-sub up">Assigned</div></div>
        </div>

        <div className="card">
          <div className="card-hdr">
            <div className="card-title"><span className="ctitle-icon"><i className="lni lni-users"></i></span> Active Batches — Spring 2026 (20261)</div>
            <div className="flex gap-2">
              <select className="ctrl w-auto text-[var(--fs-sm)]"><option>All Programmes</option><option>BSc. IT</option><option>BBA</option><option>MBA</option><option>BEng. Civil</option></select>
              <select className="ctrl w-auto text-[var(--fs-sm)]"><option>All Types</option><option>Day</option><option>Evening</option><option>Weekend</option><option>Distance/Online</option></select>
              <button className="btn btn-neu btn-sm"><i className="lni lni-upload"></i> Export</button>
            </div>
          </div>
          <ScrollTable>
            <table>
              <thead><tr><th>Action</th><th>Batch Code</th>{fth('Programme (Version)', 'programme', ['BSc. IT 2026', 'BBA 2021', 'MBA 2024', 'BSc. VFX 2026'])}{fth('Semester', 'semester', ['Sem 1', 'Sem 3'])}{fth('Type', 'type', ['Day', 'Evening', 'Weekend'])}<th>Sub-Batch</th><th>Students</th><th>Batch In-Charge</th><th>Timetable</th></tr></thead>
              <tbody>
                {filteredRows.map((r, i) => (
                  <tr key={i} className={r.rowClass}>
                    <td>
                      <ActionMenu>
                        {r.variant === 'edit'
                          ? <button className="btn btn-neu btn-sm" onClick={() => openModal('edit-batch-modal')}><i className="lni lni-pencil"></i> Edit</button>
                          : <button className="btn btn-amber btn-sm" onClick={() => openModal('new-batch-modal')}>Split → Sub-batches</button>
                        }
                      </ActionMenu>
                    </td>
                    <td>
                      <span className={`font-bold font-mono ${r.variant === 'split' ? 'text-clr-amber' : 'text-blue'}`}>{r.batchCode}</span>
                    </td>
                    <td>{r.programme} <span className="pill pill-blue">{r.progTag}</span></td>
                    <td>{r.semester}</td>
                    <td>
                      <span className={`badge ${r.type === 'Evening' ? 'badge-purple' : 'badge-blue'}`}>{r.type}</span>
                    </td>
                    <td>
                      <span className={`badge ${r.subBadge}`}>
                        {r.subBadge === 'badge-amber' && <i className="lni lni-warning"></i>} {r.subBatch}
                      </span>
                    </td>
                    <td>{r.students}</td>
                    <td>{r.incharge}</td>
                    <td>
                      <span className={`badge ${r.ttBadge}`}>
                        {r.ttIcon && <i className="lni lni-checkmark"></i>} {r.ttLabel}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollTable>
        </div>

        <div className="card">
          <div className="card-hdr">
            <div className="card-title"><span className="ctitle-icon"><i className="lni lni-cog"></i></span> Batch Code Generator</div>
            <span className="badge badge-blue">Auto-generated</span>
          </div>
          <div className="g4">
            <div className="fg"><div className="lbl">Course Code</div><input className="ctrl" type="text" placeholder="e.g. BSC-IT" /></div>
            <div className="fg"><div className="lbl">Session / Year</div>
              <select className="ctrl"><option value="S26">S26 (Spring 2026)</option><option value="F26">F26 (Fall 2026)</option><option value="S27">S27 (Spring 2027)</option></select>
            </div>
            <div className="fg"><div className="lbl">Batch Type</div>
              <select className="ctrl"><option value="D">D — Day</option><option value="E">E — Evening</option><option value="W">W — Weekend</option><option value="O">O — Distance/Online</option></select>
            </div>
            <div className="fg"><div className="lbl">Sub-batch</div>
              <select className="ctrl"><option value="A">A (first sub-batch)</option><option value="B">B (second sub-batch)</option><option value="C">C (third sub-batch)</option></select>
            </div>
          </div>
          <div className="mt-[14px] p-[14px] bg-b50 border-[1.5px] border-[var(--b200)] rounded-[var(--rsm)] flex items-center gap-4">
            <span className="text-[var(--fs-xs)] font-bold text-g500 uppercase">Generated Batch Code:</span>
            <span className="font-mono text-[var(--fs-2xl)] font-extrabold text-b800">BSC-IT-S26-DA</span>
          </div>
        </div>
      </div>
      <NewBatchModal isOpen={openModals.has('new-batch-modal')} onClose={() => closeModal('new-batch-modal')} showToast={showToast} />
      <EditBatchModal isOpen={openModals.has('edit-batch-modal')} onClose={() => closeModal('edit-batch-modal')} showToast={showToast} />
      <Toast toast={toast} />
    </>
  )
}
