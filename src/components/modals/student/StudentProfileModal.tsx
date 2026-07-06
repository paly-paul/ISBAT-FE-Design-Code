'use client'
import { useState, useEffect, useLayoutEffect, useRef } from 'react'
import { ModalProps } from '../types'

export interface StudentRecord {
  id: string; name: string; programme: string; batch: string; status: string
}

type Tab = 'personal' | 'application' | 'qualification' | 'family' | 'documents'
const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'personal',      label: 'Personal Information', icon: 'lni-user-4' },
  { id: 'application',   label: 'Application Details',  icon: 'lni-clipboard' },
  { id: 'qualification', label: 'Qualification',        icon: 'lni-graduation' },
  { id: 'family',        label: 'Family / Guardian',    icon: 'lni-users-2' },
  { id: 'documents',     label: 'Documents',            icon: 'lni-folder-2' },
]

const MOCK_PERSONAL = {
  dob: '15 Mar 2003',
  gender: 'Female',
  nationality: 'Ugandan',
  nationalId: 'CM03031512345',
  phone: '+256 701 234 567',
  address: 'Plot 12, Kampala Road, Kampala',
}

const MOCK_ENROLLMENT = {
  campus: 'Main Campus',
  enrolled: '10 Sept 2024',
}

const MOCK_QUALIFICATION = {
  type: 'A-Level (UACE)',
  institution: 'Kampala S.S.',
  year: '2023',
  indexNo: 'U1234/056',
  percentage: '14 Points',
  duration: '2 Years',
}

const MOCK_FAMILY = {
  fatherName: 'Not on file',
  fatherPhone: '—',
  motherName: 'Not on file',
  motherPhone: '—',
  emergencyName: 'Not on file',
  emergencyPhone: '—',
}

const MOCK_DOCUMENTS = [
  { label: 'O-Level Certificate', icon: 'lni-certificate', status: 'Uploaded' },
  { label: 'A-Level Certificate', icon: 'lni-certificate', status: 'Uploaded' },
  { label: 'Passport Photo',      icon: 'lni-image',       status: 'Uploaded' },
  { label: 'National ID',         icon: 'lni-id-card',     status: 'Pending'  },
]

interface Props extends ModalProps {
  student: StudentRecord | null
}

export function StudentProfileModal({ isOpen, onClose, student }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('personal')
  const tabRefs = useRef<Partial<Record<Tab, HTMLButtonElement>>>({})
  const [indicator, setIndicator] = useState({ left: 0, width: 0 })

  useEffect(() => {
    if (student) setActiveTab('personal')
  }, [student])

  useLayoutEffect(() => {
    const el = tabRefs.current[activeTab]
    if (el) setIndicator({ left: el.offsetLeft, width: el.offsetWidth })
  }, [activeTab, isOpen])

  if (!isOpen || !student) return null

  const [firstName, ...rest] = student.name.split(' ')
  const lastName = rest.join(' ')
  const initials = `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase() || '—'

  return (
    <div className="modal-overlay open">
      <div className="modal modal-80 modal-flex" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr">
          <div className="modal-title flex items-center gap-2">
            <i className="lni lni-user"></i> Student Profile: <span className="text-b600">{student.name}</span>
          </div>
          <button className="modal-close" onClick={onClose}><i className="lni lni-close"></i></button>
        </div>

        <div className="modal-scroll">
          <div className="card mb-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center rounded-full font-bold text-white shrink-0" style={{ width: 64, height: 64, background: 'var(--b500)', fontSize: 22 }}>
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-lg text-g900">{student.name}</div>
                <div className="text-sm text-g500">{student.programme} &middot; {student.batch}</div>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="badge badge-blue font-mono">{student.id}</span>
                <span className="badge badge-grey">{student.status}</span>
              </div>
            </div>
          </div>

          <div>
            <div className="tab-bar">
              {TABS.map(t => (
                <button
                  key={t.id}
                  ref={el => { if (el) tabRefs.current[t.id] = el }}
                  className={`tab-btn${activeTab === t.id ? ' active' : ''}`}
                  onClick={() => setActiveTab(t.id)}
                >
                  <i className={`lni ${t.icon}`} /> {t.label}
                </button>
              ))}
              <span className="tab-indicator" style={{ left: indicator.left, width: indicator.width }} />
            </div>

            <div key={activeTab} className="pt-5 tab-panel-in">
              {activeTab === 'personal' && (
                <div className="g3">
                  <div className="fg"><label className="lbl">First Name</label><input className="ctrl" readOnly value={firstName || ''} /></div>
                  <div className="fg"><label className="lbl">Last Name</label><input className="ctrl" readOnly value={lastName || '—'} /></div>
                  <div className="fg"><label className="lbl">Date of Birth</label><input className="ctrl" readOnly value={MOCK_PERSONAL.dob} /></div>
                  <div className="fg"><label className="lbl">Gender</label><input className="ctrl" readOnly value={MOCK_PERSONAL.gender} /></div>
                  <div className="fg"><label className="lbl">Nationality</label><input className="ctrl" readOnly value={MOCK_PERSONAL.nationality} /></div>
                  <div className="fg"><label className="lbl">National ID</label><input className="ctrl" readOnly value={MOCK_PERSONAL.nationalId} /></div>
                  <div className="fg"><label className="lbl">Phone</label><input className="ctrl" readOnly value={MOCK_PERSONAL.phone} /></div>
                  <div className="fg"><label className="lbl">Email</label><input className="ctrl" readOnly value={`${firstName?.toLowerCase()}.${lastName?.toLowerCase() || ''}@isbat.ac.ug`} /></div>
                  <div className="fg" style={{ gridColumn: 'span 2' }}><label className="lbl">Address</label><input className="ctrl" readOnly value={MOCK_PERSONAL.address} /></div>
                </div>
              )}

              {activeTab === 'application' && (
                <div className="g3">
                  <div className="fg"><label className="lbl">Student ID</label><input className="ctrl font-mono" readOnly value={student.id} /></div>
                  <div className="fg"><label className="lbl">Status</label><input className="ctrl" readOnly value={student.status} /></div>
                  <div className="fg"><label className="lbl">Programme</label><input className="ctrl" readOnly value={student.programme} /></div>
                  <div className="fg"><label className="lbl">Batch</label><input className="ctrl" readOnly value={student.batch} /></div>
                  <div className="fg"><label className="lbl">Campus</label><input className="ctrl" readOnly value={MOCK_ENROLLMENT.campus} /></div>
                  <div className="fg"><label className="lbl">Enrolled</label><input className="ctrl" readOnly value={MOCK_ENROLLMENT.enrolled} /></div>
                </div>
              )}

              {activeTab === 'qualification' && (
                <div className="g3">
                  <div className="fg"><label className="lbl">Type</label><input className="ctrl" readOnly value={MOCK_QUALIFICATION.type} /></div>
                  <div className="fg"><label className="lbl">Institution</label><input className="ctrl" readOnly value={MOCK_QUALIFICATION.institution} /></div>
                  <div className="fg"><label className="lbl">Year</label><input className="ctrl" readOnly value={MOCK_QUALIFICATION.year} /></div>
                  <div className="fg"><label className="lbl">Index No.</label><input className="ctrl" readOnly value={MOCK_QUALIFICATION.indexNo} /></div>
                  <div className="fg"><label className="lbl">Percentage / GPA</label><input className="ctrl" readOnly value={MOCK_QUALIFICATION.percentage} /></div>
                  <div className="fg"><label className="lbl">Duration</label><input className="ctrl" readOnly value={MOCK_QUALIFICATION.duration} /></div>
                </div>
              )}

              {activeTab === 'family' && (
                <div className="g2">
                  <div className="fg"><label className="lbl">Father Name</label><input className="ctrl" readOnly value={MOCK_FAMILY.fatherName} /></div>
                  <div className="fg"><label className="lbl">Father Phone</label><input className="ctrl" readOnly value={MOCK_FAMILY.fatherPhone} /></div>
                  <div className="fg"><label className="lbl">Mother Name</label><input className="ctrl" readOnly value={MOCK_FAMILY.motherName} /></div>
                  <div className="fg"><label className="lbl">Mother Phone</label><input className="ctrl" readOnly value={MOCK_FAMILY.motherPhone} /></div>
                  <div className="fg"><label className="lbl">Emergency Contact</label><input className="ctrl" readOnly value={MOCK_FAMILY.emergencyName} /></div>
                  <div className="fg"><label className="lbl">Emergency Phone</label><input className="ctrl" readOnly value={MOCK_FAMILY.emergencyPhone} /></div>
                </div>
              )}

              {activeTab === 'documents' && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {MOCK_DOCUMENTS.map(doc => (
                    <div key={doc.label} className="border border-g200 bg-white rounded-[10px] overflow-hidden">
                      <div className="h-20 flex items-center justify-center bg-b50">
                        <i className={`lni ${doc.icon} text-b500 text-2xl`} />
                      </div>
                      <div className="p-3">
                        <p className="text-sm font-medium text-g800 mb-1">{doc.label}</p>
                        <span className={`badge ${doc.status === 'Uploaded' ? 'badge-green' : 'badge-amber'}`}>{doc.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-neu" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}
