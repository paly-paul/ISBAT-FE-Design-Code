import { AuthError, post, apiGet, apiPost, apiPostWithMessage, refreshAccessTokenWithRetry } from './api/client'

export { AuthError }

const MOCK_AUTH = process.env.NEXT_PUBLIC_AUTH_MOCK === 'true'

export const MOCK_CREDENTIALS = {
  staff: { id: 'AR-2024-0001', password: 'Admin@1234',   challengeId: 'mock-staff-challenge'   },
  student: { id: 'ISB/2024/BSCS/0142', password: 'Student@1234', challengeId: 'mock-student-challenge' },
  otp: '123456',
} as const

// Staff login

export type StaffLoginResult =
  | { requiresOtp: true; challengeId: string; otpChannel: 'email' | 'sms'; maskedTarget: string }
  | { requiresOtp: false; displayName?: string; employeeGuid?: string; userGuid?: string; redirect: string }

export function staffLogin(staffId: string, password: string, trustDevice: boolean): Promise<StaffLoginResult> {
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
      employeeGuid,
      userGuid,
      redirect: '/academic',
    }
  })
}

// Student login

export type StudentLoginResult =
  | { requiresOtp: true; challengeId: string; otpChannel: 'email' | 'sms'; maskedTarget: string }
  | { requiresOtp: false; displayName?: string; redirect: string }

export function studentLogin(studentId: string, password: string): Promise<StudentLoginResult> {
  if (MOCK_AUTH) {
    if (studentId !== MOCK_CREDENTIALS.student.id || password !== MOCK_CREDENTIALS.student.password)
      return Promise.reject(new AuthError('bad_credentials'))
    return Promise.resolve<StudentLoginResult>({
      requiresOtp: true,
      challengeId: MOCK_CREDENTIALS.student.challengeId,
      otpChannel: 'email',
      maskedTarget: 's***@student.isbat.ac.ug',
    })
  }
  // The API may respond with no body on success.
  return apiPost<{ displayName: string } | null>('/api/v1/users/auth/login', {
    Username: studentId,
    Password: password,
  }).then(data => ({ requiresOtp: false as const, displayName: data?.displayName, redirect: '' }))
}

// Session refresh — relies on the httpOnly refresh-token cookie set at login;
// no body needed. Used to silently restore/validate a session (e.g. on layout mount).

export interface RefreshResult {
  displayName?: string
  employeeGuid?: string
  userGuid?: string
  uuid?: string
}

export function refreshSession(): Promise<RefreshResult> {
  if (MOCK_AUTH) {
    return Promise.resolve({ displayName: 'Mock User' })
  }
  // Routed through refreshAccessTokenWithRetry() (not a direct apiPost call)
  // so every caller — the mount-time check AND the proactive keep-alive
  // interval in every module layout — shares both the in-flight dedup and
  // the retry-once-after-500ms tolerance for a racy rotation collision
  // (confirmed live: two /auth/refresh calls with the same still-valid
  // token race 200/401 against each other). Without the retry, a call here
  // that lost that race would be treated as a genuinely dead session and
  // log the user out — which is exactly what happened before this used the
  // retrying variant; see the note on refreshAccessTokenWithRetry in
  // client.ts.
  return refreshAccessTokenWithRetry()
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
    const isStudent = challengeId === MOCK_CREDENTIALS.student.challengeId
    return Promise.resolve<OtpVerifyResult>({
      sessionId: 'mock-session-id',
      role: isStudent ? 'student' : 'staff',
      redirect: isStudent ? '' : '/academic',
      displayName: isStudent ? 'Mock Student' : 'Mock User',
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
