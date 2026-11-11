'use client'

import { useState, useEffect, useRef } from 'react'
import { Toast } from '@/components/Toast'
import { usePagePermissions } from '@/hooks/users/usePagePermissions'
import { SearchSelect } from '@/components/SearchSelect'
import DatePicker from '@/components/DatePicker'
import TimeRangePicker, { isTimeRangeValid } from '@/components/TimeRangePicker'
import { useIaUeSchedule, useUpdateIaUeSchedule } from '@/hooks/assessment/useIaUeSchedule'
import { useExamRules } from '@/hooks/assessment/useExamRules'
import { SuccessPopup } from '@/components/modals/shared/SuccessPopup'
import { ExamRuleLookupModal } from './ExamRuleLookupModal'
import { extractApiErrorMessage } from '@/lib/errorMessages'

interface UeScheduleModalProps {
  isOpen: boolean
  onClose: () => void
  examGuid: string | null
  unitCode: string
  unitName: string
}

function getTodayYmd(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function UeScheduleModal({ isOpen, onClose, examGuid, unitCode, unitName }: UeScheduleModalProps) {
  const permissions = usePagePermissions('/assessment/ia-creation')
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null)
  const modalBodyRef = useRef<HTMLDivElement | null>(null)
  const [saved, setSaved] = useState(false)
  const showToast = (msg: string, type: string = 'success') => {
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

  // Fetch current schedule
  const { data: schedule, isLoading } = useIaUeSchedule(examGuid)
  const updateMut = useUpdateIaUeSchedule(examGuid || '')

  // Form State
  const [examDate, setExamDate] = useState<string>(getTodayYmd)
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [maxMark, setMaxMark] = useState<number | ''>(70)
  const [examType, setExamType] = useState<number>(0)
  const [publishStatus, setPublishStatus] = useState<number>(0)
  const [examRuleGuid, setExamRuleGuid] = useState<string>('')
  const [lookupOpen, setLookupOpen] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  function handleExamDateChange(d: string) {
    setFormError(null)
    const today = getTodayYmd()
    if (d && d < today) {
      showToast('Before date is not possible', 'error')
      return
    }
    setExamDate(d)
  }

  // Fetch Exam Rules for the dropdown
  const { data: rulesData, isLoading: rulesLoading } = useExamRules(1, 100, '', isOpen)
  const activeRules = rulesData?.items?.filter(r => r.status !== 3) || []
  const ruleOptions = activeRules.map(r => ({
    value: r.examRuleGuid,
    label: `${r.ruleCode} - ${r.ruleName}`
  }))

  // Populate form when data loads
  useEffect(() => {
    if (schedule && isOpen) {
      // If the schedule was already saved with valid start and end times, preserve the saved date.
      // Otherwise (newly scheduling or backend default placeholder in July), default to current date (ASM-018).
      const isAlreadyScheduled = Boolean(
        schedule.startTime &&
        schedule.endTime &&
        schedule.startTime !== '00:00:00' &&
        schedule.startTime !== '00:00'
      )

      if (isAlreadyScheduled && schedule.examDate) {
        setExamDate(schedule.examDate.split('T')[0])
      } else {
        setExamDate(getTodayYmd())
      }
      
      setStartTime(schedule.startTime ? schedule.startTime.slice(0, 5) : '')
      setEndTime(schedule.endTime ? schedule.endTime.slice(0, 5) : '')
      setMaxMark(schedule.maxMark && schedule.maxMark > 0 ? schedule.maxMark : 70)
      setExamType(schedule.examType ?? 0)
      setPublishStatus(schedule.publishStatus ?? 0)
      
      if (schedule.examRuleGuid) {
        setExamRuleGuid(schedule.examRuleGuid)
      } else {
        setExamRuleGuid('')
      }
      setFormError(null)
    } else if (!isOpen) {
      // reset form when closed
      setExamDate(getTodayYmd())
      setStartTime('')
      setEndTime('')
      setMaxMark(70)
      setExamType(0)
      setPublishStatus(0)
      setExamRuleGuid('')
      setFormError(null)
    }
  }, [schedule, isOpen])

  async function handleSave() {
    if (!examGuid) return
    setFormError(null)

    // Validation
    if (!examDate || !startTime || !endTime) {
      const msg = 'Exam Date and Start/End Times are required'
      setFormError(msg)
      return
    }
    
    // Check if end time is after start time
    if (!isTimeRangeValid(startTime, endTime)) {
      const msg = 'End Time must be after Start Time'
      setFormError(msg)
      return
    }

    if (maxMark === '') {
      const msg = 'Max Mark is required'
      setFormError(msg)
      return
    }
    if (Number(maxMark) < 0) {
      const msg = 'Max Mark cannot be negative'
      setFormError(msg)
      return
    }
    if (!examRuleGuid) {
      const msg = 'Exam rule is required.'
      setFormError(msg)
      return
    }

    try {
      // universityExamType is not sent: the backend reads it from the exam row.
      await updateMut.mutateAsync({
        examDate,
        startTime: `${startTime}:00`,
        endTime: `${endTime}:00`,
        maxMark: Number(maxMark),
        examType,
        publishStatus,
        examRuleGuid,
      })
      showToast('University Exam Scheduled successfully')
      setSaved(true)
    } catch (err: any) {
      // One line per backend error, so "Question paper does not satisfy the exam rule:"
      // keeps its list of problems readable.
      const list: string[] = Array.isArray(err?.errors) ? err.errors.filter(Boolean) : []
      const errorMsg = list.length > 1 ? list.join('\n') : extractApiErrorMessage(err, 'Failed to save schedule.')
      setFormError(errorMsg)
    }
  }

  if (!isOpen) return null

  if (saved) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
          <SuccessPopup
            title="University Exam Scheduled!"
            subtitle="The university exam schedule has been saved successfully."
            onClose={() => { setSaved(false); onClose(); }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay open">
      <div className="modal modal-md" style={{ maxWidth: '700px', borderRadius: '12px', height: 'auto', maxHeight: '90vh', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-hdr modal-hdr-blue" style={{ display: 'flex', alignItems: 'center', padding: '16px 20px' }}>
          <div className="modal-title text-white font-medium text-base" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className="lni lni-graduation" style={{ fontSize: '18px' }}></i> Schedule University Exam
          </div>
          <button className="modal-close text-white hover:text-white/80 transition-colors" onClick={onClose} style={{ marginLeft: 'auto', background: 'transparent', border: 'none', cursor: 'pointer' }}>
            <i className="lni lni-close" style={{ fontSize: '18px' }}></i>
          </button>
        </div>

        {/* Content */}
        <div ref={modalBodyRef} className="p-6 bg-white overflow-y-auto" style={{ maxHeight: 'calc(90vh - 60px)' }}>
          <div className={`transition-opacity duration-300 ${isLoading ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
            
            <div className="mb-6 border-b border-slate-200 pb-4">
                <div className="text-sm text-slate-500 font-medium mb-1">University Exam for Subject:</div>
                <div className="text-lg font-semibold text-slate-900">
                    {unitCode} — {unitName}
                </div>
            </div>

            {/* ASM-045: Notice to upload question paper before scheduling */}
            <div className="mb-6 p-3.5 bg-amber-50/90 border border-amber-200 rounded-lg flex items-start gap-3 text-xs text-amber-900 shadow-xs">
              <i className="lni lni-warning text-amber-600 text-base shrink-0 mt-0.5"></i>
              <div className="leading-relaxed">
                <span className="font-semibold text-amber-950">Notice:</span> Please ensure the question paper is uploaded before scheduling the exam.
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Date */}
              <div>
                <label className="lbl">Exam Date <span className="text-red-500">*</span></label>
                <div className="mt-1">
                  <DatePicker 
                    value={examDate} 
                    onChange={handleExamDateChange} 
                    minYmd={getTodayYmd()} 
                    rangeMessage="Before date is not possible"
                    onError={msg => showToast(msg, 'error')}
                  />
                </div>
              </div>

              {/* Times */}
              <TimeRangePicker start={startTime} end={endTime} onStartChange={setStartTime} onEndChange={setEndTime} required />


              {/* Marks */}
              <div>
                <label className="lbl">Max Mark <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="ctrl w-full mt-1"
                  value={maxMark}
                  onChange={e => setMaxMark(e.target.value === '' ? '' : Number(e.target.value))}
                />
              </div>

              {/* Exam Rule Picker */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="lbl mb-0">Exam Rule <span className="text-red-500">*</span></label>
                  <button 
                    className="text-[13px] text-[#3a6bc9] hover:underline" 
                    onClick={() => setLookupOpen(true)}
                  >
                    View Rule Details
                  </button>
                </div>
                <SearchSelect
                  options={ruleOptions}
                  value={examRuleGuid}
                  onChange={val => setExamRuleGuid(val)}
                  placeholder={rulesLoading ? "Loading rules..." : "Select Exam Rule..."}
                  className="w-full mt-1"
                  disabled={isLoading || rulesLoading}
                />
              </div>

              {/* Exam Type */}
              <div>
                <label className="lbl">Exam Type <span className="text-red-500">*</span></label>
                <div className="flex gap-4 mt-2">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name="examType"
                      checked={examType === 0}
                      onChange={() => setExamType(0)}
                    />
                    Online
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name="examType"
                      checked={examType === 1}
                      onChange={() => setExamType(1)}
                    />
                    Offline
                  </label>
                </div>
              </div>

              {/* UE Type: fixed on the exam row, shown read-only */}
              <div>
                <label className="lbl">UE Type</label>
                <div className="mt-2 text-sm font-medium text-g900">
                  {schedule ? (schedule.universityExamType === 1 ? 'Practical' : 'Theory') : '—'}
                </div>
              </div>

              {/* Publish Status */}
              <div>
                <label className="lbl">Publish Status <span className="text-red-500">*</span></label>
                <div className="flex gap-4 mt-2">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name="publishStatus"
                      checked={publishStatus === 0}
                      onChange={() => setPublishStatus(0)}
                    />
                    Not publish to student
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name="publishStatus"
                      checked={publishStatus === 1}
                      onChange={() => setPublishStatus(1)}
                    />
                    Publish to student
                  </label>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-slate-200">
              {formError && (
                <div className="mb-4 p-3.5 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 text-xs text-red-900 shadow-xs">
                  <i className="lni lni-warning text-red-600 text-base shrink-0 mt-0.5"></i>
                  <div className="leading-relaxed font-semibold whitespace-pre-line">{formError}</div>
                </div>
              )}
              <div className="flex justify-end gap-3">
                <button className="btn btn-neu" onClick={onClose} disabled={updateMut.isPending}>
                  Cancel
                </button>
                {(permissions.add || permissions.edit) && (
                <button
                  className="btn btn-primary"
                  onClick={handleSave}
                  disabled={updateMut.isPending || isLoading}
                >
                  {updateMut.isPending ? 'Saving...' : 'Save Schedule'}
                </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Toast toast={toast} onClose={() => setToast(null)} />
      <ExamRuleLookupModal 
        isOpen={lookupOpen} 
        onClose={() => setLookupOpen(false)} 
        onSelect={guid => setExamRuleGuid(guid)} 
        selectedGuid={examRuleGuid}
      />
    </div>
  )
}
