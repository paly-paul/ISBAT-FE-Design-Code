import { AuthError, post, apiGet, apiPost, apiPostWithMessage, refreshAccessToken, RATE_LIMIT_CODE } from './api/client'
import { setSessionIdentity } from './session'

export { AuthError }

const MOCK_AUTH = process.env.NEXT_PUBLIC_AUTH_MOCK === 'true'

export const MOCK_CREDENTIALS = {
  staff: { id: 'AR-2024-0001', password: 'Admin@1234',   challengeId: 'mock-staff-challenge'   },
  otp: '123456',
} as const

// Staff login

export type StaffLoginResult =
  | { requiresOtp: true; challengeId: string; otpChannel: 'email' | 'sms'; maskedTarget: string }
  | { requiresOtp: false; displayName?: string; employeeName?: string; department?: string; designation?: string; employeeGuid?: string; userGuid?: string; redirect: string }

export function staffLogin(staffId: string, password: string, trustDevice: boolean): Promise<StaffLoginResult> {
  // Allow test password 'Expired@123' or 'expired' in mock or with ?mockExpired=1 param
  const isMockExpired =
    (MOCK_AUTH && (password === 'Expired@123' || password === 'expired')) ||
    (typeof window !== 'undefined' && window.location.search.includes('mockExpired=1') && (password === 'Expired@123' || password === 'expired'))

  if (isMockExpired) {
    return Promise.reject(new AuthError('password_expired', 'Credentials are correct but the account password has expired.'))
  }
  if (MOCK_AUTH) {
    if (staffId !== MOCK_CREDENTIALS.staff.id || password !== MOCK_CREDENTIALS.staff.password)
      return Promise.reject(new AuthError('bad_credentials'))
    return Promise.resolve<StaffLoginResult>({
      requiresOtp: true,
      challengeId: MOCK_CREDENTIALS.staff.challengeId,
      otpChannel: 'email',
      maskedTarget: 'm***@isbat.ac.ug',
    })
  }
  // The API may return no body on success. We keep displayName and guids optional.
  return apiPost<any>('/api/v1/users/auth/login', {
    Username: staffId,
    Password: password,
  }).then(data => {
    const employeeGuid = data?.employeeGuid || data?.userGuid || data?.uuid || data?.id || data?.userId
    const userGuid = data?.userGuid || data?.employeeGuid || data?.uuid || data?.id || data?.userId
    return {
      requiresOtp: false as const,
      displayName: data?.displayName,
      employeeName: data?.employeeName,
      department: data?.department,
      designation: data?.designation,
      employeeGuid,
      userGuid,
      redirect: '/academic',
    }
  })
}

// Session refresh — relies on the httpOnly refresh-token cookie set at login;
// no body needed. Used to silently restore/validate a session (e.g. on layout mount).

export interface RefreshResult {
  employeeName?: string
  department?: string
  designation?: string
  displayName?: string
  employeeGuid?: string
  userGuid?: string
  uuid?: string
}

// A 429 from /auth/refresh means the shared /auth rate limit (10 req/min per
// IP) was hit, not that the session is gone, so callers shouldn't log out.
export function isRateLimited(err: unknown): boolean {
  return err instanceof AuthError && err.code === RATE_LIMIT_CODE
}

export function refreshSession(): Promise<RefreshResult> {
  if (MOCK_AUTH) {
    return Promise.resolve({ displayName: 'Mock User' })
  }
  // Routed through refreshAccessToken() (not a direct apiPost call) so it
  // shares the cross-tab refresh lock and in-tab dedup with the 401 handler
  // in client.ts. The refresh token is single-use, and two tabs sending the
  // same one would revoke every session (post-refresh.md).
  return refreshAccessToken().then(data => {
    if (data && (data.displayName || data.employeeName)) {
      setSessionIdentity({
        displayName: data.displayName || data.employeeName || '',
        ...(data.employeeName ? { employeeName: data.employeeName } : {}),
        ...(data.department ? { department: data.department } : {}),
        ...(data.designation ? { designation: data.designation } : {}),
        ...(data.employeeGuid ? { employeeGuid: data.employeeGuid } : {}),
        ...(data.userGuid ? { userGuid: data.userGuid } : {}),
      })
    }
    return data
  })
}

// Logout — invalidates the httpOnly session cookie; no body needed.

export function logout(): Promise<boolean> {
  if (MOCK_AUTH) return Promise.resolve(true)
  return apiPost<boolean>('/api/v1/users/auth/logout', {})
}

// OTP verify

export interface OtpVerifyResult {
  sessionId: string
  role: string
  redirect: string
  displayName: string
}

export function otpVerify(challengeId: string, code: string) {
  if (MOCK_AUTH) {
    if (code !== MOCK_CREDENTIALS.otp)
      return Promise.reject(new AuthError('invalid_code'))
    return Promise.resolve<OtpVerifyResult>({
      sessionId: 'mock-session-id',
      role: 'staff',
      redirect: '/academic',
      displayName: 'Mock User',
    })
  }
  return post<OtpVerifyResult>('/api/auth/otp/verify', { challengeId, code })
}

// Forgot password (staff-portal-forgot-password-page.md)
// Two calls: request an OTP by username, then send the OTP together with the
// new password. There is no separate "verify OTP" step or reset token.

export interface ForgotPasswordResult {
  // "" when no account matched, or the account has no email — the page must
  // not say the username is wrong (post-forgot-password.md).
  maskedEmail: string
}

export function requestPasswordReset(username: string): Promise<ForgotPasswordResult> {
  if (MOCK_AUTH) return Promise.resolve({ maskedEmail: 'ad***@isbat.ac.ug' })
  return apiPost<ForgotPasswordResult | null>('/api/v1/users/auth/forgot-password', { username })
    .then(data => ({ maskedEmail: data?.maskedEmail ?? '' }))
}

// Resolves with the API's success message ("Password reset successfully.").
// Errors: otp_invalid, otp_max_attempts, validation_error, rate_limit_exceeded.
export function resetPassword(username: string, otp: string, newPassword: string): Promise<string> {
  if (MOCK_AUTH) {
    if (otp !== MOCK_CREDENTIALS.otp) return Promise.reject(new AuthError('otp_invalid', 'Invalid or expired OTP.'))
    return Promise.resolve('Password reset successfully.')
  }
  return apiPostWithMessage<boolean>('/api/v1/users/auth/reset-password', { username, otp, newPassword })
    .then(r => r.message || 'Password reset successfully.')
}

// Set password from the approval email (staff-portal-set-password-page.md)

// Doesn't consume the token and doesn't check the username. Rejects with
// setup_token_invalid when the link is unknown, used or expired.
export function validateSetupToken(token: string): Promise<boolean> {
  if (MOCK_AUTH) {
    return token === 'expired'
      ? Promise.reject(new AuthError('setup_token_invalid', 'This setup link is invalid or has expired.'))
      : Promise.resolve(true)
  }
  return apiGet<boolean>(`/api/v1/users/auth/validate-setup-token?token=${encodeURIComponent(token)}`)
}

// Resolves with the API's success message. setup_token_invalid also covers a
// username that doesn't match the token's account — same response by design.
export function setInitialPassword(token: string, username: string, newPassword: string): Promise<string> {
  if (MOCK_AUTH) return Promise.resolve('Password set successfully. You can now log in.')
  return apiPostWithMessage<boolean>('/api/v1/users/auth/set-password', { token, username, newPassword })
    .then(r => r.message || 'Password set successfully. You can now log in.')
}


// Change expired password (userrole-service.auth.change-expired-password)
export interface ChangeExpiredPasswordResult {
  requiresOtp: false
  displayName?: string
  employeeGuid?: string
  userGuid?: string
  redirect: string
}

export function changeExpiredPassword(
  username: string,
  currentPassword: string,
  newPassword: string
): Promise<ChangeExpiredPasswordResult> {
  if (MOCK_AUTH || (typeof window !== 'undefined' && window.location.search.includes('mockExpired=1'))) {
    if (!newPassword || newPassword.length < 8) {
      return Promise.reject(new AuthError('validation_error', 'Password must be at least 8 characters.'))
    }
    return Promise.resolve<ChangeExpiredPasswordResult>({
      requiresOtp: false,
      displayName: 'Staff User',
      redirect: '/academic',
    })
  }

  return apiPost<any>('/api/v1/users/auth/change-expired-password', {
    username,
    currentPassword,
    newPassword,
  }).then(data => {
    const employeeGuid = data?.employeeGuid || data?.userGuid || data?.uuid || data?.id || data?.userId
    const userGuid = data?.userGuid || data?.employeeGuid || data?.uuid || data?.id || data?.userId
    return {
      requiresOtp: false as const,
      displayName: data?.displayName,
      employeeName: data?.employeeName,
      department: data?.department,
      designation: data?.designation,
      employeeGuid,
      userGuid,
      redirect: '/academic',
    }
  })
}
