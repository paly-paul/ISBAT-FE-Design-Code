'use client'
import { useState } from 'react'
import { ModalProps } from '../types'

export function StudentProfileModal({ isOpen, onClose, showToast }: ModalProps) {
  const [status, setStatus] = useState('Active')
  if (!isOpen) return null

  const s = {
    id: 'ISB/2024/BSCS/0142', first: 'Aisha', last: 'Nakamya', dob: '2001-03-15',
    gender: 'Female', nationality: 'Ugandan', nid: 'CM920100315ABCD',
    phone: '+256 701 234 567', uniEmail: 'aisha.nakamya@isbat.ac.ug',
    persEmail: 'aisha.nk@gmail.com', address: 'Plot 12, Kampala Road, Kampala',
    programme: 'BSc Computer Science', year: 'Year 2 / Sem 1', intake: 'September 2024',
    acadYear: '2025/2026', batch: 'BSCS-2024-SEP-A', admitted: '2024-09-10',
    cgpa: '3.72', feeClear: 'Cleared',
    fatherName: 'Hassan Nakamya', fatherPhone: '+256 772 111 222',
    motherName: 'Sarah Nakamya', motherPhone: '+256 772 333 444',
  }

  return (
    <div className="modal-overlay open">
      <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr">
          <div className="modal-title"><i className="lni lni-user"></i> View Student Profile &mdash; {s.id}</div>
          <button className="modal-close" onClick={onClose}><i className="lni lni-close"></i></button>
        </div>

        <div className="flex items-center gap-4 p-4 rounded-lg mb-4" style={{ background: 'var(--g100)' }}>
          <div className="flex items-center justify-center rounded-full font-bold text-white shrink-0" style={{ width: 52, height: 52, background: 'var(--b500)', fontSize: 18 }}>AN</div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-lg">{s.first} {s.last}</div>
            <div className="text-sm" style={{ color: 'var(--g500)' }}>{s.programme} &middot; {s.year}</div>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="badge-blue">{s.acadYear}</span>
            <span className="badge-green">{s.feeClear}</span>
            <span className="badge-green">{status}</span>
          </div>
        </div>

        <div className="sec-divider">Personal Information</div>
        <div className="g3 mb-4">
          <div className="fg"><label className="lbl">First Name</label><input className="ctrl" readOnly value={s.first}/></div>
          <div className="fg"><label className="lbl">Last Name</label><input className="ctrl" readOnly value={s.last}/></div>
          <div className="fg"><label className="lbl">Date of Birth</label><input className="ctrl" readOnly value={s.dob}/></div>
          <div className="fg"><label className="lbl">Gender</label><input className="ctrl" readOnly value={s.gender}/></div>
          <div className="fg"><label className="lbl">Nationality</label><input className="ctrl" readOnly value={s.nationality}/></div>
          <div className="fg"><label className="lbl">National ID</label><input className="ctrl" readOnly value={s.nid}/></div>
          <div className="fg"><label className="lbl">Phone</label><input className="ctrl" readOnly value={s.phone}/></div>
          <div className="fg"><label className="lbl">University Email</label><input className="ctrl" readOnly value={s.uniEmail}/></div>
          <div className="fg"><label className="lbl">Personal Email</label><input className="ctrl" readOnly value={s.persEmail}/></div>
          <div className="fg" style={{ gridColumn: 'span 3' }}><label className="lbl">Address</label><input className="ctrl" readOnly value={s.address}/></div>
        </div>

        <div className="sec-divider">Academic Details</div>
        <div className="g3 mb-4">
          <div className="fg"><label className="lbl">Programme</label><input className="ctrl" readOnly value={s.programme}/></div>
          <div className="fg"><label className="lbl">Year / Semester</label><input className="ctrl" readOnly value={s.year}/></div>
          <div className="fg"><label className="lbl">Intake</label><input className="ctrl" readOnly value={s.intake}/></div>
          <div className="fg"><label className="lbl">Academic Year</label><input className="ctrl" readOnly value={s.acadYear}/></div>
          <div className="fg"><label className="lbl">Batch Code</label><input className="ctrl" readOnly value={s.batch}/></div>
          <div className="fg"><label className="lbl">Admission Date</label><input className="ctrl" readOnly value={s.admitted}/></div>
          <div className="fg"><label className="lbl">CGPA</label><input className="ctrl" readOnly value={s.cgpa}/></div>
          <div className="fg">
            <label className="lbl">Status</label>
            <select className="ctrl" value={status} onChange={e => setStatus(e.target.value)}>
              <option>Active</option><option>Suspended</option><option>Deferred</option><option>Graduated</option>
            </select>
          </div>
          <div className="fg"><label className="lbl">Fee Clearance</label><input className="ctrl" readOnly value={s.feeClear}/></div>
        </div>

        <div className="sec-divider">Family / Guardian</div>
        <div className="g2 mb-4">
          <div className="fg"><label className="lbl">Father Name</label><input className="ctrl" readOnly value={s.fatherName}/></div>
          <div className="fg"><label className="lbl">Father Phone</label><input className="ctrl" readOnly value={s.fatherPhone}/></div>
          <div className="fg"><label className="lbl">Mother Name</label><input className="ctrl" readOnly value={s.motherName}/></div>
          <div className="fg"><label className="lbl">Mother Phone</label><input className="ctrl" readOnly value={s.motherPhone}/></div>
        </div>

        <div className="modal-footer">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => showToast('Student profile updated successfully.', 'success')}>Save Changes</button>
        </div>
      </div>
    </div>
  )
}
