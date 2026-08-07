import React, { useState, useEffect, useRef } from 'react'
import { SearchSelect } from '@/components/SearchSelect'

interface Props {
  value?: string // yyyy-mm-dd
  onChange: (ymd: string) => void
  placeholder?: string
  maxYmd?: string // optional max allowed date (yyyy-mm-dd)
  // Mirrors the app-wide "red border on the .ctrl element" validation
  // convention used by plain <input>s elsewhere — lets call sites keep that
  // same visual behavior after swapping from a native date input to this.
  hasError?: boolean
}

function pad(n: number) { return String(n).padStart(2, '0') }

function toDisplay(ymd?: string) {
  if (!ymd) return ''
  const [y, m, d] = ymd.split('-')
  if (!y || !m || !d) return ''
  return `${d}/${m}/${y}`
}

function ymdToDate(ymd?: string) {
  if (!ymd) return null
  const [y, m, d] = ymd.split('-').map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d)
}

function dateToYmd(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export default function DatePicker({ value, onChange, placeholder = 'dd/mm/yyyy', maxYmd, hasError }: Props) {
  const [open, setOpen] = useState(false)
  const [display, setDisplay] = useState<string>(toDisplay(value))
  const [viewDate, setViewDate] = useState<Date>(ymdToDate(value) ?? new Date())
  const ref = useRef<HTMLDivElement | null>(null)
  const [error, setError] = useState('')

  useEffect(() => setDisplay(toDisplay(value)), [value])
  useEffect(() => setViewDate(ymdToDate(value) ?? new Date()), [value])

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      const target = e.target as HTMLElement
      // The month/year SearchSelect dropdowns inside the calendar render via
      // a React portal straight onto document.body (see SearchSelect.tsx),
      // so a click on one of their options lands physically outside this
      // component's own wrapper div. Without this check, that "outside"
      // click closed the whole calendar before the month/year selection
      // ever registered.
      if (target.closest('.ss-drop')) return
      if (ref.current && !ref.current.contains(target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  function prevMonth() { const d = new Date(viewDate); d.setMonth(d.getMonth() - 1); setViewDate(d) }
  function nextMonth() { const d = new Date(viewDate); d.setMonth(d.getMonth() + 1); setViewDate(d) }

  function pick(day: number) {
    const d = new Date(viewDate)
    d.setDate(day)
    const ymd = dateToYmd(d)
    if (maxYmd) {
      const max = ymdToDate(maxYmd)!
      if (d.getTime() > max.getTime()) {
        setError('Date cannot be in the future')
        return
      }
    }
    setError('')
    onChange(ymd)
    setOpen(false)
  }

  function daysMatrix(): (number | null)[] {
    const year = viewDate.getFullYear()
    const month = viewDate.getMonth()
    const first = new Date(year, month, 1)
    const startDay = (first.getDay() + 6) % 7 // Monday=0
    const days = new Date(year, month + 1, 0).getDate()
    const cells: (number | null)[] = []
    for (let i = 0; i < startDay; i++) cells.push(null)
    for (let d = 1; d <= days; d++) cells.push(d)
    while (cells.length % 7 !== 0) cells.push(null)
    return cells
  }

  function onInputBlur() {
    const m = display.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
    if (m) {
      const [, dd, mm, yyyy] = m
      const ymd = `${yyyy}-${mm}-${dd}`
      if (maxYmd) {
        const sel = ymdToDate(ymd)!
        const max = ymdToDate(maxYmd)!
        if (sel.getTime() > max.getTime()) {
          setError('Date cannot be in the future')
          return
        }
      }
      setError('')
      onChange(ymd)
    } else if (!display) {
      onChange('')
    }
  }

  const monthName = viewDate.toLocaleString('en-GB', { month: 'long' })
  const year = viewDate.getFullYear()
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December']
  const currentYear = new Date().getFullYear()
  const yearRange = Array.from({ length: 41 }, (_, i) => currentYear - 20 + i)
  const monthOptions = months.map((m, idx) => ({ value: String(idx), label: m }))
  const yearOptions = yearRange.map(y => ({ value: String(y), label: String(y) }))

  return (
    <>
      <div style={{ position: 'relative', display: 'inline-block' }} ref={ref}>
      <div style={{ position: 'relative' }}>
        <input
          className="ctrl"
          type="text"
          placeholder={placeholder}
          value={display}
          onChange={e => setDisplay(e.target.value)}
          onBlur={onInputBlur}
          onFocus={() => setOpen(false)}
          style={{ minWidth: 120, paddingRight: 30, borderColor: hasError ? 'var(--red)' : undefined }}
        />
        <button
          type="button"
          onClick={() => setOpen(v => !v)}
          aria-label="Open calendar"
          style={{
            position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 22, height: 22, padding: 0, border: 'none', background: 'transparent',
            cursor: 'pointer', color: 'var(--g500)', fontSize: 14, lineHeight: 1,
          }}
        >
          📅
        </button>
      </div>

      {open && (
        <div style={{ position: 'absolute', zIndex: 60, marginTop: 6, boxShadow: '0 6px 18px rgba(0,0,0,0.12)', background: 'white', borderRadius: 8 }}>
          <div style={{ padding: 6, minWidth: 220 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <button type="button" className="btn btn-neu btn-sm" onClick={prevMonth} style={{ padding: '4px 6px' }}>{'<'}</button>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 130 }}>
                  <SearchSelect
                    options={monthOptions}
                    value={String(viewDate.getMonth())}
                    onChange={v => setViewDate(new Date(viewDate.getFullYear(), Number(v), 1))}
                    placeholder={months[viewDate.getMonth()]}
                  />
                </div>
                <div style={{ width: 96 }}>
                  <SearchSelect
                    options={yearOptions}
                    value={String(viewDate.getFullYear())}
                    onChange={v => setViewDate(new Date(Number(v), viewDate.getMonth(), 1))}
                    placeholder={String(viewDate.getFullYear())}
                  />
                </div>
              </div>
              <button type="button" className="btn btn-neu btn-sm" onClick={nextMonth} style={{ padding: '4px 6px' }}>{'>'}</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, textAlign: 'center', marginBottom: 6, color: '#666', fontSize: 11 }}>
              {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => <div key={d}>{d}</div>)}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
              {daysMatrix().map((cell, i) => {
                if (cell === null) return <div key={i} />
                const selDate = value && ymdToDate(value)
                const selected = selDate && selDate.getFullYear() === viewDate.getFullYear() && selDate.getMonth() === viewDate.getMonth() && selDate.getDate() === cell
                const cellDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), cell as number)
                const disabled = !!maxYmd && !!ymdToDate(maxYmd) && cellDate.getTime() > ymdToDate(maxYmd)!.getTime()
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => { if (!disabled) pick(cell as number) }}
                    disabled={disabled}
                    aria-disabled={disabled}
                    style={{ padding: 6, borderRadius: 6, background: selected ? '#0b5cff' : 'transparent', color: selected ? 'white' : (disabled ? '#bbb' : '#111'), border: 'none', fontSize: 13, opacity: disabled ? 0.6 : 1 }}
                  >
                    {cell}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
      </div>
      {error && <div style={{ color: '#dc2626', fontSize: 12, marginTop: 6 }}>{error}</div>}
    </>
  )
}
