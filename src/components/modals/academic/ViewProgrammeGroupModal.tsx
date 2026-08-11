'use client'
import { ModalProps } from '../types'
import { useProgramGroup } from '@/hooks/academic/useProgramGroups'
import { useProgramLevels } from '@/hooks/academic/useProgramLevels'
import { AuthError } from '@/lib/api/client'
import { FailurePopup } from './FailurePopup'

interface ViewProgrammeGroupModalProps extends ModalProps {
  programGroupGuid: string | null
}

export function ViewProgrammeGroupModal({ isOpen, onClose, programGroupGuid }: ViewProgrammeGroupModalProps) {
  const { data: programGroup, isLoading, isError, error } = useProgramGroup(programGroupGuid, isOpen)
  const { data: programLevels = [] } = useProgramLevels()

  if (!isOpen) return null

  if (isError) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <FailurePopup
            title="Couldn't Load Programme Group"
            subtitle={error instanceof AuthError ? (error.message || 'Failed to load programme group details.') : 'Failed to load programme group details.'}
            onClose={onClose}
          />
        </div>
      </div>
    )
  }

  if (isLoading || !programGroup) {
    return (
      <div className="modal-overlay open" id="view-proggroup-modal">
        <div className="modal modal-md" onClick={e => e.stopPropagation()}>
          <div className="modal-hdr modal-hdr-blue">
            <div className="modal-title"><i className="lni lni-eye"></i> View Programme Group</div>
            <button className="modal-close" onClick={onClose}><i className="lni lni-close"></i></button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 180 }}>
            <span style={{ color: 'var(--g400)' }}>Loading programme group details…</span>
          </div>
        </div>
      </div>
    )
  }

  const levelName = programLevels.find(l => l.programLevelGuid === programGroup.programLevelGuid)?.levelName || '—'

  return (
    <div className="modal-overlay open" id="view-proggroup-modal">
      <div className="modal modal-md" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr modal-hdr-blue">
          <div className="modal-title"><i className="lni lni-eye"></i> View Programme Group — <span className="font-mono">{programGroup.groupCode}</span></div>
          <button className="modal-close" onClick={onClose}><i className="lni lni-close"></i></button>
        </div>
        <div className="g2">
          <div className="fg">
            <div className="lbl" style={{ color: 'var(--g500)', marginBottom: 4 }}>Group Code</div>
            <div className="ctrl font-mono uppercase" style={{ display: 'flex', alignItems: 'center', background: 'var(--g50)', color: 'var(--g900)', fontWeight: 500, minHeight: 34, fontSize: 13.5, border: '1.5px solid var(--g200)', borderRadius: 'var(--rxs)' }}>
              {programGroup.groupCode}
            </div>
          </div>
          <div className="fg">
            <div className="lbl" style={{ color: 'var(--g500)', marginBottom: 4 }}>Group Name</div>
            <div className="ctrl" style={{ display: 'flex', alignItems: 'center', background: 'var(--g50)', color: 'var(--g900)', fontWeight: 500, minHeight: 34, fontSize: 13.5, border: '1.5px solid var(--g200)', borderRadius: 'var(--rxs)' }}>
              {programGroup.groupName}
            </div>
          </div>
          <div className="fg span2">
            <div className="lbl" style={{ color: 'var(--g500)', marginBottom: 4 }}>Programme Level</div>
            <div className="ctrl" style={{ display: 'flex', alignItems: 'center', background: 'var(--g50)', color: 'var(--g900)', fontWeight: 500, minHeight: 34, fontSize: 13.5, border: '1.5px solid var(--g200)', borderRadius: 'var(--rxs)' }}>
              {levelName}
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
