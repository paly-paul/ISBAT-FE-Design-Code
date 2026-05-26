'use client'

interface PageProps {
  nav: (id: string) => void;
  openModal: (id: string) => void;
  closeModal: (id: string) => void;
  showToast: (msg: string, type?: string) => void;
  openModals: Set<string>;
  odpTab?: string;
  setOdpTab?: (tab: string) => void;
  showPreview?: boolean;
  setShowPreview?: (v: boolean) => void;
}

export function UniversityExamPage({ nav, openModal, showToast }: PageProps) {
  return (
    <div className="page active">
      <div className="pg-hdr">
        <div>
          <div className="pg-title">University Examination</div>
          <div className="pg-sub">End-of-semester offline exams · QP upload → Manual vetting → Exam execution · 100 marks prorated to 70</div>
        </div>
        <button className="btn btn-primary" onClick={() => openModal('new-qp-modal')}><i className="lni lni-files"></i> Upload Question Paper</button>
      </div>

      <div className="info-box" style={{marginBottom: '18px'}}>
        <i className="lni lni-clipboard"></i> <span>Question Papers must be uploaded by faculty and sent for <strong>manual vetting</strong> by the QP Vetting Committee before the offline exam. The committee checks against the approved syllabus. University Exam is marked out of <strong>100</strong> and prorated to <strong>70</strong>.</span>
      </div>

      {/* QP Vetting Pipeline */}
      <div className="pipeline">
        <div className="pip-step done"><div className="pip-circle"><i className="lni lni-checkmark"></i></div><div className="pip-info"><div className="pip-label">QP Uploaded</div><div className="pip-desc">By faculty</div></div></div>
        <div className="pip-line done"></div>
        <div className="pip-step active"><div className="pip-circle">2</div><div className="pip-info"><div className="pip-label">Vetting</div><div className="pip-desc">Committee review</div></div></div>
        <div className="pip-line"></div>
        <div className="pip-step"><div className="pip-circle">3</div><div className="pip-info"><div className="pip-label">QP Approved</div><div className="pip-desc">Cleared for print</div></div></div>
        <div className="pip-line"></div>
        <div className="pip-step"><div className="pip-circle">4</div><div className="pip-info"><div className="pip-label">Exam Day</div><div className="pip-desc">Offline execution</div></div></div>
        <div className="pip-line"></div>
        <div className="pip-step"><div className="pip-circle">5</div><div className="pip-info"><div className="pip-label">Mark Entry</div><div className="pip-desc">Post exam</div></div></div>
      </div>

      <div className="card">
        <div className="card-hdr">
          <div className="card-title"><span className="ctitle-icon"><i className="lni lni-clipboard"></i></span> Question Papers — Spring 2026</div>
        </div>
        <div className="tbl-wrap">
          <table>
            <thead><tr><th>Course Unit</th><th>Programme</th><th>Exam Date</th><th>Uploaded By</th><th>Upload Date</th><th>Vetting Status</th><th>Exam Status</th><th>Action</th></tr></thead>
            <tbody>
              <tr><td><strong>IT101 – Intro to Programming</strong></td><td>BSc. IT</td><td>15 May 2026</td><td>Dr. Ssekibuule</td><td>01 Apr 2026</td><td><span className="badge badge-amber">Under Vetting</span></td><td><span className="badge badge-grey">Pending</span></td><td><button className="btn btn-amber btn-sm">Vet QP →</button></td></tr>
              <tr><td><strong>IT102 – Computer Org.</strong></td><td>BSc. IT</td><td>17 May 2026</td><td>Ms. Namutebi</td><td>02 Apr 2026</td><td><span className="badge badge-green"><i className="lni lni-checkmark"></i> Approved</span></td><td><span className="badge badge-grey">Pending</span></td><td><button className="btn btn-neu btn-sm">View QP</button></td></tr>
              <tr className="flagged"><td><strong>BBA301 – Strategic Mgmt</strong></td><td>BBA</td><td>16 May 2026</td><td>—</td><td>—</td><td><span className="badge badge-red">Not Uploaded</span></td><td><span className="badge badge-red">Blocked</span></td><td><button className="btn btn-primary btn-sm" onClick={() => openModal('new-qp-modal')}>Upload QP</button></td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export function ResultsPage({ nav, openModal, showToast }: PageProps) {
  return (
    <div className="page active">
      <div className="pg-hdr">
        <div>
          <div className="pg-title">Results</div>
          <div className="pg-sub">Mark entry · Verification · Result generation · Publication</div>
        </div>
      </div>
      <div className="undefined-box">
        <div style={{fontSize: '32px', marginBottom: '12px'}}><i className="lni lni-bar-chart"></i></div>
        <div style={{fontFamily: "'Inter',-apple-system,sans-serif", fontSize: '18px', fontWeight: 800, color: 'var(--g900)', marginBottom: '8px'}}>Results &amp; Mark Entry</div>
        <div style={{fontSize: '13px', color: 'var(--g500)', marginBottom: '16px', maxWidth: '480px', marginLeft: 'auto', marginRight: 'auto'}}>This functionality is owned by the <strong>Assessment Module (Service 4)</strong>. Mark Entry → Mark Verification → Result Generation → Result Publication will be covered in the Assessment Module KT session.</div>
        <div className="badge badge-purple" style={{marginBottom: '16px'}}><i className="lni lni-clipboard"></i> Pending KT Session — Assessment Module</div>
        <div style={{fontSize: '12px', color: 'var(--g400)'}}>For academic-side visibility, result publication triggers the next Session Movement cycle.</div>
      </div>
    </div>
  )
}

export function GrievancePage({ nav, openModal, showToast }: PageProps) {
  return (
    <div className="page active">
      <div className="pg-hdr">
        <div>
          <div className="pg-title">Grievance Management</div>
          <div className="pg-sub">Post-result student appeals · Grievance window from Intake Master</div>
        </div>
      </div>
      <div className="warn-box" style={{marginBottom: '18px'}}>
        <i className="lni lni-warning"></i> Grievance window is defined in the <strong>Intake Master</strong>. Current grievance end date: <strong>10 Jun 2026</strong>.
      </div>
      <div className="undefined-box">
        <div style={{fontSize: '32px', marginBottom: '12px'}}><i className="lni lni-volume-high"></i></div>
        <div style={{fontFamily: "'Inter',-apple-system,sans-serif", fontSize: '18px', fontWeight: 800, color: 'var(--g900)', marginBottom: '8px'}}>Grievance Module</div>
        <div style={{fontSize: '13px', color: 'var(--g500)', marginBottom: '16px', maxWidth: '480px', marginLeft: 'auto', marginRight: 'auto'}}>Grievance workflow details — student appeal process, re-check criteria, outcome recording, and notification flow — have <strong>not yet been covered in a KT session.</strong></div>
        <div className="badge badge-purple" style={{marginBottom: '12px'}}><i className="lni lni-clipboard"></i> Module Not Yet Defined — Details to be captured in KT Session</div>
        <div style={{fontSize: '12px', color: 'var(--g400)'}}>Known facts: Students submit grievance before the Grievance End Date. Appeals are processed post-result publication.</div>
      </div>
    </div>
  )
}

export function OdlApplicationsPage({ nav, openModal, showToast, showPreview, setShowPreview }: PageProps) {
  return (
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

      <div className="g2" style={{marginBottom: '18px'}}>
        <div className="info-box"><i className="lni lni-world"></i> <span>ODL applications start online at <span style={{fontFamily: 'monospace', background: 'var(--b100)', padding: '2px 6px', borderRadius: '4px', fontSize: '11px'}}>ERP.../online.ASP</span>. Unlike regular applications, <strong>payment is not required to start</strong>. No fee exemptions apply to ODL applicants.</span></div>
        <div className="warn-box"><i className="lni lni-warning"></i> <span>Applications remain in the <strong>Temporary ODL Table</strong> until payment is reconciled by accounts. Only after reconciliation does the application move to the regular application form.</span></div>
      </div>

      {/* ODL Pipeline */}
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

      {/* Stats */}
      <div className="g4" style={{marginBottom: '18px'}}>
        <div className="stat-card"><div className="stat-lbl">Total ODL Applications</div><div className="stat-num">31</div><div className="stat-sub up">This intake</div></div>
        <div className="stat-card" style={{'--b700': 'var(--amber)', '--b400': '#fbbf24'} as React.CSSProperties}><div className="stat-lbl">Awaiting Payment</div><div className="stat-num" style={{color: 'var(--amber)'}}>9</div><div className="stat-sub warn">In temp table</div></div>
        <div className="stat-card" style={{'--b700': 'var(--purple)', '--b400': '#a78bfa'} as React.CSSProperties}><div className="stat-lbl">Paid — Pending Recon.</div><div className="stat-num" style={{color: 'var(--purple)'}}>4</div><div className="stat-sub warn">Accounts action needed</div></div>
        <div className="stat-card" style={{'--b700': 'var(--green)', '--b400': '#34d399'} as React.CSSProperties}><div className="stat-lbl">Reconciled → Moved</div><div className="stat-num" style={{color: 'var(--green)'}}>18</div><div className="stat-sub up">In regular application</div></div>
      </div>

      {/* Applications Table */}
      <div className="card">
        <div className="card-hdr">
          <div className="card-title"><span className="ctitle-icon"><i className="lni lni-world"></i></span> ODL Applicants — Temporary Table</div>
          <div className="flex gap-2">
            <select className="ctrl" style={{width: 'auto', fontSize: '12px'}}><option>All Statuses</option><option>Awaiting Payment</option><option>Paid — Pending Recon.</option><option>Reconciled</option></select>
            <button className="btn btn-neu btn-sm"><i className="lni lni-upload"></i> Export</button>
          </div>
        </div>
        <div className="tbl-wrap">
          <table>
            <thead><tr><th>ODL Ref No.</th><th>Applicant Name</th><th>Email</th><th>Programme</th><th>Applied Date</th><th>Payment</th><th>DPO Token</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              <tr><td style={{fontFamily: 'monospace', fontSize: '11px', color: 'var(--b700)'}}>ODL-2026-001</td><td><strong>Ssebulime Patrick</strong></td><td style={{fontSize: '11.5px'}}>patrick.ss@gmail.com</td><td>MBA ODL</td><td>10 Apr 2026</td><td><span className="badge badge-green"><i className="lni lni-checkmark"></i> Paid (DPO)</span></td><td style={{fontFamily: 'monospace', fontSize: '10px'}}>TKN-4829</td><td><span className="badge badge-purple">Pending Recon.</span></td><td><button className="btn btn-primary btn-sm" onClick={() => nav('odl-reconciliation')}>Reconcile →</button></td></tr>
              <tr><td style={{fontFamily: 'monospace', fontSize: '11px', color: 'var(--b700)'}}>ODL-2026-002</td><td><strong>Nakiyaga Flavia</strong></td><td style={{fontSize: '11.5px'}}>f.nakiyaga@email.com</td><td>BSc. IT ODL</td><td>11 Apr 2026</td><td><span className="badge badge-green"><i className="lni lni-checkmark"></i> Paid (DPO)</span></td><td style={{fontFamily: 'monospace', fontSize: '10px'}}>TKN-4831</td><td><span className="badge badge-purple">Pending Recon.</span></td><td><button className="btn btn-primary btn-sm" onClick={() => nav('odl-reconciliation')}>Reconcile →</button></td></tr>
              <tr className="flagged"><td style={{fontFamily: 'monospace', fontSize: '11px', color: 'var(--b700)'}}>ODL-2026-003</td><td><strong>Mutabazi Eric</strong></td><td style={{fontSize: '11.5px'}}>e.mutabazi@gmail.com</td><td>MBA ODL</td><td>12 Apr 2026</td><td><span className="badge badge-amber">Not Paid</span></td><td>—</td><td><span className="badge badge-amber">Awaiting Payment</span></td><td><button className="btn btn-neu btn-sm">View App →</button></td></tr>
              <tr><td style={{fontFamily: 'monospace', fontSize: '11px', color: 'var(--g400)'}}>ODL-2026-004</td><td>Acayo Lydia</td><td style={{fontSize: '11.5px'}}>l.acayo@email.com</td><td>Diploma Bus. ODL</td><td>05 Apr 2026</td><td><span className="badge badge-green"><i className="lni lni-checkmark"></i> Paid</span></td><td style={{fontFamily: 'monospace', fontSize: '10px'}}>TKN-4791</td><td><span className="badge badge-green"><i className="lni lni-checkmark"></i> Reconciled</span></td><td><button className="btn btn-neu btn-sm">View →</button></td></tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Online Application Form Preview (Candidate-facing) */}
      <div className="card" style={{border: '2px dashed var(--cyan)', background: 'var(--cyan-bg)'}}>
        <div className="card-hdr" style={{borderColor: 'rgba(2,132,199,.2)'}}>
          <div className="card-title"><span className="ctitle-icon"><i className="lni lni-world"></i></span> Candidate-Facing ODL Application Form</div>
          <span className="badge badge-cyan">Online Portal Preview</span>
        </div>
        <div className="info-box" style={{marginBottom: '14px'}}>
          <i className="lni lni-information"></i> This is the online form accessible at <span style={{fontFamily: 'monospace', background: 'var(--b100)', padding: '2px 6px', borderRadius: '4px', fontSize: '11px'}}>ERP.../online.ASP</span>. No login required — candidates access via Reference Number + Email.
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
            <div className="file-zone" style={{padding: '12px'}}><input type="file" accept="image/*" /><div className="file-zone-icon" style={{fontSize: '18px'}}><i className="lni lni-image"></i></div><p>Passport photo</p></div>
          </div>
        </div>
        <div className="sec-divider">Payment Option</div>
        <div className="tgl-group" style={{marginBottom: '14px'}}>
          <button className="tgl-btn tgl-active"><i className="lni lni-credit-cards"></i> Pay Online via DPO</button>
          <button className="tgl-btn"><i className="lni lni-apartment"></i> Pay Manually at Office</button>
        </div>
        <div className="success-box" style={{marginBottom: '14px'}}><i className="lni lni-checkmark"></i> <span>No fee exemptions apply to ODL applications. Application fee must be paid to complete the process.</span></div>
        <div style={{display: 'flex', gap: '10px', justifyContent: 'flex-end'}}>
          <button className="btn btn-neu" onClick={() => showToast('Application saved. Reference number sent to email.', 'success')}><i className="lni lni-save"></i> Save &amp; Get Reference No.</button>
          <button className="btn btn-primary" onClick={() => showToast('Redirecting to DPO payment gateway...', 'success')}><i className="lni lni-credit-cards"></i> Proceed to Payment →</button>
        </div>
      </div>
    </div>
  )
}

export function OdelStudentPreviewPage({ nav, openModal, showToast, odpTab = 'personal', setOdpTab }: PageProps) {
  return (
    <div className="page active">
      <div className="pg-hdr">
        <div>
          <div className="pg-title">ODel Student Preview</div>
          <div className="pg-sub">What the candidate sees online — Personal Info → Qualifications → Family → Documents → Application Payment</div>
        </div>
        <div className="flex gap-2">
          <span className="badge badge-cyan"><i className="lni lni-world"></i> Online Portal Preview</span>
          <button className="btn btn-neu" onClick={() => nav('acad-dashboard')}>← Back</button>
        </div>
      </div>

      <div className="info-box" style={{marginBottom: '14px'}}>
        <i className="lni lni-information"></i> Preview of the public-facing form at{' '}
        <span style={{fontFamily: 'monospace', background: 'var(--b100)', padding: '2px 6px', borderRadius: '4px', fontSize: '11px'}}>ERP.../online.ASP</span>
        {' '}— no login required; candidates access via Reference No. + Email.
      </div>

      <div className="card">
        <div className="odp-tabs">
          <button className={`odp-tab${odpTab === 'personal' ? ' active' : ''}`} data-odp="personal" onClick={() => setOdpTab && setOdpTab('personal')}><i className="lni lni-user"></i> Personal Info</button>
          <button className={`odp-tab${odpTab === 'qualifications' ? ' active' : ''}`} data-odp="qualifications" onClick={() => setOdpTab && setOdpTab('qualifications')}><i className="lni lni-graduation"></i> Qualifications</button>
          <button className={`odp-tab${odpTab === 'family' ? ' active' : ''}`} data-odp="family" onClick={() => setOdpTab && setOdpTab('family')}><i className="lni lni-users"></i> Family Details</button>
          <button className={`odp-tab${odpTab === 'documents' ? ' active' : ''}`} data-odp="documents" onClick={() => setOdpTab && setOdpTab('documents')}><i className="lni lni-paperclip"></i> Documents</button>
          <button className={`odp-tab${odpTab === 'payment' ? ' active' : ''}`} data-odp="payment" onClick={() => setOdpTab && setOdpTab('payment')}><i className="lni lni-credit-cards"></i> Application Payment</button>
        </div>

        {/* TAB: Personal Info */}
        {odpTab === 'personal' && (
          <div className="odp-pane active" id="odp-personal">
            <div className="prof-photo-row">
              <label className="prof-photo-zone" id="odp-photo-zone">
                <input type="file" accept="image/*" />
                <div className="prof-photo-icon"><i className="lni lni-camera"></i><small>Photo</small></div>
                <img className="prof-photo-preview" alt="Profile preview" />
              </label>
              <div className="prof-photo-info">
                <div className="prof-photo-title">Profile Photo</div>
                <div className="prof-photo-hint">Click the circle or drop a passport-style photo · JPG / PNG · max 2 MB</div>
              </div>
            </div>
            <div className="g3">
              <div className="fg"><div className="lbl">First Name <span className="req">*</span></div><input className="ctrl" type="text" placeholder="First name" /></div>
              <div className="fg"><div className="lbl">Last Name <span className="req">*</span></div><input className="ctrl" type="text" placeholder="Last name" /></div>
              <div className="fg"><div className="lbl">Date of Birth <span className="req">*</span></div><input className="ctrl" type="date" /></div>
              <div className="fg"><div className="lbl">Gender <span className="req">*</span></div>
                <select className="ctrl"><option>-- Select --</option><option>Female</option><option>Male</option><option>Other</option></select>
              </div>
              <div className="fg"><div className="lbl">Nationality <span className="req">*</span></div>
                <select className="ctrl"><option>Ugandan</option><option>Kenyan</option><option>Tanzanian</option><option>Rwandan</option><option>Other</option></select>
              </div>
              <div className="fg"><div className="lbl">National ID / Passport <span className="req">*</span></div><input className="ctrl" type="text" placeholder="CM12345..." /></div>
              <div className="fg"><div className="lbl">Phone <span className="req">*</span></div>
                <div className="inp-wrap"><span className="inp-icon"><i className="lni lni-phone"></i></span><input className="ctrl" type="tel" placeholder="+256 700 000 000" /></div>
              </div>
              <div className="fg"><div className="lbl">Email <span className="req">*</span></div>
                <div className="inp-wrap"><span className="inp-icon"><i className="lni lni-envelope"></i></span><input className="ctrl" type="email" placeholder="applicant@email.com" /></div>
              </div>
              <div className="fg"><div className="lbl">Country of Residence</div>
                <select className="ctrl"><option>Uganda</option><option>Kenya</option><option>Tanzania</option><option>Rwanda</option><option>Other</option></select>
              </div>
              <div className="fg span3"><div className="lbl">Residential Address</div><input className="ctrl" type="text" placeholder="District / Town / Village" /></div>
            </div>
            <div style={{display: 'flex', justifyContent: 'flex-end', marginTop: '14px'}}>
              <button className="btn btn-primary" onClick={() => setOdpTab && setOdpTab('qualifications')}>Next: Qualifications →</button>
            </div>
          </div>
        )}

        {/* TAB: Qualifications */}
        {odpTab === 'qualifications' && (
          <div className="odp-pane active" id="odp-qualifications">
            <div className="info-box" style={{marginBottom: '14px'}}>
              <i className="lni lni-graduation"></i> Enter your highest qualification. ODL candidates can attach scanned certificates in the Documents tab.
            </div>
            <div className="g2">
              <div className="fg"><div className="lbl">Highest Qualification <span className="req">*</span></div>
                <select className="ctrl"><option>-- Select --</option><option>A-Level (UACE)</option><option>Diploma</option><option>Bachelor&apos;s Degree</option><option>Master&apos;s Degree</option></select>
              </div>
              <div className="fg"><div className="lbl">Institution Attended <span className="req">*</span></div><input className="ctrl" type="text" placeholder="School / College / University" /></div>
              <div className="fg"><div className="lbl">Year of Completion <span className="req">*</span></div><input className="ctrl" type="number" min={1980} max={2030} placeholder="2024" /></div>
              <div className="fg"><div className="lbl">Grade / GPA</div><input className="ctrl" type="text" placeholder="e.g. 18 Points / 3.5 GPA" /></div>
              <div className="fg span2"><div className="lbl">Subjects / Specialization</div><textarea className="ctrl" rows={2} placeholder="e.g. Mathematics, Economics, Physics..."></textarea></div>
            </div>
            <div className="sec-divider">Work Experience (optional)</div>
            <div className="g2">
              <div className="fg"><div className="lbl">Current Employer</div><input className="ctrl" type="text" placeholder="Company / Organisation" /></div>
              <div className="fg"><div className="lbl">Years of Experience</div><input className="ctrl" type="number" min={0} max={50} placeholder="0" /></div>
            </div>
            <div style={{display: 'flex', justifyContent: 'space-between', marginTop: '14px'}}>
              <button className="btn btn-neu" onClick={() => setOdpTab && setOdpTab('personal')}>← Personal Info</button>
              <button className="btn btn-primary" onClick={() => setOdpTab && setOdpTab('family')}>Next: Family Details →</button>
            </div>
          </div>
        )}

        {/* TAB: Family Details */}
        {odpTab === 'family' && (
          <div className="odp-pane active" id="odp-family">
            <div className="g2">
              <div className="fg"><div className="lbl">Father&apos;s / Guardian&apos;s Name</div><input className="ctrl" type="text" placeholder="Full name" /></div>
              <div className="fg"><div className="lbl">Father&apos;s / Guardian&apos;s Occupation</div><input className="ctrl" type="text" placeholder="Occupation" /></div>
              <div className="fg"><div className="lbl">Father&apos;s / Guardian&apos;s Phone</div>
                <div className="inp-wrap"><span className="inp-icon"><i className="lni lni-phone"></i></span><input className="ctrl" type="tel" placeholder="+256 700 000 000" /></div>
              </div>
              <div className="fg"><div className="lbl">Mother&apos;s Name</div><input className="ctrl" type="text" placeholder="Full name" /></div>
              <div className="fg"><div className="lbl">Mother&apos;s Occupation</div><input className="ctrl" type="text" placeholder="Occupation" /></div>
              <div className="fg"><div className="lbl">Mother&apos;s Phone</div>
                <div className="inp-wrap"><span className="inp-icon"><i className="lni lni-phone"></i></span><input className="ctrl" type="tel" placeholder="+256 700 000 000" /></div>
              </div>
              <div className="fg span2"><div className="lbl">Emergency Contact</div><input className="ctrl" type="text" placeholder="Name + Phone (in case of emergency)" /></div>
            </div>
            <div style={{display: 'flex', justifyContent: 'space-between', marginTop: '14px'}}>
              <button className="btn btn-neu" onClick={() => setOdpTab && setOdpTab('qualifications')}>← Qualifications</button>
              <button className="btn btn-primary" onClick={() => setOdpTab && setOdpTab('documents')}>Next: Documents →</button>
            </div>
          </div>
        )}

        {/* TAB: Documents */}
        {odpTab === 'documents' && (
          <div className="odp-pane active" id="odp-documents">
            <div className="info-box" style={{marginBottom: '14px'}}>
              <i className="lni lni-paperclip"></i> Upload scanned copies. Physical originals will be verified by the Administrator at final stage. Provisional certificates are accepted at this stage.
            </div>
            <div className="g2">
              <div className="fg"><div className="lbl">Passport Photo <span className="req">*</span></div>
                <div className="file-zone"><input type="file" accept="image/*" /><div className="file-zone-icon"><i className="lni lni-image"></i></div><p>JPG / PNG · max 2MB</p></div>
              </div>
              <div className="fg"><div className="lbl">National ID / Passport <span className="req">*</span></div>
                <div className="file-zone"><input type="file" accept=".pdf,image/*" /><div className="file-zone-icon"><i className="lni lni-files"></i></div><p>PDF / image</p></div>
              </div>
              <div className="fg"><div className="lbl">Academic Certificate <span className="req">*</span></div>
                <div className="file-zone"><input type="file" accept=".pdf,image/*" /><div className="file-zone-icon"><i className="lni lni-files"></i></div><p>Highest qualification</p></div>
              </div>
              <div className="fg"><div className="lbl">Academic Transcript</div>
                <div className="file-zone"><input type="file" accept=".pdf,image/*" /><div className="file-zone-icon"><i className="lni lni-files"></i></div><p>Optional</p></div>
              </div>
              <div className="fg span2"><div className="lbl">Other Supporting Documents</div>
                <div className="file-zone"><input type="file" accept=".pdf,image/*" multiple /><div className="file-zone-icon"><i className="lni lni-files"></i></div><p>Recommendation letters, work certificates, etc.</p></div>
              </div>
            </div>
            <div style={{display: 'flex', justifyContent: 'space-between', marginTop: '14px'}}>
              <button className="btn btn-neu" onClick={() => setOdpTab && setOdpTab('family')}>← Family</button>
              <button className="btn btn-primary" onClick={() => setOdpTab && setOdpTab('payment')}>Next: Application Payment →</button>
            </div>
          </div>
        )}

        {/* TAB: Application Payment */}
        {odpTab === 'payment' && (
          <div className="odp-pane active" id="odp-payment">
            <div className="card" style={{border: '2px dashed var(--cyan)', background: 'var(--cyan-bg)', marginBottom: 0}}>
              <div className="card-hdr" style={{borderColor: 'rgba(2,132,199,.2)'}}>
                <div className="card-title"><span className="ctitle-icon"><i className="lni lni-world"></i></span> Candidate-Facing ODL Application Form</div>
                <span className="badge badge-cyan">Online Portal Preview</span>
              </div>
              <div className="info-box" style={{marginBottom: '14px'}}>
                <i className="lni lni-information"></i> This is the online form accessible at{' '}
                <span style={{fontFamily: 'monospace', background: 'var(--b100)', padding: '2px 6px', borderRadius: '4px', fontSize: '11px'}}>ERP.../online.ASP</span>.
                {' '}No login required — candidates access via Reference Number + Email.
              </div>
              <div className="g3">
                <div className="fg"><div className="lbl">Full Name <span className="req">*</span></div><input className="ctrl" type="text" placeholder="Full legal name" /></div>
                <div className="fg"><div className="lbl">Email Address <span className="req">*</span></div><input className="ctrl" type="email" placeholder="Your email (used for ref. number)" /></div>
                <div className="fg"><div className="lbl">Phone Number <span className="req">*</span></div><input className="ctrl" type="tel" placeholder="+256 700 000 000" /></div>
              </div>
              <div className="sec-divider">Application Fee</div>
              <div className="g2" style={{marginBottom: '14px'}}>
                <div className="fg">
                  <div className="lbl">Fee Type <span className="req">*</span></div>
                  <select className="ctrl">
                    <option value="">-- Select fee type --</option>
                    <option value="application">Application Fee</option>
                  </select>
                </div>
                <div className="fg">
                  <div className="lbl">Amount</div>
                  <div style={{padding: '14px 16px', background: 'var(--g100)', border: '1.5px dashed var(--g300)', borderRadius: 'var(--rsm)', color: 'var(--g400)', fontSize: '12.5px', fontWeight: 500}}>
                    Select a fee type to view the amount
                  </div>
                </div>
              </div>
              <div className="sec-divider">Payment Option</div>
              <div className="tgl-group" style={{marginBottom: '14px'}}>
                <button className="tgl-btn tgl-active"><i className="lni lni-credit-cards"></i> Pay Online via DPO</button>
                <button className="tgl-btn"><i className="lni lni-apartment"></i> Pay Manually at Office</button>
              </div>
              <div className="success-box" style={{marginBottom: '14px'}}><i className="lni lni-checkmark"></i> <span>No fee exemptions apply to ODL applications. Application fee must be paid to complete the process.</span></div>
              <div style={{display: 'flex', gap: '10px', justifyContent: 'space-between', flexWrap: 'wrap'}}>
                <button className="btn btn-neu" onClick={() => setOdpTab && setOdpTab('documents')}>← Documents</button>
                <div className="flex gap-2">
                  <button className="btn btn-neu" onClick={() => showToast('Application saved. Reference number sent to email.', 'success')}><i className="lni lni-save"></i> Save &amp; Get Reference No.</button>
                  <button className="btn btn-primary" onClick={() => showToast('Redirecting to DPO payment gateway...', 'success')}><i className="lni lni-credit-cards"></i> Proceed to Payment →</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export function OdlReconciliationPage({ nav, openModal, showToast }: PageProps) {
  return (
    <div className="page active">
      <div className="pg-hdr">
        <div>
          <div className="pg-title">ODL Payment Reconciliation</div>
          <div className="pg-sub">Accounts team manually reconciles DPO payments · Moves confirmed applicants to regular application form</div>
        </div>
        <button className="btn btn-neu" onClick={() => nav('odl-applications')}>← ODL Applications</button>
      </div>

      <div className="warn-box" style={{marginBottom: '18px'}}>
        <i className="lni lni-warning"></i> <span>Reconciliation is a <strong>manual accounts process</strong>. The system does NOT automatically move an applicant after DPO payment — accounts must verify and confirm. Once reconciled, the system sends a <strong>&quot;Payment is reconciled&quot;</strong> email to the candidate and their status changes from <em>Lead → Candidate</em>.</span>
      </div>

      <div className="card">
        <div className="card-hdr">
          <div className="card-title"><span className="ctitle-icon"><i className="lni lni-credit-cards"></i></span> Pending Reconciliation (4)</div>
          <span className="badge badge-amber">Accounts Action Required</span>
        </div>
        <div id="recon-list" style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>

          {/* Reconciliation Item 1 */}
          <div style={{border: '1.5px solid var(--g200)', borderRadius: 'var(--rsm)', padding: '16px', background: 'var(--surface)'}} id="recon-ODL-2026-001">
            <div style={{display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px'}}>
              <div>
                <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px'}}>
                  <span className="font-bold" style={{fontSize: '14px'}}>Ssebulime Patrick</span>
                  <span style={{fontFamily: 'monospace', fontSize: '11px', color: 'var(--b700)'}}>ODL-2026-001</span>
                  <span className="badge badge-purple">Pending Recon.</span>
                </div>
                <div style={{display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '12.5px', color: 'var(--g500)'}}>
                  <span><i className="lni lni-envelope"></i> patrick.ss@gmail.com</span>
                  <span><i className="lni lni-book"></i> MBA ODL</span>
                  <span><i className="lni lni-credit-cards"></i> DPO Token: <span style={{fontFamily: 'monospace', color: 'var(--b700)'}}>TKN-4829</span></span>
                  <span><i className="lni lni-calendar"></i> Paid: 10 Apr 2026</span>
                  <span><i className="lni lni-dollar"></i> Amount: UGX 50,000</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="btn btn-neu btn-sm" onClick={() => showToast('Viewing DPO transaction TKN-4829...', 'success')}><i className="lni lni-search-alt"></i> Verify Token</button>
                <button className="btn btn-danger btn-sm" onClick={() => showToast('Reconciliation rejected. Applicant notified.', 'warn')}><i className="lni lni-close"></i> Reject</button>
                <button className="btn btn-success btn-sm" onClick={() => showToast('ODL-2026-001 reconciled. Ssebulime Patrick moved to regular application.', 'success')}><i className="lni lni-checkmark"></i> Confirm Reconciled</button>
              </div>
            </div>
          </div>

          {/* Reconciliation Item 2 */}
          <div style={{border: '1.5px solid var(--g200)', borderRadius: 'var(--rsm)', padding: '16px', background: 'var(--surface)'}} id="recon-ODL-2026-002">
            <div style={{display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px'}}>
              <div>
                <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px'}}>
                  <span className="font-bold" style={{fontSize: '14px'}}>Nakiyaga Flavia</span>
                  <span style={{fontFamily: 'monospace', fontSize: '11px', color: 'var(--b700)'}}>ODL-2026-002</span>
                  <span className="badge badge-purple">Pending Recon.</span>
                </div>
                <div style={{display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '12.5px', color: 'var(--g500)'}}>
                  <span><i className="lni lni-envelope"></i> f.nakiyaga@email.com</span>
                  <span><i className="lni lni-book"></i> BSc. IT ODL</span>
                  <span><i className="lni lni-credit-cards"></i> DPO Token: <span style={{fontFamily: 'monospace', color: 'var(--b700)'}}>TKN-4831</span></span>
                  <span><i className="lni lni-calendar"></i> Paid: 11 Apr 2026</span>
                  <span><i className="lni lni-dollar"></i> Amount: UGX 50,000</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="btn btn-neu btn-sm" onClick={() => showToast('Viewing DPO transaction TKN-4831...', 'success')}><i className="lni lni-search-alt"></i> Verify Token</button>
                <button className="btn btn-danger btn-sm" onClick={() => showToast('Reconciliation rejected.', 'warn')}><i className="lni lni-close"></i> Reject</button>
                <button className="btn btn-success btn-sm" onClick={() => showToast('ODL-2026-002 reconciled. Nakiyaga Flavia moved to regular application.', 'success')}><i className="lni lni-checkmark"></i> Confirm Reconciled</button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

export function QualEquatingPage({ nav, openModal, showToast }: PageProps) {
  return (
    <div className="page active">
      <div className="pg-hdr">
        <div>
          <div className="pg-title">Qualification Equating</div>
          <div className="pg-sub">Validate foreign educational qualifications against Ugandan standards · NCHE / UVTOP referral</div>
        </div>
        <button className="btn btn-primary" onClick={() => openModal('new-equating-modal')}><i className="lni lni-plus"></i> New Equating Request</button>
      </div>

      <div className="info-box" style={{marginBottom: '18px'}}>
        <i className="lni lni-world"></i> <span>Any foreign qualification must be formally equated with <strong>NCHE</strong> (National Council of Higher Education) or <strong>UVTOP</strong> (Uganda National &amp; Technical Vocational Board) before the applicant can be admitted. O-Level: minimum 5 passes, passing grade ≤ 8. A-Level: assessed on Principal Passes and Subsidiary Passes.</span>
      </div>

      <div className="card">
        <div className="card-hdr">
          <div className="card-title"><span className="ctitle-icon"><i className="lni lni-world"></i></span> Equating Requests</div>
        </div>
        <div className="tbl-wrap">
          <table>
            <thead><tr><th>Applicant Name</th><th>Country of Qualification</th><th>Qualification Level</th><th>Referred To</th><th>Submitted Date</th><th>Status</th><th>Outcome</th><th>Action</th></tr></thead>
            <tbody>
              <tr><td><strong>Kabila Jean-Pierre</strong></td><td><i className="lni lni-flag"></i> DR Congo</td><td>A-Level Equivalent</td><td><span className="badge badge-blue">NCHE</span></td><td>01 Mar 2026</td><td><span className="badge badge-green"><i className="lni lni-checkmark"></i> Completed</span></td><td><span className="badge badge-green">Equated — 2 Principal Passes</span></td><td><button className="btn btn-neu btn-sm">View →</button></td></tr>
              <tr className="flagged"><td><strong>Abubakar Faisal</strong></td><td><i className="lni lni-flag"></i> Kenya</td><td>O-Level (KCSE)</td><td><span className="badge badge-amber">UVTOP</span></td><td>10 Apr 2026</td><td><span className="badge badge-amber">Pending</span></td><td>—</td><td><button className="btn btn-amber btn-sm">Follow Up</button></td></tr>
              <tr><td><strong>Uwase Claudine</strong></td><td><i className="lni lni-flag"></i> Rwanda</td><td>Bachelor&apos;s Degree</td><td><span className="badge badge-blue">NCHE</span></td><td>15 Apr 2026</td><td><span className="badge badge-purple">In Review</span></td><td>—</td><td><button className="btn btn-neu btn-sm">View →</button></td></tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Undefined sub-detail */}
      <div className="undefined-box" style={{marginTop: '4px'}}>
        <div style={{fontSize: '20px', marginBottom: '8px'}}><i className="lni lni-world"></i></div>
        <div style={{fontWeight: 700, fontSize: '14px', color: 'var(--g900)', marginBottom: '6px'}}>Detailed Equating Workflow</div>
        <div style={{fontSize: '12.5px', color: 'var(--g500)', maxWidth: '500px', margin: '0 auto'}}>The detailed process for document submission to NCHE/UVTOP, tracking, and outcome recording has <strong>not yet been covered in a KT session</strong>.</div>
        <div className="badge badge-purple" style={{marginTop: '10px'}}><i className="lni lni-clipboard"></i> Module Not Yet Defined — Details to be captured in KT Session</div>
      </div>
    </div>
  )
}
