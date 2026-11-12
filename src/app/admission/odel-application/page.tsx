'use client'
import { Fragment, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Toast } from '@/components/Toast'
import { SearchSelect } from '@/components/SearchSelect'
import DatePicker from '@/components/DatePicker'
import { ScrollTable } from '@/components/ScrollTable'
import { ActionMenu } from '@/components/ActionMenu'
import { EmptyState } from '@/components/EmptyState'
import { TableLoadingState } from '@/components/TableLoadingState'
import { FailurePopup } from '@/components/modals/shared/FailurePopup'
import { DocumentPreviewModal } from '@/components/modals/shared/DocumentPreviewModal'
import { useSearchCampusesInfinite } from '@/hooks/config/useCampuses'
import { useSearchProgramMastersByCampusInfinite } from '@/hooks/academic/useProgramMaster'
import { useSemestersForProgram } from '@/hooks/academic/useSemesters'
import { useBatchTimesDropdown } from '@/hooks/config/useBatchTimes'
import { useCountriesByGuids, useKnownCountries, useSearchCountriesInfinite } from '@/hooks/config/useCountries'
import { usePagePermissions } from '@/hooks/users/usePagePermissions'
import {
  useDeleteOdelQualification,
  useOdelPaymentSlip,
  useOdelPhoto,
  useOdelQualifications,
  useSaveOdelGeneral,
  useSaveOdelQualification,
  useSearchOdelApplication,
  useSubmitOdelApplication,
  useUploadOdelPaymentSlip,
  useUploadOdelPhoto,
} from '@/hooks/admission/useOdelApplication'
import { OdelApplication, OdelQualification, ODEL_SAVE_STATUS } from '@/lib/api/admission/odelApplication'
import { countryPickerOptions, dialCode, phoneCountryOptions } from '@/lib/api/academic/country'
import { DocumentPreview, resolveDocumentPreview } from '@/lib/documentViewer'
import { extractApiErrorMessage, sanitizePhoneInput } from '@/lib/errorMessages'
import { flattenUniquePages } from '@/lib/pagination'
import { scrollToFirstError } from '@/lib/scrollToFirstError'

// ODeL (Online & Distance e-Learning) application — staff-side wizard over the
// /admissions/portal/odel/* endpoints (see /odel-application/*.md).
//
//   New application      → General tab save (no GUID) creates the application
//                          and its ref no. (ODeL20261/75).
//   Existing application → ref no. + registered email returns the saved
//                          General details and the application GUID.
//
// Four steps, unlocked by the application's saveStatus (only ever moves up):
//   1 General · 2 Qualifications · 3 Photo · 4 Payment slip
// Everything is saved per step, so there is no separate submit action; the
// ODeL docs define none. The page id/classes deliberately reuse Application
// Filing's (#page-filing) stepper, file-zone, qual-card and checklist styles so
// both admission wizards look identical.

type Tab = 'general' | 'qualifications' | 'photo' | 'payment'
const TABS: { id: Tab; step: number; label: string; icon: string; desc: string }[] = [
  { id: 'general',        step: 1, label: 'General',        icon: 'lni-user-4',      desc: 'Applicant, programme, identity documents and sponsor details' },
  { id: 'qualifications', step: 2, label: 'Qualifications', icon: 'lni-graduation',  desc: 'Academic qualifications with proof documents' },
  { id: 'photo',          step: 3, label: 'Photo',          icon: 'lni-image',       desc: 'Passport-style photo of the applicant' },
  { id: 'payment',        step: 4, label: 'Payment Slip',   icon: 'lni-credit-cards', desc: 'Offline payment slip for the application fee' },
]

// Backend gender codes: 0 Male, 1 Female, 2 Other.
const GENDERS = ['Male', 'Female', 'Other']

// Limits from the ODeL API docs.
const NAME_MAX = 100
const EMAIL_MAX = 100
const PHONE_MIN = 7
const PHONE_MAX = 15
const ID_MAX = 50
const MIN_AGE_YEARS = 10
const QUAL_TEXT_MAX = 200
const QUAL_GRADE_MAX = 50
const PASS_YEAR_MIN = 1950
const QUAL_DURATION_MIN = 1
const QUAL_DURATION_MAX = 10
const MAX_FILE_BYTES = 5 * 1024 * 1024
const NAME_RE = /^[\p{L}\p{M}][\p{L}\p{M} ]*$/u
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const DOC_EXT_RE = /\.(pdf|jpe?g|png)$/i
const PHOTO_EXT_RE = /\.(jpe?g|png|bmp)$/i
const DOC_ACCEPT = '.pdf,.jpg,.jpeg,.png'
const PHOTO_ACCEPT = '.jpg,.jpeg,.png,.bmp'

// Server messages that block the whole application (not one field) get the
// shared failure popup instead of a toast.
const BLOCKING_ERROR_RE = /already received|already submitted|not open|intake not found/i

interface GeneralForm {
  firstName: string
  lastName: string
  gender: string
  dob: string
  countryGuid: string
  nationalId: string
  nationalIdFile: File | null
  email: string
  phoneCode: string
  phone: string
  campusGuid: string
  programGuid: string
  semesterGuid: string
  batchTimeGuid: string
  passportNo: string
  passportFile: File | null
  vStartDate: string
  vEndDate: string
  visaFile: File | null
  isRefugee: boolean
  refugeeId: string
  spName: string
  spEmail: string
  spCountryGuid: string
  spPhone: string
}

const EMPTY_FORM: GeneralForm = {
  firstName: '', lastName: '', gender: '', dob: '',
  countryGuid: '', nationalId: '', nationalIdFile: null,
  email: '', phoneCode: '', phone: '',
  campusGuid: '', programGuid: '', semesterGuid: '', batchTimeGuid: '',
  passportNo: '', passportFile: null, vStartDate: '', vEndDate: '', visaFile: null,
  isRefugee: false, refugeeId: '',
  spName: '', spEmail: '', spCountryGuid: '', spPhone: '',
}

// Names the search response resolves, so a saved campus/programme/semester/
// country still shows a label before the paged pickers have loaded it.
interface SavedLabels {
  campusName: string | null
  programName: string | null
  semesterName: string | null
}
const EMPTY_LABELS: SavedLabels = { campusName: null, programName: null, semesterName: null }

interface QualForm {
  qualGuid: string | null
  institution: string
  university: string
  passYear: string
  grade: string
  yearsTaken: string
  proofFile: File | null
}
const EMPTY_QUAL: QualForm = { qualGuid: null, institution: '', university: '', passYear: '', grade: '', yearsTaken: '', proofFile: null }

// ── Small helpers ──────────────────────────────────────────────────────────

function pad(n: number) { return String(n).padStart(2, '0') }
function toYmd(d: Date) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` }
function todayYmd() { return toYmd(new Date()) }
function latestDobYmd() {
  const d = new Date()
  d.setFullYear(d.getFullYear() - MIN_AGE_YEARS)
  return toYmd(d)
}

function useDebounced<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return debounced
}

function toOptions(map: Map<string, string>) {
  return Array.from(map.entries()).map(([value, label]) => ({ value, label }))
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase()
}

// Extension + size rules shared by every ODeL upload (extension only — the
// server doesn't inspect content either).
function fileError(file: File | null, label: string, extRe: RegExp, typeText: string): string | null {
  if (!file) return null
  if (file.size === 0) return `${label} is empty.`
  if (!extRe.test(file.name) || file.size > MAX_FILE_BYTES) return `${label} must be a ${typeText} of 5 MB or less.`
  return null
}
const docFileError = (file: File | null, label: string) => fileError(file, label, DOC_EXT_RE, 'PDF, JPG or PNG')

// A server URL as something an <img> can show: backend-hosted files answer 401
// without the login cookie, so they are fetched (with credentials) into a blob.
function useImageSrc(url: string | null | undefined): string | null {
  const [src, setSrc] = useState<string | null>(null)
  useEffect(() => {
    if (!url) { setSrc(null); return }
    if (url.startsWith('blob:')) { setSrc(url); return }
    let cancelled = false
    let current: DocumentPreview | null = null
    resolveDocumentPreview(url)
      .then(p => {
        if (cancelled) { p.revoke(); return }
        current = p
        setSrc(p.kind === 'image' ? p.src : null)
      })
      .catch(() => { if (!cancelled) setSrc(null) })
    return () => { cancelled = true; current?.revoke() }
  }, [url])
  return src
}

// A picked File as a blob: URL for preview, revoked when it changes.
function useObjectUrl(file: File | null): string | null {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    if (!file) { setUrl(null); return }
    const u = URL.createObjectURL(file)
    setUrl(u)
    return () => URL.revokeObjectURL(u)
  }, [file])
  return url
}

// ── Local form primitives (same markup as Application Filing's) ────────────

function Field({ label, req, children, error, hint }: { label: string; req?: boolean; children: React.ReactNode; error?: string; hint?: string }) {
  return (
    <div className="fg">
      <label className="lbl">{label}{req && <span className="req">*</span>}</label>
      {children}
      {hint && !error && <p className="text-g400" style={{ fontSize: 12, marginTop: 4 }}>{hint}</p>}
      {error && <p className="field-err" style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{error}</p>}
    </div>
  )
}

function Input({ placeholder, type = 'text', readOnly, value, onChange, inputMode, maxLength, hasError }: {
  placeholder?: string; type?: string; readOnly?: boolean; value: string; onChange?: (v: string) => void
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode']; maxLength?: number; hasError?: boolean
}) {
  return (
    <input
      className="ctrl"
      type={type}
      placeholder={placeholder}
      readOnly={readOnly}
      inputMode={inputMode}
      maxLength={maxLength}
      value={value}
      onChange={e => onChange?.(e.target.value)}
      style={hasError ? { borderColor: 'var(--red)' } : undefined}
      aria-invalid={hasError || undefined}
    />
  )
}

function FileZone({ hint = 'Click or drop a file to upload', file, onChange, hasError, accept = DOC_ACCEPT }: {
  hint?: string; file: File | null; onChange: (f: File | null) => void; hasError?: boolean; accept?: string
}) {
  const [dragActive, setDragActive] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  // Clearing also resets the native input, or re-picking the same file wouldn't fire onChange.
  function removeFile(e: React.MouseEvent) {
    e.preventDefault(); e.stopPropagation()
    if (inputRef.current) inputRef.current.value = ''
    onChange(null)
  }
  return (
    <div
      className={`file-zone${dragActive ? ' drag-active' : ''}`}
      style={hasError ? { borderColor: 'var(--red)' } : undefined}
      onDragOver={e => { e.preventDefault(); setDragActive(true) }}
      onDragLeave={() => setDragActive(false)}
      onDrop={e => {
        e.preventDefault(); setDragActive(false)
        const dropped = e.dataTransfer.files?.[0]
        if (dropped) onChange(dropped)
      }}
    >
      <input ref={inputRef} type="file" accept={accept} onChange={e => onChange(e.target.files?.[0] ?? null)} />
      <i className={`lni ${file ? 'lni-checkmark-circle' : 'lni-cloud-upload'} file-zone-icon`} style={file ? { color: 'var(--green)' } : undefined} />
      <p>{file ? file.name : hint}</p>
      {file && (
        <button type="button" className="btn btn-neu btn-sm" style={{ position: 'relative', zIndex: 1, marginTop: 8 }} onClick={removeFile} aria-label={`Remove ${file.name}`}>
          <i className="lni lni-trash-can" aria-hidden="true" /> Remove
        </button>
      )}
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function OdelApplicationPage() {
  const permissions = usePagePermissions()
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)
  const [failure, setFailure] = useState<{ title: string; message: string } | null>(null)
  function showToast(msg: string, type = '') { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }

  // ── Application lookup ────────────────────────────────────────────────────
  type Mode = 'new' | 'existing'
  const [mode, setMode] = useState<Mode>('new')

  const [lookupRef, setLookupRef] = useState('')
  const [lookupEmail, setLookupEmail] = useState('')
  const [lookupErrors, setLookupErrors] = useState<Record<string, string>>({})
  const [lookupFailed, setLookupFailed] = useState<string | null>(null)
  const searchApplication = useSearchOdelApplication()
  const submitApplication = useSubmitOdelApplication()

  // ── Application state ─────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<Tab>('general')
  const [odelGuid, setOdelGuid] = useState<string | null>(null)
  const [appRefNo, setAppRefNo] = useState('')
  const [saveStatus, setSaveStatus] = useState(0)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [declarationAccepted, setDeclarationAccepted] = useState(false)
  const [declarationError, setDeclarationError] = useState<string | null>(null)
  const [form, setForm] = useState<GeneralForm>(EMPTY_FORM)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [savedLabels, setSavedLabels] = useState<SavedLabels>(EMPTY_LABELS)
  // Documents uploaded in this session. The search response carries no
  // document info, so this (plus "leave empty to keep") is all the page knows.
  const [savedDocs, setSavedDocs] = useState<Set<string>>(new Set())
  const started = mode === 'new' || !!odelGuid

  function patch(p: Partial<GeneralForm>) {
    setForm(f => ({ ...f, ...p }))
    setErrors(prev => {
      const keys = Object.keys(p).filter(k => prev[k])
      if (!keys.length) return prev
      const next = { ...prev }
      for (const k of keys) delete next[k]
      return next
    })
  }

  function bumpStatus(next: number) { setSaveStatus(prev => Math.max(prev, next)) }

  function resetAll(nextMode: 'new' | 'existing') {
    setMode(nextMode)
    setOdelGuid(null); setAppRefNo(''); setSaveStatus(0); setIsSubmitted(false)
    setDeclarationAccepted(false); setDeclarationError(null)
    setForm(EMPTY_FORM); setErrors({}); setSavedLabels(EMPTY_LABELS); setSavedDocs(new Set())
    setActiveTab('general')
    setLookupRef(''); setLookupEmail(''); setLookupErrors({}); setLookupFailed(null)
    setQualForm(EMPTY_QUAL); setQualErrors({})
    setPhotoLocal(null); setPhotoError(null)
    setSlipLocal(null); setSlipError(null)
  }

  function switchMode(next: 'new' | 'existing') {
    if (next === mode) return
    resetAll(next)
  }

  function applyApplication(a: OdelApplication) {
    setOdelGuid(a.odelApplicationGuid)
    setAppRefNo(a.appRefNo)
    setSaveStatus(a.saveStatus)
    setIsSubmitted(a.status === 1)
    setDeclarationAccepted(false)
    setDeclarationError(null)
    setSavedLabels({ campusName: a.campusName, programName: a.programName, semesterName: a.semesterName })
    setSavedDocs(new Set())
    setErrors({})
    setForm({
      firstName: a.firstName ?? '',
      lastName: a.lastName ?? '',
      gender: a.gender != null ? GENDERS[a.gender] ?? '' : '',
      dob: (a.dob ?? '').slice(0, 10),
      countryGuid: a.countryGuid ?? '',
      nationalId: a.nationalId ?? '',
      nationalIdFile: null,
      email: a.email ?? '',
      phoneCode: (a.phoneCode ?? '').replace(/^\+/, ''),
      phone: a.phone ?? '',
      campusGuid: a.campusGuid ?? '',
      programGuid: a.programGuid ?? '',
      semesterGuid: a.semesterGuid ?? '',
      batchTimeGuid: a.batchTimeGuid ?? '',
      passportNo: a.passportNo ?? '',
      passportFile: null,
      vStartDate: (a.vStartDate ?? '').slice(0, 10),
      vEndDate: (a.vEndDate ?? '').slice(0, 10),
      visaFile: null,
      isRefugee: a.refugee === 1,
      refugeeId: a.refugeeId ?? '',
      spName: a.spName ?? '',
      spEmail: a.spEmail ?? '',
      spCountryGuid: a.spCountryGuid ?? '',
      spPhone: a.spPhone ?? '',
    })
    // Resume on the first step that still needs work.
    setActiveTab(a.saveStatus >= ODEL_SAVE_STATUS.photo ? 'payment' : a.saveStatus >= ODEL_SAVE_STATUS.qualification ? 'photo' : a.saveStatus >= ODEL_SAVE_STATUS.general ? 'qualifications' : 'general')
  }

  function handleLookup() {
    const e: Record<string, string> = {}
    if (!lookupRef.trim()) e.lookupRef = 'Application Reference Number is required'
    else if (lookupRef.trim().length > 50) e.lookupRef = 'Reference number must be 50 characters or fewer'
    if (!lookupEmail.trim()) e.lookupEmail = 'Registered email is required'
    else if (!EMAIL_RE.test(lookupEmail.trim()) || lookupEmail.trim().length > EMAIL_MAX) e.lookupEmail = 'Enter a valid email address.'
    setLookupErrors(e)
    setLookupFailed(null)
    if (Object.keys(e).length) { scrollToFirstError(e); return }
    searchApplication.mutate({ appRefNo: lookupRef, email: lookupEmail }, {
      onSuccess: a => { applyApplication(a); showToast(`Application ${a.appRefNo} loaded`, 'success') },
      // Same message for a wrong ref no. or a wrong email (so neither is revealed),
      // and for an already-submitted application.
      onError: (error: Error) => setLookupFailed(error.message || 'Could not find the application.'),
    })
  }

  // ── Dropdown sources ──────────────────────────────────────────────────────
  const [countrySearch, setCountrySearch] = useState('')
  const committedCountrySearch = useDebounced(countrySearch.trim(), 300)
  const [countryPickerOpen, setCountryPickerOpen] = useState(false)
  const [phoneCodePickerOpen, setPhoneCodePickerOpen] = useState(false)
  const [spPickerOpen, setSpPickerOpen] = useState(false)
  const countryQuery = useSearchCountriesInfinite(committedCountrySearch, 20, countryPickerOpen || phoneCodePickerOpen || spPickerOpen)
  const countries = useMemo(() => flattenUniquePages(countryQuery.data?.pages ?? [], c => c.countryGuid), [countryQuery.data])
  const { home: homeCountry, known: knownCountries } = useKnownCountries(countries)
  // Saved country guids that neither the home lookup nor the picker has loaded.
  const { countries: savedCountries } = useCountriesByGuids(
    [form.countryGuid, form.spCountryGuid].filter(g => g && !knownCountries.some(c => c.countryGuid === g)),
  )
  const allCountries = useMemo(() => {
    const map = new Map(knownCountries.map(c => [c.countryGuid, c]))
    for (const c of savedCountries) if (!map.has(c.countryGuid)) map.set(c.countryGuid, c)
    return Array.from(map.values())
  }, [knownCountries, savedCountries])

  const countryOptions = countryPickerOptions(countries, allCountries, form.countryGuid)
  const spPhoneCountryOptions = phoneCountryOptions(countries, allCountries, form.spCountryGuid)
  // The student's own dial code is stored as plain digits ("256"), not a GUID.
  const phoneCodeOptions = useMemo(() => {
    const map = new Map<string, string>()
    for (const c of [...allCountries, ...countries]) {
      const code = dialCode(c).replace(/^\+/, '')
      if (code && !map.has(code)) map.set(code, `+${code} · ${c.countryName}`)
    }
    if (form.phoneCode && !map.has(form.phoneCode)) map.set(form.phoneCode, `+${form.phoneCode}`)
    return toOptions(map)
  }, [allCountries, countries, form.phoneCode])

  const pickerProps = {
    onSearch: setCountrySearch,
    isLoading: countryQuery.isLoading,
    hasNextPage: countryQuery.hasNextPage,
    isFetchingNextPage: countryQuery.isFetchingNextPage,
    onLoadMore: () => countryQuery.fetchNextPage(),
  }

  // Default the dial codes to the home country (Uganda), like the enquiry forms.
  useEffect(() => {
    if (!homeCountry) return
    setForm(f => {
      const next = { ...f }
      if (!f.phoneCode) next.phoneCode = dialCode(homeCountry).replace(/^\+/, '')
      if (!f.spCountryGuid) next.spCountryGuid = homeCountry.countryGuid
      return next.phoneCode === f.phoneCode && next.spCountryGuid === f.spCountryGuid ? f : next
    })
  }, [homeCountry, form.phoneCode, form.spCountryGuid])

  const [campusSearch, setCampusSearch] = useState('')
  const committedCampusSearch = useDebounced(campusSearch.trim(), 300)
  const campusQuery = useSearchCampusesInfinite(committedCampusSearch, 20, started)
  const campuses = useMemo(() => flattenUniquePages(campusQuery.data?.pages ?? [], c => c.campusGuid), [campusQuery.data])

  const [programSearch, setProgramSearch] = useState('')
  const committedProgramSearch = useDebounced(programSearch.trim(), 300)
  const programQuery = useSearchProgramMastersByCampusInfinite(form.campusGuid, committedProgramSearch, 20, started)
  const programs = useMemo(() => flattenUniquePages(programQuery.data?.pages ?? [], p => p.programGuid), [programQuery.data])

  const { data: semesters = [] } = useSemestersForProgram(form.programGuid, started && !!form.programGuid)
  const { data: batchTimes = [] } = useBatchTimesDropdown(started)

  // The saved value is always listed, even when the paged list hasn't loaded it.
  const campusOptions = useMemo(() => {
    const m = new Map<string, string>()
    for (const c of campuses) m.set(c.campusGuid, c.campusName)
    if (form.campusGuid && !m.has(form.campusGuid)) m.set(form.campusGuid, savedLabels.campusName ?? 'Selected campus')
    return toOptions(m)
  }, [campuses, form.campusGuid, savedLabels.campusName])
  const programOptions = useMemo(() => {
    const m = new Map<string, string>()
    for (const p of programs) m.set(p.programGuid, `${p.programName} (${p.programCode})`)
    if (form.programGuid && !m.has(form.programGuid)) m.set(form.programGuid, savedLabels.programName ?? 'Selected programme')
    return toOptions(m)
  }, [programs, form.programGuid, savedLabels.programName])
  const semesterOptions = useMemo(() => {
    const m = new Map<string, string>()
    for (const s of semesters) m.set(s.semesterGuid, s.semName)
    if (form.semesterGuid && !m.has(form.semesterGuid) && form.programGuid) m.set(form.semesterGuid, savedLabels.semesterName ?? 'Selected semester')
    return toOptions(m)
  }, [semesters, form.semesterGuid, form.programGuid, savedLabels.semesterName])
  const batchTimeOptions = batchTimes.map(bt => ({ value: bt.batchTimeGuid, label: bt.batchTime }))

  // Default country (Uganda) needs a National ID; any other needs a passport.
  const isForeign = form.countryGuid !== '' && !!homeCountry && form.countryGuid !== homeCountry.countryGuid
  const nationalIdRequired = form.countryGuid !== '' && !isForeign

  // ── General: validate + save ──────────────────────────────────────────────
  const saveGeneral = useSaveOdelGeneral()

  function validateGeneral(): Record<string, string> {
    const f = form
    const e: Record<string, string> = {}
    const first = f.firstName.trim()
    const last = f.lastName.trim()
    if (!first) e.firstName = 'First Name is required'
    else if (!NAME_RE.test(first)) e.firstName = 'First name must contain only letters and spaces.'
    else if (first.length > NAME_MAX) e.firstName = `First Name must be ${NAME_MAX} characters or fewer`
    if (!last) e.lastName = 'Last Name is required'
    else if (!NAME_RE.test(last)) e.lastName = 'Last name must contain only letters and spaces.'
    else if (last.length > NAME_MAX) e.lastName = `Last Name must be ${NAME_MAX} characters or fewer`
    if (!f.gender) e.gender = 'Gender is required'
    if (!f.dob) e.dob = 'Date of Birth is required'
    else if (f.dob > todayYmd()) e.dob = 'Date of birth cannot be in the future.'
    else if (f.dob > latestDobYmd()) e.dob = 'Age must be at least 10 years.'
    if (!f.countryGuid) e.countryGuid = 'Nationality is required'
    if (!f.email.trim()) e.email = 'Email is required'
    else if (!EMAIL_RE.test(f.email.trim()) || f.email.trim().length > EMAIL_MAX) e.email = 'Enter a valid email address.'
    if (!f.phoneCode) e.phone = 'Select the phone country code'
    else if (!f.phone) e.phone = 'Phone is required'
    else if (f.phone.length < PHONE_MIN || f.phone.length > PHONE_MAX) e.phone = 'Phone number must contain 7 to 15 digits.'
    else if (f.phone.startsWith('0')) e.phone = 'Phone number should not start with zero(0).'
    if (nationalIdRequired && !f.nationalId.trim()) e.nationalId = 'National ID is required.'
    else if (f.nationalId.trim().length > ID_MAX) e.nationalId = `National ID must be ${ID_MAX} characters or fewer`
    if (isForeign && !f.passportNo.trim()) e.passportNo = 'Passport number is required.'
    else if (f.passportNo.trim().length > ID_MAX) e.passportNo = `Passport number must be ${ID_MAX} characters or fewer`
    const idErr = docFileError(f.nationalIdFile, 'National ID file'); if (idErr) e.nationalIdFile = idErr
    const ppErr = docFileError(f.passportFile, 'Passport file'); if (ppErr) e.passportFile = ppErr
    const visaErr = docFileError(f.visaFile, 'Visa file'); if (visaErr) e.visaFile = visaErr
    if (f.vStartDate && f.vEndDate && f.vEndDate < f.vStartDate) e.vEndDate = 'Visa end date cannot be before the start date.'
    if (!f.campusGuid) e.campusGuid = 'Campus is required'
    if (!f.programGuid) e.programGuid = 'Programme is required'
    if (!f.semesterGuid) e.semesterGuid = 'Semester is required'
    if (!f.batchTimeGuid) e.batchTimeGuid = 'Batch Time is required'
    if (f.isRefugee && !f.refugeeId.trim()) e.refugeeId = 'Refugee ID is required when refugee status is selected.'
    if (f.spName.trim().length > NAME_MAX) e.spName = `Sponsor Name must be ${NAME_MAX} characters or fewer`
    if (f.spEmail.trim() && (!EMAIL_RE.test(f.spEmail.trim()) || f.spEmail.trim().length > EMAIL_MAX)) e.spEmail = 'Enter a valid sponsor email'
    if (f.spPhone) {
      if (f.spPhone.length < PHONE_MIN || f.spPhone.length > PHONE_MAX) e.spPhone = 'Sponsor phone number must contain 7 to 15 digits.'
      else if (!f.spCountryGuid) e.spPhone = 'Sponsor phone country is required when sponsor phone is given.'
    }
    return e
  }

  // Server rule failures that belong to a specific field, so they show inline.
  function generalServerFieldError(message: string): Record<string, string> | null {
    const rules: [RegExp, string][] = [
      [/national id file/i, 'nationalIdFile'], [/passport file/i, 'passportFile'], [/visa file/i, 'visaFile'],
      [/first name/i, 'firstName'], [/last name/i, 'lastName'],
      [/date of birth|age must/i, 'dob'], [/gender/i, 'gender'],
      [/sponsor phone/i, 'spPhone'], [/sponsor email/i, 'spEmail'],
      [/phone number/i, 'phone'], [/national id/i, 'nationalId'], [/passport number/i, 'passportNo'],
      [/visa end date/i, 'vEndDate'], [/refugee id/i, 'refugeeId'],
      [/country not found/i, 'countryGuid'], [/campus not found/i, 'campusGuid'], [/programme not found/i, 'programGuid'],
      [/semester not found/i, 'semesterGuid'], [/batch time not found/i, 'batchTimeGuid'],
    ]
    const hit = rules.find(([re]) => re.test(message))
    return hit ? { [hit[1]]: message } : null
  }

  function handleSaveGeneral() {
    const e = validateGeneral()
    setErrors(e)
    if (Object.keys(e).length) { scrollToFirstError(e); return }
    const f = form
    saveGeneral.mutate({
      odelApplicationGuid: odelGuid,
      emailId: f.email.trim(),
      dob: f.dob,
      firstName: f.firstName.trim(),
      lastName: f.lastName.trim(),
      gender: GENDERS.indexOf(f.gender),
      countryGuid: f.countryGuid,
      phoneCode: f.phoneCode,
      phone: f.phone,
      nationalId: f.nationalId.trim() || null,
      nationalIdFile: f.nationalIdFile,
      passportNo: f.passportNo.trim() || null,
      passportFile: f.passportFile,
      vStartDate: f.vStartDate || null,
      vEndDate: f.vEndDate || null,
      visaFile: f.visaFile,
      spName: f.spName.trim() || null,
      spEmail: f.spEmail.trim() || null,
      spPhone: f.spPhone || null,
      // The dial-code country only goes out alongside an actual sponsor number.
      spCountryGuid: f.spPhone ? f.spCountryGuid || null : null,
      campusGuid: f.campusGuid,
      programGuid: f.programGuid,
      semesterGuid: f.semesterGuid,
      batchTimeGuid: f.batchTimeGuid,
      refugee: f.isRefugee ? 1 : 0,
      refugeeId: f.isRefugee ? f.refugeeId.trim() || null : null,
    }, {
      onSuccess: res => {
        setOdelGuid(res.odelApplicationGuid)
        setAppRefNo(res.appRefNo)
        bumpStatus(res.saveStatus)
        // Files are stored now; keep a note of which ones, and drop the picks.
        setSavedDocs(prev => {
          const next = new Set(prev)
          if (f.nationalIdFile) next.add('nationalId')
          if (f.passportFile) next.add('passport')
          if (f.visaFile) next.add('visa')
          return next
        })
        setForm(cur => ({ ...cur, nationalIdFile: null, passportFile: null, visaFile: null }))
        showToast(res.isFirstSave ? `General details saved — ODeL Ref No ${res.appRefNo}` : 'General details updated', 'success')
        setActiveTab('qualifications')
        if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
      },
      onError: (error: Error) => {
        const message = error.message || 'Failed to save the General details'
        if (BLOCKING_ERROR_RE.test(message)) { setFailure({ title: "Couldn't Save Application", message }); return }
        const fieldErr = generalServerFieldError(message)
        if (fieldErr) { setErrors(prev => ({ ...prev, ...fieldErr })); scrollToFirstError(fieldErr); return }
        showToast(message, 'error')
      },
    })
  }

  // ── Qualifications ────────────────────────────────────────────────────────
  const { data: qualifications = [], isLoading: qualsLoading } = useOdelQualifications(odelGuid)
  const saveQualification = useSaveOdelQualification()
  const deleteQualification = useDeleteOdelQualification()
  const [qualForm, setQualForm] = useState<QualForm>(EMPTY_QUAL)
  const [qualErrors, setQualErrors] = useState<Record<string, string>>({})
  const [deleteTarget, setDeleteTarget] = useState<OdelQualification | null>(null)
  const editingQual = qualForm.qualGuid != null

  function patchQual(p: Partial<QualForm>) {
    setQualForm(q => ({ ...q, ...p }))
    setQualErrors(prev => {
      const keys = Object.keys(p).filter(k => prev[k])
      if (!keys.length) return prev
      const next = { ...prev }
      for (const k of keys) delete next[k]
      return next
    })
  }

  function validateQual(): Record<string, string> {
    const q = qualForm
    const e: Record<string, string> = {}
    if (!q.institution.trim()) e.institution = 'Institution is required'
    else if (!/\p{L}/u.test(q.institution)) e.institution = 'Institution name must contain letters and cannot be only numbers.'
    else if (q.institution.trim().length > QUAL_TEXT_MAX) e.institution = `Institution must be ${QUAL_TEXT_MAX} characters or fewer`
    if (!q.university.trim()) e.university = 'University / Awarding Board is required'
    else if (!/\p{L}/u.test(q.university)) e.university = 'University / board name must contain letters and cannot be only numbers.'
    else if (q.university.trim().length > QUAL_TEXT_MAX) e.university = `University / Awarding Board must be ${QUAL_TEXT_MAX} characters or fewer`
    // The server checks against the current year.
    const thisYear = new Date().getFullYear()
    const year = Number(q.passYear)
    if (!q.passYear) e.passYear = 'Year is required'
    else if (!Number.isInteger(year) || year < PASS_YEAR_MIN || year > thisYear) e.passYear = `Year must be between ${PASS_YEAR_MIN} and ${thisYear}`
    if (!q.grade.trim()) e.grade = 'Grade is required'
    else if (q.grade.trim().length > QUAL_GRADE_MAX) e.grade = `Grade must be ${QUAL_GRADE_MAX} characters or fewer`
    const years = Number(q.yearsTaken)
    if (!q.yearsTaken) e.yearsTaken = 'Duration is required'
    else if (!Number.isInteger(years) || years < QUAL_DURATION_MIN || years > QUAL_DURATION_MAX) e.yearsTaken = 'Duration must be between 1 and 10 years.'
    // Required on add; on update an empty pick keeps the stored proof.
    if (!q.qualGuid && !q.proofFile) e.proofFile = 'Proof Document is required.'
    const proofErr = docFileError(q.proofFile, 'Proof document'); if (proofErr) e.proofFile = proofErr
    return e
  }

  function qualServerFieldError(message: string): Record<string, string> | null {
    if (/institution name/i.test(message)) return { institution: message }
    if (/university \/ board name/i.test(message)) return { university: message }
    if (/duration must be/i.test(message)) return { yearsTaken: message }
    if (/pass ?year|year of completion/i.test(message)) return { passYear: message }
    if (/grade/i.test(message)) return { grade: message }
    if (/proof document/i.test(message)) return { proofFile: message }
    return null
  }

  function handleSaveQual() {
    if (!odelGuid) return
    const e = validateQual()
    setQualErrors(e)
    if (Object.keys(e).length) { scrollToFirstError(e); return }
    const q = qualForm
    saveQualification.mutate({
      odelApplicationGuid: odelGuid,
      odelApplicationQualGuid: q.qualGuid,
      institution: q.institution.trim(),
      university: q.university.trim(),
      passYear: Number(q.passYear),
      grade: q.grade.trim(),
      yearsTaken: Number(q.yearsTaken),
      proofFile: q.proofFile,
    }, {
      onSuccess: res => {
        bumpStatus(res.saveStatus)
        setQualForm(EMPTY_QUAL); setQualErrors({})
        showToast(res.isNew ? 'Qualification added' : 'Qualification updated', 'success')
        setActiveTab('photo')
        if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
      },
      onError: (error: Error) => {
        const message = error.message || 'Failed to save the qualification'
        if (BLOCKING_ERROR_RE.test(message)) { setFailure({ title: "Couldn't Save Qualification", message }); return }
        const fieldErr = qualServerFieldError(message)
        if (fieldErr) { setQualErrors(prev => ({ ...prev, ...fieldErr })); scrollToFirstError(fieldErr); return }
        showToast(message, 'error')
      },
    })
  }

  function startEditQual(row: OdelQualification) {
    setQualErrors({})
    setQualForm({
      qualGuid: row.odelApplicationQualGuid,
      institution: row.institution,
      university: row.university,
      passYear: String(row.passYear),
      grade: row.grade,
      yearsTaken: String(row.yearsTaken),
      proofFile: null,
    })
  }

  function confirmDeleteQual() {
    if (!odelGuid || !deleteTarget) return
    deleteQualification.mutate({ odelApplicationGuid: odelGuid, qualificationGuid: deleteTarget.odelApplicationQualGuid }, {
      onSuccess: () => {
        if (qualForm.qualGuid === deleteTarget.odelApplicationQualGuid) { setQualForm(EMPTY_QUAL); setQualErrors({}) }
        setDeleteTarget(null)
        showToast('Qualification removed', 'success')
      },
      onError: (error: Error) => { setDeleteTarget(null); showToast(error.message || 'Failed to delete the qualification', 'error') },
    })
  }

  // ── Photo & payment slip ──────────────────────────────────────────────────
  const { data: serverPhotoUrl = null } = useOdelPhoto(odelGuid)
  const { data: serverSlipUrl = null } = useOdelPaymentSlip(odelGuid)
  const uploadPhoto = useUploadOdelPhoto()
  const uploadSlip = useUploadOdelPaymentSlip()
  const photoInputRef = useRef<HTMLInputElement>(null)
  const slipInputRef = useRef<HTMLInputElement>(null)
  const [photoLocal, setPhotoLocal] = useState<File | null>(null)
  const [slipLocal, setSlipLocal] = useState<File | null>(null)
  const [photoError, setPhotoError] = useState<string | null>(null)
  const [slipError, setSlipError] = useState<string | null>(null)
  const [photoDrag, setPhotoDrag] = useState(false)
  const [slipDrag, setSlipDrag] = useState(false)
  const photoLocalUrl = useObjectUrl(photoLocal)
  const slipLocalUrl = useObjectUrl(slipLocal)
  const photoThumb = useImageSrc(photoLocalUrl ?? serverPhotoUrl)
  const slipThumb = useImageSrc(slipLocalUrl ?? serverSlipUrl)
  const hasPhoto = !!photoLocal || !!serverPhotoUrl
  const hasSlip = !!slipLocal || !!serverSlipUrl

  // Picking (or dropping) a file uploads it straight away — one step, no
  // separate "Upload" button to miss.
  function handlePhotoPicked(file: File | null) {
    if (photoInputRef.current) photoInputRef.current.value = ''
    if (!file || !odelGuid) return
    const err = fileError(file, 'Photo', PHOTO_EXT_RE, 'JPG, PNG or BMP image')
    if (err) {
      setPhotoError(file.size === 0 ? 'The photo is empty.' : !PHOTO_EXT_RE.test(file.name) ? 'Only JPG, PNG, or BMP images are accepted.' : 'Photo size cannot exceed 5 MB.')
      scrollToFirstError({ photo: 'x' })
      return
    }
    setPhotoError(null)
    setPhotoLocal(file)
    uploadPhoto.mutate({ odelApplicationGuid: odelGuid, photo: file }, {
      onSuccess: res => {
        bumpStatus(res.saveStatus)
        showToast('Photo saved', 'success')
        setActiveTab('payment')
        if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
      },
      onError: (error: Error) => {
        setPhotoLocal(null)
        setPhotoError(error.message || "Couldn't upload the photo.")
        scrollToFirstError({ photo: 'x' })
      },
    })
  }

  function handleSlipPicked(file: File | null) {
    if (slipInputRef.current) slipInputRef.current.value = ''
    if (!file || !odelGuid) return
    if (file.size === 0 || !DOC_EXT_RE.test(file.name) || file.size > MAX_FILE_BYTES) {
      setSlipError(file.size === 0 ? 'The payment slip is empty.' : !DOC_EXT_RE.test(file.name) ? 'Only PDF, JPG or PNG files are accepted.' : 'Payment slip size cannot exceed 5 MB.')
      scrollToFirstError({ slip: 'x' })
      return
    }
    setSlipError(null)
    setSlipLocal(file)
    uploadSlip.mutate({ odelApplicationGuid: odelGuid, slip: file }, {
      onSuccess: res => {
        bumpStatus(res.saveStatus)
        showToast('Payment slip saved. Please accept declaration and submit.', 'success')
        setTimeout(() => {
          const el = document.getElementById('declaration-section')
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }, 200)
      },
      onError: (error: Error) => {
        setSlipLocal(null)
        setSlipError(error.message || "Couldn't upload the payment slip.")
        scrollToFirstError({ slip: 'x' })
      },
    })
  }

  function handleSubmitApplication() {
    if (!odelGuid) return
    if (!hasSlip) {
      showToast('Please upload the payment slip before submitting.', 'error')
      return
    }
    if (qualifications.length === 0) {
      showToast('Please add at least one Educational Qualification before submitting.', 'error')
      return
    }
    if (!declarationAccepted) {
      setDeclarationError('You must accept the declaration to submit your application.')
      showToast('You must accept the declaration to submit your application.', 'error')
      return
    }
    setDeclarationError(null)
    submitApplication.mutate(
      { odelApplicationGuid: odelGuid, declarationAccepted: true },
      {
        onSuccess: () => {
          setIsSubmitted(true)
          showToast('Application registration successfully done!', 'success')
        },
        onError: (err: any) => {
          const msg = extractApiErrorMessage(err, 'Failed to submit application.')
          if (BLOCKING_ERROR_RE.test(msg)) {
            setFailure({ title: 'Application Locked', message: msg })
          } else {
            showToast(msg, 'error')
          }
        },
      }
    )
  }

  const [docPreview, setDocPreview] = useState<{ url: string; title: string } | null>(null)

  // ── Derived UI state ──────────────────────────────────────────────────────
  const progressPct = Math.round((Math.min(saveStatus, 4) / 4) * 100)
  const applicantName = `${form.firstName} ${form.lastName}`.trim()
  const currentIndex = TABS.findIndex(t => t.id === activeTab)
  const activeTabDef = TABS[currentIndex]
  const allDone = saveStatus >= ODEL_SAVE_STATUS.paymentSlip

  // A step opens once the previous one is saved (saveStatus only moves up).
  const isLocked = (step: number) => step > 1 && saveStatus < step - 1
  const isDone = (step: number) => saveStatus >= step

  return (
    <div id="page-filing" className="pt-2 pb-12">
      {/* ── Page Header ────────────────────────────────────────────────────── */}
      <div className="pg-hdr">
        <div>
          <h1 className="text-xl font-bold text-g900">ODeL Application</h1>
          <p className="text-sm text-g500 mt-1">
            Online &amp; Distance e-Learning applications — start a new application or continue an existing one with its reference number and registered email.
          </p>
        </div>
      </div>

      {/* ── Mode Selection Card (Matching Image 1 & 2) ────────────────────────── */}
      <div className="card mb-5 p-5">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2.5">
            <span className="sec-icon-badge"><i className="lni lni-world" /></span>
            <div>
              <h2 className="font-bold text-g800 text-base leading-tight">Application</h2>
              <p className="text-xs text-g500 mt-0.5">Start a fresh application or continue filing an existing one</p>
            </div>
          </div>

          {/* Segmented Pill Switcher (Matches Image 2 exactly) */}
          <div className="inline-flex items-center p-1 bg-slate-100/90 border border-slate-200/90 rounded-2xl gap-1 shadow-2xs">
            <button
              type="button"
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                mode === 'new'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'bg-transparent text-slate-600 hover:text-slate-900 font-medium'
              }`}
              onClick={() => switchMode('new')}
            >
              <i className="lni lni-plus font-bold" /> New Application
            </button>
            <button
              type="button"
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                mode === 'existing'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'bg-transparent text-slate-600 hover:text-slate-900 font-medium'
              }`}
              onClick={() => switchMode('existing')}
            >
              <i className="lni lni-search-alt" /> Existing Application
            </button>
          </div>
        </div>

        {/* Existing Application Lookup Form (Shown in Card 1 when mode === 'existing' and no app loaded) */}
        {mode === 'existing' && !odelGuid && (
          <div className="mt-5 pt-5 border-t border-slate-100">
            <div className="max-w-xl mx-auto">
              <div className="mb-4 text-center">
                <div className="w-10 h-10 mx-auto rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-lg mb-2 shadow-xs">
                  <i className="lni lni-search-alt" />
                </div>
                <h3 className="text-base font-bold text-g900">Find Existing Application</h3>
                <p className="text-xs text-g500 mt-1">
                  Enter your Application Reference Number and registered email to continue filing.
                </p>
              </div>

              <div className="g2">
                <Field label="Application Reference Number" req error={lookupErrors.lookupRef}>
                  <Input
                    placeholder="e.g. ODeL20261/75"
                    maxLength={50}
                    value={lookupRef}
                    hasError={!!lookupErrors.lookupRef}
                    onChange={v => { setLookupRef(v); setLookupErrors(p => ({ ...p, lookupRef: '' })); setLookupFailed(null) }}
                  />
                </Field>
                <Field label="Registered Email" req error={lookupErrors.lookupEmail}>
                  <Input
                    type="email"
                    placeholder="email@example.com"
                    maxLength={EMAIL_MAX}
                    value={lookupEmail}
                    hasError={!!lookupErrors.lookupEmail}
                    onChange={v => { setLookupEmail(v); setLookupErrors(p => ({ ...p, lookupEmail: '' })); setLookupFailed(null) }}
                  />
                </Field>
              </div>

              {lookupFailed && (
                <p className="text-clr-red mt-3 flex items-center justify-center gap-1.5 text-xs font-medium" role="alert">
                  <i className="lni lni-warning" /> {lookupFailed}
                </p>
              )}

              <div className="flex justify-end mt-4">
                <button
                  type="button"
                  className="btn btn-primary px-5"
                  disabled={searchApplication.isPending}
                  onClick={handleLookup}
                >
                  <i className="lni lni-search-alt" /> {searchApplication.isPending ? 'Searching…' : 'Find Application'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Active Application Wizard Card (New application OR Existing application that was loaded) ── */}
      {started && (
        <div id="odel-wizard-card" className="card p-0 overflow-hidden shadow-xs mb-6">
          {odelGuid && (
            <div className="px-5 pt-5 pb-1">
              <div className="applicant-profile-strip">
                <span className="av-chip">{initials(applicantName)}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-g900">{applicantName || 'Applicant'}</span>
                    <span className="badge badge-blue">{appRefNo}</span>
                    {isSubmitted ? (
                      <span className="badge badge-green"><i className="lni lni-checkmark-circle" /> Submitted</span>
                    ) : allDone ? (
                      <span className="badge badge-green"><i className="lni lni-checkmark-circle" /> Complete</span>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-4 mt-1 flex-wrap">
                    <span className="text-xs text-g500 flex items-center gap-1">
                      <i className="lni lni-envelope text-g400" /> {form.email || '—'}
                    </span>
                    <span className="text-xs text-g500 flex items-center gap-1">
                      <i className="lni lni-phone text-g400" /> {form.phone ? `+${form.phoneCode} ${form.phone}` : '—'}
                    </span>
                  </div>
                  <p className="text-xs text-g400 mt-1">
                    The applicant resumes this application later with this reference number and the registered email.
                  </p>
                </div>
                <button type="button" className="btn btn-neu btn-sm" onClick={() => resetAll(mode)}>
                  <i className="lni lni-reload" /> Start Over
                </button>
              </div>
            </div>
          )}

          {/* ── Wizard Tabs Navigation Bar (Modern, UX-friendly & Responsive) ── */}
          <div className="border-b border-slate-200/80 bg-slate-50/70 px-4 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar flex-nowrap" role="tablist">
              {TABS.map((t, i) => {
                const locked = isLocked(t.step)
                const done = isDone(t.step)
                const active = activeTab === t.id
                return (
                  <Fragment key={t.id}>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={active}
                      disabled={locked}
                      title={locked ? 'Save previous steps to unlock' : undefined}
                      className={`px-3 sm:px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 shrink-0 ${
                        active
                          ? 'bg-white text-blue-600 border border-blue-200 shadow-xs'
                          : done
                          ? 'bg-white/80 hover:bg-white text-slate-800 border border-slate-200/70 hover:border-slate-300 cursor-pointer'
                          : locked
                          ? 'opacity-50 cursor-not-allowed bg-transparent text-slate-400 border border-transparent'
                          : 'bg-transparent hover:bg-white/60 text-slate-700 border border-transparent cursor-pointer'
                      }`}
                      onClick={() => !locked && setActiveTab(t.id)}
                    >
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                          active
                            ? 'bg-blue-600 text-white shadow-2xs'
                            : done
                            ? 'bg-emerald-500 text-white'
                            : locked
                            ? 'bg-slate-200 text-slate-500'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {done ? <i className="lni lni-checkmark font-bold" /> : locked ? <i className="lni lni-lock" /> : t.step}
                      </span>
                      <span>{t.label}</span>
                      {active && (
                        <span className="hidden lg:inline-block text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.2 rounded-full font-bold">
                          Current
                        </span>
                      )}
                      {done && !active && (
                        <span className="hidden lg:inline-block text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.2 rounded-full font-semibold">
                          Done
                        </span>
                      )}
                    </button>
                    {i < TABS.length - 1 && (
                      <span className="text-slate-300 text-xs shrink-0 select-none hidden sm:inline-block">
                        <i className="lni lni-chevron-right" />
                      </span>
                    )}
                  </Fragment>
                )
              })}
            </div>

            {/* Overall Progress Indicator */}
            <div className="flex items-center gap-2.5 bg-white border border-slate-200/90 rounded-xl px-3 py-1.5 shrink-0 shadow-2xs self-start md:self-auto">
              <div className="text-right">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Progress</div>
                <div className="text-xs font-bold text-slate-800 tabular-nums">{progressPct}% Complete</div>
              </div>
              <div className="w-16 sm:w-24 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                <div
                  className="h-full bg-blue-600 transition-all duration-300 rounded-full"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          </div>

          <div className="p-5 tab-panel-in" key={activeTab}>
            <div className="filing-step-hdr">
              <i className={`lni ${activeTabDef.icon}`} />
              <div>
                <div className="filing-step-hdr-title">{activeTabDef.label}</div>
                <div className="filing-step-hdr-desc">{activeTabDef.desc}</div>
              </div>
            </div>

              {/* ── 1 · General ───────────────────────────────────────────── */}
              {activeTab === 'general' && (
                <div className="filing-stage-layout">
                  <div className="filing-form-col">
                    <div className="g3">
                      <Field label="First Name" req error={errors.firstName}>
                        <Input placeholder="First name" maxLength={NAME_MAX} value={form.firstName} hasError={!!errors.firstName}
                          onChange={v => patch({ firstName: v.replace(/[^\p{L}\p{M} ]/gu, '') })} />
                      </Field>
                      <Field label="Last Name" req error={errors.lastName}>
                        <Input placeholder="Last name" maxLength={NAME_MAX} value={form.lastName} hasError={!!errors.lastName}
                          onChange={v => patch({ lastName: v.replace(/[^\p{L}\p{M} ]/gu, '') })} />
                      </Field>
                      <Field label="Gender" req error={errors.gender}>
                        <SearchSelect options={GENDERS} value={form.gender} placeholder="-- Select Gender --" onChange={v => patch({ gender: v })} />
                      </Field>
                    </div>
                    <div className="g3 mt-3">
                      <Field label="Date of Birth" req error={errors.dob}>
                        <DatePicker value={form.dob} onChange={v => patch({ dob: v })} placeholder="dd/mm/yyyy" maxYmd={latestDobYmd()}
                          rangeMessage="Applicant must be at least 10 years old" hasError={!!errors.dob} />
                      </Field>
                      <Field label="Nationality" req error={errors.countryGuid}>
                        <SearchSelect options={countryOptions} value={form.countryGuid} placeholder="-- Select Country --"
                          onChange={v => patch({ countryGuid: v })} onOpenChange={setCountryPickerOpen}
                          {...pickerProps} />
                      </Field>
                      <Field label="National ID" req={nationalIdRequired} error={errors.nationalId}>
                        <Input placeholder="CM12345678ABCD" maxLength={ID_MAX} value={form.nationalId} hasError={!!errors.nationalId}
                          onChange={v => patch({ nationalId: v })} />
                      </Field>
                    </div>
                    <div className="g3 mt-3">
                      <Field label="Email" req error={errors.email}>
                        <Input type="email" placeholder="email@example.com" maxLength={EMAIL_MAX} value={form.email} hasError={!!errors.email}
                          onChange={v => patch({ email: v })} />
                      </Field>
                      <Field label="Phone" req error={errors.phone}>
                        <div className="flex gap-2">
                          <SearchSelect options={phoneCodeOptions} value={form.phoneCode}
                            onChange={v => patch({ phoneCode: v, ...(errors.phone ? {} : {}) })} onOpenChange={setPhoneCodePickerOpen}
                            {...pickerProps} style={{ width: 108, flexShrink: 0 }} />
                          <input className="ctrl flex-1" type="tel" inputMode="numeric" placeholder="e.g. 772123456" maxLength={PHONE_MAX}
                            value={form.phone} style={errors.phone ? { borderColor: 'var(--red)' } : undefined}
                            onChange={e => patch({ phone: e.target.value.replace(/\D/g, '').slice(0, PHONE_MAX) })} />
                        </div>
                      </Field>
                      <Field label="National ID Copy" error={errors.nationalIdFile}
                        hint={savedDocs.has('nationalId') ? 'Uploaded — choose a file only to replace it.' : odelGuid ? 'Leave empty to keep the document already on file.' : 'PDF, JPG or PNG, up to 5 MB.'}>
                        <FileZone file={form.nationalIdFile} onChange={f => patch({ nationalIdFile: f })} hasError={!!errors.nationalIdFile} />
                      </Field>
                    </div>

                    <div className="sec-divider mt-5">Programme Details</div>
                    <div className="g3 mt-3">
                      <Field label="Campus" req error={errors.campusGuid}>
                        <SearchSelect options={campusOptions} value={form.campusGuid} placeholder="-- Select Campus --"
                          onChange={v => patch({ campusGuid: v, programGuid: '', semesterGuid: '' })}
                          onSearch={setCampusSearch}
                          isLoading={campusQuery.isLoading} hasNextPage={campusQuery.hasNextPage}
                          isFetchingNextPage={campusQuery.isFetchingNextPage} onLoadMore={() => campusQuery.fetchNextPage()} />
                      </Field>
                      <Field label="Programme" req error={errors.programGuid}>
                        <SearchSelect options={programOptions} value={form.programGuid}
                          placeholder={form.campusGuid ? '-- Select Programme --' : '-- Select Campus First --'}
                          disabled={!form.campusGuid}
                          onChange={v => patch({ programGuid: v, semesterGuid: '' })}
                          onSearch={setProgramSearch}
                          isLoading={programQuery.isLoading} hasNextPage={programQuery.hasNextPage}
                          isFetchingNextPage={programQuery.isFetchingNextPage} onLoadMore={() => programQuery.fetchNextPage()} />
                      </Field>
                      <Field label="Semester" req error={errors.semesterGuid}>
                        <SearchSelect options={semesterOptions} value={form.semesterGuid}
                          placeholder={form.programGuid ? '-- Select Semester --' : '-- Select Programme First --'}
                          disabled={!form.programGuid} onChange={v => patch({ semesterGuid: v })} />
                      </Field>
                    </div>
                    <div className="g3 mt-3">
                      <Field label="Batch Time" req error={errors.batchTimeGuid}>
                        <SearchSelect options={batchTimeOptions} value={form.batchTimeGuid} placeholder="-- Select Batch Time --"
                          onChange={v => patch({ batchTimeGuid: v })} />
                      </Field>
                      <div className="fg" />
                      <div className="fg" />
                    </div>

                    <div className="sec-divider mt-5">Passport &amp; Visa Details</div>
                    {!isForeign ? (
                      <p className="text-g400 mt-2" style={{ fontSize: 'var(--fs-xs)' }}>
                        Applies to non-Ugandan nationals — select a Nationality above to unlock. Ugandan applicants provide a National ID instead.
                      </p>
                    ) : (
                      <>
                        <p className="text-g400 mt-2" style={{ fontSize: 'var(--fs-xs)' }}>A passport number is required for non-Ugandan applicants. Visa details are optional.</p>
                        <div className="g3 mt-3">
                          <Field label="Passport Number" req error={errors.passportNo}>
                            <Input placeholder="AB1234567" maxLength={ID_MAX} value={form.passportNo} hasError={!!errors.passportNo}
                              onChange={v => patch({ passportNo: v })} />
                          </Field>
                          <Field label="Passport Copy" error={errors.passportFile}
                            hint={savedDocs.has('passport') ? 'Uploaded — choose a file only to replace it.' : odelGuid ? 'Leave empty to keep the document already on file.' : 'PDF, JPG or PNG, up to 5 MB.'}>
                            <FileZone file={form.passportFile} onChange={f => patch({ passportFile: f })} hasError={!!errors.passportFile} />
                          </Field>
                          <div className="fg" />
                        </div>
                        <div className="g3 mt-3">
                          <Field label="Visa Start Date" error={errors.vStartDate}>
                            <DatePicker value={form.vStartDate} onChange={v => patch({ vStartDate: v, vEndDate: errors.vEndDate ? form.vEndDate : form.vEndDate })}
                              placeholder="dd/mm/yyyy" maxYmd={form.vEndDate || undefined}
                              rangeMessage="Visa start date can’t be after the visa end date" hasError={!!errors.vStartDate} />
                          </Field>
                          <Field label="Visa End Date" error={errors.vEndDate}>
                            <DatePicker value={form.vEndDate} onChange={v => patch({ vEndDate: v })}
                              placeholder="dd/mm/yyyy" minYmd={form.vStartDate || undefined}
                              rangeMessage="Visa end date can’t be before the visa start date" hasError={!!errors.vEndDate} />
                          </Field>
                          <Field label="Visa Copy" error={errors.visaFile}
                            hint={savedDocs.has('visa') ? 'Uploaded — choose a file only to replace it.' : odelGuid ? 'Leave empty to keep the document already on file.' : 'PDF, JPG or PNG, up to 5 MB.'}>
                            <FileZone file={form.visaFile} onChange={f => patch({ visaFile: f })} hasError={!!errors.visaFile} />
                          </Field>
                        </div>
                      </>
                    )}

                    <div className="sec-divider mt-5">Refugee Details</div>
                    <label className="flex items-center gap-2 mt-3" style={{ fontSize: 'var(--fs-sm)', cursor: 'pointer' }}>
                      <input type="checkbox" checked={form.isRefugee} style={{ width: 16, height: 16 }}
                        onChange={e => patch({ isRefugee: e.target.checked, ...(e.target.checked ? {} : { refugeeId: '' }) })} />
                      <span className="font-medium text-g700">Refugee / Asylum Seeker Student?</span>
                    </label>
                    {form.isRefugee && (
                      <div className="g3 mt-3">
                        <Field label="Refugee ID" req error={errors.refugeeId}>
                          <Input placeholder="Refugee ID number" maxLength={ID_MAX} value={form.refugeeId} hasError={!!errors.refugeeId}
                            onChange={v => patch({ refugeeId: v })} />
                        </Field>
                        <div className="fg" />
                        <div className="fg" />
                      </div>
                    )}

                    <div className="sec-divider mt-5">Sponsor Details</div>
                    <div className="g3 mt-3">
                      <Field label="Sponsor Name" error={errors.spName}>
                        <Input placeholder="Person or organisation" maxLength={NAME_MAX} value={form.spName} hasError={!!errors.spName}
                          onChange={v => patch({ spName: v })} />
                      </Field>
                      <Field label="Sponsor Phone" error={errors.spPhone}>
                        <div className="flex gap-2">
                          <SearchSelect options={spPhoneCountryOptions} value={form.spCountryGuid}
                            onChange={v => patch({ spCountryGuid: v })} onOpenChange={setSpPickerOpen}
                            {...pickerProps} style={{ width: 108, flexShrink: 0 }} />
                          <input className="ctrl flex-1" type="tel" inputMode="numeric" placeholder="e.g. 772123456" maxLength={PHONE_MAX}
                            value={form.spPhone} style={errors.spPhone ? { borderColor: 'var(--red)' } : undefined}
                            onChange={e => patch({ spPhone: sanitizePhoneInput(e.target.value, false).replace(/\D/g, '').slice(0, PHONE_MAX) })} />
                        </div>
                      </Field>
                      <Field label="Sponsor Email" error={errors.spEmail}>
                        <Input type="email" placeholder="sponsor@email.com" maxLength={EMAIL_MAX} value={form.spEmail} hasError={!!errors.spEmail}
                          onChange={v => patch({ spEmail: v })} />
                      </Field>
                    </div>

                    <div className="flex justify-end mt-5">
                      <button className="btn btn-primary" disabled={saveGeneral.isPending || !permissions.add} onClick={handleSaveGeneral}>
                        {saveGeneral.isPending ? 'Saving…' : odelGuid
                          ? <>Update &amp; Next: Qualifications <i className="lni lni-arrow-right" /></>
                          : <>Save &amp; Next: Qualifications <i className="lni lni-arrow-right" /></>}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ── 2 · Qualifications ───────────────────────────────────── */}
              {activeTab === 'qualifications' && (
                <div className="filing-stage-layout">
                  <div className="filing-form-col">
                    <div className="sec-divider">Saved Qualifications</div>
                    <div className="mt-3">
                      <ScrollTable>
                        <table>
                          <thead>
                            <tr>
                              <th style={{ width: 48 }}></th>
                              <th>Institution</th>
                              <th>University / Board</th>
                              <th>Year</th>
                              <th>Grade</th>
                              <th>Duration</th>
                              <th>Proof</th>
                            </tr>
                          </thead>
                          <tbody>
                            {qualsLoading
                              ? <TableLoadingState colSpan={999} />
                              : qualifications.length === 0
                                ? <EmptyState colSpan={999} title="No qualifications yet" subtitle="Add at least one qualification with its proof document below." />
                                : qualifications.map(q => (
                                  <tr key={q.odelApplicationQualGuid}>
                                    <td>
                                      <ActionMenu>
                                        {q.proofUrl && (
                                          <button className="btn btn-neu btn-sm" onClick={() => setDocPreview({ url: q.proofUrl as string, title: `Qualification proof — ${q.institution}` })}>
                                            <i className="lni lni-eye"></i> View Proof
                                          </button>
                                        )}
                                        {permissions.add && (
                                          <button className="btn btn-neu btn-sm" onClick={() => startEditQual(q)}>
                                            <i className="lni lni-pencil"></i> Edit
                                          </button>
                                        )}
                                        {permissions.delete && (
                                          <button className="btn btn-neu btn-sm" onClick={() => setDeleteTarget(q)}>
                                            <i className="lni lni-trash-can"></i> Delete
                                          </button>
                                        )}
                                      </ActionMenu>
                                    </td>
                                    <td><strong>{q.institution}</strong></td>
                                    <td>{q.university}</td>
                                    <td>{q.passYear}</td>
                                    <td>{q.grade}</td>
                                    <td>{q.yearsTaken} {q.yearsTaken === 1 ? 'year' : 'years'}</td>
                                    <td>
                                      {q.proofUrl
                                        ? <span className="badge badge-green"><i className="lni lni-checkmark-circle" /> On file</span>
                                        : <span className="badge badge-grey">Not stored</span>}
                                    </td>
                                  </tr>
                                ))}
                          </tbody>
                        </table>
                      </ScrollTable>
                    </div>

                    <div className="sec-divider mt-5">{editingQual ? 'Edit Qualification' : 'Add Qualification'}</div>
                    <div className="qual-card mt-3 mb-3 p-3 rounded-lg border border-g200">
                      <div className="g3">
                        <Field label="Institution" req error={qualErrors.institution}>
                          <Input placeholder="School / University" maxLength={QUAL_TEXT_MAX} value={qualForm.institution} hasError={!!qualErrors.institution}
                            onChange={v => patchQual({ institution: v })} />
                        </Field>
                        <Field label="University / Awarding Board" req error={qualErrors.university}>
                          <Input placeholder="e.g. Makerere University" maxLength={QUAL_TEXT_MAX} value={qualForm.university} hasError={!!qualErrors.university}
                            onChange={v => patchQual({ university: v })} />
                        </Field>
                        <Field label="Year" req error={qualErrors.passYear}>
                          <Input inputMode="numeric" maxLength={4} placeholder="2023" value={qualForm.passYear} hasError={!!qualErrors.passYear}
                            onChange={v => patchQual({ passYear: v.replace(/\D/g, '') })} />
                        </Field>
                      </div>
                      <div className="g3 mt-3">
                        <Field label="Grade" req error={qualErrors.grade}>
                          <Input placeholder="e.g. First Class, 4.2 CGPA" maxLength={QUAL_GRADE_MAX} value={qualForm.grade} hasError={!!qualErrors.grade}
                            onChange={v => patchQual({ grade: v })} />
                        </Field>
                        <Field label="Duration (Years)" req error={qualErrors.yearsTaken}>
                          {/* Whole years 1–10 only; keystrokes that would leave that range are ignored. */}
                          <Input inputMode="numeric" maxLength={2} placeholder="1–10" value={qualForm.yearsTaken} hasError={!!qualErrors.yearsTaken}
                            onChange={v => {
                              const digits = v.replace(/\D/g, '')
                              const n = Number(digits)
                              if (digits === '' || (n >= QUAL_DURATION_MIN && n <= QUAL_DURATION_MAX)) patchQual({ yearsTaken: digits })
                            }} />
                        </Field>
                        <Field label="Proof Document" req={!editingQual} error={qualErrors.proofFile}
                          hint={editingQual ? 'Leave empty to keep the stored proof.' : 'PDF, JPG or PNG, up to 5 MB.'}>
                          <FileZone file={qualForm.proofFile} onChange={f => patchQual({ proofFile: f })} hasError={!!qualErrors.proofFile} />
                        </Field>
                      </div>
                      <div className="flex justify-end items-center gap-2 mt-3">
                        {editingQual && (
                          <button type="button" className="btn btn-neu text-xs" onClick={() => { setQualForm(EMPTY_QUAL); setQualErrors({}) }}>
                            Cancel Edit
                          </button>
                        )}
                        <button type="button" className="btn btn-primary" disabled={saveQualification.isPending || !permissions.add} onClick={handleSaveQual}>
                          <i className={`lni ${editingQual ? 'lni-checkmark' : 'lni-plus'}`} /> {saveQualification.isPending ? 'Saving…' : editingQual ? 'Update Qualification' : 'Add Qualification'}
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-between mt-5">
                      <button className="btn" onClick={() => setActiveTab('general')}><i className="lni lni-arrow-left" /> General</button>
                      <button className="btn btn-primary" disabled={saveStatus < ODEL_SAVE_STATUS.qualification && qualifications.length === 0} onClick={() => setActiveTab('photo')}>
                        Next: Photo <i className="lni lni-arrow-right" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ── 3 · Photo ────────────────────────────────────────────── */}
              {activeTab === 'photo' && (
                <div className="filing-stage-layout">
                  <div className="filing-form-col">
                    <div className="sec-divider">Applicant Photo</div>
                    <div className="mt-3">
                      <Field label="Photo" req error={photoError ?? undefined}>
                        <div
                          className={`filing-photo${photoDrag ? ' drag-active' : ''}${photoError ? ' has-error' : ''}`}
                          onDragOver={e => { e.preventDefault(); if (permissions.add) setPhotoDrag(true) }}
                          onDragLeave={() => setPhotoDrag(false)}
                          onDrop={e => {
                            e.preventDefault(); setPhotoDrag(false)
                            if (permissions.add && !uploadPhoto.isPending) handlePhotoPicked(e.dataTransfer.files?.[0] ?? null)
                          }}
                        >
                          <div className="filing-photo-thumb">
                            {photoThumb
                              ? <img src={photoThumb} alt="Applicant photo" />
                              : <i className={`lni ${hasPhoto ? 'lni-checkmark-circle' : 'lni-user'}`} aria-hidden="true" />}
                          </div>
                          <div className="filing-photo-body">
                            <div className="filing-photo-title" role="status" aria-live="polite">
                              {uploadPhoto.isPending
                                ? 'Uploading photo…'
                                : hasPhoto
                                  ? <><i className="lni lni-checkmark-circle" aria-hidden="true" style={{ color: 'var(--green)' }} /> Photo saved</>
                                  : 'No photo yet'}
                            </div>
                            <div className="filing-photo-sub">
                              {photoLocal?.name ?? 'Passport-style, JPG, PNG or BMP, up to 5 MB. Drag it here or choose a file — a new photo replaces the old one.'}
                            </div>
                            <div className="flex gap-2 flex-wrap mt-2.5">
                              <input ref={photoInputRef} type="file" accept={PHOTO_ACCEPT} className="sr-only" tabIndex={-1} aria-hidden="true"
                                onChange={e => handlePhotoPicked(e.target.files?.[0] ?? null)} />
                              <button type="button" className={`btn btn-sm ${hasPhoto ? 'btn-neu' : 'btn-primary'}`}
                                disabled={uploadPhoto.isPending || !permissions.add} onClick={() => photoInputRef.current?.click()}>
                                <i className="lni lni-cloud-upload" aria-hidden="true" /> {hasPhoto ? 'Replace Photo' : 'Choose Photo'}
                              </button>
                              {hasPhoto && (photoLocalUrl ?? serverPhotoUrl) && (
                                <button type="button" className="btn btn-sm btn-neu"
                                  onClick={() => setDocPreview({ url: (photoLocalUrl ?? serverPhotoUrl) as string, title: 'Applicant photo' })}>
                                  <i className="lni lni-eye" aria-hidden="true" /> View
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </Field>
                    </div>

                    <div className="flex justify-between mt-5">
                      <button className="btn" onClick={() => setActiveTab('qualifications')}><i className="lni lni-arrow-left" /> Qualifications</button>
                      <button className="btn btn-primary" disabled={!hasPhoto} onClick={() => setActiveTab('payment')}>
                        Next: Payment Slip <i className="lni lni-arrow-right" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ── 4 · Payment slip ─────────────────────────────────────── */}
              {activeTab === 'payment' && (
                <div className="filing-stage-layout">
                  <div className="filing-form-col">
                    <div className="info-box mb-3">
                      <i className="lni lni-information"></i> Only the offline payment slip is supported — online (DPO) payment isn&apos;t available for ODeL applications yet.
                    </div>
                    <div className="sec-divider">Payment Slip</div>
                    <div className="mt-3">
                      <Field label="Payment Slip" req error={slipError ?? undefined}>
                        <div
                          className={`filing-photo${slipDrag ? ' drag-active' : ''}${slipError ? ' has-error' : ''}`}
                          onDragOver={e => { e.preventDefault(); if (permissions.add) setSlipDrag(true) }}
                          onDragLeave={() => setSlipDrag(false)}
                          onDrop={e => {
                            e.preventDefault(); setSlipDrag(false)
                            if (permissions.add && !uploadSlip.isPending) handleSlipPicked(e.dataTransfer.files?.[0] ?? null)
                          }}
                        >
                          <div className="filing-photo-thumb">
                            {slipThumb
                              ? <img src={slipThumb} alt="Payment slip" />
                              : <i className={`lni ${hasSlip ? 'lni-files' : 'lni-credit-cards'}`} aria-hidden="true" />}
                          </div>
                          <div className="filing-photo-body">
                            <div className="filing-photo-title" role="status" aria-live="polite">
                              {uploadSlip.isPending
                                ? 'Uploading payment slip…'
                                : hasSlip
                                  ? <><i className="lni lni-checkmark-circle" aria-hidden="true" style={{ color: 'var(--green)' }} /> Payment slip saved</>
                                  : 'No payment slip yet'}
                            </div>
                            <div className="filing-photo-sub">
                              {slipLocal?.name ?? 'PDF, JPG or PNG, up to 5 MB. Drag it here or choose a file — a new slip replaces the old one.'}
                            </div>
                            <div className="flex gap-2 flex-wrap mt-2.5">
                              <input ref={slipInputRef} type="file" accept={DOC_ACCEPT} className="sr-only" tabIndex={-1} aria-hidden="true"
                                onChange={e => handleSlipPicked(e.target.files?.[0] ?? null)} />
                              <button type="button" className={`btn btn-sm ${hasSlip ? 'btn-neu' : 'btn-primary'}`}
                                disabled={uploadSlip.isPending || !permissions.add} onClick={() => slipInputRef.current?.click()}>
                                <i className="lni lni-cloud-upload" aria-hidden="true" /> {hasSlip ? 'Replace Slip' : 'Choose Slip'}
                              </button>
                              {hasSlip && (slipLocalUrl ?? serverSlipUrl) && (
                                <button type="button" className="btn btn-sm btn-neu"
                                  onClick={() => setDocPreview({ url: (slipLocalUrl ?? serverSlipUrl) as string, title: 'Payment slip' })}>
                                  <i className="lni lni-eye" aria-hidden="true" /> View
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </Field>
                    </div>

                    <div className="sec-divider mt-5">Application Status</div>
                    <div className="checklist mt-3">
                      {TABS.map(t => (
                        <div key={t.id} className={`chk-item ${isDone(t.step) ? 'pass' : 'pending'}`}>
                          <i className={`lni ${isDone(t.step) ? 'lni-checkmark-circle' : 'lni-timer'}`} />
                          <span className="flex-1 text-sm text-g700">{t.label}</span>
                          <span className="chk-status text-xs">{isDone(t.step) ? 'Saved' : 'Not saved yet'}</span>
                        </div>
                      ))}
                    </div>

                    {isSubmitted ? (
                      <div className="applicant-profile-strip mt-4" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                        <span className="av-chip" style={{ background: 'var(--green)', color: '#fff' }}><i className="lni lni-checkmark" /></span>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-g900">Application Submitted!</div>
                          <div className="text-xs text-g600 mt-1">ODeL Ref No <strong>{appRefNo}</strong> — Application registration successfully done!</div>
                        </div>
                        <button type="button" className="btn btn-primary btn-sm" onClick={() => resetAll('new')}>
                          <i className="lni lni-plus" /> New Application
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="sec-divider mt-5">Declaration &amp; Submission</div>
                        <div id="declaration-section" className={`mt-3 p-4 bg-slate-50 border ${declarationError ? 'border-red-300 bg-red-50/40' : 'border-slate-200'} rounded-lg transition-all`}>
                          <label className="flex items-start gap-3 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                              checked={declarationAccepted}
                              onChange={e => {
                                setDeclarationAccepted(e.target.checked)
                                if (e.target.checked) setDeclarationError(null)
                              }}
                            />
                            <div className="text-sm text-slate-700 leading-normal">
                              <span className="font-semibold text-slate-900">Applicant Declaration:</span> I hereby declare that all the information provided in this application is true, complete, and accurate to the best of my knowledge and belief. I understand that any false statement or omission may lead to the cancellation of my admission.
                            </div>
                          </label>
                          {declarationError && (
                            <div className="mt-2 text-xs text-red-600 flex items-center gap-1 font-medium">
                              <i className="lni lni-warning" /> {declarationError}
                            </div>
                          )}
                        </div>

                        <div className="flex justify-between items-center mt-5">
                          <button type="button" className="btn" onClick={() => setActiveTab('photo')}>
                            <i className="lni lni-arrow-left" /> Photo
                          </button>
                          <button
                            type="button"
                            className={`btn btn-primary${!hasSlip || !declarationAccepted ? ' opacity-90' : ''}`}
                            disabled={submitApplication.isPending || !permissions.add}
                            onClick={handleSubmitApplication}
                          >
                            <i className="lni lni-checkmark-circle" /> {submitApplication.isPending ? 'Submitting…' : 'Submit Application'}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      <DocumentPreviewModal isOpen={!!docPreview} onClose={() => setDocPreview(null)} url={docPreview?.url ?? null} title={docPreview?.title} />
      <Toast toast={toast} />

      {deleteTarget && (
        <div className="perm-delete-overlay" style={{ position: 'fixed', zIndex: 500 }} onClick={() => setDeleteTarget(null)}>
          <div className="perm-delete-card tab-panel-in" onClick={e => e.stopPropagation()}>
            <div className="perm-delete-icon"><i className="lni lni-trash-can"></i></div>
            <div className="perm-delete-title">Delete {deleteTarget.institution}?</div>
            <div className="perm-delete-sub">This qualification will be removed from the application.</div>
            <div className="perm-delete-actions">
              <button className="btn btn-neu" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="btn btn-danger" disabled={deleteQualification.isPending} onClick={confirmDeleteQual}>
                <i className="lni lni-trash-can"></i> {deleteQualification.isPending ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {failure && (
        <div className="modal-overlay open">
          <div className="modal" style={{ maxWidth: 400 }}>
            <FailurePopup title={failure.title} subtitle={failure.message} onClose={() => setFailure(null)} />
          </div>
        </div>
      )}

      {isSubmitted && (
        <div className="modal-overlay open">
          <div className="modal" style={{ maxWidth: 440 }} role="dialog" aria-modal="true" aria-labelledby="odel-submitted-title">
            <div style={{ textAlign: 'center', padding: '32px 28px 26px' }}>
              <div className="pc-receipt-check" style={{ fontSize: 36, marginBottom: 12, color: 'var(--green)' }}>
                <i className="lni lni-checkmark-circle" />
              </div>
              <div id="odel-submitted-title" className="font-bold text-g900" style={{ fontSize: 'var(--fs-lg)' }}>
                Application Submitted!
              </div>
              <p className="text-g600 mt-2 text-sm leading-relaxed">
                ODeL Application Ref No: <strong className="text-g900">{appRefNo}</strong> has been successfully submitted.
              </p>
              <p className="text-xs text-g400 mt-1">
                Application registration successfully done!
              </p>
              <div className="flex gap-2 justify-center mt-6 flex-wrap">
                <button type="button" className="btn btn-primary" onClick={() => resetAll('new')}>
                  <i className="lni lni-plus" /> Start New Application
                </button>
                <button type="button" className="btn btn-neu" onClick={() => setIsSubmitted(false)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

