'use client'
import { AuthError } from '@/lib/api/client'

// Shared by the Attendance Reports pages (attendance-report-pages-design.md).

// The report endpoints answer 403 `forbidden` without
// assessment.attendancereport.get, and the PDFs 404 `not_found` when
// nothing matches. `notFound` is the page's own wording from its page doc.
export function reportErrorMessage(err: unknown, fallback: string, notFound?: string) {
  const code = err instanceof AuthError ? err.code : null
  if (code === 'forbidden') return 'You don’t have permission to view attendance reports. Ask an administrator for access.'
  if (code === 'not_found' && notFound) return notFound
  return fallback
}

// Shown in place of a name the lookup couldn't resolve.
export function shortGuid(guid: string) {
  return guid.length > 8 ? `${guid.slice(0, 8)}…` : guid
}

export function isBelowTarget(pct: number, target: number) {
  return pct < target
}

// A percentage cell in the app's plain table style: the figure in green at
// or above the target, red below it with a "Below n%" badge (the same small
// flag as the timetable's "Over" badge), so it never relies on colour alone.
export function AttendancePct({ pct, target }: { pct: number; target: number }) {
  const low = isBelowTarget(pct, target)
  return (
    <span className={`abd-pct${low ? ' is-low' : ' is-ok'}`}>
      {pct.toFixed(1)}%
      {low && <span className="badge badge-red abd-pct-flag">Below {target}%</span>}
    </span>
  )
}

// Overall figure against the target, for a KPI cell: the fill is the real
// figure, the dark tick is the target line, and the note says it in words.
export function TargetMeter({ pct, target, label }: { pct: number; target: number; label: string }) {
  const low = isBelowTarget(pct, target)
  return (
    <>
      <span className="abd-meter" role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
        <span className="abd-meter-fill" style={{ width: `${Math.min(100, pct)}%` }} />
        <span className="abd-meter-target" style={{ left: `${target}%` }} aria-hidden="true" />
      </span>
      <span className="fd-kpi-foot abd-target-note">
        <i className={`lni ${low ? 'lni-warning' : 'lni-checkmark-circle'}`} aria-hidden="true"></i>
        {low ? `Below the ${target}% target` : `Meets the ${target}% target`}
      </span>
    </>
  )
}

export function Dash() {
  return <span className="text-g400" aria-label="Not applicable">—</span>
}

// Four KPI cells and a table's worth of rows, while a report loads.
export function ReportSkeleton() {
  return (
    <div aria-hidden="true">
      <div className="card fd-kpis abd-kpis">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="fd-kpi">
            <span className="fd-kpi-top">
              <span className="fd-kpi-ic"></span>
              <span className="fd-skel" style={{ width: '55%' }} />
            </span>
            <span className="fd-kpi-num"><span className="fd-skel" style={{ width: '45%' }} /></span>
            <span className="fd-kpi-foot"><span className="fd-skel" style={{ width: '65%' }} /></span>
          </div>
        ))}
      </div>
      <div className="card abd-panel">
        <span className="abd-skel abd-skel--title" />
        {[0, 1, 2, 3, 4, 5].map(i => <span key={i} className="abd-skel abd-skel--row" />)}
      </div>
    </div>
  )
}
