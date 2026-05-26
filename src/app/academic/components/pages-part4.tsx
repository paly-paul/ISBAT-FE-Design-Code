'use client'

interface PageProps {
  nav: (id: string) => void;
  openModal: (id: string) => void;
  closeModal: (id: string) => void;
  showToast: (msg: string, type?: string) => void;
  openModals: Set<string>;
}

export function FacultyMasterPage({ nav, openModal, showToast }: PageProps) {
  return (
    <div className="page active">
      <div className="pg-hdr">
        <div><div className="pg-title">Faculty Master</div><div className="pg-sub">Define university faculties · Associate programmes and course units</div></div>
        <button className="btn btn-primary" onClick={() => openModal('new-faculty-modal')}><i className="lni lni-plus"></i> Add Faculty</button>
      </div>
      <div className="card">
        <div className="card-hdr"><div className="card-title"><span className="ctitle-icon"><i className="lni lni-apartment"></i></span> Faculties</div></div>
        <div className="tbl-wrap">
          <table>
            <thead><tr><th>Faculty Code</th><th>Faculty Name</th><th>Dean</th><th>Programmes</th><th>Course Units</th><th>Action</th></tr></thead>
            <tbody id="faculty-master-tbody">
              <tr><td style={{ fontFamily: 'monospace' }}>FCT</td><td><strong>Faculty of Computing &amp; Technology</strong></td><td>Dr. Ssekibuule Ronald</td><td>3</td><td>42</td><td><button className="btn btn-neu btn-sm"><i className="lni lni-pencil"></i> Edit</button></td></tr>
              <tr><td style={{ fontFamily: 'monospace' }}>FBM</td><td><strong>Faculty of Business &amp; Management</strong></td><td>Prof. Mukasa Charles</td><td>4</td><td>56</td><td><button className="btn btn-neu btn-sm"><i className="lni lni-pencil"></i> Edit</button></td></tr>
              <tr><td style={{ fontFamily: 'monospace' }}>FEN</td><td><strong>Faculty of Engineering</strong></td><td>Dr. Tendo Patrick</td><td>2</td><td>38</td><td><button className="btn btn-neu btn-sm"><i className="lni lni-pencil"></i> Edit</button></td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export function LecturerMasterPage({ nav, openModal, showToast }: PageProps) {
  return (
    <div className="page active">
      <div className="pg-hdr">
        <div><div className="pg-title">Lecturer Master</div><div className="pg-sub">All teaching staff · Captures qualification details · Linked to Faculty &amp; Course Allocation</div></div>
        <button className="btn btn-primary" onClick={() => openModal('new-lecturer-modal')}><i className="lni lni-plus"></i> Add Lecturer</button>
      </div>

      <div className="info-box" style={{ marginBottom: '14px' }}>
        <i className="lni lni-information"></i> Add the basic identity + qualifications here. Subject expertise (per-unit skills) is captured in <strong>Skill Management</strong> and feeds into Course Allocation.
      </div>

      <div className="card">
        <div className="card-hdr">
          <div className="card-title"><span className="ctitle-icon"><i className="lni lni-user"></i></span> Lecturers</div>
          <span className="badge badge-blue"><i className="lni lni-users"></i> <span id="lecturer-count">5</span> total</span>
        </div>
        <div className="tbl-wrap">
          <table>
            <thead><tr>
              <th>ID</th><th>Name</th><th>Highest Qualification</th><th>Specialisation</th><th>Faculty</th><th>Designation</th><th>Status</th><th>Action</th>
            </tr></thead>
            <tbody id="lecturer-master-tbody">
              <tr>
                <td style={{ fontFamily: 'monospace', color: 'var(--b700)' }}>LEC-0001</td>
                <td><strong>Dr. Nakimuli Sarah</strong><div style={{ fontSize: '11px', color: 'var(--g500)' }}>snakimuli@isbatuniversity.ac.ug</div></td>
                <td>PhD Computer Science<div style={{ fontSize: '11px', color: 'var(--g500)' }}>Makerere University · 2018</div></td>
                <td>Machine Learning, Algorithms</td>
                <td>Faculty of Computing &amp; Technology</td>
                <td><span className="badge badge-blue">Senior Lecturer</span></td>
                <td><span className="badge badge-green"><span className="bdot"></span>Active</span></td>
                <td><button className="btn btn-neu btn-sm"><i className="lni lni-pencil"></i> Edit</button></td>
              </tr>
              <tr>
                <td style={{ fontFamily: 'monospace', color: 'var(--b700)' }}>LEC-0002</td>
                <td><strong>Prof. Mukasa Charles</strong><div style={{ fontSize: '11px', color: 'var(--g500)' }}>cmukasa@isbatuniversity.ac.ug</div></td>
                <td>PhD Business Administration<div style={{ fontSize: '11px', color: 'var(--g500)' }}>University of Cape Town · 2012</div></td>
                <td>Strategic Management, Finance</td>
                <td>Faculty of Business &amp; Management</td>
                <td><span className="badge badge-purple">Professor</span></td>
                <td><span className="badge badge-green"><span className="bdot"></span>Active</span></td>
                <td><button className="btn btn-neu btn-sm"><i className="lni lni-pencil"></i> Edit</button></td>
              </tr>
              <tr>
                <td style={{ fontFamily: 'monospace', color: 'var(--b700)' }}>LEC-0003</td>
                <td><strong>Dr. Tendo Patrick</strong><div style={{ fontSize: '11px', color: 'var(--g500)' }}>ptendo@isbatuniversity.ac.ug</div></td>
                <td>PhD Civil Engineering<div style={{ fontSize: '11px', color: 'var(--g500)' }}>Kyambogo University · 2016</div></td>
                <td>Structural Design, Geotechnics</td>
                <td>Faculty of Engineering</td>
                <td><span className="badge badge-blue">Senior Lecturer</span></td>
                <td><span className="badge badge-green"><span className="bdot"></span>Active</span></td>
                <td><button className="btn btn-neu btn-sm"><i className="lni lni-pencil"></i> Edit</button></td>
              </tr>
              <tr>
                <td style={{ fontFamily: 'monospace', color: 'var(--b700)' }}>LEC-0004</td>
                <td><strong>Ms. Acen Lillian</strong><div style={{ fontSize: '11px', color: 'var(--g500)' }}>lacen@isbatuniversity.ac.ug</div></td>
                <td>MSc Information Technology<div style={{ fontSize: '11px', color: 'var(--g500)' }}>Makerere University · 2021</div></td>
                <td>Web Development, Databases</td>
                <td>Faculty of Computing &amp; Technology</td>
                <td><span className="badge badge-blue">Lecturer</span></td>
                <td><span className="badge badge-green"><span className="bdot"></span>Active</span></td>
                <td><button className="btn btn-neu btn-sm"><i className="lni lni-pencil"></i> Edit</button></td>
              </tr>
              <tr>
                <td style={{ fontFamily: 'monospace', color: 'var(--b700)' }}>LEC-0005</td>
                <td><strong>Mr. Okello Brian</strong><div style={{ fontSize: '11px', color: 'var(--g500)' }}>bokello@isbatuniversity.ac.ug</div></td>
                <td>MBA Finance<div style={{ fontSize: '11px', color: 'var(--g500)' }}>Strathmore University · 2020</div></td>
                <td>Corporate Finance, Accounting</td>
                <td>Faculty of Business &amp; Management</td>
                <td><span className="badge badge-blue">Assistant Lecturer</span></td>
                <td><span className="badge badge-amber"><span className="bdot"></span>On Leave</span></td>
                <td><button className="btn btn-neu btn-sm"><i className="lni lni-pencil"></i> Edit</button></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export function ALevelMasterPage({ nav, openModal, showToast }: PageProps) {
  return (
    <div className="page active">
      <div className="pg-hdr">
        <div><div className="pg-title">Programme Level Master</div><div className="pg-sub">Define programme levels (Bachelor's, Master's, PhD etc.) · Set year count, semester count and minimum credit load</div></div>
        <button className="btn btn-primary" onClick={() => openModal('new-alevel-modal')}><i className="lni lni-plus"></i> Add Level</button>
      </div>

      <div className="info-box" style={{ marginBottom: '18px' }}>
        <i className="lni lni-information"></i> Programme Level defines the <strong>fundamental attributes</strong> of every programme at that level (year count, semester count, minimum credit load). Selecting a level in the Programme Master auto-populates these values — e.g. selecting Bachelor's defaults to 3 years, 6 semesters.
      </div>

      <div className="card">
        <div className="card-hdr">
          <div className="card-title"><span className="ctitle-icon"><i className="lni lni-graduation"></i></span> Defined Programme Levels</div>
        </div>
        <div className="tbl-wrap">
          <table>
            <thead><tr><th>Level Code</th><th>Level Name</th><th>Year Count</th><th>Semester Count</th><th>Min. Credit Load</th><th>No Internal Assessment</th><th>Linked Programmes</th><th>Action</th></tr></thead>
            <tbody>
              <tr><td style={{ fontFamily: 'monospace', color: 'var(--b700)' }}>CERT</td><td><strong>Certificate / HEC</strong></td><td>1</td><td>2</td><td>48</td><td><span className="badge badge-grey">No</span></td><td>3</td><td><button className="btn btn-neu btn-sm"><i className="lni lni-pencil"></i> Edit</button></td></tr>
              <tr><td style={{ fontFamily: 'monospace', color: 'var(--b700)' }}>DIP</td><td><strong>Diploma</strong></td><td>2</td><td>4</td><td>96</td><td><span className="badge badge-grey">No</span></td><td>5</td><td><button className="btn btn-neu btn-sm"><i className="lni lni-pencil"></i> Edit</button></td></tr>
              <tr><td style={{ fontFamily: 'monospace', color: 'var(--b700)' }}>BACH</td><td><strong>Bachelor's Degree</strong></td><td>3</td><td>6</td><td>132</td><td><span className="badge badge-grey">No</span></td><td>12</td><td><button className="btn btn-neu btn-sm"><i className="lni lni-pencil"></i> Edit</button></td></tr>
              <tr><td style={{ fontFamily: 'monospace', color: 'var(--b700)' }}>ENG</td><td><strong>Bachelor of Engineering</strong></td><td>4</td><td>8</td><td>160</td><td><span className="badge badge-grey">No</span></td><td>4</td><td><button className="btn btn-neu btn-sm"><i className="lni lni-pencil"></i> Edit</button></td></tr>
              <tr><td style={{ fontFamily: 'monospace', color: 'var(--b700)' }}>MAST</td><td><strong>Master's Degree</strong></td><td>2</td><td>4</td><td>72</td><td><span className="badge badge-grey">No</span></td><td>6</td><td><button className="btn btn-neu btn-sm"><i className="lni lni-pencil"></i> Edit</button></td></tr>
              <tr><td style={{ fontFamily: 'monospace', color: 'var(--b700)' }}>PHD</td><td><strong>Doctor of Philosophy (PhD)</strong></td><td>3</td><td>6</td><td>0</td><td><span className="badge badge-amber"><i className="lni lni-checkmark"></i> Yes — No IA</span></td><td>2</td><td><button className="btn btn-neu btn-sm"><i className="lni lni-pencil"></i> Edit</button></td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export function ProgrammeGroupPage({ nav, openModal, showToast }: PageProps) {
  return (
    <div className="page active">
      <div className="pg-hdr">
        <div><div className="pg-title">Programme Group Master</div><div className="pg-sub">Generic programme names for reporting · Groups all curriculum versions under one umbrella</div></div>
        <button className="btn btn-primary" onClick={() => openModal('new-proggroup-modal')}><i className="lni lni-plus"></i> Add Programme Group</button>
      </div>

      <div className="info-box" style={{ marginBottom: '18px' }}>
        <i className="lni lni-information"></i> Programme Groups are used for <strong>high-level reporting</strong> — e.g. searching "BCA" returns all students across BCA 2026 <em>and</em> BCA 2031 versions. This ensures a single generic name links all curriculum versions for aggregate analytics.
      </div>

      <div className="card">
        <div className="card-hdr">
          <div className="card-title"><span className="ctitle-icon"><i className="lni lni-folder"></i></span> Programme Groups</div>
          <button className="btn btn-neu btn-sm"><i className="lni lni-upload"></i> Export</button>
        </div>
        <div className="tbl-wrap">
          <table>
            <thead><tr><th>Group Code</th><th>Group Name</th><th>Programme Level</th><th>Active Versions</th><th>Inactive Versions</th><th>Total Students</th><th>Action</th></tr></thead>
            <tbody>
              <tr><td style={{ fontFamily: 'monospace', color: 'var(--b700)' }}>BCA</td><td><strong>Bachelor of Computer Applications</strong></td><td>Bachelor's</td><td><span className="badge badge-green">1 Active</span></td><td><span className="badge badge-grey">1 Inactive</span></td><td>234</td><td><button className="btn btn-neu btn-sm"><i className="lni lni-pencil"></i> Edit</button></td></tr>
              <tr><td style={{ fontFamily: 'monospace', color: 'var(--b700)' }}>BBA</td><td><strong>Bachelor of Business Administration</strong></td><td>Bachelor's</td><td><span className="badge badge-green">1 Active</span></td><td><span className="badge badge-grey">2 Inactive</span></td><td>412</td><td><button className="btn btn-neu btn-sm"><i className="lni lni-pencil"></i> Edit</button></td></tr>
              <tr><td style={{ fontFamily: 'monospace', color: 'var(--b700)' }}>MBA</td><td><strong>Master of Business Administration</strong></td><td>Master's</td><td><span className="badge badge-green">1 Active</span></td><td><span className="badge badge-grey">1 Inactive</span></td><td>186</td><td><button className="btn btn-neu btn-sm"><i className="lni lni-pencil"></i> Edit</button></td></tr>
              <tr><td style={{ fontFamily: 'monospace', color: 'var(--b700)' }}>BEng</td><td><strong>Bachelor of Engineering (Civil)</strong></td><td>Engineering</td><td><span className="badge badge-green">1 Active</span></td><td>—</td><td>124</td><td><button className="btn btn-neu btn-sm"><i className="lni lni-pencil"></i> Edit</button></td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export function ProgrammeMasterPage({ nav, openModal, showToast }: PageProps) {
  return (
    <div className="page active">
      <div className="pg-hdr">
        <div><div className="pg-title">Programme Master</div><div className="pg-sub">Define programme versions · Manage active/inactive status · Accreditation tracking · Specializations</div></div>
        <button className="btn btn-primary" onClick={() => openModal('new-prog-modal')}><i className="lni lni-plus"></i> Add Programme Version</button>
      </div>

      {/* Hierarchy reminder */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px', flexWrap: 'wrap' }}>
        <button className="btn btn-neu btn-sm" onClick={() => nav('a-level-master')} style={{ fontSize: '11px' }}><i className="lni lni-graduation"></i> Programme Level</button>
        <span style={{ color: 'var(--g300)', fontSize: '16px' }}>→</span>
        <button className="btn btn-neu btn-sm" onClick={() => nav('programme-group')} style={{ fontSize: '11px' }}><i className="lni lni-folder"></i> Programme Group</button>
        <span style={{ color: 'var(--g300)', fontSize: '16px' }}>→</span>
        <span style={{ background: 'var(--b50)', border: '1.5px solid var(--b200)', borderRadius: 'var(--rxs)', padding: '5px 12px', fontSize: '11px', fontWeight: 700, color: 'var(--b700)' }}><i className="lni lni-graduation"></i> Programme Master ← You are here</span>
        <span style={{ color: 'var(--g300)', fontSize: '16px' }}>→</span>
        <button className="btn btn-neu btn-sm" onClick={() => nav('course-units')} style={{ fontSize: '11px' }}><i className="lni lni-book"></i> Course Units</button>
      </div>

      <div className="warn-box" style={{ marginBottom: '18px' }}>
        <i className="lni lni-warning"></i> <span><strong>Versioning Rule:</strong> NCHE mandates a minimum 30–50% curriculum change every 5 years for reaccreditation. Old versions (e.g. BCA 2026) must remain <em>Inactive</em> so existing students continue on their curriculum. New versions (e.g. BCA 2031) are set <em>Active</em> for new admissions only.</span>
      </div>

      {/* Accreditation Alerts */}
      <div className="danger-box" style={{ marginBottom: '14px' }}>
        <i className="lni lni-volume-high"></i> <span><strong>Accreditation Alert:</strong> BBA 2021 version expires in <strong>6 months (Oct 2026)</strong>. Start NCHE reaccreditation process and prepare BBA 2027 curriculum version. <button className="btn btn-neu btn-sm" style={{ marginLeft: '8px' }} onClick={() => nav('programme-master')}>View →</button></span>
      </div>

      {/* Programme Versions Table */}
      <div className="card">
        <div className="card-hdr">
          <div className="card-title"><span className="ctitle-icon"><i className="lni lni-graduation"></i></span> All Programme Versions</div>
          <div className="flex gap-2">
            <select className="ctrl" style={{ width: 'auto', fontSize: '12px' }}><option>All Levels</option><option>Bachelor's</option><option>Master's</option><option>PhD</option><option>Diploma</option></select>
            <select className="ctrl" style={{ width: 'auto', fontSize: '12px' }}><option>All Statuses</option><option>Active</option><option>Inactive</option></select>
            <button className="btn btn-neu btn-sm"><i className="lni lni-upload"></i> Export</button>
          </div>
        </div>
        <div className="tbl-wrap">
          <table>
            <thead><tr><th>Prog. Code</th><th>Programme Name</th><th>Group</th><th>Programme Level</th><th>Faculty → Campus</th><th>Accreditation Date</th><th>Expires</th><th>No IA</th><th>Specializations</th><th>Admission Status</th><th>Action</th></tr></thead>
            <tbody>
              <tr>
                <td style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--b700)' }}>BCA-2026</td>
                <td><strong>Bachelor of Computer Appl. 2026</strong></td>
                <td>BCA</td><td>Bachelor's · 3yr / 6sem</td>
                <td>FCT → Main Campus</td>
                <td>Jan 2026</td>
                <td><span className="badge badge-green">Jan 2031</span></td>
                <td><span className="badge badge-grey">No</span></td>
                <td>—</td>
                <td><span className="badge badge-green"><span className="bdot"></span>Active</span></td>
                <td><div className="flex gap-2"><button className="btn btn-neu btn-sm" onClick={() => openModal('new-prog-modal')}><i className="lni lni-pencil"></i> Edit</button><button className="btn btn-neu btn-sm" onClick={() => nav('course-units')}><i className="lni lni-book"></i> Curriculum</button></div></td>
              </tr>
              <tr>
                <td style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--g400)' }}>BCA-2021</td>
                <td>Bachelor of Computer Appl. 2021</td>
                <td>BCA</td><td>Bachelor's · 3yr / 6sem</td>
                <td>FCT → Main Campus</td>
                <td>Jan 2021</td>
                <td><span className="badge badge-grey">Jan 2026 — Retired</span></td>
                <td><span className="badge badge-grey">No</span></td>
                <td>—</td>
                <td><span className="badge badge-grey">Inactive (existing students only)</span></td>
                <td><button className="btn btn-neu btn-sm"><i className="lni lni-eye"></i> View</button></td>
              </tr>
              <tr className="flagged">
                <td style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--b700)' }}>BBA-2021</td>
                <td><strong>BBA Business Administration 2021</strong></td>
                <td>BBA</td><td>Bachelor's · 3yr / 6sem</td>
                <td>FBM → Main Campus</td>
                <td>Oct 2021</td>
                <td><span className="badge badge-red"><i className="lni lni-warning"></i> Oct 2026 — Expiring Soon</span></td>
                <td><span className="badge badge-grey">No</span></td>
                <td>—</td>
                <td><span className="badge badge-green"><span className="bdot"></span>Active</span></td>
                <td><div className="flex gap-2"><button className="btn btn-amber btn-sm" onClick={() => openModal('new-prog-modal')}><i className="lni lni-warning"></i> Renew</button><button className="btn btn-primary btn-sm" onClick={() => openModal('new-prog-modal')}><i className="lni lni-plus"></i> New Version</button></div></td>
              </tr>
              <tr>
                <td style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--b700)' }}>MBA-2024</td>
                <td><strong>MBA Business Administration 2024</strong></td>
                <td>MBA</td><td>Master's · 2yr / 4sem</td>
                <td>FBM → Main Campus</td>
                <td>Mar 2024</td>
                <td><span className="badge badge-green">Mar 2029</span></td>
                <td><span className="badge badge-grey">No</span></td>
                <td><span className="badge badge-blue">3 Specializations</span></td>
                <td><span className="badge badge-green"><span className="bdot"></span>Active</span></td>
                <td><div className="flex gap-2"><button className="btn btn-neu btn-sm" onClick={() => openModal('new-prog-modal')}><i className="lni lni-pencil"></i> Edit</button><button className="btn btn-neu btn-sm" onClick={() => openModal('specialization-modal')}><i className="lni lni-target"></i> Specializations</button></div></td>
              </tr>
              <tr>
                <td style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--b700)' }}>PHD-CS-2023</td>
                <td><strong>Doctor of Philosophy — CS 2023</strong></td>
                <td>—</td><td>PhD · 3yr / 6sem</td>
                <td>FCT → Main Campus</td>
                <td>Jun 2023</td>
                <td><span className="badge badge-green">Jun 2028</span></td>
                <td><span className="badge badge-amber"><i className="lni lni-checkmark"></i> No Internal Assessment</span></td>
                <td>—</td>
                <td><span className="badge badge-green"><span className="bdot"></span>Active</span></td>
                <td><button className="btn btn-neu btn-sm" onClick={() => openModal('new-prog-modal')}><i className="lni lni-pencil"></i> Edit</button></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
