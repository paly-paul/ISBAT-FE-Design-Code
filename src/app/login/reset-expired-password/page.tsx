'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import PanelA from '@/components/PanelA'
import Icon from '@/components/Icon'
import StrengthBar, { computeStrength } from '@/components/StrengthBar'
import SuccessScreen from '@/components/SuccessScreen'
import { changeExpiredPassword, AuthError } from '@/lib/auth'
import { getFlowState, clearFlowState, setSessionIdentity } from '@/lib/session'
import { authErrorMessage } from '@/lib/errorMessages'
import { resolvePostLoginTarget } from '@/lib/postLoginRedirect'

const MIN_PASSWORD = 8

export default function ResetExpiredPasswordPage() {
  const router = useRouter()
  const queryClient = useQueryClient()

  const [username, setUsername] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successState, setSuccessState] = useState<{ displayName?: string; redirect: string } | null>(null)

  useEffect(() => {
    const flow = getFlowState()
    const searchParams = new URLSearchParams(window.location.search)
    const urlUser = searchParams.get('username')

    if (flow.username) {
      setUsername(flow.username)
    } else if (urlUser) {
      setUsername(urlUser)
    }

    if (flow.currentPassword) {
      setCurrentPassword(flow.currentPassword)
    }
  }, [])

  const strength = computeStrength(newPassword)
  const pwLengthError = newPassword && newPassword.length < MIN_PASSWORD ? `Password must be at least ${MIN_PASSWORD} characters.` : null
  const pwSameError = newPassword && currentPassword && newPassword === currentPassword ? 'New password cannot be the same as current password.' : null
  const pwMatchError = confirmPassword && newPassword !== confirmPassword ? 'Passwords do not match.' : null

  const canSubmit =
    !loading &&
    !!username.trim() &&
    !!currentPassword &&
    !!newPassword &&
    !!confirmPassword &&
    !pwLengthError &&
    !pwSameError &&
    !pwMatchError

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return

    setError(null)
    setLoading(true)

    try {
      const result = await changeExpiredPassword(username.trim(), currentPassword, newPassword)

      setSessionIdentity({
        displayName: result.displayName || username.trim(),
        employeeGuid: result.employeeGuid,
        userGuid: result.userGuid,
      })
      clearFlowState()

      const target = await resolvePostLoginTarget(queryClient, result.redirect || '/academic')
      setSuccessState({ displayName: result.displayName, redirect: target })
    } catch (err: any) {
      if (err instanceof AuthError) {
        if (err.code === 'password_not_expired') {
          setError('Your password is not expired. Please sign in with your current password.')
        } else if (err.code === 'validation_error') {
          setError(err.message || 'Validation error. Password must be at least 8 characters.')
        } else if (err.code === 'unauthorized' || err.code === 'bad_credentials') {
          setError('Current password is incorrect. Please check and try again.')
        } else {
          setError(err.message || authErrorMessage(err.code))
        }
      } else {
        setError('Failed to update expired password. Please try again or contact IT support.')
      }
    } finally {
      setLoading(false)
    }
  }

  if (successState) {
    return (
      <PanelA eyebrow="Security Notice" headline="Password updated." centered>
        <SuccessScreen
          subtitle={
            successState.displayName
              ? `Password changed successfully. Welcome back, ${successState.displayName}.`
              : 'Password changed successfully. Signing you in…'
          }
          redirectTo={successState.redirect}
        />
      </PanelA>
    )
  }

  return (
    <PanelA eyebrow="Security Notice" headline="Your password has expired.">
      <div
        style={{
          padding: '14px 16px',
          background: '#FFF6EA',
          border: '1px solid #F3DDB7',
          borderRadius: 10,
          fontSize: 13,
          color: '#7A4B11',
          marginBottom: 20,
          display: 'flex',
          gap: 12,
          alignItems: 'flex-start',
        }}
      >
        <div style={{ marginTop: 2 }}>
          <Icon name="clock" size={18} color="#B87914" />
        </div>
        <div>
          <div style={{ fontWeight: 600, marginBottom: 3 }}>Password Expiry Policy</div>
          Per university policy, passwords must be updated every 90 days. Please set a new password below to regain access.
        </div>
      </div>

      {error && (
        <div className="isb-error-banner" role="alert" style={{ marginBottom: 16 }}>
          <Icon name="alert" size={16} color="var(--isb-red)" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Username / Staff ID */}
        <div className="isb-field">
          <label className="isb-label" htmlFor="username">
            Staff ID / Username
          </label>
          <input
            id="username"
            className="isb-input"
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="e.g. AR-2019-0042"
            autoComplete="username"
            disabled={loading}
          />
        </div>

        {/* Current Password */}
        <div className="isb-field">
          <label className="isb-label" htmlFor="current-pw">
            Current (Expired) Password
          </label>
          <div className="isb-pw-wrap">
            <input
              id="current-pw"
              className="isb-input"
              type={showCurrent ? 'text' : 'password'}
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              style={{ paddingRight: 62 }}
              autoComplete="current-password"
              disabled={loading}
            />
            <button
              type="button"
              className="toggle"
              onClick={() => setShowCurrent(s => !s)}
              tabIndex={-1}
            >
              {showCurrent ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        {/* New Password */}
        <div className="isb-field">
          <label className="isb-label" htmlFor="new-pw">
            New Password
          </label>
          <div className="isb-pw-wrap">
            <input
              id="new-pw"
              className="isb-input"
              type={showNew ? 'text' : 'password'}
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="At least 8 characters"
              style={{ paddingRight: 62 }}
              autoComplete="new-password"
              disabled={loading}
            />
            <button
              type="button"
              className="toggle"
              onClick={() => setShowNew(s => !s)}
              tabIndex={-1}
            >
              {showNew ? 'Hide' : 'Show'}
            </button>
          </div>
          {newPassword && (
            <div style={{ marginTop: 8 }}>
              <StrengthBar level={strength} />
            </div>
          )}
          {pwLengthError && <div className="err">{pwLengthError}</div>}
          {pwSameError && <div className="err">{pwSameError}</div>}
        </div>

        {/* Confirm Password */}
        <div className="isb-field">
          <label className="isb-label" htmlFor="confirm-pw">
            Confirm New Password
          </label>
          <div className="isb-pw-wrap">
            <input
              id="confirm-pw"
              className="isb-input"
              type={showConfirm ? 'text' : 'password'}
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              style={{ paddingRight: 62 }}
              autoComplete="new-password"
              disabled={loading}
            />
            <button
              type="button"
              className="toggle"
              onClick={() => setShowConfirm(s => !s)}
              tabIndex={-1}
            >
              {showConfirm ? 'Hide' : 'Show'}
            </button>
          </div>
          {pwMatchError && <div className="err">{pwMatchError}</div>}
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="isb-btn primary full"
          disabled={!canSubmit}
          style={{ marginTop: 22 }}
        >
          {loading ? (
            <>
              <span
                className="spin"
                style={{
                  width: 14,
                  height: 14,
                  border: '2px solid rgba(255,255,255,.4)',
                  borderTopColor: '#fff',
                  borderRadius: 99,
                }}
              />
              Updating password…
            </>
          ) : (
            <>
              Update Password & Sign In <Icon name="arrow" size={15} color="#fff" />
            </>
          )}
        </button>

        {/* Back link */}
        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <button
            type="button"
            className="isb-btn link"
            onClick={() => router.push('/login/staff')}
            style={{ fontSize: 13 }}
          >
            ← Back to Sign In
          </button>
        </div>
      </form>
    </PanelA>
  )
}
