'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'
import { SearchSelect } from '@/components/SearchSelect'
import { useProgramDropdown } from '@/hooks/academic/useProgramMaster'
import type { ProgramDropdownItem } from '@/lib/api/academic/programMaster'
import { SuccessPopup } from '@/components/modals/shared/SuccessPopup'
import { Toast } from '@/components/Toast'
import { usePagePermissions } from '@/hooks/users/usePagePermissions'
import { useSemestersForProgram } from '@/hooks/academic/useSemesters'
import { useIntakesDropdown, useCurrentAcademicIntake } from '@/hooks/academic/useIntakes'
import {
  useUeMarkImportUnits,
  useUeMarkImportExam,
  useDownloadUeMarkImportTemplate,
  useUeMarkImportSheets,
  useUeMarkImportPreview,
  useUeMarkImportImport
} from '@/hooks/assessment/useUeMarkImport'
import { UeMarkImportPreviewItem } from '@/lib/api/assessment/ueMarkImport'
import { hasTheoryMarks } from '@/lib/api/assessment/ueMarks'

export default function UeMarkImportPage() {
  const permissions = usePagePermissions()
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null)
  const showToast = (msg: string, type = 'success') => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current)
    }
    setToast({ msg, type })
    const isErrorOrWarn = ['error', 'err', 'danger', 'warn', 'warning'].includes((type || '').toLowerCase().trim())
    const duration = isErrorOrWarn ? 8000 : 4000
    toastTimerRef.current = setTimeout(() => {
      setToast(null)
      toastTimerRef.current = null
    }, duration)
  }

  const [program, setProgram] = useState<ProgramDropdownItem | null>(null)
  const [semesterGuid, setSemesterGuid] = useState('')
  const [courseUnitGuid, setCourseUnitGuid] = useState('')
  const [intakeGuid, setIntakeGuid] = useState('')
  const [ueType, setUeType] = useState<'0' | '1'>('0') // '0' = Theory, '1' = Practical

  const [file, setFile] = useState<File | null>(null)
  const [sheetNames, setSheetNames] = useState<string[]>([])
  const [selectedSheet, setSelectedSheet] = useState('')

  const [previewRows, setPreviewRows] = useState<UeMarkImportPreviewItem[] | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [successModal, setSuccessModal] = useState<{ title: string; subtitle: string } | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const previewSectionRef = useRef<HTMLDivElement>(null)
  const errorRef = useRef<HTMLDivElement>(null)

  // -- Queries --
  // Lightweight /program-master/dropdown list, not the paged full Programme
  // Master search the old picker used.
  const { data: programs, isLoading: isLoadingPrograms } = useProgramDropdown()
  const { data: semesters, isLoading: isLoadingSemesters } = useSemestersForProgram(program?.programGuid || null, !!program)
  const { data: intakes, isLoading: isLoadingIntakes } = useIntakesDropdown()
  const { data: currentIntake } = useCurrentAcademicIntake()

  // Auto-select current intake
  useEffect(() => {
    if (!intakeGuid && currentIntake?.intakeGuid) {
      setIntakeGuid(currentIntake.intakeGuid)
    } else if (!intakeGuid && intakes && intakes.length > 0) {
      setIntakeGuid(intakes[0].intakeGuid)
    }
  }, [currentIntake, intakes, intakeGuid])

  const {
    data: courseUnits,
    isLoading: isLoadingCourseUnits,
    isFetching: isFetchingCourseUnits
  } = useUeMarkImportUnits(program?.programGuid || '', semesterGuid, !!program && !!semesterGuid)

  // Combined unit support (unitType === 3):
  // When selected unit is Combined, user can choose between Theory (0) and Practical (1).
  // For any other unit, radio is hidden and ueType is strictly 0.
  const selectedUnit = useMemo(() => {
    if (!courseUnitGuid) return null
    return courseUnits?.find(u => u.courseUnitGuid?.toLowerCase() === courseUnitGuid?.toLowerCase()) ?? null
  }, [courseUnits, courseUnitGuid])

  const isCombinedUnit = Number(selectedUnit?.unitType) === 3

  useEffect(() => {
    if (!isCombinedUnit && ueType !== '0') {
      setUeType('0')
    }
  }, [isCombinedUnit, ueType])

  const {
    data: examInfo,
    isLoading: isLoadingExamInfo,
    isFetching: isFetchingExamInfo,
    error: examError,
  } = useUeMarkImportExam(
    program?.programGuid || '',
    semesterGuid,
    courseUnitGuid,
    intakeGuid,
    Number(ueType),
    !!program && !!semesterGuid && !!courseUnitGuid && !!intakeGuid
  )

  const examErrorMessage = useMemo(() => {
    if (!examError || !courseUnitGuid) return null
    const err = examError as { message?: string; errors?: string[] }
    if (Array.isArray(err?.errors) && err.errors.length > 0) {
      return err.errors.filter(Boolean).join('\n')
    }
    return err?.message || null
  }, [examError, courseUnitGuid])

  useEffect(() => {
    if (examErrorMessage && !isFetchingExamInfo) {
      showToast(examErrorMessage, 'error')
    }
  }, [examErrorMessage, isFetchingExamInfo])

  const isTheoryExam = examInfo?.layout === 0
  const isTheoryNoRule = Boolean(isTheoryExam && examInfo && !hasTheoryMarks(examInfo.maxMarks))

  const downloadMut = useDownloadUeMarkImportTemplate()
  const sheetsMut = useUeMarkImportSheets()
  const previewMut = useUeMarkImportPreview()
  const importMut = useUeMarkImportImport()

  const handleClearFile = () => {
    setFile(null)
    setSheetNames([])
    setSelectedSheet('')
    setPreviewRows(null)
    setValidationError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // '' when the selection is cleared.
  const handleProgramChange = (programGuid: string) => {
    setProgram(programs?.find(p => p.programGuid === programGuid) ?? null)
    setSemesterGuid('')
    setCourseUnitGuid('')
    setUeType('0')
    handleClearFile()
  }

  const handleSemesterChange = (val: string) => {
    setSemesterGuid(val)
    setCourseUnitGuid('')
    setUeType('0')
    handleClearFile()
  }

  const handleIntakeChange = (val: string) => {
    setIntakeGuid(val)
    handleClearFile()
  }

  const handleCourseUnitChange = (val: string) => {
    setCourseUnitGuid(val)
    setUeType('0')
    handleClearFile()
  }

  const handleUeTypeChange = (val: '0' | '1') => {
    if (val === ueType) return
    setUeType(val)
    handleClearFile()
  }

  const handleFilePicked = (pickedFile: File) => {
    if (!pickedFile.name.toLowerCase().endsWith('.xlsx')) {
      showToast('Please upload an Excel workbook (.xlsx format)', 'danger')
      return
    }

    setFile(pickedFile)
    setPreviewRows(null)
    setValidationError(null)
    setSheetNames([])
    setSelectedSheet('')

    sheetsMut.mutate(pickedFile, {
      onSuccess: (sheets) => {
        if (sheets && sheets.length > 0) {
          setSheetNames(sheets)
          setSelectedSheet(sheets[0])
          showToast(`Workbook loaded (${sheets.length} sheet(s) detected)`, 'info')
        } else {
          setSheetNames([])
          setSelectedSheet('')
        }
      },
      onError: (err: any) => {
        showToast(err.message || 'Failed to inspect workbook sheets', 'danger')
      }
    })
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFilePicked(files[0])
    }
  }

  const handlePreview = () => {
    if (!file || !examInfo?.universityExamGuid) {
      showToast('Please select a file and ensure exam info is loaded.', 'warn')
      return
    }

    setValidationError(null)
    previewMut.mutate({
      file,
      sheetName: selectedSheet || undefined,
      universityExamGuid: examInfo.universityExamGuid
    }, {
      onSuccess: (data) => {
        setPreviewRows(data)
        showToast(`Preview loaded successfully (${data.length} records)`, 'success')
        setTimeout(() => {
          previewSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }, 100)
      },
      onError: (err: any) => {
        setPreviewRows(null)
        setValidationError(err.message || 'Validation failed.')
        setTimeout(() => {
          errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }, 100)
      }
    })
  }

  const handleImport = () => {
    if (!file || !examInfo?.universityExamGuid) {
      showToast('Missing required fields', 'warn')
      return
    }

    setValidationError(null)
    importMut.mutate({
      file,
      sheetName: selectedSheet || undefined,
      universityExamGuid: examInfo.universityExamGuid
    }, {
      onSuccess: (res) => {
        setSuccessModal({
          title: 'Import Successful',
          subtitle: res.message || 'Marks have been saved successfully.',
        })
        handleClearFile()
      },
      onError: (err: any) => {
        setValidationError(err.message || 'Import failed.')
        showToast(err.message || 'Import failed', 'danger')
      }
    })
  }

  const handleDownloadTemplate = () => {
    if (!examInfo?.universityExamGuid) {
      showToast('Please select Course Unit to resolve exam first.', 'warn')
      return
    }

    setValidationError(null)
    downloadMut.mutate(examInfo.universityExamGuid, {
      onSuccess: () => {
        showToast('Template downloaded successfully.', 'success')
      },
      onError: (err: any) => {
        const errorMsg = err?.message || 'Failed to download template.'
        showToast(errorMsg, 'danger')
        setValidationError(errorMsg)
        setTimeout(() => {
          errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }, 100)
      }
    })
  }

  return (
    <div className="page active">
      <div className="pg-hdr flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div className="flex-1 min-w-0">
          <div className="pg-title flex items-center gap-2 flex-wrap">
            <span>University Exam Mark Import</span>
          </div>
          <div className="pg-sub text-xs text-slate-500">
            Upload and process legacy Excel templates for student marks.
          </div>
        </div>
        {isTheoryNoRule && (
          <div className="px-5 pb-4">
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
              <i className="lni lni-warning text-base text-red-500 flex-shrink-0" />
              <span>The exam rule has no section marks configured for this exam.</span>
            </div>
          </div>
        )}
      </div>

      <div className="card mb-5 p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="fg mb-0">
            <label className="lbl">Academic Intake <span className="text-red-500">*</span></label>
            <SearchSelect
              options={intakes?.map(i => ({ value: i.intakeGuid, label: `${i.intakeCode} — ${i.description}` })) || []}
              value={intakeGuid}
              onChange={handleIntakeChange}
              placeholder={isLoadingIntakes ? 'Loading...' : 'Select Intake'}
            />
          </div>

          <div className="fg mb-0">
            <label className="lbl">Programme <span className="text-red-500">*</span></label>
            <SearchSelect
              options={programs?.map(p => ({ value: p.programGuid, label: `${p.programCode} — ${p.programName}` })) || []}
              value={program?.programGuid || ''}
              onChange={handleProgramChange}
              disabled={isLoadingPrograms}
              placeholder={isLoadingPrograms ? 'Loading...' : '— Select Programme —'}
            />
          </div>

          <div className="fg mb-0">
            <label className="lbl">Semester <span className="text-red-500">*</span></label>
            <SearchSelect
              options={semesters?.map(s => ({ value: s.semesterGuid, label: s.semName })) || []}
              value={semesterGuid}
              onChange={handleSemesterChange}
              disabled={!program || isLoadingSemesters}
              placeholder={!program ? 'Select Programme first' : isLoadingSemesters ? 'Loading...' : 'Select Semester'}
            />
          </div>

          <div className="fg mb-0">
            <label className="lbl">Course Unit <span className="text-red-500">*</span></label>
            <SearchSelect
              options={courseUnits?.map(u => ({
                value: u.courseUnitGuid,
                label: Number(u.unitType) === 3
                  ? `${u.courseUnitCode} — ${u.courseUnitName} (Combined)`
                  : `${u.courseUnitCode} — ${u.courseUnitName}`
              })) || []}
              value={courseUnitGuid}
              onChange={handleCourseUnitChange}
              disabled={!semesterGuid || isLoadingCourseUnits}
              placeholder={!semesterGuid ? 'Select Semester first' : isLoadingCourseUnits ? 'Loading...' : 'Select Course Unit'}
            />
          </div>

          {isCombinedUnit && (
            <div className="fg mb-0">
              <label className="lbl">Exam Component <span className="text-red-500">*</span></label>
              <div className="flex gap-4 items-center h-[38px] px-1">
                <label className="flex items-center gap-2 text-sm cursor-pointer font-medium text-slate-700">
                  <input
                    type="radio"
                    name="ueTypeRadio"
                    value="0"
                    checked={ueType === '0'}
                    onChange={() => handleUeTypeChange('0')}
                  />
                  Theory
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer font-medium text-slate-700">
                  <input
                    type="radio"
                    name="ueTypeRadio"
                    value="1"
                    checked={ueType === '1'}
                    onChange={() => handleUeTypeChange('1')}
                  />
                  Practical
                </label>
              </div>
            </div>
          )}

          <div className="fg mb-0 flex flex-col justify-center">
            <label className="lbl text-slate-400">Maximum Marks</label>
            {isLoadingExamInfo ? (
              <div className="text-sm text-slate-500 animate-pulse">Resolving exam...</div>
            ) : examInfo ? (
              <div className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <span>{examInfo.examRuleTotalMark}</span>
                {examInfo.isVerified && (
                  <span className="badge badge-green">Verified</span>
                )}
              </div>
            ) : (
              <div className="text-sm text-slate-400">---</div>
            )}
          </div>
        </div>

        {examErrorMessage && !isLoadingExamInfo && !isFetchingExamInfo && courseUnitGuid && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
            <i className="lni lni-warning text-base text-red-500 flex-shrink-0" />
            <span className="whitespace-pre-line">{examErrorMessage}</span>
          </div>
        )}
      </div>

      <div className="card mb-5 p-5">
        <div className="card-title mb-4">File Upload</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
          <div className="fg mb-0">
            <label className="lbl">Select File <span className="text-red-500">*</span></label>
            <div className="flex gap-2 items-center">
              <input
                type="file"
                ref={fileInputRef}
                accept=".xlsx"
                onChange={handleFileInputChange}
                className="ctrl flex-1 min-w-0"
                disabled={!examInfo || examInfo.isVerified}
              />
              {/* Same reset as Cancel: clears the file, sheet list and preview. */}
              {file && (
                <button
                  type="button"
                  className="btn btn-neu btn-sm"
                  onClick={handleClearFile}
                  disabled={previewMut.isPending || importMut.isPending}
                  aria-label={`Remove ${file.name}`}
                  title="Remove file"
                >
                  <i className="lni lni-close"></i> Remove
                </button>
              )}
            </div>
          </div>
          <div className="fg mb-0">
            <label className="lbl">Select Sheet <span className="text-red-500">*</span></label>
            <SearchSelect
              options={sheetNames.map(s => ({ value: s, label: s }))}
              value={selectedSheet}
              onChange={setSelectedSheet}
              disabled={!file || sheetNames.length === 0}
              placeholder={!file ? 'Upload file first' : 'Select Sheet'}
            />
          </div>
        </div>

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            className="btn btn-primary bg-indigo-600 text-white"
            onClick={handlePreview}
            disabled={!file || !selectedSheet || previewMut.isPending || isTheoryNoRule}
            title={isTheoryNoRule ? "The exam rule has no section marks configured for this exam." : undefined}
          >
            {previewMut.isPending ? 'Previewing...' : 'Preview'}
          </button>

          {(permissions.import || permissions.add) && (
          <button
            type="button"
            className="btn btn-success"
            onClick={handleImport}
            disabled={!previewRows || previewMut.isPending || importMut.isPending}
          >
            {importMut.isPending ? 'Saving...' : 'Save & Import'}
          </button>
          )}

          <button
            type="button"
            className="btn btn-neu"
            onClick={handleClearFile}
            disabled={!file}
          >
            Cancel
          </button>

          <button
            type="button"
            className="btn btn-neu ml-auto text-blue-600 flex items-center gap-1.5"
            onClick={handleDownloadTemplate}
            disabled={!examInfo || downloadMut.isPending || isTheoryNoRule}
            title={isTheoryNoRule ? 'The exam rule has no section marks configured for this exam.' : undefined}
          >
            <i className={`lni ${downloadMut.isPending ? 'lni-spinner animate-spin' : 'lni-download'}`} />
            {downloadMut.isPending ? 'Downloading...' : 'Template Download'}
          </button>
        </div>
      </div>

      {validationError && (
        <div ref={errorRef} className="card p-4 mb-5 border-red-200 bg-red-50 flex gap-3 items-start">
          <i className="lni lni-warning text-red-500 text-xl mt-0.5"></i>
          <div>
            <h4 className="font-bold text-red-800 text-sm mb-1">Validation Error</h4>
            <p className="text-sm text-red-700 whitespace-pre-line">{validationError}</p>
          </div>
        </div>
      )}

      {previewRows && previewRows.length > 0 && (
        <div ref={previewSectionRef} className="card p-0 overflow-hidden mb-5">
          <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
            <div className="font-bold text-slate-800">
              Preview Marks ({previewRows.length} records)
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="tbl w-full text-xs">
              <thead>
                <tr>
                  <th>Sl No</th>
                  <th>Matching Code</th>
                  {isTheoryExam ? (
                    <>
                      {examInfo?.maxMarks.sectionAMax != null && <th>Section A ({examInfo.maxMarks.sectionAMax})</th>}
                      {examInfo?.maxMarks.sectionBMax != null && <th>Section B ({examInfo.maxMarks.sectionBMax})</th>}
                      {examInfo?.maxMarks.sectionCMax != null && <th>Section C ({examInfo.maxMarks.sectionCMax})</th>}
                    </>
                  ) : (
                    <>
                      {previewRows.some(r => r.sectionAMark !== null) && <th>Section A</th>}
                      {previewRows.some(r => r.sectionBMark !== null) && <th>Section B</th>}
                      {previewRows.some(r => r.sectionCMark !== null) && <th>Section C</th>}
                      {(examInfo?.maxMarks.recordMax != null || previewRows.some(r => r.recordMark !== null)) && (
                        <th>Record {examInfo?.maxMarks.recordMax != null ? `(${examInfo.maxMarks.recordMax})` : ''}</th>
                      )}
                      {(examInfo?.maxMarks.codingMax != null || previewRows.some(r => r.codingMark !== null)) && (
                        <th>Coding {examInfo?.maxMarks.codingMax != null ? `(${examInfo.maxMarks.codingMax})` : ''}</th>
                      )}
                      {(examInfo?.maxMarks.outputMax != null || previewRows.some(r => r.outputMark !== null)) && (
                        <th>Output {examInfo?.maxMarks.outputMax != null ? `(${examInfo.maxMarks.outputMax})` : ''}</th>
                      )}
                      {(examInfo?.maxMarks.vivaMax != null || previewRows.some(r => r.vivaMark !== null)) && (
                        <th>Viva {examInfo?.maxMarks.vivaMax != null ? `(${examInfo.maxMarks.vivaMax})` : ''}</th>
                      )}
                      {previewRows.some(r => r.synopsisMark !== null) && <th>Synopsis</th>}
                      {previewRows.some(r => r.reviewMark !== null) && <th>Review</th>}
                      {previewRows.some(r => r.methodologyMark !== null) && <th>Methodology</th>}
                      {previewRows.some(r => r.analysisMark !== null) && <th>Analysis</th>}
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {previewRows.map((row, i) => (
                  <tr key={i}>
                    <td>{row.slNo}</td>
                    <td className="font-mono font-medium text-slate-800">{row.matchingCode || '—'}</td>
                    {isTheoryExam ? (
                      <>
                        {examInfo?.maxMarks.sectionAMax != null && <td className="font-mono">{row.sectionAMark ?? '—'}</td>}
                        {examInfo?.maxMarks.sectionBMax != null && <td className="font-mono">{row.sectionBMark ?? '—'}</td>}
                        {examInfo?.maxMarks.sectionCMax != null && <td className="font-mono">{row.sectionCMark ?? '—'}</td>}
                      </>
                    ) : (
                      <>
                        {previewRows.some(r => r.sectionAMark !== null) && <td className="font-mono">{row.sectionAMark}</td>}
                        {previewRows.some(r => r.sectionBMark !== null) && <td className="font-mono">{row.sectionBMark}</td>}
                        {previewRows.some(r => r.sectionCMark !== null) && <td className="font-mono">{row.sectionCMark}</td>}
                        {(examInfo?.maxMarks.recordMax != null || previewRows.some(r => r.recordMark !== null)) && (
                          <td className="font-mono">{row.recordMark ?? '—'}</td>
                        )}
                        {(examInfo?.maxMarks.codingMax != null || previewRows.some(r => r.codingMark !== null)) && (
                          <td className="font-mono">{row.codingMark ?? '—'}</td>
                        )}
                        {(examInfo?.maxMarks.outputMax != null || previewRows.some(r => r.outputMark !== null)) && (
                          <td className="font-mono">{row.outputMark ?? '—'}</td>
                        )}
                        {(examInfo?.maxMarks.vivaMax != null || previewRows.some(r => r.vivaMark !== null)) && (
                          <td className="font-mono">{row.vivaMark ?? '—'}</td>
                        )}
                        {previewRows.some(r => r.synopsisMark !== null) && <td className="font-mono">{row.synopsisMark}</td>}
                        {previewRows.some(r => r.reviewMark !== null) && <td className="font-mono">{row.reviewMark}</td>}
                        {previewRows.some(r => r.methodologyMark !== null) && <td className="font-mono">{row.methodologyMark}</td>}
                        {previewRows.some(r => r.analysisMark !== null) && <td className="font-mono">{row.analysisMark}</td>}
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {successModal && (
        <SuccessPopup
          title={successModal.title}
          subtitle={successModal.subtitle}
          onClose={() => setSuccessModal(null)}
        />
      )}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  )
}
