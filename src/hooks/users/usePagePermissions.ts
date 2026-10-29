import { usePathname } from 'next/navigation'
import { useMemo } from 'react'
import { useMenu } from './useMenu'
import { MenuNode, MenuPermissions } from '@/lib/api/users/menu'

// Used while the menu is loading, or when the current route isn't present in
// the tree at all (non-menu routes such as detail pages). Hiding an action
// only ever changes the UI — real authorization is still enforced
// server-side per request — so this avoids a flash of missing buttons on
// every page load.
const FULL_ACCESS: MenuPermissions = {
  add: true,
  create: true,
  edit: true,
  update: true,
  delete: true,
  get: true,
  view: true,
  approve: true,
  reject: true,
  hold: true,
  assign: true,
  submit: true,
  import: true,
  register: true,
  print: true,
  export: true,
  cancel: true,
}

// When the menu call failed, nothing is granted (RouteGuard also blocks the
// page in that case).
const NO_ACCESS: MenuPermissions = {}

// A module's railId is always its lowercased name ("Config" -> "config"),
// confirmed against RAIL_DEFS in Sidebar.tsx.
function normalizeHref(url: string, railId: string): string {
  const clean = url.trim().replace(/^\/+|\/+$/g, '')
  if (clean.toLowerCase().startsWith(railId.toLowerCase() + '/')) {
    return '/' + clean.toLowerCase()
  }
  return '/' + railId.toLowerCase() + '/' + clean.toLowerCase()
}

function matchesPath(url: string, railId: string, pathname: string): boolean {
  const normPath = pathname.trim().split('?')[0].replace(/\/+$/, '').toLowerCase()
  const normHref = normalizeHref(url, railId)
  if (normHref === normPath) return true
  // Also compare slug if url is just the page slug and pathname ends with that slug
  const pageSlug = url.split('/').filter(Boolean).pop()?.toLowerCase()
  const pathSlug = normPath.split('/').filter(Boolean).pop()?.toLowerCase()
  const pathModule = normPath.split('/')[1]?.toLowerCase()
  if (pageSlug && pathSlug && pageSlug === pathSlug && pathModule === railId.toLowerCase()) {
    return true
  }
  return false
}

function normalizePermissions(raw: MenuPermissions | null | undefined): MenuPermissions {
  if (!raw) return FULL_ACCESS
  const canAdd = Boolean(raw.add || raw.create)
  const canEdit = Boolean(raw.edit || raw.update)
  const canDelete = Boolean(raw.delete)
  const canGet = Boolean(raw.get || raw.view)
  const canApprove = raw.approve !== undefined ? Boolean(raw.approve) : canEdit
  return {
    ...raw,
    add: canAdd,
    create: canAdd,
    edit: canEdit,
    update: canEdit,
    delete: canDelete,
    get: canGet,
    view: canGet,
    approve: canApprove,
  }
}

function findNode(nodes: MenuNode[], railId: string, pathname: string): MenuNode | null {
  for (const n of nodes) {
    if (n.url && matchesPath(n.url, railId, pathname)) return n
    if (n.children && n.children.length > 0) {
      const found = findNode(n.children, railId, pathname)
      if (found) return found
    }
  }
  return null
}

// Looks up the current route's permissions from the real /me/menu tree, so a
// page can gate its own Add/Edit/Delete actions on what the logged-in user
// is actually allowed to do rather than always rendering every action.
// Returns FULL_ACCESS (see above) while permission data is loading or the
// route isn't found in the tree, and NO_ACCESS if the menu call failed.
export function usePagePermissions(): MenuPermissions {
  const pathname = usePathname()
  const { data, isLoading, isError } = useMenu()

  return useMemo(() => {
    if (isError) return NO_ACCESS
    if (isLoading || !data) return FULL_ACCESS
    for (const moduleNode of data.menu) {
      const found = findNode(moduleNode.children, moduleNode.name.toLowerCase(), pathname)
      if (found) return normalizePermissions(found.permissions)
    }
    return FULL_ACCESS
  }, [data, isLoading, isError, pathname])
}
