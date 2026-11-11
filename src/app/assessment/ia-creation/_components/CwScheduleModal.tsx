'use client'

import { useState, useEffect, useRef } from 'react'
import { Toast } from '@/components/Toast'
import { usePagePermissions } from '@/hooks/users/usePagePermissions'
import { SearchSelect } from '@/components/SearchSelect'
import DatePicker from '@/components/DatePicker'
import TimePicker from '@/components/TimePicker'
import { useIaCwSchedule, useUpdateIaCwSchedule } from '@/hooks/assessment/useIaCwSchedule'
import { useExamRules } from '@/hooks/assessment/useExamRules'
import { SuccessPopup } from '@/components/modals/shared/SuccessPopup'
import { ExamRuleLookupModal } from './ExamRuleLookupModal'
import { extractApiErrorMessage } from '@/lib/errorMessages'

interface CwScheduleModalProps {
  isOpen: boolean
  onClose: () => void
  courseworkGuid: string | null
}

function getTodayYmd(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function CwScheduleModal({ isOpen, onClose, courseworkGuid }: CwScheduleModalProps) {
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
  const { data: schedule, isLoading } = useIaCwSchedule(courseworkGuid)
  const updateMut = useUpdateIaCwSchedule(courseworkGuid || '')

  // Form State
  const [startDate, setStartDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endDate, setEndDate] = useState('')
  const [endTime, setEndTime] = useState('')
  const [maxMark, setMaxMark] = useState<number | ''>(15)
  const [courseworkType, setCourseworkType] = useState<number>(0)
  const [publishStatus, setPublishStatus] = useState<number>(0)
  const [examRuleGuid, setExamRuleGuid] = useState<string>('')
  const [lookupOpen, setLookupOpen] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  function handleStartDateChange(d: string) {
    setFormError(null)
    const today = getTodayYmd()
    if (d && d < today) {
      showToast('Before date is not possible', 'error')
      return
    }
    setStartDate(d)
    if (d && endDate && endDate < d) {
      showToast('Before date is not possible', 'error')
      setEndDate('')
    }
  }

  function handleEndDateChange(d: string) {
    const today = getTodayYmd()
    const minAllowed = startDate || today
    if (d && d < minAllowed) {
      showToast('Before date is not possible', 'error')
      return
    }
    setEndDate(d)
  }

  function handleEndTimeChange(t: string) {
    setEndTime(t)
    if (startDate && endDate && startDate === endDate && startTime && t && t <= startTime) {
      showToast('End Time must be after Start Time', 'error')
    }
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
      if (schedule.scheduledStartDateTime) {
        const [d, t] = schedule.scheduledStartDateTime.split('T')
        setStartDate(d)
        setStartTime(t.slice(0, 5))
      } else {
        setStartDate('')
        setStartTime('')
      }
      
      if (schedule.scheduledEndDateTime) {
        const [d, t] = schedule.scheduledEndDateTime.split('T')
        setEndDate(d)
        setEndTime(t.slice(0, 5))
      } else {
        setEndDate('')
        setEndTime('')
      }
      setMaxMark(schedule.maxMark && schedule.maxMark > 0 ? schedule.maxMark : 15)
      setCourseworkType(schedule.courseworkType ?? 0)
      setPublishStatus(schedule.publishStatus ?? 0)
      if (schedule.examRuleGuid) {
        setExamRuleGuid(schedule.examRuleGuid)
      } else {
        setExamRuleGuid('')
      }
    } else if (!isOpen) {
        // reset form when closed
        setStartDate('')
        setStartTime('')
        setEndDate('')
        setEndTime('')
        setMaxMark(15)
        setCourseworkType(0)
        setPublishStatus(0)
        setExamRuleGuid('')
    }
  }, [schedule, isOpen])

  async function handleSave() {
    if (!courseworkGuid) return
    setFormError(null)

    // Validation
    if (!startDate || !startTime || !endDate || !endTime) {
      const msg = 'Start and End Date/Time are required'
      setFormError(msg)
      return
    }
    const startDt = new Date(`${startDate}T${startTime}`)
    const endDt = new Date(`${endDate}T${endTime}`)
    
    if (endDt <= startDt) {
      const msg = 'End Date/Time must be after Start Date/Time'
      setFormError(msg)
      return
    }
    if (!examRuleGuid) {
      const msg = 'Exam rule is required.'
      setFormError(msg)
      return
    }
    const effectiveMaxMark = typeof maxMark === 'number' && maxMark > 0 ? maxMark : (schedule?.maxMark && schedule.maxMark > 0 ? schedule.maxMark : 15)

    try {
      await updateMut.mutateAsync({
        scheduledStartDateTime: `${startDate}T${startTime}:00`,
        scheduledEndDateTime: `${endDate}T${endTime}:00`,
        maxMark: effectiveMaxMark,
        courseworkType,
        publishStatus,
        examRuleGuid,
      })
      showToast('Coursework Scheduled successfully')
      setSaved(true)
    } catch (err: any) {
      const errorMsg = extractApiErrorMessage(err, 'Failed to save schedule.')
      setFormError(errorMsg)
    }
  }

  if (!isOpen) return null

  if (saved) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
          <SuccessPopup
            title="Coursework Scheduled!"
            subtitle="The coursework schedule has been saved successfully."
            onClose={() => { setSaved(false); onClose(); }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay open">
      <div className="modal modal-md" style={{ maxWidth: '610px', borderRadius: '12px', height: 'auto', maxHeight: '90vh', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-hdr modal-hdr-blue" style={{ display: 'flex', alignItems: 'center', padding: '16px 20px' }}>
          <div className="modal-title text-white font-medium text-base" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className="lni lni-calendar" style={{ fontSize: '18px' }}></i> Schedule Coursework
          </div>
          <button className="modal-close text-white hover:text-white/80 transition-colors" onClick={onClose} style={{ marginLeft: 'auto', background: 'transparent', border: 'none', cursor: 'pointer' }}>
            <i className="lni lni-close" style={{ fontSize: '18px' }}></i>
          </button>
        </div>

        {/* Content */}
        <div ref={modalBodyRef} className="p-6 bg-white overflow-y-auto" style={{ maxHeight: 'calc(90vh - 60px)' }}>
          <div className={`transition-opacity duration-300 ${isLoading ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
            
            {schedule && (
              <div className="mb-5 border-b border-slate-200 pb-3">
                <div className="text-xs text-slate-500 font-medium mb-1">Coursework for Subject:</div>
                <div className="text-base font-semibold text-slate-900">
                  {schedule.courseUnitCode} — {schedule.courseUnitName}
                </div>
              </div>
            )}

            <div className="space-y-5">
              {/* Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="lbl">Start Date & Time <span className="text-red-500">*</span></label>
                  <div className="flex gap-2 mt-1">
                    <div className="flex-1 min-w-0">
                      <DatePicker 
                        value={startDate} 
                        onChange={handleStartDateChange} 
                        minYmd={getTodayYmd()} 
                        rangeMessage="Before date is not possible"
                        onError={msg => showToast(msg, 'error')}
                      />
                    </div>
                    <div className="w-[120px] shrink-0">
                      <TimePicker value={startTime} onChange={setStartTime} />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="lbl">End Date & Time <span className="text-red-500">*</span></label>
                  <div className="flex gap-2 mt-1">
                    <div className="flex-1 min-w-0">
                      <DatePicker 
                        value={endDate} 
                        onChange={handleEndDateChange} 
                        minYmd={startDate || getTodayYmd()} 
                        rangeMessage="Before date is not possible"
                        onError={msg => showToast(msg, 'error')}
                      />
                    </div>
                    <div className="w-[120px] shrink-0">
                      <TimePicker value={endTime} onChange={handleEndTimeChange} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Marks (hidden) */}
              <div className="hidden">
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

              {/* Type and Publish Status */}
              <div className="grid grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="lbl">Coursework Type</label>
                  <div className="flex gap-4 mt-2">
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="radio"
                        name="courseworkType"
                        checked={courseworkType === 0}
                        onChange={() => setCourseworkType(0)}
                      />
                      Online
                    </label>
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="radio"
                        name="courseworkType"
                        checked={courseworkType === 1}
                        onChange={() => setCourseworkType(1)}
                      />
                      Offline
                    </label>
                  </div>
                </div>

                <div>
                  <label className="lbl">Publish Status</label>
                  <div className="flex gap-4 mt-2">
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="radio"
                        name="cwPublishStatus"
                        checked={publishStatus === 0}
                        onChange={() => setPublishStatus(0)}
                      />
                      Not publish to student
                    </label>
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="radio"
                        name="cwPublishStatus"
                        checked={publishStatus === 1}
                        onChange={() => setPublishStatus(1)}
                      />
                      Publish to student
                    </label>
                  </div>
                </div>
              </div>

              {/* Exam Rule Picker */}
              <div className="pt-1">
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
            </div>

            {/* Footer */}
            <div className="mt-6 pt-5 border-t border-slate-200">
              {formError && (
                <div className="mb-4 p-3.5 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 text-xs text-red-900 shadow-xs">
                  <i className="lni lni-warning text-red-600 text-base shrink-0 mt-0.5"></i>
                  <div className="leading-relaxed font-semibold">{formError}</div>
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
