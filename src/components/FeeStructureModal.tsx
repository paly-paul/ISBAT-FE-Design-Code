'use client'
import { ModalProps } from './types'

export function FeeStructureModal({ isOpen, onClose, showToast }: ModalProps) {
  if (!isOpen) return null
  return (
    <div className="modal-overlay open" id="new-fee-structure-modal" onClick={onClose}>
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
