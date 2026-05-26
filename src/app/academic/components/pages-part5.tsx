'use client'

interface PageProps {
  nav: (id: string) => void;
  openModal: (id: string) => void;
  closeModal: (id: string) => void;
  showToast: (msg: string, type?: string) => void;
  openModals: Set<string>;
  showFcResult?: boolean;
  setShowFcResult?: (v: boolean) => void;
}

export function BatchManagementPage({ nav, openModal, showToast }: PageProps) {
  return (
    <div className="page active">
      <div className="pg-hdr">
        <div><div className="pg-title">Batch Management</div><div className="pg-sub">Create batches per intake · Auto-generate batch codes · Sub-batch large cohorts · Assign Batch In-Charge</div></div>
        <button className="btn btn-primary" onClick={() => openModal('new-batch-modal')}><i className="lni lni-plus"></i> Create Batch</button>
      </div>

      <div className="info-box mb-[14px]">
        <i className="lni lni-information"></i> <span>Batch Code is <strong>system-generated</strong> as: <span className="font-mono bg-[var(--b100)] py-[2px] px-[6px] rounded">Course Code + Session/Year + Batch Type + Sub-Batch</span> e.g. <strong>BSc-VFX-S26-DA</strong>. Large cohorts (100+ students) are split into <strong>sub-batches (DA, DB)</strong> of ~50 for separate timetabling and faculty allocation.</span>
      </div>
      <div className="warn-box mb-[18px]">
        <i className="lni lni-warning"></i> <span>Admissions occur <strong>every semester (twice a year)</strong>. A new batch must be created for each intake. <strong>Specialization</strong> is assigned to the individual student — not the batch. <strong>Batch In-Charges</strong> can view batch reports but have no direct relation to programme courses.</span>
      </div>

      {/* Stats */}
      <div className="g4 mb-[18px]">
        <div className="stat-card"><div className="stat-lbl">Active Batches</div><div className="stat-num">18</div><div className="stat-sub up">Spring 2026</div></div>
        <div className="stat-card [--b700:var(--amber)] [--b400:#fbbf24]"><div className="stat-lbl">Pending Sub-batch</div><div className="stat-num text-clr-amber">3</div><div className="stat-sub warn">Cohorts &gt; 50 students</div></div>
        <div className="stat-card [--b700:var(--green)] [--b400:#34d399]"><div className="stat-lbl">Total Students</div><div className="stat-num text-clr-green">1,284</div><div className="stat-sub up">Across all batches</div></div>
        <div className="stat-card [--b700:var(--purple)] [--b400:#a78bfa]"><div className="stat-lbl">Batch In-Charges</div><div className="stat-num text-clr-purple">18</div><div className="stat-sub up">Assigned</div></div>
      </div>

      <div className="card">
        <div className="card-hdr">
          <div className="card-title"><span className="ctitle-icon"><i className="lni lni-users"></i></span> Active Batches — Spring 2026 (20261)</div>
          <div className="flex gap-2">
            <select className="ctrl w-auto text-xs"><option>All Programmes</option><option>BSc. IT</option><option>BBA</option><option>MBA</option><option>BEng. Civil</option></select>
            <select className="ctrl w-auto text-xs"><option>All Types</option><option>Day</option><option>Evening</option><option>Weekend</option><option>Distance/Online</option></select>
            <button className="btn btn-neu btn-sm"><i className="lni lni-upload"></i> Export</button>
          </div>
        </div>
        <div className="tbl-wrap">
          <table>
            <thead><tr><th>Batch Code</th><th>Programme (Version)</th><th>Semester</th><th>Type</th><th>Sub-Batch</th><th>Students</th><th>Batch In-Charge</th><th>Timetable</th><th>Action</th></tr></thead>
            <tbody>
              <tr>
                <td><span className="font-bold text-blue font-mono">BSC-IT-S26-DA</span></td>
                <td>BSc. IT 2026 <span className="pill pill-blue">BCA-2026</span></td>
                <td>Sem 1</td>
                <td><span className="badge badge-blue">Day</span></td>
                <td><span className="badge badge-grey">DA (sub-batch A)</span></td>
                <td>42</td>
                <td>Dr. Ssekibuule Ronald</td>
                <td><span className="badge badge-green"><i className="lni lni-checkmark"></i> Set</span></td>
                <td><button className="btn btn-neu btn-sm" onClick={() => openModal('new-batch-modal')}><i className="lni lni-pencil"></i> Edit</button></td>
              </tr>
              <tr>
                <td><span className="font-bold text-blue font-mono">BSC-IT-S26-DB</span></td>
                <td>BSc. IT 2026 <span className="pill pill-blue">BCA-2026</span></td>
                <td>Sem 1</td>
                <td><span className="badge badge-blue">Day</span></td>
                <td><span className="badge badge-blue">DB (sub-batch B)</span></td>
                <td>38</td>
                <td>Ms. Namutebi Joyce</td>
                <td><span className="badge badge-green"><i className="lni lni-checkmark"></i> Set</span></td>
                <td><button className="btn btn-neu btn-sm" onClick={() => openModal('new-batch-modal')}><i className="lni lni-pencil"></i> Edit</button></td>
              </tr>
              <tr>
                <td><span className="font-bold text-blue font-mono">BBA-S26-DA</span></td>
                <td>BBA 2021 <span className="pill pill-blue">BBA-2021</span></td>
                <td>Sem 3</td>
                <td><span className="badge badge-blue">Day</span></td>
                <td><span className="badge badge-grey">DA</span></td>
                <td>38</td>
                <td>Prof. Mukasa Charles</td>
                <td><span className="badge badge-amber">Draft</span></td>
                <td><button className="btn btn-neu btn-sm" onClick={() => openModal('new-batch-modal')}><i className="lni lni-pencil"></i> Edit</button></td>
              </tr>
              <tr>
                <td><span className="font-bold text-blue font-mono">MBA-S26-EA</span></td>
                <td>MBA 2024 <span className="pill pill-blue">MBA-2024</span></td>
                <td>Sem 1</td>
                <td><span className="badge badge-purple">Evening</span></td>
                <td><span className="badge badge-grey">EA</span></td>
                <td>24</td>
                <td>Dr. Kato Andrew</td>
                <td><span className="badge badge-green"><i className="lni lni-checkmark"></i> Set</span></td>
                <td><button className="btn btn-neu btn-sm" onClick={() => openModal('new-batch-modal')}><i className="lni lni-pencil"></i> Edit</button></td>
              </tr>
              <tr className="flagged">
                <td><span className="font-bold font-mono text-clr-amber">BSC-VFX-S26-??</span></td>
                <td>BSc. VFX 2026 <span className="pill pill-blue">VFX-2026</span></td>
                <td>Sem 1</td>
                <td><span className="badge badge-blue">Day</span></td>
                <td><span className="badge badge-amber"><i className="lni lni-warning"></i> 102 students — needs sub-batching</span></td>
                <td>102</td>
                <td>—</td>
                <td><span className="badge badge-red">Not Set</span></td>
                <td><button className="btn btn-amber btn-sm" onClick={() => openModal('new-batch-modal')}>Split → Sub-batches</button></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Batch Code Generator Preview */}
      <div className="card">
        <div className="card-hdr">
          <div className="card-title"><span className="ctitle-icon"><i className="lni lni-cog"></i></span> Batch Code Generator</div>
          <span className="badge badge-blue">Auto-generated</span>
        </div>
        <div className="g4">
          <div className="fg">
            <div className="lbl">Course Code</div>
            <input className="ctrl" type="text" id="bcg-code" placeholder="e.g. BSC-IT" />
          </div>
          <div className="fg">
            <div className="lbl">Session / Year</div>
            <select className="ctrl" id="bcg-session">
              <option value="S26">S26 (Spring 2026)</option>
              <option value="F26">F26 (Fall 2026)</option>
              <option value="S27">S27 (Spring 2027)</option>
            </select>
          </div>
          <div className="fg">
            <div className="lbl">Batch Type</div>
            <select className="ctrl" id="bcg-type">
              <option value="D">D — Day</option>
              <option value="E">E — Evening</option>
              <option value="W">W — Weekend</option>
              <option value="O">O — Distance/Online</option>
            </select>
          </div>
          <div className="fg">
            <div className="lbl">Sub-batch</div>
            <select className="ctrl" id="bcg-sub">
              <option value="A">A (first sub-batch)</option>
              <option value="B">B (second sub-batch)</option>
              <option value="C">C (third sub-batch)</option>
            </select>
          </div>
        </div>
        <div className="mt-[14px] p-[14px] bg-b50 border-[1.5px] border-[var(--b200)] rounded-[var(--rsm)] flex items-center gap-4">
          <span className="text-[11px] font-bold text-g500 uppercase">Generated Batch Code:</span>
          <span id="bcg-result" className="font-mono text-[18px] font-extrabold text-b800">BSC-IT-S26-DA</span>
        </div>
      </div>
    </div>
  )
}

export function FeeStructurePage({ nav, openModal, showToast }: PageProps) {
  return (
    <div className="page active">
      <div className="pg-hdr">
        <div><div className="pg-title">Programme Fee Structure</div><div className="pg-sub">Define fee items per semester · Custom titles · Set priority and base currency · Auto-settlement by priority</div></div>
        <div className="flex gap-2">
          <button className="btn btn-neu" onClick={() => showToast('Fee structure duplicated for next intake.', 'success')}><i className="lni lni-files"></i> Clone Last Year</button>
          <button className="btn btn-primary" onClick={() => openModal('new-fee-structure-modal')}><i className="lni lni-plus"></i> New Fee Structure</button>
        </div>
      </div>

      {/* Programme / Currency Selector */}
      <div className="fee-prog-selector">
        <div className="fg m-0">
          <div className="lbl">Programme</div>
          <select className="ctrl" id="fs-prog-select">
            <option value="bsc-it-local">BSc. IT 2026 — Local (UGX)</option>
            <option value="bsc-it-intl">BSc. IT 2026 — International (USD)</option>
            <option value="mba-intl">MBA 2024 — International (USD)</option>
          </select>
        </div>
        <div className="fg m-0">
          <div className="lbl">Student Type</div>
          <input className="ctrl bg-[var(--g100)] font-semibold" type="text" defaultValue="Local" readOnly />
        </div>
        <div className="fg m-0">
          <div className="lbl">Base Currency</div>
          <input className="ctrl bg-[var(--g100)] font-semibold" type="text" defaultValue="UGX (Ugandan Shilling)" readOnly />
        </div>
        <button className="btn btn-neu" onClick={() => openModal('new-fee-structure-modal')}><i className="lni lni-cog"></i> Settings</button>
      </div>

      {/* Quick Summary */}
      <div className="fee-prog-summary">
        <div className="fee-prog-chip"><div className="fee-prog-chip-lbl">Semesters</div><div className="fee-prog-chip-val">6</div></div>
        <div className="fee-prog-chip"><div className="fee-prog-chip-lbl">Fee Items</div><div className="fee-prog-chip-val">22</div></div>
        <div className="fee-prog-chip"><div className="fee-prog-chip-lbl">Avg / Semester</div><div className="fee-prog-chip-val">UGX 1.08M</div></div>
        <div className="fee-prog-chip grand"><div className="fee-prog-chip-lbl">Programme Total</div><div className="fee-prog-chip-val">UGX 6,500,000</div></div>
      </div>

      <div className="g2 mb-[18px]">
        <div className="info-box"><i className="lni lni-dollar"></i> <span>Within each semester, fee items are <strong>auto-settled by priority</strong> — P1 first, then P2, etc. Local-currency payments are auto-converted to the base currency.</span></div>
        <div className="warn-box"><i className="lni lni-warning"></i> <span><strong>Sponsored students</strong> bypass payment checks for session movement. Sponsorship is separate from scholarships (discounts on tuition).</span></div>
      </div>

      {/* Semester 1 */}
      <div className="sem-fee-card">
        <div className="sem-fee-hdr">
          <div className="sem-fee-hdr-left">
            <span className="sem-fee-badge">S 1</span>
            <div>
              <div className="sem-fee-title">Semester 1 — Year 1</div>
              <div className="sem-fee-sub">5 fee items · Includes one-time admission</div>
            </div>
          </div>
          <div className="sem-fee-hdr-right">
            <span className="sem-fee-total-pill">UGX 1,250,000</span>
            <button className="btn btn-neu btn-sm" onClick={() => openModal('new-fee-item-modal')}><i className="lni lni-plus"></i> Add Fee Item</button>
          </div>
        </div>
        <div className="sem-fee-body">
          <div className="sem-fee-items">
            <div className="sem-fee-row">
              <span className="sem-fee-pri">P1</span>
              <div><div className="sem-fee-name">Admission Fee</div><div className="sem-fee-name-meta">One-time · Cleared first</div></div>
              <span className="sem-fee-amt">UGX 150,000</span>
              <div className="sem-fee-act">
                <button className="btn btn-neu btn-sm" onClick={() => openModal('new-fee-item-modal')}><i className="lni lni-pencil"></i></button>
                <button className="btn btn-neu btn-sm"><i className="lni lni-trash-can"></i></button>
              </div>
            </div>
            <div className="sem-fee-row">
              <span className="sem-fee-pri">P2</span>
              <div><div className="sem-fee-name">Semester Entry Fee</div><div className="sem-fee-name-meta">Required before registration</div></div>
              <span className="sem-fee-amt">UGX 200,000</span>
              <div className="sem-fee-act">
                <button className="btn btn-neu btn-sm" onClick={() => openModal('new-fee-item-modal')}><i className="lni lni-pencil"></i></button>
                <button className="btn btn-neu btn-sm"><i className="lni lni-trash-can"></i></button>
              </div>
            </div>
            <div className="sem-fee-row">
              <span className="sem-fee-pri">P3</span>
              <div><div className="sem-fee-name">Tuition Fee</div><div className="sem-fee-name-meta">50% needed for assessment · 100% for progression</div></div>
              <span className="sem-fee-amt">UGX 750,000</span>
              <div className="sem-fee-act">
                <button className="btn btn-neu btn-sm" onClick={() => openModal('new-fee-item-modal')}><i className="lni lni-pencil"></i></button>
                <button className="btn btn-neu btn-sm"><i className="lni lni-trash-can"></i></button>
              </div>
            </div>
            <div className="sem-fee-row">
              <span className="sem-fee-pri">P4</span>
              <div><div className="sem-fee-name">Lab Fee</div><div className="sem-fee-name-meta">Programming + Systems lab access</div></div>
              <span className="sem-fee-amt">UGX 100,000</span>
              <div className="sem-fee-act">
                <button className="btn btn-neu btn-sm" onClick={() => openModal('new-fee-item-modal')}><i className="lni lni-pencil"></i></button>
                <button className="btn btn-neu btn-sm"><i className="lni lni-trash-can"></i></button>
              </div>
            </div>
            <div className="sem-fee-row">
              <span className="sem-fee-pri">P5</span>
              <div><div className="sem-fee-name">Library &amp; Resources Fee</div><div className="sem-fee-name-meta">e-Library + physical library</div></div>
              <span className="sem-fee-amt">UGX 50,000</span>
              <div className="sem-fee-act">
                <button className="btn btn-neu btn-sm" onClick={() => openModal('new-fee-item-modal')}><i className="lni lni-pencil"></i></button>
                <button className="btn btn-neu btn-sm"><i className="lni lni-trash-can"></i></button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Semester 2 */}
      <div className="sem-fee-card">
        <div className="sem-fee-hdr">
          <div className="sem-fee-hdr-left">
            <span className="sem-fee-badge">S 2</span>
            <div>
              <div className="sem-fee-title">Semester 2 — Year 1</div>
              <div className="sem-fee-sub">4 fee items</div>
            </div>
          </div>
          <div className="sem-fee-hdr-right">
            <span className="sem-fee-total-pill">UGX 1,100,000</span>
            <button className="btn btn-neu btn-sm" onClick={() => openModal('new-fee-item-modal')}><i className="lni lni-plus"></i> Add Fee Item</button>
          </div>
        </div>
        <div className="sem-fee-body">
          <div className="sem-fee-items">
            <div className="sem-fee-row">
              <span className="sem-fee-pri">P1</span>
              <div><div className="sem-fee-name">Semester Entry Fee</div><div className="sem-fee-name-meta">Required before registration</div></div>
              <span className="sem-fee-amt">UGX 200,000</span>
              <div className="sem-fee-act">
                <button className="btn btn-neu btn-sm" onClick={() => openModal('new-fee-item-modal')}><i className="lni lni-pencil"></i></button>
                <button className="btn btn-neu btn-sm"><i className="lni lni-trash-can"></i></button>
              </div>
            </div>
            <div className="sem-fee-row">
              <span className="sem-fee-pri">P2</span>
              <div><div className="sem-fee-name">Tuition Fee</div><div className="sem-fee-name-meta">50% needed for assessment</div></div>
              <span className="sem-fee-amt">UGX 750,000</span>
              <div className="sem-fee-act">
                <button className="btn btn-neu btn-sm" onClick={() => openModal('new-fee-item-modal')}><i className="lni lni-pencil"></i></button>
                <button className="btn btn-neu btn-sm"><i className="lni lni-trash-can"></i></button>
              </div>
            </div>
            <div className="sem-fee-row">
              <span className="sem-fee-pri">P3</span>
              <div><div className="sem-fee-name">Lab Fee</div><div className="sem-fee-name-meta">Programming lab access</div></div>
              <span className="sem-fee-amt">UGX 100,000</span>
              <div className="sem-fee-act">
                <button className="btn btn-neu btn-sm" onClick={() => openModal('new-fee-item-modal')}><i className="lni lni-pencil"></i></button>
                <button className="btn btn-neu btn-sm"><i className="lni lni-trash-can"></i></button>
              </div>
            </div>
            <div className="sem-fee-row">
              <span className="sem-fee-pri">P4</span>
              <div><div className="sem-fee-name">Library &amp; Resources Fee</div><div className="sem-fee-name-meta">e-Library + physical library</div></div>
              <span className="sem-fee-amt">UGX 50,000</span>
              <div className="sem-fee-act">
                <button className="btn btn-neu btn-sm" onClick={() => openModal('new-fee-item-modal')}><i className="lni lni-pencil"></i></button>
                <button className="btn btn-neu btn-sm"><i className="lni lni-trash-can"></i></button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Semester 3 */}
      <div className="sem-fee-card">
        <div className="sem-fee-hdr">
          <div className="sem-fee-hdr-left">
            <span className="sem-fee-badge">S 3</span>
            <div>
              <div className="sem-fee-title">Semester 3 — Year 2</div>
              <div className="sem-fee-sub">4 fee items · Industrial Training applicable</div>
            </div>
          </div>
          <div className="sem-fee-hdr-right">
            <span className="sem-fee-total-pill">UGX 1,150,000</span>
            <button className="btn btn-neu btn-sm" onClick={() => openModal('new-fee-item-modal')}><i className="lni lni-plus"></i> Add Fee Item</button>
          </div>
        </div>
        <div className="sem-fee-body">
          <div className="sem-fee-items">
            <div className="sem-fee-row">
              <span className="sem-fee-pri">P1</span>
              <div><div className="sem-fee-name">Semester Entry Fee</div><div className="sem-fee-name-meta">Required before registration</div></div>
              <span className="sem-fee-amt">UGX 200,000</span>
              <div className="sem-fee-act">
                <button className="btn btn-neu btn-sm" onClick={() => openModal('new-fee-item-modal')}><i className="lni lni-pencil"></i></button>
                <button className="btn btn-neu btn-sm"><i className="lni lni-trash-can"></i></button>
              </div>
            </div>
            <div className="sem-fee-row">
              <span className="sem-fee-pri">P2</span>
              <div><div className="sem-fee-name">Tuition Fee</div><div className="sem-fee-name-meta">50% needed for assessment</div></div>
              <span className="sem-fee-amt">UGX 800,000</span>
              <div className="sem-fee-act">
                <button className="btn btn-neu btn-sm" onClick={() => openModal('new-fee-item-modal')}><i className="lni lni-pencil"></i></button>
                <button className="btn btn-neu btn-sm"><i className="lni lni-trash-can"></i></button>
              </div>
            </div>
            <div className="sem-fee-row">
              <span className="sem-fee-pri">P3</span>
              <div><div className="sem-fee-name">Industrial Training Fee</div><div className="sem-fee-name-meta">External placement coordination</div></div>
              <span className="sem-fee-amt">UGX 100,000</span>
              <div className="sem-fee-act">
                <button className="btn btn-neu btn-sm" onClick={() => openModal('new-fee-item-modal')}><i className="lni lni-pencil"></i></button>
                <button className="btn btn-neu btn-sm"><i className="lni lni-trash-can"></i></button>
              </div>
            </div>
            <div className="sem-fee-row">
              <span className="sem-fee-pri">P4</span>
              <div><div className="sem-fee-name">Library &amp; Resources Fee</div><div className="sem-fee-name-meta">e-Library + physical library</div></div>
              <span className="sem-fee-amt">UGX 50,000</span>
              <div className="sem-fee-act">
                <button className="btn btn-neu btn-sm" onClick={() => openModal('new-fee-item-modal')}><i className="lni lni-pencil"></i></button>
                <button className="btn btn-neu btn-sm"><i className="lni lni-trash-can"></i></button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Semester button */}
      <div className="text-center mt-[6px]">
        <button className="sem-fee-add" onClick={() => showToast('Use Settings → Add Semester to define a new semester.', 'info')}>
          <i className="lni lni-plus"></i> Add New Semester
        </button>
      </div>
    </div>
  )
}

export function AccessGatePage({ nav, openModal, showToast }: PageProps) {
  return (
    <div className="page active">
      <div className="pg-hdr">
        <div>
          <div className="pg-title">Academic Access Gate</div>
          <div className="pg-sub">Cross-module · Interacts with S3 (Finance) and S10 (Student) · Controls attendance and LMS access based on payment status</div>
        </div>
        <span className="badge badge-purple self-center"><i className="lni lni-link"></i> S2 + S3 + S10</span>
      </div>

      <div className="danger-box mb-[18px]">
        <i className="lni lni-lock"></i> <span><strong>Access Block Rule:</strong> Non-payment of the <em>current semester fee</em> results in an <strong>absolute block</strong> on the student's access to both class attendance and the LMS. This is separate from the 50% assessment submission threshold — full non-payment blocks everything. <strong>Sponsorship status bypasses all payment checks.</strong></span>
      </div>

      <div className="g3 mb-[18px]">
        <div className="p-4 bg-[var(--red-bg)] border-2 border-[var(--red-bd)] rounded-[var(--radius)]">
          <div className="text-[11px] font-bold uppercase text-clr-red mb-2"><i className="lni lni-ban"></i> Fee Not Paid → BLOCKED</div>
          <div className="text-[12.5px] text-[#7f1d1d] flex flex-col gap-[5px]">
            <div><i className="lni lni-close"></i> Class Attendance (biometric + manual)</div>
            <div><i className="lni lni-close"></i> LMS Access (materials, submissions)</div>
            <div><i className="lni lni-close"></i> Assessment Submission (CW + CBT)</div>
            <div><i className="lni lni-close"></i> Progression to next semester</div>
          </div>
        </div>
        <div className="p-4 bg-[var(--amber-bg)] border-2 border-[var(--amber-bd)] rounded-[var(--radius)]">
          <div className="text-[11px] font-bold uppercase text-clr-amber mb-2"><i className="lni lni-warning"></i> ≥50% Fee Paid → PARTIAL</div>
          <div className="text-[12.5px] text-[#78350f] flex flex-col gap-[5px]">
            <div><i className="lni lni-checkmark"></i> Class Attendance allowed</div>
            <div><i className="lni lni-checkmark"></i> LMS view access (read-only)</div>
            <div><i className="lni lni-checkmark"></i> Assessment question viewing</div>
            <div><i className="lni lni-close"></i> Assessment submission blocked</div>
          </div>
          <div className="text-[11px] text-clr-amber mt-2 italic">50% threshold on original pre-discount fee</div>
        </div>
        <div className="p-4 bg-[var(--green-bg)] border-2 border-[var(--green-bd)] rounded-[var(--radius)]">
          <div className="text-[11px] font-bold uppercase text-clr-green mb-2"><i className="lni lni-checkmark-circle"></i> Sponsored Student → FULL ACCESS</div>
          <div className="text-[12.5px] text-[#064e3b] flex flex-col gap-[5px]">
            <div><i className="lni lni-checkmark"></i> All payment gates bypassed</div>
            <div><i className="lni lni-checkmark"></i> Assessment submission allowed</div>
            <div><i className="lni lni-checkmark"></i> Session progression bypassed</div>
            <div><i className="lni lni-checkmark"></i> Full LMS access</div>
          </div>
          <div className="text-[11px] text-clr-green mt-2 italic">Sponsorship verified from Finance Module (S3)</div>
        </div>
      </div>

      {/* Auto-Settlement Priority Reference */}
      <div className="card">
        <div className="card-hdr">
          <div className="card-title"><span className="ctitle-icon"><i className="lni lni-dollar"></i></span> Finance Auto-Settlement Priority Reference (S3)</div>
          <span className="badge badge-purple">Read-only — Owned by Finance Module</span>
        </div>
        <div className="info-box mb-[14px]">
          <i className="lni lni-credit-cards"></i> <span>When a student pays a <strong>lump sum in any currency</strong>, the system auto-converts to base currency (USD for international) and settles fee components in strict priority order. Remaining balance applied to next priority only after full clearance of current.</span>
        </div>
        <div className="g3">
          <div className="p-[14px] bg-b50 border-[1.5px] border-[var(--b100)] rounded-[var(--rsm)] text-center">
            <div className="text-[10px] font-bold uppercase text-b700 mb-[6px]">PRIORITY 1</div>
            <div className="text-[15px] font-extrabold text-b800">Admission Fee</div>
            <div className="text-[13px] font-bold text-b700 mt-1 font-mono">$50 / UGX 50,000</div>
            <div className="text-[11px] text-g400 mt-1">One-time at application</div>
          </div>
          <div className="p-[14px] bg-[var(--amber-bg)] border-[1.5px] border-[var(--amber-bd)] rounded-[var(--rsm)] text-center">
            <div className="text-[10px] font-bold uppercase text-clr-amber mb-[6px]">PRIORITY 2</div>
            <div className="text-[15px] font-extrabold text-clr-amber">Registration / Entry Fee</div>
            <div className="text-[13px] font-bold text-clr-amber mt-1 font-mono">$200 initial / Entry fee per sem</div>
            <div className="text-[11px] text-g400 mt-1">Required before registration</div>
          </div>
          <div className="p-[14px] bg-[var(--green-bg)] border-[1.5px] border-[var(--green-bd)] rounded-[var(--rsm)] text-center">
            <div className="text-[10px] font-bold uppercase text-clr-green mb-[6px]">PRIORITY 3</div>
            <div className="text-[15px] font-extrabold text-clr-green">Tuition Fee</div>
            <div className="text-[13px] font-bold text-clr-green mt-1 font-mono">$750 / semester</div>
            <div className="text-[11px] text-g400 mt-1">50% needed for assessment; 100% for progression</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function StudentLookupPage({ nav, openModal, showToast }: PageProps) {
  return (
    <div className="page active">
      <div className="pg-hdr">
        <div><div className="pg-title">Student Lookup</div><div className="pg-sub">Cross-module shared page · Search any student · View academic and financial status</div></div>
        <span className="badge badge-purple self-center"><i className="lni lni-link"></i> Shared Across All Modules</span>
      </div>
      <div className="info-box mb-[18px]">
        <i className="lni lni-link"></i> <span>This is a <strong>cross-module shared page</strong> accessible from Academic, Admission, Finance, and Assessment modules. Full profile management lives in the <strong>Student Microservice (Service 10)</strong>.</span>
      </div>
      <div className="card">
        <div className="card-hdr"><div className="card-title"><span className="ctitle-icon"><i className="lni lni-search-alt"></i></span> Search Student</div></div>
        <div className="g3">
          <div className="fg"><div className="lbl">Search by Name, Student No., or Email</div>
            <div className="inp-wrap"><span className="inp-icon"><i className="lni lni-search-alt"></i></span><input className="ctrl" type="text" placeholder="e.g. ISB/2026/0142 or Nakato Sarah..." id="student-search-input" /></div>
          </div>
          <div className="fg"><div className="lbl">Programme Filter</div>
            <select className="ctrl" id="student-filter-prog">
              <option value="">All Programmes</option>
              <option>BSc. Computer Science</option><option>BSc. Information Technology</option><option>BBA</option><option>MBA Business Admin</option><option>MBA Business Admin (ODL)</option>
              <option>BEng. Civil Engineering</option><option>BCom. Accounting</option><option>Diploma in Nursing</option>
            </select>
          </div>
          <div className="fg"><div className="lbl">Academic Year</div>
            <select className="ctrl" id="student-filter-ay">
              <option value="">All Academic Years</option>
              <option value="2025-2026">2025–2026</option>
              <option value="2024-2025">2024–2025</option>
              <option value="2023-2024">2023–2024</option>
            </select>
          </div>
        </div>
        <div id="student-filter-meta" className="mt-[10px] text-[11.5px] text-g500 font-medium"></div>
      </div>

      {/* Student Table */}
      <div className="card">
        <div className="card-hdr">
          <div className="card-title"><span className="ctitle-icon"><i className="lni lni-users"></i></span> Registered Students — Academic Year 2025–2026</div>
          <span className="badge badge-blue"><i className="lni lni-graduation"></i> <span id="student-row-count">8</span> of 1,247 shown</span>
        </div>
        <div className="tbl-wrap">
          <table id="student-lookup-table">
            <thead><tr>
              <th>Student No.</th><th>Name</th><th>Programme</th><th>Year / Sem</th><th>Intake</th><th>Academic Year</th><th>Fee Status</th><th>Status</th><th className="w-[160px]">Action</th>
            </tr></thead>
            <tbody id="student-lookup-tbody">
              <tr data-prog="BSc. Computer Science" data-ay="2025-2026">
                <td><span className="text-blue font-bold font-mono">ISB/2026/0142</span></td>
                <td><strong>Nakato Sarah Bridget</strong><div className="text-[11px] text-g500">nakato.s@students.isbatuniversity.ac.ug</div></td>
                <td>BSc. Computer Science</td>
                <td>Year 1 · Sem 1</td>
                <td>Spring 2026</td>
                <td><span className="badge badge-blue">2025–2026</span></td>
                <td><span className="badge badge-green">Cleared 100%</span></td>
                <td><span className="badge badge-green"><span className="bdot"></span>Active</span></td>
                <td><div className="flex gap-2">
                  <button className="btn btn-neu btn-sm"><i className="lni lni-eye"></i> View</button>
                  <button className="btn btn-primary btn-sm"><i className="lni lni-pencil"></i> Edit</button>
                </div></td>
              </tr>
              <tr data-prog="MBA Business Admin (ODL)" data-ay="2025-2026">
                <td><span className="text-blue font-bold font-mono">ISB/2026/0141</span></td>
                <td><strong>Okello James Patrick</strong><div className="text-[11px] text-g500">okello.j@students.isbatuniversity.ac.ug</div></td>
                <td>MBA Business Admin (ODL)</td>
                <td>Year 1 · Sem 1</td>
                <td>Spring 2026</td>
                <td><span className="badge badge-blue">2025–2026</span></td>
                <td><span className="badge badge-green">Cleared 100%</span></td>
                <td><span className="badge badge-green"><span className="bdot"></span>Active</span></td>
                <td><div className="flex gap-2">
                  <button className="btn btn-neu btn-sm"><i className="lni lni-eye"></i> View</button>
                  <button className="btn btn-primary btn-sm"><i className="lni lni-pencil"></i> Edit</button>
                </div></td>
              </tr>
              <tr data-prog="Diploma in Nursing" data-ay="2025-2026">
                <td><span className="text-blue font-bold font-mono">ISB/2026/0140</span></td>
                <td><strong>Tumukunde Alice Grace</strong><div className="text-[11px] text-g500">tumukunde.a@students.isbatuniversity.ac.ug</div></td>
                <td>Diploma in Nursing</td>
                <td>Year 1 · Sem 1</td>
                <td>Spring 2026</td>
                <td><span className="badge badge-blue">2025–2026</span></td>
                <td><span className="badge badge-amber">Partial 60%</span></td>
                <td><span className="badge badge-green"><span className="bdot"></span>Active</span></td>
                <td><div className="flex gap-2">
                  <button className="btn btn-neu btn-sm"><i className="lni lni-eye"></i> View</button>
                  <button className="btn btn-primary btn-sm"><i className="lni lni-pencil"></i> Edit</button>
                </div></td>
              </tr>
              <tr data-prog="BCom. Accounting" data-ay="2025-2026">
                <td><span className="text-blue font-bold font-mono">ISB/2026/0138</span></td>
                <td><strong>Nampijja Grace Miriam</strong><div className="text-[11px] text-g500">nampijja.g@students.isbatuniversity.ac.ug</div></td>
                <td>BCom. Accounting</td>
                <td>Year 1 · Sem 1</td>
                <td>Spring 2026</td>
                <td><span className="badge badge-blue">2025–2026</span></td>
                <td><span className="badge badge-green">Cleared 100%</span></td>
                <td><span className="badge badge-green"><span className="bdot"></span>Active</span></td>
                <td><div className="flex gap-2">
                  <button className="btn btn-neu btn-sm"><i className="lni lni-eye"></i> View</button>
                  <button className="btn btn-primary btn-sm"><i className="lni lni-pencil"></i> Edit</button>
                </div></td>
              </tr>
              <tr data-prog="BSc. Information Technology" data-ay="2025-2026">
                <td><span className="text-blue font-bold font-mono">ISB/2025/0089</span></td>
                <td><strong>Mugume Robert</strong><div className="text-[11px] text-g500">mugume.r@students.isbatuniversity.ac.ug</div></td>
                <td>BSc. Information Technology</td>
                <td>Year 1 · Sem 2</td>
                <td>Fall 2025</td>
                <td><span className="badge badge-blue">2025–2026</span></td>
                <td><span className="badge badge-red">Outstanding 35%</span></td>
                <td><span className="badge badge-amber"><span className="bdot"></span>Access Blocked</span></td>
                <td><div className="flex gap-2">
                  <button className="btn btn-neu btn-sm"><i className="lni lni-eye"></i> View</button>
                  <button className="btn btn-primary btn-sm"><i className="lni lni-pencil"></i> Edit</button>
                </div></td>
              </tr>
              <tr data-prog="BEng. Civil Engineering" data-ay="2025-2026">
                <td><span className="text-blue font-bold font-mono">ISB/2025/0072</span></td>
                <td><strong>Asiimwe Grace</strong><div className="text-[11px] text-g500">asiimwe.g@students.isbatuniversity.ac.ug</div></td>
                <td>BEng. Civil Engineering</td>
                <td>Year 1 · Sem 2</td>
                <td>Fall 2025</td>
                <td><span className="badge badge-blue">2025–2026</span></td>
                <td><span className="badge badge-green">Cleared 100%</span></td>
                <td><span className="badge badge-green"><span className="bdot"></span>Active</span></td>
                <td><div className="flex gap-2">
                  <button className="btn btn-neu btn-sm"><i className="lni lni-eye"></i> View</button>
                  <button className="btn btn-primary btn-sm"><i className="lni lni-pencil"></i> Edit</button>
                </div></td>
              </tr>
              <tr data-prog="MBA Business Admin" data-ay="2023-2024">
                <td><span className="text-blue font-bold font-mono">ISB/2024/0044</span></td>
                <td><strong>Waiswa Patrick</strong><div className="text-[11px] text-g500">waiswa.p@students.isbatuniversity.ac.ug</div></td>
                <td>MBA Business Admin</td>
                <td>Year 2 · Sem 3</td>
                <td>Spring 2024</td>
                <td><span className="badge badge-grey">2023–2024</span></td>
                <td><span className="badge badge-amber">Partial 75%</span></td>
                <td><span className="badge badge-green"><span className="bdot"></span>Active</span></td>
                <td><div className="flex gap-2">
                  <button className="btn btn-neu btn-sm"><i className="lni lni-eye"></i> View</button>
                  <button className="btn btn-primary btn-sm"><i className="lni lni-pencil"></i> Edit</button>
                </div></td>
              </tr>
              <tr data-prog="BBA" data-ay="2023-2024">
                <td><span className="text-blue font-bold font-mono">ISB/2024/0028</span></td>
                <td><strong>Akello Diana</strong><div className="text-[11px] text-g500">akello.d@students.isbatuniversity.ac.ug</div></td>
                <td>BBA</td>
                <td>Year 2 · Sem 4</td>
                <td>Spring 2024</td>
                <td><span className="badge badge-grey">2023–2024</span></td>
                <td><span className="badge badge-green">Cleared 100%</span></td>
                <td><span className="badge badge-green"><span className="bdot"></span>Active</span></td>
                <td><div className="flex gap-2">
                  <button className="btn btn-neu btn-sm"><i className="lni lni-eye"></i> View</button>
                  <button className="btn btn-primary btn-sm"><i className="lni lni-pencil"></i> Edit</button>
                </div></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export function FeeClearancePage({ nav, openModal, showToast, showFcResult, setShowFcResult }: PageProps) {
  return (
    <div className="page active">
      <div className="pg-hdr">
        <div><div className="pg-title">Fee Clearance Check</div><div className="pg-sub">Read-only view · Clearance status consumed from Finance Service (Service 3)</div></div>
        <span className="badge badge-purple self-center"><i className="lni lni-link"></i> Shared — Read Only in Academic Module</span>
      </div>
      <div className="info-box mb-[18px]">
        <i className="lni lni-dollar"></i> <span>Fee clearance is <strong>owned and calculated by the Finance Module (Service 3)</strong>. The Academic Module consumes clearance status as a read-only API call to determine CW/CBT submission eligibility. <strong>Minimum 50% clearance</strong> is calculated on the <em>original tuition fee</em> (before discounts).</span>
      </div>
      <div className="card">
        <div className="card-hdr"><div className="card-title"><span className="ctitle-icon"><i className="lni lni-checkmark-circle"></i></span> Clearance Status Lookup</div></div>
        <div className="g2">
          <div className="fg"><div className="lbl">Student Number</div>
            <div className="inp-wrap"><span className="inp-icon"><i className="lni lni-search-alt"></i></span><input className="ctrl pl-[34px]" type="text" placeholder="ISB/2026/..." id="fc-student-no" /></div>
          </div>
          <div className="fg justify-end pt-[18px]">
            <button className="btn btn-primary" onClick={() => setShowFcResult && setShowFcResult(true)}>Check Clearance</button>
          </div>
        </div>
        <div id="fc-result" className={`${showFcResult ? 'block' : 'hidden'} mt-[14px]`}>
          <div className="g3">
            <div className="p-[14px] bg-[var(--green-bg)] border border-[var(--green-bd)] rounded-[var(--rsm)] text-center"><div className="text-[11px] text-clr-green font-bold uppercase">Clearance %</div><div className="text-[26px] font-extrabold text-clr-green">72%</div></div>
            <div className="p-[14px] bg-b50 border border-[var(--b100)] rounded-[var(--rsm)] text-center"><div className="text-[11px] text-b700 font-bold uppercase">CW Submission</div><div className="text-[18px] font-extrabold text-clr-green mt-1"><i className="lni lni-checkmark"></i> Allowed</div></div>
            <div className="p-[14px] bg-b50 border border-[var(--b100)] rounded-[var(--rsm)] text-center"><div className="text-[11px] text-b700 font-bold uppercase">CBT Submission</div><div className="text-[18px] font-extrabold text-clr-green mt-1"><i className="lni lni-checkmark"></i> Allowed</div></div>
          </div>
        </div>
      </div>
      <div className="undefined-box mt-1">
        <div className="text-[22px] mb-2"><i className="lni lni-dollar"></i></div>
        <div className="font-bold text-sm mb-[6px]">Finance Module Integration</div>
        <div className="text-[12.5px] text-g500 max-w-[500px] m-0 mx-auto">This page shows a read-only API response from Finance Service. Full fee management, payment processing, and clearance calculation are in the <strong>Finance Module (Service 3)</strong>.</div>
        <div className="badge badge-purple mt-[10px]"><i className="lni lni-link"></i> Cross-Module — Read Only View from Finance Service</div>
      </div>
    </div>
  )
}
