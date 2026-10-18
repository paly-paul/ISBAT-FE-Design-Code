// The "come back here after login" link (/login/staff?next=…). Kept free of
// imports so lib/api/client.ts can use it without a circular import; the
// post-login choice itself lives in lib/postLoginRedirect.ts.

// Only same-site app paths — never another site ("//evil.com", "https://…")
// and never back into the login pages themselves.
export function safeNext(value: string | null | undefined): string | null {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return null
  const path = value.split(/[?#]/)[0]
  if (path === '/' || path.startsWith('/login')) return null
  return value
}

// /login/staff?next=<current page> — used wherever a session check sends the
// user to login, so they come back to the same page afterwards.
export function loginUrlForCurrentPage(): string {
  if (typeof window === 'undefined') return '/login/staff'
  const next = safeNext(window.location.pathname + window.location.search)
  return next ? `/login/staff?next=${encodeURIComponent(next)}` : '/login/staff'
}
