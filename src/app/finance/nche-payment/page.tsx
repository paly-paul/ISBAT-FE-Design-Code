'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Toast } from '@/components/Toast'
import { ScrollTable } from '@/components/ScrollTable'
import { PaymentSuccessModal } from '@/components/modals/finance/PaymentSuccessModal'
import DatePicker from '@/components/DatePicker'
import {
  useSearchStudents,
  useStudentProfile,
  useAllOutstandingLedgers,
  AllOutstandingItem,
} from '@/hooks/finance/usePaymentConsole'
import {
  useCreateNchePayment,
  useUpdateNchePayment,
  useDeleteNchePayment,
  useNchePaymentHistory,
  useNcheSemesterStatus,
  NchePaymentHistoryEntry,
} from '@/hooks/finance/useNchePayment'

// Standalone NCHE Payment page — split out of the Payment Console per
// request, now wired to NCHE's full CRUD + status surface (nche/*.md,
// 2026-08-31): create, update, delete, per-student payment history, and
// semester eligibility status, all under erp-finance-compliance-service's
// own nche/ route. Student search/profile/outstanding-balance are still the
// same Payment Console endpoints (search/profile/outstanding-all) — only
// the NCHE-specific calls and this page's own form/history/status sections
// are new. No currency, no receipt book, no bank, no receipt claimed: the
// amount must be an exact multiple of a fixed per-semester NCHE rate
// configured server-side, enforced there (not pre-validated here since the
// rate isn't exposed to the client).
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
// status is free-text per the doc's own sample, not a documented enum —
// mapped to a badge color by substring match rather than an exact set, so
// an unanticipated value still gets a sane (grey) fallback instead of
// crashing a lookup.
function statusBadgeClass(status: string) {
  const s = status.toLowerCase()
  if (s.includes('paid')) return 'badge-green'
  if (s.includes('overdue')) return 'badge-red'
  return 'badge-amber'
}

// Same label-left/value-right treatment as Payment Console's own
// OutstandingCategoryTable — NCHE rows have no ledger/semester/currency
// structure (confirmed via get-all-outstanding-ledgers.md: those fields
// come back null for NCHE/Guild specifically), just a flat description +
// outstanding amount per row.
function NcheOutstandingTable({ items, isLoading, isError }: { items: AllOutstandingItem[]; isLoading: boolean; isError: boolean }) {
  if (isLoading) return <div className="text-g400 text-center" style={{ padding: 16, fontSize: 12.5 }}>Loading outstanding balance…</div>
  if (isError) return <div className="text-clr-red text-center" style={{ padding: 16, fontSize: 12.5 }}><i className="lni lni-warning"></i> Couldn&apos;t load the outstanding balance.</div>
  if (items.length === 0) return <div className="text-g400 text-center" style={{ padding: 16, fontSize: 12.5 }}>Fully settled — nothing outstanding on NCHE.</div>
  const total = items.reduce((sum, it) => sum + it.outstanding, 0)
  return (
    <>
      {items.map((it, i) => (
        <div className="receipt-row" key={`${it.ledgerGuid ?? it.description}-${i}`}>
          <span className="text-muted">{it.description}</span>
          <span className="flex items-baseline gap-1.5 justify-end">
            {it.currencyCode && <span className="text-g400 font-semibold" style={{ fontSize: 11 }}>{it.currencyCode}</span>}
            <span className="font-bold text-amber">{it.outstanding.toLocaleString()}</span>
          </span>
        </div>
      ))}
      <div className="mt-[10px] p-3 rounded-[var(--rsm)] bg-b50 border border-[1.5px] border-b100 flex justify-between items-center">
        <span className="text-muted" style={{ fontSize: 12 }}>Total Outstanding</span>
        <span className="font-bold text-blue">{total.toLocaleString()}</span>
      </div>
    </>
  )
}

export default function NchePaymentPage() {
  const router = useRouter()
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)
  function showToast(msg: string, type = '') { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }
  const [successModal, setSuccessModal] = useState<{ title: string; rows: [string, string][] } | null>(null)

  const [search, setSearch] = useState('')
  const [committedSearch, setCommittedSearch] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const searchBoxRef = useRef<HTMLDivElement>(null)
  const [selectedApplicationGuid, setSelectedApplicationGuid] = useState<string | null>(null)
  const [selectedStudentGuidHint, setSelectedStudentGuidHint] = useState<string | null>(null)

  const searchTermLen = search.trim().length
  const { data: searchResults, isFetching: isSearching, isError: isSearchError, error: searchError } = useSearchStudents(
    committedSearch || search.trim(),
    1,
    15,
    searchFocused && (searchTermLen === 0 || searchTermLen >= 2)
  )
  const matches = searchResults?.items ?? []

  useEffect(() => {
    if (!searchFocused) return
    function handle(e: MouseEvent) {
      if (!searchBoxRef.current?.contains(e.target as Node)) setSearchFocused(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [searchFocused])

  const { data: profile, isLoading: isProfileLoading, isError: isProfileError, error: profileError } = useStudentProfile(selectedApplicationGuid, !!selectedApplicationGuid, selectedStudentGuidHint)
  const studentGuid = profile?.studentGuid ?? selectedStudentGuidHint ?? null

  const { data: allOutstanding = [], isLoading: isOutstandingLoading, isError: isOutstandingError } = useAllOutstandingLedgers(selectedApplicationGuid, !!selectedApplicationGuid)
  const ncheOutstanding = allOutstanding.filter(i => i.category === 3)

  const { data: semesterStatus } = useNcheSemesterStatus(selectedApplicationGuid, !!selectedApplicationGuid, studentGuid)
  const { data: history = [], isLoading: isHistoryLoading } = useNchePaymentHistory(studentGuid, !!studentGuid)

  const [amount, setAmount] = useState('')
  const [payDate, setPayDate] = useState(todayYmd)
  const [pnrNumber, setPnrNumber] = useState('')
  const [remarks, setRemarks] = useState('')
  // Set while editing an existing history row — Save switches to Update
  // (PUT) against this guid instead of Create (POST); cleared on
  // save/cancel/student change.
  const [editingGuid, setEditingGuid] = useState<string | null>(null)

  const createNchePayment = useCreateNchePayment()
  const updateNchePayment = useUpdateNchePayment()
  const deleteNchePayment = useDeleteNchePayment()

  function selectStudent(applicationGuid: string, name: string, studentGuidHintVal: string | null) {
    setSelectedApplicationGuid(applicationGuid)
    setSelectedStudentGuidHint(studentGuidHintVal)
    setSearch(name)
    setCommittedSearch('')
    setSearchFocused(false)
    resetForm()
  }

  function resetForm() {
    setAmount('')
    setPayDate(todayYmd())
    setPnrNumber('')
    setRemarks('')
    setEditingGuid(null)
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

  function startEdit(entry: NchePaymentHistoryEntry) {
    setEditingGuid(entry.paymentNcheGuid)
    setAmount(String(entry.amount))
    setPayDate(entry.payDate.slice(0, 10))
    setPnrNumber(entry.pnrNumber ?? '')
    setRemarks(entry.remarks ?? '')
  }

  function handleDelete(entry: NchePaymentHistoryEntry) {
    if (!selectedApplicationGuid) return
    if (!window.confirm('Delete this NCHE payment? This cannot be undone.')) return
    deleteNchePayment.mutate(
      { paymentNcheGuid: entry.paymentNcheGuid, applicationGuid: selectedApplicationGuid, studentGuid },
      {
        onSuccess: () => {
          showToast('Payment deleted.', 'ok')
          if (editingGuid === entry.paymentNcheGuid) resetForm()
        },
        onError: (error: Error) => showToast(error.message || 'Failed to delete payment.', 'error'),
      },
    )
  }

  function handleSave() {
    if (!profile || !selectedApplicationGuid) { showToast('Please select a student first.', 'warn'); return }
    const amt = parseFloat(amount)
    if (!amount.trim() || isNaN(amt) || amt <= 0) { showToast('Amount must be greater than 0.', 'warn'); return }
    if (!payDate) { showToast('Please select a payment date.', 'warn'); return }

    if (editingGuid) {
      updateNchePayment.mutate(
        { paymentNcheGuid: editingGuid, input: { amount: amt, payDate, pnrNumber: pnrNumber.trim() || null, remarks: remarks.trim() || null }, applicationGuid: selectedApplicationGuid, studentGuid },
        {
          onSuccess: result => {
            setSuccessModal({ title: 'NCHE Payment Updated', rows: [['Amount', amt.toLocaleString()], ['Remaining Balance', result.remainingBalance.toLocaleString()]] })
            resetForm()
          },
          onError: (error: Error) => showToast(error.message || 'Failed to update NCHE payment. Please try again.', 'error'),
        },
      )
      return
    }

    createNchePayment.mutate(
      { applicationGuid: selectedApplicationGuid, studentGuid, amount: amt, payDate, pnrNumber: pnrNumber.trim() || null, remarks: remarks.trim() || null },
      {
        onSuccess: result => {
          setSuccessModal({
            title: 'NCHE Payment Recorded',
            rows: [
              ['Amount', amt.toLocaleString()],
              ['Remaining Balance', result.remainingBalance.toLocaleString()],
            ],
          })
          resetForm()
        },
        onError: (error: Error) => {
          // Same 400 "not a multiple of the configured rate"/"exceeds
          // outstanding balance" business errors the doc describes — surfaced
          // as-is rather than guessed at, since the rate isn't known here.
          showToast(error.message || 'Failed to save NCHE payment. Please try again.', 'error')
        },
      },
    )
  }

  const isSaving = createNchePayment.isPending || updateNchePayment.isPending

  return (
    <>
      <div className="page active">
        <div className="pg-hdr">
          <div>
            <div className="pg-title">NCHE Payment</div>
            <div className="pg-sub">Search student → view outstanding NCHE balance → record payment</div>
          </div>
          <div className="flex gap-2">
            {selectedApplicationGuid && <button className="btn btn-neu" onClick={handleClear}><i className="lni lni-reload"></i> New Search</button>}
            <button className="btn btn-neu" onClick={() => router.push('/finance/dashboard')}><i className="lni lni-arrow-left"></i> Back</button>
          </div>
        </div>

        <div className="card">
          <div className="card-hdr">
            <div className="card-title"><span className="ctitle-icon"><i className="lni lni-search-alt"></i></span> Student Search</div>
          </div>
          <div className="fg" style={{ marginBottom: 0, position: 'relative' }} ref={searchBoxRef}>
            <div className="lbl">Search by Applicant Name, Ref No, Phone, or Email <span className="req">*</span></div>
            <div className="inp-wrap">
              <span className="inp-icon"><i className="lni lni-search-alt"></i></span>
              <input
                className="ctrl"
                type="text"
                placeholder="e.g. APP20222/667 or Tumukunde Alice"
                value={search}
                onChange={e => setSearch(e.target.value)}
                onFocus={() => setSearchFocused(true)}
              />
            </div>

            {searchFocused && (
              <div
                className="mt-1"
                style={{
                  position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 20,
                  background: 'var(--white)', border: '1.5px solid var(--b200)', borderRadius: 'var(--rsm)',
                  boxShadow: 'var(--neu-out)', maxHeight: 260, overflowY: 'auto',
                }}
              >
                {isSearching && <div className="text-g400 px-3 py-2" style={{ fontSize: 12.5 }}>Searching…</div>}
                {!isSearching && isSearchError && (
                  <div className="text-clr-red px-3 py-2" style={{ fontSize: 12.5 }}>
                    <i className="lni lni-warning"></i> {searchError instanceof Error ? searchError.message : 'Search failed. Please try again.'}
                  </div>
                )}
                {!isSearching && !isSearchError && matches.length === 0 && (
                  <div className="text-g400 px-3 py-2" style={{ fontSize: 12.5 }}>No applications found.</div>
                )}
                {matches.map(a => (
                  <div
                    key={a.applicationGuid}
                    className="cursor-pointer px-3 py-2 hover:bg-b50 border-b border-g100 last:border-b-0"
                    onClick={() => selectStudent(a.applicationGuid, searchResultName(a), a.studentGuid)}
                  >
                    <div className="font-bold">{searchResultName(a)}</div>
                    <div className="text-g500" style={{ fontSize: 11 }}>{a.appRefNo} · {a.phone ?? '—'} · {a.emailId ?? '—'}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {isProfileLoading && selectedApplicationGuid && (
            <div className="mt-4 text-g400" style={{ fontSize: 12.5 }}>Loading applicant profile…</div>
          )}
          {isProfileError && selectedApplicationGuid && (
            <div className="mt-4 text-clr-red" style={{ fontSize: 12.5 }}>
              <i className="lni lni-warning"></i> {profileError instanceof Error ? profileError.message : "Couldn't load this applicant's profile."}
            </div>
          )}
        </div>

        {profile && (
          <>
            <div className="card">
              <div className="card-hdr">
                <div className="card-title"><span className="ctitle-icon"><i className="lni lni-user"></i></span> Profile Details</div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full flex-shrink-0 grid place-items-center text-white font-extrabold" style={{ background: 'linear-gradient(135deg,var(--b700),var(--b500))', fontSize: 17 }}>
                  {initialsFor(applicantName(profile))}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-extrabold text-g900" style={{ fontSize: 15.5 }}>{applicantName(profile)}</div>
                  <div className="text-g500 text-xs truncate">{profile.programName ?? '—'} &middot; {profile.semesterName ?? '—'}</div>
                </div>
                <span className="badge badge-blue font-mono"><i className="lni lni-bookmark"></i> {profile.appRefNo}</span>
              </div>
            </div>

            <div className="card">
              <div className="card-hdr">
                <div className="card-title"><span className="ctitle-icon"><i className="lni lni-dollar"></i></span> Outstanding Balance (NCHE)</div>
                {semesterStatus && (
                  <span className={`badge ${statusBadgeClass(semesterStatus.status)}`}>{semesterStatus.semName} — {semesterStatus.status}</span>
                )}
              </div>
              <NcheOutstandingTable items={ncheOutstanding} isLoading={isOutstandingLoading} isError={isOutstandingError} />
            </div>

            <div className="card">
              <div className="card-hdr">
                <div className="card-title"><span className="ctitle-icon"><i className="lni lni-wallet"></i></span> Payment Detail</div>
                {editingGuid && <span className="badge badge-amber">Editing existing payment</span>}
              </div>
              <div className="g2 mb-[14px]">
                <div className="fg">
                  <div className="lbl">Amount <span className="req">*</span></div>
                  <input type="number" min={0} step={0.01} className="amt-val-input" placeholder="0.00"
                    style={{ fontSize: 18, fontWeight: 700 }}
                    value={amount} onChange={e => setAmount(e.target.value)} />
                  <div style={{ fontSize: 11, color: 'var(--g500)', marginTop: 4 }}>Must be a multiple of the configured NCHE rate — enforced server-side.</div>
                </div>
                <div className="fg">
                  <div className="lbl">Payment Date <span className="req">*</span></div>
                  <DatePicker value={payDate} onChange={setPayDate} />
                </div>
              </div>
              <div className="fg mb-[14px]">
                <div className="lbl">PNR Number</div>
                <input className="ctrl" type="text" placeholder="Optional reference number" value={pnrNumber} onChange={e => setPnrNumber(e.target.value)} />
              </div>
              <div className="fg mb-4">
                <div className="lbl">Remarks</div>
                <textarea className="ctrl" rows={2} placeholder="Optional notes" value={remarks} onChange={e => setRemarks(e.target.value)} />
              </div>
              <div className="flex gap-[10px] justify-end items-center">
                {editingGuid && <button className="btn btn-neu" onClick={resetForm}><i className="lni lni-close"></i> Cancel Edit</button>}
                <button className="btn btn-primary btn-lg" disabled={isSaving} onClick={handleSave}>
                  <i className="lni lni-save"></i> {isSaving ? 'Saving…' : editingGuid ? 'Update NCHE Payment' : 'Save NCHE Payment'}
                </button>
              </div>
            </div>

            <div className="card">
              <div className="card-hdr">
                <div className="card-title"><span className="ctitle-icon"><i className="lni lni-files"></i></span> Payment History</div>
              </div>
              {isHistoryLoading ? (
                <div className="text-g400 text-center" style={{ padding: 16, fontSize: 12.5 }}>Loading payment history…</div>
              ) : history.length === 0 ? (
                <div className="text-g400 text-center" style={{ padding: 16, fontSize: 12.5 }}>No NCHE payments recorded yet.</div>
              ) : (
                <ScrollTable className="no-sticky-col">
                  <table>
                    <thead><tr><th>Payment Date</th><th>PNR Number</th><th>Amount</th><th>Remarks</th><th style={{ width: 90 }}></th></tr></thead>
                    <tbody>
                      {history.map(h => (
                        <tr key={h.paymentNcheGuid}>
                          <td>{h.payDate.slice(0, 10)}</td>
                          <td className="font-mono text-blue">{h.pnrNumber ?? '—'}</td>
                          <td className="text-green font-bold">{h.amount.toLocaleString()}</td>
                          <td className="text-muted">{h.remarks ?? '—'}</td>
                          <td>
                            <div className="flex gap-2">
                              <button className="btn-icon" title="Edit" onClick={() => startEdit(h)}><i className="lni lni-pencil-alt"></i></button>
                              <button className="btn-icon" title="Delete" style={{ color: 'var(--red)' }} onClick={() => handleDelete(h)}><i className="lni lni-trash-can"></i></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </ScrollTable>
              )}
            </div>
          </>
        )}
      </div>

      {successModal && (
        <PaymentSuccessModal
          isOpen={!!successModal}
          onClose={() => setSuccessModal(null)}
          showToast={showToast}
          title={successModal.title}
          rows={successModal.rows}
        />
      )}
      <Toast toast={toast} />
    </>
  )
}
