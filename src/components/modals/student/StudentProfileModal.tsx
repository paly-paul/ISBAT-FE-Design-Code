'use client'
import { ModalProps } from '../types'
import { useStudent } from '@/hooks/student/useStudents'

function fmtDate(iso: string | null): string {
  if (!iso) return '—'
  return iso.slice(0, 10)
}

interface Props extends ModalProps {
  studentGuid: string | null
}

export function StudentProfileModal({ isOpen, onClose, studentGuid }: Props) {
  const { data: student, isLoading, isError } = useStudent(studentGuid, isOpen)

  if (!isOpen || !studentGuid) return null

  return (
    <div className="modal-overlay open">
      <div className="modal modal-80 modal-flex" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr modal-hdr-blue">
          <div className="modal-title flex items-center gap-2">
            <i className="lni lni-user"></i> Student Profile{student ? <>: <span className="text-b600">{student.studentName}</span></> : null}
          </div>
          <button className="modal-close" onClick={onClose}><i className="lni lni-close"></i></button>
        </div>

        <div className="modal-scroll">
          {isLoading && <div className="text-center text-sm text-g500 py-10">Loading student…</div>}
          {isError && <div className="text-center text-sm text-red-600 py-10">Could not load this student.</div>}

          {student && (
            <>
              <div className="card mb-6">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center rounded-full font-bold text-white shrink-0" style={{ width: 64, height: 64, background: 'var(--b500)', fontSize: 22 }}>
                    {(student.studentName.trim()[0] ?? '—').toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-lg text-g900">{student.studentName}</div>
                    <div className="text-sm text-g500">{student.programName || '—'} &middot; {student.semesterName || '—'}</div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="badge badge-blue font-mono">{student.studentNum}</span>
                    {/* studActive reads as an active/inactive flag by naming
                        convention only — not confirmed against docs. */}
                    <span className={`badge ${student.studActive === 1 ? 'badge-green' : 'badge-grey'}`}>{student.studActive === 1 ? 'Active' : 'Inactive'}</span>
                  </div>
                </div>
              </div>

              <div className="sec-divider">Student Information</div>
              <div className="g3 mb-4">
                <div className="fg"><label className="lbl">Student No.</label><input className="ctrl font-mono" readOnly value={student.studentNum} /></div>
                <div className="fg"><label className="lbl">Registration No.</label><input className="ctrl font-mono" readOnly value={student.studentRegNo} /></div>
                <div className="fg"><label className="lbl">Registration Status</label><input className="ctrl" readOnly value={student.regStatusName || '—'} /></div>
                <div className="fg"><label className="lbl">Programme</label><input className="ctrl" readOnly value={student.programName || '—'} /></div>
                <div className="fg"><label className="lbl">Semester</label><input className="ctrl" readOnly value={student.semesterName || '—'} /></div>
                <div className="fg"><label className="lbl">Batch</label><input className="ctrl" readOnly value={student.batchCode || '—'} /></div>
              </div>

              {/* Everything below is confirmed on the wire but largely
                  unglossed (no label mapping documented for iStatus/intType/
                  discount fields) — shown raw rather than guessed. */}
              <div className="sec-divider">Registration &amp; Academic Status</div>
              <div className="g3">
                <div className="fg"><label className="lbl">Registration Date</label><input className="ctrl" readOnly value={fmtDate(student.regDate)} /></div>
                <div className="fg"><label className="lbl">Status Code (iStatus)</label><input className="ctrl" readOnly value={String(student.iStatus)} /></div>
                <div className="fg"><label className="lbl">Type Code (intType)</label><input className="ctrl" readOnly value={student.intType != null ? String(student.intType) : '—'} /></div>
                <div className="fg"><label className="lbl">Semester Count (intSem)</label><input className="ctrl" readOnly value={student.intSem != null ? String(student.intSem) : '—'} /></div>
                <div className="fg"><label className="lbl">Aptech Credit Exemption</label><input className="ctrl" readOnly value={student.aptechCe == null ? '—' : student.aptechCe ? 'Yes' : 'No'} /></div>
                <div className="fg"><label className="lbl">Discount Status</label><input className="ctrl" readOnly value={student.discountStatus || '—'} /></div>
                <div className="fg"><label className="lbl">Discount Calc. Type</label><input className="ctrl" readOnly value={student.calcType || '—'} /></div>
                <div className="fg"><label className="lbl">Discount Amount / %</label><input className="ctrl" readOnly value={student.amtPer != null ? String(student.amtPer) : '—'} /></div>
              </div>
            </>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-neu" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}
