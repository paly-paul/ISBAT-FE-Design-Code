'use client'

interface ModalsProps {
  openModals: Set<string>
  closeModal: (id: string) => void
  showToast: (msg: string, type?: string) => void
  nav: (id: string) => void
}

export function ModalsContainer({ openModals, closeModal, showToast, nav }: ModalsProps) {
  return (
    <>
      {/* ── New Intake Modal ── */}
      {openModals.has('new-intake-modal') && (
        <div className="modal-overlay open" id="new-intake-modal" onClick={() => closeModal('new-intake-modal')}>
          <div className="modal modal-md" onClick={e => e.stopPropagation()}>
            <div className="modal-hdr">
              <div className="modal-title"><i className="lni lni-calendar"></i> Create New Intake</div>
              <button className="modal-close" onClick={() => closeModal('new-intake-modal')}><i className="lni lni-close"></i></button>
            </div>
            <div className="g2">
              <div className="fg"><div className="lbl">Intake Code <span className="req">*</span></div><input className="ctrl" type="text" placeholder="e.g. 20263" /></div>
              <div className="fg"><div className="lbl">Description <span className="req">*</span></div><input className="ctrl" type="text" placeholder="e.g. Spring 2027" /></div>
              <div className="fg"><div className="lbl">Financial Year <span className="req">*</span></div><input className="ctrl" type="text" placeholder="e.g. 2026–27" /></div>
              <div className="fg">
                <div className="lbl">Set As <span className="req">*</span></div>
                <select className="ctrl"><option>Academic Intake (Teaching)</option><option>Admission Intake (New Students)</option></select>
              </div>
              <div className="fg"><div className="lbl">Semester Start Date <span className="req">*</span></div><input className="ctrl" type="date" /></div>
              <div className="fg"><div className="lbl">Term 1 End Date <span className="req">*</span></div><input className="ctrl" type="date" /></div>
              <div className="fg"><div className="lbl">Term 2 End Date / Semester End <span className="req">*</span></div><input className="ctrl" type="date" /></div>
              <div className="fg"><div className="lbl">Grievance End Date</div><input className="ctrl" type="date" /></div>
              <div className="fg"><div className="lbl">Re-entry Date</div><input className="ctrl" type="date" /></div>
              <div className="fg"><div className="lbl">Late Fee Start Date</div><input className="ctrl" type="date" /></div>
            </div>
            <div className="warn-box mt-3"><i className="lni lni-warning"></i> Only one intake can be set as <em>Current Academic</em> and one as <em>Current Admission</em> simultaneously. Setting a new one will deactivate the previous.</div>
            <div className="modal-footer">
              <button className="btn btn-neu" onClick={() => closeModal('new-intake-modal')}>Cancel</button>
              <button className="btn btn-primary" onClick={() => { closeModal('new-intake-modal'); showToast('Intake created successfully.', 'success') }}><i className="lni lni-checkmark"></i> Save Intake</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Intake Modal ── */}
      {openModals.has('intake-edit-modal') && (
        <div className="modal-overlay open" id="intake-edit-modal" onClick={() => closeModal('intake-edit-modal')}>
          <div className="modal modal-md" onClick={e => e.stopPropagation()}>
            <div className="modal-hdr">
              <div className="modal-title"><i className="lni lni-pencil"></i> Edit Intake</div>
              <button className="modal-close" onClick={() => closeModal('intake-edit-modal')}><i className="lni lni-close"></i></button>
            </div>
            <div className="g2">
              <div className="fg"><div className="lbl">Intake Code <span className="req">*</span></div><input className="ctrl" type="text" defaultValue="20261" /></div>
              <div className="fg"><div className="lbl">Description <span className="req">*</span></div><input className="ctrl" type="text" defaultValue="Spring 2026" /></div>
              <div className="fg"><div className="lbl">Financial Year <span className="req">*</span></div><input className="ctrl" type="text" defaultValue="2025–26" /></div>
              <div className="fg">
                <div className="lbl">Set As <span className="req">*</span></div>
                <select className="ctrl" defaultValue="Academic Intake (Teaching)"><option>Academic Intake (Teaching)</option><option>Admission Intake (New Students)</option></select>
              </div>
              <div className="fg"><div className="lbl">Semester Start Date <span className="req">*</span></div><input className="ctrl" type="date" defaultValue="2026-02-01" /></div>
              <div className="fg"><div className="lbl">Term 1 End Date <span className="req">*</span></div><input className="ctrl" type="date" defaultValue="2026-03-30" /></div>
              <div className="fg"><div className="lbl">Term 2 End Date / Semester End <span className="req">*</span></div><input className="ctrl" type="date" defaultValue="2026-05-31" /></div>
              <div className="fg"><div className="lbl">Grievance End Date</div><input className="ctrl" type="date" defaultValue="2026-06-10" /></div>
              <div className="fg"><div className="lbl">Re-entry Date</div><input className="ctrl" type="date" /></div>
              <div className="fg"><div className="lbl">Late Fee Start Date</div><input className="ctrl" type="date" defaultValue="2026-06-15" /></div>
            </div>
            <div className="warn-box mt-3"><i className="lni lni-warning"></i> Only one intake can be set as <em>Current Academic</em> and one as <em>Current Admission</em> simultaneously. Setting a new one will deactivate the previous.</div>
            <div className="modal-footer">
              <button className="btn btn-neu" onClick={() => closeModal('intake-edit-modal')}>Cancel</button>
              <button className="btn btn-primary" onClick={() => { closeModal('intake-edit-modal'); showToast('Intake updated successfully.', 'success') }}><i className="lni lni-checkmark"></i> Update Intake</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add / Edit Course Unit Modal ── */}
      {openModals.has('cu-new-modal') && (
        <div className="modal-overlay open" id="cu-new-modal" onClick={() => closeModal('cu-new-modal')}>
          <div className="modal modal-80" onClick={e => e.stopPropagation()}>
            <div className="modal-hdr">
              <div className="modal-title"><i className="lni lni-book"></i> Add / Edit Course Unit</div>
              <button className="modal-close" onClick={() => closeModal('cu-new-modal')}><i className="lni lni-close"></i></button>
            </div>
            <div className="g3">
              <div className="fg"><div className="lbl">Unit Code <span className="req">*</span></div><input className="ctrl" id="cu-code" placeholder="e.g. IT201" /></div>
              <div className="fg span2"><div className="lbl">Unit Name <span className="req">*</span></div><input className="ctrl" id="cu-name" placeholder="e.g. Data Structures and Algorithms" /></div>
              <div className="fg"><div className="lbl">Credits <span className="req">*</span></div><input className="ctrl" id="cu-credits" type="number" placeholder="e.g. 3" min="1" /></div>
              <div className="fg"><div className="lbl">No. of Chapters</div><input className="ctrl" type="number" placeholder="e.g. 8" id="cu-num-chapters" min="1" /></div>
              <div className="fg">
                <div className="lbl">Unit Type <span className="req">*</span></div>
                <select className="ctrl" id="cu-unit-type">
                  <option value="theory">Theory — IA (CW+CBT) + UE</option>
                  <option value="practical">Practical — CW only (no CBT) + Practical UE</option>
                  <option value="combined">Combined — Theory IA (CW+CBT) + Practical UE (no Practical IA)</option>
                  <option value="project">Project — Evaluated after set timeframe</option>
                </select>
              </div>
              <div className="fg">
                <div className="lbl">Unit Category <span className="req">*</span></div>
                <select className="ctrl" id="cu-category">
                  <option value="core">Core — Mandatory for all students</option>
                  <option value="specialization">Specialization — Mandatory for enrolled specialization only</option>
                  <option value="elective">Elective — Batch selects one paper from a set</option>
                </select>
              </div>
            </div>
            {/* Assessment hint panel */}
            <div id="cu-assessment-hint" style={{ margin: '14px 0', padding: '12px 16px', background: 'var(--b50)', border: '1.5px solid var(--b100)', borderRadius: 'var(--rsm)' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--b700)', textTransform: 'uppercase', marginBottom: '8px' }}>Assessment Components for this Unit Type</div>
              <div id="cu-hint-content" style={{ fontSize: '12.5px', color: 'var(--g700)' }}>
                Has <strong>Coursework (CW)</strong>: out of 25 → prorated to 15 &nbsp;|&nbsp; Has <strong>Class Test (CBT)</strong>: out of 50 → prorated to 15 &nbsp;|&nbsp; <strong>University Exam (UE)</strong>: out of 100 → prorated to 70
              </div>
            </div>
            {/* Assessment Weightage */}
            <div className="mdl-section mdl-section--amber">
              <div className="mdl-section-hdr">
                <span className="mdl-section-icon"><i className="lni lni-bar-chart"></i></span>
                <div>
                  <div className="mdl-section-title">Assessment Weightage</div>
                  <div className="mdl-section-sub">Set assessed vs. final-weight marks for each component</div>
                </div>
              </div>
              <div className="g3">
                <div style={{ padding: '12px', background: 'var(--b50)', border: '1px solid var(--b100)', borderRadius: 'var(--rsm)' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--b700)', textAlign: 'center', marginBottom: '8px' }}>COURSEWORK (CW)</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                    <input className="ctrl wt-input" type="number" id="wt-cw-raw" defaultValue={25} min={0} />
                    <span style={{ fontFamily: "'Inter',-apple-system,sans-serif", fontSize: '18px', fontWeight: 800, color: 'var(--b800)' }}>→</span>
                    <input className="ctrl wt-input" type="number" id="wt-cw-final" defaultValue={15} min={0} />
                  </div>
                  <div style={{ fontSize: '10.5px', color: 'var(--g500)', textAlign: 'center', marginTop: '6px' }}>Assessed / Final weight</div>
                </div>
                <div style={{ padding: '12px', background: 'var(--amber-bg)', border: '1px solid var(--amber-bd)', borderRadius: 'var(--rsm)' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--amber)', textAlign: 'center', marginBottom: '8px' }}>CLASS TEST (CBT)</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                    <input className="ctrl wt-input" type="number" id="wt-cbt-raw" defaultValue={50} min={0} />
                    <span style={{ fontFamily: "'Inter',-apple-system,sans-serif", fontSize: '18px', fontWeight: 800, color: 'var(--amber)' }}>→</span>
                    <input className="ctrl wt-input" type="number" id="wt-cbt-final" defaultValue={15} min={0} />
                  </div>
                  <div style={{ fontSize: '10.5px', color: 'var(--g500)', textAlign: 'center', marginTop: '6px' }}>Assessed / Final weight</div>
                </div>
                <div style={{ padding: '12px', background: 'var(--green-bg)', border: '1px solid var(--green-bd)', borderRadius: 'var(--rsm)' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--green)', textAlign: 'center', marginBottom: '8px' }}>UNIVERSITY EXAM</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                    <input className="ctrl wt-input" type="number" id="wt-ue-raw" defaultValue={100} min={0} />
                    <span style={{ fontFamily: "'Inter',-apple-system,sans-serif", fontSize: '18px', fontWeight: 800, color: 'var(--green)' }}>→</span>
                    <input className="ctrl wt-input" type="number" id="wt-ue-final" defaultValue={70} min={0} />
                  </div>
                  <div style={{ fontSize: '10.5px', color: 'var(--g500)', textAlign: 'center', marginTop: '6px' }}>Assessed / Final weight</div>
                </div>
              </div>
              <div id="wt-sum-line" style={{ marginTop: '10px', fontSize: '12px', color: 'var(--g500)', textAlign: 'right' }}>Final weight total: <strong id="wt-sum-val" style={{ color: 'var(--green)' }}>100</strong> / 100</div>
            </div>

            {/* Course Outline */}
            <div className="mdl-section mdl-section--blue">
              <div className="mdl-section-hdr">
                <span className="mdl-section-icon"><i className="lni lni-list"></i></span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="mdl-section-title">Course Outline — Chapters &amp; Topics</div>
                  <div className="mdl-section-sub">Build the syllabus structure for this unit. Auto-numbered — click to rename inline.</div>
                </div>
                <span id="co-current-unit" className="badge badge-blue" style={{ textTransform: 'none', letterSpacing: 0 }}>—</span>
                <button className="btn btn-neu btn-sm" type="button"><i className="lni lni-plus"></i> Add Chapter</button>
              </div>
              <div id="course-outline-body" style={{ marginTop: '4px' }}></div>
            </div>

            {/* Approved Syllabus */}
            <div className="mdl-section mdl-section--green">
              <div className="mdl-section-hdr">
                <span className="mdl-section-icon"><i className="lni lni-files"></i></span>
                <div>
                  <div className="mdl-section-title">Approved Syllabus</div>
                  <div className="mdl-section-sub">Attach the NCHE / UVTOP-approved syllabus document for this unit</div>
                </div>
              </div>
              <div className="file-zone">
                <input type="file" accept=".pdf,.doc,.docx" />
                <div className="file-zone-icon"><i className="lni lni-files"></i></div>
                <p>Upload approved syllabus document (PDF/Word)</p>
                <p style={{ fontSize: '11px', color: 'var(--g400)' }}>Must conform to NCHE or UVTOP accreditation</p>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-neu" onClick={() => closeModal('cu-new-modal')}>Cancel</button>
              <button className="btn btn-primary"><i className="lni lni-checkmark"></i> Save Course Unit</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm Session Movement Modal ── */}
      {openModals.has('confirm-movement-modal') && (
        <div className="modal-overlay open" id="confirm-movement-modal" onClick={() => closeModal('confirm-movement-modal')}>
          <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-hdr">
              <div className="modal-title"><i className="lni lni-warning"></i> Confirm Session Movement</div>
              <button className="modal-close" onClick={() => closeModal('confirm-movement-modal')}><i className="lni lni-close"></i></button>
            </div>
            <div className="danger-box" style={{ marginBottom: '16px' }}><i className="lni lni-volume-high"></i> <span>This will <strong>permanently move 1,247 students</strong> to the next semester and mark <strong>12 students as Dropout</strong>. This action cannot be undone.</span></div>
            <div className="fg" style={{ marginBottom: '16px' }}><div className="lbl">Type CONFIRM to proceed</div><input className="ctrl" type="text" id="sm-confirm-input" placeholder="Type CONFIRM" /></div>
            <div className="modal-footer">
              <button className="btn btn-neu" onClick={() => closeModal('confirm-movement-modal')}>Cancel</button>
              <button className="btn btn-danger"><i className="lni lni-reload"></i> Execute Movement</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Import Allocation Modal ── */}
      {openModals.has('alloc-import-modal') && (
        <div className="modal-overlay open" id="alloc-import-modal" onClick={() => closeModal('alloc-import-modal')}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-hdr">
              <div className="modal-title"><i className="lni lni-download"></i> Import Allocation from Excel</div>
              <button className="modal-close" onClick={() => closeModal('alloc-import-modal')}><i className="lni lni-close"></i></button>
            </div>
            <div className="info-box" style={{ marginBottom: '14px' }}><i className="lni lni-information"></i> Upload the HOD/Dean's Excel allocation sheet. Required columns: <span style={{ fontFamily: 'monospace', background: 'var(--b100)', padding: '2px 5px', borderRadius: '3px', fontSize: '11px' }}>course_code, faculty_name, batch_code, semester</span>. Preview will show before saving.</div>
            <div className="file-zone" style={{ marginBottom: '14px' }} id="alloc-upload-zone">
              <input type="file" accept=".xlsx,.xls,.csv" />
              <div className="file-zone-icon"><i className="lni lni-bar-chart"></i></div>
              <p>Drop Excel file here or click to browse</p>
              <p style={{ fontSize: '11px', color: 'var(--g400)' }}>.xlsx, .xls or .csv · Max 5MB</p>
              <div className="fz-uploaded" id="alloc-upload-status"></div>
            </div>
            <div id="alloc-preview-section" style={{ display: 'none' }}>
              <div className="sec-divider">Preview (8 rows detected)</div>
              <div className="g3" style={{ marginBottom: '12px' }}>
                <div style={{ padding: '10px', background: 'var(--green-bg)', border: '1px solid var(--green-bd)', borderRadius: 'var(--rsm)', textAlign: 'center' }}><div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--green)' }}>VALID ROWS</div><div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--green)' }}>6</div></div>
                <div style={{ padding: '10px', background: 'var(--amber-bg)', border: '1px solid var(--amber-bd)', borderRadius: 'var(--rsm)', textAlign: 'center' }}><div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--amber)' }}>WARNINGS</div><div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--amber)' }}>1</div></div>
                <div style={{ padding: '10px', background: 'var(--red-bg)', border: '1px solid var(--red-bd)', borderRadius: 'var(--rsm)', textAlign: 'center' }}><div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--red)' }}>ERRORS</div><div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--red)' }}>1</div></div>
              </div>
              <div className="import-preview">
                <table>
                  <thead><tr><th>#</th><th>Course Code</th><th>Faculty Name</th><th>Batch Code</th><th>Semester</th><th>Status</th><th>Issue</th></tr></thead>
                  <tbody>
                    <tr className="import-row-ok"><td>1</td><td style={{ fontFamily: 'monospace' }}>IT101</td><td>Dr. Ssekibuule Ronald</td><td>BSC-IT-S1-D</td><td>Sem 1</td><td><span className="badge badge-green"><i className="lni lni-checkmark"></i> Valid</span></td><td>—</td></tr>
                    <tr className="import-row-ok"><td>2</td><td style={{ fontFamily: 'monospace' }}>IT102</td><td>Ms. Namutebi Joyce</td><td>BSC-IT-S1-D</td><td>Sem 1</td><td><span className="badge badge-green"><i className="lni lni-checkmark"></i> Valid</span></td><td>—</td></tr>
                    <tr className="import-row-warn"><td>3</td><td style={{ fontFamily: 'monospace' }}>BBA301</td><td>Dr. Kato Andrew</td><td>BBA-S3-D</td><td>Sem 3</td><td><span className="badge badge-amber"><i className="lni lni-warning"></i> Warning</span></td><td>Faculty not linked to FBM</td></tr>
                    <tr className="import-row-err"><td>4</td><td style={{ fontFamily: 'monospace' }}>BBA999</td><td>Prof. Mukasa Charles</td><td>BBA-S3-D</td><td>Sem 3</td><td><span className="badge badge-red"><i className="lni lni-close"></i> Error</span></td><td>Course code not found</td></tr>
                    <tr className="import-row-ok"><td>5</td><td style={{ fontFamily: 'monospace' }}>MBA101</td><td>Prof. Mukasa Charles</td><td>MBA-S1-E</td><td>Sem 1</td><td><span className="badge badge-green"><i className="lni lni-checkmark"></i> Valid</span></td><td>—</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-neu" onClick={() => closeModal('alloc-import-modal')}>Cancel</button>
              <button className="btn btn-amber btn-sm" id="alloc-download-errors" style={{ display: 'none' }} onClick={() => showToast('Error report downloaded.', 'warn')}><i className="lni lni-download"></i> Download Error Report</button>
              <button className="btn btn-primary" id="alloc-import-btn" style={{ display: 'none' }} onClick={() => { closeModal('alloc-import-modal'); showToast('6 valid allocations saved. 1 warning requires manual review.', 'success') }}><i className="lni lni-checkmark"></i> Import Valid Rows (6)</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Import Timetable Modal ── */}
      {openModals.has('tt-import-modal') && (
        <div className="modal-overlay open" id="tt-import-modal" onClick={() => closeModal('tt-import-modal')}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-hdr">
              <div className="modal-title"><i className="lni lni-download"></i> Import Timetable from Excel</div>
              <button className="modal-close" onClick={() => closeModal('tt-import-modal')}><i className="lni lni-close"></i></button>
            </div>
            <div className="info-box" style={{ marginBottom: '14px' }}><i className="lni lni-information"></i> Required columns: <span style={{ fontFamily: 'monospace', background: 'var(--b100)', padding: '2px 5px', borderRadius: '3px', fontSize: '11px' }}>batch_code, day, start_time, end_time, course_code, type, venue, faculty</span>. System will detect conflicts automatically.</div>
            <div className="file-zone" id="tt-upload-zone" style={{ marginBottom: '14px' }}>
              <input type="file" accept=".xlsx,.xls,.csv" />
              <div className="file-zone-icon"><i className="lni lni-calendar"></i></div>
              <p>Drop timetable Excel file here or click to browse</p>
              <div className="fz-uploaded" id="tt-upload-status"></div>
            </div>
            <div id="tt-preview-section" style={{ display: 'none' }}>
              <div className="sec-divider">Conflict Check Results</div>
              <div className="success-box" style={{ marginBottom: '12px' }}><i className="lni lni-checkmark"></i> <span>18 slots imported. <strong>No conflicts detected</strong>. Preview the visual grid below before saving.</span></div>
              <div className="import-preview">
                <table>
                  <thead><tr><th>Day</th><th>Time</th><th>Course Unit</th><th>Type</th><th>Venue</th><th>Faculty</th><th>Status</th></tr></thead>
                  <tbody>
                    <tr className="import-row-ok"><td>Monday</td><td>08:00–10:00</td><td>IT101 – Intro to Programming</td><td><span className="pill pill-blue">Theory</span></td><td>LR-01</td><td>Dr. Ssekibuule</td><td><span className="badge badge-green"><i className="lni lni-checkmark"></i> OK</span></td></tr>
                    <tr className="import-row-ok"><td>Monday</td><td>10:00–12:00</td><td>IT102 – Computer Org.</td><td><span className="pill pill-blue">Theory</span></td><td>LR-02</td><td>Ms. Namutebi</td><td><span className="badge badge-green"><i className="lni lni-checkmark"></i> OK</span></td></tr>
                    <tr className="import-row-ok"><td>Tuesday</td><td>14:00–16:00</td><td>IT101 – Intro to Programming</td><td><span className="pill pill-cyan">CBT Lab</span></td><td>Lab-A</td><td>Dr. Ssekibuule</td><td><span className="badge badge-green"><i className="lni lni-checkmark"></i> OK</span></td></tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-neu" onClick={() => closeModal('tt-import-modal')}>Cancel</button>
              <button className="btn btn-primary" id="tt-import-btn" style={{ display: 'none' }} onClick={() => { closeModal('tt-import-modal'); showToast('Timetable imported. Visual grid updated.', 'success') }}><i className="lni lni-checkmark"></i> Import &amp; Update Timetable Grid</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Timetable Slot Modal ── */}
      {openModals.has('add-slot-modal') && (
        <div className="modal-overlay open" id="add-slot-modal" onClick={() => closeModal('add-slot-modal')}>
          <div className="modal modal-md" onClick={e => e.stopPropagation()}>
            <div className="modal-hdr">
              <div className="modal-title"><i className="lni lni-calendar"></i> Add Timetable Slot</div>
              <button className="modal-close" onClick={() => closeModal('add-slot-modal')}><i className="lni lni-close"></i></button>
            </div>
            <div className="g2">
              <div className="fg">
                <div className="lbl">Course Unit <span className="req">*</span></div>
                <select className="ctrl" id="slot-cu">
                  <option>IT101 – Intro to Programming</option>
                  <option>IT102 – Computer Org.</option>
                  <option>IT103 – Engineering Maths</option>
                  <option>MBA101 – Managerial Econ.</option>
                </select>
              </div>
              <div className="fg"><div className="lbl">Session Type <span className="req">*</span></div><select className="ctrl"><option>Theory</option><option>Practical</option><option>Tutorial</option><option>CBT/Lab</option></select></div>
              <div className="fg"><div className="lbl">Day <span className="req">*</span></div><select className="ctrl"><option>Monday</option><option>Tuesday</option><option>Wednesday</option><option>Thursday</option><option>Friday</option><option>Saturday</option></select></div>
              <div className="fg"><div className="lbl">Start Time <span className="req">*</span></div><input className="ctrl" type="time" defaultValue="08:00" id="slot-start" /></div>
              <div className="fg"><div className="lbl">End Time <span className="req">*</span></div><input className="ctrl" type="time" defaultValue="10:00" id="slot-end" /></div>
              <div className="fg">
                <div className="lbl">Room / Venue <span className="req">*</span></div>
                <select className="ctrl" id="slot-room">
                  <option value="">-- Select Room --</option>
                  <option value="LR-01">LR-01 (Lecture, cap. 60)</option>
                  <option value="LR-02">LR-02 (Lecture, cap. 60)</option>
                  <option value="Lab-A">Lab-A Linux (Specialist, cap. 40)</option>
                  <option value="Lab-B">Lab-B General (Computer Lab, cap. 40)</option>
                  <option value="Lab-C">Lab-C MBA (Case Room, cap. 30)</option>
                </select>
              </div>
              <div className="fg">
                <div className="lbl">Faculty <span className="req">*</span></div>
                <select className="ctrl" id="slot-faculty">
                  <option value="">-- Select Faculty --</option>
                  <option>Dr. Ssekibuule Ronald</option>
                  <option>Ms. Namutebi Joyce</option>
                  <option>Prof. Mukasa Charles</option>
                  <option>Dr. Tendo Patrick</option>
                  <option>Dr. Kato Andrew</option>
                </select>
              </div>
            </div>
            <div id="slot-clash-result" style={{ display: 'none', margin: '10px 0' }}></div>
            <div className="sec-divider">Combined Batch (Repetition Tag)</div>
            <div className="g2">
              <div className="fg">
                <div className="lbl">Has Repetition Tag?</div>
                <div className="tgl-group">
                  <button className="tgl-btn tgl-active" id="slot-rep-no">No — Single Batch</button>
                  <button className="tgl-btn" id="slot-rep-yes">Yes — Combine Batches</button>
                </div>
              </div>
              <div className="fg" id="slot-rep-batches" style={{ display: 'none' }}>
                <div className="lbl">Include Batches</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px' }}><input type="checkbox" /> BSC-IT-S26-DA</label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px' }}><input type="checkbox" /> BSC-IT-S26-DB</label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px' }}><input type="checkbox" /> BBA-S26-DA</label>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-neu" onClick={() => closeModal('add-slot-modal')}>Cancel</button>
              <button className="btn btn-primary"><i className="lni lni-checkmark"></i> Add &amp; Check Clashes</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add / Update Faculty Skills Modal ── */}
      {openModals.has('add-skill-modal') && (
        <div className="modal-overlay open" id="add-skill-modal" onClick={() => closeModal('add-skill-modal')}>
          <div className="modal modal-md" onClick={e => e.stopPropagation()}>
            <div className="modal-hdr">
              <div className="modal-title"><i className="lni lni-bulb"></i> Add / Update Faculty Skills</div>
              <button className="modal-close" onClick={() => closeModal('add-skill-modal')}><i className="lni lni-close"></i></button>
            </div>
            <div className="fg" style={{ marginBottom: '12px' }}>
              <div className="lbl">Faculty Member <span className="req">*</span></div>
              <select className="ctrl">
                <option>-- Select --</option>
                <option>Dr. Ssekibuule Ronald (FCT)</option>
                <option>Ms. Namutebi Joyce (FCT)</option>
                <option>Prof. Mukasa Charles (FBM)</option>
                <option>Dr. Kibira Moses (FCT)</option>
                <option>Ms. Atim Grace (FBM)</option>
              </select>
            </div>
            <div className="sec-divider">Subject Expertise Areas</div>
            <div id="skill-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '10px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 80px', gap: '8px', alignItems: 'center' }}>
                <input className="ctrl" type="text" placeholder="Skill / Subject area (e.g. Data Structures)" />
                <select className="ctrl"><option>Expert</option><option>Proficient</option><option>Familiar</option></select>
                <button className="btn btn-danger btn-sm"><i className="lni lni-trash-can"></i></button>
              </div>
            </div>
            <button className="btn btn-neu btn-sm" style={{ marginBottom: '12px' }}><i className="lni lni-plus"></i> Add Skill Row</button>
            <div className="info-box"><i className="lni lni-information"></i> Skills are visible to Support Staff performing Course Allocation from the Dean's Excel file.</div>
            <div className="modal-footer">
              <button className="btn btn-neu" onClick={() => closeModal('add-skill-modal')}>Cancel</button>
              <button className="btn btn-primary" onClick={() => { closeModal('add-skill-modal'); showToast('Skills saved. Ready for allocation.', 'success') }}><i className="lni lni-checkmark"></i> Save Skills</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Room Management Modal ── */}
      {openModals.has('room-mgmt-modal') && (
        <div className="modal-overlay open" id="room-mgmt-modal" onClick={() => closeModal('room-mgmt-modal')}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-hdr">
              <div className="modal-title"><i className="lni lni-apartment"></i> Room Management</div>
              <button className="modal-close" onClick={() => closeModal('room-mgmt-modal')}><i className="lni lni-close"></i></button>
            </div>
            <div className="info-box" style={{ marginBottom: '14px' }}><i className="lni lni-information"></i> Allocation prioritises matching <strong>student count to room capacity</strong>. Specialised subjects (e.g. Linux Administration) must only be allocated to specified labs. Rooms are clash-checked against <strong>all batches</strong> simultaneously.</div>
            <div className="tbl-wrap" style={{ marginBottom: '14px' }}>
              <table>
                <thead><tr><th>Room Code</th><th>Room Name</th><th>Capacity</th><th>Type</th><th>Specialised For</th><th>Status</th><th>Action</th></tr></thead>
                <tbody>
                  <tr><td style={{ fontFamily: 'monospace' }}>LR-01</td><td>Lecture Room 1</td><td>60</td><td><span className="badge badge-blue">Lecture</span></td><td>—</td><td><span className="badge badge-green"><i className="lni lni-checkmark"></i> Free</span></td><td><button className="btn btn-neu btn-sm"><i className="lni lni-pencil"></i> Edit</button></td></tr>
                  <tr><td style={{ fontFamily: 'monospace' }}>LR-02</td><td>Lecture Room 2</td><td>60</td><td><span className="badge badge-blue">Lecture</span></td><td>—</td><td><span className="badge badge-amber"><i className="lni lni-warning"></i> Mon 8–10</span></td><td><button className="btn btn-neu btn-sm"><i className="lni lni-pencil"></i> Edit</button></td></tr>
                  <tr><td style={{ fontFamily: 'monospace' }}>Lab-A</td><td>Linux Lab A</td><td>40</td><td><span className="badge badge-purple">Specialist</span></td><td>Linux / OS subjects only</td><td><span className="badge badge-green"><i className="lni lni-checkmark"></i> Free</span></td><td><button className="btn btn-neu btn-sm"><i className="lni lni-pencil"></i> Edit</button></td></tr>
                  <tr><td style={{ fontFamily: 'monospace' }}>Lab-B</td><td>General Computer Lab B</td><td>40</td><td><span className="badge badge-cyan">Computer Lab</span></td><td>—</td><td><span className="badge badge-green"><i className="lni lni-checkmark"></i> Free</span></td><td><button className="btn btn-neu btn-sm"><i className="lni lni-pencil"></i> Edit</button></td></tr>
                </tbody>
              </table>
            </div>
            <div className="g3">
              <div className="fg"><div className="lbl">Room Code <span className="req">*</span></div><input className="ctrl" placeholder="e.g. LR-03" /></div>
              <div className="fg"><div className="lbl">Room Name</div><input className="ctrl" placeholder="e.g. Seminar Room 3" /></div>
              <div className="fg"><div className="lbl">Capacity <span className="req">*</span></div><input className="ctrl" type="number" placeholder="e.g. 45" /></div>
              <div className="fg"><div className="lbl">Type</div><select className="ctrl"><option>Lecture</option><option>Specialist Lab</option><option>Computer Lab</option><option>Case Room</option></select></div>
              <div className="fg span2"><div className="lbl">Specialised For</div><input className="ctrl" placeholder="e.g. Linux Administration, Nursing Practical" /></div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-neu" onClick={() => closeModal('room-mgmt-modal')}>Close</button>
              <button className="btn btn-primary" onClick={() => showToast('Room saved.', 'success')}><i className="lni lni-plus"></i> Add Room</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Faculty Modal ── */}
      {openModals.has('new-faculty-modal') && (
        <div className="modal-overlay open" id="new-faculty-modal" onClick={() => closeModal('new-faculty-modal')}>
          <div className="modal modal-md" onClick={e => e.stopPropagation()}>
            <div className="modal-hdr">
              <div className="modal-title"><i className="lni lni-apartment"></i> Add Faculty</div>
              <button className="modal-close" onClick={() => closeModal('new-faculty-modal')}><i className="lni lni-close"></i></button>
            </div>
            <div className="g2">
              <div className="fg">
                <div className="lbl">Faculty Code <span className="req">*</span></div>
                <input className="ctrl" type="text" id="nf-code" placeholder="e.g. FCT" maxLength={6} style={{ fontFamily: 'monospace', textTransform: 'uppercase' }} />
              </div>
              <div className="fg">
                <div className="lbl">Faculty Name <span className="req">*</span></div>
                <input className="ctrl" type="text" id="nf-name" placeholder="e.g. Faculty of Computing & Technology" />
              </div>
              <div className="fg span2">
                <div className="lbl">Dean <span className="req">*</span></div>
                <input className="ctrl" type="text" id="nf-dean" placeholder="e.g. Dr. Ssekibuule Ronald" />
              </div>
              <div className="fg">
                <div className="lbl">Programmes Count</div>
                <input className="ctrl" type="number" min={0} id="nf-progs" defaultValue={0} />
              </div>
              <div className="fg">
                <div className="lbl">Course Units Count</div>
                <input className="ctrl" type="number" min={0} id="nf-units" defaultValue={0} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-neu" onClick={() => closeModal('new-faculty-modal')}>Cancel</button>
              <button className="btn btn-primary"><i className="lni lni-checkmark"></i> Add Faculty</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Lecturer Modal ── */}
      {openModals.has('new-lecturer-modal') && (
        <div className="modal-overlay open" id="new-lecturer-modal" onClick={() => closeModal('new-lecturer-modal')}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-hdr">
              <div className="modal-title"><i className="lni lni-user"></i> Add Lecturer</div>
              <button className="modal-close" onClick={() => closeModal('new-lecturer-modal')}><i className="lni lni-close"></i></button>
            </div>
            <div className="sec-divider">Personal &amp; Contact</div>
            <div className="g3">
              <div className="fg">
                <div className="lbl">Salutation</div>
                <select className="ctrl" id="nl-title"><option>Dr.</option><option>Prof.</option><option>Mr.</option><option>Ms.</option><option>Mrs.</option></select>
              </div>
              <div className="fg"><div className="lbl">First Name <span className="req">*</span></div><input className="ctrl" type="text" id="nl-fname" placeholder="First name" /></div>
              <div className="fg"><div className="lbl">Last Name <span className="req">*</span></div><input className="ctrl" type="text" id="nl-lname" placeholder="Last name" /></div>
              <div className="fg"><div className="lbl">University Email</div><input className="ctrl" type="email" id="nl-email" placeholder="auto-generated" /></div>
              <div className="fg">
                <div className="lbl">Phone</div>
                <div className="inp-wrap">
                  <span className="inp-icon"><i className="lni lni-phone"></i></span>
                  <input className="ctrl" type="tel" id="nl-phone" placeholder="+256 700 000 000" />
                </div>
              </div>
              <div className="fg">
                <div className="lbl">Designation <span className="req">*</span></div>
                <select className="ctrl" id="nl-desig">
                  <option>Professor</option>
                  <option>Associate Professor</option>
                  <option defaultValue="Senior Lecturer">Senior Lecturer</option>
                  <option>Lecturer</option>
                  <option>Assistant Lecturer</option>
                  <option>Teaching Assistant</option>
                </select>
              </div>
            </div>
            <div className="sec-divider">Qualification Details</div>
            <div className="g3">
              <div className="fg">
                <div className="lbl">Highest Qualification <span className="req">*</span></div>
                <select className="ctrl" id="nl-qual">
                  <option>PhD</option><option>Master&apos;s Degree</option><option>Bachelor&apos;s Degree</option><option>Postgraduate Diploma</option>
                </select>
              </div>
              <div className="fg"><div className="lbl">Field of Study <span className="req">*</span></div><input className="ctrl" type="text" id="nl-field" placeholder="e.g. Computer Science" /></div>
              <div className="fg"><div className="lbl">Year of Completion</div><input className="ctrl" type="number" min={1980} max={2030} id="nl-year" placeholder="2020" /></div>
              <div className="fg span2"><div className="lbl">Institution <span className="req">*</span></div><input className="ctrl" type="text" id="nl-inst" placeholder="e.g. Makerere University" /></div>
              <div className="fg"><div className="lbl">Years of Experience</div><input className="ctrl" type="number" min={0} max={60} id="nl-exp" defaultValue={0} /></div>
              <div className="fg span3"><div className="lbl">Specialisation Areas</div><input className="ctrl" type="text" id="nl-spec" placeholder="e.g. Machine Learning, Algorithms, Databases" /></div>
            </div>
            <div className="sec-divider">Affiliation</div>
            <div className="g2">
              <div className="fg">
                <div className="lbl">Faculty <span className="req">*</span></div>
                <select className="ctrl" id="nl-faculty">
                  <option>Faculty of Computing &amp; Technology</option>
                  <option>Faculty of Business &amp; Management</option>
                  <option>Faculty of Engineering</option>
                </select>
              </div>
              <div className="fg">
                <div className="lbl">Status</div>
                <select className="ctrl" id="nl-status">
                  <option>Active</option><option>On Leave</option><option>Visiting</option><option>Suspended</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-neu" onClick={() => closeModal('new-lecturer-modal')}>Cancel</button>
              <button className="btn btn-primary"><i className="lni lni-checkmark"></i> Add Lecturer</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add / Edit Programme Level Modal ── */}
      {openModals.has('new-alevel-modal') && (
        <div className="modal-overlay open" id="new-alevel-modal" onClick={() => closeModal('new-alevel-modal')}>
          <div className="modal modal-md" onClick={e => e.stopPropagation()}>
            <div className="modal-hdr">
              <div className="modal-title"><i className="lni lni-graduation"></i> Add / Edit Programme Level</div>
              <button className="modal-close" onClick={() => closeModal('new-alevel-modal')}><i className="lni lni-close"></i></button>
            </div>
            <div className="g2">
              <div className="fg"><div className="lbl">Level Code <span className="req">*</span></div><input className="ctrl" placeholder="e.g. BACH" /></div>
              <div className="fg"><div className="lbl">Level Name <span className="req">*</span></div><input className="ctrl" placeholder="e.g. Bachelor's Degree" /></div>
              <div className="fg"><div className="lbl">Year Count <span className="req">*</span></div><input className="ctrl" type="number" placeholder="e.g. 3" min={1} max={10} /></div>
              <div className="fg"><div className="lbl">Semester Count <span className="req">*</span></div><input className="ctrl" type="number" placeholder="e.g. 6" min={1} max={20} /></div>
              <div className="fg"><div className="lbl">Minimum Credit Load <span className="req">*</span></div><input className="ctrl" type="number" placeholder="e.g. 132" min={0} /></div>
              <div className="fg">
                <div className="lbl">No Internal Assessment?</div>
                <div className="tgl-group">
                  <button className="tgl-btn tgl-active">No (Standard)</button>
                  <button className="tgl-btn">Yes (e.g. PhD)</button>
                </div>
              </div>
            </div>
            <div className="info-box mt-3"><i className="lni lni-information"></i> These values auto-populate the Programme Master when this level is selected.</div>
            <div className="modal-footer">
              <button className="btn btn-neu" onClick={() => closeModal('new-alevel-modal')}>Cancel</button>
              <button className="btn btn-primary" onClick={() => { closeModal('new-alevel-modal'); showToast('Programme Level saved.', 'success') }}><i className="lni lni-checkmark"></i> Save Level</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Programme Group Modal ── */}
      {openModals.has('new-proggroup-modal') && (
        <div className="modal-overlay open" id="new-proggroup-modal" onClick={() => closeModal('new-proggroup-modal')}>
          <div className="modal modal-md" onClick={e => e.stopPropagation()}>
            <div className="modal-hdr">
              <div className="modal-title"><i className="lni lni-folder"></i> Add Programme Group</div>
              <button className="modal-close" onClick={() => closeModal('new-proggroup-modal')}><i className="lni lni-close"></i></button>
            </div>
            <div className="g2">
              <div className="fg"><div className="lbl">Group Code <span className="req">*</span></div><input className="ctrl" placeholder="e.g. BCA" /></div>
              <div className="fg"><div className="lbl">Group Name <span className="req">*</span></div><input className="ctrl" placeholder="e.g. Bachelor of Computer Applications" /></div>
              <div className="fg span2">
                <div className="lbl">Programme Level <span className="req">*</span></div>
                <select className="ctrl"><option>Bachelor&apos;s Degree</option><option>Master&apos;s Degree</option><option>PhD</option><option>Diploma</option><option>Certificate / HEC</option><option>Engineering</option></select>
              </div>
            </div>
            <div className="info-box mt-3"><i className="lni lni-information"></i> The Programme Group is used for aggregate reporting across all curriculum versions. E.g. searching &quot;BCA&quot; returns students from BCA 2026 and BCA 2031.</div>
            <div className="modal-footer">
              <button className="btn btn-neu" onClick={() => closeModal('new-proggroup-modal')}>Cancel</button>
              <button className="btn btn-primary" onClick={() => { closeModal('new-proggroup-modal'); showToast('Programme Group saved.', 'success') }}><i className="lni lni-checkmark"></i> Save Group</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Programme Version Modal ── */}
      {openModals.has('new-prog-modal') && (
        <div className="modal-overlay open" id="new-prog-modal" onClick={() => closeModal('new-prog-modal')}>
          <div className="modal modal-80 modal-flex" onClick={e => e.stopPropagation()}>
            <div className="modal-hdr">
              <div className="modal-title"><i className="lni lni-graduation"></i> <span id="prog-modal-title">Add Programme Version</span></div>
              <button className="modal-close" onClick={() => closeModal('new-prog-modal')}><i className="lni lni-close"></i></button>
            </div>
            {/* Step indicator */}
            <div className="prog-steps">
              <div className="prog-step active" id="prog-step-1-pill"><span className="prog-step-num">1</span><span>Programme Details</span></div>
              <div className="prog-step-line"></div>
              <div className="prog-step" id="prog-step-2-pill"><span className="prog-step-num">2</span><span>Course Unit Allocation</span></div>
              <div className="prog-step-line"></div>
              <div className="prog-step" id="prog-step-3-pill"><span className="prog-step-num">3</span><span>Semester-wise Fee Structure</span></div>
            </div>
            <div className="modal-scroll">
              {/* Step 1 */}
              <div id="prog-step-1">
                <div className="g3">
                  <div className="fg"><div className="lbl">Programme Code <span className="req">*</span></div><input className="ctrl" placeholder="e.g. BCA-2031" /></div>
                  <div className="fg span2"><div className="lbl">Programme Name <span className="req">*</span></div><input className="ctrl" placeholder="e.g. Bachelor of Computer Applications 2031" /></div>
                  <div className="fg">
                    <div className="lbl">Programme Group <span className="req">*</span></div>
                    <select className="ctrl"><option>BCA</option><option>BBA</option><option>MBA</option><option>BEng</option></select>
                  </div>
                  <div className="fg span2">
                    <div className="lbl">Programme Level (auto-fills year/sem/credits)</div>
                    <select className="ctrl" id="prog-alevel">
                      <option value="6" data-years="3" data-credits="132" data-label="Bachelor's Degree">Bachelor&apos;s Degree (3yr / 6sem / 132cr)</option>
                      <option value="4" data-years="2" data-credits="72" data-label="Master's Degree">Master&apos;s Degree (2yr / 4sem / 72cr)</option>
                      <option value="6" data-years="3" data-credits="0" data-label="PhD">PhD (3yr / 6sem / 0cr — No IA)</option>
                      <option value="8" data-years="4" data-credits="160" data-label="Engineering">Engineering (4yr / 8sem / 160cr)</option>
                      <option value="4" data-years="2" data-credits="72" data-label="Diploma">Diploma (2yr / 4sem / 72cr)</option>
                    </select>
                    <div id="prog-alevel-info" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                      <span className="lvl-chip"><span className="lvl-chip-lbl">No. of Years</span><span className="lvl-chip-val" id="lvl-years">3</span></span>
                      <span className="lvl-chip"><span className="lvl-chip-lbl">No. of Semesters</span><span className="lvl-chip-val" id="lvl-semesters">6</span></span>
                      <span className="lvl-chip"><span className="lvl-chip-lbl">Min. Credits</span><span className="lvl-chip-val" id="lvl-credits">132</span></span>
                    </div>
                  </div>
                  <div className="fg">
                    <div className="lbl">Campus <span className="req">*</span></div>
                    <select className="ctrl" id="prog-campus">
                      <option value="main">Main Campus — Kampala</option>
                      <option value="kampala-city">Kampala City Campus</option>
                      <option value="mukono">Mukono Campus</option>
                      <option value="jinja">Jinja Campus</option>
                      <option value="online">Online / ODL Hub</option>
                    </select>
                  </div>
                  <div className="fg">
                    <div className="lbl">Faculty <span className="req">*</span></div>
                    <select className="ctrl" id="prog-faculty">
                      <option value="FCT">FCT — Faculty of Computing &amp; Technology</option>
                      <option value="FBM">FBM — Faculty of Business &amp; Management</option>
                      <option value="FEN">FEN — Faculty of Engineering</option>
                      <option value="FHS">FHS — Faculty of Health Sciences</option>
                      <option value="FED">FED — Faculty of Education</option>
                      <option value="FLA">FLA — Faculty of Liberal Arts</option>
                    </select>
                    <div id="prog-faculty-hint" style={{ fontSize: '11px', color: 'var(--g500)', marginTop: '5px' }}>Showing faculties at <strong>Main Campus</strong></div>
                  </div>
                  <div className="fg span2">
                    <div className="lbl">Application Fee <span className="req">*</span></div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <select className="ctrl" id="prog-app-fee-preset" style={{ flex: 1 }}>
                        <option value="50000" data-cur="UGX">UGX 50,000 — Standard (Direct)</option>
                        <option value="100000" data-cur="UGX">UGX 100,000 — Postgraduate</option>
                        <option value="30000" data-cur="UGX">UGX 30,000 — Diploma / Certificate</option>
                        <option value="50" data-cur="USD">USD 50 — ODL / International</option>
                        <option value="100" data-cur="USD">USD 100 — ODL Postgraduate</option>
                        <option value="0" data-cur="UGX">Waived (HTC / Scholarship)</option>
                        <option value="custom" data-cur="UGX">Custom — enter manually</option>
                      </select>
                      <input className="ctrl" id="prog-app-fee-amount" type="number" min={0} defaultValue={50000} style={{ width: '120px', fontWeight: 700 }} />
                      <select className="ctrl" id="prog-app-fee-cur" style={{ width: '78px' }}>
                        <option value="UGX">UGX</option>
                        <option value="USD">USD</option>
                        <option value="KES">KES</option>
                      </select>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--g500)', marginTop: '5px' }}>Pre-loaded from Fee Master. Override per programme if needed.</div>
                  </div>
                  <div className="fg span3">
                    <div className="g2">
                      <div className="fg" style={{ margin: 0 }}><div className="lbl">Accreditation Date <span className="req">*</span></div><input className="ctrl" type="date" /></div>
                      <div className="fg" style={{ margin: 0 }}><div className="lbl">Accreditation Expiry Date</div><input className="ctrl" type="date" /></div>
                    </div>
                  </div>
                  <div className="fg span3">
                    <div className="lbl">Accreditation Letter</div>
                    <div className="file-zone" style={{ padding: '14px' }}>
                      <input type="file" accept=".pdf" />
                      <div className="file-zone-icon"><i className="lni lni-files"></i></div>
                      <p>Upload NCHE / UVTOP accreditation letter (PDF)</p>
                    </div>
                  </div>
                </div>
                <div className="sec-divider">Programme Specializations <span style={{ fontSize: '10.5px', fontWeight: 500, color: 'var(--g400)', textTransform: 'none', letterSpacing: 0, marginLeft: '8px' }}>Optional · A student can pick one specialization which dictates their specialization course units</span></div>
                <div style={{ background: '#fafbfd', border: '1.5px solid var(--g200)', borderRadius: 'var(--rsm)', padding: '14px 16px', marginBottom: '14px' }}>
                  <div id="prog-spec-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '10px' }}></div>
                  <button className="btn btn-neu btn-sm"><i className="lni lni-plus"></i> Add Specialization</button>
                  <div id="prog-spec-empty" style={{ fontSize: '12px', color: 'var(--g500)', fontStyle: 'italic', marginTop: '6px' }}>No specializations added — this programme will run as a single track.</div>
                </div>
                <div className="sec-divider">Status &amp; Flags</div>
                <div className="g3">
                  <div className="fg">
                    <div className="lbl">Admission Status <span className="req">*</span></div>
                    <div className="tgl-group">
                      <button className="tgl-btn tgl-active"><i className="lni lni-checkmark"></i> Active (New admissions)</button>
                      <button className="tgl-btn">Inactive (Existing students only)</button>
                    </div>
                  </div>
                  <div className="fg">
                    <div className="lbl">No Internal Assessment?</div>
                    <div className="tgl-group">
                      <button className="tgl-btn tgl-active">No (Standard)</button>
                      <button className="tgl-btn">Yes (e.g. PhD)</button>
                    </div>
                  </div>
                </div>
                <div className="warn-box mt-3"><i className="lni lni-warning"></i> Setting this version to <em>Active</em> will make it available for new admissions. Ensure the old version (if any) is set to <em>Inactive</em> first. Old curricula are preserved for existing students.</div>
              </div>
              {/* Step 2 */}
              <div id="prog-step-2" style={{ display: 'none' }}>
                <div className="mdl-section mdl-section--blue">
                  <div className="mdl-section-hdr">
                    <span className="mdl-section-icon"><i className="lni lni-book"></i></span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="mdl-section-title">Allocate Course Units by Semester</div>
                      <div className="mdl-section-sub">Assign course units to each semester. Pick from the curriculum master or add a quick placeholder.</div>
                    </div>
                    <span id="prog-sem-summary" className="badge badge-blue" style={{ textTransform: 'none', letterSpacing: 0 }}>—</span>
                  </div>
                  <div id="prog-sem-allocation-body"></div>
                </div>
              </div>
              {/* Step 3 */}
              <div id="prog-step-3" style={{ display: 'none' }}>
                <div className="mdl-section mdl-section--blue">
                  <div className="mdl-section-hdr">
                    <span className="mdl-section-icon"><i className="lni lni-dollar"></i></span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="mdl-section-title">Define Fee Items by Semester</div>
                      <div className="mdl-section-sub">Add fee items per semester with custom titles (e.g. Tuition Fee, Semester Entry Fee, Lab Fee). Within a semester, items are auto-settled by priority.</div>
                    </div>
                    <span id="prog-fee-summary" className="badge badge-blue" style={{ textTransform: 'none', letterSpacing: 0 }}>—</span>
                  </div>
                  <div className="g3" style={{ marginBottom: '14px' }}>
                    <div className="fg" style={{ margin: 0 }}>
                      <div className="lbl">Base Currency</div>
                      <select className="ctrl" id="prog-fee-currency">
                        <option value="UGX">UGX (Ugandan Shilling)</option>
                        <option value="USD">USD (US Dollar)</option>
                        <option value="KES">KES (Kenyan Shilling)</option>
                      </select>
                    </div>
                    <div className="fg" style={{ margin: 0 }}>
                      <div className="lbl">Student Type</div>
                      <select className="ctrl" id="prog-fee-stu-type">
                        <option>Local</option>
                        <option>International</option>
                      </select>
                    </div>
                    <div className="fg" style={{ margin: 0 }}>
                      <div className="lbl">Quick Template</div>
                      <select className="ctrl">
                        <option value="">— Apply a template —</option>
                        <option value="basic">Basic (Tuition + Entry)</option>
                        <option value="standard">Standard (Tuition + Entry + Lab)</option>
                        <option value="full">Full (Tuition + Entry + Lab + Library + Admission)</option>
                        <option value="clear">Clear all fee items</option>
                      </select>
                    </div>
                  </div>
                  {/* Programme-level Fees & Discounts */}
                  <div style={{ background: 'linear-gradient(135deg,#f0f5ff 0%,var(--white) 70%)', border: '1.5px dashed var(--b200)', borderRadius: 'var(--rsm)', padding: '14px 16px', marginBottom: '18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: '#2d448f', marginBottom: '12px' }}>
                      <i className="lni lni-tag" style={{ fontSize: '14px' }}></i>
                      <span>Programme-level Fees &amp; Discounts</span>
                      <span className="badge badge-blue" style={{ textTransform: 'none', letterSpacing: 0, fontWeight: 600, marginLeft: 'auto' }}>Applied across all semesters</span>
                    </div>
                    <div className="g2">
                      <div className="fg" style={{ margin: 0 }}>
                        <div className="lbl">Lumpsum Discount Calculation Type</div>
                        <select className="ctrl" id="prog-lumpsum-type">
                          <option value="amount">Amount</option>
                          <option value="percentage">Percentage</option>
                        </select>
                      </div>
                      <div className="fg" style={{ margin: 0 }}>
                        <div className="lbl" id="prog-lumpsum-lbl">Lumpsum Discount Amount</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span id="prog-lumpsum-prefix" style={{ fontSize: '12px', color: 'var(--g500)', fontWeight: 700, minWidth: '28px', textAlign: 'center' }}>UGX</span>
                          <input className="ctrl" type="number" id="prog-lumpsum-value" placeholder="0" min={0} style={{ flex: 1 }} />
                          <span id="prog-lumpsum-suffix" style={{ display: 'none', fontSize: '15px', color: 'var(--g500)', fontWeight: 800 }}>%</span>
                        </div>
                      </div>
                    </div>
                    <div className="g3" style={{ marginTop: '12px' }}>
                      <div className="fg span2" style={{ margin: 0 }}><div className="lbl">Lateral Entry Fee</div><input className="ctrl" type="number" id="prog-lateral-fee" placeholder="0" min={0} /></div>
                      <div className="fg" style={{ margin: 0 }}><div className="lbl">Currency</div><select className="ctrl" id="prog-lateral-cur"><option>UGX</option><option>USD</option><option>KES</option></select></div>
                      <div className="fg span2" style={{ margin: 0 }}><div className="lbl">Credit Exemption Fee</div><input className="ctrl" type="number" id="prog-ce-fee" placeholder="0" min={0} /></div>
                      <div className="fg" style={{ margin: 0 }}><div className="lbl">Currency</div><select className="ctrl" id="prog-ce-cur"><option>UGX</option><option>USD</option><option>KES</option></select></div>
                      <div className="fg span2" style={{ margin: 0 }}><div className="lbl">Aptech Credit Exemption Fee</div><input className="ctrl" type="number" id="prog-ace-fee" placeholder="0" min={0} /></div>
                      <div className="fg" style={{ margin: 0 }}><div className="lbl">Currency</div><select className="ctrl" id="prog-ace-cur"><option>UGX</option><option>USD</option><option>KES</option></select></div>
                    </div>
                  </div>
                  <div id="prog-sem-fee-body"></div>
                </div>
              </div>
            </div>
            <div className="modal-footer" id="prog-modal-footer">
              <button className="btn btn-neu" onClick={() => closeModal('new-prog-modal')}>Cancel</button>
              <span style={{ flex: 1 }}></span>
              <button className="btn btn-neu" id="prog-back-btn" style={{ display: 'none' }}><i className="lni lni-arrow-left"></i> <span id="prog-back-lbl">Back</span></button>
              <button className="btn btn-primary" id="prog-save-continue-btn"><span id="prog-cont-lbl">Save &amp; Continue</span> <i className="lni lni-arrow-right"></i></button>
              <button className="btn btn-primary" id="prog-final-save-btn" style={{ display: 'none' }}><i className="lni lni-checkmark"></i> Save Programme</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Manage Specializations Modal ── */}
      {openModals.has('specialization-modal') && (
        <div className="modal-overlay open" id="specialization-modal" onClick={() => closeModal('specialization-modal')}>
          <div className="modal modal-md" onClick={e => e.stopPropagation()}>
            <div className="modal-hdr">
              <div className="modal-title"><i className="lni lni-target"></i> Manage Specializations — MBA 2024</div>
              <button className="modal-close" onClick={() => closeModal('specialization-modal')}><i className="lni lni-close"></i></button>
            </div>
            <div className="info-box" style={{ marginBottom: '14px' }}><i className="lni lni-information"></i> Specializations are chosen by <strong>individual students</strong> (not the batch). A student can only select one specialization, which dictates which Specialization course units they must study (e.g. from Sem 3 for MBA).</div>
            <div className="tbl-wrap" style={{ marginBottom: '14px' }}>
              <table>
                <thead><tr><th>#</th><th>Specialization Name</th><th>Start Semester</th><th>Students Enrolled</th><th>Action</th></tr></thead>
                <tbody>
                  <tr><td>1</td><td><strong>Finance Management</strong></td><td>Sem 3</td><td>42</td><td><button className="btn btn-neu btn-sm"><i className="lni lni-pencil"></i> Edit</button></td></tr>
                  <tr><td>2</td><td><strong>Operations Management</strong></td><td>Sem 3</td><td>38</td><td><button className="btn btn-neu btn-sm"><i className="lni lni-pencil"></i> Edit</button></td></tr>
                  <tr><td>3</td><td><strong>Human Resource Management</strong></td><td>Sem 3</td><td>27</td><td><button className="btn btn-neu btn-sm"><i className="lni lni-pencil"></i> Edit</button></td></tr>
                </tbody>
              </table>
            </div>
            <div className="g2">
              <div className="fg"><div className="lbl">New Specialization Name</div><input className="ctrl" placeholder="e.g. Digital Marketing" /></div>
              <div className="fg"><div className="lbl">Starts from Semester</div><select className="ctrl"><option>Sem 3</option><option>Sem 4</option><option>Sem 5</option></select></div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-neu" onClick={() => closeModal('specialization-modal')}>Close</button>
              <button className="btn btn-primary" onClick={() => showToast('Specialization added.', 'success')}><i className="lni lni-plus"></i> Add Specialization</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Elective Select Modal ── */}
      {openModals.has('elective-select-modal') && (
        <div className="modal-overlay open" id="elective-select-modal" onClick={() => closeModal('elective-select-modal')}>
          <div className="modal modal-md" onClick={e => e.stopPropagation()}>
            <div className="modal-hdr">
              <div className="modal-title"><i className="lni lni-bar-chart"></i> Select Elective Paper — Batch BSC-IT-S26-DA · Sem 5</div>
              <button className="modal-close" onClick={() => closeModal('elective-select-modal')}><i className="lni lni-close"></i></button>
            </div>
            <div className="info-box" style={{ marginBottom: '14px' }}><i className="lni lni-information"></i> Elective selection is a <strong>batch-level decision</strong> — once selected, <strong>all students</strong> in this batch must study the chosen paper for this academic session. The selection can only be made once per session.</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px', border: '1.5px solid var(--g200)', borderRadius: 'var(--rsm)', cursor: 'pointer', transition: 'var(--tr)' }}>
                <input type="radio" name="elective" style={{ marginTop: '2px', flexShrink: 0 }} />
                <div><div className="font-bold">Radar Navigation Systems</div><div style={{ fontSize: '12px', color: 'var(--g500)' }}>3 Credits · Theory · CW + CBT + UE</div></div>
              </label>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px', border: '1.5px solid var(--g200)', borderRadius: 'var(--rsm)', cursor: 'pointer', transition: 'var(--tr)' }}>
                <input type="radio" name="elective" style={{ marginTop: '2px', flexShrink: 0 }} />
                <div><div className="font-bold">Renewable Energy Systems</div><div style={{ fontSize: '12px', color: 'var(--g500)' }}>3 Credits · Combined · CW + CBT + UE + Practical</div></div>
              </label>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px', border: '1.5px solid var(--g200)', borderRadius: 'var(--rsm)', cursor: 'pointer', transition: 'var(--tr)' }}>
                <input type="radio" name="elective" style={{ marginTop: '2px', flexShrink: 0 }} />
                <div><div className="font-bold">Remote Sensing &amp; GIS</div><div style={{ fontSize: '12px', color: 'var(--g500)' }}>3 Credits · Theory · CW + CBT + UE</div></div>
              </label>
            </div>
            <div className="warn-box"><i className="lni lni-warning"></i> This selection is final for this session. All 80 students in BSC-IT-S26-DA will be enrolled in the selected paper.</div>
            <div className="modal-footer">
              <button className="btn btn-neu" onClick={() => closeModal('elective-select-modal')}>Cancel</button>
              <button className="btn btn-primary" onClick={() => { closeModal('elective-select-modal'); showToast('Elective paper selected for batch. Curriculum updated.', 'success') }}><i className="lni lni-checkmark"></i> Confirm Elective Selection</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Create New Batch Modal ── */}
      {openModals.has('new-batch-modal') && (
        <div className="modal-overlay open" id="new-batch-modal" onClick={() => closeModal('new-batch-modal')}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-hdr">
              <div className="modal-title"><i className="lni lni-users"></i> Create New Batch</div>
              <button className="modal-close" onClick={() => closeModal('new-batch-modal')}><i className="lni lni-close"></i></button>
            </div>
            <div className="g3">
              <div className="fg">
                <div className="lbl">Programme Version <span className="req">*</span></div>
                <select className="ctrl" id="nb-prog">
                  <option value="BSC-IT">BSc. IT 2026 (BCA-2026)</option>
                  <option value="BBA">BBA 2021 (BBA-2021)</option>
                  <option value="MBA">MBA 2024 (MBA-2024)</option>
                </select>
              </div>
              <div className="fg">
                <div className="lbl">Intake / Session <span className="req">*</span></div>
                <select className="ctrl" id="nb-session">
                  <option value="S26">Spring 2026 (S26)</option>
                  <option value="F26">Fall 2026 (F26)</option>
                </select>
              </div>
              <div className="fg">
                <div className="lbl">Batch Type <span className="req">*</span></div>
                <select className="ctrl" id="nb-type">
                  <option value="D">Day</option>
                  <option value="E">Evening</option>
                  <option value="W">Weekend (Masters/PhD only)</option>
                  <option value="O">Distance/Online</option>
                </select>
              </div>
              <div className="fg">
                <div className="lbl">Sub-batch <span className="req">*</span></div>
                <select className="ctrl" id="nb-sub">
                  <option value="A">A (first)</option>
                  <option value="B">B (second)</option>
                  <option value="C">C (third)</option>
                </select>
              </div>
              <div className="fg">
                <div className="lbl">Starting Semester <span className="req">*</span></div>
                <select className="ctrl">
                  <option>Semester 1 (Regular Entry)</option>
                  <option>Semester 2 (Lateral Entry)</option>
                  <option>Semester 3 (Credit Exemption)</option>
                </select>
              </div>
              <div className="fg"><div className="lbl">Expected Student Count</div><input className="ctrl" type="number" placeholder="e.g. 42" min={1} /></div>
            </div>
            <div style={{ margin: '14px 0', padding: '14px', background: 'var(--b50)', border: '1.5px solid var(--b200)', borderRadius: 'var(--rsm)', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--g500)', textTransform: 'uppercase' }}>Auto-Generated Batch Code:</span>
              <span id="nb-code-preview" style={{ fontFamily: 'monospace', fontSize: '18px', fontWeight: 800, color: 'var(--b800)' }}>BSC-IT-S26-DA</span>
            </div>
            <div className="fg">
              <div className="lbl">Batch In-Charge (Faculty) <span className="req">*</span></div>
              <select className="ctrl">
                <option>-- Select Faculty Member --</option>
                <option>Dr. Ssekibuule Ronald</option>
                <option>Ms. Namutebi Joyce</option>
                <option>Prof. Mukasa Charles</option>
                <option>Dr. Tendo Patrick</option>
                <option>Dr. Kato Andrew</option>
              </select>
            </div>
            <div className="info-box mt-3"><i className="lni lni-information"></i> Batch In-Charge can view batch-level reports but has no direct relation to programme course content.</div>
            <div className="modal-footer">
              <button className="btn btn-neu" onClick={() => closeModal('new-batch-modal')}>Cancel</button>
              <button className="btn btn-primary" onClick={() => { closeModal('new-batch-modal'); showToast('Batch created successfully.', 'success') }}><i className="lni lni-checkmark"></i> Create Batch</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add / Edit Fee Item Modal ── */}
      {openModals.has('new-fee-item-modal') && (
        <div className="modal-overlay open" id="new-fee-item-modal" onClick={() => closeModal('new-fee-item-modal')}>
          <div className="modal modal-md" onClick={e => e.stopPropagation()}>
            <div className="modal-hdr">
              <div className="modal-title"><i className="lni lni-dollar"></i> Add / Edit Fee Item</div>
              <button className="modal-close" onClick={() => closeModal('new-fee-item-modal')}><i className="lni lni-close"></i></button>
            </div>
            <div className="info-box" style={{ marginBottom: '14px' }}>
              <i className="lni lni-bulb"></i> <span>Give the fee item a clear, user-friendly title (e.g. <em>Tuition Fee</em>, <em>Semester Entry Fee</em>, <em>Lab Fee</em>). Priority controls auto-settlement order within the semester.</span>
            </div>
            <div className="g2">
              <div className="fg">
                <div className="lbl">Semester <span className="req">*</span></div>
                <select className="ctrl">
                  <option>Semester 1 — Year 1</option>
                  <option>Semester 2 — Year 1</option>
                  <option>Semester 3 — Year 2</option>
                  <option>Semester 4 — Year 2</option>
                  <option>Semester 5 — Year 3</option>
                  <option>Semester 6 — Year 3</option>
                </select>
              </div>
              <div className="fg">
                <div className="lbl">Priority <span className="req">*</span></div>
                <select className="ctrl">
                  <option>P1 — Cleared first</option>
                  <option>P2</option>
                  <option>P3</option>
                  <option>P4</option>
                  <option>P5</option>
                  <option>P6</option>
                </select>
              </div>
              <div className="fg span2">
                <div className="lbl">Fee Item Title <span className="req">*</span></div>
                <input className="ctrl" type="text" placeholder="e.g. Tuition Fee, Semester Entry Fee, Lab Fee..." />
              </div>
              <div className="fg">
                <div className="lbl">Amount <span className="req">*</span></div>
                <input className="ctrl" type="number" placeholder="0" />
              </div>
              <div className="fg">
                <div className="lbl">Currency</div>
                <input className="ctrl" type="text" defaultValue="UGX" readOnly style={{ background: 'var(--g100)', fontWeight: 600 }} />
              </div>
              <div className="fg span2">
                <div className="lbl">Short Description / Note</div>
                <input className="ctrl" type="text" placeholder="e.g. 50% needed for assessment · 100% for progression" />
              </div>
              <div className="fg span2">
                <div className="lbl">Behavior</div>
                <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', fontSize: '12.5px', color: 'var(--g700)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}><input type="checkbox" defaultChecked /> Required for registration</label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}><input type="checkbox" /> One-time (not repeated each semester)</label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}><input type="checkbox" /> Refundable</label>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-neu" onClick={() => closeModal('new-fee-item-modal')}>Cancel</button>
              <button className="btn btn-primary" onClick={() => { closeModal('new-fee-item-modal'); showToast('Fee item saved.', 'success') }}><i className="lni lni-checkmark"></i> Save Fee Item</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add / Edit Fee Structure Modal ── */}
      {openModals.has('new-fee-structure-modal') && (
        <div className="modal-overlay open" id="new-fee-structure-modal" onClick={() => closeModal('new-fee-structure-modal')}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-hdr">
              <div className="modal-title"><i className="lni lni-dollar"></i> Add / Edit Fee Structure</div>
              <button className="modal-close" onClick={() => closeModal('new-fee-structure-modal')}><i className="lni lni-close"></i></button>
            </div>
            <div className="g3">
              <div className="fg">
                <div className="lbl">Programme <span className="req">*</span></div>
                <select className="ctrl"><option>BSc. IT 2026</option><option>BBA 2021</option><option>MBA 2024</option></select>
              </div>
              <div className="fg">
                <div className="lbl">Student Type <span className="req">*</span></div>
                <select className="ctrl"><option>Local</option><option>International</option></select>
              </div>
              <div className="fg">
                <div className="lbl">Base Currency <span className="req">*</span></div>
                <select className="ctrl"><option>UGX (Ugandan Shilling)</option><option>USD (US Dollar)</option><option>KES (Kenyan Shilling)</option></select>
              </div>
            </div>
            <div className="sec-divider">Fee Components (Priority Order)</div>
            <div className="info-box" style={{ marginBottom: '12px' }}><i className="lni lni-bulb"></i> Payments are auto-settled in priority order — Priority 1 fully cleared before Priority 2, and so on. Payments in local currency are auto-converted to the base currency.</div>
            <div id="fee-components-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr 160px 90px', gap: '10px', alignItems: 'center', padding: '10px 12px', background: 'var(--surface)', border: '1.5px solid var(--g200)', borderRadius: 'var(--rxs)' }}>
                <div><span className="badge badge-grey" style={{ fontFamily: 'monospace' }}>P1</span></div>
                <div className="fg" style={{ margin: 0 }}><input className="ctrl" type="text" defaultValue="Admission Fee" placeholder="Component name" /></div>
                <div className="fg" style={{ margin: 0 }}><input className="ctrl" type="number" defaultValue={50000} placeholder="Amount" /></div>
                <button className="btn btn-danger btn-sm"><i className="lni lni-trash-can"></i> Remove</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr 160px 90px', gap: '10px', alignItems: 'center', padding: '10px 12px', background: 'var(--surface)', border: '1.5px solid var(--g200)', borderRadius: 'var(--rxs)' }}>
                <div><span className="badge badge-grey" style={{ fontFamily: 'monospace' }}>P2</span></div>
                <div className="fg" style={{ margin: 0 }}><input className="ctrl" type="text" defaultValue="Registration Fee" placeholder="Component name" /></div>
                <div className="fg" style={{ margin: 0 }}><input className="ctrl" type="number" defaultValue={200000} placeholder="Amount" /></div>
                <button className="btn btn-danger btn-sm"><i className="lni lni-trash-can"></i> Remove</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr 160px 90px', gap: '10px', alignItems: 'center', padding: '10px 12px', background: 'var(--surface)', border: '1.5px solid var(--g200)', borderRadius: 'var(--rxs)' }}>
                <div><span className="badge badge-grey" style={{ fontFamily: 'monospace' }}>P3</span></div>
                <div className="fg" style={{ margin: 0 }}><input className="ctrl" type="text" defaultValue="Tuition Fee" placeholder="Component name" /></div>
                <div className="fg" style={{ margin: 0 }}><input className="ctrl" type="number" defaultValue={750000} placeholder="Amount" /></div>
                <button className="btn btn-danger btn-sm"><i className="lni lni-trash-can"></i> Remove</button>
              </div>
            </div>
            <button className="btn btn-neu btn-sm"><i className="lni lni-plus"></i> Add Fee Component</button>
            <div className="modal-footer">
              <button className="btn btn-neu" onClick={() => closeModal('new-fee-structure-modal')}>Cancel</button>
              <button className="btn btn-primary" onClick={() => { closeModal('new-fee-structure-modal'); showToast('Fee structure saved.', 'success') }}><i className="lni lni-checkmark"></i> Save Fee Structure</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
