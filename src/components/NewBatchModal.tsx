'use client'
import { ModalProps } from './types'

export function NewBatchModal({ isOpen, onClose, showToast }: ModalProps) {
  if (!isOpen) return null
  return (
    <div className="modal-overlay open" id="new-batch-modal" onClick={onClose}>
      <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr">
          <div className="modal-title"><i className="lni lni-users"></i> Create New Batch</div>
          <button className="modal-close" onClick={onClose}><i className="lni lni-close"></i></button>
        </div>
        <div className="g3">
          <div className="fg">
            <div className="lbl">Programme Version <span className="req">*</span></div>
            <select className="ctrl" id="nb-prog">
              <option value="BSC-IT">BSc. IT 2026 (BCA-2026)</option>
              <option value="BBA">BBA 2021 (BBA-2021)</option>
              <option value="MBA">MBA 2024 (MBA-2024)</option>
            </select>
          </div>
          <div className="fg">
            <div className="lbl">Intake / Session <span className="req">*</span></div>
            <select className="ctrl" id="nb-session">
              <option value="S26">Spring 2026 (S26)</option>
              <option value="F26">Fall 2026 (F26)</option>
            </select>
          </div>
          <div className="fg">
            <div className="lbl">Batch Type <span className="req">*</span></div>
            <select className="ctrl" id="nb-type">
              <option value="D">Day</option>
              <option value="E">Evening</option>
              <option value="W">Weekend (Masters/PhD only)</option>
              <option value="O">Distance/Online</option>
            </select>
          </div>
          <div className="fg">
            <div className="lbl">Sub-batch <span className="req">*</span></div>
            <select className="ctrl" id="nb-sub">
              <option value="A">A (first)</option>
              <option value="B">B (second)</option>
              <option value="C">C (third)</option>
            </select>
          </div>
          <div className="fg">
            <div className="lbl">Starting Semester <span className="req">*</span></div>
            <select className="ctrl">
              <option>Semester 1 (Regular Entry)</option>
              <option>Semester 2 (Lateral Entry)</option>
              <option>Semester 3 (Credit Exemption)</option>
            </select>
          </div>
          <div className="fg"><div className="lbl">Expected Student Count</div><input className="ctrl" type="number" placeholder="e.g. 42" min={1} /></div>
        </div>
        <div className="my-[14px] p-[14px] bg-b50 border-[1.5px] border-[var(--b200)] rounded-[var(--rsm)] flex items-center gap-4">
          <span className="text-[11px] font-bold text-g500 uppercase">Auto-Generated Batch Code:</span>
          <span id="nb-code-preview" className="font-mono text-[18px] font-extrabold text-b800">BSC-IT-S26-DA</span>
        </div>
        <div className="fg">
          <div className="lbl">Batch In-Charge (Faculty) <span className="req">*</span></div>
          <select className="ctrl">
            <option>-- Select Faculty Member --</option>
            <option>Dr. Ssekibuule Ronald</option>
            <option>Ms. Namutebi Joyce</option>
            <option>Prof. Mukasa Charles</option>
            <option>Dr. Tendo Patrick</option>
            <option>Dr. Kato Andrew</option>
          </select>
        </div>
        <div className="info-box mt-3"><i className="lni lni-information"></i> Batch In-Charge can view batch-level reports but has no direct relation to programme course content.</div>
        <div className="modal-footer">
          <button className="btn btn-neu" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => { onClose(); showToast('Batch created successfully.', 'success') }}><i className="lni lni-checkmark"></i> Create Batch</button>
        </div>
      </div>
    </div>
  )
}
