'use client'
import { useState, useMemo, useEffect, Fragment } from 'react'
import Link from 'next/link'
import { ScrollTable } from '@/components/ScrollTable'
import { TableSearch } from '@/components/TableSearch'
import { SearchSelect } from '@/components/SearchSelect'
import { EmptyState } from '@/components/EmptyState'
import { TableLoadingState } from '@/components/TableLoadingState'
import { ActionMenu } from '@/components/ActionMenu'
import { Toast } from '@/components/Toast'
import { ViewPaymentReceiptModal } from '@/components/modals/finance/ViewPaymentReceiptModal'
import { useStudentStatementSearch, useStudentStatement, useStudentFeeSummary } from '@/hooks/student/useStudentStatement'
import { getStudentStatementPdfUrl, type StudentStatementPaymentDto } from '@/lib/api/student/studentStatement'
import { PAYMENT_CATEGORY_LABELS, type PaymentHistoryListEntry } from '@/lib/api/finance/paymentConsole'
import { useExchangeRatesByDates, type ExchangeRate } from '@/hooks/finance/useExchangeRates'
import { useActionGuard } from '@/hooks/users/useActionGuard'
import { semesterLabel } from '@/lib/semesterLabel'

// Category options for standard SearchSelect dropdown
const CATEGORY_OPTIONS = [
  { value: 'all', label: 'All Categories' },
  { value: '1', label: 'Tuition Fee' },
  { value: '3', label: 'NCHE Fee' },
  { value: '4', label: 'Guild Fee' },
  { value: '5', label: 'Advance Deposit' },
  { value: '6', label: 'Application Fee' },
]

// Format currency amount with commas
function formatMoney(amount?: number | null, currency = ''): string {
  if (amount == null) return '—'
  const formatted = Math.abs(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const prefix = amount < 0 ? '-' : ''
  return currency ? `${currency} ${prefix}${formatted}` : `${prefix}${formatted}`
}

function parseSemesterOrder(name: string): number {
  if (!name) return 9999
  const lower = name.toLowerCase().trim()

  // Extract Year
  let year = 99
  if (lower.includes('year one') || lower.includes('year 1') || lower.includes('1st year') || lower.includes('first year')) year = 1
  else if (lower.includes('year two') || lower.includes('year 2') || lower.includes('2nd year') || lower.includes('second year')) year = 2
  else if (lower.includes('year three') || lower.includes('year 3') || lower.includes('3rd year') || lower.includes('third year')) year = 3
  else if (lower.includes('year four') || lower.includes('year 4') || lower.includes('4th year') || lower.includes('fourth year')) year = 4
  else if (lower.includes('year five') || lower.includes('year 5') || lower.includes('5th year') || lower.includes('fifth year')) year = 5

  // Extract Semester
  let sem = 99
  if (lower.includes('semester one') || lower.includes('semester 1') || lower.includes('sem 1') || lower.includes('sem one')) sem = 1
  else if (lower.includes('semester two') || lower.includes('semester 2') || lower.includes('sem 2') || lower.includes('sem two')) sem = 2
  else if (lower.includes('semester three') || lower.includes('semester 3') || lower.includes('sem 3') || lower.includes('sem three')) sem = 3

  return year * 10 + sem
}

function sumByCurrency<T extends { currencyName?: string | null; amount?: number; outstanding?: number; amountDue?: number }>(
  rows: T[],
  field: 'amount' | 'outstanding' | 'amountDue'
): { currency: string; total: number }[] {
  const byCurrency = new Map<string, number>()
  for (const r of rows) {
    const cur = currencyLabel(r.currencyName)
    const val = (field === 'amount' ? r.amount : field === 'outstanding' ? r.outstanding : r.amountDue) ?? 0
    byCurrency.set(cur, (byCurrency.get(cur) ?? 0) + val)
  }
  return [...byCurrency.entries()].map(([currency, total]) => ({ currency, total }))
}

// Exchange rates are UGX per one unit of the currency (amountUsh = amount ×
// exRate), so USD = amount × rate(currency) / rate(USD), both taken from the
// payment's own payDate board. UGX itself has no rate row — it's the base,
// and a null currency (NCHE/Guild rows) is UGX here too, same as
// sumByCurrency. null when that day has no rate for either side.
function isUgx(currencyName?: string | null) {
  const c = currencyName?.trim().toLowerCase()
  return !c || c === '—' || c === 'ugx' || c.startsWith('uganda')
}

// Short code for a currency name, so totals group "Uganda Shillings" and the
// currency-less NCHE/Guild rows together as one UGX figure instead of two.
const CURRENCY_CODES: Record<string, string> = { 'us dollar': 'USD', 'kenyan shilling': 'KES' }
function currencyLabel(currencyName?: string | null) {
  if (isUgx(currencyName)) return 'UGX'
  const name = currencyName!.trim()
  return CURRENCY_CODES[name.toLowerCase()] ?? name
}

function toUsd(
  p: { amount: number; currencyGuid: string | null; currencyName: string | null },
  rates: ExchangeRate[] | undefined,
): number | null {
  const usdRate = rates?.find(r => r.currencyCode?.toUpperCase() === 'USD')
  if (usdRate && p.currencyGuid === usdRate.currencyGuid) return p.amount
  if (p.currencyName?.trim().toLowerCase() === 'us dollar') return p.amount
  if (!usdRate?.exRate) return null
  const ownRate = isUgx(p.currencyName) ? 1 : rates?.find(r => r.currencyGuid === p.currencyGuid)?.exRate
  if (!ownRate) return null
  return (p.amount * ownRate) / usdRate.exRate
}

// Row number by on-screen position, running on across semester groups — the
// API's slNo follows its own newest-first order, so it read out of sequence
// once rows were grouped, sorted or filtered.
function runningNo(groups: { items: unknown[] }[], groupIdx: number, idx: number) {
  let n = idx + 1
  for (let i = 0; i < groupIdx; i++) n += groups[i].items.length
  return n
}

function getCategoryBadge(category?: number | null) {
  switch (category) {
    case 3: // NCHE
      return { badge: 'badge-green', label: 'NCHE' }
    case 4: // Guild
      return { badge: 'badge-amber', label: 'Guild' }
    case 1: // Tuition
      return { badge: 'badge-blue', label: 'Tuition' }
    case 5: // Advance Deposit
      return { badge: 'badge-purple', label: 'Advance Deposit' }
    case 6: // Application Fee
      return { badge: 'badge-cyan', label: 'Application Fee' }
    default:
      return {
        badge: 'badge-grey',
        label: (category != null ? PAYMENT_CATEGORY_LABELS[category] : null) || 'Other',
      }
  }
}

function renderCategoryBadge(category?: number | null) {
  const { badge, label } = getCategoryBadge(category)
  return (
    <span className={`badge ${badge}`}>
      <span className="bdot" />
      {label}
    </span>
  )
}

// The ledgers a payment was allocated to, one line per ledger with its
// amount (repeats merged, amounts summed). Rows with no ledgers — NCHE,
// Guild, Advance, Application Fee — fall back to the category badge.
function renderLedgerBadges(p: StudentStatementPaymentDto) {
  const merged = new Map<string, { name: string; amount: number }>()
  for (const l of p.ledgers ?? []) {
    const name = l.ledgerName || l.ledgerCode || 'Ledger'
    const prev = merged.get(l.ledgerGuid)
    merged.set(l.ledgerGuid, { name, amount: (prev?.amount ?? 0) + (l.amount || 0) })
  }
  if (merged.size === 0) return renderCategoryBadge(p.category)
  return (
    <ul className="ss-ledgers">
      {[...merged.entries()].map(([guid, l]) => (
        <li key={guid} className="ss-ledger-line">
          <span className="ss-ledger-name">{l.name}</span>
          <span className="ss-ledger-lead" />
          <span className="ss-ledger-amt">{formatMoney(l.amount)}</span>
        </li>
      ))}
    </ul>
  )
}

function ledgerNames(p: StudentStatementPaymentDto) {
  return (p.ledgers ?? []).map(l => `${l.ledgerName ?? ''} ${l.ledgerCode ?? ''}`).join(' ').toLowerCase()
}

type DisplayView = 'hybrid' | 'charts' | 'official'

export default function StudentStatementPage() {
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)
  function showToast(msg: string, type = '') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  const [term, setTerm] = useState('')
  const [selectedGuid, setSelectedGuid] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<DisplayView>('hybrid')
  const [tableTab, setTableTab] = useState<'payments' | 'outstanding' | 'future'>('payments')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [tableSearch, setTableSearch] = useState('')
  const [hoveredChartSegment, setHoveredChartSegment] = useState<string | null>(null)
  const [groupBySemester, setGroupBySemester] = useState(true)
  // Semester groups collapse, keyed `${tab}:${semester}`. Unset means the
  // default: only the latest (last) semester open. A search opens them all
  // so no match is hidden.
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({})
  // Payment totals show USD only; this adds the per-currency totals beside it.
  const [showAllCurrencies, setShowAllCurrencies] = useState(false)

  // Receipt Modal State (matching payment-history convention)
  const [receiptEntry, setReceiptEntry] = useState<PaymentHistoryListEntry | null>(null)
  const [autoPrint, setAutoPrint] = useState(false)

  // Infinite search query for quick student selection
  const {
    data: searchPages,
    isLoading: isSearching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useStudentStatementSearch(term, !selectedGuid)
  const matches = searchPages?.pages.flatMap(p => p.items) ?? []

  // Main statement query
  const {
    data: statement,
    isLoading: isStatementLoading,
    isError: isStatementError,
    error: statementError,
  } = useStudentStatement(selectedGuid)

  const header = statement?.header
  const paymentHistory = statement?.paymentHistory ?? []
  const outstandingItems = statement?.outstandingItems ?? []
  const futurePayments = statement?.futurePayments ?? []

  // Rate boards for every distinct payDate in the history, for the USD column.
  const { byDate: ratesByDate, isLoading: isRatesLoading } = useExchangeRatesByDates(
    paymentHistory.map(p => p.payDate?.slice(0, 10)),
    paymentHistory.length > 0,
  )

  // Summary totals
  const { data: feeSummary } = useStudentFeeSummary(selectedGuid)

  const totalPaid = feeSummary?.amountPaid ?? paymentHistory.reduce((acc, p) => acc + (p.amount || 0), 0)
  const currentOutstanding = feeSummary?.pendingFee ?? outstandingItems.reduce((acc, o) => acc + (o.outstanding || 0), 0)
  const totalFuture = futurePayments.reduce((acc, f) => acc + (f.amountDue || 0), 0)
  // fee-summary's pendingFee is already what's left to pay (total − paid);
  // subtracting the paid amount again went negative for anyone who'd paid
  // more than they still owe and showed them as cleared.
  const balanceDueCurrent = currentOutstanding

  // Clearance percentage
  const totalBilled = (feeSummary?.totalAmountToPay ?? (totalPaid + currentOutstanding)) || 1
  const paidPercent = Math.min(100, Math.max(0, Math.round((totalPaid / totalBilled) * 100)))

  // Opened as /finance/student-statements?studentGuid=… (e.g. Payment
  // Console's "View Student Statement" after a payment): load that student
  // straight away. Read from window.location after mount rather than
  // useSearchParams, which would need a Suspense boundary in the static build.
  // from=payment-console (+ that page's applicationGuid) adds a Back button
  // that reopens the console on the same student.
  const [backToConsole, setBackToConsole] = useState<{ applicationGuid: string; studentGuid: string } | null>(null)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const guid = params.get('studentGuid')
    if (guid) setSelectedGuid(guid)
    const applicationGuid = params.get('applicationGuid')
    if (guid && applicationGuid && params.get('from') === 'payment-console') setBackToConsole({ applicationGuid, studentGuid: guid })
  }, [])

  function backToPaymentConsoleHref() {
    if (!backToConsole) return '/finance/payment-console'
    const q = new URLSearchParams({ applicationGuid: backToConsole.applicationGuid, studentGuid: backToConsole.studentGuid })
    if (header?.studentName) q.set('name', header.studentName)
    return `/finance/payment-console?${q.toString()}`
  }

  // A student opened from the URL has no search hit to take a name from, so
  // fill the search box from the statement once it loads.
  useEffect(() => {
    if (selectedGuid && !term && header?.studentName) setTerm(header.studentName)
  }, [selectedGuid, term, header?.studentName])

  function handleSelect(guid: string) {
    setSelectedGuid(guid)
    const found = matches.find(m => m.studentGuid === guid)
    if (found) setTerm(found.studentName ?? '')
  }

  function handleClearStudent() {
    setSelectedGuid(null)
    setTerm('')
  }

  function copyToClipboard(text: string, label: string) {
    if (!text) return
    navigator.clipboard.writeText(text).then(
      () => showToast(`${label} copied to clipboard`, 'success'),
      () => showToast(`Failed to copy ${label}`, 'error')
    )
  }

  // Print actions stay visible; without the menu's `print` permission they
  // show a toast instead of printing (useActionGuard).
  const guard = useActionGuard(showToast)

  function openReceipt(p: (typeof paymentHistory)[0], print: boolean) {
    const entry: PaymentHistoryListEntry = {
      paymentGuid: p.paymentGuid || `STU-REC-${p.receipt || p.paymentCode || '001'}`,
      category: p.category || 1,
      receiptNo: p.receipt || p.paymentCode || '—',
      payDate: p.payDate || new Date().toISOString(),
      studentNo: header?.studentNum || header?.studentRegNo || null,
      studentName: header?.studentName || null,
      programName: header?.programName || null,
      feeType: (p.category != null ? PAYMENT_CATEGORY_LABELS[p.category] : null) || 'Tuition Fee',
      amount: p.amount || 0,
      currencyCode: p.currencyName || 'UGX',
      ugxValue: p.amount || 0,
      rate: null,
      payType: p.payType ? { value: 1, name: p.payType } : null,
    }
    setReceiptEntry(entry)
    setAutoPrint(print)
  }

  function paymentUsd(p: (typeof paymentHistory)[0]) {
    return toUsd(p, ratesByDate.get(p.payDate?.slice(0, 10)))
  }

  // USD total of a set of payments, plus how many couldn't be converted (no
  // rate on their payDate) so the total can say it's partial.
  function usdTotal(items: typeof paymentHistory) {
    let total = 0
    let missing = 0
    for (const p of items) {
      const usd = paymentUsd(p)
      if (usd == null) missing++
      else total += usd
    }
    return { total, missing }
  }

  // The USD total as a highlighted chip. A warning icon (explained on hover)
  // flags payments left out for lack of a rate on their payDate.
  function renderUsdTotal(items: typeof paymentHistory) {
    const { total, missing } = usdTotal(items)
    return (
      <span className="stmt-total-chip is-primary" title="Converted at each payment date's exchange rate">
        <span>Total (USD)</span>
        <span className="font-mono">{isRatesLoading ? '…' : formatMoney(total)}</span>
        {!isRatesLoading && missing > 0 && (
          <i
            className="lni lni-warning text-amber"
            title={`${missing} ${missing === 1 ? 'payment has' : 'payments have'} no exchange rate for ${missing === 1 ? 'its' : 'their'} payment date and ${missing === 1 ? 'is' : 'are'} not included in this total`}
            aria-label={`${missing} not converted`}
          />
        )}
      </span>
    )
  }

  // "Paid in UGX 246,978.58 · KES 500.00" — the original amounts behind the
  // USD total, shown while the All Currencies switch is on.
  function renderCurrencyBreakdown(items: typeof paymentHistory) {
    const totals = sumByCurrency(items, 'amount')
    if (!showAllCurrencies || totals.length === 0) return null
    return (
      <span className="stmt-total-breakdown">
        <span className="stmt-total-breakdown-lbl">Paid in</span>
        {totals.map((ct, i) => (
          <Fragment key={ct.currency}>
            {i > 0 && <span className="text-g300">·</span>}
            <span>{ct.currency} <span className="font-mono">{formatMoney(ct.total)}</span></span>
          </Fragment>
        ))}
      </span>
    )
  }

  function renderUsdCell(p: (typeof paymentHistory)[0]) {
    const usd = paymentUsd(p)
    if (usd != null) return formatMoney(usd)
    if (isRatesLoading) return <span className="text-g300">…</span>
    const day = p.payDate ? new Date(p.payDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'this date'
    return <span className="text-g300" title={`No exchange rate recorded for ${day}`}>—</span>
  }

  // One payment row, shared by the grouped and flat views. The grouped view
  // drops the Semester cell — the group header above already names it.
  // Empty values render as a plain muted dash, not an empty pill/badge.
  function renderPaymentRow(p: (typeof paymentHistory)[0], rowNo: number, key: string, showSemester: boolean) {
    const dash = <span className="text-g300">—</span>
    return (
      <tr key={key}>
        <td>
          <ActionMenu>
            <button type="button" className="btn btn-neu btn-sm" onClick={() => openReceipt(p, false)}>
              <i className="lni lni-eye" /> View Receipt
            </button>
            <button type="button" className="btn btn-neu btn-sm" onClick={() => guard('print', () => openReceipt(p, true), 'receipts')}>
              <i className="lni lni-printer" /> Print Receipt
            </button>
            {p.receipt && (
              <button type="button" className="btn btn-neu btn-sm" onClick={() => copyToClipboard(p.receipt!, 'Receipt Number')}>
                <i className="lni lni-clipboard" /> Copy Receipt #
              </button>
            )}
            {p.paymentCode && (
              <button type="button" className="btn btn-neu btn-sm" onClick={() => copyToClipboard(p.paymentCode!, 'Payment Code')}>
                <i className="lni lni-clipboard" /> Copy Code
              </button>
            )}
          </ActionMenu>
        </td>
        <td className="text-center text-g400">{rowNo}</td>
        {/* Paired cells (code over date, receipt over method, amount over
            currency) keep the table narrow enough not to scroll sideways. */}
        <td>
          <span className="ss-cell-main font-mono text-blue">{p.paymentCode || dash}</span>
          <span className="ss-cell-sub">
            {p.payDate ? new Date(p.payDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
          </span>
        </td>
        {showSemester && <td className="text-g800 font-medium">{semesterLabel(p.semesterName || header?.semesterName) || dash}</td>}
        <td>
          <span className="ss-cell-main font-mono text-g800">{p.receipt || dash}</span>
          <span className="ss-cell-sub">{p.payType || '—'}</span>
        </td>
        <td className="num">
          <span className="ss-cell-main font-mono text-green">{formatMoney(p.amount)}</span>
          <span className="ss-cell-sub">{p.currencyName || '—'}</span>
        </td>
        <td className="num font-mono font-bold text-g900">{renderUsdCell(p)}</td>
        <td>{renderLedgerBadges(p)}</td>
      </tr>
    )
  }

  function isGroupOpen(key: string, isLast: boolean) {
    if (tableSearch.trim()) return true
    return openGroups[key] ?? isLast
  }

  // Collapsible semester header: name, count and the semester's subtotal on
  // one row (replaces the separate subtotal row under each group).
  function renderGroupHeader(key: string, isLast: boolean, colSpan: number, icon: string, label: string, count: string, totals: React.ReactNode) {
    const open = isGroupOpen(key, isLast)
    return (
      <tr className={`stmt-group-hdr ss-grp${open ? ' open' : ''}`}>
        <td colSpan={colSpan}>
          <button
            type="button"
            className="ss-grp-btn"
            aria-expanded={open}
            onClick={() => setOpenGroups(prev => ({ ...prev, [key]: !open }))}
          >
            <i className="lni lni-chevron-right ss-grp-chev" aria-hidden="true" />
            <span className="ss-grp-icon" aria-hidden="true"><i className={`lni ${icon}`} /></span>
            <span className="stmt-group-name">{label}</span>
            <span className="ss-grp-count">{count}</span>
            <span className="ss-grp-total">{totals}</span>
          </button>
        </td>
      </tr>
    )
  }

  function closeReceipt() {
    setReceiptEntry(null)
    setAutoPrint(false)
  }

  // Group payments by category for chart
  const categoryStats = useMemo(() => {
    const map = new Map<string, { label: string; paid: number; due: number; count: number }>()

    paymentHistory.forEach(p => {
      const catName = PAYMENT_CATEGORY_LABELS[p.category] || 'Other'
      const existing = map.get(catName) || { label: catName, paid: 0, due: 0, count: 0 }
      existing.paid += p.amount || 0
      existing.count += 1
      map.set(catName, existing)
    })

    outstandingItems.forEach(o => {
      const catName = PAYMENT_CATEGORY_LABELS[o.category] || 'Other'
      const existing = map.get(catName) || { label: catName, paid: 0, due: 0, count: 0 }
      existing.due += o.outstanding || 0
      map.set(catName, existing)
    })

    return Array.from(map.values())
  }, [paymentHistory, outstandingItems])

  // Donut chart math
  const chartTotal = totalPaid + currentOutstanding + totalFuture || 1

  // Filtered payments by category and search
  const filteredPayments = useMemo(() => {
    return paymentHistory.filter(p => {
      const matchCat = selectedCategory === 'all' || String(p.category) === selectedCategory
      const q = tableSearch.trim().toLowerCase()
      const matchSearch =
        !q ||
        (p.receipt && p.receipt.toLowerCase().includes(q)) ||
        (p.paymentCode && p.paymentCode.toLowerCase().includes(q)) ||
        (p.payType && p.payType.toLowerCase().includes(q)) ||
        (p.semesterName && p.semesterName.toLowerCase().includes(q)) ||
        ledgerNames(p).includes(q) ||
        (PAYMENT_CATEGORY_LABELS[p.category] && PAYMENT_CATEGORY_LABELS[p.category].toLowerCase().includes(q))
      return matchCat && matchSearch
    })
  }, [paymentHistory, selectedCategory, tableSearch])

  // Filtered outstanding items
  const filteredOutstanding = useMemo(() => {
    return outstandingItems.filter(item => {
      const matchCat = selectedCategory === 'all' || String(item.category) === selectedCategory
      const q = tableSearch.trim().toLowerCase()
      const matchSearch =
        !q ||
        (item.description && item.description.toLowerCase().includes(q)) ||
        (PAYMENT_CATEGORY_LABELS[item.category] && PAYMENT_CATEGORY_LABELS[item.category].toLowerCase().includes(q)) ||
        (item.currencyName && item.currencyName.toLowerCase().includes(q)) ||
        (item.semesterName && item.semesterName.toLowerCase().includes(q))
      return matchCat && matchSearch
    })
  }, [outstandingItems, selectedCategory, tableSearch])

  // Filtered future payments
  const filteredFuture = useMemo(() => {
    return futurePayments.filter(item => {
      const q = tableSearch.trim().toLowerCase()
      const matchSearch =
        !q ||
        (item.description && item.description.toLowerCase().includes(q)) ||
        (item.semesterName && item.semesterName.toLowerCase().includes(q)) ||
        (item.currencyName && item.currencyName.toLowerCase().includes(q))
      return matchSearch
    })
  }, [futurePayments, tableSearch])

  // Grouped payments by semester (sorted ascending by year & semester, with currency breakdown)
  const groupedPayments = useMemo(() => {
    const map = new Map<string, typeof filteredPayments>()
    for (const p of filteredPayments) {
      const sem = p.semesterName?.trim() || header?.semesterName?.trim() || 'General / Unassigned'
      if (!map.has(sem)) map.set(sem, [])
      map.get(sem)!.push(p)
    }
    const groups = [...map.entries()].map(([semester, items]) => ({
      semester,
      items,
      currencyTotals: sumByCurrency(items, 'amount'),
    }))

    groups.sort((a, b) => {
      const orderA = parseSemesterOrder(a.semester)
      const orderB = parseSemesterOrder(b.semester)
      if (orderA !== orderB) return orderA - orderB
      return a.semester.localeCompare(b.semester)
    })

    return groups
  }, [filteredPayments, header?.semesterName])

  // Grouped outstanding items by semester (sorted ascending by year & semester, with currency breakdown)
  const groupedOutstanding = useMemo(() => {
    const map = new Map<string, typeof filteredOutstanding>()
    for (const item of filteredOutstanding) {
      const sem = item.semesterName?.trim() || header?.semesterName?.trim() || 'General / Unassigned'
      if (!map.has(sem)) map.set(sem, [])
      map.get(sem)!.push(item)
    }
    const groups = [...map.entries()].map(([semester, items]) => ({
      semester,
      items,
      currencyTotals: sumByCurrency(items, 'outstanding'),
    }))

    groups.sort((a, b) => {
      const orderA = parseSemesterOrder(a.semester)
      const orderB = parseSemesterOrder(b.semester)
      if (orderA !== orderB) return orderA - orderB
      return a.semester.localeCompare(b.semester)
    })

    return groups
  }, [filteredOutstanding, header?.semesterName])

  // Grouped future payments by semester (sorted ascending by year & semester, with currency breakdown)
  const groupedFuture = useMemo(() => {
    const map = new Map<string, typeof filteredFuture>()
    for (const item of filteredFuture) {
      const sem = item.semesterName?.trim() || 'Future Assessments'
      if (!map.has(sem)) map.set(sem, [])
      map.get(sem)!.push(item)
    }
    const groups = [...map.entries()].map(([semester, items]) => ({
      semester,
      items,
      currencyTotals: sumByCurrency(items, 'amountDue'),
    }))

    groups.sort((a, b) => {
      const orderA = parseSemesterOrder(a.semester)
      const orderB = parseSemesterOrder(b.semester)
      if (orderA !== orderB) return orderA - orderB
      return a.semester.localeCompare(b.semester)
    })

    return groups
  }, [filteredFuture])

  return (
    <>
      <div className="page active" id="page-student-statement">
        {/* ── Page Header matching standard ISBAT ERP convention ──────── */}
        <div className="pg-hdr">
          <div>
            {backToConsole && (
              <Link href={backToPaymentConsoleHref()} prefetch={false} className="btn btn-neu btn-sm mb-2" style={{ display: 'inline-flex' }}>
                <i className="lni lni-arrow-left" /> Back to Payment Console
              </Link>
            )}
            <div className="pg-title">Student Statement</div>
            <div className="pg-sub">Official student financial ledger, payment history, and fee breakdown</div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* View Mode Switcher */}
            <div className="ss-seg" role="group" aria-label="Statement view">
              {([
                ['hybrid', 'lni-grid-alt', 'Overview'],
                ['charts', 'lni-pie-chart', 'Analytics'],
                ['official', 'lni-files', 'Ledger View'],
              ] as const).map(([mode, icon, label]) => (
                <button
                  key={mode}
                  type="button"
                  aria-pressed={viewMode === mode}
                  className={`ss-seg-btn${viewMode === mode ? ' active' : ''}`}
                  onClick={() => setViewMode(mode)}
                >
                  <i className={`lni ${icon}`} />
                  <span>{label}</span>
                </button>
              ))}
            </div>

            {/* Print & PDF Export Buttons — both produce the printable
                statement, so both follow the menu's `print` permission.
                Always shown; without it, clicking shows a toast instead of
                printing. */}
            <button
              type="button"
              className="btn btn-neu btn-sm"
              onClick={() => guard('print', () => window.print(), 'student statements')}
              disabled={!selectedGuid}
              title="Print official statement"
            >
              <i className="lni lni-printer" />
              <span>Print</span>
            </button>

            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => guard('print', () => {
                if (selectedGuid) {
                  window.open(getStudentStatementPdfUrl(selectedGuid), '_blank')
                  showToast('Opening official signed statement PDF…', 'success')
                }
              }, 'student statements')}
              disabled={!selectedGuid}
              title="Download signed PDF statement"
            >
              <i className="lni lni-download" />
              <span>PDF</span>
            </button>
          </div>
        </div>

        {/* ── Student Search Bar (Standard Card + TableSearch) ─────────── */}
        <div className="card mb-4">
          <div className="card-hdr">
            <div className="card-title">
              <span className="ctitle-icon">
                <i className="lni lni-search-alt" />
              </span>
              Student Search
            </div>
            {selectedGuid && (
              <button
                type="button"
                className="btn btn-neu btn-sm"
                onClick={handleClearStudent}
              >
                <i className="lni lni-reload" />
                <span>Change Student</span>
              </button>
            )}
          </div>

          <TableSearch
            value={term}
            onChange={v => {
              setTerm(v)
              setSelectedGuid(null)
            }}
            placeholder="Search student by Name, Reg No (e.g. 027240104), or Programme…"
            loading={isSearching}
            emptyLabel="No students found matching your search"
            minChars={0}
            results={matches.map(m => ({
              id: m.studentGuid,
              primary: m.studentName ?? '—',
              secondary: [m.studentRegNo, m.programName, m.batchCode].filter(Boolean).join(' • '),
            }))}
            onSelect={r => handleSelect(r.id)}
            onLoadMore={() => hasNextPage && fetchNextPage()}
            hasMore={hasNextPage}
            loadingMore={isFetchingNextPage}
          />
        </div>

        {/* ── Main Viewport ─────────────────────────────────────────── */}
        {!selectedGuid ? (
          <div className="card text-center py-16">
            <div
              className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center text-b700"
              style={{ background: 'var(--b50)', fontSize: 32 }}
            >
              <i className="lni lni-files" />
            </div>
            <div className="text-base font-bold text-g900 mb-1">No Student Statement Loaded</div>
            <div className="text-sm text-g500 max-w-md mx-auto mb-4">
              Click the search box above to choose an enrolled student by Name or Registration Number to load their real-time fee statement and payment history.
            </div>
            <div className="inline-flex items-center gap-2 py-1.5 px-3 rounded-lg bg-g100 text-xs text-g600">
              <i className="lni lni-bulb text-amber" />
              <span>Tip: Try searching &ldquo;027240104&rdquo; or &ldquo;Ashfa&rdquo; to test with live records.</span>
            </div>
          </div>
        ) : isStatementLoading ? (
          <div className="card text-center py-16 text-g400">
            <i className="lni lni-spinner-arrow spin inline-block text-2xl mb-2 text-b700" />
            <div className="text-sm font-medium">Fetching student financial statement, ledgers, and transactions…</div>
          </div>
        ) : isStatementError || !header ? (
          <div className="card text-center py-12 text-clr-red border border-red-200 bg-red-50/40">
            <i className="lni lni-warning inline-block text-2xl mb-2 text-red" />
            <div className="text-sm font-bold text-red-900 mb-1">Failed to Load Statement</div>
            <div className="text-xs text-red-700 max-w-md mx-auto mb-4">
              {statementError instanceof Error && statementError.message && statementError.message !== 'not_found'
                ? statementError.message
                : "Unable to retrieve the student's statement records."}
            </div>
            <button type="button" className="btn btn-neu btn-sm" onClick={handleClearStudent}>
              Search Another Student
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* ══════════════════════════════════════════════════════════════
                1. ERP CANONICAL STUDENT PROFILE HERO CARD (.pc-hero)
               ══════════════════════════════════════════════════════════════ */}
            {/* Student header — same white pcx- card as Payment Console, so
                a student reads the same on both pages. */}
            {(() => {
              const name = header.studentName || '—'
              const initials = name.trim().split(/\s+/).slice(0, 2).map(w => w[0] ?? '').join('').toUpperCase() || 'ST'
              const sameNo = !!header.studentNum && header.studentNum === header.studentRegNo
              const facts: { label: string; value: string | null | undefined; mono?: boolean }[] = [
                ...(sameNo
                  ? [{ label: 'Student / Reg. no.', value: header.studentNum, mono: true }]
                  : [
                      { label: 'Student no.', value: header.studentNum, mono: true },
                      { label: 'Reg. no.', value: header.studentRegNo, mono: true },
                    ]),
                { label: 'Current semester', value: semesterLabel(header.semesterName) },
                { label: 'Batch', value: header.batchCode },
                { label: 'Admission type', value: header.admissionTypeLabel ?? 'Regular Student' },
                { label: 'Application ref.', value: header.appRefNo, mono: true },
              ]
              return (
                <section className="card pcx-student" aria-label="Student">
                  <div className="pcx-student-top">
                    <div className="pcx-student-id">
                      <div className="pcx-avatar" aria-hidden="true">{initials}</div>
                      <div className="min-w-0">
                        <div className="pcx-name-row">
                          <h2 className="pcx-name">{name}</h2>
                          <span className={`pcx-pill ${balanceDueCurrent <= 0 ? 'pcx-pill-green' : 'pcx-pill-amber'}`}>
                            <span className="pcx-dot" aria-hidden="true"></span>
                            {balanceDueCurrent <= 0 ? 'In good standing' : 'Balance pending'}
                          </span>
                        </div>
                        <p className="pcx-sub">{header.programName || '—'}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn btn-neu btn-sm"
                      onClick={() => copyToClipboard(header.studentRegNo || '', 'Reg No')}
                      disabled={!header.studentRegNo}
                    >
                      <i className="lni lni-clipboard" /> Copy Reg No
                    </button>
                  </div>
                  <dl
                    className="pcx-facts"
                    style={{ '--n': facts.length } as React.CSSProperties}
                  >
                    {facts.map(f => (
                      <div key={f.label}>
                        <dt>{f.label}</dt>
                        <dd className={f.mono ? 'tabular-nums' : undefined} title={f.value || '—'}>{f.value || '—'}</dd>
                      </div>
                    ))}
                  </dl>
                </section>
              )
            })()}

            {/* ══════════════════════════════════════════════════════════════
                2–3. OVERVIEW — one Fee clearance card (donut + figures),
                fee heads full width below. The Ledger view has no charts, so
                the same figures show as a row of KPI tiles there instead.
               ══════════════════════════════════════════════════════════════ */}
            {(() => {
              const withCharts = viewMode === 'hybrid' || viewMode === 'charts'
              // Ledger view only: the Finance Dashboard's KPI tiles, four across.
              const kpiTiles = (
                <div className="card fd-kpis ss-kpi-panel abd-kpis">
                  {([
                    { tone: 'blue', icon: 'lni-checkmark-circle', label: 'Amount paid', value: totalPaid, sub: `${paymentHistory.length} recorded ${paymentHistory.length === 1 ? 'payment' : 'payments'}` },
                    { tone: currentOutstanding > 0 ? 'red' : 'green', icon: 'lni-wallet', label: 'Pending fee', value: currentOutstanding, sub: `${outstandingItems.length} pending ${outstandingItems.length === 1 ? 'due' : 'dues'}` },
                    { tone: 'cyan', icon: 'lni-alarm-clock', label: 'Future payments', value: totalFuture, sub: `${futurePayments.length} upcoming ${futurePayments.length === 1 ? 'fee' : 'fees'}` },
                    { tone: 'amber', icon: 'lni-calculator', label: 'Total amount to pay', value: feeSummary?.totalAmountToPay ?? totalPaid + currentOutstanding, sub: currentOutstanding > 0 ? 'Fee clearance pending' : 'Exam clearance eligible' },
                  ]).map(k => (
                    <div key={k.label} className={`fd-kpi fd-kpi-${k.tone}`}>
                      <span className="fd-kpi-top">
                        <span className="fd-kpi-ic" aria-hidden="true"><i className={`lni ${k.icon}`}></i></span>
                        <span className="fd-kpi-lbl">{k.label}</span>
                      </span>
                      <span className="fd-kpi-num">{formatMoney(k.value)}</span>
                      <span className="fd-kpi-foot">{k.sub}</span>
                    </div>
                  ))}
                </div>
              )
              if (!withCharts) return kpiTiles
              return (
                <>
                  <div className="ss-overview">
                    {/* Chart 1: clearance donut — paid / outstanding / future as
                        separate arcs, with a legend that doubles as the figures. */}
                    {(() => {
                      const R = 40
                      const C = 2 * Math.PI * R
                      const segs = [
                        // Labels follow the fee-summary response: amountPaid, pendingFee.
                        { key: 'paid', label: 'Amount Paid', short: 'Paid', sub: `${paymentHistory.length} recorded ${paymentHistory.length === 1 ? 'payment' : 'payments'}`, value: totalPaid, color: 'var(--green)' },
                        { key: 'outstanding', label: 'Pending Fee', short: 'Pending', sub: currentOutstanding > 0 ? `${outstandingItems.length} pending ${outstandingItems.length === 1 ? 'due' : 'dues'}` : 'Nothing overdue', value: currentOutstanding, color: 'var(--red)' },
                        { key: 'future', label: 'Future Payments', short: 'Future', sub: `${futurePayments.length} upcoming ${futurePayments.length === 1 ? 'fee' : 'fees'}`, value: totalFuture, color: 'var(--b300)' },
                      ]
                      const drawn = segs.filter(s => s.value > 0)
                      const gap = drawn.length > 1 ? 1.6 : 0
                      let start = 0
                      const arcs = drawn.map(s => {
                        const len = (s.value / chartTotal) * C
                        const arc = { ...s, dash: Math.max(0, len - gap), offset: -start }
                        start += len
                        return arc
                      })
                      const pct = (v: number) => Math.round((v / chartTotal) * 100)
                      const focus = segs.find(s => s.key === hoveredChartSegment)
                      const cleared = balanceDueCurrent <= 0
                      return (
                        <div className="card mb-0 ss-panel ss-chart">
                          <div className="pcx-panel-hdr">
                            <div>
                              <h3 className="pcx-panel-title">Fee clearance</h3>
                              <p className="pcx-panel-sub">Share of everything assessed so far</p>
                            </div>
                            <span className={`pcx-pill ${cleared ? 'pcx-pill-green' : 'pcx-pill-amber'}`}>
                              <i className={`lni ${cleared ? 'lni-checkmark-circle' : 'lni-warning'}`} aria-hidden="true"></i>
                              {cleared ? 'Exam clearance eligible' : 'Fee clearance pending'}
                            </span>
                          </div>

                          <div className="ss-donut-wrap">
                            <div className="ss-donut">
                              <svg viewBox="0 0 100 100" role="img" aria-label={segs.map(s => `${s.label} ${pct(s.value)}%`).join(', ')}>
                                <circle cx="50" cy="50" r={R} className="ss-donut-track" />
                                {arcs.map(a => (
                                  <circle
                                    key={a.key}
                                    cx="50" cy="50" r={R}
                                    stroke={a.color}
                                    strokeDasharray={`${a.dash} ${C - a.dash}`}
                                    strokeDashoffset={a.offset}
                                    className={`ss-donut-arc${hoveredChartSegment && hoveredChartSegment !== a.key ? ' dim' : ''}`}
                                    onMouseEnter={() => setHoveredChartSegment(a.key)}
                                    onMouseLeave={() => setHoveredChartSegment(null)}
                                  />
                                ))}
                              </svg>
                              <div className="ss-donut-center" aria-hidden="true">
                                <span className="ss-donut-val">{focus ? pct(focus.value) : paidPercent}%</span>
                                {/* One-word label — the full name doesn't fit inside the ring. */}
                                <span className="ss-donut-lbl">{focus ? focus.short : 'Paid'}</span>
                              </div>
                            </div>

                            {/* The figures as the sum they are — paid + pending + future
                                = fee-summary's totalAmountToPay. One line on a wide card;
                                a receipt (operators in the gutter, rule above the total)
                                on a narrow one. */}
                            <div className="ss-eq">
                              {segs.map((s, i) => (
                                <Fragment key={s.key}>
                                  {i > 0 && <span className="ss-eq-op" aria-hidden="true">+</span>}
                                  <div
                                    className={`ss-eq-term${hoveredChartSegment === s.key ? ' active' : ''}`}
                                    onMouseEnter={() => setHoveredChartSegment(s.key)}
                                    onMouseLeave={() => setHoveredChartSegment(null)}
                                  >
                                    <span className="ss-eq-lbl">
                                      <span className="ss-eq-dot" style={{ background: s.color }} aria-hidden="true"></span>
                                      {s.label}
                                      <span className="ss-eq-pct">{pct(s.value)}%</span>
                                    </span>
                                    <span className={`ss-eq-amt${s.key === 'outstanding' && s.value > 0 ? ' is-due' : ''}`}>{formatMoney(s.value)}</span>
                                    <span className="ss-eq-sub">{s.sub}</span>
                                  </div>
                                </Fragment>
                              ))}
                              <span className="ss-eq-op" aria-hidden="true">=</span>
                              <div className="ss-eq-term is-total">
                                <span className="ss-eq-lbl">Total Amount to Pay</span>
                                <span className="ss-eq-amt">{formatMoney(feeSummary?.totalAmountToPay ?? totalPaid + currentOutstanding)}</span>
                                <span className="ss-eq-sub">{paidPercent}% cleared so far</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })()}
                  </div>

                  {/* Chart 2: one row per fee head — paid share of what that
                      head has billed so far. */}
                  {(() => {
                    const HEAD_ICONS: Record<string, string> = {
                      Tuition: 'lni-graduation', NCHE: 'lni-certificate', Guild: 'lni-users',
                      Advance: 'lni-coin', 'Application Fee': 'lni-files',
                    }
                    // One decimal, and never 100% while anything is still owed
                    // (99.96% would otherwise round up to "fully paid").
                    const pctOf = (paid: number, due: number) => {
                      const total = paid + due
                      if (due <= 0) return 100
                      return total > 0 ? Math.min(99.9, Math.round((paid / total) * 1000) / 10) : 0
                    }
                    const heads = categoryStats
                      .map(cat => ({ ...cat, total: cat.paid + cat.due, pct: pctOf(cat.paid, cat.due) }))
                      // Anything still owed first, largest balance on top.
                      .sort((a, b) => (b.due > 0 ? 1 : 0) - (a.due > 0 ? 1 : 0) || b.due - a.due)
                    const headsPaid = heads.reduce((s, c) => s + c.paid, 0)
                    const headsDue = heads.reduce((s, c) => s + Math.max(0, c.due), 0)
                    const headsTotal = headsPaid + headsDue
                    const overallPct = pctOf(headsPaid, headsDue)
                    const owingCount = heads.filter(h => h.due > 0).length
                    // return (
                    //   <div className="card ss-panel ss-chart ss-heads-card">
                    //     <div className="pcx-panel-hdr">
                    //       <div>
                    //         <h3 className="pcx-panel-title">Fee heads</h3>
                    //         <p className="pcx-panel-sub">How much of each fee category is paid</p>
                    //       </div>
                    //       <span className="pcx-chip">{heads.length} {heads.length === 1 ? 'head' : 'heads'}</span>
                    //     </div>

                    //     {heads.length === 0 ? (
                    //       <div className="ss-chart-empty">No fee heads billed yet</div>
                    //     ) : (
                    //       <>
                    //         <div className="ss-heads-sum">
                    //           <div className="ss-heads-sum-fig">
                    //             <span className="ss-heads-sum-pct">{overallPct}%</span>
                    //             <span className="ss-heads-sum-lbl">paid overall</span>
                    //           </div>
                    //           <div className="ss-heads-sum-body">
                    //             <div className="ss-heads-sum-bar" role="progressbar" aria-valuenow={overallPct} aria-valuemin={0} aria-valuemax={100} aria-label="Paid across all fee heads">
                    //               <span style={{ width: `${overallPct}%` }}></span>
                    //             </div>
                    //             <div className="ss-heads-sum-meta">
                    //               <span><b>{formatMoney(headsPaid)}</b> of {formatMoney(headsTotal)} billed</span>
                    //               <span className={headsDue > 0 ? 'ss-heads-sum-due' : 'ss-heads-sum-ok'}>
                    //                 {headsDue > 0
                    //                   ? `${formatMoney(headsDue)} outstanding on ${owingCount} ${owingCount === 1 ? 'head' : 'heads'}`
                    //                   : 'Every head settled'}
                    //               </span>
                    //             </div>
                    //           </div>
                    //         </div>

                    //         <ul className="ss-heads">
                    //           {heads.map(h => {
                    //             const settled = h.due <= 0
                    //             const tone = settled ? 'green' : h.paid > 0 ? 'amber' : 'red'
                    //             return (
                    //               <li key={h.label} className="ss-head">
                    //                 <span className={`ss-head-icon ss-tone-${tone}`} aria-hidden="true"><i className={`lni ${HEAD_ICONS[h.label] ?? 'lni-wallet'}`}></i></span>
                    //                 <span className="ss-head-txt">
                    //                   <span className="ss-head-name">{h.label}</span>
                    //                   <span className="ss-head-sub"><b>{formatMoney(h.paid)}</b> of {formatMoney(h.total)}</span>
                    //                 </span>
                    //                 <span className="ss-head-bar" role="progressbar" aria-valuenow={h.pct} aria-valuemin={0} aria-valuemax={100} aria-label={`${h.label} paid`}>
                    //                   <span className={`ss-tone-${tone}`} style={{ width: `${h.pct}%` }}></span>
                    //                 </span>
                    //                 <span className={`ss-head-pct ss-tone-${tone}`}>{h.pct}%</span>
                    //                 <span className={`ss-head-status ss-tone-${tone}`}>
                    //                   {settled ? (
                    //                     <><b><i className="lni lni-checkmark-circle" aria-hidden="true"></i> Settled</b><span>Nothing due</span></>
                    //                   ) : (
                    //                     <><b>{formatMoney(h.due)}</b><span>{h.paid > 0 ? 'still due' : 'not paid yet'}</span></>
                    //                   )}
                    //                 </span>
                    //               </li>
                    //             )
                    //           })}
                    //         </ul>
                    //       </>
                    //     )}
                    //   </div>
                    // )
                  })()}
                </>
              )
            })()}

            {/* ══════════════════════════════════════════════════════════════
                4. STATEMENT LEDGER TABS & TABLE (.card)
               ══════════════════════════════════════════════════════════════ */}
            {(viewMode === 'hybrid' || viewMode === 'official') && (
              <div className="card ss-ledger">
                {/* Underline tabs — one per statement list, each with its count. */}
                <div className="ss-tabs" role="tablist" aria-label="Statement lists">
                  {([
                    ['payments', 'lni-credit-cards', 'Payment History', paymentHistory.length],
                    ['outstanding', 'lni-wallet', 'Outstanding Items', outstandingItems.length],
                    ['future', 'lni-alarm-clock', 'Future Payments', futurePayments.length],
                  ] as const).map(([tab, icon, label, count]) => (
                    <button
                      key={tab}
                      type="button"
                      role="tab"
                      aria-selected={tableTab === tab}
                      className={`ss-tab${tableTab === tab ? ' active' : ''}`}
                      onClick={() => setTableTab(tab)}
                    >
                      <i className={`lni ${icon}`} />
                      <span>{label}</span>
                      <span className="ss-tab-count">{count}</span>
                    </button>
                  ))}
                </div>

                {/* Filter & grouping controls */}
                <div className="ss-toolbar">
                  <div className="flex items-center gap-2 flex-wrap">
                    <TableSearch
                      className="w-64"
                      placeholder="Filter records…"
                      value={tableSearch}
                      onChange={setTableSearch}
                    />

                    {(tableTab === 'payments' || tableTab === 'outstanding') && (
                      <SearchSelect
                        className="w-48"
                        options={CATEGORY_OPTIONS}
                        value={selectedCategory}
                        onChange={setSelectedCategory}
                        placeholder="All Categories"
                      />
                    )}
                  </div>

                  <div className="flex items-center gap-4 flex-wrap">
                    {groupBySemester && !tableSearch.trim() && (() => {
                      const groups = tableTab === 'payments' ? groupedPayments : tableTab === 'outstanding' ? groupedOutstanding : groupedFuture
                      if (groups.length < 2) return null
                      const keys = groups.map(g => `${tableTab}:${g.semester}`)
                      const allOpen = keys.every((k, i) => isGroupOpen(k, i === keys.length - 1))
                      return (
                        <button
                          type="button"
                          className="ss-grp-all"
                          onClick={() => setOpenGroups(prev => ({ ...prev, ...Object.fromEntries(keys.map(k => [k, !allOpen])) }))}
                        >
                          <i className={`lni ${allOpen ? 'lni-shrink' : 'lni-expand'}`} aria-hidden="true" />
                          {allOpen ? 'Collapse all' : 'Expand all'}
                        </button>
                      )
                    })()}
                    {tableTab === 'payments' && (
                      <button
                        type="button"
                        role="switch"
                        aria-checked={showAllCurrencies}
                        className="stmt-switch"
                        onClick={() => setShowAllCurrencies(prev => !prev)}
                        title="Show totals in each payment currency as well as USD"
                      >
                        <span className="stmt-switch-off">USD</span>
                        <span className="stmt-switch-track"><span className="stmt-switch-thumb" /></span>
                        <span className="stmt-switch-on">All Currencies</span>
                      </button>
                    )}
                    <button
                      type="button"
                      role="switch"
                      aria-checked={groupBySemester}
                      className="stmt-switch"
                      onClick={() => setGroupBySemester(prev => !prev)}
                      title="Group records by semester"
                    >
                      <span className="stmt-switch-off">All Records</span>
                      <span className="stmt-switch-track"><span className="stmt-switch-thumb" /></span>
                      <span className="stmt-switch-on">By Semester</span>
                    </button>
                  </div>
                </div>

                {/* Standard ERP Table inside ScrollTable */}
                <ScrollTable className="no-sticky-col stmt-tbl">
                  {/* Tab 1: Payment History */}
                  {tableTab === 'payments' && (
                    <table>
                      <thead>
                        <tr>
                          <th style={{ width: 44 }}></th>
                          <th style={{ width: 44, textAlign: 'center' }}>#</th>
                          <th>Payment · Date</th>
                          {!groupBySemester && <th>Semester</th>}
                          <th>Receipt · Method</th>
                          <th className="num">Amount</th>
                          <th className="num" title="Converted at the exchange rate on the payment date">Amount (USD)</th>
                          <th>Ledger</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredPayments.length === 0 ? (
                          <EmptyState
                            colSpan={groupBySemester ? 7 : 8}
                            title={tableSearch || selectedCategory !== 'all' ? 'No matching payments' : 'No payments recorded'}
                            subtitle={
                              tableSearch || selectedCategory !== 'all'
                                ? 'No payments match the active search or category filters. Try clearing them.'
                                : 'No payment transactions found for this student.'
                            }
                            hasFilters={!!tableSearch || selectedCategory !== 'all'}
                            onClearFilters={() => {
                              setTableSearch('')
                              setSelectedCategory('all')
                            }}
                          />
                        ) : groupBySemester ? (
                          groupedPayments.map((group, groupIdx) => {
                            const key = `payments:${group.semester}`
                            const isLast = groupIdx === groupedPayments.length - 1
                            return (
                              <Fragment key={group.semester || groupIdx}>
                                {renderGroupHeader(
                                  key, isLast, 7, 'lni-graduation',
                                  semesterLabel(group.semester) || group.semester,
                                  `${group.items.length} ${group.items.length === 1 ? 'payment' : 'payments'}`,
                                  <>{renderCurrencyBreakdown(group.items)}{renderUsdTotal(group.items)}</>,
                                )}
                                {isGroupOpen(key, isLast) && group.items.map((p, idx) => renderPaymentRow(p, runningNo(groupedPayments, groupIdx, idx), p.paymentGuid || `${groupIdx}-${idx}`, false))}
                              </Fragment>
                            )
                          })
                        ) : (
                          filteredPayments.map((p, idx) => renderPaymentRow(p, idx + 1,p.paymentGuid || String(idx), true))
                        )}
                      </tbody>
                    </table>
                  )}

                  {/* Tab 2: Outstanding Items */}
                  {tableTab === 'outstanding' && (
                    <table>
                      <thead>
                        <tr>
                          <th style={{ width: 44, textAlign: 'center' }}>#</th>
                          <th>Description</th>
                          <th>Semester</th>
                          <th>Category</th>
                          <th className="num">Outstanding</th>
                          <th>Currency</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredOutstanding.length === 0 ? (
                          <EmptyState
                            colSpan={6}
                            title={tableSearch || selectedCategory !== 'all' ? 'No matching items' : 'Fully settled'}
                            subtitle={
                              tableSearch || selectedCategory !== 'all'
                                ? 'No outstanding items match your active filters.'
                                : 'No outstanding fee assessments found for this student.'
                            }
                            hasFilters={!!tableSearch || selectedCategory !== 'all'}
                            onClearFilters={() => {
                              setTableSearch('')
                              setSelectedCategory('all')
                            }}
                          />
                        ) : groupBySemester ? (
                          groupedOutstanding.map((group, groupIdx) => {
                            const key = `outstanding:${group.semester}`
                            const isLast = groupIdx === groupedOutstanding.length - 1
                            return (
                            <Fragment key={group.semester || groupIdx}>
                              {renderGroupHeader(
                                key, isLast, 6, 'lni-wallet',
                                semesterLabel(group.semester) || group.semester,
                                `${group.items.length} ${group.items.length === 1 ? 'due' : 'dues'}`,
                                group.currencyTotals.map(ct => (
                                  <span key={ct.currency} className="stmt-total-chip is-due">
                                    <span>{ct.currency}</span>
                                    <span className="font-mono">{formatMoney(ct.total)}</span>
                                  </span>
                                )),
                              )}
                              {isGroupOpen(key, isLast) && group.items.map((o, idx) => (
                                <tr key={o.ledgerGuid || `${groupIdx}-${idx}`}>
                                  <td className="text-center text-g500">{runningNo(groupedOutstanding, groupIdx, idx)}</td>
                                  <td className="font-bold text-g900">{o.description || 'Fee Assessment'}</td>
                                  <td className="text-g700">{semesterLabel(o.semesterName || header?.semesterName) || '—'}</td>
                                  <td>{renderCategoryBadge(o.category)}</td>
                                  <td className="num font-mono font-bold text-red">
                                    {formatMoney(o.outstanding)}
                                  </td>
                                  <td>
                                    <span className="badge badge-grey">{o.currencyName || '—'}</span>
                                  </td>
                                </tr>
                              ))}
                            </Fragment>
                            )
                          })
                        ) : (
                          filteredOutstanding.map((o, idx) => (
                            <tr key={o.ledgerGuid || idx}>
                              <td className="text-center text-g500">{idx + 1}</td>
                              <td className="font-bold text-g900">{o.description || 'Fee Assessment'}</td>
                              <td className="text-g700">{semesterLabel(o.semesterName || header?.semesterName) || '—'}</td>
                              <td>{renderCategoryBadge(o.category)}</td>
                              <td className="num font-mono font-bold text-red">
                                {formatMoney(o.outstanding)}
                              </td>
                              <td>
                                <span className="badge badge-grey">{o.currencyName || '—'}</span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  )}

                  {/* Tab 3: Future Payments */}
                  {tableTab === 'future' && (
                    <table>
                      <thead>
                        <tr>
                          <th style={{ width: 44, textAlign: 'center' }}>#</th>
                          <th>Description</th>
                          <th>Semester</th>
                          <th className="num">Amount Due</th>
                          <th>Currency</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredFuture.length === 0 ? (
                          <EmptyState
                            colSpan={5}
                            title={tableSearch ? 'No matching scheduled items' : 'No future payments'}
                            subtitle={
                              tableSearch
                                ? 'No upcoming scheduled payments match your filter.'
                                : 'No future scheduled payments or assessments registered for this student.'
                            }
                            hasFilters={!!tableSearch}
                            onClearFilters={() => setTableSearch('')}
                          />
                        ) : groupBySemester ? (
                          groupedFuture.map((group, groupIdx) => {
                            const key = `future:${group.semester}`
                            const isLast = groupIdx === groupedFuture.length - 1
                            return (
                            <Fragment key={group.semester || groupIdx}>
                              {renderGroupHeader(
                                key, isLast, 5, 'lni-alarm-clock',
                                semesterLabel(group.semester) || group.semester,
                                `${group.items.length} scheduled`,
                                group.currencyTotals.map(ct => (
                                  <span key={ct.currency} className="stmt-total-chip">
                                    <span>{ct.currency}</span>
                                    <span className="font-mono">{formatMoney(ct.total)}</span>
                                  </span>
                                )),
                              )}
                              {isGroupOpen(key, isLast) && group.items.map((f, idx) => (
                                <tr key={f.slNo || `${groupIdx}-${idx}`}>
                                  <td className="text-center text-g500">{runningNo(groupedFuture, groupIdx, idx)}</td>
                                  <td className="font-bold text-g900">{f.description}</td>
                                  <td className="text-g700">{semesterLabel(f.semesterName) || '—'}</td>
                                  <td className="num font-mono font-bold text-g900">
                                    {formatMoney(f.amountDue)}
                                  </td>
                                  <td>
                                    <span className="badge badge-grey">{f.currencyName || 'US Dollar'}</span>
                                  </td>
                                </tr>
                              ))}
                            </Fragment>
                            )
                          })
                        ) : (
                          filteredFuture.map((f, idx) => (
                            <tr key={f.slNo || idx}>
                              <td className="text-center text-g500">{idx + 1}</td>
                              <td className="font-bold text-g900">{f.description}</td>
                              <td className="text-g700">{semesterLabel(f.semesterName) || '—'}</td>
                              <td className="num font-mono font-bold text-g900">
                                {formatMoney(f.amountDue)}
                              </td>
                              <td>
                                <span className="badge badge-grey">{f.currencyName || 'US Dollar'}</span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  )}
                </ScrollTable>

                {/* ── Active Tab Summary Footer Bar ─────────────────────── */}
                {tableTab === 'payments' && filteredPayments.length > 0 && (
                  <div className="ss-foot">
                    <div>
                      Showing <strong className="text-g900">{filteredPayments.length}</strong> of{' '}
                      <strong>{paymentHistory.length}</strong> payment records
                    </div>
                    <div className="flex items-center gap-3 flex-wrap justify-end">
                      {renderCurrencyBreakdown(filteredPayments)}
                      {renderUsdTotal(filteredPayments)}
                    </div>
                  </div>
                )}

                {tableTab === 'outstanding' && filteredOutstanding.length > 0 && (
                  <div className="ss-foot">
                    <div>
                      Showing <strong className="text-g900">{filteredOutstanding.length}</strong> of{' '}
                      <strong>{outstandingItems.length}</strong> outstanding items
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-g700">Total Current Outstanding:</span>
                      <span className="font-mono font-bold text-red">
                        {sumByCurrency(filteredOutstanding, 'outstanding')
                          .map(c => `${c.currency} ${c.total.toLocaleString()}`)
                          .join(' • ') || '0.00'}
                      </span>
                    </div>
                  </div>
                )}

                {tableTab === 'future' && filteredFuture.length > 0 && (
                  <div className="ss-foot">
                    <div>
                      Showing <strong className="text-g900">{filteredFuture.length}</strong> of{' '}
                      <strong>{futurePayments.length}</strong> future payments
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-g700">Total Future Due:</span>
                      <span className="font-mono font-bold text-blue">
                        {formatMoney(filteredFuture.reduce((acc, item) => acc + (item.amountDue || 0), 0))}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Official Receipt Modal (same as Payment History) */}
      <ViewPaymentReceiptModal
        isOpen={!!receiptEntry}
        onClose={closeReceipt}
        entry={receiptEntry}
        autoPrint={autoPrint}
        showToast={showToast}
      />

      <Toast toast={toast} />
    </>
  )
}
