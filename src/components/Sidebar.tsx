'use client'
import { Dispatch, SetStateAction, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useMenu } from '@/hooks/users/useMenu'
import { MenuNode } from '@/lib/api/users/menu'
import { canonicalPath } from '@/lib/menuRoutes'

export type RailId = 'student' | 'finance' | 'academic' | 'admission' | 'employee' | 'attendance' | 'assessment' | 'analytics' | 'configuration'

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
// module — used to look the node up in the fetched tree. Listed in the
// menu API's module order (ERP_Menu_Hierarchy_Verified_v7.md): Analytics and
// Configuration are centralized modules whose pages live under other
// modules' routes (/finance/reports/*, /config/*, /academic/skill-master…),
// so a rail is not the same thing as a route segment.
const RAIL_DEFS: RailDef[] = [
  { id: 'student', name: 'Student', fallbackIcon: 'lni lni-user', footer: 'S10 · Student Service' },
  { id: 'finance', name: 'Finance', fallbackIcon: 'lni lni-dollar', footer: 'S5 · Finance Service' },
  { id: 'academic', name: 'Academic', fallbackIcon: 'lni lni-graduation', footer: 'S2 · Academic Service' },
  { id: 'admission', name: 'Admission', fallbackIcon: 'lni lni-clipboard', footer: 'S1 · Admission Service' },
  { id: 'employee', name: 'Employee', fallbackIcon: 'lni lni-briefcase', footer: 'S4 · Employee Service' },
  { id: 'attendance', name: 'Attendance', fallbackIcon: 'lni lni-alarm-clock', footer: 'S6 · Attendance Service' },
  { id: 'assessment', name: 'Assessment', fallbackIcon: 'lni lni-pencil-alt', footer: '' },
  { id: 'analytics', name: 'Analytics', fallbackIcon: 'lni lni-bar-chart', footer: 'Reports & Analytics' },
  { id: 'configuration', name: 'Configuration', fallbackIcon: 'lni lni-cog', footer: 'S0 · Core Config' },
]

function normPath(path: string): string {
  return path.split('?')[0].replace(/\/+$/, '').toLowerCase() || '/'
}

// Whether `path` is one of this module's own leaves (any depth).
function moduleHasPath(nodes: MenuNode[], railId: RailId, path: string): boolean {
  return nodes.some(n =>
    (n.url && normPath(resolveHref(n.url, railId)) === path) || moduleHasPath(n.children, railId, path),
  )
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

// Sidebar entries hidden from navigation without touching the backend menu
// tree or deleting the page itself — keyed by the leaf's url slug.
// Ledger Adjustments: commented out per request (2026-09-07) — that page is
// still a UI-only mock (see AdjustLedgerModal.tsx's own comment: no backing
// "ledger adjustment" endpoint exists in the API spec yet), so it stays out
// of the menu until there's something real behind it. The route/page are
// left in place, just unreachable from here.
const HIDDEN_ITEM_IDS = new Set<string>([
  'ledger-adjustments',
])

// Order is the menu API's own (ERP_Menu_Hierarchy_Verified_v7.md). The
// client-side Finance reorder (ORDER_PRIORITY, 2026-09-07) was removed
// 2026-11-20 so the sidebar matches the verified hierarchy exactly.

const HIDDEN_SECTION_NAMES = new Set<string>([
  'lecture master',
  'lecturer master',
])

function isHiddenMenuNode(node: MenuNode): boolean {
  if (HIDDEN_SECTION_NAMES.has(node.name.trim().toLowerCase())) return true
  if (node.url && HIDDEN_ITEM_IDS.has(idFromUrl(node.url))) return true
  return false
}

function visibleChildren(children: MenuNode[]): MenuNode[] {
  return children.filter(c => !isHiddenMenuNode(c))
}

// The UE print renames ("UE Theory QP Print" / "UE Material Print") were
// dropped 2026-11-20 — the menu API now sends the v7 names itself.
function getItemDisplayName(item: MenuNode): string {
  if (!item.url) return item.name
  const id = idFromUrl(item.url)
  return item.name === 'IA Creation' || id === 'ia-creation'
    ? 'Assessment Scheduler'
    : id === 'mark-ue'
      ? 'Mark Entry UE'
      : id === 'mark-ue-verify'
        ? 'Mark Verify UE'
        : id === 'mark-cw'
          ? 'Mark Entry CW'
          : id === 'mark-cbt'
            ? 'Mark Entry CBT'
            : item.name
}

export function Sidebar({ panelOpen, setPanelOpen, currentPage, collapsedSections, toggleCollapse, activeRail, setActiveRail }: SidebarProps) {
  const [menuSearch, setMenuSearch] = useState('')
  const { data, isLoading, isError, refetch } = useMenu()
  const router = useRouter()
  const pathname = usePathname()
  // canonicalPath: on a moved page's old folder address, highlight its menu
  // entry, which now holds the new address (src/lib/menuRoutes.ts).
  const currentPath = canonicalPath(pathname ?? '')
  const menu = data?.menu

  // At ≤1024px the panel lies over the page instead of pushing it aside (see
  // the 1024px block in globals.css), so starting open — every module layout
  // defaults panelOpen to true — covered most of a phone screen on load,
  // and it stayed over the new page after picking an item. Close it on
  // arrival and after each navigation there; desktop keeps its default.
  // Same breakpoint as the CSS.
  const isOverlayWidth = () => typeof window !== 'undefined' && window.matchMedia('(max-width: 1024px)').matches
  useEffect(() => {
    if (isOverlayWidth()) setPanelOpen(false)
  }, [currentPage, setPanelOpen])

  // No route-warming effect here on purpose. A prior version fired
  // router.prefetch() for every route in the active module in one tight
  // loop — that's a no-op in `next dev` (prefetch is suppressed there, so it
  // looked harmless locally), but a production build issues each as a real
  // request, and even scoped to just one module (16+ routes under /academic
  // alone) that was enough to flood the Network tab and trip a
  // rate/concurrency limit on Vercel. next/link's own default auto-prefetch
  // turned out to cause the identical burst for the same reason (it fires
  // per-<Link> on viewport entry, not on hover), so every panel item below
  // is rendered with prefetch={false} instead — see sbItem().

  const moduleByName = useMemo(() => {
    const map = new Map<string, MenuNode>()
    menu?.forEach(n => map.set(n.name, n))
    return map
  }, [menu])

  // When the current activeRail is not accessible in the user's menu (e.g. visiting /profile
  // as a user who has no Academic access), automatically switch to the first accessible module.
  useEffect(() => {
    if (moduleByName.size === 0) return
    const activeDef = RAIL_DEFS.find(r => r.id === activeRail)
    if (activeDef && !moduleByName.has(activeDef.name)) {
      const firstAvailable = RAIL_DEFS.find(r => moduleByName.has(r.name))
      if (firstAvailable) {
        setActiveRail(firstAvailable.id)
      }
    }
  }, [moduleByName, activeRail, setActiveRail])

  // Open the rail whose menu actually holds the current page. Each route
  // folder's layout starts on its own rail, but centralized modules list
  // pages from other folders (Configuration → /finance/banks, Analytics →
  // /attendance/reports/by-date), so the folder alone picks the wrong one.
  // Runs on navigation only — clicking another rail still just swaps the
  // panel. A page in no module's menu (profile, detail pages) keeps the
  // layout's rail.
  useEffect(() => {
    if (moduleByName.size === 0) return
    const owner = RAIL_DEFS.find(def => {
      const node = moduleByName.get(def.name)
      return node ? moduleHasPath(node.children, def.id, currentPath) : false
    })
    if (owner) setActiveRail(owner.id)
  }, [moduleByName, currentPath, setActiveRail])

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
    const displayName = getItemDisplayName(item)
    const href = resolveHref(item.url, railId)
    // Full-path match: slugs repeat across modules now (/config/specialization
    // and /student/specialization both sit under Configuration).
    const active = normPath(href) === currentPath
    return (
      // prefetch={false} — next/link's default auto-prefetch fires for every
      // rendered <Link> as soon as it's in the viewport, not just on hover.
      // With ~15-20 items visible in one module's panel at once, that's the
      // same burst-of-requests problem the removed router.prefetch() loop
      // caused, just coming from Link's own built-in behavior instead. Only
      // the item the user actually points at needs warming: prefetch={false}
      // also turns off Link's hover prefetch in the App Router, so it's done
      // here — one request for the hovered/focused item, deduped by the
      // router. That makes the click (a cross-module one especially, which
      // swaps the whole layout) start from a warm route instead of a cold one.
      <Link
        key={href}
        href={href}
        prefetch={false}
        onMouseEnter={() => router.prefetch(href)}
        onFocus={() => router.prefetch(href)}
        className={`sb-item${active ? ' active' : ''}`}
      >
        <span className="sb-icon"><i className={iconClass}></i></span>
        {displayName}
      </Link>
    )
  }

  function sbSection(moduleName: string, section: MenuNode, railId: RailId, itemsToRender?: MenuNode[]) {
    const id = `sc-${slug(moduleName)}-${slug(section.name)}`
    const isSearching = Boolean(menuSearch.trim())
    const collapsed = isSearching ? false : collapsedSections.has(id)
    const items = itemsToRender ?? visibleChildren(section.children)
    return (
      <div key={id} className={`sb-collapse${collapsed ? ' closed' : ''}`}>
        <div className="sb-group-hdr" onClick={() => toggleCollapse(id)}>
          <span>{section.name}</span><span className="sb-chevron">{collapsed ? '▸' : '▾'}</span>
        </div>
        <div className="sb-collapse-body">
          {items.map(item => sbItem(item, railId))}
        </div>
      </div>
    )
  }

  // Switching modules only swaps which menu the panel shows — it doesn't
  // navigate, so the page you're on stays put until you pick an item from
  // the new module's panel.
  function clickRail(rail: RailId) {
    if (activeRail === rail) {
      setPanelOpen(p => !p)
    } else {
      setActiveRail(rail)
      setPanelOpen(true)
      setMenuSearch('')
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

    const allVisible = visibleChildren(node.children)
    const query = menuSearch.trim().toLowerCase()

    let renderedContent: React.ReactNode

    if (!query) {
      renderedContent = allVisible.map(section =>
        section.children.length > 0 ? sbSection(node.name, section, def.id) : sbItem(section, def.id)
      )
    } else {
      const filtered = allVisible
        .map(section => {
          if (section.children.length > 0) {
            const sectionNameMatches = section.name.toLowerCase().includes(query)
            const matchingChildren = visibleChildren(section.children).filter(item => {
              const name = getItemDisplayName(item).toLowerCase()
              const url = (item.url || '').toLowerCase()
              return name.includes(query) || url.includes(query)
            })

            if (sectionNameMatches) {
              return sbSection(node.name, section, def.id)
            } else if (matchingChildren.length > 0) {
              return sbSection(node.name, section, def.id, matchingChildren)
            }
            return null
          } else {
            const name = getItemDisplayName(section).toLowerCase()
            const url = (section.url || '').toLowerCase()
            if (name.includes(query) || url.includes(query)) {
              return sbItem(section, def.id)
            }
            return null
          }
        })
        .filter(Boolean)

      if (filtered.length === 0) {
        renderedContent = (
          <div className="px-4 py-8 text-center text-xs text-slate-400">
            <i className="lni lni-search-alt text-lg mb-1.5 block opacity-40"></i>
            <div>No menu items found</div>
            <div className="text-[11px] text-slate-400/80 mt-0.5">No match for &ldquo;{menuSearch}&rdquo;</div>
          </div>
        )
      } else {
        renderedContent = filtered
      }
    }

    return (
      <>
        <div className="sb-panel-hdr">
          <div className="sb-panel-hdr-title">Module</div>
          <div className="sb-panel-hdr-name"><i className={node.icon ?? def.fallbackIcon}></i> {node.name}</div>
        </div>
        <div className="px-3 py-2 border-b border-slate-100 shrink-0 bg-slate-50/50">
          <div className="relative">
            <i className="lni lni-search-alt absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none"></i>
            <input
              type="text"
              placeholder={`Filter ${node.name} menu...`}
              value={menuSearch}
              onChange={e => setMenuSearch(e.target.value)}
              className="w-full text-xs pl-7 pr-7 py-1.5 rounded-lg border border-slate-200 bg-white placeholder:text-slate-400 text-slate-700 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-2xs"
            />
            {menuSearch && (
              <button
                type="button"
                onClick={() => setMenuSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs p-0.5"
                aria-label="Clear filter"
              >
                <i className="lni lni-close text-[10px]"></i>
              </button>
            )}
          </div>
        </div>
        {renderedContent}
        <div className="sb-panel-footer">{def.footer}</div>
      </>
    )
  }

  const activeDef = RAIL_DEFS.find(d => d.id === activeRail)!

  // renderRailSlot(def) returns null for a module the user has no access to
  // (moduleByName.get(def.name) misses). Dividers used to be hardcoded between every pair of
  // slots regardless, so a null slot (e.g. no Config access) left two
  // .rail-dividers stacked back-to-back with nothing between them — a
  // visibly doubled line right above whatever module happened to follow.
  // Built as a {key, node} list and filtered first instead, so a divider
  // only ever renders between two slots that both actually rendered something.
  const railSlots: { key: string; node: React.ReactNode }[] = RAIL_DEFS.map(def => ({
    key: def.id,
    node: renderRailSlot(def),
  }))
  const visibleRailSlots = railSlots.filter(s => s.node)

  return (
    <>
    {/* ≤1024px only (CSS hides it above): dims the page under the open
        panel, and a tap on it closes the panel. */}
    {panelOpen && <div className="sb-backdrop" onClick={() => setPanelOpen(false)} aria-hidden="true" />}
    <div className="sidebar">
      <div className="sb-rail bg-bg">
        {visibleRailSlots.map((slot, i) => (
          // display: contents keeps the wrapper out of .sb-rail's own flex
          // layout (flex column + gap) — its children (the divider, the
          // slot itself) participate directly as if there were no wrapper.
          <div key={slot.key} style={{ display: 'contents' }}>
            {i > 0 && <div className="rail-divider"></div>}
            {slot.node}
          </div>
        ))}
        <div className="rail-spacer"></div>
        {/* Admin (User & Role) — commented out per request, not deleted, in
            case a real backend-driven module takes its place later. Its
            settings-cog icon duplicated Config's own fallback icon, and
            Config now sits right above Assessment instead of trailing all
            the way at the bottom, so this locked placeholder no longer has
            a clear spot to live in.
        <div className="rail-divider"></div>
        <div className="rail-item locked" data-mod="userrole">
          <span className="rail-icon"><i className="lni lni-cog"></i></span>
          <span className="rail-label">Admin</span>
          <span className="rail-tooltip">User &amp; Role · Coming Soon</span>
        </div>
        */}
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
    </>
  )
}
