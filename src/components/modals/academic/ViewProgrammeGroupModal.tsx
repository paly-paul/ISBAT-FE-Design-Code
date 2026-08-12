'use client'
import { useState } from 'react'
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
  const [activeSection, setActiveSection] = useState<'details'>('details')

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
        <div className="modal modal-80 modal-flex" onClick={e => e.stopPropagation()}>
          <div className="modal-hdr">
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
      <div className="modal modal-80 modal-flex" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr">
          <div className="modal-title"><i className="lni lni-eye"></i> View Programme Group — <span className="font-mono">{programGroup.groupCode}</span></div>
          <button className="modal-close" onClick={onClose}><i className="lni lni-close"></i></button>
        </div>

        <div className="fsm-layout" style={{ borderTop: '1px solid var(--g200)' }}>
          {/* Left sidebar */}
          <div className="fsm-sidebar">
            <div style={{ padding: '14px 14px 6px', fontSize: 10.5, fontWeight: 700, color: 'var(--g400)', textTransform: 'uppercase', letterSpacing: '.07em' }}>
              Group Information
            </div>
            <div style={{ padding: '0 8px', marginBottom: 12 }}>
              <div
                onClick={() => setActiveSection('details')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '9px 10px', borderRadius: 'var(--rsm)', marginBottom: 2,
                  background: activeSection === 'details' ? 'var(--b500)' : 'transparent',
                  color: activeSection === 'details' ? '#fff' : 'var(--g700)',
                  cursor: 'pointer', transition: 'background .15s',
                }}
              >
                <div style={{ width: 30, height: 30, borderRadius: '50%', background: activeSection === 'details' ? 'rgba(255,255,255,.2)' : 'var(--b100)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <i className="lni lni-information" style={{ fontSize: 13, color: activeSection === 'details' ? '#fff' : 'var(--b600)' }}></i>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, lineHeight: 1.3 }}>Basic Details</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right main panel */}
          <div className="fsm-main modal-scroll" style={{ padding: '24px' }}>
            {activeSection === 'details' && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, padding: '12px 16px', background: 'var(--b50)', borderRadius: 'var(--rsm)', border: '1.5px solid var(--b100)' }}>
                  <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--b100)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <i className="lni lni-information" style={{ color: 'var(--b600)', fontSize: 17 }}></i>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--b800)' }}>Basic Details</div>
                    <div style={{ fontSize: 11.5, color: 'var(--g400)' }}>General information about this programme group</div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', columnGap: '24px', rowGap: '20px' }}>
                  <div>
                    <div style={{ fontSize: '11.5px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--g500)', letterSpacing: '0.04em', marginBottom: '4px' }}>Group Code</div>
                    <div style={{ fontSize: '14px', color: 'var(--g900)', fontWeight: 500, fontFamily: 'var(--font-mono)' }}>
                      {programGroup.groupCode}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11.5px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--g500)', letterSpacing: '0.04em', marginBottom: '4px' }}>Group Name</div>
                    <div style={{ fontSize: '14px', color: 'var(--g900)', fontWeight: 500 }}>
                      {programGroup.groupName}
                    </div>
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <div style={{ fontSize: '11.5px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--g500)', letterSpacing: '0.04em', marginBottom: '4px' }}>Programme Level</div>
                    <div style={{ fontSize: '14px', color: 'var(--g900)', fontWeight: 500 }}>
                      {levelName}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="modal-footer" style={{ borderTop: '1px solid var(--g200)' }}>
          <span className="flex-1"></span>
          <button className="btn btn-primary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
