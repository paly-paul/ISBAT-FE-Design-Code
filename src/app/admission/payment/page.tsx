'use client'
import React, { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Toast } from '@/components/Toast'
import { ImportSourceModal } from '@/components/modals/admission/ImportSourceModal'
import { ImportCrmModal } from '@/components/modals/admission/ImportCrmModal'
import { ImportOdelModal } from '@/components/modals/admission/ImportOdelModal'
import { SearchSelect } from '@/components/SearchSelect'
import { useIntakes } from '@/hooks/academic/useIntakes'
import { useCampuses } from '@/hooks/config/useCampuses'
import { useProgramMasters } from '@/hooks/academic/useProgramMaster'
import { useSemestersForProgram } from '@/hooks/academic/useSemesters'
import { useBatchTimes } from '@/hooks/config/useBatchTimes'
import { useBatches } from '@/hooks/academic/useBatches'
import { useFinanceCurrencies } from '@/hooks/finance/useFinanceCurrencies'
import { useReceiptBooks } from '@/hooks/finance/useReceiptBooks'
import { useBanks } from '@/hooks/finance/useBanks'
import { useCountries } from '@/hooks/config/useCountries'
import { useEnquiries } from '@/hooks/admission/useEnquiries'
import {
  useApplicationPaymentExemptionTypes,
  useApplicationPaymentFees,
  useApplicationPaymentTypes,
  useCreateApplicationPayment,
} from '@/hooks/admission/useApplicationPayments'
import { usePagePermissions } from '@/hooks/users/usePagePermissions'

const PIPELINE = [
  { label: 'App. Payment',  desc: 'Current step', status: 'active' },
  { label: 'App. Filing',   desc: 'Next step',    status: '' },
  { label: 'Vetting',       desc: '',              status: '' },
  { label: 'Reg. Payment',  desc: '',              status: '' },
  { label: 'Registration',  desc: '',              status: '' },
]

// Application Source and Receipt Type have no counterpart on
// POST /api/v1/admissions/application-payments — kept as decorative/local
// fields (not sent) rather than dropped, since removing UI wasn't asked for.
const SOURCES       = ['Walk-in (Direct)', 'From Enquiry', 'ODel Online App.', 'CRM (Merito)', 'Staff Referral', 'Online Enquiry']
const RECEIPT_TYPES = ['Official Receipt', 'Duplicate', 'Triplicate']

// UI-only — the confirmed payload's `mobile` field is raw digits with no
// country prefix (see Create.bru's "700000000" example), so this dropdown
// never feeds the API; it's here purely so the phone number reads naturally.
const COUNTRY_CODES = [
  { value: '+256', label: '+256 · Uganda' },
  { value: '+254', label: '+254 · Kenya' },
  { value: '+255', label: '+255 · Tanzania' },
  { value: '+250', label: '+250 · Rwanda' },
  { value: '+257', label: '+257 · Burundi' },
  { value: '+211', label: '+211 · South Sudan' },
  { value: '+243', label: '+243 · DR Congo' },
  { value: '+91',  label: '+91 · India' },
  { value: '+44',  label: '+44 · United Kingdom' },
  { value: '+1',   label: '+1 · USA/Canada' },
]

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// Create.bru requires payDate as dd/MMM/yyyy (e.g. "28/Jul/2026") — the
// <input type="date"> gives us yyyy-mm-dd, so convert before submitting.
function formatBruDate(yyyyMmDd: string): string {
  const [y, m, d] = yyyyMmDd.split('-').map(Number)
  if (!y || !m || !d) return ''
  return `${String(d).padStart(2, '0')}/${MONTHS[m - 1]}/${y}`
}

interface Option { value: string; label: string }

function labelFor(options: Option[], value: string): string {
  return options.find(o => o.value === value)?.label ?? ''
}

interface FormData {
  intakeGuid: string; enquiryGuid: string; source: string; firstName: string; lastName: string
  phoneCode: string; phone: string; email: string; countryGuid: string
  campusGuid: string; programGuid: string; semesterGuid: string; batchTimeGuid: string; batchGuid: string
  feeHdGuid: string
  exemptionTypeGuid: string; payType: string
  receiptBookGuid: string; receiptType: string; feeAmount: string; currencyGuid: string
  receiptNo: string; paymentDate: string
  bankGuid: string; remarks: string
}

const initialForm: FormData = {
  intakeGuid: '', enquiryGuid: '', source: 'Walk-in (Direct)',
  firstName: '', lastName: '', phoneCode: '+256', phone: '', email: '', countryGuid: '',
  campusGuid: '', programGuid: '', semesterGuid: '', batchTimeGuid: '', batchGuid: '',
  feeHdGuid: '',
  exemptionTypeGuid: '', payType: '',
  receiptBookGuid: '', receiptType: 'Official Receipt', feeAmount: '', currencyGuid: '',
  receiptNo: '', paymentDate: '',
  bankGuid: '', remarks: '',
}

function Field({ label, req, children, span2 }: { label: string; req?: boolean; children: React.ReactNode; span2?: boolean }) {
  return (
    <div className={`fg${span2 ? ' span2' : ''}`}>
      <label className="lbl">{label}{req && <span className="req"> *</span>}</label>
      {children}
    </div>
  )
}

function PreviewRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="prev-row">
      <span className="prev-lbl">{label}</span>
      <span className="prev-sep">:</span>
      <span className="prev-val">{value || '—'}</span>
    </div>
  )
}

export default function PaymentPage() {
  const router = useRouter()
  const permissions = usePagePermissions()
  const [toast, setToast]       = useState<{ msg: string; type: string } | null>(null)
  const [openModals, setOpenModals] = useState<Set<string>>(new Set())
  const [showReceipt, setShowReceipt] = useState(false)
  const [form, setForm]         = useState<FormData>({ ...initialForm })
  const [payProofFile, setPayProofFile] = useState<File | null>(null)

  // Displayed exchange rates — kept as controlled state (not just readOnly
  // display) so the submitted exRate actually matches what's shown here.
  const [usdRate, setUsdRate] = useState('3720')
  const [kesRate, setKesRate] = useState('28.5')

  const pipelineRef = useRef<HTMLDivElement>(null)
  const [canPipLeft, setCanPipLeft]   = useState(false)
  const [canPipRight, setCanPipRight] = useState(false)

  function checkPipelineScroll() {
    const el = pipelineRef.current
    if (!el) return
    setCanPipLeft(el.scrollLeft > 4)
    setCanPipRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }

  useEffect(() => {
    checkPipelineScroll()
    const el = pipelineRef.current
    const ro = new ResizeObserver(checkPipelineScroll)
    if (el) ro.observe(el)
    window.addEventListener('resize', checkPipelineScroll)
    return () => { ro.disconnect(); window.removeEventListener('resize', checkPipelineScroll) }
  }, [])

  function scrollPipeline(dir: 'left' | 'right') {
    pipelineRef.current?.scrollBy({ left: dir === 'right' ? 200 : -200, behavior: 'smooth' })
  }

  function showToast(msg: string, type = '') { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }
  function openModal(id: string)  { setOpenModals(prev => new Set(prev).add(id)) }
  function closeModal(id: string) { setOpenModals(prev => { const s = new Set(prev); s.delete(id); return s }) }

  const set = (k: keyof FormData, v: string) => setForm(prev => ({ ...prev, [k]: v }))

  // Cascading resets: changing an upstream selection invalidates whatever
  // was scoped to it downstream (Batch depends on Programme+Semester+Batch
  // Time; Semester and Fee Structure depend on Programme).
  function setProgram(v: string) { setForm(prev => ({ ...prev, programGuid: v, semesterGuid: '', batchGuid: '', feeHdGuid: '' })) }
  function setSemester(v: string) { setForm(prev => ({ ...prev, semesterGuid: v, batchGuid: '' })) }
  function setBatchTime(v: string) { setForm(prev => ({ ...prev, batchTimeGuid: v, batchGuid: '' })) }

  // ── Real data ──────────────────────────────────────────────────────────
  // enquiryGuid is CONFIRMED required on Create (the .bru docs mark it
  // "optional" but a real 400 reproduced by removing only this field from
  // an otherwise-working payload proves otherwise) — every payment must
  // link to a real enquiry. Loads the first 100 (of 11k+ — see
  // useEnquiries' own note) for this dropdown rather than the full list.
  const { data: enquiriesData }      = useEnquiries(1, 100)
  const { data: intakes = [] }       = useIntakes()
  const { data: campuses = [] }      = useCampuses()
  const { data: programs = [] }      = useProgramMasters()
  const { data: semesters = [] }     = useSemestersForProgram(form.programGuid, !!form.programGuid)
  const { data: batchTimes = [] }    = useBatchTimes()
  // The payment-scoped Dropdowns/Batches.bru endpoint returns a real 200
  // with an empty array for combinations that do have a matching batch in
  // the generic Batches list — its filtering logic looks broken server-side,
  // not just unconfirmed. Falls back to the already-confirmed-correct
  // generic Batches list (same one Batch Management uses, real
  // programGuid/semesterGuid/batchTimeGuid), filtered client-side instead.
  // Same "payment-scoped endpoint is unreliable, use the generic one"
  // pattern as the Receipt Books field below.
  const { data: allBatchesData }     = useBatches(1, 1000)
  const batches = (allBatchesData?.items ?? []).filter(b =>
    b.programGuid === form.programGuid && b.semesterGuid === form.semesterGuid && b.batchTimeGuid === form.batchTimeGuid,
  )
  const { data: fees = [] }          = useApplicationPaymentFees(form.programGuid, !!form.programGuid)
  const { data: exemptionTypes = [] } = useApplicationPaymentExemptionTypes()
  const { data: paymentTypes = [] }  = useApplicationPaymentTypes()
  const { data: currencies = [] }    = useFinanceCurrencies()
  // The payment-scoped Dropdowns/Banks.bru endpoint has the same "unconfirmed
  // shape" risk as the other payment-scoped dropdowns — uses the generic,
  // already-real Finance Banks endpoint instead (confirmed identical
  // bankGuid/bankName shape via a live response). Status enum is 1 =
  // Inactive, 2 = Active (see lib/api/finance/bank.ts) — only offer Active.
  const { data: allBanks = [] }      = useBanks()
  const banks = allBanks.filter(b => b.status === 2)
  // The payment-scoped Dropdowns/ReceiptBooks.bru endpoint 500s server-side
  // (undocumented required "category" int query param) — fall back to the
  // already-working generic Finance Receipt Books endpoint instead. Same
  // receiptBookGuid/bookCode shape, just the full master list rather than a
  // payment-filtered one, so only offer Active (status === 1) ones here.
  const { data: allReceiptBooks = [] } = useReceiptBooks()
  const receiptBooks = allReceiptBooks.filter(r => r.status === 1)
  // No dedicated Countries dropdown under Application-Payments — reuses the
  // same real, guid-bearing Country source as Country Master and Filing
  // (GET /api/v1/users/countries), confirmed end-to-end via a real
  // successful payment.
  const { data: countries = [] }     = useCountries()
  const createPayment = useCreateApplicationPayment()

  const enquiryOptions  = (enquiriesData?.items ?? []).map(e => ({ value: e.enquiryGuid, label: `${e.studentName} (${e.enquiryCode})` }))
  const intakeOptions   = intakes.map(i => ({ value: i.intakeGuid, label: `${i.intakeCode} — ${i.description}` }))
  const campusOptions   = campuses.map(c => ({ value: c.campusGuid, label: c.campusName }))
  const programOptions  = programs.map(p => ({ value: p.programGuid, label: `${p.programName} (${p.programCode})` }))
  const countryOptions  = countries.map(c => ({ value: c.countryGuid, label: c.countryName }))
  const semesterOptions = semesters.map(s => ({ value: s.semesterGuid, label: s.semName }))
  const batchTimeOptions = batchTimes.map(bt => ({ value: bt.batchTimeGuid, label: bt.batchTime }))
  const batchOptions    = batches.map(b => ({ value: b.batchGuid, label: b.batchCode }))
  const feeOptions      = fees.map(f => ({ value: f.feeHdGuid, label: `${f.feeDesc} (${f.feeCode})` }))
  const exemptionOptions: Option[] = [{ value: '', label: '-- None (Pay Full Fee) --' }, ...exemptionTypes.map(e => ({ value: e.exemptionTypeGuid, label: e.label }))]
  const payTypeOptions  = paymentTypes.map(t => ({ value: String(t.intPaymentType), label: t.paymentTypeName }))
  const currencyOptions = currencies.map(c => ({ value: c.currencyGuid, label: c.currencyCode }))
  const bankOptions     = banks.map(b => ({ value: b.bankGuid, label: b.bankName }))
  const receiptBookOptions = receiptBooks.map(r => ({ value: r.receiptBookGuid, label: r.bookCode }))

  const isWaived = !!form.exemptionTypeGuid
  // Per Create.bru docs, bankGuid's requirement is tied only to payType > 1
  // — exemption only makes payType/amount/currencyGuid/exRate/receiptBookGuid
  // "not required", not forbidden. isBank previously also checked !isWaived,
  // which silently forced bankGuid to null on submit any time an exemption
  // was selected — even though the Bank Transfer Details section stayed
  // visible and let you pick one. Now reflects the actual Payment Method
  // selection regardless of waived status.
  const isBank   = Number(form.payType) > 1
  const selectedBankGuid = isBank ? (form.bankGuid || null) : null
  const showBankDetails = isBank

  // Fee Amount is manual-entry only — a first attempt tried to auto-fill it
  // from the selected Fee Structure's dropdown entry, but the real DTO
  // (confirmed via a live response) has no flat currency amount field, only
  // amtPer (a percentage of something unconfirmed), so there's nothing to
  // auto-fill from yet.

  const selectedCurrency = currencies.find(c => c.currencyGuid === form.currencyGuid)
  const exRate = selectedCurrency?.currencyCode === 'USD' ? Number(usdRate) || 1
    : selectedCurrency?.currencyCode === 'KES' ? Number(kesRate) || 1
    : 1

  function handleSubmit() {
    const missing: string[] = []
    if (!form.enquiryGuid) missing.push('Enquiry')
    if (!form.firstName) missing.push('First Name')
    if (!form.lastName) missing.push('Last Name')
    if (!form.phone) missing.push('Phone')
    if (!form.intakeGuid) missing.push('Intake')
    if (!form.countryGuid) missing.push('Country')
    if (!form.campusGuid) missing.push('Campus')
    if (!form.programGuid) missing.push('Programme')
    if (!form.semesterGuid) missing.push('Semester')
    if (!form.batchTimeGuid) missing.push('Batch Time')
    if (!form.batchGuid) missing.push('Batch')
    if (!form.feeHdGuid) missing.push('Fee Structure')
    if (!form.paymentDate) missing.push('Payment Date')
    if (!isWaived) {
      if (!form.payType) missing.push('Payment Method')
      if (!form.currencyGuid) missing.push('Currency')
      if (!form.receiptBookGuid) missing.push('Receipt Book')
      if (!form.feeAmount) missing.push('Application Fee Amount')
      if (isBank && !form.bankGuid) missing.push('Bank Name')
    }
    if (missing.length) {
      showToast(`Please fill: ${missing.join(', ')}`, 'error')
      return
    }

    createPayment.mutate(
      {
        enquiryGuid: form.enquiryGuid,
        oDelIntApplication: 0,
        studentName: `${form.firstName} ${form.lastName}`.trim(),
        intakeGuid: form.intakeGuid,
        campusGuid: form.campusGuid,
        programGuid: form.programGuid,
        semesterGuid: form.semesterGuid,
        batchGuid: form.batchGuid,
        batchTimeGuid: form.batchTimeGuid,
        feeHdGuid: form.feeHdGuid,
        countryGuid: form.countryGuid,
        mobile: form.phone.trim(),
        email: form.email.trim() || null,
        exemptionTypeGuid: form.exemptionTypeGuid || null,
        payDate: formatBruDate(form.paymentDate),
        payType: Number(form.payType || 1),
        amount: Number(form.feeAmount || 0),
        currencyGuid: form.currencyGuid || null,
        exRate: exRate || 1,
        bankGuid: selectedBankGuid,
        receiptBookGuid: form.receiptBookGuid || null,
        remarks: form.remarks.trim() || null,
        payProofFile,
      },
      {
        onSuccess: () => { setShowReceipt(true); showToast('Payment saved & receipt generated', 'success') },
        onError: (error: Error) => showToast(error.message || 'Failed to save payment. Please try again.', 'error'),
      },
    )
  }

  function handleClear() {
    setForm({ ...initialForm }); setShowReceipt(false); setPayProofFile(null)
  }

  return (
    <div id="page-payment" className="flex flex-col gap-0">

      {/* ── Sticky top: exchange bar + header + pipeline ── */}
      <div className="pmt-sticky-top">

        {/* Exchange rate bar */}
        <div className="card flex items-center gap-3 px-4 py-2.5 mb-4" style={{ flexWrap: 'wrap' }}>
          <i className="lni lni-protection text-b500" style={{ fontSize: 16, flexShrink: 0 }} />
          <span className="font-semibold text-g700" style={{ flexShrink: 0, fontSize: 'var(--fs-xs)' }}>Today&apos;s Exchange Rates</span>
          <span className="badge-green text-[11px] px-2 py-0.5 rounded-md font-semibold">Auto-fetched</span>
          <div className="flex items-center gap-1.5 ml-2">
            <span className="text-g500" style={{ fontSize: 'var(--fs-xs)' }}>1 USD =</span>
            <input className="ctrl text-center font-semibold" style={{ width: 70, padding: '3px 6px', fontSize: 13 }} value={usdRate} onChange={e => setUsdRate(e.target.value)} readOnly />
            <span className="badge-blue text-[11px] px-1.5 py-0.5 rounded font-bold">UGX</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-g500" style={{ fontSize: 'var(--fs-xs)' }}>1 KES =</span>
            <input className="ctrl text-center font-semibold" style={{ width: 70, padding: '3px 6px', fontSize: 13 }} value={kesRate} onChange={e => setKesRate(e.target.value)} readOnly />
            <span className="badge-blue text-[11px] px-1.5 py-0.5 rounded font-bold">UGX</span>
          </div>
          <span className="text-[11px] text-g400 ml-auto">Last updated: Today 08:30 AM</span>
          <button className="btn btn-neu btn-sm" style={{ gap: 5 }}>
            <i className="lni lni-reload" style={{ fontSize: 12 }} /> Refresh
          </button>
        </div>

        {/* Page header */}
        <div className="pg-hdr">
          <div>
            <div className="pg-title">Stage 1 · Application Payment</div>
            <div className="pg-sub">Collect application fee · Supports Cash &amp; Bank Transfer · Generates official receipt</div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button className="btn btn-neu btn-sm" onClick={() => router.push('/admission/dashboard')}>
              <i className="lni lni-arrow-left" /> Back
            </button>
            <button className="btn btn-neu btn-sm" onClick={() => openModal('import-source')}>
              <i className="lni lni-download" /> Import from Enquiry
            </button>
            <button className="btn btn-neu btn-sm" onClick={() => openModal('import-odel')}>
              <i className="lni lni-cloud-download" /> Import from ODel App
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => openModal('import-crm')}>
              <i className="lni lni-download" /> Import from CRM
            </button>
          </div>
        </div>

        {/* Pipeline */}
        <div className="pip-scroll-host">
          {canPipLeft && (
            <button className="tbl-arrow tbl-arrow-l" onClick={() => scrollPipeline('left')} aria-label="Scroll left">
              <i className="lni lni-chevron-left" />
            </button>
          )}
          <div className="pipeline" ref={pipelineRef} onScroll={checkPipelineScroll}>
            {PIPELINE.map((step, i) => (
              <React.Fragment key={step.label}>
                <div className={`pip-step${step.status ? ` ${step.status}` : ''}`}>
                  <div className="pip-circle">{i + 1}</div>
                  <div className="flex flex-col gap-0.5">
                    <span className="pip-label">{step.label}</span>
                    {step.desc && <span className="pip-desc">{step.desc}</span>}
                  </div>
                </div>
                {i < PIPELINE.length - 1 && <div className="pip-line" />}
              </React.Fragment>
            ))}
          </div>
          {canPipRight && (
            <button className="tbl-arrow tbl-arrow-r" onClick={() => scrollPipeline('right')} aria-label="Scroll right">
              <i className="lni lni-chevron-right" />
            </button>
          )}
        </div>
      </div>

      {/* ── Two-column layout ── */}
      <div className="g2">

        {/* Left — forms */}
        <div className="flex flex-col gap-5">

          {/* Section 1: Application Type & Candidate Info */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-g100">
              <i className="lni lni-clipboard text-b500" style={{ fontSize: 18 }} />
              <div className="card-title">Application Type &amp; Candidate Info</div>
            </div>

            <div className="g2 mb-4">
              <Field label="Enquiry" req>
                <SearchSelect options={enquiryOptions} value={form.enquiryGuid} placeholder="-- Select Enquiry --" onChange={v => set('enquiryGuid', v)} />
              </Field>
              <Field label="Intake" req>
                <SearchSelect options={intakeOptions} value={form.intakeGuid} placeholder="-- Select Intake --" onChange={v => set('intakeGuid', v)} />
              </Field>
              <Field label="Application Source" req>
                <SearchSelect options={SOURCES} value={form.source} onChange={v => set('source', v)} />
              </Field>
            </div>

            <p className="text-[10px] font-bold tracking-widest uppercase text-b500 mb-3">Candidate Details</p>

            <div className="prof-photo-row">
              <div className="prof-photo-zone">
                <div className="prof-photo-icon">
                  <i className="lni lni-camera" />
                  <small>PHOTO</small>
                </div>
                <input type="file" accept="image/jpeg,image/png" tabIndex={-1} />
              </div>
              <div>
                <p className="font-semibold text-g700" style={{ fontSize: 'var(--fs-sm)' }}>Profile Photo</p>
                <p className="text-g400 mt-0.5" style={{ fontSize: 'var(--fs-xs)' }}>Click the circle or drop a passport-style photo · JPG / PNG · max 2 MB</p>
              </div>
            </div>

            <div className="g2">
              <Field label="First Name" req>
                <input className="ctrl" placeholder="e.g. Sarah" value={form.firstName} onChange={e => set('firstName', e.target.value)} />
              </Field>
              <Field label="Last Name" req>
                <input className="ctrl" placeholder="e.g. Nakato" value={form.lastName} onChange={e => set('lastName', e.target.value)} />
              </Field>
              <Field label="Phone" req>
                <div className="flex gap-2">
                  <SearchSelect options={COUNTRY_CODES} value={form.phoneCode} onChange={v => set('phoneCode', v)} style={{ width: 108, flexShrink: 0 }} />
                  <input className="ctrl flex-1" placeholder="700 000 000" value={form.phone} onChange={e => set('phone', e.target.value)} />
                </div>
              </Field>
              <Field label="Email">
                <div className="inp-wrap">
                  <i className="inp-icon lni lni-envelope" />
                  <input className="ctrl" type="email" placeholder="applicant@email.com" value={form.email} onChange={e => set('email', e.target.value)} />
                </div>
              </Field>
              <Field label="Country" req>
                <SearchSelect options={countryOptions} value={form.countryGuid} placeholder="-- Select Country --" onChange={v => set('countryGuid', v)} />
              </Field>
              <Field label="Campus" req>
                <SearchSelect options={campusOptions} value={form.campusGuid} placeholder="-- Select Campus --" onChange={v => set('campusGuid', v)} />
              </Field>
              <Field label="Interested Programme" req>
                <SearchSelect options={programOptions} value={form.programGuid} placeholder="-- Select Programme --" onChange={setProgram} />
              </Field>
              <Field label="Fee Structure" req>
                <SearchSelect options={feeOptions} value={form.feeHdGuid} placeholder={form.programGuid ? '-- Select Fee Structure --' : '-- Select Programme First --'} onChange={v => set('feeHdGuid', v)} />
              </Field>
              <Field label="Semester" req>
                <SearchSelect options={semesterOptions} value={form.semesterGuid} placeholder={form.programGuid ? '-- Select Semester --' : '-- Select Programme First --'} onChange={setSemester} />
              </Field>
              <Field label="Batch Time" req>
                <SearchSelect options={batchTimeOptions} value={form.batchTimeGuid} placeholder="-- Select --" onChange={setBatchTime} />
              </Field>
              <Field label="Batch" req>
                <SearchSelect
                  options={batchOptions}
                  value={form.batchGuid}
                  placeholder={form.programGuid && form.semesterGuid && form.batchTimeGuid ? '-- Select Batch --' : '-- Select Programme, Semester & Batch Time First --'}
                  onChange={v => set('batchGuid', v)}
                />
              </Field>
            </div>
          </div>

          {/* Section 2: Payment Details */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-g100">
              <i className="lni lni-credit-cards text-b500" style={{ fontSize: 18 }} />
              <div className="card-title">Payment Details</div>
            </div>

            {isWaived && (
              <div className="flex items-center gap-2 mb-4 px-4 py-2.5 rounded-lg bg-clr-amber-bg border border-clr-amber-bd text-clr-amber" style={{ fontSize: 'var(--fs-sm)' }}>
                <i className="lni lni-warning" /> Fee exemption active: <strong>{labelFor(exemptionOptions, form.exemptionTypeGuid)}</strong>
              </div>
            )}

            <div className="g2 mb-4">
              <Field label="Exemption Type">
                <SearchSelect options={exemptionOptions} value={form.exemptionTypeGuid} onChange={v => set('exemptionTypeGuid', v)} />
              </Field>
              <Field label="Payment Method" req={!isWaived}>
                <SearchSelect options={payTypeOptions} value={form.payType} placeholder="-- Select Payment Method --" onChange={v => set('payType', v)} />
              </Field>
              <Field label="Receipt Book" req={!isWaived}>
                <SearchSelect options={receiptBookOptions} value={form.receiptBookGuid} placeholder="-- Select Receipt Book --" onChange={v => set('receiptBookGuid', v)} />
              </Field>
              <Field label="Receipt Type" req>
                <SearchSelect options={RECEIPT_TYPES} value={form.receiptType} onChange={v => set('receiptType', v)} />
              </Field>
            </div>

            {/* Fee amount display */}
            <div className="fg">
              <label className="lbl">Application Fee Amount <span className="req">*</span></label>
              <div className={`amt-display${isWaived ? ' waived' : ''}`}>
                <div className="flex-1">
                  <div className="amt-val-wrap">
                    <input
                      type="text"
                      inputMode="decimal"
                      pattern="[0-9.]*"
                      className="amt-val-input"
                      value={form.feeAmount}
                      onChange={e => set('feeAmount', e.target.value)}
                    />
                    <SearchSelect options={currencyOptions} value={form.currencyGuid} onChange={v => set('currencyGuid', v)}
                      style={{ width: 84, flexShrink: 0 }} />
                  </div>
                  <p className="amt-val-hint">
                    {isWaived ? 'Fee waived — exemption applied.' : 'Enter the application fee amount.'}
                  </p>
                  {isWaived && <p className="amt-waived-lbl">✓ WAIVED</p>}
                </div>
                <span className="badge-amber text-xs px-2 py-1 rounded-md font-bold">{selectedCurrency?.currencyCode ?? '—'}</span>
              </div>
            </div>

            <div className="g2 mt-4">
              <Field label="Receipt / Reference No.">
                <input className="ctrl" placeholder="e.g. REC-2026-001142" value={form.receiptNo} onChange={e => set('receiptNo', e.target.value)} />
              </Field>
              <Field label="Payment Date" req>
                <input className="ctrl" type="date" value={form.paymentDate} onChange={e => set('paymentDate', e.target.value)} />
              </Field>
            </div>

            <Field label="Receipt Upload" span2>
              <div className="file-zone">
                <input type="file" accept="image/*,.pdf" onChange={e => setPayProofFile(e.target.files?.[0] ?? null)} />
                <i className="lni lni-upload text-g400" style={{ fontSize: 20 }} />
                <span className="text-g500" style={{ fontSize: 'var(--fs-sm)' }}>
                  {payProofFile ? payProofFile.name : 'Click to upload or drag & drop a scanned receipt'}
                </span>
              </div>
            </Field>

            {showBankDetails && (
              <div className="mt-4 p-4 rounded-xl bg-g50 border border-g200">
                <h3 className="font-semibold text-g700 mb-3" style={{ fontSize: 'var(--fs-sm)' }}>Bank Transfer Details</h3>
                <Field label="Bank Name" req>
                  <select className="ctrl" value={form.bankGuid} onChange={e => set('bankGuid', e.target.value)}>
                    <option value="">Select bank</option>
                    {bankOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </Field>
              </div>
            )}

            <div className="fg mt-4">
              <label className="lbl">Remarks / Notes</label>
              <textarea className="ctrl" style={{ minHeight: 80, resize: 'vertical' }}
                placeholder="e.g. Sponsor name, special circumstances..."
                value={form.remarks} onChange={e => set('remarks', e.target.value)} />
            </div>

            <div className="flex items-center gap-3 mt-5 pt-4 border-t border-g100 flex-wrap">
              <button className="btn btn-neu btn-sm" onClick={() => router.push('/admission/dashboard')}>
                <i className="lni lni-close" /> Cancel / Close
              </button>
              <button className="btn btn-neu btn-sm" onClick={handleClear}>
                <i className="lni lni-reload" /> Clear
              </button>
              {permissions.add && (
                <button className="btn btn-primary ml-auto" disabled={createPayment.isPending} onClick={handleSubmit}>
                  <i className="lni lni-credit-cards" /> {createPayment.isPending ? 'Saving…' : 'Save Payment & Generate Receipt →'}
                </button>
              )}
            </div>
          </div>

          {/* Generated receipt */}
          {showReceipt && (
            <div className="card">
              <div className="flex items-center gap-2 mb-4">
                <i className="lni lni-ticket-alt text-clr-green" style={{ fontSize: 18 }} />
                <div className="card-title">Generated Receipt</div>
              </div>
              <div className="border border-g200 rounded-xl p-5 bg-g50">
                <div className="text-center mb-4 pb-3 border-b border-g200">
                  <h3 className="font-bold text-g900" style={{ fontSize: 'var(--fs-lg)' }}>ISBAT University</h3>
                  <p className="text-g500" style={{ fontSize: 'var(--fs-xs)' }}>Application Fee Receipt</p>
                </div>
                <div className="flex flex-col gap-1" style={{ fontSize: 'var(--fs-sm)' }}>
                  {[
                    ['Receipt No.', form.receiptNo || 'RCT-AUTO'],
                    ['Date', form.paymentDate || new Date().toLocaleDateString()],
                    ['Candidate', `${form.firstName} ${form.lastName}`.trim()],
                    ['Programme', labelFor(programOptions, form.programGuid)],
                    ['Campus', labelFor(campusOptions, form.campusGuid)],
                    ['Intake', labelFor(intakeOptions, form.intakeGuid)],
                    ['Amount', isWaived ? 'Waived' : `${form.feeAmount} ${selectedCurrency?.currencyCode ?? ''}`],
                    ['Method', isWaived ? 'Waived' : labelFor(payTypeOptions, form.payType)],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between py-1">
                      <span className="text-g500">{label}</span>
                      <span className={label === 'Amount' ? 'font-bold text-b600' : 'font-medium text-g700'}>{value || '—'}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-3 border-t border-dashed border-g300 text-center text-g400" style={{ fontSize: 'var(--fs-xs)' }}>
                  This is a computer-generated receipt. No signature required.
                </div>
              </div>
              <div className="flex items-center gap-3 mt-4 flex-wrap">
                <button className="btn btn-neu btn-sm"><i className="lni lni-printer" /> Print Receipt</button>
                <button className="btn btn-primary btn-sm ml-auto" onClick={() => router.push('/admission/filing')}>
                  Proceed to Filing <i className="lni lni-arrow-right" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right — Live Preview */}
        <div>
          <div className="card">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-g100">
              <div className="flex items-center gap-2">
                <i className="lni lni-eye text-b500" style={{ fontSize: 16 }} />
                <div className="card-title">Live Application Preview</div>
              </div>
              <span className="badge-green text-[11px] px-2 py-0.5 rounded-md font-semibold">Auto-updated</span>
            </div>

            <div className="flex flex-col gap-2">
              <PreviewRow label="Intake"            value={labelFor(intakeOptions, form.intakeGuid)} />
              <PreviewRow label="Application Source" value={form.source} />
              <PreviewRow label="First Name"         value={form.firstName} />
              <PreviewRow label="Last Name"          value={form.lastName} />
              <PreviewRow label="Phone"              value={form.phone ? `${form.phoneCode} ${form.phone}` : ''} />
              <PreviewRow label="Email"              value={form.email} />
              <PreviewRow label="Campus"             value={labelFor(campusOptions, form.campusGuid)} />
              <PreviewRow label="Programme"          value={labelFor(programOptions, form.programGuid)} />
              <PreviewRow label="Fee Structure"      value={labelFor(feeOptions, form.feeHdGuid)} />
              <PreviewRow label="Semester"           value={labelFor(semesterOptions, form.semesterGuid)} />
              <PreviewRow label="Batch Time"         value={labelFor(batchTimeOptions, form.batchTimeGuid)} />
              <PreviewRow label="Batch"              value={labelFor(batchOptions, form.batchGuid)} />
            </div>

            <hr className="border-g200 my-4" />

            <div className="flex flex-col gap-2">
              <div className="prev-row">
                <span className="prev-lbl">Fee Status</span>
                <span className="prev-sep">:</span>
                <span className="prev-val text-clr-green font-bold">
                  {isWaived ? 'Waived' : `${selectedCurrency?.currencyCode ?? ''} ${parseInt(form.feeAmount || '0').toLocaleString()}`}
                </span>
              </div>
              <div className="prev-row">
                <span className="prev-lbl">Receipt No.</span>
                <span className="prev-sep">:</span>
                <span className="prev-val">{form.receiptNo || '—'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ImportSourceModal isOpen={openModals.has('import-source')} onClose={() => closeModal('import-source')} showToast={showToast} />
      <ImportCrmModal isOpen={openModals.has('import-crm')} onClose={() => closeModal('import-crm')} showToast={showToast} />
      <ImportOdelModal isOpen={openModals.has('import-odel')} onClose={() => closeModal('import-odel')} showToast={showToast} />
      <Toast toast={toast} />
    </div>
  )
}
