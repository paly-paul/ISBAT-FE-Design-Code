'use client'
import { useState } from 'react'
import { ModalProps } from './types'
import { SuccessPopup } from './SuccessPopup'

export function NewIntakeModal({ isOpen, onClose, showToast }: ModalProps) {
  const [step, setStep] = useState(1)
  const [saved, setSaved] = useState(false)

  if (!isOpen) return null

  function handleClose() { setStep(1); setSaved(false); onClose() }

  if (saved) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <SuccessPopup
            title="Intake Created!"
            subtitle="The new intake has been saved successfully."
            onClose={handleClose}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay open" id="new-intake-modal" onClick={handleClose}>
      <div className="modal modal-80 modal-flex" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr">
          <div className="modal-title"><i className="lni lni-calendar"></i> Create New Intake</div>
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
              <div className="fg"><div className="lbl">Intake Code <span className="req">*</span></div><input className="ctrl" type="text" placeholder="e.g. 20263" /></div>
              <div className="fg"><div className="lbl">Description <span className="req">*</span></div><input className="ctrl" type="text" placeholder="e.g. Spring 2027" /></div>
              <div className="fg"><div className="lbl">Financial Year <span className="req">*</span></div><input className="ctrl" type="text" placeholder="e.g. 2026–27" /></div>
              <div className="fg">
                <div className="lbl">Intake Type <span className="req">*</span></div>
                <select className="ctrl"><option value="">Select type…</option><option value="spring">Spring</option><option value="fall">Fall</option></select>
              </div>
              <div className="fg" style={{ gridColumn: 'span 2' }}>
                <div className="lbl">Set As</div>
                <div style={{ display: 'flex', gap: 28, marginTop: 8 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', color: 'var(--g700)' }}>
                    <input type="checkbox" style={{ width: 15, height: 15, accentColor: 'var(--b500)', cursor: 'pointer' }} />
                    Academic Intake
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', color: 'var(--g700)' }}>
                    <input type="checkbox" style={{ width: 15, height: 15, accentColor: 'var(--b500)', cursor: 'pointer' }} />
                    Admission Intake
                  </label>
                </div>
              </div>
              <div className="fg" style={{ gridColumn: 'span 2' }}>
                <div className="lbl">Batch Automation</div>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginTop: 8, cursor: 'pointer' }}>
                  <input type="checkbox" style={{ width: 15, height: 15, accentColor: 'var(--b500)', cursor: 'pointer', marginTop: 2, flexShrink: 0 }} />
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--g700)' }}>Create Batches automatically</span>
                    <div style={{ fontSize: 12, color: 'var(--g400)', marginTop: 3 }}>
                      Triggers batch creation at the back end for all active programmes linked to this intake. Individual batches can still be edited afterwards.
                    </div>
                  </div>
                </label>
              </div>
              <div className="fg"><div className="lbl">Semester Start Date <span className="req">*</span></div><input className="ctrl" type="date" /></div>
              <div className="fg"><div className="lbl">Term 1 End Date <span className="req">*</span></div><input className="ctrl" type="date" /></div>
              <div className="fg"><div className="lbl">Term 2 End Date / Semester End <span className="req">*</span></div><input className="ctrl" type="date" /></div>
              <div className="fg"><div className="lbl">Grievance End Date</div><input className="ctrl" type="date" /></div>
              <div className="fg"><div className="lbl">Re-entry Date</div><input className="ctrl" type="date" /></div>
              <div className="fg"><div className="lbl">Late Fee Start Date</div><input className="ctrl" type="date" /></div>
              <div className="fg"><div className="lbl">Duration (weeks)</div><input className="ctrl" type="text" placeholder="e.g. 16" /></div>
              <div className="fg"><div className="lbl">Last Date for Re-registration</div><input className="ctrl" type="text" placeholder="dd/MMM/yyyy" /></div>
              <div className="fg"><div className="lbl">Exam Grievance Start Date</div><input className="ctrl" type="text" placeholder="dd/MMM/yyyy" /></div>
              <div className="fg"><div className="lbl">Exam Grievance End Date</div><input className="ctrl" type="text" placeholder="dd/MMM/yyyy" /></div>
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
                <div className="fg"><div className="lbl">Admission Start Date</div><input className="ctrl" type="text" placeholder="dd/MMM/yyyy" /></div>
                <div className="fg"><div className="lbl">Admission Late Fee Date</div><input className="ctrl" type="text" placeholder="dd/MMM/yyyy" /></div>
                <div className="fg"><div className="lbl">Admission End Date</div><input className="ctrl" type="text" placeholder="dd/MMM/yyyy" /></div>
                <div className="fg"><div className="lbl">Re-entry Start Date</div><input className="ctrl" type="text" placeholder="dd/MMM/yyyy" /></div>
                <div className="fg"><div className="lbl">Re-entry Late Fee Date</div><input className="ctrl" type="text" placeholder="dd/MMM/yyyy" /></div>
                <div className="fg"><div className="lbl">Re-entry End Date</div><input className="ctrl" type="text" placeholder="dd/MMM/yyyy" /></div>
                <div className="fg"><div className="lbl">Semester Start Date</div><input className="ctrl" type="text" placeholder="dd/MMM/yyyy" /></div>
                <div className="fg"><div className="lbl">Semester End Date</div><input className="ctrl" type="text" placeholder="dd/MMM/yyyy" /></div>
                <div className="fg"><div className="lbl">Lump Sum Date</div><input className="ctrl" type="text" placeholder="dd/MMM/yyyy" /></div>
                <div className="fg"><div className="lbl">Term 1 End Date</div><input className="ctrl" type="text" placeholder="dd/MMM/yyyy" /></div>
                <div className="fg"><div className="lbl">Term 2 Start Date</div><input className="ctrl" type="text" placeholder="dd/MMM/yyyy" /></div>
                <div className="fg"><div className="lbl">Resit Start Date</div><input className="ctrl" type="text" placeholder="dd/MMM/yyyy" /></div>
                <div className="fg"><div className="lbl">Resit End Date</div><input className="ctrl" type="text" placeholder="dd/MMM/yyyy" /></div>
                <div className="fg"><div className="lbl">Final Exam Start Date</div><input className="ctrl" type="text" placeholder="dd/MMM/yyyy" /></div>
                <div className="fg"><div className="lbl">Final Exam End Date</div><input className="ctrl" type="text" placeholder="dd/MMM/yyyy" /></div>
                <div className="fg"><div className="lbl">Clearance Date (80%)</div><input className="ctrl" type="text" placeholder="dd/MMM/yyyy" /></div>
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
              <i className="lni lni-checkmark"></i> Save Intake
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
