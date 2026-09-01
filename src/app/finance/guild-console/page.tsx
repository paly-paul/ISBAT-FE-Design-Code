'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ScrollTable } from '@/components/ScrollTable'
import { EmptyState } from '@/components/EmptyState'
import { TableLoadingState } from '@/components/TableLoadingState'
import { Pagination } from '@/components/Pagination'
import { useGuildPaymentsList } from '@/hooks/finance/useGuildPayment'

// Guild Payment Console — system-wide admin/reporting list of every Guild
// payment, confirmed via get-payment-guilds.md's own "Used by pages" naming
// a separate /finance/guild/console page from the payment-entry one
// (guild-payment/page.tsx). Server-side paginated (the real totalCount can
// run large, same reasoning as Payment History's own list page) — not
// scoped to a single student the way that page's own Payment History card
// is.
const PAGE_SIZE = 10

export default function GuildConsolePage() {
  const router = useRouter()
  const [page, setPage] = useState(1)
  const { data, isLoading } = useGuildPaymentsList(page, PAGE_SIZE)

  const items = data?.items ?? []
  const totalCount = data?.totalCount ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  return (
    <div className="page active">
      <div className="pg-hdr">
        <div>
          <div className="pg-title">Guild Payment Console</div>
          <div className="pg-sub">Every recorded Guild payment across the system</div>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-primary" onClick={() => router.push('/finance/guild-payment')}><i className="lni lni-plus"></i> Record Payment</button>
          <button className="btn btn-neu" onClick={() => router.push('/finance/dashboard')}><i className="lni lni-arrow-left"></i> Back</button>
        </div>
      </div>

      <div className="card">
        <div className="card-hdr">
          <div className="card-title"><span className="ctitle-icon"><i className="lni lni-users"></i></span> Guild Payments</div>
        </div>
        <ScrollTable>
          <table>
            <thead>
              <tr>
                <th>Student</th>
                <th>Intake</th>
                <th>Payment Date</th>
                <th>Bank Deposit</th>
                <th>Receipt</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? <TableLoadingState colSpan={6} />
                : items.length === 0
                  ? <EmptyState colSpan={6} hasFilters={false} onClearFilters={() => setPage(1)} />
                  : items.map(r => (
                    <tr key={r.paymentGuildGuid}>
                      <td><strong>{r.studentName ?? '—'}</strong></td>
                      <td>{r.intakeCode ?? '—'}</td>
                      <td>{r.payDate.slice(0, 10)}</td>
                      <td className="text-muted">{r.bankDeposit ?? '—'}</td>
                      <td className="font-mono text-blue">{r.receipt ?? '—'}</td>
                      <td className="text-green font-bold">{r.amount.toLocaleString()}</td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </ScrollTable>
        <Pagination page={page} totalPages={totalPages} totalCount={totalCount} itemLabel="payments" onPageChange={setPage} />
      </div>
    </div>
  )
}
