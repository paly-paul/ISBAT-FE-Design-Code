'use client'
import { ModalProps } from './types'
import { ScrollTable } from './ScrollTable'

export function RoomMgmtModal({ isOpen, onClose, showToast }: ModalProps) {
  if (!isOpen) return null
  return (
    <div className="modal-overlay open" id="room-mgmt-modal" onClick={onClose}>
      <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr">
          <div className="modal-title"><i className="lni lni-apartment"></i> Room Management</div>
          <button className="modal-close" onClick={onClose}><i className="lni lni-close"></i></button>
        </div>
        <div className="info-box mb-[14px]"><i className="lni lni-information"></i> Allocation prioritises matching <strong>student count to room capacity</strong>. Specialised subjects (e.g. Linux Administration) must only be allocated to specified labs. Rooms are clash-checked against <strong>all batches</strong> simultaneously.</div>
        <ScrollTable className="mb-[14px]">
          <table>
            <thead><tr><th>Room Code</th><th>Room Name</th><th>Capacity</th><th>Type</th><th>Specialised For</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              <tr><td className="font-mono">LR-01</td><td>Lecture Room 1</td><td>60</td><td><span className="badge badge-blue">Lecture</span></td><td>—</td><td><span className="badge badge-green"><i className="lni lni-checkmark"></i> Free</span></td><td><button className="btn btn-neu btn-sm"><i className="lni lni-pencil"></i> Edit</button></td></tr>
              <tr><td className="font-mono">LR-02</td><td>Lecture Room 2</td><td>60</td><td><span className="badge badge-blue">Lecture</span></td><td>—</td><td><span className="badge badge-amber"><i className="lni lni-warning"></i> Mon 8–10</span></td><td><button className="btn btn-neu btn-sm"><i className="lni lni-pencil"></i> Edit</button></td></tr>
              <tr><td className="font-mono">Lab-A</td><td>Linux Lab A</td><td>40</td><td><span className="badge badge-purple">Specialist</span></td><td>Linux / OS subjects only</td><td><span className="badge badge-green"><i className="lni lni-checkmark"></i> Free</span></td><td><button className="btn btn-neu btn-sm"><i className="lni lni-pencil"></i> Edit</button></td></tr>
              <tr><td className="font-mono">Lab-B</td><td>General Computer Lab B</td><td>40</td><td><span className="badge badge-cyan">Computer Lab</span></td><td>—</td><td><span className="badge badge-green"><i className="lni lni-checkmark"></i> Free</span></td><td><button className="btn btn-neu btn-sm"><i className="lni lni-pencil"></i> Edit</button></td></tr>
            </tbody>
          </table>
        </ScrollTable>
        <div className="g3">
          <div className="fg"><div className="lbl">Room Code <span className="req">*</span></div><input className="ctrl" placeholder="e.g. LR-03" /></div>
          <div className="fg"><div className="lbl">Room Name</div><input className="ctrl" placeholder="e.g. Seminar Room 3" /></div>
          <div className="fg"><div className="lbl">Capacity <span className="req">*</span></div><input className="ctrl" type="number" placeholder="e.g. 45" /></div>
          <div className="fg"><div className="lbl">Type</div><select className="ctrl"><option>Lecture</option><option>Specialist Lab</option><option>Computer Lab</option><option>Case Room</option></select></div>
          <div className="fg span2"><div className="lbl">Specialised For</div><input className="ctrl" placeholder="e.g. Linux Administration, Nursing Practical" /></div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-neu" onClick={onClose}>Close</button>
          <button className="btn btn-primary" onClick={() => showToast('Room saved.', 'success')}><i className="lni lni-plus"></i> Add Room</button>
        </div>
      </div>
    </div>
  )
}
