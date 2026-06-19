'use client'
import { useState } from 'react'
import { ModalProps } from './types'
import { SuccessPopup } from './SuccessPopup'

const CURRENCIES = ['UGX', 'USD', 'KES', 'EUR', 'GBP']
const LEDGERS = [
  'Tuition Fee',
  'Examination Fee',
  'Registration Fee',
  'Library Fee',
  'Lab Fee',
  'Activity Fee',
  'Development Fund',
  'Caution Money',
  'ICT Fee',
  'Other',
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
        { id: 1, title: 'Tuition Fee',       amount: '750000', currency: 'UGX', ledger: 'Tuition Fee'       },
        { id: 2, title: 'Semester Entry Fee', amount: '50000',  currency: 'UGX', ledger: 'Registration Fee'  },
      ]
    : []
)

let nextId = 100

export function ProgrammeModal({ isOpen, onClose, showToast }: ModalProps) {
  const [step, setStep]     = useState(1)
  const [saved, setSaved]   = useState(false)
  const [semFees, setSemFees] = useState<SemFees>(DEFAULT_FEES)

  if (!isOpen) return null

  function handleClose() { setStep(1); setSaved(false); setSemFees(DEFAULT_FEES); onClose() }

  /* ── fee item helpers ── */
  function addItem(si: number) {
    setSemFees(prev => prev.map((items, i) =>
      i === si ? [...items, blankItem(nextId++)] : items
    ))
  }
  function removeItem(si: number, id: number) {
    setSemFees(prev => prev.map((items, i) =>
      i === si ? items.filter(f => f.id !== id) : items
    ))
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
      const next = [...items]
      ;[next[idx], next[to]] = [next[to], next[idx]]
      return next
    }))
  }

  if (saved) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <SuccessPopup title="Programme Saved!" subtitle="The programme version has been saved successfully." onClose={handleClose} />
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay open" id="new-prog-modal" onClick={handleClose}>
      <div className="modal modal-80 modal-flex" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr">
          <div className="modal-title"><i className="lni lni-graduation"></i> Add Programme Version</div>
          <button className="modal-close" onClick={handleClose}><i className="lni lni-close"></i></button>
        </div>

        <div className="prog-steps">
          <div className={`prog-step${step === 1 ? ' active' : ''}`}><span className="prog-step-num">1</span><span>Programme Details</span></div>
          <div className="prog-step-line"></div>
          <div className={`prog-step${step === 2 ? ' active' : ''}`}><span className="prog-step-num">2</span><span>Course Unit Allocation</span></div>
          <div className="prog-step-line"></div>
          <div className={`prog-step${step === 3 ? ' active' : ''}`}><span className="prog-step-num">3</span><span>Semester-wise Fee Structure</span></div>
        </div>

        <div className="modal-scroll">

          {/* ── Step 1: Programme Details ──────────────────────── */}
          {step === 1 && (
            <div>
              <div className="g3">
                <div className="fg"><div className="lbl">Programme Code <span className="req">*</span></div><input className="ctrl" placeholder="e.g. BCA-2031" /></div>
                <div className="fg span2"><div className="lbl">Programme Name <span className="req">*</span></div><input className="ctrl" placeholder="e.g. Bachelor of Computer Applications 2031" /></div>
                <div className="fg">
                  <div className="lbl">Programme Group <span className="req">*</span></div>
                  <select className="ctrl"><option>BCA</option><option>BBA</option><option>MBA</option><option>BEng</option></select>
                </div>
                <div className="fg span2">
                  <div className="lbl">Programme Level (auto-fills year/sem/credits)</div>
                  <select className="ctrl">
                    <option>Bachelor&apos;s Degree (3yr / 6sem / 132cr)</option>
                    <option>Master&apos;s Degree (2yr / 4sem / 72cr)</option>
                    <option>PhD (3yr / 6sem / 0cr — No IA)</option>
                    <option>Engineering (4yr / 8sem / 160cr)</option>
                    <option>Diploma (2yr / 4sem / 72cr)</option>
                  </select>
                  <div className="flex gap-2 flex-wrap mt-2">
                    <span className="lvl-chip"><span className="lvl-chip-lbl">No. of Years</span><span className="lvl-chip-val">3</span></span>
                    <span className="lvl-chip"><span className="lvl-chip-lbl">No. of Semesters</span><span className="lvl-chip-val">6</span></span>
                    <span className="lvl-chip"><span className="lvl-chip-lbl">Min. Credits</span><span className="lvl-chip-val">132</span></span>
                  </div>
                </div>
                <div className="fg">
                  <div className="lbl">Campus <span className="req">*</span></div>
                  <select className="ctrl">
                    <option>Main Campus — Kampala</option>
                    <option>Kampala City Campus</option>
                    <option>Mukono Campus</option>
                    <option>Jinja Campus</option>
                    <option>Online / ODL Hub</option>
                  </select>
                </div>
                <div className="fg">
                  <div className="lbl">Faculty <span className="req">*</span></div>
                  <select className="ctrl">
                    <option>FCT — Faculty of Computing &amp; Technology</option>
                    <option>FBM — Faculty of Business &amp; Management</option>
                    <option>FEN — Faculty of Engineering</option>
                    <option>FHS — Faculty of Health Sciences</option>
                    <option>FED — Faculty of Education</option>
                    <option>FLA — Faculty of Liberal Arts</option>
                  </select>
                </div>
                <div className="fg span2">
                  <div className="lbl">Application Fee <span className="req">*</span></div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 90px', gap: 6 }}>
                    <select className="ctrl">
                      <option>UGX 50,000 — Standard (Direct)</option>
                      <option>UGX 100,000 — Postgraduate</option>
                      <option>UGX 30,000 — Diploma / Certificate</option>
                      <option>USD 50 — ODL / International</option>
                      <option>USD 100 — ODL Postgraduate</option>
                      <option>Waived (HTC / Scholarship)</option>
                      <option>Custom — enter manually</option>
                    </select>
                    <input className="ctrl font-bold" type="number" min={0} defaultValue={50000} />
                    <select className="ctrl">
                      <option>UGX</option><option>USD</option><option>KES</option>
                    </select>
                  </div>
                  <div className="text-g500 mt-[5px]" style={{ fontSize: 'var(--fs-xs)' }}>Pre-loaded from Fee Master. Override per programme if needed.</div>
                </div>
                <div className="fg span3">
                  <div className="g2">
                    <div className="fg m-0"><div className="lbl">Accreditation Date <span className="req">*</span></div><input className="ctrl" type="date" /></div>
                    <div className="fg m-0"><div className="lbl">Accreditation Expiry Date</div><input className="ctrl" type="date" /></div>
                  </div>
                </div>
                <div className="fg span3">
                  <div className="lbl">Accreditation Letter</div>
                  <div className="file-zone p-[14px]">
                    <input type="file" accept=".pdf" />
                    <div className="file-zone-icon"><i className="lni lni-files"></i></div>
                    <p>Upload NCHE / UVTOP accreditation letter (PDF)</p>
                  </div>
                </div>
              </div>

              <div className="sec-divider">
                Programme Specializations
                <span className="font-medium text-g400 normal-case tracking-normal ml-2" style={{ fontSize: 'var(--fs-2xs)' }}>
                  Optional · A student can pick one specialization which dictates their specialization course units
                </span>
              </div>
              <div className="bg-[#fafbfd] border-[1.5px] border-g200 rounded-[var(--rsm)] p-[14px_16px] mb-[14px]">
                <div className="text-g500 italic" style={{ fontSize: 'var(--fs-sm)' }}>No specializations added — this programme will run as a single track.</div>
                <button className="btn btn-neu btn-sm mt-2"><i className="lni lni-plus"></i> Add Specialization</button>
              </div>

              <div className="sec-divider">Status &amp; Flags</div>
              <div className="g3">
                <div className="fg">
                  <div className="lbl">Admission Status <span className="req">*</span></div>
                  <div className="tgl-group">
                    <button className="tgl-btn tgl-active"><i className="lni lni-checkmark"></i> Active (New admissions)</button>
                    <button className="tgl-btn">Inactive (Existing students only)</button>
                  </div>
                </div>
                <div className="fg">
                  <div className="lbl">No Internal Assessment?</div>
                  <div className="tgl-group">
                    <button className="tgl-btn tgl-active">No (Standard)</button>
                    <button className="tgl-btn">Yes (e.g. PhD)</button>
                  </div>
                </div>
              </div>
              <div className="warn-box mt-3">
                <i className="lni lni-warning"></i> Setting this version to <em>Active</em> will make it available for new admissions. Ensure the old version (if any) is set to <em>Inactive</em> first.
              </div>
            </div>
          )}

          {/* ── Step 2: Course Unit Allocation ─────────────────── */}
          {step === 2 && (
            <div className="mdl-section mdl-section--blue">
              <div className="mdl-section-hdr">
                <span className="mdl-section-icon"><i className="lni lni-book"></i></span>
                <div className="flex-1 min-w-0">
                  <div className="mdl-section-title">Allocate Course Units by Semester</div>
                  <div className="mdl-section-sub">Assign course units to each semester. Pick from the curriculum master or add a quick placeholder.</div>
                </div>
              </div>
              <div className="info-box mt-3">
                <i className="lni lni-information"></i> Course unit allocation is managed from the <strong>Course Units Master</strong>. Units linked to this programme will appear here once assigned.
              </div>
            </div>
          )}

          {/* ── Step 3: Semester-wise Fee Structure ────────────── */}
          {step === 3 && (
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
                          {/* Priority arrows */}
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
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-neu" onClick={handleClose}>Cancel</button>
          <span className="flex-1"></span>
          {step > 1 && (
            <button className="btn btn-neu" onClick={() => setStep(s => s - 1)}>
              <i className="lni lni-arrow-left"></i> Back
            </button>
          )}
          {step < 3 && (
            <button className="btn btn-primary" onClick={() => setStep(s => s + 1)}>
              Save &amp; Continue <i className="lni lni-arrow-right"></i>
            </button>
          )}
          {step === 3 && (
            <button className="btn btn-primary" onClick={() => setSaved(true)}>
              <i className="lni lni-checkmark"></i> Save Programme
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
