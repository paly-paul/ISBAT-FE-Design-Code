'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { SearchSelect } from '@/components/SearchSelect'
import DatePicker from '@/components/DatePicker'
import { SuccessPopup } from '@/components/modals/shared/SuccessPopup'
import { FailurePopup } from '@/components/modals/shared/FailurePopup'
import { useCurrentAdmissionIntake } from '@/hooks/academic/useIntakes'
import { useCampusDropdown } from '@/hooks/config/useCampuses'
import { useCountriesForPicker } from '@/hooks/config/useCountries'
import { countryPickerOptions, phoneCountryOptions } from '@/lib/api/academic/country'
import { useApprovedProgramsByCampus } from '@/hooks/academic/useProgramMaster'
import { useEnquirySourceMastersDropdown } from '@/hooks/admission/useEnquirySourceMasters'
import { useEnquirySourcesDropdown } from '@/hooks/admission/useEnquirySources'
import { useCreateEnquiry, useEnquiryGenders, useReloadEnquiryDropdowns } from '@/hooks/admission/useEnquiries'
import { EnquiryEmailField, EnquirySaveStatus, VerifiedEmail, isValidEnquiryEmail, isVerifiedFor } from '@/components/EnquiryEmailField'
import { EnquirySponsorFields, EMPTY_SPONSOR, SponsorValues, sponsorErrorField, sponsorPayload, validateSponsor } from '@/components/EnquirySponsorFields'
import { usePagePermissions } from '@/hooks/users/usePagePermissions'
import { AuthError } from '@/lib/api/client'
import { ENQUIRY_NAME_MESSAGE, isValidEnquiryName, sanitizeNameInput } from '@/lib/errorMessages'
import { scrollToFirstError } from '@/lib/scrollToFirstError'
import { formatLongYmd, isWithinRecentWindow, monthsAgoYmd, RECENT_DATE_MONTHS, todayYmd, yearsAgoYmd } from '@/lib/date'

// Today's date at midnight, formatted the same way the confirmed payload
// sample uses (no timezone offset) — matches enquiryDate/dob's "T00:00:00" shape.
function todayAtMidnight() {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}T00:00:00`
}

// Backend cap on studentName (first + last joined by a space).
const NAME_MAX = 50
// Backend mobile rule: digits only, 7 to 15 (regex ^\d{7,15}$).
const PHONE_MIN = 7
const PHONE_MAX = 15
// POST /enquiries: enquiryDate must be within the last 3 months and not in
// the future — same window as Application Payment's payDate (lib/date.ts).
const ENQUIRY_DATE_RANGE_MESSAGE = 'Enquiry date must be within the last 3 months and not in the future.'
// POST /enquiries: dob must make the student at least 10 years old.
const MIN_AGE_YEARS = 10
// Names the actual cutoff date — the calendar greys out every day after it.
function dobRangeMessage() {
  return `Date of birth must be on or before ${formatLongYmd(yearsAgoYmd(MIN_AGE_YEARS))} (student must be at least ${MIN_AGE_YEARS} years old).`
}
// Backend cap on remarks.
const REMARKS_MAX = 100

export default function KioskEnquiryPage() {
  const router = useRouter()
  const permissions = usePagePermissions()
  // enquiryCode of the enquiry just created; non-null opens the success popup.
  const [savedCode, setSavedCode] = useState<string | null>(null)
  const [failure, setFailure] = useState<string | null>(null)
  // Email must be OTP-verified BEFORE save (2026-10 enquiry handoff): the
  // token from EnquiryEmailField goes out as emailVerificationToken.
  const [verifiedEmail, setVerifiedEmail] = useState<VerifiedEmail | null>(null)

  const { data: enquirySources = [] } = useEnquirySourceMastersDropdown()
  const { data: isbatSources = [] }   = useEnquirySourcesDropdown()
  const { data: genders = [] }        = useEnquiryGenders()
  const createEnquiry = useCreateEnquiry()
  const reloadDropdowns = useReloadEnquiryDropdowns()

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName]   = useState('')
  // Sent as gender: 0 = Male, 1 = Female, 2 = Other (post-enquiry.md).
  // Optional, so blank goes out as null.
  const [gender, setGender] = useState('')
  // Phone = dial-code country picker + raw-digits box. The picker's value is
  // a Country GUID, sent as mobileCountryGuid (required since 2026-10); the
  // dial code is never joined into `mobile`, which stays digits only.
  // Defaults to Uganda once the full country list loads (effect below).
  const [mobileCountryGuid, setMobileCountryGuid] = useState('')
  const [phoneCodeTouched, setPhoneCodeTouched] = useState(false)
  const [phone, setPhone]         = useState('')
  const [email, setEmail]         = useState('')
  const [dob, setDob]             = useState('')
  const [enquiryDate, setEnquiryDate] = useState(() => todayAtMidnight().slice(0, 10))
  const [campusGuid, setCampusGuid]   = useState('')
  const [programGuid, setProgramGuid] = useState('')
  const [sourceGuid, setSourceGuid]   = useState('')
  // Country used to be hardcoded to 'UG' on every create — now a real
  // required field (POST rejects with "'Request Country Guid' must not be
  // empty." otherwise), sourced from the same GET /api/v1/users/countries
  // master Application-Payments and Filing already use (see the note on
  // EnquiryInput.countryGuid in lib/api/admission/enquiry.ts).
  const [countryGuid, setCountryGuid] = useState('')
  const [notes, setNotes]         = useState('')
  // Optional — ISBAT Enquiry Source master guid, free-text source name, tag.
  const [isbatSourceGuid, setIsbatSourceGuid] = useState('')
  const [sourceName, setSourceName] = useState('')
  // Tag field hidden (2026-10-15) — enquiryTag is always sent as null.
  // const [enquiryTag, setEnquiryTag] = useState('')
  const [sponsor, setSponsor] = useState<SponsorValues>(EMPTY_SPONSOR)
  const [errors, setErrors]       = useState<Record<string, string>>({})
  const [programSearch, setProgramSearch] = useState('')
  const [committedProgramSearch, setCommittedProgramSearch] = useState('')
  const [programPickerOpen, setProgramPickerOpen] = useState(false)

  useEffect(() => { const t = setTimeout(() => setCommittedProgramSearch(programSearch.trim()), 300); return () => clearTimeout(t) }, [programSearch])

  // Preferred Intake is fixed to the current admission intake (the one
  // flagged currentAdmissionIntake) and shown read-only — enquiries are
  // always for the intake admissions is open for.
  const { data: admissionIntake, isLoading: admissionIntakeLoading } = useCurrentAdmissionIntake()
  const intakeGuid = admissionIntake?.intakeGuid ?? ''
  const intakeLabel = admissionIntake ? `${admissionIntake.intakeCode} — ${admissionIntake.description}` : ''
  // Campus and Country come from their dropdown APIs (GET /campus/dropdown,
  // /countries/dropdown): one cached call each, filtered in the browser.
  const { data: campuses = [], isLoading: campusesLoading } = useCampusDropdown()
  // Approved programmes only (GET /program-master/dropdown?campusGuid=) — by-campus
  // also listed ones still pending approval.
  const programQuery = useApprovedProgramsByCampus(campusGuid, committedProgramSearch, programPickerOpen)
  const { countries, home: homeCountry, known: allCountries, isLoading: countriesLoading } = useCountriesForPicker()
  const programsByCampus = programQuery.data ?? []
  useEffect(() => {
    if (mobileCountryGuid || !homeCountry) return
    setMobileCountryGuid(homeCountry.countryGuid)
  }, [homeCountry, mobileCountryGuid])
  // Country also defaults to Uganda, once, when it loads — not on every
  // clear, so the user can empty the picker to search for another country.
  useEffect(() => {
    if (homeCountry) setCountryGuid(prev => prev || homeCountry.countryGuid)
  }, [homeCountry])

  // Same "programmes scoped to the selected campus" convention as Payment,
  // Filing, and the On-Desk/Online Enquiry forms — a programme belongs to
  // one campus, so the list is empty/disabled until a Campus is chosen.
  const campusOptions  = campuses.map(c => ({ value: c.campusGuid, label: c.campusName }))
  const programOptions = programsByCampus.map(p => ({ value: p.programGuid, label: `${p.programName} (${p.programCode})` }))
  const sourceOptions  = enquirySources.map(s => ({ value: s.enquirySourceGuid, label: s.enquirySourceName }))
  const isbatSourceOptions = isbatSources.map(s => ({ value: s.isbatSourceGuid, label: s.sourceName }))
  const genderOptions  = genders.map(g => ({ value: String(g.value), label: g.name }))
  const countryOptions = countryPickerOptions(countries, allCountries, countryGuid)
  const phoneCodeOptions = phoneCountryOptions(countries, allCountries, mobileCountryGuid)

  function setCampus(v: string) { setCampusGuid(v); setProgramGuid(''); clearError('campusGuid') }

  // Selecting a Country also points the phone code at that country's own
  // dial code — still just a UX default, freely overridable via the phone
  // code dropdown itself afterwards.
  function selectCountry(guid: string) {
    setCountryGuid(guid)
    clearError('countryGuid')
    if (guid && !phoneCodeTouched) setMobileCountryGuid(guid)
  }

  function clearError(field: string) {
    setErrors(prev => (prev[field] ? { ...prev, [field]: '' } : prev))
  }

  // Joined the way it's sent — NFC, so accented letters go as single code
  // points (see isValidEnquiryName for the letters-and-spaces rule).
  function studentName() {
    return `${firstName.trim()} ${lastName.trim()}`.trim().normalize('NFC')
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!firstName.trim()) e.firstName = 'First Name is required'
    else if (!isValidEnquiryName(firstName.trim())) e.firstName = ENQUIRY_NAME_MESSAGE
    if (!lastName.trim())  e.lastName  = 'Last Name is required'
    else if (!isValidEnquiryName(lastName.trim()))  e.lastName  = ENQUIRY_NAME_MESSAGE
    else if (studentName().length > NAME_MAX) e.lastName = `First and last name together must be ${NAME_MAX} characters or fewer (now ${studentName().length})`
    if (!phone.trim())     e.phone     = 'Phone is required'
    else if (phone.length < PHONE_MIN) e.phone = `Phone must be ${PHONE_MIN} to ${PHONE_MAX} digits`
    else if (!mobileCountryGuid) e.phone = 'Select the phone’s country code'
    if (!email.trim())     e.email     = 'Email is required'
    else if (!isValidEnquiryEmail(email)) e.email = 'Enter a valid email'
    else if (!isVerifiedFor(verifiedEmail, email)) e.email = 'Verify the email before saving'
    if (!dob)               e.dob       = 'Date of Birth is required'
    else if (dob > yearsAgoYmd(MIN_AGE_YEARS)) e.dob = dobRangeMessage()
    if (notes.trim().length > REMARKS_MAX) e.notes = `Notes must be ${REMARKS_MAX} characters or fewer`
    if (!enquiryDate)       e.enquiryDate = 'Enquiry date is required.'
    else if (!isWithinRecentWindow(enquiryDate)) e.enquiryDate = ENQUIRY_DATE_RANGE_MESSAGE
    if (!intakeGuid)        e.intakeGuid = 'No admission intake is open right now. Please contact the admissions office.'
    if (!programGuid)       e.programGuid = 'Programme is required.'
    if (!campusGuid)        e.campusGuid = 'Please select a Campus'
    if (!sourceGuid)        e.sourceGuid = 'Please select an Enquiry Source'
    if (!countryGuid)       e.countryGuid = 'Please select a Country'
    Object.assign(e, validateSponsor(sponsor))
    setErrors(e)
    scrollToFirstError(e)
    return Object.keys(e).length === 0
  }

  function resetForm() {
    setFirstName(''); setLastName(''); setGender(''); setMobileCountryGuid(homeCountry?.countryGuid ?? ''); setPhone(''); setEmail(''); setVerifiedEmail(null); setDob('')
    setEnquiryDate(todayAtMidnight().slice(0, 10))
    setCampusGuid(''); setProgramGuid(''); setSourceGuid(''); setCountryGuid(homeCountry?.countryGuid ?? ''); setNotes('')
    setIsbatSourceGuid(''); setSourceName('')
    setSponsor(EMPTY_SPONSOR)
    setPhoneCodeTouched(false)
    setErrors({})
  }

  function handleSave() {
    if (!validate()) return
    createEnquiry.mutate(
      {
        intakeGuid,
        campusGuid,
        enquirySourceGuid: sourceGuid,
        studentName: studentName(),
        enquiryDate: `${enquiryDate}T00:00:00`,
        mobile: phone.trim(),
        mobileCountryGuid,
        email: email.trim(),
        emailVerificationToken: verifiedEmail?.token ?? '',
        countryGuid,
        dob: `${dob}T00:00:00`,
        gender: gender === '' ? null : +gender,
        remarks: notes.trim() || null,
        programGuid,
        isbatSourceGuid: isbatSourceGuid || null,
        sourceName: sourceName.trim() || null,
        enquiryTag: null,
        ...sponsorPayload(sponsor),
      },
      {
        onSuccess: enquiry => setSavedCode(enquiry?.enquiryCode ?? ''),
        onError: (error: Error) => {
          const code = error instanceof AuthError ? error.code : undefined
          const msg = error.message || ''
          // Token missing, expired (30 min) or issued for another email —
          // send the user back to verify again.
          if (/not verified|verification token is required/i.test(msg)) {
            setVerifiedEmail(null)
            const e = { email: /required/i.test(msg) ? 'Verify the email before saving' : 'Email verification expired or doesn’t match this email. Verify it again, then save.' }
            setErrors(prev => ({ ...prev, ...e }))
            scrollToFirstError(e)
            return
          }
          if (code === 'validation_error' && /enquiry date/i.test(msg)) {
            const e = { enquiryDate: msg }
            setErrors(prev => ({ ...prev, ...e }))
            scrollToFirstError(e)
            return
          }
          // Intake / enquiry source / ISBAT source deleted since the form
          // loaded — refresh those pickers so the stale choice can be redone.
          if (code === 'not_found') reloadDropdowns()
          // Remaining documented create errors, matched by their message.
          const fieldFor =
            sponsorErrorField(msg) ??
            (code === 'not_found' && /isbat/i.test(msg) ? 'isbatSourceGuid'
            : code === 'not_found' && /^mobile country/i.test(msg) ? 'phone'
            :
            code === 'validation_error' && /mobile/i.test(msg) ? 'phone'
            : code === 'validation_error' && /age must be|dob|birth/i.test(msg) ? 'dob'
            : code === 'validation_error' && /remarks/i.test(msg) ? 'notes'
            : code === 'validation_error' && /email/i.test(msg) ? 'email'
            : /^programme (is required|not found)/i.test(msg) ? 'programGuid'
            : code === 'not_found' && /^intake/i.test(msg) ? 'intakeGuid'
            : code === 'not_found' && /^enquiry source/i.test(msg) ? 'sourceGuid'
            : null)
          if (fieldFor) {
            const e = { [fieldFor]: msg }
            setErrors(prev => ({ ...prev, ...e }))
            scrollToFirstError(e)
            return
          }
          if (code === 'validation_error' && /student name/i.test(msg)) {
            const e = { firstName: msg }
            setErrors(prev => ({ ...prev, ...e }))
            scrollToFirstError(e)
            return
          }
          setFailure(msg || `Failed to save enquiry${code ? ` (${code})` : ''}. Please try again.`)
        },
      },
    )
  }

  // Kiosk stays on the form, cleared for the next candidate.
  function handleSavedClose() {
    setSavedCode(null)
    resetForm()
  }

  return (
    <div id="page-kiosk-enquiry">
      <div className="pg-hdr">
        <div>
          <h1 className="text-xl font-semibold text-g900">Self-Service Kiosk Enquiry</h1>
          <p className="text-sm text-g500 mt-0.5">Captured at the campus self-service kiosk — candidate-entered</p>
        </div>      </div>

      <div className="card w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="fg">
            <label className="lbl">First Name <span className="text-clr-red">*</span></label>
            <input className="ctrl" placeholder="e.g. Brian" value={firstName} onChange={e => { setFirstName(sanitizeNameInput(e.target.value)); clearError('firstName') }} style={errors.firstName ? { borderColor: 'var(--red)' } : undefined} />
            {errors.firstName && <p className="field-err" style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.firstName}</p>}
          </div>
          <div className="fg">
            <label className="lbl">Last Name <span className="text-clr-red">*</span></label>
            <input className="ctrl" placeholder="e.g. Kamya" value={lastName} onChange={e => { setLastName(sanitizeNameInput(e.target.value)); clearError('lastName') }} style={errors.lastName ? { borderColor: 'var(--red)' } : undefined} />
            {errors.lastName && <p className="field-err" style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.lastName}</p>}
          </div>
          <div className="fg">
            <label className="lbl">Gender</label>
            <SearchSelect placeholder="— select —" options={genderOptions} value={gender} onChange={setGender} />
          </div>
          <div className="fg">
            <label className="lbl">Phone <span className="text-clr-red">*</span></label>
            <div className="flex gap-2">
              <SearchSelect options={phoneCodeOptions} value={mobileCountryGuid} onChange={v => { setMobileCountryGuid(v); setPhoneCodeTouched(true); clearError('phone') }} isLoading={countriesLoading} style={{ width: 108, flexShrink: 0 }} />
              <input className="ctrl flex-1" type="tel" inputMode="numeric" placeholder="e.g. 772123456" maxLength={PHONE_MAX} value={phone} onChange={e => { setPhone(e.target.value.replace(/\D/g, '').slice(0, PHONE_MAX)); clearError('phone') }} style={errors.phone ? { borderColor: 'var(--red)' } : undefined} />
            </div>
            {errors.phone && <p className="field-err" style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.phone}</p>}
          </div>
          <div className="fg">
            <label className="lbl">Email <span className="text-clr-red">*</span></label>
            <EnquiryEmailField
              email={email}
              onEmailChange={setEmail}
              verified={verifiedEmail}
              onVerifiedChange={setVerifiedEmail}
              error={errors.email}
              onClearError={() => clearError('email')}
              studentName={studentName() || undefined}
            />
          </div>
          <div className="fg">
            <label className="lbl">Date of Birth <span className="text-clr-red">*</span></label>
            <DatePicker value={dob} onChange={v => { setDob(v); clearError('dob') }} maxYmd={yearsAgoYmd(MIN_AGE_YEARS)} rangeMessage={dobRangeMessage()} hasError={!!errors.dob} />
            {errors.dob && <p className="field-err" style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.dob}</p>}
          </div>
          <div className="fg">
            <label className="lbl">Enquiry Date <span className="text-clr-red">*</span></label>
            <DatePicker
              value={enquiryDate}
              onChange={v => { setEnquiryDate(v); clearError('enquiryDate') }}
              minYmd={monthsAgoYmd(RECENT_DATE_MONTHS)}
              maxYmd={todayYmd()}
              rangeMessage={ENQUIRY_DATE_RANGE_MESSAGE}
              hasError={!!errors.enquiryDate}
            />
            {errors.enquiryDate && <p className="field-err" style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.enquiryDate}</p>}
          </div>
          <div className="fg">
            <label className="lbl">Campus <span className="text-clr-red">*</span></label>
            <SearchSelect placeholder="— select —" options={campusOptions} value={campusGuid} onChange={setCampus} isLoading={campusesLoading} />
            {errors.campusGuid && <p className="field-err" style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.campusGuid}</p>}
          </div>
          <div className="fg">
            <label className="lbl">Enquiry Source <span className="text-clr-red">*</span></label>
            <SearchSelect placeholder="— select —" options={sourceOptions} value={sourceGuid} onChange={val => { setSourceGuid(val); clearError('sourceGuid') }} />
            {errors.sourceGuid && <p className="field-err" style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.sourceGuid}</p>}
          </div>
          <div className="fg">
            <label className="lbl">Country <span className="text-clr-red">*</span></label>
            <SearchSelect placeholder="— select —" options={countryOptions} value={countryGuid} onChange={selectCountry} isLoading={countriesLoading} />
            {errors.countryGuid && <p className="field-err" style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.countryGuid}</p>}
          </div>
          <div className="fg">
            <label className="lbl">Programme Interest <span className="text-clr-red">*</span></label>
            <SearchSelect
              placeholder={campusGuid ? '— select —' : 'Select a campus first'}
              options={programOptions}
              value={programGuid}
              onChange={v => { setProgramGuid(v); clearError('programGuid') }}
              disabled={!campusGuid}
              onSearch={setProgramSearch}
              onOpenChange={setProgramPickerOpen}
              isLoading={programQuery.isLoading}
            />
            {errors.programGuid && <p className="field-err" style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.programGuid}</p>}
          </div>
          <div className="fg">
            <label className="lbl">Preferred Intake <span className="text-clr-red">*</span></label>
            <input className="ctrl" readOnly value={intakeLabel} placeholder={admissionIntakeLoading ? 'Loading intake…' : 'No admission intake open'} title="Set to the current admission intake" />
            {errors.intakeGuid && <p className="field-err" style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.intakeGuid}</p>}
          </div>
          <div className="fg">
            <label className="lbl">ISBAT Source</label>
            <SearchSelect placeholder="— select —" options={isbatSourceOptions} value={isbatSourceGuid} onChange={val => { setIsbatSourceGuid(val); clearError('isbatSourceGuid') }} />
            {errors.isbatSourceGuid && <p className="field-err" style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.isbatSourceGuid}</p>}
          </div>
          <div className="fg">
            <label className="lbl">Source Name</label>
            <input className="ctrl" placeholder="e.g. referred by a friend" value={sourceName} onChange={e => setSourceName(e.target.value)} />
          </div>
          {/* Tag hidden per request (2026-10-15) — enquiryTag is always sent as null.
          <div className="fg">
            <label className="lbl">Tag</label>
            <input className="ctrl" placeholder="e.g. Open Day 2026" value={enquiryTag} onChange={e => setEnquiryTag(e.target.value)} />
          </div> */}
          {/* Preferred Study Mode had no counterpart on POST /api/v1/admissions/enquiries
              (Full-time/Weekend/Evening/ODL) — dropped rather than collecting data that
              goes nowhere, same as Online Enquiry's own note. */}
          <div className="fg col-span-1 md:col-span-2 lg:col-span-3">
            <label className="lbl">Enquiry Notes</label>
            <textarea className="ctrl" rows={2} placeholder="Additional notes about the enquiry..." maxLength={REMARKS_MAX} value={notes} onChange={e => { setNotes(e.target.value); clearError('notes') }} style={errors.notes ? { borderColor: 'var(--red)' } : undefined} />
            {errors.notes && <p className="field-err" style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.notes}</p>}
          </div>
        </div>
        <EnquirySponsorFields value={sponsor} onChange={setSponsor} errors={errors} onClearError={clearError} />
        <div className="sec-divider" />
        <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-2">
          {permissions.add && (
            <div className="mr-auto">
              <EnquirySaveStatus verified={isVerifiedFor(verifiedEmail, email)} />
            </div>
          )}
          <div className="flex gap-2">
            <button className="btn btn-ghost" onClick={() => router.push('/admission/enquiry-list')}>Cancel</button>
            {permissions.add && (
              <button className="btn btn-primary" disabled={createEnquiry.isPending || !isVerifiedFor(verifiedEmail, email)} onClick={handleSave}>
                {createEnquiry.isPending ? 'Saving…' : 'Save Enquiry'}
              </button>
            )}
          </div>
        </div>
      </div>

      {savedCode !== null && (
        <div className="modal-overlay open">
          <div className="modal" style={{ maxWidth: 400 }}>
            <SuccessPopup
              title="Enquiry Saved!"
              subtitle={savedCode ? `Enquiry ${savedCode} has been recorded.` : 'The enquiry has been recorded.'}
              onClose={handleSavedClose}
            />
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
