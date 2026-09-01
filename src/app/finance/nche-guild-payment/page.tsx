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
  useCreateRegulatoryPayment,
  useUpdateRegulatoryPayment,
  useDeleteRegulatoryPayment,
  useRegulatoryPaymentHistory,
  useRegulatorySemesterStatus,
  useNcheStudentSearch,
  PaymentCategory,
  RegulatoryPaymentHistoryEntry,
} from '@/hooks/finance/useNcheGuildPayment'

// Merged NCHE + Guild Payment page — combines the two previously separate
// nche-payment/guild-payment pages behind a single tab switcher, per
// request (2026-09-01). Both categories share the exact same student
// search/profile/outstanding-balance flow (Payment Console's own search/
// profile/outstanding-all endpoints) and the same CRUD + status shape
// against erp-finance-compliance-service — only the URL segment (nche/
// vs. guild/) and a couple of payload fields differ (pnrNumber+remarks for
// NCHE vs. bankDeposit+receipt for Guild), which useNcheGuildPayment's
// `category` param and this page's own field-toggle handle. Switching tabs
// keeps the selected student (search/profile/outstanding are category-
// agnostic) and only resets the payment form + history/status queries to
// the newly active category.
const OUTSTANDING_LEDGER_CATEGORY: Record<PaymentCategory, number> = { nche: 3, guild: 4 }
const CATEGORY_LABEL: Record<PaymentCategory, string> = { nche: 'NCHE', guild: 'Guild' }

function applicantName(a: { firstName: string | null; lastName: string | null }) {
  return `${a.firstName ?? ''}${a.lastName ? ` ${a.lastName}` : ''}`.trim() || '—'
}
function searchResultName(a: { studentName: string | null; firstName: string | null }) {
  return a.studentName || a.firstName || '—'
}

// The NCHE tab's dedicated picker (get-nche-search.md) returns a
// differently-shaped item (studentName/studentNum/programName/semesterName,
// no appRefNo/phone/email) than the Guild tab's generic Payment Console
// search (appRefNo/firstName/phone/emailId) — both are normalized into this
// one shape so the dropdown/select-handler below don't need to branch on
// category. `applicationGuid` is nullable coming off the NCHE picker (a hit
// with no active application) — those rows render but aren't selectable,
// since everything downstream (profile/outstanding/history) keys off it.
interface SearchHit {
  key: string
  applicationGuid: string | null
  studentGuid: string | null
  name: string
  subtitle: string
}
function initialsFor(name: string) {
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '—'
}
function todayYmd() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}
// status is exactly "Paid" | "Due" | "" per nche/get-semester-status.md —
// matched precisely rather than by substring, with the same grey fallback
// an earlier, wrong-shape version of this function used for "anything
// unrecognized" (Guild's status values are inferred identical, not
// independently confirmed).
function statusBadgeClass(status: string | null | undefined) {
  if (status === 'Paid') return 'badge-green'
  if (status === 'Due') return 'badge-red'
  return 'badge-grey'
}

// Same label-left/value-right treatment as Payment Console's own
// OutstandingCategoryTable — NCHE/Guild rows have no ledger/semester/
// currency structure (confirmed via get-all-outstanding-ledgers.md: those
// fields come back null for NCHE/Guild specifically), just a flat
// description + outstanding amount per row.
function RegulatoryOutstandingTable({ items, isLoading, isError, category }: { items: AllOutstandingItem[]; isLoading: boolean; isError: boolean; category: PaymentCategory }) {
  if (isLoading) return <div className="text-g400 text-center" style={{ padding: 16, fontSize: 12.5 }}>Loading outstanding balance…</div>
  if (isError) return <div className="text-clr-red text-center" style={{ padding: 16, fontSize: 12.5 }}><i className="lni lni-warning"></i> Couldn&apos;t load the outstanding balance.</div>
  if (items.length === 0) return <div className="text-g400 text-center" style={{ padding: 16, fontSize: 12.5 }}>Fully settled — nothing outstanding on {CATEGORY_LABEL[category]}.</div>
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

export default function NcheGuildPaymentPage() {
  const router = useRouter()
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)
  function showToast(msg: string, type = '') { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }
  const [successModal, setSuccessModal] = useState<{ title: string; rows: [string, string][] } | null>(null)

  const [category, setCategory] = useState<PaymentCategory>('nche')

  const [search, setSearch] = useState('')
  const [committedSearch, setCommittedSearch] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const searchBoxRef = useRef<HTMLDivElement>(null)
  const [selectedApplicationGuid, setSelectedApplicationGuid] = useState<string | null>(null)
  const [selectedStudentGuidHint, setSelectedStudentGuidHint] = useState<string | null>(null)

  const searchTermLen = search.trim().length
  const searchEnabled = searchFocused && (searchTermLen === 0 || searchTermLen >= 2)
  const searchTerm = committedSearch || search.trim()

  // NCHE has its own dedicated picker (get-nche-search.md); Guild has no
  // documented equivalent yet and still goes through Payment Console's
  // generic search — only one of these two hooks is actually enabled at a
  // time, gated on the active tab.
  const { data: ncheResults, isFetching: isNcheSearching, isError: isNcheSearchError, error: ncheSearchError } = useNcheStudentSearch(
    searchTerm, 1, 15, category === 'nche' && searchEnabled,
  )
  const { data: guildResults, isFetching: isGuildSearching, isError: isGuildSearchError, error: guildSearchError } = useSearchStudents(
    searchTerm, 1, 15, category === 'guild' && searchEnabled,
  )

  const isSearching = category === 'nche' ? isNcheSearching : isGuildSearching
  const isSearchError = category === 'nche' ? isNcheSearchError : isGuildSearchError
  const searchError = category === 'nche' ? ncheSearchError : guildSearchError
  const matches: SearchHit[] = category === 'nche'
    ? (ncheResults?.items ?? []).map((a, i) => ({
      key: `${a.applicationGuid ?? a.studentGuid}-${i}`,
      applicationGuid: a.applicationGuid,
      studentGuid: a.studentGuid,
      name: a.studentName || a.studentNum || '—',
      subtitle: [a.studentNum, a.programName, a.semesterName].filter(Boolean).join(' · ') || '—',
    }))
    : (guildResults?.items ?? []).map(a => ({
      key: a.applicationGuid,
      applicationGuid: a.applicationGuid,
      studentGuid: a.studentGuid,
      name: searchResultName(a) as string,
      subtitle: [a.appRefNo, a.phone ?? '—', a.emailId ?? '—'].join(' · '),
    }))

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
  const categoryOutstanding = allOutstanding.filter(i => i.category === OUTSTANDING_LEDGER_CATEGORY[category])

  // get-semester-status returns one row per semester in the program, not a
  // single current-status object — the badge shows whichever semester is
  // currently Due (the one the cashier should be collecting for), falling
  // back to "fully paid" once nothing is left Due.
  const { data: semesterStatusList } = useRegulatorySemesterStatus(category, selectedApplicationGuid, !!selectedApplicationGuid, studentGuid)
  const dueSemester = semesterStatusList?.find(s => s.status === 'Due') ?? null
  const allSemestersPaid = !!semesterStatusList?.length && semesterStatusList.every(s => s.status === 'Paid')
  const { data: history = [], isLoading: isHistoryLoading } = useRegulatoryPaymentHistory(category, studentGuid, !!studentGuid)

  const [amount, setAmount] = useState('')
  const [payDate, setPayDate] = useState(todayYmd)
  const [pnrNumber, setPnrNumber] = useState('')
  const [remarks, setRemarks] = useState('')
  const [bankDeposit, setBankDeposit] = useState('')
  // Set while editing an existing history row — Save switches to Update
  // (PUT) against this guid instead of Create (POST); cleared on
  // save/cancel/student change/tab switch.
  const [editingGuid, setEditingGuid] = useState<string | null>(null)

  const createPayment = useCreateRegulatoryPayment(category)
  const updatePayment = useUpdateRegulatoryPayment(category)
  const deletePayment = useDeleteRegulatoryPayment(category)

  function resetForm() {
    setAmount('')
    setPayDate(todayYmd())
    setPnrNumber('')
    setRemarks('')
    setBankDeposit('')
    setEditingGuid(null)
  }

  function switchCategory(next: PaymentCategory) {
    if (next === category) return
    setCategory(next)
    resetForm()
  }

  function selectStudent(applicationGuid: string, name: string, studentGuidHintVal: string | null) {
    setSelectedApplicationGuid(applicationGuid)
    setSelectedStudentGuidHint(studentGuidHintVal)
    setSearch(name)
    setCommittedSearch('')
    setSearchFocused(false)
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

  function startEdit(entry: RegulatoryPaymentHistoryEntry) {
    setEditingGuid(entry.paymentGuid)
    setAmount(String(entry.amount))
    setPayDate(entry.payDate.slice(0, 10))
    setPnrNumber(entry.pnrNumber ?? '')
    setRemarks(entry.remarks ?? '')
    setBankDeposit(entry.bankDeposit ?? '')
  }

  function handleDelete(entry: RegulatoryPaymentHistoryEntry) {
    if (!selectedApplicationGuid) return
    if (!window.confirm(`Delete this ${CATEGORY_LABEL[category]} payment? This cannot be undone.`)) return
    deletePayment.mutate(
      { paymentGuid: entry.paymentGuid, applicationGuid: selectedApplicationGuid, studentGuid },
      {
        onSuccess: () => {
          showToast('Payment deleted.', 'ok')
          if (editingGuid === entry.paymentGuid) resetForm()
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

    const categoryFields = category === 'nche'
      ? { pnrNumber: pnrNumber.trim() || null, remarks: remarks.trim() || null }
      : { bankDeposit: bankDeposit.trim() || null }

    if (editingGuid) {
      updatePayment.mutate(
        { paymentGuid: editingGuid, input: { amount: amt, payDate, ...categoryFields }, applicationGuid: selectedApplicationGuid, studentGuid },
        {
          onSuccess: result => {
            setSuccessModal({ title: `${CATEGORY_LABEL[category]} Payment Updated`, rows: [['Amount', amt.toLocaleString()], ['Remaining Balance', result.remainingBalance.toLocaleString()]] })
            resetForm()
          },
          onError: (error: Error) => showToast(error.message || `Failed to update ${CATEGORY_LABEL[category]} payment. Please try again.`, 'error'),
        },
      )
      return
    }

    createPayment.mutate(
      { applicationGuid: selectedApplicationGuid, studentGuid, amount: amt, payDate, ...categoryFields },
      {
        onSuccess: result => {
          setSuccessModal({
            title: `${CATEGORY_LABEL[category]} Payment Recorded`,
            rows: [
              ['Amount', amt.toLocaleString()],
              ['Remaining Balance', result.remainingBalance.toLocaleString()],
            ],
          })
          resetForm()
        },
        onError: (error: Error) => {
          // Same 400 "not a multiple of the configured rate"/"exceeds
          // outstanding balance" business errors each doc describes —
          // surfaced as-is rather than guessed at, since the rate isn't
          // known here.
          showToast(error.message || `Failed to save ${CATEGORY_LABEL[category]} payment. Please try again.`, 'error')
        },
      },
    )
  }

  const isSaving = createPayment.isPending || updatePayment.isPending

  return (
    <>
      <div className="page active">
        <div className="pg-hdr">
          <div>
            <div className="pg-title">NCHE &amp; Guild Payment</div>
            <div className="pg-sub">Search student → view outstanding balance → record payment</div>
          </div>
          <div className="flex gap-2">
            {selectedApplicationGuid && <button className="btn btn-neu" onClick={handleClear}><i className="lni lni-reload"></i> New Search</button>}
            <button className="btn btn-neu" onClick={() => router.push('/finance/dashboard')}><i className="lni lni-arrow-left"></i> Back</button>
          </div>
        </div>

        <div className="card p-0 overflow-hidden">
          <div className="tab-bar">
            <button className={`tab-btn${category === 'nche' ? ' active' : ''}`} onClick={() => switchCategory('nche')}>
              <i className="lni lni-graduation"></i> NCHE
            </button>
            <button className={`tab-btn${category === 'guild' ? ' active' : ''}`} onClick={() => switchCategory('guild')}>
              <i className="lni lni-users"></i> Guild
            </button>
          </div>
        </div>

        <div className="card">
          <div className="card-hdr">
            <div className="card-title"><span className="ctitle-icon"><i className="lni lni-search-alt"></i></span> Student Search</div>
          </div>
          <div className="fg" style={{ marginBottom: 0, position: 'relative' }} ref={searchBoxRef}>
            <div className="lbl">{category === 'nche' ? 'Search by Student Name or Registration No' : 'Search by Applicant Name, Ref No, Phone, or Email'} <span className="req">*</span></div>
            <div className="inp-wrap">
              <span className="inp-icon"><i className="lni lni-search-alt"></i></span>
              <input
                className="ctrl"
                type="text"
                placeholder={category === 'nche' ? 'e.g. STU/2024/001 or Tumukunde Alice' : 'e.g. APP20222/667 or Tumukunde Alice'}
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
                {matches.map(a => {
                  const selectable = !!a.applicationGuid
                  return (
                    <div
                      key={a.key}
                      className={selectable ? 'cursor-pointer px-3 py-2 hover:bg-b50 border-b border-g100 last:border-b-0' : 'px-3 py-2 border-b border-g100 last:border-b-0 opacity-50'}
                      title={selectable ? undefined : 'No active application on file — cannot be selected here.'}
                      onClick={() => selectable && selectStudent(a.applicationGuid as string, a.name, a.studentGuid)}
                    >
                      <div className="font-bold">{a.name}</div>
                      <div className="text-g500" style={{ fontSize: 11 }}>{a.subtitle}</div>
                    </div>
                  )
                })}
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
                <div className="card-title"><span className="ctitle-icon"><i className="lni lni-dollar"></i></span> Outstanding Balance ({CATEGORY_LABEL[category]})</div>
                {dueSemester ? (
                  <span className={`badge ${statusBadgeClass(dueSemester.status)}`}>{dueSemester.semName} — Due</span>
                ) : allSemestersPaid ? (
                  <span className="badge badge-green">Fully Paid</span>
                ) : null}
              </div>
              <RegulatoryOutstandingTable items={categoryOutstanding} isLoading={isOutstandingLoading} isError={isOutstandingError} category={category} />
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
                  <div style={{ fontSize: 11, color: 'var(--g500)', marginTop: 4 }}>Must be a multiple of the configured {CATEGORY_LABEL[category]} rate — enforced server-side.</div>
                </div>
                <div className="fg">
                  <div className="lbl">Payment Date <span className="req">*</span></div>
                  <DatePicker value={payDate} onChange={setPayDate} />
                </div>
              </div>
              {category === 'nche' ? (
                <>
                  <div className="fg mb-[14px]">
                    <div className="lbl">PNR Number</div>
                    <input className="ctrl" type="text" placeholder="Optional reference number" value={pnrNumber} onChange={e => setPnrNumber(e.target.value)} />
                  </div>
                  <div className="fg mb-4">
                    <div className="lbl">Remarks</div>
                    <textarea className="ctrl" rows={2} placeholder="Optional notes" value={remarks} onChange={e => setRemarks(e.target.value)} />
                  </div>
                </>
              ) : (
                <div className="fg mb-4">
                  <div className="lbl">Bank Deposit</div>
                  <input className="ctrl" type="text" placeholder="Optional bank deposit reference" value={bankDeposit} onChange={e => setBankDeposit(e.target.value)} />
                </div>
              )}
              <div className="flex gap-[10px] justify-end items-center">
                {editingGuid && <button className="btn btn-neu" onClick={resetForm}><i className="lni lni-close"></i> Cancel Edit</button>}
                <button className="btn btn-primary btn-lg" disabled={isSaving} onClick={handleSave}>
                  <i className="lni lni-save"></i> {isSaving ? 'Saving…' : editingGuid ? `Update ${CATEGORY_LABEL[category]} Payment` : `Save ${CATEGORY_LABEL[category]} Payment`}
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
                <div className="text-g400 text-center" style={{ padding: 16, fontSize: 12.5 }}>No {CATEGORY_LABEL[category]} payments recorded yet.</div>
              ) : (
                <ScrollTable className="no-sticky-col">
                  <table>
                    <thead>
                      <tr>
                        <th>Payment Date</th>
                        {category === 'nche' ? <th>PNR Number</th> : <><th>Bank Deposit</th><th>Receipt</th></>}
                        <th>Amount</th>
                        {category === 'nche' && <th>Remarks</th>}
                        <th style={{ width: 90 }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map(h => (
                        <tr key={h.paymentGuid}>
                          <td>{h.payDate.slice(0, 10)}</td>
                          {category === 'nche' ? (
                            <td className="font-mono text-blue">{h.pnrNumber ?? '—'}</td>
                          ) : (
                            <>
                              <td className="text-muted">{h.bankDeposit ?? '—'}</td>
                              <td className="font-mono text-blue">{h.receipt ?? '—'}</td>
                            </>
                          )}
                          <td className="text-green font-bold">{h.amount.toLocaleString()}</td>
                          {category === 'nche' && <td className="text-muted">{h.remarks ?? '—'}</td>}
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
