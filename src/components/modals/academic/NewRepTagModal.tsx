'use client'
import { useState } from 'react'
import { ModalProps } from '../types'
import { SuccessPopup } from './SuccessPopup'
import { FailurePopup } from './FailurePopup'
import { SearchSelect } from '@/components/SearchSelect'
import { RepetitionTagInput } from '@/lib/api/academic/repetitionTag'
import { useProgramLevels } from '@/hooks/academic/useProgramLevels'
import { AuthError } from '@/lib/api/client'

interface NewRepTagModalProps extends ModalProps {
  createRepetitionTag: {
    mutate: (input: RepetitionTagInput, options?: { onSuccess?: () => void; onError?: (error: Error) => void }) => void
    isPending: boolean
  }
}

export function NewRepTagModal({ isOpen, onClose, showToast, createRepetitionTag }: NewRepTagModalProps) {
  const [tagCode, setTagCode] = useState('')
  const [tagName, setTagName] = useState('')
  const [programLevelGuid, setProgramLevelGuid] = useState('')
  const [saved, setSaved]     = useState(false)
  const [failure, setFailure] = useState<string | null>(null)
  const [errors, setErrors]   = useState<Record<string, string>>({})

  const { data: programLevels = [] } = useProgramLevels()
  const programLevelOptions = programLevels.map(p => ({ value: p.programLevelGuid, label: p.levelName }))

  if (!isOpen) return null

  function reset() { setTagCode(''); setTagName(''); setProgramLevelGuid(''); setErrors({}) }
  function handleClose() { setSaved(false); setFailure(null); reset(); onClose() }

  function validate() {
    const e: Record<string, string> = {}
    if (!tagCode.trim()) e.tagCode = 'Repetition Tag Code is required'
    if (!tagName.trim()) e.tagName = 'Description is required'
    if (!programLevelGuid) e.programLevelGuid = 'Please select a Programme Level'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  if (saved) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <SuccessPopup title="Repetition Tag Added!" subtitle="The new repetition tag has been saved successfully." onClose={handleClose} />
        </div>
      </div>
    )
  }

  if (failure) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <FailurePopup title="Couldn't Add Repetition Tag" subtitle={failure} onClose={() => setFailure(null)} />
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay open" id="new-rep-tag-modal">
      <div className="modal modal-md" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr modal-hdr-blue">
          <div className="modal-title"><i className="lni lni-reload"></i> Add Repetition Tag</div>
          <button className="modal-close" onClick={handleClose}><i className="lni lni-close"></i></button>
        </div>
        <div className="g2">
          <div className="fg">
            <div className="lbl">Repetition Tag Code <span className="req">*</span></div>
            <input
              className="ctrl font-mono uppercase"
              type="text"
              placeholder="e.g. RT-CU-001"
              maxLength={20}
              value={tagCode}
              onChange={e => { setTagCode(e.target.value.toUpperCase()); if (errors.tagCode) setErrors(p => ({ ...p, tagCode: '' })) }}
              style={errors.tagCode ? { borderColor: 'var(--red)' } : undefined}
            />
            {errors.tagCode && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.tagCode}</p>}
          </div>
          <div className="fg">
            <div className="lbl">Programme Level <span className="req">*</span></div>
            <SearchSelect
              placeholder="Select level…"
              value={programLevelGuid}
              onChange={v => { setProgramLevelGuid(v); if (errors.programLevelGuid) setErrors(p => ({ ...p, programLevelGuid: '' })) }}
              options={programLevelOptions}
            />
            {errors.programLevelGuid && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.programLevelGuid}</p>}
          </div>
          <div className="fg span2">
            <div className="lbl">Description <span className="req">*</span></div>
            <input
              className="ctrl"
              type="text"
              placeholder="e.g. Standard repeat for failed course units"
              value={tagName}
              onChange={e => { setTagName(e.target.value); if (errors.tagName) setErrors(p => ({ ...p, tagName: '' })) }}
              style={errors.tagName ? { borderColor: 'var(--red)' } : undefined}
            />
            {errors.tagName && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.tagName}</p>}
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-neu" onClick={handleClose}>Cancel</button>
          <button
            className="btn btn-primary"
            disabled={createRepetitionTag.isPending}
            onClick={() => {
              if (!validate()) return
              createRepetitionTag.mutate(
                { tagCode, tagName, programLevelGuid },
                {
                  onSuccess: () => { setSaved(true); showToast('Repetition tag added successfully') },
                  onError: (error: Error) => {
                    const code = error instanceof AuthError ? error.code : undefined
                    setFailure(error.message || `Failed to add repetition tag${code ? ` (${code})` : ''}. Please try again.`)
                  },
                },
              )
            }}
          >
            <i className="lni lni-checkmark"></i> {createRepetitionTag.isPending ? 'Adding…' : 'Add Repetition Tag'}
          </button>
        </div>
      </div>
    </div>
  )
}
