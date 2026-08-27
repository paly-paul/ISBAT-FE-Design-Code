'use client'
import { useEffect, useState } from 'react'
import { Toast } from '@/components/Toast'
import { SearchSelect } from '@/components/SearchSelect'
import { ScrollTable } from '@/components/ScrollTable'
import { EmptyState } from '@/components/EmptyState'
import { StudentLookup } from '@/components/student/StudentLookup'
import { BaselinePanel } from '@/components/student/BaselinePanel'
import { StudentDto } from '@/lib/api/student/student'
import { useResumeCandidate, useResumeStudent } from '@/hooks/student/useStudentResuming'

// Batch transfer records — no GET history endpoint exists anywhere for this
// (see the note below on which write endpoint backs the form itself), so the
// grid always starts empty (matching the previous timeline's "No transfers
// on record" default) rather than fabricating example rows.
interface TransferHistoryRow { transferCode: string; transferDate: string; oldBatch: string; newBatch: string }
const TRANSFER_HISTORY: TransferHistoryRow[] = []

// Ported from isbat_student_module.html's Batch Transfer page. Student
// identity comes from the real student list (StudentLookup). The actual
// move is now wired to students/resume/{guid}/candidate,resume — there's no
// endpoint literally called "batch transfer"; this is the "Student Resuming"
// workflow, the only one that moves ANY student's semester/batch/fee
// (dropout-rejoin's sibling only works for REGSTATUS = 3 students), reused
// deliberately per user direction. Worth knowing: the backend's own audit
// trail records every transfer made here as T_STUDENT_RESUME / "Resuming
// Student", since no distinct "batch transfer" event type exists
// server-side. Discount override / reason / supporting document below are
// NOT part of that endpoint's payload (studentGuid + newSemesterGuid +
// newBatchGuid + newFeeGuid only) — kept as page-local fields, same
// "UI-first prototype" convention as the rest of this app, not submitted
// anywhere. Fee model mapping and the integrity/impact preview numbers still
// have no backend contract at all — mock illustrative content only.
const REASONS = ['Dropout Rejoin', 'Deferment', 'Job / Relocation', 'Medical', 'Schedule Preference', 'Administrative Correction']

export default function Page() {
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)
  const [student, setStudent] = useState<StudentDto | null>(null)
  const [transferType, setTransferType] = useState<'batch' | 'intake'>('batch')
  const [targetSemester, setTargetSemester] = useState('')
  const [targetBatch, setTargetBatch] = useState('')
  const [targetFeeHead, setTargetFeeHead] = useState('')
  const [discount, setDiscount] = useState(0)
  const [reason, setReason] = useState(REASONS[0])
  const [remarks, setRemarks] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)

  const { data: candidate, isLoading: candidateLoading } = useResumeCandidate(
    student?.studentGuid ?? null,
    {
      studentRegNo: student?.studentRegNo ?? '',
      studentName: student?.studentName ?? '',
      programName: student?.programName ?? '',
      semesterName: student?.semesterName ?? '',
    },
    !!student,
  )
  const resumeStudent = useResumeStudent()

  // Seed the three real dropdowns once the candidate's option lists arrive —
  // default to the student's current semester (so "no change" is the
  // starting point) and the first available batch/fee head.
  useEffect(() => {
    if (!candidate) { setTargetSemester(''); setTargetBatch(''); setTargetFeeHead(''); return }
    setTargetSemester(candidate.currentSemesterGuid || candidate.availableSemesters[0]?.semesterGuid || '')
    setTargetBatch(candidate.availableBatches[0]?.batchGuid || '')
    setTargetFeeHead(candidate.availableFeeHeads[0]?.feeHdGuid || '')
  }, [candidate])

  function showToast(msg: string, type = '') { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }

  function handleLoad(s: StudentDto) { setStudent(s); showToast(`${s.studentName} loaded`, 'ok') }
  function handleClear() {
    setStudent(null); setDiscount(0); setReason(REASONS[0]); setRemarks('')
  }

  const targetBatchOpt = candidate?.availableBatches.find(b => b.batchGuid === targetBatch)
  const targetSemesterOpt = candidate?.availableSemesters.find(s => s.semesterGuid === targetSemester)
  const targetFeeHeadOpt = candidate?.availableFeeHeads.find(f => f.feeHdGuid === targetFeeHead)
  const canExecute = !!(targetSemester && targetBatch && targetFeeHead)

  function executeTransfer() {
    if (!student || !canExecute) return
    resumeStudent.mutate(
      { studentGuid: student.studentGuid, payload: { newSemesterGuid: targetSemester, newBatchGuid: targetBatch, newFeeGuid: targetFeeHead } },
      {
        onSuccess: () => { showToast('Batch transfer executed', 'ok'); setConfirmOpen(false) },
        onError: (error: Error) => showToast(error.message || 'Could not execute transfer', 'err'),
      },
    )
  }

  return (
    <>
      <div className="page active">
        <div className="pg-hdr"><div><div className="pg-title">Batch Transfer</div><div className="pg-sub">Reassign a student to a different batch or shift their intake period</div></div></div>

        <StudentLookup onLoad={handleLoad} onClear={handleClear} loaded={!!student} />

        {!student && (
          <div className="empty">
            <div className="empty-icon"><i className="lni lni-transfer"></i></div>
            <div className="empty-title">No Student Loaded</div>
            <div className="empty-sub">Search for a student to load their baseline profile before making transfer changes.</div>
          </div>
        )}

        {student && (
          <>
            <div className="warn-box" style={{ marginBottom: 16 }}>
              <i className="lni lni-warning" style={{ color: 'var(--amber)', fontSize: 16, flexShrink: 0, marginTop: 1 }}></i>
              <div><strong>Finance Team Restricted.</strong> Batch changes rewrite the student&apos;s unbilled ledger. Only Finance/Accounts staff on the campus network may execute this action.</div>
            </div>

            <BaselinePanel
              label="Active Baseline Profile (Read-Only)"
              items={[
                { label: 'Student Name', value: student.studentName },
                { label: 'Student Reg No.', value: student.studentRegNo },
                { label: 'Programme', value: student.programName || '—' },
                // Campus/Intake have no field on StudentDto/StudentDetailDto yet —
                // shown as placeholders, same "Campus" pill already used as a
                // stand-in on the Student Profile banner (see student/profile).
                { label: 'Campus', value: '—' },
                { label: 'Semester', value: student.semesterName || '—' },
                { label: 'Current Batch', value: student.batchCode || '—', accent: true },
                { label: 'Intake', value: '—' },
                { label: 'Fee Structure', value: 'Local · $750/sem' },
              ]}
            />

            <div className="g2">
              <div>
                <div className="card">
                  <div className="card-hdr"><div className="card-title"><i className="lni lni-transfer"></i> Transfer Parameters</div></div>
                  {/* Transfer Type — commented out per request.
                  <div className="fg">
                    <label className="lbl">Transfer Type <span className="req">*</span></label>
                    <label className={`rcard${transferType === 'batch' ? ' sel' : ''}`} onClick={() => setTransferType('batch')}>
                      <input type="radio" name="bt-type" checked={transferType === 'batch'} readOnly />
                      <div><div className="rcard-lbl">Batch / Schedule Transfer</div><div className="rcard-sub">Move within the same programme — e.g. Day to Evening schedule. Rewrites unbilled ledger to destination batch fee template.</div></div>
                    </label>
                    <label className={`rcard${transferType === 'intake' ? ' sel' : ''}`} onClick={() => setTransferType('intake')}>
                      <input type="radio" name="bt-type" checked={transferType === 'intake'} readOnly />
                      <div><div className="rcard-lbl">Intake / Period Shift</div><div className="rcard-sub">Move to a different intake cohort. Used for dropouts rejoining or deferrals — see the dedicated Intake Transfer page for this.</div></div>
                    </label>
                  </div>
                  */}
                  <div className="fg">
                    <label className="lbl">Target Semester <span className="req">*</span></label>
                    <SearchSelect
                      placeholder="— Select destination semester —"
                      options={(candidate?.availableSemesters ?? []).map(s => ({ value: s.semesterGuid, label: s.semName }))}
                      value={targetSemester}
                      onChange={setTargetSemester}
                      disabled={candidateLoading || !candidate}
                    />
                  </div>
                  <div className="fg">
                    <label className="lbl">Target Batch <span className="req">*</span></label>
                    <SearchSelect
                      placeholder="— Select destination batch —"
                      options={(candidate?.availableBatches ?? []).map(b => ({ value: b.batchGuid, label: b.batchCode }))}
                      value={targetBatch}
                      onChange={setTargetBatch}
                      disabled={candidateLoading || !candidate}
                    />
                  </div>
                  <div className="fg">
                    <label className="lbl">Destination Fee Head <span className="req">*</span></label>
                    <SearchSelect
                      placeholder="— Select fee head —"
                      options={(candidate?.availableFeeHeads ?? []).map(f => ({ value: f.feeHdGuid, label: `${f.feeCode} — ${f.feeDesc}` }))}
                      value={targetFeeHead}
                      onChange={setTargetFeeHead}
                      disabled={candidateLoading || !candidate}
                    />
                  </div>
                  {/* Discount Override — commented out per request.
                  <div className="fg">
                    <label className="lbl">Discount Override (0–100%) <span className="req">*</span></label>
                    <div className="flex gap-2" style={{ alignItems: 'center' }}>
                      <input className="ctrl" type="number" min={0} max={100} value={discount} style={{ maxWidth: 100 }} onChange={e => setDiscount(Number(e.target.value))} />
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--g700)' }}>% — Finance role required for &gt;0%</span>
                    </div>
                    {discount > 0 && (
                      <div className="warn-box mt-2"><i className="lni lni-warning" style={{ color: 'var(--amber)', fontSize: 14, flexShrink: 0 }}></i><div style={{ fontSize: 12 }}>Discount override above 0% requires Finance Manager approval. An approval request will be auto-logged.</div></div>
                    )}
                  </div>
                  */}
                  {/* Reason — commented out per request.
                  <div className="fg"><label className="lbl">Reason <span className="req">*</span></label>
                    <SearchSelect
                      placeholder="— Select reason —"
                      options={REASONS}
                      value={reason}
                      onChange={setReason}
                    />
                  </div>
                  */}
                  <div className="fg"><label className="lbl">Mandatory Remarks <span className="req">*</span></label><textarea className="ctrl" rows={3} placeholder="Describe the reason. Required and will be logged permanently." value={remarks} onChange={e => setRemarks(e.target.value)} /></div>
                  {/* Supporting Document — commented out per request.
                  <div className="fg">
                    <label className="lbl">Supporting Document</label>
                    <div style={{ border: '2px dashed var(--g300)', borderRadius: 'var(--rxs)', padding: 16, textAlign: 'center', cursor: 'pointer', background: 'var(--surface)' }}>
                      <i className="lni lni-upload" style={{ fontSize: 20, color: 'var(--g400)' }}></i>
                      <div style={{ fontSize: 12, color: 'var(--g500)', marginTop: 6 }}>Drop file or click to upload (PDF · max 5MB)</div>
                    </div>
                  </div>
                  */}
                  <div className="flex gap-2" style={{ justifyContent: 'flex-end' }}>
                    <button className="btn btn-neu" onClick={handleClear}>Cancel</button>
                    <button className="btn btn-primary" disabled={!canExecute} onClick={() => setConfirmOpen(true)}><i className="lni lni-checkmark"></i> Execute Transfer</button>
                  </div>
                </div>
              </div>
              <div>
                {/* Financial Impact Preview — commented out per request. Disabled via
                    a false-guard rather than a block comment since this subtree
                    already contains its own inline JSX comment, which a wrapping
                    block comment can't nest around. */}
                {false && (
                <div className="card" style={{ marginBottom: 16 }}>
                  <div className="card-hdr"><div className="card-title"><i className="lni lni-dollar"></i> Financial Impact Preview</div></div>
                  {!targetFeeHeadOpt ? (
                    <div style={{ textAlign: 'center', padding: '28px 0', color: 'var(--g400)', fontSize: 13 }}><i className="lni lni-dollar" style={{ fontSize: 28, display: 'block', marginBottom: 8 }}></i>Select a destination fee head to preview fee changes</div>
                  ) : (
                    <>
                      <div className="delta">
                        <div className="delta-hdr"><i className="lni lni-dollar"></i> Tuition Fee Comparison</div>
                        <div className="delta-row"><span className="delta-lbl">Destination fee head</span><span className="delta-val changed">{targetFeeHeadOpt?.feeCode}</span></div>
                        <div className="delta-row"><span className="delta-lbl">Discount applied</span><span className="delta-val">{discount}%</span></div>
                        {/* The resume endpoint's own candidate/submit responses carry no fee
                            amount field (feeCode/feeDesc only) — no real number to show here,
                            so this stays a description rather than an invented $ delta. */}
                        <div className="delta-row"><span className="delta-lbl">Amount</span><span className="delta-val" style={{ color: 'var(--g500)' }}>Recalculated server-side on execute</span></div>
                      </div>
                      <div className="danger-box mt-3"><i className="lni lni-warning" style={{ color: 'var(--red)', fontSize: 15, flexShrink: 0, marginTop: 1 }}></i><div style={{ fontSize: 12 }}><strong>Fee-clearance gate:</strong> if the destination semester differs from the current one, the backend checks the current semester is fully paid before allowing this transfer.</div></div>
                    </>
                  )}
                </div>
                )}
                {/* Structural Integrity Check — commented out per request. */}
                {false && (
                <div className="card" style={{ marginBottom: 16 }}>
                  <div className="card-hdr"><div className="card-title"><i className="lni lni-shield"></i> Structural Integrity Check</div></div>
                  {!targetBatchOpt ? (
                    <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--g400)', fontSize: 13 }}>Select a batch to run checks</div>
                  ) : (
                    <div className="integ">
                      <div className="integ-hdr">Validation Results</div>
                      <div className="integ-row"><i className="lni lni-checkmark-circle integ-icon" style={{ color: 'var(--green)' }}></i><span className="integ-txt">Target batch is active and accepting transfers</span><span className="integ-status" style={{ color: 'var(--green)' }}>Pass</span></div>
                      <div className="integ-row"><i className="lni lni-checkmark-circle integ-icon" style={{ color: 'var(--green)' }}></i><span className="integ-txt">Batch capacity available (32/50 enrolled)</span><span className="integ-status" style={{ color: 'var(--green)' }}>Pass</span></div>
                      <div className="integ-row"><i className="lni lni-warning integ-icon" style={{ color: 'var(--amber)' }}></i><span className="integ-txt">Outstanding balance of $450 detected</span><span className="integ-status" style={{ color: 'var(--amber)' }}>Warning</span></div>
                      <div className="integ-row"><i className="lni lni-checkmark-circle integ-icon" style={{ color: 'var(--green)' }}></i><span className="integ-txt">Programme matches destination batch</span><span className="integ-status" style={{ color: 'var(--green)' }}>Pass</span></div>
                    </div>
                  )}
                </div>
                )}
                <div className="card">
                  <div className="card-hdr"><div className="card-title"><i className="lni lni-alarm-clock"></i> Transfer History</div></div>
                  <ScrollTable>
                    <table>
                      <thead><tr><th>Transfer Code</th><th>Transfer Date</th><th>Old Batch</th><th>New Batch</th></tr></thead>
                      <tbody>
                        {TRANSFER_HISTORY.length === 0
                          ? <EmptyState colSpan={4} title="No transfers on record" subtitle="This student hasn't been moved between batches yet." />
                          : TRANSFER_HISTORY.map(r => (
                            <tr key={r.transferCode}>
                              <td className="font-mono text-blue">{r.transferCode}</td>
                              <td>{r.transferDate}</td>
                              <td>{r.oldBatch}</td>
                              <td>{r.newBatch}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </ScrollTable>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {confirmOpen && student && targetBatchOpt && targetSemesterOpt && targetFeeHeadOpt && (
        <div className="modal-overlay open" onClick={() => setConfirmOpen(false)}>
          <div className="modal modal-md" onClick={e => e.stopPropagation()}>
            <div className="modal-hdr"><div className="modal-title"><i className="lni lni-warning" style={{ color: 'var(--red)' }}></i> Confirm Batch Transfer</div><button className="modal-close" onClick={() => setConfirmOpen(false)}>✕</button></div>
            <div>
              <div className="danger-box" style={{ marginBottom: 16 }}><i className="lni lni-warning" style={{ color: 'var(--red)', fontSize: 16, flexShrink: 0 }}></i><div><strong>This cannot be undone.</strong> The student's active history is deactivated and cloned into a new row under the destination semester/batch/fee.</div></div>
              <div style={{ fontSize: 13, color: 'var(--g700)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', gap: 12 }}><span style={{ fontWeight: 600, width: 120, color: 'var(--g500)' }}>Student</span><span>{student.studentName} — {student.studentNum}</span></div>
                <div style={{ display: 'flex', gap: 12 }}><span style={{ fontWeight: 600, width: 120, color: 'var(--g500)' }}>From batch</span><span style={{ fontFamily: 'monospace' }}>{student.batchCode || '—'}</span></div>
                <div style={{ display: 'flex', gap: 12 }}><span style={{ fontWeight: 600, width: 120, color: 'var(--g500)' }}>To batch</span><span style={{ fontFamily: 'monospace', color: 'var(--b700)' }}>{targetBatchOpt.batchCode}</span></div>
                <div style={{ display: 'flex', gap: 12 }}><span style={{ fontWeight: 600, width: 120, color: 'var(--g500)' }}>To semester</span><span style={{ fontFamily: 'monospace' }}>{targetSemesterOpt.semName}</span></div>
                <div style={{ display: 'flex', gap: 12 }}><span style={{ fontWeight: 600, width: 120, color: 'var(--g500)' }}>Fee head</span><span style={{ color: 'var(--amber)' }}>{targetFeeHeadOpt.feeCode}</span></div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-neu" onClick={() => setConfirmOpen(false)} disabled={resumeStudent.isPending}>Cancel</button>
              <button className="btn btn-danger" onClick={executeTransfer} disabled={resumeStudent.isPending}><i className="lni lni-checkmark"></i> {resumeStudent.isPending ? 'Executing…' : 'Confirm & Execute'}</button>
            </div>
          </div>
        </div>
      )}
      <Toast toast={toast} />
    </>
  )
}
