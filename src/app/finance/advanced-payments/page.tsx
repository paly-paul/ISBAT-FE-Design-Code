'use client'
import { useState } from 'react'
import { Toast } from '@/components/Toast'
import { ScrollTable } from '@/components/ScrollTable'
import { Pagination } from '@/components/Pagination'
import { usePagination } from '@/hooks/usePagination'
import { TableSearch } from '@/components/TableSearch'

const PAGE_SIZE = 5

interface Deposit {
  name: string; sno: string; programme: string; date: string
  deposited: string; cur: 'USD' | 'UGX'; rate: string; ugx: string
  appliedTo: string; appliedBadge: string; remaining: string; remainingClr: string
}

const DEPOSITS: Deposit[] = [
  { name: 'Kamya Brian Sse', sno: 'ISB/2026/0025', programme: 'BSc. CS', date: '01/05/2026', deposited: '2,000', cur: 'USD', rate: '3,695', ugx: '7,390,000', appliedTo: 'Tuition S1 ✓', appliedBadge: 'badge-green', remaining: 'USD 1,250', remainingClr: 'text-green' },
  { name: 'Atim Grace Beatrice', sno: 'ISB/2026/0026', programme: 'BCom. Accounting', date: '05/05/2026', deposited: '500,000', cur: 'UGX', rate: '—', ugx: '500,000', appliedTo: 'Pending Offset', appliedBadge: 'badge-amber', remaining: 'UGX 500,000', remainingClr: 'text-amber' },
  { name: 'Tumukunde Alice Grace', sno: 'ISB/2026/0021', programme: 'Diploma Nursing', date: '28/04/2026', deposited: '1,500', cur: 'USD', rate: '3,710', ugx: '5,565,000', appliedTo: 'Registration ✓', appliedBadge: 'badge-green', remaining: 'USD 800', remainingClr: 'text-green' },
  { name: 'Okello James Patrick', sno: 'ISB/2026/0022', programme: 'MBA Business Admin (ODL)', date: '20/04/2026', deposited: '300,000', cur: 'UGX', rate: '—', ugx: '300,000', appliedTo: 'Pending Offset', appliedBadge: 'badge-amber', remaining: 'UGX 300,000', remainingClr: 'text-amber' },
  { name: 'Nakato Sarah Bridget', sno: 'ISB/2026/0023', programme: 'BSc. Computer Science', date: '15/04/2026', deposited: '1,000', cur: 'USD', rate: '3,700', ugx: '3,700,000', appliedTo: 'Tuition S1 ✓', appliedBadge: 'badge-green', remaining: 'USD 250', remainingClr: 'text-green' },
  { name: 'Mugisha David Kalisa', sno: 'ISB/2026/0020', programme: 'BSc. Information Technology', date: '10/04/2026', deposited: '750', cur: 'USD', rate: '3,695', ugx: '2,771,250', appliedTo: 'Fully Applied ✓', appliedBadge: 'badge-green', remaining: '—', remainingClr: 'text-muted' },
  { name: 'Ssemakula Peter', sno: 'ISB/2026/0016', programme: 'BSc. Computer Science', date: '05/04/2026', deposited: '200,000', cur: 'UGX', rate: '—', ugx: '200,000', appliedTo: 'Pending Offset', appliedBadge: 'badge-amber', remaining: 'UGX 200,000', remainingClr: 'text-amber' },
  { name: 'Nampijja Grace Miriam', sno: 'ISB/2026/0019', programme: 'BCom. Accounting', date: '01/04/2026', deposited: '400', cur: 'USD', rate: '3,680', ugx: '1,472,000', appliedTo: 'Registration ✓', appliedBadge: 'badge-green', remaining: 'USD 150', remainingClr: 'text-green' },
]

export default function Page() {
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)
  const [search, setSearch] = useState('')
  function showToast(msg: string, type = '') { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }

  const filteredDeposits = DEPOSITS.filter(d =>
    !search.trim() || `${d.name} ${d.sno}`.toLowerCase().includes(search.trim().toLowerCase())
  )

  const searchMatches = search.trim()
    ? DEPOSITS.filter(d => `${d.name} ${d.sno}`.toLowerCase().includes(search.trim().toLowerCase())).slice(0, 8)
    : []

  const { page, setPage, totalPages, totalCount, pageItems } = usePagination(filteredDeposits, PAGE_SIZE)

  return (
    <>
      <div className="page active">
        <div className="pg-hdr">
          <div>
            <div className="pg-title">Advanced Payments &amp; Deposits</div>
            <div className="pg-sub">Pre-payment deposits · Lock favorable exchange rates · Offset against future ledgers</div>
          </div>
          <button className="btn btn-primary" onClick={() => showToast('New Deposit form — coming next sprint.', 'warn')}>
            <i className="lni lni-plus"></i> New Deposit
          </button>
        </div>

        <div className="info-box mb-[18px]">
          <i className="lni lni-information"></i> Advanced payments allow students or sponsors to deposit funds before the fee is due. The payment is locked at the rate on the date of payment, protecting against currency fluctuation.
        </div>

        <div className="card">
          <div className="card-hdr">
            <div className="card-title"><span className="ctitle-icon"><i className="lni lni-arrow-up-circle"></i></span> Active Deposit Accounts</div>
            <TableSearch
              className="w-56"
              placeholder="Search by name or student no…"
              value={search}
              onChange={setSearch}
              results={searchMatches.map(d => ({ id: d.sno, primary: d.name, secondary: d.sno }))}
            />
          </div>
          <ScrollTable>
            <table>
              <thead>
                <tr>
                  <th>Student</th><th>Programme</th><th>Deposit Date</th>
                  <th>Deposited</th><th>Cur.</th><th>Rate Locked</th><th>UGX Value</th>
                  <th>Applied To</th><th>Remaining</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map(d => (
                  <tr key={d.sno}>
                    <td>
                      <strong>{d.name}</strong>
                      <div className="font-mono text-blue" style={{ fontSize: 11 }}>{d.sno}</div>
                    </td>
                    <td>{d.programme}</td>
                    <td>{d.date}</td>
                    <td className="font-bold">{d.deposited}</td>
                    <td><span className="badge badge-gold">{d.cur}</span></td>
                    <td className="font-mono" style={{ fontSize: 12 }}>{d.rate}</td>
                    <td className="font-bold">{d.ugx}</td>
                    <td><span className={`badge ${d.appliedBadge}`}>{d.appliedTo}</span></td>
                    <td className={`font-bold ${d.remainingClr}`}>{d.remaining}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollTable>
          <Pagination page={page} totalPages={totalPages} totalCount={totalCount} itemLabel="deposit accounts" onPageChange={setPage} />
        </div>
      </div>
      <Toast toast={toast} />
    </>
  )
}
