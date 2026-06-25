'use client'
import { useState } from 'react'
import { ModalProps } from './types'
import { SuccessPopup } from './SuccessPopup'
import { SearchSelect } from '@/components/SearchSelect'

export function EditCurrencyModal({ isOpen, onClose, showToast }: ModalProps) {
  const [saved, setSaved] = useState(false)

  if (!isOpen) return null

  function handleClose() { setSaved(false); onClose() }

  if (saved) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <SuccessPopup title="Currency Updated!" subtitle="Your changes have been saved successfully." onClose={handleClose} />
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay open" id="edit-currency-modal">
      <div className="modal modal-md" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr">
          <div className="modal-title"><i className="lni lni-pencil"></i> Edit Currency</div>
          <button className="modal-close" onClick={handleClose}><i className="lni lni-close"></i></button>
        </div>
        <div className="g2">
          <div className="fg">
            <div className="lbl">Currency Code <span className="req">*</span></div>
            <input className="ctrl font-mono uppercase" type="text" defaultValue="UGX" maxLength={4} />
          </div>
          <div className="fg">
            <div className="lbl">Symbol <span className="req">*</span></div>
            <input className="ctrl font-mono" type="text" defaultValue="USh" maxLength={4} />
          </div>
          <div className="fg span2">
            <div className="lbl">Currency Name <span className="req">*</span></div>
            <input className="ctrl" type="text" defaultValue="Ugandan Shilling" />
          </div>
          <div className="fg">
            <div className="lbl">Exchange Rate to UGX</div>
            <input className="ctrl" type="number" min={0} step="0.01" defaultValue={1} />
          </div>
          <div className="fg">
            <div className="lbl">Status <span className="req">*</span></div>
            <SearchSelect
              placeholder="Select status…"
              value="Active"
              options={[{ value: 'Active', label: 'Active' }, { value: 'Inactive', label: 'Inactive' }]}
            />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-neu" onClick={handleClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => setSaved(true)}>
            <i className="lni lni-checkmark"></i> Update Currency
          </button>
        </div>
      </div>
    </div>
  )
}
