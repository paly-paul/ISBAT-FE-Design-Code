'use client'
import { AuthError } from '@/lib/api/client'
import { StudentTimelineEventDto } from '@/lib/api/student/student'
import { useStudentTimeline } from '@/hooks/student/useStudents'
import { formatDate } from '@/lib/date'

// Student Profile's Timeline tab — GET /students/{guid}/timeline
// (get-student-timeline.md). Rendered only while the tab is open, so the
// request goes out on first view rather than with the page. Events stay in
// the API's oldest-first order, under a summary of joining and the current record.
// Styles are the .sp-tl block in globals.css.

type FactKey = 'programme' | 'semester' | 'batch' | 'academicIntake' | 'feeStructure'

const FACTS: { key: FactKey; label: string }[] = [
  { key: 'programme', label: 'Programme' },
  { key: 'semester', label: 'Semester' },
  { key: 'batch', label: 'Batch' },
  { key: 'academicIntake', label: 'Academic Intake' },
  { key: 'feeStructure', label: 'Fee Structure' },
]

// A null either side means the name didn't resolve, not that the student moved.
function previousValue(event: StudentTimelineEventDto, previous: StudentTimelineEventDto | undefined, key: FactKey) {
  const before = previous?.[key]
  return before != null && event[key] != null && event[key] !== before ? before : null
}

function timelineErrorMessage(err: unknown) {
  if (err instanceof AuthError && err.code === 'forbidden') return 'You don’t have permission to view this student’s timeline.'
  if (err instanceof AuthError && err.code === 'not_found') return 'This student’s record couldn’t be found.'
  // An error with no readable body leaves AuthError's message as its bare
  // code ("unknown"), which means nothing to the person reading it.
  const readable = err instanceof Error && err.message && !(err instanceof AuthError && err.message === err.code)
  return readable ? (err as Error).message : 'The server couldn’t return this student’s timeline. Please try again, or contact support if it keeps happening.'
}

export function StudentTimeline({ studentGuid }: { studentGuid: string }) {
  const { data, isLoading, isError, error, refetch, isFetching } = useStudentTimeline(studentGuid)

  if (isLoading) {
    return (
      <div className="card mp-panel">
        <div className="rpt-empty">
          <i className="lni lni-spinner-arrow spin" aria-hidden="true" />
          <div className="rpt-empty-title">Loading timeline…</div>
        </div>
      </div>
    )
  }

  if (isError || !data) {
    const canRetry = !(error instanceof AuthError && (error.code === 'forbidden' || error.code === 'not_found'))
    return (
      <div className="card mp-panel">
        <div className="rpt-empty">
          <i className="lni lni-warning" aria-hidden="true" style={{ color: 'var(--red)' }} />
          <div className="rpt-empty-title">Couldn’t load the timeline</div>
          <div style={{ fontSize: 13, marginBottom: canRetry ? 14 : 0 }}>{timelineErrorMessage(error)}</div>
          {canRetry && (
            <button className="btn btn-neu btn-sm" onClick={() => refetch()} disabled={isFetching}>
              <i className="lni lni-reload" aria-hidden="true" /> Try again
            </button>
          )}
        </div>
      </div>
    )
  }

  const { joinedDate, joinedIntake, events } = data
  const current = events.findLast(e => e.isActive)

  return (
    <div className="card mp-panel">
      <div className="card-hdr">
        <div>
          <div className="card-title"><i className="lni lni-calendar"></i> Student Timeline</div>
          <div className="card-sub">Read-only · from joining to the latest record</div>
        </div>
      </div>

      <dl className="sp-tl-summary">
        <div className="sp-tl-stat"><dt>Joined</dt><dd>{joinedDate ? formatDate(joinedDate) : 'Not recorded'}</dd></div>
        <div className="sp-tl-stat"><dt>Joined Intake</dt><dd>{joinedIntake || '—'}</dd></div>
        <div className="sp-tl-stat"><dt>Current Semester</dt><dd>{current?.semester || '—'}</dd></div>
        <div className="sp-tl-stat"><dt>History Records</dt><dd>{events.length}</dd></div>
      </dl>

      {events.length === 0 ? (
        <p className="mp-note sp-note"><i className="lni lni-information" aria-hidden="true"></i> No history has been recorded for this student since joining.</p>
      ) : (
        <ol className="sp-tl">
          {events.map((event, i) => (
            <li key={`${event.eventDate}-${i}`} className={`sp-tl-item${event.isActive ? ' is-current' : ''}`}>
              <time className="sp-tl-date" dateTime={event.eventDate ?? undefined}>{event.eventDate ? formatDate(event.eventDate) : 'No date'}</time>
              <span className="sp-tl-node" aria-hidden="true"></span>
              <div className="sp-tl-body">
                <div className="sp-tl-head">
                  <span className="sp-tl-title">{event.remarks || event.semester || 'Record updated'}</span>
                  {event.isActive && <span className="badge badge-green">Current</span>}
                </div>
                <dl className="sp-tl-facts">
                  {FACTS.map(f => {
                    const was = previousValue(event, events[i - 1], f.key)
                    return (
                      <div key={f.key} className={`sp-tl-fact${was ? ' is-changed' : ''}`}>
                        <dt>{f.label}</dt>
                        <dd>{event[f.key] || '—'}</dd>
                        {was && <dd className="sp-tl-was">was {was}</dd>}
                      </div>
                    )
                  })}
                </dl>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
