import { useState, useEffect } from 'react'
import { SuccessPopup } from '@/components/modals/shared/SuccessPopup'
import { useCreateQuestionFaq, useQuestionFaq, useUpdateQuestionFaq } from '@/hooks/assessment/useQuestionFaqs'

interface QuestionFaqFormModalProps {
  isOpen: boolean
  onClose: () => void
  showToast: (msg: string, type?: string) => void
  editingGuid: string | null
}

const MIN_QUESTION_LENGTH = 10
const MIN_ANSWER_LENGTH = 5

function validateQuestionText(val: string): string {
  const trimmed = val.trim()
  if (!trimmed) return 'Question text is required.'
  if (trimmed.length < MIN_QUESTION_LENGTH) {
    return `Question must be at least ${MIN_QUESTION_LENGTH} characters long.`
  }
  const letterCount = (trimmed.match(/[a-zA-Z]/g) || []).length
  if (letterCount < 3) {
    return 'Question must contain meaningful words, not just punctuation or symbols.'
  }
  return ''
}

function validateAnswerText(val: string): string {
  const trimmed = val.trim()
  if (!trimmed) return 'Answer text is required.'
  if (trimmed.length < MIN_ANSWER_LENGTH) {
    return `Answer must be at least ${MIN_ANSWER_LENGTH} characters long.`
  }
  const letterCount = (trimmed.match(/[a-zA-Z0-9]/g) || []).length
  if (letterCount < 2) {
    return 'Answer must contain meaningful text, not just punctuation or symbols.'
  }
  return ''
}

export function QuestionFaqFormModal({ isOpen, onClose, showToast, editingGuid }: QuestionFaqFormModalProps) {
  const isEdit = !!editingGuid
  const { data: existingData, isLoading } = useQuestionFaq(editingGuid, isOpen && isEdit)
  const createMut = useCreateQuestionFaq()
  const updateMut = useUpdateQuestionFaq()

  const [questionText, setQuestionText] = useState('')
  const [answerText, setAnswerText] = useState('')
  const [fieldErrors, setFieldErrors] = useState<{ questionText?: string; answerText?: string }>({})
  
  const [showSuccess, setShowSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (isOpen) {
      if (isEdit && existingData) {
        setQuestionText(existingData.questionText || '')
        setAnswerText(existingData.answerText || '')
      } else if (!isEdit) {
        setQuestionText('')
        setAnswerText('')
      }
      setFieldErrors({})
      setErrorMsg('')
    }
  }, [isOpen, isEdit, existingData])

  function handleQuestionChange(val: string) {
    setQuestionText(val)
    if (fieldErrors.questionText) {
      setFieldErrors(prev => ({ ...prev, questionText: validateQuestionText(val) || undefined }))
    }
  }

  function handleAnswerChange(val: string) {
    setAnswerText(val)
    if (fieldErrors.answerText) {
      setFieldErrors(prev => ({ ...prev, answerText: validateAnswerText(val) || undefined }))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrorMsg('')

    const nextErrors: { questionText?: string; answerText?: string } = {}
    if (!isEdit) {
      const qErr = validateQuestionText(questionText)
      if (qErr) nextErrors.questionText = qErr
    }
    const aErr = validateAnswerText(answerText)
    if (aErr) nextErrors.answerText = aErr

    setFieldErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    const qTrim = questionText.trim()
    const aTrim = answerText.trim()
    
    try {
      if (isEdit) {
        await updateMut.mutateAsync({ guid: editingGuid as string, input: { answerText: aTrim } })
      } else {
        await createMut.mutateAsync({ questionText: qTrim, answerText: aTrim })
      }
      setShowSuccess(true)
    } catch (err: any) {
      setErrorMsg(err.message || 'Operation failed')
    }
  }

  function handleSuccessClose() {
    setShowSuccess(false)
    onClose()
  }

  if (!isOpen) return null

  if (showSuccess) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <SuccessPopup 
            title={isEdit ? 'FAQ Updated' : 'FAQ Created'}
            subtitle={isEdit ? 'The FAQ has been updated successfully.' : 'New FAQ has been created successfully.'}
            onClose={handleSuccessClose}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay open">
      <div className="modal modal-md flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr modal-hdr-blue shrink-0">
          <div className="modal-title">{isEdit ? 'Edit Question FAQ' : 'New Question FAQ'}</div>
          <button className="modal-close" onClick={onClose}><i className="lni lni-close"></i></button>
        </div>
        
        <form onSubmit={handleSubmit} noValidate className="flex flex-col flex-1">
          <div className="modal-body p-5 flex flex-col flex-1 gap-4 bg-slate-50">
            {isLoading && isEdit ? (
              <div className="p-6 text-center text-g500">Loading details...</div>
            ) : (
              <>
                <div className="fg mb-0">
                  <div className="flex items-center justify-between">
                    <label className="lbl">Question <span className="text-clr-red">*</span></label>
                    {!isEdit && (
                      <span className="text-[11px] text-g400">
                        Min {MIN_QUESTION_LENGTH} characters
                      </span>
                    )}
                  </div>
                  {isEdit ? (
                    <div className="p-3 bg-slate-100 border border-slate-200 rounded text-g600 text-sm">
                      {questionText}
                      <div className="text-[11px] text-g400 mt-2 font-medium"><i className="lni lni-information"></i> Question text cannot be modified after creation.</div>
                    </div>
                  ) : (
                    <>
                      <textarea 
                        className="ctrl" 
                        placeholder="e.g. Can I defer my semester?" 
                        value={questionText}
                        onChange={e => handleQuestionChange(e.target.value)}
                        rows={3}
                        style={fieldErrors.questionText ? { borderColor: 'var(--red)' } : undefined}
                      />
                      {fieldErrors.questionText && (
                        <p className="field-err" style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>
                          {fieldErrors.questionText}
                        </p>
                      )}
                    </>
                  )}
                </div>

                <div className="fg mb-0">
                  <div className="flex items-center justify-between">
                    <label className="lbl">Answer <span className="text-clr-red">*</span></label>
                    <span className="text-[11px] text-g400">
                      Min {MIN_ANSWER_LENGTH} characters
                    </span>
                  </div>
                  <textarea 
                    className="ctrl" 
                    placeholder="Enter the answer..." 
                    value={answerText}
                    onChange={e => handleAnswerChange(e.target.value)}
                    rows={6}
                    style={fieldErrors.answerText ? { borderColor: 'var(--red)' } : undefined}
                  />
                  {fieldErrors.answerText && (
                    <p className="field-err" style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>
                      {fieldErrors.answerText}
                    </p>
                  )}
                </div>

                {errorMsg && (
                  <div className="p-3 bg-red-50 text-clr-red rounded border border-red-100 text-sm">
                    {errorMsg}
                  </div>
                )}
              </>
            )}
          </div>
          
          <div className="modal-footer shrink-0">
            <span className="flex-1"></span>
            <button type="button" className="btn btn-neu" onClick={onClose} disabled={createMut.isPending || updateMut.isPending}>Cancel</button>
            <button type="submit" className="btn btn-primary ml-2" disabled={createMut.isPending || updateMut.isPending || (isLoading && isEdit)}>
              {createMut.isPending || updateMut.isPending ? 'Saving...' : (isEdit ? 'Update FAQ' : 'Create FAQ')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
