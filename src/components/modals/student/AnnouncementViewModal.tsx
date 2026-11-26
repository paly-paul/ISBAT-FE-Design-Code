'use client'
import { useState } from 'react'
import { ModalProps } from '../types'
import { FailurePopup } from '../shared/FailurePopup'
import { DocumentPreviewModal } from '../shared/DocumentPreviewModal'
import { RichTextDisplay } from '@/components/RichTextEditor'
import { useAnnouncement } from '@/hooks/student/useAnnouncementManagement'
import { formatDate } from '@/lib/date'
import { AuthError } from '@/lib/api/client'

// Read-only view of one announcement, loaded fresh from
// GET /students/announcements/{guid} (get-admin-announcement-by-guid.md) —
// so the attachment link is a new presigned URL, not the list's possibly
// expired one.
interface AnnouncementViewModalProps extends ModalProps {
  announcementGuid: string | null
  // Shown only when the page allows editing; opens the Edit modal.
  onEdit?: (guid: string) => void
}

// announceDate is the last day students see it (the "Visible Upto" column).
function isStillVisible(announceDate: string): boolean {
  const today = new Date()
  const ymd = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  return announceDate.slice(0, 10) >= ymd
}

export function AnnouncementViewModal({ isOpen, onClose, announcementGuid, onEdit }: AnnouncementViewModalProps) {
  const { data: a, isLoading, isError, error } = useAnnouncement(announcementGuid, isOpen)
  const [previewOpen, setPreviewOpen] = useState(false)

  if (!isOpen) return null

  function handleClose() {
    setPreviewOpen(false)
    onClose()
  }

  if (isError) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <FailurePopup
            title="Couldn't Load Announcement"
            subtitle={error instanceof AuthError && error.message ? error.message : 'Failed to load the announcement.'}
            onClose={onClose}
          />
        </div>
      </div>
    )
  }

  const visible = a ? isStillVisible(a.announceDate) : false

  return (
    <>
    <div className="modal-overlay open" id="view-announcement-modal">
      <div className="modal modal-lg modal-flex ann-view" role="dialog" aria-modal="true" aria-labelledby="ann-view-title" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr modal-hdr-blue">
          <div className="modal-title" id="ann-view-title"><i className="lni lni-bullhorn"></i> Announcement</div>
          <button className="modal-close" onClick={handleClose} aria-label="Close"><i className="lni lni-close"></i></button>
        </div>

        <div className="modal-scroll">
          {isLoading || !a ? (
            <div className="ann-view-loading">Loading announcement…</div>
          ) : (
            <>
              <h2 className="ann-view-subject">{a.subject || 'Untitled announcement'}</h2>
              <dl className="ann-view-meta">
                <div>
                  <dt>Programme</dt>
                  <dd>{a.isGlobal ? 'All Programmes' : (a.programName ?? 'Programme unavailable')}</dd>
                </div>
                <div>
                  <dt>Visible Upto</dt>
                  <dd>
                    {formatDate(a.announceDate)}
                    <span className={`badge ${visible ? 'badge-green' : 'badge-grey'} ann-view-state`}>
                      {visible ? 'Visible to students' : 'No longer visible'}
                    </span>
                  </dd>
                </div>
              </dl>

              <div className="ann-view-body">
                {a.announcementBody
                  ? <RichTextDisplay content={a.announcementBody} />
                  : <p className="text-muted">No message.</p>}
              </div>

              {a.attachmentUrl && (
                <button type="button" className="ann-view-attach" onClick={() => setPreviewOpen(true)}>
                  <i className="lni lni-paperclip" aria-hidden="true"></i>
                  <span>View attachment</span>
                  <i className="lni lni-arrow-right ann-view-attach-go" aria-hidden="true"></i>
                </button>
              )}
            </>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-neu" onClick={handleClose}>Close</button>
          {onEdit && a && (
            <button className="btn btn-primary" onClick={() => onEdit(a.announcementGuid)}>
              <i className="lni lni-pencil"></i> Edit
            </button>
          )}
        </div>
      </div>
    </div>
    {/* Opens over this modal; the attachment URL is this GET's fresh presign. */}
    <DocumentPreviewModal
      isOpen={previewOpen && !!a?.attachmentUrl}
      onClose={() => setPreviewOpen(false)}
      url={a?.attachmentUrl ?? null}
      title={a?.subject ? `Attachment — ${a.subject}` : 'Attachment'}
    />
    </>
  )
}
