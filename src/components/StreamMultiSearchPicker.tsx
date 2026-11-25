'use client'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useSpecializationsDropdown } from '@/hooks/config/useStreams'

interface StreamMultiSearchPickerProps {
  value: string[]
  // Names of already-saved picks the dropdown may not list, by guid.
  savedNames?: Record<string, string>
  onChange: (vals: string[]) => void
  placeholder?: string
  className?: string
  style?: React.CSSProperties
}

// Multi-pick sibling of ProgramSearchPicker/IntakeSearchPicker/
// FacultySearchPicker (2026-09-10) — same closed-button/portal-dropdown
// chrome, but checkbox-driven like MultiSelect (reusing its
// .col-filter-select-all/.col-filter-opt-row rows) instead of single-select.
// Lists GET /specializations/dropdown (one cached call, filtered here).
export function StreamMultiSearchPicker({ value, onChange, savedNames, placeholder = '— Select specialization(s) —', className, style }: StreamMultiSearchPickerProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [pos, setPos] = useState<{ top?: number; bottom?: number; left: number; width: number; maxHeight: number }>({ top: 0, left: 0, width: 0, maxHeight: 200 })

  const triggerRef = useRef<HTMLButtonElement>(null)
  const dropRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const optsRef = useRef<HTMLDivElement>(null)

  function calcPos() {
    if (!triggerRef.current) return
    const r = triggerRef.current.getBoundingClientRect()
    const spaceBelow = window.innerHeight - r.bottom - 10
    const spaceAbove = r.top - 10
    if (spaceBelow < 200 && spaceAbove > spaceBelow) {
      setPos({ bottom: window.innerHeight - r.top + 4, left: r.left, width: r.width, maxHeight: Math.min(spaceAbove - 40, 300) })
    } else {
      setPos({ top: r.bottom + 4, left: r.left, width: r.width, maxHeight: Math.min(spaceBelow - 40, 300) })
    }
  }

  function openDrop() {
    calcPos()
    setOpen(true)
  }

  useEffect(() => {
    if (open) {
      inputRef.current?.focus()
    } else {
      setSearch('')
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    function handle(e: MouseEvent) {
      const t = e.target as Node
      if (!triggerRef.current?.contains(t) && !dropRef.current?.contains(t)) setOpen(false)
    }
    function updatePos() { calcPos() }
    function onScroll() { requestAnimationFrame(updatePos) }
    document.addEventListener('mousedown', handle)
    document.addEventListener('scroll', onScroll, true)
    return () => {
      document.removeEventListener('mousedown', handle)
      document.removeEventListener('scroll', onScroll, true)
    }
  }, [open])

  const { data, isFetching, isError } = useSpecializationsDropdown(open || value.length > 0)
  const all = (data ?? []).map(s => ({ guid: s.guid || s.streamGuid || '', name: s.name || s.streamName || '' }))
  const query = search.trim().toLowerCase()
  const items = query ? all.filter(s => s.name.toLowerCase().includes(query)) : all

  function toggleOne(guid: string) {
    onChange(value.includes(guid) ? value.filter(v => v !== guid) : [...value, guid])
  }

  const allLoadedChecked = items.length > 0 && items.every(s => value.includes(s.guid))
  function toggleAllLoaded() {
    if (allLoadedChecked) onChange(value.filter(v => !items.some(s => s.guid === v)))
    else onChange([...new Set([...value, ...items.map(s => s.guid)])])
  }

  const isEmpty = value.length === 0
  const displayLabel = isEmpty
    ? placeholder
    : value.length === 1
      ? all.find(s => s.guid === value[0])?.name || savedNames?.[value[0]] || '1 selected'
      : `${value.length} selected`

  return (
    <div style={{ position: 'relative', ...style }} className={className}>
      <button
        ref={triggerRef}
        type="button"
        className="ctrl ss-trigger"
        onClick={() => (open ? setOpen(false) : openDrop())}
      >
        <span className={`ss-label${isEmpty ? ' ss-placeholder' : ''}`}>{displayLabel}</span>
        {!isEmpty && (
          <span
            role="button"
            tabIndex={0}
            className="ss-clear"
            title="Clear all"
            aria-label="Clear all"
            onClick={e => { e.stopPropagation(); onChange([]) }}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); onChange([]) }
            }}
          >
            <i className="lni lni-close" />
          </span>
        )}
        <i
          className="lni lni-chevron-down ss-chevron"
          style={{ transform: open ? 'rotate(180deg)' : undefined }}
        />
      </button>

      {open && typeof window !== 'undefined' && createPortal(
        <div
          ref={dropRef}
          className="ss-drop"
          style={{ position: 'fixed', top: pos.top, bottom: pos.bottom, left: pos.left, minWidth: pos.width, width: 'max-content', maxWidth: Math.max(pos.width, 360), zIndex: 9999 }}
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
          {items.length > 0 && (
            <label className="col-filter-select-all">
              <input type="checkbox" checked={allLoadedChecked} onChange={toggleAllLoaded} />
              Select All{query ? ' Matching' : ''}
            </label>
          )}
          <div className="ss-opts" ref={optsRef} style={{ maxHeight: pos.maxHeight }}>
            {isFetching && items.length === 0 ? (
              <div className="ss-no-match">Searching…</div>
            ) : isError ? (
              <div className="ss-no-match"><i className="lni lni-warning"></i> Search failed. Please try again.</div>
            ) : items.length === 0 ? (
              <div className="ss-no-match">{query ? 'No matching specializations.' : 'No specializations available.'}</div>
            ) : (
              <>
                {items.map(s => (
                  <label
                    key={s.guid}
                    className={`col-filter-opt-row${value.includes(s.guid) ? ' fil-active' : ''}`}
                  >
                    <input type="checkbox" checked={value.includes(s.guid)} onChange={() => toggleOne(s.guid)} />
                    {s.name}
                  </label>
                ))}
              </>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
