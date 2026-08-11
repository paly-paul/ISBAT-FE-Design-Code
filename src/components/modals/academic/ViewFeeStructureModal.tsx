'use client'
import { useState } from 'react'
import { ModalProps } from '../types'
import { useProgramFeeLines, ProgramFeeStructureHeader } from '@/hooks/academic/useProgramFeeStructure'
import { useProgramMasters } from '@/hooks/academic/useProgramMaster'
import { useIntakes } from '@/hooks/academic/useIntakes'
import { useFinanceCurrencies } from '@/hooks/finance/useFinanceCurrencies'
import { useSemestersForProgram } from '@/hooks/academic/useSemesters'
import { useLedgers } from '@/hooks/finance/useLedgers'
import { FailurePopup } from './FailurePopup'
import { AuthError } from '@/lib/api/client'

interface ViewFeeStructureModalProps extends ModalProps {
  feeStructure?: ProgramFeeStructureHeader
}

export function ViewFeeStructureModal({ isOpen, onClose, feeStructure }: ViewFeeStructureModalProps) {
  const { data: feeLines = [], isLoading: feeLinesLoading, isError: feeLinesError, error: feeLinesErrorObj } = useProgramFeeLines(feeStructure?.feeHdGuid ?? null, isOpen && !!feeStructure)
  
  const { data: programs = [] } = useProgramMasters()
  const { data: intakes = [] } = useIntakes()
  const { data: financeCurrencies = [] } = useFinanceCurrencies()
  const { data: ledgers = [] } = useLedgers()
  const { data: semesters = [] } = useSemestersForProgram(feeStructure?.programGuid ?? '', isOpen && !!feeStructure?.programGuid)

  const [feeAccordion, setFeeAccordion] = useState(0)

  if (!isOpen || !feeStructure) return null

  if (feeLinesError) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <FailurePopup
            title="Couldn't Load Fee Lines"
            subtitle={feeLinesErrorObj instanceof AuthError ? (feeLinesErrorObj.message || 'Failed to load details.') : 'Failed to load details.'}
            onClose={onClose}
          />
        </div>
      </div>
    )
  }

  const programName = programs.find(p => p.programGuid === feeStructure.programGuid)?.programName || '—'
  const programCode = programs.find(p => p.programGuid === feeStructure.programGuid)?.programCode || '—'
  const intakeName = intakes.find(i => i.intakeGuid === feeStructure.intakeGuid)?.description || '—'

  return (
    <div className="modal-overlay open" id="view-feestruct-modal">
      <div className="modal modal-80 modal-flex" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr modal-hdr-blue">
          <div className="modal-title"><i className="lni lni-eye"></i> View Fee Structure — <span className="font-mono">{feeStructure.feeCode}</span></div>
          <button className="modal-close" onClick={onClose}><i className="lni lni-close"></i></button>
        </div>
        
        {feeLinesLoading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 240, flex: 1 }}>
            <span style={{ color: 'var(--g400)' }}>Loading fee structure details…</span>
          </div>
        ) : (
          <div className="modal-scroll" style={{ paddingBottom: 24 }}>
            <div className="sec-divider" style={{ marginTop: 0 }}>Basic Details</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', columnGap: '3.5rem', rowGap: '1.5rem', marginBottom: 24 }}>
              <div className="fg span2">
                <div className="lbl" style={{ color: 'var(--g500)', marginBottom: 4 }}>Programme</div>
                <div className="ctrl" style={{ display: 'flex', alignItems: 'center', background: 'var(--g50)', color: 'var(--g900)', fontWeight: 500, minHeight: 34, fontSize: 13.5, border: '1.5px solid var(--g200)', borderRadius: 'var(--rxs)' }}>
                  {programName} ({programCode})
                </div>
              </div>
              <div className="fg">
                <div className="lbl" style={{ color: 'var(--g500)', marginBottom: 4 }}>Intake</div>
                <div className="ctrl" style={{ display: 'flex', alignItems: 'center', background: 'var(--g50)', color: 'var(--g900)', fontWeight: 500, minHeight: 34, fontSize: 13.5, border: '1.5px solid var(--g200)', borderRadius: 'var(--rxs)' }}>
                  {intakeName}
                </div>
              </div>
              <div className="fg">
                <div className="lbl" style={{ color: 'var(--g500)', marginBottom: 4 }}>Fee Code</div>
                <div className="ctrl font-mono uppercase" style={{ display: 'flex', alignItems: 'center', background: 'var(--g50)', color: 'var(--g900)', fontWeight: 500, minHeight: 34, fontSize: 13.5, border: '1.5px solid var(--g200)', borderRadius: 'var(--rxs)' }}>
                  {feeStructure.feeCode}
                </div>
              </div>
              <div className="fg">
                <div className="lbl" style={{ color: 'var(--g500)', marginBottom: 4 }}>Fee Description</div>
                <div className="ctrl" style={{ display: 'flex', alignItems: 'center', background: 'var(--g50)', color: 'var(--g900)', fontWeight: 500, minHeight: 34, fontSize: 13.5, border: '1.5px solid var(--g200)', borderRadius: 'var(--rxs)' }}>
                  {feeStructure.feeDesc || '—'}
                </div>
              </div>
              <div className="fg">
                <div className="lbl" style={{ color: 'var(--g500)', marginBottom: 4 }}>Base Currency</div>
                <div className="ctrl" style={{ display: 'flex', alignItems: 'center', background: 'var(--g50)', color: 'var(--g900)', fontWeight: 500, minHeight: 34, fontSize: 13.5, border: '1.5px solid var(--g200)', borderRadius: 'var(--rxs)' }}>
                  {feeStructure.localOrForeign ? 'Foreign' : 'Local'}
                </div>
              </div>
              <div className="fg">
                <div className="lbl" style={{ color: 'var(--g500)', marginBottom: 4 }}>Status</div>
                <div className="ctrl" style={{ display: 'flex', alignItems: 'center', background: 'var(--g50)', color: 'var(--g900)', fontWeight: 500, minHeight: 34, fontSize: 13.5, border: '1.5px solid var(--g200)', borderRadius: 'var(--rxs)' }}>
                  {feeStructure.status ? <span className="badge badge-green"><span className="bdot"></span>Active</span> : <span className="badge badge-grey">Inactive</span>}
                </div>
              </div>
            </div>

            <div className="bg-[linear-gradient(135deg,#f0f5ff_0%,var(--white)_70%)] border-[1.5px] border-dashed border-[var(--b200)] rounded-[var(--rsm)] p-[14px_16px] mb-[24px]">
              <div className="flex items-center gap-2 font-bold uppercase mb-3" style={{ fontSize: 'var(--fs-xs)', letterSpacing: '.08em', color: '#2d448f' }}>
                <i className="lni lni-tag" style={{ fontSize: 'var(--fs-md)' }}></i>
                <span>Programme-level Fees &amp; Discounts</span>
              </div>
              <div className="g3">
                <div className="fg m-0">
                  <div className="lbl">Lumpsum Discount Type</div>
                  <div className="ctrl" style={{ display: 'flex', alignItems: 'center', background: 'var(--white)', color: 'var(--g900)', fontWeight: 500, minHeight: 34, fontSize: 13.5, border: '1.5px solid var(--g200)', borderRadius: 'var(--rxs)' }}>
                    {feeStructure.calcType === 2 ? 'Percentage' : 'Amount'}
                  </div>
                </div>
                <div className="fg m-0">
                  <div className="lbl">Lumpsum Discount Value</div>
                  <div className="ctrl" style={{ display: 'flex', alignItems: 'center', background: 'var(--white)', color: 'var(--g900)', fontWeight: 500, minHeight: 34, fontSize: 13.5, border: '1.5px solid var(--g200)', borderRadius: 'var(--rxs)' }}>
                    {feeStructure.amtPer ?? '0'} {feeStructure.calcType === 2 ? '%' : ''}
                  </div>
                </div>
                <div className="fg m-0">
                  <div className="lbl">Lateral Entry Fee</div>
                  <div className="ctrl" style={{ display: 'flex', alignItems: 'center', background: 'var(--white)', color: 'var(--g900)', fontWeight: 500, minHeight: 34, fontSize: 13.5, border: '1.5px solid var(--g200)', borderRadius: 'var(--rxs)' }}>
                    {feeStructure.lef ?? '0'}
                  </div>
                </div>
                <div className="fg m-0">
                  <div className="lbl">Credit Exemption Fee</div>
                  <div className="ctrl" style={{ display: 'flex', alignItems: 'center', background: 'var(--white)', color: 'var(--g900)', fontWeight: 500, minHeight: 34, fontSize: 13.5, border: '1.5px solid var(--g200)', borderRadius: 'var(--rxs)' }}>
                    {feeStructure.cef ?? '0'}
                  </div>
                </div>
                <div className="fg m-0">
                  <div className="lbl">Aptech Credit Exemption Fee</div>
                  <div className="ctrl" style={{ display: 'flex', alignItems: 'center', background: 'var(--white)', color: 'var(--g900)', fontWeight: 500, minHeight: 34, fontSize: 13.5, border: '1.5px solid var(--g200)', borderRadius: 'var(--rxs)' }}>
                    {feeStructure.ace ?? '0'}
                  </div>
                </div>
              </div>
            </div>

            <div className="sec-divider">Semester-wise Fee Structure</div>
            {semesters.length === 0 && (
              <div className="text-g400 italic text-sm mt-4">No semesters found for this programme.</div>
            )}
            <div className="flex flex-col gap-2">
              {semesters.map((sem, si) => {
                const isOpen = feeAccordion === si
                const items = feeLines.filter(f => f.semesterGuid === sem.semesterGuid) || []
                const total = items.reduce((s, f) => s + (f.amount || 0), 0)
                const totalCurrencyCode = financeCurrencies.find(c => c.currencyGuid === items[0]?.currencyGuid)?.currencyCode ?? ''

                return (
                  <div key={sem.semesterGuid} style={{ border: '1.5px solid var(--b100)', borderRadius: 'var(--rsm)', overflow: 'hidden' }}>
                    <button
                      type="button"
                      onClick={() => setFeeAccordion(isOpen ? -1 : si)}
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
                          <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr 90px 130px', gap: 6, padding: '0 0 4px', fontSize: 10.5, fontWeight: 700, color: 'var(--g400)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            <span style={{ textAlign: 'center' }}>Pri.</span><span>Ledger</span><span>Amount</span><span>Currency</span>
                          </div>
                        )}
                        <div className="flex flex-col gap-1">
                          {items.length === 0 && (
                            <div className="text-g400 italic" style={{ fontSize: 12.5, marginBottom: 8 }}>No fee items for this semester.</div>
                          )}
                          {items.map((f, idx) => {
                            const ledgerName = ledgers.find(l => l.ledgerGuid === f.ledgerGuid)?.ledgerName || '—'
                            const currencyCode = financeCurrencies.find(c => c.currencyGuid === f.currencyGuid)?.currencyCode || '—'
                            return (
                              <div key={idx} style={{ display: 'grid', gridTemplateColumns: '40px 1fr 90px 130px', gap: 6, alignItems: 'center', background: 'var(--white)', border: '1px solid var(--g200)', borderRadius: 'var(--rxs)', padding: '6px 8px', fontSize: 12.5 }}>
                                <div style={{ textAlign: 'center', fontWeight: 600, color: 'var(--g500)' }}>{f.ledgerNum}</div>
                                <div style={{ fontWeight: 500, color: 'var(--g900)' }}>{ledgerName}</div>
                                <div style={{ fontFamily: 'var(--font-mono)' }}>{f.amount}</div>
                                <div>{currencyCode}</div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div className="modal-footer">
          <span className="flex-1"></span>
          <button className="btn btn-primary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
