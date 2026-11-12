'use client'
import type { VettingQualification } from '@/lib/api/admission/vetting'
import { orDash } from '@/lib/admission/applicantDisplay'

// One qualification from GET /vetting/applications/{guid}, every field under
// its own label (the same labels Application Filling uses), so the
// institution and the university / awarding board can't be mistaken for each
// other. Shared by the Vetting Desk review and the Applicant Profile page.
export function QualificationCard({ q, index, onViewProof }: {
  q: VettingQualification
  index: number
  onViewProof: (url: string, title: string) => void
}) {
  const title = `Qualification ${index + 1}`
  return (
    <div className={`vd-qual${q.proofUrl ? '' : ' missing'}`}>
      <div className="vd-qual-hdr">
        <span className="vd-doc-icon"><i className={`lni ${q.proofUrl ? 'lni-book' : 'lni-question-circle'}`} aria-hidden="true" /></span>
        <div className="vd-doc-body">
          <div className="vd-doc-name">{title}</div>
          <div className="vd-doc-sub">{q.proofUrl ? 'Proof uploaded' : 'No proof uploaded'}</div>
        </div>
        {q.proofUrl && (
          <button type="button" className="btn btn-neu btn-sm" onClick={() => onViewProof(q.proofUrl!, `Proof — ${title}`)} aria-label={`View proof for ${title}`}>
            <i className="lni lni-eye" aria-hidden="true" /> View Proof
          </button>
        )}
      </div>
      <div className="vd-fields">
        <div><div className="vd-field-lbl">Institution</div><div className="vd-field-val">{orDash(q.institution)}</div></div>
        <div><div className="vd-field-lbl">University / Awarding Board</div><div className="vd-field-val">{orDash(q.university)}</div></div>
        <div><div className="vd-field-lbl">Year</div><div className="vd-field-val tabular-nums">{q.passYear ?? '—'}</div></div>
        <div><div className="vd-field-lbl">Grade</div><div className="vd-field-val">{orDash(q.grade)}</div></div>
        <div><div className="vd-field-lbl">Duration (Years)</div><div className="vd-field-val tabular-nums">{q.yearsTaken ?? '—'}</div></div>
      </div>
    </div>
  )
}
