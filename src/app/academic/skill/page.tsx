'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ScrollTable } from '@/components/ScrollTable'
import { ActionMenu } from '@/components/ActionMenu'
import { Toast } from '@/components/Toast'
import { EmptyState } from '@/components/EmptyState'
import { NewSkillModal } from '@/components/modals/academic/NewSkillModal'
import { EditSkillModal } from '@/components/modals/academic/EditSkillModal'

export default function Page() {
  const router = useRouter()
  const [openModals, setOpenModals] = useState<Set<string>>(new Set())
  const [toast, setToast]           = useState<{ msg: string; type: string } | null>(null)

  function nav(id: string) { router.push('/academic/' + id) }
  function openModal(id: string)  { setOpenModals(prev => new Set(prev).add(id)) }
  function closeModal(id: string) { setOpenModals(prev => { const s = new Set(prev); s.delete(id); return s }) }
  function showToast(msg: string, type = '') { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }

  const rows = [
    { skillName: 'C#' },
    { skillName: 'Python' },
    { skillName: 'Java' },
    { skillName: 'SQL' },
    { skillName: 'JavaScript' },
    { skillName: 'Data Structures' },
    { skillName: 'Computer Networks' },
    { skillName: 'Operating Systems' },
  ]

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
                {rows.length === 0
                  ? <EmptyState colSpan={999} hasFilters={false} onClearFilters={() => {}} />
                  : null}
                {rows.map((r, i) => (
                  <tr key={i}>
                    <td>
                      <ActionMenu>
                        <button className="btn btn-neu btn-sm" onClick={() => openModal('edit-skill-modal')}>
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
        </div>
      </div>
      <NewSkillModal  isOpen={openModals.has('new-skill-modal')}  onClose={() => closeModal('new-skill-modal')}  showToast={showToast} />
      <EditSkillModal isOpen={openModals.has('edit-skill-modal')} onClose={() => closeModal('edit-skill-modal')} showToast={showToast} />
      <Toast toast={toast} />
    </>
  )
}
