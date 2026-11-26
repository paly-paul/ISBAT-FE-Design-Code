import { keepPreviousData, useQuery } from '@tanstack/react-query'
import {
  DashboardGranularity,
  DashboardStudentListParams,
  getDashboardAttention,
  getDashboardBlockedStudents,
  getDashboardClearedStudents,
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

// The Collected card's date: '' means today. For today, "today" is worked out
// on every fetch (a tab left open past midnight rolls over on the next tick)
// and the figures refresh every 60 s; an earlier day doesn't change, so it
// isn't polled. The date is sent as both fromDate and toDate.
export function useDashboardSummary(intakeGuid: string, date: string) {
  return useQuery({
    queryKey: [...DASHBOARD_KEY, 'summary', intakeGuid, date || 'today'],
    queryFn: () => { const d = date || todayYmd(); return getDashboardSummary({ fromDate: d, toDate: d, intakeGuid }) },
    enabled: !!intakeGuid,
    refetchInterval: date ? false : every(FAST_MS),
  })
}

// Follows the Collected card's date. Today: no date sent, so the API falls
// back to the latest day with payments; another day: exactly that day.
export function useDashboardRecentPayments(intakeGuid: string, limit: number, date: string) {
  return useQuery({
    queryKey: [...DASHBOARD_KEY, 'recent-payments', intakeGuid, limit, date || 'today'],
    queryFn: () => getDashboardRecentPayments(intakeGuid, limit, date || undefined),
    enabled: !!intakeGuid,
    refetchInterval: date ? false : every(FAST_MS),
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

// Cleared / blocked drill-down lists. No polling: they load when opened and
// when the filters or page change, and only the list re-fetches (the cards
// don't). The current page stays on screen while the next one loads.
export function useDashboardClearedStudents(params: DashboardStudentListParams, enabled: boolean) {
  return useQuery({
    queryKey: [...DASHBOARD_KEY, 'cleared-students', params],
    queryFn: () => getDashboardClearedStudents(params),
    enabled: enabled && !!params.intakeGuid,
    placeholderData: keepPreviousData,
  })
}

export function useDashboardBlockedStudents(params: DashboardStudentListParams, enabled: boolean) {
  return useQuery({
    queryKey: [...DASHBOARD_KEY, 'blocked-students', params],
    queryFn: () => getDashboardBlockedStudents(params),
    enabled: enabled && !!params.intakeGuid,
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
