'use client'
import { useEffect, useState } from 'react'
import { ModalProps } from '../types'
import { SuccessPopup } from './SuccessPopup'
import { FailurePopup } from './FailurePopup'
import { SearchSelect } from '@/components/SearchSelect'
import { useEmployees } from '@/hooks/employee/useEmployees'
import { useLecturerSkill } from '@/hooks/academic/useLecturerSkills'
import { CreateLecturerSkillInput } from '@/lib/api/users/skills'
import { AuthError } from '@/lib/api/client'

const PROFICIENCY_OPTIONS = [
  { value: '1', label: 'Familiar' },
  { value: '2', label: 'Proficient' },
  { value: '3', label: 'Expert' },
]

interface ViewLecturerSkillModalProps extends ModalProps {
  lecturerSkillGuid: string | null
}

export function ViewLecturerSkillModal({ isOpen, onClose, showToast, lecturerSkillGuid }: ViewLecturerSkillModalProps) {
  const { data: skill, isLoading, isError, error } = useLecturerSkill(lecturerSkillGuid, isOpen)
  const { data: employees = [] } = useEmployees()

  const [activeSection, setActiveSection] = useState<'details'>('details')
  const [employeeGuid, setEmployeeGuid] = useState('')
  const [skillName, setSkillName] = useState('')
  const [proficiency, setProficiency] = useState('1')
  const [approved, setApproved] = useState(true)

  useEffect(() => {
    if (!isOpen || !skill) return
    setEmployeeGuid('')
    setSkillName(skill.skillName)
    setProficiency(String(skill.proficiency || 1))
    setApproved(skill.approvalStatus === 'Approved')
  }, [isOpen, skill])

  if (!isOpen) return null

  const employeeOptions = employees.map(e => ({ value: e.employeeGuid, label: `${e.empName} (${e.shortCode})` }))

  function handleClose() {
    onClose()
  }

  if (isError) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <FailurePopup
            title="Couldn't Load Skill"
            subtitle={error instanceof AuthError ? (error.message || 'Failed to load skill details.') : 'Failed to load skill details.'}
            onClose={handleClose}
          />
        </div>
      </div>
    )
  }

  if (isLoading || !skill) {
    return (
      <div className="modal-overlay open" id="view-lecturer-skill-modal">
        <div className="modal modal-md modal-flex" onClick={e => e.stopPropagation()}>
          <div className="modal-hdr">
            <div className="modal-title"><i className="lni lni-eye"></i> View Skill</div>
            <button className="modal-close" onClick={handleClose}><i className="lni lni-close"></i></button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 180 }}>
            <span style={{ color: 'var(--g400)' }}>Loading skill details…</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay open" id="view-lecturer-skill-modal">
      <div className="modal modal-80 modal-flex" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr">
          <div className="modal-title"><i className="lni lni-eye"></i> View Skill</div>
          <button className="modal-close" onClick={handleClose}><i className="lni lni-close"></i></button>
        </div>

        <div className="fsm-layout" style={{ borderTop: '1px solid var(--g200)' }}>
          {/* Left sidebar */}
          <div className="fsm-sidebar">
            <div style={{ padding: '14px 14px 6px', fontSize: 10.5, fontWeight: 700, color: 'var(--g400)', textTransform: 'uppercase', letterSpacing: '.07em' }}>
              Skill Information
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
                    <div style={{ fontSize: 11.5, color: 'var(--g400)' }}>Lecturer skill assignment</div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', columnGap: '24px', rowGap: '20px' }}>
                  <div style={{ gridColumn: 'span 2' }}>
                    <div style={{ fontSize: '11.5px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--g500)', letterSpacing: '0.04em', marginBottom: '4px' }}>Faculty Member</div>
                    <div style={{ fontSize: '14px', color: 'var(--g900)', fontWeight: 500 }}>
                      {skill.intEmployee ? `Employee #${skill.intEmployee}` : '—'}
                    </div>
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <div style={{ fontSize: '11.5px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--g500)', letterSpacing: '0.04em', marginBottom: '4px' }}>Skill Name</div>
                    <div style={{ fontSize: '14px', color: 'var(--g900)', fontWeight: 500 }}>
                      {skillName || '—'}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11.5px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--g500)', letterSpacing: '0.04em', marginBottom: '4px' }}>Proficiency</div>
                    <div style={{ fontSize: '14px', color: 'var(--g900)', fontWeight: 500 }}>
                      {PROFICIENCY_OPTIONS.find(p => p.value === proficiency)?.label || '—'}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11.5px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--g500)', letterSpacing: '0.04em', marginBottom: '4px' }}>Status</div>
                    <div>
                      {approved ? <span className="badge badge-green">Approved</span> : <span className="badge badge-neu">Not Approved</span>}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="modal-footer" style={{ borderTop: '1px solid var(--g200)' }}>
          <span className="flex-1"></span>
          <button className="btn btn-primary" onClick={handleClose}>Close</button>
        </div>
      </div>
    </div>
  )
}
