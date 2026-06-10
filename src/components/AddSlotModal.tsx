'use client'
import { ModalProps } from './types'

export function AddSlotModal({ isOpen, onClose, showToast }: ModalProps) {
  if (!isOpen) return null
  return (
    <div className="modal-overlay open" id="add-slot-modal" onClick={onClose}>
      <div className="modal modal-md" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr">
          <div className="modal-title"><i className="lni lni-calendar"></i> Add Timetable Slot</div>
          <button className="modal-close" onClick={onClose}><i className="lni lni-close"></i></button>
        </div>
        <div className="g2">
          <div className="fg">
            <div className="lbl">Course Unit <span className="req">*</span></div>
            <select className="ctrl" id="slot-cu">
              <option>IT101 – Intro to Programming</option>
              <option>IT102 – Computer Org.</option>
              <option>IT103 – Engineering Maths</option>
              <option>MBA101 – Managerial Econ.</option>
            </select>
          </div>
          <div className="fg"><div className="lbl">Session Type <span className="req">*</span></div><select className="ctrl"><option>Theory</option><option>Practical</option><option>Tutorial</option><option>CBT/Lab</option></select></div>
          <div className="fg"><div className="lbl">Day <span className="req">*</span></div><select className="ctrl"><option>Monday</option><option>Tuesday</option><option>Wednesday</option><option>Thursday</option><option>Friday</option><option>Saturday</option></select></div>
          <div className="fg"><div className="lbl">Start Time <span className="req">*</span></div><input className="ctrl" type="time" defaultValue="08:00" id="slot-start" /></div>
          <div className="fg"><div className="lbl">End Time <span className="req">*</span></div><input className="ctrl" type="time" defaultValue="10:00" id="slot-end" /></div>
          <div className="fg">
            <div className="lbl">Room / Venue <span className="req">*</span></div>
            <select className="ctrl" id="slot-room">
              <option value="">-- Select Room --</option>
              <option value="LR-01">LR-01 (Lecture, cap. 60)</option>
              <option value="LR-02">LR-02 (Lecture, cap. 60)</option>
              <option value="Lab-A">Lab-A Linux (Specialist, cap. 40)</option>
              <option value="Lab-B">Lab-B General (Computer Lab, cap. 40)</option>
              <option value="Lab-C">Lab-C MBA (Case Room, cap. 30)</option>
            </select>
          </div>
          <div className="fg">
            <div className="lbl">Faculty <span className="req">*</span></div>
            <select className="ctrl" id="slot-faculty">
              <option value="">-- Select Faculty --</option>
              <option>Dr. Ssekibuule Ronald</option>
              <option>Ms. Namutebi Joyce</option>
              <option>Prof. Mukasa Charles</option>
              <option>Dr. Tendo Patrick</option>
              <option>Dr. Kato Andrew</option>
            </select>
          </div>
        </div>
        <div id="slot-clash-result" className="hidden my-[10px]"></div>
        <div className="sec-divider">Combined Batch (Repetition Tag)</div>
        <div className="g2">
          <div className="fg">
            <div className="lbl">Has Repetition Tag?</div>
            <div className="tgl-group">
              <button className="tgl-btn tgl-active" id="slot-rep-no">No — Single Batch</button>
              <button className="tgl-btn" id="slot-rep-yes">Yes — Combine Batches</button>
            </div>
          </div>
          <div className="fg hidden" id="slot-rep-batches">
            <div className="lbl">Include Batches</div>
            <div className="flex flex-col gap-1">
              <label className="flex items-center gap-[6px] text-[12.5px]"><input type="checkbox" /> BSC-IT-S26-DA</label>
              <label className="flex items-center gap-[6px] text-[12.5px]"><input type="checkbox" /> BSC-IT-S26-DB</label>
              <label className="flex items-center gap-[6px] text-[12.5px]"><input type="checkbox" /> BBA-S26-DA</label>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-neu" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary"><i className="lni lni-checkmark"></i> Add &amp; Check Clashes</button>
        </div>
      </div>
    </div>
  )
}
