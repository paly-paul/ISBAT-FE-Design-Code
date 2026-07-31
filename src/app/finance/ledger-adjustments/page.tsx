'use client'
import { useState } from 'react'
import { Toast } from '@/components/Toast'
import { ScrollTable } from '@/components/ScrollTable'
import { ActionMenu } from '@/components/ActionMenu'
import { AdjustLedgerModal, AdjustLedgerTarget } from '@/components/modals/finance/AdjustLedgerModal'

interface DemoStudent { name: string; sno: string }

const DEMO_STUDENTS: DemoStudent[] = [
  { name: 'Tumukunde Alice Grace', sno: 'ISB/2026/0021' },
  { name: 'Okello James Patrick', sno: 'ISB/2026/0022' },
  { name: 'Nakato Sarah Bridget', sno: 'ISB/2026/0023' },
  { name: 'Nampijja Grace Miriam', sno: 'ISB/2026/0019' },
  { name: 'Mugisha David Kalisa', sno: 'ISB/2026/0020' },
]

const HISTORICAL_LEDGER: (AdjustLedgerTarget & { paid: string })[] = [
  { semester: 'S1 2025', feeType: 'Tuition Fee', originalAmount: '750', currency: 'USD', paid: 'USD 750 ✓' },
  { semester: 'S1 2025', feeType: 'NCHE Fee', originalAmount: '20,000', currency: 'UGX', paid: 'UGX 20,000 ✓' },
]

export default function Page() {
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)
  function showToast(msg: string, type = '') { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }

  const [search, setSearch] = useState('')
  const [student, setStudent] = useState<DemoStudent>(DEMO_STUDENTS[0])
  const [expanded, setExpanded] = useState(false)
  const [adjustTarget, setAdjustTarget] = useState<AdjustLedgerTarget | null>(null)

  function loadLedger() {
    const q = search.trim().toLowerCase()
    if (!q) { showToast('Enter a student number or name.', 'warn'); return }
    const found = DEMO_STUDENTS.find(s => s.sno.toLowerCase().includes(q) || s.name.toLowerCase().includes(q))
    if (!found) { showToast('Student not found.', 'warn'); return }
    setStudent(found)
    setExpanded(false)
    showToast('Student ledger loaded.', 'success')
  }

  return (
    <>
      <div className="page active">
        <div className="pg-hdr">
          <div>
            <div className="pg-title">Ledger Adjustments &amp; Audit</div>
            <div className="pg-sub">Senior Finance Administrator · Historical record overrides · Full audit trail logged</div>
          </div>
          <div
            className="flex items-center gap-2 font-bold"
            style={{ background: 'var(--red-bg)', border: '1.5px solid var(--red-bd)', borderRadius: 'var(--rxs)', padding: '7px 14px', fontSize: 12, color: 'var(--red)' }}
          >
            <i className="lni lni-warning"></i> Senior Admin Access Required
          </div>
        </div>

        <div className="info-box mb-[18px]">
          <i className="lni lni-information"></i> All adjustments are logged permanently: user, timestamp, old value → new value. Use only for authorised corrections.
        </div>

        <div className="card" style={{ maxWidth: 680 }}>
          <div className="card-hdr">
            <div className="card-title"><span className="ctitle-icon"><i className="lni lni-search-alt"></i></span> Select Student</div>
          </div>
          <div className="g2">
            <div className="fg">
              <div className="lbl">Student Number or Name <span className="req">*</span></div>
              <div className="inp-wrap">
                <span className="inp-icon"><i className="lni lni-search-alt"></i></span>
                <input
                  className="ctrl" type="text" placeholder="e.g. ISB/2026/0021 or Alice"
                  value={search} onChange={e => setSearch(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') loadLedger() }}
                />
              </div>
            </div>
            <div className="fg flex items-end">
              <button className="btn btn-primary w-full" onClick={loadLedger}>
                <i className="lni lni-search-alt"></i> Load Ledger
              </button>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-hdr">
            <div className="card-title"><span className="ctitle-icon"><i className="lni lni-lock"></i></span> Historical Ledger — {student.name} · {student.sno}</div>
            <label className="flex items-center gap-[7px] cursor-pointer" style={{ fontSize: 13 }}>
              <input type="checkbox" checked={expanded} onChange={e => setExpanded(e.target.checked)} />
              <span>Expand Historical Semesters</span>
            </label>
          </div>

          {!expanded ? (
            <div className="warn-box">
              <i className="lni lni-lock"></i> Historical records hidden. Enable toggle above with authorised credentials to expand.
            </div>
          ) : (
            <ScrollTable>
              <table>
                <thead>
                  <tr><th>Semester</th><th>Fee Type</th><th>Original Amount</th><th>Paid</th><th>Justification</th><th>Last Modified</th><th>Action</th></tr>
                </thead>
                <tbody>
                  {HISTORICAL_LEDGER.map((l, i) => (
                    <tr key={i} style={{ background: 'var(--surface)' }}>
                      <td><span className="badge badge-blue">{l.semester}</span></td>
                      <td>{l.feeType}</td>
                      <td>{l.currency} {l.originalAmount}</td>
                      <td className="text-green font-bold">{l.paid}</td>
                      <td className="text-muted">—</td>
                      <td className="text-muted">—</td>
                      <td>
                        <ActionMenu>
                          <button className="btn btn-amber btn-sm" onClick={() => setAdjustTarget(l)}>
                            <i className="lni lni-pencil"></i> Adjust
                          </button>
                        </ActionMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollTable>
          )}
        </div>
      </div>

      <AdjustLedgerModal
        isOpen={!!adjustTarget}
        onClose={() => setAdjustTarget(null)}
        showToast={showToast}
        target={adjustTarget}
      />
      <Toast toast={toast} />
    </>
  )
}
