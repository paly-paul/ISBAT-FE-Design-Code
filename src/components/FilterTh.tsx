'use client'
import { useState } from 'react'

interface FilterThProps {
  label: string
  opts: string[]
  isOpen: boolean
  activeFilter: string
  onToggle: (e: React.MouseEvent) => void
  onSelect: (val: string) => void
  onClear: () => void
}

export function FilterTh({ label, opts, isOpen, activeFilter, onToggle, onSelect, onClear }: FilterThProps) {
  const [search, setSearch] = useState('')

  const visible = search.trim()
    ? opts.filter(o => o.toLowerCase().includes(search.toLowerCase()))
    : opts

  function handleSelect(val: string) { onSelect(val); setSearch('') }
  function handleClear()             { onClear();       setSearch('') }

  return (
    <th className="filterable" onClick={onToggle}>
      {label}
      <i className={`lni lni-funnel th-fi${activeFilter ? ' fil-on' : ''}`} onClick={e => e.stopPropagation()} />
      {isOpen && (
        <div className="col-filter-drop" onClick={e => e.stopPropagation()}>
          <div style={{ padding: '6px 8px 4px' }}>
            <input
              className="ctrl"
              style={{ fontSize: 12, height: 28, padding: '4px 8px' }}
              placeholder={`Search ${label}…`}
              value={search}
              onChange={e => setSearch(e.target.value)}
              onClick={e => e.stopPropagation()}
              autoFocus
            />
          </div>
          <div className={`col-filter-opt${!activeFilter ? ' fil-active' : ''}`} onClick={handleClear}>
            All {label}
          </div>
          {visible.map(o => (
            <div key={o} className={`col-filter-opt${activeFilter === o ? ' fil-active' : ''}`}
                 onClick={() => handleSelect(o)}>
              {o}
            </div>
          ))}
          {visible.length === 0 && (
            <div style={{ padding: '6px 10px', fontSize: 12, color: 'var(--g400)', fontStyle: 'italic' }}>
              No matches
            </div>
          )}
        </div>
      )}
    </th>
  )
}
