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
import { useServerTable } from '@/hooks/useServerTable'
import { getWeekdaysPaged } from '@/lib/api/academic/weekday'
import { WeekdayFormModal } from '@/components/modals/config/WeekdayFormModal'
import { ViewWeekdayModal } from '@/components/modals/config/ViewWeekdayModal'
import { WEEKDAYS_KEY, useCreateWeekday, useUpdateWeekday, useDeleteWeekday, Weekday } from '@/hooks/config/useWeekdays'
import { usePagePermissions } from '@/hooks/users/usePagePermissions'

const PAGE_SIZE = 10
// Don't narrow the table (or open the search dropdown) until the user's
// typed at least this many characters — same convention as the other
// master pages' search boxes.
const MIN_SEARCH_CHARS = 2

export default function Page() {
  const router = useRouter()
  const permissions = usePagePermissions()
  const [openModals, setOpenModals] = useState<Set<string>>(new Set())
  const [toast, setToast]           = useState<{ msg: string; type: string } | null>(null)
  const [editingWeekdayGuid, setEditingWeekdayGuid] = useState<string | null>(null)
  const [viewingWeekdayGuid, setViewingWeekdayGuid] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Weekday | null>(null)

  // One page at a time from the server (?page=&pageSize=&search=), so the
  // search box narrows the whole list, not just the rows on screen.
  const table = useServerTable({ queryKey: WEEKDAYS_KEY, fetchPage: getWeekdaysPaged, pageSize: PAGE_SIZE, minSearch: MIN_SEARCH_CHARS })
  const { items: rows, search, setSearch, page, setPage, totalPages, totalCount } = table
  const isLoading = table.isLoading || table.searchPending
  const createWeekday = useCreateWeekday()
  const updateWeekday = useUpdateWeekday()
  const deleteWeekday = useDeleteWeekday()

  // Search-box preview: the first of the server's matches.
  const searchMatches = search.trim().length >= MIN_SEARCH_CHARS && !table.searchPending ? rows.slice(0, 8) : []
  const pageItems = table.searchPending ? [] : rows

  function nav(id: string) { router.push('/config/' + id) }
  function openModal(id: string)  { setOpenModals(prev => new Set(prev).add(id)) }
  function closeModal(id: string) { setOpenModals(prev => { const s = new Set(prev); s.delete(id); return s }) }
  function showToast(msg: string, type = '') { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }

  function openEditModal(guid: string) {
    setEditingWeekdayGuid(guid)
    openModal('edit-weekday-modal')
  }

  function openViewModal(guid: string) {
    setViewingWeekdayGuid(guid)
    openModal('view-weekday-modal')
    setSearch('')
  }

  function confirmDeleteWeekday() {
    if (!deleteTarget) return
    deleteWeekday.mutate(deleteTarget.weekDayGuid, {
      onSuccess: () => { setDeleteTarget(null); showToast('Weekday deleted successfully', 'success') },
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
          {permissions.add && (
            <button className="btn btn-primary" onClick={() => openModal('new-weekday-modal')}>
              <i className="lni lni-plus"></i> Add Weekday
            </button>
          )}
        </div>
        <div className="card">
          <div className="card-hdr">
            <div className="card-title"><span className="ctitle-icon"><i className="lni lni-calendar"></i></span> Weekdays</div>
            <div className="flex gap-2">
              <TableSearch
                className="w-56"
                placeholder="Search by code or name…"
                value={search}
                onChange={setSearch}
                results={searchMatches.map(r => ({ id: r.weekDayGuid, primary: r.dayCode, secondary: r.dayName }))}
                minChars={MIN_SEARCH_CHARS}
                loading={table.searchPending}
                onSelect={(r) => openViewModal(r.id)}
              />
            </div>
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
                  : pageItems.length === 0
                    ? <EmptyState colSpan={999} hasFilters={false} onClearFilters={() => {}} />
                    : null}
                {pageItems.map((r) => (
                  <tr key={r.weekDayGuid}>
                    <td>
                      {(true) && (
                        <ActionMenu>
                          <button className="btn btn-neu btn-sm" onClick={() => openViewModal(r.weekDayGuid)}><i className="lni lni-eye"></i> View</button>
                          {permissions.edit && <button className="btn btn-neu btn-sm" onClick={() => openEditModal(r.weekDayGuid)}>
                            <i className="lni lni-pencil"></i> Edit
                          </button>}
                          {permissions.delete && <button className="btn btn-neu btn-sm" onClick={() => setDeleteTarget(r)}>
                            <i className="lni lni-trash-can"></i> Delete
                          </button>}
                        </ActionMenu>
                      )}
                    </td>
                    <td className="font-mono font-bold uppercase">{r.dayCode}</td>
                    <td><strong className="capitalize">{r.dayName}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollTable>
          <Pagination page={page} totalPages={totalPages} totalCount={totalCount} itemLabel="weekdays" onPageChange={setPage} />
        </div>
      </div>
      <WeekdayFormModal
        mode="new"
        isOpen={openModals.has('new-weekday-modal')}
        onClose={() => closeModal('new-weekday-modal')}
        showToast={showToast}
        weekDayGuid={null}
        createWeekday={createWeekday}
        updateWeekday={updateWeekday}
      />
      <WeekdayFormModal
        mode="edit"
        isOpen={openModals.has('edit-weekday-modal')}
        onClose={() => closeModal('edit-weekday-modal')}
        showToast={showToast}
        weekDayGuid={editingWeekdayGuid}
        createWeekday={createWeekday}
        updateWeekday={updateWeekday}
      />
      <ViewWeekdayModal
        isOpen={openModals.has('view-weekday-modal')}
        onClose={() => closeModal('view-weekday-modal')}
        showToast={showToast}
        weekDayGuid={viewingWeekdayGuid}
        canEdit={Boolean(permissions.edit)}
        onEdit={() => {
          closeModal('view-weekday-modal')
          openEditModal(viewingWeekdayGuid!)
        }}
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
