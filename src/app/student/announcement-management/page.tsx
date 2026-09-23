'use client'
import { useMemo, useState } from 'react'
import { ScrollTable } from '@/components/ScrollTable'
import { ActionMenu } from '@/components/ActionMenu'
import { TableSearch } from '@/components/TableSearch'
import { Toast } from '@/components/Toast'
import { EmptyState } from '@/components/EmptyState'
import { RichTextDisplay } from '@/components/RichTextEditor'
import { AnnouncementFormModal } from '@/components/modals/student/AnnouncementFormModal'
import { AttachmentPreviewModal } from '@/components/modals/shared/AttachmentPreviewModal'
import { usePagePermissions } from '@/hooks/users/usePagePermissions'
import { formatDate } from '@/lib/date'
import { AnnouncementInput, AnnouncementItem } from './types'

let mockAnnouncementSeq = 1

// No backend endpoint exists for this page yet (see types.ts) — seeded with
// a couple of sample rows, ported from the legacy "Announcement Management"
// screen, and held entirely in local state below. Swap for a real
// hooks/api-client pair (mirroring Event Management) once the backend ships
// the CRUD endpoints.
const initialAnnouncements: AnnouncementItem[] = [
  {
    announcementGuid: 'mock-announcement-1',
    subject: "Board Chairman's Message",
    programGuid: null,
    programName: null,
    visibleUpto: '2026-12-31',
    body: "<p><strong>BOARD CHAIRMAN'S MESSAGE</strong></p><p>Dear Students,</p><p>Greetings from ISBAT University!</p><p>As we begin the continuing students, I extend a warm welcome to the new session Spring 2026! We are pleased and feel happy to have you back, and to embark on a new and exciting academic journey at ISBAT. As we start this new semester, we encourage you to set your goals, stay focused, and make the most of your journey with us and the dreams you hold towards the world of the highest education.</p>",
    // Live network sample (picsum.photos) so the Attachment preview popup has
    // something real to show before a real upload/backend exists.
    attachmentUrl: 'https://picsum.photos/seed/isbat-announcement/900/600',
    attachmentName: 'chairmans-message-banner.jpg',
    attachmentType: 'image',
  },
  {
    announcementGuid: 'mock-announcement-2',
    subject: 'Hybrid Blended Learning Platform',
    programGuid: null,
    programName: null,
    visibleUpto: '2026-10-15',
    body: '<p>ISBAT University’s Hybrid Blended Learning platform brings every student to a experimental learning, spanning at outcome-based learning as designed by its academic delivery.</p>',
    // Live network sample (Mozilla's public pdf.js demo file) — same reasoning
    // as the image above.
    attachmentUrl: 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf',
    attachmentName: 'hybrid-learning-overview.pdf',
    attachmentType: 'pdf',
  },
]

export default function Page() {
  const permissions = usePagePermissions()
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>(initialAnnouncements)
  const [openModals, setOpenModals] = useState<Set<string>>(new Set())
  const [toast, setToast]       = useState<{ msg: string; type: string } | null>(null)
  const [search, setSearch]     = useState('')
  const [editingAnnouncement, setEditingAnnouncement] = useState<AnnouncementItem | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AnnouncementItem | null>(null)
  const [previewTarget, setPreviewTarget] = useState<AnnouncementItem | null>(null)

  function openModal(id: string)  { setOpenModals(prev => new Set(prev).add(id)) }
  function closeModal(id: string) { setOpenModals(prev => { const s = new Set(prev); s.delete(id); return s }) }
  function showToast(msg: string, type = '') { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }

  const searchTrimmed = search.trim().toLowerCase()
  const filteredRows = useMemo(() => {
    const base = searchTrimmed
      ? announcements.filter(a =>
          a.subject.toLowerCase().includes(searchTrimmed) ||
          (a.programName ?? '').toLowerCase().includes(searchTrimmed) ||
          a.body.toLowerCase().includes(searchTrimmed),
        )
      : announcements
    // Newest Visible Upto first, matching Event Management's ordering.
    return [...base].sort((a, b) => b.visibleUpto.localeCompare(a.visibleUpto))
  }, [announcements, searchTrimmed])

  const searchMatches = useMemo(
    () => (searchTrimmed ? filteredRows.slice(0, 8) : []),
    [filteredRows, searchTrimmed],
  )

  function openEditModal(item: AnnouncementItem) {
    setEditingAnnouncement(item)
    openModal('edit-announcement-modal')
  }

  function handleCreate(input: AnnouncementInput) {
    setAnnouncements(prev => [{ announcementGuid: `mock-announcement-new-${mockAnnouncementSeq++}`, ...input }, ...prev])
  }

  function handleUpdate(input: AnnouncementInput) {
    if (!editingAnnouncement) return
    const guid = editingAnnouncement.announcementGuid
    if (editingAnnouncement.attachmentUrl && editingAnnouncement.attachmentUrl !== input.attachmentUrl) {
      URL.revokeObjectURL(editingAnnouncement.attachmentUrl)
    }
    setAnnouncements(prev => prev.map(a => (a.announcementGuid === guid ? { announcementGuid: guid, ...input } : a)))
  }

  function confirmDeleteAnnouncement() {
    if (!deleteTarget) return
    if (deleteTarget.attachmentUrl) URL.revokeObjectURL(deleteTarget.attachmentUrl)
    setAnnouncements(prev => prev.filter(a => a.announcementGuid !== deleteTarget.announcementGuid))
    setDeleteTarget(null)
    showToast('Announcement deleted successfully')
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
              results={searchMatches.map(a => ({ id: a.announcementGuid, primary: a.subject || 'Untitled announcement', secondary: a.programName ?? 'All Programmes' }))}
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
                {filteredRows.length === 0 && (
                  <EmptyState colSpan={999} hasFilters={!!search} onClearFilters={() => setSearch('')} />
                )}
                {filteredRows.map(a => (
                  <tr key={a.announcementGuid}>
                    <td>
                      {(permissions.edit || permissions.delete) && (
                        <ActionMenu>
                          {permissions.edit && (
                            <button className="btn btn-neu btn-sm" onClick={() => openEditModal(a)}>
                              <i className="lni lni-pencil"></i> Edit
                            </button>
                          )}
                          {permissions.delete && (
                            <button className="btn btn-neu btn-sm" onClick={() => setDeleteTarget(a)}>
                              <i className="lni lni-trash-can"></i> Delete
                            </button>
                          )}
                        </ActionMenu>
                      )}
                    </td>
                    <td style={{ maxWidth: 480 }}>
                      <strong>{a.subject || <span className="text-muted">— Untitled —</span>}</strong>
                      <div className="text-muted" style={{ fontSize: 12.5, marginTop: 4, maxHeight: 60, overflow: 'hidden' }}>
                        <RichTextDisplay content={a.body} />
                      </div>
                    </td>
                    <td className="text-muted">{a.programName ?? 'All Programmes'}</td>
                    <td className="text-muted">{formatDate(a.visibleUpto)}</td>
                    <td>
                      {a.attachmentUrl ? (
                        <button
                          type="button"
                          className="btn btn-neu btn-sm"
                          title={a.attachmentName ?? 'View attachment'}
                          onClick={() => setPreviewTarget(a)}
                        >
                          <i className={`lni ${a.attachmentType === 'image' ? 'lni-image' : 'lni-files'}`}></i>
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
        initial={null}
        onSubmit={handleCreate}
      />
      <AnnouncementFormModal
        mode="edit"
        isOpen={openModals.has('edit-announcement-modal')}
        onClose={() => closeModal('edit-announcement-modal')}
        showToast={showToast}
        initial={editingAnnouncement}
        onSubmit={handleUpdate}
      />
      <AttachmentPreviewModal
        isOpen={!!previewTarget}
        onClose={() => setPreviewTarget(null)}
        url={previewTarget?.attachmentUrl ?? null}
        name={previewTarget?.attachmentName ?? null}
        type={previewTarget?.attachmentType ?? null}
      />
      <Toast toast={toast} />

      {deleteTarget && (
        <div className="perm-delete-overlay" style={{ position: 'fixed', zIndex: 500 }} onClick={() => setDeleteTarget(null)}>
          <div className="perm-delete-card tab-panel-in" onClick={e => e.stopPropagation()}>
            <div className="perm-delete-icon"><i className="lni lni-trash-can"></i></div>
            <div className="perm-delete-title">Delete &quot;{deleteTarget.subject || 'this announcement'}&quot;?</div>
            <div className="perm-delete-sub">
              This will permanently delete this announcement. This can&apos;t be undone.
            </div>
            <div className="perm-delete-actions">
              <button className="btn btn-neu" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={confirmDeleteAnnouncement}>
                <i className="lni lni-trash-can"></i> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
