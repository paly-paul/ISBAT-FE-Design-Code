'use client'
import { useState } from 'react'
import { ModalProps } from './types'
import { SuccessPopup } from './SuccessPopup'
import { SearchSelect } from '@/components/SearchSelect'

type Topic   = { name: string; studySeq: string; numClasses: string }
type Chapter = { title: string; topics: Topic[] }

function blankTopic(): Topic { return { name: '', studySeq: '', numClasses: '' } }
function blankChapter(n: number): Chapter { return { title: `Chapter ${n}`, topics: [blankTopic()] } }

const PREFILLED_CHAPTERS: Chapter[] = [
  {
    title: 'Chapter 1: Introduction to Programming',
    topics: [
      { name: 'What is a Program?',           studySeq: '1', numClasses: '2' },
      { name: 'Variables and Data Types',      studySeq: '2', numClasses: '3' },
    ],
  },
  {
    title: 'Chapter 2: Control Structures',
    topics: [
      { name: 'Conditional Statements (if/else)', studySeq: '3', numClasses: '3' },
      { name: 'Loops (for, while, do-while)',      studySeq: '4', numClasses: '4' },
    ],
  },
]

export function EditCourseUnitModal({ isOpen, onClose, showToast }: ModalProps) {
  const [saved, setSaved]               = useState(false)
  const [chapters, setChapters]         = useState<Chapter[]>(PREFILLED_CHAPTERS)
  const [unitCode, setUnitCode]         = useState('IT101')
  const [unitName, setUnitName]         = useState('Introduction to Programming')
  const [numChapters, setNumChapters]   = useState('2')
  const [credits, setCredits]           = useState('3')
  const [unitType, setUnitType]         = useState('theory')
  const [unitCategory, setUnitCategory] = useState('core')
  const [errors, setErrors]               = useState<Record<string, string>>({})
  const [chapterErrors, setChapterErrors] = useState<string[]>([])

  function validate() {
    const e: Record<string, string> = {}
    if (!unitCode.trim())  e.unitCode     = 'Unit Code is required'
    if (!unitName.trim())  e.unitName     = 'Unit Name is required'
    if (!credits)          e.credits      = 'Credits is required'
    if (!unitType)         e.unitType     = 'Please select a Unit Type'
    if (!unitCategory)     e.unitCategory = 'Please select a Unit Category'
    setErrors(e)
    const chapErrs = chapters.map(ch => ch.title.trim() ? '' : 'Chapter title is required')
    setChapterErrors(chapErrs)
    return Object.keys(e).length === 0 && chapErrs.every(err => !err)
  }

  if (!isOpen) return null

  function handleClose() { setSaved(false); setChapters(PREFILLED_CHAPTERS); setErrors({}); setChapterErrors([]); onClose() }

  function addChapter() {
    setChapters(p => [...p, blankChapter(p.length + 1)])
    setChapterErrors(p => [...p, ''])
  }
  function removeChapter(ci: number) {
    setChapters(p => p.filter((_, i) => i !== ci))
    setChapterErrors(p => p.filter((_, i) => i !== ci))
  }
  function setChapterTitle(ci: number, v: string) {
    setChapters(p => p.map((c, i) => i === ci ? { ...c, title: v } : c))
    if (chapterErrors[ci]) setChapterErrors(p => p.map((e, i) => i === ci ? '' : e))
  }
  function addTopic(ci: number) {
    setChapters(p => p.map((c, i) => i === ci ? { ...c, topics: [...c.topics, blankTopic()] } : c))
  }
  function removeTopic(ci: number, ti: number) {
    setChapters(p => p.map((c, i) => i === ci ? { ...c, topics: c.topics.filter((_, j) => j !== ti) } : c))
  }
  function setTopic(ci: number, ti: number, field: keyof Topic, v: string) {
    setChapters(p => p.map((c, i) => i === ci
      ? { ...c, topics: c.topics.map((t, j) => j === ti ? { ...t, [field]: v } : t) }
      : c
    ))
  }

  if (saved) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <SuccessPopup title="Course Unit Updated!" subtitle="Your changes have been saved successfully." onClose={handleClose} />
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay open" id="cu-edit-modal">
      <div className="modal modal-80 modal-flex" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr">
          <div className="modal-title"><i className="lni lni-pencil"></i> Edit Course Unit</div>
          <button className="modal-close" onClick={handleClose}><i className="lni lni-close"></i></button>
        </div>

        <div className="modal-scroll">

          {/* ── Basic Info ─────────────────────────────────────── */}
          <div className="g3">
            <div className="fg">
              <div className="lbl">Unit Code <span className="req">*</span></div>
              <input
                className="ctrl font-mono uppercase"
                style={errors.unitCode ? { borderColor: 'var(--red)' } : undefined}
                value={unitCode}
                onChange={e => { setUnitCode(e.target.value); if (errors.unitCode) setErrors(p => ({ ...p, unitCode: '' })) }}
              />
              {errors.unitCode && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.unitCode}</p>}
            </div>
            <div className="fg">
              <div className="lbl">Unit Name <span className="req">*</span></div>
              <input
                className="ctrl"
                style={errors.unitName ? { borderColor: 'var(--red)' } : undefined}
                value={unitName}
                onChange={e => { setUnitName(e.target.value); if (errors.unitName) setErrors(p => ({ ...p, unitName: '' })) }}
              />
              {errors.unitName && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.unitName}</p>}
            </div>
            <div className="fg">
              <div className="lbl">No. of Chapters</div>
              <input
                className="ctrl"
                style={errors.numChapters ? { borderColor: 'var(--red)' } : undefined}
                type="number"
                min={1}
                value={numChapters}
                onChange={e => { setNumChapters(e.target.value); if (errors.numChapters) setErrors(p => ({ ...p, numChapters: '' })) }}
              />
              {errors.numChapters && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.numChapters}</p>}
            </div>
            <div className="fg">
              <div className="lbl">Credits <span className="req">*</span></div>
              <input
                className="ctrl"
                style={errors.credits ? { borderColor: 'var(--red)' } : undefined}
                type="number"
                min={1}
                value={credits}
                onChange={e => { setCredits(e.target.value); if (errors.credits) setErrors(p => ({ ...p, credits: '' })) }}
              />
              {errors.credits && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.credits}</p>}
            </div>
            <div className="fg">
              <div className="lbl">Unit Type <span className="req">*</span></div>
              <SearchSelect
                value={unitType}
                onChange={v => { setUnitType(v); if (errors.unitType) setErrors(p => ({ ...p, unitType: '' })) }}
                options={[
                  { value: 'theory', label: 'Theory — IA (CW+CBT) + UE' },
                  { value: 'practical', label: 'Practical — CW only (no CBT) + Practical UE' },
                  { value: 'combined', label: 'Combined — Theory IA + Practical UE (no Practical IA)' },
                  { value: 'project', label: 'Project — Evaluated after set timeframe' },
                ]}
              />
              {errors.unitType && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.unitType}</p>}
            </div>
            <div className="fg">
              <div className="lbl">Unit Category <span className="req">*</span></div>
              <SearchSelect
                value={unitCategory}
                onChange={v => { setUnitCategory(v); if (errors.unitCategory) setErrors(p => ({ ...p, unitCategory: '' })) }}
                options={[
                  { value: 'core', label: 'Core — Mandatory for all students' },
                  { value: 'specialization', label: 'Specialization — Mandatory for enrolled specialization only' },
                  { value: 'elective', label: 'Elective — Batch selects one paper from a set' },
                ]}
              />
              {errors.unitCategory && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.unitCategory}</p>}
            </div>
            <div className="fg span2">
              <div className="lbl">Repetition Tag</div>
              <SearchSelect
                placeholder="— Select repetition tag —"
                value="RT-CU-001"
                options={[
                  { value: 'RT-CU-001', label: 'RT-CU-001 — Standard repeat for failed units' },
                  { value: 'RT-CU-002', label: 'RT-CU-002 — Supplementary repeat (one semester delay)' },
                  { value: 'RT-CU-003', label: 'RT-CU-003 — Cross-programme shared unit' },
                  { value: 'RT-CU-004', label: 'RT-CU-004 — Elective repeat (student choice)' },
                ]}
              />
            </div>
            <div className="fg span3">
              <div className="lbl">Include In</div>
              <div style={{ display: 'flex', gap: 28, marginTop: 8 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', color: 'var(--g700)' }}>
                  <input type="checkbox" defaultChecked style={{ width: 15, height: 15, accentColor: 'var(--b500)', cursor: 'pointer' }} />
                  Class Test
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', color: 'var(--g700)' }}>
                  <input type="checkbox" defaultChecked style={{ width: 15, height: 15, accentColor: 'var(--b500)', cursor: 'pointer' }} />
                  Course Work
                </label>
              </div>
            </div>
          </div>

          {/* ── Assessment hint ───────────────────────────────── */}
          <div className="my-[14px] px-4 py-3 bg-b50 border-[1.5px] border-[var(--b100)] rounded-[var(--rsm)]">
            <div className="font-bold text-b700 uppercase mb-2" style={{ fontSize: 'var(--fs-xs)' }}>Assessment Components for this Unit Type</div>
            <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--g700)' }}>
              Has <strong>Coursework (CW)</strong>: out of 25 → prorated to 15 &nbsp;|&nbsp; Has <strong>Class Test (CBT)</strong>: out of 50 → prorated to 15 &nbsp;|&nbsp; <strong>University Exam (UE)</strong>: out of 100 → prorated to 70
            </div>
          </div>

          {/* ── Assessment Weightage ──────────────────────────── */}
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
                <div className="font-bold text-b700 text-center mb-2" style={{ fontSize: 'var(--fs-xs)' }}>COURSEWORK (CW)</div>
                <div className="flex items-center gap-2 justify-center">
                  <input className="ctrl wt-input" type="number" defaultValue={25} min={0} />
                  <span className="font-extrabold text-b800" style={{ fontSize: 'var(--fs-2xl)' }}>→</span>
                  <input className="ctrl wt-input" type="number" defaultValue={15} min={0} />
                </div>
                <div className="text-g500 text-center mt-[6px]" style={{ fontSize: 'var(--fs-2xs)' }}>Assessed / Final weight</div>
              </div>
              <div className="p-3 bg-[var(--amber-bg)] border border-[var(--amber-bd)] rounded-[var(--rsm)]">
                <div className="font-bold text-clr-amber text-center mb-2" style={{ fontSize: 'var(--fs-xs)' }}>CLASS TEST (CBT)</div>
                <div className="flex items-center gap-2 justify-center">
                  <input className="ctrl wt-input" type="number" defaultValue={50} min={0} />
                  <span className="font-extrabold text-clr-amber" style={{ fontSize: 'var(--fs-2xl)' }}>→</span>
                  <input className="ctrl wt-input" type="number" defaultValue={15} min={0} />
                </div>
                <div className="text-g500 text-center mt-[6px]" style={{ fontSize: 'var(--fs-2xs)' }}>Assessed / Final weight</div>
              </div>
              <div className="p-3 bg-[var(--green-bg)] border border-[var(--green-bd)] rounded-[var(--rsm)]">
                <div className="font-bold text-clr-green text-center mb-2" style={{ fontSize: 'var(--fs-xs)' }}>UNIVERSITY EXAM</div>
                <div className="flex items-center gap-2 justify-center">
                  <input className="ctrl wt-input" type="number" defaultValue={100} min={0} />
                  <span className="font-extrabold text-clr-green" style={{ fontSize: 'var(--fs-2xl)' }}>→</span>
                  <input className="ctrl wt-input" type="number" defaultValue={70} min={0} />
                </div>
                <div className="text-g500 text-center mt-[6px]" style={{ fontSize: 'var(--fs-2xs)' }}>Assessed / Final weight</div>
              </div>
            </div>
            <div className="mt-[10px] text-g500 text-right" style={{ fontSize: 'var(--fs-sm)' }}>
              Final weight total: <strong className="text-clr-green">100</strong> / 100
            </div>
          </div>

          {/* ── Course Outline ────────────────────────────────── */}
          <div className="mdl-section mdl-section--blue">
            <div className="mdl-section-hdr">
              <span className="mdl-section-icon"><i className="lni lni-list"></i></span>
              <div className="flex-1 min-w-0">
                <div className="mdl-section-title">Course Outline — Chapters &amp; Topics</div>
                <div className="mdl-section-sub">Add chapters and nest topics with study sequence and class count.</div>
              </div>
              <button className="btn btn-neu btn-sm" type="button" onClick={addChapter}>
                <i className="lni lni-plus"></i> Add Chapter
              </button>
            </div>

            <div className="flex flex-col gap-4 mt-2">
              {chapters.map((ch, ci) => (
                <div key={ci} style={{ border: '1.5px solid var(--b100)', borderRadius: 'var(--rsm)', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 12px', background: 'var(--b50)', borderBottom: '1px solid var(--b100)' }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--b600)', whiteSpace: 'nowrap', paddingTop: 6 }}>Ch. {ci + 1}</span>
                    <div style={{ flex: 1 }}>
                      <input
                        className="ctrl"
                        style={{ width: '100%', fontWeight: 600, ...(chapterErrors[ci] ? { borderColor: 'var(--red)' } : {}) }}
                        value={ch.title}
                        onChange={e => setChapterTitle(ci, e.target.value)}
                      />
                      {chapterErrors[ci] && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{chapterErrors[ci]}</p>}
                    </div>
                    {chapters.length > 1 && (
                      <button className="btn btn-danger btn-sm" style={{ flexShrink: 0, width: 32, height: 32, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => removeChapter(ci)}>
                        <i className="lni lni-trash-can"></i>
                      </button>
                    )}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '20px 1fr 150px 130px 30px', gap: 6, padding: '6px 12px 2px', fontSize: 10.5, fontWeight: 700, color: 'var(--g400)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <span></span><span>Topic</span><span>Study Sequence</span><span>No. of Classes</span><span></span>
                  </div>
                  <div className="flex flex-col gap-1" style={{ padding: '4px 12px 10px' }}>
                    {ch.topics.map((t, ti) => (
                      <div key={ti} style={{ display: 'grid', gridTemplateColumns: '20px 1fr 150px 130px 30px', gap: 6, alignItems: 'center' }}>
                        <span style={{ fontSize: 11, color: 'var(--g400)', textAlign: 'center' }}>{ti + 1}.</span>
                        <input className="ctrl" value={t.name}      onChange={e => setTopic(ci, ti, 'name',      e.target.value)} placeholder="Topic name" />
                        <input className="ctrl" type="number" min={1} value={t.studySeq} onChange={e => setTopic(ci, ti, 'studySeq', e.target.value)} placeholder="e.g. 3" />
                        <input className="ctrl" value={t.numClasses} onChange={e => setTopic(ci, ti, 'numClasses', e.target.value)} placeholder="e.g. 4" />
                        <button className="btn btn-danger btn-sm" style={{ width: 32, height: 32, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }} onClick={() => removeTopic(ci, ti)} disabled={ch.topics.length === 1}>
                          <i className="lni lni-trash-can"></i>
                        </button>
                      </div>
                    ))}
                    <button className="btn btn-neu btn-sm mt-1" style={{ alignSelf: 'flex-start', fontSize: 11 }} onClick={() => addTopic(ci)}>
                      <i className="lni lni-plus"></i> Add Topic
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Approved Syllabus ─────────────────────────────── */}
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
              <p>Upload approved syllabus document (PDF / Word)</p>
              <p className="text-g400" style={{ fontSize: 'var(--fs-xs)' }}>Must conform to NCHE or UVTOP accreditation</p>
            </div>
          </div>

        </div>

        <div className="modal-footer">
          <button className="btn btn-neu" onClick={handleClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => { if (validate()) setSaved(true) }}>
            <i className="lni lni-checkmark"></i> Update Course Unit
          </button>
        </div>
      </div>
    </div>
  )
}
