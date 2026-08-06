'use client'
import { useState, useEffect } from 'react'
import { ModalProps } from '../types'
import { SuccessPopup } from './SuccessPopup'
import { SearchSelect } from '@/components/SearchSelect'
import { useProgramMasters } from '@/hooks/academic/useProgramMaster'
import { useIntakes, useCurrentAcademicIntake } from '@/hooks/academic/useIntakes'
import { useCurrencies } from '@/hooks/finance/useCurrencies'
import { useFinanceCurrencies } from '@/hooks/finance/useFinanceCurrencies'
import { useSemestersForProgram } from '@/hooks/academic/useSemesters'
import { useLedgers } from '@/hooks/finance/useLedgers'
import { useSaveProgramFeeStructureComplete, ProgramFeeLineSaveInput } from '@/hooks/academic/useProgramFeeStructure'

// title dropped per Fee_Structure_Change_Requests.md #1 — it was never part
// of the confirmed save-complete payload anyway (ProgramFeeLineSaveInput has
// no title field), just decorative UI. ledgerPriority is new per #2 — kept
// local-only for now since ProgramFeeLineSaveInput has no matching field yet
// (feeLines' actual send order is still the array order, same as before);
// wire it into the payload once the backend confirms a field for it.
type FeeItem = { id: number; amount: string; currencyGuid: string; ledgerGuid: string; ledgerPriority: string }
// Keyed by real semesterGuid — save-complete's feeLines each carry a real
// semesterGuid, unlike Program Master's own embedded fee structure (which
// uses semCode, a 1-based int position — see the note on
// FeeLineUpdateInput in lib/api/academic/programMaster.ts for that other
// convention). There's no fixed semester count to default to, so this
// starts empty and fills in once a programme's real semesters load.
type SemFeesMap = Record<string, FeeItem[]>

type Structure = {
  id: number
  programme: string
  feeCode: string
  description: string
  currency: string
  intake: string
  discountType: string
  createdVia: 'new' | 'copy'
  semFees: SemFeesMap
  // Header-level fields for the save-complete POST.
  localOrForeign: boolean
  amtPer: string
  lef: string
  lefCurrency: string
  cef: string
  cefCurrency: string
  ace: string
  aceCurrency: string
}

function blankItem(id: number): FeeItem {
  return { id, amount: '', currencyGuid: '', ledgerGuid: '', ledgerPriority: '' }
}

function makeDefaultStructures(): Structure[] {
  return [{
    id: 1, programme: '', feeCode: '', description: '', currency: 'UGX', intake: '', discountType: 'Amount', createdVia: 'new', semFees: {},
    localOrForeign: false, amtPer: '', lef: '', lefCurrency: '', cef: '', cefCurrency: '', ace: '', aceCurrency: '',
  }]
}

let nextId = 200
let nextStructId = 100

type EditData = { programmeCode: string; intake: string; feeCode: string; description: string; currency: string }

export function FeeStructureModal({ isOpen, onClose, showToast, mode, editData }: ModalProps & { mode?: 'edit'; editData?: EditData }) {
  const { data: programs = [] }   = useProgramMasters()
  const { data: intakes = [] }    = useIntakes()
  const { data: currencies = [] } = useCurrencies()
  const saveFeeStructureComplete  = useSaveProgramFeeStructureComplete()
  // Per Fee_Structure_Change_Requests.md #4 — Create no longer offers an
  // Intake dropdown at all, it's forced to whatever intake is currently
  // flagged current (the same "Current Academic Intake" hero-card filter
  // already used on /academic/intake-master), shown read-only.
  const { data: currentAcademicIntake } = useCurrentAcademicIntake()

  const programOptions = programs.map(p => ({ value: p.programGuid, label: `${p.programName} (${p.programCode})` }))
  // Same real intakeGuid convention as ProgrammeModal's Intake step. Still
  // needed even though the field is now always read-only — SearchSelect
  // resolves the display label for the selected guid from this list.
  const intakeOptions  = intakes.map(i => ({ value: i.intakeGuid, label: `${i.intakeCode} — ${i.description}` }))
  // Currency.intCurrency (a number) is what the header payload's Lec/Cec/Acec
  // fields need — unconfirmed for save-complete specifically (the sample
  // payload showed them all null), kept as-is to match the one confirmed
  // header contract (ProgramFeeStructureHeaderInput) rather than guessed.
  const currencyIntOptions = currencies.map(c => ({ value: String(c.intCurrency), label: `${c.currencyCode} — ${c.currencyName}` }))

  const [saved, setSaved]           = useState(false)
  const [submitting, setSubmitting] = useState(false)
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

  // Create mode has no Intake picker any more (#4) — every structure is
  // forced onto whatever intake is currently flagged current. Applies to
  // every structure, not just the active one, since Create no longer offers
  // a way to pick a different intake per structure at all.
  useEffect(() => {
    if (isOpen && mode !== 'edit' && currentAcademicIntake) {
      setStructures(prev => prev.map(s => s.intake === currentAcademicIntake.intakeGuid ? s : { ...s, intake: currentAcademicIntake.intakeGuid }))
    }
  }, [isOpen, mode, currentAcademicIntake])

  const active = structures[activeIdx]

  // Real semesters for the currently selected programme — drives the
  // per-semester accordion below instead of a fixed Sem 1-6 range. These
  // must stay above the `if (!isOpen) return null` below — every hook in
  // this component has to run on every render regardless of isOpen, or
  // React loses track of hook order between a closed and open render.
  const { data: semesters = [] } = useSemestersForProgram(active.programme, !!active.programme)
  const { data: financeCurrencies = [] } = useFinanceCurrencies()
  const financeCurrencyOptions = financeCurrencies.map(c => ({ value: c.currencyGuid, label: `${c.currencyCode} — ${c.currencyName}` }))
  const { data: ledgers = [] } = useLedgers()
  const ledgerOptions = ledgers.map(l => ({ value: l.ledgerGuid, label: l.ledgerName }))

  if (!isOpen) return null

  function structureComplete(s: Structure) {
    return !!(s.feeCode.trim() && s.description.trim() && s.currency && s.intake)
  }
  // Every fee item needs a currency and ledger selected; otherwise the payload sends empty and the backend rejects it.
  function structHasCurrencyGaps(s: Structure) {
    return Object.values(s.semFees).some(items => items.some(item => !item.currencyGuid))
  }
  function structHasLedgerGaps(s: Structure) {
    return Object.values(s.semFees).some(items => items.some(item => !item.ledgerGuid))
  }
  const activeComplete   = structureComplete(active)
  const anyCurrencyGaps  = structures.some(structHasCurrencyGaps)
  const anyLedgerGaps    = structures.some(structHasLedgerGaps)
  const allComplete      = structures.every(structureComplete) && !anyCurrencyGaps && !anyLedgerGaps

  function handleClose() { setSaved(false); setStructures(makeDefaultStructures()); setActiveIdx(0); setActiveAcc(0); onClose() }

  // ── Structure management ─────────────────────────────────
  function addStructure() {
    const newStruct: Structure = {
      id: nextStructId++, programme: '', feeCode: '', description: '', currency: 'UGX',
      intake: mode !== 'edit' ? (currentAcademicIntake?.intakeGuid ?? '') : '',
      discountType: 'Amount', createdVia: 'new', semFees: {},
      localOrForeign: false, amtPer: '', lef: '', lefCurrency: '', cef: '', cefCurrency: '', ace: '', aceCurrency: '',
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
    setStructures(prev => prev.map((s, i) => i === activeIdx ? { ...s, [field]: val } : s))
  }

  function updateLocalOrForeign(val: string) {
    setStructures(prev => prev.map((s, i) => i === activeIdx ? { ...s, localOrForeign: val === 'true' } : s))
  }

  // ── Fee item management (scoped to active structure, keyed by semesterGuid) ─
  function addItem(semesterGuid: string) {
    setStructures(prev => prev.map((s, i) =>
      i === activeIdx
        ? { ...s, semFees: { ...s.semFees, [semesterGuid]: [...(s.semFees[semesterGuid] ?? []), blankItem(nextId++)] } }
        : s
    ))
  }

  function removeItem(semesterGuid: string, id: number) {
    setStructures(prev => prev.map((s, i) =>
      i === activeIdx
        ? { ...s, semFees: { ...s.semFees, [semesterGuid]: (s.semFees[semesterGuid] ?? []).filter(f => f.id !== id) } }
        : s
    ))
  }

  function updateItem(semesterGuid: string, id: number, field: keyof FeeItem, val: string) {
    setStructures(prev => prev.map((s, i) =>
      i === activeIdx
        ? { ...s, semFees: { ...s.semFees, [semesterGuid]: (s.semFees[semesterGuid] ?? []).map(f => f.id === id ? { ...f, [field]: val } : f) } }
        : s
    ))
  }

  function moveItem(semesterGuid: string, idx: number, dir: -1 | 1) {
    const to = idx + dir
    setStructures(prev => prev.map((s, i) => {
      if (i !== activeIdx) return s
      const items = s.semFees[semesterGuid] ?? []
      if (to < 0 || to >= items.length) return s
      const next = [...items]
      ;[next[idx], next[to]] = [next[to], next[idx]]
      return { ...s, semFees: { ...s.semFees, [semesterGuid]: next } }
    }))
  }

  // Saves every structure in the sidebar as its own header+lines
  // save-complete call. Each call is independently a complete record on the
  // backend, so a failure partway through leaves the earlier ones saved —
  // surfaced via toast rather than attempted rollback.
  async function handleSubmitAll() {
    if (!allComplete) return
    setSubmitting(true)
    try {
      for (const s of structures) {
        const feeLines: ProgramFeeLineSaveInput[] = Object.entries(s.semFees).flatMap(([semesterGuid, items]) =>
          items.map(item => {
            const ledger = ledgers.find(l => l.ledgerGuid === item.ledgerGuid)
            return {
              semesterGuid,
              ledgerGuid: item.ledgerGuid,
              currencyGuid: item.currencyGuid,
              ledgerNum: ledger?.ledgerNum ?? 0,
              amount: +item.amount || 0,
            }
          })
        )
        await saveFeeStructureComplete.mutateAsync({
          feeCode: s.feeCode,
          feeDesc: s.description,
          status: true,
          localOrForeign: s.localOrForeign,
          programGuid: s.programme,
          lef: s.lef ? +s.lef : null,
          cef: s.cef ? +s.cef : null,
          ace: s.ace ? +s.ace : null,
          lec: s.lefCurrency ? +s.lefCurrency : null,
          cec: s.cefCurrency ? +s.cefCurrency : null,
          acec: s.aceCurrency ? +s.aceCurrency : null,
          calcType: s.discountType === 'Percentage' ? 2 : 1,
          amtPer: s.amtPer ? +s.amtPer : null,
          intakeGuid: s.intake || null,
          feeLines,
        })
      }
      setSaved(true)
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to save fee structure(s). Please try again.', 'error')
    } finally {
      setSubmitting(false)
    }
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
        <div className="modal-hdr modal-hdr-blue">
          <div className="modal-title"><i className="lni lni-dollar"></i> {mode === 'edit' ? 'Edit' : 'Add'} Fee Structure</div>
          <button className="modal-close" onClick={handleClose}><i className="lni lni-close"></i></button>
        </div>

        {/* ── Two-panel layout ──────────────────────────────────── */}
        <div className="fsm-layout">

          {/* Left sidebar — structure list */}
          <div className="fsm-sidebar">
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
          <div className="fsm-main">

            {/* Programme selector — read-only once editing an existing
                structure (Fee_Structure_Change_Requests.md #3): the
                associated Programme is shown but can't be changed. */}
            <div className="fg m-0 mb-[18px]">
              <div className="lbl">Programme {mode !== 'edit' && <span className="req">*</span>}</div>
              <SearchSelect
                placeholder="— Select a programme to begin —"
                value={active.programme}
                onChange={val => updateStructureMeta('programme', val)}
                options={programOptions}
                disabled={mode === 'edit'}
              />
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
              {/* Intake is always read-only now (Fee_Structure_Change_Requests.md
                  #3 and #4): in Edit mode it shows the structure's existing
                  intake, unchangeable; in Create mode there's no picker at
                  all — it's forced onto the Current Academic Intake (see the
                  effect above and addStructure). */}
              <div className="fg m-0">
                <div className="lbl">Intake</div>
                <SearchSelect
                  placeholder={mode === 'edit' ? '— Select intake —' : (currentAcademicIntake ? undefined : 'No current intake set')}
                  value={active.intake}
                  options={intakeOptions}
                  disabled
                />
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
            </div>

            {/* Per-semester accordion — driven by the selected programme's real semesters */}
            <div className="flex flex-col gap-2">
              {active.programme && semesters.length === 0 && (
                <div className="text-g400 italic" style={{ fontSize: 12.5 }}>No semesters found for this programme.</div>
              )}
              {semesters.map((sem, si) => {
                const items  = active.semFees[sem.semesterGuid] ?? []
                const isOpen = activeAcc === si
                const total  = items.reduce((s, f) => s + (parseFloat(f.amount) || 0), 0)
                const totalCurrencyCode = financeCurrencies.find(c => c.currencyGuid === items[0]?.currencyGuid)?.currencyCode ?? ''
                return (
                  <div key={sem.semesterGuid} style={{ border: '1.5px solid var(--b100)', borderRadius: 'var(--rsm)', overflow: 'hidden' }}>
                    <button
                      type="button"
                      onClick={() => setActiveAcc(isOpen ? -1 : si)}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', width: '100%', background: isOpen ? 'var(--b50)' : 'var(--white)', border: 'none', borderBottom: isOpen ? '1px solid var(--b100)' : 'none', cursor: 'pointer', textAlign: 'left', transition: 'background 0.2s' }}
                    >
                      <span className="badge badge-blue" style={{ flexShrink: 0 }}>Sem {si + 1}</span>
                      <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--b700)' }}>{sem.semName}</span>
                      {items.length > 0
                        ? <span style={{ marginLeft: 'auto', fontSize: 11.5, color: 'var(--g400)', marginRight: 8 }}>{items.length} item{items.length !== 1 ? 's' : ''} · {total.toLocaleString()} {totalCurrencyCode}</span>
                        : <span style={{ marginLeft: 'auto', fontSize: 11.5, color: 'var(--g400)', fontStyle: 'italic', marginRight: 8 }}>No items</span>
                      }
                      <i className="lni lni-chevron-down" style={{ fontSize: 11, color: 'var(--g400)', flexShrink: 0, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.25s ease' }} />
                    </button>
                    <div style={{ overflow: 'hidden', maxHeight: isOpen ? 800 : 0, transition: 'max-height 0.3s ease' }}>
                      <div style={{ padding: '10px 14px' }}>
                        {items.length > 0 && (
                          <div className="fsm-item-hdr">
                            <span style={{ textAlign: 'center' }}>Pri.</span><span>Ledger</span><span>Ledger Priority</span><span>Amount</span><span>Currency</span><span></span>
                          </div>
                        )}
                        <div className="flex flex-col gap-1">
                          {items.length === 0 && (
                            <div className="text-g400 italic" style={{ fontSize: 12.5, marginBottom: 8 }}>No fee items — click &ldquo;Add Fee Item&rdquo; to begin.</div>
                          )}
                          {items.map((f, idx) => (
                            <div key={f.id} className="fsm-item-row">
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
                                <button className="btn btn-neu" style={{ width: 26, height: 14, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }} onClick={() => moveItem(sem.semesterGuid, idx, -1)} disabled={idx === 0}><i className="lni lni-chevron-up"></i></button>
                                <button className="btn btn-neu" style={{ width: 26, height: 14, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }} onClick={() => moveItem(sem.semesterGuid, idx, 1)} disabled={idx === items.length - 1}><i className="lni lni-chevron-down"></i></button>
                              </div>
                              <SearchSelect placeholder="— Select Ledger —" options={ledgerOptions} value={f.ledgerGuid} onChange={val => updateItem(sem.semesterGuid, f.id, 'ledgerGuid', val)} />
                              <input className="ctrl" value={f.ledgerPriority} onChange={e => updateItem(sem.semesterGuid, f.id, 'ledgerPriority', e.target.value)} type="number" min={0} placeholder="e.g. 1" />
                              <input className="ctrl" value={f.amount} onChange={e => updateItem(sem.semesterGuid, f.id, 'amount', e.target.value)} type="number" min={0} placeholder="0" />
                              <SearchSelect placeholder="— Currency —" options={financeCurrencyOptions} value={f.currencyGuid} onChange={val => updateItem(sem.semesterGuid, f.id, 'currencyGuid', val)} />
                              <button className="btn btn-danger btn-sm" style={{ width: 32, height: 32, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }} onClick={() => removeItem(sem.semesterGuid, f.id)}><i className="lni lni-trash-can"></i></button>
                            </div>
                          ))}
                          <button className="btn btn-neu btn-sm mt-2" style={{ alignSelf: 'flex-start', fontSize: 11 }} onClick={() => addItem(sem.semesterGuid)}>
                            <i className="lni lni-plus"></i> Add Fee Item
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
              {(anyCurrencyGaps || anyLedgerGaps) && (
                <p style={{ color: 'var(--red)', fontSize: 12 }}>Select a currency and ledger for every fee item before saving.</p>
              )}
              <div className="flex justify-end mt-2">
                <button className="btn btn-primary" onClick={handleSubmitAll} disabled={!allComplete || submitting}>
                  <i className="lni lni-checkmark"></i> {submitting ? 'Saving…' : 'Save Fee Structure'}
                </button>
              </div>
            </div>
            </div>{/* end gate wrapper */}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-neu" onClick={handleClose}>Cancel</button>
        </div>
      </div>
    </div>
  )
}
