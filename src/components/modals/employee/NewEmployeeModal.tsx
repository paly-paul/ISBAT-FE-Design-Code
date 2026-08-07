'use client'
import { useState } from 'react'
import { ModalProps } from '../types'
import { SuccessPopup } from '../academic/SuccessPopup'
import { SearchSelect } from '@/components/SearchSelect'
import DatePicker from '@/components/DatePicker'
import { CreateEmployeeInput } from '@/lib/api/employee/employee'
import { useCreateEmployee } from '@/hooks/employee/useEmployees'
import { useDepartments } from '@/hooks/config/useDepartments'
import { useDesignations } from '@/hooks/config/useDesignations'
import { useCountries } from '@/hooks/config/useCountries'

// Only one employee category is confirmed by the API for now.
const CATEGORIES: { label: string; category: number; prefix: string }[] = [
  { label: 'Administrative Staff', category: 1, prefix: 'AD' },
]

const TITLES = ['Mr', 'Mrs', 'Ms', 'Dr', 'Prof']
// The lookup values below are placeholders until the API provides fuller options.
const SEXES = ['Male', 'Female', 'Others']
const MARITAL_STATUSES = ['Single', 'Married', 'Divorced', 'Widow', 'Widower', 'Separated']
const RELIGIONS = ['Christian', 'Muslim', 'Hindu', 'Other']

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function sexToNumber(sex: string): number {
  return sex === 'Male' ? 1 : sex === 'Female' ? 2 : sex === 'Others' ? 3 : 0
}

function isAtLeast18(birthDate: string): boolean {
  const dob = new Date(birthDate)
  if (Number.isNaN(dob.getTime())) return false
  const today = new Date()
  let age = today.getFullYear() - dob.getFullYear()
  const m = today.getMonth() - dob.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--
  return age >= 18
}

function getMaxBirthDate(): string {
  const today = new Date()
  const year = today.getFullYear() - 18
  const month = `${today.getMonth() + 1}`.padStart(2, '0')
  const day = `${today.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function NewEmployeeModal({ isOpen, onClose, showToast }: ModalProps) {
  const [saved, setSaved] = useState(false)
  const [department, setDepartment] = useState('')
  const [designation, setDesignation] = useState('')

  // These fields match the employee create payload.
  const [category, setCategory] = useState(CATEGORIES[0].label)
  const [title, setTitle] = useState('')
  const [firstName, setFirstName] = useState('')
  const [surname, setSurname] = useState('')
  const [otherName, setOtherName] = useState('')
  const [sex, setSex] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [placeOfBirth, setPlaceOfBirth] = useState('')
  const [country, setCountry] = useState('')
  const [natId, setNatId] = useState('')
  const [nationalId, setNationalId] = useState('')
  const [emailId, setEmailId] = useState('')
  const [religion, setReligion] = useState('')
  const [maritalStatus, setMaritalStatus] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const createEmployee = useCreateEmployee()
  const { data: departments = [] } = useDepartments()
  const { data: designations = [] } = useDesignations()
  const { data: countries = [] } = useCountries()
  // Country only ever exposes a countryGuid (no int code — the old
  // intCountryCode field was a fabrication that never existed on the real
  // response, see the note in lib/api/academic/country.ts), but Employee's
  // own intCountryCode is a genuinely separate, real int field with no
  // confirmed mapping back to a country. Sent as the option's 1-based list
  // position — flagged, not a confirmed id. (Batch's own bInCharge used to
  // be the reference example for this workaround; it's since been confirmed
  // as a real employeeGuid and no longer needs it — see batch.ts.)
  const countryOptions = countries.map((c, i) => ({ value: String(i + 1), label: c.countryName }))
  const defaultCountryIndex = countries.findIndex(c => c.defaultCountry === 1)
  const defaultCountryCode = defaultCountryIndex >= 0 ? defaultCountryIndex + 1 : 1
  const departmentOptions = departments.map(d => d.deptName)
  const selectedDept = departments.find(d => d.deptName === department)
  const designationOptions = selectedDept ? designations.filter(d => String(d.intDept) === String(selectedDept.intDept)).map(d => d.designationName) : []
  const selectedDesignation = selectedDept
    ? designations.find(d => d.designationName === designation && String(d.intDept) === String(selectedDept.intDept))
    : undefined

  // Reuse the API validation messages so the form shows issues immediately.
  function validate(): Record<string, string> {
    const e: Record<string, string> = {}
    const selectedCategory = CATEGORIES.find(c => c.label === category)
    if (!selectedCategory || selectedCategory.category <= 0) e.category = 'Select Category before proceeding!'
    if (!title.trim()) e.title = 'Select Title before proceeding!'
    if (!surname.trim()) e.surname = 'Surname cannot be left blank!'
    if (!firstName.trim()) e.firstName = 'First Name cannot be left blank!'
    if (sexToNumber(sex) <= 0) e.sex = 'Select Gender before proceeding!'
    if (!birthDate) e.birthDate = 'Date Of Birth cannot be left blank!'
    else if (!isAtLeast18(birthDate)) e.birthDate = 'The minimum age should be 18 years.'
    if (!placeOfBirth.trim()) e.placeOfBirth = 'Place Of Birth cannot be left blank!'
    if (!natId.trim()) e.natId = 'Select National ID (Yes/No) before proceeding!'
    if (natId.trim() === '0' && !nationalId.trim()) e.nationalId = 'National ID cannot be left blank!'
    if (!emailId.trim()) e.emailId = 'Email ID cannot be left blank!'
    else if (!EMAIL_RE.test(emailId.trim())) e.emailId = 'Invalid Email ID!'
    if (!maritalStatus.trim()) e.maritalStatus = 'Select Marital Status before proceeding!'
    if (!selectedDept) e.department = 'Select Department before proceeding!'
    if (!selectedDesignation) e.designation = 'Select Designation before proceeding!'
    return e
  }

  function clearError(field: string) {
    setErrors(prev => (prev[field] ? { ...prev, [field]: '' } : prev))
  }

  if (!isOpen) return null

  function handleClose() {
    setSaved(false)
    setDepartment('')
    setDesignation('')
    setCategory(CATEGORIES[0].label)
    setTitle('')
    setFirstName('')
    setSurname('')
    setOtherName('')
    setSex('')
    setBirthDate('')
    setPlaceOfBirth('')
    setCountry('')
    setNatId('')
    setNationalId('')
    setEmailId('')
    setReligion('')
    setMaritalStatus('')
    setErrors({})
    onClose()
  }

  function handleDepartmentChange(dept: string) {
    setDepartment(dept)
    const deptRecord = departments.find(d => d.deptName === dept)
    const opts = deptRecord ? designations.filter(d => String(d.intDept) === String(deptRecord.intDept)).map(d => d.designationName) : []
    setDesignation(prev => (opts.includes(prev) ? prev : ''))
  }

  function handleCreate() {
    const validationErrors = validate()
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    const selectedCategory = CATEGORIES.find(c => c.label === category) ?? CATEGORIES[0]
    const input: CreateEmployeeInput = {
      category: selectedCategory.category,
      categoryPrefix: selectedCategory.prefix,
      title,
      surname,
      firstName,
      otherName: otherName.trim() || null,
      sex: sexToNumber(sex),
      birthDate,
      placeOfBirth,
      intCountryCode: country ? Number(country) : defaultCountryCode,
      natId,
      nationalId: nationalId.trim() || null,
      emailId,
      intReligion: religion ? RELIGIONS.indexOf(religion) + 1 : null,
      maritalStatus: MARITAL_STATUSES.indexOf(maritalStatus) + 1 || 1,
      intDept: selectedDept!.intDept,
      intDesignation: selectedDesignation!.intDesignation,
    }
    createEmployee.mutate(input, {
      onSuccess: () => { setSaved(true); showToast('Employee added successfully') },
      onError: (error: Error) => showToast(error.message || 'Failed to add employee', 'error'),
    })
  }

  if (saved) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <SuccessPopup title="Employee Added!" subtitle="The new employee has been saved successfully." onClose={handleClose} />
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay open" id="new-employee-modal">
      <div className="modal modal-80 modal-flex" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr modal-hdr-blue">
          <div className="modal-title"><i className="lni lni-user"></i> Add Employee</div>
          <button className="modal-close" onClick={onClose}><i className="lni lni-close"></i></button>
        </div>

        <div className="modal-scroll">

          {/* Personal Details */}
          <div className="sec-divider">Personal Details</div>
          <div className="g3">
            <div className="fg">
              <div className="lbl">Category <span className="req">*</span></div>
              <SearchSelect options={CATEGORIES.map(c => c.label)} value={category} onChange={v => { setCategory(v); clearError('category') }} />
              {errors.category && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.category}</p>}
            </div>
            <div className="fg">
              <div className="lbl">Title <span className="req">*</span></div>
              <SearchSelect placeholder="Select…" options={TITLES} value={title} onChange={v => { setTitle(v); clearError('title') }} />
              {errors.title && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.title}</p>}
            </div>
            <div className="fg">
              <div className="lbl">First Name <span className="req">*</span></div>
              <input className="ctrl" type="text" placeholder="First name" value={firstName} onChange={e => { setFirstName(e.target.value); clearError('firstName') }} style={errors.firstName ? { borderColor: 'var(--red)' } : undefined} />
              {errors.firstName && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.firstName}</p>}
            </div>
            <div className="fg">
              <div className="lbl">Surname <span className="req">*</span></div>
              <input className="ctrl" type="text" placeholder="Surname" value={surname} onChange={e => { setSurname(e.target.value); clearError('surname') }} style={errors.surname ? { borderColor: 'var(--red)' } : undefined} />
              {errors.surname && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.surname}</p>}
            </div>
            <div className="fg"><div className="lbl">Other Name</div><input className="ctrl" type="text" placeholder="Other name" value={otherName} onChange={e => setOtherName(e.target.value)} /></div>
            <div className="fg">
              <div className="lbl">University Email <span className="req">*</span></div>
              <input className="ctrl" type="email" placeholder="auto-generated" value={emailId} onChange={e => { setEmailId(e.target.value); clearError('emailId') }} style={errors.emailId ? { borderColor: 'var(--red)' } : undefined} />
              {errors.emailId && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.emailId}</p>}
            </div>
            <div className="fg">
              <div className="lbl">Sex <span className="req">*</span></div>
              <SearchSelect placeholder="Select…" options={SEXES} value={sex} onChange={v => { setSex(v); clearError('sex') }} />
              {errors.sex && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.sex}</p>}
            </div>
            <div className="fg">
              <div className="lbl">Date of Birth <span className="req">*</span></div>
              <DatePicker
                value={birthDate}
                maxYmd={getMaxBirthDate()}
                onChange={v => { setBirthDate(v); clearError('birthDate') }}
                hasError={!!errors.birthDate}
              />
              {errors.birthDate && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.birthDate}</p>}
            </div>
            <div className="fg">
              <div className="lbl">Place of Birth <span className="req">*</span></div>
              <input className="ctrl" type="text" placeholder="e.g. Kampala" value={placeOfBirth} onChange={e => { setPlaceOfBirth(e.target.value); clearError('placeOfBirth') }} style={errors.placeOfBirth ? { borderColor: 'var(--red)' } : undefined} />
              {errors.placeOfBirth && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.placeOfBirth}</p>}
            </div>
            <div className="fg">
              <div className="lbl">Country</div>
              <SearchSelect placeholder="Select…" options={countryOptions} value={country} onChange={setCountry} />
            </div>
            <div className="fg">
              <div className="lbl">National ID Type <span className="req">*</span></div>
              <input className="ctrl" type="text" placeholder="e.g. 1" value={natId} onChange={e => { setNatId(e.target.value); clearError('natId') }} style={errors.natId ? { borderColor: 'var(--red)' } : undefined} />
              {errors.natId && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.natId}</p>}
            </div>
            <div className="fg">
              <div className="lbl">National ID Number</div>
              <input className="ctrl" type="text" placeholder="e.g. CM12345678" value={nationalId} onChange={e => { setNationalId(e.target.value); clearError('nationalId') }} style={errors.nationalId ? { borderColor: 'var(--red)' } : undefined} />
              {errors.nationalId && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.nationalId}</p>}
            </div>
            <div className="fg">
              <div className="lbl">Religion</div>
              <SearchSelect placeholder="Select…" options={RELIGIONS} value={religion} onChange={setReligion} />
            </div>
            <div className="fg">
              <div className="lbl">Marital Status <span className="req">*</span></div>
              <SearchSelect placeholder="Select…" options={MARITAL_STATUSES} value={maritalStatus} onChange={v => { setMaritalStatus(v); clearError('maritalStatus') }} />
              {errors.maritalStatus && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.maritalStatus}</p>}
            </div>
            <div className="fg">
              <div className="lbl">Department <span className="req">*</span></div>
              <SearchSelect placeholder="Select department…" options={departmentOptions} value={department} onChange={v => { handleDepartmentChange(v); clearError('department') }} />
              {errors.department && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.department}</p>}
            </div>
            <div className="fg">
              <div className="lbl">Designation <span className="req">*</span></div>
              <SearchSelect
                placeholder={department ? 'Select designation…' : 'Select department first'}
                options={designationOptions}
                value={designation}
                onChange={v => { setDesignation(v); clearError('designation') }}
              />
              {errors.designation && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.designation}</p>}
            </div>
          </div>

          {/* Phone isn't part of the confirmed create payload — kept for reference.
          <div className="fg">
            <div className="lbl">Phone</div>
            <div className="inp-wrap">
              <span className="inp-icon"><i className="lni lni-phone"></i></span>
              <input className="ctrl" type="tel" placeholder="+256 700 000 000" />
            </div>
          </div>
          */}

          {/* ── Qualification Details ─────────────────────────────── */}
          {/* Not part of the confirmed create payload yet — kept for reference.
          <div className="sec-divider">Qualification Details</div>
          <div className="g3">
            <div className="fg">
              <div className="lbl">Highest Qualification <span className="req">*</span></div>
              <SearchSelect options={['PhD', "Master's Degree", "Bachelor's Degree", 'Postgraduate Diploma']} />
            </div>
            <div className="fg"><div className="lbl">Field of Study <span className="req">*</span></div><input className="ctrl" type="text" placeholder="e.g. Computer Science" /></div>
            <div className="fg"><div className="lbl">Year of Completion</div><input className="ctrl" type="number" min={1980} max={2030} placeholder="2020" /></div>
            <div className="fg span2"><div className="lbl">Institution <span className="req">*</span></div><input className="ctrl" type="text" placeholder="e.g. Makerere University" /></div>
            <div className="fg"><div className="lbl">Years of Experience</div><input className="ctrl" type="number" min={0} max={60} defaultValue={0} /></div>
            <div className="fg span3"><div className="lbl">Specialisation Areas</div><input className="ctrl" type="text" placeholder="e.g. Machine Learning, Algorithms, Databases" /></div>
            <div className="fg">
              <div className="lbl">Class Obtained</div>
              <SearchSelect placeholder="Select…" options={['First Class', 'Second Class Upper', 'Second Class Lower', 'Third Class', 'Pass', 'Distinction', 'Merit']} />
            </div>
            <div className="fg"><div className="lbl">Period of Study</div><input className="ctrl" type="text" placeholder="e.g. 2016 – 2020" /></div>
            <div className="fg">
              <div className="lbl">Proof of Award</div>
              <SearchSelect placeholder="Select…" options={['Yes', 'No']} />
            </div>
            <div className="fg">
              <div className="lbl">Proof of Transcripts</div>
              <SearchSelect placeholder="Select…" options={['Yes', 'No']} />
            </div>
            <div className="fg span2">
              <div className="lbl">Upload Transcripts</div>
              <div className="file-zone p-[14px]">
                <input type="file" accept=".pdf,.jpg,.png" />
                <div className="file-zone-icon"><i className="lni lni-files"></i></div>
                <p>Attach transcript document (PDF / Image)</p>
              </div>
            </div>
          </div>
          */}

          {/* ── Affiliation ───────────────────────────────────────── */}
          {/* Not part of the confirmed create payload yet — kept for reference.
          <div className="sec-divider">Affiliation</div>
          <div className="g2">
            <div className="fg">
              <div className="lbl">Faculty <span className="req">*</span></div>
              <SearchSelect options={['Faculty of Computing & Technology', 'Faculty of Business & Management', 'Faculty of Engineering']} />
            </div>
            <div className="fg">
              <div className="lbl">Status</div>
              <SearchSelect options={['Active', 'On Leave', 'Visiting', 'Suspended']} />
            </div>
          </div>
          */}

        </div>

        <div className="modal-footer">
          <button className="btn btn-neu" onClick={handleClose}>Cancel</button>
          <button className="btn btn-primary" disabled={createEmployee.isPending} onClick={handleCreate}>
            <i className="lni lni-checkmark"></i> {createEmployee.isPending ? 'Adding…' : 'Add Employee'}
          </button>
        </div>
      </div>
    </div>
  )
}
