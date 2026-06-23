'use client'
import { ModalProps } from './types'
import { SearchSelect } from '@/components/SearchSelect'

export function FeeItemModal({ isOpen, onClose, showToast }: ModalProps) {
  if (!isOpen) return null
  return (
    <div className="modal-overlay open" id="new-fee-item-modal">
      <div className="modal modal-md" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr">
          <div className="modal-title"><i className="lni lni-dollar"></i> Add / Edit Fee Item</div>
          <button className="modal-close" onClick={onClose}><i className="lni lni-close"></i></button>
        </div>
        <div className="info-box mb-[14px]">
          <i className="lni lni-bulb"></i> <span>Give the fee item a clear, user-friendly title (e.g. <em>Tuition Fee</em>, <em>Semester Entry Fee</em>, <em>Lab Fee</em>). Priority controls auto-settlement order within the semester.</span>
        </div>
        <div className="g2">
          <div className="fg">
            <div className="lbl">Semester <span className="req">*</span></div>
            <SearchSelect options={['Semester 1 — Year 1', 'Semester 2 — Year 1', 'Semester 3 — Year 2', 'Semester 4 — Year 2', 'Semester 5 — Year 3', 'Semester 6 — Year 3']} />
          </div>
          <div className="fg">
            <div className="lbl">Priority <span className="req">*</span></div>
            <SearchSelect options={['P1 — Cleared first', 'P2', 'P3', 'P4', 'P5', 'P6']} />
          </div>
          <div className="fg span2">
            <div className="lbl">Fee Item Title <span className="req">*</span></div>
            <input className="ctrl" type="text" placeholder="e.g. Tuition Fee, Semester Entry Fee, Lab Fee..." />
          </div>
          <div className="fg">
            <div className="lbl">Amount <span className="req">*</span></div>
            <input className="ctrl" type="number" placeholder="0" />
          </div>
          <div className="fg">
            <div className="lbl">Currency</div>
            <input className="ctrl bg-[var(--g100)] font-semibold" type="text" defaultValue="UGX" readOnly />
          </div>
          <div className="fg span2">
            <div className="lbl">Short Description / Note</div>
            <input className="ctrl" type="text" placeholder="e.g. 50% needed for assessment · 100% for progression" />
          </div>
          <div className="fg span2">
            <div className="lbl">Behavior</div>
            <div className="flex gap-[14px] flex-wrap text-[var(--fs-sm)] text-[var(--g700)]">
              <label className="flex items-center gap-[6px] cursor-pointer"><input type="checkbox" defaultChecked /> Required for registration</label>
              <label className="flex items-center gap-[6px] cursor-pointer"><input type="checkbox" /> One-time (not repeated each semester)</label>
              <label className="flex items-center gap-[6px] cursor-pointer"><input type="checkbox" /> Refundable</label>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-neu" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => { onClose(); showToast('Fee item saved.', 'success') }}><i className="lni lni-checkmark"></i> Save Fee Item</button>
        </div>
      </div>
    </div>
  )
}
