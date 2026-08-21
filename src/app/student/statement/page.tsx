'use client'
import { useState } from 'react'
import { ScrollTable } from '@/components/ScrollTable'
import { SearchSelect } from '@/components/SearchSelect'
import { useStudents } from '@/hooks/student/useStudents'
import { StudentDto } from '@/lib/api/student/student'

// Ported from isbat_student_module.html's Student Statement page. Student
// identity comes from the real student list; the fee ledger itself has no
// backend contract for this workflow — mock rows only.
const LEDGER_ROWS = [
  { date: 'Jan 15, 2024', desc: 'Admission Fee', sem: 'Sem 1', billed: '50,000 UGX', paid: '50,000 UGX', balance: '0', status: 'Cleared' as const },
  { date: 'Jan 15, 2024', desc: 'Registration Fee', sem: 'Sem 1', billed: '$250', paid: '$250', balance: '0', status: 'Cleared' as const },
  { date: 'Jan 20, 2024', desc: 'Tuition — Semester 1', sem: 'Sem 1', billed: '$750', paid: '$750', balance: '0', status: 'Cleared' as const },
  { date: 'Jun 10, 2024', desc: 'Semester Entry Fee', sem: 'Sem 2', billed: '$200', paid: '$200', balance: '0', status: 'Cleared' as const },
  { date: 'Jun 15, 2024', desc: 'Tuition — Semester 2', sem: 'Sem 2', billed: '$750', paid: '$750', balance: '0', status: 'Cleared' as const },
  { date: 'Jan 8, 2025', desc: 'Semester Entry Fee', sem: 'Sem 3', billed: '$200', paid: '$200', balance: '0', status: 'Cleared' as const },
  { date: 'Jan 10, 2025', desc: 'Tuition — Semester 3', sem: 'Sem 3', billed: '$750', paid: '$300', balance: '$450', status: 'Partial' as const, flagged: true },
]

function statusBadge(status: 'Cleared' | 'Partial') {
  return status === 'Cleared' ? <span className="badge badge-green">Cleared</span> : <span className="badge badge-amber">Partial</span>
}

export default function Page() {
  const [term, setTerm] = useState('')
  const [student, setStudent] = useState<StudentDto | null>(null)
  const [semester, setSemester] = useState('All Semesters')
  const { data } = useStudents(1, 8, { searchTerm: term.trim() || undefined })
  const matches = term.trim() ? (data?.items ?? []) : []

  return (
    <div className="page active">
      <div className="pg-hdr">
        <div><div className="pg-title">Student Statement</div><div className="pg-sub">Fee ledger and payment history per student</div></div>
        <div className="flex gap-2"><button className="btn btn-neu btn-sm"><i className="lni lni-printer"></i> Print</button><button className="btn btn-neu btn-sm"><i className="lni lni-download"></i> PDF</button></div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="flex gap-2">
          <div style={{ position: 'relative', flex: 1 }}>
            <i className="lni lni-search-alt" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: 'var(--g400)' }}></i>
            <input className="ctrl" style={{ paddingLeft: 34 }} value={term} onChange={e => setTerm(e.target.value)} placeholder="Search student…" />
          </div>
          <SearchSelect
            style={{ width: 200 }}
            options={['All Semesters', 'Semester 3', 'Semester 2', 'Semester 1']}
            value={semester}
            onChange={setSemester}
          />
          <button className="btn btn-primary btn-sm" disabled={matches.length === 0} onClick={() => setStudent(matches[0])}>Load</button>
        </div>
        {term.trim() && matches.length > 0 && !student && (
          <div style={{ fontSize: 11.5, color: 'var(--g500)', marginTop: 8 }}>{matches.length} match{matches.length !== 1 ? 'es' : ''} — top result: {matches[0].studentName} ({matches[0].studentNum})</div>
        )}
      </div>

      {!student ? (
        <div className="empty">
          <div className="empty-icon"><i className="lni lni-files"></i></div>
          <div className="empty-title">No Student Loaded</div>
          <div className="empty-sub">Search for a student above and click Load to view their fee ledger.</div>
        </div>
      ) : (
        <>
          <div className="stats-row">
            <div className="stat-card"><div className="stat-lbl">Total Billed</div><div className="stat-num" style={{ color: 'var(--b700)' }}>$2,800</div><div className="stat-sub">3 semesters</div></div>
            <div className="stat-card [--b700:var(--green)] [--b400:#34d399]"><div className="stat-lbl">Total Paid</div><div className="stat-num" style={{ color: 'var(--green)' }}>$2,350</div><div className="stat-sub up">84% clearance</div></div>
            <div className="stat-card [--b700:var(--red)] [--b400:#f87171]"><div className="stat-lbl">Outstanding</div><div className="stat-num" style={{ color: 'var(--red)' }}>$450</div><div className="stat-sub warn">Semester 3</div></div>
            <div className="stat-card [--b700:var(--amber)] [--b400:#fbbf24]"><div className="stat-lbl">Fee Clearance</div><div className="stat-num" style={{ color: 'var(--amber)' }}>84%</div><div className="stat-sub warn">Below 100%</div></div>
          </div>
          <div className="card">
            <div className="card-hdr"><div className="card-title"><i className="lni lni-files"></i> Ledger — {student.studentName}</div><span className="badge badge-amber">$450 Outstanding</span></div>
            <ScrollTable>
              <table>
              <thead><tr><th>Date</th><th>Description</th><th>Semester</th><th>Billed</th><th>Paid</th><th>Balance</th><th>Status</th></tr></thead>
              <tbody>
                {LEDGER_ROWS.filter(r => semester === 'All Semesters' || r.sem === semester.replace('Semester ', 'Sem ')).map((r, i) => (
                  <tr key={i} className={r.flagged ? 'flagged' : undefined}>
                    <td>{r.date}</td><td>{r.desc}</td><td>{r.sem}</td><td>{r.billed}</td><td>{r.paid}</td>
                    <td>{r.balance === '0' ? '0' : <strong style={{ color: 'var(--red)' }}>{r.balance}</strong>}</td>
                    <td>{statusBadge(r.status)}</td>
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
