'use client'
import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'

type Opt = { value: string; label: string }

interface SearchSelectProps {
  options: (string | Opt)[]
  value?: string
  onChange?: (val: string) => void
  placeholder?: string
  className?: string
  style?: React.CSSProperties
}

function normalise(raw: (string | Opt)[]): Opt[] {
  return raw.map(o => (typeof o === 'string' ? { value: o, label: o } : o))
}

export function SearchSelect({
  options,
  value,
  onChange,
  placeholder,
  className,
  style,
}: SearchSelectProps) {
  const normalised = normalise(options)

  const controlled = value !== undefined
  const [internal, setInternal] = useState<string>(() =>
    placeholder !== undefined ? '' : (normalised[0]?.value ?? '')
  )
  const [open, setOpen]     = useState(false)
  const [search, setSearch] = useState('')
  const [pos, setPos]       = useState({ top: 0, left: 0, width: 0 })

  const triggerRef = useRef<HTMLButtonElement>(null)
  const dropRef    = useRef<HTMLDivElement>(null)
  const inputRef   = useRef<HTMLInputElement>(null)

  const current  = controlled ? value! : internal
  const selected = normalised.find(o => o.value === current)

  const visible = search.trim()
    ? normalised.filter(o => o.label.toLowerCase().includes(search.toLowerCase()))
    : normalised

  function openDrop() {
    if (triggerRef.current) {
      const r = triggerRef.current.getBoundingClientRect()
      setPos({ top: r.bottom + 4, left: r.left, width: r.width })
    }
    setOpen(true)
  }

  useEffect(() => {
    if (open) inputRef.current?.focus()
    else setSearch('')
  }, [open])

  useEffect(() => {
    if (!open) return
    function handle(e: MouseEvent) {
      const t = e.target as Node
      if (!triggerRef.current?.contains(t) && !dropRef.current?.contains(t))
        setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [open])

  function select(val: string) {
    if (controlled) onChange?.(val)
    else setInternal(val)
    setOpen(false)
  }

  const displayLabel = selected?.label ?? placeholder ?? (normalised[0]?.label ?? '')
  const isEmpty      = !selected && placeholder !== undefined

  return (
    <div style={{ position: 'relative', ...style }} className={className}>
      <button
        ref={triggerRef}
        type="button"
        className="ctrl ss-trigger"
        onClick={() => (open ? setOpen(false) : openDrop())}
      >
        <span className={isEmpty ? 'ss-placeholder' : ''}>{displayLabel}</span>
        <i
          className="lni lni-chevron-down ss-chevron"
          style={{ transform: open ? 'rotate(180deg)' : undefined }}
        />
      </button>

      {open && typeof window !== 'undefined' && createPortal(
        <div
          ref={dropRef}
          className="ss-drop"
          style={{ position: 'fixed', top: pos.top, left: pos.left, width: pos.width, zIndex: 9999 }}
        >
          <div className="ss-search">
            <input
              ref={inputRef}
              className="ctrl"
              style={{ fontSize: 12, height: 28, padding: '4px 8px' }}
              placeholder="Search…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => { if (e.key === 'Escape') setOpen(false) }}
              onClick={e => e.stopPropagation()}
            />
          </div>
          <div className="ss-opts">
            {visible.length === 0
              ? <div className="ss-no-match">No matches</div>
              : visible.map(o => (
                  <div
                    key={o.value}
                    className={`col-filter-opt${current === o.value ? ' fil-active' : ''}`}
                    onClick={() => select(o.value)}
                  >
                    {o.label}
                  </div>
                ))
            }
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
