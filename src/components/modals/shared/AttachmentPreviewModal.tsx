'use client'

interface AttachmentPreviewModalProps {
  isOpen: boolean
  onClose: () => void
  url: string | null
  name: string | null
  type: 'image' | 'pdf' | null
}

// A plain in-page popup — deliberately not window.open()'d to a new tab like
// src/lib/documentViewer.ts's openDocumentForViewing() does for real
// presigned S3 documents elsewhere in the app; this one previews a locally
// attached image/PDF (currently only Announcement Management) inline.
export function AttachmentPreviewModal({ isOpen, onClose, url, name, type }: AttachmentPreviewModalProps) {
  if (!isOpen || !url) return null

  return (
    <div className="modal-overlay open" onClick={onClose}>
      <div
        className="modal modal-lg"
        onClick={e => e.stopPropagation()}
        style={{ display: 'flex', flexDirection: 'column', maxHeight: '85vh' }}
      >
        <div className="modal-hdr modal-hdr-blue">
          <div className="modal-title"><i className="lni lni-paperclip"></i> {name ?? 'Attachment'}</div>
          <button className="modal-close" onClick={onClose}><i className="lni lni-close"></i></button>
        </div>
        <div style={{ flex: 1, overflow: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--g100)', borderRadius: 'var(--rsm)', minHeight: 320 }}>
          {type === 'image' ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt={name ?? 'Attachment preview'} style={{ maxWidth: '100%', maxHeight: '75vh', objectFit: 'contain' }} />
          ) : (
            <iframe src={url} title={name ?? 'Attachment preview'} style={{ width: '100%', height: '75vh', border: 'none' }} />
          )}
        </div>
        <div className="modal-footer">
          <a className="btn btn-neu" href={url} target="_blank" rel="noopener noreferrer" download={name ?? undefined}>
            <i className="lni lni-download"></i> Download
          </a>
          <button className="btn btn-primary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}
