'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Toast } from '@/components/Toast'
import { SearchSelect } from '@/components/SearchSelect'

const APPLICANTS = [
  { id: 'APP-2026-0023', name: 'Nakato Sarah',    course: 'BSc Computer Science',       intake: 'Jan 2026', fee: '2,400,000 UGX' },
  { id: 'APP-2026-0022', name: 'Okello James',    course: 'BBA Management',              intake: 'Jan 2026', fee: '1,800,000 UGX' },
  { id: 'APP-2026-0021', name: 'Tumukunde Alice', course: 'BSc Information Technology',  intake: 'May 2026', fee: '2,200,000 UGX' },
  { id: 'APP-2026-0019', name: 'Nampijja Grace',  course: 'BA Education',                intake: 'May 2026', fee: '1,600,000 UGX' },
]

type Tab = 'personal' | 'qualifications' | 'family' | 'documents'
const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'personal',       label: 'Personal Info',    icon: 'lni-user-4' },
  { id: 'qualifications', label: 'Qualifications',   icon: 'lni-graduation' },
  { id: 'family',         label: 'Family Details',   icon: 'lni-users-2' },
  { id: 'documents',      label: 'Documents',        icon: 'lni-folder-2' },
]

const NATIONALITIES  = ['Ugandan', 'Kenyan', 'Tanzanian', 'Rwandan', 'Burundian', 'South Sudanese', 'Congolese', 'Other']
const RELIGIONS      = ['Christian', 'Muslim', 'Hindu', 'Buddhist', 'Other']
const MARITAL        = ['Single', 'Married', 'Divorced', 'Widowed']
const GENDERS        = ['Male', 'Female', 'Other']
const QUAL_TYPES     = ['O-Level', 'A-Level', 'Diploma', 'Certificate', 'Degree', 'Masters']
const SPONSOR_TYPES  = ['Self', 'Parent/Guardian', 'Government', 'Organization', 'Other']

function Field({ label, req, children, span }: { label: string; req?: boolean; span?: number; children: React.ReactNode }) {
  return (
    <div className={span === 2 ? 'fg span2' : span === 3 ? 'fg span3' : 'fg'}>
      <label className="lbl">{label}{req && <span className="req">*</span>}</label>
      {children}
    </div>
  )
}
function Input({ placeholder, type = 'text', readOnly }: { placeholder?: string; type?: string; readOnly?: boolean }) {
  return <input className="ctrl" type={type} placeholder={placeholder} readOnly={readOnly} />
}
function Select({ options, placeholder }: { options: string[]; placeholder?: string }) {
  return <SearchSelect placeholder={placeholder || 'Select...'} options={options} />
}

const PIPELINE = [
  { label: 'Payment', done: true }, { label: 'Filing', active: true },
  { label: 'Vetting', done: false }, { label: 'Registration', done: false }, { label: 'Onboarding', done: false },
]

export default function FilingPage() {
  const router = useRouter()
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('personal')
  const [selectedApplicant, setSelectedApplicant] = useState<typeof APPLICANTS[0] | null>(null)
  const [showApplicantDropdown, setShowApplicantDropdown] = useState(false)
  const [applicantSearch, setApplicantSearch] = useState('')
  const [showCourseDetails, setShowCourseDetails] = useState(false)
  const [qualificationRows, setQualificationRows] = useState([{ id: 1 }])
  const [experienceRows, setExperienceRows] = useState([{ id: 1 }])

  function showToast(msg: string, type = '') { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }

  const filtered = APPLICANTS.filter(a => `${a.id} ${a.name}`.toLowerCase().includes(applicantSearch.toLowerCase()))

  const selectApplicant = (a: typeof APPLICANTS[0]) => {
    setSelectedApplicant(a); setShowApplicantDropdown(false); setApplicantSearch(''); setShowCourseDetails(true)
  }

  return (
    <div id="page-filing">
      <div className="pg-hdr">
        <div>
          <h1 className="text-xl font-bold text-g900">Stage 2 &middot; Application Filing</h1>
          <p className="text-sm text-g500 mt-1">Counsellor enters applicant details, qualifications, family info and uploads documents.</p>
        </div>
        <button className="btn" onClick={() => router.push('/admission/payment')}><i className="lni lni-arrow-left" /> Stage 1</button>
      </div>

      <div className="pipeline">
        {PIPELINE.map((s, i) => (
          <div key={i} className={`pip-step${s.done ? ' done' : ''}${(s as any).active ? ' active' : ''}`}>
            <div className="pip-circle">{s.done ? <i className="lni lni-checkmark" /> : i + 1}</div>
            <span className="text-sm font-semibold text-g700">{s.label}</span>
          </div>
        ))}
      </div>

      <div className="card mb-4 p-5">
        <h2 className="font-bold text-g800 mb-3">Link to Payment Record</h2>
        <div className="g2">
          <div className="fg">
            <label className="lbl">Applicant<span className="req">*</span></label>
            <div className="relative">
              <input className="ctrl" placeholder="Search applicant ID or name..."
                value={selectedApplicant ? `${selectedApplicant.id} — ${selectedApplicant.name}` : applicantSearch}
                onChange={e => { setApplicantSearch(e.target.value); setShowApplicantDropdown(true); setSelectedApplicant(null); setShowCourseDetails(false) }}
                onFocus={() => setShowApplicantDropdown(true)} />
              {showApplicantDropdown && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-g200 rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto">
                  {filtered.length === 0 && <div className="p-3 text-sm text-g400">No results</div>}
                  {filtered.map(a => (
                    <button key={a.id} className="w-full text-left px-4 py-2 text-sm hover:bg-b50 flex justify-between" onClick={() => selectApplicant(a)}>
                      <span className="font-medium text-g800">{a.id}</span><span className="text-g500">{a.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <Field label="Enquiry Code">
            <input className="ctrl" placeholder="ENQ-XXXX" readOnly value={selectedApplicant ? `ENQ-${selectedApplicant.id.split('-')[2]}` : ''} />
          </Field>
        </div>
        {showCourseDetails && selectedApplicant && (
          <div className="info-box mt-4">
            <div className="g3">
              <div><span className="text-xs text-g400 block">Course</span><span className="text-sm font-semibold text-g800">{selectedApplicant.course}</span></div>
              <div><span className="text-xs text-g400 block">Intake</span><span className="text-sm font-semibold text-g800">{selectedApplicant.intake}</span></div>
              <div><span className="text-xs text-g400 block">Fee</span><span className="text-sm font-semibold text-g800">{selectedApplicant.fee}</span></div>
            </div>
          </div>
        )}
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="flex border-b border-g200">
          {TABS.map(t => (
            <button key={t.id} className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === t.id ? 'border-b500 text-b600 bg-b50' : 'border-transparent text-g500 hover:text-g700'}`} onClick={() => setActiveTab(t.id)}>
              <i className={`lni ${t.icon}`} /> {t.label}
            </button>
          ))}
        </div>

        <div className="p-5">
          {activeTab === 'personal' && (
            <div>
              <div className="flex items-start gap-5 mb-5">
                <div className="file-zone w-32 h-32 flex-shrink-0"><input type="file" accept="image/*" /><i className="lni lni-camera-2 file-zone-icon" /><p>Profile Photo</p></div>
                <div className="flex-1">
                  <div className="g3"><Field label="First Name" req><Input placeholder="First name" /></Field><Field label="Middle Name"><Input placeholder="Middle name" /></Field><Field label="Last Name" req><Input placeholder="Last name" /></Field></div>
                  <div className="g3 mt-3"><Field label="Gender" req><Select options={GENDERS} /></Field><Field label="Date of Birth" req><Input type="date" /></Field><Field label="Nationality" req><Select options={NATIONALITIES} /></Field></div>
                </div>
              </div>
              <div className="g3"><Field label="National ID"><Input placeholder="CM-XXXXX-XXXX" /></Field><Field label="Email" req><Input type="email" placeholder="email@example.com" /></Field><Field label="Phone" req><Input placeholder="+256 7XX XXX XXX" /></Field></div>
              <div className="g3 mt-3"><Field label="Residential Address" span={2}><Input placeholder="Full address" /></Field><Field label="University Email"><Input readOnly placeholder="Auto-generated" /></Field></div>
              <div className="g3 mt-3"><Field label="Religion"><Select options={RELIGIONS} /></Field><Field label="Marital Status"><Select options={MARITAL} /></Field><div className="fg" /></div>
              <div className="sec-divider mt-5">Passport &amp; Visa Details</div>
              <div className="g3 mt-3"><Field label="Passport Number"><Input placeholder="AB1234567" /></Field><Field label="Passport Expiry"><Input type="date" /></Field><Field label="Country of Issue"><Select options={NATIONALITIES} /></Field></div>
              <div className="g3 mt-3"><Field label="Visa Number"><Input placeholder="VIS-XXXX" /></Field><Field label="Visa Type"><Select options={['Student', 'Work', 'Tourist', 'Diplomatic']} /></Field><Field label="Visa Expiry"><Input type="date" /></Field></div>
              <div className="sec-divider mt-5">Refugee Details</div>
              <div className="g3 mt-3"><Field label="Refugee Status"><Select options={['Not Applicable', 'Refugee', 'Asylum Seeker']} /></Field><Field label="UNHCR Case Number"><Input placeholder="UNH-XXXX" /></Field><Field label="Country of Origin"><Select options={NATIONALITIES} /></Field></div>
              <div className="flex justify-end mt-5"><button className="btn" onClick={() => setActiveTab('qualifications')}>Next: Qualifications <i className="lni lni-arrow-right" /></button></div>
            </div>
          )}

          {activeTab === 'qualifications' && (
            <div>
              <div className="sec-divider">Highest Qualification</div>
              <div className="g3 mt-3"><Field label="Type" req><Select options={QUAL_TYPES} /></Field><Field label="Institution" req><Input placeholder="School / University" /></Field><Field label="Year" req><Input type="number" placeholder="2023" /></Field></div>
              <div className="g3 mt-3"><Field label="Index No."><Input placeholder="U0001/001" /></Field><Field label="Percentage / GPA"><Input placeholder="e.g. 78% or 4.2" /></Field><Field label="Duration (Years)"><Input type="number" placeholder="3" /></Field></div>
              <div className="sec-divider mt-5 flex items-center justify-between">
                <span>Additional Qualifications</span>
                <button className="btn text-xs" onClick={() => setQualificationRows(r => [...r, { id: Date.now() }])}><i className="lni lni-plus" /> Add Row</button>
              </div>
              {qualificationRows.map(row => (
                <div key={row.id} className="g3 mt-3 items-end"><Field label="Type"><Select options={QUAL_TYPES} /></Field><Field label="Institution"><Input placeholder="Institution" /></Field><Field label="Year"><Input type="number" placeholder="Year" /></Field></div>
              ))}
              <div className="sec-divider mt-5 flex items-center justify-between">
                <span>Work Experience</span>
                <button className="btn text-xs" onClick={() => setExperienceRows(r => [...r, { id: Date.now() }])}><i className="lni lni-plus" /> Add Entry</button>
              </div>
              {experienceRows.map(row => (
                <div key={row.id} className="g3 mt-3"><Field label="Organization"><Input placeholder="Company / Organization" /></Field><Field label="Role"><Input placeholder="Job title" /></Field><Field label="Duration"><Input placeholder="e.g. 2 years" /></Field></div>
              ))}
              <div className="flex justify-between mt-5">
                <button className="btn" onClick={() => setActiveTab('personal')}><i className="lni lni-arrow-left" /> Personal Info</button>
                <button className="btn" onClick={() => setActiveTab('family')}>Next: Family Details <i className="lni lni-arrow-right" /></button>
              </div>
            </div>
          )}

          {activeTab === 'family' && (
            <div>
              <div className="sec-divider">Father / Guardian</div>
              <div className="g3 mt-3"><Field label="Full Name"><Input placeholder="Father's / Guardian's name" /></Field><Field label="Phone"><Input placeholder="+256 7XX XXX XXX" /></Field><Field label="Occupation"><Input placeholder="Occupation" /></Field></div>
              <div className="g3 mt-3"><Field label="Email"><Input type="email" placeholder="email@example.com" /></Field><div className="fg" /><div className="fg" /></div>
              <div className="sec-divider mt-5">Mother</div>
              <div className="g3 mt-3"><Field label="Full Name"><Input placeholder="Mother's name" /></Field><Field label="Phone"><Input placeholder="+256 7XX XXX XXX" /></Field><Field label="Occupation"><Input placeholder="Occupation" /></Field></div>
              <div className="g3 mt-3"><Field label="Email"><Input type="email" placeholder="email@example.com" /></Field><div className="fg" /><div className="fg" /></div>
              <div className="sec-divider mt-5">Emergency Contact</div>
              <div className="g3 mt-3"><Field label="Name" req><Input placeholder="Contact person" /></Field><Field label="Relationship"><Input placeholder="e.g. Uncle" /></Field><Field label="Phone" req><Input placeholder="+256 7XX XXX XXX" /></Field></div>
              <div className="sec-divider mt-5">Family Address</div>
              <div className="g3 mt-3"><Field label="District"><Input placeholder="District" /></Field><Field label="Sub-county"><Input placeholder="Sub-county" /></Field><Field label="Village / Street"><Input placeholder="Village" /></Field></div>
              <div className="sec-divider mt-5">Sponsorship Details</div>
              <div className="g3 mt-3"><Field label="Sponsor Type" req><Select options={SPONSOR_TYPES} /></Field><Field label="Sponsor Name"><Input placeholder="Sponsor name" /></Field><Field label="Sponsor Contact"><Input placeholder="Phone / Email" /></Field></div>
              <div className="flex justify-between mt-5">
                <button className="btn" onClick={() => setActiveTab('qualifications')}><i className="lni lni-arrow-left" /> Qualifications</button>
                <button className="btn" onClick={() => setActiveTab('documents')}>Next: Documents <i className="lni lni-arrow-right" /></button>
              </div>
            </div>
          )}

          {activeTab === 'documents' && (
            <div>
              <div className="grid grid-cols-3 gap-4 mb-5">
                {['Passport Photo', 'National ID Copy', 'O-Level Certificate', 'A-Level Certificate', 'Diploma Certificate', 'Recommendation Letter'].map(doc => (
                  <div key={doc} className="file-zone"><input type="file" /><i className="lni lni-cloud-upload file-zone-icon" /><p>{doc}</p></div>
                ))}
              </div>
              <div className="sec-divider">Upload Status</div>
              <div className="checklist mt-3">
                {[
                  { label: 'Passport Photo', status: 'pending' }, { label: 'National ID Copy', status: 'pending' },
                  { label: 'O-Level Certificate', status: 'pending' }, { label: 'A-Level Certificate', status: 'pending', optional: true },
                  { label: 'Diploma Certificate', status: 'pending', optional: true }, { label: 'Recommendation Letter', status: 'pending', optional: true },
                ].map(item => (
                  <div key={item.label} className={`chk-item ${item.status}`}>
                    <i className={`lni ${item.status === 'pass' ? 'lni-checkmark-circle' : 'lni-timer'}`} />
                    <span className="flex-1 text-sm text-g700">{item.label}</span>
                    <span className="chk-status text-xs">{item.optional ? 'Optional' : 'Required'} &middot; {item.status === 'pass' ? 'Uploaded' : 'Pending'}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-5">
                <button className="btn" onClick={() => setActiveTab('family')}><i className="lni lni-arrow-left" /> Family</button>
                <button className="btn bg-b500 text-white" onClick={() => { showToast('Application submitted for vetting', 'success'); router.push('/admission/vetting') }}>
                  <i className="lni lni-checkmark" /> Submit Application for Vetting
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <Toast toast={toast} />
    </div>
  )
}
