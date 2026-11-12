'use client'

import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { SearchSelect } from '@/components/SearchSelect'
// The previous page (whole-intake actions, marks grid, moderation, export).
// To bring it back, uncomment these two lines and delete GenerateResultPage below.
// import LegacyGenerateResultPage from './_legacy/LegacyGenerateResultPage'
// export default LegacyGenerateResultPage

// Generate Result — a port of generate-result.html, kept visually identical to
// it: its own palette, controls and icons, scoped under .gr in globals.css so
// nothing else in the app changes. Results are generated, published,
// withdrawn and deleted per programme, semester or batch, shown as a
// programme → semester → batch tree. UI-only for now: the API
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
// scope: 'a:' (everything in view) | 'p:PG' | 's:PG|SM' | 'b:KEY'
interface Confirm { action: Action; scope: string }

// ── Icons (the design's own line icons) ─────────────────────────────────────

const PATHS = {
  chev: <path d="m6 9 6 6 6-6" />,
  gen: <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />,
  pub: <path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z" />,
  del: <path d="M3 6h18M8 6V4h8v2m-9 0 1 14h8l1-14" />,
  wd: <><path d="M9 14 4 9l5-5" /><path d="M4 9h11a5 5 0 0 1 0 10h-3" /></>,
  ok: <path d="M20 6 9 17l-5-5" />,
}
function Icon({ name, size = 15 }: { name: keyof typeof PATHS; size?: number }) {
  const w = name === 'del' ? 2 : name === 'ok' ? 2.5 : 2.2
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {PATHS[name]}
    </svg>
  )
}

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

  // The design's own toast: dark, bottom centre, with a check.
  const [toast, setToast] = useState<{ msg: string; on: boolean }>({ msg: '', on: false })
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  function showToast(msg: string) {
    setToast({ msg, on: true })
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(t => ({ ...t, on: false })), 2600)
  }

  const panelRef = useRef<HTMLDivElement>(null)
  const filterBtnRef = useRef<HTMLButtonElement>(null)
  const lastFocus = useRef<HTMLElement | null>(null)

  // Move focus into the panel when it opens (its first dropdown's trigger).
  useEffect(() => { if (panelOpen) panelRef.current?.querySelector<HTMLElement>('.ss-trigger')?.focus() }, [panelOpen])

  // Close the filter panel on an outside click or Escape. SearchSelect's list
  // is portalled to <body>, so a click on one of its options counts as inside.
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
  // Clear all keeps the batch filter's parents cleared too, like the design.
  const clearFilters = () => setFilters(NO_FILTERS)

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
    if (!scopeOf(scope).list.some(b => b.s === NEEDS[action])) return
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
    const list = scopeOf(confirm.scope).list.filter(b => b.s === NEEDS[confirm.action])
    let why: string | undefined
    if (confirm.action === 'wd') {
      why = reason.trim()
      if (!why) { setReasonError('Add a reason so others know why it was withdrawn.'); return }
    }
    const [step, word] = ({
      gen: ['draft', 'Generated'], pub: ['pub', 'Published'], del: ['none', 'Deleted'], wd: ['draft', 'Withdrawn'],
    } as Record<Action, [Step, string]>)[confirm.action]
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

  // ── Pieces ──
  function statusCell(c: Record<Step, number>, n: number) {
    if (n === 1) { const s = stepOf(c); return <span className={`gr-pill gr-p-${s}`}>{LABEL[s]}</span> }
    const seg = (s: Step) => c[s] > 0 && <i className={`gr-c-${s}`} style={{ width: `${(c[s] / n) * 100}%` }} title={`${c[s]} ${LABEL[s].toLowerCase()}`} />
    return (
      <div className="gr-st">
        <div className="gr-st-top">
          <span><b className="gr-num">{c.pub}</b> of <span className="gr-num">{n}</span> published</span>
          {c.draft > 0 && <span className="gr-num gr-stx">{c.draft} generated</span>}
        </div>
        <div className="gr-bar" role="img" aria-label={`${c.pub} published, ${c.draft} generated, ${c.none} not generated`}>
          {seg('pub')}{seg('draft')}
        </div>
      </div>
    )
  }

  function actions(scope: string, c: Record<Step, number>, name: string) {
    if (readOnly) return null
    const s = stepOf(c)
    const lab = `for ${name}`
    if (s === 'none') return (
      <div className="gr-acts">
        <button type="button" className="gr-btn gr-sm gr-primary" onClick={() => ask('gen', scope)} aria-label={`Generate result ${lab}`}><Icon name="gen" />Generate result</button>
      </div>
    )
    if (s === 'draft') return (
      <div className="gr-acts">
        <button type="button" className="gr-btn gr-sm gr-del" onClick={() => ask('del', scope)} aria-label={`Delete result ${lab}`}><Icon name="del" />Delete result</button>
        <button type="button" className="gr-btn gr-sm gr-primary" onClick={() => ask('pub', scope)} aria-label={`Publish ${lab}`}><Icon name="pub" />Publish</button>
      </div>
    )
    return (
      <div className="gr-acts">
        <button type="button" className="gr-btn gr-sm" onClick={() => ask('wd', scope)} aria-label={`Withdraw ${lab}`}><Icon name="wd" />Withdraw</button>
      </div>
    )
  }

  const toggleBtn = (k: string, label: string) => (
    <button type="button" className="gr-btn gr-tg" aria-expanded={open.has(k)} aria-label={`${open.has(k) ? 'Collapse' : 'Expand'} ${label}`} onClick={() => toggle(k)}>
      <Icon name="chev" />
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
        <div className={`gr-row gr-l0 gr-grid${pOpen ? ' gr-open' : ''}`}>
          <div className="gr-name">
            {toggleBtn(`p:${pg}`, pg)}
            <div className="gr-tt">
              <div className="gr-t1"><span className="gr-code">{pg}</span>{PROGRAMMES[pg].n}</div>
              <div className="gr-t2">{plural(sems.length, 'semester')} · {plural(pl.length, 'batch', 'batches')}</div>
            </div>
          </div>
          <div className="gr-stu gr-num">{studentsOf(pl)}</div>
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
                <div className="gr-stu gr-num">{studentsOf(sl)}</div>
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
                    <div className="gr-stu gr-num">{b.students}</div>
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

  // ── Confirm dialog ──
  let dialog: React.ReactNode = null
  if (confirm) {
    const { label, list: all, kind } = scopeOf(confirm.scope)
    const list = all.filter(b => b.s === NEEDS[confirm.action])
    const one = list.length === 1
    const nb = plural(list.length, 'batch', 'batches')
    const skipped = all.length - list.length
    const T = {
      gen: { icon: 'gen' as const, title: one ? 'Generate result?' : `Generate results for ${nb}?`, body: 'IA and UE totals are worked out from the marks entered. Nothing is shown to students until you publish.', ok: 'Generate result' },
      pub: { icon: 'pub' as const, title: one ? 'Publish result?' : `Publish ${nb}?`, body: 'Students will see these results on the Student Portal. To make changes later you’ll need to withdraw them.', ok: 'Publish' },
      del: { icon: 'del' as const, title: one ? 'Delete result?' : `Delete results for ${nb}?`, body: 'The generated result is removed. Marks entered by lecturers stay as they are, and you can generate again.', ok: 'Delete result' },
      wd: { icon: 'wd' as const, title: one ? 'Withdraw result?' : `Withdraw ${nb}?`, body: 'Students will no longer see these results. Afterwards you can publish again or delete the result.', ok: 'Withdraw' },
    }[confirm.action]
    const danger = confirm.action === 'del'
    // No onClick on the overlay: only Cancel / Escape close it (project rule),
    // so a half-typed withdrawal reason can't be lost to a stray click.
    dialog = (
      <div className="gr-modal">
        <div className="gr-dlg" role="dialog" aria-modal="true" aria-labelledby="gr-mt">
          <div className={`gr-ico${danger ? ' gr-d' : ''}`}><Icon name={T.icon} size={20} /></div>
          <h3 id="gr-mt">{T.title}</h3>
          <p>{T.body}</p>
          <div className="gr-box">
            <div className="gr-bh"><b>{label}</b><span className="gr-num">{kind === 'batch' ? plural(list[0].students, 'student') : nb}</span></div>
            {kind !== 'batch' && (
              <ul>
                {list.map(b => (
                  <li key={b.k}>
                    {kind === 'intake' ? `${b.pg} · Sem ${b.sm} · ` : kind === 'programme' ? `Semester ${b.sm} · ` : ''}{b.bt}
                    <span className="gr-num">{b.students} students</span>
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
            <>
              <div className="gr-mf">
                <label htmlFor="gr-wr">Reason for withdrawal</label>
                <textarea
                  id="gr-wr"
                  autoFocus
                  placeholder="e.g. CA marks re-entered for CSC1202"
                  value={reason}
                  onChange={e => { setReason(e.target.value); if (reasonError) setReasonError('') }}
                />
              </div>
              <div className="gr-msg" aria-live="polite">{reasonError}</div>
            </>
          )}
          <div className="gr-dfoot">
            <button type="button" className="gr-btn" onClick={closeConfirm}>Cancel</button>
            <button type="button" className={`gr-btn ${danger ? 'gr-danger' : 'gr-primary'}`} onClick={runConfirm} autoFocus={confirm.action !== 'wd'}>{T.ok}</button>
          </div>
        </div>
      </div>
    )
  }

  const pct = everything.length ? Math.round((counts.pub / everything.length) * 100) : 0
  const sumSeg = (s: Step) => counts[s] > 0 && <i className={`gr-c-${s}`} style={{ width: `${(counts[s] / everything.length) * 100}%` }} title={`${counts[s]} ${LABEL[s].toLowerCase()}`} />
  const tab = (v: '' | Step, label: string, n: number) => (
    <button type="button" className="gr-btn gr-tab" aria-pressed={filters.st === v} onClick={() => setFilter('st', filters.st === v && v ? '' : v)}>
      {v && <i className={`gr-c-${v}`} />}{label}<span className="gr-tc gr-num">{n}</span>
    </button>
  )

  return (
    <div className="page active gr" id="page-generate-result">
      <div className="gr-top">
        <div>
          <h1>Generate Result</h1>
          <p className="gr-sub">Generate, publish and withdraw exam results by programme, semester or batch.</p>
        </div>
        <div className="gr-intk">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
          <div>
            <small>Academic intake</small>
            <b>{intakeName(intake)} ({intake})<span className={`gr-tagc ${readOnly ? 'gr-old' : 'gr-cur'}`}>{readOnly ? 'Past' : 'Current'}</span></b>
          </div>
          <svg className="gr-cv" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
          <select aria-label="Academic intake" value={intake} onChange={e => changeIntake(e.target.value)}>
            {INTAKES.map(i => <option key={i.id} value={i.id}>{i.name} ({i.id}){i.id === CURRENT_INTAKE ? ' · Current' : ''}</option>)}
          </select>
        </div>
      </div>

      {!data ? (
        <section className="gr-card"><div className="gr-empty">Loading results…</div></section>
      ) : (
        <>
          <section className="gr-card gr-sum" aria-label="Summary">
            <div>
              <div className="gr-sum-k">Publishing progress</div>
              <div className="gr-sum-v">
                <b className="gr-num">{counts.pub}</b>
                <span>of {plural(everything.length, 'batch', 'batches')} published</span>
                <span className="gr-pc gr-num">{pct}%</span>
              </div>
            </div>
            <div className="gr-tabs" role="group" aria-label="Show batches by status">
              {tab('', 'All', everything.length)}
              {tab('none', 'Not generated', counts.none)}
              {tab('draft', 'Generated', counts.draft)}
              {tab('pub', 'Published', counts.pub)}
            </div>
            <div className="gr-sum-bar" role="img" aria-label={`${counts.pub} published, ${counts.draft} generated, ${counts.none} not generated`}>
              {sumSeg('pub')}{sumSeg('draft')}{sumSeg('none')}
            </div>
            <div className="gr-sum-f">
              <span><i className="gr-c-pub" /><b className="gr-num">{studentsOf(everything.filter(b => b.s === 'pub'))}</b> students can see results</span>
              <span><i className="gr-c-draft" /><b className="gr-num">{studentsOf(everything.filter(b => b.s === 'draft'))}</b> waiting on publish</span>
              <span><i className="gr-c-none" /><b className="gr-num">{studentsOf(everything.filter(b => b.s === 'none'))}</b> waiting on generate</span>
            </div>
          </section>

          <section className={`gr-card${readOnly ? ' gr-ro' : ''}`} aria-labelledby="gr-lh">
            <div className="gr-lh">
              <div className="gr-lhl">
                <h2 id="gr-lh">Results <span className="gr-cnt gr-num">{plural(shownCount, 'batch', 'batches')}</span></h2>
                <button
                  ref={filterBtnRef}
                  type="button"
                  className="gr-btn gr-sm gr-ftoggle"
                  aria-expanded={panelOpen}
                  aria-controls="gr-fpanel"
                  onClick={() => setPanelOpen(o => !o)}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M4 6h16M7 12h10M10 18h4" /></svg>
                  Filters {filterCount > 0 && <span className="gr-fn">{filterCount}</span>}
                </button>
              </div>
              <div className="gr-lhr">
                <button type="button" className="gr-btn gr-sm gr-quiet" onClick={() => (allOpen ? setOpen(new Set()) : expandAll())}>
                  {allOpen ? 'Collapse all' : 'Expand all'}
                </button>
                {!readOnly && (
                  <button
                    type="button"
                    className="gr-btn gr-sm gr-primary"
                    disabled={!readyToPublish}
                    title={readyToPublish ? '' : 'Nothing is generated and waiting to publish'}
                    onClick={() => ask('pub', 'a:')}
                  >
                    <Icon name="pub" />Publish all
                  </button>
                )}
              </div>

              {panelOpen && (
                <div ref={panelRef} id="gr-fpanel" className="gr-fpanel" role="dialog" aria-label="Filters">
                  <h3>Filter results</h3>
                  <div className="gr-fgrid">
                    <div className="gr-f">
                      <label>Programme</label>
                      <SearchSelect
                        options={[{ value: '', label: 'All programmes' }, ...PROG_CODES.map(p => ({ value: p, label: `${p} · ${PROGRAMMES[p].n}` }))]}
                        value={filters.pg}
                        onChange={v => setFilter('pg', v)}
                      />
                    </div>
                    <div className="gr-f">
                      <label>Semester</label>
                      <SearchSelect
                        options={[
                          { value: '', label: filters.pg ? 'All semesters' : 'Choose a programme first' },
                          ...(filters.pg ? semsOf(filters.pg).map(s => ({ value: String(s), label: `Semester ${s}` })) : []),
                        ]}
                        value={filters.sm}
                        onChange={v => setFilter('sm', v)}
                        disabled={!filters.pg}
                      />
                    </div>
                    <div className="gr-f">
                      <label>Batch</label>
                      <SearchSelect
                        options={[
                          { value: '', label: filters.sm ? 'All batches' : 'Choose a semester first' },
                          ...(filters.pg && filters.sm ? PROGRAMMES[filters.pg].s[Number(filters.sm)].b.map(b => ({ value: b, label: b })) : []),
                        ]}
                        value={filters.bt}
                        onChange={v => setFilter('bt', v)}
                        disabled={!filters.sm}
                      />
                    </div>
                    <div className="gr-f">
                      <label>Status</label>
                      <SearchSelect
                        options={[{ value: '', label: 'All statuses' }, ...(['none', 'draft', 'pub'] as Step[]).map(s => ({ value: s, label: LABEL[s] }))]}
                        value={filters.st}
                        onChange={v => setFilter('st', v as '' | Step)}
                      />
                    </div>
                  </div>
                  <div className="gr-pfoot">
                    <button type="button" className="gr-btn gr-quiet" onClick={clearFilters}>Clear all</button>
                    <button type="button" className="gr-btn gr-primary" onClick={() => { setPanelOpen(false); filterBtnRef.current?.focus() }}>Show results</button>
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
                {chips.length > 1 && <button type="button" className="gr-btn gr-sm gr-quiet gr-chip-clear" onClick={clearFilters}>Clear all</button>}
              </div>
            )}

            <div className="gr-cols gr-grid"><span>Programme / Semester / Batch</span><span>Students</span><span>Status</span>{!readOnly && <span className="gr-r">Actions</span>}</div>
            <div className="gr-tree">
              {shownCount > 0 ? tree : (
                <div className="gr-empty">
                  <b>No batches match these filters</b>Try removing a filter to see more results.<br />
                  <button type="button" className="gr-btn gr-sm" onClick={clearFilters}>Clear filters</button>
                </div>
              )}
            </div>
          </section>
        </>
      )}

      {dialog}
      <div className={`gr-toast${toast.on ? ' gr-on' : ''}`} role="status" aria-live="polite"><Icon name="ok" />{toast.msg}</div>
    </div>
  )
}
