'use client'
import { useEffect, useRef, useState } from 'react'

export interface TableSearchResult {
  id: string
  primary: string
  secondary?: string
}

interface TableSearchProps {
  value: string
  onChange: (value: string) => void
  // Caller still owns the actual match logic (each table's searchable
  // fields differ) — this component only owns the open/close behavior and
  // dropdown rendering, capped to whatever list the caller passes in.
  results: TableSearchResult[]
  // Defaults to filling the input with the picked result's `primary` text
  // (narrowing the table to just that row via the caller's own filter).
  onSelect?: (result: TableSearchResult) => void
  placeholder?: string
  className?: string
  emptyLabel?: string
  // Set while the caller's own `results` source is still being fetched (e.g.
  // a page that only loads its full, unpaginated list once a search term is
  // typed) — shows a "Searching…" row instead of `emptyLabel`, so an
  // still-loading list doesn't briefly read as a genuine zero-match result.
  loading?: boolean
  // Minimum trimmed-length before the dropdown opens at all — lets a caller
  // whose search hits the backend (rather than filtering an already-loaded
  // list) avoid popping open a "No matches" dropdown on every single
  // keystroke. Defaults to 1 (any non-empty input opens it), matching every
  // existing caller's behavior.
  minChars?: number
}

// Search-by-code/name input + live "as you type" results dropdown, meant to
// sit above a master-data table. Reused across pages so the outside-click
// close behavior doesn't need to be copy-pasted (and re-wired into each
// page's own document click listener) every time.
export function TableSearch({
  value,
  onChange,
  results,
  onSelect,
  placeholder = 'Search…',
  className,
  emptyLabel = 'No matches',
  loading = false,
  minChars = 1,
}: TableSearchProps) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handle(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [open])

  function select(r: TableSearchResult) {
    if (onSelect) onSelect(r)
    else onChange(r.primary)
    setOpen(false)
  }

  return (
    <div ref={wrapRef} className={`inp-wrap${className ? ` ${className}` : ''}`}>
      <span className="inp-icon"><i className="lni lni-search-alt"></i></span>
      <input
        className="ctrl"
        placeholder={placeholder}
        value={value}
        onChange={e => { onChange(e.target.value); setOpen(true) }}
        onFocus={() => { if (value.trim().length >= minChars) setOpen(true) }}
      />
      {open && value.trim().length >= minChars && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-g200 rounded-lg shadow-lg z-20 max-h-56 overflow-y-auto">
          {loading
            ? <div className="p-3 text-sm text-g400 flex items-center gap-2"><i className="lni lni-reload animate-spin"></i> Searching…</div>
            : results.length === 0
            ? <div className="p-3 text-sm text-g400">{emptyLabel}</div>
            : results.map(r => (
                <button
                  key={r.id}
                  type="button"
                  className="w-full text-left px-4 py-2 text-sm hover:bg-b50 flex justify-between gap-3"
                  onClick={() => select(r)}
                >
                  <span className="font-medium text-g800">{r.primary}</span>
                  {r.secondary && <span className="text-g500 truncate">{r.secondary}</span>}
                </button>
              ))
          }
        </div>
      )}
    </div>
  )
}
