'use client'
import { useEffect } from 'react'
import { ModalProps } from '../types'
import { SuccessPopup } from '../academic/SuccessPopup'
import { SearchSelect } from '@/components/SearchSelect'
import { EmployeeListItem } from '@/lib/api/employee/employee'
import { moduleIcon, moduleLabel } from '@/hooks/users/usePermissionCatalog'
import { usePermissionWizard } from '@/hooks/users/usePermissionWizard'

// Same module/permission-picking wizard as NewPermissionModal, reused as-is
// via usePermissionWizard — but scoped to one employee instead of creating a
// shared, named Permission Group. There's no "Group Name" field here: the
// wizard's internal groupName state is silently seeded from the employee's
// display name (below) purely so the hook's existing canSubmit/handleAddModule
// gating — which requires a non-empty groupName — keeps working unmodified.
//
// No save API has been confirmed yet — "Confirm & Assign" only shows the
// success screen and toasts locally. Swap handleAssign for a real mutation
// once that endpoint is confirmed.
interface AssignEmployeePermissionsModalProps extends ModalProps {
  employee: EmployeeListItem | null
}

export function AssignEmployeePermissionsModal({ isOpen, onClose, showToast, employee }: AssignEmployeePermissionsModalProps) {
  const {
    moduleOptions, permissionsByModule, pagesByModule, permissionNameById,
    saved, setSaved, confirming, setConfirming,
    setGroupName, selectedModule, setSelectedModule,
    blocks, blockRefs, deleteTarget, setDeleteTarget, deleteTargetBlock,
    globalSearch, setGlobalSearch, globalMatches,
    activeBlocks, canSubmit,
    handleAddModule, handleGlobalSelect, toggleBlockOpen, updateBlockSearch,
    toggleAll, togglePermission, confirmDelete, resetWizard,
  } = usePermissionWizard()

  const employeeName = employee ? `${employee.title} ${employee.firstName} ${employee.surname}` : ''

  useEffect(() => {
    if (isOpen && employee) setGroupName(employeeName)
  }, [isOpen, employee, employeeName, setGroupName])

  if (!isOpen || !employee) return null

  function handleClose() {
    resetWizard()
    onClose()
  }

  if (saved) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <SuccessPopup title="Permissions Assigned!" subtitle={`Permissions have been assigned to ${employeeName}.`} onClose={handleClose} />
        </div>
      </div>
    )
  }

  function handleAssign() {
    setSaved(true)
    showToast('Permissions assigned successfully')
  }

  return (
    <div className="modal-overlay open" id="assign-employee-permissions-modal">
      <div className="modal modal-xl modal-flex" style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
        <div className="modal-hdr">
          <div className="modal-title"><i className="lni lni-lock"></i> Assign Permissions — <span className="font-mono">{employeeName}</span></div>
          <button className="modal-close" onClick={handleClose}><i className="lni lni-close"></i></button>
        </div>

        <div className="modal-scroll">
          {!confirming ? (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div className="g3">
                <div className="fg">
                  <div className="lbl">Module</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <SearchSelect placeholder="Select module…" options={moduleOptions} value={selectedModule} onChange={setSelectedModule} />
                    </div>
                    <button
                      type="button"
                      className="btn btn-neu"
                      style={{ width: 40, padding: 0, justifyContent: 'center', flexShrink: 0 }}
                      title="Add module permissions"
                      disabled={!selectedModule}
                      onClick={handleAddModule}
                    >
                      <i className="lni lni-checkmark"></i>
                    </button>
                  </div>
                </div>
                <div className="fg span2" style={{ position: 'relative' }}>
                  <div className="lbl">Search Permissions</div>
                  <input
                    className="ctrl"
                    type="text"
                    placeholder="Search by permission name…"
                    value={globalSearch}
                    onChange={e => setGlobalSearch(e.target.value)}
                  />
                  {globalMatches.length > 0 && (
                    <div className="ss-drop" style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, zIndex: 50 }}>
                      <div className="ss-opts">
                        {globalMatches.map(({ module, permission }) => (
                          <div
                            key={`${module}-${permission.intPermission}`}
                            className="col-filter-opt"
                            onClick={() => handleGlobalSelect(module, permission)}
                          >
                            {permission.permissionName}
                            <span style={{ color: 'var(--g400)', marginLeft: 6, fontSize: 11 }}>{moduleLabel(module)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {blocks.length > 0 ? (
                <div className="fg" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                  <div className="lbl">Module Permissions</div>
                  <div className="perm-blocks-scroll">
                    {blocks.map(b => {
                      const all = permissionsByModule[b.module] ?? []
                      const allChecked = all.length > 0 && b.permissions.length === all.length
                      const term = b.search.trim().toLowerCase()
                      const visiblePages = (pagesByModule[b.module] ?? [])
                        .map(pg => ({ page: pg.page, permissions: term ? pg.permissions.filter(p => p.permissionName.toLowerCase().includes(term)) : pg.permissions }))
                        .filter(pg => pg.permissions.length > 0)
                      return (
                        <div
                          key={b.module}
                          ref={el => { if (el) blockRefs.current[b.module] = el }}
                          className={`perm-block${b.open ? '' : ' closed'}`}
                        >
                          <div className="perm-block-hdr" onClick={() => toggleBlockOpen(b.module)}>
                            <span onClick={e => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center' }}>
                              <input type="checkbox" checked={allChecked} onChange={() => toggleAll(b.module)} />
                            </span>
                            <i className={`lni lni-${moduleIcon(b.module)}`}></i>
                            {moduleLabel(b.module)}
                            <span className="badge badge-blue" style={{ marginLeft: 6 }}>{b.permissions.length}/{all.length}</span>
                            <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 2 }}>
                              <button
                                type="button"
                                className="perm-block-delete"
                                title="Remove this module"
                                onClick={e => { e.stopPropagation(); setDeleteTarget(b.module) }}
                              >
                                <i className="lni lni-trash-can"></i>
                              </button>
                              <i className="lni lni-chevron-down perm-block-chevron"></i>
                            </span>
                          </div>
                          <div className="perm-block-body">
                            <input
                              className="ctrl"
                              type="text"
                              placeholder="Search permissions in this module…"
                              value={b.search}
                              onClick={e => e.stopPropagation()}
                              onChange={e => updateBlockSearch(b.module, e.target.value)}
                              style={{ gridColumn: '1 / -1', fontSize: 12, height: 32 }}
                            />
                            {visiblePages.length === 0 ? (
                              <div style={{ gridColumn: '1 / -1', fontSize: 12, color: 'var(--g400)', fontStyle: 'italic' }}>No matching permissions</div>
                            ) : visiblePages.map(pg => (
                              <div key={pg.page} style={{ gridColumn: '1 / -1' }}>
                                <div className="perm-page-title">
                                  <i className="lni lni-folder"></i>
                                  {pg.page}
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px 12px' }}>
                                  {pg.permissions.map(p => (
                                    <label key={p.intPermission} className="chk-item" style={{ cursor: 'pointer' }}>
                                      <input type="checkbox" checked={b.permissions.includes(p.intPermission)} onChange={() => togglePermission(b.module, p.intPermission)} />
                                      <span className="text-sm text-g700">{p.permissionName}</span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <div className="perm-empty-hint">
                  <i className="lni lni-arrow-up perm-empty-arrow"></i>
                  <div className="perm-empty-icon-wrap">
                    <i className="lni lni-graduation perm-empty-icon"></i>
                    <span className="perm-empty-orbit book"><i className="lni lni-book"></i></span>
                    <span className="perm-empty-orbit pencil"><i className="lni lni-pencil-alt"></i></span>
                  </div>
                  <div className="perm-empty-title">Fill in the details above to get started</div>
                  <div className="perm-empty-sub">Choose a module, then tap the tick button to load its permissions here.</div>
                </div>
              )}
            </div>
          ) : (
            <div className="tab-panel-in" style={{ padding: '4px 2px 8px' }}>
              <div style={{ textAlign: 'center', marginBottom: 18 }}>
                <div style={{
                  width: 56, height: 56, borderRadius: '50%', margin: '0 auto 12px',
                  background: 'var(--b50)', border: '1.5px solid var(--b200)',
                  display: 'grid', placeItems: 'center',
                }}>
                  <i className="lni lni-shield" style={{ fontSize: 24, color: 'var(--b600)' }} />
                </div>
                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--g900)' }}>Confirm Permission Assignment</div>
                <div style={{ fontSize: 12.5, color: 'var(--g500)', marginTop: 4 }}>Review the access scope before assigning it to this employee</div>
              </div>

              <div className="info-box mb-3">
                <i className="lni lni-user"></i>
                <span>Assigning to: <strong>{employeeName}</strong> <span className="font-mono">({employee.shortCode})</span></span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 220, overflowY: 'auto' }}>
                {activeBlocks.map(b => (
                  <div key={b.module} style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                    border: '1.5px solid var(--g200)', borderRadius: 'var(--rsm)', background: 'var(--surface)',
                  }}>
                    <span style={{
                      width: 32, height: 32, borderRadius: 8, display: 'grid', placeItems: 'center',
                      background: 'var(--b100)', color: 'var(--b700)', flexShrink: 0,
                    }}>
                      <i className={`lni lni-${moduleIcon(b.module)}`}></i>
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--g900)' }}>{moduleLabel(b.module)}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--g500)' }}>{b.permissions.map(id => permissionNameById[id] ?? id).join(', ')}</div>
                    </div>
                    <span className="badge badge-blue">{b.permissions.length}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          {!confirming ? (
            <>
              <button className="btn btn-neu" onClick={handleClose}>Cancel</button>
              <button className="btn btn-primary" disabled={!canSubmit} onClick={() => setConfirming(true)}>
                <i className="lni lni-checkmark"></i> Submit
              </button>
            </>
          ) : (
            <>
              <button className="btn btn-neu" onClick={() => setConfirming(false)}>
                <i className="lni lni-arrow-left"></i> Back
              </button>
              <button className="btn btn-success" onClick={handleAssign}>
                <i className="lni lni-checkmark-circle"></i> Confirm & Assign
              </button>
            </>
          )}
        </div>

        {deleteTargetBlock && (
          <div className="perm-delete-overlay" onClick={() => setDeleteTarget(null)}>
            <div className="perm-delete-card tab-panel-in" onClick={e => e.stopPropagation()}>
              <div className="perm-delete-icon"><i className="lni lni-trash-can"></i></div>
              <div className="perm-delete-title">Remove {moduleLabel(deleteTargetBlock.module)}?</div>
              <div className="perm-delete-sub">
                This will remove {deleteTargetBlock.permissions.length > 0
                  ? `all ${deleteTargetBlock.permissions.length} selected permission${deleteTargetBlock.permissions.length === 1 ? '' : 's'}`
                  : 'this module'} from this assignment. This can&apos;t be undone.
              </div>
              <div className="perm-delete-actions">
                <button className="btn btn-neu" onClick={() => setDeleteTarget(null)}>Cancel</button>
                <button className="btn btn-danger" onClick={confirmDelete}>
                  <i className="lni lni-trash-can"></i> Remove
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
