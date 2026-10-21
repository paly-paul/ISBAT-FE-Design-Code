'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import PanelA from '@/components/PanelA'
import Icon from '@/components/Icon'
import StrengthBar, { computeStrength } from '@/components/StrengthBar'
import SuccessScreen from '@/components/SuccessScreen'
import { validateSetupToken, setInitialPassword, AuthError } from '@/lib/auth'
import { authErrorMessage } from '@/lib/errorMessages'

// staff-portal-set-password-page.md — landing page for the "Set Up Your ISBAT
// ERP Password" email an employee gets when they're approved. The link is
// .../set-password?token=… (valid 7 days, single use); /set-password and
// the old /login/activate both forward here with the token.

// POST /set-password: newPassword min 8 characters.
const MIN_PASSWORD = 8
const RATE_LIMIT_MESSAGE = 'Too many attempts. Please wait a minute and try again.'

type View = 'checking' | 'expired' | 'rate-limited' | 'form' | 'done'

export default function SetPasswordPage() {
  const router = useRouter()
  // The token is a secret: kept in a ref (not state, not logs) and removed
  // from the address bar as soon as it's read.
  const tokenRef = useRef('')
  const [view, setView] = useState<View>('checking')
  const [doneMessage, setDoneMessage] = useState('')

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function checkLink() {
    const token = tokenRef.current
    if (!token) { setView('expired'); return }
    setView('checking')
    validateSetupToken(token)
      .then(() => setView('form'))
      .catch(err => setView(err instanceof AuthError && err.code === 'rate_limit_exceeded' ? 'rate-limited' : 'expired'))
  }

  useEffect(() => {
    // Read on mount rather than via useSearchParams (static export would need
    // Suspense), then replace the history entry so the token isn't left in
    // the URL or browser history. Validating doesn't consume the link.
    const params = new URLSearchParams(window.location.search)
    tokenRef.current = params.get('token')?.trim() ?? ''
    if (params.has('token')) window.history.replaceState(null, '', window.location.pathname)
    checkLink()
  }, [])

  const strength = computeStrength(password)
  const pwError = password && password.length < MIN_PASSWORD ? `Use at least ${MIN_PASSWORD} characters.` : null
  const matchError = confirmPassword && confirmPassword !== password ? 'Passwords do not match.' : null
  const canSubmit = !loading && !!username.trim() && !!password && !!confirmPassword && !pwError && !matchError

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setError(null)
    setLoading(true)
    try {
      const message = await setInitialPassword(tokenRef.current, username.trim(), password)
      setDoneMessage(message)
      setView('done')
    } catch (err) {
      const code = err instanceof AuthError ? err.code : 'unknown'
      setError(
        // Same response for an expired/used link and a wrong username — right
        // after a successful validate, a username typo is the likely cause.
        code === 'setup_token_invalid' ? 'The username is incorrect, or this link has expired. Check the username your administrator gave you.'
          : code === 'rate_limit_exceeded' ? RATE_LIMIT_MESSAGE
            : code === 'validation_error' ? ((err as AuthError).message || 'Please check the details and try again.')
              : authErrorMessage(code),
      )
    } finally {
      setLoading(false)
    }
  }

  const loginHref = `/login/staff?username=${encodeURIComponent(username.trim())}`

  if (view === 'done') {
    return (
      <PanelA eyebrow="Set up your account" headline="You're all set." centered>
        <SuccessScreen
          subtitle={`${doneMessage} Taking you to sign in…`}
          redirectTo={loginHref}
          redirectDelay={2500}
        />
        <div style={{ marginTop: 8, textAlign: 'center' }}>
          <button type="button" className="isb-btn primary" onClick={() => router.push(loginHref)}>
            Go to sign in <Icon name="arrow" size={15} color="#fff" />
          </button>
        </div>
      </PanelA>
    )
  }

  if (view === 'expired' || view === 'rate-limited') {
    const limited = view === 'rate-limited'
    return (
      <PanelA eyebrow="Set up your account" headline={limited ? 'Please wait a moment.' : 'This link has expired.'}>
        <div className="isb-error-banner" role="alert">
          <Icon name="alert" size={16} color="var(--isb-red)" />
          {limited ? RATE_LIMIT_MESSAGE : 'This setup link is invalid or has expired.'}
        </div>
        {limited ? (
          <button type="button" className="isb-btn primary full" onClick={checkLink}>
            Try again <Icon name="arrow" size={15} color="#fff" />
          </button>
        ) : (
          <>
            <p style={{ color: 'var(--isb-muted)', fontSize: 13.5, margin: '0 0 18px', lineHeight: 1.55 }}>
              Setup links work once and last 7 days. You can still set your password with a code sent to your email.
            </p>
            <button type="button" className="isb-btn primary full" onClick={() => router.push('/login/forgot')}>
              Set it with an email code <Icon name="arrow" size={15} color="#fff" />
            </button>
          </>
        )}
        <div style={{ marginTop: 18, textAlign: 'center' }}>
          <button type="button" className="isb-btn link" onClick={() => router.push('/login/staff')} style={{ fontSize: 12.5 }}>
            <Icon name="back" size={12} /> Go to sign in
          </button>
        </div>
      </PanelA>
    )
  }

  if (view === 'checking') {
    return (
      <PanelA eyebrow="Set up your account" headline="Checking your link…">
        <p role="status" style={{ color: 'var(--isb-muted)', fontSize: 14, margin: 0 }}>One moment while we verify your setup link.</p>
      </PanelA>
    )
  }

  return (
    <PanelA eyebrow="Set up your account" headline="Choose your password.">
      <p style={{ color: 'var(--isb-muted)', fontSize: 14, margin: '0 0 24px', lineHeight: 1.55 }}>
        Enter the username your administrator gave you, then choose a password for the ERP.
      </p>

      {error && (
        <div className="isb-error-banner" role="alert">
          <Icon name="alert" size={16} color="var(--isb-red)" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="isb-field">
          <label className="isb-label" htmlFor="setup-username">Username</label>
          <input
            id="setup-username"
            className="isb-input"
            value={username}
            onChange={e => { setUsername(e.target.value); setError(null) }}
            placeholder="Your staff username (short code)"
            autoComplete="username"
            autoFocus
          />
        </div>

        <div className="isb-field">
          <label className="isb-label" htmlFor="set-password">New password</label>
          <div className="isb-pw-wrap">
            <input
              id="set-password"
              className="isb-input"
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder={`At least ${MIN_PASSWORD} characters`}
              style={{ paddingRight: 62 }}
              autoComplete="new-password"
            />
            <button type="button" className="toggle" onClick={() => setShowPw(s => !s)}>
              {showPw ? 'Hide' : 'Show'}
            </button>
          </div>
          {password && <StrengthBar level={strength} />}
          {pwError && <div className="err">{pwError}</div>}
        </div>

        <div className="isb-field">
          <label className="isb-label" htmlFor="confirm-password">Confirm password</label>
          <div className="isb-pw-wrap">
            <input
              id="confirm-password"
              className="isb-input"
              type={showConfirm ? 'text' : 'password'}
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Repeat your password"
              style={{ paddingRight: 62 }}
              autoComplete="new-password"
            />
            <button type="button" className="toggle" onClick={() => setShowConfirm(s => !s)}>
              {showConfirm ? 'Hide' : 'Show'}
            </button>
          </div>
          {matchError && <div className="err">{matchError}</div>}
        </div>

        <button type="submit" className="isb-btn primary full" style={{ marginTop: 4 }} disabled={!canSubmit}>
          {loading ? 'Setting password…' : <>Set password <Icon name="arrow" size={15} color="#fff" /></>}
        </button>
      </form>

      <div style={{ marginTop: 18, textAlign: 'center', fontSize: 13.5, color: 'var(--isb-muted)' }}>
        Already set a password?{' '}
        <button type="button" onClick={() => router.push('/login/staff')} className="isb-btn link" style={{ fontSize: 13.5 }}>
          Sign in
        </button>
      </div>
    </PanelA>
  )
}
