'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ScrollTable } from '@/components/ScrollTable'
import { ActionMenu } from '@/components/ActionMenu'
import { ProgrammeModal } from '@/components/modals/ProgrammeModal'
import { SpecializationModal } from '@/components/modals/SpecializationModal'
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
    { progCode: 'BCA-2026',    progName: 'Bachelor of Computer Appl. 2026',       group: 'BCA', level: "Bachelor's · 3yr / 6sem", faculty: 'FCT → Main Campus', accredDate: 'Jan 2026', expires: 'Jan 2031',         expiresBadge: 'badge-green', expiresIcon: '',                        noIA: 'No',  specializations: '—',                    admissionStatus: 'Active',   admissionBadge: 'badge-green', rowClass: '', variant: 'edit' },
    { progCode: 'BCA-2021',    progName: 'Bachelor of Computer Appl. 2021',       group: 'BCA', level: "Bachelor's · 3yr / 6sem", faculty: 'FCT → Main Campus', accredDate: 'Jan 2021', expires: 'Jan 2026 — Retired', expiresBadge: 'badge-grey',  expiresIcon: '',                        noIA: 'No',  specializations: '—',                    admissionStatus: 'Inactive',  admissionBadge: 'badge-grey',  rowClass: '', variant: 'view' },
    { progCode: 'BBA-2021',    progName: 'BBA Business Administration 2021',      group: 'BBA', level: "Bachelor's · 3yr / 6sem", faculty: 'FBM → Main Campus', accredDate: 'Oct 2021', expires: 'Oct 2026 — Expiring Soon', expiresBadge: 'badge-red', expiresIcon: 'lni lni-warning',  noIA: 'No',  specializations: '—',                    admissionStatus: 'Active',   admissionBadge: 'badge-green', rowClass: 'flagged', variant: 'renew' },
    { progCode: 'MBA-2024',    progName: 'MBA Business Administration 2024',      group: 'MBA', level: "Master's · 2yr / 4sem",  faculty: 'FBM → Main Campus', accredDate: 'Mar 2024', expires: 'Mar 2029',         expiresBadge: 'badge-green', expiresIcon: '',                        noIA: 'No',  specializations: '3 Specializations',   admissionStatus: 'Active',   admissionBadge: 'badge-green', rowClass: '', variant: 'editspec' },
    { progCode: 'PHD-CS-2023', progName: 'Doctor of Philosophy — CS 2023',       group: '—',   level: 'PhD · 3yr / 6sem',       faculty: 'FCT → Main Campus', accredDate: 'Jun 2023', expires: 'Jun 2028',         expiresBadge: 'badge-green', expiresIcon: '',                        noIA: 'Yes', specializations: '—',                    admissionStatus: 'Active',   admissionBadge: 'badge-green', rowClass: '', variant: 'edit' },
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
          <div><div className="pg-title">Programme Master</div><div className="pg-sub">Define programme versions · Manage active/inactive status · Accreditation tracking · Specializations</div></div>
          <button className="btn btn-primary" onClick={() => openModal('new-prog-modal')}><i className="lni lni-plus"></i> Add Programme Version</button>
        </div>

        <div className="flex items-center gap-2 mb-[18px] flex-wrap">
          <button className="btn btn-neu btn-sm text-[var(--fs-xs)]" onClick={() => nav('a-level-master')}><i className="lni lni-graduation"></i> Programme Level</button>
          <span className="text-g300 text-[var(--fs-2xl)]">→</span>
          <button className="btn btn-neu btn-sm text-[var(--fs-xs)]" onClick={() => nav('programme-group')}><i className="lni lni-folder"></i> Programme Group</button>
          <span className="text-g300 text-[var(--fs-2xl)]">→</span>
          <span className="bg-b50 border-[1.5px] border-[var(--b200)] rounded-[var(--rxs)] py-[5px] px-3 text-[var(--fs-xs)] font-bold text-b700"><i className="lni lni-graduation"></i> Programme Master ← You are here</span>
          <span className="text-g300 text-[var(--fs-2xl)]">→</span>
          <button className="btn btn-neu btn-sm text-[var(--fs-xs)]" onClick={() => nav('course-units')}><i className="lni lni-book"></i> Course Units</button>
        </div>

        <div className="warn-box mb-[18px]">
          <i className="lni lni-warning"></i> <span><strong>Versioning Rule:</strong> NCHE mandates a minimum 30–50% curriculum change every 5 years for reaccreditation. Old versions (e.g. BCA 2026) must remain <em>Inactive</em> so existing students continue on their curriculum. New versions (e.g. BCA 2031) are set <em>Active</em> for new admissions only.</span>
        </div>

        <div className="danger-box mb-[14px]">
          <i className="lni lni-volume-high"></i> <span><strong>Accreditation Alert:</strong> BBA 2021 version expires in <strong>6 months (Oct 2026)</strong>. Start NCHE reaccreditation process and prepare BBA 2027 curriculum version. <button className="btn btn-neu btn-sm ml-2" onClick={() => nav('programme-master')}>View →</button></span>
        </div>

        <div className="card">
          <div className="card-hdr">
            <div className="card-title"><span className="ctitle-icon"><i className="lni lni-graduation"></i></span> All Programme Versions</div>
            <div className="flex gap-2">
              <select className="ctrl w-auto text-[var(--fs-sm)]"><option>All Levels</option><option>Bachelor&apos;s</option><option>Master&apos;s</option><option>PhD</option><option>Diploma</option></select>
              <select className="ctrl w-auto text-[var(--fs-sm)]"><option>All Statuses</option><option>Active</option><option>Inactive</option></select>
              <button className="btn btn-neu btn-sm"><i className="lni lni-upload"></i> Export</button>
            </div>
          </div>
          <ScrollTable>
            <table>
              <thead><tr><th style={{ width: 48 }}></th><th>Prog. Code</th><th>Programme Name</th>{fth('Group', 'group', ['BCA', 'BBA', 'MBA', '—'])}{fth('Programme Level', 'level', ["Bachelor's · 3yr / 6sem", "Master's · 2yr / 4sem", 'PhD · 3yr / 6sem'])}<th>Faculty → Campus</th><th>Accreditation Date</th><th>Expires</th><th>No IA</th><th>Specializations</th>{fth('Admission Status', 'admissionStatus', ['Active', 'Inactive'])}</tr></thead>
              <tbody>
                {filteredRows.map((r, i) => (
                  <tr key={i} className={r.rowClass}>
                    <td>
                      {r.variant === 'edit' && (
                        <ActionMenu>
                          <button className="btn btn-neu btn-sm" onClick={() => openModal('new-prog-modal')}><i className="lni lni-pencil"></i> Edit</button>
                          <button className="btn btn-neu btn-sm" onClick={() => nav('course-units')}><i className="lni lni-book"></i> Curriculum</button>
                        </ActionMenu>
                      )}
                      {r.variant === 'view' && (
                        <ActionMenu>
                          <button className="btn btn-neu btn-sm"><i className="lni lni-eye"></i> View</button>
                        </ActionMenu>
                      )}
                      {r.variant === 'renew' && (
                        <ActionMenu>
                          <button className="btn btn-amber btn-sm" onClick={() => openModal('new-prog-modal')}><i className="lni lni-warning"></i> Renew</button>
                          <button className="btn btn-primary btn-sm" onClick={() => openModal('new-prog-modal')}><i className="lni lni-plus"></i> New Version</button>
                        </ActionMenu>
                      )}
                      {r.variant === 'editspec' && (
                        <ActionMenu>
                          <button className="btn btn-neu btn-sm" onClick={() => openModal('new-prog-modal')}><i className="lni lni-pencil"></i> Edit</button>
                          <button className="btn btn-neu btn-sm" onClick={() => openModal('specialization-modal')}><i className="lni lni-target"></i> Specializations</button>
                        </ActionMenu>
                      )}
                    </td>
                    <td className={`font-mono text-[var(--fs-xs)] ${r.admissionStatus === 'Inactive' ? 'text-g400' : 'text-b700'}`}>{r.progCode}</td>
                    <td>{r.admissionStatus === 'Active' ? <strong>{r.progName}</strong> : r.progName}</td>
                    <td>{r.group}</td>
                    <td>{r.level}</td>
                    <td>{r.faculty}</td>
                    <td>{r.accredDate}</td>
                    <td>
                      <span className={`badge ${r.expiresBadge}`}>
                        {r.expiresIcon && <i className={r.expiresIcon}></i>} {r.expires}
                      </span>
                    </td>
                    <td>
                      {r.noIA === 'Yes'
                        ? <span className="badge badge-amber"><i className="lni lni-checkmark"></i> No Internal Assessment</span>
                        : <span className="badge badge-grey">No</span>
                      }
                    </td>
                    <td>
                      {r.specializations === '—' ? '—' : <span className="badge badge-blue">{r.specializations}</span>}
                    </td>
                    <td>
                      {r.admissionStatus === 'Active'
                        ? <span className={`badge ${r.admissionBadge}`}><span className="bdot"></span>Active</span>
                        : <span className="badge badge-grey">Inactive (existing students only)</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollTable>
        </div>
      </div>
      <ProgrammeModal isOpen={openModals.has('new-prog-modal')} onClose={() => closeModal('new-prog-modal')} showToast={showToast} />
      <SpecializationModal isOpen={openModals.has('specialization-modal')} onClose={() => closeModal('specialization-modal')} showToast={showToast} />
      <Toast toast={toast} />
    </>
  )
}
