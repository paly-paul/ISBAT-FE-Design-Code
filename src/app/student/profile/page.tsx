'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Toast } from '@/components/Toast'
import { SearchSelect } from '@/components/SearchSelect'
import { StudentLookup } from '@/components/student/StudentLookup'
import { useStudent } from '@/hooks/student/useStudents'
import { StudentDto } from '@/lib/api/student/student'

// Ported from isbat_student_module.html's Student Profile page. Identity/
// academic fields (name, programme, semester, batch, status) come from the
// real GET /api/v1/students/:guid (useStudent) once a student is loaded via
// StudentLookup. Fee structure/sponsorship/learning mode, the ID card/ESSL
// state, and the communication dispatch audit log have no backend contract
// at all — page-local mock state only, same "UI-first prototype" convention
// as Finance's Payment Collection pages.
const PROFICIENCY_TABS = [
  { id: 'info', label: 'Profile Info', icon: 'lni-user' },
  { id: 'idcard', label: 'ID Card', icon: 'lni-credit-cards' },
  { id: 'comms', label: 'Communication & Access', icon: 'lni-envelope' },
] as const
type TabId = typeof PROFICIENCY_TABS[number]['id']

interface AuditEntry { id: number; action: string; detail: string; dot: 'email' | 'whatsapp' | 'update' }

function initials(name: string) {
  return name.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

function isValidEmail(v: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) }
function isValidPhone(v: string) { return /^\+\d[\d\s]{6,14}$/.test(v.trim()) }

export default function Page() {
  const router = useRouter()
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)
  const [student, setStudent] = useState<StudentDto | null>(null)
  const [tab, setTab] = useState<TabId>('info')

  const { data: detail } = useStudent(student?.studentGuid ?? null, !!student)

  // Personal-info edit form — seeded from the loaded record, editable but
  // not wired to any save endpoint (none confirmed for this workflow).
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [gender, setGender] = useState('Female')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')

  // ID card + communications mock state.
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [barcode, setBarcode] = useState('')
  const [stuEmail, setStuEmail] = useState('')
  const [stuPhone, setStuPhone] = useState('')
  const [parEmail, setParEmail] = useState('parent.email@gmail.com')
  const [parPhone, setParPhone] = useState('+256 772 987 654')
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([])

  function showToast(msg: string, type = '') { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }

  useEffect(() => {
    if (!student) return
    const parts = student.studentName.trim().split(/\s+/)
    setFirstName(parts[0] ?? '')
    setLastName(parts.slice(1).join(' '))
    setStuEmail(`${student.studentNum.toLowerCase().replace(/[^a-z0-9]/g, '.')}@isbat.ac.ug`)
    setEmail(`${student.studentNum.toLowerCase().replace(/[^a-z0-9]/g, '.')}@isbat.ac.ug`)
    setStuPhone('+256 701 234 567')
    setPhone('+256 701 234 567')
    setAuditLog([
      { id: 1, action: 'Student credentials dispatched via Email', detail: `To: parent.email@gmail.com · Admin: Registrar`, dot: 'email' },
    ])
    setTab('info')
  }, [student])

  function handleLoad(s: StudentDto) { setStudent(s); showToast(`${s.studentName} profile loaded`, 'ok') }
  function handleClear() { setStudent(null) }

  function dispatch(who: 'student' | 'parent', channel: 'email' | 'whatsapp') {
    const clbl = channel === 'email' ? 'Email' : 'WhatsApp'
    const wlbl = who === 'student' ? 'Student' : 'Parent'
    showToast(`${wlbl} credentials dispatched via ${clbl}`, 'ok')
    setAuditLog(prev => [
      { id: Date.now(), action: `${wlbl} credentials dispatched via ${clbl}`, detail: `Admin: Student Registrar · ${new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`, dot: channel },
      ...prev,
    ])
  }

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => { setPhotoUrl(ev.target?.result as string); showToast('Photo uploaded', 'ok') }
    reader.readAsDataURL(file)
  }

  return (
    <>
      <div className="page active">
        <div className="pg-hdr">
          <div><div className="pg-title">Student Profile</div><div className="pg-sub">Search a student or navigate from Student Master to view and edit their profile</div></div>
        </div>

        <StudentLookup
          onLoad={handleLoad}
          onClear={handleClear}
          loaded={!!student}
          hint="Once loaded, all tabs populate at once — including ID card management and credential dispatch."
        />

        {!student && (
          <div className="empty">
            <div className="empty-icon"><i className="lni lni-user"></i></div>
            <div className="empty-title">No Student Selected</div>
            <div className="empty-sub">Search above to load a student. All tabs load simultaneously once a student is found.</div>
          </div>
        )}

        {student && (
          <>
            <div className="stu-banner">
              <div className="stu-banner-top">
                <div className="stu-av">{initials(student.studentName)}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="stu-banner-name">{student.studentName}</div>
                  <div className="stu-banner-id">{student.studentNum} · {student.studentRegNo}</div>
                  <div className="stu-banner-pills">
                    <span className="stu-pill">{detail?.studActive === 1 ? '✓ Active' : detail ? '⚠ Inactive' : '…'}</span>
                    <span className="stu-pill"><i className="lni lni-graduation"></i> {student.programName || '—'}</span>
                    <span className="stu-pill"><i className="lni lni-grid-alt"></i> {student.batchCode || '—'}</span>
                    <span className="stu-pill"><i className="lni lni-calendar"></i> {student.semesterName || '—'}</span>
                    <span className="stu-pill"><i className="lni lni-display"></i> Campus</span>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7, alignItems: 'flex-end' }}>
                  <div className="flex gap-2">
                    <button className="btn btn-neu btn-sm" style={{ background: 'rgba(255,255,255,.2)', borderColor: 'rgba(255,255,255,.3)', color: '#fff' }} onClick={() => router.push('/student/batch-transfer')}><i className="lni lni-transfer"></i> Batch Transfer</button>
                    <button className="btn btn-neu btn-sm" style={{ background: 'rgba(255,255,255,.2)', borderColor: 'rgba(255,255,255,.3)', color: '#fff' }} onClick={() => router.push('/student/prog-transfer')}><i className="lni lni-graduation"></i> Prog. Transfer</button>
                  </div>
                  <div className="flex gap-2">
                    <button className="btn btn-neu btn-sm" style={{ background: 'rgba(255,255,255,.2)', borderColor: 'rgba(255,255,255,.3)', color: '#fff' }} onClick={() => router.push('/student/learning-mode')}><i className="lni lni-display"></i> Learning Mode</button>
                    <button className="btn btn-neu btn-sm" style={{ background: 'rgba(255,255,255,.2)', borderColor: 'rgba(255,255,255,.3)', color: '#fff' }} onClick={() => router.push('/student/intake-transfer')}><i className="lni lni-calendar"></i> Intake Transfer</button>
                  </div>
                </div>
              </div>
              <div className="stu-meta-row">
                <div className="stu-meta-item"><div className="stu-meta-lbl">Fee Structure</div><div className="stu-meta-val">Local</div></div>
                <div className="stu-meta-item"><div className="stu-meta-lbl">Sponsor</div><div className="stu-meta-val">Self</div></div>
                <div className="stu-meta-item"><div className="stu-meta-lbl">Learning Mode</div><div className="stu-meta-val">Campus</div></div>
                <div className="stu-meta-item"><div className="stu-meta-lbl">Registration No.</div><div className="stu-meta-val">{student.studentRegNo}</div></div>
                <div className="stu-meta-item"><div className="stu-meta-lbl">Status</div><div className="stu-meta-val">{detail?.regStatusName || '—'}</div></div>
              </div>
            </div>

            <div className="ptabs">
              {PROFICIENCY_TABS.map(t => (
                <button key={t.id} className={`ptab${tab === t.id ? ' active' : ''}`} onClick={() => setTab(t.id)}>
                  <i className={`lni ${t.icon}`}></i> {t.label}
                </button>
              ))}
            </div>

            {tab === 'info' && (
              <div>
                <div className="card">
                  <div className="card-hdr"><div className="card-title"><i className="lni lni-pencil-alt"></i> Personal Information</div><span className="badge badge-grey">Editable</span></div>
                  <div className="g3">
                    <div className="fg"><label className="lbl">First Name <span className="req">*</span></label><input className="ctrl" value={firstName} onChange={e => setFirstName(e.target.value)} /></div>
                    <div className="fg"><label className="lbl">Last Name <span className="req">*</span></label><input className="ctrl" value={lastName} onChange={e => setLastName(e.target.value)} /></div>
                    <div className="fg"><label className="lbl">Gender <span className="req">*</span></label><SearchSelect options={['Female', 'Male', 'Other']} value={gender} onChange={setGender} /></div>
                  </div>
                </div>
                <div className="card">
                  <div className="card-hdr"><div className="card-title"><i className="lni lni-graduation"></i> Academic Details</div><span className="badge badge-grey">Read-only</span></div>
                  <div className="g3">
                    <div className="fg"><label className="lbl">Student No.</label><input className="ctrl" readOnly value={student.studentNum} /></div>
                    <div className="fg"><label className="lbl">Registration No.</label><input className="ctrl" readOnly value={student.studentRegNo} /></div>
                    <div className="fg"><label className="lbl">Programme</label><input className="ctrl" readOnly value={student.programName || '—'} /></div>
                    <div className="fg"><label className="lbl">Current Batch</label><input className="ctrl" readOnly value={student.batchCode || '—'} /></div>
                    <div className="fg"><label className="lbl">Current Semester</label><input className="ctrl" readOnly value={student.semesterName || '—'} /></div>
                    <div className="fg"><label className="lbl">Status</label><input className="ctrl" readOnly value={detail?.regStatusName || (detail?.studActive === 1 ? 'Active' : '—')} style={{ color: 'var(--green)', fontWeight: 700 }} /></div>
                  </div>
                  <div className="info-box"><i className="lni lni-information" style={{ color: 'var(--b700)', fontSize: 15, flexShrink: 0 }}></i><div style={{ fontSize: 12 }}>To change Batch, Programme, Learning Mode, or Intake — use the quick-action buttons in the banner above or navigate via the Operations section in the sidebar.</div></div>
                </div>
                <div className="card">
                  <div className="card-hdr"><div className="card-title"><i className="lni lni-home"></i> Contact</div></div>
                  <div className="g3">
                    <div className="fg"><label className="lbl">Primary Email <span className="req">*</span></label><input className="ctrl" value={email} onChange={e => setEmail(e.target.value)} /></div>
                    <div className="fg"><label className="lbl">Mobile / WhatsApp <span className="req">*</span></label><input className="ctrl" value={phone} onChange={e => setPhone(e.target.value)} /></div>
                  </div>
                </div>
                <div className="flex gap-2" style={{ justifyContent: 'flex-end', marginBottom: 20 }}>
                  <button className="btn btn-neu">Discard</button>
                  <button className="btn btn-primary" onClick={() => showToast('Profile saved', 'ok')}><i className="lni lni-save"></i> Save Profile</button>
                </div>
              </div>
            )}

            {tab === 'idcard' && (
              <div className="g2">
                <div>
                  <div className="card" style={{ marginBottom: 16 }}>
                    <div className="card-hdr"><div className="card-title"><i className="lni lni-image"></i> Photo &amp; Card Details</div></div>
                    <div className="flex" style={{ gap: 20, alignItems: 'flex-start' }}>
                      <div>
                        <label className="lbl">Photo</label>
                        <label className="photo-zone">
                          <input type="file" accept="image/*" onChange={handlePhoto} style={{ display: 'none' }} />
                          <i className="lni lni-image"></i><span>Upload</span>
                        </label>
                        <div style={{ fontSize: 10.5, color: 'var(--g500)', marginTop: 6, textAlign: 'center' }}>JPG/PNG · Max 2MB</div>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div className="fg"><label className="lbl">Name on Card</label><input className="ctrl" value={student.studentName} readOnly /></div>
                        <div className="fg"><label className="lbl">Student ID</label><input className="ctrl" value={student.studentNum} readOnly /></div>
                        <div className="fg"><label className="lbl">Programme</label><input className="ctrl" value={student.programName || '—'} readOnly /></div>
                      </div>
                    </div>
                  </div>
                  <div className="card">
                    <div className="card-hdr"><div className="card-title"><i className="lni lni-link"></i> Barcode &amp; ESSL Access</div></div>
                    <div className="fg">
                      <label className="lbl">Physical Barcode <span className="req">*</span></label>
                      <input className="ctrl" placeholder="Scan or enter barcode…" value={barcode} onChange={e => setBarcode(e.target.value)} />
                      <div style={{ fontSize: 12, marginTop: 5, color: !barcode ? 'var(--g400)' : barcode.length < 6 ? 'var(--g400)' : barcode.startsWith('ISBT') ? 'var(--green)' : 'var(--red)', fontWeight: barcode ? 700 : 400 }}>
                        {!barcode ? 'Enter a barcode to validate' : barcode.length < 6 ? 'Keep typing…' : barcode.startsWith('ISBT') ? '✓ Barcode available' : '✗ Invalid — use ISBT prefix'}
                      </div>
                    </div>
                    <div className="fg">
                      <label className="lbl">ESSL Device Registration</label>
                      <div className="chklist">
                        <div className="chk pass"><i className="lni lni-checkmark-circle chk-icon" style={{ color: 'var(--green)' }}></i><span className="chk-text">Device F22-01 · Main Gate</span><span className="chk-status">Enrolled</span></div>
                        <div className="chk pend"><i className="lni lni-alarm-clock chk-icon" style={{ color: 'var(--amber)' }}></i><span className="chk-text">Device F22-02 · Library</span><span className="chk-status">Pending</span></div>
                        <div className="chk fail"><i className="lni lni-close chk-icon" style={{ color: 'var(--red)' }}></i><span className="chk-text">Device F22-03 · Lab Block</span><span className="chk-status">Not Enrolled</span></div>
                      </div>
                    </div>
                    <div className="flex gap-2" style={{ marginTop: 8 }}>
                      <button className="btn btn-neu btn-sm"><i className="lni lni-reload"></i> Sync Devices</button>
                      <button className="btn btn-primary btn-sm" onClick={() => showToast('ID card saved and synced', 'ok')}><i className="lni lni-save"></i> Save &amp; Sync</button>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="card" style={{ marginBottom: 16 }}>
                    <div className="card-hdr"><div className="card-title"><i className="lni lni-eye"></i> Live Card Preview</div><span className="badge badge-blue">Preview</span></div>
                    <div className="id-preview">
                      <div className="id-logo">ISBAT UNIVERSITY · KAMPALA</div>
                      <div className="id-photo">{photoUrl ? <img src={photoUrl} alt="" /> : <i className="lni lni-user"></i>}</div>
                      <div className="id-name">{student.studentName}</div>
                      <div className="id-prog">{student.programName || '—'} · {student.semesterName || '—'}</div>
                      <div className="id-num">{student.studentNum}</div>
                      <div className="id-bar">||||| |||| ||||| |||| ||||<br />{student.studentRegNo}</div>
                    </div>
                    <div className="flex gap-2" style={{ justifyContent: 'center', marginTop: 12 }}>
                      <button className="btn btn-neu btn-sm"><i className="lni lni-download"></i> Download</button>
                      <button className="btn btn-primary btn-sm"><i className="lni lni-printer"></i> Print</button>
                    </div>
                  </div>
                  <div className="card">
                    <div className="card-hdr"><div className="card-title"><i className="lni lni-alarm-clock"></i> Card History</div></div>
                    <div className="timeline">
                      <div className="tl-item"><div className="tl-dot done"><i className="lni lni-checkmark"></i></div><div><div className="tl-label">No ID card issued yet</div><div className="tl-meta">Save &amp; Sync to issue the first card</div></div></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {tab === 'comms' && (
              <div>
                <div className="dcard">
                  <div className="dcard-hdr stu">
                    <div className="dcard-title"><i className="lni lni-user"></i> Student Profile</div>
                    <div className="flex gap-2" style={{ alignItems: 'center' }}><span style={{ fontSize: 11, color: 'rgba(255,255,255,.7)' }}>Login ID:</span><span className="dcard-id">{student.studentNum}</span></div>
                  </div>
                  <div className="dcard-body">
                    <div className="dcard-grid">
                      <div className="fg">
                        <label className="lbl">Student Email <span className="req">*</span></label>
                        <input className="ctrl" value={stuEmail} onChange={e => setStuEmail(e.target.value)} />
                        <div className={`field-hint ${isValidEmail(stuEmail) ? 'ok' : 'err'}`}>{isValidEmail(stuEmail) ? '✓ Valid email format' : '✗ Invalid email format'}</div>
                      </div>
                      <div className="fg">
                        <label className="lbl">WhatsApp / Mobile <span className="req">*</span></label>
                        <input className="ctrl" value={stuPhone} onChange={e => setStuPhone(e.target.value)} />
                        <div className={`field-hint ${isValidPhone(stuPhone) ? 'ok' : 'err'}`}>{isValidPhone(stuPhone) ? '✓ Valid international format' : '✗ Use format e.g. +256 701 234 567'}</div>
                      </div>
                    </div>
                    <div className="dcard-actions">
                      <button className="btn btn-primary btn-sm" onClick={() => dispatch('student', 'email')}><i className="lni lni-envelope"></i> Send Credentials via Email</button>
                      <button className="btn btn-success btn-sm" onClick={() => dispatch('student', 'whatsapp')}><i className="lni lni-whatsapp"></i> Send via WhatsApp</button>
                      <button className="btn btn-neu btn-sm ml-auto" onClick={() => showToast('Student contact saved', 'ok')}><i className="lni lni-save"></i> Save</button>
                    </div>
                  </div>
                </div>
                <div className="dcard">
                  <div className="dcard-hdr par">
                    <div className="dcard-title"><i className="lni lni-users"></i> Parent / Guardian Profile</div>
                    <div className="flex gap-2" style={{ alignItems: 'center' }}><span style={{ fontSize: 11, color: 'rgba(255,255,255,.7)' }}>Auto-generated Login ID:</span><span className="dcard-id">{student.studentNum}_P</span></div>
                  </div>
                  <div className="dcard-body">
                    <div className="purple-box" style={{ marginBottom: 14, background: '#f0fdf4', borderColor: 'var(--green-bd)' }}>
                      <i className="lni lni-information" style={{ color: 'var(--green)', fontSize: 15, flexShrink: 0, marginTop: 1 }}></i>
                      <div style={{ fontSize: 12 }}>Parent login ID is auto-generated by appending <code style={{ background: 'rgba(0,0,0,.06)', padding: '1px 5px', borderRadius: 3 }}>_P</code> to the Student ID. A separate password token is generated on first credential dispatch.</div>
                    </div>
                    <div className="dcard-grid">
                      <div className="fg">
                        <label className="lbl">Parent Email <span className="req">*</span></label>
                        <input className="ctrl" value={parEmail} onChange={e => setParEmail(e.target.value)} />
                        <div className={`field-hint ${isValidEmail(parEmail) ? 'ok' : 'err'}`}>{isValidEmail(parEmail) ? '✓ Valid email format' : '✗ Invalid email format'}</div>
                      </div>
                      <div className="fg">
                        <label className="lbl">Parent WhatsApp / Mobile <span className="req">*</span></label>
                        <input className="ctrl" value={parPhone} onChange={e => setParPhone(e.target.value)} />
                        <div className={`field-hint ${isValidPhone(parPhone) ? 'ok' : 'err'}`}>{isValidPhone(parPhone) ? '✓ Valid international format' : '✗ Use format e.g. +256 701 234 567'}</div>
                      </div>
                    </div>
                    <div className="dcard-actions">
                      <button className="btn btn-primary btn-sm" onClick={() => dispatch('parent', 'email')}><i className="lni lni-envelope"></i> Send Parent Credentials via Email</button>
                      <button className="btn btn-success btn-sm" onClick={() => dispatch('parent', 'whatsapp')}><i className="lni lni-whatsapp"></i> Send Parent via WhatsApp</button>
                      <button className="btn btn-neu btn-sm ml-auto" onClick={() => showToast('Parent contact saved', 'ok')}><i className="lni lni-save"></i> Save</button>
                    </div>
                  </div>
                </div>
                <div className="card">
                  <div className="card-hdr"><div className="card-title"><i className="lni lni-shield"></i> Security &amp; Dispatch Audit Log</div><span className="badge badge-grey">Last {auditLog.length} events</span></div>
                  {auditLog.map(row => (
                    <div className="audit-row" key={row.id}>
                      <div className={`audit-dot ${row.dot}`}></div>
                      <div><div className="audit-action">{row.action}</div><div className="audit-detail">{row.detail}</div></div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
      <Toast toast={toast} />
    </>
  )
}
