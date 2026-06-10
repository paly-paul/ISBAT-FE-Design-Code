'use client'
import { ModalProps } from './types'
import { ScrollTable } from './ScrollTable'

export function TtImportModal({ isOpen, onClose, showToast }: ModalProps) {
  if (!isOpen) return null
  return (
    <div className="modal-overlay open" id="tt-import-modal" onClick={onClose}>
      <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr">
          <div className="modal-title"><i className="lni lni-download"></i> Import Timetable from Excel</div>
          <button className="modal-close" onClick={onClose}><i className="lni lni-close"></i></button>
        </div>
        <div className="info-box mb-[14px]"><i className="lni lni-information"></i> Required columns: <span className="font-mono bg-[var(--b100)] py-[2px] px-[5px] rounded-[3px] text-[11px]">batch_code, day, start_time, end_time, course_code, type, venue, faculty</span>. System will detect conflicts automatically.</div>
        <div className="file-zone mb-[14px]" id="tt-upload-zone">
          <input type="file" accept=".xlsx,.xls,.csv" />
          <div className="file-zone-icon"><i className="lni lni-calendar"></i></div>
          <p>Drop timetable Excel file here or click to browse</p>
          <div className="fz-uploaded" id="tt-upload-status"></div>
        </div>
        <div id="tt-preview-section" className="hidden">
          <div className="sec-divider">Conflict Check Results</div>
          <div className="success-box mb-3"><i className="lni lni-checkmark"></i> <span>18 slots imported. <strong>No conflicts detected</strong>. Preview the visual grid below before saving.</span></div>
          <ScrollTable className="import-preview">
            <table>
              <thead><tr><th>Day</th><th>Time</th><th>Course Unit</th><th>Type</th><th>Venue</th><th>Faculty</th><th>Status</th></tr></thead>
              <tbody>
                <tr className="import-row-ok"><td>Monday</td><td>08:00–10:00</td><td>IT101 – Intro to Programming</td><td><span className="pill pill-blue">Theory</span></td><td>LR-01</td><td>Dr. Ssekibuule</td><td><span className="badge badge-green"><i className="lni lni-checkmark"></i> OK</span></td></tr>
                <tr className="import-row-ok"><td>Monday</td><td>10:00–12:00</td><td>IT102 – Computer Org.</td><td><span className="pill pill-blue">Theory</span></td><td>LR-02</td><td>Ms. Namutebi</td><td><span className="badge badge-green"><i className="lni lni-checkmark"></i> OK</span></td></tr>
                <tr className="import-row-ok"><td>Tuesday</td><td>14:00–16:00</td><td>IT101 – Intro to Programming</td><td><span className="pill pill-cyan">CBT Lab</span></td><td>Lab-A</td><td>Dr. Ssekibuule</td><td><span className="badge badge-green"><i className="lni lni-checkmark"></i> OK</span></td></tr>
              </tbody>
            </table>
          </ScrollTable>
        </div>
        <div className="modal-footer">
          <button className="btn btn-neu" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary hidden" id="tt-import-btn" onClick={() => { onClose(); showToast('Timetable imported. Visual grid updated.', 'success') }}><i className="lni lni-checkmark"></i> Import &amp; Update Timetable Grid</button>
        </div>
      </div>
    </div>
  )
}
