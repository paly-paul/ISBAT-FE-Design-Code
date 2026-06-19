'use client'
import { useState } from 'react'
import { ModalProps } from './types'
import { SuccessPopup } from './SuccessPopup'

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
    <div className="modal-overlay open" id="new-lecturer-modal" onClick={onClose}>
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
              <select className="ctrl"><option>Dr.</option><option>Prof.</option><option>Mr.</option><option>Ms.</option><option>Mrs.</option></select>
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
              <select className="ctrl">
                <option>Professor</option><option>Associate Professor</option><option>Senior Lecturer</option>
                <option>Lecturer</option><option>Assistant Lecturer</option><option>Teaching Assistant</option>
              </select>
            </div>
            <div className="fg">
              <div className="lbl">Gender</div>
              <select className="ctrl"><option value="">Select…</option><option>Male</option><option>Female</option><option>Others</option></select>
            </div>
            <div className="fg"><div className="lbl">Date of Birth</div><input className="ctrl" type="text" placeholder="dd/MMM/yyyy" /></div>
            <div className="fg"><div className="lbl">Place of Birth</div><input className="ctrl" type="text" placeholder="e.g. Kampala" /></div>
            <div className="fg">
              <div className="lbl">Nationality</div>
              <select className="ctrl">
                <option value="">Select…</option>
                {NATIONALITIES.map(n => <option key={n}>{n}</option>)}
              </select>
            </div>
            <div className="fg"><div className="lbl">National ID</div><input className="ctrl" type="text" placeholder="e.g. CM12345678" /></div>
            <div className="fg"><div className="lbl">Religion</div><input className="ctrl" type="text" placeholder="e.g. Christian" /></div>
            <div className="fg">
              <div className="lbl">Marital Status</div>
              <select className="ctrl">
                <option value="">Select…</option>
                <option>Single</option><option>Married</option><option>Divorced</option>
                <option>Widow</option><option>Widower</option><option>Separated</option>
              </select>
            </div>
          </div>

          {/* ── Qualification Details ─────────────────────────────── */}
          <div className="sec-divider">Qualification Details</div>
          <div className="g3">
            <div className="fg">
              <div className="lbl">Highest Qualification <span className="req">*</span></div>
              <select className="ctrl"><option>PhD</option><option>Master&apos;s Degree</option><option>Bachelor&apos;s Degree</option><option>Postgraduate Diploma</option></select>
            </div>
            <div className="fg"><div className="lbl">Field of Study <span className="req">*</span></div><input className="ctrl" type="text" placeholder="e.g. Computer Science" /></div>
            <div className="fg"><div className="lbl">Year of Completion</div><input className="ctrl" type="number" min={1980} max={2030} placeholder="2020" /></div>
            <div className="fg span2"><div className="lbl">Institution <span className="req">*</span></div><input className="ctrl" type="text" placeholder="e.g. Makerere University" /></div>
            <div className="fg"><div className="lbl">Years of Experience</div><input className="ctrl" type="number" min={0} max={60} defaultValue={0} /></div>
            <div className="fg span3"><div className="lbl">Specialisation Areas</div><input className="ctrl" type="text" placeholder="e.g. Machine Learning, Algorithms, Databases" /></div>
            <div className="fg">
              <div className="lbl">Class Obtained</div>
              <select className="ctrl">
                <option value="">Select…</option>
                <option>First Class</option><option>Second Class Upper</option><option>Second Class Lower</option>
                <option>Third Class</option><option>Pass</option><option>Distinction</option><option>Merit</option>
              </select>
            </div>
            <div className="fg"><div className="lbl">Period of Study</div><input className="ctrl" type="text" placeholder="e.g. 2016 – 2020" /></div>
            <div className="fg">
              <div className="lbl">Proof of Award</div>
              <select className="ctrl"><option value="">Select…</option><option>Yes</option><option>No</option></select>
            </div>
            <div className="fg">
              <div className="lbl">Proof of Transcripts</div>
              <select className="ctrl"><option value="">Select…</option><option>Yes</option><option>No</option></select>
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
              <select className="ctrl">
                <option>Faculty of Computing &amp; Technology</option>
                <option>Faculty of Business &amp; Management</option>
                <option>Faculty of Engineering</option>
              </select>
            </div>
            <div className="fg">
              <div className="lbl">Status</div>
              <select className="ctrl"><option>Active</option><option>On Leave</option><option>Visiting</option><option>Suspended</option></select>
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
