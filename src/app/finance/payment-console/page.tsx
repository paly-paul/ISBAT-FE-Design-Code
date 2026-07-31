'use client'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Toast } from '@/components/Toast'
import { ScrollTable } from '@/components/ScrollTable'
import { useBanks } from '@/hooks/finance/useBanks'
import { useReceiptBooks } from '@/hooks/finance/useReceiptBooks'

interface DemoStudent { name: string; prog: string; cat: string; sem: string; initials: string }
interface Ledger { priority: string; type: string; outstanding: number; paid: number; currency: string }

const DEMO_STUDENTS: Record<string, DemoStudent> = {
  'ISB/2026/0021': { name: 'Tumukunde Alice Grace', prog: 'Diploma in Nursing', cat: 'Local', sem: 'Semester 1', initials: 'TA' },
  'ISB/2026/0022': { name: 'Okello James Patrick', prog: 'MBA Business Admin (ODL)', cat: 'Local ODL', sem: 'Semester 1', initials: 'OJ' },
  'ISB/2026/0023': { name: 'Nakato Sarah Bridget', prog: 'BSc. Computer Science', cat: 'Local', sem: 'Semester 1', initials: 'NS' },
  'ISB/2026/0019': { name: 'Nampijja Grace Miriam', prog: 'BCom. Accounting', cat: 'Local', sem: 'Semester 1', initials: 'NG' },
  'ISB/2026/0020': { name: 'Mugisha David Kalisa', prog: 'BSc. Information Technology', cat: 'Local', sem: 'Semester 1', initials: 'MD' },
}

const DEMO_LEDGERS: Record<string, Ledger[]> = {
  'ISB/2026/0021': [
    { priority: 'P1', type: 'Admission Fee', outstanding: 0, paid: 50000, currency: 'UGX' },
    { priority: 'P2', type: 'Registration Fee', outstanding: 0, paid: 937500, currency: 'UGX' },
    { priority: 'P3', type: 'Tuition — S1', outstanding: 2812500, paid: 0, currency: 'UGX' },
    { priority: 'P4', type: 'NCHE Fee', outstanding: 20000, paid: 0, currency: 'UGX' },
    { priority: 'P5', type: 'Guild Fee', outstanding: 10000, paid: 0, currency: 'UGX' },
  ],
  'ISB/2026/0022': [
    { priority: 'P1', type: 'Admission Fee', outstanding: 50000, paid: 0, currency: 'UGX' },
    { priority: 'P2', type: 'Registration Fee', outstanding: 750000, paid: 0, currency: 'UGX' },
    { priority: 'P3', type: 'Tuition — S1', outstanding: 2250000, paid: 0, currency: 'UGX' },
    { priority: 'P4', type: 'NCHE Fee', outstanding: 20000, paid: 0, currency: 'UGX' },
    { priority: 'P5', type: 'Guild Fee', outstanding: 10000, paid: 0, currency: 'UGX' },
  ],
}

// Only two students have a bespoke ledger in this demo dataset — the rest
// fall back to 0021's, same shortcut the reference design used.
function ledgersFor(sno: string): Ledger[] {
  return DEMO_LEDGERS[sno] ?? DEMO_LEDGERS['ISB/2026/0021']
}

const PAYMENT_HISTORY = [
  { date: '09/05/2026', feeType: 'Admission Fee', amount: 'UGX 50,000', method: 'Cash', pill: 'pill-blue', receipt: 'RCP-2026-0051' },
  { date: '10/05/2026', feeType: 'Registration Fee', amount: 'USD 250', method: 'Bank', pill: 'pill-cyan', receipt: 'RCP-2026-0063' },
]

interface AllocRow { priority: string; type: string; outstanding: number; allocated: number; remaining: number; status: 'cleared' | 'partial' | 'pending' }

function fmtUGX(n: number) { return n > 0 ? `UGX ${Math.round(n).toLocaleString()}` : '—' }

function buildAllocation(ledgers: Ledger[], amountUGX: number) {
  let remaining = amountUGX
  let discountMsg = ''
  let roundingMsg = ''
  let statusUpgrade = false
  const rows: AllocRow[] = ledgers.map(l => {
    const allocated = Math.min(remaining, l.outstanding)
    remaining -= allocated
    const after = l.outstanding - allocated

    // Discount: tuition (P3) fully cleared this pass → 5% final-installment discount
    if (l.priority === 'P3' && l.outstanding > 0 && allocated >= l.outstanding) {
      const discAmt = Math.round(l.outstanding * 0.05)
      discountMsg = `Discount of UGX ${discAmt.toLocaleString()} applied to Tuition fee (5% — final installment policy)`
    }
    // Rounding: last ledger (P5), tiny remainder written off
    if (l.priority === 'P5' && after > 0 && after <= 500) {
      roundingMsg = `Rounding off of UGX ${Math.round(after)} applied to clear final semester ledger`
    }
    // Registration (P2) cleared this pass → student status upgrades to Registered
    if (l.priority === 'P2' && l.outstanding > 0 && allocated >= l.outstanding) {
      statusUpgrade = true
    }

    const status: AllocRow['status'] = l.outstanding === 0 || allocated >= l.outstanding
      ? 'cleared'
      : allocated > 0 ? 'partial' : 'pending'

    return { priority: l.priority, type: l.type, outstanding: l.outstanding, allocated, remaining: after, status }
  })
  return { rows, discountMsg, roundingMsg, statusUpgrade }
}

interface ReceiptData {
  ref: string; code: string; name: string; sno: string; prog: string; method: string
  date: string; rateLabel: string; amount: string; ugx: string; balance: string
}

export default function PaymentConsolePage() {
  const router = useRouter()
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)
  function showToast(msg: string, type = '') { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }

  const { data: allBanks = [] } = useBanks()
  const banks = allBanks.filter(b => b.status === 2)
  const { data: allReceiptBooks = [] } = useReceiptBooks()
  const receiptBooks = allReceiptBooks.filter(r => r.status === 1)

  const [usdRate, setUsdRate] = useState('3750')
  const [kesRate, setKesRate] = useState('28.5')

  const [search, setSearch] = useState('')
  const [selectedSno, setSelectedSno] = useState<string | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState('')
  const [method, setMethod] = useState<'cash' | 'bank'>('cash')
  const [receiptBookGuid, setReceiptBookGuid] = useState('')
  const [bankGuid, setBankGuid] = useState('')
  const [bankRef, setBankRef] = useState('')
  const [remarks, setRemarks] = useState('')

  const [receipt, setReceipt] = useState<ReceiptData | null>(null)

  const matches = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return []
    return Object.entries(DEMO_STUDENTS).filter(([sno, s]) =>
      sno.toLowerCase().includes(q) || s.name.toLowerCase().includes(q),
    )
  }, [search])

  const student = selectedSno ? DEMO_STUDENTS[selectedSno] : null
  const ledgers = selectedSno ? ledgersFor(selectedSno) : []
  const totalOutstanding = ledgers.reduce((sum, l) => sum + l.outstanding, 0)

  function selectStudent(sno: string) {
    const s = DEMO_STUDENTS[sno]
    if (!s) return
    setSelectedSno(sno)
    setSearch(s.name)
    setShowDetails(false)
    setShowHistory(false)
    setAmount('')
    setCurrency('')
    setMethod('cash')
    setReceiptBookGuid('')
    setBankGuid('')
    setBankRef('')
    setRemarks('')
    setReceipt(null)
    showToast(`Loaded: ${s.name} · ${sno}`, 'success')
  }

  function handleSearchClick() {
    if (!search.trim()) { showToast('Please enter a student number or name.', 'warn'); return }
    if (matches.length === 0) showToast('No matching student found.', 'warn')
  }

  const ugxR = parseFloat(usdRate) || 3750
  const kesR = parseFloat(kesRate) || 28.5

  const conversion = useMemo(() => {
    const amt = parseFloat(amount) || 0
    if (!amt || !currency) return null
    let amtUGX: number, origLabel: string, rateLabel: string
    if (currency === 'USD') {
      amtUGX = amt * ugxR
      origLabel = `${amt.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD`
      rateLabel = `1 USD = ${ugxR.toLocaleString()} UGX (today's rate)`
    } else if (currency === 'KES') {
      amtUGX = amt * kesR
      origLabel = `${amt.toLocaleString()} KES`
      rateLabel = `1 KES = ${kesR} UGX`
    } else {
      amtUGX = amt
      origLabel = `UGX ${amt.toLocaleString()}`
      rateLabel = 'No conversion (UGX base)'
    }
    return { amtUGX, origLabel, rateLabel }
  }, [amount, currency, ugxR, kesR])

  const allocation = useMemo(() => {
    if (!conversion || !selectedSno) return null
    return buildAllocation(ledgers, conversion.amtUGX)
  }, [conversion, selectedSno, ledgers])

  const showBankFields = method === 'bank'

  function handleSave() {
    if (!student || !selectedSno) { showToast('Please select a student first.', 'warn'); return }
    const amt = parseFloat(amount) || 0
    if (amt <= 0) { showToast('Amount must be greater than 0.', 'warn'); return }
    if (!currency) { showToast('Please select a payment currency.', 'warn'); return }

    const amtUGX = currency === 'USD' ? amt * ugxR : currency === 'KES' ? amt * kesR : amt
    const now = new Date()
    const ref = `RCP-2026-0${90 + Math.floor(Math.random() * 9)}`
    const code = `PAY-${Math.random().toString(36).slice(2, 10).toUpperCase()}`

    setReceipt({
      ref, code,
      name: student.name,
      sno: selectedSno,
      prog: student.prog,
      method: method.charAt(0).toUpperCase() + method.slice(1),
      date: now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' + now.toLocaleTimeString(),
      rateLabel: currency === 'USD' ? `1 USD = ${ugxR.toLocaleString()} UGX` : currency === 'KES' ? `1 KES = ${kesR} UGX` : 'UGX (no conversion)',
      amount: `${amt.toLocaleString()} ${currency}`,
      ugx: `UGX ${Math.round(amtUGX).toLocaleString()}`,
      balance: `UGX ${Math.max(0, totalOutstanding - Math.round(amtUGX)).toLocaleString()}`,
    })
    showToast(`Payment saved! Receipt ${ref} generated.`, 'success')
  }

  function handleClear() {
    setSelectedSno(null)
    setSearch('')
    setAmount('')
    setCurrency('')
    setMethod('cash')
    setReceiptBookGuid('')
    setBankGuid('')
    setBankRef('')
    setRemarks('')
    setShowDetails(false)
    setShowHistory(false)
    setReceipt(null)
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
            <div className="pg-sub">Search student → view outstanding balance → record multi-currency payment → auto-allocation by priority</div>
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
                <div className="lbl">Search by Student Number, Name, or Application Ref <span className="req">*</span></div>
                <div className="flex gap-2 flex-wrap">
                  <div className="inp-wrap" style={{ flex: 1, minWidth: 180 }}>
                    <span className="inp-icon"><i className="lni lni-search-alt"></i></span>
                    <input
                      className="ctrl"
                      type="text"
                      placeholder="e.g. ISB/2026/0021 or Tumukunde Alice"
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleSearchClick() }}
                    />
                  </div>
                  <button className="btn btn-primary" onClick={handleSearchClick}><i className="lni lni-search-alt"></i> Search</button>
                </div>
              </div>

              {matches.length > 0 && (
                <div className="mt-2" style={{ border: '1.5px solid var(--b200)', borderRadius: 'var(--rsm)', overflow: 'hidden' }}>
                  {matches.map(([sno, s]) => (
                    <div
                      key={sno}
                      className="cursor-pointer px-3 py-2 hover:bg-b50 border-b border-g100 last:border-b-0"
                      onClick={() => selectStudent(sno)}
                    >
                      <div className="font-bold">{s.name}</div>
                      <div className="text-g500" style={{ fontSize: 11 }}>{sno} · {s.prog} · {s.sem} · {s.cat}</div>
                    </div>
                  ))}
                </div>
              )}

              {student && selectedSno && (
                <div className="mt-4 p-4 rounded-[var(--rsm)] bg-b50 border border-[1.5px] border-b100">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-11 h-11 rounded-full flex-shrink-0 grid place-items-center text-white font-extrabold" style={{ background: 'linear-gradient(135deg,var(--b700),var(--b500))', fontSize: 15 }}>
                      {student.initials}
                    </div>
                    <div className="flex-1">
                      <div className="font-extrabold text-g900" style={{ fontSize: 15 }}>{student.name}</div>
                      <div className="text-g500 text-xs">{student.prog}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-g400" style={{ fontSize: 10.5 }}>Student No.</div>
                      <div className="font-mono font-bold text-blue" style={{ fontSize: 13 }}>{selectedSno}</div>
                    </div>
                  </div>
                  <div className="g3 text-xs">
                    <div><span className="text-muted">Category: </span><span className="font-bold">{student.cat}</span></div>
                    <div><span className="text-muted">Semester: </span><span className="font-bold">{student.sem}</span></div>
                    <div><span className="text-muted">Status: </span><span className="badge badge-green">Active</span></div>
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
                        <div><span className="text-muted">Email: </span><span className="font-bold">{student.name.split(' ')[0].toLowerCase()}.t@students.isbat.ac.ug</span></div>
                        <div><span className="text-muted">Phone: </span><span className="font-bold">+256 700 123 456</span></div>
                        <div><span className="text-muted">Batch: </span><span className="font-bold">DIPN-S26-DA</span></div>
                        <div><span className="text-muted">Intake: </span><span className="font-bold">Spring 2026 (20261)</span></div>
                        <div><span className="text-muted">Admission Type: </span><span className="font-bold">Regular</span></div>
                        <div><span className="text-muted">Campus: </span><span className="font-bold">Kampala Main</span></div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Step 2: Outstanding Balance */}
            {selectedSno && (
              <div className="card">
                <div className="card-hdr">
                  <div className="card-title"><span className="ctitle-icon"><i className="lni lni-dollar"></i></span> Step 2 · Outstanding Balance</div>
                  <span className="badge badge-amber">{fmtUGX(totalOutstanding)} outstanding</span>
                </div>
                <ScrollTable>
                  <table>
                    <thead><tr><th>Priority</th><th>Fee Type</th><th>Paid</th><th>Outstanding</th><th>Cur.</th></tr></thead>
                    <tbody>
                      {ledgers.map(l => (
                        <tr key={l.priority}>
                          <td><span className="badge badge-grey font-mono">{l.priority}</span></td>
                          <td>{l.type}</td>
                          <td className={l.paid > 0 ? 'text-green font-bold' : 'text-muted'}>{l.paid > 0 ? `UGX ${l.paid.toLocaleString()} ✓` : '—'}</td>
                          <td className={l.outstanding === 0 ? 'text-green font-bold' : 'text-amber'}>{l.outstanding > 0 ? `UGX ${l.outstanding.toLocaleString()}` : '0 ✓'}</td>
                          <td><span className="badge badge-gold">{l.currency}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </ScrollTable>
                <div className="mt-[10px]">
                  <button className="btn btn-neu btn-sm justify-between w-full" onClick={() => setShowHistory(v => !v)}>
                    <span><i className="lni lni-folder"></i> Payment History</span>
                    <span>{showHistory ? '▴' : '▾'}</span>
                  </button>
                  {showHistory && (
                    <div className="mt-2">
                      <ScrollTable>
                        <table>
                          <thead><tr><th>Date</th><th>Fee Type</th><th>Amount Paid</th><th>Method</th><th>Receipt #</th></tr></thead>
                          <tbody>
                            {PAYMENT_HISTORY.map(h => (
                              <tr key={h.receipt}>
                                <td>{h.date}</td><td>{h.feeType}</td>
                                <td className="text-green font-bold">{h.amount}</td>
                                <td><span className={`pill ${h.pill}`}>{h.method}</span></td>
                                <td className="font-mono text-blue">{h.receipt}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </ScrollTable>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Record Payment */}
            {selectedSno && !receipt && (
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
                    <select className="ctrl" value={currency} onChange={e => setCurrency(e.target.value)}>
                      <option value="">— Select Currency —</option>
                      <option value="USD">USD (US Dollar)</option>
                      <option value="UGX">UGX (Uganda Shilling)</option>
                      <option value="KES">KES (Kenya Shilling)</option>
                    </select>
                  </div>
                </div>

                {conversion && (
                  <div className="mb-[14px] p-4 rounded-[var(--rsm)] bg-b50 border border-[1.5px] border-b100">
                    <div className="flex items-center gap-4 flex-wrap justify-center">
                      <div className="text-center">
                        <div className="font-bold text-g400 uppercase mb-1" style={{ fontSize: 10.5, letterSpacing: '.06em' }}>Amount Received</div>
                        <div className="font-extrabold text-g900" style={{ fontSize: 18 }}>{conversion.origLabel}</div>
                      </div>
                      <div className="text-b300" style={{ fontSize: 22 }}>→</div>
                      <div className="text-center">
                        <div className="font-bold text-g400 uppercase mb-1" style={{ fontSize: 10.5, letterSpacing: '.06em' }}>Converted to UGX</div>
                        <div className="font-extrabold text-blue" style={{ fontSize: 18 }}>UGX {Math.round(conversion.amtUGX).toLocaleString()}</div>
                      </div>
                    </div>
                    <div className="text-center text-g400 mt-2" style={{ fontSize: 11 }}>{conversion.rateLabel}</div>
                  </div>
                )}

                <div className="g2 mb-[14px]">
                  <div className="fg">
                    <div className="lbl">Payment Method <span className="req">*</span></div>
                    <select className="ctrl" value={method} onChange={e => setMethod(e.target.value as 'cash' | 'bank')}>
                      <option value="cash">Cash</option>
                      <option value="bank">Bank Transfer</option>
                    </select>
                  </div>
                  <div className="fg">
                    <div className="lbl">Receipt Book <span className="req">*</span></div>
                    <select className="ctrl" value={receiptBookGuid} onChange={e => setReceiptBookGuid(e.target.value)}>
                      <option value="">— Select Receipt Book —</option>
                      {receiptBooks.map(r => <option key={r.receiptBookGuid} value={r.receiptBookGuid}>{r.bookCode}</option>)}
                    </select>
                  </div>
                </div>

                {showBankFields && (
                  <div className="mb-[14px]">
                    <div className="info-box mb-[10px]"><i className="lni lni-apartment"></i> Bank Transfer accepted. Cheques and DDs are <strong>not</strong> accepted.</div>
                    <div className="g2">
                      <div className="fg">
                        <div className="lbl">Bank Name</div>
                        <select className="ctrl" value={bankGuid} onChange={e => setBankGuid(e.target.value)}>
                          <option value="">— Select Bank —</option>
                          {banks.map(b => <option key={b.bankGuid} value={b.bankGuid}>{b.bankName}</option>)}
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
                  <button className="btn btn-primary btn-lg" onClick={handleSave}>
                    <i className="lni lni-save"></i> Save Payment &amp; Generate Receipt →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT column: Allocation Preview + Receipt */}
          <div className="flex flex-col gap-5">
            {selectedSno && (
              <div className="card" style={{ background: 'linear-gradient(135deg,var(--b50),var(--white))' }}>
                <div className="card-hdr">
                  <div className="card-title"><span className="ctitle-icon"><i className="lni lni-layers"></i></span> Allocation Preview</div>
                  <span className="badge badge-blue">Auto-updated</span>
                </div>
                {!allocation ? (
                  <div className="text-center text-g400" style={{ padding: 32 }}>
                    <div className="mb-2" style={{ fontSize: 32 }}><i className="lni lni-layers"></i></div>
                    <div style={{ fontSize: 13 }}>Enter a payment amount to see how funds will be allocated across priority ledgers.</div>
                  </div>
                ) : (
                  <div>
                    <ScrollTable>
                      <table>
                        <thead><tr><th>Priority</th><th>Fee Type</th><th>Outstanding</th><th>Allocated</th><th>Remaining</th><th>Status</th></tr></thead>
                        <tbody>
                          {allocation.rows.map(r => (
                            <tr key={r.priority}>
                              <td><span className="badge badge-grey font-mono">{r.priority}</span></td>
                              <td>{r.type}</td>
                              <td>{r.outstanding === 0 ? <span className="text-green">0 ✓</span> : `UGX ${r.outstanding.toLocaleString()}`}</td>
                              <td className="text-green font-bold">{r.allocated > 0 ? fmtUGX(r.allocated) : '—'}</td>
                              <td className={r.remaining > 0 ? 'text-amber' : 'text-green'}>{r.remaining > 0 ? `UGX ${Math.round(r.remaining).toLocaleString()}` : '0'}</td>
                              <td>
                                {r.status === 'cleared' && <span className="badge badge-green">✓ Cleared</span>}
                                {r.status === 'partial' && <span className="badge badge-amber">⬤ Partial</span>}
                                {r.status === 'pending' && <span className="badge badge-grey">Pending</span>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </ScrollTable>
                    {allocation.discountMsg && (
                      <div className="mt-[10px]"><div className="success-box"><i className="lni lni-dollar"></i> {allocation.discountMsg}</div></div>
                    )}
                    {allocation.roundingMsg && (
                      <div className="mt-2"><div className="info-box"><i className="lni lni-information"></i> {allocation.roundingMsg}</div></div>
                    )}
                    {allocation.statusUpgrade && (
                      <div className="mt-2">
                        <div className="warn-box" style={{ background: 'var(--cyan-bg)', borderColor: 'var(--cyan)' }}>
                          <i className="lni lni-rocket"></i> Student status will update to <strong>Registered</strong> upon clearing Registration Fee.
                        </div>
                      </div>
                    )}
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
                  <div className="receipt-row"><span className="text-muted">Student Number</span><span className="font-mono text-blue">{receipt.sno}</span></div>
                  <div className="receipt-row"><span className="text-muted">Programme</span><span>{receipt.prog}</span></div>
                  <div className="receipt-row"><span className="text-muted">Payment Method</span><span>{receipt.method}</span></div>
                  <div className="receipt-row"><span className="text-muted">Date &amp; Time</span><span>{receipt.date}</span></div>
                  <div className="receipt-row"><span className="text-muted">Exchange Rate</span><span>{receipt.rateLabel}</span></div>
                  <div className="receipt-row"><span className="text-muted">Amount Paid</span><span className="font-bold">{receipt.amount}</span></div>
                  <div className="receipt-row"><span className="text-muted">Converted (UGX)</span><span className="font-bold">{receipt.ugx}</span></div>
                  <div className="receipt-row" style={{ background: 'var(--green-bg)', borderRadius: 'var(--rxs)', padding: '6px 2px' }}>
                    <span className="text-muted">Allocated To</span><span className="font-bold text-green">Tuition S1 &amp; outstanding ledgers — see allocation above</span>
                  </div>
                  <div className="receipt-total"><span>New Outstanding</span><span>{receipt.balance}</span></div>
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
