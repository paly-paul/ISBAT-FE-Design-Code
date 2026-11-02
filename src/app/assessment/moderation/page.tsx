'use client'

import { useState, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { SearchSelect } from '@/components/SearchSelect'
import { ScrollTable } from '@/components/ScrollTable'
import { Toast } from '@/components/Toast'
import { ActionMenu } from '@/components/ActionMenu'
import { EmptyState } from '@/components/EmptyState'
import { TableLoadingState } from '@/components/TableLoadingState'
import {
  useSearchModerationStudents,
  useModerationStudentDetail,
  useStudentModerationRows,
  useUpdateModeration
} from '@/hooks/assessment/useModeration'

export default function ModerationPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [studentGuid, setStudentGuid] = useState<string | null>(null)
  
  // Queries
  const { data: searchResults, isLoading: searching } = useSearchModerationStudents(searchTerm)
  const { data: studentDetail, isLoading: loadingDetail } = useModerationStudentDetail(studentGuid)
  const { data: rows, isLoading: loadingRows } = useStudentModerationRows(studentGuid)
  
  // Options for SearchSelect
  const searchOptions = (searchResults || []).map(s => ({
    value: s.studentGuid,
    label: `${s.studentNum || s.studentNumber || s.registrationNumber || ''} - ${s.studentName} (${s.programName})`
  }))

  const [toast, setToast] = useState<{ msg: string, type: 'success' | 'error' } | null>(null)
  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  return (
    <div className="page active">
      <div className="pg-hdr">
        <div>
          <div className="pg-title">Result & Moderation</div>
          <div className="pg-sub">Search students and apply IA/UE grace marks to individual units</div>
        </div>
      </div>

      <div className="card mb-5">
        <div className="p-4 sm:p-5 flex flex-col xl:flex-row xl:items-center justify-between gap-4 lg:gap-6">
          <div className="w-full xl:w-[380px] shrink-0">
            <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">
              Search Student
            </label>
            <SearchSelect
              options={searchOptions}
              value={studentGuid || undefined}
              onChange={(val) => setStudentGuid(val)}
              onSearch={setSearchTerm}
              isLoading={searching}
              placeholder="Type name or student number..."
            />
          </div>
          
          {studentDetail && (
            <div className="flex-1 min-w-0 bg-slate-50/80 border border-slate-200/90 rounded-xl p-3.5 lg:px-5 lg:py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs">
              {/* Left Column: Avatar + Student Profile Info */}
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-11 h-11 rounded-full bg-blue-600 text-white flex items-center justify-center text-base font-bold shrink-0 shadow-xs ring-4 ring-blue-50">
                  {studentDetail.studentName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[14px] font-bold text-slate-900 leading-tight">
                      {studentDetail.studentName}
                    </span>
                    <span className="font-mono text-[11px] font-semibold bg-white text-slate-700 border border-slate-200 px-2 py-0.5 rounded shadow-2xs">
                      {studentDetail.studentNum || studentDetail.studentNumber || studentDetail.registrationNumber || '—'}
                    </span>
                  </div>
                  <div className="text-[12px] text-slate-600 mt-1 truncate flex items-center gap-1.5" title={studentDetail.programName}>
                    <i className="lni lni-graduation text-slate-400 text-xs shrink-0"></i>
                    <span className="truncate">{studentDetail.programName}</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Key Academic Badges (Batch & Semester) */}
              <div className="flex items-center gap-3 shrink-0 pt-2.5 md:pt-0 border-t md:border-t-0 border-slate-200/60">
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 md:text-right">Batch</div>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-700 text-[11px] font-semibold shadow-2xs whitespace-nowrap">
                    {studentDetail.batchCode || studentDetail.batchName || '—'}
                  </span>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 md:text-right">Semester</div>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-[11px] font-semibold shadow-2xs whitespace-nowrap">
                    {studentDetail.semesterName || studentDetail.currentSemester || '—'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-hdr">
          <div className="card-title">
            <span className="ctitle-icon"><i className="lni lni-list"></i></span> Unit Results
          </div>
        </div>
        <ScrollTable>
          <table>
            <thead>
              <tr>
                <th style={{ width: 48 }}></th>
                <th>SEMESTER</th>
                <th>UNIT CODE</th>
                <th>UNIT NAME</th>
                <th>IA</th>
                <th>UE</th>
                <th>TOTAL</th>
                <th>STATUS</th>
                <th>IA MOD</th>
                <th>UE MOD</th>
              </tr>
            </thead>
            <tbody>
              {loadingRows ? (
                <TableLoadingState colSpan={10} title="Loading unit results..." subtitle="Fetching results for the selected student." />
              ) : !studentGuid ? (
                <EmptyState 
                  colSpan={10} 
                  title="No Student Selected" 
                  subtitle="Search and select a student from the dropdown above to view and moderate their unit results." 
                />
              ) : rows && rows.length > 0 ? (
                rows.map(row => (
                  <ModerationRowItem 
                    key={row.examResultGuid} 
                    row={row} 
                    studentGuid={studentGuid} 
                    onSuccess={() => showToast('Moderation saved successfully')}
                    onError={(err) => showToast(err || 'Failed to save moderation', 'error')}
                  />
                ))
              ) : (
                <EmptyState 
                  colSpan={10} 
                  title="No results found" 
                  subtitle="There are no recorded results for this student." 
                />
              )}
            </tbody>
          </table>
        </ScrollTable>
      </div>
      
      {toast && <Toast toast={toast} />}
    </div>
  )
}

function ModerationRowItem({ row, studentGuid, onSuccess, onError }: { 
  row: any, 
  studentGuid: string, 
  onSuccess: () => void, 
  onError: (msg: string) => void 
}) {
  const [isViewModalOpen, setViewModalOpen] = useState(false)
  const [isEditModalOpen, setEditModalOpen] = useState(false)
  
  const currentIaMod = Number(row.iaMod) || 0
  const currentUeMod = Number(row.ueMod) || 0
  const baseIa = Math.max(0, (Number(row.iaTotal) || 0) - currentIaMod)
  const baseUe = Math.max(0, (Number(row.ueTotal) || 0) - currentUeMod)

  const computedTotal = (Number(row.iaTotal) || 0) + (Number(row.ueTotal) || 0)

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pass': return <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-[11px] font-bold">Pass</span>
      case 'Fail': return <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-[11px] font-bold">Fail</span>
      case 'RL': return <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded text-[11px] font-bold">RL</span>
      default: return <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[11px] font-bold">{status}</span>
    }
  }

  return (
    <>
      <tr>
        <td>
          <ActionMenu>
            <button className="btn btn-neu btn-sm" onClick={() => setViewModalOpen(true)}>
              <i className="lni lni-eye"></i> View Details
            </button>
            <button className="btn btn-neu btn-sm" onClick={() => setEditModalOpen(true)}>
              <i className="lni lni-pencil"></i> Edit Moderation
            </button>
          </ActionMenu>
        </td>
        <td className="text-[12px] text-slate-500 whitespace-nowrap">{row.semesterName || '—'}</td>
        <td className="font-mono text-slate-700 text-[12px]">{row.unitCode || '—'}</td>
        <td className="font-medium text-slate-900">{row.unitName}</td>
        <td>
          <div className="flex flex-col">
            <span className="font-medium text-slate-800">
              {row.iaTotal} <span className="text-slate-400 font-normal">/ {row.iaMax}</span>
            </span>
            {currentIaMod > 0 && <span className="text-[10px] text-purple-600 font-semibold">(+{currentIaMod} grace)</span>}
          </div>
        </td>
        <td>
          <div className="flex flex-col">
            <span className="font-medium text-slate-800">
              {row.ueTotal} <span className="text-slate-400 font-normal">/ {row.ueMax}</span>
            </span>
            {currentUeMod > 0 && <span className="text-[10px] text-purple-600 font-semibold">(+{currentUeMod} grace)</span>}
          </div>
        </td>
        <td className="font-bold text-slate-900">{computedTotal.toFixed(1)}</td>
        <td>{getStatusBadge(row.passStatus)}</td>
        <td>
          <div className="flex flex-col">
            {currentIaMod > 0 ? <span className="text-[12px] text-purple-600 font-bold">+{currentIaMod}</span> : <span className="text-slate-400">-</span>}
          </div>
        </td>
        <td>
          <div className="flex flex-col">
            {currentUeMod > 0 ? <span className="text-[12px] text-purple-600 font-bold">+{currentUeMod}</span> : <span className="text-slate-400">-</span>}
          </div>
        </td>
      </tr>

      {isViewModalOpen && (
        <div className="modal-overlay open">
          <div className="modal" style={{ maxWidth: 520 }}>
            <div className="modal-hdr modal-hdr-blue">
              <div className="modal-title"><i className="lni lni-eye"></i> Result &amp; Moderation Breakdown</div>
              <button className="modal-close" onClick={() => setViewModalOpen(false)}>
                <i className="lni lni-close"></i>
              </button>
            </div>
            <div className="modal-body p-5">
              <div className="mb-4 pb-3 border-b border-slate-200">
                <div className="text-xs text-slate-500 uppercase font-semibold">Subject / Unit</div>
                <div className="font-bold text-base text-slate-900">{row.unitCode} — {row.unitName}</div>
                <div className="text-xs text-slate-500 mt-0.5">{row.semesterName}</div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="text-xs font-bold text-slate-700 uppercase mb-2">Internal Assessment (IA)</div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Base Score:</span>
                      <span className="font-semibold text-slate-800">{baseIa}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Grace Applied:</span>
                      <span className={currentIaMod > 0 ? 'font-bold text-purple-600' : 'text-slate-500'}>
                        {currentIaMod > 0 ? `+${currentIaMod}` : 'None (0)'}
                      </span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-slate-200 font-bold text-sm">
                      <span>Total IA:</span>
                      <span>{row.iaTotal} <span className="text-slate-400 font-normal text-xs">/ {row.iaMax}</span></span>
                    </div>
                    <div className="text-[11px] text-slate-500 pt-1">Pass line (50%): <strong>{(row.iaMax * 0.5).toFixed(1)}</strong></div>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="text-xs font-bold text-slate-700 uppercase mb-2">University Exam (UE)</div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Base Score:</span>
                      <span className="font-semibold text-slate-800">{baseUe}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Grace Applied:</span>
                      <span className={currentUeMod > 0 ? 'font-bold text-purple-600' : 'text-slate-500'}>
                        {currentUeMod > 0 ? `+${currentUeMod}` : 'None (0)'}
                      </span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-slate-200 font-bold text-sm">
                      <span>Total UE:</span>
                      <span>{row.ueTotal} <span className="text-slate-400 font-normal text-xs">/ {row.ueMax}</span></span>
                    </div>
                    <div className="text-[11px] text-slate-500 pt-1">Pass line (50%): <strong>{(row.ueMax * 0.5).toFixed(1)}</strong></div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-blue-50/70 border border-blue-200 rounded-lg">
                <div>
                  <div className="text-xs text-blue-900 font-bold">Overall Status</div>
                  <div className="text-xs text-blue-700">Combined Total: <strong>{computedTotal.toFixed(1)}</strong> / {row.iaMax + row.ueMax}</div>
                </div>
                <div>{getStatusBadge(row.passStatus)}</div>
              </div>
            </div>
            <div className="modal-ftr">
              <button className="btn btn-neu" onClick={() => setViewModalOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {isEditModalOpen && (
        <EditModerationModal 
          row={row} 
          studentGuid={studentGuid} 
          onClose={() => setEditModalOpen(false)} 
          onSuccess={onSuccess} 
          onError={onError} 
        />
      )}
    </>
  )
}

function EditModerationModal({ row, studentGuid, onClose, onSuccess, onError }: any) {
  const currentIaMod = Number(row.iaMod) || 0
  const currentUeMod = Number(row.ueMod) || 0
  const baseIa = Math.max(0, (Number(row.iaTotal) || 0) - currentIaMod)
  const baseUe = Math.max(0, (Number(row.ueTotal) || 0) - currentUeMod)
  const iaMax = Number(row.iaMax) || 0
  const ueMax = Number(row.ueMax) || 0
  const iaThreshold = Number((iaMax * 0.5).toFixed(2))
  const ueThreshold = Number((ueMax * 0.5).toFixed(2))

  // Maximum allowed grace marks without exceeding 50% limit (landing exactly on line is allowed):
  const maxAllowedIaMod = Math.max(0, Number((iaThreshold - baseIa).toFixed(2)))
  const maxAllowedUeMod = Math.max(0, Number((ueThreshold - baseUe).toFixed(2)))

  const isRL = row.passStatus === 'RL' || (Number(row.ueTotal) === 0 && Number(row.ueMax) > 0 && currentUeMod === 0)

  const [iaMod, setIaMod] = useState<string>(currentIaMod.toString())
  const [ueMod, setUeMod] = useState<string>(currentUeMod.toString())
  const updateMut = useUpdateModeration()
  const isPending = updateMut.isPending
  const [saveError, setSaveError] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const numIa = parseFloat(iaMod) || 0
  const numUe = parseFloat(ueMod) || 0

  // ── Validation logic (per result-moderation-page.md & update-moderation.md) ──
  let iaError: string | null = null
  let ueError: string | null = null

  if (isNaN(numIa)) {
    iaError = 'Enter a valid number.'
  } else if (numIa < 0) {
    iaError = 'IA moderation cannot be negative.'
  } else if (numIa > 0 && baseIa >= iaThreshold) {
    iaError = `Base IA (${baseIa}/${iaMax}) is already at or above 50%. Grace marks cannot be added.`
  } else if (numIa > 0 && Number((baseIa + numIa).toFixed(2)) > iaThreshold) {
    iaError = `IA total would reach ${(baseIa + numIa).toFixed(1)}, exceeding 50% of max (${iaThreshold}). Max allowed grace is ${maxAllowedIaMod}.`
  }

  if (isNaN(numUe)) {
    ueError = 'Enter a valid number.'
  } else if (numUe < 0) {
    ueError = 'UE moderation cannot be negative.'
  } else if (isRL && numUe > 0) {
    ueError = 'Student has not sat University Exam yet (RL). UE moderation cannot be applied.'
  } else if (numUe > 0 && baseUe >= ueThreshold) {
    ueError = `Base UE (${baseUe}/${ueMax}) is already at or above 50%. Grace marks cannot be added.`
  } else if (numUe > 0 && Number((baseUe + numUe).toFixed(2)) > ueThreshold) {
    ueError = `UE total would reach ${(baseUe + numUe).toFixed(1)}, exceeding 50% of max (${ueThreshold}). Max allowed grace is ${maxAllowedUeMod}.`
  }

  const hasValidationError = !!iaError || !!ueError

  // Projected totals:
  const validIaVal = isNaN(numIa) ? 0 : Math.max(0, numIa)
  const validUeVal = isNaN(numUe) ? 0 : Math.max(0, numUe)
  const projectedIa = Number((baseIa + validIaVal).toFixed(1))
  const projectedUe = Number((baseUe + validUeVal).toFixed(1))
  const projectedTotal = Number((projectedIa + projectedUe).toFixed(1))
  const maxTotal = iaMax + ueMax

  const isProjectedPass = !isRL && projectedIa >= iaThreshold && projectedUe >= ueThreshold

  const handleSave = () => {
    if (hasValidationError) return
    setSaveError(null)

    const payload = {
      iaModeration: numIa,
      ueModeration: numUe,
      iaMod: numIa,
      ueMod: numUe,
    }

    updateMut.mutate({ studentGuid, examResultGuid: row.examResultGuid, data: payload }, {
      onSuccess: () => {
        onSuccess()
        onClose()
      },
      onError: (err: any) => {
        if (err?.code === 'not_found') {
          onError(err?.message || 'This result no longer exists.')
          queryClient.invalidateQueries({ queryKey: ['moderation-student-rows', studentGuid] })
          onClose()
          return
        }
        setSaveError(err?.message || 'Unable to apply this moderation. Moderation cannot push total above 50% of max.')
      }
    })
  }

  return (
    <div className="modal-overlay open">
      <div className="modal" style={{ maxWidth: 540 }}>
        <div className="modal-hdr modal-hdr-blue">
          <div className="modal-title"><i className="lni lni-pencil"></i> Edit Grace Marks (Moderation)</div>
          <button className="modal-close" onClick={onClose} disabled={isPending}><i className="lni lni-close"></i></button>
        </div>

        <div className="modal-body p-5">
          {/* Unit header */}
          <div className="mb-4 pb-3 border-b border-slate-200 flex justify-between items-start">
            <div>
              <div className="text-[11px] text-slate-500 font-semibold uppercase">Unit</div>
              <div className="font-bold text-[15px] text-slate-900">{row.unitCode} — {row.unitName}</div>
              <div className="text-xs text-slate-500">{row.semesterName}</div>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-500 block text-right mb-0.5">Current Status</span>
              <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${row.passStatus === 'Pass' ? 'bg-green-100 text-green-700' : row.passStatus === 'RL' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                {row.passStatus}
              </span>
            </div>
          </div>

          {/* Policy Guard Notice */}
          <div className="info-box mb-4" style={{ fontSize: '11.5px', padding: '8px 12px', background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
            <i className="lni lni-shield" style={{ color: 'var(--b700)', fontSize: 14 }}></i>
            <div>
              <strong>50% Guard Rule:</strong> Moderation rescues borderline results up to Pass. It can <strong>never push a component above 50% of its max</strong>. Enter <strong>0</strong> to remove grace marks.
            </div>
          </div>

          {/* Moderation Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            {/* IA Moderation */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-slate-800">IA Moderation</label>
                <span className="text-[11px] font-semibold text-slate-500">Max: {iaMax} (50%: {iaThreshold})</span>
              </div>
              <div className="text-[11px] text-slate-500 mb-2">Base IA: <strong>{baseIa}</strong> / {iaMax}</div>
              
              <div className="flex gap-2 items-center">
                <input 
                  type="number" 
                  className={`ctrl w-full ${iaError ? 'border-red-500 focus:border-red-500' : ''}`}
                  value={iaMod} 
                  onChange={e => setIaMod(e.target.value)} 
                  min="0" 
                  step="0.5" 
                  disabled={isPending} 
                  placeholder="0"
                />
              </div>

              {/* Quick Fill / Clear */}
              <div className="flex gap-2 mt-2">
                {maxAllowedIaMod > 0 && (
                  <button 
                    type="button" 
                    className="btn btn-neu btn-xs" 
                    style={{ fontSize: 10.5, padding: '2px 6px' }}
                    onClick={() => setIaMod(maxAllowedIaMod.toString())}
                    disabled={isPending}
                    title="Fill maximum allowed grace marks"
                  >
                    Set Max (+{maxAllowedIaMod})
                  </button>
                )}
                <button 
                  type="button" 
                  className="btn btn-neu btn-xs" 
                  style={{ fontSize: 10.5, padding: '2px 6px' }}
                  onClick={() => setIaMod('0')}
                  disabled={isPending}
                >
                  Clear (0)
                </button>
              </div>

              {iaError && <div className="text-[11px] text-red-600 mt-1.5 font-medium leading-tight">{iaError}</div>}
            </div>

            {/* UE Moderation */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-slate-800">UE Moderation</label>
                <span className="text-[11px] font-semibold text-slate-500">Max: {ueMax} (50%: {ueThreshold})</span>
              </div>
              <div className="text-[11px] text-slate-500 mb-2">Base UE: <strong>{baseUe}</strong> / {ueMax}</div>

              {isRL ? (
                <div className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded border border-amber-200">
                  <i className="lni lni-warning mr-1"></i> Exam not sat yet (RL). UE moderation cannot be applied.
                </div>
              ) : (
                <>
                  <div className="flex gap-2 items-center">
                    <input 
                      type="number" 
                      className={`ctrl w-full ${ueError ? 'border-red-500 focus:border-red-500' : ''}`}
                      value={ueMod} 
                      onChange={e => setUeMod(e.target.value)} 
                      min="0" 
                      step="0.5" 
                      disabled={isPending} 
                      placeholder="0"
                    />
                  </div>

                  {/* Quick Fill / Clear */}
                  <div className="flex gap-2 mt-2">
                    {maxAllowedUeMod > 0 && (
                      <button 
                        type="button" 
                        className="btn btn-neu btn-xs" 
                        style={{ fontSize: 10.5, padding: '2px 6px' }}
                        onClick={() => setUeMod(maxAllowedUeMod.toString())}
                        disabled={isPending}
                        title="Fill maximum allowed grace marks"
                      >
                        Set Max (+{maxAllowedUeMod})
                      </button>
                    )}
                    <button 
                      type="button" 
                      className="btn btn-neu btn-xs" 
                      style={{ fontSize: 10.5, padding: '2px 6px' }}
                      onClick={() => setUeMod('0')}
                      disabled={isPending}
                    >
                      Clear (0)
                    </button>
                  </div>
                </>
              )}

              {ueError && <div className="text-[11px] text-red-600 mt-1.5 font-medium leading-tight">{ueError}</div>}
            </div>
          </div>

          {/* Live Outcome Preview */}
          <div className="p-3 bg-blue-50/60 rounded-lg border border-blue-200">
            <div className="text-[11px] font-bold text-blue-900 uppercase tracking-wider mb-1.5 flex justify-between items-center">
              <span>Live Projected Result</span>
              {isProjectedPass ? (
                <span className="badge badge-green font-bold text-[10.5px]">Projected: Pass (Rescued)</span>
              ) : isRL ? (
                <span className="badge badge-amber font-bold text-[10.5px]">Projected: RL</span>
              ) : (
                <span className="badge badge-red font-bold text-[10.5px]">Projected: Fail</span>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <span className="text-slate-500 block">New IA:</span>
                <span className="font-bold text-slate-800">
                  {projectedIa} <span className="text-slate-400 font-normal">/ {iaMax}</span>
                </span>
                <span className={`text-[10px] block font-semibold ${projectedIa >= iaThreshold ? 'text-green-600' : 'text-red-500'}`}>
                  {projectedIa >= iaThreshold ? '✓ ≥ 50%' : '✗ Below 50%'}
                </span>
              </div>

              <div>
                <span className="text-slate-500 block">New UE:</span>
                <span className="font-bold text-slate-800">
                  {projectedUe} <span className="text-slate-400 font-normal">/ {ueMax}</span>
                </span>
                <span className={`text-[10px] block font-semibold ${projectedUe >= ueThreshold ? 'text-green-600' : 'text-red-500'}`}>
                  {projectedUe >= ueThreshold ? '✓ ≥ 50%' : '✗ Below 50%'}
                </span>
              </div>

              <div>
                <span className="text-slate-500 block">Combined Total:</span>
                <span className="font-bold text-slate-900 text-sm">{projectedTotal}</span>
                <span className="text-slate-400 text-[10px] block">/ {maxTotal}</span>
              </div>
            </div>
          </div>

          {saveError && (
            <div className="danger-box mt-3 text-xs">
              <i className="lni lni-warning"></i> {saveError}
            </div>
          )}
        </div>

        <div className="modal-ftr">
          <button className="btn btn-neu" onClick={onClose} disabled={isPending}>Cancel</button>
          <button 
            className="btn btn-primary" 
            onClick={handleSave} 
            disabled={isPending || hasValidationError}
            title={hasValidationError ? 'Resolve errors before saving' : 'Save moderation'}
          >
            {isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
