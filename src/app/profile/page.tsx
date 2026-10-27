'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Toast } from '@/components/Toast'
import { getSessionIdentity } from '@/lib/session'
import { validatePassword } from '@/lib/errorMessages'
import { ProfileIdentityCard } from './_components/ProfileIdentityCard'

interface SignIn {
  id: number
  device: string
  location: string
  ip: string
  when: string
  current?: boolean
}

function ViewField({
  label,
  value,
  icon,
  mono,
  wide,
}: {
  label: string
  value: React.ReactNode
  icon?: string
  mono?: boolean
  wide?: boolean
}) {
  return (
    <div
      style={{
        gridColumn: wide ? '1 / -1' : undefined,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 11.5,
          fontWeight: 600,
          color: 'var(--g500)',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}
      >
        {icon && <i className={`lni ${icon}`} style={{ fontSize: 13, color: 'var(--b700)' }}></i>}
        <span>{label}</span>
      </div>
      <div
        className={mono ? 'font-mono' : undefined}
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: 'var(--g900)',
          lineHeight: 1.45,
          wordBreak: 'break-word',
        }}
      >
        {value}
      </div>
    </div>
  )
}

export default function ProfilePage() {
  const router = useRouter()
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [tab, setTab] = useState<'info' | 'security'>('info')
  const [copied, setCopied] = useState(false)

  // Photo state
  const [photo, setPhoto] = useState<string | null>(null)

  // Personal & Contact states (view-only)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone] = useState('+256 701 234 567')
  const [address] = useState('Plot 15, Kansanga Road, Kampala')
  const [emergencyName] = useState('Jane Doe (Spouse)')
  const [emergencyPhone] = useState('+256 772 555 019')

  // Password fields state
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [showCurrentPw, setShowCurrentPw] = useState(false)
  const [showNewPw, setShowNewPw] = useState(false)
  const [showConfirmPw, setShowConfirmPw] = useState(false)

  // Sign-in activity list
  const signIns: SignIn[] = [
    { id: 1, device: 'Chrome on Windows 11', location: 'Kampala, Uganda', ip: '197.239.4.12', when: 'Active now · This device', current: true },
    { id: 2, device: 'Safari on iPhone 15 Pro', location: 'Kampala, Uganda', ip: '197.239.4.15', when: 'Yesterday, 6:42 PM' },
    { id: 3, device: 'Chrome on MacOS (Workstation)', location: 'Kampala, Uganda', ip: '196.12.140.2', when: 'Aug 21, 2026, 9:05 AM' },
  ]

  useEffect(() => {
    const identity = getSessionIdentity()
    const name = identity?.displayName?.trim() ?? 'JOAN'
    setDisplayName(name)
    const parts = name.split(/\s+/)
    setFirstName(parts[0] ?? 'Joan')
    setLastName(parts.slice(1).join(' ') || 'Administrator')
    setEmail(`${name.toLowerCase().replace(/[^a-z0-9]+/g, '.')}@isbat.ac.ug`)
  }, [])

  function showToast(msg: string, type = '') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) return showToast('Photo must be under 2 MB.', 'err')
    const reader = new FileReader()
    reader.onload = ev => {
      setPhoto(ev.target?.result as string)
      showToast('Profile photo updated successfully', 'ok')
    }
    reader.readAsDataURL(file)
  }

  function handleCopyStaffId() {
    navigator.clipboard.writeText('AR-2024-0001')
    setCopied(true)
    showToast('Staff ID AR-2024-0001 copied to clipboard', 'ok')
    setTimeout(() => setCopied(false), 2200)
  }

  function handleChangePassword() {
    const err = validatePassword(newPw)
    if (err) return showToast(err, 'err')
    if (!currentPw) return showToast('Current password is required.', 'err')
    if (newPw.length < 6) return showToast('New password should be at least 6 characters long.', 'err')
    if (newPw !== confirmPw) return showToast('New password and confirmation do not match.', 'err')

    setCurrentPw('')
    setNewPw('')
    setConfirmPw('')
    showToast('Password updated successfully', 'ok')
  }

  return (
    <>
      <div className="page active profile-page" id="page-profile-master">
        <header className="profile-page-header">
          <div>
            <div className="profile-eyebrow"><i className="lni lni-user"></i> ACCOUNT CENTRE</div>
            <h1 className="profile-page-title">My profile</h1>
            <p className="profile-page-subtitle">Manage your personal information, work details, and account security.</p>
          </div>
          <div className="profile-record-status">
            <span className="profile-record-status-icon"><i className="lni lni-shield"></i></span>
            <span><strong>Profile record</strong><small>Verified by the university</small></span>
          </div>
        </header>

        <ProfileIdentityCard
          displayName={displayName}
          email={email}
          phone={phone}
          photo={photo}
          handlePhoto={handlePhoto}
          copied={copied}
          onCopyStaffId={handleCopyStaffId}
        />

        <div className="profile-summary-strip">
          <div className="profile-summary-item">
            <span className="profile-summary-icon is-green"><i className="lni lni-shield" /></span>
            <span><small>ACCOUNT STATUS</small><strong>Verified &amp; active</strong></span>
          </div>
          <div className="profile-summary-item">
            <span className="profile-summary-icon is-blue"><i className="lni lni-display" /></span>
            <span><small>CONNECTED DEVICES</small><strong>3 active sessions</strong></span>
          </div>
          <div className="profile-summary-item">
            <span className="profile-summary-icon is-amber"><i className="lni lni-briefcase" /></span>
            <span><small>EMPLOYMENT</small><strong>Full-time · Since Jan 2024</strong></span>
          </div>
        </div>

        <div className="profile-content">
            {/* Top Workspace Tab Bar */}
            <div className="ptabs profile-tabs" style={{ margin: 0 }}>
              <button
                type="button"
                className={`ptab${tab === 'info' ? ' active' : ''}`}
                onClick={() => setTab('info')}
              >
                <i className="lni lni-user"></i> Personal &amp; Work Profile
              </button>
              <button
                type="button"
                className={`ptab${tab === 'security' ? ' active' : ''}`}
                onClick={() => setTab('security')}
              >
                <i className="lni lni-shield"></i> Security &amp; Access
              </button>
            </div>

            {/* TAB 1: Profile Info Panes (Spacious, Executive 4-Card Hierarchy) */}
            {tab === 'info' && (
              <div className="profile-info-grid">
                {/* 1. Personal Information Card */}
                <div className="card profile-personal-card" style={{ padding: '22px 26px', margin: 0 }}>
                  <div className="card-hdr" style={{ marginBottom: 20 }}>
                    <div>
                      <div className="card-title">
                        <i className="lni lni-user text-b700"></i> Personal Information
                      </div>
                      <div className="card-sub">Verified identity records and personal demographic profile</div>
                    </div>
                    <span className="badge badge-blue">Verified Profile</span>
                  </div>

                  <div className="profile-fields-2col">
                    <ViewField icon="lni-user" label="First Name" value={firstName || 'JOAN'} />
                    <ViewField icon="lni-user" label="Last Name" value={lastName || 'Administrator'} />
                    <ViewField
                      icon="lni-id-badge"
                      label="Staff ID"
                      value={
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                          <span className="font-mono">{copied ? 'Copied!' : 'AR-2024-0001'}</span>
                          <button
                            type="button"
                            onClick={handleCopyStaffId}
                            title="Click to copy Staff ID"
                            style={{
                              background: 'var(--surface)',
                              border: '1px solid var(--g200)',
                              borderRadius: 4,
                              padding: '2px 6px',
                              cursor: 'pointer',
                              color: copied ? 'var(--green)' : 'var(--b700)',
                              fontSize: 11,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              fontWeight: 600,
                            }}
                          >
                            <i className={`lni ${copied ? 'lni-checkmark' : 'lni-clipboard'}`}></i>
                            <span>Copy</span>
                          </button>
                        </span>
                      }
                    />
                    <ViewField icon="lni-bookmark" label="Honorific Title" value="Mr." />
                    <ViewField icon="lni-calendar" label="Date of Birth" value="14 Mar 1991" />
                    <ViewField icon="lni-users" label="Gender" value="Male" />
                    <ViewField icon="lni-flag" label="Nationality" value="Ugandan" />
                    <ViewField icon="lni-heart" label="Marital Status" value="Married" />
                  </div>
                </div>

                {/* 2. Contact & Residential Details Card */}
                <div className="card profile-contact-card" style={{ padding: '22px 26px', margin: 0 }}>
                  <div className="card-hdr" style={{ marginBottom: 20 }}>
                    <div>
                      <div className="card-title">
                        <i className="lni lni-phone text-b700"></i> Contact &amp; Residential Details
                      </div>
                      <div className="card-sub">Official institutional communication channels and registered home address</div>
                    </div>
                    <span className="badge badge-green">
                      <span className="bdot"></span> Verified Channels
                    </span>
                  </div>

                  <div className="profile-fields-2col">
                    <ViewField icon="lni-envelope" label="Official Email Address" value={email} />
                    <ViewField icon="lni-phone" label="Mobile Phone Number" value={phone} />
                    <ViewField icon="lni-map-marker" label="Residential / Home Address" value={address} wide />
                  </div>
                </div>

                {/* 3. Emergency Contact Point Card */}
                <div className="card profile-emergency-card" style={{ padding: '22px 26px', margin: 0 }}>
                  <div className="card-hdr" style={{ marginBottom: 20 }}>
                    <div>
                      <div className="card-title">
                        <i className="lni lni-heart text-b700"></i> Emergency Contact Point
                      </div>
                      <div className="card-sub">Designated primary contact point in case of institutional emergency</div>
                    </div>
                    <span className="badge badge-grey">Primary Contact</span>
                  </div>

                  <div className="profile-fields-2col">
                    <ViewField icon="lni-user" label="Emergency Contact Person" value={emergencyName} />
                    <ViewField icon="lni-phone-set" label="Emergency Contact Phone" value={emergencyPhone} />
                  </div>

                  <div
                    style={{
                      marginTop: 18,
                      padding: '10px 14px',
                      background: 'var(--b50)',
                      border: '1px solid var(--b200)',
                      borderRadius: 'var(--rxs)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      fontSize: 12,
                      color: 'var(--b900)',
                    }}
                  >
                    <i className="lni lni-information text-b700" style={{ fontSize: 15, flexShrink: 0 }}></i>
                    <span>This emergency contact point is registered with University Safety &amp; Campus Health Services.</span>
                  </div>
                </div>

                {/* 4. Role & Institutional Assignment Card */}
                <div className="card profile-assignment-card" style={{ padding: '22px 26px', margin: 0 }}>
                  <div className="card-hdr" style={{ marginBottom: 20 }}>
                    <div>
                      <div className="card-title">
                        <i className="lni lni-briefcase text-b700"></i> Role &amp; Institutional Assignment
                      </div>
                      <div className="card-sub">Employment hierarchy, assigned department, and campus privileges</div>
                    </div>
                    <span className="badge badge-green">
                      <span className="bdot"></span> Active Assignment
                    </span>
                  </div>

                  <div className="profile-fields-3col">
                    <ViewField icon="lni-id-badge" label="Designated Role" value="System Administrator" />
                    <ViewField icon="lni-apartment" label="Department" value="Academic Affairs" />
                    <ViewField icon="lni-map" label="Primary Campus" value="Main Campus (Kampala)" />
                    <ViewField icon="lni-briefcase" label="Employment Type" value="Full-time Permanent" />
                    <ViewField icon="lni-calendar" label="Date of Joining" value="08 Jan 2024" />
                    <ViewField icon="lni-direction-alt" label="Reporting Authority" value="Registrar's Office" />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--g700)' }}>HR Approval Status:</div>
                    <span className="badge badge-green">
                      <span className="bdot"></span> Verified &amp; Approved by HR
                    </span>
                  </div>

                  <div className="info-box" style={{ borderRadius: 'var(--rxs)' }}>
                    <i className="lni lni-information" style={{ color: 'var(--b700)', fontSize: 16, flexShrink: 0, marginTop: 1 }}></i>
                    <div style={{ fontSize: 12, color: 'var(--g700)', lineHeight: 1.45 }}>
                      Role assignment, department affiliation, campus permissions, and employment terms are managed centrally by HR &amp; IT Administration. To request modifications, please contact the Registrar or HR office.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Security & Device Panes */}
            {tab === 'security' && (
              <div className="profile-security-grid">
                {/* Change Password Card */}
                <div className="card" style={{ margin: 0 }}>
                  <div className="card-hdr">
                    <div>
                      <div className="card-title">
                        <i className="lni lni-lock text-b700"></i> Change Password
                      </div>
                      <div className="card-sub">Update your account credentials to keep your profile secure</div>
                    </div>
                  </div>

                  <div className="fg">
                    <label className="lbl">Current Password <span className="req">*</span></label>
                    <div style={{ position: 'relative' }}>
                      <input
                        className="ctrl"
                        type={showCurrentPw ? 'text' : 'password'}
                        value={currentPw}
                        onChange={e => setCurrentPw(e.target.value)}
                        placeholder="Enter current password"
                        style={{ paddingRight: 36 }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPw(!showCurrentPw)}
                        style={{
                          position: 'absolute',
                          right: 10,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          color: 'var(--g400)',
                          cursor: 'pointer',
                          padding: 2,
                        }}
                      >
                        <i className={`lni ${showCurrentPw ? 'lni-eye text-b700' : 'lni-eye'}`}></i>
                      </button>
                    </div>
                  </div>

                  <div className="fg">
                    <label className="lbl">New Password <span className="req">*</span></label>
                    <div style={{ position: 'relative' }}>
                      <input
                        className="ctrl"
                        type={showNewPw ? 'text' : 'password'}
                        value={newPw}
                        onChange={e => setNewPw(e.target.value)}
                        placeholder="At least 6 characters"
                        style={{ paddingRight: 36 }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPw(!showNewPw)}
                        style={{
                          position: 'absolute',
                          right: 10,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          color: 'var(--g400)',
                          cursor: 'pointer',
                          padding: 2,
                        }}
                      >
                        <i className={`lni ${showNewPw ? 'lni-eye text-b700' : 'lni-eye'}`}></i>
                      </button>
                    </div>
                  </div>

                  <div className="fg">
                    <label className="lbl">Confirm New Password <span className="req">*</span></label>
                    <div style={{ position: 'relative' }}>
                      <input
                        className="ctrl"
                        type={showConfirmPw ? 'text' : 'password'}
                        value={confirmPw}
                        onChange={e => setConfirmPw(e.target.value)}
                        placeholder="Re-enter new password"
                        style={{ paddingRight: 36 }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPw(!showConfirmPw)}
                        style={{
                          position: 'absolute',
                          right: 10,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          color: 'var(--g400)',
                          cursor: 'pointer',
                          padding: 2,
                        }}
                      >
                        <i className={`lni ${showConfirmPw ? 'lni-eye text-b700' : 'lni-eye'}`}></i>
                      </button>
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginTop: 20,
                      flexWrap: 'wrap',
                      gap: 10,
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => router.push('/login/forgot')}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        cursor: 'pointer',
                        fontSize: 12,
                        fontWeight: 600,
                        color: 'var(--b700)',
                        textDecoration: 'underline',
                      }}
                    >
                      Forgot your current password?
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handleChangePassword}
                    >
                      <i className="lni lni-lock"></i> Update Password
                    </button>
                  </div>
                </div>

                {/* Recent Sign-in Activity Timeline */}
                <div className="card" style={{ margin: 0 }}>
                  <div className="card-hdr">
                    <div>
                      <div className="card-title">
                        <i className="lni lni-alarm-clock text-b700"></i> Recent Sign-in Activity
                      </div>
                      <div className="card-sub">Active login sessions and connected devices</div>
                    </div>
                    <span className="badge badge-green">
                      <span className="bdot"></span> 3 Sessions
                    </span>
                  </div>

                  <div className="timeline">
                    {signIns.map((s, i) => (
                      <div className="tl-item" key={s.id}>
                        <div
                          className={`tl-dot ${s.current ? 'cur active' : i === signIns.length - 1 ? 'done' : 'pending'}`}
                          style={{
                            background: s.current ? 'var(--b50)' : undefined,
                            borderColor: s.current ? 'var(--b400)' : undefined,
                            color: s.current ? 'var(--b700)' : undefined,
                          }}
                        >
                          <i className={`lni ${s.device.includes('iPhone') ? 'lni-mobile' : 'lni-display'}`}></i>
                        </div>
                        <div className="tl-content">
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                            <div className="tl-label">{s.device}</div>
                            {s.current && (
                              <span className="badge badge-blue" style={{ fontSize: 10, padding: '2px 7px' }}>
                                This Device
                              </span>
                            )}
                          </div>
                          <div className="tl-meta">
                            {s.location} · <span className="font-mono">{s.ip}</span>
                          </div>
                          <div style={{ fontSize: 11, color: s.current ? 'var(--green)' : 'var(--g400)', fontWeight: 600, marginTop: 2 }}>
                            {s.when}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--g200)', fontSize: 11.5, color: 'var(--g500)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <i className="lni lni-shield text-b700"></i>
                    <span>Notice unfamiliar activity? Change your password immediately to terminate other sessions.</span>
                  </div>
                </div>
              </div>
            )}
          </div>
      </div>

      <Toast toast={toast} />
    </>
  )
}
