'use client'
import { useState, useEffect } from 'react'
import {
  useResitEligibleStudents,
  useResitDropdownUnits,
  useResitCheckboxState,
  useResitAppliedUnits,
  useResitApplicationForEdit,
  useSubmitResitApplication,
  useDeleteResitApplication
} from '@/hooks/assessment/useResitApply'
import { ResitEligibleStudentDto, ResitApplicationListItemDto } from '@/lib/api/assessment/resitApply'
import { Toast } from '@/components/Toast'
import { TableSearch } from '@/components/TableSearch'
import { Pagination } from '@/components/Pagination'
import { ScrollTable } from '@/components/ScrollTable'
import { TableLoadingState } from '@/components/TableLoadingState'
import { EmptyState } from '@/components/EmptyState'
import { ActionMenu } from '@/components/ActionMenu'
import { SearchSelect } from '@/components/SearchSelect'

export default function ResitApplyPage() {
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)

  // View state
  const [selectedStudent, setSelectedStudent] = useState<ResitEligibleStudentDto | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ResitApplicationListItemDto | null>(null)

  // List view state
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (search !== searchInput) {
        setSearch(searchInput)
        setPage(1)
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [searchInput, search])

  const { data: listData, isLoading: listLoading, refetch: refetchList } = useResitEligibleStudents({ page, pageSize: 10, search })

  // Form view state
  const [editingGuid, setEditingGuid] = useState<string | null>(null)
  const [courseUnitGuid, setCourseUnitGuid] = useState('')
  const [cw, setCw] = useState(false)
  const [ue, setUe] = useState(false)
  const [ueType, setUeType] = useState<0 | 1>(0)

  const { data: dropdownUnits } = useResitDropdownUnits(selectedStudent?.studentGuid || null)
  const { data: checkboxState } = useResitCheckboxState(selectedStudent?.studentGuid || null, courseUnitGuid || null)
  const { data: appliedUnits, refetch: refetchApplied } = useResitAppliedUnits(selectedStudent?.studentGuid || null)
  const { data: editData } = useResitApplicationForEdit(editingGuid)

  const submitMutation = useSubmitResitApplication()
  const deleteMutation = useDeleteResitApplication()

  // Reset form when dropdown changes
  useEffect(() => {
    if (!editingGuid) {
      setCw(false)
      setUe(false)
      setUeType(0)
    }
  }, [courseUnitGuid, editingGuid])

  // Populate form when edit data loads
  useEffect(() => {
    if (editData) {
      setCourseUnitGuid(editData.courseUnitGuid)
      setCw(editData.cw)
      setUe(editData.ue)
      setUeType(editData.ueType as 0 | 1)
    }
  }, [editData])

  // UI Rules based on checkboxState
  const iaPassed = checkboxState?.iaPassed ?? false
  const uePassed = checkboxState?.uePassed ?? false
  const hasResult = checkboxState?.hasResult ?? false
  const isTheoryPracticalUnit = checkboxState?.isTheoryPracticalUnit ?? false

  const handleTheoryPracticalChange = (type: 0 | 1) => {
    setUeType(type)
    if (type === 1) {
      setCw(false) // Practical is UE only
    }
  }

  const handleApply = () => {
    if (!selectedStudent || !courseUnitGuid) return
    if (!cw && !ue) {
      setToast({ msg: 'Select at least one of IA or UE.', type: 'error' })
      return
    }
    
    submitMutation.mutate({
      studentGuid: selectedStudent.studentGuid,
      data: { courseUnitGuid, cw, ue, ueType }
    }, {
      onSuccess: () => {
        setToast({ msg: editingGuid ? 'Application updated.' : 'Resit applied successfully.', type: 'success' })
        handleCancelEdit()
      },
      onError: (err: any) => {
        const msg = err.response?.data?.errors?.[0] || 'Failed to submit'
        setToast({ msg, type: 'error' })
      }
    })
  }

  const handleDelete = (app: ResitApplicationListItemDto) => {
    if (app.feePaid) return
    setDeleteTarget(app)
  }

  const confirmDelete = () => {
    if (!deleteTarget) return
    deleteMutation.mutate(deleteTarget.resitApplicationGuid, {
      onSuccess: (res) => {
        if (res.deleted) {
          setToast({ msg: res.message, type: 'success' })
          refetchApplied()
          // reload dropdown via invalidate in mutation
          if (editingGuid === deleteTarget.resitApplicationGuid) handleCancelEdit()
        } else {
          setToast({ msg: res.message, type: 'error' })
          refetchApplied()
        }
        setDeleteTarget(null)
      },
      onError: () => setDeleteTarget(null)
    })
  }

  const handleCancelEdit = () => {
    setEditingGuid(null)
    setCourseUnitGuid('')
    setCw(false)
    setUe(false)
    setUeType(0)
  }

  const handleCloseModal = () => {
    setSelectedStudent(null)
    handleCancelEdit()
    refetchList()
  }

  return (
    <div className="page active">
      <div className="pg-hdr flex justify-between items-end">
        <div>
          <h1 className="pg-title">Resit Apply</h1>
          <p className="pg-sub">Apply for resit on behalf of students</p>
        </div>
      </div>

      <div className="card">
          <div className="card-hdr">
            <div className="card-title"><span className="ctitle-icon"><i className="lni lni-users"></i></span> Eligible Students</div>
          </div>
          <div className="flex gap-2 mb-[14px]">
            <TableSearch
                className="w-full sm:w-80"
                placeholder="Student Number / Registration Number / Student Name"
                value={searchInput}
                onChange={setSearchInput}
                results={[]}
                minChars={999}
              />
              <button className="btn btn-white" onClick={() => { setSearchInput(''); setSearch(''); setPage(1) }}>Clear</button>
            </div>
          
          <ScrollTable>
            <table>
              <thead>
                <tr>
                  <th>Action</th>
                  <th>Student No</th>
                  <th>Student Name</th>
                  <th>Program</th>
                  <th>Batch</th>
                  <th>Semester</th>
                </tr>
              </thead>
              <tbody>
                {listLoading 
                  ? <TableLoadingState colSpan={6} />
                  : (!listData?.items || listData.items.length === 0) 
                    ? <EmptyState colSpan={6} hasFilters={!!search} onClearFilters={() => { setSearchInput(''); setSearch(''); setPage(1) }} />
                    : listData.items.map(s => (
                      <tr key={s.studentGuid}>
                        <td>
                          <ActionMenu>
                            <button 
                              className="btn btn-neu btn-sm"
                              onClick={() => setSelectedStudent(s)}
                            >
                              <i className="lni lni-eye"></i> View
                            </button>
                            <button 
                              className="btn btn-neu btn-sm"
                              onClick={() => setSelectedStudent(s)}
                            >
                              <i className="lni lni-circle-plus"></i> Apply Resit
                            </button>
                          </ActionMenu>
                        </td>
                        <td className="text-blue font-bold font-mono">{s.studentRegNo || '—'}</td>
                        <td><strong>{s.studentName || '—'}</strong></td>
                        <td>{s.programName || '—'}</td>
                        <td>{s.batchCode || '—'}</td>
                        <td>{s.semesterName || '—'}</td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </ScrollTable>
          {listData && listData.totalCount > 10 && (
            <Pagination 
              page={page} 
              totalPages={Math.ceil(listData.totalCount / 10)} 
              totalCount={listData.totalCount} 
              itemLabel="students"
              onPageChange={setPage} 
            />
          )}
        </div>

      {selectedStudent && (
        <div className="modal-overlay open" onClick={handleCloseModal}>
          <div className="modal" style={{ maxWidth: 900 }} onClick={e => e.stopPropagation()}>
            <div className="modal-hdr flex justify-between items-center p-4 border-b">
              <h2 className="modal-title font-semibold text-lg">Resit Application - {selectedStudent.studentName} ({selectedStudent.studentRegNo})</h2>
              <button className="modal-close" onClick={handleCloseModal}>
                <i className="lni lni-close"></i>
              </button>
            </div>
            <div className="modal-body p-0" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
            
            <div className="p-6 border-b border-gray-100">
              <h3 className="font-semibold text-lg mb-4">{editingGuid ? 'Edit Resit Application' : 'Apply for Resit'}</h3>
              
              {(!dropdownUnits || dropdownUnits.length === 0) && !editingGuid ? (
                <div className="text-gray-500">No units left to apply for.</div>
              ) : (
                <div className="flex flex-col md:flex-row gap-4 items-start">
                  <div className="w-full md:w-1/3">
                    <label className="frm-lbl">Course Unit</label>
                    <SearchSelect
                      placeholder="-- Select --"
                      value={courseUnitGuid}
                      onChange={setCourseUnitGuid}
                      disabled={!!editingGuid}
                      options={
                        editingGuid && editData
                          ? [{ value: editData.courseUnitGuid, label: editData.displayName }]
                          : (dropdownUnits?.map(u => ({ value: u.courseUnitGuid, label: u.displayName })) || [])
                      }
                    />
                  </div>
                  
                  <div className="flex-1 flex flex-wrap gap-6 items-end pb-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={cw} 
                        onChange={e => setCw(e.target.checked)}
                        disabled={!courseUnitGuid || iaPassed || (!hasResult && !editingGuid && !courseUnitGuid) || (ueType === 1)}
                        className="rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <span>IA (Coursework)</span>
                    </label>
                    
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={ue} 
                        onChange={e => setUe(e.target.checked)}
                        disabled={!courseUnitGuid || uePassed || (!hasResult && !editingGuid && !courseUnitGuid)}
                        className="rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <span>UE (Exam)</span>
                    </label>

                    {isTheoryPracticalUnit && (
                      <div className="flex items-center gap-4 border-l pl-4 ml-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="radio" 
                            checked={ueType === 0} 
                            onChange={() => handleTheoryPracticalChange(0)}
                            className="text-primary focus:ring-primary"
                          />
                          <span>Theory</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="radio" 
                            checked={ueType === 1} 
                            onChange={() => handleTheoryPracticalChange(1)}
                            className="text-primary focus:ring-primary"
                          />
                          <span>Practical</span>
                        </label>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {editingGuid && (
                      <button className="btn btn-white" onClick={handleCancelEdit}>Cancel</button>
                    )}
                    <button 
                      className="btn btn-primary" 
                      onClick={handleApply}
                      disabled={!courseUnitGuid || (!cw && !ue) || submitMutation.isPending}
                    >
                      {editingGuid ? 'Update' : 'Apply'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6">
              <h3 className="font-semibold text-lg mb-4">Applied Units</h3>
              <div style={{ maxHeight: 350, overflowY: 'auto' }}>
              <ScrollTable>
                <table>
                  <thead>
                    <tr>
                      <th>Actions</th>
                      <th>Code</th>
                      <th>Name</th>
                      <th>Type</th>
                      <th className="text-center">IA</th>
                      <th className="text-center">UE</th>
                      <th className="text-center">Status</th>
                      <th className="text-center">Payment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(!appliedUnits || appliedUnits.length === 0) ? (
                      <EmptyState colSpan={8} hasFilters={false} onClearFilters={() => {}} />
                    ) : (
                      appliedUnits.map(app => (
                        <tr key={app.resitApplicationGuid}>
                          <td>
                            <ActionMenu>
                              <button 
                                className="btn btn-neu btn-sm"
                                disabled={app.feePaid}
                                title={app.feePaid ? "Paid applications cannot be edited" : ""}
                                onClick={() => setEditingGuid(app.resitApplicationGuid)}
                              >
                                <i className="lni lni-pencil-alt"></i> Edit
                              </button>
                              <button 
                                className="btn btn-neu btn-sm"
                                style={{ color: 'var(--red)' }}
                                disabled={app.feePaid || deleteMutation.isPending}
                                title={app.feePaid ? "Paid applications cannot be deleted" : ""}
                                onClick={() => handleDelete(app)}
                              >
                                <i className="lni lni-trash"></i> Delete
                              </button>
                            </ActionMenu>
                          </td>
                          <td className="text-blue font-bold font-mono">{app.unitCode}</td>
                          <td><strong>{app.unitName}</strong></td>
                          <td>{app.unitTypeName}</td>
                          <td className="text-center">{app.cw ? 'Yes' : 'No'}</td>
                          <td className="text-center">{app.ue ? 'Yes' : 'No'}</td>
                          <td className="text-center">
                            <span className="badge badge-warn">Pending</span>
                          </td>
                          <td className="text-center">
                            {app.feePaid ? (
                              <span className="badge badge-success">Paid</span>
                            ) : (
                              <span className="badge badge-err">Not Paid</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </ScrollTable>
              </div>
            </div>
          </div>
        </div>
        </div>
      )}

      {deleteTarget && (
        <div className="perm-delete-overlay" style={{ position: 'fixed', zIndex: 500 }} onClick={() => setDeleteTarget(null)}>
          <div className="perm-delete-card tab-panel-in" onClick={e => e.stopPropagation()}>
            <div className="perm-delete-icon"><i className="lni lni-trash-can"></i></div>
            <div className="perm-delete-title">Delete Application?</div>
            <div className="perm-delete-sub">
              Are you sure you want to delete the resit application for {deleteTarget.unitName}? This cannot be undone.
            </div>
            <div className="perm-delete-actions">
              <button className="btn btn-neu" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="btn btn-danger" disabled={deleteMutation.isPending} onClick={confirmDelete}>
                <i className="lni lni-trash-can"></i> {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast toast={toast} />
    </div>
  )
}
