'use client'

import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { SearchSelect } from '@/components/SearchSelect'
import { Toast } from '@/components/Toast'
// The previous page (whole-intake actions, marks grid, moderation, export).
// To bring it back, uncomment these two lines and delete GenerateResultPage below.
// import LegacyGenerateResultPage from './_legacy/LegacyGenerateResultPage'
// export default LegacyGenerateResultPage

// Generate Result — redesign from generate-result.html. Results are generated,
// published, withdrawn and deleted per programme, semester or batch, shown as
// a programme → semester → batch tree. UI-only for now: the API
// (lib/api/assessment/generateResult.ts) works on a whole intake and has no
// batches or per-batch status, so this runs on the design's sample data.

// ── Sample data ─────────────────────────────────────────────────────────────

type Step = 'none' | 'draft' | 'pub'
interface LogEntry { a: string; t: number; by: string; note?: string }
interface Batch { k: string; pg: string; sm: number; bt: string; students: number; s: Step; log: LogEntry[] }
type IntakeData = Record<string, Batch>

const PROGRAMMES: Record<string, { n: string; s: Record<number, { b: string[]; u: number }> }> = {
  BBAIBS22: { n: 'BBA International Business', s: { 1: { b: ['Batch A', 'Batch B'], u: 3 }, 2: { b: ['Batch A', 'Batch B'], u: 2 }, 3: { b: ['Batch A', 'Batch B', 'Weekend'], u: 3 } } },
  BCS21: { n: 'BSc Computer Science', s: { 1: { b: ['Batch A', 'Batch B'], u: 2 }, 2: { b: ['Batch A', 'Batch B', 'Evening'], u: 2 }, 3: { b: ['Batch A'], u: 2 } } },
  BAC22: { n: 'Bachelor of Accounting', s: { 2: { b: ['Batch A', 'Batch B'], u: 2 }, 4: { b: ['Batch A', 'Weekend'], u: 2 } } },
}
const PROG_CODES = Object.keys(PROGRAMMES)
const semsOf = (pg: string) => Object.keys(PROGRAMMES[pg].s).map(Number)

const INTAKES: { id: string; name: string }[] = [
  { id: '20262', name: 'Fall 2026' },
  { id: '20261', name: 'Spring 2026' },
  { id: '20252', name: 'Fall 2025' },
]
const CURRENT_INTAKE = '20262' // only the current intake can be changed
const intakeName = (id: string) => INTAKES.find(i => i.id === id)?.name ?? id

const keyOf = (pg: string, sm: number, bt: string) => `${pg}|${sm}|${bt}`

// Seeded so student counts are the same on every load.
function seededRandom(seed: number) {
  let a = seed
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function buildSampleData(): Record<string, IntakeData> {
  const rand = seededRandom(20262)
  const ago = (h: number) => Date.now() - h * 3600e3
  const data: Record<string, IntakeData> = {}
  for (const { id } of INTAKES) {
    const m: IntakeData = {}
    for (const pg of PROG_CODES) for (const sm of semsOf(pg)) for (const bt of PROGRAMMES[pg].s[sm].b) {
      m[keyOf(pg, sm, bt)] = { k: keyOf(pg, sm, bt), pg, sm, bt, students: 25 + Math.floor(rand() * 40), s: 'none', log: [] }
    }
    data[id] = m
  }
  // Past intakes: everything published, a few withdrawn and published again.
  for (const [id, h] of [['20261', 4300], ['20252', 8600]] as const) {
    Object.values(data[id]).forEach((b, i) => {
      b.s = 'pub'
      b.log = [{ a: 'Generated', t: ago(h + 48), by: 'Registrar' }, { a: 'Published', t: ago(h), by: 'Registrar' }]
      if (i % 5 === 2) b.log.push({ a: 'Withdrawn', t: ago(h - 30), by: 'Registrar', note: 'UE marks corrected' }, { a: 'Published', t: ago(h - 50), by: 'Registrar' })
    })
  }
  const seed = (pg: string, sm: number, bt: string, s: Step, log: [string, number, string, string?][]) => {
    const b = data[CURRENT_INTAKE][keyOf(pg, sm, bt)]
    b.s = s
    b.log = log.map(([a, h, by, note]) => ({ a, t: ago(h), by, note }))
  }
  seed('BBAIBS22', 1, 'Batch A', 'pub', [['Generated', 80, 'Registrar'], ['Published', 72, 'Registrar']])
  seed('BBAIBS22', 1, 'Batch B', 'pub', [['Generated', 80, 'Registrar'], ['Published', 72, 'Registrar']])
  seed('BBAIBS22', 3, 'Batch A', 'pub', [['Generated', 50, 'Registrar'], ['Published', 26, 'Registrar']])
  seed('BBAIBS22', 3, 'Batch B', 'draft', [['Generated', 5, 'Registrar']])
  seed('BCS21', 2, 'Batch A', 'draft', [['Generated', 120, 'Registrar'], ['Published', 96, 'Registrar'], ['Withdrawn', 20, 'Registrar', 'CA marks for CSC1202 re-entered']])
  seed('BCS21', 2, 'Batch B', 'draft', [['Generated', 3, 'Registrar']])
  seed('BCS21', 1, 'Batch A', 'pub', [['Generated', 200, 'Registrar'], ['Published', 190, 'Registrar']])
  seed('BCS21', 1, 'Batch B', 'pub', [['Generated', 200, 'Registrar'], ['Published', 190, 'Registrar']])
  return data
}

// ── Helpers ─────────────────────────────────────────────────────────────────

const LABEL: Record<Step, string> = { none: 'Not generated', draft: 'Generated', pub: 'Published' }
const plural = (n: number, w: string, pl?: string) => `${n} ${n === 1 ? w : (pl ?? `${w}s`)}`
const fmtWhen = (t: number) => new Date(t).toLocaleString('en-GB', {
  day: 'numeric', month: 'short',
  year: new Date(t).getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
  hour: '2-digit', minute: '2-digit',
})
const tally = (list: Batch[]) => { const c = { none: 0, draft: 0, pub: 0 }; list.forEach(b => c[b.s]++); return c }
const studentsOf = (list: Batch[]) => list.reduce((s, b) => s + b.students, 0)
// A programme or semester row takes the earliest step of the batches inside it.
const stepOf = (c: Record<Step, number>): Step => (c.none ? 'none' : c.draft ? 'draft' : 'pub')

interface Filters { pg: string; sm: string; bt: string; st: '' | Step }
const NO_FILTERS: Filters = { pg: '', sm: '', bt: '', st: '' }

type Action = 'gen' | 'pub' | 'del' | 'wd'
const NEEDS: Record<Action, Step> = { gen: 'none', pub: 'draft', del: 'draft', wd: 'pub' }
// scope: 'a' (everything in view) | 'p:PG' | 's:PG|SM' | 'b:KEY'
interface Confirm { action: Action; scope: string }

// ── Page ────────────────────────────────────────────────────────────────────

export default function GenerateResultPage() {
  // Built after mount: the "Generated … ago" times depend on the clock, which
  // differs between the static export and the browser.
  const [data, setData] = useState<Record<string, IntakeData> | null>(null)
  useEffect(() => { setData(buildSampleData()) }, [])

  const [intake, setIntake] = useState(CURRENT_INTAKE)
  const readOnly = intake !== CURRENT_INTAKE
  const batchMap = data?.[intake] ?? {}

  const [filters, setFilters] = useState<Filters>(NO_FILTERS)
  const [panelOpen, setPanelOpen] = useState(false)
  const [open, setOpen] = useState<Set<string>>(() => new Set(['p:BBAIBS22', 's:BBAIBS22|3']))
  const [confirm, setConfirm] = useState<Confirm | null>(null)
  const [reason, setReason] = useState('')
  const [reasonError, setReasonError] = useState('')
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)
  function showToast(msg: string, type = 'success') { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }

  const panelRef = useRef<HTMLDivElement>(null)
  const filterBtnRef = useRef<HTMLButtonElement>(null)
  const lastFocus = useRef<HTMLElement | null>(null)

  // Close the filter panel on an outside click. SearchSelect's dropdown is
  // portalled to <body>, so a click on one of its options counts as inside.
  useEffect(() => {
    if (!panelOpen) return
    function onDown(e: MouseEvent) {
      const t = e.target as HTMLElement
      if (t.closest('.ss-drop') || panelRef.current?.contains(t) || filterBtnRef.current?.contains(t)) return
      setPanelOpen(false)
    }
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape' && !confirm) { setPanelOpen(false); filterBtnRef.current?.focus() } }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey) }
  }, [panelOpen, confirm])

  function batches(pg: string | null, sm: number | null, ignoreStep = false) {
    return Object.values(batchMap).filter(b =>
      (!pg || b.pg === pg) && (sm === null || b.sm === sm) &&
      (!filters.pg || b.pg === filters.pg) && (!filters.sm || String(b.sm) === filters.sm) && (!filters.bt || b.bt === filters.bt) &&
      (ignoreStep || !filters.st || b.s === filters.st))
  }

  const toggle = (k: string) => setOpen(prev => { const n = new Set(prev); if (n.has(k)) n.delete(k); else n.add(k); return n })
  const allKeys = useMemo(() => PROG_CODES.flatMap(pg => [`p:${pg}`, ...semsOf(pg).map(sm => `s:${pg}|${sm}`)]), [])
  const allOpen = allKeys.every(k => open.has(k))
  const expandAll = () => setOpen(new Set(allKeys))

  // Picking a programme / semester in the filters also opens it in the tree.
  function setFilter<K extends keyof Filters>(k: K, v: Filters[K]) {
    setFilters(prev => {
      const next = { ...prev, [k]: v }
      if (k === 'pg') { next.sm = ''; next.bt = '' }
      if (k === 'sm') next.bt = ''
      return next
    })
    if (k === 'pg' && v) setOpen(prev => new Set(prev).add(`p:${v}`))
    if (k === 'sm' && v) setOpen(prev => new Set(prev).add(`s:${filters.pg}|${v}`))
    if (k === 'st' && v) expandAll()
  }

  function changeIntake(id: string) {
    if (!id || id === intake) return
    setIntake(id)
    showToast(`Showing ${intakeName(id)}`)
  }

  // ── Confirm dialog ──
  function scopeOf(scope: string) {
    const kind = scope[0], rest = scope.slice(2)
    if (kind === 'a') {
      const parts = [filters.pg, filters.sm && `Semester ${filters.sm}`, filters.bt].filter(Boolean).join(' · ')
      return { label: `${intakeName(intake)} · ${parts || 'all programmes'}`, list: batches(null, null), kind: 'intake' as const }
    }
    if (kind === 'p') return { label: `${rest} · ${PROGRAMMES[rest].n}`, list: batches(rest, null), kind: 'programme' as const }
    if (kind === 's') { const [pg, sm] = rest.split('|'); return { label: `${pg} · Semester ${sm}`, list: batches(pg, Number(sm)), kind: 'semester' as const } }
    const b = batchMap[rest]
    return { label: `${b.pg} · Semester ${b.sm} · ${b.bt}`, list: [b], kind: 'batch' as const }
  }

  function ask(action: Action, scope: string) {
    if (readOnly) return
    lastFocus.current = document.activeElement as HTMLElement | null
    setReason('')
    setReasonError('')
    setConfirm({ action, scope })
  }

  function closeConfirm() {
    setConfirm(null)
    const el = lastFocus.current
    if (el && document.body.contains(el)) setTimeout(() => el.focus(), 0)
  }

  function runConfirm() {
    if (!confirm) return
    const { list: all } = scopeOf(confirm.scope)
    const list = all.filter(b => b.s === NEEDS[confirm.action])
    let why: string | undefined
    if (confirm.action === 'wd') {
      why = reason.trim()
      if (!why) { setReasonError('Add a reason so others know why it was withdrawn.'); return }
    }
    const [step, word]: [Step, string] = {
      gen: ['draft', 'Generated'], pub: ['pub', 'Published'], del: ['none', 'Deleted'], wd: ['draft', 'Withdrawn'],
    }[confirm.action] as [Step, string]
    const now = Date.now()
    setData(prev => {
      if (!prev) return prev
      const next = { ...prev[intake] }
      list.forEach(b => { next[b.k] = { ...b, s: step, log: [...b.log, { a: word, t: now, by: 'You', note: why }] } })
      return { ...prev, [intake]: next }
    })
    showToast(`${word} ${list.length === 1 ? list[0].bt : plural(list.length, 'batch', 'batches')}`)
    closeConfirm()
  }

  useEffect(() => {
    if (!confirm) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeConfirm() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [confirm])

  // ── Derived view ──
  const everything = batches(null, null, true)
  const counts = tally(everything)
  const shownCount = batches(null, null).length
  const readyToPublish = batches(null, null).filter(b => b.s === 'draft').length
  const filterCount = [filters.pg, filters.sm, filters.bt, filters.st].filter(Boolean).length

  const chips: { k: keyof Filters; label: string }[] = []
  if (filters.pg) chips.push({ k: 'pg', label: filters.pg })
  if (filters.sm) chips.push({ k: 'sm', label: `Semester ${filters.sm}` })
  if (filters.bt) chips.push({ k: 'bt', label: filters.bt })
  if (filters.st) chips.push({ k: 'st', label: LABEL[filters.st] })

  const programmeOptions = [{ value: '', label: 'All programmes' }, ...PROG_CODES.map(p => ({ value: p, label: `${p} · ${PROGRAMMES[p].n}` }))]
  const semesterOptions = filters.pg
    ? [{ value: '', label: 'All semesters' }, ...semsOf(filters.pg).map(s => ({ value: String(s), label: `Semester ${s}` }))]
    : [{ value: '', label: 'Choose a programme first' }]
  const batchOptions = filters.pg && filters.sm
    ? [{ value: '', label: 'All batches' }, ...PROGRAMMES[filters.pg].s[Number(filters.sm)].b.map(b => ({ value: b, label: b }))]
    : [{ value: '', label: 'Choose a semester first' }]
  const statusOptions = [{ value: '', label: 'All statuses' }, ...(['none', 'draft', 'pub'] as Step[]).map(s => ({ value: s, label: LABEL[s] }))]

  // ── Pieces ──
  function statusCell(c: Record<Step, number>, n: number) {
    if (n === 1) { const s = stepOf(c); return <span className={`gr-pill gr-pill-${s}`}>{LABEL[s]}</span> }
    return (
      <div className="gr-st">
        <div className="gr-st-top">
          <span><b className="tabular-nums">{c.pub}</b> of <span className="tabular-nums">{n}</span> published</span>
          {c.draft > 0 && <span className="gr-st-extra tabular-nums">{c.draft} generated</span>}
        </div>
        <div className="gr-bar" role="img" aria-label={`${c.pub} published, ${c.draft} generated, ${c.none} not generated`}>
          {c.pub > 0 && <i className="gr-seg-pub" style={{ width: `${(c.pub / n) * 100}%` }} />}
          {c.draft > 0 && <i className="gr-seg-draft" style={{ width: `${(c.draft / n) * 100}%` }} />}
        </div>
      </div>
    )
  }

  function actions(scope: string, c: Record<Step, number>, name: string) {
    if (readOnly) return <div className="gr-acts" />
    const s = stepOf(c)
    if (s === 'none') return (
      <div className="gr-acts">
        <button type="button" className="btn btn-primary btn-sm" onClick={() => ask('gen', scope)} aria-label={`Generate result for ${name}`}>
          <i className="lni lni-bolt" aria-hidden="true" /> Generate result
        </button>
      </div>
    )
    if (s === 'draft') return (
      <div className="gr-acts">
        <button type="button" className="btn btn-sm gr-btn-del" onClick={() => ask('del', scope)} aria-label={`Delete result for ${name}`}>
          <i className="lni lni-trash-can" aria-hidden="true" /> Delete result
        </button>
        <button type="button" className="btn btn-primary btn-sm" onClick={() => ask('pub', scope)} aria-label={`Publish result for ${name}`}>
          <i className="lni lni-eye" aria-hidden="true" /> Publish
        </button>
      </div>
    )
    return (
      <div className="gr-acts">
        <button type="button" className="btn btn-neu btn-sm" onClick={() => ask('wd', scope)} aria-label={`Withdraw result for ${name}`}>
          <i className="lni lni-reply" aria-hidden="true" /> Withdraw
        </button>
      </div>
    )
  }

  const toggleBtn = (k: string, label: string) => (
    <button type="button" className="gr-tg" aria-expanded={open.has(k)} aria-label={`${open.has(k) ? 'Collapse' : 'Expand'} ${label}`} onClick={() => toggle(k)}>
      <i className="lni lni-chevron-down" aria-hidden="true" />
    </button>
  )

  // ── Tree ──
  const tree = PROG_CODES.map(pg => {
    const pl = batches(pg, null)
    if (!pl.length) return null
    const pc = tally(pl)
    const pOpen = open.has(`p:${pg}`)
    const sems = semsOf(pg).filter(sm => batches(pg, sm).length)
    return (
      <Fragment key={pg}>
        <div className={`gr-row gr-l0 gr-grid${pOpen ? ' is-open' : ''}`}>
          <div className="gr-name">
            {toggleBtn(`p:${pg}`, pg)}
            <div className="gr-tt">
              <div className="gr-t1"><span className="gr-code">{pg}</span>{PROGRAMMES[pg].n}</div>
              <div className="gr-t2">{plural(sems.length, 'semester')} · {plural(pl.length, 'batch', 'batches')}</div>
            </div>
          </div>
          <div className="gr-stu tabular-nums">{studentsOf(pl)}</div>
          {statusCell(pc, pl.length)}
          {actions(`p:${pg}`, pc, pg)}
        </div>
        {pOpen && sems.map(sm => {
          const sl = batches(pg, sm)
          const sc = tally(sl)
          const sKey = `s:${pg}|${sm}`
          const sOpen = open.has(sKey)
          return (
            <Fragment key={sKey}>
              <div className="gr-row gr-l1 gr-grid">
                <div className="gr-name">
                  {toggleBtn(sKey, `Semester ${sm}`)}
                  <div className="gr-tt">
                    <div className="gr-t1">Semester {sm}</div>
                    <div className="gr-t2">{plural(sl.length, 'batch', 'batches')} · {plural(PROGRAMMES[pg].s[sm].u, 'course unit')}</div>
                  </div>
                </div>
                <div className="gr-stu tabular-nums">{studentsOf(sl)}</div>
                {statusCell(sc, sl.length)}
                {actions(sKey, sc, `${pg} semester ${sm}`)}
              </div>
              {sOpen && sl.map(b => {
                const last = b.log[b.log.length - 1]
                const meta = last ? `${last.a} ${fmtWhen(last.t)} · ${last.by}` : 'Marks entered, ready to generate'
                return (
                  <div key={b.k} className="gr-row gr-l2 gr-grid">
                    <div className="gr-name">
                      <div className="gr-tt">
                        <div className="gr-t1">{b.bt}</div>
                        <div className="gr-t2" title={last?.note ? `${meta} · “${last.note}”` : meta}>
                          {meta}{last?.note && <> · <q>{last.note}</q></>}
                        </div>
                      </div>
                    </div>
                    <div className="gr-stu tabular-nums">{b.students}</div>
                    {statusCell(tally([b]), 1)}
                    {actions(`b:${b.k}`, tally([b]), `${b.bt}, semester ${b.sm}`)}
                  </div>
                )
              })}
            </Fragment>
          )
        })}
      </Fragment>
    )
  })

  // ── Confirm dialog content ──
  let dialog: React.ReactNode = null
  if (confirm) {
    const { label, list: all, kind } = scopeOf(confirm.scope)
    const list = all.filter(b => b.s === NEEDS[confirm.action])
    const one = list.length === 1
    const nb = plural(list.length, 'batch', 'batches')
    const skipped = all.length - list.length
    const T = {
      gen: { icon: 'lni-bolt', title: one ? 'Generate result?' : `Generate results for ${nb}?`, body: 'IA and UE totals are worked out from the marks entered. Nothing is shown to students until you publish.', ok: 'Generate result' },
      pub: { icon: 'lni-eye', title: one ? 'Publish result?' : `Publish ${nb}?`, body: 'Students will see these results on the Student Portal. To make changes later you’ll need to withdraw them.', ok: 'Publish' },
      del: { icon: 'lni-trash-can', title: one ? 'Delete result?' : `Delete results for ${nb}?`, body: 'The generated result is removed. Marks entered by lecturers stay as they are, and you can generate again.', ok: 'Delete result' },
      wd: { icon: 'lni-reply', title: one ? 'Withdraw result?' : `Withdraw ${nb}?`, body: 'Students will no longer see these results. Afterwards you can publish again or delete the result.', ok: 'Withdraw' },
    }[confirm.action]
    const danger = confirm.action === 'del'
    dialog = (
      <div className="modal-overlay open">
        <div className="gr-dlg" role="dialog" aria-modal="true" aria-labelledby="gr-dlg-title">
          <div className={`gr-dlg-ico${danger ? ' is-danger' : ''}`}><i className={`lni ${T.icon}`} aria-hidden="true" /></div>
          <h3 id="gr-dlg-title" className="gr-dlg-title">{T.title}</h3>
          <p className="gr-dlg-body">{T.body}</p>
          <div className="gr-box">
            <div className="gr-box-hdr"><b>{label}</b><span className="tabular-nums">{kind === 'batch' ? plural(list[0].students, 'student') : nb}</span></div>
            {kind !== 'batch' && (
              <ul>
                {list.map(b => (
                  <li key={b.k}>
                    <span>{kind === 'intake' ? `${b.pg} · Sem ${b.sm} · ` : kind === 'programme' ? `Semester ${b.sm} · ` : ''}{b.bt}</span>
                    <span className="tabular-nums">{b.students} students</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {skipped > 0 && (
            <div className="gr-note">
              {plural(skipped, 'other batch', 'other batches')} in this {kind === 'intake' ? 'view' : kind} {skipped === 1 ? 'is' : 'are'} at a different step and won’t change.
            </div>
          )}
          {confirm.action === 'wd' && (
            <div className="fg mb-0">
              <label className="lbl" htmlFor="gr-reason">Reason for withdrawal <span className="req">*</span></label>
              <textarea
                id="gr-reason"
                className="ctrl"
                rows={3}
                autoFocus
                placeholder="e.g. CA marks re-entered for CSC1202"
                value={reason}
                onChange={e => { setReason(e.target.value); if (reasonError) setReasonError('') }}
                style={reasonError ? { borderColor: 'var(--red)' } : undefined}
              />
              <p className="field-err" aria-live="polite" style={{ color: 'var(--red)', fontSize: 12, marginTop: 4, minHeight: 18 }}>{reasonError}</p>
            </div>
          )}
          <div className="gr-dlg-foot">
            <button type="button" className="btn btn-neu" onClick={closeConfirm}>Cancel</button>
            <button type="button" className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={runConfirm} autoFocus={confirm.action !== 'wd'}>{T.ok}</button>
          </div>
        </div>
      </div>
    )
  }

  const pct = everything.length ? Math.round((counts.pub / everything.length) * 100) : 0
  const seg = (s: Step) => counts[s] > 0 && <i className={`gr-seg-${s}`} style={{ width: `${(counts[s] / everything.length) * 100}%` }} title={`${counts[s]} ${LABEL[s].toLowerCase()}`} />
  const tab = (v: '' | Step, label: string, n: number) => (
    <button type="button" className="gr-tab" aria-pressed={filters.st === v} onClick={() => setFilter('st', filters.st === v && v ? '' : v)}>
      {v && <i className={`gr-dot gr-dot-${v}`} aria-hidden="true" />}{label}<span className="gr-tab-n tabular-nums">{n}</span>
    </button>
  )

  return (
    <div className="page active" id="page-generate-result">
      <div className="pg-hdr">
        <div>
          <div className="pg-title">Generate Result</div>
          <div className="pg-sub">Generate, publish and withdraw exam results by programme, semester or batch.</div>
        </div>
        <div className="gr-intake">
          <label className="lbl" htmlFor="gr-intake">
            Academic intake
            <span className={`badge ${readOnly ? 'badge-grey' : 'badge-green'}`} style={{ marginLeft: 8, padding: '1px 8px' }}>{readOnly ? 'Past' : 'Current'}</span>
          </label>
          <SearchSelect
            options={INTAKES.map(i => ({ value: i.id, label: `${i.name} (${i.id})${i.id === CURRENT_INTAKE ? ' · Current' : ''}` }))}
            value={intake}
            onChange={changeIntake}
          />
        </div>
      </div>

      {!data ? (
        <div className="card"><div className="text-g400 text-center" style={{ padding: 32 }}>Loading results…</div></div>
      ) : (
        <>
          {/* Summary */}
          <section className="card gr-sum" aria-label="Publishing progress">
            <div>
              <div className="gr-sum-k">Publishing progress</div>
              <div className="gr-sum-v">
                <b className="tabular-nums">{counts.pub}</b>
                <span>of {plural(everything.length, 'batch', 'batches')} published</span>
                <span className="gr-sum-pct tabular-nums">{pct}%</span>
              </div>
            </div>
            <div className="gr-tabs" role="group" aria-label="Show batches by status">
              {tab('', 'All', everything.length)}
              {tab('none', 'Not generated', counts.none)}
              {tab('draft', 'Generated', counts.draft)}
              {tab('pub', 'Published', counts.pub)}
            </div>
            <div className="gr-sum-bar" role="img" aria-label={`${counts.pub} published, ${counts.draft} generated, ${counts.none} not generated`}>
              {seg('pub')}{seg('draft')}{seg('none')}
            </div>
            <div className="gr-legend">
              <span><i className="gr-dot gr-dot-pub" /><b className="tabular-nums">{studentsOf(everything.filter(b => b.s === 'pub'))}</b> students can see results</span>
              <span><i className="gr-dot gr-dot-draft" /><b className="tabular-nums">{studentsOf(everything.filter(b => b.s === 'draft'))}</b> waiting on publish</span>
              <span><i className="gr-dot gr-dot-none" /><b className="tabular-nums">{studentsOf(everything.filter(b => b.s === 'none'))}</b> waiting on generate</span>
            </div>
          </section>

          {/* Results tree */}
          <section className={`card gr-list${readOnly ? ' is-readonly' : ''}`} aria-labelledby="gr-list-title">
            <div className="gr-lh">
              <div className="gr-lh-left">
                <h2 id="gr-list-title" className="card-title">Results <span className="badge badge-grey tabular-nums">{plural(shownCount, 'batch', 'batches')}</span></h2>
                <button
                  ref={filterBtnRef}
                  type="button"
                  className={`btn btn-neu btn-sm${panelOpen ? ' gr-on' : ''}`}
                  aria-expanded={panelOpen}
                  aria-controls="gr-filters"
                  onClick={() => setPanelOpen(o => !o)}
                >
                  <i className="lni lni-funnel" aria-hidden="true" /> Filters
                  {filterCount > 0 && <span className="gr-fn tabular-nums">{filterCount}</span>}
                </button>
              </div>
              <div className="gr-lh-right">
                <button type="button" className="btn btn-neu btn-sm gr-quiet" onClick={() => (allOpen ? setOpen(new Set()) : expandAll())}>
                  {allOpen ? 'Collapse all' : 'Expand all'}
                </button>
                {!readOnly && (
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    disabled={!readyToPublish}
                    title={readyToPublish ? undefined : 'Nothing is generated and waiting to publish'}
                    onClick={() => ask('pub', 'a:')}
                  >
                    <i className="lni lni-eye" aria-hidden="true" /> Publish all
                  </button>
                )}
              </div>

              {panelOpen && (
                <div ref={panelRef} id="gr-filters" className="gr-fpanel" role="dialog" aria-label="Filters">
                  <h3>Filter results</h3>
                  <div className="gr-fgrid">
                    <div className="fg mb-0"><label className="lbl">Programme</label>
                      <SearchSelect options={programmeOptions} value={filters.pg} onChange={v => setFilter('pg', v)} /></div>
                    <div className="fg mb-0"><label className="lbl">Semester</label>
                      <SearchSelect options={semesterOptions} value={filters.sm} onChange={v => setFilter('sm', v)} disabled={!filters.pg} /></div>
                    <div className="fg mb-0"><label className="lbl">Batch</label>
                      <SearchSelect options={batchOptions} value={filters.bt} onChange={v => setFilter('bt', v)} disabled={!filters.sm} /></div>
                    <div className="fg mb-0"><label className="lbl">Status</label>
                      <SearchSelect options={statusOptions} value={filters.st} onChange={v => setFilter('st', v as '' | Step)} /></div>
                  </div>
                  <div className="gr-pfoot">
                    <button type="button" className="btn btn-neu btn-sm gr-quiet" onClick={() => setFilters(NO_FILTERS)}>Clear all</button>
                    <button type="button" className="btn btn-primary btn-sm" onClick={() => { setPanelOpen(false); filterBtnRef.current?.focus() }}>Show results</button>
                  </div>
                </div>
              )}
            </div>

            {chips.length > 0 && (
              <div className="gr-chips">
                {chips.map(c => (
                  <span key={c.k} className="gr-chip">{c.label}
                    <button type="button" aria-label={`Remove filter ${c.label}`} onClick={() => setFilter(c.k, '' as never)}>&times;</button>
                  </span>
                ))}
                {chips.length > 1 && <button type="button" className="btn btn-neu btn-sm gr-quiet" onClick={() => setFilters(NO_FILTERS)}>Clear all</button>}
              </div>
            )}

            <div className="gr-cols gr-grid" aria-hidden="true">
              <span>Programme / Semester / Batch</span><span>Students</span><span>Status</span><span className="gr-r">{readOnly ? '' : 'Actions'}</span>
            </div>
            <div className="gr-tree">
              {shownCount > 0 ? tree : (
                <div className="gr-empty">
                  <b>No batches match these filters</b>
                  Try removing a filter to see more results.
                  <div><button type="button" className="btn btn-neu btn-sm" onClick={() => setFilters(NO_FILTERS)}>Clear filters</button></div>
                </div>
              )}
            </div>
          </section>
        </>
      )}

      {dialog}
      <Toast toast={toast} />
    </div>
  )
}
