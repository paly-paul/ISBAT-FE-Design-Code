'use client'
import { useEffect, useState } from 'react'
import { ModalProps } from '../types'
import { SuccessPopup } from '../shared/SuccessPopup'
import { FailurePopup } from '../shared/FailurePopup'
import { SearchSelect } from '@/components/SearchSelect'
import {
  Designation, DesignationInput,
  DESIGNATION_NAME_MAX, DESIGNATION_SHORT_CODE_MAX, DESIGNATION_TEXT_MAX,
} from '@/lib/api/academic/designation'
import { useCreateDesignation, useUpdateDesignation } from '@/hooks/config/useDesignations'
import { useCourseLevelsDropdown } from '@/hooks/config/useCourseLevels'
import { AuthError } from '@/lib/api/client'
import { scrollToFirstError } from '@/lib/scrollToFirstError'

interface DesignationFormModalProps extends ModalProps {
  mode: 'new' | 'edit'
  designation: Designation | null
  // Edit hit not_found: someone else deleted the row. The page drops it.
  onGone: (designation: Designation) => void
}

type Field = 'shortCode' | 'designationName' | 'minQualificationGuid' | 'jobDescription' | 'skillSet'

// Add / Edit Designation (designation-master-page.md). No department: a
// designation isn't tied to one, the employee picks it separately.
export function DesignationFormModal({ isOpen, onClose, showToast, mode, designation, onGone }: DesignationFormModalProps) {
  const isEdit = mode === 'edit'
  const [saved, setSaved]     = useState(false)
  const [failure, setFailure] = useState<string | null>(null)
  const [shortCode, setShortCode]                       = useState('')
  const [designationName, setDesignationName]           = useState('')
  const [minQualificationGuid, setMinQualificationGuid] = useState('')
  const [jobDescription, setJobDescription]             = useState('')
  const [skillSet, setSkillSet]                         = useState('')
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({})

  const createDesignation = useCreateDesignation()
  const updateDesignation = useUpdateDesignation()
  const { data: courseLevels = [], isLoading: courseLevelsLoading, refetch: reloadCourseLevels } = useCourseLevelsDropdown(isOpen)
  const qualificationOptions = courseLevels.map(c => ({ value: c.courseLevelGuid, label: c.levelName }))

  useEffect(() => {
    if (!isOpen) return
    const d = isEdit ? designation : null
    setShortCode(d?.shortCode ?? '')
    setDesignationName(d?.designationName ?? '')
    setMinQualificationGuid(d?.minQualificationGuid ?? '')
    setJobDescription(d?.jobDescription ?? '')
    setSkillSet(d?.skillSet ?? '')
    setErrors({})
  }, [isOpen, isEdit, designation])

  if (!isOpen || (isEdit && !designation)) return null

  function handleClose() { setSaved(false); setFailure(null); onClose() }
  function clearError(f: Field) { if (errors[f]) setErrors(p => ({ ...p, [f]: '' })) }

  function validate() {
    const e: Partial<Record<Field, string>> = {}
    if (!shortCode.trim()) e.shortCode = 'Short code is required'
    else if (shortCode.trim().length > DESIGNATION_SHORT_CODE_MAX) e.shortCode = `Short code must be ${DESIGNATION_SHORT_CODE_MAX} characters or fewer`
    if (!designationName.trim()) e.designationName = 'Designation name is required'
    else if (designationName.trim().length > DESIGNATION_NAME_MAX) e.designationName = `Designation name must be ${DESIGNATION_NAME_MAX} characters or fewer`
    if (jobDescription.trim().length > DESIGNATION_TEXT_MAX) e.jobDescription = `Job description must be ${DESIGNATION_TEXT_MAX} characters or fewer`
    if (skillSet.trim().length > DESIGNATION_TEXT_MAX) e.skillSet = `Skill set must be ${DESIGNATION_TEXT_MAX} characters or fewer`
    setErrors(e)
    scrollToFirstError(e)
    return Object.keys(e).length === 0
  }

  function handleError(err: Error) {
    const code = err instanceof AuthError ? err.code : undefined
    // 409: the short code or the name is taken — the message says which.
    if (code === 'conflict') {
      const msg = err.message || ''
      if (/code/i.test(msg)) setErrors({ shortCode: msg || 'A designation with this short code already exists.' })
      else setErrors({ designationName: msg || 'A designation with this name already exists.' })
      return
    }
    // The chosen course level was deleted meanwhile: say so and reload the picker.
    if (code === 'bad_request') {
      setErrors({ minQualificationGuid: err.message || 'Minimum qualification not found.' })
      setMinQualificationGuid('')
      reloadCourseLevels()
      return
    }
    if (code === 'validation_error') {
      const msgs = err instanceof AuthError && err.errors?.length ? err.errors : [err.message]
      setFailure(msgs.filter(Boolean).join(' ') || 'Check the form and try again.')
      return
    }
    if (code === 'not_found' && isEdit && designation) {
      onGone(designation)
      handleClose()
      showToast('This designation no longer exists.', 'error')
      return
    }
    setFailure(err.message || `Failed to ${isEdit ? 'update' : 'add'} designation. Please try again.`)
  }

  function handleSubmit() {
    if (!validate()) return
    // Optional fields go as null when empty; PUT clears anything sent as null.
    const input: DesignationInput = {
      shortCode: shortCode.trim(),
      designationName: designationName.trim(),
      jobDescription: jobDescription.trim() || null,
      minQualificationGuid: minQualificationGuid || null,
      skillSet: skillSet.trim() || null,
    }
    const onSuccess = () => { setSaved(true); showToast(isEdit ? 'Designation updated successfully' : 'Designation added successfully', 'success') }
    if (isEdit && designation) {
      updateDesignation.mutate({ designationGuid: designation.designationGuid, input }, { onSuccess, onError: handleError })
    } else {
      createDesignation.mutate(input, { onSuccess, onError: handleError })
    }
  }

  const isPending = isEdit ? updateDesignation.isPending : createDesignation.isPending
  const errStyle = (f: Field) => (errors[f] ? { borderColor: 'var(--red)' } : undefined)
  const errText = (f: Field) => errors[f] && <p className="field-err" style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors[f]}</p>

  if (saved) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <SuccessPopup
            title={isEdit ? 'Designation Updated!' : 'Designation Added!'}
            subtitle={isEdit ? 'Your changes have been saved successfully.' : 'The new designation has been saved successfully.'}
            onClose={handleClose}
          />
        </div>
      </div>
    )
  }

  if (failure) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <FailurePopup title={isEdit ? "Couldn't Update Designation" : "Couldn't Add Designation"} subtitle={failure} onClose={() => setFailure(null)} />
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay open" id={isEdit ? 'edit-designation-modal' : 'new-designation-modal'}>
      <div className="modal modal-md" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr modal-hdr-blue">
          <div className="modal-title"><i className={`lni ${isEdit ? 'lni-pencil' : 'lni-tag'}`}></i> {isEdit ? 'Edit Designation' : 'Add Designation'}</div>
          <button className="modal-close" onClick={handleClose}><i className="lni lni-close"></i></button>
        </div>
        <div className="g2">
          <div className="fg" data-field="shortCode">
            <div className="lbl">Short Code <span className="req">*</span></div>
            <input
              className="ctrl font-mono"
              type="text"
              placeholder={isEdit ? undefined : 'e.g. JT010'}
              maxLength={DESIGNATION_SHORT_CODE_MAX}
              value={shortCode}
              onChange={e => { setShortCode(e.target.value.toUpperCase()); clearError('shortCode') }}
              style={errStyle('shortCode')}
            />
            {errText('shortCode')}
          </div>
          <div className="fg" data-field="minQualificationGuid">
            <div className="lbl">Min. Qualification</div>
            <SearchSelect
              placeholder={courseLevelsLoading ? 'Loading…' : 'Select qualification…'}
              value={minQualificationGuid}
              onChange={v => { setMinQualificationGuid(v); clearError('minQualificationGuid') }}
              options={qualificationOptions}
              isLoading={courseLevelsLoading}
            />
            {errText('minQualificationGuid')}
          </div>
          <div className="fg span2" data-field="designationName">
            <div className="lbl">Designation Name <span className="req">*</span></div>
            <input
              className="ctrl"
              type="text"
              placeholder={isEdit ? undefined : 'e.g. Senior Lecturer'}
              maxLength={DESIGNATION_NAME_MAX}
              value={designationName}
              onChange={e => { setDesignationName(e.target.value); clearError('designationName') }}
              style={errStyle('designationName')}
            />
            {errText('designationName')}
          </div>
          <div className="fg span2" data-field="jobDescription">
            <div className="lbl">Job Description</div>
            <textarea
              className="ctrl"
              rows={3}
              placeholder="What this role does"
              maxLength={DESIGNATION_TEXT_MAX}
              value={jobDescription}
              onChange={e => { setJobDescription(e.target.value); clearError('jobDescription') }}
              style={errStyle('jobDescription')}
            />
            {errText('jobDescription')}
          </div>
          <div className="fg span2" data-field="skillSet">
            <div className="lbl">Skill Set</div>
            <textarea
              className="ctrl"
              rows={3}
              placeholder="e.g. Curriculum design, research"
              maxLength={DESIGNATION_TEXT_MAX}
              value={skillSet}
              onChange={e => { setSkillSet(e.target.value); clearError('skillSet') }}
              style={errStyle('skillSet')}
            />
            {errText('skillSet')}
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-neu" onClick={handleClose}>Cancel</button>
          <button className="btn btn-primary" disabled={isPending} onClick={handleSubmit}>
            <i className="lni lni-checkmark"></i> {isPending ? (isEdit ? 'Updating…' : 'Adding…') : (isEdit ? 'Update Designation' : 'Add Designation')}
          </button>
        </div>
      </div>
    </div>
  )
}
