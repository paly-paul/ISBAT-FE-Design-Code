'use client'
import { useEffect, useState } from 'react'
import { ModalProps } from '../types'
import { SuccessPopup } from './SuccessPopup'
import { FailurePopup } from './FailurePopup'
import { SkillMaster, SkillMasterInput } from '@/lib/api/academic/skillMaster'

interface EditSkillModalProps extends ModalProps {
  skill: SkillMaster | null
  updateSkill: {
    mutate: (variables: { intSkill: number; input: SkillMasterInput }, options?: { onSuccess?: () => void; onError?: (error: Error) => void }) => void
    isPending: boolean
  }
}

// No GetByGuid/GetById endpoint was given for this resource — same
// row-passed exception receiptBook.ts's EditReceiptBookModal uses: seeded
// straight from the already-loaded row instead of a fetch-by-guid.
export function EditSkillModal({ isOpen, onClose, showToast, skill, updateSkill }: EditSkillModalProps) {
  const [saved, setSaved]     = useState(false)
  const [failure, setFailure] = useState<string | null>(null)
  const [skillName, setSkillName] = useState('')
  const [errors, setErrors]   = useState<Record<string, string>>({})

  useEffect(() => {
    if (isOpen && skill) {
      setSkillName(skill.skillName)
      setErrors({})
    }
  }, [isOpen, skill])

  if (!isOpen || !skill) return null

  function handleClose() { setSaved(false); setFailure(null); onClose() }

  function validate() {
    const e: Record<string, string> = {}
    if (!skillName.trim()) e.skillName = 'Skill Name is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit() {
    if (!skill || !validate()) return
    updateSkill.mutate(
      { intSkill: skill.intSkill, input: { skillName } },
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
