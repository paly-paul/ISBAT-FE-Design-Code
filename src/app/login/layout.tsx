'use client'
import { useEffect, useLayoutEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { getSessionIdentity } from '@/lib/session'
import { resolvePostLoginTarget } from '@/lib/postLoginRedirect'

// A signed-in staff user who lands on a sign-in page — usually by pressing
// Back after logging in — is sent on to the app instead of seeing the form
// again. Client-side because the static export has no middleware; re-checked
// on `pageshow` since a page restored from the back/forward cache doesn't
// remount. location.replace drops the login entry from history.
//
const GUARDED = new Set(['/login', '/login/staff', '/login/otp'])

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const queryClient = useQueryClient()
  const [redirecting, setRedirecting] = useState(false)

  // Before paint, so the form never flashes for a signed-in user.
  useLayoutEffect(() => {
    const identity = getSessionIdentity()
    setRedirecting(GUARDED.has(pathname) && !!identity)
  }, [pathname])

  useEffect(() => {
    let cancelled = false

    async function check() {
      const identity = getSessionIdentity()
      if (!GUARDED.has(pathname) || !identity) return
      setRedirecting(true)
      // The dashboard itself, not '/academic' — that's only a redirect page,
      // which never settles if the menu lookup above failed.
      const target = await resolvePostLoginTarget(queryClient, '/academic/acad-dashboard')
      if (!cancelled) {
        if (getSessionIdentity()) {
          window.location.replace(target)
        } else {
          setRedirecting(false)
        }
      }
    }

    function onPageShow(e: PageTransitionEvent) {
      if (e.persisted) check()
    }

    check()
    window.addEventListener('pageshow', onPageShow)
    return () => {
      cancelled = true
      window.removeEventListener('pageshow', onPageShow)
    }
  }, [pathname, queryClient])

  if (redirecting) return null
  return <>{children}</>
}
