import { useQuery } from '@tanstack/react-query'
import {
  getPayments,
  getPaymentAdvances,
  getPaymentGuilds,
  getPaymentLedgers,
  getPaymentNches,
  getPaymentOthers,
  getPaymentRefunds,
} from '@/lib/api/finance/payments'

const PAYMENTS_KEY = ['payments']

// All seven of these are unfiltered back-office list views (no student/date
// filter — see get-payments.md) — never treat the cached page as stale on
// its own, only refetch on remount/page change, same "load it, don't keep
// refiring" convention as most read-only list hooks elsewhere in this app.
export function usePayments(page: number, pageSize: number) {
  return useQuery({
    queryKey: [...PAYMENTS_KEY, 'list', page, pageSize],
    queryFn: () => getPayments(page, pageSize),
  })
}

// enabled defaults to true (the advanced-payments console page's own usage,
// always visible) — the Other Payment tab's Advance Payment picker modal
// (payment-console/page.tsx) passes false until it's actually open, so this
// unfiltered back-office list isn't fetched on every page load just because
// the checkbox exists.
export function usePaymentAdvances(page: number, pageSize: number, enabled = true) {
  return useQuery({
    queryKey: [...PAYMENTS_KEY, 'advances', page, pageSize],
    queryFn: () => getPaymentAdvances(page, pageSize),
    enabled,
  })
}

export function usePaymentGuilds(page: number, pageSize: number) {
  return useQuery({
    queryKey: [...PAYMENTS_KEY, 'guilds', page, pageSize],
    queryFn: () => getPaymentGuilds(page, pageSize),
  })
}

export function usePaymentLedgers(page: number, pageSize: number) {
  return useQuery({
    queryKey: [...PAYMENTS_KEY, 'ledgers', page, pageSize],
    queryFn: () => getPaymentLedgers(page, pageSize),
  })
}

export function usePaymentNches(page: number, pageSize: number) {
  return useQuery({
    queryKey: [...PAYMENTS_KEY, 'nches', page, pageSize],
    queryFn: () => getPaymentNches(page, pageSize),
  })
}

export function usePaymentOthers(page: number, pageSize: number) {
  return useQuery({
    queryKey: [...PAYMENTS_KEY, 'others', page, pageSize],
    queryFn: () => getPaymentOthers(page, pageSize),
  })
}

export function usePaymentRefunds(page: number, pageSize: number) {
  return useQuery({
    queryKey: [...PAYMENTS_KEY, 'refunds', page, pageSize],
    queryFn: () => getPaymentRefunds(page, pageSize),
  })
}

export type {
  Payment,
  PaymentAdvance,
  PaymentGuild,
  PaymentLedger,
  PaymentNche,
  PaymentOther,
  PaymentRefund,
} from '@/lib/api/finance/payments'
