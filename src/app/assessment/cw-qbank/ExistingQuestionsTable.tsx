'use client'

import React, { useState, useMemo } from 'react'
import { ScrollTable } from '@/components/ScrollTable'
import { TableSearch } from '@/components/TableSearch'
import { RichTextDisplay, stripHtmlTags } from '@/components/RichTextEditor'
import { QuestionDto } from '@/lib/api/assessment/questions'

interface ExistingQuestionsTableProps {
  questions: QuestionDto[]
  isLoading: boolean
  isFetching: boolean
  onRefresh: () => void
  onUploadClick: () => void
  onDeleteBankClick: () => void
  onViewQuestion: (q: QuestionDto) => void
  courseUnitCode?: string | null
  courseUnitName?: string | null
  categoryName?: string | null
  intakeCode?: string | number | null
}

export function ExistingQuestionsTable({
  questions,
  isLoading,
  isFetching,
  onRefresh,
  onUploadClick,
  onDeleteBankClick,
  onViewQuestion,
  courseUnitCode,
  courseUnitName,
  categoryName,
  intakeCode,
}: ExistingQuestionsTableProps) {
  const [filterType, setFilterType] = useState<'ALL' | 'MCQ' | 'DQ'>('ALL')
  const [search, setSearch] = useState('')

  const mcqCount = useMemo(() => questions.filter(q => q.questionType === 1).length, [questions])
  const dqCount = useMemo(() => questions.filter(q => q.questionType === 2).length, [questions])

  const filteredQuestions = useMemo(() => {
    return questions.filter(q => {
      if (filterType === 'MCQ' && q.questionType !== 1) return false
      if (filterType === 'DQ' && q.questionType !== 2) return false
      if (search.trim()) {
        const needle = search.toLowerCase()
        const matchQ = q.questionText?.toLowerCase().includes(needle)
        const matchAns = q.answerText?.toLowerCase().includes(needle)
        const matchOpts =
          q.option1Text?.toLowerCase().includes(needle) ||
          q.option2Text?.toLowerCase().includes(needle) ||
          q.option3Text?.toLowerCase().includes(needle) ||
          q.option4Text?.toLowerCase().includes(needle)
        return matchQ || matchAns || matchOpts
      }
      return true
    })
  }, [questions, filterType, search])

  return (
    <div className="card p-5">
      <div className="flex flex-wrap items-center justify-between pb-3 mb-4 border-b border-slate-100 gap-2">
        <div>
          <div className="card-title flex items-center gap-2 mb-1">
            <span className="ctitle-icon">
              <i className="lni lni-library"></i>
            </span>
            <span>Questions Already Uploaded in Bank</span>
            <span className="badge badge-green ml-2 font-bold">
              {questions.length} Questions
            </span>
          </div>
          <div className="text-xs text-slate-500">
            Course Unit: <strong className="text-slate-800 font-mono">{courseUnitCode || 'Selected Unit'}</strong>
            {courseUnitName && <span> — {courseUnitName}</span>}
            {' • '}
            Category: <strong className="text-slate-800">{categoryName || 'Category'}</strong>
            {' • '}
            Intake: <strong className="text-slate-800">{intakeCode || 'Active Intake'}</strong>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="btn btn-primary btn-sm flex items-center gap-1.5 shadow-xs"
            onClick={onUploadClick}
            title="Upload an Excel file to add or replace questions"
          >
            <i className="lni lni-cloud-upload"></i>
            <span>Upload / Replace via Excel</span>
          </button>

          <button
            type="button"
            className="btn btn-neu btn-sm flex items-center gap-1.5"
            onClick={onRefresh}
            disabled={isFetching}
            title="Refresh question bank from database"
          >
            <i className={`lni lni-reload ${isFetching ? 'animate-spin' : ''}`}></i>
            <span>Refresh</span>
          </button>

          <button
            type="button"
            className="btn btn-danger btn-sm flex items-center gap-1.5"
            onClick={onDeleteBankClick}
            title="Delete all questions in this bank"
          >
            <i className="lni lni-trash-can"></i>
            <span>Delete All</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar with Counts & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200/70">
          <button
            type="button"
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
              filterType === 'ALL'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            onClick={() => setFilterType('ALL')}
          >
            <span>All Questions</span>
            <span className="badge badge-neu text-[11px] font-bold px-1.5 py-0.2">
              {questions.length}
            </span>
          </button>
          <button
            type="button"
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
              filterType === 'MCQ'
                ? 'bg-white text-purple-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            onClick={() => setFilterType('MCQ')}
          >
            <span>Multiple Choice</span>
            <span className="badge badge-purple text-[11px] font-bold px-1.5 py-0.2">
              {mcqCount}
            </span>
          </button>
          <button
            type="button"
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
              filterType === 'DQ'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            onClick={() => setFilterType('DQ')}
          >
            <span>Descriptive</span>
            <span className="badge badge-blue text-[11px] font-bold px-1.5 py-0.2">
              {dqCount}
            </span>
          </button>
        </div>

        <TableSearch
          className="w-full sm:w-72"
          placeholder="Search question text or answer..."
          value={search}
          onChange={setSearch}
          results={filteredQuestions.slice(0, 5).map(q => ({
            id: q.questionGuid,
            primary: stripHtmlTags(q.questionText) || 'Untitled Question',
            secondary: `${q.questionType === 1 ? 'MCQ' : 'DQ'} • Ans: ${stripHtmlTags(q.answerText)}`,
          }))}
          onSelect={r => setSearch(r.primary)}
        />
      </div>

      {/* Existing Questions Table */}
      <ScrollTable maxHeight="540px">
        <table style={{ minWidth: 880, width: '100%' }}>
          <thead className="sticky top-0 z-10 shadow-xs">
            <tr>
              <th style={{ width: 60, textAlign: 'center' }}>ACTION</th>
              <th style={{ width: 45, textAlign: 'center' }}>#</th>
              <th style={{ width: 85, textAlign: 'center' }}>TYPE</th>
              <th style={{ minWidth: 280, maxWidth: 460 }}>QUESTION</th>
              <th style={{ minWidth: 260 }}>OPTIONS</th>
              <th style={{ minWidth: 160 }}>ANSWER</th>
              <th style={{ width: 80, textAlign: 'center' }}>SECTION</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-500">
                  <span className="inline-block w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mr-2"></span>
                  Loading existing question bank...
                </td>
              </tr>
            ) : filteredQuestions.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400 italic">
                  No questions match the selected filter criteria.
                </td>
              </tr>
            ) : (
              filteredQuestions.map((q, idx) => (
                <tr key={q.questionGuid || idx} className="hover:bg-slate-50/80 transition-colors">
                  {/* Action */}
                  <td style={{ textAlign: 'center' }}>
                    <button
                      type="button"
                      className="btn btn-neu btn-xs"
                      onClick={() => onViewQuestion(q)}
                      title="View full question details"
                    >
                      <i className="lni lni-eye"></i> View
                    </button>
                  </td>

                  {/* # */}
                  <td style={{ textAlign: 'center', color: '#64748b', fontWeight: 600 }}>
                    {idx + 1}
                  </td>

                  {/* Type */}
                  <td style={{ textAlign: 'center' }}>
                    <span className={`badge ${q.questionType === 1 ? 'badge-purple' : 'badge-blue'} text-xs font-bold`}>
                      {q.questionType === 1 ? 'MCQ' : 'DQ'}
                    </span>
                  </td>

                  {/* Question */}
                  <td style={{ whiteSpace: 'normal', maxWidth: 460 }}>
                    <div className="font-medium text-slate-900 line-clamp-3 leading-snug">
                      <RichTextDisplay content={q.questionText} />
                    </div>
                  </td>

                  {/* Options */}
                  <td style={{ whiteSpace: 'normal', minWidth: 260 }}>
                    {q.questionType === 1 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
                        <div className="bg-slate-50 border border-slate-200/80 px-2 py-1 rounded truncate">
                          <strong className="text-slate-500 mr-1 font-mono">A:</strong> {stripHtmlTags(q.option1Text)}
                        </div>
                        <div className="bg-slate-50 border border-slate-200/80 px-2 py-1 rounded truncate">
                          <strong className="text-slate-500 mr-1 font-mono">B:</strong> {stripHtmlTags(q.option2Text)}
                        </div>
                        <div className="bg-slate-50 border border-slate-200/80 px-2 py-1 rounded truncate">
                          <strong className="text-slate-500 mr-1 font-mono">C:</strong> {stripHtmlTags(q.option3Text)}
                        </div>
                        <div className="bg-slate-50 border border-slate-200/80 px-2 py-1 rounded truncate">
                          <strong className="text-slate-500 mr-1 font-mono">D:</strong> {stripHtmlTags(q.option4Text)}
                        </div>
                      </div>
                    ) : (
                      <span className="text-slate-400 text-xs italic">Descriptive (No options)</span>
                    )}
                  </td>

                  {/* Answer */}
                  <td style={{ whiteSpace: 'normal', minWidth: 160 }}>
                    {q.questionType === 1 ? (
                      <span className="inline-block bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11.5px] px-2.5 py-1 rounded font-medium font-mono font-bold">
                        {stripHtmlTags(q.answerText)}
                      </span>
                    ) : (
                      <span className="inline-block bg-slate-50 border border-slate-200 text-slate-700 text-xs px-2.5 py-1 rounded font-medium max-w-[220px] truncate" title={stripHtmlTags(q.answerText)}>
                        <RichTextDisplay content={q.answerText} />
                      </span>
                    )}
                  </td>

                  {/* Section */}
                  <td style={{ textAlign: 'center' }}>
                    {q.level ? (
                      <span className="badge badge-neu text-xs font-mono font-semibold">
                        {q.level === 1 ? 'Sec A' : q.level === 2 ? 'Sec B' : q.level === 3 ? 'Sec C' : `L${q.level}`}
                      </span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </ScrollTable>
    </div>
  )
}

