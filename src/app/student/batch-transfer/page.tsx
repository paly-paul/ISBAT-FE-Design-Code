'use client'
import { useState } from 'react'
import { Toast } from '@/components/Toast'
import { SearchSelect } from '@/components/SearchSelect'
import { StudentLookup } from '@/components/student/StudentLookup'
import { BaselinePanel } from '@/components/student/BaselinePanel'
import { StudentDto } from '@/lib/api/student/student'

// Ported from isbat_student_module.html's Batch Transfer page. Student
// identity comes from the real student list (StudentLookup); the batch
// catalog, fee model mapping, and integrity checks have no backend contract
// for this workflow at all — mock data only, same convention as Finance's
// Payment Collection pages.
const TARGET_BATCHES = [
  { value: 'BSc.IT-2024B', label: 'BSc.IT-2024B · Evening · Spring 2024', fee: '$750', model: 'BSC.IT.EV.24.LCL' },
  { value: 'BSc.IT-2025A', label: 'BSc.IT-2025A · Day · Spring 2025', fee: '$780', model: 'BSC.IT.DA.25.LCL' },
  { value: 'BSc.IT-2025B', label: 'BSc.IT-2025B · Evening · Spring 2025', fee: '$780', model: 'BSC.IT.EV.25.LCL' },
  { value: 'BSc.IT-2026A', label: 'BSc.IT-2026A · Day · Spring 2026', fee: '$800', model: 'BSC.IT.DA.26.LCL' },
]
const REASONS = ['Dropout Rejoin', 'Deferment', 'Job / Relocation', 'Medical', 'Schedule Preference', 'Administrative Correction']

export default function Page() {
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)
  const [student, setStudent] = useState<StudentDto | null>(null)
  const [transferType, setTransferType] = useState<'batch' | 'intake'>('batch')
  const [targetBatch, setTargetBatch] = useState('')
  const [discount, setDiscount] = useState(0)
  const [reason, setReason] = useState('')
  const [remarks, setRemarks] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)

  function showToast(msg: string, type = '') { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }

  function handleLoad(s: StudentDto) { setStudent(s); showToast(`${s.studentName} loaded`, 'ok') }
  function handleClear() {
    setStudent(null); setTargetBatch(''); setDiscount(0); setReason(''); setRemarks('')
  }

  const target = TARGET_BATCHES.find(b => b.value === targetBatch)

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
                { label: 'Student ID', value: student.studentNum },
                { label: 'Name', value: student.studentName },
                { label: 'Programme', value: student.programName || '—' },
                { label: 'Current Batch', value: student.batchCode || '—', accent: true },
                { label: 'Semester', value: student.semesterName || '—' },
                { label: 'Fee Structure', value: 'Local · $750/sem' },
              ]}
            />

            <div className="g2">
              <div>
                <div className="card">
                  <div className="card-hdr"><div className="card-title"><i className="lni lni-transfer"></i> Transfer Parameters</div></div>
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
                  <div className="fg">
                    <label className="lbl">Target Batch <span className="req">*</span></label>
                    <SearchSelect
                      placeholder="— Select destination batch —"
                      options={TARGET_BATCHES.map(b => ({ value: b.value, label: b.label }))}
                      value={targetBatch}
                      onChange={setTargetBatch}
                    />
                  </div>
                  {target && (
                    <div className="fg">
                      <label className="lbl">Destination Fee Model (Auto-Selected)</label>
                      <input className="ctrl" readOnly value={target.model} style={{ fontFamily: 'monospace', color: 'var(--b700)', fontWeight: 700 }} />
                    </div>
                  )}
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
                  <div className="fg"><label className="lbl">Reason <span className="req">*</span></label>
                    <SearchSelect
                      placeholder="— Select reason —"
                      options={REASONS}
                      value={reason}
                      onChange={setReason}
                    />
                  </div>
                  <div className="fg"><label className="lbl">Mandatory Remarks <span className="req">*</span></label><textarea className="ctrl" rows={3} placeholder="Describe the reason. Required and will be logged permanently." value={remarks} onChange={e => setRemarks(e.target.value)} /></div>
                  <div className="fg">
                    <label className="lbl">Supporting Document</label>
                    <div style={{ border: '2px dashed var(--g300)', borderRadius: 'var(--rxs)', padding: 16, textAlign: 'center', cursor: 'pointer', background: 'var(--surface)' }}>
                      <i className="lni lni-upload" style={{ fontSize: 20, color: 'var(--g400)' }}></i>
                      <div style={{ fontSize: 12, color: 'var(--g500)', marginTop: 6 }}>Drop file or click to upload (PDF · max 5MB)</div>
                    </div>
                  </div>
                  <div className="flex gap-2" style={{ justifyContent: 'flex-end' }}>
                    <button className="btn btn-neu" onClick={handleClear}>Cancel</button>
                    <button className="btn btn-primary" disabled={!targetBatch || !reason || !remarks} onClick={() => setConfirmOpen(true)}><i className="lni lni-checkmark"></i> Execute Transfer</button>
                  </div>
                </div>
              </div>
              <div>
                <div className="card" style={{ marginBottom: 16 }}>
                  <div className="card-hdr"><div className="card-title"><i className="lni lni-dollar"></i> Financial Impact Preview</div></div>
                  {!target ? (
                    <div style={{ textAlign: 'center', padding: '28px 0', color: 'var(--g400)', fontSize: 13 }}><i className="lni lni-dollar" style={{ fontSize: 28, display: 'block', marginBottom: 8 }}></i>Select a target batch to preview fee changes</div>
                  ) : (
                    <>
                      <div className="delta">
                        <div className="delta-hdr"><i className="lni lni-dollar"></i> Tuition Fee Comparison</div>
                        <div className="delta-row"><span className="delta-lbl">Current batch rate</span><span className="delta-val">$750 / semester</span></div>
                        <div className="delta-row"><span className="delta-lbl">Destination batch rate</span><span className="delta-val changed">{target.fee} / semester</span></div>
                        <div className="delta-row"><span className="delta-lbl">Discount applied</span><span className="delta-val">{discount}%</span></div>
                        <div className="delta-row"><span className="delta-lbl">Outstanding balance</span><span className="delta-val" style={{ color: 'var(--amber)' }}>$450</span></div>
                        <div className="delta-total"><span>Net adjustment</span><span style={{ color: 'var(--red)' }}>+${Number(target.fee.replace('$', '')) - 750} / semester</span></div>
                      </div>
                      <div className="danger-box mt-3"><i className="lni lni-warning" style={{ color: 'var(--red)', fontSize: 15, flexShrink: 0, marginTop: 1 }}></i><div style={{ fontSize: 12 }}><strong>Ledger purge:</strong> Executing will delete all pending unbilled tokens for the current semester onwards and recalculate using the destination fee template.</div></div>
                    </>
                  )}
                </div>
                <div className="card" style={{ marginBottom: 16 }}>
                  <div className="card-hdr"><div className="card-title"><i className="lni lni-shield"></i> Structural Integrity Check</div></div>
                  {!target ? (
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
                <div className="card">
                  <div className="card-hdr"><div className="card-title"><i className="lni lni-alarm-clock"></i> Transfer History</div></div>
                  <div className="timeline">
                    <div className="tl-item"><div className="tl-dot done"><i className="lni lni-checkmark"></i></div><div><div className="tl-label">Enrolled — {student.batchCode || 'current batch'}</div><div className="tl-meta">Initial assignment</div></div></div>
                    <div className="tl-item"><div className="tl-dot cur"><i className="lni lni-transfer"></i></div><div><div className="tl-label">Current — {student.batchCode || '—'}</div><div className="tl-meta">No transfers on record</div></div></div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {confirmOpen && student && target && (
        <div className="modal-overlay open" onClick={() => setConfirmOpen(false)}>
          <div className="modal modal-md" onClick={e => e.stopPropagation()}>
            <div className="modal-hdr"><div className="modal-title"><i className="lni lni-warning" style={{ color: 'var(--red)' }}></i> Confirm Batch Transfer</div><button className="modal-close" onClick={() => setConfirmOpen(false)}>✕</button></div>
            <div>
              <div className="danger-box" style={{ marginBottom: 16 }}><i className="lni lni-warning" style={{ color: 'var(--red)', fontSize: 16, flexShrink: 0 }}></i><div><strong>Ledger purge will occur.</strong> All pending unbilled tokens will be deleted and recalculated using the destination batch fee template. This cannot be undone.</div></div>
              <div style={{ fontSize: 13, color: 'var(--g700)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', gap: 12 }}><span style={{ fontWeight: 600, width: 120, color: 'var(--g500)' }}>Student</span><span>{student.studentName} — {student.studentNum}</span></div>
                <div style={{ display: 'flex', gap: 12 }}><span style={{ fontWeight: 600, width: 120, color: 'var(--g500)' }}>From batch</span><span style={{ fontFamily: 'monospace' }}>{student.batchCode || '—'}</span></div>
                <div style={{ display: 'flex', gap: 12 }}><span style={{ fontWeight: 600, width: 120, color: 'var(--g500)' }}>To batch</span><span style={{ fontFamily: 'monospace', color: 'var(--b700)' }}>{target.value}</span></div>
                <div style={{ display: 'flex', gap: 12 }}><span style={{ fontWeight: 600, width: 120, color: 'var(--g500)' }}>Fee change</span><span style={{ color: 'var(--amber)' }}>$750 → {target.fee} / semester</span></div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-neu" onClick={() => setConfirmOpen(false)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => { showToast('Batch transfer executed', 'ok'); setConfirmOpen(false) }}><i className="lni lni-checkmark"></i> Confirm &amp; Execute</button>
            </div>
          </div>
        </div>
      )}
      <Toast toast={toast} />
    </>
  )
}
