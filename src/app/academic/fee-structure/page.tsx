'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FeeStructureModal } from '@/components/modals/FeeStructureModal'
import { FeeItemModal } from '@/components/modals/FeeItemModal'
import { Toast } from '@/components/Toast'

type FeeItem = { name: string; meta: string; amt: string }
type Semester = { sem: number; year: number; total: string; note: string; items: FeeItem[] }

const INITIAL_SEMESTERS: Semester[] = [
  { sem: 1, year: 1, total: 'UGX 1,250,000', note: '5 fee items · Includes one-time admission', items: [
    { name: 'Admission Fee',          meta: 'One-time · Cleared first',                        amt: 'UGX 150,000' },
    { name: 'Semester Entry Fee',     meta: 'Required before registration',                    amt: 'UGX 200,000' },
    { name: 'Tuition Fee',            meta: '50% needed for assessment · 100% for progression', amt: 'UGX 750,000' },
    { name: 'Lab Fee',                meta: 'Programming + Systems lab access',                 amt: 'UGX 100,000' },
    { name: 'Library & Resources Fee', meta: 'e-Library + physical library',                   amt: 'UGX 50,000'  },
  ]},
  { sem: 2, year: 1, total: 'UGX 1,100,000', note: '4 fee items', items: [
    { name: 'Semester Entry Fee',     meta: 'Required before registration',   amt: 'UGX 200,000' },
    { name: 'Tuition Fee',            meta: '50% needed for assessment',      amt: 'UGX 750,000' },
    { name: 'Lab Fee',                meta: 'Programming lab access',         amt: 'UGX 100,000' },
    { name: 'Library & Resources Fee', meta: 'e-Library + physical library', amt: 'UGX 50,000'  },
  ]},
  { sem: 3, year: 2, total: 'UGX 1,150,000', note: '4 fee items · Industrial Training applicable', items: [
    { name: 'Semester Entry Fee',     meta: 'Required before registration',          amt: 'UGX 200,000' },
    { name: 'Tuition Fee',            meta: '50% needed for assessment',             amt: 'UGX 800,000' },
    { name: 'Industrial Training Fee', meta: 'External placement coordination',      amt: 'UGX 100,000' },
    { name: 'Library & Resources Fee', meta: 'e-Library + physical library',         amt: 'UGX 50,000'  },
  ]},
]

export default function Page() {
  const router = useRouter()
  const [openModals, setOpenModals] = useState<Set<string>>(new Set())
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)
  const [semesters, setSemesters] = useState<Semester[]>(INITIAL_SEMESTERS)

  function nav(id: string) { router.push('/academic/' + id) }
  function openModal(id: string)  { setOpenModals(prev => new Set(prev).add(id)) }
  function closeModal(id: string) { setOpenModals(prev => { const s = new Set(prev); s.delete(id); return s }) }
  function showToast(msg: string, type = '') { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }

  function moveItem(si: number, idx: number, dir: -1 | 1) {
    const to = idx + dir
    setSemesters(prev => prev.map((sem, i) => {
      if (i !== si || to < 0 || to >= sem.items.length) return sem
      const next = [...sem.items]
      ;[next[idx], next[to]] = [next[to], next[idx]]
      return { ...sem, items: next }
    }))
  }

  function removeItem(si: number, idx: number) {
    setSemesters(prev => prev.map((sem, i) =>
      i === si ? { ...sem, items: sem.items.filter((_, j) => j !== idx) } : sem
    ))
    showToast('Fee item removed.', '')
  }

  return (
    <>
      <div className="page active">
        <div className="pg-hdr">
          <div><div className="pg-title">Programme Fee Structure</div><div className="pg-sub">Define fee items per semester · Custom titles · Set priority and base currency · Auto-settlement by priority</div></div>
          <div className="flex gap-2">
            <button className="btn btn-neu" onClick={() => showToast('Fee structure duplicated for next intake.', 'success')}><i className="lni lni-files"></i> Clone Last Year</button>
            <button className="btn btn-primary" onClick={() => openModal('new-fee-structure-modal')}><i className="lni lni-plus"></i> New Fee Structure</button>
          </div>
        </div>

        <div className="fee-prog-selector">
          <div className="fg m-0">
            <div className="lbl">Programme</div>
            <select className="ctrl">
              <option value="bsc-it-local">BSc. IT 2026 — Local (UGX)</option>
              <option value="bsc-it-intl">BSc. IT 2026 — International (USD)</option>
              <option value="mba-intl">MBA 2024 — International (USD)</option>
            </select>
          </div>
          <div className="fg m-0"><div className="lbl">Student Type</div><input className="ctrl bg-[var(--g100)] font-semibold" type="text" defaultValue="Local" readOnly /></div>
          <div className="fg m-0"><div className="lbl">Base Currency</div><input className="ctrl bg-[var(--g100)] font-semibold" type="text" defaultValue="UGX (Ugandan Shilling)" readOnly /></div>
          <button className="btn btn-neu" onClick={() => openModal('new-fee-structure-modal')}><i className="lni lni-cog"></i> Settings</button>
        </div>

        <div className="fee-prog-summary">
          <div className="fee-prog-chip"><div className="fee-prog-chip-lbl">Semesters</div><div className="fee-prog-chip-val">6</div></div>
          <div className="fee-prog-chip"><div className="fee-prog-chip-lbl">Fee Items</div><div className="fee-prog-chip-val">22</div></div>
          <div className="fee-prog-chip"><div className="fee-prog-chip-lbl">Avg / Semester</div><div className="fee-prog-chip-val">UGX 1.08M</div></div>
          <div className="fee-prog-chip grand"><div className="fee-prog-chip-lbl">Programme Total</div><div className="fee-prog-chip-val">UGX 6,500,000</div></div>
        </div>

        <div className="g2 mb-[18px]">
          <div className="info-box"><i className="lni lni-dollar"></i> <span>Within each semester, fee items are <strong>auto-settled by priority</strong> — P1 first, then P2, etc. Local-currency payments are auto-converted to the base currency.</span></div>
          <div className="warn-box"><i className="lni lni-warning"></i> <span><strong>Sponsored students</strong> bypass payment checks for session movement. Sponsorship is separate from scholarships (discounts on tuition).</span></div>
        </div>

        {semesters.map(({ sem, year, total, note, items }, si) => (
          <div key={sem} className="sem-fee-card">
            <div className="sem-fee-hdr">
              <div className="sem-fee-hdr-left">
                <span className="sem-fee-badge">S {sem}</span>
                <div>
                  <div className="sem-fee-title">Semester {sem} — Year {year}</div>
                  <div className="sem-fee-sub">{note}</div>
                </div>
              </div>
              <div className="sem-fee-hdr-right">
                <span className="sem-fee-total-pill">{total}</span>
                <button className="btn btn-neu btn-sm" onClick={() => openModal('new-fee-item-modal')}><i className="lni lni-plus"></i> Add Fee Item</button>
              </div>
            </div>
            <div className="sem-fee-body">
              <div className="sem-fee-items">
                {items.map((item, idx) => (
                  <div key={idx} className="sem-fee-row">
                    {/* Priority arrows + badge */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <button
                          className="btn btn-neu"
                          style={{ width: 22, height: 14, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9 }}
                          onClick={() => moveItem(si, idx, -1)}
                          disabled={idx === 0}
                        ><i className="lni lni-chevron-up"></i></button>
                        <button
                          className="btn btn-neu"
                          style={{ width: 22, height: 14, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9 }}
                          onClick={() => moveItem(si, idx, 1)}
                          disabled={idx === items.length - 1}
                        ><i className="lni lni-chevron-down"></i></button>
                      </div>
                      <span className="sem-fee-pri">P{idx + 1}</span>
                    </div>

                    <div><div className="sem-fee-name">{item.name}</div><div className="sem-fee-name-meta">{item.meta}</div></div>
                    <span className="sem-fee-amt">{item.amt}</span>
                    <div className="sem-fee-act">
                      <button className="btn btn-neu btn-sm" onClick={() => openModal('new-fee-item-modal')}><i className="lni lni-pencil"></i></button>
                      <button className="btn btn-neu btn-sm" onClick={() => removeItem(si, idx)}><i className="lni lni-trash-can"></i></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}

        <div className="text-center mt-[6px]">
          <button className="sem-fee-add" onClick={() => showToast('Use Settings → Add Semester to define a new semester.', 'info')}>
            <i className="lni lni-plus"></i> Add New Semester
          </button>
        </div>
      </div>
      <FeeStructureModal isOpen={openModals.has('new-fee-structure-modal')} onClose={() => closeModal('new-fee-structure-modal')} showToast={showToast} />
      <FeeItemModal isOpen={openModals.has('new-fee-item-modal')} onClose={() => closeModal('new-fee-item-modal')} showToast={showToast} />
      <Toast toast={toast} />
    </>
  )
}
