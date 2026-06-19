'use client'
import { useState } from 'react'
import { ModalProps } from './types'
import { SuccessPopup } from './SuccessPopup'

/* ─────────────────────────────────────────────────────────
   OLD MODAL (commented out — kept for reference)
   ─────────────────────────────────────────────────────────
export function FeeStructureModal_OLD({ isOpen, onClose, showToast }: ModalProps) {
  if (!isOpen) return null
  return (
    <div className="modal-overlay open" id="new-fee-structure-modal" onClick={onClose}>
      <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr">
          <div className="modal-title"><i className="lni lni-dollar"></i> Add / Edit Fee Structure</div>
          <button className="modal-close" onClick={onClose}><i className="lni lni-close"></i></button>
        </div>
        <div className="g3">
          <div className="fg">
            <div className="lbl">Programme <span className="req">*</span></div>
            <select className="ctrl"><option>BSc. IT 2026</option><option>BBA 2021</option><option>MBA 2024</option></select>
          </div>
          <div className="fg">
            <div className="lbl">Student Type <span className="req">*</span></div>
            <select className="ctrl"><option>Local</option><option>International</option></select>
          </div>
          <div className="fg">
            <div className="lbl">Base Currency <span className="req">*</span></div>
            <select className="ctrl"><option>UGX (Ugandan Shilling)</option><option>USD (US Dollar)</option><option>KES (Kenyan Shilling)</option></select>
          </div>
        </div>
        <div className="sec-divider">Fee Components (Priority Order)</div>
        <div className="info-box mb-3"><i className="lni lni-bulb"></i> Payments are auto-settled in priority order — Priority 1 fully cleared before Priority 2, and so on. Payments in local currency are auto-converted to the base currency.</div>
        <div id="fee-components-list" className="flex flex-col gap-2 mb-3">
          <div className="grid grid-cols-[60px_1fr_160px_90px] gap-[10px] items-center p-[10px_12px] bg-surface border-[1.5px] border-g200 rounded-[var(--rxs)]">
            <div><span className="badge badge-grey font-mono">P1</span></div>
            <div className="fg m-0"><input className="ctrl" type="text" defaultValue="Admission Fee" placeholder="Component name" /></div>
            <div className="fg m-0"><input className="ctrl" type="number" defaultValue={50000} placeholder="Amount" /></div>
            <button className="btn btn-danger btn-sm"><i className="lni lni-trash-can"></i> Remove</button>
          </div>
          <div className="grid grid-cols-[60px_1fr_160px_90px] gap-[10px] items-center p-[10px_12px] bg-surface border-[1.5px] border-g200 rounded-[var(--rxs)]">
            <div><span className="badge badge-grey font-mono">P2</span></div>
            <div className="fg m-0"><input className="ctrl" type="text" defaultValue="Registration Fee" placeholder="Component name" /></div>
            <div className="fg m-0"><input className="ctrl" type="number" defaultValue={200000} placeholder="Amount" /></div>
            <button className="btn btn-danger btn-sm"><i className="lni lni-trash-can"></i> Remove</button>
          </div>
          <div className="grid grid-cols-[60px_1fr_160px_90px] gap-[10px] items-center p-[10px_12px] bg-surface border-[1.5px] border-g200 rounded-[var(--rxs)]">
            <div><span className="badge badge-grey font-mono">P3</span></div>
            <div className="fg m-0"><input className="ctrl" type="text" defaultValue="Tuition Fee" placeholder="Component name" /></div>
            <div className="fg m-0"><input className="ctrl" type="number" defaultValue={750000} placeholder="Amount" /></div>
            <button className="btn btn-danger btn-sm"><i className="lni lni-trash-can"></i> Remove</button>
          </div>
        </div>
        <button className="btn btn-neu btn-sm"><i className="lni lni-plus"></i> Add Fee Component</button>
        <div className="modal-footer">
          <button className="btn btn-neu" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => { onClose(); showToast('Fee structure saved.', 'success') }}><i className="lni lni-checkmark"></i> Save Fee Structure</button>
        </div>
      </div>
    </div>
  )
}
   ───────────────────────────────────────────────────────── */

const CURRENCIES = ['UGX', 'USD', 'KES', 'EUR', 'GBP']
const LEDGERS = [
  'Tuition Fee', 'Examination Fee', 'Registration Fee', 'Library Fee',
  'Lab Fee', 'Activity Fee', 'Development Fund', 'Caution Money', 'ICT Fee', 'Other',
]
const NUM_SEMS = 6

type FeeItem = { id: number; title: string; amount: string; currency: string; ledger: string }
type SemFees = FeeItem[][]

function blankItem(id: number): FeeItem {
  return { id, title: '', amount: '', currency: 'UGX', ledger: 'Tuition Fee' }
}

const DEFAULT_FEES: SemFees = Array.from({ length: NUM_SEMS }, (_, i) =>
  i === 0
    ? [
        { id: 1, title: 'Tuition Fee',       amount: '750000', currency: 'UGX', ledger: 'Tuition Fee'      },
        { id: 2, title: 'Semester Entry Fee', amount: '50000',  currency: 'UGX', ledger: 'Registration Fee' },
      ]
    : []
)

let nextId = 200

export function FeeStructureModal({ isOpen, onClose, showToast }: ModalProps) {
  const [saved, setSaved]     = useState(false)
  const [semFees, setSemFees] = useState<SemFees>(DEFAULT_FEES)

  if (!isOpen) return null

  function handleClose() { setSaved(false); setSemFees(DEFAULT_FEES); onClose() }

  function addItem(si: number) {
    setSemFees(prev => prev.map((items, i) => i === si ? [...items, blankItem(nextId++)] : items))
  }
  function removeItem(si: number, id: number) {
    setSemFees(prev => prev.map((items, i) => i === si ? items.filter(f => f.id !== id) : items))
  }
  function updateItem(si: number, id: number, field: keyof FeeItem, val: string) {
    setSemFees(prev => prev.map((items, i) =>
      i === si ? items.map(f => f.id === id ? { ...f, [field]: val } : f) : items
    ))
  }
  function moveItem(si: number, idx: number, dir: -1 | 1) {
    const to = idx + dir
    setSemFees(prev => prev.map((items, i) => {
      if (i !== si || to < 0 || to >= items.length) return items
      const next = [...items];
      [next[idx], next[to]] = [next[to], next[idx]]
      return next
    }))
  }

  if (saved) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <SuccessPopup title="Fee Structure Saved!" subtitle="The semester-wise fee structure has been saved successfully." onClose={handleClose} />
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay open" id="new-fee-structure-modal" onClick={handleClose}>
      <div className="modal modal-80 modal-flex" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr">
          <div className="modal-title"><i className="lni lni-dollar"></i> Add / Edit Fee Structure</div>
          <button className="modal-close" onClick={handleClose}><i className="lni lni-close"></i></button>
        </div>

        <div className="modal-scroll">
          <div className="mdl-section mdl-section--blue">
            <div className="mdl-section-hdr">
              <span className="mdl-section-icon"><i className="lni lni-dollar"></i></span>
              <div className="flex-1 min-w-0">
                <div className="mdl-section-title">Define Fee Items by Semester</div>
                <div className="mdl-section-sub">Add fee items per semester with Ledger, Currency and priority ordering.</div>
              </div>
            </div>

            {/* Global fee controls */}
            <div className="g3 mb-[14px]">
              <div className="fg m-0">
                <div className="lbl">Base Currency</div>
                <select className="ctrl">
                  <option>UGX (Ugandan Shilling)</option>
                  <option>USD (US Dollar)</option>
                  <option>KES (Kenyan Shilling)</option>
                </select>
              </div>
              <div className="fg m-0">
                <div className="lbl">Student Type</div>
                <select className="ctrl"><option>Local</option><option>International</option></select>
              </div>
              <div className="fg m-0">
                <div className="lbl">Quick Template</div>
                <select className="ctrl">
                  <option value="">— Apply a template —</option>
                  <option>Basic (Tuition + Entry)</option>
                  <option>Standard (Tuition + Entry + Lab)</option>
                  <option>Full (Tuition + Entry + Lab + Library + Admission)</option>
                  <option>Clear all fee items</option>
                </select>
              </div>
            </div>

            {/* Programme-level fees */}
            <div className="bg-[linear-gradient(135deg,#f0f5ff_0%,var(--white)_70%)] border-[1.5px] border-dashed border-[var(--b200)] rounded-[var(--rsm)] p-[14px_16px] mb-[18px]">
              <div className="flex items-center gap-2 font-bold uppercase mb-3" style={{ fontSize: 'var(--fs-xs)', letterSpacing: '.08em', color: '#2d448f' }}>
                <i className="lni lni-tag" style={{ fontSize: 'var(--fs-md)' }}></i>
                <span>Programme-level Fees &amp; Discounts</span>
                <span className="badge badge-blue normal-case tracking-normal font-semibold ml-auto">Applied across all semesters</span>
              </div>
              <div className="g2">
                <div className="fg m-0">
                  <div className="lbl">Lumpsum Discount Type</div>
                  <select className="ctrl"><option>Amount</option><option>Percentage</option></select>
                </div>
                <div className="fg m-0">
                  <div className="lbl">Lumpsum Discount Amount</div>
                  <div className="flex items-center gap-2">
                    <span className="text-g500 font-bold min-w-[28px] text-center" style={{ fontSize: 'var(--fs-sm)' }}>UGX</span>
                    <input className="ctrl flex-1" type="number" placeholder="0" min={0} />
                  </div>
                </div>
              </div>
              <div className="g3 mt-3">
                <div className="fg span2 m-0"><div className="lbl">Lateral Entry Fee</div><input className="ctrl" type="number" placeholder="0" min={0} /></div>
                <div className="fg m-0"><div className="lbl">Currency</div><select className="ctrl">{CURRENCIES.map(c => <option key={c}>{c}</option>)}</select></div>
                <div className="fg span2 m-0"><div className="lbl">Credit Exemption Fee</div><input className="ctrl" type="number" placeholder="0" min={0} /></div>
                <div className="fg m-0"><div className="lbl">Currency</div><select className="ctrl">{CURRENCIES.map(c => <option key={c}>{c}</option>)}</select></div>
                <div className="fg span2 m-0"><div className="lbl">Aptech Credit Exemption Fee</div><input className="ctrl" type="number" placeholder="0" min={0} /></div>
                <div className="fg m-0"><div className="lbl">Currency</div><select className="ctrl">{CURRENCIES.map(c => <option key={c}>{c}</option>)}</select></div>
              </div>
            </div>

            {/* Per-semester fee items */}
            <div className="flex flex-col gap-4">
              {semFees.map((items, si) => (
                <div key={si} style={{ border: '1.5px solid var(--b100)', borderRadius: 'var(--rsm)', overflow: 'hidden' }}>

                  {/* Semester header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 14px', background: 'var(--b50)', borderBottom: '1px solid var(--b100)' }}>
                    <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--b700)' }}>
                      <i className="lni lni-calendar mr-1"></i> Semester {si + 1}
                    </span>
                    {items.length > 0 && (
                      <span className="text-g400" style={{ fontSize: 11.5 }}>
                        Total: <strong className="text-g700">{items.reduce((s, f) => s + (parseFloat(f.amount) || 0), 0).toLocaleString()} {items[0]?.currency}</strong>
                      </span>
                    )}
                  </div>

                  {/* Column headers */}
                  {items.length > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: '32px 1fr 120px 90px 210px 32px', gap: 6, padding: '6px 12px 2px', fontSize: 10.5, fontWeight: 700, color: 'var(--g400)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      <span style={{ textAlign: 'center' }}>Pri.</span>
                      <span>Fee Title</span>
                      <span>Amount</span>
                      <span>Currency</span>
                      <span>Ledger</span>
                      <span></span>
                    </div>
                  )}

                  {/* Fee rows */}
                  <div className="flex flex-col gap-1" style={{ padding: items.length > 0 ? '4px 12px 10px' : '10px 12px' }}>
                    {items.length === 0 && (
                      <div className="text-g400 italic" style={{ fontSize: 12.5 }}>No fee items for this semester. Click &ldquo;Add Fee Item&rdquo; to begin.</div>
                    )}
                    {items.map((f, idx) => (
                      <div key={f.id} style={{ display: 'grid', gridTemplateColumns: '32px 1fr 120px 90px 210px 32px', gap: 6, alignItems: 'center' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
                          <button
                            className="btn btn-neu"
                            style={{ width: 26, height: 14, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}
                            onClick={() => moveItem(si, idx, -1)}
                            disabled={idx === 0}
                          ><i className="lni lni-chevron-up"></i></button>
                          <button
                            className="btn btn-neu"
                            style={{ width: 26, height: 14, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}
                            onClick={() => moveItem(si, idx, 1)}
                            disabled={idx === items.length - 1}
                          ><i className="lni lni-chevron-down"></i></button>
                        </div>
                        <input className="ctrl" value={f.title}    onChange={e => updateItem(si, f.id, 'title',    e.target.value)} placeholder="e.g. Tuition Fee" />
                        <input className="ctrl" value={f.amount}   onChange={e => updateItem(si, f.id, 'amount',   e.target.value)} type="number" min={0} placeholder="0" />
                        <select className="ctrl" value={f.currency} onChange={e => updateItem(si, f.id, 'currency', e.target.value)}>
                          {CURRENCIES.map(c => <option key={c}>{c}</option>)}
                        </select>
                        <select className="ctrl" value={f.ledger}  onChange={e => updateItem(si, f.id, 'ledger',   e.target.value)}>
                          <option value="">— Select Ledger —</option>
                          {LEDGERS.map(l => <option key={l}>{l}</option>)}
                        </select>
                        <button
                          className="btn btn-danger btn-sm"
                          style={{ width: 32, height: 32, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                          onClick={() => removeItem(si, f.id)}
                        ><i className="lni lni-trash-can"></i></button>
                      </div>
                    ))}
                    <button className="btn btn-neu btn-sm mt-1" style={{ alignSelf: 'flex-start', fontSize: 11 }} onClick={() => addItem(si)}>
                      <i className="lni lni-plus"></i> Add Fee Item
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-neu" onClick={handleClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => setSaved(true)}>
            <i className="lni lni-checkmark"></i> Save Fee Structure
          </button>
        </div>
      </div>
    </div>
  )
}
