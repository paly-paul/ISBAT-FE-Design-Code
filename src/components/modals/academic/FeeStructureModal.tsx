'use client'
import { useState, useEffect } from 'react'
import { ModalProps } from '../types'
import { SuccessPopup } from './SuccessPopup'
import { SearchSelect } from '@/components/SearchSelect'
import { useProgramMasters } from '@/hooks/academic/useProgramMaster'
import { useIntakes } from '@/hooks/academic/useIntakes'
import { useCurrencies } from '@/hooks/finance/useCurrencies'
import { useCreateProgramFeeStructureHeader, ProgramFeeStructureHeaderInput } from '@/hooks/academic/useProgramFeeStructure'

/* ─────────────────────────────────────────────────────────
   OLD MODAL (commented out — kept for reference)
   ─────────────────────────────────────────────────────────
export function FeeStructureModal_OLD({ isOpen, onClose, showToast }: ModalProps) {
  if (!isOpen) return null
  return (
    <div className="modal-overlay open" id="new-fee-structure-modal">
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

type Structure = {
  id: number
  programme: string
  feeCode: string
  description: string
  currency: string
  intake: string
  discountType: string
  createdVia: 'new' | 'copy'
  semFees: SemFees
  // Header-level fields for the Programfee-structure/hd POST.
  localOrForeign: boolean
  amtPer: string
  lef: string
  lefCurrency: string
  cef: string
  cefCurrency: string
  ace: string
  aceCurrency: string
  headerSaved: boolean
  feeHdGuid: string | null
}

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

function makeDefaultStructures(): Structure[] {
  return [{
    id: 1, programme: '', feeCode: '', description: '', currency: 'UGX', intake: '', discountType: 'Amount', createdVia: 'new', semFees: DEFAULT_SEM_FEES,
    localOrForeign: false, amtPer: '', lef: '', lefCurrency: '', cef: '', cefCurrency: '', ace: '', aceCurrency: '', headerSaved: false, feeHdGuid: null,
  }]
}

let nextId = 200
let nextStructId = 100

type EditData = { programmeCode: string; intake: string; feeCode: string; description: string; currency: string }

export function FeeStructureModal({ isOpen, onClose, showToast, mode, editData }: ModalProps & { mode?: 'edit'; editData?: EditData }) {
  const { data: programs = [] }   = useProgramMasters()
  const { data: intakes = [] }    = useIntakes()
  const { data: currencies = [] } = useCurrencies()
  const createFeeStructureHeader  = useCreateProgramFeeStructureHeader()

  const programOptions = programs.map(p => ({ value: p.programGuid, label: `${p.programName} (${p.programCode})` }))
  // Same real intakeGuid convention as ProgrammeModal's Intake step.
  const intakeOptions  = intakes.map(i => ({ value: i.intakeGuid, label: `${i.intakeCode} — ${i.description}` }))
  // Currency.intCurrency (a number) is what the header payload's Lec/Cec/Acec
  // fields need — same convention as ProgrammeModal's fee-line ledger currency.
  const currencyIntOptions = currencies.map(c => ({ value: String(c.intCurrency), label: `${c.currencyCode} — ${c.currencyName}` }))

  const [saved, setSaved]           = useState(false)
  const [structures, setStructures] = useState<Structure[]>(() =>
    mode === 'edit' && editData
      ? [{ ...makeDefaultStructures()[0], programme: editData.programmeCode, feeCode: editData.feeCode, description: editData.description ?? '', currency: editData.currency, intake: editData.intake ?? '' }]
      : makeDefaultStructures()
  )
  const [activeIdx, setActiveIdx]   = useState(0)
  const [activeAcc, setActiveAcc]   = useState(0)

  useEffect(() => {
    if (isOpen && mode === 'edit' && editData) {
      setStructures([{ ...makeDefaultStructures()[0], programme: editData.programmeCode, feeCode: editData.feeCode, description: editData.description ?? '', currency: editData.currency, intake: editData.intake ?? '' }])
      setActiveIdx(0)
    }
  }, [isOpen, editData])

  if (!isOpen) return null

  function handleClose() { setSaved(false); setStructures(makeDefaultStructures()); setActiveIdx(0); setActiveAcc(0); onClose() }

  const active = structures[activeIdx]

  function structureComplete(s: Structure) {
    return !!(s.feeCode.trim() && s.description.trim() && s.currency && s.intake)
  }
  const activeComplete = structureComplete(active)
  const allComplete    = structures.every(structureComplete)

  // Saves just the active structure's header (Programfee-structure/hd) —
  // the per-semester fee lines are saved separately by the second button.
  function handleSaveHeader() {
    if (!activeComplete) return
    if (!active.programme) {
      showToast('Please select a programme first.', 'error')
      return
    }
    const payload: ProgramFeeStructureHeaderInput = {
      feeCode: active.feeCode,
      feeDesc: active.description,
      status: true,
      localOrForeign: active.localOrForeign,
      programGuid: active.programme,
      lef: active.lef ? +active.lef : null,
      cef: active.cef ? +active.cef : null,
      ace: active.ace ? +active.ace : null,
      lec: active.lefCurrency ? +active.lefCurrency : null,
      cec: active.cefCurrency ? +active.cefCurrency : null,
      acec: active.aceCurrency ? +active.aceCurrency : null,
      calcType: active.discountType === 'Percentage' ? 2 : 1,
      amtPer: active.amtPer ? +active.amtPer : null,
      intakeGuid: active.intake || null,
    }
    const savedIdx = activeIdx
    createFeeStructureHeader.mutate(payload, {
      onSuccess: header => {
        setStructures(prev => prev.map((s, i) => i === savedIdx ? { ...s, headerSaved: true, feeHdGuid: header.feeHdGuid } : s))
        showToast('Fee structure header saved.', 'success')
      },
      onError: (error: Error) => showToast(error.message || 'Failed to save fee structure header.', 'error'),
    })
  }

  // ── Structure management ─────────────────────────────────
  function addStructure() {
    const newStruct: Structure = {
      id: nextStructId++, programme: '', feeCode: '', description: '', currency: 'UGX', intake: '', discountType: 'Amount', createdVia: 'new', semFees: Array.from({ length: NUM_SEMS }, () => []),
      localOrForeign: false, amtPer: '', lef: '', lefCurrency: '', cef: '', cefCurrency: '', ace: '', aceCurrency: '', headerSaved: false, feeHdGuid: null,
    }
    setStructures(prev => [...prev, newStruct])
    setActiveIdx(structures.length)
  }

  function removeStructure(idx: number) {
    if (structures.length <= 1) return
    setStructures(prev => prev.filter((_, i) => i !== idx))
    setActiveIdx(prev => (prev >= idx && prev > 0 ? prev - 1 : prev))
  }

  function updateStructureMeta(field: 'programme' | 'feeCode' | 'description' | 'currency' | 'intake' | 'discountType' | 'amtPer' | 'lef' | 'lefCurrency' | 'cef' | 'cefCurrency' | 'ace' | 'aceCurrency', val: string) {
    setStructures(prev => prev.map((s, i) => i === activeIdx ? { ...s, [field]: val, headerSaved: false } : s))
  }

  function updateLocalOrForeign(val: string) {
    setStructures(prev => prev.map((s, i) => i === activeIdx ? { ...s, localOrForeign: val === 'true', headerSaved: false } : s))
  }

  // ── Fee item management (scoped to active structure) ─────
  function addItem(si: number) {
    setStructures(prev => prev.map((s, i) =>
      i === activeIdx
        ? { ...s, semFees: s.semFees.map((items, j) => j === si ? [...items, blankItem(nextId++)] : items) }
        : s
    ))
  }

  function removeItem(si: number, id: number) {
    setStructures(prev => prev.map((s, i) =>
      i === activeIdx
        ? { ...s, semFees: s.semFees.map((items, j) => j === si ? items.filter(f => f.id !== id) : items) }
        : s
    ))
  }

  function updateItem(si: number, id: number, field: keyof FeeItem, val: string) {
    setStructures(prev => prev.map((s, i) =>
      i === activeIdx
        ? { ...s, semFees: s.semFees.map((items, j) => j === si ? items.map(f => f.id === id ? { ...f, [field]: val } : f) : items) }
        : s
    ))
  }

  function moveItem(si: number, idx: number, dir: -1 | 1) {
    const to = idx + dir
    setStructures(prev => prev.map((s, i) => {
      if (i !== activeIdx) return s
      return {
        ...s,
        semFees: s.semFees.map((items, j) => {
          if (j !== si || to < 0 || to >= items.length) return items
          const next = [...items]
          ;[next[idx], next[to]] = [next[to], next[idx]]
          return next
        }),
      }
    }))
  }

  if (saved) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <SuccessPopup
            title="Fee Structure Saved!"
            subtitle={`${structures.length} fee structure${structures.length > 1 ? 's' : ''} saved successfully.`}
            onClose={handleClose}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay open" id="new-fee-structure-modal">
      <div className="modal modal-80 modal-flex" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr">
          <div className="modal-title"><i className="lni lni-dollar"></i> {mode === 'edit' ? 'Edit' : 'Add'} Fee Structure</div>
          <button className="modal-close" onClick={handleClose}><i className="lni lni-close"></i></button>
        </div>

        {/* ── Two-panel layout ──────────────────────────────────── */}
        <div style={{ flex: '1 1 auto', minHeight: 0, display: 'flex', overflow: 'hidden' }}>

          {/* Left sidebar — structure list */}
          <div style={{ width: 210, flexShrink: 0, borderRight: '1.5px solid var(--g200)', display: 'flex', flexDirection: 'column', background: 'var(--surface)' }}>
            <div style={{ padding: '14px 14px 6px', fontSize: 10.5, fontWeight: 700, color: 'var(--g400)', textTransform: 'uppercase', letterSpacing: '.07em' }}>
              Fee Structures <span style={{ color: 'var(--b500)' }}>({structures.length})</span>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '4px 8px' }}>
              {structures.map((s, i) => (
                <div
                  key={s.id}
                  onClick={() => { setActiveIdx(i); setActiveAcc(0) }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '9px 10px', borderRadius: 'var(--rsm)', marginBottom: 2,
                    background: activeIdx === i ? 'var(--b500)' : 'transparent',
                    color: activeIdx === i ? '#fff' : 'var(--g700)',
                    cursor: 'pointer', transition: 'background .15s',
                  }}
                >
                  <div style={{ width: 30, height: 30, borderRadius: '50%', background: activeIdx === i ? 'rgba(255,255,255,.2)' : 'var(--b100)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <i className="lni lni-coin" style={{ fontSize: 13, color: activeIdx === i ? '#fff' : 'var(--b600)' }}></i>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, lineHeight: 1.3 }}>Structure {i + 1}</div>
                    <div style={{ fontSize: 11, opacity: .65, lineHeight: 1.3 }}>{s.currency}</div>
                  </div>
                  {structures.length > 1 && (
                    <button
                      onClick={e => { e.stopPropagation(); removeStructure(i) }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 3, color: activeIdx === i ? 'rgba(255,255,255,.65)' : 'var(--g300)', display: 'flex', alignItems: 'center', borderRadius: 'var(--rxs)', flexShrink: 0 }}
                    ><i className="lni lni-trash-can" style={{ fontSize: 12 }}></i></button>
                  )}
                </div>
              ))}
            </div>
            {mode !== 'edit' && (
              <div style={{ borderTop: '1.5px solid var(--g200)', padding: '6px 8px 10px' }}>
                <button className="btn btn-neu btn-sm" style={{ width: '100%' }} onClick={addStructure} disabled={!activeComplete}>
                  <i className="lni lni-plus"></i> Add Fee Structure
                </button>
              </div>
            )}
          </div>

          {/* Right panel — active structure configuration */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '18px 22px' }}>

            {/* Programme selector */}
            <div className="fg m-0 mb-[18px]">
              <div className="lbl">Programme {mode !== 'edit' && <span className="req">*</span>}</div>
              <div style={mode === 'edit' ? { cursor: 'not-allowed', opacity: 0.6 } : undefined}>
                <div style={mode === 'edit' ? { pointerEvents: 'none' } : undefined}>
                  <SearchSelect
                    placeholder="— Select a programme to begin —"
                    value={active.programme}
                    onChange={val => updateStructureMeta('programme', val)}
                    options={programOptions}
                  />
                </div>
              </div>
            </div>

            {/* Locked until a programme is chosen */}
            <div style={{ opacity: active.programme ? 1 : 0.4, pointerEvents: active.programme ? 'auto' : 'none', transition: 'opacity .2s' }}>

            {/* Active structure banner */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18, padding: '12px 16px', background: 'var(--b50)', borderRadius: 'var(--rsm)', border: '1.5px solid var(--b100)' }}>
              <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--b100)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <i className="lni lni-coin" style={{ color: 'var(--b600)', fontSize: 17 }}></i>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--b800)' }}>
                  {active.feeCode || `Structure ${activeIdx + 1}`} — {active.currency}{editData?.description ? ` · ${editData.description}` : ''}
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--g400)' }}>
                  Structure {activeIdx + 1} of {structures.length}
                </div>
              </div>
            </div>

            {/* Global fee controls */}
            <div className="g3 mb-[14px]">
              <div className="fg m-0">
                <div className="lbl">Fee Code</div>
                <input className="ctrl font-mono uppercase" type="text" value={active.feeCode} onChange={e => updateStructureMeta('feeCode', e.target.value)} />
              </div>
              <div className="fg m-0">
                <div className="lbl">Fee Description</div>
                <input className="ctrl" type="text" placeholder="e.g. Local undergraduate fee structure" value={active.description} onChange={e => updateStructureMeta('description', e.target.value)} />
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
                  value={active.currency}
                  onChange={val => updateStructureMeta('currency', val)}
                />
              </div>
              <div className="fg m-0">
                <div className="lbl">Copy Fee Code</div>
                <SearchSelect
                  placeholder="— Select source structure —"
                  options={structures.map((s, i) => ({ s, i })).filter(({ i }) => i !== activeIdx).map(({ s, i }) => ({ value: String(s.id), label: s.feeCode || `Structure ${i + 1}` }))}
                />
              </div>
              <div className="fg m-0">
                <div className="lbl">Intake</div>
                <div style={mode === 'edit' ? { cursor: 'not-allowed', opacity: 0.6 } : undefined}>
                  <div style={mode === 'edit' ? { pointerEvents: 'none' } : undefined}>
                  <SearchSelect
                    placeholder="— Select intake —"
                    value={active.intake}
                    onChange={val => updateStructureMeta('intake', val)}
                    options={intakeOptions}
                  />
                  </div>
                </div>
              </div>
              <div className="fg m-0">
                <div className="lbl">Student Type</div>
                <SearchSelect
                  options={[
                    { value: 'false', label: 'Local' },
                    { value: 'true',  label: 'Foreign / International' },
                  ]}
                  value={String(active.localOrForeign)}
                  onChange={updateLocalOrForeign}
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
                  <SearchSelect options={['Amount', 'Percentage']} value={active.discountType} onChange={val => updateStructureMeta('discountType', val)} />
                </div>
                <div className="fg m-0">
                  <div className="lbl">{active.discountType === 'Percentage' ? 'Lumpsum Discount Percentage' : 'Lumpsum Discount Amount'}</div>
                  <div className="flex items-center gap-2">
                    <span className="text-g500 font-bold min-w-[28px] text-center" style={{ fontSize: 'var(--fs-sm)' }}>{active.discountType === 'Percentage' ? '%' : active.currency}</span>
                    <input className="ctrl flex-1" type="number" placeholder="0" min={0} max={active.discountType === 'Percentage' ? 100 : undefined} value={active.amtPer} onChange={e => updateStructureMeta('amtPer', e.target.value)} />
                  </div>
                </div>
                <div className="fg m-0"><div className="lbl">Lateral Entry Fee</div><input className="ctrl" type="number" placeholder="0" min={0} value={active.lef} onChange={e => updateStructureMeta('lef', e.target.value)} /></div>
                <div className="fg m-0"><div className="lbl">Currency</div><SearchSelect options={currencyIntOptions} value={active.lefCurrency} onChange={val => updateStructureMeta('lefCurrency', val)} /></div>
                <div className="fg m-0"><div className="lbl">Credit Exemption Fee</div><input className="ctrl" type="number" placeholder="0" min={0} value={active.cef} onChange={e => updateStructureMeta('cef', e.target.value)} /></div>
                <div className="fg m-0"><div className="lbl">Currency</div><SearchSelect options={currencyIntOptions} value={active.cefCurrency} onChange={val => updateStructureMeta('cefCurrency', val)} /></div>
                <div className="fg m-0"><div className="lbl">Aptech Credit Exemption Fee</div><input className="ctrl" type="number" placeholder="0" min={0} value={active.ace} onChange={e => updateStructureMeta('ace', e.target.value)} /></div>
                <div className="fg m-0"><div className="lbl">Currency</div><SearchSelect options={currencyIntOptions} value={active.aceCurrency} onChange={val => updateStructureMeta('aceCurrency', val)} /></div>
              </div>
              <div className="flex justify-end mt-3">
                <button className="btn btn-primary" onClick={handleSaveHeader} disabled={!activeComplete || createFeeStructureHeader.isPending}>
                  <i className="lni lni-checkmark"></i> {createFeeStructureHeader.isPending ? 'Saving…' : active.headerSaved ? 'Header Saved' : 'Save Fee Structure'}
                </button>
              </div>
            </div>

            {/* Per-semester accordion */}
            <div className="flex flex-col gap-2">
              {active.semFees.map((items, si) => {
                const isOpen = activeAcc === si
                const total  = items.reduce((s, f) => s + (parseFloat(f.amount) || 0), 0)
                return (
                  <div key={si} style={{ border: '1.5px solid var(--b100)', borderRadius: 'var(--rsm)', overflow: 'hidden' }}>
                    <button
                      type="button"
                      onClick={() => setActiveAcc(isOpen ? -1 : si)}
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
              <div className="flex justify-end mt-2">
                <button className="btn btn-primary" onClick={() => setSaved(true)} disabled={!allComplete}>
                  <i className="lni lni-checkmark"></i> Save Fee Structure
                </button>
              </div>
            </div>
            </div>{/* end gate wrapper */}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-neu" onClick={handleClose}>Cancel</button>
          {/* <button className="btn btn-primary" onClick={() => setSaved(true)} disabled={!allComplete}>
            <i className="lni lni-checkmark"></i> Save Fee Structure
          </button> */}
        </div>
      </div>
    </div>
  )
}
