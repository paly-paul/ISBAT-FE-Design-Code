'use client'
import { useState } from 'react'
import { ScrollTable } from '@/components/ScrollTable'
import { SearchSelect } from '@/components/SearchSelect'
import { TableSearch } from '@/components/TableSearch'
import { useStudents } from '@/hooks/student/useStudents'
import { StudentDto } from '@/lib/api/student/student'

// Ported from isbat_student_module.html's Student Statement page. Student
// identity comes from the real student list; the fee ledger itself has no
// backend contract for this workflow — mock rows only.
interface LedgerRow {
  paymentDate: string
  receiptNo: string
  semester: string
  ledgerName: string
  actualAmount: number
  currency: 'USD' | 'UGX'
  paidAmount: number
  balance: number
}

const LEDGER_ROWS: LedgerRow[] = [
  { paymentDate: '15 Jan 2024', receiptNo: 'RCT-2024-00142', semester: 'Semester 1', ledgerName: 'Admission Fee',          actualAmount: 50000, currency: 'UGX', paidAmount: 50000, balance: 0 },
  { paymentDate: '15 Jan 2024', receiptNo: 'RCT-2024-00143', semester: 'Semester 1', ledgerName: 'Registration Fee',       actualAmount: 250,   currency: 'USD', paidAmount: 250,   balance: 0 },
  { paymentDate: '20 Jan 2024', receiptNo: 'RCT-2024-00151', semester: 'Semester 1', ledgerName: 'Tuition — Semester 1',   actualAmount: 750,   currency: 'USD', paidAmount: 750,   balance: 0 },
  { paymentDate: '10 Jun 2024', receiptNo: 'RCT-2024-00289', semester: 'Semester 2', ledgerName: 'Semester Entry Fee',     actualAmount: 200,   currency: 'USD', paidAmount: 200,   balance: 0 },
  { paymentDate: '15 Jun 2024', receiptNo: 'RCT-2024-00291', semester: 'Semester 2', ledgerName: 'Tuition — Semester 2',   actualAmount: 750,   currency: 'USD', paidAmount: 750,   balance: 0 },
  { paymentDate: '08 Jan 2025', receiptNo: 'RCT-2025-00034', semester: 'Semester 3', ledgerName: 'Semester Entry Fee',     actualAmount: 200,   currency: 'USD', paidAmount: 200,   balance: 0 },
  { paymentDate: '10 Jan 2025', receiptNo: 'RCT-2025-00041', semester: 'Semester 3', ledgerName: 'Tuition — Semester 3',   actualAmount: 750,   currency: 'USD', paidAmount: 300,   balance: 450 },
]

// Sums one field across rows, grouped by currency, formatted as "USD 1,234 +
// UGX 50,000" — same idea as finance/student-statements' totalOutstanding,
// since ledger rows here mix USD and UGX and can't be added together as one
// number.
function sumByCurrency(rows: LedgerRow[], field: 'actualAmount' | 'paidAmount' | 'balance'): string {
  const parts: string[] = []
  for (const currency of ['USD', 'UGX'] as const) {
    const total = rows.filter(r => r.currency === currency).reduce((sum, r) => sum + r[field], 0)
    if (total > 0) parts.push(`${currency} ${total.toLocaleString()}`)
  }
  return parts.join(' + ') || '—'
}

export default function Page() {
  const [term, setTerm] = useState('')
  const [student, setStudent] = useState<StudentDto | null>(null)
  const [semester, setSemester] = useState('All Semesters')
  const { data, isFetching } = useStudents(1, 8, { searchTerm: term.trim() || undefined })
  const matches = data?.items ?? []

  const filteredRows = LEDGER_ROWS.filter(r => semester === 'All Semesters' || r.semester === semester)

  function handleSelect(guid: string) {
    const found = matches.find(m => m.studentGuid === guid)
    if (found) setStudent(found)
  }

  return (
    <div className="page active">
      <div className="pg-hdr">
        <div><div className="pg-title">Student Statement</div><div className="pg-sub">Fee ledger and payment history per student</div></div>
        <div className="flex gap-2"><button className="btn btn-neu btn-sm"><i className="lni lni-printer"></i> Print</button><button className="btn btn-neu btn-sm"><i className="lni lni-download"></i> PDF</button></div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="flex gap-2">
          <TableSearch
            className="flex-1"
            value={term}
            onChange={setTerm}
            placeholder="Search student…"
            loading={isFetching}
            emptyLabel="No students found"
            results={matches.map(m => ({ id: m.studentGuid, primary: m.studentName, secondary: `${m.studentNum} · ${m.studentRegNo}` }))}
            onSelect={r => handleSelect(r.id)}
          />
          <SearchSelect
            style={{ width: 200 }}
            options={['All Semesters', 'Semester 3', 'Semester 2', 'Semester 1']}
            value={semester}
            onChange={setSemester}
          />
        </div>
      </div>

      {!student ? (
        <div className="empty">
          <div className="empty-icon"><i className="lni lni-files"></i></div>
          <div className="empty-title">No Student Loaded</div>
          <div className="empty-sub">Search for a student above and pick them from the results to view their fee ledger.</div>
        </div>
      ) : (
        <>
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16 }} className="text-xs">
              <div><span className="text-muted">Reg No: </span><span className="font-bold font-mono text-blue">{student.studentRegNo}</span></div>
              <div><span className="text-muted">Student Name: </span><span className="font-bold">{student.studentName}</span></div>
              <div><span className="text-muted">Batch: </span><span className="font-bold">{student.batchCode || '—'}</span></div>
              <div><span className="text-muted">Programme: </span><span className="font-bold">{student.programName || '—'}</span></div>
              <div><span className="text-muted">Semester: </span><span className="font-bold">{student.semesterName || '—'}</span></div>
            </div>
          </div>

          <div className="stats-row">
            <div className="stat-card"><div className="stat-lbl">Total Actual</div><div className="stat-num" style={{ color: 'var(--b700)' }}>{sumByCurrency(filteredRows, 'actualAmount')}</div><div className="stat-sub">{filteredRows.length} entries</div></div>
            <div className="stat-card [--b700:var(--green)] [--b400:#34d399]"><div className="stat-lbl">Total Paid</div><div className="stat-num" style={{ color: 'var(--green)' }}>{sumByCurrency(filteredRows, 'paidAmount')}</div><div className="stat-sub up">Across all entries</div></div>
            <div className="stat-card [--b700:var(--red)] [--b400:#f87171]"><div className="stat-lbl">Outstanding</div><div className="stat-num" style={{ color: 'var(--red)' }}>{sumByCurrency(filteredRows, 'balance')}</div><div className="stat-sub warn">Balance due</div></div>
          </div>
          <div className="card">
            <div className="card-hdr"><div className="card-title"><i className="lni lni-files"></i> Ledger — {student.studentName}</div><span className="badge badge-amber">{sumByCurrency(filteredRows, 'balance')} Outstanding</span></div>
            <ScrollTable>
              <table>
              <thead><tr><th style={{ width: 56 }}>Sl. No</th><th>Payment Date</th><th>Receipt</th><th>Semester</th><th>Ledger Name</th><th>Actual Amount</th><th>Currency</th><th>Paid Amount</th><th>Balance</th></tr></thead>
              <tbody>
                {filteredRows.map((r, i) => (
                  <tr key={r.receiptNo} className={r.balance > 0 ? 'flagged' : undefined}>
                    <td className="text-g500">{i + 1}</td>
                    <td>{r.paymentDate}</td>
                    <td className="font-mono text-blue">{r.receiptNo}</td>
                    <td>{r.semester}</td>
                    <td>{r.ledgerName}</td>
                    <td>{r.actualAmount.toLocaleString()}</td>
                    <td>{r.currency}</td>
                    <td>{r.paidAmount.toLocaleString()}</td>
                    <td>{r.balance === 0 ? '0' : <strong style={{ color: 'var(--red)' }}>{r.balance.toLocaleString()}</strong>}</td>
                  </tr>
                ))}
              </tbody>
              </table>
            </ScrollTable>
          </div>
        </>
      )}
    </div>
  )
}
