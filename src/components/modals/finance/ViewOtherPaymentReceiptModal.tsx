'use client'
import { ModalProps } from '../types'
import type { PaymentOtherDto } from '@/lib/api/finance/paymentOthers'
import { PAY_TYPE_LABELS } from '@/lib/api/finance/paymentConsole'
import { usePaymentOther } from '@/hooks/finance/usePaymentOthers'
import { AuthError } from '@/lib/api/client'
import { formatDate } from '@/lib/date'

interface ViewOtherPaymentReceiptModalProps extends ModalProps {
  paymentOtherGuid: string | null
  student: { name: string; studentNo: string | null; programName: string | null }
  // Opens the server's receipt PDF (GET /finance/other-payment/{guid}/receipt).
  // The page owns it, including the `print` permission check.
  onPrint: (entry: PaymentOtherDto) => void
  printing: boolean
  // Saves that same PDF to disk.
  onDownload: (entry: PaymentOtherDto) => void
  downloading: boolean
}

function fmtAmount(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function loadErrorMessage(err: unknown) {
  if (err instanceof AuthError && err.code === 'forbidden') return 'You don’t have permission to view this payment.'
  if (err instanceof AuthError && err.code === 'not_found') return 'This payment couldn’t be found. It may have been deleted.'
  return err instanceof Error && err.message ? err.message : 'Couldn’t load this payment.'
}

// Details of one Other payment (exam fees, resit, grievance, …), loaded from
// GET /finance/other-payment/{paymentOtherGuid} (get-payment-other-by-guid.md).
// Print Receipt fetches the official PDF, the same as the row's Print / Reprint.
export function ViewOtherPaymentReceiptModal({ isOpen, onClose, paymentOtherGuid, student, onPrint, printing, onDownload, downloading }: ViewOtherPaymentReceiptModalProps) {
  const { data: entry, isLoading, isError, error } = usePaymentOther(paymentOtherGuid, isOpen)

  if (!isOpen || !paymentOtherGuid) return null

  const currency = entry?.currency?.currencyCode ?? ''
  const fromAdvance = entry?.advance === 1

  return (
    <div className="modal-overlay open">
      <div className="modal" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', width: 'min(94vw, 520px)', minWidth: 0 }} onClick={e => e.stopPropagation()}>
        <div className="modal-hdr modal-hdr-blue no-print" style={{ flexShrink: 0 }}>
          <div className="modal-title"><i className="lni lni-eye"></i> Receipt {entry ? (entry.receipt ?? entry.paymentCode) : ''}</div>
          <button className="modal-close" onClick={onClose}><i className="lni lni-close"></i></button>
        </div>

        <div style={{ padding: 20, overflowY: 'auto', flex: '1 1 auto', minHeight: 0 }}>
          {isLoading ? (
            <div className="text-g400 text-center" style={{ padding: 24, fontSize: 12.5 }}>
              <i className="lni lni-reload animate-spin"></i> Loading payment…
            </div>
          ) : isError || !entry ? (
            <div className="text-clr-red text-center" style={{ padding: 24, fontSize: 12.5 }}>
              <i className="lni lni-warning"></i> {loadErrorMessage(error)}
            </div>
          ) : (
            <div className="receipt-print-area border border-g200 rounded-xl p-5 bg-g50" style={{ wordBreak: 'break-word' }}>
              <div className="text-center mb-4 pb-3 border-b border-g200">
                <h3 className="font-bold text-g900" style={{ fontSize: 'var(--fs-lg)' }}>ISBAT University</h3>
                <p className="text-g500" style={{ fontSize: 'var(--fs-xs)' }}>Institute of Skill Development And Training</p>
                <p className="text-g400" style={{ fontSize: 11 }}><i className="lni lni-map-marker"></i> Kampala, Uganda · erp.isbatuniversity.ac.ug</p>
                <div className="font-mono font-bold text-blue mt-2" style={{ fontSize: 14 }}>{entry.receipt ?? '—'}</div>
                <div className="text-g400 uppercase font-bold mt-1" style={{ fontSize: 10, letterSpacing: '.06em' }}>Official Payment Receipt</div>
              </div>
              <div className="receipt-row"><span className="text-muted">Student Name</span><span className="font-bold">{student.name || '—'}</span></div>
              <div className="receipt-row"><span className="text-muted">Student No.</span><span className="font-mono text-blue">{student.studentNo ?? '—'}</span></div>
              <div className="receipt-row"><span className="text-muted">Programme</span><span>{student.programName ?? '—'}</span></div>
              <div className="receipt-row"><span className="text-muted">Payment Code</span><span className="font-mono">{entry.paymentCode ?? '—'}</span></div>
              <div className="receipt-row"><span className="text-muted">Payment Method</span><span>{fromAdvance ? 'Advance deposit' : (PAY_TYPE_LABELS[entry.payType] ?? '—')}</span></div>
              {entry.bank && <div className="receipt-row"><span className="text-muted">Bank</span><span>{entry.bank.bankName}</span></div>}
              <div className="receipt-row"><span className="text-muted">Date</span><span>{formatDate(entry.payDate)}</span></div>

              <div className="mt-3 mb-1 text-g400 uppercase font-bold" style={{ fontSize: 10, letterSpacing: '.06em' }}>Paid For</div>
              {entry.ledgers?.length ? entry.ledgers.map((l, i) => (
                <div className="receipt-row" key={l.ledger?.ledgerGuid ?? i}>
                  <span>{l.ledger?.ledgerName ?? '—'}{l.ledger?.ledgerCode && <span className="text-g400" style={{ fontSize: 11 }}> · {l.ledger.ledgerCode}</span>}</span>
                  <span>{fmtAmount(l.amount)} {currency}</span>
                </div>
              )) : <div className="receipt-row"><span>—</span><span></span></div>}
              <div className="receipt-row"><span className="text-muted">Amount Paid</span><span className="font-bold">{fmtAmount(entry.amount)} {currency}</span></div>
              {entry.remarks && <div className="receipt-row"><span className="text-muted">Remarks</span><span>{entry.remarks}</span></div>}

              <div className="text-center text-g400 mt-3 pt-3 border-t border-dashed border-g300" style={{ fontSize: 10 }}>
                Received by: Finance Office · ISBAT University<br />
                {fromAdvance ? 'Paid from an advance deposit · ' : 'Reprinted receipt · '}Payment ref: <span className="font-mono">{entry.paymentOtherGuid}</span>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer no-print" style={{ flexShrink: 0 }}>
          <button className="btn btn-neu flex-1 justify-center" onClick={onClose}>Close</button>
          {/* Without `print` it explains instead of printing. Hidden for
              advance-funded payments, which have no receipt to print. */}
          {entry?.receipt && (
            <button className="btn btn-neu flex-1 justify-center" disabled={downloading} onClick={() => onDownload(entry)}>
              <i className="lni lni-download"></i> {downloading ? 'Downloading…' : 'Download'}
            </button>
          )}
          {entry?.receipt && (
            <button className="btn btn-primary flex-1 justify-center" disabled={printing} onClick={() => onPrint(entry)}>
              <i className="lni lni-printer"></i> {printing ? 'Loading receipt…' : 'Print Receipt'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
