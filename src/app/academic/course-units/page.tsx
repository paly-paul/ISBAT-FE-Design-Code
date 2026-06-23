'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ScrollTable } from '@/components/ScrollTable'
import { ActionMenu } from '@/components/ActionMenu'
import { CourseUnitModal } from '@/components/modals/CourseUnitModal'
import { EditCourseUnitModal } from '@/components/modals/EditCourseUnitModal'
import { ElectiveSelectModal } from '@/components/modals/ElectiveSelectModal'
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
    { code: 'IT101',      name: 'Introduction to Programming',                    programme: 'BSc. IT', sem: 'Sem 1', credits: 3, unitType: 'Theory',    category: 'Core',                  hasCW: 'Yes', hasCBT: 'Yes', proration: 'CW25→15 / CBT50→15 / UE100→70',             syllabus: 'Attached', syllabusOk: true,  rowClass: '', variant: 'edit' },
    { code: 'IT102',      name: 'Computer Organisation',                          programme: 'BSc. IT', sem: 'Sem 1', credits: 3, unitType: 'Theory',    category: 'Core',                  hasCW: 'Yes', hasCBT: 'No',  proration: 'CW25→15 / UE100→70',                        syllabus: 'Attached', syllabusOk: true,  rowClass: '', variant: 'edit' },
    { code: 'IT104',      name: 'Programming Lab',                                programme: 'BSc. IT', sem: 'Sem 1', credits: 2, unitType: 'Practical', category: 'Core',                  hasCW: 'Yes', hasCBT: 'No',  proration: 'CW25→15 / Practical UE',                     syllabus: 'Attached', syllabusOk: true,  rowClass: '', variant: 'edit' },
    { code: 'IT105',      name: 'Systems & Lab (Combined)',                       programme: 'BSc. IT', sem: 'Sem 2', credits: 4, unitType: 'Combined',  category: 'Core',                  hasCW: 'Yes', hasCBT: 'Yes', proration: 'Theory IA + Practical UE (no Practical IA)', syllabus: 'Attached', syllabusOk: true,  rowClass: '', variant: 'edit' },
    { code: 'MBA501',     name: 'MBA Internship Project',                         programme: 'MBA',     sem: 'Sem 4', credits: 6, unitType: 'Project',   category: 'Core',                  hasCW: 'No',  hasCBT: 'No',  proration: 'Evaluated after 2 months',                   syllabus: 'Attached', syllabusOk: true,  rowClass: '', variant: 'edit' },
    { code: 'MBA301-FIN', name: 'Financial Risk Management',                      programme: 'MBA',     sem: 'Sem 3', credits: 3, unitType: 'Theory',    category: 'Specialization',        hasCW: 'Yes', hasCBT: 'Yes', proration: 'CW25→15 / CBT50→15 / UE100→70',             syllabus: 'Attached', syllabusOk: true,  rowClass: '', variant: 'edit' },
    { code: 'IT-ELEC-1',  name: 'Elective: Remote Sensing / Renewable Energy / Radar Nav.', programme: 'BSc. IT', sem: 'Sem 5', credits: 3, unitType: 'Theory', category: 'Elective (batch-level)', hasCW: 'Yes', hasCBT: 'Yes', proration: 'CW25→15 / CBT50→15 / UE100→70', syllabus: 'Pending Selection', syllabusOk: false, rowClass: '', variant: 'elective' },
    { code: 'BBA301',     name: 'Strategic Management',                           programme: 'BBA',     sem: 'Sem 3', credits: 4, unitType: 'Theory',    category: 'Core',                  hasCW: 'Yes', hasCBT: 'Yes', proration: 'CW25→15 / CBT50→15 / UE100→70',             syllabus: 'Missing',  syllabusOk: false, rowClass: 'flagged', variant: 'syllabus' },
    { code: 'IT103',      name: 'Engineering Maths I',                            programme: 'BSc. IT', sem: 'Sem 1', credits: 3, unitType: 'Theory',    category: 'Core',                  hasCW: 'No',  hasCBT: 'No',  proration: 'UE100→100',                                  syllabus: 'Attached', syllabusOk: true,  rowClass: '', variant: 'edit' },
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

  function cwBadge(val: string, isPractical?: boolean) {
    if (val === 'Yes') return <span className="badge badge-green"><i className="lni lni-checkmark"></i></span>
    if (isPractical) return <span className="badge badge-red"><i className="lni lni-close"></i> (Practical — no CBT)</span>
    return <span className="badge badge-red"><i className="lni lni-close"></i></span>
  }

  function cbtBadge(r: typeof rows[0]) {
    if (r.hasCBT === 'Yes' && r.unitType === 'Combined') return <span className="badge badge-green"><i className="lni lni-checkmark"></i> (Theory only)</span>
    if (r.hasCBT === 'Yes') return <span className="badge badge-green"><i className="lni lni-checkmark"></i></span>
    if (r.unitType === 'Practical') return <span className="badge badge-red"><i className="lni lni-close"></i> (Practical — no CBT)</span>
    return <span className="badge badge-red"><i className="lni lni-close"></i></span>
  }

  function typeBadge(t: string) {
    if (t === 'Theory') return <span className="badge badge-blue">Theory</span>
    if (t === 'Practical') return <span className="badge badge-green">Practical</span>
    if (t === 'Combined') return <span className="badge badge-amber">Combined</span>
    return <span className="badge badge-purple">Project</span>
  }

  function catBadge(c: string) {
    if (c === 'Specialization') return <span className="badge badge-cyan">Specialization</span>
    if (c === 'Elective (batch-level)') return <span className="badge badge-amber">Elective (batch-level)</span>
    return <span className="badge badge-grey">Core</span>
  }

  return (
    <>
      <div className="page active">
        <div className="pg-hdr">
          <div><div className="pg-title">Course Units Master (Curriculum)</div><div className="pg-sub">Define subjects per semester · Set Unit Type and Category · Attach approved syllabus · Configure assessment components</div></div>
          <button className="btn btn-primary" onClick={() => openModal('cu-new-modal')}><i className="lni lni-plus"></i> Add Course Unit</button>
        </div>
        <div className="g2 mb-[14px]">
          <div className="info-box"><i className="lni lni-clipboard"></i> Assessment proration: <strong>CW 25→15 · CBT 50→15 · UE 100→70.</strong> Total credits across all semesters must meet the programme&apos;s <strong>minimum credit load</strong> (e.g. 132 for BBA). All units must align with approved syllabus from <strong>NCHE or UVTOP</strong>.</div>
          <div className="info-box"><i className="lni lni-target"></i> <strong>Unit Type</strong> controls assessment: Theory (IA+UA) · Practical (CW only, no CBT) · Combined (Theory IA + Practical exam, no Practical IA) · Project (student-led, evaluated after set timeframe). <strong>Unit Category</strong>: Core (all students) · Specialization (specific specialization students) · Elective (one paper selected per batch for the session).</div>
        </div>
        <div className="card mb-[14px]">
          <div className="card-hdr"><div className="card-title"><span className="ctitle-icon"><i className="lni lni-key"></i></span> Unit Type → Assessment Component Rules</div></div>
          <div className="g4">
            <div className="p-3 bg-b50 border-b100 rounded-[var(--rsm)]" style={{ border: '1.5px solid' }}><div className="font-bold text-b700 mb-[6px]" style={{ fontSize: 'var(--fs-xs)' }}><i className="lni lni-book"></i> THEORY</div><div style={{ fontSize: 'var(--fs-sm)', color: 'var(--g700)' }}>Internal Assessment: <strong>CW + CBT</strong></div><div style={{ fontSize: 'var(--fs-sm)', color: 'var(--g700)' }}>University Assessment: <strong>UE Paper</strong></div></div>
            <div className="p-3 bg-[var(--green-bg)] rounded-[var(--rsm)]" style={{ border: '1.5px solid var(--green-bd)' }}><div className="font-bold text-clr-green mb-[6px]" style={{ fontSize: 'var(--fs-xs)' }}><i className="lni lni-microscope"></i> PRACTICAL</div><div style={{ fontSize: 'var(--fs-sm)', color: 'var(--g700)' }}>Internal Assessment: <strong>CW only</strong> (no CBT)</div><div style={{ fontSize: 'var(--fs-sm)', color: 'var(--g700)' }}>University Assessment: <strong>Practical Exam</strong></div></div>
            <div className="p-3 bg-[var(--amber-bg)] rounded-[var(--rsm)]" style={{ border: '1.5px solid var(--amber-bd)' }}><div className="font-bold text-clr-amber mb-[6px]" style={{ fontSize: 'var(--fs-xs)' }}><i className="lni lni-bulb"></i> COMBINED</div><div style={{ fontSize: 'var(--fs-sm)', color: 'var(--g700)' }}>Theory IA: <strong>CW + CBT</strong></div><div style={{ fontSize: 'var(--fs-sm)', color: 'var(--g700)' }}>Practical: <strong>No IA</strong>, separate exam only</div></div>
            <div className="p-3 bg-[var(--purple-bg)] rounded-[var(--rsm)]" style={{ border: '1.5px solid var(--purple-bd)' }}><div className="font-bold mb-[6px]" style={{ fontSize: 'var(--fs-xs)', color: 'var(--purple)' }}><i className="lni lni-rocket"></i> PROJECT</div><div style={{ fontSize: 'var(--fs-sm)', color: 'var(--g700)' }}>Student-led work (internship / project)</div><div style={{ fontSize: 'var(--fs-sm)', color: 'var(--g700)' }}>Evaluated after set timeframe (e.g. 2 months)</div></div>
          </div>
        </div>
        <div className="card">
          <div className="card-hdr">
            <div className="card-title"><span className="ctitle-icon"><i className="lni lni-book"></i></span> Course Unit Master</div>
            <div className="flex gap-2">
              <select className="ctrl w-auto text-[var(--fs-sm)]"><option>All Programmes</option><option>BSc. IT</option><option>BBA</option><option>BEng. Civil</option><option>MBA</option></select>
              <select className="ctrl w-auto text-[var(--fs-sm)]"><option>All Semesters</option><option>Semester 1</option><option>Semester 2</option><option>Semester 3</option></select>
              <select className="ctrl w-auto text-[var(--fs-sm)]"><option>All Types</option><option>Theory</option><option>Practical</option><option>Combined</option><option>Project</option></select>
              <button className="btn btn-neu btn-sm"><i className="lni lni-upload"></i> Export</button>
            </div>
          </div>
          <ScrollTable>
            <table>
              <thead><tr><th style={{ width: 48 }}></th><th>Code</th><th>Unit Name</th>{fth('Programme', 'programme', ['BSc. IT', 'BBA', 'MBA'])}{fth('Sem', 'sem', ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5'])}<th>Credits</th>{fth('Unit Type', 'unitType', ['Theory', 'Practical', 'Combined', 'Project'])}{fth('Category', 'category', ['Core', 'Specialization', 'Elective (batch-level)'])}{fth('Has CW', 'hasCW', ['Yes', 'No'])}{fth('Has CBT', 'hasCBT', ['Yes', 'No'])}<th>Proration</th><th>Syllabus</th></tr></thead>
              <tbody>
                {filteredRows.map((r, i) => (
                  <tr key={i} className={r.rowClass}>
                    <td>
                      {r.variant === 'edit' && (
                        <ActionMenu>
                          <button className="btn btn-neu btn-sm" onClick={() => openModal('cu-edit-modal')}><i className="lni lni-pencil"></i> Edit</button>
                        </ActionMenu>
                      )}
                      {r.variant === 'elective' && (
                        <ActionMenu>
                          <button className="btn btn-neu btn-sm" onClick={() => openModal('cu-edit-modal')}><i className="lni lni-pencil"></i> Edit</button>
                          <button className="btn btn-amber btn-sm" onClick={() => openModal('elective-select-modal')}>Select Paper →</button>
                        </ActionMenu>
                      )}
                      {r.variant === 'syllabus' && (
                        <ActionMenu>
                          <button className="btn btn-neu btn-sm" onClick={() => openModal('cu-edit-modal')}><i className="lni lni-pencil"></i> Edit</button>
                          <button className="btn btn-amber btn-sm" onClick={() => openModal('cu-edit-modal')}>Upload Syllabus</button>
                        </ActionMenu>
                      )}
                    </td>
                    <td className="font-mono text-b700" style={{ fontSize: 'var(--fs-xs)' }}>{r.code}</td>
                    <td><strong>{r.name}</strong></td>
                    <td>{r.programme}</td>
                    <td><span className="pill pill-blue">{r.sem}</span></td>
                    <td>{r.credits}</td>
                    <td>{typeBadge(r.unitType)}</td>
                    <td>{catBadge(r.category)}</td>
                    <td>{cwBadge(r.hasCW)}</td>
                    <td>{cbtBadge(r)}</td>
                    <td className="font-mono text-[var(--fs-xs)]">{r.proration}</td>
                    <td>
                      {r.syllabusOk
                        ? <span className="badge badge-green">Attached</span>
                        : r.syllabus === 'Pending Selection'
                          ? <span className="badge badge-amber"><i className="lni lni-warning"></i> Pending Selection</span>
                          : <span className="badge badge-red"><i className="lni lni-warning"></i> Missing</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollTable>
        </div>
      </div>
      <CourseUnitModal     isOpen={openModals.has('cu-new-modal')}  onClose={() => closeModal('cu-new-modal')}  showToast={showToast} />
      <EditCourseUnitModal isOpen={openModals.has('cu-edit-modal')} onClose={() => closeModal('cu-edit-modal')} showToast={showToast} />
      <ElectiveSelectModal isOpen={openModals.has('elective-select-modal')} onClose={() => closeModal('elective-select-modal')} showToast={showToast} />
      <Toast toast={toast} />
    </>
  )
}
