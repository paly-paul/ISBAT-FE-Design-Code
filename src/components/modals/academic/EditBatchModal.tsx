'use client'
import { useEffect, useState } from 'react'
import { ModalProps } from '../types'
import { SuccessPopup } from './SuccessPopup'
import { FailurePopup } from './FailurePopup'
import { SearchSelect } from '@/components/SearchSelect'
import { BatchUpdateInput } from '@/lib/api/academic/batch'
import { useBatch } from '@/hooks/academic/useBatches'
import { useStreams } from '@/hooks/config/useStreams'
import { useEmployees } from '@/hooks/employee/useEmployees'
import { AuthError } from '@/lib/api/client'

interface EditBatchModalProps extends ModalProps {
  batchGuid: string | null
  updateBatch: {
    mutate: (variables: { guid: string; input: BatchUpdateInput }, options?: { onSuccess?: () => void; onError?: (error: Error) => void }) => void
    isPending: boolean
  }
}

// Per Update.bru, only intStream/bStartDate/bEndDate/bInCharge are actually
// applied — batchCode/batchTime are echoed back unchanged (backend ignores
// them). intProgram/intSem/batchTime are shown read-only below since
// they're not part of the update payload at all, and there's no confirmed
// label mapping to resolve them into names (see the note on Batch in
// lib/api/academic/batch.ts). Stream can't be prefilled either — intStream
// is a number with no reverse mapping back to a streamGuid — so both
// Stream and Batch In-Charge (which GetByGuid doesn't return at all) must
// be re-picked on every edit rather than showing the current value.
export function EditBatchModal({ isOpen, onClose, showToast, batchGuid, updateBatch }: EditBatchModalProps) {
  const { data: batch, isLoading, isError, error } = useBatch(batchGuid, isOpen)
  const { data: streams = [] }   = useStreams()
  const { data: employees = [] } = useEmployees()

  const streamOptions  = streams.map((s, i) => ({ value: String(i), label: s.streamName }))
  const advisorOptions = employees.map((e, i) => ({ value: String(i), label: e.empName }))

  const [saved, setSaved]     = useState(false)
  const [failure, setFailure] = useState<string | null>(null)
  const [streamIdx, setStreamIdx]     = useState('')
  const [inChargeIdx, setInChargeIdx] = useState('')
  const [startDate, setStartDate]     = useState('')
  const [endDate, setEndDate]         = useState('')
  const [errors, setErrors]           = useState<Record<string, string>>({})

  // Prefill only what the fetched record actually has (dates) — Stream and
  // In-Charge are left blank, see the note above.
  useEffect(() => {
    if (!isOpen || !batch) return
    setStreamIdx(''); setInChargeIdx('')
    setStartDate(batch.bStartDate ? batch.bStartDate.slice(0, 10) : '')
    setEndDate(batch.bEndDate ? batch.bEndDate.slice(0, 10) : '')
    setErrors({})
  }, [isOpen, batch])

  if (!isOpen) return null

  function handleClose() { setSaved(false); setFailure(null); setErrors({}); onClose() }

  function validate() {
    const e: Record<string, string> = {}
    if (!streamIdx)   e.streamIdx = 'Please select a Stream'
    if (!inChargeIdx) e.inChargeIdx = 'Please select a Batch In-Charge'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit() {
    if (!batchGuid || !batch || !validate()) return
    updateBatch.mutate(
      {
        guid: batchGuid,
        input: {
          batchCode: batch.batchCode,
          batchTime: batch.batchTime,
          intStream: Number(streamIdx) + 1,
          bStartDate: startDate ? `${startDate}T00:00:00` : null,
          bEndDate: endDate ? `${endDate}T00:00:00` : null,
          bInCharge: Number(inChargeIdx) + 1,
        },
      },
      {
        onSuccess: () => { setSaved(true); showToast('Batch updated successfully') },
        onError: (error: Error) => setFailure(error.message || 'Failed to update batch. Please try again.'),
      },
    )
  }

  if (saved) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <SuccessPopup title="Batch Updated!" subtitle="Your changes have been saved successfully." onClose={handleClose} />
        </div>
      </div>
    )
  }

  if (failure) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <FailurePopup title="Couldn't Update Batch" subtitle={failure} onClose={() => setFailure(null)} />
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <FailurePopup
            title="Couldn't Load Batch"
            subtitle={error instanceof AuthError ? (error.message || 'Failed to load batch details.') : 'Failed to load batch details.'}
            onClose={handleClose}
          />
        </div>
      </div>
    )
  }

  if (isLoading || !batch) {
    return (
      <div className="modal-overlay open" id="edit-batch-modal">
        <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
          <div className="modal-hdr">
            <div className="modal-title"><i className="lni lni-pencil"></i> Edit Batch</div>
            <button className="modal-close" onClick={handleClose}><i className="lni lni-close"></i></button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 180 }}>
            <span style={{ color: 'var(--g400)' }}>Loading batch details…</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay open" id="edit-batch-modal">
      <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr">
          <div className="modal-title"><i className="lni lni-pencil"></i> Edit Batch — {batch.batchCode}</div>
          <button className="modal-close" onClick={handleClose}><i className="lni lni-close"></i></button>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '10px 12px', background: 'var(--amber-bg)', border: '1px solid var(--amber-bd)', borderRadius: 'var(--rxs)', marginBottom: 14 }}>
          <i className="lni lni-warning" style={{ color: 'var(--amber)', marginTop: 2 }}></i>
          <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--g700)' }}>
            Stream is sent as list position, not a confirmed backend id, and can&apos;t be prefilled from the current value — re-select it even if it&apos;s unchanged. Batch In-Charge isn&apos;t returned by this record at all, so it must be re-selected too.
          </span>
        </div>

        {/* Read-only — not part of the update payload, and Programme/Semester/
            Batch Time have no confirmed label mapping to resolve anyway. */}
        <div className="g3" style={{ marginBottom: 16 }}>
          <div className="fg m-0"><div className="lbl">Programme</div><div style={{ fontSize: 13.5, color: 'var(--g700)' }}>Programme #{batch.intProgram}</div></div>
          <div className="fg m-0"><div className="lbl">Semester</div><div style={{ fontSize: 13.5, color: 'var(--g700)' }}>Semester #{batch.intSem}</div></div>
          <div className="fg m-0"><div className="lbl">Batch Time</div><div style={{ fontSize: 13.5, color: 'var(--g700)' }}>Batch Time #{batch.batchTime}</div></div>
        </div>

        <div className="sec-divider">Editable</div>
        <div className="g3">
          <div className="fg">
            <div className="lbl">Stream <span className="req">*</span></div>
            <SearchSelect placeholder="— Select stream —" options={streamOptions} value={streamIdx} onChange={val => { setStreamIdx(val); if (errors.streamIdx) setErrors(p => ({ ...p, streamIdx: '' })) }} />
            {errors.streamIdx && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.streamIdx}</p>}
          </div>
          <div className="fg">
            <div className="lbl">Batch In-Charge <span className="req">*</span></div>
            <SearchSelect placeholder="— Select faculty member —" options={advisorOptions} value={inChargeIdx} onChange={val => { setInChargeIdx(val); if (errors.inChargeIdx) setErrors(p => ({ ...p, inChargeIdx: '' })) }} />
            {errors.inChargeIdx && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.inChargeIdx}</p>}
          </div>
          <div className="fg"><div className="lbl">Start Date</div><input className="ctrl" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} /></div>
          <div className="fg"><div className="lbl">End Date</div><input className="ctrl" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} /></div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-neu" onClick={handleClose}>Cancel</button>
          <button className="btn btn-primary" disabled={updateBatch.isPending} onClick={handleSubmit}>
            <i className="lni lni-checkmark"></i> {updateBatch.isPending ? 'Updating…' : 'Update Batch'}
          </button>
        </div>
      </div>
    </div>
  )
}
