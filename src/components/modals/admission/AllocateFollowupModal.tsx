'use client'
import { useState, useEffect } from 'react'
import { ModalProps } from '../types'

export interface FollowupEnquiry {
  ref: string; name: string; programme: string; assignedTo: string; followupDate: string; priority: string
}

const STAFF = ['Jane Nalule', 'David Okwir', 'Peter Ssentongo', 'Grace Achieng']

interface Props extends ModalProps {
  enquiry: FollowupEnquiry | null
  onAllocate: (ref: string, assignedTo: string, followupDate: string, priority: string) => void
}

export function AllocateFollowupModal({ isOpen, onClose, enquiry, onAllocate }: Props) {
  const [assignedTo, setAssignedTo] = useState('')
  const [followupDate, setFollowupDate] = useState('')
  const [priority, setPriority] = useState('Medium')
  const [notes, setNotes] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (enquiry) {
      setAssignedTo(enquiry.assignedTo === 'Unallocated' ? '' : enquiry.assignedTo)
      setFollowupDate(enquiry.followupDate === '—' ? '' : enquiry.followupDate)
      setPriority(enquiry.priority || 'Medium')
      setNotes(''); setErrors({})
    }
  }, [enquiry])

  if (!isOpen || !enquiry) return null

  function handleClose() { setAssignedTo(''); setFollowupDate(''); setPriority('Medium'); setNotes(''); setErrors({}); onClose() }

  function validate() {
    const e: Record<string, string> = {}
    if (!assignedTo)    e.assignedTo   = 'Please assign a staff member'
    if (!followupDate)  e.followupDate = 'Follow-up date is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  return (
    <div className="modal-overlay open">
      <div className="modal modal-md" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr">
          <div className="modal-title flex items-center gap-2"><i className="lni lni-calendar"></i> Allocate Follow-up &mdash; {enquiry.ref}</div>
          <button className="modal-close" onClick={handleClose}><i className="lni lni-close"></i></button>
        </div>

        <div className="info-box mb-3">
          <i className="lni lni-information"></i>
          <span>Assign <strong>{enquiry.name}</strong> ({enquiry.programme}) to a staff member for follow-up.</span>
        </div>

        <div className="g2">
          <div className="fg">
            <label className="lbl">Assign To <span className="req">*</span></label>
            <select className="ctrl" value={assignedTo}
              onChange={e => { setAssignedTo(e.target.value); if (errors.assignedTo) setErrors(p => ({ ...p, assignedTo: '' })) }}
              style={errors.assignedTo ? { borderColor: 'var(--red)' } : undefined}>
              <option value="">-- Select Staff --</option>
              {STAFF.map(s => <option key={s}>{s}</option>)}
            </select>
            {errors.assignedTo && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.assignedTo}</p>}
          </div>
          <div className="fg">
            <label className="lbl">Follow-up Date <span className="req">*</span></label>
            <input className="ctrl" type="date" value={followupDate}
              onChange={e => { setFollowupDate(e.target.value); if (errors.followupDate) setErrors(p => ({ ...p, followupDate: '' })) }}
              style={errors.followupDate ? { borderColor: 'var(--red)' } : undefined} />
            {errors.followupDate && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.followupDate}</p>}
          </div>
          <div className="fg" style={{ gridColumn: 'span 2' }}>
            <label className="lbl">Priority</label>
            <select className="ctrl" value={priority} onChange={e => setPriority(e.target.value)}>
              <option>High</option><option>Medium</option><option>Low</option>
            </select>
          </div>
          <div className="fg" style={{ gridColumn: 'span 2' }}>
            <label className="lbl">Notes</label>
            <textarea className="ctrl" rows={3} placeholder="Any context for the assigned staff member..." value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn" onClick={handleClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => { if (validate()) { onAllocate(enquiry.ref, assignedTo, followupDate, priority); handleClose() } }}>
            <i className="lni lni-checkmark"></i> Allocate Follow-up
          </button>
        </div>
      </div>
    </div>
  )
}
