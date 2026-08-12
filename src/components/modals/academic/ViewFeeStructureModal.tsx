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

  const [activeSection, setActiveSection] = useState<'details' | 'discounts' | 'semesters'>('details')
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
        <div className="modal-hdr">
          <div className="modal-title"><i className="lni lni-eye"></i> View Fee Structure — <span className="font-mono">{feeStructure.feeCode}</span></div>
          <button className="modal-close" onClick={onClose}><i className="lni lni-close"></i></button>
        </div>

        {feeLinesLoading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 240, flex: 1 }}>
            <span style={{ color: 'var(--g400)' }}>Loading fee structure details…</span>
          </div>
        ) : (
          <div className="fsm-layout" style={{ borderTop: '1px solid var(--g200)' }}>
            {/* Left sidebar */}
            <div className="fsm-sidebar">
              <div style={{ padding: '14px 14px 6px', fontSize: 10.5, fontWeight: 700, color: 'var(--g400)', textTransform: 'uppercase', letterSpacing: '.07em' }}>
                Structure Settings
              </div>
              <div style={{ padding: '0 8px', marginBottom: 12 }}>
                <div
                  onClick={() => setActiveSection('details')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '9px 10px', borderRadius: 'var(--rsm)', marginBottom: 2,
                    background: activeSection === 'details' ? 'var(--b500)' : 'transparent',
                    color: activeSection === 'details' ? '#fff' : 'var(--g700)',
                    cursor: 'pointer', transition: 'background .15s',
                  }}
                >
                  <div style={{ width: 30, height: 30, borderRadius: '50%', background: activeSection === 'details' ? 'rgba(255,255,255,.2)' : 'var(--b100)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <i className="lni lni-information" style={{ fontSize: 13, color: activeSection === 'details' ? '#fff' : 'var(--b600)' }}></i>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, lineHeight: 1.3 }}>Basic Details</div>
                  </div>
                </div>
                <div
                  onClick={() => setActiveSection('discounts')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '9px 10px', borderRadius: 'var(--rsm)', marginBottom: 2,
                    background: activeSection === 'discounts' ? 'var(--b500)' : 'transparent',
                    color: activeSection === 'discounts' ? '#fff' : 'var(--g700)',
                    cursor: 'pointer', transition: 'background .15s',
                  }}
                >
                  <div style={{ width: 30, height: 30, borderRadius: '50%', background: activeSection === 'discounts' ? 'rgba(255,255,255,.2)' : 'var(--b100)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <i className="lni lni-tag" style={{ fontSize: 13, color: activeSection === 'discounts' ? '#fff' : 'var(--b600)' }}></i>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, lineHeight: 1.3 }}>Fees & Discounts</div>
                  </div>
                </div>
                <div
                  onClick={() => setActiveSection('semesters')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '9px 10px', borderRadius: 'var(--rsm)', marginBottom: 2,
                    background: activeSection === 'semesters' ? 'var(--b500)' : 'transparent',
                    color: activeSection === 'semesters' ? '#fff' : 'var(--g700)',
                    cursor: 'pointer', transition: 'background .15s',
                  }}
                >
                  <div style={{ width: 30, height: 30, borderRadius: '50%', background: activeSection === 'semesters' ? 'rgba(255,255,255,.2)' : 'var(--b100)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <i className="lni lni-coin" style={{ fontSize: 13, color: activeSection === 'semesters' ? '#fff' : 'var(--b600)' }}></i>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, lineHeight: 1.3 }}>Semester Fees</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right main panel */}
            <div className="fsm-main modal-scroll" style={{ padding: '24px' }}>
              {activeSection === 'details' && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, padding: '12px 16px', background: 'var(--b50)', borderRadius: 'var(--rsm)', border: '1.5px solid var(--b100)' }}>
                    <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--b100)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <i className="lni lni-information" style={{ color: 'var(--b600)', fontSize: 17 }}></i>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--b800)' }}>Basic Details</div>
                      <div style={{ fontSize: 11.5, color: 'var(--g400)' }}>General information about this fee structure</div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', columnGap: '24px', rowGap: '20px' }}>
                    <div style={{ gridColumn: 'span 2' }}>
                      <div style={{ fontSize: '11.5px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--g500)', letterSpacing: '0.04em', marginBottom: '4px' }}>Programme</div>
                      <div style={{ fontSize: '14px', color: 'var(--g900)', fontWeight: 500 }}>
                        {programName} ({programCode})
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11.5px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--g500)', letterSpacing: '0.04em', marginBottom: '4px' }}>Intake</div>
                      <div style={{ fontSize: '14px', color: 'var(--g900)', fontWeight: 500 }}>
                        {intakeName}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11.5px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--g500)', letterSpacing: '0.04em', marginBottom: '4px' }}>Fee Code</div>
                      <div style={{ fontSize: '14px', color: 'var(--g900)', fontWeight: 500, fontFamily: 'var(--font-mono)' }}>
                        {feeStructure.feeCode}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11.5px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--g500)', letterSpacing: '0.04em', marginBottom: '4px' }}>Fee Description</div>
                      <div style={{ fontSize: '14px', color: 'var(--g900)', fontWeight: 500 }}>
                        {feeStructure.feeDesc || '—'}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11.5px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--g500)', letterSpacing: '0.04em', marginBottom: '4px' }}>Base Currency</div>
                      <div style={{ fontSize: '14px', color: 'var(--g900)', fontWeight: 500 }}>
                        {feeStructure.localOrForeign ? 'Foreign' : 'Local'}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11.5px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--g500)', letterSpacing: '0.04em', marginBottom: '4px' }}>Status</div>
                      <div>
                        {feeStructure.status ? <span className="badge badge-green"><span className="bdot"></span>Active</span> : <span className="badge badge-grey">Inactive</span>}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {activeSection === 'discounts' && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, padding: '12px 16px', background: 'var(--b50)', borderRadius: 'var(--rsm)', border: '1.5px solid var(--b100)' }}>
                    <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--b100)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <i className="lni lni-tag" style={{ color: 'var(--b600)', fontSize: 17 }}></i>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--b800)' }}>Fees & Discounts</div>
                      <div style={{ fontSize: 11.5, color: 'var(--g400)' }}>Programme-level fees and lump sum discounts</div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', columnGap: '24px', rowGap: '20px' }}>
                    <div>
                      <div style={{ fontSize: '11.5px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--g500)', letterSpacing: '0.04em', marginBottom: '4px' }}>Lumpsum Discount Type</div>
                      <div style={{ fontSize: '14px', color: 'var(--g900)', fontWeight: 500 }}>
                        {feeStructure.calcType === 2 ? 'Percentage' : 'Amount'}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11.5px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--g500)', letterSpacing: '0.04em', marginBottom: '4px' }}>Lumpsum Discount Value</div>
                      <div style={{ fontSize: '14px', color: 'var(--g900)', fontWeight: 500 }}>
                        {feeStructure.amtPer ?? '0'} {feeStructure.calcType === 2 ? '%' : ''}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11.5px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--g500)', letterSpacing: '0.04em', marginBottom: '4px' }}>Lateral Entry Fee</div>
                      <div style={{ fontSize: '14px', color: 'var(--g900)', fontWeight: 500 }}>
                        {feeStructure.lef ?? '0'}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11.5px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--g500)', letterSpacing: '0.04em', marginBottom: '4px' }}>Credit Exemption Fee</div>
                      <div style={{ fontSize: '14px', color: 'var(--g900)', fontWeight: 500 }}>
                        {feeStructure.cef ?? '0'}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11.5px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--g500)', letterSpacing: '0.04em', marginBottom: '4px' }}>Aptech Credit Exemption Fee</div>
                      <div style={{ fontSize: '14px', color: 'var(--g900)', fontWeight: 500 }}>
                        {feeStructure.ace ?? '0'}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {activeSection === 'semesters' && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, padding: '12px 16px', background: 'var(--b50)', borderRadius: 'var(--rsm)', border: '1.5px solid var(--b100)' }}>
                    <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--b100)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <i className="lni lni-coin" style={{ color: 'var(--b600)', fontSize: 17 }}></i>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--b800)' }}>Semester Fees</div>
                      <div style={{ fontSize: 11.5, color: 'var(--g400)' }}>Semester-wise fee structure items</div>
                    </div>
                  </div>

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
                </>
              )}
            </div>
          </div>
        )}

        <div className="modal-footer" style={{ borderTop: '1px solid var(--g200)' }}>
          <span className="flex-1"></span>
          <button className="btn btn-primary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
