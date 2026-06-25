'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ScrollTable } from '@/components/ScrollTable'
import { ActionMenu } from '@/components/ActionMenu'
import { ProgrammeLevelModal } from '@/components/modals/ProgrammeLevelModal'
import { Toast } from '@/components/Toast'
import { FilterTh } from '@/components/FilterTh'
import { EmptyState } from '@/components/EmptyState'

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
    { code: 'CERT', name: "Certificate / HEC",          years: 1, sems: 2, minCredits: 48,  noIA: 'No',  linkedProgs: 3 },
    { code: 'DIP',  name: "Diploma",                    years: 2, sems: 4, minCredits: 96,  noIA: 'No',  linkedProgs: 5 },
    { code: 'BACH', name: "Bachelor's Degree",           years: 3, sems: 6, minCredits: 132, noIA: 'No',  linkedProgs: 12 },
    { code: 'ENG',  name: "Bachelor of Engineering",    years: 4, sems: 8, minCredits: 160, noIA: 'No',  linkedProgs: 4 },
    { code: 'MAST', name: "Master's Degree",             years: 2, sems: 4, minCredits: 72,  noIA: 'No',  linkedProgs: 6 },
    { code: 'PHD',  name: "Doctor of Philosophy (PhD)", years: 3, sems: 6, minCredits: 0,   noIA: 'Yes', linkedProgs: 2 },
  ]
  const filteredRows = rows.filter(r =>
    Object.entries(filters).every(([k, v]) => !v.length || v.includes(String((r as Record<string, unknown>)[k])))
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
          <div><div className="pg-title">Programme Level Master</div><div className="pg-sub">Define programme levels (Bachelor&apos;s, Master&apos;s, PhD etc.) · Set year count, semester count and minimum credit load</div></div>
          <button className="btn btn-primary" onClick={() => openModal('new-alevel-modal')}><i className="lni lni-plus"></i> Add Level</button>
        </div>

        <div className="info-box mb-[18px]">
          <i className="lni lni-information"></i> Programme Level defines the <strong>fundamental attributes</strong> of every programme at that level (year count, semester count, minimum credit load). Selecting a level in the Programme Master auto-populates these values — e.g. selecting Bachelor&apos;s defaults to 3 years, 6 semesters.
        </div>

        <div className="card">
          <div className="card-hdr">
            <div className="card-title"><span className="ctitle-icon"><i className="lni lni-graduation"></i></span> Defined Programme Levels</div>
          </div>
          <ScrollTable filters={filters} onResetFilters={() => setFilters({})}>
            <table>
              <thead><tr><th style={{ width: 48 }}></th><th>Level Code</th><th>Level Name</th><th>Year Count</th><th>Semester Count</th><th>Min. Credit Load</th>{fth('No Internal Assessment', 'noIA', ['Yes', 'No'])}<th>Linked Programmes</th></tr></thead>
              <tbody>
                {filteredRows.length === 0
                  ? <EmptyState colSpan={999} hasFilters={Object.values(filters).some(v => v.length > 0)} onClearFilters={() => setFilters({})} />
                  : null}
                {filteredRows.map((r, i) => (
                  <tr key={i}>
                    <td><ActionMenu><button className="btn btn-neu btn-sm"><i className="lni lni-pencil"></i> Edit</button></ActionMenu></td>
                    <td className="font-mono text-b700">{r.code}</td>
                    <td><strong>{r.name}</strong></td>
                    <td>{r.years}</td>
                    <td>{r.sems}</td>
                    <td>{r.minCredits}</td>
                    <td>
                      {r.noIA === 'Yes'
                        ? <span className="badge badge-amber"><i className="lni lni-checkmark"></i> Yes — No IA</span>
                        : <span className="badge badge-grey">No</span>
                      }
                    </td>
                    <td>{r.linkedProgs}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollTable>
        </div>
      </div>
      <ProgrammeLevelModal isOpen={openModals.has('new-alevel-modal')} onClose={() => closeModal('new-alevel-modal')} showToast={showToast} />
      <Toast toast={toast} />
    </>
  )
}
