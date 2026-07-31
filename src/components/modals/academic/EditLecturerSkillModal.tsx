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

interface EditLecturerSkillModalProps extends ModalProps {
  lecturerSkillGuid: string | null
  updateSkill: {
    mutate: (variables: { guid: string; input: CreateLecturerSkillInput }, options?: { onSuccess?: () => void; onError?: (error: Error) => void }) => void
    isPending: boolean
  }
}

export function EditLecturerSkillModal({ isOpen, onClose, showToast, lecturerSkillGuid, updateSkill }: EditLecturerSkillModalProps) {
  const { data: skill, isLoading, isError, error } = useLecturerSkill(lecturerSkillGuid, isOpen)
  const { data: employees = [] } = useEmployees()

  const [saved, setSaved]           = useState(false)
  const [failure, setFailure]       = useState<string | null>(null)
  const [employeeGuid, setEmployeeGuid] = useState('')
  const [skillName, setSkillName]   = useState('')
  const [proficiency, setProficiency] = useState('1')
  const [approved, setApproved]     = useState(true)
  const [errors, setErrors]         = useState<Record<string, string>>({})

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
    setErrors({})
  }, [isOpen, skill])

  if (!isOpen) return null

  const employeeOptions = employees.map(e => ({ value: e.employeeGuid, label: `${e.empName} (${e.shortCode})` }))

  function handleClose() {
    setSaved(false); setFailure(null); setErrors({})
    onClose()
  }

  function clearError(field: string) {
    setErrors(prev => (prev[field] ? { ...prev, [field]: '' } : prev))
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!employeeGuid) e.employeeGuid = 'Faculty member is required'
    if (!skillName.trim()) e.skillName = 'Skill / subject area is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit() {
    if (!lecturerSkillGuid || !validate()) return
    updateSkill.mutate(
      { guid: lecturerSkillGuid, input: { employeeGuid, skillName: skillName.trim(), proficiency: Number(proficiency), approved: approved ? 1 : 0 } },
      {
        onSuccess: () => { setSaved(true); showToast('Skill updated successfully') },
        onError: (error: Error) => setFailure(error.message || 'Failed to update skill. Please try again.'),
      },
    )
  }

  if (saved) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <SuccessPopup title="Skill Updated!" subtitle="Your changes have been saved successfully." onClose={handleClose} />
        </div>
      </div>
    )
  }

  if (failure) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <FailurePopup title="Couldn't Update Skill" subtitle={failure} onClose={() => setFailure(null)} />
        </div>
      </div>
    )
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
      <div className="modal-overlay open" id="edit-lecturer-skill-modal">
        <div className="modal modal-md" onClick={e => e.stopPropagation()}>
          <div className="modal-hdr">
            <div className="modal-title"><i className="lni lni-pencil"></i> Edit Skill</div>
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
    <div className="modal-overlay open" id="edit-lecturer-skill-modal">
      <div className="modal modal-md" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr">
          <div className="modal-title"><i className="lni lni-pencil"></i> Edit Skill</div>
          <button className="modal-close" onClick={handleClose}><i className="lni lni-close"></i></button>
        </div>

        <div className="warn-box mb-3">
          <i className="lni lni-warning"></i>
          <span>This record was logged for <strong>Employee #{skill.intEmployee}</strong>, but the API has no way to resolve that back to a selectable employee — please reselect the faculty member below before saving.</span>
        </div>

        <div className="fg mb-3">
          <div className="lbl">Faculty Member <span className="req">*</span></div>
          <SearchSelect
            placeholder="— Select faculty member —"
            options={employeeOptions}
            value={employeeGuid}
            onChange={v => { setEmployeeGuid(v); clearError('employeeGuid') }}
          />
          {errors.employeeGuid && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.employeeGuid}</p>}
        </div>

        <div className="sec-divider">Skill / Subject Area</div>
        <div className="g2 mb-3">
          <div className="fg span2">
            <div className="lbl">Skill Name <span className="req">*</span></div>
            <input
              className="ctrl" type="text" placeholder="e.g. Data Structures"
              value={skillName}
              onChange={e => { setSkillName(e.target.value); clearError('skillName') }}
              style={errors.skillName ? { borderColor: 'var(--red)' } : undefined}
            />
            {errors.skillName && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.skillName}</p>}
          </div>
          <div className="fg">
            <div className="lbl">Proficiency</div>
            <SearchSelect options={PROFICIENCY_OPTIONS} value={proficiency} onChange={setProficiency} />
          </div>
        </div>

        <label className="flex items-center gap-[7px] cursor-pointer mb-3" style={{ fontSize: 13 }}>
          <input type="checkbox" checked={approved} onChange={e => setApproved(e.target.checked)} />
          <span>Approved</span>
        </label>

        <div className="modal-footer">
          <button className="btn btn-neu" onClick={handleClose}>Cancel</button>
          <button className="btn btn-primary" disabled={updateSkill.isPending} onClick={handleSubmit}>
            <i className="lni lni-checkmark"></i> {updateSkill.isPending ? 'Updating…' : 'Update Skill'}
          </button>
        </div>
      </div>
    </div>
  )
}
