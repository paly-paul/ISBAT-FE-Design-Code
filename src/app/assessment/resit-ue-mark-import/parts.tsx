'use client'

// Small pieces shared by the Resit UE Mark Import list, mark sheet and
// import drawer.

export const PART_BADGE: Record<string, string> = { Theory: 'badge-blue', Practical: 'badge-purple', Project: 'badge-cyan' }

export function fmtDate(iso: string | null | undefined) {
  if (!iso) return '—'
  const d = new Date(iso)
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

// Column maxima and totals: "20", "48.5".
export function fmtMark(n: number | null | undefined) {
  if (n === null || n === undefined) return '—'
  return Number.isInteger(n) ? String(n) : String(Number(n.toFixed(2)))
}

// Saved marks in the grid: always 2 decimals ("15.00").
export function fmtMark2(n: number | null | undefined) {
  return n === null || n === undefined ? '—' : Number(n).toFixed(2)
}

export function errMsg(err: unknown, fallback: string) {
  return (err as { message?: string } | null)?.message || fallback
}
export function errCode(err: unknown) { return (err as { code?: string } | null)?.code }
export function errList(err: unknown): string[] { return (err as { errors?: string[] } | null)?.errors ?? [] }

export function SummaryTile({ label, value, color, icon }: { label: string; value: string; color?: string; icon?: string }) {
  return (
    <div className="card" style={{ padding: '12px 14px', marginBottom: 0 }}>
      <div className="text-xs text-g500 font-semibold">{label}</div>
      <div className="text-lg font-bold mt-0.5 tabular-nums flex items-center gap-1.5" style={{ color: color ?? 'var(--g900)' }}>
        {icon && <i className={`lni ${icon} text-base`} aria-hidden="true"></i>}
        {value}
      </div>
    </div>
  )
}

export function CellErrors({ msgs }: { msgs?: string[] }) {
  if (!msgs?.length) return null
  return <div className="text-[11px] mt-1" style={{ color: 'var(--red)', textAlign: 'left' }}>{msgs.map(m => <div key={m}>{m}</div>)}</div>
}

// Confirmation card. Only Cancel / the action close it — a stray click on
// the backdrop must not decide for the user.
export function ConfirmCard({ title, body, confirmLabel, danger, onCancel, onConfirm }: { title: string; body: string; confirmLabel: string; danger?: boolean; onCancel: () => void; onConfirm: () => void }) {
  return (
    <div className="perm-delete-overlay" style={{ position: 'fixed', zIndex: 600 }} onClick={e => e.stopPropagation()}>
      <div className="perm-delete-card tab-panel-in" role="alertdialog" aria-modal="true" aria-label={title}>
        <div className="perm-delete-icon"><i className={`lni ${danger ? 'lni-warning' : 'lni-save'}`}></i></div>
        <div className="perm-delete-title">{title}</div>
        <div className="perm-delete-sub">{body}</div>
        <div className="perm-delete-actions">
          <button className="btn btn-neu" onClick={onCancel}>Cancel</button>
          <button className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm} autoFocus>{confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}
