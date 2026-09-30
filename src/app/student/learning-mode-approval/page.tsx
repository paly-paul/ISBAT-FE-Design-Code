'use client'
import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Toast } from '@/components/Toast'
import { Pagination } from '@/components/Pagination'
import { BaselinePanel } from '@/components/student/BaselinePanel'
import {
  usePendingLearningModeRequests,
  useApproveLearningModeRequest,
  useRejectLearningModeRequest,
} from '@/hooks/student/useLearningMode'
// import { usePagePermissions } from '@/hooks/users/usePagePermissions'

// Approval queue for learning-mode change requests raised on
// /student/learning-mode. Same list → review shape as Dropout Rejoin: a list
// of waiting students, "Review" opens one request read-only with Approve /
// Reject. Approve applies the change via the real PUT learning-mode update;
// the queue itself is browser-local for now (see learningModeRequests.ts).

const PAGE_SIZE = 10

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase() || '?'
}

function formatSubmitted(iso: string) {
  return new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

// useSearchParams() requires a Suspense boundary above it — see the default
// export at the bottom of this file.
function LearningModeApprovalContent() {
  // Permission checks disabled for now — every action is allowed. Restore the
  // line below (and the import above) to gate actions by the menu permissions again.
  // const permissions = usePagePermissions()
  const permissions = { add: true, edit: true, delete: true }
  const router = useRouter()
  const searchParams = useSearchParams()
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)
  function showToast(msg: string, type = '') { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }

  // Learning Mode's "Review it →" link deep-links a request here as
  // ?requestGuid=<guid>.
  const [selectedGuid, setSelectedGuid] = useState<string | null>(() => searchParams.get('requestGuid'))
  const { data: requests = [], isLoading, isError } = usePendingLearningModeRequests()
  const approve = useApproveLearningModeRequest()
  const reject = useRejectLearningModeRequest()
  const busy = approve.isPending || reject.isPending

  const [page, setPage] = useState(1)
  const totalCount = requests.length
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
  const paginated = requests.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  useEffect(() => { if (page > totalPages) setPage(totalPages) }, [page, totalPages])

  const [approverRemarks, setApproverRemarks] = useState('')
  const [docPreviewOpen, setDocPreviewOpen] = useState(false)
  const selected = requests.find(r => r.requestGuid === selectedGuid) ?? null
  const doc = selected?.document ?? null
  const docIsImage = !!doc?.type.startsWith('image/')

  function handlePick(guid: string) { setSelectedGuid(guid); setApproverRemarks('') }
  function backToList() {
    setSelectedGuid(null); setApproverRemarks(''); setDocPreviewOpen(false)
    // Drop ?requestGuid= so a revisit doesn't reopen the same request.
    if (searchParams.get('requestGuid')) router.replace('/student/learning-mode-approval')
  }

  function handleApprove() {
    if (!permissions.edit || !selected) return
    approve.mutate(
      { requestGuid: selected.requestGuid, approverRemarks: approverRemarks.trim(), studentGuid: selected.studentGuid },
      {
        onSuccess: result => { showToast(`Approved — ${selected.studentName} moved to ${result.learningModeLabel ?? selected.requestedModeLabel}.`, 'ok'); backToList() },
        onError: (error: Error) => showToast(error.message || 'Could not approve the request.', 'error'),
      },
    )
  }

  function handleReject() {
    if (!permissions.edit || !selected) return
    if (!approverRemarks.trim()) { showToast('Add approver remarks explaining the rejection.', 'warn'); return }
    reject.mutate(
      { requestGuid: selected.requestGuid, approverRemarks: approverRemarks.trim() },
      {
        onSuccess: () => { showToast(`Request for ${selected.studentName} rejected.`, 'ok'); backToList() },
        onError: (error: Error) => showToast(error.message || 'Could not reject the request.', 'error'),
      },
    )
  }

  return (
    <>
      <div className="page active">
        <div className="pg-hdr">
          <div><div className="pg-title">Learning Mode Approval</div><div className="pg-sub">Review and approve requested learning mode changes</div></div>
        </div>

        {!selectedGuid ? (
          <div className="card">
            <div className="card-hdr">
              <div className="card-title"><i className="lni lni-hourglass"></i> Awaiting Approval</div>
              {totalCount > 0 && <span className="badge badge-amber">{totalCount} pending</span>}
            </div>
            {isError ? (
              <div className="text-clr-red text-center" style={{ padding: 16, fontSize: 12.5 }}><i className="lni lni-warning"></i> Couldn&apos;t load pending requests. Please try again.</div>
            ) : isLoading ? (
              <div className="text-g400 text-center" style={{ padding: 16, fontSize: 12.5 }}>Loading pending requests…</div>
            ) : paginated.length === 0 ? (
              <div className="empty">
                <div className="empty-icon"><i className="lni lni-checkmark-circle"></i></div>
                <div className="empty-title">Nothing to approve</div>
                <div className="empty-sub">No learning mode changes are waiting for approval.</div>
              </div>
            ) : (
              <>
                <div className="person-list">
                  {paginated.map(r => (
                    <div key={r.requestGuid} className="person-row">
                      <div className="person-row-av">{initials(r.studentName)}</div>
                      <div className="person-row-main">
                        <div className="person-row-name">{r.studentName}</div>
                        <div className="person-row-sub">
                          {r.studentRegNo && <span className="font-mono">{r.studentRegNo}</span>}
                          {r.studentRegNo && r.programName && ' · '}
                          {r.programName}
                        </div>
                        <div className="person-row-meta">
                          <span>{r.currentModeLabel}</span>
                          <i className="lni lni-arrow-right" style={{ fontSize: 10 }}></i>
                          <span className="badge badge-blue">{r.requestedModeLabel}</span>
                          <span>· Submitted {formatSubmitted(r.submittedAt)}</span>
                        </div>
                      </div>
                      <button className="btn btn-neu btn-sm" onClick={() => handlePick(r.requestGuid)}><i className="lni lni-eye"></i> Review</button>
                    </div>
                  ))}
                </div>
                {totalCount > 0 && (
                  <Pagination page={page} totalPages={totalPages} totalCount={totalCount} itemLabel="pending requests" onPageChange={setPage} />
                )}
              </>
            )}
          </div>
        ) : (
          <>
            <button className="btn btn-neu btn-sm mb-4" onClick={backToList}><i className="lni lni-arrow-left"></i> Back to Approval List</button>

            {isLoading ? (
              <div className="empty"><div className="empty-title">Loading request…</div></div>
            ) : !selected ? (
              <div className="empty">
                <div className="empty-icon"><i className="lni lni-warning"></i></div>
                <div className="empty-title">Request Not Found</div>
                <div className="empty-sub">It may already have been approved or rejected.</div>
              </div>
            ) : (
              <>
                <BaselinePanel
                  label="Request Details (Read-Only)"
                  items={[
                    { label: 'Student', value: selected.studentName },
                    { label: 'Reg No.', value: selected.studentRegNo || '—', accent: true },
                    { label: 'Programme', value: selected.programName || '—' },
                    { label: 'Semester', value: selected.semesterName || '—' },
                    { label: 'Current Mode', value: selected.currentModeLabel },
                    { label: 'Requested Mode', value: <span style={{ color: 'var(--b700)', fontWeight: 700 }}>{selected.requestedModeLabel}</span> },
                    { label: 'Submitted', value: formatSubmitted(selected.submittedAt) },
                    { label: 'Status', value: <span style={{ color: 'var(--amber)' }}>Pending Approval</span> },
                  ]}
                />

                <div className="card" style={{ marginBottom: 16 }}>
                  <div className="card-hdr"><div className="card-title"><i className="lni lni-comments"></i> Remarks &amp; Document</div></div>
                  <div className="fg">
                    <label className="lbl">Requester Remarks</label>
                    <div className="ctrl" style={{ height: 'auto', minHeight: 60, whiteSpace: 'pre-wrap', background: 'var(--g100)' }}>{selected.remarks}</div>
                  </div>
                  <div className="fg">
                    <label className="lbl">Supporting Document</label>
                    {!doc ? (
                      <input className="ctrl" readOnly value="None attached" />
                    ) : doc.dataUrl ? (
                      <div><button className="btn btn-neu" onClick={() => setDocPreviewOpen(true)}><i className="lni lni-eye"></i> View {doc.name}</button></div>
                    ) : (
                      <input className="ctrl" readOnly value={`${doc.name} (too large to preview in this browser-only prototype)`} />
                    )}
                  </div>
                </div>

                <div className="card">
                  <div className="card-hdr"><div className="card-title"><i className="lni lni-checkmark-circle"></i> Decision</div></div>
                  <div className="fg">
                    <label className="lbl">Approver Remarks</label>
                    <textarea className="ctrl" rows={3} placeholder="Required when rejecting…" value={approverRemarks} onChange={e => setApproverRemarks(e.target.value)} />
                  </div>
                  <div className="flex gap-2" style={{ justifyContent: 'flex-end' }}>
                    <button className="btn btn-danger" onClick={handleReject} disabled={busy || !permissions.edit}>
                      <i className="lni lni-close"></i> {reject.isPending ? 'Rejecting…' : 'Reject'}
                    </button>
                    <button className="btn btn-primary" onClick={handleApprove} disabled={busy || !permissions.edit}>
                      <i className="lni lni-checkmark"></i> {approve.isPending ? 'Applying…' : 'Approve & Apply'}
                    </button>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>

      {docPreviewOpen && doc?.dataUrl && (
        <div className="modal-overlay open" onClick={() => setDocPreviewOpen(false)}>
          <div className="modal modal-xl" onClick={e => e.stopPropagation()}>
            <div className="modal-hdr"><div className="modal-title"><i className="lni lni-files"></i> {doc.name}</div><button className="modal-close" onClick={() => setDocPreviewOpen(false)}>✕</button></div>
            <div style={{ height: '70vh', background: 'var(--g100)', borderRadius: 'var(--rsm)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {docIsImage
                ? <img src={doc.dataUrl} alt="Supporting document" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                : <iframe src={doc.dataUrl} title="Supporting document" style={{ width: '100%', height: '100%', border: 0 }} />}
            </div>
            <div className="modal-footer">
              <a className="btn btn-neu" href={doc.dataUrl} download={doc.name}><i className="lni lni-download"></i> Download</a>
              <button className="btn btn-primary" onClick={() => setDocPreviewOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
      <Toast toast={toast} />
    </>
  )
}

export default function Page() {
  return (
    <Suspense>
      <LearningModeApprovalContent />
    </Suspense>
  )
}
