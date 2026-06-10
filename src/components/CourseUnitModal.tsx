'use client'
import { ModalProps } from './types'

export function CourseUnitModal({ isOpen, onClose, showToast }: ModalProps) {
  if (!isOpen) return null
  return (
    <div className="modal-overlay open" id="cu-new-modal" onClick={onClose}>
      <div className="modal modal-80" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr">
          <div className="modal-title"><i className="lni lni-book"></i> Add / Edit Course Unit</div>
          <button className="modal-close" onClick={onClose}><i className="lni lni-close"></i></button>
        </div>
        <div className="g3">
          <div className="fg"><div className="lbl">Unit Code <span className="req">*</span></div><input className="ctrl" id="cu-code" placeholder="e.g. IT201" /></div>
          <div className="fg span2"><div className="lbl">Unit Name <span className="req">*</span></div><input className="ctrl" id="cu-name" placeholder="e.g. Data Structures and Algorithms" /></div>
          <div className="fg"><div className="lbl">Credits <span className="req">*</span></div><input className="ctrl" id="cu-credits" type="number" placeholder="e.g. 3" min="1" /></div>
          <div className="fg"><div className="lbl">No. of Chapters</div><input className="ctrl" type="number" placeholder="e.g. 8" id="cu-num-chapters" min="1" /></div>
          <div className="fg">
            <div className="lbl">Unit Type <span className="req">*</span></div>
            <select className="ctrl" id="cu-unit-type">
              <option value="theory">Theory — IA (CW+CBT) + UE</option>
              <option value="practical">Practical — CW only (no CBT) + Practical UE</option>
              <option value="combined">Combined — Theory IA (CW+CBT) + Practical UE (no Practical IA)</option>
              <option value="project">Project — Evaluated after set timeframe</option>
            </select>
          </div>
          <div className="fg">
            <div className="lbl">Unit Category <span className="req">*</span></div>
            <select className="ctrl" id="cu-category">
              <option value="core">Core — Mandatory for all students</option>
              <option value="specialization">Specialization — Mandatory for enrolled specialization only</option>
              <option value="elective">Elective — Batch selects one paper from a set</option>
            </select>
          </div>
        </div>
        <div id="cu-assessment-hint" className="my-[14px] px-4 py-3 bg-b50 border-[1.5px] border-[var(--b100)] rounded-[var(--rsm)]">
          <div className="text-[11px] font-bold text-b700 uppercase mb-2">Assessment Components for this Unit Type</div>
          <div id="cu-hint-content" className="text-[12.5px] text-[var(--g700)]">
            Has <strong>Coursework (CW)</strong>: out of 25 → prorated to 15 &nbsp;|&nbsp; Has <strong>Class Test (CBT)</strong>: out of 50 → prorated to 15 &nbsp;|&nbsp; <strong>University Exam (UE)</strong>: out of 100 → prorated to 70
          </div>
        </div>
        <div className="mdl-section mdl-section--amber">
          <div className="mdl-section-hdr">
            <span className="mdl-section-icon"><i className="lni lni-bar-chart"></i></span>
            <div>
              <div className="mdl-section-title">Assessment Weightage</div>
              <div className="mdl-section-sub">Set assessed vs. final-weight marks for each component</div>
            </div>
          </div>
          <div className="g3">
            <div className="p-3 bg-b50 border border-[var(--b100)] rounded-[var(--rsm)]">
              <div className="text-[11px] font-bold text-b700 text-center mb-2">COURSEWORK (CW)</div>
              <div className="flex items-center gap-2 justify-center">
                <input className="ctrl wt-input" type="number" id="wt-cw-raw" defaultValue={25} min={0} />
                <span className="text-[18px] font-extrabold text-b800">→</span>
                <input className="ctrl wt-input" type="number" id="wt-cw-final" defaultValue={15} min={0} />
              </div>
              <div className="text-[10.5px] text-g500 text-center mt-[6px]">Assessed / Final weight</div>
            </div>
            <div className="p-3 bg-[var(--amber-bg)] border border-[var(--amber-bd)] rounded-[var(--rsm)]">
              <div className="text-[11px] font-bold text-clr-amber text-center mb-2">CLASS TEST (CBT)</div>
              <div className="flex items-center gap-2 justify-center">
                <input className="ctrl wt-input" type="number" id="wt-cbt-raw" defaultValue={50} min={0} />
                <span className="text-[18px] font-extrabold text-clr-amber">→</span>
                <input className="ctrl wt-input" type="number" id="wt-cbt-final" defaultValue={15} min={0} />
              </div>
              <div className="text-[10.5px] text-g500 text-center mt-[6px]">Assessed / Final weight</div>
            </div>
            <div className="p-3 bg-[var(--green-bg)] border border-[var(--green-bd)] rounded-[var(--rsm)]">
              <div className="text-[11px] font-bold text-clr-green text-center mb-2">UNIVERSITY EXAM</div>
              <div className="flex items-center gap-2 justify-center">
                <input className="ctrl wt-input" type="number" id="wt-ue-raw" defaultValue={100} min={0} />
                <span className="text-[18px] font-extrabold text-clr-green">→</span>
                <input className="ctrl wt-input" type="number" id="wt-ue-final" defaultValue={70} min={0} />
              </div>
              <div className="text-[10.5px] text-g500 text-center mt-[6px]">Assessed / Final weight</div>
            </div>
          </div>
          <div id="wt-sum-line" className="mt-[10px] text-xs text-g500 text-right">Final weight total: <strong id="wt-sum-val" className="text-clr-green">100</strong> / 100</div>
        </div>
        <div className="mdl-section mdl-section--blue">
          <div className="mdl-section-hdr">
            <span className="mdl-section-icon"><i className="lni lni-list"></i></span>
            <div className="flex-1 min-w-0">
              <div className="mdl-section-title">Course Outline — Chapters &amp; Topics</div>
              <div className="mdl-section-sub">Build the syllabus structure for this unit. Auto-numbered — click to rename inline.</div>
            </div>
            <span id="co-current-unit" className="badge badge-blue normal-case tracking-normal">—</span>
            <button className="btn btn-neu btn-sm" type="button"><i className="lni lni-plus"></i> Add Chapter</button>
          </div>
          <div id="course-outline-body" className="mt-1"></div>
        </div>
        <div className="mdl-section mdl-section--green">
          <div className="mdl-section-hdr">
            <span className="mdl-section-icon"><i className="lni lni-files"></i></span>
            <div>
              <div className="mdl-section-title">Approved Syllabus</div>
              <div className="mdl-section-sub">Attach the NCHE / UVTOP-approved syllabus document for this unit</div>
            </div>
          </div>
          <div className="file-zone">
            <input type="file" accept=".pdf,.doc,.docx" />
            <div className="file-zone-icon"><i className="lni lni-files"></i></div>
            <p>Upload approved syllabus document (PDF/Word)</p>
            <p className="text-[11px] text-g400">Must conform to NCHE or UVTOP accreditation</p>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-neu" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary"><i className="lni lni-checkmark"></i> Save Course Unit</button>
        </div>
      </div>
    </div>
  )
}
