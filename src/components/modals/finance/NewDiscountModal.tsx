'use client'
import { useState } from 'react'
import { ModalProps } from '../types'
import { SuccessPopup } from '../academic/SuccessPopup'
import { FailurePopup } from '../academic/FailurePopup'
import { SearchSelect } from '@/components/SearchSelect'
import { CALC_TYPE_VALUES, DiscountCalcType, DiscountInput } from '@/lib/api/finance/discount'

interface NewDiscountModalProps extends ModalProps {
  createDiscount: {
    mutate: (input: DiscountInput, options?: { onSuccess?: () => void; onError?: (error: Error) => void }) => void
    isPending: boolean
  }
}

export function NewDiscountModal({ isOpen, onClose, showToast, createDiscount }: NewDiscountModalProps) {
  const [saved, setSaved]               = useState(false)
  const [failure, setFailure]           = useState<string | null>(null)
  const [discountCode, setDiscountCode] = useState('')
  const [discountName, setDiscountName] = useState('')
  const [calcType, setCalcType]         = useState<DiscountCalcType | ''>('')
  const [amtPer, setAmtPer]             = useState('')
  const [carry, setCarry]               = useState(false)
  const [cop, setCop]                   = useState('')
  const [errors, setErrors]             = useState<Record<string, string>>({})

  if (!isOpen) return null

  function reset() {
    setDiscountCode(''); setDiscountName(''); setCalcType(''); setAmtPer(''); setCarry(false); setCop(''); setErrors({})
  }

  function handleClose() {
    setSaved(false); setFailure(null); reset()
    onClose()
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!discountCode.trim()) e.discountCode = 'Discount Code is required'
    if (!discountName.trim()) e.discountName = 'Discount Name is required'
    if (calcType === 'Percentage' && amtPer && (+amtPer < 0 || +amtPer > 100)) e.amtPer = 'Percentage must be between 0 and 100'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  if (saved) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <SuccessPopup title="Discount Added!" subtitle="The new discount has been saved successfully." onClose={handleClose} />
        </div>
      </div>
    )
  }

  if (failure) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <FailurePopup title="Couldn't Add Discount" subtitle={failure} onClose={() => setFailure(null)} />
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay open" id="new-discount-modal">
      <div className="modal modal-md" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr">
          <div className="modal-title"><i className="lni lni-tag"></i> Add Discount</div>
          <button className="modal-close" onClick={handleClose}><i className="lni lni-close"></i></button>
        </div>
        <div className="g2">
          <div className="fg">
            <div className="lbl">Discount Code <span className="req">*</span></div>
            <input
              className="ctrl font-mono uppercase"
              type="text"
              placeholder="e.g. DIS-001"
              value={discountCode}
              onChange={e => { setDiscountCode(e.target.value.toUpperCase()); if (errors.discountCode) setErrors(p => ({ ...p, discountCode: '' })) }}
              style={errors.discountCode ? { borderColor: 'var(--red)' } : undefined}
            />
            {errors.discountCode && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.discountCode}</p>}
          </div>
          <div className="fg">
            <div className="lbl">Discount Name <span className="req">*</span></div>
            <input
              className="ctrl"
              type="text"
              placeholder="e.g. Discount code 1"
              value={discountName}
              onChange={e => { setDiscountName(e.target.value); if (errors.discountName) setErrors(p => ({ ...p, discountName: '' })) }}
              style={errors.discountName ? { borderColor: 'var(--red)' } : undefined}
            />
            {errors.discountName && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.discountName}</p>}
          </div>
          <div className="fg">
            <div className="lbl">Calculation Type</div>
            <SearchSelect
              options={['Amount', 'Percentage']}
              value={calcType}
              onChange={val => setCalcType(val as DiscountCalcType)}
              placeholder="Select type"
            />
          </div>
          <div className="fg">
            <div className="lbl">{calcType === 'Percentage' ? 'Percentage' : 'Amount'}</div>
            <div className="flex items-center gap-2">
              {calcType === 'Percentage' && <span className="text-g500 font-bold" style={{ fontSize: 'var(--fs-sm)' }}>%</span>}
              <input
                className="ctrl flex-1"
                type="number"
                placeholder="0"
                min={0}
                max={calcType === 'Percentage' ? 100 : undefined}
                disabled={!calcType}
                value={amtPer}
                onChange={e => { setAmtPer(e.target.value); if (errors.amtPer) setErrors(p => ({ ...p, amtPer: '' })) }}
              />
            </div>
            {errors.amtPer && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.amtPer}</p>}
          </div>
          <div className="fg">
            <div className="lbl">Carry Forward</div>
            <div style={{ display: 'flex', gap: 16, marginTop: 6 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                <input type="checkbox" checked={carry} onChange={() => setCarry(true)} style={{ width: 16, height: 16, accentColor: 'var(--b500)', cursor: 'pointer' }} />
                <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--g700)' }}>Yes</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                <input type="checkbox" checked={!carry} onChange={() => setCarry(false)} style={{ width: 16, height: 16, accentColor: 'var(--b500)', cursor: 'pointer' }} />
                <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--g700)' }}>No</span>
              </label>
            </div>
          </div>
          <div className="fg">
            <div className="lbl">COP</div>
            <input
              className="ctrl"
              type="text"
              placeholder="Optional"
              value={cop}
              onChange={e => setCop(e.target.value)}
            />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-neu" onClick={handleClose}>Cancel</button>
          <button
            className="btn btn-primary"
            disabled={createDiscount.isPending}
            onClick={() => {
              if (!validate()) return
              createDiscount.mutate(
                {
                  discountCode,
                  discountName,
                  calcType: calcType ? CALC_TYPE_VALUES[calcType] : null,
                  amtPer: amtPer ? +amtPer : null,
                  carry: carry ? 1 : 0,
                  cop: cop.trim() || null,
                },
                {
                  onSuccess: () => { setSaved(true); showToast('Discount added successfully') },
                  onError: (error: Error) => setFailure(error.message || 'Failed to add discount. Please try again.'),
                },
              )
            }}
          >
            <i className="lni lni-checkmark"></i> {createDiscount.isPending ? 'Adding…' : 'Add Discount'}
          </button>
        </div>
      </div>
    </div>
  )
}
