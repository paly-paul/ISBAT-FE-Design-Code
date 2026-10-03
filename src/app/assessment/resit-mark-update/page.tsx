'use client'

import { useState, useEffect } from 'react'
import { TableSearch } from '@/components/TableSearch'
import { SearchSelect } from '@/components/SearchSelect'
import { Toast } from '@/components/Toast'
import { ScrollTable } from '@/components/ScrollTable'
import { EmptyState } from '@/components/EmptyState'
import { TableLoadingState } from '@/components/TableLoadingState'
import { useIntakesDropdown } from '@/hooks/academic/useIntakes'
import { useResitConfigs } from '@/hooks/assessment/useResitConfigs'
import { useResitMarkUpdates, usePushResitMarkUpdate } from '@/hooks/assessment/useResitMarkUpdates'
import type { ResitMarkUpdateItem, ResitMarkUpdatePart } from '@/lib/api/assessment/resitMarkUpdates'
import { useQueryClient } from '@tanstack/react-query'
import { RESIT_MARK_UPDATES_KEYS } from '@/hooks/assessment/useResitMarkUpdates'

export default function ResitMarkUpdatePage() {
  const queryClient = useQueryClient()
  const [intakeGuid, setIntakeGuid] = useState<string>('')
  const [resitConfigGuid, setResitConfigGuid] = useState<string>('')
  const [statusTab, setStatusTab] = useState<number>(0)
  const [search, setSearch] = useState<string>('')
  const [searchInput, setSearchInput] = useState<string>('')
  const [page, setPage] = useState<number>(1)
  const pageSize = 10

  const { data: intakes, isLoading: intakesLoading } = useIntakesDropdown()

  useEffect(() => {
    if (intakes && intakes.length > 0 && !intakeGuid) {
      const current = intakes.find(i => i.currentIntake) || intakes[0]
      if (current) setIntakeGuid(current.intakeGuid)
    }
  }, [intakes, intakeGuid])

  const { data: resitConfigsData, isLoading: configsLoading } = useResitConfigs(1, 50, intakeGuid || undefined)

  useEffect(() => {
    if (resitConfigsData && resitConfigsData.items.length > 0 && intakeGuid) {
      const active = resitConfigsData.items.find(r => r.isActive) || resitConfigsData.items[0]
      if (active) setResitConfigGuid(active.resitConfigGuid)
    } else if (resitConfigsData && resitConfigsData.items.length === 0) {
      setResitConfigGuid('')
    }
  }, [resitConfigsData, intakeGuid])

  const { data: markUpdatesData, isLoading: updatesLoading } = useResitMarkUpdates({
    intakeGuid,
    resitConfigGuid,
    status: statusTab,
    search: search || undefined,
    page,
    pageSize
  }, !!intakeGuid && !!resitConfigGuid)

  useEffect(() => {
    const timer = setTimeout(() => {
      if (search !== searchInput) {
        setSearch(searchInput)
        setPage(1)
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [searchInput, search])

  const summary = markUpdatesData?.summary || { ready: 0, pending: 0, pushed: 0 }

  const handleIntakeChange = (val: string) => {
    setIntakeGuid(val)
    setPage(1)
  }

  const handleResitChange = (val: string) => {
    setResitConfigGuid(val)
    setPage(1)
  }

  const [pushModalData, setPushModalData] = useState<ResitMarkUpdateItem | null>(null)
  const pushMutation = usePushResitMarkUpdate()
  const [toastMsg, setToastMsg] = useState<{msg: string, type: 'success' | 'error'} | null>(null)

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToastMsg({ msg, type })
    setTimeout(() => setToastMsg(null), 5000)
  }

  const handlePush = () => {
    if (!pushModalData) return
    pushMutation.mutate(pushModalData.resitApplicationGuid, {
      onSuccess: (res) => {
        const iaMsg = res.ia.status === 3 ? `IA updated to ${res.ia.newMark}.` : res.ia.status === 4 ? `IA not updated — mark not higher.` : `IA stays pending.`
        const ueMsg = res.ue.status === 3 ? `UE updated to ${res.ue.newMark}.` : res.ue.status === 4 ? `UE not updated — mark not higher.` : `UE stays pending.`
        showToast(`${iaMsg} ${ueMsg}`, 'success')
        setPushModalData(null)
      },
      onError: (err: any) => {
        showToast(err?.message || 'Error pushing marks', 'error')
        queryClient.invalidateQueries({ queryKey: RESIT_MARK_UPDATES_KEYS.lists() })
      }
    })
  }

  const renderMarkCell = (part: ResitMarkUpdatePart) => {
    switch (part.status) {
      case 0:
        return (
          <div>
            <div className="text-gray-400 font-medium">—</div>
            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] uppercase font-semibold">Not applied</span>
          </div>
        )
      case 1:
        return (
          <div>
            <div className="font-medium">{part.currentMark?.toFixed(2) ?? '--'} <span className="text-gray-400 font-normal">· waiting</span></div>
            <span className="px-2 py-0.5 bg-amber-50 text-amber-600 rounded text-[10px] uppercase font-semibold">Pending</span>
          </div>
        )
      case 2:
        return (
          <div>
            <div className="font-medium text-blue-600">{part.currentMark?.toFixed(2) ?? '--'} → {part.newMark?.toFixed(2) ?? '--'} / {part.maxMark?.toFixed(2) ?? '--'}</div>
            <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] uppercase font-semibold inline-flex items-center gap-1">
              Ready
              {(part.newMark ?? 0) <= (part.currentMark ?? 0) && <span className="text-gray-500 lowercase font-normal">(lower)</span>}
            </span>
          </div>
        )
      case 3:
        return (
          <div>
            <div className="font-medium text-emerald-600">{part.currentMark?.toFixed(2) ?? '--'} / {part.maxMark?.toFixed(2) ?? '--'}</div>
            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded text-[10px] uppercase font-semibold">Updated</span>
          </div>
        )
      case 4:
        return (
          <div>
            <div className="font-medium text-gray-500">{part.currentMark?.toFixed(2) ?? '--'} / {part.maxMark?.toFixed(2) ?? '--'}</div>
            <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-[10px] uppercase font-semibold">Not updated - lower</span>
          </div>
        )
      default: return null
    }
  }

  return (
    <div className="page active">
      <Toast toast={toastMsg} />
      <div className="pg-hdr flex justify-between items-end">
        <div>
          <h1 className="pg-title">Resit Mark Update</h1>
          <p className="pg-sub">Copy resit marks into exam results</p>
        </div>
        <div className="flex gap-4 items-center">
          <div className="w-64">
            <label className="block text-xs font-medium text-gray-600 mb-1">Academic Session</label>
            <SearchSelect
              placeholder="Select Intake..."
              value={intakeGuid}
              onChange={handleIntakeChange}
              disabled={intakesLoading}
              options={(intakes || []).map(i => ({
                value: i.intakeGuid,
                label: `${i.description || 'Intake'} (${i.intakeCode})`
              }))}
            />
          </div>
          <div className="w-64">
            <label className="block text-xs font-medium text-gray-600 mb-1">Resit</label>
            <SearchSelect
              placeholder={configsLoading ? "Loading..." : (resitConfigsData?.items.length === 0 ? "No resit found" : "Select Resit...")}
              value={resitConfigGuid}
              onChange={handleResitChange}
              disabled={configsLoading || !resitConfigsData?.items.length}
              options={(resitConfigsData?.items || []).map(r => ({
                value: r.resitConfigGuid,
                label: r.refCode || 'Unnamed Resit'
              }))}
            />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex bg-gray-100 p-1 rounded-lg w-full md:w-auto">
            <button 
              onClick={() => { setStatusTab(0); setPage(1) }}
              className={`flex-1 md:flex-none px-4 py-2 text-sm font-medium rounded-md transition-all ${statusTab === 0 ? 'bg-white shadow-sm text-primary' : 'text-gray-600 hover:text-gray-800'}`}
            >
              Ready ({summary.ready})
            </button>
            <button 
              onClick={() => { setStatusTab(1); setPage(1) }}
              className={`flex-1 md:flex-none px-4 py-2 text-sm font-medium rounded-md transition-all ${statusTab === 1 ? 'bg-white shadow-sm text-primary' : 'text-gray-600 hover:text-gray-800'}`}
            >
              Pending ({summary.pending})
            </button>
            <button 
              onClick={() => { setStatusTab(2); setPage(1) }}
              className={`flex-1 md:flex-none px-4 py-2 text-sm font-medium rounded-md transition-all ${statusTab === 2 ? 'bg-white shadow-sm text-primary' : 'text-gray-600 hover:text-gray-800'}`}
            >
              Pushed ({summary.pushed})
            </button>
          </div>
          <TableSearch
            className="w-full sm:w-64"
            placeholder="Search student or unit..."
            value={searchInput}
            onChange={setSearchInput}
            results={[]}
            minChars={999}
          />
        </div>

        <ScrollTable>
          <table>
            <thead>
              <tr>
                <th className="w-24">Action</th>
                <th>Student</th>
                <th>Course unit</th>
                <th>IA</th>
                <th>UE</th>
              </tr>
            </thead>
            <tbody>
              {updatesLoading ? (
                <TableLoadingState colSpan={5} title="Loading updates..." />
              ) : !markUpdatesData || markUpdatesData.rows.items.length === 0 ? (
                <EmptyState
                  colSpan={5}
                  title={search ? 'No results found' : 'No data yet'}
                  subtitle={
                    search ? 'No students or units match your search.' :
                    statusTab === 0 ? 'Nothing to push — no new resit marks yet.' :
                    statusTab === 1 ? 'No students waiting for resit marks.' :
                    statusTab === 2 ? 'No marks pushed yet for this resit.' :
                    'There are no records to display at the moment.'
                  }
                  hasFilters={!!search}
                  onClearFilters={search ? () => { setSearchInput(''); setSearch(''); setPage(1); } : undefined}
                />
              ) : (
                markUpdatesData?.rows.items.map((row) => (
                  <tr key={row.resitApplicationGuid}>
                    <td className="align-middle">
                      {statusTab === 0 && (
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => setPushModalData(row)}
                          disabled={!!row.warning}
                          title={row.warning || 'Push Marks'}
                        >
                          Push
                        </button>
                      )}
                    </td>
                    <td>
                      <div className="font-semibold text-gray-800">{row.studentName}</div>
                      <div className="text-xs text-gray-500">{row.studentNum || row.studentRegNo}</div>
                      <div className="text-xs text-gray-500">{row.programmeName}</div>
                      {row.warning && (
                        <div className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                          <i className="lni lni-warning"></i> {row.warning}
                        </div>
                      )}
                    </td>
                    <td>
                      <div className="font-medium text-gray-800">{row.unitCode} · {row.unitTypeName}</div>
                      <div className="text-sm text-gray-600">{row.unitName}</div>
                    </td>
                    <td>{renderMarkCell(row.ia)}</td>
                    <td>{renderMarkCell(row.ue)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </ScrollTable>

        {markUpdatesData && markUpdatesData.rows.totalCount > 0 && (
          <div className="p-4 border-t border-gray-100 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Showing <span className="font-medium">{(page - 1) * pageSize + 1}</span> to <span className="font-medium">{Math.min(page * pageSize, markUpdatesData.rows.totalCount)}</span> of <span className="font-medium">{markUpdatesData.rows.totalCount}</span>
            </div>
            <div className="flex gap-1">
              <button 
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="px-3 py-1 border border-gray-200 rounded-md text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                Prev
              </button>
              <div className="px-3 py-1 bg-primary text-white rounded-md text-sm font-medium">
                {page}
              </div>
              <button 
                onClick={() => setPage(page + 1)}
                disabled={page * pageSize >= markUpdatesData.rows.totalCount}
                className="px-3 py-1 border border-gray-200 rounded-md text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {pushModalData && (
        <div className="modal-overlay open" onClick={() => setPushModalData(null)}>
          <div className="modal" style={{ maxWidth: '500px', width: '100%' }} onClick={e => e.stopPropagation()}>
            <div className="modal-hdr modal-hdr-blue">
              <div className="modal-title">
                <i className="lni lni-cloud-upload"></i> Push resit marks
              </div>
              <button onClick={() => setPushModalData(null)} className="modal-close">
                <i className="lni lni-close"></i>
              </button>
            </div>
            
            <div className="modal-body p-6">
              <div className="mb-4">
                <div className="font-medium">{pushModalData.studentName} · {pushModalData.studentNum || pushModalData.studentRegNo}</div>
                <div className="text-gray-600">{pushModalData.unitCode} · {pushModalData.unitName}</div>
              </div>
              
              <div className="space-y-3 bg-gray-50 p-4 rounded mb-4 text-sm">
                {[pushModalData.ia, pushModalData.ue].map((part, idx) => {
                  const label = idx === 0 ? 'IA' : 'UE'
                  if (part.status === 0) return null
                  if (part.status === 1) {
                    return (
                      <div key={label} className="flex gap-4 text-amber-600">
                        <div className="w-8 font-semibold">{label}</div>
                        <div>waiting for the resit {idx === 0 ? 'coursework evaluation' : 'exam mark'} — stays pending</div>
                      </div>
                    )
                  }
                  if (part.status === 2) {
                    if ((part.newMark ?? 0) > (part.currentMark ?? 0)) {
                      return (
                        <div key={label} className="flex gap-4 text-emerald-600">
                          <div className="w-8 font-semibold">{label}</div>
                          <div>{part.currentMark?.toFixed(2) ?? '--'} → {part.newMark?.toFixed(2) ?? '--'} / {part.maxMark?.toFixed(2) ?? '--'} — will be updated</div>
                        </div>
                      )
                    } else {
                      return (
                        <div key={label} className="flex gap-4 text-gray-500">
                          <div className="w-8 font-semibold">{label}</div>
                          <div>{part.newMark?.toFixed(2) ?? '--'} is not higher than {part.currentMark?.toFixed(2) ?? '--'} — current mark is kept</div>
                        </div>
                      )
                    }
                  }
                  return null
                })}
              </div>
              <p className="text-sm text-gray-500 mb-0">
                The exam result is only changed when the resit mark is higher.
              </p>
            </div>
              
            <div className="modal-ftr">
              <button onClick={() => setPushModalData(null)} className="btn btn-neu" disabled={pushMutation.isPending}>
                Cancel
              </button>
              <span className="flex-1"></span>
              <button onClick={handlePush} className="btn btn-primary" disabled={pushMutation.isPending}>
                <i className="lni lni-checkmark"></i> {pushMutation.isPending ? 'Pushing...' : 'Push marks'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
