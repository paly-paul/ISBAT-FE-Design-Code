'use client'
import { useMemo, useState } from 'react'
import { ScrollTable } from '@/components/ScrollTable'
import { ActionMenu } from '@/components/ActionMenu'
import { TableSearch } from '@/components/TableSearch'
import { Toast } from '@/components/Toast'
import { EmptyState } from '@/components/EmptyState'
import { TableLoadingState } from '@/components/TableLoadingState'
import { AnnouncementFormModal } from '@/components/modals/student/AnnouncementFormModal'
import { AnnouncementViewModal } from '@/components/modals/student/AnnouncementViewModal'
import {
  useAnnouncements, useCreateAnnouncement, useUpdateAnnouncement, useDeleteAnnouncement, AnnouncementItem,
} from '@/hooks/student/useAnnouncementManagement'
import { usePagePermissions } from '@/hooks/users/usePagePermissions'
import { openDocumentForViewing } from '@/lib/documentViewer'
import { formatDate } from '@/lib/date'

// programName is null both for global announcements and for ones whose
// programme has since been deactivated (see get-admin-announcements.md).
function programLabel(a: AnnouncementItem): string {
  if (a.isGlobal) return 'All Programmes'
  return a.programName ?? 'Programme unavailable'
}

// Plain-text preview of the rich-text body for the table: images, tables and
// formatting are left to the View modal. Regex rather than DOMParser so it
// also runs during the static export's prerender (no `document` there).
const ENTITIES: Record<string, string> = { nbsp: ' ', amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'", apos: "'" }
function bodyPreview(html: string | null): { text: string; imageSrc: string | null } {
  const source = html ?? ''
  const text = source
    .replace(/<(br|\/p|\/div|\/li|\/h\d|\/tr)\b[^>]*>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&(nbsp|amp|lt|gt|quot|#39|apos);/g, (_, e: string) => ENTITIES[e])
    .replace(/\s+/g, ' ')
    .trim()
  // First image in the body, shown as the row's thumbnail.
  const img = source.match(/<img\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/i)
  return { text, imageSrc: img ? img[1].replace(/&amp;/g, '&') : null }
}

export default function Page() {
  const permissions = usePagePermissions()
  const [openModals, setOpenModals] = useState<Set<string>>(new Set())
  const [toast, setToast]       = useState<{ msg: string; type: string } | null>(null)
  const [search, setSearch]     = useState('')
  const [editingAnnouncementGuid, setEditingAnnouncementGuid] = useState<string | null>(null)
  const [viewingAnnouncementGuid, setViewingAnnouncementGuid] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AnnouncementItem | null>(null)

  function openModal(id: string)  { setOpenModals(prev => new Set(prev).add(id)) }
  function closeModal(id: string) { setOpenModals(prev => { const s = new Set(prev); s.delete(id); return s }) }
  function showToast(msg: string, type = '') { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }

  // Unpaginated — the endpoint returns every announcement in one response
  // (see get-admin-announcements.md), so search/sort run client-side.
  const { data, isLoading } = useAnnouncements()
  const allAnnouncements = data ?? []

  const searchTrimmed = search.trim().toLowerCase()
  const filteredRows = useMemo(() => {
    const base = searchTrimmed
      ? allAnnouncements.filter(a =>
          (a.subject ?? '').toLowerCase().includes(searchTrimmed) ||
          programLabel(a).toLowerCase().includes(searchTrimmed) ||
          (a.announcementBody ?? '').toLowerCase().includes(searchTrimmed),
        )
      : allAnnouncements
    // Newest Visible Upto first — matches the endpoint's own ordering.
    return [...base].sort((a, b) => b.announceDate.localeCompare(a.announceDate))
  }, [allAnnouncements, searchTrimmed])

  const searchMatches = useMemo(
    () => (searchTrimmed ? filteredRows.slice(0, 8) : []),
    [filteredRows, searchTrimmed],
  )

  const createAnnouncement = useCreateAnnouncement()
  const updateAnnouncement = useUpdateAnnouncement()
  const deleteAnnouncement = useDeleteAnnouncement()

  function openEditModal(guid: string) {
    setEditingAnnouncementGuid(guid)
    openModal('edit-announcement-modal')
  }

  function openViewModal(guid: string) {
    setViewingAnnouncementGuid(guid)
    openModal('view-announcement-modal')
  }

  function viewAttachment(url: string) {
    openDocumentForViewing(url).catch(() => showToast('Failed to open attachment', 'error'))
  }

  function confirmDeleteAnnouncement() {
    if (!deleteTarget) return
    deleteAnnouncement.mutate(deleteTarget.announcementGuid, {
      onSuccess: () => { setDeleteTarget(null); showToast('Announcement deleted successfully', 'success') },
      onError: (error: Error) => showToast(error.message || 'Failed to delete announcement', 'error'),
    })
  }

  return (
    <>
      <div className="page active">
        <div className="pg-hdr">
          <div>
            <div className="pg-title">Announcement Management</div>
            <div className="pg-sub">Campus-wide and programme-specific announcements for students</div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {permissions.add && <button className="btn btn-primary" onClick={() => openModal('add-announcement-modal')}><i className="lni lni-plus"></i> Add Announcement</button>}
          </div>
        </div>

        <div className="card">
          <div className="card-hdr">
            <div className="card-title"><span className="ctitle-icon"><i className="lni lni-bullhorn"></i></span> Announcements</div>
            <TableSearch
              className="w-56"
              placeholder="Search subject, programme or content…"
              value={search}
              onChange={v => setSearch(v)}
              results={searchMatches.map(a => ({ id: a.announcementGuid, primary: a.subject || 'Untitled announcement', secondary: programLabel(a) }))}
              minChars={1}
              onSelect={() => {}}
            />
          </div>
          <ScrollTable>
            <table>
              <thead>
                <tr>
                  <th style={{ width: 48 }}></th>
                  <th>Announcement</th>
                  <th>Programme</th>
                  <th>Visible Upto</th>
                  <th style={{ width: 90 }}>Attachment</th>
                </tr>
              </thead>
              <tbody>
                {isLoading
                  ? <TableLoadingState colSpan={999} />
                  : filteredRows.length === 0
                    ? <EmptyState colSpan={999} hasFilters={!!search} onClearFilters={() => setSearch('')} />
                    : null}
                {!isLoading && filteredRows.map(a => (
                  <tr key={a.announcementGuid}>
                    <td>
                      {/* View needs only the page's own access, so the menu
                          always shows; Edit/Delete follow their permissions. */}
                      <ActionMenu>
                          <button className="btn btn-neu btn-sm" onClick={() => openViewModal(a.announcementGuid)}>
                            <i className="lni lni-eye"></i> View
                          </button>
                          {permissions.edit && (
                            <button className="btn btn-neu btn-sm" onClick={() => openEditModal(a.announcementGuid)}>
                              <i className="lni lni-pencil"></i> Edit
                            </button>
                          )}
                          {permissions.delete && (
                            <button className="btn btn-neu btn-sm" onClick={() => setDeleteTarget(a)}>
                              <i className="lni lni-trash-can"></i> Delete
                            </button>
                          )}
                      </ActionMenu>
                    </td>
                    <td className="ann-cell">
                      {(() => {
                        const { text, imageSrc } = bodyPreview(a.announcementBody)
                        return (
                          <div className="ann-row">
                            {/* Every row has the same thumbnail slot — an image, or
                                a text tile — so subjects line up in one column. */}
                            <button type="button" className={`ann-thumb${imageSrc ? '' : ' is-text'}`} onClick={() => openViewModal(a.announcementGuid)} aria-label={`View ${a.subject || 'announcement'}`}>
                              {imageSrc
                                // eslint-disable-next-line @next/next/no-img-element -- body images are arbitrary external/data URLs
                                ? <img src={imageSrc} alt="" loading="lazy" />
                                : <><i className="lni lni-image" aria-hidden="true"></i><span>No image</span></>}
                            </button>
                            <div className="ann-text">
                              <strong>{a.subject || <span className="text-muted">— Untitled —</span>}</strong>
                              {text
                                ? <p className="ann-excerpt">{text}</p>
                                : imageSrc && <p className="ann-excerpt ann-excerpt-note">Image announcement</p>}
                            </div>
                          </div>
                        )
                      })()}
                    </td>
                    <td className="text-muted">{programLabel(a)}</td>
                    <td className="text-muted">{formatDate(a.announceDate)}</td>
                    <td>
                      {a.attachmentUrl ? (
                        <button
                          type="button"
                          className="btn btn-neu btn-sm"
                          title="View attachment"
                          onClick={() => viewAttachment(a.attachmentUrl as string)}
                        >
                          <i className="lni lni-paperclip"></i>
                        </button>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollTable>
        </div>
      </div>

      <AnnouncementFormModal
        mode="new"
        isOpen={openModals.has('add-announcement-modal')}
        onClose={() => closeModal('add-announcement-modal')}
        showToast={showToast}
        announcementGuid={null}
        createAnnouncement={createAnnouncement}
        updateAnnouncement={updateAnnouncement}
      />
      <AnnouncementFormModal
        mode="edit"
        isOpen={openModals.has('edit-announcement-modal')}
        onClose={() => closeModal('edit-announcement-modal')}
        showToast={showToast}
        announcementGuid={editingAnnouncementGuid}
        createAnnouncement={createAnnouncement}
        updateAnnouncement={updateAnnouncement}
      />
      <AnnouncementViewModal
        isOpen={openModals.has('view-announcement-modal')}
        onClose={() => closeModal('view-announcement-modal')}
        showToast={showToast}
        announcementGuid={viewingAnnouncementGuid}
        onEdit={permissions.edit ? guid => { closeModal('view-announcement-modal'); openEditModal(guid) } : undefined}
      />
      <Toast toast={toast} />

      {deleteTarget && (
        <div className="perm-delete-overlay" style={{ position: 'fixed', zIndex: 500 }} onClick={() => setDeleteTarget(null)}>
          <div className="perm-delete-card tab-panel-in" onClick={e => e.stopPropagation()}>
            <div className="perm-delete-icon"><i className="lni lni-trash-can"></i></div>
            <div className="perm-delete-title">Delete &quot;{deleteTarget.subject || 'this announcement'}&quot;?</div>
            <div className="perm-delete-sub">
              This will permanently delete this announcement and its attachment. This can&apos;t be undone.
            </div>
            <div className="perm-delete-actions">
              <button className="btn btn-neu" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="btn btn-danger" disabled={deleteAnnouncement.isPending} onClick={confirmDeleteAnnouncement}>
                <i className="lni lni-trash-can"></i> {deleteAnnouncement.isPending ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
