'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ModalProps } from '../types'
import { SuccessPopup } from './SuccessPopup'
import { FailurePopup } from './FailurePopup'
import { SearchSelect } from '@/components/SearchSelect'
import { ProgramGroupInput } from '@/lib/api/academic/programGroup'
import { useProgramLevels } from '@/hooks/academic/useProgramLevels'
import { AuthError } from '@/lib/api/client'

interface ProgrammeGroupModalProps extends ModalProps {
  createProgramGroup: {
    mutate: (input: ProgramGroupInput, options?: { onSuccess?: () => void; onError?: (error: Error) => void }) => void
    isPending: boolean
  }
}

export function ProgrammeGroupModal({ isOpen, onClose, showToast, createProgramGroup }: ProgrammeGroupModalProps) {
  const router = useRouter()
  const [saved, setSaved]             = useState(false)
  const [failure, setFailure]         = useState<string | null>(null)
  const [redirectAfterClose, setRedirectAfterClose] = useState(false)
  const [groupCode, setGroupCode]     = useState('')
  const [groupName, setGroupName]     = useState('')
  const [programLevel, setProgramLevel] = useState('')
  const [errors, setErrors]           = useState<Record<string, string>>({})

  const { data: programLevels = [] } = useProgramLevels()
  const programLevelOptions = programLevels.map(l => ({ value: l.programLevelGuid, label: l.levelName }))

  if (!isOpen) return null

  function handleClose() {
    setSaved(false); setFailure(null)
    setGroupCode(''); setGroupName(''); setProgramLevel(''); setErrors({})
    onClose()
    if (redirectAfterClose) {
      router.push('/academic/programme-master')
    }
    setRedirectAfterClose(false)
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
  // anything else shows the failure popup instead.
  function handleCreateError(error: Error) {
    const code = error instanceof AuthError ? error.code : undefined
    if (code === 'bad_request') {
      setErrors(prev => ({ ...prev, groupCode: error.message || 'A programme group with this code already exists.' }))
      return
    }
    setFailure(error.message || 'Failed to add programme group. Please try again.')
  }

  if (saved) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <SuccessPopup title="Programme Group Added!" subtitle="The new programme group has been saved successfully." onClose={handleClose} />
        </div>
      </div>
    )
  }

  if (failure) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <FailurePopup title="Couldn't Add Programme Group" subtitle={failure} onClose={() => setFailure(null)} />
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay open" id="new-proggroup-modal">
      <div className="modal modal-md" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr modal-hdr-blue">
          <div className="modal-title"><i className="lni lni-folder"></i> Add Programme Group</div>
          <button className="modal-close" onClick={handleClose}><i className="lni lni-close"></i></button>
        </div>
        <div className="g2">
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
        </div>
        <div className="modal-footer">
          <button className="btn btn-neu" onClick={handleClose}>Cancel</button>
          <button
            className="btn btn-primary"
            disabled={createProgramGroup.isPending}
            onClick={() => {
              if (!validate()) return
              createProgramGroup.mutate(
                { groupCode, groupName, programLevelGuid: programLevel },
                {
                  onSuccess: () => {
                    setSaved(true)
                    setRedirectAfterClose(true)
                    showToast('Programme Group added successfully')
                  },
                  onError: handleCreateError,
                },
              )
            }}
          >
            <i className="lni lni-checkmark"></i> {createProgramGroup.isPending ? 'Adding…' : 'Save Group'}
          </button>
        </div>
      </div>
    </div>
  )
}
