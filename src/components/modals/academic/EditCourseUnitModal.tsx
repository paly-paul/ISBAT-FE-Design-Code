'use client'
import { useEffect, useState } from 'react'
import { ModalProps } from '../types'
import { SuccessPopup } from './SuccessPopup'
import { FailurePopup } from './FailurePopup'
import { SearchSelect } from '@/components/SearchSelect'
import { CourseUnitInput } from '@/lib/api/academic/courseUnit'
import { useCourseUnit } from '@/hooks/academic/useCourseUnits'
import { useRepetitionTags } from '@/hooks/academic/useRepetitionTags'
import { useEmployees } from '@/hooks/employee/useEmployees'
import { AuthError } from '@/lib/api/client'

type Topic   = { name: string; taughtBy: string }
type Chapter = { title: string; topics: Topic[] }

// Study Sequence is not user-editable — it's always the topic's 1-based
// position within its chapter (see the read-only "Study Sequence" column
// in Step 2), so the payload derives it from array index rather than
// carrying it as separate per-topic state.
function blankTopic(): Topic   { return { name: '', taughtBy: '' } }
function blankChapter(): Chapter { return { title: '', topics: [blankTopic()] } }

interface EditCourseUnitModalProps extends ModalProps {
  courseUnitGuid: string | null
  updateCourseUnit: {
    mutate: (variables: { guid: string; input: CourseUnitInput }, options?: { onSuccess?: () => void; onError?: (error: Error) => void }) => void
    isPending: boolean
  }
}

export function EditCourseUnitModal({ isOpen, onClose, showToast, courseUnitGuid, updateCourseUnit }: EditCourseUnitModalProps) {
  const { data: courseUnit, isLoading, isError, error } = useCourseUnit(courseUnitGuid, isOpen)

  const [saved, setSaved]               = useState(false)
  const [failure, setFailure]           = useState<string | null>(null)
  const [step, setStep]                 = useState(1)
  const [chapters, setChapters]         = useState<Chapter[]>([blankChapter()])
  const [activeChapterIdx, setActiveChapterIdx] = useState(0)
  const [unitCode, setUnitCode]         = useState('')
  const [unitName, setUnitName]         = useState('')
  const [numChapters, setNumChapters]   = useState('')
  const [credits, setCredits]           = useState('')
  // Unit type and category are not part of the current update payload, so the picker stays off for now.
  // const [unitType, setUnitType]         = useState('')
  // const [unitCategory, setUnitCategory] = useState('')
  const [repetitionTagGuid, setRepetitionTagGuid] = useState('')
  const [syllabusFile, setSyllabusFile] = useState<File | null>(null)
  const [errors, setErrors]               = useState<Record<string, string>>({})
  const [chapterErrors, setChapterErrors] = useState<string[]>([])
  const [includeCW, setIncludeCW]       = useState(true)
  const [includeCBT, setIncludeCBT]     = useState(true)
  const [includeMid, setIncludeMid]     = useState(true)
  const [cwAssessed, setCwAssessed]     = useState('25')
  const [cbtAssessed, setCbtAssessed]   = useState('50')
  const [ueAssessed, setUeAssessed]     = useState('100')
  const [cwFinal, setCwFinal]           = useState('15')
  const [cbtFinal, setCbtFinal]         = useState('15')
  const [ueFinal, setUeFinal]           = useState('70')

  const { data: repetitionTags = [] } = useRepetitionTags()
  const repetitionTagOptions = repetitionTags.map(t => ({ value: t.courseUnitRepetitionGuid, label: `${t.tagCode} — ${t.tagName}` }))

  const { data: employees = [] } = useEmployees()
  const employeeOptions = employees.map(e => ({ value: e.employeeGuid, label: `${e.empName} (${e.shortCode})` }))

  const finalTotal = (includeCW ? (+cwFinal || 0) : 0) + (includeCBT ? (+cbtFinal || 0) : 0) + (+ueFinal || 0)
  const totalOk    = finalTotal === 100

  function weightDesc(assessed: string, final: string) {
    const a = +assessed, f = +final
    if (!a || !f) return 'Assessed / Final weight'
    return `${a} marks → prorated ${f} marks`
  }

  // Prefill the form when the selected course unit loads and reset the defaults for each edit.
  useEffect(() => {
    if (!isOpen || !courseUnit) return
    setUnitCode(courseUnit.courseUnitCode)
    setUnitName(courseUnit.courseUnitName)
    setNumChapters(String(courseUnit.chapterCount))
    setCredits(String(courseUnit.maxCredits))
    setIncludeMid(!!courseUnit.mid)
    setIncludeCW(!!courseUnit.cw)
    setIncludeCBT(!!courseUnit.ca)
    setRepetitionTagGuid(courseUnit.courseUnitRepetitionGuid ?? '')
    setChapters(
      courseUnit.outlines.length
        ? courseUnit.outlines.map(o => ({
            title: o.chapterName,
            // Study Sequence is derived from position now (see the type/blankTopic
            // note above) — sort by the server's studySequence on load so a topic's
            // on-screen position (and the auto-numbered display) still matches what
            // the backend had recorded, rather than trusting array order as-is.
            topics: [...o.topics]
              .sort((a, b) => a.studySequence - b.studySequence)
              .map(t => ({ name: t.courseUnitTopicDetails, taughtBy: t.employeeGuid })),
          }))
        : [blankChapter()]
    )
    setSyllabusFile(null)
    setStep(1)
    setActiveChapterIdx(0)
    setErrors({})
    setChapterErrors([])
  }, [isOpen, courseUnit])

  function validateStep1() {
    const e: Record<string, string> = {}
    if (!unitCode.trim())  e.unitCode     = 'Unit Code is required'
    if (!unitName.trim())  e.unitName     = 'Unit Name is required'
    if (!credits)          e.credits      = 'Credits is required'
    // if (!unitType)         e.unitType     = 'Please select a Unit Type'
    // if (!unitCategory)     e.unitCategory = 'Please select a Unit Category'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function validateStep2() {
    const chapErrs = chapters.map(ch => ch.title.trim() ? '' : 'Chapter title is required')
    setChapterErrors(chapErrs)
    return chapErrs.every(err => !err)
  }

  if (!isOpen) return null

  function handleClose() {
    setSaved(false); setFailure(null); setStep(1); setActiveChapterIdx(0); setErrors({}); setChapterErrors([])
    onClose()
  }

  function handleSubmit() {
    if (!courseUnitGuid || !courseUnit || !validateStep2()) return
    const outlines = chapters.map((ch, ci) => ({
      chapter: ci + 1,
      chapterName: ch.title,
      topics: ch.topics.map((t, ti) => ({
        courseUnitTopicDetails: t.name,
        studySequence: ti + 1,
        taughtBy: t.taughtBy,
      })),
    }))
    updateCourseUnit.mutate(
      {
        guid: courseUnitGuid,
        input: {
          courseUnitCode: unitCode,
          courseUnitName: unitName,
          maxCredits: +credits || 0,
          chapterCount: chapters.length,
          courseUnitRepetitionGuid: repetitionTagGuid || null,
          mid: includeMid ? 1 : 0,
          cw: includeCW ? 1 : 0,
          ca: includeCBT ? 1 : 0,
          // No UI control yet, and not part of the confirmed GET response
          // to preserve from the loaded record — defaults to approved.
          approved: 1,
          cbtWeightage: +cbtFinal || 0,
          cwWeightage: +cwFinal || 0,
          ueWeightage: +ueFinal || 0,
          outlines,
          syllabus: syllabusFile,
        },
      },
      {
        onSuccess: () => { setSaved(true); showToast('Course unit updated successfully') },
        onError: (error: Error) => {
          const code = error instanceof AuthError ? error.code : undefined
          setFailure(error.message || `Failed to update course unit${code ? ` (${code})` : ''}. Please try again.`)
        },
      },
    )
  }

  // chapter cap — Step 2 can never hold more chapters than Step 1's "No. of Chapters" (when set)
  const chapterCap = +numChapters || 0
  const atChapterCap = chapterCap > 0 && chapters.length >= chapterCap

  function goToStep2() {
    if (!validateStep1()) return
    // If the user lowered No. of Chapters after already building some out, trim the excess from the end.
    if (chapterCap > 0 && chapters.length > chapterCap) {
      setChapters(p => p.slice(0, chapterCap))
      setChapterErrors(p => p.slice(0, chapterCap))
      setActiveChapterIdx(i => Math.min(i, chapterCap - 1))
    }
    setStep(2)
  }

  // chapter helpers
  function addChapter() {
    if (atChapterCap) { showToast(`No. of Chapters is set to ${chapterCap} — remove a chapter or increase that value first`, 'error'); return }
    setChapters(p => [...p, blankChapter()])
    setChapterErrors(p => [...p, ''])
    setActiveChapterIdx(chapters.length)
  }
  function removeChapter(ci: number) {
    setChapters(p => p.filter((_, i) => i !== ci))
    setChapterErrors(p => p.filter((_, i) => i !== ci))
    setActiveChapterIdx(current => {
      const newLength = chapters.length - 1
      if (ci < current) return current - 1
      if (ci === current) return Math.min(current, newLength - 1)
      return current
    })
  }
  function setChapterTitle(ci: number, v: string) {
    setChapters(p => p.map((c, i) => i === ci ? { ...c, title: v } : c))
    if (chapterErrors[ci]) setChapterErrors(p => p.map((e, i) => i === ci ? '' : e))
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
          <SuccessPopup title="Course Unit Updated!" subtitle="Your changes have been saved successfully." onClose={handleClose} />
        </div>
      </div>
    )
  }

  if (failure) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <FailurePopup title="Couldn't Update Course Unit" subtitle={failure} onClose={() => setFailure(null)} />
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <FailurePopup
            title="Couldn't Load Course Unit"
            subtitle={error instanceof AuthError ? (error.message || 'Failed to load course unit details.') : 'Failed to load course unit details.'}
            onClose={handleClose}
          />
        </div>
      </div>
    )
  }

  if (isLoading || !courseUnit) {
    return (
      <div className="modal-overlay open" id="cu-edit-modal">
        <div className="modal modal-80 modal-flex" onClick={e => e.stopPropagation()}>
          <div className="modal-hdr modal-hdr-blue">
            <div className="modal-title"><i className="lni lni-pencil"></i> Edit Course Unit</div>
            <button className="modal-close" onClick={handleClose}><i className="lni lni-close"></i></button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 180 }}>
            <span style={{ color: 'var(--g400)' }}>Loading course unit details…</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay open" id="cu-edit-modal">
      <div className="modal modal-80 modal-flex" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr modal-hdr-blue">
          <div className="modal-title"><i className="lni lni-pencil"></i> Edit Course Unit</div>
          <button className="modal-close" onClick={handleClose}><i className="lni lni-close"></i></button>
        </div>

        <div className="prog-steps">
          <div className={`prog-step${step === 1 ? ' active' : ''}`}>
            <span className="prog-step-num">1</span>
            <span>Unit Details</span>
          </div>
          <div className="prog-step-line"></div>
          <div className={`prog-step${step === 2 ? ' active' : ''}`}>
            <span className="prog-step-num">2</span>
            <span>Course Outline</span>
          </div>
        </div>

        {/* ── Step 1: Basic Info ─────────────────────────────── */}
        {step === 1 && (
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
                type="number"
                min={1}
                value={numChapters}
                onChange={e => setNumChapters(e.target.value)}
              />
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
            {/* Unit Type / Unit Category pickers — no equivalent field on the
                confirmed update payload yet (see CourseUnitInput in
                lib/api/academic/courseUnit.ts).
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
            */}
            <div className="fg span2">
              <div className="lbl">Repetition Tag</div>
              <SearchSelect
                placeholder="— Select repetition tag —"
                value={repetitionTagGuid}
                onChange={setRepetitionTagGuid}
                options={repetitionTagOptions}
              />
            </div>
            <div className="fg span3">
              <div className="lbl">Include In</div>
              <div style={{ display: 'flex', gap: 28, marginTop: 8 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', color: 'var(--g700)' }}>
                  <input type="checkbox" checked={includeCBT} onChange={e => setIncludeCBT(e.target.checked)} style={{ width: 15, height: 15, accentColor: 'var(--b500)', cursor: 'pointer' }} />
                  Class Test
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', color: 'var(--g700)' }}>
                  <input
                    type="checkbox"
                    checked={includeMid}
                    onChange={e => setIncludeMid(e.target.checked)}
                    style={{ width: 15, height: 15, accentColor: 'var(--b500)', cursor: 'pointer' }}
                  />
                  Mid
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', color: 'var(--g700)' }}>
                  <input
                    type="checkbox"
                    checked={includeCW}
                    onChange={e => {
                      const checked = e.target.checked
                      setIncludeCW(checked)
                      // Checking Course Work auto-checks Mid too (same rule as the Add modal) — Mid can still be unchecked independently afterward.
                      if (checked) setIncludeMid(true)
                    }}
                    style={{ width: 15, height: 15, accentColor: 'var(--b500)', cursor: 'pointer' }}
                  />
                  Course Work
                </label>
              </div>
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

            {/* Column headers */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 88px 24px 88px 1fr', gap: '0 10px', alignItems: 'center', padding: '0 4px 10px', borderBottom: '1.5px solid var(--amber-bd)', marginBottom: 4 }}>
              <span style={{ fontSize: 'var(--fs-xs)', fontWeight: 700, color: 'var(--g400)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Component</span>
              <span style={{ fontSize: 'var(--fs-xs)', fontWeight: 700, color: 'var(--g400)', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'center' }}>Assessed</span>
              <span />
              <span style={{ fontSize: 'var(--fs-xs)', fontWeight: 700, color: 'var(--g400)', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'center' }}>Final Wt.</span>
            </div>

            {/* Rows */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>

              {/* CW row */}
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 88px 24px 88px 1fr', gap: '0 10px',
                alignItems: 'center', padding: '13px 4px',
                borderBottom: '1px solid var(--g100)',
                transition: 'opacity .2s',
                ...(!includeCW ? { opacity: 0.38, filter: 'grayscale(0.5)', pointerEvents: 'none' } : {}),
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 3, height: 38, background: 'var(--b400)', borderRadius: 2, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 'var(--fs-base)', fontWeight: 700, color: 'var(--b800)' }}>Coursework</div>
                    <div style={{ fontSize: 'var(--fs-xs)', fontWeight: 600, color: 'var(--g400)', letterSpacing: '0.03em' }}>CW · Internal Assessment</div>
                  </div>
                  {!includeCW && <span style={{ fontSize: 'var(--fs-xs)', fontWeight: 700, padding: '1px 6px', borderRadius: 4, background: 'var(--g200)', color: 'var(--g500)', textTransform: 'uppercase', marginLeft: 4 }}>Off</span>}
                </div>
                <input className="ctrl wt-input" type="number" value={cwAssessed} min={0} onChange={e => setCwAssessed(e.target.value)} style={{ textAlign: 'center' }} />
                <span style={{ textAlign: 'center', fontWeight: 800, color: 'var(--b500)', fontSize: 18, lineHeight: 1 }}>→</span>
                <input className="ctrl wt-input" type="number" value={cwFinal} min={0} onChange={e => setCwFinal(e.target.value)} style={{ textAlign: 'center' }} />
                <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--g500)', paddingLeft: 4, lineHeight: 1.5 }}>{weightDesc(cwAssessed, cwFinal)}</span>
              </div>

              {/* CBT row */}
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 88px 24px 88px 1fr', gap: '0 10px',
                alignItems: 'center', padding: '13px 4px',
                borderBottom: '1px solid var(--g100)',
                transition: 'opacity .2s',
                ...(!includeCBT ? { opacity: 0.38, filter: 'grayscale(0.5)', pointerEvents: 'none' } : {}),
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 3, height: 38, background: 'var(--amber)', borderRadius: 2, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 'var(--fs-base)', fontWeight: 700, color: 'var(--g800)' }}>Class Test</div>
                    <div style={{ fontSize: 'var(--fs-xs)', fontWeight: 600, color: 'var(--g400)', letterSpacing: '0.03em' }}>CBT · Internal Assessment</div>
                  </div>
                  {!includeCBT && <span style={{ fontSize: 'var(--fs-xs)', fontWeight: 700, padding: '1px 6px', borderRadius: 4, background: 'var(--g200)', color: 'var(--g500)', textTransform: 'uppercase', marginLeft: 4 }}>Off</span>}
                </div>
                <input className="ctrl wt-input" type="number" value={cbtAssessed} min={0} onChange={e => setCbtAssessed(e.target.value)} style={{ textAlign: 'center' }} />
                <span style={{ textAlign: 'center', fontWeight: 800, color: 'var(--amber)', fontSize: 18, lineHeight: 1 }}>→</span>
                <input className="ctrl wt-input" type="number" value={cbtFinal} min={0} onChange={e => setCbtFinal(e.target.value)} style={{ textAlign: 'center' }} />
                <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--g500)', paddingLeft: 4, lineHeight: 1.5 }}>{weightDesc(cbtAssessed, cbtFinal)}</span>
              </div>

              {/* UE row */}
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 88px 24px 88px 1fr', gap: '0 10px',
                alignItems: 'center', padding: '13px 4px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 3, height: 38, background: 'var(--green)', borderRadius: 2, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 'var(--fs-base)', fontWeight: 700, color: 'var(--g800)' }}>University Exam</div>
                    <div style={{ fontSize: 'var(--fs-xs)', fontWeight: 600, color: 'var(--g400)', letterSpacing: '0.03em' }}>UE · Final Examination</div>
                  </div>
                </div>
                <input className="ctrl wt-input" type="number" value={ueAssessed} min={0} onChange={e => setUeAssessed(e.target.value)} style={{ textAlign: 'center' }} />
                <span style={{ textAlign: 'center', fontWeight: 800, color: 'var(--green)', fontSize: 18, lineHeight: 1 }}>→</span>
                <input className="ctrl wt-input" type="number" value={ueFinal} min={0} onChange={e => setUeFinal(e.target.value)} style={{ textAlign: 'center' }} />
                <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--g500)', paddingLeft: 4, lineHeight: 1.5 }}>{weightDesc(ueAssessed, ueFinal)}</span>
              </div>
            </div>

            {/* Breakdown bar + total */}
            <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1.5px solid var(--amber-bd)' }}>
              <div style={{ display: 'flex', height: 7, borderRadius: 6, overflow: 'hidden', background: 'var(--g100)', gap: 2 }}>
                {includeCW && +cwFinal > 0 && <div style={{ flex: +cwFinal, background: 'var(--b400)', transition: 'flex .3s' }} title={`CW: ${cwFinal} marks`} />}
                {includeCBT && +cbtFinal > 0 && <div style={{ flex: +cbtFinal, background: 'var(--amber)', transition: 'flex .3s' }} title={`CBT: ${cbtFinal} marks`} />}
                {+ueFinal > 0 && <div style={{ flex: +ueFinal, background: 'var(--green)', transition: 'flex .3s' }} title={`UE: ${ueFinal} marks`} />}
                {!totalOk && finalTotal < 100 && <div style={{ flex: 100 - finalTotal, background: 'var(--g100)' }} />}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 9 }}>
                <div style={{ display: 'flex', gap: 16 }}>
                  {includeCW && <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--g500)', display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ display: 'inline-block', width: 9, height: 9, borderRadius: 2, background: 'var(--b400)' }} />CW · {cwFinal} marks</span>}
                  {includeCBT && <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--g500)', display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ display: 'inline-block', width: 9, height: 9, borderRadius: 2, background: 'var(--amber)' }} />CBT · {cbtFinal} marks</span>}
                  <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--g500)', display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ display: 'inline-block', width: 9, height: 9, borderRadius: 2, background: 'var(--green)' }} />UE · {ueFinal} marks</span>
                </div>
                <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--g500)' }}>
                  Total: <strong style={{ color: totalOk ? 'var(--green)' : 'var(--red)' }}>{finalTotal}</strong> / 100
                  {!totalOk && <span style={{ marginLeft: 8, fontSize: 'var(--fs-xs)', color: 'var(--red)' }}>⚠ Must equal 100</span>}
                </div>
              </div>
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
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={e => setSyllabusFile(e.target.files?.[0] ?? null)}
              />
              <div className="file-zone-icon"><i className="lni lni-files"></i></div>
              <p>
                {syllabusFile
                  ? syllabusFile.name
                  : courseUnit.syllabus
                    ? 'Replace the currently attached syllabus (optional)'
                    : 'Upload approved syllabus document (PDF / Word)'}
              </p>
              <p className="text-g400" style={{ fontSize: 'var(--fs-xs)' }}>
                {!syllabusFile && courseUnit.syllabus && (
                  <>Current: <a href={courseUnit.syllabus} target="_blank" rel="noreferrer">view attached file</a> · </>
                )}
                Must conform to NCHE or UVTOP accreditation
              </p>
            </div>
          </div>

        </div>
        )}

        {/* ── Step 2: Course Outline — two-panel layout (chapters left, active chapter's topics right) ────────────────────────── */}
        {step === 2 && (() => {
          const activeChapter = chapters[activeChapterIdx]
          return (
            <div className="fsm-layout">

              {/* Left sidebar — one entry per chapter */}
              <div className="fsm-sidebar">
                <div style={{ padding: '14px 14px 6px', fontSize: 10.5, fontWeight: 700, color: 'var(--g400)', textTransform: 'uppercase', letterSpacing: '.07em' }}>
                  Chapters <span style={{ color: 'var(--b500)' }}>({chapterCap > 0 ? `${chapters.length}/${chapterCap}` : chapters.length})</span>
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: '4px 8px' }}>
                  {chapters.map((ch, ci) => (
                    <div
                      key={ci}
                      onClick={() => setActiveChapterIdx(ci)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '9px 10px', borderRadius: 'var(--rsm)', marginBottom: 2,
                        background: activeChapterIdx === ci ? 'var(--b500)' : 'transparent',
                        color: activeChapterIdx === ci ? '#fff' : 'var(--g700)',
                        cursor: 'pointer', transition: 'background .15s',
                      }}
                    >
                      <div style={{ width: 30, height: 30, borderRadius: '50%', background: activeChapterIdx === ci ? 'rgba(255,255,255,.2)' : 'var(--b100)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <i className="lni lni-bookmark" style={{ fontSize: 13, color: activeChapterIdx === ci ? '#fff' : 'var(--b600)' }}></i>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 13, lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ch.title || `Chapter ${ci + 1}`}</div>
                        <div style={{ fontSize: 11, opacity: .65, lineHeight: 1.3 }}>{ch.topics.length} topic{ch.topics.length !== 1 ? 's' : ''}</div>
                      </div>
                      {chapters.length > 1 && (
                        <button
                          type="button"
                          onClick={e => { e.stopPropagation(); removeChapter(ci) }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 3, color: activeChapterIdx === ci ? 'rgba(255,255,255,.65)' : 'var(--g300)', display: 'flex', alignItems: 'center', borderRadius: 'var(--rxs)', flexShrink: 0 }}
                          title="Remove chapter"
                        ><i className="lni lni-trash-can" style={{ fontSize: 12 }}></i></button>
                      )}
                    </div>
                  ))}
                </div>
                <div style={{ borderTop: '1.5px solid var(--g200)', padding: '6px 8px 10px' }}>
                  <button type="button" className="btn btn-neu btn-sm" style={{ width: '100%' }} onClick={addChapter} disabled={atChapterCap} title={atChapterCap ? `No. of Chapters is set to ${chapterCap}` : undefined}>
                    <i className="lni lni-plus"></i> Add Chapter
                  </button>
                  {atChapterCap && <div style={{ fontSize: 10.5, color: 'var(--g400)', textAlign: 'center', marginTop: 6 }}>Chapter limit reached ({chapterCap})</div>}
                </div>
              </div>

              {/* Right panel — active chapter's title + topics */}
              <div className="fsm-main">
                {activeChapter && (
                  <>
                    <div className="fg" style={{ marginBottom: 18 }}>
                      <div className="lbl">Chapter Title <span className="req">*</span></div>
                      <input
                        className="ctrl"
                        style={{ fontWeight: 600, ...(chapterErrors[activeChapterIdx] ? { borderColor: 'var(--red)' } : {}) }}
                        value={activeChapter.title}
                        onChange={e => setChapterTitle(activeChapterIdx, e.target.value)}
                        placeholder={`Chapter ${activeChapterIdx + 1} title`}
                      />
                      {chapterErrors[activeChapterIdx] && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{chapterErrors[activeChapterIdx]}</p>}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '20px 1fr 150px 130px 30px', gap: 6, padding: '0 0 6px', fontSize: 10.5, fontWeight: 700, color: 'var(--g400)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      <span></span>
                      <span>Topic</span>
                      <span>Study Sequence</span>
                      <span>Taught By</span>
                      <span></span>
                    </div>

                    <div className="flex flex-col gap-1">
                      {activeChapter.topics.map((t, ti) => (
                        <div key={ti} style={{ display: 'grid', gridTemplateColumns: '20px 1fr 150px 130px 30px', gap: 6, alignItems: 'center' }}>
                          <span style={{ fontSize: 11, color: 'var(--g400)', textAlign: 'center' }}>{ti + 1}.</span>
                          <input className="ctrl" value={t.name} onChange={e => setTopic(activeChapterIdx, ti, 'name', e.target.value)} placeholder="e.g. Introduction to Arrays" />
                          {/* Auto-incrementing, not user-editable — always the topic's 1-based position in this chapter */}
                          <div className="ctrl" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--g500)', background: 'var(--g100)', cursor: 'default' }}>{ti + 1}</div>
                          <SearchSelect placeholder="— Select —" value={t.taughtBy} onChange={v => setTopic(activeChapterIdx, ti, 'taughtBy', v)} options={employeeOptions} />
                          <button
                            className="btn btn-danger btn-sm"
                            style={{ width: 32, height: 32, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                            onClick={() => removeTopic(activeChapterIdx, ti)}
                            disabled={activeChapter.topics.length === 1}
                          >
                            <i className="lni lni-trash-can"></i>
                          </button>
                        </div>
                      ))}
                      <button className="btn btn-neu btn-sm mt-1" style={{ alignSelf: 'flex-start', fontSize: 11 }} onClick={() => addTopic(activeChapterIdx)}>
                        <i className="lni lni-plus"></i> Add Topic
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )
        })()}

        <div className="modal-footer">
          <button className="btn btn-neu" onClick={handleClose}>Cancel</button>
          <span className="flex-1"></span>
          {step === 2 && (
            <button className="btn btn-neu" onClick={() => setStep(1)}>
              <i className="lni lni-arrow-left"></i> Back
            </button>
          )}
          {step === 1 && (
            <button className="btn btn-primary" onClick={goToStep2}>
              Save &amp; Continue <i className="lni lni-arrow-right"></i>
            </button>
          )}
          {step === 2 && (
            <button className="btn btn-primary" disabled={updateCourseUnit.isPending} onClick={handleSubmit}>
              <i className="lni lni-checkmark"></i> {updateCourseUnit.isPending ? 'Updating…' : 'Update Course Unit'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
