'use client'
import { useState, useEffect } from 'react'
import { ModalProps } from '../types'
import { SuccessPopup } from './SuccessPopup'
import { FailurePopup } from './FailurePopup'
import { SearchSelect } from '@/components/SearchSelect'
import { ProgramGroupInput } from '@/lib/api/academic/programGroup'
import { useProgramGroup } from '@/hooks/academic/useProgramGroups'
import { useProgramLevels } from '@/hooks/academic/useProgramLevels'
import { AuthError } from '@/lib/api/client'

interface EditProgrammeGroupModalProps extends ModalProps {
  programGroupGuid: string | null
  updateProgramGroup: {
    mutate: (variables: { guid: string; input: ProgramGroupInput }, options?: { onSuccess?: () => void; onError?: (error: Error) => void }) => void
    isPending: boolean
  }
}

export function EditProgrammeGroupModal({ isOpen, onClose, showToast, programGroupGuid, updateProgramGroup }: EditProgrammeGroupModalProps) {
  const { data: programGroup, isLoading, isError, error } = useProgramGroup(programGroupGuid, isOpen)

  const [saved, setSaved]               = useState(false)
  const [failure, setFailure]           = useState<string | null>(null)
  const [groupCode, setGroupCode]       = useState('')
  const [groupName, setGroupName]       = useState('')
  const [programLevel, setProgramLevel] = useState('')
  const [errors, setErrors]             = useState<Record<string, string>>({})

  const { data: programLevels = [] } = useProgramLevels()
  const programLevelOptions = programLevels.map(l => ({ value: l.programLevelGuid, label: l.levelName }))

  // Prefill the form once the programme group has loaded. Re-runs whenever a
  // different guid is fetched (react-query resets `programGroup` to
  // undefined when programGroupGuid changes, so stale data never leaks
  // between edits).
  useEffect(() => {
    if (!isOpen || !programGroup) return
    setGroupCode(programGroup.groupCode)
    setGroupName(programGroup.groupName)
    setProgramLevel(programGroup.programLevelGuid)
    setErrors({})
  }, [isOpen, programGroup])

  if (!isOpen) return null

  function handleClose() {
    setSaved(false); setFailure(null); setErrors({})
    onClose()
  }

  function clearError(field: string) {
    setErrors(prev => (prev[field] ? { ...prev, [field]: '' } : prev))
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!groupCode.trim()) e.groupCode = 'Group Code is required'
    if (!groupName.trim()) e.groupName = 'Group Name is required'
    if (!programLevel)     e.programLevel = 'Select a programme level before proceeding'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  // Map known backend failures to field errors.
  // error where the cause is actionable right there (duplicate groupCode);
  // anything else shows the failure popup instead — same convention as
  // ProgrammeGroupModal's create-error handling.
  function handleUpdateError(error: Error) {
    const code = error instanceof AuthError ? error.code : undefined
    if (code === 'bad_request') {
      setErrors(prev => ({ ...prev, groupCode: error.message || 'A programme group with this code already exists.' }))
      return
    }
    setFailure(error.message || 'Failed to update programme group. Please try again.')
  }

  function handleUpdate() {
    if (!programGroupGuid || !validate()) return
    updateProgramGroup.mutate(
      { guid: programGroupGuid, input: { groupCode, groupName, programLevelGuid: programLevel } },
      {
        onSuccess: () => { setSaved(true); showToast('Programme Group updated successfully') },
        onError: handleUpdateError,
      },
    )
  }

  if (saved) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <SuccessPopup title="Programme Group Updated!" subtitle="Your changes have been saved successfully." onClose={handleClose} />
        </div>
      </div>
    )
  }

  if (failure) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <FailurePopup title="Couldn't Update Programme Group" subtitle={failure} onClose={() => setFailure(null)} />
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <FailurePopup
            title="Couldn't Load Programme Group"
            subtitle={error instanceof AuthError ? (error.message || 'Failed to load programme group details.') : 'Failed to load programme group details.'}
            onClose={handleClose}
          />
        </div>
      </div>
    )
  }

  if (isLoading || !programGroup) {
    return (
      <div className="modal-overlay open" id="edit-proggroup-modal">
        <div className="modal modal-md" onClick={e => e.stopPropagation()}>
          <div className="modal-hdr modal-hdr-blue">
            <div className="modal-title"><i className="lni lni-pencil"></i> Edit Programme Group</div>
            <button className="modal-close" onClick={handleClose}><i className="lni lni-close"></i></button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 180 }}>
            <span style={{ color: 'var(--g400)' }}>Loading programme group details…</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay open" id="edit-proggroup-modal">
      <div className="modal modal-md" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr modal-hdr-blue">
          <div className="modal-title"><i className="lni lni-pencil"></i> Edit Programme Group — <span className="font-mono">{programGroup.groupCode}</span></div>
          <button className="modal-close" onClick={handleClose}><i className="lni lni-close"></i></button>
        </div>
        <div className="g2">
          <div className="fg">
            <div className="lbl">Group Code <span className="req">*</span></div>
            <input
              className="ctrl"
              placeholder="e.g. SCI"
              value={groupCode}
              onChange={e => { setGroupCode(e.target.value); clearError('groupCode') }}
              style={errors.groupCode ? { borderColor: 'var(--red)' } : undefined}
            />
            {errors.groupCode && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.groupCode}</p>}
          </div>
          <div className="fg">
            <div className="lbl">Group Name <span className="req">*</span></div>
            <input
              className="ctrl"
              placeholder="e.g. Science Group"
              value={groupName}
              onChange={e => { setGroupName(e.target.value); clearError('groupName') }}
              style={errors.groupName ? { borderColor: 'var(--red)' } : undefined}
            />
            {errors.groupName && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.groupName}</p>}
          </div>
          <div className="fg span2">
            <div className="lbl">Programme Level <span className="req">*</span></div>
            <SearchSelect
              placeholder="Select programme level…"
              options={programLevelOptions}
              value={programLevel}
              onChange={v => { setProgramLevel(v); clearError('programLevel') }}
            />
            {errors.programLevel && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.programLevel}</p>}
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-neu" onClick={handleClose}>Cancel</button>
          <button className="btn btn-primary" disabled={updateProgramGroup.isPending} onClick={handleUpdate}>
            <i className="lni lni-checkmark"></i> {updateProgramGroup.isPending ? 'Saving…' : 'Update Group'}
          </button>
        </div>
      </div>
    </div>
  )
}
