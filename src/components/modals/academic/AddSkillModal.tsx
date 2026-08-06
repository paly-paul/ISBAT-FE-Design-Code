'use client'
import { useState } from 'react'
import { ModalProps } from '../types'
import { SuccessPopup } from './SuccessPopup'
import { FailurePopup } from './FailurePopup'
import { SearchSelect } from '@/components/SearchSelect'
import { useEmployees } from '@/hooks/employee/useEmployees'
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
  const [saved, setSaved]           = useState(false)
  const [failure, setFailure]       = useState<string | null>(null)
  const [employeeGuid, setEmployeeGuid] = useState('')
  const [skillName, setSkillName]   = useState('')
  const [proficiency, setProficiency] = useState('1')
  const [approved, setApproved]     = useState(true)
  const [errors, setErrors]         = useState<Record<string, string>>({})

  if (!isOpen) return null

  const employeeOptions = employees.map(e => ({ value: e.employeeGuid, label: `${e.empName} (${e.shortCode})` }))

  function handleClose() {
    setSaved(false); setFailure(null)
    setEmployeeGuid(''); setSkillName(''); setProficiency('1'); setApproved(true); setErrors({})
    onClose()
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!employeeGuid) e.employeeGuid = 'Faculty member is required'
    if (!skillName.trim()) e.skillName = 'Skill / subject area is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  if (saved) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <SuccessPopup title="Skill Saved!" subtitle="The skill has been added to the lecturer's profile." onClose={handleClose} />
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

        <div className="sec-divider">Skill / Subject Area</div>
        <div className="g2 mb-3">
          <div className="fg span2">
            <div className="lbl">Skill Name <span className="req">*</span></div>
            <input
              className="ctrl" type="text" placeholder="e.g. Data Structures"
              value={skillName}
              onChange={e => { setSkillName(e.target.value); if (errors.skillName) setErrors(p => ({ ...p, skillName: '' })) }}
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
          <span>Mark as Approved (skip Pending review)</span>
        </label>

        <div className="modal-footer">
          <button className="btn btn-neu" onClick={handleClose}>Cancel</button>
          <button
            className="btn btn-primary"
            disabled={createSkill.isPending}
            onClick={() => {
              if (!validate()) return
              createSkill.mutate(
                { employeeGuid, skillName: skillName.trim(), proficiency: Number(proficiency), approved: approved ? 1 : 0 },
                {
                  onSuccess: () => { setSaved(true); showToast('Skill added successfully') },
                  onError: (error: Error) => setFailure(error.message || 'Failed to add skill. Please try again.'),
                },
              )
            }}
          >
            <i className="lni lni-checkmark"></i> {createSkill.isPending ? 'Saving…' : 'Save Skill'}
          </button>
        </div>
      </div>
    </div>
  )
}
