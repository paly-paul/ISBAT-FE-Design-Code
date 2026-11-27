'use client'
import { useRef, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Toast } from '@/components/Toast'
import { ChangePhotoModal } from '@/components/modals/shared/ChangePhotoModal'
import { PhotoLightbox } from '@/components/PhotoLightbox'
import { validatePassword } from '@/lib/errorMessages'
import { AuthError, RATE_LIMIT_CODE } from '@/lib/api/client'
import type { SignInActivity } from '@/lib/auth'
import { useChangePassword, useCollapseSignInActivity, useMyProfile, useSignInActivity, useUpdateMyPhoto } from '@/hooks/users/useMyProfile'
import { PROFILE_STATUS_ACTIVE, type MyProfile } from '@/lib/api/users/profile'
import { parseUtcNoZ } from '@/lib/api/finance/discountReport'
import { sameOriginApiUrl } from '@/lib/apiFileUrl'
import { MyTeachingTab } from './_components/MyTeachingTab'

// "My Profile" — the signed-in staff user's own account page, reached from
// the header's profile dropdown (see Header.tsx) on every module. Profile
// Info is GET /users/employees/me (get-my-profile.md): read-only except the
// photo, which PUT /users/employees/me/photo (put-my-photo.md) saves as soon
// as one is chosen. The Security tab changes the password with
// POST /users/auth/change-password (post-change-password.md) and lists
// recent sign-ins from GET /users/auth/sign-in-activity
// (get-sign-in-activity.md).
// Styles are the .mp-* block in globals.css.

const TABS = [
  { id: 'info', label: 'Profile Info', icon: 'lni-user' },
  { id: 'teaching', label: 'Timetable & Course Units', icon: 'lni-calendar' },
  { id: 'security', label: 'Security & Access', icon: 'lni-shield' },
] as const
type TabId = typeof TABS[number]['id']

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// "1990-01-01T00:00:00" → "01 Jan 1990" (read from the string, no timezone shift).
function fmtDate(value: string | null): string | null {
  if (!value) return null
  const [y, m, d] = value.slice(0, 10).split('-')
  return y && m && d ? `${d} ${MONTHS[+m - 1]} ${y}` : value
}

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

// A sign-in time, read close to how people say it: "Today at 5:47 PM",
// "Yesterday at 9:05 AM", "Monday at 5:47 PM" (this past week), "28 Oct at
// 5:47 PM" (this year), else "3 Mar 2025 at 5:47 PM". `full` is the
// unambiguous version for the tooltip. lastLoginDate is UTC with no "Z"
// (like the report job dates) and signedInAt is UTC with one; either way
// it's converted to the viewer's local time.
function fmtSignIn(value: string | null): { short: string; full: string } | null {
  const when = parseUtcNoZ(value)
  if (!when || Number.isNaN(when.getTime())) return null
  const y = when.getFullYear(), m = when.getMonth() + 1, d = when.getDate()
  const h = when.getHours(), min = when.getMinutes()
  const at = ` at ${h % 12 || 12}:${String(min).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`

  const day = new Date(y, m - 1, d)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const daysAgo = Math.round((today.getTime() - day.getTime()) / 86_400_000)

  const short =
    daysAgo === 0 ? `Today${at}`
    : daysAgo === 1 ? `Yesterday${at}`
    : daysAgo > 1 && daysAgo < 7 ? `${WEEKDAYS[day.getDay()]}${at}`
    : y === now.getFullYear() ? `${d} ${MONTHS[m - 1]}${at}`
    : `${d} ${MONTHS[m - 1]} ${y}${at}`
  const full = `${WEEKDAYS[day.getDay()]}, ${d} ${MONTHS_LONG[m - 1]} ${y}${at}`
  return { short, full }
}

// Whole years from "1990-01-01T00:00:00" to today.
function ageFrom(birthDate: string | null): string | null {
  if (!birthDate) return null
  const [y, m, d] = birthDate.slice(0, 10).split('-').map(Number)
  if (!y || !m || !d) return null
  const now = new Date()
  const age = now.getFullYear() - y - (now.getMonth() + 1 < m || (now.getMonth() + 1 === m && now.getDate() < d) ? 1 : 0)
  return age >= 0 ? `${age} years` : null
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase()
}

// Status pill: 2 Active is the live (green) pill; 1 Pending amber; 0 Locked / 4 Blocked red.
function statusPillClass(status: number | null) {
  if (status === PROFILE_STATUS_ACTIVE) return 'mp-pill is-live'
  if (status === 1) return 'mp-pill is-warn'
  if (status === 0 || status === 4) return 'mp-pill is-bad'
  return 'mp-pill'
}

const SKILL_TONE: Record<string, string> = { Approved: 'is-approved', Pending: 'is-pending', Rejected: 'is-rejected' }
const SKILL_GROUP_LABEL: Record<string, string> = { Pending: 'Pending review' }

function profileErrorMessage(err: unknown) {
  if (err instanceof AuthError && err.code === 'employee_required') return 'Your account isn’t linked to an employee record, so there’s no staff profile to show. Contact HR if this is wrong.'
  if (err instanceof AuthError && err.code === 'not_found') return 'Your employee record couldn’t be found. Contact HR to have it restored.'
  return err instanceof Error && err.message ? err.message : 'Something went wrong. Please try again.'
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

// "Chrome on Windows" / "Safari on iPhone". browser and os can be "Unknown".
function signInDevice(s: SignInActivity) {
  const known = (v: string) => (v && v.toLowerCase() !== 'unknown' ? v : null)
  const browser = known(s.browser)
  const os = known(s.os)
  if (browser && os) return `${browser} on ${os}`
  return browser ?? (os ? `Unknown browser on ${os}` : 'Unknown device')
}

function signInIcon(deviceType: string) {
  if (deviceType === 'Desktop') return 'lni-display'
  if (deviceType === 'Mobile') return 'lni-mobile'
  return 'lni-world'
}

type PwErrors = Partial<Record<'current' | 'new' | 'confirm', string>>

function changePasswordError(err: unknown): { field?: keyof PwErrors; msg: string } {
  if (err instanceof AuthError) {
    if (err.code === 'current_password_incorrect') return { field: 'current', msg: 'Current password is incorrect.' }
    if (err.code === 'password_unchanged') return { field: 'new', msg: 'New password must be different from the current password.' }
    if (err.code === 'validation_error') return { field: 'new', msg: err.errors?.filter(Boolean).join(' ') || err.message || 'Please check the new password.' }
    if (err.code === RATE_LIMIT_CODE) return { msg: 'Too many attempts. Please wait a moment and try again.' }
  }
  return { msg: err instanceof Error && err.message && err.message !== 'unknown' ? err.message : 'Couldn’t update your password. Please try again.' }
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null
  return <div className="mp-match is-bad" role="alert"><i className="lni lni-close"></i>{msg}</div>
}

function PasswordInput({ id, value, onChange, autoComplete, invalid }: { id: string; value: string; onChange: (v: string) => void; autoComplete: string; invalid?: boolean }) {
  const [shown, setShown] = useState(false)
  return (
    <div className={`mp-pw mp-ic-ctrl${invalid ? ' is-err' : ''}`}>
      <i className="lni lni-key" aria-hidden="true"></i>
      <input id={id} className="ctrl" type={shown ? 'text' : 'password'} value={value} autoComplete={autoComplete} aria-invalid={invalid || undefined} onChange={e => onChange(e.target.value)} />
      <button type="button" className={`mp-pw-toggle${shown ? ' is-shown' : ''}`} onClick={() => setShown(s => !s)} aria-label={shown ? 'Hide password' : 'Show password'} aria-pressed={shown}>
        <i className="lni lni-eye"></i>
      </button>
    </div>
  )
}

interface Fact { label: string; value: string | null; icon: string }

// "1979-12-10T00:00:00" → "10 December 1979" (read from the string, no timezone shift).
function fmtDateLong(value: string | null): string | null {
  if (!value) return null
  const [y, m, d] = value.slice(0, 10).split('-').map(Number)
  return y && m && d ? `${d} ${MONTHS_LONG[m - 1]} ${y}` : null
}

// Only what the banner doesn't already show: name, staff no, role, status,
// campuses and the contact/account details all live in the banner.
function ProfileInfo({ p }: { p: MyProfile }) {
  const birthLong = fmtDateLong(p.personal.birthDate)
  const age = ageFrom(p.personal.birthDate)
  const personal: Fact[] = [
    { label: 'Title', value: p.title, icon: 'lni-user' },
    { label: 'Sex', value: p.personal.sexName, icon: 'lni-users' },
    { label: 'Marital Status', value: p.personal.maritalStatusName, icon: 'lni-heart' },
    { label: 'Place of Birth', value: p.personal.placeOfBirth, icon: 'lni-map-marker' },
  ]

  // Two ID fields on the record; many staff only have one. The first one
  // with a value is the card's headline number; the other is shown under it
  // only when both are recorded.
  const { nationalId, natId } = p.documents
  const primaryId = nationalId ?? natId
  const secondaryId = nationalId && natId ? natId : null

  // Status is said once per group, not on every skill. Known statuses in a
  // fixed order, then anything unexpected under its own name.
  const statuses = [...new Set(['Approved', 'Pending', 'Rejected', ...p.skills.map(s => s.approvalStatus)])]
  const skillGroups = statuses
    .map(status => ({ status, skills: p.skills.filter(s => s.approvalStatus === status) }))
    .filter(g => g.skills.length > 0)

  // When every skill has the same proficiency, say it once in the subtitle
  // instead of repeating the same number on every chip.
  const levels = new Set(p.skills.map(s => s.proficiency))
  const sharedLevel = levels.size === 1 ? p.skills[0].proficiency : null

  return (
    <div className="mp-panel">
      {/* Personal facts on the left; identity drawn as an ID card on the
          right, in the banner's navy so the tab reads as one piece. */}
      <div className="card">
        <div className="card-hdr">
          <div>
            <div className="card-title"><i className="lni lni-user"></i> Personal Details</div>
            <div className="card-sub">As recorded on your staff record</div>
          </div>
        </div>
        <div className="mp-details">
          <section className="mp-personal" aria-label="Personal">
            <div className="mp-born">
              <span className="mp-born-ic" aria-hidden="true"><i className="lni lni-calendar"></i></span>
              <div className="mp-born-main">
                <span className="mp-born-lbl">Date of birth</span>
                <span className="mp-born-val">{birthLong ?? 'Not recorded'}</span>
              </div>
              {age && <span className="mp-born-age">{age}</span>}
            </div>
            <dl className="mp-traits">
              {personal.map(f => (
                <div key={f.label} className="mp-trait">
                  <dt><i className={`lni ${f.icon}`} aria-hidden="true"></i>{f.label}</dt>
                  <dd title={f.value ?? undefined}>{f.value || '—'}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="mp-idcard" aria-label="Identity and nationality">
            <div className="mp-idcard-top">
              <span><i className="lni lni-postcard" aria-hidden="true"></i> Identity</span>
              <span className="mp-idcard-chip" aria-hidden="true"></span>
            </div>
            <div className="mp-idcard-id">
              <span className="mp-idcard-lbl">National ID</span>
              <span className="mp-idcard-num font-mono">{primaryId || '—'}</span>
              {secondaryId && <span className="mp-idcard-sub">NAT ID <span className="font-mono">{secondaryId}</span></span>}
            </div>
            <dl className="mp-idcard-foot">
              <div><dt><i className="lni lni-flag" aria-hidden="true"></i> Nationality</dt><dd>{p.personal.nationality || '—'}</dd></div>
              <div><dt><i className="lni lni-world" aria-hidden="true"></i> Country</dt><dd>{p.personal.countryName || '—'}</dd></div>
            </dl>
          </section>
        </div>
      </div>

      <div className="card">
        <div className="card-hdr">
          <div>
            <div className="card-title"><i className="lni lni-bulb"></i> Skills</div>
            <div className="card-sub">
              {p.skills.length === 0
                ? 'Skills recorded on your staff record, with their approval status'
                : <>
                    {p.skills.length} skill{p.skills.length === 1 ? '' : 's'} on your profile
                    {sharedLevel != null
                      ? <> · {p.skills.length === 1 ? 'proficiency' : 'all at proficiency'} level {sharedLevel}</>
                      : ' · each shows its proficiency level'}
                  </>}
            </div>
          </div>
        </div>
        {p.skills.length === 0 ? (
          <div className="rpt-empty" style={{ padding: '18px 0 6px' }}>
            <i className="lni lni-bulb" aria-hidden="true" />
            <div className="rpt-empty-title">No skills recorded yet</div>
          </div>
        ) : (
          <div className="mp-skill-groups">
            {skillGroups.map(g => {
              const tone = SKILL_TONE[g.status] ?? 'is-other'
              return (
                <section key={g.status} className={`mp-skill-group ${tone}`} aria-label={`${g.status} skills`}>
                  <h3 className="mp-skill-group-hdr">
                    <span className="mp-skill-group-dot" aria-hidden="true"></span>
                    {SKILL_GROUP_LABEL[g.status] ?? g.status}
                    <span className="mp-skill-group-count">{g.skills.length}</span>
                  </h3>
                  <ul className="mp-skills">
                    {g.skills.map(s => (
                      <li key={s.skillName} className="mp-skill" title={`${s.skillName} · Proficiency ${s.proficiency} · ${s.approvalStatus}`}>
                        <span className="mp-skill-name">{s.skillName}</span>
                        {sharedLevel == null && <span className="mp-skill-lvl" aria-label={`Proficiency ${s.proficiency}`}>Lv {s.proficiency}</span>}
                      </li>
                    ))}
                  </ul>
                </section>
              )
            })}
          </div>
        )}
      </div>

      <p className="mp-note mp-info"><i className="lni lni-lock"></i> Your profile is maintained by Administrator and can&apos;t be edited here - To change a your details, please contact your administrator.</p>
    </div>
  )
}

export default function ProfilePage() {
  const router = useRouter()
  const profileQuery = useMyProfile()
  const profile = profileQuery.data
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)
  const [tab, setTab] = useState<TabId>('info')

  const [photoModalOpen, setPhotoModalOpen] = useState(false)
  const [photoViewOpen, setPhotoViewOpen] = useState(false)
  const updatePhoto = useUpdateMyPhoto()
  // photoUrl is a signed link that expires after ~1 hour. If it fails to
  // load, GET /me once for a fresh link (once per page view, not a retry
  // loop); a link that still fails falls back to the initials.
  const [brokenPhotoUrl, setBrokenPhotoUrl] = useState<string | null>(null)
  const [photoRefreshed, setPhotoRefreshed] = useState(false)
  const rawPhotoUrl = profile?.photoUrl && profile.photoUrl !== brokenPhotoUrl ? profile.photoUrl : null
  const photoUrl = sameOriginApiUrl(rawPhotoUrl)

  function handlePhotoError() {
    setBrokenPhotoUrl(profile?.photoUrl ?? null)
    if (!photoRefreshed) { setPhotoRefreshed(true); profileQuery.refetch() }
  }

  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [pwErrors, setPwErrors] = useState<PwErrors>({})
  const strength = passwordStrength(newPw)
  const confirmMismatch = confirmPw.length > 0 && confirmPw !== newPw
  const changePw = useChangePassword()

  // Loaded only once the Security tab is opened.
  const signInQuery = useSignInActivity(tab === 'security')
  const signIns = signInQuery.data?.pages.flatMap(p => p.items) ?? []
  const signInTotal = signInQuery.data?.pages[0]?.totalCount
  const currentSignIn = signIns.find(s => s.isCurrentDevice)
  const collapseSignIns = useCollapseSignInActivity()
  const signInScrollRef = useRef<HTMLDivElement>(null)
  const signInsExpanded = (signInQuery.data?.pages.length ?? 0) > 1

  function showFewerSignIns() {
    collapseSignIns()
    signInScrollRef.current?.scrollTo({ top: 0 })
  }

  function showToast(msg: string, type = '') { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }

  // Rejects on failure so the photo modal stays open for another try.
  function handlePhoto(file: File) {
    return updatePhoto.mutateAsync(file).then(
      () => showToast('Photo updated', 'ok'),
      (err: unknown) => {
        // validation_error carries the server's own wording (type / size).
        showToast(profileErrorMessage(err) || 'Couldn’t save your photo. Please try again.', 'err')
        throw err
      },
    )
  }

  // Field problems show under their field; anything else is a toast. A 401
  // never reaches here as an error to show: the API client refreshes the
  // session or sends the user to login.
  function handleChangePassword(e: FormEvent) {
    e.preventDefault()
    if (changePw.isPending) return
    const errs: PwErrors = {}
    if (!currentPw) errs.current = 'Enter your current password.'
    const ruleErr = validatePassword(newPw)
    if (ruleErr) errs.new = ruleErr
    if (!confirmPw) errs.confirm = 'Confirm your new password.'
    else if (newPw !== confirmPw) errs.confirm = 'Doesn’t match the new password.'
    setPwErrors(errs)
    if (Object.keys(errs).length) return

    changePw.mutate({ currentPassword: currentPw, newPassword: newPw }, {
      onSuccess: () => {
        setCurrentPw('')
        setNewPw('')
        setConfirmPw('')
        setPwErrors({})
        showToast('Password updated. Any other devices have been signed out.', 'ok')
      },
      onError: err => {
        const { field, msg } = changePasswordError(err)
        if (field) setPwErrors({ [field]: msg })
        else showToast(msg, 'err')
      },
    })
  }

  function clearPwError(field: keyof PwErrors) {
    setPwErrors(prev => (prev[field] ? { ...prev, [field]: undefined } : prev))
  }

  const name = profile?.empName?.trim() ?? ''
  const lastSignIn = fmtSignIn(profile?.account.lastLoginDate ?? null)
  const campusNames = (profile?.campuses ?? []).map(c => c.campusName).filter((n): n is string => !!n)

  return (
    <>
      <div className="page active mp-page">
        <div className="pg-hdr">
          <div><div className="pg-title">My Profile</div><div className="pg-sub">Your staff details, as held by HR</div></div>
        </div>

        {profileQuery.isLoading ? (
          <div className="card">
            <div className="rpt-empty">
              <i className="lni lni-spinner-arrow spin" aria-hidden="true" />
              <div className="rpt-empty-title">Loading your profile…</div>
            </div>
          </div>
        ) : profileQuery.isError || !profile ? (
          <div className="card">
            <div className="rpt-empty">
              <i className="lni lni-warning" aria-hidden="true" style={{ color: 'var(--red)' }} />
              <div className="rpt-empty-title">Couldn’t load your profile</div>
              <div style={{ fontSize: 13, marginBottom: 14 }}>{profileErrorMessage(profileQuery.error)}</div>
              <button className="btn btn-neu btn-sm" onClick={() => profileQuery.refetch()} disabled={profileQuery.isFetching}>
                <i className="lni lni-reload" aria-hidden="true" /> Try again
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Identity banner */}
            <section className="mp-hero" aria-label="Account summary">
              <div className="mp-hero-top">
                {/* With a photo, opens it full size (PhotoLightbox, whose
                    "Change photo" leads on to the popup); without, goes
                    straight to Change Photo. */}
                <button
                  type="button"
                  className="mp-avatar"
                  title={photoUrl ? 'View photo' : 'Add photo'}
                  aria-label={photoUrl ? 'View your profile photo' : 'Add a profile photo'}
                  onClick={() => photoUrl ? setPhotoViewOpen(true) : setPhotoModalOpen(true)}
                >
                  {photoUrl
                    ? <img src={photoUrl} alt="" onError={handlePhotoError} />
                    : <span>{initials(name) || <i className="lni lni-user"></i>}</span>}
                  <span className="mp-avatar-cam" aria-hidden="true"><i className="lni lni-camera"></i></span>
                </button>
                <div className="mp-hero-id">
                  <h1 className="mp-hero-name">{name || 'Your profile'}</h1>
                  <div className="mp-hero-sub">
                    <span className="font-mono">{profile.shortCode}</span>
                    {profile.account.userTypeName && <> · {profile.account.userTypeName}</>}
                  </div>
                  {/* Set separately on the employee record, so either can be empty. */}
                  <dl className="mp-hero-job" aria-label="Job">
                    <div><dt>Designation</dt><dd>{profile.job?.designationName || '—'}</dd></div>
                    <div><dt>Department</dt><dd>{profile.job?.departmentName || '—'}</dd></div>
                  </dl>
                  <div className="mp-hero-pills">
                    {profile.status.statusName && (
                      <span className={statusPillClass(profile.status.status)}>
                        {profile.status.status === PROFILE_STATUS_ACTIVE && <span className="mp-pill-dot" aria-hidden="true"></span>}
                        {profile.status.statusName}
                      </span>
                    )}
                    {campusNames.map(c => <span key={c} className="mp-pill"><i className="lni lni-apartment"></i> {c}</span>)}
                  </div>
                </div>
              </div>
              <dl className="mp-meta">
                <div className="mp-meta-item"><dt><i className="lni lni-envelope"></i> Email</dt><dd title={profile.contact.email ?? undefined}>{profile.contact.email || '—'}</dd></div>
                <div className="mp-meta-item"><dt><i className="lni lni-phone"></i> Mobile</dt><dd>{profile.contact.phone || '—'}</dd></div>
                <div className="mp-meta-item"><dt><i className="lni lni-user"></i> Username</dt><dd>{profile.account.userName || '—'}</dd></div>
                <div className="mp-meta-item"><dt><i className="lni lni-calendar"></i> Last Sign-in</dt><dd title={lastSignIn?.full}>{lastSignIn?.short ?? 'Not recorded'}</dd></div>
                <div className="mp-meta-item">
                  <dt><i className="lni lni-checkmark-circle"></i> Email Status</dt>
                  <dd style={{ color: profile.contact.email ? (profile.account.emailVerified ? 'var(--green)' : 'var(--amber)') : undefined }}>
                    {!profile.contact.email ? '—' : profile.account.emailVerified ? 'Verified' : 'Not verified'}
                  </dd>
                </div>
              </dl>
            </section>

            <div className="ptabs" role="tablist">
              {TABS.map(t => (
                <button key={t.id} role="tab" aria-selected={tab === t.id} className={`ptab${tab === t.id ? ' active' : ''}`} onClick={() => setTab(t.id)}>
                  <i className={`lni ${t.icon}`}></i> {t.label}
                </button>
              ))}
            </div>

            {tab === 'info' && <ProfileInfo p={profile} />}

            {/* Mounted only when opened, so its two calls run only then. */}
            {tab === 'teaching' && <MyTeachingTab />}

            {tab === 'security' && (
              <div className="mp-panel">
              <dl className="mp-sec-strip" aria-label="Security summary">
                <div className="mp-sec-item">
                  <span className="mp-sec-ic is-ok" aria-hidden="true"><i className="lni lni-shield"></i></span>
                  <div><dt>Sign-in verification</dt><dd>OTP code on every sign-in</dd></div>
                </div>
                <div className="mp-sec-item">
                  <span className="mp-sec-ic" aria-hidden="true"><i className="lni lni-display"></i></span>
                  <div><dt>Current device</dt><dd>{currentSignIn ? signInDevice(currentSignIn) : '—'}</dd></div>
                </div>
                <div className="mp-sec-item">
                  <span className="mp-sec-ic" aria-hidden="true"><i className="lni lni-alarm-clock"></i></span>
                  <div><dt>Recent sign-ins</dt><dd>{signInTotal != null ? `${signInTotal} in your history` : '—'}</dd></div>
                </div>
              </dl>
              <div className="g2">
                <form className="card" noValidate onSubmit={handleChangePassword}>
                  <div className="card-hdr">
                    <div>
                      <div className="card-title"><i className="lni lni-lock"></i> Change Password</div>
                      <div className="card-sub">Use a password you don’t use anywhere else</div>
                    </div>
                  </div>
                  <div className="fg">
                    <label className="lbl" htmlFor="mp-pw-current">Current Password <span className="req">*</span></label>
                    <PasswordInput id="mp-pw-current" value={currentPw} onChange={v => { setCurrentPw(v); clearPwError('current') }} autoComplete="current-password" invalid={!!pwErrors.current} />
                    <FieldError msg={pwErrors.current} />
                  </div>
                  <div className="fg">
                    <label className="lbl" htmlFor="mp-pw-new">New Password <span className="req">*</span></label>
                    <PasswordInput id="mp-pw-new" value={newPw} onChange={v => { setNewPw(v); clearPwError('new') }} autoComplete="new-password" invalid={!!pwErrors.new} />
                    <FieldError msg={pwErrors.new} />
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
                    <PasswordInput id="mp-pw-confirm" value={confirmPw} onChange={v => { setConfirmPw(v); clearPwError('confirm') }} autoComplete="new-password" invalid={!!pwErrors.confirm} />
                    <FieldError msg={pwErrors.confirm} />
                    {confirmPw && !pwErrors.confirm && (
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
                    <button type="submit" className="btn btn-primary" disabled={changePw.isPending}>
                      <i className={`lni ${changePw.isPending ? 'lni-spinner-arrow spin' : 'lni-checkmark'}`}></i> {changePw.isPending ? 'Updating…' : 'Update Password'}
                    </button>
                  </div>
                  <p className="mp-note"><i className="lni lni-information"></i> Changing your password signs you out on every other device. The new password expires in 90 days.</p>
                </form>

                <div className="card mp-signin-card">
                  <div className="card-hdr">
                    <div>
                      <div className="card-title"><i className="lni lni-alarm-clock"></i> Recent Sign-in Activity</div>
                      <div className="card-sub">Where your account has been used lately</div>
                    </div>
                  </div>
                  {signInQuery.isLoading ? (
                    <div className="rpt-empty" style={{ padding: '18px 0 6px' }}>
                      <i className="lni lni-spinner-arrow spin" aria-hidden="true" />
                      <div className="rpt-empty-title">Loading sign-in activity…</div>
                    </div>
                  ) : signInQuery.isError && signIns.length === 0 ? (
                    <div className="rpt-empty" style={{ padding: '18px 0 6px' }}>
                      <i className="lni lni-warning" aria-hidden="true" style={{ color: 'var(--red)' }} />
                      <div className="rpt-empty-title">Couldn’t load your sign-in activity</div>
                      <div style={{ fontSize: 13, marginBottom: 14 }}>
                        {signInQuery.error instanceof AuthError && signInQuery.error.code === RATE_LIMIT_CODE
                          ? 'Too many requests right now. Please wait a minute and try again.'
                          : 'Something went wrong. Please try again.'}
                      </div>
                      <button type="button" className="btn btn-neu btn-sm" onClick={() => signInQuery.refetch()} disabled={signInQuery.isFetching}>
                        <i className="lni lni-reload" aria-hidden="true" /> Try again
                      </button>
                    </div>
                  ) : signIns.length === 0 ? (
                    <div className="rpt-empty" style={{ padding: '18px 0 6px' }}>
                      <i className="lni lni-alarm-clock" aria-hidden="true" />
                      <div className="rpt-empty-title">No recent activity yet</div>
                      <div style={{ fontSize: 13 }}>Your sign-ins will show here from now on.</div>
                    </div>
                  ) : (
                    <>
                    <div className="mp-signin-scroll" ref={signInScrollRef} tabIndex={0} aria-label="Sign-in history">
                      <ul className="mp-signins">
                        {signIns.map((s, i) => {
                          const when = fmtSignIn(s.signedInAt)
                          return (
                            <li className={`mp-signin${s.isCurrentDevice ? ' is-current' : ''}`} key={`${s.signedInAt}-${i}`}>
                              <span className="mp-signin-ic" aria-hidden="true"><i className={`lni ${signInIcon(s.deviceType)}`}></i></span>
                              <div className="mp-signin-main">
                                <div className="mp-signin-device">
                                  {signInDevice(s)}
                                  {s.isCurrentDevice && <span className="mp-signin-badge">This device</span>}
                                  {!s.isActive && <span className="mp-signin-badge is-ended">Signed out</span>}
                                </div>
                                <div className="mp-signin-meta">
                                  {s.location && <><i className="lni lni-map-marker"></i> {s.location} · </>}
                                  {s.isCurrentDevice
                                    ? <span title={when?.full}>Active now</span>
                                    : <span title={when?.full}>{when?.short ?? '—'}</span>}
                                </div>
                              </div>
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                      {/* Outside the scroll area so the buttons are always in
                          view and their shadow isn't clipped by its overflow. */}
                      {(signInQuery.hasNextPage || signInsExpanded) && (
                        <div className="mp-signin-more">
                          {signInQuery.hasNextPage && (
                            <button type="button" className="btn btn-neu btn-sm" onClick={() => signInQuery.fetchNextPage()} disabled={signInQuery.isFetchingNextPage}>
                              <i className="lni lni-chevron-down" aria-hidden="true"></i> {signInQuery.isFetchingNextPage ? 'Loading…' : 'Show more'}
                            </button>
                          )}
                          {signInsExpanded && (
                            <button type="button" className="btn btn-neu btn-sm" onClick={showFewerSignIns} disabled={signInQuery.isFetchingNextPage}>
                              <i className="lni lni-chevron-up" aria-hidden="true"></i> Show less
                            </button>
                          )}
                        </div>
                      )}
                      {signInQuery.isFetchNextPageError && (
                        <p className="mp-note" style={{ color: 'var(--red)' }}><i className="lni lni-warning"></i> Couldn’t load more sign-ins. Please try again.</p>
                      )}
                    </>
                  )}
                  <p className="mp-note"><i className="lni lni-shield"></i> Don&apos;t recognise a sign-in? Change your password straight away.</p>
                </div>
              </div>
              </div>
            )}
          </>
        )}
      </div>
      {photoViewOpen && photoUrl && (
        <PhotoLightbox
          src={photoUrl}
          name={name || 'Your profile'}
          subtitle={[profile?.shortCode, profile?.account.userTypeName].filter(Boolean).join(' · ') || null}
          onClose={() => setPhotoViewOpen(false)}
          action={{ label: 'Change photo', icon: 'lni-camera', onClick: () => { setPhotoViewOpen(false); setPhotoModalOpen(true) } }}
        />
      )}
      <ChangePhotoModal isOpen={photoModalOpen} onClose={() => setPhotoModalOpen(false)} showToast={showToast} onPhoto={handlePhoto} />
      <Toast toast={toast} />
    </>
  )
}
