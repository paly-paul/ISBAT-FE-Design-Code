'use client'
import { ModalProps } from './types'

export function NewLecturerModal({ isOpen, onClose, showToast }: ModalProps) {
  if (!isOpen) return null
  return (
    <div className="modal-overlay open" id="new-lecturer-modal" onClick={onClose}>
      <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr">
          <div className="modal-title"><i className="lni lni-user"></i> Add Lecturer</div>
          <button className="modal-close" onClick={onClose}><i className="lni lni-close"></i></button>
        </div>
        <div className="sec-divider">Personal &amp; Contact</div>
        <div className="g3">
          <div className="fg">
            <div className="lbl">Salutation</div>
            <select className="ctrl" id="nl-title"><option>Dr.</option><option>Prof.</option><option>Mr.</option><option>Ms.</option><option>Mrs.</option></select>
          </div>
          <div className="fg"><div className="lbl">First Name <span className="req">*</span></div><input className="ctrl" type="text" id="nl-fname" placeholder="First name" /></div>
          <div className="fg"><div className="lbl">Last Name <span className="req">*</span></div><input className="ctrl" type="text" id="nl-lname" placeholder="Last name" /></div>
          <div className="fg"><div className="lbl">University Email</div><input className="ctrl" type="email" id="nl-email" placeholder="auto-generated" /></div>
          <div className="fg">
            <div className="lbl">Phone</div>
            <div className="inp-wrap">
              <span className="inp-icon"><i className="lni lni-phone"></i></span>
              <input className="ctrl" type="tel" id="nl-phone" placeholder="+256 700 000 000" />
            </div>
          </div>
          <div className="fg">
            <div className="lbl">Designation <span className="req">*</span></div>
            <select className="ctrl" id="nl-desig">
              <option>Professor</option>
              <option>Associate Professor</option>
              <option>Senior Lecturer</option>
              <option>Lecturer</option>
              <option>Assistant Lecturer</option>
              <option>Teaching Assistant</option>
            </select>
          </div>
        </div>
        <div className="sec-divider">Qualification Details</div>
        <div className="g3">
          <div className="fg">
            <div className="lbl">Highest Qualification <span className="req">*</span></div>
            <select className="ctrl" id="nl-qual">
              <option>PhD</option><option>Master&apos;s Degree</option><option>Bachelor&apos;s Degree</option><option>Postgraduate Diploma</option>
            </select>
          </div>
          <div className="fg"><div className="lbl">Field of Study <span className="req">*</span></div><input className="ctrl" type="text" id="nl-field" placeholder="e.g. Computer Science" /></div>
          <div className="fg"><div className="lbl">Year of Completion</div><input className="ctrl" type="number" min={1980} max={2030} id="nl-year" placeholder="2020" /></div>
          <div className="fg span2"><div className="lbl">Institution <span className="req">*</span></div><input className="ctrl" type="text" id="nl-inst" placeholder="e.g. Makerere University" /></div>
          <div className="fg"><div className="lbl">Years of Experience</div><input className="ctrl" type="number" min={0} max={60} id="nl-exp" defaultValue={0} /></div>
          <div className="fg span3"><div className="lbl">Specialisation Areas</div><input className="ctrl" type="text" id="nl-spec" placeholder="e.g. Machine Learning, Algorithms, Databases" /></div>
        </div>
        <div className="sec-divider">Affiliation</div>
        <div className="g2">
          <div className="fg">
            <div className="lbl">Faculty <span className="req">*</span></div>
            <select className="ctrl" id="nl-faculty">
              <option>Faculty of Computing &amp; Technology</option>
              <option>Faculty of Business &amp; Management</option>
              <option>Faculty of Engineering</option>
            </select>
          </div>
          <div className="fg">
            <div className="lbl">Status</div>
            <select className="ctrl" id="nl-status">
              <option>Active</option><option>On Leave</option><option>Visiting</option><option>Suspended</option>
            </select>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-neu" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary"><i className="lni lni-checkmark"></i> Add Lecturer</button>
        </div>
      </div>
    </div>
  )
}
