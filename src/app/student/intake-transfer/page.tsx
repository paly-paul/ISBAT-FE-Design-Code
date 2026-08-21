'use client'
import { useState } from 'react'
import { Toast } from '@/components/Toast'
import { SearchSelect } from '@/components/SearchSelect'
import { StudentLookup } from '@/components/student/StudentLookup'
import { BaselinePanel } from '@/components/student/BaselinePanel'
import { StudentDto } from '@/lib/api/student/student'

// Ported from isbat_student_module.html's Intake Transfer page. No backend
// contract exists for this workflow — target intakes/fee re-mapping are
// page-local mock data.
const TARGET_INTAKES = [
  { value: '20251', label: 'Spring 2025 (20251)', fee: '$780' },
  { value: '20252', label: 'Fall 2025 (20252)', fee: '$780' },
  { value: '20261', label: 'Spring 2026 (20261)', fee: '$800' },
]
const REASONS = ['Dropout Rejoin', 'Deferment — Medical', 'Deferment — Job / Relocation', 'Deferment — Personal', 'Administrative Correction']

export default function Page() {
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)
  const [student, setStudent] = useState<StudentDto | null>(null)
  const [targetIntake, setTargetIntake] = useState('')
  const [targetBatch, setTargetBatch] = useState('')
  const [reason, setReason] = useState('')
  const [discount, setDiscount] = useState(0)
  const [remarks, setRemarks] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)

  function showToast(msg: string, type = '') { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }
  function handleLoad(s: StudentDto) { setStudent(s); showToast(`${s.studentName} loaded`, 'ok') }
  function handleClear() { setStudent(null); setTargetIntake(''); setTargetBatch(''); setReason(''); setDiscount(0); setRemarks('') }

  const target = TARGET_INTAKES.find(i => i.value === targetIntake)

  return (
    <>
      <div className="page active">
        <div className="pg-hdr"><div><div className="pg-title">Intake Transfer</div><div className="pg-sub">Move a student to a different intake cohort — deferrals, rejoins, and period shifts</div></div></div>

        <StudentLookup onLoad={handleLoad} onClear={handleClear} loaded={!!student} />

        {!student && (
          <div className="empty">
            <div className="empty-icon"><i className="lni lni-calendar"></i></div>
            <div className="empty-title">No Student Loaded</div>
            <div className="empty-sub">Search for a student to shift their enrollment intake period.</div>
          </div>
        )}

        {student && (
          <>
            <BaselinePanel
              label="Current Intake (Read-Only)"
              items={[
                { label: 'Student', value: student.studentName },
                { label: 'Current Intake', value: 'Spring 2024 (20241)' },
                { label: 'Current Batch', value: student.batchCode || '—', accent: true },
                { label: 'Semester', value: student.semesterName || '—' },
                { label: 'Fee Structure', value: 'Local · $750/sem' },
                { label: 'Status', value: <span style={{ color: 'var(--green)' }}>Active</span> },
              ]}
            />
            <div className="g2">
              <div className="card">
                <div className="card-hdr"><div className="card-title"><i className="lni lni-calendar"></i> Intake Transfer Parameters</div></div>
                <div className="fg"><label className="lbl">Target Intake Period <span className="req">*</span></label>
                  <SearchSelect
                    placeholder="— Select target intake —"
                    options={TARGET_INTAKES.map(i => ({ value: i.value, label: i.label }))}
                    value={targetIntake}
                    onChange={setTargetIntake}
                  />
                </div>
                {target && (
                  <div className="fg"><label className="lbl">Assign to Batch in Target Intake <span className="req">*</span></label>
                    <SearchSelect
                      placeholder="— Select batch —"
                      options={['BSc.IT-2025A · Day', 'BSc.IT-2025B · Evening']}
                      value={targetBatch}
                      onChange={setTargetBatch}
                    />
                  </div>
                )}
                <div className="fg"><label className="lbl">Transfer Reason <span className="req">*</span></label>
                  <SearchSelect
                    placeholder="— Select reason —"
                    options={REASONS}
                    value={reason}
                    onChange={setReason}
                  />
                </div>
                <div className="fg">
                  <label className="lbl">Discount Override (%)</label>
                  <input className="ctrl" type="number" min={0} max={100} value={discount} style={{ maxWidth: 100 }} onChange={e => setDiscount(Number(e.target.value))} />
                  <div style={{ fontSize: 11.5, color: 'var(--g500)', marginTop: 4 }}>0 = no discount. Finance role required for any discount.</div>
                </div>
                <div className="fg"><label className="lbl">Mandatory Remarks <span className="req">*</span></label><textarea className="ctrl" rows={3} placeholder="Detail the circumstances leading to this intake shift…" value={remarks} onChange={e => setRemarks(e.target.value)} /></div>
                <div className="flex gap-2" style={{ justifyContent: 'flex-end' }}>
                  <button className="btn btn-neu" onClick={handleClear}>Cancel</button>
                  <button className="btn btn-primary" disabled={!targetIntake || !targetBatch || !reason || !remarks} onClick={() => setConfirmOpen(true)}><i className="lni lni-checkmark"></i> Execute Intake Transfer</button>
                </div>
              </div>
              <div>
                <div className="card" style={{ marginBottom: 16 }}>
                  <div className="card-hdr"><div className="card-title"><i className="lni lni-dollar"></i> Fee Re-mapping Preview</div></div>
                  {!target ? (
                    <div style={{ textAlign: 'center', padding: '28px 0', color: 'var(--g400)', fontSize: 13 }}><i className="lni lni-calendar" style={{ fontSize: 28, display: 'block', marginBottom: 8 }}></i>Select a target intake to preview fee re-mapping</div>
                  ) : (
                    <>
                      <div className="delta">
                        <div className="delta-hdr"><i className="lni lni-dollar"></i> Intake Fee Comparison</div>
                        <div className="delta-row"><span className="delta-lbl">Current intake fee</span><span className="delta-val">$750 / semester</span></div>
                        <div className="delta-row"><span className="delta-lbl">Target intake fee</span><span className="delta-val changed">{target.fee} / semester</span></div>
                        <div className="delta-row"><span className="delta-lbl">Outstanding balance</span><span className="delta-val" style={{ color: 'var(--amber)' }}>$450 (carries over)</span></div>
                        <div className="delta-total"><span>Effective from</span><span style={{ color: 'var(--b700)' }}>Target Semester 1</span></div>
                      </div>
                      <div className="danger-box mt-3"><i className="lni lni-warning" style={{ color: 'var(--red)', fontSize: 15, flexShrink: 0, marginTop: 1 }}></i><div style={{ fontSize: 12 }}><strong>Ledger purge:</strong> All unbilled future tokens will be recalculated using the target intake fee template. Outstanding balance carries over.</div></div>
                    </>
                  )}
                </div>
                <div className="card">
                  <div className="card-hdr"><div className="card-title"><i className="lni lni-alarm-clock"></i> Intake History</div></div>
                  <div className="timeline">
                    <div className="tl-item"><div className="tl-dot done"><i className="lni lni-checkmark"></i></div><div><div className="tl-label">Spring 2024 (20241)</div><div className="tl-meta">Initial intake at registration</div></div></div>
                    <div className="tl-item"><div className="tl-dot cur"><i className="lni lni-calendar"></i></div><div><div className="tl-label">Current — Spring 2024</div><div className="tl-meta">No intake transfers on record</div></div></div>
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
            <div className="modal-hdr"><div className="modal-title"><i className="lni lni-warning" style={{ color: 'var(--red)' }}></i> Confirm Intake Transfer</div><button className="modal-close" onClick={() => setConfirmOpen(false)}>✕</button></div>
            <div>
              <div className="danger-box" style={{ marginBottom: 16 }}><i className="lni lni-warning" style={{ color: 'var(--red)', fontSize: 16, flexShrink: 0 }}></i><div><strong>Ledger purge will occur.</strong> All pending unbilled tokens will be recalculated against the target intake fee template. Outstanding balance carries over.</div></div>
              <div style={{ fontSize: 13, color: 'var(--g700)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', gap: 12 }}><span style={{ fontWeight: 600, width: 140, color: 'var(--g500)' }}>Student</span><span>{student.studentName}</span></div>
                <div style={{ display: 'flex', gap: 12 }}><span style={{ fontWeight: 600, width: 140, color: 'var(--g500)' }}>From intake</span><span>Spring 2024 (20241)</span></div>
                <div style={{ display: 'flex', gap: 12 }}><span style={{ fontWeight: 600, width: 140, color: 'var(--g500)' }}>To intake</span><span style={{ color: 'var(--b700)', fontWeight: 700 }}>{target.label}</span></div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-neu" onClick={() => setConfirmOpen(false)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => { showToast('Intake transfer executed', 'ok'); setConfirmOpen(false) }}><i className="lni lni-checkmark"></i> Confirm &amp; Execute</button>
            </div>
          </div>
        </div>
      )}
      <Toast toast={toast} />
    </>
  )
}
