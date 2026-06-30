'use client'
import { useState } from 'react'
import { ModalProps } from '../types'
import { SuccessPopup } from './SuccessPopup'
import { SearchSelect } from '@/components/SearchSelect'

const NATIONALITIES = [
  'Ugandan', 'Kenyan', 'Tanzanian', 'Rwandan', 'Burundian', 'South Sudanese',
  'Ethiopian', 'Nigerian', 'Ghanaian', 'South African', 'Indian', 'Chinese',
  'British', 'American', 'Other',
]

export function NewLecturerModal({ isOpen, onClose, showToast }: ModalProps) {
  const [saved, setSaved] = useState(false)

  if (!isOpen) return null

  function handleClose() { setSaved(false); onClose() }

  if (saved) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <SuccessPopup title="Lecturer Added!" subtitle="The new lecturer has been saved successfully." onClose={handleClose} />
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay open" id="new-lecturer-modal">
      <div className="modal modal-80 modal-flex" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr">
          <div className="modal-title"><i className="lni lni-user"></i> Add Lecturer</div>
          <button className="modal-close" onClick={onClose}><i className="lni lni-close"></i></button>
        </div>

        <div className="modal-scroll">

          {/* ── Personal Details ─────────────────────────────────── */}
          <div className="sec-divider">Personal Details</div>
          <div className="g3">
            <div className="fg">
              <div className="lbl">Salutation</div>
              <SearchSelect options={['Dr.', 'Prof.', 'Mr.', 'Ms.', 'Mrs.']} />
            </div>
            <div className="fg"><div className="lbl">First Name <span className="req">*</span></div><input className="ctrl" type="text" placeholder="First name" /></div>
            <div className="fg"><div className="lbl">Last Name <span className="req">*</span></div><input className="ctrl" type="text" placeholder="Last name" /></div>
            <div className="fg"><div className="lbl">University Email</div><input className="ctrl" type="email" placeholder="auto-generated" /></div>
            <div className="fg">
              <div className="lbl">Phone</div>
              <div className="inp-wrap">
                <span className="inp-icon"><i className="lni lni-phone"></i></span>
                <input className="ctrl" type="tel" placeholder="+256 700 000 000" />
              </div>
            </div>
            <div className="fg">
              <div className="lbl">Designation <span className="req">*</span></div>
              <SearchSelect options={['Professor', 'Associate Professor', 'Senior Lecturer', 'Lecturer', 'Assistant Lecturer', 'Teaching Assistant']} />
            </div>
            <div className="fg">
              <div className="lbl">Gender</div>
              <SearchSelect placeholder="Select…" options={['Male', 'Female', 'Others']} />
            </div>
            <div className="fg"><div className="lbl">Date of Birth</div><input className="ctrl" type="date" /></div>
            <div className="fg"><div className="lbl">Place of Birth</div><input className="ctrl" type="text" placeholder="e.g. Kampala" /></div>
            <div className="fg">
              <div className="lbl">Nationality</div>
              <SearchSelect placeholder="Select…" options={NATIONALITIES} />
            </div>
            <div className="fg"><div className="lbl">National ID</div><input className="ctrl" type="text" placeholder="e.g. CM12345678" /></div>
            <div className="fg"><div className="lbl">Religion</div><input className="ctrl" type="text" placeholder="e.g. Christian" /></div>
            <div className="fg">
              <div className="lbl">Marital Status</div>
              <SearchSelect placeholder="Select…" options={['Single', 'Married', 'Divorced', 'Widow', 'Widower', 'Separated']} />
            </div>
          </div>

          {/* ── Qualification Details ─────────────────────────────── */}
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

          {/* ── Affiliation ───────────────────────────────────────── */}
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

        </div>

        <div className="modal-footer">
          <button className="btn btn-neu" onClick={handleClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => setSaved(true)}><i className="lni lni-checkmark"></i> Add Lecturer</button>
        </div>
      </div>
    </div>
  )
}
