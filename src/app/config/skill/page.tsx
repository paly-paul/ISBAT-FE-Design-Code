'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ScrollTable } from '@/components/ScrollTable'
import { ActionMenu } from '@/components/ActionMenu'
import { TableSearch } from '@/components/TableSearch'
import { Toast } from '@/components/Toast'
import { EmptyState } from '@/components/EmptyState'
import { TableLoadingState } from '@/components/TableLoadingState'
import { Pagination } from '@/components/Pagination'
import { usePagination } from '@/hooks/usePagination'
import { NewSkillModal } from '@/components/modals/academic/NewSkillModal'
import { EditSkillModal } from '@/components/modals/academic/EditSkillModal'
import { ViewSkillModal } from '@/components/modals/academic/ViewSkillModal'
import { useSkillMasters, useCreateSkillMaster, useUpdateSkillMaster, useDeleteSkillMaster, SkillMaster } from '@/hooks/config/useSkillMaster'
import { usePagePermissions } from '@/hooks/users/usePagePermissions'

const PAGE_SIZE = 10

export default function Page() {
  const router = useRouter()
  const permissions = usePagePermissions()
  const [openModals, setOpenModals] = useState<Set<string>>(new Set())
  const [toast, setToast]           = useState<{ msg: string; type: string } | null>(null)
  const [editingSkill, setEditingSkill] = useState<SkillMaster | null>(null)
  const [viewingSkill, setViewingSkill] = useState<SkillMaster | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<SkillMaster | null>(null)
  const [search, setSearch] = useState('')

  const { data, isLoading } = useSkillMasters()
  const rows = data?.items ?? []
  const createSkill = useCreateSkillMaster()
  const updateSkill = useUpdateSkillMaster()
  const deleteSkill = useDeleteSkillMaster()

  const searchMatches = search.trim()
    ? rows.filter(r => r.skillName.toLowerCase().includes(search.trim().toLowerCase())).slice(0, 8)
    : []

  const filteredRows = rows.filter(r =>
    !search.trim() || r.skillName.toLowerCase().includes(search.trim().toLowerCase())
  )

  const { page, setPage, totalPages, totalCount, pageItems } = usePagination(filteredRows, PAGE_SIZE)

  function nav(id: string) { router.push('/config/' + id) }
  function openModal(id: string)  { setOpenModals(prev => new Set(prev).add(id)) }
  function closeModal(id: string) { setOpenModals(prev => { const s = new Set(prev); s.delete(id); return s }) }
  function showToast(msg: string, type = '') { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }

  function openEditModal(skill: SkillMaster) {
    setEditingSkill(skill)
    openModal('edit-skill-modal')
  }

  function openViewModal(skill: SkillMaster) {
    setViewingSkill(skill)
    openModal('view-skill-modal')
  }

  function confirmDeleteSkill() {
    if (!deleteTarget) return
    deleteSkill.mutate(deleteTarget.intSkill, {
      onSuccess: () => { setDeleteTarget(null); showToast('Skill deleted successfully') },
      onError: (error: Error) => showToast(error.message || 'Failed to delete skill', 'error'),
    })
  }

  return (
    <>
      <div className="page active">
        <div className="pg-hdr">
          <div>
            <div className="pg-title">Skill Master</div>
            <div className="pg-sub">Define skills and subject areas for lecturer profiles</div>
          </div>
          {permissions.add && (
            <button className="btn btn-primary" onClick={() => openModal('new-skill-modal')}>
              <i className="lni lni-plus"></i> Add Skill
            </button>
          )}
        </div>
        <div className="card">
          <div className="card-hdr">
            <div className="card-title"><span className="ctitle-icon"><i className="lni lni-bulb"></i></span> Skills</div>
            <div className="flex gap-2">
              <TableSearch
                className="w-56"
                placeholder="Search by code or name…"
                value={search}
                onChange={setSearch}
                results={searchMatches.map(r => ({ id: String(r.intSkill), primary: r.skillName }))}
              />
            </div>
          </div>
          <ScrollTable>
            <table>
              <thead>
                <tr>
                  <th style={{ width: 48 }}></th>
                  <th>Skill Name</th>
                </tr>
              </thead>
              <tbody>
                {isLoading
                  ? <TableLoadingState colSpan={999} />
                  : filteredRows.length === 0
                    ? <EmptyState colSpan={999} hasFilters={false} onClearFilters={() => {}} />
                    : null}
                {pageItems.map((r) => (
                  <tr key={r.intSkill}>
                    <td>
                      {(true) && (
                        <ActionMenu>
                          <button className="btn btn-neu btn-sm" onClick={() => openViewModal(r)}>
                            <i className="lni lni-eye"></i> View
                          </button>
                          {permissions.edit && (
                            <button className="btn btn-neu btn-sm" onClick={() => openEditModal(r)}>
                              <i className="lni lni-pencil"></i> Edit
                            </button>
                          )}
                          {permissions.delete && (
                            <button className="btn btn-neu btn-sm" onClick={() => setDeleteTarget(r)}>
                              <i className="lni lni-trash-can"></i> Delete
                            </button>
                          )}
                        </ActionMenu>
                      )}
                    </td>
                    <td><strong>{r.skillName}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollTable>
          <Pagination page={page} totalPages={totalPages} totalCount={totalCount} itemLabel="skills" onPageChange={setPage} />
        </div>
      </div>
      <NewSkillModal
        isOpen={openModals.has('new-skill-modal')}
        onClose={() => closeModal('new-skill-modal')}
        showToast={showToast}
        createSkill={createSkill}
      />
      <EditSkillModal
        isOpen={openModals.has('edit-skill-modal')}
        onClose={() => closeModal('edit-skill-modal')}
        showToast={showToast}
        skill={editingSkill}
        updateSkill={updateSkill}
      />
      <ViewSkillModal
        isOpen={openModals.has('view-skill-modal')}
        onClose={() => closeModal('view-skill-modal')}
        showToast={showToast}
        skill={viewingSkill}
        onEdit={() => {
          closeModal('view-skill-modal')
          openEditModal(viewingSkill!)
        }}
      />
      <Toast toast={toast} />

      {deleteTarget && (
        <div className="perm-delete-overlay" style={{ position: 'fixed', zIndex: 500 }} onClick={() => setDeleteTarget(null)}>
          <div className="perm-delete-card tab-panel-in" onClick={e => e.stopPropagation()}>
            <div className="perm-delete-icon"><i className="lni lni-trash-can"></i></div>
            <div className="perm-delete-title">Delete {deleteTarget.skillName}?</div>
            <div className="perm-delete-sub">
              This will permanently delete this skill. This can&apos;t be undone.
            </div>
            <div className="perm-delete-actions">
              <button className="btn btn-neu" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="btn btn-danger" disabled={deleteSkill.isPending} onClick={confirmDeleteSkill}>
                <i className="lni lni-trash-can"></i> {deleteSkill.isPending ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
