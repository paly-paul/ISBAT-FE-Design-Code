'use client'
import { useEffect, useRef, useState } from 'react'
import { ModalProps } from '../types'
import { SuccessPopup } from './SuccessPopup'
import { SearchSelect } from '@/components/SearchSelect'

const MODULES = ['Admission', 'Academic', 'Student', 'Employee', 'Finance', 'Core Configuration']

const MODULE_PERMISSIONS: Record<string, string[]> = {
  Admission: ['View Admission', 'Add Enquiry', 'Approve Application', 'Reject Application', 'Manage Registration'],
  Academic: ['View Academic', 'Manage Programmes', 'Manage Timetable', 'Approve Results', 'Manage Batches'],
  Student: ['View Student', 'Add Student', 'Edit Student', 'Deactivate Student'],
  Employee: ['View Employee', 'Add Employee', 'Edit Employee', 'Manage Designations'],
  Finance: ['View Finance', 'Manage Fee Structure', 'Approve Payments', 'Reconcile Accounts'],
  'Core Configuration': ['View Configuration', 'Manage Masters', 'Manage Permissions'],
}

const MODULE_ICON: Record<string, string> = {
  Admission: 'clipboard',
  Academic: 'graduation',
  Student: 'user',
  Employee: 'briefcase',
  Finance: 'dollar',
  'Core Configuration': 'cog',
}

interface ModuleBlock {
  module: string
  open: boolean
  permissions: string[]
}

export function NewPermissionModal({ isOpen, onClose, showToast }: ModalProps) {
  const [saved, setSaved] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [selectedModule, setSelectedModule] = useState('')
  const [blocks, setBlocks] = useState<ModuleBlock[]>([])
  const [pendingScrollTo, setPendingScrollTo] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const blockRefs = useRef<Partial<Record<string, HTMLDivElement>>>({})

  useEffect(() => {
    if (!pendingScrollTo) return
    blockRefs.current[pendingScrollTo]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    setPendingScrollTo(null)
  }, [pendingScrollTo])

  if (!isOpen) return null

  function handleClose() {
    setSaved(false); setConfirming(false); setGroupName(''); setSelectedModule(''); setBlocks([]); setDeleteTarget(null)
    onClose()
  }

  if (saved) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <SuccessPopup title="Permission Group Added!" subtitle="The new permission group has been saved successfully." onClose={handleClose} />
        </div>
      </div>
    )
  }

  function handleAddModule() {
    if (!selectedModule || !groupName.trim()) return
    setBlocks(prev => {
      const exists = prev.find(b => b.module === selectedModule)
      if (exists) return prev.map(b => b.module === selectedModule ? { ...b, open: true } : b)
      return [...prev, { module: selectedModule, open: true, permissions: [] }]
    })
    setPendingScrollTo(selectedModule)
  }

  function toggleBlockOpen(module: string) {
    setBlocks(prev => prev.map(b => b.module === module ? { ...b, open: !b.open } : b))
  }

  function toggleAll(module: string) {
    setBlocks(prev => prev.map(b => {
      if (b.module !== module) return b
      const all = MODULE_PERMISSIONS[module]
      const isAllChecked = b.permissions.length === all.length
      return { ...b, permissions: isAllChecked ? [] : [...all] }
    }))
  }

  function togglePermission(module: string, perm: string) {
    setBlocks(prev => prev.map(b => {
      if (b.module !== module) return b
      const has = b.permissions.includes(perm)
      return { ...b, permissions: has ? b.permissions.filter(p => p !== perm) : [...b.permissions, perm] }
    }))
  }

  function confirmDelete() {
    if (!deleteTarget) return
    setBlocks(prev => prev.filter(b => b.module !== deleteTarget))
    delete blockRefs.current[deleteTarget]
    setDeleteTarget(null)
  }

  const deleteTargetBlock = blocks.find(b => b.module === deleteTarget)

  const activeBlocks = blocks.filter(b => b.permissions.length > 0)
  const canSubmit = groupName.trim().length > 0 && activeBlocks.length > 0

  return (
    <div className="modal-overlay open" id="new-permission-modal">
      <div className="modal modal-lg modal-flex" style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
        <div className="modal-hdr">
          <div className="modal-title"><i className="lni lni-lock"></i> Add Permission Group</div>
          <button className="modal-close" onClick={onClose}><i className="lni lni-close"></i></button>
        </div>

        <div className="modal-scroll">
          {!confirming ? (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div className="g2">
                <div className="fg">
                  <div className="lbl">Group Name <span className="req">*</span></div>
                  <input className="ctrl" type="text" placeholder="e.g. Registrar" value={groupName} onChange={e => setGroupName(e.target.value)} />
                </div>
                <div className="fg">
                  <div className="lbl">Module</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <SearchSelect placeholder="Select module…" options={MODULES} value={selectedModule} onChange={setSelectedModule} />
                    </div>
                    <button
                      type="button"
                      className="btn btn-neu"
                      style={{ width: 40, padding: 0, justifyContent: 'center', flexShrink: 0 }}
                      title={!groupName.trim() ? 'Enter a group name first' : 'Add module permissions'}
                      disabled={!selectedModule || !groupName.trim()}
                      onClick={handleAddModule}
                    >
                      <i className="lni lni-checkmark"></i>
                    </button>
                  </div>
                </div>
              </div>

              {blocks.length > 0 ? (
                <div className="fg" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                  <div className="lbl">Module Permissions</div>
                  <div className="perm-blocks-scroll">
                    {blocks.map(b => {
                      const all = MODULE_PERMISSIONS[b.module]
                      const allChecked = b.permissions.length === all.length
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
                            <i className={`lni lni-${MODULE_ICON[b.module]}`}></i>
                            {b.module}
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
                            {all.map(p => (
                              <label key={p} className="chk-item" style={{ cursor: 'pointer' }}>
                                <input type="checkbox" checked={b.permissions.includes(p)} onChange={() => togglePermission(b.module, p)} />
                                <span className="text-sm text-g700">{p}</span>
                              </label>
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
                  <div className="perm-empty-sub">Name the permission group, choose a module, then tap the tick button to load its permissions here.</div>
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
                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--g900)' }}>Confirm Permission Group</div>
                <div style={{ fontSize: 12.5, color: 'var(--g500)', marginTop: 4 }}>Review the access scope before creating this group</div>
              </div>

              <div className="info-box mb-3">
                <i className="lni lni-user"></i>
                <span>Group name: <strong>{groupName}</strong></span>
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
                      <i className={`lni lni-${MODULE_ICON[b.module]}`}></i>
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--g900)' }}>{b.module}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--g500)' }}>{b.permissions.join(', ')}</div>
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
              <button className="btn btn-success" onClick={() => setSaved(true)}>
                <i className="lni lni-checkmark-circle"></i> Confirm &amp; Create
              </button>
            </>
          )}
        </div>

        {deleteTargetBlock && (
          <div className="perm-delete-overlay" onClick={() => setDeleteTarget(null)}>
            <div className="perm-delete-card tab-panel-in" onClick={e => e.stopPropagation()}>
              <div className="perm-delete-icon"><i className="lni lni-trash-can"></i></div>
              <div className="perm-delete-title">Remove {deleteTargetBlock.module}?</div>
              <div className="perm-delete-sub">
                This will remove {deleteTargetBlock.permissions.length > 0
                  ? `all ${deleteTargetBlock.permissions.length} selected permission${deleteTargetBlock.permissions.length === 1 ? '' : 's'}`
                  : 'this module'} from the group. This can&apos;t be undone.
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
