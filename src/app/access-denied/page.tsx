'use client'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { flattenMenuPages, findCatalogPage, AppPage } from '@/lib/api/users/menu'
import { useMenu } from '@/hooks/users/useMenu'
import { getSessionIdentity } from '@/lib/session'

// App-wide 403 — "You don't have access to this page.", beside an access
// list where every row is ticked except the viewer's. Sibling of not-found.tsx and built
// on its .nf shell. RouteGuard sends a route the user's menu doesn't grant
// here as /access-denied?from=<path>; the query is read from
// window.location after mount since the static build has no request-time
// searchParams.
//
// RBAC: like the 404, the page links only ever come from the user's own
// menu (useMenu), never from the catalog — the catalog is used only to name
// the page they were turned away from.

const DASHBOARD = '/academic/acad-dashboard'

// The register's other students; bar widths stand in for names.
const ROWS = [
  { initials: 'AN', tone: 'blue', w: 62 },
  { initials: 'BK', tone: 'green', w: 48 },
  { initials: 'MO', tone: 'purple', w: 70 },
  { initials: 'JT', tone: 'amber', w: 54 },
]

export default function AccessDenied() {
  const router = useRouter()
  const [from, setFrom] = useState('')
  const [signedIn, setSignedIn] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const { data: menuResult, isLoading: menuLoading, isError: menuError } = useMenu(signedIn)
  const pagesAvailable = signedIn && !!menuResult && !menuResult.isFallback
  const pages = useMemo(
    () => (pagesAvailable && menuResult ? flattenMenuPages(menuResult.menu) : []),
    [pagesAvailable, menuResult],
  )

  useEffect(() => {
    const raw = new URLSearchParams(window.location.search).get('from') ?? ''
    // Only an in-app path is shown; anything else is dropped.
    setFrom(raw.startsWith('/') && !raw.startsWith('//') ? raw.replace(/\/+$/, '') || '/' : '')
    const identity = getSessionIdentity()
    setSignedIn(!!identity)
    setDisplayName(identity?.displayName ?? '')
  }, [])

  const target = from ? findCatalogPage(from) : undefined
  const moduleSeg = from.split('/')[1] ?? ''

  // Pages from the same module first (the likeliest next stop), then the
  // rest of the menu — always 4 or fewer, always ones they can open.
  const jumpLinks = useMemo(() => {
    const same = pages.filter(p => p.url.split('/')[1] === moduleSeg)
    const rest = pages.filter(p => p.url.split('/')[1] !== moduleSeg)
    return [...same, ...rest].slice(0, 4)
  }, [pages, moduleSeg])

  const homeHref = !pagesAvailable || pages.some(p => p.url === DASHBOARD) ? DASHBOARD : pages[0]?.url ?? '/profile'
  const home = signedIn
    ? { href: homeHref, label: 'Back to dashboard' }
    : { href: '/login/staff', label: 'Sign in' }

  function goBack() {
    if (window.history.length > 1) router.back()
    else router.push(home.href)
  }

  return (
    <main className="nf ad">
      <div className="nf-shell">
      <header className="nf-brand">
        <span className="nf-brand-mark" aria-hidden="true">IS</span>
        <span className="nf-brand-name">ISBAT University ERP</span>
      </header>

      <div className="nf-stage">
        <section className="nf-copy" aria-labelledby="ad-title">
          <p className="nf-code ad-code">Error 403</p>
          <h1 id="ad-title" className="nf-title">You don&rsquo;t have access to this page.</h1>
          <p className="nf-lead">
            Your account doesn&rsquo;t have permission to open {target ? <><strong className="ad-target">{target.name}</strong> ({target.module})</> : 'this page'}.
            If you need it, ask your system administrator to grant access.
          </p>
          {from && from !== '/' && <p className="nf-path">You tried <code>{from}</code></p>}

          <div className="nf-actions">
            <Link href={home.href} className="btn btn-primary nf-btn" prefetch={false}>{home.label}</Link>
            <button type="button" className="btn btn-neu nf-btn" onClick={goBack}>Go back</button>
          </div>

          <div className="nf-more">
            {!signedIn ? (
              <p className="nf-note">Sign in to see the pages you can open.</p>
            ) : !pagesAvailable ? (
              <p className="nf-note" aria-live="polite">
                {menuLoading
                  ? <><span className="nf-spinner" aria-hidden="true"></span> Loading your pages…</>
                  : (menuError || menuResult?.isFallback) && 'Your page list couldn’t be loaded right now.'}
              </p>
            ) : (
              <>
                {jumpLinks.length > 0 && (
                  <nav className="nf-jump" aria-label="Pages you can open">
                    <span>Pages you can open</span>
                    {jumpLinks.map(p => (
                      <Link key={p.url} href={p.url} prefetch={false} title={[p.module, p.section, p.name].filter(Boolean).join(' › ')}>{p.name}</Link>
                    ))}
                  </nav>
                )}
              </>
            )}
            {signedIn && displayName && (
              <p className="nf-note ad-who">
                <i className="lni lni-user" aria-hidden="true"></i>
                <span>Signed in as <strong>{displayName}</strong>. Wrong account? Sign out and sign in again.</span>
              </p>
            )}
          </div>
        </section>

        <div className="ad-register" aria-hidden="true">
          <div className="ad-reg-hdr">
            <span className="ad-reg-title">Access list</span>
            <span className="ad-reg-page">{target?.name ?? 'Restricted page'}</span>
          </div>
          <ol className="ad-reg-list">
            {ROWS.map((r, i) => (
              <li key={r.initials} className="ad-row" style={{ '--i': i } as React.CSSProperties}>
                <span className={`ad-avatar ${r.tone}`}>{r.initials}</span>
                <span className="ad-bar" style={{ width: `${r.w}%` }}></span>
                <i className="lni lni-checkmark-circle ad-tick"></i>
              </li>
            ))}
            <li className="ad-row ad-row-you" style={{ '--i': ROWS.length } as React.CSSProperties}>
              <span className="ad-avatar you"><i className="lni lni-user"></i></span>
              <span className="ad-you">
                <b>You</b>
                {displayName && <small>{displayName}</small>}
              </span>
              <span className="ad-stamp"><i className="lni lni-lock"></i> No access</span>
            </li>
          </ol>
        </div>
      </div>

      {/* <footer className="nf-foot">Still stuck? Contact the ICT help desk.</footer> */}
      </div>
    </main>
  )
}
