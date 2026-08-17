'use client'
import { ModalProps } from '../types'
import { useCourseUnit } from '@/hooks/academic/useCourseUnits'
import { AuthError } from '@/lib/api/client'
import { FailurePopup } from './FailurePopup'

interface ViewCourseUnitModalProps extends ModalProps {
  courseUnitGuid: string | null
  onEdit?: () => void
  canEdit?: boolean
}

function Field({ label, value, mono, wide }: { label: string; value: React.ReactNode; mono?: boolean; wide?: boolean }) {
  return (
    <div style={{ gridColumn: wide ? '1 / -1' : undefined }}>
      <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--g500)', marginBottom: '4px' }}>{label}</div>
      <div className={mono ? 'font-mono' : undefined} style={{ fontSize: '14px', color: 'var(--g900)', fontWeight: 500 }}>{value}</div>
    </div>
  )
}

export function ViewCourseUnitModal({ isOpen, onClose, courseUnitGuid, onEdit, canEdit }: ViewCourseUnitModalProps) {
  const { data: courseUnit, isLoading, isError, error } = useCourseUnit(courseUnitGuid, isOpen)

  if (!isOpen) return null

  if (isError) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <FailurePopup
            title="Couldn't Load Course Unit"
            subtitle={error instanceof AuthError ? (error.message || 'Failed to load details.') : 'Failed to load details.'}
            onClose={onClose}
          />
        </div>
      </div>
    )
  }

  if (isLoading || !courseUnit) {
    return (
      <div className="modal-overlay open">
        <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
          <div className="modal-hdr modal-hdr-blue">
            <div className="modal-title"><i className="lni lni-eye"></i> View Course Unit</div>
            <button className="modal-close" onClick={onClose}><i className="lni lni-close"></i></button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 180 }}>
            <span style={{ color: 'var(--g400)' }}>Loading course unit details?</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay open">
      <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr modal-hdr-blue">
          <div className="modal-title"><i className="lni lni-eye"></i> View Course Unit &mdash; <span className="font-mono">{courseUnit.courseUnitCode}</span></div>
          <button className="modal-close" onClick={onClose}><i className="lni lni-close"></i></button>
        </div>

        <div className="modal-scroll" style={{ padding: '20px clamp(14px, 4vw, 22px)' }}>
          <div className="view-detail-grid">
            <Field label="Course Unit Code" value={courseUnit.courseUnitCode} mono />
            <Field label="Course Unit Name" value={courseUnit.courseUnitName} />
            <Field label="Maximum Credits" value={courseUnit.maxCredits} />
            
            <Field label="Repetition Tag" value={courseUnit.courseUnitRepetitionName || '—'} wide />

            <div style={{ gridColumn: '1 / -1', marginTop: 12, marginBottom: 8, fontSize: 13, fontWeight: 700, color: 'var(--b800)', borderBottom: '1px solid var(--b100)', paddingBottom: 6 }}>
              Exam Weighting
            </div>
            <Field label="Mid Term %" value={courseUnit.mid} />
            <Field label="Course Work %" value={courseUnit.cw} />
            <Field label="CBT %" value={courseUnit.ca} />

            {courseUnit.syllabus && (
              <>
                <div style={{ gridColumn: '1 / -1', marginTop: 12, marginBottom: 8, fontSize: 13, fontWeight: 700, color: 'var(--b800)', borderBottom: '1px solid var(--b100)', paddingBottom: 6 }}>
                  Syllabus
                </div>
                <Field label="Syllabus Details" value={<div style={{ whiteSpace: 'pre-wrap' }}>{courseUnit.syllabus}</div>} wide />
              </>
            )}

            {courseUnit.outlines && courseUnit.outlines.length > 0 && (
              <>
                <div style={{ gridColumn: '1 / -1', marginTop: 12, marginBottom: 8, fontSize: 13, fontWeight: 700, color: 'var(--b800)', borderBottom: '1px solid var(--b100)', paddingBottom: 6 }}>
                  Course Unit Outline ({courseUnit.chapterCount} Chapters)
                </div>
                <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {courseUnit.outlines.map((outline, idx) => (
                    <div key={outline.courseUnitOutlineGuid || idx} style={{ padding: '12px', background: 'var(--g50)', border: '1px solid var(--g200)', borderRadius: '6px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--g900)', marginBottom: '8px' }}>
                        Chapter {outline.chapter}: {outline.chapterName}
                      </div>
                      <div style={{ paddingLeft: '12px', borderLeft: '2px solid var(--b200)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {outline.topics && outline.topics.map((topic, tidx) => (
                          <div key={topic.courseUnitTopicGuid || tidx} style={{ fontSize: '12px', color: 'var(--g700)' }}>
                            <span style={{ fontWeight: 500, color: 'var(--g800)' }}>{topic.studySequence}.</span> {topic.courseUnitTopicDetails}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
        <div className="modal-footer" style={{ borderTop: '1px solid var(--g200)' }}>
          <span className="flex-1"></span>
          {canEdit && onEdit && (
            <button className="btn btn-neu" onClick={onEdit}>
              <i className="lni lni-pencil"></i> Edit
            </button>
          )}
          <button className="btn btn-primary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
