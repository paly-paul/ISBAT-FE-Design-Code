'use client'
import { useState } from 'react'
import { ModalProps } from './types'
import { SuccessPopup } from './SuccessPopup'

const NATIONALITIES = [
  'Ugandan', 'Kenyan', 'Tanzanian', 'Rwandan', 'Burundian', 'South Sudanese',
  'Ethiopian', 'Nigerian', 'Ghanaian', 'South African', 'Indian', 'Chinese',
  'British', 'American', 'Other',
]

export function EditLecturerModal({ isOpen, onClose, showToast }: ModalProps) {
  const [saved, setSaved] = useState(false)

  if (!isOpen) return null

  function handleClose() { setSaved(false); onClose() }

  if (saved) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <SuccessPopup title="Lecturer Updated!" subtitle="Your changes have been saved successfully." onClose={handleClose} />
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay open" id="edit-lecturer-modal" onClick={onClose}>
      <div className="modal modal-80 modal-flex" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr">
          <div className="modal-title"><i className="lni lni-pencil"></i> Edit Lecturer</div>
          <button className="modal-close" onClick={onClose}><i className="lni lni-close"></i></button>
        </div>

        <div className="modal-scroll">

          {/* ── Personal Details ─────────────────────────────────── */}
          <div className="sec-divider">Personal Details</div>
          <div className="g3">
            <div className="fg">
              <div className="lbl">Salutation</div>
              <select className="ctrl" defaultValue="Dr."><option>Dr.</option><option>Prof.</option><option>Mr.</option><option>Ms.</option><option>Mrs.</option></select>
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
              <div className="lbl">Designation <span className="req">*</span></div>
              <select className="ctrl" defaultValue="Senior Lecturer">
                <option>Professor</option><option>Associate Professor</option><option>Senior Lecturer</option>
                <option>Lecturer</option><option>Assistant Lecturer</option><option>Teaching Assistant</option>
              </select>
            </div>
            <div className="fg">
              <div className="lbl">Gender</div>
              <select className="ctrl" defaultValue="Female"><option value="">Select…</option><option>Male</option><option>Female</option><option>Others</option></select>
            </div>
            <div className="fg"><div className="lbl">Date of Birth</div><input className="ctrl" type="text" defaultValue="15/Mar/1985" /></div>
            <div className="fg"><div className="lbl">Place of Birth</div><input className="ctrl" type="text" defaultValue="Kampala" /></div>
            <div className="fg">
              <div className="lbl">Nationality</div>
              <select className="ctrl" defaultValue="Ugandan">
                <option value="">Select…</option>
                {NATIONALITIES.map(n => <option key={n}>{n}</option>)}
              </select>
            </div>
            <div className="fg"><div className="lbl">National ID</div><input className="ctrl" type="text" defaultValue="CM86730412" /></div>
            <div className="fg"><div className="lbl">Religion</div><input className="ctrl" type="text" defaultValue="Christian" /></div>
            <div className="fg">
              <div className="lbl">Marital Status</div>
              <select className="ctrl" defaultValue="Married">
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
              <select className="ctrl" defaultValue="PhD"><option>PhD</option><option>Master&apos;s Degree</option><option>Bachelor&apos;s Degree</option><option>Postgraduate Diploma</option></select>
            </div>
            <div className="fg"><div className="lbl">Field of Study <span className="req">*</span></div><input className="ctrl" type="text" defaultValue="Computer Science" /></div>
            <div className="fg"><div className="lbl">Year of Completion</div><input className="ctrl" type="number" min={1980} max={2030} defaultValue={2018} /></div>
            <div className="fg span2"><div className="lbl">Institution <span className="req">*</span></div><input className="ctrl" type="text" defaultValue="Makerere University" /></div>
            <div className="fg"><div className="lbl">Years of Experience</div><input className="ctrl" type="number" min={0} max={60} defaultValue={7} /></div>
            <div className="fg span3"><div className="lbl">Specialisation Areas</div><input className="ctrl" type="text" defaultValue="Machine Learning, Algorithms" /></div>
            <div className="fg">
              <div className="lbl">Class Obtained</div>
              <select className="ctrl" defaultValue="First Class">
                <option value="">Select…</option>
                <option>First Class</option><option>Second Class Upper</option><option>Second Class Lower</option>
                <option>Third Class</option><option>Pass</option><option>Distinction</option><option>Merit</option>
              </select>
            </div>
            <div className="fg"><div className="lbl">Period of Study</div><input className="ctrl" type="text" defaultValue="2014 – 2018" /></div>
            <div className="fg">
              <div className="lbl">Proof of Award</div>
              <select className="ctrl" defaultValue="Yes"><option value="">Select…</option><option>Yes</option><option>No</option></select>
            </div>
            <div className="fg">
              <div className="lbl">Proof of Transcripts</div>
              <select className="ctrl" defaultValue="Yes"><option value="">Select…</option><option>Yes</option><option>No</option></select>
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
              <select className="ctrl" defaultValue="Faculty of Computing & Technology">
                <option>Faculty of Computing &amp; Technology</option>
                <option>Faculty of Business &amp; Management</option>
                <option>Faculty of Engineering</option>
              </select>
            </div>
            <div className="fg">
              <div className="lbl">Status</div>
              <select className="ctrl" defaultValue="Active"><option>Active</option><option>On Leave</option><option>Visiting</option><option>Suspended</option></select>
            </div>
          </div>

        </div>

        <div className="modal-footer">
          <button className="btn btn-neu" onClick={handleClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => setSaved(true)}><i className="lni lni-checkmark"></i> Update Lecturer</button>
        </div>
      </div>
    </div>
  )
}
