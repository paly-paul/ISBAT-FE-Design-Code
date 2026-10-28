'use client'
import { ModalProps } from '../types'
import { Campus } from '@/lib/api/academic/campus'

interface ViewCampusModalProps extends ModalProps {
  campus: Campus | null
  onEdit: () => void
}

// Addresses arrive as one line with ";" between parts (street, P.O. box,
// "Mob: …") — shown one part per line.
function addressLines(address: string | null | undefined) {
  return (address ?? '').split(';').map(s => s.trim()).filter(Boolean)
}

export function ViewCampusModal({ isOpen, onClose, campus, onEdit }: ViewCampusModalProps) {
  if (!isOpen || !campus) return null

  const lines = addressLines(campus.address)
  const contact = campus.contact?.trim() ?? ''

  return (
    <div className="modal-overlay open" id="view-campus-modal">
      <div className="modal modal-md" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr modal-hdr-blue">
          <div className="modal-title"><i className="lni lni-eye"></i> View Campus</div>
          <button className="modal-close" onClick={onClose} aria-label="Close"><i className="lni lni-close"></i></button>
        </div>

        <div className="vc-hero">
          <span className="vc-hero-icon" aria-hidden="true"><i className="lni lni-apartment"></i></span>
          <div className="vc-hero-body">
            <div className="vc-hero-name">{campus.campusName || '—'}</div>
            <div className="vc-hero-meta">
              <span className="vc-code">{campus.campusCode || '—'}</span>
              {campus.location && <span><i className="lni lni-map-marker" aria-hidden="true"></i> {campus.location}</span>}
            </div>
          </div>
          <span className={`vc-bio${campus.isAutomated ? ' on' : ''}`}>
            <i className={`lni ${campus.isAutomated ? 'lni-checkmark-circle' : 'lni-ban'}`} aria-hidden="true"></i>
            {campus.isAutomated ? 'Biometric enabled' : 'Biometric not enabled'}
          </span>
        </div>

        <dl className="vc-rows">
          <div className="vc-row">
            <dt><i className="lni lni-map-marker" aria-hidden="true"></i> Location</dt>
            <dd>{campus.location || <span className="vc-empty">Not set</span>}</dd>
          </div>
          <div className="vc-row">
            <dt><i className="lni lni-phone" aria-hidden="true"></i> Contact</dt>
            <dd>
              {contact
                ? <a className="vc-link tabular-nums" href={`tel:${contact.replace(/[^\d+]/g, '')}`}>{contact}</a>
                : <span className="vc-empty">Not set</span>}
            </dd>
          </div>
          <div className="vc-row">
            <dt><i className="lni lni-home" aria-hidden="true"></i> Address</dt>
            <dd>
              {lines.length
                ? lines.map(l => <span key={l} className="vc-line">{l}</span>)
                : <span className="vc-empty">Not set</span>}
            </dd>
          </div>
          <div className="vc-row">
            <dt><i className="lni lni-id-card" aria-hidden="true"></i> Biometric attendance</dt>
            <dd>{campus.isAutomated ? 'Enabled — class attendance is recorded from biometrics' : 'Not enabled — lecturers record attendance manually'}</dd>
          </div>
        </dl>

        <div className="modal-footer">
          <span className="flex-1"></span>
          <button className="btn btn-neu" onClick={onEdit} style={{ marginRight: 8 }}>
            <i className="lni lni-pencil"></i> Edit
          </button>
          <button className="btn btn-primary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}
