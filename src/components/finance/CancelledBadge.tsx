import type { CancelledFields } from '@/lib/api/finance/paymentCancel'
import { formatDate } from '@/lib/date'

// "Cancelled" badge for a cancelled payment row, with the reason, who
// cancelled it and when underneath (and in the tooltip). Renders nothing for
// a live payment.
export function CancelledBadge({ row, compact = false }: { row: CancelledFields; compact?: boolean }) {
  if (!row.isCancelled) return null
  const who = [row.cancelledByName, row.cancelledDate ? formatDate(row.cancelledDate) : null].filter(Boolean).join(' · ')
  const title = [row.cancelReason && `Reason: ${row.cancelReason}`, who && `Cancelled by ${who}`].filter(Boolean).join('\n')
  return (
    <span className="inline-flex flex-col items-start gap-0.5" title={title || undefined}>
      <span className="badge badge-red">Cancelled</span>
      {!compact && row.cancelReason && <span className="text-g500" style={{ fontSize: 11, maxWidth: 260, whiteSpace: 'normal' }}>{row.cancelReason}</span>}
      {!compact && who && <span className="text-g400" style={{ fontSize: 10.5 }}>{who}</span>}
    </span>
  )
}
