'use client'
import { useEffect, useState } from 'react'
import { ModalProps } from '../types'
import { SuccessPopup } from './SuccessPopup'
import { Skill, SkillInput } from '@/lib/api/academic/skill'

interface EditSkillModalProps extends ModalProps {
  skill: Skill | null
  updateSkill: {
    mutate: (variables: { id: string; input: SkillInput }, options?: { onSuccess?: () => void }) => void
    isPending: boolean
  }
}

export function EditSkillModal({ isOpen, onClose, showToast, skill, updateSkill }: EditSkillModalProps) {
  const [saved, setSaved] = useState(false)
  const [skillName, setSkillName] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (isOpen && skill) {
      setSkillName(skill.skillName)
      setErrors({})
    }
  }, [isOpen, skill])

  if (!isOpen || !skill) return null

  function handleClose() { setSaved(false); onClose() }

  function validate() {
    const e: Record<string, string> = {}
    if (!skillName.trim()) e.skillName = 'Skill Name is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit() {
    if (!skill || !validate()) return
    updateSkill.mutate(
      { id: skill.id, input: { skillName } },
      { onSuccess: () => { setSaved(true); showToast('Skill updated successfully') } },
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

  return (
    <div className="modal-overlay open" id="edit-skill-modal" onClick={handleClose}>
      <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr modal-hdr-blue">
          <div className="modal-title"><i className="lni lni-pencil"></i> Edit Skill</div>
          <button className="modal-close" onClick={handleClose}><i className="lni lni-close"></i></button>
        </div>
        <div className="fg">
          <div className="lbl">Skill Name <span className="req">*</span></div>
          <input
            className="ctrl"
            type="text"
            value={skillName}
            onChange={e => { setSkillName(e.target.value); if (errors.skillName) setErrors(p => ({ ...p, skillName: '' })) }}
            style={errors.skillName ? { borderColor: 'var(--red)' } : undefined}
          />
          {errors.skillName && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.skillName}</p>}
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
