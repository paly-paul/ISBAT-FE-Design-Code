'use client'
import { useState } from 'react'
import { ModalProps } from './types'
import { SuccessPopup } from './SuccessPopup'
import { SearchSelect } from '@/components/SearchSelect'

const ALL_LECTURERS = [
  'Dr. Ssekibuule Ronald (FCT)',
  'Ms. Namutebi Joyce (FCT)',
  'Dr. Kibira Moses (FCT)',
  'Prof. Mukasa Charles (FBM)',
  'Ms. Atim Grace (FBM)',
]

interface AddSkillModalProps extends ModalProps {
  role?: 'lecturer' | 'dean'
  currentUser?: { name: string; faculty: string }
}

export function AddSkillModal({ isOpen, onClose, showToast, role = 'lecturer', currentUser }: AddSkillModalProps) {
  const [saved, setSaved] = useState(false)

  if (!isOpen) return null

  const isLecturer = role === 'lecturer'
  const isDean     = role === 'dean'

  function handleClose() { setSaved(false); onClose() }

  if (saved) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <SuccessPopup
            title="Skills Saved!"
            subtitle={isDean ? 'Skills saved and automatically approved.' : 'Skills submitted and pending Dean approval.'}
            onClose={handleClose}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay open" id="add-skill-modal">
      <div className="modal modal-md" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr">
          <div className="modal-title"><i className="lni lni-bulb"></i> Add / Update Skills</div>
          <button className="modal-close" onClick={onClose}><i className="lni lni-close"></i></button>
        </div>

        {/* Role context banner */}
        {isLecturer && (
          <div className="info-box mb-3" style={{ background: 'var(--b50)', borderColor: 'var(--b200)' }}>
            <i className="lni lni-user" style={{ color: 'var(--b500)' }}></i>
            <span>Adding skills as <strong>{currentUser?.name}</strong>. Skills will be submitted as <strong>Pending</strong> until approved by your Dean.</span>
          </div>
        )}
        {isDean && (
          <div className="info-box mb-3" style={{ background: 'var(--green-bg)', borderColor: 'var(--green-bd)' }}>
            <i className="lni lni-checkmark" style={{ color: 'var(--green)' }}></i>
            <span>Adding skills as <strong>Dean</strong>. Skills added on behalf of a lecturer are automatically set to <strong>Approved</strong>.</span>
          </div>
        )}

        {/* Faculty Member field */}
        <div className="fg mb-3">
          <div className="lbl">Faculty Member <span className="req">*</span></div>
          {isLecturer ? (
            <input
              className="ctrl"
              type="text"
              value={`${currentUser?.name} (${currentUser?.faculty})`}
              disabled
              style={{ background: 'var(--g100)', color: 'var(--g500)', cursor: 'not-allowed' }}
            />
          ) : (
            <SearchSelect
              placeholder="— Select lecturer —"
              options={ALL_LECTURERS}
            />
          )}
          {isLecturer && (
            <div className="hint" style={{ marginTop: 4, fontSize: 11.5, color: 'var(--g400)' }}>
              Locked to your account — you can only submit skills for yourself.
            </div>
          )}
        </div>

        <div className="sec-divider">Subject Expertise Areas</div>
        <div className="flex flex-col gap-2 mb-[10px]">
          <div className="flex gap-2 items-center">
            <input className="ctrl flex-1" type="text" placeholder="Skill / Subject area (e.g. Data Structures)" />
            <SearchSelect options={['Expert', 'Proficient', 'Familiar']} style={{ width: 130, flexShrink: 0 }} />
            <button className="btn btn-danger btn-sm" style={{ flexShrink: 0, width: 36, padding: '0 0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i className="lni lni-trash-can"></i></button>
          </div>
        </div>
        <button className="btn btn-neu btn-sm mb-3"><i className="lni lni-plus"></i> Add Skill Row</button>

        {/* Approval status preview */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
          background: isDean ? 'var(--green-bg)' : 'var(--gold-bg)',
          border: `1px solid ${isDean ? 'var(--green-bd)' : 'var(--gold-bd)'}`,
          borderRadius: 'var(--rxs)', fontSize: 12, marginBottom: 14,
        }}>
          <i className={`lni ${isDean ? 'lni-checkmark' : 'lni-timer'}`}
             style={{ color: isDean ? 'var(--green)' : 'var(--gold)' }}></i>
          <span style={{ color: 'var(--g600)' }}>
            {isDean
              ? 'These skills will be saved as Approved immediately.'
              : 'These skills will be saved as Pending — awaiting Dean approval.'}
          </span>
        </div>

        <div className="modal-footer">
          <button className="btn btn-neu" onClick={handleClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => setSaved(true)}>
            <i className="lni lni-checkmark"></i> Save Skills
          </button>
        </div>
      </div>
    </div>
  )
}
