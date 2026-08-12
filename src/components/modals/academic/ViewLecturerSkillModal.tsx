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

  const [employeeGuid, setEmployeeGuid] = useState('')
  const [skillName, setSkillName] = useState('')
  const [proficiency, setProficiency] = useState('1')
  const [approved, setApproved] = useState(true)

  // Prefill everything the response actually carries. employeeGuid is
  // deliberately left blank — GetByGuid only returns intEmployee, with no
  // guid to reverse it into, so whoever this skill belongs to must be
  // re-selected on every edit (same limitation as batch.ts's Stream field).
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
        <div className="modal modal-md" onClick={e => e.stopPropagation()}>
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
      <div className="modal modal-md" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr">
          <div className="modal-title"><i className="lni lni-eye"></i> View Skill</div>
          <button className="modal-close" onClick={handleClose}><i className="lni lni-close"></i></button>
        </div>

        <div className="fg mb-3">
          <div className="lbl" style={{ color: 'var(--g500)', marginBottom: 4 }}>Faculty Member</div>
          <div className="ctrl" style={{ display: 'flex', alignItems: 'center', background: 'var(--g50)', color: 'var(--g900)', fontWeight: 500, minHeight: 34, fontSize: 13.5, border: '1.5px solid var(--g200)', borderRadius: 'var(--rxs)' }}>
            {skill.intEmployee ? `Employee #${skill.intEmployee}` : '—'}
          </div>
        </div>

        <div className="sec-divider">Skill / Subject Area</div>
        <div className="g2 mb-3">
          <div className="fg span2">
            <div className="lbl" style={{ color: 'var(--g500)', marginBottom: 4 }}>Skill Name</div>
            <div className="ctrl" style={{ display: 'flex', alignItems: 'center', background: 'var(--g50)', color: 'var(--g900)', fontWeight: 500, minHeight: 34, fontSize: 13.5, border: '1.5px solid var(--g200)', borderRadius: 'var(--rxs)' }}>
              {skillName || '—'}
            </div>
          </div>
          <div className="fg">
            <div className="lbl" style={{ color: 'var(--g500)', marginBottom: 4 }}>Proficiency</div>
            <div className="ctrl" style={{ display: 'flex', alignItems: 'center', background: 'var(--g50)', color: 'var(--g900)', fontWeight: 500, minHeight: 34, fontSize: 13.5, border: '1.5px solid var(--g200)', borderRadius: 'var(--rxs)' }}>
              {PROFICIENCY_OPTIONS.find(p => p.value === proficiency)?.label || '—'}
            </div>
          </div>
        </div>

        <div className="fg mb-3">
          <div className="lbl" style={{ color: 'var(--g500)', marginBottom: 4 }}>Status</div>
          <div>
            {approved ? <span className="badge badge-green">Approved</span> : <span className="badge badge-neu">Not Approved</span>}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-primary" onClick={handleClose}>Close</button>
        </div>
      </div>
    </div>
  )
}
