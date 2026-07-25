'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ScrollTable } from '@/components/ScrollTable'
import { ActionMenu } from '@/components/ActionMenu'
import { Toast } from '@/components/Toast'
import { EmptyState } from '@/components/EmptyState'
import { TableLoadingState } from '@/components/TableLoadingState'
import { NewWeekdayModal } from '@/components/modals/academic/NewWeekdayModal'
import { EditWeekdayModal } from '@/components/modals/academic/EditWeekdayModal'
import { useWeekdays, useCreateWeekday, useUpdateWeekday, useDeleteWeekday, Weekday } from '@/hooks/config/useWeekdays'

export default function Page() {
  const router = useRouter()
  const [openModals, setOpenModals] = useState<Set<string>>(new Set())
  const [toast, setToast]           = useState<{ msg: string; type: string } | null>(null)
  const [editingWeekdayGuid, setEditingWeekdayGuid] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Weekday | null>(null)

  const { data: rows = [], isLoading } = useWeekdays()
  const createWeekday = useCreateWeekday()
  const updateWeekday = useUpdateWeekday()
  const deleteWeekday = useDeleteWeekday()

  function nav(id: string) { router.push('/config/' + id) }
  function openModal(id: string)  { setOpenModals(prev => new Set(prev).add(id)) }
  function closeModal(id: string) { setOpenModals(prev => { const s = new Set(prev); s.delete(id); return s }) }
  function showToast(msg: string, type = '') { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }

  function openEditModal(guid: string) {
    setEditingWeekdayGuid(guid)
    openModal('edit-weekday-modal')
  }

  function confirmDeleteWeekday() {
    if (!deleteTarget) return
    deleteWeekday.mutate(deleteTarget.weekDayGuid, {
      onSuccess: () => { setDeleteTarget(null); showToast('Weekday deleted successfully') },
      onError: (error: Error) => showToast(error.message || 'Failed to delete weekday', 'error'),
    })
  }

  return (
    <>
      <div className="page active">
        <div className="pg-hdr">
          <div>
            <div className="pg-title">Weekday Master</div>
            <div className="pg-sub">Manage the days of the week used across scheduling and timetables</div>
          </div>
          <button className="btn btn-primary" onClick={() => openModal('new-weekday-modal')}>
            <i className="lni lni-plus"></i> Add Weekday
          </button>
        </div>
        <div className="card">
          <div className="card-hdr">
            <div className="card-title"><span className="ctitle-icon"><i className="lni lni-calendar"></i></span> Weekdays</div>
          </div>
          <ScrollTable>
            <table>
              <thead>
                <tr>
                  <th style={{ width: 48 }}></th>
                  <th>Day Code</th>
                  <th>Day Name</th>
                </tr>
              </thead>
              <tbody>
                {isLoading
                  ? <TableLoadingState colSpan={999} />
                  : rows.length === 0
                    ? <EmptyState colSpan={999} hasFilters={false} onClearFilters={() => {}} />
                    : null}
                {rows.map((r) => (
                  <tr key={r.weekDayGuid}>
                    <td>
                      <ActionMenu>
                        <button className="btn btn-neu btn-sm" onClick={() => openEditModal(r.weekDayGuid)}>
                          <i className="lni lni-pencil"></i> Edit
                        </button>
                        <button className="btn btn-neu btn-sm" onClick={() => setDeleteTarget(r)}>
                          <i className="lni lni-trash-can"></i> Delete
                        </button>
                      </ActionMenu>
                    </td>
                    <td className="font-mono font-bold uppercase">{r.dayCode}</td>
                    <td><strong className="capitalize">{r.dayName}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollTable>
        </div>
      </div>
      <NewWeekdayModal
        isOpen={openModals.has('new-weekday-modal')}
        onClose={() => closeModal('new-weekday-modal')}
        showToast={showToast}
        createWeekday={createWeekday}
      />
      <EditWeekdayModal
        isOpen={openModals.has('edit-weekday-modal')}
        onClose={() => closeModal('edit-weekday-modal')}
        showToast={showToast}
        weekDayGuid={editingWeekdayGuid}
        updateWeekday={updateWeekday}
      />
      <Toast toast={toast} />

      {deleteTarget && (
        <div className="perm-delete-overlay" style={{ position: 'fixed', zIndex: 500 }} onClick={() => setDeleteTarget(null)}>
          <div className="perm-delete-card tab-panel-in" onClick={e => e.stopPropagation()}>
            <div className="perm-delete-icon"><i className="lni lni-trash-can"></i></div>
            <div className="perm-delete-title capitalize">Delete {deleteTarget.dayName}?</div>
            <div className="perm-delete-sub">
              This will permanently delete this weekday. This can&apos;t be undone.
            </div>
            <div className="perm-delete-actions">
              <button className="btn btn-neu" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="btn btn-danger" disabled={deleteWeekday.isPending} onClick={confirmDeleteWeekday}>
                <i className="lni lni-trash-can"></i> {deleteWeekday.isPending ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
