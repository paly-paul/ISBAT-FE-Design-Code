'use client'

import React, { useState, useRef, useEffect } from 'react'
import { SearchSelect } from '@/components/SearchSelect'
import { Toast } from '@/components/Toast'
import { useCurrentAcademicIntake } from '@/hooks/academic/useIntakes'
import { 
  getPracticalCourseUnits, 
  previewPracticalQuestionBank,
  importPracticalQuestionBank, 
  deletePracticalQuestionBank, 
  PreviewQuestion
} from '@/lib/api/assessment/questionBankPractical'
import { postQuestionBankSheets, getQuestionBankTemplate } from '@/lib/api/assessment/questionBank'

export default function QuestionBankPracticalPage() {
  const [courseUnitGuid, setCourseUnitGuid] = useState<string>('')
  const [file, setFile] = useState<File | null>(null)
  const [sheetName, setSheetName] = useState<string>('')
  const [availableSheets, setAvailableSheets] = useState<string[]>([])
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [courseUnits, setCourseUnits] = useState<{ value: string, label: string }[]>([])
  const [previewData, setPreviewData] = useState<PreviewQuestion[] | null>(null)
  
  const { data: currentIntake } = useCurrentAcademicIntake()
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const previewGridRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    getPracticalCourseUnits().then(units => {
      setCourseUnits(units.map(u => ({
        value: u.courseUnitGuid,
        label: `${u.courseUnitCode ? u.courseUnitCode + ' - ' : ''}${u.courseUnitName || 'Unnamed Unit'}`
      })))
    }).catch(err => {
      console.error('Failed to load course units', err)
      showToast('Failed to load course units', 'error')
    })
  }, [])

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const sheetOptions = availableSheets.map(s => ({ value: s, label: s }))

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (selected) {
      setFile(selected)
      setSheetName('') 
      setAvailableSheets([])
      setPreviewData(null) // Reset preview on new file
      
      try {
        const sheets = await postQuestionBankSheets(selected)
        setAvailableSheets(sheets)
        if (sheets.length > 0) setSheetName(sheets[0])
      } catch (err) {
        showToast('Failed to read sheets from the file.', 'error')
      }
    }
  }

  // "Import" button triggers the preview grid
  const handlePreview = async () => {
    if (!currentIntake?.intakeGuid) return showToast('No active intake found.', 'error')
    if (!courseUnitGuid) return showToast('Please select a course unit.', 'error')
    if (!file) return showToast('Please select a file.', 'error')
    if (!sheetName) return showToast('Please select a sheet.', 'error')
    
    setLoading(true)
    setPreviewData(null)
    try {
      // previewPracticalQuestionBank returns just the data array on success,
      // or throws an error with the validation message on failure.
      const data = await previewPracticalQuestionBank(courseUnitGuid, file, sheetName, currentIntake.intakeGuid)
      if (data) {
        setPreviewData(data)
        showToast('Preview loaded successfully!', 'success')
        // Automatically scroll to the preview grid after render
        setTimeout(() => {
          previewGridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }, 100)
      }
    } catch (err: any) {
      showToast(err?.message || 'Failed to preview question bank.', 'error')
    } finally {
      setLoading(false)
    }
  }

  // "Upload" button triggers the final save
  const handleUpload = async () => {
    if (!currentIntake?.intakeGuid) return showToast('No active intake found.', 'error')
    if (!courseUnitGuid || !file || !sheetName) return
    if (!previewData) return showToast('Please preview (Import) the data first.', 'error')

    setLoading(true)
    try {
      await importPracticalQuestionBank(courseUnitGuid, file, sheetName, currentIntake.intakeGuid)
      showToast('Question bank imported successfully.', 'success')
      handleCancel()
    } catch (err: any) {
      showToast(err?.message || 'Failed to save question bank.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!currentIntake?.intakeGuid) return showToast('No active intake found.', 'error')
    if (!courseUnitGuid) return showToast('Please select a course unit.', 'error')
    
    if (!confirm('Are you sure you want to delete all Practical questions for this course unit in the current intake?')) return

    setLoading(true)
    try {
      await deletePracticalQuestionBank(courseUnitGuid, currentIntake.intakeGuid)
      showToast('Questions deleted successfully.', 'success')
      handleCancel()
    } catch (err: any) {
      showToast(err?.message || 'Failed to delete question bank.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setFile(null)
    setCourseUnitGuid('')
    setSheetName('')
    setAvailableSheets([])
    setPreviewData(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleDownloadTemplate = async () => {
    setLoading(true)
    try {
      const res = await getQuestionBankTemplate()
      if (res && res.url) {
        window.location.href = res.url
      } else {
        throw new Error('Template URL not received')
      }
    } catch (err) {
      showToast('Failed to download template.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page active" id="page-question-bank-practical">
      
      {/* ── Breadcrumbs & Navigation Header ── */}
      <div className="pg-hdr flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1 flex-wrap">
            <span className="font-bold text-slate-700">Assessment</span>
            <i className="lni lni-chevron-right text-[10px] text-slate-400"></i>
            <span className="font-bold text-slate-700">Question Bank</span>
          </div>
          <div className="pg-title flex items-center gap-2 flex-wrap">
            <span>UE Practical Question Bank Import</span>
          </div>
        </div>
      </div>
      
      <div className="card max-w-5xl shadow-sm border border-slate-200 overflow-hidden !p-0">
        
        {/* Full-width Blue Header */}
        <div 
          className="px-6 py-4 flex items-center border-b border-blue-600/30" 
          style={{ background: 'linear-gradient(135deg, var(--b500), var(--b700))' }}
        >
          <h2 className="text-white font-bold text-lg m-0">
            UE Practical Question Bank Import for Combined Course Units
          </h2>
        </div>
        
        {/* Form Body Wrapper with Padding */}
        <div className="p-6 md:p-8 space-y-6 bg-white">
          
          {/* Course Unit Row */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="w-40 text-base font-bold text-slate-700">
              Course Unit<span className="text-red-500">*</span>
            </div>
            <div className="w-full sm:w-80 text-base">
              <SearchSelect 
                options={courseUnits}
                value={courseUnitGuid}
                onChange={setCourseUnitGuid}
                placeholder="-Select-"
              />
            </div>
          </div>

          {/* Select File Row */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="w-40 text-base font-bold text-slate-700">
              Select File<span className="text-red-500">*</span>
            </div>
            <div className="w-full sm:w-80 flex items-center border-2 border-dashed border-slate-300 hover:border-blue-400 bg-slate-50 hover:bg-blue-50/20 transition-colors rounded-lg p-2.5 cursor-pointer">
              <input
                type="file"
                ref={fileInputRef}
                accept=".xls,.xlsx"
                onChange={handleFileChange}
                className="w-full text-base text-slate-700 file:mr-3 file:py-1.5 file:px-4 file:border file:border-slate-200 file:rounded file:text-base file:bg-white file:text-slate-700 hover:file:bg-slate-100 file:cursor-pointer file:shadow-sm outline-none cursor-pointer"
              />
            </div>
          </div>

          {/* Select Sheet Row */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="w-40 text-base font-bold text-slate-700">
              Select Sheet<span className="text-red-500">*</span>
            </div>
            <div className="w-full sm:w-80">
              <SearchSelect 
                options={sheetOptions}
                value={sheetName}
                onChange={setSheetName}
                placeholder={file ? "-Select-" : ""}
                disabled={!file}
              />
            </div>
            <div className="flex items-center gap-2 mt-2 sm:mt-0">
              <button type="button" className="btn btn-primary btn-sm px-6 font-semibold shadow-sm" onClick={handlePreview} disabled={loading}>
                {loading && !previewData ? 'Previewing...' : 'Import'}
              </button>
              <button type="button" className="btn btn-danger btn-sm px-6 font-semibold shadow-sm" onClick={handleDelete} disabled={loading}>
                Delete
              </button>
            </div>
          </div>

          {/* Action Buttons Row */}
          <div className="flex flex-wrap items-center gap-3 pt-6">
            <button type="button" className="btn btn-primary px-8 font-semibold shadow-sm" onClick={handleUpload} disabled={loading || !previewData}>
              Upload
            </button>
            <button type="button" className="btn btn-neu px-8 font-semibold shadow-sm" onClick={handleCancel} disabled={loading}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary px-6 font-semibold shadow-sm" onClick={handleDownloadTemplate} disabled={loading}>
              Template Download
            </button>
          </div>

        </div>
      </div>

      {/* Preview Grid */}
      {previewData && (
        <div ref={previewGridRef} className="card max-w-5xl shadow-sm border border-slate-200 mt-6 overflow-hidden !p-0">
          <div className="bg-slate-100 border-b border-slate-200 px-6 py-3">
            <h3 className="font-bold text-slate-700 m-0 text-sm">Preview Data ({previewData.length} questions)</h3>
          </div>
          <div className="p-0 overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-semibold">
                <tr>
                  <th className="px-4 py-3 whitespace-nowrap">Sl No</th>
                  <th className="px-4 py-3 whitespace-nowrap">Type</th>
                  <th className="px-4 py-3 min-w-[300px]">Question</th>
                  <th className="px-4 py-3 whitespace-nowrap">Option 1</th>
                  <th className="px-4 py-3 whitespace-nowrap">Option 2</th>
                  <th className="px-4 py-3 whitespace-nowrap">Option 3</th>
                  <th className="px-4 py-3 whitespace-nowrap">Option 4</th>
                  <th className="px-4 py-3 whitespace-nowrap">Answer</th>
                  <th className="px-4 py-3 whitespace-nowrap">Level</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {previewData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3">{row.slNo}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${row.questionType === 'MCQ' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                        {row.questionType}
                      </span>
                    </td>
                    <td className="px-4 py-3 line-clamp-2" title={row.question}>{row.question}</td>
                    <td className="px-4 py-3 truncate max-w-[150px]" title={row.option1}>{row.option1}</td>
                    <td className="px-4 py-3 truncate max-w-[150px]" title={row.option2}>{row.option2}</td>
                    <td className="px-4 py-3 truncate max-w-[150px]" title={row.option3}>{row.option3}</td>
                    <td className="px-4 py-3 truncate max-w-[150px]" title={row.option4}>{row.option4}</td>
                    <td className="px-4 py-3 font-medium text-slate-700">{row.answer}</td>
                    <td className="px-4 py-3">{row.level}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {toast && <Toast toast={toast} />}
    </div>
  )
}
