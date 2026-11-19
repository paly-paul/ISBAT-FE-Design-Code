'use client'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useInfiniteQuery } from '@tanstack/react-query'
import { PaginatedItems, getNextPageParam } from '@/lib/pagination'

// A header column filter whose options are loaded from the server as the
// list is scrolled (and searched as you type), instead of a fixed list —
// for tables paged on the server, where the rows on screen don't hold every
// value. Single-select: picking an option applies it straight away. Same
// look as FilterTh (the col-filter-* styles).
export function LazyFilterTh<T>({ label, isOpen, onToggle, onClose, value, onSelect, onClear, queryKey, fetchPage, toValue, pageSize = 20 }: {
  label: string
  isOpen: boolean
  onToggle: (e: React.MouseEvent) => void
  onClose: () => void
  // The applied value, or null when the column isn't filtered.
  value: string | null
  onSelect: (value: string) => void
  onClear: () => void
  // Distinguishes this option list in the query cache.
  queryKey: readonly unknown[]
  fetchPage: (page: number, pageSize: number, search: string) => Promise<PaginatedItems<T>>
  // The option text for a row; blank values are skipped and repeats merged.
  toValue: (row: T) => string | null | undefined
  pageSize?: number
}) {
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [pos, setPos] = useState({ top: 0, left: 0, minWidth: 0 })
  const thRef = useRef<HTMLTableCellElement>(null)

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 300)
    return () => clearTimeout(t)
  }, [searchInput])

  useEffect(() => {
    if (isOpen && thRef.current) {
      const r = thRef.current.getBoundingClientRect()
      setPos({ top: r.bottom + 4, left: r.left, minWidth: Math.max(r.width, 210) })
    }
    if (!isOpen) { setSearchInput(''); setSearch('') }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    function updatePos() {
      if (!thRef.current) return
      const r = thRef.current.getBoundingClientRect()
      setPos({ top: r.bottom + 4, left: r.left, minWidth: Math.max(r.width, 210) })
    }
    function onScroll() { requestAnimationFrame(updatePos) }
    const observer = new IntersectionObserver(([entry]) => { if (!entry.isIntersecting) onClose() }, { threshold: 0 })
    if (thRef.current) observer.observe(thRef.current)
    document.addEventListener('scroll', onScroll, true)
    return () => {
      document.removeEventListener('scroll', onScroll, true)
      observer.disconnect()
    }
  }, [isOpen, onClose])

  const query = useInfiniteQuery({
    queryKey: [...queryKey, 'lazy-filter', search, pageSize],
    queryFn: ({ pageParam }) => fetchPage(pageParam, pageSize, search),
    initialPageParam: 1,
    getNextPageParam,
    enabled: isOpen,
    staleTime: Infinity,
  })

  const options: string[] = []
  const seen = new Set<string>()
  for (const p of query.data?.pages ?? []) {
    for (const row of p.items) {
      const v = toValue(row)?.trim()
      if (!v || v === '-' || v === '—' || seen.has(v.toLowerCase())) continue
      seen.add(v.toLowerCase())
      options.push(v)
    }
  }

  // Next page once the list is scrolled near its end. scrollTop > 0 so the
  // browser's own scroll events on content changes don't chain-load pages.
  function onListScroll(e: React.UIEvent<HTMLDivElement>) {
    const el = e.currentTarget
    if (!query.hasNextPage || query.isFetchingNextPage) return
    if (el.scrollTop > 0 && el.scrollHeight - el.scrollTop - el.clientHeight < 40) query.fetchNextPage()
  }

  const isActive = !!value

  return (
    <th ref={thRef} className={`filterable${isActive ? ' th-active' : ''}`} onClick={onToggle}>
      {label}
      <i className={`lni lni-funnel th-fi${isActive ? ' fil-on' : ''}`} onClick={onToggle} />

      {isOpen && createPortal(
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 9998 }} onClick={e => { e.stopPropagation(); onClose() }} />
          <div
            className="col-filter-drop"
            style={{ position: 'fixed', top: pos.top, left: pos.left, minWidth: pos.minWidth, zIndex: 9999, padding: 0 }}
            onClick={e => e.stopPropagation()}
            role="dialog"
            aria-label={`Filter by ${label}`}
          >
            <div className="col-filter-search">
              <input
                className="ctrl"
                style={{ fontSize: 12, height: 28, padding: '4px 8px' }}
                placeholder={`Search ${label}…`}
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                autoFocus
              />
            </div>

            <div className="col-filter-opts" onScroll={onListScroll}>
              {query.isLoading ? (
                <div className="col-filter-no-match">Loading…</div>
              ) : query.isError ? (
                <div className="col-filter-no-match">Couldn&apos;t load {label.toLowerCase()} options</div>
              ) : options.length === 0 ? (
                <div className="col-filter-no-match">No matches</div>
              ) : options.map(o => (
                <label key={o} className={`col-filter-opt-row${o === value ? ' fil-active' : ''}`}>
                  <input type="radio" name={`lazy-filter-${label}`} checked={o === value} onChange={() => onSelect(o)} />
                  {o}
                </label>
              ))}
              {query.isFetchingNextPage && <div className="col-filter-no-match">Loading more…</div>}
            </div>

            <div className="col-filter-footer">
              <button className="col-filter-btn col-filter-btn-reset" onClick={onClear} disabled={!isActive}>Reset</button>
              <button className="col-filter-btn col-filter-btn-cancel" onClick={onClose}>Close</button>
            </div>
          </div>
        </>,
        document.body,
      )}
    </th>
  )
}
