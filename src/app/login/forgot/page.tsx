'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import PanelA from '@/components/PanelA'
import Icon from '@/components/Icon'
import Stepper from '@/components/Stepper'
import OtpInput from '@/components/OtpInput'
import StrengthBar, { computeStrength } from '@/components/StrengthBar'
import { requestPasswordReset, resetPassword, AuthError } from '@/lib/auth'
import { authErrorMessage } from '@/lib/errorMessages'

// staff-portal-forgot-password-page.md: username → OTP by email → OTP + new
// password in one submit. The page must never reveal whether a username
// exists, so step 1 always moves on and a wrong username surfaces only as
// the same "invalid or expired code" as a wrong OTP.

const RESEND_COOLDOWN = 30
const STEPS = ['Request code', 'New password']
const EMPTY_OTP = ['', '', '', '', '', '']
// POST /reset-password: newPassword min 8 characters.
const MIN_PASSWORD = 8

function errorText(err: unknown): string {
  if (!(err instanceof AuthError)) return authErrorMessage('unknown')
  switch (err.code) {
    case 'rate_limit_exceeded': return 'Too many attempts. Please wait a minute and try again.'
    case 'otp_invalid': return 'Invalid or expired code. Check the code or request a new one.'
    case 'otp_max_attempts': return err.message || 'Too many failed attempts. Please request a new OTP.'
    case 'validation_error': return err.message || 'Please check the details and try again.'
    default: return authErrorMessage(err.code)
  }
}

export default function ForgotPage() {
  const router = useRouter()

  const [step, setStep] = useState(0)
  const [username, setUsername] = useState('')
  const [maskedEmail, setMaskedEmail] = useState('')
  const [digits, setDigits] = useState(EMPTY_OTP)
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  // otp_max_attempts locks the OTP until a new one is requested.
  const [locked, setLocked] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(0)

  // Prefilled from the login page's "Forgot password?" link. Read on mount
  // rather than via useSearchParams (static export would need Suspense).
  useEffect(() => {
    const u = new URLSearchParams(window.location.search).get('username')
    if (u) setUsername(u)
  }, [])

  useEffect(() => {
    if (secondsLeft <= 0) return
    const t = setInterval(() => setSecondsLeft(s => s - 1), 1000)
    return () => clearInterval(t)
  }, [secondsLeft])

  const otp = digits.join('')
  const strength = computeStrength(newPw)
  const pwError = newPw && newPw.length < MIN_PASSWORD ? `Use at least ${MIN_PASSWORD} characters.` : null
  const matchError = confirmPw && newPw !== confirmPw ? 'Passwords do not match.' : null
  const canReset = !loading && !locked && otp.length === 6 && !!newPw && !!confirmPw && !pwError && !matchError

  async function sendCode() {
    setError(null)
    setLoading(true)
    try {
      const result = await requestPasswordReset(username.trim())
      setMaskedEmail(result.maskedEmail)
      setDigits(EMPTY_OTP)
      setLocked(false)
      setSecondsLeft(RESEND_COOLDOWN)
      return true
    } catch (err) {
      setError(errorText(err))
      return false
    } finally {
      setLoading(false)
    }
  }

  // Step 1: request the OTP. Always 200 — moves on whether or not the
  // username exists.
  async function handleRequest(e: React.FormEvent) {
    e.preventDefault()
    if (!username.trim()) { setError('Enter your username.'); return }
    setNotice(null)
    if (await sendCode()) setStep(1)
  }

  // Resending issues a new OTP and resets the attempt counter.
  async function handleResend() {
    if (secondsLeft > 0 || loading) return
    if (await sendCode()) setNotice('A new code is on its way. Earlier codes no longer work.')
  }

  // Step 2: OTP + new password together.
  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    if (!canReset) return
    setError(null)
    setNotice(null)
    setLoading(true)
    try {
      await resetPassword(username.trim(), otp, newPw)
      // Prefill the username on login; ?reset=1 shows the "updated" note.
      router.push(`/login/staff?reset=1&username=${encodeURIComponent(username.trim())}`)
    } catch (err) {
      setError(errorText(err))
      if (err instanceof AuthError && err.code === 'otp_max_attempts') setLocked(true)
      // Wrong code: clear only the OTP, keep the passwords.
      if (err instanceof AuthError && (err.code === 'otp_invalid' || err.code === 'otp_max_attempts')) setDigits(EMPTY_OTP)
    } finally {
      setLoading(false)
    }
  }

  return (
    <PanelA eyebrow="Reset password" headline="We'll get you back in.">
      <div style={{ marginBottom: 22 }}>
        <Stepper steps={STEPS} current={step} />
      </div>

      {error && (
        <div className="isb-error-banner" role="alert">
          <Icon name="alert" size={16} color="var(--isb-red)" />
          {error}
        </div>
      )}

      {step === 0 && (
        <form onSubmit={handleRequest}>
          <p style={{ color: 'var(--isb-muted)', fontSize: 13.5, margin: '0 0 18px', lineHeight: 1.55 }}>
            Enter your username and we&apos;ll email a 6-digit code to the address on your account.
          </p>

          <div className="isb-field">
            <label className="isb-label" htmlFor="forgot-username">Username</label>
            <input
              id="forgot-username"
              className="isb-input"
              value={username}
              onChange={e => { setUsername(e.target.value); setError(null) }}
              placeholder="The staff ID you sign in with"
              autoComplete="username"
              autoFocus
            />
          </div>

          <button type="submit" className="isb-btn primary full" disabled={loading || !username.trim()}>
            {loading ? 'Sending…' : <>Send code <Icon name="arrow" size={15} color="#fff" /></>}
          </button>
        </form>
      )}

      {step === 1 && (
        <form onSubmit={handleReset}>
          <p style={{ color: 'var(--isb-muted)', fontSize: 13.5, margin: '0 0 14px', lineHeight: 1.55 }}>
            {maskedEmail
              ? <>We&apos;ve sent a 6-digit code to <b style={{ color: 'var(--isb-ink)' }}>{maskedEmail}</b>.</>
              : 'If this username exists, a code has been sent to its registered email.'}
            {' '}It expires in 10 minutes.
          </p>

          <div className="isb-field">
            <span className="isb-label">Username</span>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, fontSize: 14 }}>
              <b style={{ color: 'var(--isb-ink)' }}>{username.trim()}</b>
              <button
                type="button"
                className="isb-btn link"
                style={{ fontSize: 12 }}
                onClick={() => { setStep(0); setError(null); setNotice(null); setDigits(EMPTY_OTP) }}
              >
                Change username
              </button>
            </div>
          </div>

          <div className="isb-field">
            <span className="isb-label">Code from the email</span>
            <OtpInput value={digits} onChange={d => { setDigits(d); if (error) setError(null) }} />
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              marginTop: 10, fontSize: 12, color: 'var(--isb-muted)',
            }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }} role="status" aria-live="polite">
                <Icon name="clock" size={12} />
                {notice ?? (secondsLeft > 0
                  ? <>Resend available in <span className="nums">{secondsLeft}s</span></>
                  : 'Didn’t get it? Check spam, or resend.')}
              </span>
              <button
                type="button"
                className="isb-btn link"
                style={{ fontSize: 12 }}
                onClick={handleResend}
                disabled={secondsLeft > 0 || loading}
              >
                Resend code
              </button>
            </div>
          </div>

          <div className="isb-field">
            <label className="isb-label" htmlFor="new-pw">New password</label>
            <div className="isb-pw-wrap">
              <input
                id="new-pw"
                className="isb-input"
                type={showNew ? 'text' : 'password'}
                value={newPw}
                onChange={e => setNewPw(e.target.value)}
                placeholder={`At least ${MIN_PASSWORD} characters`}
                style={{ paddingRight: 62 }}
                autoComplete="new-password"
              />
              <button type="button" className="toggle" onClick={() => setShowNew(s => !s)}>
                {showNew ? 'Hide' : 'Show'}
              </button>
            </div>
            {newPw && <StrengthBar level={strength} />}
            {pwError && <div className="err">{pwError}</div>}
          </div>

          <div className="isb-field">
            <label className="isb-label" htmlFor="confirm-pw">Confirm new password</label>
            <div className="isb-pw-wrap">
              <input
                id="confirm-pw"
                className="isb-input"
                type={showConfirm ? 'text' : 'password'}
                value={confirmPw}
                onChange={e => setConfirmPw(e.target.value)}
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

          <button type="submit" className="isb-btn primary full" disabled={!canReset}>
            {loading ? 'Updating…' : <>Reset password <Icon name="check" size={15} color="#fff" /></>}
          </button>
          {locked && (
            <p style={{ marginTop: 10, fontSize: 12, color: 'var(--isb-muted)', textAlign: 'center' }}>
              Request a new code with &ldquo;Resend code&rdquo; to try again.
            </p>
          )}
          <p style={{ marginTop: 12, fontSize: 12, color: 'var(--isb-muted)', textAlign: 'center', lineHeight: 1.5 }}>
            Resetting signs you out on every device.
          </p>
        </form>
      )}

      <div style={{ marginTop: 22, textAlign: 'center' }}>
        <button
          type="button"
          className="isb-btn link"
          onClick={() => router.push('/login/staff')}
          style={{ fontSize: 12.5 }}
        >
          <Icon name="back" size={12} /> Back to sign in
        </button>
      </div>
    </PanelA>
  )
}
