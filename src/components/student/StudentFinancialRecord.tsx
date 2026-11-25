'use client'
import { useState } from 'react'
import { ScrollTable } from '@/components/ScrollTable'
import { useStudentFeeSummary, useStudentStatement } from '@/hooks/student/useStudentStatement'
import { getStudentStatementPdfUrl } from '@/lib/api/student/studentStatement'
import { PAYMENT_CATEGORY_LABELS } from '@/lib/api/finance/paymentConsole'

// Compact read-only view of a student's financial statement for Dropout
// Rejoin's "Financial Record" tab — the same data as Finance > Student
// Statement, from the dropout-rejoin routes (student.dropoutrejoin.get).
function formatMoney(amount?: number | null): string {
  if (amount == null) return '—'
  const formatted = Math.abs(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return amount < 0 ? `-${formatted}` : formatted
}

function formatDate(value?: string | null): string {
  return value ? new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
}

// Amounts are never added across currencies. A row with no currency (NCHE,
// Guild, application fee) is UGX.
type CurrencyTotals = Record<string, number>
function currencyOf(row: { currencyName?: string | null; currencyCode?: string | null }): string {
  const c = (row.currencyCode || row.currencyName || '').trim()
  if (!c || /^(ugx|uganda)/i.test(c)) return 'UGX'
  return /^(usd|us dollar)/i.test(c) ? 'USD' : c
}
function totalsOf<T extends { currencyName?: string | null; currencyCode?: string | null }>(rows: T[], amount: (row: T) => number): CurrencyTotals {
  const totals: CurrencyTotals = {}
  for (const r of rows) totals[currencyOf(r)] = (totals[currencyOf(r)] ?? 0) + (amount(r) || 0)
  return totals
}

function Totals({ totals }: { totals: CurrencyTotals }) {
  const rows = Object.entries(totals).filter(([, v]) => v !== 0)
  if (rows.length === 0) return <>{formatMoney(0)}</>
  return <>{rows.map(([currency, v]) => <span key={currency} style={{ display: 'block' }}><small>{currency}</small> {formatMoney(v)}</span>)}</>
}

type Section = 'payments' | 'outstanding' | 'future'

export function StudentFinancialRecord({ studentGuid }: { studentGuid: string }) {
  const [section, setSection] = useState<Section>('payments')
  const { data: statement, isLoading, isError, error } = useStudentStatement(studentGuid, 'dropout-rejoin')
  const { data: feeSummary } = useStudentFeeSummary(studentGuid, 'dropout-rejoin')

  if (isLoading) return <div className="text-g400 text-center" style={{ padding: 24, fontSize: 12.5 }}>Loading financial statement…</div>
  if (isError || !statement) {
    return (
      <div className="empty">
        <div className="empty-icon"><i className="lni lni-warning"></i></div>
        <div className="empty-title">Couldn&apos;t Load Financial Record</div>
        <div className="empty-sub">{error instanceof Error && error.message && error.message !== 'not_found' ? error.message : 'No statement is available for this student.'}</div>
      </div>
    )
  }

  const payments = statement.paymentHistory ?? []
  const outstanding = statement.outstandingItems ?? []
  const future = statement.futurePayments ?? []
  // Paid is fee-summary's (the rows stand in until it loads). Outstanding stays
  // with the rows: fee-summary's toBePaid* counts future payments and leaves
  // out NCHE / Guild dues (seen 2026-11-25), as on Finance > Student Statement.
  const totalPaid: CurrencyTotals = feeSummary
    ? { UGX: feeSummary.totalAmountPaidUgx, USD: feeSummary.totalAmountPaidUsd }
    : totalsOf(payments, p => p.amount)
  const currentOutstanding = totalsOf(outstanding, o => o.outstanding)
  const totalFuture = totalsOf(future, f => f.amountDue)
  const isCleared = Object.values(currentOutstanding).every(v => Math.round(v * 100) <= 0)

  const sections: { id: Section; label: string; icon: string; count: number }[] = [
    { id: 'payments', label: 'Payment History', icon: 'credit-cards', count: payments.length },
    { id: 'outstanding', label: 'Outstanding Items', icon: 'wallet', count: outstanding.length },
    { id: 'future', label: 'Future Payments', icon: 'alarm-clock', count: future.length },
  ]

  return (
    <>
      <div className="stat-grid-fluid mb-3">
        <div className="stat-card"><div className="stat-lbl">Total Paid</div><div className="stat-num"><Totals totals={totalPaid} /></div></div>
        <div className="stat-card"><div className="stat-lbl">Current Outstanding</div><div className="stat-num" style={{ color: isCleared ? 'var(--green)' : 'var(--red)' }}><Totals totals={currentOutstanding} /></div></div>
        <div className="stat-card"><div className="stat-lbl">Future Payments</div><div className="stat-num"><Totals totals={totalFuture} /></div></div>
      </div>

      <div className="card">
        <div className="card-hdr" style={{ flexWrap: 'wrap', gap: 8 }}>
          <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
            {sections.map(s => (
              <button key={s.id} className={`btn btn-sm ${section === s.id ? 'btn-primary' : 'btn-neu'}`} onClick={() => setSection(s.id)}>
                <i className={`lni lni-${s.icon}`}></i> {s.label} ({s.count})
              </button>
            ))}
          </div>
          <button className="btn btn-neu btn-sm" onClick={() => window.open(getStudentStatementPdfUrl(studentGuid, 'dropout-rejoin'), '_blank')}>
            <i className="lni lni-download"></i> PDF
          </button>
        </div>

        <ScrollTable>
          {section === 'payments' && (
            <table>
              <thead><tr><th>#</th><th>Payment Code</th><th>Date</th><th>Semester</th><th>Pay Type</th><th>Receipt</th><th style={{ textAlign: 'right' }}>Amount</th><th>Currency</th><th>Category</th></tr></thead>
              <tbody>
                {payments.length === 0
                  ? <tr><td colSpan={9} className="text-g400 text-center" style={{ padding: 16 }}>No payment history.</td></tr>
                  : payments.map((p, i) => (
                    <tr key={p.paymentGuid || i}>
                      <td>{p.slNo || i + 1}</td>
                      <td className="font-mono">{p.paymentCode || '—'}</td>
                      <td>{formatDate(p.payDate)}</td>
                      <td>{p.semesterName || '—'}</td>
                      <td>{p.payType || '—'}</td>
                      <td className="font-mono">{p.receipt || '—'}</td>
                      <td className="font-mono" style={{ textAlign: 'right' }}>{formatMoney(p.amount)}</td>
                      <td>{p.currencyName || '—'}</td>
                      <td>{PAYMENT_CATEGORY_LABELS[p.category] || 'Other'}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
          {section === 'outstanding' && (
            <table>
              <thead><tr><th>#</th><th>Description</th><th>Semester</th><th>Category</th><th style={{ textAlign: 'right' }}>Outstanding</th><th>Currency</th></tr></thead>
              <tbody>
                {outstanding.length === 0
                  ? <tr><td colSpan={6} className="text-g400 text-center" style={{ padding: 16 }}>Fully settled — no outstanding items.</td></tr>
                  : outstanding.map((o, i) => (
                    <tr key={o.ledgerGuid || i}>
                      <td>{o.slNo || i + 1}</td>
                      <td>{o.description || 'Fee Assessment'}</td>
                      <td>{o.semesterName || '—'}</td>
                      <td>{PAYMENT_CATEGORY_LABELS[o.category] || 'Other'}</td>
                      <td className="font-mono" style={{ textAlign: 'right', color: 'var(--red)' }}>{formatMoney(o.outstanding)}</td>
                      <td>{o.currencyName || '—'}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
          {section === 'future' && (
            <table>
              <thead><tr><th>#</th><th>Description</th><th>Semester</th><th style={{ textAlign: 'right' }}>Amount Due</th><th>Currency</th></tr></thead>
              <tbody>
                {future.length === 0
                  ? <tr><td colSpan={5} className="text-g400 text-center" style={{ padding: 16 }}>No future payments scheduled.</td></tr>
                  : future.map((f, i) => (
                    <tr key={f.slNo || i}>
                      <td>{f.slNo || i + 1}</td>
                      <td>{f.description || '—'}</td>
                      <td>{f.semesterName || '—'}</td>
                      <td className="font-mono" style={{ textAlign: 'right' }}>{formatMoney(f.amountDue)}</td>
                      <td>{f.currencyName || '—'}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
        </ScrollTable>
      </div>
    </>
  )
}
