'use client'
import { useState, useMemo, Fragment } from 'react'
import { ScrollTable } from '@/components/ScrollTable'
import { TableSearch } from '@/components/TableSearch'
import { Toast } from '@/components/Toast'
import { useStudentStatementSearch, useStudentStatement, useStudentFeeSummary } from '@/hooks/student/useStudentStatement'
import { getStudentStatementPdfUrl } from '@/lib/api/student/studentStatement'
import { PAYMENT_CATEGORY_LABELS } from '@/lib/api/finance/paymentConsole'

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
    const rawCur = r.currencyName?.trim()
    const cur = !rawCur || rawCur === '—' ? 'UGX' : rawCur
    const val = (field === 'amount' ? r.amount : field === 'outstanding' ? r.outstanding : r.amountDue) ?? 0
    byCurrency.set(cur, (byCurrency.get(cur) ?? 0) + val)
  }
  return [...byCurrency.entries()].map(([currency, total]) => ({ currency, total }))
}

function getCategoryStyle(category?: number | null) {
  switch (category) {
    case 3: // NCHE
      return {
        badgeBg: 'bg-emerald-100 text-emerald-900 border-emerald-300',
        dotBg: 'bg-emerald-600',
        cellBg: 'bg-emerald-50/40',
        label: 'NCHE',
      }
    case 4: // Guild
      return {
        badgeBg: 'bg-amber-100 text-amber-900 border-amber-300',
        dotBg: 'bg-amber-500',
        cellBg: 'bg-amber-50/40',
        label: 'Guild',
      }
    case 1: // Tuition
      return {
        badgeBg: 'bg-blue-50 text-[#1b365d] border-blue-200',
        dotBg: 'bg-[#22558c]',
        cellBg: '',
        label: 'Tuition',
      }
    case 5: // Advance Deposit
      return {
        badgeBg: 'bg-indigo-50 text-indigo-900 border-indigo-200',
        dotBg: 'bg-indigo-600',
        cellBg: '',
        label: 'Advance Deposit',
      }
    default:
      return {
        badgeBg: 'bg-slate-100 text-slate-700 border-slate-200',
        dotBg: 'bg-slate-400',
        cellBg: '',
        label: (category != null ? PAYMENT_CATEGORY_LABELS[category] : null) || 'Other',
      }
  }
}

function renderCategoryBadge(category?: number | null) {
  const style = getCategoryStyle(category)
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border shadow-2xs ${style.badgeBg}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${style.dotBg}`} />
      {style.label}
    </span>
  )
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

  // Summary totals
  const { data: feeSummary } = useStudentFeeSummary(selectedGuid)

  const totalPaid = feeSummary?.amountPaid ?? paymentHistory.reduce((acc, p) => acc + (p.amount || 0), 0)
  const currentOutstanding = feeSummary?.pendingFee ?? outstandingItems.reduce((acc, o) => acc + (o.outstanding || 0), 0)
  const totalFuture = futurePayments.reduce((acc, f) => acc + (f.amountDue || 0), 0)
  const balanceDueCurrent = currentOutstanding - totalPaid

  // Clearance percentage
  const totalBilled = (feeSummary?.totalAmountToPay ?? (totalPaid + currentOutstanding)) || 1
  const paidPercent = Math.min(100, Math.max(0, Math.round((totalPaid / totalBilled) * 100)))

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
  const paidAngle = (totalPaid / chartTotal) * 360
  const outstandingAngle = (currentOutstanding / chartTotal) * 360
  const futureAngle = (totalFuture / chartTotal) * 360

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
        {/* ── Top Bar with Actions & View Mode Toggle ────────────────── */}
        <div className="pg-hdr flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="badge badge-blue">Finance ERP</span>
              <span className="text-xs text-g400">• Official Student Ledger</span>
            </div>
            <div className="pg-title flex items-center gap-2.5">
              <i className="lni lni-wallet text-b700 text-xl" />
              Student Financial Statement
            </div>
            <div className="pg-sub">Accredited university ledger, clearance analytics, and payment tracking</div>
          </div>

          <div className="flex items-center gap-3">
            {/* View Mode Switcher */}
            <div className="flex items-center p-1 bg-g200/70 rounded-xl">
              <button
                type="button"
                onClick={() => setViewMode('hybrid')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  viewMode === 'hybrid' ? 'bg-white text-g900 shadow-sm' : 'text-g600 hover:text-g900'
                }`}
              >
                <i className="lni lni-grid-alt" />
                <span>Executive (Charts + Tables)</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('charts')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  viewMode === 'charts' ? 'bg-white text-g900 shadow-sm' : 'text-g600 hover:text-g900'
                }`}
              >
                <i className="lni lni-pie-chart" />
                <span>Visual Analytics</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('official')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  viewMode === 'official' ? 'bg-white text-g900 shadow-sm' : 'text-g600 hover:text-g900'
                }`}
              >
                <i className="lni lni-files" />
                <span>Official Document View</span>
              </button>
            </div>

            {/* Action Buttons */}
            <button
              className="btn btn-neu btn-sm flex items-center gap-1.5"
              onClick={() => window.print()}
              disabled={!selectedGuid}
              title="Print official statement"
            >
              <i className="lni lni-printer" />
              <span>Print</span>
            </button>

            <button
              className="btn btn-primary btn-sm flex items-center gap-1.5 shadow-sm"
              onClick={() => {
                if (selectedGuid) {
                  window.open(getStudentStatementPdfUrl(selectedGuid), '_blank')
                  showToast('Downloading official signed PDF…', 'success')
                }
              }}
              disabled={!selectedGuid}
              title="Download signed PDF statement"
            >
              <i className="lni lni-download" />
              <span>PDF</span>
            </button>
          </div>
        </div>

        {/* ── Student Search Bar ─────────────────────────────────────── */}
        <div className="card shadow-sm p-3.5 mb-5 border border-g200">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <TableSearch
                value={term}
                onChange={v => {
                  setTerm(v)
                  setSelectedGuid(null)
                }}
                placeholder="Search student by Name, Reg No (e.g. 011240104), or Programme…"
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
            {selectedGuid && (
              <button
                type="button"
                className="btn btn-neu btn-sm flex items-center gap-1.5 shrink-0"
                onClick={handleClearStudent}
              >
                <i className="lni lni-reload" />
                <span>Change Student</span>
              </button>
            )}
          </div>
        </div>

        {/* ── Main Viewport ─────────────────────────────────────────── */}
        {!selectedGuid ? (
          <div className="card p-14 text-center border-dashed border-2 border-g200 bg-white">
            <div
              className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center text-b700"
              style={{ background: 'linear-gradient(135deg, var(--b50), var(--b100))', fontSize: 30 }}
            >
              <i className="lni lni-files" />
            </div>
            <h2 className="text-base font-semibold text-g900 mb-1.5">No Student Statement Loaded</h2>
            <p className="text-sm text-g500 max-w-md mx-auto mb-4">
              Click the search box above to choose an enrolled student by Name or Registration Number to load their real-time fee statement and payment history.
            </p>
            <div className="inline-flex items-center gap-2 py-1.5 px-3 rounded-lg bg-g100 text-xs text-g600">
              <i className="lni lni-bulb text-amber" />
              <span>Tip: Try searching "011240104" or "Ashfa" to test with live records.</span>
            </div>
          </div>
        ) : isStatementLoading ? (
          <div className="card p-14 text-center">
            <div className="inline-flex items-center gap-3 text-sm text-g500">
              <i className="lni lni-spinner-arrow animate-spin text-b700" style={{ fontSize: 24 }} />
              <span>Fetching student financial statement, ledgers, and transactions…</span>
            </div>
          </div>
        ) : isStatementError || !header ? (
          <div className="card p-8 text-center border border-red-200 bg-red-50/50">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-red-100 flex items-center justify-center text-red-600">
              <i className="lni lni-warning text-xl" />
            </div>
            <h3 className="text-sm font-semibold text-red-800 mb-1">Failed to Load Statement</h3>
            <p className="text-xs text-red-600 mb-4">
              {statementError instanceof Error && statementError.message && statementError.message !== 'not_found'
                ? statementError.message
                : "Unable to retrieve the student's statement records."}
            </p>
            <button className="btn btn-neu btn-sm" onClick={handleClearStudent}>
              Search Another Student
            </button>
          </div>
        ) : (
          <div className="statement-workspace space-y-6">
            {/* ══════════════════════════════════════════════════════════════
                1. OFFICIAL STATEMENT HEADER & STUDENT CARD (Matching Reference)
               ══════════════════════════════════════════════════════════════ */}
            <div className="rounded-xl overflow-hidden shadow-sm border border-[#1b365d]/20 bg-white">
              {/* Dark Blue Header Banner - Compact */}
              <div
                className="px-4 py-2.5 flex items-center justify-between"
                style={{ background: 'linear-gradient(90deg, #122744 0%, #1b365d 100%)', color: '#ffffff' }}
              >
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-base tracking-tight uppercase" style={{ letterSpacing: '0.03em' }}>
                    ISBAT University
                  </span>
                </div>
                <div className="italic text-xs text-blue-100 font-medium">Student Financial Statement</div>
              </div>

              {/* Student Information Details Box - Compact */}
              <div className="p-3.5 border-b border-[#2d5282]/30 bg-[#f8fbfe]">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-y-2 gap-x-4 text-xs">
                  {/* Col 1 */}
                  <div>
                    <div className="text-[#3b608e] font-semibold text-[11px] mb-0.5">Student Name</div>
                    <div className="text-g900 font-extrabold text-xs tracking-tight">{header.studentName || '—'}</div>
                    <div className="text-[#3b608e] font-semibold text-[11px] mt-1.5 mb-0.5">Program</div>
                    <div className="text-g800 font-bold text-xs leading-snug">{header.programName || '—'}</div>
                  </div>

                  {/* Col 2 */}
                  <div>
                    <div className="text-[#3b608e] font-semibold text-[11px] mb-0.5">Reg No</div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-g900 font-extrabold text-xs">{header.studentRegNo || '—'}</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(header.studentRegNo || '', 'Reg No')}
                        className="text-[#3b608e] hover:text-[#1b365d]"
                        title="Copy Reg No"
                      >
                        <i className="lni lni-clipboard text-[11px]" />
                      </button>
                    </div>
                    <div className="text-[#3b608e] font-semibold text-[11px] mt-1.5 mb-0.5">Batch</div>
                    <div className="text-g800 font-bold font-mono text-xs">{header.batchCode || '—'}</div>
                  </div>

                  {/* Col 3 */}
                  <div>
                    <div className="text-[#3b608e] font-semibold text-[11px] mb-0.5">Student No</div>
                    <div className="font-mono text-g900 font-extrabold text-xs">{header.studentNum || header.studentRegNo || '—'}</div>
                    <div className="text-[#3b608e] font-semibold text-[11px] mt-1.5 mb-0.5">Semester</div>
                    <div className="text-g800 font-bold text-xs">{header.semesterName || '—'}</div>
                  </div>

                  {/* Col 4 */}
                  <div>
                    <div className="text-[#3b608e] font-semibold text-[11px] mb-0.5">App Ref</div>
                    <div className="font-mono text-g900 font-extrabold text-xs">{header.appRefNo || '—'}</div>
                    <div className="text-[#3b608e] font-semibold text-[11px] mt-1.5 mb-0.5">Admission Type</div>
                    <div className="text-g800 font-bold text-xs">{header.admissionTypeLabel || 'Regular Student'}</div>
                  </div>
                </div>
              </div>

              {/* Dark Blue Summary Banner - Compact */}
              <div
                className="px-4 py-2.5 grid grid-cols-2 md:grid-cols-4 gap-3 text-white"
                style={{ background: '#122744' }}
              >
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-blue-200 font-semibold mb-0.5">Total Paid</div>
                  <div className="text-base font-extrabold tracking-tight">{formatMoney(totalPaid)}</div>
                </div>

                <div>
                  <div className="text-[10px] uppercase tracking-wider text-blue-200 font-semibold mb-0.5">Current Outstanding</div>
                  <div className="text-base font-extrabold tracking-tight">{formatMoney(currentOutstanding)}</div>
                </div>

                <div>
                  <div className="text-[10px] uppercase tracking-wider text-blue-200 font-semibold mb-0.5">Future Payments</div>
                  <div className="text-base font-extrabold tracking-tight">{formatMoney(totalFuture)}</div>
                </div>

                <div>
                  <div className="text-[10px] uppercase tracking-wider text-blue-200 font-semibold mb-0.5">Balance Due (Current)</div>
                  <div className={`text-base font-extrabold tracking-tight ${balanceDueCurrent <= 0 ? 'text-[#4ade80]' : 'text-[#f87171]'}`}>
                    {formatMoney(balanceDueCurrent)}
                  </div>
                </div>
              </div>
            </div>

            {/* ══════════════════════════════════════════════════════════════
                2. INTERACTIVE CHARTS & VISUAL ANALYTICS (Compact Size)
               ══════════════════════════════════════════════════════════════ */}
            {(viewMode === 'hybrid' || viewMode === 'charts') && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-g800">
                      Visual Financial Analytics & Clearance Breakdown
                    </h3>
                  </div>
                  <span className="text-[11px] text-g400">Live graphical reconciliation</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Chart 1: Donut Clearance & Balance Ring - Compact */}
                  <div className="card p-3.5 shadow-sm border border-g200 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-1">
                      <div>
                        <h4 className="font-bold text-xs text-g900">Fee Clearance Ratio</h4>
                        <p className="text-[11px] text-g400">Paid vs. Outstanding vs. Future</p>
                      </div>
                      <span className="badge badge-green text-[10px] py-0 px-2">{paidPercent}% Cleared</span>
                    </div>

                    {/* SVG Interactive Ring Chart - Compact */}
                    <div className="relative py-2 flex items-center justify-center">
                      <svg width="140" height="140" viewBox="0 0 100 100" className="transform -rotate-90">
                        {/* Background ring */}
                        <circle cx="50" cy="50" r="38" stroke="#f1f5f9" strokeWidth="10" fill="transparent" />

                        {/* Total Paid arc (Emerald) */}
                        <circle
                          cx="50"
                          cy="50"
                          r="38"
                          stroke="#10b981"
                          strokeWidth="10"
                          strokeDasharray="238.76"
                          strokeDashoffset={238.76 - (238.76 * totalPaid) / chartTotal}
                          strokeLinecap="round"
                          fill="transparent"
                          className="transition-all duration-700 cursor-pointer hover:stroke-[12]"
                          onMouseEnter={() => setHoveredChartSegment('paid')}
                          onMouseLeave={() => setHoveredChartSegment(null)}
                        />

                        {/* Outstanding arc (Coral Red) */}
                        <circle
                          cx="50"
                          cy="50"
                          r="38"
                          stroke="#ef4444"
                          strokeWidth="10"
                          strokeDasharray="238.76"
                          strokeDashoffset={238.76 - (238.76 * currentOutstanding) / chartTotal}
                          style={{
                            strokeDashoffset: `${238.76 - (238.76 * (totalPaid + currentOutstanding)) / chartTotal}`,
                          }}
                          strokeLinecap="round"
                          fill="transparent"
                          className="transition-all duration-700 cursor-pointer hover:stroke-[12]"
                          onMouseEnter={() => setHoveredChartSegment('outstanding')}
                          onMouseLeave={() => setHoveredChartSegment(null)}
                        />
                      </svg>

                      {/* Inner Ring Data Badge */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                        <span className="text-xl font-extrabold text-g900 tracking-tight">{paidPercent}%</span>
                        <span className="text-[10px] font-semibold text-g400 uppercase tracking-wide">
                          {hoveredChartSegment === 'paid'
                            ? 'Paid Total'
                            : hoveredChartSegment === 'outstanding'
                            ? 'Pending'
                            : 'Settled'}
                        </span>
                      </div>
                    </div>

                    {/* Legend - Compact */}
                    <div className="space-y-1 pt-1.5 border-t border-g100 text-[11px]">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-g600">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" /> Total Paid
                        </span>
                        <span className="font-bold text-g900">{formatMoney(totalPaid)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-g600">
                          <span className="w-2 h-2 rounded-full bg-red-500" /> Current Outstanding
                        </span>
                        <span className="font-bold text-red-600">{formatMoney(currentOutstanding)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-g600">
                          <span className="w-2 h-2 rounded-full bg-blue-500" /> Future Assessments
                        </span>
                        <span className="font-bold text-g800">{formatMoney(totalFuture)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Chart 2: Category Distribution Breakdown - Compact */}
                  <div className="card p-3.5 shadow-sm border border-g200 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-bold text-xs text-g900">Fee Head Allocation</h4>
                        <span className="text-[10px] text-g400">{categoryStats.length} Heads</span>
                      </div>
                      <p className="text-[11px] text-g400 mb-2.5">Paid vs. Outstanding across categories</p>

                      <div className="space-y-2">
                        {categoryStats.length === 0 ? (
                          <div className="py-6 text-center text-xs text-g400">No category breakdown available</div>
                        ) : (
                          categoryStats.map(cat => {
                            const total = (cat.paid + cat.due) || 1
                            const catPaidPct = Math.round((cat.paid / total) * 100)
                            return (
                              <div key={cat.label} className="text-[11px]">
                                <div className="flex items-center justify-between font-semibold text-g800 mb-0.5">
                                  <span>{cat.label}</span>
                                  <span className="text-g400 font-mono text-[10px]">
                                    {cat.paid.toLocaleString()} / {(cat.paid + cat.due).toLocaleString()}
                                  </span>
                                </div>
                                <div className="w-full bg-g100 h-1.5 rounded-full overflow-hidden flex">
                                  <div
                                    className="h-full bg-emerald-500 transition-all duration-500"
                                    style={{ width: `${catPaidPct}%` }}
                                    title={`Paid: ${cat.paid.toLocaleString()} (${catPaidPct}%)`}
                                  />
                                  <div
                                    className="h-full bg-red-400 transition-all duration-500"
                                    style={{ width: `${100 - catPaidPct}%` }}
                                    title={`Outstanding: ${cat.due.toLocaleString()}`}
                                  />
                                </div>
                              </div>
                            )
                          })
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-center gap-3 pt-2 border-t border-g100 text-[10px] text-g500">
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded bg-emerald-500" /> Settled
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded bg-red-400" /> Balance Remaining
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ══════════════════════════════════════════════════════════════
                3. SINGLE UNIFIED TABLE WITH TABS (Dynamic Content Switcher)
               ══════════════════════════════════════════════════════════════ */}
            {(viewMode === 'hybrid' || viewMode === 'official') && (
              <div className="space-y-3">
                <div className="rounded-xl overflow-hidden shadow-sm border border-g200 bg-white">
                  {/* Top Tab Bar & Filter Controls */}
                  <div className="flex flex-wrap items-center justify-between border-b border-g200 bg-g50/80 px-3.5 py-2 gap-2.5">
                    {/* Tabs on Left */}
                    <div className="flex items-center gap-1 p-1 bg-g200/70 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setTableTab('payments')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                          tableTab === 'payments'
                            ? 'bg-[#1b365d] text-white shadow-sm'
                            : 'text-g700 hover:text-g900 hover:bg-white/60'
                        }`}
                      >
                        <i className="lni lni-credit-cards" />
                        <span>Payment History</span>
                        <span
                          className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                            tableTab === 'payments' ? 'bg-white/20 text-white' : 'bg-g200 text-g800'
                          }`}
                        >
                          {paymentHistory.length}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setTableTab('outstanding')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                          tableTab === 'outstanding'
                            ? 'bg-[#1b365d] text-white shadow-sm'
                            : 'text-g700 hover:text-g900 hover:bg-white/60'
                        }`}
                      >
                        <i className="lni lni-wallet" />
                        <span>Outstanding Items</span>
                        <span
                          className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                            tableTab === 'outstanding' ? 'bg-white/20 text-white' : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {outstandingItems.length}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setTableTab('future')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                          tableTab === 'future'
                            ? 'bg-[#1b365d] text-white shadow-sm'
                            : 'text-g700 hover:text-g900 hover:bg-white/60'
                        }`}
                      >
                        <i className="lni lni-alarm-clock" />
                        <span>Future Payments</span>
                        <span
                          className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                            tableTab === 'future' ? 'bg-white/20 text-white' : 'bg-blue-100 text-[#1b365d]'
                          }`}
                        >
                          {futurePayments.length}
                        </span>
                      </button>
                    </div>

                    {/* Search, Grouping & Category Filter Controls on Right */}
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <input
                          type="text"
                          className="form-input text-xs pl-7 pr-3 py-1 rounded-lg w-40 focus:w-52 transition-all border-g300 bg-white"
                          placeholder="Filter records…"
                          value={tableSearch}
                          onChange={e => setTableSearch(e.target.value)}
                        />
                        <i className="lni lni-search absolute left-2 top-1/2 -translate-y-1/2 text-g400 text-xs" />
                      </div>

                      {(tableTab === 'payments' || tableTab === 'outstanding') && (
                        <select
                          className="form-select text-xs py-1 px-2.5 rounded-lg border-g300 bg-white font-medium shadow-2xs"
                          value={selectedCategory}
                          onChange={e => setSelectedCategory(e.target.value)}
                        >
                          <option value="all">All Categories</option>
                          <option value="1">Tuition Fee Only</option>
                          <option value="3">NCHE Fee Only (Emerald)</option>
                          <option value="4">Guild Fee Only (Amber)</option>
                          <option value="5">Advance Deposit</option>
                        </select>
                      )}

                      {/* Group by Semester Toggle */}
                      <button
                        type="button"
                        onClick={() => setGroupBySemester(prev => !prev)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all border ${
                          groupBySemester
                            ? 'bg-[#1b365d] text-white border-[#1b365d] shadow-xs'
                            : 'bg-white text-g700 border-g300 hover:bg-g100'
                        }`}
                        title="Toggle grouping records by semester"
                      >
                        <i className="lni lni-layers text-xs" />
                        <span>Group by Semester</span>
                        {groupBySemester && <i className="lni lni-checkmark text-[10px]" />}
                      </button>
                    </div>
                  </div>

                  {/* ── Single Dynamic Table Content with Slider ─────────────── */}
                  <ScrollTable className="no-sticky-col">
                    {/* Tab 1: Payment History */}
                    {tableTab === 'payments' && (
                      <table className="w-full text-left text-xs border-collapse" style={{ minWidth: 1240 }}>
                        <thead>
                          <tr style={{ background: '#22558c', color: '#ffffff' }}>
                            <th className="py-3 px-4 w-14 text-center font-bold text-white text-[11px] uppercase tracking-wider">#</th>
                            <th className="py-3 px-4 min-w-[170px] font-bold text-white text-[11px] uppercase tracking-wider">Payment Code</th>
                            <th className="py-3 px-4 min-w-[130px] font-bold text-white text-[11px] uppercase tracking-wider whitespace-nowrap">Date</th>
                            <th className="py-3 px-4 min-w-[220px] font-bold text-white text-[11px] uppercase tracking-wider bg-[#1d4674]">Semester</th>
                            <th className="py-3 px-4 min-w-[110px] font-bold text-white text-[11px] uppercase tracking-wider">Pay Type</th>
                            <th className="py-3 px-4 min-w-[120px] font-bold text-white text-[11px] uppercase tracking-wider">Receipt</th>
                            <th className="py-3 px-4 min-w-[140px] text-right font-bold text-white text-[11px] uppercase tracking-wider">Amount</th>
                            <th className="py-3 px-4 min-w-[140px] font-bold text-white text-[11px] uppercase tracking-wider">Currency</th>
                            <th className="py-3 px-4 min-w-[120px] font-bold text-white text-[11px] uppercase tracking-wider">Category</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredPayments.length === 0 ? (
                            <tr>
                              <td colSpan={9} className="py-12 text-center text-g400 text-xs">
                                No payment history found for this selection.
                              </td>
                            </tr>
                          ) : groupBySemester ? (
                            groupedPayments.map((group, groupIdx) => (
                              <Fragment key={group.semester || groupIdx}>
                                {/* Semester Group Header Row */}
                                <tr className="bg-gradient-to-r from-[#e9f2fb] via-[#f1f6fc] to-[#e9f2fb] border-t-2 border-b border-[#22558c]/40 font-semibold">
                                  <td colSpan={9} className="py-2.5 px-4">
                                    <div className="flex items-center gap-2.5">
                                      <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-[#22558c] text-white text-xs shadow-xs">
                                        <i className="lni lni-graduation" />
                                      </span>
                                      <span className="font-extrabold text-xs md:text-sm text-[#1b365d] tracking-wide">
                                        {group.semester}
                                      </span>
                                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white text-[#22558c] border border-[#22558c]/20 shadow-xs">
                                        {group.items.length} {group.items.length === 1 ? 'Record' : 'Records'}
                                      </span>
                                    </div>
                                  </td>
                                </tr>

                                {/* Rows in this Semester */}
                                {group.items.map((p, idx) => (
                                  <tr
                                    key={p.paymentGuid || `${groupIdx}-${idx}`}
                                    className={`border-b border-g100 transition-colors ${
                                      idx % 2 === 1 ? 'bg-[#f8fafc]' : 'bg-white'
                                    } hover:bg-blue-50/50`}
                                  >
                                    <td className="py-2.5 px-4 text-center text-g500">{p.slNo || idx + 1}</td>
                                    <td className="py-2.5 px-4 font-mono text-g700 font-medium">
                                      {p.paymentCode || '—'}
                                    </td>
                                    <td className="py-2.5 px-4 whitespace-nowrap text-g800">
                                      {p.payDate ? new Date(p.payDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                                    </td>
                                    <td className="py-2.5 px-4 font-medium text-b800 bg-[#eef4fb]">
                                      {p.semesterName || header?.semesterName || '—'}
                                    </td>
                                    <td className="py-2.5 px-4 text-g700">{p.payType || '—'}</td>
                                    <td className="py-2.5 px-4 font-mono text-g800 font-semibold">{p.receipt || '—'}</td>
                                    <td className="py-2.5 px-4 text-right font-bold text-g900 font-mono whitespace-nowrap">
                                      {formatMoney(p.amount)}
                                    </td>
                                    <td className="py-2.5 px-4 text-g700">{p.currencyName || '—'}</td>
                                    <td className={`py-2.5 px-4 font-semibold ${getCategoryStyle(p.category).cellBg}`}>
                                      {renderCategoryBadge(p.category)}
                                    </td>
                                  </tr>
                                ))}

                                {/* Section Subtotal Row at Bottom of Semester - Single Row Highlighted */}
                                <tr className="bg-gradient-to-r from-[#d6e7f8] via-[#eaf2fb] to-[#d6e7f8] border-t-2 border-b-2 border-[#1b365d] shadow-sm text-xs whitespace-nowrap">
                                  <td colSpan={9} className="py-3 px-4">
                                    <div className="flex items-center justify-between gap-4 flex-nowrap">
                                      {/* Left: Total Badge & Semester */}
                                      <div className="flex items-center gap-3 shrink-0">
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#1b365d] text-white font-black text-xs uppercase tracking-wider shadow-sm">
                                          <i className="lni lni-calculator text-blue-200 text-xs" />
                                          SEMESTER TOTAL
                                        </span>
                                        <span className="font-bold text-g700 text-xs">
                                          for <span className="text-[#1b365d] font-black text-sm tracking-tight">{group.semester}</span>:
                                        </span>
                                      </div>

                                      {/* Right: Currency totals in single line - Highlighted Cards */}
                                      <div className="flex items-center gap-2.5 shrink-0">
                                        {group.currencyTotals.map(ct => (
                                          <div
                                            key={ct.currency}
                                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border-2 border-[#1b365d] shadow-xs hover:shadow transition-all"
                                          >
                                            <span className="text-[11px] font-sans font-black uppercase tracking-wider text-[#1b365d] flex items-center gap-1.5">
                                              <span className="w-2 h-2 rounded-full bg-[#22558c]" />
                                              {ct.currency} Total:
                                            </span>
                                            <span className="font-mono text-sm font-black text-[#1b365d] bg-[#eaf2fb] px-2.5 py-0.5 rounded border border-[#22558c]/30 shadow-inner">
                                              {formatMoney(ct.total)}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              </Fragment>
                            ))
                          ) : (
                            filteredPayments.map((p, idx) => (
                              <tr
                                key={p.paymentGuid || idx}
                                className={`border-b border-g100 transition-colors ${
                                  idx % 2 === 1 ? 'bg-[#f4f8fc]' : 'bg-white'
                                } hover:bg-blue-50/50`}
                              >
                                <td className="py-2.5 px-4 text-center text-g500">{p.slNo || idx + 1}</td>
                                <td className="py-2.5 px-4 font-mono text-g700 font-medium">
                                  {p.paymentCode || '—'}
                                </td>
                                <td className="py-2.5 px-4 whitespace-nowrap text-g800">
                                  {p.payDate ? new Date(p.payDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                                </td>
                                <td className="py-2.5 px-4 font-medium text-b800 bg-[#eef4fb]">
                                  {p.semesterName || header?.semesterName || '—'}
                                </td>
                                <td className="py-2.5 px-4 text-g700">{p.payType || '—'}</td>
                                <td className="py-2.5 px-4 font-mono text-g800 font-semibold">{p.receipt || '—'}</td>
                                <td className="py-2.5 px-4 text-right font-bold text-g900 font-mono whitespace-nowrap">
                                  {formatMoney(p.amount)}
                                </td>
                                <td className="py-2.5 px-4 text-g700">{p.currencyName || '—'}</td>
                                <td className={`py-2.5 px-4 font-semibold ${getCategoryStyle(p.category).cellBg}`}>
                                  {renderCategoryBadge(p.category)}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    )}

                    {/* Tab 2: Outstanding Items */}
                    {tableTab === 'outstanding' && (
                      <table className="w-full text-left text-xs border-collapse" style={{ minWidth: 980 }}>
                        <thead>
                          <tr style={{ background: '#22558c', color: '#ffffff' }}>
                            <th className="py-3 px-4 w-14 text-center font-bold text-white text-[11px] uppercase tracking-wider">#</th>
                            <th className="py-3 px-4 min-w-[260px] font-bold text-white text-[11px] uppercase tracking-wider">Description</th>
                            <th className="py-3 px-4 min-w-[220px] font-bold text-white text-[11px] uppercase tracking-wider">Semester</th>
                            <th className="py-3 px-4 min-w-[130px] font-bold text-white text-[11px] uppercase tracking-wider">Category</th>
                            <th className="py-3 px-4 min-w-[160px] text-right font-bold text-white text-[11px] uppercase tracking-wider">Outstanding</th>
                            <th className="py-3 px-4 min-w-[140px] font-bold text-white text-[11px] uppercase tracking-wider">Currency</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredOutstanding.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="py-12 text-center text-g400 text-xs">
                                Fully settled — No outstanding items found.
                              </td>
                            </tr>
                          ) : groupBySemester ? (
                            groupedOutstanding.map((group, groupIdx) => (
                              <Fragment key={group.semester || groupIdx}>
                                {/* Semester Group Header Row */}
                                <tr className="bg-gradient-to-r from-[#fee2e2]/40 via-[#fef2f2] to-[#fee2e2]/40 border-t-2 border-b border-red-300 font-semibold">
                                  <td colSpan={6} className="py-2.5 px-4">
                                    <div className="flex items-center gap-2.5">
                                      <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-red-600 text-white text-xs shadow-xs">
                                        <i className="lni lni-wallet" />
                                      </span>
                                      <span className="font-extrabold text-xs md:text-sm text-red-950 tracking-wide">
                                        {group.semester}
                                      </span>
                                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white text-red-700 border border-red-200 shadow-xs">
                                        {group.items.length} {group.items.length === 1 ? 'Due' : 'Dues'}
                                      </span>
                                    </div>
                                  </td>
                                </tr>

                                {/* Rows in this Semester */}
                                {group.items.map((o, idx) => (
                                  <tr
                                    key={o.ledgerGuid || `${groupIdx}-${idx}`}
                                    className={`border-b border-g100 transition-colors ${
                                      idx % 2 === 1 ? 'bg-[#f8fafc]' : 'bg-white'
                                    } hover:bg-red-50/30`}
                                  >
                                    <td className="py-2.5 px-4 text-center text-g500">{o.slNo || idx + 1}</td>
                                    <td className="py-2.5 px-4 font-bold text-g900">{o.description || 'Fee Assessment'}</td>
                                    <td className="py-2.5 px-4 text-g700">{o.semesterName || header?.semesterName || '—'}</td>
                                    <td className={`py-2.5 px-4 font-semibold ${getCategoryStyle(o.category).cellBg}`}>
                                      {renderCategoryBadge(o.category)}
                                    </td>
                                    <td className="py-2.5 px-4 text-right font-bold text-red-600 font-mono whitespace-nowrap">
                                      {formatMoney(o.outstanding)}
                                    </td>
                                    <td className="py-2.5 px-4 text-g700">{o.currencyName || '—'}</td>
                                  </tr>
                                ))}

                                {/* Section Subtotal Row at Bottom of Semester - Single Row Highlighted */}
                                <tr className="bg-gradient-to-r from-[#fee2e2] via-[#fff1f1] to-[#fee2e2] border-t-2 border-b-2 border-red-500 shadow-sm text-xs whitespace-nowrap">
                                  <td colSpan={6} className="py-3 px-4">
                                    <div className="flex items-center justify-between gap-4 flex-nowrap">
                                      {/* Left: Total Badge & Semester */}
                                      <div className="flex items-center gap-3 shrink-0">
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-red-700 text-white font-black text-xs uppercase tracking-wider shadow-sm">
                                          <i className="lni lni-wallet text-red-200 text-xs" />
                                          TOTAL OUTSTANDING
                                        </span>
                                        <span className="font-bold text-g700 text-xs">
                                          for <span className="text-red-900 font-black text-sm tracking-tight">{group.semester}</span>:
                                        </span>
                                      </div>

                                      {/* Right: Currency totals in single line */}
                                      <div className="flex items-center gap-2.5 shrink-0">
                                        {group.currencyTotals.map(ct => (
                                          <div
                                            key={ct.currency}
                                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border-2 border-red-500 shadow-xs hover:shadow transition-all"
                                          >
                                            <span className="text-[11px] font-sans font-black uppercase tracking-wider text-red-700 flex items-center gap-1.5">
                                              <span className="w-2 h-2 rounded-full bg-red-600" />
                                              {ct.currency} Due:
                                            </span>
                                            <span className="font-mono text-sm font-black text-red-700 bg-red-50 px-2.5 py-0.5 rounded border border-red-300 shadow-inner">
                                              {formatMoney(ct.total)}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              </Fragment>
                            ))
                          ) : (
                            filteredOutstanding.map((o, idx) => (
                              <tr
                                key={o.ledgerGuid || idx}
                                className={`border-b border-g100 transition-colors ${
                                  idx % 2 === 1 ? 'bg-[#f4f8fc]' : 'bg-white'
                                } hover:bg-red-50/30`}
                              >
                                <td className="py-2.5 px-4 text-center text-g500">{o.slNo || idx + 1}</td>
                                <td className="py-2.5 px-4 font-bold text-g900">{o.description || 'Fee Assessment'}</td>
                                <td className="py-2.5 px-4 text-g700">{o.semesterName || header?.semesterName || '—'}</td>
                                <td className={`py-2.5 px-4 font-semibold ${getCategoryStyle(o.category).cellBg}`}>
                                  {renderCategoryBadge(o.category)}
                                </td>
                                <td className="py-2.5 px-4 text-right font-bold text-red-600 font-mono whitespace-nowrap">
                                  {formatMoney(o.outstanding)}
                                </td>
                                <td className="py-2.5 px-4 text-g700">{o.currencyName || '—'}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    )}

                    {/* Tab 3: Future Payments */}
                    {tableTab === 'future' && (
                      <table className="w-full text-left text-xs border-collapse" style={{ minWidth: 900 }}>
                        <thead>
                          <tr style={{ background: '#22558c', color: '#ffffff' }}>
                            <th className="py-3 px-4 w-14 text-center font-bold text-white text-[11px] uppercase tracking-wider">#</th>
                            <th className="py-3 px-4 min-w-[280px] font-bold text-white text-[11px] uppercase tracking-wider">Description</th>
                            <th className="py-3 px-4 min-w-[240px] font-bold text-white text-[11px] uppercase tracking-wider">Semester</th>
                            <th className="py-3 px-4 min-w-[160px] text-right font-bold text-white text-[11px] uppercase tracking-wider">Amount Due</th>
                            <th className="py-3 px-4 min-w-[140px] font-bold text-white text-[11px] uppercase tracking-wider">Currency</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredFuture.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="py-12 text-center text-g400 text-xs">
                                No future scheduled payments registered.
                              </td>
                            </tr>
                          ) : groupBySemester ? (
                            groupedFuture.map((group, groupIdx) => (
                              <Fragment key={group.semester || groupIdx}>
                                {/* Semester Group Header Row */}
                                <tr className="bg-gradient-to-r from-[#e9f2fb] via-[#f1f6fc] to-[#e9f2fb] border-t-2 border-b border-[#22558c]/40 font-semibold">
                                  <td colSpan={5} className="py-2.5 px-4">
                                    <div className="flex items-center gap-2.5">
                                      <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-[#22558c] text-white text-xs shadow-xs">
                                        <i className="lni lni-alarm-clock" />
                                      </span>
                                      <span className="font-extrabold text-xs md:text-sm text-[#1b365d] tracking-wide">
                                        {group.semester}
                                      </span>
                                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white text-[#22558c] border border-[#22558c]/20 shadow-xs">
                                        {group.items.length} {group.items.length === 1 ? 'Scheduled' : 'Scheduled'}
                                      </span>
                                    </div>
                                  </td>
                                </tr>

                                {/* Rows in this Semester */}
                                {group.items.map((f, idx) => (
                                  <tr
                                    key={f.slNo || `${groupIdx}-${idx}`}
                                    className={`border-b border-g100 transition-colors ${
                                      idx % 2 === 1 ? 'bg-[#f8fafc]' : 'bg-white'
                                    } hover:bg-blue-50/50`}
                                  >
                                    <td className="py-2.5 px-4 text-center text-g500">{f.slNo || idx + 1}</td>
                                    <td className="py-2.5 px-4 font-bold text-g900">{f.description}</td>
                                    <td className="py-2.5 px-4 text-g700">{f.semesterName || '—'}</td>
                                    <td className="py-2.5 px-4 text-right font-bold text-g900 font-mono whitespace-nowrap">
                                      {formatMoney(f.amountDue)}
                                    </td>
                                    <td className="py-2.5 px-4 text-g700">{f.currencyName || 'US Dollar'}</td>
                                  </tr>
                                ))}

                                {/* Section Subtotal Row at Bottom of Semester - Single Row Highlighted */}
                                <tr className="bg-gradient-to-r from-[#d6e7f8] via-[#eaf2fb] to-[#d6e7f8] border-t-2 border-b-2 border-[#1b365d] shadow-sm text-xs whitespace-nowrap">
                                  <td colSpan={5} className="py-3 px-4">
                                    <div className="flex items-center justify-between gap-4 flex-nowrap">
                                      {/* Left: Total Badge & Semester */}
                                      <div className="flex items-center gap-3 shrink-0">
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#1b365d] text-white font-black text-xs uppercase tracking-wider shadow-sm">
                                          <i className="lni lni-alarm-clock text-blue-200 text-xs" />
                                          TOTAL SCHEDULED
                                        </span>
                                        <span className="font-bold text-g700 text-xs">
                                          for <span className="text-[#1b365d] font-black text-sm tracking-tight">{group.semester}</span>:
                                        </span>
                                      </div>

                                      {/* Right: Currency totals in single line */}
                                      <div className="flex items-center gap-2.5 shrink-0">
                                        {group.currencyTotals.map(ct => (
                                          <div
                                            key={ct.currency}
                                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border-2 border-[#1b365d] shadow-xs hover:shadow transition-all"
                                          >
                                            <span className="text-[11px] font-sans font-black uppercase tracking-wider text-[#1b365d] flex items-center gap-1.5">
                                              <span className="w-2 h-2 rounded-full bg-[#22558c]" />
                                              {ct.currency} Due:
                                            </span>
                                            <span className="font-mono text-sm font-black text-[#1b365d] bg-[#eaf2fb] px-2.5 py-0.5 rounded border border-[#22558c]/30 shadow-inner">
                                              {formatMoney(ct.total)}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              </Fragment>
                            ))
                          ) : (
                            filteredFuture.map((f, idx) => (
                              <tr
                                key={f.slNo || idx}
                                className={`border-b border-g100 transition-colors ${
                                  idx % 2 === 1 ? 'bg-[#f8fafc]' : 'bg-white'
                                } hover:bg-blue-50/50`}
                              >
                                <td className="py-2.5 px-4 text-center text-g500">{f.slNo || idx + 1}</td>
                                <td className="py-2.5 px-4 font-bold text-g900">{f.description}</td>
                                <td className="py-2.5 px-4 text-g700">{f.semesterName || 'Year Three - Semester Two'}</td>
                                <td className="py-2.5 px-4 text-right font-bold text-g900 font-mono whitespace-nowrap">
                                  {formatMoney(f.amountDue)}
                                </td>
                                <td className="py-2.5 px-4 text-g700">{f.currencyName || 'US Dollar'}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    )}
                  </ScrollTable>

                  {/* ── Active Tab Summary Footer Bar ─────────────────────── */}
                  {tableTab === 'payments' && filteredPayments.length > 0 && (
                    <div className="px-4 py-2.5 bg-[#f8fafc] border-t border-g200 flex flex-wrap items-center justify-between text-xs text-g600">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-g700">Total Payments:</span>
                        <span className="font-bold text-g900">{filteredPayments.length} records</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-g700">Total Paid Sum:</span>
                        <span className="font-mono font-extrabold text-emerald-700">
                          {sumByCurrency(filteredPayments, 'amount')
                            .map(c => `${c.currency} ${c.total.toLocaleString()}`)
                            .join(' • ') || '0.00'}
                        </span>
                      </div>
                    </div>
                  )}

                  {tableTab === 'outstanding' && filteredOutstanding.length > 0 && (
                    <div className="px-4 py-2.5 bg-[#f8fafc] border-t border-g200 flex flex-wrap items-center justify-between text-xs text-g600">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-g700">Total Items:</span>
                        <span className="font-bold text-g900">{filteredOutstanding.length}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-g700">Total Current Outstanding:</span>
                        <span className="font-mono font-extrabold text-red-600">
                          {sumByCurrency(filteredOutstanding, 'outstanding')
                            .map(c => `${c.currency} ${c.total.toLocaleString()}`)
                            .join(' • ') || '0.00'}
                        </span>
                      </div>
                    </div>
                  )}

                  {tableTab === 'future' && filteredFuture.length > 0 && (
                    <div className="px-4 py-2.5 bg-[#f8fafc] border-t border-g200 flex flex-wrap items-center justify-between text-xs text-g600">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-g700">Total Scheduled:</span>
                        <span className="font-bold text-g900">{filteredFuture.length} items</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-g700">Total Future Due:</span>
                        <span className="font-mono font-extrabold text-[#1b365d]">
                          {formatMoney(filteredFuture.reduce((acc, item) => acc + (item.amountDue || 0), 0))}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Document Footer Note */}
                <div className="py-3 border-t border-g200 flex flex-wrap items-center justify-between text-[11px] text-g400">
                  <span>ISBAT University • Student Financial Statement</span>
                  <span>Generated: {new Date().toUTCString()}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <Toast toast={toast} />
    </>
  )
}
