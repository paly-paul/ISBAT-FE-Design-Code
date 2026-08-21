'use client'
import { useEffect, useState } from 'react'
import { ModalProps } from '../types'
import { SuccessPopup } from './SuccessPopup'
import { FailurePopup } from './FailurePopup'
import { SearchSelect } from '@/components/SearchSelect'
import { useEmployees } from '@/hooks/employee/useEmployees'
import { useSkillMasters } from '@/hooks/config/useSkillMaster'
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
  const { data: skillMasterData } = useSkillMasters()
  const skillMasters = skillMasterData?.items ?? []

  const [saved, setSaved]           = useState(false)
  const [failure, setFailure]       = useState<string | null>(null)
  const [employeeGuid, setEmployeeGuid] = useState('')
  // The real skill catalog guid — sent as the single entry in skillGuids.
  const [skillId, setSkillId]       = useState('')
  const [proficiency, setProficiency] = useState('1')
  const [errors, setErrors]         = useState<Record<string, string>>({})

  // GetByGuid now returns a real employeeGuid, so it prefills directly.
  // skillId still has to be resolved indirectly — GetByGuid returns
  // skillName, not skillGuid, so it's matched back against the master list.
  useEffect(() => {
    if (!isOpen || !skill) return
    setEmployeeGuid(skill.employeeGuid || '')
    const master = skillMasters.find(s => s.skillName === skill.skillName)
    setSkillId(master ? master.skillGuid : '')
    setProficiency(String(skill.proficiency || 1))
    setErrors({})
  }, [isOpen, skill, skillMasters])

  if (!isOpen) return null

  const employeeOptions = employees.map(e => ({ value: e.employeeGuid, label: `${e.empName} (${e.shortCode})` }))
  const skillOptions = skillMasters.map(s => ({ value: s.skillGuid, label: s.skillName }))

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
    if (!skillId) e.skillId = 'Skill / subject area is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit() {
    if (!lecturerSkillGuid || !validate()) return
    updateSkill.mutate(
      { guid: lecturerSkillGuid, input: { employeeGuid, skillGuids: [skillId], proficiency: Number(proficiency) } },
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
          <div className="modal-hdr modal-hdr-blue">
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
        <div className="modal-hdr modal-hdr-blue">
          <div className="modal-title"><i className="lni lni-pencil"></i> Edit Skill</div>
          <button className="modal-close" onClick={handleClose}><i className="lni lni-close"></i></button>
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
            <SearchSelect
              placeholder="— Select skill —"
              options={skillOptions}
              value={skillId}
              onChange={v => { setSkillId(v); clearError('skillId') }}
            />
            {errors.skillId && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.skillId}</p>}
          </div>
          <div className="fg">
            <div className="lbl">Proficiency</div>
            <SearchSelect options={PROFICIENCY_OPTIONS} value={proficiency} onChange={setProficiency} />
          </div>
        </div>

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
