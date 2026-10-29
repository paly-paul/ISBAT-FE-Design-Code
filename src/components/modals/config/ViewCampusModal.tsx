'use client'
import { ModalProps } from '../types'
import { Campus } from '@/lib/api/academic/campus'

interface ViewCampusModalProps extends ModalProps {
  campus: Campus | null
  onEdit: () => void
}

// Same layout as the Academic view modals (ViewRoomModal, ViewBatchModal):
// code in the title, a view-detail-grid of label/value fields.
function Field({ label, value, mono, wide }: { label: string; value: React.ReactNode; mono?: boolean; wide?: boolean }) {
  return (
    <div style={{ gridColumn: wide ? '1 / -1' : undefined }}>
      <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--g500)', marginBottom: '4px' }}>{label}</div>
      <div className={mono ? 'font-mono' : undefined} style={{ fontSize: mono ? '13px' : '14px', color: 'var(--g900)', fontWeight: 500 }}>{value}</div>
    </div>
  )
}

export function ViewCampusModal({ isOpen, onClose, campus, onEdit }: ViewCampusModalProps) {
  if (!isOpen || !campus) return null

  // Addresses arrive as one line with ";" between parts — one part per line.
  const addressLines = (campus.address ?? '').split(';').map(s => s.trim()).filter(Boolean)

  return (
    <div className="modal-overlay open" id="view-campus-modal">
      <div className="modal modal-md" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr modal-hdr-blue">
          <div className="modal-title"><i className="lni lni-eye"></i> View Campus — <span className="font-mono">{campus.campusCode}</span></div>
          <button className="modal-close" onClick={onClose}><i className="lni lni-close"></i></button>
        </div>

        <div style={{ padding: '18px clamp(14px, 4vw, 22px)' }}>
          {/* modal-md caps out below view-detail-grid's 3-col breakpoint, so
              a fixed 2-column grid keeps the rows full (as in ViewRoomModal).
              Tighter row gap than the grid's 20px default — only seven
              short values here. */}
          <div className="view-detail-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', rowGap: 14 }}>
            <Field label="Campus Code" value={campus.campusCode || '—'} mono />
            <Field label="Is biometric enabled for campus" value={<span className={`badge ${campus.isAutomated ? 'badge-green' : 'badge-grey'}`}>{campus.isAutomated ? 'Yes' : 'No'}</span>} />
            <Field label="Campus Name" value={campus.campusName || '—'} wide />

            <div style={{ gridColumn: '1 / -1', height: '1px', background: 'var(--g200)', margin: '-2px 0' }} />

            <Field label="Location" value={campus.location || '—'} />
            <Field label="Contact" value={campus.contact?.trim() || '—'} />
            <Field
              label="Address"
              wide
              value={addressLines.length ? addressLines.map(l => <div key={l}>{l}</div>) : '—'}
            />
          </div>
        </div>

        <div className="modal-footer" style={{ borderTop: '1px solid var(--g200)' }}>
          <span className="flex-1"></span>
          <button className="btn btn-neu" onClick={onEdit}>
            <i className="lni lni-pencil"></i> Edit
          </button>
          <button className="btn btn-primary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}
