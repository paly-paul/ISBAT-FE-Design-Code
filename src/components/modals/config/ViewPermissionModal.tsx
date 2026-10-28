'use client'
import { useMemo } from 'react'
import { ModalProps } from '../types'
import { PermissionGroup } from '@/lib/api/academic/permissionGroup'
import { usePermissionCatalog, CatalogModule } from '@/hooks/users/usePermissionCatalog'
import { catalogSections, DESTRUCTIVE, ModuleAccessMatrix, UncataloguedAccess, DestructiveCaution, ReviewStats } from '@/components/permissions/PermissionMatrix'

interface ViewPermissionModalProps extends ModalProps {
  permissionGroup: PermissionGroup | null
  onEdit?: () => void
  canEdit?: boolean
}

const EMPTY_CATALOG: CatalogModule[] = []

// Read-only twin of PermissionFormModal's Review step — same shell
// (pm-modal), stats, destructive-access note and per-module pages × actions
// matrices, so viewing a group looks like the last step of editing it.
// The group's permissions only carry {id, name}, so each is matched to the
// catalog by name first (ids can drift between endpoints), then by id —
// the same reconciliation PermissionFormModal's seeding does.
export function ViewPermissionModal({ isOpen, onClose, permissionGroup, onEdit, canEdit }: ViewPermissionModalProps) {
  const { data: catalog = EMPTY_CATALOG, isLoading } = usePermissionCatalog(isOpen)
  const { modules, sectionsByModule } = useMemo(() => catalogSections(catalog), [catalog])

  // Granted catalog ids, plus the names the catalog doesn't know.
  const { grantedIds, uncatalogued } = useMemo(() => {
    const idByName: Record<string, number> = {}
    const known = new Set<number>()
    for (const sections of Object.values(sectionsByModule)) {
      for (const s of sections) for (const pg of s.pages) for (const p of pg.permissions) {
        idByName[p.permissionName] = p.intPermission
        known.add(p.intPermission)
      }
    }
    const ids = new Set<number>()
    const unknown: string[] = []
    for (const p of permissionGroup?.permissions ?? []) {
      const id = idByName[p.permissionName] ?? (known.has(p.intPermission) ? p.intPermission : undefined)
      if (id !== undefined) ids.add(id)
      else unknown.push(p.permissionName)
    }
    return { grantedIds: ids, uncatalogued: unknown }
  }, [permissionGroup, sectionsByModule])

  const grantedModules = modules.filter(m => (sectionsByModule[m] ?? []).some(s => s.pages.some(pg => pg.permissions.some(p => grantedIds.has(p.intPermission)))))
  const pageCount = grantedModules.reduce((n, m) => n + (sectionsByModule[m] ?? []).reduce((k, s) => k + s.pages.filter(pg => pg.permissions.some(p => grantedIds.has(p.intPermission))).length, 0), 0)
  const destructive = (permissionGroup?.permissions ?? []).map(p => p.permissionName).filter(n => DESTRUCTIVE.test(n))

  if (!isOpen || !permissionGroup) return null

  const total = permissionGroup.permissions.length

  return (
    <div className="modal-overlay open" id="view-permission-modal">
      <div className="modal pm-modal pm-modal--view" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr modal-hdr-blue">
          <div className="modal-title"><i className="lni lni-eye"></i> View Permission Group — <span className="font-mono">{permissionGroup.group}</span></div>
          <button className="modal-close" onClick={onClose} aria-label="Close"><i className="lni lni-close"></i></button>
        </div>

        <div className="pm-review tab-panel-in">
          <div className="pm-review-hdr">
            <div style={{ minWidth: 0 }}>
              <h3 className="pm-pane-title">{permissionGroup.group}</h3>
              <div className="pm-pane-sub">{permissionGroup.description || 'What members of this group can do.'}</div>
            </div>
            <ReviewStats items={[
              { label: 'Permissions', value: total },
              { label: 'Modules', value: grantedModules.length + (uncatalogued.length ? 1 : 0) },
              { label: 'Pages', value: pageCount },
            ]} />
          </div>

          <DestructiveCaution names={destructive} />

          {total === 0 ? (
            <div className="pm-empty">
              <i className="lni lni-lock" aria-hidden="true"></i>
              <div><strong>No permissions assigned</strong><br />Members of this group can&apos;t do anything yet.</div>
            </div>
          ) : isLoading ? (
            <div className="pm-empty"><span className="pm-spinner" aria-hidden="true"></span> Loading permissions…</div>
          ) : (
            <>
              {grantedModules.map(m => (
                <ModuleAccessMatrix
                  key={m}
                  module={m}
                  sections={sectionsByModule[m] ?? []}
                  isGranted={p => grantedIds.has(p.intPermission)}
                />
              ))}
              <UncataloguedAccess names={uncatalogued} />
            </>
          )}
        </div>

        <div className="modal-footer">
          <div className="pm-foot-summary">
            <strong>{total}</strong> permission{total === 1 ? '' : 's'} · <strong>{grantedModules.length}</strong> module{grantedModules.length === 1 ? '' : 's'}
          </div>
          {canEdit && onEdit && (
            <button className="btn btn-neu" onClick={onEdit}>
              <i className="lni lni-pencil"></i> Edit
            </button>
          )}
          <button className="btn btn-primary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}
