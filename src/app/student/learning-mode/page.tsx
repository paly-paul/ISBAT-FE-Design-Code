'use client'
import { useState } from 'react'
import { Toast } from '@/components/Toast'
import { SearchSelect } from '@/components/SearchSelect'
import { StudentLookup } from '@/components/student/StudentLookup'
import { BaselinePanel } from '@/components/student/BaselinePanel'
import { StudentDto } from '@/lib/api/student/student'

// Ported from isbat_student_module.html's Learning Mode page. No backend
// contract exists for this workflow — mode state and its access impact are
// page-local mock data.
const REASONS = ['Job Relocation', 'Medical', 'Personal Preference', 'Administrative']

export default function Page() {
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)
  const [student, setStudent] = useState<StudentDto | null>(null)
  const [mode, setMode] = useState<'campus' | 'odl'>('campus')
  const [reason, setReason] = useState(REASONS[0])
  const [remarks, setRemarks] = useState('')

  function showToast(msg: string, type = '') { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }
  function handleLoad(s: StudentDto) { setStudent(s); showToast(`${s.studentName} loaded`, 'ok') }
  function handleClear() { setStudent(null); setMode('campus'); setReason(REASONS[0]); setRemarks('') }

  return (
    <>
      <div className="page active">
        <div className="pg-hdr"><div><div className="pg-title">Learning Mode</div><div className="pg-sub">Switch a student between Campus-Based and Online / ODL modes</div></div></div>

        <StudentLookup onLoad={handleLoad} onClear={handleClear} loaded={!!student} />

        {!student && (
          <div className="empty">
            <div className="empty-icon"><i className="lni lni-display"></i></div>
            <div className="empty-title">No Student Loaded</div>
            <div className="empty-sub">Search for a student to view their current learning mode and switch between Campus-Based and Online/ODL.</div>
          </div>
        )}

        {student && (
          <>
            <BaselinePanel
              label="Current Enrollment (Read-Only)"
              items={[
                { label: 'Student', value: student.studentName },
                { label: 'Current Mode', value: <span style={{ color: 'var(--green)' }}>Campus-Based</span> },
                { label: 'Campus', value: 'Main Campus' },
              ]}
            />
            <div className="g2">
              <div className="card">
                <div className="card-hdr"><div className="card-title"><i className="lni lni-display"></i> Select New Learning Mode</div></div>
                <div className={`mode-card${mode === 'campus' ? ' sel' : ''}`} onClick={() => setMode('campus')}>
                  <div className="mode-icon"><i className="lni lni-home"></i></div>
                  <div><div className="mode-lbl">Campus-Based</div><div className="mode-sub">Student attends physical classes. Full access to campus facilities, labs, library, and biometric attendance.</div></div>
                </div>
                <div className={`mode-card${mode === 'odl' ? ' sel' : ''}`} onClick={() => setMode('odl')}>
                  <div className="mode-icon"><i className="lni lni-display"></i></div>
                  <div><div className="mode-lbl">Online / ODL</div><div className="mode-sub">Student learns remotely via digital platforms. Physical campus access suspended. LMS fully unlocked.</div></div>
                </div>
                {mode === 'campus'
                  ? <div className="fg" style={{ marginTop: 6 }}><label className="lbl">Campus Location</label><SearchSelect options={['Main Campus · Kampala', 'City Campus · Kampala CBD']} /></div>
                  : <div className="fg" style={{ marginTop: 6 }}><label className="lbl">Online Campus Region</label><SearchSelect options={['Uganda (Online)', 'Kenya (Online)', 'Rwanda (Online)', 'International (Online)']} /></div>}
                <div className="fg"><label className="lbl">Effective From <span className="req">*</span></label><SearchSelect options={['Immediately', 'Next Semester']} /></div>
                <div className="fg"><label className="lbl">Reason <span className="req">*</span></label>
                  <SearchSelect
                    placeholder="— Select reason —"
                    options={REASONS}
                    value={reason}
                    onChange={setReason}
                  />
                </div>
                <div className="fg"><label className="lbl">Remarks <span className="req">*</span></label><textarea className="ctrl" rows={3} placeholder="Explain the reason for mode change…" value={remarks} onChange={e => setRemarks(e.target.value)} /></div>
                <div className="flex gap-2" style={{ justifyContent: 'flex-end' }}>
                  <button className="btn btn-neu" onClick={handleClear}>Cancel</button>
                  <button className="btn btn-primary" onClick={() => showToast('Learning mode updated', 'ok')}><i className="lni lni-checkmark"></i> Apply Mode Change</button>
                </div>
              </div>
              <div className="card">
                <div className="card-hdr"><div className="card-title"><i className="lni lni-information"></i> Impact Preview</div></div>
                {mode === 'campus' ? (
                  <>
                    <div className="success-box" style={{ marginBottom: 12 }}><i className="lni lni-checkmark-circle" style={{ color: 'var(--green)', fontSize: 15, flexShrink: 0 }}></i><div style={{ fontSize: 12 }}><strong>Campus-Based active.</strong> Student has full physical access.</div></div>
                    <div className="chklist">
                      <div className="chk pass"><i className="lni lni-checkmark-circle chk-icon" style={{ color: 'var(--green)' }}></i><span className="chk-text">Physical class attendance — Enabled</span><span className="chk-status">Active</span></div>
                      <div className="chk pass"><i className="lni lni-checkmark-circle chk-icon" style={{ color: 'var(--green)' }}></i><span className="chk-text">Biometric tracking — Enabled</span><span className="chk-status">Active</span></div>
                      <div className="chk pass"><i className="lni lni-checkmark-circle chk-icon" style={{ color: 'var(--green)' }}></i><span className="chk-text">Lab &amp; Library access — Enabled</span><span className="chk-status">Active</span></div>
                      <div className="chk pass"><i className="lni lni-checkmark-circle chk-icon" style={{ color: 'var(--green)' }}></i><span className="chk-text">LMS / Online portal — Enabled</span><span className="chk-status">Active</span></div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="warn-box" style={{ marginBottom: 12 }}><i className="lni lni-warning" style={{ color: 'var(--amber)', fontSize: 15, flexShrink: 0 }}></i><div style={{ fontSize: 12 }}><strong>Switching to Online/ODL.</strong> Physical campus access will be suspended on save.</div></div>
                    <div className="chklist">
                      <div className="chk fail"><i className="lni lni-close chk-icon" style={{ color: 'var(--red)' }}></i><span className="chk-text">Physical attendance — Disabled</span><span className="chk-status">Suspended</span></div>
                      <div className="chk fail"><i className="lni lni-close chk-icon" style={{ color: 'var(--red)' }}></i><span className="chk-text">Biometric tracking — Disabled</span><span className="chk-status">Suspended</span></div>
                      <div className="chk fail"><i className="lni lni-close chk-icon" style={{ color: 'var(--red)' }}></i><span className="chk-text">Lab &amp; Library — Revoked</span><span className="chk-status">Revoked</span></div>
                      <div className="chk pass"><i className="lni lni-checkmark-circle chk-icon" style={{ color: 'var(--green)' }}></i><span className="chk-text">LMS / Online portal — Fully unlocked</span><span className="chk-status">Unlocked</span></div>
                    </div>
                  </>
                )}
                <div className="card" style={{ marginTop: 16, marginBottom: 0 }}>
                  <div className="card-hdr" style={{ marginBottom: 10 }}><div className="card-title"><i className="lni lni-alarm-clock"></i> Mode History</div></div>
                  <div className="timeline">
                    <div className="tl-item"><div className="tl-dot done"><i className="lni lni-checkmark"></i></div><div><div className="tl-label">Campus-Based — Enrolled</div><div className="tl-meta">Jan 2024 · Initial mode at registration</div></div></div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
      <Toast toast={toast} />
    </>
  )
}
