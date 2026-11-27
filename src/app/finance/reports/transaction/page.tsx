'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { ScrollTable } from '@/components/ScrollTable'
import { SearchSelect } from '@/components/SearchSelect'
import { MultiSelect } from '@/components/MultiSelect'
import DatePicker from '@/components/DatePicker'
import { ReportExportControls } from '@/components/finance/ReportExportControls'
import { ReportCurrencySummary } from '@/components/finance/ReportCurrencySummary'
import { useIntakesDropdown } from '@/hooks/academic/useIntakes'
import { REPORT_MAX_BATCHES, REPORT_MAX_SEMESTERS, useReportScopeOptions } from '@/hooks/finance/useReportScopeOptions'
import { scrollToFirstError } from '@/lib/scrollToFirstError'
import { getReceiptBookDropdown } from '@/lib/api/finance/receiptBook'
import { useLedgers } from '@/hooks/finance/useLedgers'
import { searchVettedRegisteredApplications } from '@/lib/api/admission/applicationFiling'
import {
  DISCOUNT_LEDGER_CODE, TRANSACTION_REPORT_MAX_LEDGERS, TRANSACTION_REPORT_MAX_OTHER_LEDGERS, TRANSACTION_REPORT_MAX_RECEIPT_BOOKS, TXN_SOURCE,
  TransactionReportFilters, TransactionReportRow, exportTransactionReport, getFinancePaymentTypes, getTransactionReportPreview,
} from '@/lib/api/finance/transactionReport'
import { getLedgerOthersDropdown } from '@/lib/api/finance/ledgerOthersMaster'
import {
  REPORT_PAYMODE_LABEL, REPORT_SOURCE_LABEL, fmtReportAmount, fmtReportCount, fmtReportDate, reportChipValue, reportErrorMessage,
} from '@/lib/reportFormat'

// Transaction Report — erp-docs/pages/finance/transaction-report-page.md.
// Works like the Discount Report: Process → page 1 (summary + 15 rows) →
// infinite scroll (includeSummary=false) → Export to Excel in the background,
// delivered through the shared Downloads list. Rows come from five sources:
// fee payments, advance adjustments (shown, never counted), advance deposits,
// other payments and refunds (negative).

// The Ledgers multi-select holds both kinds; a prefix tells them apart.
const FEE_PREFIX = 'fee:'
const OTHER_PREFIX = 'oth:'

const ADJUSTMENT_TIP = 'Paid from an advance deposit. Already counted when it was deposited.'

// Badge per source (Direct, Adjustment, Deposit, Other, Refund).
const SOURCE_BADGE: Record<number, string> = {
  [TXN_SOURCE.DirectPayment]: 'badge-grey',
  [TXN_SOURCE.AdvanceAdjustment]: 'badge-amber',
  [TXN_SOURCE.AdvanceDeposit]: 'badge-blue',
  [TXN_SOURCE.OtherPayment]: 'badge-purple',
  [TXN_SOURCE.Refund]: 'badge-red',
}

// "—" for cells a source doesn't have (receipt, programme, pay mode…).
const dash = (v: string | number | null | undefined) => (v === null || v === undefined || v === '' ? '—' : v)
// Amounts with a real minus sign, so refunds read as negative.
const fmtSigned = (n: number) => (n < 0 ? `−${fmtReportAmount(Math.abs(n))}` : fmtReportAmount(n))

interface FormState {
  fromDate: string
  toDate: string
  intakeGuid: string
  applicationGuid: string
  receiptBookGuids: string[]
  ledgerGuids: string[]
  otherLedgerGuids: string[]
  campusGuid: string
  programGuid: string
  semesterGuids: string[]
  batchGuids: string[]
  sponsorCategoryGuid: string
  payTypes: string[]         // MultiSelect values; sent as numbers
  showCancelled: boolean
}
const EMPTY_FORM: FormState = {
  fromDate: '', toDate: '', intakeGuid: '', applicationGuid: '', receiptBookGuids: [], ledgerGuids: [], otherLedgerGuids: [],
  // Show cancelled starts ticked; the cashier can untick it.
  campusGuid: '', programGuid: '', semesterGuids: [], batchGuids: [], sponsorCategoryGuid: '', payTypes: [], showCancelled: true,
}

// The student picker's search runs from 2 characters (vetted-registered-search
// rejects 1), debounced.
const STUDENT_MIN_CHARS = 2

function toFilters(f: FormState): TransactionReportFilters {
  return {
    fromDate: f.fromDate || undefined,
    toDate: f.toDate || undefined,
    intakeGuid: f.intakeGuid || undefined,
    applicationGuid: f.applicationGuid || undefined,
    receiptBookGuids: f.receiptBookGuids.length ? f.receiptBookGuids : undefined,
    ledgerGuids: f.ledgerGuids.length ? f.ledgerGuids : undefined,
    otherLedgerGuids: f.otherLedgerGuids.length ? f.otherLedgerGuids : undefined,
    campusGuid: f.campusGuid || undefined,
    // Known backend limitation (page doc): a programme filter currently hides
    // every fee row, and programme + semesters returns nothing. When semesters
    // are chosen, send only them — the programme was just there to list them.
    programGuid: f.programGuid && !f.semesterGuids.length ? f.programGuid : undefined,
    semesterGuids: f.semesterGuids.length ? f.semesterGuids : undefined,
    batchGuids: f.batchGuids.length ? f.batchGuids : undefined,
    sponsorCategoryGuid: f.sponsorCategoryGuid || undefined,
    payTypes: f.payTypes.length ? f.payTypes.map(Number).sort() : undefined,
    // Sent on the step 2 preview and the export when ticked; the API layer
    // leaves it off the infinite-scroll page calls.
    showCancelled: f.showCancelled || undefined,
  }
}

export default function TransactionReportPage() {
  // ── Filters ─────────────────────────────────────────────────────────────
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const [filtersOpen, setFiltersOpen] = useState(true)
  function setField<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm(prev => ({ ...prev, [k]: v }))
    setErrors(prev => (prev[k] ? { ...prev, [k]: '' } : prev))
  }

  // Finance Dashboard's "View all" opens this as ?date=yyyy-MM-dd: fill both
  // dates with that day. Read from window, not useSearchParams, so the
  // static export doesn't need a Suspense boundary.
  useEffect(() => {
    const date = new URLSearchParams(window.location.search).get('date')
    if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) setForm(prev => ({ ...prev, fromDate: date, toDate: date }))
  }, [])

  // Step 1: the dropdowns load in parallel on page open.
  const intakesQuery = useIntakesDropdown()
  const booksQuery = useQuery({ queryKey: ['finance', 'receipt-books', 'dropdown', 'all'], queryFn: () => getReceiptBookDropdown(true) })
  const ledgersQuery = useLedgers()
  const otherLedgersQuery = useQuery({ queryKey: ['finance', 'ledger-others', 'dropdown'], queryFn: () => getLedgerOthersDropdown() })
  const payTypesQuery = useQuery({ queryKey: ['finance', 'enums', 'payment-types'], queryFn: getFinancePaymentTypes })
  const {
    campusesQuery, sponsorsQuery, programsQuery, semestersQuery, batchesQuery,
    campusOptions, programOptions, semesterOptions, batchOptions, sponsorOptions,
  } = useReportScopeOptions(form.campusGuid, form.programGuid, form.semesterGuids)

  const intakeOptions = useMemo(() => (intakesQuery.data ?? []).map(i => ({ value: i.intakeGuid, label: `${i.intakeCode} — ${i.description}` })), [intakesQuery.data])
  // Used-up books are kept (most past receipts came from them), labelled.
  const bookOptions = useMemo(() => (booksQuery.data ?? []).map(b => ({ value: b.receiptBookGuid, label: b.isActive ? b.bookCode : `${b.bookCode} (used)` })), [booksQuery.data])
  // The Discount ledger is left out: discount is a column, not a row.
  const ledgerOptions = useMemo(() => (ledgersQuery.data ?? [])
    .filter(l => l.ledgerCode.trim().toUpperCase() !== DISCOUNT_LEDGER_CODE)
    .map(l => ({ value: l.ledgerGuid, label: `${l.ledgerCode} - ${l.ledgerName}` })), [ledgersQuery.data])
  const otherLedgerOptions = useMemo(() => (otherLedgersQuery.data ?? [])
    .map(l => ({ value: l.ledgerOthersGuid, label: l.ledgerCode ? `${l.ledgerCode} - ${l.ledgerName}` : l.ledgerName })), [otherLedgersQuery.data])
  // One Ledgers field with two groups; values carry a prefix so the pick can
  // be split back into ledgerGuids and otherLedgerGuids.
  const groupedLedgerOptions = useMemo(() => [
    ...ledgerOptions.map(o => ({ value: FEE_PREFIX + o.value, label: o.label, group: 'Fee ledgers' })),
    ...otherLedgerOptions.map(o => ({ value: OTHER_PREFIX + o.value, label: o.label, group: 'Other ledgers' })),
  ], [ledgerOptions, otherLedgerOptions])
  const groupedLedgerValue = [...form.ledgerGuids.map(g => FEE_PREFIX + g), ...form.otherLedgerGuids.map(g => OTHER_PREFIX + g)]
  function pickLedgers(vals: string[]) {
    setForm(prev => ({
      ...prev,
      ledgerGuids: vals.filter(v => v.startsWith(FEE_PREFIX)).map(v => v.slice(FEE_PREFIX.length)),
      otherLedgerGuids: vals.filter(v => v.startsWith(OTHER_PREFIX)).map(v => v.slice(OTHER_PREFIX.length)),
    }))
    setErrors(prev => ({ ...prev, ledgerGuids: '', otherLedgerGuids: '' }))
  }

  const payTypeOptions = useMemo(() => (payTypesQuery.data ?? []).map(t => ({ value: String(t.value), label: REPORT_PAYMODE_LABEL[t.value] ?? t.name })), [payTypesQuery.data])

  // Changing a level clears what depends on it. Batches stay when the semesters
  // change, until the refreshed list shows which ones no longer apply.
  function pickCampus(v: string) {
    setForm(prev => ({ ...prev, campusGuid: v, programGuid: '', semesterGuids: [], batchGuids: [] }))
    setErrors(prev => ({ ...prev, semesterGuids: '', batchGuids: '' }))
  }
  function pickProgram(v: string) {
    setForm(prev => ({ ...prev, programGuid: v, semesterGuids: [], batchGuids: [] }))
    setErrors(prev => ({ ...prev, semesterGuids: '', batchGuids: '' }))
  }
  function pickSemesters(v: string[]) {
    setForm(prev => ({ ...prev, semesterGuids: v, batchGuids: v.length ? prev.batchGuids : [] }))
    setErrors(prev => ({ ...prev, semesterGuids: '', batchGuids: v.length ? prev.batchGuids : '' }))
  }
  useEffect(() => {
    if (!batchesQuery.data) return
    const listed = new Set(batchesQuery.data.map(b => b.batchGuid))
    setForm(prev => (prev.batchGuids.every(g => listed.has(g)) ? prev : { ...prev, batchGuids: prev.batchGuids.filter(g => listed.has(g)) }))
  }, [batchesQuery.data])

  // Student typeahead (one student; clearing it means all students). The
  // chosen option is kept so its label survives a new search.
  const [studentSearch, setStudentSearch] = useState('')
  const [debouncedStudentSearch, setDebouncedStudentSearch] = useState('')
  useEffect(() => { const t = setTimeout(() => setDebouncedStudentSearch(studentSearch.trim()), 300); return () => clearTimeout(t) }, [studentSearch])
  const studentsQuery = useQuery({
    queryKey: ['admissions', 'vetted-registered-search', debouncedStudentSearch],
    queryFn: () => searchVettedRegisteredApplications(debouncedStudentSearch, 1, 20),
    enabled: debouncedStudentSearch.length >= STUDENT_MIN_CHARS,
  })
  const [chosenStudent, setChosenStudent] = useState<{ value: string; label: string } | null>(null)
  const studentOptions = useMemo(() => {
    const found = (studentsQuery.data?.items ?? []).map(a => ({
      value: a.applicationGuid,
      label: `${[a.firstName, a.lastName].filter(Boolean).join(' ') || 'Unnamed'} (${a.appRefNo})`,
    }))
    return chosenStudent && !found.some(o => o.value === chosenStudent.value) ? [chosenStudent, ...found] : found
  }, [studentsQuery.data, chosenStudent])
  function pickStudent(guid: string) {
    setChosenStudent(guid ? studentOptions.find(o => o.value === guid) ?? null : null)
    setField('applicationGuid', guid)
  }

  // ── Process: the saved copy of the filters ──────────────────────────────
  // Every later page and the export reuse THIS, not the live form.
  const [saved, setSaved] = useState<TransactionReportFilters | null>(null)
  const [savedStudentLabel, setSavedStudentLabel] = useState<string | null>(null)
  // Bumped on every Process so pressing it again still fetches fresh rows.
  const [runId, setRunId] = useState(0)

  function validate(): boolean {
    const e: Partial<Record<keyof FormState, string>> = {}
    if (form.fromDate && form.toDate && form.fromDate > form.toDate) e.toDate = 'To date can’t be before the from date'
    if (form.receiptBookGuids.length > TRANSACTION_REPORT_MAX_RECEIPT_BOOKS) e.receiptBookGuids = `Select at most ${TRANSACTION_REPORT_MAX_RECEIPT_BOOKS} receipt books (now ${form.receiptBookGuids.length})`
    if (form.ledgerGuids.length > TRANSACTION_REPORT_MAX_LEDGERS) e.ledgerGuids = `Select at most ${TRANSACTION_REPORT_MAX_LEDGERS} fee ledgers (now ${form.ledgerGuids.length})`
    else if (form.otherLedgerGuids.length > TRANSACTION_REPORT_MAX_OTHER_LEDGERS) e.ledgerGuids = `Select at most ${TRANSACTION_REPORT_MAX_OTHER_LEDGERS} other ledgers (now ${form.otherLedgerGuids.length})`
    if (form.semesterGuids.length > REPORT_MAX_SEMESTERS) e.semesterGuids = `Select at most ${REPORT_MAX_SEMESTERS} semesters (now ${form.semesterGuids.length})`
    if (form.batchGuids.length > REPORT_MAX_BATCHES) e.batchGuids = `Select at most ${REPORT_MAX_BATCHES} batches (now ${form.batchGuids.length})`
    setErrors(e)
    if (Object.keys(e).length) { scrollToFirstError(e); return false }
    return true
  }

  function handleProcess() {
    if (!validate()) return
    setSaved(toFilters(form))
    setSavedStudentLabel(chosenStudent?.label ?? null)
    setRunId(r => r + 1)
    setFiltersOpen(false)
  }

  function handleReset() { setForm(EMPTY_FORM); setErrors({}); setChosenStudent(null); setStudentSearch('') }

  // ── Preview: page 1 with summary, then infinite scroll ──────────────────
  const preview = useInfiniteQuery({
    queryKey: ['finance', 'transaction-report', runId, saved],
    queryFn: ({ pageParam }) => getTransactionReportPreview(saved as TransactionReportFilters, pageParam),
    initialPageParam: 1,
    getNextPageParam: (last, all) => {
      const loaded = all.reduce((n, p) => n + p.rows.items.length, 0)
      return loaded < last.rows.totalCount && last.rows.items.length > 0 ? all.length + 1 : undefined
    },
    enabled: !!saved,
    gcTime: 0,
  })

  const pages = preview.data?.pages ?? []
  const rows: TransactionReportRow[] = useMemo(() => pages.flatMap(p => p.rows.items), [pages])
  // Summary comes from the page-1 response only and stays while scrolling.
  const summary = pages[0]?.summary ?? null
  const totalCount = pages[0]?.rows.totalCount ?? 0
  const hasResult = pages.length > 0
  const isEmpty = hasResult && totalCount === 0
  // Cancelled payments (showCancelled), from page 1 only. Never in any total.
  const cancelledRows = pages[0]?.cancelledRows ?? null
  const firstPageFailed = preview.isError && !hasResult
  const nextPageFailed = preview.isFetchNextPageError

  // Load the next page as the sentinel row nears the bottom of the scroll box —
  // never while a request is running, never automatically after a failure.
  const sentinelRef = useRef<HTMLTableRowElement>(null)
  useEffect(() => {
    const el = sentinelRef.current
    const root = el?.closest('.tbl-wrap')
    if (!el || !root) return
    const io = new IntersectionObserver(entries => {
      if (entries[0]?.isIntersecting && preview.hasNextPage && !preview.isFetching && !preview.isFetchNextPageError) {
        preview.fetchNextPage()
      }
    }, { root, rootMargin: '240px 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [preview.hasNextPage, preview.isFetching, preview.isFetchNextPageError, preview.fetchNextPage, rows.length])

  // Recap chips for the filters the CURRENT result was built from.
  const recap = useMemo(() => {
    if (!saved) return []
    const chips: { label: string; value: string }[] = []
    if (saved.fromDate || saved.toDate) {
      chips.push({ label: 'Dates', value: `${saved.fromDate ? fmtReportDate(saved.fromDate) : 'Start'} – ${saved.toDate ? fmtReportDate(saved.toDate) : 'Today'}` })
    }
    if (saved.intakeGuid) chips.push({ label: 'Intake', value: intakeOptions.find(o => o.value === saved.intakeGuid)?.label ?? 'Selected' })
    if (saved.applicationGuid) chips.push({ label: 'Student', value: savedStudentLabel ?? 'Selected' })
    if (saved.receiptBookGuids?.length) {
      chips.push({ label: 'Receipt books', value: saved.receiptBookGuids.length === 1 ? (bookOptions.find(o => o.value === saved.receiptBookGuids![0])?.label ?? '1 selected') : `${saved.receiptBookGuids.length} selected` })
    }
    if (saved.ledgerGuids?.length) chips.push({ label: 'Fee ledgers', value: reportChipValue(ledgerOptions, saved.ledgerGuids, 'selected') })
    if (saved.otherLedgerGuids?.length) chips.push({ label: 'Other ledgers', value: reportChipValue(otherLedgerOptions, saved.otherLedgerGuids, 'selected') })
    if (saved.campusGuid) chips.push({ label: 'Campus', value: reportChipValue(campusOptions, [saved.campusGuid], 'campuses') })
    if (saved.programGuid) chips.push({ label: 'Programme', value: reportChipValue(programOptions, [saved.programGuid], 'programmes') })
    if (saved.semesterGuids?.length) chips.push({ label: 'Semesters', value: reportChipValue(semesterOptions, saved.semesterGuids, 'semesters') })
    if (saved.batchGuids?.length) chips.push({ label: 'Batches', value: reportChipValue(batchOptions, saved.batchGuids, 'batches') })
    if (saved.sponsorCategoryGuid) chips.push({ label: 'Sponsor', value: reportChipValue(sponsorOptions, [saved.sponsorCategoryGuid], 'sponsors') })
    if (saved.payTypes?.length) chips.push({ label: 'Payment types', value: saved.payTypes.map(t => payTypeOptions.find(o => o.value === String(t))?.label ?? t).join(', ') })
    return chips
  }, [saved, savedStudentLabel, intakeOptions, bookOptions, ledgerOptions, otherLedgerOptions, campusOptions, programOptions, semesterOptions, batchOptions, sponsorOptions, payTypeOptions])

  const COLS = 14

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="page active">
      <div className="pg-hdr">
        <div>
          <div className="pg-title">Transaction Report</div>
          <div className="pg-sub">Fee payments, advance deposits, other payments and refunds · with discounts, net amounts and totals per currency</div>
        </div>
      </div>

      {/* Filters */}
      <div className="card" id="rpt-filters">
        {filtersOpen ? (
          <>
            <div className="rpt-filter-grid">
              <div className="fg m-0">
                <label className="lbl">From date</label>
                <DatePicker value={form.fromDate} onChange={v => setField('fromDate', v)} maxYmd={form.toDate || undefined} rangeMessage="From date can’t be after the to date" />
              </div>
              <div className="fg m-0">
                <label className="lbl">To date</label>
                <DatePicker value={form.toDate} onChange={v => setField('toDate', v)} minYmd={form.fromDate || undefined} rangeMessage="To date can’t be before the from date" hasError={!!errors.toDate} />
                {errors.toDate && <p className="field-err" style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.toDate}</p>}
              </div>
              <div className="fg m-0">
                <label className="lbl">Intake</label>
                <SearchSelect placeholder="All intakes" options={intakeOptions} value={form.intakeGuid} onChange={v => setField('intakeGuid', v)} isLoading={intakesQuery.isLoading} />
              </div>
              <div className="fg m-0">
                <label className="lbl">Student</label>
                <SearchSelect
                  placeholder="Type a name or reg no…"
                  options={studentOptions}
                  value={form.applicationGuid}
                  onChange={pickStudent}
                  onSearch={setStudentSearch}
                  isLoading={studentsQuery.isFetching}
                />
              </div>
              <div className="fg m-0">
                <label className="lbl">Campus</label>
                <SearchSelect placeholder="All campuses" options={campusOptions} value={form.campusGuid} onChange={pickCampus} isLoading={campusesQuery.isLoading} />
              </div>
              <div className="fg m-0">
                <label className="lbl">Programme</label>
                <SearchSelect placeholder={form.campusGuid ? 'All programmes' : 'Choose a campus first'} options={programOptions} value={form.programGuid} onChange={pickProgram} disabled={!form.campusGuid} isLoading={programsQuery.isFetching} />
                {form.programGuid && !form.semesterGuids.length && (
                  <p className="text-g400" style={{ fontSize: 12, marginTop: 4 }}>
                    A programme on its own currently shows no fee payments. Pick its semesters to see them.
                  </p>
                )}
              </div>
              <div className="fg m-0">
                <label className="lbl">Semesters <span className="text-g400" style={{ fontWeight: 400 }}>· up to {REPORT_MAX_SEMESTERS}</span></label>
                <MultiSelect placeholder={form.programGuid ? 'All semesters' : 'Choose a programme first'} options={semesterOptions} value={form.semesterGuids} onChange={pickSemesters} disabled={!form.programGuid} isLoading={semestersQuery.isFetching} />
                {errors.semesterGuids && <p className="field-err" style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.semesterGuids}</p>}
                {form.semesterGuids.length > 0 && !errors.semesterGuids && <p className="text-g400" style={{ fontSize: 12, marginTop: 4 }}>Fee payments for these semesters only. Deposits, other payments and refunds are left out.</p>}
              </div>
              <div className="fg m-0">
                <label className="lbl">Batches <span className="text-g400" style={{ fontWeight: 400 }}>· up to {REPORT_MAX_BATCHES}</span></label>
                <MultiSelect placeholder={form.semesterGuids.length ? 'All batches' : 'Choose a semester first'} options={batchOptions} value={form.batchGuids} onChange={v => setField('batchGuids', v)} disabled={!form.semesterGuids.length} isLoading={batchesQuery.isFetching} />
                {errors.batchGuids && <p className="field-err" style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.batchGuids}</p>}
              </div>
              <div className="fg m-0">
                <label className="lbl">Sponsor</label>
                <SearchSelect placeholder="All sponsors" options={sponsorOptions} value={form.sponsorCategoryGuid} onChange={v => setField('sponsorCategoryGuid', v)} isLoading={sponsorsQuery.isLoading} />
              </div>
              <div className="fg m-0">
                <label className="lbl">Payment types</label>
                <MultiSelect placeholder="All payment types" options={payTypeOptions} value={form.payTypes} onChange={v => setField('payTypes', v)} isLoading={payTypesQuery.isLoading} />
                {form.payTypes.length > 0 && <p className="text-g400" style={{ fontSize: 12, marginTop: 4 }}>Refunds have no payment type, so they’re left out.</p>}
              </div>
              <div className="fg m-0">
                <label className="lbl">Receipt books <span className="text-g400" style={{ fontWeight: 400 }}>· up to {TRANSACTION_REPORT_MAX_RECEIPT_BOOKS}</span></label>
                <MultiSelect placeholder="All receipt books" options={bookOptions} value={form.receiptBookGuids} onChange={v => setField('receiptBookGuids', v)} isLoading={booksQuery.isLoading} />
                {errors.receiptBookGuids && <p className="field-err" style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.receiptBookGuids}</p>}
                {form.receiptBookGuids.length > 0 && !errors.receiptBookGuids && <p className="text-g400" style={{ fontSize: 12, marginTop: 4 }}>Refunds have no receipt, so they’re left out.</p>}
              </div>
              <div className="fg m-0">
                <label className="lbl">Ledgers <span className="text-g400" style={{ fontWeight: 400 }}>· up to {TRANSACTION_REPORT_MAX_LEDGERS} of each kind</span></label>
                <MultiSelect
                  placeholder="All ledgers"
                  options={groupedLedgerOptions}
                  value={groupedLedgerValue}
                  onChange={pickLedgers}
                  isLoading={ledgersQuery.isLoading || otherLedgersQuery.isLoading}
                />
                {errors.ledgerGuids && <p className="field-err" style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.ledgerGuids}</p>}
                {!errors.ledgerGuids && (form.ledgerGuids.length > 0 || form.otherLedgerGuids.length > 0) && (
                  <p className="text-g400" style={{ fontSize: 12, marginTop: 4 }}>
                    Advance deposits have no ledger, so they’re left out.
                    {form.ledgerGuids.length > 0 && !form.otherLedgerGuids.length && ' Other payments are left out too.'}
                    {form.otherLedgerGuids.length > 0 && !form.ledgerGuids.length && ' Fee payments are left out too.'}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 mt-4 flex-wrap">
              <label className="flex items-center gap-[7px] cursor-pointer" style={{ fontSize: 13 }} title="Lists cancelled payments in their own table and adds a Cancelled Transactions sheet to the Excel file. They are never counted in any total.">
                <input type="checkbox" checked={form.showCancelled} onChange={e => setField('showCancelled', e.target.checked)} />
                <span>Show cancelled</span>
              </label>
              <span className="text-g400 mr-auto" style={{ fontSize: 'var(--fs-sm)' }}>
                {form.campusGuid || form.batchGuids.length || form.sponsorCategoryGuid
                  ? 'Campus, Batches and Sponsor use the student’s current record, so payments by people who aren’t students yet are left out.'
                  : 'Every filter is optional. Leave them all empty to report on everything.'}
              </span>
              <button type="button" className="btn btn-neu btn-sm" onClick={handleReset}>Reset</button>
              <button type="button" className="btn btn-primary btn-sm" onClick={handleProcess} disabled={(preview.isFetching && !preview.isFetchingNextPage) || batchesQuery.isFetching}>
                <i className="lni lni-play" aria-hidden="true" /> {preview.isFetching && !preview.isFetchingNextPage ? 'Processing…' : 'Process'}
              </button>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-g500" style={{ fontSize: 'var(--fs-sm)', fontWeight: 600 }}>Showing</span>
            <div className="rpt-recap" style={{ flex: 1 }}>
              {recap.length === 0
                ? <span className="rpt-chip">All transactions, all dates</span>
                : recap.map(c => <span key={c.label} className="rpt-chip"><span className="rpt-chip-lbl">{c.label}</span>{c.value}</span>)}
            </div>
            <button type="button" className="btn btn-neu btn-sm" onClick={() => setFiltersOpen(true)}>
              <i className="lni lni-pencil" aria-hidden="true" /> Change filters
            </button>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="card">
        {!saved ? (
          <div className="rpt-empty">
            <i className="lni lni-bar-chart" aria-hidden="true" />
            <div className="rpt-empty-title">Set your filters, then Process</div>
            <div style={{ fontSize: 13 }}>The transactions appear here, with totals per currency.</div>
          </div>
        ) : firstPageFailed ? (
          <div className="rpt-empty">
            <i className="lni lni-warning" aria-hidden="true" style={{ color: 'var(--red)' }} />
            <div className="rpt-empty-title">Couldn’t load the report</div>
            <div style={{ fontSize: 13, marginBottom: 14 }}>{reportErrorMessage(preview.error, 'Something went wrong. Please try again.')}</div>
            <button className="btn btn-neu btn-sm" onClick={() => preview.refetch()}><i className="lni lni-reload" aria-hidden="true" /> Try again</button>
          </div>
        ) : !hasResult ? (
          <div className="rpt-empty">
            <i className="lni lni-spinner-arrow spin" aria-hidden="true" />
            <div className="rpt-empty-title">Building the report…</div>
          </div>
        ) : isEmpty ? (
          <div className="rpt-empty">
            <i className="lni lni-search-alt" aria-hidden="true" />
            <div className="rpt-empty-title">No transactions match these filters</div>
            <div style={{ fontSize: 13 }}>Try a wider date range or fewer filters.</div>
          </div>
        ) : (
          <>
            <div className="rpt-results-hdr">
              <div className="rpt-count">
                <strong>{fmtReportCount(totalCount)}</strong> rows · <strong>{fmtReportCount(summary?.totalReceipts ?? 0)}</strong> receipts · <strong>{fmtReportCount(summary?.totalStudents ?? 0)}</strong> students
              </div>
              <ReportExportControls
                resetKey={runId}
                mockFileName="Transaction_Report.xlsx"
                startExport={() => exportTransactionReport(saved)}
                hideWithoutPermission
              />
            </div>

            <ScrollTable className="rpt-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Date</th><th>Receipt</th><th>Receipt Book</th><th>Student No</th><th>Student Name</th>
                    <th>Programme</th><th>Semester</th><th>Ledger</th><th>Paymode</th><th>Source</th><th>Currency</th>
                    <th className="num">Amount</th><th className="num">Discount</th><th className="num">Net</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => {
                    const isRefund = r.source.value === TXN_SOURCE.Refund
                    const isAdjustment = r.source.value === TXN_SOURCE.AdvanceAdjustment
                    const negStyle = isRefund ? { color: 'var(--red)' } : undefined
                    return (
                      // A receipt has several lines, adjustment rows repeat a
                      // receipt and refunds have none, so the key includes the position.
                      <tr key={`${r.receipt ?? 'r'}-${r.ledgerCode ?? ''}-${r.semCode ?? ''}-${i}`}>
                        <td>{fmtReportDate(r.payDate)}</td>
                        <td className="rpt-mono">{dash(r.receipt)}</td>
                        <td className="rpt-mono">{dash(r.receiptBook)}</td>
                        <td className="rpt-mono">{r.studentNumber}</td>
                        <td>{r.studentName}</td>
                        <td>{dash(r.programName)}</td>
                        <td>{dash(r.semesterName)}</td>
                        <td>{r.ledgerCode ? `${r.ledgerCode} - ${r.ledgerName}` : r.ledgerName}</td>
                        <td>{r.payMode ? (REPORT_PAYMODE_LABEL[r.payMode.value] ?? r.payMode.name) : '—'}</td>
                        <td>
                          <span className={`badge ${SOURCE_BADGE[r.source.value] ?? 'badge-grey'}`}>
                            {REPORT_SOURCE_LABEL[r.source.value] ?? r.source.name}
                          </span>
                        </td>
                        <td>{r.currencyCode}</td>
                        <td className="num"><span className="rpt-amt" style={negStyle}>{fmtSigned(r.amount)}</span><span className="rpt-cur">{r.currencyCode}</span></td>
                        <td className="num">
                          {r.discount > 0
                            ? <><span className="rpt-amt">{fmtReportAmount(r.discount)}</span><span className="rpt-cur">{r.currencyCode}</span></>
                            : <span className="text-g400">0.00</span>}
                        </td>
                        <td className="num" title={isAdjustment ? ADJUSTMENT_TIP : undefined}>
                          {isAdjustment ? (
                            // Not counted: muted, with the reason on hover/focus.
                            <span className="text-g400" tabIndex={0} aria-label={`${fmtReportAmount(r.net)} ${r.currencyCode}, not counted. ${ADJUSTMENT_TIP}`}>
                              <span className="rpt-amt">{fmtReportAmount(r.net)}</span><span className="rpt-cur">{r.currencyCode}</span>
                              <i className="lni lni-information" aria-hidden="true" style={{ marginLeft: 4, fontSize: 12 }} />
                            </span>
                          ) : (
                            <><span className="rpt-amt" style={negStyle}>{fmtSigned(r.net)}</span><span className="rpt-cur">{r.currencyCode}</span></>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                  <tr ref={sentinelRef} className="rpt-foot-row">
                    <td colSpan={COLS}>
                      {nextPageFailed ? (
                        <span className="inline-flex items-center gap-3">
                          <span style={{ color: 'var(--red)' }}>Couldn’t load more rows.</span>
                          <button className="btn btn-neu btn-sm" onClick={() => preview.fetchNextPage()}><i className="lni lni-reload" aria-hidden="true" /> Retry</button>
                        </span>
                      ) : preview.hasNextPage ? (
                        <span className="inline-flex items-center gap-2"><i className="lni lni-spinner-arrow spin" aria-hidden="true" /> Loading more…</span>
                      ) : (
                        <span>End of report · {fmtReportCount(rows.length)} rows</span>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </ScrollTable>

            {/* Pinned summary from page 1. One line per currency, never added
                across currencies; receipt/student counts aren't summed either. */}
            {summary && (
              <ReportCurrencySummary
                title="Summary by currency"
                note="Totals per ledger are in the Excel file"
                rows={summary.byCurrency}
                columns={[
                  { label: 'Rows', value: c => fmtReportCount(c.rowCount) },
                  { label: 'Receipts', value: c => fmtReportCount(c.receiptCount) },
                  { label: 'Gross', value: c => fmtReportAmount(c.gross) },
                  { label: 'Discount', value: c => fmtReportAmount(c.discount) },
                  // Only when some currency has rare unallocated discount.
                  ...(summary.byCurrency.some(c => c.unallocatedDiscount > 0)
                    ? [{ label: 'Unallocated discount', value: (c: typeof summary.byCurrency[number]) => fmtReportAmount(c.unallocatedDiscount) }]
                    : []),
                  // Refunded (negative) and Settled from advance only when
                  // some currency has them; "—" for a currency without.
                  ...(summary.byCurrency.some(c => (c.refunded ?? 0) !== 0)
                    ? [{ label: 'Refunded', value: (c: typeof summary.byCurrency[number]) => ((c.refunded ?? 0) !== 0 ? fmtSigned(c.refunded) : '—') }]
                    : []),
                  // Net already has refunds taken off.
                  { label: 'Net', value: c => fmtSigned(c.net), key: true },
                  ...(summary.byCurrency.some(c => (c.settledFromAdvance ?? 0) !== 0)
                    ? [{ label: 'Settled from advance (not in totals)', value: (c: typeof summary.byCurrency[number]) => ((c.settledFromAdvance ?? 0) !== 0 ? fmtReportAmount(c.settledFromAdvance) : '—') }]
                    : []),
                ]}
              />
            )}
          </>
        )}
      </div>

      {/* Cancelled payments (Show cancelled): their own table, kept out of
          the rows above and out of every total, so a missing receipt number
          can be explained. */}
      {saved?.showCancelled && hasResult && cancelledRows && (
        <div className="card">
          <div className="card-hdr">
            <div className="card-title">
              <span className="ctitle-icon"><i className="lni lni-ban" aria-hidden="true" /></span> Cancelled transactions
              <span className="badge badge-red ml-2">{fmtReportCount(cancelledRows.totalCount)}</span>
            </div>
            <span className="text-g400" style={{ fontSize: 'var(--fs-sm)' }}>Not counted in any total</span>
          </div>
          {cancelledRows.items.length === 0 ? (
            <div className="text-g400 text-center" style={{ padding: 16, fontSize: 12.5 }}>No cancelled payments match these filters.</div>
          ) : (
            <>
              <ScrollTable className="rpt-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th><th>Receipt</th><th>Receipt Book</th><th>Student No</th><th>Student Name</th>
                      <th>Ledger</th><th>Source</th><th className="num">Amount</th>
                      <th>Cancelled On</th><th>Cancelled By</th><th>Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cancelledRows.items.map((r, i) => (
                      <tr key={`${r.receipt ?? 'c'}-${r.ledgerCode ?? ''}-${r.semCode ?? ''}-${i}`}>
                        <td>{fmtReportDate(r.payDate)}</td>
                        <td className="rpt-mono">{dash(r.receipt)}</td>
                        <td className="rpt-mono">{dash(r.receiptBook)}</td>
                        <td className="rpt-mono">{r.studentNumber}</td>
                        <td>{r.studentName}</td>
                        <td>{r.ledgerCode ? `${r.ledgerCode} - ${r.ledgerName}` : r.ledgerName}</td>
                        <td>
                          <span className={`badge ${SOURCE_BADGE[r.source.value] ?? 'badge-grey'}`}>{REPORT_SOURCE_LABEL[r.source.value] ?? r.source.name}</span>
                        </td>
                        <td className="num"><span className="rpt-amt">{fmtReportAmount(r.amount)}</span><span className="rpt-cur">{r.currencyCode}</span></td>
                        <td>{r.cancelledDate ? fmtReportDate(r.cancelledDate) : '—'}</td>
                        <td>{dash(r.cancelledByName)}</td>
                        <td style={{ minWidth: 200, whiteSpace: 'normal' }}>{dash(r.cancelReason)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ScrollTable>
            </>
          )}
        </div>
      )}
    </div>
  )
}
