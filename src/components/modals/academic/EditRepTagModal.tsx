'use client'
import { useEffect, useState } from 'react'
import { ModalProps } from '../types'
import { SuccessPopup } from './SuccessPopup'
import { FailurePopup } from './FailurePopup'
import { SearchSelect } from '@/components/SearchSelect'
import { RepetitionTagInput } from '@/lib/api/academic/repetitionTag'
import { useRepetitionTag } from '@/hooks/academic/useRepetitionTags'
import { useProgramLevels } from '@/hooks/academic/useProgramLevels'
import { AuthError } from '@/lib/api/client'

interface EditRepTagModalProps extends ModalProps {
  courseUnitRepetitionGuid: string | null
  updateRepetitionTag: {
    mutate: (variables: { guid: string; input: RepetitionTagInput }, options?: { onSuccess?: () => void; onError?: (error: Error) => void }) => void
    isPending: boolean
  }
}

export function EditRepTagModal({ isOpen, onClose, showToast, courseUnitRepetitionGuid, updateRepetitionTag }: EditRepTagModalProps) {
  const { data: tag, isLoading, isError, error } = useRepetitionTag(courseUnitRepetitionGuid, isOpen)

  const [saved, setSaved]     = useState(false)
  const [failure, setFailure] = useState<string | null>(null)
  const [tagCode, setTagCode] = useState('')
  const [tagName, setTagName] = useState('')
  const [programLevelGuid, setProgramLevelGuid] = useState('')
  const [errors, setErrors]   = useState<Record<string, string>>({})

  const { data: programLevels = [] } = useProgramLevels()
  const programLevelOptions = programLevels.map(p => ({ value: p.programLevelGuid, label: p.levelName }))

  // Fill the form when the tag loads and recover the linked programme level when possible.
  useEffect(() => {
    if (!isOpen || !tag) return
    setTagCode(tag.tagCode)
    setTagName(tag.tagName)
    setProgramLevelGuid(programLevels.find(p => p.levelCode === tag.levelCode)?.programLevelGuid ?? '')
    setErrors({})
  }, [isOpen, tag, programLevels])

  if (!isOpen) return null

  function handleClose() { setSaved(false); setFailure(null); setErrors({}); onClose() }

  function clearError(field: string) {
    setErrors(prev => (prev[field] ? { ...prev, [field]: '' } : prev))
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!tagCode.trim()) e.tagCode = 'Repetition Tag Code is required'
    if (!tagName.trim()) e.tagName = 'Description is required'
    if (!programLevelGuid) e.programLevelGuid = 'Please select a Programme Level'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit() {
    if (!courseUnitRepetitionGuid || !tag || !validate()) return
    updateRepetitionTag.mutate(
      { guid: courseUnitRepetitionGuid, input: { tagCode, tagName, programLevelGuid } },
      {
        onSuccess: () => { setSaved(true); showToast('Repetition tag updated successfully') },
        onError: (error: Error) => {
          const code = error instanceof AuthError ? error.code : undefined
          setFailure(error.message || `Failed to update repetition tag${code ? ` (${code})` : ''}. Please try again.`)
        },
      },
    )
  }

  if (saved) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <SuccessPopup title="Repetition Tag Updated!" subtitle="Your changes have been saved successfully." onClose={handleClose} />
        </div>
      </div>
    )
  }

  if (failure) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <FailurePopup title="Couldn't Update Repetition Tag" subtitle={failure} onClose={() => setFailure(null)} />
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <FailurePopup
            title="Couldn't Load Repetition Tag"
            subtitle={error instanceof AuthError ? (error.message || 'Failed to load repetition tag details.') : 'Failed to load repetition tag details.'}
            onClose={handleClose}
          />
        </div>
      </div>
    )
  }

  if (isLoading || !tag) {
    return (
      <div className="modal-overlay open" id="edit-rep-tag-modal">
        <div className="modal modal-md" onClick={e => e.stopPropagation()}>
          <div className="modal-hdr modal-hdr-blue">
            <div className="modal-title"><i className="lni lni-pencil"></i> Edit Repetition Tag</div>
            <button className="modal-close" onClick={handleClose}><i className="lni lni-close"></i></button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 180 }}>
            <span style={{ color: 'var(--g400)' }}>Loading repetition tag details…</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay open" id="edit-rep-tag-modal">
      <div className="modal modal-md" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr modal-hdr-blue">
          <div className="modal-title"><i className="lni lni-pencil"></i> Edit Repetition Tag</div>
          <button className="modal-close" onClick={handleClose}><i className="lni lni-close"></i></button>
        </div>
        <div className="g2">
          <div className="fg">
            <div className="lbl">Repetition Tag Code <span className="req">*</span></div>
            <input
              className="ctrl font-mono uppercase"
              type="text"
              maxLength={20}
              value={tagCode}
              onChange={e => { setTagCode(e.target.value.toUpperCase()); clearError('tagCode') }}
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
              value={tagName}
              onChange={e => { setTagName(e.target.value); clearError('tagName') }}
              style={errors.tagName ? { borderColor: 'var(--red)' } : undefined}
            />
            {errors.tagName && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.tagName}</p>}
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-neu" onClick={handleClose}>Cancel</button>
          <button className="btn btn-primary" disabled={updateRepetitionTag.isPending} onClick={handleSubmit}>
            <i className="lni lni-checkmark"></i> {updateRepetitionTag.isPending ? 'Updating…' : 'Update Repetition Tag'}
          </button>
        </div>
      </div>
    </div>
  )
}
