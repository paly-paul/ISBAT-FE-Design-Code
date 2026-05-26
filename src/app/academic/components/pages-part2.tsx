'use client'

interface PageProps {
  nav: (id: string) => void;
  openModal: (id: string) => void;
  closeModal: (id: string) => void;
  showToast: (msg: string, type?: string) => void;
  openModals: Set<string>;
}

export function SessionMovementPage({ nav, openModal, showToast }: PageProps) {
  return (
    <div className="page">
      <div className="pg-hdr">
        <div>
          <div className="pg-title">Session Movement</div>
          <div className="pg-sub">Module 3 · Batch-by-batch promotion · 3–4 weeks before session start · Triggers T_session_management + Tia table initialisation</div>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-neu" onClick={() => nav('acad-dashboard')}>← Back</button>
        </div>
      </div>

      {/* Business Rules Summary */}
      <div className="g2" style={{ marginBottom: '18px' }}>
        <div className="warn-box" style={{ flexDirection: 'column', gap: '6px', alignItems: 'flex-start' }}>
          <span style={{ fontWeight: 700 }}><i className="lni lni-warning"></i> Execution Rules</span>
          <ul style={{ marginLeft: '16px', fontSize: '12.5px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <li>Must be run <strong>3–4 weeks before</strong> the session start date to prevent congestion</li>
            <li>Executed <strong>batch-by-batch</strong> — never all at once — to avoid system overload</li>
            <li>The <strong>original batch code stays fixed</strong>; only the semester number increments (e.g. Sem 2 → Sem 3)</li>
            <li>Movement is <strong>blocked if student count = 0</strong> for that programme</li>
            <li>This is <strong>irreversible</strong> — Dropout records are locked once executed</li>
          </ul>
        </div>
        <div className="info-box" style={{ flexDirection: 'column', gap: '6px', alignItems: 'flex-start' }}>
          <span style={{ fontWeight: 700 }}><i className="lni lni-clipboard"></i> Tables Initialised on Movement</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
            <div style={{ padding: '7px 10px', background: 'var(--white)', border: '1px solid var(--b200)', borderRadius: '6px' }}><span className="font-bold text-blue">T_session_management</span> — Records active programmes + semesters for the academic year. Session Flag set to <span style={{ fontFamily: 'monospace', background: 'var(--b100)', padding: '1px 5px', borderRadius: '3px' }}>0</span> (not moved) → <span style={{ fontFamily: 'monospace', background: 'var(--green-bg)', padding: '1px 5px', borderRadius: '3px' }}>1</span> (moved)</div>
            <div style={{ padding: '7px 10px', background: 'var(--white)', border: '1px solid var(--b200)', borderRadius: '6px' }}><span className="font-bold text-blue">Tia Table</span> — Stores programme + semester + unit + intake primary key. This PK is the first part of the Matching Code used in assessments</div>
            <div style={{ padding: '7px 10px', background: 'var(--white)', border: '1px solid var(--b200)', borderRadius: '6px' }}><span className="font-bold text-blue">Exam Schedule Tables</span> — CW, CBT, and UE tables created with <span style={{ fontFamily: 'monospace', background: 'var(--amber-bg)', padding: '1px 5px', borderRadius: '3px' }}>NULL</span> values. Exam date + start time populated later during scheduling phase</div>
          </div>
        </div>
      </div>

      {/* Progression Rules Reference */}
      <div className="card" style={{ marginBottom: '18px' }}>
        <div className="card-hdr">
          <div className="card-title"><span className="ctitle-icon"><i className="lni lni-clipboard"></i></span> Progression Eligibility Rules (Hardcoded Business Logic)</div>
          <span className="badge badge-amber">Read Only — System Enforced</span>
        </div>
        <div className="tbl-wrap">
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
              <tr style={{ background: 'var(--b50)' }}>
                <td><strong>Sem 2 → Sem 3 and beyond</strong></td>
                <td>Current sem fee <strong>fully cleared</strong> + Next sem Entry Fee cleared</td>
                <td>Must clear <strong>minimum 50%</strong> of all subjects from all previous semesters</td>
                <td><span className="badge badge-green">Fee check bypassed</span></td>
                <td><span className="badge badge-green"><i className="lni lni-checkmark"></i> Registered</span></td>
                <td><span className="badge badge-red">Dropout</span> (current fee) · <span className="badge badge-amber">Yet to register</span> (entry fee) · <span className="badge badge-cyan">Yet to Clear</span> (subject %)</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div style={{ marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <div style={{ padding: '8px 12px', background: 'var(--green-bg)', border: '1px solid var(--green-bd)', borderRadius: 'var(--rxs)', fontSize: '11.5px' }}><span className="badge badge-green" style={{ marginRight: '6px' }}>Registered</span>All criteria met — promoted to next semester</div>
          <div style={{ padding: '8px 12px', background: 'var(--red-bg)', border: '1px solid var(--red-bd)', borderRadius: 'var(--rxs)', fontSize: '11.5px' }}><span className="badge badge-red" style={{ marginRight: '6px' }}>Dropout</span>Current semester fee not fully paid — no subject check done</div>
          <div style={{ padding: '8px 12px', background: 'var(--amber-bg)', border: '1px solid var(--amber-bd)', borderRadius: 'var(--rxs)', fontSize: '11.5px' }}><span className="badge badge-amber" style={{ marginRight: '6px' }}>Yet to register</span>Next semester Entry Fee not paid</div>
          <div style={{ padding: '8px 12px', background: 'var(--cyan-bg)', border: '1px solid #bae6fd', borderRadius: 'var(--rxs)', fontSize: '11.5px' }}><span className="badge badge-cyan" style={{ marginRight: '6px' }}>Yet to Clear</span>Failed to pass ≥50% of subjects from previous semesters</div>
        </div>
      </div>

      {/* Current State */}
      <div className="g4" style={{ marginBottom: '18px' }}>
        <div className="stat-card"><div className="stat-lbl">Registered (Promote)</div><div className="stat-num" style={{ color: 'var(--green)' }}>1,169</div><div className="stat-sub up">All criteria met</div></div>
        <div className="stat-card" style={{ '--b700': 'var(--red)', '--b400': '#f87171' } as React.CSSProperties}><div className="stat-lbl">Dropout</div><div className="stat-num" style={{ color: 'var(--red)' }}>12</div><div className="stat-sub dn">Current fee not paid</div></div>
        <div className="stat-card" style={{ '--b700': 'var(--amber)', '--b400': '#fbbf24' } as React.CSSProperties}><div className="stat-lbl">Yet to register</div><div className="stat-num" style={{ color: 'var(--amber)' }}>62</div><div className="stat-sub warn">Next sem entry fee unpaid</div></div>
        <div className="stat-card" style={{ '--b700': 'var(--cyan)', '--b400': '#38bdf8' } as React.CSSProperties}><div className="stat-lbl">Yet to Clear</div><div className="stat-num" style={{ color: 'var(--cyan)' }}>41</div><div className="stat-sub warn">&lt;50% subjects passed</div></div>
      </div>

      {/* Movement Scope */}
      <div className="card">
        <div className="card-hdr">
          <div className="card-title"><span className="ctitle-icon"><i className="lni lni-reload"></i></span> Movement Configuration</div>
        </div>
        <div className="g3">
          <div className="fg"><div className="lbl">From Intake <span className="req">*</span></div>
            <select className="ctrl" id="sm-from-intake"><option value="20261">Spring 2026 (20261) — Current Academic</option><option value="20253">Autumn 2025 (20253)</option></select>
          </div>
          <div className="fg"><div className="lbl">To Intake <span className="req">*</span></div>
            <select className="ctrl" id="sm-to-intake"><option value="20262">Fall 2026 (20262) — Next Intake</option></select>
          </div>
          <div className="fg"><div className="lbl">Programme Filter</div>
            <select className="ctrl" id="sm-programme"><option value="">All Programmes</option><option>BSc. IT</option><option>BBA</option><option>BEng. Civil</option><option>MBA</option></select>
          </div>
        </div>
        <div style={{ marginTop: '14px' }}>
          <button className="btn btn-primary" onClick={() => showToast('Running preview...', 'info')}><i className="lni lni-eye"></i> Preview Movement Results</button>
        </div>
      </div>

      {/* Preview Results */}
      <div className="card" id="sm-preview" style={{ display: 'none' }}>
        <div className="card-hdr">
          <div className="card-title"><span className="ctitle-icon"><i className="lni lni-eye"></i></span> Movement Preview — Spring 2026 → Fall 2026</div>
          <span className="badge badge-amber">Preview Only — Not Yet Executed</span>
        </div>
        <div className="tbl-wrap" style={{ marginBottom: '14px' }}>
          <table>
            <thead><tr><th>Student No.</th><th>Name</th><th>Programme</th><th>Stage</th><th>Curr. Sem Fee</th><th>Next Sem Entry Fee</th><th>Subject Clearance</th><th>Sponsored</th><th>Movement Outcome</th></tr></thead>
            <tbody>
              <tr><td style={{ fontFamily: 'monospace', fontSize: '11px' }}>ISB/2026/0142</td><td><strong>Nakato Sarah B.</strong></td><td>BSc. IT</td><td>Sem 2→3</td><td><span className="badge badge-green"><i className="lni lni-checkmark"></i> 100%</span></td><td><span className="badge badge-green"><i className="lni lni-checkmark"></i> Paid</span></td><td><span className="badge badge-green"><i className="lni lni-checkmark"></i> 78% passed</span></td><td>—</td><td><span className="badge badge-green"><i className="lni lni-checkmark"></i> Registered</span></td></tr>
              <tr><td style={{ fontFamily: 'monospace', fontSize: '11px' }}>ISB/2026/0099</td><td><strong>Okello James P.</strong></td><td>BBA</td><td>Sem 1→2</td><td><span className="badge badge-green"><i className="lni lni-checkmark"></i> 100%</span></td><td><span className="badge badge-green"><i className="lni lni-checkmark"></i> Paid</span></td><td><span className="badge badge-grey">Not checked (Sem1→2)</span></td><td>—</td><td><span className="badge badge-green"><i className="lni lni-checkmark"></i> Registered</span></td></tr>
              <tr><td style={{ fontFamily: 'monospace', fontSize: '11px' }}>ISB/2026/0034</td><td><strong>Abubakar Faisal</strong></td><td>BSc. IT</td><td>Sem 2→3</td><td><span className="badge badge-green"><i className="lni lni-checkmark"></i> 100%</span></td><td><span className="badge badge-green"><i className="lni lni-checkmark"></i> Paid</span></td><td><span className="badge badge-red"><i className="lni lni-close"></i> 38% passed</span></td><td>—</td><td><span className="badge badge-cyan">Yet to Clear</span></td></tr>
              <tr className="flagged"><td style={{ fontFamily: 'monospace', fontSize: '11px' }}>ISB/2026/0213</td><td><strong>Byamukama Robert</strong></td><td>BEng.</td><td>Sem 2→3</td><td><span className="badge badge-green"><i className="lni lni-checkmark"></i> 100%</span></td><td><span className="badge badge-red"><i className="lni lni-close"></i> Not paid</span></td><td><span className="badge badge-green"><i className="lni lni-checkmark"></i> 65% passed</span></td><td>—</td><td><span className="badge badge-amber">Yet to register</span></td></tr>
              <tr><td style={{ fontFamily: 'monospace', fontSize: '11px' }}>ISB/2025/0388</td><td><strong>Musoke David</strong></td><td>BBA</td><td>Sem 3→4</td><td><span className="badge badge-red"><i className="lni lni-close"></i> 15% only</span></td><td>—</td><td><span className="badge badge-grey">Not checked (fee failed)</span></td><td>—</td><td><span className="badge badge-red"><i className="lni lni-close"></i> Dropout</span></td></tr>
              <tr><td style={{ fontFamily: 'monospace', fontSize: '11px' }}>ISB/2026/0051</td><td><strong>Uwase Claudine</strong></td><td>MBA</td><td>Sem 2→3</td><td><span className="badge badge-green"><i className="lni lni-checkmark"></i> (Sponsored)</span></td><td><span className="badge badge-green"><i className="lni lni-checkmark"></i> (Sponsored)</span></td><td><span className="badge badge-green"><i className="lni lni-checkmark"></i> 82% passed</span></td><td><span className="badge badge-blue"><i className="lni lni-checkmark"></i> Sponsored</span></td><td><span className="badge badge-green"><i className="lni lni-checkmark"></i> Registered</span></td></tr>
            </tbody>
          </table>
        </div>
        <div className="g4" style={{ marginBottom: '14px' }}>
          <div style={{ padding: '12px', background: 'var(--green-bg)', border: '1px solid var(--green-bd)', borderRadius: 'var(--rsm)', textAlign: 'center' }}><div style={{ fontSize: '11px', color: 'var(--green)', fontWeight: 700 }}>REGISTERED</div><div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--green)', fontFamily: "'Inter',-apple-system,sans-serif" }}>1,169</div></div>
          <div style={{ padding: '12px', background: 'var(--red-bg)', border: '1px solid var(--red-bd)', borderRadius: 'var(--rsm)', textAlign: 'center' }}><div style={{ fontSize: '11px', color: 'var(--red)', fontWeight: 700 }}>DROPOUT</div><div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--red)', fontFamily: "'Inter',-apple-system,sans-serif" }}>12</div></div>
          <div style={{ padding: '12px', background: 'var(--amber-bg)', border: '1px solid var(--amber-bd)', borderRadius: 'var(--rsm)', textAlign: 'center' }}><div style={{ fontSize: '11px', color: 'var(--amber)', fontWeight: 700 }}>YET TO REGISTER</div><div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--amber)', fontFamily: "'Inter',-apple-system,sans-serif" }}>62</div></div>
          <div style={{ padding: '12px', background: 'var(--cyan-bg)', border: '1px solid #bae6fd', borderRadius: 'var(--rsm)', textAlign: 'center' }}><div style={{ fontSize: '11px', color: 'var(--cyan)', fontWeight: 700 }}>YET TO CLEAR</div><div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--cyan)', fontFamily: "'Inter',-apple-system,sans-serif" }}>41</div></div>
        </div>
        <div className="danger-box" style={{ marginBottom: '14px' }}>
          <i className="lni lni-volume-high"></i> <span>This action is <strong>irreversible</strong>. Dropout records are permanently locked. Students with "Yet to register" or "Yet to Clear" statuses will need to resolve their issue before the next movement. Download the preview report before proceeding.</span>
        </div>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button className="btn btn-neu" onClick={() => showToast('Preview report downloaded.', 'success')}><i className="lni lni-download"></i> Download Preview CSV</button>
          <button className="btn btn-danger" onClick={() => { (document.getElementById('sm-preview') as HTMLElement).style.display = 'none'; showToast('Preview cleared.', 'warn'); }}><i className="lni lni-close"></i> Cancel</button>
          <button className="btn btn-success btn-lg" onClick={() => openModal('confirm-movement-modal')}><i className="lni lni-checkmark"></i> Confirm & Execute Session Movement →</button>
        </div>
      </div>
    </div>
  )
}

export function AllocationPage({ nav, openModal, showToast }: PageProps) {
  return (
    <div className="page">
      <div className="pg-hdr">
        <div><div className="pg-title">Course Unit Allocation</div><div className="pg-sub">Assign course units to faculty · Upload HOD Excel sheet · Preview and confirm allocation</div></div>
        <div className="flex gap-2">
          <button className="btn btn-neu btn-sm" onClick={() => openModal('manual-alloc-modal')}><i className="lni lni-plus"></i> Manual Entry</button>
          <button className="btn btn-primary" onClick={() => openModal('alloc-import-modal')}><i className="lni lni-download"></i> Import from Excel</button>
        </div>
      </div>

      <div className="g2" style={{ marginBottom: '18px' }}>
        <div className="warn-box">
          <i className="lni lni-warning"></i> <span><strong>Prerequisite:</strong> Faculty must have populated their skills in the <button className="btn btn-amber btn-sm" style={{ padding: '3px 10px', fontSize: '11px' }} onClick={() => nav('skill-master')}><i className="lni lni-bulb"></i> Skill Management Master</button> before allocation. <strong>4 faculty members</strong> currently have incomplete skill profiles — allocation for those faculty is blocked.</span>
        </div>
        <div className="info-box">
          <i className="lni lni-information"></i> <span>Allocation data is manually entered by <strong>Support Staff</strong> from the Dean's pre-approved Excel file. <strong>No system restriction</strong> on subject count per faculty — typical load is <strong>5–6 subjects</strong>. <strong>Project subjects</strong> only require weekly check-ins, not traditional lectures — allocate accordingly.</span>
        </div>
      </div>

      {/* Allocation Stats */}
      <div className="g4" style={{ marginBottom: '18px' }}>
        <div className="stat-card"><div className="stat-lbl">Total Course Units</div><div className="stat-num">84</div><div className="stat-sub up">Across all programmes</div></div>
        <div className="stat-card" style={{ '--b700': 'var(--green)', '--b400': '#34d399' } as React.CSSProperties}><div className="stat-lbl">Allocated</div><div className="stat-num" style={{ color: 'var(--green)' }}>81</div><div className="stat-sub up">96% complete</div></div>
        <div className="stat-card" style={{ '--b700': 'var(--amber)', '--b400': '#fbbf24' } as React.CSSProperties}><div className="stat-lbl">Unallocated</div><div className="stat-num" style={{ color: 'var(--amber)' }}>3</div><div className="stat-sub warn">Action required</div></div>
        <div className="stat-card" style={{ '--b700': 'var(--purple)', '--b400': '#a78bfa' } as React.CSSProperties}><div className="stat-lbl">Faculty Members</div><div className="stat-num" style={{ color: 'var(--purple)' }}>28</div><div className="stat-sub up">Teaching this intake</div></div>
      </div>

      {/* Allocation Table */}
      <div className="card">
        <div className="card-hdr">
          <div className="card-title"><span className="ctitle-icon"><i className="lni lni-graduation"></i></span> Current Allocations — Spring 2026</div>
          <div className="flex gap-2">
            <select className="ctrl" style={{ width: 'auto', fontSize: '12px' }}><option>All Programmes</option><option>BSc. IT</option><option>BBA</option><option>BEng. Civil</option></select>
            <select className="ctrl" style={{ width: 'auto', fontSize: '12px' }}><option>All Statuses</option><option>Allocated</option><option>Unallocated</option></select>
          </div>
        </div>
        <div className="tbl-wrap">
          <table>
            <thead><tr><th>Course Code</th><th>Unit Name</th><th>Programme</th><th>Semester</th><th>Batch</th><th>Allocated To</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              <tr><td style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--b700)' }}>IT101</td><td>Introduction to Programming</td><td>BSc. IT</td><td>Sem 1</td><td>BSC-IT-S1-D</td><td><span className="font-bold">Dr. Ssekibuule Ronald</span></td><td><span className="badge badge-green"><i className="lni lni-checkmark"></i> Allocated</span></td><td><button className="btn btn-neu btn-sm" onClick={() => showToast('Editing IT101', 'info')}><i className="lni lni-pencil"></i> Edit</button></td></tr>
              <tr><td style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--b700)' }}>IT102</td><td>Computer Organisation</td><td>BSc. IT</td><td>Sem 1</td><td>BSC-IT-S1-D</td><td><span className="font-bold">Ms. Namutebi Joyce</span></td><td><span className="badge badge-green"><i className="lni lni-checkmark"></i> Allocated</span></td><td><button className="btn btn-neu btn-sm" onClick={() => showToast('Editing IT102', 'info')}><i className="lni lni-pencil"></i> Edit</button></td></tr>
              <tr className="flagged"><td style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--b700)' }}>BBA301</td><td>Strategic Management</td><td>BBA</td><td>Sem 3</td><td>BBA-S3-D</td><td><span className="text-muted">— Unallocated —</span></td><td><span className="badge badge-red"><i className="lni lni-close"></i> Missing</span></td><td><button className="btn btn-amber btn-sm" onClick={() => showToast('Assigning BBA301', 'info')}>Assign →</button></td></tr>
              <tr className="flagged"><td style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--b700)' }}>BBA302</td><td>Business Ethics</td><td>BBA</td><td>Sem 3</td><td>BBA-S3-D</td><td><span className="text-muted">— Unallocated —</span></td><td><span className="badge badge-red"><i className="lni lni-close"></i> Missing</span></td><td><button className="btn btn-amber btn-sm" onClick={() => showToast('Assigning BBA302', 'info')}>Assign →</button></td></tr>
              <tr className="flagged"><td style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--b700)' }}>BBA303</td><td>Financial Accounting III</td><td>BBA</td><td>Sem 3</td><td>BBA-S3-D</td><td><span className="text-muted">— Unallocated —</span></td><td><span className="badge badge-red"><i className="lni lni-close"></i> Missing</span></td><td><button className="btn btn-amber btn-sm" onClick={() => showToast('Assigning BBA303', 'info')}>Assign →</button></td></tr>
              <tr><td style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--b700)' }}>MBA101</td><td>Managerial Economics</td><td>MBA</td><td>Sem 1</td><td>MBA-S1-E</td><td><span className="font-bold">Prof. Mukasa Charles</span></td><td><span className="badge badge-green"><i className="lni lni-checkmark"></i> Allocated</span></td><td><button className="btn btn-neu btn-sm" onClick={() => showToast('Editing MBA101', 'info')}><i className="lni lni-pencil"></i> Edit</button></td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export function TimetablePage({ nav, openModal, showToast }: PageProps) {
  return (
    <div className="page">
      <div className="pg-hdr">
        <div>
          <div className="pg-title">Timetable Management</div>
          <div className="pg-sub">Module 4 · Drag-and-drop scheduling · Dual clash prevention (Faculty + Room) · Immediate publish to Student Portal and Faculty view</div>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-neu btn-sm" onClick={() => openModal('room-mgmt-modal')}><i className="lni lni-apartment"></i> Manage Rooms</button>
          <button className="btn btn-neu btn-sm" onClick={() => openModal('tt-import-modal')}><i className="lni lni-download"></i> Import Excel</button>
          <button className="btn btn-primary" onClick={() => showToast('Publishing timetable...', 'success')}><i className="lni lni-volume-high"></i> Publish — Students & Faculty</button>
        </div>
      </div>

      {/* Clash Detection Rules Banner */}
      <div className="g2" style={{ marginBottom: '14px' }}>
        <div className="danger-box" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
          <span style={{ fontWeight: 700, fontSize: '12.5px' }}><i className="lni lni-volume-high"></i> Dual Clash Prevention (Hard Block)</span>
          <span style={{ fontSize: '12px' }}>The system checks <strong>both</strong> conditions simultaneously on every slot entry:</span>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '2px' }}>
            <span style={{ background: 'var(--red-bg)', border: '1px solid var(--red-bd)', borderRadius: '4px', padding: '3px 8px', fontSize: '11.5px', fontWeight: 600 }}><i className="lni lni-user"></i> Faculty Clash — teacher already allocated elsewhere at same time</span>
            <span style={{ background: 'var(--red-bg)', border: '1px solid var(--red-bd)', borderRadius: '4px', padding: '3px 8px', fontSize: '11.5px', fontWeight: 600 }}><i className="lni lni-apartment"></i> Room Clash — room already occupied by any class at exact same slot</span>
          </div>
          <span style={{ fontSize: '11.5px', marginTop: '2px' }}>If either clash is detected → <strong>entry is blocked with an error message</strong>. No override permitted.</span>
        </div>
        <div className="info-box" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
          <span style={{ fontWeight: 700, fontSize: '12.5px' }}><i className="lni lni-volume-high"></i> Publish Rules</span>
          <span style={{ fontSize: '12px' }}>Once published, the schedule is <strong>immediately visible</strong> on both the Student Portal and the Lecturer's view — no delay.</span>
          <span style={{ fontSize: '12px', marginTop: '2px' }}>Subjects with a <strong>Repetition Tag</strong> (set in Course Master) allow multiple batches to be combined into a single slot — system provides a combine option when a tag match is detected.</span>
        </div>
      </div>

      {/* Batch Selector + View Toggle */}
      <div className="card" style={{ marginBottom: '14px', padding: '16px' }}>
        <div className="g4">
          <div className="fg"><div className="lbl">Batch <span className="req">*</span></div>
            <select className="ctrl" id="tt-batch" onChange={() => showToast('Rendering timetable...', 'info')}>
              <option value="BSC-IT-S1-D">BSC-IT-S26-DA · BSc. IT Sem 1 Day A</option>
              <option value="BBA-S3-D">BBA-S26-DA · BBA Sem 3 Day A</option>
              <option value="MBA-S1-E">MBA-S26-EA · MBA Sem 1 Evening A</option>
              <option value="BENG-CIV-S2-D">BEng-CIV-S26-DA · Civil Sem 2 Day A</option>
            </select>
          </div>
          <div className="fg"><div className="lbl">Intake</div>
            <select className="ctrl"><option>Spring 2026 (20261)</option></select>
          </div>
          <div className="fg"><div className="lbl">Room Filter</div>
            <select className="ctrl" id="tt-room-filter" onChange={() => showToast('Filtering rooms...', 'info')}>
              <option value="">All Rooms</option>
              <option value="LR-01">LR-01 (cap. 60)</option>
              <option value="LR-02">LR-02 (cap. 60)</option>
              <option value="Lab-A">Lab-A Linux (cap. 40)</option>
              <option value="Lab-B">Lab-B General (cap. 40)</option>
            </select>
          </div>
          <div className="fg"><div className="lbl">View</div>
            <div className="tgl-group">
              <button className="tgl-btn tgl-active" onClick={() => showToast('Week view', 'info')}><i className="lni lni-calendar"></i> Week</button>
              <button className="tgl-btn" onClick={() => showToast('List view', 'info')}><i className="lni lni-clipboard"></i> List</button>
            </div>
          </div>
        </div>
      </div>

      {/* Conflict Warning */}
      <div id="tt-conflict-banner" className="danger-box" style={{ marginBottom: '14px', display: 'none' }}>
        <i className="lni lni-volume-high"></i> <span id="tt-conflict-msg">Conflict detected — entry blocked.</span>
      </div>

      {/* Drag & Drop Visual Grid */}
      <div className="card" id="tt-week-view">
        <div className="card-hdr">
          <div className="card-title"><span className="ctitle-icon"><i className="lni lni-calendar"></i></span> Weekly Schedule — <span id="tt-batch-label">BSC-IT-S26-DA</span></div>
          <div className="flex gap-2">
            <span className="badge badge-green" id="tt-status-badge"><i className="lni lni-checkmark"></i> No Conflicts</span>
            <button className="btn btn-neu btn-sm" onClick={() => openModal('add-slot-modal')}><i className="lni lni-plus"></i> Add Slot</button>
          </div>
        </div>
        <div className="info-box" style={{ marginBottom: '10px', padding: '8px 12px' }}>
          <i className="lni lni-pointer"></i> <span style={{ fontSize: '12px' }}><strong>Drag-and-drop:</strong> Drag any slot to a new day/time cell. The system will immediately check for faculty and room clashes before confirming the move. Click any empty cell to add a new slot.</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <div className="tt-grid" id="tt-grid-container"></div>
        </div>
        <div style={{ marginTop: '14px', display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', color: 'var(--g500)', fontWeight: 600 }}>Legend:</span>
          <span style={{ background: 'var(--b50)', border: '1px solid var(--b200)', borderRadius: '4px', padding: '3px 8px', fontSize: '11px' }}>Theory</span>
          <span style={{ background: 'var(--green-bg)', border: '1px solid var(--green-bd)', borderRadius: '4px', padding: '3px 8px', fontSize: '11px' }}>Practical</span>
          <span style={{ background: 'var(--amber-bg)', border: '1px solid var(--amber-bd)', borderRadius: '4px', padding: '3px 8px', fontSize: '11px' }}>Tutorial</span>
          <span style={{ background: 'var(--purple-bg)', border: '1px solid var(--purple-bd)', borderRadius: '4px', padding: '3px 8px', fontSize: '11px' }}>CBT/Lab</span>
          <span style={{ background: 'var(--cyan-bg)', border: '1px solid #bae6fd', borderRadius: '4px', padding: '3px 8px', fontSize: '11px' }}><i className="lni lni-reload"></i> Combined Batch</span>
          <span style={{ background: 'var(--red-bg)', border: '1px solid var(--red-bd)', borderRadius: '4px', padding: '3px 8px', fontSize: '11px' }}><i className="lni lni-checkmark-circle"></i> Conflict (blocked)</span>
        </div>
      </div>

      {/* List View */}
      <div className="card" id="tt-list-view" style={{ display: 'none' }}>
        <div className="card-hdr"><div className="card-title"><span className="ctitle-icon"><i className="lni lni-clipboard"></i></span> List View — Schedule</div></div>
        <div className="tbl-wrap">
          <table id="tt-list-table">
            <thead><tr><th>Day</th><th>Time</th><th>Course Unit</th><th>Type</th><th>Room</th><th>Capacity</th><th>Faculty</th><th>Combined Batch?</th><th>Action</th></tr></thead>
            <tbody id="tt-list-body"></tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export function CourseworkPage({ nav, openModal, showToast }: PageProps) {
  return (
    <div className="page">
      <div className="pg-hdr">
        <div><div className="pg-title">Coursework (CW) Management</div><div className="pg-sub">Term-based internal assessments · Faculty upload questions · 50% fee clearance required for submission</div></div>
        <button className="btn btn-primary" onClick={() => openModal('new-cw-modal')}><i className="lni lni-plus"></i> Schedule Coursework</button>
      </div>

      <div className="g2" style={{ marginBottom: '18px' }}>
        <div className="info-box"><i className="lni lni-ruler-alt"></i> <span><strong>Proration:</strong> Coursework is marked out of <strong>25</strong> and prorated to <strong>15</strong> marks in final result. Students must have minimum <strong>50% fee clearance</strong> (on original tuition fee before discounts) to submit.</span></div>
        <div className="warn-box"><i className="lni lni-warning"></i> <span>Students can <strong>view</strong> coursework questions without fee clearance. Fee clearance only blocks <strong>submission</strong>.</span></div>
      </div>

      {/* Pipeline */}
      <div className="pipeline">
        <div className="pip-step active"><div className="pip-circle">1</div><div className="pip-info"><div className="pip-label">Term 1 CW</div><div className="pip-desc">In progress</div></div></div>
        <div className="pip-line"></div>
        <div className="pip-step"><div className="pip-circle">2</div><div className="pip-info"><div className="pip-label">Term 1 CBT</div><div className="pip-desc">Upcoming</div></div></div>
        <div className="pip-line"></div>
        <div className="pip-step"><div className="pip-circle">3</div><div className="pip-info"><div className="pip-label">Term 2 CW</div><div className="pip-desc">Upcoming</div></div></div>
        <div className="pip-line"></div>
        <div className="pip-step"><div className="pip-circle">4</div><div className="pip-info"><div className="pip-label">Term 2 CBT</div><div className="pip-desc">Upcoming</div></div></div>
        <div className="pip-line"></div>
        <div className="pip-step"><div className="pip-circle">5</div><div className="pip-info"><div className="pip-label">Uni. Exam</div><div className="pip-desc">End of Sem</div></div></div>
      </div>

      <div className="card">
        <div className="card-hdr">
          <div className="card-title"><span className="ctitle-icon"><i className="lni lni-pencil-alt"></i></span> Active Coursework — Term 1 · Spring 2026</div>
          <div className="flex gap-2">
            <select className="ctrl" style={{ width: 'auto', fontSize: '12px' }}><option>All Batches</option><option>BSC-IT-S1-D</option><option>BBA-S3-D</option><option>MBA-S1-E</option></select>
          </div>
        </div>
        <div className="tbl-wrap">
          <table>
            <thead><tr><th>Course Unit</th><th>Batch</th><th>Faculty</th><th>Open Date</th><th>Due Date</th><th>Out Of</th><th>Submitted</th><th>Cleared (≥50%)</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              <tr><td><strong>IT101 – Intro to Programming</strong></td><td>BSC-IT-S1-D</td><td>Dr. Ssekibuule</td><td>01 Mar 2026</td><td>15 Mar 2026</td><td>25</td><td><span className="text-green font-bold">38/42</span></td><td><span className="text-green font-bold">42</span></td><td><span className="badge badge-green"><i className="lni lni-checkmark"></i> Closed</span></td><td><button className="btn btn-neu btn-sm">View Marks</button></td></tr>
              <tr><td><strong>IT102 – Computer Org.</strong></td><td>BSC-IT-S1-D</td><td>Ms. Namutebi</td><td>03 Mar 2026</td><td>17 Mar 2026</td><td>25</td><td><span className="text-amber font-bold">28/42</span></td><td><span className="text-green font-bold">38</span></td><td><span className="badge badge-amber">Open</span></td><td><button className="btn btn-neu btn-sm">Manage</button></td></tr>
              <tr className="flagged"><td><strong>MBA101 – Managerial Econ.</strong></td><td>MBA-S1-E</td><td>Prof. Mukasa</td><td>—</td><td>—</td><td>25</td><td>0/24</td><td><span className="text-green font-bold">24</span></td><td><span className="badge badge-grey">Not Scheduled</span></td><td><button className="btn btn-primary btn-sm" onClick={() => openModal('new-cw-modal')}>Schedule →</button></td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export function ClassTestPage({ nav, openModal, showToast }: PageProps) {
  return (
    <div className="page">
      <div className="pg-hdr">
        <div><div className="pg-title">Class Test (CBT)</div><div className="pg-sub">Computer-based timed assessments · 60-minute server-side timer · 50% fee clearance for submission</div></div>
        <button className="btn btn-primary" onClick={() => openModal('new-cbt-modal')}><i className="lni lni-plus"></i> Schedule Class Test</button>
      </div>

      <div className="g2" style={{ marginBottom: '18px' }}>
        <div className="info-box"><i className="lni lni-ruler-alt"></i> <span><strong>Proration:</strong> CBT is marked out of <strong>50</strong> and prorated to <strong>15</strong> marks. Each test runs for <strong>60 minutes</strong> with server-side timing — students cannot extend or pause.</span></div>
        <div className="warn-box"><i className="lni lni-warning"></i> <span>Minimum <strong>50% fee clearance</strong> required for submission (calculated on <strong>original tuition fee</strong>, not discounted amount). View access permitted without clearance.</span></div>
      </div>

      <div className="card">
        <div className="card-hdr">
          <div className="card-title"><span className="ctitle-icon"><i className="lni lni-display"></i></span> Scheduled Class Tests — Term 1</div>
          <select className="ctrl" style={{ width: 'auto', fontSize: '12px' }}><option>All Batches</option><option>BSC-IT-S1-D</option><option>MBA-S1-E</option></select>
        </div>
        <div className="tbl-wrap">
          <table>
            <thead><tr><th>Course Unit</th><th>Batch</th><th>Date</th><th>Time</th><th>Duration</th><th>Out Of</th><th>Attempted</th><th>Cleared (≥50%)</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              <tr><td><strong>IT101 – Intro to Programming</strong></td><td>BSC-IT-S1-D</td><td>20 Mar 2026</td><td>10:00 AM</td><td>60 min</td><td>50</td><td><span className="text-green font-bold">40/42</span></td><td>42</td><td><span className="badge badge-green"><i className="lni lni-checkmark"></i> Completed</span></td><td><button className="btn btn-neu btn-sm">View Marks</button></td></tr>
              <tr><td><strong>IT102 – Computer Org.</strong></td><td>BSC-IT-S1-D</td><td>22 Mar 2026</td><td>02:00 PM</td><td>60 min</td><td>50</td><td>—</td><td>38</td><td><span className="badge badge-blue">Upcoming</span></td><td><button className="btn btn-neu btn-sm">Manage</button></td></tr>
              <tr><td><strong>MBA101 – Managerial Econ.</strong></td><td>MBA-S1-E</td><td>—</td><td>—</td><td>60 min</td><td>50</td><td>—</td><td>24</td><td><span className="badge badge-grey">Not Scheduled</span></td><td><button className="btn btn-primary btn-sm" onClick={() => openModal('new-cbt-modal')}>Schedule →</button></td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
