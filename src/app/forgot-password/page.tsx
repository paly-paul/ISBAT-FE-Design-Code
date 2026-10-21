'use client'
import { useEffect } from 'react'

// staff-portal-forgot-password-page.md documents the route as
// /forgot-password; the page lives with the other auth screens under /login.
export default function Page() {
  useEffect(() => { window.location.replace(`/login/forgot${window.location.search}`) }, [])
  return null
}
