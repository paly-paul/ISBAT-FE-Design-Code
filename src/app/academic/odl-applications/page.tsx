'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ScrollTable } from '@/components/ScrollTable'
import { Toast } from '@/components/Toast'

export default function Page() {
  const router = useRouter()
  const [openModals, setOpenModals] = useState<Set<string>>(new Set())
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  function nav(id: string) { router.push('/academic/' + id) }
  function openModal(id: string) { setOpenModals(prev => new Set(prev).add(id)) }
  function closeModal(id: string) { setOpenModals(prev => { const s = new Set(prev); s.delete(id); return s }) }
  function showToast(msg: string, type = '') { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }

  return (
    <>
      <div className="page active">
        <div className="pg-hdr">
          <div>
            <div className="pg-title">ODL Applications</div>
            <div className="pg-sub">Online Distance Learning applicants · Temporary table → Reconciled → Regular application flow</div>
          </div>
          <div className="flex gap-2">
            <button className="btn btn-neu btn-sm" onClick={() => nav('odl-reconciliation')}><i className="lni lni-credit-cards"></i> Reconciliation Desk →</button>
          </div>
        </div>

        <div className="g2 mb-[18px]">
          <div className="info-box"><i className="lni lni-world"></i> <span>ODL applications start online at <span className="font-mono bg-[var(--b100)] py-0.5 px-[6px] rounded text-[11px]">ERP.../online.ASP</span>. Unlike regular applications, <strong>payment is not required to start</strong>. No fee exemptions apply to ODL applicants.</span></div>
          <div className="warn-box"><i className="lni lni-warning"></i> <span>Applications remain in the <strong>Temporary ODL Table</strong> until payment is reconciled by accounts. Only after reconciliation does the application move to the regular application form.</span></div>
        </div>

        <div className="pipeline">
          <div className="pip-step done"><div className="pip-circle"><i className="lni lni-checkmark"></i></div><div className="pip-info"><div className="pip-label">Online Apply</div><div className="pip-desc">Candidate fills form</div></div></div>
          <div className="pip-line done"></div>
          <div className="pip-step done"><div className="pip-circle"><i className="lni lni-checkmark"></i></div><div className="pip-info"><div className="pip-label">Ref. No. Sent</div><div className="pip-desc">Email to candidate</div></div></div>
          <div className="pip-line done"></div>
          <div className="pip-step active"><div className="pip-circle">3</div><div className="pip-info"><div className="pip-label">Payment</div><div className="pip-desc">DPO gateway</div></div></div>
          <div className="pip-line"></div>
          <div className="pip-step"><div className="pip-circle">4</div><div className="pip-info"><div className="pip-label">Reconciliation</div><div className="pip-desc">Accounts team</div></div></div>
          <div className="pip-line"></div>
          <div className="pip-step"><div className="pip-circle">5</div><div className="pip-info"><div className="pip-label">Regular App.</div><div className="pip-desc">Moved to main form</div></div></div>
          <div className="pip-line"></div>
          <div className="pip-step"><div className="pip-circle">6</div><div className="pip-info"><div className="pip-label">Admission</div><div className="pip-desc">Student status</div></div></div>
        </div>

        <div className="g4 mb-[18px]">
          <div className="stat-card"><div className="stat-lbl">Total ODL Applications</div><div className="stat-num">31</div><div className="stat-sub up">This intake</div></div>
          <div className="stat-card [--b700:var(--amber)] [--b400:#fbbf24]"><div className="stat-lbl">Awaiting Payment</div><div className="stat-num text-clr-amber">9</div><div className="stat-sub warn">In temp table</div></div>
          <div className="stat-card [--b700:var(--purple)] [--b400:#a78bfa]"><div className="stat-lbl">Paid — Pending Recon.</div><div className="stat-num text-clr-purple">4</div><div className="stat-sub warn">Accounts action needed</div></div>
          <div className="stat-card [--b700:var(--green)] [--b400:#34d399]"><div className="stat-lbl">Reconciled → Moved</div><div className="stat-num text-clr-green">18</div><div className="stat-sub up">In regular application</div></div>
        </div>

        <div className="card">
          <div className="card-hdr">
            <div className="card-title"><span className="ctitle-icon"><i className="lni lni-world"></i></span> ODL Applicants — Temporary Table</div>
            <div className="flex gap-2">
              <select className="ctrl w-auto text-xs"><option>All Statuses</option><option>Awaiting Payment</option><option>Paid — Pending Recon.</option><option>Reconciled</option></select>
              <button className="btn btn-neu btn-sm"><i className="lni lni-upload"></i> Export</button>
            </div>
          </div>
          <ScrollTable>
            <table>
              <thead><tr><th>ODL Ref No.</th><th>Applicant Name</th><th>Email</th><th>Programme</th><th>Applied Date</th><th>Payment</th><th>DPO Token</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>
                <tr><td className="font-mono text-[11px] text-b700">ODL-2026-001</td><td><strong>Ssebulime Patrick</strong></td><td className="text-[11.5px]">patrick.ss@gmail.com</td><td>MBA ODL</td><td>10 Apr 2026</td><td><span className="badge badge-green"><i className="lni lni-checkmark"></i> Paid (DPO)</span></td><td className="font-mono text-[10px]">TKN-4829</td><td><span className="badge badge-purple">Pending Recon.</span></td><td><button className="btn btn-primary btn-sm" onClick={() => nav('odl-reconciliation')}>Reconcile →</button></td></tr>
                <tr><td className="font-mono text-[11px] text-b700">ODL-2026-002</td><td><strong>Nakiyaga Flavia</strong></td><td className="text-[11.5px]">f.nakiyaga@email.com</td><td>BSc. IT ODL</td><td>11 Apr 2026</td><td><span className="badge badge-green"><i className="lni lni-checkmark"></i> Paid (DPO)</span></td><td className="font-mono text-[10px]">TKN-4831</td><td><span className="badge badge-purple">Pending Recon.</span></td><td><button className="btn btn-primary btn-sm" onClick={() => nav('odl-reconciliation')}>Reconcile →</button></td></tr>
                <tr className="flagged"><td className="font-mono text-[11px] text-b700">ODL-2026-003</td><td><strong>Mutabazi Eric</strong></td><td className="text-[11.5px]">e.mutabazi@gmail.com</td><td>MBA ODL</td><td>12 Apr 2026</td><td><span className="badge badge-amber">Not Paid</span></td><td>—</td><td><span className="badge badge-amber">Awaiting Payment</span></td><td><button className="btn btn-neu btn-sm">View App →</button></td></tr>
                <tr><td className="font-mono text-[11px] text-g400">ODL-2026-004</td><td>Acayo Lydia</td><td className="text-[11.5px]">l.acayo@email.com</td><td>Diploma Bus. ODL</td><td>05 Apr 2026</td><td><span className="badge badge-green"><i className="lni lni-checkmark"></i> Paid</span></td><td className="font-mono text-[10px]">TKN-4791</td><td><span className="badge badge-green"><i className="lni lni-checkmark"></i> Reconciled</span></td><td><button className="btn btn-neu btn-sm">View →</button></td></tr>
              </tbody>
            </table>
          </ScrollTable>
        </div>

        <div className="card border-2 border-dashed border-[var(--cyan)] bg-[var(--cyan-bg)]">
          <div className="card-hdr border-[rgba(2,132,199,.2)]">
            <div className="card-title"><span className="ctitle-icon"><i className="lni lni-world"></i></span> Candidate-Facing ODL Application Form</div>
            <span className="badge badge-cyan">Online Portal Preview</span>
          </div>
          <div className="info-box mb-[14px]">
            <i className="lni lni-information"></i> This is the online form accessible at <span className="font-mono bg-[var(--b100)] py-0.5 px-[6px] rounded text-[11px]">ERP.../online.ASP</span>. No login required — candidates access via Reference Number + Email.
          </div>
          <div className="g3">
            <div className="fg"><div className="lbl">Full Name <span className="req">*</span></div><input className="ctrl" type="text" placeholder="Full legal name" /></div>
            <div className="fg"><div className="lbl">Email Address <span className="req">*</span></div><input className="ctrl" type="email" placeholder="Your email (used for ref. number)" /></div>
            <div className="fg"><div className="lbl">Phone Number <span className="req">*</span></div><input className="ctrl" type="tel" placeholder="+256 700 000 000" /></div>
            <div className="fg"><div className="lbl">Programme of Interest <span className="req">*</span></div>
              <select className="ctrl"><option>-- Select ODL Programme --</option><option>MBA Business Admin (ODL)</option><option>BSc. IT (ODL)</option><option>Diploma in Business (ODL)</option></select>
            </div>
            <div className="fg"><div className="lbl">Highest Qualification</div>
              <select className="ctrl"><option>-- Select --</option><option>A-Level</option><option>Diploma</option><option>Bachelor&apos;s Degree</option></select>
            </div>
            <div className="fg"><div className="lbl">Photo Upload <span className="req">*</span></div>
              <div className="file-zone p-3"><input type="file" accept="image/*" /><div className="file-zone-icon text-[18px]"><i className="lni lni-image"></i></div><p>Passport photo</p></div>
            </div>
          </div>
          <div className="sec-divider">Payment Option</div>
          <div className="tgl-group mb-[14px]">
            <button className="tgl-btn tgl-active"><i className="lni lni-credit-cards"></i> Pay Online via DPO</button>
            <button className="tgl-btn"><i className="lni lni-apartment"></i> Pay Manually at Office</button>
          </div>
          <div className="success-box mb-[14px]"><i className="lni lni-checkmark"></i> <span>No fee exemptions apply to ODL applications. Application fee must be paid to complete the process.</span></div>
          <div className="flex gap-[10px] justify-end">
            <button className="btn btn-neu" onClick={() => showToast('Application saved. Reference number sent to email.', 'success')}><i className="lni lni-save"></i> Save &amp; Get Reference No.</button>
            <button className="btn btn-primary" onClick={() => showToast('Redirecting to DPO payment gateway...', 'success')}><i className="lni lni-credit-cards"></i> Proceed to Payment →</button>
          </div>
        </div>
      </div>
      <Toast toast={toast} />
    </>
  )
}
