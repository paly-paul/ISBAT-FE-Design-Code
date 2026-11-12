'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { IaStructureRowDto } from '@/lib/api/assessment/iaCreation'
import { useIaTestSchedule } from '@/hooks/assessment/useIaTestSchedule'
import { useIaCwSchedule } from '@/hooks/assessment/useIaCwSchedule'
import { useIaUeSchedule } from '@/hooks/assessment/useIaUeSchedule'
import type { UeScheduleDto } from '@/lib/api/assessment/iaUeSchedule'

interface Props {
  row: IaStructureRowDto | null
  progName: string
  semName: string
  onClose: () => void
  onEditCw?: (courseworkGuid: string) => void
  onEditCt?: (classTestGuid: string) => void
  onEditUe?: (universityExamGuid: string) => void
}

type Tab = 'CT' | 'CW' | 'UE'

// Same order as the grid columns.
const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'CT', label: 'Class Test', icon: 'lni-pencil' },
  { id: 'CW', label: 'Course Work', icon: 'lni-book' },
  { id: 'UE', label: 'University Exam', icon: 'lni-graduation' },
]

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// "14 Sep 2026" from "2026-09-14" or "2026-09-14T09:00:00".
function fmtDate(value: string | null | undefined) {
  if (!value) return '—'
  const [y, m, d] = value.split('T')[0].split('-').map(Number)
  if (!y || !m || !d) return '—'
  return `${d} ${MONTHS[m - 1]} ${y}`
}

// "2:30 PM" from "14:30" or "14:30:00".
function fmtTime(value: string | null | undefined) {
  const match = value?.match(/^(\d{1,2}):(\d{2})/)
  if (!match) return '—'
  const h = Number(match[1])
  return `${h % 12 || 12}:${match[2]} ${h < 12 ? 'AM' : 'PM'}`
}

// "14 Sep 2026, 9:00 AM" from an ISO date-time.
function fmtDateTime(value: string | null | undefined) {
  if (!value) return '—'
  return `${fmtDate(value)}, ${fmtTime(value.split('T')[1])}`
}

function Field({ label, value, full }: { label: string; value: React.ReactNode; full?: boolean }) {
  return (
    <div style={full ? { gridColumn: '1 / -1' } : undefined}>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--g500)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 14, color: 'var(--g900)', fontWeight: 500 }}>{value}</div>
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <div className="sec-divider" style={{ gridColumn: '1 / -1', marginTop: 6, marginBottom: 0 }}>{children}</div>
}

type UeKind = 'theory' | 'practical'
const UE_TABS: { id: UeKind; label: string }[] = [
  { id: 'theory', label: 'Theory' },
  { id: 'practical', label: 'Practical' },
]

function Grid({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', rowGap: 20, columnGap: 24 }}>
      {children}
    </div>
  )
}

function EmptyBox({ icon, children }: { icon: string; children: React.ReactNode }) {
  return (
    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '32px 16px', border: '1.5px dashed var(--g200)', borderRadius: 'var(--rsm)', color: 'var(--g500)', fontSize: 13 }}>
      <i className={`lni ${icon}`} style={{ fontSize: 28, color: 'var(--g300)', display: 'block', marginBottom: 8 }} aria-hidden="true" />
      {children}
    </div>
  )
}

function LoadingBox({ children }: { children: React.ReactNode }) {
  return <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '32px 16px', color: 'var(--g400)', fontSize: 13 }}>{children}</div>
}

const modeBadge = (v: number | null | undefined) =>
  v === 1 ? <span className="badge badge-grey">Offline</span> : v === 0 ? <span className="badge badge-blue">Online</span> : '—'

const publishBadge = (v: number | null | undefined) =>
  v === 1
    ? <span className="badge badge-green"><i className="lni lni-checkmark" aria-hidden="true" /> Published to students</span>
    : <span className="badge badge-grey">Not published</span>

// The exam rule is now required on every save, so a missing one is worth flagging.
const ruleValue = (code: string | null | undefined, name: string | null | undefined) =>
  code ? <span><span className="font-mono">{code}</span> — {name}</span> : <span className="badge badge-amber">No rule linked</span>

// One university exam (Theory or Practical), loaded by its own guid.
function UeSection({ examGuid }: { examGuid: string }) {
  const { data, isLoading, isError } = useIaUeSchedule(examGuid)
  const scheduled = (d: UeScheduleDto) => Boolean(d.examDate && d.startTime && !d.startTime.startsWith('00:00'))

  return (
    <>
      {isLoading ? (
        <LoadingBox>Loading exam details…</LoadingBox>
      ) : isError || !data ? (
        <EmptyBox icon="lni-warning">Couldn’t load this exam’s schedule.</EmptyBox>
      ) : !scheduled(data) ? (
        <EmptyBox icon="lni-calendar">This exam hasn’t been scheduled yet.</EmptyBox>
      ) : (
        <>
          <Field label="Exam Date" value={fmtDate(data.examDate)} />
          <Field label="Start Time" value={fmtTime(data.startTime)} />
          <Field label="End Time" value={fmtTime(data.endTime)} />
          <Field label="Max Mark" value={data.maxMark ?? '—'} />
          <Field label="UE Type" value={data.universityExamType === 1 ? <span className="badge badge-purple">Practical</span> : <span className="badge badge-blue">Theory</span>} />
          <Field label="Exam Mode" value={modeBadge(data.examType)} />
          <Field label="Publish Status" value={publishBadge(data.publishStatus)} />
          <Field label="Exam Rule" value={ruleValue(data.examRuleCode, data.examRuleName)} full />
        </>
      )}
    </>
  )
}

export function IaStructureViewModal({ row, progName, semName, onClose, onEditCw, onEditCt, onEditUe }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('CT')
  // Combined units: which of the two university exams the UE tab shows.
  const [ueKind, setUeKind] = useState<UeKind>('theory')

  useEffect(() => {
    if (row && !row.universityExamGuid && row.practicalExamGuid) {
      setUeKind('practical')
    } else if (row && row.universityExamGuid) {
      setUeKind('theory')
    }
  }, [row])

  const { data: ct, isLoading: ctLoading, isError: ctError } = useIaTestSchedule(row?.classTestGuid || null)
  const { data: cw, isLoading: cwLoading, isError: cwError } = useIaCwSchedule(row?.courseworkGuid || null)

  // Same sliding underline as the Academic view modals.
  const tabRefs = useRef<Partial<Record<Tab, HTMLButtonElement>>>({})
  const [indicator, setIndicator] = useState({ left: 0, width: 0 })
  useLayoutEffect(() => {
    const el = tabRefs.current[activeTab]
    if (el) setIndicator({ left: el.offsetLeft, width: el.offsetWidth })
  }, [activeTab, row])

  // Second-level underline for the Theory / Practical tabs.
  const ueTabRefs = useRef<Partial<Record<UeKind, HTMLButtonElement>>>({})
  const [ueIndicator, setUeIndicator] = useState({ left: 0, width: 0 })
  useLayoutEffect(() => {
    const el = ueTabRefs.current[ueKind]
    if (el) setUeIndicator({ left: el.offsetLeft, width: el.offsetWidth })
  }, [ueKind, activeTab, row])

  if (!row) return null

  // Past intakes are read-only (canEdit false); the save APIs don't check it.
  const editable = row.canEdit
  const hasTheory = Boolean(row.universityExamGuid)
  const hasPractical = Boolean(row.practicalExamGuid)
  const combined = hasTheory && hasPractical
  const practicalOnly = !hasTheory && hasPractical

  const context = (
    <>
      <Field label="Course Unit" value={row.unitName ?? '—'} full />
      <Field label="Programme" value={progName || '—'} />
      <Field label="Semester" value={semName || '—'} />
    </>
  )

  // The University Exam shown:
  // If combined: theory or practical based on ueKind.
  // If theory-only or practical-only: whichever exam guid exists.
  const ueGuid = combined
    ? (ueKind === 'practical' ? row.practicalExamGuid : row.universityExamGuid)
    : (row.universityExamGuid || row.practicalExamGuid)

  const footerEdit =
    !editable ? null
      : activeTab === 'CT' && row.classTestGuid && onEditCt ? () => { onClose(); onEditCt(row.classTestGuid!) }
      : activeTab === 'CW' && row.courseworkGuid && onEditCw ? () => { onClose(); onEditCw(row.courseworkGuid!) }
      : activeTab === 'UE' && ueGuid && onEditUe ? () => { onClose(); onEditUe(ueGuid) }
      : null

  return (
    <div className="modal-overlay open">
      <div className="modal modal-lg modal-flex" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr modal-hdr-blue">
          <div className="modal-title"><i className="lni lni-eye"></i> View Structure &mdash; <span className="font-mono">{row.unitCode}</span></div>
          <button className="modal-close" onClick={onClose} aria-label="Close"><i className="lni lni-close"></i></button>
        </div>

        <div className="tab-bar" role="tablist" aria-label="Assessment structure" style={{ flexShrink: 0, padding: 0, background: 'var(--surface)' }}>
          {TABS.map(t => {
            const active = activeTab === t.id
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={active}
                ref={el => { if (el) tabRefs.current[t.id] = el }}
                className={`tab-btn${active ? ' active' : ''}`}
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={() => setActiveTab(t.id)}
              >
                <i className={`lni ${t.icon}`} aria-hidden="true" /> {t.label}
                {t.id === 'UE' && combined && (
                  <span className={`badge ${active ? 'badge-blue' : 'badge-grey'}`}>2</span>
                )}
              </button>
            )
          })}
          <span className="tab-indicator" style={{ left: indicator.left, width: indicator.width }} />
        </div>

        {activeTab === 'CT' && (
          <div key="CT" className="modal-scroll tab-panel-in" style={{ padding: '20px clamp(14px, 4vw, 24px)' }}>
            <Grid>
              {context}
              <SectionTitle>Class Test Schedule</SectionTitle>
              {!row.classTestGuid ? (
                <EmptyBox icon="lni-pencil">This unit has no class test.</EmptyBox>
              ) : ctLoading ? (
                <LoadingBox>Loading class test details…</LoadingBox>
              ) : ctError || !ct ? (
                <EmptyBox icon="lni-warning">Couldn’t load the class test schedule.</EmptyBox>
              ) : !ct.scheduledStartDateTime ? (
                <EmptyBox icon="lni-calendar">The class test hasn’t been scheduled yet.</EmptyBox>
              ) : (
                <>
                  <Field label="Start" value={fmtDateTime(ct.scheduledStartDateTime)} />
                  <Field label="End" value={fmtDateTime(ct.scheduledEndDateTime)} />
                  <Field label="Duration" value={ct.durationMinutes ? `${ct.durationMinutes} mins` : '—'} />
                  <Field label="Test Mode" value={modeBadge(ct.testType)} />
                  <Field label="Publish Status" value={publishBadge(ct.publishStatus)} />
                  <Field label="Exam Rule" value={ruleValue(ct.examRuleCode, ct.examRuleName)} full />
                </>
              )}
            </Grid>
          </div>
        )}

        {activeTab === 'CW' && (
          <div key="CW" className="modal-scroll tab-panel-in" style={{ padding: '20px clamp(14px, 4vw, 24px)' }}>
            <Grid>
              {context}
              <SectionTitle>Course Work Schedule</SectionTitle>
              {!row.courseworkGuid ? (
                <EmptyBox icon="lni-book">This unit has no course work.</EmptyBox>
              ) : cwLoading ? (
                <LoadingBox>Loading course work details…</LoadingBox>
              ) : cwError || !cw ? (
                <EmptyBox icon="lni-warning">Couldn’t load the course work schedule.</EmptyBox>
              ) : !cw.scheduledStartDateTime ? (
                <EmptyBox icon="lni-calendar">The course work hasn’t been scheduled yet.</EmptyBox>
              ) : (
                <>
                  <Field label="Start" value={fmtDateTime(cw.scheduledStartDateTime)} />
                  <Field label="End" value={fmtDateTime(cw.scheduledEndDateTime)} />
                  <Field label="Mode" value={modeBadge(cw.courseworkType)} />
                  <Field label="Publish Status" value={publishBadge(cw.publishStatus)} />
                  <Field label="Exam Rule" value={ruleValue(cw.examRuleCode, cw.examRuleName)} full />
                </>
              )}
            </Grid>
          </div>
        )}

        {activeTab === 'UE' && (
          <div key="UE" className="modal-scroll tab-panel-in" style={{ padding: '20px clamp(14px, 4vw, 24px)' }}>
            <Grid>
              {context}
              <SectionTitle>University Exam Schedule</SectionTitle>
              {combined && (
                // Second-level tabs: same .tab-bar / .tab-btn as the main row, compact and left-aligned.
                <div className="tab-bar" role="tablist" aria-label="University exam" style={{ gridColumn: '1 / -1', padding: 0, marginTop: -8 }}>
                  {UE_TABS.map(t => {
                    const active = ueKind === t.id
                    return (
                      <button
                        key={t.id}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        ref={el => { if (el) ueTabRefs.current[t.id] = el }}
                        className={`tab-btn${active ? ' active' : ''}`}
                        style={{ padding: '9px 18px' }}
                        onClick={() => setUeKind(t.id)}
                      >
                        {t.label}
                      </button>
                    )
                  })}
                  <span className="tab-indicator" style={{ left: ueIndicator.left, width: ueIndicator.width }} />
                </div>
              )}
              {!ueGuid ? (
                <EmptyBox icon="lni-graduation">This unit has no university exam.</EmptyBox>
              ) : (
                // key: a fresh section per exam, so it shows that exam's own loading state.
                <UeSection key={ueGuid} examGuid={ueGuid} />
              )}
            </Grid>
          </div>
        )}

        <div className="modal-footer">
          <span className="text-sm" style={{ color: 'var(--g500)' }}>
            {editable
              ? combined
                ? 'Combined unit · Theory & Practical exams'
                : practicalOnly
                ? 'Practical-only unit'
                : 'Current intake'
              : <><i className="lni lni-lock-alt" aria-hidden="true" /> Read-only · past intake</>}
          </span>
          <span className="flex-1"></span>
          {footerEdit && (
            <button className="btn btn-neu" onClick={footerEdit}>
              <i className="lni lni-pencil"></i> Edit
            </button>
          )}
          <button className="btn btn-primary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}
