'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Toast } from '@/components/Toast'
import { ImportSourceModal } from '@/components/modals/admission/ImportSourceModal'

const PIPELINE_STEPS = ['Application Payment', 'Document Filing', 'Vetting & Approval', 'Registration', 'Onboarding']
const INTAKES = ['Spring 2026', 'Fall 2026', 'Autumn 2025']
const SOURCES = ['Walk-in', 'From Enquiry', 'ODel', 'CRM', 'Staff Referral', 'Online']
const CAMPUSES = ['Main Campus', 'City Campus', 'Jinja Road Campus']
const PROGRAMMES = ['BSCS - Computer Science', 'BBA - Business Admin', 'BSIT - Information Technology', 'BEd - Education']
const FEE_STRUCTURES = ['Standard', 'International', 'Scholarship', 'Staff Discount']
const SEMESTERS = ['Semester 1', 'Semester 2', 'Semester 3']
const BATCH_TIMES = ['Morning', 'Afternoon', 'Evening', 'Weekend']
const EXEMPTIONS = ['None', 'HTC', 'Sponsorship', 'Existing Student']
const PAY_METHODS = ['Cash', 'Bank Transfer']
const RECEIPT_BOOKS = ['RB-2026-001', 'RB-2026-002', 'RB-2026-003']
const RECEIPT_TYPES = ['Original', 'Duplicate', 'Triplicate']
const BANKS = ['Stanbic Bank', 'DFCU Bank', 'Centenary Bank', 'Bank of Africa', 'Equity Bank']

interface FormData {
  intake: string; source: string; firstName: string; lastName: string
  phone: string; email: string; campus: string; programme: string
  feeStructure: string; semester: string; batchTime: string
  receiptBook: string; receiptType: string; feeAmount: string
  receiptNo: string; paymentDate: string; bankName: string
  bankRef: string; remarks: string
}

const initialForm: FormData = {
  intake: 'Spring 2026', source: 'Walk-in', firstName: '', lastName: '',
  phone: '', email: '', campus: '', programme: '', feeStructure: '',
  semester: '', batchTime: '', receiptBook: '', receiptType: '',
  feeAmount: '50000', receiptNo: '', paymentDate: '', bankName: '',
  bankRef: '', remarks: '',
}

function Field({ label, req, children }: { label: string; req?: boolean; children: React.ReactNode }) {
  return (
    <div className="fg flex flex-col gap-1">
      <label className="lbl text-xs font-medium text-g600">{label}{req && <span className="req text-red-500 ml-0.5">*</span>}</label>
      {children}
    </div>
  )
}

function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 px-3 rounded-lg odd:bg-g50">
      <span className="text-xs text-g500">{label}</span>
      <span className="text-sm font-medium text-g700 text-right truncate max-w-[60%]">{value || '--'}</span>
    </div>
  )
}

function ReceiptRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-g500">{label}</span>
      <span className={highlight ? 'font-bold text-b600' : 'font-medium text-g700'}>{value || '--'}</span>
    </div>
  )
}

export default function PaymentPage() {
  const router = useRouter()
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)
  const [openModals, setOpenModals] = useState<Set<string>>(new Set())
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank'>('cash')
  const [exemptionType, setExemptionType] = useState('')
  const [showReceipt, setShowReceipt] = useState(false)
  const [formData, setFormData] = useState<FormData>({ ...initialForm })

  function showToast(msg: string, type = '') { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }
  function openModal(id: string) { setOpenModals(prev => new Set(prev).add(id)) }
  function closeModal(id: string) { setOpenModals(prev => { const s = new Set(prev); s.delete(id); return s }) }

  const set = (key: keyof FormData, val: string) => setFormData(prev => ({ ...prev, [key]: val }))

  const handleSubmit = () => {
    if (!formData.firstName || !formData.lastName || !formData.phone) {
      showToast('Please fill all required fields', 'error'); return
    }
    setShowReceipt(true)
    showToast('Payment saved & receipt generated', 'success')
  }

  const handleClear = () => { setFormData({ ...initialForm }); setShowReceipt(false) }

  return (
    <div className="flex flex-col gap-5">
      <div className="sticky top-0 z-30 flex items-center gap-4 rounded-xl bg-b50 border border-b200 px-5 py-3 shadow-sm">
        <span className="text-xs font-semibold text-g600 uppercase tracking-wide">Today&apos;s Exchange Rates</span>
        <span className="badge bg-clr-green-bg text-clr-green border-clr-green-bd text-[11px] px-2 py-0.5 rounded-md">Auto-fetched</span>
        <div className="flex items-center gap-2 ml-auto">
          <label className="text-xs text-g500">USD</label>
          <input className="ctrl w-20 text-center text-sm" value="3720" readOnly />
          <label className="text-xs text-g500">KES</label>
          <input className="ctrl w-20 text-center text-sm" value="28.5" readOnly />
          <span className="badge bg-b100 text-b700 text-[11px] px-2 py-0.5 rounded-md">UGX</span>
        </div>
        <span className="text-[11px] text-g400">Last updated: 09:15 AM</span>
        <button className="btn btn-sm bg-b500 text-white px-3 py-1.5 rounded-lg text-xs">
          <i className="lni lni-reload mr-1" /> Refresh
        </button>
      </div>

      <div className="pg-hdr flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-g800">Stage 1 &middot; Application Payment</h1>
          <p className="text-sm text-g500 mt-1">Collect the 50,000 UGX application fee and generate a receipt for the candidate.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button className="btn bg-g100 text-g700 px-4 py-2 rounded-lg text-sm" onClick={() => router.push('/admission/dashboard')}>
            <i className="lni lni-arrow-left mr-1" /> Back
          </button>
          <button className="btn bg-b500 text-white px-4 py-2 rounded-lg text-sm" onClick={() => openModal('import-source-modal')}>
            <i className="lni lni-download mr-1" /> Import from Enquiry
          </button>
          <button className="btn bg-clr-cyan-bg text-clr-cyan border border-clr-cyan-bd px-4 py-2 rounded-lg text-sm">
            <i className="lni lni-cloud-download mr-1" /> Import from ODel App
          </button>
          <button className="btn bg-clr-purple-bg text-clr-purple border border-clr-purple-bd px-4 py-2 rounded-lg text-sm">
            <i className="lni lni-users mr-1" /> Import from CRM
          </button>
        </div>
      </div>

      <div className="pipeline flex items-center gap-0">
        {PIPELINE_STEPS.map((step, i) => (
          <div key={step} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${i === 0 ? 'bg-b500 text-white' : 'bg-g100 text-g500'}`}>
            <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${i === 0 ? 'bg-white text-b600' : 'bg-g200 text-g500'}`}>{i + 1}</span>
            {step}
            {i < PIPELINE_STEPS.length - 1 && <i className="lni lni-chevron-right text-g300 ml-2" />}
          </div>
        ))}
      </div>

      <div className="g2 grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="flex flex-col gap-5">
          <div className="card rounded-2xl bg-white border border-g200 p-5">
            <h2 className="text-base font-semibold text-g800 mb-4">Application Type &amp; Candidate Info</h2>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Intake" req>
                <select className="ctrl w-full" value={formData.intake} onChange={e => set('intake', e.target.value)}>{INTAKES.map(v => <option key={v}>{v}</option>)}</select>
              </Field>
              <Field label="Application Source" req>
                <select className="ctrl w-full" value={formData.source} onChange={e => set('source', e.target.value)}>{SOURCES.map(v => <option key={v}>{v}</option>)}</select>
              </Field>
            </div>
            <div className="prof-photo-zone flex items-center gap-4 my-4 p-4 border-2 border-dashed border-g200 rounded-xl bg-g50 cursor-pointer hover:border-b400 transition-colors">
              <div className="w-16 h-16 rounded-full bg-g200 flex items-center justify-center text-g400"><i className="lni lni-camera text-xl" /></div>
              <div>
                <p className="text-sm font-medium text-g600">Upload Profile Photo</p>
                <p className="text-xs text-g400">Click or drag &amp; drop (JPG, PNG, max 2 MB)</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="First Name" req><input className="ctrl w-full" placeholder="Enter first name" value={formData.firstName} onChange={e => set('firstName', e.target.value)} /></Field>
              <Field label="Last Name" req><input className="ctrl w-full" placeholder="Enter last name" value={formData.lastName} onChange={e => set('lastName', e.target.value)} /></Field>
              <Field label="Phone" req><input className="ctrl w-full" placeholder="+256 7XX XXX XXX" value={formData.phone} onChange={e => set('phone', e.target.value)} /></Field>
              <Field label="Email"><input className="ctrl w-full" type="email" placeholder="candidate@email.com" value={formData.email} onChange={e => set('email', e.target.value)} /></Field>
              <Field label="Campus" req>
                <select className="ctrl w-full" value={formData.campus} onChange={e => set('campus', e.target.value)}><option value="">Select campus</option>{CAMPUSES.map(v => <option key={v}>{v}</option>)}</select>
              </Field>
              <Field label="Programme" req>
                <select className="ctrl w-full" value={formData.programme} onChange={e => set('programme', e.target.value)}><option value="">Select programme</option>{PROGRAMMES.map(v => <option key={v}>{v}</option>)}</select>
              </Field>
              <Field label="Fee Structure">
                <select className="ctrl w-full" value={formData.feeStructure} onChange={e => set('feeStructure', e.target.value)}><option value="">Select structure</option>{FEE_STRUCTURES.map(v => <option key={v}>{v}</option>)}</select>
              </Field>
              <Field label="Semester">
                <select className="ctrl w-full" value={formData.semester} onChange={e => set('semester', e.target.value)}><option value="">Select semester</option>{SEMESTERS.map(v => <option key={v}>{v}</option>)}</select>
              </Field>
              <Field label="Batch Time">
                <select className="ctrl w-full" value={formData.batchTime} onChange={e => set('batchTime', e.target.value)}><option value="">Select batch</option>{BATCH_TIMES.map(v => <option key={v}>{v}</option>)}</select>
              </Field>
            </div>
          </div>

          <div className="card rounded-2xl bg-white border border-g200 p-5">
            <h2 className="text-base font-semibold text-g800 mb-4">Payment Details</h2>
            {exemptionType && exemptionType !== 'None' && (
              <div className="flex items-center gap-2 mb-4 px-4 py-2.5 rounded-lg bg-clr-amber-bg border border-clr-amber-bd text-sm text-clr-amber">
                <i className="lni lni-warning" /> Fee exemption active: <strong>{exemptionType}</strong>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <Field label="Exemption Type">
                <select className="ctrl w-full" value={exemptionType} onChange={e => setExemptionType(e.target.value)}>{EXEMPTIONS.map(v => <option key={v}>{v}</option>)}</select>
              </Field>
              <Field label="Payment Method" req>
                <select className="ctrl w-full" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as 'cash' | 'bank')}>{PAY_METHODS.map(v => <option key={v} value={v === 'Cash' ? 'cash' : 'bank'}>{v}</option>)}</select>
              </Field>
              <Field label="Receipt Book" req>
                <select className="ctrl w-full" value={formData.receiptBook} onChange={e => set('receiptBook', e.target.value)}><option value="">Select book</option>{RECEIPT_BOOKS.map(v => <option key={v}>{v}</option>)}</select>
              </Field>
              <Field label="Receipt Type">
                <select className="ctrl w-full" value={formData.receiptType} onChange={e => set('receiptType', e.target.value)}><option value="">Select type</option>{RECEIPT_TYPES.map(v => <option key={v}>{v}</option>)}</select>
              </Field>
              <Field label="Fee Amount (UGX)">
                <div className="relative">
                  <input className="ctrl w-full" value={formData.feeAmount} onChange={e => set('feeAmount', e.target.value)} />
                  {exemptionType && exemptionType !== 'None' && (
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] bg-clr-amber-bg text-clr-amber px-2 py-0.5 rounded">Waived</span>
                  )}
                </div>
              </Field>
              <Field label="Receipt / Reference No." req><input className="ctrl w-full" placeholder="e.g. RCT-000123" value={formData.receiptNo} onChange={e => set('receiptNo', e.target.value)} /></Field>
              <Field label="Payment Date" req><input className="ctrl w-full" type="date" value={formData.paymentDate} onChange={e => set('paymentDate', e.target.value)} /></Field>
            </div>
            {paymentMethod === 'bank' && (
              <div className="mt-4 p-4 rounded-xl bg-g50 border border-g200">
                <h3 className="text-sm font-semibold text-g700 mb-3">Bank Transfer Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Bank Name" req>
                    <select className="ctrl w-full" value={formData.bankName} onChange={e => set('bankName', e.target.value)}><option value="">Select bank</option>{BANKS.map(v => <option key={v}>{v}</option>)}</select>
                  </Field>
                  <Field label="Bank Transaction Ref" req><input className="ctrl w-full" placeholder="TXN-XXXXXXX" value={formData.bankRef} onChange={e => set('bankRef', e.target.value)} /></Field>
                  <div className="col-span-2">
                    <label className="lbl text-xs font-medium text-g600 mb-1 block">Bank Deposit Slip</label>
                    <div className="flex items-center gap-3 p-3 border-2 border-dashed border-g200 rounded-lg bg-white cursor-pointer hover:border-b400 transition-colors">
                      <i className="lni lni-upload text-g400" /><span className="text-sm text-g500">Click to upload or drag &amp; drop</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div className="mt-4">
              <label className="lbl text-xs font-medium text-g600 mb-1 block">Remarks</label>
              <textarea className="ctrl w-full min-h-[80px] resize-y" placeholder="Optional notes..." value={formData.remarks} onChange={e => set('remarks', e.target.value)} />
            </div>
            <div className="flex items-center gap-3 mt-5 pt-4 border-t border-g100">
              <button className="btn bg-g100 text-g600 px-5 py-2.5 rounded-lg text-sm" onClick={() => router.push('/admission/dashboard')}>Cancel / Close</button>
              <button className="btn bg-clr-amber-bg text-clr-amber border border-clr-amber-bd px-5 py-2.5 rounded-lg text-sm" onClick={handleClear}><i className="lni lni-trash-can mr-1" /> Clear</button>
              <button className="btn bg-b500 text-white px-5 py-2.5 rounded-lg text-sm ml-auto" onClick={handleSubmit}><i className="lni lni-checkmark mr-1" /> Save Payment &amp; Generate Receipt</button>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <div className="card rounded-2xl bg-white border border-g200 p-5">
            <h2 className="text-base font-semibold text-g800 mb-4"><i className="lni lni-eye mr-2 text-b500" />Live Application Preview</h2>
            <div className="flex flex-col gap-2">
              <PreviewRow label="Intake" value={formData.intake} />
              <PreviewRow label="Source" value={formData.source} />
              <PreviewRow label="Name" value={`${formData.firstName} ${formData.lastName}`.trim() || '--'} />
              <PreviewRow label="Phone" value={formData.phone} />
              <PreviewRow label="Email" value={formData.email} />
              <PreviewRow label="Campus" value={formData.campus} />
              <PreviewRow label="Programme" value={formData.programme} />
              <PreviewRow label="Fee Structure" value={formData.feeStructure} />
              <PreviewRow label="Semester" value={formData.semester} />
              <PreviewRow label="Batch Time" value={formData.batchTime} />
              <PreviewRow label="Exemption" value={exemptionType || 'None'} />
              <PreviewRow label="Payment Method" value={paymentMethod === 'cash' ? 'Cash' : 'Bank Transfer'} />
              <PreviewRow label="Fee Amount" value={`${formData.feeAmount} UGX`} />
              <PreviewRow label="Receipt No." value={formData.receiptNo} />
              <PreviewRow label="Payment Date" value={formData.paymentDate} />
              {paymentMethod === 'bank' && (<><PreviewRow label="Bank" value={formData.bankName} /><PreviewRow label="Bank Ref" value={formData.bankRef} /></>)}
              <PreviewRow label="Remarks" value={formData.remarks} />
            </div>
          </div>

          {showReceipt && (
            <div className="card rounded-2xl bg-white border border-g200 p-5">
              <h2 className="text-base font-semibold text-g800 mb-4"><i className="lni lni-ticket-alt mr-2 text-clr-green" />Generated Receipt</h2>
              <div className="border border-g200 rounded-xl p-5 bg-g50">
                <div className="text-center mb-4 pb-3 border-b border-g200">
                  <h3 className="text-lg font-bold text-g800">ISBAT University</h3>
                  <p className="text-xs text-g500">Application Fee Receipt</p>
                </div>
                <div className="flex flex-col gap-2 text-sm">
                  <ReceiptRow label="Receipt No." value={formData.receiptNo || 'RCT-AUTO'} />
                  <ReceiptRow label="Date" value={formData.paymentDate || new Date().toLocaleDateString()} />
                  <ReceiptRow label="Candidate" value={`${formData.firstName} ${formData.lastName}`.trim()} />
                  <ReceiptRow label="Programme" value={formData.programme} />
                  <ReceiptRow label="Campus" value={formData.campus} />
                  <ReceiptRow label="Intake" value={formData.intake} />
                  <ReceiptRow label="Amount" value={`${formData.feeAmount} UGX`} highlight />
                  <ReceiptRow label="Method" value={paymentMethod === 'cash' ? 'Cash' : 'Bank Transfer'} />
                  {paymentMethod === 'bank' && <ReceiptRow label="Bank Ref" value={formData.bankRef} />}
                  {exemptionType && exemptionType !== 'None' && <ReceiptRow label="Exemption" value={exemptionType} />}
                </div>
                <div className="mt-4 pt-3 border-t border-dashed border-g300 text-center text-xs text-g400">This is a computer-generated receipt. No signature required.</div>
              </div>
              <div className="flex items-center gap-3 mt-4">
                <button className="btn bg-g100 text-g600 px-4 py-2 rounded-lg text-sm"><i className="lni lni-printer mr-1" /> Print Receipt</button>
                <button className="btn bg-b500 text-white px-4 py-2 rounded-lg text-sm ml-auto" onClick={() => router.push('/admission/filing')}>Proceed to Filing <i className="lni lni-arrow-right ml-1" /></button>
              </div>
            </div>
          )}
        </div>
      </div>

      <ImportSourceModal isOpen={openModals.has('import-source-modal')} onClose={() => closeModal('import-source-modal')} showToast={showToast} />
      <Toast toast={toast} />
    </div>
  )
}
