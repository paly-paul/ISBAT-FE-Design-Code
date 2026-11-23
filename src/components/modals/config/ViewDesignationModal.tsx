'use client'
import { ModalProps } from '../types'
import { Designation } from '@/lib/api/academic/designation'

interface ViewDesignationModalProps extends ModalProps {
  designation: Designation | null
  // Omitted when the user can't edit — the Edit button is hidden then.
  onEdit?: () => void
}

export function ViewDesignationModal({ isOpen, onClose, designation, onEdit }: ViewDesignationModalProps) {
  if (!isOpen || !designation) return null

  return (
    <div className="modal-overlay open" id="view-designation-modal">
      <div className="modal modal-md" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr modal-hdr-blue">
          <div className="modal-title"><i className="lni lni-eye"></i> View Designation</div>
          <button className="modal-close" onClick={onClose}><i className="lni lni-close"></i></button>
        </div>
        <div className="g2">
          <div className="fg">
            <div className="lbl">Short Code</div>
            <div className="val font-mono">{designation.shortCode || '—'}</div>
          </div>
          <div className="fg">
            <div className="lbl">Min. Qualification</div>
            <div className="val">{designation.minQualificationName || '—'}</div>
          </div>
          <div className="fg span2">
            <div className="lbl">Designation Name</div>
            <div className="val">{designation.designationName || '—'}</div>
          </div>
          <div className="fg span2">
            <div className="lbl">Job Description</div>
            <div className="val" style={{ whiteSpace: 'pre-wrap' }}>{designation.jobDescription || '—'}</div>
          </div>
          <div className="fg span2">
            <div className="lbl">Skill Set</div>
            <div className="val" style={{ whiteSpace: 'pre-wrap' }}>{designation.skillSet || '—'}</div>
          </div>
        </div>
        <div className="modal-footer">
          <span className="flex-1"></span>
          {onEdit && (
            <button className="btn btn-neu" onClick={onEdit} style={{ marginRight: 8 }}>
              <i className="lni lni-pencil"></i> Edit
            </button>
          )}
          <button className="btn btn-primary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}
