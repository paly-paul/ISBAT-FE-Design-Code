const API_BASE = process.env.NEXT_PUBLIC_API_GATEWAY_URL ?? ''

// The dev backend is tunneled through ngrok's free tier, which serves an
// HTML "you're about to visit..." interstitial (ERR_NGROK_6024) instead of
// the real response for any request that looks browser-originated — this
// header opts out of that. No-op against a real gateway that isn't ngrok.
const NGROK_HEADERS = { 'ngrok-skip-browser-warning': 'true' }

export class AuthError extends Error {
  constructor(
    public readonly code: string,
    message?: string,
  ) {
    super(message ?? code)
    this.name = 'AuthError'
  }
}

// Endpoints that must never trigger the refresh-and-retry dance: an
// "unauthorized" here means bad credentials or a dead refresh token, not an
// expired access token to recover from.
const AUTH_ENDPOINTS = ['/auth/login', '/auth/refresh', '/auth/logout']

function isAuthEndpoint(path: string): boolean {
  return AUTH_ENDPOINTS.some(endpoint => path.includes(endpoint))
}

// Deduped in-flight refresh so concurrent 401s trigger a single refresh call.
let refreshInFlight: Promise<void> | null = null

function refreshAccessToken(): Promise<void> {
  if (!refreshInFlight) {
    refreshInFlight = apiPost<unknown>('/api/v1/users/auth/refresh', {})
      .then(() => undefined)
      .finally(() => {
        refreshInFlight = null
      })
  }
  return refreshInFlight
}

function redirectToLogin() {
  if (typeof window !== 'undefined') window.location.href = '/login'
}

// Only a definitive rejection from the refresh endpoint itself (refresh token
// expired/invalid) should force a logout. A network blip, timeout, or gateway
// hiccup while calling /auth/refresh throws a plain error (not AuthError) and
// should surface as a normal failure instead — the session may still be fine.
async function handleUnauthorized(): Promise<void> {
  try {
    await refreshAccessToken()
  } catch (err) {
    if (err instanceof AuthError) redirectToLogin()
    throw err
  }
}

// Legacy raw-JSON endpoints (no envelope) — still used by auth flows the real
// backend hasn't implemented yet (OTP, forgot password, activation).
export async function post<T>(path: string, body: unknown, retried = false): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...NGROK_HEADERS },
    credentials: 'include',
    body: JSON.stringify(body),
  })

  if (res.status === 401 && !isAuthEndpoint(path) && !retried) {
    await handleUnauthorized()
    return post<T>(path, body, true)
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ code: 'unknown' }))
    throw new AuthError(err.code ?? 'unknown', err.message)
  }

  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export async function get<T>(path: string, retried = false): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'GET',
    headers: NGROK_HEADERS,
    credentials: 'include',
  })

  if (res.status === 401 && !isAuthEndpoint(path) && !retried) {
    await handleUnauthorized()
    return get<T>(path, true)
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ code: 'unknown' }))
    throw new AuthError(err.code ?? 'unknown', err.message)
  }

  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

// Envelope used by the real backend: { success, data, message, code, errors }
interface ApiEnvelope<T> {
  success: boolean
  data: T | null
  message: string | null
  code: string | null
  errors: string[] | null
}

export async function apiPost<T>(path: string, body: unknown, retried = false): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...NGROK_HEADERS },
    credentials: 'include',
    body: JSON.stringify(body),
  })

  const envelope = (await res.json().catch(() => null)) as ApiEnvelope<T> | null
  const unauthorized = res.status === 401 || (envelope != null && !envelope.success && envelope.code === 'unauthorized')

  if (unauthorized && !isAuthEndpoint(path) && !retried) {
    await handleUnauthorized()
    return apiPost<T>(path, body, true)
  }

  if (res.ok) {
    // Some endpoints (e.g. login) authenticate purely via Set-Cookie and
    // respond 2xx with no parseable JSON body — that's a legitimate success,
    // not an error, so resolve with null data rather than throwing.
    if (!envelope) return null as T
    if (!envelope.success) {
      throw new AuthError(envelope.code ?? 'unknown', envelope.errors?.[0] ?? envelope.message ?? undefined)
    }
    return envelope.data as T
  }

  throw new AuthError(envelope?.code ?? 'unknown', envelope?.errors?.[0] ?? envelope?.message ?? undefined)
}

export async function apiPut<T>(path: string, body: unknown, retried = false): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...NGROK_HEADERS },
    credentials: 'include',
    body: JSON.stringify(body),
  })

  const envelope = (await res.json().catch(() => null)) as ApiEnvelope<T> | null
  const unauthorized = res.status === 401 || (envelope != null && !envelope.success && envelope.code === 'unauthorized')

  if (unauthorized && !isAuthEndpoint(path) && !retried) {
    await handleUnauthorized()
    return apiPut<T>(path, body, true)
  }

  if (res.ok) {
    if (!envelope) return null as T
    if (!envelope.success) {
      throw new AuthError(envelope.code ?? 'unknown', envelope.errors?.[0] ?? envelope.message ?? undefined)
    }
    return envelope.data as T
  }

  throw new AuthError(envelope?.code ?? 'unknown', envelope?.errors?.[0] ?? envelope?.message ?? undefined)
}

export async function apiDelete<T>(path: string, retried = false): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'DELETE',
    headers: NGROK_HEADERS,
    credentials: 'include',
  })

  const envelope = (await res.json().catch(() => null)) as ApiEnvelope<T> | null
  const unauthorized = res.status === 401 || (envelope != null && !envelope.success && envelope.code === 'unauthorized')

  if (unauthorized && !isAuthEndpoint(path) && !retried) {
    await handleUnauthorized()
    return apiDelete<T>(path, true)
  }

  if (res.ok) {
    if (!envelope) return null as T
    if (!envelope.success) {
      throw new AuthError(envelope.code ?? 'unknown', envelope.errors?.[0] ?? envelope.message ?? undefined)
    }
    return envelope.data as T
  }

  throw new AuthError(envelope?.code ?? 'unknown', envelope?.errors?.[0] ?? envelope?.message ?? undefined)
}

export async function apiGet<T>(path: string, retried = false): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'GET',
    headers: NGROK_HEADERS,
    credentials: 'include',
  })

  const envelope = (await res.json().catch(() => null)) as ApiEnvelope<T> | null
  const unauthorized = res.status === 401 || (envelope != null && !envelope.success && envelope.code === 'unauthorized')

  if (unauthorized && !isAuthEndpoint(path) && !retried) {
    await handleUnauthorized()
    return apiGet<T>(path, true)
  }

  if (res.ok) {
    if (!envelope) return null as T
    if (!envelope.success) {
      throw new AuthError(envelope.code ?? 'unknown', envelope.errors?.[0] ?? envelope.message ?? undefined)
    }
    return envelope.data as T
  }

  throw new AuthError(envelope?.code ?? 'unknown', envelope?.errors?.[0] ?? envelope?.message ?? undefined)
}
