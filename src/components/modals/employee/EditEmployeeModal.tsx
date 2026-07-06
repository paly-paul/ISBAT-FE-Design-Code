'use client'
import { useState } from 'react'
import { ModalProps } from '../types'
import { SuccessPopup } from '../academic/SuccessPopup'
import { SearchSelect } from '@/components/SearchSelect'

const NATIONALITIES = [
  'Ugandan', 'Kenyan', 'Tanzanian', 'Rwandan', 'Burundian', 'South Sudanese',
  'Ethiopian', 'Nigerian', 'Ghanaian', 'South African', 'Indian', 'Chinese',
  'British', 'American', 'Other',
]

const DEPARTMENT_DESIGNATIONS: Record<string, string[]> = {
  'Computer Science':           ['Professor', 'Associate Professor', 'Senior Lecturer', 'Lecturer', 'Assistant Lecturer', 'Teaching Assistant'],
  'Information Technology':     ['Professor', 'Associate Professor', 'Senior Lecturer', 'Lecturer', 'Assistant Lecturer', 'Teaching Assistant'],
  'Business Administration':    ['Professor', 'Associate Professor', 'Senior Lecturer', 'Lecturer', 'Assistant Lecturer'],
  'Accounting & Finance':       ['Professor', 'Associate Professor', 'Senior Lecturer', 'Lecturer', 'Assistant Lecturer'],
  'Civil Engineering':          ['Professor', 'Associate Professor', 'Senior Lecturer', 'Lecturer', 'Lab Instructor'],
  'Nursing Sciences':           ['Professor', 'Associate Professor', 'Senior Lecturer', 'Lecturer', 'Clinical Instructor'],
}
const DEPARTMENTS = Object.keys(DEPARTMENT_DESIGNATIONS)

export function EditEmployeeModal({ isOpen, onClose, showToast }: ModalProps) {
  const [saved, setSaved] = useState(false)
  const [department, setDepartment] = useState('Computer Science')
  const [designation, setDesignation] = useState('Senior Lecturer')

  if (!isOpen) return null

  function handleClose() { setSaved(false); onClose() }

  function handleDepartmentChange(dept: string) {
    setDepartment(dept)
    const opts = DEPARTMENT_DESIGNATIONS[dept] ?? []
    setDesignation(prev => (opts.includes(prev) ? prev : ''))
  }

  if (saved) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <SuccessPopup title="Employee Updated!" subtitle="Your changes have been saved successfully." onClose={handleClose} />
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay open" id="edit-employee-modal">
      <div className="modal modal-80 modal-flex" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr">
          <div className="modal-title"><i className="lni lni-pencil"></i> Edit Employee</div>
          <button className="modal-close" onClick={onClose}><i className="lni lni-close"></i></button>
        </div>

        <div className="modal-scroll">

          {/* ── Personal Details ─────────────────────────────────── */}
          <div className="sec-divider">Personal Details</div>
          <div className="g3">
            <div className="fg">
              <div className="lbl">Salutation</div>
              <SearchSelect value="Dr." options={['Dr.', 'Prof.', 'Mr.', 'Ms.', 'Mrs.']} />
            </div>
            <div className="fg"><div className="lbl">First Name <span className="req">*</span></div><input className="ctrl" type="text" defaultValue="Sarah" /></div>
            <div className="fg"><div className="lbl">Last Name <span className="req">*</span></div><input className="ctrl" type="text" defaultValue="Nakimuli" /></div>
            <div className="fg"><div className="lbl">University Email</div><input className="ctrl" type="email" defaultValue="snakimuli@isbatuniversity.ac.ug" /></div>
            <div className="fg">
              <div className="lbl">Phone</div>
              <div className="inp-wrap">
                <span className="inp-icon"><i className="lni lni-phone"></i></span>
                <input className="ctrl" type="tel" defaultValue="+256 700 123 456" />
              </div>
            </div>
            <div className="fg">
              <div className="lbl">Department <span className="req">*</span></div>
              <SearchSelect placeholder="Select department…" options={DEPARTMENTS} value={department} onChange={handleDepartmentChange} />
            </div>
            <div className="fg">
              <div className="lbl">Designation <span className="req">*</span></div>
              <SearchSelect
                placeholder={department ? 'Select designation…' : 'Select department first'}
                options={department ? DEPARTMENT_DESIGNATIONS[department] : []}
                value={designation}
                onChange={setDesignation}
              />
            </div>
            <div className="fg">
              <div className="lbl">Gender</div>
              <SearchSelect placeholder="Select…" value="Female" options={['Male', 'Female', 'Others']} />
            </div>
            <div className="fg"><div className="lbl">Date of Birth</div><input className="ctrl" type="text" defaultValue="15/Mar/1985" /></div>
            <div className="fg"><div className="lbl">Place of Birth</div><input className="ctrl" type="text" defaultValue="Kampala" /></div>
            <div className="fg">
              <div className="lbl">Nationality</div>
              <SearchSelect placeholder="Select…" value="Ugandan" options={NATIONALITIES} />
            </div>
            <div className="fg"><div className="lbl">National ID</div><input className="ctrl" type="text" defaultValue="CM86730412" /></div>
            <div className="fg"><div className="lbl">Religion</div><input className="ctrl" type="text" defaultValue="Christian" /></div>
            <div className="fg">
              <div className="lbl">Marital Status</div>
              <SearchSelect placeholder="Select…" value="Married" options={['Single', 'Married', 'Divorced', 'Widow', 'Widower', 'Separated']} />
            </div>
          </div>

          {/* ── Qualification Details ─────────────────────────────── */}
          <div className="sec-divider">Qualification Details</div>
          <div className="g3">
            <div className="fg">
              <div className="lbl">Highest Qualification <span className="req">*</span></div>
              <SearchSelect value="PhD" options={['PhD', "Master's Degree", "Bachelor's Degree", 'Postgraduate Diploma']} />
            </div>
            <div className="fg"><div className="lbl">Field of Study <span className="req">*</span></div><input className="ctrl" type="text" defaultValue="Computer Science" /></div>
            <div className="fg"><div className="lbl">Year of Completion</div><input className="ctrl" type="number" min={1980} max={2030} defaultValue={2018} /></div>
            <div className="fg span2"><div className="lbl">Institution <span className="req">*</span></div><input className="ctrl" type="text" defaultValue="Makerere University" /></div>
            <div className="fg"><div className="lbl">Years of Experience</div><input className="ctrl" type="number" min={0} max={60} defaultValue={7} /></div>
            <div className="fg span3"><div className="lbl">Specialisation Areas</div><input className="ctrl" type="text" defaultValue="Machine Learning, Algorithms" /></div>
            <div className="fg">
              <div className="lbl">Class Obtained</div>
              <SearchSelect placeholder="Select…" value="First Class" options={['First Class', 'Second Class Upper', 'Second Class Lower', 'Third Class', 'Pass', 'Distinction', 'Merit']} />
            </div>
            <div className="fg"><div className="lbl">Period of Study</div><input className="ctrl" type="text" defaultValue="2014 – 2018" /></div>
            <div className="fg">
              <div className="lbl">Proof of Award</div>
              <SearchSelect placeholder="Select…" value="Yes" options={['Yes', 'No']} />
            </div>
            <div className="fg">
              <div className="lbl">Proof of Transcripts</div>
              <SearchSelect placeholder="Select…" value="Yes" options={['Yes', 'No']} />
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

          {/* ── Affiliation ───────────────────────────────────────── */}
          <div className="sec-divider">Affiliation</div>
          <div className="g2">
            <div className="fg">
              <div className="lbl">Faculty <span className="req">*</span></div>
              <SearchSelect value="Faculty of Computing & Technology" options={['Faculty of Computing & Technology', 'Faculty of Business & Management', 'Faculty of Engineering']} />
            </div>
            <div className="fg">
              <div className="lbl">Status</div>
              <SearchSelect value="Active" options={['Active', 'On Leave', 'Visiting', 'Suspended']} />
            </div>
          </div>

        </div>

        <div className="modal-footer">
          <button className="btn btn-neu" onClick={handleClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => setSaved(true)}><i className="lni lni-checkmark"></i> Update Employee</button>
        </div>
      </div>
    </div>
  )
}
