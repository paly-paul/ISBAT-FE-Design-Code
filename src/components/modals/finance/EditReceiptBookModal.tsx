'use client'
import { useEffect, useState } from 'react'
import { ModalProps } from '../types'
import { SuccessPopup } from '../academic/SuccessPopup'
import { FailurePopup } from '../academic/FailurePopup'
import { SearchSelect } from '@/components/SearchSelect'
import {
  BOOK_CATEGORY_LABELS, BOOK_CATEGORY_VALUES, CATEGORY_LABELS, CATEGORY_VALUES, ReceiptBook, ReceiptBookCategory, ReceiptCategory,
  ReceiptBookStatus, STATUS_LABELS, STATUS_VALUES, UpdateReceiptBookInput,
} from '@/lib/api/finance/receiptBook'

interface EditReceiptBookModalProps extends ModalProps {
  receiptBook: ReceiptBook | null
  updateReceiptBook: {
    mutate: (variables: { guid: string; input: UpdateReceiptBookInput }, options?: { onSuccess?: () => void; onError?: (error: Error) => void }) => void
    isPending: boolean
  }
}

const STATUS_OPTS: ReceiptBookStatus[] = ['Active', 'Inactive']
const CATEGORY_OPTS: ReceiptCategory[] = ['Cash', 'Bank', 'Online']
const BOOK_CATEGORY_OPTS: ReceiptBookCategory[] = ['A', 'B']

export function EditReceiptBookModal({ isOpen, onClose, showToast, receiptBook, updateReceiptBook }: EditReceiptBookModalProps) {
  const [saved, setSaved]           = useState(false)
  const [failure, setFailure]       = useState<string | null>(null)
  const [status, setStatus]         = useState<ReceiptBookStatus>('Active')
  const [category, setCategory]     = useState<ReceiptCategory>('Cash')
  const [copy, setCopy]             = useState('')
  const [bookCategory, setBookCategory] = useState<ReceiptBookCategory | ''>('')

  // Prefill from the row passed in — there's no GetByGuid endpoint for
  // receipt books, so the Edit modal seeds from whatever's already loaded
  // in the list rather than fetching fresh.
  useEffect(() => {
    if (!isOpen || !receiptBook) return
    setStatus(STATUS_LABELS[receiptBook.status] ?? 'Active')
    setCategory(CATEGORY_LABELS[receiptBook.category] ?? 'Cash')
    setCopy(receiptBook.copy != null ? String(receiptBook.copy) : '')
    setBookCategory(receiptBook.bookCategory != null ? BOOK_CATEGORY_LABELS[receiptBook.bookCategory] ?? '' : '')
  }, [isOpen, receiptBook])

  if (!isOpen || !receiptBook) return null

  function handleClose() { setSaved(false); setFailure(null); onClose() }

  function handleSubmit() {
    if (!receiptBook) return
    updateReceiptBook.mutate(
      {
        guid: receiptBook.receiptBookGuid,
        input: {
          status: STATUS_VALUES[status],
          category: CATEGORY_VALUES[category],
          copy: copy ? +copy : null,
          bookCategory: bookCategory ? BOOK_CATEGORY_VALUES[bookCategory] : null,
        },
      },
      {
        onSuccess: () => { setSaved(true); showToast('Receipt book updated successfully') },
        onError: (error: Error) => setFailure(error.message || 'Failed to update receipt book. Please try again.'),
      },
    )
  }

  if (saved) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <SuccessPopup title="Receipt Book Updated!" subtitle="Your changes have been saved successfully." onClose={handleClose} />
        </div>
      </div>
    )
  }

  if (failure) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <FailurePopup title="Couldn't Update Receipt Book" subtitle={failure} onClose={() => setFailure(null)} />
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay open" id="edit-receipt-book-modal">
      <div className="modal modal-md" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr">
          <div className="modal-title"><i className="lni lni-pencil"></i> Edit Receipt Book — <span className="font-mono">{receiptBook.bookCode}</span></div>
          <button className="modal-close" onClick={handleClose}><i className="lni lni-close"></i></button>
        </div>
        <div className="g2">
          <div className="fg">
            <div className="lbl">Book Code</div>
            <input className="ctrl font-mono uppercase" type="text" value={receiptBook.bookCode} disabled />
          </div>
          <div className="fg">
            <div className="lbl">Prefix</div>
            <input className="ctrl font-mono uppercase" type="text" value={receiptBook.prefix} disabled />
          </div>
          <div className="fg">
            <div className="lbl">Start No. — End No.</div>
            <input className="ctrl" type="text" value={`${receiptBook.startNo} — ${receiptBook.endNo ?? '—'}`} disabled />
          </div>
          <div className="fg">
            <div className="lbl">Count</div>
            <input className="ctrl" type="text" value={receiptBook.count ?? '—'} disabled />
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
          <button className="btn btn-primary" disabled={updateReceiptBook.isPending} onClick={handleSubmit}>
            <i className="lni lni-checkmark"></i> {updateReceiptBook.isPending ? 'Updating…' : 'Update Receipt Book'}
          </button>
        </div>
      </div>
    </div>
  )
}
