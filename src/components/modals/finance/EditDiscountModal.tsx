'use client'
import { useEffect, useState } from 'react'
import { ModalProps } from '../types'
import { SuccessPopup } from '../academic/SuccessPopup'
import { FailurePopup } from '../academic/FailurePopup'
import { SearchSelect } from '@/components/SearchSelect'
import { CALC_TYPE_LABELS, CALC_TYPE_VALUES, DiscountCalcType, DiscountInput } from '@/lib/api/finance/discount'
import { useDiscount } from '@/hooks/finance/useDiscounts'
import { AuthError } from '@/lib/api/client'

interface EditDiscountModalProps extends ModalProps {
  discountGuid: string | null
  updateDiscount: {
    mutate: (variables: { guid: string; input: DiscountInput }, options?: { onSuccess?: () => void; onError?: (error: Error) => void }) => void
    isPending: boolean
  }
}

export function EditDiscountModal({ isOpen, onClose, showToast, discountGuid, updateDiscount }: EditDiscountModalProps) {
  const { data: discount, isLoading, isError, error } = useDiscount(discountGuid, isOpen)

  const [saved, setSaved]               = useState(false)
  const [failure, setFailure]           = useState<string | null>(null)
  const [discountCode, setDiscountCode] = useState('')
  const [discountName, setDiscountName] = useState('')
  const [calcType, setCalcType]         = useState<DiscountCalcType | ''>('')
  const [amtPer, setAmtPer]             = useState('')
  const [carry, setCarry]               = useState(false)
  const [cop, setCop]                   = useState('')
  const [errors, setErrors]             = useState<Record<string, string>>({})

  // Prefill the form once the discount has loaded. Re-runs whenever a
  // different guid is fetched (react-query resets `discount` to undefined
  // when discountGuid changes, so stale data never leaks between edits).
  useEffect(() => {
    if (!isOpen || !discount) return
    setDiscountCode(discount.discountCode)
    setDiscountName(discount.discountName)
    setCalcType(discount.calcType != null ? CALC_TYPE_LABELS[discount.calcType] ?? '' : '')
    setAmtPer(discount.amtPer != null ? String(discount.amtPer) : '')
    setCarry(discount.carry === 1)
    setCop(discount.cop ?? '')
    setErrors({})
  }, [isOpen, discount])

  if (!isOpen) return null

  function handleClose() { setSaved(false); setFailure(null); setErrors({}); onClose() }

  function clearError(field: string) {
    setErrors(prev => (prev[field] ? { ...prev, [field]: '' } : prev))
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!discountCode.trim()) e.discountCode = 'Discount Code is required'
    if (!discountName.trim()) e.discountName = 'Discount Name is required'
    if (calcType === 'Percentage' && amtPer && (+amtPer < 0 || +amtPer > 100)) e.amtPer = 'Percentage must be between 0 and 100'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit() {
    if (!discountGuid || !validate()) return
    updateDiscount.mutate(
      {
        guid: discountGuid,
        input: {
          discountCode,
          discountName,
          calcType: calcType ? CALC_TYPE_VALUES[calcType] : null,
          amtPer: amtPer ? +amtPer : null,
          carry: carry ? 1 : 0,
          cop: cop.trim() || null,
        },
      },
      {
        onSuccess: () => { setSaved(true); showToast('Discount updated successfully') },
        onError: (error: Error) => setFailure(error.message || 'Failed to update discount. Please try again.'),
      },
    )
  }

  if (saved) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <SuccessPopup title="Discount Updated!" subtitle="Your changes have been saved successfully." onClose={handleClose} />
        </div>
      </div>
    )
  }

  if (failure) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <FailurePopup title="Couldn't Update Discount" subtitle={failure} onClose={() => setFailure(null)} />
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <FailurePopup
            title="Couldn't Load Discount"
            subtitle={error instanceof AuthError ? (error.message || 'Failed to load discount details.') : 'Failed to load discount details.'}
            onClose={handleClose}
          />
        </div>
      </div>
    )
  }

  if (isLoading || !discount) {
    return (
      <div className="modal-overlay open" id="edit-discount-modal">
        <div className="modal modal-md" onClick={e => e.stopPropagation()}>
          <div className="modal-hdr modal-hdr-blue">
            <div className="modal-title"><i className="lni lni-pencil"></i> Edit Discount</div>
            <button className="modal-close" onClick={handleClose}><i className="lni lni-close"></i></button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 180 }}>
            <span style={{ color: 'var(--g400)' }}>Loading discount details…</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay open" id="edit-discount-modal">
      <div className="modal modal-md" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr modal-hdr-blue">
          <div className="modal-title"><i className="lni lni-pencil"></i> Edit Discount</div>
          <button className="modal-close" onClick={handleClose}><i className="lni lni-close"></i></button>
        </div>
        <div className="g2">
          <div className="fg">
            <div className="lbl">Discount Code <span className="req">*</span></div>
            <input
              className="ctrl font-mono uppercase"
              type="text"
              value={discountCode}
              onChange={e => { setDiscountCode(e.target.value.toUpperCase()); clearError('discountCode') }}
              style={errors.discountCode ? { borderColor: 'var(--red)' } : undefined}
            />
            {errors.discountCode && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.discountCode}</p>}
          </div>
          <div className="fg">
            <div className="lbl">Discount Name <span className="req">*</span></div>
            <input
              className="ctrl"
              type="text"
              value={discountName}
              onChange={e => { setDiscountName(e.target.value); clearError('discountName') }}
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
                onChange={e => { setAmtPer(e.target.value); clearError('amtPer') }}
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
          <button className="btn btn-primary" disabled={updateDiscount.isPending} onClick={handleSubmit}>
            <i className="lni lni-checkmark"></i> {updateDiscount.isPending ? 'Updating…' : 'Update Discount'}
          </button>
        </div>
      </div>
    </div>
  )
}
