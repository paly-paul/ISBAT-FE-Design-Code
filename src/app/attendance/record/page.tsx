'use client'
import { useEffect, useState } from 'react'
import { SearchSelect } from '@/components/SearchSelect'
import DatePicker from '@/components/DatePicker'
import { ScrollTable } from '@/components/ScrollTable'
import { Toast } from '@/components/Toast'
import { usePagePermissions } from '@/hooks/users/usePagePermissions'
import {
  useAttendanceSession, useSessionStudents, useOutlinesByUnit, useRecordAttendance, useTimetableForAttendance,
} from '@/hooks/attendance/useClassAttendance'
import { useTimetableScope } from '@/hooks/attendance/useTimetableScope'
import { SKIP_REASONS, todayYmd, isBeforeStart, parseYmd } from '@/lib/api/attendance/classAttendance'
import { fmtDate, fmtTime, timetableLabel, StatusBadge } from '@/components/attendance/attShared'

// Record Class Attendance (class-attendance-frontend-spec.md, Screen 2).
// Same content as the spec's Sections A–E, laid out to fit one screen: the
// session info is a compact header, the roster scrolls inside its own panel,
// and Skip Class + Outline Topics sit in a sticky side column. Opened
// directly (Intake → Term → Lecturer → Timetable, then a date), or by link
// from Pending Outline Sessions / Attendance Sessions
// (?timetable=&date=&session=&mode=view|edit). There's no get-session-by-guid
// endpoint, so a link carries the timetable and date the session is loaded by.

const TOPIC_ERROR = 'Please select at least one outline topic.'
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase()
}

export default function Page() {
  const permissions = usePagePermissions()
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)
  function showToast(msg: string, type = '') { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }

  // ---- Which session ----
  const scope = useTimetableScope()
  const [timetableGuid, setTimetableGuid] = useState('')
  const [date, setDate] = useState(todayYmd())
  // A session opened by link: its timetable and date are fixed.
  const [linkedGuid, setLinkedGuid] = useState<string | null>(null)
  const [readOnly, setReadOnly] = useState(false)

  // Read on mount, not via useSearchParams — the static export would need a
  // Suspense boundary for that.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search)
    const t = q.get('timetable')
    if (t) {
      setLinkedGuid(t)
      setDate(q.get('date') || todayYmd())
    }
    setReadOnly(q.get('mode') === 'view')
  }, [])
  const linkedQ = useTimetableForAttendance(linkedGuid)
  const linked = !!linkedGuid

  const timetable = linked
    ? linkedQ.data ?? null
    : scope.timetables.find(t => t.timetableGuid === timetableGuid) ?? null
  const sessionQ = useAttendanceSession(timetable, date || null)
  const studentsQ = useSessionStudents(timetable?.timetableGuid ?? null, date || null)
  const outlinesQ = useOutlinesByUnit(timetable?.courseUnitGuid ?? null)
  const session = sessionQ.data ?? null
  const students = studentsQ.data ?? []
  const outlines = outlinesQ.data ?? []
  const isAutomated = !!session?.isAutomated
  const locked = readOnly || session?.status === 2

  // ---- Form state, reset whenever the loaded session changes ----
  const [isSkipped, setIsSkipped] = useState(false)
  const [skipReason, setSkipReason] = useState('')
  const [present, setPresent] = useState<Record<string, boolean>>({})
  const [topics, setTopics] = useState<Set<string>>(new Set())
  const [errors, setErrors] = useState<string[]>([])
  const [rosterSearch, setRosterSearch] = useState('')
  const [rosterFilter, setRosterFilter] = useState<'all' | 'present' | 'absent'>('all')

  function resetForm() {
    setIsSkipped(!!session?.isSkipped)
    setSkipReason(session?.skipReason ? String(session.skipReason) : '')
    setPresent(Object.fromEntries(students.map(s => [s.studentGuid, s.isPresent])))
    setTopics(new Set((session?.outlines ?? []).map(o => o.outlineTlGuid)))
    setErrors([])
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(resetForm, [session, studentsQ.data])

  const presentCount = students.filter(s => present[s.studentGuid]).length
  const absentCount = students.length - presentCount
  const presentPct = students.length ? Math.round((presentCount / students.length) * 100) : 0
  const q = rosterSearch.trim().toLowerCase()
  const visibleStudents = students.filter(s =>
    (rosterFilter === 'all' || (rosterFilter === 'present') === !!present[s.studentGuid]) &&
    (!q || s.fullName.toLowerCase().includes(q) || s.studentNumber.toLowerCase().includes(q)),
  )
  const startTime = session?.startTime ?? timetable?.startTime ?? ''
  const tooEarly = !!date && !!startTime && isBeforeStart(date, startTime)
  const canSave = session?.attendanceSessionGuid ? permissions.edit : permissions.add
  const topicError = errors.includes(TOPIC_ERROR)

  const record = useRecordAttendance()

  function save() {
    if (!timetable) return
    // Same rules and messages as the backend, checked before sending.
    const problems: string[] = []
    if (date > todayYmd()) problems.push('Cannot record attendance for a future date.')
    if (isSkipped && !skipReason) problems.push('Skip reason is required when skipping a class.')
    if (!isSkipped && topics.size === 0) problems.push(TOPIC_ERROR)
    setErrors(problems)
    if (problems.length) return

    // One outline row per covered topic for every (unit, batch, semester) the
    // slot teaches. lecturerEmployeeGuid is the slot's assigned lecturer.
    const links = timetable.links?.length
      ? timetable.links
      : [{ courseUnitGuid: timetable.courseUnitGuid, batchGuid: timetable.batchGuid, semesterGuid: timetable.semesterGuid }]
    record.mutate({
      attendanceSessionGuid: session?.attendanceSessionGuid ?? null,
      timetableGuid: timetable.timetableGuid,
      lecturerEmployeeGuid: timetable.lecturerEmployeeGuid,
      sessionDate: date,
      isSkipped,
      skipReason: isSkipped ? +skipReason : null,
      outlines: isSkipped ? [] : [...topics].flatMap(outlineTlGuid => links.map(l => ({ ...l, outlineTlGuid }))),
      studentRecords: isSkipped ? [] : students.map(s => ({ studentGuid: s.studentGuid, isPresent: !!present[s.studentGuid] })),
    }, {
      onSuccess: () => showToast('Attendance recorded successfully.', 'success'),
      onError: (e: Error & { errors?: string[] }) => setErrors(e.errors?.length ? e.errors : [e.message]),
    })
  }

  function refresh() {
    sessionQ.refetch()
    studentsQ.refetch()
    resetForm()
  }

  function toggleTopic(id: string) {
    setTopics(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  function markAll(value: boolean) {
    setPresent(Object.fromEntries(students.map(s => [s.studentGuid, value])))
  }

  const loaded = !!timetable && !!session && !sessionQ.isLoading && !studentsQ.isLoading

  const failed = [linkedQ, sessionQ, studentsQ, outlinesQ].find(q => q.isError)
  const loadError = failed
    ? (failed.error as Error & { code?: string })?.code === 'forbidden'
      ? 'You don’t have permission to view class attendance. Ask an administrator for access.'
      : (failed.error as Error)?.message || 'Please try again.'
    : null
  function retryLoad() {
    for (const q of [linkedQ, sessionQ, studentsQ, outlinesQ]) if (q.isError) q.refetch()
  }

  return (
    <>
      <div className="page active" id="page-attendance-record">
        <div className="pg-hdr att-pg-hdr">
          <div>
            <div className="pg-title">Record Class Attendance</div>
            <div className="pg-sub">Mark students present or absent and record the outline topics covered</div>
          </div>
        </div>

        {/* ── Session Info ── */}
        <section className="card att-head" aria-label="Session info">
          {linked ? (
            <div className="att-pickers">
              <div className="fg m-0 att-pick-tt">
                <div className="lbl">Timetable</div>
                <input
                  className="ctrl"
                  readOnly
                  aria-readonly="true"
                  value={timetable ? timetableLabel(timetable) : linkedQ.isLoading ? 'Loading timetable…' : 'Timetable not found'}
                />
              </div>
              <div className="fg m-0 att-pick-date">
                <div className="lbl">Session Date</div>
                <input className="ctrl" value={fmtDate(date)} readOnly aria-readonly="true" />
              </div>
            </div>
          ) : (
            <div className="att-pickers att-pickers--scope">
              <div className="fg m-0">
                <div className="lbl">Intake</div>
                <SearchSelect placeholder="Select intake…" options={scope.intakesQ.data ?? []} value={scope.intakeGuid} onChange={v => { scope.setIntake(v); setTimetableGuid('') }} isLoading={scope.intakesQ.isLoading} />
              </div>
              <div className="fg m-0">
                <div className="lbl">Term</div>
                <SearchSelect
                  placeholder={scope.intakeGuid ? 'Select term…' : 'Select an intake first'}
                  options={scope.termsQ.data ?? []}
                  value={scope.term}
                  onChange={v => { scope.setTerm(v); setTimetableGuid('') }}
                  disabled={!scope.intakeGuid}
                />
              </div>
              <div className="fg m-0">
                <div className="lbl">Lecturer</div>
                <SearchSelect
                  placeholder={scope.term ? 'Select lecturer…' : 'Select a term first'}
                  options={scope.lecturersQ.data ?? []}
                  value={scope.lecturerGuid}
                  onChange={v => { scope.setLecturer(v); setTimetableGuid('') }}
                  disabled={!scope.term}
                  isLoading={scope.lecturersQ.isLoading}
                />
              </div>
              <div className="fg m-0 att-pick-tt">
                <div className="lbl">Timetable</div>
                <SearchSelect
                  placeholder={!scope.lecturerGuid ? 'Select a lecturer first' : scope.timetablesQ.data?.length === 0 ? 'No timetabled slots' : 'Select timetable…'}
                  options={scope.timetables.map(t => ({ value: t.timetableGuid, label: timetableLabel(t) }))}
                  value={timetableGuid}
                  onChange={setTimetableGuid}
                  disabled={!scope.lecturerGuid}
                  isLoading={scope.timetablesQ.isLoading}
                />
              </div>
              <div className="fg m-0 att-pick-date">
                <div className="lbl">Session Date</div>
                <DatePicker value={date} onChange={setDate} maxYmd={todayYmd()} />
              </div>
            </div>
          )}

          {timetable && session && (
            <div className="att-strip">
              <div className="att-strip-main">
                <span className="att-date-tile" aria-hidden="true">
                  <span className="att-date-mon">{MONTHS[parseYmd(session.sessionDate).getMonth()]}</span>
                  <span className="att-date-day tabular-nums">{parseYmd(session.sessionDate).getDate()}</span>
                  <span className="att-date-wd">{WEEKDAYS[parseYmd(session.sessionDate).getDay()]}</span>
                </span>
                <div className="att-strip-body">
                  <div className="att-strip-title">
                    <span className="att-code">{timetable.courseUnitCode}</span>
                    <h2>{timetable.courseUnitName}</h2>
                  </div>
                  <dl className="att-strip-meta">
                    <div><dt><i className="lni lni-users" aria-hidden="true"></i> Batch</dt><dd>{timetable.batchCode}</dd></div>
                    <div><dt><i className="lni lni-user" aria-hidden="true"></i> Lecturer</dt><dd>{timetable.lecturerName}</dd></div>
                    <div><dt><i className="lni lni-calendar" aria-hidden="true"></i> Session Date</dt><dd>{fmtDate(session.sessionDate)}</dd></div>
                    <div><dt><i className="lni lni-alarm-clock" aria-hidden="true"></i> Class Time</dt><dd className="tabular-nums">{fmtTime(session.startTime)} – {fmtTime(session.endTime)}</dd></div>
                  </dl>
                </div>
              </div>
              <div className="att-strip-side">
                <StatusBadge status={session.status} />
                {isAutomated && <span className="pill pill-purple"><i className="lni lni-id-card" aria-hidden="true"></i> Biometric</span>}
              </div>
              {session.isSpecialClass && (
                <div className="att-special" role="note">
                  <i className="lni lni-warning" aria-hidden="true"></i> This is a special/makeup class
                </div>
              )}
            </div>
          )}
        </section>

        {loadError ? (
          // Shown once; only the user's Retry sends the requests again.
          <div className="card att-placeholder" role="alert">
            <span className="att-placeholder-icon att-placeholder-icon--amber"><i className="lni lni-warning" aria-hidden="true"></i></span>
            <div className="att-placeholder-title">Couldn&apos;t load this session</div>
            <div className="att-placeholder-sub">{loadError}</div>
            <button type="button" className="btn btn-neu btn-sm" onClick={retryLoad}><i className="lni lni-reload" aria-hidden="true"></i> Retry</button>
          </div>
        ) : !timetable ? (
          linked && linkedQ.isLoading ? (
            <div className="card att-placeholder" role="status">
              <span className="att-placeholder-icon"><i className="lni lni-spinner-arrow spin" aria-hidden="true"></i></span>
              <div className="att-placeholder-title">Loading session…</div>
            </div>
          ) : (
            <div className="card att-placeholder">
              <span className="att-placeholder-icon"><i className="lni lni-calendar" aria-hidden="true"></i></span>
              <div className="att-placeholder-title">{linked ? 'Timetable not found' : 'Select a timetable and date'}</div>
              <div className="att-placeholder-sub">
                {linked
                  ? 'This session’s timetable entry no longer exists. Open Record Attendance from the sidebar to pick another.'
                  : 'Pick the intake, term and lecturer, then the timetable slot. The session, its outline topics and the student list load once a date is chosen.'}
              </div>
            </div>
          )
        ) : !loaded ? (
          <div className="card att-placeholder" role="status">
            <span className="att-placeholder-icon"><i className="lni lni-spinner-arrow spin" aria-hidden="true"></i></span>
            <div className="att-placeholder-title">Loading session…</div>
          </div>
        ) : (
          <>
            <div className="att-work">
              {/* ── Student Attendance ── */}
              <section className="card att-roster" aria-labelledby="att-d">
                <div className="att-panel-hdr">
                  <h3 id="att-d">Student Attendance{isAutomated ? ' (Biometric)' : ''}</h3>
                  {!isSkipped && students.length > 0 && !isAutomated && !locked && (
                    <div className="att-panel-actions">
                      <button type="button" className="btn btn-neu btn-sm" onClick={() => markAll(true)}><i className="lni lni-checkmark" aria-hidden="true"></i> Mark All Present</button>
                      <button type="button" className="btn btn-neu btn-sm" onClick={() => markAll(false)}><i className="lni lni-close" aria-hidden="true"></i> Mark All Absent</button>
                    </div>
                  )}
                </div>

                {isSkipped ? (
                  <div className="att-skipped">
                    <span className="att-placeholder-icon att-placeholder-icon--amber"><i className="lni lni-ban" aria-hidden="true"></i></span>
                    <div className="att-placeholder-title">This class session is being skipped</div>
                    <div className="att-placeholder-sub">Students aren&apos;t marked and no topics are recorded for a skipped class. Choose the reason on the right, then save.</div>
                  </div>
                ) : (
                  <>
                    {students.length > 0 && (
                      <>
                        <div className="att-stats">
                          <div className="att-stat att-stat--in"><span className="att-stat-num tabular-nums">{presentCount}</span><span className="att-stat-lbl">Present</span></div>
                          <div className="att-stat att-stat--out"><span className="att-stat-num tabular-nums">{absentCount}</span><span className="att-stat-lbl">Absent</span></div>
                          <div className="att-stat"><span className="att-stat-num tabular-nums">{presentPct}%</span><span className="att-stat-lbl">Attendance</span></div>
                          <div className="att-stats-bar" aria-hidden="true"><span style={{ width: `${presentPct}%` }} /></div>
                        </div>
                        <p className="att-tally-text" aria-live="polite">
                          {presentCount} Present / {absentCount} Absent out of {students.length} students
                        </p>
                        {!isAutomated && !locked && (
                          <p className="att-howto">
                            <i className="lni lni-information" aria-hidden="true"></i>
                            Everyone starts as <strong>Present</strong>. Switch off anyone who is absent, then save.
                          </p>
                        )}
                        <div className="att-tools">
                          <div className="att-seg" role="tablist" aria-label="Show students">
                            {(['all', 'present', 'absent'] as const).map(f => (
                              <button key={f} type="button" role="tab" aria-selected={rosterFilter === f} className={`att-seg-opt${rosterFilter === f ? ' on' : ''}`} onClick={() => setRosterFilter(f)}>
                                {f === 'all' ? 'All' : f === 'present' ? 'Present' : 'Absent'}
                                <span className="att-seg-n tabular-nums">{f === 'all' ? students.length : f === 'present' ? presentCount : absentCount}</span>
                              </button>
                            ))}
                          </div>
                          <label className="att-search">
                            <i className="lni lni-search-alt" aria-hidden="true"></i>
                            <input type="search" className="ctrl" placeholder="Find by name or number…" value={rosterSearch} onChange={e => setRosterSearch(e.target.value)} aria-label="Find a student" />
                          </label>
                        </div>
                      </>
                    )}

                    {isAutomated && (
                      <div className="att-bio" role="note">
                        <i className="lni lni-information" aria-hidden="true"></i>
                        Attendance populated automatically from biometric system. Student records are read-only.
                      </div>
                    )}

                    <ScrollTable maxHeight="max(300px, calc(100vh - 540px))" hideArrows>
                      <table className="att-table">
                        <thead>
                          <tr>
                            <th style={{ width: 52 }}>#</th>
                            <th style={{ width: 150 }}>Student Number</th>
                            <th>Student Name</th>
                            <th style={{ width: 170 }}>{isAutomated ? 'Status' : 'Attendance'}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {students.length === 0 ? (
                            <tr><td colSpan={4} className="tbl-empty-cell"><div className="att-muted att-muted--center">No students registered for this batch</div></td></tr>
                          ) : visibleStudents.length === 0 ? (
                            <tr><td colSpan={4} className="tbl-empty-cell"><div className="att-muted att-muted--center">No students match this view</div></td></tr>
                          ) : visibleStudents.map(s => {
                            const isIn = !!present[s.studentGuid]
                            return (
                              <tr key={s.studentGuid} className={isIn ? undefined : 'att-row-absent'}>
                                <td className="text-g500 tabular-nums">{students.indexOf(s) + 1}</td>
                                <td className="att-stdno">{s.studentNumber}</td>
                                <td>
                                  <span className="att-who">
                                    <span className={`att-avatar${isIn ? '' : ' att-avatar--out'}`} aria-hidden="true">{initials(s.fullName)}</span>
                                    <span className="att-who-name">{s.fullName}</span>
                                  </span>
                                </td>
                                <td>
                                  {isAutomated || locked ? (
                                    <span className={`att-status${isIn ? ' att-status--in' : ' att-status--out'}`}>
                                      <i className={`lni ${isIn ? 'lni-checkmark' : 'lni-close'}`} aria-hidden="true"></i> {isIn ? 'Present' : 'Absent'}
                                    </span>
                                  ) : (
                                    // One switch per student (on = present). A Present/Absent
                                    // pair of buttons read as an action still to take,
                                    // since everyone starts as Present.
                                    <button
                                      type="button"
                                      role="switch"
                                      aria-checked={isIn}
                                      aria-label={`Present: ${s.fullName}`}
                                      className={`att-mark${isIn ? ' is-in' : ' is-out'}`}
                                      onClick={() => setPresent(p => ({ ...p, [s.studentGuid]: !isIn }))}
                                    >
                                      <span className="att-mark-track" aria-hidden="true"><span className="att-mark-knob" /></span>
                                      <span className="att-mark-lbl" aria-hidden="true">{isIn ? 'Present' : 'Absent'}</span>
                                    </button>
                                  )}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </ScrollTable>
                  </>
                )}
              </section>

              <aside className="att-side">
                {/* ── Skip Class (manual sessions only) ── */}
                {!isAutomated && (
                  <section className={`card att-skip${isSkipped ? ' on' : ''}`} aria-label="Skip class">
                    <label className={`att-switch${locked ? ' is-locked' : ''}`}>
                      <span className="att-switch-text">
                        <span className="att-switch-title">Skip this class session</span>
                        <span className="att-switch-sub">For a class that didn&apos;t run</span>
                      </span>
                      <input type="checkbox" role="switch" checked={isSkipped} onChange={e => setIsSkipped(e.target.checked)} disabled={locked} />
                      <span className="att-switch-track" aria-hidden="true"><span /></span>
                    </label>
                    {isSkipped && (
                      <div className="fg m-0 mt-3">
                        <div className="lbl">Skip Reason</div>
                        <SearchSelect
                          placeholder="— Select reason —"
                          options={SKIP_REASONS.map(r => ({ value: String(r.value), label: r.label }))}
                          value={skipReason}
                          onChange={setSkipReason}
                          disabled={locked}
                        />
                      </div>
                    )}
                  </section>
                )}

                {/* ── Outline Topics Covered ── */}
                {!isSkipped && (
                  <section className={`card att-topics-card${topicError ? ' has-err' : ''}`} aria-labelledby="att-c">
                    <div className="att-panel-hdr">
                      <h3 id="att-c">Outline Topics Covered</h3>
                      {outlines.length > 0 && <span className="att-count tabular-nums">{topics.size}/{outlines.length}</span>}
                    </div>
                    {outlines.length > 0 && (
                      <div className="att-topic-meter" aria-hidden="true"><span style={{ width: `${Math.round((topics.size / outlines.length) * 100)}%` }} /></div>
                    )}
                    {outlinesQ.isLoading ? (
                      <div className="att-muted" role="status">Loading outline topics…</div>
                    ) : outlines.length === 0 ? (
                      <div className="att-muted">No outline topics configured for this unit</div>
                    ) : (
                      <ul className="att-topics">
                        {outlines.map(t => (
                          <li key={t.outlineTlGuid}>
                            <label className={`att-topic${topics.has(t.outlineTlGuid) ? ' on' : ''}${readOnly ? ' is-locked' : ''}`}>
                              <input type="checkbox" checked={topics.has(t.outlineTlGuid)} onChange={() => toggleTopic(t.outlineTlGuid)} disabled={readOnly} />
                              <span className="att-topic-check" aria-hidden="true"><i className="lni lni-checkmark"></i></span>
                              <span className="att-topic-body">
                                <span className="att-topic-code">{t.outlineCode}</span>
                                <span className="att-topic-text">{t.outlineDetails}</span>
                              </span>
                            </label>
                          </li>
                        ))}
                      </ul>
                    )}
                    {topicError && <p className="att-field-err" role="alert"><i className="lni lni-warning" aria-hidden="true"></i> {TOPIC_ERROR}</p>}
                  </section>
                )}
              </aside>
            </div>

            {/* ── Submit Bar ── */}
            {!locked && (
              <div className="att-submit" role="region" aria-label="Submit">
                <div className="att-submit-msg">
                  {errors.length > 0 ? (
                    <ul className="att-errors" role="alert">
                      {errors.map(e => <li key={e}><i className="lni lni-warning" aria-hidden="true"></i> {e}</li>)}
                    </ul>
                  ) : tooEarly ? (
                    <span className="att-warn"><i className="lni lni-alarm-clock" aria-hidden="true"></i> Cannot record attendance before class start time ({fmtTime(startTime)})</span>
                  ) : !canSave ? (
                    <span className="att-muted"><i className="lni lni-lock" aria-hidden="true"></i> You don&apos;t have permission to save attendance.</span>
                  ) : isSkipped ? (
                    <span className="att-muted">Skipping · {SKIP_REASONS.find(r => String(r.value) === skipReason)?.label ?? 'choose a reason'}</span>
                  ) : (
                    <span className="att-submit-sum tabular-nums"><b>{presentCount}</b> present · <b>{absentCount}</b> absent · <b>{topics.size}</b> topic{topics.size === 1 ? '' : 's'}</span>
                  )}
                </div>
                <div className="att-submit-actions">
                  <button type="button" className="btn btn-neu" onClick={refresh} disabled={record.isPending}><i className="lni lni-reload" aria-hidden="true"></i> Refresh</button>
                  <button type="button" className="btn btn-primary" onClick={save} disabled={record.isPending || tooEarly || !canSave}>
                    {record.isPending
                      ? <><i className="lni lni-spinner-arrow spin" aria-hidden="true"></i> Saving…</>
                      : isSkipped ? <><i className="lni lni-save" aria-hidden="true"></i> Save — Skip Session</> : <><i className="lni lni-save" aria-hidden="true"></i> Save Attendance</>}
                  </button>
                </div>
              </div>
            )}
            {readOnly && session?.status !== 2 && !isAutomated && permissions.edit && (
              <div className="att-submit">
                <span className="att-muted"><i className="lni lni-eye" aria-hidden="true"></i> Viewing in read-only mode</span>
                <button type="button" className="btn btn-primary" onClick={() => setReadOnly(false)}><i className="lni lni-pencil" aria-hidden="true"></i> Edit</button>
              </div>
            )}
          </>
        )}
      </div>
      <Toast toast={toast} />
    </>
  )
}
