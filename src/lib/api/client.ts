const API_BASE = process.env.NEXT_PUBLIC_API_GATEWAY_URL ?? ''

// Skip ngrok's browser warning page for local gateway requests.
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

// These auth routes should not trigger a refresh loop.
const AUTH_ENDPOINTS = ['/auth/login', '/auth/refresh', '/auth/logout']

function isAuthEndpoint(path: string): boolean {
  return AUTH_ENDPOINTS.some(endpoint => path.includes(endpoint))
}

// Prevent duplicate refresh calls when several requests fail at once.
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

// Only a real refresh failure should log the user out.
async function handleUnauthorized(): Promise<void> {
  try {
    await refreshAccessToken()
  } catch (err) {
    if (err instanceof AuthError) redirectToLogin()
    throw err
  }
}

// Some auth endpoints still use the older plain JSON format.
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

// multipart/form-data variant of apiPost — for endpoints that accept a file
// alongside regular fields (e.g. course unit syllabus upload). No
// Content-Type header: the browser sets the multipart boundary itself when
// FormData is passed straight through to fetch.
export async function apiPostForm<T>(path: string, formData: FormData, retried = false): Promise<T> {
  // Debug: log FormData keys before sending
  console.log(`📡 apiPostForm to ${path}`)
  console.log('📦 FormData entries:')
  for (const [key, value] of formData.entries()) {
    if (value instanceof File) {
      console.log(`   ${key}: [File] ${value.name} (${value.size} bytes, ${value.type})`)
    } else {
      console.log(`   ${key}: "${value}"`)
    }
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: NGROK_HEADERS,
    credentials: 'include',
    body: formData,
  })

  console.log(`📥 Response status: ${res.status}`)
  
  const responseText = await res.text()
  console.log(`📄 Response body: ${responseText || '(empty)'}`)
  
  const envelope = responseText ? (JSON.parse(responseText) as ApiEnvelope<T>) : null
  const unauthorized = res.status === 401 || (envelope != null && !envelope.success && envelope.code === 'unauthorized')

  if (unauthorized && !isAuthEndpoint(path) && !retried) {
    await handleUnauthorized()
    return apiPostForm<T>(path, formData, true)
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

// multipart/form-data variant of apiPut — mirrors apiPostForm for endpoints
// that accept an optional file on update too (e.g. course unit syllabus
// replace).
export async function apiPutForm<T>(path: string, formData: FormData, retried = false): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'PUT',
    headers: NGROK_HEADERS,
    credentials: 'include',
    body: formData,
  })

  const envelope = (await res.json().catch(() => null)) as ApiEnvelope<T> | null
  const unauthorized = res.status === 401 || (envelope != null && !envelope.success && envelope.code === 'unauthorized')

  if (unauthorized && !isAuthEndpoint(path) && !retried) {
    await handleUnauthorized()
    return apiPutForm<T>(path, formData, true)
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
