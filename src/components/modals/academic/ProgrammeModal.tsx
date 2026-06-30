'use client'
import { useState } from 'react'
import { ModalProps } from '../types'
import { SuccessPopup } from './SuccessPopup'
import { SearchSelect } from '@/components/SearchSelect'

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

type FeeItem     = { id: number; title: string; amount: string; currency: string; ledger: string }
type SemFees     = FeeItem[][]
type CUItem      = { id: number; code: string; name: string; credits: number }
type SemUnits    = CUItem[][]
type SpecRow     = { id: number; value: string }
type FeeStructure = { id: number; feeCode: string; description: string; currency: string; intake: string; discountType: string; semFees: SemFees }

function blankItem(id: number): FeeItem {
  return { id, title: '', amount: '', currency: 'UGX', ledger: 'Tuition Fee' }
}

const DEFAULT_SEM_FEES: SemFees = Array.from({ length: NUM_SEMS }, (_, i) =>
  i === 0
    ? [
        { id: 1, title: 'Tuition Fee',       amount: '750000', currency: 'UGX', ledger: 'Tuition Fee'      },
        { id: 2, title: 'Semester Entry Fee', amount: '50000',  currency: 'UGX', ledger: 'Registration Fee' },
      ]
    : []
)

function makeDefaultFeeStructures(): FeeStructure[] {
  return [{ id: 1, feeCode: '', description: '', currency: 'UGX', intake: '', discountType: 'Amount', semFees: DEFAULT_SEM_FEES }]
}

const COURSE_UNIT_OPTS = [
  { value: 'IT101', label: 'IT101 — Introduction to Programming (3 cr)',    code: 'IT101', name: 'Introduction to Programming',    credits: 3 },
  { value: 'IT102', label: 'IT102 — Data Structures and Algorithms (3 cr)', code: 'IT102', name: 'Data Structures and Algorithms', credits: 3 },
  { value: 'IT103', label: 'IT103 — Database Management Systems (3 cr)',    code: 'IT103', name: 'Database Management Systems',    credits: 3 },
  { value: 'IT104', label: 'IT104 — Computer Networks (3 cr)',              code: 'IT104', name: 'Computer Networks',              credits: 3 },
  { value: 'IT201', label: 'IT201 — Operating Systems (3 cr)',              code: 'IT201', name: 'Operating Systems',              credits: 3 },
  { value: 'IT202', label: 'IT202 — Software Engineering (3 cr)',           code: 'IT202', name: 'Software Engineering',           credits: 3 },
  { value: 'IT203', label: 'IT203 — Web Development (3 cr)',                code: 'IT203', name: 'Web Development',                credits: 3 },
  { value: 'IT204', label: 'IT204 — Artificial Intelligence (3 cr)',        code: 'IT204', name: 'Artificial Intelligence',        credits: 3 },
  { value: 'BA101', label: 'BA101 — Business Communication (2 cr)',         code: 'BA101', name: 'Business Communication',         credits: 2 },
  { value: 'BA102', label: 'BA102 — Entrepreneurship (2 cr)',               code: 'BA102', name: 'Entrepreneurship',               credits: 2 },
  { value: 'MT101', label: 'MT101 — Mathematics for Computing (3 cr)',      code: 'MT101', name: 'Mathematics for Computing',      credits: 3 },
  { value: 'MT102', label: 'MT102 — Statistics and Probability (3 cr)',     code: 'MT102', name: 'Statistics and Probability',     credits: 3 },
]

let nextId        = 100
let nextCUId      = 200
let nextSpecId    = 300
let nextFeeStructId = 10

const SPEC_OPTS = [
  'Computer Science',
  'Information Technology',
  'Software Engineering',
  'Networking & Security',
  'Data Science & Analytics',
  'Business Administration',
  'Finance & Accounting',
  'Human Resource Management',
  'Marketing Management',
  'Civil Engineering',
  'Electrical Engineering',
]

export function ProgrammeModal({ isOpen, onClose, showToast: _showToast, mode }: ModalProps & { mode?: 'edit' }) {
  const [step, setStep]           = useState(1)
  const [saved, setSaved]         = useState(false)
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>(makeDefaultFeeStructures)
  const [activeFeeIdx, setActiveFeeIdx]   = useState(0)
  const [feeAccordion, setFeeAccordion]   = useState(0)
  const [semUnits, setSemUnits]     = useState<SemUnits>(() => Array.from({ length: NUM_SEMS }, () => []))
  const [pendingSel, setPendingSel] = useState<string[]>(() => Array(NUM_SEMS).fill(''))
  const [activeAcc, setActiveAcc]   = useState<number>(0)
  const [specs, setSpecs]           = useState<SpecRow[]>([])

  if (!isOpen) return null

  const activeFeeStruct = feeStructures[activeFeeIdx]

  function feeStructComplete(s: FeeStructure) {
    return !!(s.feeCode.trim() && s.description.trim() && s.currency && s.intake)
  }
  const activeFeeComplete = feeStructComplete(activeFeeStruct)
  const allFeeComplete    = feeStructures.every(feeStructComplete)

  function handleClose() {
    setStep(1); setSaved(false)
    setFeeStructures(makeDefaultFeeStructures())
    setActiveFeeIdx(0); setFeeAccordion(0)
    setSemUnits(Array.from({ length: NUM_SEMS }, () => []))
    setPendingSel(Array(NUM_SEMS).fill(''))
    setSpecs([])
    onClose()
  }

  function addSpec()                           { setSpecs(p => [...p, { id: nextSpecId++, value: '' }]) }
  function removeSpec(id: number)              { setSpecs(p => p.filter(s => s.id !== id)) }
  function updateSpec(id: number, val: string) { setSpecs(p => p.map(s => s.id === id ? { ...s, value: val } : s)) }

  /* ── fee structure helpers ── */
  function addFeeStructure() {
    const newStruct: FeeStructure = {
      id: nextFeeStructId++,
      feeCode: '',
      description: '',
      currency: 'UGX',
      intake: '',
      discountType: 'Amount',
      semFees: Array.from({ length: NUM_SEMS }, () => []),
    }
    setFeeStructures(prev => [...prev, newStruct])
    setActiveFeeIdx(feeStructures.length)
    setFeeAccordion(0)
  }

  function removeFeeStructure(idx: number) {
    if (feeStructures.length <= 1) return
    setFeeStructures(prev => prev.filter((_, i) => i !== idx))
    setActiveFeeIdx(prev => (prev >= idx && prev > 0 ? prev - 1 : prev))
  }

  function updateFeeStructureMeta(field: 'feeCode' | 'description' | 'currency' | 'intake' | 'discountType', val: string) {
    setFeeStructures(prev => prev.map((s, i) => i === activeFeeIdx ? { ...s, [field]: val } : s))
  }

  /* ── fee item helpers ── */
  function addItem(si: number) {
    setFeeStructures(prev => prev.map((s, i) =>
      i === activeFeeIdx
        ? { ...s, semFees: s.semFees.map((items, j) => j === si ? [...items, blankItem(nextId++)] : items) }
        : s
    ))
  }
  function removeItem(si: number, id: number) {
    setFeeStructures(prev => prev.map((s, i) =>
      i === activeFeeIdx
        ? { ...s, semFees: s.semFees.map((items, j) => j === si ? items.filter(f => f.id !== id) : items) }
        : s
    ))
  }
  function updateItem(si: number, id: number, field: keyof FeeItem, val: string) {
    setFeeStructures(prev => prev.map((s, i) =>
      i === activeFeeIdx
        ? { ...s, semFees: s.semFees.map((items, j) => j === si ? items.map(f => f.id === id ? { ...f, [field]: val } : f) : items) }
        : s
    ))
  }
  function moveItem(si: number, idx: number, dir: -1 | 1) {
    const to = idx + dir
    setFeeStructures(prev => prev.map((s, i) => {
      if (i !== activeFeeIdx) return s
      return {
        ...s,
        semFees: s.semFees.map((items, j) => {
          if (j !== si || to < 0 || to >= items.length) return items
          const next = [...items];
          [next[idx], next[to]] = [next[to], next[idx]]
          return next
        }),
      }
    }))
  }

  /* ── course unit helpers ── */
  function addUnit(si: number, val: string) {
    const opt = COURSE_UNIT_OPTS.find(u => u.value === val)
    if (!opt) return
    setSemUnits(prev => prev.map((units, i) =>
      i === si ? [...units, { id: nextCUId++, code: opt.code, name: opt.name, credits: opt.credits }] : units
    ))
    setPendingSel(prev => prev.map((s, i) => i === si ? '' : s))
  }
  function removeUnit(si: number, id: number) {
    setSemUnits(prev => prev.map((units, i) =>
      i === si ? units.filter(u => u.id !== id) : units
    ))
  }

  if (saved) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <SuccessPopup title={mode === 'edit' ? 'Programme Updated!' : 'Programme Saved!'} subtitle="The programme version has been saved successfully." onClose={handleClose} />
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay open" id="new-prog-modal">
      <div className="modal modal-80 modal-flex" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr">
          <div className="modal-title"><i className="lni lni-graduation"></i> {mode === 'edit' ? 'Edit' : 'Add'} Programme Version</div>
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
                  <SearchSelect placeholder="— Select group —" options={['BCA', 'BBA', 'MBA', 'BEng']} />
                </div>
                <div className="fg span2">
                  <div className="lbl">Programme Level (auto-fills year/sem/credits)</div>
                  <SearchSelect placeholder="— Select level —" options={["Bachelor's Degree (3yr / 6sem / 132cr)", "Master's Degree (2yr / 4sem / 72cr)", 'PhD (3yr / 6sem / 0cr — No IA)', 'Engineering (4yr / 8sem / 160cr)', 'Diploma (2yr / 4sem / 72cr)']} />
                  <div className="flex gap-2 flex-wrap mt-2">
                    <span className="lvl-chip"><span className="lvl-chip-lbl">No. of Years</span><span className="lvl-chip-val">—</span></span>
                    <span className="lvl-chip"><span className="lvl-chip-lbl">No. of Semesters</span><span className="lvl-chip-val">—</span></span>
                    <span className="lvl-chip"><span className="lvl-chip-lbl">Min. Credits</span><span className="lvl-chip-val">—</span></span>
                  </div>
                </div>
                <div className="fg">
                  <div className="lbl">Campus <span className="req">*</span></div>
                  <SearchSelect placeholder="— Select campus —" options={['Main Campus — Kampala', 'Kampala City Campus', 'Mukono Campus', 'Jinja Campus', 'Online / ODL Hub']} />
                </div>
                <div className="fg">
                  <div className="lbl">Faculty <span className="req">*</span></div>
                  <SearchSelect placeholder="— Select faculty —" options={['FCT — Faculty of Computing & Technology', 'FBM — Faculty of Business & Management', 'FEN — Faculty of Engineering', 'FHS — Faculty of Health Sciences', 'FED — Faculty of Education', 'FLA — Faculty of Liberal Arts']} />
                </div>
                <div className="fg span2">
                  <div className="lbl">Application Fee <span className="req">*</span></div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 90px', gap: 6 }}>
                    <SearchSelect placeholder="— Select preset —" options={['UGX 50,000 — Standard (Direct)', 'UGX 100,000 — Postgraduate', 'UGX 30,000 — Diploma / Certificate', 'USD 50 — ODL / International', 'USD 100 — ODL Postgraduate', 'Waived (HTC / Scholarship)', 'Custom — enter manually']} />
                    <input className="ctrl font-bold" type="number" min={0} placeholder="0" />
                    <SearchSelect placeholder="Currency" options={['UGX', 'USD', 'KES']} />
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
                {specs.length === 0 && (
                  <div className="text-g500 italic mb-2" style={{ fontSize: 'var(--fs-sm)' }}>No specializations added — this programme will run as a single track.</div>
                )}
                {specs.length > 0 && (
                  <div className="flex flex-col gap-2 mb-3">
                    {specs.map((s, idx) => (
                      <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--b600)', background: 'var(--b100)', padding: '4px 8px', borderRadius: 'var(--rxs)', minWidth: 32, textAlign: 'center', flexShrink: 0 }}>#{idx + 1}</span>
                        <div style={{ flex: 1 }}>
                          <SearchSelect
                            placeholder="— Select a specialization —"
                            value={s.value}
                            onChange={val => updateSpec(s.id, val)}
                            options={SPEC_OPTS}
                          />
                        </div>
                        <button
                          className="btn btn-danger btn-sm"
                          style={{ width: 32, height: 32, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                          onClick={() => removeSpec(s.id)}
                        ><i className="lni lni-trash-can"></i></button>
                      </div>
                    ))}
                  </div>
                )}
                <button className="btn btn-neu btn-sm" onClick={addSpec}><i className="lni lni-plus"></i> Add Specialization</button>
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
            <div>
              <div className="mdl-section mdl-section--blue" style={{ marginBottom: 14 }}>
                <div className="mdl-section-hdr">
                  <span className="mdl-section-icon"><i className="lni lni-book"></i></span>
                  <div className="flex-1 min-w-0">
                    <div className="mdl-section-title font-bold">Allocate Course Units by Semester</div>
                    <div className="mdl-section-sub">Assign course units to each semester. Pick from the curriculum master or add a quick placeholder.</div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                {semUnits.map((units, si) => {
                  const isOpen        = activeAcc === si
                  const assignedCodes = units.map(u => u.code)
                  const availableOpts = COURSE_UNIT_OPTS.filter(o => !assignedCodes.includes(o.code))
                  const totalCredits  = units.reduce((s, u) => s + u.credits, 0)
                  return (
                    <div key={si} style={{ border: '1.5px solid var(--b100)', borderRadius: 'var(--rsm)', overflow: 'hidden' }}>
                      <button
                        type="button"
                        onClick={() => setActiveAcc(isOpen ? -1 : si)}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', width: '100%', background: isOpen ? 'var(--b50)' : 'var(--white)', border: 'none', borderBottom: isOpen ? '1px solid var(--b100)' : 'none', cursor: 'pointer', textAlign: 'left', transition: 'background 0.2s' }}
                      >
                        <span className="badge badge-blue" style={{ flexShrink: 0 }}>Sem {si + 1}</span>
                        <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--b700)' }}>Semester {si + 1}</span>
                        <span style={{ marginLeft: 'auto', fontSize: 11.5, color: 'var(--g400)', marginRight: 8 }}>
                          {units.length} unit{units.length !== 1 ? 's' : ''} · {totalCredits} credit{totalCredits !== 1 ? 's' : ''}
                        </span>
                        <i className="lni lni-chevron-down" style={{ fontSize: 11, color: 'var(--g400)', flexShrink: 0, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.25s ease' }} />
                      </button>
                      <div style={{ overflow: 'hidden', maxHeight: isOpen ? 600 : 0, transition: 'max-height 0.3s ease' }}>
                        <div style={{ padding: '10px 14px' }}>
                          {units.length === 0 && (
                            <div style={{ fontSize: 12.5, color: 'var(--g400)', fontStyle: 'italic', marginBottom: 8 }}>
                              No course units assigned yet
                            </div>
                          )}
                          {units.length > 0 && (
                            <div className="flex flex-col" style={{ marginBottom: 10, border: '1px solid var(--g100)', borderRadius: 'var(--rxs)', overflow: 'hidden' }}>
                              {units.map((u, ui) => (
                                <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 10px', borderBottom: ui < units.length - 1 ? '1px solid var(--g100)' : 'none', background: 'var(--white)' }}>
                                  <span className="font-mono font-bold text-b700" style={{ fontSize: 12, minWidth: 50 }}>{u.code}</span>
                                  <span style={{ flex: 1, fontSize: 13, color: 'var(--g700)' }}>{u.name}</span>
                                  <span className="badge badge-blue">{u.credits} cr</span>
                                  <button
                                    className="btn btn-danger btn-sm"
                                    style={{ width: 26, height: 26, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                                    onClick={() => removeUnit(si, u.id)}
                                  ><i className="lni lni-close" style={{ fontSize: 11 }}></i></button>
                                </div>
                              ))}
                            </div>
                          )}
                          <SearchSelect
                            placeholder="— Select course unit —"
                            value={pendingSel[si]}
                            onChange={val => addUnit(si, val)}
                            options={availableOpts}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── Step 3: Semester-wise Fee Structure ────────────── */}
          {step === 3 && (
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>

              {/* Left fee structure list */}
              <div style={{ width: 210, flexShrink: 0, background: 'var(--surface)', border: '1.5px solid var(--g200)', borderRadius: 'var(--rsm)', overflow: 'hidden', position: 'sticky', top: 0, display: 'flex', flexDirection: 'column', maxHeight: 480 }}>
                <div style={{ padding: '14px 14px 6px', fontSize: 10.5, fontWeight: 700, color: 'var(--g400)', textTransform: 'uppercase', letterSpacing: '.07em' }}>
                  Fee Structures <span style={{ color: 'var(--b500)' }}>({feeStructures.length})</span>
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: '4px 8px' }}>
                  {feeStructures.map((s, i) => (
                    <div
                      key={s.id}
                      onClick={() => { setActiveFeeIdx(i); setFeeAccordion(0) }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '9px 10px', borderRadius: 'var(--rsm)', marginBottom: 2,
                        background: activeFeeIdx === i ? 'var(--b500)' : 'transparent',
                        color: activeFeeIdx === i ? '#fff' : 'var(--g700)',
                        cursor: 'pointer', transition: 'background .15s',
                      }}
                    >
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: activeFeeIdx === i ? 'rgba(255,255,255,.2)' : 'var(--b100)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <i className="lni lni-coin" style={{ fontSize: 12, color: activeFeeIdx === i ? '#fff' : 'var(--b600)' }}></i>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 12.5, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Structure {i + 1}</div>
                        <div style={{ fontSize: 11, opacity: .65, lineHeight: 1.3 }}>{s.currency}</div>
                      </div>
                      {feeStructures.length > 1 && (
                        <button
                          onClick={e => { e.stopPropagation(); removeFeeStructure(i) }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 3, color: activeFeeIdx === i ? 'rgba(255,255,255,.65)' : 'var(--g300)', display: 'flex', alignItems: 'center', borderRadius: 'var(--rxs)', flexShrink: 0 }}
                        ><i className="lni lni-trash-can" style={{ fontSize: 12 }}></i></button>
                      )}
                    </div>
                  ))}
                </div>
                <div style={{ borderTop: '1.5px solid var(--g200)', padding: '6px 8px 10px' }}>
                  <button className="btn btn-neu btn-sm" style={{ width: '100%' }} onClick={addFeeStructure} disabled={!activeFeeComplete}>
                    <i className="lni lni-plus"></i> Add Fee Structure
                  </button>
                </div>
              </div>

              {/* Right configuration panel */}
              <div style={{ flex: 1, minWidth: 0 }}>

                {/* Active structure banner */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, padding: '10px 14px', background: 'var(--b50)', borderRadius: 'var(--rsm)', border: '1.5px solid var(--b100)' }}>
                  <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--b100)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <i className="lni lni-coin" style={{ color: 'var(--b600)', fontSize: 15 }}></i>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--b800)' }}>{activeFeeStruct.feeCode || `Structure ${activeFeeIdx + 1}`} — {activeFeeStruct.currency}</div>
                    <div style={{ fontSize: 11, color: 'var(--g400)' }}>Structure {activeFeeIdx + 1} of {feeStructures.length}</div>
                  </div>
                </div>

                {/* Fee structure controls */}
                <div className="g3 mb-[14px]">
                  <div className="fg m-0">
                    <div className="lbl">Fee Code</div>
                    <input className="ctrl font-mono uppercase" type="text" value={activeFeeStruct.feeCode} onChange={e => updateFeeStructureMeta('feeCode', e.target.value)} />
                  </div>
                  <div className="fg m-0">
                    <div className="lbl">Fee Description</div>
                    <input className="ctrl" type="text" placeholder="e.g. Local undergraduate fee structure" value={activeFeeStruct.description} onChange={e => updateFeeStructureMeta('description', e.target.value)} />
                  </div>
                  <div className="fg m-0">
                    <div className="lbl">Base Currency</div>
                    <SearchSelect
                      options={[
                        { value: 'UGX', label: 'UGX (Ugandan Shilling)' },
                        { value: 'USD', label: 'USD (US Dollar)' },
                        { value: 'KES', label: 'KES (Kenyan Shilling)' },
                        { value: 'EUR', label: 'EUR (Euro)' },
                        { value: 'GBP', label: 'GBP (British Pound)' },
                      ]}
                      value={activeFeeStruct.currency}
                      onChange={val => updateFeeStructureMeta('currency', val)}
                    />
                  </div>
                  <div className="fg m-0">
                    <div className="lbl">Copy Fee Code</div>
                    <SearchSelect
                      placeholder="— Select source structure —"
                      options={feeStructures.map((s, i) => ({ s, i })).filter(({ i }) => i !== activeFeeIdx).map(({ s, i }) => ({ value: String(s.id), label: s.feeCode || `Structure ${i + 1}` }))}
                    />
                  </div>
                  <div className="fg m-0">
                    <div className="lbl">Intake</div>
                    <SearchSelect
                      placeholder="— Select intake —"
                      value={activeFeeStruct.intake}
                      onChange={val => updateFeeStructureMeta('intake', val)}
                      options={[
                        { value: '20241', label: '20241 — Spring 2024' },
                        { value: '20261', label: '20261 — Spring 2026' },
                        { value: '20262', label: '20262 — Fall 2026' },
                        { value: '20271', label: '20271 — Spring 2027' },
                        { value: '20272', label: '20272 — Fall 2027' },
                      ]}
                    />
                  </div>
                </div>

                {/* Programme-level fees & discounts */}
                <div className="bg-[linear-gradient(135deg,#f0f5ff_0%,var(--white)_70%)] border-[1.5px] border-dashed border-[var(--b200)] rounded-[var(--rsm)] p-[14px_16px] mb-[18px]">
                  <div className="flex items-center gap-2 font-bold uppercase mb-3" style={{ fontSize: 'var(--fs-xs)', letterSpacing: '.08em', color: '#2d448f' }}>
                    <i className="lni lni-tag" style={{ fontSize: 'var(--fs-md)' }}></i>
                    <span>Programme-level Fees &amp; Discounts</span>
                    <span className="badge badge-blue normal-case tracking-normal font-semibold ml-auto">Applied across all semesters</span>
                  </div>
                  <div className="g4">
                    <div className="fg m-0">
                      <div className="lbl">Lumpsum Discount Type</div>
                      <SearchSelect options={['Amount', 'Percentage']} value={activeFeeStruct.discountType} onChange={val => updateFeeStructureMeta('discountType', val)} />
                    </div>
                    <div className="fg m-0">
                      <div className="lbl">{activeFeeStruct.discountType === 'Percentage' ? 'Lumpsum Discount Percentage' : 'Lumpsum Discount Amount'}</div>
                      <div className="flex items-center gap-2">
                        <span className="text-g500 font-bold min-w-[28px] text-center" style={{ fontSize: 'var(--fs-sm)' }}>{activeFeeStruct.discountType === 'Percentage' ? '%' : activeFeeStruct.currency}</span>
                        <input className="ctrl flex-1" type="number" placeholder="0" min={0} max={activeFeeStruct.discountType === 'Percentage' ? 100 : undefined} />
                      </div>
                    </div>
                    <div className="fg m-0"><div className="lbl">Lateral Entry Fee</div><input className="ctrl" type="number" placeholder="0" min={0} /></div>
                    <div className="fg m-0"><div className="lbl">Currency</div><SearchSelect options={CURRENCIES} /></div>
                    <div className="fg m-0"><div className="lbl">Credit Exemption Fee</div><input className="ctrl" type="number" placeholder="0" min={0} /></div>
                    <div className="fg m-0"><div className="lbl">Currency</div><SearchSelect options={CURRENCIES} /></div>
                    <div className="fg m-0"><div className="lbl">Aptech Credit Exemption Fee</div><input className="ctrl" type="number" placeholder="0" min={0} /></div>
                    <div className="fg m-0"><div className="lbl">Currency</div><SearchSelect options={CURRENCIES} /></div>
                  </div>
                </div>

                {/* Per-semester accordion */}
                <div className="flex flex-col gap-2">
                  {activeFeeStruct.semFees.map((items, si) => {
                    const isOpen = feeAccordion === si
                    const total  = items.reduce((s, f) => s + (parseFloat(f.amount) || 0), 0)
                    return (
                      <div key={si} style={{ border: '1.5px solid var(--b100)', borderRadius: 'var(--rsm)', overflow: 'hidden' }}>
                        <button
                          type="button"
                          onClick={() => setFeeAccordion(isOpen ? -1 : si)}
                          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', width: '100%', background: isOpen ? 'var(--b50)' : 'var(--white)', border: 'none', borderBottom: isOpen ? '1px solid var(--b100)' : 'none', cursor: 'pointer', textAlign: 'left', transition: 'background 0.2s' }}
                        >
                          <span className="badge badge-blue" style={{ flexShrink: 0 }}>Sem {si + 1}</span>
                          <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--b700)' }}>Semester {si + 1}</span>
                          {items.length > 0
                            ? <span style={{ marginLeft: 'auto', fontSize: 11.5, color: 'var(--g400)', marginRight: 8 }}>{items.length} item{items.length !== 1 ? 's' : ''} · {total.toLocaleString()} {items[0]?.currency}</span>
                            : <span style={{ marginLeft: 'auto', fontSize: 11.5, color: 'var(--g400)', fontStyle: 'italic', marginRight: 8 }}>No items</span>
                          }
                          <i className="lni lni-chevron-down" style={{ fontSize: 11, color: 'var(--g400)', flexShrink: 0, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.25s ease' }} />
                        </button>
                        <div style={{ overflow: 'hidden', maxHeight: isOpen ? 800 : 0, transition: 'max-height 0.3s ease' }}>
                          <div style={{ padding: '10px 14px' }}>
                            {items.length > 0 && (
                              <div style={{ display: 'grid', gridTemplateColumns: '32px 1fr 120px 90px 210px 32px', gap: 6, padding: '0 0 4px', fontSize: 10.5, fontWeight: 700, color: 'var(--g400)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                <span style={{ textAlign: 'center' }}>Pri.</span><span>Fee Title</span><span>Amount</span><span>Currency</span><span>Ledger</span><span></span>
                              </div>
                            )}
                            <div className="flex flex-col gap-1">
                              {items.length === 0 && (
                                <div className="text-g400 italic" style={{ fontSize: 12.5, marginBottom: 8 }}>No fee items — click &ldquo;Add Fee Item&rdquo; to begin.</div>
                              )}
                              {items.map((f, idx) => (
                                <div key={f.id} style={{ display: 'grid', gridTemplateColumns: '32px 1fr 120px 90px 210px 32px', gap: 6, alignItems: 'center' }}>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
                                    <button className="btn btn-neu" style={{ width: 26, height: 14, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }} onClick={() => moveItem(si, idx, -1)} disabled={idx === 0}><i className="lni lni-chevron-up"></i></button>
                                    <button className="btn btn-neu" style={{ width: 26, height: 14, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }} onClick={() => moveItem(si, idx, 1)} disabled={idx === items.length - 1}><i className="lni lni-chevron-down"></i></button>
                                  </div>
                                  <input className="ctrl" value={f.title}  onChange={e => updateItem(si, f.id, 'title',  e.target.value)} placeholder="e.g. Tuition Fee" />
                                  <input className="ctrl" value={f.amount} onChange={e => updateItem(si, f.id, 'amount', e.target.value)} type="number" min={0} placeholder="0" />
                                  <SearchSelect options={CURRENCIES} value={f.currency} onChange={val => updateItem(si, f.id, 'currency', val)} />
                                  <SearchSelect placeholder="— Select Ledger —" options={LEDGERS} value={f.ledger} onChange={val => updateItem(si, f.id, 'ledger', val)} />
                                  <button className="btn btn-danger btn-sm" style={{ width: 32, height: 32, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }} onClick={() => removeItem(si, f.id)}><i className="lni lni-trash-can"></i></button>
                                </div>
                              ))}
                              <button className="btn btn-neu btn-sm mt-2" style={{ alignSelf: 'flex-start', fontSize: 11 }} onClick={() => addItem(si)}>
                                <i className="lni lni-plus"></i> Add Fee Item
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
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
            <button className="btn btn-primary" onClick={() => setSaved(true)} disabled={!allFeeComplete}>
              <i className="lni lni-checkmark"></i> {mode === 'edit' ? 'Update' : 'Save'} Programme
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
