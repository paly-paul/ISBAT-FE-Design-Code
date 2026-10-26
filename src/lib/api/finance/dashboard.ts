import { apiGet } from '../client'

// Finance Dashboard (finance-dashboard-page.md). Docs:
// finance-service/dashboard/get-dashboard-*.md. All seven need the
// finance.dashboard.get permission (403 forbidden otherwise). Every amount
// comes in its own currency and as …InBase (the default currency); only the
// …InBase figures may be added across currencies.

// ── Summary ────────────────────────────────────────────────────────────────

export interface DashboardTotals {
  gross: number
  discount: number
  net: number            // gross − discount
  receiptCount: number
}

export interface DashboardSummary {
  fromDate: string
  toDate: string
  previousFromDate: string
  previousToDate: string
  studentCount: number
  previousStudentCount: number
  baseCurrencyCode: string
  currentInBase: DashboardTotals
  previousInBase: DashboardTotals
  hasMissingRates: boolean
  currencies: { currencyCode: string; current: DashboardTotals; previous: DashboardTotals }[]
}

export interface DashboardRangeParams {
  fromDate: string       // yyyy-MM-dd
  toDate: string
  intakeGuid?: string
}

// ── Outstanding ────────────────────────────────────────────────────────────

export interface DashboardOutstanding {
  generatedAt: string    // local business time; cached 5 min per intake
  baseCurrencyCode: string
  hasMissingRates: boolean
  studentCount: number
  owingStudentCount: number
  clearedStudentCount: number
  blockedStudentCount: number
  blockedBelowPercent: number
  totalOutstandingInBase: number
  currentOutstandingInBase: number
  previousOutstandingInBase: number
  // Current semester figures, plus what's carried over. Never add across currencies.
  byCurrency: {
    currencyCode: string
    owingStudentCount: number
    fee: number
    collected: number
    discount: number
    outstanding: number
    previousOutstanding: number
    totalOutstanding: number
  }[]
  byProgram: {
    programName: string | null
    owingStudentCount: number
    outstandingInBase: number
    previousOutstandingInBase: number
    totalOutstandingInBase: number
  }[]
  bySponsorCategory: { sponsorCategory: string; studentCount: number; owingStudentCount: number; totalOutstandingInBase: number }[]
  topDefaulters: {
    studentGuid: string
    studentNumber: string
    studentName: string
    programName: string | null
    clearancePercent: number
    totalOutstandingInBase: number
    amounts: { currencyCode: string; totalOutstanding: number }[]
  }[]
}

// ── Collection by fee type ─────────────────────────────────────────────────

export const FEE_TYPE_REGISTRATION = 2

export interface DashboardFeeType {
  feeType: number                      // 1 Admission, 2 Registration, 3 Tuition, 4 Other
  feeTypeName: string
  currencyCode: string
  studentCount: number
  fullyPaidStudentCount: number
  expected: number
  collected: number                    // capped at what's owed on each line
  overpaid: number                     // paid above that; never part of collected
  discount: number
  outstanding: number
  collectionRatePercent: number | null // null when nothing is payable
  expectedInBase: number
  collectedInBase: number
  overpaidInBase: number
  discountInBase: number
  outstandingInBase: number
}

export interface DashboardCollectionByFeeType {
  generatedAt: string
  baseCurrencyCode: string
  hasMissingRates: boolean
  studentCount: number
  registeredCount: number
  feeTypes: DashboardFeeType[]
  // NCHE & Guild: collected only, no target.
  regulatoryFees: { category: number; categoryName: string; currencyCode: string; collected: number; collectedInBase: number; receiptCount: number; studentCount: number }[]
}

// ── Recent payments ────────────────────────────────────────────────────────

export interface DashboardRecentPayment {
  category: number                     // 1 Tuition, 2 Other, 3 NCHE, 4 Guild
  categoryName: string
  receipt: string | null               // null for NCHE
  studentNumber: string | null
  studentName: string | null
  programName: string | null
  feeTypes: string[]
  amount: number
  currencyCode: string
  amountInBase: number | null          // null when the currency has no rate
  payType: number | null
  payTypeName: string                  // "Unclassified" for NCHE & Guild
  payDate: string
  entryTime: string | null             // null for back-dated or imported payments
}

export interface DashboardRecentPayments {
  date: string
  baseCurrencyCode: string
  hasMissingRates: boolean
  totalCount: number
  items: DashboardRecentPayment[]
}

// ── Attention ──────────────────────────────────────────────────────────────

export interface DashboardAttention {
  asOfDate: string
  bankUsageDays: number
  changeDays: number
  blockedBanks: { shortCode: string; bankName: string; reason: string; recentPaymentCount: number }[]
  lowReceiptBooks: { receiptBookGuid: string; bookCode: string; categoryName: string; remaining: number; totalCount: number }[]
  // Shape not shown in the docs (the example is empty); read defensively.
  categoriesWithoutActiveBook: (string | { categoryName?: string })[]
  missingExchangeRates: { currencyCode: string; currencyName: string; lastRateDate: string | null; daysSinceLastRate: number | null }[]
  recentChanges: { timestamp: string; userName: string; action: string; entityType: string; summary: string }[]  // timestamp is UTC
}

// ── Collections (trends) ───────────────────────────────────────────────────

// Only these two; anything else is a 500 from the server.
export type DashboardGranularity = 'Day' | 'Month'

interface PerCurrencyNet { currencyCode: string; net: number; netInBase: number }

export interface DashboardCollections {
  fromDate: string
  toDate: string
  baseCurrencyCode: string
  hasMissingRates: boolean
  trend: (PerCurrencyNet & { periodStart: string })[]
  byCategory: (PerCurrencyNet & { category: number; categoryName: string; receiptCount: number })[]
  byPayType: (PerCurrencyNet & { payType: number | null; payTypeName: string; receiptCount: number })[]
  // Gross, not net.
  topLedgers: { ledgerGuid: string | null; ledgerCode: string | null; ledgerName: string; category: number; categoryName: string; currencyCode: string; gross: number; grossInBase: number }[]
  byUser: (PerCurrencyNet & { userName: string; receiptCount: number })[]
}

// ── Discounts ──────────────────────────────────────────────────────────────

export interface DashboardDiscounts {
  fromDate: string
  toDate: string
  baseCurrencyCode: string
  hasMissingRates: boolean
  discountedStudentCount: number
  totalDiscountInBase: number
  tuitionGrossInBase: number
  percentOfTuitionGross: number | null
  byCurrency: { currencyCode: string; discount: number; tuitionGross: number; percentOfTuitionGross: number | null }[]
  byType: {
    discountGuid: string | null
    discountCode: string | null
    discountName: string
    studentCount: number
    lineCount: number
    amountInBase: number
    sharePercent: number
    amounts: { currencyCode: string; amount: number }[]
  }[]
}

// ── Endpoints ──────────────────────────────────────────────────────────────

function rangeParams(p: DashboardRangeParams) {
  const params = new URLSearchParams({ fromDate: p.fromDate, toDate: p.toDate })
  if (p.intakeGuid) params.set('intakeGuid', p.intakeGuid)
  return params
}

// GET /finance/dashboard/summary. With fromDate = toDate the "previous"
// figures are the day before.
export function getDashboardSummary(p: DashboardRangeParams): Promise<DashboardSummary> {
  return apiGet<DashboardSummary>(`/api/v1/finance/dashboard/summary?${rangeParams(p).toString()}`)
}

// GET /finance/dashboard/outstanding. Cached 5 min per intake and topCount;
// the first call can take a few seconds.
export function getDashboardOutstanding(intakeGuid: string, topCount = 10): Promise<DashboardOutstanding> {
  const params = new URLSearchParams({ intakeGuid, topCount: String(topCount) })
  return apiGet<DashboardOutstanding>(`/api/v1/finance/dashboard/outstanding?${params.toString()}`)
}

// GET /finance/dashboard/collection-by-fee-type. Cached 5 min per intake.
export function getDashboardCollectionByFeeType(intakeGuid: string): Promise<DashboardCollectionByFeeType> {
  return apiGet<DashboardCollectionByFeeType>(`/api/v1/finance/dashboard/collection-by-fee-type?${new URLSearchParams({ intakeGuid }).toString()}`)
}

// GET /finance/dashboard/recent-payments. No date = today on the server.
export function getDashboardRecentPayments(intakeGuid: string, limit = 20): Promise<DashboardRecentPayments> {
  const params = new URLSearchParams({ intakeGuid, limit: String(limit) })
  return apiGet<DashboardRecentPayments>(`/api/v1/finance/dashboard/recent-payments?${params.toString()}`)
}

// GET /finance/dashboard/attention. Not intake-specific.
export function getDashboardAttention(changeDays = 7): Promise<DashboardAttention> {
  return apiGet<DashboardAttention>(`/api/v1/finance/dashboard/attention?${new URLSearchParams({ changeDays: String(changeDays) }).toString()}`)
}

// GET /finance/dashboard/collections. One call fills the whole trends area.
export function getDashboardCollections(p: DashboardRangeParams & { granularity: DashboardGranularity }): Promise<DashboardCollections> {
  const params = rangeParams(p)
  params.set('granularity', p.granularity)
  return apiGet<DashboardCollections>(`/api/v1/finance/dashboard/collections?${params.toString()}`)
}

// GET /finance/dashboard/discounts. totalDiscountInBase equals the summary's
// currentInBase.discount for the same range.
export function getDashboardDiscounts(p: DashboardRangeParams): Promise<DashboardDiscounts> {
  return apiGet<DashboardDiscounts>(`/api/v1/finance/dashboard/discounts?${rangeParams(p).toString()}`)
}
