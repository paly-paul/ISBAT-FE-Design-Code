'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ScrollTable } from '@/components/ScrollTable'
import { ActionMenu } from '@/components/ActionMenu'
import { Toast } from '@/components/Toast'
import { EmptyState } from '@/components/EmptyState'
import { TableLoadingState } from '@/components/TableLoadingState'
import { Pagination } from '@/components/Pagination'
import { usePagination } from '@/hooks/usePagination'
import { NewSkillModal } from '@/components/modals/academic/NewSkillModal'
import { EditSkillModal } from '@/components/modals/academic/EditSkillModal'
import { useSkills, useCreateSkill, useUpdateSkill, Skill } from '@/hooks/config/useSkills'

const PAGE_SIZE = 10

export default function Page() {
  const router = useRouter()
  const [openModals, setOpenModals] = useState<Set<string>>(new Set())
  const [toast, setToast]           = useState<{ msg: string; type: string } | null>(null)
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null)

  const { data: rows = [], isLoading } = useSkills()
  const createSkill = useCreateSkill()
  const updateSkill = useUpdateSkill()

  const { page, setPage, totalPages, totalCount, pageItems } = usePagination(rows, PAGE_SIZE)

  function nav(id: string) { router.push('/config/' + id) }
  function openModal(id: string)  { setOpenModals(prev => new Set(prev).add(id)) }
  function closeModal(id: string) { setOpenModals(prev => { const s = new Set(prev); s.delete(id); return s }) }
  function showToast(msg: string, type = '') { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }

  function openEditModal(skill: Skill) {
    setEditingSkill(skill)
    openModal('edit-skill-modal')
  }

  return (
    <>
      <div className="page active">
        <div className="pg-hdr">
          <div>
            <div className="pg-title">Skill Master</div>
            <div className="pg-sub">Define skills and subject areas for lecturer profiles</div>
          </div>
          <button className="btn btn-primary" onClick={() => openModal('new-skill-modal')}>
            <i className="lni lni-plus"></i> Add Skill
          </button>
        </div>
        <div className="card">
          <div className="card-hdr">
            <div className="card-title"><span className="ctitle-icon"><i className="lni lni-bulb"></i></span> Skills</div>
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
                  : rows.length === 0
                    ? <EmptyState colSpan={999} hasFilters={false} onClearFilters={() => {}} />
                    : null}
                {pageItems.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <ActionMenu>
                        <button className="btn btn-neu btn-sm" onClick={() => openEditModal(r)}>
                          <i className="lni lni-pencil"></i> Edit
                        </button>
                      </ActionMenu>
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
      <Toast toast={toast} />
    </>
  )
}
