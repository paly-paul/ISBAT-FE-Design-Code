'use client'
import { ModalProps } from '../types'
import { FailurePopup } from '../shared/FailurePopup'
import { useBatch } from '@/hooks/academic/useBatches'
import { AuthError } from '@/lib/api/client'

interface ViewBatchModalProps extends ModalProps {
  batchGuid: string | null
  onEdit?: () => void
  canEdit?: boolean
}

function Field({ label, value, mono, wide }: { label: string; value: React.ReactNode; mono?: boolean; wide?: boolean }) {
  return (
    <div style={{ gridColumn: wide ? '1 / -1' : undefined }}>
      <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--g500)', marginBottom: '4px' }}>{label}</div>
      <div className={mono ? 'font-mono' : undefined} style={{ fontSize: '14px', color: 'var(--g900)', fontWeight: 500 }}>{value}</div>
    </div>
  )
}

// Every label comes pre-resolved on GET /academic/batches/:guid (programName,
// semesterName, streamName, batchTimeName, intakeDescription, bInChargeName,
// pHeadName), so nothing is looked up against the master lists — those
// lookups missed batches whose programme isn't in the Programme Master list
// (e.g. an older "- S22" programme) and showed "—".
export function ViewBatchModal({ isOpen, onClose, batchGuid, onEdit, canEdit }: ViewBatchModalProps) {
  const { data: batch, isLoading, isError, error } = useBatch(batchGuid, isOpen)

  if (!isOpen) return null

  if (isError) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <FailurePopup
            title="Couldn't Load Batch"
            subtitle={error instanceof AuthError ? (error.message || 'Failed to load batch details.') : 'Failed to load batch details.'}
            onClose={onClose}
          />
        </div>
      </div>
    )
  }

  if (isLoading || !batch) {
    return (
      <div className="modal-overlay open" id="edit-batch-modal">
        <div className="modal modal-xl modal-flex" onClick={e => e.stopPropagation()}>
          <div className="modal-hdr modal-hdr-blue">
            <div className="modal-title"><i className="lni lni-eye"></i> View Batch</div>
            <button className="modal-close" onClick={onClose}><i className="lni lni-close"></i></button>
          </div>
          <div className="modal-scroll" style={{ flex: '1 1 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 180 }}>
            <span style={{ color: 'var(--g400)' }}>Loading batch details…</span>
          </div>
        </div>
      </div>
    )
  }

  // Names can carry trailing spaces from the source data ("AGATHA KIBUKAIRE ").
  const text = (v?: string | null) => v?.trim() || '—'

  return (
    <div className="modal-overlay open" id="edit-batch-modal">
      <div className="modal modal-lg modal-flex" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr modal-hdr-blue">
          <div className="modal-title"><i className="lni lni-eye"></i> View Batch — <span className="font-mono">{batch.batchCode}</span></div>
          <button className="modal-close" onClick={onClose}><i className="lni lni-close"></i></button>
        </div>

        <div className="modal-scroll" style={{ padding: '20px clamp(14px, 4vw, 22px)' }}>
          <div className="view-detail-grid">
            <Field label="Batch Code" value={batch.batchCode} mono />
            <Field label="Status" value={<span className={`badge ${batch.active ? 'badge-green' : 'badge-grey'}`}>{batch.active ? 'Active' : 'Inactive'}</span>} />
            <Field label="Intake" value={text(batch.intakeDescription)} />

            <div style={{ gridColumn: '1 / -1', height: '1px', background: 'var(--g200)', margin: '8px 0' }} />

            <Field label="Programme" value={text(batch.programName)} />
            <Field label="Semester" value={text(batch.semesterName)} />
            <Field label="Specialization" value={text(batch.streamName)} />

            <div style={{ gridColumn: '1 / -1', height: '1px', background: 'var(--g200)', margin: '8px 0' }} />

            <Field label="Batch Time" value={text(batch.batchTimeName)} />
            <Field label="Start Date" value={batch.bStartDate ? batch.bStartDate.slice(0, 10) : '—'} />
            <Field label="End Date" value={batch.bEndDate ? batch.bEndDate.slice(0, 10) : '—'} />

            <div style={{ gridColumn: '1 / -1', height: '1px', background: 'var(--g200)', margin: '8px 0' }} />

            <Field label="Batch In-Charge" value={text(batch.bInChargeName)} />
            <Field label="Programme Head" value={text(batch.pHeadName)} />
          </div>
        </div>

        <div className="modal-footer" style={{ borderTop: '1px solid var(--g200)' }}>
          <span className="flex-1"></span>
          {canEdit && onEdit && (
            <button className="btn btn-neu" onClick={onEdit}>
              <i className="lni lni-pencil"></i> Edit
            </button>
          )}
          <button className="btn btn-primary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}
