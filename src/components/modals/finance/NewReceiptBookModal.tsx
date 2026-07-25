'use client'
import { useState } from 'react'
import { ModalProps } from '../types'
import { SuccessPopup } from '../academic/SuccessPopup'
import { FailurePopup } from '../academic/FailurePopup'
import { SearchSelect } from '@/components/SearchSelect'
import {
  BOOK_CATEGORY_VALUES, CATEGORY_VALUES, CreateReceiptBookInput, ReceiptBookCategory, ReceiptCategory, ReceiptBookStatus, STATUS_VALUES,
} from '@/lib/api/finance/receiptBook'

interface NewReceiptBookModalProps extends ModalProps {
  createReceiptBook: {
    mutate: (input: CreateReceiptBookInput, options?: { onSuccess?: () => void; onError?: (error: Error) => void }) => void
    isPending: boolean
  }
}

const STATUS_OPTS: ReceiptBookStatus[] = ['Active', 'Inactive']
const CATEGORY_OPTS: ReceiptCategory[] = ['Cash', 'Bank', 'Online']
const BOOK_CATEGORY_OPTS: ReceiptBookCategory[] = ['A', 'B']

export function NewReceiptBookModal({ isOpen, onClose, showToast, createReceiptBook }: NewReceiptBookModalProps) {
  const [saved, setSaved]           = useState(false)
  const [failure, setFailure]       = useState<string | null>(null)
  const [bookCode, setBookCode]     = useState('')
  const [startNo, setStartNo]       = useState('')
  const [prefix, setPrefix]         = useState('')
  const [count, setCount]           = useState('')
  const [status, setStatus]         = useState<ReceiptBookStatus>('Active')
  const [category, setCategory]     = useState<ReceiptCategory>('Cash')
  const [copy, setCopy]             = useState('')
  const [bookCategory, setBookCategory] = useState<ReceiptBookCategory | ''>('')
  const [errors, setErrors]         = useState<Record<string, string>>({})

  if (!isOpen) return null

  function reset() {
    setBookCode(''); setStartNo(''); setPrefix(''); setCount('')
    setStatus('Active'); setCategory('Cash'); setCopy(''); setBookCategory(''); setErrors({})
  }

  function handleClose() {
    setSaved(false); setFailure(null); reset()
    onClose()
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!bookCode.trim()) e.bookCode = 'Book Code is required'
    if (!startNo || +startNo <= 0) e.startNo = 'Start No. must be greater than 0'
    if (!count || +count <= 0) e.count = 'Count must be greater than 0'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  if (saved) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <SuccessPopup title="Receipt Book Added!" subtitle="The new receipt book has been saved successfully." onClose={handleClose} />
        </div>
      </div>
    )
  }

  if (failure) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <FailurePopup title="Couldn't Add Receipt Book" subtitle={failure} onClose={() => setFailure(null)} />
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay open" id="new-receipt-book-modal">
      <div className="modal modal-md" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr">
          <div className="modal-title"><i className="lni lni-ticket"></i> Add Receipt Book</div>
          <button className="modal-close" onClick={handleClose}><i className="lni lni-close"></i></button>
        </div>
        <div className="g2">
          <div className="fg">
            <div className="lbl">Book Code <span className="req">*</span></div>
            <input
              className="ctrl font-mono uppercase"
              type="text"
              placeholder="e.g. RB-2026-001"
              maxLength={50}
              value={bookCode}
              onChange={e => { setBookCode(e.target.value.toUpperCase()); if (errors.bookCode) setErrors(p => ({ ...p, bookCode: '' })) }}
              style={errors.bookCode ? { borderColor: 'var(--red)' } : undefined}
            />
            {errors.bookCode && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.bookCode}</p>}
          </div>
          <div className="fg">
            <div className="lbl">Prefix</div>
            <input
              className="ctrl font-mono uppercase"
              type="text"
              placeholder="e.g. RC"
              maxLength={10}
              value={prefix}
              onChange={e => setPrefix(e.target.value.toUpperCase())}
            />
          </div>
          <div className="fg">
            <div className="lbl">Start No. <span className="req">*</span></div>
            <input
              className="ctrl"
              type="number"
              placeholder="e.g. 1"
              min={1}
              value={startNo}
              onChange={e => { setStartNo(e.target.value); if (errors.startNo) setErrors(p => ({ ...p, startNo: '' })) }}
              style={errors.startNo ? { borderColor: 'var(--red)' } : undefined}
            />
            {errors.startNo && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.startNo}</p>}
          </div>
          <div className="fg">
            <div className="lbl">Count <span className="req">*</span></div>
            <input
              className="ctrl"
              type="number"
              placeholder="e.g. 100"
              min={1}
              value={count}
              onChange={e => { setCount(e.target.value); if (errors.count) setErrors(p => ({ ...p, count: '' })) }}
              style={errors.count ? { borderColor: 'var(--red)' } : undefined}
            />
            {errors.count && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.count}</p>}
          </div>
          <div className="fg">
            <div className="lbl">Status</div>
            <SearchSelect options={STATUS_OPTS} value={status} onChange={val => setStatus(val as ReceiptBookStatus)} />
          </div>
          <div className="fg">
            <div className="lbl">Category</div>
            <SearchSelect options={CATEGORY_OPTS} value={category} onChange={val => setCategory(val as ReceiptCategory)} />
          </div>
          <div className="fg">
            <div className="lbl">Copy</div>
            <input
              className="ctrl"
              type="number"
              placeholder="e.g. 1"
              min={0}
              value={copy}
              onChange={e => setCopy(e.target.value)}
            />
          </div>
          <div className="fg">
            <div className="lbl">Book Category</div>
            <SearchSelect
              placeholder="— Select —"
              options={BOOK_CATEGORY_OPTS}
              value={bookCategory}
              onChange={val => setBookCategory(val as ReceiptBookCategory)}
            />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-neu" onClick={handleClose}>Cancel</button>
          <button
            className="btn btn-primary"
            disabled={createReceiptBook.isPending}
            onClick={() => {
              if (!validate()) return
              createReceiptBook.mutate(
                {
                  bookCode,
                  startNo: +startNo,
                  prefix,
                  count: +count,
                  status: STATUS_VALUES[status],
                  category: CATEGORY_VALUES[category],
                  copy: copy ? +copy : null,
                  bookCategory: bookCategory ? BOOK_CATEGORY_VALUES[bookCategory] : null,
                },
                {
                  onSuccess: () => { setSaved(true); showToast('Receipt book added successfully') },
                  onError: (error: Error) => setFailure(error.message || 'Failed to add receipt book. Please try again.'),
                },
              )
            }}
          >
            <i className="lni lni-checkmark"></i> {createReceiptBook.isPending ? 'Adding…' : 'Add Receipt Book'}
          </button>
        </div>
      </div>
    </div>
  )
}
