const API_BASE = process.env.NEXT_PUBLIC_API_GATEWAY_URL ?? ''
const MOCK_AUTH = process.env.NEXT_PUBLIC_AUTH_MOCK === 'true'

export const MOCK_CREDENTIALS = {
  staff: { id: 'AR-2024-0001', password: 'Admin@1234',   challengeId: 'mock-staff-challenge'   },
  student: { id: 'ISB/2024/BSCS/0142', password: 'Student@1234', challengeId: 'mock-student-challenge' },
  otp: '123456',
} as const

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

// Staff login

export interface StaffLoginResult {
  requiresOtp: boolean
  challengeId: string
  otpChannel: 'email' | 'sms'
  maskedTarget: string
}

export function staffLogin(staffId: string, password: string, trustDevice: boolean) {
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
  return post<StaffLoginResult>('/api/auth/staff/login', { staffId, password, trustDevice })
}

// Student login

export interface StudentLoginResult {
  requiresOtp: boolean
  challengeId: string
  otpChannel: 'email' | 'sms'
  maskedTarget: string
}

export function studentLogin(studentId: string, password: string) {
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
  return post<StudentLoginResult>('/api/auth/student/login', { studentId, password })
}

// OTP verify

export interface OtpVerifyResult {
  sessionId: string
  role: string
  redirect: string
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
    })
  }
  return post<OtpVerifyResult>('/api/auth/otp/verify', { challengeId, code })
}

// Forgot password

export interface ForgotStartResult {
  challengeId: string
}

export function forgotStart(staffId: string, channel: 'email' | 'sms') {
  if (MOCK_AUTH) {
    return Promise.resolve<ForgotStartResult>({ challengeId: 'mock-challenge-id' })
  }
  return post<ForgotStartResult>('/api/auth/forgot/start', { staffId, channel })
}

export interface ForgotVerifyResult {
  resetToken: string
}

export function forgotVerify(challengeId: string, code: string) {
  if (MOCK_AUTH) {
    return Promise.resolve<ForgotVerifyResult>({ resetToken: 'mock-reset-token' })
  }
  return post<ForgotVerifyResult>('/api/auth/forgot/verify', { challengeId, code })
}

export function forgotReset(resetToken: string, newPassword: string) {
  if (MOCK_AUTH) return Promise.resolve()
  return post<void>('/api/auth/forgot/reset', { resetToken, newPassword })
}

// Account activation

export interface ActivateProfile {
  fullName: string
  role: string
  staffId: string
  email: string
  department: string
  createdAt: string
}

export function activateConfirm(activationToken: string) {
  if (MOCK_AUTH) {
    return Promise.resolve<ActivateProfile>({
      fullName: 'Mock User',
      role: 'Staff',
      staffId: activationToken,
      email: 'mock@isbat.ac.ug',
      department: 'Academic Affairs',
      createdAt: new Date().toISOString(),
    })
  }
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
  if (MOCK_AUTH) {
    return Promise.resolve<ActivateSetupResult>({
      sessionId: 'mock-session-id',
      redirect: '/academic',
    })
  }
  return post<ActivateSetupResult>('/api/auth/activate/setup', {
    activationToken,
    password,
    otpChannel,
    consent,
  })
}
