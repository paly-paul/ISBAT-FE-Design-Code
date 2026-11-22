'use client'
import { useEffect, useState } from 'react'
import { ModalProps } from '../types'
import { SuccessPopup } from '../shared/SuccessPopup'
import { FailurePopup } from '../shared/FailurePopup'
import { AuthError } from '@/lib/api/client'
import { COURSE_LEVEL_NAME_MAX, CourseLevel } from '@/lib/api/academic/courseLevel'
import { useCreateCourseLevel, useUpdateCourseLevel } from '@/hooks/config/useCourseLevels'

interface CourseLevelFormModalProps extends ModalProps {
  mode: 'new' | 'edit'
  courseLevel: CourseLevel | null
  // Edit hit not_found: someone else deleted the row. The page drops it.
  onGone: (level: CourseLevel) => void
}

export function CourseLevelFormModal({ isOpen, onClose, showToast, mode, courseLevel, onGone }: CourseLevelFormModalProps) {
  const isEdit = mode === 'edit'
  const [saved, setSaved] = useState(false)
  const [failure, setFailure] = useState<string | null>(null)
  const [levelName, setLevelName] = useState('')
  const [error, setError] = useState('')

  const createLevel = useCreateCourseLevel()
  const updateLevel = useUpdateCourseLevel()

  useEffect(() => {
    if (!isOpen) return
    setLevelName(isEdit && courseLevel ? courseLevel.levelName : '')
    setError('')
  }, [isOpen, isEdit, courseLevel])

  if (!isOpen || (isEdit && !courseLevel)) return null

  function handleClose() { setSaved(false); setFailure(null); onClose() }

  function handleError(err: Error) {
    const code = err instanceof AuthError ? err.code : undefined
    if (code === 'conflict') { setError('A course level with this name already exists.'); return }
    if (code === 'validation_error') {
      const msgs = err instanceof AuthError && err.errors?.length ? err.errors : [err.message]
      setError(msgs.filter(Boolean).join(' ') || 'Check the course level name.')
      return
    }
    if (code === 'not_found' && isEdit && courseLevel) {
      onGone(courseLevel)
      handleClose()
      showToast('This course level no longer exists.', 'error')
      return
    }
    setFailure(err.message || `Failed to ${isEdit ? 'update' : 'add'} course level. Please try again.`)
  }

  function handleSubmit() {
    const name = levelName.trim()
    if (!name) { setError('Course level name is required'); return }
    if (name.length > COURSE_LEVEL_NAME_MAX) { setError(`Course level name must be ${COURSE_LEVEL_NAME_MAX} characters or fewer`); return }
    const onSuccess = () => { setSaved(true); showToast(isEdit ? 'Course level updated successfully' : 'Course level added successfully') }
    if (isEdit && courseLevel) {
      updateLevel.mutate({ intLevel: courseLevel.intLevel, input: { levelName: name } }, { onSuccess, onError: handleError })
    } else {
      createLevel.mutate({ levelName: name }, { onSuccess, onError: handleError })
    }
  }

  const isPending = isEdit ? updateLevel.isPending : createLevel.isPending

  if (saved) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <SuccessPopup
            title={isEdit ? 'Course Level Updated!' : 'Course Level Added!'}
            subtitle={isEdit ? 'Your changes have been saved successfully.' : 'The new course level has been saved successfully.'}
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
          <FailurePopup title={isEdit ? "Couldn't Update Course Level" : "Couldn't Add Course Level"} subtitle={failure} onClose={() => setFailure(null)} />
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay open" id={isEdit ? 'edit-course-level-modal' : 'new-course-level-modal'}>
      <div className="modal modal-md" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr modal-hdr-blue">
          <div className="modal-title"><i className={`lni ${isEdit ? 'lni-pencil' : 'lni-graduation'}`}></i> {isEdit ? 'Edit Course Level' : 'Add Course Level'}</div>
          <button className="modal-close" onClick={handleClose}><i className="lni lni-close"></i></button>
        </div>
        <div className="fg">
          <div className="lbl">Course Level Name <span className="req">*</span></div>
          <input
            className="ctrl"
            type="text"
            placeholder={isEdit ? undefined : 'e.g. Bachelors'}
            maxLength={COURSE_LEVEL_NAME_MAX}
            value={levelName}
            onChange={e => { setLevelName(e.target.value); if (error) setError('') }}
            onKeyDown={e => { if (e.key === 'Enter' && !isPending) handleSubmit() }}
            style={error ? { borderColor: 'var(--red)' } : undefined}
            autoFocus
          />
          {error && <p className="field-err" style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{error}</p>}
        </div>
        <div className="modal-footer">
          <button className="btn btn-neu" onClick={handleClose}>Cancel</button>
          <button className="btn btn-primary" disabled={isPending} onClick={handleSubmit}>
            <i className="lni lni-checkmark"></i> {isPending ? (isEdit ? 'Updating…' : 'Adding…') : (isEdit ? 'Update Course Level' : 'Add Course Level')}
          </button>
        </div>
      </div>
    </div>
  )
}
