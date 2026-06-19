'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ScrollTable } from '@/components/ScrollTable'
import { ActionMenu } from '@/components/ActionMenu'
import { NewIntakeModal } from '@/components/modals/NewIntakeModal'
import { EditIntakeModal } from '@/components/modals/EditIntakeModal'
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
    { code: '20261', desc: 'Spring 2026', finYear: '2025–26', semStart: '01 Feb 2026', term1End: '30 Mar 2026', term2End: '31 May 2026', grievEnd: '10 Jun 2026', reentry: '15 Jun 2026', academic: 'Current', admission: '—', rowClass: 'selected-row', editBtn: true },
    { code: '20262', desc: 'Fall 2026',   finYear: '2026–27', semStart: '01 Aug 2026', term1End: '30 Sep 2026', term2End: '30 Nov 2026', grievEnd: '10 Dec 2026', reentry: '15 Dec 2026', academic: '—',       admission: 'Current', rowClass: '', editBtn: true },
    { code: '20253', desc: 'Autumn 2025', finYear: '2025–26', semStart: '01 Sep 2025', term1End: '31 Oct 2025', term2End: '31 Dec 2025', grievEnd: '10 Jan 2026', reentry: '15 Jan 2026', academic: 'Closed',  admission: 'Closed',  rowClass: '', editBtn: false },
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

  function statusBadge(val: string) {
    if (val === 'Current') return <span className="badge badge-green"><i className="lni lni-checkmark"></i> Current</span>
    if (val === 'Closed') return <span className="badge badge-grey">Closed</span>
    return <>{val}</>
  }

  return (
    <>
      <div className="page active">
        <div className="pg-hdr">
          <div><div className="pg-title">Intake Master</div><div className="pg-sub">Configure academic sessions · Set all semester and term dates · Manage current intakes</div></div>
          <button className="btn btn-primary" onClick={() => openModal('new-intake-modal')}><i className="lni lni-plus"></i> New Intake</button>
        </div>
        <div className="warn-box mb-5">
          <i className="lni lni-warning"></i> <span><strong>Rule:</strong> Only one <em>Current Academic Intake</em> and one <em>Current Admission Intake</em> can be active at a time. All dates are manually set to allow flexibility for government notices, student requests, and external factors.</span>
        </div>
        <div className="g2 mb-[18px]">
          <div className="bg-[linear-gradient(135deg,var(--b800),var(--b600))] rounded-xl p-5 text-white shadow-[var(--neu-out)]">
            <div className="text-[var(--fs-xs)] font-bold uppercase tracking-[.08em] opacity-[.7] mb-1">Current Academic Intake</div>
            <div className="text-[var(--fs-xl)] font-extrabold">Spring 2026</div>
            <div className="text-[var(--fs-sm)] opacity-[.8] mt-[2px]">Code: 20261 · Teaching in progress</div>
            <div className="mt-[14px] flex gap-[10px] flex-wrap">
              <div className="bg-[rgba(255,255,255,.15)] rounded-md p-[6px_10px] text-[var(--fs-xs)]"><div className="opacity-[.7]">Sem Start</div><div className="font-bold">01 Feb 2026</div></div>
              <div className="bg-[rgba(255,255,255,.15)] rounded-md p-[6px_10px] text-[var(--fs-xs)]"><div className="opacity-[.7]">Term 1 End</div><div className="font-bold">30 Mar 2026</div></div>
              <div className="bg-[rgba(255,255,255,.15)] rounded-md p-[6px_10px] text-[var(--fs-xs)]"><div className="opacity-[.7]">Sem End</div><div className="font-bold">31 May 2026</div></div>
            </div>
          </div>
          <div className="bg-[linear-gradient(135deg,#047857,var(--green))] rounded-xl p-5 text-white shadow-[var(--neu-out)]">
            <div className="text-[var(--fs-xs)] font-bold uppercase tracking-[.08em] opacity-[.7] mb-1">Current Admission Intake</div>
            <div className="text-[var(--fs-xl)] font-extrabold">Fall 2026</div>
            <div className="text-[var(--fs-sm)] opacity-[.8] mt-[2px]">Code: 20262 · Admissions open</div>
            <div className="mt-[14px] flex gap-[10px] flex-wrap">
              <div className="bg-[rgba(255,255,255,.15)] rounded-md p-[6px_10px] text-[var(--fs-xs)]"><div className="opacity-[.7]">Open Date</div><div className="font-bold">01 Mar 2026</div></div>
              <div className="bg-[rgba(255,255,255,.15)] rounded-md p-[6px_10px] text-[var(--fs-xs)]"><div className="opacity-[.7]">Close Date</div><div className="font-bold">15 Jul 2026</div></div>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-hdr">
            <div className="card-title"><span className="ctitle-icon"><i className="lni lni-calendar"></i></span> All Intakes</div>
            <button className="btn btn-neu btn-sm"><i className="lni lni-upload"></i> Export</button>
          </div>
          <ScrollTable>
            <table>
              <thead><tr><th>Action</th><th>Code</th><th>Description</th>{fth('Fin. Year', 'finYear', ['2025–26', '2026–27'])}<th>Sem Start</th><th>Term1 End</th><th>Term2 End</th><th>Grievance End</th><th>Re-entry Date</th>{fth('Academic?', 'academic', ['Current', 'Closed', '—'])}{fth('Admission?', 'admission', ['Current', 'Closed', '—'])}</tr></thead>
              <tbody>
                {filteredRows.map((r, i) => (
                  <tr key={i} className={r.rowClass}>
                    <td>
                      <ActionMenu>
                        {r.editBtn
                          ? <button className="btn btn-neu btn-sm" onClick={() => openModal('intake-edit-modal')}><i className="lni lni-pencil"></i> Edit</button>
                          : <button className="btn btn-neu btn-sm"><i className="lni lni-eye"></i> View</button>
                        }
                      </ActionMenu>
                    </td>
                    <td>
                      {r.editBtn
                        ? <span className="font-bold text-blue font-mono">{r.code}</span>
                        : <span className="font-bold font-mono text-g400">{r.code}</span>
                      }
                    </td>
                    <td>{r.editBtn ? <strong>{r.desc}</strong> : r.desc}</td>
                    <td>{r.finYear}</td>
                    <td>{r.semStart}</td>
                    <td>{r.term1End}</td>
                    <td>{r.term2End}</td>
                    <td>{r.grievEnd}</td>
                    <td>{r.reentry}</td>
                    <td>{statusBadge(r.academic)}</td>
                    <td>{statusBadge(r.admission)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollTable>
        </div>
      </div>
      <NewIntakeModal isOpen={openModals.has('new-intake-modal')} onClose={() => closeModal('new-intake-modal')} showToast={showToast} />
      <EditIntakeModal isOpen={openModals.has('intake-edit-modal')} onClose={() => closeModal('intake-edit-modal')} showToast={showToast} />
      <Toast toast={toast} />
    </>
  )
}
