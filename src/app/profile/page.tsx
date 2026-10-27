'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Toast } from '@/components/Toast'
import { getSessionIdentity } from '@/lib/session'
import { validatePassword } from '@/lib/errorMessages'

// "My Profile" — the signed-in staff user's own account page, reached from
// the header's profile dropdown (see Header.tsx) on every module. There is
// no real "get current user" endpoint yet (session identity only carries
// displayName — see session.ts), so the account/employee fields below are
// seeded once from displayName and otherwise illustrative, same "UI-first
// prototype" convention as every other page in this app (field set mirrors
// ViewEmployeeModal's Personal Details section). Save actions are
// local-only, same convention as student/profile's Personal Information card.
// Styles are the .mp-* block in globals.css; the photo picker reuses
// .prof-photo-zone (see odel-student-preview's Personal tab).

const TABS = [
  { id: 'info', label: 'Profile Info', icon: 'lni-user' },
  { id: 'security', label: 'Security & Access', icon: 'lni-shield' },
] as const
type TabId = typeof TABS[number]['id']

interface SignIn { id: number; device: string; location: string; when: string; current?: boolean }

// The editable fields; Discard restores the last saved copy.
interface ProfileForm {
  firstName: string
  lastName: string
  email: string
  phone: string
  address: string
  emergencyName: string
  emergencyPhone: string
}

const INITIAL_FORM: ProfileForm = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '+256 701 234 567',
  address: 'Plot 15, Kansanga Road, Kampala',
  emergencyName: 'Jane Doe (Spouse)',
  emergencyPhone: '+256 772 555 019',
}

const STAFF_ID = 'AR-2024-0001'
const ROLE = 'System Administrator'
const DEPARTMENT = 'Academic Affairs'
const CAMPUS = 'Main Campus'

const PERSONAL_DETAILS = [
  { label: 'Staff ID', value: STAFF_ID, mono: true },
  { label: 'Title', value: 'Mr.' },
  { label: 'Date of Birth', value: '14 Mar 1991' },
  { label: 'Sex', value: 'Male' },
  { label: 'Nationality', value: 'Ugandan' },
  { label: 'Marital Status', value: 'Married' },
]

const ASSIGNMENT = [
  { label: 'Role', value: ROLE, icon: 'lni-user' },
  { label: 'Department', value: DEPARTMENT, icon: 'lni-briefcase' },
  { label: 'Campus', value: CAMPUS, icon: 'lni-apartment' },
  { label: 'Employment Type', value: 'Full-time', icon: 'lni-timer' },
  { label: 'Date of Joining', value: '08 Jan 2024', icon: 'lni-calendar' },
  { label: 'Reporting To', value: "Registrar's Office", icon: 'lni-users' },
]

function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase()
}

// A rough strength guide for the new password: length plus character variety.
function passwordStrength(pw: string): { score: number; label: string } {
  if (!pw) return { score: 0, label: '' }
  let score = 0
  if (pw.length >= 8) score++
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++
  if (/\d/.test(pw)) score++
  if (/[^a-zA-Z0-9]/.test(pw)) score++
  if (pw.length >= 12 && score >= 3) score = 4
  score = Math.max(score, 1)
  return { score, label: ['', 'Weak', 'Fair', 'Good', 'Strong'][score] }
}

// The rules validatePassword enforces, checked live under New Password.
const PASSWORD_RULES = [
  { label: 'At least 8 characters', test: (pw: string) => pw.length >= 8 },
  { label: 'One uppercase letter', test: (pw: string) => /[A-Z]/.test(pw) },
  { label: 'One number', test: (pw: string) => /\d/.test(pw) },
  { label: 'One special character', test: (pw: string) => /[^a-zA-Z0-9]/.test(pw) },
]

function PasswordInput({ id, value, onChange, autoComplete }: { id: string; value: string; onChange: (v: string) => void; autoComplete: string }) {
  const [shown, setShown] = useState(false)
  return (
    <div className="mp-pw mp-ic-ctrl">
      <i className="lni lni-key" aria-hidden="true"></i>
      <input id={id} className="ctrl" type={shown ? 'text' : 'password'} value={value} autoComplete={autoComplete} onChange={e => onChange(e.target.value)} />
      <button type="button" className={`mp-pw-toggle${shown ? ' is-shown' : ''}`} onClick={() => setShown(s => !s)} aria-label={shown ? 'Hide password' : 'Show password'} aria-pressed={shown}>
        <i className="lni lni-eye"></i>
      </button>
    </div>
  )
}

export default function ProfilePage() {
  const router = useRouter()
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [tab, setTab] = useState<TabId>('info')

  const [photo, setPhoto] = useState<string | null>(null)

  const [form, setForm] = useState<ProfileForm>(INITIAL_FORM)
  const [saved, setSaved] = useState<ProfileForm>(INITIAL_FORM)
  const isDirty = (Object.keys(form) as (keyof ProfileForm)[]).some(k => form[k] !== saved[k])

  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const strength = passwordStrength(newPw)
  const confirmMismatch = confirmPw.length > 0 && confirmPw !== newPw

  const signIns: SignIn[] = [
    { id: 1, device: 'Chrome on Windows', location: 'Kampala, UG', when: 'Active now', current: true },
    { id: 2, device: 'Safari on iPhone', location: 'Kampala, UG', when: 'Yesterday, 6:42 PM' },
    { id: 3, device: 'Chrome on Windows', location: 'Kampala, UG', when: 'Aug 21, 2026, 9:05 AM' },
  ]

  useEffect(() => {
    const identity = getSessionIdentity()
    // No session name → leave the fields blank rather than inventing one.
    const name = identity?.displayName?.trim() ?? ''
    if (!name) return
    const parts = name.split(/\s+/)
    const seeded: ProfileForm = {
      ...INITIAL_FORM,
      firstName: parts[0] ?? '',
      lastName: parts.slice(1).join(' '),
      email: `${name.toLowerCase().replace(/[^a-z0-9]+/g, '.')}@isbat.ac.ug`,
    }
    setDisplayName(name)
    setForm(seeded)
    setSaved(seeded)
  }, [])

  function showToast(msg: string, type = '') { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }

  function setField(key: keyof ProfileForm, value: string) {
    setForm(f => ({ ...f, [key]: value }))
  }

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (file.size > 2 * 1024 * 1024) return showToast('Photo must be under 2 MB.', 'err')
    const reader = new FileReader()
    reader.onload = ev => { setPhoto(ev.target?.result as string); showToast('Photo updated', 'ok') }
    reader.readAsDataURL(file)
  }

  function handleSaveProfile() {
    setDisplayName(`${form.firstName} ${form.lastName}`.trim() || displayName)
    setSaved(form)
    showToast('Profile saved', 'ok')
  }

  function handleDiscard() {
    setForm(saved)
  }

  function handleChangePassword() {
    const err = validatePassword(newPw)
    if (err) return showToast(err, 'err')
    if (!currentPw) return showToast('Current password is required.', 'err')
    if (newPw !== confirmPw) return showToast('New password and confirmation do not match.', 'err')
    setCurrentPw('')
    setNewPw('')
    setConfirmPw('')
    showToast('Password updated', 'ok')
  }

  return (
    <>
      <div className="page active mp-page">
        <div className="pg-hdr">
          <div><div className="pg-title">My Profile</div><div className="pg-sub">View and manage your account details</div></div>
        </div>

        {/* Identity banner */}
        <section className="mp-hero" aria-label="Account summary">
          <div className="mp-hero-top">
            <label className="mp-avatar" title="Change photo">
              <input type="file" accept="image/*" onChange={handlePhoto} aria-label="Change profile photo" />
              {photo
                ? <img src={photo} alt="Profile" />
                : <span>{initials(displayName) || <i className="lni lni-user"></i>}</span>}
              <span className="mp-avatar-cam" aria-hidden="true"><i className="lni lni-camera"></i></span>
            </label>
            <div className="mp-hero-id">
              <h1 className="mp-hero-name">{displayName || 'Your profile'}</h1>
              <div className="mp-hero-sub"><span className="font-mono">{STAFF_ID}</span> · {ROLE}</div>
              <div className="mp-hero-pills">
                <span className="mp-pill is-live"><span className="mp-pill-dot" aria-hidden="true"></span>Active</span>
                <span className="mp-pill"><i className="lni lni-briefcase"></i> {DEPARTMENT}</span>
                <span className="mp-pill"><i className="lni lni-apartment"></i> {CAMPUS}</span>
              </div>
            </div>
          </div>
          <dl className="mp-meta">
            <div className="mp-meta-item"><dt><i className="lni lni-envelope"></i> Email</dt><dd title={form.email}>{saved.email || '—'}</dd></div>
            <div className="mp-meta-item"><dt><i className="lni lni-phone"></i> Mobile</dt><dd>{saved.phone || '—'}</dd></div>
            <div className="mp-meta-item"><dt><i className="lni lni-briefcase"></i> Department</dt><dd>{DEPARTMENT}</dd></div>
            <div className="mp-meta-item"><dt><i className="lni lni-apartment"></i> Campus</dt><dd>{CAMPUS}</dd></div>
            <div className="mp-meta-item"><dt><i className="lni lni-calendar"></i> Member Since</dt><dd>Jan 2024</dd></div>
          </dl>
        </section>

        <div className="ptabs" role="tablist">
          {TABS.map(t => (
            <button key={t.id} role="tab" aria-selected={tab === t.id} className={`ptab${tab === t.id ? ' active' : ''}`} onClick={() => setTab(t.id)}>
              <i className={`lni ${t.icon}`}></i> {t.label}
            </button>
          ))}
        </div>

        {tab === 'info' && (
          <div className="mp-panel">
            {/* <div className="card">
              <div className="card-hdr"><div className="card-title"><i className="lni lni-camera"></i> Profile Photo</div></div>
              <div className="mp-photo">
                <label className={`prof-photo-zone${photo ? ' has-photo' : ''}`}>
                  <input type="file" accept="image/*" onChange={handlePhoto} aria-label="Upload profile photo" />
                  <div className="prof-photo-icon"><i className="lni lni-camera"></i><small>Photo</small></div>
                  {photo && <img className="prof-photo-preview" src={photo} alt="Profile preview" />}
                </label>
                <div className="mp-photo-info">
                  <div className="prof-photo-title">{photo ? 'Looking good' : 'Add a profile photo'}</div>
                  <div className="prof-photo-hint">Click the circle or drop a passport-style photo · JPG / PNG · max 2 MB</div>
                  <ul className="mp-photo-tips">
                    <li><i className="lni lni-checkmark"></i> Face centred, plain background</li>
                    <li><i className="lni lni-checkmark"></i> Shown on your ID and across the portal</li>
                  </ul>
                </div>
                {photo && (
                  <button type="button" className="btn btn-neu btn-sm mp-photo-remove" onClick={() => setPhoto(null)}>
                    <i className="lni lni-trash-can"></i> Remove
                  </button>
                )}
              </div>
            </div> */}

            <div className="g2">
              <div className="card">
                <div className="card-hdr"><div className="card-title"><i className="lni lni-pencil-alt"></i> Personal Information</div><span className="badge badge-blue">Editable</span></div>
                <div className="g2">
                  <div className="fg"><label className="lbl" htmlFor="mp-first">First Name <span className="req">*</span></label><input id="mp-first" className="ctrl" value={form.firstName} onChange={e => setField('firstName', e.target.value)} /></div>
                  <div className="fg"><label className="lbl" htmlFor="mp-last">Last Name <span className="req">*</span></label><input id="mp-last" className="ctrl" value={form.lastName} onChange={e => setField('lastName', e.target.value)} /></div>
                </div>
                <dl className="mp-facts">
                  {PERSONAL_DETAILS.map(d => (
                    <div key={d.label} className="mp-fact">
                      <dt>{d.label}</dt>
                      <dd className={d.mono ? 'font-mono' : undefined}>{d.value}</dd>
                    </div>
                  ))}
                </dl>
                <p className="mp-note"><i className="lni lni-lock"></i> Personal records are kept by HR and can&apos;t be edited here.</p>
              </div>
              <div className="card">
                <div className="card-hdr"><div className="card-title"><i className="lni lni-home"></i> Contact</div><span className="badge badge-blue">Editable</span></div>
                <div className="g2">
                  <div className="fg">
                    <label className="lbl" htmlFor="mp-email">Email <span className="req">*</span></label>
                    <div className="mp-ic-ctrl"><i className="lni lni-envelope" aria-hidden="true"></i><input id="mp-email" className="ctrl" type="email" value={form.email} onChange={e => setField('email', e.target.value)} /></div>
                  </div>
                  <div className="fg">
                    <label className="lbl" htmlFor="mp-phone">Mobile <span className="req">*</span></label>
                    <div className="mp-ic-ctrl"><i className="lni lni-phone" aria-hidden="true"></i><input id="mp-phone" className="ctrl" type="tel" value={form.phone} onChange={e => setField('phone', e.target.value)} /></div>
                  </div>
                </div>
                <div className="fg">
                  <label className="lbl" htmlFor="mp-address">Home Address</label>
                  <div className="mp-ic-ctrl"><i className="lni lni-map-marker" aria-hidden="true"></i><input id="mp-address" className="ctrl" value={form.address} onChange={e => setField('address', e.target.value)} /></div>
                </div>
                <div className="mp-emergency">
                  <div className="mp-emergency-hdr"><i className="lni lni-heart"></i> Emergency contact</div>
                  <div className="g2" style={{ marginBottom: 0 }}>
                    <div className="fg" style={{ marginBottom: 0 }}><label className="lbl" htmlFor="mp-em-name">Emergency Contact</label><input id="mp-em-name" className="ctrl" value={form.emergencyName} onChange={e => setField('emergencyName', e.target.value)} /></div>
                    <div className="fg" style={{ marginBottom: 0 }}><label className="lbl" htmlFor="mp-em-phone">Emergency Phone</label><input id="mp-em-phone" className="ctrl" type="tel" value={form.emergencyPhone} onChange={e => setField('emergencyPhone', e.target.value)} /></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-hdr"><div className="card-title"><i className="lni lni-briefcase"></i> Role &amp; Assignment</div><span className="badge badge-grey">Read-only</span></div>
              <dl className="mp-assign">
                {ASSIGNMENT.map(a => (
                  <div key={a.label} className="mp-assign-item">
                    <span className="mp-assign-ic" aria-hidden="true"><i className={`lni ${a.icon}`}></i></span>
                    <div>
                      <dt>{a.label}</dt>
                      <dd>{a.value}</dd>
                    </div>
                  </div>
                ))}
              </dl>
              <div className="mp-assign-foot">
                <div className="mp-approval">
                  <span className="mp-approval-lbl">Approval Status</span>
                  <span className="badge badge-green"><span className="bdot"></span>Approved</span>
                </div>
                <p className="mp-note mp-info"><i className="lni lni-lock"></i> Role, department, campus, and employment details are managed by IT/HR — contact your administrator to request a change.</p>
              </div>
            </div>

            <div className={`mp-savebar${isDirty ? ' is-dirty' : ''}`}>
              <span className="mp-savebar-msg" aria-live="polite">
                {isDirty
                  ? <><span className="mp-savebar-dot" aria-hidden="true"></span>You have unsaved changes</>
                  : <><i className="lni lni-checkmark-circle"></i> All changes saved</>}
              </span>
              <div className="flex gap-2">
                <button className="btn btn-neu" onClick={handleDiscard} disabled={!isDirty}>Discard</button>
                <button className="btn btn-primary" onClick={handleSaveProfile} disabled={!isDirty}><i className="lni lni-save"></i> Save Profile</button>
              </div>
            </div>
          </div>
        )}

        {tab === 'security' && (
          <div className="mp-panel">
          <dl className="mp-sec-strip" aria-label="Security summary">
            <div className="mp-sec-item">
              <span className="mp-sec-ic is-ok" aria-hidden="true"><i className="lni lni-shield"></i></span>
              <div><dt>Sign-in verification</dt><dd>OTP code on every sign-in</dd></div>
            </div>
            <div className="mp-sec-item">
              <span className="mp-sec-ic" aria-hidden="true"><i className="lni lni-display"></i></span>
              <div><dt>Current device</dt><dd>{signIns.find(s => s.current)?.device ?? '—'}</dd></div>
            </div>
            <div className="mp-sec-item">
              <span className="mp-sec-ic" aria-hidden="true"><i className="lni lni-alarm-clock"></i></span>
              <div><dt>Recent sign-ins</dt><dd>{signIns.length} in your history</dd></div>
            </div>
          </dl>
          <div className="g2">
            <div className="card">
              <div className="card-hdr">
                <div>
                  <div className="card-title"><i className="lni lni-lock"></i> Change Password</div>
                  <div className="card-sub">Use a password you don’t use anywhere else</div>
                </div>
              </div>
              <div className="fg"><label className="lbl" htmlFor="mp-pw-current">Current Password <span className="req">*</span></label><PasswordInput id="mp-pw-current" value={currentPw} onChange={setCurrentPw} autoComplete="current-password" /></div>
              <div className="fg">
                <label className="lbl" htmlFor="mp-pw-new">New Password <span className="req">*</span></label>
                <PasswordInput id="mp-pw-new" value={newPw} onChange={setNewPw} autoComplete="new-password" />
                {newPw && (
                  <div className={`mp-strength s${strength.score}`} aria-live="polite">
                    <div className="mp-strength-bars" aria-hidden="true"><span></span><span></span><span></span><span></span></div>
                    <span className="mp-strength-lbl">{strength.label}</span>
                  </div>
                )}
                <ul className="mp-rules" aria-label="Password requirements">
                  {PASSWORD_RULES.map(r => {
                    const ok = r.test(newPw)
                    return (
                      <li key={r.label} className={ok ? 'is-ok' : undefined}>
                        <i className={`lni ${ok ? 'lni-checkmark' : 'lni-minus'}`} aria-hidden="true"></i>
                        {r.label}<span className="sr-only">{ok ? ' — met' : ' — not met'}</span>
                      </li>
                    )
                  })}
                </ul>
              </div>
              <div className="fg">
                <label className="lbl" htmlFor="mp-pw-confirm">Confirm New Password <span className="req">*</span></label>
                <PasswordInput id="mp-pw-confirm" value={confirmPw} onChange={setConfirmPw} autoComplete="new-password" />
                {confirmPw && (
                  <div className={`mp-match${confirmMismatch ? ' is-bad' : ''}`}>
                    <i className={`lni ${confirmMismatch ? 'lni-close' : 'lni-checkmark'}`}></i>
                    {confirmMismatch ? 'Doesn’t match the new password' : 'Passwords match'}
                  </div>
                )}
              </div>
              <div className="flex gap-2" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <button type="button" className="mp-link" onClick={() => router.push('/login/forgot')}>
                  Forgot your current password?
                </button>
                <button className="btn btn-primary" onClick={handleChangePassword}><i className="lni lni-checkmark"></i> Update Password</button>
              </div>
            </div>

            <div className="card">
              <div className="card-hdr">
                <div>
                  <div className="card-title"><i className="lni lni-alarm-clock"></i> Recent Sign-in Activity</div>
                  <div className="card-sub">Where your account has been used lately</div>
                </div>
              </div>
              <ul className="mp-signins">
                {signIns.map(s => (
                  <li className={`mp-signin${s.current ? ' is-current' : ''}`} key={s.id}>
                    <span className="mp-signin-ic" aria-hidden="true"><i className={`lni ${s.device.includes('iPhone') ? 'lni-mobile' : 'lni-display'}`}></i></span>
                    <div className="mp-signin-main">
                      <div className="mp-signin-device">
                        {s.device}
                        {s.current && <span className="mp-signin-badge">This device</span>}
                      </div>
                      <div className="mp-signin-meta"><i className="lni lni-map-marker"></i> {s.location} · {s.when}</div>
                    </div>
                  </li>
                ))}
              </ul>
              <p className="mp-note"><i className="lni lni-shield"></i> Don&apos;t recognise a sign-in? Change your password straight away.</p>
            </div>
          </div>
          </div>
        )}
      </div>
      <Toast toast={toast} />
    </>
  )
}
