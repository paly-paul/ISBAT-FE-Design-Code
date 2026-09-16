'use client'

import React, { useState, useEffect } from 'react'
import { QuestionDto } from '@/lib/api/assessment/questions'
import { useCreateQuestion, useUpdateQuestion } from '@/hooks/assessment/useQuestions'

interface SingleQuestionModalProps {
  isOpen: boolean
  onClose: () => void
  courseUnitGuid: string
  category: number
  intakeGuid: string
  question?: QuestionDto | null
  courseUnitCode?: string
  courseUnitName?: string
  categoryName?: string
  onSuccess: () => void
  showToast: (msg: string, type?: string) => void
}

export function SingleQuestionModal({
  isOpen,
  onClose,
  courseUnitGuid,
  category,
  intakeGuid,
  question,
  courseUnitCode,
  courseUnitName,
  categoryName,
  onSuccess,
  showToast,
}: SingleQuestionModalProps) {
  const isEdit = Boolean(question?.questionGuid)

  const [questionType, setQuestionType] = useState<number>(question?.questionType ?? 1)
  const [level, setLevel] = useState<number>(question?.level ?? 2)
  const [questionText, setQuestionText] = useState<string>(question?.questionText ?? '')
  const [option1Text, setOption1Text] = useState<string>(question?.option1Text ?? '')
  const [option2Text, setOption2Text] = useState<string>(question?.option2Text ?? '')
  const [option3Text, setOption3Text] = useState<string>(question?.option3Text ?? '')
  const [option4Text, setOption4Text] = useState<string>(question?.option4Text ?? '')
  const [selectedCorrectOptionIndex, setSelectedCorrectOptionIndex] = useState<number>(0)
  const [descriptiveAnswer, setDescriptiveAnswer] = useState<string>(question?.answerText ?? '')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const createMut = useCreateQuestion()
  const updateMut = useUpdateQuestion()

  useEffect(() => {
    if (question) {
      setQuestionType(question.questionType ?? 1)
      setLevel(question.level ?? 2)
      setQuestionText(question.questionText ?? '')
      setOption1Text(question.option1Text ?? '')
      setOption2Text(question.option2Text ?? '')
      setOption3Text(question.option3Text ?? '')
      setOption4Text(question.option4Text ?? '')

      const ans = (question.answerText ?? '').trim()
      if (ans && question.questionType === 1) {
        if (ans === question.option1Text?.trim()) setSelectedCorrectOptionIndex(0)
        else if (ans === question.option2Text?.trim()) setSelectedCorrectOptionIndex(1)
        else if (ans === question.option3Text?.trim()) setSelectedCorrectOptionIndex(2)
        else if (ans === question.option4Text?.trim()) setSelectedCorrectOptionIndex(3)
        else setSelectedCorrectOptionIndex(0)
      } else {
        setDescriptiveAnswer(question.answerText ?? '')
      }
    } else {
      setQuestionType(1)
      setLevel(2)
      setQuestionText('')
      setOption1Text('')
      setOption2Text('')
      setOption3Text('')
      setOption4Text('')
      setSelectedCorrectOptionIndex(0)
      setDescriptiveAnswer('')
    }
    setErrorMsg(null)
  }, [question, isOpen])

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    if (!questionText.trim()) {
      setErrorMsg('Question text cannot be left blank!')
      return
    }

    let resolvedAnswer = ''

    if (questionType === 1) {
      // MCQ validations
      const o1 = option1Text.trim()
      const o2 = option2Text.trim()
      const o3 = option3Text.trim()
      const o4 = option4Text.trim()

      if (!o1 || !o2 || !o3 || !o4) {
        setErrorMsg('All four options (Option 1, 2, 3, 4) cannot be left blank!')
        return
      }

      // Check unique options
      const opts = [o1, o2, o3, o4]
      const uniqueOpts = new Set(opts.map(o => o.toLowerCase()))
      if (uniqueOpts.size < 4) {
        setErrorMsg('Options should not duplicate! Each option must be distinct.')
        return
      }

      resolvedAnswer = opts[selectedCorrectOptionIndex]
      if (!resolvedAnswer) {
        setErrorMsg('Please select which option is the correct answer!')
        return
      }
    } else {
      // Descriptive validation
      if (!descriptiveAnswer.trim()) {
        setErrorMsg('Answer / Evaluation criteria cannot be left blank!')
        return
      }
      resolvedAnswer = descriptiveAnswer.trim()
    }

    if (isEdit && question?.questionGuid) {
      updateMut.mutate(
        {
          guid: question.questionGuid,
          payload: {
            questionType,
            level: questionType === 1 ? level : null,
            questionText: questionText.trim(),
            option1Text: questionType === 1 ? option1Text.trim() : null,
            option2Text: questionType === 1 ? option2Text.trim() : null,
            option3Text: questionType === 1 ? option3Text.trim() : null,
            option4Text: questionType === 1 ? option4Text.trim() : null,
            answerText: resolvedAnswer,
          },
        },
        {
          onSuccess: () => {
            showToast('Question updated successfully!', 'success')
            onSuccess()
            onClose()
          },
          onError: (err: any) => {
            setErrorMsg(err.message || 'Failed to update question')
          },
        }
      )
    } else {
      if (!courseUnitGuid || !category || !intakeGuid) {
        setErrorMsg('Course Unit, Assessment Category, and Academic Intake are required.')
        return
      }

      createMut.mutate(
        {
          courseUnitGuid,
          category,
          intakeGuid,
          questionType,
          level: questionType === 1 ? level : null,
          questionText: questionText.trim(),
          option1Text: questionType === 1 ? option1Text.trim() : null,
          option2Text: questionType === 1 ? option2Text.trim() : null,
          option3Text: questionType === 1 ? option3Text.trim() : null,
          option4Text: questionType === 1 ? option4Text.trim() : null,
          answerText: resolvedAnswer,
        },
        {
          onSuccess: () => {
            showToast('Question created and added to bank!', 'success')
            onSuccess()
            onClose()
          },
          onError: (err: any) => {
            setErrorMsg(err.message || 'Failed to create question')
          },
        }
      )
    }
  }

  const isPending = createMut.isPending || updateMut.isPending

  return (
    <div className="modal-overlay open" onClick={onClose} style={{ zIndex: 650 }}>
      <div
        className="modal modal-lg flex flex-col"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: 720 }}
      >
        {/* Modal Header */}
        <div className="modal-hdr modal-hdr-blue shrink-0">
          <div className="modal-title flex items-center gap-2">
            <i className={isEdit ? 'lni lni-pencil-alt' : 'lni lni-plus'}></i>
            <span>{isEdit ? 'Edit Question' : 'Add New Question to Bank'}</span>
          </div>
          <button type="button" className="modal-close" onClick={onClose} disabled={isPending}>
            <i className="lni lni-close"></i>
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="modal-body p-5 flex flex-col gap-4 bg-slate-50 overflow-y-auto max-h-[72vh]">
            {/* Scope Badge Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-white border border-slate-200 rounded-lg shadow-sm text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-500">Course Unit:</span>
                <span className="font-mono bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-bold border border-indigo-200">
                  {courseUnitCode || 'Unit'} {courseUnitName ? `— ${courseUnitName}` : ''}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-500">Category:</span>
                <span className="badge badge-purple">{categoryName || 'Assessment'}</span>
              </div>
            </div>

            {/* Error Banner */}
            {errorMsg && (
              <div className="bg-red-50 border border-red-200 text-red-900 rounded-lg p-3 text-xs flex items-center gap-2">
                <i className="lni lni-warning text-red-600 text-base shrink-0"></i>
                <span className="font-medium">{errorMsg}</span>
              </div>
            )}

            {/* Question Type & Difficulty Level Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-white border border-slate-200 rounded-lg p-3">
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Question Type <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    className={`py-1.5 px-3 rounded text-xs font-semibold border transition-all flex items-center justify-center gap-1.5 ${
                      questionType === 1
                        ? 'bg-purple-50 border-purple-300 text-purple-800 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                    onClick={() => setQuestionType(1)}
                  >
                    <i className="lni lni-radio-button"></i>
                    <span>MCQ</span>
                  </button>
                  <button
                    type="button"
                    className={`py-1.5 px-3 rounded text-xs font-semibold border transition-all flex items-center justify-center gap-1.5 ${
                      questionType === 2
                        ? 'bg-blue-50 border-blue-300 text-blue-800 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                    onClick={() => setQuestionType(2)}
                  >
                    <i className="lni lni-text-format"></i>
                    <span>Descriptive (DQ)</span>
                  </button>
                </div>
              </div>

              {questionType === 1 ? (
                <div className="bg-white border border-slate-200 rounded-lg p-3">
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Difficulty Level <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      className={`py-1.5 px-2 rounded text-xs font-semibold border transition-all ${
                        level === 1
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-800 shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                      onClick={() => setLevel(1)}
                    >
                      L1: Easy
                    </button>
                    <button
                      type="button"
                      className={`py-1.5 px-2 rounded text-xs font-semibold border transition-all ${
                        level === 2
                          ? 'bg-amber-50 border-amber-300 text-amber-800 shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                      onClick={() => setLevel(2)}
                    >
                      L2: Medium
                    </button>
                    <button
                      type="button"
                      className={`py-1.5 px-2 rounded text-xs font-semibold border transition-all ${
                        level === 3
                          ? 'bg-red-50 border-red-300 text-red-800 shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                      onClick={() => setLevel(3)}
                    >
                      L3: Hard
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-lg p-3 flex flex-col justify-center text-xs text-slate-400">
                  <span>Level is not applicable for Descriptive questions.</span>
                </div>
              )}
            </div>

            {/* Question Text */}
            <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-sm">
              <label className="text-xs font-bold text-slate-800 block mb-1.5">
                Question Text <span className="text-red-500">*</span>
              </label>
              <textarea
                className="w-full text-xs text-slate-800 p-2.5 border border-slate-300 rounded-md focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 min-h-[90px] leading-relaxed resize-y"
                placeholder="Enter complete question statement here..."
                value={questionText}
                onChange={e => setQuestionText(e.target.value)}
                required
              />
            </div>

            {/* MCQ Options and Correct Answer Selector */}
            {questionType === 1 ? (
              <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-slate-800">
                    Options & Correct Answer Selection <span className="text-red-500">*</span>
                  </div>
                  <span className="text-[11px] text-indigo-600 font-medium">
                    Click the radio button to designate the correct option
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Option 1 */}
                  <div
                    className={`p-2.5 rounded-lg border flex items-start gap-2 transition-all ${
                      selectedCorrectOptionIndex === 0
                        ? 'bg-emerald-50/70 border-emerald-300 ring-1 ring-emerald-300'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <input
                      type="radio"
                      name="correctOptionRadio"
                      checked={selectedCorrectOptionIndex === 0}
                      onChange={() => setSelectedCorrectOptionIndex(0)}
                      className="mt-1 cursor-pointer"
                      id="opt1-radio"
                    />
                    <div className="flex-1">
                      <label htmlFor="opt1-radio" className="text-[11px] font-bold text-slate-500 block mb-1 cursor-pointer">
                        Option A {selectedCorrectOptionIndex === 0 && <span className="text-emerald-700 font-bold ml-1">(Correct Answer)</span>}
                      </label>
                      <input
                        type="text"
                        className="w-full text-xs p-1.5 border border-slate-300 rounded bg-white"
                        placeholder="Option 1 text..."
                        value={option1Text}
                        onChange={e => setOption1Text(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {/* Option 2 */}
                  <div
                    className={`p-2.5 rounded-lg border flex items-start gap-2 transition-all ${
                      selectedCorrectOptionIndex === 1
                        ? 'bg-emerald-50/70 border-emerald-300 ring-1 ring-emerald-300'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <input
                      type="radio"
                      name="correctOptionRadio"
                      checked={selectedCorrectOptionIndex === 1}
                      onChange={() => setSelectedCorrectOptionIndex(1)}
                      className="mt-1 cursor-pointer"
                      id="opt2-radio"
                    />
                    <div className="flex-1">
                      <label htmlFor="opt2-radio" className="text-[11px] font-bold text-slate-500 block mb-1 cursor-pointer">
                        Option B {selectedCorrectOptionIndex === 1 && <span className="text-emerald-700 font-bold ml-1">(Correct Answer)</span>}
                      </label>
                      <input
                        type="text"
                        className="w-full text-xs p-1.5 border border-slate-300 rounded bg-white"
                        placeholder="Option 2 text..."
                        value={option2Text}
                        onChange={e => setOption2Text(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {/* Option 3 */}
                  <div
                    className={`p-2.5 rounded-lg border flex items-start gap-2 transition-all ${
                      selectedCorrectOptionIndex === 2
                        ? 'bg-emerald-50/70 border-emerald-300 ring-1 ring-emerald-300'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <input
                      type="radio"
                      name="correctOptionRadio"
                      checked={selectedCorrectOptionIndex === 2}
                      onChange={() => setSelectedCorrectOptionIndex(2)}
                      className="mt-1 cursor-pointer"
                      id="opt3-radio"
                    />
                    <div className="flex-1">
                      <label htmlFor="opt3-radio" className="text-[11px] font-bold text-slate-500 block mb-1 cursor-pointer">
                        Option C {selectedCorrectOptionIndex === 2 && <span className="text-emerald-700 font-bold ml-1">(Correct Answer)</span>}
                      </label>
                      <input
                        type="text"
                        className="w-full text-xs p-1.5 border border-slate-300 rounded bg-white"
                        placeholder="Option 3 text..."
                        value={option3Text}
                        onChange={e => setOption3Text(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {/* Option 4 */}
                  <div
                    className={`p-2.5 rounded-lg border flex items-start gap-2 transition-all ${
                      selectedCorrectOptionIndex === 3
                        ? 'bg-emerald-50/70 border-emerald-300 ring-1 ring-emerald-300'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <input
                      type="radio"
                      name="correctOptionRadio"
                      checked={selectedCorrectOptionIndex === 3}
                      onChange={() => setSelectedCorrectOptionIndex(3)}
                      className="mt-1 cursor-pointer"
                      id="opt4-radio"
                    />
                    <div className="flex-1">
                      <label htmlFor="opt4-radio" className="text-[11px] font-bold text-slate-500 block mb-1 cursor-pointer">
                        Option D {selectedCorrectOptionIndex === 3 && <span className="text-emerald-700 font-bold ml-1">(Correct Answer)</span>}
                      </label>
                      <input
                        type="text"
                        className="w-full text-xs p-1.5 border border-slate-300 rounded bg-white"
                        placeholder="Option 4 text..."
                        value={option4Text}
                        onChange={e => setOption4Text(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Descriptive Answer / Rubric */
              <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-sm">
                <label className="text-xs font-bold text-slate-800 block mb-1.5">
                  Expected Answer / Evaluation Rubric <span className="text-red-500">*</span>
                </label>
                <textarea
                  className="w-full text-xs text-slate-800 p-2.5 border border-slate-300 rounded-md focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 min-h-[90px] leading-relaxed resize-y"
                  placeholder="Enter expected answer, key evaluation criteria or sample solution..."
                  value={descriptiveAnswer}
                  onChange={e => setDescriptiveAnswer(e.target.value)}
                  required
                />
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="modal-footer shrink-0 flex items-center justify-end gap-2 p-4 bg-white border-t border-slate-200">
            <button
              type="button"
              className="btn btn-neu"
              onClick={onClose}
              disabled={isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <i className="lni lni-checkmark"></i>
                  <span>{isEdit ? 'Update Question' : 'Save Question'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
