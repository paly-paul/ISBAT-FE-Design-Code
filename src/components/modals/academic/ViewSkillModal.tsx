'use client'
import { useEffect, useState } from 'react'
import { ModalProps } from '../types'
import { SuccessPopup } from './SuccessPopup'
import { FailurePopup } from './FailurePopup'
import { SkillMaster, SkillMasterInput } from '@/lib/api/academic/skillMaster'

interface ViewSkillModalProps extends ModalProps {
  skill: SkillMaster | null
  onEdit: () => void
}

// No GetByGuid/GetById endpoint was given for this resource — same
// row-passed exception receiptBook.ts's EditReceiptBookModal uses: seeded
// straight from the already-loaded row instead of a fetch-by-guid.
export function ViewSkillModal({ isOpen, onClose, showToast, skill, onEdit }: ViewSkillModalProps) {
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
    <div className="modal-overlay open" id="view-skill-modal" onClick={handleClose}>
      <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr modal-hdr-blue">
          <div className="modal-title"><i className="lni lni-eye"></i> View Skill</div>
          <button className="modal-close" onClick={handleClose}><i className="lni lni-close"></i></button>
        </div>
        <div className="fg">
          <div className="lbl">Skill Name </div>
          <div className="val">{skillName || '—'}</div>
          {errors.skillName && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.skillName}</p>}
        </div>
        <div className="modal-footer">
          <span className="flex-1"></span>
          <button className="btn btn-neu" onClick={onEdit} style={{ marginRight: 8 }}>
            <i className="lni lni-pencil"></i> Edit
          </button>
          <button className="btn btn-primary" onClick={handleClose}>Close</button>
        </div>
      </div>
    </div>
  )
}
