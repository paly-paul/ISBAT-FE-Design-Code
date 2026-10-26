'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient, type UseQueryResult } from '@tanstack/react-query'
import { ScrollTable } from '@/components/ScrollTable'
import { SearchSelect } from '@/components/SearchSelect'
import DatePicker from '@/components/DatePicker'
import { AuthError } from '@/lib/api/client'
import { fmtReportDate, REPORT_PAYMODE_LABEL, reportErrorMessage } from '@/lib/reportFormat'
import { useCurrentAcademicIntake, useIntakesDropdown } from '@/hooks/academic/useIntakes'
import {
  useDashboardAttention,
  useDashboardCollectionByFeeType,
  useDashboardCollections,
  useDashboardDiscounts,
  useDashboardOutstanding,
  useDashboardRecentPayments,
  useDashboardSummaryToday,
} from '@/hooks/finance/useFinanceDashboard'
import { FEE_TYPE_REGISTRATION, type DashboardCollections, type DashboardFeeType, type DashboardRecentPayment } from '@/lib/api/finance/dashboard'

// Finance Dashboard — finance-dashboard-page.md. Seven APIs, loaded in
// parallel; each section renders as its own call returns, with its own
// loading and error state. Money on cards and charts is always the …InBase
// figure in the base currency.
//
// Layout: cards, needs attention and fee-type bars first; then the
// analysis parts (trends, discounts, outstanding detail) in one tabbed
// card; the latest few payments close the page, with View all going to
// Payment History.

const FALLBACK_BASE = 'UGX'
const RECENT_LIMIT = 3
const MAX_RANGE_DAYS = 366

// ── Formatting ─────────────────────────────────────────────────────────────

function fmtFull(n: number) { return n.toLocaleString('en-US', { maximumFractionDigits: 2 }) }

// 18.4M / 5.67B / 950K — the full figure goes in a tooltip.
function fmtShort(n: number) {
  const a = Math.abs(n)
  if (a >= 1e9) return (n / 1e9).toFixed(2) + 'B'
  if (a >= 1e6) return (n / 1e6).toFixed(1) + 'M'
  if (a >= 1e3) return Math.round(n / 1e3) + 'K'
  return String(Math.round(n))
}

function pct(part: number, whole: number) { return whole > 0 ? (part / whole) * 100 : 0 }

// "2026-10-22T15:50:02.947" (local business time) → "15:50".
function hhmm(local: string | null | undefined) { return local && local.length >= 16 ? local.slice(11, 16) : '—' }

// recentChanges timestamps are UTC with a Z; show them in the viewer's time.
function fmtUtc(ts: string) {
  const d = new Date(ts)
  if (isNaN(d.getTime())) return ts
  return `${d.getDate()} ${MONTHS[d.getMonth()]}, ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function Money({ value, cur, className }: { value: number; cur: string; className?: string }) {
  return <span className={className} title={`${cur} ${fmtFull(value)}`}><span className="fd-cur">{cur}</span> {fmtShort(value)}</span>
}

function isForbidden(err: unknown) { return err instanceof AuthError && err.code === 'forbidden' }

// A recent payment's identity across refreshes. NCHE has no receipt number.
function payKey(p: DashboardRecentPayment) { return p.receipt ?? `${p.category}|${p.studentNumber}|${p.entryTime}|${p.amount}` }

function changeSummary(text: string) { return text.replace(/\s+successfully\.?$/i, '').replace(/\d{4,}(\.\d+)?/g, n => fmtFull(Number(n))) }

function clock(ms: number) { const d = new Date(ms); return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}` }

// ── Dates & trend bucketing ────────────────────────────────────────────────

// The API groups by Day or Month only; Week is bucketed here from Day data.
type Granularity = 'day' | 'week' | 'month'
const GRANULARITY_OPTIONS = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
]
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function toYmd(d: Date) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` }
function fromYmd(s: string) { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d) }
function daysInclusive(from: string, to: string) { return Math.round((fromYmd(to).getTime() - fromYmd(from).getTime()) / 86_400_000) + 1 }

function periodOf(d: Date, gran: Granularity) {
  if (gran === 'week') {
    const start = new Date(d); start.setDate(d.getDate() - ((d.getDay() + 6) % 7))
    return { key: toYmd(start), label: `w/c ${start.getDate()} ${MONTHS[start.getMonth()]}` }
  }
  if (gran === 'month') return { key: toYmd(d).slice(0, 7), label: `${MONTHS[d.getMonth()]} ${d.getFullYear()}` }
  return { key: toYmd(d), label: `${d.getDate()} ${MONTHS[d.getMonth()]}` }
}

interface TrendPoint { key: string; label: string; byCur: Record<string, number>; total: number }

// Every period in the range gets a point (days with no payments are zero, not
// missing); each API row is added to its period, per currency, in base.
function buildTrend(data: DashboardCollections | undefined, from: string, to: string, gran: Granularity): TrendPoint[] {
  if (!data || !from || !to || from > to) return []
  const map = new Map<string, TrendPoint>()
  for (let d = fromYmd(from); toYmd(d) <= to; d.setDate(d.getDate() + 1)) {
    const p = periodOf(d, gran)
    if (!map.has(p.key)) map.set(p.key, { ...p, byCur: {}, total: 0 })
  }
  for (const row of data.trend) {
    const p = map.get(periodOf(fromYmd(row.periodStart.slice(0, 10)), gran).key)
    if (!p) continue
    p.byCur[row.currencyCode] = (p.byCur[row.currencyCode] ?? 0) + row.netInBase
    p.total += row.netInBase
  }
  return [...map.values()]
}

// The breakdown lists come per currency; rows for the same name are merged
// on their …InBase amounts (the only figures that may be added).
function combine<T>(rows: T[], key: (r: T) => string, label: (r: T) => string, value: (r: T) => number, count?: (r: T) => number) {
  const map = new Map<string, { label: string; value: number; count: number }>()
  for (const r of rows) {
    const k = key(r)
    const e = map.get(k) ?? { label: label(r), value: 0, count: 0 }
    e.value += value(r); e.count += count?.(r) ?? 0
    map.set(k, e)
  }
  return [...map.values()].sort((a, b) => b.value - a.value)
}

// ── Charts ─────────────────────────────────────────────────────────────────

interface Series { name: string; color: string; values: number[] }

function niceMax(v: number) {
  if (v <= 0) return 1
  const p = Math.pow(10, Math.floor(Math.log10(v)))
  const n = v / p
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p
}

const CHART_H = 236
const PAD = { t: 12, r: 10, b: 26, l: 48 }

function LineChart({ labels, series, cur }: { labels: string[]; series: Series[]; cur: string }) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [w, setW] = useState(0)
  const [hover, setHover] = useState<number | null>(null)

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setW(Math.floor(e.contentRect.width)))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const n = labels.length
  const max = niceMax(Math.max(0, ...series.flatMap(s => s.values)))
  const innerW = Math.max(0, w - PAD.l - PAD.r)
  const innerH = CHART_H - PAD.t - PAD.b
  const x = (i: number) => PAD.l + (n <= 1 ? innerW / 2 : (i / (n - 1)) * innerW)
  const y = (v: number) => PAD.t + innerH - (v / max) * innerH
  const ticks = [0, 0.25, 0.5, 0.75, 1].map(f => f * max)
  const labelEvery = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(innerW / 84))))

  function onMove(e: React.MouseEvent<SVGSVGElement>) {
    if (!n || !innerW) return
    const rx = e.clientX - e.currentTarget.getBoundingClientRect().left - PAD.l
    setHover(Math.min(n - 1, Math.max(0, Math.round(n <= 1 ? 0 : (rx / innerW) * (n - 1)))))
  }

  const total = series.reduce((s, x) => s + x.values.reduce((a, b) => a + b, 0), 0)
  const empty = n === 0 || total === 0

  return (
    <div ref={wrapRef} className="fd-chart">
      {w > 0 && n > 0 && (
        <svg width={w} height={CHART_H} onMouseMove={onMove} onMouseLeave={() => setHover(null)}
          role="img" aria-label={`Collections over ${n} periods, ${cur} ${fmtFull(total)} in total`}>
          <defs>
            {series.map((s, si) => (
              <linearGradient key={si} id={`fd-area-${si}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.color} stopOpacity={series.length > 1 ? 0.08 : 0.18} />
                <stop offset="100%" stopColor={s.color} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          {ticks.map(t => (
            <g key={t}>
              <line x1={PAD.l} x2={w - PAD.r} y1={y(t)} y2={y(t)} className="fd-grid" />
              <text x={PAD.l - 8} y={y(t)} className="fd-axis" textAnchor="end" dominantBaseline="middle">{fmtShort(t)}</text>
            </g>
          ))}
          {labels.map((l, i) => (i % labelEvery === 0 || i === n - 1) && (i === n - 1 || n - 1 - i >= labelEvery * 0.6) ? (
            <text key={i} x={x(i)} y={CHART_H - 6} className="fd-axis" textAnchor={n === 1 ? 'middle' : i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'}>{l}</text>
          ) : null)}
          {series.map((s, si) => {
            const pts = s.values.map((v, i) => `${x(i)},${y(v)}`).join(' ')
            return (
              <g key={si}>
                {n > 1 && <polygon points={`${x(0)},${y(0)} ${pts} ${x(n - 1)},${y(0)}`} fill={`url(#fd-area-${si})`} />}
                <polyline points={pts} fill="none" stroke={s.color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
                {n === 1 && <circle cx={x(0)} cy={y(s.values[0])} r={4} fill={s.color} />}
              </g>
            )
          })}
          {hover !== null && (
            <g>
              <line x1={x(hover)} x2={x(hover)} y1={PAD.t} y2={PAD.t + innerH} className="fd-guide" />
              {series.map((s, si) => <circle key={si} cx={x(hover)} cy={y(s.values[hover])} r={4} fill="var(--white)" stroke={s.color} strokeWidth={2} />)}
            </g>
          )}
        </svg>
      )}
      {hover !== null && w > 0 && (
        <div className="fd-tip" style={{ left: Math.min(Math.max(x(hover), 90), w - 90), top: 0 }}>
          <div className="fd-tip-hd">{labels[hover]}</div>
          {series.map(s => (
            <div key={s.name} className="fd-tip-row">
              <span className="fd-key" style={{ background: s.color }} />{s.name}
              <strong>{cur} {fmtFull(s.values[hover])}</strong>
            </div>
          ))}
        </div>
      )}
      {empty && <div className="fd-chart-empty">No collections in this range.</div>}
    </div>
  )
}

// Ranked horizontal bars — a category's share reads off the bar length and
// its label, not off a colour. With a limit, only the top rows show; "Show
// all" expands the rest inside a bounded scroll box so a 30-programme list
// doesn't stretch the page. Shares are always of the full list.
function BarList({ rows, cur, color = 'var(--b500)', limit, noun = 'rows' }: {
  rows: { label: string; value: number; sub?: string; unconverted?: boolean }[]; cur: string; color?: string; limit?: number; noun?: string
}) {
  const [expanded, setExpanded] = useState(false)
  if (!rows.length) return <p className="fd-none">Nothing in this range.</p>
  const max = Math.max(1, ...rows.map(r => r.value))
  const total = rows.reduce((s, r) => s + r.value, 0)
  const collapsible = limit !== undefined && rows.length > limit + 1
  const shown = collapsible && !expanded ? rows.slice(0, limit) : rows
  const hidden = rows.length - shown.length
  return (
    <div className={`fd-bars-wrap${collapsible && expanded ? ' open' : ''}`}>
    <ul className="fd-bars">
      {shown.map(r => (
        <li key={r.label}>
          <div className="fd-bars-top">
            <span className="fd-bars-lbl" title={r.label}>{r.label}{r.sub && <span className="fd-bars-sub"> · {r.sub}</span>}</span>
            {r.unconverted
              ? <span className="fd-bars-val fd-bars-na" title="Owed only in a currency with no exchange rate, so it can’t be shown in the base currency">No rate set</span>
              : <span className="fd-bars-val"><Money value={r.value} cur={cur} /> <span className="fd-bars-pct">{pct(r.value, total).toFixed(0)}%</span></span>}
          </div>
          <div className="fd-bars-track"><div className="fd-bars-fill" style={{ width: `${(r.value / max) * 100}%`, background: color }} /></div>
        </li>
      ))}
    </ul>
    {collapsible && (
      <button type="button" className="fd-more" aria-expanded={expanded} onClick={() => setExpanded(e => !e)}>
        {expanded
          ? <>Show top {limit} only <i className="lni lni-chevron-up" aria-hidden="true" /></>
          : <>Show all {rows.length} {noun} <span className="fd-more-sub">+{hidden} · <Money value={rows.slice(limit).reduce((s, r) => s + r.value, 0)} cur={cur} /></span> <i className="lni lni-chevron-down" aria-hidden="true" /></>}
      </button>
    )}
    </div>
  )
}

// Categorical slots (validated set, fixed order — never cycled). Slots 3–5
// are under 3:1 on white, so every chart using them keeps visible labels.
const CAT = ['var(--fd-c1)', 'var(--fd-c2)', 'var(--fd-c3)', 'var(--fd-c4)', 'var(--fd-c5)']
// Colour follows the currency everywhere it appears on the page.
const CUR_COLOR: Record<string, string> = { UGX: 'var(--fd-c1)', USD: 'var(--fd-c2)' }
function curColor(code: string) { return CUR_COLOR[code] ?? 'var(--fd-c3)' }
function baseFirst(base: string) { return (a: string, b: string) => (a === base ? -1 : b === base ? 1 : a.localeCompare(b)) }

interface Part { label: string; value: number; color: string; sub?: string }

// Part-to-whole: one stacked bar plus a legend that carries every value, so
// identity never rests on colour alone. Hovering a segment or its legend row
// highlights the pair.
function ShareBar({ parts, format, ariaLabel, inline }: { parts: Part[]; format: (v: number) => React.ReactNode; ariaLabel: string; inline?: boolean }) {
  const [active, setActive] = useState<number | null>(null)
  if (!parts.length) return <p className="fd-none">Nothing in this range.</p>
  const total = parts.reduce((s, p) => s + p.value, 0)
  const state = (i: number) => (active === null ? '' : active === i ? ' on' : ' dim')
  return (
    <div className={`fd-share${inline ? ' fd-share-inline' : ''}`} onMouseLeave={() => setActive(null)}>
      <div className="fd-share-bar" role="img" aria-label={`${ariaLabel}: ${parts.map(p => `${p.label} ${pct(p.value, total).toFixed(0)}%`).join(', ')}`}>
        {parts.map((p, i) => p.value > 0 && (
          <span key={p.label} className={`fd-share-seg${state(i)}`} style={{ flexGrow: p.value, background: p.color }}
            onMouseEnter={() => setActive(i)} title={`${p.label}: ${pct(p.value, total).toFixed(1)}%`} />
        ))}
      </div>
      <ul className="fd-share-legend">
        {parts.map((p, i) => (
          <li key={p.label} className={`fd-share-item${state(i)}`} onMouseEnter={() => setActive(i)}>
            <span className="fd-sw" style={{ background: p.color }} />
            <span className="fd-share-name">{p.label}{p.sub && <small>{p.sub}</small>}</span>
            <span className="fd-share-val">{format(p.value)}</span>
            <span className="fd-share-pct">{pct(p.value, total).toFixed(inline ? 0 : 1)}%</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

// Small pill switch for flipping one panel between related views.
function Segmented<T extends string>({ value, options, onChange, label }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void; label: string }) {
  return (
    <div className="fd-seg" role="radiogroup" aria-label={label}>
      {options.map(o => (
        <button key={o.value} type="button" role="radio" aria-checked={value === o.value}
          className={value === o.value ? 'active' : undefined} onClick={() => onChange(o.value)}>{o.label}</button>
      ))}
    </div>
  )
}

function PanelHead({ title, meta, action }: { title: string; meta?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="fd-ph">
      <div className="min-w-0">
        <h3 className="fd-ph-title">{title}</h3>
        {meta && <div className="fd-ph-meta">{meta}</div>}
      </div>
      {action}
    </div>
  )
}

// ── Section states ─────────────────────────────────────────────────────────

function Loading({ note }: { note?: string }) {
  return (
    <div className="fd-state" role="status">
      <i className="lni lni-spinner-arrow spin" aria-hidden="true" />
      <span>Loading…</span>
      {note && <small>{note}</small>}
    </div>
  )
}

function Failed({ what, error, onRetry }: { what: string; error: unknown; onRetry: () => void }) {
  return (
    <div className="fd-state fd-state-err" role="alert">
      <i className="lni lni-warning" aria-hidden="true" />
      <span>Couldn’t load {what}</span>
      <small>{reportErrorMessage(error, 'Something went wrong.')}</small>
      <button className="btn btn-neu btn-sm" onClick={onRetry}><i className="lni lni-reload" aria-hidden="true" /> Try again</button>
    </div>
  )
}

// Renders the section once its call has returned; until then its own
// loading state, and on failure its own error with a Retry.
function Section<T>({ query, what, note, children }: { query: UseQueryResult<T>; what: string; note?: string; children: (data: T) => React.ReactNode }) {
  if (query.isError) return <Failed what={what} error={query.error} onRetry={() => query.refetch()} />
  if (query.isPending) return <Loading note={note} />
  return <>{children(query.data)}</>
}

// One cell of the KPI panel: tinted icon and label, the figure in the
// cell's tone, one line of context. A loaded cell with a destination is a
// button that opens the detail behind it; while loading or failed it's a
// plain cell (its Retry is the control).
function Kpi<T>({ label, icon, tone, query, value, foot, onOpen, openLabel }: {
  label: string; icon: string; tone?: 'green' | 'amber' | 'red'; query: UseQueryResult<T>
  value: (d: T) => React.ReactNode; foot: (d: T) => React.ReactNode
  onOpen?: () => void; openLabel?: string
}) {
  const d = query.data
  const ready = d !== undefined && !query.isError
  const cls = `fd-kpi${tone ? ` fd-kpi-${tone}` : ''}`
  const body = (
    <>
      <span className="fd-kpi-top">
        <span className="fd-kpi-ic" aria-hidden="true"><i className={`lni ${icon}`}></i></span>
        <span className="fd-kpi-lbl">{label}</span>
      </span>
      {query.isError ? (
        <>
          <span className="fd-kpi-num">—</span>
          <span className="fd-kpi-foot fd-kpi-err">
            Couldn’t load <button className="fd-link" onClick={() => query.refetch()}>Retry</button>
          </span>
        </>
      ) : d === undefined ? (
        <>
          <span className="fd-kpi-num"><span className="fd-skel" style={{ width: '60%' }} /></span>
          <span className="fd-kpi-foot"><span className="fd-skel" style={{ width: '45%' }} /></span>
        </>
      ) : (
        <>
          <span className="fd-kpi-num">{value(d)}</span>
          <span className="fd-kpi-foot">{foot(d)}</span>
        </>
      )}
      {ready && onOpen && <span className="sr-only">, open {openLabel}</span>}
    </>
  )
  return ready && onOpen
    ? <button type="button" className={`${cls} fd-kpi-btn`} onClick={onOpen}>{body}</button>
    : <div className={cls}>{body}</div>
}

// Severity of a Needs-attention list: red stops work today (no receipt
// book, a blocked bank in use, a rate never set), amber will soon, blue is
// for review only.
type AttTone = 'red' | 'amber' | 'blue'

const PAY_PILL: Record<string, string> = { Cash: 'pill-blue', Bank: 'pill-cyan', Online: 'pill-green', Cheque: 'pill-purple' }

// A large overpaid usually means a payment against the wrong currency's fee
// line; small ones are students paying ahead and aren't flagged.
const OVERPAID_FLAG_SHARE = 0.01

type Tab = 'trends' | 'discounts' | 'outstanding'
const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'trends', label: 'Collection Trends', icon: 'lni-stats-up' },
  { id: 'discounts', label: 'Discounts', icon: 'lni-offer' },
  { id: 'outstanding', label: 'Outstanding', icon: 'lni-pie-chart' },
]

type Breakdown = 'category' | 'method' | 'ledger' | 'cashier'
const BREAKDOWN_OPTIONS: { value: Breakdown; label: string }[] = [
  { value: 'category', label: 'Category' },
  { value: 'method', label: 'Method' },
  { value: 'ledger', label: 'Fee type' },
  { value: 'cashier', label: 'Cashier' },
]

// ── Page ───────────────────────────────────────────────────────────────────

export default function FinanceDashboardPage() {
  const router = useRouter()
  function nav(id: string) { router.push('/finance/' + id) }

  // Step 1: the app's current academic intake; with none set, the newest
  // intake from the dropdown.
  const currentIntakeQ = useCurrentAcademicIntake()
  const needDropdown = currentIntakeQ.isError || (currentIntakeQ.isSuccess && !currentIntakeQ.data)
  const intakesQ = useIntakesDropdown(needDropdown)
  const intake = useMemo(() => {
    if (currentIntakeQ.data) return currentIntakeQ.data
    const list = intakesQ.data ?? []
    return list.length ? list.reduce((a, b) => (b.intakeCode > a.intakeCode ? b : a)) : null
  }, [currentIntakeQ.data, intakesQ.data])
  const intakeGuid = intake?.intakeGuid ?? ''
  const intakeLoading = currentIntakeQ.isPending || (needDropdown && intakesQ.isPending)
  const intakeLabel = intake ? `${intake.description} (${intake.intakeCode})` : ''

  // Step 2: everything in parallel.
  const summaryQ = useDashboardSummaryToday(intakeGuid)
  const outQ = useDashboardOutstanding(intakeGuid)
  const feesQ = useDashboardCollectionByFeeType(intakeGuid)
  const recentQ = useDashboardRecentPayments(intakeGuid, RECENT_LIMIT)
  const attQ = useDashboardAttention()

  // ── Analysis tabs ───────────────────────────────────────────────────────
  const [tab, setTab] = useState<Tab>('trends')
  const tabRefs = useRef<Partial<Record<Tab, HTMLButtonElement>>>({})
  const [indicator, setIndicator] = useState({ left: 0, width: 0 })
  useEffect(() => {
    const el = tabRefs.current[tab]
    if (el) setIndicator({ left: el.offsetLeft, width: el.offsetWidth })
  }, [tab, intakeGuid])

  // Trends + Discounts share a date range (default: this month so far).
  // Set after mount so the static export doesn't bake in the build date.
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [gran, setGran] = useState<Granularity>('day')
  const [perCurrency, setPerCurrency] = useState(false)
  const [breakdown, setBreakdown] = useState<Breakdown>('category')
  useEffect(() => {
    const now = new Date()
    setFrom(toYmd(new Date(now.getFullYear(), now.getMonth(), 1)))
    setTo(toYmd(now))
  }, [])

  const rangeError = from && to && from <= to && daysInclusive(from, to) > MAX_RANGE_DAYS ? `The date range cannot exceed ${MAX_RANGE_DAYS} days.` : ''
  const rangeOk = !!from && !!to && from <= to && !rangeError
  const collQ = useDashboardCollections(intakeGuid, from, to, gran === 'month' ? 'Month' : 'Day', rangeOk)
  const discQ = useDashboardDiscounts(intakeGuid, from, to, rangeOk)

  const queries = [summaryQ, outQ, feesQ, recentQ, attQ, collQ, discQ]
  const base = summaryQ.data?.baseCurrencyCode ?? outQ.data?.baseCurrencyCode ?? feesQ.data?.baseCurrencyCode
    ?? recentQ.data?.baseCurrencyCode ?? collQ.data?.baseCurrencyCode ?? discQ.data?.baseCurrencyCode ?? FALLBACK_BASE
  const hasMissingRates = !!(summaryQ.data?.hasMissingRates || outQ.data?.hasMissingRates || feesQ.data?.hasMissingRates
    || recentQ.data?.hasMissingRates || collQ.data?.hasMissingRates || discQ.data?.hasMissingRates)

  const trend = useMemo(() => buildTrend(collQ.data, from, to, gran), [collQ.data, from, to, gran])
  const trendTotal = trend.reduce((s, p) => s + p.total, 0)
  const trendCurrencies = useMemo(() => [...new Set((collQ.data?.trend ?? []).map(t => t.currencyCode))].sort(baseFirst(base)), [collQ.data, base])
  const trendSeries: Series[] = perCurrency
    ? trendCurrencies.map(c => ({ name: c === base ? c : `${c} (in ${base})`, color: curColor(c), values: trend.map(p => p.byCur[c] ?? 0) }))
    : [{ name: 'Net collected', color: 'var(--b500)', values: trend.map(p => p.total) }]

  // Live status for the header. "Live" is only true while both 60 s timers
  // run; a failed refresh stops its timer, so the page says it's paused.
  // Refresh is user-triggered only: invalidating re-fetches the active
  // queries and never wakes a disabled one.
  const queryClient = useQueryClient()
  const livePaused = summaryQ.isError || recentQ.isError
  const lastUpdated = Math.max(summaryQ.dataUpdatedAt, recentQ.dataUpdatedAt)
  const refreshing = queries.some(q => q.isFetching)
  function refreshAll() { queryClient.invalidateQueries({ queryKey: ['finance', 'dashboard'] }) }

  // KPI cards open the detail behind them.
  const recentRef = useRef<HTMLDivElement>(null)
  const analysisRef = useRef<HTMLDivElement>(null)
  function openOutstanding() { setTab('outstanding'); analysisRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }
  function openRecent() { recentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }

  // Payments that arrived since the last refresh get a brief highlight; the
  // first load of an intake highlights nothing.
  const seenRef = useRef<{ intake: string; keys: Set<string> } | null>(null)
  const [freshKeys, setFreshKeys] = useState<Set<string>>(new Set())
  useEffect(() => {
    const items = recentQ.data?.items
    if (!items) return
    const keys = items.map(payKey)
    const prev = seenRef.current
    seenRef.current = { intake: intakeGuid, keys: new Set(keys) }
    setFreshKeys(prev && prev.intake === intakeGuid ? new Set(keys.filter(k => !prev.keys.has(k))) : new Set())
  }, [recentQ.data, intakeGuid])

  const breakdownRows = useMemo(() => {
    const d = collQ.data
    if (!d) return []
    const receipts = (n: number) => `${fmtFull(n)} receipts`
    if (breakdown === 'category') return combine(d.byCategory, r => String(r.category), r => r.categoryName, r => r.netInBase, r => r.receiptCount).map(r => ({ ...r, sub: receipts(r.count) }))
    if (breakdown === 'method') return combine(d.byPayType, r => String(r.payType), r => (r.payType ? REPORT_PAYMODE_LABEL[r.payType] ?? r.payTypeName : r.payTypeName), r => r.netInBase, r => r.receiptCount).map(r => ({ ...r, sub: receipts(r.count) }))
    if (breakdown === 'ledger') return combine(d.topLedgers, r => `${r.category}:${r.ledgerGuid ?? r.ledgerName}`, r => r.ledgerName, r => r.grossInBase).map(r => ({ label: r.label, value: r.value }))
    return combine(d.byUser, r => r.userName, r => r.userName, r => r.netInBase, r => r.receiptCount).map(r => ({ ...r, sub: receipts(r.count) }))
  }, [collQ.data, breakdown])

  // ── Whole-page states ───────────────────────────────────────────────────

  // Step 8 / Access: without finance.dashboard.get every call is a 403 —
  // one message for the page instead of seven section errors.
  const noIntake = !intakeLoading && !intake

  if (queries.some(q => isForbidden(q.error))) {
    return (
      <div className="page active" id="page-finance-dashboard">
        <div className="pg-hdr"><div><div className="pg-title">Finance Dashboard</div></div></div>
        <div className="card">
          <div className="rpt-empty">
            <i className="lni lni-lock-alt" aria-hidden="true" />
            <div className="rpt-empty-title">You don’t have permission to view the Finance Dashboard</div>
            <div style={{ fontSize: 13 }}>Ask an administrator to give your role the “View Finance Dashboard” permission.</div>
          </div>
        </div>
      </div>
    )
  }

  const att = attQ.data
  const attCount = att ? att.lowReceiptBooks.length + att.categoriesWithoutActiveBook.length + att.missingExchangeRates.length + att.blockedBanks.length + att.recentChanges.length : 0
  const rateTone: AttTone = att?.missingExchangeRates.some(r => r.lastRateDate === null) ? 'red' : 'amber'
  const bookTone: AttTone = att?.categoriesWithoutActiveBook.length ? 'red' : 'amber'
  // Urgent = stops work today: a blocked bank in use, a receipt category with
  // no active book, or a currency that has never had a rate.
  const attUrgentCount = att ? att.blockedBanks.length + att.categoriesWithoutActiveBook.length + att.missingExchangeRates.filter(r => r.lastRateDate === null).length : 0

  return (
    <div className="page active" id="page-finance-dashboard">
      <div className="pg-hdr">
        <div>
          <div className="pg-title">Finance Dashboard</div>
          <div className="pg-sub">{intakeLabel ? `${intakeLabel} · ` : ''}Real-time overview of fee collection and student status</div>
        </div>
        <div className="fd-actions">
          {!noIntake && (
            <div className={`fd-status${livePaused ? ' paused' : ''}`} role="status">
              <span className="fd-pulse" aria-hidden="true" />
              <span>
                <strong>{livePaused ? 'Updates paused' : 'Live'}</strong>
                {lastUpdated > 0 && <> · {livePaused ? 'last' : 'updated'} {clock(lastUpdated)}</>}
              </span>
              <button type="button" className="fd-refresh" onClick={refreshAll} disabled={refreshing}
                aria-label="Refresh the dashboard" title={livePaused ? 'Refresh to resume' : 'Refresh now'}>
                <i className={`lni lni-reload${refreshing ? ' spin' : ''}`} aria-hidden="true" />
              </button>
            </div>
          )}
          <button className="btn btn-neu" onClick={() => nav('exchange-rates')}><i className="lni lni-world"></i> Exchange Rates</button>
          <button className="btn btn-primary btn-lg" onClick={() => nav('payment-console')}><i className="lni lni-credit-cards"></i> Collect Payment</button>
        </div>
      </div>

      {hasMissingRates && (
        <div className="fd-banner" role="status">
          <i className="lni lni-warning" aria-hidden="true"></i>
          <span>Some amounts could not be converted. Set the exchange rate.</span>
          <button className="fd-link" onClick={() => nav('exchange-rates')}>Set exchange rate <i className="lni lni-arrow-right"></i></button>
        </div>
      )}

      {noIntake ? (
        <div className="card">
          {currentIntakeQ.isError && intakesQ.isError ? (
            <Failed what="the intake" error={intakesQ.error} onRetry={() => { currentIntakeQ.refetch(); intakesQ.refetch() }} />
          ) : (
            <div className="rpt-empty">
              <i className="lni lni-calendar" aria-hidden="true" />
              <div className="rpt-empty-title">No intake is set up yet</div>
              <div style={{ fontSize: 13 }}>The dashboard shows figures for one academic intake. Add one in Intake Master.</div>
            </div>
          )}
        </div>
      ) : (
      <>
      {/* ── Headline figures (2×2 panel) beside Needs attention ── */}
      <div className="fd-top">
      <div className="card fd-kpis">
        <Kpi
          label="Collected Today" icon="lni-wallet" query={summaryQ} onOpen={openRecent} openLabel="Today’s payments"
          value={s => <Money value={s.currentInBase.net} cur={s.baseCurrencyCode} />}
          foot={s => {
            // Percent change: a dash when there's nothing to compare against.
            const prev = s.previousInBase.net
            const change = prev > 0 ? ((s.currentInBase.net - prev) / prev) * 100 : null
            const receipts = `${fmtFull(s.currentInBase.receiptCount)} ${s.currentInBase.receiptCount === 1 ? 'receipt' : 'receipts'}`
            return change === null
              ? <>{receipts} · <span title="Nothing collected yesterday to compare with">— vs yesterday</span></>
              : <>{receipts} · <span className={`fd-chg ${change >= 0 ? 'up' : 'dn'}`} title={`Yesterday ${s.baseCurrencyCode} ${fmtFull(prev)}`}>{change >= 0 ? '↑' : '↓'} {Math.abs(change).toFixed(0)}%</span> vs yesterday</>
          }}
        />
        <Kpi
          label="Students Fully Cleared" icon="lni-checkmark-circle" tone="green" query={outQ} onOpen={openOutstanding} openLabel="Clearance"
          value={o => fmtFull(o.clearedStudentCount)}
          foot={o => <>{pct(o.clearedStudentCount, o.studentCount).toFixed(0)}% of {fmtFull(o.studentCount)} students</>}
        />
        <Kpi
          label="Outstanding Balances" icon="lni-hourglass" tone="amber" query={outQ} onOpen={openOutstanding} openLabel="Breakdown"
          value={o => fmtFull(o.owingStudentCount)}
          foot={o => <><Money value={o.totalOutstandingInBase} cur={o.baseCurrencyCode} /> owed · {pct(o.owingStudentCount, o.studentCount).toFixed(0)}% of students</>}
        />
        <Kpi
          label="Access Blocked" icon="lni-lock-alt" tone="red" query={outQ} onOpen={openOutstanding} openLabel="Clearance"
          value={o => fmtFull(o.blockedStudentCount)}
          foot={o => <>Below {o.blockedBelowPercent}% clearance · {pct(o.blockedStudentCount, o.studentCount).toFixed(0)}% of students</>}
        />
      </div>

      {/* ── Needs attention: actionable, so beside the headline figures ── */}
      <div className="card fd-card fd-att-card">
        <div className="card-hdr">
          <div>
            <div className="card-title"><span className="ctitle-icon"><i className="lni lni-alarm"></i></span> Needs Attention</div>
            {att && attCount > 0 && (
              <div className="card-sub">
                {attUrgentCount > 0 && <><strong className="fd-att-urgent">{attUrgentCount} urgent</strong> · </>}
                {attCount} {attCount === 1 ? 'item' : 'items'} to review
              </div>
            )}
          </div>
        </div>
        <Section query={attQ} what="the attention list">
          {att => {
            const bookRows = att.lowReceiptBooks.length + att.categoriesWithoutActiveBook.length
            return attCount === 0 ? (
              <div className="fd-clear">
                <span className="fd-clear-ic"><i className="lni lni-checkmark"></i></span>
                Nothing needs attention
                <small>Rates, receipt books, banks and payment edits all look fine.</small>
              </div>
            ) : (
              <div className="fd-att">
                {att.blockedBanks.length > 0 && (
                  <AttentionGroup icon="lni-ban" tone="red" title="Blocked banks in use" note={`Payments in the last ${att.bankUsageDays} days`} count={att.blockedBanks.length}>
                    {att.blockedBanks.map(b => (
                      <AttRow key={b.shortCode} name={b.bankName} meta={`${fmtFull(b.recentPaymentCount)} ${b.recentPaymentCount === 1 ? 'payment' : 'payments'}`} flag={b.reason} flagTone="red" />
                    ))}
                  </AttentionGroup>
                )}
                {bookRows > 0 && (
                  <AttentionGroup icon="lni-book" tone={bookTone} title="Receipt books running low" count={bookRows} linkLabel="Receipt books" onLink={() => nav('receipt-books')}>
                    {att.categoriesWithoutActiveBook.map((c, i) => {
                      const name = typeof c === 'string' ? c : c.categoryName ?? 'Uncategorised'
                      return <AttRow key={`none-${name}-${i}`} name={name} meta="Cashiers can’t issue receipts" flag="No active book" flagTone="red" />
                    })}
                    {att.lowReceiptBooks.map(b => (
                      <AttRow key={b.receiptBookGuid} name={b.bookCode} meta={`${b.categoryName} · book of ${fmtFull(b.totalCount)}`}
                        flag={`${fmtFull(b.remaining)} left`} flagTone="amber" />
                    ))}
                  </AttentionGroup>
                )}
                {att.missingExchangeRates.length > 0 && (
                  <AttentionGroup icon="lni-world" tone={rateTone} title="Exchange rates not set today" count={att.missingExchangeRates.length} linkLabel="Set rates" onLink={() => nav('exchange-rates')}>
                    {att.missingExchangeRates.map(r => (
                      <AttRow key={r.currencyCode} name={r.currencyCode} sub={r.currencyName}
                        meta={r.lastRateDate ? `Last set ${fmtReportDate(r.lastRateDate)}` : 'No rate on record'}
                        flag={r.daysSinceLastRate === null ? 'Never set' : `${r.daysSinceLastRate} ${r.daysSinceLastRate === 1 ? 'day' : 'days'} old`}
                        flagTone={r.daysSinceLastRate === null ? 'red' : 'amber'} />
                    ))}
                  </AttentionGroup>
                )}
                {att.recentChanges.length > 0 && (
                  <AttentionGroup icon="lni-pencil" tone="blue" title="Payments edited or deleted" note={`Last ${att.changeDays} days`} count={att.recentChanges.length} linkLabel="Audit log" onLink={() => router.push('/activity-log')}>
                    {att.recentChanges.map((c, i) => {
                      const deleted = /delete/i.test(c.action)
                      return <AttRow key={c.timestamp + i} name={changeSummary(c.summary)} meta={`${c.userName} · ${fmtUtc(c.timestamp)}`} flag={deleted ? 'Deleted' : 'Edited'} flagTone={deleted ? 'red' : 'grey'} />
                    })}
                  </AttentionGroup>
                )}
              </div>
            )
          }}
        </Section>
      </div>
      </div>

      {/* ── Fee-type collection ── */}
      <div className="card fd-card">
        <div className="card-hdr">
          <div>
            <div className="card-title"><span className="ctitle-icon"><i className="lni lni-bar-chart"></i></span> Collection by Fee Type{intake ? ` — ${intake.description}` : ''}</div>
            <div className="card-sub">Collected against what was billed to date for this intake</div>
          </div>
          {feesQ.data && <span className="fd-updated" title="Recalculated by the server at most every 5 minutes">As of {hhmm(feesQ.data.generatedAt)}</span>}
        </div>

        <Section query={feesQ} what="fee-type collection" note="The first load can take a few seconds.">
          {fees => {
            // One group per fee type, one compact line per currency. The
            // group header carries the combined figure, from …InBase only.
            const groups: { feeType: number; name: string; rows: DashboardFeeType[] }[] = []
            for (const f of fees.feeTypes) {
              let g = groups.find(x => x.feeType === f.feeType)
              if (!g) groups.push(g = { feeType: f.feeType, name: f.feeTypeName, rows: [] })
              g.rows.push(f)
            }
            return (
              <>
                {groups.length === 0 ? (
                  <p className="fd-none">No fees billed for this intake yet.</p>
                ) : (
                  <div className="fd-fees">
                    {groups.map(g => {
                      const collectedInBase = g.rows.reduce((s, f) => s + f.collectedInBase, 0)
                      const payableInBase = g.rows.reduce((s, f) => s + f.expectedInBase - f.discountInBase, 0)
                      return (
                        <section key={g.feeType} className="fd-fee">
                          <div className="fd-fee-hd">
                            <h4 className="fd-fee-name">{g.name}</h4>
                            {g.feeType === FEE_TYPE_REGISTRATION && <span className="fd-fee-note">{fmtFull(fees.registeredCount)}/{fmtFull(fees.studentCount)} registered</span>}
                            {g.rows.length > 1 && (
                              <span className="fd-fee-sum">
                                <Money value={collectedInBase} cur={fees.baseCurrencyCode} /> of <Money value={payableInBase} cur={fees.baseCurrencyCode} />
                                <strong>{pct(collectedInBase, payableInBase).toFixed(1)}%</strong>
                              </span>
                            )}
                          </div>
                          <ul className="fd-fee-rows">
                            {g.rows.map(f => {
                              const rate = f.collectionRatePercent
                              const tone = rate === null ? 'var(--g300)' : rate >= 85 ? 'var(--green)' : rate >= 60 ? 'var(--b500)' : 'var(--amber)'
                              const flagOverpaid = f.overpaid > 0 && f.overpaid >= f.expected * OVERPAID_FLAG_SHARE
                              return (
                                <li key={f.currencyCode} className="fd-fee-row">
                                  <span className="fd-tag">{f.currencyCode}</span>
                                  <div className="fd-fee-track" role="progressbar" aria-valuenow={Math.round(rate ?? 0)} aria-valuemin={0} aria-valuemax={100} aria-label={`${f.feeTypeName} ${f.currencyCode} collected`}>
                                    <span style={{ width: `${Math.min(100, rate ?? 0)}%`, background: tone }} />
                                  </div>
                                  <span className="fd-fee-rate">{rate === null ? '—' : `${rate.toFixed(1)}%`}</span>
                                  <span className="fd-fee-amt">
                                    <span><strong>{fmtFull(f.collected)}</strong> of {fmtFull(f.expected)}</span>
                                    <span>{fmtFull(f.outstanding)} outstanding</span>
                                    {flagOverpaid && (
                                      <span className="fd-overpaid" title="Collected is capped at what is owed; the excess is shown separately">
                                        <i className="lni lni-warning" aria-hidden="true"></i> Overpaid {fmtFull(f.overpaid)}: check payments
                                      </span>
                                    )}
                                  </span>
                                </li>
                              )
                            })}
                          </ul>
                        </section>
                      )
                    })}
                  </div>
                )}

                {fees.regulatoryFees.length > 0 && (
                  <div className="fd-reg">
                    <span className="fd-reg-lbl">NCHE &amp; Guild collected</span>
                    {fees.regulatoryFees.map(r => (
                      <span key={r.category + r.currencyCode} className="fd-reg-item">{r.categoryName} <strong>{r.currencyCode} {fmtFull(r.collected)}</strong></span>
                    ))}
                    <span className="fd-reg-note">No target · receipts only</span>
                  </div>
                )}
              </>
            )
          }}
        </Section>
      </div>

      {/* ── Analysis: trends, discounts, outstanding ── */}
      <div className="card p-0 overflow-hidden fd-anchor" ref={analysisRef}>
        <div className="tab-bar" role="tablist" aria-label="Finance analysis">
          {TABS.map(t => {
            const active = tab === t.id
            return (
              <button key={t.id} type="button" role="tab" aria-selected={active}
                ref={el => { if (el) tabRefs.current[t.id] = el }}
                className={`tab-btn${active ? ' active' : ''}`} onClick={() => setTab(t.id)}>
                <i className={`lni ${t.icon}`} aria-hidden="true" /> {t.label}
              </button>
            )
          })}
          <span className="tab-indicator" style={{ left: indicator.left, width: indicator.width }} />
        </div>

        {(tab === 'trends' || tab === 'discounts') && (
          <div className="fd-toolbar">
            <div className="fd-field">
              <label className="lbl">From</label>
              <DatePicker value={from} onChange={setFrom} maxYmd={to || undefined} rangeMessage="From date can’t be after the to date" />
            </div>
            <div className="fd-field">
              <label className="lbl">To</label>
              <DatePicker value={to} onChange={setTo} minYmd={from || undefined} rangeMessage="To date can’t be before the from date" />
            </div>
            {tab === 'trends' && (
              <>
                <div className="fd-field fd-field-sm">
                  <label className="lbl">Group by</label>
                  <SearchSelect options={GRANULARITY_OPTIONS} value={gran} onChange={v => setGran((v || 'day') as Granularity)} />
                </div>
                <label className="fd-check">
                  <input type="checkbox" checked={perCurrency} onChange={e => setPerCurrency(e.target.checked)} /> Per currency
                </label>
              </>
            )}
            {rangeError && <span className="fd-toolbar-note fd-toolbar-err" role="alert">{rangeError}</span>}
            {tab === 'discounts' && (
              <button className="fd-link fd-toolbar-end" onClick={() => nav('reports/discount')}>Discount report <i className="lni lni-arrow-right"></i></button>
            )}
          </div>
        )}

        {tab === 'trends' && (
          <div key="trends" className="tab-panel-in">
            {!rangeOk ? (
              <p className="fd-none fd-panel">Pick a date range to see collections.</p>
            ) : (
              <Section query={collQ} what="collections">
                {() => (
                  <div className={`fd-panel fd-trends${collQ.isPlaceholderData ? ' fd-busy' : ''}`}>
                    <div className="min-w-0">
                      <PanelHead
                        title="Collected over time"
                        meta={trend.length ? <><strong>{base} {fmtFull(trendTotal)}</strong> in this range</> : undefined}
                        action={perCurrency && trendSeries.length > 0 ? (
                          <div className="fd-legend">{trendSeries.map(s => <span key={s.name}><span className="fd-key" style={{ background: s.color }} />{s.name}</span>)}</div>
                        ) : undefined}
                      />
                      <LineChart labels={trend.map(p => p.label)} series={trendSeries} cur={base} />
                    </div>
                    <div className="fd-side">
                      <PanelHead
                        title="Breakdown"
                        meta={breakdown === 'ledger' ? 'Top fee types, fee value before discount' : undefined}
                        action={<Segmented label="Break down collections by" value={breakdown} options={BREAKDOWN_OPTIONS} onChange={setBreakdown} />}
                      />
                      <BarList key={breakdown} rows={breakdownRows} cur={base} limit={8} noun={breakdown === 'cashier' ? 'cashiers' : 'rows'} color={breakdown === 'method' ? 'var(--cyan)' : 'var(--b500)'} />
                    </div>
                  </div>
                )}
              </Section>
            )}
          </div>
        )}

        {tab === 'discounts' && (
          <div key="discounts" className="tab-panel-in">
            {!rangeOk ? (
              <p className="fd-none fd-panel">Pick a date range to see discounts.</p>
            ) : (
              <Section query={discQ} what="discounts">
                {disc => {
                  const share = disc.percentOfTuitionGross
                  return (
                    <div className={`fd-panel fd-disc${discQ.isPlaceholderData ? ' fd-busy' : ''}`}>
                      <div className="fd-hero">
                        <div className="fd-hero-lbl">Total discount given</div>
                        <div className="fd-hero-num"><Money value={disc.totalDiscountInBase} cur={disc.baseCurrencyCode} /></div>
                        <div className="fd-hero-sub">{fmtFull(disc.discountedStudentCount)} students · {disc.byType.length} discount types</div>
                        <div className="fd-ratio">
                          <div className="fd-ratio-top"><span>Share of tuition fee value</span><strong>{share === null ? '—' : `${share.toFixed(1)}%`}</strong></div>
                          <div className="fd-ratio-track" role="meter" aria-valuenow={Math.round(share ?? 0)} aria-valuemin={0} aria-valuemax={100} aria-label="Discount as a share of tuition fee value">
                            <span style={{ width: `${share ?? 0}%` }} />
                          </div>
                          <div className="fd-ratio-scale"><span>0%</span><span>100%</span></div>
                        </div>
                      </div>
                      <div className="min-w-0">
                        <PanelHead title="By discount type" meta={`Share of ${disc.baseCurrencyCode} discount given in this range`} />
                        <ShareBar
                          ariaLabel="Discount by type"
                          format={v => <Money value={v} cur={disc.baseCurrencyCode} />}
                          parts={disc.byType.map((r, i) => ({ label: r.discountName, value: r.amountInBase, color: CAT[Math.min(i, CAT.length - 1)], sub: `${fmtFull(r.studentCount)} students` }))}
                        />
                      </div>
                    </div>
                  )
                }}
              </Section>
            )}
          </div>
        )}

        {tab === 'outstanding' && (
          <div key="outstanding" className="tab-panel-in">
            <Section query={outQ} what="outstanding balances" note="The first load can take a few seconds.">
              {out => {
                const ob = out.baseCurrencyCode
                // Blocked students owe on the current semester, so they're a subset of owing.
                const owingNotBlocked = Math.max(0, out.owingStudentCount - out.blockedStudentCount)
                const showSponsors = !(out.bySponsorCategory.length <= 1 && (out.bySponsorCategory[0]?.sponsorCategory ?? 'Not specified') === 'Not specified')
                return (
                  <>
                    <div className="fd-toolbar">
                      <span className="fd-toolbar-note">Includes balances from earlier semesters · Updated {hhmm(out.generatedAt)}</span>
                      <button className="fd-link fd-toolbar-end" onClick={() => nav('reports/outstanding')}>Outstanding report <i className="lni lni-arrow-right"></i></button>
                    </div>
                    <div className="fd-panel">
                      <PanelHead title="Student clearance" meta={`${fmtFull(out.studentCount)} students in this intake`} />
                      <ShareBar
                        inline
                        ariaLabel="Students by clearance"
                        format={v => fmtFull(v)}
                        parts={[
                          { label: 'Fully cleared', value: out.clearedStudentCount, color: 'var(--green)' },
                          { label: 'Owing, not blocked', value: owingNotBlocked, color: 'var(--amber)' },
                          { label: `Blocked · below ${out.blockedBelowPercent}%`, value: out.blockedStudentCount, color: 'var(--red)' },
                        ]}
                      />

                      <div className="fd-cols2">
                        <div className="min-w-0">
                          <PanelHead title="Total owed" meta={<><strong><Money value={out.totalOutstandingInBase} cur={ob} /></strong> in {ob}, at today’s rate</>} />
                          <ShareBar
                            ariaLabel="Outstanding by semester"
                            format={v => <Money value={v} cur={ob} />}
                            parts={[
                              { label: 'Current semester', value: out.currentOutstandingInBase, color: 'var(--fd-c1)' },
                              { label: 'Earlier semesters', value: out.previousOutstandingInBase, color: 'var(--fd-c2)' },
                            ]}
                          />
                          {out.byCurrency.length > 0 && (
                            <div className="fd-gap">
                              <PanelHead title="By currency" meta="In each currency’s own amounts" />
                              <ScrollTable className="fd-scroll">
                                <table>
                                  <thead>
                                    <tr><th>Cur.</th><th className="text-right" title="A student owing in two currencies is counted in both rows">Students owing</th><th className="text-right">Current sem.</th><th className="text-right">Earlier</th><th className="text-right">Total</th></tr>
                                  </thead>
                                  <tbody>
                                    {out.byCurrency.map(c => (
                                      <tr key={c.currencyCode}>
                                        <td><span className="badge badge-gold">{c.currencyCode}</span></td>
                                        <td className="text-right tabular-nums">{fmtFull(c.owingStudentCount)}</td>
                                        <td className="text-right tabular-nums">{fmtFull(c.outstanding)}</td>
                                        <td className="text-right tabular-nums">{fmtFull(c.previousOutstanding)}</td>
                                        <td className="text-right tabular-nums font-bold">{fmtFull(c.totalOutstanding)}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </ScrollTable>
                            </div>
                          )}
                          {showSponsors && (
                            <div className="fd-gap">
                              <PanelHead title="By sponsor category" />
                              <BarList cur={ob} color="var(--amber)" limit={5} noun="categories" rows={out.bySponsorCategory.map(s => ({ label: s.sponsorCategory, value: s.totalOutstandingInBase, sub: `${fmtFull(s.owingStudentCount)} of ${fmtFull(s.studentCount)} owing` }))} />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <PanelHead title="By programme" meta={`${fmtFull(out.byProgram.length)} programmes, highest balance first`} />
                          <BarList cur={ob} color="var(--amber)" limit={8} noun="programmes" rows={out.byProgram.map((p, i) => ({
                            label: p.programName ?? `Unknown programme ${i + 1}`, value: p.totalOutstandingInBase, sub: `${fmtFull(p.owingStudentCount)} students`,
                            // Owing, but only in a currency with no exchange rate: …InBase is 0.
                            unconverted: p.totalOutstandingInBase === 0 && p.owingStudentCount > 0,
                          }))} />
                        </div>
                      </div>
                    </div>
                  </>
                )
              }}
            </Section>
          </div>
        )}

      </div>

      {/* ── Recent payments ── */}
      <div className="card fd-anchor" ref={recentRef}>
        <div className="card-hdr">
          <div>
            <div className="card-title"><span className="ctitle-icon"><i className="lni lni-credit-cards"></i></span> Recent Payments — Today</div>
            {recentQ.data && recentQ.data.totalCount > recentQ.data.items.length && <div className="card-sub">Showing {recentQ.data.items.length} of {fmtFull(recentQ.data.totalCount)}</div>}
          </div>
          <button className="btn btn-neu btn-sm" onClick={() => nav('payment-history')}>View all <i className="lni lni-arrow-right"></i></button>
        </div>
        <Section query={recentQ} what="recent payments">
          {recent => recent.items.length === 0 ? (
            <p className="fd-none">No payments yet today.</p>
          ) : (
            <ScrollTable className="fd-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Receipt</th><th>Student</th><th>Programme</th><th>Fee Type</th>
                    <th className="text-right">Amount Paid</th><th>Cur.</th><th className="text-right">{recent.baseCurrencyCode} Value</th><th>Method</th><th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.items.map((p, i) => {
                    const method = p.payType ? REPORT_PAYMODE_LABEL[p.payType] ?? p.payTypeName : null
                    return (
                      <tr key={payKey(p) + i} className={freshKeys.has(payKey(p)) ? 'fd-new' : undefined}>
                        <td className="font-mono">{p.receipt ? <span className="text-blue font-bold">{p.receipt}</span> : <span className="text-muted">—</span>}</td>
                        <td>
                          <strong>{p.studentName ?? '—'}</strong>
                          {p.studentNumber && <div className="text-muted font-mono text-[length:var(--fs-xs)]">{p.studentNumber}</div>}
                        </td>
                        <td>{p.programName ?? <span className="text-muted">—</span>}</td>
                        <td>{p.feeTypes.join(', ')}</td>
                        <td className="text-right tabular-nums font-bold">{fmtFull(p.amount)}</td>
                        <td><span className="badge badge-gold">{p.currencyCode}</span></td>
                        <td className="text-right tabular-nums">{p.amountInBase === null ? <span className="text-muted" title="No exchange rate for this currency">—</span> : fmtFull(p.amountInBase)}</td>
                        <td>{method ? <span className={`pill ${PAY_PILL[p.payTypeName] ?? 'pill-blue'}`}>{method}</span> : <span className="badge badge-grey">Unclassified</span>}</td>
                        <td className="text-muted tabular-nums">{hhmm(p.entryTime)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </ScrollTable>
          )}
        </Section>
      </div>
      </>
      )}
    </div>
  )
}

function AttentionGroup({ icon, title, note, count, tone, linkLabel, onLink, children }: {
  icon: string; title: string; note?: string; count: number; tone: AttTone; linkLabel?: string; onLink?: () => void; children: React.ReactNode
}) {
  return (
    <section className={`fd-att-group fd-att-${tone}`}>
      <div className="fd-att-hd">
        <span className="fd-att-ic" aria-hidden="true"><i className={`lni ${icon}`}></i></span>
        <span className="fd-att-title">
          <span>{title} <span className="fd-att-count">{count}</span></span>
          {note && <small>{note}</small>}
        </span>
        {onLink && <button className="fd-link" onClick={onLink}>{linkLabel} <i className="lni lni-arrow-right"></i></button>}
      </div>
      <ul>{children}</ul>
    </section>
  )
}

// One item: what it is, one line of context, and a status chip on the right.
function AttRow({ name, sub, meta, flag, flagTone }: {
  name: string; sub?: string; meta: string; flag: string; flagTone: 'red' | 'amber' | 'grey'
}) {
  return (
    <li className="fd-att-row">
      <span className="fd-att-main">
        <span className="fd-att-name">{name}{sub && <span className="fd-att-sub">{sub}</span>}</span>
        <small>{meta}</small>
      </span>
      <span className={`fd-flag fd-flag-${flagTone}`}>{flag}</span>
    </li>
  )
}
