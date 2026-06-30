'use client'
import { ModalProps } from '../types'

export function EnquiryFormModal({ isOpen, onClose, showToast }: ModalProps) {
  if (!isOpen) return null

  return (
    <div className="modal-overlay open" onClick={onClose}>
      <div className="modal modal-md" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr">
          <div className="modal-title"><i className="lni lni-notepad"></i> New Enquiry &mdash; Information Desk</div>
          <button className="modal-close" onClick={onClose}><i className="lni lni-close"></i></button>
        </div>

        <div className="g2 mb-4">
          <div className="fg"><label className="lbl">First Name</label><input className="ctrl" placeholder="Enter first name" /></div>
          <div className="fg"><label className="lbl">Last Name</label><input className="ctrl" placeholder="Enter last name" /></div>
          <div className="fg"><label className="lbl">Phone</label><input className="ctrl" placeholder="+256 7XX XXX XXX" /></div>
          <div className="fg"><label className="lbl">Email</label><input className="ctrl" placeholder="email@example.com" /></div>
          <div className="fg">
            <label className="lbl">Enquiry Channel</label>
            <select className="ctrl"><option value="">Select channel</option><option>Walk-In</option><option>Phone Call</option><option>Email</option><option>Website</option><option>Social Media</option><option>Referral</option></select>
          </div>
          <div className="fg">
            <label className="lbl">Programme Interest</label>
            <select className="ctrl"><option value="">Select programme</option><option>BSc Computer Science</option><option>BBA Management</option><option>BSc Nursing</option><option>Diploma IT</option><option>BBA Accounting</option></select>
          </div>
          <div className="fg">
            <label className="lbl">Preferred Intake</label>
            <select className="ctrl"><option value="">Select intake</option><option>September 2026</option><option>January 2027</option><option>May 2027</option></select>
          </div>
          <div className="fg">
            <label className="lbl">Preferred Study Mode</label>
            <select className="ctrl"><option value="">Select mode</option><option>Full-Time</option><option>Part-Time</option><option>Weekend</option><option>Evening</option><option>Online / ODL</option></select>
          </div>
          <div className="fg" style={{ gridColumn: 'span 2' }}>
            <label className="lbl">Notes</label>
            <textarea className="ctrl" rows={3} placeholder="Additional notes or remarks..." />
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => { showToast('Enquiry saved successfully.', 'success'); onClose() }}>
            <i className="lni lni-save"></i> Save Enquiry
          </button>
        </div>
      </div>
    </div>
  )
}
