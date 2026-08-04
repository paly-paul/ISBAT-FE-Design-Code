'use client'
import { useMemo, useState } from 'react'
import { ScrollTable } from '@/components/ScrollTable'
import { ActionMenu } from '@/components/ActionMenu'
import { TableSearch } from '@/components/TableSearch'
import { EmptyState } from '@/components/EmptyState'
import { Pagination } from '@/components/Pagination'
import { usePagination } from '@/hooks/usePagination'
import { Toast } from '@/components/Toast'

const PAGE_SIZE = 10

const FEE_TYPES = ['Admission Fee', 'Registration Fee', 'Tuition Fee', 'NCHE Fee', 'Guild Fee']

interface Txn {
  receipt: string; date: string; sno: string; name: string; programme: string
  feeType: string; feeBadge: string; paid: string; cur: 'USD' | 'UGX'; ugx: string; rate: string
  method: string; pill: string
}

const TRANSACTIONS: Txn[] = [
  { receipt: 'RCP-2026-0089', date: '09/05/2026 09:14', sno: 'ISB/2026/0021', name: 'Tumukunde Alice Grace', programme: 'Diploma Nursing', feeType: 'Tuition S1', feeBadge: 'badge-green', paid: '1,000', cur: 'USD', ugx: '3,750,000', rate: '3,750', method: 'Cash', pill: 'pill-blue' },
  { receipt: 'RCP-2026-0088', date: '09/05/2026 08:47', sno: 'ISB/2026/0023', name: 'Nakato Sarah Bridget', programme: 'BSc. CS', feeType: 'Registration', feeBadge: 'badge-blue', paid: '250', cur: 'USD', ugx: '937,500', rate: '3,750', method: 'Bank', pill: 'pill-cyan' },
  { receipt: 'RCP-2026-0087', date: '09/05/2026 08:22', sno: 'ISB/2026/0019', name: 'Nampijja Grace Miriam', programme: 'BCom. Accounting', feeType: 'Tuition S1', feeBadge: 'badge-amber', paid: '400,000', cur: 'UGX', ugx: '400,000', rate: '—', method: 'Cash', pill: 'pill-blue' },
  { receipt: 'RCP-2026-0086', date: '09/05/2026 08:05', sno: 'ISB/2026/0018', name: 'Byamukama Robert', programme: 'BEng. Civil', feeType: 'Admission Fee', feeBadge: 'badge-blue', paid: '50,000', cur: 'UGX', ugx: '50,000', rate: '—', method: 'Cash', pill: 'pill-blue' },
  { receipt: 'RCP-2026-0085', date: '08/05/2026 16:38', sno: 'ISB/2026/0020', name: 'Mugisha David Kalisa', programme: 'BSc. Information Technology', feeType: 'Tuition S1', feeBadge: 'badge-green', paid: '750', cur: 'USD', ugx: '2,812,500', rate: '3,750', method: 'Bank', pill: 'pill-cyan' },
  { receipt: 'RCP-2026-0084', date: '08/05/2026 14:52', sno: 'ISB/2026/0022', name: 'Okello James Patrick', programme: 'MBA Business Admin (ODL)', feeType: 'Registration', feeBadge: 'badge-blue', paid: '200', cur: 'USD', ugx: '750,000', rate: '3,750', method: 'Cash', pill: 'pill-blue' },
  { receipt: 'RCP-2026-0083', date: '08/05/2026 11:10', sno: 'ISB/2026/0017', name: 'Atim Grace Beatrice', programme: 'BCom. Accounting', feeType: 'NCHE Fee', feeBadge: 'badge-purple', paid: '20,000', cur: 'UGX', ugx: '20,000', rate: '—', method: 'Cash', pill: 'pill-blue' },
  { receipt: 'RCP-2026-0082', date: '07/05/2026 15:27', sno: 'ISB/2026/0016', name: 'Ssemakula Peter', programme: 'BSc. Computer Science', feeType: 'Guild Fee', feeBadge: 'badge-purple', paid: '10,000', cur: 'UGX', ugx: '10,000', rate: '—', method: 'Cash', pill: 'pill-blue' },
  { receipt: 'RCP-2026-0081', date: '07/05/2026 10:03', sno: 'ISB/2026/0015', name: 'Nabirye Joan', programme: 'BBA Business Administration', feeType: 'Tuition S1', feeBadge: 'badge-green', paid: '600,000', cur: 'UGX', ugx: '600,000', rate: '—', method: 'Bank', pill: 'pill-cyan' },
  { receipt: 'RCP-2026-0080', date: '06/05/2026 13:45', sno: 'ISB/2026/0014', name: 'Kirabo Sandra', programme: 'Diploma Nursing', feeType: 'Admission Fee', feeBadge: 'badge-blue', paid: '50,000', cur: 'UGX', ugx: '50,000', rate: '—', method: 'Cash', pill: 'pill-blue' },
  { receipt: 'RCP-2026-0079', date: '06/05/2026 09:18', sno: 'ISB/2026/0013', name: 'Tumusiime Brian', programme: 'BEng. Civil', feeType: 'Registration', feeBadge: 'badge-blue', paid: '200', cur: 'USD', ugx: '750,000', rate: '3,750', method: 'Cash', pill: 'pill-blue' },
]

export default function Page() {
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)
  const [search, setSearch] = useState('')
  const [feeType, setFeeType] = useState('')

  function showToast(msg: string, type = '') { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return TRANSACTIONS.filter(t => {
      const matchesSearch = !q || t.name.toLowerCase().includes(q) || t.receipt.toLowerCase().includes(q) || t.sno.toLowerCase().includes(q)
      const matchesFeeType = !feeType || t.feeType.toLowerCase().includes(feeType.split(' ')[0].toLowerCase())
      return matchesSearch && matchesFeeType
    })
  }, [search, feeType])

  // Live preview shown in the search dropdown as the user types — same
  // match test as filteredRows' matchesSearch above, capped to 8 and
  // ignoring the Fee Type filter so it always reflects "what search alone
  // would find".
  const searchMatches = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return []
    return TRANSACTIONS.filter(t => t.name.toLowerCase().includes(q) || t.receipt.toLowerCase().includes(q) || t.sno.toLowerCase().includes(q)).slice(0, 8)
  }, [search])

  const { page, setPage, totalPages, totalCount, pageItems } = usePagination(filteredRows, PAGE_SIZE)

  function clearFilters() { setSearch(''); setFeeType('') }

  return (
    <>
      <div className="page active">
        <div className="pg-hdr">
          <div>
            <div className="pg-title">Payment History</div>
            <div className="pg-sub">Complete transaction ledger · Spring 2026 · Search · Filter · Export</div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <TableSearch
              className="w-56"
              placeholder="Name, receipt#, student no…"
              value={search}
              onChange={setSearch}
              results={searchMatches.map(t => ({ id: t.receipt, primary: t.name, secondary: `${t.receipt} · ${t.sno}` }))}
            />
            <select className="ctrl w-auto" value={feeType} onChange={e => setFeeType(e.target.value)}>
              <option value="">All Fee Types</option>
              {FEE_TYPES.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
            <button className="btn btn-neu btn-sm" onClick={() => showToast('Exporting payment history to CSV…', 'success')}>
              <i className="lni lni-upload"></i> Export CSV
            </button>
          </div>
        </div>

        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-lbl">Total Transactions</div>
            <div className="stat-num text-blue">312</div>
            <div className="stat-sub up">Spring 2026</div>
          </div>
          <div className="stat-card [--b700:var(--green)] [--b400:#34d399]">
            <div className="stat-lbl">Collected (UGX)</div>
            <div className="stat-num text-green">247M</div>
            <div className="stat-sub up">This semester</div>
          </div>
          <div className="stat-card">
            <div className="stat-lbl">Collected (USD)</div>
            <div className="stat-num text-blue">65,800</div>
            <div className="stat-sub up">↑ 18% vs last sem</div>
          </div>
          <div className="stat-card [--b700:var(--gold)] [--b400:#fbbf24]">
            <div className="stat-lbl">Avg. Payment Size</div>
            <div className="stat-num" style={{ color: 'var(--gold)' }}>791K UGX</div>
            <div className="stat-sub">Per transaction</div>
          </div>
        </div>

        <div className="card">
          <ScrollTable>
            <table>
              <thead>
                <tr>
                  <th>Receipt #</th><th>Date &amp; Time</th><th>Student No.</th><th>Student Name</th>
                  <th>Programme</th><th>Fee Type</th><th>Paid</th><th>Cur.</th>
                  <th>UGX Value</th><th>Rate</th><th>Method</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.length === 0
                  ? <EmptyState colSpan={999} hasFilters={!!search || !!feeType} onClearFilters={clearFilters} />
                  : null}
                {pageItems.map(t => (
                  <tr key={t.receipt}>
                    <td className="text-blue font-bold font-mono">{t.receipt}</td>
                    <td className="text-muted">{t.date}</td>
                    <td className="font-mono text-blue">{t.sno}</td>
                    <td><strong>{t.name}</strong></td>
                    <td>{t.programme}</td>
                    <td><span className={`badge ${t.feeBadge}`}>{t.feeType}</span></td>
                    <td className="text-green font-bold">{t.paid}</td>
                    <td><span className="badge badge-gold">{t.cur}</span></td>
                    <td className="font-bold">{t.ugx}</td>
                    <td className="text-g400" style={{ fontSize: 11 }}>{t.rate}</td>
                    <td><span className={`pill ${t.pill}`}>{t.method}</span></td>
                    <td>
                      <ActionMenu>
                        <button className="btn btn-neu btn-sm" onClick={() => showToast(`Receipt ${t.receipt} ready to print.`, 'success')}>
                          <i className="lni lni-printer"></i> Print
                        </button>
                        <button className="btn btn-neu btn-sm" onClick={() => showToast(`Viewing receipt ${t.receipt}…`)}>
                          <i className="lni lni-eye"></i> View
                        </button>
                      </ActionMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollTable>
          <Pagination page={page} totalPages={totalPages} totalCount={totalCount} itemLabel="transactions" onPageChange={setPage} />
        </div>
      </div>
      <Toast toast={toast} />
    </>
  )
}
