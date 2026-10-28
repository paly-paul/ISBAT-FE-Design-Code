import type { QueryClient } from '@tanstack/react-query'
import { MENU_KEY } from '@/hooks/users/useMenu'
import { flattenMenuPages, getMenu, isRouteAllowed } from '@/lib/api/users/menu'
import { safeNext } from '@/lib/loginNext'

export { loginUrlForCurrentPage } from '@/lib/loginNext'

// Where to land after staff login:
//  1. the link the user was trying to open when they were sent to login
//     (carried as /login/staff?next=…), if their menu allows it;
//  2. otherwise the first page of their own menu;
//  3. otherwise the login API's own redirect (e.g. '/academic').
//
// `next` is kept in sessionStorage between the login form and the OTP step,
// since router.push('/login/otp') drops the query string.

const NEXT_KEY = 'isbat_login_next'

// Called when the login form mounts: keeps ?next= for after login (and OTP).
export function rememberNextFromUrl() {
  if (typeof window === 'undefined') return
  try {
    const next = safeNext(new URLSearchParams(window.location.search).get('next'))
    if (next) sessionStorage.setItem(NEXT_KEY, next)
    else sessionStorage.removeItem(NEXT_KEY)
  } catch {}
}

function takeNext(): string | null {
  try {
    const next = safeNext(sessionStorage.getItem(NEXT_KEY))
    sessionStorage.removeItem(NEXT_KEY)
    return next
  } catch {
    return null
  }
}

export async function resolvePostLoginTarget(queryClient: QueryClient, fallback: string): Promise<string> {
  const next = takeNext()
  try {
    // Same cache entry the sidebar uses, so it isn't fetched twice.
    const { menu } = await queryClient.fetchQuery({ queryKey: MENU_KEY, queryFn: getMenu, staleTime: Infinity })
    if (next && isRouteAllowed(menu, next.split(/[?#]/)[0])) return next
    return flattenMenuPages(menu)[0]?.url ?? fallback
  } catch {
    return next ?? fallback
  }
}
