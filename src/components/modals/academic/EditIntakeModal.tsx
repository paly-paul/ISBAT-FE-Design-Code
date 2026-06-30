'use client'
import { useState } from 'react'
import { ModalProps } from '../types'
import { SuccessPopup } from './SuccessPopup'
import { SearchSelect } from '@/components/SearchSelect'

export function EditIntakeModal({ isOpen, onClose, showToast }: ModalProps) {
  const [step, setStep]           = useState(1)
  const [saved, setSaved]         = useState(false)
  const [semStart, setSemStart]   = useState('2026-02-01')
  const [term2End, setTerm2End]   = useState('2026-05-25')
  const [intakeCode, setIntakeCode]       = useState('20261')
  const [description, setDescription]     = useState('Spring 2026')
  const [financialYear, setFinancialYear] = useState('2025-26')
  const [intakeType, setIntakeType]       = useState('spring')
  const [errors, setErrors]               = useState<Record<string, string>>({})

  function calcDuration() {
    if (!semStart || !term2End) return ''
    const ms = new Date(term2End).getTime() - new Date(semStart).getTime()
    return ms > 0 ? String(Math.round(ms / (1000 * 60 * 60 * 24 * 7))) : ''
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!intakeCode.trim())    e.intakeCode    = 'Intake Code is required'
    if (!description.trim())   e.description   = 'Description is required'
    if (!financialYear.trim()) e.financialYear = 'Financial Year is required'
    if (!intakeType)           e.intakeType    = 'Please select an Intake Type'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  if (!isOpen) return null

  function handleClose() { setStep(1); setSaved(false); setErrors({}); onClose() }

  if (saved) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <SuccessPopup
            title="Intake Updated!"
            subtitle="Your changes have been saved successfully."
            onClose={handleClose}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay open" id="intake-edit-modal">
      <div className="modal modal-80 modal-flex" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr">
          <div className="modal-title"><i className="lni lni-pencil"></i> Edit Intake</div>
          <button className="modal-close" onClick={handleClose}><i className="lni lni-close"></i></button>
        </div>

        <div className="prog-steps">
          <div className={`prog-step${step === 1 ? ' active' : ''}`}>
            <span className="prog-step-num">1</span>
            <span>Intake Details</span>
          </div>
          <div className="prog-step-line"></div>
          <div className={`prog-step${step === 2 ? ' active' : ''}`}>
            <span className="prog-step-num">2</span>
            <span>Semester Planning Calendar</span>
          </div>
        </div>

        <div className="modal-scroll">
          {step === 1 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', columnGap: '3.5rem', rowGap: '1rem' }}>
              <div className="fg">
                <div className="lbl">Intake Code <span className="req">*</span></div>
                <input
                  className="ctrl"
                  style={errors.intakeCode ? { borderColor: 'var(--red)' } : undefined}
                  type="text"
                  placeholder="e.g. 20261"
                  value={intakeCode}
                  onChange={e => { setIntakeCode(e.target.value); if (errors.intakeCode) setErrors(p => ({ ...p, intakeCode: '' })) }}
                />
                {errors.intakeCode && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.intakeCode}</p>}
              </div>
              <div className="fg">
                <div className="lbl">Description <span className="req">*</span></div>
                <input
                  className="ctrl"
                  style={errors.description ? { borderColor: 'var(--red)' } : undefined}
                  type="text"
                  placeholder="e.g. Spring 2026"
                  value={description}
                  onChange={e => { setDescription(e.target.value); if (errors.description) setErrors(p => ({ ...p, description: '' })) }}
                />
                {errors.description && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.description}</p>}
              </div>
              <div className="fg">
                <div className="lbl">Financial Year <span className="req">*</span></div>
                <input
                  className="ctrl font-mono"
                  style={errors.financialYear ? { borderColor: 'var(--red)' } : undefined}
                  type="text"
                  placeholder="e.g. 2026-27"
                  maxLength={7}
                  value={financialYear}
                  onChange={e => { setFinancialYear(e.target.value.replace(/[^0-9-]/g, '')); if (errors.financialYear) setErrors(p => ({ ...p, financialYear: '' })) }}
                />
                {errors.financialYear && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.financialYear}</p>}
              </div>
              <div className="fg">
                <div className="lbl">Intake Type <span className="req">*</span></div>
                <SearchSelect
                  placeholder="Select type…"
                  value={intakeType}
                  onChange={v => { setIntakeType(v); if (errors.intakeType) setErrors(p => ({ ...p, intakeType: '' })) }}
                  options={[{ value: 'spring', label: 'Spring' }, { value: 'fall', label: 'Fall' }]}
                />
                {errors.intakeType && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.intakeType}</p>}
              </div>
              <div className="fg" style={{ gridColumn: 'span 3' }}>
                <div className="lbl">Set As</div>
                <div style={{ display: 'flex', gap: 28, marginTop: 8 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', color: 'var(--g700)' }}>
                    <input type="checkbox" defaultChecked style={{ width: 15, height: 15, accentColor: 'var(--b500)', cursor: 'pointer' }} />
                    Academic Intake
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', color: 'var(--g700)' }}>
                    <input type="checkbox" style={{ width: 15, height: 15, accentColor: 'var(--b500)', cursor: 'pointer' }} />
                    Admission Intake
                  </label>
                </div>
              </div>
              <div className="fg"><div className="lbl">Grievance End Date</div><input className="ctrl" type="date" defaultValue="2026-06-10" /></div>
              <div className="fg"><div className="lbl">Re-entry Date</div><input className="ctrl" type="date" /></div>
              <div className="fg"><div className="lbl">Late Fee Start Date</div><input className="ctrl" type="date" defaultValue="2026-06-15" /></div>
              <div className="fg"><div className="lbl">Last Date for Re-registration</div><input className="ctrl" type="date" defaultValue="2026-06-15" /></div>
              <div className="fg"><div className="lbl">Exam Grievance Start Date</div><input className="ctrl" type="date" defaultValue="2026-06-01" /></div>
              <div className="fg"><div className="lbl">Exam Grievance End Date</div><input className="ctrl" type="date" defaultValue="2026-06-10" /></div>
            </div>
          )}

          {step === 2 && (
            <div>
              <div className="sec-divider">
                1st Semester Planning Calendar
                <span className="font-medium text-g400 normal-case tracking-normal ml-2" style={{ fontSize: 'var(--fs-2xs)' }}>
                  Optional · Fill in the key dates for the first semester
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', columnGap: '3.5rem', rowGap: '1rem' }}>
                <div className="fg"><div className="lbl">Admission Start Date</div><input className="ctrl" type="date" defaultValue="2025-11-01" /></div>
                <div className="fg"><div className="lbl">Admission Late Fee Date</div><input className="ctrl" type="date" defaultValue="2026-01-15" /></div>
                <div className="fg"><div className="lbl">Admission End Date</div><input className="ctrl" type="date" defaultValue="2026-01-31" /></div>
                <div className="fg"><div className="lbl">Re-entry Start Date</div><input className="ctrl" type="date" defaultValue="2026-01-01" /></div>
                <div className="fg"><div className="lbl">Re-entry Late Fee Date</div><input className="ctrl" type="date" defaultValue="2026-01-20" /></div>
                <div className="fg"><div className="lbl">Re-entry End Date</div><input className="ctrl" type="date" defaultValue="2026-01-31" /></div>
                <div className="fg"><div className="lbl">Semester/Term 1 Start Date</div><input className="ctrl" type="date" value={semStart} onChange={e => setSemStart(e.target.value)} /></div>
                <div className="fg"><div className="lbl">Lump Sum Date</div><input className="ctrl" type="date" defaultValue="2026-02-15" /></div>
                <div className="fg"><div className="lbl">Term 1 End Date</div><input className="ctrl" type="date" defaultValue="2026-03-30" /></div>
                <div className="fg"><div className="lbl">Term 2 Start Date</div><input className="ctrl" type="date" defaultValue="2026-04-01" /></div>
                <div className="fg"><div className="lbl">Semester/Term 2 End Date</div><input className="ctrl" type="date" value={term2End} onChange={e => setTerm2End(e.target.value)} /></div>
                <div className="fg">
                  <div className="lbl">Duration (weeks)</div>
                  <input
                    className="ctrl"
                    style={{ background: 'var(--g100)', color: calcDuration() ? 'var(--g700)' : 'var(--g400)', cursor: 'not-allowed' }}
                    type="text"
                    value={calcDuration()}
                    readOnly
                    placeholder="Set semester dates below"
                  />
                </div>
                <div className="fg"><div className="lbl">Resit Start Date</div><input className="ctrl" type="date" defaultValue="2026-06-01" /></div>
                <div className="fg"><div className="lbl">Resit End Date</div><input className="ctrl" type="date" defaultValue="2026-06-15" /></div>
                <div className="fg"><div className="lbl">Final Exam Start Date</div><input className="ctrl" type="date" defaultValue="2026-05-01" /></div>
                <div className="fg"><div className="lbl">Final Exam End Date</div><input className="ctrl" type="date" defaultValue="2026-05-25" /></div>
                <div className="fg"><div className="lbl">Clearance Date (80%)</div><input className="ctrl" type="date" defaultValue="2026-06-10" /></div>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-neu" onClick={handleClose}>Cancel</button>
          <span className="flex-1"></span>
          {step === 2 && (
            <button className="btn btn-neu" onClick={() => setStep(1)}>
              <i className="lni lni-arrow-left"></i> Back
            </button>
          )}
          {step === 1 && (
            <button className="btn btn-primary" onClick={() => { if (validate()) setStep(2) }}>
              Save & Continue <i className="lni lni-arrow-right"></i>
            </button>
          )}
          {step === 2 && (
            <button className="btn btn-primary" onClick={() => setSaved(true)}>
              <i className="lni lni-checkmark"></i> Update Intake
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
