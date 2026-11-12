// `totalPaid` on the finance payment lists (MR !137, feature/payment-total-paid):
// payment-console/payments, other-payment, nche/payment-history and
// guild/payment-history. One entry per currency, summed with no conversion
// between currencies, so each is shown separately. [] when there are no
// payments; deleted payments are excluded. On the paged lists it covers every
// payment matching the filters, not just the current page.

export interface TotalPaid {
  currency: { currencyGuid: string; currencyCode: string; currencyName: string } | null
  totalAmount: number
}

export function formatTotalAmount(n: number): string {
  return n.toLocaleString('en-US', { maximumFractionDigits: 2 })
}
