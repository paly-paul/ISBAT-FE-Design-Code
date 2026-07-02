'use client'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Toast } from '@/components/Toast'
import { ImportSourceModal } from '@/components/modals/admission/ImportSourceModal'
import { SearchSelect } from '@/components/SearchSelect'

const PIPELINE = [
  { label: 'App. Payment',  desc: 'Current step', status: 'active' },
  { label: 'App. Filing',   desc: 'Next step',    status: '' },
  { label: 'Vetting',       desc: '',              status: '' },
  { label: 'Reg. Payment',  desc: '',              status: '' },
  { label: 'Registration',  desc: '',              status: '' },
]

const INTAKES       = ['Spring 2026 (20261)', 'Fall 2026 (20262)', 'Autumn 2025 (20253)']
const SOURCES       = ['Walk-in (Direct)', 'From Enquiry', 'ODel Online App.', 'CRM (Merito)', 'Staff Referral', 'Online Enquiry']
const CAMPUSES      = ['Main Campus', 'City Campus', 'Jinja Road Campus']
const PROGRAMMES    = ['BSc. Computer Science', 'MBA Business Admin', 'BSc. Information Technology', 'Diploma in Nursing', 'BCom. Accounting', 'BEng. Civil Engineering']
const FEE_STRUCTURES = ['Standard', 'International', 'Scholarship', 'Staff Discount']
const SEMESTERS     = ['Semester 1', 'Semester 2', 'Semester 3']
const BATCH_TIMES   = ['Morning', 'Afternoon', 'Evening', 'Weekend']
const EXEMPTIONS    = ['-- None (Pay Full Fee) --', 'HTC Waiver', 'Sponsorship', 'Existing Student']
const PAY_METHODS   = ['Cash', 'Bank Transfer']
const RECEIPT_BOOKS = ['RB-2026-001', 'RB-2026-002', 'RB-2026-003']
const RECEIPT_TYPES = ['Official Receipt', 'Duplicate', 'Triplicate']
const BANKS         = ['Stanbic Bank', 'DFCU Bank', 'Centenary Bank', 'Bank of Africa', 'Equity Bank']

interface FormData {
  intake: string; source: string; firstName: string; lastName: string
  phone: string; email: string; campus: string; programme: string
  feeStructure: string; semester: string; batchTime: string
  exemption: string; payMethod: string
  receiptBook: string; receiptType: string; feeAmount: string
  receiptNo: string; paymentDate: string
  bankName: string; bankRef: string; remarks: string
}

const initialForm: FormData = {
  intake: 'Spring 2026 (20261)', source: 'Walk-in (Direct)',
  firstName: '', lastName: '', phone: '', email: '',
  campus: '', programme: '', feeStructure: '', semester: '', batchTime: '',
  exemption: '-- None (Pay Full Fee) --', payMethod: 'Cash',
  receiptBook: '', receiptType: 'Official Receipt', feeAmount: '50000',
  receiptNo: '', paymentDate: '',
  bankName: '', bankRef: '', remarks: '',
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
  const [toast, setToast]       = useState<{ msg: string; type: string } | null>(null)
  const [openModals, setOpenModals] = useState<Set<string>>(new Set())
  const [showReceipt, setShowReceipt] = useState(false)
  const [form, setForm]         = useState<FormData>({ ...initialForm })

  function showToast(msg: string, type = '') { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }
  function openModal(id: string)  { setOpenModals(prev => new Set(prev).add(id)) }
  function closeModal(id: string) { setOpenModals(prev => { const s = new Set(prev); s.delete(id); return s }) }

  const set = (k: keyof FormData, v: string) => setForm(prev => ({ ...prev, [k]: v }))
  const isWaived = form.exemption !== '-- None (Pay Full Fee) --'
  const isBank   = form.payMethod === 'Bank Transfer'

  function handleSubmit() {
    if (!form.firstName || !form.lastName || !form.phone) {
      showToast('Please fill all required fields', 'error'); return
    }
    setShowReceipt(true)
    showToast('Payment saved & receipt generated', 'success')
  }

  function handleClear() { setForm({ ...initialForm }); setShowReceipt(false) }

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
            <input className="ctrl text-center font-semibold" style={{ width: 70, padding: '3px 6px', fontSize: 13 }} defaultValue="3720" readOnly />
            <span className="badge-blue text-[11px] px-1.5 py-0.5 rounded font-bold">UGX</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-g500" style={{ fontSize: 'var(--fs-xs)' }}>1 KES =</span>
            <input className="ctrl text-center font-semibold" style={{ width: 70, padding: '3px 6px', fontSize: 13 }} defaultValue="28.5" readOnly />
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
            <div className="pg-sub">Collect 50,000 UGX application fee · Supports Cash &amp; Bank Transfer · Generates official receipt</div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button className="btn btn-neu btn-sm" onClick={() => router.push('/admission/dashboard')}>
              <i className="lni lni-arrow-left" /> Back
            </button>
            <button className="btn btn-neu btn-sm" onClick={() => openModal('import-source')}>
              <i className="lni lni-download" /> Import from Enquiry
            </button>
            <button className="btn btn-neu btn-sm">
              <i className="lni lni-cloud-download" /> Import from ODel App
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => openModal('import-source')}>
              <i className="lni lni-download" /> Import from CRM
            </button>
          </div>
        </div>

        {/* Pipeline */}
        <div className="pipeline">
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
              <Field label="Intake" req>
                <SearchSelect options={INTAKES} value={form.intake} onChange={v => set('intake', v)} />
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
                <div className="inp-wrap">
                  <i className="inp-icon lni lni-phone" />
                  <input className="ctrl" placeholder="+256 700 000 000" value={form.phone} onChange={e => set('phone', e.target.value)} />
                </div>
              </Field>
              <Field label="Email">
                <div className="inp-wrap">
                  <i className="inp-icon lni lni-envelope" />
                  <input className="ctrl" type="email" placeholder="applicant@email.com" value={form.email} onChange={e => set('email', e.target.value)} />
                </div>
              </Field>
              <Field label="Campus" req>
                <SearchSelect options={CAMPUSES} value={form.campus} placeholder="-- Select Campus --" onChange={v => set('campus', v)} />
              </Field>
              <Field label="Interested Programme" req>
                <SearchSelect options={PROGRAMMES} value={form.programme} placeholder="-- Select Campus First --" onChange={v => set('programme', v)} />
              </Field>
              <Field label="Fee Structure" req>
                <SearchSelect options={FEE_STRUCTURES} value={form.feeStructure} placeholder="-- Auto-loaded --" onChange={v => set('feeStructure', v)} />
              </Field>
              <Field label="Semester" req>
                <SearchSelect options={SEMESTERS} value={form.semester} placeholder="-- Select Semester --" onChange={v => set('semester', v)} />
              </Field>
              <Field label="Batch Time" req>
                <SearchSelect options={BATCH_TIMES} value={form.batchTime} placeholder="-- Select --" onChange={v => set('batchTime', v)} />
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
                <i className="lni lni-warning" /> Fee exemption active: <strong>{form.exemption}</strong>
              </div>
            )}

            <div className="g2 mb-4">
              <Field label="Exemption Type">
                <SearchSelect options={EXEMPTIONS} value={form.exemption} onChange={v => set('exemption', v)} />
              </Field>
              <Field label="Payment Method" req>
                <SearchSelect options={PAY_METHODS} value={form.payMethod} onChange={v => set('payMethod', v)} />
              </Field>
              <Field label="Receipt Book" req>
                <SearchSelect options={RECEIPT_BOOKS} value={form.receiptBook} placeholder="-- Select Receipt Book --" onChange={v => set('receiptBook', v)} />
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
                      type="number"
                      className="amt-val-input"
                      value={form.feeAmount}
                      onChange={e => set('feeAmount', e.target.value)}
                      disabled={isWaived}
                    />
                    <span className="amt-val-cur">UGX</span>
                  </div>
                  <p className="amt-val-hint">
                    {isWaived ? 'Fee waived — exemption applied.' : 'Default 50,000 UGX — edit if a different fee applies.'}
                  </p>
                  {isWaived && <p className="amt-waived-lbl">✓ WAIVED</p>}
                </div>
                <span className="badge-amber text-xs px-2 py-1 rounded-md font-bold">UGX</span>
              </div>
            </div>

            <div className="g2 mt-4">
              <Field label="Receipt / Reference No." req>
                <input className="ctrl" placeholder="e.g. REC-2026-001142" value={form.receiptNo} onChange={e => set('receiptNo', e.target.value)} />
              </Field>
              <Field label="Payment Date" req>
                <input className="ctrl" type="date" value={form.paymentDate} onChange={e => set('paymentDate', e.target.value)} />
              </Field>
            </div>

            {isBank && (
              <div className="mt-4 p-4 rounded-xl bg-g50 border border-g200">
                <h3 className="font-semibold text-g700 mb-3" style={{ fontSize: 'var(--fs-sm)' }}>Bank Transfer Details</h3>
                <div className="g2">
                  <Field label="Bank Name" req>
                    <SearchSelect options={BANKS} value={form.bankName} placeholder="Select bank" onChange={v => set('bankName', v)} />
                  </Field>
                  <Field label="Bank Transaction Ref" req>
                    <input className="ctrl" placeholder="TXN-XXXXXXX" value={form.bankRef} onChange={e => set('bankRef', e.target.value)} />
                  </Field>
                  <Field label="Bank Deposit Slip" span2>
                    <div className="file-zone">
                      <i className="lni lni-upload text-g400" style={{ fontSize: 20 }} />
                      <span className="text-g500" style={{ fontSize: 'var(--fs-sm)' }}>Click to upload or drag &amp; drop</span>
                    </div>
                  </Field>
                </div>
              </div>
            )}

            <div className="fg mt-4">
              <label className="lbl">Remarks / Notes</label>
              <textarea className="ctrl" style={{ minHeight: 80, resize: 'vertical' }}
                placeholder="e.g. Sponsor name, special circumstances..."
                value={form.remarks} onChange={e => set('remarks', e.target.value)} />
            </div>

            <div className="flex items-center gap-3 mt-5 pt-4 border-t border-g100">
              <button className="btn btn-neu btn-sm" onClick={() => router.push('/admission/dashboard')}>
                <i className="lni lni-close" /> Cancel / Close
              </button>
              <button className="btn btn-neu btn-sm" onClick={handleClear}>
                <i className="lni lni-reload" /> Clear
              </button>
              <button className="btn btn-primary ml-auto" onClick={handleSubmit}>
                <i className="lni lni-credit-cards" /> Save Payment &amp; Generate Receipt →
              </button>
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
                    ['Programme', form.programme],
                    ['Campus', form.campus],
                    ['Intake', form.intake],
                    ['Amount', `${form.feeAmount} UGX`],
                    ['Method', form.payMethod],
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
              <div className="flex items-center gap-3 mt-4">
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
              <PreviewRow label="Intake"            value={form.intake} />
              <PreviewRow label="Application Source" value={form.source} />
              <PreviewRow label="First Name"         value={form.firstName} />
              <PreviewRow label="Last Name"          value={form.lastName} />
              <PreviewRow label="Phone"              value={form.phone} />
              <PreviewRow label="Email"              value={form.email} />
              <PreviewRow label="Campus"             value={form.campus} />
              <PreviewRow label="Programme"          value={form.programme} />
              <PreviewRow label="Fee Structure"      value={form.feeStructure} />
              <PreviewRow label="Semester"           value={form.semester} />
              <PreviewRow label="Batch Time"         value={form.batchTime} />
            </div>

            <hr className="border-g200 my-4" />

            <div className="flex flex-col gap-2">
              <div className="prev-row">
                <span className="prev-lbl">Fee Status</span>
                <span className="prev-sep">:</span>
                <span className="prev-val text-clr-green font-bold">
                  {isWaived ? 'Waived' : `UGX ${parseInt(form.feeAmount || '0').toLocaleString()}`}
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
      <Toast toast={toast} />
    </div>
  )
}
