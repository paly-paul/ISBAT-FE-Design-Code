'use client'
import { ModalProps } from '../types'
import { useRepetitionTag } from '@/hooks/academic/useRepetitionTags'
import { useProgramLevels } from '@/hooks/academic/useProgramLevels'
import { AuthError } from '@/lib/api/client'
import { FailurePopup } from './FailurePopup'

interface ViewRepTagModalProps extends ModalProps {
  courseUnitRepetitionGuid: string | null
}

export function ViewRepTagModal({ isOpen, onClose, courseUnitRepetitionGuid }: ViewRepTagModalProps) {
  const { data: tag, isLoading, isError, error } = useRepetitionTag(courseUnitRepetitionGuid, isOpen)
  const { data: programLevels = [] } = useProgramLevels()

  if (!isOpen) return null

  if (isError) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <FailurePopup
            title="Couldn't Load Repetition Tag"
            subtitle={error instanceof AuthError ? (error.message || 'Failed to load details.') : 'Failed to load details.'}
            onClose={onClose}
          />
        </div>
      </div>
    )
  }

  if (isLoading || !tag) {
    return (
      <div className="modal-overlay open">
        <div className="modal modal-md" onClick={e => e.stopPropagation()}>
          <div className="modal-hdr">
            <div className="modal-title"><i className="lni lni-eye"></i> View Repetition Tag</div>
            <button className="modal-close" onClick={onClose}><i className="lni lni-close"></i></button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 180 }}>
            <span style={{ color: 'var(--g400)' }}>Loading repetition tag details…</span>
          </div>
        </div>
      </div>
    )
  }

  const levelName = programLevels.find(p => p.levelCode === tag.levelCode)?.levelName || '—'

  return (
    <div className="modal-overlay open">
      <div className="modal modal-md" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr">
          <div className="modal-title"><i className="lni lni-eye"></i> View Repetition Tag — <span className="font-mono">{tag.tagCode}</span></div>
          <button className="modal-close" onClick={onClose}><i className="lni lni-close"></i></button>
        </div>
        <div className="g2">
          <div className="fg">
            <div className="lbl" style={{ color: 'var(--g500)', marginBottom: 4 }}>Repetition Tag Code</div>
            <div className="ctrl font-mono uppercase" style={{ display: 'flex', alignItems: 'center', background: 'var(--g50)', color: 'var(--g900)', fontWeight: 500, minHeight: 34, fontSize: 13.5, border: '1.5px solid var(--g200)', borderRadius: 'var(--rxs)' }}>
              {tag.tagCode}
            </div>
          </div>
          <div className="fg">
            <div className="lbl" style={{ color: 'var(--g500)', marginBottom: 4 }}>Programme Level</div>
            <div className="ctrl" style={{ display: 'flex', alignItems: 'center', background: 'var(--g50)', color: 'var(--g900)', fontWeight: 500, minHeight: 34, fontSize: 13.5, border: '1.5px solid var(--g200)', borderRadius: 'var(--rxs)' }}>
              {levelName}
            </div>
          </div>
          <div className="fg span2">
            <div className="lbl" style={{ color: 'var(--g500)', marginBottom: 4 }}>Description</div>
            <div className="ctrl" style={{ display: 'flex', alignItems: 'center', background: 'var(--g50)', color: 'var(--g900)', fontWeight: 500, minHeight: 34, fontSize: 13.5, border: '1.5px solid var(--g200)', borderRadius: 'var(--rxs)' }}>
              {tag.tagName}
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <span className="flex-1"></span>
          <button className="btn btn-primary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
