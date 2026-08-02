'use client'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Toast } from '@/components/Toast'
import { ScrollTable } from '@/components/ScrollTable'
import { useProcBanks } from '@/hooks/finance/useProcBanks'
import { useReceiptBooks } from '@/hooks/finance/useReceiptBooks'
import { useFinanceCurrencies } from '@/hooks/finance/useFinanceCurrencies'
import { useCampuses } from '@/hooks/config/useCampuses'
import { useProgramMasters } from '@/hooks/academic/useProgramMaster'
import { useBatches } from '@/hooks/academic/useBatches'
import { useSemestersForProgram } from '@/hooks/academic/useSemesters'
import {
  useSearchStudents,
  useStudentProfile,
  useOutstandingLedgers,
  usePaymentHistory,
  usePayableLedgers,
  useCreatePayment,
  PAYMENT_CATEGORY_LABELS,
  PAY_TYPE_LABELS,
} from '@/hooks/finance/usePaymentConsole'

function fmtUGX(n: number) { return n > 0 ? `UGX ${Math.round(n).toLocaleString()}` : '—' }

function applicantName(a: { firstName: string | null; lastName: string | null }) {
  return `${a.firstName ?? ''}${a.lastName ? ` ${a.lastName}` : ''}`.trim() || '—'
}

function initialsFor(name: string) {
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '—'
}

function todayYmd() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

interface ReceiptData {
  ref: string; code: string; name: string; refNo: string; prog: string; method: string
  date: string; amount: string; balance: string; advanceMessage: string | null
}

export default function PaymentConsolePage() {
  const router = useRouter()
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)
  function showToast(msg: string, type = '') { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }

  const { data: allProcBanks = [] } = useProcBanks()
  const banks = allProcBanks.filter(b => b.status === 2)
  const { data: allReceiptBooks = [] } = useReceiptBooks()
  const receiptBooks = allReceiptBooks.filter(r => r.status === 1)
  const { data: currencies = [] } = useFinanceCurrencies()

  // Purely informational reference rates — no longer feeds any computation
  // (GetPayableLedgers/CreatePayment both operate in the payment's own real
  // currency via currencyGuid/intCurrency, no client-side UGX conversion
  // happens anywhere in the real flow).
  const [usdRate, setUsdRate] = useState('3750')
  const [kesRate, setKesRate] = useState('28.5')

  const [search, setSearch] = useState('')
  const [committedSearch, setCommittedSearch] = useState('')
  const [selectedApplicationGuid, setSelectedApplicationGuid] = useState<string | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  const [amount, setAmount] = useState('')
  const [currencyGuid, setCurrencyGuid] = useState('')
  const [payDate, setPayDate] = useState(todayYmd)
  const [payType, setPayType] = useState('1')
  const [receiptBookGuid, setReceiptBookGuid] = useState('')
  const [procBankGuid, setProcBankGuid] = useState('')
  const [bankRef, setBankRef] = useState('')
  const [remarks, setRemarks] = useState('')

  const [receipt, setReceipt] = useState<ReceiptData | null>(null)

  // Debounced so GetPayableLedgers isn't hit on every keystroke.
  const [debouncedAmount, setDebouncedAmount] = useState('')
  useEffect(() => {
    const t = setTimeout(() => setDebouncedAmount(amount), 400)
    return () => clearTimeout(t)
  }, [amount])

  // Only fires on Search click / Enter (not on every keystroke) — same gate
  // the old client-side filter had, just now driving a real network call.
  const { data: searchResults, isFetching: isSearching } = useSearchStudents(committedSearch, 1, 20, !!committedSearch.trim())
  const matches = searchResults?.items ?? []

  const { data: profile, isLoading: isProfileLoading } = useStudentProfile(selectedApplicationGuid, !!selectedApplicationGuid)
  const { data: ledgers = [], isLoading: isLedgersLoading } = useOutstandingLedgers(selectedApplicationGuid, !!selectedApplicationGuid)
  // isError kept separate from the [] fallback on purpose — a failed fetch
  // (confirmed live: this endpoint can 500 with server_error for some
  // applications) must not render the same "No payment history" message as
  // a genuinely empty result, since that would misreport a backend failure
  // as "this student has no payment history."
  const { data: paymentHistory = [], isLoading: isHistoryLoading, isError: isHistoryError } = usePaymentHistory(selectedApplicationGuid, !!selectedApplicationGuid && showHistory)

  // Client-side name resolution for the profile's guid FKs — same fallback
  // pattern used throughout the app (faculty.ts's deanName, enquiry-list's
  // resolveProgramName) rather than trusting a resolved string on the DTO.
  const { data: campuses = [] } = useCampuses()
  const { data: programs = [] } = useProgramMasters()
  const { data: allBatchesData } = useBatches(1, 1000)
  const batches = allBatchesData?.items ?? []
  const { data: semesters = [] } = useSemestersForProgram(profile?.programGuid ?? '', !!profile?.programGuid)

  const campusName = campuses.find(c => c.campusGuid === profile?.campusGuid)?.campusName
  const programName = programs.find(p => p.programGuid === profile?.programGuid)?.programName
  const batchCode = batches.find(b => b.batchGuid === profile?.batchGuid)?.batchCode
  const semName = semesters.find(s => s.semesterGuid === profile?.semesterGuid)?.semName

  const totalOutstanding = ledgers.reduce((sum, l) => sum + l.outstanding, 0)
  const selectedCurrency = currencies.find(c => c.currencyGuid === currencyGuid)

  const payableLedgersParams = useMemo(() => {
    const amt = parseFloat(debouncedAmount) || 0
    if (!selectedApplicationGuid || !selectedCurrency || amt <= 0 || !payDate) return null
    return { applicationGuid: selectedApplicationGuid, amount: amt, intCurrency: selectedCurrency.intCurrency, payDate }
  }, [selectedApplicationGuid, selectedCurrency, debouncedAmount, payDate])

  const { data: payableLedgers, isFetching: isPreviewLoading } = usePayableLedgers(payableLedgersParams, !!payableLedgersParams)

  const createPayment = useCreatePayment()

  function handleSearchClick() {
    const term = search.trim()
    if (!term) { showToast('Please enter a student number or name.', 'warn'); return }
    setCommittedSearch(term)
  }

  function resetPaymentForm() {
    setAmount('')
    setCurrencyGuid('')
    setPayDate(todayYmd())
    setPayType('1')
    setReceiptBookGuid('')
    setProcBankGuid('')
    setBankRef('')
    setRemarks('')
    setReceipt(null)
  }

  function selectStudent(applicationGuid: string, name: string) {
    setSelectedApplicationGuid(applicationGuid)
    setSearch(name)
    setCommittedSearch('')
    setShowDetails(false)
    setShowHistory(false)
    resetPaymentForm()
    showToast(`Loaded: ${name}`, 'success')
  }

  const showBankFields = Number(payType) > 1

  function handleSave() {
    if (!profile || !selectedApplicationGuid) { showToast('Please select a student first.', 'warn'); return }
    const amt = parseFloat(amount) || 0
    if (amt <= 0) { showToast('Amount must be greater than 0.', 'warn'); return }
    if (!selectedCurrency) { showToast('Please select a payment currency.', 'warn'); return }
    if (!receiptBookGuid) { showToast('Please select a receipt book.', 'warn'); return }
    if (!payDate) { showToast('Please select a payment date.', 'warn'); return }
    const payTypeNum = Number(payType)
    if (showBankFields && !procBankGuid) { showToast('Please select a bank.', 'warn'); return }

    createPayment.mutate(
      {
        applicationGuid: selectedApplicationGuid,
        studentGuid: null,
        amount: amt,
        currencyGuid: selectedCurrency.currencyGuid,
        receiptBookGuid,
        payDate,
        payType: payTypeNum,
        procBankGuid: showBankFields ? procBankGuid : null,
        remarks: remarks.trim() || null,
      },
      {
        onSuccess: result => {
          const now = new Date()
          setReceipt({
            ref: result.receipt,
            code: result.paymentCode,
            name: applicantName(profile),
            refNo: profile.appRefNo,
            prog: programName ?? '—',
            method: PAY_TYPE_LABELS[payTypeNum] ?? `Type ${payTypeNum}`,
            date: now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' + now.toLocaleTimeString(),
            amount: `${amt.toLocaleString()} ${selectedCurrency.currencyCode}`,
            balance: `${selectedCurrency.currencyCode} ${result.balance.toLocaleString()}`,
            advanceMessage: result.advanceMessage,
          })
          showToast(`Payment saved! Receipt ${result.receipt} generated.`, 'success')
        },
        onError: (error: Error) => showToast(error.message || 'Failed to save payment. Please try again.', 'error'),
      },
    )
  }

  function handleClear() {
    setSelectedApplicationGuid(null)
    setSearch('')
    setCommittedSearch('')
    resetPaymentForm()
    setShowDetails(false)
    setShowHistory(false)
    showToast('Form cleared.', 'warn')
  }

  return (
    <>
      <div className="page active">

        {/* Exchange Rate Bar */}
        <div className="card flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-[7px] font-bold text-g700" style={{ fontSize: 'var(--fs-sm)' }}>
            <i className="lni lni-money-protection"></i> Today&apos;s Exchange Rates
            <span className="badge badge-blue text-[10px]">Daily Rate</span>
          </div>
          <div className="flex items-center gap-[6px] flex-wrap text-[var(--fs-sm)]">
            <span className="text-muted">1 USD =</span>
            <input type="number" className="ctrl" value={usdRate} onChange={e => setUsdRate(e.target.value)}
              style={{ width: 72, padding: '5px 9px', fontSize: 13, fontWeight: 700, color: 'var(--b800)' }} />
            <span className="badge badge-gold">UGX</span>
          </div>
          <div className="flex items-center gap-[6px] flex-wrap text-[var(--fs-sm)]">
            <span className="text-muted">1 KES =</span>
            <input type="number" className="ctrl" value={kesRate} onChange={e => setKesRate(e.target.value)}
              style={{ width: 72, padding: '5px 9px', fontSize: 13, fontWeight: 700, color: 'var(--b800)' }} />
            <span className="badge badge-gold">UGX</span>
          </div>
          <div className="flex items-center gap-[7px] flex-wrap" style={{ marginLeft: 'auto' }}>
            <span className="text-g400" style={{ fontSize: 'var(--fs-xs)' }}>Last updated: Today 08:30 AM</span>
            <button className="btn btn-neu btn-sm" style={{ fontSize: 11 }} onClick={() => showToast('Rates refreshed.', 'success')}>
              <i className="lni lni-reload"></i> Refresh
            </button>
          </div>
        </div>

        <div className="pg-hdr">
          <div>
            <div className="pg-title">Payment Collection Console</div>
            <div className="pg-sub">Search student → view outstanding balance → record tuition payment → server-computed allocation</div>
          </div>
          <button className="btn btn-neu" onClick={() => router.push('/finance/dashboard')}><i className="lni lni-arrow-left"></i> Back</button>
        </div>

        <div className="g2">
          {/* LEFT column */}
          <div className="flex flex-col gap-5">

            {/* Step 1: Student Lookup */}
            <div className="card">
              <div className="card-hdr">
                <div className="card-title"><span className="ctitle-icon"><i className="lni lni-search-alt"></i></span> Step 1 · Student Lookup</div>
              </div>
              <div className="fg" style={{ marginBottom: 0 }}>
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
                      onKeyDown={e => { if (e.key === 'Enter') handleSearchClick() }}
                    />
                  </div>
                  <button className="btn btn-primary" onClick={handleSearchClick}><i className="lni lni-search-alt"></i> Search</button>
                </div>
              </div>

              {isSearching && <div className="mt-2 text-g400" style={{ fontSize: 12.5 }}>Searching…</div>}
              {!isSearching && committedSearch && matches.length === 0 && (
                <div className="mt-2 text-g400" style={{ fontSize: 12.5 }}>No matching applications found.</div>
              )}

              {matches.length > 0 && (
                <div className="mt-2" style={{ border: '1.5px solid var(--b200)', borderRadius: 'var(--rsm)', overflow: 'hidden' }}>
                  {matches.map(a => (
                    <div
                      key={a.applicationGuid}
                      className="cursor-pointer px-3 py-2 hover:bg-b50 border-b border-g100 last:border-b-0"
                      onClick={() => selectStudent(a.applicationGuid, applicantName(a))}
                    >
                      <div className="font-bold">{applicantName(a)}</div>
                      <div className="text-g500" style={{ fontSize: 11 }}>{a.appRefNo} · {a.phone ?? '—'} · {a.emailId ?? '—'}</div>
                    </div>
                  ))}
                </div>
              )}

              {isProfileLoading && selectedApplicationGuid && (
                <div className="mt-4 text-g400" style={{ fontSize: 12.5 }}>Loading applicant profile…</div>
              )}

              {profile && selectedApplicationGuid && (
                <div className="mt-4 p-4 rounded-[var(--rsm)] bg-b50 border border-[1.5px] border-b100">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-11 h-11 rounded-full flex-shrink-0 grid place-items-center text-white font-extrabold" style={{ background: 'linear-gradient(135deg,var(--b700),var(--b500))', fontSize: 15 }}>
                      {initialsFor(applicantName(profile))}
                    </div>
                    <div className="flex-1">
                      <div className="font-extrabold text-g900" style={{ fontSize: 15 }}>{applicantName(profile)}</div>
                      <div className="text-g500 text-xs">{programName ?? '—'}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-g400" style={{ fontSize: 10.5 }}>App. Ref</div>
                      <div className="font-mono font-bold text-blue" style={{ fontSize: 13 }}>{profile.appRefNo}</div>
                    </div>
                  </div>
                  <div className="g3 text-xs">
                    <div><span className="text-muted">Campus: </span><span className="font-bold">{campusName ?? '—'}</span></div>
                    <div><span className="text-muted">Semester: </span><span className="font-bold">{semName ?? '—'}</span></div>
                    <div><span className="text-muted">Intake: </span><span className="font-bold">{profile.intakeCode ?? '—'}</span></div>
                  </div>
                  <div className="mt-[10px] pt-[10px]" style={{ borderTop: '1px solid var(--b100)' }}>
                    <button className="btn btn-neu btn-sm" onClick={() => setShowDetails(v => !v)}>
                      <i className="lni lni-eye"></i> {showDetails ? 'Hide Details' : 'Show Details'}
                    </button>
                  </div>
                  {showDetails && (
                    <div className="mt-[10px]">
                      <div className="sec-divider" style={{ marginTop: 0 }}>Extended Profile</div>
                      <div className="g2 text-xs">
                        <div><span className="text-muted">Email: </span><span className="font-bold">{profile.emailId ?? profile.universityEmail ?? '—'}</span></div>
                        <div><span className="text-muted">Phone: </span><span className="font-bold">{profile.phone ?? '—'}</span></div>
                        <div><span className="text-muted">Batch: </span><span className="font-bold">{batchCode ?? '—'}</span></div>
                        <div><span className="text-muted">Year: </span><span className="font-bold">{profile.yearCode ?? '—'}</span></div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Step 2: Outstanding Balance */}
            {selectedApplicationGuid && (
              <div className="card">
                <div className="card-hdr">
                  <div className="card-title"><span className="ctitle-icon"><i className="lni lni-dollar"></i></span> Step 2 · Outstanding Balance</div>
                  <span className="badge badge-amber">{fmtUGX(totalOutstanding)} outstanding</span>
                </div>
                {isLedgersLoading ? (
                  <div className="text-g400 text-center" style={{ padding: 16, fontSize: 12.5 }}>Loading ledgers…</div>
                ) : ledgers.length === 0 ? (
                  <div className="text-g400 text-center" style={{ padding: 16, fontSize: 12.5 }}>No outstanding tuition ledgers for this application.</div>
                ) : (
                  <ScrollTable>
                    <table>
                      <thead><tr><th>Ledger</th><th>Paid</th><th>Outstanding</th><th>Cur.</th></tr></thead>
                      <tbody>
                        {ledgers.map(l => (
                          <tr key={l.intLedger}>
                            <td>{l.ledgerName}{l.ledgerNum ? <span className="text-g400"> ({l.ledgerNum})</span> : null}</td>
                            <td className={l.paidAmount > 0 ? 'text-green font-bold' : 'text-muted'}>{l.paidAmount > 0 ? `${l.currencyName} ${l.paidAmount.toLocaleString()} ✓` : '—'}</td>
                            <td className={l.outstanding === 0 ? 'text-green font-bold' : 'text-amber'}>{l.outstanding > 0 ? `${l.currencyName} ${l.outstanding.toLocaleString()}` : '0 ✓'}</td>
                            <td><span className="badge badge-gold">{l.currencyName}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </ScrollTable>
                )}
                <div className="mt-[10px]">
                  <button className="btn btn-neu btn-sm justify-between w-full" onClick={() => setShowHistory(v => !v)}>
                    <span><i className="lni lni-folder"></i> Payment History</span>
                    <span>{showHistory ? '▴' : '▾'}</span>
                  </button>
                  {showHistory && (
                    <div className="mt-2">
                      {isHistoryLoading ? (
                        <div className="text-g400 text-center" style={{ padding: 12, fontSize: 12.5 }}>Loading payment history…</div>
                      ) : isHistoryError ? (
                        <div className="text-clr-red text-center" style={{ padding: 12, fontSize: 12.5 }}>
                          <i className="lni lni-warning"></i> Couldn&apos;t load payment history. Please try again.
                        </div>
                      ) : paymentHistory.length === 0 ? (
                        <div className="text-g400 text-center" style={{ padding: 12, fontSize: 12.5 }}>No payment history for this application.</div>
                      ) : (
                        <ScrollTable>
                          <table>
                            <thead><tr><th>Date</th><th>Category</th><th>Amount Paid</th><th>Method</th><th>Receipt #</th></tr></thead>
                            <tbody>
                              {paymentHistory.map(h => (
                                <tr key={h.paymentGuid}>
                                  <td>{h.payDate.slice(0, 10)}</td>
                                  <td>{PAYMENT_CATEGORY_LABELS[h.category] ?? `Category ${h.category}`}</td>
                                  <td className="text-green font-bold">{h.currencyName} {h.amount.toLocaleString()}</td>
                                  <td><span className="pill pill-blue">{PAY_TYPE_LABELS[h.payType] ?? `Type ${h.payType}`}</span></td>
                                  <td className="font-mono text-blue">{h.receipt ?? h.paymentCode}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </ScrollTable>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Record Payment */}
            {selectedApplicationGuid && !receipt && (
              <div className="card">
                <div className="card-hdr">
                  <div className="card-title"><span className="ctitle-icon"><i className="lni lni-credit-cards"></i></span> Step 3 · Record Payment</div>
                </div>

                <div className="g2 mb-[14px]">
                  <div className="fg">
                    <div className="lbl">Amount Received <span className="req">*</span></div>
                    <input type="number" min={0} step={0.01} className="amt-val-input" placeholder="0.00"
                      style={{ fontSize: 18, fontWeight: 700 }}
                      value={amount} onChange={e => setAmount(e.target.value)} />
                  </div>
                  <div className="fg">
                    <div className="lbl">Currency Received <span className="req">*</span></div>
                    <select className="ctrl" value={currencyGuid} onChange={e => setCurrencyGuid(e.target.value)}>
                      <option value="">— Select Currency —</option>
                      {currencies.map(c => <option key={c.currencyGuid} value={c.currencyGuid}>{c.currencyCode} — {c.currencyName}</option>)}
                    </select>
                  </div>
                </div>

                <div className="g2 mb-[14px]">
                  <div className="fg">
                    <div className="lbl">Payment Date <span className="req">*</span></div>
                    <input className="ctrl" type="date" value={payDate} onChange={e => setPayDate(e.target.value)} />
                  </div>
                  <div className="fg">
                    <div className="lbl">Payment Method <span className="req">*</span></div>
                    <select className="ctrl" value={payType} onChange={e => setPayType(e.target.value)}>
                      {Object.entries(PAY_TYPE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </select>
                  </div>
                </div>

                <div className="fg mb-[14px]">
                  <div className="lbl">Receipt Book <span className="req">*</span></div>
                  <select className="ctrl" value={receiptBookGuid} onChange={e => setReceiptBookGuid(e.target.value)}>
                    <option value="">— Select Receipt Book —</option>
                    {receiptBooks.map(r => <option key={r.receiptBookGuid} value={r.receiptBookGuid}>{r.bookCode}</option>)}
                  </select>
                </div>

                {showBankFields && (
                  <div className="mb-[14px]">
                    <div className="g2">
                      <div className="fg">
                        <div className="lbl">Bank Name <span className="req">*</span></div>
                        <select className="ctrl" value={procBankGuid} onChange={e => setProcBankGuid(e.target.value)}>
                          <option value="">— Select Bank —</option>
                          {banks.map(b => <option key={b.procBankGuid} value={b.procBankGuid}>{b.bankName}</option>)}
                        </select>
                      </div>
                      <div className="fg">
                        <div className="lbl">Bank Transaction Ref</div>
                        <input className="ctrl" type="text" placeholder="Bank reference number" value={bankRef} onChange={e => setBankRef(e.target.value)} />
                      </div>
                    </div>
                  </div>
                )}

                <div className="fg mb-4">
                  <div className="lbl">Remarks</div>
                  <textarea className="ctrl" rows={2} placeholder="Optional notes or sponsor details..." value={remarks} onChange={e => setRemarks(e.target.value)} />
                </div>

                <div className="flex gap-[10px] justify-between items-center">
                  <button className="btn btn-neu" onClick={handleClear}><i className="lni lni-close"></i> Clear</button>
                  <button className="btn btn-primary btn-lg" disabled={createPayment.isPending} onClick={handleSave}>
                    <i className="lni lni-save"></i> {createPayment.isPending ? 'Saving…' : 'Save Payment & Generate Receipt →'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT column: Allocation Preview + Receipt */}
          <div className="flex flex-col gap-5">
            {selectedApplicationGuid && (
              <div className="card" style={{ background: 'linear-gradient(135deg,var(--b50),var(--white))' }}>
                <div className="card-hdr">
                  <div className="card-title"><span className="ctitle-icon"><i className="lni lni-layers"></i></span> Allocation Preview</div>
                  <span className="badge badge-blue">Auto-updated</span>
                </div>
                {!payableLedgersParams ? (
                  <div className="text-center text-g400" style={{ padding: 32 }}>
                    <div className="mb-2" style={{ fontSize: 32 }}><i className="lni lni-layers"></i></div>
                    <div style={{ fontSize: 13 }}>Enter a payment amount, currency, and date to see how funds will be allocated across outstanding ledgers.</div>
                  </div>
                ) : isPreviewLoading ? (
                  <div className="text-center text-g400" style={{ padding: 32, fontSize: 13 }}>Calculating allocation…</div>
                ) : !payableLedgers || payableLedgers.lines.length === 0 ? (
                  <div className="text-center text-g400" style={{ padding: 32, fontSize: 13 }}>No payable ledger lines for this amount.</div>
                ) : (
                  <div>
                    <ScrollTable>
                      <table>
                        <thead><tr><th>Ledger</th><th>Amount</th><th>Type</th></tr></thead>
                        <tbody>
                          {payableLedgers.lines.map((l, i) => (
                            <tr key={`${l.intLedger}-${i}`}>
                              <td>{l.ledgerName}</td>
                              <td className="text-green font-bold">{l.currencyName} {l.amount.toLocaleString()}</td>
                              <td>
                                {l.isDiscountLine && <span className="badge badge-green">Discount</span>}
                                {l.isRoundingLine && <span className="badge badge-grey">Rounding</span>}
                                {!l.isDiscountLine && !l.isRoundingLine && <span className="badge badge-blue">Ledger</span>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </ScrollTable>
                    <div className="mt-[10px] p-3 rounded-[var(--rsm)] bg-b50 border border-[1.5px] border-b100 flex justify-between items-center">
                      <span className="text-muted" style={{ fontSize: 12 }}>Remaining Balance After Payment</span>
                      <span className="font-bold text-blue">{selectedCurrency?.currencyCode ?? ''} {payableLedgers.balance.toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {receipt && (
              <div className="card">
                <div className="border border-g200 rounded-xl p-5 bg-g50">
                  <div className="text-center mb-4 pb-3 border-b border-g200">
                    <h3 className="font-bold text-g900" style={{ fontSize: 'var(--fs-lg)' }}>ISBAT University</h3>
                    <p className="text-g500" style={{ fontSize: 'var(--fs-xs)' }}>Institute of Skill Development And Training</p>
                    <p className="text-g400" style={{ fontSize: 11 }}><i className="lni lni-map-marker"></i> Kampala, Uganda · erp.isbatuniversity.ac.ug</p>
                    <div className="font-mono font-bold text-blue mt-2" style={{ fontSize: 14 }}>{receipt.ref}</div>
                    <div className="text-g400 uppercase font-bold mt-1" style={{ fontSize: 10, letterSpacing: '.06em' }}>Official Fee Payment Receipt</div>
                  </div>
                  <div className="receipt-row"><span className="text-muted">Student Name</span><span className="font-bold">{receipt.name}</span></div>
                  <div className="receipt-row"><span className="text-muted">App. Ref</span><span className="font-mono text-blue">{receipt.refNo}</span></div>
                  <div className="receipt-row"><span className="text-muted">Programme</span><span>{receipt.prog}</span></div>
                  <div className="receipt-row"><span className="text-muted">Payment Method</span><span>{receipt.method}</span></div>
                  <div className="receipt-row"><span className="text-muted">Date &amp; Time</span><span>{receipt.date}</span></div>
                  <div className="receipt-row"><span className="text-muted">Amount Paid</span><span className="font-bold">{receipt.amount}</span></div>
                  <div className="receipt-row" style={{ background: 'var(--green-bg)', borderRadius: 'var(--rxs)', padding: '6px 2px' }}>
                    <span className="text-muted">Allocated To</span><span className="font-bold text-green">Outstanding ledgers — see allocation above</span>
                  </div>
                  <div className="receipt-total"><span>New Outstanding</span><span>{receipt.balance}</span></div>
                  {receipt.advanceMessage && (
                    <div className="mt-2"><div className="info-box"><i className="lni lni-information"></i> {receipt.advanceMessage}</div></div>
                  )}
                  <div className="text-center text-g400 mt-3 pt-3 border-t border-dashed border-g300" style={{ fontSize: 10 }}>
                    Received by: Finance Office · ISBAT University<br />
                    System-generated receipt. Unique code: <span className="font-mono">{receipt.code}</span>
                  </div>
                </div>
                <div className="flex gap-2 mt-3 flex-wrap">
                  <button className="btn btn-neu flex-1 justify-center" onClick={() => window.print()}><i className="lni lni-printer"></i> Print Receipt</button>
                  <button className="btn btn-primary flex-1 justify-center" onClick={handleClear}>← New Payment</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <Toast toast={toast} />
    </>
  )
}
