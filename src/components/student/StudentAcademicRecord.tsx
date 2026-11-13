'use client'
import { useState } from 'react'
import { ScrollTable } from '@/components/ScrollTable'
import { AuthError } from '@/lib/api/client'
import { useCreditAccumulation, useProgramUnits } from '@/hooks/student/useAcademicRecord'
import type { AcademicRecordSource, ProgramUnitDto, UnitPassStatus } from '@/lib/api/student/academicRecord'

// Staff-side view of a student's academic record, laid out like the student
// portal's "My Academic Record": a summary strip (credit-accumulation plus
// counts from the curriculum), then one disclosure row per semester with its
// units (program-units / academic-record). The two calls load and fail
// independently, so a failed credit summary doesn't blank the semesters.
// Styles are the .sp-ar block in globals.css; the strip reuses Timeline's
// .sp-tl-summary so the two tabs read as one page.

const UNIT_BADGE: Record<UnitPassStatus, { cls: string; label: string }> = {
  Pass: { cls: 'badge-green', label: 'Pass' },
  Fail: { cls: 'badge-red', label: 'Fail' },
  RL: { cls: 'badge-amber', label: 'Result Late' },
  Pending: { cls: 'badge-grey', label: 'Pending' },
}

function errorMessage(err: unknown) {
  if (err instanceof AuthError && err.code === 'forbidden') return 'You don’t have permission to view this student’s academic record.'
  if (err instanceof AuthError && err.code === 'not_found') return 'This student’s record couldn’t be found.'
  if (err instanceof AuthError && err.code === 'failure') return 'This student has no programme, semester or batch assigned yet, so there’s no curriculum to show.'
  const readable = err instanceof Error && err.message && !(err instanceof AuthError && err.message === err.code)
  return readable ? (err as Error).message : 'The server couldn’t return this student’s academic record. Please try again, or contact support if it keeps happening.'
}

const isFinal = (err: unknown) => err instanceof AuthError && ['forbidden', 'not_found', 'failure'].includes(err.code)

function Marks({ scored, max }: { scored: number | null; max: number | null }) {
  if (scored == null) return <span className="sp-ar-none" aria-label="Not entered">—</span>
  const pct = max ? Math.max(0, Math.min(100, (scored / max) * 100)) : null
  return (
    <span className="sp-ar-mark">
      <span className="sp-ar-mark-val"><b>{scored}</b>{max != null && <small> / {max}</small>}</span>
      {pct != null && (
        <span className={`sp-ar-mark-bar${pct < 50 ? ' is-low' : ''}`} aria-hidden="true"><span style={{ width: `${pct}%` }} /></span>
      )}
    </span>
  )
}

function tally(units: ProgramUnitDto[]) {
  const t = { pass: 0, fail: 0, late: 0, pending: 0 }
  for (const u of units) {
    if (u.passStatus === 'Pass') t.pass++
    else if (u.passStatus === 'Fail') t.fail++
    else if (u.passStatus === 'RL') t.late++
    else t.pending++
  }
  return t
}

export function StudentAcademicRecord({ studentGuid, source }: { studentGuid: string; source: AcademicRecordSource }) {
  const credits = useCreditAccumulation(studentGuid, source)
  const units = useProgramUnits(studentGuid, source)
  // null = untouched, so the server's autoExpandSemesterIndex decides.
  const [openSemesters, setOpenSemesters] = useState<Set<string> | null>(null)

  if (units.isLoading) {
    return (
      <div className="card mp-panel">
        <div className="rpt-empty">
          <i className="lni lni-spinner-arrow spin" aria-hidden="true" />
          <div className="rpt-empty-title">Loading academic record…</div>
        </div>
      </div>
    )
  }

  if (units.isError || !units.data) {
    const canRetry = !isFinal(units.error)
    return (
      <div className="card mp-panel">
        <div className="rpt-empty">
          <i className="lni lni-warning" aria-hidden="true" style={{ color: isFinal(units.error) ? 'var(--amber)' : 'var(--red)' }} />
          <div className="rpt-empty-title">Couldn’t load the academic record</div>
          <div style={{ fontSize: 13, marginBottom: canRetry ? 14 : 0 }}>{errorMessage(units.error)}</div>
          {canRetry && (
            <button className="btn btn-neu btn-sm" onClick={() => { units.refetch(); if (credits.isError) credits.refetch() }} disabled={units.isFetching}>
              <i className="lni lni-reload" aria-hidden="true" /> Try again
            </button>
          )}
        </div>
      </div>
    )
  }

  const record = units.data
  const semesters = record.semesters
  const defaultOpen = semesters[record.autoExpandSemesterIndex]?.semesterGuid
  const open = openSemesters ?? new Set(defaultOpen ? [defaultOpen] : [])
  const allOpen = semesters.length > 0 && semesters.every(s => open.has(s.semesterGuid))

  function toggle(guid: string) {
    const next = new Set(open)
    if (next.has(guid)) next.delete(guid); else next.add(guid)
    setOpenSemesters(next)
  }

  const allUnits = semesters.flatMap(s => s.units)
  const overall = tally(allUnits)
  const awaiting = overall.pending + overall.late
  const current = semesters.find(s => s.isCurrentSemester)
  const c = credits.data
  const percent = Math.max(0, Math.min(100, c?.creditPercentage ?? 0))

  return (
    <div className="card mp-panel">
      <div className="card-hdr">
        <div>
          <div className="card-title"><i className="lni lni-book" aria-hidden="true"></i> Academic Record</div>
          <div className="card-sub">{record.programGroupName ? `${record.programGroupName} · ` : ''}Read-only · published results only</div>
        </div>
        {semesters.length > 1 && (
          <button className="btn btn-neu btn-sm" onClick={() => setOpenSemesters(allOpen ? new Set() : new Set(semesters.map(s => s.semesterGuid)))}>
            <i className={`lni lni-${allOpen ? 'shrink' : 'expand'}`} aria-hidden="true" /> {allOpen ? 'Collapse all' : 'Expand all'}
          </button>
        )}
      </div>

      <dl className="sp-tl-summary">
        <div className="sp-tl-stat">
          <dt>Credits Earned</dt>
          {credits.isLoading ? (
            <dd>…</dd>
          ) : credits.isError || !c ? (
            <>
              <dd>—</dd>
              <dd className="sp-ar-stat-note">{isFinal(credits.error) ? errorMessage(credits.error) : 'Couldn’t load the credit summary.'}</dd>
            </>
          ) : (
            <>
              <dd>{c.earnedCredit} <span className="sp-ar-stat-of">of {c.totalCredit} · {percent}%</span></dd>
              <dd className="sp-ar-meter" role="progressbar" aria-label="Programme credits earned" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}>
                <span style={{ width: `${percent}%` }} />
              </dd>
            </>
          )}
        </div>
        <div className="sp-tl-stat"><dt>Units Passed</dt><dd>{overall.pass} <span className="sp-ar-stat-of">of {allUnits.length}</span></dd></div>
        <div className="sp-tl-stat"><dt>Awaiting Results</dt><dd>{awaiting}{overall.fail > 0 && <span className="sp-ar-stat-of"> · {overall.fail} failed</span>}</dd></div>
        <div className="sp-tl-stat"><dt>Current Semester</dt><dd>{current?.semesterName || '—'}</dd></div>
      </dl>

      {semesters.length === 0 ? (
        <p className="mp-note sp-note"><i className="lni lni-information" aria-hidden="true"></i> No curriculum units are set up for this student’s programme yet.</p>
      ) : (
        <ul className="sp-ar-sems">
          {semesters.map(sem => {
            const isOpen = open.has(sem.semesterGuid)
            const t = tally(sem.units)
            const bodyId = `sp-ar-${sem.semesterGuid}`
            return (
              <li key={sem.semesterGuid} className={`sp-ar-sem${isOpen ? ' is-open' : ''}${sem.isCurrentSemester ? ' is-current' : ''}`}>
                <h3>
                  <button type="button" className="sp-ar-head" aria-expanded={isOpen} aria-controls={bodyId} onClick={() => toggle(sem.semesterGuid)}>
                    <span className="sp-ar-chev" aria-hidden="true"><i className="lni lni-chevron-right"></i></span>
                    <span className="sp-ar-title">
                      <span className="sp-ar-name">{sem.semesterName}</span>
                      {sem.isCurrentSemester && <span className="badge badge-blue">Current</span>}
                    </span>
                    <span className="sp-ar-meta">
                      <span className="sp-ar-tally">
                        {t.pass > 0 && <span className="is-pass">{t.pass} passed</span>}
                        {t.fail > 0 && <span className="is-fail">{t.fail} failed</span>}
                        {t.late > 0 && <span className="is-late">{t.late} late</span>}
                        {t.pending > 0 && <span>{t.pending} pending</span>}
                      </span>
                      <span className="sp-ar-size">{sem.units.length} {sem.units.length === 1 ? 'unit' : 'units'} · {sem.totalSemesterCredit} credits</span>
                    </span>
                  </button>
                </h3>
                {isOpen && (
                  <div id={bodyId} className="sp-ar-body">
                    {sem.units.length === 0 ? (
                      <p className="mp-note sp-note" style={{ margin: 0, padding: '14px 16px' }}><i className="lni lni-information" aria-hidden="true"></i> No units in this semester.</p>
                    ) : (
                      <ScrollTable className="sp-ar-tbl">
                        <table>
                          <thead>
                            <tr>
                              <th>Code</th>
                              <th>Unit</th>
                              <th className="is-num">Credits</th>
                              <th className="is-num">IA Marks</th>
                              <th className="is-num">UE Marks</th>
                              <th>Result</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sem.units.map(u => {
                              const badge = UNIT_BADGE[u.passStatus] ?? { cls: 'badge-grey', label: u.passStatus }
                              return (
                                <tr key={u.courseUnitGuid}>
                                  <td><span className="sp-ar-code">{u.unitCode}</span></td>
                                  <td className="sp-ar-unit">{u.unitName}</td>
                                  <td className="is-num">{u.credit}</td>
                                  <td className="is-num"><Marks scored={u.iaMarksScored} max={u.iaMaxMarks} /></td>
                                  <td className="is-num"><Marks scored={u.ueMarksScored} max={u.ueMaxMarks} /></td>
                                  <td><span className={`badge ${badge.cls}`}>{badge.label}</span></td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </ScrollTable>
                    )}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
