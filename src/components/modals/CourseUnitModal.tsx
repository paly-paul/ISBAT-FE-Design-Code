'use client'
import { useState } from 'react'
import { ModalProps } from './types'
import { SuccessPopup } from './SuccessPopup'

type Topic   = { name: string; studySeq: string; numClasses: string }
type Chapter = { title: string; topics: Topic[] }

function blankTopic(): Topic   { return { name: '', studySeq: '', numClasses: '' } }
function blankChapter(n: number): Chapter { return { title: `Chapter ${n}`, topics: [blankTopic()] } }

export function CourseUnitModal({ isOpen, onClose, showToast }: ModalProps) {
  const [saved, setSaved]       = useState(false)
  const [chapters, setChapters] = useState<Chapter[]>([blankChapter(1)])

  if (!isOpen) return null

  function handleClose() { setSaved(false); setChapters([blankChapter(1)]); onClose() }

  // chapter helpers
  function addChapter() { setChapters(p => [...p, blankChapter(p.length + 1)]) }
  function removeChapter(ci: number) { setChapters(p => p.filter((_, i) => i !== ci)) }
  function setChapterTitle(ci: number, v: string) {
    setChapters(p => p.map((c, i) => i === ci ? { ...c, title: v } : c))
  }

  // topic helpers
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
          <SuccessPopup title="Course Unit Saved!" subtitle="The new course unit has been added successfully." onClose={handleClose} />
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay open" id="cu-new-modal" onClick={handleClose}>
      <div className="modal modal-80 modal-flex" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr">
          <div className="modal-title"><i className="lni lni-book"></i> Add Course Unit</div>
          <button className="modal-close" onClick={handleClose}><i className="lni lni-close"></i></button>
        </div>

        <div className="modal-scroll">

          {/* ── Basic Info ─────────────────────────────────────── */}
          <div className="g3">
            <div className="fg">
              <div className="lbl">Unit Code <span className="req">*</span></div>
              <input className="ctrl font-mono uppercase" placeholder="e.g. IT201" />
            </div>
            <div className="fg span2">
              <div className="lbl">Unit Name <span className="req">*</span></div>
              <input className="ctrl" placeholder="e.g. Data Structures and Algorithms" />
            </div>
            <div className="fg">
              <div className="lbl">Credits <span className="req">*</span></div>
              <input className="ctrl" type="number" placeholder="e.g. 3" min={1} />
            </div>
            <div className="fg">
              <div className="lbl">Unit Type <span className="req">*</span></div>
              <select className="ctrl">
                <option value="theory">Theory — IA (CW+CBT) + UE</option>
                <option value="practical">Practical — CW only (no CBT) + Practical UE</option>
                <option value="combined">Combined — Theory IA + Practical UE (no Practical IA)</option>
                <option value="project">Project — Evaluated after set timeframe</option>
              </select>
            </div>
            <div className="fg">
              <div className="lbl">Unit Category <span className="req">*</span></div>
              <select className="ctrl">
                <option value="core">Core — Mandatory for all students</option>
                <option value="specialization">Specialization — Mandatory for enrolled specialization only</option>
                <option value="elective">Elective — Batch selects one paper from a set</option>
              </select>
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

                  {/* Chapter header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'var(--b50)', borderBottom: '1px solid var(--b100)' }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--b600)', whiteSpace: 'nowrap' }}>
                      Ch. {ci + 1}
                    </span>
                    <input
                      className="ctrl"
                      style={{ flex: 1, fontWeight: 600 }}
                      value={ch.title}
                      onChange={e => setChapterTitle(ci, e.target.value)}
                      placeholder={`Chapter ${ci + 1} title`}
                    />
                    {chapters.length > 1 && (
                      <button className="btn btn-danger btn-sm" style={{ flexShrink: 0, width: 32, height: 32, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => removeChapter(ci)}>
                        <i className="lni lni-trash-can"></i>
                      </button>
                    )}
                  </div>

                  {/* Topic column headers */}
                  <div style={{ display: 'grid', gridTemplateColumns: '20px 1fr 150px 130px 30px', gap: 6, padding: '6px 12px 2px', fontSize: 10.5, fontWeight: 700, color: 'var(--g400)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <span></span>
                    <span>Topic</span>
                    <span>Study Sequence</span>
                    <span>No. of Classes</span>
                    <span></span>
                  </div>

                  {/* Topics */}
                  <div className="flex flex-col gap-1" style={{ padding: '4px 12px 10px' }}>
                    {ch.topics.map((t, ti) => (
                      <div key={ti} style={{ display: 'grid', gridTemplateColumns: '20px 1fr 150px 130px 30px', gap: 6, alignItems: 'center' }}>
                        <span style={{ fontSize: 11, color: 'var(--g400)', textAlign: 'center' }}>{ti + 1}.</span>
                        <input className="ctrl" value={t.name} onChange={e => setTopic(ci, ti, 'name', e.target.value)} placeholder="e.g. Introduction to Arrays" />
                        <input className="ctrl" value={t.studySeq} onChange={e => setTopic(ci, ti, 'studySeq', e.target.value)} placeholder="e.g. Week 1–2" />
                        <input className="ctrl" value={t.numClasses} onChange={e => setTopic(ci, ti, 'numClasses', e.target.value)} placeholder="e.g. 4" />
                        <button
                          className="btn btn-danger btn-sm"
                          style={{ width: 32, height: 32, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                          onClick={() => removeTopic(ci, ti)}
                          disabled={ch.topics.length === 1}
                        >
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
          <button className="btn btn-primary" onClick={() => setSaved(true)}>
            <i className="lni lni-checkmark"></i> Save Course Unit
          </button>
        </div>
      </div>
    </div>
  )
}
