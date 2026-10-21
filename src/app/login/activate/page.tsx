'use client'
import { useEffect } from 'react'

// The old activation flow (activate/confirm + activate/setup) never existed
// on the backend. Account setup is now /login/set-password
// (staff-portal-set-password-page.md); this forwards any old ?token= link
// there — replace(), so the token-bearing URL doesn't stay in history.
export default function Page() {
  useEffect(() => { window.location.replace(`/login/set-password${window.location.search}`) }, [])
  return null
}
