'use client'
import { useState } from 'react'
import { ScrollTable } from '@/components/ScrollTable'
import { Toast } from '@/components/Toast'

// Ported from isbat_student_module.html's Specialization Management page —
// student specializations + fee discounts, distinct from the unrelated
// /config/specialization course-catalog master. No backend contract exists
// for either table here — page-local mock state only.
interface SpecRow { id: number; name: string; programme: string; students: number }
interface DiscountRow { id: number; name: string; pct: number; badge: string; appliesTo: string }

const INITIAL_SPECS: SpecRow[] = [
  { id: 1, name: 'Software Engineering', programme: 'BSc. IT', students: 34 },
  { id: 2, name: 'Network & Security', programme: 'BSc. IT', students: 22 },
  { id: 3, name: 'Finance Track', programme: 'MBA', students: 14 },
  { id: 4, name: 'HR Management', programme: 'BBA', students: 18 },
]

const INITIAL_DISCOUNTS: DiscountRow[] = [
  { id: 1, name: 'Early Bird', pct: 10, badge: 'badge-green', appliesTo: 'Final tuition installment' },
  { id: 2, name: 'Sibling', pct: 5, badge: 'badge-blue', appliesTo: 'Final tuition installment' },
  { id: 3, name: 'Staff Child', pct: 25, badge: 'badge-amber', appliesTo: 'Final tuition installment' },
]

export default function Page() {
  const [specs] = useState(INITIAL_SPECS)
  const [discounts, setDiscounts] = useState(INITIAL_DISCOUNTS)
  const [addOpen, setAddOpen] = useState<'spec' | 'discount' | null>(null)
  const [name, setName] = useState('')
  const [pct, setPct] = useState(0)
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)

  function showToast(msg: string, type = '') { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }

  function openAdd(kind: 'spec' | 'discount') { setAddOpen(kind); setName(''); setPct(0) }

  function saveAdd() {
    if (!name.trim()) return
    if (addOpen === 'discount') {
      setDiscounts(prev => [...prev, { id: Date.now(), name: name.trim(), pct, badge: 'badge-grey', appliesTo: 'Final tuition installment' }])
    }
    showToast(addOpen === 'spec' ? 'Specialization added' : 'Discount added', 'ok')
    setAddOpen(null)
  }

  return (
    <>
      <div className="page active">
        <div className="pg-hdr">
          <div><div className="pg-title">Specialization Management</div><div className="pg-sub">Manage student specializations and discount assignments</div></div>
          <button className="btn btn-primary" onClick={() => openAdd('spec')}><i className="lni lni-plus"></i> Add Specialization</button>
        </div>
        <div className="g2">
          <div className="card">
            <div className="card-hdr"><div className="card-title"><i className="lni lni-graduation"></i> Specializations</div></div>
            <ScrollTable>
              <table>
              <thead><tr><th>Specialization</th><th>Programme</th><th>Students</th><th></th></tr></thead>
              <tbody>
                {specs.map(s => (
                  <tr key={s.id}><td><strong>{s.name}</strong></td><td>{s.programme}</td><td>{s.students}</td><td><button className="btn btn-neu btn-sm">Edit</button></td></tr>
                ))}
              </tbody>
              </table>
            </ScrollTable>
          </div>
          <div className="card">
            <div className="card-hdr"><div className="card-title"><i className="lni lni-tag"></i> Discount Management</div><button className="btn btn-primary btn-sm" onClick={() => openAdd('discount')}><i className="lni lni-plus"></i> Add</button></div>
            <ScrollTable>
              <table>
              <thead><tr><th>Discount Type</th><th>% Off</th><th>Applies To</th><th></th></tr></thead>
              <tbody>
                {discounts.map(d => (
                  <tr key={d.id}><td><strong>{d.name}</strong></td><td><span className={`badge ${d.badge}`}>{d.pct}%</span></td><td>{d.appliesTo}</td><td><button className="btn btn-neu btn-sm">Edit</button></td></tr>
                ))}
              </tbody>
              </table>
            </ScrollTable>
            <div className="info-box mt-3"><i className="lni lni-information" style={{ color: 'var(--b700)', fontSize: 15, flexShrink: 0 }}></i><div style={{ fontSize: 12 }}>Discounts apply only to the <strong>final tuition installment</strong> of a semester — not to registration, admission, or entry fees.</div></div>
          </div>
        </div>
      </div>

      {addOpen && (
        <div className="modal-overlay open" onClick={() => setAddOpen(null)}>
          <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-hdr"><div className="modal-title">{addOpen === 'spec' ? 'Add Specialization' : 'Add Discount'}</div><button className="modal-close" onClick={() => setAddOpen(null)}>✕</button></div>
            <div>
              <div className="fg"><label className="lbl">Name <span className="req">*</span></label><input className="ctrl" placeholder="Name" value={name} onChange={e => setName(e.target.value)} /></div>
              {addOpen === 'discount' && (
                <div className="fg"><label className="lbl">% Off <span className="req">*</span></label><input className="ctrl" type="number" min={0} max={100} value={pct} onChange={e => setPct(Number(e.target.value))} /></div>
              )}
            </div>
            <div className="modal-footer"><button className="btn btn-neu" onClick={() => setAddOpen(null)}>Cancel</button><button className="btn btn-primary" disabled={!name.trim()} onClick={saveAdd}>Save</button></div>
          </div>
        </div>
      )}
      <Toast toast={toast} />
    </>
  )
}
