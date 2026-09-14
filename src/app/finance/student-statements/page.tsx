'use client'
import { useState, useMemo } from 'react'
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

function sumByCurrency<T extends { currencyName?: string | null; amount?: number; outstanding?: number }>(
  rows: T[],
  field: 'amount' | 'outstanding'
): { currency: string; total: number }[] {
  const byCurrency = new Map<string, number>()
  for (const r of rows) {
    const cur = r.currencyName?.trim() || 'UGX'
    const val = (field === 'amount' ? r.amount : r.outstanding) ?? 0
    byCurrency.set(cur, (byCurrency.get(cur) ?? 0) + val)
  }
  return [...byCurrency.entries()].map(([currency, total]) => ({ currency, total }))
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

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
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

                  {/* Card 3: Financial Standing & Clearance Summary - Compact */}
                  <div className="card p-3.5 shadow-sm border border-g200 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <div>
                          <h4 className="font-bold text-xs text-g900">Financial Standing</h4>
                          <p className="text-[11px] text-g400">Clearance status & currency ledger</p>
                        </div>
                        {currentOutstanding <= 0 ? (
                          <span className="badge badge-green text-[10px] py-0.5 px-2 font-bold flex items-center gap-1">
                            <i className="lni lni-checkmark" /> Cleared
                          </span>
                        ) : (
                          <span className="badge badge-amber text-[10px] py-0.5 px-2 font-bold flex items-center gap-1">
                            <i className="lni lni-alarm" /> Balance Due
                          </span>
                        )}
                      </div>

                      {/* Clearance Alert Pill */}
                      <div
                        className={`p-2.5 rounded-lg border my-2 flex items-start gap-2.5 ${
                          currentOutstanding <= 0
                            ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                            : 'bg-red-50/70 border-red-200 text-red-900'
                        }`}
                      >
                        <i
                          className={`lni ${
                            currentOutstanding <= 0 ? 'lni-checkmark-circle text-emerald-600' : 'lni-warning text-red-600'
                          } text-base shrink-0 mt-0.5`}
                        />
                        <div className="min-w-0 flex-1 text-xs">
                          <div className="font-bold tracking-tight">
                            {currentOutstanding <= 0 ? 'Registration & Exam Cleared' : 'Financial Clearance Required'}
                          </div>
                          <div className="text-[11px] opacity-80 mt-0.5">
                            {currentOutstanding <= 0
                              ? 'Zero outstanding balance. All current fee heads are fully settled.'
                              : `${formatMoney(currentOutstanding)} balance remaining on current assessments.`}
                          </div>
                        </div>
                      </div>

                      {/* Currency Breakdown */}
                      <div className="mt-2.5 space-y-1">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-g500">
                          Collections by Currency
                        </div>
                        <div className="space-y-1">
                          {sumByCurrency(paymentHistory, 'amount').map(c => (
                            <div
                              key={c.currency}
                              className="flex items-center justify-between px-2.5 py-1 rounded bg-g50 border border-g100 text-xs"
                            >
                              <span className="font-semibold text-g700">{c.currency}</span>
                              <span className="font-mono font-bold text-emerald-700">
                                {c.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Most Recent Receipt Info */}
                      {paymentHistory.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-g100 text-xs">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-g500 mb-1">
                            Latest Receipt Recorded
                          </div>
                          <div className="flex items-center justify-between text-xs text-g800 font-medium">
                            <span className="flex items-center gap-1.5 truncate">
                              <i className="lni lni-receipt text-b700" />
                              <span className="font-mono font-bold text-g900">
                                {paymentHistory[0].receipt || paymentHistory[0].paymentCode || 'Receipt'}
                              </span>
                              <span className="text-g400 text-[10px]">
                                ({paymentHistory[0].payType || 'Payment'})
                              </span>
                            </span>
                            <span className="font-mono font-bold text-g900 shrink-0 ml-2">
                              {formatMoney(paymentHistory[0].amount, paymentHistory[0].currencyName || '')}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-g100 text-[10px] text-g400">
                      <span>{paymentHistory.length} Receipts • {outstandingItems.length} Dues</span>
                      <span className="font-semibold text-b700">Official Standing</span>
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
                            tableTab === 'future' ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple'
                          }`}
                        >
                          {futurePayments.length}
                        </span>
                      </button>
                    </div>

                    {/* Search & Category Filter Controls on Right */}
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

                      {tableTab === 'payments' && (
                        <select
                          className="form-select text-xs py-1 px-2.5 rounded-lg border-g300 bg-white font-medium"
                          value={selectedCategory}
                          onChange={e => setSelectedCategory(e.target.value)}
                        >
                          <option value="all">All Categories</option>
                          <option value="1">Tuition Only</option>
                          <option value="3">NCHE Only</option>
                          <option value="4">Guild Only</option>
                          <option value="5">Advance Deposit</option>
                        </select>
                      )}
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
                                  {p.semesterName || header.semesterName || 'Year Three - Semester One'}
                                </td>
                                <td className="py-2.5 px-4 text-g700">{p.payType || '—'}</td>
                                <td className="py-2.5 px-4 font-mono text-g800 font-semibold">{p.receipt || '—'}</td>
                                <td className="py-2.5 px-4 text-right font-bold text-g900 font-mono whitespace-nowrap">
                                  {formatMoney(p.amount)}
                                </td>
                                <td className="py-2.5 px-4 text-g700">{p.currencyName || '—'}</td>
                                <td className="py-2.5 px-4 font-semibold text-g800">
                                  {PAYMENT_CATEGORY_LABELS[p.category] || 'Other'}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    )}

                    {/* Tab 2: Outstanding Items */}
                    {tableTab === 'outstanding' && (
                      <table className="w-full text-left text-xs border-collapse" style={{ minWidth: 900 }}>
                        <thead>
                          <tr style={{ background: '#22558c', color: '#ffffff' }}>
                            <th className="py-3 px-4 w-14 text-center font-bold text-white text-[11px] uppercase tracking-wider">#</th>
                            <th className="py-3 px-4 min-w-[280px] font-bold text-white text-[11px] uppercase tracking-wider">Description</th>
                            <th className="py-3 px-4 min-w-[240px] font-bold text-white text-[11px] uppercase tracking-wider">Semester</th>
                            <th className="py-3 px-4 min-w-[160px] text-right font-bold text-white text-[11px] uppercase tracking-wider">Outstanding</th>
                            <th className="py-3 px-4 min-w-[140px] font-bold text-white text-[11px] uppercase tracking-wider">Currency</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredOutstanding.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="py-12 text-center text-g400 text-xs">
                                Fully settled — No outstanding items found.
                              </td>
                            </tr>
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
                                <td className="py-2.5 px-4 text-g700">{o.semesterName || header.semesterName || '—'}</td>
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
                          ) : (
                            filteredFuture.map((f, idx) => (
                              <tr
                                key={f.slNo || idx}
                                className={`border-b border-g100 transition-colors ${
                                  idx % 2 === 1 ? 'bg-[#f4f8fc]' : 'bg-white'
                                } hover:bg-purple-50/30`}
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
                        <span className="font-mono font-extrabold text-purple">
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
