'use client'
import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useMenu } from '@/hooks/users/useMenu'
import { isRouteAllowed } from '@/lib/api/users/menu'

// Sends a route the user's /me/menu doesn't grant (see isRouteAllowed) to
// /access-denied, so a typed URL can't open a page they lack. replace, not
// push, so Back skips the forbidden URL instead of bouncing into it again.
// Holds the page back while the menu loads (and while redirecting) so a
// forbidden page never flashes or fires its API calls. If the menu call
// failed (isFallback / error) it fails open, same as the sidebar and
// usePagePermissions.
export function RouteGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { data, isLoading } = useMenu()
  const denied = !!data && !data.isFallback && !isRouteAllowed(data.menu, pathname)

  useEffect(() => {
    if (denied) router.replace(`/access-denied?from=${encodeURIComponent(pathname)}`)
  }, [denied, pathname, router])

  if (isLoading || denied) {
    return (
      <div role="status" style={{ display: 'grid', placeContent: 'center', minHeight: 'calc(100vh - 160px)' }}>
        <div className="tbl-empty-inner">
          <div className="tbl-loading-icon-wrap">
            <i className="lni lni-reload" />
          </div>
          <div className="tbl-empty-title">Loading page…</div>
          <div className="tbl-empty-sub">Checking your access, just a moment.</div>
          <div className="tbl-loading-dots">
            <span className="tbl-loading-dot" />
            <span className="tbl-loading-dot" />
            <span className="tbl-loading-dot" />
          </div>
        </div>
      </div>
    )
  }
  return <>{children}</>
}
