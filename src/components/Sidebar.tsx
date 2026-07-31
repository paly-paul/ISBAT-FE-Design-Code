'use client'
import { Dispatch, SetStateAction, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useMenu } from '@/hooks/users/useMenu'
import { MenuNode } from '@/lib/api/users/menu'

export type RailId = 'admission' | 'academic' | 'finance' | 'student' | 'employee' | 'config'

interface SidebarProps {
  panelOpen: boolean
  setPanelOpen: Dispatch<SetStateAction<boolean>>
  currentPage: string
  collapsedSections: Set<string>
  toggleCollapse: (id: string) => void
  activeRail: RailId
  setActiveRail: Dispatch<SetStateAction<RailId>>
}

interface RailDef {
  id: RailId
  name: string
  fallbackIcon: string
  footer: string
}

// name must match the top-level `name` field the menu API returns for that
// module — used to look the node up in the fetched tree.
const RAIL_DEFS: RailDef[] = [
  { id: 'admission', name: 'Admission', fallbackIcon: 'lni lni-clipboard', footer: 'S1 · Admission Service' },
  { id: 'academic', name: 'Academic', fallbackIcon: 'lni lni-graduation', footer: 'S2 · Academic Service' },
  { id: 'finance', name: 'Finance', fallbackIcon: 'lni lni-dollar', footer: 'S5 · Finance Service' },
  { id: 'student', name: 'Student', fallbackIcon: 'lni lni-user', footer: 'S10 · Student Service' },
  { id: 'employee', name: 'Employee', fallbackIcon: 'lni lni-briefcase', footer: 'S4 · Employee Service' },
  { id: 'config', name: 'Config', fallbackIcon: 'lni lni-cog', footer: 'S0 · Core Config' },
]

// Cosmetic-only counters — the menu API carries no notion of these, so they
// stay local and are keyed by the leaf's url slug. Real permission data from
// the API still decides what's visible; this only decorates what's shown.
const BADGES: Record<string, { text: string; variant?: 'warn' | 'green' }> = {
  'enquiry-list': { text: '8' },
  'enquiry-followup': { text: '4', variant: 'warn' },
  payment: { text: '12' },
  filing: { text: '7', variant: 'warn' },
  vetting: { text: '5', variant: 'warn' },
  registration: { text: '3', variant: 'green' },
  'session-movement': { text: '1', variant: 'warn' },
  'odl-applications': { text: '7' },
  'odl-reconciliation': { text: '4', variant: 'warn' },
}

function slug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

// The backend's `url` field is a bare slug ("permission-master"), not the
// full path ("/config/permission-master") docs/MENU_ROUTES_REFERENCE.md
// specified — confirmed via a real /me/menu response. A relative href would
// resolve against whatever page the user is currently on (e.g. clicking a
// Config item while on /academic/* would 404 at /academic/permission-master),
// so every leaf is resolved against its own module's route segment here.
// Still honours an absolute path if the backend ever does send one.
function resolveHref(url: string, railId: RailId): string {
  return url.startsWith('/') ? url : `/${railId}/${url}`
}

function idFromUrl(url: string): string {
  return url.split('/').filter(Boolean).pop()!
}

function collectUrls(menu: MenuNode[], railDefs: RailDef[]): string[] {
  const out: string[] = []
  function walk(nodes: MenuNode[], railId: RailId) {
    for (const n of nodes) {
      if (n.url) out.push(resolveHref(n.url, railId))
      if (n.children.length) walk(n.children, railId)
    }
  }
  for (const moduleNode of menu) {
    const def = railDefs.find(d => d.name === moduleNode.name)
    if (def) walk(moduleNode.children, def.id)
  }
  return out
}

export function Sidebar({ panelOpen, setPanelOpen, currentPage, collapsedSections, toggleCollapse, activeRail, setActiveRail }: SidebarProps) {
  const router = useRouter()
  const { data, isLoading, isError, refetch } = useMenu()
  const menu = data?.menu
  const isFallback = data?.isFallback ?? false

  // Warm the active module's routes so switching pages within it is instant.
  // Deliberately scoped to just activeRail, not the whole menu — prefetching
  // every module on every login used to fire router.prefetch() for 60+ routes
  // in one burst. That's a no-op in `next dev` (prefetch is suppressed there),
  // which is why it looked fine locally, but a production build actually
  // issues each prefetch as a real request, and that burst was enough to trip
  // a rate/concurrency limit on Vercel. Re-runs (and re-warms) whenever the
  // user switches rails, staggered slightly so even one module's routes don't
  // all fire on the same tick.
  useEffect(() => {
    if (!menu) return
    const activeModule = menu.find(m => RAIL_DEFS.find(d => d.id === activeRail)?.name === m.name)
    if (!activeModule) return
    const urls = collectUrls([activeModule], RAIL_DEFS)
    const timers = urls.map((url, i) => setTimeout(() => router.prefetch(url), i * 40))
    return () => timers.forEach(clearTimeout)
  }, [menu, activeRail, router])

  const moduleByName = useMemo(() => {
    const map = new Map<string, MenuNode>()
    menu?.forEach(n => map.set(n.name, n))
    return map
  }, [menu])

  function sbItem(item: MenuNode, railId: RailId) {
    const iconClass = item.icon ?? 'lni lni-dot'
    if (!item.url) {
      return (
        <span key={item.name} className="sb-item sb-item-disabled" aria-disabled="true" title="No page yet">
          <span className="sb-icon"><i className={iconClass}></i></span>
          {item.name}
          <span className="sb-badge sb-badge-soon">Soon</span>
        </span>
      )
    }
    const id = idFromUrl(item.url)
    const href = resolveHref(item.url, railId)
    const badge = BADGES[id]
    return (
      <Link key={href} href={href} className={`sb-item${currentPage === id ? ' active' : ''}`}>
        <span className="sb-icon"><i className={iconClass}></i></span>
        {item.name}
        {badge && <span className={`sb-badge${badge.variant ? ' ' + badge.variant : ''}`}>{badge.text}</span>}
      </Link>
    )
  }

  function sbSection(moduleName: string, section: MenuNode, railId: RailId) {
    const id = `sc-${slug(moduleName)}-${slug(section.name)}`
    const collapsed = collapsedSections.has(id)
    return (
      <div key={id} className={`sb-collapse${collapsed ? ' closed' : ''}`}>
        <div className="sb-group-hdr" onClick={() => toggleCollapse(id)}>
          <span>{section.name}</span><span className="sb-chevron">{collapsed ? '▸' : '▾'}</span>
        </div>
        <div className="sb-collapse-body">
          {section.children.map(item => sbItem(item, railId))}
        </div>
      </div>
    )
  }

  function clickRail(rail: RailId) {
    if (activeRail === rail) {
      setPanelOpen(p => !p)
    } else {
      setActiveRail(rail)
      setPanelOpen(true)
    }
  }

  function renderRailSlot(def: RailDef) {
    if (isLoading) return <div key={def.id} className="rail-item rail-item-skeleton" aria-hidden="true" />
    if (isError) return null
    const node = moduleByName.get(def.name)
    if (!node) return null
    const icon = node.icon ?? def.fallbackIcon
    return (
      <div
        key={def.id}
        className={`rail-item${activeRail === def.id ? ' active' : ''}`}
        data-mod={def.id}
        onClick={() => clickRail(def.id)}
        style={{ cursor: 'pointer' }}
      >
        <span className="rail-icon"><i className={icon}></i></span>
        <span className="rail-label">{node.name}</span>
        {activeRail === def.id && panelOpen && <span className="rail-dot"></span>}
        <span className="rail-tooltip">{panelOpen && activeRail === def.id ? 'Hide panel' : node.name}</span>
      </div>
    )
  }

  function renderPanel(def: RailDef) {
    const node = moduleByName.get(def.name)
    if (!node) {
      return (
        <div className="sb-panel-noaccess">
          <i className="lni lni-lock"></i>
          <div className="sb-panel-error-title">No access to {def.name}</div>
          <div className="sb-panel-error-sub">You don&apos;t have permission to view this module.</div>
        </div>
      )
    }
    return (
      <>
        <div className="sb-panel-hdr">
          <div className="sb-panel-hdr-title">Module</div>
          <div className="sb-panel-hdr-name"><i className={node.icon ?? def.fallbackIcon}></i> {node.name}</div>
        </div>
        {node.children.map(section => (section.children.length > 0 ? sbSection(node.name, section, def.id) : sbItem(section, def.id)))}
        <div className="sb-panel-footer">{def.footer}</div>
      </>
    )
  }

  const activeDef = RAIL_DEFS.find(d => d.id === activeRail)!

  return (
    <div className="sidebar">
      <div className="sb-rail bg-bg">
        {renderRailSlot(RAIL_DEFS[0])}
        <div className="rail-divider"></div>
        {renderRailSlot(RAIL_DEFS[1])}
        <div className="rail-divider"></div>
        {renderRailSlot(RAIL_DEFS[2])}
        {renderRailSlot(RAIL_DEFS[3])}
        <div className="rail-item locked" data-mod="attendance">
          <span className="rail-icon"><i className="lni lni-alarm-clock"></i></span>
          <span className="rail-label">Attendance</span>
          <span className="rail-tooltip">Attendance · Coming Soon</span>
        </div>
        <div className="rail-item locked" data-mod="analytics">
          <span className="rail-icon"><i className="lni lni-bar-chart"></i></span>
          <span className="rail-label">Analytics</span>
          <span className="rail-tooltip">Analytics · Coming Soon</span>
        </div>
        {renderRailSlot(RAIL_DEFS[4])}
        {renderRailSlot(RAIL_DEFS[5])}
        <div className="rail-spacer"></div>
        <div className="rail-divider"></div>
        <div className="rail-item locked" data-mod="userrole">
          <span className="rail-icon"><i className="lni lni-cog"></i></span>
          <span className="rail-label">Admin</span>
          <span className="rail-tooltip">User &amp; Role · Coming Soon</span>
        </div>
      </div>

      <div className={`sb-panel-shell${panelOpen ? ' open' : ''}`}>
        <div className={`sb-panel${panelOpen ? ' active' : ''}`}>
          {isLoading && (
            <div className="sb-panel-skeleton">
              <div className="sb-skel-line" style={{ width: '58%' }}></div>
              <div className="sb-skel-line" style={{ width: '82%' }}></div>
              <div className="sb-skel-line" style={{ width: '68%' }}></div>
              <div className="sb-skel-line" style={{ width: '74%' }}></div>
              <div className="sb-skel-line" style={{ width: '50%' }}></div>
            </div>
          )}
          {isError && (
            <div className="sb-panel-error">
              <i className="lni lni-warning"></i>
              <div className="sb-panel-error-title">Couldn&apos;t load menu</div>
              <div className="sb-panel-error-sub">Check your connection and try again.</div>
              <button className="btn btn-neu btn-sm" onClick={() => refetch()}>
                <i className="lni lni-reload"></i> Retry
              </button>
            </div>
          )}
          {!isLoading && !isError && isFallback && (
            <div className="sb-panel-fallback" title="Couldn't verify permissions from the server — showing the full navigation menu instead. Access shown here isn't confirmed.">
              <i className="lni lni-warning"></i>
              <span>Menu permissions unavailable — showing full navigation</span>
              <button className="sb-panel-fallback-retry" onClick={() => refetch()} aria-label="Retry loading real permissions">
                <i className="lni lni-reload"></i>
              </button>
            </div>
          )}
          {!isLoading && !isError && renderPanel(activeDef)}
        </div>
      </div>

      <button
        className="sb-toggle"
        onClick={() => setPanelOpen(p => !p)}
        aria-label={panelOpen ? 'Collapse menu' : 'Expand menu'}
      >
        <i className={`lni ${panelOpen ? 'lni-chevron-left' : 'lni-chevron-right'}`}></i>
      </button>
    </div>
  )
}
