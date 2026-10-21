'use client'
import { useEffect } from 'react'

// The approval email links to {Frontend:BaseUrlStaff}/set-password?token=…
// (staff-portal-set-password-page.md); the page itself lives with the other
// auth screens under /login. Forwards with the query string intact —
// replace(), so the token-bearing URL doesn't stay in history.
export default function Page() {
  useEffect(() => { window.location.replace(`/login/set-password${window.location.search}`) }, [])
  return null
}
