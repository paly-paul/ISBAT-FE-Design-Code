const KEY = 'isbat_login_flow'

export interface LoginFlowState {
  challengeId?: string
  otpChannel?: 'email' | 'sms'
  maskedTarget?: string
  forgotChallengeId?: string
  forgotResetToken?: string
  returnTo?: string
}

export function getFlowState(): LoginFlowState {
  if (typeof window === 'undefined') return {}
  try {
    return JSON.parse(sessionStorage.getItem(KEY) ?? '{}') as LoginFlowState
  } catch {
    return {}
  }
}

export function setFlowState(data: Partial<LoginFlowState>) {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(KEY, JSON.stringify({ ...getFlowState(), ...data }))
}

export function clearFlowState() {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem(KEY)
}
