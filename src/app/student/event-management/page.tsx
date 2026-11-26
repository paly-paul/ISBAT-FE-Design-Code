'use client'
import { useMemo, useState } from 'react'
import { ScrollTable } from '@/components/ScrollTable'
import { ActionMenu } from '@/components/ActionMenu'
import { TableSearch } from '@/components/TableSearch'
import { Toast } from '@/components/Toast'
import { EmptyState } from '@/components/EmptyState'
import { TableLoadingState } from '@/components/TableLoadingState'
import { Pagination } from '@/components/Pagination'
import { EventFormModal } from '@/components/modals/student/EventFormModal'
import { EventViewModal } from '@/components/modals/student/EventViewModal'
import { useEvents, useCreateEvent, useUpdateEvent, useDeleteEvent, EventItem } from '@/hooks/student/useEventManagement'
import { usePagePermissions } from '@/hooks/users/usePagePermissions'
import { formatDate } from '@/lib/date'

const PAGE_SIZE = 10

export default function Page() {
  const permissions = usePagePermissions()
  const [openModals, setOpenModals] = useState<Set<string>>(new Set())
  const [toast, setToast]       = useState<{ msg: string; type: string } | null>(null)
  const [search, setSearch]     = useState('')
  const [editingEventGuid, setEditingEventGuid] = useState<string | null>(null)
  const [viewingEventGuid, setViewingEventGuid] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<EventItem | null>(null)

  function openModal(id: string)  { setOpenModals(prev => new Set(prev).add(id)) }
  function closeModal(id: string) { setOpenModals(prev => { const s = new Set(prev); s.delete(id); return s }) }
  function showToast(msg: string, type = '') { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }

  // Server-side pages of PAGE_SIZE (?page=&pageSize=). The endpoint has no
  // search param, so search filters only the rows of the page on screen.
  const [page, setPage] = useState(1)
  const { data, isLoading } = useEvents(page, PAGE_SIZE)
  const pageEvents = useMemo(() => data?.events ?? [], [data])
  const totalCount = data?.totalCount ?? 0
  const totalPages = data?.totalPages ?? 0

  const searchTrimmed = search.trim().toLowerCase()
  const filteredRows = useMemo(() => {
    if (!searchTrimmed) return pageEvents
    return pageEvents.filter(e =>
      (e.subject ?? '').toLowerCase().includes(searchTrimmed) ||
      (e.eventBody ?? '').toLowerCase().includes(searchTrimmed),
    )
  }, [pageEvents, searchTrimmed])

  const searchMatches = useMemo(
    () => (searchTrimmed ? filteredRows.slice(0, 8) : []),
    [filteredRows, searchTrimmed],
  )

  const createEvent = useCreateEvent()
  const updateEvent = useUpdateEvent()
  const deleteEvent  = useDeleteEvent()

  function openEditModal(guid: string) {
    setEditingEventGuid(guid)
    openModal('edit-event-modal')
  }

  function openViewModal(guid: string) {
    setViewingEventGuid(guid)
    openModal('view-event-modal')
  }

  function confirmDeleteEvent() {
    if (!deleteTarget) return
    deleteEvent.mutate(deleteTarget.eventGuid, {
      onSuccess: () => {
        // Deleting the only row on a later page would leave an empty page.
        if (pageEvents.length === 1 && page > 1) setPage(page - 1)
        setDeleteTarget(null)
        showToast('Event deleted successfully', 'success')
      },
      onError: (error: Error) => showToast(error.message || 'Failed to delete event', 'error'),
    })
  }

  return (
    <>
      <div className="page active">
        <div className="pg-hdr">
          <div>
            <div className="pg-title">Event Management</div>
            <div className="pg-sub">Academic calendar events · Announcements for students</div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {permissions.add && <button className="btn btn-primary" onClick={() => openModal('add-event-modal')}><i className="lni lni-plus"></i> Add Event</button>}
          </div>
        </div>

        <div className="card">
          <div className="card-hdr">
            <div className="card-title"><span className="ctitle-icon"><i className="lni lni-calendar"></i></span> Events</div>
            <TableSearch
              className="w-56"
              placeholder="Search topic or event…"
              value={search}
              onChange={v => setSearch(v)}
              results={searchMatches.map(e => ({ id: e.eventGuid, primary: e.subject || 'Untitled event', secondary: formatDate(e.eventDate) }))}
              minChars={1}
              onSelect={() => {}}
            />
          </div>
          <ScrollTable>
            <table>
              <thead>
                <tr>
                  <th style={{ width: 48 }}></th>
                  <th>Topic</th>
                  <th>Event Date</th>
                  <th>Event</th>
                </tr>
              </thead>
              <tbody>
                {isLoading
                  ? <TableLoadingState colSpan={999} />
                  : filteredRows.length === 0
                    ? <EmptyState colSpan={999} hasFilters={!!search} onClearFilters={() => setSearch('')} />
                    : null}
                {!isLoading && filteredRows.map(e => (
                  <tr key={e.eventGuid}>
                    <td>
                      {/* View needs only the page's own access, so the menu
                          always shows; Edit/Delete follow their permissions. */}
                      <ActionMenu>
                          <button className="btn btn-neu btn-sm" onClick={() => openViewModal(e.eventGuid)}>
                            <i className="lni lni-eye"></i> View
                          </button>
                          {permissions.edit && (
                            <button className="btn btn-neu btn-sm" onClick={() => openEditModal(e.eventGuid)}>
                              <i className="lni lni-pencil"></i> Edit
                            </button>
                          )}
                          {permissions.delete && (
                            <button className="btn btn-neu btn-sm" onClick={() => setDeleteTarget(e)}>
                              <i className="lni lni-trash-can"></i> Delete
                            </button>
                          )}
                      </ActionMenu>
                    </td>
                    <td><strong>{e.subject || <span className="text-muted">— Untitled —</span>}</strong></td>
                    <td className="text-muted">{formatDate(e.eventDate)}</td>
                    <td>{e.eventBody}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollTable>
          {!isLoading && <Pagination page={page} totalPages={totalPages} totalCount={totalCount} itemLabel="events" onPageChange={setPage} />}
        </div>
      </div>

      <EventFormModal
        mode="new"
        isOpen={openModals.has('add-event-modal')}
        onClose={() => closeModal('add-event-modal')}
        showToast={showToast}
        eventGuid={null}
        createEvent={createEvent}
        updateEvent={updateEvent}
      />
      <EventFormModal
        mode="edit"
        isOpen={openModals.has('edit-event-modal')}
        onClose={() => closeModal('edit-event-modal')}
        showToast={showToast}
        eventGuid={editingEventGuid}
        createEvent={createEvent}
        updateEvent={updateEvent}
      />
      <EventViewModal
        isOpen={openModals.has('view-event-modal')}
        onClose={() => closeModal('view-event-modal')}
        showToast={showToast}
        eventGuid={viewingEventGuid}
        onEdit={permissions.edit ? guid => { closeModal('view-event-modal'); openEditModal(guid) } : undefined}
      />
      <Toast toast={toast} />

      {deleteTarget && (
        <div className="perm-delete-overlay" style={{ position: 'fixed', zIndex: 500 }} onClick={() => setDeleteTarget(null)}>
          <div className="perm-delete-card tab-panel-in" onClick={e => e.stopPropagation()}>
            <div className="perm-delete-icon"><i className="lni lni-trash-can"></i></div>
            <div className="perm-delete-title">Delete &quot;{deleteTarget.subject || 'this event'}&quot;?</div>
            <div className="perm-delete-sub">
              This will permanently delete this event entry. This can&apos;t be undone.
            </div>
            <div className="perm-delete-actions">
              <button className="btn btn-neu" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="btn btn-danger" disabled={deleteEvent.isPending} onClick={confirmDeleteEvent}>
                <i className="lni lni-trash-can"></i> {deleteEvent.isPending ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
