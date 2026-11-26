'use client'
import { ModalProps } from '../types'
import { FailurePopup } from '../shared/FailurePopup'
import { useEvent } from '@/hooks/student/useEventManagement'
import { formatDate } from '@/lib/date'
import { AuthError } from '@/lib/api/client'

// Read-only view of one event, loaded from GET /students/events/{eventGuid}
// (get-event-by-guid.md). Shares the Announcement view's layout classes.
interface EventViewModalProps extends ModalProps {
  eventGuid: string | null
  // Shown only when the page allows editing; opens the Edit modal.
  onEdit?: (guid: string) => void
}

// eventDate is a UTC midnight datetime; compare its calendar day to today's.
function isUpcoming(eventDate: string): boolean {
  const today = new Date()
  const ymd = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  return eventDate.slice(0, 10) >= ymd
}

export function EventViewModal({ isOpen, onClose, eventGuid, onEdit }: EventViewModalProps) {
  const { data: e, isLoading, isError, error } = useEvent(eventGuid, isOpen)

  if (!isOpen) return null

  if (isError) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <FailurePopup
            title="Couldn't Load Event"
            subtitle={error instanceof AuthError && error.message ? error.message : 'Failed to load the event.'}
            onClose={onClose}
          />
        </div>
      </div>
    )
  }

  const upcoming = e?.eventDate ? isUpcoming(e.eventDate) : false

  return (
    <div className="modal-overlay open" id="view-event-modal">
      <div className="modal modal-lg modal-flex ann-view" role="dialog" aria-modal="true" aria-labelledby="event-view-title" onClick={ev => ev.stopPropagation()}>
        <div className="modal-hdr modal-hdr-blue">
          <div className="modal-title" id="event-view-title"><i className="lni lni-calendar"></i> Event</div>
          <button className="modal-close" onClick={onClose} aria-label="Close"><i className="lni lni-close"></i></button>
        </div>

        <div className="modal-scroll">
          {isLoading || !e ? (
            <div className="ann-view-loading">Loading event…</div>
          ) : (
            <>
              <h2 className="ann-view-subject">{e.subject || 'Untitled event'}</h2>
              <dl className="ann-view-meta">
                <div>
                  <dt>Event Date</dt>
                  <dd>
                    {formatDate(e.eventDate)}
                    {e.eventDate && (
                      <span className={`badge ${upcoming ? 'badge-green' : 'badge-grey'} ann-view-state`}>
                        {upcoming ? 'Upcoming' : 'Past'}
                      </span>
                    )}
                  </dd>
                </div>
              </dl>

              {/* Plain text from a textarea — keep the author's line breaks. */}
              <div className="ann-view-body" style={{ whiteSpace: 'pre-wrap' }}>
                {e.eventBody?.trim() ? e.eventBody : <p className="text-muted">No description.</p>}
              </div>
            </>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-neu" onClick={onClose}>Close</button>
          {onEdit && e && (
            <button className="btn btn-primary" onClick={() => onEdit(e.eventGuid)}>
              <i className="lni lni-pencil"></i> Edit
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
