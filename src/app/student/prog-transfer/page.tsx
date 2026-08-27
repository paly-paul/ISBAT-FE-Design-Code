'use client'
import { useState } from 'react'
import { Toast } from '@/components/Toast'
import { SearchSelect } from '@/components/SearchSelect'
import { ScrollTable } from '@/components/ScrollTable'
import { EmptyState } from '@/components/EmptyState'
import { StudentLookup } from '@/components/student/StudentLookup'
import { BaselinePanel } from '@/components/student/BaselinePanel'
import { StudentDto } from '@/lib/api/student/student'
import { useStudent } from '@/hooks/student/useStudents'
import { useProgramMasters } from '@/hooks/academic/useProgramMaster'

// Ported from isbat_student_module.html's Programme Transfer page. Student
// identity/baseline comes from the real student list (StudentLookup) and
// discount from the real GET /students/:guid (useStudent, same field the
// Student Profile page already reads — see formatDiscount below). New
// Programme is wired to the real Programme Master catalog
// (useProgramMasters, already used elsewhere in the app). There's no
// endpoint anywhere (students/ or academic/) that resolves batch/semester/
// fee-structure options for an arbitrary *target* programme the way
// students/resume/candidate does for a student's own current programme —
// New Batch/New Semester/New Fee Structure stay mock dropdowns, and there's
// no GET history endpoint for the transfer grid either, so it starts empty.
const TARGET_PROGRAMMES_FALLBACK = [{ value: '', label: 'No programmes available' }]

const TARGET_BATCHES = ['BSc.AF-2024B · Evening', 'BSc.AF-2025A · Day', 'MBA-2025A · Weekend']
const TARGET_SEMESTERS = ['Semester 1', 'Semester 2', 'Semester 3']
const TARGET_FEE_STRUCTURES = ['Local · $650/sem', 'Local · $750/sem', 'International · $1200/sem']

interface TransferHistoryRow {
  transferCode: string
  transferDate: string
  oldProgramme: string
  oldBatch: string
  oldSemester: string
  newProgramme: string
  newBatch: string
  newSemester: string
}
const TRANSFER_HISTORY: TransferHistoryRow[] = []

// calcType is documented ("1" = Amount, "2" = Percentage) on the
// student-discounts assign/update endpoints; StudentDetailDto carries the
// same field for whatever discount is already resolved onto the student —
// same helper as student/profile's own Discount display.
function formatDiscount(detail: { discountStatus: string | null; calcType: string | null; amtPer: number | null } | undefined) {
  if (!detail?.discountStatus || detail.discountStatus === 'Cancelled' || detail.discountStatus === 'CancelledImmediate') return 'None'
  const kind = detail.calcType === '2' ? '%' : detail.calcType === '1' ? 'Amt' : ''
  return detail.amtPer != null ? `${detail.amtPer}${kind}` : detail.discountStatus
}

export default function Page() {
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)
  const [student, setStudent] = useState<StudentDto | null>(null)
  const { data: detail } = useStudent(student?.studentGuid ?? null, !!student)

  const { data: programmes = [] } = useProgramMasters()
  const programOptions = programmes.length > 0
    ? programmes.map(p => ({ value: p.programGuid, label: p.programName }))
    : TARGET_PROGRAMMES_FALLBACK

  const [targetProg, setTargetProg] = useState('')
  const [targetBatch, setTargetBatch] = useState(TARGET_BATCHES[0])
  const [targetSemester, setTargetSemester] = useState(TARGET_SEMESTERS[0])
  const [targetFeeStructure, setTargetFeeStructure] = useState(TARGET_FEE_STRUCTURES[0])
  const [remarks, setRemarks] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)

  function showToast(msg: string, type = '') { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }
  function handleLoad(s: StudentDto) { setStudent(s); showToast(`${s.studentName} loaded`, 'ok') }
  function handleClear() {
    setStudent(null); setTargetProg(''); setTargetBatch(TARGET_BATCHES[0]); setTargetSemester(TARGET_SEMESTERS[0]); setTargetFeeStructure(TARGET_FEE_STRUCTURES[0]); setRemarks('')
  }

  const target = programOptions.find(p => p.value === targetProg)

  return (
    <>
      <div className="page active">
        <div className="pg-hdr"><div><div className="pg-title">Programme Transfer</div><div className="pg-sub">Move a student to a different academic programme</div></div></div>

        <StudentLookup onLoad={handleLoad} onClear={handleClear} loaded={!!student} />

        {!student && (
          <div className="empty">
            <div className="empty-icon"><i className="lni lni-graduation"></i></div>
            <div className="empty-title">No Student Loaded</div>
            <div className="empty-sub">Search for a student before executing a programme transfer.</div>
          </div>
        )}

        {student && (
          <>
            <div className="info-box" style={{ marginBottom: 16 }}>
              <i className="lni lni-information" style={{ color: 'var(--b700)', fontSize: 16, flexShrink: 0, marginTop: 1 }}></i>
              <div><strong>Academic Registrar Access.</strong> The previous programme track is archived as read-only — no history is deleted.</div>
            </div>

            <BaselinePanel
              label="Current Programme (Read-Only)"
              items={[
                { label: 'Student Name', value: student.studentName },
                { label: 'Programme', value: student.programName || '—' },
                // Campus/Intake/Admission Type have no field on
                // StudentDto/StudentDetailDto yet — shown as placeholders,
                // same convention as Batch Transfer's own Campus/Intake gap.
                { label: 'Campus', value: '—' },
                { label: 'Semester', value: student.semesterName || '—' },
                { label: 'Intake', value: '—' },
                { label: 'Fee Structure', value: 'Local · $750/sem' },
                { label: 'Admission Type', value: '—' },
              ]}
            />

            <div className="g2">
              <div className="card">
                <div className="card-hdr"><div className="card-title"><i className="lni lni-transfer"></i> Transfer Parameters</div></div>
                <div className="fg"><label className="lbl">New Programme <span className="req">*</span></label>
                  <SearchSelect
                    placeholder="— Select new programme —"
                    options={programOptions}
                    value={targetProg}
                    onChange={setTargetProg}
                  />
                </div>
                <div className="fg"><label className="lbl">New Batch <span className="req">*</span></label>
                  <SearchSelect options={TARGET_BATCHES} value={targetBatch} onChange={setTargetBatch} />
                </div>
                <div className="fg"><label className="lbl">New Semester <span className="req">*</span></label>
                  <SearchSelect options={TARGET_SEMESTERS} value={targetSemester} onChange={setTargetSemester} />
                </div>
                <div className="fg"><label className="lbl">New Fee Structure <span className="req">*</span></label>
                  <SearchSelect options={TARGET_FEE_STRUCTURES} value={targetFeeStructure} onChange={setTargetFeeStructure} />
                </div>
                {/* Discount — display only, not editable here (per request); real
                    value from the student's own discount assignment, same field
                    Student Profile's own Discount row reads. */}
                <div className="fg"><label className="lbl">Discount</label><input className="ctrl" readOnly value={formatDiscount(detail)} /></div>
                <div className="fg"><label className="lbl">Remarks <span className="req">*</span></label><textarea className="ctrl" rows={3} placeholder="Reason for programme transfer…" value={remarks} onChange={e => setRemarks(e.target.value)} /></div>
                <div className="flex gap-2" style={{ justifyContent: 'flex-end' }}>
                  <button className="btn btn-neu" onClick={handleClear}>Cancel</button>
                  <button className="btn btn-primary" disabled={!targetProg} onClick={() => setConfirmOpen(true)}><i className="lni lni-checkmark"></i> Execute Transfer</button>
                </div>
              </div>
              <div className="card">
                <div className="card-hdr"><div className="card-title"><i className="lni lni-alarm-clock"></i> Programme Transfer History</div></div>
                <ScrollTable>
                  <table>
                    <thead>
                      <tr>
                        <th>Transfer Code</th><th>Transfer Date</th>
                        <th>Old Programme</th><th>Old Batch</th><th>Old Semester</th>
                        <th>New Programme</th><th>New Batch</th><th>New Semester</th>
                      </tr>
                    </thead>
                    <tbody>
                      {TRANSFER_HISTORY.length === 0
                        ? <EmptyState colSpan={8} title="No transfers on record" subtitle="This student hasn't been moved between programmes yet." />
                        : TRANSFER_HISTORY.map(r => (
                          <tr key={r.transferCode}>
                            <td className="font-mono text-blue">{r.transferCode}</td>
                            <td>{r.transferDate}</td>
                            <td>{r.oldProgramme}</td>
                            <td>{r.oldBatch}</td>
                            <td>{r.oldSemester}</td>
                            <td>{r.newProgramme}</td>
                            <td>{r.newBatch}</td>
                            <td>{r.newSemester}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </ScrollTable>
              </div>
            </div>
          </>
        )}
      </div>

      {confirmOpen && student && target && (
        <div className="modal-overlay open" onClick={() => setConfirmOpen(false)}>
          <div className="modal modal-md" onClick={e => e.stopPropagation()}>
            <div className="modal-hdr"><div className="modal-title"><i className="lni lni-warning" style={{ color: 'var(--amber)' }}></i> Confirm Programme Transfer</div><button className="modal-close" onClick={() => setConfirmOpen(false)}>✕</button></div>
            <div>
              <div className="warn-box" style={{ marginBottom: 16 }}><i className="lni lni-warning" style={{ color: 'var(--amber)', fontSize: 16, flexShrink: 0 }}></i><div><strong>Current programme track will be archived.</strong> Records will be preserved as read-only. The student will be registered fresh in the target programme.</div></div>
              <div style={{ fontSize: 13, color: 'var(--g700)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', gap: 12 }}><span style={{ fontWeight: 600, width: 140, color: 'var(--g500)' }}>Student</span><span>{student.studentName}</span></div>
                <div style={{ display: 'flex', gap: 12 }}><span style={{ fontWeight: 600, width: 140, color: 'var(--g500)' }}>From programme</span><span>{student.programName || '—'}</span></div>
                <div style={{ display: 'flex', gap: 12 }}><span style={{ fontWeight: 600, width: 140, color: 'var(--g500)' }}>To programme</span><span style={{ color: 'var(--b700)', fontWeight: 700 }}>{target.label}</span></div>
                <div style={{ display: 'flex', gap: 12 }}><span style={{ fontWeight: 600, width: 140, color: 'var(--g500)' }}>New batch</span><span>{targetBatch}</span></div>
                <div style={{ display: 'flex', gap: 12 }}><span style={{ fontWeight: 600, width: 140, color: 'var(--g500)' }}>New semester</span><span>{targetSemester}</span></div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-neu" onClick={() => setConfirmOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={() => { showToast('Programme transfer executed', 'ok'); setConfirmOpen(false) }}><i className="lni lni-checkmark"></i> Confirm &amp; Execute</button>
            </div>
          </div>
        </div>
      )}
      <Toast toast={toast} />
    </>
  )
}
