'use client'
import { useState } from 'react'
import { ModalProps } from '../types'
import { SuccessPopup } from './SuccessPopup'
import { SkillInput } from '@/lib/api/academic/skill'

interface NewSkillModalProps extends ModalProps {
  createSkill: {
    mutate: (input: SkillInput, options?: { onSuccess?: () => void }) => void
    isPending: boolean
  }
}

export function NewSkillModal({ isOpen, onClose, showToast, createSkill }: NewSkillModalProps) {
  const [saved, setSaved]           = useState(false)
  const [skillName, setSkillName]   = useState('')
  const [errors, setErrors]         = useState<Record<string, string>>({})

  if (!isOpen) return null

  function handleClose() { setSaved(false); setSkillName(''); setErrors({}); onClose() }

  function validate() {
    const e: Record<string, string> = {}
    if (!skillName.trim()) e.skillName = 'Skill Name is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  if (saved) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <SuccessPopup title="Skill Added!" subtitle="The new skill has been saved successfully." onClose={handleClose} />
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay open" id="new-skill-modal" onClick={handleClose}>
      <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr">
          <div className="modal-title"><i className="lni lni-bulb"></i> Add Skill</div>
          <button className="modal-close" onClick={handleClose}><i className="lni lni-close"></i></button>
        </div>
        <div className="fg">
          <div className="lbl">Skill Name <span className="req">*</span></div>
          <input
            className="ctrl"
            type="text"
            placeholder="e.g. C#"
            value={skillName}
            onChange={e => { setSkillName(e.target.value); if (errors.skillName) setErrors(p => ({ ...p, skillName: '' })) }}
            style={errors.skillName ? { borderColor: 'var(--red)' } : undefined}
          />
          {errors.skillName && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.skillName}</p>}
        </div>
        <div className="modal-footer">
          <button className="btn btn-neu" onClick={handleClose}>Cancel</button>
          <button
            className="btn btn-primary"
            disabled={createSkill.isPending}
            onClick={() => {
              if (!validate()) return
              createSkill.mutate(
                { skillName },
                { onSuccess: () => { setSaved(true); showToast('Skill added successfully') } },
              )
            }}
          >
            <i className="lni lni-checkmark"></i> {createSkill.isPending ? 'Adding…' : 'Add Skill'}
          </button>
        </div>
      </div>
    </div>
  )
}
