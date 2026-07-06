'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ScrollTable } from '@/components/ScrollTable'
import { ActionMenu } from '@/components/ActionMenu'
import { NewPermissionModal } from '@/components/modals/academic/NewPermissionModal'
import { EditPermissionModal } from '@/components/modals/academic/EditPermissionModal'
import { Toast } from '@/components/Toast'

export default function Page() {
  const router = useRouter()
  const [openModals, setOpenModals] = useState<Set<string>>(new Set())
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)

  function nav(id: string) { router.push('/academic/' + id) }
  function openModal(id: string) { setOpenModals(prev => new Set(prev).add(id)) }
  function closeModal(id: string) { setOpenModals(prev => { const s = new Set(prev); s.delete(id); return s }) }
  function showToast(msg: string, type = '') { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }

  const rows = [
    { group: 'Super Admin',    description: 'Full system access across all modules — Admission, Academic, Student, Employee & Configuration' },
    { group: 'Registrar',      description: 'Manage admissions, registrations, student records and academic calendars' },
    { group: 'Faculty Dean',   description: 'View and approve programme, course unit and faculty-level records' },
    { group: 'Lecturer',       description: 'Access assigned course units, submit results and manage class attendance' },
    { group: 'Finance Officer', description: 'Manage fee structures, payments and financial reconciliation' },
    { group: 'Read Only',      description: 'View-only access across modules — no create, edit or delete permissions' },
  ]

  return (
    <>
      <div className="page active">
        <div className="pg-hdr">
          <div>
            <div className="pg-title">Permission Master</div>
            <div className="pg-sub">Define permission groups and their access scope across the ERP</div>
          </div>
          <button className="btn btn-primary" onClick={() => openModal('new-permission-modal')}>
            <i className="lni lni-plus"></i> Add Group
          </button>
        </div>
        <div className="card">
          <div className="card-hdr">
            <div className="card-title"><span className="ctitle-icon"><i className="lni lni-lock"></i></span> Permission Groups</div>
          </div>
          <ScrollTable>
            <table>
              <thead>
                <tr>
                  <th style={{ width: 48 }}></th>
                  <th>Group Name</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i}>
                    <td>
                      <ActionMenu>
                        <button className="btn btn-neu btn-sm" onClick={() => openModal('edit-permission-modal')}>
                          <i className="lni lni-pencil"></i> Edit
                        </button>
                      </ActionMenu>
                    </td>
                    <td><strong>{r.group}</strong></td>
                    <td className="text-g600">{r.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollTable>
        </div>
      </div>
      <NewPermissionModal isOpen={openModals.has('new-permission-modal')} onClose={() => closeModal('new-permission-modal')} showToast={showToast} />
      <EditPermissionModal isOpen={openModals.has('edit-permission-modal')} onClose={() => closeModal('edit-permission-modal')} showToast={showToast} />
      <Toast toast={toast} />
    </>
  )
}
