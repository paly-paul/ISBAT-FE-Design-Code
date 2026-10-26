import { apiGet } from '../client'

const MOCK_AUTH = process.env.NEXT_PUBLIC_AUTH_MOCK === 'true'

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

// ── Mocks ──────────────────────────────────────────────────────────────────

const MOCK_USD_RATE = 3710

function mockDelay<T>(value: T, ms = 500): Promise<T> {
  return new Promise(resolve => setTimeout(() => resolve(value), ms))
}

function mockNow() {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:00`
}

// Stable pseudo-random 0..1 per key, so mock numbers don't jump between calls.
function rand(key: string) {
  let h = 2166136261
  for (let i = 0; i < key.length; i++) { h ^= key.charCodeAt(i); h = Math.imul(h, 16777619) }
  return ((h >>> 0) % 10000) / 10000
}

function totals(net: number, discount: number, receiptCount: number): DashboardTotals {
  return { gross: net + discount, discount, net, receiptCount }
}

function mockSummary(p: DashboardRangeParams): DashboardSummary {
  return {
    fromDate: `${p.fromDate}T00:00:00`, toDate: `${p.toDate}T00:00:00`,
    previousFromDate: `${p.fromDate}T00:00:00`, previousToDate: `${p.toDate}T00:00:00`,
    studentCount: 31, previousStudentCount: 24, baseCurrencyCode: 'UGX',
    currentInBase: totals(18_412_500, 640_000, 37), previousInBase: totals(14_970_000, 410_000, 29),
    hasMissingRates: false,
    currencies: [
      { currencyCode: 'UGX', current: totals(13_847_500, 640_000, 33), previous: totals(12_000_000, 410_000, 27) },
      { currencyCode: 'USD', current: totals(1_230, 0, 4), previous: totals(800, 0, 2) },
    ],
  }
}

function defaulter(i: number, studentName: string, programName: string, ugx: number, usd: number): DashboardOutstanding['topDefaulters'][number] {
  const amounts = [
    ...(ugx ? [{ currencyCode: 'UGX', totalOutstanding: ugx }] : []),
    ...(usd ? [{ currencyCode: 'USD', totalOutstanding: usd }] : []),
  ]
  return { studentGuid: `mock-dft-${i}`, studentNumber: `01223${String(600 + i * 37).padStart(4, '0')}`, studentName, programName, clearancePercent: (i * 13) % 50, totalOutstandingInBase: ugx + usd * MOCK_USD_RATE, amounts }
}

const MOCK_OUTSTANDING: Omit<DashboardOutstanding, 'generatedAt'> = {
  baseCurrencyCode: 'UGX',
  hasMissingRates: false,
  studentCount: 2911,
  owingStudentCount: 2465,
  clearedStudentCount: 446,
  blockedStudentCount: 1506,
  blockedBelowPercent: 50,
  totalOutstandingInBase: 5_672_480_300,
  currentOutstandingInBase: 4_778_211_089,
  previousOutstandingInBase: 894_269_211,
  byCurrency: [
    { currencyCode: 'UGX', owingStudentCount: 2318, fee: 5_988_120_000, collected: 2_015_594_431, discount: 49_050_000, outstanding: 4_187_242_640, previousOutstanding: 793_957_660, totalOutstanding: 4_981_200_300 },
    { currencyCode: 'USD', owingStudentCount: 212, fee: 538_000, collected: 412_350, discount: 0, outstanding: 159_381, previousOutstanding: 27_039, totalOutstanding: 186_420 },
  ],
  byProgram: [
    { programName: 'BSc Computer Science - F22', owingStudentCount: 512, outstandingInBase: 1_084_600_000, previousOutstandingInBase: 200_000_000, totalOutstandingInBase: 1_284_600_000 },
    { programName: 'Bachelor of Business Administration - S23', owingStudentCount: 466, outstandingInBase: 896_900_000, previousOutstandingInBase: 140_000_000, totalOutstandingInBase: 1_036_900_000 },
    { programName: 'BSc Information Technology - F23', owingStudentCount: 398, outstandingInBase: 812_350_000, previousOutstandingInBase: 100_000_000, totalOutstandingInBase: 912_350_000 },
    { programName: 'BSc Animation and Visual Effects - F25', owingStudentCount: 287, outstandingInBase: 641_440_300, previousOutstandingInBase: 60_000_000, totalOutstandingInBase: 701_440_300 },
    { programName: 'Diploma in Nursing - S24', owingStudentCount: 251, outstandingInBase: 498_210_000, previousOutstandingInBase: 50_000_000, totalOutstandingInBase: 548_210_000 },
    { programName: 'Master of Business Administration - S25', owingStudentCount: 119, outstandingInBase: 426_980_000, previousOutstandingInBase: 40_000_000, totalOutstandingInBase: 466_980_000 },
  ],
  bySponsorCategory: [
    { sponsorCategory: 'Self Paid', studentCount: 2110, owingStudentCount: 1784, totalOutstandingInBase: 3_902_115_000 },
    { sponsorCategory: 'HEC Loan', studentCount: 470, owingStudentCount: 402, totalOutstandingInBase: 1_011_600_000 },
    { sponsorCategory: 'Government', studentCount: 160, owingStudentCount: 143, totalOutstandingInBase: 452_965_300 },
    { sponsorCategory: 'Not specified', studentCount: 171, owingStudentCount: 136, totalOutstandingInBase: 305_800_000 },
  ],
  topDefaulters: [
    defaulter(0, 'Okello James Patrick', 'Master of Business Administration - S25', 0, 4_800),
    defaulter(1, 'Nampijja Grace Miriam', 'BSc Computer Science - F22', 9_250_000, 1_200),
    defaulter(2, 'Mugisha David Kalisa', 'BSc Information Technology - F23', 12_600_000, 0),
    defaulter(3, 'Atim Grace Beatrice', 'Bachelor of Business Administration - S23', 11_975_000, 0),
    defaulter(4, 'Kamya Brian', 'BSc Animation and Visual Effects - F25', 0, 3_150),
    defaulter(5, 'Tumukunde Esther', 'Diploma in Nursing - S24', 10_840_000, 0),
    defaulter(6, 'Ssemakula Peter', 'BSc Computer Science - F22', 7_500_000, 800),
    defaulter(7, 'Akampurira Clever', 'BSc Information Technology - F23', 9_900_000, 0),
    defaulter(8, 'Nakato Amina', 'Bachelor of Business Administration - S23', 9_480_000, 0),
    defaulter(9, 'Byamukama Robert', 'BSc Computer Science - F22', 9_125_000, 0),
  ],
}

function feeType(feeType: number, feeTypeName: string, currencyCode: string, expected: number, collected: number, overpaid = 0, studentCount = 2911): DashboardFeeType {
  const rate = currencyCode === 'USD' ? MOCK_USD_RATE : 1
  const outstanding = expected - collected
  return {
    feeType, feeTypeName, currencyCode, studentCount, fullyPaidStudentCount: Math.round(studentCount * (collected / expected)),
    expected, collected, overpaid, discount: 0, outstanding,
    collectionRatePercent: Math.round((collected / expected) * 1000) / 10,
    expectedInBase: expected * rate, collectedInBase: collected * rate, overpaidInBase: overpaid * rate, discountInBase: 0, outstandingInBase: outstanding * rate,
  }
}

const MOCK_FEE_TYPES: Omit<DashboardCollectionByFeeType, 'generatedAt'> = {
  baseCurrencyCode: 'UGX',
  hasMissingRates: false,
  studentCount: 2911,
  registeredCount: 2006,
  feeTypes: [
    feeType(1, 'Admission', 'UGX', 143_910_000, 124_910_050, 0, 629),
    feeType(2, 'Registration', 'UGX', 1_020_480_000, 703_324_887),
    feeType(3, 'Tuition', 'UGX', 17_465_520_000, 13_225_411_919, 0, 2451),
    feeType(3, 'Tuition', 'USD', 538_000, 412_350, 9_400, 460),
  ],
  regulatoryFees: [
    { category: 3, categoryName: 'NCHE', currencyCode: 'UGX', collected: 320_000, collectedInBase: 320_000, receiptCount: 16, studentCount: 16 },
    { category: 4, categoryName: 'Guild', currencyCode: 'UGX', collected: 140_000, collectedInBase: 140_000, receiptCount: 7, studentCount: 7 },
  ],
}

function payment(i: number, time: string | null, category: number, receipt: string | null, studentName: string, programName: string, feeTypes: string[], amount: number, currencyCode: string, payType: number | null): DashboardRecentPayment {
  const today = mockNow().slice(0, 10)
  const names: Record<number, string> = { 1: 'Cash', 2: 'Cheque', 3: 'Bank', 4: 'DemandDraft', 5: 'Online' }
  return {
    category, categoryName: ['', 'Tuition', 'Other', 'NCHE', 'Guild'][category], receipt,
    studentNumber: `01224${String(700 + i * 11).padStart(4, '0')}`, studentName, programName, feeTypes,
    amount, currencyCode, amountInBase: currencyCode === 'USD' ? amount * MOCK_USD_RATE : amount,
    payType, payTypeName: payType ? names[payType] : 'Unclassified',
    payDate: `${today}T00:00:00`, entryTime: time ? `${today}T${time}:00` : null,
  }
}

const MOCK_RECENT_ITEMS: DashboardRecentPayment[] = [
  payment(0, '10:38', 1, '166362', 'Tumukunde Alice Grace', 'Diploma in Nursing - S24', ['Tuition Fee'], 1_000, 'USD', 3),
  payment(1, '10:21', 3, null, 'Kizza Ronald', 'BSc Computer Science - F25', ['NCHE'], 20_000, 'UGX', null),
  payment(2, '10:02', 1, '166361', 'Nakato Sarah Bridget', 'BSc Computer Science - F22', ['Registration Fee'], 250, 'USD', 5),
  payment(3, '09:47', 1, '166360', 'Nampijja Grace Miriam', 'Bachelor of Commerce - S23', ['Tuition Fee', 'Library Fee'], 1_400_000, 'UGX', 1),
  payment(4, '09:31', 2, '166359', 'Byamukama Robert', 'BSc Engineering - F24', ['Admission Fee'], 50_000, 'UGX', 1),
  payment(5, null, 1, '166358', 'Opio Daniel', 'Master of Business Administration - S25', ['Tuition Fee'], 2_150_000, 'UGX', 3),
  payment(6, '09:05', 2, '166357', 'Achieng Faith', 'BSc Information Technology - F23', ['Retake Fee'], 180_000, 'UGX', 2),
  payment(7, '08:52', 2, '166356', 'Nakato Amina', 'Bachelor of Medical Imaging Technology - F22', ['Resit Exam Fee'], 150_000, 'UGX', 1),
]

function mockAttention(): DashboardAttention {
  const ago = (days: number, hh: string) => { const d = new Date(); d.setDate(d.getDate() - days); return `${d.toISOString().slice(0, 10)}T${hh}:00.000Z` }
  return {
    asOfDate: `${mockNow().slice(0, 10)}T00:00:00`, bankUsageDays: 30, changeDays: 7,
    blockedBanks: [],
    lowReceiptBooks: [
      { receiptBookGuid: 'mock-rb-1', bookCode: 'MCCB07', categoryName: 'Cash', remaining: 12, totalCount: 500 },
      { receiptBookGuid: 'mock-rb-2', bookCode: 'KRBK03', categoryName: 'Bank', remaining: 25, totalCount: 500 },
    ],
    categoriesWithoutActiveBook: [],
    missingExchangeRates: [{ currencyCode: 'USD', currencyName: 'US Dollars', lastRateDate: ago(4, '00:00').slice(0, 10) + 'T00:00:00', daysSinceLastRate: 4 }],
    recentChanges: [
      { timestamp: ago(1, '12:12'), userName: 'Namusoke Joan', action: 'UpdatePayment', entityType: 'Payment', summary: 'Payment of 450000 updated successfully' },
      { timestamp: ago(2, '08:40'), userName: 'Mutebi Allan', action: 'DeleteNcheGuildPayment', entityType: 'NcheGuildPayment', summary: 'Guild payment of 20000 deleted' },
      { timestamp: ago(5, '06:26'), userName: 'Namusoke Joan', action: 'UpdatePayment', entityType: 'Payment', summary: 'Payment of 1200000 updated successfully' },
    ],
  }
}

function eachPeriod(from: string, to: string, granularity: DashboardGranularity): string[] {
  const out: string[] = []
  const [y, m, d] = from.split('-').map(Number)
  const cur = new Date(y, m - 1, granularity === 'Month' ? 1 : d)
  const p = (n: number) => String(n).padStart(2, '0')
  for (;;) {
    const ymd = `${cur.getFullYear()}-${p(cur.getMonth() + 1)}-${p(cur.getDate())}`
    if (ymd > to) break
    out.push(ymd)
    if (granularity === 'Month') cur.setMonth(cur.getMonth() + 1)
    else cur.setDate(cur.getDate() + 1)
  }
  return out
}

function mockCollections(p: DashboardRangeParams & { granularity: DashboardGranularity }): DashboardCollections {
  const trend = eachPeriod(p.fromDate, p.toDate, p.granularity).flatMap(day => {
    const days = p.granularity === 'Month' ? 22 : new Date(day).getDay() % 6 === 0 ? 0.2 : 1
    const ugx = Math.round((11_000_000 + rand(day) * 15_000_000) * days)
    const usd = Math.round((380 + rand(day + 'u') * 970) * days)
    return [
      { periodStart: `${day}T00:00:00`, currencyCode: 'UGX', net: ugx, netInBase: ugx },
      { periodStart: `${day}T00:00:00`, currencyCode: 'USD', net: usd, netInBase: usd * MOCK_USD_RATE },
    ]
  })
  const total = trend.reduce((s, t) => s + t.netInBase, 0)
  const share = (s: number) => Math.round(total * s)
  const ugxRow = (s: number) => ({ currencyCode: 'UGX', net: share(s), netInBase: share(s), receiptCount: Math.max(1, Math.round(share(s) / 620_000)) })
  return {
    fromDate: `${p.fromDate}T00:00:00`, toDate: `${p.toDate}T00:00:00`, baseCurrencyCode: 'UGX', hasMissingRates: false, trend,
    byCategory: [
      { category: 1, categoryName: 'Tuition', ...ugxRow(0.82) },
      { category: 2, categoryName: 'Other', ...ugxRow(0.15) },
      { category: 4, categoryName: 'Guild', ...ugxRow(0.02) },
      { category: 3, categoryName: 'NCHE', ...ugxRow(0.01) },
    ],
    byPayType: [
      { payType: 3, payTypeName: 'Bank', ...ugxRow(0.46) },
      { payType: 5, payTypeName: 'Online', ...ugxRow(0.29) },
      { payType: 1, payTypeName: 'Cash', ...ugxRow(0.22) },
      { payType: null, payTypeName: 'Unclassified', ...ugxRow(0.03) },
    ],
    topLedgers: ([['TF', 'Tuition Fee', 1, 0.71], ['RF', 'Registration Fee', 1, 0.17], ['AF', 'Admission Fee', 2, 0.06], ['RSF', 'Resit Exam Fee', 2, 0.025], ['RTF', 'Retake Fee', 2, 0.015], ['LF', 'Library Fee', 2, 0.01]] as const)
      .map(([code, name, category, s]) => ({ ledgerGuid: `mock-ledger-${code}`, ledgerCode: code, ledgerName: name, category, categoryName: category === 1 ? 'Tuition' : 'Other', currencyCode: 'UGX', gross: share(s), grossInBase: share(s) })),
    byUser: ([['Namusoke Joan', 0.31], ['Mutebi Allan', 0.26], ['Kansiime Ruth', 0.19], ['Walusimbi Henry', 0.15], ['Unknown user', 0.09]] as const)
      .map(([userName, s]) => ({ userName, ...ugxRow(s) })),
  }
}

function mockDiscounts(p: DashboardRangeParams): DashboardDiscounts {
  const days = eachPeriod(p.fromDate, p.toDate, 'Day').length
  const total = days * 1_480_000
  const tuition = total * 15
  const byType = ([['EARLY-10%', 0.41, 'UGX'], ['STAFF-50%', 0.23, 'UGX'], ['SIB.1 25%', 0.18, 'USD'], ['MERIT-20%', 0.12, 'UGX'], ['SPORTS-15%', 0.06, 'UGX']] as const)
    .map(([code, s, cur], i) => {
      const inBase = Math.round(total * s)
      return {
        discountGuid: `mock-disc-${i}`, discountCode: code, discountName: code,
        studentCount: Math.max(1, Math.round(inBase / 210_000)), lineCount: Math.max(1, Math.round(inBase / 190_000)),
        amountInBase: inBase, sharePercent: s * 100,
        amounts: cur === 'USD' ? [{ currencyCode: 'UGX', amount: Math.round(inBase / 2) }, { currencyCode: 'USD', amount: Math.round(inBase / 2 / MOCK_USD_RATE) }] : [{ currencyCode: 'UGX', amount: inBase }],
      }
    })
  return {
    fromDate: `${p.fromDate}T00:00:00`, toDate: `${p.toDate}T00:00:00`, baseCurrencyCode: 'UGX', hasMissingRates: false,
    discountedStudentCount: byType.reduce((s, t) => s + t.studentCount, 0),
    totalDiscountInBase: total, tuitionGrossInBase: tuition,
    percentOfTuitionGross: tuition > 0 ? Math.round((total / tuition) * 1000) / 10 : null,
    byCurrency: [{ currencyCode: 'UGX', discount: total, tuitionGross: tuition, percentOfTuitionGross: tuition > 0 ? Math.round((total / tuition) * 1000) / 10 : null }],
    byType,
  }
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
  if (MOCK_AUTH) return mockDelay(mockSummary(p), 400)
  return apiGet<DashboardSummary>(`/api/v1/finance/dashboard/summary?${rangeParams(p).toString()}`)
}

// GET /finance/dashboard/outstanding. Cached 5 min per intake and topCount;
// the first call can take a few seconds.
export function getDashboardOutstanding(intakeGuid: string, topCount = 10): Promise<DashboardOutstanding> {
  if (MOCK_AUTH) return mockDelay({ ...MOCK_OUTSTANDING, generatedAt: mockNow() }, 1400)
  const params = new URLSearchParams({ intakeGuid, topCount: String(topCount) })
  return apiGet<DashboardOutstanding>(`/api/v1/finance/dashboard/outstanding?${params.toString()}`)
}

// GET /finance/dashboard/collection-by-fee-type. Cached 5 min per intake.
export function getDashboardCollectionByFeeType(intakeGuid: string): Promise<DashboardCollectionByFeeType> {
  if (MOCK_AUTH) return mockDelay({ ...MOCK_FEE_TYPES, generatedAt: mockNow() }, 1100)
  return apiGet<DashboardCollectionByFeeType>(`/api/v1/finance/dashboard/collection-by-fee-type?${new URLSearchParams({ intakeGuid }).toString()}`)
}

// GET /finance/dashboard/recent-payments. No date = today on the server.
export function getDashboardRecentPayments(intakeGuid: string, limit = 20): Promise<DashboardRecentPayments> {
  if (MOCK_AUTH) {
    return mockDelay({ date: `${mockNow().slice(0, 10)}T00:00:00`, baseCurrencyCode: 'UGX', hasMissingRates: false, totalCount: 37, items: MOCK_RECENT_ITEMS.slice(0, limit) }, 600)
  }
  const params = new URLSearchParams({ intakeGuid, limit: String(limit) })
  return apiGet<DashboardRecentPayments>(`/api/v1/finance/dashboard/recent-payments?${params.toString()}`)
}

// GET /finance/dashboard/attention. Not intake-specific.
export function getDashboardAttention(changeDays = 7): Promise<DashboardAttention> {
  if (MOCK_AUTH) return mockDelay(mockAttention(), 500)
  return apiGet<DashboardAttention>(`/api/v1/finance/dashboard/attention?${new URLSearchParams({ changeDays: String(changeDays) }).toString()}`)
}

// GET /finance/dashboard/collections. One call fills the whole trends area.
export function getDashboardCollections(p: DashboardRangeParams & { granularity: DashboardGranularity }): Promise<DashboardCollections> {
  if (MOCK_AUTH) return mockDelay(mockCollections(p), 700)
  const params = rangeParams(p)
  params.set('granularity', p.granularity)
  return apiGet<DashboardCollections>(`/api/v1/finance/dashboard/collections?${params.toString()}`)
}

// GET /finance/dashboard/discounts. totalDiscountInBase equals the summary's
// currentInBase.discount for the same range.
export function getDashboardDiscounts(p: DashboardRangeParams): Promise<DashboardDiscounts> {
  if (MOCK_AUTH) return mockDelay(mockDiscounts(p), 600)
  return apiGet<DashboardDiscounts>(`/api/v1/finance/dashboard/discounts?${rangeParams(p).toString()}`)
}
