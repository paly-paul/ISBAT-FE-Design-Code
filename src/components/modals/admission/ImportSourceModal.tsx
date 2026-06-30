'use client'
import { useState } from 'react'
import { ModalProps } from '../types'

const ENQUIRY_RECORDS = [
  { ref: 'ENQ-2026-0011', name: 'David Okello',   phone: '+256 701 000 111', email: 'd.okello@mail.com',   programme: 'BSc Computer Science', mode: 'Full-Time',  status: 'Hot Lead' },
  { ref: 'ENQ-2026-0012', name: 'Grace Atim',      phone: '+256 772 000 222', email: 'g.atim@mail.com',     programme: 'BBA Management',       mode: 'Weekend',    status: 'Warm' },
  { ref: 'ENQ-2026-0013', name: 'Moses Ssempala',  phone: '+256 703 000 333', email: 'm.ssempala@mail.com', programme: 'Diploma IT',           mode: 'Full-Time',  status: 'Hot Lead' },
  { ref: 'ENQ-2026-0014', name: 'Fatima Nankya',   phone: '+256 785 000 444', email: 'f.nankya@mail.com',   programme: 'BSc Nursing',          mode: 'Full-Time',  status: 'New' },
  { ref: 'ENQ-2026-0015', name: 'Brian Mugisha',   phone: '+256 704 000 555', email: 'b.mugisha@mail.com',  programme: 'BBA Accounting',       mode: 'Evening',    status: 'Warm' },
]

export function ImportSourceModal({ isOpen, onClose, showToast }: ModalProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRecord, setSelectedRecord] = useState<typeof ENQUIRY_RECORDS[0] | null>(null)
  if (!isOpen) return null

  const filtered = ENQUIRY_RECORDS.filter(r =>
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.ref.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.programme.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="modal-overlay open" onClick={onClose}>
      <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr">
          <div className="modal-title"><i className="lni lni-download"></i> Import from Enquiry</div>
          <button className="modal-close" onClick={onClose}><i className="lni lni-close"></i></button>
        </div>

        <div className="info-box mb-3">
          <i className="lni lni-information"></i>
          <span>Select an enquiry record below to pre-fill the application payment form.</span>
        </div>

        <div className="inp-wrap mb-3">
          <i className="inp-icon lni lni-search-alt"></i>
          <input className="ctrl" placeholder="Search by name, ref or programme..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>

        <div className="overflow-auto mb-3" style={{ maxHeight: 260 }}>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left" style={{ color: 'var(--g500)', borderBottom: '1px solid var(--g200)' }}>
                <th className="p-2">Ref</th><th className="p-2">Name</th><th className="p-2">Phone / Email</th>
                <th className="p-2">Programme Interest</th><th className="p-2">Mode</th><th className="p-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.ref} className={`cursor-pointer hover:bg-b50 ${selectedRecord?.ref === r.ref ? 'bg-b50' : ''}`}
                    style={selectedRecord?.ref === r.ref ? { outline: '2px solid var(--b400)', borderRadius: 'var(--rxs)' } : {}}
                    onClick={() => setSelectedRecord(r)}>
                  <td className="p-2 font-mono text-xs">{r.ref}</td>
                  <td className="p-2 font-medium">{r.name}</td>
                  <td className="p-2"><div>{r.phone}</div><div className="text-xs" style={{ color: 'var(--g400)' }}>{r.email}</div></td>
                  <td className="p-2">{r.programme}</td>
                  <td className="p-2">{r.mode}</td>
                  <td className="p-2"><span className={r.status === 'Hot Lead' ? 'badge-red' : r.status === 'Warm' ? 'badge-amber' : 'badge-blue'}>{r.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {selectedRecord && (
          <div className="success-box mb-3">
            <i className="lni lni-checkmark-circle"></i>
            <span>Selected: <strong>{selectedRecord.name}</strong> &mdash; {selectedRecord.programme} ({selectedRecord.mode})</span>
          </div>
        )}

        <div className="modal-footer">
          <span className="text-sm" style={{ color: 'var(--g500)' }}>{selectedRecord ? '1 record selected' : 'No selection'}</span>
          <div className="flex gap-2">
            <button className="btn" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" disabled={!selectedRecord} onClick={() => { showToast('Enquiry imported to application payment.', 'success'); onClose() }}>
              <i className="lni lni-enter"></i> Import to Application Payment
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
