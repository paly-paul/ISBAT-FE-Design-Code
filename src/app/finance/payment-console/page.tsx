'use client'
import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Toast } from '@/components/Toast'
import { ScrollTable } from '@/components/ScrollTable'
import { PaymentHistoryModal } from '@/components/modals/finance/PaymentHistoryModal'
import DatePicker from '@/components/DatePicker'
import { SearchSelect } from '@/components/SearchSelect'
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
  useAllOutstandingLedgers,
  usePaymentHistory,
  usePayableLedgers,
  useCreatePayment,
  useCreatePaymentNche,
  useCreatePaymentGuild,
  PAY_TYPE_LABELS,
  PAY_TYPE_TO_RECEIPT_CATEGORY,
  AllOutstandingItem,
} from '@/hooks/finance/usePaymentConsole'
import { formatDateTime } from '@/lib/date'
import { AuthError } from '@/lib/api/client'

function fmtUGX(n: number) { return n > 0 ? `UGX ${Math.round(n).toLocaleString()}` : '—' }

// Real "what's owed" table for the Other/NCHE/Guild tabs, sourced from
// GET .../outstanding-all (get-all-outstanding-ledgers.md) filtered by
// category client-side. ledgerGuid/semesterName/currency are null for
// NCHE/Guild rows per that doc (not ledger-based); rendered defensively
// with '—' fallbacks since the doc doesn't confirm the same for Other.
function OutstandingCategoryTable({ items, isLoading, isError }: { items: AllOutstandingItem[]; isLoading: boolean; isError: boolean }) {
  if (isLoading) return <div className="text-g400 text-center" style={{ padding: 16, fontSize: 12.5 }}>Loading outstanding balance…</div>
  if (isError) return <div className="text-clr-red text-center" style={{ padding: 16, fontSize: 12.5 }}><i className="lni lni-warning"></i> Couldn&apos;t load the outstanding balance.</div>
  if (items.length === 0) return <div className="text-g400 text-center" style={{ padding: 16, fontSize: 12.5 }}>Fully settled — nothing outstanding in this category.</div>
  const total = items.reduce((sum, it) => sum + it.outstanding, 0)
  return (
    <>
      <ScrollTable className="no-sticky-col">
        <table>
          <thead><tr><th>Description</th><th>Semester</th><th>Outstanding</th></tr></thead>
          <tbody>
            {items.map((it, i) => (
              <tr key={`${it.ledgerGuid ?? it.description}-${i}`}>
                <td>{it.description}</td>
                <td>{it.semesterName ?? '—'}</td>
                <td className="text-amber font-bold">{it.currencyCode ? `${it.currencyCode} ` : ''}{it.outstanding.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </ScrollTable>
      <div className="mt-[10px] p-3 rounded-[var(--rsm)] bg-b50 border border-[1.5px] border-b100 flex justify-between items-center">
        <span className="text-muted" style={{ fontSize: 12 }}>Total Outstanding</span>
        <span className="font-bold text-blue">{total.toLocaleString()}</span>
      </div>
    </>
  )
}

function applicantName(a: { firstName: string | null; lastName: string | null }) {
  return `${a.firstName ?? ''}${a.lastName ? ` ${a.lastName}` : ''}`.trim() || '—'
}

// Search results come from FinanceStudentSearchDto (PaymentConsoleStudentSearch.bru)
// now, which has no lastName — it carries a pre-combined studentName instead,
// falling back to firstName alone for an application that isn't a student yet.
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

interface ReceiptData {
  ref: string; code: string; name: string; refNo: string; prog: string; method: string
  date: string; amount: string; balance: string; advanceMessage: string | null; reRegistrationWarning: string | null
}

// Fee-category tabs (flow doc: "This page covers the tuition tab only.
// Other fee categories (other/NCHE/guild)... live on their own tabs/pages
// and are not documented here.") — only 'tuition' is wired up to real
// endpoints so far; the rest render a placeholder until their own flows
// land.
type PayCategory = 'tuition' | 'other' | 'nche' | 'guild'
const PAY_CATEGORY_TABS: { id: PayCategory; label: string; icon: string }[] = [
  { id: 'tuition', label: 'Tuition Fee',   icon: 'lni-graduation' },
  { id: 'other',   label: 'Other Payment', icon: 'lni-wallet' },
  { id: 'nche',    label: 'NCHE',          icon: 'lni-certificate' },
  { id: 'guild',   label: 'Guild',         icon: 'lni-users' },
]

// Gate for the Allocation Preview card — commented out (not removed) per
// request. Typed `: boolean` rather than left as the bare literal `false`:
// `{false && (...)}` makes TypeScript's control-flow analysis treat that
// whole branch as statically unreachable, which disables narrowing inside
// it (payableLedgers/previewError go back to their raw nullable types even
// after the isPreviewError/!payableLedgers checks that would normally
// narrow them) — surfacing spurious "possibly undefined/null" errors on
// code that's otherwise unchanged. Widening the type to `boolean` keeps
// the branch reachable as far as the checker is concerned, so normal
// narrowing applies, while still always evaluating to false at runtime.
const SHOW_ALLOCATION_PREVIEW: boolean = false

// Other Payment tab — mock ledger picker (legacy ISMS frmTrnPaymentOther.aspx
// "Ledger" dropdown), same UI-first mock treatment as NCHE/Guild. No real
// "other fee ledgers" master is wired up here, so this is a representative
// static list, not a fetched one.
const OTHER_LEDGER_OPTIONS = ['Library Fine', 'ID Card Fee', 'Transcript Fee', 'Caution Money', 'Uniform Fee', 'Other Fee']

export default function PaymentConsolePage() {
  const router = useRouter()
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)
  function showToast(msg: string, type = '') { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }

  const { data: allProcBanks = [] } = useProcBanks()
  const banks = allProcBanks.filter(b => b.status === 2)
  const { data: allReceiptBooks = [] } = useReceiptBooks()
  const activeReceiptBooks = allReceiptBooks.filter(r => r.status === 1)
  const { data: currencies = [] } = useFinanceCurrencies()

  // Purely informational reference rates — no longer feeds any computation
  // (GetPayableLedgers/CreatePayment both operate in the payment's own real
  // currency via currencyGuid/intCurrency, no client-side UGX conversion
  // happens anywhere in the real flow).
  const [usdRate, setUsdRate] = useState('3750')
  const [kesRate, setKesRate] = useState('28.5')

  const [search, setSearch] = useState('')
  const [committedSearch, setCommittedSearch] = useState('')
  // Drives the results dropdown's visibility, separately from whether it
  // has matches — clicking into the box shows it (listing everything if
  // the box is still empty; PaymentConsoleStudentSearch.bru: searchTerm is
  // optional, omit to browse all), clicking away or picking a result
  // hides it again. searchBoxRef scopes the click-outside check to the
  // search field + dropdown, same pattern as ActionMenu.tsx's trigger/
  // dropdown refs.
  const [searchFocused, setSearchFocused] = useState(false)
  const searchBoxRef = useRef<HTMLDivElement>(null)
  const [selectedApplicationGuid, setSelectedApplicationGuid] = useState<string | null>(null)
  // studentGuid straight off the search hit (PaymentConsoleStudentSearch.bru
  // returns it directly) — passed into useStudentProfile below so the first
  // profile fetch already resolves full student fields instead of falling
  // back to application-only ones. Distinct from the `studentGuid` derived
  // from the loaded profile further down, which stays the source of truth
  // for every query after the profile has actually loaded.
  const [selectedStudentGuidHint, setSelectedStudentGuidHint] = useState<string | null>(null)
  // Also doubles as PaymentHistoryModal's open flag — its own button lives
  // in the Student Profile Details card-hdr, not here; usePaymentHistory
  // below stays enabled-on-demand the same way the old inline accordion
  // had it (only fetches once the cashier actually wants to see it).
  const [showHistory, setShowHistory] = useState(false)
  // Outstanding ledger table (Step 2) — its own collapsible accordion,
  // unrelated to showHistory above. Defaults open since it's the primary
  // "what's owed" view a cashier lands on, unlike history which is a
  // secondary lookup.
  const [showOutstanding, setShowOutstanding] = useState(true)

  // Fee-category menu, Column 1 (sketch: a stacked list, not a tab bar).
  // Resets to 'tuition' on every new student pick, same as the rest of the
  // payment form (selectStudent's resetPaymentForm call).
  const [activePayTab, setActivePayTab] = useState<PayCategory>('tuition')

  // NCHE tab — wired to the real POST .../payment-nche (payment/post-
  // payment-nche.md). No currency/receipt-book/bank/semester in that
  // payload — the amount is validated server-side against a fixed
  // per-semester rate this client has no way to know ahead of time, so
  // it's left for the 400 to report. nchePayments is a local session log
  // of what was actually submitted this visit (append-only — a real,
  // committed payment can't be edited or deleted from here), not mock
  // data; ncheEditingId from an earlier draft of this tab is gone along
  // with edit/delete, for the same reason.
  const [nchePayments, setNchePayments] = useState<{ id: string; payDate: string; pnrNumber: string; amount: number; remarks: string | null; remainingBalance: number }[]>([])
  const [nchePayDate, setNchePayDate] = useState(todayYmd)
  const [nchePrn, setNchePrn] = useState('')
  const [ncheAmount, setNcheAmount] = useState('')
  const [ncheRemarks, setNcheRemarks] = useState('')

  // Guild tab — wired to the real POST .../payment-guild (payment/post-
  // payment-guild.md), structurally identical to NCHE above: no currency/
  // receipt-book/bank/semester/remarks in that payload, amount validated
  // server-side as a whole multiple of a per-semester rate. The only
  // payload difference from NCHE is the free-text reference field —
  // bankDeposit here where NCHE has pnrNumber. guildPayments is a local
  // session log of what was actually submitted, same reasoning as
  // nchePayments above (no edit/delete on a real, committed payment).
  const [guildPayments, setGuildPayments] = useState<{ id: string; payDate: string; bankDeposit: string; amount: number; remainingBalance: number }[]>([])
  const [guildPayDate, setGuildPayDate] = useState(todayYmd)
  const [guildSlipNo, setGuildSlipNo] = useState('')
  const [guildAmount, setGuildAmount] = useState('')

  // Other Payment tab — same UI-first mock treatment as NCHE/Guild above,
  // laid out after the matching legacy reference screen
  // (frmTrnPaymentOther.aspx). No per-semester Paid/Due grid here (that
  // screen's own header fields — Student/Programme/Semester — are already
  // covered by the Student Profile Details bar above the 3-column body, so
  // they aren't repeated); this tab is closer to a flat payment log keyed
  // by a ledger picker rather than a semester. isAdvance mirrors the
  // legacy form's "Advance Payment" checkbox + date; bank account is
  // gated the same way Step 3's own bank fields are (only when the
  // payment method isn't cash).
  const [otherPayments, setOtherPayments] = useState<{ id: string; code: string; receiptNo: string; payDate: string; ledgerName: string; amount: string; currencyCode: string }[]>([])
  const [otherLedger, setOtherLedger] = useState('')
  const [otherPayDate, setOtherPayDate] = useState(todayYmd)
  const [otherIsAdvance, setOtherIsAdvance] = useState(false)
  const [otherAdvanceDate, setOtherAdvanceDate] = useState(todayYmd)
  const [otherPayType, setOtherPayType] = useState('1')
  const [otherAmount, setOtherAmount] = useState('')
  const [otherCurrencyGuid, setOtherCurrencyGuid] = useState('')
  const [otherBankAccount, setOtherBankAccount] = useState('')
  const [otherRemarks, setOtherRemarks] = useState('')
  const [otherSeq, setOtherSeq] = useState(1)

  const [amount, setAmount] = useState('')
  const [currencyGuid, setCurrencyGuid] = useState('')
  const [payDate, setPayDate] = useState(todayYmd)
  const [payType, setPayType] = useState('1')
  // Narrowed to only the category CreatePayment will accept for the
  // currently-selected Payment Method — see PAY_TYPE_TO_RECEIPT_CATEGORY above.
  const receiptBooks = activeReceiptBooks.filter(r => r.category === PAY_TYPE_TO_RECEIPT_CATEGORY[Number(payType)])
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

  // Debounced so the dropdown updates live as the user types (like every
  // other search box in the app), without hitting GetStudentSearch on every
  // keystroke. Search click / Enter still commit immediately for anyone who
  // types fast and hits Enter before the debounce would've fired.
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

  // isError kept separate from the [] fallback on purpose — same reasoning
  // as usePaymentHistory below: a failed search (a 401, or any other
  // downstream failure) must not render as the same "No matching
  // applications found" a genuinely empty result gets, or a real error goes
  // unnoticed as "this student doesn't exist". The 2-char floor below is
  // this page's own client-side guard, not a backend rule any more —
  // PaymentConsoleStudentSearch.bru documents no validator on this endpoint
  // (a single-char term is accepted), unlike the older Finance-proxy route
  // this used to call. Kept anyway so a request isn't fired on every
  // keystroke while the user is still mid-word. An
  // empty committedSearch is allowed too, but only once the box has focus
  // (searchFocused) — that's the "list everything" case for clicking into
  // an empty box, not something to fetch on mount before the user has
  // interacted with the field at all.
  const searchTermLen = committedSearch.trim().length
  const { data: searchResults, isFetching: isSearching, isError: isSearchError, error: searchError } = useSearchStudents(
    committedSearch, 1, 20,
    searchFocused && (searchTermLen === 0 || searchTermLen >= 2),
  )
  const matches = searchResults?.items ?? []

  // isError surfaced explicitly — without it, a profile fetch failure (e.g.
  // a real "Application not found." 404 for a guid the search endpoint just
  // returned, confirmed live) silently renders nothing once isLoading flips
  // false, leaving the whole "select a student" action look like it did
  // nothing rather than showing why.
  const { data: profile, isLoading: isProfileLoading, isError: isProfileError, error: profileError } = useStudentProfile(selectedApplicationGuid, !!selectedApplicationGuid, selectedStudentGuidHint)
  // profile.studentGuid — confirmed via a real live student-profile
  // response, not documented in the spec's own sample — is the studentGuid
  // outstanding-ledgers/payable-ledgers/createPayment all optionally
  // accept (see the .md docs' notes on it narrowing the billed semester
  // range). Falls back to selectedStudentGuidHint (straight off the search
  // hit) while the profile is still loading — the flow doc says to "always
  // pass studentGuid when known", and the hint is already known before the
  // profile fetch resolves, not just after. Once profile loads, its own
  // studentGuid takes over as the source of truth (it can also newly appear
  // there even when the search hit had none, so it isn't just a one-time
  // override).
  const studentGuid = profile?.studentGuid ?? selectedStudentGuidHint ?? null
  const { data: ledgers = [], isLoading: isLedgersLoading } = useOutstandingLedgers(selectedApplicationGuid, !!selectedApplicationGuid, studentGuid)
  // All four categories in one call (get-all-outstanding-ledgers.md) — used
  // to show a real outstanding figure on the Other/NCHE/Guild tabs, whose
  // own payment-entry forms stay mock (no documented single-category
  // submit endpoint for them). isError surfaced explicitly, same reasoning
  // as the other queries on this page.
  const { data: allOutstanding = [], isLoading: isAllOutstandingLoading, isError: isAllOutstandingError } = useAllOutstandingLedgers(selectedApplicationGuid, !!selectedApplicationGuid)
  const otherOutstanding = allOutstanding.filter(i => i.category === 2)
  const ncheOutstanding = allOutstanding.filter(i => i.category === 3)
  const guildOutstanding = allOutstanding.filter(i => i.category === 4)
  // isError kept separate from the [] fallback on purpose — a failed fetch
  // (confirmed live: this endpoint can 500 with server_error for some
  // applications) must not render the same "No payment history" message as
  // a genuinely empty result, since that would misreport a backend failure
  // as "this student has no payment history."
  const { data: paymentHistory = [], isLoading: isHistoryLoading, isError: isHistoryError } = usePaymentHistory(selectedApplicationGuid, !!selectedApplicationGuid && showHistory)

  // Client-side name resolution for the profile's guid FKs — same fallback
  // pattern used throughout the app (faculty.ts's deanName, enquiry-list's
  // resolveProgramName), but only as a fallback now: a real live
  // student-profile response confirms the server pre-resolves these names
  // itself (programName, levelName, batchCode, semesterName, feeCode) —
  // prefer those and only fall back to the client-side lookup when the
  // server sends null, which it does for some of these on some
  // applications (programName/batchCode/semesterName were null on an
  // otherwise fully-resolved sample).
  const { data: campuses = [] } = useCampuses()
  const { data: programs = [] } = useProgramMasters()
  const { data: allBatchesData } = useBatches(1, 1000)
  const batches = allBatchesData?.items ?? []
  const { data: semesters = [] } = useSemestersForProgram(profile?.programGuid ?? '', !!profile?.programGuid)

  // campusName has no server-resolved counterpart on the DTO — always
  // client-resolved.
  const campusName = campuses.find(c => c.campusGuid === profile?.campusGuid)?.campusName
  const programName = profile?.programName ?? programs.find(p => p.programGuid === profile?.programGuid)?.programName
  const batchCode = profile?.batchCode ?? batches.find(b => b.batchGuid === profile?.batchGuid)?.batchCode
  const semName = profile?.semesterName ?? semesters.find(s => s.semesterGuid === profile?.semesterGuid)?.semName

  const totalOutstanding = ledgers.reduce((sum, l) => sum + l.outstanding, 0)
  // Groups preserve first-seen order (the API already returns rows semester
  // by semester) rather than sorting — Map insertion order does that for
  // free. Falls back to a single '—' bucket if semesterName ever comes back
  // null so grouping degrades to "one group" instead of silently dropping
  // rows.
  const ledgerGroups = useMemo(() => {
    const groups = new Map<string, typeof ledgers>()
    for (const l of ledgers) {
      const key = l.semesterName ?? '—'
      const bucket = groups.get(key)
      if (bucket) bucket.push(l); else groups.set(key, [l])
    }
    return Array.from(groups.entries())
  }, [ledgers])
  const selectedCurrency = currencies.find(c => c.currencyGuid === currencyGuid)

  const payableLedgersParams = useMemo(() => {
    const amt = parseFloat(debouncedAmount) || 0
    if (!selectedApplicationGuid || !selectedCurrency || amt <= 0 || !payDate) return null
    return { applicationGuid: selectedApplicationGuid, studentGuid, amount: amt, currencyGuid: selectedCurrency.currencyGuid, payDate }
  }, [selectedApplicationGuid, studentGuid, selectedCurrency, debouncedAmount, payDate])

  // isError surfaced explicitly — same reasoning as isSearchError/
  // isProfileError above. A real failure here (confirmed live: "Today's
  // exchange rate has not been entered for the payment date... Please add
  // it before proceeding." when the currency has no rate on file for
  // payDate) must not render as the same "No payable ledger lines for this
  // amount" a genuinely empty allocation gets, or the cashier has no idea
  // why the preview is blank.
  const { data: payableLedgers, isFetching: isPreviewLoading, isError: isPreviewError, error: previewError } = usePayableLedgers(payableLedgersParams, !!payableLedgersParams)

  const createPayment = useCreatePayment()
  const createPaymentNche = useCreatePaymentNche()
  const createPaymentGuild = useCreatePaymentGuild()

  function handleSearchClick() {
    const term = search.trim()
    if (!term) { showToast('Please enter a student number or name.', 'warn'); return }
    if (term.length < 2) { showToast('Search term must be at least 2 characters.', 'warn'); return }
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

  function resetNcheForm() {
    setNchePayDate(todayYmd())
    setNchePrn('')
    setNcheAmount('')
    setNcheRemarks('')
  }

  function ncheSubmit() {
    if (!selectedApplicationGuid) { showToast('Please select a student first.', 'warn'); return }
    const amt = parseFloat(ncheAmount)
    if (!ncheAmount.trim() || isNaN(amt) || amt <= 0) { showToast('Amount must be greater than 0.', 'warn'); return }
    if (!nchePayDate) { showToast('Please select a date.', 'warn'); return }

    createPaymentNche.mutate(
      { applicationGuid: selectedApplicationGuid, studentGuid, amount: amt, payDate: nchePayDate, pnrNumber: nchePrn.trim() || null, remarks: ncheRemarks.trim() || null },
      {
        onSuccess: result => {
          setNchePayments(prev => [...prev, {
            id: result.paymentNcheGuid, payDate: nchePayDate, pnrNumber: nchePrn.trim(),
            amount: result.amount, remarks: ncheRemarks.trim() || null, remainingBalance: result.remainingBalance,
          }])
          showToast(`NCHE payment recorded. Remaining balance: ${result.remainingBalance.toLocaleString()}.`, 'success')
          resetNcheForm()
        },
        onError: (error: Error) => showToast(error.message || 'Failed to record NCHE payment. Please try again.', 'error'),
      },
    )
  }

  function resetGuildForm() {
    setGuildPayDate(todayYmd())
    setGuildSlipNo('')
    setGuildAmount('')
  }

  function guildSubmit() {
    if (!selectedApplicationGuid) { showToast('Please select a student first.', 'warn'); return }
    const amt = parseFloat(guildAmount)
    if (!guildAmount.trim() || isNaN(amt) || amt <= 0) { showToast('Amount must be greater than 0.', 'warn'); return }
    if (!guildPayDate) { showToast('Please select a date.', 'warn'); return }

    createPaymentGuild.mutate(
      { applicationGuid: selectedApplicationGuid, studentGuid, amount: amt, payDate: guildPayDate, bankDeposit: guildSlipNo.trim() || null },
      {
        onSuccess: result => {
          setGuildPayments(prev => [...prev, {
            id: result.paymentGuildGuid, payDate: guildPayDate, bankDeposit: guildSlipNo.trim(),
            amount: result.amount, remainingBalance: result.remainingBalance,
          }])
          showToast(`Guild payment recorded. Remaining balance: ${result.remainingBalance.toLocaleString()}.`, 'success')
          resetGuildForm()
        },
        onError: (error: Error) => showToast(error.message || 'Failed to record Guild payment. Please try again.', 'error'),
      },
    )
  }

  function resetOtherForm() {
    setOtherLedger('')
    setOtherPayDate(todayYmd())
    setOtherIsAdvance(false)
    setOtherAdvanceDate(todayYmd())
    setOtherPayType('1')
    setOtherAmount('')
    setOtherCurrencyGuid('')
    setOtherBankAccount('')
    setOtherRemarks('')
  }

  // Mock-only add — no edit/delete here, unlike NCHE/Guild: the legacy
  // Other Payment reference screen's own "Paid Fee Details" table has no
  // edit/delete affordance, so this stays a flat append-only log to match.
  function otherSaveEntry() {
    if (!otherLedger) { showToast('Please select a ledger.', 'warn'); return }
    const amt = parseFloat(otherAmount)
    if (!otherAmount.trim() || isNaN(amt) || amt <= 0) { showToast('Amount must be greater than 0.', 'warn'); return }
    if (!otherCurrencyGuid) { showToast('Please select a currency.', 'warn'); return }
    if (!otherPayDate) { showToast('Please select a payment date.', 'warn'); return }
    const payTypeNum = Number(otherPayType)
    if (payTypeNum > 1 && !otherBankAccount.trim()) { showToast('Please enter a bank account.', 'warn'); return }

    const currencyCode = currencies.find(c => c.currencyGuid === otherCurrencyGuid)?.currencyCode ?? ''
    setOtherPayments(prev => [...prev, {
      id: `other-${Date.now()}`,
      code: `OTH-${String(otherSeq).padStart(4, '0')}`,
      receiptNo: `RCP-OTH-${String(otherSeq).padStart(4, '0')}`,
      payDate: otherPayDate, ledgerName: otherLedger, amount: otherAmount, currencyCode,
    }])
    setOtherSeq(n => n + 1)
    showToast('Other payment recorded.', 'success')
    resetOtherForm()
  }

  function selectStudent(applicationGuid: string, name: string, studentGuidHint: string | null) {
    setSelectedApplicationGuid(applicationGuid)
    setSelectedStudentGuidHint(studentGuidHint)
    setSearch(name)
    setCommittedSearch('')
    setSearchFocused(false)
    setShowHistory(false)
    setShowOutstanding(true)
    setActivePayTab('tuition')
    resetPaymentForm()
    setNchePayments([])
    resetNcheForm()
    setGuildPayments([])
    resetGuildForm()
    setOtherPayments([])
    resetOtherForm()
    showToast(`Loaded: ${name}`, 'success')
  }

  const showBankFields = Number(payType) > 1

  function handleSave(confirmOverride = false) {
    if (!profile || !selectedApplicationGuid) { showToast('Please select a student first.', 'warn'); return }
    // 0 is a legal amount here — unlike every other create in this module,
    // per the flow doc: "tuition create-payment accepts amount: 0 — it
    // books a pure-discount settlement that moves no cash. Do not block it
    // client-side." Only reject a blank field or a genuinely negative
    // number; parseFloat('') || 0 would otherwise silently treat a blank
    // field as an intentional 0, so the emptiness check comes first.
    if (!amount.trim()) { showToast('Please enter an amount.', 'warn'); return }
    const amt = parseFloat(amount)
    if (isNaN(amt) || amt < 0) { showToast('Amount must be zero or greater.', 'warn'); return }
    if (!selectedCurrency) { showToast('Please select a payment currency.', 'warn'); return }
    if (!receiptBookGuid) { showToast('Please select a receipt book.', 'warn'); return }
    if (!payDate) { showToast('Please select a payment date.', 'warn'); return }
    const payTypeNum = Number(payType)
    if (showBankFields && !procBankGuid) { showToast('Please select a bank.', 'warn'); return }

    createPayment.mutate(
      {
        applicationGuid: selectedApplicationGuid,
        studentGuid,
        amount: amt,
        currencyGuid: selectedCurrency.currencyGuid,
        receiptBookGuid,
        payDate,
        payType: payTypeNum,
        procBankGuid: showBankFields ? procBankGuid : null,
        remarks: remarks.trim() || null,
        confirmOverride,
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
            date: formatDateTime(now),
            amount: `${amt.toLocaleString()} ${selectedCurrency.currencyCode}`,
            balance: `${selectedCurrency.currencyCode} ${result.balance.toLocaleString()}`,
            advanceMessage: result.advanceMessage,
            reRegistrationWarning: result.reRegistrationWarning,
          })
          // Step 3/7 (outstanding-ledgers, payment-history) already refetch
          // via useCreatePayment's onSuccess invalidation — clear Step 5's
          // own allocation preview here, per the flow doc, so it doesn't
          // keep showing the just-spent amount's stale allocation next to
          // the fresh receipt.
          setAmount('')
          setCurrencyGuid('')
          showToast(`Payment saved! Receipt ${result.receipt} generated.`, 'success')
        },
        onError: (error: Error) => {
          // 409 reregistration_required — the student is behind on results.
          // Per the flow doc: show the explanation in a confirm dialog, and
          // on confirm resubmit the identical body with confirmOverride: true.
          if (error instanceof AuthError && error.code === 'reregistration_required') {
            if (window.confirm(`${error.message}\n\nProceed with this payment anyway?`)) handleSave(true)
            return
          }
          showToast(error.message || 'Failed to save payment. Please try again.', 'error')
        },
      },
    )
  }

  function handleClear() {
    setSelectedApplicationGuid(null)
    setSelectedStudentGuidHint(null)
    setSearch('')
    setCommittedSearch('')
    resetPaymentForm()
    setShowHistory(false)
    setShowOutstanding(true)
    setActivePayTab('tuition')
    setNchePayments([])
    resetNcheForm()
    setGuildPayments([])
    resetGuildForm()
    setOtherPayments([])
    resetOtherForm()
    showToast('Form cleared.', 'warn')
  }

  return (
    <>
      {/* id scopes the .g2 override in globals.css to just this page's outer
          Left-form/Right-preview split — same "direct-child combinator, not
          a plain descendant selector" reasoning as #page-payment's own .g2
          override, so Step 3's inner 2-column field grids (Amount/Currency,
          Payment Date/Method) don't get caught by it too. */}
      <div className="page active" id="page-payment-console">

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

        {/* Student Search — its own full-width bar (sketch: "Student Search"),
            split out from the profile card below it so a cashier can search
            without the profile summary's extra height in the way. */}
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
                  onKeyDown={e => { if (e.key === 'Enter') handleSearchClick() }}
                />
              </div>
              <button className="btn btn-primary" onClick={handleSearchClick}><i className="lni lni-search-alt"></i> Search</button>
            </div>

            {/* Dropdown: opens on focus (empty box lists every application,
                per PaymentConsoleStudentSearch.bru's "omit searchTerm to browse all"),
                closes on outside click via the searchBoxRef effect above
                or on picking a result. Floats over the page below the
                input row rather than pushing content down, since "list
                all" can return many rows. */}
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
                  <div className="text-g400 px-3 py-2" style={{ fontSize: 12.5 }}>
                    {committedSearch ? 'No matching applications found.' : 'No applications found.'}
                  </div>
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

        {/* Student Profile Details — its own full-width bar (sketch: "Student
            Profile Details"), shown once a student has been picked from the
            search dropdown above. */}
        {profile && selectedApplicationGuid && (
          <div className="card">
            <div className="card-hdr">
              <div className="card-title"><span className="ctitle-icon"><i className="lni lni-user"></i></span> Student Profile Details</div>
              {/* Moved here from Step 2's own inline accordion — reachable
                  the moment a student is picked, not just after scrolling
                  into Column 2. Opens PaymentHistoryModal below. */}
              <button className="btn btn-neu btn-sm" onClick={() => setShowHistory(true)}>
                <i className="lni lni-folder"></i> Payment History
              </button>
            </div>
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
              {/* Guards against the literal string "null" — confirmed live
                  on an application with no intake assigned yet, this field
                  can come back as the 4-char string "null" rather than a
                  real null, which ?? alone doesn't catch. */}
              <div><span className="text-muted">Intake: </span><span className="font-bold">{profile.intakeCode && profile.intakeCode !== 'null' ? profile.intakeCode : '—'}</span></div>
            </div>
            <div className="mt-[10px] pt-[10px]" style={{ borderTop: '1px solid var(--b100)' }}>
              <div className="sec-divider" style={{ marginTop: 0 }}>Extended Profile</div>
              <div className="g2 text-xs">
                <div><span className="text-muted">Email: </span><span className="font-bold">{profile.emailId ?? profile.universityEmail ?? '—'}</span></div>
                <div><span className="text-muted">Phone: </span><span className="font-bold">{profile.phone ?? '—'}</span></div>
                <div><span className="text-muted">Batch: </span><span className="font-bold">{batchCode ?? '—'}</span></div>
                <div><span className="text-muted">Year: </span><span className="font-bold">{profile.yearCode ?? '—'}</span></div>
              </div>
            </div>
          </div>
        )}

        {/* Three-column body (sketch): Payment Method · Existing Fee Details
            & Student Ledger · Allocation/Receipt (the "bill"). Each column is
            its own flex stack so ScrollTable's own horizontal scroll — not
            column overflow — handles anything too wide, same reasoning as
            the old two-column min-w-0 note it replaces.

            g3 vs g2: Column 3 currently only ever holds the (disabled)
            Allocation Preview and the post-save receipt — with Allocation
            Preview commented out below, Column 3 renders empty until a
            receipt exists, which left a blank reserved third column and a
            lopsided 2-column-of-content layout. Collapse to g2 (Payment
            Method / Fee Details) until there's a receipt to show, then
            expand back to g3 so the receipt gets its own column again. */}
        {selectedApplicationGuid && (
        <div className={receipt ? 'g3' : 'g2'}>
          {/* Column 1: Payment Method */}
          <div className="flex flex-col gap-5 min-w-0">

            {/* Fee-category menu — per the sketch, a stacked list (not a
                horizontal tab bar) at the top of this column. Per the flow
                doc, this page (and its endpoints) only cover the Tuition
                category; Other/NCHE/Guild get their own flows wired in
                later. Kept above Step 3 rather than inside it since it
                gates which category's form (and eventually which
                category's outstanding grid/allocation preview) the rest of
                the column shows. */}
            <div className="card p-0 overflow-hidden">
              <div className="card-hdr" style={{ padding: '13px 16px' }}>
                <div className="card-title"><span className="ctitle-icon"><i className="lni lni-wallet"></i></span> Payment Category</div>
              </div>
              {PAY_CATEGORY_TABS.map((t, i) => (
                <button
                  key={t.id}
                  onClick={() => setActivePayTab(t.id)}
                  className="flex items-center gap-2 w-full text-left"
                  style={{
                    padding: '11px 16px',
                    fontSize: 'var(--fs-sm)',
                    fontWeight: activePayTab === t.id ? 700 : 500,
                    color: activePayTab === t.id ? 'var(--b700)' : 'var(--g600)',
                    background: activePayTab === t.id ? 'var(--b50)' : 'transparent',
                    borderLeft: `2.5px solid ${activePayTab === t.id ? 'var(--b600)' : 'transparent'}`,
                    borderBottom: i < PAY_CATEGORY_TABS.length - 1 ? '1px solid var(--g100)' : 'none',
                  }}
                >
                  <span className="text-g400" style={{ fontSize: 11, width: 14, flexShrink: 0 }}>{i + 1}.</span>
                  <i className={`lni ${t.icon}`}></i> {t.label}
                </button>
              ))}
            </div>

            {activePayTab !== 'tuition' && activePayTab !== 'other' && activePayTab !== 'nche' && activePayTab !== 'guild' && (
              <div className="card">
                <div className="text-center" style={{ padding: 24 }}>
                  <div className="mb-2 text-g400" style={{ fontSize: 28 }}><i className="lni lni-hourglass"></i></div>
                  <div className="font-bold text-g700" style={{ fontSize: 13.5 }}>
                    {PAY_CATEGORY_TABS.find(t => t.id === activePayTab)?.label} — coming soon
                  </div>
                  <div className="text-g400 mt-1" style={{ fontSize: 12.5 }}>
                    This category isn&apos;t wired up yet. Switch back to Tuition Fee to record a tuition payment.
                  </div>
                </div>
              </div>
            )}

            {/* Other Payment tab — outstanding balance is real (GET
                .../outstanding-all, filtered to category 2), per the
                flow-doc mapping. The payment-entry form below and its
                payment log stay a UI-first mock laid out after the legacy
                ISMS reference screen (frmTrnPaymentOther.aspx): a ledger
                picker, a payment-entry form (with an Advance Payment
                toggle and bank-account gating matching Step 3's own), and
                a flat, append-only payment log (no edit/delete, per the
                reference screen's own "Paid Fee Details" table) — no
                documented single-category Other-payment submit endpoint
                exists yet. */}
            {activePayTab === 'other' && (
              <div className="card">
                <div className="card-hdr">
                  <div className="card-title"><span className="ctitle-icon"><i className="lni lni-wallet"></i></span> Other Payment</div>
                  <span className="badge badge-blue">Outstanding: live</span>
                </div>

                <OutstandingCategoryTable items={otherOutstanding} isLoading={isAllOutstandingLoading} isError={isAllOutstandingError} />

                <div className="sec-divider" style={{ marginTop: 0 }}>Payment Detail <span className="badge badge-grey" style={{ marginLeft: 6, fontSize: 9.5 }}>Mock UI · no live data</span></div>

                <div className="fg mb-[14px]">
                  <div className="lbl">Ledger <span className="req">*</span></div>
                  <SearchSelect
                    placeholder="— Select Ledger —"
                    options={OTHER_LEDGER_OPTIONS.map(l => ({ value: l, label: l }))}
                    value={otherLedger}
                    onChange={setOtherLedger}
                  />
                </div>
                <div className="fg mb-[14px]">
                  <div className="lbl">Payment Date <span className="req">*</span></div>
                  <DatePicker value={otherPayDate} onChange={setOtherPayDate} />
                </div>

                <div className="fg mb-[14px]">
                  <label className="flex items-center gap-2" style={{ fontSize: 'var(--fs-sm)', cursor: 'pointer' }}>
                    <input type="checkbox" checked={otherIsAdvance} onChange={e => setOtherIsAdvance(e.target.checked)} />
                    Advance Payment
                  </label>
                </div>
                {otherIsAdvance && (
                  <div className="fg mb-[14px]">
                    <div className="lbl">Advance Payment Date</div>
                    <DatePicker value={otherAdvanceDate} onChange={setOtherAdvanceDate} />
                  </div>
                )}

                <div className="fg mb-[14px]">
                  <div className="lbl">Payment Type <span className="req">*</span></div>
                  <SearchSelect
                    options={Object.entries(PAY_TYPE_LABELS).map(([value, label]) => ({ value, label }))}
                    value={otherPayType}
                    onChange={setOtherPayType}
                  />
                </div>
                <div className="fg mb-[14px]">
                  <div className="lbl">Amount <span className="req">*</span></div>
                  <input type="number" min={0} step={0.01} className="ctrl" placeholder="0.00" value={otherAmount} onChange={e => setOtherAmount(e.target.value)} />
                </div>
                <div className="fg mb-[14px]">
                  <div className="lbl">Currency <span className="req">*</span></div>
                  <SearchSelect
                    placeholder="— Select Currency —"
                    options={currencies.map(c => ({ value: c.currencyGuid, label: `${c.currencyCode} — ${c.currencyName}` }))}
                    value={otherCurrencyGuid}
                    onChange={setOtherCurrencyGuid}
                  />
                </div>
                {Number(otherPayType) > 1 && (
                  <div className="fg mb-[14px]">
                    <div className="lbl">Bank Account <span className="req">*</span></div>
                    <input className="ctrl" type="text" placeholder="Bank account number" value={otherBankAccount} onChange={e => setOtherBankAccount(e.target.value)} />
                  </div>
                )}
                <div className="fg mb-4">
                  <div className="lbl">Remarks</div>
                  <input className="ctrl" type="text" placeholder="Optional notes" value={otherRemarks} onChange={e => setOtherRemarks(e.target.value)} />
                </div>

                <div className="flex justify-end mb-5">
                  <button className="btn btn-primary" onClick={otherSaveEntry}>
                    <i className="lni lni-save"></i> Add Payment
                  </button>
                </div>

                <div className="sec-divider" style={{ marginTop: 0 }}>Paid Fee Details</div>
                {otherPayments.length === 0 ? (
                  <div className="text-g400 text-center" style={{ padding: 16, fontSize: 12.5 }}>No other payments recorded yet.</div>
                ) : (
                  <ScrollTable className="no-sticky-col">
                    <table>
                      <thead><tr><th>Payment Code</th><th>Payment Date</th><th>Receipt No.</th><th>Ledger Name</th><th>Amount</th><th>Cur.</th></tr></thead>
                      <tbody>
                        {otherPayments.map(p => (
                          <tr key={p.id}>
                            <td className="font-mono">{p.code}</td>
                            <td>{p.payDate}</td>
                            <td className="font-mono text-blue">{p.receiptNo}</td>
                            <td>{p.ledgerName}</td>
                            <td className="text-green font-bold">{parseFloat(p.amount).toLocaleString()}</td>
                            <td><span className="badge badge-gold">{p.currencyCode}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </ScrollTable>
                )}
              </div>
            )}

            {/* NCHE tab — fully wired to real endpoints: outstanding
                balance from GET .../outstanding-all (filtered to category
                3), payment submit from POST .../payment-nche
                (payment/post-payment-nche.md). No currency/receipt-book/
                bank/semester field — that payload doesn't take one; the
                amount is validated server-side as a whole multiple of a
                per-semester rate this client can't know ahead of time, so
                a mismatched amount surfaces as the backend's own 400.
                nchePayments below is a local session log of what was
                actually submitted, not mock data — see its declaration
                comment above for why there's no edit/delete. */}
            {activePayTab === 'nche' && (
              <div className="card">
                <div className="card-hdr">
                  <div className="card-title"><span className="ctitle-icon"><i className="lni lni-certificate"></i></span> NCHE Payments</div>
                  <span className="badge badge-blue">Outstanding: live</span>
                </div>

                <OutstandingCategoryTable items={ncheOutstanding} isLoading={isAllOutstandingLoading} isError={isAllOutstandingError} />

                <div className="sec-divider">Payment Detail</div>

                <div className="fg mb-[14px]">
                  <div className="lbl">Date <span className="req">*</span></div>
                  <DatePicker value={nchePayDate} onChange={setNchePayDate} />
                </div>
                <div className="fg mb-[14px]">
                  <div className="lbl">PRN Number</div>
                  <input className="ctrl" type="text" placeholder="e.g. 2200874017969" value={nchePrn} onChange={e => setNchePrn(e.target.value)} />
                </div>
                <div className="fg mb-[14px]">
                  <div className="lbl">Amount <span className="req">*</span></div>
                  <input type="number" min={0} step={0.01} className="ctrl" placeholder="0.00" value={ncheAmount} onChange={e => setNcheAmount(e.target.value)} />
                </div>
                <div className="fg mb-4">
                  <div className="lbl">Remarks</div>
                  <input className="ctrl" type="text" placeholder="Optional notes" value={ncheRemarks} onChange={e => setNcheRemarks(e.target.value)} />
                </div>

                <div className="flex justify-end mb-5">
                  <button className="btn btn-primary" disabled={createPaymentNche.isPending} onClick={ncheSubmit}>
                    <i className="lni lni-save"></i> {createPaymentNche.isPending ? 'Saving…' : 'Add Payment'}
                  </button>
                </div>

                {nchePayments.length === 0 ? (
                  <div className="text-g400 text-center" style={{ padding: 16, fontSize: 12.5 }}>No NCHE payments recorded this visit.</div>
                ) : (
                  <ScrollTable className="no-sticky-col">
                    <table>
                      <thead><tr><th>Payment Date</th><th>PRN Number</th><th>Amount</th><th>Remarks</th><th>Balance After</th></tr></thead>
                      <tbody>
                        {nchePayments.map(p => (
                          <tr key={p.id}>
                            <td>{p.payDate}</td>
                            <td className="font-mono">{p.pnrNumber || '—'}</td>
                            <td className="text-green font-bold">{p.amount.toLocaleString()}</td>
                            <td>{p.remarks || '—'}</td>
                            <td className="text-amber">{p.remainingBalance.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </ScrollTable>
                )}
              </div>
            )}

            {/* Guild tab — fully wired to real endpoints: outstanding
                balance from GET .../outstanding-all (filtered to category
                4), payment submit from POST .../payment-guild
                (payment/post-payment-guild.md) — structurally identical to
                NCHE, keyed by a bank deposit slip number instead of a PRN,
                no Remarks field. guildPayments below is a local session
                log of what was actually submitted, same reasoning as
                nchePayments above. */}
            {activePayTab === 'guild' && (
              <div className="card">
                <div className="card-hdr">
                  <div className="card-title"><span className="ctitle-icon"><i className="lni lni-users"></i></span> Guild Payments</div>
                  <span className="badge badge-blue">Outstanding: live</span>
                </div>

                <OutstandingCategoryTable items={guildOutstanding} isLoading={isAllOutstandingLoading} isError={isAllOutstandingError} />

                <div className="sec-divider">Payment Detail</div>

                <div className="fg mb-[14px]">
                  <div className="lbl">Date <span className="req">*</span></div>
                  <DatePicker value={guildPayDate} onChange={setGuildPayDate} />
                </div>
                <div className="fg mb-[14px]">
                  <div className="lbl">Bank Deposit Slip Number</div>
                  <input className="ctrl" type="text" placeholder="e.g. 100XCBERP009017" value={guildSlipNo} onChange={e => setGuildSlipNo(e.target.value)} />
                </div>
                <div className="fg mb-4">
                  <div className="lbl">Amount <span className="req">*</span></div>
                  <input type="number" min={0} step={0.01} className="ctrl" placeholder="0.00" value={guildAmount} onChange={e => setGuildAmount(e.target.value)} />
                </div>

                <div className="flex justify-end mb-5">
                  <button className="btn btn-primary" disabled={createPaymentGuild.isPending} onClick={guildSubmit}>
                    <i className="lni lni-save"></i> {createPaymentGuild.isPending ? 'Saving…' : 'Add Payment'}
                  </button>
                </div>

                {guildPayments.length === 0 ? (
                  <div className="text-g400 text-center" style={{ padding: 16, fontSize: 12.5 }}>No Guild payments recorded this visit.</div>
                ) : (
                  <ScrollTable className="no-sticky-col">
                    <table>
                      <thead><tr><th>Payment Date</th><th>Bank Deposit Slip Number</th><th>Amount</th><th>Balance After</th></tr></thead>
                      <tbody>
                        {guildPayments.map(p => (
                          <tr key={p.id}>
                            <td>{p.payDate}</td>
                            <td className="font-mono">{p.bankDeposit || '—'}</td>
                            <td className="text-green font-bold">{p.amount.toLocaleString()}</td>
                            <td className="text-amber">{p.remainingBalance.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </ScrollTable>
                )}
              </div>
            )}

            {/* Step 3: Record Payment — suppressed once the outstanding
                grid (Column 2) confirms there's nothing left to bill.
                Per the flow doc: "'No outstanding ledgers found.' is a 404
                but not an error. It means fully paid. Render step 3 as an
                empty/settled state and suppress the payment form, rather
                than showing a failure toast." Gated on !isLedgersLoading
                too so the form doesn't flash visible before that grid has
                had a chance to report empty. */}
            {activePayTab === 'tuition' && !receipt && isLedgersLoading && (
              <div className="card">
                <div className="card-hdr">
                  <div className="card-title"><span className="ctitle-icon"><i className="lni lni-credit-cards"></i></span> Step 3 · Record Payment</div>
                </div>
                <div className="text-g400 text-center" style={{ padding: 16, fontSize: 12.5 }}>Checking outstanding balance…</div>
              </div>
            )}
            {activePayTab === 'tuition' && !receipt && !isLedgersLoading && ledgers.length === 0 && (
              <div className="card">
                <div className="card-hdr">
                  <div className="card-title"><span className="ctitle-icon"><i className="lni lni-credit-cards"></i></span> Step 3 · Record Payment</div>
                </div>
                <div className="text-center" style={{ padding: 24 }}>
                  <div className="mb-2 text-green" style={{ fontSize: 28 }}><i className="lni lni-checkmark-circle"></i></div>
                  <div className="font-bold text-g700" style={{ fontSize: 13.5 }}>Fully settled</div>
                  <div className="text-g400 mt-1" style={{ fontSize: 12.5 }}>This application has no outstanding tuition ledgers — there is nothing to bill right now.</div>
                </div>
              </div>
            )}
            {activePayTab === 'tuition' && !receipt && !isLedgersLoading && ledgers.length > 0 && (
              <div className="card">
                <div className="card-hdr">
                  <div className="card-title"><span className="ctitle-icon"><i className="lni lni-credit-cards"></i></span> Step 3 · Record Payment</div>
                </div>

                <div className="fg mb-[14px]">
                  <div className="lbl">Amount Received <span className="req">*</span></div>
                  <input type="number" min={0} step={0.01} className="amt-val-input" placeholder="0.00"
                    style={{ fontSize: 18, fontWeight: 700 }}
                    value={amount} onChange={e => setAmount(e.target.value)} />
                </div>
                <div className="fg mb-[14px]">
                  <div className="lbl">Currency Received <span className="req">*</span></div>
                  <SearchSelect
                    placeholder="— Select Currency —"
                    options={currencies.map(c => ({ value: c.currencyGuid, label: `${c.currencyCode} — ${c.currencyName}` }))}
                    value={currencyGuid}
                    onChange={setCurrencyGuid}
                  />
                </div>
                <div className="fg mb-[14px]">
                  <div className="lbl">Payment Date <span className="req">*</span></div>
                  <DatePicker value={payDate} onChange={setPayDate} />
                </div>
                <div className="fg mb-[14px]">
                  <div className="lbl">Payment Method <span className="req">*</span></div>
                  <SearchSelect
                    options={Object.entries(PAY_TYPE_LABELS).map(([value, label]) => ({ value, label }))}
                    value={payType}
                    onChange={val => { setPayType(val); setReceiptBookGuid('') }}
                  />
                </div>

                <div className="fg mb-[14px]">
                  <div className="lbl">Receipt Book <span className="req">*</span></div>
                  <SearchSelect
                    placeholder="— Select Receipt Book —"
                    options={receiptBooks.map(r => ({ value: r.receiptBookGuid, label: r.bookCode }))}
                    value={receiptBookGuid}
                    onChange={setReceiptBookGuid}
                  />
                </div>

                {showBankFields && (
                  <div className="mb-[14px]">
                    <div className="fg mb-[14px]">
                      <div className="lbl">Bank Name <span className="req">*</span></div>
                      <SearchSelect
                        placeholder="— Select Bank —"
                        options={banks.map(b => ({ value: b.procBankGuid, label: b.bankName }))}
                        value={procBankGuid}
                        onChange={setProcBankGuid}
                      />
                    </div>
                    <div className="fg">
                      <div className="lbl">Bank Transaction Ref</div>
                      <input className="ctrl" type="text" placeholder="Bank reference number" value={bankRef} onChange={e => setBankRef(e.target.value)} />
                    </div>
                  </div>
                )}

                <div className="fg mb-4">
                  <div className="lbl">Remarks</div>
                  <textarea className="ctrl" rows={2} placeholder="Optional notes or sponsor details..." value={remarks} onChange={e => setRemarks(e.target.value)} />
                </div>

                <div className="flex gap-[10px] justify-between items-center">
                  <button className="btn btn-neu" onClick={handleClear}><i className="lni lni-close"></i> Clear</button>
                  <button className="btn btn-primary btn-lg" disabled={createPayment.isPending} onClick={() => handleSave()}>
                    <i className="lni lni-save"></i> {createPayment.isPending ? 'Saving…' : 'Save Payment & Generate Receipt →'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Column 2: Existing Fee Details / Student Ledger / Outstanding Balance */}
          <div className="flex flex-col gap-5 min-w-0">
            <div className="card">
              <div className="card-hdr">
                <div className="card-title"><span className="ctitle-icon"><i className="lni lni-dollar"></i></span> Step 2 · Outstanding Balance</div>
                <span className="badge badge-amber">{fmtUGX(totalOutstanding)} outstanding</span>
              </div>
              <button className="btn btn-neu btn-sm justify-between w-full mb-[10px]" onClick={() => setShowOutstanding(v => !v)}>
                <span><i className="lni lni-list"></i> Outstanding Ledgers</span>
                <span>{showOutstanding ? '▴' : '▾'}</span>
              </button>
              {showOutstanding && (
                isLedgersLoading ? (
                  <div className="text-g400 text-center" style={{ padding: 16, fontSize: 12.5 }}>Loading ledgers…</div>
                ) : ledgers.length === 0 ? (
                  <div className="text-g400 text-center" style={{ padding: 16, fontSize: 12.5 }}>No outstanding tuition ledgers for this application.</div>
                ) : (
                  <ScrollTable className="no-sticky-col">
                    <table>
                      <thead><tr><th>Ledger</th><th>Paid</th><th>Outstanding</th><th>Cur.</th></tr></thead>
                      <tbody>
                        {/* Grouped by semester with a subheader row — without
                            studentGuid narrowing the billed range (an
                            application that hasn't become a student yet),
                            this list can span every remaining semester of
                            the programme at once, and ledgerName repeats
                            across them ("Tuition Fee" in every semester,
                            "Semester Entry Fee" in most) — a flat list left
                            no way to tell which semester a given row
                            belonged to (confirmed live: 11 rows across 4
                            semesters, several same-named). */}
                        {ledgerGroups.map(([semGroupName, rows]) => (
                          <Fragment key={semGroupName}>
                            <tr>
                              <td colSpan={4} className="font-bold text-g500 bg-g50" style={{ fontSize: 11, padding: '5px 10px' }}>
                                {semGroupName}
                              </td>
                            </tr>
                            {rows.map((l, i) => (
                              <tr key={`${l.ledgerGuid ?? 'none'}-${l.semesterGuid ?? semGroupName}-${i}`}>
                                <td>{l.ledgerName}{l.ledgerNum ? <span className="text-g400"> ({l.ledgerNum})</span> : null}</td>
                                <td className={l.paidAmount > 0 ? 'text-green font-bold' : 'text-muted'}>{l.paidAmount > 0 ? `${l.currencyName} ${l.paidAmount.toLocaleString()} ✓` : '—'}</td>
                                <td className={l.outstanding === 0 ? 'text-green font-bold' : 'text-amber'}>{l.outstanding > 0 ? `${l.currencyName} ${l.outstanding.toLocaleString()}` : '0 ✓'}</td>
                                <td><span className="badge badge-gold">{l.currencyName}</span></td>
                              </tr>
                            ))}
                          </Fragment>
                        ))}
                      </tbody>
                    </table>
                  </ScrollTable>
                )
              )}
              </div>
          </div>

          {/* Column 3: Allocation Preview + Receipt (the "bill") — min-w-0
              for the same reason as the columns above. Only rendered once
              there's a receipt to show (see the g3/g2 className note
              above) — with Allocation Preview commented out, an empty
              Column 3 has nothing else to display. */}
          {receipt && (
          <div className="flex flex-col gap-5 min-w-0">
            {/* Allocation Preview — commented out (not removed) per request.
                Gated on SHOW_ALLOCATION_PREVIEW (see its declaration
                comment above) rather than an ordinary JSX comment block,
                since this section contains its own nested comment (below)
                and JSX comments don't nest. Re-enable by flipping that
                constant to true; nothing else needs to change — the
                usePayableLedgers() query above is still live, so the data
                is ready the moment this is flipped back on. */}
            {SHOW_ALLOCATION_PREVIEW && (
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
                ) : isPreviewError ? (
                  <div className="text-center text-clr-red" style={{ padding: 32, fontSize: 13 }}>
                    <i className="lni lni-warning"></i> {previewError instanceof Error ? previewError.message : "Couldn't calculate the allocation."}
                  </div>
                ) : !payableLedgers || payableLedgers.lines.length === 0 ? (
                  <div className="text-center text-g400" style={{ padding: 32, fontSize: 13 }}>No payable ledger lines for this amount.</div>
                ) : (
                  <div>
                    <ScrollTable className="no-sticky-col">
                      <table>
                        <thead><tr><th>Ledger</th><th>Amount</th><th>Type</th></tr></thead>
                        <tbody>
                          {payableLedgers.lines.map((l, i) => (
                            <tr key={`${l.ledgerGuid ?? 'none'}-${i}`}>
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
                    {/* payableLedgers.balance is what's left UNALLOCATED from
                        this payment amount after applying it to the lines
                        above — NOT the student's total outstanding balance
                        (get-payable-ledgers.md). A common misreading: 0 here
                        just means the entered amount was small enough to be
                        fully absorbed by the top of the ledger queue, not
                        that the account is settled. Labeled accordingly so a
                        cashier doesn't read "0" as "fully paid off" — Step 2
                        · Outstanding Balance is the real "what's still owed"
                        view, and it refetches after Save. */}
                    <div className="mt-[10px] p-3 rounded-[var(--rsm)] bg-b50 border border-[1.5px] border-b100 flex justify-between items-center">
                      <span className="text-muted" style={{ fontSize: 12 }}>Unallocated from This Payment{payableLedgers.balance > 0 ? ' (→ advance deposit)' : ''}</span>
                      <span className="font-bold text-blue">{selectedCurrency?.currencyCode ?? ''} {payableLedgers.balance.toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {receipt && (
              <div className="card">
                {/* receipt-print-area (globals.css) — window.print() below
                    previously printed the entire page (sidebar, header,
                    Step 1-3 forms, everything), since no print-scoped CSS
                    existed anywhere in this app. Now only this card prints. */}
                <div className="receipt-print-area border border-g200 rounded-xl p-5 bg-g50">
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
                  {/* receipt.balance is PaymentResultDto.balance — the
                      amount left UNALLOCATED from this payment, not the
                      student's total outstanding balance (post-payment.md).
                      Was previously labeled "New Outstanding", which reads
                      as "the account is now settled" — wrong whenever the
                      payment was smaller than what's owed, which is the
                      common case. Step 2 · Outstanding Balance (which
                      refetches after Save) is where the real remaining
                      balance is shown. */}
                  <div className="receipt-total"><span>Unallocated Amount</span><span>{receipt.balance}</span></div>
                  <div className="text-g400" style={{ fontSize: 10.5, marginTop: -4 }}>
                    Leftover from this payment only — see Step 2 · Outstanding Balance for the student&apos;s updated total owed.
                  </div>
                  {receipt.advanceMessage && (
                    <div className="mt-2"><div className="info-box"><i className="lni lni-information"></i> {receipt.advanceMessage}</div></div>
                  )}
                  {/* Surfaced as a notice, not an error — per the flow doc,
                      this is the same reregistration warning the 409 would
                      have blocked on; it's informational now that the
                      cashier already confirmed past it via confirmOverride. */}
                  {receipt.reRegistrationWarning && (
                    <div className="mt-2"><div className="info-box"><i className="lni lni-warning"></i> {receipt.reRegistrationWarning}</div></div>
                  )}
                  <div className="text-center text-g400 mt-3 pt-3 border-t border-dashed border-g300" style={{ fontSize: 10 }}>
                    Received by: Finance Office · ISBAT University<br />
                    System-generated receipt. Unique code: <span className="font-mono">{receipt.code}</span>
                  </div>
                </div>
                <div className="flex gap-2 mt-3 flex-wrap no-print">
                  <button className="btn btn-neu flex-1 justify-center" onClick={() => window.print()}><i className="lni lni-printer"></i> Print Receipt</button>
                  <button className="btn btn-primary flex-1 justify-center" onClick={handleClear}>← New Payment</button>
                </div>
              </div>
            )}
          </div>
          )}
        </div>
        )}
      </div>
      <PaymentHistoryModal
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        showToast={showToast}
        entries={paymentHistory}
        isLoading={isHistoryLoading}
        isError={isHistoryError}
      />
      <Toast toast={toast} />
    </>
  )
}
