'use client'
import { useState } from 'react'
import { ModalProps } from '../types'
import { useProgramMasterFullDetails } from '@/hooks/academic/useProgramMaster'
import { useProgramGroups } from '@/hooks/academic/useProgramGroups'
import { useProgramLevels } from '@/hooks/academic/useProgramLevels'
import { useFaculties } from '@/hooks/config/useFaculties'
import { useIntakes } from '@/hooks/academic/useIntakes'
import { useLedgers } from '@/hooks/finance/useLedgers'
import { useFinanceCurrencies } from '@/hooks/finance/useFinanceCurrencies'
import { AuthError } from '@/lib/api/client'
import { FailurePopup } from './FailurePopup'
import { formatDate } from '@/lib/date'

interface ViewProgrammeModalProps extends ModalProps {
  programGuid: string | null
}

export function ViewProgrammeModal({ isOpen, onClose, programGuid }: ViewProgrammeModalProps) {
  const { data: program, isLoading, isError, error } = useProgramMasterFullDetails(programGuid, isOpen)

  const [step, setStep] = useState(1)
  const [activeFeeIdx, setActiveFeeIdx] = useState(0)
  const [feeAccordion, setFeeAccordion] = useState(0)

  const { data: programGroups = [] } = useProgramGroups()
  const { data: programLevels = [] } = useProgramLevels()
  const { data: faculties = [] } = useFaculties()
  const { data: intakes = [] } = useIntakes()
  const { data: ledgers = [] } = useLedgers()
  const { data: financeCurrencies = [] } = useFinanceCurrencies()

  if (!isOpen) return null

  if (isError) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <FailurePopup
            title="Couldn't Load Programme details"
            subtitle={error instanceof AuthError ? (error.message || 'Failed to load details.') : 'Failed to load details.'}
            onClose={onClose}
          />
        </div>
      </div>
    )
  }

  if (isLoading || !program) {
    return (
      <div className="modal-overlay open">
        <div className="modal modal-80 modal-flex" onClick={e => e.stopPropagation()}>
          <div className="modal-hdr" style={{ background: 'var(--b600)', color: 'white' }}>
            <div className="modal-title"><i className="lni lni-eye"></i> View Programme</div>
            <button className="modal-close" style={{ color: 'white' }} onClick={onClose}><i className="lni lni-close"></i></button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 240 }}>
            <span style={{ color: 'var(--g400)' }}>Loading programme details…</span>
          </div>
        </div>
      </div>
    )
  }

  const groupName = programGroups.find(g => g.programGroupGuid === program.programGroupGuid)?.groupName || '—'
  const levelName = programLevels.find(l => l.programLevelGuid === program.programLevelGuid)?.levelName || '—'
  const facultyName = faculties.find(f => f.facultyGuid === program.facultyGuid)?.facultyName || '—'
  const intakeName = intakes.find(i => i.intakeGuid === program.intakeGuid)?.description || '—'

  const activeFeeStruct = program.feeStructures?.[activeFeeIdx]

  return (
    <div className="modal-overlay open">
      <div className="modal modal-80 modal-flex" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr" style={{ background: 'var(--b600)', color: 'white' }}>
          <div className="modal-title"><i className="lni lni-eye"></i> View Programme — <span className="font-mono">{program.programCode}</span></div>
          <button className="modal-close" style={{ color: 'white' }} onClick={onClose}><i className="lni lni-close"></i></button>
        </div>

        <div className="prog-steps" style={{ padding: '0 24px', cursor: 'pointer' }}>
          <div className={`prog-step${step === 1 ? ' active' : ''}`} onClick={() => setStep(1)}><span className="prog-step-num">1</span><span>Programme Details</span></div>
          <div className="prog-step-line"></div>
          <div className={`prog-step${step === 2 ? ' active' : ''}`} onClick={() => setStep(2)}><span className="prog-step-num">2</span><span>Course Unit Allocation</span></div>
          <div className="prog-step-line"></div>
          <div className={`prog-step${step === 3 ? ' active' : ''}`} onClick={() => setStep(3)}><span className="prog-step-num">3</span><span>Semester-wise Fee Structure</span></div>
        </div>

        <div className="modal-scroll" style={{ paddingBottom: 24 }}>

          {/* STEP 1: Basic Details */}
          {step === 1 && (
            <>
              <div className="sec-divider" style={{ marginTop: 0 }}>Basic Details</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', columnGap: '3.5rem', rowGap: '1.5rem', marginBottom: 24 }}>
                <div className="fg">
                  <div className="lbl" style={{ color: 'var(--g500)', marginBottom: 4 }}>Programme Code</div>
                  <div className="ctrl font-mono uppercase" style={{ display: 'flex', alignItems: 'center', background: 'var(--g50)', color: 'var(--g900)', fontWeight: 500, minHeight: 34, fontSize: 13.5, border: '1.5px solid var(--g200)', borderRadius: 'var(--rxs)' }}>
                    {program.programCode}
                  </div>
                </div>
                <div className="fg span2">
                  <div className="lbl" style={{ color: 'var(--g500)', marginBottom: 4 }}>Programme Name</div>
                  <div className="ctrl" style={{ display: 'flex', alignItems: 'center', background: 'var(--g50)', color: 'var(--g900)', fontWeight: 500, minHeight: 34, fontSize: 13.5, border: '1.5px solid var(--g200)', borderRadius: 'var(--rxs)' }}>
                    {program.programName}
                  </div>
                </div>
                <div className="fg">
                  <div className="lbl" style={{ color: 'var(--g500)', marginBottom: 4 }}>Programme Group</div>
                  <div className="ctrl" style={{ display: 'flex', alignItems: 'center', background: 'var(--g50)', color: 'var(--g900)', fontWeight: 500, minHeight: 34, fontSize: 13.5, border: '1.5px solid var(--g200)', borderRadius: 'var(--rxs)' }}>
                    {groupName}
                  </div>
                </div>
                <div className="fg">
                  <div className="lbl" style={{ color: 'var(--g500)', marginBottom: 4 }}>Programme Level</div>
                  <div className="ctrl" style={{ display: 'flex', alignItems: 'center', background: 'var(--g50)', color: 'var(--g900)', fontWeight: 500, minHeight: 34, fontSize: 13.5, border: '1.5px solid var(--g200)', borderRadius: 'var(--rxs)' }}>
                    {levelName}
                  </div>
                </div>
                <div className="fg">
                  <div className="lbl" style={{ color: 'var(--g500)', marginBottom: 4 }}>Faculty</div>
                  <div className="ctrl" style={{ display: 'flex', alignItems: 'center', background: 'var(--g50)', color: 'var(--g900)', fontWeight: 500, minHeight: 34, fontSize: 13.5, border: '1.5px solid var(--g200)', borderRadius: 'var(--rxs)' }}>
                    {facultyName}
                  </div>
                </div>
                <div className="fg">
                  <div className="lbl" style={{ color: 'var(--g500)', marginBottom: 4 }}>Intake</div>
                  <div className="ctrl" style={{ display: 'flex', alignItems: 'center', background: 'var(--g50)', color: 'var(--g900)', fontWeight: 500, minHeight: 34, fontSize: 13.5, border: '1.5px solid var(--g200)', borderRadius: 'var(--rxs)' }}>
                    {intakeName}
                  </div>
                </div>
                <div className="fg">
                  <div className="lbl" style={{ color: 'var(--g500)', marginBottom: 4 }}>Total Course Units</div>
                  <div className="ctrl" style={{ display: 'flex', alignItems: 'center', background: 'var(--g50)', color: 'var(--g900)', fontWeight: 500, minHeight: 34, fontSize: 13.5, border: '1.5px solid var(--g200)', borderRadius: 'var(--rxs)' }}>
                    {program.unitCount}
                  </div>
                </div>
                <div className="fg">
                  <div className="lbl" style={{ color: 'var(--g500)', marginBottom: 4 }}>Accreditation Date</div>
                  <div className="ctrl" style={{ display: 'flex', alignItems: 'center', background: 'var(--g50)', color: 'var(--g900)', fontWeight: 500, minHeight: 34, fontSize: 13.5, border: '1.5px solid var(--g200)', borderRadius: 'var(--rxs)' }}>
                    {program.dateAcc ? formatDate(program.dateAcc) : '—'}
                  </div>
                </div>
              </div>

              <div className="sec-divider">Status &amp; Flags</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', columnGap: '3.5rem', rowGap: '1.5rem', marginBottom: 24 }}>
                <div className="fg">
                  <div className="lbl" style={{ color: 'var(--g500)', marginBottom: 4 }}>Admission Status</div>
                  <div className="ctrl" style={{ display: 'flex', alignItems: 'center', background: 'var(--g50)', color: 'var(--g900)', fontWeight: 500, minHeight: 34, fontSize: 13.5, border: '1.5px solid var(--g200)', borderRadius: 'var(--rxs)' }}>
                    {program.pgmStatus ? <span className="badge badge-green"><span className="bdot"></span>Active</span> : <span className="badge badge-grey">Inactive</span>}
                  </div>
                </div>
                <div className="fg">
                  <div className="lbl" style={{ color: 'var(--g500)', marginBottom: 4 }}>Internal Assessment</div>
                  <div className="ctrl" style={{ display: 'flex', alignItems: 'center', background: 'var(--g50)', color: 'var(--g900)', fontWeight: 500, minHeight: 34, fontSize: 13.5, border: '1.5px solid var(--g200)', borderRadius: 'var(--rxs)' }}>
                    {program.noIa ? <span className="badge badge-amber"><i className="lni lni-checkmark"></i> No Internal Assessment</span> : <span className="badge badge-grey">Standard</span>}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* STEP 2: Course Units */}
          {step === 2 && (
            <div className="flex flex-col gap-3">
              {program.semesters.length === 0 && (
                <div className="text-g400 italic text-sm mt-4">No course units found for this programme.</div>
              )}
              {program.semesters.map((sem, si) => {
                const units = program.programUnits.filter(u => u.semCode === sem.semCode)
                return (
                  <div key={sem.semCode} style={{ border: '1.5px solid var(--b100)', borderRadius: 'var(--rsm)', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--b50)', borderBottom: units.length > 0 ? '1.5px solid var(--b100)' : 'none' }}>
                      <span className="badge badge-blue">Sem {si + 1}</span>
                      <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--b700)' }}>{sem.semName}</span>
                      <span style={{ marginLeft: 'auto', fontSize: 11.5, color: 'var(--g400)' }}>{units.length} course unit{units.length !== 1 ? 's' : ''}</span>
                    </div>
                    {units.length > 0 && (
                      <table className="w-full text-left" style={{ fontSize: 12.5 }}>
                        <thead style={{ background: 'var(--g50)', borderBottom: '1.5px solid var(--g200)', fontSize: 11, color: 'var(--g500)', textTransform: 'uppercase' }}>
                          <tr>
                            <th className="px-4 py-2">Code</th>
                            <th className="px-4 py-2">Course Unit Name</th>
                            <th className="px-4 py-2">Type</th>
                            <th className="px-4 py-2">Category</th>
                            <th className="px-4 py-2">Specialization</th>
                          </tr>
                        </thead>
                        <tbody>
                          {units.map(u => (
                            <tr key={u.courseUnitGuid} style={{ borderBottom: '1px solid var(--g200)' }}>
                              <td className="px-4 py-2 font-mono text-xs">{u.courseUnitCode}</td>
                              <td className="px-4 py-2 font-medium">{u.courseUnitName}</td>
                              <td className="px-4 py-2">{u.unitTypeName || '—'}</td>
                              <td className="px-4 py-2">{u.unitCatName || '—'}</td>
                              <td className="px-4 py-2">{u.streamName || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* STEP 3: Fee Structures */}
          {step === 3 && (
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              {/* Left fee structure list */}
              <div style={{ width: 220, flexShrink: 0, background: 'var(--surface)', border: '1.5px solid var(--g200)', borderRadius: 'var(--rsm)', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: 480 }}>
                <div style={{ padding: '14px 14px 6px', fontSize: 10.5, fontWeight: 700, color: 'var(--g400)', textTransform: 'uppercase', letterSpacing: '.07em' }}>
                  Fee Structures <span style={{ color: 'var(--b500)' }}>({program.feeStructures?.length || 0})</span>
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: '4px 8px', paddingBottom: 12 }}>
                  {(!program.feeStructures || program.feeStructures.length === 0) && (
                    <div className="text-g400 italic text-xs px-2 py-2">No fee structures configured.</div>
                  )}
                  {program.feeStructures?.map((s, i) => (
                    <div
                      key={s.feeHdGuid}
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
                        <div style={{ fontWeight: 600, fontSize: 12.5, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.feeCode}</div>
                        <div style={{ fontSize: 11, opacity: .65, lineHeight: 1.3 }}>{s.localOrForeign ? 'Foreign' : 'Local'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right configuration panel */}
              {activeFeeStruct ? (
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, padding: '10px 14px', background: 'var(--b50)', borderRadius: 'var(--rsm)', border: '1.5px solid var(--b100)' }}>
                    <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--b100)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <i className="lni lni-coin" style={{ color: 'var(--b600)', fontSize: 15 }}></i>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--b800)' }}>{activeFeeStruct.feeCode} — {activeFeeStruct.localOrForeign ? 'Foreign' : 'Local'}</div>
                      <div style={{ fontSize: 11, color: 'var(--g400)' }}>Structure {activeFeeIdx + 1} of {program.feeStructures?.length}</div>
                    </div>
                  </div>

                  <div className="g3 mb-[14px]">
                    <div className="fg m-0">
                      <div className="lbl">Fee Description</div>
                      <div className="ctrl" style={{ display: 'flex', alignItems: 'center', background: 'var(--g50)', color: 'var(--g900)', fontWeight: 500, minHeight: 34, fontSize: 13.5, border: '1.5px solid var(--g200)', borderRadius: 'var(--rxs)' }}>
                        {activeFeeStruct.feeDesc || '—'}
                      </div>
                    </div>
                    <div className="fg m-0">
                      <div className="lbl">Lumpsum Discount Type</div>
                      <div className="ctrl" style={{ display: 'flex', alignItems: 'center', background: 'var(--g50)', color: 'var(--g900)', fontWeight: 500, minHeight: 34, fontSize: 13.5, border: '1.5px solid var(--g200)', borderRadius: 'var(--rxs)' }}>
                        {activeFeeStruct.calcType === 2 ? 'Percentage' : 'Amount'}
                      </div>
                    </div>
                    <div className="fg m-0">
                      <div className="lbl">Lumpsum Discount Value</div>
                      <div className="ctrl" style={{ display: 'flex', alignItems: 'center', background: 'var(--g50)', color: 'var(--g900)', fontWeight: 500, minHeight: 34, fontSize: 13.5, border: '1.5px solid var(--g200)', borderRadius: 'var(--rxs)' }}>
                        {activeFeeStruct.amtPer ?? '0'} {activeFeeStruct.calcType === 2 ? '%' : ''}
                      </div>
                    </div>
                  </div>

                  <div className="bg-[linear-gradient(135deg,#f0f5ff_0%,var(--white)_70%)] border-[1.5px] border-dashed border-[var(--b200)] rounded-[var(--rsm)] p-[14px_16px] mb-[18px]">
                    <div className="flex items-center gap-2 font-bold uppercase mb-3" style={{ fontSize: 'var(--fs-xs)', letterSpacing: '.08em', color: '#2d448f' }}>
                      <i className="lni lni-tag" style={{ fontSize: 'var(--fs-md)' }}></i>
                      <span>Programme-level Fees</span>
                    </div>
                    <div className="g3">
                      <div className="fg m-0">
                        <div className="lbl">Lateral Entry Fee</div>
                        <div className="ctrl" style={{ display: 'flex', alignItems: 'center', background: 'var(--white)', color: 'var(--g900)', fontWeight: 500, minHeight: 34, fontSize: 13.5, border: '1.5px solid var(--g200)', borderRadius: 'var(--rxs)' }}>
                          {activeFeeStruct.lef ?? '0'}
                        </div>
                      </div>
                      <div className="fg m-0">
                        <div className="lbl">Credit Exemption Fee</div>
                        <div className="ctrl" style={{ display: 'flex', alignItems: 'center', background: 'var(--white)', color: 'var(--g900)', fontWeight: 500, minHeight: 34, fontSize: 13.5, border: '1.5px solid var(--g200)', borderRadius: 'var(--rxs)' }}>
                          {activeFeeStruct.cef ?? '0'}
                        </div>
                      </div>
                      <div className="fg m-0">
                        <div className="lbl">Aptech Credit Exemption Fee</div>
                        <div className="ctrl" style={{ display: 'flex', alignItems: 'center', background: 'var(--white)', color: 'var(--g900)', fontWeight: 500, minHeight: 34, fontSize: 13.5, border: '1.5px solid var(--g200)', borderRadius: 'var(--rxs)' }}>
                          {activeFeeStruct.ace ?? '0'}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    {program.semesters.map((sem, si) => {
                      const isOpen = feeAccordion === si
                      const items = activeFeeStruct.feeLines?.filter(f => f.semCode === sem.semCode) || []
                      const total = items.reduce((s, f) => s + (f.amount || 0), 0)
                      const totalCurrencyCode = financeCurrencies.find(c => c.currencyGuid === items[0]?.currencyGuid)?.currencyCode ?? ''

                      return (
                        <div key={sem.semCode} style={{ border: '1.5px solid var(--b100)', borderRadius: 'var(--rsm)', overflow: 'hidden' }}>
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
              ) : (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--g50)', borderRadius: 'var(--rsm)', border: '1px dashed var(--g300)' }}>
                  <div style={{ color: 'var(--g400)', fontSize: 13, fontStyle: 'italic' }}>Select a fee structure to view its details.</div>
                </div>
              )}
            </div>
          )}
        </div>

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
