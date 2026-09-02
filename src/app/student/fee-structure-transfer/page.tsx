'use client'
import { useState } from 'react'
import { Toast } from '@/components/Toast'
import { SearchSelect } from '@/components/SearchSelect'
import { ScrollTable } from '@/components/ScrollTable'
import { EmptyState } from '@/components/EmptyState'
import { Pagination } from '@/components/Pagination'
import { ActionMenu } from '@/components/ActionMenu'
import { StudentLookup } from '@/components/student/StudentLookup'
import { BaselinePanel } from '@/components/student/BaselinePanel'
import { StudentDto } from '@/lib/api/student/student'
import { SuccessPopup } from '@/components/modals/shared/SuccessPopup'

export default function Page() {
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)
  function showToast(msg: string, type = '') { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }

  const [student, setStudent] = useState<StudentDto | null>(null)
  
  // Mock target fee structures
  const feeStructures = [
    { value: 'FEE-1', label: 'BSC.AIML.CE.LCL.FL25 (BSC.AIML.CE.LCL.FL25)' },
    { value: 'FEE-2', label: 'BSC.VFX.FL.25.LCL (BSC.VFX.FL.25.LCL)' }
  ]
  const [targetFeeStructure, setTargetFeeStructure] = useState('')
  const [applyPrevious, setApplyPrevious] = useState(false)
  const [remarks, setRemarks] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)
  
  const [page, setPage] = useState(1)
  const itemsPerPage = 10
  
  // Mock history
  const [history, setHistory] = useState([
    { id: '1', code: 'FT/20261/691', date: '02/09/2026', oldFee: 'BSC.VFX.FL.25.LCL(BSC.VFX.FL.25.LCL)', newFee: 'BSC.AIML.CE.LCL.FL25(BSC.AIML.CE.LCL.FL25)' }
  ])

  function handleLoad(s: StudentDto) { setStudent(s); showToast(`${s.studentName} loaded`, 'ok') }
  function handleClear() {
    setStudent(null)
    setTargetFeeStructure('')
    setApplyPrevious(false)
    setRemarks('')
  }
  
  const totalCount = history.length
  const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage))
  const paginatedHistory = history.slice((page - 1) * itemsPerPage, page * itemsPerPage)

  const canExecute = !!(student && targetFeeStructure && remarks.trim())

  function executeTransfer() {
    if (!canExecute) return
    const newFee = feeStructures.find(f => f.value === targetFeeStructure)?.label || ''
    const newRecord = {
      id: Date.now().toString(),
      code: `FT/20261/${Math.floor(Math.random() * 1000)}`,
      date: new Date().toLocaleDateString('en-GB'),
      oldFee: 'BSC.VFX.FL.25.LCL(BSC.VFX.FL.25.LCL)',
      newFee
    }
    setHistory(prev => [newRecord, ...prev])
    setShowSuccess(true)
    setTargetFeeStructure('')
    setApplyPrevious(false)
    setRemarks('')
  }

  return (
    <>
      <div className="page active">
        <div className="pg-hdr">
          <div>
            <div className="pg-title">Fee Structure Transfer</div>
            <div className="pg-sub">Transfer student to a new fee structure</div>
          </div>
        </div>

        <StudentLookup onLoad={handleLoad} onClear={handleClear} loaded={!!student} />

        {!student && (
          <div className="empty">
            <div className="empty-icon"><i className="lni lni-dollar"></i></div>
            <div className="empty-title">No Student Loaded</div>
            <div className="empty-sub">Search for a student to view and transfer their fee structure.</div>
          </div>
        )}

        {student && (
          <>
            <BaselinePanel
              label="Student Details (Read-Only)"
              items={[
                { label: 'Name', value: student.studentName },
                { label: 'Student Number', value: student.studentNum || student.studentRegNo || '—' },
                { label: 'Programme', value: student.programName || '—' },
                { label: 'Campus', value: 'ISBAT University - Main Campus' },
                { label: 'Semester', value: student.semesterName || '—' },
                { label: 'Batch', value: student.batchCode || '—', accent: true },
                { label: 'Intake', value: '20261' },
                { label: 'Fee Structure', value: 'BSC.AIML.CE.LCL.FL25 (BSC.AIML.CE.LCL.FL25)' },
              ]}
            />
            
            <div style={{ color: 'var(--red)', fontWeight: 700, marginBottom: 16, marginTop: -8, marginLeft: 20 }}>
              Discount : 011230354-100%
            </div>

            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-hdr"><div className="card-title"><i className="lni lni-transfer"></i> Transfer Parameters</div></div>
              <div className="g2">
                <div className="fg">
                  <label className="lbl">New Fee Structure <span className="req">*</span></label>
                  <SearchSelect
                    placeholder="-Select-"
                    options={feeStructures}
                    value={targetFeeStructure}
                    onChange={setTargetFeeStructure}
                  />
                </div>
                <div className="fg" style={{ alignSelf: 'center', marginTop: 24 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: 'var(--g700)', fontWeight: 500 }}>
                    <input type="checkbox" checked={applyPrevious} onChange={e => setApplyPrevious(e.target.checked)} />
                    Fee change apply to previous semester also
                  </label>
                </div>
                <div className="fg" style={{ gridColumn: '1 / -1' }}>
                  <label className="lbl">Remarks <span className="req">*</span></label>
                  <textarea className="ctrl" rows={3} placeholder="Provide details for this transfer..." value={remarks} onChange={e => setRemarks(e.target.value)} />
                </div>
              </div>
              <div className="flex gap-2" style={{ justifyContent: 'flex-start', marginTop: 8 }}>
                <button className="btn btn-primary" disabled={!canExecute} onClick={executeTransfer}><i className="lni lni-checkmark"></i> Submit</button>
                <button className="btn btn-neu" onClick={handleClear}>Cancel</button>
              </div>
            </div>

            <div className="card">
              <div className="card-hdr">
                <div className="card-title"><i className="lni lni-alarm-clock"></i> Fee Structure Transfers</div>
              </div>
              <ScrollTable>
                <table>
                  <thead>
                    <tr>
                      <th style={{ width: 40 }}></th>
                      <th>Transfer Code</th>
                      <th>Transfer Date</th>
                      <th>Old Fee</th>
                      <th>New Fee</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedHistory.length === 0 ? (
                      <EmptyState colSpan={5} title="No transfers found" subtitle="This student has no fee structure transfer history." />
                    ) : (
                      paginatedHistory.map(r => (
                        <tr key={r.id}>
                          <td>
                            <ActionMenu>
                              <button className="btn btn-neu btn-sm" onClick={() => alert('View action triggered')}><i className="lni lni-eye"></i> View</button>
                            </ActionMenu>
                          </td>
                          <td className="font-mono text-blue">{r.code}</td>
                          <td>{r.date}</td>
                          <td>{r.oldFee}</td>
                          <td>{r.newFee}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </ScrollTable>
              {history.length > 0 && (
                <div style={{ padding: '0 16px 16px' }}>
                  <Pagination page={page} totalPages={totalPages} totalCount={totalCount} itemLabel="entries" onPageChange={setPage} />
                </div>
              )}
            </div>
          </>
        )}
      </div>
      {showSuccess && (
        <div className="modal-overlay open" style={{ zIndex: 9999 }}>
          <div className="modal" style={{ maxWidth: 400 }}>
            <SuccessPopup 
              title="Transfer Successful" 
              subtitle="The student's fee structure has been transferred successfully." 
              onClose={() => setShowSuccess(false)} 
            />
          </div>
        </div>
      )}
      <Toast toast={toast} />
    </>
  )
}
