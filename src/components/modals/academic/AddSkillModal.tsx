'use client'
import { useState } from 'react'
import { ModalProps } from '../types'
import { SuccessPopup } from './SuccessPopup'
import { FailurePopup } from './FailurePopup'
import { SearchSelect } from '@/components/SearchSelect'
import { MultiSelect } from '@/components/MultiSelect'
import { useEmployees } from '@/hooks/employee/useEmployees'
import { useSkillMasters } from '@/hooks/config/useSkillMaster'
import { CreateLecturerSkillInput } from '@/lib/api/users/skills'

// Ascending-competence reading of the wire's bare proficiency int (1/2/3
// seen in sample data) — not confirmed against a spec, see the gotcha note
// on LecturerSkill in lib/api/users/skills.ts.
const PROFICIENCY_OPTIONS = [
  { value: '1', label: 'Familiar' },
  { value: '2', label: 'Proficient' },
  { value: '3', label: 'Expert' },
]

interface AddSkillModalProps extends ModalProps {
  createSkill: {
    mutate: (input: CreateLecturerSkillInput, options?: { onSuccess?: () => void; onError?: (error: Error) => void }) => void
    isPending: boolean
  }
}

export function AddSkillModal({ isOpen, onClose, showToast, createSkill }: AddSkillModalProps) {
  const { data: employees = [] } = useEmployees()
  const { data: skillMasterData } = useSkillMasters()
  const skillMasters = skillMasterData?.items ?? []
  const [saved, setSaved]           = useState(false)
  const [failure, setFailure]       = useState<string | null>(null)
  const [employeeGuid, setEmployeeGuid] = useState('')
  const [skillIds, setSkillIds]     = useState<string[]>([])
  // One shared proficiency for the whole batch — confirmed real payload is
  // { employeeGuid, skillGuids, proficiency }, not a per-skill proficiency.
  const [proficiency, setProficiency] = useState('1')
  const [errors, setErrors]         = useState<Record<string, string>>({})

  if (!isOpen) return null

  const employeeOptions = employees.map(e => ({ value: e.employeeGuid, label: `${e.empName} (${e.shortCode})` }))
  const skillOptions = skillMasters.map(s => ({ value: s.skillGuid, label: s.skillName }))

  function handleClose() {
    setSaved(false); setFailure(null)
    setEmployeeGuid(''); setSkillIds([]); setProficiency('1'); setErrors({})
    onClose()
  }

  function handleSkillIdsChange(vals: string[]) {
    setSkillIds(vals)
    if (errors.skillIds) setErrors(p => ({ ...p, skillIds: '' }))
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!employeeGuid) e.employeeGuid = 'Faculty member is required'
    if (skillIds.length === 0) e.skillIds = 'At least one skill / subject area is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  if (saved) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <SuccessPopup title="Skill Saved!" subtitle="The skill(s) have been added to the lecturer's profile." onClose={handleClose} />
        </div>
      </div>
    )
  }

  if (failure) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <FailurePopup title="Couldn't Add Skill" subtitle={failure} onClose={() => setFailure(null)} />
        </div>
      </div>
    )
  }

  function handleSubmit() {
    if (!validate()) return
    createSkill.mutate(
      { employeeGuid, skillGuids: skillIds, proficiency: Number(proficiency) },
      {
        onSuccess: () => {
          setSaved(true)
          showToast(`${skillIds.length} skill${skillIds.length !== 1 ? 's' : ''} added successfully`)
        },
        onError: (error: Error) => setFailure(error.message || 'Failed to add skill(s). Please try again.'),
      },
    )
  }

  return (
    <div className="modal-overlay open" id="add-skill-modal">
      <div className="modal modal-md" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr modal-hdr-blue">
          <div className="modal-title"><i className="lni lni-bulb"></i> Add Skill</div>
          <button className="modal-close" onClick={handleClose}><i className="lni lni-close"></i></button>
        </div>

        <div className="fg mb-3">
          <div className="lbl">Faculty Member <span className="req">*</span></div>
          <SearchSelect
            placeholder="— Select faculty member —"
            options={employeeOptions}
            value={employeeGuid}
            onChange={v => { setEmployeeGuid(v); if (errors.employeeGuid) setErrors(p => ({ ...p, employeeGuid: '' })) }}
          />
          {errors.employeeGuid && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.employeeGuid}</p>}
        </div>

        <div className="sec-divider">Skills / Subject Areas</div>
        <div className="fg mb-3">
          <div className="lbl">Skills <span className="req">*</span></div>
          <MultiSelect
            placeholder="— Select skills —"
            options={skillOptions}
            value={skillIds}
            onChange={handleSkillIdsChange}
          />
          {errors.skillIds && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.skillIds}</p>}
        </div>

        {skillIds.length > 0 && (
          <div className="fg mb-3">
            <div className="lbl">Proficiency</div>
            <div style={{ fontSize: 12, color: 'var(--g400)', marginBottom: 6 }}>
              Applies to all {skillIds.length} selected skill{skillIds.length !== 1 ? 's' : ''}.
            </div>
            <SearchSelect
              style={{ width: 160 }}
              options={PROFICIENCY_OPTIONS}
              value={proficiency}
              onChange={setProficiency}
            />
          </div>
        )}

        <div className="modal-footer">
          <button className="btn btn-neu" onClick={handleClose}>Cancel</button>
          <button
            className="btn btn-primary"
            disabled={createSkill.isPending}
            onClick={handleSubmit}
          >
            <i className="lni lni-checkmark"></i> {createSkill.isPending ? 'Saving…' : 'Save Skill'}
          </button>
        </div>
      </div>
    </div>
  )
}
