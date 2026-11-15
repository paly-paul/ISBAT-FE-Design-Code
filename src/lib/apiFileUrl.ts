// Signed file links from the API (e.g. an employee's photoUrl) come back as
// absolute URLs on the gateway's host, like
//   https://erp-dev.isbatuniversity.ac.ug/api/v1/users/files/{id}?exp=…&sig=…
// The app itself always talks to the backend through its own origin's /api/*
// (next dev / Vercel rewrites, CloudFront in production), and the login
// cookies belong to that origin. Loading the absolute URL from another origin
// (e.g. localhost) goes out without them and fails. Keep only the path and
// query, so the same signed link is fetched through our /api proxy instead.
// Anything that isn't an /api/ link (blob:, data:, other hosts) is untouched.
export function sameOriginApiUrl(url: string | null | undefined): string | null {
  if (!url) return null
  try {
    const u = new URL(url, typeof window === 'undefined' ? 'http://localhost' : window.location.origin)
    if ((u.protocol === 'http:' || u.protocol === 'https:') && u.pathname.startsWith('/api/')) return `${u.pathname}${u.search}`
    return url
  } catch {
    return url
  }
}
