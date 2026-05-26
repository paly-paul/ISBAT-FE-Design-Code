'use client'

interface PageProps {
  nav: (id: string) => void;
  openModal: (id: string) => void;
  closeModal: (id: string) => void;
  showToast: (msg: string, type?: string) => void;
  openModals: Set<string>;
}

export function DashboardPage({ nav, openModal }: PageProps) {
  return (
    <div className="page active">
      <div className="pg-hdr">
        <div>
          <div className="pg-title">Academic Dashboard</div>
          <div className="pg-sub">Spring 2026 (20261) · Semester cycle overview · Real-time academic pipeline status</div>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-neu" onClick={() => nav('intake-master')}><i className="lni lni-cog"></i> Intake Settings</button>
          <button className="btn btn-primary" onClick={() => nav('session-movement')}><i className="lni lni-reload"></i> Run Session Movement</button>
        </div>
      </div>

      <div className="mb-2 flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-[.08em] text-g400">Setup Hierarchy — must be completed in sequence</span>
        <span className="badge badge-blue text-[10px]">Modules 1 → 2 → 3</span>
      </div>
      <div className="pipeline mb-3">
        <div className="pip-step done"><div className="pip-circle"><i className="lni lni-checkmark"></i></div><div className="pip-info"><div className="pip-label">Programme Level</div><div className="pip-desc">M1 · Done</div></div></div>
        <div className="pip-line done"></div>
        <div className="pip-step done"><div className="pip-circle"><i className="lni lni-checkmark"></i></div><div className="pip-info"><div className="pip-label">Programme</div><div className="pip-desc">M1 · Done</div></div></div>
        <div className="pip-line done"></div>
        <div className="pip-step done"><div className="pip-circle"><i className="lni lni-checkmark"></i></div><div className="pip-info"><div className="pip-label">Curriculum</div><div className="pip-desc">M1 · Done</div></div></div>
        <div className="pip-line done"></div>
        <div className="pip-step active"><div className="pip-circle">4</div><div className="pip-info"><div className="pip-label">Batches</div><div className="pip-desc">M2 · In progress</div></div></div>
        <div className="pip-line"></div>
        <div className="pip-step"><div className="pip-circle">5</div><div className="pip-info"><div className="pip-label">Fee Structure</div><div className="pip-desc">M2 · Pending</div></div></div>
        <div className="pip-line"></div>
        <div className="pip-step"><div className="pip-circle">6</div><div className="pip-info"><div className="pip-label">Skills + Allocation</div><div className="pip-desc">M3 · Pending</div></div></div>
        <div className="pip-line"></div>
        <div className="pip-step"><div className="pip-circle">7</div><div className="pip-info"><div className="pip-label">Session Movement</div><div className="pip-desc">M3 · 3–4 wks before start</div></div></div>
      </div>

      <div className="mb-2 flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-[.08em] text-g400">Current Semester Cycle — Spring 2026</span>
        <span className="badge badge-blue text-[10px]">Modules 3 → 4 → 5</span>
      </div>
      <div className="pipeline">
        <div className="pip-step done"><div className="pip-circle"><i className="lni lni-checkmark"></i></div><div className="pip-info"><div className="pip-label">Session Movement</div><div className="pip-desc">M3 · Completed</div></div></div>
        <div className="pip-line done"></div>
        <div className="pip-step done"><div className="pip-circle"><i className="lni lni-checkmark"></i></div><div className="pip-info"><div className="pip-label">Allocation</div><div className="pip-desc">M3 · 3 pending</div></div></div>
        <div className="pip-line done"></div>
        <div className="pip-step active"><div className="pip-circle">3</div><div className="pip-info"><div className="pip-label">Timetable</div><div className="pip-desc">M4 · In progress</div></div></div>
        <div className="pip-line"></div>
        <div className="pip-step"><div className="pip-circle">4</div><div className="pip-info"><div className="pip-label">CW / CBT</div><div className="pip-desc">M5 · Term 1</div></div></div>
        <div className="pip-line"></div>
        <div className="pip-step"><div className="pip-circle">5</div><div className="pip-info"><div className="pip-label">Uni. Exam</div><div className="pip-desc">M5 · QP vetting</div></div></div>
        <div className="pip-line"></div>
        <div className="pip-step"><div className="pip-circle">6</div><div className="pip-info"><div className="pip-label">Results</div><div className="pip-desc">M5 · End of Sem</div></div></div>
        <div className="pip-line"></div>
        <div className="pip-step"><div className="pip-circle">7</div><div className="pip-info"><div className="pip-label">Grievance</div><div className="pip-desc">M5 · Post-result</div></div></div>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-lbl">Active Students</div>
          <div className="stat-num">1,284</div>
          <div className="stat-sub up">↑ 8% vs last intake</div>
        </div>
        <div className="stat-card [--b700:var(--amber)] [--b400:#fbbf24]">
          <div className="stat-lbl">Allocation Pending</div>
          <div className="stat-num text-clr-amber">3</div>
          <div className="stat-sub warn">Batches unallocated</div>
        </div>
        <div className="stat-card [--b700:var(--green)] [--b400:#34d399]">
          <div className="stat-lbl">Timetables Active</div>
          <div className="stat-num text-clr-green">14</div>
          <div className="stat-sub up">Across all batches</div>
        </div>
        <div className="stat-card [--b700:var(--purple)] [--b400:#a78bfa]">
          <div className="stat-lbl">ODL Pending Recon.</div>
          <div className="stat-num text-clr-purple">4</div>
          <div className="stat-sub warn">Awaiting accounts</div>
        </div>
      </div>

      <div className="g2">
        <div className="card">
          <div className="card-hdr">
            <div className="card-title"><span className="ctitle-icon"><i className="lni lni-calendar"></i></span> Active Intakes</div>
            <button className="btn btn-neu btn-sm" onClick={() => nav('intake-master')}>Manage →</button>
          </div>
          <div className="flex flex-col gap-[10px]">
            <div className="p-3 bg-b50 border border-[1.5px] border-b100 rounded-[var(--rsm)]">
              <div className="flex justify-between items-center mb-[6px]">
                <span className="text-xs font-bold text-b800"><i className="lni lni-book"></i> Current Academic Intake</span>
                <span className="badge badge-blue">Spring 2026 (20261)</span>
              </div>
              <div className="text-[11.5px] text-g500 flex gap-4 flex-wrap">
                <span>Semester Start: <strong>01 Feb 2026</strong></span>
                <span>Term 1 End: <strong>30 Mar 2026</strong></span>
                <span>Semester End: <strong>31 May 2026</strong></span>
              </div>
            </div>
            <div className="p-3 bg-[var(--green-bg)] border border-[1.5px] border-[var(--green-bd)] rounded-[var(--rsm)]">
              <div className="flex justify-between items-center mb-[6px]">
                <span className="text-xs font-bold text-[#065f46]"><i className="lni lni-graduation"></i> Current Admission Intake</span>
                <span className="badge badge-green">Fall 2026 (20262)</span>
              </div>
              <div className="text-[11.5px] text-[#065f46] flex gap-4 flex-wrap">
                <span>Admission Open: <strong>01 Mar 2026</strong></span>
                <span>Closes: <strong>15 Jul 2026</strong></span>
              </div>
            </div>
            <div className="info-box text-[11.5px]">
              <i className="lni lni-information"></i> Academic Intake and Admission Intake must always be <strong>different</strong> — only one of each can be active at a time.
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-hdr">
            <div className="card-title"><span className="ctitle-icon"><i className="lni lni-bolt"></i></span> Recent Activity</div>
            <span className="badge badge-blue">Live</span>
          </div>
          <div className="timeline">
            <div className="tl-item"><div className="tl-dot done"><i className="lni lni-checkmark"></i></div><div className="tl-content"><div className="tl-label">Session Movement Complete</div><div className="tl-meta">1,284 students promoted · 12 marked dropout · 2h ago</div></div></div>
            <div className="tl-item"><div className="tl-dot active"><i className="lni lni-warning"></i></div><div className="tl-content"><div className="tl-label">Allocation Gap — BBA Sem 3</div><div className="tl-meta">3 course units unallocated · HOD action needed · 3h ago</div></div></div>
            <div className="tl-item"><div className="tl-dot active"><i className="lni lni-warning"></i></div><div className="tl-content"><div className="tl-label">ODL Payments Pending Recon.</div><div className="tl-meta">4 applications awaiting accounts · 5h ago</div></div></div>
            <div className="tl-item"><div className="tl-dot pending"></div><div className="tl-content"><div className="tl-label">Timetable — IT Sem 1 Draft</div><div className="tl-meta">Awaiting final approval · 6h ago</div></div></div>
            <div className="tl-item"><div className="tl-dot done"><i className="lni lni-checkmark"></i></div><div className="tl-content"><div className="tl-label">Course Units Updated</div><div className="tl-meta">BBA programme — 18 units confirmed · Yesterday</div></div></div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-hdr">
          <div className="card-title"><span className="ctitle-icon"><i className="lni lni-folder"></i></span> Active Batches — Spring 2026</div>
          <div className="flex gap-2">
            <select className="ctrl w-auto text-xs"><option>All Programmes</option><option>BSc. IT</option><option>BBA</option><option>BEng. Civil</option><option>MBA</option></select>
            <button className="btn btn-neu btn-sm"><i className="lni lni-upload"></i> Export</button>
          </div>
        </div>
        <div className="tbl-wrap">
          <table>
            <thead><tr><th>Batch Code</th><th>Programme</th><th>Semester</th><th>Students</th><th>Allocation</th><th>Timetable</th><th>CW Status</th><th>Action</th></tr></thead>
            <tbody>
              <tr><td><span className="font-bold text-blue font-mono">BSC-IT-S1-D</span></td><td>BSc. Information Technology</td><td><span className="pill pill-blue">Semester 1</span></td><td>42</td><td><span className="badge badge-green"><i className="lni lni-checkmark"></i> Done</span></td><td><span className="badge badge-green"><i className="lni lni-checkmark"></i> Live</span></td><td><span className="badge badge-amber">In Progress</span></td><td><button className="btn btn-neu btn-sm" onClick={() => nav('timetable')}>View →</button></td></tr>
              <tr><td><span className="font-bold text-blue font-mono">BBA-S3-D</span></td><td>BBA Business Administration</td><td><span className="pill pill-blue">Semester 3</span></td><td>38</td><td><span className="badge badge-amber"><i className="lni lni-warning"></i> 3 Pending</span></td><td><span className="badge badge-amber">Draft</span></td><td><span className="badge badge-grey">Not Started</span></td><td><button className="btn btn-amber btn-sm" onClick={() => nav('allocation')}>Fix →</button></td></tr>
              <tr><td><span className="font-bold text-blue font-mono">MBA-S1-E</span></td><td>MBA Business Admin</td><td><span className="pill pill-blue">Semester 1</span></td><td>24</td><td><span className="badge badge-green"><i className="lni lni-checkmark"></i> Done</span></td><td><span className="badge badge-green"><i className="lni lni-checkmark"></i> Live</span></td><td><span className="badge badge-green"><i className="lni lni-checkmark"></i> Active</span></td><td><button className="btn btn-neu btn-sm" onClick={() => nav('coursework')}>View →</button></td></tr>
              <tr><td><span className="font-bold text-blue font-mono">BENG-CIV-S2-D</span></td><td>BEng. Civil Engineering</td><td><span className="pill pill-blue">Semester 2</span></td><td>31</td><td><span className="badge badge-green"><i className="lni lni-checkmark"></i> Done</span></td><td><span className="badge badge-blue">Pending</span></td><td><span className="badge badge-grey">Not Started</span></td><td><button className="btn btn-neu btn-sm" onClick={() => nav('timetable')}>Schedule →</button></td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export function IntakeMasterPage({ nav, openModal }: PageProps) {
  return (
    <div className="page active">
      <div className="pg-hdr">
        <div><div className="pg-title">Intake Master</div><div className="pg-sub">Configure academic sessions · Set all semester and term dates · Manage current intakes</div></div>
        <button className="btn btn-primary" onClick={() => openModal('new-intake-modal')}><i className="lni lni-plus"></i> New Intake</button>
      </div>
      <div className="warn-box mb-5">
        <i className="lni lni-warning"></i> <span><strong>Rule:</strong> Only one <em>Current Academic Intake</em> and one <em>Current Admission Intake</em> can be active at a time. All dates are manually set to allow flexibility for government notices, student requests, and external factors.</span>
      </div>
      <div className="g2 mb-[18px]">
        <div className="bg-[linear-gradient(135deg,var(--b800),var(--b600))] rounded-xl p-5 text-white shadow-[var(--neu-out)]">
          <div className="text-[11px] font-bold uppercase tracking-[.08em] opacity-[.7] mb-1">Current Academic Intake</div>
          <div className="text-[22px] font-extrabold">Spring 2026</div>
          <div className="text-xs opacity-[.8] mt-[2px]">Code: 20261 · Teaching in progress</div>
          <div className="mt-[14px] flex gap-[10px] flex-wrap">
            <div className="bg-[rgba(255,255,255,.15)] rounded-md p-[6px_10px] text-[11px]"><div className="opacity-[.7]">Sem Start</div><div className="font-bold">01 Feb 2026</div></div>
            <div className="bg-[rgba(255,255,255,.15)] rounded-md p-[6px_10px] text-[11px]"><div className="opacity-[.7]">Term 1 End</div><div className="font-bold">30 Mar 2026</div></div>
            <div className="bg-[rgba(255,255,255,.15)] rounded-md p-[6px_10px] text-[11px]"><div className="opacity-[.7]">Sem End</div><div className="font-bold">31 May 2026</div></div>
          </div>
        </div>
        <div className="bg-[linear-gradient(135deg,#047857,var(--green))] rounded-xl p-5 text-white shadow-[var(--neu-out)]">
          <div className="text-[11px] font-bold uppercase tracking-[.08em] opacity-[.7] mb-1">Current Admission Intake</div>
          <div className="text-[22px] font-extrabold">Fall 2026</div>
          <div className="text-xs opacity-[.8] mt-[2px]">Code: 20262 · Admissions open</div>
          <div className="mt-[14px] flex gap-[10px] flex-wrap">
            <div className="bg-[rgba(255,255,255,.15)] rounded-md p-[6px_10px] text-[11px]"><div className="opacity-[.7]">Open Date</div><div className="font-bold">01 Mar 2026</div></div>
            <div className="bg-[rgba(255,255,255,.15)] rounded-md p-[6px_10px] text-[11px]"><div className="opacity-[.7]">Close Date</div><div className="font-bold">15 Jul 2026</div></div>
          </div>
        </div>
      </div>
      <div className="card">
        <div className="card-hdr">
          <div className="card-title"><span className="ctitle-icon"><i className="lni lni-calendar"></i></span> All Intakes</div>
          <button className="btn btn-neu btn-sm"><i className="lni lni-upload"></i> Export</button>
        </div>
        <div className="tbl-wrap">
          <table>
            <thead><tr><th>Code</th><th>Description</th><th>Fin. Year</th><th>Sem Start</th><th>Term1 End</th><th>Term2 End</th><th>Grievance End</th><th>Re-entry Date</th><th>Academic?</th><th>Admission?</th><th>Action</th></tr></thead>
            <tbody>
              <tr className="selected-row"><td><span className="font-bold text-blue font-mono">20261</span></td><td><strong>Spring 2026</strong></td><td>2025–26</td><td>01 Feb 2026</td><td>30 Mar 2026</td><td>31 May 2026</td><td>10 Jun 2026</td><td>15 Jun 2026</td><td><span className="badge badge-green"><i className="lni lni-checkmark"></i> Current</span></td><td>—</td><td><button className="btn btn-neu btn-sm" onClick={() => openModal('intake-edit-modal')}><i className="lni lni-pencil"></i> Edit</button></td></tr>
              <tr><td><span className="font-bold text-blue font-mono">20262</span></td><td><strong>Fall 2026</strong></td><td>2026–27</td><td>01 Aug 2026</td><td>30 Sep 2026</td><td>30 Nov 2026</td><td>10 Dec 2026</td><td>15 Dec 2026</td><td>—</td><td><span className="badge badge-green"><i className="lni lni-checkmark"></i> Current</span></td><td><button className="btn btn-neu btn-sm" onClick={() => openModal('intake-edit-modal')}><i className="lni lni-pencil"></i> Edit</button></td></tr>
              <tr><td><span className="font-bold font-mono text-g400">20253</span></td><td>Autumn 2025</td><td>2025–26</td><td>01 Sep 2025</td><td>31 Oct 2025</td><td>31 Dec 2025</td><td>10 Jan 2026</td><td>15 Jan 2026</td><td><span className="badge badge-grey">Closed</span></td><td><span className="badge badge-grey">Closed</span></td><td><button className="btn btn-neu btn-sm"><i className="lni lni-eye"></i> View</button></td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export function CourseUnitsPage({ nav, openModal }: PageProps) {
  return (
    <div className="page active">
      <div className="pg-hdr">
        <div><div className="pg-title">Course Units Master (Curriculum)</div><div className="pg-sub">Define subjects per semester · Set Unit Type and Category · Attach approved syllabus · Configure assessment components</div></div>
        <button className="btn btn-primary" onClick={() => openModal('cu-new-modal')}><i className="lni lni-plus"></i> Add Course Unit</button>
      </div>
      <div className="g2 mb-[14px]">
        <div className="info-box"><i className="lni lni-clipboard"></i> Assessment proration: <strong>CW 25→15 · CBT 50→15 · UE 100→70.</strong> Total credits across all semesters must meet the programme's <strong>minimum credit load</strong> (e.g. 132 for BBA). All units must align with approved syllabus from <strong>NCHE or UVTOP</strong>.</div>
        <div className="info-box"><i className="lni lni-target"></i> <strong>Unit Type</strong> controls assessment: Theory (IA+UA) · Practical (CW only, no CBT) · Combined (Theory IA + Practical exam, no Practical IA) · Project (student-led, evaluated after set timeframe). <strong>Unit Category</strong>: Core (all students) · Specialization (specific specialization students) · Elective (one paper selected per batch for the session).</div>
      </div>
      <div className="card mb-[14px]">
        <div className="card-hdr"><div className="card-title"><span className="ctitle-icon"><i className="lni lni-key"></i></span> Unit Type → Assessment Component Rules</div></div>
        <div className="g4">
          <div className="p-3 bg-b50 border border-[1.5px] border-b100 rounded-[var(--rsm)]"><div className="text-[11px] font-bold text-b700 mb-[6px]"><i className="lni lni-book"></i> THEORY</div><div className="text-xs text-[var(--g700)]">Internal Assessment: <strong>CW + CBT</strong></div><div className="text-xs text-[var(--g700)]">University Assessment: <strong>UE Paper</strong></div></div>
          <div className="p-3 bg-[var(--green-bg)] border border-[1.5px] border-[var(--green-bd)] rounded-[var(--rsm)]"><div className="text-[11px] font-bold text-clr-green mb-[6px]"><i className="lni lni-microscope"></i> PRACTICAL</div><div className="text-xs text-[var(--g700)]">Internal Assessment: <strong>CW only</strong> (no CBT)</div><div className="text-xs text-[var(--g700)]">University Assessment: <strong>Practical Exam</strong></div></div>
          <div className="p-3 bg-[var(--amber-bg)] border border-[1.5px] border-[var(--amber-bd)] rounded-[var(--rsm)]"><div className="text-[11px] font-bold text-clr-amber mb-[6px]"><i className="lni lni-bulb"></i> COMBINED</div><div className="text-xs text-[var(--g700)]">Theory IA: <strong>CW + CBT</strong></div><div className="text-xs text-[var(--g700)]">Practical: <strong>No IA</strong>, separate exam only</div></div>
          <div className="p-3 bg-[var(--purple-bg)] border border-[1.5px] border-[var(--purple-bd)] rounded-[var(--rsm)]"><div className="text-[11px] font-bold text-[var(--purple)] mb-[6px]"><i className="lni lni-rocket"></i> PROJECT</div><div className="text-xs text-[var(--g700)]">Student-led work (internship / project)</div><div className="text-xs text-[var(--g700)]">Evaluated after set timeframe (e.g. 2 months)</div></div>
        </div>
      </div>
      <div className="card">
        <div className="card-hdr">
          <div className="card-title"><span className="ctitle-icon"><i className="lni lni-book"></i></span> Course Unit Master</div>
          <div className="flex gap-2">
            <select className="ctrl w-auto text-xs"><option>All Programmes</option><option>BSc. IT</option><option>BBA</option><option>BEng. Civil</option><option>MBA</option></select>
            <select className="ctrl w-auto text-xs"><option>All Semesters</option><option>Semester 1</option><option>Semester 2</option><option>Semester 3</option></select>
            <select className="ctrl w-auto text-xs"><option>All Types</option><option>Theory</option><option>Practical</option><option>Combined</option><option>Project</option></select>
            <button className="btn btn-neu btn-sm"><i className="lni lni-upload"></i> Export</button>
          </div>
        </div>
        <div className="tbl-wrap">
          <table>
            <thead><tr><th>Code</th><th>Unit Name</th><th>Programme</th><th>Sem</th><th>Credits</th><th>Unit Type</th><th>Category</th><th>Has CW</th><th>Has CBT</th><th>Proration</th><th>Syllabus</th><th>Action</th></tr></thead>
            <tbody>
              <tr><td className="font-mono text-[11px] text-b700">IT101</td><td><strong>Introduction to Programming</strong></td><td>BSc. IT</td><td><span className="pill pill-blue">Sem 1</span></td><td>3</td><td><span className="badge badge-blue">Theory</span></td><td><span className="badge badge-grey">Core</span></td><td><span className="badge badge-green"><i className="lni lni-checkmark"></i></span></td><td><span className="badge badge-green"><i className="lni lni-checkmark"></i></span></td><td className="font-mono text-[11px]">CW25→15 / CBT50→15 / UE100→70</td><td><span className="badge badge-green">Attached</span></td><td><button className="btn btn-neu btn-sm" onClick={() => openModal('cu-edit-modal')}><i className="lni lni-pencil"></i> Edit</button></td></tr>
              <tr><td className="font-mono text-[11px] text-b700">IT102</td><td><strong>Computer Organisation</strong></td><td>BSc. IT</td><td><span className="pill pill-blue">Sem 1</span></td><td>3</td><td><span className="badge badge-blue">Theory</span></td><td><span className="badge badge-grey">Core</span></td><td><span className="badge badge-green"><i className="lni lni-checkmark"></i></span></td><td><span className="badge badge-red"><i className="lni lni-close"></i></span></td><td className="font-mono text-[11px]">CW25→15 / UE100→70</td><td><span className="badge badge-green">Attached</span></td><td><button className="btn btn-neu btn-sm" onClick={() => openModal('cu-edit-modal')}><i className="lni lni-pencil"></i> Edit</button></td></tr>
              <tr><td className="font-mono text-[11px] text-b700">IT104</td><td><strong>Programming Lab</strong></td><td>BSc. IT</td><td><span className="pill pill-blue">Sem 1</span></td><td>2</td><td><span className="badge badge-green">Practical</span></td><td><span className="badge badge-grey">Core</span></td><td><span className="badge badge-green"><i className="lni lni-checkmark"></i></span></td><td><span className="badge badge-red"><i className="lni lni-close"></i> (Practical — no CBT)</span></td><td className="font-mono text-[11px]">CW25→15 / Practical UE</td><td><span className="badge badge-green">Attached</span></td><td><button className="btn btn-neu btn-sm" onClick={() => openModal('cu-edit-modal')}><i className="lni lni-pencil"></i> Edit</button></td></tr>
              <tr><td className="font-mono text-[11px] text-b700">IT105</td><td><strong>Systems &amp; Lab (Combined)</strong></td><td>BSc. IT</td><td><span className="pill pill-blue">Sem 2</span></td><td>4</td><td><span className="badge badge-amber">Combined</span></td><td><span className="badge badge-grey">Core</span></td><td><span className="badge badge-green"><i className="lni lni-checkmark"></i> (Theory)</span></td><td><span className="badge badge-green"><i className="lni lni-checkmark"></i> (Theory only)</span></td><td className="font-mono text-[11px]">Theory IA + Practical UE (no Practical IA)</td><td><span className="badge badge-green">Attached</span></td><td><button className="btn btn-neu btn-sm" onClick={() => openModal('cu-edit-modal')}><i className="lni lni-pencil"></i> Edit</button></td></tr>
              <tr><td className="font-mono text-[11px] text-b700">MBA501</td><td><strong>MBA Internship Project</strong></td><td>MBA</td><td><span className="pill pill-blue">Sem 4</span></td><td>6</td><td><span className="badge badge-purple">Project</span></td><td><span className="badge badge-grey">Core</span></td><td><span className="badge badge-red"><i className="lni lni-close"></i></span></td><td><span className="badge badge-red"><i className="lni lni-close"></i></span></td><td className="font-mono text-[11px]">Evaluated after 2 months</td><td><span className="badge badge-green">Attached</span></td><td><button className="btn btn-neu btn-sm" onClick={() => openModal('cu-edit-modal')}><i className="lni lni-pencil"></i> Edit</button></td></tr>
              <tr><td className="font-mono text-[11px] text-b700">MBA301-FIN</td><td><strong>Financial Risk Management</strong></td><td>MBA</td><td><span className="pill pill-blue">Sem 3</span></td><td>3</td><td><span className="badge badge-blue">Theory</span></td><td><span className="badge badge-cyan">Specialization</span></td><td><span className="badge badge-green"><i className="lni lni-checkmark"></i></span></td><td><span className="badge badge-green"><i className="lni lni-checkmark"></i></span></td><td className="font-mono text-[11px]">CW25→15 / CBT50→15 / UE100→70</td><td><span className="badge badge-green">Attached</span></td><td><button className="btn btn-neu btn-sm" onClick={() => openModal('cu-edit-modal')}><i className="lni lni-pencil"></i> Edit</button></td></tr>
              <tr><td className="font-mono text-[11px] text-b700">IT-ELEC-1</td><td><strong>Elective: Remote Sensing / Renewable Energy / Radar Nav.</strong></td><td>BSc. IT</td><td><span className="pill pill-blue">Sem 5</span></td><td>3</td><td><span className="badge badge-blue">Theory</span></td><td><span className="badge badge-amber">Elective (batch-level)</span></td><td><span className="badge badge-green"><i className="lni lni-checkmark"></i></span></td><td><span className="badge badge-green"><i className="lni lni-checkmark"></i></span></td><td className="font-mono text-[11px]">CW25→15 / CBT50→15 / UE100→70</td><td><span className="badge badge-amber"><i className="lni lni-warning"></i> Pending Selection</span></td><td><div className="flex gap-2"><button className="btn btn-neu btn-sm" onClick={() => openModal('cu-edit-modal')}><i className="lni lni-pencil"></i> Edit</button><button className="btn btn-amber btn-sm" onClick={() => openModal('elective-select-modal')}>Select Paper →</button></div></td></tr>
              <tr className="flagged"><td className="font-mono text-[11px] text-b700">BBA301</td><td><strong>Strategic Management</strong></td><td>BBA</td><td><span className="pill pill-blue">Sem 3</span></td><td>4</td><td><span className="badge badge-blue">Theory</span></td><td><span className="badge badge-grey">Core</span></td><td><span className="badge badge-green"><i className="lni lni-checkmark"></i></span></td><td><span className="badge badge-green"><i className="lni lni-checkmark"></i></span></td><td className="font-mono text-[11px]">CW25→15 / CBT50→15 / UE100→70</td><td><span className="badge badge-red"><i className="lni lni-warning"></i> Missing</span></td><td><div className="flex gap-2"><button className="btn btn-neu btn-sm" onClick={() => openModal('cu-edit-modal')}><i className="lni lni-pencil"></i> Edit</button><button className="btn btn-amber btn-sm" onClick={() => openModal('cu-edit-modal')}>Upload Syllabus</button></div></td></tr>
              <tr><td className="font-mono text-[11px] text-b700">IT103</td><td><strong>Engineering Maths I</strong></td><td>BSc. IT</td><td><span className="pill pill-blue">Sem 1</span></td><td>3</td><td><span className="badge badge-blue">Theory</span></td><td><span className="badge badge-grey">Core</span></td><td><span className="badge badge-red"><i className="lni lni-close"></i></span></td><td><span className="badge badge-red"><i className="lni lni-close"></i></span></td><td className="font-mono text-[11px]">UE100→100</td><td><span className="badge badge-green">Attached</span></td><td><button className="btn btn-neu btn-sm" onClick={() => openModal('cu-edit-modal')}><i className="lni lni-pencil"></i> Edit</button></td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export function SkillMasterPage({ nav, openModal }: PageProps) {
  return (
    <div className="page active">
      <div className="pg-hdr">
        <div>
          <div className="pg-title">Skill Management Master</div>
          <div className="pg-sub">Module 3 · Faculty-only access · Feeds directly into Course Allocation · Prerequisite for allocation</div>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-neu btn-sm" onClick={() => nav('allocation')}>→ Proceed to Allocation</button>
          <button className="btn btn-primary" onClick={() => openModal('add-skill-modal')}><i className="lni lni-plus"></i> Add Skill</button>
        </div>
      </div>
      <div className="warn-box mb-[18px]">
        <i className="lni lni-warning"></i> <span><strong>Prerequisite:</strong> Faculty must input their subject expertise here before Course Allocation can be performed. The allocation screen reads from this master to validate faculty-subject matches. <strong>Faculty-only access</strong> — academic administrators can view but not edit on behalf of faculty.</span>
      </div>
      <div className="g2 mb-[18px]">
        <div className="info-box"><i className="lni lni-bulb"></i> Skills entered here define which course units a faculty member is eligible to be allocated. Typical faculty load is <strong>5–6 subjects per intake</strong>. Project subjects only require <strong>weekly check-ins</strong>, not traditional lectures.</div>
        <div className="info-box"><i className="lni lni-link"></i> This master feeds directly into <strong>Course Allocation</strong>. Allocation is only possible for faculty who have logged their skills. The Dean's Excel allocation file should reference faculty skill codes when assigning subjects.</div>
      </div>
      <div className="g4 mb-[18px]">
        <div className="stat-card"><div className="stat-lbl">Total Faculty</div><div className="stat-num">28</div><div className="stat-sub up">Teaching this intake</div></div>
        <div className="stat-card [--b700:var(--green)] [--b400:#34d399]"><div className="stat-lbl">Skills Populated</div><div className="stat-num text-clr-green">24</div><div className="stat-sub up">Ready for allocation</div></div>
        <div className="stat-card [--b700:var(--amber)] [--b400:#fbbf24]"><div className="stat-lbl">Skills Incomplete</div><div className="stat-num text-clr-amber">4</div><div className="stat-sub warn">Allocation blocked</div></div>
        <div className="stat-card [--b700:var(--purple)] [--b400:#a78bfa]"><div className="stat-lbl">Total Skills Logged</div><div className="stat-num text-clr-purple">142</div><div className="stat-sub up">Across all faculty</div></div>
      </div>
      <div className="card">
        <div className="card-hdr">
          <div className="card-title"><span className="ctitle-icon"><i className="lni lni-bulb"></i></span> Faculty Skill Register</div>
          <div className="flex gap-2">
            <select className="ctrl w-auto text-xs"><option>All Faculty</option><option>FCT</option><option>FBM</option><option>FEN</option></select>
            <select className="ctrl w-auto text-xs"><option>All Statuses</option><option>Complete</option><option>Incomplete</option></select>
            <button className="btn btn-neu btn-sm"><i className="lni lni-upload"></i> Export</button>
          </div>
        </div>
        <div className="tbl-wrap">
          <table>
            <thead><tr><th>Faculty Name</th><th>Faculty</th><th>Skills / Subject Areas</th><th>Subjects Eligible</th><th>Current Load</th><th>Project Check-ins</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              <tr>
                <td><strong>Dr. Ssekibuule Ronald</strong></td><td>FCT</td>
                <td><div className="flex gap-1 flex-wrap"><span className="pill pill-blue">Programming</span><span className="pill pill-blue">Data Structures</span><span className="pill pill-cyan">OS</span></div></td>
                <td>8</td><td><span className="badge badge-green">5 subjects</span></td><td>1</td>
                <td><span className="badge badge-green"><i className="lni lni-checkmark"></i> Complete</span></td>
                <td><button className="btn btn-neu btn-sm" onClick={() => openModal('skill-edit-modal')}><i className="lni lni-pencil"></i> View</button></td>
              </tr>
              <tr>
                <td><strong>Ms. Namutebi Joyce</strong></td><td>FCT</td>
                <td><div className="flex gap-1 flex-wrap"><span className="pill pill-blue">Computer Org.</span><span className="pill pill-blue">Networks</span></div></td>
                <td>5</td><td><span className="badge badge-green">6 subjects</span></td><td>0</td>
                <td><span className="badge badge-green"><i className="lni lni-checkmark"></i> Complete</span></td>
                <td><button className="btn btn-neu btn-sm" onClick={() => openModal('skill-edit-modal')}><i className="lni lni-pencil"></i> View</button></td>
              </tr>
              <tr>
                <td><strong>Prof. Mukasa Charles</strong></td><td>FBM</td>
                <td><div className="flex gap-1 flex-wrap"><span className="pill pill-blue">Economics</span><span className="pill pill-blue">Finance Mgmt</span><span className="pill pill-cyan">Strategy</span></div></td>
                <td>9</td><td><span className="badge badge-amber">5 subjects</span></td><td>2</td>
                <td><span className="badge badge-green"><i className="lni lni-checkmark"></i> Complete</span></td>
                <td><button className="btn btn-neu btn-sm" onClick={() => openModal('skill-edit-modal')}><i className="lni lni-pencil"></i> View</button></td>
              </tr>
              <tr className="flagged">
                <td><strong>Dr. Kibira Moses</strong></td><td>FCT</td>
                <td><span className="text-muted">— No skills entered —</span></td>
                <td>0</td><td><span className="badge badge-grey">Unallocated</span></td><td>0</td>
                <td><span className="badge badge-red"><i className="lni lni-close"></i> Incomplete</span></td>
                <td><button className="btn btn-amber btn-sm" onClick={() => openModal('skill-edit-modal')}>Add Skills →</button></td>
              </tr>
              <tr className="flagged">
                <td><strong>Ms. Atim Grace</strong></td><td>FBM</td>
                <td><div className="flex gap-1"><span className="pill pill-blue">Accounting</span></div></td>
                <td>2</td><td><span className="badge badge-grey">Unallocated</span></td><td>0</td>
                <td><span className="badge badge-amber"><i className="lni lni-warning"></i> Partial</span></td>
                <td><button className="btn btn-amber btn-sm" onClick={() => openModal('skill-edit-modal')}>Update Skills →</button></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
