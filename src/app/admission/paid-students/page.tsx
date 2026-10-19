'use client'
import { useEffect, useState } from 'react'
import { SearchSelect } from '@/components/SearchSelect'
import { ScrollTable } from '@/components/ScrollTable'
import { EmptyState } from '@/components/EmptyState'
import { TableLoadingState } from '@/components/TableLoadingState'
import { Pagination } from '@/components/Pagination'
import { Toast } from '@/components/Toast'
import { useIntakesDropdown } from '@/hooks/academic/useIntakes'
import { usePaidStudents, PaidStudent, PaymentKindFilter } from '@/hooks/admission/usePaidStudents'
import { canPrintPaidReceipt } from '@/lib/api/admission/paidStudents'
import { getApplicationPaymentReceiptPdf } from '@/lib/api/admission/applicationPayment'
import { APPLICATION_STAGES, STAGE_IN_PROGRESS } from '@/lib/api/admission/applicationStatusReport'
import { AuthError } from '@/lib/api/client'
import { openPdfInNewTab } from '@/lib/openPdf'

// Paid Students — GET /admissions/application-payments/paid-students
// (application-payment/get-paid-students.md). Everyone who paid (or was
// exempted from) the application fee for an intake, where their application
// stands, and a reprint of the payment receipt.

const PAGE_SIZE = 10
const KIND_OPTIONS: { value: PaymentKindFilter; label: string }[] = [
  { value: 'Paid', label: 'Paid' },
  { value: 'Exempted', label: 'Exempted' },
  { value: 'All', label: 'Paid & Exempted' },
]
const STAGE_OPTIONS = APPLICATION_STAGES.map(s => ({ value: String(s.value), label: s.label }))
const STAGE_BADGE: Record<number, string> = {
  1: 'badge-grey', 2: 'badge-blue', 3: 'badge-amber', 4: 'badge-cyan', 5: 'badge-purple', 6: 'badge-red', 7: 'badge-green',
}

// Stored values can carry stray spaces; blank means missing.
const clean = (s: string | null | undefined) => s?.trim() || ''

function fmtMoney(n: number | null | undefined) {
  return n == null ? '' : n.toLocaleString('en-US', { maximumFractionDigits: 2 })
}

function fmtDate(iso: string | null) {
  if (!iso) return ''
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function isUgx(currencyName: string | null) {
  return /uganda|ugx/i.test(currencyName ?? '')
}

export default function PaidStudentsPage() {
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)
  function showToast(msg: string, type = '') { setToast({ msg, type }); setTimeout(() => setToast(null), 4000) }

  const { data: intakes = [] } = useIntakesDropdown()
  const [intakeGuid, setIntakeGuid] = useState('')
  const [paymentKind, setPaymentKind] = useState<PaymentKindFilter>('Paid')
  const [stage, setStage] = useState('')
  const [search, setSearch] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)

  // Default to the current admission intake, as the API does.
  useEffect(() => {
    if (intakeGuid) return
    const current = intakes.find(i => i.currentAdmissionIntake)
    if (current) setIntakeGuid(current.intakeGuid)
  }, [intakes, intakeGuid])

  useEffect(() => {
    const t = setTimeout(() => { setSearchTerm(search.trim()); setPage(1) }, 350)
    return () => clearTimeout(t)
  }, [search])

  const query = usePaidStudents({
    intakeGuid: intakeGuid || undefined,
    paymentKind,
    stage: stage ? +stage : undefined,
    searchTerm: searchTerm || undefined,
    page,
    pageSize: PAGE_SIZE,
  })
  const rows = query.data?.items ?? []
  const totalCount = query.data?.totalCount ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
  const hasFilters = !!stage || !!searchTerm || paymentKind !== 'Paid'
  // Hold the loader over the previous page while the next one arrives.
  const loading = query.isLoading || (query.isFetching && query.isPlaceholderData)

  function clearFilters() { setStage(''); setSearch(''); setSearchTerm(''); setPaymentKind('Paid'); setPage(1) }

  const [printing, setPrinting] = useState<string | null>(null)
  async function printReceipt(r: PaidStudent) {
    if (printing) return
    setPrinting(r.paymentGuid)
    try {
      await openPdfInNewTab(() => getApplicationPaymentReceiptPdf(r.paymentGuid), `Receipt_${r.receiptNo ?? r.paymentGuid}.pdf`)
    } catch (err) {
      // receipt_generation_failed means Finance couldn't be reached; it's
      // safe to try again, so say so rather than calling it a failure.
      const msg = err instanceof AuthError && err.code === 'receipt_generation_failed'
        ? 'The receipt couldn’t be generated just now. Please try again in a moment.'
        : (err instanceof Error && err.message) || 'Could not load the receipt.'
      showToast(msg, 'error')
    } finally {
      setPrinting(null)
    }
  }

  const intakeOptions = intakes.map(i => ({
    value: i.intakeGuid,
    label: `${i.intakeCode} — ${i.description}${i.currentAdmissionIntake ? ' (current admission)' : ''}`,
  }))

  return (
    <div className="page active">
      <div className="pg-hdr">
        <div>
          <div className="pg-title">Paid Students</div>
          <div className="pg-sub">Applicants who paid the application fee for an intake, where their application stands, and their receipts</div>
        </div>
      </div>

      <div className="card mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 p-5">
          <div className="fg mb-0">
            <label className="lbl">Intake</label>
            <SearchSelect placeholder="Current admission intake" options={intakeOptions} value={intakeGuid} onChange={v => { setIntakeGuid(v); setPage(1) }} />
          </div>
          <div className="fg mb-0">
            <label className="lbl">Payment</label>
            <SearchSelect options={KIND_OPTIONS} value={paymentKind} onChange={v => { setPaymentKind(v as PaymentKindFilter); setPage(1) }} />
          </div>
          <div className="fg mb-0">
            <label className="lbl">Application Stage</label>
            <SearchSelect placeholder="All stages" options={STAGE_OPTIONS} value={stage} onChange={v => { setStage(v); setPage(1) }} />
          </div>
          <div className="fg mb-0">
            <label className="lbl" htmlFor="paid-search">Search</label>
            <input id="paid-search" className="ctrl" placeholder="Ref no, name, email or mobile" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-hdr">
          <div className="card-title"><span className="ctitle-icon"><i className="lni lni-users"></i></span> Applicants</div>
          {query.data && <span className="text-g500" style={{ fontSize: 'var(--fs-sm)' }}>{totalCount.toLocaleString()} {totalCount === 1 ? 'applicant' : 'applicants'}</span>}
        </div>
        <ScrollTable>
          <table>
            <thead>
              <tr>
                <th style={{ width: 48 }}></th>
                <th>Ref No</th>
                <th>Student</th>
                <th>Programme · Campus</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
                <th>Paid On</th>
                <th>Receipt No</th>
                <th>Payment</th>
                <th>Stage</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableLoadingState colSpan={9} />
              ) : query.isError ? (
                <tr><td colSpan={9} className="text-center" style={{ padding: 28, color: 'var(--red)' }}>
                  <i className="lni lni-warning"></i> {(query.error as Error)?.message || 'Could not load the paid students.'}
                </td></tr>
              ) : rows.length === 0 ? (
                <EmptyState colSpan={9} hasFilters={hasFilters} onClearFilters={clearFilters} />
              ) : rows.map(r => {
                const printable = canPrintPaidReceipt(r)
                const name = clean(r.studentName)
                const email = clean(r.email)
                const amountText = fmtMoney(r.amount)
                return (
                  <tr key={r.paymentGuid}>
                    <td>
                      {printable ? (
                        <button
                          type="button"
                          className="btn btn-neu btn-sm"
                          onClick={() => printReceipt(r)}
                          disabled={!!printing}
                          aria-label={`Print receipt ${r.receiptNo} for ${name || 'this applicant'}`}
                          title="Print receipt"
                        >
                          <i className={`lni ${printing === r.paymentGuid ? 'lni-spinner-arrow spin' : 'lni-printer'}`}></i>
                        </button>
                      ) : (
                        <span className="text-g300" title={r.isExempted ? 'Exempted — no receipt' : 'No receipt was issued for this payment'}>—</span>
                      )}
                    </td>
                    <td className="font-mono text-b700" style={{ whiteSpace: 'nowrap' }}>{clean(r.appRefNo) || <span className="text-g300">—</span>}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{name || <span className="text-g400">Unnamed</span>}</div>
                      <div className="text-g500" style={{ fontSize: 'var(--fs-xs)' }}>
                        {[email, r.mobile != null ? String(r.mobile) : ''].filter(Boolean).join(' · ') || '—'}
                      </div>
                    </td>
                    <td>
                      <div>{clean(r.programName) || <span className="text-g400">—</span>}</div>
                      <div className="text-g500" style={{ fontSize: 'var(--fs-xs)' }}>{clean(r.campusName)}</div>
                    </td>
                    <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                      {r.isExempted ? (
                        <span className="text-g400">—</span>
                      ) : (
                        <>
                          <div style={{ fontWeight: 700 }}>{amountText ? `${amountText} ${clean(r.currencyName)}` : <span className="text-g400">—</span>}</div>
                          {r.amountUsh != null && !isUgx(r.currencyName) && r.amount != null && (
                            <div className="text-g500" style={{ fontSize: 'var(--fs-xs)' }}>≈ UGX {fmtMoney(r.amountUsh)}</div>
                          )}
                        </>
                      )}
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>{fmtDate(r.payDate) || <span className="text-g300">—</span>}</td>
                    <td className="font-mono">{r.receiptNo ? r.receiptNo : <span className="text-g300">—</span>}</td>
                    <td>
                      {r.isExempted ? (
                        <span className="badge badge-amber" title={clean(r.exemptionTypeName) || undefined}>Exempted{clean(r.exemptionTypeName) ? ` · ${clean(r.exemptionTypeName)}` : ''}</span>
                      ) : (
                        <span className="badge badge-green">Paid</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${STAGE_BADGE[r.stage] ?? 'badge-grey'}`}>{r.stageName}</span>
                      {r.stage === STAGE_IN_PROGRESS && r.formStep && (
                        <div className="text-g500" style={{ fontSize: 'var(--fs-xs)', marginTop: 3 }}>{r.formStep}</div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </ScrollTable>
        <Pagination page={Math.min(page, totalPages)} totalPages={totalPages} totalCount={totalCount} itemLabel="applicants" onPageChange={setPage} />
      </div>

      <Toast toast={toast} />
    </div>
  )
}
