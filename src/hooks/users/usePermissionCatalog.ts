import { useQuery } from '@tanstack/react-query'
import { getPermissionCatalog, CatalogModule, CatalogPage, CatalogPermission } from '@/lib/api/users/permissionCatalog'

// `enabled` defaults to true so existing callers keep fetching eagerly;
// callers that only need this once a modal opens (e.g. the permission
// wizard) should pass `isOpen` through so the request doesn't fire while
// the modal is closed.
export function usePermissionCatalog(enabled = true) {
  return useQuery({
    queryKey: ['permissionCatalog'],
    queryFn: getPermissionCatalog,
    enabled,
    // Static reference data with no signal for when it changes — fetch once
    // per session and never treat it as stale, instead of silently
    // refetching on every remount/window-focus.
    staleTime: Infinity,
    gcTime: Infinity,
  })
}

const MODULE_ICONS: Record<string, string> = {
  System: 'cog',
  Academics: 'graduation',
  Administration: 'briefcase',
}

export function moduleIcon(mainModule: string): string {
  return MODULE_ICONS[mainModule] ?? 'shield'
}

export function moduleLabel(mainModule: string): string {
  return mainModule
}

export type { CatalogModule, CatalogPage, CatalogPermission }
