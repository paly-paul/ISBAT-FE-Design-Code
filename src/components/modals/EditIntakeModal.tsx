'use client'
import { useState } from 'react'
import { ModalProps } from './types'
import { SuccessPopup } from './SuccessPopup'

export function EditIntakeModal({ isOpen, onClose, showToast }: ModalProps) {
  const [step, setStep] = useState(1)
  const [saved, setSaved] = useState(false)

  if (!isOpen) return null

  function handleClose() { setStep(1); setSaved(false); onClose() }

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
    <div className="modal-overlay open" id="intake-edit-modal" onClick={handleClose}>
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
            <div className="g2">
              <div className="fg"><div className="lbl">Intake Code <span className="req">*</span></div><input className="ctrl" type="text" defaultValue="20261" /></div>
              <div className="fg"><div className="lbl">Description <span className="req">*</span></div><input className="ctrl" type="text" defaultValue="Spring 2026" /></div>
              <div className="fg"><div className="lbl">Financial Year <span className="req">*</span></div><input className="ctrl" type="text" defaultValue="2025–26" /></div>
              <div className="fg">
                <div className="lbl">Intake Type <span className="req">*</span></div>
                <select className="ctrl" defaultValue="spring"><option value="">Select type…</option><option value="spring">Spring</option><option value="fall">Fall</option></select>
              </div>
              <div className="fg" style={{ gridColumn: 'span 2' }}>
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
              <div className="fg"><div className="lbl">Semester Start Date <span className="req">*</span></div><input className="ctrl" type="date" defaultValue="2026-02-01" /></div>
              <div className="fg"><div className="lbl">Term 1 End Date <span className="req">*</span></div><input className="ctrl" type="date" defaultValue="2026-03-30" /></div>
              <div className="fg"><div className="lbl">Term 2 End Date / Semester End <span className="req">*</span></div><input className="ctrl" type="date" defaultValue="2026-05-31" /></div>
              <div className="fg"><div className="lbl">Grievance End Date</div><input className="ctrl" type="date" defaultValue="2026-06-10" /></div>
              <div className="fg"><div className="lbl">Re-entry Date</div><input className="ctrl" type="date" /></div>
              <div className="fg"><div className="lbl">Late Fee Start Date</div><input className="ctrl" type="date" defaultValue="2026-06-15" /></div>
              <div className="fg"><div className="lbl">Duration (weeks)</div><input className="ctrl" type="text" defaultValue="16" /></div>
              <div className="fg"><div className="lbl">Last Date for Re-registration</div><input className="ctrl" type="text" placeholder="dd/MMM/yyyy" defaultValue="15/Jun/2026" /></div>
              <div className="fg"><div className="lbl">Exam Grievance Start Date</div><input className="ctrl" type="text" placeholder="dd/MMM/yyyy" defaultValue="01/Jun/2026" /></div>
              <div className="fg"><div className="lbl">Exam Grievance End Date</div><input className="ctrl" type="text" placeholder="dd/MMM/yyyy" defaultValue="10/Jun/2026" /></div>
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
              <div className="g2">
                <div className="fg"><div className="lbl">Admission Start Date</div><input className="ctrl" type="text" placeholder="dd/MMM/yyyy" defaultValue="01/Nov/2025" /></div>
                <div className="fg"><div className="lbl">Admission Late Fee Date</div><input className="ctrl" type="text" placeholder="dd/MMM/yyyy" defaultValue="15/Jan/2026" /></div>
                <div className="fg"><div className="lbl">Admission End Date</div><input className="ctrl" type="text" placeholder="dd/MMM/yyyy" defaultValue="31/Jan/2026" /></div>
                <div className="fg"><div className="lbl">Re-entry Start Date</div><input className="ctrl" type="text" placeholder="dd/MMM/yyyy" defaultValue="01/Jan/2026" /></div>
                <div className="fg"><div className="lbl">Re-entry Late Fee Date</div><input className="ctrl" type="text" placeholder="dd/MMM/yyyy" defaultValue="20/Jan/2026" /></div>
                <div className="fg"><div className="lbl">Re-entry End Date</div><input className="ctrl" type="text" placeholder="dd/MMM/yyyy" defaultValue="31/Jan/2026" /></div>
                <div className="fg"><div className="lbl">Semester Start Date</div><input className="ctrl" type="text" placeholder="dd/MMM/yyyy" defaultValue="01/Feb/2026" /></div>
                <div className="fg"><div className="lbl">Semester End Date</div><input className="ctrl" type="text" placeholder="dd/MMM/yyyy" defaultValue="31/May/2026" /></div>
                <div className="fg"><div className="lbl">Lump Sum Date</div><input className="ctrl" type="text" placeholder="dd/MMM/yyyy" defaultValue="15/Feb/2026" /></div>
                <div className="fg"><div className="lbl">Term 1 End Date</div><input className="ctrl" type="text" placeholder="dd/MMM/yyyy" defaultValue="30/Mar/2026" /></div>
                <div className="fg"><div className="lbl">Term 2 Start Date</div><input className="ctrl" type="text" placeholder="dd/MMM/yyyy" defaultValue="01/Apr/2026" /></div>
                <div className="fg"><div className="lbl">Resit Start Date</div><input className="ctrl" type="text" placeholder="dd/MMM/yyyy" defaultValue="01/Jun/2026" /></div>
                <div className="fg"><div className="lbl">Resit End Date</div><input className="ctrl" type="text" placeholder="dd/MMM/yyyy" defaultValue="15/Jun/2026" /></div>
                <div className="fg"><div className="lbl">Final Exam Start Date</div><input className="ctrl" type="text" placeholder="dd/MMM/yyyy" defaultValue="01/May/2026" /></div>
                <div className="fg"><div className="lbl">Final Exam End Date</div><input className="ctrl" type="text" placeholder="dd/MMM/yyyy" defaultValue="25/May/2026" /></div>
                <div className="fg"><div className="lbl">Clearance Date (80%)</div><input className="ctrl" type="text" placeholder="dd/MMM/yyyy" defaultValue="10/Jun/2026" /></div>
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
            <button className="btn btn-primary" onClick={() => setStep(2)}>
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
