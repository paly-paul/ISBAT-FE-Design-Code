'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ScrollTable } from '@/components/ScrollTable'
import { ActionMenu } from '@/components/ActionMenu'
import { ProgrammeGroupModal } from '@/components/modals/academic/ProgrammeGroupModal'
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
    { code: 'BCA', name: "Bachelor of Computer Applications",    level: "Bachelor's", activeVersions: '1 Active', inactiveVersions: '1 Inactive', students: 234 },
    { code: 'BBA', name: "Bachelor of Business Administration",  level: "Bachelor's", activeVersions: '1 Active', inactiveVersions: '2 Inactive', students: 412 },
    { code: 'MBA', name: "Master of Business Administration",    level: "Master's",   activeVersions: '1 Active', inactiveVersions: '1 Inactive', students: 186 },
    { code: 'BEng', name: "Bachelor of Engineering (Civil)",     level: 'Engineering', activeVersions: '1 Active', inactiveVersions: '—',          students: 124 },
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
          <div><div className="pg-title">Programme Group Master</div><div className="pg-sub">Generic programme names for reporting · Groups all curriculum versions under one umbrella</div></div>
          <button className="btn btn-primary" onClick={() => openModal('new-proggroup-modal')}><i className="lni lni-plus"></i> Add Programme Group</button>
        </div>

        <div className="info-box mb-[18px]">
          <i className="lni lni-information"></i> Programme Groups are used for <strong>high-level reporting</strong> — e.g. searching &quot;BCA&quot; returns all students across BCA 2026 <em>and</em> BCA 2031 versions. This ensures a single generic name links all curriculum versions for aggregate analytics.
        </div>

        <div className="card">
          <div className="card-hdr">
            <div className="card-title"><span className="ctitle-icon"><i className="lni lni-folder"></i></span> Programme Groups</div>
            <button className="btn btn-neu btn-sm"><i className="lni lni-upload"></i> Export</button>
          </div>
          <ScrollTable filters={filters} onResetFilters={() => setFilters({})}>
            <table>
              <thead><tr><th style={{ width: 48 }}></th><th>Group Code</th><th>Group Name</th>{fth('Programme Level', 'level', ["Bachelor's", "Master's", 'PhD', 'Diploma'])}<th>Active Versions</th><th>Inactive Versions</th><th>Total Students</th></tr></thead>
              <tbody>
                {filteredRows.length === 0
                  ? <EmptyState colSpan={999} hasFilters={Object.values(filters).some(v => v.length > 0)} onClearFilters={() => setFilters({})} />
                  : null}
                {filteredRows.map((r, i) => (
                  <tr key={i}>
                    <td><ActionMenu><button className="btn btn-neu btn-sm"><i className="lni lni-pencil"></i> Edit</button></ActionMenu></td>
                    <td className="font-mono text-b700">{r.code}</td>
                    <td><strong>{r.name}</strong></td>
                    <td>{r.level}</td>
                    <td><span className="badge badge-green">{r.activeVersions}</span></td>
                    <td>{r.inactiveVersions === '—' ? '—' : <span className="badge badge-grey">{r.inactiveVersions}</span>}</td>
                    <td>{r.students}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollTable>
        </div>
      </div>
      <ProgrammeGroupModal isOpen={openModals.has('new-proggroup-modal')} onClose={() => closeModal('new-proggroup-modal')} showToast={showToast} />
      <Toast toast={toast} />
    </>
  )
}
