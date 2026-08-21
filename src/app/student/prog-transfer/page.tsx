'use client'
import { useState } from 'react'
import { Toast } from '@/components/Toast'
import { SearchSelect } from '@/components/SearchSelect'
import { StudentLookup } from '@/components/student/StudentLookup'
import { BaselinePanel } from '@/components/student/BaselinePanel'
import { StudentDto } from '@/lib/api/student/student'

// Ported from isbat_student_module.html's Programme Transfer page. No
// backend contract exists for credit-transfer computation — the matrix
// below is illustrative mock data, same convention as Finance's Payment
// Collection pages.
const TARGET_PROGRAMMES = [
  { value: 'BBA', label: 'Bachelor of Business Administration' },
  { value: 'BSc.AF', label: 'BSc. Accounting & Finance' },
  { value: 'MBA', label: 'Master of Business Administration' },
]

const CREDIT_ROWS = [
  { code: 'IT101', name: 'Intro to Programming', note: 'Elective — transferable', status: 'ok' as const },
  { code: 'IT102', name: 'Computer Organisation', note: 'Not applicable', status: 'no' as const },
  { code: 'IT103', name: 'Engineering Maths I', note: 'Not applicable', status: 'no' as const },
  { code: 'IT104', name: 'Programming Lab', note: 'Elective — transferable', status: 'ok' as const },
  { code: 'NEW01', name: 'Core unit (new programme)', note: 'Must register fresh', status: 'new' as const },
]

export default function Page() {
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)
  const [student, setStudent] = useState<StudentDto | null>(null)
  const [targetProg, setTargetProg] = useState('')
  const [effectiveFrom, setEffectiveFrom] = useState('Semester 3 (Current)')
  const [boardRef, setBoardRef] = useState('')
  const [remarks, setRemarks] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)

  function showToast(msg: string, type = '') { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }
  function handleLoad(s: StudentDto) { setStudent(s); showToast(`${s.studentName} loaded`, 'ok') }
  function handleClear() { setStudent(null); setTargetProg(''); setBoardRef(''); setRemarks('') }

  const target = TARGET_PROGRAMMES.find(p => p.value === targetProg)
  const transferable = CREDIT_ROWS.filter(r => r.status === 'ok').length
  const excluded = CREDIT_ROWS.filter(r => r.status === 'no').length

  return (
    <>
      <div className="page active">
        <div className="pg-hdr"><div><div className="pg-title">Programme Transfer</div><div className="pg-sub">Move a student to a different academic programme with automatic credit mapping</div></div></div>

        <StudentLookup onLoad={handleLoad} onClear={handleClear} loaded={!!student} />

        {!student && (
          <div className="empty">
            <div className="empty-icon"><i className="lni lni-graduation"></i></div>
            <div className="empty-title">No Student Loaded</div>
            <div className="empty-sub">Search for a student to compute credit mappings and programme eligibility before executing a transfer.</div>
          </div>
        )}

        {student && (
          <>
            <div className="info-box" style={{ marginBottom: 16 }}>
              <i className="lni lni-information" style={{ color: 'var(--b700)', fontSize: 16, flexShrink: 0, marginTop: 1 }}></i>
              <div><strong>Academic Registrar Access.</strong> Transfers require board approval. The previous programme track is archived as read-only — no history is deleted.</div>
            </div>

            <BaselinePanel
              label="Current Programme (Read-Only)"
              items={[
                { label: 'Student', value: student.studentName },
                { label: 'Programme', value: student.programName || '—' },
                { label: 'Semester', value: student.semesterName || '—' },
                { label: 'Credits Earned', value: '28 credits' },
                { label: 'Current Batch', value: student.batchCode || '—', accent: true },
                { label: 'Fee Structure', value: 'Local · $750/sem' },
              ]}
            />

            <div className="g2">
              <div className="card">
                <div className="card-hdr"><div className="card-title"><i className="lni lni-transfer"></i> Transfer Parameters</div></div>
                <div className="fg"><label className="lbl">Target Programme <span className="req">*</span></label>
                  <SearchSelect
                    placeholder="— Select target programme —"
                    options={TARGET_PROGRAMMES.map(p => ({ value: p.value, label: p.label }))}
                    value={targetProg}
                    onChange={setTargetProg}
                  />
                </div>
                <div className="fg"><label className="lbl">Effective From <span className="req">*</span></label>
                  <SearchSelect
                    options={['Semester 3 (Current)', 'Semester 4 (Next)']}
                    value={effectiveFrom}
                    onChange={setEffectiveFrom}
                  />
                </div>
                <div className="fg"><label className="lbl">Board Approval Reference <span className="req">*</span></label><input className="ctrl" placeholder="e.g. ISBAT/BOARD/2026/041" value={boardRef} onChange={e => setBoardRef(e.target.value)} /></div>
                <div className="fg"><label className="lbl">Remarks <span className="req">*</span></label><textarea className="ctrl" rows={3} placeholder="Reason for programme transfer…" value={remarks} onChange={e => setRemarks(e.target.value)} /></div>
                <div className="flex gap-2" style={{ justifyContent: 'flex-end' }}>
                  <button className="btn btn-neu" onClick={handleClear}>Cancel</button>
                  <button className="btn btn-primary" disabled={!targetProg || !boardRef || !remarks} onClick={() => setConfirmOpen(true)}><i className="lni lni-checkmark"></i> Execute Transfer</button>
                </div>
              </div>
              <div className="card">
                <div className="card-hdr"><div className="card-title"><i className="lni lni-book"></i> Credit Transfer Matrix</div><span className={`badge ${target ? 'badge-blue' : 'badge-grey'}`}>{target ? `${transferable} transferable / ${excluded} excluded` : 'Select programme'}</span></div>
                {!target ? (
                  <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--g400)', fontSize: 13 }}><i className="lni lni-book" style={{ fontSize: 28, display: 'block', marginBottom: 8 }}></i>Select a target programme to compute credits</div>
                ) : (
                  <>
                    <div className="flex gap-2" style={{ marginBottom: 12, flexWrap: 'wrap' }}>
                      <span className="badge badge-green"><i className="lni lni-checkmark"></i> {transferable} transferable</span>
                      <span className="badge badge-red"><i className="lni lni-close"></i> {excluded} excluded</span>
                    </div>
                    <div className="credit-matrix">
                      <div className="credit-matrix-hdr">
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '.06em' }}>{student.programName || 'Current'} → {target.label}</span>
                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,.7)' }}>2 semesters</span>
                      </div>
                      {CREDIT_ROWS.map(r => (
                        <div className="cr-row" key={r.code}>
                          <div className="cr-code">{r.code}</div>
                          <div style={{ fontWeight: 600, color: 'var(--g700)' }}>{r.name}<div style={{ fontSize: 11, color: 'var(--g500)', fontWeight: 400 }}>{r.note}</div></div>
                          <span className={`cr-status cr-${r.status}`}>
                            <i className={`lni ${r.status === 'ok' ? 'lni-checkmark' : r.status === 'no' ? 'lni-close' : 'lni-plus'}`}></i>
                            {r.status === 'ok' ? 'Transfer' : r.status === 'no' ? 'Excluded' : 'New Enrolment'}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="delta" style={{ marginTop: 14 }}>
                      <div className="delta-hdr"><i className="lni lni-book"></i> Credit Summary</div>
                      <div className="delta-row"><span className="delta-lbl">Credits earned</span><span className="delta-val">28 credits</span></div>
                      <div className="delta-row"><span className="delta-lbl">Transferable</span><span className="delta-val neg">18 credits</span></div>
                      <div className="delta-row"><span className="delta-lbl">Excluded</span><span className="delta-val pos">10 credits</span></div>
                      <div className="delta-total"><span>Entry point in target</span><span style={{ color: 'var(--b700)' }}>Semester 2</span></div>
                    </div>
                  </>
                )}
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
              <div className="warn-box" style={{ marginBottom: 16 }}><i className="lni lni-warning" style={{ color: 'var(--amber)', fontSize: 16, flexShrink: 0 }}></i><div><strong>Current programme track will be archived.</strong> Records will be preserved as read-only. The student will be registered fresh in the target programme from the effective semester.</div></div>
              <div style={{ fontSize: 13, color: 'var(--g700)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', gap: 12 }}><span style={{ fontWeight: 600, width: 140, color: 'var(--g500)' }}>Student</span><span>{student.studentName}</span></div>
                <div style={{ display: 'flex', gap: 12 }}><span style={{ fontWeight: 600, width: 140, color: 'var(--g500)' }}>From programme</span><span>{student.programName || '—'}</span></div>
                <div style={{ display: 'flex', gap: 12 }}><span style={{ fontWeight: 600, width: 140, color: 'var(--g500)' }}>To programme</span><span style={{ color: 'var(--b700)', fontWeight: 700 }}>{target.value}</span></div>
                <div style={{ display: 'flex', gap: 12 }}><span style={{ fontWeight: 600, width: 140, color: 'var(--g500)' }}>Credits transferred</span><span style={{ color: 'var(--green)' }}>18 of 28</span></div>
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
