import { keepPreviousData, useQuery } from '@tanstack/react-query'
import {
  DashboardGranularity,
  getDashboardAttention,
  getDashboardCollectionByFeeType,
  getDashboardCollections,
  getDashboardDiscounts,
  getDashboardOutstanding,
  getDashboardRecentPayments,
  getDashboardSummary,
} from '@/lib/api/finance/dashboard'

const DASHBOARD_KEY = ['finance', 'dashboard']

// The Live badge is a timer, not a push (finance-dashboard-page.md step 8).
// refetchIntervalInBackground stays false, so nothing polls while the tab is
// hidden, and a failed query stops polling until the user presses Retry.
const FAST_MS = 60_000
// outstanding and collection-by-fee-type are cached 5 min on the server;
// asking sooner returns the same numbers.
const SLOW_MS = 5 * 60_000

function every(ms: number) {
  return (query: { state: { status: string } }) => (query.state.status === 'error' ? false : ms)
}

function todayYmd() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Collected Today. "Today" is worked out on every fetch, so a tab left open
// past midnight rolls over on the next tick.
export function useDashboardSummaryToday(intakeGuid: string) {
  return useQuery({
    queryKey: [...DASHBOARD_KEY, 'summary-today', intakeGuid],
    queryFn: () => { const today = todayYmd(); return getDashboardSummary({ fromDate: today, toDate: today, intakeGuid }) },
    enabled: !!intakeGuid,
    refetchInterval: every(FAST_MS),
  })
}

export function useDashboardRecentPayments(intakeGuid: string, limit = 20) {
  return useQuery({
    queryKey: [...DASHBOARD_KEY, 'recent-payments', intakeGuid, limit],
    queryFn: () => getDashboardRecentPayments(intakeGuid, limit),
    enabled: !!intakeGuid,
    refetchInterval: every(FAST_MS),
  })
}

export function useDashboardOutstanding(intakeGuid: string, topCount = 10) {
  return useQuery({
    queryKey: [...DASHBOARD_KEY, 'outstanding', intakeGuid, topCount],
    queryFn: () => getDashboardOutstanding(intakeGuid, topCount),
    enabled: !!intakeGuid,
    refetchInterval: every(SLOW_MS),
  })
}

export function useDashboardCollectionByFeeType(intakeGuid: string) {
  return useQuery({
    queryKey: [...DASHBOARD_KEY, 'collection-by-fee-type', intakeGuid],
    queryFn: () => getDashboardCollectionByFeeType(intakeGuid),
    enabled: !!intakeGuid,
    refetchInterval: every(SLOW_MS),
  })
}

export function useDashboardAttention(changeDays = 7) {
  return useQuery({
    queryKey: [...DASHBOARD_KEY, 'attention', changeDays],
    queryFn: () => getDashboardAttention(changeDays),
  })
}

// Trends: re-fetched only when the dates, grouping or intake change. The
// previous result stays on screen while the next range loads.
export function useDashboardCollections(intakeGuid: string, fromDate: string, toDate: string, granularity: DashboardGranularity, enabled: boolean) {
  return useQuery({
    queryKey: [...DASHBOARD_KEY, 'collections', intakeGuid, fromDate, toDate, granularity],
    queryFn: () => getDashboardCollections({ intakeGuid, fromDate, toDate, granularity }),
    enabled: enabled && !!intakeGuid && !!fromDate && !!toDate,
    placeholderData: keepPreviousData,
  })
}

export function useDashboardDiscounts(intakeGuid: string, fromDate: string, toDate: string, enabled: boolean) {
  return useQuery({
    queryKey: [...DASHBOARD_KEY, 'discounts', intakeGuid, fromDate, toDate],
    queryFn: () => getDashboardDiscounts({ intakeGuid, fromDate, toDate }),
    enabled: enabled && !!intakeGuid && !!fromDate && !!toDate,
    placeholderData: keepPreviousData,
  })
}
