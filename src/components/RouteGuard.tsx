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
// failed, access can't be checked, so the page stays blocked behind an error
// with a Retry button (same as the sidebar) instead of opening.
export function RouteGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { data, isLoading, isError, isFetching, refetch } = useMenu()
  const denied = !!data && !isRouteAllowed(data.menu, pathname)

  useEffect(() => {
    if (denied) router.replace(`/access-denied?from=${encodeURIComponent(pathname)}`)
  }, [denied, pathname, router])

  if (isError) {
    return (
      <div role="alert" style={{ display: 'grid', placeContent: 'center', minHeight: 'calc(100vh - 160px)' }}>
        <div className="tbl-empty-inner">
          <div className="tbl-loading-icon-wrap">
            <i className="lni lni-warning" />
          </div>
          <div className="tbl-empty-title">Couldn&apos;t check your access</div>
          <div className="tbl-empty-sub">Your page permissions didn&apos;t load. Check your connection and try again.</div>
          <button className="btn btn-neu btn-sm" onClick={() => refetch()} disabled={isFetching}>
            <i className="lni lni-reload"></i> {isFetching ? 'Retrying…' : 'Retry'}
          </button>
        </div>
      </div>
    )
  }

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
