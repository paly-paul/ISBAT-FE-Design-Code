import { apiGet, apiPostWithMessage } from '../client'
import { mockQueueReportJob, normalizeReportJob, type ReportJob } from './discountReport'

const MOCK_AUTH = process.env.NEXT_PUBLIC_AUTH_MOCK === 'true'

// Transaction Report (erp-docs/pages/finance/transaction-report-page.md).
// Docs: finance-service/reports/get-transaction-report-preview.md and
// post-transaction-report-export.md. Report jobs / Downloads are shared with
// the Discount Report (see discountReport.ts and lib/reportDownloads.ts).

// ── Filters ────────────────────────────────────────────────────────────────

// Every field optional; empty means "everything". Saved on Process and reused
// for every later page and the export.
export interface TransactionReportFilters {
  fromDate?: string            // yyyy-mm-dd
  toDate?: string              // yyyy-mm-dd, inclusive of the whole day
  intakeGuid?: string
  applicationGuid?: string     // one student, from vetted-registered-search
  receiptBookGuids?: string[]  // max 50; hides refunds (they have no receipt)
  // Two ledger lists, each narrowing only its own kind of row. Any ledger
  // hides advance deposits; fee ledgers alone hide other payments and other
  // ledgers alone hide fee payments.
  ledgerGuids?: string[]       // fee ledgers, max 20; the Discount ledger (DA) is ignored
  otherLedgerGuids?: string[]  // other ledgers (ledger-others/dropdown), max 20
  // Follow the student's CURRENT record, and leave out payments by anyone
  // without a student record.
  campusGuid?: string
  batchGuids?: string[]        // max 50
  sponsorCategoryGuid?: string
  // Fee rows follow the semester the fee was paid for; other sources follow
  // the student's current programme. Semesters show semester fees only.
  programGuid?: string
  semesterGuids?: string[]     // max 20
  payTypes?: number[]          // 1 Cash, 2 Cheque, 3 Bank, 4 DemandDraft, 5 Online; hides refunds
}

// GET /finance/enums/payment-types. `name` is the raw enum member.
export interface PaymentTypeOption { value: number; name: string }

export function getFinancePaymentTypes(): Promise<PaymentTypeOption[]> {
  if (MOCK_AUTH) return Promise.resolve([{ value: 1, name: 'Cash' }, { value: 2, name: 'Cheque' }, { value: 3, name: 'Bank' }, { value: 4, name: 'DemandDraft' }, { value: 5, name: 'Online' }])
  return apiGet<PaymentTypeOption[] | null>('/api/v1/finance/enums/payment-types').then(data => data ?? [])
}

export const TRANSACTION_REPORT_MAX_RECEIPT_BOOKS = 50
export const TRANSACTION_REPORT_MAX_LEDGERS = 20
export const TRANSACTION_REPORT_MAX_OTHER_LEDGERS = 20
export const TRANSACTION_REPORT_PAGE_SIZE = 15

// Row sources. Advance adjustments are shown but never counted (the money was
// counted when it was deposited); refunds are negative.
export const TXN_SOURCE = { DirectPayment: 1, AdvanceAdjustment: 2, AdvanceDeposit: 3, OtherPayment: 4, Refund: 5 } as const
// The Discount ledger: discount is a column, never a row, so it isn't offered
// as a filter (selecting only it returns nothing).
export const DISCOUNT_LEDGER_CODE = 'DA'

// ── Preview ────────────────────────────────────────────────────────────────

export interface TransactionReportRow {
  payDate: string          // calendar date, time always 00:00:00; no TZ conversion
  receipt: string | null       // null on refunds
  receiptBook: string | null   // null on refunds
  studentNumber: string    // reg no when registered, else AppRefNo
  studentName: string
  // The row's semester; null on deposits, other payments and refunds.
  programName: string | null
  semesterName: string | null
  semCode: number | null
  ledgerCode: string | null    // null on deposits ("Advance Deposit") and refunds without a ledger
  ledgerName: string
  source: { value: number; name: string }   // 1 Direct, 2 AdvanceAdjustment, 3 AdvanceDeposit, 4 OtherPayment, 5 Refund
  payMode: { value: number; name: string } | null  // null on refunds
  currencyCode: string
  amount: number           // negative on refunds
  discount: number         // 0 when none; fee payments only
  net: number              // amount − discount; not counted on advance adjustments
}

export interface TransactionReportCurrencyTotal {
  currencyCode: string
  rowCount: number
  receiptCount: number
  studentCount: number
  gross: number            // fee payments + other payments + advance deposits
  discount: number
  unallocatedDiscount: number
  refunded: number         // negative, or 0
  settledFromAdvance: number // advance adjustments; NOT part of net
  net: number              // gross − discount − unallocatedDiscount + refunded
}

export interface TransactionReportSummary {
  totalRows: number
  // Distinct across all rows; never add up byCurrency's counts.
  totalReceipts: number
  totalStudents: number
  byCurrency: TransactionReportCurrencyTotal[]
}

export interface TransactionReportPreview {
  summary: TransactionReportSummary | null   // null when includeSummary=false
  rows: { items: TransactionReportRow[]; totalCount: number; pageNumber: number; pageSize: number }
}

// ── Mocks ──────────────────────────────────────────────────────────────────

const MOCK_NAMES = ['Amina Nakato', 'James Okello', 'Grace Nampijja', 'Brian Kamya', 'Esther Tumukunde', 'Peter Ssemwogerere']
const MOCK_PROGS = ['BSc Computer Science - S22', 'MBA Business Administration', 'BBA Accounting', 'Diploma in Nursing']
const MOCK_LEDGERS = [
  { ledgerCode: 'TF', ledgerName: 'Tuition Fee', base: 3000000 },
  { ledgerCode: 'RR', ledgerName: 'Semester Entry Fee', base: 730121 },
  { ledgerCode: 'GF', ledgerName: 'Graduation Fee', base: 250000 },
]
const MOCK_ROWS: TransactionReportRow[] = Array.from({ length: 72 }, (_, i) => {
  const receiptIdx = Math.floor(i / 3)
  const ledger = MOCK_LEDGERS[i % 3]
  const usd = receiptIdx % 8 === 0
  const day = new Date(Date.UTC(2026, 8, 30 - Math.floor(receiptIdx / 2)))
  const amount = usd ? Math.round(ledger.base / 3700) : ledger.base
  const discount = ledger.ledgerCode === 'TF' && receiptIdx % 3 === 0 ? Math.round(amount * 0.3) : 0
  const sem = (receiptIdx % 6) + 1
  return {
    payDate: `${day.toISOString().slice(0, 10)}T00:00:00`,
    receipt: String(142700 - receiptIdx),
    receiptBook: receiptIdx % 4 === 0 ? 'MCB34' : 'CASH01',
    studentNumber: `0112504${String(10 + (receiptIdx % 30)).padStart(2, '0')}`,
    studentName: MOCK_NAMES[receiptIdx % MOCK_NAMES.length],
    programName: MOCK_PROGS[receiptIdx % MOCK_PROGS.length],
    semesterName: `Semester ${sem}`,
    semCode: sem,
    ledgerCode: ledger.ledgerCode,
    ledgerName: ledger.ledgerName,
    source: receiptIdx % 5 === 0 ? { value: 2, name: 'AdvanceAdjustment' } : { value: 1, name: 'DirectPayment' },
    payMode: [{ value: 1, name: 'Cash' }, { value: 3, name: 'Bank' }, { value: 5, name: 'Online' }][receiptIdx % 3],
    currencyCode: usd ? 'USD' : 'UGX',
    amount,
    discount,
    net: amount - discount,
  }
})

// A few rows of the other sources, so every kind shows in mock mode.
const MOCK_EXTRA: TransactionReportRow[] = [
  { payDate: '2026-09-29T00:00:00', receipt: '142990', receiptBook: 'MCB34', studentNumber: '011250412', studentName: 'Grace Nampijja', programName: null, semesterName: null, semCode: null, ledgerCode: null, ledgerName: 'Advance Deposit', source: { value: 3, name: 'AdvanceDeposit' }, payMode: { value: 3, name: 'Bank' }, currencyCode: 'UGX', amount: 1000000, discount: 0, net: 1000000 },
  { payDate: '2026-09-28T00:00:00', receipt: '142950', receiptBook: 'OTH02', studentNumber: '011250415', studentName: 'Brian Kamya', programName: null, semesterName: null, semCode: null, ledgerCode: 'HST', ledgerName: 'Hostel Fee', source: { value: 4, name: 'OtherPayment' }, payMode: { value: 1, name: 'Cash' }, currencyCode: 'UGX', amount: 400000, discount: 0, net: 400000 },
  { payDate: '2026-09-27T00:00:00', receipt: null, receiptBook: null, studentNumber: '011250411', studentName: 'James Okello', programName: null, semesterName: null, semCode: null, ledgerCode: 'TF', ledgerName: 'Tuition Fee', source: { value: 5, name: 'Refund' }, payMode: null, currencyCode: 'UGX', amount: -500000, discount: 0, net: -500000 },
  { payDate: '2026-09-26T00:00:00', receipt: null, receiptBook: null, studentNumber: '011250414', studentName: 'Esther Tumukunde', programName: null, semesterName: null, semCode: null, ledgerCode: null, ledgerName: 'Refund (no ledger)', source: { value: 5, name: 'Refund' }, payMode: null, currencyCode: 'UGX', amount: -120000, discount: 0, net: -120000 },
]
const ALL_MOCK_ROWS = [...MOCK_ROWS, ...MOCK_EXTRA].sort((a, b) => b.payDate.localeCompare(a.payDate))

function mockFilter(f: TransactionReportFilters): TransactionReportRow[] {
  return ALL_MOCK_ROWS.filter(r =>
    (!f.fromDate || r.payDate.slice(0, 10) >= f.fromDate)
    && (!f.toDate || r.payDate.slice(0, 10) <= f.toDate)
    && (!f.payTypes?.length || (r.payMode !== null && f.payTypes.includes(r.payMode.value))))
}

// Same rules as the server: advance adjustments only in settledFromAdvance,
// refunds only in refunded (negative), net = gross − discount + refunded.
function mockSummary(rows: TransactionReportRow[]): TransactionReportSummary {
  const currencies = [...new Set(rows.map(r => r.currencyCode))].sort()
  const isAdj = (r: TransactionReportRow) => r.source.value === TXN_SOURCE.AdvanceAdjustment
  const isRefund = (r: TransactionReportRow) => r.source.value === TXN_SOURCE.Refund
  return {
    totalRows: rows.length,
    totalReceipts: new Set(rows.filter(r => r.receipt).map(r => r.receipt)).size,
    totalStudents: new Set(rows.map(r => r.studentNumber)).size,
    byCurrency: currencies.map(code => {
      const inCur = rows.filter(r => r.currencyCode === code)
      const counted = inCur.filter(r => !isAdj(r) && !isRefund(r))
      const gross = counted.reduce((s, r) => s + r.amount, 0)
      const discount = counted.reduce((s, r) => s + r.discount, 0)
      const refunded = inCur.filter(isRefund).reduce((s, r) => s + r.amount, 0)
      const settledFromAdvance = inCur.filter(isAdj).reduce((s, r) => s + r.amount, 0)
      return {
        currencyCode: code, rowCount: inCur.length,
        receiptCount: new Set(inCur.filter(r => r.receipt).map(r => r.receipt)).size,
        studentCount: new Set(inCur.map(r => r.studentNumber)).size,
        gross, discount, unallocatedDiscount: 0, refunded, settledFromAdvance, net: gross - discount + refunded,
      }
    }),
  }
}

// ── Endpoints ──────────────────────────────────────────────────────────────

// GET /finance/reports/transaction/preview. Page 1 with the summary; every
// later page passes includeSummary=false (summary comes back null). Arrays are
// repeated keys: ?receiptBookGuids=a&receiptBookGuids=b.
export function getTransactionReportPreview(filters: TransactionReportFilters, pageNumber: number, pageSize = TRANSACTION_REPORT_PAGE_SIZE): Promise<TransactionReportPreview> {
  const includeSummary = pageNumber === 1
  if (MOCK_AUTH) {
    const rows = mockFilter(filters)
    const start = (pageNumber - 1) * pageSize
    return new Promise(resolve => setTimeout(() => resolve({
      summary: includeSummary ? mockSummary(rows) : null,
      rows: { items: rows.slice(start, start + pageSize), totalCount: rows.length, pageNumber, pageSize },
    }), 450))
  }
  const params = new URLSearchParams({ pageNumber: String(pageNumber), pageSize: String(pageSize) })
  if (!includeSummary) params.set('includeSummary', 'false')
  if (filters.fromDate) params.set('fromDate', filters.fromDate)
  if (filters.toDate) params.set('toDate', filters.toDate)
  if (filters.intakeGuid) params.set('intakeGuid', filters.intakeGuid)
  if (filters.applicationGuid) params.set('applicationGuid', filters.applicationGuid)
  filters.receiptBookGuids?.forEach(g => params.append('receiptBookGuids', g))
  filters.ledgerGuids?.forEach(g => params.append('ledgerGuids', g))
  filters.otherLedgerGuids?.forEach(g => params.append('otherLedgerGuids', g))
  if (filters.campusGuid) params.set('campusGuid', filters.campusGuid)
  if (filters.programGuid) params.set('programGuid', filters.programGuid)
  filters.semesterGuids?.forEach(g => params.append('semesterGuids', g))
  filters.batchGuids?.forEach(g => params.append('batchGuids', g))
  if (filters.sponsorCategoryGuid) params.set('sponsorCategoryGuid', filters.sponsorCategoryGuid)
  filters.payTypes?.forEach(t => params.append('payTypes', String(t)))
  return apiGet<TransactionReportPreview>(`/api/v1/finance/reports/transaction/preview?${params.toString()}`)
}

// POST /finance/reports/transaction/export (202). The SAVED filters from
// Process (the same ones the preview used), as JSON with every list filter as
// an array. An identical export already running comes back as that same job.
export function exportTransactionReport(filters: TransactionReportFilters): Promise<{ job: ReportJob; message: string | null }> {
  if (MOCK_AUTH) {
    return Promise.resolve({ job: mockQueueReportJob('TRANSACTION', 'Transaction Report'), message: 'Export started. You will be notified when it is ready to download.' })
  }
  const body = {
    fromDate: filters.fromDate ?? null,
    toDate: filters.toDate ?? null,
    intakeGuid: filters.intakeGuid ?? null,
    applicationGuid: filters.applicationGuid ?? null,
    receiptBookGuids: filters.receiptBookGuids ?? [],
    ledgerGuids: filters.ledgerGuids ?? [],
    otherLedgerGuids: filters.otherLedgerGuids ?? [],
    payTypes: filters.payTypes ?? [],
    campusGuid: filters.campusGuid ?? null,
    programGuid: filters.programGuid ?? null,
    semesterGuids: filters.semesterGuids ?? [],
    batchGuids: filters.batchGuids ?? [],
    sponsorCategoryGuid: filters.sponsorCategoryGuid ?? null,
  }
  return apiPostWithMessage<Parameters<typeof normalizeReportJob>[0]>('/api/v1/finance/reports/transaction/export', body)
    .then(({ data, message }) => ({ job: normalizeReportJob(data), message }))
}
