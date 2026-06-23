'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ScrollTable } from '@/components/ScrollTable'
import { ConfirmMovementModal } from '@/components/modals/ConfirmMovementModal'
import { Toast } from '@/components/Toast'
import { SearchSelect } from '@/components/SearchSelect'

export default function Page() {
  const router = useRouter()
  const [openModals, setOpenModals] = useState<Set<string>>(new Set())
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)

  function nav(id: string) { router.push('/academic/' + id) }
  function openModal(id: string) { setOpenModals(prev => new Set(prev).add(id)) }
  function closeModal(id: string) { setOpenModals(prev => { const s = new Set(prev); s.delete(id); return s }) }
  function showToast(msg: string, type = '') { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }

  return (
    <>
      <div className="page active">
        <div className="pg-hdr">
          <div>
            <div className="pg-title">Session Movement</div>
            <div className="pg-sub">Module 3 · Batch-by-batch promotion · 3–4 weeks before session start · Triggers T_session_management + Tia table initialisation</div>
          </div>
          <div className="flex gap-2">
            <button className="btn btn-neu" onClick={() => nav('acad-dashboard')}>← Back</button>
          </div>
        </div>

        <div className="g2 mb-[18px]">
          <div className="warn-box flex-col gap-[6px] items-start">
            <span className="font-bold"><i className="lni lni-warning"></i> Execution Rules</span>
            <ul className="ml-4 text-[var(--fs-sm)] flex flex-col gap-1">
              <li>Must be run <strong>3–4 weeks before</strong> the session start date to prevent congestion</li>
              <li>Executed <strong>batch-by-batch</strong> — never all at once — to avoid system overload</li>
              <li>The <strong>original batch code stays fixed</strong>; only the semester number increments (e.g. Sem 2 → Sem 3)</li>
              <li>Movement is <strong>blocked if student count = 0</strong> for that programme</li>
              <li>This is <strong>irreversible</strong> — Dropout records are locked once executed</li>
            </ul>
          </div>
          <div className="info-box flex-col gap-[6px] items-start">
            <span className="font-bold"><i className="lni lni-clipboard"></i> Tables Initialised on Movement</span>
            <div className="flex flex-col gap-[6px] text-[var(--fs-sm)]">
              <div className="p-[7px_10px] bg-[var(--white)] border border-[var(--b200)] rounded-md"><span className="font-bold text-blue">T_session_management</span> — Records active programmes + semesters for the academic year. Session Flag set to <span className="font-mono bg-[var(--b100)] px-[5px] py-[1px] rounded">0</span> (not moved) → <span className="font-mono bg-[var(--green-bg)] px-[5px] py-[1px] rounded">1</span> (moved)</div>
              <div className="p-[7px_10px] bg-[var(--white)] border border-[var(--b200)] rounded-md"><span className="font-bold text-blue">Tia Table</span> — Stores programme + semester + unit + intake primary key. This PK is the first part of the Matching Code used in assessments</div>
              <div className="p-[7px_10px] bg-[var(--white)] border border-[var(--b200)] rounded-md"><span className="font-bold text-blue">Exam Schedule Tables</span> — CW, CBT, and UE tables created with <span className="font-mono bg-[var(--amber-bg)] px-[5px] py-[1px] rounded">NULL</span> values. Exam date + start time populated later during scheduling phase</div>
            </div>
          </div>
        </div>

        <div className="card mb-[18px]">
          <div className="card-hdr">
            <div className="card-title"><span className="ctitle-icon"><i className="lni lni-clipboard"></i></span> Progression Eligibility Rules (Hardcoded Business Logic)</div>
            <span className="badge badge-amber">Read Only — System Enforced</span>
          </div>
          <ScrollTable>
            <table>
              <thead><tr><th>Stage</th><th>Fee Requirement</th><th>Subject Requirement</th><th>Sponsored Students</th><th>Outcome if Met</th><th>Failure Outcomes</th></tr></thead>
              <tbody>
                <tr>
                  <td><strong>Initial Registration (Sem 1 entry)</strong></td>
                  <td>Admission Fee <strong>+</strong> Registration Fee fully paid</td>
                  <td><span className="badge badge-grey">Not checked</span></td>
                  <td><span className="badge badge-green">Fee check bypassed</span></td>
                  <td><span className="badge badge-green"><i className="lni lni-checkmark"></i> Registered</span></td>
                  <td>—</td>
                </tr>
                <tr>
                  <td><strong>Sem 1 → Sem 2</strong></td>
                  <td>Current sem (Sem 1) fee <strong>fully cleared</strong> + Next sem Entry Fee cleared</td>
                  <td><span className="badge badge-grey">Not checked</span></td>
                  <td><span className="badge badge-green">Fee check bypassed</span></td>
                  <td><span className="badge badge-green"><i className="lni lni-checkmark"></i> Registered</span></td>
                  <td><span className="badge badge-red">Dropout</span> (current fee not paid) · <span className="badge badge-amber">Yet to register</span> (next sem entry fee not paid)</td>
                </tr>
                <tr className="bg-b50">
                  <td><strong>Sem 2 → Sem 3 and beyond</strong></td>
                  <td>Current sem fee <strong>fully cleared</strong> + Next sem Entry Fee cleared</td>
                  <td>Must clear <strong>minimum 50%</strong> of all subjects from all previous semesters</td>
                  <td><span className="badge badge-green">Fee check bypassed</span></td>
                  <td><span className="badge badge-green"><i className="lni lni-checkmark"></i> Registered</span></td>
                  <td><span className="badge badge-red">Dropout</span> (current fee) · <span className="badge badge-amber">Yet to register</span> (entry fee) · <span className="badge badge-cyan">Yet to Clear</span> (subject %)</td>
                </tr>
              </tbody>
            </table>
          </ScrollTable>
          <div className="mt-3 flex gap-2 flex-wrap">
            <div className="p-[8px_12px] bg-[var(--green-bg)] border border-[var(--green-bd)] rounded-[var(--rxs)] text-[var(--fs-xs)]"><span className="badge badge-green mr-[6px]">Registered</span>All criteria met — promoted to next semester</div>
            <div className="p-[8px_12px] bg-[var(--red-bg)] border border-[var(--red-bd)] rounded-[var(--rxs)] text-[var(--fs-xs)]"><span className="badge badge-red mr-[6px]">Dropout</span>Current semester fee not fully paid — no subject check done</div>
            <div className="p-[8px_12px] bg-[var(--amber-bg)] border border-[var(--amber-bd)] rounded-[var(--rxs)] text-[var(--fs-xs)]"><span className="badge badge-amber mr-[6px]">Yet to register</span>Next semester Entry Fee not paid</div>
            <div className="p-[8px_12px] bg-[var(--cyan-bg)] border border-[#bae6fd] rounded-[var(--rxs)] text-[var(--fs-xs)]"><span className="badge badge-cyan mr-[6px]">Yet to Clear</span>Failed to pass ≥50% of subjects from previous semesters</div>
          </div>
        </div>

        <div className="g4 mb-[18px]">
          <div className="stat-card"><div className="stat-lbl">Registered (Promote)</div><div className="stat-num text-clr-green">1,169</div><div className="stat-sub up">All criteria met</div></div>
          <div className="stat-card [--b700:var(--red)] [--b400:#f87171]"><div className="stat-lbl">Dropout</div><div className="stat-num text-clr-red">12</div><div className="stat-sub dn">Current fee not paid</div></div>
          <div className="stat-card [--b700:var(--amber)] [--b400:#fbbf24]"><div className="stat-lbl">Yet to register</div><div className="stat-num text-clr-amber">62</div><div className="stat-sub warn">Next sem entry fee unpaid</div></div>
          <div className="stat-card [--b700:var(--cyan)] [--b400:#38bdf8]"><div className="stat-lbl">Yet to Clear</div><div className="stat-num text-clr-cyan">41</div><div className="stat-sub warn">&lt;50% subjects passed</div></div>
        </div>

        <div className="card">
          <div className="card-hdr">
            <div className="card-title"><span className="ctitle-icon"><i className="lni lni-reload"></i></span> Movement Configuration</div>
          </div>
          <div className="g3">
            <div className="fg"><div className="lbl">From Intake <span className="req">*</span></div>
              <SearchSelect options={[{ value: '20261', label: 'Spring 2026 (20261) — Current Academic' }, { value: '20253', label: 'Autumn 2025 (20253)' }]} />
            </div>
            <div className="fg"><div className="lbl">To Intake <span className="req">*</span></div>
              <SearchSelect options={[{ value: '20262', label: 'Fall 2026 (20262) — Next Intake' }]} />
            </div>
            <div className="fg"><div className="lbl">Programme Filter</div>
              <SearchSelect placeholder="All Programmes" options={['BSc. IT', 'BBA', 'BEng. Civil', 'MBA']} />
            </div>
          </div>
          <div className="mt-[14px]">
            <button className="btn btn-primary" onClick={() => showToast('Running preview...', 'info')}><i className="lni lni-eye"></i> Preview Movement Results</button>
          </div>
        </div>

        <div className="card hidden" id="sm-preview">
          <div className="card-hdr">
            <div className="card-title"><span className="ctitle-icon"><i className="lni lni-eye"></i></span> Movement Preview — Spring 2026 → Fall 2026</div>
            <span className="badge badge-amber">Preview Only — Not Yet Executed</span>
          </div>
          <ScrollTable className="mb-[14px]">
            <table>
              <thead><tr><th>Student No.</th><th>Name</th><th>Programme</th><th>Stage</th><th>Curr. Sem Fee</th><th>Next Sem Entry Fee</th><th>Subject Clearance</th><th>Sponsored</th><th>Movement Outcome</th></tr></thead>
              <tbody>
                <tr><td className="font-mono text-[var(--fs-xs)]">ISB/2026/0142</td><td><strong>Nakato Sarah B.</strong></td><td>BSc. IT</td><td>Sem 2→3</td><td><span className="badge badge-green"><i className="lni lni-checkmark"></i> 100%</span></td><td><span className="badge badge-green"><i className="lni lni-checkmark"></i> Paid</span></td><td><span className="badge badge-green"><i className="lni lni-checkmark"></i> 78% passed</span></td><td>—</td><td><span className="badge badge-green"><i className="lni lni-checkmark"></i> Registered</span></td></tr>
                <tr><td className="font-mono text-[var(--fs-xs)]">ISB/2026/0099</td><td><strong>Okello James P.</strong></td><td>BBA</td><td>Sem 1→2</td><td><span className="badge badge-green"><i className="lni lni-checkmark"></i> 100%</span></td><td><span className="badge badge-green"><i className="lni lni-checkmark"></i> Paid</span></td><td><span className="badge badge-grey">Not checked (Sem1→2)</span></td><td>—</td><td><span className="badge badge-green"><i className="lni lni-checkmark"></i> Registered</span></td></tr>
                <tr><td className="font-mono text-[var(--fs-xs)]">ISB/2026/0034</td><td><strong>Abubakar Faisal</strong></td><td>BSc. IT</td><td>Sem 2→3</td><td><span className="badge badge-green"><i className="lni lni-checkmark"></i> 100%</span></td><td><span className="badge badge-green"><i className="lni lni-checkmark"></i> Paid</span></td><td><span className="badge badge-red"><i className="lni lni-close"></i> 38% passed</span></td><td>—</td><td><span className="badge badge-cyan">Yet to Clear</span></td></tr>
                <tr className="flagged"><td className="font-mono text-[var(--fs-xs)]">ISB/2026/0213</td><td><strong>Byamukama Robert</strong></td><td>BEng.</td><td>Sem 2→3</td><td><span className="badge badge-green"><i className="lni lni-checkmark"></i> 100%</span></td><td><span className="badge badge-red"><i className="lni lni-close"></i> Not paid</span></td><td><span className="badge badge-green"><i className="lni lni-checkmark"></i> 65% passed</span></td><td>—</td><td><span className="badge badge-amber">Yet to register</span></td></tr>
                <tr><td className="font-mono text-[var(--fs-xs)]">ISB/2025/0388</td><td><strong>Musoke David</strong></td><td>BBA</td><td>Sem 3→4</td><td><span className="badge badge-red"><i className="lni lni-close"></i> 15% only</span></td><td>—</td><td><span className="badge badge-grey">Not checked (fee failed)</span></td><td>—</td><td><span className="badge badge-red"><i className="lni lni-close"></i> Dropout</span></td></tr>
                <tr><td className="font-mono text-[var(--fs-xs)]">ISB/2026/0051</td><td><strong>Uwase Claudine</strong></td><td>MBA</td><td>Sem 2→3</td><td><span className="badge badge-green"><i className="lni lni-checkmark"></i> (Sponsored)</span></td><td><span className="badge badge-green"><i className="lni lni-checkmark"></i> (Sponsored)</span></td><td><span className="badge badge-green"><i className="lni lni-checkmark"></i> 82% passed</span></td><td><span className="badge badge-blue"><i className="lni lni-checkmark"></i> Sponsored</span></td><td><span className="badge badge-green"><i className="lni lni-checkmark"></i> Registered</span></td></tr>
              </tbody>
            </table>
          </ScrollTable>
          <div className="g4 mb-[14px]">
            <div className="p-3 bg-[var(--green-bg)] border border-[var(--green-bd)] rounded-[var(--rsm)] text-center"><div className="text-[var(--fs-xs)] text-clr-green font-bold">REGISTERED</div><div className="text-[var(--fs-xl)] font-extrabold text-clr-green font-sans">1,169</div></div>
            <div className="p-3 bg-[var(--red-bg)] border border-[var(--red-bd)] rounded-[var(--rsm)] text-center"><div className="text-[var(--fs-xs)] text-clr-red font-bold">DROPOUT</div><div className="text-[var(--fs-xl)] font-extrabold text-clr-red font-sans">12</div></div>
            <div className="p-3 bg-[var(--amber-bg)] border border-[var(--amber-bd)] rounded-[var(--rsm)] text-center"><div className="text-[var(--fs-xs)] text-clr-amber font-bold">YET TO REGISTER</div><div className="text-[var(--fs-xl)] font-extrabold text-clr-amber font-sans">62</div></div>
            <div className="p-3 bg-[var(--cyan-bg)] border border-[#bae6fd] rounded-[var(--rsm)] text-center"><div className="text-[var(--fs-xs)] font-bold text-clr-cyan">YET TO CLEAR</div><div className="text-[var(--fs-xl)] font-extrabold text-clr-cyan font-sans">41</div></div>
          </div>
          <div className="danger-box mb-[14px]">
            <i className="lni lni-volume-high"></i> <span>This action is <strong>irreversible</strong>. Dropout records are permanently locked. Students with &quot;Yet to register&quot; or &quot;Yet to Clear&quot; statuses will need to resolve their issue before the next movement. Download the preview report before proceeding.</span>
          </div>
          <div className="flex gap-[10px] justify-end">
            <button className="btn btn-neu" onClick={() => showToast('Preview report downloaded.', 'success')}><i className="lni lni-download"></i> Download Preview CSV</button>
            <button className="btn btn-danger" onClick={() => { (document.getElementById('sm-preview') as HTMLElement).style.display = 'none'; showToast('Preview cleared.', 'warn'); }}><i className="lni lni-close"></i> Cancel</button>
            <button className="btn btn-success btn-lg" onClick={() => openModal('confirm-movement-modal')}><i className="lni lni-checkmark"></i> Confirm &amp; Execute Session Movement →</button>
          </div>
        </div>
      </div>
      <ConfirmMovementModal isOpen={openModals.has('confirm-movement-modal')} onClose={() => closeModal('confirm-movement-modal')} showToast={showToast} />
      <Toast toast={toast} />
    </>
  )
}
