'use client'
import { ModalProps } from '../types'

interface PaymentSuccessModalProps extends ModalProps {
  title: string
  // Label → value rows, rendered in order — e.g. [["Receipt", "RCP-..."],
  // ["Amount", "UGX 50,000"], ["Remaining Balance", "40,000"]]. Kept as a
  // simple list rather than a category-specific shape so one modal serves
  // Tuition/NCHE/Guild (and later Other) without a switch on category here.
  rows: [string, string][]
  // Secondary notices — advanceMessage/reRegistrationWarning on Tuition,
  // shown same as the receipt card's own info-box treatment. Optional;
  // NCHE/Guild have none of these.
  notices?: string[]
  // Optional second button beside OK — e.g. "View Student Statement" so the
  // user can go straight to the student's updated payment details.
  secondaryAction?: { label: string; icon: string; onClick: () => void }
  // Receipt downloads, one button per receipt — a batch of Other payments
  // issues one receipt each.
  downloads?: { key: string; label: string; busy: boolean; disabled: boolean; onClick: () => void }[]
}

// Success confirmation for every payment category's submit — replaces the
// plain success toast (errors stay as toast; see handleSave/ncheSubmit/
// guildSubmit's own onError). Tuition's printable receipt card in Column 3
// is unchanged by this — this modal is the immediate "it worked" moment,
// the card underneath is the lasting/printable record.
export function PaymentSuccessModal({ isOpen, onClose, title, rows, notices, secondaryAction, downloads }: PaymentSuccessModalProps) {
  if (!isOpen) return null

  // With downloads the footer is a two-column grid of equal buttons; OK takes
  // the whole last row when the others fill theirs.
  const actionCount = (downloads?.length ?? 0) + (secondaryAction ? 1 : 0)
  const grid = !!downloads?.length

  return (
    <div className="modal-overlay open">
      <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr" style={{ background: 'var(--green-bg)' }}>
          <div className="modal-title"><i className="lni lni-checkmark-circle" style={{ color: 'var(--green)' }}></i> {title}</div>
          <button className="modal-close" onClick={onClose}><i className="lni lni-close"></i></button>
        </div>

        <div style={{ padding: 20 }}>
          {rows.map(([label, value]) => (
            <div key={label} className="receipt-row"><span className="text-muted">{label}</span><span className="font-bold">{value}</span></div>
          ))}
          {notices?.map(n => (
            <div key={n} className="mt-2"><div className="info-box"><i className="lni lni-information"></i> {n}</div></div>
          ))}
        </div>

        <div className="modal-footer" style={grid ? { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' } : undefined}>
          {downloads?.map(d => (
            <button key={d.key} type="button" className="btn btn-neu justify-center" disabled={d.disabled} aria-busy={d.busy} onClick={d.onClick}>
              <i className="lni lni-download" aria-hidden="true"></i> {d.busy ? 'Downloading…' : d.label}
            </button>
          ))}
          {secondaryAction && (
            <button className="btn btn-neu flex-1 justify-center" onClick={secondaryAction.onClick}>
              <i className={`lni ${secondaryAction.icon}`}></i> {secondaryAction.label}
            </button>
          )}
          <button className="btn btn-primary flex-1 justify-center" style={grid && actionCount % 2 === 0 ? { gridColumn: '1 / -1' } : undefined} onClick={onClose}>OK</button>
        </div>
      </div>
    </div>
  )
}
