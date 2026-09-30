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
import { useQuery } from '@tanstack/react-query'
import { apiGet } from '@/lib/api/client'
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
  const { data: pageData, isLoading } = useResitSchedules({ page, pageSize: 10, search })
  
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
            onEnter={() => setSearch(searchInput)}
            results={[]}
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
                      <button className="text-left px-4 py-2 hover:bg-slate-50 text-sm w-full flex items-center gap-2 border-b border-slate-100" onClick={() => handleView(s.resitScheduleGuid)}>
                        <i className="lni lni-eye"></i> View
                      </button>
                      <button className="text-left px-4 py-2 hover:bg-slate-50 text-sm w-full flex items-center gap-2" onClick={() => handleEdit(s.resitScheduleGuid)}>
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

function UeScheduleModal({ onClose, showToast, modalState }: { onClose: () => void; showToast: (m: string, t?: string) => void; modalState: { mode: 'add' | 'edit' | 'view', guid: string | null } }) {
  const isEdit = modalState.mode === 'edit'
  const isView = modalState.mode === 'view'
  const editingGuid = modalState.guid
  
  const [courseUnitGuid, setCourseUnitGuid] = useState('')
  const [ueType, setUeType] = useState(0)
  const [examDate, setExamDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [maxMark, setMaxMark] = useState(100)
  const [examType, setExamType] = useState(1)
  const [publishStatus, setPublishStatus] = useState(0)
  const [examRuleGuid, setExamRuleGuid] = useState('')
  
  const { data: units } = useResitScheduleCourseUnits()
  const createMut = useCreateResitSchedule()
  const updateMut = useUpdateResitSchedule()
  
  const { data: rules } = useQuery({
    queryKey: ['exam-rules'],
    queryFn: () => apiGet<any[]>('/api/v1/assessment/exam-rules')
  })
  
  const { data: scheduleData, isLoading: isLoadingSchedule } = useResitSchedule(editingGuid)

  useEffect(() => {
    if (scheduleData) {
      setCourseUnitGuid(scheduleData.courseUnitGuid || '')
      setUeType(scheduleData.ueType ?? 0)
      setExamDate(scheduleData.examDate || '')
      setStartTime(scheduleData.startTime || '')
      setEndTime(scheduleData.endTime || '')
      setMaxMark(scheduleData.maxMark ?? 100)
      setExamType(scheduleData.examType ?? 1)
      setPublishStatus(scheduleData.publishStatus ?? 0)
      setExamRuleGuid(scheduleData.examRuleGuid || '')
    }
  }, [scheduleData])
  
  const handleSave = () => {
    if (!courseUnitGuid && !isEdit) {
      showToast('Select a course unit', 'error')
      return
    }
    const data: ResitScheduleSaveCommand = {
      courseUnitGuid,
      ueType,
      examDate,
      startTime,
      endTime,
      maxMark,
      examType,
      publishStatus,
      examRuleGuid
    }
    
    if (isEdit && editingGuid) {
      updateMut.mutate({ guid: editingGuid, data }, {
        onSuccess: () => {
          showToast('Schedule updated')
          onClose()
        },
        onError: (err: any) => showToast(err.response?.data?.errors?.[0] || 'Update failed', 'error')
      })
    } else {
      createMut.mutate(data, {
        onSuccess: () => {
          showToast('Schedule created')
          onClose()
        },
        onError: (err: any) => showToast(err.response?.data?.errors?.[0] || 'Create failed', 'error')
      })
    }
  }

  const selectedUnit = units?.find(u => u.courseUnitGuid === courseUnitGuid)
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl flex flex-col overflow-hidden max-h-full">
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <div className="font-bold text-[16px] text-slate-800">{isView ? 'View Schedule' : isEdit ? 'Edit Schedule' : 'Add Schedule'}</div>
          <button className="text-slate-400 hover:text-slate-600 transition-colors" onClick={onClose}><i className="lni lni-close text-lg"></i></button>
        </div>
        {isLoadingSchedule ? (
          <div className="p-10 text-center flex-1 flex items-center justify-center">
            <i className="lni lni-spinner-solid animate-spin text-2xl text-blue-500"></i>
          </div>
        ) : (
          <div className="p-5 overflow-y-auto custom-scrollbar flex flex-col gap-4">
          
          <div className="form-group">
            <label>Course Unit {!(isEdit || isView) && <span className="text-red-500">*</span>}</label>
            <select className="form-control" value={courseUnitGuid} onChange={e => setCourseUnitGuid(e.target.value)} disabled={isEdit || isView}>
              <option value="">-- Select Unit --</option>
              {units?.map(u => (
                <option key={u.courseUnitGuid} value={u.courseUnitGuid} disabled={u.theoryScheduled && u.practicalScheduled}>{u.unitCode} - {u.unitName}</option>
              ))}
            </select>
          </div>
          
          {!isEdit && selectedUnit?.isTheoryPracticalUnit && (
            <div className="form-group">
              <label>Part</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input type="radio" checked={ueType === 0} onChange={() => setUeType(0)} disabled={selectedUnit.theoryScheduled || isView} /> Theory
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input type="radio" checked={ueType === 1} onChange={() => setUeType(1)} disabled={selectedUnit.practicalScheduled || isView} /> Practical
                </label>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label>Exam Date <span className="text-red-500">*</span></label>
              <input type="date" className="form-control" value={examDate} onChange={e => setExamDate(e.target.value)} disabled={isView} />
            </div>
            <div className="form-group">
              <label>Exam Type</label>
              <select className="form-control" value={examType} onChange={e => setExamType(Number(e.target.value))} disabled={isView}>
                <option value={0}>Online</option>
                <option value={1}>Offline</option>
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label>Start Time <span className="text-red-500">*</span></label>
              <input type="time" className="form-control" value={startTime} onChange={e => setStartTime(e.target.value)} disabled={isView} />
            </div>
            <div className="form-group">
              <label>End Time <span className="text-red-500">*</span></label>
              <input type="time" className="form-control" value={endTime} onChange={e => setEndTime(e.target.value)} disabled={isView} />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label>Max Mark <span className="text-red-500">*</span></label>
              <input type="number" className="form-control" value={maxMark} onChange={e => setMaxMark(Number(e.target.value))} disabled={isView} />
            </div>
            <div className="form-group">
              <label>Publish Status</label>
              <select className="form-control" value={publishStatus} onChange={e => setPublishStatus(Number(e.target.value))} disabled={isView}>
                <option value={0}>Not Published</option>
                <option value={1}>Published</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Exam Rule <span className="text-red-500">*</span></label>
            <select className="form-control" value={examRuleGuid} onChange={e => setExamRuleGuid(e.target.value)} disabled={isView}>
              <option value="">-- Select Rule --</option>
              {rules?.map(r => (
                <option key={r.guid} value={r.guid}>{r.code} - {r.name}</option>
              ))}
            </select>
          </div>
          
        </div>
        )}
        <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
          <button className="btn btn-white" onClick={onClose}>{isView ? 'Close' : 'Cancel'}</button>
          {!isView && (
            <button className="btn btn-primary" onClick={handleSave} disabled={createMut.isPending || updateMut.isPending}>
              {createMut.isPending || updateMut.isPending ? 'Saving...' : 'Save Schedule'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function CwSchedulingTab({ showToast }: { showToast: (m: string, t?: string) => void }) {
  const { data, isLoading } = useResitCwSchedule()
  const mut = useUpdateResitCwSchedule()
  
  const [startDateTime, setStartDateTime] = useState('')
  const [endDateTime, setEndDateTime] = useState('')
  const [testType, setTestType] = useState(0)
  const [publishStatus, setPublishStatus] = useState(0)
  const [examRuleGuid, setExamRuleGuid] = useState('')
  
  useEffect(() => {
    if (data?.schedule) {
      setStartDateTime(data.schedule.startDateTime ? new Date(data.schedule.startDateTime).toISOString().slice(0, 16) : '')
      setEndDateTime(data.schedule.endDateTime ? new Date(data.schedule.endDateTime).toISOString().slice(0, 16) : '')
      setTestType(data.schedule.testType)
      setPublishStatus(data.schedule.publishStatus)
      setExamRuleGuid(data.schedule.examRuleGuid || '')
    }
  }, [data])

  const { data: rules } = useQuery({
    queryKey: ['exam-rules'],
    queryFn: () => apiGet<any[]>('/api/v1/assessment/exam-rules')
  })

  const handleSave = () => {
    mut.mutate({
      startDateTime: new Date(startDateTime).toISOString(),
      endDateTime: new Date(endDateTime).toISOString(),
      testType,
      publishStatus,
      examRuleGuid
    }, {
      onSuccess: () => showToast('Coursework schedule saved'),
      onError: (err: any) => showToast(err.response?.data?.errors?.[0] || 'Save failed', 'error')
    })
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

  return (
    <div className="card p-5 max-w-2xl">
      <div className="card-title mb-5"><span className="ctitle-icon"><i className="lni lni-timer"></i></span> Coursework Schedule</div>
      
      {data.locked && (
        <div className="mb-5 p-3 bg-blue-50 text-blue-700 border border-blue-100 rounded-md text-sm flex gap-2">
          <i className="lni lni-lock mt-0.5"></i>
          <div>{data.studentsStarted} students have already started. Rule and Test Type are locked.</div>
        </div>
      )}
      
      <div className="grid grid-cols-2 gap-5 mb-4">
        <div className="form-group">
          <label>Start Date & Time</label>
          <input type="datetime-local" className="form-control" value={startDateTime} onChange={e => setStartDateTime(e.target.value)} />
        </div>
        <div className="form-group">
          <label>End Date & Time</label>
          <input type="datetime-local" className="form-control" value={endDateTime} onChange={e => setEndDateTime(e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5 mb-4">
        <div className="form-group">
          <label>Test Type</label>
          <select className="form-control" value={testType} onChange={e => setTestType(Number(e.target.value))} disabled={data.locked}>
            <option value={0}>Online</option>
            <option value={1}>Offline</option>
          </select>
        </div>
        <div className="form-group">
          <label>Publish Status</label>
          <select className="form-control" value={publishStatus} onChange={e => setPublishStatus(Number(e.target.value))}>
            <option value={0}>Not Published</option>
            <option value={1}>Published</option>
          </select>
        </div>
      </div>

      <div className="form-group mb-5">
        <label>Exam Rule</label>
        <select className="form-control" value={examRuleGuid} onChange={e => setExamRuleGuid(e.target.value)} disabled={data.locked}>
          <option value="">-- Select Rule --</option>
          {rules?.map(r => (
            <option key={r.guid} value={r.guid}>{r.code} - {r.name}</option>
          ))}
        </select>
      </div>
      
      <button className="btn btn-primary" onClick={handleSave} disabled={mut.isPending}>
        {mut.isPending ? 'Saving...' : 'Save Coursework Schedule'}
      </button>
    </div>
  )
}

function CtSchedulingTab({ showToast }: { showToast: (m: string, t?: string) => void }) {
  const { data, isLoading } = useResitCtSchedule()
  const mut = useUpdateResitCtSchedule()
  
  const [startDateTime, setStartDateTime] = useState('')
  const [endDateTime, setEndDateTime] = useState('')
  const [durationMinutes, setDurationMinutes] = useState(60)
  const [testType, setTestType] = useState(0)
  const [publishStatus, setPublishStatus] = useState(0)
  const [examRuleGuid, setExamRuleGuid] = useState('')
  
  useEffect(() => {
    if (data?.schedule) {
      setStartDateTime(data.schedule.startDateTime ? new Date(data.schedule.startDateTime).toISOString().slice(0, 16) : '')
      setEndDateTime(data.schedule.endDateTime ? new Date(data.schedule.endDateTime).toISOString().slice(0, 16) : '')
      setDurationMinutes(data.schedule.durationMinutes)
      setTestType(data.schedule.testType)
      setPublishStatus(data.schedule.publishStatus)
      setExamRuleGuid(data.schedule.examRuleGuid || '')
    }
  }, [data])

  const { data: rules } = useQuery({
    queryKey: ['exam-rules'],
    queryFn: () => apiGet<any[]>('/api/v1/assessment/exam-rules')
  })

  const handleSave = () => {
    mut.mutate({
      startDateTime: new Date(startDateTime).toISOString(),
      endDateTime: new Date(endDateTime).toISOString(),
      durationMinutes,
      testType,
      publishStatus,
      examRuleGuid
    }, {
      onSuccess: () => showToast('Class test schedule saved'),
      onError: (err: any) => showToast(err.response?.data?.errors?.[0] || 'Save failed', 'error')
    })
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

  return (
    <div className="card p-5 max-w-2xl">
      <div className="card-title mb-5"><span className="ctitle-icon"><i className="lni lni-pencil-alt"></i></span> Class Test Schedule</div>
      
      {data.locked && (
        <div className="mb-5 p-3 bg-blue-50 text-blue-700 border border-blue-100 rounded-md text-sm flex gap-2">
          <i className="lni lni-lock mt-0.5"></i>
          <div>{data.studentsStarted} students have already started. Rule, Duration and Test Type are locked.</div>
        </div>
      )}
      
      <div className="grid grid-cols-2 gap-5 mb-4">
        <div className="form-group">
          <label>Start Date & Time</label>
          <input type="datetime-local" className="form-control" value={startDateTime} onChange={e => setStartDateTime(e.target.value)} />
        </div>
        <div className="form-group">
          <label>End Date & Time</label>
          <input type="datetime-local" className="form-control" value={endDateTime} onChange={e => setEndDateTime(e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5 mb-4">
        <div className="form-group">
          <label>Duration (mins)</label>
          <input type="number" className="form-control" value={durationMinutes} onChange={e => setDurationMinutes(Number(e.target.value))} disabled={data.locked} />
        </div>
        <div className="form-group">
          <label>Test Type</label>
          <select className="form-control" value={testType} onChange={e => setTestType(Number(e.target.value))} disabled={data.locked}>
            <option value={0}>Online</option>
            <option value={1}>Offline</option>
          </select>
        </div>
        <div className="form-group">
          <label>Publish Status</label>
          <select className="form-control" value={publishStatus} onChange={e => setPublishStatus(Number(e.target.value))}>
            <option value={0}>Not Published</option>
            <option value={1}>Published</option>
          </select>
        </div>
      </div>

      <div className="form-group mb-5">
        <label>Exam Rule</label>
        <select className="form-control" value={examRuleGuid} onChange={e => setExamRuleGuid(e.target.value)} disabled={data.locked}>
          <option value="">-- Select Rule --</option>
          {rules?.map(r => (
            <option key={r.guid} value={r.guid}>{r.code} - {r.name}</option>
          ))}
        </select>
      </div>
      
      <button className="btn btn-primary" onClick={handleSave} disabled={mut.isPending}>
        {mut.isPending ? 'Saving...' : 'Save Class Test Schedule'}
      </button>
    </div>
  )
}
