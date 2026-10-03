'use client'

import { useState, useEffect } from 'react'
import { ScrollTable } from '@/components/ScrollTable'
import { TableSearch } from '@/components/TableSearch'
import { ActionMenu } from '@/components/ActionMenu'
import { TableLoadingState } from '@/components/TableLoadingState'
import { Pagination } from '@/components/Pagination'
import { Toast } from '@/components/Toast'
import { EmptyState } from '@/components/EmptyState'
import { SearchSelect } from '@/components/SearchSelect'
import DatePicker from '@/components/DatePicker'
import TimePicker from '@/components/TimePicker'
import { useExamRules } from '@/hooks/assessment/useExamRules'
import { ExamRuleLookupModal } from '@/app/assessment/ia-creation/_components/ExamRuleLookupModal'
import {
  useResitSchedules,
  useResitScheduleCourseUnits,
  useCreateResitSchedule,
  useUpdateResitSchedule,
  useResitSchedule,
  useResitCwSchedule,
  useUpdateResitCwSchedule,
  useResitCtSchedule,
  useUpdateResitCtSchedule
} from '@/hooks/assessment/useResitScheduling'
import { ResitScheduleSaveCommand, ResitCwScheduleSaveCommand, ResitCtScheduleSaveCommand } from '@/lib/api/assessment/resitScheduling'

// GET /exam-rules is paged ({ items, ... }); the picker lists active rules only
// (status 3 = NotActive), same as the IA schedule modals.
function useActiveExamRules() {
  const { data } = useExamRules(1, 100, '')
  return (data?.items ?? []).filter(r => r.status !== 3)
}

// The API throws AuthError, whose message already holds the server's errors[0].
function errMsg(err: unknown, fallback: string) {
  return (err as { message?: string } | null)?.message || fallback
}

// Windows are stored in UTC and shown in local time. A server value without a
// zone designator is UTC, so it is marked as such before parsing.
function utcToLocalInput(iso: string | null | undefined) {
  if (!iso) return ''
  const d = new Date(/[zZ]|[+-]\d{2}:?\d{2}$/.test(iso) ? iso : `${iso}Z`)
  if (isNaN(d.getTime())) return ''
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

// datetime-local values parse as local time; send them as UTC ISO 8601.
function localInputToUtc(value: string) {
  return new Date(value).toISOString()
}

// Client checks for the Class Test / Coursework window (resit-scheduling-page.md#validation).
function validateWindow(start: string, end: string, examRuleGuid: string, durationMinutes?: number): string | null {
  if (!start || !end) return 'Enter the start and end date-time.'
  const s = new Date(start).getTime()
  const e = new Date(end).getTime()
  if (isNaN(s) || isNaN(e)) return 'Enter the start and end date-time.'
  if (e <= s) return 'End date-time must be after start date-time.'
  if (durationMinutes !== undefined) {
    if (!Number.isInteger(durationMinutes) || durationMinutes < 1 || durationMinutes > 600) return 'Duration must be between 1 and 600 minutes.'
    if (durationMinutes * 60000 > e - s) return 'Duration cannot be longer than the window between start and end.'
  }
  if (!examRuleGuid) return 'Select Rule'
  return null
}

export default function ResitSchedulingPage() {
  const [activeTab, setActiveTab] = useState<'UE' | 'CW' | 'CT'>('UE')
  const [toast, setToast] = useState<{msg: string, type: string} | null>(null)
  
  const showToast = (msg: string, type: string = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  return (
    <div className="page active">
      <div className="pg-hdr">
        <div>
          <div className="pg-title">Resit Scheduling</div>
          <div className="pg-sub">Schedule University Exams, Coursework, and Class Tests for active resit</div>
        </div>
      </div>

      <div className="flex border-b border-slate-200 mb-5">
        <button 
          className={`px-5 py-3 text-[14px] font-semibold border-b-2 ${activeTab === 'UE' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
          onClick={() => setActiveTab('UE')}
        >
          University Exams (UE)
        </button>
        <button 
          className={`px-5 py-3 text-[14px] font-semibold border-b-2 ${activeTab === 'CW' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
          onClick={() => setActiveTab('CW')}
        >
          Coursework (CW)
        </button>
        <button 
          className={`px-5 py-3 text-[14px] font-semibold border-b-2 ${activeTab === 'CT' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
          onClick={() => setActiveTab('CT')}
        >
          Class Tests (CT)
        </button>
      </div>

      {activeTab === 'UE' && <UeSchedulingTab showToast={showToast} />}
      {activeTab === 'CW' && <CwSchedulingTab showToast={showToast} />}
      {activeTab === 'CT' && <CtSchedulingTab showToast={showToast} />}

      <Toast toast={toast} />
    </div>
  )
}

function UeSchedulingTab({ showToast }: { showToast: (m: string, t?: string) => void }) {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const { data: pageData, isLoading } = useResitSchedules({ page, pageSize: 10, search: search || undefined })

  // Server-side search on unit code or name: debounced, back to page 1.
  useEffect(() => {
    const t = setTimeout(() => {
      const next = searchInput.trim()
      if (next !== search) { setSearch(next); setPage(1) }
    }, 400)
    return () => clearTimeout(t)
  }, [searchInput, search])

  const [modalState, setModalState] = useState<{ open: boolean, mode: 'add' | 'edit' | 'view', guid: string | null }>({ open: false, mode: 'add', guid: null })
  
  const handleView = (guid: string) => setModalState({ open: true, mode: 'view', guid })
  const handleEdit = (guid: string) => setModalState({ open: true, mode: 'edit', guid })
  const handleAdd = () => setModalState({ open: true, mode: 'add', guid: null })

  const resitContext = pageData?.resit
  const items = pageData?.schedules.items || []
  const totalCount = pageData?.schedules.totalCount || 0

  return (
    <div className="card">
      <div className="card-hdr flex justify-between">
        <div className="card-title">
          <span className="ctitle-icon"><i className="lni lni-calendar"></i></span> UE Schedules
        </div>
        <div className="flex gap-2">
          <TableSearch
            className="w-64"
            placeholder="Search code or name..."
            value={searchInput}
            onChange={setSearchInput}
            onEnter={() => { setSearch(searchInput.trim()); setPage(1) }}
            results={[]}
            minChars={999}
          />
          <button className="btn btn-white" onClick={() => { setSearchInput(''); setSearch(''); setPage(1) }}>Clear</button>
          <button className="btn btn-primary" onClick={handleAdd} disabled={!resitContext}>
            + Add Schedule
          </button>
        </div>
      </div>

      {!resitContext && !isLoading && (
        <div className="p-4 bg-amber-50 text-amber-700 border-b border-amber-100 text-sm">
          There is no active resit in this academic intake. Scheduling not possible.
        </div>
      )}

      <ScrollTable>
        <table>
          <thead>
            <tr>
              <th style={{ width: 48 }}>Action</th>
              <th>Unit Code</th>
              <th>Unit Name</th>
              <th>Part</th>
              <th>Date & Time</th>
              <th>Type</th>
              <th>Status</th>
              <th>Rule</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <TableLoadingState colSpan={8} />
            ) : items.length === 0 ? (
              <EmptyState colSpan={8} hasFilters={!!search} onClearFilters={() => { setSearchInput(''); setSearch(''); setPage(1) }} />
            ) : (
              items.map(s => (
                <tr key={s.resitScheduleGuid}>
                  <td>
                    <ActionMenu>
                      <button className="btn btn-neu btn-sm" onClick={() => handleView(s.resitScheduleGuid)}>
                        <i className="lni lni-eye"></i> View
                      </button>
                      <button className="btn btn-neu btn-sm" onClick={() => handleEdit(s.resitScheduleGuid)}>
                        <i className="lni lni-pencil"></i> Edit
                      </button>
                    </ActionMenu>
                  </td>
                  <td className="font-mono text-slate-700">{s.unitCode}</td>
                  <td>{s.unitName}</td>
                  <td>{s.ueType === 0 ? 'Theory' : 'Practical'}</td>
                  <td>
                    <div className="font-mono text-[12px] text-slate-700">{s.examDate || '-'}</div>
                    <div className="text-[11px] text-slate-500">{s.startTime ? `${s.startTime} - ${s.endTime}` : ''}</div>
                  </td>
                  <td>{s.examType === 0 ? 'Online' : s.examType === 1 ? 'Offline' : '-'}</td>
                  <td>
                    {s.publishStatus === 1 ? (
                      <span className="badge badge-green">Published</span>
                    ) : (
                      <span className="badge badge-amber">Not Published</span>
                    )}
                  </td>
                  <td className="text-slate-600 text-[12px]">{s.examRuleCode || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </ScrollTable>
      
      {totalCount > 10 && (
        <div className="p-4 border-t border-slate-100">
          <Pagination page={page} totalPages={Math.ceil(totalCount / 10)} totalCount={totalCount} onPageChange={setPage} />
        </div>
      )}
      
      {modalState.open && (
        <UeScheduleModal 
          onClose={() => setModalState({ ...modalState, open: false })} 
          showToast={showToast} 
          modalState={modalState}
        />
      )}
    </div>
  )
}

// ── View-mode helpers ──────────────────────────────────────────────────────

function ViewField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11.5px] font-bold text-g500 uppercase tracking-wide mb-1.5">{label}</div>
      <div className="text-[14px] text-g900 font-semibold px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg">{value}</div>
    </div>
  )
}

// yyyy-mm-dd → "16 Oct 2026"
function fmtViewDate(ymd: string) {
  if (!ymd) return '—'
  const d = new Date(`${ymd}T00:00:00`)
  return isNaN(d.getTime()) ? ymd : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

// HH:mm → "01:30 PM"
function fmt12h(hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number)
  if (isNaN(h) || isNaN(m)) return hhmm
  return `${String(h % 12 || 12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`
}

function UeScheduleModal({ onClose, showToast, modalState }: { onClose: () => void; showToast: (m: string, t?: string) => void; modalState: { mode: 'add' | 'edit' | 'view', guid: string | null } }) {
  const isEdit = modalState.mode === 'edit'
  const isView = modalState.mode === 'view'
  const isAdd = !isEdit && !isView
  const editingGuid = modalState.guid

  // Validation and save errors show inside the modal, above its overlay.
  const [localToast, setLocalToast] = useState<{ msg: string; type: string } | null>(null)
  const showLocalToast = (msg: string, type = 'error') => {
    setLocalToast({ msg, type })
    setTimeout(() => setLocalToast(null), 3500)
  }

  const [courseUnitGuid, setCourseUnitGuid] = useState('')
  const [ueType, setUeType] = useState(0)
  const [examDate, setExamDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [maxMark, setMaxMark] = useState<number | ''>(100)
  // Spec defaults for Add: Offline, Published.
  const [examType, setExamType] = useState(1)
  const [publishStatus, setPublishStatus] = useState(1)
  const [examRuleGuid, setExamRuleGuid] = useState('')
  const [lookupOpen, setLookupOpen] = useState(false)

  const { data: units, isLoading: unitsLoading } = useResitScheduleCourseUnits()
  const createMut = useCreateResitSchedule()
  const updateMut = useUpdateResitSchedule()
  const rules = useActiveExamRules()
  const ruleOptions = rules.map(r => ({ value: r.examRuleGuid, label: `${r.ruleCode} - ${r.ruleName}` }))

  const { data: scheduleData, isLoading: isLoadingSchedule } = useResitSchedule(editingGuid)

  useEffect(() => {
    if (scheduleData) {
      setCourseUnitGuid(scheduleData.courseUnitGuid || '')
      setUeType(scheduleData.ueType ?? 0)
      setExamDate(scheduleData.examDate ? scheduleData.examDate.split('T')[0] : '')
      setStartTime(scheduleData.startTime ? scheduleData.startTime.slice(0, 5) : '')
      setEndTime(scheduleData.endTime ? scheduleData.endTime.slice(0, 5) : '')
      setMaxMark(scheduleData.maxMark ?? 100)
      setExamType(scheduleData.examType ?? 1)
      setPublishStatus(scheduleData.publishStatus ?? 1)
      setExamRuleGuid(scheduleData.examRuleGuid || '')
    }
  }, [scheduleData])

  const selectedUnit = units?.find(u => u.courseUnitGuid === courseUnitGuid)
  const fullyScheduled = (u: { isTheoryPracticalUnit: boolean; theoryScheduled: boolean; practicalScheduled: boolean }) =>
    u.theoryScheduled && (!u.isTheoryPracticalUnit || u.practicalScheduled)
  const unitOptions = (units ?? []).map(u => ({ value: u.courseUnitGuid, label: `${u.unitName} (${u.unitCode})`, disabled: isAdd && fullyScheduled(u) }))

  // On Add, default the part to the one still open.
  function handleUnitChange(guid: string) {
    setCourseUnitGuid(guid)
    const u = units?.find(x => x.courseUnitGuid === guid)
    setUeType(u?.isTheoryPracticalUnit && u.theoryScheduled ? 1 : 0)
  }

  // Client checks (resit-scheduling-page.md#validation).
  function validate(): string | null {
    if (isAdd && !courseUnitGuid) return 'Select Course Unit'
    if (!examDate) return 'Enter Exam Date'
    if (!startTime || !endTime) return 'Enter Start and End time'
    if (endTime <= startTime) return 'End time must be after start time.'
    if (maxMark === '' || maxMark <= 0 || maxMark > 9999.99 || Math.round(maxMark * 100) !== maxMark * 100) return 'Enter Exam Mark'
    if (!examRuleGuid) return 'Select Rule'
    return null
  }

  const handleSave = () => {
    const invalid = validate()
    if (invalid) { showLocalToast(invalid); return }
    const data: ResitScheduleSaveCommand = {
      courseUnitGuid,
      ueType,
      examDate,
      startTime: `${startTime}:00`,
      endTime: `${endTime}:00`,
      maxMark: Number(maxMark),
      examType,
      publishStatus,
      examRuleGuid
    }

    if (isEdit && editingGuid) {
      updateMut.mutate({ guid: editingGuid, data }, {
        onSuccess: () => {
          showToast('Resit schedule updated successfully.')
          onClose()
        },
        onError: err => showLocalToast(errMsg(err, 'Update failed'))
      })
    } else {
      createMut.mutate(data, {
        onSuccess: () => {
          showToast('Resit schedule created successfully.')
          onClose()
        },
        onError: err => showLocalToast(errMsg(err, 'Create failed'))
      })
    }
  }

  const saving = createMut.isPending || updateMut.isPending
  const title = isView ? 'View Resit Exam Schedule' : isEdit ? 'Edit Resit Exam Schedule' : 'Schedule Resit Exam'

  return (
    <div className="modal-overlay open" onClick={() => !saving && onClose()}>
      {/* .modal-flex fixes height at 85vh; size to content instead, capped there. */}
      <div className="modal modal-md modal-flex" style={{ maxWidth: '700px', borderRadius: '12px', height: 'auto', maxHeight: '85vh' }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-hdr modal-hdr-blue" style={{ display: 'flex', alignItems: 'center', padding: '16px 20px' }}>
          <div className="modal-title text-white font-medium text-base" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className="lni lni-graduation" style={{ fontSize: '18px' }}></i> {title}
          </div>
          <button className="modal-close text-white hover:text-white/80 transition-colors" onClick={onClose} disabled={saving} style={{ marginLeft: 'auto', background: 'transparent', border: 'none', cursor: 'pointer' }}>
            <i className="lni lni-close" style={{ fontSize: '18px' }}></i>
          </button>
        </div>

        {/* Content */}
        <div className="modal-scroll p-6 bg-white flex-1 overflow-y-auto">
          <div className={`transition-opacity duration-300 ${isLoadingSchedule ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>

            {isAdd ? (
              <div className="mb-6 border-b border-slate-200 pb-4">
                <label className="lbl">Course Unit <span className="text-red-500">*</span></label>
                <SearchSelect
                  options={unitOptions}
                  value={courseUnitGuid}
                  onChange={handleUnitChange}
                  placeholder={unitsLoading ? 'Loading units...' : 'Select Course Unit...'}
                  className="w-full mt-1"
                  disabled={unitsLoading}
                />
                <div className="text-xs text-slate-500 mt-1">Fully scheduled units are disabled.</div>
              </div>
            ) : (
              <div className="mb-6 border-b border-slate-200 pb-4">
                <div className="text-sm text-slate-500 font-medium mb-1">Resit Exam for Subject:</div>
                <div className="text-lg font-semibold text-slate-900">
                  {scheduleData ? `${scheduleData.unitCode} — ${scheduleData.unitName} · ${scheduleData.ueType === 1 ? 'Practical' : 'Theory'}` : '—'}
                </div>
              </div>
            )}

            {isView ? (
              // Read-only values instead of disabled inputs (same style as ResitConfigViewModal).
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ViewField label="Exam Date" value={fmtViewDate(examDate)} />
                <ViewField label="Exam Time" value={startTime && endTime ? `${fmt12h(startTime)} – ${fmt12h(endTime)}` : '—'} />
                <ViewField label="Exam Mark" value={maxMark === '' ? '—' : String(maxMark)} />
                <ViewField label="Exam Rule" value={scheduleData?.examRuleCode ? `${scheduleData.examRuleCode} - ${scheduleData.examRuleName ?? ''}` : (ruleOptions.find(o => o.value === examRuleGuid)?.label ?? '—')} />
                <ViewField label="Test Type" value={examType === 0 ? 'Online' : 'Offline'} />
                <ViewField label="Publish Status" value={publishStatus === 1
                  ? <span className="badge badge-green">Published</span>
                  : <span className="badge badge-amber">Not Published</span>} />
              </div>
            ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Part — only for theory + practical units on Add */}
              {isAdd && selectedUnit?.isTheoryPracticalUnit && (
                <div className="md:col-span-2">
                  <label className="lbl">Part <span className="text-red-500">*</span></label>
                  <div className="flex gap-4 mt-2">
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="radio" name="resitUeType" checked={ueType === 0} onChange={() => setUeType(0)} disabled={selectedUnit.theoryScheduled} />
                      Theory {selectedUnit.theoryScheduled && <span className="text-xs text-slate-400">(scheduled)</span>}
                    </label>
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="radio" name="resitUeType" checked={ueType === 1} onChange={() => setUeType(1)} disabled={selectedUnit.practicalScheduled} />
                      Practical {selectedUnit.practicalScheduled && <span className="text-xs text-slate-400">(scheduled)</span>}
                    </label>
                  </div>
                </div>
              )}

              {/* Date */}
              <div>
                <label className="lbl">Exam Date <span className="text-red-500">*</span></label>
                <div className="mt-1">
                  {isView
                    ? <input className="ctrl w-full" value={examDate} disabled />
                    : <DatePicker value={examDate} onChange={setExamDate} />}
                </div>
              </div>

              {/* Times */}
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="lbl">Start Time <span className="text-red-500">*</span></label>
                  <div className="mt-1"><TimePicker value={startTime} onChange={setStartTime} disabled={isView} /></div>
                </div>
                <div className="flex-1">
                  <label className="lbl">End Time <span className="text-red-500">*</span></label>
                  <div className="mt-1"><TimePicker value={endTime} onChange={setEndTime} disabled={isView} /></div>
                </div>
              </div>

              {/* Marks */}
              <div>
                <label className="lbl">Exam Mark <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="ctrl w-full mt-1"
                  value={maxMark}
                  onChange={e => setMaxMark(e.target.value === '' ? '' : Number(e.target.value))}
                  disabled={isView}
                />
              </div>

              {/* Exam Rule Picker */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="lbl mb-0">Exam Rule <span className="text-red-500">*</span></label>
                  {!isView && (
                    <button className="text-[13px] text-[#3a6bc9] hover:underline" onClick={() => setLookupOpen(true)}>
                      View Rule Details
                    </button>
                  )}
                </div>
                <SearchSelect
                  options={ruleOptions}
                  value={examRuleGuid}
                  onChange={setExamRuleGuid}
                  placeholder="Select Exam Rule..."
                  className="w-full mt-1"
                  disabled={isView || isLoadingSchedule}
                />
              </div>

              {/* Test Type */}
              <div>
                <label className="lbl">Test Type <span className="text-red-500">*</span></label>
                <div className="flex gap-4 mt-2">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="radio" name="resitExamType" checked={examType === 1} onChange={() => setExamType(1)} disabled={isView} />
                    Offline
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="radio" name="resitExamType" checked={examType === 0} onChange={() => setExamType(0)} disabled={isView} />
                    Online
                  </label>
                </div>
              </div>

              {/* Publish Status */}
              <div>
                <label className="lbl">Publish Status <span className="text-red-500">*</span></label>
                <div className="flex gap-4 mt-2">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="radio" name="resitPublishStatus" checked={publishStatus === 1} onChange={() => setPublishStatus(1)} disabled={isView} />
                    Published
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="radio" name="resitPublishStatus" checked={publishStatus === 0} onChange={() => setPublishStatus(0)} disabled={isView} />
                    Not Published
                  </label>
                </div>
              </div>
            </div>
            )}

            {/* Footer — none in View mode; the header ✕ closes it */}
            {!isView && (
              <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-slate-200">
                <button className="btn btn-neu" onClick={onClose} disabled={saving}>
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={handleSave} disabled={saving || isLoadingSchedule}>
                  {saving ? 'Saving...' : 'Save Schedule'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <Toast toast={localToast} />
      <ExamRuleLookupModal
        isOpen={lookupOpen}
        onClose={() => setLookupOpen(false)}
        onSelect={guid => setExamRuleGuid(guid)}
      />
    </div>
  )
}

function CwSchedulingTab({ showToast }: { showToast: (m: string, t?: string) => void }) {
  const { data, isLoading } = useResitCwSchedule()
  const mut = useUpdateResitCwSchedule()
  return (
    <WindowScheduleForm
      kind="cw"
      data={data}
      isLoading={isLoading}
      saving={mut.isPending}
      showToast={showToast}
      onSave={v => mut.mutateAsync({
        startDateTime: v.startDateTime,
        endDateTime: v.endDateTime,
        testType: v.testType,
        publishStatus: v.publishStatus,
        examRuleGuid: v.examRuleGuid,
      })}
    />
  )
}

function CtSchedulingTab({ showToast }: { showToast: (m: string, t?: string) => void }) {
  const { data, isLoading } = useResitCtSchedule()
  const mut = useUpdateResitCtSchedule()
  return (
    <WindowScheduleForm
      kind="ct"
      data={data}
      isLoading={isLoading}
      saving={mut.isPending}
      showToast={showToast}
      onSave={v => mut.mutateAsync({
        startDateTime: v.startDateTime,
        endDateTime: v.endDateTime,
        durationMinutes: v.durationMinutes ?? 0,
        testType: v.testType,
        publishStatus: v.publishStatus,
        examRuleGuid: v.examRuleGuid,
      })}
    />
  )
}

interface WindowScheduleValues {
  startDateTime: string
  endDateTime: string
  durationMinutes?: number
  testType: number
  publishStatus: number
  examRuleGuid: string
}

interface WindowScheduleData {
  resit: { refCode: string } | null
  schedule: {
    startDateTime: string
    endDateTime: string
    durationMinutes?: number
    testType: number
    publishStatus: number
    examRuleGuid: string | null
  } | null
  studentsStarted: number
  locked: boolean
}

// One form for both window tabs (resit-scheduling-page.md, "Tabs 2 and 3"):
// Class Test adds Duration and locks it after start; Coursework uses Section A
// of the rule only.
function WindowScheduleForm({ kind, data, isLoading, saving, showToast, onSave }: {
  kind: 'cw' | 'ct'
  data: WindowScheduleData | undefined
  isLoading: boolean
  saving: boolean
  showToast: (m: string, t?: string) => void
  onSave: (v: WindowScheduleValues) => Promise<unknown>
}) {
  const isCt = kind === 'ct'
  const label = isCt ? 'Class Test' : 'Coursework'

  const [startDate, setStartDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endDate, setEndDate] = useState('')
  const [endTime, setEndTime] = useState('')
  const [durationMinutes, setDurationMinutes] = useState<number | ''>(60)
  // Spec defaults when nothing is saved yet: Online, Published.
  const [testType, setTestType] = useState(0)
  const [publishStatus, setPublishStatus] = useState(1)
  const [examRuleGuid, setExamRuleGuid] = useState('')
  const [lookupOpen, setLookupOpen] = useState(false)

  const rules = useActiveExamRules()
  const ruleOptions = rules.map(r => ({ value: r.examRuleGuid, label: `${r.ruleCode} - ${r.ruleName}` }))

  // Fill from the last loaded data (also what Reset does). Windows arrive in
  // UTC and are edited in local time.
  function fill(schedule: WindowScheduleData['schedule']) {
    const [sd = '', st = ''] = utcToLocalInput(schedule?.startDateTime).split('T')
    const [ed = '', et = ''] = utcToLocalInput(schedule?.endDateTime).split('T')
    setStartDate(sd); setStartTime(st); setEndDate(ed); setEndTime(et)
    setDurationMinutes(schedule?.durationMinutes ?? 60)
    setTestType(schedule?.testType ?? 0)
    setPublishStatus(schedule?.publishStatus ?? 1)
    setExamRuleGuid(schedule?.examRuleGuid ?? '')
  }

  useEffect(() => {
    if (data) fill(data.schedule)
  }, [data])

  async function handleSave() {
    const start = startDate && startTime ? `${startDate}T${startTime}` : ''
    const end = endDate && endTime ? `${endDate}T${endTime}` : ''
    const duration = isCt ? (durationMinutes === '' ? NaN : durationMinutes) : undefined
    const invalid = validateWindow(start, end, examRuleGuid, duration)
    if (invalid) { showToast(invalid, 'error'); return }
    try {
      await onSave({
        startDateTime: localInputToUtc(start),
        endDateTime: localInputToUtc(end),
        durationMinutes: duration,
        testType,
        publishStatus,
        examRuleGuid,
      })
      showToast(`Resit ${label.toLowerCase()} schedule saved successfully.`)
    } catch (err) {
      showToast(errMsg(err, 'Save failed'), 'error')
    }
  }

  if (isLoading) return <div className="p-10 text-center"><i className="lni lni-spinner-solid animate-spin text-2xl text-blue-500"></i></div>

  if (!data?.resit) {
    return (
      <div className="card p-5">
        <div className="p-4 bg-amber-50 text-amber-700 border border-amber-100 rounded-md text-sm">
          There is no active resit in this academic intake. Scheduling not possible.
        </div>
      </div>
    )
  }

  const locked = data.locked
  const lockedFields = isCt ? 'Exam rule, duration and test type are' : 'Exam rule and test type are'

  return (
    <div className="card" style={{ padding: 24, maxWidth: 820 }}>
      <div className="card-title mb-5">
        <span className="ctitle-icon"><i className={`lni ${isCt ? 'lni-pencil-alt' : 'lni-timer'}`}></i></span> {label} Schedule
        {!data.schedule && <span className="badge badge-amber" style={{ marginLeft: 8 }}>Not scheduled</span>}
      </div>

      {locked && (
        <div className="info-box mb-5">
          <i className="lni lni-lock"></i>
          <span>{data.studentsStarted} student{data.studentsStarted === 1 ? ' has' : 's have'} already started. {lockedFields} locked; the window and publish status can still change.</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Window, in local time */}
        <div>
          <label className="lbl">Opens <span className="text-red-500">*</span></label>
          <div className="flex gap-2 mt-1">
            <div className="flex-1"><DatePicker value={startDate} onChange={setStartDate} /></div>
            <div className="w-[140px]"><TimePicker value={startTime} onChange={setStartTime} /></div>
          </div>
        </div>
        <div>
          <label className="lbl">Closes <span className="text-red-500">*</span></label>
          <div className="flex gap-2 mt-1">
            <div className="flex-1"><DatePicker value={endDate} onChange={setEndDate} /></div>
            <div className="w-[140px]"><TimePicker value={endTime} onChange={setEndTime} /></div>
          </div>
        </div>

        {isCt && (
          <div>
            <label className="lbl">Duration (mins) <span className="text-red-500">*</span></label>
            <input
              type="number"
              min={1}
              max={600}
              className="ctrl w-full mt-1"
              value={durationMinutes}
              onChange={e => setDurationMinutes(e.target.value === '' ? '' : Number(e.target.value))}
              disabled={locked}
            />
            <div className="text-xs text-slate-500 mt-1">1–600 minutes, within the window.</div>
          </div>
        )}

        {/* Exam Rule Picker */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="lbl mb-0">Exam Rule <span className="text-red-500">*</span></label>
            {!locked && (
              <button className="text-[13px] text-[#3a6bc9] hover:underline" onClick={() => setLookupOpen(true)}>
                View Rule Details
              </button>
            )}
          </div>
          <SearchSelect
            options={ruleOptions}
            value={examRuleGuid}
            onChange={setExamRuleGuid}
            placeholder="Select Exam Rule..."
            className="w-full mt-1"
            disabled={locked}
          />
          {!isCt && <div className="text-xs text-slate-500 mt-1">Resit coursework uses Section A of the rule only.</div>}
        </div>

        {/* Test Type */}
        <div>
          <label className="lbl">Test Type <span className="text-red-500">*</span></label>
          <div className="flex gap-4 mt-2">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="radio" name={`${kind}TestType`} checked={testType === 0} onChange={() => setTestType(0)} disabled={locked} />
              Online
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="radio" name={`${kind}TestType`} checked={testType === 1} onChange={() => setTestType(1)} disabled={locked} />
              Offline
            </label>
          </div>
          <div className="text-xs text-slate-500 mt-1">Offline is hidden from students.</div>
        </div>

        {/* Publish Status */}
        <div>
          <label className="lbl">Publish Status <span className="text-red-500">*</span></label>
          <div className="flex gap-4 mt-2">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="radio" name={`${kind}PublishStatus`} checked={publishStatus === 1} onChange={() => setPublishStatus(1)} />
              Published
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="radio" name={`${kind}PublishStatus`} checked={publishStatus === 0} onChange={() => setPublishStatus(0)} />
              Not Published
            </label>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-slate-200">
        <button className="btn btn-neu" onClick={() => fill(data.schedule)} disabled={saving}>
          Reset
        </button>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : `Save ${label} Schedule`}
        </button>
      </div>

      <ExamRuleLookupModal
        isOpen={lookupOpen}
        onClose={() => setLookupOpen(false)}
        onSelect={guid => setExamRuleGuid(guid)}
      />
    </div>
  )
}
