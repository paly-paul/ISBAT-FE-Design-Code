'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SearchSelect } from '@/components/SearchSelect'
import { SuccessPopup } from '@/components/modals/academic/SuccessPopup'
import { FailurePopup } from '@/components/modals/academic/FailurePopup'
import { useIntakes } from '@/hooks/academic/useIntakes'
import { useCampuses } from '@/hooks/config/useCampuses'
import { useProgramMasters } from '@/hooks/academic/useProgramMaster'
import { useEnquirySourceMasters } from '@/hooks/admission/useEnquirySourceMasters'
import { useCreateEnquiry } from '@/hooks/admission/useEnquiries'
import { usePagePermissions } from '@/hooks/users/usePagePermissions'
import { AuthError } from '@/lib/api/client'
import { sanitizePhoneInput } from '@/lib/errorMessages'

// Today's date at midnight, formatted the same way the confirmed payload
// sample uses (no timezone offset) — matches enquiryDate/dob's "T00:00:00" shape.
function todayAtMidnight() {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}T00:00:00`
}

export default function OnDeskEnquiryPage() {
  const router = useRouter()
  const permissions = usePagePermissions()
  const [saved, setSaved] = useState(false)
  const [failure, setFailure] = useState<string | null>(null)

  const { data: intakes = [] }        = useIntakes()
  const { data: campuses = [] }       = useCampuses()
  const { data: programs = [] }       = useProgramMasters()
  const { data: enquirySources = [] } = useEnquirySourceMasters()
  const createEnquiry = useCreateEnquiry()

  const intakeOptions  = intakes.map(i => ({ value: i.intakeGuid, label: `${i.intakeCode} — ${i.description}` }))
  const campusOptions  = campuses.map(c => ({ value: c.campusGuid, label: c.campusName }))
  const programOptions = programs.map(p => ({ value: p.programGuid, label: `${p.programName} (${p.programCode})` }))
  const sourceOptions  = enquirySources.map(s => ({ value: s.enquirySourceGuid, label: s.enquirySourceName }))

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName]   = useState('')
  const [phone, setPhone]         = useState('')
  const [email, setEmail]         = useState('')
  const [dob, setDob]             = useState('')
  const [enquiryDate, setEnquiryDate] = useState(() => todayAtMidnight().slice(0, 10))
  const [intakeGuid, setIntakeGuid]   = useState('')
  const [campusGuid, setCampusGuid]   = useState('')
  const [programGuid, setProgramGuid] = useState('')
  const [sourceGuid, setSourceGuid]   = useState('')
  const [notes, setNotes]         = useState('')
  const [errors, setErrors]       = useState<Record<string, string>>({})

  function clearError(field: string) {
    setErrors(prev => (prev[field] ? { ...prev, [field]: '' } : prev))
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!firstName.trim()) e.firstName = 'First Name is required'
    if (!lastName.trim())  e.lastName  = 'Last Name is required'
    if (!phone.trim())     e.phone     = 'Phone is required'
    if (!email.trim())     e.email     = 'Email is required'
    if (!dob)               e.dob       = 'Date of Birth is required'
    if (!enquiryDate)       e.enquiryDate = 'Enquiry Date is required'
    if (!intakeGuid)        e.intakeGuid = 'Please select an Intake'
    if (!campusGuid)        e.campusGuid = 'Please select a Campus'
    if (!sourceGuid)        e.sourceGuid = 'Please select an Enquiry Source'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function resetForm() {
    setFirstName(''); setLastName(''); setPhone(''); setEmail(''); setDob('')
    setEnquiryDate(todayAtMidnight().slice(0, 10))
    setIntakeGuid(''); setCampusGuid(''); setProgramGuid(''); setSourceGuid(''); setNotes('')
    setErrors({})
  }

  function handleSave() {
    if (!validate()) return
    const selectedSource = enquirySources.find(s => s.enquirySourceGuid === sourceGuid)
    createEnquiry.mutate(
      {
        intakeGuid,
        campusGuid,
        enquirySourceGuid: sourceGuid,
        studentName: `${firstName.trim()} ${lastName.trim()}`.trim(),
        enquiryDate: `${enquiryDate}T00:00:00`,
        mobile: phone.trim(),
        email: email.trim() || null,
        countryCode: 'UG',
        dob: `${dob}T00:00:00`,
        remarks: notes.trim() || null,
        programGuid: programGuid || null,
        // No Isbat Enquiry Source picker on this form yet — see the note in
        // lib/api/admission/enquiry.ts.
        isbatSourceGuid: null,
        sourceName: selectedSource?.enquirySourceName ?? null,
        enquiryTag: null,
      },
      {
        onSuccess: () => setSaved(true),
        onError: (error: Error) => {
          const code = error instanceof AuthError ? error.code : undefined
          setFailure(error.message || `Failed to save enquiry${code ? ` (${code})` : ''}. Please try again.`)
        },
      },
    )
  }

  function handleSavedClose() {
    setSaved(false)
    resetForm()
  }

  return (
    <div id="page-ondesk-enquiry">
      <div className="pg-hdr">
        <div>
          <h1 className="text-xl font-semibold text-g900">On-Desk Enquiry Form</h1>
          <p className="text-sm text-g500 mt-0.5">Information Desk — captured by staff during walk-in / phone conversation</p>
        </div>
        <button className="btn btn-ghost" onClick={() => router.push('/admission/enquiry-list')}><i className="lni lni-arrow-left" /> Enquiry List</button>
      </div>

      <div className="card max-w-3xl">
        <div className="g2">
          <div className="fg">
            <label className="lbl">First Name <span className="text-clr-red">*</span></label>
            <input className="ctrl" placeholder="e.g. Brian" value={firstName} onChange={e => { setFirstName(e.target.value); clearError('firstName') }} style={errors.firstName ? { borderColor: 'var(--red)' } : undefined} />
            {errors.firstName && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.firstName}</p>}
          </div>
          <div className="fg">
            <label className="lbl">Last Name <span className="text-clr-red">*</span></label>
            <input className="ctrl" placeholder="e.g. Kamya" value={lastName} onChange={e => { setLastName(e.target.value); clearError('lastName') }} style={errors.lastName ? { borderColor: 'var(--red)' } : undefined} />
            {errors.lastName && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.lastName}</p>}
          </div>
          <div className="fg">
            <label className="lbl">Phone <span className="text-clr-red">*</span></label>
            <input className="ctrl" type="tel" inputMode="numeric" placeholder="+256 7XX XXX XXX" value={phone} onChange={e => { setPhone(sanitizePhoneInput(e.target.value)); clearError('phone') }} style={errors.phone ? { borderColor: 'var(--red)' } : undefined} />
            {errors.phone && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.phone}</p>}
          </div>
          <div className="fg">
            <label className="lbl">Email <span className="text-clr-red">*</span></label>
            <input className="ctrl" type="email" placeholder="candidate@example.com" value={email} onChange={e => { setEmail(e.target.value); clearError('email') }} style={errors.email ? { borderColor: 'var(--red)' } : undefined} />
            {errors.email && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.email}</p>}
          </div>
          <div className="fg">
            <label className="lbl">Date of Birth <span className="text-clr-red">*</span></label>
            <input className="ctrl" type="date" value={dob} onChange={e => { setDob(e.target.value); clearError('dob') }} style={errors.dob ? { borderColor: 'var(--red)' } : undefined} />
            {errors.dob && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.dob}</p>}
          </div>
          <div className="fg">
            <label className="lbl">Enquiry Date <span className="text-clr-red">*</span></label>
            <input className="ctrl" type="date" value={enquiryDate} onChange={e => { setEnquiryDate(e.target.value); clearError('enquiryDate') }} style={errors.enquiryDate ? { borderColor: 'var(--red)' } : undefined} />
            {errors.enquiryDate && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.enquiryDate}</p>}
          </div>
          <div className="fg">
            <label className="lbl">Campus <span className="text-clr-red">*</span></label>
            <SearchSelect placeholder="— select —" options={campusOptions} value={campusGuid} onChange={val => { setCampusGuid(val); clearError('campusGuid') }} />
            {errors.campusGuid && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.campusGuid}</p>}
          </div>
          <div className="fg">
            <label className="lbl">Enquiry Channel</label>
            <SearchSelect placeholder="— select —" options={['Walk-in', 'Phone', 'Online', 'Kiosk']} />
          </div>
          <div className="fg">
            <label className="lbl">Enquiry Source <span className="text-clr-red">*</span></label>
            <SearchSelect placeholder="— select —" options={sourceOptions} value={sourceGuid} onChange={val => { setSourceGuid(val); clearError('sourceGuid') }} />
            {errors.sourceGuid && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.sourceGuid}</p>}
          </div>
          <div className="fg">
            <label className="lbl">Programme Interest</label>
            <SearchSelect placeholder="— select —" options={programOptions} value={programGuid} onChange={setProgramGuid} />
          </div>
          <div className="fg">
            <label className="lbl">Preferred Intake <span className="text-clr-red">*</span></label>
            <SearchSelect placeholder="— select —" options={intakeOptions} value={intakeGuid} onChange={val => { setIntakeGuid(val); clearError('intakeGuid') }} />
            {errors.intakeGuid && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.intakeGuid}</p>}
          </div>
          <div className="fg">
            <label className="lbl">Preferred Study Mode</label>
            <SearchSelect placeholder="— select —" options={['Full-time', 'Weekend', 'Evening', 'ODL']} />
          </div>
          <div className="fg" style={{ gridColumn: 'span 2' }}>
            <label className="lbl">Enquiry Notes</label>
            <textarea className="ctrl" rows={3} placeholder="Additional notes about the enquiry..." value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
        </div>
        <div className="sec-divider" />
        <div className="flex justify-end gap-2">
          <button className="btn btn-ghost" onClick={() => router.push('/admission/enquiry-list')}>Cancel</button>
          {permissions.add && (
            <button className="btn btn-primary" disabled={createEnquiry.isPending} onClick={handleSave}>
              {createEnquiry.isPending ? 'Saving…' : 'Save Enquiry'}
            </button>
          )}
        </div>
      </div>

      {saved && (
        <div className="modal-overlay open">
          <div className="modal" style={{ maxWidth: 400 }}>
            <SuccessPopup title="Enquiry Saved!" subtitle="The enquiry has been recorded successfully." onClose={handleSavedClose} />
          </div>
        </div>
      )}

      {failure && (
        <div className="modal-overlay open">
          <div className="modal" style={{ maxWidth: 400 }}>
            <FailurePopup title="Couldn't Save Enquiry" subtitle={failure} onClose={() => setFailure(null)} />
          </div>
        </div>
      )}
    </div>
  )
}
