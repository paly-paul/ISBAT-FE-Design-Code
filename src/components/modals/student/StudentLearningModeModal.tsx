'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ModalProps } from '../types'
import { SearchSelect } from '@/components/SearchSelect'
import { useLearningModeOptions, useStudentLearningModeDetail, useApplyLearningModeChange } from '@/hooks/student/useLearningMode'

interface Props extends ModalProps {
  studentGuid: string | null
  studentName?: string
}

// Max length the apply endpoint accepts (post-apply-learning-mode-change.md).
const REMARKS_MAX = 500

// Same learning-mode change request the /student/learning-mode page raises,
// pulled into a modal so Student Master's row action menu can raise it in
// place — same idea as StudentRefugeeModal. Reuses the same hooks, so the
// page and this modal share one cache.
export function StudentLearningModeModal({ isOpen, onClose, showToast, studentGuid, studentName }: Props) {
  const router = useRouter()
  const { data: detail, isLoading } = useStudentLearningModeDetail(isOpen ? studentGuid : null)
  const { data: options = [] } = useLearningModeOptions()
  const applyChange = useApplyLearningModeChange()
  const [selectedMode, setSelectedMode] = useState('')
  const [remarks, setRemarks] = useState('')
  const [docFile, setDocFile] = useState<File | null>(null)

  // Seed the picker with the student's current mode once it loads (nothing
  // selected if they've never had one — learningMode comes back null).
  useEffect(() => {
    if (!isOpen) return
    setSelectedMode(detail?.learningMode != null ? String(detail.learningMode) : '')
  }, [isOpen, detail?.studentGuid, detail?.learningMode])

  useEffect(() => {
    if (!isOpen) return
    setRemarks('')
    setDocFile(null)
  }, [isOpen])

  if (!isOpen || !studentGuid) return null

  const isPending = detail?.learningModeChangeStatus === 1
  const requestedLabel = detail?.requestedLearningModeLabel ?? detail?.learningModeLabel ?? '—'

  // Applying only raises a request, so it continues to the approval page with
  // this student's review open, like StudentRefugeeModal. `notice` carries the
  // success message across — the toast here would unmount with this page.
  function goToApproval(guid: string, notice?: 'submitted') {
    onClose()
    router.push(`/student/learning-mode-approval?studentGuid=${encodeURIComponent(guid)}${notice ? `&notice=${notice}` : ''}`)
  }

  function handleApply() {
    if (!studentGuid) return
    if (!selectedMode) { showToast('Please select a learning mode.', 'warn'); return }
    if (detail?.learningMode != null && String(detail.learningMode) === selectedMode) { showToast('The student is already in this learning mode.', 'warn'); return }
    // Optional on the API, required here so every request carries a reason.
    if (!remarks.trim()) { showToast('Remarks are required.', 'warn'); return }
    if (remarks.trim().length > REMARKS_MAX) { showToast(`Remarks must be ${REMARKS_MAX} characters or fewer.`, 'warn'); return }
    if (!docFile) { showToast('A supporting document is required.', 'warn'); return }
    const guid = studentGuid
    applyChange.mutate(
      { studentGuid: guid, input: { requestedLearningMode: Number(selectedMode), remarks: remarks.trim(), document: docFile } },
      {
        onSuccess: () => goToApproval(guid, 'submitted'),
        onError: (error: Error) => showToast(error.message || 'Could not submit the request.', 'err'),
      },
    )
  }

  return (
    <div className="modal-overlay open">
      <div className="modal modal-md" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr modal-hdr-blue"><div className="modal-title"><i className="lni lni-display"></i> Learning Mode</div><button className="modal-close" onClick={onClose}>✕</button></div>
        <div>
          <div className="fg"><label className="lbl">Student</label><input className="ctrl" readOnly value={detail?.studentName ?? studentName ?? '—'} /></div>

          {isLoading ? (
            <div className="text-g400 text-center" style={{ padding: 16, fontSize: 12.5 }}>Loading learning mode…</div>
          ) : (
            <>
              <div className="g2">
                <div className="fg"><label className="lbl">Programme</label><input className="ctrl" readOnly value={detail?.programName ?? '—'} /></div>
                <div className="fg"><label className="lbl">Semester</label><input className="ctrl" readOnly value={detail?.semesterName ?? '—'} /></div>
              </div>
              {isPending ? (
                // While pending, detail.learningMode already holds the
                // *requested* mode — the pre-request mode isn't returned.
                <div className="info-box mb-3">
                  <i className="lni lni-hourglass" style={{ color: 'var(--amber)', fontSize: 15, flexShrink: 0 }}></i>
                  <div style={{ fontSize: 12.5 }}>
                    A change to <strong>{requestedLabel}</strong> is awaiting approval. A new request can be raised once it&apos;s approved.
                  </div>
                </div>
              ) : (
                <>
                  <div className="fg"><label className="lbl">Current Mode</label><input className="ctrl" readOnly value={detail?.learningModeLabel ?? 'Not set'} /></div>
                  <div className="fg">
                    <label className="lbl">New Learning Mode <span className="req">*</span></label>
                    <SearchSelect
                      placeholder="— Select mode —"
                      options={options.map(o => ({ value: String(o.value), label: o.label }))}
                      value={selectedMode}
                      onChange={setSelectedMode}
                    />
                  </div>
                  <div className="fg">
                    <label className="lbl">Remarks <span className="req">*</span></label>
                    <textarea className="ctrl" rows={2} maxLength={REMARKS_MAX} placeholder="Reason for changing the learning mode…" value={remarks} onChange={e => setRemarks(e.target.value)} />
                    <div style={{ fontSize: 11.5, color: 'var(--g500)', marginTop: 4, textAlign: 'right' }}>{remarks.length}/{REMARKS_MAX}</div>
                  </div>
                  <div className="fg">
                    <label className="lbl">Supporting Document <span className="req">*</span></label>
                    <div className="file-zone">
                      <input type="file" onChange={e => setDocFile(e.target.files?.[0] ?? null)} />
                      <div className="file-zone-icon"><i className="lni lni-files"></i></div>
                      {docFile
                        // .fz-uploaded is display:none by default (the old
                        // prototype toggled it from script) — show it here.
                        ? <p className="fz-uploaded" style={{ display: 'block' }}><i className="lni lni-checkmark-circle"></i> {docFile.name}</p>
                        : <p>Click to upload a supporting document</p>}
                      <p className="text-g400" style={{ fontSize: 'var(--fs-xs)' }}>Required — e.g. proof of relocation or an employer letter</p>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-neu" onClick={onClose}>Close</button>
          {!isLoading && (isPending ? (
            <button className="btn btn-primary" onClick={() => goToApproval(studentGuid)}>
              <i className="lni lni-eye"></i> Review Request
            </button>
          ) : (
            <button className="btn btn-primary" onClick={handleApply} disabled={applyChange.isPending}>
              <i className="lni lni-telegram-original"></i> {applyChange.isPending ? 'Submitting…' : 'Submit for Approval'}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
