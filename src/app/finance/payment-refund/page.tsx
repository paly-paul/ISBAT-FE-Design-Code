'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Toast } from '@/components/Toast'
import { ScrollTable } from '@/components/ScrollTable'
import { Pagination } from '@/components/Pagination'
import { PaymentSuccessModal } from '@/components/modals/finance/PaymentSuccessModal'
import DatePicker from '@/components/DatePicker'
import { SearchSelect } from '@/components/SearchSelect'
import { useCampuses } from '@/hooks/config/useCampuses'
import { useProgramMasters } from '@/hooks/academic/useProgramMaster'
import { useBatches } from '@/hooks/academic/useBatches'
import { useSemestersForProgram } from '@/hooks/academic/useSemesters'
import {
  useSearchStudentsInfinite,
  useStudentProfile,
  usePaymentHistory,
} from '@/hooks/finance/usePaymentConsole'
import { usePaymentRefundsList, useCreatePaymentRefund } from '@/hooks/finance/usePaymentRefund'
import { formatDate } from '@/lib/date'
import { AuthError } from '@/lib/api/client'

// Reference: a legacy ISMS screen ("Payment Console - Refund" —
// frmPaymentConsoleRefund.aspx) for issuing a refund against a payment a
// student has already made. Wired to the real endpoints (post-payment-refund.md
// / get-payment-refunds.md, repo root) as of 2026-09-05 — student search and
// the profile summary reuse Payment Console's own real hooks/components
// (useSearchStudentsInfinite/useStudentProfile, the pc-hero card), same 50/50
// pc-body split as that page's own Profile Details + payment form.
//
// The legacy screen's own "Refund Ledger" picker doesn't map onto this API at
// all: a refund is issued against a specific TUITION PAYMENT (paymentGuid),
// not a ledger picked independently — it reverses that payment's one
// allocation line, and currency is inferred server-side from the original
// payment rather than chosen here. So the form below picks a payment (from
// this application's own Tuition payment history) instead of a ledger; "Total
// Amount" shows that payment's own amount, read-only.

function fmtAmt(n: number) {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function applicantName(a: { firstName: string | null; lastName: string | null }) {
  return `${a.firstName ?? ''}${a.lastName ? ` ${a.lastName}` : ''}`.trim() || '—'
}

function searchResultName(a: { studentName: string | null; firstName: string | null }) {
  return a.studentName || a.firstName || '—'
}

function initialsFor(name: string) {
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '—'
}

function todayYmd() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

const REFUND_HISTORY_PAGE_SIZE = 10

export default function PaymentRefundPage() {
  const router = useRouter()
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)
  function showToast(msg: string, type = '') { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }

  // Success confirmation for a submitted refund — same PaymentSuccessModal
  // Payment Console uses for its own Tuition/Other submits, replacing a
  // plain success toast. Errors still use showToast.
  const [successModal, setSuccessModal] = useState<{ title: string; rows: [string, string][] } | null>(null)

  // ── Student search — same live-typing infinite-scroll dropdown as Payment
  // Console's own Student Search (useSearchStudentsInfinite): opens on focus
  // (browsing everything when the box is empty), narrows as you type,
  // debounced so the real search endpoint isn't hit on every keystroke. ──
  const [search, setSearch] = useState('')
  const [committedSearch, setCommittedSearch] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const searchBoxRef = useRef<HTMLDivElement>(null)
  const [selectedApplicationGuid, setSelectedApplicationGuid] = useState<string | null>(null)
  const [selectedStudentGuidHint, setSelectedStudentGuidHint] = useState<string | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setCommittedSearch(search.trim()), 400)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => {
    if (!searchFocused) return
    function handle(e: MouseEvent) {
      if (!searchBoxRef.current?.contains(e.target as Node)) setSearchFocused(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [searchFocused])

  const searchTermLen = committedSearch.trim().length
  const {
    data: searchPages, fetchNextPage, hasNextPage, isFetchingNextPage,
    isFetching: isSearching, isError: isSearchError,
  } = useSearchStudentsInfinite(
    committedSearch, 20,
    searchFocused && (searchTermLen === 0 || searchTermLen >= 2),
  )
  const matches = searchPages?.pages.flatMap(p => p.items) ?? []

  function handleSearchResultsScroll(e: React.UIEvent<HTMLDivElement>) {
    if (!hasNextPage || isFetchingNextPage) return
    const el = e.currentTarget
    if (el.scrollTop > 0 && el.scrollHeight - el.scrollTop - el.clientHeight < 48) fetchNextPage()
  }

  const { data: profile, isLoading: isProfileLoading, isError: isProfileError } = useStudentProfile(selectedApplicationGuid, !!selectedApplicationGuid, selectedStudentGuidHint)
  const studentGuid = profile?.studentGuid ?? selectedStudentGuidHint ?? null

  // Client-side name resolution for the profile's guid FKs — same fallback
  // pattern Payment Console uses: prefer the server's own pre-resolved
  // names, fall back to a client-side lookup only when the server sends null.
  const { data: campuses = [] } = useCampuses()
  const { data: programs = [] } = useProgramMasters()
  const { data: allBatchesData } = useBatches(1, 1000)
  const batches = allBatchesData?.items ?? []
  const { data: semesters = [] } = useSemestersForProgram(profile?.programGuid ?? '', !!profile?.programGuid)

  const campusName = campuses.find(c => c.campusGuid === profile?.campusGuid)?.campusName
  const programName = profile?.programName ?? programs.find(p => p.programGuid === profile?.programGuid)?.programName
  const batchCode = profile?.batchCode ?? batches.find(b => b.batchGuid === profile?.batchGuid)?.batchCode
  const semName = profile?.semesterName ?? semesters.find(s => s.semesterGuid === profile?.semesterGuid)?.semName

  // Refund candidates — this application's own Tuition (category 1) payment
  // history. There's no client-visible way to tell a single-ledger payment
  // from a multi-ledger one ahead of time (see paymentRefund.ts's own
  // comment) — every tuition payment is offered here, and a multi-ledger one
  // is rejected server-side on submit with a clear message.
  const { data: paymentHistory = [], isLoading: isHistoryLoading, isError: isHistoryError } = usePaymentHistory(selectedApplicationGuid, !!selectedApplicationGuid)
  const tuitionPayments = paymentHistory.filter(h => h.category === 1)

  const [paymentGuid, setPaymentGuid] = useState('')
  const [refundAmount, setRefundAmount] = useState('')
  const [refundDate, setRefundDate] = useState(todayYmd)
  const [remarks, setRemarks] = useState('')

  const selectedPayment = tuitionPayments.find(p => p.paymentGuid === paymentGuid)

  function resetForm() {
    setPaymentGuid('')
    setRefundAmount('')
    setRefundDate(todayYmd())
    setRemarks('')
  }

  // Refund Details — this student/application's own refund history
  // (get-payment-refunds.md), server-paginated same as the standalone
  // Payment History page.
  const [refundHistoryPage, setRefundHistoryPage] = useState(1)
  useEffect(() => setRefundHistoryPage(1), [selectedApplicationGuid])
  const { data: refundHistory, isLoading: isRefundHistoryLoading, isError: isRefundHistoryError } = usePaymentRefundsList(
    { studentGuid, applicationGuid: studentGuid ? undefined : selectedApplicationGuid, page: refundHistoryPage, pageSize: REFUND_HISTORY_PAGE_SIZE },
    !!selectedApplicationGuid,
  )
  const refundHistoryItems = refundHistory?.items ?? []
  const refundHistoryTotalPages = Math.max(1, Math.ceil((refundHistory?.totalCount ?? 0) / REFUND_HISTORY_PAGE_SIZE))

  const createRefund = useCreatePaymentRefund()

  function selectStudent(applicationGuid: string, name: string, studentGuidHint: string | null) {
    setSelectedApplicationGuid(applicationGuid)
    setSelectedStudentGuidHint(studentGuidHint)
    setSearch(name)
    setCommittedSearch('')
    setSearchFocused(false)
    resetForm()
    setSuccessModal(null)
    showToast(`Loaded: ${name}`, 'success')
  }

  function handleCancel() {
    resetForm()
  }

  function handleClear() {
    setSelectedApplicationGuid(null)
    setSelectedStudentGuidHint(null)
    setSearch('')
    setCommittedSearch('')
    resetForm()
    setSuccessModal(null)
    showToast('Form cleared.', 'warn')
  }

  function handleSubmit() {
    if (!profile || !selectedApplicationGuid) { showToast('Please select a student first.', 'warn'); return }
    if (!selectedPayment) { showToast('Please select a payment to refund.', 'warn'); return }
    const amt = parseFloat(refundAmount)
    if (!refundAmount.trim() || isNaN(amt) || amt <= 0) { showToast('Refund amount must be greater than 0.', 'warn'); return }
    if (amt > selectedPayment.amount) { showToast(`Refund amount exceeds the payment's total amount (${fmtAmt(selectedPayment.amount)}).`, 'warn'); return }
    if (!refundDate) { showToast('Please select a refund date.', 'warn'); return }

    createRefund.mutate(
      {
        paymentGuid: selectedPayment.paymentGuid,
        input: { amount: amt, refundDate, remarks: remarks.trim() || null },
      },
      {
        onSuccess: result => {
          setSuccessModal({
            title: 'Refund Recorded',
            rows: [
              ['Receipt', result.receipt],
              ['Amount', `${selectedPayment.currencyName} ${fmtAmt(amt)}`],
              ['Remaining Refundable Balance', `${selectedPayment.currencyName} ${fmtAmt(result.remainingRefundableBalance)}`],
            ],
          })
          resetForm()
        },
        onError: (error: Error) => {
          // Business-rule rejections (multi-ledger payment, missing
          // exchange rate, over the refundable balance, …) all come back as
          // a plain message on the generic-failure branch — surface it
          // as-is rather than a generic "failed" toast.
          showToast(error instanceof AuthError ? error.message : (error.message || 'Failed to record refund. Please try again.'), 'error')
        },
      },
    )
  }

  return (
    <>
      <div className="page active" id="page-payment-refund">
        <div className="pg-hdr">
          <div>
            <div className="pg-title">Payment Console - Refund</div>
            <div className="pg-sub">Search student → pick a tuition payment → record the refund</div>
          </div>
          <button className="btn btn-neu" onClick={() => router.push('/finance/dashboard')}><i className="lni lni-arrow-left"></i> Back</button>
        </div>

        {/* Student Search — same bar/dropdown shell as Payment Console's own
            Student Search card. */}
        <div className="card">
          <div className="card-hdr">
            <div className="card-title"><span className="ctitle-icon"><i className="lni lni-search-alt"></i></span> Student Search</div>
          </div>
          <div className="fg" style={{ marginBottom: 0, position: 'relative' }} ref={searchBoxRef}>
            <div className="lbl">Search by Applicant Name, Ref No, Phone, or Email <span className="req">*</span></div>
            <div className="flex gap-2 flex-wrap">
              <div className="inp-wrap" style={{ flex: 1, minWidth: 180 }}>
                <span className="inp-icon"><i className="lni lni-search-alt"></i></span>
                <input
                  className="ctrl"
                  type="text"
                  placeholder="e.g. APP20222/667 or Tumukunde Alice"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onKeyDown={e => { if (e.key === 'Enter') setCommittedSearch(search.trim()) }}
                />
              </div>
              {selectedApplicationGuid && (
                <button className="btn btn-neu" onClick={handleClear}><i className="lni lni-close"></i> Clear</button>
              )}
            </div>

            {searchFocused && (
              <div
                className="mt-1"
                style={{
                  position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 20,
                  background: 'var(--white)', border: '1.5px solid var(--b200)', borderRadius: 'var(--rsm)',
                  boxShadow: 'var(--neu-out)', maxHeight: 260, overflowY: 'auto',
                }}
                onScroll={handleSearchResultsScroll}
              >
                {isSearching && matches.length === 0 ? (
                  <div className="text-g400 text-center" style={{ padding: 16, fontSize: 12.5 }}>Searching…</div>
                ) : isSearchError ? (
                  <div className="text-clr-red text-center" style={{ padding: 16, fontSize: 12.5 }}><i className="lni lni-warning"></i> Search failed. Please try again.</div>
                ) : matches.length === 0 ? (
                  <div className="text-g400 text-center" style={{ padding: 16, fontSize: 12.5 }}>No matching applications found.</div>
                ) : (
                  <>
                    {matches.map(a => (
                      <div
                        key={a.applicationGuid}
                        className="cursor-pointer px-3 py-2 hover:bg-b50 border-b border-g100 last:border-b-0"
                        onMouseDown={() => selectStudent(a.applicationGuid, searchResultName(a), a.studentGuid)}
                      >
                        <div className="font-bold">{searchResultName(a)}</div>
                        <div className="text-g500" style={{ fontSize: 11 }}>{a.appRefNo}{a.phone ? ` · ${a.phone}` : ''}{a.emailId ? ` · ${a.emailId}` : ''}</div>
                      </div>
                    ))}
                    {isFetchingNextPage && (
                      <div className="text-g400 text-center" style={{ padding: 10, fontSize: 11.5 }}>Loading more…</div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* LEFT: Profile Details (pc-hero) · RIGHT: Refund form — same
            50/50 pc-body split and profile-card treatment as Payment
            Console's own Profile Details + payment form. */}
        {selectedApplicationGuid && (
          <div className="pc-body">
            <div className="flex flex-col gap-5 min-w-0">
              {isProfileLoading ? (
                <div className="card text-g400 text-center" style={{ padding: 24, fontSize: 12.5 }}>Loading profile…</div>
              ) : isProfileError || !profile ? (
                <div className="card text-clr-red text-center" style={{ padding: 24, fontSize: 12.5 }}><i className="lni lni-warning"></i> Couldn&apos;t load this student&apos;s profile.</div>
              ) : (
                <div className="card p-0 overflow-hidden">
                  <div className="pc-hero">
                    <div className="pc-hero-top">
                      <div className="pc-hero-avatar">{initialsFor(applicantName(profile))}</div>
                      <div className="flex-1 min-w-0">
                        <div className="pc-hero-name truncate">{applicantName(profile)}</div>
                        <div className="pc-hero-sub truncate">{programName ?? '—'}</div>
                        <span className="pc-hero-badge"><i className="lni lni-bookmark"></i> {profile.appRefNo}</span>
                      </div>
                    </div>
                    <div className="pc-hero-facts">
                      <div className="pc-hero-fact"><span className="pc-hero-fact-lbl">Campus</span><span className="pc-hero-fact-val" title={campusName ?? '—'}>{campusName ?? '—'}</span></div>
                      <div className="pc-hero-fact"><span className="pc-hero-fact-lbl">Semester</span><span className="pc-hero-fact-val" title={semName ?? '—'}>{semName ?? '—'}</span></div>
                      <div className="pc-hero-fact"><span className="pc-hero-fact-lbl">Fee Code</span><span className="pc-hero-fact-val" title={profile.feeCode ?? '—'}>{profile.feeCode ?? '—'}</span></div>
                      <div className="pc-hero-fact"><span className="pc-hero-fact-lbl">Batch</span><span className="pc-hero-fact-val" title={batchCode ?? '—'}>{batchCode ?? '—'}</span></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-5 min-w-0">
              <div className="card">
                <div className="card-hdr">
                  <div className="card-title"><span className="ctitle-icon"><i className="lni lni-reload"></i></span> Refund</div>
                </div>

                <div className="g2 mb-[14px]">
                  <div className="fg">
                    <div className="lbl">Payment to Refund <span className="req">*</span></div>
                    <SearchSelect
                      placeholder="— Select a Tuition payment —"
                      options={tuitionPayments.map(p => ({ value: p.paymentGuid, label: `${p.paymentCode} — ${p.currencyName} ${fmtAmt(p.amount)} (${formatDate(p.payDate)})` }))}
                      value={paymentGuid}
                      onChange={setPaymentGuid}
                      disabled={isHistoryLoading || tuitionPayments.length === 0}
                    />
                    {isHistoryLoading ? (
                      <div className="text-g400 mt-1" style={{ fontSize: 11 }}>Loading payment history…</div>
                    ) : isHistoryError ? (
                      <div className="text-clr-red mt-1" style={{ fontSize: 11 }}><i className="lni lni-warning"></i> Couldn&apos;t load payment history.</div>
                    ) : tuitionPayments.length === 0 ? (
                      <div className="text-g400 mt-1" style={{ fontSize: 11 }}>No Tuition payments recorded for this application.</div>
                    ) : null}
                  </div>
                  <div className="fg">
                    <div className="lbl">Total Amount</div>
                    <input className="ctrl" readOnly value={selectedPayment ? `${selectedPayment.currencyName} ${fmtAmt(selectedPayment.amount)}` : ''} placeholder="—" />
                  </div>
                </div>

                <div className="g2 mb-[14px]">
                  <div className="fg">
                    <div className="lbl">Refund Amount <span className="req">*</span></div>
                    <input
                      className="ctrl"
                      type="number"
                      placeholder="0.00"
                      value={refundAmount}
                      onChange={e => setRefundAmount(e.target.value)}
                      disabled={!selectedPayment}
                    />
                  </div>
                  <div className="fg">
                    <div className="lbl">Refund Date <span className="req">*</span></div>
                    <DatePicker value={refundDate} onChange={setRefundDate} />
                  </div>
                </div>

                <div className="fg mb-4">
                  <div className="lbl">Remarks</div>
                  <textarea className="ctrl" rows={2} placeholder="Reason for this refund" value={remarks} onChange={e => setRemarks(e.target.value)} disabled={!selectedPayment} />
                </div>

                <div className="flex gap-[10px] justify-end flex-wrap">
                  <button className="btn btn-neu" onClick={handleCancel}><i className="lni lni-close"></i> Cancel</button>
                  <button className="btn btn-primary btn-lg" disabled={createRefund.isPending} onClick={handleSubmit}>
                    <i className="lni lni-checkmark"></i> {createRefund.isPending ? 'Submitting…' : 'Submit'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Refund Details — full width history table below the 2-column
            body, server-paginated (get-payment-refunds.md). */}
        {selectedApplicationGuid && (
          <div className="card">
            <div className="card-hdr">
              <div className="card-title"><span className="ctitle-icon"><i className="lni lni-folder"></i></span> Refund Details</div>
            </div>
            {isRefundHistoryLoading ? (
              <div className="text-g400 text-center" style={{ padding: 16, fontSize: 12.5 }}>Loading refund history…</div>
            ) : isRefundHistoryError ? (
              <div className="text-clr-red text-center" style={{ padding: 16, fontSize: 12.5 }}><i className="lni lni-warning"></i> Couldn&apos;t load refund history.</div>
            ) : refundHistoryItems.length === 0 ? (
              <div className="text-g400 text-center" style={{ padding: 16, fontSize: 12.5 }}>No records found.</div>
            ) : (
              <>
                <ScrollTable className="no-sticky-col">
                  <table>
                    <thead><tr><th>Payment Code</th><th>Ledger</th><th>Amount</th><th>Currency</th><th>Refund Date</th><th>Remarks</th></tr></thead>
                    <tbody>
                      {refundHistoryItems.map(r => (
                        <tr key={r.refundGuid}>
                          <td className="font-mono text-blue">{r.payment.paymentCode}</td>
                          <td>{r.ledger.ledgerName}</td>
                          <td className="text-green font-bold">{fmtAmt(r.amount)}</td>
                          <td>{r.currency.currencyCode}</td>
                          <td>{formatDate(r.refundDate)}</td>
                          <td>{r.remarks || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </ScrollTable>
                <Pagination
                  page={refundHistoryPage}
                  totalPages={refundHistoryTotalPages}
                  totalCount={refundHistory?.totalCount ?? 0}
                  itemLabel="refunds"
                  onPageChange={setRefundHistoryPage}
                />
              </>
            )}
          </div>
        )}
      </div>

      <PaymentSuccessModal
        isOpen={!!successModal}
        onClose={() => setSuccessModal(null)}
        showToast={showToast}
        title={successModal?.title ?? ''}
        rows={successModal?.rows ?? []}
      />
      <Toast toast={toast} />
    </>
  )
}
