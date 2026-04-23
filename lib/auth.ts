const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? ''

export class AuthError extends Error {
  constructor(
    public readonly code: string,
    message?: string,
  ) {
    super(message ?? code)
    this.name = 'AuthError'
  }
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ code: 'unknown' }))
    throw new AuthError(err.code ?? 'unknown', err.message)
  }

  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

// ── Staff login ──────────────────────────────────────────────────────────────

export interface StaffLoginResult {
  requiresOtp: boolean
  challengeId: string
  otpChannel: 'email' | 'sms'
  maskedTarget: string
}

export function staffLogin(staffId: string, password: string, trustDevice: boolean) {
  return post<StaffLoginResult>('/api/auth/staff/login', { staffId, password, trustDevice })
}

// ── Student login ────────────────────────────────────────────────────────────

export interface StudentLoginResult {
  sessionId: string
  role: 'student'
  redirect: string
}

export function studentLogin(studentId: string, password: string) {
  return post<StudentLoginResult>('/api/auth/student/login', { studentId, password })
}

// ── OTP verify ───────────────────────────────────────────────────────────────

export interface OtpVerifyResult {
  sessionId: string
  role: string
  redirect: string
}

export function otpVerify(challengeId: string, code: string) {
  return post<OtpVerifyResult>('/api/auth/otp/verify', { challengeId, code })
}

// ── Forgot password ──────────────────────────────────────────────────────────

export interface ForgotStartResult {
  challengeId: string
}

export function forgotStart(staffId: string, channel: 'email' | 'sms') {
  return post<ForgotStartResult>('/api/auth/forgot/start', { staffId, channel })
}

export interface ForgotVerifyResult {
  resetToken: string
}

export function forgotVerify(challengeId: string, code: string) {
  return post<ForgotVerifyResult>('/api/auth/forgot/verify', { challengeId, code })
}

export function forgotReset(resetToken: string, newPassword: string) {
  return post<void>('/api/auth/forgot/reset', { resetToken, newPassword })
}

// ── Account activation ───────────────────────────────────────────────────────

export interface ActivateProfile {
  fullName: string
  role: string
  staffId: string
  email: string
  department: string
  createdAt: string
}

export function activateConfirm(activationToken: string) {
  return post<ActivateProfile>('/api/auth/activate/confirm', { activationToken })
}

export interface ActivateSetupResult {
  sessionId: string
  redirect: string
}

export function activateSetup(
  activationToken: string,
  password: string,
  otpChannel: 'email' | 'sms',
  consent: boolean,
) {
  return post<ActivateSetupResult>('/api/auth/activate/setup', {
    activationToken,
    password,
    otpChannel,
    consent,
  })
}
