'use client'
import { ModalProps } from './types'
import { ScrollTable } from './ScrollTable'

export function SpecializationModal({ isOpen, onClose, showToast }: ModalProps) {
  if (!isOpen) return null
  return (
    <div className="modal-overlay open" id="specialization-modal" onClick={onClose}>
      <div className="modal modal-md" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr">
          <div className="modal-title"><i className="lni lni-target"></i> Manage Specializations — MBA 2024</div>
          <button className="modal-close" onClick={onClose}><i className="lni lni-close"></i></button>
        </div>
        <div className="info-box mb-[14px]"><i className="lni lni-information"></i> Specializations are chosen by <strong>individual students</strong> (not the batch). A student can only select one specialization, which dictates which Specialization course units they must study (e.g. from Sem 3 for MBA).</div>
        <ScrollTable className="mb-[14px]">
          <table>
            <thead><tr><th>#</th><th>Specialization Name</th><th>Start Semester</th><th>Students Enrolled</th><th>Action</th></tr></thead>
            <tbody>
              <tr><td>1</td><td><strong>Finance Management</strong></td><td>Sem 3</td><td>42</td><td><button className="btn btn-neu btn-sm"><i className="lni lni-pencil"></i> Edit</button></td></tr>
              <tr><td>2</td><td><strong>Operations Management</strong></td><td>Sem 3</td><td>38</td><td><button className="btn btn-neu btn-sm"><i className="lni lni-pencil"></i> Edit</button></td></tr>
              <tr><td>3</td><td><strong>Human Resource Management</strong></td><td>Sem 3</td><td>27</td><td><button className="btn btn-neu btn-sm"><i className="lni lni-pencil"></i> Edit</button></td></tr>
            </tbody>
          </table>
        </ScrollTable>
        <div className="g2">
          <div className="fg"><div className="lbl">New Specialization Name</div><input className="ctrl" placeholder="e.g. Digital Marketing" /></div>
          <div className="fg"><div className="lbl">Starts from Semester</div><select className="ctrl"><option>Sem 3</option><option>Sem 4</option><option>Sem 5</option></select></div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-neu" onClick={onClose}>Close</button>
          <button className="btn btn-primary" onClick={() => showToast('Specialization added.', 'success')}><i className="lni lni-plus"></i> Add Specialization</button>
        </div>
      </div>
    </div>
  )
}
