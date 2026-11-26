import type { MenuNode } from '@/lib/api/users/menu'
import { MENU_ROUTE_MOVES } from './menuRoutes.generated'

// Menu-module addresses. A page the menu lists under another module than its
// code folder (Announcement Management under Academic, but in
// /student/announcement-management) gets a generated route at its menu
// module's address (/academic/announcement-management) — see
// scripts/menu-routes.mjs, which also writes MENU_ROUTE_MOVES.
//
// The menu's URLs are rewritten to the new addresses as the menu loads, so the
// sidebar links there and the permission and access checks look for it. The
// old address still opens the page, so anything comparing the current address
// with the menu first passes it through canonicalPath.

function clean(path: string): string {
  return (path.split('?')[0].replace(/\/+$/, '') || '/').toLowerCase()
}

// The menu-module address for `path` (old folder address → new), or `path`
// itself, without a trailing slash and lower-cased like the menu matching.
export function canonicalPath(path: string): string {
  const p = clean(path)
  return MENU_ROUTE_MOVES[p] ?? p
}

// Same module base the app uses for a relative menu url ("Activity Log" →
// /activity-log/…); see flattenMenuPages.
function moduleBase(moduleName: string): string {
  return '/' + moduleName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

// The menu with each moved page's url replaced by its new address.
export function applyMenuRouteMoves(menu: MenuNode[]): MenuNode[] {
  if (Object.keys(MENU_ROUTE_MOVES).length === 0) return menu
  return menu.map(mod => {
    const base = moduleBase(mod.name)
    const walk = (nodes: MenuNode[]): MenuNode[] => nodes.map(n => {
      const absolute = n.url ? (n.url.startsWith('/') ? n.url : `${base}/${n.url}`) : null
      const moved = absolute ? MENU_ROUTE_MOVES[clean(absolute)] : undefined
      const children = n.children.length ? walk(n.children) : n.children
      return moved || children !== n.children ? { ...n, url: moved ?? n.url, children } : n
    })
    return { ...mod, children: walk(mod.children) }
  })
}
